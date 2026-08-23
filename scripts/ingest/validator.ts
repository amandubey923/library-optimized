import fs from "fs";
import path from "path";
import { Book, CATEGORIES, isTechnicalBook } from "../../data/books";

export interface ValidationSummary {
  isValid: boolean;
  totalBooks: number;
  duplicateIds: string[];
  missingPdfs: string[];
  missingCovers: string[];
  invalidCategories: string[];
}

export function validateCatalog(booksJsonPath: string, publicDir: string): ValidationSummary {
  if (!fs.existsSync(booksJsonPath)) {
    return {
      isValid: false,
      totalBooks: 0,
      duplicateIds: [],
      missingPdfs: ["books.json not found"],
      missingCovers: [],
      invalidCategories: [],
    };
  }

  const books: Book[] = JSON.parse(fs.readFileSync(booksJsonPath, "utf-8"));
  const idSet = new Set<string>();
  const duplicateIds: string[] = [];
  const missingPdfs: string[] = [];
  const missingCovers: string[] = [];
  const invalidCategories: string[] = [];

  const allowedCategories = new Set<string>(CATEGORIES);

  for (const book of books) {
    // 1. ID Uniqueness
    if (idSet.has(book.id)) {
      duplicateIds.push(book.id);
    }
    idSet.add(book.id);

    // 2. PDF Existence
    const pdfRel = (book.pdf || "").replace(/^\//, "");
    const pdfFull = path.join(publicDir, pdfRel);
    if (!fs.existsSync(pdfFull)) {
      missingPdfs.push(`[${book.id}] -> ${book.pdf}`);
    }

    // 3. Cover Existence
    const coverRel = (book.cover || "").replace(/^\//, "");
    const coverFull = path.join(publicDir, coverRel);
    if (!fs.existsSync(coverFull)) {
      missingCovers.push(`[${book.id}] -> ${book.cover}`);
    }

    // 4. Category Check
    if (!allowedCategories.has(book.category) && !isTechnicalBook(book)) {
      invalidCategories.push(`[${book.id}] -> ${book.category}`);
    }
  }

  const isValid =
    duplicateIds.length === 0 &&
    missingPdfs.length === 0 &&
    missingCovers.length === 0 &&
    invalidCategories.length === 0;

  return {
    isValid,
    totalBooks: books.length,
    duplicateIds,
    missingPdfs,
    missingCovers,
    invalidCategories,
  };
}

