"use client";

import React, { useState } from "react";
import { BookAnnotations, HighlightItem, NoteItem, BookmarkItem } from "@/lib/reader-storage";

interface AnnotationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  annotations: BookAnnotations;
  bookmarks?: BookmarkItem[];
  onJumpToPage: (page: number) => void;
  onDeleteHighlight: (id: string) => void;
  onUpdateNote: (id: string, text: string) => void;
  onDeleteNote: (id: string) => void;
  onClearDrawing: (page: number) => void;
  onDeleteBookmark?: (id: string) => void;
}

type TabType = "all" | "highlights" | "notes" | "drawings" | "bookmarks";

export default function AnnotationDrawer({
  isOpen,
  onClose,
  bookTitle,
  annotations,
  bookmarks = [],
  onJumpToPage,
  onDeleteHighlight,
  onUpdateNote,
  onDeleteNote,
  onClearDrawing,
  onDeleteBookmark,
}: AnnotationDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>("");

  if (!isOpen) return null;

  const highlights = annotations.highlights || [];
  const notes = annotations.notes || [];
  const drawings = annotations.drawings || {};
  const drawingPages = Object.keys(drawings).map(Number).filter((p) => drawings[p]?.length > 0);

  const totalCount = highlights.length + notes.length + drawingPages.length + bookmarks.length;

  const filteredHighlights = highlights.filter(
    (h) => !searchQuery || h.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotes = notes.filter(
    (n) =>
      !searchQuery ||
      n.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.selectedText && n.selectedText.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBookmarks = bookmarks.filter(
    (b) => !searchQuery || (b.label && b.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getColorClass = (color: HighlightItem["color"]) => {
    switch (color) {
      case "mint":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "cyan":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "purple":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  const getToolIcon = (type?: string) => {
    switch (type) {
      case "highlighter":
        return "🖍️";
      case "line":
        return "📏";
      case "arrow":
        return "↗️";
      case "circle":
        return "⭕";
      case "rectangle":
      case "square":
        return "▭";
      case "diamond":
        return "💎";
      case "text":
        return "🔤";
      default:
        return "✏️";
    }
  };

  const handleStartEditNote = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.note);
  };

  const handleSaveEditNote = (id: string) => {
    if (editNoteText.trim()) {
      onUpdateNote(id, editNoteText.trim());
    }
    setEditingNoteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in text-left">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="w-full max-w-md h-full bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left z-50">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📌</span>
              <h3 className="font-serif font-bold text-sm text-[var(--foreground)] truncate">
                Study Annotations &amp; Bookmarks
              </h3>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
              {bookTitle} • {totalCount} saved items
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center text-sm transition-all cursor-pointer"
            title="Close Drawer (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Search & Tabs Filter */}
        <div className="p-4 border-b border-[var(--border)] space-y-3 bg-[var(--secondary)]/30">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search highlights, notes, and topics..."
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
            />
            <span className="absolute left-3 top-2.5 text-xs text-[var(--text-secondary)]">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[10px] sm:text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-1 rounded-lg transition-all capitalize cursor-pointer ${
                activeTab === "all"
                  ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab("highlights")}
              className={`py-1 rounded-lg transition-all capitalize cursor-pointer ${
                activeTab === "highlights"
                  ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Highlights ({highlights.length})
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-1 rounded-lg transition-all capitalize cursor-pointer ${
                activeTab === "notes"
                  ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab("drawings")}
              className={`py-1 rounded-lg transition-all capitalize cursor-pointer ${
                activeTab === "drawings"
                  ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Sketches ({drawingPages.length})
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`py-1 rounded-lg transition-all capitalize cursor-pointer ${
                activeTab === "bookmarks"
                  ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Saved ({bookmarks.length})
            </button>
          </div>
        </div>

        {/* Content List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {totalCount === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)] text-2xl flex items-center justify-center text-[var(--accent)]">
                📚
              </div>
              <h4 className="font-serif font-bold text-xs text-[var(--foreground)]">
                No Annotations or Bookmarks Yet
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] max-w-xs leading-relaxed">
                Highlight text, attach notes, bookmark favorite pages, or use the study toolbar to draw diagrams.
              </p>
            </div>
          ) : (
            <>
              {/* ----------------- Bookmarks Section ----------------- */}
              {(activeTab === "all" || activeTab === "bookmarks") && (
                <>
                  {filteredBookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all shadow-xs flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg text-[var(--accent)]">🔖</span>
                        <div>
                          <h5 className="text-xs font-bold text-[var(--foreground)]">
                            Page {bm.page}
                          </h5>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            {bm.label || `Bookmark on Page ${bm.page}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onJumpToPage(bm.page);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold text-xs cursor-pointer"
                        >
                          Jump →
                        </button>
                        {onDeleteBookmark && (
                          <button
                            onClick={() => onDeleteBookmark(bm.id)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Remove Bookmark"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* ----------------- Highlights Section ----------------- */}
              {(activeTab === "all" || activeTab === "highlights") && (
                <>
                  {filteredHighlights.map((hl) => (
                    <div
                      key={hl.id}
                      className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all shadow-xs space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${getColorClass(
                            hl.color
                          )}`}
                        >
                          Page {hl.page} • Highlight
                        </span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              onJumpToPage(hl.page);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded-md bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold text-[10px] cursor-pointer"
                            title="Jump to this page"
                          >
                            Jump →
                          </button>
                          <button
                            onClick={() => onDeleteHighlight(hl.id)}
                            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Highlight"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <blockquote className="text-xs text-[var(--foreground)] font-serif italic pl-2.5 border-l-2 border-[var(--accent)] leading-relaxed">
                        &ldquo;{hl.text}&rdquo;
                      </blockquote>
                    </div>
                  ))}
                </>
              )}

              {/* ----------------- Notes Section ----------------- */}
              {(activeTab === "all" || activeTab === "notes") && (
                <>
                  {filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all shadow-xs space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-bold uppercase tracking-wider">
                          Page {note.page} • Note
                        </span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              onJumpToPage(note.page);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded-md bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold text-[10px] cursor-pointer"
                            title="Jump to this page"
                          >
                            Jump →
                          </button>
                          <button
                            onClick={() => handleStartEditNote(note)}
                            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
                            title="Edit Note"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Note"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {note.selectedText && (
                        <blockquote className="text-[11px] text-[var(--text-secondary)] italic font-serif pl-2 border-l border-[var(--border)] line-clamp-2">
                          &ldquo;{note.selectedText}&rdquo;
                        </blockquote>
                      )}

                      {editingNoteId === note.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={3}
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            className="w-full bg-[var(--background)] border border-[var(--accent)] rounded-xl p-2.5 text-xs text-[var(--foreground)] focus:outline-none"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5 text-xs">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEditNote(note.id)}
                              className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-bold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--foreground)] font-normal whitespace-pre-wrap leading-relaxed">
                          {note.note}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* ----------------- Drawings & Shapes Section ----------------- */}
              {(activeTab === "all" || activeTab === "drawings") && (
                <>
                  {drawingPages.map((pageNum) => {
                    const pageStrokes = drawings[pageNum] || [];
                    return (
                      <div
                        key={`draw_${pageNum}`}
                        className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🎨</span>
                            <div>
                              <h5 className="text-xs font-bold text-[var(--foreground)]">
                                Page {pageNum} Study Layer
                              </h5>
                              <p className="text-[10px] text-[var(--text-secondary)]">
                                {pageStrokes.length} elements (diagrams, shapes, lines)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                onJumpToPage(pageNum);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold text-xs cursor-pointer"
                            >
                              View →
                            </button>
                            <button
                              onClick={() => onClearDrawing(pageNum)}
                              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Clear All Drawings on this Page"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Stroke previews badges */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {pageStrokes.slice(0, 6).map((s, idx) => (
                            <span
                              key={s.id || idx}
                              className="px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[10px] text-[var(--text-secondary)] flex items-center gap-1 border border-[var(--border)]"
                            >
                              <span>{getToolIcon(s.type)}</span>
                              <span className="capitalize">{s.type || "pen"}</span>
                              {s.text && <span className="italic max-w-[80px] truncate">&ldquo;{s.text}&rdquo;</span>}
                            </span>
                          ))}
                          {pageStrokes.length > 6 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                              +{pageStrokes.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
