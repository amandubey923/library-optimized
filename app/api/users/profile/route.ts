import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uidParam = searchParams.get("uid")?.trim() || "";
  const rawUsername = searchParams.get("username") || "";
  const clean = rawUsername.toLowerCase().trim().replace(/^@/, "");

  if (!uidParam && !clean) {
    return NextResponse.json({ error: "Missing uid or username parameter." }, { status: 400 });
  }

  const adminDb = getFirebaseAdminFirestore();
  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  try {
    let targetUid: string | null = uidParam || null;
    let profileData: any = null;

    // If UID is provided directly, load public_profiles and users docs
    if (targetUid) {
      const [pSnap, uSnap] = await Promise.all([
        adminDb.collection("public_profiles").doc(targetUid).get(),
        adminDb.collection("users").doc(targetUid).get(),
      ]);

      const pData = pSnap.exists ? pSnap.data() || {} : {};
      const uData = uSnap.exists ? uSnap.data() || {} : {};

      if (pSnap.exists || uSnap.exists) {
        profileData = {
          uid: targetUid,
          username: pData.username || uData.username || `reader_${targetUid.slice(0, 6)}`,
          displayName: (pData.displayName || uData.displayName || uData.username || "Reader").replace(/^@+/, "").trim(),
          bio: pData.bio || uData.bio || "Passionate reader exploring literature, philosophy & technology on Reader's HUB.",
          photoURL: pData.photoURL || uData.photoURL || "",
          createdAt: pData.createdAt || uData.createdAt || Date.now(),
          followersCount: pData.followersCount || 0,
          followingCount: pData.followingCount || 0,
          isPublic: pData.isPublic !== false,
          stats: pData.stats || {
            booksCompleted: 0,
            currentlyReading: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalActiveSeconds: 0,
          },
          achievements: pData.achievements || [],
          updatedAt: Date.now(),
        };

        // If public_profiles was missing username or displayName, heal it in Firestore
        if (!pData.username || !pData.displayName) {
          adminDb.collection("public_profiles").doc(targetUid).set(
            {
              username: profileData.username,
              displayName: profileData.displayName,
              photoURL: profileData.photoURL,
              bio: profileData.bio,
              updatedAt: Date.now(),
            },
            { merge: true }
          ).catch(() => {});
        }
      }
    }

    // 1. Try resolving UID from usernames collection if looking up by username
    if (!profileData && clean) {
      const usernameDoc = await adminDb.collection("usernames").doc(clean).get();
      if (usernameDoc.exists) {
        targetUid = usernameDoc.data()?.uid || null;
      }
    }

    // 2. If not found in usernames, try public_profiles query
    if (!profileData && !targetUid && clean) {
      const qSnap = await adminDb
        .collection("public_profiles")
        .where("username", "==", clean)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        const pDoc = qSnap.docs[0];
        targetUid = pDoc.id;
        profileData = { ...pDoc.data(), uid: pDoc.id };
      }
    }

    // 3. If targetUid resolved, fetch public profile doc
    if (targetUid && !profileData) {
      const pSnap = await adminDb.collection("public_profiles").doc(targetUid).get();
      if (pSnap.exists) {
        profileData = { ...pSnap.data(), uid: targetUid };
      } else {
        // Fallback: check users collection
        const uSnap = await adminDb.collection("users").doc(targetUid).get();
        if (uSnap.exists) {
          const uData = uSnap.data() || {};
          profileData = {
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
        }
      }
    }

    // 4. Also check users collection where username == clean if still not found
    if (!profileData) {
      const userQSnap = await adminDb
        .collection("users")
        .where("username", "==", clean)
        .limit(1)
        .get();

      if (!userQSnap.empty) {
        const uDoc = userQSnap.docs[0];
        const uData = uDoc.data();
        targetUid = uDoc.id;
        profileData = {
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
      }
    }

    if (!profileData || !targetUid) {
      return NextResponse.json({ profile: null, message: "Reader not found" }, { status: 404 });
    }

    // Remove private sensitive fields
    delete profileData.email;

    // 5. Always compute authentic live followers & following counts directly from follows collection
    try {
      const [followersSnap, followingSnap] = await Promise.all([
        adminDb.collection("follows").where("followingUid", "==", targetUid).count().get(),
        adminDb.collection("follows").where("followerUid", "==", targetUid).count().get(),
      ]);

      const liveFollowers = followersSnap.data().count || 0;
      const liveFollowing = followingSnap.data().count || 0;

      profileData.followersCount = liveFollowers;
      profileData.followingCount = liveFollowing;

      // Also enrich live streak & active time from source documents if needed
      const [actDoc, timeDoc, progDocs] = await Promise.all([
        adminDb.collection("users").doc(targetUid).collection("data").doc("activity").get().catch(() => ({ exists: false, data: () => null })),
        adminDb.collection("users").doc(targetUid).collection("data").doc("active_time").get().catch(() => ({ exists: false, data: () => null })),
        adminDb.collection("users").doc(targetUid).collection("reading_progress").get().catch(() => ({ docs: [] })),
      ]);

      const actData = actDoc.exists && typeof (actDoc as any).data === "function" ? (actDoc as any).data() : null;
      const timeData = timeDoc.exists && typeof (timeDoc as any).data === "function" ? (timeDoc as any).data() : null;
      const completedBooksCount = (progDocs.docs || []).filter((d: any) => {
        const p = d.data();
        return p.progress >= 95 || (p.totalPages > 0 && p.page >= p.totalPages);
      }).length;

      const currentStreak = actData?.currentStreak ?? profileData.stats?.currentStreak ?? 0;
      const longestStreak = actData?.longestStreak ?? profileData.stats?.longestStreak ?? 0;
      const totalActiveSeconds = timeData?.totalActiveSeconds ?? profileData.stats?.totalActiveSeconds ?? 0;

      profileData.stats = {
        ...(profileData.stats || {}),
        currentStreak,
        longestStreak,
        totalActiveSeconds,
        booksCompleted: Math.max(profileData.stats?.booksCompleted || 0, completedBooksCount),
      };

      // Keep public_profiles in sync if counts or stats differ
      adminDb.collection("public_profiles").doc(targetUid).set(
        {
          followersCount: liveFollowers,
          followingCount: liveFollowing,
          stats: profileData.stats,
        },
        { merge: true }
      ).catch(() => {});
    } catch (countErr) {
      console.warn("[Profile API] Live count query notice:", countErr);
    }

    // 6. Ensure clean displayName without duplicate '@' prefix
    if (profileData.displayName) {
      profileData.displayName = profileData.displayName.replace(/^@+/, "").trim();
    }
    if (!profileData.displayName) {
      profileData.displayName = profileData.username;
    }

    return NextResponse.json({ profile: profileData });
  } catch (err: any) {
    console.warn("[Profile API] Lookup error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
