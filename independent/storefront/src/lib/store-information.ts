export type PolicySection = { id: string; title: string; text: string; pending?: string[] };
export type StorePolicy = { title: string; introduction: string; sections: PolicySection[] };
export const storePolicies: Record<string, StorePolicy> = {
  returns: {
    title: "Returns", introduction: "The details to know before a pair comes back.",
    sections: [
      { id: "status", title: "Where things stand", text: "Commercial sales are not open yet. Test orders do not create shipments or charges. This page explains what is still being prepared; it is not a published commercial returns policy." },
      { id: "eligibility", title: "Return eligibility", text: "The merchant-approved conditions for returns have not been published.", pending: ["Return window and how it is measured", "Required product condition and packaging", "Excluded items and other exceptions"] },
      { id: "process", title: "Returning a pair", text: "The return address, request process and responsibility for return shipping costs must be confirmed before orders open." },
      { id: "refunds", title: "Refunds", text: "Refund methods, processing times, applicable costs and exceptions still require merchant approval. No refund timeline is promised here." },
    ],
  },
  shipping: {
    title: "Shipping", introduction: "From the store to your door. The details come first.",
    sections: [
      { id: "status", title: "Current availability", text: "International shipping is not enabled. Commercial checkout remains closed while delivery arrangements are finalized. Development shipping rates are test data." },
      { id: "destinations", title: "Destinations & carriers", text: "Service areas and carrier agreements have not been approved for commercial orders.", pending: ["Domestic delivery areas in Georgia", "International destinations", "Available carriers and services"] },
      { id: "costs", title: "Costs & delivery estimates", text: "Actual shipping rates, handling times, tracking arrangements and delivery estimates must be confirmed before checkout opens. The preview does not provide a shipping quote or a delivery guarantee." },
      { id: "customs", title: "Duties & customs", text: "Responsibility for import duties, taxes, customs charges and clearance must be published for each supported market before international sales begin." },
    ],
  },
  privacy: {
    title: "Privacy", introduction: "Clear information about the details you share.",
    sections: [
      { id: "status", title: "This development store", text: "A production privacy notice is still being prepared. The business identity, contact details, processors, retention periods and applicable privacy rights must be published before launch. Use fictional details when testing checkout." },
      { id: "bag", title: "Your bag & test checkout", text: "An essential, signed bag cookie maintains your cart. Delivery information entered during test checkout is stored in the local commerce database. Test checkout does not charge you or create a shipment." },
      { id: "contact", title: "Contact messages", text: "The contact form requests a name, email address, subject and message. When email delivery is configured, these details are forwarded through the configured email provider to STRYDE’s designated inbox. The application does not save a separate copy of message contents. If delivery is unavailable, the form explains this and does not claim your message was sent." },
      { id: "completion", title: "Before public launch", text: "The merchant must complete and approve the privacy notice, including the handling of contact messages.", pending: ["Business identity and privacy contact", "Lawful purposes, service providers and international transfers", "Retention periods, user rights and how to exercise them", "Cookie information and any consent requirements"] },
    ],
  },
  terms: {
    title: "Terms", introduction: "A clear basis for shopping with STRYDE.",
    sections: [
      { id: "status", title: "A store in preparation", text: "This store is in development. Test products, prices and inventory are not commercial offers. No real payments are accepted. These preparation notes are not finalized terms of sale." },
      { id: "products", title: "Products & orders", text: "Business identity, merchandise identity and the terms governing pricing, availability and order acceptance must be reviewed and published before launch. Reference imagery is not evidence that a pair is available for sale." },
      { id: "payments", title: "Payment & fulfilment", text: "Commercial payment methods, shipping arrangements, cancellation conditions and return terms require approval before real orders can be placed." },
      { id: "rights", title: "Rights & responsibilities", text: "Applicable consumer rights, dispute handling and the remaining legal terms must be reviewed and published for the markets STRYDE will serve.", pending: ["Registered business and contact information", "Approved terms of sale", "Applicable consumer rights and dispute process"] },
    ],
  },
};
