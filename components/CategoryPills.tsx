"use client";

import React from "react";
import { CATEGORIES, Category, BOOKS } from "@/data/books";

interface CategoryPillsProps {
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export default function CategoryPills({
  activeCategory,
  onSelectCategory,
}: CategoryPillsProps) {
  const getCount = (cat: Category) => {
    if (cat === "All") return BOOKS.length;
    return BOOKS.filter((b) => b.category === cat).length;
  };

  return (
    <div className="w-full overflow-x-auto pb-3 pt-1 scrollbar-none">
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
  );
}
