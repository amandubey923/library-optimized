"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isAdminUser } from "@/lib/admin";
import AuthModal from "@/components/auth/AuthModal";

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Auto redirect if user is authenticated but not authorized as admin
  useEffect(() => {
    if (!loading && user && !isAdminUser(user.email)) {
      const timer = setTimeout(() => {
        router.replace("/");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  // 1. Loading State: Smooth skeleton pulse
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 w-48 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-28 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-28 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
            <div className="h-28 rounded-2xl bg-[var(--card)]/70 border border-[var(--border)]" />
          </div>
          <div className="h-80 rounded-3xl bg-[var(--card)]/70 border border-[var(--border)]" />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Sign in prompt for Admin
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
      <div className="min-h-[85vh] flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-[var(--border)] bg-[var(--card)]/85 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Ambient decorative glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Shield Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-3xl mb-6 shadow-inner">
            🛡️
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mb-3">
            Admin Console
          </h2>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
            Access to this administrative portal is restricted. Please sign in with an authorized administrator account to continue.
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
              {isSigningIn ? "Signing in..." : "Sign In with Google"}
            </button>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card)] border border-[var(--border)] transition-all flex items-center justify-center gap-2"
            >
              ← Return to Reader Hub
            </Link>
          </div>

          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
      </div>
    );
  }

  // 3. Authenticated but Unauthorized User
  if (!isAdminUser(user.email)) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-[var(--card)]/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Ambient red glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Locked Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 mx-auto flex items-center justify-center text-3xl mb-6 shadow-inner">
            ⛔
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2">
            Access Denied
          </h2>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-4">
            403 • Unauthorized
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            The account <strong className="text-[var(--foreground)]">{user.email}</strong> does not have administrator privileges for Reader Hub.
          </p>

          <p className="text-xs text-[var(--text-secondary)]/80 mb-6">
            Redirecting you back to the home page in a few seconds...
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3 px-5 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-black shadow-md transition-all flex items-center justify-center gap-2"
            >
              Return to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin User: Render dashboard
  return <>{children}</>;
}

