"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface AboutClientProps {
  totalBooks: number;
  totalCategories: number;
}

export default function AboutClient({ totalBooks, totalCategories }: AboutClientProps) {
  const [activeTab, setActiveTab] = useState<"origin" | "philosophy" | "engineering">("origin");

  const platformPillars = [
    {
      step: "01",
      tag: "THE MISSION",
      title: "Zero Friction & Open Access",
      description:
        "Frustrated by ad-cluttered websites and subscription paywalls, Reader's HUB was engineered to strip away all barriers. Literature opens instantaneously with zero accounts, zero tracking, and zero cost.",
      icon: "⚡",
      highlights: ["No paywalls or ads", "Zero login required", "100% Free public access"],
    },
    {
      step: "02",
      tag: "THE EXPERIENCE",
      title: "Distraction-Free Reading",
      description:
        "Engineered for deep focus with single/dual-page spreads, custom zoom controls, distraction-free Focus Mode, full-text search, and a daily Diwali Diya reading streak tracker.",
      icon: "📖",
      highlights: ["Fast PDF rendering", "Daily reading streak", "7 Dynamic theme styles"],
    },
    {
      step: "03",
      tag: "THE ARCHITECTURE",
      title: "Modern Full-Stack Core",
      description:
        "Powered by Next.js App Router and TypeScript. Employs SSG prerendering across 370+ routes, an automated 3-tier Sharp WebP cover generator, and an integrated Gemini AI Assistant.",
      icon: "⚙️",
      highlights: ["Next.js SSG prerendering", "Sharp & WebP engine", "Gemini AI Library Assistant"],
    },
    {
      step: "04",
      tag: "THE PRESERVATION",
      title: "Preserving Timeless Wisdom",
      description:
        "Curating Hindi literature by Premchand and Bachchan alongside Upanishadic treatises, stoic philosophy, and modern technical knowledge in one unified, searchable ecosystem.",
      icon: "🌍",
      highlights: ["Hindi & Classical Literature", "Philosophy & Non-Fiction", "Comprehensive technical notes"],
    },
  ];

  const technologies = [
    {
      name: "Next.js (App Router)",
      category: "Core Framework",
      why: "Production React framework with App Router, SSG prerendering & API routes.",
      benefit: "Sub-second page delivery, zero hydration lag, and static rendering across 370+ books.",
      iconSvg: (
        <svg className="w-6 h-6 text-[var(--foreground)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z" />
        </svg>
      ),
    },
    {
      name: "React 19",
      category: "UI Architecture",
      why: "Modern UI library with concurrent transitions & Server Component models.",
      benefit: "Silky 60fps animations, instant React Portals, and fluid user interactions.",
      iconSvg: (
        <svg className="w-6 h-6 text-[#61DAFB]" viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor">
          <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
          <g stroke="#61DAFB" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      ),
    },
    {
      name: "TypeScript",
      category: "Language Core",
      why: "Strict static type system applied across the entire application and data pipelines.",
      benefit: "Prevents runtime crashes, guarantees catalog consistency, and accelerates refactoring.",
      iconSvg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#3178C6" />
          <path d="M4.5 10.5H11.5V12.5H9.25V19.5H6.75V12.5H4.5V10.5Z" fill="white" />
          <path d="M12.5 16.5C12.5 15.5 13.2 14.8 14.2 14.5L16.2 13.8C16.8 13.6 17.1 13.3 17.1 12.8C17.1 12.2 16.6 11.8 15.8 11.8C14.9 11.8 14.1 12.2 13.5 12.7L12.5 11.2C13.4 10.4 14.7 10 16 10C18 10 19.5 11.1 19.5 12.8C19.5 14 18.7 14.8 17.6 15.2L15.6 15.9C15.1 16.1 14.8 16.4 14.8 16.8C14.8 17.5 15.4 17.9 16.3 17.9C17.3 17.9 18.2 17.4 19 16.7L20 18.2C18.9 19.2 17.5 19.7 16 19.7C13.8 19.7 12.5 18.4 12.5 16.5Z" fill="white" />
        </svg>
      ),
    },
    {
      name: "Tailwind CSS",
      category: "Design System",
      why: "Utility-first CSS styling powered by dynamic theme custom property tokens.",
      benefit: "Instant real-time theme customization across 7 palettes with zero CSS overhead.",
      iconSvg: (
        <svg className="w-6 h-6 text-[#38BDF8]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
        </svg>
      ),
    },
    {
      name: "PDF.js & Web Workers",
      category: "Document Core",
      why: "Canvas document rendering offloaded entirely to background Web Workers.",
      benefit: "High-DPI rendering, responsive dual-page mode, and zero UI thread freeze.",
      iconSvg: (
        <svg className="w-6 h-6 text-[#E02424]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 3H4.5C3.67 3 3 3.67 3 4.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm-8.25 11.25H9.75v1.5H8.25V8.25h3c1.24 0 2.25 1.01 2.25 2.25v1.5c0 1.24-1.01 2.25-2.25 2.25zm5.25-3h-1.5v4.5h-1.5V8.25h3c.83 0 1.5.67 1.5 1.5v1.5c0 .83-.67 1.5-1.5 1.5zm-5.25-3H9.75v1.5h1.5c.41 0 .75-.34.75-.75s-.34-.75-.75-.75z" />
        </svg>
      ),
    },
    {
      name: "Sharp & WebP",
      category: "Asset Pipeline",
      why: "Automated Node.js image pipeline generating 3-tier WebP editorial covers.",
      benefit: "80% smaller cover payloads, crisp 600×900 resolution, and instant gallery scroll.",
      iconSvg: (
        <svg className="w-6 h-6 text-[#00ACC1]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L4.5 7 12 3.25 19.5 7 12 10.5zm-8 4.25l8 4 8-4v2.5l-8 4-8-4v-2.5zm0-4l8 4 8-4v2.5l-8 4-8-4v-2.5z" />
        </svg>
      ),
    },
    {
      name: "Google Gemini AI",
      category: "Intelligence",
      why: "Server-side streaming API connecting Gemini LLM with grounded library context.",
      benefit: "Smart literary recommendations, contextual discovery, and intelligent book query assistance.",
      iconSvg: (
        <svg className="w-6 h-6 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12Z" />
        </svg>
      ),
    },
    {
      name: "Local-First Storage",
      category: "Data Privacy",
      why: "Zero-cloud architecture utilizing browser localStorage & IndexedDB paradigms.",
      benefit: "100% private notes, reading analytics, bookmarks, and streaks with zero external telemetry.",
      iconSvg: (
        <svg className="w-6 h-6 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 5c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3Z" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      ),
    },
  ];

  const developerHighlights = {
    origin: {
      badge: "CREATOR VISION",
      title: "Why I Built Reader's HUB as a Solo Engineer",
      paragraphs: [
        "I created Reader's HUB to solve a frustration shared by avid readers: the modern web has turned reading into an obstacle course of subscriptions, cookie banners, tracking scripts, and clunky PDF readers.",
        "As an Information Technology engineer, I wanted to build a digital reading sanctum that honors literature. Every interface element, canvas rendering pipeline, and theme palette was designed from scratch to deliver a calm, distraction-free reading experience.",
      ],
      points: [
        "Solo-engineered architecture: full-stack, UI/UX, pipeline, and AI integration",
        "Curated collection spanning classics, Hindi literature, philosophy, and technical guides",
        "Strict local-first privacy: no telemetry, no tracking, complete reader ownership",
      ],
    },
    philosophy: {
      badge: "ENGINEERING MINDSET",
      title: "Craftsmanship, Performance & Disciplined Code",
      paragraphs: [
        "Good software should feel effortless, load instantly, and respect the user's attention. I prioritize clean component hierarchies, rigorous type safety, and foundational computer science principles over quick shortcuts.",
        "From optimizing PDF canvas worker threads to pre-generating 370+ static HTML pages during builds, every technical choice in Reader's HUB was made to maximize performance and longevity.",
      ],
      points: [
        "Performance-first architecture: sub-second route transitions & instant search",
        "Algorithmic problem-solving discipline (250+ LeetCode & GeeksforGeeks problems solved)",
        "Long-term structural maintainability over disposable code hacks",
      ],
    },
    engineering: {
      badge: "TECHNICAL PILLARS",
      title: "Production-Grade Engineering Highlights",
      paragraphs: [
        "Reader's HUB integrates several custom-engineered subsystems: a multi-theme color matrix using CSS custom properties, an automated 3-tier cover generation engine using Sharp, and a grounded Gemini AI assistant.",
        "The application is built to run entirely offline for active reads, utilizing browser localStorage and IndexedDB paradigms to ensure zero dependence on third-party servers.",
      ],
      points: [
        "Custom 3-Tier WebP cover generation pipeline (1200w / 600w / 300w)",
        "Dynamic theme switcher with 7 contrast-tested visual palettes",
        "In-browser annotation drawing canvas with normalized coordinate mapping",
      ],
    },
  };

  return (
    <div className="space-y-12 sm:space-y-20 lg:space-y-24 max-w-6xl mx-auto relative overflow-x-clip px-1 sm:px-2">
      {/* Global Background Ambient Glow Orbs */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-[700px] h-[350px] rounded-full blur-[140px] opacity-25 -z-10"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, var(--primary) 45%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute top-[40%] -right-20 sm:-right-40 w-[80vw] max-w-[500px] h-[350px] rounded-full blur-[140px] opacity-15 -z-10"
        style={{
          background: "radial-gradient(circle, var(--primary) 0%, var(--accent) 50%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute top-[75%] -left-20 sm:-left-40 w-[80vw] max-w-[500px] h-[350px] rounded-full blur-[140px] opacity-15 -z-10"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, var(--primary) 50%, transparent 70%)",
        }}
      />

      {/* -------------------------------------------------------------
       * HERO SECTION: Compact Cinematic Overview & Platform Stats
       * ------------------------------------------------------------- */}
      <section className="relative pt-2 sm:pt-4 pb-4 sm:pb-6 text-center space-y-4 sm:space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] text-[var(--accent)] text-[11px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest shadow-[0_0_20px_var(--theme-glow)]/20 transition-all hover:scale-105 hover:border-[var(--accent)]/40 max-w-full">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse flex-shrink-0" />
          <span className="truncate">Platform Overview &amp; Developer Story</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-[var(--foreground)] tracking-tight leading-[1.18] sm:leading-[1.12] max-w-3xl mx-auto break-words">
          A barrier-free digital reading sanctuary,{" "}
          <span className="italic text-[var(--accent)] bg-clip-text drop-shadow-[0_0_25px_var(--theme-glow)]">
            built with craftsmanship.
          </span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto font-normal px-2">
          Conceived and engineered by <strong className="text-[var(--foreground)] font-semibold">Aman Dubey</strong> as a solo full-stack project — Reader&#39;s HUB strips away subscriptions, paywalls, and clunky interfaces to deliver pure, distraction-free literature.
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-1">
          <Link
            href="/library"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-xs shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_24px_var(--theme-glow)] flex items-center justify-center gap-2"
          >
            <span>Explore the Library</span>
            <span>→</span>
          </Link>
          <a
            href="#developer-story"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[var(--card)]/90 hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/60 font-semibold text-xs transition-all shadow-xs hover:scale-102 hover:shadow-[0_0_15px_var(--theme-glow)]/30 text-center"
          >
            Read Developer Story ↓
          </a>
        </div>

        {/* Platform Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-3 sm:pt-4 max-w-4xl mx-auto w-full">
          <div className="p-3.5 sm:p-5 rounded-2xl glass-card border border-[var(--border)] text-center space-y-1 hover:border-[var(--accent)]/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_-10px_var(--theme-glow)] group">
            <div className="text-xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {totalBooks}+
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Digital Volumes
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl glass-card border border-[var(--border)] text-center space-y-1 hover:border-[var(--accent)]/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_-10px_var(--theme-glow)] group">
            <div className="text-xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {totalCategories}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Curated Genres
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl glass-card border border-[var(--border)] text-center space-y-1 hover:border-[var(--accent)]/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_-10px_var(--theme-glow)] group">
            <div className="text-xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              0s
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Zero Login Barrier
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl glass-card border border-[var(--border)] text-center space-y-1 hover:border-[var(--accent)]/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_-10px_var(--theme-glow)] group">
            <div className="text-xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              100%
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Private &amp; Local-First
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
       * SECTION 2: WHY IT WAS BUILT & PLATFORM PILLARS
       * ------------------------------------------------------------- */}
      <section className="space-y-4 sm:space-y-6 text-left relative">
        <div className="max-w-xl space-y-1 sm:space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <span>✦</span>
            <span>Core Pillars</span>
          </div>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Why Reader&#39;s HUB Exists
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Every feature was thoughtfully engineered around the reader&#39;s focus, ease of access, and privacy.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-5 w-full">
          {platformPillars.map((pillar) => (
            <div
              key={pillar.step}
              className="p-3 sm:p-7 rounded-xl sm:rounded-2xl glass-panel border border-[var(--border)] hover:border-[var(--accent)]/60 transition-all duration-300 space-y-1.5 sm:space-y-3 relative group bg-[var(--card)]/75 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_var(--theme-glow)] overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <span className="text-base sm:text-2xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">{pillar.icon}</span>
                    <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest text-[var(--accent)] truncate">
                      {pillar.step} — {pillar.tag}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs sm:text-lg font-bold font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                  {pillar.title}
                </h3>

                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] leading-snug sm:leading-relaxed font-normal line-clamp-3 sm:line-clamp-none">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-1 flex flex-wrap gap-1 sm:gap-1.5">
                {pillar.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded sm:rounded-lg bg-[var(--secondary)] text-[var(--foreground)] text-[8px] sm:text-[10px] font-medium border border-[var(--border)] group-hover:border-[var(--accent)]/30 transition-colors truncate max-w-full"
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
       * SECTION 3: VERIFIED TECH STACK
       * ------------------------------------------------------------- */}
      <section className="space-y-4 sm:space-y-6 text-left relative">
        <div className="max-w-xl space-y-1 sm:space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <span>⚡</span>
            <span>Architecture &amp; Stack</span>
          </div>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Engineered with Modern Tools
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Production-grade technologies powering the speed, aesthetics, and reliability of Reader&#39;s HUB:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl glass-card border border-[var(--border)] hover:border-[var(--accent)]/60 transition-all duration-300 space-y-2 sm:space-y-3 bg-[var(--card)]/80 hover:scale-[1.02] hover:shadow-[0_10px_25px_-8px_var(--theme-glow)] flex flex-col justify-between group"
            >
              <div className="space-y-1.5 sm:space-y-2.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--secondary)] flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform shadow-sm border border-[var(--border)] group-hover:border-[var(--accent)]/40 flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
                    {tech.iconSvg}
                  </div>
                  <span className="text-[7.5px] sm:text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-tight sm:tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] truncate max-w-[60%] text-right">
                    {tech.category}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                  {tech.name}
                </h3>

                <div className="space-y-0.5 sm:space-y-1 text-[9.5px] sm:text-[11px] leading-snug sm:leading-relaxed">
                  <p className="text-[var(--text-secondary)] line-clamp-3 sm:line-clamp-none">
                    <strong className="text-[var(--foreground)] font-semibold">Why: </strong>
                    {tech.why}
                  </p>
                </div>
              </div>

              <div className="pt-1.5 sm:pt-2 border-t border-[var(--border)] text-[9px] sm:text-[10.5px] text-[var(--accent)] font-medium leading-snug sm:leading-normal line-clamp-3 sm:line-clamp-none">
                <strong className="text-[var(--foreground)] font-semibold">Benefit: </strong>
                {tech.benefit}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
       * SECTION 4: DEVELOPER STORY & CREATOR DOSSIER (Aman Dubey)
       * Fixed/Stable Dimensions Outer Card with Zero Tab Resizing
       * ------------------------------------------------------------- */}
      <section id="developer-story" className="scroll-mt-20 space-y-4 sm:space-y-6 text-left relative">
        <div className="max-w-xl space-y-1 sm:space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <span>👨‍💻</span>
            <span>Developer Story &amp; Dossier</span>
          </div>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Meet the Creator Behind Reader&#39;s HUB
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            The engineering journey, technical mindset, and philosophy behind the platform.
          </p>
        </div>

        {/* Master Developer Story Card with Animated Chromatic / Rainbow Glow Ring */}
        <div className="developer-story-wrapper group relative p-[2px] sm:p-[2.5px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_0_45px_var(--theme-glow)] w-full">
          {/* Traveling Multi-Color / Chromatic Gradient Beam (Perimeter Ring) */}
          <span className="chromatic-border-beam absolute inset-[-200%] pointer-events-none" />

          {/* Ambient Outer Aura Glow Layer */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[#a855f7] opacity-25 blur-xl group-hover:opacity-45 transition-opacity duration-500 pointer-events-none -z-10" />

          {/* Inner Clean Content Card Container with Stable Height */}
          <div className="relative z-10 w-full h-full rounded-[22px] bg-[var(--card)]/95 backdrop-blur-2xl p-5 sm:p-8 lg:p-9">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Left Column: Creator Identity & Photo Card (Permanently Stable) */}
              <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left justify-between space-y-4">
                <div className="space-y-3 sm:space-y-4 w-full flex flex-col items-center sm:items-start">
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-2xl overflow-hidden border-2 border-[var(--accent)]/50 shadow-2xl bg-[var(--card)] group/photo flex-shrink-0">
                    <Image
                      src="/images/hero.png"
                      alt="Aman Dubey - Developer & Creator of Reader's HUB"
                      fill
                      className="object-cover object-top group-hover/photo:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 208px"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--background) 85%, transparent), transparent)" }}
                    />
                    <div className="absolute bottom-2 left-2 right-2 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--background)]/90 text-[var(--accent)] border border-[var(--border)] shadow-xs">
                        Solo Creator &amp; Engineer
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <h3 className="text-xl sm:text-2xl font-bold font-serif text-[var(--foreground)] tracking-wide">
                      Aman Dubey
                    </h3>
                    <p className="text-xs text-[var(--accent)] font-semibold">
                      Full-Stack Software Engineer
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pt-0.5">
                      Information Technology • Specializing in high-performance Next.js, React, TypeScript &amp; scalable web systems.
                    </p>
                  </div>
                </div>

                {/* Creator Direct Dossier Links */}
                <div className="flex flex-wrap gap-2 w-full pt-1 sm:pt-2 justify-center sm:justify-start">
                  <a
                    href="https://github.com/amandubey923"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--accent)]/20 text-[var(--foreground)] text-[11px] font-semibold border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all flex items-center gap-1.5 shadow-xs hover:scale-105"
                  >
                    <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>GitHub</span>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/aman-kr-dubey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--accent)]/20 text-[var(--foreground)] text-[11px] font-semibold border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all flex items-center gap-1.5 shadow-xs hover:scale-105"
                  >
                    <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="https://aman-portfolio-next.netlify.app/dossier"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] text-[11px] font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-1 hover:scale-105 hover:shadow-[0_0_16px_var(--theme-glow)]"
                  >
                    <span>Dossier</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Tabbed Dossier Narrative with Stable Fixed Content Height */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                {/* Segmented Navigation Switcher (Position remains permanently locked) */}
                <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] max-w-full w-full sm:w-auto shadow-inner">
                  <button
                    onClick={() => setActiveTab("origin")}
                    className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "origin"
                        ? "bg-[var(--card)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Origin &amp; Purpose
                  </button>
                  <button
                    onClick={() => setActiveTab("philosophy")}
                    className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "philosophy"
                        ? "bg-[var(--card)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Engineering Philosophy
                  </button>
                  <button
                    onClick={() => setActiveTab("engineering")}
                    className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "engineering"
                        ? "bg-[var(--card)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Technical Highlights
                  </button>
                </div>

                {/* Active Tab Content (Constrained to a permanent stable height) */}
                <div className="min-h-[290px] sm:min-h-[240px] lg:min-h-[220px] flex flex-col justify-between space-y-2.5 pt-1">
                  <div className="space-y-2.5 animate-fade-in">
                    <div className="inline-flex items-center gap-2 text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest font-bold">
                      <span>{"//"} {developerHighlights[activeTab].badge}</span>
                    </div>

                    <h4 className="text-base sm:text-lg lg:text-xl font-bold font-serif text-[var(--foreground)]">
                      {developerHighlights[activeTab].title}
                    </h4>

                    {developerHighlights[activeTab].paragraphs.map((p, idx) => (
                      <p key={idx} className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                        {p}
                      </p>
                    ))}

                    <div className="space-y-1.5 pt-1">
                      {developerHighlights[activeTab].points.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[var(--foreground)] font-medium">
                          <span className="text-[var(--accent)] flex-shrink-0 mt-0.5 font-bold">✦</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dossier Footer Action Link (Permanently Locked at Base) */}
                <div className="pt-3 sm:pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5">
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    Explore my complete background, production projects, and technical milestones:
                  </p>
                  <a
                    href="https://portfolio-next-aman.vercel.app/dossier"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] hover:underline hover:scale-102 transition-transform"
                  >
                    <span>View Complete Developer Dossier</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scoped CSS for the Chromatic Rotating Border Beam Animation */}
        <style jsx>{`
          @keyframes chromaticSpin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          .chromatic-border-beam {
            background: conic-gradient(
              from 0deg,
              transparent 0deg,
              var(--accent) 55deg,
              var(--primary) 115deg,
              #8b5cf6 175deg,
              #ec4899 235deg,
              #06b6d4 295deg,
              var(--accent) 345deg,
              transparent 360deg
            );
            animation: chromaticSpin 7s linear infinite;
            opacity: 0.85;
          }
          :global(.group:hover) .chromatic-border-beam {
            animation-duration: 4s;
            opacity: 1;
          }
          @media (prefers-reduced-motion: reduce) {
            .chromatic-border-beam {
              animation: none !important;
            }
          }
        `}</style>
      </section>

      {/* -------------------------------------------------------------
       * SECTION 5: COMPACT CTA FOOTER BOX
       * ------------------------------------------------------------- */}
      <div className="rounded-3xl p-6 sm:p-9 glass-card border border-[var(--accent)]/40 bg-[var(--card)]/90 text-center max-w-3xl mx-auto space-y-3.5 shadow-2xl relative overflow-hidden group hover:border-[var(--accent)]/60 transition-all">
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ background: "var(--accent)" }}
        />

        <h2 className="text-xl sm:text-3xl font-bold font-serif text-[var(--foreground)]">
          Start Reading Right Now
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed font-normal">
          Explore over {totalBooks} full-text books across {totalCategories} categories. Zero paywalls, zero accounts, and completely free.
        </p>
        <div className="pt-2">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:shadow-[0_0_25px_var(--theme-glow)] hover:scale-105 transition-all"
          >
            <span>Open Digital Library</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
