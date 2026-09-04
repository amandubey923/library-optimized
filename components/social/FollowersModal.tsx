"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicUserProfile, getFollowers, getFollowing } from "@/lib/social";
import FollowButton from "./FollowButton";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUid: string;
  targetUsername: string;
  initialTab?: "followers" | "following";
}

export default function FollowersModal({
  isOpen,
  onClose,
  targetUid,
  targetUsername,
  initialTab = "followers",
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [followers, setFollowers] = useState<PublicUserProfile[]>([]);
  const [following, setFollowing] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen || !targetUid) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([getFollowers(targetUid), getFollowing(targetUid)]).then(([followersList, followingList]) => {
      if (isMounted) {
        setFollowers(followersList);
        setFollowing(followingList);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetUid]);

  if (!isOpen) return null;

  const currentList = activeTab === "followers" ? followers : following;
  const filteredList = currentList.filter(
    (u) =>
      u.username.toLowerCase().includes(filterQuery.toLowerCase().trim()) ||
      u.displayName.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-[var(--foreground)] font-serif">
              @{targetUsername}&apos;s Circle
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="p-3 border-b border-[var(--border)] flex gap-2">
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "followers"
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "following"
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            Following ({following.length})
          </button>
        </div>

        {/* Search input if items exist */}
        {currentList.length > 5 && (
          <div className="px-4 pt-3">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search readers..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--text-secondary)]/70 focus:outline-hidden focus:border-[var(--accent)]"
            />
          </div>
        )}

        {/* Users List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-2xl bg-[var(--secondary)]/40 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--secondary)]" />
                    <div className="space-y-1">
                      <div className="w-24 h-3 rounded bg-[var(--secondary)]" />
                      <div className="w-16 h-2 rounded bg-[var(--secondary)]" />
                    </div>
                  </div>
                  <div className="w-16 h-6 rounded-xl bg-[var(--secondary)]" />
                </div>
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <span className="text-3xl block mb-2">👥</span>
              <p>
                {filterQuery
                  ? "No readers matched your search."
                  : activeTab === "followers"
                  ? "No followers yet. Be the first to follow!"
                  : "Not following any readers yet."}
              </p>
            </div>
          ) : (
            filteredList.map((reader) => (
              <div
                key={reader.uid}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[var(--secondary)]/40 border border-transparent hover:border-[var(--border)] transition-all"
              >
                <Link
                  href={`/profile/${reader.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1 pr-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] p-0.5 flex-shrink-0 relative overflow-hidden">
                    <div className="w-full h-full rounded-[10px] bg-[var(--card)] flex items-center justify-center text-sm font-bold text-[var(--accent)] overflow-hidden">
                      {reader.photoURL ? (
                        <Image
                          src={reader.photoURL}
                          alt={reader.displayName}
                          fill
                          sizes="40px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      ) : (
                        reader.displayName?.charAt(0) || "U"
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate block">
                      {reader.displayName?.replace(/^@+/, "") || reader.username}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono truncate block">
                      @{reader.username}
                    </span>
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

