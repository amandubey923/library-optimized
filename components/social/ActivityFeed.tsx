"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicActivity } from "@/lib/social";

interface ActivityFeedProps {
  activities: PublicActivity[];
  emptyMessage?: string;
}

export default function ActivityFeed({
  activities,
  emptyMessage = "No recent reading activity recorded.",
}: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-2 rounded-2xl bg-[var(--card)]/40 border border-[var(--border)] p-6">
        <span className="text-3xl block mb-1">📜</span>
        <p className="font-semibold text-[var(--foreground)]">Quiet Shelf</p>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const formatTimeAgo = (ts: number): string => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-3">
      {activities.map((act) => {
        const icons: Record<string, string> = {
          completed_book: "🔥",
          started_book: "📖",
          milestone_streak: "⚡",
          achievement_unlocked: "🏆",
        };

        const badgeColors: Record<string, string> = {
          completed_book: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          started_book: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          milestone_streak: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          achievement_unlocked: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        };

        return (
          <div
            key={act.id}
            className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all flex items-start gap-3.5"
          >
            {/* Event Icon Glyph */}
            <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-lg flex-shrink-0 border border-[var(--border)] shadow-xs">
              {icons[act.type] || "📌"}
            </div>

            {/* Content Body */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <span className="font-semibold text-xs text-[var(--foreground)]">
                  {act.type === "completed_book" && (
                    <>
                      Finished reading{" "}
                      {act.bookId ? (
                        <Link
                          href={`/book/${act.bookId}`}
                          className="font-bold text-[var(--accent)] hover:underline"
                        >
                          &quot;{act.bookTitle}&quot;
                        </Link>
                      ) : (
                        <strong>&quot;{act.bookTitle}&quot;</strong>
                      )}
                    </>
                  )}

                  {act.type === "started_book" && (
                    <>
                      Began reading{" "}
                      {act.bookId ? (
                        <Link
                          href={`/book/${act.bookId}`}
                          className="font-bold text-[var(--accent)] hover:underline"
                        >
                          &quot;{act.bookTitle}&quot;
                        </Link>
                      ) : (
                        <strong>&quot;{act.bookTitle}&quot;</strong>
                      )}
                    </>
                  )}

                  {act.type === "milestone_streak" && (
                    <span>{act.details || "Achieved a new daily reading streak"}</span>
                  )}

                  {act.type === "achievement_unlocked" && (
                    <span>Unlocked badge: <strong>{act.details || "New Milestone"}</strong></span>
                  )}
                </span>

                <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                  {formatTimeAgo(act.timestamp)}
                </span>
              </div>

              {act.bookCover && (
                <div className="mt-2.5 flex items-center gap-2 p-2 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)] max-w-xs">
                  <div className="w-8 h-11 rounded bg-[var(--secondary)] overflow-hidden flex-shrink-0 relative border border-[var(--border)]">
                    <Image
                      src={act.bookCover}
                      alt={act.bookTitle || "Cover"}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-[var(--foreground)] truncate block">
                      {act.bookTitle}
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] block">
                      Verified Library Record
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

