const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=================================================");
console.log("  READER'S HUB — TECHNICAL READER MOBILE QA");
console.log("=================================================\n");

const detailContent = fs.readFileSync(path.join(__dirname, "../app/book/[id]/BookDetailClient.tsx"), "utf8");
const readerContent = fs.readFileSync(path.join(__dirname, "../components/reader/BookReader.tsx"), "utf8");
const translationContent = fs.readFileSync(path.join(__dirname, "../components/reader/TranslationDrawer.tsx"), "utf8");

// Test 1: BookDetailClient outer main container is strictly constrained with min-w-0 and overflow-x-hidden
assert(detailContent.includes("w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8"), "Main must be full-width with mobile padding");
assert(detailContent.includes("min-w-0 overflow-x-hidden"), "Main must have min-w-0 overflow-x-hidden");
console.log("  ✅ [PASS] BookDetailClient main container has min-w-0 and zero horizontal overflow");

// Test 2: Breadcrumb nav is scroll-contained without expanding page
assert(detailContent.includes("w-full max-w-full min-w-0 flex items-center gap-2"), "Breadcrumb must have max-w-full min-w-0");
assert(detailContent.includes("scrollbar-none"), "Breadcrumb must use scrollbar-none");
console.log("  ✅ [PASS] Breadcrumb navigation uses contained edge-to-edge scroll");

// Test 3: Hero card and Specs grid are responsive
assert(detailContent.includes("grid grid-cols-2 sm:grid-cols-4"), "Specs grid must support 2-column mobile layout");
assert(detailContent.includes("aspect-[2/3] rounded-2xl overflow-hidden"), "Cover image has 2/3 aspect ratio");
console.log("  ✅ [PASS] Book hero card and specs grid reflow properly on mobile");

// Test 4: BookReader container uses responsive min-h and h
assert(readerContent.includes("w-full min-h-[540px] sm:min-h-[640px] h-[700px] sm:h-[830px]"), "BookReader must scale min-h and h on mobile");
console.log("  ✅ [PASS] BookReader has proportional mobile viewport height");

// Test 5: Top floating toolbar has scrollable action container for mobile
assert(readerContent.includes("overflow-x-auto scrollbar-none max-w-full py-0.5 min-w-0"), "Top toolbar actions must be scrollable on mobile");
console.log("  ✅ [PASS] Top floating toolbar has touch scrollable action strip");

// Test 6: Bottom navigation bar has responsive page indicator
assert(readerContent.includes("Page {currentPage}"), "Bottom toolbar displays page indicator");
assert(readerContent.includes("max-w-4xl mx-auto"), "Bottom progress bar is centered");
console.log("  ✅ [PASS] Bottom navigation toolbar and progress bar verified");

// Test 7: Translation drawer container supports full mobile width
assert(translationContent.includes("w-full sm:w-[480px]"), "Translation drawer supports full mobile width");
console.log("  ✅ [PASS] Translation drawer fits mobile viewport cleanly");

console.log("\n=================================================");
console.log("  QA SUMMARY: 7/7 TESTS PASSED");
console.log("=================================================\n");

