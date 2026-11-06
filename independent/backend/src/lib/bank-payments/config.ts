export type Bank = "tbc" | "bog";
export interface BankOptions {
  bank: Bank;
  mode: "sandbox";
  clientId: string;
  clientSecret: string;
  apiKey?: string;
  currencies: string[];
  callbackUrl: string;
  returnUrl: string;
}

export function httpsUrl(value: unknown): string {
  if (typeof value !== "string") throw new Error("Payment URL is required");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.hash)
    throw new Error("Payment URLs must use HTTPS without credentials or fragments");
  return url.href;
}

// Bank-issued SANDBOX credentials only at this stage. These flags cannot open
// production checkout. Merchant certification and storefront integration come next.
export function bankOptions(bank: Bank, env = process.env): BankOptions | undefined {
  const prefix = bank.toUpperCase();
  const mode = env[`${prefix}_PAYMENT_MODE`];
  if (!mode || mode === "disabled") return undefined;
  if (mode !== "sandbox" || env.NODE_ENV === "production")
    throw new Error(`${prefix}: live payment activation requires bank certification`);
  const required = (key: string) => {
    const value = env[key]?.trim();
    if (!value) throw new Error(`Missing payment configuration: ${key}`);
    return value;
  };
  const allowed = bank === "tbc" ? ["GEL", "USD", "EUR"] : ["GEL", "USD", "EUR", "GBP"];
  const currencies = required(`${prefix}_PAYMENT_CURRENCIES`).split(",").map(c => c.trim().toUpperCase());
  if (!currencies.length || currencies.some(c => !allowed.includes(c)))
    throw new Error(`${prefix}: unsupported payment currency`);
  const backend = new URL(httpsUrl(required("PAYMENT_BACKEND_ORIGIN")));
  if (backend.pathname !== "/" || backend.search)
    throw new Error("PAYMENT_BACKEND_ORIGIN must contain only an HTTPS origin");
  return {
    bank, mode: "sandbox", currencies: [...new Set(currencies)],
    clientId: required(`${prefix}_CLIENT_ID`),
    clientSecret: required(`${prefix}_CLIENT_SECRET`),
    ...(bank === "tbc" ? { apiKey: required("TBC_API_KEY") } : {}),
    callbackUrl: new URL(`/hooks/stryde-payments/${bank}`, backend).href,
    returnUrl: httpsUrl(required("PAYMENT_RETURN_URL")),
  };
}

export function bankProviderModules(env = process.env) {
  return (["tbc", "bog"] as const).flatMap(bank => {
    const options = bankOptions(bank, env);
    return options ? [{ resolve: `./src/modules/payment-${bank}`, id: bank, options }] : [];
  });
}

export function sandboxBankSessionAllowed(body: unknown, env = process.env): boolean {
  if (env.NODE_ENV === "production" || env.STRYDE_TEST_MODE !== "true" || !body || typeof body !== "object") return false;
  const input = body as Record<string, unknown>;
  const bank = input.provider_id === "pp_tbc_tbc" ? "tbc" : input.provider_id === "pp_bog_bog" ? "bog" : undefined;
  // All card-session inputs come from the Medusa collection total, not a caller.
  if (!bank || Object.keys(input).some(key => key !== "provider_id")) return false;
  try { return !!bankOptions(bank, env); } catch { return false; }
}
