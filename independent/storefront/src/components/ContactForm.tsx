"use client";
import { useRef, useState, type FormEvent } from "react";
import { contactInput, contactSubjects } from "@/lib/contact-input";
import { Arrow } from "./Information";
type Errors = Record<string, string[] | undefined>;
export function ContactForm({ ready, initialToken }: { ready: boolean; initialToken: string }) {
  const [errors, setErrors] = useState<Errors>({}), [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle"), [notice, setNotice] = useState("");
  const token = useRef(initialToken), sending = useRef(false), formRef = useRef<HTMLFormElement>(null), statusRef = useRef<HTMLDivElement>(null);
  async function refreshToken() {
    const response = await fetch("/api/contact", { cache: "no-store" });
    if (!response.ok) throw new Error();
    const value = await response.json(); token.current = value.token || "";
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget, value = Object.fromEntries(new FormData(form));
    const parsed = contactInput.safeParse({ ...value, token: token.current });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors); setState("error"); setNotice("Check the highlighted fields.");
      const first = parsed.error.issues[0]?.path[0];
      if (first) (form.elements.namedItem(String(first)) as HTMLElement)?.focus();
      return;
    }
    setErrors({}); setNotice(""); sending.current = true; setState("sending");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok || result.accepted !== true) {
        setErrors(result.fields || {}); setState("error");
        if (result.refresh) { await refreshToken(); setNotice("The form has been refreshed. Please send your message again."); }
        else setNotice(result.error || "Your message could not be sent. Please try again.");
      } else { setState("success"); setNotice(result.message); form.reset(); }
    } catch { setState("error"); setNotice("We could not confirm your submission. Your text is still here. Please try again."); }
    finally { sending.current = false; statusRef.current?.focus(); }
  }
  const field = (name: string) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name]?.length ? `${name}-error` : undefined });
  const error = (name: string) => errors[name]?.length ? <span id={`${name}-error`} className="field-error">{errors[name]![0]}</span> : null;
  return <form className="contact-form" ref={formRef} onSubmit={submit} noValidate aria-busy={state === "sending"}>
    <h2>Send a message.</h2>
    <div className="contact-fields"><div><label htmlFor="contact-name">Name <span>(required)</span></label><input id="contact-name" name="name" autoComplete="name" maxLength={100} required {...field("name")} />{error("name")}</div>
    <div><label htmlFor="contact-email">Email <span>(required)</span></label><input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required {...field("email")} />{error("email")}</div>
    <div className="contact-wide"><label htmlFor="contact-subject">Subject <span>(required)</span></label><select id="contact-subject" name="subject" defaultValue="" required {...field("subject")}><option value="" disabled>Choose a subject</option>{contactSubjects.map(subject => <option key={subject}>{subject}</option>)}</select>{error("subject")}</div>
    <div className="contact-wide"><label htmlFor="contact-message">Message <span>(required)</span></label><textarea id="contact-message" name="message" rows={6} minLength={10} maxLength={4000} required {...field("message")} aria-describedby={[field("message")["aria-describedby"], "message-help"].filter(Boolean).join(" ")} />{error("message")}<p id="message-help" className="field-help">Up to 4,000 characters. Please leave out payment details and passwords.</p></div></div>
    <div className="contact-trap" aria-hidden="true"><label htmlFor="contact-website">Leave this field empty</label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off" /></div>
    <p className="contact-privacy">Your details are used to respond to this enquiry. <a href="/policies/privacy">Read the privacy information.</a></p>
    {!ready && <p className="contact-service-note" role="status">Messages are temporarily unavailable. Please check back soon.</p>}
    <button type="submit" className="information-action" disabled={!ready || state === "sending" || state === "success"}>{state === "sending" ? "Sending…" : state === "success" ? "Message accepted" : "Send message"}<Arrow /></button>
    <div ref={statusRef} tabIndex={-1} role={state === "error" ? "alert" : "status"} aria-live="polite" className={`contact-result ${state}`}>{notice}</div>
    {state === "success" && <button type="button" className="information-back" onClick={async () => { try { await refreshToken(); setState("idle"); setNotice(""); formRef.current?.querySelector("input")?.focus(); } catch { setState("error"); setNotice("Refresh the page to write another message."); } }}>Write another message <Arrow /></button>}
    <noscript><p>Enable JavaScript to use this contact form. No message will be sent without it.</p></noscript>
  </form>;
}
