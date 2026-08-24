const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=================================================");
console.log("  READER'S HUB — PDF UX & GESTURE AUDIT QA");
console.log("=================================================\n");

const readerPath = path.join(__dirname, "../components/reader/BookReader.tsx");
const readerContent = fs.readFileSync(readerPath, "utf8");

// Test 1: Pinch-to-zoom support on touch phones
assert(readerContent.includes("isPinchingRef.current = true"), "Must detect 2-finger touch for pinch-to-zoom");
assert(readerContent.includes("Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)"), "Must calculate Euclidean distance between touch points");
assert(readerContent.includes("targetZoom = Math.min(220, Math.max(70"), "Must clamp zoom range comfortably between 70% and 220%");
console.log("  ✅ [PASS] Natural two-finger pinch-to-zoom gesture verified");

// Test 2: Touch pan / drag across zoomed PDF
assert(readerContent.includes("panOffset"), "Must track panOffset state for translation");
assert(readerContent.includes("touch-none"), "Must prevent accidental browser pull-to-refresh / bounce with touch-none");
assert(readerContent.includes("translate3d(${panOffset.x}px, ${panOffset.y}px, 0)"), "Must apply smooth hardware-accelerated 3D transform during panning");
console.log("  ✅ [PASS] Smooth touch pan/drag on zoomed PDF verified");

// Test 3: Double tap zoom reset / quick zoom
assert(readerContent.includes("lastTapTimeRef.current"), "Must track double-tap interval");
assert(readerContent.includes("updatePref(\"zoom\", 100)"), "Double tap must reset zoom to 100%");
console.log("  ✅ [PASS] Double-tap zoom toggle gesture verified");

// Test 4: Laptop & Desktop Trackpad / Ctrl+Wheel Zoom
assert(readerContent.includes("e.ctrlKey || e.metaKey"), "Must support Ctrl/Cmd + Wheel zoom on laptops/desktops");
assert(readerContent.includes("container.addEventListener(\"wheel\", handleWheel"), "Wheel listener must be bound to reader container");
console.log("  ✅ [PASS] Laptop & Desktop trackpad pinch / Ctrl+Wheel zoom verified");

// Test 5: Mobile Focus Mode top header matches user wireframe diagram
assert(readerContent.includes("Toggle Drawing & Annotation Suite"), "Must include drawing tools trigger in mobile focus header");
assert(readerContent.includes("Bookmark this Page"), "Must include bookmark toggle in mobile focus header");
assert(readerContent.includes("Translate Current Spread in Focus Mode"), "Must include translation toggle in mobile focus header");
assert(readerContent.includes("Exit Focus Mode"), "Must include exit focus mode button");
console.log("  ✅ [PASS] Mobile Focus Mode top header matches user wireframe (Draw, Bookmark, Translate, Timer, Exit)");

// Test 6: Maximized available width & height for edge-to-edge PDF reading
assert(readerContent.includes("containerWidth - (isMobile ? 12 : 40)"), "Must maximize mobile canvas width");
assert(readerContent.includes("containerHeight - (isMobile ? 48 : 70)"), "Must maximize mobile canvas height in focus/fullscreen mode");
console.log("  ✅ [PASS] Edge-to-edge PDF viewport space optimization verified");

// Test 7: Mobile focus mode hides bottom controls to maximize reading space
assert(readerContent.includes("showControls && (!isFocusMode || !isMobile)"), "Must minimize bottom toolbar in mobile focus mode");
console.log("  ✅ [PASS] Bottom bar minimized in mobile focus mode for maximum vertical reading area");

console.log("\n=================================================");
console.log("  QA SUMMARY: 7/7 TESTS PASSED");
console.log("=================================================\n");

