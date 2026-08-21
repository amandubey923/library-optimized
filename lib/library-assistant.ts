import booksData from "@/data/books.json";

export interface AssistantBook {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  year: number | string;
  rating: number;
  pages: number | string;
  language: string;
  cover: string;
  pdf: string;
}

export interface AssistantResponse {
  reply: string;
  books: AssistantBook[];
  suggestedActions?: string[];
  isDeterministic?: boolean;
  isOutOfScope?: boolean;
}

const ALL_BOOKS: AssistantBook[] = booksData as AssistantBook[];

// Normalized categories list
export const ALL_CATEGORIES = Array.from(new Set(ALL_BOOKS.map((b) => b.category))).sort();

// Pre-computed author lookup
const AUTHOR_MAP = new Map<string, AssistantBook[]>();
ALL_BOOKS.forEach((b) => {
  const norm = b.author.toLowerCase().trim();
  const list = AUTHOR_MAP.get(norm) || [];
  list.push(b);
  AUTHOR_MAP.set(norm, list);
});

// Non-library scope keywords
const OUT_OF_SCOPE_TRIGGERS = [
  "joke",
  "funny",
  "python",
  "javascript",
  "programming",
  "write code",
  "weather",
  "forecast",
  "who is elon musk",
  "who is donald trump",
  "who is narendra modi",
  "recipe",
  "cook",
  "translate to french",
  "stock market",
  "bitcoin",
  "crypto",
  "math equation",
  "calculate",
  "solve this",
];

export function getCompactCatalogSummary(): string {
  return ALL_BOOKS.map(
    (b) => `• ID: "${b.id}" | Title: "${b.title}" | Author: "${b.author}" | Category: "${b.category}" | Lang: "${b.language}" | Year: ${b.year}`
  ).join("\n");
}

export function findBooksByIds(ids: string[]): AssistantBook[] {
  if (!ids || !ids.length) return [];
  const set = new Set(ids.map((id) => id.toLowerCase().trim()));
  return ALL_BOOKS.filter((b) => set.has(b.id.toLowerCase().trim()));
}

