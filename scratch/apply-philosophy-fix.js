// Scratch script to apply philosophy subcategory changes to data/books.ts and app/library/page.tsx
const fs = require('fs');
const path = require('path');

// ─── 1. data/books.ts ───────────────────────────────────────────────────────

const bookstsPath = path.join(__dirname, '..', 'data', 'books.ts');
let bookstsContent = fs.readFileSync(bookstsPath, 'utf8');

// Insert PHILOSOPHY_SUBCATEGORIES after TECHNICAL_CATEGORIES_SET block
const philosophySubcatsCode = `
export const PHILOSOPHY_SUBCATEGORIES = [
  "All Philosophy",
  "Osho",
  "Jiddu Krishnamurti",
  "Acharya Prashant",
  "Buddhism & Dhamma",
  "Stoicism",
  "Western Philosophy",
  "Indian Philosophy & Vedanta",
  "Existentialism",
  "Taoism & Eastern Wisdom",
] as const;

export type PhilosophySubcategory = typeof PHILOSOPHY_SUBCATEGORIES[number];

export function matchesPhilosophySubcategory(book: Book, subcategory: string): boolean {
  if (subcategory === "All Philosophy" || subcategory === "All") {
    return book.category === "Philosophy & Spirituality";
  }
  if (book.category !== "Philosophy & Spirituality") return false;

  const author = (book.author || "").toLowerCase();
  const title = (book.title || "").toLowerCase();
  const tags = (book.tags || []).map((t) => t.toLowerCase()).join(" ");
  const combined = author + " " + title + " " + tags;

  switch (subcategory) {
    case "Osho":
      return (
        author.includes("osho") ||
        tags.includes("osho")
      );

    case "Jiddu Krishnamurti":
      return (
        author.includes("krishnamurti") ||
        author.includes("jiddu")
      );

    case "Acharya Prashant":
      return author.includes("acharya prashant");

    case "Buddhism & Dhamma":
      return (
        author.includes("narada mahathera") ||
        author.includes("walpola rahula") ||
        author.includes("bhikkhu bodhi") ||
        author.includes("thich nhat hanh") ||
        author.includes("gunaratana") ||
        author.includes("karen armstrong") ||
        author.includes("bomhard") ||
        author.includes("ambedkar") ||
        author.includes("hanh") ||
        author.includes("bukkyo dendo") ||
        title.includes("buddha") ||
        title.includes("dhamma") ||
        title.includes("buddhis") ||
        (title.includes("mindful") && !author.includes("osho") && !author.includes("acharya prashant"))
      );

    case "Stoicism":
      return (
        author.includes("seneca") ||
        author.includes("epictetus") ||
        author.includes("marcus aurelius") ||
        tags.includes("stoic") ||
        title.includes("stoic")
      );

    case "Western Philosophy":
      return (
        author.includes("plato") ||
        author.includes("aristotle") ||
        author.includes("immanuel kant") ||
        author.includes("hegel") ||
        author.includes("david hume") ||
        author.includes("john locke") ||
        author.includes("ren\u00e9 descartes") ||
        author.includes("rene descartes") ||
        author.includes("schopenhauer") ||
        author.includes("amartya sen")
      );

    case "Indian Philosophy & Vedanta":
      return (
        author.includes("swami vivekananda") ||
        author.includes("ramana maharshi") ||
        author.includes("sadhguru") ||
        author.includes("swami sivananda") ||
        title.includes("upanishad") ||
        title.includes("vedanta") ||
        title.includes("raja yoga") ||
        title.includes("karma yoga") ||
        (tags.includes("vedanta") && !author.includes("osho") && !author.includes("acharya prashant"))
      );

    case "Existentialism":
      return (
        author.includes("nietzsche") ||
        author.includes("camus") ||
        author.includes("sartre") ||
        tags.includes("existentialism") ||
        title.includes("existential")
      );

    case "Taoism & Eastern Wisdom":
      return (
        author.includes("lao tzu") ||
        author.includes("sun tzu") ||
        title.includes("tao te ching") ||
        title.includes("art of war") ||
        (title.includes("tao") && !author.includes("osho") && !author.includes("acharya prashant"))
      );

    default:
      return false;
  }
}
`;

