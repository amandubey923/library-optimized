"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { searchBooks, Book, BOOKS } from "@/data/books";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResults(searchBooks(query).slice(0, 6));
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === "") {
      setResults(BOOKS.slice(0, 5)); // show popular recommendations
    } else {
      setResults(searchBooks(query).slice(0, 7));
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-up">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--border)] bg-[var(--card)]">
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
            placeholder="Search books by title, author, category, or tag..."
            className="w-full bg-transparent text-[var(--foreground)] placeholder-[var(--text-secondary)] text-base focus:outline-none"
            aria-label="Search books"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[var(--text-secondary)] hover:text-[var(--foreground)] text-xs px-2 py-1 rounded bg-[var(--secondary)] cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-3 text-[var(--text-secondary)] hover:text-[var(--foreground)] text-sm px-2 py-1 rounded border border-[var(--border)] cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-[var(--border)]/50">
          <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {query.trim() === "" ? "✨ Recommended Books" : `Found ${results.length} results`}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-4xl mb-3">📖</div>
              <h3 className="text-[var(--foreground)] font-medium mb-1">No books found</h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto mb-4">
                We couldn&apos;t find any books matching &quot;{query}&quot;. Try searching for &quot;Premchand&quot;, &quot;1984&quot;, &quot;Philosophy&quot;, or &quot;Gatsby&quot;.
              </p>
              <button
                onClick={() => setQuery("")}
                className="text-xs text-[var(--accent)] hover:underline font-medium cursor-pointer"
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
                  className={`flex items-center gap-4 p-2.5 rounded-xl transition-all ${
                    isSelected
                      ? "bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--foreground)]"
                      : "hover:bg-[var(--secondary)]/60 text-[var(--text-secondary)]"
                  }`}
                >
                  <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden book-shadow bg-[var(--background)]">
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
                      <h4 className="font-semibold text-sm text-[var(--foreground)] truncate">
                        {book.title}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--accent)] border border-[var(--border)] font-medium">
                        {book.category}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      by <span className="text-[var(--foreground)] font-medium">{book.author}</span> • {book.year} • {book.language}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]/80 truncate mt-0.5">
                      {book.excerpt || book.description}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-[var(--accent)] font-medium px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                    Read →
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[var(--background)] border-t border-[var(--border)]/80 flex items-center justify-between text-xs text-[var(--text-secondary)]">
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
              open book
            </span>
          </div>
          <span>Reader&apos;s HUB Quick Search</span>
        </div>
      </div>
    </div>
  );
}
