import { User } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb, db } from "./firebase";
import { Book, BOOKS } from "@/data/books";

export interface PublicUserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  photoURL: string;
  createdAt: number;
  followersCount: number;
  followingCount: number;
  isPublic: boolean;
  stats: {
    booksCompleted: number;
    currentlyReading: number;
    currentStreak: number;
    longestStreak: number;
    totalActiveSeconds: number;
  };
  achievements: string[];
  updatedAt: number;
}

export interface FollowItem {
  followerUid: string;
  followingUid: string;
  createdAt: number;
}

export interface PublicActivity {
  id: string;
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  type: "completed_book" | "started_book" | "milestone_streak" | "achievement_unlocked";
  bookId?: string;
  bookTitle?: string;
  bookCover?: string;
  details?: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "reading" | "streak" | "exploration" | "reflection";
  unlocked: boolean;
  progress: number; // 0 - 100
  unlockedAt?: number;
}

export const ACHIEVEMENTS_CATALOG: Omit<Achievement, "unlocked" | "progress" | "unlockedAt">[] = [
  {
    id: "first_book",
    title: "First Steps",
    description: "Complete your first book on Reader's HUB",
    icon: "🌱",
    category: "reading",
  },
  {
    id: "five_books",
    title: "Avid Reader",
    description: "Complete 5 timeless books or tracks",
    icon: "📚",
    category: "reading",
  },
  {
    id: "ten_books",
    title: "Bookworm",
    description: "Complete 10 books across any literary realm",
    icon: "🐛",
    category: "reading",
  },
  {
    id: "twenty_five_books",
    title: "Scholar",
    description: "Complete 25 books or technical masterworks",
    icon: "🎓",
    category: "reading",
  },
  {
    id: "streak_3",
    title: "Kindled Spark",
    description: "Maintain a 3-day daily reading streak",
    icon: "✨",
    category: "streak",
  },
  {
    id: "streak_7",
    title: "Steady Flame",
    description: "Maintain a 7-day daily reading streak",
    icon: "🔥",
    category: "streak",
  },
  {
    id: "streak_30",
    title: "Eternal Diya",
    description: "Complete a 30-day unbroken reading streak",
    icon: "🪔",
    category: "streak",
  },
  {
    id: "first_reflection",
    title: "Philosopher",
    description: "Write your first reader reflection",
    icon: "✍️",
    category: "reflection",
  },
  {
    id: "three_realms",
    title: "Realm Explorer",
    description: "Read books across 3 different realms",
    icon: "🧭",
    category: "exploration",
  },
];

/**
 * Validates a proposed username: 3-20 characters, lowercase alphanumeric and underscores only.
 */
export function isValidUsername(val: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(val);
}

/**
 * Sanitizes input string into a valid username candidate.
 */
export function sanitizeUsername(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 20);
}

/**
 * Checks if a username is available in the usernames registry.
 */
export async function isUsernameAvailable(username: string, currentUid?: string): Promise<boolean> {
  const clean = sanitizeUsername(username);
  if (!isValidUsername(clean)) return false;

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return false;

  try {
    const ref = doc(currentDb, "usernames", clean);
    const snap = await getDoc(ref);
    if (!snap.exists()) return true;
    const data = snap.data();
    return Boolean(currentUid && data.uid === currentUid);
  } catch (err) {
    console.warn("[Social] isUsernameAvailable check:", err);
    return false;
  }
}

/**
 * Retrieves a public profile by its unique username.
 */
export async function getProfileByUsername(username: string): Promise<PublicUserProfile | null> {
  const clean = sanitizeUsername(username);
  if (!clean) return null;

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return null;

  try {
    // 1. Resolve UID from usernames registry
    const userRef = doc(currentDb, "usernames", clean);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const { uid } = userSnap.data();
    if (!uid) return null;

    // 2. Fetch public profile document
    return await getProfileByUid(uid);
  } catch (err) {
    console.warn("[Social] getProfileByUsername failed:", err);
    return null;
  }
}

/**
 * Retrieves a public profile by its user UID.
 */