// Insert after the TECHNICAL_CATEGORIES_SET block (after the isTechnicalBook function declaration line)
const insertAfter = 'export function isTechnicalBook(book: Book): boolean {\n  return TECHNICAL_CATEGORIES_SET.has(book.category) || Boolean(book.resourceType && book.resourceType !== "Book");\n}';
if (!bookstsContent.includes(insertAfter)) {
  console.error('ERROR: Could not find insertion point in data/books.ts');
  process.exit(1);
}
if (bookstsContent.includes('PHILOSOPHY_SUBCATEGORIES')) {
  console.log('Philosophy subcategories already inserted in data/books.ts, skipping insert.');
} else {
  bookstsContent = bookstsContent.replace(insertAfter, insertAfter + '\n' + philosophySubcatsCode);
  console.log('Inserted PHILOSOPHY_SUBCATEGORIES into data/books.ts');
}

// Update getBooksByCategory to handle Philosophy subcategory
const oldGetByCategory = `export function getBooksByCategory(category: string, subcategory?: string): Book[] {
  if (category === "All") return BOOKS;
  if (category === "Technical Knowledge") {
    if (subcategory && subcategory !== "All Technical" && subcategory !== "All") {
      return BOOKS.filter((b) => matchesTechnicalSubcategory(b, subcategory));
    }
    return BOOKS.filter((b) => isTechnicalBook(b));
  }
  return BOOKS.filter((book) => book.category === category);
}`;

const newGetByCategory = `export function getBooksByCategory(category: string, subcategory?: string): Book[] {
  if (category === "All") return BOOKS;
  if (category === "Technical Knowledge") {
    if (subcategory && subcategory !== "All Technical" && subcategory !== "All") {
      return BOOKS.filter((b) => matchesTechnicalSubcategory(b, subcategory));
    }
    return BOOKS.filter((b) => isTechnicalBook(b));
  }
  if (category === "Philosophy & Spirituality") {
    if (subcategory && subcategory !== "All Philosophy" && subcategory !== "All") {
      return BOOKS.filter((b) => matchesPhilosophySubcategory(b, subcategory));
    }
    return BOOKS.filter((book) => book.category === "Philosophy & Spirituality");
  }
  return BOOKS.filter((book) => book.category === category);
}`;

if (bookstsContent.includes(oldGetByCategory)) {
  bookstsContent = bookstsContent.replace(oldGetByCategory, newGetByCategory);
  console.log('Updated getBooksByCategory in data/books.ts');
} else {
  console.log('getBooksByCategory already updated or not found as expected, check manually.');
}

fs.writeFileSync(bookstsPath, bookstsContent, 'utf8');
console.log('data/books.ts written.');

// ─── 2. app/library/page.tsx ─────────────────────────────────────────────────

const libraryPagePath = path.join(__dirname, '..', 'app', 'library', 'page.tsx');
let libraryContent = fs.readFileSync(libraryPagePath, 'utf8');

// a) Update import to add PHILOSOPHY_SUBCATEGORIES, matchesPhilosophySubcategory
const oldImport = `import {
  BOOKS,
  CATEGORIES,
  Category,
  isTechnicalBook,
  TECHNICAL_SUBCATEGORIES,
  ResourceType,
  matchesTechnicalSubcategory,
} from "@/data/books";`;

const newImport = `import {
  BOOKS,
  CATEGORIES,
  Category,
  isTechnicalBook,
  TECHNICAL_SUBCATEGORIES,
  PHILOSOPHY_SUBCATEGORIES,
  ResourceType,
  matchesTechnicalSubcategory,
  matchesPhilosophySubcategory,
} from "@/data/books";`;

if (libraryContent.includes(oldImport)) {
  libraryContent = libraryContent.replace(oldImport, newImport);
  console.log('Updated import in library/page.tsx');
} else {
  console.log('Import already updated or not matching, check manually.');
}

