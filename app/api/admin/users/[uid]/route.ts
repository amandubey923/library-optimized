import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/entitlements";
import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_API || "kumaraman19137@gmail.com";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    if (!uid) {
      return NextResponse.json({ error: "Missing uid parameter." }, { status: 400 });
    }

    // Optional admin token verification
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.replace("Bearer ", "").trim();
      const verified = await verifyFirebaseIdToken(idToken);
      if (verified && verified.email !== ADMIN_EMAIL) {
        return NextResponse.json(
          { error: "Forbidden. Authorized administrator access required." },
          { status: 403 }
        );
      }
    }

    const adminDb = getFirebaseAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    // 1. Fetch user root doc & public profile doc
    const [userSnap, profSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("public_profiles").doc(uid).get(),
    ]);

    if (!userSnap.exists && !profSnap.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userData = userSnap.data() || {};
    const profData = profSnap.data() || {};

    let lastLogin: number | undefined = undefined;
    if (userData.lastLoginAt) {
      if (typeof userData.lastLoginAt.toMillis === "function") {
        lastLogin = userData.lastLoginAt.toMillis();
      } else if (typeof userData.lastLoginAt === "number") {
        lastLogin = userData.lastLoginAt;
      }
    }

    // 2. Fetch subcollections using Admin SDK privileges
    const [favsSnap, progSnap, collSnap, refSnap, actSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).collection("favorites").get().catch(() => ({ docs: [] })),
      adminDb.collection("users").doc(uid).collection("reading_progress").get().catch(() => ({ docs: [] })),
      adminDb.collection("users").doc(uid).collection("data").doc("collections").get().catch(() => ({ exists: false, data: () => null })),
      adminDb.collection("users").doc(uid).collection("data").doc("reflections").get().catch(() => ({ exists: false, data: () => null })),
      adminDb.collection("public_activities").where("uid", "==", uid).limit(10).get().catch(() => ({ docs: [] })),
    ]);

    // Format Favorites
    const favorites: string[] = [];
    favsSnap.docs.forEach((d: any) => {
      const dData = d.data();
      if (dData.isFavorite !== false) {
        favorites.push(d.id);
      }
    });

    // Format Reading Progress
    const readingProgress: Array<{
      bookId: string;
      page: number;
      totalPages: number;
      progress: number;
      lastReadAt?: number;
    }> = [];
    progSnap.docs.forEach((d: any) => {
      const p = d.data();
      readingProgress.push({
        bookId: d.id,
        page: p.currentPage || p.page || 0,
        totalPages: p.totalPages || 0,
        progress: typeof p.progress === "number" ? Math.round(p.progress) : 0,
        lastReadAt: p.lastReadAt || p.updatedAt,
      });
    });

    // Format Collections
    let collections: any[] = [];
    if (collSnap.exists && typeof (collSnap as any).data === "function") {
      const cData = (collSnap as any).data();
      if (Array.isArray(cData)) {
        collections = cData;
      } else if (cData?.collections && Array.isArray(cData.collections)) {
        collections = cData.collections;
      }
    }

    // Format Reflections
    let reflections: Record<string, any> = {};
    if (refSnap.exists && typeof (refSnap as any).data === "function") {
      reflections = (refSnap as any).data() || {};
    }

    // Format Activities
    const recentActivities: any[] = [];
    actSnap.docs.forEach((d: any) => {
      recentActivities.push({
        id: d.id,
        ...d.data(),
      });
    });
    recentActivities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const cleanDisplayName = (userData.displayName || profData.displayName || profData.username || "Reader").replace(/^@+/, "").trim();

    const inspectionData = {
      uid,
      email: userData.email || "No email",
      displayName: cleanDisplayName,
      username: profData.username || userData.username || `reader_${uid.slice(0, 6)}`,
      photoURL: userData.photoURL || profData.photoURL || "",
      bio: userData.bio || profData.bio || "",
      lastLoginAt: lastLogin,
      lastActiveAt: userData.lastActiveAt,
      createdAt: userData.createdAt,
      booksCompleted: profData.stats?.booksCompleted || 0,
      currentlyReading: profData.stats?.currentlyReading || readingProgress.length,
      currentStreak: profData.stats?.currentStreak || 0,
      longestStreak: profData.stats?.longestStreak || 0,
      totalActiveSeconds: profData.stats?.totalActiveSeconds || 0,
      followersCount: profData.followersCount || 0,
      followingCount: profData.followingCount || 0,
      isPublic: profData.isPublic !== false,
      favorites,
      collections,
      readingProgress,
      reflections,
      recentActivities,
    };

    return NextResponse.json({ user: inspectionData });
  } catch (err: any) {
    console.error("[Admin API] /api/admin/users/[uid] error:", err);
    return NextResponse.json({ error: "Failed to load user inspection data." }, { status: 500 });
  }
}
