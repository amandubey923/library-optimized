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
 * Reconcile Local Storage with Authoritative Cloud Data (Two-Way Merge & Convergence)
 * Guarantees that Browser A and Browser B with the same UID converge to the exact same state.
 */
export async function reconcileAndSyncAllUserData(user: User): Promise<CloudFullUserData> {
  const currentDb = getFirebaseDb() || db;
  const localData = exportAllStorageDataForSync();

  if (!currentDb || !user) {
    return localData;
  }

  try {
    // 1. Fetch Cloud Data
    const cloudData = await fetchFullCloudUserData(user.uid);

    // 2. Reconcile Favorites (Mathematical Union)
    const mergedFavorites = Array.from(new Set([...cloudData.favorites, ...localData.favorites]));

    // 3. Reconcile Reading Progress (Max page & latest timestamp)
    const progressMap = new Map<string, ReadingProgressItem>();
    cloudData.readingHistory.forEach((item) => progressMap.set(item.bookId, item));
    localData.readingHistory.forEach((localItem: ReadingProgressItem) => {
      const existing = progressMap.get(localItem.bookId);
      if (existing) {
        const maxPage = Math.max(existing.page, localItem.page);
        const totalPages = existing.totalPages || localItem.totalPages || 100;
        progressMap.set(localItem.bookId, {
          bookId: localItem.bookId,
          page: maxPage,
          totalPages,
          progress: Math.min(100, Math.round((maxPage / totalPages) * 100)),
          lastReadAt: Math.max(existing.lastReadAt || 0, localItem.lastReadAt || 0) || Date.now(),
        });
      } else {
        progressMap.set(localItem.bookId, localItem);
      }
    });
    const mergedReadingHistory = Array.from(progressMap.values());

    // 4. Reconcile Daily Reading Activity (Max seconds per day key)
    const mergedDailyActivity: Record<string, DailyReadingActivity> = { ...cloudData.readingActivity.daily };
    const localDailyEntries = Object.entries(localData.readingActivity.daily) as [string, DailyReadingActivity][];
    for (const [dateKey, localAct] of localDailyEntries) {
      if (localAct && typeof localAct.seconds === "number") {
        const cloudAct = mergedDailyActivity[dateKey];
        const maxSeconds = Math.max(cloudAct?.seconds || 0, localAct.seconds);
        const isQualified = Boolean(maxSeconds >= 900 || cloudAct?.qualified || localAct.qualified);
        mergedDailyActivity[dateKey] = {
          seconds: maxSeconds,
          qualified: isQualified,
          lastUpdated: Math.max(cloudAct?.lastUpdated || 0, localAct.lastUpdated || 0) || Date.now(),
        };
      }
    }
    const { currentStreak, longestStreak, lastQualifiedDate } = calculateStreak(mergedDailyActivity);
    const mergedReadingActivity: ReadingStreakData = {
      daily: mergedDailyActivity,
      currentStreak,
      longestStreak: Math.max(longestStreak, cloudData.readingActivity.longestStreak || 0, localData.readingActivity.longestStreak || 0),
      lastQualifiedDate,
    };

    // 5. Reconcile Website Active Time (Max per day key & sum total)
    const mergedDailyActiveTime: Record<string, number> = { ...cloudData.activeTime.daily };
    for (const [dateKey, localSeconds] of Object.entries(localData.activeTime.daily || {})) {
      if (typeof localSeconds === "number") {
        mergedDailyActiveTime[dateKey] = Math.max(mergedDailyActiveTime[dateKey] || 0, localSeconds);
      }
    }
    let computedTotalActive = 0;
    for (const secs of Object.values(mergedDailyActiveTime)) {
      computedTotalActive += secs || 0;
    }
    const mergedActiveTime: WebsiteActiveTimeData = {
      daily: mergedDailyActiveTime,
      totalActiveSeconds: Math.max(computedTotalActive, cloudData.activeTime.totalActiveSeconds || 0, localData.activeTime.totalActiveSeconds || 0),
      lastUpdated: Date.now(),
    };

    // 6. Reconcile Reading Memories (Max per book)
    const mergedMemories: Record<string, BookReadingMemory> = { ...cloudData.readingMemories };
    const localMemoryEntries = Object.entries(localData.readingMemories || {}) as [string, BookReadingMemory][];
    for (const [bookId, localMem] of localMemoryEntries) {
      if (localMem) {
        const cloudMem = mergedMemories[bookId];
        if (cloudMem) {
          mergedMemories[bookId] = {
            bookId,
            totalSeconds: Math.max(cloudMem.totalSeconds || 0, localMem.totalSeconds || 0),
            sessionsCount: Math.max(cloudMem.sessionsCount || 0, localMem.sessionsCount || 0),
            firstReadAt: Math.min(cloudMem.firstReadAt || Date.now(), localMem.firstReadAt || Date.now()),
            lastReadAt: Math.max(cloudMem.lastReadAt || 0, localMem.lastReadAt || 0),
            timeline: [...(cloudMem.timeline || []), ...(localMem.timeline || [])],
          };
        } else {
          mergedMemories[bookId] = localMem;
        }
      }
    }

    // 7. Reconcile Annotations
    const mergedAnnotations: Record<string, BookAnnotations> = { ...cloudData.annotations };
    const localAnnotationEntries = Object.entries(localData.annotations || {}) as [string, BookAnnotations][];
    for (const [bookId, localAnn] of localAnnotationEntries) {
      if (localAnn) {
        const cloudAnn = mergedAnnotations[bookId];
        if (cloudAnn) {
          const highlightsMap = new Map();
          [...(cloudAnn.highlights || []), ...(localAnn.highlights || [])].forEach((h) => highlightsMap.set(h.id, h));
          const notesMap = new Map();
          [...(cloudAnn.notes || []), ...(localAnn.notes || [])].forEach((n) => notesMap.set(n.id, n));
          const bookmarksMap = new Map();
          [...(cloudAnn.bookmarks || []), ...(localAnn.bookmarks || [])].forEach((b) => bookmarksMap.set(b.id, b));
          mergedAnnotations[bookId] = {
            highlights: Array.from(highlightsMap.values()),
            notes: Array.from(notesMap.values()),
            bookmarks: Array.from(bookmarksMap.values()),
            drawings: { ...(cloudAnn.drawings || {}), ...(localAnn.drawings || {}) },
          };
        } else {
          mergedAnnotations[bookId] = localAnn;
        }
      }
    }

    const reconciledState: CloudFullUserData = {
      favorites: mergedFavorites,
      readingHistory: mergedReadingHistory,
      readingActivity: mergedReadingActivity,
      activeTime: mergedActiveTime,
      readingMemories: mergedMemories,
      annotations: mergedAnnotations,
    };

    // 8. Hydrate Local Storage and in-memory caches with authoritative converged state
    hydrateStorageFromCloudData(reconciledState);

    // 9. Persist Reconciled State to Firestore in an atomic batch
    const batch = writeBatch(currentDb);

    // User Profile metadata
    const userRef = doc(currentDb, "users", user.uid);
    batch.set(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastSyncedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Favorites
    for (const bookId of mergedFavorites) {
      if (bookId) {
        const favRef = doc(currentDb, "users", user.uid, "favorites", bookId);
        batch.set(favRef, { bookId, favoritedAt: serverTimestamp() }, { merge: true });
      }
    }

    // Reading Progress
    for (const prog of mergedReadingHistory) {
      if (prog.bookId) {
        const pRef = doc(currentDb, "users", user.uid, "reading_progress", prog.bookId);
        batch.set(
          pRef,
          {
            bookId: prog.bookId,
            page: prog.page,
            totalPages: prog.totalPages,
            progress: prog.progress,
            lastReadAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    // Reading Activity
    const actRef = doc(currentDb, "users", user.uid, "data", "activity");
    batch.set(actRef, mergedReadingActivity, { merge: true });

    // Active Time
    const atRef = doc(currentDb, "users", user.uid, "data", "active_time");
    batch.set(atRef, mergedActiveTime, { merge: true });

    // Reading Memory
    const memRef = doc(currentDb, "users", user.uid, "data", "reading_memory");
    batch.set(memRef, { memories: mergedMemories }, { merge: true });

    // Annotations
    const annRef = doc(currentDb, "users", user.uid, "data", "annotations");
    batch.set(annRef, { annotations: mergedAnnotations }, { merge: true });

    await batch.commit();
    console.log("[Firestore] Authoritative two-way sync complete. Local and Cloud states converged.");

    return reconciledState;
  } catch (err) {
    console.warn("[Firestore] Error during reconciliation:", err);
    return localData;
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

