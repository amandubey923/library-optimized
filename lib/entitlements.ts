import { PlanId, getPlanConfig } from "./monetization-config";

export interface UserEntitlement {
  plan: PlanId;
  status: "active" | "expired" | "none";
  billingType: "one_time_pass" | "one_time_support" | "free";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  purchasedAt?: number;
  expiresAt?: number | null; // Timestamp in ms; null for lifetime support/free
  isPro: boolean;
  isSupporter: boolean;
}

export const DEFAULT_FREE_ENTITLEMENT: UserEntitlement = {
  plan: "FREE",
  status: "none",
  billingType: "free",
  isPro: false,
  isSupporter: false,
  expiresAt: null,
};

/**
 * Check if a given entitlement is currently valid and active
 */
export function isEntitlementActive(entitlement?: UserEntitlement | null): boolean {
  if (!entitlement) return false;
  if (entitlement.status !== "active") return false;
  if (!entitlement.isPro && !entitlement.isSupporter) return false;

  // Check expiration for time-limited passes
  if (entitlement.expiresAt && Date.now() > entitlement.expiresAt) {
    return false;
  }

  return true;
}

/**
 * Construct an authoritative entitlement object from a verified purchase
 */
export function constructPurchasedEntitlement(
  planId: PlanId,
  orderId: string,
  paymentId: string
): UserEntitlement {
  const plan = getPlanConfig(planId);
  if (!plan) return DEFAULT_FREE_ENTITLEMENT;

  const now = Date.now();
  const isPass = plan.billingType === "one_time_pass";
  const isSupport = plan.billingType === "one_time_support";

  const expiresAt = isPass && plan.durationDays > 0
    ? now + plan.durationDays * 24 * 60 * 60 * 1000
    : null;

  return {
    plan: planId,
    status: "active",
    billingType: plan.billingType,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    purchasedAt: now,
    expiresAt,
    isPro: isPass,
    isSupporter: isSupport || isPass,
  };
}

/**
 * Server-side verification of Firebase ID Token
 * Validates the caller's authentic user identity without trusting client claims.
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email?: string } | null> {
  if (!idToken || typeof idToken !== "string") return null;

  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    "AIzaSyAra6EtrcmmrfYnxoBFQFSD-YKRiNjbhdQ";

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      console.warn("[Auth Verification] Token lookup returned status:", res.status);
      return null;
    }

    const data = await res.json();
    if (data.users && data.users[0]) {
      const user = data.users[0];
      return {
        uid: user.localId,
        email: user.email,
      };
    }
  } catch (err) {
    console.error("[Auth Verification] Error verifying token:", err);
  }

  return null;
}
