"use client";

import { useEffect, useRef } from "react";
import { Arrow } from "./Logo";
import { useMotion } from "./MotionProvider";
import { motion } from "@/lib/motion";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const played = useRef(false);
  const mountedAt = useRef(0);
  const { reduced, paused, systemReduced, toggle } = useMotion();

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (reduced || played.current || !root.current) return;
    played.current = true;
    let disposed = false;
    let revert = () => {};
    import("gsap").then(({ gsap }) => {
      if (disposed || !root.current) return;
      // Do not replay an entrance over a user who has already moved down the page.
      if (performance.now() - mountedAt.current > 1000 || root.current.getBoundingClientRect().bottom < innerHeight * 0.3 || window.scrollY > 100) return;
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: motion.cinematic } });
        tl.fromTo(".hero-line > span", { yPercent: 115 }, {
          yPercent: 0, duration: motion.reveal, stagger: motion.stagger,
        }, 0.38);
        tl.fromTo(".hero-intro, .hero-footer", { y: 18, opacity: 0 }, {
          y: 0, opacity: 1, duration: motion.base, stagger: motion.stagger,
        }, 0.72);
      }, root);
      revert = () => ctx.revert();
    }).catch(() => {});
    return () => { disposed = true; revert(); };
  }, [reduced]);

  return (
    <section ref={root} className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-topline mono">
        <span><i className="status-dot" /> Independent minds. Open possibilities.</span>
        <span>SMACKQ / Digital atelier / 2026</span>
      </div>
      <div className="hero-bottom">
        <div className="hero-heading">
          <h1 id="hero-title">
            <span className="hero-line"><span>DIGITAL,</span></span>
            <span className="hero-line"><span>REIMAGINED.</span></span>
          </h1>
        </div>
        <div className="hero-intro">
          <p>We turn bold ideas into<br />extraordinary digital experiences.</p>
          <a className="pill-button magnetic" href="#work">Explore our work <Arrow diagonal /></a>
          <a className="text-link" href="#contact">Start a project <span>↗</span></a>
        </div>
      </div>
      <div className="hero-footer mono">
        <a href="#about" className="scroll-cue"><span>↓</span> Scroll to discover</a>
        <span className="hero-coordinate">Human vision. Material possibility.</span>
        <button onClick={toggle} className="motion-toggle" aria-pressed={paused}
          disabled={systemReduced} aria-label={systemReduced ? "Reduced motion follows your system setting" : paused ? "Resume animations" : "Pause animations"}>
          {systemReduced ? "Motion reduced" : paused ? "▶ Resume motion" : "Ⅱ Pause motion"}
        </button>
      </div>
    </section>
  );
}
