"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BOOKS, CATEGORIES, isTechnicalBook, Book } from "@/data/books";

export default function ReadingUniverse() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Group books by top-level category
  const validCategories = CATEGORIES.filter((c) => c !== "All");

  const categoryStats = validCategories.map((cat, idx) => {
    const booksInCat: Book[] =
      cat === "Technical Knowledge"
        ? BOOKS.filter((b) => isTechnicalBook(b))
        : BOOKS.filter((b) => b.category === cat);

    const isTech = cat === "Technical Knowledge";
    return {
      name: cat,
      count: booksInCat.length,
      sampleBooks: booksInCat.slice(0, 3).map((b) => b.title),
      description: isTech
        ? "DSA • CS Fundamentals • Web & Backend • SQL • System Design • Interview Prep"
        : null,
      unit: isTech ? "Resources" : "Books",
      index: idx,
    };
  });

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden border-t border-[var(--border)]/80 bg-[var(--card)]/25">
      {/* Background Starfield / Constellation Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{ background: "var(--accent)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold uppercase tracking-widest shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>Your Reading Universe</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
            Interconnected Dimensions of Thought
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
            Explore literature across connected realms. Click any constellation node to jump into its curated shelf.
          </p>
        </div>

        {/* Constellation Grid of Interactive Category Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {categoryStats.map((item) => {
            const isHovered = hoveredCategory === item.name;
            return (
              <Link
                key={item.name}
                href={`/library?category=${encodeURIComponent(item.name)}`}
                onMouseEnter={() => setHoveredCategory(item.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`p-6 rounded-3xl glass-card border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.03] ${
                  isHovered
                    ? "border-[var(--accent)] shadow-2xl bg-[var(--card)] ring-1 ring-[var(--accent)]/50 -translate-y-1"
                    : "border-[var(--border)] hover:border-[var(--accent)]/40 bg-[var(--card)]/80"
                }`}
              >
                {/* Subtle Ambient Node Glow */}
                <div
                  className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-70"
                  style={{ background: "var(--accent)" }}
                />

                <div>
                  {/* Top Node Pill */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-xl bg-[var(--secondary)] text-[var(--accent)] font-mono font-bold text-xs flex items-center justify-center border border-[var(--border)] shadow-xs">
                      0{item.index + 1}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                      {item.count} {item.unit}
                    </span>
                  </div>

                  {/* Category Title */}
                  <h3 className="text-lg font-bold font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors mb-2">
                    {item.name}
                  </h3>

                  {/* Sample Books Mini-List */}
                  <div className="space-y-1.5 my-3">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-bold block">
                      Notable Volumes:
                    </span>
                    {item.sampleBooks.map((title, i) => (
                      <p key={i} className="text-xs text-[var(--text-secondary)] truncate font-normal">
                        • {title}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3.5 border-t border-[var(--border)]/60 flex items-center justify-between text-xs text-[var(--accent)] font-bold">
                  <span>Enter Realm</span>
                  <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