export async function getProfileByUid(uid: string): Promise<PublicUserProfile | null> {
  if (!uid) return null;

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return null;

  try {
    const profRef = doc(currentDb, "public_profiles", uid);
    const snap = await getDoc(profRef);
    if (!snap.exists()) return null;
    return snap.data() as PublicUserProfile;
  } catch (err) {
    console.warn("[Social] getProfileByUid failed:", err);
    return null;
  }
}

/**
 * Ensures that an authenticated user has a public profile document and registered username.
 * If one does not exist, automatically derives a clean username and creates it.
 */
export async function ensureUserProfile(user: User): Promise<PublicUserProfile> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !user) throw new Error("Firebase unavailable or user unauthenticated");

  // 1. Check if profile already exists
  const existing = await getProfileByUid(user.uid);
  if (existing) return existing;

  // 2. Generate candidate username
  let baseCandidate = "";
  if (user.displayName) {
    baseCandidate = sanitizeUsername(user.displayName);
  }
  if (!baseCandidate && user.email) {
    baseCandidate = sanitizeUsername(user.email.split("@")[0]);
  }
  if (!baseCandidate || baseCandidate.length < 3) {
    baseCandidate = "reader";
  }

  let finalUsername = baseCandidate;
  let attempts = 0;
  while (!(await isUsernameAvailable(finalUsername, user.uid)) && attempts < 10) {
    const rand = Math.floor(100 + Math.random() * 900);
    finalUsername = `${baseCandidate.slice(0, 16)}_${rand}`;
    attempts++;
  }

  const newProfile: PublicUserProfile = {
    uid: user.uid,
    username: finalUsername,
    displayName: user.displayName || finalUsername,
    bio: "Passionate reader exploring literature, philosophy & technology on Reader's HUB.",
    photoURL: user.photoURL || "",
    createdAt: Date.now(),
    followersCount: 0,
    followingCount: 0,
    isPublic: true,
    stats: {
      booksCompleted: 0,
      currentlyReading: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalActiveSeconds: 0,
    },
    achievements: [],
    updatedAt: Date.now(),
  };

  try {
    // Atomically claim username & create public profile
    await runTransaction(currentDb, async (transaction) => {
      const usernameDocRef = doc(currentDb, "usernames", finalUsername);
      const profileDocRef = doc(currentDb, "public_profiles", user.uid);

      transaction.set(usernameDocRef, {
        uid: user.uid,
        createdAt: Date.now(),
      });

      transaction.set(profileDocRef, newProfile);
    });

    return newProfile;
  } catch (err) {
    console.warn("[Social] Transaction failed during ensureUserProfile, fallback setDoc:", err);
    // Fallback direct sets
    await setDoc(doc(currentDb, "usernames", finalUsername), { uid: user.uid, createdAt: Date.now() });
    await setDoc(doc(currentDb, "public_profiles", user.uid), newProfile);
    return newProfile;
  }
}

/**
 * Updates a user's public profile fields (display name, username, bio, isPublic).
 * Handles migrating the registered username if changed.
 */
export async function updateUserProfile(
  uid: string,
  updates: {
    username?: string;
    displayName?: string;
    bio?: string;
    photoURL?: string;
    isPublic?: boolean;
  },
  currentUsername?: string
): Promise<PublicUserProfile> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !uid) throw new Error("Firestore not initialized");

  const cleanNewUsername = updates.username ? sanitizeUsername(updates.username) : undefined;
  const usernameChanged = cleanNewUsername && currentUsername && cleanNewUsername !== currentUsername;

  if (usernameChanged) {
    if (!isValidUsername(cleanNewUsername)) {
      throw new Error("Invalid username. Use 3-20 lowercase letters, numbers, or underscores.");
    }
    const available = await isUsernameAvailable(cleanNewUsername, uid);
    if (!available) {
      throw new Error(`@${cleanNewUsername} is already taken. Please choose another username.`);
    }
  }

  const profileRef = doc(currentDb, "public_profiles", uid);
  const existing = await getProfileByUid(uid);

  const mergedData: PublicUserProfile = {
    ...(existing || {
      uid,
      username: cleanNewUsername || currentUsername || "reader",
      displayName: updates.displayName || "Reader",
      bio: updates.bio || "",
      photoURL: updates.photoURL || "",
      createdAt: Date.now(),
      followersCount: 0,
      followingCount: 0,
      isPublic: true,
      stats: {
        booksCompleted: 0,
        currentlyReading: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalActiveSeconds: 0,
      },
      achievements: [],
      updatedAt: Date.now(),
    }),
    ...(updates.displayName !== undefined ? { displayName: updates.displayName.trim() } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio.trim() } : {}),
    ...(updates.photoURL !== undefined ? { photoURL: updates.photoURL } : {}),
    ...(updates.isPublic !== undefined ? { isPublic: updates.isPublic } : {}),
    ...(cleanNewUsername ? { username: cleanNewUsername } : {}),
    updatedAt: Date.now(),
  };

  if (usernameChanged && currentUsername) {
    // Migrate username record in registry
    const oldRef = doc(currentDb, "usernames", currentUsername);
    const newRef = doc(currentDb, "usernames", cleanNewUsername);
    await setDoc(newRef, { uid, createdAt: Date.now() });
    await deleteDoc(oldRef);
  }

  await setDoc(profileRef, mergedData, { merge: true });
  return mergedData;
}

