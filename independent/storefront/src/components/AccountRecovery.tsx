"use client";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./Information";
import { ShopPage } from "./ShopUI";
import { AuthScene } from "./AuthScene";
export function AccountRecovery({ reset = false }: { reset?: boolean }) {
  const [show,setShow]=useState(false),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[token,setToken]=useState(""),[complete,setComplete]=useState(false);
  const status=useRef<HTMLParagraphElement>(null), tokenRead=useRef(false);
  useEffect(()=>{if(!reset||tokenRead.current)return;tokenRead.current=true;const value=new URLSearchParams(location.hash.slice(1)).get("token")||"";setToken(value);if(value)history.replaceState(null,"",location.pathname);},[reset]);
  useEffect(()=>{if(message)status.current?.focus();},[message]);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;const data=new FormData(event.currentTarget);
    if(reset&&data.get("password")!==data.get("confirmation")){setMessage("The passwords don’t match. Check both fields.");return;}
    setBusy(true);setMessage("");
    try{const response=await fetch("/api/auth/recovery",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(reset?{action:"reset",token,password:data.get("password")}:{action:"request",email:data.get("email")})});const result=await response.json();setMessage(result.message||"Recovery is temporarily unavailable.");if(response.ok&&reset){setComplete(true);setToken("");}}
    catch{setMessage("We could not confirm the request. Please try again.");}finally{setBusy(false);}
  }
  return <ShopPage title={reset?"Choose a new password":"Reset your password"} description={reset?"Choose a new password for your STRYDE account.":"Recover access to your saved pairs, orders and delivery details."}><div className="auth-spread"><aside className="auth-story"><AuthScene/><h2>Your account.<br/>Back with you.</h2><p>Recovery links expire after 15 minutes and can be used only once. Requesting a new link replaces the previous one.</p><a href="/account">Back to sign in<Arrow/></a></aside><div className="auth-form-panel"><h2>{reset?"Reset password":"Recover your account"}</h2>{reset&&!token&&!complete?<p className="shop-status">Open the latest recovery link to choose a new password. <a href="/account/forgot-password">Request a new link.</a></p>:!complete&&<form className="shop-form" onSubmit={submit} aria-busy={busy}>{reset?<><label>New password<input name="password" required minLength={8} maxLength={200} type={show?"text":"password"} autoComplete="new-password" disabled={busy}/></label><label>Confirm new password<input name="confirmation" required minLength={8} maxLength={200} type={show?"text":"password"} autoComplete="new-password" disabled={busy}/></label><label className="shop-checkbox"><input type="checkbox" checked={show} onChange={event=>setShow(event.target.checked)}/>Show passwords</label></>:<label>Email address<input required type="email" name="email" maxLength={254} autoComplete="email" placeholder="you@example.com" disabled={busy}/></label>}<button className="shop-button" type="submit" disabled={busy}>{busy?"Please wait…":reset?"Save new password":"Request recovery link"}<Arrow/></button></form>}{message&&<p ref={status} tabIndex={-1} className="shop-status" role="status">{message}</p>}{complete&&<a className="shop-button" href="/account">Sign in with your new password<Arrow/></a>}</div></div></ShopPage>;
}
