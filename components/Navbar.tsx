"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLibrary } from "@/context/LibraryContext";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import Logo from "./Logo";
import NavbarThemeControl from "./visual/NavbarThemeControl";
import DiwaliDiya from "./visual/DiwaliDiya";
import AuthModal from "./auth/AuthModal";
import InstallAppButton from "./pwa/InstallAppButton";
import { useEntitlement } from "@/context/EntitlementContext";
import ProBadge from "./payment/ProBadge";

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { favorites } = useLibrary();
  const { user } = useAuth();
  const { isPro, openProModal, openSupportModal } = useEntitlement();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global keyboard shortcut (Ctrl+K, Cmd+K, or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);
      if (isInput) return;

      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || e.key === "/") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Library", href: "/library" },
    { name: "My Shelf", href: "/favorites", count: favorites.length },
    { name: "Profile", href: "/profile" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[var(--card)]/90 backdrop-blur-xl border-b border-[var(--border)] shadow-lg shadow-black/5"
            : "bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-7 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Original Logo (Shifted slightly left) */}
          <Link href="/" className="flex items-center gap-2.5 group select-none -ml-1 sm:-ml-2.5">
            <Logo size={39} showWordmark={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold tracking-wide transition-all ${
                    isActive
                      ? "text-[var(--foreground)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/80 shadow-xs border border-[var(--border)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60"
                  }`}
                >
                  <span>{link.name}</span>
                  {link.count !== undefined && link.count > 0 && (
                    <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] bg-[var(--accent)] text-[var(--accent-foreground)] font-extrabold shadow-xs">
                      {link.count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/50 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold shadow-xs transition-all cursor-pointer group"
              aria-label="Search books"
            >
              <svg
                className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="hidden sm:inline font-bold">Search</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[var(--background)] text-[var(--text-secondary)] rounded border border-[var(--border)] font-bold">
                ⌘K
              </kbd>
            </button>

            {/* Daily Reading Streak (Diwali Diya) */}
            <DiwaliDiya />

            {/* Theme Switcher Control (Desktop & Tablet) */}
            <div className="hidden md:block">
              <NavbarThemeControl />
            </div>

            {/* PWA Install App Button (Desktop / Tablet) */}
            <InstallAppButton />

            {/* Reader Pro Upgrade Button (Desktop / Tablet) */}
            {!isPro && (
              <button
                onClick={() => openProModal()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-orange-500/20 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-300 hover:text-amber-200 border border-amber-500/50 text-xs sm:text-[13px] font-extrabold shadow-sm transition-all hover:scale-105 cursor-pointer select-none"
                title="Upgrade to Reader Pro"
                aria-label="Reader Pro"
              >
                <span>✨</span>
                <span>Pro</span>
              </button>
            )}

            {/* User Reading Profile / Google Auth Box (Enlarged & Polished) */}
            {user ? (
              <Link
                href="/profile"
                className={`group relative flex items-center justify-center w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 cursor-pointer ${
                  pathname === "/profile"
                    ? "shadow-[0_0_18px_var(--theme-glow)] ring-2 ring-[var(--accent)]/50 scale-105"
                    : "shadow-xs hover:shadow-[0_0_18px_var(--theme-glow)]/50 hover:scale-[1.05]"
                }`}
                aria-label="Reading Profile & Analytics"
                title={`Profile: ${user.displayName || user.email}`}
              >
                {/* Traveling Luminous Border Accent (Conic Beam) */}
                <span
                  className="profile-border-beam absolute inset-[-150%] rounded-full bg-[conic-gradient(from_0deg,transparent_0_280deg,var(--accent)_330deg,var(--primary)_360deg)] opacity-85 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                />

                {/* Inner Avatar Body */}
                <span
                  className={`relative z-10 w-full h-full rounded-[11px] sm:rounded-[14px] flex items-center justify-center overflow-hidden transition-all duration-200 ${
                    pathname === "/profile"
                      ? "bg-gradient-to-tr from-[var(--primary)] via-[var(--primary)] to-[var(--accent)] text-[var(--primary-foreground)]"
                      : "bg-[var(--card)] group-hover:bg-[var(--secondary)] text-[var(--text-secondary)] group-hover:text-[var(--foreground)]"
                  }`}
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      fill
                      sizes="46px"
                      referrerPolicy="no-referrer"
                      className="object-cover rounded-[11px] sm:rounded-[14px]"
                    />
                  ) : (
                    <span className="font-extrabold text-sm sm:text-base text-[var(--accent)] font-serif">
                      {user.displayName?.charAt(0) || "U"}
                    </span>
                  )}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="group relative flex items-center justify-center w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 cursor-pointer shadow-xs hover:shadow-[0_0_18px_var(--theme-glow)]/60 hover:scale-[1.05]"
                aria-label="Sign In with Google"
                title="Sign In with Google to Sync Library"
              >
                {/* Traveling Luminous Border Accent */}
                <span
                  className="profile-border-beam absolute inset-[-150%] rounded-full bg-[conic-gradient(from_0deg,transparent_0_280deg,var(--accent)_330deg,var(--primary)_360deg)] opacity-85 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                />

                {/* Inner Button Body */}
                <span className="relative z-10 w-full h-full rounded-[11px] sm:rounded-[14px] bg-[var(--card)] group-hover:bg-[var(--secondary)] text-[var(--accent)] flex items-center justify-center transition-all duration-200">
                  <svg
                    className="w-5 h-5 sm:w-5.5 sm:h-5.5 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_var(--theme-glow)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="7.5"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4.5 19.25C4.5 15.9363 7.85786 13.25 12 13.25C16.1421 13.25 19.5 15.9363 19.5 19.25"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            )}

            <style jsx>{`
              @keyframes profileBeamSpin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
              .profile-border-beam {
                animation: profileBeamSpin 4s linear infinite;
              }
              :global(.group:hover) .profile-border-beam {
                animation-duration: 2s;
              }
              @media (prefers-reduced-motion: reduce) {
                .profile-border-beam {
                  animation: none !important;
                }
              }
            `}</style>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3 animate-fade-in">
            {/* Mobile Account Status / Sign In Button */}
            <div className="pb-3 border-b border-[var(--border)]">
              {user ? (
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--secondary)] flex-shrink-0 flex items-center justify-center">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          fill
                          sizes="36px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-bold text-xs text-[var(--accent)]">
                          {user.displayName?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--foreground)] truncate font-serif">
                        {user.displayName || "Reader"}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        Cloud Synced
                      </p>
                    </div>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/20"
                  >
                    Profile →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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

              {/* In-App PWA Install Prompt for Mobile */}
              <div className="pt-2">
                <InstallAppButton
                  variant="mobile-menu"
                  onInstalled={() => setIsMobileMenuOpen(false)}
                />
              </div>

              {/* Mobile Pro & Support CTAs */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openProModal();
                  }}
                  className="py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <span>✨</span>
                  <span>{isPro ? "Pro Active" : "Reader Pro"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openSupportModal();
                  }}
                  className="py-2 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <span>💛</span>
                  <span>Support</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold"
                        : "text-[var(--text-secondary)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span>{link.name}</span>
                    {link.count !== undefined && link.count > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold">
                        {link.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Theme Selector inside Hamburger Menu */}
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Theme & Appearance</span>
              <NavbarThemeControl />
            </div>
          </div>
        )}
      </header>

      {/* Global Quick Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Global Google Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