/**
 * Checks if followerUid is following targetUid.
 */
export async function checkIsFollowing(followerUid: string, targetUid: string): Promise<boolean> {
  if (!followerUid || !targetUid || followerUid === targetUid) return false;

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return false;

  try {
    const followId = `${followerUid}_${targetUid}`;
    const followRef = doc(currentDb, "follows", followId);
    const snap = await getDoc(followRef);
    return snap.exists();
  } catch (err) {
    console.warn("[Social] checkIsFollowing failed:", err);
    return false;
  }
}

/**
 * Follows a user. Increments follower & following counts appropriately.
 */
export async function followUser(followerUid: string, targetUid: string): Promise<boolean> {
  if (!followerUid || !targetUid || followerUid === targetUid) return false;

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return false;

  const followId = `${followerUid}_${targetUid}`;
  const followRef = doc(currentDb, "follows", followId);

  try {
    await setDoc(followRef, {
      followerUid,
      followingUid: targetUid,
      createdAt: Date.now(),
    });

    // Update counts on public profiles (with local fallback)
    try {
      const followerProfileRef = doc(currentDb, "public_profiles", followerUid);
      const targetProfileRef = doc(currentDb, "public_profiles", targetUid);

      const [fSnap, tSnap] = await Promise.all([getDoc(followerProfileRef), getDoc(targetProfileRef)]);

      if (fSnap.exists()) {
        const cur = fSnap.data().followingCount || 0;
        await setDoc(followerProfileRef, { followingCount: cur + 1 }, { merge: true });
      }
      if (tSnap.exists()) {
        const cur = tSnap.data().followersCount || 0;
        await setDoc(targetProfileRef, { followersCount: cur + 1 }, { merge: true });
      }
    } catch (countErr) {
      console.warn("[Social] Non-fatal count increment notice:", countErr);
    }

    return true;
  } catch (err) {
    console.error("[Social] followUser failed:", err);
    return false;
  }
}

/**
 * Unfollows a user. Decrements follower & following counts appropriately.
 */
export async function unfollowUser(followerUid: string, targetUid: string): Promise<boolean> {
  if (!followerUid || !targetUid || followerUid === targetUid) return false;

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return false;

  const followId = `${followerUid}_${targetUid}`;
  const followRef = doc(currentDb, "follows", followId);

  try {
    await deleteDoc(followRef);

    // Update counts
    try {
      const followerProfileRef = doc(currentDb, "public_profiles", followerUid);
      const targetProfileRef = doc(currentDb, "public_profiles", targetUid);

      const [fSnap, tSnap] = await Promise.all([getDoc(followerProfileRef), getDoc(targetProfileRef)]);

      if (fSnap.exists()) {
        const cur = fSnap.data().followingCount || 1;
        await setDoc(followerProfileRef, { followingCount: Math.max(0, cur - 1) }, { merge: true });
      }
      if (tSnap.exists()) {
        const cur = tSnap.data().followersCount || 1;
        await setDoc(targetProfileRef, { followersCount: Math.max(0, cur - 1) }, { merge: true });
      }
    } catch (countErr) {
      console.warn("[Social] Non-fatal count decrement notice:", countErr);
    }

    return true;
  } catch (err) {
    console.error("[Social] unfollowUser failed:", err);
    return false;
  }
}

