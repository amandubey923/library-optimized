import { getFirebaseDb, db, getFirebaseAuth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

/**
 * Public catalog override record.
 * Contains ZERO sensitive admin data (no admin email, no admin UID).
 */
export interface CatalogOverride {
  bookId: string;
  isDeleted: boolean;
  titleOverride?: string;
  authorOverride?: string;
  categoryOverride?: string;
  descriptionOverride?: string;
  updatedAt: number;
}

/**
 * Public curated series override record.
 * Overlays on top of static READING_PATHS in lib/reading-paths.ts.
 */
export interface CuratedSeriesOverride {
  seriesId: string;
  isDeleted: boolean;
  titleOverride?: string;
  descriptionOverride?: string;
  updatedAt: number;
}

/**
 * Sensitive admin audit log entry stored in admin_audit_logs.
 * Strictly ADMIN-ONLY readable and writable.
 */
export interface AdminAuditLog {
  id: string;
  action:
    | "book_soft_deleted"
    | "book_restored"
    | "book_metadata_updated"
    | "series_soft_deleted"
    | "series_restored"
    | "series_updated";
  adminEmail: string;
  adminUid: string;
  targetType: "book" | "series" | "user" | "system";
  targetId: string;
  targetName?: string;
  details?: string;
  timestamp: number;
}

/**
 * Fetches all dynamic catalog overrides from Firestore.
 */
export async function getCatalogOverrides(): Promise<Record<string, CatalogOverride>> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return {};

  try {
    const colRef = collection(currentDb, "catalog_overrides");
    const snap = await getDocs(colRef);
    const overrides: Record<string, CatalogOverride> = {};

    snap.forEach((docSnap) => {
      overrides[docSnap.id] = docSnap.data() as CatalogOverride;
    });

    return overrides;
  } catch (err) {
    console.warn("[AdminCatalog] getCatalogOverrides notice:", err);
    return {};
  }
}

/**
 * Writes an audit action to admin_audit_logs.
 */
export async function logAdminAuditAction(
  log: Omit<AdminAuditLog, "id" | "timestamp">
): Promise<void> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return;

  try {
    const logId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const logRef = doc(currentDb, "admin_audit_logs", logId);
    await setDoc(logRef, {
      ...log,
      id: logId,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn("[AdminCatalog] Failed to write audit log:", err);
  }
}

/**
 * Helper to execute admin catalog mutations securely via server-side Admin SDK.
 */
async function callAdminCatalogApi(body: any): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return false;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (err) {
    console.warn("[AdminCatalog] API call notice:", err);
    return false;
  }
}

/**
 * Soft deletes a catalog book and creates an audit log.
 */
export async function softDeleteBook(
  bookId: string,
  bookTitle: string,
  adminUser: { email: string; uid: string },
  reason?: string
): Promise<boolean> {
  // 1. First attempt secure server-side Admin SDK route
  const apiOk = await callAdminCatalogApi({
    action: "delete_book",
    bookId,
    bookTitle,
    reason,
  });
  if (apiOk) return true;

  // 2. Fallback to client Firestore if API is unreachable
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !bookId) return false;

  try {
    const overrideRef = doc(currentDb, "catalog_overrides", bookId);
    const now = Date.now();

    await setDoc(
      overrideRef,
      {
        bookId,
        isDeleted: true,
        updatedAt: now,
      },
      { merge: true }
    );

    await logAdminAuditAction({
      action: "book_soft_deleted",
      adminEmail: adminUser.email,
      adminUid: adminUser.uid,
      targetType: "book",
      targetId: bookId,
      targetName: bookTitle,
      details: reason ? `Reason: ${reason}` : "Soft deleted from catalog by administrator",
    });

    return true;
  } catch (err) {
    console.error("[AdminCatalog] softDeleteBook fallback failed:", err);
    return false;
  }
}

/**
 * Restores a soft-deleted book and logs the action.
 */
