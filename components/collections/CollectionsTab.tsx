"use client";

import React, { useState } from "react";
import { Book, BOOKS } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";
import BookCard from "@/components/BookCard";
import Link from "next/link";

export default function CollectionsTab() {
  const {
    collections,
    createCollection,
    updateCollection,
    deleteCollection,
    removeBookFromCollection,
  } = useLibrary();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    collections.length > 0 ? collections[0].id : null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const activeCollection = collections.find((c) => c.id === selectedCollectionId) || collections[0] || null;

  const collectionBooks: Book[] = activeCollection
    ? activeCollection.bookIds
        .map((id) => BOOKS.find((b) => b.id === id))
        .filter((b): b is Book => Boolean(b))
    : [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const col = createCollection(newName.trim(), newDesc.trim());
    setSelectedCollectionId(col.id);
    setNewName("");
    setNewDesc("");
    setIsCreating(false);
  };

  const handleEditSubmit = (id: string) => {
    if (!editName.trim()) return;
    updateCollection(id, { name: editName.trim() });
    setEditingId(null);
  };

  return (
    <div className="w-full space-y-6 text-left min-w-0">
      {/* Top Header & Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl glass-card border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-[var(--foreground)]">
            Smart Reading Collections
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Organize study tracks, subject revisions, and personal reading lists.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:scale-102 transition-transform flex items-center gap-1.5 cursor-pointer"
        >
          <span>＋</span>
          <span>New Collection</span>
        </button>
      </div>

      {/* Inline Create Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-5 rounded-3xl glass-card border border-[var(--accent)]/40 bg-[var(--card)] shadow-2xl space-y-3 animate-fade-in"
        >
          <h3 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            Create New Collection
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name (e.g. DSA Revision, Existentialism)..."
              required
              autoFocus
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] shadow-inner"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description (optional)..."
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] shadow-inner"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-1.5 rounded-xl bg-[var(--secondary)] text-[var(--text-secondary)] text-xs font-semibold hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md cursor-pointer"
            >
              Save Collection
            </button>
          </div>
        </form>
      )}

      {/* Collections Pill Bar */}
      {collections.length === 0 ? (
        <div className="text-center py-12 px-4 glass-card rounded-3xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="text-sm font-bold font-serif text-[var(--foreground)] mb-1">
            No Custom Collections Yet
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
            Create custom lists like &ldquo;DSA Placement Prep&rdquo; or &ldquo;Philosophy Deep Dive&rdquo; to group books your way.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer"
          >
            Create Your First Collection
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {collections.map((col) => {
              const isSelected = activeCollection?.id === col.id;
              return (
                <div key={col.id} className="flex-shrink-0 flex items-center">
                  {editingId === col.id ? (
                    <div className="flex items-center gap-1 bg-[var(--card)] p-1 rounded-2xl border border-[var(--accent)]">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-transparent px-2 py-0.5 text-xs text-[var(--foreground)] focus:outline-none w-32"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditSubmit(col.id)}
                        className="px-2 py-0.5 rounded-lg bg-[var(--primary)] text-white text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-0.5 rounded-lg bg-[var(--secondary)] text-[var(--text-secondary)] text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedCollectionId(col.id)}
                      className={"px-4 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border " + (
                        isSelected
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent shadow-md"
                          : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)]"
                      )}
                    >
                      <span>{col.name}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                        {col.bookIds.length}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Collection Info & Management */}
          {activeCollection && (
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] font-serif">
                  {activeCollection.name}
                </h3>
                {activeCollection.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {activeCollection.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(activeCollection.id);
                    setEditName(activeCollection.name);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] text-xs font-medium transition-colors cursor-pointer"
                >
                  ✎ Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete collection "${activeCollection.name}"? (Books will remain in library)`)) {
                      deleteCollection(activeCollection.id);
                      setSelectedCollectionId(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors cursor-pointer"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {/* Books in Collection Grid */}
          {collectionBooks.length === 0 ? (
            <div className="text-center py-12 px-4 glass-card rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                No books added to this collection yet. Browse the catalog to add volumes!
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold"
              >
                <span>Browse Catalog</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 w-full min-w-0">
              {collectionBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDismiss={() => {
                    if (activeCollection) {
                      removeBookFromCollection(activeCollection.id, book.id);
                    }
                  }}
                  dismissAriaLabel={`Remove ${book.title} from collection`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