/**
 * Fetches followers of a user.
 */
export async function getFollowers(targetUid: string): Promise<PublicUserProfile[]> {
  if (!targetUid) return [];

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return [];

  try {
    const q = query(
      collection(currentDb, "follows"),
      where("followingUid", "==", targetUid),
      limit(50)
    );
    const snap = await getDocs(q);
    const followerUids = snap.docs.map((d) => d.data().followerUid).filter(Boolean);

    const profiles = await Promise.all(followerUids.map((uid) => getProfileByUid(uid)));
    return profiles.filter((p): p is PublicUserProfile => p !== null);
  } catch (err) {
    console.warn("[Social] getFollowers error:", err);
    return [];
  }
}

/**
 * Fetches users that targetUid is following.
 */
export async function getFollowing(targetUid: string): Promise<PublicUserProfile[]> {
  if (!targetUid) return [];

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return [];

  try {
    const q = query(
      collection(currentDb, "follows"),
      where("followerUid", "==", targetUid),
      limit(50)
    );
    const snap = await getDocs(q);
    const followingUids = snap.docs.map((d) => d.data().followingUid).filter(Boolean);

    const profiles = await Promise.all(followingUids.map((uid) => getProfileByUid(uid)));
    return profiles.filter((p): p is PublicUserProfile => p !== null);
  } catch (err) {
    console.warn("[Social] getFollowing error:", err);
    return [];
  }
}

/**
 * Simple, fast user search by username or display name prefix.
 */
export async function searchUsers(rawQuery: string): Promise<PublicUserProfile[]> {
  const clean = rawQuery.toLowerCase().trim().replace(/^@/, "");
  if (!clean || clean.length < 2) return [];

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return [];

  try {
    // Query public_profiles
    const q = query(
      collection(currentDb, "public_profiles"),
      where("username", ">=", clean),
      where("username", "<=", clean + "\uf8ff"),
      limit(15)
    );

    const snap = await getDocs(q);
    const results = snap.docs.map((d) => d.data() as PublicUserProfile);

    // Fallback: If username query returned few results, also match display names in memory
    if (results.length < 10) {
      const allQ = query(collection(currentDb, "public_profiles"), limit(50));
      const allSnap = await getDocs(allQ);
      allSnap.docs.forEach((docSnap) => {
        const item = docSnap.data() as PublicUserProfile;
        if (!results.some((r) => r.uid === item.uid)) {
          if (
            item.displayName?.toLowerCase().includes(clean) ||
            item.username?.toLowerCase().includes(clean)
          ) {
            results.push(item);
          }
        }
      });
    }

    return results;
  } catch (err) {
    console.warn("[Social] searchUsers error:", err);
    return [];
  }
}

/**
 * Records a public reading activity event (completed book, started book, milestone).
 */
export async function recordPublicActivity(activity: Omit<PublicActivity, "id">): Promise<void> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !activity.uid) return;

  try {
    const actCol = collection(currentDb, "public_activities");
    const actDoc = doc(actCol);
    await setDoc(actDoc, {
      ...activity,
      id: actDoc.id,
      timestamp: activity.timestamp || Date.now(),
    });
  } catch (err) {
    console.warn("[Social] recordPublicActivity notice:", err);
  }
}

/**
 * Fetches recent public activities for a user.
 */
