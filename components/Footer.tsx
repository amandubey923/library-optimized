"use client";

import React from "react";
import Link from "next/link";
import Logo from "./Logo";
import { useEntitlement } from "@/context/EntitlementContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { openProModal, openSupportModal } = useEntitlement();

  return (
    <footer className="border-t border-[var(--border)]/80 bg-[var(--background)] text-[var(--text-secondary)] transition-colors duration-300">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Logo size={38} showWordmark={true} />
            </Link>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
              A modern, high-performance public reading sanctuary designed to make classical Hindi literature, world masterpieces, and philosophical treasures immediately accessible to everyone.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-[var(--accent)] font-medium">
              <span>✦ 100% Free</span>
              <span>•</span>
              <span>✦ No Login Required</span>
              <span>•</span>
              <span>✦ Privacy First</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider font-serif">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-[var(--accent)] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-[var(--accent)] transition-colors">
                  Full Catalog (25 Books)
                </Link>
              </li>
              <li>
                <button
                  onClick={() => openProModal()}
                  className="hover:text-amber-400 transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <span>✨</span>
                  <span>Reader Pro</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openSupportModal()}
                  className="hover:text-amber-400 transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <span>💛</span>
                  <span>Support Library</span>
                </button>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-[var(--accent)] transition-colors">
                  My Favorites
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[var(--accent)] transition-colors">
                  About the Project
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--accent)] transition-colors">
                  Contact & Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Literary Genres */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider font-serif">
              Collections
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/library?category=Hindi+Literature" className="hover:text-[var(--accent)] transition-colors">
                  Hindi Literature
                </Link>
              </li>
              <li>
                <Link href="/library?category=Classics" className="hover:text-[var(--accent)] transition-colors">
                  World Classics
                </Link>
              </li>
              <li>
                <Link href="/library?category=Philosophy+%26+Spirituality" className="hover:text-[var(--accent)] transition-colors">
                  Philosophy & Wisdom
                </Link>
              </li>
              <li>
                <Link href="/library?category=Romance" className="hover:text-[var(--accent)] transition-colors">
                  Romance & Poetry
                </Link>
              </li>
              <li>
                <Link href="/library?category=Fiction+%26+Dystopian" className="hover:text-[var(--accent)] transition-colors">
                  Fiction & Dystopian
                </Link>
              </li>
            </ul>
          </div>

          {/* Quote & Philosophy */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider font-serif">
              Reader&apos;s Motto
            </h4>
            <blockquote className="text-xs text-[var(--text-secondary)] italic border-l-2 border-[var(--accent)]/50 pl-3 leading-relaxed">
              &ldquo;A reader lives a thousand lives before he dies. The man who never reads lives only one.&rdquo;
            </blockquote>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              — George R.R. Martin
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--border)]/60 bg-[var(--background)] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
          <p>© {currentYear} Reader&apos;s HUB. All literary works presented for educational and cultural discovery.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-[var(--foreground)] transition-colors">
              About
            </Link>
            <Link href="/library" className="hover:text-[var(--foreground)] transition-colors">
              Library
            </Link>
            <Link href="/contact" className="hover:text-[var(--foreground)] transition-colors">
              Feedback
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
