"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFeaturedBooks } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";

export default function FeaturedCarousel() {
  const featured = useMemo(() => getFeaturedBooks(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isFavorite, toggleFavorite, recordReading } = useLibrary();

  if (featured.length === 0) return null;

  const currentBook = featured[currentIndex];
  const favorited = isFavorite(currentBook.id);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? featured.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === featured.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-12 border-b border-[var(--border)]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-1.5">
              <span>✦</span>
              <span>Curated Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] tracking-tight">
              Featured Masterpieces
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
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

        {/* Featured Editorial Card */}
        <div className="relative rounded-3xl overflow-hidden glass-card border border-[var(--accent)]/25 p-6 sm:p-10 shadow-2xl bg-[var(--card)]">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--theme-ambient-1)] rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Book Cover Visual with 3D Depth */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative group/cover">
                <div className="relative w-48 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden book-shadow-lg border border-[var(--border)] bg-[var(--background)]">
                  <Image
                    src={currentBook.cover}
                    alt={currentBook.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 220px, 260px"
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
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
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

                <h3 className="text-2xl sm:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
                  {currentBook.title}
                </h3>
                <p className="text-base text-[var(--accent)] font-medium mt-1">
                  by {currentBook.author}
                </p>

                <p className="text-[var(--foreground)]/90 text-sm sm:text-base leading-relaxed mt-4">
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
        <div className="flex items-center justify-center gap-2 mt-6">
          {featured.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? "w-8 bg-[var(--accent)]" : "w-2 bg-[var(--border)] hover:bg-[var(--accent)]/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
