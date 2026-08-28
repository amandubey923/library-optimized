"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useEntitlement } from "@/context/EntitlementContext";
import { UPI_SUPPORT_CONFIG } from "@/lib/monetization-config";

export default function SupportReaderModal() {
  const { isSupportModalOpen, closeSupportModal } = useEntitlement();
  const [selectedAmount, setSelectedAmount] = useState<number>(49);
  const [copied, setCopied] = useState<boolean>(false);
  const [hasNotifiedSupport, setHasNotifiedSupport] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    if (!isSupportModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSupportModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSupportModalOpen, closeSupportModal]);

  if (!isSupportModalOpen) return null;

  const upiId = UPI_SUPPORT_CONFIG.supportUPIId; // 8969230625@ibl
  const payeeName = UPI_SUPPORT_CONFIG.payeeName;
  const qrImagePath = UPI_SUPPORT_CONFIG.qrImagePath || "/images/support-qr1.jpg";

  // Standard direct UPI Intent URI (dynamically updates with selected amount)
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${selectedAmount}&cu=INR&tn=${encodeURIComponent("Support Readers HUB Library")}`;

  const handleCopyUpiId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(upiId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleSupportConfirmation = () => {
    setHasNotifiedSupport(true);
    setTimeout(() => {
      setHasNotifiedSupport(false);
      closeSupportModal();
    }, 2800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left overflow-y-auto"
      onClick={closeSupportModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
    >
      <div
        className="relative w-full max-w-md my-auto rounded-3xl bg-[var(--card)] border border-amber-500/30 p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Warm Accent Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeSupportModal}
          className="absolute top-3.5 right-3.5 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-xl shadow-inner">
            💛
          </div>
          <h2 id="support-modal-title" className="text-xl sm:text-2xl font-bold font-serif text-[var(--foreground)]">
            {UPI_SUPPORT_CONFIG.title}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
            {UPI_SUPPORT_CONFIG.subtitle}
          </p>
        </div>

        {/* Concise Bilingual Advisory Box */}
        <div className="mb-3.5 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left space-y-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
          <p>
            <strong className="text-[var(--foreground)] font-semibold">Read Before You Pay:</strong> Reader&apos;s HUB is free to read. ₹49 / ₹99 is only a voluntary donation and does not unlock Pro or Premium features.
          </p>
          <p className="pt-1 border-t border-amber-500/10 text-[10.5px]">
            <strong className="text-[var(--foreground)] font-semibold">भुगतान करने से पहले पढ़ें:</strong> Reader&apos;s HUB पर पढ़ना free है। ₹49 / ₹99 केवल voluntary donation है; इससे Pro या Premium features unlock नहीं होते।
          </p>
        </div>

        {/* Amount Selector */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-1.5 text-center">
            Select Voluntary Tip Amount
          </label>
          <div className="grid grid-cols-2 gap-2">
            {UPI_SUPPORT_CONFIG.amounts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedAmount(item.amount)}
                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedAmount === item.amount
                    ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40 text-[var(--foreground)] font-bold shadow-xs"
                    : "border-[var(--border)] bg-[var(--background)]/60 text-[var(--text-secondary)] hover:border-amber-500/30"
                }`}
              >
                <div className="text-sm font-bold text-amber-400">₹{item.amount}</div>
                <div className="text-[10px] opacity-80">{item.label.split("(")[1]?.replace(")", "") || "Voluntary"}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Priority: Instant Pay via Installed UPI App Button */}
        <div className="block sm:hidden mb-4">
          <a
            href={upiIntentUri}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-center"
          >
            <span>📱</span>
            <span>Pay ₹{selectedAmount} via Installed UPI App</span>
          </a>
        </div>

        {/* QR Code Container */}
        <div className="mb-4 flex flex-col items-center justify-center">
          <div className="relative p-2.5 rounded-2xl bg-zinc-950 border border-amber-500/30 shadow-lg shadow-black/60 max-w-[220px] w-full overflow-hidden flex items-center justify-center">
            <Image
              src={qrImagePath}
              alt="Support Reader's HUB via UPI QR"
              width={220}
              height={330}
              style={{ width: "100%", height: "auto" }}
              className="rounded-xl object-contain"
              priority
            />
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-2 font-medium">
            Scan with GPay, PhonePe, Paytm or BHIM
          </p>
        </div>

        {/* Desktop / Tablet Pay Button */}
        <div className="hidden sm:block mb-4">
          <a
            href={upiIntentUri}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all text-center"
          >
            <span>📱</span>
            <span>Pay ₹{selectedAmount} via Installed UPI App</span>
          </a>
        </div>

        {/* Centralized UPI ID with 1-Click Copy */}
        <div className="mb-4 p-2.5 rounded-xl bg-[var(--secondary)]/70 border border-[var(--border)] flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-secondary)] block">
              Official UPI ID
            </span>
            <code className="text-xs font-mono font-bold text-[var(--foreground)] truncate block select-all">
              {upiId}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopyUpiId}
            className="px-3 py-1.5 rounded-lg bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] text-xs font-bold text-[var(--accent)] transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-xs"
          >
            {copied ? "✓ Copied!" : "Copy UPI ID"}
          </button>
        </div>

        {/* Feedback / Action */}
        <div className="space-y-2">
          {hasNotifiedSupport ? (
            <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs text-center animate-fade-in flex items-center justify-center gap-2">
              <span>❤️</span>
              <span>Thank you so much for supporting Reader&apos;s HUB!</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSupportConfirmation}
              className="w-full py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-amber-500/40 text-xs font-semibold transition-all cursor-pointer"
            >
              I&apos;ve Sent a Tip ♡
            </button>
          )}

          <p className="text-[10px] text-center text-[var(--text-secondary)]/70 leading-relaxed">
            {UPI_SUPPORT_CONFIG.note}
          </p>
        </div>
      </div>
    </div>
  );
}
