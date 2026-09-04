import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/entitlements";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "kumaraman19137@gmail.com";

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

    if (!verified || verified.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Forbidden. Authorized administrator access required." },
        { status: 403 }
      );
    }

    const adminAuth = getFirebaseAdminAuth();
    const adminFirestore = getFirebaseAdminFirestore();

    // 1. Fetch raw auth accounts
    let authUsers: any[] = [];
    if (adminAuth) {
      try {
        const listResult = await adminAuth.listUsers(100);
        authUsers = listResult.users.map((u: any) => ({
          uid: u.uid,
          email: u.email || "",
          displayName: u.displayName || "",
          photoURL: u.photoURL || "",
          creationTime: u.metadata.creationTime ? new Date(u.metadata.creationTime).getTime() : Date.now(),
          lastSignInTime: u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).getTime() : 0,
        }));
      } catch (authErr) {
        console.warn("[Admin API] adminAuth.listUsers notice (fallback active):", authErr);
      }
    }

    // 2. Fetch all public profiles and user docs from Firestore
    const profilesMap: Record<string, any> = {};
    const userDocsMap: Record<string, any> = {};

    if (adminFirestore) {
      try {
        const [profSnap, userSnap] = await Promise.all([
          adminFirestore.collection("public_profiles").get(),
          adminFirestore.collection("users").get(),
        ]);

        profSnap.forEach((doc: any) => {
          profilesMap[doc.id] = doc.data();
        });

        userSnap.forEach((doc: any) => {
          userDocsMap[doc.id] = doc.data();
        });
      } catch (fsErr) {
        console.warn("[Admin API] Firestore admin fetch notice:", fsErr);
      }
    }

    // 3. Fallback: If auth listing was unavailable, seed from userDocsMap + profilesMap
    if (authUsers.length === 0) {
      const allUids = Array.from(new Set([...Object.keys(profilesMap), ...Object.keys(userDocsMap)]));
      authUsers = allUids.map((uid) => {
        const uDoc = userDocsMap[uid] || {};
        const pDoc = profilesMap[uid] || {};
        return {
          uid,
          email: uDoc.email || (uid === verified.uid ? verified.email : ""),
          displayName: uDoc.displayName || pDoc.displayName || "",
          photoURL: uDoc.photoURL || pDoc.photoURL || "",
          creationTime: pDoc.createdAt || uDoc.lastLoginAt || Date.now(),
          lastSignInTime: uDoc.lastLoginAt || 0,
        };
      });
    }

    // 4. Merge data into unified AdminUserItem array
    const now = Date.now();
    const mergedUsers = authUsers.map((authUser) => {
      const profile = profilesMap[authUser.uid] || {};
      const userDoc = userDocsMap[authUser.uid] || {};

      const username = profile.username || userDoc.username || null;
      const displayName =
        profile.displayName || authUser.displayName || userDoc.displayName || (username ? `@${username}` : "Reader");
      const email = authUser.email || userDoc.email || "";
      const photoURL = authUser.photoURL || profile.photoURL || userDoc.photoURL || "";

      // lastActiveAt is Reader Hub's activity tracking timestamp (separate from auth lastSignInTime)
      const lastActiveAt = userDoc.lastActiveAt || profile.updatedAt || null;

      // Status calculation
      let status: "online" | "recently_active" | "offline" | "unrecorded" = "unrecorded";
      if (lastActiveAt) {
        const diffMs = now - Number(lastActiveAt);
        if (diffMs <= 5 * 60 * 1000) {
          status = "online";
        } else if (diffMs <= 30 * 60 * 1000) {
          status = "recently_active";
        } else {
          status = "offline";
        }
      }

      return {
        id: authUser.uid,
        uid: authUser.uid,
        email,
        displayName,
        username,
        photoURL,
        bio: profile.bio || userDoc.bio || "",
        status,
        createdAt: authUser.creationTime || profile.createdAt || Date.now(),
        lastSignInAt: authUser.lastSignInTime || 0,
        lastActiveAt: lastActiveAt ? Number(lastActiveAt) : null,
        booksCompleted: profile.stats?.booksCompleted || 0,
        currentlyReading: profile.stats?.currentlyReading || 0,
        currentStreak: profile.stats?.currentStreak || 0,
        longestStreak: profile.stats?.longestStreak || 0,
        totalActiveSeconds: profile.stats?.totalActiveSeconds || 0,
        followersCount: profile.followersCount || 0,
        followingCount: profile.followingCount || 0,
        achievementsCount: profile.achievements?.length || 0,
      };
    });

    // Sort by recent activity / last sign in
    mergedUsers.sort((a, b) => {
      const timeA = a.lastActiveAt || a.lastSignInAt || a.createdAt || 0;
      const timeB = b.lastActiveAt || b.lastSignInAt || b.createdAt || 0;
      return timeB - timeA;
    });

    const activeReadersCount = mergedUsers.filter(
      (u) => u.status === "online" || u.status === "recently_active"
    ).length;

    return NextResponse.json({
      users: mergedUsers,
      totalCount: mergedUsers.length,
      activeReadersCount,
      timestamp: now,
    });
  } catch (err: any) {
    console.error("[Admin Users API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error fetching admin users.", details: err?.message },
      { status: 500 }
    );
  }
}

