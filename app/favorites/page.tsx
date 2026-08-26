"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useLibrary } from "@/context/LibraryContext";
import dynamic from "next/dynamic";
import { Book, BOOKS } from "@/data/books";
import BookCard from "@/components/BookCard";
import { getLocalDateKey, getPreviousDateKey, DAILY_READING_GOAL_SECONDS } from "@/lib/reader-storage";
import AuthGuard from "@/components/auth/AuthGuard";

const BookReadingMemory = dynamic(() => import("@/components/memory/BookReadingMemory"), {
  ssr: false,
});

type ShelfTab = "favorites" | "reading" | "completed" | "offline" | "memory" | "stats";

export default function FavoritesPage() {
  const {
    favoriteBooks,
    readingHistory,
    stats,
    streakData,
    getReadingMemory,
    exportData,
    importData,
    showToast,
    removeBookOffline,
    clearAllProgress,
    clearAnnotations,
    clearStreak,
    clearOfflineStorage,
    factoryReset,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<ShelfTab>("favorites");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedMemoryBook, setSelectedMemoryBook] = useState<Book | null>(null);
  const [customGoalMinutes, setCustomGoalMinutes] = useState<number>(15);
  const [offlineBooksList, setOfflineBooksList] = useState<Book[]>([]);
  const [offlineStorageSizeMb, setOfflineStorageSizeMb] = useState<number>(0);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void | Promise<void>;
    buttonText: string;
    dangerLevel: "warning" | "danger";
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when confirmation modal is open
  useEffect(() => {
    if (!confirmModal?.isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmModal?.isOpen]);

  // Scan offline Cache API for saved books
  const refreshOfflineBooks = async () => {
    if (typeof window === "undefined" || !("caches" in window)) return;
    try {
      const cache = await caches.open("readershub-offline-books-v1");
      const requests = await cache.keys();
      const cachedUrls = requests.map((r) => r.url);

      const found: Book[] = [];
      let totalBytes = 0;

      for (const book of BOOKS) {
        if (book.pdf) {
          const isCached = cachedUrls.some((u) => u.includes(encodeURI(book.pdf)) || u.endsWith(book.pdf));
          if (isCached) {
            found.push(book);
            // Estimate size from physical average (approx 1.5MB per PDF or actual match)
            totalBytes += 1.5 * 1024 * 1024;
          }
        }
      }

      setOfflineBooksList(found);
      setOfflineStorageSizeMb(Number((totalBytes / (1024 * 1024)).toFixed(1)));
    } catch {
      // Ignore cache query errors
    }
  };

  useEffect(() => {
    refreshOfflineBooks();
    try {
      const savedGoal = localStorage.getItem("readershub_custom_goal_minutes");
      if (savedGoal) setCustomGoalMinutes(Number(savedGoal));
    } catch {
      // Ignore
    }
  }, []);

  const handleUpdateGoal = (mins: number) => {
    setCustomGoalMinutes(mins);
    try {
      localStorage.setItem("readershub_custom_goal_minutes", String(mins));
      showToast(`Daily reading goal set to ${mins} minutes! 🎯`);
    } catch {
      // Ignore
    }
  };

  // 1. Derive In-Progress vs Completed Books from Reading History
  const currentlyReadingBooks = useMemo(() => {
    return readingHistory
      .filter((item) => item.progress < 98)
      .map((item) => {
        const book = BOOKS.find((b) => b.id === item.bookId);
        if (!book) return null;
        return {
          ...book,
          currentPage: item.page,
          totalPages: item.totalPages || book.pages,
          progress: item.progress,
          lastReadAt: item.lastReadAt,
        };
      })
      .filter(Boolean) as (Book & { currentPage: number; totalPages: number | string; progress: number; lastReadAt: number })[];
  }, [readingHistory]);

  // Spotlight most recent reading book
  const spotlightBook = useMemo(() => {
    if (currentlyReadingBooks.length === 0) return null;
    return [...currentlyReadingBooks].sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))[0];
  }, [currentlyReadingBooks]);

  const spotlightMemory = useMemo(() => {
    if (!spotlightBook) return null;
    return getReadingMemory(spotlightBook.id);
  }, [spotlightBook, getReadingMemory]);

  const completedBooks = useMemo(() => {
    return readingHistory
      .filter((item) => item.progress >= 98 || (item.totalPages && item.page >= item.totalPages))
      .map((item) => {
        const book = BOOKS.find((b) => b.id === item.bookId);
        if (!book) return null;
        return {
          ...book,
          currentPage: item.page,
          totalPages: item.totalPages || book.pages,
          progress: 100,
          lastReadAt: item.lastReadAt || 0,
        };
      })
      .filter((b): b is Book & { currentPage: number; totalPages: number | string; progress: number; lastReadAt: number } => b !== null);
  }, [readingHistory]);

  // 2. Derive Books with Reading Memory
  const memoryBooks = useMemo(() => {
    return readingHistory
      .map((item) => {
        const book = BOOKS.find((b) => b.id === item.bookId);
        if (!book) return null;
        const memory = getReadingMemory(book.id);
        return {
          ...book,
          memory,
          currentPage: item.page,
          totalPages: item.totalPages || book.pages,
          progress: item.progress,
        };
      })
      .filter((b): b is Book & { memory: any; currentPage: number; totalPages: number | string; progress: number } => b !== null);
  }, [readingHistory, getReadingMemory]);

  // 3. Derive Categories from saved favorites
  const savedCategories = useMemo(() => {
    const cats = Array.from(new Set(favoriteBooks.map((b) => b.category)));
    return ["All", ...cats];
  }, [favoriteBooks]);

  const filteredFavorites = useMemo(() => {
    if (selectedCategory === "All") return favoriteBooks;
    return favoriteBooks.filter((b) => b.category === selectedCategory);
  }, [favoriteBooks, selectedCategory]);

  // 4. Generate 12-Week Reading Activity Heatmap Grid
  const heatmapWeeks = useMemo(() => {
    const totalDays = 84; // 12 weeks * 7 days
    const todayKey = getLocalDateKey();
    const days: { dateKey: string; seconds: number; minutes: number; qualified: boolean }[] = [];

    let curKey = todayKey;
    for (let i = 0; i < totalDays; i++) {
      const act = streakData.daily[curKey];
      const secs = act?.seconds || 0;
      days.unshift({
        dateKey: curKey,
        seconds: secs,
        minutes: Math.floor(secs / 60),
        qualified: Boolean(act?.qualified || secs >= DAILY_READING_GOAL_SECONDS),
      });
      curKey = getPreviousDateKey(curKey);
    }

    // Chunk into 12 columns of 7 days
    const weeks: (typeof days)[] = [];
    for (let w = 0; w < 12; w++) {
      weeks.push(days.slice(w * 7, (w + 1) * 7));
    }
    return weeks;
  }, [streakData]);

  // 5. Export Data Handler
  const handleExport = () => {
    try {
      const jsonString = exportData();
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `readershub_reading_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Reading data exported successfully! 📥");
    } catch {
      showToast("Failed to export data");
    }
  };

  // 6. Import Data Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importData(content);
        setImportStatus(res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <AuthGuard
      pageTitle="My Shelf & Favorites"
      pageDescription="Please sign in with your Google account to access your personal reading shelf, saved favorites, and cloud bookmarks."
    >
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16 text-left min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="w-full mb-6 sm:mb-8 space-y-1 sm:space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-[var(--accent)] uppercase tracking-wider sm:tracking-widest">
          <span>📚</span>
          <span>Personal Shelf &amp; Study Dashboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
          My Library
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-normal max-w-2xl">
          Your private reading workspace, saved 100% locally with zero logins or server tracking.
        </p>
      </div>

      {/* Smart Continue Reading Hero Card */}
      {spotlightBook && (
        <div className="w-full mb-6 sm:mb-8 p-4 sm:p-7 rounded-2xl sm:rounded-3xl glass-card border border-[var(--accent)]/30 bg-gradient-to-r from-[var(--card)] via-[var(--card)] to-[var(--accent)]/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 animate-fade-in min-w-0">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0 w-full sm:w-auto">
            <div className="relative w-14 h-20 sm:w-20 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
              <Image src={spotlightBook.cover} alt={spotlightBook.title} fill className="object-cover" sizes="(max-width: 640px) 56px, 80px" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider block mb-0.5 sm:mb-1">
                ⚡ Continue Where You Left Off
              </span>
              <h3 className="font-serif font-bold text-sm sm:text-lg text-[var(--foreground)] truncate">
                {spotlightBook.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate">
                by {spotlightBook.author} • {spotlightBook.category}
              </p>

              <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5 max-w-sm">
                <div className="flex justify-between text-[10px] sm:text-[11px] font-medium text-[var(--text-secondary)]">
                  <span>Page {spotlightBook.currentPage} of {spotlightBook.totalPages}</span>
                  <span className="text-[var(--accent)] font-bold">{spotlightBook.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
                    style={{ width: `${spotlightBook.progress}%` }}
                  />
                </div>
                {spotlightMemory && (
                  <p className="text-[10px] text-[var(--text-secondary)] italic">
                    {Math.floor((spotlightMemory.totalSeconds || 0) / 60)}m active reading logged
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0 pt-1 sm:pt-0">
            <Link
              href={`/book/${spotlightBook.id}`}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-xl hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Resume Reading Page {spotlightBook.currentPage}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Properly Constrained Scrollable Container) */}
      <div className="w-full max-w-full min-w-0 overflow-x-auto scrollbar-none border-b border-[var(--border)] pb-2.5 sm:pb-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "favorites"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
            }`}
          >
            <span>❤️ Favorites</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {favoriteBooks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reading")}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "reading"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
            }`}
          >
            <span>📖 In Progress</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {currentlyReadingBooks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "completed"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
            }`}
          >
            <span>✅ Completed</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {completedBooks.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("offline");
              refreshOfflineBooks();
            }}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "offline"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
            }`}
          >
            <span>📦 Offline Books</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {offlineBooksList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("memory")}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "memory"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
            }`}
          >
            <span>🧠 Reading Memory</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {memoryBooks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "stats"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
            }`}
          >
            <span>📊 Stats &amp; Goals</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * Tab 1: Favorites
       * ------------------------------------------------------------- */}
      {activeTab === "favorites" && (
        <div className="w-full min-w-0">
          {favoriteBooks.length === 0 ? (
            <div className="w-full max-w-2xl mx-auto text-center py-12 sm:py-20 px-4 sm:px-6 glass-card rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-2xl sm:text-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-rose-400 shadow-inner">
                ♥
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                Your shelf is waiting.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed font-normal">
                Click the heart icon on any book across the catalog to build your private reading collection.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Explore Library</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="w-full space-y-4 sm:space-y-6 min-w-0">
              {savedCategories.length > 2 && (
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-2">
                  <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-medium mr-1">Filter Shelf:</span>
                  {savedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-md"
                          : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 w-full min-w-0">
                {filteredFavorites.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
       * Tab 2: In Progress
       * ------------------------------------------------------------- */}
      {activeTab === "reading" && (
        <div className="w-full space-y-4 sm:space-y-6 min-w-0">
          {currentlyReadingBooks.length === 0 ? (
            <div className="w-full max-w-2xl mx-auto text-center py-12 sm:py-20 px-4 sm:px-6 glass-card rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-2xl sm:text-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-[var(--accent)] shadow-inner">
                📖
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                No Books Currently In Progress
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed font-normal">
                Open any book in the reader to start tracking your reading journey automatically.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Explore Library</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 w-full min-w-0">
              {currentlyReadingBooks.map((book) => (
                <div
                  key={book.id}
                  className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[var(--border)] bg-[var(--card)] shadow-xl flex flex-col justify-between space-y-3 sm:space-y-4"
                >
                  <div className="flex gap-3.5 sm:gap-4">
                    <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
                      <Image src={book.cover} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 56px, 64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--accent)] font-semibold border border-[var(--border)] truncate inline-block max-w-full">
                        {book.category}
                      </span>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[var(--foreground)] truncate mt-1">
                        {book.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate">
                        by {book.author}
                      </p>
                      <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-medium">
                        Page {book.currentPage} of {book.totalPages} ({book.progress}%)
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>

                  <Link
                    href={`/book/${book.id}`}
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold text-center block shadow-md hover:scale-102 transition-transform"
                  >
                    Resume Reading →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
       * Tab 3: Completed Books
       * ------------------------------------------------------------- */}
      {activeTab === "completed" && (
        <div className="w-full space-y-4 sm:space-y-6 min-w-0">
          {completedBooks.length === 0 ? (
            <div className="w-full max-w-2xl mx-auto text-center py-12 sm:py-20 px-4 sm:px-6 glass-card rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-2xl sm:text-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-emerald-400 shadow-inner">
                🏆
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                No Completed Books Yet
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed font-normal">
                Finish reading books in the reader to earn your completion badge and archive your study memories.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Explore Library</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 w-full min-w-0">
              {completedBooks.map((book) => (
                <div
                  key={book.id}
                  className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-500/30 bg-[var(--card)] shadow-xl flex flex-col justify-between space-y-3 sm:space-y-4"
                >
                  <div className="flex gap-3.5 sm:gap-4">
                    <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
                      <Image src={book.cover} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 56px, 64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        Finished ✓
                      </span>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[var(--foreground)] truncate mt-1">
                        {book.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate">
                        by {book.author}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] mt-1">
                        {book.totalPages} pages read
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/book/${book.id}`}
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-bold text-center block border border-[var(--border)]"
                  >
                    Re-read Book →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
       * Tab 4: Offline Books Manager
       * ------------------------------------------------------------- */}
      {activeTab === "offline" && (
        <div className="w-full space-y-4 sm:space-y-6 min-w-0">
          <div className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl min-w-0">
            <div className="flex items-center gap-3.5 sm:gap-4 text-left w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xl sm:text-2xl flex items-center justify-center flex-shrink-0">
                📦
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-bold text-sm sm:text-base text-[var(--foreground)] truncate">
                  Offline Library Storage
                </h3>
                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)]">
                  {offlineBooksList.length} book{offlineBooksList.length === 1 ? "" : "s"} cached locally (~{offlineStorageSizeMb} MB on device).
                </p>
              </div>
            </div>

            <button
              onClick={refreshOfflineBooks}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <span>↻</span>
              <span>Refresh Cache</span>
            </button>
          </div>

          {offlineBooksList.length === 0 ? (
            <div className="w-full max-w-2xl mx-auto text-center py-12 sm:py-20 px-4 sm:px-6 glass-card rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] text-2xl sm:text-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-[var(--text-secondary)] shadow-inner">
                📦
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                No Offline Books Saved
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed font-normal">
                Click the &ldquo;Save Offline (📦)&rdquo; button in any book header or reader to keep full copies available on your device without internet.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Browse Library to Cache Books</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 w-full min-w-0">
              {offlineBooksList.map((book) => (
                <div
                  key={book.id}
                  className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-500/30 bg-[var(--card)] shadow-xl flex flex-col justify-between space-y-3 sm:space-y-4"
                >
                  <div className="flex gap-3.5 sm:gap-4">
                    <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
                      <Image src={book.cover} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 56px, 64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        Available Offline ✓
                      </span>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[var(--foreground)] truncate mt-1">
                        {book.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate">
                        by {book.author}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/book/${book.id}`}
                      className="flex-1 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold text-center block shadow-md hover:scale-102 transition-transform"
                    >
                      Read Now →
                    </Link>
                    <button
                      onClick={async () => {
                        await removeBookOffline(book.id, book.pdf);
                        await refreshOfflineBooks();
                      }}
                      className="px-3 py-2 rounded-xl bg-[var(--secondary)] hover:bg-rose-500/20 hover:text-rose-400 text-[var(--text-secondary)] text-xs border border-[var(--border)] cursor-pointer"
                      title="Remove Offline Copy"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
       * Tab 5: Books with Reading Memory
       * ------------------------------------------------------------- */}
      {activeTab === "memory" && (
        <div className="w-full space-y-4 sm:space-y-6 min-w-0">
          {memoryBooks.length === 0 ? (
            <div className="w-full max-w-2xl mx-auto text-center py-12 sm:py-20 px-4 sm:px-6 glass-card rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-2xl sm:text-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-[var(--accent)] shadow-inner">
                🧠
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                No Reading Memories Recorded
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed font-normal">
                Reading time, highlight quotes, drawing layers, and timeline events will automatically populate here as you read.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Start Reading</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6 w-full min-w-0">
              {memoryBooks.map((book) => (
                <div
                  key={book.id}
                  className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[var(--border)] bg-[var(--card)] shadow-xl flex flex-col justify-between space-y-3 sm:space-y-4"
                >
                  <div className="flex gap-3.5 sm:gap-4">
                    <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
                      <Image src={book.cover} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 56px, 64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[var(--foreground)] truncate">
                        {book.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate">
                        by {book.author}
                      </p>
                      <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[var(--text-secondary)] space-y-0.5">
                        <span className="block font-medium">
                          Page {book.currentPage} / {book.totalPages} ({book.progress}%)
                        </span>
                        <span className="block text-[10px] opacity-80">
                          {Math.floor(book.memory.totalSeconds / 60)} min read • {book.memory.timeline?.length || 0} sessions
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMemoryBook(book)}
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>🧠</span>
                    <span>View Reading Memory 2.0 →</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
       * Tab 6: Reading Stats, Goals & Local Data Backup
       * ------------------------------------------------------------- */}
      {activeTab === "stats" && (
        <div className="w-full space-y-6 sm:space-y-8 min-w-0">
          {/* Daily Reading Streak & Habit Banner */}
          <div className="w-full glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[var(--border)] bg-gradient-to-r from-[var(--card)] via-[var(--card)] to-amber-500/5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 min-w-0">
            <div className="flex items-center gap-3.5 sm:gap-4 text-left w-full sm:w-auto">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border flex-shrink-0 ${
                stats.isTodayQualified
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  : "bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)]"
              }`}>
                🪔
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--foreground)]">
                    {stats.readingStreakDays} Day Reading Streak
                  </h3>
                  {stats.isTodayQualified && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      Diya Lit Today ✨
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5 sm:mt-1 leading-relaxed">
                  {stats.isTodayQualified
                    ? `15-minute goal completed today (${Math.floor(stats.todayReadingSeconds / 60)} min read). Keep it up!`
                    : stats.todayReadingSeconds > 0
                    ? `${Math.floor(stats.todayReadingSeconds / 60)} / 15 min active reading completed today.`
                    : "Read for 15 minutes today to ignite your Diwali Diya and advance your streak."}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 bg-[var(--secondary)]/50 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-[var(--border)] flex-shrink-0">
              <span className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-medium">Today&apos;s Reading</span>
              <span className={`text-xs sm:text-sm font-bold font-mono ${stats.isTodayQualified ? "text-amber-400" : "text-[var(--foreground)]"}`}>
                {Math.floor(stats.todayReadingSeconds / 60)} / 15 min
              </span>
            </div>
          </div>

          {/* Personal Reading Goals Selector Widget */}
          <div className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] space-y-3.5 sm:space-y-4 shadow-xl min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-[var(--foreground)] flex items-center gap-1.5 sm:gap-2">
                  <span>🎯</span>
                  <span>Personal Daily Reading Target</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)]">
                  Streak qualifies at 15 minutes. Set your own higher personal commitment if desired.
                </p>
              </div>
              <div className="grid grid-cols-4 sm:flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleUpdateGoal(mins)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      customGoalMinutes === mins
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                        : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Progress Ring Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] sm:text-xs font-medium text-[var(--text-secondary)]">
                <span>Today&apos;s Progress towards {customGoalMinutes}m goal</span>
                <span className="font-bold text-[var(--accent)]">
                  {Math.min(100, Math.round((stats.todayReadingSeconds / (customGoalMinutes * 60)) * 100))}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
                  style={{
                    width: `${Math.min(100, (stats.todayReadingSeconds / (customGoalMinutes * 60)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Real Local Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
            <div
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl flex items-center justify-between gap-4"
              title="Time you actively spent exploring, searching, and studying on Reader's HUB."
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  <span>⚡</span>
                  <span>Website Active Time</span>
                </div>
                <h4 className="text-xl sm:text-3xl font-bold font-serif text-emerald-400 font-mono">
                  {Math.floor((stats.totalActiveSeconds || 0) / 60) >= 60
                    ? `${Math.floor((stats.totalActiveSeconds || 0) / 3600)}h ${Math.floor(((stats.totalActiveSeconds || 0) % 3600) / 60)}m`
                    : `${Math.floor((stats.totalActiveSeconds || 0) / 60)}m`}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)]">
                  Meaningful time spent using Reader&apos;s HUB
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                ⚡
              </div>
            </div>

            <div
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl flex items-center justify-between gap-4"
              title="Actual active book-reading time used by your Diya and reading streak."
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  <span>📖</span>
                  <span>Genuine Reading Time</span>
                </div>
                <h4 className="text-xl sm:text-3xl font-bold font-serif text-[var(--accent)] font-mono">
                  {Math.floor((stats.totalReadingSeconds || 0) / 60) >= 60
                    ? `${Math.floor((stats.totalReadingSeconds || 0) / 3600)}h ${Math.floor(((stats.totalReadingSeconds || 0) % 3600) / 60)}m`
                    : `${Math.floor((stats.totalReadingSeconds || 0) / 60)}m`}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)]">
                  Actual active time spent reading books
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                🪔
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-1">
              <span className="text-xl sm:text-2xl">📖</span>
              <h4 className="text-xl sm:text-2xl font-bold font-serif text-[var(--foreground)]">
                {stats.booksStarted}
              </h4>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium">Books Explored</p>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-1">
              <span className="text-xl sm:text-2xl">🏆</span>
              <h4 className="text-xl sm:text-2xl font-bold font-serif text-emerald-400">
                {stats.booksCompleted}
              </h4>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium">Books Finished</p>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-1">
              <span className="text-xl sm:text-2xl">📑</span>
              <h4 className="text-xl sm:text-2xl font-bold font-serif text-[var(--accent)]">
                {stats.pagesRead}
              </h4>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium">Pages Read</p>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-1">
              <span className="text-xl sm:text-2xl">✏️</span>
              <h4 className="text-xl sm:text-2xl font-bold font-serif text-amber-400">
                {stats.totalHighlights + stats.totalNotes + stats.totalDrawings}
              </h4>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium">Study Markings</p>
            </div>
          </div>

          {/* Annual 12-Week Reading Activity Contribution Heatmap */}
          <div className="w-full glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[var(--border)] bg-[var(--card)] shadow-xl space-y-3.5 sm:space-y-4 min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-[var(--foreground)] flex items-center gap-1.5">
                  <span>📅</span>
                  <span>12-Week Active Reading Activity Heatmap</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5">
                  Derived from your genuine browser-local reading sessions.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-medium">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-[var(--secondary)] border border-[var(--border)] inline-block" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[var(--accent)]/40 inline-block" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[var(--accent)] inline-block" />
                <span>More</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="w-full max-w-full min-w-0 overflow-x-auto pb-2 scrollbar-none">
              <div className="inline-flex gap-1.5 min-w-max">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((d) => (
                      <div
                        key={d.dateKey}
                        className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 cursor-pointer ${
                          d.qualified
                            ? "bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]"
                            : d.minutes > 0
                            ? "bg-[var(--accent)]/40"
                            : "bg-[var(--secondary)] border border-[var(--border)]/60 opacity-60"
                        }`}
                        title={`${d.dateKey}: ${d.minutes} min active reading ${d.qualified ? " (15m+ Qualified 🪔)" : ""}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Backup & Data Sovereignty Center */}
          <div className="w-full glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-[var(--border)] bg-[var(--card)] shadow-2xl space-y-4 sm:space-y-6 min-w-0">
            <div className="border-b border-[var(--border)] pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">🔒</span>
                <h3 className="font-serif font-bold text-sm sm:text-base text-[var(--foreground)]">
                  Data Sovereignty &amp; Local Backup (v1.2.0)
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
                Reader&apos;s HUB is intentionally 100% offline-capable and client-side. Your reading progress,
                favorites, bookmarks, study drawings, reading memories, and streak history belong entirely to you.
                Export a backup anytime as a portable JSON file or restore on any other browser.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <button
                onClick={handleExport}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📥</span>
                <span>Export My Reading Data (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold text-xs border border-[var(--border)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📤</span>
                <span>Restore from Backup (JSON)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {importStatus && (
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-xs text-[var(--accent)] font-semibold">
                {importStatus}
              </div>
            )}
          </div>

          {/* Granular Reset & Recovery Zone */}
          <div className="w-full glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-rose-500/25 bg-[var(--card)] shadow-xl space-y-4 sm:space-y-5 text-left min-w-0">
            <div className="border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">⚠️</span>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-[var(--foreground)]">
                  Data Reset &amp; Granular Recovery
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5">
                Manage specific subsets of locally cached reading data without affecting the rest of your library.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: "Clear Reading History?",
                    description: "This will reset all reading progress percentages and current page positions. Your favorites and bookmarks will remain intact.",
                    action: () => clearAllProgress(),
                    buttonText: "Clear Reading Progress",
                    dangerLevel: "warning",
                  })
                }
                className="p-3.5 rounded-2xl bg-[var(--secondary)]/60 hover:bg-rose-500/15 hover:border-rose-500/30 text-[var(--foreground)] border border-[var(--border)] text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>📖</span>
                  <span>Clear Reading Progress</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Resets active page positions and progress bars.
                </p>
              </button>

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: "Clear All Annotations?",
                    description: "This will remove all text highlights, notes, vector pen drawings, and bookmarks across all books.",
                    action: () => clearAnnotations(),
                    buttonText: "Clear Annotations",
                    dangerLevel: "warning",
                  })
                }
                className="p-3.5 rounded-2xl bg-[var(--secondary)]/60 hover:bg-rose-500/15 hover:border-rose-500/30 text-[var(--foreground)] border border-[var(--border)] text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>🖍️</span>
                  <span>Clear Annotations &amp; Notes</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Deletes all highlights, handwritten sketches, and notes.
                </p>
              </button>

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: "Reset Reading Streak?",
                    description: "This will reset your daily active reading streak and extinguish today's Diwali Diya.",
                    action: () => clearStreak(),
                    buttonText: "Reset Streak",
                    dangerLevel: "warning",
                  })
                }
                className="p-3.5 rounded-2xl bg-[var(--secondary)]/60 hover:bg-rose-500/15 hover:border-rose-500/30 text-[var(--foreground)] border border-[var(--border)] text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>🪔</span>
                  <span>Reset Reading Streak</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Clears the 15-minute daily activity ledger.
                </p>
              </button>

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: "Clear Offline Book Cache?",
                    description: "This will delete all offline PDF files downloaded onto this device. You will need internet access to read them again.",
                    action: async () => {
                      await clearOfflineStorage();
                      await refreshOfflineBooks();
                    },
                    buttonText: "Clear Offline Cache",
                    dangerLevel: "warning",
                  })
                }
                className="p-3.5 rounded-2xl bg-[var(--secondary)]/60 hover:bg-rose-500/15 hover:border-rose-500/30 text-[var(--foreground)] border border-[var(--border)] text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>📦</span>
                  <span>Purge Offline Storage Cache</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Frees up cached device storage space.
                </p>
              </button>

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: "Factory Reset All Local Data?",
                    description: "CRITICAL: This permanently removes all favorites, reading history, highlights, notes, sketches, bookmarks, streak logs, and offline downloads.",
                    action: async () => {
                      await factoryReset();
                      await refreshOfflineBooks();
                    },
                    buttonText: "Reset Everything to Defaults",
                    dangerLevel: "danger",
                  })
                }
                className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-left transition-all cursor-pointer space-y-1 sm:col-span-2 lg:col-span-2"
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>💥</span>
                  <span>Factory Reset (Clear Everything)</span>
                </div>
                <p className="text-[10px] text-rose-300/80">
                  Full wipe of all local Reader&apos;s HUB data back to default clean slate.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Mounted via React Portal) */}
      {confirmModal && confirmModal.isOpen && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
            <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[var(--border)] bg-[var(--card)] max-w-md w-full shadow-2xl space-y-3.5 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                  confirmModal.dangerLevel === "danger"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  ⚠️
                </div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-[var(--foreground)]">
                  {confirmModal.title}
                </h4>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal">
                {confirmModal.description}
              </p>

              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await confirmModal.action();
                    setConfirmModal(null);
                  }}
                  className={`px-4 sm:px-5 py-2 rounded-xl font-bold transition-transform hover:scale-105 cursor-pointer shadow-md ${
                    confirmModal.dangerLevel === "danger"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-black"
                  }`}
                >
                  {confirmModal.buttonText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Selected Book Reading Memory Modal */}
      {selectedMemoryBook && (
        <BookReadingMemory
          book={selectedMemoryBook}
          isOpen={!!selectedMemoryBook}
          onClose={() => setSelectedMemoryBook(null)}
        />
      )}
      </main>
    </AuthGuard>
  );
}
