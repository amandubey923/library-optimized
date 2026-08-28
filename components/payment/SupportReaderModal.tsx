"use client";

import React, { useState } from "react";
import { useEntitlement } from "@/context/EntitlementContext";
import { PlanId } from "@/lib/monetization-config";

export default function SupportReaderModal() {
  const { isSupportModalOpen, closeSupportModal, initiateCheckout, isCheckoutLoading } = useEntitlement();
  const [selectedTip, setSelectedTip] = useState<PlanId>("SUPPORT_49");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isSupportModalOpen) return null;

  const handleSupport = async () => {
    setErrorMessage(null);
    const result = await initiateCheckout(selectedTip);
    if (!result.success && result.error && result.error !== "Payment was cancelled.") {
      setErrorMessage(result.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={closeSupportModal}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl shadow-black/60 p-6 sm:p-8 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeSupportModal}
          className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
            💛
          </div>
          <h2 className="text-2xl font-bold font-serif text-[var(--foreground)]">
            Support Reader&apos;s HUB
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Reader&apos;s HUB is a community library offering free classical books, Hindi literature, and philosophical works with zero ads. Your voluntary tip keeps it free and growing.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            onClick={() => setSelectedTip("SUPPORT_49")}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              selectedTip === "SUPPORT_49"
                ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
                : "border-[var(--border)] bg-[var(--background)]/60 hover:border-amber-500/40"
            }`}
          >
            <div className="text-lg mb-1">☕</div>
            <div className="text-xl font-bold font-serif text-[var(--foreground)]">₹49</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Cup of Chai</div>
          </div>

          <div
            onClick={() => setSelectedTip("SUPPORT_99")}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              selectedTip === "SUPPORT_99"
                ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
                : "border-[var(--border)] bg-[var(--background)]/60 hover:border-amber-500/40"
            }`}
          >
            <div className="text-lg mb-1">📚</div>
            <div className="text-xl font-bold font-serif text-[var(--foreground)]">₹99</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Book Patron</div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleSupport}
            disabled={isCheckoutLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCheckoutLoading ? (
              <span>Connecting to Gateway...</span>
            ) : (
              <span>Send Voluntary Support ({selectedTip === "SUPPORT_99" ? "₹99" : "₹49"}) ✨</span>
            )}
          </button>

          <button
            onClick={closeSupportModal}
            className="w-full py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors text-center cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
