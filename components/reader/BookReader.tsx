"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
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
  zoom: number;       // 70 - 150
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

const PREFS_KEY = "readers_hub_reader_prefs_v3";

export default function BookReader({ book }: BookReaderProps) {
  const { getReadingProgress, updateReadingProgress } = useLibrary();

  // Load saved position
  const savedProgress = getReadingProgress(book.id);
  const initialPage = savedProgress?.page && savedProgress.page > 0 ? savedProgress.page : 1;

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>("Loading document...");
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showJumpModal, setShowJumpModal] = useState<boolean>(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>("");
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [pdfJsReady, setPdfJsReady] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);
  const canvasSingleRef = useRef<HTMLCanvasElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const renderTasksRef = useRef<Record<string, any>>({});

  // 1. Check Screen Dimensions & Load Saved Preferences
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
      // Ignore
    }

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

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

  // Zoom Helpers
  const zoomIn = () => {
    updatePref("zoom", Math.min(150, prefs.zoom + 10));
  };

  const zoomOut = () => {
    updatePref("zoom", Math.max(70, prefs.zoom - 10));
  };

  const resetZoom = () => {
    updatePref("zoom", 100);
  };

  // 2. Load Standalone PDF.js Library
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
      setPdfJsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "/vendor/pdfjs/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
        setPdfJsReady(true);
      }
    };
    script.onerror = () => {
      console.warn("Loading CDN fallback for PDF.js...");
      const cdnScript = document.createElement("script");
      cdnScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      cdnScript.async = true;
      cdnScript.onload = () => {
        if ((window as any).pdfjsLib) {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          setPdfJsReady(true);
        }
      };
      document.head.appendChild(cdnScript);
    };

    document.head.appendChild(script);
  }, []);

  // 3. Load PDF Document with Streaming & Range Requests
  useEffect(() => {
    if (!pdfJsReady || !book.pdf) return;

    let isCancelled = false;
    setLoading(true);
    setLoadingText("Fetching pages...");

    const pdfjsLib = (window as any).pdfjsLib;

    const loadingTask = pdfjsLib.getDocument({
      url: book.pdf,
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
      cMapPacked: true,
      rangeChunkSize: 65536,
      disableAutoFetch: false,
      disableStream: false,
    });

    loadingTask.onProgress = (progressData: any) => {
      if (progressData.total > 0) {
        const percent = Math.round((progressData.loaded / progressData.total) * 100);
        setLoadingText(`Loading book (${percent}%)...`);
      }
    };

    loadingTask.promise
      .then((doc: any) => {
        if (isCancelled) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);
        updateReadingProgress(book.id, currentPage, doc.numPages);
      })
      .catch((err: any) => {
        console.error("Error loading PDF document:", err);
        if (!isCancelled) {
          setLoadingText("Opening book...");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch {
          // Ignore
        }
      }
    };
  }, [pdfJsReady, book.pdf]);

  // 4. Render Single Page to Canvas with Retina DPI
  const renderPageToCanvas = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement | null, slot: string) => {
      if (!canvas || !pdfDocRef.current || pageNum < 1 || pageNum > numPages) {
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          canvas.style.display = pageNum < 1 ? "none" : "block";
        }
        return;
      }

      try {
        canvas.style.display = "block";

        // Cancel previous task on this slot
        if (renderTasksRef.current[slot]) {
          try {
            renderTasksRef.current[slot].cancel();
          } catch {
            // Ignore
          }
        }

        const page = await pdfDocRef.current.getPage(pageNum);

        const container = containerRef.current;
        const containerWidth = container ? container.clientWidth : 1000;
        const containerHeight = container ? container.clientHeight : 700;

        const isDouble = prefs.layoutMode === "double" && !isMobile;
        
        // Calculate max available width and height per page
        const availableWidth = isDouble ? (containerWidth - 90) / 2 : containerWidth - 40;
        const availableHeight = containerHeight - 120;

        const baseViewport = page.getViewport({ scale: 1.0 });
        const scaleX = availableWidth / baseViewport.width;
        const scaleY = availableHeight / baseViewport.height;
        const fitScale = Math.min(scaleX, scaleY);

        const userScale = (prefs.zoom / 100) * (isMobile ? 1.0 : 0.96);
        const finalScale = Math.max(0.4, fitScale * userScale);

        const viewport = page.getViewport({ scale: finalScale });

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clean white page base
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current[slot] = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn(`Render error on page ${pageNum}:`, err);
        }
      }
    },
    [numPages, prefs.layoutMode, prefs.zoom, isMobile]
  );

  // 5. Trigger Page Renders
  useEffect(() => {
    if (loading || !pdfDocRef.current || numPages === 0) return;

    const isDouble = prefs.layoutMode === "double" && !isMobile;

    if (isDouble) {
      let leftPage: number;
      let rightPage: number;

      if (currentPage === 1) {
        leftPage = 0; // Show book cover on left
        rightPage = 1;
      } else {
        leftPage = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        rightPage = leftPage + 1;
      }

      renderPageToCanvas(leftPage, canvasLeftRef.current, "left");
      renderPageToCanvas(rightPage, canvasRightRef.current, "right");
    } else {
      renderPageToCanvas(currentPage, canvasSingleRef.current, "single");
    }

    updateReadingProgress(book.id, currentPage, numPages);
  }, [currentPage, numPages, prefs.layoutMode, prefs.zoom, isMobile, loading, renderPageToCanvas, book.id]);

  // 6. Navigation Logic
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
      }, 280);
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
      }, 280);
    }
  };

  const handleJumpToPage = (target: number) => {
    if (target >= 1 && target <= numPages) {
      setCurrentPage(target);
      setShowJumpModal(false);
    }
  };

  // 7. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen error:", err);
      });
      setIsFullscreen(false);
    }
  };

  // 8. Keyboard & Fullscreen Listeners
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
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          e.preventDefault();
          resetZoom();
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
  }, [numPages, currentPage, prefs.layoutMode, prefs.zoom, isMobile, isFlipping, showSettings, showJumpModal]);

  // 9. Auto-hide Controls on Inactivity
  const handleUserActivity = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (!showSettings && !showJumpModal) {
        setShowControls(false);
      }
    }, 4500);
  };

  // 10. Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  // 11. Visual Tone & Paper Filter Computation
  const getFilterStyle = (): React.CSSProperties => {
    const filters: string[] = [];

    if (prefs.brightness !== 100) {
      filters.push(`brightness(${prefs.brightness}%)`);
    }

    if (prefs.contrast !== 100) {
      filters.push(`contrast(${prefs.contrast}%)`);
    }

    if (prefs.readingMode === "sepia") {
      filters.push(`sepia(${Math.max(45, prefs.warmth || 45)}%) brightness(95%) contrast(94%)`);
    } else if (prefs.readingMode === "dark") {
      filters.push(`invert(88%) hue-rotate(180deg) brightness(92%) contrast(88%)`);
    } else if (prefs.readingMode === "dim") {
      filters.push(`brightness(80%) sepia(18%)`);
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
        return "#f5eedd";
      case "dark":
        return "#151821";
      case "dim":
        return "#ded7cc";
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
      className={`relative select-none overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0a0c10] shadow-2xl flex flex-col justify-between transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "w-full min-h-[640px] h-[830px]"
      }`}
      style={{
        background:
          prefs.readingMode === "sepia"
            ? "radial-gradient(ellipse at center, #261f18 0%, #100d09 100%)"
            : prefs.readingMode === "dark"
            ? "radial-gradient(ellipse at center, #0e111a 0%, #040508 100%)"
            : "radial-gradient(ellipse at center, #151924 0%, #06080c 100%)",
      }}
    >
      {/* -------------------------------------------------------------
       * Top Floating Minimalist Reader Bar
       * ------------------------------------------------------------- */}
      <div
        className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--card)]/90 backdrop-blur-xl border-b border-[var(--border)]/70 transition-all duration-300 ${
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
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-xs">
            <button
              onClick={zoomOut}
              className="px-2 py-0.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] font-bold cursor-pointer"
              title="Zoom Out (-)"
            >
              −
            </button>
            <button
              onClick={resetZoom}
              className="px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] hover:text-[var(--accent)] font-semibold cursor-pointer"
              title="Reset Zoom (0)"
            >
              {prefs.zoom}%
            </button>
            <button
              onClick={zoomIn}
              className="px-2 py-0.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] font-bold cursor-pointer"
              title="Zoom In (+)"
            >
              +
            </button>
          </div>

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

          {/* Lighting Controls Button */}
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
       * Eye Comfort Settings Popover
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

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Warmth (Sepia)</span>
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

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Scale / Zoom</span>
              <span className="text-[var(--foreground)] font-bold">{prefs.zoom}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={70}
                max={150}
                value={prefs.zoom}
                onChange={(e) => updatePref("zoom", Number(e.target.value))}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
              <button
                onClick={resetZoom}
                className="px-2 py-0.5 text-[10px] bg-[var(--secondary)] rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              >
                100%
              </button>
            </div>
          </div>

          <button
            onClick={() => setPrefs(DEFAULT_PREFS)}
            className="w-full py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] text-[11px] font-semibold transition-all cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Page Jump Modal
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
       * Main Stage: 3D Book Experience & Rendered Canvas Content
       * ------------------------------------------------------------- */}
      <div className="flex-1 flex items-center justify-center relative p-2 sm:p-6 w-full h-full overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-center animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-2xl flex items-center justify-center text-[var(--accent)]">
              📖
            </div>
            <p className="text-xs font-bold text-[var(--foreground)] font-serif">
              Opening &ldquo;{book.title}&rdquo;...
            </p>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {loadingText}
            </span>
          </div>
        ) : (
          <div
            className="relative flex items-center justify-center transition-all duration-300"
            style={{
              perspective: "2000px",
              transformStyle: "preserve-3d",
              ...getFilterStyle(),
            }}
          >
            {isDouble ? (
              /* Two-Page Spread (Open Book Mode) */
              <div
                className={`relative flex items-center rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.75)] border border-[#2b221a]/40 transition-transform duration-300 ${
                  isFlipping ? (flipDirection === "next" ? "animate-page-flip-next" : "animate-page-flip-prev") : ""
                }`}
                style={{
                  backgroundColor: getPageBgColor(),
                }}
              >
                {/* Left Page (Even or Cover Showcase) */}
                <div className="relative flex items-center justify-center p-2 sm:p-4 border-r border-[#cfc4b4]/50 overflow-hidden min-h-[380px] sm:min-h-[500px]">
                  {currentPage === 1 ? (
                    <div className="w-[300px] sm:w-[360px] h-[460px] sm:h-[540px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#cfc4b4]/40 rounded-xl bg-black/[0.02] relative overflow-hidden">
                      <div className="relative w-28 h-40 rounded-lg overflow-hidden book-shadow mb-4 border border-[var(--border)]">
                        <Image
                          src={book.cover}
                          alt={book.title}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#3b2f20] mb-1 line-clamp-2">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[#6b5840]">by {book.author}</p>
                      <span className="text-[10px] text-[#9b8060] mt-4 font-mono">
                        Reader&apos;s HUB Digital Edition
                      </span>
                    </div>
                  ) : (
                    <canvas
                      ref={canvasLeftRef}
                      className="block max-w-full h-auto object-contain rounded-sm shadow-xs"
                      style={{ opacity: 1 }}
                    />
                  )}
                  {/* Left Spine Crease Shadow */}
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/15 to-transparent pointer-events-none" />
                </div>

                {/* Physical Center Spine Crease */}
                <div
                  className="w-2.5 self-stretch relative z-10 pointer-events-none"
                  style={{
                    background: "linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.3))",
                    boxShadow: "inset 0 0 4px rgba(0,0,0,0.35)",
                  }}
                />

                {/* Right Page (Odd) */}
                <div className="relative flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[380px] sm:min-h-[500px]">
                  <canvas
                    ref={canvasRightRef}
                    className="block max-w-full h-auto object-contain rounded-sm shadow-xs"
                    style={{ opacity: 1 }}
                  />
                  {/* Right Spine Crease Shadow */}
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
                </div>
              </div>
            ) : (
              /* Single Page Mode */
              <div
                className={`relative rounded-2xl shadow-[0_20px_55px_rgba(0,0,0,0.7)] border border-[#2b221a]/30 p-2 sm:p-4 transition-transform duration-300 ${
                  isFlipping ? (flipDirection === "next" ? "animate-page-flip-next" : "animate-page-flip-prev") : ""
                }`}
                style={{
                  backgroundColor: getPageBgColor(),
                }}
              >
                <canvas
                  ref={canvasSingleRef}
                  className="block max-w-full h-auto object-contain rounded-sm shadow-xs"
                  style={{ opacity: 1 }}
                />
              </div>
            )}
          </div>
        )}

        {/* Side Click Targets */}
        {!loading && (
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
       * Bottom Floating Progress & Navigation Toolbar
       * ------------------------------------------------------------- */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 flex flex-col gap-2 p-3 sm:p-4 bg-[var(--card)]/90 backdrop-blur-xl border-t border-[var(--border)]/70 transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto w-full">
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
