const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const pdfsDir = path.join(__dirname, "../public/pdfs");
const booksJsonPath = path.join(__dirname, "../data/books.json");

async function auditDetails() {
  const catalog = JSON.parse(fs.readFileSync(booksJsonPath, "utf8"));
  const unindexed = JSON.parse(fs.readFileSync(path.join(__dirname, "unindexed-pdfs-report.json"), "utf8"));

  console.log("==================================================");
  console.log("🔍 PHASE 2 & 3: DETAILED AUDIT & DUPLICATE DETECTION");
  console.log("==================================================\n");

  for (const item of unindexed) {
    const fullPath = path.join(pdfsDir, item.filename);
    const stats = fs.statSync(fullPath);

    // Check if filename or title matches anything in catalog
    const exactPdfMatch = catalog.find((b) => path.basename(b.pdf || "").toLowerCase() === item.filename.toLowerCase());
    const titleMatch = catalog.find((b) => b.title.toLowerCase().includes(item.filename.replace(/\.pdf$/i, "").toLowerCase()));

    console.log(`--- [${item.index}/27] ${item.filename} ---`);
    console.log(`  Size: ${item.sizeMB} MB | Pages: ${item.pageCount}`);

    if (exactPdfMatch) {
      console.log(`  ⚠️ EXACT PDF MATCH IN CATALOG: [${exactPdfMatch.id}] "${exactPdfMatch.title}"`);
    }
    if (titleMatch) {
      console.log(`  ℹ️ Similar Title in Catalog: [${titleMatch.id}] "${titleMatch.title}" (PDF: ${titleMatch.pdf})`);
    }

    if (item.sizeBytes < 1000) {
      console.log(`  ❌ CRITICAL: File is practically empty (< 1KB). Likely placeholder dummy.`);
    }

    // Try reading text from first 2 pages
    try {
      const buffer = fs.readFileSync(fullPath);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pagesCount = pdfDoc.getPageCount();
      console.log(`  Verified Pages: ${pagesCount}`);
    } catch (e) {
      console.log(`  ❌ Load error: ${e.message}`);
    }
    console.log("");
  }
}

auditDetails().catch(console.error);

