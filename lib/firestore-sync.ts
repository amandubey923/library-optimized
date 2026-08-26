import { User } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db, getFirebaseDb } from "./firebase";
import {
  ReadingProgressItem,
  ReadingStreakData,
  WebsiteActiveTimeData,
  BookReadingMemory,
  BookAnnotations,
  DailyReadingActivity,
  calculateStreak,
  exportAllStorageDataForSync,
  hydrateStorageFromCloudData,
} from "./reader-storage";

export interface CloudFullUserData {
  favorites: string[];
  readingHistory: ReadingProgressItem[];
  readingActivity: ReadingStreakData;
  activeTime: WebsiteActiveTimeData;
  readingMemories: Record<string, BookReadingMemory>;
  annotations: Record<string, BookAnnotations>;
}

// In-memory debounce timers for non-blocking background writes
const progressDebounceTimers: Record<string, NodeJS.Timeout> = {};
const activityDebounceTimers: Record<string, NodeJS.Timeout> = {};
const activeTimeDebounceTimers: Record<string, NodeJS.Timeout> = {};
const memoryDebounceTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Cancel and clear all pending debounced background synchronization timers.
 * Prevents stale write triggers when switching or logging out accounts.
 */
export function cancelAllPendingSyncTimers(): void {
  Object.values(progressDebounceTimers).forEach(clearTimeout);
  Object.values(activityDebounceTimers).forEach(clearTimeout);
  Object.values(activeTimeDebounceTimers).forEach(clearTimeout);
  Object.values(memoryDebounceTimers).forEach(clearTimeout);

  for (const k of Object.keys(progressDebounceTimers)) delete progressDebounceTimers[k];
  for (const k of Object.keys(activityDebounceTimers)) delete activityDebounceTimers[k];
  for (const k of Object.keys(activeTimeDebounceTimers)) delete activeTimeDebounceTimers[k];
  for (const k of Object.keys(memoryDebounceTimers)) delete memoryDebounceTimers[k];
}

/**
 * Immediately flush pending reading-activity and active-time writes to Firestore,
 * bypassing the debounce delay. Call this on pagehide / beforeunload so data is
 * not lost when the user closes the tab or switches to another browser.
 */
export async function flushPendingActivitySyncs(
  uid: string,
  activityData: ReadingStreakData,
  activeTimeData: WebsiteActiveTimeData
): Promise<void> {
  const activeDb = getFirebaseDb() || db;
  if (!activeDb || !uid) return;

  // Cancel any in-flight debounce timers for these keys so they don't double-write
  const actKey = `${uid}_activity`;
  const atKey = `${uid}_activetime`;
  if (activityDebounceTimers[actKey]) {
    clearTimeout(activityDebounceTimers[actKey]);
    delete activityDebounceTimers[actKey];
  }
  if (activeTimeDebounceTimers[atKey]) {
    clearTimeout(activeTimeDebounceTimers[atKey]);
    delete activeTimeDebounceTimers[atKey];
  }

  try {
    const actRef = doc(activeDb, "users", uid, "data", "activity");
    const atRef = doc(activeDb, "users", uid, "data", "active_time");
    // Fire both writes in parallel — do not await individually to minimise latency during unload
    await Promise.all([
      setDoc(actRef, activityData, { merge: true }),
      setDoc(atRef, activeTimeData, { merge: true }),
    ]);
  } catch (err) {
    console.warn("[Firestore] flushPendingActivitySyncs failed:", err);
  }
}

/**
 * Synchronize user profile info to Firestore (/users/{uid})
 */
export async function syncUserProfile(user: User): Promise<void> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !user) return;
  try {
    const userRef = doc(currentDb, "users", user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[Firestore] Failed to sync user profile:", err);
  }
}

/**
 * Fetch all cloud data for a user across all subcollections and telemetry documents
 */
