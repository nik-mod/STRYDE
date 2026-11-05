import { Shell } from "@/components/Shell";
export const metadata = { title: "FAQ" };
const QA: [string, string][] = [
  [
    "How much is a pair?",
    "Every STRYDE pair is $140.00. Shipping is calculated at checkout: standard $9, express $19.",
  ],
  [
    "Which sizes do you carry?",
    "EU 40–43 on every pair. See the size guide for conversions and fit notes.",
  ],
  [
    "How do I track my order?",
    "Use the order tracking page with your order number and the email from checkout. Signed-in customers also see every order under Account → Orders.",
  ],
  [
    "Can I return a pair?",
    "Returns follow the returns policy — unworn pairs in original condition within 30 days. Start from your account or the tracking page.",
  ],
  [
    "Do you ship worldwide?",
    "Checkout currently ships to Georgia, the United States, the United Kingdom, Germany, France, Italy, Spain and the Netherlands.",
  ],
  [
    "Is checkout real?",
    "This is the local development store: payments run in test mode with test cards, no money moves and nothing ships. Confirmation and confirmation emails say exactly that.",
  ],
  [
    "How do I use a promo code?",
    "Enter it in your bag or at checkout and the discount is applied to your order before payment.",
  ],
  [
    "Where is my confirmation email?",
    "In this development setup confirmation emails are written to the local email outbox (.data/emails) instead of being sent. Your order itself is always real in the store database.",
  ],
];
export default function Faq() {
  return (
    <Shell>
      <section className="commerce-panel">
        <h1>Questions, answered.</h1>
        {QA.map(([question, answer]) => (
          <details key={question} className="studio-photo-details">
            <summary>{question}</summary>
            <div>
              <p>{answer}</p>
            </div>
          </details>
        ))}
        <p>
          Something else? <a href="/pages/contact">Contact us ↗</a>
        </p>
      </section>
    </Shell>
  );
}
