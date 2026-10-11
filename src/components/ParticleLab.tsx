"use client";

import { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";
import { createRenderLoop, damp } from "@/lib/animation";
import { wordmarkPaths } from "@/content/wordmark";

export function ParticleLab() {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"word" | "orbit">("word");
  const { reduced } = useMotion();
  const state = useRef({ reduced, mode });
  const controls = useRef({ update: () => {}, burst: () => {} });

  useEffect(() => {
    state.current = { reduced, mode };
    controls.current.update();
  }, [reduced, mode]);

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let disposed = false;
    let started = false;
    const releases: (() => void)[] = [];
    const release = () => {
      controls.current = { update: () => {}, burst: () => {} };
      while (releases.length) {
        try { releases.pop()?.(); } catch { /* Continue GPU cleanup. */ }
      }
    };

    const lazy = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      import("three").then((T) => {
        if (disposed) return;
        try {
          const compact = matchMedia("(max-width:600px)").matches || navigator.hardwareConcurrency <= 4;
          const renderer = new T.WebGLRenderer({ alpha: true, antialias: false, stencil: false, powerPreference: "low-power" });
          releases.push(() => { renderer.dispose(); renderer.domElement.remove(); });
          renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1 : 1.5));
          host.appendChild(renderer.domElement);
          const scene = new T.Scene();
          const camera = new T.OrthographicCamera(-5.2, 5.2, 2, -2, 0.1, 20);
          camera.position.z = 5;

          // Sample the same authored paths used in the hero, not a substitute system font.
          const mask = document.createElement("canvas");
          mask.width = 1420;
          mask.height = 276;
          const context = mask.getContext("2d");
          if (!context) throw new Error("2D canvas unavailable");
          context.scale(2, 2);
          context.strokeStyle = "white";
          context.lineWidth = 13;
          context.lineJoin = "bevel";
          wordmarkPaths.forEach((shape) => context.stroke(new Path2D(shape)));
          const pixels = context.getImageData(0, 0, mask.width, mask.height).data;
          const homes: number[] = [];
          const stride = compact ? 6 : 4;
          for (let y = 0; y < mask.height; y += stride) {
            for (let x = 0; x < mask.width; x += stride) {
              if (pixels[(y * mask.width + x) * 4 + 3] > 100) homes.push((x - 710) / 150, (138 - y) / 150, 0);
            }
          }
          const count = homes.length / 3;
          const orbit: number[] = [];
          const seeds: number[] = [];
          for (let i = 0; i < count; i++) {
            const z = 1 - 2 * (i + 0.5) / count;
            const radius = Math.sqrt(1 - z * z);
            const angle = i * 2.399963;
            orbit.push(Math.cos(angle) * radius * 2.8, z * 1.12, Math.sin(angle) * radius * 0.85);
            seeds.push(((i * 16807 + 7) % 65521) / 65521);
          }
          const geometry = new T.BufferGeometry();
          releases.push(() => geometry.dispose());
          geometry.setAttribute("position", new T.Float32BufferAttribute(homes, 3));
          geometry.setAttribute("aOrbit", new T.Float32BufferAttribute(orbit, 3));
          geometry.setAttribute("aSeed", new T.Float32BufferAttribute(seeds, 1));
          const uniforms = {
            uTime: { value: 0 }, uMorph: { value: state.current.reduced ? 0 : 1 },
            uPointer: { value: new T.Vector2() }, uHover: { value: 0 },
            uBurst: { value: 0 }, uRatio: { value: renderer.getPixelRatio() },
          };
          const material = new T.ShaderMaterial({
            transparent: true, depthWrite: false, uniforms,
            vertexShader: `
              attribute vec3 aOrbit;
              attribute float aSeed;
              uniform float uTime, uMorph, uHover, uBurst, uRatio;
              uniform vec2 uPointer;
              varying float vSeed;
              void main() {
                vSeed = aSeed;
                vec3 cloud = aOrbit;
                float a = uTime * 0.12;
                cloud.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * cloud.xz;
                vec3 p = mix(position, cloud, uMorph);
                vec2 away = p.xy - uPointer;
                float distanceToPointer = length(away);
                float force = pow(max(0.0, 1.0 - distanceToPointer / 1.25), 2.0) * uHover * 0.85;
                p.xy += away / max(distanceToPointer, 0.001) * force;
                p += vec3(sin(aSeed * 52.0), cos(aSeed * 39.0), sin(aSeed * 71.0)) * uBurst * 1.8;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                gl_PointSize = (1.5 + aSeed * 1.6 + uMorph * 0.35) * uRatio;
              }
            `,
            fragmentShader: `
              varying float vSeed;
              void main() {
                float distanceToCenter = length(gl_PointCoord - 0.5);
                if (distanceToCenter > 0.5) discard;
                vec3 color = mix(vec3(0.95), vec3(0.776, 1.0, 0.239), step(0.77, vSeed));
                gl_FragColor = vec4(color, 1.0 - smoothstep(0.2, 0.5, distanceToCenter));
              }
            `,
          });
          releases.push(() => material.dispose());
          const points = new T.Points(geometry, material);
          // Both morph endpoints are bounded by this sphere.
          geometry.boundingSphere = new T.Sphere(new T.Vector3(), 7);
          scene.add(points);
          let visible = true, lost = false, announced = false;
          let targetX = 0, targetY = 0, hoverTarget = 0, burst = 0;
          let time = 0;
          const loop = createRenderLoop((dt) => {
            if (lost) return;
            const quiet = state.current.reduced;
            const target = state.current.mode === "orbit" ? 1 : 0;
            if (!quiet) time += dt;
            uniforms.uTime.value = time;
            uniforms.uMorph.value = quiet ? target : damp(uniforms.uMorph.value, target, 3.2, dt);
            uniforms.uPointer.value.x = damp(uniforms.uPointer.value.x, targetX, 12, dt);
            uniforms.uPointer.value.y = damp(uniforms.uPointer.value.y, targetY, 12, dt);
            uniforms.uHover.value = quiet ? 0 : damp(uniforms.uHover.value, hoverTarget, 8, dt);
            burst = quiet ? 0 : damp(burst, 0, 2.8, dt);
            uniforms.uBurst.value = burst;
            renderer.render(scene, camera);
            if (!announced) { announced = true; setReady(true); }
            // Word mode sleeps after all spring responses have settled.
            const unsettled = Math.abs(uniforms.uMorph.value - target) > 0.001 ||
              uniforms.uHover.value > 0.001 || burst > 0.001;
            if (quiet || (state.current.mode === "word" && !unsettled)) loop.setContinuous(false);
          });
          releases.push(() => loop.dispose());
          const wake = () => { loop.setContinuous(!state.current.reduced); loop.invalidate(); };
          controls.current = {
            update: wake,
            burst: () => { if (!state.current.reduced) { burst = 1; wake(); } },
          };
          const resize = () => {
            const w = Math.max(host.clientWidth, 1), h = Math.max(host.clientHeight, 1);
            renderer.setSize(w, h);
            camera.top = 5.2 * h / w;
            camera.bottom = -camera.top;
            camera.updateProjectionMatrix();
            loop.invalidate();
          };
          const visibility = () => loop.setVisible(visible && !document.hidden && !lost);
          const observer = new ResizeObserver(resize);
          observer.observe(host);
          const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visibility(); });
          intersection.observe(host);
          const move = (event: PointerEvent) => {
            const r = host.getBoundingClientRect();
            targetX = ((event.clientX - r.left) / r.width - 0.5) * 10.4;
            targetY = (0.5 - (event.clientY - r.top) / r.height) * camera.top * 2;
            hoverTarget = 1;
            wake();
          };
          const leave = () => { hoverTarget = 0; wake(); };
          const pulse = () => controls.current.burst();
          const contextLost = (event: Event) => {
            event.preventDefault(); lost = true; loop.setVisible(false); setReady(false);
          };
          host.addEventListener("pointermove", move);
          host.addEventListener("pointerleave", leave);
          host.addEventListener("click", pulse);
          document.addEventListener("visibilitychange", visibility);
          renderer.domElement.addEventListener("webglcontextlost", contextLost);
          releases.push(() => {
            observer.disconnect(); intersection.disconnect();
            host.removeEventListener("pointermove", move);
            host.removeEventListener("pointerleave", leave);
            host.removeEventListener("click", pulse);
            document.removeEventListener("visibilitychange", visibility);
            renderer.domElement.removeEventListener("webglcontextlost", contextLost);
          });
          resize(); wake(); visibility();
        } catch { release(); }
      }).catch(() => {});
    }, { rootMargin: "200px" });
    lazy.observe(host);
    return () => { disposed = true; lazy.disconnect(); release(); };
  }, []);

  return (
    <section id="playground" className="section lab-section" aria-labelledby="lab-title">
      <div className="section-heading mono"><span>05 / Playground</span><span>Curiosity is part of the process.</span></div>
      <div className="lab-title"><h2 id="lab-title">A LITTLE CHAOS.<br /><em>A LOT OF POSSIBILITY.</em></h2><span className="lab-stamp mono">Experiment<br />SQ—002</span></div>
      <div ref={container} className={`particle-stage ${ready ? "ready" : ""}`} aria-hidden="true"><span className="particle-fallback">SMACKQ</span></div>
      <div className="lab-footer">
        <div>
          <p className="mono" aria-live="polite">{reduced ? "Stillness is a possibility, too." : ready ? "One identity. Two states. Yours to disturb." : "A study in particles, play and possibility."}</p>
          <div className="lab-modes" role="group" aria-label="Particle composition">
            <button onClick={() => setMode("word")} aria-pressed={mode === "word"} disabled={!ready}>01 / Letterform</button>
            <button onClick={() => setMode("orbit")} aria-pressed={mode === "orbit"} disabled={!ready}>02 / Orbit</button>
          </div>
        </div>
        <button className="outline-button" onClick={() => controls.current.burst()} disabled={!ready || reduced}>Disrupt the system <span>↗</span></button>
      </div>
    </section>
  );
}
