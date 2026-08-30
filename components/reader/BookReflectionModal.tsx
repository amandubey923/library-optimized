"use client";

import React, { useState, useEffect } from "react";
import { Book } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";

interface BookReflectionModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookReflectionModal({
  book,
  isOpen,
  onClose,
}: BookReflectionModalProps) {
  const { getReflection, saveReflection, removeReflection } = useLibrary();
  const existing = getReflection(book.id);

  const [reflectionText, setReflectionText] = useState("");
  const [rating, setRating] = useState<number>(5);

  useEffect(() => {
    if (existing) {
      setReflectionText(existing.reflection || "");
      setRating(existing.rating || 5);
    } else {
      setReflectionText("");
      setRating(5);
    }
  }, [existing, book.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    saveReflection(book.id, reflectionText.trim(), rating);
    onClose();
  };

  const handleDelete = () => {
    removeReflection(book.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in text-left">
      <div
        className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-5 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reflection-modal-title"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 text-lg flex items-center justify-center text-violet-400">
              📝
            </div>
            <div>
              <h3 id="reflection-modal-title" className="font-serif font-bold text-base text-[var(--foreground)]">
                Book Reflection &amp; Takeaways
              </h3>
              <p className="text-xs text-[var(--text-secondary)] truncate max-w-[240px]">
                {book.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
              Personal Rating:
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={"w-8 h-8 rounded-xl text-sm transition-all cursor-pointer border " + (
                    rating >= star
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-xs"
                      : "bg-[var(--secondary)] text-[var(--text-secondary)] border-[var(--border)]"
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
              What did this book change for you?
            </label>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Write your personal realization, key conceptual summary, or philosophical takeaway..."
              rows={5}
              required
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl p-3.5 text-xs text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] shadow-inner resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            {existing && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:scale-102 transition-transform cursor-pointer"
            >
              Save Reflection ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
