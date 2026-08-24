/**
 * Reader's HUB — Centralized Reader Storage Utility (Optimized & In-Memory Cached)
 * Namespaced browser-local persistence for Reading Progress, Bookmarks, Highlights, Notes, Study Annotations, Daily Reading Streak (Diwali Diya), Reading Memory, and Offline Cache.
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

export interface DailyReadingActivity {
  seconds: number; // Accumulated active reading time in seconds
  qualified: boolean; // true if >= 15 * 60 seconds (900 seconds)
  lastUpdated: number;
}

export interface ReadingStreakData {
  daily: Record<string, DailyReadingActivity>; // "YYYY-MM-DD" -> activity
  currentStreak: number;
  longestStreak: number;
  lastQualifiedDate: string | null;
}

export interface ReadingTimelineEvent {
  id: string;
  bookId: string;
  timestamp: number;
  startPage: number;
  endPage: number;
  durationSeconds: number;
  highlightsAdded: number;
  notesAdded: number;
  bookmarksAdded: number;
}

export interface BookReadingMemory {
  bookId: string;
  totalSeconds: number;
  sessionsCount: number;
  firstReadAt: number;
  lastReadAt: number;
  timeline: ReadingTimelineEvent[];
}

export interface WebsiteActiveTimeData {
  totalActiveSeconds: number; // Global cumulative active website usage (Reading + Exploration)
  daily: Record<string, number>; // "YYYY-MM-DD" -> total active seconds on that day
  explorationDaily?: Record<string, number>; // "YYYY-MM-DD" -> exploration / browsing seconds
  totalExplorationSeconds?: number;
  lastUpdated: number;
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
  todayReadingSeconds: number;
  isTodayQualified: boolean;
  totalReadingSeconds: number; // Genuine reading time across all books
  totalActiveSeconds: number;  // Meaningful website engagement time
  todayActiveSeconds: number;  // Today's website engagement time
}

export interface ReaderHubExportData {
  version: string;
  exportedAt: number;
  favorites: string[];
  readingHistory: ReadingProgressItem[];
  annotations: Record<string, BookAnnotations>;
  bookmarks: Record<string, BookmarkItem[]>;
  readingActivity?: ReadingStreakData;
  readingMemories?: Record<string, BookReadingMemory>;
  activeTime?: WebsiteActiveTimeData;
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
const MEMORY_KEY_PREFIX = "readershub:memory:v1";
const ACTIVITY_KEY = "readershub:reading-activity:v1";
const ACTIVE_TIME_KEY = "readershub:active-time:v1";
const FAVORITES_KEY = "readers_hub_favorites_v2";
const HISTORY_KEY = "readers_hub_reading_progress_v2";
const OFFLINE_CACHE_NAME = "readershub-offline-books-v1";

// High-speed in-memory caches to reduce redundant JSON parsing & LocalStorage overhead
const progressCache = new Map<string, ReadingProgressData>();
const annotationsCache = new Map<string, BookAnnotations>();
const bookmarksCache = new Map<string, BookmarkItem[]>();
const memoryCache = new Map<string, BookReadingMemory>();
let activeTimeCache: WebsiteActiveTimeData | null = null;

export const DAILY_READING_GOAL_SECONDS = 15 * 60; // 15 minutes = 900 seconds

// -------------------------------------------------------------
// Date Utility (Local Calendar Date)
// -------------------------------------------------------------

export function getLocalDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPreviousDateKey(dateKey: string): string {
  const parts = dateKey.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}

// -------------------------------------------------------------
// Daily Reading Streak Logic (Diwali Diya)
// -------------------------------------------------------------

export function calculateStreak(dailyMap: Record<string, DailyReadingActivity>): {
  currentStreak: number;
  longestStreak: number;
  lastQualifiedDate: string | null;
} {
  const todayKey = getLocalDateKey();
  const yesterdayKey = getPreviousDateKey(todayKey);

  const isTodayQualified = Boolean(dailyMap[todayKey]?.qualified || (dailyMap[todayKey]?.seconds || 0) >= DAILY_READING_GOAL_SECONDS);
  const isYesterdayQualified = Boolean(dailyMap[yesterdayKey]?.qualified || (dailyMap[yesterdayKey]?.seconds || 0) >= DAILY_READING_GOAL_SECONDS);

  let currentStreak = 0;
  let lastQualifiedDate: string | null = null;

  if (isTodayQualified) {
    currentStreak = 1;
    lastQualifiedDate = todayKey;
    let checkKey = yesterdayKey;
    while (dailyMap[checkKey]?.qualified || (dailyMap[checkKey]?.seconds || 0) >= DAILY_READING_GOAL_SECONDS) {
      currentStreak += 1;
      checkKey = getPreviousDateKey(checkKey);
    }
  } else if (isYesterdayQualified) {
    currentStreak = 1;
    lastQualifiedDate = yesterdayKey;
    let checkKey = getPreviousDateKey(yesterdayKey);
    while (dailyMap[checkKey]?.qualified || (dailyMap[checkKey]?.seconds || 0) >= DAILY_READING_GOAL_SECONDS) {
      currentStreak += 1;
      checkKey = getPreviousDateKey(checkKey);
    }
  }

  // Calculate longest streak across all recorded history
  const sortedDates = Object.keys(dailyMap)
    .filter((k) => dailyMap[k]?.qualified || (dailyMap[k]?.seconds || 0) >= DAILY_READING_GOAL_SECONDS)
    .sort();

  let longestStreak = currentStreak;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const dateKey of sortedDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const expectedPrev = getPreviousDateKey(dateKey);
      if (prevDate === expectedPrev) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
    }
    prevDate = dateKey;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return { currentStreak, longestStreak, lastQualifiedDate };
}

export function getReadingActivityData(): ReadingStreakData {
  const defaultData: ReadingStreakData = {
    daily: {},
    currentStreak: 0,
    longestStreak: 0,
    lastQualifiedDate: null,
  };

  if (typeof window === "undefined") return defaultData;

  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const daily = parsed.daily && typeof parsed.daily === "object" ? parsed.daily : {};
      const { currentStreak, longestStreak, lastQualifiedDate } = calculateStreak(daily);
      return {
        daily,
        currentStreak,
        longestStreak: Math.max(longestStreak, parsed.longestStreak || 0),
        lastQualifiedDate,
      };
    }
  } catch (e) {
    console.warn("[ReaderStorage] Error reading reading activity:", e);
  }

  return defaultData;
}

export function addActiveReadingTime(secondsToAdd: number): {
  todaySeconds: number;
  qualified: boolean;
  justQualified: boolean;
  currentStreak: number;
} {
  if (typeof window === "undefined" || secondsToAdd <= 0) {
    return { todaySeconds: 0, qualified: false, justQualified: false, currentStreak: 0 };
  }

  const currentData = getReadingActivityData();
  const todayKey = getLocalDateKey();
  const todayEntry = currentData.daily[todayKey] || {
    seconds: 0,
    qualified: false,
    lastUpdated: Date.now(),
  };

  const prevSeconds = todayEntry.seconds;
  const wasQualified = todayEntry.qualified || prevSeconds >= DAILY_READING_GOAL_SECONDS;

  const newSeconds = prevSeconds + secondsToAdd;
  const isQualified = newSeconds >= DAILY_READING_GOAL_SECONDS;
  const justQualified = !wasQualified && isQualified;

  todayEntry.seconds = newSeconds;
  todayEntry.qualified = isQualified;
  todayEntry.lastUpdated = Date.now();

  currentData.daily[todayKey] = todayEntry;

  const { currentStreak, longestStreak, lastQualifiedDate } = calculateStreak(currentData.daily);
  currentData.currentStreak = currentStreak;
  currentData.longestStreak = Math.max(longestStreak, currentData.longestStreak || 0);
  currentData.lastQualifiedDate = lastQualifiedDate;

  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(currentData));
  } catch (e) {
    console.warn("[ReaderStorage] Error saving reading activity:", e);
  }

  // Invalidate activeTimeCache so next getWebsiteActiveTimeData() reflects the updated reading seconds
  activeTimeCache = null;

  return {
    todaySeconds: newSeconds,
    qualified: isQualified,
    justQualified,
    currentStreak,
  };
}

// -------------------------------------------------------------
// Website-Wide Active Time Tracking (Meaningful Site Engagement)
// -------------------------------------------------------------

export function getWebsiteActiveTimeData(): WebsiteActiveTimeData {
  const defaultData: WebsiteActiveTimeData = {
    totalActiveSeconds: 0,
    daily: {},
    explorationDaily: {},
    totalExplorationSeconds: 0,
    lastUpdated: Date.now(),
  };

  if (typeof window === "undefined") return defaultData;

  let explorationDaily: Record<string, number> = {};
  let totalExplorationSeconds = 0;
  let lastUpdated = Date.now();

  try {
    const raw = localStorage.getItem(ACTIVE_TIME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      lastUpdated = Number(parsed.lastUpdated) || Date.now();
      if (parsed.explorationDaily && typeof parsed.explorationDaily === "object") {
        explorationDaily = { ...parsed.explorationDaily };
        totalExplorationSeconds = Number(parsed.totalExplorationSeconds) || 0;
      } else if (parsed.daily && typeof parsed.daily === "object") {
        // Legacy storage conversion: derive exploration seconds from stored active minus reading
        const streakData = getReadingActivityData();
        Object.entries(parsed.daily).forEach(([dKey, activeSecs]) => {
          const readSecs = streakData.daily[dKey]?.seconds || 0;
          const expl = Math.max(0, Number(activeSecs) - readSecs);
          if (expl > 0) explorationDaily[dKey] = expl;
        });
        totalExplorationSeconds = Object.values(explorationDaily).reduce((a, b) => a + b, 0);
      }
    }
  } catch (e) {
    console.warn("[ReaderStorage] Error reading website active time:", e);
  }

  // Calculate Total & Daily Active Time dynamically:
  // ACTIVE TIME = READING TIME + WEBSITE EXPLORATION TIME
  const streakData = getReadingActivityData();
  let totalReadingSecs = 0;
  const activeDaily: Record<string, number> = {};

  // Include all days with reading
  Object.entries(streakData.daily || {}).forEach(([dKey, dVal]) => {
    const rSecs = dVal?.seconds || 0;
    totalReadingSecs += rSecs;
    const explSecs = explorationDaily[dKey] || 0;
    activeDaily[dKey] = rSecs + explSecs;
  });

  // Include days with exploration but no reading
  Object.entries(explorationDaily).forEach(([dKey, explSecs]) => {
    if (activeDaily[dKey] === undefined) {
      activeDaily[dKey] = explSecs;
    }
  });

  const totalActiveSecs = totalReadingSecs + totalExplorationSeconds;

  const data: WebsiteActiveTimeData = {
    totalActiveSeconds: totalActiveSecs,
    daily: activeDaily,
    explorationDaily,
    totalExplorationSeconds,
    lastUpdated,
  };

  activeTimeCache = data;
  return data;
}

export function addWebsiteActiveSeconds(secondsToAdd: number): {
  totalActiveSeconds: number;
  todayActiveSeconds: number;
} {
  if (typeof window === "undefined" || secondsToAdd <= 0) {
    const current = getWebsiteActiveTimeData();
    const todayKey = getLocalDateKey();
    return {
      totalActiveSeconds: current.totalActiveSeconds,
      todayActiveSeconds: current.daily[todayKey] || 0,
    };
  }

  const current = getWebsiteActiveTimeData();
  const todayKey = getLocalDateKey();

  const explorationDaily = { ...(current.explorationDaily || {}) };
  const currentTodayExpl = explorationDaily[todayKey] || 0;
  const newTodayExpl = currentTodayExpl + secondsToAdd;
  explorationDaily[todayKey] = newTodayExpl;

  const newTotalExpl = (current.totalExplorationSeconds || 0) + secondsToAdd;

  const streakData = getReadingActivityData();
  const todayReading = streakData.daily[todayKey]?.seconds || 0;
  let totalReading = 0;
  Object.values(streakData.daily || {}).forEach((d) => {
    totalReading += d.seconds || 0;
  });

  const newTodayActive = todayReading + newTodayExpl;
  const newTotalActive = totalReading + newTotalExpl;

  const activeDaily = { ...(current.daily || {}) };
  activeDaily[todayKey] = newTodayActive;

  const updatedData: WebsiteActiveTimeData = {
    totalActiveSeconds: newTotalActive,
    daily: activeDaily,
    explorationDaily,
    totalExplorationSeconds: newTotalExpl,
    lastUpdated: Date.now(),
  };

  activeTimeCache = updatedData;

  try {
    localStorage.setItem(ACTIVE_TIME_KEY, JSON.stringify(updatedData));
  } catch (e) {
    console.warn("[ReaderStorage] Error saving website active time:", e);
  }

  return {
    totalActiveSeconds: newTotalActive,
    todayActiveSeconds: newTodayActive,
  };
}

// -------------------------------------------------------------
// My Reading Memory Storage & Timeline
// -------------------------------------------------------------

export function getBookReadingMemory(bookId: string): BookReadingMemory {
  if (memoryCache.has(bookId)) {
    return memoryCache.get(bookId)!;
  }

  const defaultMemory: BookReadingMemory = {
    bookId,
    totalSeconds: 0,
    sessionsCount: 0,
    firstReadAt: Date.now(),
    lastReadAt: Date.now(),
    timeline: [],
  };

  if (typeof window === "undefined" || !bookId) return defaultMemory;

  try {
    const raw = localStorage.getItem(`${MEMORY_KEY_PREFIX}:${bookId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const mem = {
        bookId,
        totalSeconds: parsed.totalSeconds || 0,
        sessionsCount: parsed.sessionsCount || (parsed.timeline ? parsed.timeline.length : 0),
        firstReadAt: parsed.firstReadAt || Date.now(),
        lastReadAt: parsed.lastReadAt || Date.now(),
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      };
      memoryCache.set(bookId, mem);
      return mem;
    }
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to read memory for ${bookId}:`, e);
  }

  memoryCache.set(bookId, defaultMemory);
  return defaultMemory;
}

export function addBookReadingSeconds(
  bookId: string,
  secondsToAdd: number,
  startPage?: number,
  endPage?: number
): BookReadingMemory {
  const mem = getBookReadingMemory(bookId);
  if (typeof window === "undefined" || !bookId || secondsToAdd <= 0) return mem;

  try {
    mem.totalSeconds += secondsToAdd;
    mem.lastReadAt = Date.now();
    if (!mem.firstReadAt) {
      mem.firstReadAt = Date.now();
    }

    memoryCache.set(bookId, mem);
    localStorage.setItem(`${MEMORY_KEY_PREFIX}:${bookId}`, JSON.stringify(mem));
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to add reading seconds for ${bookId}:`, e);
  }

  return mem;
}

export function recordReadingMemorySession(event: Omit<ReadingTimelineEvent, "id">): void {
  if (typeof window === "undefined" || !event.bookId) return;

  try {
    const mem = getBookReadingMemory(event.bookId);
    const newEvent: ReadingTimelineEvent = {
      ...event,
      id: `mem_ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    mem.totalSeconds += event.durationSeconds;
    mem.sessionsCount += 1;
    mem.lastReadAt = event.timestamp;
    if (!mem.firstReadAt || mem.firstReadAt > event.timestamp) {
      mem.firstReadAt = event.timestamp;
    }

    // Keep up to 50 recent session events per book
    mem.timeline = [newEvent, ...mem.timeline].slice(0, 50);

    memoryCache.set(event.bookId, mem);
    localStorage.setItem(`${MEMORY_KEY_PREFIX}:${event.bookId}`, JSON.stringify(mem));
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to record memory session:`, e);
  }
}

export function getAllReadingMemories(): Record<string, BookReadingMemory> {
  const result: Record<string, BookReadingMemory> = {};
  if (typeof window === "undefined") return result;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MEMORY_KEY_PREFIX)) {
        const bookId = key.replace(`${MEMORY_KEY_PREFIX}:`, "");
        result[bookId] = getBookReadingMemory(bookId);
      }
    }
  } catch (e) {
    console.warn("[ReaderStorage] Error retrieving all reading memories:", e);
  }

  return result;
}

// -------------------------------------------------------------
// Offline Book Caching (Cache API)
// -------------------------------------------------------------

export async function isBookOffline(bookId: string, pdfUrl: string): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window) || !pdfUrl) return false;
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const match = await cache.match(pdfUrl);
    return Boolean(match);
  } catch {
    return false;
  }
}

export async function cacheBookOffline(bookId: string, pdfUrl: string): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window) || !pdfUrl) return false;
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const response = await fetch(pdfUrl, { mode: "cors" });
    if (response.ok) {
      await cache.put(pdfUrl, response);
      return true;
    }
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to cache book offline:`, e);
  }
  return false;
}

export async function removeBookOffline(bookId: string, pdfUrl: string): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window) || !pdfUrl) return false;
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    return await cache.delete(pdfUrl);
  } catch {
    return false;
  }
}

export async function getOfflineBooksList(): Promise<string[]> {
  if (typeof window === "undefined" || !("caches" in window)) return [];
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const requests = await cache.keys();
    return requests.map((req) => req.url);
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// Reading Progress Storage
// -------------------------------------------------------------

export function getSavedProgress(bookId: string): ReadingProgressData | null {
  if (progressCache.has(bookId)) {
    return progressCache.get(bookId)!;
  }

  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PROGRESS_KEY_PREFIX}:${bookId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      progressCache.set(bookId, parsed);
      return parsed;
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
    progressCache.set(bookId, data);
    localStorage.setItem(`${PROGRESS_KEY_PREFIX}:${bookId}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to save progress for ${bookId}:`, e);
  }
}

// -------------------------------------------------------------
// Bookmarks Storage
// -------------------------------------------------------------

export function getBookmarks(bookId: string): BookmarkItem[] {
  if (bookmarksCache.has(bookId)) {
    return bookmarksCache.get(bookId)!;
  }

  if (typeof window === "undefined" || !bookId) return [];
  try {
    const raw = localStorage.getItem(`${BOOKMARKS_KEY_PREFIX}:${bookId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      bookmarksCache.set(bookId, parsed);
      return parsed;
    }
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to read bookmarks for ${bookId}:`, e);
  }
  bookmarksCache.set(bookId, []);
  return [];
}

export function saveBookmark(bookId: string, page: number, label?: string): BookmarkItem {
  const current = getBookmarks(bookId);
  const existing = current.find((b) => b.page === page);
  if (existing) {
    if (label !== undefined) {
      existing.label = label;
      bookmarksCache.set(bookId, current);
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
  bookmarksCache.set(bookId, updated);
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
  bookmarksCache.set(bookId, updated);
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
  if (annotationsCache.has(bookId)) {
    return annotationsCache.get(bookId)!;
  }

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
      const res: BookAnnotations = {
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        drawings: parsed.drawings && typeof parsed.drawings === "object" ? parsed.drawings : {},
        bookmarks: bms,
      };
      annotationsCache.set(bookId, res);
      return res;
    }
    const res = { ...defaultVal, bookmarks: bms };
    annotationsCache.set(bookId, res);
    return res;
  } catch (e) {
    console.warn(`[ReaderStorage] Failed to read annotations for ${bookId}:`, e);
  }

  return defaultVal;
}

export function saveBookAnnotations(bookId: string, annotations: BookAnnotations): void {
  if (typeof window === "undefined" || !bookId) return;
  annotationsCache.set(bookId, annotations);
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
  const streakData = getReadingActivityData();
  const todayKey = getLocalDateKey();
  const todaySeconds = streakData.daily[todayKey]?.seconds || 0;
  const isTodayQualified = Boolean(streakData.daily[todayKey]?.qualified || todaySeconds >= DAILY_READING_GOAL_SECONDS);

  // Compute total reading seconds across all recorded daily history
  let totalReadingSeconds = 0;
  Object.values(streakData.daily || {}).forEach((d) => {
    totalReadingSeconds += d.seconds || 0;
  });

  const activeTimeData = getWebsiteActiveTimeData();
  const todayActiveSeconds = Math.max(activeTimeData.daily[todayKey] || 0, todaySeconds);
  const totalActiveSeconds = Math.max(activeTimeData.totalActiveSeconds || 0, totalReadingSeconds);

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
      readingStreakDays: streakData.currentStreak,
      todayReadingSeconds: todaySeconds,
      isTodayQualified,
      totalReadingSeconds,
      totalActiveSeconds,
      todayActiveSeconds,
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
    readingStreakDays: streakData.currentStreak,
    todayReadingSeconds: todaySeconds,
    isTodayQualified,
    totalReadingSeconds,
    totalActiveSeconds,
    todayActiveSeconds,
  };
}

// -------------------------------------------------------------
// Backup / Data Export & Import (100% Client-Side JSON)
// -------------------------------------------------------------

export function exportAllUserData(): string {
  if (typeof window === "undefined") return "{}";

  const exportData: ReaderHubExportData = {
    version: "1.3.0",
    exportedAt: Date.now(),
    favorites: [],
    readingHistory: [],
    annotations: {},
    bookmarks: {},
    readingActivity: getReadingActivityData(),
    readingMemories: getAllReadingMemories(),
    activeTime: getWebsiteActiveTimeData(),
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

export function importUserData(jsonString: string): { success: boolean; message: string; importedCount?: number; skippedCount?: number } {
  if (typeof window === "undefined" || !jsonString) {
    return { success: false, message: "No data provided to import." };
  }

  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== "object") {
      return { success: false, message: "Invalid backup format. Must be a valid JSON object." };
    }

    let importedFavs = 0;
    let importedHistory = 0;
    let importedAnnotations = 0;
    let importedBookmarks = 0;
    let skipped = 0;

    // 1. Favorites
    if (Array.isArray(data.favorites)) {
      const validFavs = data.favorites.filter((f: any) => typeof f === "string");
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(validFavs));
      importedFavs = validFavs.length;
    }

    // 2. Reading History
    if (Array.isArray(data.readingHistory)) {
      const validHistory: ReadingProgressItem[] = [];
      for (const item of data.readingHistory) {
        if (item && typeof item === "object" && typeof item.bookId === "string" && typeof item.page === "number") {
          validHistory.push({
            bookId: item.bookId,
            page: item.page,
            totalPages: Number(item.totalPages) || 100,
            progress: Number(item.progress) || 0,
            lastReadAt: Number(item.lastReadAt) || Date.now(),
          });
        } else {
          skipped++;
        }
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(validHistory));
      importedHistory = validHistory.length;
    }

    // 3. Active Time
    if (data.activeTime && typeof data.activeTime === "object") {
      const actTime: WebsiteActiveTimeData = {
        totalActiveSeconds: Number(data.activeTime.totalActiveSeconds) || 0,
        daily: data.activeTime.daily && typeof data.activeTime.daily === "object" ? data.activeTime.daily : {},
        lastUpdated: Number(data.activeTime.lastUpdated) || Date.now(),
      };
      activeTimeCache = actTime;
      localStorage.setItem(ACTIVE_TIME_KEY, JSON.stringify(actTime));
    }

    // 4. Annotations
    if (data.annotations && typeof data.annotations === "object") {
      for (const [bookId, ann] of Object.entries(data.annotations)) {
        if (typeof bookId === "string" && ann && typeof ann === "object") {
          annotationsCache.set(bookId, ann as BookAnnotations);
          localStorage.setItem(`${ANNOTATIONS_KEY_PREFIX}:${bookId}`, JSON.stringify(ann));
          importedAnnotations++;
        } else {
          skipped++;
        }
      }
    }

    // 4. Bookmarks
    if (data.bookmarks && typeof data.bookmarks === "object") {
      for (const [bookId, bms] of Object.entries(data.bookmarks)) {
        if (typeof bookId === "string" && Array.isArray(bms)) {
          bookmarksCache.set(bookId, bms as BookmarkItem[]);
          localStorage.setItem(`${BOOKMARKS_KEY_PREFIX}:${bookId}`, JSON.stringify(bms));
          importedBookmarks++;
        } else {
          skipped++;
        }
      }
    }

    // 5. Streak & Reading Activity
    if (data.readingActivity && typeof data.readingActivity === "object" && data.readingActivity.daily) {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data.readingActivity));
    }

    // 6. Reading Memories
    if (data.readingMemories && typeof data.readingMemories === "object") {
      for (const [bookId, mem] of Object.entries(data.readingMemories)) {
        if (typeof bookId === "string" && mem && typeof mem === "object") {
          memoryCache.set(bookId, mem as BookReadingMemory);
          localStorage.setItem(`${MEMORY_KEY_PREFIX}:${bookId}`, JSON.stringify(mem));
        }
      }
    }

    const totalImported = importedFavs + importedHistory + importedAnnotations + importedBookmarks;
    const msg = skipped > 0
      ? `Restored ${totalImported} items successfully (${skipped} invalid records skipped).`
      : `Restored ${totalImported} items, reading streak, and annotations with zero errors!`;

    return {
      success: true,
      message: msg,
      importedCount: totalImported,
      skippedCount: skipped,
    };
  } catch (e: any) {
    return { success: false, message: `Failed to restore data: ${e?.message || "Corrupted file"}` };
  }
}

// -------------------------------------------------------------
// Granular Local Data Reset & Recovery Utilities
// -------------------------------------------------------------

export function clearReadingHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
    progressCache.clear();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PROGRESS_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn("[ReaderStorage] Failed to clear reading history:", e);
  }
}

export function clearAllAnnotations(): void {
  if (typeof window === "undefined") return;
  try {
    annotationsCache.clear();
    bookmarksCache.clear();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(ANNOTATIONS_KEY_PREFIX) || key.startsWith(BOOKMARKS_KEY_PREFIX))) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn("[ReaderStorage] Failed to clear annotations:", e);
  }
}

export function clearStreakData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch (e) {
    console.warn("[ReaderStorage] Failed to clear streak:", e);
  }
}

export async function clearAllOfflineBooks(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    await caches.delete("readershub-offline-books-v1");
  } catch (e) {
    console.warn("[ReaderStorage] Failed to delete offline cache:", e);
  }
}

export async function factoryResetAllData(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    progressCache.clear();
    annotationsCache.clear();
    bookmarksCache.clear();
    memoryCache.clear();
    activeTimeCache = null;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("readershub:") || key.startsWith("readers_hub_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    if ("caches" in window) {
      await caches.delete("readershub-offline-books-v1");
    }
  } catch (e) {
    console.warn("[ReaderStorage] Factory reset failed:", e);
  }
}
