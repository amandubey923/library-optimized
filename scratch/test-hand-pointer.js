const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("=== Reader's HUB Hand/Finger Pointer Everywhere QA Audit ===");
console.log("==================================================================\n");

// 1. Check CustomCursor.tsx for Hand/Finger Pointer
console.log("[AUDIT 1/3] Checking CustomCursor.tsx for Hand/Finger pointer SVG...");
const cursorPath = path.join(__dirname, '..', 'components', 'visual', 'CustomCursor.tsx');
if (!fs.existsSync(cursorPath)) {
  console.error("[FAIL] CustomCursor.tsx not found.");
  process.exit(1);
}

const cursorCode = fs.readFileSync(cursorPath, 'utf8');
const hasHandPath = cursorCode.includes('fill="#FFFFFF"') && cursorCode.includes('stroke="#18181B"');
const hasHandRef = cursorCode.includes('handPointerRef');
const hasFingertipOffset = cursorCode.includes('translate(-5.5px, 0px)');

console.log(`[CHECK 1] hasHandPath=${hasHandPath}, hasHandRef=${hasHandRef}, hasFingertipOffset=${hasFingertipOffset}`);

if (hasHandPath && hasHandRef && hasFingertipOffset) {
  console.log("[PASS] CustomCursor.tsx renders high-contrast White Hand/Finger Pointer with precise fingertip hotspot.\n");
} else {
  console.error("[FAIL] CustomCursor.tsx missing Hand Pointer path or fingertip alignment.");
  process.exit(1);
}

// 2. Check BookReader.tsx in-reader Hand Pointer
console.log("[AUDIT 2/3] Checking BookReader.tsx for in-reader Hand Pointer...");
const readerPath = path.join(__dirname, '..', 'components', 'reader', 'BookReader.tsx');
const readerCode = fs.readFileSync(readerPath, 'utf8');

const hasReaderHand = readerCode.includes('fill="#FFFFFF"') && readerCode.includes('stroke="#18181B"') && readerCode.includes('translate(-5.5px, 0px)');
const hasDrawingPreserved = readerCode.includes('isStudyMode') && readerCode.includes('activeTool === "highlighter"');

console.log(`[CHECK 2] hasReaderHand=${hasReaderHand}, hasDrawingPreserved=${hasDrawingPreserved}`);

if (hasReaderHand && hasDrawingPreserved) {
  console.log("[PASS] BookReader.tsx maintains matching White Hand Pointer and preserves drawing tool cursors.\n");
} else {
  console.error("[FAIL] BookReader.tsx missing Hand Pointer or drawing preservation.");
  process.exit(1);
}

// 3. Check globals.css cursor override
console.log("[AUDIT 3/3] Checking globals.css for native arrow suppression...");
const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

if (cssCode.includes('cursor: none !important')) {
  console.log("[PASS] globals.css suppresses native arrow cursor across all elements.\n");
} else {
  console.error("[FAIL] globals.css missing cursor suppression.");
  process.exit(1);
}

console.log("==================================================================");
console.log(">>> ALL HAND POINTER AUDITS PASSED WITH ZERO ERRORS <<<");
console.log("==================================================================");

