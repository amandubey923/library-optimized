import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const clean = q.toLowerCase().trim().replace(/^@/, "");

  if (!clean || clean.length < 2) {
    return NextResponse.json({ readers: [] });
  }

  const adminDb = getFirebaseAdminFirestore();
  if (!adminDb) {
    return NextResponse.json({ readers: [] });
  }

  try {
    const results: any[] = [];
    const seenUids = new Set<string>();

    // 1. Prefix query on username in public_profiles
    const usernameSnap = await adminDb
      .collection("public_profiles")
      .where("username", ">=", clean)
      .where("username", "<=", clean + "\uf8ff")
      .limit(20)
      .get();

    usernameSnap.forEach((doc: any) => {
      const data = doc.data();
      delete data.email;
      seenUids.add(doc.id);
      results.push({ ...data, uid: doc.id });
      const cleanDisplayName = (data.displayName || data.username || "Reader").replace(/^@+/, "").trim();
      results.push({ ...data, displayName: cleanDisplayName, uid: doc.id });
    });

    // 2. Substring & Display Name matching across public_profiles
    const recentSnap = await adminDb.collection("public_profiles").limit(50).get();
    recentSnap.forEach((doc: any) => {
      if (!seenUids.has(doc.id)) {
        const data = doc.data();
        const u = (data.username || "").toLowerCase();
        const d = (data.displayName || "").toLowerCase();
        if (u.includes(clean) || d.includes(clean)) {
          delete data.email;
          seenUids.add(doc.id);
          results.push({ ...data, uid: doc.id });
          const cleanDisplayName = (data.displayName || data.username || "Reader").replace(/^@+/, "").trim();
          results.push({ ...data, displayName: cleanDisplayName, uid: doc.id });
        }
      }
    });

    // 3. Check users collection for accounts whose public_profile may not have synced yet
    const usersSnap = await adminDb.collection("users").limit(50).get();
    usersSnap.forEach((doc: any) => {
      if (!seenUids.has(doc.id)) {
        const data = doc.data();
        const u = (data.username || "").toLowerCase();
        const d = (data.displayName || "").toLowerCase();
        if ((u && u.includes(clean)) || (d && d.includes(clean))) {
          seenUids.add(doc.id);
          const cleanDisplayName = (data.displayName || data.username || "Reader").replace(/^@+/, "").trim();
          results.push({
            uid: doc.id,
            username: data.username || null,
            displayName: cleanDisplayName,
            photoURL: data.photoURL || "",
            bio: data.bio || "",
            followersCount: 0,
            followingCount: 0,
            stats: {
              booksCompleted: 0,
              currentlyReading: 0,
              currentStreak: 0,
              longestStreak: 0,
              totalActiveSeconds: 0,
            },
            updatedAt: Date.now(),
          });
        }
      }
    });

    return NextResponse.json({ readers: results });
  } catch (err: any) {
    console.warn("[User Search API] Search error:", err);
    return NextResponse.json({ readers: [] });
  }
}

