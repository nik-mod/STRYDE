import { Shell } from "@/components/Shell";
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
        <div className="contact-layout">
          <header className="contact-introduction"><h1>Let’s<br /><em>talk.</em></h1><p>A question about a pair.<br />A detail you want to know.<br />Start here.</p></header>
          <div className="contact-form-panel"><ContactForm ready={config.ready} initialToken={createContactService().token()} /></div>
          <aside className="contact-context" data-info-reveal><h2>A little context<br />goes a long way.</h2><p>For a product question, include the name of the pair and the detail you’re asking about. For an order enquiry, include your order reference if you have one.</p>{email ? <a className="information-back" href={`mailto:${email}`}>{email}<Arrow diagonal /></a> : <p className="contact-business-note">Business contact details and the registered address will be published before commercial sales open.</p>}<nav aria-label="Customer care"><a href="/policies/shipping">Shipping information <Arrow diagonal /></a><a href="/policies/returns">Returns information <Arrow diagonal /></a></nav></aside>
        </div>
      </div>
    </Shell>
  );
}
