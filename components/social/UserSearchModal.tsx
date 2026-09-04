"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicUserProfile, searchUsers } from "@/lib/social";
import FollowButton from "./FollowButton";

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    const clean = query.trim().replace(/^@/, "");
    if (!clean || clean.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let isCancelled = false;

    const timer = setTimeout(() => {
      searchUsers(clean)
        .then((res) => {
          if (!isCancelled) {
            setResults((res || []).filter((r) => r && r.username));
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.warn("[UserSearchModal] Search error:", err);
            setResults([]);
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-sm text-[var(--accent)] font-bold">
              🔍
            </div>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search readers by @username or name..."
                autoFocus
                className="w-full bg-transparent text-sm sm:text-base text-[var(--foreground)] placeholder:text-[var(--text-secondary)]/70 focus:outline-hidden font-medium"
              />
            </div>

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] px-2 py-1 cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span>Search readers by <strong>@username</strong> or <strong>display name</strong></span>
            <span className="font-mono text-[10px] text-[var(--accent)]">Reader Hub Social</span>
          </div>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--secondary)]/40 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--secondary)]" />
                    <div className="space-y-1.5">
                      <div className="w-32 h-3.5 rounded bg-[var(--secondary)]" />
                      <div className="w-20 h-2.5 rounded bg-[var(--secondary)]" />
                    </div>
                  </div>
                  <div className="w-16 h-7 rounded-xl bg-[var(--secondary)]" />
                </div>
              ))}
            </div>
          ) : query.trim().length >= 2 && results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <span className="text-3xl block mb-2">🔎</span>
              <p>No readers found matching &quot;{query}&quot;.</p>
              <p className="text-[11px] text-[var(--text-secondary)]/70">
                Try searching for a different username or display name.
              </p>
            </div>
          ) : query.trim().length < 2 ? (
            <div className="py-10 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <span className="text-3xl block mb-2">📖</span>
              <p className="font-semibold text-[var(--foreground)]">Discover Readers</p>
              <p className="text-[11px] max-w-xs mx-auto leading-relaxed">
                Connect with passionate readers, explore their shelves, and track shared literary journeys.
              </p>
            </div>
          ) : (
            results.map((reader) => (
              <div
                key={reader.uid}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--secondary)]/50 border border-transparent hover:border-[var(--border)] transition-all group"
              >
                <Link
                  href={`/profile/${reader.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3.5 min-w-0 flex-1 pr-2"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] p-0.5 flex-shrink-0 relative overflow-hidden">
                    <div className="w-full h-full rounded-[10px] bg-[var(--card)] flex items-center justify-center text-sm font-bold text-[var(--accent)] overflow-hidden">
                      {reader.photoURL ? (
                        <Image
                          src={reader.photoURL}
                          alt={reader.displayName}
                          fill
                          sizes="44px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      ) : (
                        reader.displayName?.charAt(0) || "U"
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {reader.displayName}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                        @{reader.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                      {reader.bio || `${reader.stats?.booksCompleted || 0} books completed`}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mt-0.5">
                      <span className="font-semibold text-amber-500/90">
                        📚 {reader.stats?.booksCompleted || 0} books read
                      </span>
                      {reader.bio && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px] sm:max-w-xs">{reader.bio}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex-shrink-0">
                  <FollowButton targetUid={reader.uid} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

