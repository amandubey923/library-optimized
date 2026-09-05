import { User } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db, getFirebaseDb } from "./firebase";
import {
  ReadingProgressItem,
  ReadingStreakData,
  DailyReadingActivity,
  WebsiteActiveTimeData,
  BookReadingMemory,
  BookAnnotations,
  hydrateStorageFromCloudData,
  ReadingCollection,
  BookReflection,
  ShelfDismissalsMap,
  calculateStreak,
  saveReadingActivityData,
  getReadingActivityData,
  getStoredFavorites,
  saveStoredFavorites,
  getStoredReadingHistory,
  saveStoredReadingHistory,
  getReadingCollections,
  getBookReflections,
  getShelfDismissals,
  getWebsiteActiveTimeData,
} from "./reader-storage";
import { UserEntitlement, DEFAULT_FREE_ENTITLEMENT } from "./entitlements";

export interface CloudFullUserData {
  favorites: string[];
  readingHistory: ReadingProgressItem[];
  readingActivity: ReadingStreakData;
  activeTime: WebsiteActiveTimeData;
  readingMemories: Record<string, BookReadingMemory>;
  annotations: Record<string, BookAnnotations>;
  collections: ReadingCollection[];
  reflections: Record<string, BookReflection>;
  shelfDismissals: ShelfDismissalsMap;
  entitlement?: UserEntitlement;
}

// In-memory debounce timers for non-blocking background writes
const progressDebounceTimers: Record<string, NodeJS.Timeout> = {};
const activityDebounceTimers: Record<string, NodeJS.Timeout> = {};
const activeTimeDebounceTimers: Record<string, NodeJS.Timeout> = {};
const memoryDebounceTimers: Record<string, NodeJS.Timeout> = {};
const collectionsDebounceTimers: Record<string, NodeJS.Timeout> = {};
const reflectionsDebounceTimers: Record<string, NodeJS.Timeout> = {};
const dismissalsDebounceTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Cancel and clear all pending debounced background synchronization timers.
 * Prevents stale write triggers when switching or logging out accounts.
 */
export function cancelAllPendingSyncTimers(): void {
  Object.values(progressDebounceTimers).forEach(clearTimeout);
  Object.values(activityDebounceTimers).forEach(clearTimeout);
  Object.values(activeTimeDebounceTimers).forEach(clearTimeout);
  Object.values(memoryDebounceTimers).forEach(clearTimeout);
  Object.values(collectionsDebounceTimers).forEach(clearTimeout);
  Object.values(reflectionsDebounceTimers).forEach(clearTimeout);
  Object.values(dismissalsDebounceTimers).forEach(clearTimeout);

  for (const k of Object.keys(progressDebounceTimers)) delete progressDebounceTimers[k];
  for (const k of Object.keys(activityDebounceTimers)) delete activityDebounceTimers[k];
  for (const k of Object.keys(activeTimeDebounceTimers)) delete activeTimeDebounceTimers[k];
  for (const k of Object.keys(memoryDebounceTimers)) delete memoryDebounceTimers[k];
  for (const k of Object.keys(collectionsDebounceTimers)) delete collectionsDebounceTimers[k];
  for (const k of Object.keys(reflectionsDebounceTimers)) delete reflectionsDebounceTimers[k];
  for (const k of Object.keys(dismissalsDebounceTimers)) delete dismissalsDebounceTimers[k];
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
        lastActiveAt: Date.now(),
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
    collections: [],
    reflections: {},
    shelfDismissals: {},
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
        const calculated = calculateStreak(actData.daily);
        defaultResult.readingActivity = {
          daily: actData.daily,
          currentStreak: calculated.currentStreak || actData.currentStreak || 0,
          longestStreak: Math.max(calculated.longestStreak, actData.longestStreak || 0),
          lastQualifiedDate: calculated.lastQualifiedDate || actData.lastQualifiedDate || null,
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

    // 7. Fetch Cloud Collections
    const colDocRef = doc(currentDb, "users", uid, "data", "collections");
    const colDocSnap = await getDoc(colDocRef);
    if (colDocSnap.exists()) {
      const colData = colDocSnap.data();
      if (colData && Array.isArray(colData.collections)) {
        defaultResult.collections = colData.collections;
      }
    }

    // 8. Fetch Cloud Reflections
    const refDocRef = doc(currentDb, "users", uid, "data", "reflections");
    const refDocSnap = await getDoc(refDocRef);
    if (refDocSnap.exists()) {
      const refData = refDocSnap.data();
      if (refData && refData.reflections) {
        defaultResult.reflections = refData.reflections;
      }
    }

    // 9. Fetch Cloud Shelf Dismissals
    const dismDocRef = doc(currentDb, "users", uid, "data", "shelf_dismissals");
    const dismDocSnap = await getDoc(dismDocRef);
    if (dismDocSnap.exists()) {
      const dismData = dismDocSnap.data();
      if (dismData && dismData.dismissals) {
        defaultResult.shelfDismissals = dismData.dismissals;
      }
    }

    // 10. Fetch Cloud Entitlement
    const entitlementDocRef = doc(currentDb, "users", uid, "data", "entitlement");
    const entitlementDocSnap = await getDoc(entitlementDocRef);
    if (entitlementDocSnap.exists()) {
      const entData = entitlementDocSnap.data();
      if (entData) {
        defaultResult.entitlement = entData as UserEntitlement;
      }
    }
  } catch (err) {
    console.warn("[Firestore] Error fetching full cloud user data:", err);
  }

  return defaultResult;
}

