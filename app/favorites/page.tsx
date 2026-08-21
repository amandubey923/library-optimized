"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLibrary } from "@/context/LibraryContext";
import BookCard from "@/components/BookCard";

export default function FavoritesPage() {
  const { favoriteBooks } = useLibrary();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Derive categories from currently saved favorites
  const savedCategories = useMemo(() => {
    const cats = Array.from(new Set(favoriteBooks.map((b) => b.category)));
    return ["All", ...cats];
  }, [favoriteBooks]);

  const filteredFavorites = useMemo(() => {
    if (selectedCategory === "All") return favoriteBooks;
    return favoriteBooks.filter((b) => b.category === selectedCategory);
  }, [favoriteBooks, selectedCategory]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-widest mb-1.5">
          <span>❤️</span>
          <span>Personal Shelf</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
          My Saved Favorites
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 font-normal">
          Your personal library shelf, saved locally in your browser with zero account barriers.
        </p>
      </div>

      {favoriteBooks.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 px-6 glass-card rounded-3xl border border-[var(--border)] max-w-2xl mx-auto bg-[var(--card)] shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-3xl flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-inner">
            ♥
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
            Your shelf is waiting.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed font-normal">
            Click the heart icon on any book across the catalog to build your private reading collection.
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:shadow-[0_0_20px_var(--theme-glow)] transition-all hover:scale-105"
          >
            <span>Explore Library</span>
            <span>→</span>
          </Link>
        </div>
      ) : (
        /* Mini-Library Shelf */
        <div className="space-y-6">
          {/* Category Filter Pills for Shelf */}
          {savedCategories.length > 2 && (
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <span className="text-xs text-[var(--text-secondary)] font-medium mr-2">Filter Shelf:</span>
              {savedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-md"
                      : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-4 text-xs text-[var(--text-secondary)] px-1">
            <span>
              Showing <strong className="text-[var(--foreground)]">{filteredFavorites.length}</strong> of{" "}
              <strong className="text-[var(--foreground)]">{favoriteBooks.length}</strong> bookmarked volumes
            </span>
            <Link
              href="/library"
              className="text-[var(--accent)] hover:underline font-semibold"
            >
              + Browse more books
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredFavorites.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
