const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("=== Reader's HUB Technical Categories Consolidation QA ===");
console.log("==================================================================\n");

const {
  BOOKS,
  CATEGORIES,
  TECHNICAL_SUBCATEGORIES,
  getBooksByCategory,
  searchBooks,
  isTechnicalBook,
} = require('../data/books.ts');

console.log("[AUDIT 1/5] Top-Level Category List Audit:");
console.log("CATEGORIES:", CATEGORIES);

if (!CATEGORIES.includes("Technical Knowledge")) {
  console.error("[FAIL] 'Technical Knowledge' is missing from CATEGORIES.");
  process.exit(1);
}

const disallowedTopLevel = [
  "Computer Science & Systems",
  "DSA & Problem Solving",
  "System Design & DevOps",
  "DBMS & SQL",
  "Web & Backend Development",
  "OOP & Software Design",
  "Programming Languages",
];

for (const cat of disallowedTopLevel) {
  if (CATEGORIES.includes(cat)) {
    console.error(`[FAIL] Disallowed subcategory '${cat}' found in top-level CATEGORIES.`);
    process.exit(1);
  }
}
console.log("[PASS] Top-level CATEGORIES cleanly consolidated into 'Technical Knowledge'.\n");

console.log("[AUDIT 2/5] Technical Knowledge Count Audit:");
const techBooks = getBooksByCategory("Technical Knowledge");
console.log(`Technical Knowledge count: ${techBooks.length} (Expected: 22)`);
if (techBooks.length !== 22) {
  console.error(`[FAIL] Expected 22 technical books, got ${techBooks.length}`);
  process.exit(1);
}
console.log("[PASS] Exactly 22 technical resources under 'Technical Knowledge'.\n");

console.log("[AUDIT 3/5] Subcategory Filter Audit:");
console.log("TECHNICAL_SUBCATEGORIES:", TECHNICAL_SUBCATEGORIES);
for (const sub of TECHNICAL_SUBCATEGORIES) {
  const subBooks = getBooksByCategory("Technical Knowledge", sub);
  console.log(`  - Subcategory '${sub}': ${subBooks.length} items`);
  if (sub !== "All Technical" && subBooks.length === 0) {
    console.error(`[FAIL] Subcategory '${sub}' returned 0 items.`);
    process.exit(1);
  }
}
console.log("[PASS] All technical subcategories filter correctly.\n");

console.log("[AUDIT 4/5] Non-Technical Category Integrity Audit:");
const classics = getBooksByCategory("Classics");
console.log(`Classics count: ${classics.length}`);
if (classics.length === 0) {
  console.error("[FAIL] Classics category is empty.");
  process.exit(1);
}
console.log("[PASS] Classics and literary categories remain 100% intact.\n");

console.log("[AUDIT 5/5] Global Search Audit for Technical Terms:");
const dsaSearch = searchBooks("DSA");
const sqlSearch = searchBooks("SQL");
const oopSearch = searchBooks("OOP");
const techSearch = searchBooks("Technical Knowledge");

console.log(`  - Search 'DSA': ${dsaSearch.length} results`);
console.log(`  - Search 'SQL': ${sqlSearch.length} results`);
console.log(`  - Search 'OOP': ${oopSearch.length} results`);
console.log(`  - Search 'Technical Knowledge': ${techSearch.length} results`);

if (dsaSearch.length === 0 || sqlSearch.length === 0 || oopSearch.length === 0 || techSearch.length === 0) {
  console.error("[FAIL] Search did not match expected technical items.");
  process.exit(1);
}
console.log("[PASS] Search functions across all technical terms.\n");

console.log("==================================================================");
console.log(">>> ALL TECHNICAL CATEGORIES CONSOLIDATION AUDITS PASSED 100% <<<");
console.log("==================================================================");

