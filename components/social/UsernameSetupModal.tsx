"use client";

import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  PublicUserProfile,
  isValidUsername,
  sanitizeUsername,
  isUsernameAvailable,
  suggestUsername,
  claimUsernameAndCreateProfile,
} from "@/lib/social";

interface UsernameSetupModalProps {
  isOpen: boolean;
  user: User;
  onSuccess: (profile: PublicUserProfile) => void;
  onDismiss?: () => void;
}

export default function UsernameSetupModal({
  isOpen,
  user,
  onSuccess,
  onDismiss,
}: UsernameSetupModalProps) {
  const [usernameInput, setUsernameInput] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Suggest usernames when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    setDisplayName(user.displayName || "");
    setBio("");
    setErrorMessage(null);

    let isMounted = true;

    async function generateInitialSuggestions() {
      try {
        const primary = await suggestUsername(user.displayName || user.email, user.uid);
        if (!isMounted) return;
        setUsernameInput(primary);

        // Also prepare 2 extra suggestion alternatives
        const alt1 = await suggestUsername((user.displayName || "reader") + "_hub", user.uid);
        const alt2 = await suggestUsername((user.displayName || "reader") + "_reads", user.uid);
        if (isMounted) {
          const list = Array.from(new Set([primary, alt1, alt2])).filter((s) => s !== primary).slice(0, 2);
          setSuggestions(list);
        }
      } catch (err) {
        console.warn("[UsernameSetupModal] Suggestion failed:", err);
      }
    }

    generateInitialSuggestions();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  // Live debounced availability check
  useEffect(() => {
    const clean = sanitizeUsername(usernameInput);
    if (!clean) {
      setStatus("idle");
      return;
    }

    if (!isValidUsername(clean)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    const timer = setTimeout(async () => {
      const avail = await isUsernameAvailable(clean, user?.uid);
      setStatus(avail ? "available" : "taken");
    }, 350);

    return () => clearTimeout(timer);
  }, [usernameInput, user?.uid]);

  if (!isOpen) return null;

  const handleSelectSuggestion = (suggested: string) => {
    setUsernameInput(suggested);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = sanitizeUsername(usernameInput);
    if (!isValidUsername(clean)) {
      setErrorMessage("Username must be 3-20 letters, numbers, or underscores.");
      return;
    }

    if (status === "taken") {
      setErrorMessage(@ is already taken. Please choose another username.);
      setErrorMessage(`@${clean} is already taken. Please choose another username.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await claimUsernameAndCreateProfile(user, clean, {
        displayName: displayName.trim() || user.displayName || clean,
        bio: bio.trim(),
      });
      onSuccess(profile);
    } catch (err: any) {
      console.error("[UsernameSetupModal] Claim error:", err);
      setErrorMessage(err.message || "Failed to set username. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-[var(--accent)]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if dismissible */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
            👋
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[var(--foreground)]">
            Welcome to Reader Hub
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
            Choose your unique reader handle to share your shelves, track reading streaks, and connect with other readers.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Username Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[var(--foreground)]">
                Choose Unique Username <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] font-mono">
                {status === "checking" && (
                  <span className="text-amber-400">Checking availability...</span>
                )}
                {status === "available" && (
                  <span className="text-emerald-400 font-bold">✓ Available</span>
                )}
                {status === "taken" && (
                  <span className="text-rose-400 font-bold">✕ Already taken</span>
                )}
                {status === "invalid" && (
                  <span className="text-rose-400">3-20 letters, digits or _</span>
                )}
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-secondary)] font-mono font-bold text-base select-none">
                @
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) =>
                  setUsernameInput(
                    e.target.value
                      .replace(/^@+/, "")
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                      .slice(0, 20)
                  )
                }
                placeholder="aman_reads"
                maxLength={20}
                required
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] font-mono text-sm text-[var(--foreground)] focus:outline-hidden transition-all placeholder:text-[var(--text-secondary)]/50"
              />
            </div>

            {/* Suggestions list */}
            {suggestions.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-[var(--text-secondary)]">
                <span>Suggestions:</span>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="px-2 py-0.5 rounded-md bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--accent)] border border-[var(--border)] font-mono cursor-pointer transition-all"
                  >
                    @{s}
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">
              Public profile URL: <code>/profile/{sanitizeUsername(usernameInput) || "your_handle"}</code>
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Aman Dubey"
              maxLength={40}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs sm:text-sm text-[var(--foreground)] focus:outline-hidden transition-all"
            />
          </div>

          {/* Bio (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[var(--foreground)]">
                Reader Bio <span className="text-[var(--text-secondary)] font-normal">(optional)</span>
              </label>
              <span className="text-[10px] text-[var(--text-secondary)]">{bio.length}/160</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={160}
              placeholder="Tell other readers about your favorite books, topics, or goals..."
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] focus:border-[var(--accent)] text-xs text-[var(--foreground)] focus:outline-hidden transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || status === "checking" || status === "taken" || !usernameInput}
              className="w-full py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-black/40 border-t-black animate-spin" />
                  <span>Setting up Profile...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Confirm Username &amp; Continue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
