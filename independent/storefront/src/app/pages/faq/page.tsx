import { Shell } from "@/components/Shell";
import { CustomerPage } from "@/components/CustomerPage";
import { FaqAccordion, type FaqGroup } from "@/components/FaqAccordion";
import { Arrow } from "@/components/Information";
export const metadata = { title: "FAQ" };
const groups: FaqGroup[] = [
  { id: "orders", title: "Orders & payments", questions: [
    { question: "Can I place a real order?", answer: <p>Commercial checkout is not open. The local development store uses test payments: no real money moves and no shipment is created. Production payments still require merchant and payment-provider setup.</p> },
    { question: "Where do I find prices and available sizes?", answer: <p>Check the exact pair in the <a href="/collections/all">collection</a>. Prices and stock in the local test store are development data, not finalized commercial offers. Availability can differ between products.</p> },
    { question: "How do I use a promo code?", answer: <p>Enter a configured code in your bag or at test checkout. A valid discount appears in the order summary before you complete the test order; an invalid code should not change the total.</p> },
    { question: "Where is my confirmation email?", answer: <p>Development confirmations are recorded in a local email outbox. They are not delivered to a customer inbox. Live customer emails need a configured sending service.</p> },
  ] },
  { id: "delivery", title: "Shipping & tracking", questions: [
    { question: "How can I check an order?", answer: <p><a href="/orders/track">Look up an order</a> after signing in to the account that placed it. Order status comes from the store database. It is separate from live carrier tracking, which is not connected yet.</p> },
    { question: "Do you ship worldwide?", answer: <p>Worldwide commercial shipping is not enabled. Destinations, carrier arrangements, rates, customs and delivery estimates still need approval. Test checkout destinations and rates are not a shipping promise. See <a href="/policies/shipping">shipping information</a>.</p> },
  ] },
  { id: "fit", title: "Sizing & returns", questions: [
    { question: "Do all pairs fit the same?", answer: <p>No universal fit has been verified across the collection. Brand, model and sizing system matter. Use our <a href="/pages/size-guide">measurement guide</a>, then check a verified chart for the exact product before choosing a size.</p> },
    { question: "Can I return or exchange a pair?", answer: <p>The commercial return window, conditions, address and refund terms are awaiting approval. A 30-day return policy has not been confirmed. Read the current <a href="/policies/returns">returns information</a> before commercial sales open.</p> },
  ] },
];
export default function Faq() {
  return <Shell><CustomerPage title="Questions," accent="answered." introduction="From finding your fit to checking an order. A clear place to start.">
    <div className="customer-split faq-layout"><aside className="customer-aside"><nav aria-label="FAQ topics">{groups.map(group => <a key={group.id} href={`#${group.id}`}>{group.title}<Arrow diagonal /></a>)}</nav><p className="customer-note">You’re viewing a development store. We’ll distinguish what works today from what is still being prepared.</p></aside><FaqAccordion groups={groups} /></div>
  </CustomerPage></Shell>;
}
