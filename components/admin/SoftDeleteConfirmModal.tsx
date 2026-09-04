"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Book } from "@/data/books";

interface SoftDeleteConfirmModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function SoftDeleteConfirmModal({
  book,
  isOpen,
  onClose,
  onConfirm,
}: SoftDeleteConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !book) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-[var(--card)] shadow-2xl p-6 sm:p-7 text-[var(--foreground)] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
          ⚠️
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold font-serif text-[var(--foreground)]">
            Delete this book?
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            This will make the book unavailable in Reader Hub. It can be restored at any time by an administrator without losing reader bookmarks or history.
          </p>
        </div>

        {/* Book summary pill */}
        <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)] flex items-center gap-3">
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
          <div className="min-w-0 flex-1">
            <span className="font-bold text-xs text-[var(--foreground)] block truncate">
              {book.title}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block truncate">
              {book.author} • {book.category}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]/80 block">
              ID: {book.id}
            </span>
          </div>
        </div>

        {/* Optional Audit Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Reason for deletion (optional, logged in audit trail):
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Catalog cleanup, content revision..."
            className="w-full px-3.5 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-rose-500 text-xs text-[var(--foreground)] focus:outline-hidden transition-all placeholder:text-[var(--text-secondary)]/60"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 border border-[var(--border)] transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Book"}
          </button>
        </div>
      </div>
    </div>
  );
}

