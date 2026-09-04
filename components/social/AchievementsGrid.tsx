"use client";

import React from "react";
import { Achievement } from "@/lib/social";

interface AchievementsGridProps {
  achievements: Achievement[];
}

export default function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Header Stat Summary */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
        <div>
          <h3 className="font-bold text-sm text-[var(--foreground)] font-serif">
            Milestones &amp; Badges
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Earned through verified reading progress, streaks, and reflections
          </p>
        </div>
        <div className="text-right">
          <span className="text-base font-extrabold font-mono text-[var(--accent)]">
            {unlockedCount} / {achievements.length}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] block">Unlocked</span>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {achievements.map((item) => (
          <div
            key={item.id}
            className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
              item.unlocked
                ? "bg-gradient-to-br from-[var(--card)] to-[var(--secondary)]/70 border-[var(--accent)]/40 shadow-sm"
                : "bg-[var(--card)]/40 border-[var(--border)] opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border shadow-inner ${
                  item.unlocked
                    ? "bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]"
                    : "bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {item.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-xs text-[var(--foreground)] truncate">
                    {item.title}
                  </h4>
                  {item.unlocked && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Earned
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-1">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Progress bar if not unlocked */}
            {!item.unlocked && (
              <div className="space-y-1 pt-1 border-t border-[var(--border)]/40">
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