// b) Add PHILOSOPHY_BOOKS_CACHE and PHILOSOPHY_SUBCATEGORY_COUNTS after TECHNICAL_SUBCATEGORY_COUNTS block
const insertAfterTechCounts = `const TECHNICAL_SUBCATEGORY_COUNTS: Record<string, number> = {
  "All Technical": TECHNICAL_BOOKS_CACHE.length,
  "DSA & Problem Solving": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "DSA & Problem Solving")).length,
  "Computer Science & Systems": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "Computer Science & Systems")).length,
  "Web & Backend Development": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "Web & Backend Development")).length,
  "DBMS & SQL": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "DBMS & SQL")).length,
  "OOP & Software Design": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "OOP & Software Design")).length,
  "System Design & DevOps": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "System Design & DevOps")).length,
  "Programming Languages": TECHNICAL_BOOKS_CACHE.filter((b) => matchesTechnicalSubcategory(b, "Programming Languages")).length,
};`;

const philosophyCacheCode = `
const PHILOSOPHY_BOOKS_CACHE = BOOKS.filter((b) => b.category === "Philosophy & Spirituality");
const PHILOSOPHY_SUBCATEGORY_COUNTS: Record<string, number> = {
  "All Philosophy": PHILOSOPHY_BOOKS_CACHE.length,
  "Osho": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Osho")).length,
  "Jiddu Krishnamurti": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Jiddu Krishnamurti")).length,
  "Acharya Prashant": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Acharya Prashant")).length,
  "Buddhism & Dhamma": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Buddhism & Dhamma")).length,
  "Stoicism": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Stoicism")).length,
  "Western Philosophy": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Western Philosophy")).length,
  "Indian Philosophy & Vedanta": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Indian Philosophy & Vedanta")).length,
  "Existentialism": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Existentialism")).length,
  "Taoism & Eastern Wisdom": PHILOSOPHY_BOOKS_CACHE.filter((b) => matchesPhilosophySubcategory(b, "Taoism & Eastern Wisdom")).length,
};`;

if (!libraryContent.includes('PHILOSOPHY_BOOKS_CACHE')) {
  if (libraryContent.includes(insertAfterTechCounts)) {
    libraryContent = libraryContent.replace(insertAfterTechCounts, insertAfterTechCounts + '\n' + philosophyCacheCode);
    console.log('Inserted PHILOSOPHY_SUBCATEGORY_COUNTS in library/page.tsx');
  } else {
    console.error('ERROR: Could not find TECHNICAL_SUBCATEGORY_COUNTS block to insert after.');
    process.exit(1);
  }
} else {
  console.log('PHILOSOPHY_BOOKS_CACHE already present in library/page.tsx, skipping.');
}

// c) Add selectedPhilosophySubcategory state after selectedSubcategory state
const oldSubcatState = `  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("All Technical");`;
const newSubcatState = `  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("All Technical");
  const [selectedPhilosophySubcategory, setSelectedPhilosophySubcategory] = useState<string>("All Philosophy");`;

if (libraryContent.includes(oldSubcatState) && !libraryContent.includes('selectedPhilosophySubcategory')) {
  libraryContent = libraryContent.replace(oldSubcatState, newSubcatState);
  console.log('Added selectedPhilosophySubcategory state in library/page.tsx');
}

// d) Update filteredBooks to apply philosophy subcategory filter
const oldPhilFilter = `    } else if (selectedCategory !== "All") {
      result = result.filter((b) => b.category === selectedCategory);
    }`;
const newPhilFilter = `    } else if (selectedCategory === "Philosophy & Spirituality") {
      result = result.filter((b) => b.category === "Philosophy & Spirituality");
      if (selectedPhilosophySubcategory !== "All Philosophy") {
        result = result.filter((b) => matchesPhilosophySubcategory(b, selectedPhilosophySubcategory));
      }
    } else if (selectedCategory !== "All") {
      result = result.filter((b) => b.category === selectedCategory);
    }`;

if (libraryContent.includes(oldPhilFilter) && !libraryContent.includes('selectedPhilosophySubcategory !== "All Philosophy"')) {
  libraryContent = libraryContent.replace(oldPhilFilter, newPhilFilter);
  console.log('Updated filteredBooks philosophy filter in library/page.tsx');
}

// e) Update useMemo deps to include selectedPhilosophySubcategory
const oldDeps = `  }, [selectedCategory, selectedSubcategory, selectedResourceType, selectedLanguage, deferredSearchQuery, sortBy]);`;
const newDeps = `  }, [selectedCategory, selectedSubcategory, selectedPhilosophySubcategory, selectedResourceType, selectedLanguage, deferredSearchQuery, sortBy]);`;
if (libraryContent.includes(oldDeps) && !libraryContent.includes('selectedPhilosophySubcategory, selectedResourceType')) {
  libraryContent = libraryContent.replace(oldDeps, newDeps);
  console.log('Updated useMemo deps in library/page.tsx');
}

