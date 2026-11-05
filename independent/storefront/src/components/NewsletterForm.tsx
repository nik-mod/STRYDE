"use client";
import { useState } from "react";
import { commerceRequest } from "./Commerce";
export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [message, setMessage] = useState("");
  return (
    <form
      className="newsletter-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setState("busy");
        setMessage("");
        try {
          await commerceRequest("/newsletter", { email: data.get("email") });
          setState("done");
        } catch (error) {
          setMessage((error as Error).message);
          setState("idle");
        }
      }}
    >
      <label className="newsletter-label">
        <span>Get new colorways first</span>
        {state === "done" ? (
          <p role="status">You are on the list. (Stored locally in test mode.)</p>
        ) : (
          <span className="newsletter-row">
            <input
              required
              type="email"
              name="email"
              placeholder="you@example.com"
              maxLength={254}
              autoComplete="email"
            />
            <button
              type="submit"
              className="button button-dark"
              disabled={state === "busy"}
            >
              {state === "busy" ? "…" : "Join ↗"}
            </button>
          </span>
        )}
      </label>
      {message && (
        <p role="alert" className="commerce-message">
          {message}
        </p>
      )}
    </form>
  );
}
