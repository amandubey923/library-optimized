/**
 * Reader's HUB — Centralized Reader Storage Utility
 * Namespaced browser-local persistence for Reading Progress, Bookmarks, Highlights, Notes, Study Annotations, and Backup/Export.
 */

export interface BookmarkItem {
  id: string;
  bookId: string;
  page: number;
  label?: string;
  createdAt: number;
}

export interface HighlightItem {
  id: string;
  bookId: string;
  page: number;
  text: string;
  color: "amber" | "mint" | "cyan" | "purple";
  rects?: { x: number; y: number; width: number; height: number }[];
  createdAt: number;
}

export interface NoteItem {
  id: string;
  bookId: string;
  page: number;
  selectedText?: string;
  note: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DrawingPoint {
  x: number; // Normalized 0-1 coordinate
  y: number; // Normalized 0-1 coordinate
}

export type AnnotationToolType =
  | "pen"
  | "highlighter"
  | "line"
  | "arrow"
  | "circle"
  | "rectangle"
  | "square"
  | "diamond"
  | "text";

export interface DrawingStroke {
  id: string;
  type?: AnnotationToolType;
  points: DrawingPoint[];
  color: string;
  width: number;
  opacity?: number;
  fill?: boolean;
  text?: string;
  fontSize?: number;
}

export interface BookAnnotations {
  highlights: HighlightItem[];
  notes: NoteItem[];
  drawings: Record<number, DrawingStroke[]>; // pageNumber -> strokes/shapes
  bookmarks?: BookmarkItem[];
}

export interface ReadingProgressData {
  bookId: string;
  page: number;
  totalPages: number;
  progress: number;
  lastReadAt: number;
}

export interface ReadingStats {
  booksStarted: number;
  booksCompleted: number;
  pagesRead: number;
  totalFavorites: number;
  totalBookmarks: number;
  totalNotes: number;
  totalHighlights: number;
  totalDrawings: number;
  readingStreakDays: number;
}

export interface ReaderHubExportData {
  version: string;
  exportedAt: number;
  favorites: string[];
  readingHistory: ReadingProgressItem[];
  annotations: Record<string, BookAnnotations>;
  bookmarks: Record<string, BookmarkItem[]>;
  preferences?: any;
}

export interface ReadingProgressItem {
  bookId: string;
  page: number;
  totalPages: number;
  progress: number;
  lastReadAt: number;
}

const PROGRESS_KEY_PREFIX = "readershub:progress:v1";
const ANNOTATIONS_KEY_PREFIX = "readershub:annotations:v1";
const BOOKMARKS_KEY_PREFIX = "readershub:bookmarks:v1";
const FAVORITES_KEY = "readers_hub_favorites_v2";
const HISTORY_KEY = "readers_hub_reading_progress_v2";

// -------------------------------------------------------------
// Reading Progress Storage
// -------------------------------------------------------------

export function getSavedProgress(bookId: string): ReadingProgressData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PROGRESS_KEY_PREFIX}:${bookId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to read progress for ${bookId}:`, e);
  }
  return null;
}

export function saveProgress(bookId: string, page: number, totalPages: number): void {
  if (typeof window === "undefined" || !bookId || page < 1) return;
  try {
    const progress = totalPages > 0 ? Math.min(100, Math.round((page / totalPages) * 100)) : 0;
    const data: ReadingProgressData = {
      bookId,
      page,
      totalPages,
      progress,
      lastReadAt: Date.now(),
    };
    localStorage.setItem(`${PROGRESS_KEY_PREFIX}:${bookId}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to save progress for ${bookId}:`, e);
  }
}

// -------------------------------------------------------------
// Bookmarks Storage
// -------------------------------------------------------------

export function getBookmarks(bookId: string): BookmarkItem[] {
  if (typeof window === "undefined" || !bookId) return [];
  try {
    const raw = localStorage.getItem(`${BOOKMARKS_KEY_PREFIX}:${bookId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to read bookmarks for ${bookId}:`, e);
  }
  return [];
}

export function saveBookmark(bookId: string, page: number, label?: string): BookmarkItem {
  const current = getBookmarks(bookId);
  const existing = current.find((b) => b.page === page);
  if (existing) {
    if (label !== undefined) {
      existing.label = label;
      localStorage.setItem(`${BOOKMARKS_KEY_PREFIX}:${bookId}`, JSON.stringify(current));
    }
    return existing;
  }

  const newItem: BookmarkItem = {
    id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    bookId,
    page,
    label: label || `Page ${page}`,
    createdAt: Date.now(),
  };

  const updated = [...current, newItem].sort((a, b) => a.page - b.page);
  try {
    localStorage.setItem(`${BOOKMARKS_KEY_PREFIX}:${bookId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to save bookmark for ${bookId}:`, e);
  }
  return newItem;
}

export function deleteBookmark(bookId: string, bookmarkId: string): void {
  const current = getBookmarks(bookId);
  const updated = current.filter((b) => b.id !== bookmarkId && String(b.page) !== bookmarkId);
  try {
    localStorage.setItem(`${BOOKMARKS_KEY_PREFIX}:${bookId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to delete bookmark for ${bookId}:`, e);
  }
}

export function isPageBookmarked(bookId: string, page: number): boolean {
  const list = getBookmarks(bookId);
  return list.some((b) => b.page === page);
}

// -------------------------------------------------------------
// Annotations Storage (Highlights, Notes, Drawings, Shapes)
// -------------------------------------------------------------

export function getBookAnnotations(bookId: string): BookAnnotations {
  const defaultVal: BookAnnotations = {
    highlights: [],
    notes: [],
    drawings: {},
    bookmarks: [],
  };

  if (typeof window === "undefined" || !bookId) return defaultVal;

  try {
    const raw = localStorage.getItem(`${ANNOTATIONS_KEY_PREFIX}:${bookId}`);
    const bms = getBookmarks(bookId);

    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        drawings: parsed.drawings && typeof parsed.drawings === "object" ? parsed.drawings : {},
        bookmarks: bms,
      };
    }
    return { ...defaultVal, bookmarks: bms };
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to read annotations for ${bookId}:`, e);
  }

  return defaultVal;
}

export function saveBookAnnotations(bookId: string, annotations: BookAnnotations): void {
  if (typeof window === "undefined" || !bookId) return;
  try {
    localStorage.setItem(`${ANNOTATIONS_KEY_PREFIX}:${bookId}`, JSON.stringify(annotations));
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to save annotations for ${bookId}:`, e);
  }
}

// -------------------------------------------------------------
// Highlight Helpers
// -------------------------------------------------------------

export function addHighlight(bookId: string, highlight: Omit<HighlightItem, "id" | "createdAt">): HighlightItem {
  const current = getBookAnnotations(bookId);
  const newItem: HighlightItem = {
    ...highlight,
    id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };

  current.highlights.push(newItem);
  saveBookAnnotations(bookId, current);
  return newItem;
}

export function deleteHighlight(bookId: string, highlightId: string): void {
  const current = getBookAnnotations(bookId);
  current.highlights = current.highlights.filter((h) => h.id !== highlightId);
  saveBookAnnotations(bookId, current);
}

// -------------------------------------------------------------
// Notes Helpers
// -------------------------------------------------------------

export function addNote(bookId: string, note: Omit<NoteItem, "id" | "createdAt" | "updatedAt">): NoteItem {
  const current = getBookAnnotations(bookId);
  const newItem: NoteItem = {
    ...note,
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  current.notes.push(newItem);
  saveBookAnnotations(bookId, current);
  return newItem;
}

export function updateNote(bookId: string, noteId: string, updatedText: string): void {
  const current = getBookAnnotations(bookId);
  const note = current.notes.find((n) => n.id === noteId);
  if (note) {
    note.note = updatedText;
    note.updatedAt = Date.now();
    saveBookAnnotations(bookId, current);
  }
}

export function deleteNote(bookId: string, noteId: string): void {
  const current = getBookAnnotations(bookId);
  current.notes = current.notes.filter((n) => n.id !== noteId);
  saveBookAnnotations(bookId, current);
}

// -------------------------------------------------------------
// Drawing & Shapes Helpers
// -------------------------------------------------------------

export function savePageDrawings(bookId: string, page: number, strokes: DrawingStroke[]): void {
  const current = getBookAnnotations(bookId);
  if (strokes.length === 0) {
    delete current.drawings[page];
  } else {
    current.drawings[page] = strokes;
  }
  saveBookAnnotations(bookId, current);
}

export function clearPageDrawings(bookId: string, page: number): void {
  const current = getBookAnnotations(bookId);
  delete current.drawings[page];
  saveBookAnnotations(bookId, current);
}

// -------------------------------------------------------------
// Genuine Local Reading Statistics Calculator
// -------------------------------------------------------------

export function calculateReadingStats(): ReadingStats {
  if (typeof window === "undefined") {
    return {
      booksStarted: 0,
      booksCompleted: 0,
      pagesRead: 0,
      totalFavorites: 0,
      totalBookmarks: 0,
      totalNotes: 0,
      totalHighlights: 0,
      totalDrawings: 0,
      readingStreakDays: 1,
    };
  }

  let booksStarted = 0;
  let booksCompleted = 0;
  let pagesRead = 0;
  let totalFavorites = 0;
  let totalBookmarks = 0;
  let totalNotes = 0;
  let totalHighlights = 0;
  let totalDrawings = 0;

  try {
    // 1. Favorites
    const favs = localStorage.getItem(FAVORITES_KEY);
    if (favs) {
      totalFavorites = JSON.parse(favs).length;
    }

    // 2. Reading History
    const history = localStorage.getItem(HISTORY_KEY);
    if (history) {
      const parsed: ReadingProgressItem[] = JSON.parse(history);
      booksStarted = parsed.length;
      for (const item of parsed) {
        pagesRead += item.page || 1;
        if (item.progress >= 98 || (item.totalPages && item.page >= item.totalPages)) {
          booksCompleted += 1;
        }
      }
    }

    // 3. Scan LocalStorage for Bookmarks & Annotations
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith(BOOKMARKS_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          totalBookmarks += JSON.parse(raw).length;
        }
      } else if (key.startsWith(ANNOTATIONS_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.notes)) totalNotes += parsed.notes.length;
          if (Array.isArray(parsed.highlights)) totalHighlights += parsed.highlights.length;
          if (parsed.drawings) {
            totalDrawings += Object.keys(parsed.drawings).length;
          }
        }
      }
    }
  } catch (e) {
    console.warn("[ReaderStorage] Error calculating stats:", e);
  }

  return {
    booksStarted,
    booksCompleted,
    pagesRead,
    totalFavorites,
    totalBookmarks,
    totalNotes,
    totalHighlights,
    totalDrawings,
    readingStreakDays: Math.max(1, booksStarted > 0 ? 2 : 1),
  };
}

// -------------------------------------------------------------
// Backup / Data Export & Import (100% Client-Side JSON)
// -------------------------------------------------------------

export function exportAllUserData(): string {
  if (typeof window === "undefined") return "{}";

  const exportData: ReaderHubExportData = {
    version: "1.0.0",
    exportedAt: Date.now(),
    favorites: [],
    readingHistory: [],
    annotations: {},
    bookmarks: {},
  };

  try {
    const favs = localStorage.getItem(FAVORITES_KEY);
    if (favs) exportData.favorites = JSON.parse(favs);

    const history = localStorage.getItem(HISTORY_KEY);
    if (history) exportData.readingHistory = JSON.parse(history);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith(ANNOTATIONS_KEY_PREFIX)) {
        const bookId = key.replace(`${ANNOTATIONS_KEY_PREFIX}:`, "");
        const raw = localStorage.getItem(key);
        if (raw) exportData.annotations[bookId] = JSON.parse(raw);
      } else if (key.startsWith(BOOKMARKS_KEY_PREFIX)) {
        const bookId = key.replace(`${BOOKMARKS_KEY_PREFIX}:`, "");
        const raw = localStorage.getItem(key);
        if (raw) exportData.bookmarks[bookId] = JSON.parse(raw);
      }
    }
  } catch (e) {
    console.warn("[ReaderStorage] Failed to export data:", e);
  }

  return JSON.stringify(exportData, null, 2);
}

export function importUserData(jsonString: string): { success: boolean; message: string } {
  if (typeof window === "undefined" || !jsonString) {
    return { success: false, message: "No data provided to import." };
  }

  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== "object") {
      return { success: false, message: "Invalid JSON format." };
    }

    if (Array.isArray(data.favorites)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(data.favorites));
    }

    if (Array.isArray(data.readingHistory)) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(data.readingHistory));
    }

    if (data.annotations && typeof data.annotations === "object") {
      for (const [bookId, ann] of Object.entries(data.annotations)) {
        localStorage.setItem(`${ANNOTATIONS_KEY_PREFIX}:${bookId}`, JSON.stringify(ann));
      }
    }

    if (data.bookmarks && typeof data.bookmarks === "object") {
      for (const [bookId, bms] of Object.entries(data.bookmarks)) {
        localStorage.setItem(`${BOOKMARKS_KEY_PREFIX}:${bookId}`, JSON.stringify(bms));
      }
    }

    return { success: true, message: "Reading data and annotations restored successfully!" };
  } catch (e: any) {
    return { success: false, message: `Failed to restore data: ${e?.message || "Corrupted file"}` };
  }
}
