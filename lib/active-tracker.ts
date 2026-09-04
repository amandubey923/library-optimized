import { getFirebaseDb, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

/**
 * Reader's HUB — Active User Tracking & Activity Presence Service
 *
 * Single source of truth: /users/{uid} document with `lastActiveAt: number`.
 * Uses strict in-memory throttling (3 minutes) to eliminate excessive Firestore writes.
 */

const THROTTLE_MS = 3 * 60 * 1000; // 3 minutes
const touchedCache = new Map<string, number>();

/**
 * Updates the user's lastActiveAt timestamp in /users/{uid}.
 * Throttled to at most once every 3 minutes per active browser session.
 */
export async function touchUserLastActive(uid?: string | null): Promise<void> {
  if (!uid) return;

  const now = Date.now();
  const lastTouched = touchedCache.get(uid) || 0;

  if (now - lastTouched < THROTTLE_MS) {
    return; // Throttled
  }

  touchedCache.set(uid, now);

  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return;

  try {
    const userRef = doc(currentDb, "users", uid);
    await setDoc(
      userRef,
      {
        lastActiveAt: now,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[ActiveTracker] Failed to record user activity:", err);
  }
}

export type ActivityStatus = "online" | "recently_active" | "offline";

export interface ActivityStatusInfo {
  status: ActivityStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * Derives activity presence status based on the authoritative lastActiveAt timestamp.
 * - ONLINE: active within last 5 minutes ("Active now")
 * - RECENTLY ACTIVE: active within last 30 minutes ("Recently active")
 * - OFFLINE: older than 30 minutes ("Offline")
 */
export function getActivityStatus(lastActiveAt?: number | null): ActivityStatusInfo {
  if (!lastActiveAt || typeof lastActiveAt !== "number") {
    return {
      status: "offline",
      label: "Offline",
      badgeClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
      dotClass: "bg-zinc-400",
    };
  }

  const diff = Date.now() - lastActiveAt;

  if (diff <= 5 * 60 * 1000) {
    return {
      status: "online",
      label: "Active now",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-400 animate-pulse",
    };
  }

  if (diff <= 30 * 60 * 1000) {
    return {
      status: "recently_active",
      label: "Recently active",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      dotClass: "bg-amber-400",
    };
  }

  return {
    status: "offline",
    label: "Offline",
    badgeClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dotClass: "bg-zinc-400",
  };
}

/**
 * Formats relative last seen timestamp into a human-friendly string.
 */
export function formatLastSeen(timestamp?: number | null): string {
  if (!timestamp || typeof timestamp !== "number") return "Never";

  const diff = Date.now() - timestamp;
  if (diff < 0) return "Active just now";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Active just now";
  if (minutes <= 5) return "Active now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

