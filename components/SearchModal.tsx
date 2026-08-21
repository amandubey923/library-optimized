"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Book, BOOKS, CATEGORIES } from "@/data/books";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Instant keyword suggestions based on actual authors and categories
  const suggestedKeywords = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const suggestions: string[] = [];

    // Match authors
    const authors = Array.from(new Set(BOOKS.map((b) => b.author)));
    for (const a of authors) {
      if (a.toLowerCase().includes(q) && !suggestions.includes(a)) {
        suggestions.push(a);
      }
    }

    // Match categories
    for (const c of CATEGORIES) {
      if (c !== "All" && c.toLowerCase().includes(q) && !suggestions.includes(c)) {
        suggestions.push(c);
      }
    }

    return suggestions.slice(0, 3);
  }, [query]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return BOOKS.slice(0, 6); // show popular initial items
    }

    const words = q.split(/\s+/).filter(Boolean);

    return BOOKS.filter((book) => {
      const target = `${book.title} ${book.author} ${book.category} ${book.description} ${book.tags.join(" ")}`.toLowerCase();
      return words.every((w) => target.includes(w));
    }).slice(0, 8);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        router.push(`/book/${results[selectedIndex].id}`);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, router, onClose]);

  // Helper to highlight matching query text
  const highlightMatch = (text: string, targetQuery: string) => {
    if (!targetQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${targetQuery.trim()})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === targetQuery.toLowerCase().trim() ? (
            <span key={i} className="text-[var(--accent)] font-bold bg-[var(--accent)]/15 px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden z-10 animate-scale-up text-left">
        {/* Search Header */}
        <div className="flex items-center px-4 sm:px-5 py-4 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl">
          <svg
            className="w-5 h-5 text-[var(--accent)] mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, authors, philosophy, Hindi classics..."
            className="w-full bg-transparent text-[var(--foreground)] placeholder-[var(--text-secondary)] text-sm sm:text-base focus:outline-none"
            aria-label="Search books"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[var(--text-secondary)] hover:text-[var(--foreground)] text-xs px-2.5 py-1 rounded-lg bg-[var(--secondary)] cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-3 text-[var(--text-secondary)] hover:text-[var(--foreground)] text-xs px-2.5 py-1 rounded-lg border border-[var(--border)] cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Instant Suggestions Bar */}
        {suggestedKeywords.length > 0 && (
          <div className="px-4 py-2 bg-[var(--secondary)]/60 border-b border-[var(--border)] flex items-center gap-2 text-xs overflow-x-auto">
            <span className="text-[var(--text-secondary)] font-medium">Suggestions:</span>
            {suggestedKeywords.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-2.5 py-0.5 rounded-md bg-[var(--card)] hover:bg-[var(--accent)] hover:text-[var(--primary-foreground)] text-[var(--foreground)] text-[11px] font-semibold transition-all border border-[var(--border)] cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-[var(--border)]/40">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {query.trim() === "" ? "✨ Recommended Literary Masterworks" : `Found ${results.length} Matching Books`}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="text-4xl">📖</div>
              <h3 className="text-[var(--foreground)] font-bold font-serif text-base">
                No books found
              </h3>
              <p className="text-[var(--text-secondary)] text-xs max-w-sm mx-auto leading-relaxed">
                We couldn&apos;t find any books matching &quot;{query}&quot;. Try searching for &quot;Osho&quot;, &quot;Premchand&quot;, &quot;Plato&quot;, or &quot;Atomic Habits&quot;.
              </p>
              <button
                onClick={() => setQuery("")}
                className="text-xs text-[var(--accent)] hover:underline font-semibold cursor-pointer"
              >
                Clear Search Query
              </button>
            </div>
          ) : (
            results.map((book, index) => {
              const isSelected = index === selectedIndex;
              return (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  onClick={onClose}
                  className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${
                    isSelected
                      ? "bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--foreground)] shadow-sm"
                      : "hover:bg-[var(--secondary)]/60 text-[var(--text-secondary)]"
                  }`}
                >
                  <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden book-shadow bg-[var(--background)]">
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-sm text-[var(--foreground)] truncate">
                        {highlightMatch(book.title, query)}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--accent)] font-semibold border border-[var(--border)]">
                        {book.category}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-medium">
                      by {highlightMatch(book.author, query)} • {book.year} • {book.language}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]/80 truncate mt-0.5">
                      {book.excerpt || book.description}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-[var(--accent)] font-bold px-3 py-1.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-xs">
                    Read →
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Footer Shortcuts */}
        <div className="px-4 py-2.5 bg-[var(--background)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)] text-[10px]">
                ↑
              </kbd>{" "}
              <kbd className="px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)] text-[10px]">
                ↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)] text-[10px]">
                Enter
              </kbd>{" "}
              open
            </span>
          </div>
          <span>Reader&apos;s HUB Intelligent Search</span>
        </div>
      </div>
    </div>
  );
}
