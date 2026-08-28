"use client";

import React from "react";
import { ADS_CONFIG, CONTENT_POLICY } from "@/lib/monetization-config";

interface AdPlaceholderProps {
  slotId?: string;
  format?: "banner" | "sidebar" | "responsive";
  className?: string;
  bookId?: string;
  isReviewRequired?: boolean;
}

/**
 * AdPlaceholder — Strict Policy Compliant Ad Container
 *
 * CRITICAL POLICY GUARDS:
 * 1. Strictly renders NULL if ADS_CONFIG.enabled is false.
 * 2. No external ad scripts (e.g. AdSense) load globally or locally.
 * 3. Zero layout shift (zero CLS) when disabled.
 * 4. Strictly forbids ads on books marked as review_required or non-legal modes.
 */
export default function AdPlaceholder({
  slotId,
  format = "responsive",
  className = "",
  bookId,
  isReviewRequired = false,
}: AdPlaceholderProps) {
  // Guard 1: Master toggle check
  if (!ADS_CONFIG.enabled) {
    return null;
  }

  // Guard 2: Publisher compliance guard (cannot serve ads in audit mode on unverified content)
  if (ADS_CONFIG.requiresLegalOnlyMode && CONTENT_POLICY.mode !== "legal_only") {
    return null;
  }

  // Guard 3: Never display ads on review-required titles
  if (isReviewRequired) {
    return null;
  }

  // When explicitly enabled and verified in the future:
  return (
    <div
      className={`my-4 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--text-secondary)] ${className}`}
      data-ad-slot={slotId}
      data-ad-format={format}
    >
      <span className="text-[10px] tracking-wider uppercase opacity-60 block mb-1">
        Sponsored
      </span>
      <div className="min-h-[90px] flex items-center justify-center">
        {/* Future verified ad unit insertion point */}
      </div>
    </div>
  );
}
