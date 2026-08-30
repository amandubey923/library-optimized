"use client";

import React, { useState } from "react";
import { useLibrary } from "@/context/LibraryContext";

interface ReadingSessionTimerProps {
  bookId: string;
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
}

export const SESSION_PRESETS = [15, 25, 30, 45, 60];

export default function ReadingSessionTimer({
  bookId,
  currentPage,
  isOpen,
  onClose,
}: ReadingSessionTimerProps) {
  const {
    activeSession,
    startReadingSession,
    endReadingSession,
    todayReadingSeconds,
    isTodayQualified,
    showToast,
  } = useLibrary();

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const isSessionRunning = activeSession && activeSession.isActive && activeSession.bookId === bookId;

  const elapsed = activeSession?.elapsedSeconds || 0;
  const targetSecs = (activeSession?.targetMinutes || selectedMinutes) * 60;
  const progressPct = Math.min(100, Math.round((elapsed / (targetSecs || 1)) * 100));

  const startPage = activeSession?.startPage || currentPage;
  const pagesCovered = Math.max(0, currentPage - startPage);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  };

  const handleStart = () => {
    startReadingSession(bookId, currentPage, selectedMinutes);
    showToast("🎯 " + selectedMinutes + "m Reading Session Started!");
  };

  const handleStop = () => {
    endReadingSession();
    showToast("Reading session concluded. Great focus! 🌟");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in text-left">
      <div
        className="w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-5 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-timer-title"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-lg flex items-center justify-center text-amber-400">
              ⏱️
            </div>
            <div>
              <h3 id="session-timer-title" className="font-serif font-bold text-base text-[var(--foreground)]">
                Focused Reading Session
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {isSessionRunning ? "Session in Progress" : "Set your study target"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {isSessionRunning ? (
          <div className="space-y-4 text-center py-2">
            {/* Active Session Display */}
            <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-2">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[var(--accent)]">
                {formatTime(elapsed)}
                <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">
                  / {activeSession?.targetMinutes}m
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[var(--accent)] transition-all duration-300"
                  style={{ width: progressPct + "%" }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-[var(--text-secondary)] pt-1">
                <span>Started: Page {startPage}</span>
                <span className="text-[var(--foreground)] font-semibold">
                  Pages Read: {pagesCovered}
                </span>
              </div>
            </div>

            {/* Streak Goal Contribution */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span>🪔</span>
                <span>Diya Goal:</span>
              </span>
              <span className="font-bold">
                {Math.floor(todayReadingSeconds / 60)} / 15 min {isTodayQualified ? "✓" : ""}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleStop}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs transition-colors cursor-pointer border border-rose-500/30"
              >
                End Session
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-md cursor-pointer"
              >
                Keep Reading →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Choose a dedicated reading duration. Active reading time will automatically ignite your daily study Diya.
            </p>

            {/* Presets Grid */}
            <div className="grid grid-cols-5 gap-2">
              {SESSION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={"py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border " + (
                    selectedMinutes === mins
                      ? "bg-[var(--accent)] text-black border-[var(--accent)] shadow-md"
                      : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border-[var(--border)]"
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-1 text-xs text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Starting from:</span>
                <span className="text-[var(--foreground)] font-semibold">Page {currentPage}</span>
              </div>
              <div className="flex justify-between">
                <span>Today&apos;s active study:</span>
                <span className="text-[var(--accent)] font-semibold">{Math.floor(todayReadingSeconds / 60)} minutes</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="w-full py-3 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-lg hover:scale-102 transition-transform cursor-pointer"
            >
              Start {selectedMinutes}-Minute Focus Session 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
