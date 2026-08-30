"use client";

import React, { useState } from "react";
import { Book } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";

interface AddToCollectionModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToCollectionModal({
  book,
  isOpen,
  onClose,
}: AddToCollectionModalProps) {
  const {
    collections,
    createCollection,
    addBookToCollection,
    removeBookFromCollection,
  } = useLibrary();

  const [newColName, setNewColName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const col = createCollection(newColName.trim());
    addBookToCollection(col.id, book.id);
    setNewColName("");
    setIsCreating(false);
  };

  const handleToggle = (colId: string, isMember: boolean) => {
    if (isMember) {
      removeBookFromCollection(colId, book.id);
    } else {
      addBookToCollection(colId, book.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-5 text-left relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-modal-title"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-lg flex items-center justify-center text-[var(--accent)]">
              📚
            </div>
            <div>
              <h3 id="collection-modal-title" className="font-serif font-bold text-base text-[var(--foreground)]">
                Add to Collection
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

        {/* Existing Collections List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {collections.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] py-4 text-center">
              You have no collections yet. Create your first collection below!
            </p>
          ) : (
            collections.map((col) => {
              const isMember = col.bookIds.includes(book.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleToggle(col.id, isMember)}
                  className={"w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer " + (
                    isMember
                      ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--foreground)]"
                      : "bg-[var(--background)] hover:bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                  )}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-medium text-xs text-[var(--foreground)] block truncate">
                      {col.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {col.bookIds.length} book{col.bookIds.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div
                    className={"w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-bold transition-colors " + (
                      isMember
                        ? "bg-[var(--accent)] text-black border-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--card)]"
                    )}
                  >
                    {isMember && "✓"}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Create New Collection Inline */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="space-y-2 pt-2 border-t border-[var(--border)]">
            <input
              type="text"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="Collection name (e.g. DSA Revision)..."
              autoFocus
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] shadow-inner"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                Create &amp; Add
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-2 rounded-xl bg-[var(--secondary)] text-[var(--text-secondary)] text-xs font-semibold hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--accent)]/60 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>＋</span>
            <span>Create New Collection</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-bold transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
