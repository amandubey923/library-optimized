"use client";

import React, { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    __pwaInstallPrompt?: any;
  }
}

interface InstallAppButtonProps {
  className?: string;
  variant?: "navbar" | "mobile-menu" | "banner";
  onInstalled?: () => void;
}

export default function InstallAppButton({
  className = "",
  variant = "navbar",
  onInstalled,
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if prompt was captured early in layout script
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
      setIsInstallable(true);
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handlePromptAvailable = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
        setIsInstallable(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
      if (onInstalled) onInstalled();
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("pwa-prompt-available", handlePromptAvailable);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("pwa-prompt-available", handlePromptAvailable);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [onInstalled]);

  const handleInstallClick = useCallback(async () => {
    const promptToUse = deferredPrompt || window.__pwaInstallPrompt;
    if (!promptToUse) return;

    try {
      promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstallable(false);
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.__pwaInstallPrompt = null;
      }
    } catch (err) {
      console.warn("[PWA] Install prompt error:", err);
    }
  }, [deferredPrompt]);

  if (!isInstallable || isInstalled) {
    return null;
  }

  if (variant === "mobile-menu") {
    return (
      <button
        onClick={handleInstallClick}
        className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-[var(--primary-foreground)] font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all ${className}`}
        aria-label="Install Reader's HUB App"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Install App</span>
      </button>
    );
  }

  return (
    <>
      {/* Desktop / Tablet Button */}
      <button
        onClick={handleInstallClick}
        className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/50 text-xs font-semibold shadow-xs transition-all hover:scale-105 cursor-pointer ${className}`}
        title="Install Reader's HUB as a standalone App"
        aria-label="Install App"
      >
        <svg className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Install App</span>
      </button>

      {/* Mobile Floating Install Pill */}
      <div className="sm:hidden fixed bottom-4 left-4 z-40 animate-fade-in">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--accent)]/50 shadow-2xl shadow-black/40 text-xs font-bold text-[var(--foreground)] active:scale-95 cursor-pointer hover:border-[var(--accent)]"
          aria-label="Install App"
        >
          <span className="flex h-2 w-2 rounded-full bg-[var(--accent)] animate-ping" />
          <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Install App</span>
        </button>
      </div>
    </>
  );
}
