"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  PublicUserProfile,
  PublicActivity,
  Achievement,
  getProfileByUsername,
  getUserPublicActivities,
  calculateUserAchievements,
} from "@/lib/social";
import { BOOKS, Book } from "@/data/books";
import FollowButton from "@/components/social/FollowButton";
import FollowersModal from "@/components/social/FollowersModal";
import EditProfileModal from "@/components/social/EditProfileModal";
import UserSearchModal from "@/components/social/UserSearchModal";
import AchievementsGrid from "@/components/social/AchievementsGrid";
import ActivityFeed from "@/components/social/ActivityFeed";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params?.username as string;
  const username = rawUsername ? decodeURIComponent(rawUsername).replace(/^@/, "").toLowerCase() : "";

  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modals state
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Active Tab: "shelf" | "activity" | "achievements"
  const [activeTab, setActiveTab] = useState<"shelf" | "activity" | "achievements">("shelf");

  const isOwnProfile = user && profile && user.uid === profile.uid;

  useEffect(() => {
    if (!username) return;

    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    getProfileByUsername(username).then((prof) => {
      if (!isMounted) return;

      if (!prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(prof);

      // Fetch user's public activities
      getUserPublicActivities(prof.uid).then((acts) => {
        if (isMounted) setActivities(acts);
      });

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [username]);

  // Compute Achievements dynamically from stats or stored badges
  const achievements = useMemo(() => {
    if (!profile) return [];
    return calculateUserAchievements(
      [], // Public viewer doesn't need raw reading history; we use stats
      { currentStreak: profile.stats?.currentStreak || 0, longestStreak: profile.stats?.longestStreak || 0 },
      {},
      BOOKS
    ).map((a) => ({
      ...a,
      unlocked: profile.achievements?.includes(a.id) || a.unlocked,
    }));
  }, [profile]);

  // Format reading active duration
  const formatDuration = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds < 60) return "0h 0m";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Loading skeleton
  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
          <div className="h-56 rounded-3xl bg-[var(--card)]/70 border border-[var(--border)]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-24 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-24 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-24 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-24 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
          </div>
          <div className="h-96 rounded-3xl bg-[var(--card)]/70 border border-[var(--border)]" />
        </div>
      </main>
    );
  }

  // Not Found State
  if (notFound || !profile) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-3xl shadow-inner">
            🔍
          </div>

          <h2 className="text-2xl font-bold text-[var(--foreground)] font-serif">
            Reader Not Found
          </h2>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            The profile for <strong className="text-[var(--foreground)]">@{username}</strong> does not exist or may have been renamed.
          </p>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[var(--foreground)] text-[var(--background)] shadow-md transition-all cursor-pointer hover:opacity-90"
            >
              Search Readers 🔍
            </button>

            <Link
              href="/library"
              className="w-full py-2 px-4 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] border border-[var(--border)] transition-all"
            >
              ← Back to Library
            </Link>
          </div>

          <UserSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
          />
        </div>
      </main>
    );
  }

  // Private profile check
  const isPrivate = profile.isPublic === false && !isOwnProfile;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-20 pb-20 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* =========================================================================
            1. PROFILE HEADER SECTION (Instagram + LeetCode Inspired)
           ========================================================================= */}
        <header className="relative overflow-hidden rounded-3xl border border-[var(--border)] p-6 sm:p-8 bg-gradient-to-br from-[var(--card)] via-[var(--card)]/95 to-[var(--secondary)]/40 shadow-xl">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-[var(--primary)]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {/* User Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[var(--primary)] via-[var(--primary)] to-[var(--accent)] p-0.5 shadow-xl flex-shrink-0 relative overflow-hidden">
                <div className="w-full h-full rounded-[22px] bg-[var(--card)] flex items-center justify-center text-3xl font-bold text-[var(--accent)] overflow-hidden">
                  {profile.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt={profile.displayName}
                      fill
                      sizes="96px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  ) : (
                    profile.displayName?.charAt(0) || "U"
                  )}
                </div>
              </div>

              {/* User Meta */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)] font-serif">
                    {profile.displayName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                    @{profile.username}
                  </span>
                  {isPrivate && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">
                      🔒 Private
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed mt-1">
                  {profile.bio || "Avid reader exploring books and ideas on Reader's HUB."}
                </p>

                {/* Followers & Following Taps */}
                <div className="flex items-center gap-4 pt-2 text-xs">
                  <button
                    onClick={() => {
                      setFollowersModalTab("followers");
                      setIsFollowersModalOpen(true);
                    }}
                    className="hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <strong className="text-[var(--foreground)] font-mono text-sm">
                      {profile.followersCount || 0}
                    </strong>{" "}
                    <span className="text-[var(--text-secondary)]">Followers</span>
                  </button>

                  <span className="text-[var(--border)]">•</span>

                  <button
                    onClick={() => {
                      setFollowersModalTab("following");
                      setIsFollowersModalOpen(true);
                    }}
                    className="hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <strong className="text-[var(--foreground)] font-mono text-sm">
                      {profile.followingCount || 0}
                    </strong>{" "}
                    <span className="text-[var(--text-secondary)]">Following</span>
                  </button>

                  <span className="text-[var(--border)]">•</span>

                  <span className="text-[var(--text-secondary)]/80 text-[11px]">
                    Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="py-2 px-4 rounded-xl bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>✏️</span>
                    <span>Edit Profile</span>
                  </button>

                  <Link
                    href="/profile"
                    className="py-2 px-3.5 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>📊</span>
                    <span>My Dashboard</span>
                  </Link>
                </>
              ) : (
                <FollowButton
                  targetUid={profile.uid}
                  onFollowChange={(next) => {
                    setProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            followersCount: Math.max(0, (prev.followersCount || 0) + (next ? 1 : -1)),
                          }
                        : prev
                    );
                  }}
                />
              )}

              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer shadow-xs"
                title="Search other readers"
                aria-label="Search readers"
              >
                🔍
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="mt-8 pt-4 border-t border-[var(--border)] flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("shelf")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "shelf"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>📚</span>
              <span>Reading Shelf &amp; Stats</span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "activity"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>⚡</span>
              <span>Activity Feed ({activities.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("achievements")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "achievements"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span>🏆</span>
              <span>Achievements ({achievements.filter((a) => a.unlocked).length})</span>
            </button>
          </div>
        </header>

        {/* Private Profile Notice */}
        {isPrivate ? (
          <div className="p-12 rounded-3xl border border-[var(--border)] bg-[var(--card)] text-center space-y-3">
            <span className="text-4xl block">🔒</span>
            <h3 className="font-bold text-base text-[var(--foreground)]">This Profile is Private</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              @{profile.username} has chosen to keep their reading journey and shelf private.
            </p>
          </div>
        ) : (
          <>
            {/* =========================================================================
                TAB 1: SHELF & STATS
               ========================================================================= */}
            {activeTab === "shelf" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* LeetCode-style Stats Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] bg-[var(--card)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                      Books Completed
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)]">
                      {profile.stats?.booksCompleted || 0}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">
                      Verified read
                    </span>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] bg-[var(--card)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                      Currently Reading
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)]">
                      {profile.stats?.currentlyReading || 0}
                    </span>
                    <span className="text-[11px] text-[var(--accent)] font-medium block mt-0.5">
                      In progress
                    </span>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] bg-[var(--card)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                      Daily Streak
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-400 flex items-center gap-1.5">
                      <span>🪔</span>
                      <span>{profile.stats?.currentStreak || 0}</span>
                      <span className="text-xs text-[var(--text-secondary)] font-normal font-sans">days</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono block mt-0.5">
                      Best: {profile.stats?.longestStreak || 0} days
                    </span>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] bg-[var(--card)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                      Reading Time
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold font-serif text-[var(--foreground)]">
                      {formatDuration(profile.stats?.totalActiveSeconds || 0)}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                      Deep active focus
                    </span>
                  </div>
                </div>

                {/* Achievements Showcase (Compact) */}
                <div className="glass-card rounded-3xl p-6 border border-[var(--border)] bg-[var(--card)]">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] font-serif">
                        Earned Reading Badges
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Milestones unlocked by @{profile.username}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("achievements")}
                      className="text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {achievements
                      .filter((a) => a.unlocked)
                      .slice(0, 4)
                      .map((ach) => (
                        <div
                          key={ach.id}
                          className="p-3 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)] flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-xl flex-shrink-0">
                            {ach.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-[var(--foreground)] truncate block">
                              {ach.title}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold block">
                              Earned
                            </span>
                          </div>
                        </div>
                      ))}
                    {achievements.filter((a) => a.unlocked).length === 0 && (
                      <div className="col-span-4 py-6 text-center text-xs text-[var(--text-secondary)]">
                        No badges unlocked yet. Reading starts the journey!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: ACTIVITY FEED
               ========================================================================= */}
            {activeTab === "activity" && (
              <div className="animate-in fade-in duration-300">
                <ActivityFeed
                  activities={activities}
                  emptyMessage={`@${profile.username} hasn't logged public reading milestones yet.`}
                />
              </div>
            )}

            {/* =========================================================================
                TAB 3: ACHIEVEMENTS & MILESTONES
               ========================================================================= */}
            {activeTab === "achievements" && (
              <div className="animate-in fade-in duration-300">
                <AchievementsGrid achievements={achievements} />
              </div>
            )}
          </>
        )}

      </div>

      {/* Modals */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        targetUid={profile.uid}
        targetUsername={profile.username}
        initialTab={followersModalTab}
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          // If username changed, update URL
          if (updated.username !== profile.username) {
            router.replace(`/profile/${updated.username}`);
          }
        }}
      />

      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </main>
  );
}

