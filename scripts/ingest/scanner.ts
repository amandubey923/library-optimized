import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Book } from "../../data/books";

export interface CatalogIndex {
  existingBooks: Book[];
  idSet: Set<string>;
  hashSet: Set<string>;
  hashToBookMap: Map<string, Book>;
  pdfFilenameSet: Set<string>;
  pdfPathToBookMap: Map<string, Book>;
}

export function loadCatalogIndex(booksJsonPath: string): CatalogIndex {
  let existingBooks: Book[] = [];
  if (fs.existsSync(booksJsonPath)) {
    try {
      existingBooks = JSON.parse(fs.readFileSync(booksJsonPath, "utf-8"));
    } catch {
      existingBooks = [];
    }
  }

  const idSet = new Set<string>();
  const hashSet = new Set<string>();
  const hashToBookMap = new Map<string, Book>();
  const pdfFilenameSet = new Set<string>();
  const pdfPathToBookMap = new Map<string, Book>();

  for (const book of existingBooks) {
    if (book.id) idSet.add(book.id);
    if (book.fileHash) {
      hashSet.add(book.fileHash);
      hashToBookMap.set(book.fileHash, book);
    }
    if (book.pdf) {
      const filename = path.basename(book.pdf);
      pdfFilenameSet.add(filename.toLowerCase());
      pdfPathToBookMap.set(book.pdf.toLowerCase(), book);
      pdfPathToBookMap.set(`/pdfs/${filename}`.toLowerCase(), book);
    }
  }

  return {
    existingBooks,
    idSet,
    hashSet,
    hashToBookMap,
    pdfFilenameSet,
    pdfPathToBookMap,
  };
}

export interface UnindexedFile {
  filename: string;
  fullPath: string;
  sizeBytes: number;
  fileHash: string;
}

export function scanDeltaPdfs(pdfDir: string, index: CatalogIndex): UnindexedFile[] {
  if (!fs.existsSync(pdfDir)) {
    return [];
  }

  const allFiles = fs
    .readdirSync(pdfDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf") && !f.startsWith("."));

  const unindexed: UnindexedFile[] = [];

  for (const filename of allFiles) {
    const fullPath = path.join(pdfDir, filename);
    const stats = fs.statSync(fullPath);

    // If filename is directly known in books.json, skip reading hash
    if (index.pdfFilenameSet.has(filename.toLowerCase())) {
      continue;
    }

    // Otherwise calculate hash to check if it's an unindexed candidate or duplicate
    const buffer = fs.readFileSync(fullPath);
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    unindexed.push({
      filename,
      fullPath,
      sizeBytes: stats.size,
      fileHash,
    });
  }

  return unindexed;
}

