"use client";

import React from "react";
import {
  CATEGORIES,
  Category,
  BOOKS,
  isTechnicalBook,
  TECHNICAL_SUBCATEGORIES,
} from "@/data/books";

interface CategoryPillsProps {
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
  activeSubcategory?: string;
  onSelectSubcategory?: (subcat: string) => void;
}

export default function CategoryPills({
  activeCategory,
  onSelectCategory,
  activeSubcategory = "All Technical",
  onSelectSubcategory,
}: CategoryPillsProps) {
  const getCount = (cat: Category) => {
    if (cat === "All") return BOOKS.length;
    if (cat === "Technical Knowledge") return BOOKS.filter((b) => isTechnicalBook(b)).length;
    return BOOKS.filter((b) => b.category === cat).length;
  };

  const getSubcategoryCount = (subcat: string) => {
    if (subcat === "All Technical") return BOOKS.filter((b) => isTechnicalBook(b)).length;
    return BOOKS.filter((b) => isTechnicalBook(b) && (b.category === subcat || (b.resourceType as string) === subcat)).length;
  };

  return (
    <div className="space-y-3">
      {/* Top-Level Categories */}
      <div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-none">
        <div className="flex items-center gap-2.5 min-w-max">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count = getCount(cat);

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--theme-glow)] scale-[1.02]"
                    : "bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] border border-[var(--border)]"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-[var(--primary-foreground)]/20 text-[var(--primary-foreground)]"
                      : "bg-[var(--background)] text-[var(--text-secondary)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Technical Knowledge Sub-Filter Bar (Visible when Technical Knowledge is selected) */}
      {activeCategory === "Technical Knowledge" && onSelectSubcategory && (
        <div className="w-full overflow-x-auto pb-2 scrollbar-none animate-fade-in">
          <div className="flex items-center gap-2 min-w-max px-1 py-1 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/15">
            <span className="text-[11px] font-bold text-[var(--accent)] px-2.5 py-1 uppercase tracking-wider">
              Topic:
            </span>
            {TECHNICAL_SUBCATEGORIES.map((subcat) => {
              const isSubActive = activeSubcategory === subcat;
              const subCount = getSubcategoryCount(subcat);

              return (
                <button
                  key={subcat}
                  onClick={() => onSelectSubcategory(subcat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSubActive
                      ? "bg-[var(--accent)] text-[var(--background)] font-bold shadow-xs scale-[1.02]"
                      : "bg-[var(--card)]/80 text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] border border-[var(--border)]/70"
                  }`}
                >
                  <span>{subcat.replace(" & Systems", "").replace(" & Problem Solving", "").replace(" & DevOps", "")}</span>
                  <span className={`text-[10px] ${isSubActive ? "opacity-90 font-bold" : "opacity-60"}`}>
                    ({subCount})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
