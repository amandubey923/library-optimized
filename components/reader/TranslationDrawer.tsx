"use client";

import React, { useState } from "react";
import { TranslationTarget, TranslationResult, PageExtract } from "@/lib/translator";

export type TranslationPosition = "left" | "right";

interface TranslationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PageExtract[];
  selectedTarget: TranslationTarget;
  onTargetChange: (target: TranslationTarget) => void;
  onTranslate: () => void;
  isLoading: boolean;
  result: TranslationResult | null;
  theme?: "default" | "sepia" | "dark" | "dim" | "light" | string;
  position: TranslationPosition;
  onPositionChange: (pos: TranslationPosition) => void;
}

export function TranslationDrawer({
  isOpen,
  onClose,
  pages,
  selectedTarget,
  onTargetChange,
  onTranslate,
  isLoading,
  result,
  theme,
  position,
  onPositionChange,
}: TranslationDrawerProps) {
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [copiedPage, setCopiedPage] = useState<number | null>(null);
  const [activePageFilter, setActivePageFilter] = useState<number | "all">("all");

  if (!isOpen) return null;

  const pageRangeLabel =
    pages.length > 1
      ? `Pages ${pages[0].pageNum}–${pages[1].pageNum}`
      : pages.length === 1
      ? `Page ${pages[0].pageNum}`
      : "Current Pages";

  const handleCopy = (pageNum: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPage(pageNum);
      setTimeout(() => setCopiedPage(null), 2000);
    });
  };

  const fontSizeClass =
    fontSize === "sm"
      ? "text-xs leading-relaxed"
      : fontSize === "lg"
      ? "text-base leading-loose"
      : "text-sm leading-relaxed";

  const visiblePages =
    activePageFilter === "all"
      ? pages
      : pages.filter((p) => p.pageNum === activePageFilter);

  // Exact left/right edge docking to the fullscreen container
  const containerClasses =
    position === "left"
      ? "absolute inset-y-0 left-0 z-40 w-full sm:w-[480px] md:w-[520px] lg:w-[580px] xl:w-[620px] max-w-[90vw] md:max-w-[45vw] bg-[var(--card)]/95 backdrop-blur-2xl border-r border-[var(--border)] shadow-2xl flex flex-col justify-between animate-slide-right text-left overflow-hidden select-text"
      : "absolute inset-y-0 right-0 z-40 w-full sm:w-[480px] md:w-[520px] lg:w-[580px] xl:w-[620px] max-w-[90vw] md:max-w-[45vw] bg-[var(--card)]/95 backdrop-blur-2xl border-l border-[var(--border)] shadow-2xl flex flex-col justify-between animate-slide-left text-left overflow-hidden select-text";

  return (
    <div className={containerClasses}>
      {/* Header with Fullscreen Workspace Controls & Exact Left/Right Position Toggle */}
      <div className="p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--card)] flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">🌐</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-serif font-bold text-xs sm:text-sm text-[var(--foreground)] truncate">
                Fullscreen Translation
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[var(--text-secondary)] font-mono text-[10px] border border-[var(--border)]">
                {pageRangeLabel}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] truncate">
              {position === "left" ? "Docked Left Edge ←" : "→ Docked Right Edge"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Position Selector (Exact Left / Right Edge Docking) */}
          <div className="flex items-center rounded-xl bg-[var(--secondary)] p-0.5 border border-[var(--border)] text-[10px]">
            <button
              onClick={() => onPositionChange("left")}
              className={`px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                position === "left"
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] font-bold shadow-[0_0_8px_var(--accent-glow)] border border-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
              title="Dock Translation Panel on Left Edge"
            >
              <span>←</span>
              <span>Left</span>
            </button>
            <button
              onClick={() => onPositionChange("right")}
              className={`px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                position === "right"
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] font-bold shadow-[0_0_8px_var(--accent-glow)] border border-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
              title="Dock Translation Panel on Right Edge"
            >
              <span>Right</span>
              <span>→</span>
            </button>
          </div>

          {/* Font Scale Controls */}
          <div className="flex items-center rounded-xl bg-[var(--secondary)] p-0.5 border border-[var(--border)] text-[10px]">
            <button
              onClick={() => setFontSize("sm")}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === "sm"
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] font-bold"
                  : "text-[var(--text-secondary)]"
              }`}
              title="Small Text"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize("base")}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === "base"
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] font-bold"
                  : "text-[var(--text-secondary)]"
              }`}
              title="Medium Text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize("lg")}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === "lg"
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] font-bold"
                  : "text-[var(--text-secondary)]"
              }`}
              title="Large Text"
            >
              A+
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title="Close Translation Panel (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Target Language Selector & Spread Page Tabs */}
      <div className="px-3 sm:px-4 py-2 border-b border-[var(--border)]/70 bg-[var(--secondary)]/40 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => onTargetChange("hindi")}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              selectedTarget === "hindi"
                ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] shadow-xs"
                : "bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)]"
            }`}
          >
            <span>🇮🇳</span>
            <span>Hindi</span>
          </button>

          <button
            onClick={() => onTargetChange("hinglish")}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              selectedTarget === "hinglish"
                ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] shadow-xs"
                : "bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)]"
            }`}
          >
            <span>💬</span>
            <span>Hinglish</span>
          </button>

          <button
            onClick={() => onTargetChange("english")}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              selectedTarget === "english"
                ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] shadow-xs"
                : "bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)]"
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
        </div>

        {/* Page Pairing Tabs (when 2 pages in spread) */}
        {pages.length > 1 && (
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setActivePageFilter("all")}
              className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                activePageFilter === "all"
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] font-bold"
                  : "bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)]"
              }`}
            >
              Spread
            </button>
            {pages.map((p, idx) => (
              <button
                key={p.pageNum}
                onClick={() => {
                  setActivePageFilter(p.pageNum);
                  if (idx === 0) onPositionChange("right");
                  else onPositionChange("left");
                }}
                className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  activePageFilter === p.pageNum
                    ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] font-bold"
                    : "bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)]"
                }`}
                title={`Focus on Page ${p.pageNum} (${idx === 0 ? "Left" : "Right"})`}
              >
                P{p.pageNum} {idx === 0 ? "Left" : "Right"}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onTranslate}
          disabled={isLoading}
          className="px-3 sm:px-4 py-1 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 flex-shrink-0"
        >
          {isLoading ? (
            <>
              <span className="animate-spin text-xs">↻</span>
              <span>Translating...</span>
            </>
          ) : (
            <>
              <span>Translate</span>
            </>
          )}
        </button>
      </div>

      {/* Main Scrollable Translation Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {isLoading ? (
          <div className="py-16 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-xl mx-auto animate-pulse">
              🌐
            </div>
            <h4 className="font-serif font-bold text-sm text-[var(--foreground)]">
              Translating {pageRangeLabel}...
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
              Extracting and understanding currently visible page content into{" "}
              <span className="font-semibold text-[var(--foreground)] capitalize">
                {selectedTarget}
              </span>
              .
            </p>
          </div>
        ) : result && !result.success ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-left space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <span>⚠️</span>
              <span>Translation Unavailable</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {result.error || "Unable to translate current pages. Please try again."}
            </p>
            <button
              onClick={onTranslate}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              Retry Translation ↻
            </button>
          </div>
        ) : result && result.success ? (
          <div className="space-y-4 animate-fade-in">
            {visiblePages.map((p) => {
              const translated = result.translations[p.pageNum];
              if (!translated && !p.text) return null;

              return (
                <div
                  key={p.pageNum}
                  className="p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[var(--foreground)] font-bold text-[11px] border border-[var(--border)]">
                        Page {p.pageNum}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] capitalize font-semibold">
                        {result.targetLanguage} Translation
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowOriginal(!showOriginal)}
                        className="text-[10px] text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                      >
                        {showOriginal ? "Hide Original" : "Show Original"}
                      </button>

                      <button
                        onClick={() => handleCopy(p.pageNum, translated || "")}
                        className="p-1 rounded-lg hover:bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] text-xs transition-colors cursor-pointer"
                        title="Copy Page Translation"
                      >
                        {copiedPage === p.pageNum ? "✓ Copied" : "📋 Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Translated Text */}
                  <div className={`${fontSizeClass} text-[var(--foreground)] whitespace-pre-wrap font-sans`}>
                    {translated || (
                      <span className="text-[var(--text-secondary)] italic">
                        No selectable text found on this page.
                      </span>
                    )}
                  </div>

                  {/* Original Text Comparison */}
                  {showOriginal && p.text && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]/40 bg-[var(--secondary)]/20 p-3 rounded-xl space-y-1">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Original Book Text (Page {p.pageNum})
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                        {p.text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <span className="text-3xl block">📖</span>
            <h4 className="font-serif font-bold text-sm text-[var(--foreground)]">
              Ready to Translate {pageRangeLabel}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
              Select your target language and click <strong>Translate</strong> to view translated content.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info Notice */}
      <div className="p-2.5 border-t border-[var(--border)] bg-[var(--card)]/80 text-[10px] text-[var(--text-secondary)] text-center flex-shrink-0">
        🔒 Fullscreen Translation Overlay. Original PDF remains unchanged and interactive.
      </div>
    </div>
  );
}