/**
 * Persist verified entitlement to Firestore under /users/{uid}/data/entitlement
 */
export async function syncEntitlementToCloud(
  uid: string,
  entitlement: UserEntitlement
): Promise<void> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !entitlement) return;
  try {
    const entRef = doc(currentDb, "users", uid, "data", "entitlement");
    await setDoc(entRef, entitlement, { merge: true });
  } catch (err) {
    console.warn("[Firestore] Failed to sync entitlement to cloud:", err);
  }
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
    collections: [],
    reflections: {},
    shelfDismissals: {},
    entitlement: DEFAULT_FREE_ENTITLEMENT,
  };

  if (!currentDb || !user) {
    return defaultEmpty;
  }

  try {
    // 1. Sync User Profile metadata document
    await syncUserProfile(user);

    // 2. Fetch Authoritative Cloud Data for this UID
    const cloudData = await fetchFullCloudUserData(user.uid);

    // Safeguard reading activity and streak data:
    // Read local reading activity strictly for this user.uid
    const localActivity = getReadingActivityData(user.uid);
    let cloudDaily = cloudData.readingActivity?.daily || {};
    const localDaily = localActivity?.daily || {};

    // Merge strictly this user's local and cloud activity
    const mergedDaily: Record<string, DailyReadingActivity> = { ...cloudDaily };
    Object.entries(localDaily).forEach(([dateKey, localEntry]) => {
      if (mergedDaily[dateKey]) {
        const secs = Math.max(mergedDaily[dateKey].seconds || 0, localEntry.seconds || 0);
        mergedDaily[dateKey] = {
          seconds: secs,
          qualified: Boolean(mergedDaily[dateKey].qualified || localEntry.qualified || secs >= 900),
          lastUpdated: Math.max(mergedDaily[dateKey].lastUpdated || 0, localEntry.lastUpdated || 0),
        };
      } else {
        mergedDaily[dateKey] = localEntry;
      }
    });

    // Calculate streak purely mathematically from merged daily reading activity
    const { currentStreak, longestStreak, lastQualifiedDate } = calculateStreak(mergedDaily);
    const finalReadingActivity: ReadingStreakData = {
      daily: mergedDaily,
      currentStreak,
      longestStreak: Math.max(
        longestStreak,
        localActivity?.longestStreak || 0,
        cloudData.readingActivity?.longestStreak || 0
      ),
      lastQualifiedDate:
        lastQualifiedDate ||
        cloudData.readingActivity?.lastQualifiedDate ||
        localActivity?.lastQualifiedDate ||
        null,
    };

    cloudData.readingActivity = finalReadingActivity;
    saveReadingActivityData(finalReadingActivity, user.uid);
    syncReadingActivityToCloud(user.uid, finalReadingActivity);

    // 3. Two-way safe union merge for favorites
    const localFavs = getStoredFavorites(user.uid);
    const cloudFavs = Array.isArray(cloudData.favorites) ? cloudData.favorites : [];
    const mergedFavs = Array.from(new Set([...localFavs, ...cloudFavs]));
    cloudData.favorites = mergedFavs;
    saveStoredFavorites(mergedFavs, user.uid);
    const cloudFavsSet = new Set(cloudFavs);
    localFavs.forEach((favId) => {
      if (!cloudFavsSet.has(favId)) {
        syncFavoriteToCloud(user.uid, favId, true);
      }
    });

    // 4. Two-way safe union merge for reading history
    const localHistory = getStoredReadingHistory(user.uid);
    const cloudHistory = Array.isArray(cloudData.readingHistory) ? cloudData.readingHistory : [];
    const historyMap = new Map<string, ReadingProgressItem>();
    cloudHistory.forEach((item) => {
      if (item?.bookId) historyMap.set(item.bookId, item);
    });
    localHistory.forEach((localItem) => {
      if (!localItem?.bookId) return;
      const existing = historyMap.get(localItem.bookId);
      if (!existing) {
        historyMap.set(localItem.bookId, localItem);
        syncReadingProgressToCloud(user.uid, localItem.bookId, localItem.page, localItem.totalPages);
      } else {
        const higherPage = Math.max(localItem.page || 0, existing.page || 0);
        const latestTime = Math.max(localItem.lastReadAt || 0, existing.lastReadAt || 0);
        const total = localItem.totalPages || existing.totalPages || 100;
        const higherProgress = Math.min(100, Math.round((higherPage / total) * 100));
        historyMap.set(localItem.bookId, {
          bookId: localItem.bookId,
          page: higherPage,
          totalPages: total,
          progress: higherProgress,
          lastReadAt: latestTime,
        });
        if (higherPage > (existing.page || 0)) {
          syncReadingProgressToCloud(user.uid, localItem.bookId, higherPage, total);
        }
      }
    });
    cloudData.readingHistory = Array.from(historyMap.values()).sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));
    saveStoredReadingHistory(cloudData.readingHistory, user.uid);

    // 5. Two-way safe union merge for collections & reflections
    const localCollections = getReadingCollections();
    const cloudCollections = Array.isArray(cloudData.collections) ? cloudData.collections : [];
    const colMap = new Map<string, ReadingCollection>();
    cloudCollections.forEach((c) => {
      if (c?.id) colMap.set(c.id, { ...c });
    });
    localCollections.forEach((c) => {
      if (!c?.id) return;
      if (!colMap.has(c.id)) {
        colMap.set(c.id, { ...c });
      } else {
        const existing = colMap.get(c.id)!;
        existing.bookIds = Array.from(new Set([...(existing.bookIds || []), ...(c.bookIds || [])]));
      }
    });
    cloudData.collections = Array.from(colMap.values());
    if (localCollections.length > cloudCollections.length) {
      syncCollectionsToCloud(user.uid, cloudData.collections);
    }

    const localReflections = getBookReflections();
    cloudData.reflections = { ...localReflections, ...(cloudData.reflections || {}) };

    const localDismissals = getShelfDismissals();
    const cloudDismissals = cloudData.shelfDismissals || {};
    const mergedDismissals: ShelfDismissalsMap = { ...cloudDismissals };
    Object.entries(localDismissals).forEach(([sec, bMap]) => {
      mergedDismissals[sec] = { ...(mergedDismissals[sec] || {}), ...bMap };
    });
    cloudData.shelfDismissals = mergedDismissals;

    // 6. Two-way merge for active website time
    const localActive = getWebsiteActiveTimeData(user.uid);
    const cloudActive = cloudData.activeTime || { totalActiveSeconds: 0, daily: {}, lastUpdated: Date.now() };
    const mergedDailyActive: Record<string, number> = { ...(cloudActive.daily || {}) };
    Object.entries(localActive.daily || {}).forEach(([k, secs]) => {
      mergedDailyActive[k] = Math.max(mergedDailyActive[k] || 0, secs || 0);
    });
    cloudData.activeTime = {
      totalActiveSeconds: Math.max(localActive.totalActiveSeconds || 0, cloudActive.totalActiveSeconds || 0),
      daily: mergedDailyActive,
      lastUpdated: Math.max(localActive.lastUpdated || 0, cloudActive.lastUpdated || 0),
    };

    // 7. Hydrate local in-memory storage caches with authoritative merged cloud state
    hydrateStorageFromCloudData(cloudData, user.uid);

    return cloudData;
  } catch (err) {
    console.warn("[Firestore] Error in cloud user sync, safely falling back to local UID cache:", err);
    // CRITICAL: On network failure, NEVER return blank empty state if the user has local UID data!
    return {
      favorites: getStoredFavorites(user.uid),
      readingHistory: getStoredReadingHistory(user.uid),
      readingActivity: getReadingActivityData(user.uid),
      activeTime: getWebsiteActiveTimeData(user.uid),
      readingMemories: {},
      annotations: {},
      collections: getReadingCollections(),
      reflections: getBookReflections(),
      shelfDismissals: getShelfDismissals(),
      entitlement: DEFAULT_FREE_ENTITLEMENT,
    };
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

      // Critical Safeguard: NEVER overwrite existing cloud activity with empty data!
      if (!activityData || Object.keys(activityData.daily || {}).length === 0) {
        return;
      }

      const actRef = doc(activeDb, "users", uid, "data", "activity");
      await setDoc(actRef, activityData, { merge: true });

      // Automated Cloud Backup Snapshot in users/{uid}/backups/latest
      const backupRef = doc(activeDb, "users", uid, "backups", "latest");
      await setDoc(
        backupRef,
        {
          readingActivity: activityData,
          backupTimestamp: Date.now(),
        },
        { merge: true }
      ).catch(() => {});
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
 * Debounced sync for reading collections to /users/{uid}/data/collections
 */
export function syncCollectionsToCloud(
  uid: string,
  collections: ReadingCollection[]
): void {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !collections) return;

  const key = `${uid}_collections`;
  if (collectionsDebounceTimers[key]) {
    clearTimeout(collectionsDebounceTimers[key]);
  }

  collectionsDebounceTimers[key] = setTimeout(async () => {
    delete collectionsDebounceTimers[key];
    try {
      const activeDb = getFirebaseDb() || db;
      if (!activeDb) return;
      const docRef = doc(activeDb, "users", uid, "data", "collections");
      await setDoc(docRef, { collections }, { merge: true });
    } catch (err) {
      console.warn("[Firestore] Failed to sync collections to cloud:", err);
    }
  }, 1000);
}

