"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Book } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";
import { getBookAnnotations, ReadingTimelineEvent } from "@/lib/reader-storage";

interface BookReadingMemoryProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onJumpToPage?: (page: number) => void;
}

type MemoryTab = "overview" | "replay" | "highlights" | "notes" | "drawings" | "bookmarks";

export default function BookReadingMemory({
  book,
  isOpen,
  onClose,
  onJumpToPage,
}: BookReadingMemoryProps) {
  const { getReadingProgress, getReadingMemory } = useLibrary();
  const [activeTab, setActiveTab] = useState<MemoryTab>("overview");
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<string>("all");
  const [showPrintReport, setShowPrintReport] = useState<boolean>(false);

  const progress = getReadingProgress(book.id);
  const memory = getReadingMemory(book.id);
  const annotations = useMemo(() => getBookAnnotations(book.id), [book.id]);

  if (!isOpen) return null;

  const totalMinutes = Math.floor((memory.totalSeconds || 0) / 60);
  const highlights = annotations.highlights || [];
  const notes = annotations.notes || [];
  const bookmarks = annotations.bookmarks || [];
  const drawings = annotations.drawings || {};
  const drawingPages = Object.keys(drawings).map(Number).filter((p) => drawings[p]?.length > 0);

  const totalAnnotations = highlights.length + notes.length + bookmarks.length + drawingPages.length;

  // 1. Calculate Annotation Density across pages
  const totalPages = Number(book.pages) || progress?.totalPages || 100;
  const pageDensityMap: Record<number, number> = {};

  highlights.forEach((h) => {
    pageDensityMap[h.page] = (pageDensityMap[h.page] || 0) + 1;
  });
  notes.forEach((n) => {
    pageDensityMap[n.page] = (pageDensityMap[n.page] || 0) + 1;
  });
  bookmarks.forEach((b) => {
    pageDensityMap[b.page] = (pageDensityMap[b.page] || 0) + 1;
  });
  drawingPages.forEach((p) => {
    pageDensityMap[p] = (pageDensityMap[p] || 0) + (drawings[p]?.length || 1);
  });

  // Find most annotated page
  let mostAnnotatedPage: number | null = null;
  let maxPageCount = 0;
  Object.entries(pageDensityMap).forEach(([pageStr, count]) => {
    if (count > maxPageCount) {
      maxPageCount = count;
      mostAnnotatedPage = Number(pageStr);
    }
  });

  // Bucket density for visual heatmap (20 segments)
  const segmentsCount = Math.min(20, Math.max(5, totalPages));
  const pagesPerSegment = Math.ceil(totalPages / segmentsCount);
  const densitySegments = Array.from({ length: segmentsCount }).map((_, idx) => {
    const startP = idx * pagesPerSegment + 1;
    const endP = Math.min(totalPages, (idx + 1) * pagesPerSegment);
    let segmentScore = 0;
    for (let p = startP; p <= endP; p++) {
      segmentScore += pageDensityMap[p] || 0;
    }
    return {
      segmentIndex: idx,
      startPage: startP,
      endPage: endP,
      count: segmentScore,
    };
  });

  const maxSegmentScore = Math.max(1, ...densitySegments.map((s) => s.count));

  // Filtered Highlights
  const filteredHighlights = highlights.filter((h) =>
    selectedHighlightColor === "all" ? true : h.color === selectedHighlightColor
  );

  // Authentic Reading Replay timeline from recorded sessions
  const timelineEvents: ReadingTimelineEvent[] = memory.timeline || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in text-left">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col justify-between animate-scale-up">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-14 h-20 rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
              <Image src={book.cover} alt={book.title} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">🧠</span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--foreground)] truncate">
                  My Reading Memory 2.0
                </h3>
              </div>
              <h4 className="text-xs font-semibold text-[var(--accent)] truncate mt-0.5">
                {book.title}
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                by {book.author} • {totalMinutes}m active reading • {totalAnnotations} personal markings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintReport(!showPrintReport)}
              className="px-3 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all flex items-center gap-1.5 cursor-pointer"
              title="Print or Export Reading Report"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Report</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center text-xs transition-all cursor-pointer flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Filter Navigation */}
        <div className="flex items-center gap-1.5 px-5 pt-3 border-b border-[var(--border)] bg-[var(--secondary)]/20 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "replay", label: "Reading Replay", icon: "🎬", count: timelineEvents.length },
            { id: "highlights", label: "Highlights", icon: "🖍️", count: highlights.length },
            { id: "notes", label: "Notes", icon: "📝", count: notes.length },
            { id: "drawings", label: "Drawings", icon: "🎨", count: drawingPages.length },
            { id: "bookmarks", label: "Bookmarks", icon: "🔖", count: bookmarks.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border-b-2 ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--card)] shadow-xs"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--secondary)] text-[10px] text-[var(--accent)] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Printable Report View (Modal Overlay Inside Container) */}
          {showPrintReport && (
            <div className="p-6 bg-[var(--card)] border border-[var(--accent)]/40 rounded-2xl shadow-xl space-y-4 mb-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h4 className="font-serif font-bold text-base text-[var(--foreground)]">
                    Official Reading Study Report
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Generated locally from browser memory for &ldquo;{book.title}&rdquo;
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-md hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print Document</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 bg-[var(--secondary)]/40 rounded-xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)]">Progress</span>
                  <p className="font-bold text-[var(--foreground)]">{progress?.progress || 0}% Complete</p>
                </div>
                <div className="p-3 bg-[var(--secondary)]/40 rounded-xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)]">Current Position</span>
                  <p className="font-bold text-[var(--foreground)]">Page {progress?.page || 1} of {totalPages}</p>
                </div>
                <div className="p-3 bg-[var(--secondary)]/40 rounded-xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)]">Study Markings</span>
                  <p className="font-bold text-[var(--foreground)]">{totalAnnotations} total</p>
                </div>
                <div className="p-3 bg-[var(--secondary)]/40 rounded-xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)]">Active Reading Time</span>
                  <p className="font-bold text-[var(--foreground)]">{totalMinutes} minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- Tab 1: Overview & Density Heatmap ----------------- */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Derived Reading Insights Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)] block">Progress</span>
                  <strong className="text-sm font-bold text-[var(--accent)] font-mono">
                    {progress?.progress || 0}%
                  </strong>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    Page {progress?.page || 1} / {totalPages}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)] block">Active Time</span>
                  <strong className="text-sm font-bold text-[var(--foreground)] font-mono">
                    {totalMinutes} min
                  </strong>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    {memory.sessionsCount || 1} sessions logged
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)] block">Most Annotated</span>
                  <strong className="text-sm font-bold text-amber-400 font-mono">
                    {mostAnnotatedPage ? `Page ${mostAnnotatedPage}` : "None yet"}
                  </strong>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    {maxPageCount > 0 ? `${maxPageCount} study marks` : "No marks"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)] block">Study Density</span>
                  <strong className="text-sm font-bold text-emerald-400 font-mono">
                    {totalAnnotations}
                  </strong>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    highlights &amp; notes
                  </span>
                </div>
              </div>

              {/* Page Interaction Density Heatmap */}
              <div className="glass-card p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>🔥</span>
                    <span>Page Interaction Density Map (Click bar to jump)</span>
                  </h4>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Taller bars denote pages with deep notes &amp; markings
                  </span>
                </div>

                {/* Heatmap visualization bars */}
                <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 pt-2 items-end h-16 bg-[var(--secondary)]/30 p-2 rounded-xl border border-[var(--border)]">
                  {densitySegments.map((seg) => {
                    const heightPercent = seg.count > 0 ? Math.max(25, Math.round((seg.count / maxSegmentScore) * 100)) : 10;
                    return (
                      <button
                        key={seg.segmentIndex}
                        onClick={() => {
                          if (onJumpToPage) {
                            onJumpToPage(seg.startPage);
                            onClose();
                          }
                        }}
                        className="group relative flex flex-col items-center h-full justify-end cursor-pointer w-full"
                        title={`Pages ${seg.startPage}–${seg.endPage}: ${seg.count} interactions. Click to jump.`}
                      >
                        <div
                          className={`w-full rounded-t-sm transition-all ${
                            seg.count > 0
                              ? "bg-gradient-to-t from-[var(--primary)] to-[var(--accent)] group-hover:brightness-125 shadow-xs"
                              : "bg-[var(--border)] opacity-40 group-hover:opacity-80"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-mono">
                  <span>Page 1</span>
                  <span>Page {Math.floor(totalPages / 2)}</span>
                  <span>Page {totalPages}</span>
                </div>
              </div>

              {/* Jump to continue reading CTA */}
              <div className="flex justify-between items-center bg-[var(--secondary)]/40 p-4 rounded-2xl border border-[var(--border)]">
                <div>
                  <h5 className="text-xs font-bold text-[var(--foreground)]">
                    Ready to resume your study?
                  </h5>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Pick up right from Page {progress?.page || 1}.
                  </p>
                </div>
                {onJumpToPage ? (
                  <button
                    onClick={() => {
                      onJumpToPage(progress?.page || 1);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold hover:scale-105 transition-transform cursor-pointer"
                  >
                    Resume Reading →
                  </button>
                ) : (
                  <Link
                    href={`/book/${book.id}`}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold hover:scale-105 transition-transform"
                  >
                    Resume Reading →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ----------------- Tab 2: Reading Replay (Phase 5 Signature Feature) ----------------- */}
          {activeTab === "replay" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
                  <span>🎬</span>
                  <span>Reading Replay Journey</span>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Reconstructed from authentic browser reading sessions
                </span>
              </div>

              {timelineEvents.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-3xl block">⏱️</span>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">
                    Insufficient History for Replay
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mx-auto">
                    Spend active reading time inside the reader to automatically map your authentic reading journey.
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-[var(--accent)]/40 pl-6 ml-3 space-y-6">
                  {timelineEvents.map((ev, idx) => {
                    const pagesSpan = Math.abs((ev.endPage || 1) - (ev.startPage || 1)) + 1;
                    const mins = Math.max(1, Math.round((ev.durationSeconds || 60) / 60));
                    return (
                      <div key={ev.id || idx} className="relative space-y-2 group">
                        {/* Timeline Node Badge */}
                        <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-[var(--card)] border-2 border-[var(--accent)] flex items-center justify-center text-[8px] font-bold text-[var(--accent)] shadow-xs">
                          {timelineEvents.length - idx}
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm text-[var(--foreground)]">
                              Pages {ev.startPage || 1} → {ev.endPage || 1}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-mono font-semibold text-[10px]">
                              {pagesSpan} page{pagesSpan === 1 ? "" : "s"}
                            </span>
                          </div>

                          <span className="text-[11px] text-[var(--text-secondary)]">
                            {new Date(ev.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} • {mins}m reading
                          </span>
                        </div>

                        {/* Session Metrics Bar */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)] bg-[var(--secondary)]/40 p-3 rounded-xl border border-[var(--border)]">
                          {ev.highlightsAdded > 0 && (
                            <span className="flex items-center gap-1 font-semibold text-amber-400">
                              <span>🖍️</span>
                              <span>{ev.highlightsAdded} highlights</span>
                            </span>
                          )}
                          {ev.notesAdded > 0 && (
                            <span className="flex items-center gap-1 font-semibold text-sky-400">
                              <span>📝</span>
                              <span>{ev.notesAdded} notes</span>
                            </span>
                          )}
                          {ev.bookmarksAdded > 0 && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-400">
                              <span>🔖</span>
                              <span>{ev.bookmarksAdded} bookmarks</span>
                            </span>
                          )}
                          {ev.highlightsAdded === 0 && ev.notesAdded === 0 && (
                            <span className="text-[var(--text-secondary)] italic">
                              Continuous deep immersion reading
                            </span>
                          )}

                          <div className="ml-auto">
                            {onJumpToPage ? (
                              <button
                                onClick={() => {
                                  onJumpToPage(ev.endPage || 1);
                                  onClose();
                                }}
                                className="px-3 py-1 rounded-lg bg-[var(--accent)]/15 hover:bg-[var(--primary)] text-[var(--accent)] hover:text-[var(--primary-foreground)] font-bold text-[10px] transition-all cursor-pointer"
                              >
                                Jump to Page {ev.endPage || 1} →
                              </button>
                            ) : (
                              <Link
                                href={`/book/${book.id}`}
                                className="px-3 py-1 rounded-lg bg-[var(--accent)]/15 hover:bg-[var(--primary)] text-[var(--accent)] hover:text-[var(--primary-foreground)] font-bold text-[10px] transition-all"
                              >
                                Open Book →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ----------------- Tab 3: Highlights Archive ----------------- */}
          {activeTab === "highlights" && (
            <div className="space-y-4">
              {/* Color Filter Pills */}
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)] text-xs overflow-x-auto">
                <span className="text-[var(--text-secondary)] font-medium">Filter Color:</span>
                {["all", "amber", "mint", "cyan", "purple"].map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedHighlightColor(col)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer text-[11px] ${
                      selectedHighlightColor === col
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                        : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>

              {filteredHighlights.length === 0 ? (
                <p className="text-center py-10 text-xs text-[var(--text-secondary)]">
                  No highlights match the selected criteria.
                </p>
              ) : (
                filteredHighlights.map((hl) => (
                  <div
                    key={hl.id}
                    className="p-3.5 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] space-y-2"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[var(--accent)] flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          hl.color === "mint" ? "bg-emerald-400" :
                          hl.color === "cyan" ? "bg-cyan-400" :
                          hl.color === "purple" ? "bg-purple-400" : "bg-amber-400"
                        }`} />
                        <span>Page {hl.page}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(hl.text);
                          }}
                          className="text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
                          title="Copy Quote"
                        >
                          📋 Copy
                        </button>
                        {onJumpToPage && (
                          <button
                            onClick={() => {
                              onJumpToPage(hl.page);
                              onClose();
                            }}
                            className="text-[var(--accent)] hover:underline font-bold cursor-pointer"
                          >
                            Jump →
                          </button>
                        )}
                      </div>
                    </div>
                    <blockquote className="text-xs text-[var(--foreground)] font-serif italic border-l-2 border-[var(--accent)] pl-2.5 leading-relaxed">
                      &ldquo;{hl.text}&rdquo;
                    </blockquote>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ----------------- Tab 4: Notes Archive ----------------- */}
          {activeTab === "notes" && (
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-center py-10 text-xs text-[var(--text-secondary)]">
                  No personal notes attached to this book.
                </p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] space-y-2"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[var(--accent)]">Page {n.page}</span>
                      {onJumpToPage && (
                        <button
                          onClick={() => {
                            onJumpToPage(n.page);
                            onClose();
                          }}
                          className="text-[var(--text-secondary)] hover:text-[var(--foreground)] font-bold cursor-pointer"
                        >
                          Jump to Page →
                        </button>
                      )}
                    </div>
                    {n.selectedText && (
                      <p className="text-[11px] text-[var(--text-secondary)] italic border-l border-[var(--border)] pl-2.5">
                        &ldquo;{n.selectedText}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                      {n.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ----------------- Tab 5: Drawings & Diagrams Index ----------------- */}
          {activeTab === "drawings" && (
            <div className="space-y-3">
              {drawingPages.length === 0 ? (
                <p className="text-center py-10 text-xs text-[var(--text-secondary)]">
                  No hand-drawn markings or shapes made on this book yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {drawingPages.map((page) => (
                    <div
                      key={page}
                      className="p-4 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎨</span>
                        <div>
                          <h5 className="font-serif font-bold text-xs text-[var(--foreground)]">
                            Page {page}
                          </h5>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            {drawings[page]?.length || 0} strokes &amp; diagram shapes
                          </p>
                        </div>
                      </div>
                      {onJumpToPage && (
                        <button
                          onClick={() => {
                            onJumpToPage(page);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer hover:scale-105 transition-transform"
                        >
                          Jump →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----------------- Tab 6: Bookmarks ----------------- */}
          {activeTab === "bookmarks" && (
            <div className="space-y-3">
              {bookmarks.length === 0 ? (
                <p className="text-center py-10 text-xs text-[var(--text-secondary)]">
                  No bookmarked pages yet.
                </p>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-3.5 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🔖</span>
                      <div>
                        <h5 className="text-xs font-bold text-[var(--foreground)]">
                          Page {bm.page}
                        </h5>
                        <p className="text-[10px] text-[var(--text-secondary)]">
                          {bm.label || `Saved bookmark`}
                        </p>
                      </div>
                    </div>
                    {onJumpToPage && (
                      <button
                        onClick={() => {
                          onJumpToPage(bm.page);
                          onClose();
                        }}
                        className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer"
                      >
                        Jump →
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
