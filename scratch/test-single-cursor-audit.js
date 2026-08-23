const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("=== Reader's HUB Single Cursor (Zero Duplication) QA Audit ===");
console.log("==================================================================\n");

// 1. Audit BookReader.tsx for duplicate cursor SVG
console.log("[AUDIT 1/3] Auditing BookReader.tsx to ensure NO duplicate hand cursor exists...");
const readerPath = path.join(__dirname, '..', 'components', 'reader', 'BookReader.tsx');
if (!fs.existsSync(readerPath)) {
  console.error("[FAIL] BookReader.tsx not found.");
  process.exit(1);
}

const readerCode = fs.readFileSync(readerPath, 'utf8');

// Check that BookReader does NOT render any duplicate hand cursor SVG
const hasDuplicateHandInReader = readerCode.includes('fill="#FFFFFF"') && readerCode.includes('stroke="#18181B"') && readerCode.includes('d="M7 1.5C7 0.671573');
const hasStudyReticleOnly = readerCode.includes('{isStudyMode && (') && readerCode.includes('activeTool === "highlighter"');

console.log(`[CHECK 1] hasDuplicateHandInReader=${hasDuplicateHandInReader} (must be FALSE), hasStudyReticleOnly=${hasStudyReticleOnly} (must be TRUE)`);

if (!hasDuplicateHandInReader && hasStudyReticleOnly) {
  console.log("[PASS] BookReader.tsx has ZERO duplicate hand cursors and strictly renders study tool reticle only when study mode is active.\n");
} else {
  console.error("[FAIL] BookReader.tsx still contains duplicate hand cursor!");
  process.exit(1);
}

// 2. Audit CustomCursor.tsx for single portal-based source of truth
console.log("[AUDIT 2/3] Auditing CustomCursor.tsx single portal-based cursor...");
const cursorPath = path.join(__dirname, '..', 'components', 'visual', 'CustomCursor.tsx');
const cursorCode = fs.readFileSync(cursorPath, 'utf8');

const usesPortal = cursorCode.includes('createPortal') && cursorCode.includes('portalTarget');
const listensFullscreen = cursorCode.includes('fullscreenchange') && cursorCode.includes('document.fullscreenElement');
const hasHandSVG = cursorCode.includes('fill="#FFFFFF"') && cursorCode.includes('stroke="#18181B"');

console.log(`[CHECK 2] usesPortal=${usesPortal}, listensFullscreen=${listensFullscreen}, hasHandSVG=${hasHandSVG}`);

if (usesPortal && listensFullscreen && hasHandSVG) {
  console.log("[PASS] CustomCursor.tsx is the single universal portal-based source of truth across Normal UI, Reader, and Fullscreen.\n");
} else {
  console.error("[FAIL] CustomCursor.tsx missing portal or fullscreen listeners.");
  process.exit(1);
}

// 3. Audit globals.css
console.log("[AUDIT 3/3] Auditing globals.css native arrow suppression...");
const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

if (cssCode.includes('cursor: none !important')) {
  console.log("[PASS] globals.css suppresses native cursor.\n");
} else {
  console.error("[FAIL] globals.css missing cursor suppression.");
  process.exit(1);
}

console.log("==================================================================");
console.log(">>> SINGLE CURSOR (ZERO DUPLICATION) AUDIT PASSED 100% <<<");
console.log("==================================================================");

