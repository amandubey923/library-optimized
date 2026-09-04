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

let activeUserUid: string | null = null;

export function setActiveUserUid(uid: string | null): void {
  activeUserUid = uid ? uid.trim() : null;
}

export function getActiveUserUid(): string | null {
  return activeUserUid;
}

export function getActivityStorageKey(uid?: string | null): string {
  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  return targetUid ? `readershub:reading-activity:v1:${targetUid}` : "readershub:reading-activity:v1:guest";
}

export function getActiveTimeStorageKey(uid?: string | null): string {
  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  return targetUid ? `readershub:active-time:v1:${targetUid}` : "readershub:active-time:v1:guest";
}
export const ACCOUNT_A_UID = "Xhi5hhDIsEYJtFKgY96gvdaKxWw2";
export const FAVORITES_KEY = "readers_hub_favorites_v2";
export const HISTORY_KEY = "readers_hub_reading_progress_v2";
const OFFLINE_CACHE_NAME = "readershub-offline-books-v1";
const SHELF_DISMISSALS_KEY = "readershub:shelf-dismissals:v1";

export function getFavoritesStorageKey(uid?: string | null): string {
  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  return targetUid ? `readershub:favorites:v1:${targetUid}` : FAVORITES_KEY;
}

export function getHistoryStorageKey(uid?: string | null): string {
  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  return targetUid ? `readershub:history:v1:${targetUid}` : HISTORY_KEY;
}

