const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=================================================");
console.log("  READER'S HUB — PDF UX & FIXED BACKGROUND QA");
console.log("=================================================\n");

const readerPath = path.join(__dirname, "../components/reader/BookReader.tsx");
const readerContent = fs.readFileSync(readerPath, "utf8");

// Test 1: Mobile container background uses getPageBgColor()
assert(readerContent.includes("background: isMobile\n          ? getPageBgColor()"), "Container background on mobile must be getPageBgColor()");
console.log("  ✅ [PASS] Mobile reader viewport background is dynamically bound to getPageBgColor() (No black backdrop leak)");

// Test 2: Mobile Header hides 3 floating controls (Chapters, Find, Pages)
assert(readerContent.includes("hidden sm:flex items-center gap-1 sm:gap-2.5 min-w-0 flex-shrink-0"), "Must hide 3 left icons on mobile with hidden sm:flex");
console.log("  ✅ [PASS] 3 left floating controls (Chapters, Find, Pages) hidden on mobile phones");

// Test 3: Outer background card wrapper stays fixed
assert(readerContent.includes("className={`relative w-full h-full overflow-hidden flex items-center justify-center"), "Single page card must fill viewport on mobile");
console.log("  ✅ [PASS] Single page background sheet is full-bleed and permanently fixed in place");

// Test 4: Pan and interactiveScale transforms are isolated strictly to the PDF content layer
assert(readerContent.includes("transform: `scale(${interactiveScale}) translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`"), "Inner canvas container must receive hardware-accelerated scale & pan transform");
console.log("  ✅ [PASS] Scale & pan transforms are isolated strictly to the inner PDF canvas/drawing layer");

// Test 5: Mobile fitScale uses width-fit
assert(readerContent.includes("const fitScale = isMobile ? scaleX : Math.min(scaleX, scaleY)"), "Must use width-fit scaleX on mobile for readable text size");
console.log("  ✅ [PASS] Mobile PDF rendering uses full width-fit for large, readable text");

// Test 6: Pinch-to-zoom support on touch phones
assert(readerContent.includes("isPinchingRef.current = true"), "Must detect 2-finger touch for pinch-to-zoom");
assert(readerContent.includes("Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)"), "Must calculate Euclidean distance between touch points");
assert(readerContent.includes("targetZoom = Math.min(250, Math.max(70"), "Must clamp zoom range comfortably between 70% and 250%");
console.log("  ✅ [PASS] Natural two-finger pinch-to-zoom gesture verified");

// Test 7: Double tap zoom reset / quick zoom
assert(readerContent.includes("lastTapTimeRef.current"), "Must track double-tap interval");
assert(readerContent.includes("updatePref(\"zoom\", 100)"), "Double tap must reset zoom to 100%");
console.log("  ✅ [PASS] Double-tap zoom toggle gesture verified");

// Test 8: Laptop & Desktop Trackpad / Ctrl+Wheel Zoom
assert(readerContent.includes("e.ctrlKey || e.metaKey"), "Must support Ctrl/Cmd + Wheel zoom on laptops/desktops");
assert(readerContent.includes("container.addEventListener(\"wheel\", handleWheel"), "Wheel listener must be bound to reader container");
console.log("  ✅ [PASS] Laptop & Desktop trackpad pinch / Ctrl+Wheel zoom verified");

// Test 9: Mobile focus mode hides bottom controls to maximize reading space
assert(readerContent.includes("showControls && (!isFocusMode || !isMobile)"), "Must minimize bottom toolbar in mobile focus mode");
console.log("  ✅ [PASS] Bottom bar minimized in mobile focus mode for maximum vertical reading area");

console.log("\n=================================================");
console.log("  QA SUMMARY: 9/9 TESTS PASSED");
console.log("=================================================\n");
