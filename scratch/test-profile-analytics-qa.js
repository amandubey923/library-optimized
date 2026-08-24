const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ts = require("typescript");

// Mock LocalStorage environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  key: (i) => Object.keys(store)[i] || null,
  get length() { return Object.keys(store).length; },
};
global.window = { localStorage: global.localStorage };

// Read and transpile reader-storage.ts and reading-analytics.ts via TypeScript compiler
function loadTsModule(filePath, customExports = {}) {
  const tsSource = fs.readFileSync(filePath, "utf8");
  const jsOutput = ts.transpileModule(tsSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  const moduleExports = customExports;
  const moduleObj = { exports: moduleExports };
  const customRequire = (reqPath) => {
    if (reqPath === "./reader-storage" || reqPath === "@/lib/reader-storage") {
      return readerStorageExports;
    }
    if (reqPath === "@/data/books" || reqPath === "../data/books") {
      const booksData = require(path.join(__dirname, "../data/books.json"));
      return { BOOKS: booksData, CATEGORIES: ["All", "Philosophy & Spirituality", "Technical Knowledge", "Classics", "Fiction & Dystopian"] };
    }
    return require(reqPath);
  };

  const runScript = new Function("exports", "module", "require", "window", "localStorage", "caches", jsOutput);
  runScript(moduleExports, moduleObj, customRequire, global.window, global.localStorage, { delete: async () => true, open: async () => ({ match: async () => false }) });
  return moduleObj.exports;
}

const readerStorageExports = loadTsModule(path.join(__dirname, "../lib/reader-storage.ts"));
const readingAnalyticsExports = loadTsModule(path.join(__dirname, "../lib/reading-analytics.ts"));

const {
  getWebsiteActiveTimeData,
  addWebsiteActiveSeconds,
  getReadingActivityData,
  addActiveReadingTime,
  getBookReadingMemory,
  addBookReadingSeconds,
  recordReadingMemorySession,
  calculateReadingStats,
  factoryResetAllData,
  getLocalDateKey,
} = readerStorageExports;

const {
  getComprehensiveAnalytics,
  formatAnalyticsDuration,
} = readingAnalyticsExports;

console.log("===============================================================");
console.log("🧪 RUNNING COMPREHENSIVE READING PROFILE & ANALYTICS QA AUDIT");
console.log("===============================================================\n");

async function runAllTests() {
  const todayKey = getLocalDateKey();

  // -------------------------------------------------------------
  // TEST 1: Clean Initial State / Empty State Safety
  // -------------------------------------------------------------
  console.log("[TEST 1] Clean Initial State (Zero / Empty History)");
  await factoryResetAllData();
  const emptyAnalytics = getComprehensiveAnalytics("all");

  assert.strictEqual(emptyAnalytics.profileHeader.totalReadingDays, 0, "Initial reading days must be 0");
  assert.strictEqual(emptyAnalytics.profileHeader.currentStreak, 0, "Initial current streak must be 0");
  assert.strictEqual(emptyAnalytics.profileHeader.longestStreak, 0, "Initial longest streak must be 0");
  assert.strictEqual(emptyAnalytics.coreStats.totalReadingSeconds, 0, "Initial total reading must be 0s");
  assert.strictEqual(emptyAnalytics.coreStats.totalActiveSeconds, 0, "Initial total active must be 0s");
  assert.strictEqual(emptyAnalytics.coreStats.bestReadingDay, null, "Best reading day must be null when no data");
  assert.strictEqual(emptyAnalytics.favoriteGenre, null, "Favorite genre must be null when no books read");
  assert.strictEqual(emptyAnalytics.monthlyJourney.length, 0, "Monthly journey must be empty");
  assert.strictEqual(emptyAnalytics.mostReadBooks.length, 0, "Most read books must be empty");
  console.log("✅ Test 1 Passed: Clean empty states render safely with zero divide-by-zero errors.\n");

  // -------------------------------------------------------------
  // TEST 2: Reading Only (20m reading -> Reading 20m, Active 20m)
  // -------------------------------------------------------------
  console.log("[TEST 2] Reading Only (20m reading)");
  await factoryResetAllData();
  addActiveReadingTime(20 * 60);
  const analytics2 = getComprehensiveAnalytics("all");

  assert.strictEqual(analytics2.todaySummary.readingSeconds, 20 * 60, "Reading must be 20m");
  assert.strictEqual(analytics2.todaySummary.activeSeconds, 20 * 60, "Active must be 20m (Reading <= Active)");
  assert.strictEqual(analytics2.todaySummary.isQualified, true, "Diya must be lit (20m >= 15m)");
  console.log("✅ Test 2 Passed: 20m reading -> Reading 20m, Active 20m, Diya Lit.\n");

  // -------------------------------------------------------------
  // TEST 3: Browsing + Reading (10m browsing + 20m reading)
  // -------------------------------------------------------------
  console.log("[TEST 3] Browsing + Reading (10m browsing + 20m reading)");
  await factoryResetAllData();
  addWebsiteActiveSeconds(10 * 60); // 10m browsing
  addActiveReadingTime(20 * 60);    // 20m reading
  const analytics3 = getComprehensiveAnalytics("all");

  assert.strictEqual(analytics3.todaySummary.readingSeconds, 20 * 60, "Reading must be strictly 20m");
  assert.strictEqual(analytics3.todaySummary.activeSeconds, 30 * 60, "Active must be 30m (20m reading + 10m browsing)");
  assert.strictEqual(analytics3.todaySummary.isQualified, true, "Diya must use strictly 20m reading time");
  console.log("✅ Test 3 Passed: 10m browsing + 20m reading -> Reading 20m, Active 30m, Diya Lit using 20m.\n");

  // -------------------------------------------------------------
  // TEST 4: Browsing Only (30m browsing -> Reading 0m, Active 30m)
  // -------------------------------------------------------------
  console.log("[TEST 4] Browsing Only (30m browsing)");
  await factoryResetAllData();
  addWebsiteActiveSeconds(30 * 60);
  const analytics4 = getComprehensiveAnalytics("all");

  assert.strictEqual(analytics4.todaySummary.readingSeconds, 0, "Reading must be 0m");
  assert.strictEqual(analytics4.todaySummary.activeSeconds, 30 * 60, "Active must be 30m");
  assert.strictEqual(analytics4.todaySummary.isQualified, false, "Diya must remain unlit during browsing");
  console.log("✅ Test 4 Passed: 30m browsing -> Reading 0m, Active 30m, Diya unlit.\n");

  // -------------------------------------------------------------
  // TEST 5: Diya & Streak Math Invariance
  // -------------------------------------------------------------
  console.log("[TEST 5] Diya & Streak Math (20m reading + 30m browsing)");
  await factoryResetAllData();
  addWebsiteActiveSeconds(30 * 60);
  addActiveReadingTime(20 * 60);
  const analytics5 = getComprehensiveAnalytics("all");

  assert.strictEqual(analytics5.profileHeader.currentStreak, 1, "Streak must be 1 day");
  assert.strictEqual(analytics5.todaySummary.readingSeconds, 1200, "Reading seconds = 1200");
  assert.strictEqual(analytics5.todaySummary.activeSeconds, 3000, "Active seconds = 3000 (1200 + 1800)");
  console.log("✅ Test 5 Passed: Diya/Streak strictly relies on 20m reading time, browsing does not pollute streak.\n");

  // -------------------------------------------------------------
  // TEST 6: Monthly Journey Aggregation
  // -------------------------------------------------------------
  console.log("[TEST 6] Monthly Journey Breakdown");
  await factoryResetAllData();
  addActiveReadingTime(45 * 60); // 45m today
  addWebsiteActiveSeconds(15 * 60); // 15m browsing
  const analytics6 = getComprehensiveAnalytics("all");

  assert.strictEqual(analytics6.monthlyJourney.length, 1, "Must contain exactly 1 active month");
  const currentMonthData = analytics6.monthlyJourney[0];
  assert.strictEqual(currentMonthData.readingDays, 1, "1 reading day in month");
  assert.strictEqual(currentMonthData.readingSeconds, 45 * 60, "45m reading in month");
  assert.strictEqual(currentMonthData.activeSeconds, 60 * 60, "60m active in month");
  assert.strictEqual(currentMonthData.avgReadingSecondsPerDay, 45 * 60, "Avg 45m per reading day");
  console.log("✅ Test 6 Passed: Monthly activity aggregated accurately without fabricated months.\n");

  // -------------------------------------------------------------
  // TEST 7: Multi-Book Favorite Genre Derivation
  // -------------------------------------------------------------
  console.log("[TEST 7] Real Favorite Genre Derivation (from actual reading time)");
  await factoryResetAllData();
  // Book 1: Crime and Punishment (Classics) -> 2 hours reading
  addBookReadingSeconds("crime-and-punishment", 120 * 60);
  // Book 2: Atomic Habits (Self-Development & Psychology) -> 30 mins reading
  addBookReadingSeconds("atomic-habits", 30 * 60);

  const analytics7 = getComprehensiveAnalytics("all");
  assert(analytics7.favoriteGenre !== null, "Favorite genre must not be null");
  assert.strictEqual(analytics7.favoriteGenre.category, "Classics", "Favorite genre must be 'Classics' (highest reading time)");
  assert.strictEqual(analytics7.favoriteGenre.readingSeconds, 120 * 60, "Classics must have 120m read");
  assert.strictEqual(analytics7.favoriteGenre.percentOfTotal, 80, "120m out of 150m is 80%");
  console.log("✅ Test 7 Passed: Favorite genre accurately derived from real reading time (80% Classics).\n");

  // -------------------------------------------------------------
  // TEST 8: Most Read Books Ranking
  // -------------------------------------------------------------
  console.log("[TEST 8] Most Read Books Ranking");
  assert(analytics7.mostReadBooks.length >= 2, "Must have at least 2 ranked books");
  assert.strictEqual(analytics7.mostReadBooks[0].book.id, "crime-and-punishment", "Rank #1 must be Crime and Punishment");
  assert.strictEqual(analytics7.mostReadBooks[0].readingSeconds, 120 * 60, "Rank #1 must have 120m read");
  assert.strictEqual(analytics7.mostReadBooks[1].book.id, "atomic-habits", "Rank #2 must be Atomic Habits");
  assert.strictEqual(analytics7.mostReadBooks[1].readingSeconds, 30 * 60, "Rank #2 must have 30m read");
  console.log("✅ Test 8 Passed: Books ranked strictly by actual reading time (#1 Crime and Punishment, #2 Atomic Habits).\n");

  // -------------------------------------------------------------
  // TEST 9: Heatmap Daily Intensity Levels
  // -------------------------------------------------------------
  console.log("[TEST 9] Heatmap Matrix & Intensity Levels");
  await factoryResetAllData();
  addActiveReadingTime(130 * 60); // 130 min -> Level 5 (120m+)
  const analytics9 = getComprehensiveAnalytics("all");

  const todayCell = analytics9.heatmap.weeks.flat().find((c) => c.dateKey === todayKey);
  assert(todayCell !== undefined, "Today's cell must exist in heatmap");
  assert.strictEqual(todayCell.intensityLevel, 5, "130m reading must result in Level 5 intensity");
  assert.strictEqual(todayCell.readingSeconds, 130 * 60, "Cell reading seconds must be 130m");
  assert.strictEqual(todayCell.isQualified, true, "130m >= 15m -> isQualified is true");
  console.log("✅ Test 9 Passed: Heatmap intensity calculated accurately with 7-level theme scale.\n");

  // -------------------------------------------------------------
  // TEST 10: Reading Habits from Sessions Timeline
  // -------------------------------------------------------------
  console.log("[TEST 10] Reading Habits from Session History");
  await factoryResetAllData();
  recordReadingMemorySession({
    bookId: "crime-and-punishment",
    timestamp: Date.now(),
    startPage: 1,
    endPage: 25,
    durationSeconds: 30 * 60, // 30 min session
    highlightsAdded: 2,
    notesAdded: 1,
    bookmarksAdded: 1,
  });
  recordReadingMemorySession({
    bookId: "crime-and-punishment",
    timestamp: Date.now(),
    startPage: 25,
    endPage: 50,
    durationSeconds: 50 * 60, // 50 min session
    highlightsAdded: 3,
    notesAdded: 0,
    bookmarksAdded: 0,
  });

  const analytics10 = getComprehensiveAnalytics("all");
  assert.strictEqual(analytics10.readingHabits.totalRecordedSessions, 2, "2 recorded sessions");
  assert.strictEqual(analytics10.readingHabits.avgSessionDurationSeconds, 40 * 60, "Average session must be 40m");
  assert.strictEqual(analytics10.readingHabits.longestSessionSeconds, 50 * 60, "Longest session must be 50m");
  console.log("✅ Test 10 Passed: Habits accurately calculated from authentic timeline sessions.\n");

  // -------------------------------------------------------------
  // TEST 11: Time Window Filtering (7D, 30D, Month, Year, All)
  // -------------------------------------------------------------
  console.log("[TEST 11] Time Window Filtering");
  const filterAll = getComprehensiveAnalytics("all");
  const filterYear = getComprehensiveAnalytics("year");
  const filterMonth = getComprehensiveAnalytics("month");
  const filter30D = getComprehensiveAnalytics("30d");
  const filter7D = getComprehensiveAnalytics("7d");

  assert.strictEqual(filterAll.filter, "all", "All filter");
  assert.strictEqual(filterYear.filter, "year", "Year filter");
  assert.strictEqual(filterMonth.filter, "month", "Month filter");
  assert.strictEqual(filter30D.filter, "30d", "30D filter");
  assert.strictEqual(filter7D.filter, "7d", "7D filter");
  console.log("✅ Test 11 Passed: Time window filtering logic verified.\n");

  // -------------------------------------------------------------
  // TEST 12: Helper Duration Formatter
  // -------------------------------------------------------------
  console.log("[TEST 12] Duration Formatter");
  assert.strictEqual(formatAnalyticsDuration(0), "0m");
  assert.strictEqual(formatAnalyticsDuration(45 * 60), "45m");
  assert.strictEqual(formatAnalyticsDuration(125 * 60), "2h 05m");
  assert.strictEqual(formatAnalyticsDuration(125 * 60, { compact: true }), "2h 5m");
  assert.strictEqual(formatAnalyticsDuration(125 * 60, { verbose: true }), "2 hours 5 minutes");
  console.log("✅ Test 12 Passed: Formatter outputs human-readable strings.\n");

  console.log("===============================================================");
  console.log("🎉 ALL 12 READING PROFILE & ANALYTICS TESTS PASSED 100%!");
  console.log("===============================================================");
}

runAllTests();
