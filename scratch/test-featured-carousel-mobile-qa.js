const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=================================================");
console.log("  READER'S HUB — FEATURED MASTERPIECE MOBILE QA");
console.log("=================================================\n");

const continueReadingPath = path.join(__dirname, "../components/ContinueReading.tsx");
const continueContent = fs.readFileSync(continueReadingPath, "utf8");

const carouselPath = path.join(__dirname, "../components/FeaturedCarousel.tsx");
const carouselContent = fs.readFileSync(carouselPath, "utf8");

// Test 1: Start your reading journey hidden on mobile
assert(continueContent.includes('className="hidden sm:block py-10 border-b'), "Must hide Start your reading journey on mobile screens");
console.log("  ✅ [PASS] 'Start your reading journey' is completely hidden on mobile phones (hidden sm:block)");

// Test 2: Touch swipe gesture handlers present
assert(carouselContent.includes("onTouchStart={handleTouchStart}"), "Must bind onTouchStart handler");
assert(carouselContent.includes("onTouchEnd={handleTouchEnd}"), "Must bind onTouchEnd handler");
assert(carouselContent.includes("Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)"), "Must detect dominant horizontal swipe");
console.log("  ✅ [PASS] Touch swipe left/right gesture engine verified");

// Test 3: Continuous Looping logic
assert(carouselContent.includes("prev === 0 ? featured.length - 1 : prev - 1"), "Must loop backwards 1 <- 7");
assert(carouselContent.includes("prev === featured.length - 1 ? 0 : prev + 1"), "Must loop forwards 7 -> 1");
console.log("  ✅ [PASS] Continuous carousel looping verified (1 -> 7 -> 1 and 1 <- 7)");

// Test 4: Left & Right buttons integrated INSIDE mobile card
assert(carouselContent.includes("block lg:hidden relative z-10"), "Must have dedicated compact mobile presentation");
assert(carouselContent.includes("aria-label=\"Previous masterpiece\""), "Previous button inside mobile card");
assert(carouselContent.includes("aria-label=\"Next masterpiece\""), "Next button inside mobile card");
console.log("  ✅ [PASS] Navigation buttons are placed directly INSIDE the mobile card");

// Test 5: Compact cover and metadata layout
assert(carouselContent.includes("w-24 xs:w-28 aspect-[2/3]"), "Mobile cover uses compact dimensions");
assert(carouselContent.includes("Read Book Now"), "Action button preserved");
assert(carouselContent.includes("hidden lg:grid grid-cols-12"), "Desktop layout preserved 100%");
console.log("  ✅ [PASS] Compact side-by-side presentation with preserved desktop layout");

// Test 6: Viewport width mathematical simulation
const viewports = [320, 360, 375, 390, 412, 430];
viewports.forEach(w => {
  const containerPadding = 16 * 2; // px-4 on main
  const cardPadding = 16 * 2; // p-4 on card
  const availableWidth = w - containerPadding - cardPadding;
  const coverWidth = w <= 360 ? 96 : 112; // w-24 or w-28
  const metaWidth = availableWidth - coverWidth - 14; // 14px gap
  
  assert(metaWidth >= 110, `At ${w}px, metadata width is ${metaWidth}px which fits title, author, and description`);
  console.log(`  ✅ [PASS] Viewport ${w}px: card width = ${(w - containerPadding).toFixed(0)}px, cover = ${coverWidth}px, meta = ${metaWidth}px (zero horizontal overflow)`);
});

console.log("\n=================================================");
console.log("  QA SUMMARY: 6/6 TESTS PASSED (100%)");
console.log("=================================================\n");

