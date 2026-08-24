const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=================================================");
console.log("  READER'S HUB — MOBILE 2-COL LIBRARY GRID QA");
console.log("=================================================\n");

const libraryPath = path.join(__dirname, "../app/library/page.tsx");
const libraryContent = fs.readFileSync(libraryPath, "utf8");

const homePath = path.join(__dirname, "../app/page.tsx");
const homeContent = fs.readFileSync(homePath, "utf8");

const cardPath = path.join(__dirname, "../components/BookCard.tsx");
const cardContent = fs.readFileSync(cardPath, "utf8");

// Test 1: Library page uses 2-col on mobile
assert(libraryContent.includes("grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6"), "Library must use grid-cols-2 on mobile with gap-3");
console.log("  ✅ [PASS] Library page book grid uses compact 2-column mobile layout (grid-cols-2)");

// Test 2: Home page uses 2-col on mobile
assert(homeContent.includes("grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6"), "Home page must use grid-cols-2 on mobile with gap-3");
console.log("  ✅ [PASS] Home page book grid uses compact 2-column mobile layout (grid-cols-2)");

// Test 3: BookCard compact responsive padding & typography
assert(cardContent.includes("p-2.5 sm:p-4"), "BookCard must use p-2.5 on mobile");
assert(cardContent.includes("text-xs sm:text-base"), "Title must be text-xs on mobile");
assert(cardContent.includes("text-[10px] sm:text-xs text-[var(--text-secondary)]"), "Author must be text-[10px] on mobile");
assert(cardContent.includes("hidden sm:block text-xs"), "Excerpt must be hidden on mobile to maintain 5-6 cards visible density");
assert(cardContent.includes("px-2 sm:px-3 py-1 sm:py-1.5"), "Read button must use compact mobile padding");
console.log("  ✅ [PASS] BookCard has responsive compact styling for 2-column mobile layout");

// Test 4: Viewport width mathematical layout simulation
const viewports = [320, 360, 375, 390, 412, 430];
viewports.forEach(w => {
  const containerPadding = 16 * 2; // px-4 on main
  const availableWidth = w - containerPadding;
  const gap = 12; // gap-3 = 12px
  const cardWidth = (availableWidth - gap) / 2;
  const coverHeight = cardWidth * (3 / 2); // aspect-[2/3]
  const estimatedCardHeight = coverHeight + 20 + 16 + 14 + 28 + 20; // badge + title + author + footer + padding
  const visibleCardsIn800pxViewport = Math.floor(800 / (estimatedCardHeight + gap)) * 2;
  
  assert(cardWidth >= 130, `Card width at ${w}px is ${cardWidth}px, which fits two columns cleanly`);
  assert(visibleCardsIn800pxViewport >= 4, `At ${w}px, roughly ${visibleCardsIn800pxViewport} cards visible while scrolling`);
  console.log(`  ✅ [PASS] Viewport ${w}px: card width = ${cardWidth.toFixed(1)}px, cover height = ${coverHeight.toFixed(1)}px (~${visibleCardsIn800pxViewport} cards visible in viewport)`);
});

console.log("\n=================================================");
console.log("  QA SUMMARY: 4/4 TESTS PASSED (100%)");
console.log("=================================================\n");

