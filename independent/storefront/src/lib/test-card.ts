import "server-only";
// Development-only card authorization, used while no bank adapter exists.
// The card is validated transiently in memory for a single request and is
// never persisted, logged or forwarded. Only the brand and last four digits
// are returned. No live bank connection exists and no money can move.
export interface TestCardInput {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}
export type TestCardResult =
  | { status: "succeeded"; brand: string; last4: string }
  | { status: "declined"; reason: string };
function luhnValid(digits: string) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = digits.charCodeAt(i) - 48;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}
function cardBrand(digits: string) {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(011|5)/.test(digits)) return "Discover";
  return "Card";
}
function expiryDate(expiry: string) {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return null;
  // Expiry runs to the end of the stated month.
  return { month, year, end: new Date(year, month, 1) };
}
export function authorizeTestCard(card: TestCardInput): TestCardResult {
  const digits = card.number.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits))
    return { status: "declined", reason: "Card number is invalid." };
  if (!luhnValid(digits))
    return { status: "declined", reason: "Card number is invalid." };
  const expiry = expiryDate(card.expiry);
  if (!expiry)
    return { status: "declined", reason: "Expiry must be in MM/YY format." };
  if (expiry.end.getTime() < Date.now())
    return { status: "declined", reason: "This card has expired." };
  if (expiry.year > new Date().getFullYear() + 20)
    return { status: "declined", reason: "Expiry year is too far ahead." };
  const cvcLength = cardBrand(digits) === "Amex" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvcLength}}$`).test(card.cvc.trim()))
    return {
      status: "declined",
      reason: `Security code must be ${cvcLength} digits.`,
    };
  if (!card.name.trim() || card.name.trim().length > 120)
    return { status: "declined", reason: "Cardholder name is required." };
  const last4 = digits.slice(-4);
  // Decline conventions mirror common sandbox behavior so the full decline
  // path can be exercised without any real provider.
  if (last4 === "0002")
    return { status: "declined", reason: "Your card was declined." };
  if (last4 === "9995")
    return { status: "declined", reason: "Insufficient funds." };
  if (last4 === "0069")
    return { status: "declined", reason: "This card has expired." };
  return { status: "succeeded", brand: cardBrand(digits), last4 };
}
