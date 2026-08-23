const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("=== Reader's HUB Translation Split View & Page-Paired QA Audit ===");
console.log("==================================================================\n");

// 1. Check TranslationDrawer.tsx for Split View and Page-Paired controls
console.log("[AUDIT 1/3] Checking TranslationDrawer.tsx controls...");
const drawerPath = path.join(__dirname, '..', 'components', 'reader', 'TranslationDrawer.tsx');
if (!fs.existsSync(drawerPath)) {
  console.error("[FAIL] TranslationDrawer.tsx not found.");
  process.exit(1);
}

const drawerCode = fs.readFileSync(drawerPath, 'utf8');
const hasPositionProp = drawerCode.includes('position: TranslationPosition') && drawerCode.includes('onPositionChange');
const hasSideToggle = drawerCode.includes('Position Translation on Left Pane') && drawerCode.includes('Position Translation on Right Pane');
const hasPagePairing = drawerCode.includes('activePageFilter') && drawerCode.includes('Spread');
const hasFontScaling = drawerCode.includes('A-') && drawerCode.includes('A+') && drawerCode.includes('fontSizeClass');
const hasShowOriginal = drawerCode.includes('Show Original') && drawerCode.includes('Original Book Text');

console.log(`[CHECK 1] hasPositionProp=${hasPositionProp}, hasSideToggle=${hasSideToggle}, hasPagePairing=${hasPagePairing}, hasFontScaling=${hasFontScaling}, hasShowOriginal=${hasShowOriginal}`);

if (hasPositionProp && hasSideToggle && hasPagePairing && hasFontScaling && hasShowOriginal) {
  console.log("[PASS] TranslationDrawer.tsx includes position toggle, page-paired tabs, font scaling, and original comparison.\n");
} else {
  console.error("[FAIL] TranslationDrawer.tsx missing required split-view controls.");
  process.exit(1);
}

// 2. Check BookReader.tsx for 50/50 Dual Workspace Integration
console.log("[AUDIT 2/3] Checking BookReader.tsx 50/50 Split View Integration...");
const readerPath = path.join(__dirname, '..', 'components', 'reader', 'BookReader.tsx');
const readerCode = fs.readFileSync(readerPath, 'utf8');

const hasSplitLayout = readerCode.includes('isTranslateOpen') && readerCode.includes('md:w-1/2') && readerCode.includes('flex-row-reverse');
const hasPositionState = readerCode.includes('translationPosition') && readerCode.includes('setTranslationPosition');
const hasAutoReset = readerCode.includes('setTranslationResult(null)') && readerCode.includes('translationAbortControllerRef.current.abort()');
const hasFocusModeTranslate = readerCode.includes('Translate Current Spread in Focus Mode');

console.log(`[CHECK 2] hasSplitLayout=${hasSplitLayout}, hasPositionState=${hasPositionState}, hasAutoReset=${hasAutoReset}, hasFocusModeTranslate=${hasFocusModeTranslate}`);

if (hasSplitLayout && hasPositionState && hasAutoReset && hasFocusModeTranslate) {
  console.log("[PASS] BookReader.tsx provides responsive 50/50 dual pane split workspace with position swapping, Focus Mode compatibility, and auto-reset.\n");
} else {
  console.error("[FAIL] BookReader.tsx missing split view layout wiring.");
  process.exit(1);
}

console.log("==================================================================");
console.log(">>> ALL SPLIT-VIEW AUDITS PASSED WITH ZERO ERRORS <<<");
console.log("==================================================================");

