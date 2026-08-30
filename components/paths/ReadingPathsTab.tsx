"use client";

import React, { useState } from "react";
import React, { useState, useMemo } from "react";
import { READING_PATHS, getPathProgress } from "@/lib/reading-paths";
import { useLibrary } from "@/context/LibraryContext";
import { getGenuinelyCompletedBookIds } from "@/lib/reader-storage";
import Link from "next/link";

export default function ReadingPathsTab() {
  const { readingHistory } = useLibrary();
  const [selectedPathId, setSelectedPathId] = useState<string>(READING_PATHS[0].id);

  const completedIds = useMemo(() => new Set(getGenuinelyCompletedBookIds(readingHistory)), [readingHistory]);

  const activePath = READING_PATHS.find((p) => p.id === selectedPathId) || READING_PATHS[0];
  const progress = getPathProgress(activePath, readingHistory);

  return (
    <div className="w-full space-y-6 text-left min-w-0">
      {/* Header */}
      <div className="p-5 rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <h2 className="text-base sm:text-lg font-serif font-bold text-[var(--foreground)]">
          Guided Reading Paths
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Curated sequential tracks connecting engineering, philosophy, and foundational literature.
        </p>
      </div>

      {/* Path Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {READING_PATHS.map((path) => {
          const isSelected = path.id === activePath.id;
          const prog = getPathProgress(path, readingHistory);
          return (
            <button
              key={path.id}
              type="button"
              onClick={() => setSelectedPathId(path.id)}
              className={"px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border flex-shrink-0 " + (
                isSelected
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent shadow-md"
                  : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)]"
              )}
            >
              <span>{path.icon}</span>
              <span>{path.title}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                {prog.percentComplete}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Path Details */}
      <div className="p-6 rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-1">
              <span>{activePath.icon}</span>
              <span>{activePath.category}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-[var(--foreground)]">
              {activePath.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              {activePath.description}
            </p>
          </div>

          {/* Progress Circle / Badge */}
          <div className="flex items-center gap-3 bg-[var(--background)] px-4 py-2.5 rounded-2xl border border-[var(--border)] flex-shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider block">
                Path Progress
              </span>
              <span className="text-xs font-bold text-[var(--accent)]">
                {progress.completedSteps} of {progress.availableSteps} Volumes Read
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-bold text-xs flex items-center justify-center border border-[var(--primary)]/40">
              {progress.percentComplete}%
            </div>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-4 relative before:absolute before:top-4 before:bottom-4 before:left-5 before:w-0.5 before:bg-[var(--border)] before:hidden sm:before:block">
          {activePath.steps.map((step) => {
            const isRead = readingHistory.some((h) => h.bookId === step.bookId && h.progress >= 95);
            const inProgress = readingHistory.some((h) => h.bookId === step.bookId && h.progress > 0 && h.progress < 95);
            const isRead = Boolean(step.bookId && completedIds.has(step.bookId));
            const inProgress = Boolean(!isRead && step.bookId && readingHistory.some((h) => h.bookId === step.bookId && h.progress > 0));

            return (
              <div
                key={step.stepNumber}
                className={"p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 " + (
                  step.isAvailable
                    ? isRead
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : inProgress
                      ? "bg-[var(--accent)]/10 border-[var(--accent)]/30"
                      : "bg-[var(--card)] border-[var(--border)]"
                    : "bg-[var(--background)]/50 border-dashed border-[var(--border)] opacity-65"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={"w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs " + (
                      isRead
                        ? "bg-emerald-500 text-black"
                        : inProgress
                        ? "bg-[var(--accent)] text-black"
                        : step.isAvailable
                        ? "bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]"
                        : "bg-[var(--secondary)] text-[var(--text-secondary)]"
                    )}
                  >
                    {isRead ? "✓" : step.stepNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-wider">
                        {step.topic}
                      </span>
                      {isRead && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          Finished ✓
                        </span>
                      )}
                      {inProgress && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                          In Progress
                        </span>
                      )}
                      {!step.isAvailable && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-[var(--secondary)] text-[var(--text-secondary)] font-medium">
                          Coming in Next Catalog Update
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif font-bold text-sm text-[var(--foreground)] mt-0.5">
                      {step.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {step.notes}
                    </p>
                  </div>
                </div>

                {step.isAvailable && step.bookId && (
                  <Link
                    href={`/book/${step.bookId}`}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold text-center shadow-md hover:scale-102 transition-transform flex-shrink-0"
                  >
                    {isRead ? "Re-read Book" : inProgress ? "Resume Study" : "Start Volume →"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
