"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

interface AuthGuardProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

export default function AuthGuard({
  children,
  pageTitle = "Account Area",
  pageDescription = "Please sign in to access your personal reading shelf, profile stats, and cloud-synced library.",
}: AuthGuardProps) {
  const { user, loading, signInWithGoogle } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // 1. Loading State: Smooth skeleton pulse
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 w-48 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
          <div className="h-64 rounded-3xl bg-[var(--card)]/70 border border-[var(--border)]" />
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

  // 2. Unauthenticated State: Clean, secure login gate
  if (!user) {
    const handleGoogleSignIn = async () => {
      setIsSigningIn(true);
      try {
        await signInWithGoogle();
      } finally {
        setIsSigningIn(false);
      }
    };

    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Ambient decorative glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 mx-auto flex items-center justify-center text-3xl mb-6 shadow-inner">
            🔒
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mb-3">
            {pageTitle}
          </h2>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-8">
            {pageDescription}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-3 px-5 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {isSigningIn ? "Signing in..." : "Continue with Google"}
            </button>

            <Link
              href="/library"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card)] border border-[var(--border)] transition-all flex items-center justify-center gap-2"
            >
              ← Back to Public Library
            </Link>
          </div>

          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
      </div>
    );
  }

  // 3. Authenticated: Render protected page
  return <>{children}</>;
}
