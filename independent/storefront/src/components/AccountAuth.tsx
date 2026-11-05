"use client";
import { useState } from "react";
import { commerceRequest } from "./Commerce";
export function AccountAuth({
  redirectTo = "/account",
}: {
  redirectTo?: string;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        await commerceRequest("/auth/login", {
          email: data.get("email"),
          password: data.get("password"),
        });
      } else {
        await commerceRequest("/auth/register", {
          email: data.get("email"),
          password: data.get("password"),
          first_name: data.get("first_name"),
          last_name: data.get("last_name"),
        });
      }
      window.location.href = redirectTo;
    } catch (error) {
      setMessage((error as Error).message);
      setBusy(false);
    }
  }
  return (
    <section className="commerce-panel">
      <h1>{mode === "login" ? "Sign in." : "Create your account."}</h1>
      <p>
        {mode === "login"
          ? "Your bag, orders and addresses in one place."
          : "Track orders, save addresses and keep a wishlist."}
      </p>
      {message && (
        <p role="alert" className="commerce-message">
          {message}
        </p>
      )}
      <form className="checkout-form" onSubmit={submit}>
        {mode === "register" && (
          <>
            <label>
              First name
              <input required name="first_name" maxLength={100} />
            </label>
            <label>
              Last name
              <input required name="last_name" maxLength={100} />
            </label>
          </>
        )}
        <label className="wide">
          Email
          <input required type="email" name="email" autoComplete="email" maxLength={254} />
        </label>
        <label className={mode === "login" ? "wide" : undefined}>
          Password
          <input
            required
            type="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            maxLength={200}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="button button-dark wide"
        >
          {busy
            ? "Working…"
            : mode === "login"
              ? "Sign in ↗"
              : "Create account ↗"}
        </button>
      </form>
      <p>
        {mode === "login" ? (
          <>
            New here?{" "}
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </section>
  );
}
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await commerceRequest("/auth/logout", {});
        } finally {
          window.location.href = "/account";
        }
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
