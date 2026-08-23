const fs = require('fs');
const path = require('path');

const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');
const booksJsonPath = path.join(__dirname, '..', 'data', 'books.json');
const existingBooks = JSON.parse(fs.readFileSync(booksJsonPath, 'utf8'));

console.log(`Existing books in catalog: ${existingBooks.length}`);

// Map of raw filename -> canonical filename and metadata
const technicalMappings = [
  {
    rawFile: "Basics of API Testing.pdf",
    canonicalFile: "BasicsOfAPITesting.pdf",
    id: "basics-of-api-testing",
    title: "Basics of API Testing",
    author: "Community Notes",
    category: "Web & Backend Development",
    resourceType: "Notes",
    cover: "/images/books/basics-of-api-testing.webp",
    pdf: "/pdfs/BasicsOfAPITesting.pdf",
    description: "A practical foundational guide to REST APIs, HTTP methods, status codes, endpoints, Postman collections, and automated API testing principles.",
    year: 2024,
    pages: 28,
    language: "English",
    rating: 4.7,
    tags: ["API Testing", "REST API", "Postman", "Web Services", "QA", "Software Engineering"]
  },
  {
    rawFile: "COMPUTER NETWORKS NOTES.pdf",
    canonicalFile: "ComputerNetworksCompleteNotes.pdf",
    id: "computer-networks-complete-notes",
    title: "Computer Networks Complete Notes",
    author: "Community Notes",
    category: "Computer Science & Systems",
    resourceType: "Notes",
    cover: "/images/books/computer-networks-complete-notes.webp",
    pdf: "/pdfs/ComputerNetworksCompleteNotes.pdf",
    description: "Comprehensive 311-page textbook-level notes covering the OSI Model, TCP/IP stack, IP addressing, subnetting, routing protocols, and network security.",
    year: 2023,
    pages: 311,
    language: "English",
    rating: 4.9,
    tags: ["Computer Networks", "TCP/IP", "OSI Model", "Routing", "Protocols", "CS Fundamentals"]
  },
  {
    rawFile: "CSS Notes.pdf",
    canonicalFile: "CSSCompleteNotes.pdf",
    id: "css-complete-reference-notes",
    title: "CSS Complete Reference Notes",
    author: "Rahul & Neha",
    category: "Web & Backend Development",
    resourceType: "Notes",
    cover: "/images/books/css-complete-reference-notes.webp",
    pdf: "/pdfs/CSSCompleteNotes.pdf",
    description: "Visual illustrated guide covering modern CSS selectors, Flexbox, CSS Grid layouts, animations, media queries, transitions, and responsive web design.",
    year: 2024,
    pages: 72,
    language: "English",
    rating: 4.8,
    tags: ["CSS", "Frontend", "Flexbox", "CSS Grid", "Responsive Design", "Web Development"]
  },
  {
    rawFile: "DSA Notes That Make Concepts Easy.pdf",
    canonicalFile: "DSANotesConceptsMadeEasy.pdf",
    id: "dsa-notes-concepts-made-easy",
    title: "DSA Notes That Make Concepts Easy",
    author: "Community Notes",
    category: "DSA & Problem Solving",
    resourceType: "Notes",
    cover: "/images/books/dsa-notes-concepts-made-easy.webp",
    pdf: "/pdfs/DSANotesConceptsMadeEasy.pdf",
    description: "Visual step-by-step conceptual notes explaining arrays, linked lists, trees, graphs, dynamic programming, sorting algorithms, and complexity analysis.",
    year: 2024,
    pages: 32,
    language: "English",
    rating: 4.9,
    tags: ["DSA", "Data Structures", "Algorithms", "Dynamic Programming", "Trees", "Graphs", "Interview Prep"]
  },
  {
    rawFile: "git-cheat-sheet-education.pdf",
    canonicalFile: "GitCheatSheetEducation.pdf",
    id: "git-quick-reference-cheat-sheet",
    title: "Git & GitHub Quick Reference Cheat Sheet",
    author: "GitHub Education",
    category: "System Design & DevOps",
    resourceType: "CheatSheet",
    cover: "/images/books/git-quick-reference-cheat-sheet.webp",
    pdf: "/pdfs/GitCheatSheetEducation.pdf",
    description: "Official GitHub quick-reference cheat sheet for essential Git commands: branching, merging, rebasing, remote remotes, diffs, stashes, and repo management.",
    year: 2024,
    pages: 2,
    language: "English",
    rating: 4.9,
    tags: ["Git", "GitHub", "Version Control", "Cheat Sheet", "DevOps", "Command Line"]
  },
  {
    rawFile: "htmlnotes.pdf",
    canonicalFile: "HTML5CompleteNotes.pdf",
    id: "html5-complete-reference-notes",
    title: "HTML5 Complete Reference Notes",
    author: "Rahul & Neha",
    category: "Web & Backend Development",
    resourceType: "Notes",
    cover: "/images/books/html5-complete-reference-notes.webp",
    pdf: "/pdfs/HTML5CompleteNotes.pdf",
    description: "Illustrated reference guide to modern HTML5 semantic elements, forms, input validation, multimedia tags, SEO metadata, and web accessibility standards.",
    year: 2024,
    pages: 48,
    language: "English",
    rating: 4.8,
    tags: ["HTML5", "Frontend", "Semantic HTML", "Web Development", "Forms", "Accessibility"]
  },
  {
    rawFile: "JS Notes.pdf",
    canonicalFile: "JavaScriptCoreAndES6Notes.pdf",
    id: "javascript-core-and-es6-notes",
    title: "JavaScript Core & Modern ES6+ Notes",
    author: "Community Notes",
    category: "Web & Backend Development",
    resourceType: "Notes",
    cover: "/images/books/javascript-core-and-es6-notes.webp",
    pdf: "/pdfs/JavaScriptCoreAndES6Notes.pdf",
    description: "Concise deep-dive into JavaScript core mechanics: execution context, closures, event loop, promises, async/await, prototypes, and modern ES6+ features.",
    year: 2024,
    pages: 45,
    language: "English",
    rating: 4.8,
    tags: ["JavaScript", "ES6+", "Async JS", "Event Loop", "Closures", "Frontend", "Web Development"]
  },
  {
    rawFile: "Most Useful SQL Notes  (1).pdf",
    canonicalFile: "MostUsefulSQLNotes.pdf",
    id: "most-useful-sql-practical-notes",
    title: "Most Useful SQL Practical Notes",
    author: "Community Notes",
    category: "DBMS & SQL",
    resourceType: "Notes",
    cover: "/images/books/most-useful-sql-practical-notes.webp",
    pdf: "/pdfs/MostUsefulSQLNotes.pdf",
    description: "Practical 68-page handbook covering SQL queries, joins, subqueries, CTEs, window functions, indexing, normalization, transactions, and aggregate analytics.",
    year: 2024,
    pages: 68,
    language: "English",
    rating: 4.9,
    tags: ["SQL", "DBMS", "Database", "Queries", "Window Functions", "PostgreSQL", "MySQL"]
  },
  {
    rawFile: "Must Solve Leetcode bu Striver.pdf",
    canonicalFile: "MustSolveLeetCodeProblemsByStriver.pdf",
    id: "must-solve-leetcode-problems-striver",
    title: "Must Solve LeetCode Problems Roadmap",
    author: "Striver (take U forward)",
    category: "DSA & Problem Solving",
    resourceType: "InterviewPrep",
    cover: "/images/books/must-solve-leetcode-problems-striver.webp",
    pdf: "/pdfs/MustSolveLeetCodeProblemsByStriver.pdf",
    description: "Curated SDE sheet and comprehensive roadmap of must-solve LeetCode problems covering two pointers, sliding window, recursion, graphs, trees, DP, and greedy patterns.",
    year: 2024,
    pages: 58,
    language: "English",
    rating: 5.0,
    tags: ["LeetCode", "Striver", "DSA", "Interview Prep", "Coding Interviews", "SDE Sheet"]
  },
  {
    rawFile: "Next JS Notes.pdf",
    canonicalFile: "NextJSArchitectureNotes.pdf",
    id: "nextjs-complete-architecture-notes",
    title: "Next.js App Router & Architecture Notes",
    author: "Community Notes",
    category: "Web & Backend Development",
    resourceType: "Notes",
    cover: "/images/books/nextjs-complete-architecture-notes.webp",
    pdf: "/pdfs/NextJSArchitectureNotes.pdf",
    description: "Comprehensive guide to Next.js covering App Router, Server Components (RSC), Client Components, Server Actions, Dynamic Routing, SSR, SSG, and API Route handlers.",
    year: 2024,
    pages: 42,
    language: "English",
    rating: 4.9,
    tags: ["Next.js", "React", "Fullstack", "App Router", "SSR", "Server Components", "Frontend"]
  },
  {
    rawFile: "Node JS Notes.pdf",
    canonicalFile: "NodeJSBackendArchitectureNotes.pdf",
    id: "nodejs-backend-architecture-notes",
    title: "Node.js Backend & Architecture Notes",
    author: "Community Notes",
    category: "Web & Backend Development",
    resourceType: "Notes",
    cover: "/images/books/nodejs-backend-architecture-notes.webp",
    pdf: "/pdfs/NodeJSBackendArchitectureNotes.pdf",
    description: "Illustrated 87-page backend guide covering Node.js event-driven architecture, event loop, libuv, streams, buffers, Express.js middleware, and REST API development.",
    year: 2024,
    pages: 87,
    language: "English",
    rating: 4.9,
    tags: ["Node.js", "Backend", "Express.js", "Event Loop", "Streams", "REST API", "JavaScript"]
  },
  {
    rawFile: "Object Oriented Programming.pdf",
    canonicalFile: "ObjectOrientedProgrammingFundamentals.pdf",
    id: "oop-fundamentals-quick-notes",
    title: "Object Oriented Programming Fundamentals",
    author: "Community Notes",
    category: "OOP & Software Design",
    resourceType: "Notes",
    cover: "/images/books/oop-fundamentals-quick-notes.webp",
    pdf: "/pdfs/ObjectOrientedProgrammingFundamentals.pdf",
    description: "Quick conceptual reference on the four OOP pillars: Encapsulation, Abstraction, Inheritance, and Polymorphism, with access specifiers and clean class design principles.",
    year: 2023,
    pages: 10,
    language: "English",
    rating: 4.7,
    tags: ["OOP", "Object Oriented", "Polymorphism", "Inheritance", "Software Design", "CS Fundamentals"]
  },
  {
    rawFile: "OOPS BOOK.pdf",
    canonicalFile: "ObjectOrientedProgrammingComprehensiveBook.pdf",
    id: "oop-comprehensive-guide-book",
    title: "Object Oriented Programming Comprehensive Guide",
    author: "Engineering Faculty",
    category: "OOP & Software Design",
    resourceType: "Book",
    cover: "/images/books/oop-comprehensive-guide-book.webp",
    pdf: "/pdfs/ObjectOrientedProgrammingComprehensiveBook.pdf",
    description: "Complete 330-page textbook covering OOP paradigms, C++ implementation, virtual functions, templates, exception handling, design patterns, and UML modeling.",
    year: 2022,
    pages: 330,
    language: "English",
    rating: 4.8,
    tags: ["OOP", "C++", "Design Patterns", "UML", "Software Engineering", "Textbook"]
  },
  {
    rawFile: "OOPS C++.pdf",
    canonicalFile: "OOPWithCppDigitalNotes.pdf",
    id: "oop-with-cpp-digital-notes",
    title: "OOP with C++ Digital Notes",
    author: "Debashish",
    category: "OOP & Software Design",
    resourceType: "Notes",
    cover: "/images/books/oop-with-cpp-digital-notes.webp",
    pdf: "/pdfs/OOPWithCppDigitalNotes.pdf",
    description: "91-page digital course notes on C++ object-oriented programming: constructors, destructors, operator overloading, inheritance hierarchies, and memory management.",
    year: 2023,
    pages: 91,
    language: "English",
    rating: 4.8,
    tags: ["OOP", "C++", "Constructors", "Operator Overloading", "Inheritance", "Pointers"]
  },
  {
    rawFile: "oops_in_c++_hand_written_notes.pdf",
    canonicalFile: "OOPInCppHandwrittenNotes.pdf",
    id: "oop-in-cpp-handwritten-study-notes",
    title: "OOP in C++ Handwritten Study Notes",
    author: "Community Notes",
    category: "OOP & Software Design",
    resourceType: "HandwrittenNotes",
    cover: "/images/books/oop-in-cpp-handwritten-study-notes.webp",
    pdf: "/pdfs/OOPInCppHandwrittenNotes.pdf",
    description: "Authentic handwritten study notes with diagrams and code snippets covering core C++ OOP concepts, friend functions, static members, and runtime polymorphism.",
    year: 2023,
    pages: 24,
    language: "English",
    rating: 4.9,
    tags: ["OOP", "C++", "Handwritten", "Study Notes", "Diagrams", "Exam Prep"]
  },
  {
    rawFile: "Operating System Notes.pdf",
    canonicalFile: "OperatingSystemsUniversityNotes.pdf",
    id: "operating-systems-university-notes",
    title: "Operating Systems University Notes",
    author: "B.P.U.T Faculty",
    category: "Computer Science & Systems",
    resourceType: "Notes",
    cover: "/images/books/operating-systems-university-notes.webp",
    pdf: "/pdfs/OperatingSystemsUniversityNotes.pdf",
    description: "Structured academic course notes covering process scheduling, inter-process communication, concurrency, deadlocks, memory management, and paging.",
    year: 2023,
    pages: 92,
    language: "English",
    rating: 4.8,
    tags: ["Operating Systems", "Process Scheduling", "Deadlocks", "Virtual Memory", "Paging", "CS Fundamentals"]
  },
  {
    rawFile: "OPERATING SYSTEMS  NOTES  (diagram).pdf",
    canonicalFile: "OperatingSystemsNotesWithDiagrams.pdf",
    id: "operating-systems-notes-with-diagrams",
    title: "Operating Systems Notes with Illustrated Diagrams",
    author: "Community Notes",
    category: "Computer Science & Systems",
    resourceType: "Notes",
    cover: "/images/books/operating-systems-notes-with-diagrams.webp",
    pdf: "/pdfs/OperatingSystemsNotesWithDiagrams.pdf",
    description: "Comprehensive 133-page diagram-rich notes illustrating CPU scheduling algorithms, semaphore sync, banker's algorithm, page replacement, and disk scheduling.",
    year: 2024,
    pages: 133,
    language: "English",
    rating: 4.9,
    tags: ["Operating Systems", "Diagrams", "Semaphores", "CPU Scheduling", "Disk Management", "CS Fundamentals"]
  },
  {
    rawFile: "python handwritten notes.pdf",
    canonicalFile: "PythonCompleteHandwrittenNotes.pdf",
    id: "python-complete-handwritten-notes",
    title: "Python Complete Handwritten Notes",
    author: "Community Notes",
    category: "Programming Languages",
    resourceType: "HandwrittenNotes",
    cover: "/images/books/python-complete-handwritten-notes.webp",
    pdf: "/pdfs/PythonCompleteHandwrittenNotes.pdf",
    description: "115-page comprehensive handwritten guide to Python: syntax, data structures (lists, tuples, dicts), functions, lambdas, OOP, file handling, modules, and exceptions.",
    year: 2024,
    pages: 115,
    language: "English",
    rating: 4.9,
    tags: ["Python", "Handwritten", "Programming", "Data Structures", "Functions", "OOP", "Beginner to Advanced"]
  },
  {
    rawFile: "Sql 100 Interview Ques .pdf",
    canonicalFile: "SQL100InterviewQuestions.pdf",
    id: "sql-top-100-interview-questions",
    title: "SQL Top 100 Interview Questions & Answers",
    author: "Community Notes",
    category: "DBMS & SQL",
    resourceType: "InterviewPrep",
    cover: "/images/books/sql-top-100-interview-questions.webp",
    pdf: "/pdfs/SQL100InterviewQuestions.pdf",
    description: "High-yield interview preparation guide featuring 100 essential SQL questions with query solutions: joins, aggregations, duplicate removal, Nth highest salary, and indexing.",
    year: 2024,
    pages: 16,
    language: "English",
    rating: 4.9,
    tags: ["SQL", "Interview Prep", "Database Questions", "Queries", "SDE Interview", "DBMS"]
  },
  {
    rawFile: "System design complete notes .pdf",
    canonicalFile: "SystemDesignCompleteArchitectureNotes.pdf",
    id: "system-design-complete-architecture-notes",
    title: "System Design Complete Architecture Notes",
    author: "Community Notes",
    category: "System Design & DevOps",
    resourceType: "Notes",
    cover: "/images/books/system-design-complete-architecture-notes.webp",
    pdf: "/pdfs/SystemDesignCompleteArchitectureNotes.pdf",
    description: "75-page comprehensive system design guide: scalability, load balancing, caching strategies, CDN, database sharding, CAP theorem, message queues, and microservices.",
    year: 2024,
    pages: 75,
    language: "English",
    rating: 4.9,
    tags: ["System Design", "Scalability", "Microservices", "Caching", "Load Balancing", "High Availability", "Architecture"]
  },
  {
    rawFile: "System Design.pdf",
    canonicalFile: "SystemDesignIllustratedHandbook.pdf",
    id: "system-design-illustrated-handbook",
    title: "System Design Illustrated Handbook",
    author: "Community Notes",
    category: "System Design & DevOps",
    resourceType: "Notes",
    cover: "/images/books/system-design-illustrated-handbook.webp",
    pdf: "/pdfs/SystemDesignIllustratedHandbook.pdf",
    description: "Visual guide to system design patterns and case studies: designing URL shorteners, notification systems, rate limiters, distributed caches, and chat architectures.",
    year: 2024,
    pages: 50,
    language: "English",
    rating: 4.8,
    tags: ["System Design", "Architecture", "Case Studies", "Rate Limiter", "Distributed Systems", "Interview Prep"]
  },
  {
    rawFile: "👉 SQL Notes for Interview Preparation.pdf",
    canonicalFile: "SQLInterviewPreparationQuickNotes.pdf",
    id: "sql-interview-quick-cheatsheet",
    title: "SQL Interview Preparation Quick Cheatsheet",
    author: "Community Notes",
    category: "DBMS & SQL",
    resourceType: "CheatSheet",
    cover: "/images/books/sql-interview-quick-cheatsheet.webp",
    pdf: "/pdfs/SQLInterviewPreparationQuickNotes.pdf",
    description: "Quick last-minute SQL revision sheet covering key clauses, execution order, window function syntax, aggregate shortcuts, and top interview query snippets.",
    year: 2024,
    pages: 3,
    language: "English",
    rating: 4.7,
    tags: ["SQL", "Cheat Sheet", "Interview Prep", "Quick Revision", "DBMS", "Queries"]
  }
];

