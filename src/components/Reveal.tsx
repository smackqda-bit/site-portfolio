"use client";

import { useEffect, useRef } from "react";
import { useMotion } from "./MotionProvider";
import { motion } from "@/lib/motion";

export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const element = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();

  useEffect(() => {
    if (reduced || !element.current) return;
    let disposed = false;
    let revert = () => {};
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed || !element.current) return;
      const container = element.current;
      // Never hide content already read, restored from history, or visible during hydration.
      if (container.getBoundingClientRect().top < innerHeight * 0.92) return;
      gsap.registerPlugin(ScrollTrigger);
      const image = container.querySelector(".project-cover");
      const ctx = gsap.context(() => {
        if (image) {
          gsap.fromTo(image, { clipPath: "inset(12% 0 0 0)" }, {
            clipPath: "inset(0% 0 0 0)", duration: motion.reveal, ease: motion.cinematic,
            scrollTrigger: { trigger: container, start: "top 94%", once: true },
          });
        } else {
          gsap.fromTo(container, { y: 28, opacity: 0.25 }, {
            y: 0, opacity: 1, duration: motion.reveal, ease: motion.ease,
            scrollTrigger: { trigger: container, start: "top 92%", once: true },
          });
        }
      }, container);
      revert = () => ctx.revert();
    }).catch(() => {});
    return () => { disposed = true; revert(); };
  }, [reduced]);

  return <div ref={element} className={className}>{children}</div>;
}
