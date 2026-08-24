const fs = require("fs");
const path = require("path");

function getPart1() {
  return `================================================================================
                    READER'S HUB — ENGINEERING DOSSIER
                  COMPLETE SYSTEM ARCHITECTURE & INTERVIEW GUIDE
================================================================================
Document Version  : 2.0 (Production Verified)
Language Style    : English Technical Terminology + Intuitive Hinglish Explanations
Target Audience   : Senior Software Engineers, Technical Interviewers & System Architects
Project Repository: https://github.com/amandubey923/library-optimized.git
Last Verification : August 2026

================================================================================
                               TABLE OF CONTENTS
================================================================================
 1. PROJECT OVERVIEW
 2. TECH STACK & VERIFIED INVENTORY
 3. COMPLETE REPOSITORY FOLDER STRUCTURE
 4. SYSTEM ARCHITECTURE & SUBSYSTEM DEEP-DIVE
 5. COMPLETE END-TO-END USER FLOW
 6. BOOK DATA ARCHITECTURE & CATALOG SCHEMA
 7. PDF STORAGE & HIGH-PERFORMANCE RENDERING PIPELINE
 8. READING EXPERIENCE & CORE READER SUBSYSTEMS
 9. FOCUS READING SESSION ENGINE
10. READING TIME vs ACTIVE TIME (MATHEMATICAL INVARIANTS)
11. DIYA & DAILY STREAK ENGINE
12. LOCAL STORAGE ARCHITECTURE & CACHING
13. LOCAL-FIRST PRIVACY ARCHITECTURE
14. STATE MANAGEMENT & CONTEXT ARCHITECTURE
15. PERFORMANCE ENGINEERING & RUNTIME OPTIMIZATIONS
16. EXCALIDRAW-LEVEL VECTOR ANNOTATION ENGINE
17. CONTEXTUAL AI TRANSLATION SUBSYSTEM
18. COMMAND PALETTE & REAL-TIME SEARCH
19. LOCAL USER PROFILE & READING ANALYTICS ENGINE
20. PROGRESSIVE WEB APP (PWA) & OFFLINE CACHE
21. DELTA INGESTION PIPELINE (BATCH & WATCHDOG)
22. GIT LFS & LARGE ASSET MANAGEMENT
23. ERROR BOUNDARIES, FAULT TOLERANCE & RECOVERY
24. SECURITY BOUNDARIES & SECRET ISOLATION
25. ACCESSIBILITY (A11Y) & RESPONSIVE DESIGN
26. MODULARITY & SEPARATION OF CONCERNS
27. APPLIED DESIGN PATTERNS
28. HIGH-LEVEL & SUBSYSTEM SYSTEM DESIGN DIAGRAMS
29. SYSTEM DATA FLOWS
30. "WHY THESE TECHNOLOGIES?" (ARCHITECTURAL DECISION RECORDS)
31. REAL-WORLD PRODUCTION CHALLENGES & ROOT-CAUSE ANALYSES
32. NOTABLE BUGS & ARCHITECTURAL LESSONS
33. TESTING SUITE & QA VERIFICATION
34. VERIFIED PERFORMANCE BENCHMARKS & BUILD METRICS
35. FUTURE ARCHITECTURAL ROADMAP
36. SCALABILITY MATRIX (100 -> 10,000+ BOOKS)
37. ARCHITECTURAL TRADE-OFFS & DEFENSES
38. 50+ COMPREHENSIVE INTERVIEW QUESTIONS & ANSWERS
39. RAPID-FIRE INTERVIEW CHEAT SHEET
40. 60-SECOND PROJECT ELEVATOR PITCH
41. 5-MINUTE DEEP-DIVE TECHNICAL PRESENTATION SCRIPT
42. INTERVIEWER FOLLOW-UP TRAPS & DEFENSIVE STRATEGIES
43. COMPREHENSIVE PROJECT GLOSSARY

================================================================================
1. PROJECT OVERVIEW
================================================================================

What is Reader's HUB?
--------------------
Reader's HUB is a modern, privacy-first, local-first digital library and PDF reading 
platform. Built on Next.js 16 (Turbopack) and React 19, it combines digital book 
discovery with an embedded canvas-based PDF reader, vector annotations, Diwali 
Diya streak gamification, distraction-free Focus Mode sessions, AI translation, 
and client-side reading analytics.

What Problem Does It Solve?
---------------------------
Traditional PDF readers in web browsers are static, memory-heavy, and disconnected 
from personal reading habits. When users read PDFs in browser default viewers:
1. Reading history, progress, notes, and highlights are not structured.
2. There is no motivation system (streak/daily habit tracking).
3. Distractions break reading flow.
4. Language barriers in complex books require switching tabs to translation tools.
Reader's HUB solves this by bringing an Excalidraw-grade study tool, a Pomodoro-style 
Focus Session, contextual multi-language translation, and a 100% private local analytics 
dashboard into one cohesive, high-performance web application.

Target User:
------------
Students, researchers, lifelong readers, and engineers who study long-form PDF books, 
technical documentation, philosophy treatises, and classics, requiring private 
reading telemetry without creating server-side accounts or syncing data to third-party 
clouds.

What Makes It Different from a Simple PDF Viewer?
-------------------------------------------------
| Feature | Simple PDF Viewer | Reader's HUB |
| :--- | :--- | :--- |
| Rendering Engine | Native browser embed/iframe | Dedicated PDF.js worker on HTML5 Canvas |
| State Persistence | Lost on tab close | Local-first namespaced storage with in-memory caching |
| Drawing & Notes | Flat bitmap / none | Vector-based object model with selection, drag & resize |
| Reading Habits | No habit tracking | Diwali Diya streak (15m goal) + 53-week reading heatmap |
| Focus System | Standard full-screen | Fullscreen + reversible countdown + exit warning guard |
| Translation | External copy-paste | Contextual in-reader translation into Hindi & Hinglish |
| User Privacy | Often tracks telemetries | Zero logins, zero trackers, 100% on-device calculations |

Main Product Philosophy:
------------------------
"Privacy-First, Local-First, Zero-Friction Reading."
Har reading session user ki personal property hai. Bina login, email, ya password maange, 
application user ke browser me hi ek complete reading ecosystem build karti hai.

Interview Answers:
------------------
A) 30-Second Interview Answer:
"Reader's HUB is a local-first digital library and PDF study platform built with Next.js 16 
and React 19. It renders 360+ curated books via an optimized PDF.js canvas pipeline, 
offering vector annotations, contextual AI translation, a 15-minute daily Diwali Diya 
reading streak, and a 100% client-side reading analytics dashboard—all running privately 
in the browser without backend user accounts."

B) 1-Minute Interview Answer:
"Reader's HUB is engineered to transform static PDF reading into an interactive, habit-forming 
study experience. Architecturally, it is divided into a SSG catalog layer rendering 360+ books, 
a canvas-based PDF.js reader with render-cancellation and DPI scaling, an Excalidraw-like 
vector annotation engine, and a centralized local storage layer. It solves common web reader 
bottlenecks like canvas memory bloat, render race conditions on rapid page flips, and React 
re-render loops. The platform includes a strict invariant timing engine that differentiates 
genuine PDF reading time from site exploration, powering a living Diwali Diya streak and 
profile analytics dashboard without requiring cloud databases."

C) 2-Minute Detailed Answer:
"When designing Reader's HUB, our core objective was building a production-grade reading 
platform that provides an desktop-app-like experience inside the browser. We chose Next.js 16 
App Router with static site generation for 377 routes to guarantee sub-millisecond page loads. 
For reading, instead of using laggy iframes, we built a custom reader over PDF.js with dedicated 
web workers, rendering spreads directly to HTML5 Canvases with devicePixelRatio normalization 
and AbortController-driven render cancellation.

We engineered three standout systems:
First, a Vector Annotation Canvas supporting freeform pen strokes, geometric shapes with 
8-point resize handles, and draggable text, all stored as normalized 0-to-1 coordinates so 
drawings scale perfectly across any viewport, DPI, or zoom level.
Second, a strict Timing Engine enforcing the invariant that Active Time >= Reading Time, 
preventing double-counting while reading and driving a daily Diwali Diya streak.
Third, a Delta Ingestion Pipeline in TypeScript that hashes PDFs with SHA-256 to automatically 
extract metadata, generate WebP covers via Sharp, and update the catalog in seconds. 
Everything is 100% private, accessible offline via Service Workers and CacheStorage."

Hinglish Explanation:
---------------------
"Reader's HUB ek aisi digital library hai jo browser me hi ek premium study environment 
create karti hai. Normally PDF padhte waqt progress kho jati hai aur notes lene ke liye 
doosra software chahiye hota hai. Reader's HUB me book kholte hi PDF.js canvas pe render hoti hai, 
aap Excalidraw ki tarah arrows, notes aur shapes draw kar sakte ho, aur 15 minute padhne pe 
Diwali Diya jalta hai jo daily streak maintain karta hai. Sabse special baat ye hai ki isme koi 
login ya database nahi hai—pura data user ke browser ke localStorage me encrypted and cached 
rehta hai, jisse privacy 100% secure rehti hai."

Intentionally NOT Included:
---------------------------
- No cloud authentication (no Cognito, Auth0, Firebase, or Supabase).
- No relational user database server (no Postgres, MongoDB, MySQL).
- No paid paywalls or ad tracking telemetry.

================================================================================
2. TECH STACK & VERIFIED INVENTORY
================================================================================

| Technology | Version | Purpose in Codebase | Architectural Justification |
| :--- | :--- | :--- | :--- |
| Next.js | 16.2.1 | Core Framework, App Router, SSG & API routes | 377 static routes generated at build time; fast serverless API routes for AI translation and contact |
| React & React-DOM | 19.2.4 | UI Component Engine, Context & Hooks | React 19 concurrent features, optimized reconciliation, fine-grained state management |
| TypeScript | 5.x | Strict Type Checking & Interface Contracts | Comprehensive interfaces for Storage, Annotations, Timing, and Catalog; 0 build errors |
| Tailwind CSS | 4.x | Utility-first Theme Styling & Animations | PostCSS v4 engine; CSS variable-driven theme system with custom keyframes |
| @google/genai | 2.18.0 | Server-side AI Translation & Assistant | Gemini 2.5 / 3.5 multi-model fallback in API route for literary page translation |
| pdfjs-dist | 6.2.108 | Client-side PDF Parsing & Canvas Renderer | Dedicated web worker execution; off-main-thread binary PDF decoding and canvas rasterization |
| sharp | 0.35.3 | High-Performance Cover Image Generation | Fast C++ libvips binding used in delta ingestion scripts to generate WebP covers |
| pdf-lib & pdf-parse | 1.17.1 / 2.4.5 | Server-side PDF Metadata & Page Extraction | Inspects unindexed PDF byte streams, extracts page counts, titles, and text layers |
| chokidar | 5.0.0 | File Watchdog for Ingestion | Watches public/pdfs/ for hot addition of new books in development mode |
| tsx | 4.23.12 | TypeScript Script Execution Runner | Executes standalone automation scripts (ingest-batch.ts, QA test suites) |
| LocalStorage & Cache API | Browser Native | Client-side Persistence & Offline PDF Storage | Zero-latency reads with in-memory caching Map layer; CacheStorage for offline PDFs |

================================================================================
3. COMPLETE REPOSITORY FOLDER STRUCTURE
================================================================================

Reader's HUB/
├── app/                                # Next.js 16 App Router (Pages & API routes)
│   ├── about/page.tsx                  # About Reader's HUB & Mission
│   ├── api/
│   │   ├── chat/route.ts               # Gemini-powered conversational assistant API
│   │   ├── contact/route.ts            # Nodemailer / Resend feedback pipeline
│   │   └── translate/route.ts          # Server-side Gemini multi-page translation API
│   ├── book/[id]/
│   │   ├── page.tsx                    # Static SSG route pre-generating 363+ book detail pages
│   │   └── BookDetailClient.tsx        # Client orchestrator for Book details, reader & memory
│   ├── contact/page.tsx                # Contact & reader inquiry page
│   ├── favorites/page.tsx              # "My Shelf" — Reading history, favorites, goal tracker & recovery
│   ├── library/page.tsx                # Catalog browser with multi-filter, search & category pills
│   ├── profile/page.tsx                # Local User Profile & Reading Analytics Dashboard
│   ├── globals.css                     # Design tokens, themes (Dracula, Luxury, etc.), keyframe animations
│   ├── layout.tsx                      # Root layout wrapping ThemeProvider & LibraryProvider
│   ├── not-found.tsx                   # Customized 404 error screen
│   ├── page.tsx                        # Homepage: Hero, Featured Carousel, Continue Reading, Categories
│   ├── robots.ts                       # Search engine crawler instructions
│   └── sitemap.ts                      # Dynamic XML sitemap generator covering all 363+ books
│
├── components/                         # Modular React UI Components
│   ├── about/                          # Mission cards, stats counters, value pillars
│   ├── assistant/                      # AI Study Assistant chat modal
│   ├── memory/                         # BookReadingMemory modal (timeline, replay, stats)
│   ├── reader/                         # Core PDF reading components
│   │   ├── AnnotationDrawer.tsx        # Floating toolbar for tools, colors, widths & stroke inspector
│   │   ├── BookReader.tsx              # Monolithic, high-speed Canvas reader (135KB production-hardened)
│   │   ├── DrawingCanvas.tsx           # Object-based vector canvas (pen, shapes, text, arrows, selection)
│   │   └── TranslationDrawer.tsx       # Split-pane & drawer translation viewer with copy & speech
│   ├── visual/                         # Ambient visual effects and design components
│   │   ├── AmbientEffects.tsx          # Particle canvas & background glow
│   │   ├── CardTilt.tsx                # 3D interactive tilt effect on book cards
│   │   ├── CustomCursor.tsx            # Theme-aware custom pointer
│   │   ├── DiwaliDiya.tsx              # Living animated flame Diya with 7-day streak popover
│   │   ├── Hero3DLayer.tsx             # 3D layered parallax illustration on homepage
│   │   ├── NavbarThemeControl.tsx      # Top-right quick theme switcher
│   │   ├── ReadingUniverse.tsx         # Interactive constellation background
│   │   ├── ThemeProvider.tsx           # CSS variable theme provider
│   │   └── ThemeSwitcher.tsx           # Full theme picker modal
│   ├── BookCard.tsx                    # Book item card with 3D tilt, cover image, category & progress
│   ├── CategoryPills.tsx               # Horizontal scrolling category filter
│   ├── ContinueReading.tsx             # In-progress books shelf on homepage
│   ├── FeaturedCarousel.tsx            # Curated book highlight carousel
│   ├── Footer.tsx                      # Global footer with links, copyright & privacy pledge
│   ├── HeroVideo.tsx                   # Video / dynamic visual background for hero section
│   ├── Logo.tsx                        # Custom SVG Reader's HUB logo with book & flame icon
│   ├── Navbar.tsx                      # Global sticky navbar with search, Diya, Profile & theme controls
│   ├── PdfReader.tsx                   # Lightweight dynamic wrapper for reader
│   ├── SearchModal.tsx                 # Command Palette (Cmd+K) with live search and quick actions
│   └── Toast.tsx                       # Global notification toast renderer
│
├── context/
│   └── LibraryContext.tsx              # Central state engine managing favorites, history, streak & timers
│
├── data/
│   ├── books.json                      # Master database of 363 book records with metadata, hashes & tags
│   └── books.ts                        # TypeScript bindings, category definitions & helper queries
│
├── lib/                                # Core Utility & Business Logic Engines
│   ├── library-assistant.ts            # Client helpers for assistant queries
│   ├── pageSound.ts                    # Synthesized Web Audio API page-flip sound generator
│   ├── reader-storage.ts               # Storage layer, caching, schema migrations & telemetry math
│   ├── reading-analytics.ts            # Pure analytical computation engine for profile dashboard
│   └── translator.ts                   # Client-side translation manager with in-memory DJB2 hash caching
│
├── public/                             # Static Assets
│   ├── images/books/                   # 363+ optimized WebP/JPEG book covers
│   ├── pdfs/                           # 363+ physical PDF books (~1.65 GB catalog)
│   ├── vendor/pdfjs/                   # Local standalone PDF.js library & web worker files
│   └── manifest.json                   # PWA web app manifest
│
├── scripts/                            # Delta Ingestion & Automation Tooling
│   ├── ingest/                         # Modular ingestion engine (scanner, naming, metadata, covers, writer)
│   ├── create-sample-inbox.ts          # Generates test inbox for automated testing
│   ├── import-books.ts                 # Full ingestion script
│   ├── ingest-batch.ts                 # CLI entry point for batch delta processing
│   └── watch-books.ts                  # Hot-folder file watcher daemon
│
└── scratch/                            # Automated QA Test Suites (100% verified test runners)

================================================================================
4. SYSTEM ARCHITECTURE & SUBSYSTEM DEEP-DIVE
================================================================================

High-Level Architecture Diagram:
--------------------------------

 ┌───────────────────────────────────────────────────────────────────────────┐
 │                                BROWSER                                    │
 │                                                                           │
 │  ┌─────────────────────────────────────────────────────────────────────┐  │
 │  │                       PRESENTATION LAYER (UI)                       │  │
 │  │  Homepage  │  Library Catalog  │  My Shelf  │  Profile Dashboard    │  │
 │  └───────────────────────────────────┬─────────────────────────────────┘  │
 │                                      │                                    │
 │  ┌───────────────────────────────────▼─────────────────────────────────┐  │
 │  │                      READER & STUDY SUBSYSTEM                       │  │
 │  │  ┌────────────────────────┐  ┌───────────────────────────────────┐  │  │
 │  │  │   BookReader Engine    │  │   DrawingCanvas (Vector Engine)   │  │  │
 │  │  │   - Canvas Rendering   │  │   - Pen, Highlighter, Shapes      │  │  │
 │  │  │   - DPI Scaling        │  │   - 8-Point Resize Handles        │  │  │
 │  │  │   - Render Cancel      │  │   - Normalized 0-1 Coordinates    │  │  │
 │  │  └───────────┬────────────┘  └─────────────────┬─────────────────┘  │  │
 │  │              │                                 │                    │  │
 │  │  ┌───────────▼────────────┐  ┌─────────────────▼─────────────────┐  │  │
 │  │  │  Focus Session Engine  │  │    Contextual AI Translation      │  │  │
 │  │  │  - 15/30/45m Countdown │  │    - Text Layer Extraction        │  │  │
 │  │  │  - Exit Protection     │  │    - In-Memory DJB2 Cache         │  │  │
 │  │  └───────────┬────────────┘  └─────────────────┬─────────────────┘  │  │
 │  └──────────────┼─────────────────────────────────┼────────────────────┘  │
 │                 │                                 │                       │
 │  ┌──────────────▼─────────────────────────────────▼────────────────────┐  │
 │  │                    CENTRAL STATE & TIMING LAYER                     │  │
 │  │                         (LibraryContext)                            │  │
 │  │   - Reading Time (T)   │  - Exploration Time   │  - Active Time     │  │
 │  │   - Diwali Diya Streak │  - Book Reading Memory│  - Favorites       │  │
 │  └───────────────────────────────────┬─────────────────────────────────┘  │
 │                                      │                                    │
 │  ┌───────────────────────────────────▼─────────────────────────────────┐  │
 │  │                   LOCAL PERSISTENCE & CACHING LAYER                 │  │
 │  │                       (reader-storage.ts)                           │  │
 │  │   - In-Memory Map Layer (Zero JSON Overhead)                        │  │
 │  │   - Namespaced LocalStorage Schemas                                 │  │
 │  │   - CacheStorage API (Offline PDF Blobs)                            │  │
 │  └─────────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────┬────────────────────────────────────┘
                                        │ (Optional Translation / Chat Only)
                                        ▼
                         ┌─────────────────────────────┐
                         │   Next.js API Gateway       │
                         │   (/api/translate, /chat)   │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   Google Gemini AI Engine   │
                         └─────────────────────────────┘

Subsystems Breakdown:
---------------------
1. Presentation Layer: Next.js 16 App Router. Pages are pre-rendered at build time (SSG). 
   Interactive components use client boundaries ("use client").
2. Reader Layer: High-performance canvas-based rendering using PDF.js worker. Manages 
   virtual viewport, single/dual page spread rendering, DPI scaling, and touch gestures.
3. Vector Annotation Layer: HTML5 Canvas overlay operating over normalized (0 to 1) 
   coordinates. Supports multi-tool drawing, geometric shapes, 8-point bounding boxes, 
   and inline text.
4. Central State Layer (LibraryContext): Single source of truth for all global telemetry, 
   reading progress, streak calculation, and active timers.
5. Storage Layer (reader-storage.ts): Encapsulated repository pattern with in-memory 
   Map caching to prevent JSON parse overhead on frequent timer updates.
6. Translation Layer: Extracts text directly from the PDF text layer and sends it to 
   /api/translate, caching responses deterministically with DJB2 string hashes.

================================================================================
5. COMPLETE END-TO-END USER FLOW
================================================================================

Step-by-Step Execution Lifecycle:
---------------------------------

User Lands on Website (/)
       │
       ▼
Hydration & LocalStorage Warm-up:
- LibraryProvider mounts.
- reader-storage.ts populates in-memory Map caches from localStorage.
- Streak data, today's reading time, and active website time are computed.
       │
       ▼
Catalog Discovery & Search (/library or Cmd+K):
- User filters by Category (e.g., "Classics", "Philosophy") or types in SearchModal.
- Search query performs real-time multi-attribute matching across titles, authors, and tags.
       │
       ▼
Book Selection (/book/[id]):
- Static HTML loaded instantly (pre-generated via generateStaticParams).
- BookDetailClient mounts; verifies previous reading page and loads saved annotations.
       │
       ▼
Reader Initialization (BookReader.tsx):
- Standalone PDF.js worker loaded asynchronously from /vendor/pdfjs/pdf.worker.min.js.
- PDF binary fetched from /pdfs/<filename>.pdf (or retrieved from CacheStorage if offline).
- Page viewport computed based on container width and device pixel ratio (window.devicePixelRatio).
       │
       ▼
Canvas Rasterization & Rendering:
- Page viewport renders to HTML5 Canvas.
- Previous pending render tasks are cancelled via renderTask.cancel() to prevent race conditions.
- Vector annotations for that page are loaded from reader-storage and drawn on top.
       │
       ▼
Active Reading & Invariant Telemetry Tracking:
- Reader checks user activity every 1 second. If active within 3-minute idle window:
  -> Genuine Reading Time (T) increments by 1 second.
  -> Every 5 seconds, time flushes to readershub:reading-activity:v1 and readershub:memory:v1:<id>.
  -> If T >= 15 minutes (900 seconds), Diwali Diya flame lights up and daily streak qualifies.
       │
       ▼
Study & Annotation:
- User selects Pen, Highlighter, Arrow, Shape, or Text.
- Objects are placed using normalized coordinates (0-1) and saved to localStorage.
- User opens Translation Drawer -> Current page text extracted and translated into Hindi/Hinglish.
       │
       ▼
Focus Session (Optional):
- User selects 15m, 30m, or 45m.
- Browser enters Fullscreen and Focus Mode; reverse countdown begins.
- Exit protection prevents accidental cancellation.
       │
       ▼
Session Review & Profile Analytics (/profile):
- User opens Profile page.
- Analytics engine aggregates all daily reading sessions into 53-week heatmap, genre breakdown, 
  and reading habits without sending any data to external servers.

================================================================================
6. BOOK DATA ARCHITECTURE & CATALOG SCHEMA
================================================================================

Master Catalog Location:
------------------------
Primary: data/books.json (363 verified book objects)
TypeScript Definitions: data/books.ts

Sanitized Book Object Schema:
-----------------------------
{
  "id": "1984",
  "title": "1984",
  "author": "George Orwell",
  "category": "Fiction & Dystopian",
  "cover": "/images/books/1984.jpeg",
  "pdf": "/pdfs/1984GeorgeOrwell.pdf",
  "description": "A chilling prophecy about the future where the Party and Big Brother monitor every movement and thought. Winston Smith struggles against omnipresent surveillance and totalitarian control in a world where truth is rewritten daily.",
  "year": 1949,
  "pages": 328,
  "language": "English",
  "rating": 4.8,
  "featured": true,
  "tags": [
    "Dystopian",
    "Classics",
    "Political Fiction",
    "Surveillance"
  ],
  "excerpt": "War is peace. Freedom is slavery. Ignorance is strength.",
  "fileHash": "d53c42029872588bad85208db8a72bc3c18e93c6dba5e7cfaff14734b35db229"
}

Field Explanations:
-------------------
- id: URL-safe kebab-case unique identifier (e.g. crime-and-punishment, 1984).
- title: Clean canonical title of the book.
- author: Primary author name.
- category: Primary classification (e.g., "Classics", "Philosophy & Spirituality", "Technical Knowledge").
- cover: Absolute public path to the optimized WebP/JPEG cover asset.
- pdf: Absolute public path to the PDF binary file in public/pdfs/.
- description: 2-4 sentence summary of the book.
- year: Publication year.
- pages: Total page count extracted during delta ingestion.
- rating: Editorial rating on a 5.0 scale.
- featured: Boolean flag determining placement in homepage curated carousel.
- tags: Search keywords for the Command Palette.
- fileHash: SHA-256 hash of the PDF file to ensure strict deduplication during ingestion.

How /book/[id] Works:
-----------------------
In app/book/[id]/page.tsx, Next.js executes generateStaticParams() at build time:
export async function generateStaticParams() {
  return BOOKS.map((book) => ({ id: book.id }));
}
This pre-renders all 363 book detail routes to static HTML during npm run build, resulting in 
0ms server latency on page navigation.

================================================================================
7. PDF STORAGE & HIGH-PERFORMANCE RENDERING PIPELINE
================================================================================

PDF Pipeline Diagram:
---------------------

  PDF File (/pdfs/*.pdf)
           │
           ▼
  PDF.js Standalone Worker (pdf.worker.min.js)
           │ (Off-Main-Thread Binary Parsing)
           ▼
  PDFDocumentProxy (pdfDocRef.current)
           │
           ▼
  Page Calculation (getPage(pageNum))
           │
           ▼
  Viewport & DPI Normalization:
  - scale = (containerWidth / page.width) * (zoom / 100)
  - dpr = Math.min(window.devicePixelRatio || 1, 2.5)
  - canvas.width = viewport.width * dpr
  - canvas.height = viewport.height * dpr
  - ctx.scale(dpr, dpr)
           │
           ▼
  Render Task Execution (page.render({ canvasContext, viewport })):
  - If previous render in progress: activeRenderTask.cancel()
  - Catch RenderingCancelledException silently
           │
           ▼
  Render Completed -> Vector Annotations Painted on Overlay Canvas

Why PDF.js on HTML5 Canvas Instead of Native Browser <iframe embed>?
----------------------------------------------------------------------
1. Complete UI Control: Native iframes display browser-specific toolbars (Chrome, Safari, Firefox 
   all look different) and prevent custom dark mode styling.
2. In-Reader Annotations: Canvases allow pixel-perfect overlay of vector drawings, highlights, 
   and notes directly synchronized with the page coordinate system.
3. Single & Dual Spread Mode: Native embeds cannot easily render dual-page book spreads with 
   custom page-flip animations.
4. Text Extraction for Translation: PDF.js provides direct programmatic access to page text 
   tokens via page.getTextContent().

RenderTask Cancellation & Rapid Flip Safety:
--------------------------------------------
When a user presses the Right Arrow key rapidly, multiple page render requests can fire in 
milliseconds. In PDF.js, drawing to a canvas while another render task is actively writing to it 
throws a CanvasGraphics conflict error.
Reader's HUB solves this by maintaining a reference map of active render tasks:
if (renderTasksRef.current[pageKey]) {
  try {
    renderTasksRef.current[pageKey].cancel();
  } catch {
    // Ignore cancellation
  }
}
const renderTask = page.render(renderContext);
renderTasksRef.current[pageKey] = renderTask;

If a render task is cancelled, the RenderingCancelledException is caught gracefully and the 
canvas is recycled for the new page without visual tearing or memory leaks.

================================================================================
8. READING EXPERIENCE & CORE READER SUBSYSTEMS
================================================================================

| Feature | Implementation Details | Storage Key | Performance Mechanism |
| :--- | :--- | :--- | :--- |
| Single / Dual Page Mode | Automatic dual-page spread on desktop (>=1024px); single page on mobile/tablet | readershub_reader_prefs_v1 | Canvas layout recalculation without reloading document |
| Zoom Control | 70% to 150% with 10% steps | readershub_reader_prefs_v1 | CSS scale preview with debounced canvas re-rasterization |
| Keyboard Navigation | ArrowLeft/ArrowRight for pages, Space for next, F for Focus, T for Translate | In-memory event listeners | Debounced input handling preventing event flood |
| Page Audio Synthesizer | Procedural page-turn sound synthesized via Web Audio API oscillators | None (0 KB asset) | Zero external audio asset downloads; synthesized in real time |
| Table of Contents | PDF Outlines extracted via pdfDoc.getOutline() | In-memory ref | Extracted once per book load |
| Bookmarks System | Save page with custom label | readershub:bookmarks:v1:<bookId> | Instant bookmark drawer lookup with jump-to-page |
| Text Highlighter | Amber, Mint, Cyan, Purple text markers | readershub:annotations:v1:<bookId> | Selection bounding rects saved with character offsets |
| Study Notes | Page-specific margin notes with timestamp | readershub:annotations:v1:<bookId> | Filterable note sidebar with live update |

================================================================================
9. FOCUS READING SESSION ENGINE
================================================================================

Focus Session Lifecycle Diagram:
--------------------------------

  User Clicks "Start Session"
               │
               ▼
  Select Duration: [ 15 min ]  [ 30 min ]  [ 45 min ]
               │
               ▼
  Session Initialized:
  - activeSession state set
  - Focus Mode activated (UI distraction chrome hidden)
  - Browser Fullscreen requested (element.requestFullscreen())
  - Reverse Countdown Timer started
               │
               ▼
  Draggable Floating Timer Overlay:
  - Rendered in portal inside reader viewport
  - Position persisted to readershub_focus_timer_prefs_v1
  - Dragging uses direct transform (zero React re-renders)
               │
               ▼
  Exit Protection Guard:
  - User presses Escape / clicks Exit -> Intercepted
  - Dialog: "Exit Focus Session? Unfinished time will not count towards session completion."
  - User can [ Resume ] or [ Confirm Exit ]
               │
               ▼
  Session Complete (00:00 reached):
  - Success sound & celebration dialog
  - Session logged to readershub:memory:v1:<bookId> timeline
  - Fullscreen restored

Why Abandoned Sessions Do Not Count Towards Session Goals:
---------------------------------------------------------
Hinglish Explanation:
"Agar user 30 minute ka session start kare aur 3 minute baad quit kar de, toh session complete 
nahi maana jayega. Par jo 3 minute usne actual PDF padhi hai, wo uske daily Reading Time (T) 
me add hogi taaki uska time waste na ho. Lekin structured session completion event tabhi fire 
hoga jab countdown 00:00 reach kare."

================================================================================
10. READING TIME vs ACTIVE TIME (MATHEMATICAL INVARIANTS)
================================================================================

Core Mathematical Model:
------------------------

T = Actual Genuine PDF / Book Reading Time

Reading Time === T
Diya / Streak Time === T
Total Active Time = T + Website Exploration Time
Active Time >= Reading Time (For all days and all-time totals)

Definitions:
------------
1. Genuine Reading Time (T): Time spent inside BookReader.tsx with the document visible, 
   not loading, and user interaction (mouse move, scroll, keypress, touch) detected within a 
   3-minute idle window.
2. Website Exploration Time: Meaningful active time spent browsing catalog, searching, reading 
   About page, or reviewing My Shelf outside the active PDF reader.
3. Total Active Time: The holistic sum of genuine reading plus website exploration.

Invariant Truth Table & Examples:
---------------------------------
| User Activity Scenario | Reading Time (T) | Diya / Streak Time | Exploration Time | Total Active Time | Diya Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. 20m Reading Only** | 20m | 20m | 0m | **20m** | LIT (>=15m) |
| **B. 30m Browsing Only** | 0m | 0m | 30m | **30m** | UNLIT |
| **C. 20m Reading + 10m Browsing** | 20m | 20m | 10m | **30m** | LIT (>=15m) |
| **D. 12m Book A + 8m Book B** | 20m | 20m | 0m | **20m** | LIT (>=15m) |

How Double-Counting is Prevented:
---------------------------------
In LibraryContext.tsx, the global site exploration interval tracks route pathname via pathnameRef:
const interval = setInterval(() => {
  const isReadingPdf = pathnameRef.current?.startsWith("/book/");
  if (document.visibilityState === "visible" && !isReadingPdf && isUserActive) {
    accumulatedSiteSecs += 1;
    // Flushes to explorationDaily in readershub:active-time:v1
  }
}, 1000);

Jab user /book/[id] pe book padh raha hota hai, isReadingPdf true ho jata hai. Global site 
tracker exploration time add karna band kar deta hai. Isse reading time aur exploration time 
kabhi ek saath tick nahi hote aur zero double-counting ensure hoti hai.

================================================================================
11. DIYA & DAILY STREAK ENGINE
================================================================================

What Does the Diwali Diya Represent?
------------------------------------
The Diya is a cultural and psychological habit-building token. It represents focused daily 
reading enlightenment.
- 0 to 14:59 minutes of daily reading: Diya remains unlit (calm clay lamp, no flame).
- 15:00+ minutes of daily reading (T >= 900s): Diya illuminates with an authentic, 
  animated CSS keyframe living flame and glowing ambient halo.

Streak Calculation Algorithm (lib/reader-storage.ts):
------------------------------------------------------
export function calculateStreak(dailyMap: Record<string, DailyReadingActivity>) {
  const todayKey = getLocalDateKey();
  const yesterdayKey = getPreviousDateKey(todayKey);
  
  let currentStreak = 0;
  let checkKey = dailyMap[todayKey]?.qualified ? todayKey : yesterdayKey;

  while (dailyMap[checkKey]?.qualified) {
    currentStreak++;
    checkKey = getPreviousDateKey(checkKey);
  }
  // longestStreak computed across entire historical record
  return { currentStreak, longestStreak };
}

Streak Grace Rule:
Agar user ne aaj abhi tak 15 minute complete nahi kiye, lekin kal complete kiye the, toh uska 
current streak break nahi hota. Wo aaj raat 11:59 PM tak 15 minute padh kar apna streak maintain 
kar sakta hai.
`;
}

module.exports = { getPart1 };
