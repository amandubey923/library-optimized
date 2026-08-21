"use client";

import React, { useState, useRef } from "react";
import { Book } from "@/data/books";

interface PdfReaderProps {
  book: Book;
}

export default function PdfReader({ book }: PdfReaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen error:", err);
      });
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)] shadow-2xl flex flex-col transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "w-full h-[750px]"
      }`}
    >
      {/* Reader Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate max-w-[200px] sm:max-w-md">
              {book.title}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Reader Mode • {book.language}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Open Full PDF in New Tab */}
          <a
            href={book.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-medium border border-[var(--border)] transition-all"
            title="Open in new window"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>New Window</span>
          </a>

          {/* Download PDF */}
          <a
            href={book.pdf}
            download={`${book.title.replace(/\s+/g, "_")}.pdf`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/15 hover:bg-[var(--primary)] text-[var(--accent)] hover:text-[var(--primary-foreground)] text-xs font-semibold border border-[var(--accent)]/30 transition-all"
            title="Download PDF"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-medium border border-[var(--border)] transition-all cursor-pointer inline-flex items-center gap-1.5"
            title="Toggle Fullscreen"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Embedded PDF iframe */}
      <div className="flex-1 w-full h-full bg-[#1b1f2b] relative">
        <iframe
          src={`${book.pdf}#toolbar=1&navpanes=0&scrollbar=1`}
          title={`Reader for ${book.title}`}
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
