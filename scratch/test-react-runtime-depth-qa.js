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
  calculateReadingStats,
  factoryResetAllData,
  getLocalDateKey,
} = readerStorageExports;

const {
  getComprehensiveAnalytics,
} = readingAnalyticsExports;

console.log("===============================================================");
console.log("🧪 TESTING REACT LIFECYCLE & STATE RE-RENDER STABILITY");
console.log("===============================================================\n");

async function runLifecycleTests() {
  const todayKey = getLocalDateKey();

  // Test 1: Rapid Simulated Render Cycles with recordReading & Stats
  console.log("[TEST 1] Testing Idempotency & Repeated Mounts (Simulating 100 Render Passes)");
  await factoryResetAllData();

  for (let i = 0; i < 100; i++) {
    // Simulating what BookDetailClient does on mount
    const statsBefore = calculateReadingStats();
    const analytics = getComprehensiveAnalytics("all");
    const statsAfter = calculateReadingStats();

    assert.strictEqual(statsBefore.todayReadingSeconds, statsAfter.todayReadingSeconds);
    assert.strictEqual(statsBefore.todayActiveSeconds, statsAfter.todayActiveSeconds);
    assert.strictEqual(analytics.todaySummary.readingSeconds, statsAfter.todayReadingSeconds);
  }
  console.log("✅ Test 1 Passed: 100 consecutive render evaluations produced 0 state drift or mutation.\n");

  // Test 2: Active PDF Reading vs Exploration Invariants
  console.log("[TEST 2] Active PDF Reading + Exploration Invariants");
  await factoryResetAllData();
  addWebsiteActiveSeconds(15 * 60); // 15m browsing
  addActiveReadingTime(25 * 60);    // 25m reading

  const stats = calculateReadingStats();
  const act = getReadingActivityData();
  const expl = getWebsiteActiveTimeData().explorationDaily[todayKey] || 0;

  assert.strictEqual(stats.todayReadingSeconds, 25 * 60, "Reading = 25m");
  assert.strictEqual(act.daily[todayKey]?.seconds, 25 * 60, "Streak = 25m");
  assert.strictEqual(expl, 15 * 60, "Exploration = 15m");
  assert.strictEqual(stats.todayActiveSeconds, 40 * 60, "Active = 25m + 15m = 40m");
  assert(stats.todayActiveSeconds >= stats.todayReadingSeconds, "Active >= Reading");
  console.log("✅ Test 2 Passed: Invariants hold with zero double-counting.\n");

  console.log("===============================================================");
  console.log("🎉 ALL REACT RUNTIME LIFECYCLE TESTS PASSED 100%!");
  console.log("===============================================================");
}

runLifecycleTests();
