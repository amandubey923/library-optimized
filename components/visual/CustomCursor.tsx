"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const cursorRef = useRef<HTMLDivElement>(null);
  const handPointerRef = useRef<HTMLDivElement>(null);
  const clickRippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const checkSupport = () => {
      const isFine = finePointerQuery.matches && !("ontouchstart" in window && window.innerWidth < 768);
      setEnabled(isFine);
      if (typeof document !== "undefined") {
        setPortalTarget(document.fullscreenElement ? (document.fullscreenElement as HTMLElement) : document.body);
      }
    };

    checkSupport();
    finePointerQuery.addEventListener?.("change", checkSupport);

    // Update portal target on fullscreen change so cursor is ALWAYS single and inside the active viewport
    const handleFullscreenChange = () => {
      if (typeof document !== "undefined") {
        setPortalTarget(document.fullscreenElement ? (document.fullscreenElement as HTMLElement) : document.body);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    if (!finePointerQuery.matches) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let isHovered = false;
    let isMouseDown = false;
    let isVisible = false;
    let isHiddenForStudy = false;
    let animFrameId: number;

    const prefersReducedMotion = reducedMotionQuery.matches;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
      }

      // Check clickable element state and study mode canvas
      const target = e.target as HTMLElement | null;
      if (target) {
        // If actively over study drawing canvas, let the study reticle take over
        const isDrawingCanvas = target.closest("canvas") || target.closest(".react-pdf__Page") || target.tagName === "CANVAS";
        const isStudyActive = target.closest("[data-study-active='true']");
        if (isStudyActive && isDrawingCanvas) {
          isHiddenForStudy = true;
        } else {
          isHiddenForStudy = false;
        }

        if (
          target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("textarea") ||
          target.closest("select") ||
          target.closest("[role='button']") ||
          target.closest(".cursor-pointer") ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT"
        ) {
          isHovered = true;
        } else {
          isHovered = false;
        }
      }
    };

    const handleMouseDown = () => {
      isMouseDown = true;
      if (clickRippleRef.current && !prefersReducedMotion && !isHiddenForStudy) {
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
      if (cursorRef.current && !isHiddenForStudy) {
        cursorRef.current.style.opacity = "1";
      }
    };

    // Fast, zero-lag 60-120 FPS render loop
    const renderLoop = () => {
      if (isVisible) {
        const ease = 0.75;
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;

        if (cursorRef.current) {
          cursorRef.current.style.opacity = isHiddenForStudy ? "0" : "1";
          cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }

        // Hand Pointer scale on hover and click
        if (handPointerRef.current) {
          let scale = 1.0;
          if (isMouseDown) {
            scale = 0.92;
          } else if (isHovered) {
            scale = 1.06;
          }
          handPointerRef.current.style.transform = `translate(-5.5px, 0px) scale(${scale})`;
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
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      finePointerQuery.removeEventListener?.("change", checkSupport);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  if (!enabled || !portalTarget) return null;

  const cursorContent = (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[99999] opacity-0 select-none will-change-transform"
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

      {/* Single Hand Pointer Graphic with Index Fingertip Aligned to (0,0) */}
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
  );

  return createPortal(cursorContent, portalTarget);
}
