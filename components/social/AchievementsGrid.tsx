"use client";

import React, { useState, useMemo } from "react";
import { Achievement } from "@/lib/social";

interface AchievementsGridProps {
  achievements: Achievement[];
  title?: string;
  subtitle?: string;
}

type CategoryFilter = "all" | "reading" | "streak" | "focus" | "exploration" | "reflection" | "curation";
type StatusFilter = "all" | "unlocked" | "locked";

const CATEGORY_LABELS: Record<CategoryFilter, { label: string; icon: string }> = {
  all: { label: "All Badges", icon: "🏆" },
  reading: { label: "Volumes & Pages", icon: "📖" },
  streak: { label: "Streaks & Diya", icon: "🔥" },
  focus: { label: "Focus & Time", icon: "⏱️" },
  exploration: { label: "Realms", icon: "🧭" },
  reflection: { label: "Notes & Reflections", icon: "✍️" },
  curation: { label: "Shelf & Curation", icon: "📚" },
};

export default function AchievementsGrid({
  achievements,
  title = "Milestones & Badges",
  subtitle = "Earned through verified reading progress, unbroken streaks, study notes, and catalog exploration",
}: AchievementsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked).length, [achievements]);
  const completionPercentage = useMemo(
    () => (achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0),
    [unlockedCount, achievements.length]
  );

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === "unlocked" && !item.unlocked) return false;
      if (statusFilter === "locked" && item.unlocked) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [achievements, selectedCategory, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* 1. Header Progress Dashboard */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--accent)]/10 border border-[var(--border)] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              <span>🏆</span>
              <span>Scholarly Milestones</span>
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-[var(--foreground)] font-serif">
              {title}
            </h3>
            <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[var(--secondary)]/60 px-4 py-2.5 rounded-2xl border border-[var(--border)] flex-shrink-0">
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black font-mono text-[var(--accent)]">
                {unlockedCount}
                <span className="text-sm font-normal text-[var(--text-secondary)]"> / {achievements.length}</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] block">
                {completionPercentage}% Unlocked
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center text-lg font-bold shadow-inner">
              👑
            </div>
          </div>
        </div>

        {/* Overall Completion Bar */}
        <div className="w-full space-y-1.5 pt-2 border-t border-[var(--border)]/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Mastery Progress</span>
            <span className="text-xs font-mono font-bold text-[var(--accent)]">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--secondary)] overflow-hidden shadow-inner p-0.5 border border-[var(--border)]/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-amber-400 transition-all duration-700 shadow-sm"
              style={{ width: `${Math.max(3, completionPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search achievements by name or task..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[var(--card)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] placeholder-[var(--text-secondary)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Segment Control */}
          <div className="flex items-center bg-[var(--secondary)]/60 p-1 rounded-xl border border-[var(--border)] self-start sm:self-auto">
            {(["all", "unlocked", "locked"] as StatusFilter[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all capitalize cursor-pointer ${
                  statusFilter === st
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                {st === "all" ? "All" : st === "unlocked" ? "Earned" : "Locked"}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => {
            const count =
              cat === "all"
                ? achievements.length
                : achievements.filter((a) => a.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border flex-shrink-0 ${
                  isSelected
                    ? "bg-[var(--accent)] text-black font-bold border-[var(--accent)] shadow-xs"
                    : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)]"
                }`}
              >
                <span>{CATEGORY_LABELS[cat].icon}</span>
                <span>{CATEGORY_LABELS[cat].label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? "bg-black/20 text-black font-mono font-bold" : "bg-[var(--secondary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Badges Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--card)]/50 border border-[var(--border)] space-y-2">
          <div className="text-3xl">🔍</div>
          <h4 className="font-bold text-sm text-[var(--foreground)]">No achievements match your criteria</h4>
          <p className="text-xs text-[var(--text-secondary)]">Try adjusting your search terms or filter selections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAchievements.map((item) => (
            <div
              key={item.id}
              className={`relative p-4 sm:p-4.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                item.unlocked
                  ? "bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-amber-500/10 border-amber-500/40 shadow-sm hover:border-amber-400 hover:shadow-md hover:scale-[1.01]"
                  : "bg-[var(--card)]/40 border-[var(--border)] opacity-70 hover:opacity-100 hover:border-[var(--accent)]/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border shadow-inner ${
                    item.unlocked
                      ? "bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)] grayscale"
                  }`}
                >
                  {item.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-xs sm:text-[13px] text-[var(--foreground)] truncate font-serif">
                      {item.title}
                    </h4>
                    {item.unlocked ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase">
                        ✓ Earned
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                        {item.progress}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1.5 border-t border-[var(--border)]/40">
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                  <span>{item.unlocked ? "Completed" : "Progress"}</span>
                  <span className={item.unlocked ? "text-emerald-400 font-bold" : "text-[var(--accent)]"}>
                    {item.unlocked ? "100%" : `${item.progress}%`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.unlocked
                        ? "bg-gradient-to-r from-emerald-400 to-teal-300"
                        : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
