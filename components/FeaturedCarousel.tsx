"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFeaturedBooks } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";

export default function FeaturedCarousel() {
  const featured = useMemo(() => getFeaturedBooks(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isFavorite, toggleFavorite, recordReading } = useLibrary();

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  if (featured.length === 0) return null;

  const currentBook = featured[currentIndex];
  const favorited = isFavorite(currentBook.id);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? featured.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === featured.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartXRef.current - touchEndX;
    const diffY = (touchStartYRef.current || 0) - touchEndY;

    // Only trigger swipe if horizontal movement is dominant and > 35px
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  return (
    <section className="py-8 sm:py-12 border-b border-[var(--border)]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-1">
              <span>✦</span>
              <span>Curated Selection</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold font-serif text-[var(--foreground)] tracking-tight">
              Featured Masterpieces
            </h2>
          </div>

          {/* Desktop/Tablet Navigation Controls */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              {String(currentIndex + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer"
                aria-label="Previous featured book"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer"
                aria-label="Next featured book"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Featured Card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden glass-card border border-[var(--accent)]/25 p-4 sm:p-10 shadow-xl sm:shadow-2xl bg-[var(--card)] select-none"
        >
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--theme-ambient-1)] rounded-full blur-3xl pointer-events-none" />

          {/* -------------------------------------------------------------
           * Mobile Compact Card Layout (Visible < 1024px)
           * ------------------------------------------------------------- */}
          <div className="block lg:hidden relative z-10 space-y-3.5">
            {/* Top Row: Spotlight badge + Inside Navigation Buttons */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]/60">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs">
                  Spotlight
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                  {String(currentIndex + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}
                </span>
              </div>

              {/* Integrated Left/Right Buttons inside the card on mobile */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)]/20 active:scale-95 text-[var(--foreground)] border border-[var(--border)] flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Previous masterpiece"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="w-8 h-8 rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)]/20 active:scale-95 text-[var(--foreground)] border border-[var(--border)] flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Next masterpiece"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Middle Row: Side-by-side compact book cover + metadata */}
            <div className="flex items-start gap-3.5">
              <Link
                href={`/book/${currentBook.id}`}
                onClick={() => recordReading(currentBook.id)}
                className="relative w-24 xs:w-28 aspect-[2/3] rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)] bg-[var(--background)] block group/cover"
              >
                <Image
                  src={currentBook.cover}
                  alt={currentBook.title}
                  fill
                  priority
                  sizes="120px"
                  className="object-cover group-hover/cover:scale-105 transition-transform duration-300"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25 truncate">
                    {currentBook.category}
                  </span>
                  <span className="text-[9px] text-[var(--text-secondary)] font-medium">
                    ({currentBook.year})
                  </span>
                </div>

                <Link
                  href={`/book/${currentBook.id}`}
                  onClick={() => recordReading(currentBook.id)}
                  className="block"
                >
                  <h3 className="text-sm font-serif font-bold text-[var(--foreground)] line-clamp-1 hover:text-[var(--accent)] transition-colors">
                    {currentBook.title}
                  </h3>
                </Link>
                <p className="text-[11px] text-[var(--accent)] font-medium line-clamp-1">
                  by {currentBook.author}
                </p>

                <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2 mt-1.5">
                  {currentBook.description}
                </p>

                {/* Compact tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentBook.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)]/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Compact action buttons */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--border)]/60">
              <Link
                href={`/book/${currentBook.id}`}
                onClick={() => recordReading(currentBook.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                <span>Read Book Now</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <button
                onClick={() => toggleFavorite(currentBook.id)}
                className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  favorited
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                    : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)]"
                }`}
                aria-label={favorited ? "Saved in Favorites" : "Add to Favorites"}
              >
                <svg
                  className={`w-4 h-4 ${favorited ? "fill-current" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* -------------------------------------------------------------
           * Desktop / Tablet Full Editorial Layout (Visible >= 1024px)
           * ------------------------------------------------------------- */}
          <div className="hidden lg:grid grid-cols-12 gap-12 items-center relative z-10">
            {/* Book Cover Visual with 3D Depth */}
            <div className="col-span-4 flex justify-center">
              <div className="relative group/cover">
                <div className="relative w-56 aspect-[2/3] rounded-2xl overflow-hidden book-shadow-lg border border-[var(--border)] bg-[var(--background)]">
                  <Image
                    src={currentBook.cover}
                    alt={currentBook.title}
                    fill
                    priority
                    sizes="260px"
                    className="object-cover group-hover/cover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Badge */}
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-black uppercase rounded-full shadow-lg">
                  Spotlight
                </div>
              </div>
            </div>

            {/* Book Metadata & Synopsis */}
            <div className="col-span-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
                    {currentBook.category}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">
                    Published {currentBook.year}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">
                    • {currentBook.pages} Pages
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">
                    • {currentBook.language}
                  </span>
                </div>

                <h3 className="text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
                  {currentBook.title}
                </h3>
                <p className="text-base text-[var(--accent)] font-medium mt-1">
                  by {currentBook.author}
                </p>

                <p className="text-[var(--foreground)]/90 text-base leading-relaxed mt-4">
                  {currentBook.description}
                </p>

                {currentBook.excerpt && (
                  <blockquote className="mt-4 pl-4 border-l-2 border-[var(--accent)]/70 italic text-sm text-[var(--foreground)]/80 bg-[var(--accent)]/5 py-2 rounded-r-lg">
                    &ldquo;{currentBook.excerpt}&rdquo;
                  </blockquote>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {currentBook.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--border)]">
                <Link
                  href={`/book/${currentBook.id}`}
                  onClick={() => recordReading(currentBook.id)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-sm shadow-xl hover:shadow-[0_0_15px_var(--theme-glow)] hover:scale-105 transition-all flex items-center gap-2"
                >
                  <span>Read Book Now</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <button
                  onClick={() => toggleFavorite(currentBook.id)}
                  className={`px-4 py-3 rounded-xl border font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                    favorited
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${favorited ? "fill-current" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{favorited ? "Saved in Favorites" : "Add to Favorites"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Selector Row */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
          {featured.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? "w-6 sm:w-8 bg-[var(--accent)]" : "w-1.5 sm:w-2 bg-[var(--border)] hover:bg-[var(--accent)]/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