// f) Reset selectedPhilosophySubcategory in category pill onClick
const oldCatClick = `                    setSelectedCategory(cat);
                    setSelectedSubcategory("All Technical");
                    setSelectedResourceType("All");
                    setDisplayLimit(25);`;
const newCatClick = `                    setSelectedCategory(cat);
                    setSelectedSubcategory("All Technical");
                    setSelectedPhilosophySubcategory("All Philosophy");
                    setSelectedResourceType("All");
                    setDisplayLimit(25);`;
if (libraryContent.includes(oldCatClick) && !libraryContent.includes('setSelectedPhilosophySubcategory("All Philosophy")')) {
  libraryContent = libraryContent.replace(oldCatClick, newCatClick);
  console.log('Updated category pill onClick to reset philosophy subcategory in library/page.tsx');
}

// g) Also add to resetFilters
const oldReset = `    setSelectedCategory("All");
    setSelectedSubcategory("All Technical");
    setSelectedResourceType("All");`;
const newReset = `    setSelectedCategory("All");
    setSelectedSubcategory("All Technical");
    setSelectedPhilosophySubcategory("All Philosophy");
    setSelectedResourceType("All");`;
if (libraryContent.includes(oldReset) && !libraryContent.includes('setSelectedPhilosophySubcategory("All Philosophy");\n    setSelectedResourceType')) {
  libraryContent = libraryContent.replace(oldReset, newReset);
  console.log('Updated resetFilters in library/page.tsx');
}

// h) Insert philosophy subcategory pill UI block after Technical Knowledge block
// Find the end of the Technical Knowledge block and insert after it
const techBlockEnd = `        )}\n\n        {/* Row 3: Language Badges */}`;
const philosophyPillsUI = `
        {/* Row 2c: Philosophy & Spirituality Subcategories (Only when Philosophy is selected) */}
        {selectedCategory === "Philosophy & Spirituality" && (
          <div className="space-y-3 pt-3 border-t border-[var(--border)]/70 animate-fade-in">
            <div>
              <div className="text-xs text-[var(--accent)] font-semibold mb-2 flex items-center gap-1.5">
                <span>🧘</span>
                <span>Filter by School of Thought:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PHILOSOPHY_SUBCATEGORIES.map((subcat) => {
                  const isSubActive = selectedPhilosophySubcategory === subcat;
                  const subCount = PHILOSOPHY_SUBCATEGORY_COUNTS[subcat] ?? 0;
                  return (
                    <button
                      key={subcat}
                      onClick={() => {
                        setSelectedPhilosophySubcategory(subcat);
                        setDisplayLimit(25);
                      }}
                      className={\`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 \${
                        isSubActive
                          ? "bg-[var(--accent)] text-[var(--background)] font-bold shadow-xs scale-105"
                          : "bg-[var(--background)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
                      }\`}
                    >
                      <span>{subcat}</span>
                      <span className={\`text-[10px] \${isSubActive ? "opacity-90 font-bold" : "opacity-60"}\`}>
                        ({subCount})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

`;

if (!libraryContent.includes('Filter by School of Thought')) {
  if (libraryContent.includes(techBlockEnd)) {
    libraryContent = libraryContent.replace(techBlockEnd, philosophyPillsUI + techBlockEnd.trimStart().replace('\n        {/* Row 3', '\n        {/* Row 3'));
    // Simplify: just insert before Row 3
    // Actually let's do a cleaner replacement
    console.log('Philosophy pill UI inserted in library/page.tsx (check manually if needed)');
  } else {
    // Try alternate
    const row3marker = `        {/* Row 3: Language Badges */}`;
    if (libraryContent.includes(row3marker)) {
      libraryContent = libraryContent.replace(row3marker, philosophyPillsUI + row3marker);
      console.log('Philosophy pill UI inserted before Row 3 in library/page.tsx');
    } else {
      console.error('ERROR: Could not find insertion point for philosophy pills UI');
      process.exit(1);
    }
  }
} else {
  console.log('Philosophy pills UI already present, skipping.');
}

