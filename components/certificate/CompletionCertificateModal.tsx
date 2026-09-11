"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

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
  const readingDurationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes > 0 ? minutes : 15} mins`;

  const handlePrint = () => {
    window.print();
  };

  /**
   * Generates and downloads a genuine, high-resolution vector PDF using pdf-lib
   */
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

      // Landscape A4 Dimensions (842 x 595 pt)
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([842, 595]);
      const { width, height } = page.getSize();

      const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

      // 1. Deep Obsidian Luxury Canvas
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(15 / 255, 20 / 255, 28 / 255),
      });

      // 2. Outer Gold Leaf Border
      page.drawRectangle({
        x: 22,
        y: 22,
        width: width - 44,
        height: height - 44,
        borderColor: rgb(191 / 255, 161 / 255, 95 / 255),
        borderWidth: 3,
      });

      // 3. Inner Gold Filigree Line
      page.drawRectangle({
        x: 30,
        y: 30,
        width: width - 60,
        height: height - 60,
        borderColor: rgb(191 / 255, 161 / 255, 95 / 255),
        borderWidth: 1,
      });

      // Helper for centered text
      const drawCenteredText = (text: string, y: number, font: any, size: number, color: any) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y,
          size,
          font,
          color,
        });
      };

      // Header Banner
      drawCenteredText(
        "R E A D E R ' S   H U B   •   L I T E R A R Y   G U I L D",
        height - 75,
        fontSansBold,
        9,
        rgb(212 / 255, 175 / 255, 55 / 255)
      );

      // Certificate Title
      drawCenteredText(
        "CERTIFICATE OF LITERARY MASTERY",
        height - 118,
        fontSerifBold,
        28,
        rgb(247 / 255, 231 / 255, 180 / 255)
      );

      drawCenteredText(
        "OFFICIAL VERIFICATION OF COMPLETE VOLUME STUDY",
        height - 138,
        fontSans,
        9,
        rgb(168 / 255, 176 / 255, 189 / 255)
      );

      // Conferred Statement
      drawCenteredText(
        "This official credential is proudly conferred upon",
        height - 180,
        fontSerifItalic,
        13,
        rgb(200 / 255, 208 / 255, 220 / 255)
      );

      // Recipient Name
      drawCenteredText(
        certificate.recipientName,
        height - 225,
        fontSerifBold,
        34,
        rgb(251 / 255, 248 / 255, 240 / 255)
      );

      if (certificate.recipientUsername) {
        drawCenteredText(
          `@${certificate.recipientUsername}`,
          height - 245,
          fontMono,
          10,
          rgb(191 / 255, 161 / 255, 95 / 255)
        );
      }

      // Achievement Statement
      drawCenteredText(
        "for successfully reading and completing every chapter of the acclaimed work:",
        height - 280,
        fontSerif,
        12,
        rgb(200 / 255, 208 / 255, 220 / 255)
      );

      // Book Title
      drawCenteredText(
        `"${certificate.bookTitle}"`,
        height - 322,
        fontSerifBold,
        22,
        rgb(245 / 255, 223 / 255, 158 / 255)
      );

      drawCenteredText(
        `by ${certificate.bookAuthor}`,
        height - 344,
        fontSerifItalic,
        13,
        rgb(224 / 255, 214 / 255, 195 / 255)
      );

      // Statistics Row
      const statY = height - 400;
      page.drawRectangle({
        x: 140,
        y: statY - 10,
        width: width - 280,
        height: 38,
        color: rgb(24 / 255, 32 / 255, 45 / 255),
        borderColor: rgb(191 / 255, 161 / 255, 95 / 255),
        borderWidth: 0.5,
      });

      // Stat 1: Pages
      page.drawText("PAGES COMPLETED", { x: 170, y: statY + 14, size: 7.5, font: fontSansBold, color: rgb(142 / 255, 152 / 255, 168 / 255) });
      page.drawText(`${certificate.totalPages} Pages`, { x: 170, y: statY + 1, size: 11, font: fontMono, color: rgb(245 / 255, 223 / 255, 158 / 255) });

      // Stat 2: Duration
      page.drawText("STUDY TIME", { x: 390, y: statY + 14, size: 7.5, font: fontSansBold, color: rgb(142 / 255, 152 / 255, 168 / 255) });
      page.drawText(readingDurationStr, { x: 390, y: statY + 1, size: 11, font: fontMono, color: rgb(52 / 255, 211 / 255, 153 / 255) });

      // Stat 3: Date
      page.drawText("CONFERRED ON", { x: 575, y: statY + 14, size: 7.5, font: fontSansBold, color: rgb(142 / 255, 152 / 255, 168 / 255) });
      page.drawText(formattedDate, { x: 575, y: statY + 1, size: 11, font: fontMono, color: rgb(245 / 255, 223 / 255, 158 / 255) });

      // Footer: Verification & Signatures
      page.drawText(`VERIFICATION HASH: ${certificate.verificationHash}`, {
        x: 50,
        y: 75,
        size: 8,
        font: fontMono,
        color: rgb(191 / 255, 161 / 255, 95 / 255),
      });

      page.drawText(`CREDENTIAL NO: ${certificate.issueNumber}`, {
        x: 50,
        y: 60,
        size: 8,
        font: fontMono,
        color: rgb(255 / 255, 255 / 255, 255 / 255),
      });

      page.drawText("Verified by Reader's HUB Telemetry • Cryptographically Conferred", {
        x: 50,
        y: 45,
        size: 7,
        font: fontSans,
        color: rgb(113 / 255, 125 / 255, 143 / 255),
      });

      // Right Signature
      page.drawText("Aman Dubey", {
        x: width - 210,
        y: 75,
        size: 14,
        font: fontSerifItalic,
        color: rgb(245 / 255, 223 / 255, 158 / 255),
      });

      page.drawLine({
        start: { x: width - 220, y: 68 },
        end: { x: width - 50, y: 68 },
        thickness: 0.8,
        color: rgb(191 / 255, 161 / 255, 95 / 255),
      });

      page.drawText("Director of Studies • Reader's HUB", {
        x: width - 210,
        y: 53,
        size: 7.5,
        font: fontSans,
        color: rgb(142 / 255, 152 / 255, 168 / 255),
      });

      // Center Seal Crest
      drawCenteredText("★ OFFICIAL SEAL ★", 65, fontSansBold, 7, rgb(212 / 255, 175 / 255, 55 / 255));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanTitle = certificate.bookTitle.replace(/[^a-zA-Z0-9]/g, "_");
      link.download = `Certificate_${cleanTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[Certificate] PDF generation error:", err);
      // Fallback to browser print if client PDF fails
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    const shareText = `🎓 I have officially read and graduated "${certificate.bookTitle}" by ${certificate.bookAuthor} on Reader's HUB! Verification Credential: ${certificate.issueNumber}`;
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
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-xl animate-fade-in print:p-0 print:bg-white ${
        isFullscreen ? "p-0!" : ""
      }`}
    >
      {/* Backdrop Dismiss */}
      {!isFullscreen && <div className="fixed inset-0 print:hidden" onClick={onClose} />}

      {/* Modal Container */}
      <div
        className={`relative w-full z-10 flex flex-col items-center gap-4 my-auto transition-all print:max-w-none print:m-0 ${
          isFullscreen
            ? "max-w-none w-full h-full justify-between p-4 sm:p-8 bg-[#0a0d13]"
            : "max-w-4xl"
        }`}
      >
        {/* Celebration Banner when newly unlocked */}
        {isNewUnlock && (
          <div className="w-full text-center space-y-1 animate-bounce-subtle print:hidden">
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-extrabold shadow-xl">
              <span>✨</span>
              <span>MAGNUM OPUS COMPLETED &bull; OFFICIAL CERTIFICATE ISSUED</span>
              <span>✨</span>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="w-full flex items-center justify-between gap-2 px-2 print:hidden flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct High-Res PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-black text-xs sm:text-[13px] shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Download official high-resolution PDF certificate"
            >
              <span>{isGeneratingPdf ? "⏳" : "📥"}</span>
              <span>{isGeneratingPdf ? "Generating PDF..." : "Download PDF Certificate"}</span>
            </button>

            {/* Print / Save PDF fallback */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] font-bold text-xs sm:text-[13px] shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:border-[var(--accent)]/40"
              title="Print certificate"
            >
              <span>🖨️ Print</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] font-bold text-xs sm:text-[13px] shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:border-[var(--accent)]/40"
            >
              <span>{copySuccess ? "✓ Copied" : "🔗 Share"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Full-Screen Toggle */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="px-3 py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title={isFullscreen ? "Exit Fullscreen" : "View in Fullscreen"}
            >
              <span>{isFullscreen ? "⤢" : "⛶"}</span>
              <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--card)] hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-400 border border-[var(--border)] hover:border-rose-500/40 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow-sm"
              aria-label="Close certificate modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------
         * LUXURY CERTIFICATE CANVAS (Embossed Gold / Obsidian Theme)
         * ------------------------------------------------------------- */}
        <div
          ref={certRef}
          className={`relative w-full aspect-[1.414/1] min-h-[540px] sm:min-h-[600px] p-6 sm:p-12 md:p-14 rounded-3xl bg-gradient-to-b from-[#0f141c] via-[#141b26] to-[#0a0d13] text-[#e8e4dc] border-4 border-[#bfa15f] shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden print:border-[#bfa15f] print:shadow-none print:w-full print:rounded-none ${
            isFullscreen ? "max-w-5xl my-auto" : ""
          }`}
          style={{
            boxShadow: "0 0 50px rgba(191, 161, 95, 0.25), inset 0 0 70px rgba(0, 0, 0, 0.8)",
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
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-[160px] sm:text-[260px] font-serif">
            📖
          </div>

          {/* 1. Certificate Header */}
          <div className="text-center space-y-1 sm:space-y-1.5 relative z-10">
            <div className="flex items-center justify-center gap-2">
              <span className="w-8 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#bfa15f]" />
              <span className="text-[10px] sm:text-xs tracking-[0.35em] text-[#d4af37] font-bold uppercase font-serif">
                READER&apos;S HUB &bull; LITERARY GUILD
              </span>
              <span className="w-8 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#bfa15f]" />
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#f7e7b4] via-[#e5c158] to-[#bfa15f] uppercase drop-shadow-sm">
              Certificate of Literary Mastery
            </h1>

            <p className="text-[9.5px] sm:text-xs tracking-widest text-[#a8b0bd] font-serif uppercase">
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
              has conscientiously studied and successfully completed every chapter of the celebrated volume:
            </p>

            {/* Book Title Highlight */}
            <div className="py-2.5 sm:py-3 px-4 sm:px-8 rounded-2xl bg-gradient-to-r from-transparent via-[#bfa15f]/15 to-transparent border-y border-[#bfa15f]/30 inline-block max-w-2xl">
              <h3 className="text-lg sm:text-2xl font-serif font-black text-amber-200 tracking-wide">
                &ldquo;{certificate.bookTitle}&rdquo;
              </h3>
              <p className="text-xs sm:text-sm font-serif text-[#e0d6c3] mt-0.5">
                by {certificate.bookAuthor}
              </p>
            </div>
          </div>

          {/* 3. Verified Metrics Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center py-2.5 sm:py-3.5 border-y border-[#bfa15f]/30 relative z-10 max-w-xl mx-auto w-full bg-black/20 rounded-xl">
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
                <span>Verified by Reader&apos;s HUB Telemetry</span>
              </div>
            </div>

            {/* Center: Gold Foil Embossed Seal Ribbon */}
            <div className="flex flex-col items-center justify-center flex-shrink-0">
              <div className="relative w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#f5df9e] via-[#d4af37] to-[#8c6d23] p-0.5 shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center text-center">
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
