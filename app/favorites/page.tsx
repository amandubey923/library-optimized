"use client";

import React from "react";
import Link from "next/link";
import { useLibrary } from "@/context/LibraryContext";
import BookCard from "@/components/BookCard";

export default function FavoritesPage() {
  const { favoriteBooks } = useLibrary();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-widest mb-1.5">
          <span>❤️</span>
          <span>Personal Shelf</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
          My Saved Favorites
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Your bookmarked collection, saved locally in your browser with zero account requirements.
        </p>
      </div>

      {favoriteBooks.length === 0 ? (
        <div className="text-center py-20 px-4 glass-card rounded-3xl border border-[var(--border)] max-w-2xl mx-auto bg-[var(--card)]">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-3xl flex items-center justify-center mx-auto mb-4 text-rose-400">
            ♥
          </div>
          <h2 className="text-2xl font-bold font-serif text-[var(--foreground)] mb-2">
            No Favorites Saved Yet
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed">
            Click the heart icon on any book across the catalog to build your private reading wishlist.
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-sm shadow-lg hover:shadow-[0_0_15px_var(--theme-glow)] transition-all hover:scale-105"
          >
            <span>Browse Library Catalog</span>
            <span>→</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6 text-xs text-[var(--text-secondary)]">
            <span>
              You have <strong className="text-[var(--foreground)]">{favoriteBooks.length}</strong> saved book{favoriteBooks.length === 1 ? "" : "s"}
            </span>
            <Link
              href="/library"
              className="text-[var(--accent)] hover:underline font-semibold"
            >
              + Add more books
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favoriteBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