export async function fetchFullCloudUserData(uid: string): Promise<CloudFullUserData> {
  const defaultResult: CloudFullUserData = {
    favorites: [],
    readingHistory: [],
    readingActivity: { daily: {}, currentStreak: 0, longestStreak: 0, lastQualifiedDate: null },
    activeTime: { totalActiveSeconds: 0, daily: {}, lastUpdated: Date.now() },
    readingMemories: {},
    annotations: {},
  };

  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid) return defaultResult;

  try {
    // 1. Fetch Cloud Favorites
    const favsRef = collection(currentDb, "users", uid, "favorites");
    const favsSnap = await getDocs(favsRef);
    favsSnap.forEach((d) => {
      if (d.id) defaultResult.favorites.push(d.id);
    });

    // 2. Fetch Cloud Reading Progress
    const progRef = collection(currentDb, "users", uid, "reading_progress");
    const progSnap = await getDocs(progRef);
    progSnap.forEach((d) => {
      const data = d.data();
      if (data && typeof data.page === "number") {
        defaultResult.readingHistory.push({
          bookId: d.id,
          page: data.page,
          totalPages: data.totalPages || 100,
          progress: data.progress || Math.round((data.page / (data.totalPages || 100)) * 100),
          lastReadAt: data.lastReadAt?.toMillis ? data.lastReadAt.toMillis() : Date.now(),
        });
      }
    });

    // 3. Fetch Cloud Reading Activity & Streaks
    const activityDocRef = doc(currentDb, "users", uid, "data", "activity");
    const activityDocSnap = await getDoc(activityDocRef);
    if (activityDocSnap.exists()) {
      const actData = activityDocSnap.data();
      if (actData && actData.daily) {
        defaultResult.readingActivity = {
          daily: actData.daily,
          currentStreak: actData.currentStreak || 0,
          longestStreak: actData.longestStreak || 0,
          lastQualifiedDate: actData.lastQualifiedDate || null,
        };
      }
    }

    // 4. Fetch Cloud Website Active Time
    const activeTimeDocRef = doc(currentDb, "users", uid, "data", "active_time");
    const activeTimeDocSnap = await getDoc(activeTimeDocRef);
    if (activeTimeDocSnap.exists()) {
      const atData = activeTimeDocSnap.data();
      if (atData) {
        defaultResult.activeTime = {
          totalActiveSeconds: atData.totalActiveSeconds || 0,
          daily: atData.daily || {},
          lastUpdated: atData.lastUpdated || Date.now(),
        };
      }
    }

    // 5. Fetch Cloud Reading Memories
    const memoryDocRef = doc(currentDb, "users", uid, "data", "reading_memory");
    const memoryDocSnap = await getDoc(memoryDocRef);
    if (memoryDocSnap.exists()) {
      const memData = memoryDocSnap.data();
      if (memData && memData.memories) {
        defaultResult.readingMemories = memData.memories;
      }
    }

    // 6. Fetch Cloud Annotations
    const annDocRef = doc(currentDb, "users", uid, "data", "annotations");
    const annDocSnap = await getDoc(annDocRef);
    if (annDocSnap.exists()) {
      const annData = annDocSnap.data();
      if (annData && annData.annotations) {
        defaultResult.annotations = annData.annotations;
      }
    }
  } catch (err) {
    console.warn("[Firestore] Error fetching full cloud user data:", err);
  }

  return defaultResult;
}

/**
 * Load Authoritative Cloud User Data directly from Firestore (/users/{uid}/*)
 * Guarantees that the authenticated user receives 100% pure cloud data from Firestore,
 * preventing any pollution from browser-local or previous account storage.
 */
export async function reconcileAndSyncAllUserData(user: User): Promise<CloudFullUserData> {
  const currentDb = getFirebaseDb() || db;
  const defaultEmpty: CloudFullUserData = {
    favorites: [],
    readingHistory: [],
    readingActivity: { daily: {}, currentStreak: 0, longestStreak: 0, lastQualifiedDate: null },
    activeTime: { totalActiveSeconds: 0, daily: {}, lastUpdated: Date.now() },
    readingMemories: {},
    annotations: {},
  };

  if (!currentDb || !user) {
    return defaultEmpty;
  }

  try {
    // 1. Sync User Profile metadata document
    await syncUserProfile(user);

    // 2. Fetch Authoritative Cloud Data for this UID
    const cloudData = await fetchFullCloudUserData(user.uid);

    // 3. Hydrate local in-memory storage caches with authoritative cloud state
    hydrateStorageFromCloudData(cloudData);

    return cloudData;
  } catch (err) {
    console.warn("[Firestore] Error in cloud user sync:", err);
    return defaultEmpty;
  }
}

/**
 * Debounced sync for reading progress to /users/{uid}/reading_progress/{bookId}
 */
