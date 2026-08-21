"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Book } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";

interface BookReaderProps {
  book: Book;
}

type ReadingMode = "default" | "sepia" | "dark" | "dim";
type LayoutMode = "double" | "single";

interface ReaderPrefs {
  brightness: number; // 60 - 130
  warmth: number;     // 0 - 60
  contrast: number;   // 80 - 120
  zoom: number;       // 80 - 140
  readingMode: ReadingMode;
  layoutMode: LayoutMode;
}

const DEFAULT_PREFS: ReaderPrefs = {
  brightness: 100,
  warmth: 0,
  contrast: 100,
  zoom: 100,
  readingMode: "default",
  layoutMode: "double",
};

const PREFS_KEY = "readers_hub_reader_prefs_v2";

export default function BookReader({ book }: BookReaderProps) {
  const { getReadingProgress, updateReadingProgress } = useLibrary();

  // Load saved position
  const savedProgress = getReadingProgress(book.id);
  const initialPage = savedProgress?.page && savedProgress.page > 0 ? savedProgress.page : 1;

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showJumpModal, setShowJumpModal] = useState<boolean>(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>("");
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [useFallbackEmbed, setUseFallbackEmbed] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);
  const canvasSingleRef = useRef<HTMLCanvasElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const renderTaskRef = useRef<Record<string, any>>({});

  // 1. Check Mobile Screen & Load Preferences
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) {
        setPrefs((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // Ignore localStorage errors
    }

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Save Preferences
  const updatePref = <K extends keyof ReaderPrefs>(key: K, val: ReaderPrefs[K]) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // 2. Load PDF Document via PDF.js
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }

        const loadingTask = pdfjsLib.getDocument({
          url: book.pdf,
          cMapUrl: "https://unpkg.com/pdfjs-dist@6.2.108/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);

        // Record total pages in reading progress
        updateReadingProgress(book.id, currentPage, doc.numPages);
      } catch (err: any) {
        console.warn("PDF.js loading issue, activating fallback reader:", err?.message || err);
        if (!isCancelled) {
          setUseFallbackEmbed(true);
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy();
        } catch {
          // Ignore
        }
      }
    };
  }, [book.pdf]);

  // 3. Render Canvas Pages
  const renderPageToCanvas = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement | null, slotKey: string) => {
      if (!canvas || !pdfDocRef.current || pageNum < 1 || pageNum > numPages) {
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      try {
        // Cancel existing render task for this slot if active
        if (renderTaskRef.current[slotKey]) {
          try {
            renderTaskRef.current[slotKey].cancel();
          } catch {
            // Ignore
          }
        }

        const page = await pdfDocRef.current.getPage(pageNum);
        const containerWidth = containerRef.current?.clientWidth || 900;
        const containerHeight = containerRef.current?.clientHeight || 650;

        // Base scale calculation
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const isDouble = prefs.layoutMode === "double" && !isMobile;
        
        const targetWidth = isDouble ? containerWidth / 2 - 40 : containerWidth - 60;
        const targetHeight = containerHeight - 110;

        const scaleX = targetWidth / unscaledViewport.width;
        const scaleY = targetHeight / unscaledViewport.height;
        const baseScale = Math.min(scaleX, scaleY, 1.8);
        const userScale = (prefs.zoom / 100) * (isMobile ? 1.05 : 1.0);
        const finalScale = Math.max(0.6, baseScale * userScale);

        const viewport = page.getViewport({ scale: finalScale });

        // Support high-DPI retina rendering
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          background: "#ffffff",
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current[slotKey] = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn(`Render error on page ${pageNum}:`, err);
        }
      }
    },
    [numPages, prefs.layoutMode, prefs.zoom, isMobile]
  );

  // Render on page change, layout change, or zoom change
  useEffect(() => {
    if (loading || numPages === 0 || useFallbackEmbed) return;

    const isDouble = prefs.layoutMode === "double" && !isMobile;

    if (isDouble) {
      // In double mode: if on page 1 (cover), show page 1 on right, left blank or spread
      // Normal spread: left = even page, right = odd page
      let leftPage = currentPage % 2 === 0 ? currentPage : currentPage - 1;
      let rightPage = leftPage + 1;

      if (currentPage === 1) {
        leftPage = 0; // blank left cover
        rightPage = 1;
      }

      renderPageToCanvas(leftPage, canvasLeftRef.current, "left");
      renderPageToCanvas(rightPage, canvasRightRef.current, "right");
    } else {
      renderPageToCanvas(currentPage, canvasSingleRef.current, "single");
    }

    // Save reading progress in LibraryContext
    updateReadingProgress(book.id, currentPage, numPages);
  }, [currentPage, numPages, prefs.layoutMode, prefs.zoom, isMobile, loading, useFallbackEmbed, renderPageToCanvas, book.id]);

  // 4. Navigation Handlers
  const handleNext = () => {
    if (isFlipping) return;
    const isDouble = prefs.layoutMode === "double" && !isMobile;
    const step = isDouble ? (currentPage === 1 ? 1 : 2) : 1;

    if (currentPage + step <= numPages + 1) {
      setFlipDirection("next");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((prev) => Math.min(numPages, prev + step));
        setIsFlipping(false);
      }, 320);
    }
  };

  const handlePrev = () => {
    if (isFlipping) return;
    const isDouble = prefs.layoutMode === "double" && !isMobile;
    const step = isDouble ? (currentPage <= 2 ? 1 : 2) : 1;

    if (currentPage - step >= 1) {
      setFlipDirection("prev");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((prev) => Math.max(1, prev - step));
        setIsFlipping(false);
      }, 320);
    }
  };

  const handleJumpToPage = (target: number) => {
    if (target >= 1 && target <= numPages) {
      setCurrentPage(target);
      setShowJumpModal(false);
    }
  };

  // 5. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request failed:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen failed:", err);
      });
      setIsFullscreen(false);
    }
  };

  // 6. Keyboard & Fullscreen Listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);
      if (isInput) return;

      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          handlePrev();
          break;
        case "Home":
          e.preventDefault();
          setCurrentPage(1);
          break;
        case "End":
          e.preventDefault();
          if (numPages > 0) setCurrentPage(numPages);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (showSettings) setShowSettings(false);
          if (showJumpModal) setShowJumpModal(false);
          break;
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [numPages, currentPage, prefs.layoutMode, isMobile, isFlipping, showSettings, showJumpModal]);

  // 7. Auto-hide Toolbar on Idle
  const handleUserActivity = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (!showSettings && !showJumpModal) {
        setShowControls(false);
      }
    }, 3800);
  };

  // 8. Touch Gestures for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext(); // Swipe left -> Next
      } else {
        handlePrev(); // Swipe right -> Prev
      }
    }
    touchStartXRef.current = null;
  };

  // 9. Compute Visual Filters (Brightness, Warmth, Contrast, Reading Modes)
  const getFilterStyle = (): React.CSSProperties => {
    const filters: string[] = [];

    // Brightness
    if (prefs.brightness !== 100) {
      filters.push(`brightness(${prefs.brightness}%)`);
    }

    // Contrast
    if (prefs.contrast !== 100) {
      filters.push(`contrast(${prefs.contrast}%)`);
    }

    // Reading Mode Overrides
    if (prefs.readingMode === "sepia") {
      filters.push(`sepia(${Math.max(45, prefs.warmth || 45)}%)`);
    } else if (prefs.readingMode === "dark") {
      filters.push(`invert(92%) hue-rotate(180deg) brightness(95%) contrast(90%)`);
    } else if (prefs.readingMode === "dim") {
      filters.push(`brightness(82%) sepia(20%)`);
    } else if (prefs.warmth > 0) {
      filters.push(`sepia(${prefs.warmth}%)`);
    }

    return {
      filter: filters.length > 0 ? filters.join(" ") : undefined,
      transition: "filter 0.3s ease",
    };
  };

  const getPageBgColor = () => {
    switch (prefs.readingMode) {
      case "sepia":
        return "#f7f1e3";
      case "dark":
        return "#12141c";
      case "dim":
        return "#e5ded3";
      default:
        return "#ffffff";
    }
  };

  const isDouble = prefs.layoutMode === "double" && !isMobile;
  const progressPercent = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative select-none overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0c0e14] shadow-2xl flex flex-col justify-between transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "w-full min-h-[640px] h-[820px]"
      }`}
      style={{
        background:
          prefs.readingMode === "sepia"
            ? "radial-gradient(ellipse at center, #261f18 0%, #15110d 100%)"
            : prefs.readingMode === "dark"
            ? "radial-gradient(ellipse at center, #10131d 0%, #06080d 100%)"
            : "radial-gradient(ellipse at center, #151924 0%, #090b10 100%)",
      }}
    >
      {/* -------------------------------------------------------------
       * Top Floating Minimalist Reader Bar
       * ------------------------------------------------------------- */}
      <div
        className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[var(--card)]/90 backdrop-blur-xl border-b border-[var(--border)]/70 transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Book Title & Page Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse flex-shrink-0" />
          <div className="flex flex-col text-left truncate">
            <h3 className="text-xs sm:text-sm font-bold font-serif text-[var(--foreground)] truncate max-w-[180px] sm:max-w-md">
              {book.title}
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] truncate">
              {book.author} • {book.category}
            </p>
          </div>
        </div>

        {/* Quick Toolbar Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Layout Mode Toggle (Desktop) */}
          {!isMobile && (
            <button
              onClick={() => updatePref("layoutMode", isDouble ? "single" : "double")}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all flex items-center gap-1.5 cursor-pointer"
              title={isDouble ? "Switch to Single Page" : "Switch to Open Book (2-Page)"}
            >
              <span>{isDouble ? "📖 Open Book" : "📄 Single"}</span>
            </button>
          )}

          {/* Reading Mode Pills */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[11px]">
            {(["default", "sepia", "dark", "dim"] as ReadingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => updatePref("readingMode", mode)}
                className={`px-2.5 py-0.5 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                  prefs.readingMode === mode
                    ? "bg-[var(--card)] text-[var(--accent)] shadow-xs border border-[var(--border)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Eye Comfort & Lighting Settings Popover Trigger */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showSettings
                ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] shadow-md"
                : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border-[var(--border)]"
            }`}
            title="Eye Comfort & Lighting Controls"
          >
            <span>🔆</span>
            <span className="hidden sm:inline">Lighting</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all cursor-pointer flex items-center gap-1.5"
            title="Toggle Fullscreen (F)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Full"}</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * Eye Comfort / Settings Floating Popover Panel
       * ------------------------------------------------------------- */}
      {showSettings && (
        <div className="absolute top-16 right-4 sm:right-6 z-40 w-80 p-5 rounded-3xl glass-panel shadow-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-2xl animate-scale-up space-y-4 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <h4 className="text-xs font-bold font-serif text-[var(--foreground)] uppercase tracking-wider">
              Eye Comfort &amp; Display
            </h4>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Reading Mode Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Reading Atmosphere</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(["default", "sepia", "dark", "dim"] as ReadingMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updatePref("readingMode", mode)}
                  className={`py-1.5 rounded-xl text-[10px] font-bold capitalize border transition-all cursor-pointer ${
                    prefs.readingMode === mode
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Brightness</span>
              <span className="text-[var(--foreground)] font-bold">{prefs.brightness}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={130}
              value={prefs.brightness}
              onChange={(e) => updatePref("brightness", Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Warmth / Sepia Tint Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Warmth</span>
              <span className="text-[var(--foreground)] font-bold">{prefs.warmth}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={prefs.warmth}
              onChange={(e) => updatePref("warmth", Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Contrast Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Contrast</span>
              <span className="text-[var(--foreground)] font-bold">{prefs.contrast}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={120}
              value={prefs.contrast}
              onChange={(e) => updatePref("contrast", Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Zoom Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Scale / Zoom</span>
              <span className="text-[var(--foreground)] font-bold">{prefs.zoom}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={140}
              value={prefs.zoom}
              onChange={(e) => updatePref("zoom", Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={() => setPrefs(DEFAULT_PREFS)}
            className="w-full py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] text-[11px] font-semibold transition-all cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Page Jump Modal Dialog
       * ------------------------------------------------------------- */}
      {showJumpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-3xl p-6 border border-[var(--border)] bg-[var(--card)] max-w-xs w-full shadow-2xl text-left space-y-4">
            <h4 className="font-serif font-bold text-sm text-[var(--foreground)]">
              Jump to Page
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={numPages || 999}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={`1 - ${numPages}`}
                autoFocus
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                / {numPages}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowJumpModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleJumpToPage(Number(jumpPageInput))}
                className="px-4 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-sm hover:scale-105 transition-transform cursor-pointer"
              >
                Go →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Center Stage: Physical 3D Book Experience
       * ------------------------------------------------------------- */}
      <div className="flex-1 flex items-center justify-center relative p-2 sm:p-6 w-full h-full overflow-hidden">
        {loading ? (
          /* Loading State */
          <div className="flex flex-col items-center gap-3 text-center animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-2xl flex items-center justify-center text-[var(--accent)]">
              📖
            </div>
            <p className="text-xs font-bold text-[var(--foreground)] font-serif">
              Opening &ldquo;{book.title}&rdquo;...
            </p>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Preparing digital pages
            </span>
          </div>
        ) : useFallbackEmbed ? (
          /* Native Embed Fallback */
          <iframe
            src={`${book.pdf}#toolbar=1&navpanes=0&scrollbar=1`}
            title={`Reader for ${book.title}`}
            className="w-full h-full rounded-2xl border-0"
          />
        ) : (
          /* 3D Realistic Book Stage */
          <div
            className="relative flex items-center justify-center transition-all duration-300"
            style={{
              perspective: "2000px",
              transformStyle: "preserve-3d",
              ...getFilterStyle(),
            }}
          >
            {isDouble ? (
              /* =========================================================
               * OPEN BOOK (2-PAGE SPREAD) WITH 3D TURNING ANIMATION
               * ========================================================= */
              <div
                className={`relative flex items-center rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.65)] border border-[#2b221a]/30 transition-transform duration-300 ${
                  isFlipping ? (flipDirection === "next" ? "animate-page-flip-next" : "animate-page-flip-prev") : ""
                }`}
                style={{
                  backgroundColor: getPageBgColor(),
                }}
              >
                {/* Left Page (Even) */}
                <div className="relative flex items-center justify-center p-2 sm:p-4 border-r border-[#d4c8b8]/60 overflow-hidden bg-gradient-to-r from-transparent via-transparent to-black/[0.04]">
                  <canvas ref={canvasLeftRef} className="block max-w-full h-auto object-contain rounded-sm" />
                  
                  {/* Left Page Shadow / Bevel */}
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/15 to-transparent pointer-events-none" />
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                </div>

                {/* Center Spine Crease */}
                <div
                  className="w-2 self-stretch relative z-10 pointer-events-none"
                  style={{
                    background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.25))",
                    boxShadow: "inset 0 0 4px rgba(0,0,0,0.3)",
                  }}
                />

                {/* Right Page (Odd) */}
                <div className="relative flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-gradient-to-l from-transparent via-transparent to-black/[0.04]">
                  <canvas ref={canvasRightRef} className="block max-w-full h-auto object-contain rounded-sm" />
                  
                  {/* Right Page Shadow / Bevel */}
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
                </div>
              </div>
            ) : (
              /* =========================================================
               * SINGLE PAGE VIEW (MOBILE & COMPACT SCREENS)
               * ========================================================= */
              <div
                className={`relative rounded-2xl overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.6)] border border-[#2b221a]/25 p-2 sm:p-4 transition-transform duration-300 ${
                  isFlipping ? (flipDirection === "next" ? "animate-page-flip-next" : "animate-page-flip-prev") : ""
                }`}
                style={{
                  backgroundColor: getPageBgColor(),
                }}
              >
                <canvas ref={canvasSingleRef} className="block max-w-full h-auto object-contain rounded-sm" />
                {/* Edge Layer Depth */}
                <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
              </div>
            )}
          </div>
        )}

        {/* Floating Side Click Target Arrows for Natural Navigation */}
        {!loading && !useFallbackEmbed && (
          <>
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1}
              className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 sm:w-12 h-16 sm:h-20 rounded-2xl glass-card border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center transition-all duration-300 cursor-pointer ${
                currentPage <= 1
                  ? "opacity-0 pointer-events-none"
                  : showControls
                  ? "opacity-80 hover:opacity-100 hover:scale-105 shadow-xl hover:border-[var(--accent)]"
                  : "opacity-0 hover:opacity-100"
              }`}
              aria-label="Previous Page"
              title="Previous Page (←)"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={handleNext}
              disabled={numPages > 0 && currentPage >= numPages}
              className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 sm:w-12 h-16 sm:h-20 rounded-2xl glass-card border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center transition-all duration-300 cursor-pointer ${
                numPages > 0 && currentPage >= numPages
                  ? "opacity-0 pointer-events-none"
                  : showControls
                  ? "opacity-80 hover:opacity-100 hover:scale-105 shadow-xl hover:border-[var(--accent)]"
                  : "opacity-0 hover:opacity-100"
              }`}
              aria-label="Next Page"
              title="Next Page (→)"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* -------------------------------------------------------------
       * Bottom Floating Navigation & Reading Progress Toolbar
       * ------------------------------------------------------------- */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 flex flex-col gap-2 p-3 sm:p-4 bg-[var(--card)]/90 backdrop-blur-xl border-t border-[var(--border)]/70 transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto w-full">
          {/* Previous Page */}
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentPage <= 1
                ? "opacity-30 cursor-not-allowed bg-[var(--secondary)] text-[var(--text-secondary)]"
                : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] hover:scale-105 border border-[var(--border)] shadow-xs"
            }`}
          >
            <span>←</span>
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Interactive Page Indicator & Jump Dialog Trigger */}
          <button
            onClick={() => {
              setJumpPageInput(String(currentPage));
              setShowJumpModal(true);
            }}
            className="px-4 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            title="Click to jump to specific page"
          >
            <span>
              Page {currentPage}
              {isDouble && currentPage < numPages ? `–${currentPage + 1}` : ""} of {numPages || "..."}
            </span>
            <span className="text-[10px] text-[var(--accent)] font-semibold">({progressPercent}%)</span>
          </button>

          {/* Next Page */}
          <button
            onClick={handleNext}
            disabled={numPages > 0 && currentPage >= numPages}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              numPages > 0 && currentPage >= numPages
                ? "opacity-30 cursor-not-allowed bg-[var(--secondary)] text-[var(--text-secondary)]"
                : "bg-[var(--primary)] hover:opacity-95 text-[var(--primary-foreground)] hover:scale-105 shadow-md"
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <span>→</span>
          </button>
        </div>

        {/* Thin Ambient Progress Line */}
        <div className="w-full max-w-4xl mx-auto h-1 rounded-full bg-[var(--secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
