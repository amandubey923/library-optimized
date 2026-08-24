"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLibrary } from "@/context/LibraryContext";
import dynamic from "next/dynamic";
import Logo from "./Logo";
import NavbarThemeControl from "./visual/NavbarThemeControl";
import DiwaliDiya from "./visual/DiwaliDiya";

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { favorites } = useLibrary();

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
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? "glass-nav shadow-xl py-3" : "bg-[var(--background)]/85 backdrop-blur-md py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand & New Original Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={38} showWordmark={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[var(--card)]/80 border border-[var(--border)]/80 px-4 py-1.5 rounded-full shadow-inner" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {link.name}
                  {link.count !== undefined && link.count > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                        isActive
                          ? "bg-[var(--primary-foreground)] text-[var(--primary)]"
                          : "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
                      }`}
                    >
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Group: Quick Search + Diya + Profile + Theme Switcher + CTA + Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/40 px-3 py-2 rounded-xl text-xs font-medium shadow-sm transition-all cursor-pointer group"
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
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="hidden sm:inline text-[var(--foreground)]">Search</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[var(--background)] text-[var(--text-secondary)] rounded border border-[var(--border)]">
                ⌘K
              </kbd>
            </button>

            {/* Daily Reading Streak (Diwali Diya) */}
            <DiwaliDiya />

            {/* Local User Reading Profile / Analytics Link */}
            <Link
              href="/profile"
              className={`group relative flex items-center justify-center w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-xl p-[1.5px] overflow-hidden transition-all duration-300 cursor-pointer ${
                pathname === "/profile"
                  ? "shadow-[0_0_16px_var(--theme-glow)] ring-2 ring-[var(--accent)]/40 scale-105"
                  : "shadow-xs hover:shadow-[0_0_15px_var(--theme-glow)]/40 hover:scale-[1.04]"
              }`}
              aria-label="Reading Profile & Analytics"
              title="Your Local Reading Profile & Analytics"
            >
              {/* Traveling Luminous Border Accent (Conic Beam) */}
              <span
                className="profile-border-beam absolute inset-[-150%] rounded-full bg-[conic-gradient(from_0deg,transparent_0_280deg,var(--accent)_330deg,var(--primary)_360deg)] opacity-85 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              />

              {/* Inner Interactive Button Body */}
              <span
                className={`relative z-10 w-full h-full rounded-[10.5px] flex items-center justify-center transition-all duration-200 ${
                  pathname === "/profile"
                    ? "bg-gradient-to-tr from-[var(--primary)] via-[var(--primary)] to-[var(--accent)] text-[var(--primary-foreground)]"
                    : "bg-[var(--card)] group-hover:bg-[var(--secondary)] text-[var(--text-secondary)] group-hover:text-[var(--foreground)]"
                }`}
              >
                <svg
                  className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_var(--theme-glow)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="7.5"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.5 19.25C4.5 15.9363 7.85786 13.25 12 13.25C16.1421 13.25 19.5 15.9363 19.5 19.25"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>

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

            {/* MANDATORY THEME SWITCHER CONTROL IN TOP-RIGHT NAVBAR */}
            <NavbarThemeControl />

            {/* Read Catalog Direct CTA */}
            <Link
              href="/library"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] hover:opacity-95 text-[var(--primary-foreground)] font-semibold text-xs shadow-md transition-all hover:shadow-[0_0_15px_var(--theme-glow)] hover:scale-[1.02]"
            >
              <span>Explore</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

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
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2 animate-fade-in">
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
        )}
      </header>

      {/* Global Quick Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