export function syncReadingProgressToCloud(
  uid: string,
  bookId: string,
  page: number,
  totalPages?: number
): void {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !bookId) return;

  const key = `${uid}_${bookId}`;
  if (progressDebounceTimers[key]) {
    clearTimeout(progressDebounceTimers[key]);
  }

  progressDebounceTimers[key] = setTimeout(async () => {
    delete progressDebounceTimers[key];
    try {
      const activeDb = getFirebaseDb() || db;
      if (!activeDb) return;
      const progressRef = doc(activeDb, "users", uid, "reading_progress", bookId);
      await setDoc(
        progressRef,
        {
          bookId,
          page,
          totalPages: totalPages || 1,
          progress: totalPages ? Math.min(100, Math.round((page / totalPages) * 100)) : 0,
          lastReadAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn(`[Firestore] Failed to sync progress for ${bookId}:`, err);
    }
  }, 2000); // 2-second debounce
}

/**
 * Debounced sync for daily reading activity & streaks to /users/{uid}/data/activity
 */
export function syncReadingActivityToCloud(
  uid: string,
  activityData: ReadingStreakData
): void {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !activityData) return;

  const key = `${uid}_activity`;
  if (activityDebounceTimers[key]) {
    clearTimeout(activityDebounceTimers[key]);
  }

  activityDebounceTimers[key] = setTimeout(async () => {
    delete activityDebounceTimers[key];
    try {
      const activeDb = getFirebaseDb() || db;
      if (!activeDb) return;
      const actRef = doc(activeDb, "users", uid, "data", "activity");
      await setDoc(actRef, activityData, { merge: true });
    } catch (err) {
      console.warn("[Firestore] Failed to sync reading activity:", err);
    }
  }, 3000); // 3-second debounce
}

/**
 * Debounced sync for website active engagement time to /users/{uid}/data/active_time
 */
export function syncActiveTimeToCloud(
  uid: string,
  activeTimeData: WebsiteActiveTimeData
): void {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !activeTimeData) return;

  const key = `${uid}_activetime`;
  if (activeTimeDebounceTimers[key]) {
    clearTimeout(activeTimeDebounceTimers[key]);
  }

  activeTimeDebounceTimers[key] = setTimeout(async () => {
    delete activeTimeDebounceTimers[key];
    try {
      const activeDb = getFirebaseDb() || db;
      if (!activeDb) return;
      const atRef = doc(activeDb, "users", uid, "data", "active_time");
      await setDoc(atRef, activeTimeData, { merge: true });
    } catch (err) {
      console.warn("[Firestore] Failed to sync active time:", err);
    }
  }, 4000); // 4-second debounce
}

/**
 * Debounced sync for book reading memory to /users/{uid}/data/reading_memory
 */
export function syncReadingMemoryToCloud(
  uid: string,
  bookId: string,
  memory: BookReadingMemory
): void {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !bookId || !memory) return;

  const key = `${uid}_mem_${bookId}`;
  if (memoryDebounceTimers[key]) {
    clearTimeout(memoryDebounceTimers[key]);
  }

  memoryDebounceTimers[key] = setTimeout(async () => {
    delete memoryDebounceTimers[key];
    try {
      const activeDb = getFirebaseDb() || db;
      if (!activeDb) return;
      const memRef = doc(activeDb, "users", uid, "data", "reading_memory");
      await setDoc(
        memRef,
        {
          memories: {
            [bookId]: memory,
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.warn(`[Firestore] Failed to sync memory for ${bookId}:`, err);
    }
  }, 3000); // 3-second debounce
}

/**
 * Immediately sync a favorite book toggle to /users/{uid}/favorites/{bookId}
 */
export async function syncFavoriteToCloud(
  uid: string,
  bookId: string,
  isFavorite: boolean
): Promise<void> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !bookId) return;
  try {
    const favRef = doc(currentDb, "users", uid, "favorites", bookId);
    if (isFavorite) {
      await setDoc(
        favRef,
        {
          bookId,
          favoritedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(favRef);
    }
  } catch (err) {
    console.warn(`[Firestore] Failed to sync favorite for ${bookId}:`, err);
  }
}

/**
 * Backwards-compatibility wrapper for legacy callers
 */
export async function fetchCloudUserData(uid: string): Promise<{ favorites: string[]; progress: Record<string, number> }> {
  const full = await fetchFullCloudUserData(uid);
  const progress: Record<string, number> = {};
  full.readingHistory.forEach((i) => {
    progress[i.bookId] = i.page;
  });
  return {
    favorites: full.favorites,
    progress,
  };
}

/**
 * Backwards-compatibility wrapper for legacy callers
 */
export async function migrateLocalStateToCloud(
  uid: string,
  localFavorites: string[],
  localProgress: Record<string, number>
): Promise<void> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid) return;
  try {
    const { writeBatch, doc, serverTimestamp } = await import("firebase/firestore");
    const batch = writeBatch(currentDb);
    for (const bookId of localFavorites) {
      if (!bookId) continue;
      const favRef = doc(currentDb, "users", uid, "favorites", bookId);
      batch.set(favRef, { bookId, favoritedAt: serverTimestamp() }, { merge: true });
    }
    for (const [bookId, page] of Object.entries(localProgress)) {
      if (!bookId || typeof page !== "number") continue;
      const progRef = doc(currentDb, "users", uid, "reading_progress", bookId);
      batch.set(progRef, { bookId, page, lastReadAt: serverTimestamp() }, { merge: true });
    }
    await batch.commit();
  } catch (e) {
    console.warn("[Firestore] Legacy migration notice:", e);
  }
}

