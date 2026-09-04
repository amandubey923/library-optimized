"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserDeepInspectionData, fetchUserDeepInspection } from "@/lib/admin-users";
import { getActivityStatus, formatLastSeen } from "@/lib/active-tracker";
import { BOOKS } from "@/data/books";

interface UserDetailsModalProps {
  uid: string | null;
  onClose: () => void;
}

export default function UserDetailsModal({ uid, onClose }: UserDetailsModalProps) {
  const [data, setData] = useState<UserDeepInspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reading" | "favorites" | "collections" | "activity">("reading");

  useEffect(() => {
    if (!uid) return;

    let isMounted = true;
    setLoading(true);

    fetchUserDeepInspection(uid).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uid]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!uid) return null;

  const activityInfo = getActivityStatus(data?.lastActiveAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden text-[var(--foreground)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--secondary)]/50 via-[var(--card)] to-[var(--secondary)]/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] overflow-hidden relative flex-shrink-0">
              {data?.photoURL ? (
                <Image
                  src={data.photoURL}
                  alt={data.displayName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--text-secondary)]">
                  {data?.displayName?.[0]?.toUpperCase() || "👤"}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-serif text-[var(--foreground)] truncate">
                  {data?.displayName || "Reader Profile"}
                </h2>
                {data?.username ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--secondary)] text-[var(--accent)] border border-[var(--border)]">
                    @{data.username}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs italic text-[var(--text-secondary)]/70 bg-[var(--secondary)]/40 border border-[var(--border)]">
                    Not set
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${activityInfo.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activityInfo.dotClass}`} />
                  {activityInfo.label}
                </span>
              </div>

              <div className="flex items-center gap-2.5 mt-1 text-xs text-[var(--text-secondary)] flex-wrap">
                <span className="font-mono text-[var(--foreground)] font-medium">
                  {data?.email}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  ADMIN VIEW
                </span>
                <span>•</span>
                <span>Last active: <strong>{formatLastSeen(data?.lastActiveAt)}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[var(--text-secondary)]">Fetching user cloud records...</p>
            </div>
          ) : data ? (
            <>
              {/* Quick KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                    Completed Books
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] font-serif mt-1 block">
                    {data.booksCompleted}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                    Currently Reading
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] font-serif mt-1 block">
                    {data.currentlyReading}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                    Current Streak
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-serif mt-1 block">
                    {data.currentStreak} <span className="text-xs font-normal text-[var(--text-secondary)]">days</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                    Followers / Following
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] font-serif mt-1 block">
                    {data.followersCount} <span className="text-xs font-normal text-[var(--text-secondary)]">/ {data.followingCount}</span>
                  </span>
                </div>
              </div>

              {/* Subcollection Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("reading")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "reading"
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Reading History ({data.readingProgress.length})
                </button>

                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "favorites"
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Shelf Favorites ({data.favorites.length})
                </button>

                <button
                  onClick={() => setActiveTab("collections")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "collections"
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Collections ({data.collections.length})
                </button>

                <button
                  onClick={() => setActiveTab("activity")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "activity"
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Activity Feed ({data.recentActivities.length})
                </button>
              </div>

              {/* Tab: Reading History */}
              {activeTab === "reading" && (
                <div className="space-y-3">
                  {data.readingProgress.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[var(--text-secondary)]">
                      No reading progress recorded yet.
                    </p>
                  ) : (
                    data.readingProgress.map((item) => {
                      const book = BOOKS.find((b) => b.id === item.bookId);
                      return (
                        <div
                          key={item.bookId}
                          className="p-3.5 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[var(--foreground)] block truncate">
                              {book?.title || item.bookId}
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)] block">
                              Page {item.page} of {item.totalPages} ({item.progress}%)
                            </span>
                          </div>

                          <div className="w-32 flex items-center gap-2 flex-shrink-0">
                            <div className="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                              <div
                                className="h-full bg-[var(--accent)] rounded-full"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                              {item.progress}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab: Favorites */}
              {activeTab === "favorites" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.favorites.length === 0 ? (
                    <p className="col-span-2 py-8 text-center text-xs text-[var(--text-secondary)]">
                      User has no saved favorites on their shelf.
                    </p>
                  ) : (
                    data.favorites.map((bookId) => {
                      const book = BOOKS.find((b) => b.id === bookId);
                      return (
                        <div
                          key={bookId}
                          className="p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)] flex items-center gap-3"
                        >
                          <span className="text-base">❤️</span>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-[var(--foreground)] block truncate">
                              {book?.title || bookId}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)] truncate block">
                              {book?.author || "Author"} • {book?.category || "Catalog"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab: Collections */}
              {activeTab === "collections" && (
                <div className="space-y-3">
                  {data.collections.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[var(--text-secondary)]">
                      No custom reading collections created by this user.
                    </p>
                  ) : (
                    data.collections.map((col) => (
                      <div
                        key={col.id}
                        className="p-3.5 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--border)] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-xs text-[var(--foreground)] block">
                            📁 {col.name}
                          </span>
                          {col.description && (
                            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                              {col.description}
                            </span>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[var(--card)] border border-[var(--border)]">
                          {col.bookIds.length} books
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Activity */}
              {activeTab === "activity" && (
                <div className="space-y-2.5">
                  {data.recentActivities.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[var(--text-secondary)]">
                      No public reading activities recorded for this user.
                    </p>
                  ) : (
                    data.recentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span>
                            {act.type === "completed_book"
                              ? "🏆"
                              : act.type === "started_book"
                              ? "📖"
                              : "🔥"}
                          </span>
                          <span className="font-medium text-[var(--foreground)] truncate">
                            {act.details || act.bookTitle || "Activity"}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono whitespace-nowrap">
                          {formatLastSeen(act.timestamp)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* UID & System Details footer */}
              <div className="pt-4 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between flex-wrap gap-2">
                <span>UID: <code className="font-mono text-[var(--foreground)] select-all">{data.uid}</code></span>
                {data.username ? (
                  <Link
                    href={`/profile/${data.username}`}
                    target="_blank"
                    className="text-[var(--accent)] hover:underline font-semibold"
                  >
                    Open Public Profile ↗
                  </Link>
                ) : (
                  <span className="text-[var(--text-secondary)]/50 italic text-[10px]">
                    No public profile (Username not created)
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-[var(--text-secondary)]">
              Unable to load user details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

