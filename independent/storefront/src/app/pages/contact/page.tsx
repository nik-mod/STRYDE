import { Shell } from "@/components/Shell";
import { CareNavigation } from "@/components/CareNavigation";
import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Arrow } from "@/components/Information";
import { contactConfig, createContactService, publicContactEmail } from "@/lib/contact-server";
export const metadata: Metadata = { title: "Contact", description: "Questions about a pair or the store? Contact STRYDE." };
export default function Contact() {
  const config = contactConfig(), email = publicContactEmail();
  return (
    <Shell>
      <div className="information-page contact-page" data-information>
        <CareNavigation/>
        <div className="contact-layout">
          <header className="contact-introduction"><h1>Contact<br /><em>STRYDE.</em></h1><p>Ask us about a sneaker, sizing, or an order.</p></header>
          <div className="contact-form-panel"><ContactForm ready={config.ready} initialToken={createContactService().token()} /></div>
          <aside className="contact-context" data-info-reveal><h2>What to include</h2><p>For a product question, include the model and colorway. For an order enquiry, include your order reference if you have one.</p>{email ? <a className="information-back" href={`mailto:${email}`}>{email}<Arrow diagonal /></a> : <p className="contact-business-note">Business contact details and the registered address will be published before commercial sales open.</p>}<nav aria-label="Customer care"><a href="/policies/shipping">Shipping information <Arrow diagonal /></a><a href="/policies/returns">Returns information <Arrow diagonal /></a></nav></aside>
        </div>
      </div>
    </Shell>
  );
}
