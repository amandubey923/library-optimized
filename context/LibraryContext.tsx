"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Book, BOOKS } from "@/data/books";

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
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const FAVORITES_KEY = "readers_hub_favorites_v2";
const HISTORY_KEY = "readers_hub_reading_progress_v2";

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingProgressItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const toggleFavorite = (bookId: string) => {
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
      return updated;
    });
  };

  const removeFavorite = (bookId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((id) => id !== bookId);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not remove favorite", e);
      }
      return updated;
    });
  };

  const isFavorite = (bookId: string) => favorites.includes(bookId);

  const recordReading = (bookId: string, page = 1, totalPages = 100) => {
    setReadingHistory((prev) => {
      const existing = prev.find((item) => item.bookId === bookId);
      const curPage = page > 1 ? page : (existing ? existing.page : 1);
      const curTotal = totalPages || (existing ? existing.totalPages : 100);
      const progress = Math.min(100, Math.max(5, Math.round((curPage / curTotal) * 100)));

      const filtered = prev.filter((item) => item.bookId !== bookId);
      const newItem: ReadingProgressItem = {
        bookId,
        page: curPage,
        totalPages: curTotal,
        progress,
        lastReadAt: Date.now(),
      };

      const updated = [newItem, ...filtered].slice(0, 12);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save reading progress", e);
      }
      return updated;
    });
  };

  const updateReadingProgress = (bookId: string, page: number, totalPages?: number) => {
    recordReading(bookId, page, totalPages);
  };

  const getReadingProgress = (bookId: string) => {
    return readingHistory.find((item) => item.bookId === bookId);
  };

  const removeHistoryItem = (bookId: string) => {
    setReadingHistory((prev) => {
      const updated = prev.filter((item) => item.bookId !== bookId);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save reading history", e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setReadingHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.warn("Could not clear history", e);
    }
    showToast("Reading history cleared");
  };

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
