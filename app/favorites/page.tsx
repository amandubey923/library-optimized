"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLibrary } from "@/context/LibraryContext";
import dynamic from "next/dynamic";
import { Book, BOOKS } from "@/data/books";
import BookCard from "@/components/BookCard";
import { getLocalDateKey, getPreviousDateKey, DAILY_READING_GOAL_SECONDS } from "@/lib/reader-storage";

const BookReadingMemory = dynamic(() => import("@/components/memory/BookReadingMemory"), {
  ssr: false,
});

type ShelfTab = "favorites" | "reading" | "completed" | "memory" | "stats";

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
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<ShelfTab>("favorites");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedMemoryBook, setSelectedMemoryBook] = useState<Book | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      .filter(Boolean);
  }, [readingHistory]);

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
          lastReadAt: item.lastReadAt,
        };
      })
      .filter(Boolean);
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
      .filter(Boolean);
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-1.5">
          <span>📚</span>
          <span>Personal Shelf &amp; Study Dashboard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--foreground)] tracking-tight">
          My Library
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 font-normal">
          Your private reading workspace, saved 100% locally with zero logins or server tracking.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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
          onClick={() => setActiveTab("memory")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "stats"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
              : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
          }`}
        >
          <span>📊 Stats &amp; Backup</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
       * Tab 1: Favorites
       * ------------------------------------------------------------- */}
      {activeTab === "favorites" && (
        <>
          {favoriteBooks.length === 0 ? (
            <div className="text-center py-20 px-6 glass-card rounded-3xl border border-[var(--border)] max-w-2xl mx-auto bg-[var(--card)] shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-3xl flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-inner">
                ♥
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                Your shelf is waiting.
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed font-normal">
                Click the heart icon on any book across the catalog to build your private reading collection.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Explore Library</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {savedCategories.length > 2 && (
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  <span className="text-xs text-[var(--text-secondary)] font-medium mr-2">Filter Shelf:</span>
                  {savedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredFavorites.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
       * Tab 2: Currently Reading
       * ------------------------------------------------------------- */}
      {activeTab === "reading" && (
        <>
          {currentlyReadingBooks.length === 0 ? (
            <div className="text-center py-20 px-6 glass-card rounded-3xl border border-[var(--border)] max-w-2xl mx-auto bg-[var(--card)] shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-3xl flex items-center justify-center mx-auto mb-4 text-[var(--accent)] shadow-inner">
                📖
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                No Books in Progress
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed font-normal">
                Open any volume in the library to start reading. Your progress will be saved right here.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Browse Catalog</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentlyReadingBooks.map((book: any) => (
                <div
                  key={book.id}
                  className="glass-card rounded-3xl p-5 border border-[var(--border)] bg-[var(--card)] shadow-xl flex gap-4 hover:border-[var(--accent)]/40 transition-all group"
                >
                  <div className="relative w-24 h-34 rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-wider">
                        {book.category}
                      </span>
                      <h3 className="font-serif font-bold text-sm text-[var(--foreground)] truncate mt-0.5">
                        {book.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {book.author}
                      </p>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
                        <span>Page {book.currentPage} of {book.totalPages}</span>
                        <span className="text-[var(--accent)]">{book.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)]"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <Link
                        href={`/book/${book.id}`}
                        className="block w-full py-2 text-center rounded-xl bg-[var(--primary)] hover:opacity-95 text-[var(--primary-foreground)] text-xs font-bold shadow-md transition-all mt-1"
                      >
                        Continue Reading →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
       * Tab 3: Completed Books
       * ------------------------------------------------------------- */}
      {activeTab === "completed" && (
        <>
          {completedBooks.length === 0 ? (
            <div className="text-center py-20 px-6 glass-card rounded-3xl border border-[var(--border)] max-w-2xl mx-auto bg-[var(--card)] shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-3xl flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner">
                🏆
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                No Completed Books Yet
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed font-normal">
                Finish reading your first volume to earn your completion milestone.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Read a Book</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedBooks.map((book: any) => (
                <div
                  key={book.id}
                  className="glass-card rounded-3xl p-5 border border-[var(--border)] bg-[var(--card)] shadow-xl flex gap-4 hover:border-emerald-500/40 transition-all group"
                >
                  <div className="relative w-24 h-34 rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                        Completed ✓
                      </span>
                      <h3 className="font-serif font-bold text-sm text-[var(--foreground)] truncate mt-1.5">
                        {book.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {book.author}
                      </p>
                    </div>

                    <div className="space-y-2 mt-2">
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        Finished 100% ({book.totalPages} pages)
                      </p>
                      <Link
                        href={`/book/${book.id}`}
                        className="block w-full py-2 text-center rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-bold transition-all"
                      >
                        Read Again ↻
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
       * Tab 4: My Reading Memory
       * ------------------------------------------------------------- */}
      {activeTab === "memory" && (
        <div className="space-y-6">
          {memoryBooks.length === 0 ? (
            <div className="text-center py-20 px-6 glass-card rounded-3xl border border-[var(--border)] max-w-2xl mx-auto bg-[var(--card)] shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-3xl flex items-center justify-center mx-auto mb-4 text-[var(--accent)] shadow-inner">
                🧠
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
                Your Reading Memory
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed font-normal">
                As you highlight passages, sketch notes, and read across books, your personal study memory compiles
                automatically right here.
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all"
              >
                <span>Explore Books to Study</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {memoryBooks.map((book: any) => (
                <div
                  key={book.id}
                  className="glass-card rounded-3xl p-5 border border-[var(--border)] bg-[var(--card)] shadow-xl flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all space-y-4"
                >
                  <div className="flex gap-4">
                    <div className="relative w-20 h-28 rounded-xl overflow-hidden book-shadow flex-shrink-0 border border-[var(--border)]">
                      <Image src={book.cover} alt={book.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[var(--accent)]">
                        {book.category}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-[var(--foreground)] truncate mt-0.5">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {book.author}
                      </p>
                      <div className="mt-2 text-[11px] text-[var(--text-secondary)] space-y-0.5">
                        <span className="block font-medium">
                          Page {book.currentPage} / {book.totalPages} ({book.progress}%)
                        </span>
                        <span className="block text-[10px] opacity-80">
                          {Math.floor(book.memory.totalSeconds / 60)} min read • {book.memory.timeline.length} sessions
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMemoryBook(book)}
                    className="w-full py-2.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>🧠</span>
                    <span>View Reading Memory →</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
       * Tab 5: Reading Stats & Local Data Backup
       * ------------------------------------------------------------- */}
      {activeTab === "stats" && (
        <div className="space-y-8">
          {/* Daily Reading Streak & Habit Banner */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[var(--border)] bg-gradient-to-r from-[var(--card)] via-[var(--card)] to-amber-500/5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border flex-shrink-0 ${
                stats.isTodayQualified
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  : "bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)]"
              }`}>
                🪔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-[var(--foreground)]">
                    {stats.readingStreakDays} Day Reading Streak
                  </h3>
                  {stats.isTodayQualified && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      Diya Lit Today ✨
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {stats.isTodayQualified
                    ? `15-minute goal completed today (${Math.floor(stats.todayReadingSeconds / 60)} min read). Keep it up!`
                    : stats.todayReadingSeconds > 0
                    ? `${Math.floor(stats.todayReadingSeconds / 60)} / 15 min active reading completed today.`
                    : "Read for 15 minutes today to ignite your Diwali Diya and advance your streak."}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-3 bg-[var(--secondary)]/50 px-4 py-3 rounded-2xl border border-[var(--border)]">
              <div className="text-center">
                <span className="text-[10px] text-[var(--text-secondary)] block font-medium">Today&apos;s Reading</span>
                <span className={`text-sm font-bold font-mono ${stats.isTodayQualified ? "text-amber-400" : "text-[var(--foreground)]"}`}>
                  {Math.floor(stats.todayReadingSeconds / 60)} / 15 min
                </span>
              </div>
            </div>
          </div>

          {/* Real Local Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-1">
              <span className="text-2xl">📖</span>
              <h4 className="text-2xl font-bold font-serif text-[var(--foreground)]">
                {stats.booksStarted}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Books Explored</p>
            </div>

            <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-1">
              <span className="text-2xl">🏆</span>
              <h4 className="text-2xl font-bold font-serif text-emerald-400">
                {stats.booksCompleted}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Books Finished</p>
            </div>

            <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-1">
              <span className="text-2xl">📑</span>
              <h4 className="text-2xl font-bold font-serif text-[var(--accent)]">
                {stats.pagesRead}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Pages Read</p>
            </div>

            <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-1">
              <span className="text-2xl">✏️</span>
              <h4 className="text-2xl font-bold font-serif text-amber-400">
                {stats.totalHighlights + stats.totalNotes + stats.totalDrawings}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Study Markings</p>
            </div>
          </div>

          {/* Annual 12-Week Reading Activity Contribution Heatmap */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[var(--border)] bg-[var(--card)] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm text-[var(--foreground)] flex items-center gap-1.5">
                  <span>📅</span>
                  <span>12-Week Active Reading Activity Heatmap</span>
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
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
            <div className="overflow-x-auto pb-1">
              <div className="inline-flex gap-1.5">
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
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border)] bg-[var(--card)] shadow-2xl space-y-6">
            <div className="border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <h3 className="font-serif font-bold text-base text-[var(--foreground)]">
                  Data Sovereignty &amp; Local Backup (v1.2.0)
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
                Reader&apos;s HUB is intentionally 100% offline-capable and client-side. Your reading progress,
                favorites, bookmarks, study drawings, reading memories, and streak history belong entirely to you.
                Export a backup anytime as a portable JSON file or restore on any other browser.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button
                onClick={handleExport}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📥</span>
                <span>Export My Reading Data (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold text-xs border border-[var(--border)] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="p-3.5 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-xs text-[var(--accent)] font-semibold">
                {importStatus}
              </div>
            )}
          </div>
        </div>
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
  );
}