export async function getUserPublicActivities(uid: string, limitCount = 20): Promise<PublicActivity[]> {
  if (!uid) return [];

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return [];

  try {
    const q = query(
      collection(currentDb, "public_activities"),
      where("uid", "==", uid),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PublicActivity);
  } catch (err) {
    // If composite index is pending, fallback query without orderBy and sort locally
    try {
      const fallbackQ = query(
        collection(currentDb, "public_activities"),
        where("uid", "==", uid),
        limit(limitCount)
      );
      const snap = await getDocs(fallbackQ);
      return snap.docs
        .map((d) => d.data() as PublicActivity)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }
}

/**
 * Calculates user achievements dynamically based on genuine Reader Hub data.
 */
export function calculateUserAchievements(
  readingHistory: { bookId: string; progress: number; page: number; totalPages: number }[],
  streakData: { currentStreak?: number; longestStreak?: number },
  reflections: Record<string, any> = {},
  booksCatalog: Book[] = BOOKS
): Achievement[] {
  const completedBooks = readingHistory.filter(
    (h) => h.progress >= 98 || (h.totalPages > 0 && h.page >= h.totalPages)
  );
  const completedCount = completedBooks.length;

  const currentStreak = streakData.currentStreak || 0;
  const longestStreak = Math.max(currentStreak, streakData.longestStreak || 0);

  const reflectionCount = Object.keys(reflections || {}).length;

  // Real distinct categories/realms read
  const distinctCategories = new Set<string>();
  readingHistory.forEach((h) => {
    const b = booksCatalog.find((book) => book.id === h.bookId);
    if (b && b.category) distinctCategories.add(b.category);
  });
  const realmsCount = distinctCategories.size;

  return ACHIEVEMENTS_CATALOG.map((cat) => {
    let unlocked = false;
    let progress = 0;

    switch (cat.id) {
      case "first_book":
        unlocked = completedCount >= 1;
        progress = Math.min(100, (completedCount / 1) * 100);
        break;
      case "five_books":
        unlocked = completedCount >= 5;
        progress = Math.min(100, (completedCount / 5) * 100);
        break;
      case "ten_books":
        unlocked = completedCount >= 10;
        progress = Math.min(100, (completedCount / 10) * 100);
        break;
      case "twenty_five_books":
        unlocked = completedCount >= 25;
        progress = Math.min(100, (completedCount / 25) * 100);
        break;
      case "streak_3":
        unlocked = longestStreak >= 3;
        progress = Math.min(100, (longestStreak / 3) * 100);
        break;
      case "streak_7":
        unlocked = longestStreak >= 7;
        progress = Math.min(100, (longestStreak / 7) * 100);
        break;
      case "streak_30":
        unlocked = longestStreak >= 30;
        progress = Math.min(100, (longestStreak / 30) * 100);
        break;
      case "first_reflection":
        unlocked = reflectionCount >= 1;
        progress = Math.min(100, (reflectionCount / 1) * 100);
        break;
      case "three_realms":
        unlocked = realmsCount >= 3;
        progress = Math.min(100, (realmsCount / 3) * 100);
        break;
      default:
        unlocked = false;
        progress = 0;
    }

    return {
      ...cat,
      unlocked,
      progress: Math.round(progress),
    };
  });
}

/**
 * Synchronizes real reading statistics and earned achievements into the user's public profile.
 */
export async function syncPublicProfileMetrics(
  uid: string,
  readingHistory: { bookId: string; progress: number; page: number; totalPages: number }[],
  streakData: { currentStreak?: number; longestStreak?: number },
  totalActiveSeconds: number,
  reflections: Record<string, any> = {}
): Promise<void> {
  if (!uid) return;

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return;

  const completedBooks = readingHistory.filter(
    (h) => h.progress >= 98 || (h.totalPages > 0 && h.page >= h.totalPages)
  );
  const currentlyReading = readingHistory.filter(
    (h) => h.progress > 0 && h.progress < 98 && h.page < h.totalPages
  );

  const achievements = calculateUserAchievements(readingHistory, streakData, reflections, BOOKS);
  const earnedAchievementIds = achievements.filter((a) => a.unlocked).map((a) => a.id);

  try {
    const profRef = doc(currentDb, "public_profiles", uid);
    await setDoc(
      profRef,
      {
        stats: {
          booksCompleted: completedBooks.length,
          currentlyReading: currentlyReading.length,
          currentStreak: streakData.currentStreak || 0,
          longestStreak: streakData.longestStreak || 0,
          totalActiveSeconds: totalActiveSeconds || 0,
        },
        achievements: earnedAchievementIds,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[Social] syncPublicProfileMetrics note:", err);
  }
}

