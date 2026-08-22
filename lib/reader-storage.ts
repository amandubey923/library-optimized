/**
 * Reader's HUB — Centralized Reader Storage Utility
 * Namespaced browser-local persistence for Reading Progress, Highlights, Notes, and Drawings.
 */

export interface HighlightItem {
  id: string;
  bookId: string;
  page: number;
  text: string;
  color: "amber" | "mint" | "cyan" | "purple";
  rects?: { x: number; y: number; width: number; height: number }[]; // Normalized 0-100% coordinates
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

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface BookAnnotations {
  highlights: HighlightItem[];
  notes: NoteItem[];
  drawings: Record<number, DrawingStroke[]>; // pageNumber -> strokes
}

export interface ReadingProgressData {
  bookId: string;
  page: number;
  totalPages: number;
  progress: number;
  lastReadAt: number;
}

const PROGRESS_KEY_PREFIX = "readershub:progress:v1";
const ANNOTATIONS_KEY_PREFIX = "readershub:annotations:v1";

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
// Annotations Storage (Highlights, Notes, Drawings)
// -------------------------------------------------------------

export function getBookAnnotations(bookId: string): BookAnnotations {
  const defaultVal: BookAnnotations = {
    highlights: [],
    notes: [],
    drawings: {},
  };

  if (typeof window === "undefined" || !bookId) return defaultVal;

  try {
    const raw = localStorage.getItem(`${ANNOTATIONS_KEY_PREFIX}:${bookId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        drawings: parsed.drawings && typeof parsed.drawings === "object" ? parsed.drawings : {},
      };
    }
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
// Drawing Helpers
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

