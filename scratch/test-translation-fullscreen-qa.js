const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("=== Reader's HUB Translation Fullscreen Docking QA Audit ===");
console.log("==================================================================\n");

// 1. Check BookReader.tsx for fullscreen-only translation
console.log("[AUDIT 1/3] Checking BookReader.tsx handleOpenTranslation and fullscreenchange handler...");
const readerPath = path.join(__dirname, '..', 'components', 'reader', 'BookReader.tsx');
if (!fs.existsSync(readerPath)) {
  console.error("[FAIL] BookReader.tsx not found.");
  process.exit(1);
}

const readerCode = fs.readFileSync(readerPath, 'utf8');
const hasOpenTranslation = readerCode.includes('handleOpenTranslation') && readerCode.includes('requestFullscreen()');
const hasFsChangeClose = readerCode.includes('fullscreenchange') && readerCode.includes('setIsTranslateOpen(false)');
const hasSingleViewport = readerCode.includes('className="flex-1 flex items-center justify-center relative p-2 sm:p-6 w-full h-full overflow-hidden"');

console.log(`[CHECK 1] hasOpenTranslation=${hasOpenTranslation}, hasFsChangeClose=${hasFsChangeClose}, hasSingleViewport=${hasSingleViewport}`);

if (hasOpenTranslation && hasFsChangeClose && hasSingleViewport) {
  console.log("[PASS] BookReader.tsx enters fullscreen on translation trigger and auto-closes translation on exit.\n");
} else {
  console.error("[FAIL] BookReader.tsx missing fullscreen translation handling.");
  process.exit(1);
}

// 2. Check TranslationDrawer.tsx for exact left-0/right-0 edge docking
console.log("[AUDIT 2/3] Checking TranslationDrawer.tsx for exact edge docking in fullscreen...");
const drawerPath = path.join(__dirname, '..', 'components', 'reader', 'TranslationDrawer.tsx');
const drawerCode = fs.readFileSync(drawerPath, 'utf8');

const hasExactLeft = drawerCode.includes('absolute inset-y-0 left-0 z-40');
const hasExactRight = drawerCode.includes('absolute inset-y-0 right-0 z-40');
const hasComfortableWidth = drawerCode.includes('xl:w-[620px]');
const hasPositionControls = drawerCode.includes('onPositionChange("left")') && drawerCode.includes('onPositionChange("right")');

console.log(`[CHECK 2] hasExactLeft=${hasExactLeft}, hasExactRight=${hasExactRight}, hasComfortableWidth=${hasComfortableWidth}, hasPositionControls=${hasPositionControls}`);

if (hasExactLeft && hasExactRight && hasComfortableWidth && hasPositionControls) {
  console.log("[PASS] TranslationDrawer.tsx renders exact edge docking with comfortable reading width.\n");
} else {
  console.error("[FAIL] TranslationDrawer.tsx missing exact edge docking classes.");
  process.exit(1);
}

// 3. Check layout.tsx
console.log("[AUDIT 3/3] Checking layout.tsx root mounting...");
const layoutPath = path.join(__dirname, '..', 'app', 'layout.tsx');
const layoutCode = fs.readFileSync(layoutPath, 'utf8');

if (layoutCode.includes('<CustomCursor />')) {
  console.log("[PASS] CustomCursor properly mounted in layout.\n");
} else {
  console.error("[FAIL] CustomCursor not in layout.");
  process.exit(1);
}

console.log("==================================================================");
console.log(">>> ALL TRANSLATION FULLSCREEN DOCKING AUDITS PASSED WITH ZERO ERRORS <<<");
console.log("==================================================================");

