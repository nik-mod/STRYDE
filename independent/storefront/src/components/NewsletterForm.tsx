// No marketing provider is configured. Do not collect addresses or imply a subscription.
export function NewsletterForm() {
  return <div className="newsletter-form">
    <label htmlFor="newsletter-email">Email updates</label>
    <div className="newsletter-row"><input id="newsletter-email" type="email" placeholder="Your email address" autoComplete="email" disabled aria-describedby="newsletter-note" /><button type="button" disabled>Coming soon</button></div>
    <p id="newsletter-note">Signup opens when our email service is connected. No addresses are collected yet.</p>
  </div>;
}
