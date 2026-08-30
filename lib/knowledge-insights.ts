/**
 * Reader's HUB — Knowledge Insights & Personal Analytics Engine
 * Read-Only Derived Analytics from Local Study Memory & Reading Activity
 */

import { Book, BOOKS } from "@/data/books";
import {
  ReadingProgressItem,
  ReadingStreakData,
  BookReflection,
  BookReadingMemory,
  BookAnnotations,
  getAllReadingMemories,
  getAllBookAnnotations,
  getBookReflections,
} from "@/lib/reader-storage";

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AuthorInsight {
  author: string;
  bookCount: number;
  totalStudyMinutes: number;
}

export interface StudyDensityStats {
  totalNotes: number;
  totalHighlights: number;
  totalBookmarks: number;
  totalAnnotations: number;
  densityPer100Pages: number;
}

export interface RevisitedBookInsight {
  book: Book;
  sessionsCount: number;
  totalStudyMinutes: number;
  progress: number;
  reflection?: string;
}

export interface KnowledgeInsightsResult {
  totalBooksEngaged: number;
  totalCompleted: number;
  totalStudyMinutes: number;
  totalReflectionsWritten: number;
  categoryDistribution: CategoryDistribution[];
  topAuthors: AuthorInsight[];
  studyDensity: StudyDensityStats;
  mostRevisitedBooks: RevisitedBookInsight[];
  consistencyScore: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Philosophy & Spirituality": "#10b981", // emerald
  "Technical Knowledge": "#06b6d4", // cyan
  "Classics": "#f59e0b", // amber
  "Self-Development": "#8b5cf6", // violet
  "Psychology": "#ec4899", // pink
  "Business & Finance": "#3b82f6", // blue
  "Fiction": "#f97316", // orange
  "Science": "#14b8a6", // teal
  "Hindi Literature": "#e11d48", // rose
};

