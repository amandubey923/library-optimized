"use client";

import React, { useState, useRef, useEffect } from "react";
import { Book } from "@/data/books";

interface PdfReaderProps {
  book: Book;
}

export default function PdfReader({ book }: PdfReaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readerAtmosphere, setReaderAtmosphere] = useState<"dark" | "sepia" | "midnight">("dark");
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Determine iframe container background based on atmosphere
  const atmosphereStyles = {
    dark: "bg-[#0e1017]",
    sepia: "bg-[#2b251e]",
    midnight: "bg-[#060813]",
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--background)] shadow-2xl flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "w-full h-[780px]"
      }`}
    >
      {/* Reader Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--card)]/95 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="text-xs sm:text-sm font-bold text-[var(--foreground)] truncate max-w-[180px] sm:max-w-md">
              {book.title}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-normal flex items-center gap-1.5">
              <span>{book.author}</span>
              <span>•</span>
              <span>{book.pages} pages</span>
            </span>
          </div>
        </div>

        {/* Atmosphere and Action Controls */}
        <div className="flex items-center gap-2">
          {/* Atmosphere Mode Selector */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[10px]">
            <button
              onClick={() => setReaderAtmosphere("dark")}
              className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                readerAtmosphere === "dark" ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs" : "text-[var(--text-secondary)]"
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setReaderAtmosphere("sepia")}
              className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                readerAtmosphere === "sepia" ? "bg-[#3e3428] text-amber-200 shadow-xs" : "text-[var(--text-secondary)]"
              }`}
            >
              Sepia
            </button>
            <button
              onClick={() => setReaderAtmosphere("midnight")}
              className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                readerAtmosphere === "midnight" ? "bg-[#0b1026] text-cyan-300 shadow-xs" : "text-[var(--text-secondary)]"
              }`}
            >
              Midnight
            </button>
          </div>

          {/* Open Full PDF in New Tab */}
          <a
            href={book.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-medium border border-[var(--border)] transition-all"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)]/15 hover:bg-[var(--primary)] text-[var(--accent)] hover:text-[var(--primary-foreground)] text-xs font-bold border border-[var(--accent)]/30 transition-all shadow-xs"
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
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all cursor-pointer inline-flex items-center gap-1.5"
            title="Toggle Fullscreen (Press F)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden sm:inline">{isFullscreen ? "Exit (Esc)" : "Fullscreen (F)"}</span>
          </button>
        </div>
      </div>

      {/* Embedded PDF iframe */}
      <div className={`flex-1 w-full h-full relative transition-colors duration-300 ${atmosphereStyles[readerAtmosphere]}`}>
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
