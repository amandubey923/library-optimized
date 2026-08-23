const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const pdfsDir = path.join(__dirname, "../public/pdfs");
const booksTsPath = path.join(__dirname, "../data/books.ts");
const booksJsonPath = path.join(__dirname, "../data/books.json");

async function scan() {
  console.log("==================================================");
  console.log("🔍 PHASE 1: DISCOVERING NEW PDF FILES IN public/pdfs");
  console.log("==================================================\n");

  const diskFiles = fs.readdirSync(pdfsDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`Total PDF files physically on disk: ${diskFiles.length}`);

  let catalog = [];
  if (fs.existsSync(booksJsonPath)) {
    catalog = JSON.parse(fs.readFileSync(booksJsonPath, "utf8"));
  } else {
    console.error("books.json not found!");
    return;
  }
  console.log(`Total entries in books.json: ${catalog.length}`);

  const catalogPdfFilenames = new Set(
    catalog.map((b) => path.basename(b.pdf || ""))
  );

  const unindexedFiles = diskFiles.filter((f) => !catalogPdfFilenames.has(f));
  const indexedFiles = diskFiles.filter((f) => catalogPdfFilenames.has(f));
  const missingFiles = catalog.filter((b) => !fs.existsSync(path.join(pdfsDir, path.basename(b.pdf || ""))));

  console.log(`Indexed files: ${indexedFiles.length}`);
  console.log(`Unindexed (NEW) files: ${unindexedFiles.length}`);
  console.log(`Catalog items missing on disk: ${missingFiles.length}\n`);

  if (missingFiles.length > 0) {
    console.log("⚠️ Missing files referenced in catalog:");
    missingFiles.forEach((m) => console.log(`  - [${m.id}] ${m.title} -> ${m.pdf}`));
  }

  if (unindexedFiles.length === 0) {
    console.log("✅ No unindexed PDF files found. Catalog is 100% synchronized with disk!");
    return;
  }

  console.log("--------------------------------------------------");
  console.log(`Found ${unindexedFiles.length} NEW Unindexed PDF Files:`);
  console.log("--------------------------------------------------\n");

  const unindexedDetails = [];

  for (let i = 0; i < unindexedFiles.length; i++) {
    const filename = unindexedFiles[i];
    const fullPath = path.join(pdfsDir, filename);
    const stats = fs.statSync(fullPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    let pageCount = "Unknown";
    let titleFromMeta = "";
    let authorFromMeta = "";
    let isEncrypted = false;
    let isCorrupted = false;

    try {
      const buffer = fs.readFileSync(fullPath);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount();
      titleFromMeta = pdfDoc.getTitle() || "";
      authorFromMeta = pdfDoc.getAuthor() || "";
    } catch (e) {
      isCorrupted = true;
      console.warn(`⚠️ Error reading PDF ${filename}:`, e.message);
    }

    const item = {
      index: i + 1,
      filename,
      sizeBytes: stats.size,
      sizeMB,
      pageCount,
      titleFromMeta,
      authorFromMeta,
      isCorrupted,
    };
    unindexedDetails.push(item);

    console.log(`${i + 1}. [${sizeMB} MB | ${pageCount} pgs] "${filename}"`);
    if (titleFromMeta) console.log(`   Meta Title: "${titleFromMeta}"`);
    if (authorFromMeta) console.log(`   Meta Author: "${authorFromMeta}"`);
  }

  fs.writeFileSync(
    path.join(__dirname, "unindexed-pdfs-report.json"),
    JSON.stringify(unindexedDetails, null, 2)
  );
  console.log(`\nSaved report to scratch/unindexed-pdfs-report.json`);
}

scan().catch(console.error);