export function generateKnowledgeInsights(
  history: ReadingProgressItem[] = [],
  _favorites: string[] = [],
  streakData: ReadingStreakData = { daily: {}, currentStreak: 0, longestStreak: 0, lastQualifiedDate: null },
  reflectionsData?: Record<string, BookReflection>,
  memoriesData?: Record<string, BookReadingMemory>,
  annotationsData?: Record<string, BookAnnotations>
): KnowledgeInsightsResult {
  // Authoritative Total Genuine Reading Time derived strictly from streak/activity data
  let totalStudySeconds = 0;
  Object.values(streakData.daily || {}).forEach((d) => {
    totalStudySeconds += d.seconds || 0;
  });

  const allMemories = memoriesData && Object.keys(memoriesData).length > 0 ? memoriesData : getAllReadingMemories();
  const allAnnotations = annotationsData && Object.keys(annotationsData).length > 0 ? annotationsData : getAllBookAnnotations();
  const allReflections = reflectionsData || getBookReflections();

  // Books Explored: ONLY books with genuine reading activity, reflections, or notes/annotations
  const engagedBookIds = new Set<string>();

  history.forEach((h) => {
    const mem = allMemories[h.bookId];
    const memSecs = mem?.totalSeconds || 0;
    const hasReflection = Boolean(allReflections[h.bookId]);
    const hasAnnotations = Boolean(
      allAnnotations[h.bookId] &&
      ((allAnnotations[h.bookId].notes?.length || 0) > 0 ||
       (allAnnotations[h.bookId].highlights?.length || 0) > 0 ||
       (allAnnotations[h.bookId].bookmarks?.length || 0) > 0)
    );

    // A book is genuinely explored only if active reading occurred on it, or user wrote reflection/notes
    if (memSecs >= 30 || hasReflection || hasAnnotations) {
      engagedBookIds.add(h.bookId);
    }
  });

  Object.keys(allReflections).forEach((id) => engagedBookIds.add(id));
  Object.keys(allAnnotations).forEach((id) => {
    const ann = allAnnotations[id];
    if (ann && ((ann.notes?.length || 0) > 0 || (ann.highlights?.length || 0) > 0 || (ann.bookmarks?.length || 0) > 0)) {
      engagedBookIds.add(id);
    }
  });

  if (totalStudySeconds >= 30 && engagedBookIds.size === 0 && history.length > 0) {
    engagedBookIds.add(history[0].bookId);
  }

  const historyMap = new Map(history.map((h) => [h.bookId, h]));
  let totalCompleted = 0;
  let rawPagesSum = 0;

  const categoryCounts: Record<string, number> = {};
  const authorMap: Record<string, { bookIds: Set<string>; studySeconds: number }> = {};
  const revisitedList: RevisitedBookInsight[] = [];

  engagedBookIds.forEach((bookId) => {
    const book = BOOKS.find((b) => b.id === bookId);
    if (!book) return;

    const hist = historyMap.get(bookId);
    const mem = allMemories[bookId];
    const ref = allReflections[bookId];
    const memSeconds = mem?.totalSeconds || 0;

    const progress = hist ? hist.progress : (ref ? 100 : 0);
    const pages = hist ? hist.page : 0;
    rawPagesSum += pages;

    // Completed only if progress >= 95% AND meaningful study time or has a written reflection
    if ((progress >= 95 && (memSeconds >= 180 || totalStudySeconds >= 300)) || (ref && ref.reflection)) {
      totalCompleted += 1;
    }

    // Category distribution
    const cat = book.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Author insights
    if (book.author) {
      if (!authorMap[book.author]) {
        authorMap[book.author] = { bookIds: new Set(), studySeconds: 0 };
      }
      authorMap[book.author].bookIds.add(book.id);
      authorMap[book.author].studySeconds += memSeconds || (totalStudySeconds > 0 ? Math.floor(totalStudySeconds / Math.max(1, engagedBookIds.size)) : 0);
    }

    // Revisited books
    const sessions = mem?.timeline?.length || (hist ? 1 : 0);
    if (sessions > 0 || memSeconds > 0 || ref) {
      revisitedList.push({
        book,
        sessionsCount: Math.max(1, sessions),
        totalStudyMinutes: Math.floor((memSeconds || (totalStudySeconds > 0 ? Math.floor(totalStudySeconds / Math.max(1, engagedBookIds.size)) : 0)) / 60),
        progress,
        reflection: ref?.reflection,
      });
    }
  });

  // Calculate category distribution percentages
  const totalCategoryEngagements = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;
  const categoryDistribution: CategoryDistribution[] = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalCategoryEngagements) * 100),
      color: CATEGORY_COLORS[category] || "#64748b",
    }));

  // Top Authors
  const topAuthors: AuthorInsight[] = Object.entries(authorMap)
    .map(([author, data]) => ({
      author,
      bookCount: data.bookIds.size,
      totalStudyMinutes: Math.floor(data.studySeconds / 60),
    }))
    .sort((a, b) => b.totalStudyMinutes - a.totalStudyMinutes || b.bookCount - a.bookCount)
    .slice(0, 5);

  // Study Density Calculations
  let totalNotes = 0;
  let totalHighlights = 0;
  let totalBookmarks = 0;

  Object.values(allAnnotations).forEach((ann) => {
    totalNotes += ann.notes?.length || 0;
    totalHighlights += ann.highlights?.length || 0;
    totalBookmarks += ann.bookmarks?.length || 0;
  });

  const totalAnnotations = totalNotes + totalHighlights + totalBookmarks;
  const maxPlausiblePages = totalStudySeconds > 0 ? Math.max(1, Math.floor(totalStudySeconds / 45)) : 0;
  const totalPagesRead = Math.min(rawPagesSum, maxPlausiblePages);
  const densityPer100Pages =
    totalPagesRead > 0 ? Number(((totalAnnotations / totalPagesRead) * 100).toFixed(1)) : 0;

  // Consistency Score (0 - 100) based on streak and reading frequency
  const activeDaysCount = Object.keys(streakData.daily || {}).length;
  const streakBonus = Math.min(streakData.currentStreak * 5, 40);
  const daysBonus = Math.min(activeDaysCount * 3, 40);
  const consistencyScore = Math.min(100, Math.max(10, streakBonus + daysBonus + (totalCompleted * 5)));

  // Sort revisited books by sessions and study time
  revisitedList.sort((a, b) => b.sessionsCount - a.sessionsCount || b.totalStudyMinutes - a.totalStudyMinutes);

  return {
    totalBooksEngaged: engagedBookIds.size,
    totalCompleted,
    totalStudyMinutes: Math.floor(totalStudySeconds / 60),
    totalReflectionsWritten: Object.keys(allReflections).length,
    categoryDistribution,
    topAuthors,
    studyDensity: {
      totalNotes,
      totalHighlights,
      totalBookmarks,
      totalAnnotations,
      densityPer100Pages,
    },
    mostRevisitedBooks: revisitedList.slice(0, 6),
    consistencyScore,
  };
}
