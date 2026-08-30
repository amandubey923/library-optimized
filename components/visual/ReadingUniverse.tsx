"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BOOKS, CATEGORIES, isTechnicalBook, Book } from "@/data/books";

export default function ReadingUniverse() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(4);

  // Group books by top-level category (memoized once for static catalog)
  const categoryStats = useMemo(() => {
    const validCategories = CATEGORIES.filter((c) => c !== "All");
    return validCategories.map((cat, idx) => {
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
  }, []);

  const visibleRealms = useMemo(() => {
    return categoryStats.slice(0, visibleCount);
  }, [categoryStats, visibleCount]);

  const handleSeeMore = () => {
    setVisibleCount((prev) => Math.min(prev + 4, categoryStats.length));
  };

  const handleShowLess = () => {
    setVisibleCount(4);
  };

  const hasMore = visibleCount < categoryStats.length;

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden border-t border-[var(--border)]/80 bg-[var(--card)]/25">
      {/* Background Starfield / Constellation Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{ background: "var(--accent)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="max-w-2xl space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-[11px] sm:text-xs font-bold uppercase tracking-widest shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>Your Reading Universe</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-serif text-[var(--foreground)] tracking-tight leading-tight">
              Interconnected Dimensions of Thought
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
              Explore literature across curated realms. Showing <strong className="text-[var(--foreground)] font-bold">{visibleRealms.length}</strong> of {categoryStats.length} literary dimensions.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              {visibleRealms.length} / {categoryStats.length} Realms Visible
            </span>
          </div>
        </div>

        {/* Constellation Grid of Interactive Category Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 relative">
          {visibleRealms.map((item) => {
            const isHovered = hoveredCategory === item.name;
            return (
              <Link
                key={item.name}
                href={`/library?category=${encodeURIComponent(item.name)}`}
                onMouseEnter={() => setHoveredCategory(item.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] shadow-xs ${
                  isHovered
                    ? "border-[var(--accent)] shadow-xl bg-[var(--card)] ring-1 ring-[var(--accent)]/40 -translate-y-1"
                    : "border-[var(--border)] hover:border-[var(--accent)]/40 bg-[var(--card)]"
                }`}
              >
                {/* Subtle Ambient Node Glow */}
                <div
                  className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-60"
                  style={{ background: "var(--accent)" }}
                />

                <div className="space-y-3">
                  {/* Top Node Pill */}
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[var(--secondary)] text-[var(--accent)] font-mono font-bold text-[11px] sm:text-xs flex items-center justify-center border border-[var(--border)] shadow-xs">
                      0{item.index + 1}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25">
                      {item.count} {item.unit}
                    </span>
                  </div>

                  {/* Category Title */}
                  <h3 className="text-sm sm:text-lg font-black font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2 min-h-[36px] sm:min-h-[44px]">
                    {item.name}
                  </h3>

                  {/* Sample Books Mini-List */}
                  <div className="space-y-1 my-2 sm:my-3">
                    <span className="text-[9.5px] uppercase tracking-wider text-[var(--text-secondary)] font-bold block">
                      Notable Volumes:
                    </span>
                    {item.sampleBooks.map((title, i) => (
                      <p key={i} className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate font-medium leading-tight">
                        • {title}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-3 pt-3 border-t border-[var(--border)]/60 flex items-center justify-between text-xs text-[var(--accent)] font-extrabold">
                  <span>Enter Realm</span>
                  <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* See More (+4) / Show Less Interactive Controller */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          {hasMore ? (
            <button
              onClick={handleSeeMore}
              className="w-full sm:w-auto px-8 py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-[var(--primary-foreground)] text-xs sm:text-[13px] font-extrabold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>See More Realms (+4)</span>
              <span className="text-sm">↓</span>
            </button>
          ) : (
            <button
              onClick={handleShowLess}
              className="w-full sm:w-auto px-8 py-3 rounded-xl sm:rounded-2xl bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/40 text-xs sm:text-[13px] font-extrabold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Show Less Realms</span>
              <span className="text-sm">↑</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
