"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, THEMES } from "./ThemeProvider";

export default function ThemeSwitcher() {
  const { theme, setTheme, currentThemeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={panelRef} className="fixed bottom-6 left-6 z-40">
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full glass-card border border-[var(--border)] hover:border-[var(--accent)] text-[var(--foreground)] shadow-xl transition-all hover:scale-105 cursor-pointer backdrop-blur-xl"
        aria-label="Change visual theme"
        aria-expanded={isOpen}
      >
        {/* Color Dot Swatch */}
        <span
          className="w-3.5 h-3.5 rounded-full shadow-inner border border-white/20 transition-transform group-hover:rotate-45"
          style={{
            background: `linear-gradient(135deg, ${currentThemeConfig.primaryColor}, ${currentThemeConfig.accentColor})`,
            boxShadow: `0 0 10px ${currentThemeConfig.primaryColor}66`,
          }}
        />

        <span className="text-xs font-semibold tracking-wide">
          {currentThemeConfig.name}
        </span>

        <svg
          className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Floating Popover Palette */}
      {isOpen && (
        <div className="absolute bottom-14 left-0 w-72 rounded-2xl glass-card border border-[var(--border)] p-3.5 shadow-2xl backdrop-blur-2xl animate-scale-up space-y-2">
          <div className="flex items-center justify-between px-1 pb-2 border-b border-[var(--border)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Visual Themes (6 Modes)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-secondary,rgba(255,255,255,0.06))] text-[var(--accent)] font-medium">
              {currentThemeConfig.category}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
            {THEMES.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTheme(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--foreground)]"
                      : "hover:bg-white/5 border border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Swatch preview circle */}
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 border border-white/25 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${item.primaryColor}, ${item.accentColor})`,
                        boxShadow: isSelected ? `0 0 10px ${item.primaryColor}88` : undefined,
                      }}
                    />
                    <div>
                      <div className="text-xs font-semibold leading-tight text-[var(--foreground)]">
                        {item.name}
                        {item.id === "original" && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-75 truncate max-w-[160px] text-[var(--text-secondary)]">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-xs text-[var(--accent)] font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