// 1. Rename PDF files in public/pdfs/
console.log("\n--- Renaming PDF files to canonical CamelCase ---");
for (const item of technicalMappings) {
  const oldPath = path.join(pdfsDir, item.rawFile);
  const newPath = path.join(pdfsDir, item.canonicalFile);
  
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`[RENAMED] "${item.rawFile}" -> "${item.canonicalFile}"`);
  } else if (fs.existsSync(newPath)) {
    console.log(`[EXISTS] "${item.canonicalFile}"`);
  } else {
    console.error(`[ERROR] File not found: "${item.rawFile}"`);
  }
}

// 2. Build new resources objects (excluding rawFile and canonicalFile helper fields)
const newBookObjects = technicalMappings.map(item => ({
  id: item.id,
  title: item.title,
  author: item.author,
  category: item.category,
  resourceType: item.resourceType,
  cover: item.cover,
  pdf: item.pdf,
  description: item.description,
  year: item.year,
  pages: item.pages,
  language: item.language,
  rating: item.rating,
  featured: false,
  tags: item.tags,
  excerpt: item.description.slice(0, 120) + "..."
}));

// 3. Append to existing books
const combinedBooks = [...existingBooks, ...newBookObjects];

console.log(`\nOriginal books: ${existingBooks.length}`);
console.log(`Newly added technical resources: ${newBookObjects.length}`);
console.log(`Total combined books: ${combinedBooks.length}`);

// Write back to books.json
fs.writeFileSync(booksJsonPath, JSON.stringify(combinedBooks, null, 2), 'utf8');
console.log(`[OK] Updated ${booksJsonPath} successfully!`);

