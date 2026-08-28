"use client";

import React from "react";
import { useEntitlement } from "@/context/EntitlementContext";

export default function ProPaymentStatusModal() {
  const {
    isPaymentStatusModalOpen,
    closePaymentStatusModal,
    openSupportModal,
  } = useEntitlement();

  if (!isPaymentStatusModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left"
      onClick={closePaymentStatusModal}
    >
      <div
        className="relative w-full max-w-md my-auto rounded-3xl bg-[var(--card)] border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden animate-scale-up text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closePaymentStatusModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Badge & Status Indicator */}
        <div className="space-y-3 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <span>✨</span>
            <span>Reader Pro</span>
          </div>

          <h2 className="text-2xl font-bold font-serif text-[var(--foreground)]">
            Payment currently unavailable
          </h2>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-medium text-amber-300/90">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Temporarily unavailable</span>
          </div>
        </div>

        {/* Clear, Trustworthy Message */}
        <div className="p-4 rounded-2xl bg-[var(--background)]/70 border border-[var(--border)] mb-6 text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
          <p>
            We&apos;re completing payment verification for <strong>Reader&apos;s HUB</strong>.
          </p>
          <p>
            Pro payments will be available once verification is complete. In the meantime, reading all public library books remains 100% free with no login required.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={closePaymentStatusModal}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            Got it
          </button>

          <button
            type="button"
            onClick={() => {
              closePaymentStatusModal();
              openSupportModal();
            }}
            className="w-full py-2 text-xs font-semibold text-amber-400/90 hover:text-amber-300 transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>💛</span>
            <span>Support Reader&apos;s HUB via UPI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
