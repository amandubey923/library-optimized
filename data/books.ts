import booksData from "./books.json";

export interface Book {
  id: string;
  title: string;
  author: string;
  category: "Classics" | "Hindi Literature" | "Philosophy & Spirituality" | "Romance" | "Fiction & Dystopian" | "Fantasy & Adventure" | string;
  cover: string;
  pdf: string;
  description: string;
  year: number | string;
  pages: number | string;
  language: "English" | "Hindi" | "Russian (Eng Trans)" | "Spanish (Eng Trans)" | string;
  rating: number;
  featured?: boolean;
  tags: string[];
  excerpt?: string;
  fileHash?: string;
}

export const CATEGORIES = [
  "All",
  "Classics",
  "Hindi Literature",
  "Philosophy & Spirituality",
  "Romance",
  "Fiction & Dystopian",
  "Fantasy & Adventure"
] as const;

export type Category = typeof CATEGORIES[number];

export const BOOKS: Book[] = booksData as Book[];

export function getBookById(id: string): Book | undefined {
  return BOOKS.find((book) => book.id === id || book.id === id.toLowerCase().trim());
}

export function getFeaturedBooks(): Book[] {
  return BOOKS.filter((book) => book.featured);
}

export function getBooksByCategory(category: Category): Book[] {
  if (category === "All") return BOOKS;
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
      book.tags.some((tag) => tag.toLowerCase().includes(clean))
  );
}

export function getRelatedBooks(currentBook: Book, limit = 4): Book[] {
  return BOOKS.filter(
    (b) => b.id !== currentBook.id && (b.category === currentBook.category || b.language === currentBook.language)
  ).slice(0, limit);
}
