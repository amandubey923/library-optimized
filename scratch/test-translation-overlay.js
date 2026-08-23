const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("=== Reader's HUB Translation Docked Overlay QA Audit ===");
console.log("==================================================================\n");

// 1. Check BookReader.tsx viewport stability
console.log("[AUDIT 1/3] Checking BookReader.tsx viewport restoration and stability...");
const readerPath = path.join(__dirname, '..', 'components', 'reader', 'BookReader.tsx');
if (!fs.existsSync(readerPath)) {
  console.error("[FAIL] BookReader.tsx not found.");
  process.exit(1);
}

const readerCode = fs.readFileSync(readerPath, 'utf8');
const hasSingleViewport = readerCode.includes('className="flex-1 flex items-center justify-center relative p-2 sm:p-6 w-full h-full overflow-hidden"');
const hasDrawerMount = readerCode.includes('<TranslationDrawer') && readerCode.includes('position={translationPosition}') && readerCode.includes('onPositionChange={setTranslationPosition}');
const hasAutoReset = readerCode.includes('setTranslationResult(null)') && readerCode.includes('translationAbortControllerRef.current.abort()');

console.log(`[CHECK 1] hasSingleViewport=${hasSingleViewport}, hasDrawerMount=${hasDrawerMount}, hasAutoReset=${hasAutoReset}`);

if (hasSingleViewport && hasDrawerMount && hasAutoReset) {
  console.log("[PASS] BookReader.tsx maintains full-size, stable centered PDF viewport and mounts movable translation overlay.\n");
} else {
  console.error("[FAIL] BookReader.tsx viewport not properly restored.");
  process.exit(1);
}

// 2. Check TranslationDrawer.tsx docked overlay and controls
console.log("[AUDIT 2/3] Checking TranslationDrawer.tsx Left/Right docked overlay...");
const drawerPath = path.join(__dirname, '..', 'components', 'reader', 'TranslationDrawer.tsx');
if (!fs.existsSync(drawerPath)) {
  console.error("[FAIL] TranslationDrawer.tsx not found.");
  process.exit(1);
}

const drawerCode = fs.readFileSync(drawerPath, 'utf8');
const hasLeftDock = drawerCode.includes('sm:left-4');
const hasRightDock = drawerCode.includes('sm:right-4');
const hasLargerWidth = drawerCode.includes('lg:w-[560px]');
const hasPositionToggle = drawerCode.includes('onPositionChange("left")') && drawerCode.includes('onPositionChange("right")');
const hasLanguageSelector = drawerCode.includes('Hindi') && drawerCode.includes('Hinglish') && drawerCode.includes('English');

console.log(`[CHECK 2] hasLeftDock=${hasLeftDock}, hasRightDock=${hasRightDock}, hasLargerWidth=${hasLargerWidth}, hasPositionToggle=${hasPositionToggle}, hasLanguageSelector=${hasLanguageSelector}`);

if (hasLeftDock && hasRightDock && hasLargerWidth && hasPositionToggle && hasLanguageSelector) {
  console.log("[PASS] TranslationDrawer.tsx supports Left/Right overlay docking, expanded 560px reading width, and position controls.\n");
} else {
  console.error("[FAIL] TranslationDrawer.tsx missing docked overlay classes or position controls.");
  process.exit(1);
}

// 3. Check layout.tsx
console.log("[AUDIT 3/3] Checking layout.tsx root mounting...");
const layoutPath = path.join(__dirname, '..', 'app', 'layout.tsx');
const layoutCode = fs.readFileSync(layoutPath, 'utf8');

if (layoutCode.includes('<CustomCursor />')) {
  console.log("[PASS] CustomCursor properly mounted.\n");
} else {
  console.error("[FAIL] CustomCursor missing from layout.");
  process.exit(1);
}

console.log("==================================================================");
console.log(">>> ALL TRANSLATION OVERLAY AUDITS PASSED WITH ZERO ERRORS <<<");
console.log("==================================================================");

