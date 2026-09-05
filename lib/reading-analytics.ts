/**
 * Reader's HUB — Local Reading Analytics & User Profile Engine
 * 100% Client-Side, Local-Only Data Aggregation & Statistical Analysis.
 * NO Backend, NO Auth, NO Cloud Tracking, NO Fabricated History.
 */

import { Book, BOOKS } from "@/data/books";
import {
  getReadingActivityData,
  getWebsiteActiveTimeData,
  getAllReadingMemories,
  getAllBookAnnotations,
  getLocalDateKey,
  DAILY_READING_GOAL_SECONDS,
  ReadingStreakData,
  WebsiteActiveTimeData,
  BookReadingMemory,
  BookAnnotations,
  ReadingProgressItem,
} from "./reader-storage";

export type AnalyticsTimeFilter = "all" | "year" | "month" | "30d" | "7d" | "today";

export interface ProfileHeaderData {
  userTitle: string;
  memberSince: string | null;
  memberSinceTimestamp: number | null;
  totalDaysSinceFirstActivity: number;
  totalBooksEngaged: number;
  totalReadingDays: number;
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
}

export interface TodaySummaryData {
  readingSeconds: number;
  activeSeconds: number;
  booksCount: number;
  isQualified: boolean;
  streakDays: number;
  readingMinutesRemaining: number;
}

export interface DailyActivityPoint {
  dateKey: string;
  dayLabel: string;
  readingSeconds: number;
  activeSeconds: number;
  readingMinutes: number;
  activeMinutes: number;
  isQualified: boolean;
}

export interface CoreStatsData {
  totalReadingSeconds: number;
  totalActiveSeconds: number;
  totalReadingDays: number;
  totalActiveDays: number;
  avgReadingSecondsPerDay: number;
  avgActiveSecondsPerDay: number;
  highestSingleDayReadingSeconds: number;
  bestReadingDay: {
    dateKey: string;
    readingSeconds: number;
    activeSeconds: number;
    booksCount: number;
    formattedDate: string;
  } | null;
  thisMonthReadingDays: number;
  thisMonthReadingSeconds: number;
  thisMonthActiveSeconds: number;
  totalHighlights: number;
  totalNotes: number;
  totalSketches: number;
  totalBookmarks: number;
  totalAnnotations: number;
  totalPagesRead: number;
}

export interface HeatmapCell {
  dateKey: string; // "YYYY-MM-DD"
  date: Date;
  readingSeconds: number;
  activeSeconds: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4 | 5;
  isQualified: boolean; // >= 15m
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  month: number; // 0-11
  formattedDate: string;
}

export interface HeatmapMonthLabel {
  monthName: string;
  colIndex: number;
}

export interface HeatmapData {
  weeks: HeatmapCell[][];
  monthLabels: HeatmapMonthLabel[];
  totalActiveCells: number;
  maxDailyReadingSeconds: number;
  year: number;
}

export interface MonthlyActivityItem {
  monthKey: string; // "YYYY-MM"
  monthName: string; // e.g. "August 2026"
  year: number;
  monthIndex: number;
  readingDays: number;
  readingSeconds: number;
  activeSeconds: number;
  avgReadingSecondsPerDay: number;
  booksCount: number;
  percentOfActiveTime: number;
}

export interface FavoriteGenreItem {
  category: string;
  readingSeconds: number;
  percentOfTotal: number;
  booksCount: number;
}

export interface RankedBookItem {
  book: Book;
  readingSeconds: number;
  readingTimeFormatted: string;
  sessionsCount: number;
  progress: number;
  currentPage: number;
  totalPages: number | string;
  lastReadAt: number;
  firstReadAt: number;
}

export interface ReadingHabitsData {
  mostProductiveDayOfWeek: {
    dayName: string;
    readingSeconds: number;
    percentOfTotal: number;
  } | null;
  avgSessionDurationSeconds: number | null;
  longestSessionSeconds: number | null;
  totalRecordedSessions: number;
}

export interface ComprehensiveAnalytics {
  profileHeader: ProfileHeaderData;
  todaySummary: TodaySummaryData;
  coreStats: CoreStatsData;
  heatmap: HeatmapData;
  monthlyJourney: MonthlyActivityItem[];
  favoriteGenre: FavoriteGenreItem | null;
  genreBreakdown: FavoriteGenreItem[];
  mostReadBooks: RankedBookItem[];
  recentlyReadBooks: RankedBookItem[];
  readingHabits: ReadingHabitsData;
  dailyBreakdown: DailyActivityPoint[];
  filter: AnalyticsTimeFilter;
  filterLabel: string;
}

