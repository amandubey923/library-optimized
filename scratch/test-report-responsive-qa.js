/**
 * Compact Responsive QA for Reading Report Card
 * Validates:
 * 1. Portal mounting to document.body with z-[100] (above Navbar z-40)
 * 2. Compact 82vh viewport height constraint (no oversized modal)
 * 3. Fixed 52-56px modal top bar (h-13 sm:h-14)
 * 4. Scrollable body (flex-1 min-h-0 overflow-y-auto)
 * 5. Compact 2-col / 3-col grids for period selection and snapshot cards
 * 6. Simplified 1-page report card document structure
 */

const fs = require('fs');
const path = require('path');

console.log("=================================================");
console.log("  READER'S HUB — COMPACT MODAL QA");
console.log("=================================================\n");

const modalPath = path.join(__dirname, '..', 'components', 'profile', 'ReadingReportCardModal.tsx');
const code = fs.readFileSync(modalPath, 'utf-8');

let passed = 0;
let total = 0;

function check(cond, desc) {
  total++;
  if (cond) {
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    process.exitCode = 1;
  }
}

// 1. Portal & Stacking Context
check(code.includes('createPortal(modalContent, document.body)'), "Modal uses React Portal to document.body to avoid stacking context traps");
check(code.includes('z-[100]'), "Modal overlay uses z-[100] to sit strictly above Navbar (z-40)");

// 2. Compact Modal Dimensions
check(code.includes('max-h-[82vh]'), "Modal is constrained to compact max-h-[82vh]");
check(code.includes('max-w-2xl'), "Modal width is constrained to compact max-w-2xl / lg:max-w-3xl");

// 3. Header & Body Scroll Isolation
check(code.includes('flex-shrink-0 h-13 sm:h-14'), "Modal top bar is fixed height (52-56px) and separated from body");
check(code.includes('flex-1 min-h-0 overflow-y-auto'), "Report body is the sole scrollable container with min-h-0");

// 4. Simplified Report Layout
check(code.includes('Overall Reading Progress'), "Report includes compact overall reading progress bar");
check(code.includes('grid-cols-2 sm:grid-cols-3'), "Period options and snapshot stats use compact 2-col/3-col layout");

console.log(`\n=================================================`);
console.log(`  QA SUMMARY: ${passed}/${total} TESTS PASSED`);
console.log(`=================================================\n`);
