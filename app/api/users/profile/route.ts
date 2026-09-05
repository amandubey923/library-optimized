import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminFirestore, getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { verifyFirebaseIdToken } from "@/lib/entitlements";

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
        let resolvedUsername = pData.username || uData.username;
        if (!resolvedUsername) {
          // Auto-generate unique username from displayName or email
          const rawName = uData.displayName || pData.displayName || uData.email?.split("@")[0] || "reader";
          let base = rawName
            .toLowerCase()
            .replace(/^@+/, "")
            .replace(/[^a-z0-9_]/g, "_")
            .replace(/_+/g, "_")
            .slice(0, 14);
          if (base.length < 3) base = "reader";

          let candidate = base;
          const uDoc = await adminDb.collection("usernames").doc(candidate).get();
          if (uDoc.exists && uDoc.data()?.uid !== targetUid) {
            for (let i = 0; i < 15; i++) {
              const test = `${base}_${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 20);
              const testDoc = await adminDb.collection("usernames").doc(test).get();
              if (!testDoc.exists || testDoc.data()?.uid === targetUid) {
                candidate = test;
                break;
              }
            }
          }
          resolvedUsername = candidate;

          // Store consistently in usernames, users, and public_profiles
          adminDb.collection("usernames").doc(resolvedUsername).set({ uid: targetUid, createdAt: Date.now() }).catch(() => {});
          adminDb.collection("users").doc(targetUid).set({ username: resolvedUsername }, { merge: true }).catch(() => {});
          adminDb.collection("public_profiles").doc(targetUid).set({ username: resolvedUsername }, { merge: true }).catch(() => {});
        } else {
          // If username exists, guarantee it is claimed in usernames registry
          adminDb.collection("usernames").doc(resolvedUsername).get().then((uSnapDoc: any) => {
            if (!uSnapDoc.exists) {
              adminDb.collection("usernames").doc(resolvedUsername).set({ uid: targetUid, createdAt: Date.now() }).catch(() => {});
            }
          }).catch(() => {});
        }

        profileData = {
          uid: targetUid,
          username: resolvedUsername,
          displayName: (pData.displayName || uData.displayName || resolvedUsername || "Reader").replace(/^@+/, "").trim(),
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
            totalReadingSeconds: 0,
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
              totalReadingSeconds: 0,
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
            totalReadingSeconds: 0,
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

    // Ensure authoritative creation timestamp from Firebase Auth
    if (targetUid && (!profileData.createdAt || isNaN(new Date(profileData.createdAt).getTime()))) {
      try {
        const adminAuth = getFirebaseAdminAuth();
        if (adminAuth) {
          const authUser = await adminAuth.getUser(targetUid);
          if (authUser?.metadata?.creationTime) {
            const parsed = new Date(authUser.metadata.creationTime).getTime();
            if (!isNaN(parsed) && parsed > 0) {
              profileData.createdAt = parsed;
              adminDb.collection("public_profiles").doc(targetUid).set({ createdAt: parsed }, { merge: true }).catch(() => {});
              adminDb.collection("users").doc(targetUid).set({ createdAt: parsed }, { merge: true }).catch(() => {});
            }
          }
        }
      } catch (authErr) {
        console.warn("[Profile API] Auth creationTime lookup notice:", authErr);
      }
    }

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
      const allProgDocs = progDocs.docs || [];
      const completedBooksCount = allProgDocs.filter((d: any) => {
        const p = d.data();
        return (Number(p.progress) >= 95) || (p.totalPages > 0 && Number(p.page) >= Number(p.totalPages));
      }).length;

      const currentlyReadingCount = allProgDocs.filter((d: any) => {
        const p = d.data();
        const isCompleted = (Number(p.progress) >= 95) || (p.totalPages > 0 && Number(p.page) >= Number(p.totalPages));
        const hasStarted = (Number(p.progress) > 0) || (Number(p.page) > 1);
        return !isCompleted && hasStarted;
      }).length;

      let liveReadingSecs = 0;
      if (actData?.daily && typeof actData.daily === "object") {
        Object.values(actData.daily).forEach((d: any) => {
          liveReadingSecs += Number(d?.seconds) || 0;
        });
      }

      const currentStreak = actDoc.exists ? (actData?.currentStreak ?? 0) : (profileData.stats?.currentStreak ?? 0);
      const longestStreak = actDoc.exists ? (actData?.longestStreak ?? 0) : (profileData.stats?.longestStreak ?? 0);
      const totalReadingSeconds = actDoc.exists ? liveReadingSecs : (profileData.stats?.totalReadingSeconds || 0);
      const totalActiveSeconds = Math.max(
        totalReadingSeconds,
        timeDoc.exists ? (Number(timeData?.totalActiveSeconds) || 0) : (profileData.stats?.totalActiveSeconds ?? 0)
      );
      const booksCompleted = progDocs.docs !== undefined ? completedBooksCount : (profileData.stats?.booksCompleted || 0);
      const currentlyReading = progDocs.docs !== undefined ? currentlyReadingCount : (profileData.stats?.currentlyReading || 0);

      profileData.stats = {
        ...(profileData.stats || {}),
        currentStreak,
        longestStreak,
        totalReadingSeconds,
        totalActiveSeconds,
        booksCompleted,
        currentlyReading,
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

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized. Missing Bearer token." }, { status: 401 });
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    const verified = await verifyFirebaseIdToken(idToken);
    if (!verified || !verified.uid) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const uid = verified.uid;
    const body = await req.json();
    const { username, displayName, bio, photoURL, isPublic } = body;

    const adminDb = getFirebaseAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const now = Date.now();

    // If changing/claiming username:
    if (username) {
      const cleanNew = username
        .toLowerCase()
        .replace(/^@+/, "")
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 20);

      if (cleanNew.length < 3) {
        return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
      }

      // Check current username
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const currentUsername = userDoc.data()?.username;

      if (currentUsername !== cleanNew) {
        const checkDoc = await adminDb.collection("usernames").doc(cleanNew).get();
        if (checkDoc.exists && checkDoc.data()?.uid !== uid) {
          return NextResponse.json({ error: `@${cleanNew} is already taken.` }, { status: 409 });
        }

        // Release old username from registry if it belonged to this user
        if (currentUsername) {
          await adminDb.collection("usernames").doc(currentUsername).delete().catch(() => {});
        }

        // Claim new username
        await adminDb.collection("usernames").doc(cleanNew).set({
          uid,
          createdAt: now,
        });

        const userUpdates: Record<string, any> = {
          username: cleanNew,
          updatedAt: now,
        };
        if (displayName !== undefined) userUpdates.displayName = displayName.replace(/^@+/, "").trim();
        if (bio !== undefined) userUpdates.bio = bio.trim();
        if (photoURL !== undefined) userUpdates.photoURL = photoURL;

        const profileUpdates: Record<string, any> = {
          username: cleanNew,
          updatedAt: now,
        };
        if (displayName !== undefined) profileUpdates.displayName = displayName.replace(/^@+/, "").trim();
        if (bio !== undefined) profileUpdates.bio = bio.trim();
        if (photoURL !== undefined) profileUpdates.photoURL = photoURL;
        if (isPublic !== undefined) profileUpdates.isPublic = isPublic;

        await Promise.all([
          adminDb.collection("users").doc(uid).set(userUpdates, { merge: true }),
          adminDb.collection("public_profiles").doc(uid).set(profileUpdates, { merge: true }),
        ]);

        return NextResponse.json({ success: true, username: cleanNew });
      }
    }

    // Profile updates without username change
    const userUpdates: Record<string, any> = { updatedAt: now };
    if (displayName !== undefined) userUpdates.displayName = displayName.replace(/^@+/, "").trim();
    if (bio !== undefined) userUpdates.bio = bio.trim();
    if (photoURL !== undefined) userUpdates.photoURL = photoURL;

    const profileUpdates: Record<string, any> = { updatedAt: now };
    if (displayName !== undefined) profileUpdates.displayName = displayName.replace(/^@+/, "").trim();
    if (bio !== undefined) profileUpdates.bio = bio.trim();
    if (photoURL !== undefined) profileUpdates.photoURL = photoURL;
    if (isPublic !== undefined) profileUpdates.isPublic = isPublic;

    await Promise.all([
      adminDb.collection("users").doc(uid).set(userUpdates, { merge: true }),
      adminDb.collection("public_profiles").doc(uid).set(profileUpdates, { merge: true }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Profile API] PUT error:", err);
    return NextResponse.json({ error: err?.message || "Update failed." }, { status: 500 });
  }
}