// -------------------------------------------------------------
// Helper: Duration Formatter
// -------------------------------------------------------------

export function formatAnalyticsDuration(
  totalSeconds: number,
  options: { verbose?: boolean; compact?: boolean } = {}
): string {
  if (!totalSeconds || totalSeconds <= 0 || isNaN(totalSeconds)) {
    return options.verbose ? "0 minutes" : "0m";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (options.compact) {
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  if (options.verbose) {
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    if (minutes > 0 || (hours === 0 && seconds === 0)) {
      parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    }
    return parts.join(" ");
  }

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  return `${minutes}m`;
}

// Helper: Format Date String
export function formatCalendarDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    // Ignore
  }
  return dateStr;
}

export interface AnalyticsDataSource {
  uid?: string | null;
  favorites?: string[];
  readingHistory?: ReadingProgressItem[];
  streakData?: ReadingStreakData;
  activeTimeData?: WebsiteActiveTimeData;
  readingMemories?: Record<string, BookReadingMemory>;
  annotations?: Record<string, BookAnnotations>;
}

// -------------------------------------------------------------
// Core Analytics Computation
// -------------------------------------------------------------

export function getComprehensiveAnalytics(
  filter: AnalyticsTimeFilter = "all",
  customSource?: AnalyticsDataSource
): ComprehensiveAnalytics {
  const targetUid = customSource?.uid;
  const streakData: ReadingStreakData = customSource?.streakData || getReadingActivityData(targetUid);
  const activeTimeData: WebsiteActiveTimeData = customSource?.activeTimeData || getWebsiteActiveTimeData(targetUid);
  const readingMemories: Record<string, BookReadingMemory> = customSource?.readingMemories || getAllReadingMemories();
  const readingHistory: ReadingProgressItem[] = customSource?.readingHistory || [];
  const favoritesList: string[] = customSource?.favorites || [];
  const todayKey = getLocalDateKey();

  // 1. Determine Earliest Activity Date (Member Since)
  let earliestTimestamp: number | null = null;

  // Check streak daily keys
  Object.keys(streakData.daily || {}).forEach((dKey) => {
    const parts = dKey.split("-").map(Number);
    if (parts.length === 3) {
      const t = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
      if (earliestTimestamp === null || t < earliestTimestamp) {
        earliestTimestamp = t;
      }
    }
  });

  // Check reading memories
  Object.values(readingMemories).forEach((mem) => {
    if (mem.firstReadAt && (earliestTimestamp === null || mem.firstReadAt < earliestTimestamp)) {
      earliestTimestamp = mem.firstReadAt;
    }
  });

  // Check progress history
  readingHistory.forEach((item) => {
    if (item.lastReadAt && (earliestTimestamp === null || item.lastReadAt < earliestTimestamp)) {
      earliestTimestamp = item.lastReadAt;
    }
  });

  const memberSinceStr = earliestTimestamp
    ? new Date(earliestTimestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const totalDaysSinceFirst = earliestTimestamp
    ? Math.max(1, Math.ceil((Date.now() - earliestTimestamp) / (1000 * 60 * 60 * 24)))
    : 0;

  // 2. Unique Books Engaged
  const engagedBookIds = new Set<string>();
  Object.keys(readingMemories).forEach((id) => engagedBookIds.add(id));
  readingHistory.forEach((h) => engagedBookIds.add(h.bookId));
  favoritesList.forEach((f) => engagedBookIds.add(f));

  // 3. Daily map filtering based on timeFilter
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const thirtyDaysAgoKey = getLocalDateKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const sevenDaysAgoKey = getLocalDateKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  const isDateInFilter = (dateKey: string): boolean => {
    if (filter === "today") {
      return dateKey === todayKey;
    }
    if (filter === "all") return true;
    if (filter === "year") {
      return dateKey.startsWith(String(currentYear) + "-");
    }
    if (filter === "month") {
      const monthPrefix = String(currentYear) + "-" + String(currentMonth + 1).padStart(2, "0") + "-";
      return dateKey.startsWith(monthPrefix);
    }
    if (filter === "30d") {
      return dateKey >= thirtyDaysAgoKey;
    }
    if (filter === "7d") {
      return dateKey >= sevenDaysAgoKey;
    }
    return true;
  };

  // 4. Compute Reading Days, Total Times, Best Day
  let totalReadingSecs = 0;
  let totalActiveSecs = 0;
  let totalReadingDays = 0;
  let totalActiveDays = 0;
  let highestSingleDayReading = 0;
  let bestReadingDayObj: CoreStatsData["bestReadingDay"] = null;

  // Collect all unique dates across reading and active time
  const allDateKeys = new Set<string>([
    ...Object.keys(streakData.daily || {}),
    ...Object.keys(activeTimeData.daily || {}),
  ]);

  allDateKeys.forEach((dKey) => {
    if (!isDateInFilter(dKey)) return;

    const rSecs = streakData.daily[dKey]?.seconds || 0;
    const aSecs = Math.max(activeTimeData.daily[dKey] || 0, rSecs);

    if (rSecs > 0) {
      totalReadingDays += 1;
      totalReadingSecs += rSecs;
    }
    if (aSecs > 0) {
      totalActiveDays += 1;
      totalActiveSecs += aSecs;
    }

    if (rSecs > highestSingleDayReading) {
      highestSingleDayReading = rSecs;
      bestReadingDayObj = {
        dateKey: dKey,
        readingSeconds: rSecs,
        activeSeconds: aSecs,
        booksCount: 1, // baseline
        formattedDate: formatCalendarDate(dKey),
      };
    }
  });

  if (filter === "all" && activeTimeData?.totalActiveSeconds) {
    totalActiveSecs = Math.max(totalActiveSecs, activeTimeData.totalActiveSeconds);
  }

  // Calculate This Month's Metrics
  const thisMonthPrefix = String(currentYear) + "-" + String(currentMonth + 1).padStart(2, "0") + "-";
  let thisMonthReadingDays = 0;
  let thisMonthReadingSecs = 0;
  let thisMonthActiveSecs = 0;

  allDateKeys.forEach((dKey) => {
    if (dKey.startsWith(thisMonthPrefix)) {
      const rSecs = streakData.daily[dKey]?.seconds || 0;
      const aSecs = Math.max(activeTimeData.daily[dKey] || 0, rSecs);
      if (rSecs > 0) {
        thisMonthReadingDays += 1;
        thisMonthReadingSecs += rSecs;
      }
      thisMonthActiveSecs += aSecs;
    }
  });

  const avgReadingSecsPerDay = totalReadingDays > 0 ? Math.round(totalReadingSecs / totalReadingDays) : 0;
  const avgActiveSecsPerDay = totalActiveDays > 0 ? Math.round(totalActiveSecs / totalActiveDays) : 0;

  // 5. Annotations & Study Markings Totals
  const allAnnotations = getAllBookAnnotations();
  let totalHighlights = 0;
  let totalNotes = 0;
  let totalSketches = 0;
  let totalBookmarks = 0;

  Object.values(allAnnotations).forEach((ann) => {
    totalHighlights += (ann.highlights || []).length;
    totalNotes += (ann.notes || []).length;
    totalBookmarks += (ann.bookmarks || []).length;
    const dw = ann.drawings || {};
    totalSketches += Object.keys(dw).filter((p) => (dw[Number(p)] || []).length > 0).length;
  });
  const totalAnnotations = totalHighlights + totalNotes + totalSketches + totalBookmarks;

  let totalPagesRead = 0;
  readingHistory.forEach((h) => {
    totalPagesRead += h.page || 0;
  });

  // 6. Build Daily Activity Points for the Selected Filter
  const dailyBreakdown: DailyActivityPoint[] = [];
  const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (filter === "today") {
    const rSecs = streakData.daily[todayKey]?.seconds || 0;
    const aSecs = Math.max(activeTimeData.daily[todayKey] || 0, rSecs);
    dailyBreakdown.push({
      dateKey: todayKey,
      dayLabel: "Today",
      readingSeconds: rSecs,
      activeSeconds: aSecs,
      readingMinutes: Math.round(rSecs / 60),
      activeMinutes: Math.round(aSecs / 60),
      isQualified: rSecs >= DAILY_READING_GOAL_SECONDS,
    });
  } else if (filter === "7d") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dKey = getLocalDateKey(d);
      const rSecs = streakData.daily[dKey]?.seconds || 0;
      const aSecs = Math.max(activeTimeData.daily[dKey] || 0, rSecs);
      dailyBreakdown.push({
        dateKey: dKey,
        dayLabel: dayNamesShort[d.getDay()],
        readingSeconds: rSecs,
        activeSeconds: aSecs,
        readingMinutes: Math.round(rSecs / 60),
        activeMinutes: Math.round(aSecs / 60),
        isQualified: rSecs >= DAILY_READING_GOAL_SECONDS,
      });
    }
  } else if (filter === "30d") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dKey = getLocalDateKey(d);
      const rSecs = streakData.daily[dKey]?.seconds || 0;
      const aSecs = Math.max(activeTimeData.daily[dKey] || 0, rSecs);
      dailyBreakdown.push({
        dateKey: dKey,
        dayLabel: `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`,
        readingSeconds: rSecs,
        activeSeconds: aSecs,
        readingMinutes: Math.round(rSecs / 60),
        activeMinutes: Math.round(aSecs / 60),
        isQualified: rSecs >= DAILY_READING_GOAL_SECONDS,
      });
    }
  } else if (filter === "month") {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dKey = getLocalDateKey(d);
      const rSecs = streakData.daily[dKey]?.seconds || 0;
      const aSecs = Math.max(activeTimeData.daily[dKey] || 0, rSecs);
      dailyBreakdown.push({
        dateKey: dKey,
        dayLabel: `${day}`,
        readingSeconds: rSecs,
        activeSeconds: aSecs,
        readingMinutes: Math.round(rSecs / 60),
        activeMinutes: Math.round(aSecs / 60),
        isQualified: rSecs >= DAILY_READING_GOAL_SECONDS,
      });
    }
  } else {
    // Year or All Time: Sorted chronological list of active days
    const sortedKeys = Array.from(allDateKeys)
      .filter((k) => isDateInFilter(k))
      .sort();
    sortedKeys.forEach((dKey) => {
      const rSecs = streakData.daily[dKey]?.seconds || 0;
      const aSecs = Math.max(activeTimeData.daily[dKey] || 0, rSecs);
      const parts = dKey.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      dailyBreakdown.push({
        dateKey: dKey,
        dayLabel: `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`,
        readingSeconds: rSecs,
        activeSeconds: aSecs,
        readingMinutes: Math.round(rSecs / 60),
        activeMinutes: Math.round(aSecs / 60),
        isQualified: rSecs >= DAILY_READING_GOAL_SECONDS,
      });
    });
  }

  // 7. Today's Summary
  const todayReadingSecs = streakData.daily[todayKey]?.seconds || 0;
  const todayActiveSecs = Math.max(activeTimeData.daily[todayKey] || 0, todayReadingSecs);
  const isTodayQualified = Boolean(
    streakData.daily[todayKey]?.qualified || todayReadingSecs >= DAILY_READING_GOAL_SECONDS
  );
  const readingMinutesRemaining = Math.max(0, 15 - Math.floor(todayReadingSecs / 60));

  // Count books read/opened today
  let todayBooksCount = 0;
  readingHistory.forEach((h) => {
    if (h.lastReadAt) {
      const hDate = getLocalDateKey(new Date(h.lastReadAt));
      if (hDate === todayKey) todayBooksCount += 1;
    }
  });
  if (todayReadingSecs > 0 && todayBooksCount === 0) todayBooksCount = 1;

  // 8. Build Heatmap (Full 52/53 Weeks Grid for Calendar Year)
  const heatmapYear = currentYear;
  const startDate = new Date(heatmapYear, 0, 1);
  const endDate = new Date(heatmapYear, 11, 31);

  // Pad to beginning Sunday
  const firstDayOfWeek = startDate.getDay(); // 0 = Sun
  const currentGridDate = new Date(startDate);
  currentGridDate.setDate(currentGridDate.getDate() - firstDayOfWeek);

  const weeks: HeatmapCell[][] = [];
  let currentWeek: HeatmapCell[] = [];
  const monthLabels: HeatmapMonthLabel[] = [];
  let lastLabeledMonth = -1;
  let weekIndex = 0;
  let maxDailyReading = 0;

  while (currentGridDate <= endDate || currentWeek.length > 0) {
    const dateKey = getLocalDateKey(currentGridDate);
    const rSecs = streakData.daily[dateKey]?.seconds || 0;
    const aSecs = Math.max(activeTimeData.daily[dateKey] || 0, rSecs);
    if (rSecs > maxDailyReading) maxDailyReading = rSecs;

    let intensity: 0 | 1 | 2 | 3 | 4 | 5 = 0;
    if (rSecs >= 120 * 60) intensity = 5;
    else if (rSecs >= 60 * 60) intensity = 4;
    else if (rSecs >= 30 * 60) intensity = 3;
    else if (rSecs >= 15 * 60) intensity = 2;
    else if (rSecs > 0) intensity = 1;

    const cellMonth = currentGridDate.getMonth();
    if (currentGridDate.getFullYear() === heatmapYear && cellMonth !== lastLabeledMonth && currentGridDate.getDate() <= 14) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthLabels.push({ monthName: monthNames[cellMonth], colIndex: weekIndex });
      lastLabeledMonth = cellMonth;
    }

    currentWeek.push({
      dateKey,
      date: new Date(currentGridDate),
      readingSeconds: rSecs,
      activeSeconds: aSecs,
      intensityLevel: intensity,
      isQualified: rSecs >= DAILY_READING_GOAL_SECONDS,
      dayOfWeek: currentGridDate.getDay(),
      month: cellMonth,
      formattedDate: formatCalendarDate(dateKey),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
      weekIndex += 1;
    }

    currentGridDate.setDate(currentGridDate.getDate() + 1);
    if (currentGridDate > endDate && currentWeek.length === 0) break;
  }

  // 9. Monthly Journey Breakdown
  const monthlyMap = new Map<string, {
    readingDays: number;
    readingSecs: number;
    activeSecs: number;
    booksSet: Set<string>;
  }>();

  allDateKeys.forEach((dKey) => {
    const monthKey = dKey.substring(0, 7); // "YYYY-MM"
    const rSecs = streakData.daily[dKey]?.seconds || 0;
    const aSecs = Math.max(activeTimeData.daily[dKey] || 0, rSecs);

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        readingDays: 0,
        readingSecs: 0,
        activeSecs: 0,
        booksSet: new Set(),
      });
    }

    const mObj = monthlyMap.get(monthKey)!;
    if (rSecs > 0) {
      mObj.readingDays += 1;
      mObj.readingSecs += rSecs;
    }
    mObj.activeSecs += aSecs;
  });

  const monthlyJourney: MonthlyActivityItem[] = Array.from(monthlyMap.entries())
    .map(([mKey, data]) => {
      const parts = mKey.split("-").map(Number);
      const year = parts[0];
      const monthIndex = parts[1] - 1;
      const d = new Date(year, monthIndex, 1);
      const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const avgPerDay = data.readingDays > 0 ? Math.round(data.readingSecs / data.readingDays) : 0;
      const pct = data.activeSecs > 0 ? Math.min(100, Math.round((data.readingSecs / data.activeSecs) * 100)) : 0;

      return {
        monthKey: mKey,
        monthName,
        year,
        monthIndex,
        readingDays: data.readingDays,
        readingSeconds: data.readingSecs,
        activeSeconds: data.activeSecs,
        avgReadingSecondsPerDay: avgPerDay,
        booksCount: data.booksSet.size || (data.readingDays > 0 ? 1 : 0),
        percentOfActiveTime: pct,
      };
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Newest month first

  // 10. Normalize Individual Book Reading Times to Ensure Mathematical Consistency
  // A user's total reading time (totalReadingSecs) is the master ceiling for authentic reading activity.
  // The sum of individual book reading times must not exceed totalReadingSecs, and no single book can exceed totalReadingSecs.
  const rawBookSecsMap = new Map<string, number>();
  let totalRawBookSecs = 0;

  BOOKS.forEach((book) => {
    const mem = readingMemories[book.id];
    let secs = mem?.totalSeconds || 0;
    if (mem?.timeline && mem.timeline.length > 0) {
      const timelineSum = mem.timeline.reduce((acc, ev) => acc + (Number(ev.durationSeconds) || 0), 0);
      secs = Math.max(secs, timelineSum);
    }
    if (secs > 0) {
      rawBookSecsMap.set(book.id, secs);
      totalRawBookSecs += secs;
    }
  });

  const normalizedBookSecsMap = new Map<string, number>();
  if (filter === "all" && totalReadingSecs > 0 && totalRawBookSecs > totalReadingSecs) {
    const ratio = totalReadingSecs / totalRawBookSecs;
    let distributed = 0;
    const sortedEntries = Array.from(rawBookSecsMap.entries()).sort((a, b) => b[1] - a[1]);
    sortedEntries.forEach(([bId, rawSecs], index) => {
      if (index === sortedEntries.length - 1) {
        normalizedBookSecsMap.set(bId, Math.max(0, totalReadingSecs - distributed));
      } else {
        const scaled = Math.round(rawSecs * ratio);
        normalizedBookSecsMap.set(bId, scaled);
        distributed += scaled;
      }
    });
  } else {
    rawBookSecsMap.forEach((secs, bId) => {
      const bounded = totalReadingSecs > 0 ? Math.min(secs, totalReadingSecs) : secs;
      normalizedBookSecsMap.set(bId, bounded);
    });
  }

  // 10. Favorite Genre & Category Breakdown (Derived from Normalized Book Reading Times)
  const categorySecondsMap = new Map<string, { seconds: number; booksSet: Set<string> }>();
  let totalGenreReadingSecs = 0;

  normalizedBookSecsMap.forEach((secs, bId) => {
    const book = BOOKS.find((b) => b.id === bId);
    if (book && secs > 0) {
      const cat = book.category || "General";
      if (!categorySecondsMap.has(cat)) {
        categorySecondsMap.set(cat, { seconds: 0, booksSet: new Set() });
      }
      const cObj = categorySecondsMap.get(cat)!;
      cObj.seconds += secs;
      cObj.booksSet.add(bId);
      totalGenreReadingSecs += secs;
    }
  });

  if (categorySecondsMap.size === 0 && readingHistory.length > 0) {
    readingHistory.forEach((item) => {
      const book = BOOKS.find((b) => b.id === item.bookId);
      if (book) {
        const cat = book.category || "General";
        if (!categorySecondsMap.has(cat)) {
          categorySecondsMap.set(cat, { seconds: 0, booksSet: new Set() });
        }
        categorySecondsMap.get(cat)!.booksSet.add(item.bookId);
      }
    });
  }

  const genreBreakdown: FavoriteGenreItem[] = Array.from(categorySecondsMap.entries())
    .map(([cat, data]) => ({
      category: cat,
      readingSeconds: data.seconds,
      percentOfTotal: totalGenreReadingSecs > 0 ? Math.round((data.seconds / totalGenreReadingSecs) * 100) : 0,
      booksCount: data.booksSet.size,
    }))
    .sort((a, b) => b.readingSeconds - a.readingSeconds || b.booksCount - a.booksCount);

  const favoriteGenre: FavoriteGenreItem | null = genreBreakdown.length > 0 ? genreBreakdown[0] : null;

  // 11. Ranked Most Read Books (Using Normalized Reading Times)
  const rankedBooksMap = new Map<string, RankedBookItem>();

  BOOKS.forEach((book) => {
    const mem = readingMemories[book.id];
    const prog = readingHistory.find((h) => h.bookId === book.id);
    const readingSecs = normalizedBookSecsMap.get(book.id) || 0;
    const sessions = mem?.sessionsCount || 0;
    const progressPct = prog?.progress || (prog?.page && book.pages ? Math.min(100, Math.round((prog.page / Number(book.pages)) * 100)) : 0);
    const lastRead = prog?.lastReadAt || mem?.lastReadAt || 0;
    const firstRead = mem?.firstReadAt || prog?.lastReadAt || 0;

    if (readingSecs > 0 || prog || mem) {
      rankedBooksMap.set(book.id, {
        book,
        readingSeconds: readingSecs,
        readingTimeFormatted: formatAnalyticsDuration(readingSecs, { compact: true }),
        sessionsCount: sessions,
        progress: progressPct,
        currentPage: prog?.page || 1,
        totalPages: prog?.totalPages || book.pages,
        lastReadAt: lastRead,
        firstReadAt: firstRead,
      });
    }
  });

  const allRankedBooks = Array.from(rankedBooksMap.values());
  const mostReadBooks = [...allRankedBooks]
    .sort((a, b) => b.readingSeconds - a.readingSeconds || b.progress - a.progress)
    .slice(0, 10);

  const recentlyReadBooks = [...allRankedBooks]
    .filter((b) => b.lastReadAt > 0)
    .sort((a, b) => b.lastReadAt - a.lastReadAt)
    .slice(0, 6);

  // 12. Reading Habits (Day of Week & Sessions)
  const dayOfWeekReadingSecs = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let totalHabitReadingSecs = 0;

  Object.entries(streakData.daily || {}).forEach(([dKey, dVal]) => {
    const parts = dKey.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayIdx = d.getDay();
      const s = dVal?.seconds || 0;
      dayOfWeekReadingSecs[dayIdx] += s;
      totalHabitReadingSecs += s;
    }
  });

  let bestDayIdx = 0;
  let maxDaySecs = 0;
  dayOfWeekReadingSecs.forEach((secs, idx) => {
    if (secs > maxDaySecs) {
      maxDaySecs = secs;
      bestDayIdx = idx;
    }
  });

  const mostProductiveDay = maxDaySecs > 0
    ? {
        dayName: dayNames[bestDayIdx],
        readingSeconds: maxDaySecs,
        percentOfTotal: totalHabitReadingSecs > 0 ? Math.round((maxDaySecs / totalHabitReadingSecs) * 100) : 0,
      }
    : null;

  // Session Duration from Memory Timelines
  let totalSessionSeconds = 0;
  let totalSessionCount = 0;
  let longestSessionSecs = 0;

  Object.values(readingMemories).forEach((mem) => {
    (mem.timeline || []).forEach((ev) => {
      if (ev.durationSeconds > 0) {
        totalSessionSeconds += ev.durationSeconds;
        totalSessionCount += 1;
        if (ev.durationSeconds > longestSessionSecs) {
          longestSessionSecs = ev.durationSeconds;
        }
      }
    });
  });

  const avgSessionDuration = totalSessionCount > 0 ? Math.round(totalSessionSeconds / totalSessionCount) : null;

  const readingHabits: ReadingHabitsData = {
    mostProductiveDayOfWeek: mostProductiveDay,
    avgSessionDurationSeconds: avgSessionDuration,
    longestSessionSeconds: longestSessionSecs > 0 ? longestSessionSecs : null,
    totalRecordedSessions: totalSessionCount,
  };

  const filterLabels: Record<AnalyticsTimeFilter, string> = {
    today: "Today",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    month: "This Month",
    year: "This Year",
    all: "All Time",
  };

  return {
    profileHeader: {
      userTitle: "Reader's HUB Reader",
      memberSince: memberSinceStr,
      memberSinceTimestamp: earliestTimestamp,
      totalDaysSinceFirstActivity: totalDaysSinceFirst,
      totalBooksEngaged: engagedBookIds.size,
      totalReadingDays,
      totalActiveDays,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
    },
    todaySummary: {
      readingSeconds: todayReadingSecs,
      activeSeconds: todayActiveSecs,
      booksCount: todayBooksCount,
      isQualified: isTodayQualified,
      streakDays: streakData.currentStreak,
      readingMinutesRemaining,
    },
    coreStats: {
      totalReadingSeconds: totalReadingSecs,
      totalActiveSeconds: totalActiveSecs,
      totalReadingDays,
      totalActiveDays,
      avgReadingSecondsPerDay: avgReadingSecsPerDay,
      avgActiveSecondsPerDay: avgActiveSecsPerDay,
      highestSingleDayReadingSeconds: highestSingleDayReading,
      bestReadingDay: bestReadingDayObj,
      thisMonthReadingDays,
      thisMonthReadingSeconds: thisMonthReadingSecs,
      thisMonthActiveSeconds: thisMonthActiveSecs,
      totalHighlights,
      totalNotes,
      totalSketches,
      totalBookmarks,
      totalAnnotations,
      totalPagesRead,
    },
    heatmap: {
      weeks,
      monthLabels,
      totalActiveCells: totalReadingDays,
      maxDailyReadingSeconds: maxDailyReading,
      year: heatmapYear,
    },
    monthlyJourney,
    favoriteGenre,
    genreBreakdown,
    mostReadBooks,
    recentlyReadBooks,
    readingHabits,
    dailyBreakdown,
    filter,
    filterLabel: filterLabels[filter],
  };
}
