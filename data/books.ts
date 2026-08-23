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
  "Classics",
  "Hindi Literature",
  "Philosophy & Spirituality",
  "Self-Development & Psychology",
  "Fiction & Dystopian",
  "Romance",
  "Business, Finance & Economics",
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
      return BOOKS.filter(
        (b) => isTechnicalBook(b) && (b.category === subcategory || b.resourceType === subcategory)
      );
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
