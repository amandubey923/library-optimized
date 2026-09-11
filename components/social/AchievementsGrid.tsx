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

interface CategoryMeta {
  label: string;
  icon: string;
  description: string;
}

const CATEGORY_META: Record<CategoryFilter, CategoryMeta> = {
  all: {
    label: "All Milestones",
    icon: "🏆",
    description: "Complete catalog of scholarly achievements across all reading dimensions",
  },
  reading: {
    label: "Volumes & Pages",
    icon: "📖",
    description: "Completed books and verified page milestones",
  },
  streak: {
    label: "Streaks & Diya",
    icon: "🔥",
    description: "Consecutive daily reading habits and unbroken dedication",
  },
  focus: {
    label: "Focus & Time",
    icon: "⏱️",
    description: "Deep study focus hours and continuous reading sessions",
  },
  exploration: {
    label: "Realms",
    icon: "🧭",
    description: "Breadth across diverse catalog categories and genres",
  },
  reflection: {
    label: "Notes & Annotations",
    icon: "✍️",
    description: "Reflections penned, margin notes, and study highlights",
  },
  curation: {
    label: "Shelf & Curation",
    icon: "📚",
    description: "Favorites preserved, collections organized, and offline downloads",
  },
};

export default function AchievementsGrid({
  achievements,
  title = "Milestones & Badges",
  subtitle = "Earned through verified reading progress, unbroken streaks, study notes, and catalog exploration",
}: AchievementsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const totalCount = achievements.length;
  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked).length, [achievements]);
  const lockedCount = totalCount - unlockedCount;
  const completionPercentage = useMemo(
    () => (totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0),
    [unlockedCount, totalCount]
  );

  // Per-category completion stats for pills
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; unlocked: number }> = {};
    achievements.forEach((a) => {
      if (!stats[a.category]) stats[a.category] = { total: 0, unlocked: 0 };
      stats[a.category].total += 1;
      if (a.unlocked) stats[a.category].unlocked += 1;
    });
    return stats;
  }, [achievements]);

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
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [achievements, selectedCategory, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* 1. Master Header Dashboard */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--accent)]/10 border border-[var(--border)] shadow-lg space-y-5">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
              <span>🏆</span>
              <span>Scholarly Milestones</span>
            </div>
            <h3 className="font-bold text-xl sm:text-2xl text-[var(--foreground)] font-serif tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[var(--secondary)]/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-[var(--border)] flex-shrink-0 shadow-inner">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--accent)] flex items-baseline justify-end gap-1">
                <span>{unlockedCount}</span>
                <span className="text-xs font-normal text-[var(--text-secondary)]">/ {totalCount}</span>
              </div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400 block">
                {completionPercentage}% Unlocked
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/10 border border-amber-400/40 text-amber-400 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              👑
            </div>
          </div>
        </div>

        {/* Global Mastery Progress Bar */}
        <div className="w-full space-y-2 pt-3 border-t border-[var(--border)]/60 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Library Mastery</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--text-secondary)] font-mono">
                {unlockedCount} of {totalCount} Badges
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--accent)]">{completionPercentage}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--secondary)] overflow-hidden shadow-inner p-0.5 border border-[var(--border)]/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-amber-400 transition-all duration-700 shadow-sm"
              style={{ width: `${Math.max(2, completionPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Controls: Search, Status Segments & Category Filtering */}
      <div className="space-y-3.5">
        {/* Search bar + Status Segments */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search achievements by name, requirement, or realm..."
              className="w-full pl-9 pr-8 py-2.5 rounded-2xl text-xs sm:text-[13px] bg-[var(--card)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] placeholder-[var(--text-secondary)] shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer p-0.5 rounded-full"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Segment Controls: All | Unlocked | Locked */}
          <div className="flex items-center bg-[var(--secondary)]/70 p-1 rounded-2xl border border-[var(--border)] self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "all"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>All</span>
              <span className="text-[10px] font-mono opacity-80">({totalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter("unlocked")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "unlocked"
                  ? "bg-emerald-500/20 text-emerald-400 shadow-xs border border-emerald-500/40"
                  : "text-[var(--text-secondary)] hover:text-emerald-400"
              }`}
            >
              <span>🏆 Earned</span>
              <span className="text-[10px] font-mono opacity-90">({unlockedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter("locked")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "locked"
                  ? "bg-amber-500/15 text-amber-300 shadow-xs border border-amber-500/30"
                  : "text-[var(--text-secondary)] hover:text-amber-300"
              }`}
            >
              <span>🔒 In Progress</span>
              <span className="text-[10px] font-mono opacity-90">({lockedCount})</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills with completion counters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
          {(Object.keys(CATEGORY_META) as CategoryFilter[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const isSelected = selectedCategory === cat;
            const stats =
              cat === "all"
                ? { total: totalCount, unlocked: unlockedCount }
                : categoryStats[cat] || { total: 0, unlocked: 0 };

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border flex-shrink-0 shadow-xs ${
                  isSelected
                    ? "bg-[var(--accent)] text-black font-bold border-[var(--accent)] shadow-md scale-[1.02]"
                    : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]/40"
                }`}
              >
                <span className="text-sm">{meta.icon}</span>
                <span>{meta.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected
                      ? "bg-black/25 text-black"
                      : stats.unlocked === stats.total && stats.total > 0
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-[var(--secondary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {stats.unlocked}/{stats.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Badges Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--card)]/50 border border-[var(--border)] space-y-3">
          <div className="text-4xl">🔍</div>
          <h4 className="font-bold text-base text-[var(--foreground)] font-serif">No achievements match your filters</h4>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
            Try adjusting your search terms, changing the category, or switching between Earned and In Progress status.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setStatusFilter("all");
              setSearchQuery("");
            }}
            className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-black hover:opacity-90 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((item) => {
            const isUnlocked = item.unlocked;
            const progress = item.progress || 0;
            const displayProgress = isUnlocked ? 100 : Math.min(99, progress);

            return (
              <div
                key={item.id}
                className={`relative p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-4 group ${
                  isUnlocked
                    ? "bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-amber-500/10 border-amber-500/40 shadow-sm hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5"
                    : "bg-[var(--card)]/50 border-[var(--border)]/80 opacity-80 hover:opacity-100 hover:border-[var(--accent)]/40 hover:bg-[var(--card)] shadow-xs hover:shadow-md"
                }`}
              >
                {/* Decorative Top Accent Glow for Unlocked Badges */}
                {isUnlocked && (
                  <div className="absolute top-0 right-8 w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 rounded-full" />
                )}

                <div className="space-y-3">
                  {/* Top Bar: Icon + Title + Status Pill */}
                  <div className="flex items-start gap-3.5">
                    {/* Badge Icon Container */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border shadow-inner transition-transform group-hover:scale-105 ${
                          isUnlocked
                            ? "bg-gradient-to-br from-amber-400/20 via-amber-500/15 to-amber-600/5 border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/20"
                            : "bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)] grayscale contrast-75"
                        }`}
                      >
                        {item.icon}
                      </div>

                      {/* Small overlay badge: Star for unlocked, lock for locked */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border shadow-xs ${
                          isUnlocked
                            ? "bg-amber-400 text-black border-amber-300 font-black shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            : "bg-neutral-800 text-neutral-300 border-neutral-700"
                        }`}
                        title={isUnlocked ? "Unlocked Milestone" : "Locked Milestone"}
                      >
                        {isUnlocked ? "✓" : "🔒"}
                      </div>
                    </div>

                    {/* Badge Title & Status Pill */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="font-bold text-sm sm:text-base text-[var(--foreground)] truncate font-serif leading-snug">
                          {item.title}
                        </h4>
                      </div>

                      {/* Pill Badge */}
                      <div>
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                            <span>✓</span>
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--secondary)] text-amber-300/90 border border-amber-500/25">
                            <span>🔒</span>
                            <span>{item.progressLabel || `${progress}%`}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description / Requirement */}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Progress Metric & Bar */}
                <div className="space-y-1.5 pt-2.5 border-t border-[var(--border)]/50">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                      {isUnlocked ? "Requirement Met" : "Progress to Unlock"}
                    </span>
                    <span
                      className={`font-bold ${
                        isUnlocked ? "text-emerald-400" : "text-[var(--accent)]"
                      }`}
                    >
                      {isUnlocked ? "100%" : item.progressLabel || `${progress}%`}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--secondary)] overflow-hidden p-0.5 shadow-inner border border-[var(--border)]/40">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isUnlocked
                          ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                          : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                      }`}
                      style={{ width: `${Math.max(isUnlocked ? 100 : 3, displayProgress)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
