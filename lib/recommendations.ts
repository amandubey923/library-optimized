/**
 * Reader's HUB — Smart Deterministic Recommendation Engine
 * 100% Browser-Local, Instantaneous, Privacy-Friendly (Zero External API calls)
 */

import { Book, BOOKS, isTechnicalBook } from "@/data/books";
import { ReadingProgressItem } from "@/lib/reader-storage";

export interface RecommendationSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  books: Book[];
}

export interface RecommendationResults {
  hasActivity: boolean;
  sections: RecommendationSection[];
}

/**
 * Calculates a similarity score between two books based on:
 * - Author match (+10)
 * - Exact category match (+5)
 * - Technical knowledge match (+4)
 * - ResourceType match (+3)
 * - Tag overlaps (+2 per shared tag)
 * - Language match (+1)
 */
export function calculateBookSimilarity(target: Book, candidate: Book): number {
  if (target.id === candidate.id) return -1;
  let score = 0;

  if (target.author && candidate.author && target.author.toLowerCase() === candidate.author.toLowerCase()) {
    score += 10;
  }

  if (target.category === candidate.category) {
    score += 5;
  }

  if (isTechnicalBook(target) && isTechnicalBook(candidate)) {
    score += 4;
  }

  if (target.resourceType && candidate.resourceType && target.resourceType === candidate.resourceType) {
    score += 3;
  }

  if (target.tags && candidate.tags) {
    const targetTags = new Set(target.tags.map((t) => t.toLowerCase()));
    for (const tag of candidate.tags) {
      if (targetTags.has(tag.toLowerCase())) {
        score += 2;
      }
    }
  }

  if (target.language === candidate.language) {
    score += 1;
  }

  // Slight bonus for high rated books
  score += (candidate.rating || 4.5) * 0.2;

  return score;
}

/**
 * Returns closely related books for a given book (for Book Detail page).
 */
export function getRelatedBooks(target: Book, allBooks: Book[] = BOOKS, limit: number = 4): Book[] {
  const scored = allBooks
    .filter((b) => b.id !== target.id)
    .map((candidate) => ({
      book: candidate,
      score: calculateBookSimilarity(target, candidate),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.book);
}

/**
 * Generates personalized recommendation sections based strictly on the user's local reading signature.
 */
export function generateRecommendations(
  readingHistory: ReadingProgressItem[] = [],
  favorites: string[] = [],
  allBooks: Book[] = BOOKS
): RecommendationResults {
  const readBookIds = new Set([
    ...readingHistory.map((h) => h.bookId),
    ...favorites,
  ]);

  const sections: RecommendationSection[] = [];

  // Identify most recent or highest progress book
  const mostRecentItem = readingHistory.length > 0
    ? [...readingHistory].sort((a, b) => b.lastReadAt - a.lastReadAt)[0]
    : null;

  const anchorBook = mostRecentItem
    ? allBooks.find((b) => b.id === mostRecentItem.bookId)
    : favorites.length > 0
    ? allBooks.find((b) => b.id === favorites[0])
    : null;

  // 1. "Because You Read [Anchor Book]"
  if (anchorBook) {
    const related = getRelatedBooks(anchorBook, allBooks, 6).filter((b) => !readBookIds.has(b.id));
    if (related.length >= 2) {
      sections.push({
        id: "because-you-read",
        title: `Because You Read "${anchorBook.title}"`,
        subtitle: `Curated companion volumes sharing themes with ${anchorBook.author}`,
        icon: "✨",
        books: related,
      });
    }
  }

  // 2. Compute Preferred Categories based on history + favorites
  const categoryCounts: Record<string, number> = {};
  readingHistory.forEach((h) => {
    const book = allBooks.find((b) => b.id === h.bookId);
    if (book) {
      categoryCounts[book.category] = (categoryCounts[book.category] || 0) + (h.progress > 20 ? 3 : 1);
    }
  });
  favorites.forEach((favId) => {
    const book = allBooks.find((b) => b.id === favId);
    if (book) {
      categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 2;
    }
  });

  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat);

  const topCategory = sortedCategories[0];
  if (topCategory) {
    const categoryBooks = allBooks
      .filter((b) => b.category === topCategory && !readBookIds.has(b.id))
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating)
      .slice(0, 6);

    if (categoryBooks.length >= 2) {
      sections.push({
        id: `top-category-${topCategory.toLowerCase().replace(/\s+/g, "-")}`,
        title: `Continue Your ${topCategory} Journey`,
        subtitle: "High-rated masterworks in your most frequently explored category",
        icon: "🧭",
        books: categoryBooks,
      });
    }
  }

  // 3. Technical Knowledge & Core Skills
  const isInterestedInTech =
    categoryCounts["Technical Knowledge"] ||
    readingHistory.some((h) => {
      const b = allBooks.find((item) => item.id === h.bookId);
      return b && isTechnicalBook(b);
    });

  if (isInterestedInTech) {
    const techBooks = allBooks
      .filter((b) => isTechnicalBook(b) && !readBookIds.has(b.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    if (techBooks.length >= 2) {
      sections.push({
        id: "technical-curated",
        title: "Recommended for Technical & Interview Prep",
        subtitle: "Handwritten notes, algorithms, and engineering fundamentals",
        icon: "⚡",
        books: techBooks,
      });
    }
  }

  // 4. Quick Reads (< 180 pages) for Busy Days
  const quickReads = allBooks
    .filter((b) => Number(b.pages) > 0 && Number(b.pages) <= 180 && !readBookIds.has(b.id))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  if (quickReads.length >= 2) {
    sections.push({
      id: "quick-reads",
      title: "Concise Masterworks (< 180 Pages)",
      subtitle: "High-impact volumes perfect for a single focused study session",
      icon: "⏱️",
      books: quickReads,
    });
  }

  // 5. Highest-Rated Evergreen Essentials
  const topRated = allBooks
    .filter((b) => b.rating >= 4.8 && !readBookIds.has(b.id))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  if (topRated.length >= 2) {
    sections.push({
      id: "evergreen-essentials",
      title: "Reader's HUB Evergreen Essentials",
      subtitle: "Highest-rated literary and philosophical masterpieces across the library",
      icon: "🌟",
      books: topRated,
    });
  }

  return {
    hasActivity: Boolean(anchorBook || sortedCategories.length > 0),
    sections,
  };
}
