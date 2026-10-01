const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// 1. Update data/books.ts
const booksTsPath = path.join(root, "data/books.ts");
let booksTs = fs.readFileSync(booksTsPath, "utf8");

const matchesFunc = `export function matchesTechnicalSubcategory(book: Book, subcategory: string): boolean {
  if (subcategory === "All Technical" || subcategory === "All") {
    return isTechnicalBook(book);
  }
  if (!isTechnicalBook(book)) return false;
  if (book.category === subcategory || (book.resourceType as string) === subcategory) {
    return true;
  }
  if (!book.tags || !Array.isArray(book.tags)) return false;

  const tagsLower = book.tags.map((t) => t.toLowerCase());

  switch (subcategory) {
    case "DSA & Problem Solving":
      return (
        tagsLower.includes("dsa") ||
        tagsLower.includes("data structures") ||
        tagsLower.includes("algorithms") ||
        tagsLower.includes("leetcode")
      );
    case "Computer Science & Systems":
      return (
        tagsLower.includes("computer science & systems") ||
        tagsLower.includes("operating systems") ||
        tagsLower.includes("computer networks") ||
        tagsLower.includes("cs fundamentals") ||
        tagsLower.includes("machine learning") ||
        tagsLower.includes("artificial intelligence") ||
        tagsLower.includes("deep learning")
      );
    case "Web & Backend Development":
      return (
        tagsLower.includes("web development") ||
        tagsLower.includes("frontend") ||
        tagsLower.includes("backend") ||
        tagsLower.includes("rest api") ||
        tagsLower.includes("html5") ||
        tagsLower.includes("css") ||
        tagsLower.includes("next.js") ||
        tagsLower.includes("node.js") ||
        tagsLower.includes("api testing")
      );
    case "DBMS & SQL":
      return (
        tagsLower.includes("sql") ||
        tagsLower.includes("dbms") ||
        tagsLower.includes("database")
      );
    case "OOP & Software Design":
      return (
        tagsLower.includes("oop & software design") ||
        tagsLower.includes("oop") ||
        tagsLower.includes("clean code") ||
        tagsLower.includes("design patterns") ||
        tagsLower.includes("software architecture") ||
        tagsLower.includes("software engineering")
      );
    case "System Design & DevOps":
      return (
        tagsLower.includes("system design") ||
        tagsLower.includes("devops") ||
        tagsLower.includes("distributed systems") ||
        tagsLower.includes("scalability") ||
        tagsLower.includes("git")
      );
    case "Programming Languages":
      return (
        tagsLower.includes("python") ||
        tagsLower.includes("javascript") ||
        tagsLower.includes("c++") ||
        tagsLower.includes("programming")
      );
    default:
      return false;
  }
}

export const BOOKS: Book[] = booksData as Book[];`;

if (!booksTs.includes("matchesTechnicalSubcategory")) {
  booksTs = booksTs.replace("export const BOOKS: Book[] = booksData as Book[];", matchesFunc);
}

// Replace getBooksByCategory filtering logic
const oldGetBooks = `export function getBooksByCategory(category: string, subcategory?: string): Book[] {
  if (category === "All") return BOOKS;
  if (category === "Technical Knowledge") {
    if (subcategory && subcategory !== "All Technical" && subcategory !== "All") {
      return BOOKS.filter(
        (b) => isTechnicalBook(b) && (b.category === subcategory || b.resourceType === subcategory)
      );
    }
    return BOOKS.filter((b) => isTechnicalBook(b));
  }
  return BOOKS.filter((book) => book.category === category);
}`;

const newGetBooks = `export function getBooksByCategory(category: string, subcategory?: string): Book[] {
  if (category === "All") return BOOKS;
  if (category === "Technical Knowledge") {
    if (subcategory && subcategory !== "All Technical" && subcategory !== "All") {
      return BOOKS.filter((b) => matchesTechnicalSubcategory(b, subcategory));
    }
    return BOOKS.filter((b) => isTechnicalBook(b));
  }
  return BOOKS.filter((book) => book.category === category);
}`;

// Normalize newlines for replacement
booksTs = booksTs.replace(/\r\n/g, "\n");
booksTs = booksTs.replace(oldGetBooks.replace(/\r\n/g, "\n"), newGetBooks);
fs.writeFileSync(booksTsPath, booksTs, "utf8");
console.log("Updated data/books.ts");

// 2. Update app/library/page.tsx
const libraryPath = path.join(root, "app/library/page.tsx");
let libraryContent = fs.readFileSync(libraryPath, "utf8").replace(/\r\n/g, "\n");

if (!libraryContent.includes("matchesTechnicalSubcategory")) {
  libraryContent = libraryContent.replace(
    '  ResourceType,\n} from "@/data/books";',
    '  ResourceType,\n  matchesTechnicalSubcategory,\n} from "@/data/books";'
  );
}

