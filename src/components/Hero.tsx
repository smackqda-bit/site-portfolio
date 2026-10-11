"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow, Wordmark } from "./Logo";
import { useMotion } from "./MotionProvider";
import { motion } from "@/lib/motion";

const ChromeScene = dynamic(() => import("./ChromeScene"), { ssr: false });

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const played = useRef(false);
  const mountedAt = useRef(0);
  const [scene, setScene] = useState<"loading" | "ready" | "fallback">("loading");
  const [impulse, setImpulse] = useState(0);
  const { reduced, paused, systemReduced, toggle } = useMotion();
  const sceneReady = useCallback((available: boolean) => setScene(available ? "ready" : "fallback"), []);

  useEffect(() => {
    mountedAt.current = performance.now();
    // A failed chunk or unavailable GPU must never hold the introduction hostage.
    const timer = setTimeout(() => setScene((current) => current === "loading" ? "fallback" : current), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (reduced || scene === "loading" || played.current || !root.current) return;
    played.current = true;
    let disposed = false;
    let revert = () => {};
    import("gsap").then(({ gsap }) => {
      if (disposed || !root.current) return;
      // Do not replay an entrance over a user who has already moved down the page.
      if (performance.now() - mountedAt.current > 1000 || root.current.getBoundingClientRect().bottom < innerHeight * 0.3 || window.scrollY > 100) return;
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: motion.cinematic } });
        tl.fromTo(".wordmark-glyph", { y: 45, opacity: 0 }, {
          y: 0, opacity: 1, duration: motion.hero, stagger: motion.stagger,
        }, 0);
        tl.fromTo(".hero-art", { opacity: 0, scale: 0.86 }, {
          opacity: 1, scale: 1, duration: motion.hero + 0.35,
        }, 0.12);
        tl.fromTo(".hero-line > span", { yPercent: 115 }, {
          yPercent: 0, duration: motion.reveal, stagger: motion.stagger,
        }, 0.38);
        tl.fromTo(".hero-kicker, .hero-intro, .hero-instrument, .hero-footer", { y: 18, opacity: 0 }, {
          y: 0, opacity: 1, duration: motion.base, stagger: motion.stagger,
        }, 0.72);
      }, root);
      revert = () => ctx.revert();
    }).catch(() => {});
    return () => { disposed = true; revert(); };
  }, [reduced, scene]);

  return (
    <section ref={root} className="hero" id="top" aria-labelledby="hero-title" data-scene={scene}>
      <div className="hero-topline mono">
        <span><i className="status-dot" /> Independent minds. Open possibilities.</span>
        <span>SMACKQ / Digital atelier / 2026</span>
      </div>
      <div className="hero-wordmark"><Wordmark /></div>
      <div className="hero-art"><ChromeScene onReady={sceneReady} impulse={impulse} /></div>
      <div className="hero-instrument">
        <span className="instrument-cross" aria-hidden="true">+</span>
        <span className="mono">SQ—001 / Living matter</span>
        <button className="matter-control" onClick={() => setImpulse((value) => value + 1)}
          disabled={scene !== "ready" || reduced} aria-label="Reshape the sculpture">
          <span aria-hidden="true">↻</span> Change the form
        </button>
        <span className="instrument-hint mono">{scene === "loading" ? "Preparing the material…" : scene === "ready" ? "Move. Drag. Make it yours." : "A study in living form."}</span>
      </div>
      <div className="hero-bottom">
        <div className="hero-heading">
          <div className="eyebrow hero-kicker">Independent AI-powered web development studio.</div>
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
