import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="glass-card rounded-3xl p-8 sm:p-12 border border-[var(--border)] text-center max-w-lg mx-auto shadow-2xl bg-[var(--card)]">
        <div className="text-6xl mb-4">📖</div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 uppercase tracking-widest">
          404 — Page Not Found
        </span>
        <h1 className="text-3xl font-bold font-serif text-[var(--foreground)] mt-4 mb-2">
          Lost in the Library?
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
          The page or book you are searching for might have been moved or does not exist in our catalog.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Return Home
          </Link>
          <Link
            href="/library"
            className="px-6 py-3 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] font-semibold text-xs transition-all cursor-pointer"
          >
            Explore Library
          </Link>
        </div>
      </div>
    </main>
  );
}
