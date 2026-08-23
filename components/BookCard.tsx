"use client";

import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Book } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";
import CardTilt from "./visual/CardTilt";

interface BookCardProps {
  book: Book;
  compact?: boolean;
}

function BookCardComponent({ book, compact = false }: BookCardProps) {
  const { isFavorite, toggleFavorite, recordReading } = useLibrary();
  const favorited = isFavorite(book.id);

  return (
    <CardTilt className="h-full">
      <article className="group relative flex flex-col h-full glass-card rounded-2xl p-4 glass-card-hover overflow-hidden transition-all duration-300 border border-[var(--border)] hover:border-[var(--accent)]/50 hover:shadow-2xl">
        {/* Subtle Light Sweep Gradient on Hover */}
        <div
          className="absolute -inset-full bg-gradient-to-r from-transparent via-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none group-hover:translate-x-full ease-in-out"
          style={{ transitionDuration: "1000ms" }}
        />

        {/* Category Pill & Favorite Button Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 truncate">
              {book.category}
            </span>
            {book.resourceType && book.resourceType !== "Book" && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 shrink-0">
                {book.resourceType === "HandwrittenNotes"
                  ? "Handwritten"
                  : book.resourceType === "InterviewPrep"
                  ? "Interview"
                  : book.resourceType === "CheatSheet"
                  ? "Cheat Sheet"
                  : book.resourceType}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(book.id);
            }}
            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
              favorited
                ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                : "bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/50"
            }`}
            aria-label={favorited ? `Remove ${book.title} from favorites` : `Add ${book.title} to favorites`}
          >
            <svg
              className="w-4 h-4 fill-current transition-transform active:scale-125"
              viewBox="0 0 24 24"
            >
              {favorited ? (
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              ) : (
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Book Cover Container */}
        <Link
          href={`/book/${book.id}`}
          onClick={() => recordReading(book.id)}
          className="relative w-full aspect-[2/3] rounded-xl overflow-hidden mb-3.5 book-shadow bg-[var(--background)] block group/cover"
        >
          <Image
            src={book.cover}
            alt={`Cover of ${book.title}`}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover/cover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Quick Read Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <span className="w-full py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-center text-xs font-bold shadow-lg flex items-center justify-center gap-1.5">
              <span>Read Now</span>
              <span>→</span>
            </span>
          </div>
        </Link>

        {/* Book Details */}
        <div className="flex-1 flex flex-col justify-between relative z-10">
          <div>
            <Link
              href={`/book/${book.id}`}
              onClick={() => recordReading(book.id)}
              className="block group/title"
            >
              <h3 className="font-serif font-bold text-base text-[var(--foreground)] group-hover/title:text-[var(--accent)] transition-colors line-clamp-1">
                {book.title}
              </h3>
            </Link>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5 line-clamp-1">
              by <span className="text-[var(--foreground)]/90">{book.author}</span>
            </p>

            {!compact && (
              <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed">
                {book.excerpt || book.description}
              </p>
            )}
          </div>

          {/* Meta Bar & CTA */}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold">
              <span>★</span>
              <span className="text-[var(--foreground)] font-bold">{book.rating.toFixed(1)}</span>
              <span className="text-[var(--text-secondary)] font-normal text-[11px]">({book.year})</span>
            </div>

            <Link
              href={`/book/${book.id}`}
              onClick={() => recordReading(book.id)}
              className="px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 hover:bg-[var(--primary)] text-[var(--accent)] hover:text-[var(--primary-foreground)] border border-[var(--accent)]/30 font-semibold text-xs transition-all shadow-xs"
            >
              Read ↗
            </Link>
          </div>
        </div>
      </article>
    </CardTilt>
  );
}

const BookCard = memo(BookCardComponent);
export default BookCard;
