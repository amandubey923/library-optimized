"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLibrary } from "@/context/LibraryContext";

export default function ContinueReading() {
  const { recentBooks, clearHistory, recordReading, removeHistoryItem } = useLibrary();

  // If no reading history yet, show an inspiring contextual journey CTA
  if (recentBooks.length === 0) {
    return (
      <section id="continue-reading" className="hidden sm:block py-10 border-b border-[var(--border)]/70 bg-[var(--card)]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                <span>📖</span>
                <span>Personal Reading Log</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-[var(--foreground)]">
                Start your reading journey
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                Open any classic, philosophy treatise, or Hindi masterpiece to track your reading progress automatically and privately in your browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <Link
                href="/library?category=Classics"
                className="px-4 py-2.5 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/40 font-semibold text-xs transition-all shadow-xs"
              >
                Explore Classics
              </Link>
              <Link
                href="/library?category=Philosophy%20%26%20Spirituality"
                className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-md hover:scale-105 transition-transform"
              >
                Browse Philosophy →
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="continue-reading" className="py-10 border-b border-[var(--border)]/80 bg-[var(--card)]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[var(--foreground)] tracking-tight">
              Continue Reading
            </h2>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              ({recentBooks.length} active volume{recentBooks.length > 1 ? "s" : ""})
            </span>
          </div>

          <button
            onClick={clearHistory}
            className="text-xs text-[var(--text-secondary)] hover:text-rose-400 transition-colors font-medium cursor-pointer"
          >
            Clear All History
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentBooks.slice(0, 4).map((book) => {
            const progress = typeof book.progress === "number" ? book.progress : 0;
            return (
              <div
                key={book.id}
                className="rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between border border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all group bg-[var(--card)] relative shadow-xs"
              >
                {/* Remove item cross */}
                <button
                  onClick={() => removeHistoryItem(book.id)}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[var(--secondary)]/80 hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-400 border border-[var(--border)] hover:border-rose-500/40 flex items-center justify-center text-xs font-bold transition-all cursor-pointer z-10"
                  title="Remove from history"
                >
                  ✕
                </button>

                <div className="flex items-start gap-3.5 mb-3">
                  <div className="relative w-15 h-22 flex-shrink-0 rounded-xl overflow-hidden book-shadow bg-[var(--background)] border border-[var(--border)]">
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="60px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-[9.5px] uppercase tracking-wider font-bold text-[var(--accent)] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/25 truncate inline-block max-w-full">
                      {book.category}
                    </span>
                    <h4 className="font-serif font-black text-sm text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors mt-1 leading-snug">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium truncate mt-0.5">
                      by {book.author}
                    </p>
                  </div>
                </div>

                {/* Progress bar & Resume */}
                <div className="pt-2.5 border-t border-[var(--border)]/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)] font-medium">Progress</span>
                    <span className="text-[var(--accent)] font-extrabold">{progress}%</span>
                  </div>
                  {/* Progress track */}
                  <div className="w-full h-2 rounded-full bg-[var(--secondary)] overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <Link
                    href={`/book/${book.id}`}
                    onClick={() => recordReading(book.id)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-[var(--primary-foreground)] text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:scale-[1.02]"
                  >
                    <span>Resume</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
