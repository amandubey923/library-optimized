"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Hero3DLayer from "./visual/Hero3DLayer";

interface HeroVideoProps {
  onExploreClick?: () => void;
}

export default function HeroVideo({ onExploreClick }: HeroVideoProps) {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <section className="relative min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background Video or Fallback Poster */}
      {!reducedMotion && !videoError ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 scale-105 ${
            videoLoaded ? "opacity-35" : "opacity-0"
          }`}
        >
          <source src="/images/bg/bgvideo.mp4" type="video/mp4" />
        </video>
      ) : null}

      {/* Fallback Static Gradient / Texture when video is unavailable or reduced motion */}
      {(reducedMotion || videoError || !videoLoaded) && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('/images/login.jpg')" }}
        />
      )}

      {/* 3D Depth Layer */}
      <Hero3DLayer />

      {/* Cinematic Dark Overlays with theme variables */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/80 via-[var(--background)]/70 to-[var(--background)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--accent)]/10 via-transparent to-[var(--background)] pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
          <span>Free Public Reading Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--foreground)] font-serif leading-[1.1] mb-6">
          Stories worth <span className="text-gold-gradient italic">reading.</span>
          <br />
          Ideas worth <span className="text-[var(--accent)]">remembering.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-lg text-[var(--text-secondary)] font-normal leading-relaxed mb-8">
          Welcome to <strong className="text-[var(--accent-glow)] font-semibold">Reader&apos;s HUB</strong> — a modern, fast, and completely free digital reading space.
          Explore timeless Hindi literature, iconic world classics, and philosophical treatises with zero barriers.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {onExploreClick ? (
            <button
              onClick={onExploreClick}
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-sm shadow-xl hover:shadow-[0_0_20px_var(--theme-glow)] hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Explore Library</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <Link
              href="/library"
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-sm shadow-xl hover:shadow-[0_0_20px_var(--theme-glow)] hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>Explore Library</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}

          <Link
            href="#continue-reading"
            className="px-7 py-3.5 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/40 font-semibold text-sm shadow-md transition-all backdrop-blur-md flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Continue Reading</span>
          </Link>
        </div>

        {/* Quick Value Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl pt-6 border-t border-[var(--border)]/80">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent)] font-serif">25+</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">Curated Masterpieces</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent)] font-serif">100%</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">Free & Public Access</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent)] font-serif">0s</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">No Login / No Sign Up</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent)] font-serif">Multi</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">Hindi & World Editions</div>
          </div>
        </div>
      </div>
    </section>
  );
}
