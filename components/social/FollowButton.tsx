"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { checkIsFollowing, followUser, unfollowUser } from "@/lib/social";

interface FollowButtonProps {
  targetUid: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "sm" | "md";
  className?: string;
}

export default function FollowButton({
  targetUid,
  initialIsFollowing,
  onFollowChange,
  size = "md",
  className = "",
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(Boolean(initialIsFollowing));
  const [loading, setLoading] = useState(initialIsFollowing === undefined);
  const [isHovered, setIsHovered] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const isSelf = user?.uid === targetUid;

  useEffect(() => {
    let isMounted = true;
    if (initialIsFollowing !== undefined) {
      setIsFollowing(initialIsFollowing);
      setLoading(false);
      return;
    }

    if (!user || !targetUid || isSelf) {
      setLoading(false);
      return;
    }

    checkIsFollowing(user.uid, targetUid).then((following) => {
      if (isMounted) {
        setIsFollowing(following);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, targetUid, isSelf, initialIsFollowing]);

  if (isSelf) {
    return null; // Cannot follow oneself
  }

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please sign in with your Google account to follow readers.");
      return;
    }

    if (actionInProgress) return;

    setActionInProgress(true);
    const nextState = !isFollowing;
    // Optimistic update
    setIsFollowing(nextState);
    if (onFollowChange) onFollowChange(nextState);

    try {
      if (nextState) {
        await followUser(user.uid, targetUid);
      } else {
        await unfollowUser(user.uid, targetUid);
      }
    } catch (err) {
      console.error("[FollowButton] Toggle failed:", err);
      // Revert on error
      setIsFollowing(!nextState);
      if (onFollowChange) onFollowChange(!nextState);
    } finally {
      setActionInProgress(false);
    }
  };

  const sizeClasses = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-xs sm:text-sm";

  if (loading) {
    return (
      <div
        className={`rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] animate-pulse ${sizeClasses} ${className}`}
      >
        <span className="opacity-0">Follow</span>
      </div>
    );
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleToggleFollow}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={actionInProgress}
        className={`rounded-xl font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${sizeClasses} ${
          isHovered
            ? "bg-rose-500/15 text-rose-400 border border-rose-500/40 hover:bg-rose-500/25"
            : "bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/40"
        } ${className}`}
        aria-label={isHovered ? "Unfollow this reader" : "Following"}
      >
        {isHovered ? (
          <>
            <span>✕</span>
            <span>Unfollow</span>
          </>
        ) : (
          <>
            <span className="text-emerald-400">✓</span>
            <span>Following</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={actionInProgress}
      className={`rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black shadow-amber-500/20 ${sizeClasses} ${className}`}
      aria-label="Follow this reader"
    >
      <span>+</span>
      <span>Follow</span>
    </button>
  );
}

