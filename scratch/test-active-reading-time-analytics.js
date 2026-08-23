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

// Read and transpile reader-storage.ts via TypeScript compiler
const tsSource = fs.readFileSync(path.join(__dirname, "../lib/reader-storage.ts"), "utf8");
const jsOutput = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

const moduleExports = {};
const moduleContext = {
  exports: moduleExports,
  module: { exports: moduleExports },
  require: require,
  window: global.window,
  localStorage: global.localStorage,
  caches: { delete: async () => true, open: async () => ({ match: async () => false }) },
};

const runScript = new Function("exports", "module", "require", "window", "localStorage", "caches", jsOutput);
runScript(moduleExports, moduleContext.module, require, global.window, global.localStorage, moduleContext.caches);

const {
  getWebsiteActiveTimeData,
  addWebsiteActiveSeconds,
  getReadingActivityData,
  addActiveReadingTime,
  getBookReadingMemory,
  addBookReadingSeconds,
  calculateReadingStats,
  exportAllUserData,
  importUserData,
  getLocalDateKey,
  DAILY_READING_GOAL_SECONDS,
} = moduleContext.module.exports;

console.log("==================================================");
console.log("🧪 TESTING ACTIVE TIME VS READING TIME ANALYTICS");
console.log("==================================================\n");

function runTests() {
  const todayKey = getLocalDateKey();

  // 1. Initial State Check
  console.log("Step 1: Checking Initial State Defaults");
  const initActive = getWebsiteActiveTimeData();
  assert.strictEqual(initActive.totalActiveSeconds, 0, "Initial active seconds must be 0");
  assert.strictEqual(initActive.daily[todayKey] || 0, 0, "Initial today active seconds must be 0");

  const initReading = getReadingActivityData();
  assert.strictEqual(initReading.daily[todayKey]?.seconds || 0, 0, "Initial today reading seconds must be 0");
  console.log("✅ Step 1 Passed: Clean zero initial states verified.\n");

  // 2. Scenario 1: User Browses Website (Explores library, searches, filters)
  console.log("Step 2: Scenario 1 — Website Browsing Activity");
  const browseRes = addWebsiteActiveSeconds(15 * 60); // 15 minutes of site browsing
  assert.strictEqual(browseRes.totalActiveSeconds, 900, "Total active seconds should be 900s (15m)");
  assert.strictEqual(browseRes.todayActiveSeconds, 900, "Today active seconds should be 900s (15m)");

  // Verify Reading Time did NOT increase
  const readingAfterBrowse = getReadingActivityData();
  assert.strictEqual(readingAfterBrowse.daily[todayKey]?.seconds || 0, 0, "Reading time must remain 0 during browsing");
  assert.strictEqual(readingAfterBrowse.daily[todayKey]?.qualified || false, false, "Diya must remain unlit during browsing");
  console.log("✅ Step 2 Passed: Browsing increases Active Time while Reading Time remains strictly 0.\n");

  // 3. Scenario 2: User Reads Book A for 10 Minutes
  console.log("Step 3: Scenario 2 — Active Book Reading on Book A (10 Minutes)");
  // Both website activity and reading engine tick
  addWebsiteActiveSeconds(10 * 60);
  const readingRes1 = addActiveReadingTime(10 * 60); // 600s
  const bookAMem1 = addBookReadingSeconds("crime-and-punishment", 10 * 60);

  assert.strictEqual(readingRes1.todaySeconds, 600, "Today reading seconds should be 600s (10m)");
  assert.strictEqual(readingRes1.qualified, false, "10 min is < 15 min, Diya must not be qualified yet");
  assert.strictEqual(bookAMem1.totalSeconds, 600, "Book A memory must have exactly 600s");
  console.log("✅ Step 3 Passed: 10m of reading Book A attributes to both Daily Streak and Book A Memory.\n");

  // 4. Scenario 3: User Reads Book B for 6 Minutes (Crosses 15m Total Daily Reading Goal)
  console.log("Step 4: Scenario 3 — Reading Book B for 6 Minutes (Total Reading = 16m)");
  addWebsiteActiveSeconds(6 * 60);
  const readingRes2 = addActiveReadingTime(6 * 60); // +360s -> 960s total
  const bookBMem = addBookReadingSeconds("atomic-habits", 6 * 60);

  assert.strictEqual(readingRes2.todaySeconds, 960, "Today reading seconds should be 960s (16m)");
  assert.strictEqual(readingRes2.qualified, true, "16 min >= 15 min, Diya must now be QUALIFIED");
  assert.strictEqual(readingRes2.currentStreak, 1, "Streak must advance to 1");
  assert.strictEqual(bookBMem.totalSeconds, 360, "Book B memory must have 360s");

  // Re-verify Book A memory is isolated
  const bookACheck = getBookReadingMemory("crime-and-punishment");
  assert.strictEqual(bookACheck.totalSeconds, 600, "Book A memory must remain 600s without leakage");
  console.log("✅ Step 4 Passed: 15m goal crossed -> Diya lit; Book A and Book B times correctly isolated.\n");

  // 5. Scenario 4: Global Stats Calculation
  console.log("Step 5: Scenario 4 — Global Stats Distinction");
  const stats = calculateReadingStats();
  // Active Time = 15m (browse) + 10m (read A) + 6m (read B) = 31m (1860s)
  // Reading Time = 10m (read A) + 6m (read B) = 16m (960s)
  assert.strictEqual(stats.todayActiveSeconds, 1860, "Today active seconds must be 1860s (31m)");
  assert.strictEqual(stats.totalActiveSeconds, 1860, "Total active seconds must be 1860s (31m)");
  assert.strictEqual(stats.todayReadingSeconds, 960, "Today reading seconds must be 960s (16m)");
  assert.strictEqual(stats.totalReadingSeconds, 960, "Total reading seconds must be 960s (16m)");
  assert.strictEqual(stats.isTodayQualified, true, "isTodayQualified must be true");
  console.log("✅ Step 5 Passed: Stats clearly distinguish Active Time (31m) from Reading Time (16m).\n");

  // 6. Scenario 5: JSON Export and Import
  console.log("Step 6: Scenario 5 — Data Export & Import Integrity");
  const exportedJson = exportAllUserData();
  const parsedExport = JSON.parse(exportedJson);
  assert(parsedExport.activeTime, "Exported JSON must include activeTime");
  assert.strictEqual(parsedExport.activeTime.totalActiveSeconds, 1860, "Exported active seconds must be 1860");
  assert(parsedExport.readingActivity, "Exported JSON must include readingActivity");
  assert(parsedExport.readingMemories, "Exported JSON must include readingMemories");

  // Clear store and re-import
  localStorage.clear();
  const importRes = importUserData(exportedJson);
  assert.strictEqual(importRes.success, true, "Import must succeed");

  const restoredStats = calculateReadingStats();
  assert.strictEqual(restoredStats.totalActiveSeconds, 1860, "Restored active seconds must match 1860");
  assert.strictEqual(restoredStats.todayReadingSeconds, 960, "Restored reading seconds must match 960");
  assert.strictEqual(restoredStats.isTodayQualified, true, "Restored Diya qualification must match");
  console.log("✅ Step 6 Passed: Export and Import preserve complete Active Time & Reading Time telemetry.\n");

  console.log("🎉 ALL ACTIVE TIME & READING TIME TESTS PASSED SUCCESSFULLY 100%!");
}

runTests();

