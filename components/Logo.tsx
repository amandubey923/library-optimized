"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  variant?: "full" | "icon" | "minimal";
}

export default function Logo({
  className = "",
  size = 36,
  showWordmark = false,
  variant = "icon",
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon / Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
        aria-label="Reader's HUB Logo"
      >
        <defs>
          {/* Theme-Adaptive Gradient for Left Page */}
          <linearGradient id="rh-left-page" x1="6" y1="12" x2="24" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent, #f59e0b)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--accent-secondary, #d97706)" stopOpacity="0.7" />
          </linearGradient>

          {/* Theme-Adaptive Gradient for Right Page */}
          <linearGradient id="rh-right-page" x1="42" y1="12" x2="24" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent-glow, #fbbf24)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent, #f59e0b)" stopOpacity="0.8" />
          </linearGradient>

          {/* Core Central Hub Gradient */}
          <linearGradient id="rh-hub-glow" x1="24" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="var(--accent, #f59e0b)" />
            <stop offset="100%" stopColor="var(--accent-secondary, #b45309)" />
          </linearGradient>

          {/* Soft Shadow Filter */}
          <filter id="rh-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Back Glow Ring */}
        <circle cx="24" cy="24" r="22" fill="var(--accent, #f59e0b)" fillOpacity="0.08" stroke="var(--accent, #f59e0b)" strokeOpacity="0.25" strokeWidth="1.2" strokeDasharray="3 3" />

        {/* Left Book Wing / Leaf */}
        <path
          d="M24 38C17 34 10 35 6 38V14C10 11 17 10 24 14V38Z"
          fill="url(#rh-left-page)"
          fillOpacity="0.85"
        />

        {/* Right Book Wing / Leaf */}
        <path
          d="M24 38C31 34 38 35 42 38V14C38 11 31 10 24 14V38Z"
          fill="url(#rh-right-page)"
        />

        {/* Dynamic Page Spine Arc */}
        <path
          d="M6 38C12 33 18 33 24 38C30 33 36 33 42 38"
          stroke="var(--foreground, #ffffff)"
          strokeOpacity="0.3"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Spine Divider */}
        <line
          x1="24"
          y1="13"
          x2="24"
          y2="38"
          stroke="var(--background, #0b0d13)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Elevated Digital Hub / Luminary Nexus Spark */}
        <g filter="url(#rh-glow)">
          {/* Central Nexus Diamond */}
          <path
            d="M24 6L28 14L24 22L20 14Z"
            fill="url(#rh-hub-glow)"
          />
          {/* Center Light Pin */}
          <circle cx="24" cy="14" r="2" fill="#ffffff" />
        </g>
      </svg>

      {/* Optional Wordmark */}
      {showWordmark && (
        <div className="flex flex-col min-w-0">
          <span className="font-black text-[15px] sm:text-[18px] tracking-tight text-[var(--foreground)] flex items-center gap-1.5 font-serif leading-none truncate">
            READER&apos;S <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent font-black">HUB</span>
          </span>
          <span className="hidden sm:block text-[9.5px] tracking-widest uppercase text-[var(--text-secondary)] font-bold mt-1">
            Read • Learn • Discover
          </span>
        </div>
      )}
    </div>
  );
}

