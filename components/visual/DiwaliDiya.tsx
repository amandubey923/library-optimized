"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { getLocalDateKey, getPreviousDateKey, DAILY_READING_GOAL_SECONDS } from "@/lib/reader-storage";

export default function DiwaliDiya() {
  const { streakData, todayReadingSeconds, isTodayQualified } = useLibrary();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const todayMinutes = Math.floor(todayReadingSeconds / 60);
  const goalMinutes = 15;
  const progressPercent = Math.min(100, Math.round((todayReadingSeconds / DAILY_READING_GOAL_SECONDS) * 100));

  // Determine Diya lighting state
  const isLit = isTodayQualified || todayReadingSeconds >= DAILY_READING_GOAL_SECONDS;
  const isPartiallyLit = !isLit && todayReadingSeconds > 0;

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Compute Last 7 Days History
  const last7Days = React.useMemo(() => {
    const days: { dateKey: string; label: string; qualified: boolean; minutes: number; isToday: boolean }[] = [];
    const todayKey = getLocalDateKey();

    let current = todayKey;
    for (let i = 0; i < 7; i++) {
      const parts = current.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const activity = streakData.daily[current];
      const secs = activity?.seconds || 0;
      const qual = Boolean(activity?.qualified || secs >= DAILY_READING_GOAL_SECONDS);

      days.unshift({
        dateKey: current,
        label: i === 0 ? "Today" : dayName,
        qualified: qual,
        minutes: Math.floor(secs / 60),
        isToday: i === 0,
      });

      current = getPreviousDateKey(current);
    }
    return days;
  }, [streakData, todayReadingSeconds]);

  // Milestones
  const nextMilestone = [3, 7, 14, 30, 50, 100].find((m) => m > streakData.currentStreak) || 100;

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* -------------------------------------------------------------
       * Navbar Diya Trigger Button
       * ------------------------------------------------------------- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-2xl border transition-all cursor-pointer select-none ${
          isLit
            ? "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:border-amber-400"
            : isPartiallyLit
            ? "bg-amber-500/10 border-amber-500/25 hover:border-amber-500/40 text-[var(--foreground)]"
            : "bg-[var(--card)] hover:bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
        }`}
        title={
          isLit
            ? `Diwali Diya Lit! ${streakData.currentStreak} Day Streak (${todayMinutes}m read today)`
            : isPartiallyLit
            ? `Reading in Progress: ${todayMinutes}/15 min to light your Diya`
            : "Read 15 minutes today to light your Diwali Diya"
        }
        aria-label="Daily Reading Streak"
      >
        {/* Custom Handcrafted SVG Diwali Diya Icon */}
        <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
          {/* Ambient Flame Glow (When Lit) */}
          {isLit && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400/40 blur-xs animate-pulse" />
          )}

          <svg className="w-5 h-5 overflow-visible" viewBox="0 0 28 28" fill="none">
            {/* Clay / Brass Diya Body */}
            <path
              d="M4 16C4 22 10 24 14 24C18 24 24 22 24 16C24 14.5 22 14 14 14C6 14 4 14.5 4 16Z"
              fill={isLit ? "url(#diyaBodyLit)" : isPartiallyLit ? "#b45309" : "#78716c"}
              stroke={isLit ? "#f59e0b" : isPartiallyLit ? "#d97706" : "#57534e"}
              strokeWidth="1.2"
            />
            {/* Decorative Rim */}
            <path
              d="M5 15C8 16 20 16 23 15"
              stroke={isLit ? "#fbbf24" : "#a8a29e"}
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Diya Base Ring */}
            <path
              d="M10 24C10 25.5 18 25.5 18 24"
              stroke={isLit ? "#d97706" : "#57534e"}
              strokeWidth="1.2"
            />

            {/* Flame Component */}
            {isLit ? (
              /* Golden Flickering Flame */
              <g className="animate-bounce-subtle origin-bottom">
                {/* Outer Flame Halo */}
                <path
                  d="M14 2C14 2 19 8 19 12C19 14.8 16.8 15.5 14 15.5C11.2 15.5 9 14.8 9 12C9 8 14 2 14 2Z"
                  fill="url(#flameOuter)"
                  opacity="0.95"
                />
                {/* Inner Core Flame */}
                <path
                  d="M14 6C14 6 17 9.5 17 12C17 13.7 15.7 14.5 14 14.5C12.3 14.5 11 13.7 11 12C11 9.5 14 6 14 6Z"
                  fill="url(#flameInner)"
                />
                {/* Bright White Center Dot */}
                <ellipse cx="14" cy="12" rx="1.2" ry="1.8" fill="#ffffff" />
              </g>
            ) : isPartiallyLit ? (
              /* Emerging Spark Flame */
              <g>
                <path
                  d="M14 7C14 7 16.5 10.5 16.5 12.5C16.5 14 15.4 14.8 14 14.8C12.6 14.8 11.5 14 11.5 12.5C11.5 10.5 14 7 14 7Z"
                  fill="#f59e0b"
                  opacity="0.75"
                />
                <circle cx="14" cy="12.5" r="1.2" fill="#fef08a" />
              </g>
            ) : (
              /* Unlit Dark Wick */
              <line x1="14" y1="11" x2="14" y2="14" stroke="#44403c" strokeWidth="1.6" strokeLinecap="round" />
            )}

            {/* Gradients */}
            <defs>
              <linearGradient id="diyaBodyLit" x1="4" y1="14" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#d97706" />
                <stop offset="0.5" stopColor="#b45309" />
                <stop offset="1" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="flameOuter" x1="14" y1="2" x2="14" y2="15.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.3" stopColor="#f59e0b" />
                <stop offset="1" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="flameInner" x1="14" y1="6" x2="14" y2="14.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" />
                <stop offset="0.5" stopColor="#fef08a" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Text & Streak Count */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold font-mono ${isLit ? "text-amber-400 font-extrabold" : "text-[var(--foreground)]"}`}>
            {streakData.currentStreak > 0 ? `${streakData.currentStreak}d` : "0d"}
          </span>

          {/* Desktop Label */}
          <span className="hidden sm:inline text-[11px] text-[var(--text-secondary)] font-medium">
            {isLit ? "Streak" : `${todayMinutes}/15m`}
          </span>
        </div>

        {/* Small Glowing Indicator when Lit */}
        {isLit && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
        )}
      </button>

      {/* -------------------------------------------------------------
       * Interactive Streak Details Popover Card
       * ------------------------------------------------------------- */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-88 p-5 rounded-3xl glass-panel border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-2xl shadow-2xl animate-scale-up text-left space-y-4">
          {/* Header with Diya Showcase */}
          <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${
                isLit
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  : isPartiallyLit
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  : "bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)]"
              }`}>
                🪔
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-[var(--foreground)] flex items-center gap-1.5">
                  <span>Daily Reading Streak</span>
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {isLit
                    ? "✨ Your Diwali Diya is lit today!"
                    : isPartiallyLit
                    ? `🔥 ${15 - todayMinutes} more min to light your Diya`
                    : "Read 15 min today to light your Diya"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Today's Reading Goal Progress Bar */}
          <div className="space-y-1.5 bg-[var(--secondary)]/40 p-3.5 rounded-2xl border border-[var(--border)]">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--text-secondary)]">Today&apos;s Active Reading</span>
              <span className={isLit ? "text-amber-400 font-bold" : "text-[var(--foreground)]"}>
                {todayMinutes} / 15 min {isLit && "✓"}
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[var(--background)] overflow-hidden border border-[var(--border)]/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isLit
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "bg-gradient-to-r from-[var(--primary)] to-amber-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] italic text-right">
              {isLit ? "Goal completed! Extra reading time continues to record." : "Time accumulates only while actively reading."}
            </p>
          </div>

          {/* Last 7 Days Visual Calendar */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Last 7 Days Activity
            </span>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {last7Days.map((day) => (
                <div
                  key={day.dateKey}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    day.isToday
                      ? isLit
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-xs"
                        : "bg-[var(--secondary)] border-[var(--accent)] text-[var(--foreground)]"
                      : day.qualified
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-[var(--card)] border-[var(--border)] text-[var(--text-secondary)] opacity-60"
                  }`}
                >
                  <span className="text-[10px] font-semibold">{day.label}</span>
                  <span className="text-xs my-0.5">
                    {day.qualified ? "🪔" : day.isToday ? (day.minutes > 0 ? "🕯️" : "○") : "—"}
                  </span>
                  <span className="text-[9px] font-mono opacity-80">{day.minutes}m</span>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Stats & Milestone */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)] text-center text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-secondary)] block">Current Streak</span>
              <strong className="text-base font-serif font-bold text-amber-400">
                {streakData.currentStreak} {streakData.currentStreak === 1 ? "Day" : "Days"}
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-secondary)] block">Longest Streak</span>
              <strong className="text-base font-serif font-bold text-[var(--foreground)]">
                {streakData.longestStreak} {streakData.longestStreak === 1 ? "Day" : "Days"}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
