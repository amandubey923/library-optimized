"use client";

import React, { useState, useEffect } from "react";
import { ReadingPath } from "@/lib/reading-paths";
import { CuratedSeriesOverride } from "@/lib/admin-catalog";

interface SeriesEditModalProps {
  series: ReadingPath | null;
  existingOverride?: CuratedSeriesOverride;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    titleOverride?: string;
    descriptionOverride?: string;
  }) => Promise<void>;
  onToggleDelete: (isDeleted: boolean, reason?: string) => Promise<void>;
}

export default function SeriesEditModal({
  series,
  existingOverride,
  isOpen,
  onClose,
  onSave,
  onToggleDelete,
}: SeriesEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (series) {
      setTitle(existingOverride?.titleOverride || series.title);
      setDescription(existingOverride?.descriptionOverride || series.description);
      setDeleteReason("");
      setShowDeleteConfirm(false);
    }
  }, [series, existingOverride, isOpen]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !series) return null;

  const isCurrentlyDeleted = existingOverride?.isDeleted === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const updates: { titleOverride?: string; descriptionOverride?: string } = {};
      if (title.trim() !== series.title) updates.titleOverride = title.trim();
      if (description.trim() !== series.description) updates.descriptionOverride = description.trim();

      await onSave(updates);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setIsSaving(true);
    try {
      await onToggleDelete(!isCurrentlyDeleted, deleteReason.trim());
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
            <span className="text-2xl p-2 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
              {series.icon}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-[var(--foreground)]">
                Manage Reading Path / Track
              </h2>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                ID: {series.id}
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

        {/* Status Indicator */}
        <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)] flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-[var(--foreground)] block">
              Current Track Status:
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {isCurrentlyDeleted ? "Inactive in public catalog" : "Active & displayed in library"}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isCurrentlyDeleted
                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {isCurrentlyDeleted ? "Inactive / Soft Deleted" : "Active Track"}
          </span>
        </div>

        {showDeleteConfirm ? (
          /* Delete Confirmation Section */
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-3">
            <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>
                {isCurrentlyDeleted ? "Reactivate this reading path?" : "Soft delete this reading path?"}
              </span>
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isCurrentlyDeleted
                ? "Reactivating this track will make it visible to readers again."
                : "Soft-deleting this curated track marks it inactive. Connected books remain completely available in the library catalog."}
            </p>

            {!isCurrentlyDeleted && (
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason (optional, logged in audit log)..."
                className="w-full px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-hidden"
              />
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--secondary)] text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isSaving}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold text-white transition-all ${
                  isCurrentlyDeleted ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSaving
                  ? "Processing..."
                  : isCurrentlyDeleted
                  ? "Confirm Reactivation"
                  : "Confirm Soft Delete"}
              </button>
            </div>
          </div>
        ) : (
          /* Standard Edit Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Track Title Override
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
                Description Override
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs text-[var(--foreground)] focus:outline-hidden transition-all resize-none leading-relaxed"
              />
            </div>

            <div className="p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--foreground)] block mb-1">
                Connected Curriculum ({series.steps.length} steps):
              </span>
              <ul className="space-y-1 list-disc list-inside">
                {series.steps.map((step) => (
                  <li key={step.stepNumber} className="truncate">
                    {step.title} {step.bookId ? `(ID: ${step.bookId})` : "(Upcoming)"}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className={`text-xs font-semibold hover:underline cursor-pointer ${
                  isCurrentlyDeleted ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isCurrentlyDeleted ? "↻ Reactivate Path" : "🗑️ Soft Delete Path"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 border border-[var(--border)] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-[var(--background)] bg-[var(--foreground)] hover:opacity-90 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