export async function restoreBook(
  bookId: string,
  bookTitle: string,
  adminUser: { email: string; uid: string }
): Promise<boolean> {
  // 1. First attempt secure server-side Admin SDK route
  const apiOk = await callAdminCatalogApi({
    action: "restore_book",
    bookId,
    bookTitle,
  });
  if (apiOk) return true;

  // 2. Fallback to client Firestore
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !bookId) return false;

  try {
    const overrideRef = doc(currentDb, "catalog_overrides", bookId);
    const now = Date.now();

    await setDoc(
      overrideRef,
      {
        bookId,
        isDeleted: false,
        updatedAt: now,
      },
      { merge: true }
    );

    await logAdminAuditAction({
      action: "book_restored",
      adminEmail: adminUser.email,
      adminUid: adminUser.uid,
      targetType: "book",
      targetId: bookId,
      targetName: bookTitle,
      details: "Restored to active catalog by administrator",
    });

    return true;
  } catch (err) {
    console.error("[AdminCatalog] restoreBook fallback failed:", err);
    return false;
  }
}

/**
 * Updates metadata overrides for a book and logs the action.
 */
export async function updateBookMetadata(
  bookId: string,
  bookTitle: string,
  updates: {
    titleOverride?: string;
    authorOverride?: string;
    categoryOverride?: string;
    descriptionOverride?: string;
  },
  adminUser: { email: string; uid: string }
): Promise<boolean> {
  // 1. First attempt secure server-side Admin SDK route
  const apiOk = await callAdminCatalogApi({
    action: "update_book_metadata",
    bookId,
    bookTitle,
    updates,
  });
  if (apiOk) return true;

  // 2. Fallback to client Firestore
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !bookId) return false;

  try {
    const overrideRef = doc(currentDb, "catalog_overrides", bookId);
    const now = Date.now();

    await setDoc(
      overrideRef,
      {
        bookId,
        ...updates,
        updatedAt: now,
      },
      { merge: true }
    );

    const fieldNames = Object.keys(updates).filter(
      (k) => (updates as any)[k] !== undefined
    );

    await logAdminAuditAction({
      action: "book_metadata_updated",
      adminEmail: adminUser.email,
      adminUid: adminUser.uid,
      targetType: "book",
      targetId: bookId,
      targetName: updates.titleOverride || bookTitle,
      details: `Updated fields: ${fieldNames.join(", ")}`,
    });

    return true;
  } catch (err) {
    console.error("[AdminCatalog] updateBookMetadata fallback failed:", err);
    return false;
  }
}

/**
 * Fetches all curated series overrides from Firestore.
 */
export async function getCuratedSeriesOverrides(): Promise<
  Record<string, CuratedSeriesOverride>
> {
  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return {};

  try {
    const colRef = collection(currentDb, "curated_series_overrides");
    const snap = await getDocs(colRef);
    const overrides: Record<string, CuratedSeriesOverride> = {};

    snap.forEach((docSnap) => {
      overrides[docSnap.id] = docSnap.data() as CuratedSeriesOverride;
    });

    return overrides;
  } catch (err) {
    console.warn("[AdminCatalog] getCuratedSeriesOverrides notice:", err);
    return {};
  }
}

/**
 * Soft deletes a curated series/path without touching its books.
 */
export async function softDeleteSeries(
  seriesId: string,
  seriesTitle: string,
  adminUser: { email: string; uid: string },
  reason?: string
): Promise<boolean> {
  // 1. First attempt secure server-side Admin SDK route
  const apiOk = await callAdminCatalogApi({
    action: "delete_series",
    seriesId,
    seriesTitle,
    reason,
  });
  if (apiOk) return true;

  // 2. Fallback to client Firestore if API is unreachable
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !seriesId) return false;

  try {
    const overrideRef = doc(currentDb, "curated_series_overrides", seriesId);
    const now = Date.now();

    await setDoc(
      overrideRef,
      {
        seriesId,
        isDeleted: true,
        updatedAt: now,
      },
      { merge: true }
    );

    await logAdminAuditAction({
      action: "series_soft_deleted",
      adminEmail: adminUser.email,
      adminUid: adminUser.uid,
      targetType: "series",
      targetId: seriesId,
      targetName: seriesTitle,
      details: reason
        ? `Reason: ${reason} (Connected books remain intact)`
        : "Curated series marked inactive (connected books preserved)",
    });

    return true;
  } catch (err) {
    console.error("[AdminCatalog] softDeleteSeries fallback failed:", err);
    return false;
  }
}

