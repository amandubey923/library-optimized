import fs from "fs";
import path from "path";
import { Book } from "../../data/books";
import { IngestCandidate } from "./types";

export interface WriteResult {
  success: boolean;
  countBefore: number;
  countAfter: number;
  addedCount: number;
  error?: string;
}

export function safeWriteCatalog(
  booksJsonPath: string,
  baselineBooks: Book[],
  newCandidates: IngestCandidate[]
): WriteResult {
  const countBefore = baselineBooks.length;

  // Filter out any candidates that are invalid, duplicates, or need review
  const validCandidates = newCandidates.filter(
    (c) => !c.isDuplicate && !c.isInvalid && !c.needsReview && c.bookEntry
  );

  if (validCandidates.length === 0) {
    return {
      success: true,
      countBefore,
      countAfter: countBefore,
      addedCount: 0,
    };
  }

  // Safety check 1: Baseline IDs must not collide
  const existingIdSet = new Set(baselineBooks.map((b) => b.id));
  const newBookEntries: Book[] = [];

  for (const cand of validCandidates) {
    const entry = cand.bookEntry!;
    if (existingIdSet.has(entry.id)) {
      return {
        success: false,
        countBefore,
        countAfter: countBefore,
        addedCount: 0,
        error: `ID collision detected for [${entry.id}]. Write aborted.`,
      };
    }
    existingIdSet.add(entry.id);
    newBookEntries.push(entry);
  }

  const finalCatalog = [...baselineBooks, ...newBookEntries];

  // Safety check 2: Atomic write via temporary file
  const tmpPath = `${booksJsonPath}.tmp`;
  try {
    const jsonString = JSON.stringify(finalCatalog, null, 2);
    fs.writeFileSync(tmpPath, jsonString, "utf-8");

    // Verify temp file can be parsed back
    const parsedBack = JSON.parse(fs.readFileSync(tmpPath, "utf-8"));
    if (!Array.isArray(parsedBack) || parsedBack.length !== finalCatalog.length) {
      throw new Error("Integrity check failed on temporary catalog file");
    }

    // Atomic rename (with Windows EPERM fallback)
    try {
      fs.renameSync(tmpPath, booksJsonPath);
    } catch {
      fs.copyFileSync(tmpPath, booksJsonPath);
      fs.unlinkSync(tmpPath);
    }

    return {
      success: true,
      countBefore,
      countAfter: finalCatalog.length,
      addedCount: newBookEntries.length,
    };
  } catch (err: any) {
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {}
    }
    return {
      success: false,
      countBefore,
      countAfter: countBefore,
      addedCount: 0,
      error: `Failed to write catalog: ${err.message}`,
    };
  }
}

