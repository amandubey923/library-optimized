const fs = require("fs");
const path = require("path");

function getPart2() {
  return `================================================================================
12. LOCAL STORAGE ARCHITECTURE & CACHING
================================================================================

Complete Storage Inventory:
---------------------------
| Storage Key | Data Structure | Purpose | Cache Layer |
| :--- | :--- | :--- | :--- |
| readershub:reading-activity:v1 | ReadingStreakData (daily record map of seconds & qualified boolean) | Daily reading time T, current streak, longest streak | Memory Map |
| readershub:active-time:v1 | WebsiteActiveTimeData (totalActive, daily active & exploration maps) | Total composite active website usage telemetry | Memory Map |
| readershub:progress:v1:<bookId> | ReadingProgressData ({ page, totalPages, progress, lastReadAt }) | Last read page position and progress percentage | progressCache |
| readershub:annotations:v1:<bookId> | BookAnnotations ({ highlights, notes, drawings, bookmarks }) | All vector strokes, highlights and margin notes | annotationsCache |
| readershub:bookmarks:v1:<bookId> | BookmarkItem[] | Dedicated bookmark list for fast drawer retrieval | bookmarksCache |
| readershub:memory:v1:<bookId> | BookReadingMemory ({ totalSeconds, sessionsCount, timeline }) | Per-book lifetime reading memory & session timeline | memoryCache |
| readers_hub_favorites_v2 | string[] (Array of book IDs) | Favorited books saved to "My Shelf" | Context state |
| readers_hub_reading_progress_v2 | ReadingProgressItem[] (Max 16 recent items) | "Continue Reading" shelf on homepage and My Shelf | Context state |
| readershub_reader_prefs_v1 | ReaderPrefs ({ zoom, spreadMode, singlePageMode }) | User reading layout preferences | Component state |
| readershub_focus_timer_prefs_v1 | { x: number, y: number } | Floating focus timer window coordinates | Component state |
| readershub-theme | string ("dracula" | "luxury" | "sepia" | ...) | Global theme identifier applied to <html> | ThemeProvider |
| readershub-offline-books-v1 | CacheStorage binary blobs | Offline cached PDF documents | Browser Cache API |

Storage Quota & Corruption Protection:
--------------------------------------
1. In-Memory Write-Through Caching: Every read first hits high-speed in-memory JavaScript Maps. 
   LocalStorage is only accessed on initialization and updated on debounced writes.
2. Corrupted JSON Tolerance: All parsing is wrapped in try / catch blocks with fallback defaults. 
   If a key contains malformed JSON, it is safely repaired without crashing the application.
3. Quota Exceeded Defense: If browser storage quota is hit, non-critical telemetry writes fail 
   gracefully without breaking active PDF reading.

================================================================================
13. LOCAL-FIRST PRIVACY ARCHITECTURE
================================================================================

Why Local-First?
----------------
1. Zero Data Harvesting: User ki reading habits, highlights, notes aur daily time trackings 
   kisi server pe transmit nahi hoti.
2. Instant Offline Availability: Internet disconnect hone par bhi saved books, bookmarks aur 
   analytics 100% functional rehte hain.
3. Zero Account Friction: User ko sign up, OTP, ya password yaad rakhne ki zaroorat nahi. 
   Website open karte hi unki personal library ready hoti hai.

Backup & Portability:
---------------------
To prevent data loss on browser cache clear, favorites/page.tsx provides a JSON Export & Import 
engine (exportAllUserData() / importUserData()). Users can download their entire library 
telemetry as a single .json backup file and restore it on any device in one click.

================================================================================
14. STATE MANAGEMENT & CONTEXT ARCHITECTURE
================================================================================

Why React Context API?
----------------------
Reader's HUB uses LibraryContext located in context/LibraryContext.tsx.
Reasons for choosing Context API over Redux / Zustand:
1. Native React Integration: Zero external runtime dependencies.
2. Scoped Telemetry: Shared state (favorites, recent history, active timer, toast) is 
   consumed across 15+ components without prop-drilling.
3. Stable Action References: All mutation functions (recordReading, toggleFavorite, refreshStats) 
   are memoized with useCallback to guarantee stable reference identities.

Preventing Context Re-Render Cascades:
--------------------------------------
A common pitfall with React Context is that all consumers re-render whenever any value in the 
context changes.
How Reader's HUB solves this:
1. Context value object is wrapped in a strict useMemo block with granular dependency arrays.
2. Telemetry setters are decoupled from animation loops.
3. recordReading checks whether page, totalPages, and progress have actually changed 
   before dispatching state updates, preventing infinite render loops.

================================================================================
15. PERFORMANCE ENGINEERING & RUNTIME OPTIMIZATIONS
================================================================================

Summary of Key Optimizations:
-----------------------------

1. Direct DOM Pointer Transforms on Mouse Movement:
   - Problem: Updating React state on every mousemove / pointermove event (60-120fps) causes 
     constant component re-rendering, virtual DOM diffing, and lag.
   - Solution: In CustomCursor.tsx and CardTilt.tsx, mouse coordinates update component useRefs 
     and write directly to element style.transform via requestAnimationFrame.
   - Result: 60 FPS silky-smooth mouse movements with 0 React renders.

2. PDF.js Render Cancellation on Rapid Page Turns:
   - Problem: Rapidly flipping pages fires multiple overlapping page.render() tasks on the same canvas, 
     causing memory spikes and browser crashes.
   - Solution: Active renderTask references are tracked in a ref map; previous tasks are cancelled 
     via task.cancel() before new pages render.
   - Result: Instant page flips with zero canvas corruption.

3. Standalone Vendor Worker Isolation:
   - Problem: Bundling PDF.js worker in main JavaScript bundle adds ~1.2 MB to initial page load.
   - Solution: Worker is hosted statically in public/vendor/pdfjs/pdf.worker.min.js and loaded 
     asynchronously in a dedicated browser thread only when the reader opens.
   - Result: Fast initial homepage loading.

4. Image Optimization via Next.js & Sharp:
   - All 363 book covers are converted to modern WebP formats and served through Next.js Image 
     Optimization with 30-day client cache TTLs.

================================================================================
16. EXCALIDRAW-LEVEL VECTOR ANNOTATION ENGINE
================================================================================

Architecture (components/reader/DrawingCanvas.tsx):
-----------------------------------------------------
The annotation subsystem is a full vector-based object model, NOT a flat pixel canvas.

Supported Object Types:
-----------------------
- pen: Freehand continuous path with smooth polyline Bezier interpolation.
- highlighter: Semi-transparent (opacity ~0.35) path with canvas multiply blend mode.
- line & arrow: Directed vectors with customizable stroke width and arrowhead geometry.
- rectangle, square, circle, diamond: Geometric bounding shapes with optional fill.
- text: Editable text blocks with custom font size and color.

Normalized Coordinate System:
-----------------------------
All drawing points are stored as normalized floats from 0.0 to 1.0 relative to the PDF page dimensions:
x_normalized = x_canvas / pageWidth
y_normalized = y_canvas / pageHeight

Why Normalized Coordinates Matter:
----------------------------------
Hinglish Explanation:
"Agar hum pixel coordinates (x: 450px, y: 300px) save karte, toh jab user zoom 100% se 150% 
karega ya mobile screen pe kholega, toh drawing book ke text se out of alignment ho jayegi. 
Normalized coordinates (0 se 1) use karne se jab canvas ka size double bhi hota hai, hum 
x_normalized * newWidth karke exact usi word pe annotation render karte hain."

Interactive Object Operations:
------------------------------
- Selection & Hit Testing: Uses point-to-segment distance algorithm (distToSegmentSquared) 
  with a 10px tolerance threshold.
- 8-Point Bounding Box: Selected objects display 8 interactive resize handles (nw, n, ne, 
  e, se, s, sw, w) allowing freeform scaling.
- Drag & Move: Selected strokes can be dragged across the canvas with real-time translation updates.
- Duplication & Deletion: Shortcut keys (Cmd+D, Backspace) allow instant manipulation.

================================================================================
17. CONTEXTUAL AI TRANSLATION SUBSYSTEM
================================================================================

Translation Pipeline Diagram:
-----------------------------

  User Clicks "Translate Page"
               │
               ▼
  Extract Visible Page Text:
  - page.getTextContent() via PDF.js text layer
  - normalizePdfText() merges fragmented glyphs into paragraphs
               │
               ▼
  Check In-Memory Session Cache:
  - Cache Key: fastHash(bookId + pageRange + targetLanguage + text)
  - If cached -> Instant return (0ms latency, 0 API calls)
               │
               ▼
  API Request to Server Route (/api/translate):
  - Request payload contains max 2 visible pages
  - Target: Hindi (Devanagari) | Hinglish (Roman Script) | English
               │
               ▼
  Server-Side Model Execution:
  - Model Waterfall: gemini-2.5-flash -> gemini-3.5-flash-lite -> gemini-3.7-flash
  - Strict JSON output format: {"<pageNum>": "translated text..."}
               │
               ▼
  Response Rendered in Side Drawer / Split Pane
  - Full Text-to-Speech (Web Speech API) & One-Click Copy

Security & Secret Isolation:
----------------------------
The Google Gemini API Key (GEMINI_API_KEY) is stored exclusively in server environment variables 
and is NEVER exposed to the client bundle. The client communicates solely with the secure 
Next.js endpoint /api/translate.

================================================================================
18. COMMAND PALETTE & REAL-TIME SEARCH
================================================================================

Command Palette Implementation (components/SearchModal.tsx):
--------------------------------------------------------------
- Activated via global hotkeys Cmd+K, Ctrl+K, or pressing /.
- Searches across all 363 books indexing title, author, category, and tags.
- Quick Action Shortcuts:
  - Jump directly to "My Shelf" (/favorites)
  - Jump to "Profile Analytics" (/profile)
  - Jump to "Browse All Library" (/library)
  - Instant Theme Selector
- Performance: Uses pre-indexed in-memory catalog with substring and token matching, 
  rendering results in under 5ms without server roundtrips.

================================================================================
19. LOCAL USER PROFILE & READING ANALYTICS ENGINE
================================================================================

Architecture (app/profile/page.tsx & lib/reading-analytics.ts):
-------------------------------------------------------------------
A comprehensive, client-side dashboard that computes high-level reading statistics directly 
from the browser's historical telemetry.

Analytics Metrics Computed:
---------------------------
1. Profile Header Snapshot: Total Books Started, Books Completed, All-Time Reading Hours, 
   Global Active Time, Active Streak, and Diya Qualification Status.
2. 53-Week Reading Heatmap: GitHub-style 365-day grid. Daily reading seconds are mapped to a 
   7-level intensity scale (0m, 1-14m, 15-29m, 30-44m, 45-59m, 60-89m, 90m+).
3. Core Stat Cards: Pages Read, Current Streak, Longest Streak, Notes Count, Highlights Count, 
   and Drawn Annotations.
4. Monthly Journey Breakdown: Visual bar chart displaying monthly reading progress over the 
   past 6 calendar months.
5. Authentic Favorite Genre: Derived by summing actual reading seconds spent across books in each 
   category, ranking the user's genuine reading preference.
6. Reading Habits Analysis: Computes Average Session Duration, Peak Reading Day of the Week, 
   and Preferred Reading Time Window (Morning, Afternoon, Evening, Night).
7. Ranked Book Grids: Most Read Volumes (ranked by total minutes) and Recently Active Books.

================================================================================
20. PROGRESSIVE WEB APP (PWA) & OFFLINE CACHE
================================================================================

Offline Architecture:
---------------------
- Manifest: Configured via public/manifest.json with theme color #9333ea and standalone display.
- CacheStorage Integration (lib/reader-storage.ts):
  Users can click "Save Offline" on any book. The PDF file is fetched and saved to the browser's 
  CacheStorage under cache name readershub-offline-books-v1.
- Offline Reading: When offline, the reader detects network disconnect and loads the cached 
  PDF blob directly from CacheStorage.

================================================================================
21. DELTA INGESTION PIPELINE (BATCH & WATCHDOG)
================================================================================

Why Delta Ingestion?
--------------------
Traditional ingestion pipelines rescan and reprocess every file in the library on every run. 
With 360+ PDFs (~1.65 GB), full re-ingestion takes minutes, re-generates existing covers, 
and risks overwriting manual catalog edits.

Delta Ingestion Flow (scripts/ingest-batch.ts):
------------------------------------------------

  Scan public/pdfs/*.pdf
            │
            ▼
  Load Existing Catalog Index (data/books.json):
  - Populate Set<fileHash> and Set<pdfPath>
            │
            ▼
  Delta Detection (scanDeltaPdfs()):
  - Identify ONLY files whose SHA-256 hash does NOT exist in catalog
            │
            ▼
  If Delta Files Found:
  1. Extract PDF Metadata (Title, Author, Page Count via pdf-parse)
  2. Generate Canonical Kebab-Case Filename (resolveCanonicalFilename())
  3. Render 1st Page to WebP Cover via Sharp (generateBookCover())
  4. Append New Book Object to books.json atomically
            │
            ▼
  Existing 363 Books Left 100% Untouched

CLI Commands:
-------------
- npm run ingest-batch: Performs live delta ingestion of new PDFs.
- npm run watch-books: Starts background Chokidar file watcher on public/pdfs/.
`;
}

module.exports = { getPart2 };
