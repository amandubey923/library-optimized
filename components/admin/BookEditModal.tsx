"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Book, CATEGORIES } from "@/data/books";
import { CatalogOverride } from "@/lib/admin-catalog";

interface BookEditModalProps {
  book: Book | null;
  existingOverride?: CatalogOverride;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    titleOverride?: string;
    authorOverride?: string;
    categoryOverride?: string;
    descriptionOverride?: string;
  }) => Promise<void>;
}

export default function BookEditModal({
  book,
  existingOverride,
  isOpen,
  onClose,
  onSave,
}: BookEditModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(existingOverride?.titleOverride || book.title);
      setAuthor(existingOverride?.authorOverride || book.author);
      setCategory(existingOverride?.categoryOverride || book.category);
      setDescription(existingOverride?.descriptionOverride || book.description);
    }
  }, [book, existingOverride, isOpen]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !book) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    setIsSaving(true);
    try {
      const updates: {
        titleOverride?: string;
        authorOverride?: string;
        categoryOverride?: string;
        descriptionOverride?: string;
      } = {};

      if (title.trim() !== book.title) updates.titleOverride = title.trim();
      if (author.trim() !== book.author) updates.authorOverride = author.trim();
      if (category !== book.category) updates.categoryOverride = category;
      if (description.trim() !== book.description) updates.descriptionOverride = description.trim();

      await onSave(updates);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl p-6 sm:p-7 text-[var(--foreground)] space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-14 rounded-lg bg-[var(--secondary)] overflow-hidden relative flex-shrink-0 border border-[var(--border)]">
              {book.cover ? (
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">📖</div>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-[var(--foreground)]">
                Edit Book Metadata
              </h2>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                ID: {book.id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Title Override
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs sm:text-sm text-[var(--foreground)] focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Author Override
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs sm:text-sm text-[var(--foreground)] focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Category / Realm
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs sm:text-sm text-[var(--foreground)] focus:outline-hidden transition-all cursor-pointer"
            >
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c} className="bg-[var(--card)] text-[var(--foreground)]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Description Override
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs text-[var(--foreground)] focus:outline-hidden transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 border border-[var(--border)] transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-[var(--background)] bg-[var(--foreground)] hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Overrides"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

