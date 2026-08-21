"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Book } from "@/data/books";

// Dynamically import BookReader with SSR disabled to prevent hydration mismatch with canvas and browser APIs
const BookReader = dynamic(() => import("@/components/reader/BookReader"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[780px] rounded-3xl border border-[var(--border)] bg-[#0e1017] shadow-2xl flex flex-col items-center justify-center p-8 text-center animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-3xl flex items-center justify-center text-[var(--accent)] mb-3">
        📖
      </div>
      <h3 className="text-sm font-bold font-serif text-[var(--foreground)]">
        Opening Digital Book...
      </h3>
      <p className="text-xs text-[var(--text-secondary)] mt-1">
        Preparing realistic reading environment
      </p>
    </div>
  ),
});

interface PdfReaderProps {
  book: Book;
}

export default function PdfReader({ book }: PdfReaderProps) {
  return <BookReader book={book} />;
}
