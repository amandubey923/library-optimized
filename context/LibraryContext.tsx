"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Book, BOOKS } from "@/data/books";
import {
  BookmarkItem,
  getBookmarks as getStoredBookmarks,
  saveBookmark as storeBookmark,
  deleteBookmark as deleteStoredBookmark,
  isPageBookmarked as checkIsBookmarked,
  calculateReadingStats,
  exportAllUserData,
  importUserData,
  getReadingActivityData,
  addActiveReadingTime,
  getLocalDateKey,
  DAILY_READING_GOAL_SECONDS,
  ReadingStats,
  ReadingStreakData,
  BookReadingMemory,
  ReadingTimelineEvent,
  getBookReadingMemory,
  recordReadingMemorySession,
  isBookOffline as checkIsBookOffline,
  cacheBookOffline as storeBookOffline,
  removeBookOffline as deleteBookOffline,
  clearReadingHistory as purgeReadingHistory,
  clearAllAnnotations as purgeAllAnnotations,
  clearStreakData as purgeStreakData,
  clearAllOfflineBooks as purgeAllOfflineBooks,
  factoryResetAllData as purgeFactoryResetAll,
} from "@/lib/reader-storage";

export interface ReadingProgressItem {
  bookId: string;
  page: number;
  totalPages: number;
  progress: number; // 0 - 100%
  lastReadAt: number;
}

export interface RecentBook extends Book {
  progress: number;
  lastPage: number;
}

export interface ActiveReadingSession {
  isActive: boolean;
  bookId: string;
  startPage: number;
  targetMinutes: number;
  elapsedSeconds: number;
  startedAt: number;
}

interface LibraryContextType {
  favorites: string[];
  isFavorite: (bookId: string) => boolean;
  toggleFavorite: (bookId: string) => void;
  removeFavorite: (bookId: string) => void;
  favoriteBooks: Book[];
  readingHistory: ReadingProgressItem[];
  recentBooks: RecentBook[];
  recordReading: (bookId: string, page?: number, totalPages?: number) => void;
  updateReadingProgress: (bookId: string, page: number, totalPages?: number) => void;
  getReadingProgress: (bookId: string) => ReadingProgressItem | undefined;
  removeHistoryItem: (bookId: string) => void;
  clearHistory: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Bookmarks & Stats Extensions
  getBookmarks: (bookId: string) => BookmarkItem[];
  addBookmark: (bookId: string, page: number, label?: string) => BookmarkItem;
  removeBookmark: (bookId: string, bookmarkId: string) => void;
  isBookmarked: (bookId: string, page: number) => boolean;
  stats: ReadingStats;
  refreshStats: () => void;
  exportData: () => string;
  importData: (jsonStr: string) => { success: boolean; message: string };
  // Streak & Active Reading Extensions (Diwali Diya)
  streakData: ReadingStreakData;
  todayReadingSeconds: number;
  isTodayQualified: boolean;
  recordActiveReading: (seconds: number) => {
    todaySeconds: number;
    qualified: boolean;
    justQualified: boolean;
    currentStreak: number;
  };
  // Reading Memory & Structured Sessions
  getReadingMemory: (bookId: string) => BookReadingMemory;
  recordSessionEvent: (event: Omit<ReadingTimelineEvent, "id">) => void;
  activeSession: ActiveReadingSession | null;
  startReadingSession: (bookId: string, startPage: number, targetMinutes: number) => void;
  endReadingSession: () => void;
  // Offline Caching
  checkOfflineStatus: (bookId: string, pdfUrl: string) => Promise<boolean>;
  saveBookOffline: (bookId: string, pdfUrl: string) => Promise<boolean>;
  removeBookOffline: (bookId: string, pdfUrl: string) => Promise<boolean>;
  // Granular Reset & Recovery
  clearAllProgress: () => void;
  clearAnnotations: () => void;
  clearStreak: () => void;
  clearOfflineStorage: () => Promise<void>;
  factoryReset: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const FAVORITES_KEY = "readers_hub_favorites_v2";
const HISTORY_KEY = "readers_hub_reading_progress_v2";

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingProgressItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveReadingSession | null>(null);
  const [streakData, setStreakData] = useState<ReadingStreakData>({
    daily: {},
    currentStreak: 0,
    longestStreak: 0,
    lastQualifiedDate: null,
  });
  const [stats, setStats] = useState<ReadingStats>({
    booksStarted: 0,
    booksCompleted: 0,
    pagesRead: 0,
    totalFavorites: 0,
    totalBookmarks: 0,
    totalNotes: 0,
    totalHighlights: 0,
    totalDrawings: 0,
    readingStreakDays: 0,
    todayReadingSeconds: 0,
    isTodayQualified: false,
  });
  const [mounted, setMounted] = useState(false);

