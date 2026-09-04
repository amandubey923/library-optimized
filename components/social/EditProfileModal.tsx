"use client";

import React, { useState, useEffect } from "react";
import {
  PublicUserProfile,
  isValidUsername,
  sanitizeUsername,
  isUsernameAvailable,
  updateUserProfile,
} from "@/lib/social";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PublicUserProfile;
  onProfileUpdated: (updated: PublicUserProfile) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio || "");
  const [isPublic, setIsPublic] = useState(profile.isPublic !== false);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUsername(profile.username);
    setDisplayName(profile.displayName);
    setBio(profile.bio || "");
    setIsPublic(profile.isPublic !== false);
    setUsernameStatus("idle");
    setErrorMessage(null);
  }, [profile, isOpen]);

  // Debounced username validation
  useEffect(() => {
    const clean = sanitizeUsername(username);
    if (!clean) {
      setUsernameStatus("invalid");
      return;
    }
    if (clean === profile.username) {
      setUsernameStatus("available");
      return;
    }
    if (!isValidUsername(clean)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(() => {
      isUsernameAvailable(clean, profile.uid).then((avail) => {
        setUsernameStatus(avail ? "available" : "taken");
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [username, profile.username, profile.uid]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = sanitizeUsername(username);
    if (!isValidUsername(clean)) {
      setErrorMessage("Username must be 3-20 letters, numbers, or underscores.");
      return;
    }

    if (clean !== profile.username && usernameStatus !== "available") {
      setErrorMessage("Please choose an available username.");
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage("Display name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateUserProfile(
        profile.uid,
        {
          username: clean,
          displayName: displayName.trim(),
          bio: bio.trim(),
          isPublic,
        },
        profile.username
      );

      onProfileUpdated(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h3 className="font-bold text-lg text-[var(--foreground)] font-serif">
              Edit Reader Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Username Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[var(--foreground)]">
                Unique Username
              </label>
              <span className="text-[11px] font-mono">
                {usernameStatus === "checking" && (
                  <span className="text-amber-400">Checking...</span>
                )}
                {usernameStatus === "available" && (
                  <span className="text-emerald-400">✓ Available</span>
                )}
                {usernameStatus === "taken" && (
                  <span className="text-rose-400">✕ Already taken</span>
                )}
                {usernameStatus === "invalid" && (
                  <span className="text-rose-400">3-20 chars (a-z, 0-9, _)</span>
                )}
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-secondary)] font-mono font-bold text-sm">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .replace(/^@+/, "")
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                      .slice(0, 20)
                  )
                }
                placeholder="your_username"
                maxLength={20}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] font-mono text-xs sm:text-sm text-[var(--foreground)] focus:outline-hidden transition-all"
              />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              Your public profile will be accessible at: <code>/profile/{sanitizeUsername(username) || "username"}</code>
            </p>
          </div>

          {/* Display Name Field */}
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              maxLength={40}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs sm:text-sm text-[var(--foreground)] focus:outline-hidden transition-all"
            />
          </div>

          {/* Bio Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[var(--foreground)]">
                Reader Bio
              </label>
              <span className="text-[10px] text-[var(--text-secondary)]">
                {bio.length}/160
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="What genres or authors inspire your reading journey?..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs sm:text-sm text-[var(--foreground)] focus:outline-hidden transition-all resize-none"
            />
          </div>

          {/* Public Profile Toggle */}
          <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/40 border border-[var(--border)] flex items-center justify-between">
            <div>
              <span className="font-bold text-[var(--foreground)] block">
                Public Reader Profile
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Allow other readers to discover and follow your reading journey
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isPublic ? "bg-amber-500" : "bg-[var(--secondary)] border border-[var(--border)]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  isPublic ? "left-6.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || (username !== profile.username && usernameStatus !== "available")}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-black shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

