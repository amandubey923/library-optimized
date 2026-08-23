"use client";

import React, { useEffect, useRef, useState } from "react";

interface TrailPoint {
  x: number;
  y: number;
}

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const handPointerRef = useRef<HTMLDivElement>(null);
  const clickRippleRef = useRef<HTMLDivElement>(null);
  const trailContainerRef = useRef<HTMLDivElement>(null);

  // Micro trail points for subtle tactile tracking
  const trailDotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
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

    const numTrailPoints = 2;
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

      // Check clickable element state
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
      if (clickRippleRef.current && !prefersReducedMotion) {
        clickRippleRef.current.style.transition = "none";
        clickRippleRef.current.style.transform = "translate(-5.5px, 0px) scale(0.6)";
        clickRippleRef.current.style.opacity = "0.7";
        void clickRippleRef.current.offsetHeight; // force reflow
        clickRippleRef.current.style.transition = "transform 160ms cubic-bezier(0.1, 0.9, 0.2, 1), opacity 160ms ease-out";
        clickRippleRef.current.style.transform = "translate(-5.5px, 0px) scale(1.3)";
        clickRippleRef.current.style.opacity = "0";
      }
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

    // Ultra-Responsive 60-120 FPS Animation Loop
    const renderLoop = () => {
      if (isVisible) {
        // Fast, zero-lag pointer tracking
        const ease = 0.6;
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;

        if (cursorRef.current) {
          cursorRef.current.style.opacity = "1";
          cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }

        // Hand Pointer Transformations (Subtle 5-8% scale on hover and tactile click pulse)
        if (handPointerRef.current) {
          let scale = 1.0;
          if (isMouseDown) {
            scale = 0.92;
          } else if (isHovered) {
            scale = 1.06;
          }
          handPointerRef.current.style.transform = `translate(-5.5px, 0px) scale(${scale})`;
          handPointerRef.current.setAttribute("data-hover", isHovered ? "true" : "false");
        }

        // Update subtle trail points (unless reduced motion)
        if (!prefersReducedMotion) {
          let prevX = currentX;
          let prevY = currentY;

          for (let i = 0; i < numTrailPoints; i++) {
            const trailEase = 0.6 - i * 0.12;
            trailHistory[i].x += (prevX - trailHistory[i].x) * trailEase;
            trailHistory[i].y += (prevY - trailHistory[i].y) * trailEase;

            prevX = trailHistory[i].x;
            prevY = trailHistory[i].y;

            const dotEl = trailDotsRef.current[i];
            if (dotEl) {
              dotEl.style.transform = `translate3d(${trailHistory[i].x}px, ${trailHistory[i].y}px, 0) translate(-5.5px, 0px)`;
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
       * Micro Tactile Trail (1-2 tiny dots, instant fade)
       * ------------------------------------------------------------- */}
      <div
        ref={trailContainerRef}
        className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden select-none"
        aria-hidden="true"
      >
        {[0.25, 0.1].map((opacity, idx) => {
          const size = Math.max(1, 2 - idx * 0.8);
          return (
            <div
              key={idx}
              ref={(el) => {
                trailDotsRef.current[idx] = el;
              }}
              className="absolute top-0 left-0 rounded-full transition-opacity duration-100 pointer-events-none"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: "var(--accent)",
                boxShadow: "0 0 2px var(--accent-glow)",
                opacity: opacity,
                willChange: "transform",
              }}
            />
          );
        })}
      </div>

      {/* -------------------------------------------------------------
       * Premium White Hand / Index Finger Pointer (Active Everywhere)
       * ------------------------------------------------------------- */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] opacity-0 select-none will-change-transform"
        aria-hidden="true"
      >
        {/* Subtle Fingertip Click Ripple */}
        <div
          ref={clickRippleRef}
          className="absolute top-0 left-0 w-3.5 h-3.5 rounded-full border border-[var(--accent)] pointer-events-none opacity-0"
          style={{
            transform: "translate(-5.5px, 0px) scale(0.6)",
          }}
        />

        {/* Hand Pointer Graphic with Index Fingertip Aligned to (0,0) */}
        <div
          ref={handPointerRef}
          className="relative transition-transform duration-120 ease-out will-change-transform"
          style={{
            transform: "translate(-5.5px, 0px)",
          }}
        >
          <svg
            width="24"
            height="26"
            viewBox="0 0 24 26"
            fill="none"
            className="filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.55)] select-none pointer-events-none"
          >
            {/* Crisp White Hand / Finger Pointer Silhouette */}
            <path
              d="M7 1.5C7 0.671573 6.32843 0 5.5 0C4.67157 0 4 0.671573 4 1.5V11.5L2.6 10.1C2.01421 9.51421 1.06447 9.51421 0.47868 10.1C-0.107107 10.6858 -0.107107 11.6355 0.47868 12.2213L5.68579 17.4284C6.73289 18.4755 8.15264 19.0625 9.63301 19.0625H13.25C15.7353 19.0625 17.75 17.0478 17.75 14.5625V10C17.75 9.17157 17.0784 8.5 16.25 8.5C15.4216 8.5 14.75 9.17157 14.75 10V9C14.75 8.17157 14.0784 7.5 13.25 7.5C12.4216 7.5 11.75 8.17157 11.75 9V8C11.75 7.17157 11.0784 6.5 10.25 6.5C9.42157 6.5 8.75 7.17157 8.75 8V1.5C8.75 0.671573 8.07843 0 7.25 0C6.42157 0 5.75 0.671573 5.75 1.5Z"
              fill="#FFFFFF"
              stroke="#18181B"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Subtle Finger Contour Line Accents */}
            <path d="M5.5 2.2V5" stroke="#E4E4E7" strokeWidth="0.75" strokeLinecap="round" />
            <path d="M8.75 9.5H10.25" stroke="#D4D4D8" strokeWidth="0.75" strokeLinecap="round" />
            <path d="M11.75 10.5H13.25" stroke="#D4D4D8" strokeWidth="0.75" strokeLinecap="round" />
            <path d="M14.75 11.5H16.25" stroke="#D4D4D8" strokeWidth="0.75" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  );
}
