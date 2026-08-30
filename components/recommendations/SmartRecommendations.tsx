"use client";

import React, { useMemo } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { generateRecommendations } from "@/lib/recommendations";
import BookCard from "@/components/BookCard";

interface SmartRecommendationsProps {
  maxSections?: number;
  className?: string;
}

export default function SmartRecommendations({
  maxSections = 3,
  className = "",
}: SmartRecommendationsProps) {
  const { readingHistory, favorites } = useLibrary();

  const results = useMemo(() => {
    return generateRecommendations(readingHistory, favorites);
  }, [readingHistory, favorites]);

  if (results.sections.length === 0) return null;

  const displaySections = results.sections.slice(0, maxSections);

  return (
    <section className={"w-full space-y-10 text-left min-w-0 " + className}>
      {displaySections.map((sec) => (
        <div key={sec.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl p-2 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-xs">
                {sec.icon}
              </span>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-xl text-[var(--foreground)] tracking-tight">
                  {sec.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {sec.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5 w-full min-w-0">
            {sec.books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