/**
 * Debounced sync for book reflections to /users/{uid}/data/reflections
 */
export function syncReflectionsToCloud(
  uid: string,
  reflections: Record<string, BookReflection>
): void {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !reflections) return;

  const key = `${uid}_reflections`;
  if (reflectionsDebounceTimers[key]) {
    clearTimeout(reflectionsDebounceTimers[key]);
  }

  reflectionsDebounceTimers[key] = setTimeout(async () => {
    delete reflectionsDebounceTimers[key];
    try {
      const activeDb = getFirebaseDb() || db;
      if (!activeDb) return;
      const docRef = doc(activeDb, "users", uid, "data", "reflections");
      await setDoc(docRef, { reflections }, { merge: true });
    } catch (err) {
      console.warn("[Firestore] Failed to sync reflections to cloud:", err);
    }
  }, 1000);
}

/**
 * Debounced sync for shelf dismissals to /users/{uid}/data/shelf_dismissals
 */
export function syncShelfDismissalsToCloud(
  uid: string,
  dismissals: ShelfDismissalsMap
): void {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid || !dismissals) return;

  const key = `${uid}_dismissals`;
  if (dismissalsDebounceTimers[key]) {
    clearTimeout(dismissalsDebounceTimers[key]);
  }

  dismissalsDebounceTimers[key] = setTimeout(async () => {
    delete dismissalsDebounceTimers[key];
    try {
      const activeDb = getFirebaseDb() || db;
      if (!activeDb) return;
      const docRef = doc(activeDb, "users", uid, "data", "shelf_dismissals");
      await setDoc(docRef, { dismissals }, { merge: true });
    } catch (err) {
      console.warn("[Firestore] Failed to sync shelf dismissals to cloud:", err);
    }
  }, 1000);
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

