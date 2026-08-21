"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Book, BOOKS } from "@/data/books";

export interface ReadingHistoryItem {
  bookId: string;
  timestamp: number;
}

interface LibraryContextType {
  favorites: string[];
  isFavorite: (bookId: string) => boolean;
  toggleFavorite: (bookId: string) => void;
  removeFavorite: (bookId: string) => void;
  favoriteBooks: Book[];
  readingHistory: ReadingHistoryItem[];
  recentBooks: Book[];
  recordReading: (bookId: string) => void;
  clearHistory: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const FAVORITES_KEY = "readers_hub_favorites_v1";
const HISTORY_KEY = "readers_hub_history_v1";

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(FAVORITES_KEY);
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setReadingHistory(JSON.parse(savedHistory));
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
        showToast(`Removed "${title}" from favorites`);
      } else {
        updated = [...prev, bookId];
        showToast(`Added "${title}" to your favorites ❤️`);
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

  const recordReading = (bookId: string) => {
    setReadingHistory((prev) => {
      const filtered = prev.filter((item) => item.bookId !== bookId);
      const updated = [{ bookId, timestamp: Date.now() }, ...filtered].slice(0, 10);
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
  };

  // Derive actual book objects
  const favoriteBooks = mounted
    ? favorites.map((id) => BOOKS.find((b) => b.id === id)).filter((b): b is Book => Boolean(b))
    : [];

  const recentBooks = mounted
    ? readingHistory
        .map((item) => BOOKS.find((b) => b.id === item.bookId))
        .filter((b): b is Book => Boolean(b))
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

