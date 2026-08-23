"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Book } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";
import { getBookAnnotations } from "@/lib/reader-storage";

interface BookReadingMemoryProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onJumpToPage?: (page: number) => void;
}

export default function BookReadingMemory({
  book,
  isOpen,
  onClose,
  onJumpToPage,
}: BookReadingMemoryProps) {
  const { getReadingProgress, getReadingMemory } = useLibrary();
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "highlights" | "notes" | "bookmarks">("overview");

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

  // Bucket density for visual heatmap (e.g. 10 segments)
  const segmentsCount = Math.min(20, totalPages);
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
                  My Reading Memory
                </h3>
              </div>
              <h4 className="text-xs font-semibold text-[var(--accent)] truncate mt-0.5">
                {book.title}
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                by {book.author} • {totalMinutes}m total reading time • {totalAnnotations} study marks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center text-xs transition-all cursor-pointer flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Filter Navigation */}
        <div className="flex items-center gap-1.5 px-5 pt-3 border-b border-[var(--border)] bg-[var(--secondary)]/20 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Density", icon: "📊" },
            { id: "timeline", label: "Reading Timeline", icon: "⏱️", count: memory.timeline.length },
            { id: "highlights", label: "Highlights", icon: "🖍️", count: highlights.length },
            { id: "notes", label: "Notes", icon: "📝", count: notes.length },
            { id: "bookmarks", label: "Bookmarks", icon: "🔖", count: bookmarks.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border-b-2 ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--card)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--secondary)] text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
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
                    {memory.sessionsCount || 1} sessions
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
                  <span className="text-[10px] text-[var(--text-secondary)] block">Total Insights</span>
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
                    <span>Page Interaction Density Map</span>
                  </h4>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Darker / taller bars denote pages with notes, highlights, and sketches
                  </span>
                </div>

                {/* Heatmap visualization bars */}
                <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 pt-2 items-end h-16 bg-[var(--secondary)]/30 p-2 rounded-xl border border-[var(--border)]">
                  {densitySegments.map((seg) => {
                    const heightPercent = seg.count > 0 ? Math.max(20, Math.round((seg.count / maxSegmentScore) * 100)) : 8;
                    return (
                      <div
                        key={seg.segmentIndex}
                        className="group relative flex flex-col items-center h-full justify-end"
                        title={`Pages ${seg.startPage}–${seg.endPage}: ${seg.count} interactions`}
                      >
                        <div
                          className={`w-full rounded-t-sm transition-all ${
                            seg.count > 0
                              ? "bg-gradient-to-t from-[var(--primary)] to-[var(--accent)] hover:opacity-100 opacity-90 shadow-xs"
                              : "bg-[var(--border)] opacity-40"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
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

          {/* ----------------- Tab 2: Reading Timeline ----------------- */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              {memory.timeline.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-3xl block">⏱️</span>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">
                    No Timeline Events Recorded Yet
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mx-auto">
                    Read in the reader to automatically log structured timelines of pages covered and notes made.
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-[var(--border)] pl-4 ml-2 space-y-4">
                  {memory.timeline.map((ev, idx) => (
                    <div key={ev.id || idx} className="relative space-y-1 group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--card)]" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--foreground)]">
                          Pages {ev.startPage} → {ev.endPage}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {new Date(ev.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {Math.floor(ev.durationSeconds / 60)}m read
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {ev.highlightsAdded > 0 && `${ev.highlightsAdded} highlights `}
                        {ev.notesAdded > 0 && `${ev.notesAdded} notes `}
                        {ev.bookmarksAdded > 0 && `${ev.bookmarksAdded} bookmarks `}
                        {ev.highlightsAdded === 0 && ev.notesAdded === 0 && "Continuous deep reading"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----------------- Tab 3: Highlights Archive ----------------- */}
          {activeTab === "highlights" && (
            <div className="space-y-3">
              {highlights.length === 0 ? (
                <p className="text-center py-10 text-xs text-[var(--text-secondary)]">
                  No text highlights saved for this book.
                </p>
              ) : (
                highlights.map((hl) => (
                  <div
                    key={hl.id}
                    className="p-3.5 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[var(--accent)]">Page {hl.page}</span>
                      {onJumpToPage && (
                        <button
                          onClick={() => {
                            onJumpToPage(hl.page);
                            onClose();
                          }}
                          className="text-[var(--text-secondary)] hover:text-[var(--foreground)] font-bold cursor-pointer"
                        >
                          Jump →
                        </button>
                      )}
                    </div>
                    <blockquote className="text-xs text-[var(--foreground)] font-serif italic border-l-2 border-[var(--accent)] pl-2.5">
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
                    className="p-3.5 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] space-y-1.5"
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
                          Jump →
                        </button>
                      )}
                    </div>
                    {n.selectedText && (
                      <p className="text-[11px] text-[var(--text-secondary)] italic border-l border-[var(--border)] pl-2">
                        &ldquo;{n.selectedText}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-[var(--foreground)] whitespace-pre-wrap">
                      {n.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ----------------- Tab 5: Bookmarks ----------------- */}
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
