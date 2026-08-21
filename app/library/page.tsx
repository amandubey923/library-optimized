"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BOOKS, CATEGORIES, Category } from "@/data/books";
import BookCard from "@/components/BookCard";

function LibraryContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<Category>(
    CATEGORIES.includes(initialCategoryParam as Category)
      ? (initialCategoryParam as Category)
      : "All"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"rating" | "year" | "title" | "pages">("rating");

  const languages = ["All", "English", "Hindi", "Russian (Eng Trans)", "Spanish (Eng Trans)"];

  const filteredBooks = useMemo(() => {
    let result = [...BOOKS];

    // Filter by Category
    if (selectedCategory !== "All") {
      result = result.filter((b) => b.category === selectedCategory);
    }

    // Filter by Language
    if (selectedLanguage !== "All") {
      result = result.filter((b) => b.language === selectedLanguage);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "year") return Number(b.year) - Number(a.year);
      if (sortBy === "pages") return Number(b.pages) - Number(a.pages);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [selectedCategory, selectedLanguage, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedLanguage("All");
    setSearchQuery("");
    setSortBy("rating");
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-1.5">
          <span>📖</span>
          <span>Catalog Explorer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
          Complete Library
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Explore all {BOOKS.length} literary works available for instant digital reading.
        </p>
      </div>

      {/* Filter & Controls Panel */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 mb-8 border border-[var(--border)] space-y-4 bg-[var(--card)]">
        {/* Row 1: Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, themes, or keywords..."
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-[var(--text-secondary)] hover:text-[var(--foreground)] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-[var(--text-secondary)] whitespace-nowrap font-medium">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/50 cursor-pointer"
            >
              <option value="rating">Top Rated ★</option>
              <option value="year">Publication Year</option>
              <option value="title">Title (A - Z)</option>
              <option value="pages">Page Count</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category Badges */}
        <div>
          <div className="text-xs text-[var(--text-secondary)] font-medium mb-2">Category:</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold shadow-md"
                      : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Language Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Language:</span>
            {languages.map((lang) => {
              const isActive = selectedLanguage === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40"
                      : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>

          {(selectedCategory !== "All" || selectedLanguage !== "All" || searchQuery) && (
            <button
              onClick={resetFilters}
              className="text-xs text-[var(--accent)] hover:underline font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6 text-xs text-[var(--text-secondary)]">
        <span>
          Showing <strong className="text-[var(--foreground)]">{filteredBooks.length}</strong> of{" "}
          <strong className="text-[var(--foreground)]">{BOOKS.length}</strong> books
        </span>
      </div>

      {/* Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-20 px-4 glass-card rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-bold text-[var(--foreground)] font-serif mb-1">
            No matching books found
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
            We couldn&apos;t find any books matching your selected filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">
          Loading library catalog...
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
