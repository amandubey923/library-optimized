"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface AboutClientProps {
  totalBooks: number;
  totalCategories: number;
}

export default function AboutClient({ totalBooks, totalCategories }: AboutClientProps) {
  // 3D Card Tilt state for Hero Profile Card
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const [activeStory, setActiveStory] = useState(0);
  const heroCardRef = useRef<HTMLDivElement>(null);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setHeroTilt({
      x: -(y / rect.height) * 12,
      y: (x / rect.width) * 12,
    });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ x: 0, y: 0 });
  };

  const storyCards = [
    {
      step: "01",
      tag: "THE IDEA",
      title: "Why Reader's HUB Was Created",
      description:
        "Frustrated by ad-cluttered reading websites, intrusive subscription popups, and broken PDF links, I set out to build a platform that strips away friction and puts literature first.",
      icon: "💡",
      highlights: ["Zero paywalls or subscriptions", "No login barriers", "Clean editorial design"],
    },
    {
      step: "02",
      tag: "THE EXPERIENCE",
      title: "Distraction-Free Reading & Discovery",
      description:
        "Every book opens instantaneously. Features include dynamic two-page layout, custom zoom levels, continuous scroll, and private local storage for bookmarks and reading history.",
      icon: "📖",
      highlights: ["Fast PDF rendering", "Instant full-text search", "7 dynamic theme modes"],
    },
    {
      step: "03",
      tag: "THE ENGINEERING",
      title: "High-Performance Modern Web Architecture",
      description:
        "Built with Next.js App Router, TypeScript, and Tailwind CSS. Features an automated 3-tier Sharp WebP cover generation pipeline and a server-side Gemini AI Library Assistant.",
      icon: "⚡",
      highlights: ["Next.js SSG Prerendering", "Google Gemini AI Integration", "3-Tier Cover Engine"],
    },
    {
      step: "04",
      tag: "THE VISION",
      title: "Open Knowledge & Cultural Preservation",
      description:
        "Preserving Hindi literature, Upanishadic commentaries, and world philosophy side-by-side with modern non-fiction — open, free, and accessible to anyone, anywhere.",
      icon: "🌍",
      highlights: ["Hindi & Classical Literature", "Modern Self-Development", "100% Free Public Access"],
    },
  ];

  const technologies = [
    { name: "Next.js (App Router)", category: "Core Framework", icon: "▲", desc: "Static Site Generation & API Routes" },
    { name: "React 19", category: "UI Architecture", icon: "⚛", desc: "Modern concurrent component tree" },
    { name: "TypeScript", category: "Language", icon: "TS", desc: "Strict end-to-end type safety" },
    { name: "Tailwind CSS", category: "Design System", icon: "🎨", desc: "Dynamic CSS variable theme tokens" },
    { name: "Google Gemini AI", category: "Intelligence", icon: "✦", desc: "Grounded Library Assistant" },
    { name: "Sharp & WebP", category: "Asset Engine", icon: "🖼", desc: "Automated 600×900 editorial covers" },
    { name: "PDF-Lib & PDF.js", category: "Document Core", icon: "📄", desc: "High-fidelity in-browser reading" },
    { name: "Chokidar", category: "Automation", icon: "👀", desc: "Real-time PDF hot-folder watcher" },
  ];

  const stats = [
    { label: "Digital Volumes", value: `${totalBooks}+`, detail: "Complete full-text books available" },
    { label: "Curated Genres", value: `${totalCategories}`, detail: "From Classics to Hindi Literature" },
    { label: "Access Barrier", value: "0s", detail: "Instant reading with zero login required" },
    { label: "Visual Themes", value: "7", detail: "Light, Dark, Midnight, Aurora, and more" },
  ];

  return (
    <div className="space-y-24">
      {/* -------------------------------------------------------------
       * HERO SECTION: Large Cinematic Editorial Presentation
       * ------------------------------------------------------------- */}
      <section className="relative pt-6 pb-12 overflow-hidden">
        {/* Soft Ambient Background Glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{ background: "var(--accent)" }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--accent)] text-xs font-bold uppercase tracking-widest shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>The Developer Behind the Library</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold font-serif text-[var(--foreground)] tracking-tight leading-[1.1]">
              Built to make reading feel{" "}
              <span className="italic text-[var(--accent)] bg-clip-text">
                effortless.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl font-normal">
              Reader&#39;s HUB is a modern digital reading platform crafted to make classic and contemporary literature seamless to discover, explore, and read. Built from the ground up as a solo engineering project.
            </p>

            {/* Quick Feature Badges */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5 shadow-xs">
                <span>⚡</span> 100% Free & Open
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5 shadow-xs">
                <span>🛡️</span> Zero Login Barrier
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5 shadow-xs">
                <span>📚</span> {totalBooks}+ Full Books
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/library"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-xs shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_var(--theme-glow)] flex items-center gap-2"
              >
                <span>Explore the Library</span>
                <span>→</span>
              </Link>

              <a
                href="#developer-story"
                className="px-6 py-3.5 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/50 font-semibold text-xs transition-all shadow-xs"
              >
                Read Developer Story
              </a>
            </div>
          </div>

          {/* Right Hero Profile Card: Prominent hero.png with 3D Tilt */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              ref={heroCardRef}
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={handleHeroMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${heroTilt.x}deg) rotateY(${heroTilt.y}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="relative w-full max-w-[380px] rounded-3xl glass-card p-4 border border-[var(--border)] shadow-2xl hover:border-[var(--accent)]/50 transition-colors group cursor-pointer"
            >
              {/* Glowing Corner Accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[var(--accent)]/60 rounded-tl-sm" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[var(--accent)]/60 rounded-tr-sm" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[var(--accent)]/60 rounded-bl-sm" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[var(--accent)]/60 rounded-br-sm" />

              {/* Main Photo Frame */}
              <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-[var(--card)] shadow-inner">
                <Image
                  src="/images/hero.png"
                  alt="Aman Dubey - Developer of Reader's HUB"
                  fill
                  priority
                  className="object-cover object-top filter contrast-[1.03] group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 380px"
                />

                {/* Subtle Gradient Shadow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent opacity-80" />

                {/* Status Indicator Chip */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[var(--background)]/85 backdrop-blur-md border border-[var(--border)] text-[10px] font-semibold text-[var(--foreground)] flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sole Creator</span>
                </div>
              </div>

              {/* Identity Card Details */}
              <div className="pt-4 pb-2 px-2 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-serif text-[var(--foreground)] tracking-wide">
                    Aman Dubey
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] font-bold">
                    Builder
                  </span>
                </div>
                <p className="text-xs text-[var(--accent)] font-semibold">
                  Full-Stack Developer &amp; Creator of Reader&#39;s HUB
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pt-1">
                  Engineered the complete reader platform, 3-tier cover engine, dynamic theme system, and Gemini AI assistant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
       * PROJECT STATS SECTION: Real Accurate Data
       * ------------------------------------------------------------- */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl glass-card border border-[var(--border)] text-left space-y-1 hover:border-[var(--accent)]/40 transition-all group"
          >
            <div className="text-3xl sm:text-4xl font-extrabold font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {item.value}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              {item.label}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              {item.detail}
            </div>
          </div>
        ))}
      </section>

      {/* -------------------------------------------------------------
       * INTERACTIVE STORY SECTION: "Why I Built It" 4-Card System
       * ------------------------------------------------------------- */}
      <section id="developer-story" className="space-y-10 text-left">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <span>✦</span>
            <span>Origin &amp; Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Why I Built Reader&#39;s HUB
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Click through the engineering journey to see how this digital library was conceived, crafted, and optimized.
          </p>
        </div>

        {/* 4 Interactive Story Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {storyCards.map((card, index) => {
            const isActive = activeStory === index;
            return (
              <div
                key={card.step}
                onClick={() => setActiveStory(index)}
                className={`p-7 rounded-3xl glass-panel border transition-all duration-300 cursor-pointer space-y-4 relative overflow-hidden group ${
                  isActive
                    ? "border-[var(--accent)] shadow-xl bg-[var(--card)]/95 ring-1 ring-[var(--accent)]/30"
                    : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--card)]"
                }`}
              >
                {/* Background Accent Pill on Active */}
                {isActive && (
                  <div
                    className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-25 pointer-events-none"
                    style={{ background: "var(--accent)" }}
                  />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{card.icon}</span>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--accent)]">
                      {card.step} — {card.tag}
                    </span>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${
                      isActive
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] rotate-90"
                        : "bg-[var(--secondary)] text-[var(--text-secondary)]"
                    }`}
                  >
                    →
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold font-serif text-[var(--foreground)] leading-snug">
                  {card.title}
                </h3>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {card.description}
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  {card.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] text-[10px] font-medium border border-[var(--border)]"
                    >
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
       * TECHNOLOGY SECTION: Real Technologies Actually Used
       * ------------------------------------------------------------- */}
      <section className="space-y-10 text-left">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <span>⚡</span>
            <span>Verified Tech Stack</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Built with Modern Engineering
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Every library feature is powered by the following verified tools and production libraries:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="p-5 rounded-2xl glass-card border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all hover:scale-[1.02] space-y-2 group bg-[var(--card)]/80"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-[var(--secondary)] text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                  {tech.icon}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  {tech.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
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
       * MEET THE DEVELOPER: Detailed Solo Developer Section
       * ------------------------------------------------------------- */}
      <section className="p-8 sm:p-12 rounded-3xl glass-panel border border-[var(--border)] relative overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Developer Portrait Avatar */}
          <div className="lg:col-span-4 flex justify-center lg:justify-start">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-2 border-[var(--accent)]/40 shadow-2xl bg-[var(--card)] group">
              <Image
                src="/images/hero.png"
                alt="Aman Dubey"
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                sizes="224px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--background)]/90 text-[var(--accent)] border border-[var(--border)]">
                  Sole Developer &amp; Creator
                </span>
              </div>
            </div>
          </div>

          {/* Developer Bio & Perspective */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
              <span>👨‍💻</span>
              <span>Creator Profile</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)]">
              Crafted by Aman Dubey
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
              I created Reader&#39;s HUB as an independent full-stack web project to explore how modern digital tools can revitalize classical and philosophical reading. From designing the multi-theme design system and PDF reader engine to crafting the automated book ingestion pipeline and Gemini assistant, every line of code was developed with a dedication to performance, elegance, and open access.
            </p>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
              Whether you are reading Hindi literature by Premchand and Bachchan or deep philosophical treatises by Plato, Marcus Aurelius, and Kant, I hope this space offers you a tranquil, inspiring reading sanctuary.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/library"
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-md hover:scale-105 transition-transform"
              >
                Browse All Books →
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] font-semibold text-xs transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
       * CTA FOOTER BOX
       * ------------------------------------------------------------- */}
      <div className="rounded-3xl p-8 sm:p-12 glass-card border border-[var(--accent)]/30 bg-[var(--card)] text-center max-w-4xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[var(--foreground)]">
          Start Reading Right Now
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          Choose from over {totalBooks} books across 8 categories. No account, no credit card, and zero paywalls ever.
        </p>
        <div className="pt-2">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:shadow-[0_0_20px_var(--theme-glow)] hover:scale-105 transition-all"
          >
            <span>Open Digital Library</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
