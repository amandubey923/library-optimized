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
    { name: "Next.js (App Router)", category: "Core Framework", icon: "▲", desc: "Static Site Generation (SSG) & API routes" },
    { name: "React 19", category: "UI Architecture", icon: "⚛", desc: "Modern concurrent component tree" },
    { name: "TypeScript", category: "Language", icon: "TS", desc: "Strict end-to-end type safety" },
    { name: "Tailwind CSS", category: "Design System", icon: "🎨", desc: "Dynamic CSS variable theme tokens" },
    { name: "PDF.js & Web Workers", category: "Document Core", icon: "📄", desc: "High-fidelity in-browser PDF rendering" },
    { name: "Sharp & WebP", category: "Asset Engine", icon: "🖼", desc: "Automated 3-tier editorial cover generator" },
    { name: "Google Gemini AI", category: "Intelligence", icon: "✦", desc: "Grounded contextual Library Assistant" },
    { name: "Local-First Storage", category: "Data Privacy", icon: "🛡️", desc: "100% client-side reading analytics & notes" },
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
    <div className="space-y-16 sm:space-y-20 max-w-6xl mx-auto">
      {/* -------------------------------------------------------------
       * HERO SECTION: Compact Cinematic Overview & Platform Stats
       * ------------------------------------------------------------- */}
      <section className="relative pt-2 pb-6 text-center space-y-6">
        {/* Soft Ambient Background Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ background: "var(--accent)" }}
        />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--accent)] text-xs font-bold uppercase tracking-widest shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span>Platform Overview &amp; Developer Story</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif text-[var(--foreground)] tracking-tight leading-[1.15] max-w-3xl mx-auto">
          A barrier-free digital reading sanctuary,{" "}
          <span className="italic text-[var(--accent)] bg-clip-text">
            built with craftsmanship.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto font-normal">
          Conceived and engineered by <strong className="text-[var(--foreground)] font-semibold">Aman Dubey</strong> as a solo full-stack project — Reader&#39;s HUB strips away subscriptions, paywalls, and clunky interfaces to deliver pure, distraction-free literature.
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            href="/library"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-xs shadow-md transition-all hover:scale-105 hover:shadow-[0_0_16px_var(--theme-glow)] flex items-center gap-2"
          >
            <span>Explore the Library</span>
            <span>→</span>
          </Link>
          <a
            href="#developer-story"
            className="px-5 py-3 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/50 font-semibold text-xs transition-all shadow-xs"
          >
            Read Developer Story ↓
          </a>
        </div>

        {/* Platform Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl glass-card border border-[var(--border)] text-center space-y-1 hover:border-[var(--accent)]/40 transition-all">
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)]">
              {totalBooks}+
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Digital Volumes
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-[var(--border)] text-center space-y-1 hover:border-[var(--accent)]/40 transition-all">
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)]">
              {totalCategories}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Curated Genres
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-[var(--border)] text-center space-y-1 hover:border-[var(--accent)]/40 transition-all">
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)]">
              0s
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Zero Login Barrier
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-[var(--border)] text-center space-y-1 hover:border-[var(--accent)]/40 transition-all">
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)]">
              100%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Private &amp; Local-First
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
       * SECTION 2: WHY IT WAS BUILT & PLATFORM PILLARS
       * ------------------------------------------------------------- */}
      <section className="space-y-6 text-left">
        <div className="max-w-xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <span>✦</span>
            <span>Core Pillars</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Why Reader&#39;s HUB Exists
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Every feature was thoughtfully engineered around the reader&#39;s focus, ease of access, and privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {platformPillars.map((pillar) => (
            <div
              key={pillar.step}
              className="p-6 rounded-2xl glass-panel border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all space-y-3 relative group bg-[var(--card)]/70"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{pillar.icon}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--accent)]">
                    {pillar.step} — {pillar.tag}
                  </span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold font-serif text-[var(--foreground)]">
                {pillar.title}
              </h3>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal">
                {pillar.description}
              </p>

              <div className="pt-1 flex flex-wrap gap-1.5">
                {pillar.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-md bg-[var(--secondary)] text-[var(--foreground)] text-[10px] font-medium border border-[var(--border)]"
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
      <section className="space-y-6 text-left">
        <div className="max-w-xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <span>⚡</span>
            <span>Architecture &amp; Stack</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Engineered with Modern Tools
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Production-grade technologies powering the speed, aesthetics, and reliability of Reader&#39;s HUB:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="p-4 rounded-2xl glass-card border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all space-y-1.5 bg-[var(--card)]/70 hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-[var(--secondary)] text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                  {tech.icon}
                </span>
                <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  {tech.category}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                {tech.name}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {tech.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
       * SECTION 4: DEVELOPER STORY & CREATOR DOSSIER (Aman Dubey)
       * ------------------------------------------------------------- */}
      <section id="developer-story" className="scroll-mt-20 space-y-6 text-left">
        <div className="max-w-xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <span>👨‍💻</span>
            <span>Developer Story &amp; Dossier</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Meet the Creator Behind Reader&#39;s HUB
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            The engineering journey, technical mindset, and philosophy behind the platform.
          </p>
        </div>

        {/* Master Developer Story Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[var(--border)] relative overflow-hidden bg-[var(--card)]/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Creator Identity & Photo Card */}
            <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 border-[var(--accent)]/40 shadow-xl bg-[var(--card)] group">
                <Image
                  src="/images/hero.png"
                  alt="Aman Dubey - Developer & Creator of Reader's HUB"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  sizes="208px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--background)]/90 text-[var(--accent)] border border-[var(--border)]">
                    Solo Creator &amp; Engineer
                  </span>
                </div>
              </div>

              <div className="space-y-1 w-full">
                <h3 className="text-xl font-bold font-serif text-[var(--foreground)]">
                  Aman Dubey
                </h3>
                <p className="text-xs text-[var(--accent)] font-semibold">
                  Full-Stack Software Engineer
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pt-0.5">
                  Information Technology • Specializing in high-performance Next.js, React, TypeScript &amp; scalable web systems.
                </p>
              </div>

              {/* Creator Direct Dossier Links */}
              <div className="flex flex-wrap gap-2 w-full pt-1">
                <a
                  href="https://github.com/amandubey923"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)]/15 text-[var(--foreground)] text-[11px] font-medium border border-[var(--border)] transition-colors flex items-center gap-1.5 shadow-xs"
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
                  className="px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)]/15 text-[var(--foreground)] text-[11px] font-medium border border-[var(--border)] transition-colors flex items-center gap-1.5 shadow-xs"
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
                  className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <span>Dossier</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Right Column: Tabbed Dossier Narrative */}
            <div className="lg:col-span-8 space-y-4">
              {/* Segmented Navigation Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] max-w-fit">
                <button
                  onClick={() => setActiveTab("origin")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "origin"
                      ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Origin &amp; Purpose
                </button>
                <button
                  onClick={() => setActiveTab("philosophy")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "philosophy"
                      ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Engineering Philosophy
                </button>
                <button
                  onClick={() => setActiveTab("engineering")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "engineering"
                      ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Technical Highlights
                </button>
              </div>

              {/* Active Tab Content */}
              <div className="space-y-3 pt-1 animate-fade-in">
                <div className="inline-flex items-center gap-2 text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest">
                  <span>// {developerHighlights[activeTab].badge}</span>
                </div>

                <h4 className="text-lg sm:text-xl font-bold font-serif text-[var(--foreground)]">
                  {developerHighlights[activeTab].title}
                </h4>

                {developerHighlights[activeTab].paragraphs.map((p, idx) => (
                  <p key={idx} className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                    {p}
                  </p>
                ))}

                <div className="space-y-1.5 pt-2">
                  {developerHighlights[activeTab].points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[var(--foreground)] font-medium">
                      <span className="text-[var(--accent)] flex-shrink-0 mt-0.5">✦</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dossier Footer Action Link */}
              <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Explore my complete background, production projects, and technical milestones:
                </p>
                <a
                  href="https://aman-portfolio-next.netlify.app/dossier"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] hover:underline"
                >
                  <span>View Complete Developer Dossier</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
       * SECTION 5: COMPACT CTA FOOTER BOX
       * ------------------------------------------------------------- */}
      <div className="rounded-3xl p-6 sm:p-8 glass-card border border-[var(--accent)]/30 bg-[var(--card)] text-center max-w-3xl mx-auto space-y-3 shadow-lg">
        <h2 className="text-xl sm:text-3xl font-bold font-serif text-[var(--foreground)]">
          Start Reading Right Now
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed font-normal">
          Explore over {totalBooks} full-text books across {totalCategories} categories. Zero paywalls, zero accounts, and completely free.
        </p>
        <div className="pt-2">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-xs shadow-md hover:shadow-[0_0_16px_var(--theme-glow)] hover:scale-105 transition-all"
          >
            <span>Open Digital Library</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
