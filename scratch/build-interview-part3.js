const fs = require("fs");
const path = require("path");

function getPart3() {
  return `================================================================================
22. GIT LFS & LARGE ASSET MANAGEMENT
================================================================================

Git LFS Strategy:
-----------------
With 363 books totaling ~1.65 GB, storing large PDF binaries directly in standard Git git-objects 
would cause repository bloat and slow clone times.
- Configuration: .gitattributes tracks all PDF files under Git LFS:
  public/pdfs/*.pdf filter=lfs diff=lfs merge=lfs -text
- Remote Repository: Pushed to GitHub repository (https://github.com/amandubey923/library-optimized.git).

================================================================================
23. ERROR BOUNDARIES, FAULT TOLERANCE & RECOVERY
================================================================================

| Potential Failure Point | Automated Recovery Mechanism | User Impact |
| :--- | :--- | :--- |
| Corrupted LocalStorage JSON | try / catch wraps every parse; falls back to default empty state and self-heals | Zero page crashes; defaults restored gracefully |
| LocalStorage Quota Exceeded | Catches quota error; discards oldest non-critical telemetry while keeping active progress | Reading continues uninterrupted |
| PDF Render Race Condition | renderTask.cancel() aborts previous canvas draw before starting new page | Zero canvas graphics corruption |
| Network Drops During PDF Load | Falls back to CacheStorage offline blob | Seamless reading if book was saved offline |
| AI Translation Timeout | Multi-model fallback waterfall (gemini-2.5-flash -> 3.5-flash-lite -> 3.7-flash) | Fallback error message with retry button |
| Missing PDF / Invalid Book ID | not-found.tsx renders custom illustrated 404 with link back to library | Friendly error screen with recovery navigation |
| Accidental Browser Fullscreen Exit | Focus Session intercepts fullscreenchange and displays warning dialog | Prevents accidental focus session loss |

================================================================================
24. SECURITY BOUNDARIES & SECRET ISOLATION
================================================================================

Security Architecture:
----------------------
1. API Key Isolation: Google Gemini API keys exist exclusively on the server (process.env.GEMINI_API_KEY). 
   No client-side JavaScript bundle has access to private credentials.
2. Sanitized Storage: Local storage keys are namespaced with version prefixes (e.g. readershub:v1) 
   to prevent collisions with third-party scripts.
3. Safe HTML Rendering: User notes, highlights, and annotations are rendered via React text nodes 
   rather than dangerouslySetInnerHTML, preventing Cross-Site Scripting (XSS) injection.
4. Open Source Transparency: Zero user telemetry or tracking beacons are embedded in the application.

================================================================================
25. ACCESSIBILITY (A11Y) & RESPONSIVE DESIGN
================================================================================

Accessibility Features:
-----------------------
- Semantic HTML5 Landmarks: <header>, <main>, <nav>, <article>, <footer>.
- Complete ARIA Attributes: aria-label, aria-expanded, aria-modal, role="dialog".
- Keyboard Focus Navigation: Full focus rings and keyboard shortcuts (Cmd+K, F, T, arrows).
- Reduced Motion Compliance: All keyframe animations and rotating conic borders respect 
  @media (prefers-reduced-motion: reduce) by disabling or simplifying movement.
- High-Contrast Theme Support: Custom themes (Dracula, Sepia, High Contrast) ensure legible text.

================================================================================
26. MODULARITY & SEPARATION OF CONCERNS
================================================================================

Architecture Layers:
--------------------
- UI Layer (app/, components/): Handles rendering, user interactions, and visual layout.
- Reader Layer (components/reader/): Isolated canvas rendering and drawing tools.
- Business Logic Layer (lib/): Pure analytical math, storage serialization, and translation helpers.
- State Layer (context/): Centralized reactive store coordinating global updates.
- Data Layer (data/): Static catalog schemas and index utilities.
- Ingestion Layer (scripts/ingest/): Standalone Node.js scripts for asset processing.

Why This Matters in an Interview:
---------------------------------
"Separating storage algorithms from React components ensures that our storage utilities 
can be tested 100% headlessly in Node.js test scripts without needing a mocked browser DOM."

================================================================================
27. APPLIED DESIGN PATTERNS
================================================================================

1. Provider Pattern (LibraryProvider, ThemeProvider): Shares state across the tree without prop-drilling.
2. Repository Pattern (reader-storage.ts): Centralizes all storage operations behind an abstract API.
3. In-Memory Cache Pattern (Write-Through Caching): Caches localStorage data in Maps for 0ms reads.
4. State Machine Pattern (Focus Session Lifecycle): Models session states (inactive -> active -> paused -> completed).
5. Normalized Coordinate Pattern: Stores vector points as relative percentages (0.0 to 1.0) for resolution independence.
6. Chain of Responsibility / Fallback Pattern: AI translation cascades across multiple Gemini models if one is rate-limited.
7. Delta Processing Pattern: Ingestion script processes only new unindexed files using SHA-256 hash sets.

================================================================================
28. HIGH-LEVEL & SUBSYSTEM SYSTEM DESIGN DIAGRAMS
================================================================================

A. Overall System Architecture:
-------------------------------
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Browser Client (React 19)                    │
  │                                                                 │
  │   Next.js App Router  ──►  LibraryContext  ──►  BookReader      │
  │          │                        │                 │           │
  │          ▼                        ▼                 ▼           │
  │   SSG Catalog (363)        LocalStorage       HTML5 Canvas      │
  │   (books.json)             (In-Memory Map)    (PDF.js Worker)   │
  └───────────────────────────────────┬─────────────────────────────┘
                                      │ (Fetch API)
                                      ▼
                         ┌────────────────────────┐
                         │  Next.js Server Route  │
                         │    (/api/translate)    │
                         └────────────┬───────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │ Google Gemini AI Model │
                         └────────────────────────┘

B. PDF Rendering Pipeline:
--------------------------
  PDF URL ──► PDF.js Worker ──► PDFDocumentProxy ──► Page Viewport
                                                           │
  Cancel Prior Task ◄── Check Active RenderTask ◄──────────┘
           │
           ▼
  Rasterize to HTML5 Canvas (DPI Scaled) ──► Overlay Vector Annotations

C. Invariant Timing Engine:
---------------------------
  User in PDF Reader (Idle < 3m) ──► Reading Time (T) ++ ──► Diya Streak (T >= 15m)
                                              │
  User Browsing Site (Non-Reader) ──► Exploration Time ++
                                              │
                                              ▼
                                 Active Time = T + Exploration Time

D. Delta Ingestion Pipeline:
----------------------------
  public/pdfs/*.pdf ──► SHA-256 Hash ──► Compare with data/books.json
                                                    │
             ┌──────────────────────────────────────┴──────────────────────────────────────┐
             │ Match Found (Existing Hash)                                                 │ New Delta PDF Detected
             ▼                                                                             ▼
       Skip File (0 Overhead)                                                      Extract Metadata & Pages
                                                                                           │
                                                                                           ▼
                                                                                   Generate WebP Cover (Sharp)
                                                                                           │
                                                                                           ▼
                                                                                   Atomic Write to books.json

================================================================================
29. SYSTEM DATA FLOWS
================================================================================

User Action Flow:
-----------------
1. User flips page in reader:
   BookReader.tsx -> setPage(n) -> renderPage(n) -> recordReading(bookId, n) -> localStorage update.
2. User draws an arrow:
   DrawingCanvas.tsx -> pointer coordinates normalized to (0-1) -> stroke appended to page array -> saveBookAnnotations().
3. User requests page translation:
   TranslationDrawer.tsx -> page.getTextContent() -> /api/translate -> Gemini AI -> side drawer displays translated paragraphs.
4. User completes 15 minutes of reading:
   BookReader timer ticks -> T >= 900s -> isTodayQualified: true -> DiwaliDiya.tsx renders living flame.

================================================================================
30. "WHY THESE TECHNOLOGIES?" (ARCHITECTURAL DECISION RECORDS)
================================================================================

1. Why Next.js 16 App Router?
   - Short: Static generation (SSG) for 377 routes delivers instant page loads with zero server hosting costs.
   - Detailed: The catalog of 363 books is static. Generating all book detail pages at build time eliminates database query overhead during user navigation.
   - Trade-off: Adding new books requires rebuilding static pages (next build), but our build takes only ~30s for all 377 pages.

2. Why Canvas-based PDF.js instead of <iframe>?
   - Short: Total control over rendering, DPI scaling, dark mode, and vector drawing overlays.
   - Detailed: Browser native PDF viewers provide inconsistent UI across operating systems and do not allow vector annotations or text extraction for translation.
   - Trade-off: Higher JavaScript bundle size compared to native iframes, mitigated by vendor code-splitting.

3. Why LocalStorage with In-Memory Caching?
   - Short: 100% privacy, zero server costs, and instant offline availability.
   - Detailed: Storing reading progress in localStorage eliminates user login barriers. In-memory Map caching eliminates redundant JSON parsing on 1-second timer intervals.
   - Trade-off: Data is tied to the user's specific browser; mitigated by providing a 1-click JSON backup export/import feature.

4. Why Normalized Coordinates (0-1) for Drawings?
   - Short: Guarantees vector drawings remain aligned when zooming, resizing, or switching devices.
   - Detailed: Storing absolute pixel coordinates fails when screen resolutions or zoom levels change. Normalized floats scale mathematically to any canvas dimensions.
   - Trade-off: Requires coordinate conversion on every pointer event.

================================================================================
31. REAL-WORLD PRODUCTION CHALLENGES & ROOT-CAUSE ANALYSES
================================================================================

Challenge 1: "Maximum update depth exceeded" in React
-----------------------------------------------------
- Root Cause: In LibraryContext.tsx, refreshStats() (which called setStats, setStreakData, and setActiveTimeState) was being called inside the functional state updater of setReadingHistory((prev) => { ... refreshStats(); return updated; }). This triggered synchronous cascading state dispatches during React's reconciliation phase.
- Solution: Moved refreshStats() outside the setState functional updaters and made recordReading idempotent by checking if page and progress actually changed before dispatching updates.
- Result: 100% elimination of infinite render loops.

Challenge 2: PDF Fetch Aborts on Fast Re-Renders
------------------------------------------------
- Root Cause: Component remounting during state updates was cancelling in-flight PDF binary fetch requests, throwing TypeError: Failed to fetch.
- Solution: Stabilized reader lifecycle effects and implemented clean AbortController cancellation handling in PDF.js loading tasks.
- Result: Clean PDF loading without console network errors.

Challenge 3: Timing Semantic Inconsistency (Active Time < Reading Time)
-----------------------------------------------------------------------
- Root Cause: Global website active time tracker was capturing pointer events while reading in BookReader.tsx, causing exploration seconds to tick simultaneously with reading seconds.
- Solution: Added route-level isolation (pathnameRef.current?.startsWith("/book/")). When in the reader, exploration tracking halts and only genuine reading time (T) accumulates.
- Result: Active Time >= Reading Time invariant holds 100% across all scenarios.

================================================================================
32. NOTABLE BUGS & ARCHITECTURAL LESSONS
================================================================================

1. Lesson 1: Never call setState inside another setState's functional updater. Always perform state updates sequentially or dispatch composite actions.
2. Lesson 2: Canvas rendering must be cancellable. Without renderTask.cancel(), rapid user interactions will corrupt the HTML5 Canvas graphics context.
3. Lesson 3: High-frequency pointer events (drag, hover, tilt) should bypass React state entirely and use useRef + direct CSS GPU transforms.
`;
}

module.exports = { getPart3 };
