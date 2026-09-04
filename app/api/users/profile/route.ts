import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUsername = searchParams.get("username") || "";
  const clean = rawUsername.toLowerCase().trim().replace(/^@/, "");

  if (!clean) {
    return NextResponse.json({ error: "Missing username parameter." }, { status: 400 });
  }

  const adminDb = getFirebaseAdminFirestore();
  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  try {
    // 1. Try resolving UID from usernames collection
    const usernameDoc = await adminDb.collection("usernames").doc(clean).get();
    let targetUid: string | null = null;

    if (usernameDoc.exists) {
      targetUid = usernameDoc.data()?.uid || null;
    }

    // 2. If not found in usernames, try public_profiles query
    if (!targetUid) {
      const qSnap = await adminDb
        .collection("public_profiles")
        .where("username", "==", clean)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        const pDoc = qSnap.docs[0];
        const data = pDoc.data();
        // Remove private data
        delete data.email;
        return NextResponse.json({ profile: { ...data, uid: pDoc.id } });
      }
    }

    // 3. If targetUid resolved, fetch public profile
    if (targetUid) {
      const pSnap = await adminDb.collection("public_profiles").doc(targetUid).get();
      if (pSnap.exists) {
        const data = pSnap.data() || {};
        delete data.email;
        return NextResponse.json({ profile: { ...data, uid: targetUid } });
      }

      // Fallback: check users collection
      const uSnap = await adminDb.collection("users").doc(targetUid).get();
      if (uSnap.exists) {
        const uData = uSnap.data() || {};
        const fallbackProfile = {
          uid: targetUid,
          username: uData.username || clean,
          displayName: uData.displayName || clean,
          bio: uData.bio || "Passionate reader exploring literature, philosophy & technology on Reader's HUB.",
          photoURL: uData.photoURL || "",
          createdAt: uData.createdAt || Date.now(),
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
        return NextResponse.json({ profile: fallbackProfile });
      }
    }

    // 4. Also check users collection where username == clean
    const userQSnap = await adminDb
      .collection("users")
      .where("username", "==", clean)
      .limit(1)
      .get();

    if (!userQSnap.empty) {
      const uDoc = userQSnap.docs[0];
      const uData = uDoc.data();
      const fallbackProfile = {
        uid: uDoc.id,
        username: uData.username || clean,
        displayName: uData.displayName || clean,
        bio: uData.bio || "Passionate reader exploring literature, philosophy & technology on Reader's HUB.",
        photoURL: uData.photoURL || "",
        createdAt: uData.createdAt || Date.now(),
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
      return NextResponse.json({ profile: fallbackProfile });
    }

    return NextResponse.json({ profile: null, message: "Reader not found" }, { status: 404 });
  } catch (err: any) {
    console.warn("[Profile API] Lookup error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

