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

  // Clean special book mappings
  if (/kurukshetra/i.test(currentBase) || /kurukshetra/i.test(title)) {
    return "KurukshetraByRamdhariSinghDinkar.pdf";
  }
  if (/tyag.*patra/i.test(currentBase) || /tyagpatra/i.test(title)) {
    return "Tyagpatra.pdf";
  }
  if (/sekhar|shekhar/i.test(currentBase) || /shekhar/i.test(title)) {
    return "ShekharEkJeevaniVividhAayam.pdf";
  }
  if (/clean.*architecture.*realms/i.test(currentBase) || /clean.*architecture.*z/i.test(currentBase)) {
    return "CleanArchitectureBeginnersGuide.pdf";
  }
  if (/clean.*architecture.*principles/i.test(currentBase) || /clean.*architecture.*understand/i.test(currentBase)) {
    return "CleanArchitecturePrinciplesAndPatterns.pdf";
  }
  if (/pragmatic.*programmer/i.test(currentBase) || /pragmatic.*programmer/i.test(title)) {
    return "ThePragmaticProgrammer.pdf";
  }
  if (/refactoring/i.test(currentBase) || /refactoring/i.test(title)) {
    return "RefactoringImprovingTheDesignOfExistingCode.pdf";
  }
  if (/me.*before.*you/i.test(currentBase) || /me.*before.*you/i.test(title)) {
    return "MeBeforeYou.pdf";
  }
  if (/the.*notebook/i.test(currentBase) || /the.*notebook/i.test(title)) {
    return "TheNotebook.pdf";
  }
  if (/time.*traveler/i.test(currentBase) || /time.*traveler/i.test(title)) {
    return "TheTimeTravelersWife.pdf";
  }
  if (/jane.*eyre/i.test(currentBase) || /jane.*eyre/i.test(title)) {
    return "JaneEyre.pdf";
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
  // Specific slug mappings for canonical IDs
  if (/kurukshetra/i.test(title)) return "kurukshetra";
  if (/tyagpatra|tyag-patra/i.test(title)) return "tyagpatra";
  if (/shekhar|sekhar/i.test(title)) return "shekhar-ek-jeevani-vividh-aayam";
  if (/clean.*architecture.*from\s*a\s*to\s*z|clean.*architecture.*beginner/i.test(title)) return "clean-architecture-beginners-guide";
  if (/clean.*architecture.*principles|clean.*architecture.*understand/i.test(title)) return "clean-architecture-principles-and-patterns";
  if (/pragmatic.*programmer/i.test(title)) return "the-pragmatic-programmer";
  if (/refactoring/i.test(title)) return "refactoring-improving-the-design-of-existing-code";
  if (/me.*before.*you/i.test(title)) return "me-before-you";
  if (/the.*notebook/i.test(title)) return "the-notebook";
  if (/time.*traveler/i.test(title)) return "the-time-travelers-wife";
  if (/jane.*eyre/i.test(title)) return "jane-eyre";

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