const subcatCountsCode = `const RESOURCE_TYPE_COUNTS: Record<string, number> = {
  All: TECHNICAL_BOOKS_CACHE.length,
  Book: TECHNICAL_BOOKS_CACHE.filter((b) => b.resourceType === "Book").length,
  Notes: TECHNICAL_BOOKS_CACHE.filter((b) => b.resourceType === "Notes").length,
  HandwrittenNotes: TECHNICAL_BOOKS_CACHE.filter((b) => b.resourceType === "HandwrittenNotes").length,
  CheatSheet: TECHNICAL_BOOKS_CACHE.filter((b) => b.resourceType === "CheatSheet").length,
  InterviewPrep: TECHNICAL_BOOKS_CACHE.filter((b) => b.resourceType === "InterviewPrep").length,
};

const TECHNICAL_SUBCATEGORY_COUNTS: Record<string, number> = {
  "All Technical": TECHNICAL_BOOKS_CACHE.length,
  "DSA & Problem Solving": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "DSA & Problem Solving")).length,
  "Computer Science & Systems": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "Computer Science & Systems")).length,
  "Web & Backend Development": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "Web & Backend Development")).length,
  "DBMS & SQL": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "DBMS & SQL")).length,
  "OOP & Software Design": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "OOP & Software Design")).length,
  "System Design & DevOps": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "System Design & DevOps")).length,
  "Programming Languages": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "Programming Languages")).length,
};`;

if (!libraryContent.includes("TECHNICAL_SUBCATEGORY_COUNTS")) {
  libraryContent = libraryContent.replace(
    /const RESOURCE_TYPE_COUNTS: Record<string, number> = \{[\s\S]*?\};\n/,
    subcatCountsCode + "\n"
  );
}

// Replace filter logic in library page
libraryContent = libraryContent.replace(
  `      if (selectedSubcategory !== "All Technical") {
        result = result.filter(
          (b) => b.category === selectedSubcategory || (b.resourceType as string) === selectedSubcategory
        );
      }`,
  `      if (selectedSubcategory !== "All Technical") {
        result = result.filter((b) => matchesTechnicalSubcategory(b, selectedSubcategory));
      }`
);

// Replace subCount calculation in library page
libraryContent = libraryContent.replace(
  `                  const subCount =
                    subcat === "All Technical"
                      ? BOOKS.filter((b) => isTechnicalBook(b)).length
                      : BOOKS.filter((b) => isTechnicalBook(b) && (b.category === subcat || (b.resourceType as string) === subcat)).length;`,
  `                  const subCount = TECHNICAL_SUBCATEGORY_COUNTS[subcat] ?? 0;`
);

fs.writeFileSync(libraryPath, libraryContent, "utf8");
console.log("Updated app/library/page.tsx");

// 3. Update components/CategoryPills.tsx
const pillsPath = path.join(root, "components/CategoryPills.tsx");
let pillsContent = fs.readFileSync(pillsPath, "utf8").replace(/\r\n/g, "\n");

if (!pillsContent.includes("matchesTechnicalSubcategory")) {
  pillsContent = pillsContent.replace(
    '  TECHNICAL_SUBCATEGORIES,\n} from "@/data/books";',
    '  TECHNICAL_SUBCATEGORIES,\n  matchesTechnicalSubcategory,\n} from "@/data/books";'
  );
}

const oldSubCounts = `  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "All Technical": 0,
    };
    for (const sub of TECHNICAL_SUBCATEGORIES) {
      counts[sub] = 0;
    }
    for (const b of BOOKS) {
      if (isTechnicalBook(b)) {
        counts["All Technical"]++;
        if (counts[b.category] !== undefined) {
          counts[b.category]++;
        }
        if (b.resourceType && counts[b.resourceType] !== undefined) {
          counts[b.resourceType]++;
        }
      }
    }
    return counts;
  }, []);`;

const newSubCounts = `  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "All Technical": 0,
    };
    for (const sub of TECHNICAL_SUBCATEGORIES) {
      counts[sub] = 0;
    }
    for (const b of BOOKS) {
      if (isTechnicalBook(b)) {
        counts["All Technical"]++;
        for (const sub of TECHNICAL_SUBCATEGORIES) {
          if (sub !== "All Technical" && matchesTechnicalSubcategory(b, sub)) {
            counts[sub]++;
          }
        }
      }
    }
    return counts;
  }, []);`;

pillsContent = pillsContent.replace(oldSubCounts, newSubCounts);
fs.writeFileSync(pillsPath, pillsContent, "utf8");
console.log("Updated components/CategoryPills.tsx");

// 4. Update app/page.tsx
const homePath = path.join(root, "app/page.tsx");
let homeContent = fs.readFileSync(homePath, "utf8").replace(/\r\n/g, "\n");

if (!homeContent.includes("matchesTechnicalSubcategory")) {
  homeContent = homeContent.replace(
    'import { BOOKS, Category, getBooksByCategory, searchBooks, isTechnicalBook } from "@/data/books";',
    'import { BOOKS, Category, getBooksByCategory, searchBooks, isTechnicalBook, matchesTechnicalSubcategory } from "@/data/books";'
  );
}

homeContent = homeContent.replace(
  `          if (selectedSubcategory !== "All Technical") {
            return b.category === selectedSubcategory || (b.resourceType as string) === selectedSubcategory;
          }`,
  `          if (selectedSubcategory !== "All Technical") {
            return matchesTechnicalSubcategory(b, selectedSubcategory);
          }`
);

fs.writeFileSync(homePath, homeContent, "utf8");
console.log("Updated app/page.tsx");
