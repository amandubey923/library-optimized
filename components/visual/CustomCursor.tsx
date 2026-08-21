"use client";

import React, { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Only enable on desktop pointer devices with fine precision and no reduced motion
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmall = window.innerWidth < 1024;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || isSmall || prefersReducedMotion) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    let animationFrameId: number;
    let targetX = -100;
    let targetY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("textarea") ||
          target.closest("select") ||
          target.closest(".cursor-pointer") ||
          target.tagName === "BUTTON" ||
          target.tagName === "A")
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const updatePosition = () => {
      setPosition((prev) => ({
        x: prev.x + (targetX - prev.x) * 0.28,
        y: prev.y + (targetY - prev.y) * 0.28,
      }));
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!enabled || !isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 transition-opacity duration-300 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    >
      {/* Refined Diamond / 4-Point Star Element */}
      <div
        className={`relative flex items-center justify-center transition-all duration-200 ease-out ${
          isHovered
            ? "scale-125 rotate-45"
            : "scale-100 rotate-0 opacity-80"
        }`}
      >
        {/* Subtle Ambient Glow */}
        <div
          className="absolute w-4 h-4 rounded-full blur-[2px] transition-opacity"
          style={{
            background: "var(--accent)",
            opacity: isHovered ? 0.45 : 0.2,
          }}
        />

        {/* 4-Point Crosshair Star Lines */}
        <svg
          className="w-4 h-4 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth={isHovered ? "2" : "1.75"}
          strokeLinecap="round"
        >
          {/* Subtle Diamond Path */}
          <polygon
            points="12,3 15,12 12,21 9,12"
            fill="var(--accent)"
            fillOpacity={isHovered ? "0.3" : "0.15"}
          />
          <polygon
            points="3,12 12,15 21,12 12,9"
            fill="var(--accent)"
            fillOpacity={isHovered ? "0.3" : "0.15"}
          />
        </svg>

        {/* Crisp Center Pin Dot */}
        <div
          className={`absolute rounded-full transition-all duration-150 ${
            isHovered
              ? "w-1.5 h-1.5 bg-[var(--primary-foreground)] shadow-[0_0_8px_var(--accent)]"
              : "w-1 h-1 bg-[var(--accent)]"
          }`}
        />
      </div>
    </div>
  );
}
