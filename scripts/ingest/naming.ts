import path from "path";

/**
 * Converts any dirty filename string to clean PascalCase.
 */
export function toPascalCase(str: string): string {
  // Strip extension
  let clean = str.replace(/\.pdf$/i, "");

  // Remove common dirty patterns: (1), (2), [1], _final, _v2, %20, etc.
  clean = clean.replace(/\(\d+\)/g, "");
  clean = clean.replace(/\[\d+\]/g, "");
  clean = clean.replace(/[_\-.]+/g, " ");
  clean = clean.replace(/(\bfinal\b|\bnew\b|\bdownload\b|\bv\d+\b|\bcomplete\b)/gi, "");
  clean = clean.replace(/[^\w\s\u0900-\u097F]/g, ""); // Keep alphanumeric and Hindi characters

  // Title case words
  const words = clean
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      // If already uppercase acronym (DSA, SQL, OOP, CSS, HTML, OS, API, DBMS), preserve it
      if (/^(DSA|SQL|OOP|OOPS|CSS|HTML|OS|API|DBMS|JS|UI|UX|REST|JSON)$/i.test(w)) {
        return w.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

  let result = words.join("");
  if (!result) result = "UntitledDocument";
  return result;
}

/**
 * Resolves the canonical PDF filename.
 */
export function resolveCanonicalFilename(
  currentFilename: string,
  title: string,
  author: string,
  isOsho: boolean
): string {
  // Check if filename is already clean PascalCase ending in ByOsho.pdf or clean name
  const currentBase = currentFilename.replace(/\.pdf$/i, "");
  const isAlreadyPascal = /^[A-Z0-9][a-zA-Z0-9]*$/.test(currentBase);

  if (isOsho) {
    if (currentBase.endsWith("ByOsho") && isAlreadyPascal) {
      return currentFilename; // Already canonical
    }

    // Strip "ByOsho" or "Osho" if already in title
    let baseTitle = title.replace(/\(.*?\)/g, "").trim(); // Strip Devanagari parenthesis for filename
    baseTitle = baseTitle.replace(/by\s+osho/gi, "").replace(/osho/gi, "").trim();
    const pascal = toPascalCase(baseTitle || currentBase);
    return `${pascal}ByOsho.pdf`;
  }

  // Generic Non-Osho PascalCase
  if (isAlreadyPascal && !currentBase.includes(" ") && !currentBase.includes("_")) {
    return currentFilename;
  }

  const baseTitle = title.replace(/\(.*?\)/g, "").trim();
  const pascal = toPascalCase(baseTitle || currentBase);
  return `${pascal}.pdf`;
}

/**
 * Deterministic Slug generator for stable IDs.
 */
export function generateStableId(title: string, author?: string): string {
  // Strip Devanagari parentheses for English slug
  let clean = title.replace(/\(.*?\)/g, " ").trim();
  clean = clean
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  if (!clean) {
    clean = `book-${Date.now()}`;
  }

  return clean;
}

