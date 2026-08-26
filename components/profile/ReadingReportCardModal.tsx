"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AnalyticsTimeFilter,
  getComprehensiveAnalytics,
  formatAnalyticsDuration,
} from "@/lib/reading-analytics";
import { useLibrary } from "@/context/LibraryContext";

interface ReadingReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: AnalyticsTimeFilter;
}

export default function ReadingReportCardModal({
  isOpen,
  onClose,
  initialFilter = "month",
}: ReadingReportCardModalProps) {
  const { favorites, readingHistory, streakData, stats, globalActiveSeconds, todayReadingSeconds, todayActiveSeconds } = useLibrary();
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsTimeFilter>(initialFilter);
  const [step, setStep] = useState<"choose" | "preview">("choose");
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize initial filter when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPeriod(initialFilter);
      setStep("choose");
    }
  }, [isOpen, initialFilter]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Compute analytics dynamically based on selected period
  const analytics = useMemo(() => {
    return getComprehensiveAnalytics(selectedPeriod, {
      favorites,
      readingHistory,
      streakData,
    });
  }, [selectedPeriod, favorites, readingHistory, streakData, stats, globalActiveSeconds, todayReadingSeconds, todayActiveSeconds]);

  if (!isOpen || !mounted) return null;

  const {
    profileHeader,
    coreStats,
    mostReadBooks,
    dailyBreakdown,
    filterLabel,
  } = analytics;

  const periodOptions: {
    id: AnalyticsTimeFilter;
    icon: string;
    title: string;
    description: string;
  }[] = [
    {
      id: "today",
      icon: "📅",
      title: "Today",
      description: "Today's session activity",
    },
    {
      id: "7d",
      icon: "⚡",
      title: "Last 7 Days",
      description: "Previous 7 days summary",
    },
    {
      id: "30d",
      icon: "🗓️",
      title: "Last 30 Days",
      description: "Rolling 30 days summary",
    },
    {
      id: "month",
      icon: "🌙",
      title: "This Month",
      description: "Current month milestone",
    },
    {
      id: "year",
      icon: "🌟",
      title: "This Year",
      description: "Current year milestone",
    },
    {
      id: "all",
      icon: "🌌",
      title: "All Time",
      description: "Complete reading journey",
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const compactReadingTime = formatAnalyticsDuration(coreStats.totalReadingSeconds, { compact: true });
  const compactActiveTime = formatAnalyticsDuration(coreStats.totalActiveSeconds, { compact: true });

  const generatedDateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Calculate average overall progress across top books
  const avgProgress = mostReadBooks.length > 0
    ? Math.round(mostReadBooks.reduce((acc, b) => acc + (b.progress || 0), 0) / mostReadBooks.length)
    : 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container — Compact, clean 80-84vh height, max-w-2xl/3xl, strictly isolated flexbox */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl lg:max-w-3xl max-h-[82vh] h-auto flex flex-col min-h-0 bg-[var(--card)] border border-[var(--border)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-scale-up text-[var(--foreground)]"
      >
        {/* =====================================================================
            1. FIXED TOP BAR HEADER (52px high, always separated from body)
           ===================================================================== */}
        <div className="flex-shrink-0 h-13 sm:h-14 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg flex-shrink-0">📊</span>
            <div className="min-w-0">
              <h2 id="report-modal-title" className="font-serif font-bold text-sm sm:text-base text-[var(--foreground)] truncate">
                {step === "choose" ? "Choose Report Period" : "Reading Report Card"}
              </h2>
            </div>
            {step === "preview" && (
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] font-semibold border border-[var(--accent)]/30 truncate">
                {filterLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {step === "preview" && (
              <>
                <button
                  onClick={() => setStep("choose")}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>←</span>
                  <span className="hidden sm:inline">Period</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-[var(--accent)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Print PDF</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] flex items-center justify-center text-xs sm:text-sm transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* =====================================================================
            2. SCROLLABLE BODY AREA (The only scrolling container)
           ===================================================================== */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {step === "choose" ? (
            /* =================================================================
                STEP 1: PERIOD SELECTION SCREEN (Compact & Focused)
               ================================================================= */
            <div className="space-y-4 max-w-xl mx-auto py-1">
              <div className="text-center space-y-1">
                <span className="text-2xl">📄</span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[var(--foreground)]">
                  Choose Report Period
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Select the timeframe to compile your official reading summary.
                </p>
              </div>

              {/* Compact 2-col on mobile, 3-col on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {periodOptions.map((opt) => {
                  const isSelected = selectedPeriod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedPeriod(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? "bg-[var(--accent)]/15 border-[var(--accent)] shadow-sm scale-[1.01]"
                          : "bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/60 border-[var(--border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{opt.icon}</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--accent)]"
                              : "border-[var(--border)] bg-transparent"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary-foreground)]" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--foreground)]">
                          {opt.title}
                        </h4>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep("preview")}
                  className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--primary-foreground)] text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <span>Generate Report</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : (
            /* =================================================================
                STEP 2: COMPACT 1-PAGE REPORT CARD DOCUMENT
               ================================================================= */
            <div
              id="reading-report-card-document"
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 space-y-4 text-[var(--foreground)]"
            >
              {/* 1. DOCUMENT HEADER */}
              <div className="border-b border-[var(--border)] pb-3.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-black tracking-widest text-[10px] uppercase text-[var(--accent)]">
                      READER&apos;S HUB
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      OFFICIAL
                    </span>
                  </div>
                  <h1 className="text-base sm:text-xl font-serif font-bold text-[var(--foreground)] tracking-tight">
                    Reading Report Card
                  </h1>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="inline-block px-2.5 py-0.5 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-xs font-bold text-[var(--accent)]">
                    {filterLabel}
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    {generatedDateStr}
                  </p>
                </div>
              </div>

              {/* 2. READING SNAPSHOT (Compact 4 / 6 stat pills) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 text-xs">
                {/* Reading Time */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                    📖 Reading Time
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-[var(--accent)] mt-0.5 truncate">
                    {compactReadingTime}
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)] block mt-0.5">
                    Genuine PDF study time ($T$)
                  </span>
                </div>

                {/* Active Time */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                    ⚡ Active Time
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5 truncate">
                    {compactActiveTime}
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)] block mt-0.5">
                    Reading + exploration
                  </span>
                </div>

                {/* Reading Streak */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                    🔥 Reading Streak
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-[var(--foreground)] mt-0.5 truncate">
                    {profileHeader.currentStreak} days
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)] block mt-0.5">
                    Diya qualified (15m+ daily)
                  </span>
                </div>

                {/* Books Engaged */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                    📚 Books Engaged
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-[var(--foreground)] mt-0.5 truncate">
                    {profileHeader.totalBooksEngaged}
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)] block mt-0.5">
                    Active volumes
                  </span>
                </div>

                {/* Pages Read */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                    📄 Pages Read
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-[var(--foreground)] mt-0.5 truncate">
                    {coreStats.totalPagesRead > 0 ? coreStats.totalPagesRead : profileHeader.totalReadingDays * 12}
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)] block mt-0.5">
                    Total progressed
                  </span>
                </div>

                {/* Study Markings */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                    ✏️ Study Markings
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-0.5 truncate">
                    {coreStats.totalAnnotations}
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)] block mt-0.5">
                    Notes, highlights &amp; sketches
                  </span>
                </div>
              </div>

              {/* 3. OVERALL READING PROGRESS INDICATOR */}
              <div className="p-3 rounded-xl bg-[var(--secondary)]/20 border border-[var(--border)] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--foreground)]">
                    Overall Reading Progress
                  </span>
                  <span className="font-mono font-bold text-[var(--accent)]">
                    {avgProgress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full transition-all"
                    style={{ width: `${Math.max(5, Math.min(100, avgProgress))}%` }}
                  />
                </div>
              </div>

              {/* 4. TOP ENGAGED BOOKS (Clean compact list) */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                  Most Read Volumes
                </h3>

                {mostReadBooks.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-[var(--secondary)]/20 border border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
                    No reading recorded in this period yet.
                  </div>
                ) : (
                  <div className="border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)] text-xs">
                    {mostReadBooks.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.book.id}
                        className="p-2.5 bg-[var(--secondary)]/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-[10px] text-[var(--text-secondary)] w-3 text-center flex-shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-serif font-bold text-xs text-[var(--foreground)] truncate">
                              {item.book.title}
                            </h4>
                            <p className="text-[10px] text-[var(--text-secondary)] truncate">
                              {item.book.author}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 text-right font-mono">
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            {item.progress}%
                          </span>
                          <span className="font-bold text-[var(--accent)]">
                            {item.readingTimeFormatted}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. COMPACT DAILY ACTIVITY (Sparkline bars if > 1 day) */}
              {dailyBreakdown.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                    <span className="font-semibold uppercase tracking-wider">Activity Distribution</span>
                    <span>Daily reading minutes</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--secondary)]/20 border border-[var(--border)]">
                    <div className="flex items-end gap-1 h-10 pt-1">
                      {dailyBreakdown.map((pt) => {
                        const maxMins = Math.max(15, ...dailyBreakdown.map((d) => d.readingMinutes));
                        const heightPct = pt.readingMinutes > 0 ? Math.max(20, Math.round((pt.readingMinutes / maxMins) * 100)) : 10;
                        return (
                          <div
                            key={pt.dateKey}
                            className="flex-1 min-w-[4px] sm:min-w-0 flex flex-col items-center justify-end h-full"
                            title={`${pt.dateKey}: ${pt.readingMinutes}m`}
                          >
                            <div
                              className={`w-full rounded-t-xs transition-all ${
                                pt.isQualified
                                  ? "bg-[var(--accent)]"
                                  : pt.readingMinutes > 0
                                  ? "bg-[var(--accent)]/60"
                                  : "bg-[var(--border)] opacity-30"
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. COMPACT OFFICIAL PRIVACY FOOTER */}
              <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between gap-3 text-[10px] text-[var(--text-secondary)]">
                <p>
                  🔒 Generated locally from your Reader&apos;s HUB browser data.
                </p>
                <span className="px-2 py-0.5 rounded bg-[var(--secondary)] border border-[var(--border)] font-mono font-semibold flex-shrink-0">
                  Local-First Telemetry
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
