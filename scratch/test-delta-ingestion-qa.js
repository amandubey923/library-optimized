const fs = require("fs");
const path = require("path");
const assert = require("assert");

const { loadCatalogIndex, scanDeltaPdfs } = require("../scripts/ingest/scanner");
const { resolveCanonicalFilename, generateStableId, toPascalCase } = require("../scripts/ingest/naming");
const { getCoverPalette } = require("../scripts/ingest/covers");
const { validateCatalog } = require("../scripts/ingest/validator");

const BOOKS_JSON_PATH = path.join(__dirname, "../data/books.json");
const PUBLIC_DIR = path.join(__dirname, "../public");
const PDF_DIR = path.join(__dirname, "../public/pdfs");

console.log("==================================================");
console.log("🧪 TESTING DELTA INGESTION ENGINE MODULES");
console.log("==================================================\n");

function runTests() {
  // Test 1: Naming & PascalCase formatting
  console.log("Test 1: Naming & PascalCase Resolution");
  assert.strictEqual(toPascalCase("system design notes (1).pdf"), "SystemDesignNotes");
  assert.strictEqual(toPascalCase("sql 100 imp interview qs.pdf"), "SQL100ImpInterviewQs");
  assert.strictEqual(toPascalCase("python_handwritten_final.pdf"), "PythonHandwritten");
  assert.strictEqual(
    resolveCanonicalFilename("anand ki khoj.pdf", "Anand Ki Khoj (आनंद की खोज)", "Osho", true),
    "AnandKiKhojByOsho.pdf"
  );
  assert.strictEqual(
    resolveCanonicalFilename("AnandKiKhojByOsho.pdf", "Anand Ki Khoj", "Osho", true),
    "AnandKiKhojByOsho.pdf"
  );
  assert.strictEqual(generateStableId("Anand Ki Khoj (आनंद की खोज)"), "anand-ki-khoj");
  console.log("✅ Test 1 Passed: Naming, PascalCase, and Osho naming rules verified.\n");

  // Test 2: Cover Palettes
  console.log("Test 2: Cover Palette Resolution");
  const oshoPal = getCoverPalette("Philosophy & Spirituality", true, "Book");
  assert.strictEqual(oshoPal.emblem, "🪔");
  assert.strictEqual(oshoPal.badge, "SPIRITUAL DISCOURSE");

  const techNotesPal = getCoverPalette("Technical Knowledge", false, "HandwrittenNotes");
  assert.strictEqual(techNotesPal.emblem, "✍️");
  assert.strictEqual(techNotesPal.badge, "HANDWRITTEN NOTES");

  const techCheatPal = getCoverPalette("Technical Knowledge", false, "CheatSheet");
  assert.strictEqual(techCheatPal.emblem, "⚡");
  assert.strictEqual(techCheatPal.badge, "QUICK CHEAT SHEET");
  console.log("✅ Test 2 Passed: Cover palettes accurately map to resource types and categories.\n");

  // Test 3: Catalog Indexation & Delta Scanner
  console.log("Test 3: Catalog Indexation & Delta Scanner");
  const index = loadCatalogIndex(BOOKS_JSON_PATH);
  assert.strictEqual(index.existingBooks.length, 169, "Must load exactly 169 baseline books");
  assert(index.idSet.has("1984"), "ID set must contain baseline book");
  assert(index.idSet.has("aankhon-dekhi-sanch"), "ID set must contain newly added Osho book");

  const unindexed = scanDeltaPdfs(PDF_DIR, index);
  console.log(`Discovered unindexed delta files: ${unindexed.length}`);
  // Should discover the 3 unindexed files (CrimeAndPunishment, meditations, siddhartha)
  assert.strictEqual(unindexed.length, 3, "Only the 3 unindexed files should be in the delta");
  console.log("✅ Test 3 Passed: Catalog indexation and delta detection verified.\n");

  // Test 4: Validator
  console.log("Test 4: Catalog Validator");
  const val = validateCatalog(BOOKS_JSON_PATH, PUBLIC_DIR);
  assert.strictEqual(val.isValid, true, "Current catalog must be 100% valid");
  assert.strictEqual(val.duplicateIds.length, 0, "No duplicate IDs");
  assert.strictEqual(val.missingPdfs.length, 0, "No missing PDFs");
  assert.strictEqual(val.missingCovers.length, 0, "No missing covers");
  console.log("✅ Test 4 Passed: 169-book catalog passed all validator checks.\n");

  console.log("🎉 ALL DELTA INGESTION UNIT TESTS PASSED SUCCESSFULLY 100%!");
}

runTests();