fs.writeFileSync(libraryPagePath, libraryContent, 'utf8');
console.log('app/library/page.tsx written.');

// ─── 3. components/CategoryPills.tsx ─────────────────────────────────────────

const categoryPillsPath = path.join(__dirname, '..', 'components', 'CategoryPills.tsx');
let pillsContent = fs.readFileSync(categoryPillsPath, 'utf8');

// a) Update import
const oldPillsImport = `import { matchesTechnicalSubcategory`;
// We need to find the actual import and add philosophy imports
// Read current import block first
const importMatch = pillsContent.match(/import \{[^}]+\} from "@\/data\/books";/s);
if (!importMatch) {
  console.error('ERROR: Could not find import block in CategoryPills.tsx');
  process.exit(1);
}
const currentPillsImport = importMatch[0];
if (!currentPillsImport.includes('matchesPhilosophySubcategory')) {
  const newPillsImport = currentPillsImport.replace(
    'matchesTechnicalSubcategory,',
    'matchesTechnicalSubcategory,\n  PHILOSOPHY_SUBCATEGORIES,\n  matchesPhilosophySubcategory,'
  );
  pillsContent = pillsContent.replace(currentPillsImport, newPillsImport);
  console.log('Updated import in CategoryPills.tsx');
}

// Now write it and check
fs.writeFileSync(categoryPillsPath, pillsContent, 'utf8');
console.log('components/CategoryPills.tsx written (import updated).');

// Now verify the count
const booksData = require('../data/books.json');
const philBooks = booksData.filter(b => b.category === 'Philosophy & Spirituality');
console.log('\n=== Philosophy subcategory expected counts ===');
const subcats = ["All Philosophy","Osho","Jiddu Krishnamurti","Acharya Prashant","Buddhism & Dhamma","Stoicism","Western Philosophy","Indian Philosophy & Vedanta","Existentialism","Taoism & Eastern Wisdom"];

const matchFn = (book, subcat) => {
  const author = (book.author || "").toLowerCase();
  const title = (book.title || "").toLowerCase();
  const tags = (book.tags || []).join(" ").toLowerCase();
  switch(subcat) {
    case "All Philosophy": return true;
    case "Osho": return author.includes("osho") || tags.includes("osho");
    case "Jiddu Krishnamurti": return author.includes("krishnamurti") || author.includes("jiddu");
    case "Acharya Prashant": return author.includes("acharya prashant");
    case "Buddhism & Dhamma": return author.includes("narada mahathera")||author.includes("walpola rahula")||author.includes("bhikkhu bodhi")||author.includes("thich nhat hanh")||author.includes("gunaratana")||author.includes("karen armstrong")||author.includes("bomhard")||author.includes("ambedkar")||author.includes("hanh")||author.includes("bukkyo dendo")||title.includes("buddha")||title.includes("dhamma")||(title.includes("mindful")&&!author.includes("osho")&&!author.includes("acharya prashant"))||title.includes("buddhis");
    case "Stoicism": return author.includes("seneca")||author.includes("epictetus")||author.includes("marcus aurelius")||tags.includes("stoic")||title.includes("stoic");
    case "Western Philosophy": return author.includes("plato")||author.includes("aristotle")||author.includes("immanuel kant")||author.includes("hegel")||author.includes("david hume")||author.includes("john locke")||author.includes("descartes")||author.includes("schopenhauer")||author.includes("amartya sen");
    case "Indian Philosophy & Vedanta": return author.includes("swami vivekananda")||author.includes("ramana maharshi")||author.includes("sadhguru")||author.includes("swami sivananda")||title.includes("upanishad")||title.includes("vedanta")||title.includes("raja yoga")||title.includes("karma yoga");
    case "Existentialism": return author.includes("nietzsche")||author.includes("camus")||tags.includes("existentialism");
    case "Taoism & Eastern Wisdom": return author.includes("lao tzu")||author.includes("sun tzu")||title.includes("tao te ching")||title.includes("art of war")||(title.includes("tao")&&!author.includes("osho")&&!author.includes("acharya prashant"));
    default: return false;
  }
};

subcats.forEach(s => {
  const count = philBooks.filter(b => matchFn(b, s)).length;
  console.log(`  ${s}: ${count}`);
});
