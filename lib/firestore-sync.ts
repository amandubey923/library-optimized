import { User } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db, getFirebaseDb } from "./firebase";

export interface CloudUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: any;
  lastLoginAt?: any;
}

export interface CloudReadingProgress {
  bookId: string;
  page: number;
  totalPages?: number;
  progress?: number;
  lastReadAt?: any;
}

export interface CloudFavorite {
  bookId: string;
  favoritedAt?: any;
}

// In-memory debounce timers for rapid page flips
const progressDebounceTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Synchronize user profile info to Firestore (/users/{uid})
 */
export async function syncUserProfile(user: User): Promise<void> {
  if (!db || !user) return;
  try {
    const userRef = doc(db, "users", user.uid);
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
 * Fetch all cloud favorites and reading progress for a user
 */
export async function fetchCloudUserData(uid: string): Promise<{
  favorites: string[];
  progress: Record<string, number>;
}> {
  const result: { favorites: string[]; progress: Record<string, number> } = {
    favorites: [],
    progress: {},
  };

  if (!db || !uid) return result;

  try {
    // 1. Fetch Cloud Favorites
    const favsRef = collection(db, "users", uid, "favorites");
    const favsSnap = await getDocs(favsRef);
    favsSnap.forEach((d) => {
      if (d.id) result.favorites.push(d.id);
    });

    // 2. Fetch Cloud Reading Progress
    const progRef = collection(db, "users", uid, "reading_progress");
    const progSnap = await getDocs(progRef);
    progSnap.forEach((d) => {
      const data = d.data();
      if (data && typeof data.page === "number") {
        result.progress[d.id] = data.page;
      }
    });
  } catch (err) {
    console.warn("[Firestore] Error fetching cloud user data:", err);
  }

  return result;
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
  if (!db || !uid || !bookId) return;

  const key = `${uid}_${bookId}`;
  if (progressDebounceTimers[key]) {
    clearTimeout(progressDebounceTimers[key]);
  }

  progressDebounceTimers[key] = setTimeout(async () => {
    delete progressDebounceTimers[key];
    try {
      if (!db) return;
      const progressRef = doc(db, "users", uid, "reading_progress", bookId);
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
 * Immediately sync a favorite book toggle to /users/{uid}/favorites/{bookId}
 */
export async function syncFavoriteToCloud(
  uid: string,
  bookId: string,
  isFavorite: boolean
): Promise<void> {
  if (!db || !uid || !bookId) return;
  try {
    const favRef = doc(db, "users", uid, "favorites", bookId);
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
 * One-time batch migration of existing guest local storage data to the cloud on login
 */
export async function migrateLocalStateToCloud(
  uid: string,
  localFavorites: string[],
  localProgress: Record<string, number>
): Promise<void> {
  if (!db || !uid) return;

  try {
    const batch = writeBatch(db);
    let count = 0;

    // Migrate favorites
    for (const bookId of localFavorites) {
      if (!bookId) continue;
      const favRef = doc(db, "users", uid, "favorites", bookId);
      batch.set(favRef, { bookId, favoritedAt: serverTimestamp() }, { merge: true });
      count++;
    }

    // Migrate progress
    for (const [bookId, page] of Object.entries(localProgress)) {
      if (!bookId || typeof page !== "number") continue;
      const progRef = doc(db, "users", uid, "reading_progress", bookId);
      batch.set(
        progRef,
        {
          bookId,
          page,
          lastReadAt: serverTimestamp(),
        },
        { merge: true }
      );
      count++;
    }

    if (count > 0) {
      await batch.commit();
      console.log(`[Firestore] Successfully migrated ${count} local items to cloud account.`);
    }
  } catch (err) {
    console.warn("[Firestore] Batch local state migration failed:", err);
  }
}