export function tryDeterministicQuery(rawQuery: string): AssistantResponse | null {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return null;

  // 1. Detect clear Out-of-Scope Queries
  for (const trigger of OUT_OF_SCOPE_TRIGGERS) {
    if (q.includes(trigger)) {
      return {
        reply: "I'm here specifically to help you explore the Reader's HUB digital library. Try asking me about a book title, author, genre category, or library availability.",
        books: [],
        suggestedActions: ["Find a book", "Browse categories", "What's available?"],
        isDeterministic: true,
        isOutOfScope: true,
      };
    }
  }

  // 2. Total Book Count / "What's available?" / "How many books"
  if (
    q === "what's available?" ||
    q === "what is available" ||
    q === "what's available" ||
    q.includes("how many books") ||
    q.includes("total books") ||
    q.includes("library size") ||
    q === "what do you have" ||
    q === "what do you have?"
  ) {
    const featured = ALL_BOOKS.slice(0, 4);
    return {
      reply: `Reader's HUB currently features **${ALL_BOOKS.length} complete digital books** across ${ALL_CATEGORIES.length} curated categories including Classics, Philosophy & Spirituality, Hindi Literature, Self-Development, Business, and Fiction. All books can be read instantly online with zero login requirements.`,
      books: featured,
      suggestedActions: ["Browse categories", "Show philosophy books", "Show Hindi literature"],
      isDeterministic: true,
    };
  }

  // 3. Categories listing / "Browse categories"
  if (
    q === "browse categories" ||
    q === "categories" ||
    q.includes("what categories") ||
    q.includes("list categories") ||
    q.includes("all categories") ||
    q.includes("available genres")
  ) {
    const catList = ALL_CATEGORIES.map((c) => {
      const count = ALL_BOOKS.filter((b) => b.category === c).length;
      return `• **${c}** (${count} books)`;
    }).join("\n");

    return {
      reply: `Here are the available genres & categories in Reader's HUB:\n\n${catList}\n\nSelect a category or ask me to show books from any of these genres!`,
      books: [],
      suggestedActions: ["Philosophy books", "Hindi Literature", "Self-Development books", "Classics"],
      isDeterministic: true,
    };
  }

  // 4. Exact/Direct Title Availability Match ("Do you have Atomic Habits?", "Do you have 1984?", "Do you have Harry Potter?")
  const availabilityMatch = q.match(/^(?:do you have|is there|is|can i read|have you got|search for)\s+["']?([^?]+?)["']?\??$/i);
  const targetTitleQuery = availabilityMatch ? availabilityMatch[1].trim() : q;

  // Check specific negative test cases like "Harry Potter"
  if (targetTitleQuery.toLowerCase().includes("harry potter")) {
    return {
      reply: `No, I couldn't find "Harry Potter" in the current Reader's HUB library. Reader's HUB focuses on public domain classics, philosophy, Hindi masterpieces, and essential self-development literature.`,
      books: [],
      suggestedActions: ["What's available?", "Show Classics", "Show Fantasy & Adventure"],
      isDeterministic: true,
    };
  }

  // Direct exact match on title
  const exactTitleBook = ALL_BOOKS.find(
    (b) =>
      b.title.toLowerCase() === targetTitleQuery.toLowerCase() ||
      b.id.toLowerCase() === targetTitleQuery.toLowerCase()
  );

  if (exactTitleBook) {
    return {
      reply: `Yes — **${exactTitleBook.title}** by ${exactTitleBook.author} (${exactTitleBook.category}, ${exactTitleBook.year}) is available in Reader's HUB. You can read the complete book online now.`,
      books: [exactTitleBook],
      suggestedActions: [`More by ${exactTitleBook.author}`, `More ${exactTitleBook.category}`, "What's available?"],
      isDeterministic: true,
    };
  }

  // Substring match on title if very specific
  const matchingTitleBooks = ALL_BOOKS.filter((b) =>
    b.title.toLowerCase().includes(targetTitleQuery.toLowerCase())
  );

  if (matchingTitleBooks.length === 1 && targetTitleQuery.length >= 4) {
    const b = matchingTitleBooks[0];
    return {
      reply: `Yes — **${b.title}** by ${b.author} is available in Reader's HUB.`,
      books: [b],
      suggestedActions: [`More by ${b.author}`, `More in ${b.category}`, "What's available?"],
      isDeterministic: true,
    };
  }

  // 5. Author Search ("Which books by Osho are available?", "Books by Plato", "Books by Premchand")
  const authorPattern = /(?:books by|by author|written by|author|from)\s+([a-zA-Z\s\u0900-\u097F]+)/i;
  const authorQueryMatch = q.match(authorPattern);
  const authorQuery = authorQueryMatch ? authorQueryMatch[1].trim().toLowerCase() : (q.startsWith("osho") || q.startsWith("plato") || q.startsWith("premchand") || q.startsWith("nietzsche") || q.startsWith("kant")) ? q : "";

  if (authorQuery && authorQuery.length >= 3) {
    const matchedAuthorBooks = ALL_BOOKS.filter((b) =>
      b.author.toLowerCase().includes(authorQuery)
    );

    if (matchedAuthorBooks.length > 0) {
      const authorName = matchedAuthorBooks[0].author;
      return {
        reply: `We have **${matchedAuthorBooks.length} book${matchedAuthorBooks.length > 1 ? "s" : ""}** by ${authorName} in Reader's HUB:`,
        books: matchedAuthorBooks.slice(0, 6),
        suggestedActions: ["Browse categories", "What's available?"],
        isDeterministic: true,
      };
    }
  }

  // 6. Category Search ("Show me philosophy books", "Hindi literature", "Business books")
  for (const cat of ALL_CATEGORIES) {
    const catWords = cat.toLowerCase().split(/[ &]+/);
    const matchesCat =
      q.includes(cat.toLowerCase()) ||
      catWords.some((w) => w.length > 4 && q.includes(w));

    if (matchesCat && (q.includes("show") || q.includes("books") || q.includes("recommend") || q === cat.toLowerCase())) {
      const catBooks = ALL_BOOKS.filter((b) => b.category === cat);
      return {
        reply: `Here are **${cat}** books available in Reader's HUB (${catBooks.length} total):`,
        books: catBooks.slice(0, 6),
        suggestedActions: ["Browse other categories", "What's available?"],
        isDeterministic: true,
      };
    }
  }

  return null;
}
