import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Reader's HUB — a public, barrier-free digital reading platform built to preserve and share timeless literature.",
};

const teamMembers = [
  {
    name: "Aman Dubey",
    role: "Project Lead & Core Developer",
    image: "/images/amandubey.jpeg",
    bio: "Passionate about building fast, accessible open-source reading platforms that celebrate classical literature.",
  },
  {
    name: "Aditya",
    role: "Literature Research & Archiving",
    image: "/images/aditya.jpeg",
    bio: "Dedicated to cataloging timeless classics and making literary treasures accessible to digital readers worldwide.",
  },
  {
    name: "Akshat",
    role: "UI Architecture & Curation",
    image: "/images/akshat.jpeg",
    bio: "Focused on crafting distraction-free editorial interfaces and seamless reading experiences.",
  },
  {
    name: "Abhay",
    role: "Content Verification & QA",
    image: "/images/abhay33.jpeg",
    bio: "Ensuring digital editions, translations, and metadata integrity across our entire collection.",
  },
];

export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-semibold uppercase tracking-wider mb-4">
          <span>📖</span>
          <span>Our Story & Mission</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[var(--foreground)] tracking-tight mb-6">
          About Reader&apos;s <span className="text-[var(--accent)]">HUB</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-normal">
          Reader&apos;s HUB is a simple, modern digital reading space built to make great books easier to discover, read, and remember — completely open and free to all.
        </p>
      </div>

      {/* Mission & Purpose Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="glass-card rounded-3xl p-8 border border-[var(--border)] space-y-4 bg-[var(--card)]">
          <h2 className="text-2xl font-bold font-serif text-[var(--foreground)] flex items-center gap-2.5">
            <span className="text-[var(--accent)]">✦</span>
            <span>Why We Built This</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            In an era where digital content is often locked behind paywalls, intrusive subscription popups, and complex login forms, we wanted to build something fundamentally different: a pure, distraction-free reading room.
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Whether you want to delve into the rural realism of Munshi Premchand&apos;s <em>Godan</em>, contemplate the philosophical quatrains of Harivansh Rai Bachchan&apos;s <em>Madhushala</em>, or revisit George Orwell&apos;s dystopian masterpiece <em>1984</em>, Reader&apos;s HUB opens every book in seconds.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-[var(--border)] space-y-4 bg-[var(--card)]">
          <h2 className="text-2xl font-bold font-serif text-[var(--foreground)] flex items-center gap-2.5">
            <span className="text-[var(--accent)]">✦</span>
            <span>Our Core Commitments</span>
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start gap-2.5">
              <span className="text-[var(--accent)] font-bold mt-0.5">✓</span>
              <span><strong className="text-[var(--foreground)]">100% Free & Public:</strong> No login walls, no subscriptions, and no paywalls ever.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[var(--accent)] font-bold mt-0.5">✓</span>
              <span><strong className="text-[var(--foreground)]">Cultural Preservation:</strong> Celebrating Hindi literature alongside world classics and philosophy.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[var(--accent)] font-bold mt-0.5">✓</span>
              <span><strong className="text-[var(--foreground)]">Privacy-First Architecture:</strong> Your bookmarks and reading history remain securely inside your local browser.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[var(--accent)] font-bold mt-0.5">✓</span>
              <span><strong className="text-[var(--foreground)]">Lightweight Performance:</strong> Instant loading with zero tracking bloat.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Team / Creators Section */}
      <section className="mb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-2">
            <span>👥</span>
            <span>Project Contributors</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Meet the Team
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            The students and book lovers behind the design and curation of Reader&apos;s HUB.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="glass-card rounded-2xl p-5 border border-[var(--border)] text-center flex flex-col items-center hover:border-[var(--accent)]/40 transition-all group bg-[var(--card)]"
            >
              <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-[var(--accent)]/30 group-hover:scale-105 transition-transform bg-[var(--background)] shadow-md">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              <h3 className="font-serif font-bold text-base text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                {member.name}
              </h3>
              <span className="text-xs text-[var(--accent)] font-semibold mb-2">
                {member.role}
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <div className="rounded-3xl p-8 sm:p-12 glass-card border border-[var(--accent)]/20 bg-[var(--card)] text-center max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] mb-3">
          Ready to dive into a good book?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
          Explore our complete collection of classic and contemporary books right now.
        </p>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-sm shadow-xl hover:shadow-[0_0_15px_var(--theme-glow)] hover:scale-105 transition-all"
        >
          <span>Open the Library</span>
          <span>→</span>
        </Link>
      </div>
    </main>
  );
}
