"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMotion } from "./MotionProvider";
import { createRenderLoop, damp } from "@/lib/animation";

export function Experience() {
  const { reduced } = useMotion();
  const cursor = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (reduced || !matchMedia("(pointer:fine)").matches || !cursor.current) return;
    const ring = cursor.current;
    let x = -100, y = -100, targetX = -100, targetY = -100;
    const loop = createRenderLoop((dt) => {
      x = damp(x, targetX, 18, dt);
      y = damp(y, targetY, 18, dt);
      ring.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (Math.abs(x - targetX) + Math.abs(y - targetY) < 0.1) loop.setContinuous(false);
    });
    const move = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      ring.classList.toggle("cursor-active", !!(event.target as Element).closest("a,button,summary"));
      loop.setContinuous(true);
    };
    const leave = () => {
      ring.style.opacity = "0";
      loop.setContinuous(false);
    };
    const enter = () => { ring.style.opacity = "1"; };
    const visibility = () => loop.setVisible(!document.hidden);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);
    document.addEventListener("visibilitychange", visibility);
    visibility();

    const cleanups = Array.from(document.querySelectorAll<HTMLElement>(".magnetic")).map((element) => {
      let bounds: DOMRect | null = null;
      const measure = () => { bounds = element.getBoundingClientRect(); };
      const reset = () => { element.style.transform = ""; bounds = null; };
      const magnet = (event: PointerEvent) => {
        // Keep the untransformed entry bounds, preventing a moving measurement feedback loop.
        if (!bounds) return;
        const dx = (event.clientX - bounds.left - bounds.width / 2) * 0.1;
        const dy = (event.clientY - bounds.top - bounds.height / 2) * 0.16;
        element.style.transform = `translate3d(${dx}px,${dy}px,0)`;
      };
      element.addEventListener("pointerenter", measure);
      element.addEventListener("pointermove", magnet);
      element.addEventListener("pointerleave", reset);
      window.addEventListener("scroll", reset, { passive: true });
      return () => {
        element.removeEventListener("pointerenter", measure);
        element.removeEventListener("pointermove", magnet);
        element.removeEventListener("pointerleave", reset);
        window.removeEventListener("scroll", reset);
        reset();
      };
    });
    return () => {
      loop.dispose();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
      document.removeEventListener("visibilitychange", visibility);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [reduced, pathname]);

  return !reduced ? <div ref={cursor} className="custom-cursor" aria-hidden="true"><span /></div> : null;
}