/**
 * Restores an inactive curated series/path.
 */
export async function restoreSeries(
  seriesId: string,
  seriesTitle: string,
  adminUser: { email: string; uid: string }
): Promise<boolean> {
  // 1. First attempt secure server-side Admin SDK route
  const apiOk = await callAdminCatalogApi({
    action: "restore_series",
    seriesId,
    seriesTitle,
  });
  if (apiOk) return true;

  // 2. Fallback to client Firestore
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !seriesId) return false;

  try {
    const overrideRef = doc(currentDb, "curated_series_overrides", seriesId);
    const now = Date.now();

    await setDoc(
      overrideRef,
      {
        seriesId,
        isDeleted: false,
        updatedAt: now,
      },
      { merge: true }
    );

    await logAdminAuditAction({
      action: "series_restored",
      adminEmail: adminUser.email,
      adminUid: adminUser.uid,
      targetType: "series",
      targetId: seriesId,
      targetName: seriesTitle,
      details: "Curated series reactivated by administrator",
    });

    return true;
  } catch (err) {
    console.error("[AdminCatalog] restoreSeries fallback failed:", err);
    return false;
  }
}

/**
 * Updates curated series metadata.
 */
export async function updateSeriesMetadata(
  seriesId: string,
  seriesTitle: string,
  updates: {
    titleOverride?: string;
    descriptionOverride?: string;
  },
  adminUser: { email: string; uid: string }
): Promise<boolean> {
  // 1. First attempt secure server-side Admin SDK route
  const apiOk = await callAdminCatalogApi({
    action: "update_series_metadata",
    seriesId,
    seriesTitle,
    updates,
  });
  if (apiOk) return true;

  // 2. Fallback to client Firestore
  const currentDb = getFirebaseDb() || db;
  if (!currentDb || !seriesId) return false;

  try {
    const overrideRef = doc(currentDb, "curated_series_overrides", seriesId);
    const now = Date.now();

    await setDoc(
      overrideRef,
      {
        seriesId,
        ...updates,
        updatedAt: now,
      },
      { merge: true }
    );

    await logAdminAuditAction({
      action: "series_updated",
      adminEmail: adminUser.email,
      adminUid: adminUser.uid,
      targetType: "series",
      targetId: seriesId,
      targetName: updates.titleOverride || seriesTitle,
      details: "Curated series metadata updated by administrator",
    });

    return true;
  } catch (err) {
    console.error("[AdminCatalog] updateSeriesMetadata fallback failed:", err);
    return false;
  }
}

/**
 * Fetches recent administrative audit logs.
 */
export async function getAdminAuditLogs(limitCount = 50): Promise<AdminAuditLog[]> {
  // 1. First attempt server-side API with admin Bearer token
  if (typeof window !== "undefined") {
    try {
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`/api/admin/catalog?limit=${limitCount}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.logs)) return data.logs;
        }
      }
    } catch (err) {
      console.warn("[AdminCatalog] getAdminAuditLogs API notice:", err);
    }
  }

  // 2. Fallback to client Firestore query
  const currentDb = getFirebaseDb() || db;
  if (!currentDb) return [];

  try {
    const logsCol = collection(currentDb, "admin_audit_logs");
    const q = query(logsCol, orderBy("timestamp", "desc"), limit(limitCount));
    const snap = await getDocs(q);

    const logs: AdminAuditLog[] = [];
    snap.forEach((d) => {
      logs.push(d.data() as AdminAuditLog);
    });

    return logs;
  } catch (err) {
    console.warn("[AdminCatalog] getAdminAuditLogs notice:", err);
    return [];
  }
}

