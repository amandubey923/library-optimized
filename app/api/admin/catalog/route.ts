import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/entitlements";
import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";
import { isAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Missing admin Bearer token." },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    const verified = await verifyFirebaseIdToken(idToken);

    if (!verified || !isAdminUser(verified.email)) {
      return NextResponse.json(
        { error: "Forbidden. Authorized administrator access required." },
        { status: 403 }
      );
    }

    const adminDb = getFirebaseAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const { action, bookId, seriesId, bookTitle, seriesTitle, reason, updates } = body;

    const now = Date.now();
    const logId = `${now}_${Math.random().toString(36).substring(2, 8)}`;

    switch (action) {
      case "delete_book":
      case "soft_delete_book": {
        if (!bookId) {
          return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
        }
        await adminDb.collection("catalog_overrides").doc(bookId).set(
          {
            bookId,
            isDeleted: true,
            updatedAt: now,
          },
          { merge: true }
        );

        // Write immutable admin audit log
        await adminDb.collection("admin_audit_logs").doc(logId).set({
          id: logId,
          action: "book_soft_deleted",
          adminEmail: verified.email,
          adminUid: verified.uid,
          targetType: "book",
          targetId: bookId,
          targetName: bookTitle || bookId,
          details: reason ? `Reason: ${reason}` : "Soft deleted from catalog by administrator",
          timestamp: now,
        });

        return NextResponse.json({ success: true, bookId, isDeleted: true });
      }

      case "restore_book": {
        if (!bookId) {
          return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
        }
        await adminDb.collection("catalog_overrides").doc(bookId).set(
          {
            bookId,
            isDeleted: false,
            updatedAt: now,
          },
          { merge: true }
        );

        await adminDb.collection("admin_audit_logs").doc(logId).set({
          id: logId,
          action: "book_restored",
          adminEmail: verified.email,
          adminUid: verified.uid,
          targetType: "book",
          targetId: bookId,
          targetName: bookTitle || bookId,
          details: "Restored to active catalog by administrator",
          timestamp: now,
        });

        return NextResponse.json({ success: true, bookId, isDeleted: false });
      }

      case "update_book_metadata": {
        if (!bookId) {
          return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
        }
        await adminDb.collection("catalog_overrides").doc(bookId).set(
          {
            bookId,
            ...(updates || {}),
            updatedAt: now,
          },
          { merge: true }
        );

        const fieldNames = Object.keys(updates || {}).filter(
          (k) => (updates as any)[k] !== undefined
        );

        await adminDb.collection("admin_audit_logs").doc(logId).set({
          id: logId,
          action: "book_metadata_updated",
          adminEmail: verified.email,
          adminUid: verified.uid,
          targetType: "book",
          targetId: bookId,
          targetName: updates?.titleOverride || bookTitle || bookId,
          details: `Updated fields: ${fieldNames.join(", ")}`,
          timestamp: now,
        });

        return NextResponse.json({ success: true, bookId });
      }

      case "delete_series":
      case "soft_delete_series": {
        if (!seriesId) {
          return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
        }
        await adminDb.collection("curated_series_overrides").doc(seriesId).set(
          {
            seriesId,
            isDeleted: true,
            updatedAt: now,
          },
          { merge: true }
        );

        await adminDb.collection("admin_audit_logs").doc(logId).set({
          id: logId,
          action: "series_soft_deleted",
          adminEmail: verified.email,
          adminUid: verified.uid,
          targetType: "series",
          targetId: seriesId,
          targetName: seriesTitle || seriesId,
          details: reason
            ? `Reason: ${reason} (Connected books remain intact)`
            : "Curated series marked inactive (connected books preserved)",
          timestamp: now,
        });

        return NextResponse.json({ success: true, seriesId, isDeleted: true });
      }

      case "restore_series": {
        if (!seriesId) {
          return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
        }
        await adminDb.collection("curated_series_overrides").doc(seriesId).set(
          {
            seriesId,
            isDeleted: false,
            updatedAt: now,
          },
          { merge: true }
        );

        await adminDb.collection("admin_audit_logs").doc(logId).set({
          id: logId,
          action: "series_restored",
          adminEmail: verified.email,
          adminUid: verified.uid,
          targetType: "series",
          targetId: seriesId,
          targetName: seriesTitle || seriesId,
          details: "Curated series reactivated by administrator",
          timestamp: now,
        });

        return NextResponse.json({ success: true, seriesId, isDeleted: false });
      }

      case "update_series_metadata": {
        if (!seriesId) {
          return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
        }
        await adminDb.collection("curated_series_overrides").doc(seriesId).set(
          {
            seriesId,
            ...(updates || {}),
            updatedAt: now,
          },
          { merge: true }
        );

        await adminDb.collection("admin_audit_logs").doc(logId).set({
          id: logId,
          action: "series_updated",
          adminEmail: verified.email,
          adminUid: verified.uid,
          targetType: "series",
          targetId: seriesId,
          targetName: updates?.titleOverride || seriesTitle || seriesId,
          details: "Curated series metadata updated by administrator",
          timestamp: now,
        });

        return NextResponse.json({ success: true, seriesId });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[Admin API] /api/admin/catalog error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process admin catalog action." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Missing admin Bearer token." },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    const verified = await verifyFirebaseIdToken(idToken);

    if (!verified || !isAdminUser(verified.email)) {
      return NextResponse.json(
        { error: "Forbidden. Authorized administrator access required." },
        { status: 403 }
      );
    }

    const adminDb = getFirebaseAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const limitCount = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const snap = await adminDb
      .collection("admin_audit_logs")
      .orderBy("timestamp", "desc")
      .limit(limitCount)
      .get();

    const logs: any[] = [];
    snap.forEach((doc) => {
      logs.push(doc.data());
    });

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("[Admin API] /api/admin/catalog GET error:", err);
    return NextResponse.json({ error: "Failed to fetch audit logs." }, { status: 500 });
  }
}

