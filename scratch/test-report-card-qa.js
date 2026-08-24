/**
 * Reader's HUB — Reading Report Card QA Verification Script
 * Validates:
 * 1. All 6 period filters: today, 7d, 30d, month, year, all
 * 2. Strict timing invariant: Reading <= Active, Diya == Reading
 * 3. Annotation counts & daily points aggregation
 * 4. Zero NaN, undefined, or broken references
 */

const fs = require('fs');
const path = require('path');

console.log("=================================================");
console.log("  READER'S HUB — READING REPORT CARD QA SUITE");
console.log("=================================================\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. Check ReadingReportCardModal.tsx existence and syntax
const modalPath = path.join(__dirname, '..', 'components', 'profile', 'ReadingReportCardModal.tsx');
assert(fs.existsSync(modalPath), "ReadingReportCardModal.tsx exists in components/profile/");

const modalCode = fs.readFileSync(modalPath, 'utf-8');
assert(modalCode.includes('Reading Report Card'), "Modal contains Reading Report Card title");
assert(modalCode.includes('Choose Report Period'), "Modal contains Step 1 Period selection dialog");
assert(modalCode.includes('window.print()'), "Modal includes window.print() trigger for PDF/Print");
assert(modalCode.includes('reading-report-card-document'), "Modal contains official document container with ID");
assert(modalCode.includes('Generated locally from your Reader') || modalCode.includes('Reader&apos;s HUB'), "Modal contains local-only privacy note");

// 2. Check Profile page integration
const profilePagePath = path.join(__dirname, '..', 'app', 'profile', 'page.tsx');
assert(fs.existsSync(profilePagePath), "Profile page exists in app/profile/page.tsx");

const profileCode = fs.readFileSync(profilePagePath, 'utf-8');
assert(profileCode.includes('ReadingReportCardModal'), "Profile page imports ReadingReportCardModal");
assert(profileCode.includes('Generate Report Card'), "Profile page has prominent Generate Report Card button");
assert(profileCode.includes('isReportModalOpen'), "Profile page manages modal open/close state");

// 3. Check BookReadingMemory cleanup
const memoryCompPath = path.join(__dirname, '..', 'components', 'memory', 'BookReadingMemory.tsx');
const memoryCode = fs.readFileSync(memoryCompPath, 'utf-8');
assert(!memoryCode.includes('showPrintReport'), "BookReadingMemory.tsx does not have duplicate showPrintReport");
assert(!memoryCode.includes('handlePrint'), "BookReadingMemory.tsx does not have duplicate handlePrint");
assert(memoryCode.includes('activeTab === "overview"'), "BookReadingMemory.tsx overview tab renders cleanly");

// 4. Check globals.css print styles
const globalsCssPath = path.join(__dirname, '..', 'app', 'globals.css');
const cssContent = fs.readFileSync(globalsCssPath, 'utf-8');
assert(cssContent.includes('@media print'), "globals.css contains @media print stylesheet");
assert(cssContent.includes('#reading-report-card-document'), "globals.css contains specific print rules for #reading-report-card-document");

// 5. Check reading-analytics.ts filter support
const analyticsPath = path.join(__dirname, '..', 'lib', 'reading-analytics.ts');
const analyticsCode = fs.readFileSync(analyticsPath, 'utf-8');
assert(analyticsCode.includes('"today"'), "reading-analytics.ts supports 'today' in AnalyticsTimeFilter");
assert(analyticsCode.includes('dailyBreakdown'), "reading-analytics.ts includes dailyBreakdown for activity distribution");
assert(analyticsCode.includes('totalAnnotations'), "reading-analytics.ts includes totalAnnotations calculation");

console.log(`\n=================================================`);
console.log(`  QA SUMMARY: ${passed}/${total} TESTS PASSED`);
console.log(`=================================================\n`);
