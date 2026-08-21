"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Book } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";
import PdfReader from "@/components/PdfReader";
import BookCard from "@/components/BookCard";

interface BookDetailClientProps {
  book: Book;
  relatedBooks: Book[];
}

export default function BookDetailClient({
  book,
  relatedBooks,
}: BookDetailClientProps) {
  const { isFavorite, toggleFavorite, recordReading, showToast } = useLibrary();
  const favorited = isFavorite(book.id);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    recordReading(book.id);
  }, [book.id]);

  const handleScrollToReader = () => {
    readerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${book.title} — Reader's HUB`,
          text: `Read "${book.title}" by ${book.author} for free on Reader's HUB!`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard! 📋");
      } catch {
        showToast("Could not copy link");
      }
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Bar */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-8 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/library" className="hover:text-[var(--accent)] transition-colors">
          Library
        </Link>
        <span>/</span>
        <Link
          href={`/library?category=${encodeURIComponent(book.category)}`}
          className="hover:text-[var(--accent)] transition-colors"
        >
          {book.category}
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)] font-medium truncate">{book.title}</span>
      </nav>

      {/* Book Hero / Overview Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-[var(--border)] bg-[var(--card)] mb-12 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Book Cover with 3D Depth & Quick Actions */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="relative w-56 sm:w-64 aspect-[2/3] rounded-2xl overflow-hidden book-shadow-lg border border-[var(--border)] bg-[var(--background)] mb-6">
              <Image
                src={book.cover}
                alt={book.title}
                fill
                priority
                sizes="(max-width: 768px) 240px, 300px"
                className="object-cover"
              />
            </div>

            {/* Quick action buttons under cover */}
            <div className="w-full max-w-xs flex flex-col gap-2.5">
              <button
                onClick={handleScrollToReader}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-bold text-sm shadow-xl hover:shadow-[0_0_15px_var(--theme-glow)] hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Read in Embedded Viewer</span>
                <span>↓</span>
              </button>

              <div className="flex gap-2">
                <a
                  href={book.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Open PDF</span>
                </a>

                <a
                  href={book.pdf}
                  download={`${book.title.replace(/\s+/g, "_")}.pdf`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Metadata, Synopsis, Excerpt */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              {/* Category & Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
                    {book.category}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">
                    {book.language} Edition
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(book.id)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      favorited
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    <svg
                      className={`w-3.5 h-3.5 ${favorited ? "fill-current" : ""}`}
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
                    <span>{favorited ? "Favorited" : "Favorite"}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-1.5 px-3 rounded-xl bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Title & Author */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[var(--foreground)] tracking-tight">
                {book.title}
              </h1>
              <p className="text-lg text-[var(--accent)] font-medium mt-1">
                by <span className="text-[var(--foreground)]">{book.author}</span>
              </p>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] text-xs">
                <div>
                  <span className="text-[var(--text-secondary)] block">Rating</span>
                  <span className="text-[var(--accent)] font-bold text-sm">★ {book.rating.toFixed(1)} / 5.0</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Published</span>
                  <span className="text-[var(--foreground)] font-semibold text-sm">{book.year}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Pages</span>
                  <span className="text-[var(--foreground)] font-semibold text-sm">{book.pages}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] block">Access</span>
                  <span className="text-emerald-400 font-bold text-sm">100% Free</span>
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider font-serif">
                  Synopsis
                </h3>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Memorable Quote / Excerpt */}
              {book.excerpt && (
                <div className="mt-6 p-4 rounded-2xl bg-[var(--accent)]/10 border-l-4 border-[var(--accent)] text-sm text-[var(--foreground)] italic leading-relaxed">
                  &ldquo;{book.excerpt}&rdquo;
                </div>
              )}

              {/* Tags */}
              <div className="mt-6">
                <span className="text-xs text-[var(--text-secondary)] font-medium block mb-2">
                  Themes & Topics:
                </span>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-lg bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded PDF Reader Anchor */}
      <section ref={readerRef} id="reader" className="mb-16 scroll-mt-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent)] text-lg">📖</span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[var(--foreground)]">
              Interactive Digital Reader
            </h2>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            Scroll or toggle fullscreen for immersive reading
          </span>
        </div>

        <PdfReader book={book} />
      </section>

      {/* Related Books */}
      {relatedBooks.length > 0 && (
        <section className="pt-8 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-serif text-[var(--foreground)]">
              More in {book.category}
            </h2>
            <Link
              href={`/library?category=${encodeURIComponent(book.category)}`}
              className="text-xs text-[var(--accent)] hover:underline font-semibold"
            >
              View all in category →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedBooks.map((relBook) => (
              <BookCard key={relBook.id} book={relBook} compact />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