  const refreshStats = useCallback(() => {
    const calculated = calculateReadingStats();
    const act = getReadingActivityData();
    setStats(calculated);
    setStreakData(act);
  }, []);

  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(FAVORITES_KEY) || localStorage.getItem("readers_hub_favorites_v1");
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedHistory = localStorage.getItem(HISTORY_KEY) || localStorage.getItem("readers_hub_history_v1");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        const normalized: ReadingProgressItem[] = parsed.map((item: any) => ({
          bookId: item.bookId || item,
          page: item.page || 1,
          totalPages: item.totalPages || 100,
          progress: item.progress || Math.min(100, Math.round(((item.page || 1) / (item.totalPages || 100)) * 100)),
          lastReadAt: item.lastReadAt || item.timestamp || Date.now(),
        }));
        setReadingHistory(normalized);
      }
    } catch (e) {
      console.warn("Could not read from localStorage", e);
    }
    refreshStats();
    setMounted(true);
  }, [refreshStats]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const toggleFavorite = useCallback((bookId: string) => {
    setFavorites((prev) => {
      let updated: string[];
      const book = BOOKS.find((b) => b.id === bookId);
      const title = book ? book.title : "Book";

      if (prev.includes(bookId)) {
        updated = prev.filter((id) => id !== bookId);
        showToast(`Removed "${title}" from shelf`);
      } else {
        updated = [...prev, bookId];
        showToast(`Saved "${title}" to favorites ❤️`);
      }

      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save favorites", e);
      }
      refreshStats();
      return updated;
    });
  }, [refreshStats, showToast]);

  const removeFavorite = useCallback((bookId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((id) => id !== bookId);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not remove favorite", e);
      }
      refreshStats();
      return updated;
    });
  }, [refreshStats]);

  const isFavorite = useCallback((bookId: string) => favorites.includes(bookId), [favorites]);

  const recordReading = useCallback((bookId: string, page = 1, totalPages = 100) => {
    setReadingHistory((prev) => {
      const existing = prev.find((item) => item.bookId === bookId);
      const curPage = page > 1 ? page : (existing ? existing.page : 1);
      const curTotal = totalPages || (existing ? existing.totalPages : 100);
      const progress = Math.min(100, Math.max(5, Math.round((curPage / curTotal) * 100)));

      // Avoid unnecessary state update if progress, page, and totalPages are identical
      if (
        existing &&
        existing.page === curPage &&
        existing.totalPages === curTotal &&
        existing.progress === progress &&
        Date.now() - existing.lastReadAt < 3000
      ) {
        return prev;
      }

      const filtered = prev.filter((item) => item.bookId !== bookId);
      const newItem: ReadingProgressItem = {
        bookId,
        page: curPage,
        totalPages: curTotal,
        progress,
        lastReadAt: Date.now(),
      };

      const updated = [newItem, ...filtered].slice(0, 16);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save reading progress", e);
      }
      refreshStats();
      return updated;
    });
  }, [refreshStats]);

  const updateReadingProgress = useCallback((bookId: string, page: number, totalPages?: number) => {
    recordReading(bookId, page, totalPages);
  }, [recordReading]);

  const getReadingProgress = useCallback((bookId: string) => {
    return readingHistory.find((item) => item.bookId === bookId);
  }, [readingHistory]);

  const removeHistoryItem = useCallback((bookId: string) => {
    setReadingHistory((prev) => {
      const updated = prev.filter((item) => item.bookId !== bookId);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save reading history", e);
      }
      refreshStats();
      return updated;
    });
  }, [refreshStats]);

  const clearHistory = useCallback(() => {
    setReadingHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.warn("Could not clear history", e);
    }
    refreshStats();
    showToast("Reading history cleared");
  }, [refreshStats, showToast]);

  // Bookmarks Wrapper
  const getBookmarks = useCallback((bookId: string) => getStoredBookmarks(bookId), []);

  const addBookmark = useCallback((bookId: string, page: number, label?: string) => {
    const item = storeBookmark(bookId, page, label);
    showToast(`Bookmarked Page ${page} 🔖`);
    refreshStats();
    return item;
  }, [refreshStats, showToast]);

  const removeBookmark = useCallback((bookId: string, bookmarkId: string) => {
    deleteStoredBookmark(bookId, bookmarkId);
    showToast(`Bookmark removed 🔖`);
    refreshStats();
  }, [refreshStats, showToast]);

  const isBookmarked = useCallback((bookId: string, page: number) => checkIsBookmarked(bookId, page), []);

  // Active Reading Time Tracker (Diwali Diya)
  const recordActiveReading = useCallback((seconds: number) => {
    const res = addActiveReadingTime(seconds);
    setStreakData(getReadingActivityData());
    setStats((prev) => ({
      ...prev,
      todayReadingSeconds: res.todaySeconds,
      isTodayQualified: res.qualified,
      readingStreakDays: res.currentStreak,
    }));

    // Update active session if running
    setActiveSession((prev) => {
      if (!prev || !prev.isActive) return prev;
      return {
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + seconds,
      };
    });

    return res;
  }, []);

  // Reading Memory & Sessions
  const getReadingMemory = useCallback((bookId: string) => getBookReadingMemory(bookId), []);

  const recordSessionEvent = useCallback((event: Omit<ReadingTimelineEvent, "id">) => {
    recordReadingMemorySession(event);
  }, []);

  const startReadingSession = useCallback((bookId: string, startPage: number, targetMinutes: number) => {
    setActiveSession({
      isActive: true,
      bookId,
      startPage,
      targetMinutes,
      elapsedSeconds: 0,
      startedAt: Date.now(),
    });
    showToast(`Started ${targetMinutes}-min Reading Session ⏱️`);
  }, [showToast]);

  const endReadingSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  // Offline Caching
  const checkOfflineStatus = useCallback((bookId: string, pdfUrl: string) => checkIsBookOffline(bookId, pdfUrl), []);

  const saveBookOffline = useCallback(async (bookId: string, pdfUrl: string) => {
    const success = await storeBookOffline(bookId, pdfUrl);
    if (success) {
      showToast("Book saved for offline reading! 📦");
    } else {
      showToast("Could not cache book offline");
    }
    return success;
  }, [showToast]);

  const removeBookOffline = useCallback(async (bookId: string, pdfUrl: string) => {
    const success = await deleteBookOffline(bookId, pdfUrl);
    if (success) {
      showToast("Offline copy removed");
    }
    return success;
  }, [showToast]);

  // Backup & Export Helpers
  const exportData = useCallback(() => exportAllUserData(), []);

  const handleImportData = useCallback((jsonStr: string) => {
    const res = importUserData(jsonStr);
    if (res.success) {
      const favs = localStorage.getItem(FAVORITES_KEY);
      if (favs) setFavorites(JSON.parse(favs));
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) setReadingHistory(JSON.parse(hist));
      refreshStats();
    }
    showToast(res.message);
    return res;
  }, [refreshStats, showToast]);

  // Granular Reset Actions
  const clearAllProgress = useCallback(() => {
    purgeReadingHistory();
    setReadingHistory([]);
    refreshStats();
    showToast("Reading history and progress cleared 🧹");
  }, [refreshStats, showToast]);

  const clearAnnotations = useCallback(() => {
    purgeAllAnnotations();
    refreshStats();
    showToast("All annotations and bookmarks cleared 🧹");
  }, [refreshStats, showToast]);

  const clearStreak = useCallback(() => {
    purgeStreakData();
    setStreakData({
      daily: {},
      currentStreak: 0,
      longestStreak: 0,
      lastQualifiedDate: null,
    });
    refreshStats();
    showToast("Daily reading streak reset 🪔");
  }, [refreshStats, showToast]);

  const clearOfflineStorage = useCallback(async () => {
    await purgeAllOfflineBooks();
    showToast("Offline book cache cleared 📦");
  }, [showToast]);

  const factoryReset = useCallback(async () => {
    await purgeFactoryResetAll();
    setFavorites([]);
    setReadingHistory([]);
    setStreakData({
      daily: {},
      currentStreak: 0,
      longestStreak: 0,
      lastQualifiedDate: null,
    });
    refreshStats();
    showToast("All local data reset to defaults ✨");
  }, [refreshStats, showToast]);

  // Derive actual book objects
  const favoriteBooks = mounted
    ? favorites
        .map((id) => BOOKS.find((b) => b.id === id))
        .filter((b): b is Book => Boolean(b))
    : [];

  const recentBooks: RecentBook[] = mounted
    ? (readingHistory
        .map((item) => {
          const book = BOOKS.find((b) => b.id === item.bookId);
          if (!book) return null;
          return {
            ...book,
            progress: item.progress,
            lastPage: item.page,
          };
        })
        .filter(Boolean) as RecentBook[])
    : [];

  const todayKey = getLocalDateKey();
  const todaySeconds = streakData.daily[todayKey]?.seconds || 0;
  const isTodayQualified = Boolean(streakData.daily[todayKey]?.qualified || todaySeconds >= DAILY_READING_GOAL_SECONDS);

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        favoriteBooks,
        readingHistory,
        recentBooks,
        recordReading,
        updateReadingProgress,
        getReadingProgress,
        removeHistoryItem,
        clearHistory,
        toastMessage,
        showToast,
        getBookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,
        stats,
        refreshStats,
        exportData,
        importData: handleImportData,
        streakData,
        todayReadingSeconds: todaySeconds,
        isTodayQualified,
        recordActiveReading,
        getReadingMemory,
        recordSessionEvent,
        activeSession,
        startReadingSession,
        endReadingSession,
        checkOfflineStatus,
        saveBookOffline,
        removeBookOffline,
        clearAllProgress,
        clearAnnotations,
        clearStreak,
        clearOfflineStorage,
        factoryReset,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
