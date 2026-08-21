"use client";

import React, { useEffect, useState, useRef } from "react";

export default function Hero3DLayer() {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check reduced motion or very small screens
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 768;

    if (prefersReducedMotion || isSmall) {
      setEnabled(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 16; // subtle max 8deg tilt
      const y = (e.clientY / innerHeight - 0.5) * -16;
      setRotate({ x: y, y: x });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0 select-none"
      aria-hidden="true"
      style={{ perspective: "1000px" }}
    >
      {/* Floating 3D Prismatic Volume behind the hero text */}
      <div
        className="relative w-[340px] h-[460px] sm:w-[480px] sm:h-[580px] transition-transform duration-500 ease-out"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(0px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Layer 1: Ambient 3D Depth Rings */}
        <div
          className="absolute inset-0 rounded-full border border-[var(--accent)]/15 animate-spin-slow transition-colors duration-700"
          style={{
            transform: "translateZ(-40px) scale(1.1)",
            boxShadow: "0 0 45px var(--theme-glow, rgba(245,158,11,0.15))",
          }}
        />

        {/* Layer 2: Subtle Floating 3D Book Silhouette / Folio Spine */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 sm:w-60 sm:h-80 rounded-2xl border border-[var(--accent)]/25 bg-[var(--card)]/20 backdrop-blur-sm shadow-2xl transition-all duration-700"
          style={{
            transform: "translateZ(-20px) rotateY(-10deg) rotateX(6deg)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.5), inset 0 0 20px var(--theme-glow)",
          }}
        >
          {/* Subtle Book Spine Gold Detail */}
          <div className="absolute left-3 top-4 bottom-4 w-1 rounded-full bg-[var(--accent)] opacity-40" />
          {/* Subtle Page Lines */}
          <div className="absolute right-4 top-8 bottom-8 space-y-2 opacity-20">
            <div className="w-16 h-1 bg-[var(--foreground)] rounded" />
            <div className="w-24 h-1 bg-[var(--foreground)] rounded" />
            <div className="w-20 h-1 bg-[var(--foreground)] rounded" />
          </div>
        </div>

        {/* Layer 3: Central Luminary Core Spark */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-xl opacity-60 transition-colors duration-700"
          style={{
            background: "var(--accent-glow, #fbbf24)",
            transform: "translateZ(30px)",
          }}
        />
      </div>
    </div>
  );
}

