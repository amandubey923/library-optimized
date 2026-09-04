"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
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
  setActiveUserUid,
  addActiveReadingTime,
  getWebsiteActiveTimeData,
  addWebsiteActiveSeconds,
  addBookReadingSeconds,
  getLocalDateKey,
  DAILY_READING_GOAL_SECONDS,
  ReadingStats,
  ReadingStreakData,
  BookReadingMemory,
  BookAnnotations,
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
  ShelfSectionKey,
  ShelfDismissalsMap,
  getShelfDismissals,
  dismissBookFromShelf,
  restoreBookToShelf,
  isBookDismissedFromShelf,
  clearShelfDismissals,
  ReadingCollection,
  BookReflection,
  getReadingCollections,
  createReadingCollection as createCollStorage,
  updateReadingCollection as updateCollStorage,
  deleteReadingCollection as deleteCollStorage,
  addBookToCollection as addCollStorage,
  removeBookFromCollection as removeCollStorage,
  getCollectionsForBook as getCollsForBookStorage,
  clearAllCollections,
  getBookReflections,
  getBookReflection,
  saveBookReflection,
  removeBookReflection,
  clearAllReflections,
  clearAllUserDataOnLogout,
  getStoredFavorites,
  saveStoredFavorites,
  getStoredReadingHistory,
  saveStoredReadingHistory,
} from "@/lib/reader-storage";
import { useAuth } from "@/context/AuthContext";
import {
  syncUserProfile,
  reconcileAndSyncAllUserData,
  syncReadingProgressToCloud,
  syncReadingActivityToCloud,
  syncActiveTimeToCloud,
  syncReadingMemoryToCloud,
  syncFavoriteToCloud,
  syncCollectionsToCloud,
  syncReflectionsToCloud,
  syncShelfDismissalsToCloud,
  cancelAllPendingSyncTimers,
  flushPendingActivitySyncs,
} from "@/lib/firestore-sync";
import { recordPublicActivity, sanitizeUsername } from "@/lib/social";
import { touchUserLastActive } from "@/lib/active-tracker";

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
  // Shelf Section Dismissals
  shelfDismissals: ShelfDismissalsMap;
  dismissFromShelf: (section: ShelfSectionKey, bookId: string) => void;
  restoreToShelf: (section: ShelfSectionKey, bookId: string) => void;
  isDismissedFromShelf: (section: ShelfSectionKey, bookId: string) => boolean;
  // Smart Reading Collections (Isolated: readershub:collections:v1)
  collections: ReadingCollection[];
  createCollection: (name: string, description?: string, color?: string) => ReadingCollection;
  updateCollection: (id: string, updates: Partial<Pick<ReadingCollection, "name" | "description" | "color">>) => void;
  deleteCollection: (id: string) => void;
  addBookToCollection: (collectionId: string, bookId: string) => void;
  removeBookFromCollection: (collectionId: string, bookId: string) => void;
  getCollectionsForBook: (bookId: string) => ReadingCollection[];
  // Post-Completion Reflections (Isolated: readershub:reflections:v1)
  reflections: Record<string, BookReflection>;
  getReflection: (bookId: string) => BookReflection | null;
  saveReflection: (bookId: string, reflection: string, rating?: number) => void;
  removeReflection: (bookId: string) => void;
  // Bookmarks & Stats Extensions
  getBookmarks: (bookId: string) => BookmarkItem[];
  addBookmark: (bookId: string, page: number, label?: string) => BookmarkItem;
  removeBookmark: (bookId: string, bookmarkId: string) => void;
  isBookmarked: (bookId: string, page: number) => boolean;
  stats: ReadingStats;
  refreshStats: () => void;
  exportData: () => string;
  importData: (jsonStr: string) => { success: boolean; message: string };
  // Active Time vs Reading Time Distinction
  globalActiveSeconds: number;
  todayActiveSeconds: number;
  globalReadingSeconds: number;
  recordWebsiteActiveTime: (seconds: number) => { totalActiveSeconds: number; todayActiveSeconds: number };
  addBookReadingTime: (bookId: string, seconds: number) => BookReadingMemory;
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
  readingMemories: Record<string, BookReadingMemory>;
  annotations: Record<string, BookAnnotations>;
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
  const { user } = useAuth();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [readingHistory, setReadingHistory] = useState<ReadingProgressItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shelfDismissals, setShelfDismissals] = useState<ShelfDismissalsMap>({});
  const [collections, setCollections] = useState<ReadingCollection[]>([]);
  const [reflections, setReflections] = useState<Record<string, BookReflection>>({});
  const [readingMemories, setReadingMemories] = useState<Record<string, BookReadingMemory>>({});
  const [annotations, setAnnotationsState] = useState<Record<string, BookAnnotations>>({});
  const [activeSession, setActiveSession] = useState<ActiveReadingSession | null>(null);
  const [activeTimeState, setActiveTimeState] = useState<{
    totalActiveSeconds: number;
    todayActiveSeconds: number;
  }>({ totalActiveSeconds: 0, todayActiveSeconds: 0 });
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
    totalReadingSeconds: 0,
    totalActiveSeconds: 0,
    todayActiveSeconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  useEffect(() => {
    setShelfDismissals(getShelfDismissals());
    setCollections(getReadingCollections());
    setReflections(getBookReflections());
    try {
      const storedFavs = localStorage.getItem(FAVORITES_KEY);
      if (storedFavs) {
        const parsed = JSON.parse(storedFavs);
        if (Array.isArray(parsed) && parsed.length > 0) setFavorites(parsed);
      }
      const storedHist = localStorage.getItem(HISTORY_KEY);
      if (storedHist) {
        const parsed = JSON.parse(storedHist);
        if (Array.isArray(parsed) && parsed.length > 0) setReadingHistory(parsed);
      }
    } catch (e) {
      console.warn("[LibraryContext] Failed to load local favorites/history:", e);
    }
  }, []);

  const dismissFromShelf = useCallback((section: ShelfSectionKey, bookId: string) => {
    dismissBookFromShelf(section, bookId);
    const updated = getShelfDismissals();
    setShelfDismissals(updated);
    if (user) {
      syncShelfDismissalsToCloud(user.uid, updated);
    }
    const book = BOOKS.find((b) => b.id === bookId);
    const title = book ? book.title : "Book";
    showToast(`Removed "${title}" from shelf view`);
  }, [showToast, user]);

  const restoreToShelf = useCallback((section: ShelfSectionKey, bookId: string) => {
    restoreBookToShelf(section, bookId);
    const updated = getShelfDismissals();
    setShelfDismissals(updated);
    if (user) {
      syncShelfDismissalsToCloud(user.uid, updated);
    }
  }, [user]);


  const createCollection = useCallback((name: string, description?: string, color?: string) => {
    const newCol = createCollStorage(name, description, color);
    const updated = getReadingCollections();
    setCollections(updated);
    if (user) {
      syncCollectionsToCloud(user.uid, updated);
    }
    showToast(`Created collection "${newCol.name}"`);
    return newCol;
  }, [showToast, user]);

  const updateCollection = useCallback((id: string, updates: Partial<Pick<ReadingCollection, "name" | "description" | "color">>) => {
    updateCollStorage(id, updates);
    const updated = getReadingCollections();
    setCollections(updated);
    if (user) {
      syncCollectionsToCloud(user.uid, updated);
    }
  }, [user]);

  const deleteCollection = useCallback((id: string) => {
    deleteCollStorage(id);
    const updated = getReadingCollections();
    setCollections(updated);
    if (user) {
      syncCollectionsToCloud(user.uid, updated);
    }
    showToast("Collection removed");
  }, [showToast, user]);

  const addBookToCollection = useCallback((collectionId: string, bookId: string) => {
    addCollStorage(collectionId, bookId);
    const updated = getReadingCollections();
    setCollections(updated);
    if (user) {
      syncCollectionsToCloud(user.uid, updated);
    }
    const book = BOOKS.find((b) => b.id === bookId);
    const col = updated.find((c) => c.id === collectionId);
    showToast(`Added ${book ? `"${book.title}"` : "book"} to ${col ? col.name : "collection"}`);
  }, [showToast, user]);

  const removeBookFromCollection = useCallback((collectionId: string, bookId: string) => {
    removeCollStorage(collectionId, bookId);
    const updated = getReadingCollections();
    setCollections(updated);
    if (user) {
      syncCollectionsToCloud(user.uid, updated);
    }
    showToast("Removed from collection");
  }, [showToast, user]);

  const getCollectionsForBookHandler = useCallback((bookId: string) => {
    return getCollsForBookStorage(bookId);
  }, []);

  const getReflection = useCallback((bookId: string) => {
    return getBookReflection(bookId);
  }, []);

  const saveReflection = useCallback((bookId: string, reflection: string, rating?: number) => {
    saveBookReflection(bookId, reflection, rating);
    const updated = getBookReflections();
    setReflections(updated);
    if (user) {
      syncReflectionsToCloud(user.uid, updated);
    }
    showToast("Reading reflection saved! 📝");
  }, [showToast, user]);

  const removeReflection = useCallback((bookId: string) => {
    removeBookReflection(bookId);
    const updated = getBookReflections();
    setReflections(updated);
    if (user) {
      syncReflectionsToCloud(user.uid, updated);
    }
  }, [user]);

  const isDismissedFromShelf = useCallback((section: ShelfSectionKey, bookId: string) => {
    return Boolean(shelfDismissals[section]?.[bookId]);
  }, [shelfDismissals]);

  const refreshStats = useCallback(() => {
    const calculated = calculateReadingStats();
    const act = getReadingActivityData(user?.uid);
    const actTime = getWebsiteActiveTimeData();
    const todayKey = getLocalDateKey();
    setStats(calculated);
    setStreakData(act);
    setActiveTimeState({
      totalActiveSeconds: actTime.totalActiveSeconds || 0,
      todayActiveSeconds: actTime.daily[todayKey] || 0,
    });
  }, [user]);

  // Global Website Engagement & Active Time Tracker (Meaningful Site Interaction outside PDF Reader)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SITE_IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds inactivity threshold
    let lastSiteActivity = Date.now();
    let accumulatedSiteSecs = 0;

    const registerSiteActivity = () => {
      lastSiteActivity = Date.now();
    };

    const events = ["pointerdown", "keydown", "scroll", "touchstart", "wheel"];
    events.forEach((ev) => window.removeEventListener(ev, registerSiteActivity));
    events.forEach((ev) => window.addEventListener(ev, registerSiteActivity, { passive: true }));

    const flushSiteActiveTime = () => {
      if (accumulatedSiteSecs > 0) {
        const res = addWebsiteActiveSeconds(accumulatedSiteSecs);
        accumulatedSiteSecs = 0;
        setActiveTimeState(res);
        if (user) {
          const actTime = getWebsiteActiveTimeData();
          syncActiveTimeToCloud(user.uid, actTime);
        }
      }
    };

    const interval = setInterval(() => {
      const isReadingPdf = pathnameRef.current?.startsWith("/book/");
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        !isReadingPdf &&
        Date.now() - lastSiteActivity < SITE_IDLE_TIMEOUT_MS
      ) {
        accumulatedSiteSecs += 1;
        if (accumulatedSiteSecs >= 5) {
          const res = addWebsiteActiveSeconds(accumulatedSiteSecs);
          accumulatedSiteSecs = 0;
          setActiveTimeState(res);
          if (user) {
            const actTime = getWebsiteActiveTimeData();
            syncActiveTimeToCloud(user.uid, actTime);
          }
        }
      }
    }, 1000);

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        flushSiteActiveTime();
      } else {
        lastSiteActivity = Date.now();
      }
    };

    // Immediately flush all pending debounced writes to Firestore on tab close / browser switch.
    // pagehide is more reliable than beforeunload across browsers (including mobile).
    const handlePageHide = () => {
      flushSiteActiveTime();
      if (user) {
        const act = getReadingActivityData(user.uid);
        const actTime = getWebsiteActiveTimeData();
        // flushPendingActivitySyncs cancels existing debounce timers and writes immediately.
        flushPendingActivitySyncs(user.uid, act, actTime);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", flushSiteActiveTime);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearInterval(interval);
      flushSiteActiveTime();
      events.forEach((ev) => window.removeEventListener(ev, registerSiteActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", flushSiteActiveTime);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prevUserRef = useRef<string | null>(null);

  // Synchronize with Firebase Firestore on authentication state changes (Authoritative Cloud State)
  useEffect(() => {
    if (!user) {
      setActiveUserUid(null);
      if (prevUserRef.current !== null) {
        // User logged out: abort in-flight debounce timers, clear session caches and reset state to pristine guest defaults
        cancelAllPendingSyncTimers();
        clearAllUserDataOnLogout();
        setFavorites([]);
        setReadingHistory([]);
        setCollections([]);
        setReflections({});
        setShelfDismissals({});
        setReadingMemories({});
        setAnnotationsState({});
        setStreakData({
          daily: {},
          currentStreak: 0,
          longestStreak: 0,
          lastQualifiedDate: null,
        });
        setActiveTimeState({ totalActiveSeconds: 0, todayActiveSeconds: 0 });
        setStats(calculateReadingStats());
        setActiveSession(null);
      }
      prevUserRef.current = null;
      return;
    }

    prevUserRef.current = user.uid;
    setActiveUserUid(user.uid);
    // Immediately prime local state with this user's isolated local activity before cloud sync arrives
    const localUserStreak = getReadingActivityData(user.uid);
    setStreakData(localUserStreak);

    // Immediately prime local favorites and reading history before cloud sync arrives
    const localFavs = getStoredFavorites(user.uid);
    if (localFavs && localFavs.length > 0) {
      setFavorites(localFavs);
    }
    const localHist = getStoredReadingHistory(user.uid);
    if (localHist && localHist.length > 0) {
      setReadingHistory(localHist);
    }

    let isCancelled = false;

    const performSync = async () => {
      // 1. Fetch Authoritative Cloud State from Firestore
      const cloudData = await reconcileAndSyncAllUserData(user);

      if (isCancelled) return;

      // 2. Update React state strictly from the authenticated cloud state
      setFavorites(cloudData.favorites);
      setReadingHistory(cloudData.readingHistory);
      setStreakData(cloudData.readingActivity);
      setCollections(cloudData.collections || []);
      setReflections(cloudData.reflections || {});
      setShelfDismissals(cloudData.shelfDismissals || {});
      setReadingMemories(cloudData.readingMemories || {});
      setAnnotationsState(cloudData.annotations || {});

      const todayKey = getLocalDateKey();
      setActiveTimeState({
        totalActiveSeconds: cloudData.activeTime.totalActiveSeconds || 0,
        todayActiveSeconds: cloudData.activeTime.daily[todayKey] || 0,
      });
      setStats(calculateReadingStats());
    };

    performSync();
    if (user) {
      touchUserLastActive(user.uid);
    }

    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Tab visibility change activity trigger (throttled to 3 minutes)
  useEffect(() => {
    if (!user) return;
    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        touchUserLastActive(user.uid);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  const toggleFavorite = useCallback((bookId: string) => {
    let wasAdded = false;
    let bookTitle = "Book";
    setFavorites((prev) => {
      const book = BOOKS.find((b) => b.id === bookId);
      if (book) bookTitle = book.title;

      let updated: string[];
      if (prev.includes(bookId)) {
        updated = prev.filter((id) => id !== bookId);
      } else {
        wasAdded = true;
        updated = [...prev, bookId];
      }
      saveStoredFavorites(updated, user?.uid);
      return updated;
    });

    if (user) {
      syncFavoriteToCloud(user.uid, bookId, wasAdded);
    }

    if (wasAdded) {
      showToast(`Saved "${bookTitle}" to favorites ❤️`);
    } else {
      showToast(`Removed "${bookTitle}" from shelf`);
    }
    refreshStats();
  }, [refreshStats, showToast, user]);

  const removeFavorite = useCallback((bookId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((id) => id !== bookId);
      saveStoredFavorites(updated, user?.uid);
      return updated;
    });
    if (user) {
      syncFavoriteToCloud(user.uid, bookId, false);
    }
    refreshStats();
  }, [refreshStats, user]);

  const isFavorite = useCallback((bookId: string) => favorites.includes(bookId), [favorites]);

  const recordReading = useCallback((bookId: string, page = 1, totalPages = 100) => {
    let hasChanged = false;
    let finalPage = page;
    let finalTotal = totalPages;

    setReadingHistory((prev) => {
      const existing = prev.find((item) => item.bookId === bookId);
      const curPage = page > 1 ? page : (existing ? existing.page : 1);
      const curTotal = totalPages || (existing ? existing.totalPages : 100);
      finalPage = curPage;
      finalTotal = curTotal;
      const progress = Math.min(100, Math.max(5, Math.round((curPage / curTotal) * 100)));

      // Avoid unnecessary state update if progress, page, and totalPages are identical
      if (
        existing &&
        existing.page === curPage &&
        existing.totalPages === curTotal &&
        existing.progress === progress
      ) {
        return prev;
      }

      hasChanged = true;
      const filtered = prev.filter((item) => item.bookId !== bookId);
      const newItem: ReadingProgressItem = {
        bookId,
        page: curPage,
        totalPages: curTotal,
        progress,
        lastReadAt: Date.now(),
      };

      const updated = [newItem, ...filtered].slice(0, 16);
      saveStoredReadingHistory(updated, user?.uid);
      return updated;
    });

    if (bookId) {
      restoreBookToShelf("reading", bookId);
      restoreBookToShelf("spotlight", bookId);
      setShelfDismissals(getShelfDismissals());
    }

    if (user) {
      syncReadingProgressToCloud(user.uid, bookId, finalPage, finalTotal);

      // Record public reading activity if book is completed
      if (finalPage >= finalTotal && finalTotal > 0) {
        const targetBook = BOOKS.find((b) => b.id === bookId);
        recordPublicActivity({
          uid: user.uid,
          username: user.displayName ? sanitizeUsername(user.displayName) : "reader",
          displayName: user.displayName || "Reader",
          photoURL: user.photoURL || undefined,
          type: "completed_book",
          bookId,
          bookTitle: targetBook?.title || "Book",
          bookCover: targetBook?.cover,
          timestamp: Date.now(),
        });
      }
    }

    if (hasChanged) {
      refreshStats();
    }
  }, [refreshStats, user]);

  const updateReadingProgress = useCallback((bookId: string, page: number, totalPages?: number) => {
    recordReading(bookId, page, totalPages);
  }, [recordReading]);

  const getReadingProgress = useCallback((bookId: string) => {
    return readingHistory.find((item) => item.bookId === bookId);
  }, [readingHistory]);

  const removeHistoryItem = useCallback((bookId: string) => {
    setReadingHistory((prev) => {
      const updated = prev.filter((item) => item.bookId !== bookId);
      return updated;
    });
    refreshStats();
  }, [refreshStats]);

  const clearHistory = useCallback(() => {
    setReadingHistory([]);
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
    const res = addActiveReadingTime(seconds, user?.uid);
    const act = getReadingActivityData(user?.uid);
    const actTime = getWebsiteActiveTimeData();
    const todayKey = getLocalDateKey();
    const calculatedStats = calculateReadingStats();

    setStreakData(act);
    setActiveTimeState({
      totalActiveSeconds: Math.max(actTime.totalActiveSeconds || 0, calculatedStats.totalReadingSeconds),
      todayActiveSeconds: Math.max(actTime.daily[todayKey] || 0, res.todaySeconds),
    });
    setStats(calculatedStats);

    // Update active session if running
    setActiveSession((prev) => {
      if (!prev || !prev.isActive) return prev;
      return {
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + seconds,
      };
    });

    if (user) {
      syncReadingActivityToCloud(user.uid, act);
    }

    return res;
  }, [user]);

  // Reading Memory & Sessions
  const getReadingMemory = useCallback((bookId: string) => getBookReadingMemory(bookId), []);

  const recordSessionEvent = useCallback((event: Omit<ReadingTimelineEvent, "id">) => {
    recordReadingMemorySession(event);
    if (user) {
      const memory = getBookReadingMemory(event.bookId);
      if (memory) {
        syncReadingMemoryToCloud(user.uid, event.bookId, memory);
      }
    }
  }, [user]);

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
    purgeStreakData(user?.uid);
    setStreakData({
      daily: {},
      currentStreak: 0,
      longestStreak: 0,
      lastQualifiedDate: null,
    });
    refreshStats();
    showToast("Daily reading streak reset 🪔");
  }, [user, refreshStats, showToast]);

  const clearOfflineStorage = useCallback(async () => {
    await purgeAllOfflineBooks();
    showToast("Offline book cache cleared 📦");
  }, [showToast]);

  const factoryReset = useCallback(async () => {
    await purgeFactoryResetAll();
    clearShelfDismissals();
    clearAllCollections();
    clearAllReflections();
    setCollections([]);
    setReflections({});
    setShelfDismissals({});
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

  const recordWebsiteActiveTime = useCallback((seconds: number) => {
    const res = addWebsiteActiveSeconds(seconds);
    setActiveTimeState(res);
    if (user) {
      const actTime = getWebsiteActiveTimeData();
      syncActiveTimeToCloud(user.uid, actTime);
    }
    return res;
  }, [user]);

  const addBookReadingTime = useCallback((bookId: string, seconds: number) => {
    const mem = addBookReadingSeconds(bookId, seconds);
    if (user && mem) {
      syncReadingMemoryToCloud(user.uid, bookId, mem);
    }
    return mem;
  }, [user]);

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

  const globalReadingSeconds = useMemo(() => {
    let total = 0;
    Object.values(streakData.daily || {}).forEach((d) => {
      total += d.seconds || 0;
    });
    return total;
  }, [streakData]);

  const contextValue = useMemo<LibraryContextType>(
    () => ({
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
      shelfDismissals,
      dismissFromShelf,
      restoreToShelf,
      isDismissedFromShelf,
      getBookmarks,
      addBookmark,
      removeBookmark,
      isBookmarked,
      stats,
      refreshStats,
      exportData,
      importData: handleImportData,
      globalActiveSeconds: activeTimeState.totalActiveSeconds,
      todayActiveSeconds: activeTimeState.todayActiveSeconds,
      globalReadingSeconds,
      recordWebsiteActiveTime,
      addBookReadingTime,
      streakData,
      todayReadingSeconds: todaySeconds,
      isTodayQualified,
      recordActiveReading,
      getReadingMemory,
      readingMemories,
      annotations,
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
      collections,
      createCollection,
      updateCollection,
      deleteCollection,
      addBookToCollection,
      removeBookFromCollection,
      getCollectionsForBook: getCollectionsForBookHandler,
      reflections,
      getReflection,
      saveReflection,
      removeReflection,
    }),
    [
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
      shelfDismissals,
      dismissFromShelf,
      restoreToShelf,
      isDismissedFromShelf,
      getBookmarks,
      addBookmark,
      removeBookmark,
      isBookmarked,
      stats,
      refreshStats,
      exportData,
      handleImportData,
      activeTimeState.totalActiveSeconds,
      activeTimeState.todayActiveSeconds,
      globalReadingSeconds,
      recordWebsiteActiveTime,
      addBookReadingTime,
      streakData,
      todaySeconds,
      isTodayQualified,
      recordActiveReading,
      getReadingMemory,
      readingMemories,
      annotations,
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
      collections,
      createCollection,
      updateCollection,
      deleteCollection,
      addBookToCollection,
      removeBookFromCollection,
      getCollectionsForBookHandler,
      reflections,
      getReflection,
      saveReflection,
      removeReflection,
    ]
  );

  return (
    <LibraryContext.Provider value={contextValue}>
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
