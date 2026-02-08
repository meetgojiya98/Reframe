"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Enterprise: subtle, non-distracting ambient tint */
const BLOB_COLORS = [
  "rgba(45, 138, 110, 0.18)",
  "rgba(34, 120, 100, 0.14)",
  "rgba(30, 100, 90, 0.12)",
  "rgba(25, 130, 110, 0.1)"
];

const PARALLAX_SPEED = 0.04;
const MOUSE_STRENGTH = 16;
const LERP = 0.04;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function DynamicBackground() {
  const [scrollY, setScrollY] = useState(0);
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const targetMouse = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const handleMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      targetMouse.current = { x, y };
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [reduceMotion]);

  const smoothStep = useCallback(() => {
    setSmoothMouse((prev) => ({
      x: reduceMotion ? 0 : lerp(prev.x, targetMouse.current.x, LERP),
      y: reduceMotion ? 0 : lerp(prev.y, targetMouse.current.y, LERP)
    }));
    rafRef.current = requestAnimationFrame(smoothStep);
  }, [reduceMotion]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(smoothStep);
    return () => cancelAnimationFrame(rafRef.current);
  }, [smoothStep]);

  const parallaxSpeed = reduceMotion ? 0 : PARALLAX_SPEED;
  const mouseStrength = reduceMotion ? 0 : MOUSE_STRENGTH;

  const blobs = [
    { color: BLOB_COLORS[0], baseX: 12, baseY: 10, size: 70, scrollFactor: 0.15, mouseFactor: 0.8 },
    { color: BLOB_COLORS[1], baseX: 82, baseY: 22, size: 58, scrollFactor: -0.12, mouseFactor: 0.7 },
    { color: BLOB_COLORS[2], baseX: 48, baseY: 68, size: 55, scrollFactor: 0.14, mouseFactor: 0.9 },
    { color: BLOB_COLORS[3], baseX: 85, baseY: 55, size: 45, scrollFactor: -0.08, mouseFactor: 0.6 }
  ];

  return (
    <div
      id="dynamic-background"
      aria-hidden
      className="fixed inset-0 z-[0] overflow-hidden pointer-events-none select-none"
      style={{
        background: "hsl(var(--background))",
        minHeight: "100dvh"
      }}
    >
      {/* Soft top gradient for depth without distraction */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(45, 138, 110, 0.08) 0%, transparent 55%)"
        }}
      />
      {blobs.map((blob, i) => {
        const scrollOffsetY = scrollY * parallaxSpeed * blob.scrollFactor * (i % 2 === 0 ? 1 : -1);
        const mx = smoothMouse.x * mouseStrength * blob.mouseFactor;
        const my = smoothMouse.y * mouseStrength * blob.mouseFactor;

        return (
          <div
            key={i}
            className="absolute rounded-full blur-[100px]"
            style={{
              left: `${blob.baseX}%`,
              top: `${blob.baseY}%`,
              width: "min(100vw, 520px)",
              height: "min(100vw, 520px)",
              minWidth: 320,
              minHeight: 320,
              transform: `translate(-50%, -50%) translate(${mx}px, ${my + scrollOffsetY}px)`,
              background: `radial-gradient(circle, ${blob.color} 0%, transparent 65%)`,
              willChange: "transform"
            }}
          />
        );
      })}
      {/* Subtle bottom fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(252, 251, 246, 0.5) 100%)"
        }}
      />
    </div>
  );
}
