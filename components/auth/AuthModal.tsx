"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, loading, error, signInWithGoogle, signOutUser, clearAuthError } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll locking
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    clearAuthError();
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        onClose();
      }
    } catch (err) {
      console.error("[AuthModal] Sign in error:", err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-[var(--card)]/95 border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden animate-scale-up">
        {/* Luminous Ambient Background Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[var(--accent)]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-[var(--primary)]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all cursor-pointer"
          aria-label="Close authentication modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {user ? (
          /* =========================================================================
             AUTHENTICATED STATE VIEW
             ========================================================================= */
          <div className="text-center space-y-5">
            <div className="relative mx-auto w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] shadow-xl overflow-hidden">
              <div className="w-full h-full rounded-[14px] bg-[var(--card)] flex items-center justify-center overflow-hidden">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "Google Account"}
                    fill
                    sizes="80px"
                    referrerPolicy="no-referrer"
                    className="object-cover rounded-[14px]"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[var(--accent)] font-serif">
                    {user.displayName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 id="auth-modal-title" className="text-xl font-bold text-[var(--foreground)] font-serif">
                {user.displayName || "Reader's HUB Account"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud Library Synced</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-4">
              Your reading progress, book streaks, and favorites are synchronized securely across all your devices.
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] text-[var(--primary-foreground)] font-bold text-xs shadow-md hover:scale-[1.02] transition-all cursor-pointer"
              >
                Continue Reading
              </button>
              <button
                onClick={async () => {
                  await signOutUser();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             SIGN IN / SIGN UP GUEST VIEW
             ========================================================================= */
          <div className="text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-[var(--card)] flex items-center justify-center text-[var(--accent)]">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>

            <div>
              <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-bold text-[var(--foreground)] font-serif">
                Sign in to Reader&apos;s HUB
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                Sync reading progress, favorites &amp; streaks across all devices.
              </p>
            </div>

            {/* Error Banner if any */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-left">
                {error}
              </div>
            )}

            {/* Primary Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isSigningIn ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Local-first Privacy Notice */}
            <p className="text-[11px] text-[var(--text-secondary)]/80 leading-normal">
              🔒 Guest reading is always saved locally on this browser. Signing in allows instant multi-device backup.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

