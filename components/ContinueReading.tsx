"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLibrary } from "@/context/LibraryContext";

export default function ContinueReading() {
  const { recentBooks, clearHistory, recordReading } = useLibrary();

  if (recentBooks.length === 0) {
    return null;
  }

  return (
    <section id="continue-reading" className="py-8 border-b border-[var(--border)]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <h2 className="text-xl font-bold font-serif text-[var(--foreground)] tracking-tight">
              Continue Reading
            </h2>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              ({recentBooks.length} in history)
            </span>
          </div>

          <button
            onClick={clearHistory}
            className="text-xs text-[var(--text-secondary)] hover:text-rose-400 transition-colors font-medium cursor-pointer"
          >
            Clear History
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentBooks.slice(0, 4).map((book) => (
            <div
              key={book.id}
              className="glass-card rounded-xl p-3.5 flex items-center gap-3.5 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all group bg-[var(--card)]"
            >
              <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden book-shadow bg-[var(--background)]">
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  sizes="56px"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent)]">
                  {book.category}
                </span>
                <h4 className="font-serif font-bold text-sm text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                  {book.title}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                  by {book.author}
                </p>

                <Link
                  href={`/book/${book.id}`}
                  onClick={() => recordReading(book.id)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--accent)] font-semibold mt-2 hover:underline"
                >
                  <span>Resume</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
