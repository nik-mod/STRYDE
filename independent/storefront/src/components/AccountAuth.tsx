"use client";
import { useEffect, useRef, useState } from "react";
import { commerceRequest } from "./Commerce";
import { Arrow } from "./Information";
import { AuthScene } from "./AuthScene";
import { ShopIcon, ShopPage } from "./ShopUI";
export function AccountAuth({ redirectTo = "/account" }: { redirectTo?: string }) {
 const [mode, setMode] = useState<"login" | "register">("login"), [message, setMessage] = useState(""), [errors, setErrors] = useState<Record<string,string>>({}), [busy, setBusy] = useState(false), [show, setShow] = useState(false);
 const alert = useRef<HTMLParagraphElement>(null);
 useEffect(() => { if (message) alert.current?.focus(); }, [message]);
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (busy) return; const form = event.currentTarget, data = new FormData(form), value = Object.fromEntries(data) as Record<string,string>, invalid:Record<string,string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email || "")) invalid.email = "Enter a valid email address.";
  if (!value.password || value.password.length < 8) invalid.password = "Use at least 8 characters.";
  if (mode === "register") for (const name of ["first_name", "last_name"]) if (!value[name]?.trim()) invalid[name] = `Enter your ${name === "first_name" ? "first" : "last"} name.`;
  setErrors(invalid); setMessage(""); if (Object.keys(invalid).length) { form.querySelector<HTMLInputElement>(`[name="${Object.keys(invalid)[0]}"]`)?.focus(); return; }
  setBusy(true);
  try { await commerceRequest(mode === "login" ? "/auth/login" : "/auth/register", { email: value.email.trim(), password: value.password, ...(mode === "register" ? { first_name: value.first_name.trim(), last_name: value.last_name.trim() } : {}) }); window.location.href = redirectTo.startsWith("/account") ? redirectTo : "/account"; } catch (error) { setMessage((error as Error).message); setBusy(false); }
 }
 function field(name:string,label:string,type="text",autoComplete?:string) { return <label className={name === "email" || name === "password" ? "shop-wide" : undefined}>{label}<div className={name === "password" ? "password-control" : undefined}><input type={name === "password" && show ? "text" : type} name={name} autoComplete={autoComplete} required maxLength={name === "email" ? 254 : name === "password" ? 200 : 100} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `auth-${name}-error` : undefined} disabled={busy}/>{name === "password" && <button type="button" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}><ShopIcon name="eye" size={19}/><span>{show ? "Hide" : "Show"}</span></button>}</div>{errors[name] && <span className="shop-error-text" id={`auth-${name}-error`}>{errors[name]}</span>}</label>; }
 return <ShopPage title="Your account"><div className="auth-spread"><aside className="auth-story"><AuthScene/><h2>Air Max Plus</h2><p>Blue and white.</p><a href="/account/wishlist">Your saved pairs<Arrow/></a><a href="/collections/all">Keep exploring<Arrow/></a></aside><div className="auth-form-panel"><div className="auth-tabs" role="group" aria-label="Account access">{(["login","register"] as const).map(item => <button type="button" disabled={busy} aria-pressed={mode === item} key={item} onClick={() => { setMode(item); setMessage(""); setErrors({}); }}>{item === "login" ? "Sign in" : "Create account"}</button>)}</div><h2>{mode === "login" ? "Sign in to STRYDE" : "Create your STRYDE account"}</h2><form className="shop-form" noValidate onSubmit={submit} aria-busy={busy}><div className="shop-field-grid">{mode === "register" && <>{field("first_name","First name","text","given-name")}{field("last_name","Last name","text","family-name")}</>}{field("email","Email","email","email")}{field("password","Password","password",mode === "login" ? "current-password" : "new-password")}</div>{mode === "register" && <p className="shop-muted">Use at least 8 characters. Read our <a href="/policies/privacy">privacy information</a> before creating an account.</p>}{message && <p ref={alert} tabIndex={-1} className="shop-error-text" role="alert">{message}</p>}<button type="submit" disabled={busy} className="shop-button">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<Arrow/></button>{mode === "login" && <a className="shop-text-link" href="/account/forgot-password">Forgot your password?<Arrow/></a>}</form></div></div></ShopPage>;
}
export function LogoutButton() {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 return <div className="account-signout"><button type="button" className="shop-text-button" disabled={busy} onClick={async()=>{setBusy(true);setMessage("");try{await commerceRequest("/auth/logout",{});window.location.href="/account";}catch{setMessage("Sign out didn’t complete. Please try again.");setBusy(false);}}}>{busy ? "Signing out…" : "Sign out"}<Arrow/></button>{message && <p role="alert" className="shop-error-text">{message}</p>}</div>;
}

