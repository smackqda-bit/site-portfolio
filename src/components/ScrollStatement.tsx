"use client";
import { useEffect, useRef } from "react";
import { useMotion } from "./MotionProvider";
export function ScrollStatement(){
 const el=useRef<HTMLHeadingElement>(null);const {reduced}=useMotion();
 useEffect(()=>{
  if(reduced||!el.current)return;
  let disposed=false;let revert=()=>{};
  Promise.all([import("gsap"),import("gsap/ScrollTrigger")]).then(([{gsap},{ScrollTrigger}])=>{
   if(disposed||!el.current)return;gsap.registerPlugin(ScrollTrigger);
   const ctx=gsap.context(()=>{gsap.fromTo(".about-word",{opacity:.18},{opacity:1,stagger:.25,ease:"none",scrollTrigger:{trigger:el.current,start:"top 85%",end:"bottom 55%",scrub:.6}});},el);
   revert=()=>ctx.revert();
  }).catch(()=>{});
  return()=>{disposed=true;revert();};
 },[reduced]);
 return <h2 ref={el} className="display-title about-title"><span className="about-word">THE </span><span className="about-word">FUTURE</span><br/><span className="about-word">ISN’T </span><span className="about-word">BUILT.</span><br/><span className="indent"><span className="about-word">IT’S </span><em className="about-word">CREATED.</em></span></h2>;
}
