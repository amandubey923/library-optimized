import fs from "fs";
import path from "path";
import { loadCatalogIndex, scanDeltaPdfs } from "./ingest/scanner";
import { resolveCanonicalFilename, generateStableId } from "./ingest/naming";
import { extractPdfMetadata } from "./ingest/metadata";
import { generateBookCover } from "./ingest/covers";
import { safeWriteCatalog } from "./ingest/writer";
import { validateCatalog } from "./ingest/validator";
import { IngestCandidate, IngestReport } from "./ingest/types";
import { Book } from "../data/books";

const PROJECT_ROOT = process.cwd();
const PDF_DIR = path.join(PROJECT_ROOT, "public", "pdfs");
const COVERS_DIR = path.join(PROJECT_ROOT, "public", "images", "books");
const BOOKS_JSON_PATH = path.join(PROJECT_ROOT, "data", "books.json");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

export async function runIngestBatch(options: { dryRun?: boolean; noRename?: boolean; verbose?: boolean } = {}) {
  const isDryRun = Boolean(options.dryRun);
  const noRename = Boolean(options.noRename);
  const isVerbose = Boolean(options.verbose);

  console.log("\n=======================================================");
  console.log("  📚 READER'S HUB — DELTA PDF INGESTION ENGINE");
  if (isDryRun) {
    console.log("  🔍 MODE: DRY-RUN (No files or catalog will be modified)");
  } else {
    console.log("  🚀 MODE: LIVE INGESTION");
  }
  console.log("=======================================================\n");

  // Step 1: Index current catalog
  const index = loadCatalogIndex(BOOKS_JSON_PATH);
  const catalogBefore = index.existingBooks.length;
  console.log(`📌 Loaded ${catalogBefore} existing books from catalog.`);

  // Step 2: Scan for unindexed delta files
  const unindexedFiles = scanDeltaPdfs(PDF_DIR, index);
  console.log(`🔍 Discovered ${unindexedFiles.length} unindexed PDF file(s) in public/pdfs/\n`);

  if (unindexedFiles.length === 0) {
    console.log("✅ Catalog is already 100% up to date. No new PDFs to ingest!");
    return {
      detected: 0,
      added: [],
      duplicates: [],
      invalid: [],
      needsReview: [],
      renamed: [],
      coversGenerated: 0,
      catalogBefore,
      catalogAfter: catalogBefore,
      isDryRun,
    };
  }

  // Step 3: Analyze and plan candidates
  const report: IngestReport = {
    detected: unindexedFiles.length,
    added: [],
    duplicates: [],
    invalid: [],
    needsReview: [],
    renamed: [],
    coversGenerated: 0,
    catalogBefore,
    catalogAfter: catalogBefore,
    isDryRun,
  };

  const candidates: IngestCandidate[] = [];

  for (let i = 0; i < unindexedFiles.length; i++) {
    const unindexed = unindexedFiles[i];
    const originalFilename = unindexed.filename;
    const originalPath = unindexed.fullPath;
    const fileHash = unindexed.fileHash;
    const sizeBytes = unindexed.sizeBytes;
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);

    // Check duplicate by hash
    if (index.hashSet.has(fileHash)) {
      const existingMatch = index.hashToBookMap.get(fileHash);
      const cand: IngestCandidate = {
        originalFilename,
        originalPath,
        proposedFilename: originalFilename,
        proposedPath: originalPath,
        fileHash,
        sizeBytes,
        sizeMB,
        pageCount: 0,
        isDuplicate: true,
        duplicateOf: existingMatch ? `[${existingMatch.id}] ${existingMatch.title}` : "Existing catalog entry",
        isInvalid: false,
        needsReview: false,
        isRenamed: false,
        id: "",
        title: originalFilename,
        author: "",
        category: "",
        resourceType: "Book",
        language: "English",
        year: 2026,
        rating: 4.8,
        description: "",
        excerpt: "",
        tags: [],
        coverName: "",
        coverPath: "",
        coverRelativeUrl: "",
      };
      report.duplicates.push(cand);
      console.log(`[${i + 1}/${unindexedFiles.length}] ⏭️ SKIPPED DUPLICATE: "${originalFilename}" (matches ${cand.duplicateOf})`);
      continue;
    }

    // Extract metadata & validate
    const meta = await extractPdfMetadata(originalPath, originalFilename);

    // Check duplicate by title & author against existing catalog
    const normTitle = meta.title.toLowerCase().replace(/\(.*?\)/g, "").trim();
    const existingTitleMatch = index.existingBooks.find((b) => {
      const bNorm = b.title.toLowerCase().replace(/\(.*?\)/g, "").trim();
      return bNorm === normTitle && bNorm.length > 3;
    });

    if (existingTitleMatch) {
      const cand: IngestCandidate = {
        originalFilename,
        originalPath,
        proposedFilename: originalFilename,
        proposedPath: originalPath,
        fileHash,
        sizeBytes,
        sizeMB,
        pageCount: meta.pageCount,
        isDuplicate: true,
        duplicateOf: `[${existingTitleMatch.id}] "${existingTitleMatch.title}" (PDF: ${existingTitleMatch.pdf})`,
        isInvalid: false,
        needsReview: false,
        isRenamed: false,
        id: "",
        title: meta.title,
        author: meta.author,
        category: meta.category,
        resourceType: meta.resourceType,
        language: meta.language,
        year: meta.year,
        rating: meta.rating,
        description: meta.description,
        excerpt: meta.excerpt,
        tags: meta.tags,
        coverName: "",
        coverPath: "",
        coverRelativeUrl: "",
      };
      report.duplicates.push(cand);
      console.log(`[${i + 1}/${unindexedFiles.length}] ⏭️ SKIPPED DUPLICATE: "${originalFilename}" (title matches ${cand.duplicateOf})`);
      continue;
    }

    if (meta.isInvalid) {
      const cand: IngestCandidate = {
        originalFilename,
        originalPath,
        proposedFilename: originalFilename,
        proposedPath: originalPath,
        fileHash,
        sizeBytes,
        sizeMB,
        pageCount: meta.pageCount,
        isDuplicate: false,
        isInvalid: true,
        invalidReason: meta.invalidReason,
        needsReview: false,
        isRenamed: false,
        id: "",
        title: meta.title,
        author: meta.author,
        category: meta.category,
        resourceType: meta.resourceType,
        language: meta.language,
        year: meta.year,
        rating: meta.rating,
        description: meta.description,
        excerpt: meta.excerpt,
        tags: meta.tags,
        coverName: "",
        coverPath: "",
        coverRelativeUrl: "",
      };
      report.invalid.push(cand);
      console.log(`[${i + 1}/${unindexedFiles.length}] ❌ SKIPPED INVALID: "${originalFilename}" (${meta.invalidReason})`);
      continue;
    }

    // Resolve naming
    const proposedFilename = noRename
      ? originalFilename
      : resolveCanonicalFilename(originalFilename, meta.title, meta.author, meta.isOsho);
    const proposedPath = path.join(PDF_DIR, proposedFilename);
    const isRenamed = proposedFilename !== originalFilename;

    if (isRenamed) {
      report.renamed.push({ from: originalFilename, to: proposedFilename });
    }

    // Generate unique stable ID
    let stableId = generateStableId(meta.title, meta.author);
    if (index.idSet.has(stableId)) {
      stableId = `${stableId}-${Date.now().toString().slice(-4)}`;
    }
    index.idSet.add(stableId);

    // Cover path
    const coverName = `${stableId}.webp`;
    const coverPath = path.join(COVERS_DIR, coverName);
    const coverRelativeUrl = `/images/books/${coverName}`;

    // Construct Book Entry
    const bookEntry: Book = {
      id: stableId,
      title: meta.title,
      author: meta.author,
      category: meta.category,
      resourceType: meta.resourceType,
      cover: coverRelativeUrl,
      pdf: `/pdfs/${proposedFilename}`,
      description: meta.description,
      year: meta.year,
      pages: meta.pageCount,
      language: meta.language,
      rating: meta.rating,
      featured: false,
      tags: meta.tags,
      excerpt: meta.excerpt,
      fileHash: fileHash,
    };

    const cand: IngestCandidate = {
      originalFilename,
      originalPath,
      proposedFilename,
      proposedPath,
      fileHash,
      sizeBytes,
      sizeMB,
      pageCount: meta.pageCount,
      isDuplicate: false,
      isInvalid: false,
      needsReview: meta.needsReview,
      isRenamed,
      id: stableId,
      title: meta.title,
      author: meta.author,
      category: meta.category,
      resourceType: meta.resourceType,
      language: meta.language,
      year: meta.year,
      rating: meta.rating,
      description: meta.description,
      excerpt: meta.excerpt,
      tags: meta.tags,
      coverName,
      coverPath,
      coverRelativeUrl,
      bookEntry,
    };

    candidates.push(cand);
    report.added.push(cand);

    console.log(`[${i + 1}/${unindexedFiles.length}] ✅ PREPARED: "${meta.title}"`);
    console.log(`    ID: ${stableId} | Category: ${meta.category} | Pages: ${meta.pageCount}`);
    if (isRenamed) {
      console.log(`    Rename: ${originalFilename} -> ${proposedFilename}`);
    }
  }

  // Step 4: Perform Live Ingestion (if not Dry Run)
  if (!isDryRun && candidates.length > 0) {
    console.log("\n⚡ Writing changes to disk & generating covers...");

    // 1. Rename files if needed
    for (const cand of candidates) {
      if (cand.isRenamed && fs.existsSync(cand.originalPath) && cand.originalPath !== cand.proposedPath) {
        fs.renameSync(cand.originalPath, cand.proposedPath);
      }
    }

    // 2. Generate covers
    for (const cand of candidates) {
      try {
        const coverSuccess = await generateBookCover(cand, cand.coverPath);
        if (coverSuccess) report.coversGenerated++;
      } catch (err: any) {
        console.warn(`⚠️ Cover generation error on [${cand.id}]:`, err.message);
      }
    }

    // 3. Atomically write to books.json
    const writeResult = safeWriteCatalog(BOOKS_JSON_PATH, index.existingBooks, candidates);
    if (!writeResult.success) {
      console.error(`\n❌ Ingestion Failed: ${writeResult.error}`);
      return report;
    }
    report.catalogAfter = writeResult.countAfter;

    // 4. Validate resulting catalog
    const val = validateCatalog(BOOKS_JSON_PATH, PUBLIC_DIR);
    if (!val.isValid) {
      console.error("\n❌ Catalog validation warning:", val);
    } else {
      console.log(`\n✅ Catalog validation passed 100%: ${val.totalBooks} books verified.`);
    }
  } else {
    report.catalogAfter = catalogBefore + candidates.length;
  }

  // Step 5: Print Summary Report
  console.log("\n=======================================================");
  console.log("  📊 READER'S HUB DELTA INGESTION SUMMARY REPORT");
  console.log("=======================================================");
  console.log(`  Detected:        ${report.detected}`);
  console.log(`  Added:           ${report.added.length}`);
  console.log(`  Duplicates:      ${report.duplicates.length}`);
  console.log(`  Invalid:         ${report.invalid.length}`);
  console.log(`  Needs Review:    ${report.needsReview.length}`);
  console.log(`  Renamed:         ${report.renamed.length}`);
  console.log(`  Covers Generated:${isDryRun ? " (Planned: " + report.added.length + ")" : " " + report.coversGenerated}`);
  console.log(`  Catalog Count:   ${report.catalogBefore} → ${report.catalogAfter}`);
  console.log("=======================================================\n");

  return report;
}

// CLI Execution Support
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const noRename = args.includes("--no-rename");
  const verbose = args.includes("--verbose");

  runIngestBatch({ dryRun, noRename, verbose }).catch((err) => {
    console.error("Fatal Ingestion Error:", err);
    process.exit(1);
  });
}
