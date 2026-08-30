"use client";

import React, { useMemo } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { generateKnowledgeInsights } from "@/lib/knowledge-insights";
import Link from "next/link";
import Image from "next/image";

export default function KnowledgeInsightsTab() {
  const { readingHistory, favorites, streakData, reflections, readingMemories, annotations, stats } = useLibrary();

  const insights = useMemo(() => {
<<<<<<< HEAD
    return generateKnowledgeInsights(readingHistory, favorites, streakData, reflections, readingMemories, annotations, stats);
  }, [readingHistory, favorites, streakData, reflections, readingMemories, annotations, stats]);
=======
    return generateKnowledgeInsights(readingHistory, favorites, streakData, reflections, readingMemories, annotations);
  }, [readingHistory, favorites, streakData, reflections, readingMemories, annotations]);
>>>>>>> new-feature

  const studyHours = (insights.totalStudyMinutes / 60).toFixed(1);

  return (
    <div className="w-full space-y-6 text-left min-w-0">
      {/* Header */}
      <div className="p-5 rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <h2 className="text-base sm:text-lg font-serif font-bold text-[var(--foreground)]">
          Knowledge Insights &amp; Study Analytics
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Authoritative personal metrics derived from your genuine active reading and study activity.
        </p>
      </div>

      {/* Top 4 Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
            Books Explored
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[var(--foreground)]">
            {insights.totalBooksEngaged}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold block">
            {insights.totalCompleted} Finished ✓
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
            Study Hours
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[var(--accent)]">
            {studyHours}h
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            {insights.totalStudyMinutes} active minutes
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
            Study Density
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-violet-400">
            {insights.studyDensity.densityPer100Pages}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            notes &amp; highlights / 100 pages
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
            Consistency Score
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-400">
            {insights.consistencyScore}
            <span className="text-xs text-[var(--text-secondary)] font-normal">/100</span>
          </div>
          <span className="text-[10px] text-amber-400 block font-semibold">
            {streakData.currentStreak} day streak 🔥
          </span>
        </div>
      </div>

      {/* Category Distribution Breakdown */}
      {insights.categoryDistribution.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            Topic &amp; Genre Engagement
          </h3>
          {/* Multi-color segment bar */}
          <div className="w-full h-3 rounded-full bg-[var(--secondary)] overflow-hidden flex">
            {insights.categoryDistribution.map((cat) => (
              <div
                key={cat.category}
                style={{ width: cat.percentage + "%", backgroundColor: cat.color }}
                className="h-full transition-all"
                title={cat.category + ": " + cat.percentage + "%"}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {insights.categoryDistribution.map((cat) => (
              <div key={cat.category} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-[var(--foreground)] truncate font-medium flex-1">
                  {cat.category}
                </span>
                <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Authors & Most Revisited Books 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most Revisited Books */}
        <div className="p-5 rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            Most Revisited Masterworks
          </h3>
          {insights.mostRevisitedBooks.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] py-6 text-center">
              Open books in the reader to track reading memory sessions.
            </p>
          ) : (
            <div className="space-y-2.5">
              {insights.mostRevisitedBooks.map((item) => (
                <Link
                  key={item.book.id}
                  href={"/book/" + item.book.id}
                  className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--secondary)] transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-9 h-13 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0">
                      <Image src={item.book.cover} alt={item.book.title} fill className="object-cover" sizes="36px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-bold text-xs text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {item.book.title}
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">
                        by {item.book.author}
                      </p>
                      {item.reflection && (
                        <p className="text-[10px] text-violet-400 italic truncate mt-0.5">
                          &ldquo;{item.reflection}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 text-[10px] text-[var(--text-secondary)] font-mono">
                    <span className="block font-bold text-[var(--accent)]">{item.totalStudyMinutes}m</span>
                    <span>{item.sessionsCount} sessions</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Authors */}
        <div className="p-5 rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            Most Explored Authors
          </h3>
          {insights.topAuthors.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] py-6 text-center">
              Your favorite authors will automatically populate here as you read.
            </p>
          ) : (
            <div className="space-y-2.5">
              {insights.topAuthors.map((author, idx) => (
                <div
                  key={author.author}
                  className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-bold text-xs text-[var(--foreground)] truncate">
                        {author.author}
                      </h4>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {author.bookCount} volume{author.bookCount === 1 ? "" : "s"} engaged
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--accent)] font-semibold flex-shrink-0">
                    {author.totalStudyMinutes} min read
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
