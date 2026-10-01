import booksData from "./books.json";

export type ResourceType = "Book" | "Notes" | "HandwrittenNotes" | "CheatSheet" | "InterviewPrep";

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  resourceType?: ResourceType;
  cover: string;
  pdf: string;
  description: string;
  year: number | string;
  pages: number | string;
  language: string;
  rating: number;
  featured?: boolean;
  tags: string[];
  excerpt?: string;
  fileHash?: string;
}

export const CATEGORIES = [
  "All",
  "Technical Knowledge",
  "Science & Physics",
  "History & Civilization",
  "Geography & Geopolitics",
  "Politics & Political Thought",
  "Economics & Finance",
  "Business & Management",
  "Philosophy & Spirituality",
  "Psychology & Self-Development",
  "Hindi Literature",
  "Classics & Literature",
  "Fiction & Dystopian",
  "Romance",
  "Fantasy & Adventure"
] as const;

export type Category = typeof CATEGORIES[number];

export const TECHNICAL_SUBCATEGORIES = [
  "All Technical",
  "DSA & Problem Solving",
  "Computer Science & Systems",
  "Web & Backend Development",
  "DBMS & SQL",
  "OOP & Software Design",
  "System Design & DevOps",
  "Programming Languages"
] as const;

export type TechnicalSubcategory = typeof TECHNICAL_SUBCATEGORIES[number];

export const TECHNICAL_CATEGORIES_SET = new Set<string>([
  "Technical Knowledge",
  "Computer Science & Systems",
  "DSA & Problem Solving",
  "System Design & DevOps",
  "DBMS & SQL",
  "Web & Backend Development",
  "OOP & Software Design",
  "Programming Languages"
]);

export function isTechnicalBook(book: Book): boolean {
  return TECHNICAL_CATEGORIES_SET.has(book.category) || Boolean(book.resourceType && book.resourceType !== "Book");
}

export function matchesTechnicalSubcategory(book: Book, subcategory: string): boolean {
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

export const BOOKS: Book[] = booksData as Book[];

export function getBookById(id: string): Book | undefined {
  return BOOKS.find((book) => book.id === id || book.id === id.toLowerCase().trim());
}

export function getFeaturedBooks(): Book[] {
  return BOOKS.filter((book) => book.featured);
}

export function getBooksByCategory(category: string, subcategory?: string): Book[] {
  if (category === "All") return BOOKS;
  if (category === "Technical Knowledge") {
    if (subcategory && subcategory !== "All Technical" && subcategory !== "All") {
      return BOOKS.filter((b) => matchesTechnicalSubcategory(b, subcategory));
    }
    return BOOKS.filter((b) => isTechnicalBook(b));
  }
  return BOOKS.filter((book) => book.category === category);
}

export function searchBooks(query: string): Book[] {
  const clean = query.toLowerCase().trim();
  if (!clean) return BOOKS;
  return BOOKS.filter(
    (book) =>
      book.title.toLowerCase().includes(clean) ||
      book.author.toLowerCase().includes(clean) ||
      book.category.toLowerCase().includes(clean) ||
      (isTechnicalBook(book) && "technical knowledge".includes(clean)) ||
      (book.resourceType && book.resourceType.toLowerCase().includes(clean)) ||
      book.tags.some((tag) => tag.toLowerCase().includes(clean))
  );
}

export function getRelatedBooks(currentBook: Book, limit = 4): Book[] {
  return BOOKS.filter(
    (b) =>
      b.id !== currentBook.id &&
      (b.category === currentBook.category ||
        (isTechnicalBook(b) && isTechnicalBook(currentBook)) ||
        b.language === currentBook.language)
  ).slice(0, limit);
}