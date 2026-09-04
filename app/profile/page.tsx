"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLibrary } from "@/context/LibraryContext";
import { useAuth } from "@/context/AuthContext";
import {
  getComprehensiveAnalytics,
  formatAnalyticsDuration,
  AnalyticsTimeFilter,
  HeatmapCell,
} from "@/lib/reading-analytics";
import ReadingReportCardModal from "@/components/profile/ReadingReportCardModal";
import AuthModal from "@/components/auth/AuthModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { useEntitlement } from "@/context/EntitlementContext";
import ProBadge from "@/components/payment/ProBadge";
import { isAdminUser } from "@/lib/admin";
import {
  PublicUserProfile,
  ensureUserProfile,
  syncPublicProfileMetrics,
  getFollowCounts,
} from "@/lib/social";
import FollowersModal from "@/components/social/FollowersModal";
import EditProfileModal from "@/components/social/EditProfileModal";
import UserSearchModal from "@/components/social/UserSearchModal";
import UsernameSetupModal from "@/components/social/UsernameSetupModal";

export default function ProfilePage() {
  const { favorites, readingHistory, streakData, stats, globalActiveSeconds, todayReadingSeconds, todayActiveSeconds } = useLibrary();
  const { user, signOutUser } = useAuth();
  const { isPro, isSupporter, openProModal, openSupportModal } = useEntitlement();
  const [timeFilter, setTimeFilter] = useState<AnalyticsTimeFilter>("all");
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [socialProfile, setSocialProfile] = useState<PublicUserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("reader_social_profile_")) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.username) return parsed;
            }
          }
        }
      } catch {}
    }
    return null;
  });
  const [profileLoading, setProfileLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("reader_social_profile_")) {
            return false;
          }
        }
      } catch {}
    }
    return true;
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUsernameSetupOpen, setIsUsernameSetupOpen] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize and synchronize social profile
  const loadProfile = React.useCallback(async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    // Check specific user cache first for instant display
    try {
      const cached = localStorage.getItem(`reader_social_profile_${user.uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.username) {
          setSocialProfile(parsed);
          setProfileLoading(false);
        }
      }
    } catch {}

    setProfileError(null);
    try {
      const prof = await ensureUserProfile(user);
      if (prof) {
        setSocialProfile(prof);
        // Synchronize authentic live follower/following counts directly
        getFollowCounts(user.uid).then((counts) => {
          setSocialProfile((prev) =>
            prev
              ? {
                  ...prev,
                  followersCount: counts.followersCount,
                  followingCount: counts.followingCount,
                }
              : prev
          );
        });
      }
      if (!prof || !prof.username) {
        // STATE B: Missing username - automatically open setup modal
        setIsUsernameSetupOpen(true);
      }
    } catch (err: any) {
      console.error("[ProfilePage] Failed to load user profile:", err);
      setProfileError("Unable to load profile data. Please check your connection.");
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Synchronize live follow state across the app (e.g. following someone in search modal)
  useEffect(() => {
    const handleFollowChanged = (e: Event) => {
      const custom = e as CustomEvent;
      if (!user) return;
      if (custom.detail?.followerUid === user.uid) {
        if (typeof custom.detail.followerFollowing === "number") {
          setSocialProfile((prev) =>
            prev ? { ...prev, followingCount: custom.detail.followerFollowing } : prev
          );
        } else {
          const delta = custom.detail.isFollowing ? 1 : -1;
          setSocialProfile((prev) =>
            prev
              ? {
                  ...prev,
                  followingCount: Math.max(0, (prev.followingCount || 0) + delta),
                }
              : prev
          );
        }
      }
      if (custom.detail?.targetUid === user.uid) {
        if (typeof custom.detail.targetFollowers === "number") {
          setSocialProfile((prev) =>
            prev ? { ...prev, followersCount: custom.detail.targetFollowers } : prev
          );
        } else {
          const delta = custom.detail.isFollowing ? 1 : -1;
          setSocialProfile((prev) =>
            prev
              ? {
                  ...prev,
                  followersCount: Math.max(0, (prev.followersCount || 0) + delta),
                }
              : prev
          );
        }
      }
    };

    window.addEventListener("readers_hub_follow_changed", handleFollowChanged);
    return () => {
      window.removeEventListener("readers_hub_follow_changed", handleFollowChanged);
    };
  }, [user?.uid]);

  // Background sync for public profile metrics without ever touching profile loading state
  const prevSyncKeyRef = React.useRef<string>("");
  useEffect(() => {
    if (!user || !socialProfile?.username) return;

    const syncKey = `${readingHistory.length}_${streakData.currentStreak}_${Math.floor(globalActiveSeconds / 15)}`;
    if (prevSyncKeyRef.current === syncKey) return;
    prevSyncKeyRef.current = syncKey;

    const timer = setTimeout(() => {
      syncPublicProfileMetrics(
        user.uid,
        readingHistory,
        streakData,
        globalActiveSeconds
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [user, socialProfile?.username, readingHistory, streakData, globalActiveSeconds]);

  // Build activeTimeData from context's Firestore-hydrated state so analytics
  // never falls back to browser localStorage for authenticated account data.
  const activeTimeData = useMemo(() => {
    // Derive per-day active seconds from streakData.daily (reading seconds = minimum active seconds).
    // totalActiveSeconds and todayActiveSeconds come directly from the cloud-hydrated context state.
    const daily: Record<string, number> = {};
    const todayKey = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"
    Object.entries(streakData.daily || {}).forEach(([dateKey, entry]) => {
      daily[dateKey] = entry.seconds || 0;
    });
    // Ensure today's value reflects the live context value (may include site browsing time)
    if (todayActiveSeconds > 0) {
      daily[todayKey] = Math.max(daily[todayKey] || 0, todayActiveSeconds);
    }
    return {
      totalActiveSeconds: globalActiveSeconds,
      daily,
      lastUpdated: 0,
    };
  }, [streakData, globalActiveSeconds, todayActiveSeconds]);

  // Compute analytics dynamically based on authenticated storage & state
  const analytics = useMemo(() => {
    return getComprehensiveAnalytics(timeFilter, {
      favorites,
      readingHistory,
      streakData,
      activeTimeData,
    });
  }, [timeFilter, favorites, readingHistory, streakData, activeTimeData, stats, globalActiveSeconds, todayReadingSeconds, todayActiveSeconds]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-44 rounded-3xl bg-[var(--card)]/70 border border-[var(--border)]" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 rounded-3xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-64 rounded-3xl bg-[var(--card)]/70 border border-[var(--border)]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-28 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-28 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-28 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-28 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
          </div>
        </div>
      </div>
    );
  }

  const {
    profileHeader,
    todaySummary,
    coreStats,
    heatmap,
    monthlyJourney,
    favoriteGenre,
    genreBreakdown,
    mostReadBooks,
    recentlyReadBooks,
    readingHabits,
  } = analytics;

  const filterOptions: { id: AnalyticsTimeFilter; label: string }[] = [
    { id: "all", label: "All Time" },
    { id: "year", label: "This Year" },
    { id: "month", label: "This Month" },
    { id: "30d", label: "30 Days" },
    { id: "7d", label: "7 Days" },
  ];

  return (
    <AuthGuard
      pageTitle="Profile & Reading Analytics"
      pageDescription="Please sign in with your Google account to access your personal reading journey, reading statistics, and cloud library."
    >
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
        
        {/* =========================================================================
            1. PROFILE HEADER SECTION
           ========================================================================= */}
        {/* =========================================================================
            1. PROFILE HEADER SECTION — PREMIUM READER IDENTITY CARD
           ========================================================================= */}
        <section
          className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-b from-[var(--card)] via-[var(--card)] to-[var(--card)]/90 p-5 sm:p-7 md:p-8 shadow-2xl backdrop-blur-xl"
          aria-label="Profile Header"
        >
          {/* Subtle Ambient Depth Glows */}
          <div className="absolute top-0 right-1/4 -mt-16 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 -mb-12 -mr-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
            {/* Left Side: Avatar + Comprehensive Reader Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 flex-1 min-w-0">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/30 via-[var(--border)] to-amber-500/20 p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-[14px] bg-[var(--card)] flex items-center justify-center text-cyan-400 relative overflow-hidden">
                    {user?.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || "User avatar"}
                        fill
                        sizes="80px"
                        referrerPolicy="no-referrer"
                        className="object-cover rounded-[14px]"
                      />
                    ) : user?.displayName ? (
                      <span className="font-bold text-2xl sm:text-3xl font-serif text-cyan-400">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <svg className="w-9 h-9 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity Details */}
              <div className="space-y-2.5 flex-1 min-w-0">
                {/* Name + Badges Row */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
                    <span className="truncate">{user?.displayName || profileHeader.userTitle}</span>
                    <span className="truncate">
                      {socialProfile?.displayName?.replace(/^@+/, "").trim() ||
                        user?.displayName?.replace(/^@+/, "").trim() ||
                        (socialProfile?.username ? socialProfile.username.replace(/^@+/, "") : profileHeader.userTitle)}
                    </span>
                    <ProBadge />
                  </h1>

                  {/* Username Pill */}
                  {user && (
                    <>
                      {socialProfile?.username ? (
                        <Link
                          href={`/profile/${socialProfile.username}`}
                          className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all inline-flex items-center gap-1 shadow-xs"
                          title="View your public profile"
                        >
                          <span>@{socialProfile.username}</span>
                          <span className="text-[10px] text-cyan-400/80">↗</span>
                        </Link>
                      ) : profileLoading ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[var(--secondary)] text-[var(--text-secondary)] animate-pulse">
                          Loading handle...
                        </span>
                      ) : profileError ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Sync error
                          </span>
                          <button
                            onClick={() => loadProfile()}
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsUsernameSetupOpen(true)}
                          className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 transition-all cursor-pointer inline-flex items-center gap-1 animate-pulse"
                        >
                          <span>✨</span>
                          <span>Set @username</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Cloud Synced Badge */}
                  {user ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Cloud Synced</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                      Guest Device
                    </span>
                  )}
                </div>

                {/* Bio (if available) */}
                {socialProfile?.bio && (
                  <p className="text-xs text-[var(--text-secondary)] italic max-w-xl line-clamp-2 leading-relaxed">
                    &ldquo;{socialProfile.bio}&rdquo;
                  </p>
                )}

                {/* Social Stats Blocks & View Public Profile Button */}
                {user && (
                  <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                    {/* Followers Block */}
                    <button
                      type="button"
                      onClick={() => {
                        setFollowersModalTab("followers");
                        setIsFollowersModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)]/80 border border-[var(--border)] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-2 group text-left"
                    >
                      <span className="text-sm sm:text-base font-bold font-mono text-[var(--foreground)] group-hover:text-cyan-300 transition-colors">
                        {socialProfile?.followersCount || 0}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">
                        Followers
                      </span>
                    </button>

                    {/* Following Block */}
                    <button
                      type="button"
                      onClick={() => {
                        setFollowersModalTab("following");
                        setIsFollowersModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)]/80 border border-[var(--border)] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-2 group text-left"
                    >
                      <span className="text-sm sm:text-base font-bold font-mono text-[var(--foreground)] group-hover:text-cyan-300 transition-colors">
                        {socialProfile?.followingCount || 0}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">
                        Following
                      </span>
                    </button>

                    {/* View Public Profile Secondary Button */}
                    {socialProfile?.username && (
                      <Link
                        href={`/profile/${socialProfile.username}`}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <span>View Public Profile</span>
                        <span className="text-xs">↗</span>
                      </Link>
                    )}
                  </div>
                )}

                {/* Compact Connection Info & Reader Since Metadata */}
                <div className="text-xs text-[var(--text-secondary)]/80 space-y-1 pt-1">
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    {user ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Google connected <span className="opacity-75 font-mono">({user.email})</span></span>
                        <span>•</span>
                        <span>Reading & library synced</span>
                      </span>
                    ) : (
                      <span>Saved locally in this browser</span>
                    )}
                  </div>

                  {profileHeader.memberSince ? (
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span>📅 Reader since <strong>{profileHeader.memberSince}</strong></span>
                      <span>•</span>
                      <span>Active for <strong>{profileHeader.totalDaysSinceFirstActivity} days</strong></span>
                    </div>
                  ) : (
                    <div className="text-[11px]">First reading session begins today!</div>
                  )}
                </div>

                {/* Clean Action Button Hierarchy */}
                <div className="flex items-center gap-2.5 flex-wrap pt-2">
                  {/* Primary / Secondary Social Actions */}
                  {user && !profileLoading && (
                    <>
                      {socialProfile?.username ? (
                        <button
                          type="button"
                          onClick={() => setIsEditProfileModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                        >
                          <span>✏️</span>
                          <span>Edit Profile</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsUsernameSetupOpen(true)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-black shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <span>✨</span>
                          <span>Create Username</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Find Readers */}
                  <button
                    type="button"
                    onClick={() => setIsUserSearchModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border)]/80 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    <span>🔍</span>
                    <span>Find Readers</span>
                  </button>

                  {/* Upgrade to Pro (Primary) */}
                  {!isPro ? (
                    <button
                      type="button"
                      onClick={() => openProModal()}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-zinc-950 shadow-md shadow-amber-500/10 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <span>✨</span>
                      <span>Upgrade to Pro</span>
                    </button>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center gap-1.5">
                      <span>★</span>
                      <span>Reader Pro Active</span>
                    </span>
                  )}

                  {/* Support */}
                  <button
                    type="button"
                    onClick={() => openSupportModal()}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--secondary)]/60 hover:bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <span>💛</span>
                    <span>Support</span>
                  </button>

                  {/* Admin Portal (if admin) */}
                  {isAdminUser(user?.email) && (
                    <Link
                      href="/admin"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                    >
                      <span>🛡️</span>
                      <span>Admin</span>
                    </Link>
                  )}

                  {/* Danger: Sign Out */}
                  {user ? (
                    <button
                      type="button"
                      onClick={signOutUser}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:border-rose-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-900 shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 border border-zinc-200"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.36 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>Sign In with Google</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Compact "Reading Streak" Mini-Card */}
            <div className="w-full lg:w-auto flex-shrink-0 self-stretch lg:self-center">
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-[var(--card)] to-[var(--card)]/90 p-4 sm:p-5 shadow-lg flex flex-row lg:flex-col items-center lg:items-start justify-between gap-4 min-w-[200px]">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    <span>🔥</span>
                    <span>Reading Streak</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[var(--foreground)] flex items-baseline gap-1">
                    <span>{profileHeader.currentStreak}</span>
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">days</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-medium">
                    {profileHeader.currentStreak > 0 ? "Keep the flame alive!" : "Begin your streak today"}
                  </div>
                </div>

                <div className="pt-0 lg:pt-3 border-l lg:border-l-0 lg:border-t border-[var(--border)] pl-4 lg:pl-0 w-auto lg:w-full flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-[var(--text-secondary)]">All-Time Best:</span>
                  <span className="font-bold font-mono text-[var(--foreground)] flex items-center gap-1">
                    <span>🏆</span>
                    <span>{profileHeader.longestStreak}d</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. TODAY'S SNAPSHOT & TIME EXPLANATION LEGEND
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Reading Card */}
          <div className="lg:col-span-2 rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Today&apos;s Activity
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--secondary)] text-[var(--foreground)]">
                {todaySummary.isQualified ? "✨ Diya Goal Achieved" : `${todaySummary.readingMinutesRemaining}m left to light Diya`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-2">
              <div className="bg-[var(--background)]/60 border border-[var(--border)]/70 p-3.5 rounded-2xl">
                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <span>📖</span> Reading Time
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--accent)] mt-1">
                  {formatAnalyticsDuration(todaySummary.readingSeconds)}
                </div>
              </div>

              <div className="bg-[var(--background)]/60 border border-[var(--border)]/70 p-3.5 rounded-2xl">
                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <span>⚡</span> Active Time
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--foreground)] mt-1">
                  {formatAnalyticsDuration(todaySummary.activeSeconds)}
                </div>
              </div>

              <div className="bg-[var(--background)]/60 border border-[var(--border)]/70 p-3.5 rounded-2xl">
                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <span>📚</span> Books Read
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--foreground)] mt-1">
                  {todaySummary.booksCount}
                </div>
              </div>

              <div className="bg-[var(--background)]/60 border border-[var(--border)]/70 p-3.5 rounded-2xl">
                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <span>🔥</span> Daily Streak
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--accent)] mt-1">
                  Day {todaySummary.streakDays}
                </div>
              </div>
            </div>

            {/* Daily Reading Goal Progress Bar */}
            <div className="mt-4 pt-4 border-t border-[var(--border)]/60">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-[var(--text-secondary)]">15-Minute Daily Goal</span>
                <span className="text-[var(--foreground)]">
                  {Math.min(100, Math.round((todaySummary.readingSeconds / 900) * 100))}%
                </span>
              </div>
              <div className="h-2 w-full bg-[var(--secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (todaySummary.readingSeconds / 900) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Explanatory Legend Card */}
          <div
            className="rounded-3xl border border-[var(--border)] p-6 shadow-md flex flex-col justify-between"
            style={{ background: "linear-gradient(to bottom, var(--card), color-mix(in srgb, var(--secondary) 30%, transparent))" }}
          >
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                <span>💡</span> Timing Transparency
              </h2>
              <div className="space-y-3.5 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--background)]/60 border border-[var(--border)]">
                  <div className="font-bold text-[var(--accent)] flex items-center gap-1.5">
                    <span>📖</span> Reading Time
                  </div>
                  <p className="text-[var(--text-secondary)] mt-0.5">
                    Time spent actively reading book PDFs in the reader. Powers your Diya & Streak.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--background)]/60 border border-[var(--border)]">
                  <div className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>⚡</span> Active Time
                  </div>
                  <p className="text-[var(--text-secondary)] mt-0.5">
                    Reading Time + active website exploration across Library, Search, My Shelf, etc.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
              <span>Formula: Active ≥ Reading</span>
              <span className="text-[var(--accent)] font-semibold">0 Double-Counting</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. PROMINENT READING REPORT CARD ENTRY
           ========================================================================= */}
        <section 
          className="relative overflow-hidden rounded-3xl border-2 border-[var(--accent)]/30 p-6 sm:p-7 shadow-xl"
          style={{ background: "linear-gradient(to right, var(--card), color-mix(in srgb, var(--secondary) 40%, transparent), var(--card))" }}
          aria-label="Reading Report Card"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-2xl flex-shrink-0 text-[var(--accent)] shadow-inner">
                📊
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[var(--accent)]">
                    Official Document
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                    Print-Ready PDF
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--foreground)] mt-0.5">
                  Reading Report Card
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  Your reading journey, beautifully summarized. Create a printable PDF of your reading habits and milestones.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-[var(--primary-foreground)] font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-[var(--theme-glow)] transition-all transform hover:scale-[1.02] cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center"
            >
              <span>📄</span>
              <span>Generate Report Card</span>
            </button>
          </div>
        </section>

        {/* =========================================================================
            4. TIME FILTER & CORE STATISTICS
           ========================================================================= */}
        <section aria-label="Core Statistics">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Reading Statistics Overview
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Aggregated from your real local reading and exploration records
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] p-1 rounded-2xl shadow-inner self-stretch sm:self-auto overflow-x-auto">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTimeFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    timeFilter === opt.id
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {/* Total Reading Time */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <span>📖</span> Reading
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/25">
                  PDF
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-[var(--accent)] mt-2 truncate">
                {formatAnalyticsDuration(coreStats.totalReadingSeconds)}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">
                Pure book focus
              </div>
            </div>

            {/* Total Active Time */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <span>⚡</span> Active
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25">
                  Total
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-[var(--foreground)] mt-2 truncate">
                {formatAnalyticsDuration(coreStats.totalActiveSeconds)}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">
                Reading + exploration
              </div>
            </div>

            {/* Total Reading Days */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <span>📅</span> Days
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[var(--secondary)] text-[var(--foreground)] font-bold">
                  Active
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-[var(--foreground)] mt-2">
                {coreStats.totalReadingDays} <span className="text-xs font-semibold text-[var(--text-secondary)]">days</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">
                Recorded calendar
              </div>
            </div>

            {/* Books Engaged */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <span>📚</span> Books
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[var(--secondary)] text-[var(--foreground)] font-bold">
                  Engaged
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-[var(--foreground)] mt-2">
                {profileHeader.totalBooksEngaged} <span className="text-xs font-semibold text-[var(--text-secondary)]">books</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">
                Read &amp; saved
              </div>
            </div>

            {/* Avg Daily Reading */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <span>⏱️</span> Avg / Day
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[var(--secondary)] text-[var(--foreground)] font-bold">
                  Daily
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-[var(--foreground)] mt-2 truncate">
                {formatAnalyticsDuration(coreStats.avgReadingSecondsPerDay)}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">
                Per active day
              </div>
            </div>

            {/* Highest Day */}
            <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <span>🏆</span> Best Day
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/25">
                  Peak
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-[var(--accent)] mt-2 truncate">
                {coreStats.highestSingleDayReadingSeconds > 0
                  ? formatAnalyticsDuration(coreStats.highestSingleDayReadingSeconds)
                  : "0m"}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1 truncate">
                {coreStats.bestReadingDay ? coreStats.bestReadingDay.formattedDate : "No records"}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. READING ACTIVITY CONTRIBUTION HEATMAP (GitHub / LeetCode Style)
           ========================================================================= */}
        <section 
          className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-md"
          aria-label="Reading Activity Heatmap"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <span>🗓️</span> Reading Activity Heatmap ({heatmap.year})
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Daily reading intensity colored strictly by genuine book reading time
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[var(--secondary)] text-[var(--foreground)]">
              {heatmap.totalActiveCells} Active Days in {heatmap.year}
            </div>
          </div>

          {/* Matrix Container */}
          <div className="overflow-x-auto pb-2 pt-1">
            <div className="inline-block min-w-[720px]">
              
              {/* Month Labels */}
              <div className="flex text-[10px] text-[var(--text-secondary)] font-medium mb-1 pl-7 h-4 relative">
                {heatmap.monthLabels.map((m, idx) => (
                  <span
                    key={idx}
                    style={{ position: "absolute", left: `${m.colIndex * 15 + 28}px` }}
                  >
                    {m.monthName}
                  </span>
                ))}
              </div>

              {/* Grid: 7 Rows (Sun..Sat) x 53 Weeks */}
              <div className="flex gap-1">
                {/* Weekday indicators */}
                <div className="flex flex-col justify-between text-[9px] text-[var(--text-secondary)] pr-1.5 py-0.5 select-none w-6 text-right">
                  <span>Sun</span>
                  <span>Tue</span>
                  <span>Thu</span>
                  <span>Sat</span>
                </div>

                {/* Weeks Matrix */}
                <div className="flex gap-1">
                  {heatmap.weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((cell) => {
                        let bgClass = "bg-[var(--card)]/40 border-[var(--border)]/40";
                        if (cell.intensityLevel === 1) bgClass = "bg-[var(--accent)]/20 border-[var(--accent)]/30";
                        if (cell.intensityLevel === 2) bgClass = "bg-[var(--accent)]/45 border-[var(--accent)]/60";
                        if (cell.intensityLevel === 3) bgClass = "bg-[var(--accent)]/70 border-[var(--accent)]/80";
                        if (cell.intensityLevel === 4) bgClass = "bg-[var(--accent)]/90 border-[var(--accent)]";
                        if (cell.intensityLevel === 5) bgClass = "bg-[var(--accent)] border-[var(--accent-glow)] shadow-[0_0_6px_var(--theme-glow)]";

                        return (
                          <button
                            key={cell.dateKey}
                            onMouseEnter={() => setHoveredCell(cell)}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => setSelectedCell(cell)}
                            className={`w-3 h-3 rounded-[3px] border transition-all cursor-pointer hover:scale-125 hover:z-20 ${bgClass}`}
                            aria-label={`${cell.formattedDate}: ${formatAnalyticsDuration(cell.readingSeconds)} reading`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mt-4 pt-3 border-t border-[var(--border)]/60">
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--card)]/40 border border-[var(--border)]/40" title="0m" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)]/20 border border-[var(--accent)]/30" title="1-14m" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)]/45 border border-[var(--accent)]/60" title="15-29m (Diya Lit)" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)]/70 border border-[var(--accent)]/80" title="30-59m" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)]/90 border border-[var(--accent)]" title="60-119m" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)] border border-[var(--accent-glow)] shadow-[0_0_4px_var(--theme-glow)]" title="120m+" />
                  </div>
                  <span>More</span>
                </div>

                <div className="text-[11px] text-[var(--text-secondary)]">
                  {hoveredCell ? (
                    <span className="font-semibold text-[var(--foreground)]">
                      {hoveredCell.formattedDate}: {formatAnalyticsDuration(hoveredCell.readingSeconds)} read • {formatAnalyticsDuration(hoveredCell.activeSeconds)} active
                    </span>
                  ) : (
                    <span>Hover or click any day to inspect details</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            5. READING INSIGHTS (Favorite Genre, Most Productive Day, Session Avg)
           ========================================================================= */}
        <section aria-label="Reading Insights">
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-3.5 flex items-center gap-2">
            <span>✨</span> Reading Habits &amp; Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Favorite Genre */}
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <span>❤️</span> Favorite Genre
                  </span>
                  {favoriteGenre && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/25">
                      Top Pick
                    </span>
                  )}
                </div>
                {favoriteGenre ? (
                  <>
                    <h3 className="text-base sm:text-lg font-extrabold text-[var(--accent)] truncate">
                      {favoriteGenre.category}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--foreground)] font-bold mt-1">
                      {formatAnalyticsDuration(favoriteGenre.readingSeconds, { verbose: true })} read
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {favoriteGenre.percentOfTotal}% of all reading time ({favoriteGenre.booksCount} {favoriteGenre.booksCount === 1 ? "book" : "books"})
                    </p>
                  </>
                ) : (
                  <div className="py-2 text-xs text-[var(--text-secondary)]">
                    Explore books in the Library to uncover your favorite genre!
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-secondary)] font-medium">Top categories</span>
                <div className="flex items-center gap-1 truncate max-w-[170px]">
                  {genreBreakdown.slice(0, 2).map((g) => (
                    <span key={g.category} className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[10px] text-[var(--foreground)] font-semibold truncate max-w-[80px]">
                      {g.category}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Most Productive Day */}
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <span>📈</span> Peak Reading Day
                  </span>
                  {readingHabits.mostProductiveDayOfWeek && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25">
                      Peak
                    </span>
                  )}
                </div>
                {readingHabits.mostProductiveDayOfWeek ? (
                  <>
                    <h3 className="text-base sm:text-lg font-extrabold text-[var(--foreground)] truncate">
                      {readingHabits.mostProductiveDayOfWeek.dayName}s
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--accent)] font-bold mt-1">
                      {formatAnalyticsDuration(readingHabits.mostProductiveDayOfWeek.readingSeconds, { verbose: true })} read
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {readingHabits.mostProductiveDayOfWeek.percentOfTotal}% of total reading occurs on this day
                    </p>
                  </>
                ) : (
                  <div className="py-2 text-xs text-[var(--text-secondary)]">
                    Read on different days to discover your peak reading habits.
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-secondary)] font-medium">Habit Consistency</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                  Building Momentum ✨
                </span>
              </div>
            </div>

            {/* Session Habits */}
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <span>⏱️</span> Reading Sessions
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--foreground)] font-bold">
                    {readingHabits.totalRecordedSessions} Total
                  </span>
                </div>
                {readingHabits.avgSessionDurationSeconds ? (
                  <>
                    <h3 className="text-base sm:text-lg font-extrabold text-[var(--foreground)] truncate">
                      {formatAnalyticsDuration(readingHabits.avgSessionDurationSeconds, { verbose: true })}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--foreground)] font-bold mt-1">
                      Average per reading session
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Longest session: <strong className="text-[var(--accent)] font-semibold">{formatAnalyticsDuration(readingHabits.longestSessionSeconds || readingHabits.avgSessionDurationSeconds)}</strong>
                    </p>
                  </>
                ) : (
                  <div className="py-2 text-xs text-[var(--text-secondary)]">
                    Use Focus Mode sessions in the reader to track detailed session duration.
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-secondary)] font-medium">Study Focus</span>
                <span className="font-bold text-[var(--foreground)] px-2 py-0.5 rounded bg-[var(--secondary)] text-[10px] border border-[var(--border)]">
                  {readingHabits.totalRecordedSessions} Session{readingHabits.totalRecordedSessions === 1 ? "" : "s"}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            6. MONTHLY READING JOURNEY
           ========================================================================= */}
        <section 
          className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-md"
          aria-label="Monthly Reading Journey"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <span>📊</span> Monthly Reading Journey
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Historical monthly reading vs website active time breakdown
              </p>
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              {monthlyJourney.length} {monthlyJourney.length === 1 ? "month" : "months"} recorded
            </span>
          </div>

          {monthlyJourney.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
              No historical monthly data recorded yet. Start reading in the library to build your history!
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyJourney.map((m) => (
                <div
                  key={m.monthKey}
                  className="p-4 rounded-2xl bg-[var(--background)]/60 border border-[var(--border)]/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="w-full md:w-48">
                    <div className="text-sm font-bold text-[var(--foreground)]">{m.monthName}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {m.readingDays} {m.readingDays === 1 ? "reading day" : "reading days"}
                    </div>
                  </div>

                  {/* Visual Proportional Bar */}
                  <div className="w-full flex-1">
                    <div className="flex items-center justify-between text-xs mb-1 font-medium">
                      <span className="text-[var(--accent)] font-semibold">
                        📖 {formatAnalyticsDuration(m.readingSeconds)} Read
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        ⚡ {formatAnalyticsDuration(m.activeSeconds)} Total Active
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[var(--secondary)] rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                        style={{ width: `${m.percentOfActiveTime}%` }}
                        title={`${m.percentOfActiveTime}% Reading Time`}
                      />
                    </div>
                  </div>

                  <div className="text-right w-full md:w-36 text-xs text-[var(--text-secondary)]">
                    <div>Avg: <strong className="text-[var(--foreground)]">{formatAnalyticsDuration(m.avgReadingSecondsPerDay)}</strong>/day</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================================
            7. MOST READ BOOKS & RECENT ACTIVITY
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Most Read Books Ranked */}
          <section 
            className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-md"
            aria-label="Most Read Books"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <span>🏆</span> Top Read Books
              </h2>
              <span className="text-xs text-[var(--text-secondary)]">Ranked by reading time</span>
            </div>

            {mostReadBooks.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
                No book reading history yet. Start reading a book to see your rankings!
              </div>
            ) : (
              <div className="space-y-3">
                {mostReadBooks.slice(0, 5).map((item, rank) => (
                  <Link
                    key={item.book.id}
                    href={`/book/${item.book.id}`}
                    className="p-3 rounded-2xl bg-[var(--background)]/50 hover:bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all flex items-center gap-3.5 group cursor-pointer"
                  >
                    {/* Rank Badge */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      rank === 0
                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/40"
                        : rank === 1
                        ? "bg-slate-300/20 text-slate-300 border border-slate-300/40"
                        : rank === 2
                        ? "bg-amber-700/20 text-amber-600 border border-amber-700/40"
                        : "bg-[var(--secondary)] text-[var(--text-secondary)]"
                    }`}>
                      #{rank + 1}
                    </div>

                    {/* Book Cover */}
                    <div className="w-10 h-14 relative rounded-md overflow-hidden bg-[var(--muted)] flex-shrink-0 shadow-sm">
                      {item.book.cover ? (
                        <Image
                          src={item.book.cover}
                          alt={item.book.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">📖</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {item.book.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{item.book.author}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--accent)]">
                          {item.readingSeconds > 0 ? item.readingTimeFormatted : `${item.progress}% read`}
                        </span>
                        {item.progress > 0 && <span>• {item.progress}% complete</span>}
                      </div>
                    </div>

                    <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recently Read Books */}
          <section 
            className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-md"
            aria-label="Recently Read"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <span>📖</span> Recently Read
              </h2>
              <Link href="/favorites" className="text-xs text-[var(--accent)] hover:underline font-semibold">
                Go to My Shelf →
              </Link>
            </div>

            {recentlyReadBooks.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
                No recent books. Visit the library to start reading!
              </div>
            ) : (
              <div className="space-y-3">
                {recentlyReadBooks.slice(0, 5).map((item) => (
                  <Link
                    key={item.book.id}
                    href={`/book/${item.book.id}`}
                    className="p-3 rounded-2xl bg-[var(--background)]/50 hover:bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all flex items-center gap-3.5 group cursor-pointer"
                  >
                    {/* Cover */}
                    <div className="w-10 h-14 relative rounded-md overflow-hidden bg-[var(--muted)] flex-shrink-0 shadow-sm">
                      {item.book.cover ? (
                        <Image
                          src={item.book.cover}
                          alt={item.book.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">📖</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {item.book.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{item.book.author}</p>
                      
                      {/* Progress Mini Bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-[var(--secondary)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent)] rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">{item.progress}%</span>
                      </div>
                    </div>

                    <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* =========================================================================
            8. LOCAL PRIVACY & DATA TRANSPARENCY NOTE
           ========================================================================= */}
        <footer className="rounded-3xl bg-[var(--card)]/60 border border-[var(--border)]/80 p-5 text-center text-xs text-[var(--text-secondary)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-left">
            <span className="text-base">🔒</span>
            <span>
              <strong>100% Local &amp; Private:</strong> All reading telemetry and statistics are computed entirely inside your browser. No account, login, server tracking, or cloud sync is used.
            </span>
          </div>
          <Link
            href="/favorites"
            className="px-3.5 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--card)] text-[var(--foreground)] font-semibold text-xs border border-[var(--border)] transition-all whitespace-nowrap"
          >
            Manage Data &amp; Backups
          </Link>
        </footer>

      </div>

      {/* Official Reading Report Card Modal */}
      <ReadingReportCardModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialFilter="month"
      />

      {/* Global Google Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Social Followers & Following Modal */}
      {user && socialProfile && (
        <FollowersModal
          isOpen={isFollowersModalOpen}
          onClose={() => setIsFollowersModalOpen(false)}
          targetUid={user.uid}
          targetUsername={socialProfile.username}
          initialTab={followersModalTab}
        />
      )}

      {/* Social Profile Settings Modal */}
      {user && socialProfile && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          profile={socialProfile}
          onProfileUpdated={(updated) => setSocialProfile(updated)}
        />
      )}

      {/* Username Onboarding Setup Modal */}
      {user && (
        <UsernameSetupModal
          isOpen={isUsernameSetupOpen}
          user={user}
          onSuccess={(profile) => {
            setSocialProfile(profile);
            setIsUsernameSetupOpen(false);
          }}
          onDismiss={() => setIsUsernameSetupOpen(false)}
        />
      )}

      {/* User Discovery & Search Modal */}
      <UserSearchModal
        isOpen={isUserSearchModalOpen}
        onClose={() => setIsUserSearchModalOpen(false)}
      />
      </div>
    </AuthGuard>
  );
}