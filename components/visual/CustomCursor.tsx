"use client";

import React, { useEffect, useRef, useState } from "react";

interface TrailPoint {
  x: number;
  y: number;
}

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const coreDiamondRef = useRef<HTMLDivElement>(null);
  const trailContainerRef = useRef<HTMLDivElement>(null);

  // Particle trails refs (5 micro energy particles)
  const trailDotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Check if the device has a fine pointer (desktop mouse/trackpad) and not reduced motion
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const checkSupport = () => {
      const isFine = finePointerQuery.matches && !("ontouchstart" in window && window.innerWidth < 768);
      setEnabled(isFine);
    };

    checkSupport();
    finePointerQuery.addEventListener?.("change", checkSupport);

    if (!finePointerQuery.matches) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let isHovered = false;
    let isMouseDown = false;
    let isVisible = false;
    let animFrameId: number;

    const numTrailPoints = 5;
    const trailHistory: TrailPoint[] = Array.from({ length: numTrailPoints }, () => ({
      x: -100,
      y: -100,
    }));

    const prefersReducedMotion = reducedMotionQuery.matches;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
        for (let i = 0; i < numTrailPoints; i++) {
          trailHistory[i].x = targetX;
          trailHistory[i].y = targetY;
        }
      }

      // Check hover state efficiently
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("textarea") ||
          target.closest("select") ||
          target.closest("[role='button']") ||
          target.closest(".cursor-pointer") ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT")
      ) {
        isHovered = true;
      } else {
        isHovered = false;
      }
    };

    const handleMouseDown = () => {
      isMouseDown = true;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseLeave = () => {
      isVisible = false;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }
    };

    const handleMouseEnter = () => {
      isVisible = true;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "1";
      }
    };

    // 60-120 FPS Ultra-Smooth Animation Loop without React re-renders
    const renderLoop = () => {
      if (isVisible) {
        // Smooth lerp movement for main diamond
        const ease = 0.38;
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;

        if (cursorRef.current) {
          cursorRef.current.style.opacity = "1";
          cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }

        // Diamond state transformations (hover/click)
        if (coreDiamondRef.current) {
          let scale = 1;
          if (isMouseDown) {
            scale = 0.85;
          } else if (isHovered) {
            scale = 1.25;
          }
          coreDiamondRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
          coreDiamondRef.current.setAttribute("data-hover", isHovered ? "true" : "false");
        }

        // Update trail particles lerp history (unless reduced motion is enabled)
        if (!prefersReducedMotion) {
          let prevX = currentX;
          let prevY = currentY;

          for (let i = 0; i < numTrailPoints; i++) {
            const trailEase = 0.45 - i * 0.05;
            trailHistory[i].x += (prevX - trailHistory[i].x) * trailEase;
            trailHistory[i].y += (prevY - trailHistory[i].y) * trailEase;

            prevX = trailHistory[i].x;
            prevY = trailHistory[i].y;

            const dotEl = trailDotsRef.current[i];
            if (dotEl) {
              dotEl.style.transform = `translate3d(${trailHistory[i].x}px, ${trailHistory[i].y}px, 0) translate(-50%, -50%)`;
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    animFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      finePointerQuery.removeEventListener?.("change", checkSupport);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* -------------------------------------------------------------
       * Trailing Digital Plasma Energy Particles
       * ------------------------------------------------------------- */}
      <div
        ref={trailContainerRef}
        className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden select-none"
        aria-hidden="true"
      >
        {[0.75, 0.55, 0.38, 0.22, 0.1].map((opacity, idx) => {
          const size = Math.max(1.5, 4 - idx * 0.65);
          return (
            <div
              key={idx}
              ref={(el) => {
                trailDotsRef.current[idx] = el;
              }}
              className="absolute top-0 left-0 rounded-full transition-opacity duration-150"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: "var(--accent)",
                boxShadow: "0 0 6px var(--accent-glow)",
                opacity: opacity,
                willChange: "transform",
              }}
            />
          );
        })}
      </div>

      {/* -------------------------------------------------------------
       * Main Futuristic Geometric Diamond HUD Cursor
       * ------------------------------------------------------------- */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] opacity-0 select-none will-change-transform"
        aria-hidden="true"
      >
        <div
          ref={coreDiamondRef}
          className="relative flex items-center justify-center transition-transform duration-150 ease-out"
          style={{ width: "22px", height: "22px" }}
        >
          {/* Ambient Outer Halo Glow */}
          <div
            className="absolute w-5 h-5 rounded-full blur-[3px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
              opacity: 0.45,
            }}
          />

          {/* Precision Geometric Diamond SVG with Corner HUD Ticks */}
          <svg
            className="w-4 h-4 overflow-visible filter drop-shadow-[0_0_3px_var(--accent)]"
            viewBox="0 0 24 24"
            fill="none"
          >
            {/* Outer Diamond Silhouette */}
            <polygon
              points="12,2 22,12 12,22 2,12"
              stroke="var(--accent)"
              strokeWidth="1.6"
              fill="var(--accent)"
              fillOpacity="0.18"
              strokeLinejoin="round"
            />

            {/* Inner Precision Diamond Reticle */}
            <polygon
              points="12,6 18,12 12,18 6,12"
              stroke="var(--accent)"
              strokeWidth="1"
              strokeDasharray="2,2"
              fill="none"
              opacity="0.65"
            />

            {/* Micro HUD Precision Corner Ticks */}
            <line x1="12" y1="0" x2="12" y2="3" stroke="var(--accent-glow)" strokeWidth="1.5" />
            <line x1="21" y1="12" x2="24" y2="12" stroke="var(--accent-glow)" strokeWidth="1.5" />
            <line x1="12" y1="21" x2="12" y2="24" stroke="var(--accent-glow)" strokeWidth="1.5" />
            <line x1="0" y1="12" x2="3" y2="12" stroke="var(--accent-glow)" strokeWidth="1.5" />
          </svg>

          {/* Luminous Center Core Spark / Pin Dot */}
          <div
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: "var(--foreground)",
              boxShadow: "0 0 5px var(--accent-glow), 0 0 10px var(--accent)",
            }}
          />
        </div>
      </div>
    </>
  );
}
