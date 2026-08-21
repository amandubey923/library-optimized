"use client";

import React from "react";

export default function AmbientEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Top Ambient Glow Orb */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[130px] opacity-40 transition-colors duration-700"
        style={{
          background: "radial-gradient(ellipse at center, var(--theme-ambient-1, rgba(245, 158, 11, 0.15)), transparent 70%)",
        }}
      />

      {/* Subtle Side Embers */}
      <div
        className="absolute top-1/3 -left-32 w-80 h-80 rounded-full blur-[110px] opacity-30 transition-colors duration-700"
        style={{
          background: "radial-gradient(ellipse at center, var(--theme-ambient-2, rgba(217, 119, 6, 0.1)), transparent 70%)",
        }}
      />

      <div
        className="absolute bottom-20 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-25 transition-colors duration-700"
        style={{
          background: "radial-gradient(ellipse at center, var(--theme-ambient-1, rgba(245, 158, 11, 0.12)), transparent 70%)",
        }}
      />
    </div>
  );
}

