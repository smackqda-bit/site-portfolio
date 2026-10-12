"use client";

import { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";
import { createRenderLoop, damp } from "@/lib/animation";
import { motion } from "@/lib/motion";

type Props = { onReady: (available: boolean) => void; impulse: number };

export default function ChromeScene({ onReady, impulse }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const { reduced } = useMotion();
  const state = useRef({ reduced });
  const control = useRef({ updateMotion: () => {}, reshape: () => {} });

  useEffect(() => {
    state.current.reduced = reduced;
    control.current.updateMotion();
  }, [reduced]);

  useEffect(() => {
    if (impulse) control.current.reshape();
  }, [impulse]);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false;
    const releases: (() => void)[] = [];
    const release = () => {
      control.current = { updateMotion: () => {}, reshape: () => {} };
      while (releases.length) {
        try { releases.pop()?.(); } catch { /* Continue releasing the remaining GPU resources. */ }
      }
    };

    import("three").then((T) => {
      if (disposed) return;
      try {
        const compact = matchMedia("(max-width: 767px)").matches || navigator.hardwareConcurrency <= 4;
        const renderer = new T.WebGLRenderer({
          antialias: true, alpha: true, stencil: false, powerPreference: "low-power",
        });
        releases.push(() => { renderer.dispose(); renderer.domElement.remove(); });
        renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 2 : 1.6));
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        mount.appendChild(renderer.domElement);

        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(34, 1, 0.1, 30);
        camera.position.set(0, 0, 7.1);

        // An authored studio light rig; no downloaded HDR or environment request.
        const studio = new T.Scene();
        studio.background = new T.Color("#101317");
        const panelGeometry = new T.PlaneGeometry(1, 1);
        releases.push(() => panelGeometry.dispose());
        const panel = (x: number, y: number, z: number, w: number, h: number, color: string, power: number) => {
          const material = new T.MeshBasicMaterial({
            color: new T.Color(color).multiplyScalar(power), side: T.DoubleSide,
          });
          releases.push(() => material.dispose());
          const light = new T.Mesh(panelGeometry, material);
          light.position.set(x, y, z);
          light.scale.set(w, h, 1);
          light.lookAt(0, 0, 0);
          studio.add(light);
        };
        panel(-4, 2, 3, 2.5, 8, "#ffffff", 7);
        panel(4, 1, 1, 1.2, 7, "#dde7ff", 5);
        panel(0, 4, -2, 7, 1.5, "#ffffff", 6);
        panel(1, -3, 2, 5, 0.65, "#c6ff3d", 1.6);
        panel(-1, 0, -4, 0.6, 6, "#ffffff", 4);
        const pmrem = new T.PMREMGenerator(renderer);
        const environment = pmrem.fromScene(studio, 0.035, 0.1, 20);
        releases.push(() => { environment.dispose(); pmrem.dispose(); });
        scene.environment = environment.texture;

        // A closed, asymmetric loop with varying thickness: SMACKQ's own material signature.
        class MatterCurve extends T.Curve<import("three").Vector3> {
          constructor() { super(); }
          getPoint(u: number, target = new T.Vector3()) {
            const a = u * Math.PI * 2;
            return target.set(
              1.13 * Math.cos(a) + 0.22 * Math.cos(3 * a + 0.4),
              1.12 * Math.sin(a) - 0.19 * Math.sin(2 * a),
              0.48 * Math.sin(2 * a + 0.3) + 0.13 * Math.cos(3 * a),
            );
          }
        }
        const curve = new MatterCurve();
        const segments = compact ? 144 : 176;
        const radial = 32;
        const geometry = new T.TubeGeometry(curve, segments, 0.34, radial, true);
        releases.push(() => geometry.dispose());
        const vertices = geometry.getAttribute("position");
        const center = new T.Vector3();
        const vertex = new T.Vector3();
        for (let row = 0; row <= segments; row++) {
          const u = row / segments;
          curve.getPointAt(u, center);
          const width = 1 + 0.23 * Math.sin(u * Math.PI * 6 + 0.8);
          for (let column = 0; column <= radial; column++) {
            const index = row * (radial + 1) + column;
            vertex.fromBufferAttribute(vertices, index).sub(center).multiplyScalar(width).add(center);
            vertices.setXYZ(index, vertex.x, vertex.y, vertex.z);
          }
        }
        geometry.computeVertexNormals();
        const material = new T.MeshPhysicalMaterial({
          color: "#cad1d6", metalness: 1, roughness: 0.19,
          clearcoat: 0.3, clearcoatRoughness: 0.17, envMapIntensity: 1.4,
        });
        releases.push(() => material.dispose());
        const shaderTime = { value: 0 };
        const distortion = { value: 0.025 };
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uMatterTime = shaderTime;
          shader.uniforms.uMatterAmount = distortion;
          const uniforms = "uniform float uMatterTime; uniform float uMatterAmount;\n";
          shader.vertexShader = uniforms + shader.vertexShader;
          // The inverse-transpose Jacobian keeps chrome reflections attached to the deformed surface.
          shader.vertexShader = shader.vertexShader.replace(
            "#include <beginnormal_vertex>",
            "#include <beginnormal_vertex>\nobjectNormal.y -= objectNormal.x * 2.0 * cos(position.y * 2.0 + uMatterTime) * uMatterAmount;",
          ).replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\ntransformed.x += sin(position.y * 2.0 + uMatterTime) * uMatterAmount;",
          );
        };
        const sculpture = new T.Mesh(geometry, material);
        sculpture.rotation.set(0.28, -0.45, -0.35);
        scene.add(sculpture);

        let visible = true;
        let lost = false;
        let time = 0;
        let entrance = 0;
        let scroll = 0;
        let scrollTarget = 0;
        let pulse = 0;
        let yaw = -0.45;
        let yawTarget = -0.45;
        let pointerX = 0;
        let pointerY = 0;
        let targetX = 0;
        let targetY = 0;
        let dragging = false;
        let lastX = 0;
        let dragVelocity = 0;
        let dragTime = 0;
        let samples = 0;
        let averageDelta = 1 / 60;
        let announced = false;

        const loop = createRenderLoop((dt) => {
          if (lost) return;
          if (!state.current.reduced) {
            time += dt;
            entrance = damp(entrance, 1, 1.8, dt);
            pointerX = damp(pointerX, targetX, motion.damping.pointer, dt);
            pointerY = damp(pointerY, targetY, motion.damping.pointer, dt);
            scroll = damp(scroll, scrollTarget, motion.damping.scroll, dt);
            if (!dragging) {
              yawTarget += (0.075 + dragVelocity) * dt;
              dragVelocity *= Math.exp(-dt * 3);
            }
            yaw = damp(yaw, yawTarget, motion.damping.rotation, dt);
            pulse = damp(pulse, 0, motion.damping.impulse, dt);
            sculpture.rotation.set(0.28 + pointerY * 0.16 + scroll * 0.2, yaw + pointerX * 0.22, -0.35 + Math.sin(time * 0.18) * 0.06);
            sculpture.position.set(scroll * 0.28, Math.sin(time * 0.55) * 0.04 - scroll * 0.18, 0);
            sculpture.scale.setScalar(0.84 + entrance * 0.16 + pulse * 0.035);
            shaderTime.value = time * 0.65;
            distortion.value = 0.025 + Math.abs(pointerX) * 0.035 + pulse * 0.17;
            camera.position.z = 7.1 + scroll * 0.8;
            averageDelta = damp(averageDelta, dt, 1, dt);
            // Preserve smooth silhouettes on dense mobile screens when reducing render cost.
            const minimumPixelRatio = Math.min(devicePixelRatio, compact ? 1.5 : 1);
            if (++samples === 150 && averageDelta > 0.026 && renderer.getPixelRatio() > minimumPixelRatio) {
              renderer.setPixelRatio(minimumPixelRatio);
              renderer.setSize(mount.clientWidth, mount.clientHeight);
            }
          }
          renderer.render(scene, camera);
          if (!announced) {
            announced = true;
            setReady(true);
            onReady(true);
          }
        });
        releases.push(() => loop.dispose());

        const updateVisibility = () => loop.setVisible(visible && !document.hidden && !lost);
        const updateMotion = () => {
          if (state.current.reduced) {
            entrance = 1;
            sculpture.scale.setScalar(1);
            pulse = 0;
            distortion.value = 0.025;
          }
          loop.setContinuous(!state.current.reduced);
        };
        control.current = {
          updateMotion,
          reshape: () => {
            if (state.current.reduced) return;
            pulse = 1;
            yawTarget += Math.PI * 0.55;
            loop.invalidate();
          },
        };
        const resize = () => {
          const w = Math.max(mount.clientWidth, 1);
          const h = Math.max(mount.clientHeight, 1);
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          loop.invalidate();
        };
        const move = (event: PointerEvent) => {
          const bounds = mount.getBoundingClientRect();
          targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
          targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
          if (dragging) {
            const delta = (event.clientX - lastX) * 0.006;
            const dt = Math.max((event.timeStamp - dragTime) / 1000, 0.008);
            yawTarget += delta;
            dragVelocity = Math.max(-2, Math.min(2, delta / dt));
            lastX = event.clientX;
            dragTime = event.timeStamp;
          }
        };
        const down = (event: PointerEvent) => {
          // Touch keeps normal page panning; the form button provides the same interaction.
          if (event.pointerType === "touch" || state.current.reduced) return;
          dragging = true;
          lastX = event.clientX;
          dragTime = event.timeStamp;
          mount.setPointerCapture(event.pointerId);
          mount.classList.add("is-dragging");
        };
        const up = (event: PointerEvent) => {
          dragging = false;
          mount.classList.remove("is-dragging");
          if (mount.hasPointerCapture(event.pointerId)) mount.releasePointerCapture(event.pointerId);
        };
        const leave = () => { if (!dragging) { targetX = 0; targetY = 0; } };
        const onScroll = () => {
          const section = mount.closest("section");
          if (section) scrollTarget = Math.max(0, Math.min(1.5, -section.getBoundingClientRect().top / section.clientHeight));
        };
        const contextLost = (event: Event) => {
          event.preventDefault();
          lost = true;
          loop.setVisible(false);
          setReady(false);
          onReady(false);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(mount);
        const intersection = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          updateVisibility();
        }, { rootMargin: "40px" });
        intersection.observe(mount);
        mount.addEventListener("pointermove", move);
        mount.addEventListener("pointerdown", down);
        mount.addEventListener("pointerup", up);
        mount.addEventListener("pointercancel", up);
        mount.addEventListener("pointerleave", leave);
        window.addEventListener("scroll", onScroll, { passive: true });
        document.addEventListener("visibilitychange", updateVisibility);
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        releases.push(() => {
          observer.disconnect();
          intersection.disconnect();
          mount.removeEventListener("pointermove", move);
          mount.removeEventListener("pointerdown", down);
          mount.removeEventListener("pointerup", up);
          mount.removeEventListener("pointercancel", up);
          mount.removeEventListener("pointerleave", leave);
          window.removeEventListener("scroll", onScroll);
          document.removeEventListener("visibilitychange", updateVisibility);
          renderer.domElement.removeEventListener("webglcontextlost", contextLost);
        });
        resize();
        onScroll();
        updateMotion();
        updateVisibility();
      } catch {
        release();
        if (!disposed) onReady(false);
      }
    }).catch(() => { if (!disposed) onReady(false); });

    return () => { disposed = true; release(); };
  }, [onReady]);

  return (
    <div className={`chrome-scene ${ready ? "is-ready" : ""}`} ref={host} aria-hidden="true" />
  );
}
