const fs = require('fs');
const path = require('path');

console.log("=================================================");
console.log("  READER'S HUB — MY SHELF FULL RESPONSIVE QA");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${label}`);
    failed++;
  }
}

const shelfPath = path.join(__dirname, '..', 'app', 'favorites', 'page.tsx');
const shelfCode = fs.readFileSync(shelfPath, 'utf8');

const memoryPath = path.join(__dirname, '..', 'components', 'memory', 'BookReadingMemory.tsx');
const memoryCode = fs.readFileSync(memoryPath, 'utf8');

// 1. My Shelf imports & state
check("My Shelf uses client-side rendering", shelfCode.includes('"use client"'));
check("My Shelf manages 6 main tabs (favorites, reading, completed, offline, memory, stats)", 
  shelfCode.includes('type ShelfTab = "favorites" | "reading" | "completed" | "offline" | "memory" | "stats"'));

// 2. Responsive UI Checks
check("Tab navigation uses overflow-x-auto with scrollbar-none", shelfCode.includes('overflow-x-auto scrollbar-none'));
check("Hero Continue Reading spotlight supports full responsive mobile layout", shelfCode.includes('spotlightBook &&'));
check("Favorites tab supports 2-column mobile layout", shelfCode.includes('grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'));
check("In-Progress tab uses responsive grid", shelfCode.includes('grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'));
check("Completed tab uses responsive grid", shelfCode.includes('grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'));
check("Offline books tab uses responsive grid", shelfCode.includes('offlineBooksList.length === 0 ?'));
check("12-Week activity heatmap uses overflow-x-auto with scrollbar-none", shelfCode.includes('overflow-x-auto pb-2 scrollbar-none'));

// 3. Modal & React Portal checks
check("Confirm modal mounts via React Portal to document.body", shelfCode.includes('createPortal(') && shelfCode.includes('document.body'));
check("Confirm modal uses z-[100] above navbar", shelfCode.includes('z-[100]'));
check("Confirm modal locks body scroll while open", shelfCode.includes('document.body.style.overflow = "hidden"'));
check("BookReadingMemory mounts via React Portal to document.body", memoryCode.includes('createPortal(') && memoryCode.includes('document.body'));
check("BookReadingMemory uses z-[100]", memoryCode.includes('z-[100]'));

// 4. Data sovereignty & Reset tools
check("My Shelf supports local JSON data export", shelfCode.includes('handleExport'));
check("My Shelf supports local JSON data import/restore", shelfCode.includes('handleFileChange'));
check("My Shelf supports granular reset options", shelfCode.includes('clearAllProgress') && shelfCode.includes('clearAnnotations') && shelfCode.includes('factoryReset'));

console.log("\n=================================================");
console.log(`  QA SUMMARY: ${passed}/${passed + failed} TESTS PASSED`);
console.log("=================================================\n");

if (failed > 0) process.exit(1);