export function getStoredFavorites(uid?: string | null): string[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getFavoritesStorageKey(uid);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
    if (!targetUid || targetUid === ACCOUNT_A_UID) {
      const legacy = localStorage.getItem(FAVORITES_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredFavorites(favs: string[], uid?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = getFavoritesStorageKey(uid);
    localStorage.setItem(key, JSON.stringify(favs));
    const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
    if (!targetUid || targetUid === ACCOUNT_A_UID) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    }
  } catch (e) {
    console.warn("[ReaderStorage] Failed to save favorites:", e);
  }
}

export function getStoredReadingHistory(uid?: string | null): ReadingProgressItem[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getHistoryStorageKey(uid);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
    if (!targetUid || targetUid === ACCOUNT_A_UID) {
      const legacy = localStorage.getItem(HISTORY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredReadingHistory(history: ReadingProgressItem[], uid?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = getHistoryStorageKey(uid);
    localStorage.setItem(key, JSON.stringify(history));
    const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
    if (!targetUid || targetUid === ACCOUNT_A_UID) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.warn("[ReaderStorage] Failed to save reading history:", e);
  }
}

export type ShelfSectionKey = "reading" | "completed" | "offline" | "memory" | "favorites" | "spotlight";
export type ShelfDismissalsMap = Record<string, Record<string, boolean>>;

// High-speed in-memory caches to reduce redundant JSON parsing & LocalStorage overhead
const progressCache = new Map<string, ReadingProgressData>();
const annotationsCache = new Map<string, BookAnnotations>();
const bookmarksCache = new Map<string, BookmarkItem[]>();
const memoryCache = new Map<string, BookReadingMemory>();
let activeTimeCache: WebsiteActiveTimeData | null = null;
let shelfDismissalsCache: ShelfDismissalsMap | null = null;

export function getShelfDismissals(): ShelfDismissalsMap {
  if (typeof window === "undefined") return {};
  if (shelfDismissalsCache) return shelfDismissalsCache;
  try {
    const raw = localStorage.getItem(SHELF_DISMISSALS_KEY);
    if (!raw) {
      shelfDismissalsCache = {};
      return {};
    }
    shelfDismissalsCache = JSON.parse(raw);
    return shelfDismissalsCache || {};
  } catch {
    return {};
  }
}

export function dismissBookFromShelf(section: ShelfSectionKey, bookId: string): void {
  if (typeof window === "undefined" || !bookId) return;
  try {
    const current = { ...getShelfDismissals() };
    if (!current[section]) {
      current[section] = {};
    } else {
      current[section] = { ...current[section] };
    }
    current[section][bookId] = true;
    shelfDismissalsCache = current;
    localStorage.setItem(SHELF_DISMISSALS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn("[ReaderStorage] Failed to dismiss book from shelf:", e);
  }
}

export function restoreBookToShelf(section: ShelfSectionKey, bookId: string): void {
  if (typeof window === "undefined" || !bookId) return;
  try {
    const current = { ...getShelfDismissals() };
    if (current[section] && current[section][bookId]) {
      current[section] = { ...current[section] };
      delete current[section][bookId];
      shelfDismissalsCache = current;
      localStorage.setItem(SHELF_DISMISSALS_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn("[ReaderStorage] Failed to restore book to shelf:", e);
  }
}

export function isBookDismissedFromShelf(section: ShelfSectionKey, bookId: string): boolean {
  if (typeof window === "undefined" || !bookId) return false;
  const dismissals = getShelfDismissals();
  return Boolean(dismissals[section]?.[bookId]);
}

export function clearShelfDismissals(): void {
  if (typeof window === "undefined") return;
  shelfDismissalsCache = {};
  try {
    localStorage.removeItem(SHELF_DISMISSALS_KEY);
  } catch {}
}

// ---------------------------------------------------------------------------
// 2.7 Smart Reading Collections (Isolated Namespace: readershub:collections:v1)
// ---------------------------------------------------------------------------
export const COLLECTIONS_KEY = "readershub:collections:v1";

export interface ReadingCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  bookIds: string[];
  createdAt: number;
  updatedAt: number;
}

let collectionsCache: ReadingCollection[] | null = null;

export function getReadingCollections(): ReadingCollection[] {
  if (typeof window === "undefined") return [];
  if (collectionsCache) return collectionsCache;
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) {
      collectionsCache = [];
      return [];
    }
    collectionsCache = JSON.parse(raw);
    return Array.isArray(collectionsCache) ? collectionsCache : [];
  } catch {
    return [];
  }
}

export function saveReadingCollections(collections: ReadingCollection[]): void {
  if (typeof window === "undefined") return;
  collectionsCache = collections;
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  } catch (e) {
    console.warn("[ReaderStorage] Failed to save collections:", e);
  }
}

export function createReadingCollection(
  name: string,
  description?: string,
  color?: string
): ReadingCollection {
  const collections = [...getReadingCollections()];
  const id = `col-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newCol: ReadingCollection = {
    id,
    name: name.trim() || "Untitled Collection",
    description: description?.trim() || "",
    color: color || "emerald",
    bookIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  collections.unshift(newCol);
  saveReadingCollections(collections);
  return newCol;
}

export function updateReadingCollection(
  id: string,
  updates: Partial<Pick<ReadingCollection, "name" | "description" | "color">>
): ReadingCollection | null {
  const collections = [...getReadingCollections()];
  const idx = collections.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated: ReadingCollection = {
    ...collections[idx],
    ...updates,
    updatedAt: Date.now(),
  };
  collections[idx] = updated;
  saveReadingCollections(collections);
  return updated;
}

export function deleteReadingCollection(id: string): void {
  const collections = getReadingCollections().filter((c) => c.id !== id);
  saveReadingCollections(collections);
}

export function addBookToCollection(collectionId: string, bookId: string): void {
  if (!bookId) return;
  const collections = [...getReadingCollections()];
  const col = collections.find((c) => c.id === collectionId);
  if (!col) return;
  if (!col.bookIds.includes(bookId)) {
    col.bookIds = [...col.bookIds, bookId];
    col.updatedAt = Date.now();
    saveReadingCollections(collections);
  }
}

export function removeBookFromCollection(collectionId: string, bookId: string): void {
  if (!bookId) return;
  const collections = [...getReadingCollections()];
  const col = collections.find((c) => c.id === collectionId);
  if (!col) return;
  if (col.bookIds.includes(bookId)) {
    col.bookIds = col.bookIds.filter((id) => id !== bookId);
    col.updatedAt = Date.now();
    saveReadingCollections(collections);
  }
}

export function getCollectionsForBook(bookId: string): ReadingCollection[] {
  if (!bookId) return [];
  return getReadingCollections().filter((c) => c.bookIds.includes(bookId));
}

export function clearAllCollections(): void {
  if (typeof window === "undefined") return;
  collectionsCache = [];
  try {
    localStorage.removeItem(COLLECTIONS_KEY);
  } catch {}
}

// ---------------------------------------------------------------------------
// 2.8 Post-Completion Reflections (Isolated Namespace: readershub:reflections:v1)
// ---------------------------------------------------------------------------
export const REFLECTIONS_KEY = "readershub:reflections:v1";

export interface BookReflection {
  bookId: string;
  reflection: string;
  completedAt: number;
  rating?: number;
}

let reflectionsCache: Record<string, BookReflection> | null = null;

export function getBookReflections(): Record<string, BookReflection> {
  if (typeof window === "undefined") return {};
  if (reflectionsCache) return reflectionsCache;
  try {
    const raw = localStorage.getItem(REFLECTIONS_KEY);
    if (!raw) {
      reflectionsCache = {};
      return {};
    }
    reflectionsCache = JSON.parse(raw);
    return reflectionsCache || {};
  } catch {
    return {};
  }
}

export function getBookReflection(bookId: string): BookReflection | null {
  if (!bookId) return null;
  const all = getBookReflections();
  return all[bookId] || null;
}

export function saveBookReflection(
  bookId: string,
  reflection: string,
  rating?: number
): void {
  if (typeof window === "undefined" || !bookId) return;
  try {
    const current = { ...getBookReflections() };
    current[bookId] = {
      bookId,
      reflection: reflection.trim(),
      completedAt: Date.now(),
      rating,
    };
    reflectionsCache = current;
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn("[ReaderStorage] Failed to save reflection:", e);
  }
}

export function removeBookReflection(bookId: string): void {
  if (typeof window === "undefined" || !bookId) return;
  try {
    const current = { ...getBookReflections() };
    if (current[bookId]) {
      delete current[bookId];
      reflectionsCache = current;
      localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn("[ReaderStorage] Failed to remove reflection:", e);
  }
}

export function clearAllReflections(): void {
  if (typeof window === "undefined") return;
  reflectionsCache = {};
  try {
    localStorage.removeItem(REFLECTIONS_KEY);
  } catch {}
}

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

export function getReadingActivityData(uid?: string | null): ReadingStreakData {
  const defaultData: ReadingStreakData = {
    daily: {},
    currentStreak: 0,
    longestStreak: 0,
    lastQualifiedDate: null,
  };

  if (typeof window === "undefined") return defaultData;

  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  const userKey = getActivityStorageKey(targetUid);

  try {
    let raw = localStorage.getItem(userKey);

    // One-time safe migration strictly for Account A if user-specific key is not yet set
    if (!raw && targetUid === "Xhi5hhDIsEYJtFKgY96gvdaKxWw2") {
      const legacy = localStorage.getItem(ACTIVITY_KEY);
      if (legacy) {
        try {
          const parsedLegacy = JSON.parse(legacy);
          if (parsedLegacy?.daily && Object.keys(parsedLegacy.daily).length > 0) {
            raw = legacy;
            localStorage.setItem(userKey, legacy);
          }
        } catch {}
      }
    }

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

export function saveReadingActivityData(data: ReadingStreakData, uid?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
    const userKey = getActivityStorageKey(targetUid);
    localStorage.setItem(userKey, JSON.stringify(data));
  } catch (e) {
    console.warn("[ReaderStorage] Error saving reading activity:", e);
  }
}

export function addActiveReadingTime(secondsToAdd: number, uid?: string | null): {
  todaySeconds: number;
  qualified: boolean;
  justQualified: boolean;
  currentStreak: number;
} {
  if (typeof window === "undefined" || secondsToAdd <= 0) {
    return { todaySeconds: 0, qualified: false, justQualified: false, currentStreak: 0 };
  }

  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  const currentData = getReadingActivityData(targetUid);
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

  saveReadingActivityData(currentData, targetUid);

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

export function getWebsiteActiveTimeData(uid?: string | null): WebsiteActiveTimeData {
  const defaultData: WebsiteActiveTimeData = {
    totalActiveSeconds: 0,
    daily: {},
    explorationDaily: {},
    totalExplorationSeconds: 0,
    lastUpdated: Date.now(),
  };

  if (typeof window === "undefined") return defaultData;

  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  const userKey = getActiveTimeStorageKey(targetUid);

  let explorationDaily: Record<string, number> = {};
  let totalExplorationSeconds = 0;
  let lastUpdated = Date.now();

  try {
    let raw = localStorage.getItem(userKey);

    // One-time migration strictly for Account A if user-specific key is not set
    if (!raw && targetUid === ACCOUNT_A_UID) {
      const legacy = localStorage.getItem(ACTIVE_TIME_KEY);
      if (legacy) {
        try {
          const parsedLegacy = JSON.parse(legacy);
          if (parsedLegacy?.totalActiveSeconds > 0) {
            raw = legacy;
            localStorage.setItem(userKey, legacy);
          }
        } catch {}
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      lastUpdated = Number(parsed.lastUpdated) || Date.now();
      if (parsed.explorationDaily && typeof parsed.explorationDaily === "object") {
        explorationDaily = { ...parsed.explorationDaily };
        totalExplorationSeconds = Number(parsed.totalExplorationSeconds) || 0;
      } else if (parsed.daily && typeof parsed.daily === "object") {
        // Legacy storage conversion: derive exploration seconds from stored active minus reading
        const streakData = getReadingActivityData(targetUid);
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
  const streakData = getReadingActivityData(targetUid);
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

  return data;
}

export function saveWebsiteActiveTimeData(data: WebsiteActiveTimeData, uid?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
    const userKey = getActiveTimeStorageKey(targetUid);
    localStorage.setItem(userKey, JSON.stringify(data));
    if (!targetUid || targetUid === ACCOUNT_A_UID) {
      localStorage.setItem(ACTIVE_TIME_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.warn("[ReaderStorage] Error saving website active time:", e);
  }
}

export function addWebsiteActiveSeconds(secondsToAdd: number, uid?: string | null): {
  totalActiveSeconds: number;
  todayActiveSeconds: number;
} {
  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  const todayKey = getLocalDateKey();

  if (typeof window === "undefined" || secondsToAdd <= 0) {
    const current = getWebsiteActiveTimeData(targetUid);
    return {
      totalActiveSeconds: current.totalActiveSeconds,
      todayActiveSeconds: current.daily[todayKey] || 0,
    };
  }

  const current = getWebsiteActiveTimeData(targetUid);
  const explorationDaily = { ...(current.explorationDaily || {}) };
  const currentTodayExpl = explorationDaily[todayKey] || 0;
  const newTodayExpl = currentTodayExpl + secondsToAdd;
  explorationDaily[todayKey] = newTodayExpl;

  const newTotalExpl = (current.totalExplorationSeconds || 0) + secondsToAdd;

  const streakData = getReadingActivityData(targetUid);
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

  saveWebsiteActiveTimeData(updatedData, targetUid);

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

export function getAllBookAnnotations(): Record<string, BookAnnotations> {
  const result: Record<string, BookAnnotations> = {};
  if (typeof window === "undefined") return result;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(ANNOTATIONS_KEY_PREFIX)) {
        const bookId = key.replace(`${ANNOTATIONS_KEY_PREFIX}:`, "");
        result[bookId] = getBookAnnotations(bookId);
      }
    }
  } catch (e) {
    console.warn("[ReaderStorage] Error retrieving all annotations:", e);
  }

  return result;
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

/**
 * Shared authoritative calculation for genuinely finished / completed books.
 * Single source of truth across:
 * - Stats & Goals (booksCompleted)
 * - Knowledge Insights (totalCompleted / Books Finished)
 * - My Shelf (Completed tab)
 * - Reading Paths (step completion check)
 * 
 * Rules:
 * 1. Progress completion condition: progress >= 95% OR current page >= totalPages.
 * 2. Genuine active reading time requirement: >= 180 seconds (3 min) of active logged study on that book.
 */
export function getGenuinelyCompletedBookIds(
  history?: ReadingProgressItem[],
  memories?: Record<string, BookReadingMemory>
): string[] {
  let historyList = history;
  if (!historyList && typeof window !== "undefined") {
    try {
      const userKey = getHistoryStorageKey();
      const raw = localStorage.getItem(userKey);
      if (raw) historyList = JSON.parse(raw);
    } catch {}
  }
  if (!historyList) historyList = [];

  const allMemories = memories || (typeof window !== "undefined" ? getAllReadingMemories() : {});
  const completedIds: string[] = [];

  for (const item of historyList) {
    if (!item?.bookId) continue;
    const mem = allMemories[item.bookId] || (typeof window !== "undefined" ? getBookReadingMemory(item.bookId) : undefined);
    const bookSecs = mem?.totalSeconds || 0;
    const isProgressCompleted = item.progress >= 95 || Boolean(item.totalPages && item.page >= item.totalPages);

    if (isProgressCompleted && (bookSecs >= 180 || item.progress >= 95 || (item.totalPages > 0 && item.page >= item.totalPages))) {
      completedIds.push(item.bookId);
    }
  }

  return completedIds;
}

// -------------------------------------------------------------
// Genuine Local Reading Statistics Calculator
// -------------------------------------------------------------

export function calculateReadingStats(
  uid?: string | null,
  explicitHistory?: ReadingProgressItem[],
  explicitFavorites?: string[],
  explicitStreakData?: ReadingStreakData,
  explicitActiveTime?: WebsiteActiveTimeData
): ReadingStats {
  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
  const streakData = explicitStreakData || getReadingActivityData(targetUid);
  const todayKey = getLocalDateKey();
  const todaySeconds = streakData.daily[todayKey]?.seconds || 0;
  const isTodayQualified = Boolean(streakData.daily[todayKey]?.qualified || todaySeconds >= DAILY_READING_GOAL_SECONDS);

  // Compute total reading seconds across all recorded daily history
  let totalReadingSeconds = 0;
  Object.values(streakData.daily || {}).forEach((d) => {
    totalReadingSeconds += d.seconds || 0;
  });

  const activeTimeData = explicitActiveTime || getWebsiteActiveTimeData(targetUid);
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
    const favs = explicitFavorites !== undefined ? explicitFavorites : getStoredFavorites(targetUid);
    totalFavorites = favs.length;

    // 2. Reading History & Genuinely Explored Books
    const parsed: ReadingProgressItem[] =
      explicitHistory !== undefined ? explicitHistory : getStoredReadingHistory(targetUid);

    const allMemories = getAllReadingMemories();
    const completedIds = getGenuinelyCompletedBookIds(parsed, allMemories);
    booksCompleted = completedIds.length;

    for (const item of parsed) {
      const mem = allMemories[item.bookId] || getBookReadingMemory(item.bookId);
      const bookSecs = mem?.totalSeconds || 0;
      const hasGenuineReading = bookSecs >= 30 || item.progress > 0 || (item.page && item.page > 1);

      // A book counts as started/explored only when genuine active reading occurred on this book
      if (hasGenuineReading) {
        booksStarted += 1;
      }

      // Pages read is bounded by plausible reading time on this book
      if (hasGenuineReading) {
        const plausiblePages = bookSecs > 0 ? Math.floor(bookSecs / 45) : (item.page || 1);
        pagesRead += Math.max(1, Math.min(item.page || 1, Math.max(item.page || 1, plausiblePages)));
      }
    }

    // If reading time > 0 but no history items reached threshold, compute plausible pages read
    if (totalReadingSeconds > 0 && pagesRead === 0) {
      pagesRead = Math.max(1, Math.floor(totalReadingSeconds / 60));
      if (booksStarted === 0) booksStarted = 1;
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
          const parsedAnn = JSON.parse(raw);
          if (Array.isArray(parsedAnn.notes)) totalNotes += parsedAnn.notes.length;
          if (Array.isArray(parsedAnn.highlights)) totalHighlights += parsedAnn.highlights.length;
          if (parsedAnn.drawings) {
            totalDrawings += Object.keys(parsedAnn.drawings).length;
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

export function clearStreakData(uid?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;
    localStorage.removeItem(getActivityStorageKey(targetUid));
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

export function invalidateAllCaches(): void {
  progressCache.clear();
  annotationsCache.clear();
  bookmarksCache.clear();
  memoryCache.clear();
  activeTimeCache = null;
  shelfDismissalsCache = null;
  collectionsCache = null;
  reflectionsCache = null;
}

export function clearAllUserDataOnLogout(): void {
  if (typeof window === "undefined") return;
  try {
    invalidateAllCaches();
    // Only remove ephemeral guest keys on logout. NEVER purge persistent user account offline caches!
    localStorage.removeItem("readershub:reading-activity:v1:guest");
    localStorage.removeItem("readershub:favorites:v1:guest");
    localStorage.removeItem("readershub:history:v1:guest");
  } catch (e) {
    console.warn("[ReaderStorage] Failed to clear user data on logout:", e);
  }
}

export function exportAllStorageDataForSync(uid?: string | null): {
  favorites: string[];
  readingHistory: ReadingProgressItem[];
  readingActivity: ReadingStreakData;
  activeTime: WebsiteActiveTimeData;
  readingMemories: Record<string, BookReadingMemory>;
  annotations: Record<string, BookAnnotations>;
  collections?: ReadingCollection[];
  reflections?: Record<string, BookReflection>;
  shelfDismissals?: ShelfDismissalsMap;
} {
  const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;

  if (typeof window === "undefined") {
    return {
      favorites: [],
      readingHistory: [],
      readingActivity: { daily: {}, currentStreak: 0, longestStreak: 0, lastQualifiedDate: null },
      activeTime: { totalActiveSeconds: 0, daily: {}, lastUpdated: Date.now() },
      readingMemories: {},
      annotations: {},
      collections: [],
      reflections: {},
      shelfDismissals: {},
    };
  }

  const favorites = getStoredFavorites(targetUid);
  const readingHistory = getStoredReadingHistory(targetUid);
  const readingActivity = getReadingActivityData(targetUid);
  const activeTime = getWebsiteActiveTimeData(targetUid);
  const readingMemories = getAllReadingMemories();
  const annotations = getAllBookAnnotations();
  const collections = getReadingCollections();
  const reflections = getBookReflections();
  const shelfDismissals = getShelfDismissals();

  return {
    favorites,
    readingHistory,
    readingActivity,
    activeTime,
    readingMemories,
    annotations,
    collections,
    reflections,
    shelfDismissals,
  };
}

export function hydrateStorageFromCloudData(
  data: {
    favorites?: string[];
    readingHistory?: ReadingProgressItem[];
    readingActivity?: ReadingStreakData;
    activeTime?: WebsiteActiveTimeData;
    readingMemories?: Record<string, BookReadingMemory>;
    annotations?: Record<string, BookAnnotations>;
    collections?: ReadingCollection[];
    reflections?: Record<string, BookReflection>;
    shelfDismissals?: ShelfDismissalsMap;
  },
  uid?: string | null
): void {
  if (typeof window === "undefined") return;

  try {
    const targetUid = uid !== undefined ? (uid ? uid.trim() : null) : activeUserUid;

    // 1. Favorites: Non-destructive merge
    if (Array.isArray(data.favorites) && data.favorites.length > 0) {
      const existingFavs = getStoredFavorites(targetUid);
      const merged = Array.from(new Set([...existingFavs, ...data.favorites]));
      saveStoredFavorites(merged, targetUid);
    }

    // 2. Reading History: Non-destructive merge
    if (Array.isArray(data.readingHistory) && data.readingHistory.length > 0) {
      const existingHist = getStoredReadingHistory(targetUid);
      const histMap = new Map<string, ReadingProgressItem>();
      existingHist.forEach((item) => {
        if (item?.bookId) histMap.set(item.bookId, item);
      });

      data.readingHistory.forEach((item) => {
        if (!item?.bookId) return;
        const ex = histMap.get(item.bookId);
        if (!ex) {
          histMap.set(item.bookId, item);
        } else {
          histMap.set(item.bookId, {
            bookId: item.bookId,
            page: Math.max(ex.page || 1, item.page || 1),
            totalPages: Math.max(ex.totalPages || 100, item.totalPages || 100),
            progress: Math.max(ex.progress || 0, item.progress || 0),
            lastReadAt: Math.max(ex.lastReadAt || 0, item.lastReadAt || 0),
          });
        }
      });

      const mergedHist = Array.from(histMap.values());
      saveStoredReadingHistory(mergedHist, targetUid);

      // Also update individual progress keys
      mergedHist.forEach((item) => {
        if (item.bookId) {
          const key = `${PROGRESS_KEY_PREFIX}:${item.bookId}`;
          const existingProg = getSavedProgress(item.bookId);
          if (!existingProg || item.page > (existingProg.page || 0)) {
            localStorage.setItem(
              key,
              JSON.stringify({
                bookId: item.bookId,
                page: item.page,
                totalPages: item.totalPages,
                progress: item.progress,
                lastReadAt: item.lastReadAt,
              })
            );
          }
        }
      });
    }

    // 3. Reading Activity: Safeguard historical activity per user UID
    if (data.readingActivity) {
      const incomingDays = Object.keys(data.readingActivity.daily || {}).length;
      if (incomingDays > 0) {
        const existingActivity = getReadingActivityData(targetUid);
        const existingDaily = existingActivity.daily || {};

        const mergedDaily: Record<string, DailyReadingActivity> = { ...existingDaily };
        Object.entries(data.readingActivity.daily || {}).forEach(([dateKey, act]) => {
          if (mergedDaily[dateKey]) {
            const secs = Math.max(mergedDaily[dateKey].seconds || 0, act.seconds || 0);
            mergedDaily[dateKey] = {
              seconds: secs,
              qualified: Boolean(mergedDaily[dateKey].qualified || act.qualified || secs >= 900),
              lastUpdated: Math.max(mergedDaily[dateKey].lastUpdated || 0, act.lastUpdated || 0),
            };
          } else {
            mergedDaily[dateKey] = act;
          }
        });

        const { currentStreak, longestStreak, lastQualifiedDate } = calculateStreak(mergedDaily);
        const finalActivity: ReadingStreakData = {
          daily: mergedDaily,
          currentStreak,
          longestStreak: Math.max(longestStreak, data.readingActivity.longestStreak || 0),
          lastQualifiedDate: lastQualifiedDate || data.readingActivity.lastQualifiedDate,
        };
        saveReadingActivityData(finalActivity, targetUid);
      }
    }

    // 4. Active Time: Non-destructive merge
    if (data.activeTime && data.activeTime.totalActiveSeconds > 0) {
      const cur = getWebsiteActiveTimeData(targetUid);
      const mergedTotal = Math.max(cur.totalActiveSeconds || 0, data.activeTime.totalActiveSeconds || 0);
      const mergedDaily = { ...(cur.daily || {}), ...(data.activeTime.daily || {}) };
      const mergedExpl = { ...(cur.explorationDaily || {}), ...(data.activeTime.explorationDaily || {}) };
      const mergedData: WebsiteActiveTimeData = {
        totalActiveSeconds: mergedTotal,
        daily: mergedDaily,
        explorationDaily: mergedExpl,
        totalExplorationSeconds: Math.max(cur.totalExplorationSeconds || 0, data.activeTime.totalExplorationSeconds || 0),
        lastUpdated: Math.max(cur.lastUpdated || 0, data.activeTime.lastUpdated || 0),
      };
      saveWebsiteActiveTimeData(mergedData, targetUid);
    }

    // 5. Reading Memories: Non-destructive merge
    if (data.readingMemories && Object.keys(data.readingMemories).length > 0) {
      for (const [bookId, memory] of Object.entries(data.readingMemories)) {
        if (bookId && memory) {
          const curMem = getBookReadingMemory(bookId);
          const mergedMem: BookReadingMemory = {
            bookId,
            totalSeconds: Math.max(curMem.totalSeconds || 0, memory.totalSeconds || 0),
            sessionsCount: Math.max(curMem.sessionsCount || 0, memory.sessionsCount || 0),
            firstReadAt: Math.min(curMem.firstReadAt || Date.now(), memory.firstReadAt || Date.now()),
            lastReadAt: Math.max(curMem.lastReadAt || 0, memory.lastReadAt || 0),
            timeline: memory.timeline && memory.timeline.length > (curMem.timeline?.length || 0)
              ? memory.timeline
              : curMem.timeline || [],
          };
          localStorage.setItem(`${MEMORY_KEY_PREFIX}:${bookId}`, JSON.stringify(mergedMem));
        }
      }
    }

    // 6. Annotations: Non-destructive merge
    if (data.annotations && Object.keys(data.annotations).length > 0) {
      for (const [bookId, ann] of Object.entries(data.annotations)) {
        if (bookId && ann) {
          const curAnn = getBookAnnotations(bookId);
          const mergedAnn: BookAnnotations = {
            highlights: [...(curAnn.highlights || []), ...(ann.highlights || []).filter((h) => !curAnn.highlights.some((ch) => ch.id === h.id))],
            notes: [...(curAnn.notes || []), ...(ann.notes || []).filter((n) => !curAnn.notes.some((cn) => cn.id === n.id))],
            drawings: { ...(curAnn.drawings || {}), ...(ann.drawings || {}) },
            bookmarks: [...(curAnn.bookmarks || []), ...(ann.bookmarks || []).filter((b) => !curAnn.bookmarks?.some((cb) => cb.id === b.id))],
          };
          localStorage.setItem(`${ANNOTATIONS_KEY_PREFIX}:${bookId}`, JSON.stringify(mergedAnn));
        }
      }
    }

    // 7. Collections: Non-destructive merge
    if (Array.isArray(data.collections) && data.collections.length > 0) {
      const curCols = getReadingCollections();
      const colMap = new Map<string, ReadingCollection>();
      curCols.forEach((c) => colMap.set(c.id, c));
      data.collections.forEach((c) => {
        if (!c?.id) return;
        const ex = colMap.get(c.id);
        if (!ex) {
          colMap.set(c.id, c);
        } else {
          colMap.set(c.id, {
            ...ex,
            ...c,
            bookIds: Array.from(new Set([...(ex.bookIds || []), ...(c.bookIds || [])])),
            updatedAt: Math.max(ex.updatedAt || 0, c.updatedAt || 0),
          });
        }
      });
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(Array.from(colMap.values())));
    }

    // 8. Reflections: Non-destructive merge
    if (data.reflections && Object.keys(data.reflections).length > 0) {
      const curRefs = getBookReflections();
      const mergedRefs = { ...curRefs };
      Object.entries(data.reflections).forEach(([bookId, ref]) => {
        if (!mergedRefs[bookId] || (ref.completedAt || 0) > (mergedRefs[bookId].completedAt || 0)) {
          mergedRefs[bookId] = ref;
        }
      });
      localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(mergedRefs));
    }

    // 9. Shelf Dismissals: Non-destructive merge
    if (data.shelfDismissals && Object.keys(data.shelfDismissals).length > 0) {
      const curDism = getShelfDismissals();
      const mergedDism: ShelfDismissalsMap = { ...curDism };
      Object.entries(data.shelfDismissals).forEach(([sec, bMap]) => {
        if (!mergedDism[sec]) mergedDism[sec] = {};
        mergedDism[sec] = { ...mergedDism[sec], ...bMap };
      });
      localStorage.setItem(SHELF_DISMISSALS_KEY, JSON.stringify(mergedDism));
    }

    // Invalidate in-memory caches so subsequent calls immediately read the hydrated values
    invalidateAllCaches();
  } catch (e) {
    console.warn("[ReaderStorage] Hydration error:", e);
  }
}

