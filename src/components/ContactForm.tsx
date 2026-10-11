"use client";
import { useRef, useState, useEffect } from "react";
import Script from "next/script";
import { projectTypes } from "@/content/contact-options";
declare global {interface Window {turnstile?:{render:(el:HTMLElement,options:Record<string,unknown>)=>string;reset:(id:string)=>void;remove:(id:string)=>void;};}}
export function ContactForm({configured}:{configured:boolean}){
 const [status,setStatus]=useState<"idle"|"sending"|"success"|"error">("idle");
 const [message,setMessage]=useState("");const [token,setToken]=useState("");const [loaded,setLoaded]=useState(false);
 const started=useRef(0);const captcha=useRef<HTMLDivElement>(null);const widget=useRef<string|null>(null);const notice=useRef<HTMLParagraphElement>(null);
 const key=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||"";
 useEffect(()=>{started.current=Date.now();},[]);
 useEffect(()=>{
  if(!loaded||!key||!captcha.current||!window.turnstile)return;
  widget.current=window.turnstile.render(captcha.current,{sitekey:key,theme:"dark",action:"contact",callback:(value:string)=>setToken(value),"expired-callback":()=>setToken(""),"error-callback":()=>{setToken("");setStatus("error");setMessage("Verification could not load. Please check your connection and try again.");}});
  return()=>{if(widget.current)window.turnstile?.remove(widget.current);widget.current=null;};
 },[loaded,key]);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(status==="sending"||!configured)return;
  const form=event.currentTarget;const data=new FormData(form);
  setStatus("sending");setMessage("Sending your inquiry…");
  try{
   const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...Object.fromEntries(data),startedAt:started.current,token}),signal:AbortSignal.timeout(35000)});
   const result=await response.json();
   if(!response.ok||result.ok!==true)throw new Error(result.message||"Your inquiry could not be sent.");
   setStatus("success");setMessage(result.message);form.reset();started.current=Date.now();
  }catch(error){setStatus("error");setMessage(error instanceof Error&&error.name==="TimeoutError"?"The request timed out. Please try again.":error instanceof Error?error.message:"Connection lost. Please try again.");}
  finally{setToken("");if(widget.current)window.turnstile?.reset(widget.current);requestAnimationFrame(()=>notice.current?.focus());}
 }
 return <form className="contact-form" onSubmit={submit}>
  {!configured&&<p className="form-unavailable">Online inquiries are opening soon. Message delivery is not available yet.</p>}
  <div className="form-row"><label>Your name <span>*</span><input name="name" autoComplete="name" required maxLength={100} placeholder="What should we call you?"/></label><label>Email address <span>*</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com"/></label></div>
  <div className="form-row"><label>What are we creating? <span>*</span><select name="projectType" required defaultValue=""><option value="" disabled>Select a project type</option>{projectTypes.map(t=><option key={t}>{t}</option>)}</select></label><label>Budget <small>(optional)</small><select name="budget" defaultValue=""><option value="">Let’s figure it out together</option><option>Under $5,000</option><option>$5,000 – $15,000</option><option>$15,000 – $30,000</option><option>$30,000+</option></select></label></div>
  <label>Your idea <span>*</span><textarea name="message" required minLength={20} maxLength={5000} rows={3} placeholder="The ambitious version. We’re listening."/></label>
  <div className="honeypot" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
  {key&&<><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" onReady={()=>setLoaded(true)} onError={()=>{setStatus("error");setMessage("Verification could not load. Please try again later.");}}/><div className="captcha" ref={captcha}/></>}
  <div className="form-submit"><p>We’ll only use your details to respond to your inquiry.<br/><a href="/privacy">Privacy notice</a></p><button className="pill-button magnetic" type="submit" disabled={!configured||status==="sending"||Boolean(key&&!token)}>{status==="sending"?"Sending…":"Send your idea"}<span>↗</span></button></div>
  <p ref={notice} className={`form-status ${status}`} role="status" aria-live="polite" tabIndex={-1}>{message}</p>
 </form>;
}
