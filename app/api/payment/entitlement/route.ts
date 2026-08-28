import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken, DEFAULT_FREE_ENTITLEMENT } from "@/lib/entitlements";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({
        success: true,
        entitlement: DEFAULT_FREE_ENTITLEMENT,
        authenticated: false,
      });
    }

    const idToken = authHeader.slice(7).trim();
    const verified = await verifyFirebaseIdToken(idToken);

    if (!verified) {
      return NextResponse.json({
        success: true,
        entitlement: DEFAULT_FREE_ENTITLEMENT,
        authenticated: false,
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      uid: verified.uid,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to query entitlement." }, { status: 500 });
  }
}