"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { BookCompletionCertificate } from "@/lib/certificate";

interface CompletionCertificateModalProps {
  certificate: BookCompletionCertificate | null;
  isOpen: boolean;
  onClose: () => void;
  isNewUnlock?: boolean;
}

export default function CompletionCertificateModal({
  certificate,
  isOpen,
  onClose,
  isNewUnlock = false,
}: CompletionCertificateModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !certificate || !mounted) return null;

  const formattedDate = new Date(certificate.completedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hours = Math.floor(certificate.verifiedReadingSeconds / 3600);
  const minutes = Math.floor((certificate.verifiedReadingSeconds % 3600) / 60);
  const readingDurationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} mins`;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareText = `🎓 I just officially completed "${certificate.bookTitle}" by ${certificate.bookAuthor} on Reader's HUB! Verified Certificate: ${certificate.issueNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate of Completion - ${certificate.bookTitle}`,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      } catch {
        // Ignored
      }
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      {/* Backdrop Dismiss */}
      <div className="fixed inset-0 print:hidden" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl z-10 flex flex-col items-center gap-4 my-auto print:max-w-none print:m-0">
        {/* Celebration Banner when newly unlocked */}
        {isNewUnlock && (
          <div className="w-full text-center space-y-1 animate-bounce-subtle print:hidden">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-extrabold shadow-lg">
              <span>✨</span>
              <span>MAGNUM OPUS COMPLETED &bull; CERTIFICATE ISSUED</span>
              <span>✨</span>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="w-full flex items-center justify-between gap-2 px-2 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs sm:text-[13px] shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="Print or Save as high-resolution PDF"
            >
              <span>🖨️</span>
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] font-bold text-xs sm:text-[13px] shadow-sm flex items-center gap-2 cursor-pointer transition-all hover:border-[var(--accent)]/40"
            >
              <span>{copySuccess ? "✓ Copied" : "🔗 Share"}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--card)] hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-400 border border-[var(--border)] hover:border-rose-500/40 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow-sm"
            aria-label="Close certificate modal"
          >
            ✕
          </button>
        </div>

        {/* -------------------------------------------------------------
         * LUXURY CERTIFICATE CONTAINER (Embossed Gold / Obsidian Theme)
         * ------------------------------------------------------------- */}
        <div
          ref={certRef}
          className="relative w-full aspect-[1.414/1] min-h-[520px] sm:min-h-[580px] p-6 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0f141c] via-[#141b26] to-[#0a0d13] text-[#e8e4dc] border-4 border-[#bfa15f] shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden print:border-[#bfa15f] print:shadow-none print:w-full print:rounded-none"
          style={{
            boxShadow: "0 0 45px rgba(191, 161, 95, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Inner Filigree Border */}
          <div className="absolute inset-2.5 sm:inset-4 border border-[#bfa15f]/40 pointer-events-none rounded-2xl" />
          <div className="absolute inset-3.5 sm:inset-5 border border-dashed border-[#bfa15f]/25 pointer-events-none rounded-xl" />

          {/* Corner Decorative Ornaments */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-[#bfa15f] font-serif text-xl sm:text-2xl select-none opacity-80">
            ❖
          </div>
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[#bfa15f] font-serif text-xl sm:text-2xl select-none opacity-80">
            ❖
          </div>
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-[#bfa15f] font-serif text-xl sm:text-2xl select-none opacity-80">
            ❖
          </div>
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 text-[#bfa15f] font-serif text-xl sm:text-2xl select-none opacity-80">
            ❖
          </div>

          {/* Subtle Watermark Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none text-[160px] sm:text-[240px] font-serif">
            📖
          </div>

          {/* 1. Certificate Header */}
          <div className="text-center space-y-1 sm:space-y-1.5 relative z-10">
            <div className="flex items-center justify-center gap-2">
              <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent to-[#bfa15f]" />
              <span className="text-[10px] sm:text-xs tracking-[0.35em] text-[#d4af37] font-bold uppercase font-serif">
                READER&apos;S HUB &bull; LITERARY GUILD
              </span>
              <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-l from-transparent to-[#bfa15f]" />
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#f7e7b4] via-[#e5c158] to-[#bfa15f] uppercase drop-shadow-sm">
              Certificate of Literary Mastery
            </h1>

            <p className="text-[10px] sm:text-xs tracking-widest text-[#a8b0bd] font-serif uppercase">
              Official Verification of Complete Volume Study
            </p>
          </div>

          {/* 2. Recipient & Statement Body */}
          <div className="text-center space-y-3 sm:space-y-4 my-auto relative z-10 px-2 sm:px-8">
            <p className="text-xs sm:text-sm font-serif italic text-[#c8d0dc]">
              This is to certify with full honors that
            </p>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-extrabold text-[#fbf8f0] tracking-wide underline decoration-[#bfa15f]/60 decoration-2 underline-offset-8">
                {certificate.recipientName}
              </h2>
              {certificate.recipientUsername && (
                <p className="text-[11px] sm:text-xs font-mono text-[#bfa15f] pt-1">
                  @{certificate.recipientUsername}
                </p>
              )}
            </div>

            <p className="text-xs sm:text-[13px] font-serif text-[#c8d0dc] max-w-xl mx-auto leading-relaxed pt-1">
              has conscientiously studied and successfully completed every chapter of the celebrated masterwork:
            </p>

            {/* Book Title Highlight */}
            <div className="py-2.5 sm:py-3 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-transparent via-[#bfa15f]/15 to-transparent border-y border-[#bfa15f]/30 inline-block max-w-2xl">
              <h3 className="text-lg sm:text-2xl font-serif font-black text-amber-200 tracking-wide">
                &ldquo;{certificate.bookTitle}&rdquo;
              </h3>
              <p className="text-xs sm:text-sm font-serif text-[#e0d6c3] mt-0.5">
                by {certificate.bookAuthor}
              </p>
            </div>
          </div>

          {/* 3. Verified Metrics & Official Crest */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center py-2 sm:py-3 border-y border-[#bfa15f]/30 relative z-10 max-w-xl mx-auto w-full">
            <div className="space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#8e98a8] block">
                Pages Completed
              </span>
              <span className="text-xs sm:text-base font-bold font-mono text-[#e5c158]">
                {certificate.totalPages} Pages
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#8e98a8] block">
                Focus Duration
              </span>
              <span className="text-xs sm:text-base font-bold font-mono text-emerald-400">
                {readingDurationStr}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#8e98a8] block">
                Conferred On
              </span>
              <span className="text-xs sm:text-base font-bold font-mono text-[#e5c158]">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* 4. Official Seal, Signature & Verification Hash */}
          <div className="flex items-end justify-between gap-4 pt-4 sm:pt-6 relative z-10 text-left">
            {/* Left: Verification Hash & Certificate ID */}
            <div className="space-y-1 min-w-0">
              <div className="text-[9px] sm:text-[10px] font-mono text-[#8e98a8]">
                <span>VERIFICATION HASH: </span>
                <span className="text-[#bfa15f] font-bold">{certificate.verificationHash}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] font-mono text-[#8e98a8]">
                <span>CREDENTIAL NO: </span>
                <span className="text-white">{certificate.issueNumber}</span>
              </div>
              <div className="text-[8px] sm:text-[9px] text-[#717d8f] flex items-center gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified by Reader&apos;s HUB Cryptographic Telemetry</span>
              </div>
            </div>

            {/* Center: Gold Foil Embossed Seal Ribbon */}
            <div className="flex flex-col items-center justify-center flex-shrink-0">
              <div className="relative w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#f5df9e] via-[#d4af37] to-[#8c6d23] p-0.5 shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center text-center">
                <div className="w-full h-full rounded-full border border-black/20 flex flex-col items-center justify-center p-1 bg-[#10151f]">
                  <span className="text-xs sm:text-sm">👑</span>
                  <span className="text-[6px] sm:text-[7px] font-extrabold uppercase tracking-tighter text-[#e5c158] font-serif leading-none mt-0.5">
                    OFFICIAL SEAL
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Signature & Seal Line */}
            <div className="text-right space-y-1 min-w-0">
              <div className="text-xs sm:text-sm font-serif italic text-amber-200 tracking-wider font-bold">
                Aman Dubey
              </div>
              <div className="w-28 sm:w-36 h-[1px] bg-[#bfa15f]/60 ml-auto" />
              <p className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#8e98a8] font-serif">
                Director of Studies &bull; Reader&apos;s HUB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

