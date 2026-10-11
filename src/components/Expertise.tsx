"use client";
import { services } from "@/content/expertise";
import { useState } from "react";
import { Reveal } from "./Reveal";
export function Expertise() {
  const [active,setActive]=useState<number|null>(null);
  return <section id="expertise" className="section expertise-section"><div className="section-heading mono"><span>03 / What we do</span><span>From the first spark to the final pixel.</span></div><Reveal><div className="expertise-heading"><h2 className="display-title">BUILT DIFFERENT.<br/><em>BY DESIGN.</em></h2><p>Strategy in every decision.<br/>Character in every interaction.</p></div></Reveal><div className="services">{services.map((s,i)=><div className={`service ${active===i?"expanded":""}`} key={s.title}><button className="service-trigger" aria-expanded={active===i} aria-controls={`service-${i}`} onClick={()=>setActive(active===i?null:i)}><span className="service-number mono">0{i+1}</span><span className="service-name">{s.title}</span><span className={`service-art ${s.shape}`} aria-hidden="true"><i/><i/><i/></span><span className="service-icon" aria-hidden="true">{active===i?"−":"↗"}</span></button><div id={`service-${i}`} className="service-detail" hidden={active!==i}><span className="mono">{s.tag}</span><p>{s.description}</p><a href="#contact" className="underlined-link">Let’s talk about it <span>↗</span></a></div></div>)}</div></section>;
}
