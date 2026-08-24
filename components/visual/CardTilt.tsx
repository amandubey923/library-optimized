"use client";

import React, { useRef, useState, useEffect, ReactNode } from "react";

interface CardTiltProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function CardTilt({
  children,
  className = "",
  maxTilt = 6,
}: CardTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isTouch && !prefersReducedMotion) {
      setEnabled(true);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
    if (glareRef.current) {
      const glareX = ((x / rect.width) * 100).toFixed(1);
      const glareY = ((y / rect.height) * 100).toFixed(1);
      glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.15), transparent 60%)`;
      glareRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    if (!enabled || !cardRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
  };

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-200 ease-out ${className}`}
      style={{
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
        transformStyle: "preserve-3d",
      }}
    >
      {children}

      {/* Dynamic Glare Overlay */}
      <div
        ref={glareRef}
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-20 opacity-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15), transparent 60%)",
        }}
      />
    </div>
  );
}

