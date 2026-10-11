"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useMotion } from "./MotionProvider";

const chapters = [
  { id: "about", label: "Studio" }, { id: "work", label: "Work" },
  { id: "expertise", label: "Expertise" }, { id: "approach", label: "Approach" },
  { id: "playground", label: "Playground" }, { id: "contact", label: "Contact" },
];

export function StoryDirector() {
  const path = usePathname();
  const { reduced } = useMotion();
  const progress = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("");

  useEffect(() => {
    if (path !== "/") return;
    const sections = chapters.map((chapter) => document.getElementById(chapter.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-18% 0px -55% 0px" });
    sections.forEach((section) => observer.observe(section));

    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (progress.current) progress.current.style.transform = `scaleX(${Math.max(0, Math.min(1, scrollY / distance))})`;
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    update();

    let disposed = false;
    let revert = () => {};
    if (!reduced) {
      Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          sections.forEach((section) => {
            gsap.fromTo(section, { "--section-line": 0 }, {
              "--section-line": 1, ease: "none",
              scrollTrigger: { trigger: section, start: "top 95%", end: "top 45%", scrub: 0.6 },
            });
          });
          const art = document.querySelector(".hero-art");
          if (art) gsap.to(art, {
            yPercent: 13, ease: "none",
            scrollTrigger: { trigger: "#top", start: "top top", end: "bottom 15%", scrub: 0.7 },
          });
        });
        revert = () => ctx.revert();
      }).catch(() => {});
    }
    return () => {
      disposed = true;
      revert();
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, [path, reduced]);

  if (path !== "/") return null;
  return <>
    <div className="story-progress" ref={progress} aria-hidden="true" />
    <nav className="chapter-nav" aria-label="Page chapters">
      {chapters.map((chapter, index) => (
        <a key={chapter.id} href={`#${chapter.id}`} aria-label={chapter.label}
          aria-current={active === chapter.id ? "location" : undefined}>
          <span className="chapter-name mono">{chapter.label}</span>
          <span className="chapter-dot" aria-hidden="true" />
          <span className="chapter-number mono" aria-hidden="true">0{index + 1}</span>
        </a>
      ))}
    </nav>
  </>;
}
