import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/follow?uid=<uid>
 * Returns authentic aggregate follower and following counts directly from the follows collection.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid parameter." }, { status: 400 });
  }

  const adminDb = getFirebaseAdminFirestore();
  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  try {
    const [followersSnap, followingSnap] = await Promise.all([
      adminDb.collection("follows").where("followingUid", "==", uid).count().get(),
      adminDb.collection("follows").where("followerUid", "==", uid).count().get(),
    ]);

    const followersCount = followersSnap.data().count || 0;
    const followingCount = followingSnap.data().count || 0;

    return NextResponse.json({
      uid,
      followersCount,
      followingCount,
    });
  } catch (err: any) {
    console.error("[Follow API GET] Error counting follows:", err);
    return NextResponse.json({ error: "Failed to retrieve follow counts." }, { status: 500 });
  }
}

/**
 * POST /api/users/follow
 * Handles follow/unfollow actions with Firebase Admin privileges,
 * updating the follows collection and synchronizing public_profiles counts.
 */
export async function POST(req: NextRequest) {
  const adminDb = getFirebaseAdminFirestore();
  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { followerUid, targetUid, action } = body;

    if (!followerUid || !targetUid) {
      return NextResponse.json({ error: "Missing followerUid or targetUid." }, { status: 400 });
    }

    if (followerUid === targetUid) {
      return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 });
    }

    if (action !== "follow" && action !== "unfollow") {
      return NextResponse.json({ error: "Invalid action. Must be 'follow' or 'unfollow'." }, { status: 400 });
    }

    const followId = `${followerUid}_${targetUid}`;
    const followDocRef = adminDb.collection("follows").doc(followId);

    if (action === "follow") {
      await followDocRef.set({
        followerUid,
        followingUid: targetUid,
        createdAt: Date.now(),
      });
    } else {
      await followDocRef.delete();
    }

    // Compute updated authentic counts for both users
    const [targetFollowersSnap, targetFollowingSnap, followerFollowersSnap, followerFollowingSnap] =
      await Promise.all([
        adminDb.collection("follows").where("followingUid", "==", targetUid).count().get(),
        adminDb.collection("follows").where("followerUid", "==", targetUid).count().get(),
        adminDb.collection("follows").where("followingUid", "==", followerUid).count().get(),
        adminDb.collection("follows").where("followerUid", "==", followerUid).count().get(),
      ]);

    const targetFollowers = targetFollowersSnap.data().count || 0;
    const targetFollowing = targetFollowingSnap.data().count || 0;
    const followerFollowers = followerFollowersSnap.data().count || 0;
    const followerFollowing = followerFollowingSnap.data().count || 0;

    // Synchronize public_profiles docs in background with Admin SDK (bypassing client rule blocks)
    await Promise.allSettled([
      adminDb.collection("public_profiles").doc(targetUid).set(
        {
          followersCount: targetFollowers,
          followingCount: targetFollowing,
          updatedAt: Date.now(),
        },
        { merge: true }
      ),
      adminDb.collection("public_profiles").doc(followerUid).set(
        {
          followersCount: followerFollowers,
          followingCount: followerFollowing,
          updatedAt: Date.now(),
        },
        { merge: true }
      ),
    ]);

    return NextResponse.json({
      success: true,
      isFollowing: action === "follow",
      targetUid,
      targetFollowers,
      targetFollowing,
      followerUid,
      followerFollowers,
      followerFollowing,
    });
  } catch (err: any) {
    console.error("[Follow API POST] Error executing follow action:", err);
    return NextResponse.json({ error: "Follow action failed." }, { status: 500 });
  }
}

