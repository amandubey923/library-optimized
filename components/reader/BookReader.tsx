"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Book } from "@/data/books";
import { useLibrary } from "@/context/LibraryContext";
import DrawingCanvas from "@/components/reader/DrawingCanvas";
import AnnotationDrawer from "@/components/reader/AnnotationDrawer";
import BookReadingMemory from "@/components/memory/BookReadingMemory";
import { TranslationDrawer, TranslationPosition } from "@/components/reader/TranslationDrawer";
import {
  TranslationTarget,
  TranslationResult,
  PageExtract,
  normalizePdfText,
  translatePageSpread,
  getCachedTranslation,
} from "@/lib/translator";
import {
  getBookAnnotations,
  addHighlight,
  deleteHighlight,
  addNote,
  updateNote,
  deleteNote,
  savePageDrawings,
  clearPageDrawings,
  getSavedProgress,
  saveProgress,
  getBookmarks,
  saveBookmark,
  deleteBookmark,
  BookAnnotations,
  BookmarkItem,
  HighlightItem,
  DrawingStroke,
  DrawingPoint,
  AnnotationToolType,
} from "@/lib/reader-storage";

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

interface TocItem {
  title: string;
  page: number;
}

interface SearchMatch {
  page: number;
  matchSnippet: string;
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
  const {
    getReadingProgress,
    updateReadingProgress,
    showToast,
    recordActiveReading,
    activeSession,
    startReadingSession,
    endReadingSession,
    recordSessionEvent,
    checkOfflineStatus,
    saveBookOffline,
    removeBookOffline,
  } = useLibrary();

  // Load saved position from centralized storage or context
  const savedContextProgress = getReadingProgress(book.id);
  const savedLocalProgress = getSavedProgress(book.id);
  const initialPage =
    savedLocalProgress?.page && savedLocalProgress.page > 0
      ? savedLocalProgress.page
      : savedContextProgress?.page && savedContextProgress.page > 0
      ? savedContextProgress.page
      : 1;

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

  // -------------------------------------------------------------
  // P1: Focus Mode, Search Inside Book & Reading Memory
  // -------------------------------------------------------------
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState<boolean>(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState<boolean>(false);

  // Search Inside Book State
  const [isSearchInBookOpen, setIsSearchInBookOpen] = useState<boolean>(false);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>("");
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [isSearchingBook, setIsSearchingBook] = useState<boolean>(false);
  const pdfTextCacheRef = useRef<Record<number, string>>({});

  // Structured Reading Session State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [sessionTargetMinutes, setSessionTargetMinutes] = useState<number>(15);
  const [isSessionCompleteOpen, setIsSessionCompleteOpen] = useState<boolean>(false);
  const sessionStartPageRef = useRef<number>(initialPage);
  const sessionMarksCountRef = useRef<number>(0);

  // Table of Contents State
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [tocActiveTab, setTocActiveTab] = useState<"toc" | "annotated">("toc");
  const [tableOfContents, setTableOfContents] = useState<TocItem[]>([]);

  // Page Thumbnail Navigator State
  const [isThumbnailDrawerOpen, setIsThumbnailDrawerOpen] = useState<boolean>(false);
  const [thumbnailFilter, setThumbnailFilter] = useState<"all" | "annotated" | "bookmarked">("all");
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Contextual Page Translation State
  // -------------------------------------------------------------
  const [isTranslateOpen, setIsTranslateOpen] = useState<boolean>(false);
  const [translationTarget, setTranslationTarget] = useState<TranslationTarget>("hindi");
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [currentSpreadExtracts, setCurrentSpreadExtracts] = useState<PageExtract[]>([]);
  const [translationPosition, setTranslationPosition] = useState<TranslationPosition>("right");
  const translationAbortControllerRef = useRef<AbortController | null>(null);
  const translationReqIdRef = useRef<number>(0);

  // -------------------------------------------------------------
  // Advanced Study, Annotations & Bookmarks State
  // -------------------------------------------------------------
  const [annotations, setAnnotations] = useState<BookAnnotations>({
    highlights: [],
    notes: [],
    drawings: {},
    bookmarks: [],
  });
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isAnnotationDrawerOpen, setIsAnnotationDrawerOpen] = useState<boolean>(false);
  const [showAnnotationsOverlay, setShowAnnotationsOverlay] = useState<boolean>(true);

  // Study Tools State
  const [isStudyMode, setIsStudyMode] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<AnnotationToolType | "eraser" | "select">("pen");
  const [penColor, setPenColor] = useState<string>("#f59e0b");
  const [highlighterColor, setHighlighterColor] = useState<string>("#facc15");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [opacity, setOpacity] = useState<number>(1.0);
  const [fillMode, setFillMode] = useState<boolean>(false);
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);

  // Undo / Redo Stacks per page
  const [undoStack, setUndoStack] = useState<Record<number, DrawingStroke[][]>>({});
  const [redoStack, setRedoStack] = useState<Record<number, DrawingStroke[][]>>({});

  // Text Box Annotation Dialog State
  const [textBoxDialog, setTextBoxDialog] = useState<{
    isOpen: boolean;
    page: number;
    point: DrawingPoint | null;
    text: string;
  }>({
    isOpen: false,
    page: 1,
    point: null,
    text: "",
  });

  // Text Selection & Floating Annotation Popover
  const [selectionPopover, setSelectionPopover] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    page: number;
  } | null>(null);

  // Note Modal State
  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    page: number;
    selectedText?: string;
    noteText: string;
  }>({
    isOpen: false,
    page: 1,
    noteText: "",
  });

  // Canvas Dimensions
  const [pageCanvasSize, setPageCanvasSize] = useState<{ width: number; height: number }>({
    width: 450,
    height: 600,
  });

  // Fullscreen Integrated Cursor Position
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: -100,
    y: -100,
    visible: false,
  });

  // Active Reading Streak Tracker Refs
  const lastActivityTimestampRef = useRef<number>(Date.now());
  const accumulatedSecondsRef = useRef<number>(0);
  const activeSessionRef = useRef(activeSession);
  const currentPageRef = useRef(currentPage);
  const isSessionCompleteOpenRef = useRef(isSessionCompleteOpen);
  const showToastRef = useRef(showToast);
  const recordSessionEventRef = useRef(recordSessionEvent);
  const endReadingSessionRef = useRef(endReadingSession);
  const recordActiveReadingRef = useRef(recordActiveReading);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    isSessionCompleteOpenRef.current = isSessionCompleteOpen;
  }, [isSessionCompleteOpen]);

  useEffect(() => {
    showToastRef.current = showToast;
    recordSessionEventRef.current = recordSessionEvent;
    endReadingSessionRef.current = endReadingSession;
    recordActiveReadingRef.current = recordActiveReading;
  }, [showToast, recordSessionEvent, endReadingSession, recordActiveReading]);

  const registerActivity = useCallback(() => {
    lastActivityTimestampRef.current = Date.now();
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);
  const canvasSingleRef = useRef<HTMLCanvasElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const renderTasksRef = useRef<Record<string, any>>({});
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Load Initial Annotations, Bookmarks, Offline Status & Screen Size
  useEffect(() => {
    const loaded = getBookAnnotations(book.id);
    const bms = getBookmarks(book.id);
    setAnnotations(loaded);
    setBookmarks(bms);

    if (book.pdf) {
      checkOfflineStatus(book.id, book.pdf).then(setIsOfflineSaved);
    }

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
  }, [book.id, book.pdf, checkOfflineStatus]);

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

  const zoomIn = () => updatePref("zoom", Math.min(150, prefs.zoom + 10));
  const zoomOut = () => updatePref("zoom", Math.max(70, prefs.zoom - 10));
  const resetZoom = () => updatePref("zoom", 100);

  // Derived Annotated Pages Index
  const annotatedPagesList = useMemo(() => {
    const pageMap: Record<number, { highlights: number; notes: number; drawings: number; bookmark: boolean; noteSnippets: string[] }> = {};
    (annotations.highlights || []).forEach((h) => {
      if (!pageMap[h.page]) pageMap[h.page] = { highlights: 0, notes: 0, drawings: 0, bookmark: false, noteSnippets: [] };
      pageMap[h.page].highlights++;
    });
    (annotations.notes || []).forEach((n) => {
      if (!pageMap[n.page]) pageMap[n.page] = { highlights: 0, notes: 0, drawings: 0, bookmark: false, noteSnippets: [] };
      pageMap[n.page].notes++;
      if (n.note) pageMap[n.page].noteSnippets.push(n.note);
    });
    Object.keys(annotations.drawings || {}).forEach((pStr) => {
      const p = Number(pStr);
      if ((annotations.drawings[p] || []).length > 0) {
        if (!pageMap[p]) pageMap[p] = { highlights: 0, notes: 0, drawings: 0, bookmark: false, noteSnippets: [] };
        pageMap[p].drawings += annotations.drawings[p].length;
      }
    });
    (bookmarks || []).forEach((b) => {
      if (!pageMap[b.page]) pageMap[b.page] = { highlights: 0, notes: 0, drawings: 0, bookmark: false, noteSnippets: [] };
      pageMap[b.page].bookmark = true;
    });

    return Object.entries(pageMap)
      .map(([pageStr, data]) => ({ page: Number(pageStr), ...data }))
      .sort((a, b) => a.page - b.page);
  }, [annotations, bookmarks]);

  // 1.5. Intelligent Active Reading Timer (Diwali Diya Tracker)
  useEffect(() => {
    const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes grace period for stationary reading

    const timer = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        !loading &&
        pdfDocRef.current
      ) {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTimestampRef.current;

        if (timeSinceLastActivity < IDLE_TIMEOUT_MS) {
          accumulatedSecondsRef.current += 1;

          if (accumulatedSecondsRef.current >= 5) {
            const res = recordActiveReadingRef.current(accumulatedSecondsRef.current);
            accumulatedSecondsRef.current = 0;
            if (res.justQualified) {
              showToastRef.current("🪔 15-minute daily reading goal reached! Your Diwali Diya is lit! ✨");
            }
          }

          // Check if structured reading session completed
          const curSession = activeSessionRef.current;
          if (curSession && curSession.isActive && curSession.bookId === book.id) {
            const totalSecs = curSession.elapsedSeconds + accumulatedSecondsRef.current;
            if (totalSecs >= curSession.targetMinutes * 60 && !isSessionCompleteOpenRef.current) {
              setIsSessionCompleteOpen(true);
              recordSessionEventRef.current({
                bookId: book.id,
                timestamp: Date.now(),
                startPage: sessionStartPageRef.current,
                endPage: currentPageRef.current,
                durationSeconds: totalSecs,
                highlightsAdded: sessionMarksCountRef.current,
                notesAdded: 0,
                bookmarksAdded: 0,
              });
              endReadingSessionRef.current();
              showToastRef.current("🎉 Structured Reading Session Complete!");
            }
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      if (accumulatedSecondsRef.current > 0) {
        recordActiveReadingRef.current(accumulatedSecondsRef.current);
        accumulatedSecondsRef.current = 0;
      }
    };
  }, [loading, book.id]);

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

  // 3. Load PDF Document & Extract Table of Contents
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
      .then(async (doc: any) => {
        if (isCancelled) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);

        const targetPage = Math.min(doc.numPages, Math.max(1, initialPage));
        setCurrentPage(targetPage);
        updateReadingProgress(book.id, targetPage, doc.numPages);
        saveProgress(book.id, targetPage, doc.numPages);

        // Extract PDF Outline
        try {
          const outline = await doc.getOutline();
          if (outline && outline.length > 0) {
            const parsedToc: TocItem[] = [];
            for (const item of outline) {
              if (item.title) {
                let pageIndex = 1;
                if (typeof item.dest === "string") {
                  const dest = await doc.getDestination(item.dest);
                  if (dest) {
                    const pageRef = dest[0];
                    pageIndex = (await doc.getPageIndex(pageRef)) + 1;
                  }
                } else if (Array.isArray(item.dest)) {
                  const pageRef = item.dest[0];
                  pageIndex = (await doc.getPageIndex(pageRef)) + 1;
                }
                parsedToc.push({ title: item.title, page: Math.max(1, pageIndex) });
              }
            }
            if (parsedToc.length > 0) {
              setTableOfContents(parsedToc);
            }
          } else {
            const step = Math.max(10, Math.ceil(doc.numPages / 8));
            const milestones: TocItem[] = [];
            for (let p = 1; p <= doc.numPages; p += step) {
              milestones.push({
                title: p === 1 ? "Opening & Front Matter" : `Section — Page ${p}`,
                page: p,
              });
            }
            setTableOfContents(milestones);
          }
        } catch {
          const step = Math.max(10, Math.ceil(doc.numPages / 8));
          const milestones: TocItem[] = [];
          for (let p = 1; p <= doc.numPages; p += step) {
            milestones.push({
              title: p === 1 ? "Opening & Front Matter" : `Section — Page ${p}`,
              page: p,
            });
          }
          setTableOfContents(milestones);
        }
      })
      .catch((err: any) => {
        console.error("Error loading PDF document:", err);
        if (!isCancelled) {
          setPdfLoadError(err?.message || "Unable to fetch or parse document.");
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
  }, [pdfJsReady, book.pdf, book.id]);

  // 4. Render Single Page to Canvas with Retina DPI & Adjacent Prefetch
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

        setPageCanvasSize({
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        });

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current[slot] = renderTask;
        await renderTask.promise;

        // P0: Prefetch adjacent pages into memory in background
        if (pdfDocRef.current) {
          if (pageNum + 1 <= numPages) pdfDocRef.current.getPage(pageNum + 1).catch(() => {});
          if (pageNum - 1 >= 1) pdfDocRef.current.getPage(pageNum - 1).catch(() => {});
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn(`Render error on page ${pageNum}:`, err);
        }
      }
    },
    [numPages, prefs.layoutMode, prefs.zoom, isMobile, isFocusMode]
  );

  // 5. Trigger Page Renders
  useEffect(() => {
    if (loading || !pdfDocRef.current || numPages === 0) return;

    const isDouble = prefs.layoutMode === "double" && !isMobile;

    if (isDouble) {
      let leftPage: number;
      let rightPage: number;

      if (currentPage === 1) {
        leftPage = 0;
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
    saveProgress(book.id, currentPage, numPages);
  }, [
    currentPage,
    numPages,
    prefs.layoutMode,
    prefs.zoom,
    isMobile,
    isFocusMode,
    loading,
    renderPageToCanvas,
    book.id,
    updateReadingProgress,
  ]);

  // 6. Navigation Logic
  const handleNext = () => {
    if (isFlipping) return;
    registerActivity();
    const isDouble = prefs.layoutMode === "double" && !isMobile;
    const step = isDouble ? (currentPage === 1 ? 1 : 2) : 1;

    if (currentPage + step <= numPages + 1) {
      setSelectionPopover(null);
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
    registerActivity();
    const isDouble = prefs.layoutMode === "double" && !isMobile;
    const step = isDouble ? (currentPage <= 2 ? 1 : 2) : 1;

    if (currentPage - step >= 1) {
      setSelectionPopover(null);
      setFlipDirection("prev");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((prev) => Math.max(1, prev - step));
        setIsFlipping(false);
      }, 280);
    }
  };

  const handleJumpToPage = (target: number) => {
    registerActivity();
    if (target >= 1 && target <= numPages) {
      setSelectionPopover(null);
      setCurrentPage(target);
      setShowJumpModal(false);
      setIsTocOpen(false);
      setIsSearchInBookOpen(false);
    }
  };

  // 7. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 7b. Focus Mode Toggle with Automatic Native Fullscreen
  const toggleFocusMode = useCallback(
    (enable?: boolean) => {
      const nextState = typeof enable === "boolean" ? enable : !isFocusMode;
      setIsFocusMode(nextState);

      if (nextState) {
        if (!document.fullscreenElement && containerRef.current) {
          containerRef.current.requestFullscreen().catch(() => {});
          setIsFullscreen(true);
        }
        showToast("Focus Mode On ✨");
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
        showToast("Focus Mode Off");
      }
    },
    [isFocusMode, showToast]
  );

  // 7c. Contextual Page Spread Text Extractor (Current Spread Only)
  const extractSpreadText = useCallback(async () => {
    if (!pdfDocRef.current || numPages === 0) return [];
    const isDouble = prefs.layoutMode === "double" && !isMobile;
    const pageNums: number[] = [];

    if (isDouble) {
      const left = currentPage === 1 ? 0 : currentPage % 2 === 0 ? currentPage : currentPage - 1;
      const right = currentPage === 1 ? 1 : left + 1;
      if (left >= 1 && left <= numPages) pageNums.push(left);
      if (right >= 1 && right <= numPages) pageNums.push(right);
    } else {
      if (currentPage >= 1 && currentPage <= numPages) pageNums.push(currentPage);
    }

    const extracts: PageExtract[] = [];
    for (const pNum of pageNums) {
      try {
        const page = await pdfDocRef.current.getPage(pNum);
        const textContent = await page.getTextContent();
        const text = normalizePdfText(textContent.items as any);
        extracts.push({ pageNum: pNum, text });
      } catch (err) {
        console.warn(`Failed to extract text for page ${pNum}`, err);
      }
    }
    return extracts;
  }, [currentPage, numPages, prefs.layoutMode, isMobile]);

  // 7d. Perform Contextual Translation
  const handlePerformTranslation = useCallback(
    async (target?: TranslationTarget) => {
      const targetLang = target || translationTarget;
      if (translationAbortControllerRef.current) {
        translationAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      translationAbortControllerRef.current = abortController;
      const reqId = ++translationReqIdRef.current;

      setIsTranslating(true);
      const extracts = await extractSpreadText();
      setCurrentSpreadExtracts(extracts);

      // Check cache first for instant load
      const cached = getCachedTranslation(book.id, extracts, targetLang);
      if (cached) {
        setTranslationResult(cached);
        setIsTranslating(false);
        return;
      }

      const res = await translatePageSpread({
        bookId: book.id,
        pages: extracts,
        targetLanguage: targetLang,
        signal: abortController.signal,
      });

      // Stale request protection (Phase 37)
      if (reqId === translationReqIdRef.current) {
        setTranslationResult(res);
        setIsTranslating(false);
      }
    },
    [book.id, extractSpreadText, translationTarget]
  );

  // 7e. Auto-Reset Translation on Page Flip (Phase 4 & 36)
  useEffect(() => {
    setTranslationResult(null);
    setIsTranslating(false);
    if (translationAbortControllerRef.current) {
      translationAbortControllerRef.current.abort();
    }
  }, [currentPage]);

  // 7f. Fullscreen-Only Translation Handler (Requirement 1: Smooth Fullscreen + Translation)
  const handleOpenTranslation = useCallback(async () => {
    if (!document.fullscreenElement && containerRef.current) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn("Fullscreen request error:", err);
      }
    }
    setIsTranslateOpen(true);
    const extracts = await extractSpreadText();
    setCurrentSpreadExtracts(extracts);
    const cached = getCachedTranslation(book.id, extracts, translationTarget);
    if (cached) {
      setTranslationResult(cached);
    }
  }, [book.id, extractSpreadText, translationTarget]);

  // 7g. Fullscreen change listener to auto-close translation on exit
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsTranslateOpen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // 8. Bookmarks Toggle
  const handleToggleBookmark = () => {
    registerActivity();
    sessionMarksCountRef.current += 1;
    const isCurrentBookmarked = bookmarks.some((b) => b.page === currentPage);
    if (isCurrentBookmarked) {
      const bm = bookmarks.find((b) => b.page === currentPage);
      if (bm) {
        deleteBookmark(book.id, bm.id);
        setBookmarks(getBookmarks(book.id));
        showToast(`Removed bookmark from Page ${currentPage} 🔖`);
      }
    } else {
      saveBookmark(book.id, currentPage, `Page ${currentPage} Bookmark`);
      setBookmarks(getBookmarks(book.id));
      showToast(`Bookmarked Page ${currentPage} 🔖`);
    }
  };

  // 9. Offline Cache Toggle
  const handleToggleOffline = async () => {
    if (!book.pdf) return;
    if (isOfflineSaved) {
      await removeBookOffline(book.id, book.pdf);
      setIsOfflineSaved(false);
    } else {
      const ok = await saveBookOffline(book.id, book.pdf);
      if (ok) setIsOfflineSaved(true);
    }
  };

  // 10. Search Inside Book Logic (Ctrl+F)
  const handleSearchInBook = async (queryText: string) => {
    if (!queryText.trim() || !pdfDocRef.current) {
      setSearchMatches([]);
      return;
    }

    setIsSearchingBook(true);
    const q = queryText.toLowerCase().trim();
    const matches: SearchMatch[] = [];

    try {
      for (let p = 1; p <= numPages; p++) {
        let text = pdfTextCacheRef.current[p];
        if (!text) {
          const page = await pdfDocRef.current.getPage(p);
          const content = await page.getTextContent();
          text = content.items.map((it: any) => it.str).join(" ");
          pdfTextCacheRef.current[p] = text;
        }

        if (text.toLowerCase().includes(q)) {
          const idx = text.toLowerCase().indexOf(q);
          const snippet = text.substring(Math.max(0, idx - 30), Math.min(text.length, idx + q.length + 40));
          matches.push({
            page: p,
            matchSnippet: snippet,
          });
        }
      }

      setSearchMatches(matches);
      setCurrentMatchIndex(0);
      if (matches.length > 0) {
        setCurrentPage(matches[0].page);
        showToast(`Found ${matches.length} matches in "${book.title}"`);
      } else {
        showToast(`No matches found for "${queryText}"`);
      }
    } catch (e) {
      console.warn("Search inside book error:", e);
    } finally {
      setIsSearchingBook(false);
    }
  };

  const handleNextSearchMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    setCurrentPage(searchMatches[nextIdx].page);
  };

  const handlePrevSearchMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    setCurrentPage(searchMatches[prevIdx].page);
  };

  // 11. Undo & Redo Handlers
  const handleStrokesChange = (page: number, newStrokes: DrawingStroke[]) => {
    registerActivity();
    sessionMarksCountRef.current += 1;
    const prevStrokes = annotations.drawings[page] || [];

    setUndoStack((prev) => ({
      ...prev,
      [page]: [...(prev[page] || []), prevStrokes],
    }));

    setRedoStack((prev) => ({
      ...prev,
      [page]: [],
    }));

    savePageDrawings(book.id, page, newStrokes);
    setAnnotations(getBookAnnotations(book.id));
  };

  const handleUndo = (page: number) => {
    const pageUndo = undoStack[page] || [];
    if (pageUndo.length === 0) return;

    const previousState = pageUndo[pageUndo.length - 1];
    const currentStrokes = annotations.drawings[page] || [];

    setRedoStack((prev) => ({
      ...prev,
      [page]: [...(prev[page] || []), currentStrokes],
    }));

    setUndoStack((prev) => ({
      ...prev,
      [page]: pageUndo.slice(0, -1),
    }));

    savePageDrawings(book.id, page, previousState);
    setAnnotations(getBookAnnotations(book.id));
    showToast("Undo action ↩️");
  };

  const handleRedo = (page: number) => {
    const pageRedo = redoStack[page] || [];
    if (pageRedo.length === 0) return;

    const nextState = pageRedo[pageRedo.length - 1];
    const currentStrokes = annotations.drawings[page] || [];

    setUndoStack((prev) => ({
      ...prev,
      [page]: [...(prev[page] || []), currentStrokes],
    }));

    setRedoStack((prev) => ({
      ...prev,
      [page]: pageRedo.slice(0, -1),
    }));

    savePageDrawings(book.id, page, nextState);
    setAnnotations(getBookAnnotations(book.id));
    showToast("Redo action ↪️");
  };

  const handleClearPageWithConfirmation = (page: number) => {
    const currentStrokes = annotations.drawings[page] || [];
    if (currentStrokes.length === 0) return;

    if (window.confirm(`Clear all drawings on Page ${page}?`)) {
      handleStrokesChange(page, []);
      showToast(`Page ${page} drawings cleared 🗑️`);
    }
  };

  // 12. Text Box Placement
  const handleSaveTextBox = () => {
    if (!textBoxDialog.text.trim() || !textBoxDialog.point) return;
    const currentStrokes = annotations.drawings[textBoxDialog.page] || [];
    const newStroke: DrawingStroke = {
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: "text",
      points: [textBoxDialog.point],
      color: penColor,
      width: 2,
      text: textBoxDialog.text.trim(),
      fontSize: 14,
    };
    handleStrokesChange(textBoxDialog.page, [...currentStrokes, newStroke]);
    setTextBoxDialog({ isOpen: false, page: 1, point: null, text: "" });
    showToast("Text annotation placed 🔤");
  };

  // 13. Keyboard Listeners (Ctrl+F for in-book search, Z for Focus Mode)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);

      // Search Inside Book Shortcut (Ctrl+F or Cmd+F)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchInBookOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }

      if (isInput) return;

      registerActivity();

      // Focus Mode Shortcut (Z)
      if (e.key.toLowerCase() === "z" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // Zoom Shortcuts (Ctrl/Cmd +, Ctrl/Cmd -, Ctrl/Cmd 0)
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        const nextZoom = Math.min(150, prefs.zoom + 10);
        updatePref("zoom", nextZoom);
        showToast(`Zoom: ${nextZoom}% 🔍`);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        const nextZoom = Math.max(70, prefs.zoom - 10);
        updatePref("zoom", nextZoom);
        showToast(`Zoom: ${nextZoom}% 🔍`);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "0")) {
        e.preventDefault();
        updatePref("zoom", 100);
        showToast("Zoom: 100% (Reset) 🔍");
        return;
      }

      // Undo / Redo Shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) handleRedo(currentPage);
        else handleUndo(currentPage);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        handleRedo(currentPage);
        return;
      }

      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleToggleBookmark();
          break;
        case "p":
          setIsStudyMode(true);
          setActiveTool("pen");
          break;
        case "h":
          setIsStudyMode(true);
          setActiveTool("highlighter");
          break;
        case "l":
          setIsStudyMode(true);
          setActiveTool("line");
          break;
        case "a":
          setIsStudyMode(true);
          setActiveTool("arrow");
          break;
        case "c":
          setIsStudyMode(true);
          setActiveTool("circle");
          break;
        case "r":
          setIsStudyMode(true);
          setActiveTool("rectangle");
          break;
        case "t":
          if (isStudyMode) {
            setActiveTool("text");
          } else {
            e.preventDefault();
            if (isTranslateOpen) {
              setIsTranslateOpen(false);
            } else {
              handleOpenTranslation();
            }
          }
          break;
        case "e":
          setIsStudyMode(true);
          setActiveTool("eraser");
          break;
        case "arrowright":
        case "pagedown":
        case " ":
          if (!isStudyMode) {
            e.preventDefault();
            handleNext();
          }
          break;
        case "arrowleft":
        case "pageup":
          if (!isStudyMode) {
            e.preventDefault();
            handlePrev();
          }
          break;
        case "home":
          e.preventDefault();
          setCurrentPage(1);
          break;
        case "end":
          e.preventDefault();
          if (numPages > 0) setCurrentPage(numPages);
          break;
        case "escape":
          if (isTranslateOpen) setIsTranslateOpen(false);
          if (isSearchInBookOpen) setIsSearchInBookOpen(false);
          if (showSettings) setShowSettings(false);
          if (showJumpModal) setShowJumpModal(false);
          if (isAnnotationDrawerOpen) setIsAnnotationDrawerOpen(false);
          if (isTocOpen) setIsTocOpen(false);
          if (isMemoryOpen) setIsMemoryOpen(false);
          if (isSessionModalOpen) setIsSessionModalOpen(false);
          if (isSessionCompleteOpen) setIsSessionCompleteOpen(false);
          if (selectionPopover) setSelectionPopover(null);
          if (noteModal.isOpen) setNoteModal((prev) => ({ ...prev, isOpen: false }));
          if (textBoxDialog.isOpen) setTextBoxDialog((prev) => ({ ...prev, isOpen: false }));
          if (isStudyMode) setIsStudyMode(false);
          if (isFocusMode) toggleFocusMode(false);
          break;
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    numPages,
    currentPage,
    prefs.layoutMode,
    prefs.zoom,
    isMobile,
    isFlipping,
    showSettings,
    showJumpModal,
    isAnnotationDrawerOpen,
    isTocOpen,
    isMemoryOpen,
    isSessionModalOpen,
    isSessionCompleteOpen,
    isSearchInBookOpen,
    isFocusMode,
    toggleFocusMode,
    selectionPopover,
    noteModal.isOpen,
    textBoxDialog.isOpen,
    isStudyMode,
    undoStack,
    redoStack,
    bookmarks,
    registerActivity,
  ]);

  // 14. Pointer & Cursor Listeners
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    registerActivity();
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (
        !showSettings &&
        !showJumpModal &&
        !isAnnotationDrawerOpen &&
        !isTocOpen &&
        !isMemoryOpen &&
        !isSearchInBookOpen &&
        !isStudyMode &&
        !selectionPopover?.visible
      ) {
        setShowControls(false);
      }
    }, 4500);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }

      if (!cursorPos.visible) {
        setCursorPos({ x, y, visible: true });
      }
    }
  };

  const handlePointerLeave = () => {
    setCursorPos((prev) => ({ ...prev, visible: false }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    registerActivity();
    if (!isStudyMode) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isStudyMode || touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartXRef.current = null;
  };

  // 15. Text Selection
  const handlePageMouseUp = (e: React.MouseEvent, pageNum: number) => {
    if (isStudyMode) return;
    registerActivity();
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    if (selectedText.length > 2 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top - 50;

      setSelectionPopover({
        visible: true,
        x: Math.max(80, Math.min(rect.width - 160, x)),
        y: Math.max(60, y),
        text: selectedText,
        page: pageNum,
      });
    }
  };

  const handleCreateHighlight = (color: HighlightItem["color"]) => {
    if (!selectionPopover) return;
    registerActivity();
    sessionMarksCountRef.current += 1;
    const newItem = addHighlight(book.id, {
      bookId: book.id,
      page: selectionPopover.page,
      text: selectionPopover.text,
      color,
    });
    setAnnotations((prev) => ({
      ...prev,
      highlights: [...prev.highlights, newItem],
    }));
    window.getSelection()?.removeAllRanges();
    setSelectionPopover(null);
    showToast("Text highlighted 🌟");
  };

  const handleOpenNoteModal = () => {
    if (!selectionPopover) return;
    setNoteModal({
      isOpen: true,
      page: selectionPopover.page,
      selectedText: selectionPopover.text,
      noteText: "",
    });
    setSelectionPopover(null);
  };

  const handleSaveNote = () => {
    if (!noteModal.noteText.trim()) return;
    registerActivity();
    sessionMarksCountRef.current += 1;
    const newNote = addNote(book.id, {
      bookId: book.id,
      page: noteModal.page,
      selectedText: noteModal.selectedText,
      note: noteModal.noteText.trim(),
    });
    setAnnotations((prev) => ({
      ...prev,
      notes: [...prev.notes, newNote],
    }));
    setNoteModal({ isOpen: false, page: 1, noteText: "" });
    showToast("Note saved 📝");
  };

  // Visual Tone Filter
  const getFilterStyle = (): React.CSSProperties => {
    const filters: string[] = [];
    if (prefs.brightness !== 100) filters.push(`brightness(${prefs.brightness}%)`);
    if (prefs.contrast !== 100) filters.push(`contrast(${prefs.contrast}%)`);
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
      case "sepia": return "#f5eedd";
      case "dark": return "#151821";
      case "dim": return "#ded7cc";
      default: return "#ffffff";
    }
  };

  const isDouble = prefs.layoutMode === "double" && !isMobile;
  const progressPercent = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0;
  const isBookComplete = numPages > 0 && currentPage >= numPages;

  const activeLeftPage = isDouble ? (currentPage === 1 ? 0 : currentPage % 2 === 0 ? currentPage : currentPage - 1) : currentPage;
  const activeRightPage = isDouble ? (currentPage === 1 ? 1 : activeLeftPage + 1) : currentPage;

  const pageAnnotationCount = (p: number) => {
    const hlCount = annotations.highlights.filter((h) => h.page === p).length;
    const noteCount = annotations.notes.filter((n) => n.page === p).length;
    const drawCount = annotations.drawings[p]?.length || 0;
    const bmCount = bookmarks.filter((b) => b.page === p).length;
    return hlCount + noteCount + drawCount + bmCount;
  };

  const isCurrentPageBookmarked = bookmarks.some((b) => b.page === currentPage);
  const totalAnnotationsCount =
    (annotations.highlights?.length || 0) +
    (annotations.notes?.length || 0) +
    Object.keys(annotations.drawings || {}).length +
    bookmarks.length;

  const currentColor = activeTool === "highlighter" ? highlighterColor : penColor;

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      onMouseEnter={handlePointerMove}
      onMouseLeave={handlePointerLeave}
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
       * Integrated Custom Cursor HUD
       * ------------------------------------------------------------- */}
      <div
        ref={cursorDotRef}
        className={`pointer-events-none absolute top-0 left-0 z-[9999] transition-opacity duration-150 ${
          cursorPos.visible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        {isStudyMode ? (
          <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <div
              className="rounded-full border border-white shadow-md transition-all"
              style={{
                width: `${activeTool === "highlighter" ? Math.max(14, strokeWidth * 3) : Math.max(8, strokeWidth * 2)}px`,
                height: `${activeTool === "highlighter" ? Math.max(14, strokeWidth * 3) : Math.max(8, strokeWidth * 2)}px`,
                backgroundColor: activeTool === "eraser" ? "rgba(255,255,255,0.75)" : currentColor,
                opacity: activeTool === "highlighter" ? 0.6 : 1.0,
              }}
            />
          </div>
        ) : (
          <div
            className="relative will-change-transform filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none pointer-events-none"
            style={{ transform: "translate(-5.5px, 0px)" }}
          >
            <svg
              width="25"
              height="27"
              viewBox="0 0 24 26"
              fill="none"
            >
              <path
                d="M7 1.5C7 0.671573 6.32843 0 5.5 0C4.67157 0 4 0.671573 4 1.5V11.5L2.6 10.1C2.01421 9.51421 1.06447 9.51421 0.47868 10.1C-0.107107 10.6858 -0.107107 11.6355 0.47868 12.2213L5.68579 17.4284C6.73289 18.4755 8.15264 19.0625 9.63301 19.0625H13.25C15.7353 19.0625 17.75 17.0478 17.75 14.5625V10C17.75 9.17157 17.0784 8.5 16.25 8.5C15.4216 8.5 14.75 9.17157 14.75 10V9C14.75 8.17157 14.0784 7.5 13.25 7.5C12.4216 7.5 11.75 8.17157 11.75 9V8C11.75 7.17157 11.0784 6.5 10.25 6.5C9.42157 6.5 8.75 7.17157 8.75 8V1.5C8.75 0.671573 8.07843 0 7.25 0C6.42157 0 5.75 0.671573 5.75 1.5Z"
                fill="#FFFFFF"
                stroke="#18181B"
                strokeWidth="1.35"
                strokeLinejoin="round"
              />
              <path d="M5.5 2.2V5" stroke="#E4E4E7" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M8.75 9.5H10.25" stroke="#D4D4D8" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M11.75 10.5H13.25" stroke="#D4D4D8" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M14.75 11.5H16.25" stroke="#D4D4D8" strokeWidth="0.8" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
       * Focus Mode Floating Banner / Controls
       * ------------------------------------------------------------- */}
      {isFocusMode && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 animate-fade-in">
          <button
            onClick={() => {
              if (isTranslateOpen) {
                setIsTranslateOpen(false);
              } else {
                handleOpenTranslation();
              }
            }}
            aria-label="Translate Current Spread in Focus Mode"
            className={`px-3 py-1.5 rounded-2xl backdrop-blur-xl border text-xs font-bold transition-all shadow-xl flex items-center gap-1.5 cursor-pointer ${
              isTranslateOpen
                ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)]"
                : "bg-[var(--card)]/90 border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]"
            }`}
            title="Translate Current Spread (T)"
          >
            <span>🌐</span>
            <span className="hidden sm:inline">Translate</span>
          </button>

          <button
            onClick={() => toggleFocusMode(false)}
            className="px-3.5 py-1.5 rounded-2xl bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:border-[var(--accent)] shadow-xl flex items-center gap-1.5 cursor-pointer"
            title="Exit Focus Mode (Z)"
          >
            <span>✕</span>
            <span>Exit Focus Mode</span>
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Top Floating Minimalist Reader Toolbar (Hidden in Focus Mode)
       * ------------------------------------------------------------- */}
      {!isFocusMode && (
        <div
          className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[var(--card)]/90 backdrop-blur-xl border-b border-[var(--border)]/70 transition-all duration-300 ${
            showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          {/* Chapter Outline & Search inside Book */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              onClick={() => setIsTocOpen(true)}
              className="p-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer flex items-center gap-1 text-xs"
              title="Table of Contents & Chapters"
            >
              <span>📑</span>
              <span className="hidden sm:inline font-semibold">Chapters</span>
            </button>

            <button
              onClick={() => {
                setIsSearchInBookOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="p-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer flex items-center gap-1 text-xs"
              title="Search Inside Book (Ctrl+F)"
            >
              <span>🔍</span>
              <span className="hidden sm:inline font-semibold">Find</span>
            </button>

            {/* Page Thumbnail Navigator */}
            <button
              onClick={() => setIsThumbnailDrawerOpen(true)}
              className={`p-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                isThumbnailDrawerOpen
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)]"
                  : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border-[var(--border)]"
              }`}
              title="Page Thumbnail Navigator (▦)"
            >
              <span>▦</span>
              <span className="hidden sm:inline font-semibold">Pages</span>
            </button>

            <div className="flex flex-col text-left truncate ml-1">
              <h3 className="text-xs sm:text-sm font-bold font-serif text-[var(--foreground)] truncate max-w-[110px] sm:max-w-xs">
                {book.title}
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">
                {book.author}
              </p>
            </div>
          </div>

          {/* Quick Toolbar Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Structured Reading Session */}
            <button
              onClick={() => setIsSessionModalOpen(true)}
              aria-label="Start Structured Reading Session"
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSession && activeSession.isActive
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] shadow-md animate-pulse"
                  : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border-[var(--border)]"
              }`}
              title="Start Structured Reading Session"
            >
              <span>⏱️</span>
              <span className="hidden sm:inline">
                {activeSession && activeSession.isActive
                  ? `${Math.max(0, activeSession.targetMinutes - Math.floor(activeSession.elapsedSeconds / 60))}m left`
                  : "Session"}
              </span>
            </button>

            {/* Focus Mode Button */}
            <button
              onClick={() => toggleFocusMode(true)}
              aria-label="Enter Distraction-Free Focus Mode"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all flex items-center gap-1 cursor-pointer"
              title="Enter Distraction-Free Focus Mode (Z)"
            >
              <span>🎯</span>
              <span className="hidden md:inline">Focus</span>
            </button>

            {/* Offline Save */}
            <button
              onClick={handleToggleOffline}
              aria-label={isOfflineSaved ? "Remove Offline Copy" : "Save Book for Offline Reading"}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                isOfflineSaved
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)]"
              }`}
              title={isOfflineSaved ? "Available Offline (Click to remove)" : "Save Book for Offline Reading"}
            >
              <span>{isOfflineSaved ? "✓" : "📦"}</span>
              <span className="hidden md:inline">{isOfflineSaved ? "Offline" : "Save"}</span>
            </button>

            {/* Reading Memory */}
            <button
              onClick={() => setIsMemoryOpen(true)}
              aria-label="Open My Reading Memory"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all flex items-center gap-1 cursor-pointer"
              title="Open My Reading Memory"
            >
              <span>🧠</span>
              <span className="hidden md:inline">Memory</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleToggleBookmark}
              aria-label={isCurrentPageBookmarked ? "Remove Bookmark" : "Bookmark this Page"}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                isCurrentPageBookmarked
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-xs"
                  : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border-[var(--border)]"
              }`}
              title="Bookmark this Page (B)"
            >
              <span>{isCurrentPageBookmarked ? "🔖" : "📑"}</span>
            </button>

            {/* Layout Mode Toggle */}
            {!isMobile && (
              <button
                onClick={() => updatePref("layoutMode", isDouble ? "single" : "double")}
                aria-label={isDouble ? "Switch to Single Page" : "Switch to Open Book 2-Page"}
                className="px-2 py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all cursor-pointer hidden md:flex items-center gap-1"
                title={isDouble ? "Switch to Single Page" : "Switch to Open Book (2-Page)"}
              >
                <span>{isDouble ? "📖" : "📄"}</span>
              </button>
            )}

            {/* Contextual Translation Button */}
            <button
              onClick={() => {
                if (isTranslateOpen) {
                  setIsTranslateOpen(false);
                } else {
                  handleOpenTranslation();
                }
              }}
              aria-label="Translate Current Page Spread"
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                isTranslateOpen
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] shadow-md"
                  : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border-[var(--border)]"
              }`}
              title="Translate Current Pages (T)"
            >
              <span>🌐</span>
              <span className="hidden md:inline">Translate</span>
            </button>

            {/* Study Mode Toggle */}
            <button
              onClick={() => setIsStudyMode(!isStudyMode)}
              aria-label="Toggle Study and Annotation Suite"
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                isStudyMode
                  ? "bg-[var(--accent)] text-[var(--primary-foreground)] border-[var(--accent)] shadow-md"
                  : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] border-[var(--border)]"
              }`}
              title="Toggle Study & Annotation Suite (P)"
            >
              <span>🎨</span>
            </button>

            {/* Notes Drawer */}
            <button
              onClick={() => setIsAnnotationDrawerOpen(true)}
              aria-label="View Highlights, Notes and Bookmarks"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold border border-[var(--border)] transition-all flex items-center gap-1 cursor-pointer"
              title="View Highlights, Notes & Bookmarks"
            >
              <span>📌</span>
              {totalAnnotationsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--accent)] text-[var(--primary-foreground)] text-[10px] font-bold">
                  {totalAnnotationsCount}
                </span>
              )}
            </button>

            {/* Lighting Controls */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Eye Comfort and Lighting Controls"
              className="p-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs border border-[var(--border)] transition-all cursor-pointer"
              title="Eye Comfort & Lighting Controls"
            >
              <span>🔆</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              aria-label="Toggle Fullscreen"
              className="p-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs border border-[var(--border)] transition-all cursor-pointer"
              title="Toggle Fullscreen (F)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Search Inside Book Floating Bar (Ctrl+F)
       * ------------------------------------------------------------- */}
      {isSearchInBookOpen && (
        <div className="absolute top-14 inset-x-0 z-40 p-3 bg-[var(--card)]/95 backdrop-blur-2xl border-b border-[var(--border)] shadow-2xl flex items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <span className="text-base">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              value={bookSearchQuery}
              onChange={(e) => setBookSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchInBook(bookSearchQuery);
              }}
              placeholder="Find inside this book... (Press Enter)"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={() => handleSearchInBook(bookSearchQuery)}
              disabled={isSearchingBook}
              className="px-3 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold cursor-pointer"
            >
              {isSearchingBook ? "..." : "Search"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {searchMatches.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)]">
                <span>
                  {currentMatchIndex + 1} of {searchMatches.length} matches (Page {searchMatches[currentMatchIndex]?.page})
                </span>
                <button
                  onClick={handlePrevSearchMatch}
                  className="p-1 rounded bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)]"
                  title="Previous Match"
                >
                  ↑
                </button>
                <button
                  onClick={handleNextSearchMatch}
                  className="p-1 rounded bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)]"
                  title="Next Match"
                >
                  ↓
                </button>
              </div>
            )}
            <button
              onClick={() => setIsSearchInBookOpen(false)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Structured Reading Session Launcher Modal
       * ------------------------------------------------------------- */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-left">
          <div className="glass-card rounded-3xl p-6 border border-[var(--border)] bg-[var(--card)] max-w-sm w-full shadow-2xl space-y-4">
            <h4 className="font-serif font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
              <span>⏱️</span>
              <span>Start Structured Reading Session</span>
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Choose a dedicated reading goal for &ldquo;{book.title}&rdquo;. Time accumulates only while actively reading.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => setSessionTargetMinutes(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    sessionTargetMinutes === m
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent shadow-md"
                      : "bg-[var(--secondary)] text-[var(--text-secondary)] border-[var(--border)]"
                  }`}
                >
                  {m} Minutes
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sessionStartPageRef.current = currentPage;
                  sessionMarksCountRef.current = 0;
                  startReadingSession(book.id, currentPage, sessionTargetMinutes);
                  setIsSessionModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Begin Session →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Session Completion Celebration Modal
       * ------------------------------------------------------------- */}
      {isSessionCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-left">
          <div className="glass-card rounded-3xl p-6 border border-emerald-500/40 bg-[var(--card)] max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-3xl flex items-center justify-center mx-auto shadow-inner">
              🎉
            </div>
            <h4 className="font-serif font-bold text-base text-[var(--foreground)]">
              Reading Session Complete!
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              You completed your target session on &ldquo;{book.title}&rdquo;.
            </p>

            <div className="grid grid-cols-2 gap-2 bg-[var(--secondary)]/40 p-3 rounded-2xl border border-[var(--border)] text-xs">
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] block">Pages Covered</span>
                <strong className="text-sm font-bold text-[var(--foreground)] font-mono">
                  {Math.abs(currentPage - sessionStartPageRef.current) + 1} pages
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] block">Study Markings</span>
                <strong className="text-sm font-bold text-amber-400 font-mono">
                  {sessionMarksCountRef.current} added
                </strong>
              </div>
            </div>

            <button
              onClick={() => setIsSessionCompleteOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              Continue Reading →
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * My Reading Memory Drawer Modal
       * ------------------------------------------------------------- */}
      <BookReadingMemory
        book={book}
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        onJumpToPage={handleJumpToPage}
      />

      {/* -------------------------------------------------------------
       * Table of Contents & Annotated Page Index Drawer
       * ------------------------------------------------------------- */}
      {isTocOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-sm h-full bg-[var(--card)] border-r border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left z-50">
            <div className="p-4 border-b border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📑</span>
                  <h4 className="font-serif font-bold text-sm text-[var(--foreground)]">
                    Navigation &amp; Index
                  </h4>
                </div>
                <button
                  onClick={() => setIsTocOpen(false)}
                  className="w-7 h-7 rounded-xl bg-[var(--secondary)] text-xs hover:text-[var(--foreground)] flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Tabs: Chapters vs Annotated Pages */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] text-xs font-semibold">
                <button
                  onClick={() => setTocActiveTab("toc")}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    tocActiveTab === "toc"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Chapters ({tableOfContents.length})
                </button>
                <button
                  onClick={() => setTocActiveTab("annotated")}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    tocActiveTab === "annotated"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>Annotated</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[var(--accent)] text-[var(--primary-foreground)] text-[9px] font-bold">
                    {annotatedPagesList.length}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tocActiveTab === "toc" ? (
                tableOfContents.map((item, idx) => (
                  <button
                    key={`${item.page}_${idx}`}
                    onClick={() => {
                      handleJumpToPage(item.page);
                      setIsTocOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-left text-xs transition-all flex items-center justify-between border cursor-pointer ${
                      currentPage >= item.page && (idx === tableOfContents.length - 1 || currentPage < tableOfContents[idx + 1].page)
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold shadow-xs"
                        : "bg-[var(--secondary)]/40 hover:bg-[var(--secondary)] border-[var(--border)] text-[var(--foreground)] font-medium"
                    }`}
                  >
                    <span className="truncate mr-3">{item.title}</span>
                    <span className="text-[10px] font-mono opacity-80 whitespace-nowrap">Page {item.page}</span>
                  </button>
                ))
              ) : (
                annotatedPagesList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[var(--text-secondary)]">
                    No annotated pages yet. Highlight, add notes, or draw on pages to index them here.
                  </div>
                ) : (
                  annotatedPagesList.map((item) => (
                    <button
                      key={item.page}
                      onClick={() => {
                        handleJumpToPage(item.page);
                        setIsTocOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl text-left text-xs transition-all border space-y-1.5 cursor-pointer ${
                        currentPage === item.page
                          ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold shadow-xs"
                          : "bg-[var(--secondary)]/40 hover:bg-[var(--secondary)] border-[var(--border)] text-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-serif">Page {item.page}</span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {item.bookmark && <span>🔖</span>}
                          {item.highlights > 0 && <span className="text-amber-400">🖍️ {item.highlights}</span>}
                          {item.notes > 0 && <span className="text-sky-400">📝 {item.notes}</span>}
                          {item.drawings > 0 && <span className="text-purple-400">🎨 {item.drawings}</span>}
                        </div>
                      </div>
                      {item.noteSnippets.length > 0 && (
                        <p className="text-[10px] text-[var(--text-secondary)] italic line-clamp-1 border-l border-[var(--border)] pl-1.5">
                          &ldquo;{item.noteSnippets[0]}&rdquo;
                        </p>
                      )}
                    </button>
                  ))
                )
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsTocOpen(false)} />
        </div>
      )}

      {/* -------------------------------------------------------------
       * Page Thumbnail Navigator Drawer (▦)
       * ------------------------------------------------------------- */}
      {isThumbnailDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in text-left">
          <div className="flex-1" onClick={() => setIsThumbnailDrawerOpen(false)} />
          <div className="w-full max-w-md h-full bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-right z-50">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] space-y-3 bg-[var(--card)]/95 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">▦</span>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[var(--foreground)]">
                      Page Thumbnail Navigator
                    </h4>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Jump across {numPages || "all"} pages with study markers
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsThumbnailDrawerOpen(false)}
                  className="w-7 h-7 rounded-xl bg-[var(--secondary)] text-xs hover:text-[var(--foreground)] flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                {[
                  { id: "all", label: `All (${numPages})` },
                  { id: "annotated", label: `Marked (${annotatedPagesList.length})` },
                  { id: "bookmarked", label: `Bookmarked (${bookmarks.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setThumbnailFilter(f.id as any)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      thumbnailFilter === f.id
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                        : "bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: numPages || 1 }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === currentPage;
                const isBookmarked = (bookmarks || []).some((b) => b.page === pageNum);
                const annCount = pageAnnotationCount(pageNum);
                const isAnnotated = annCount > 0 || isBookmarked;

                if (thumbnailFilter === "annotated" && !isAnnotated) return null;
                if (thumbnailFilter === "bookmarked" && !isBookmarked) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      handleJumpToPage(pageNum);
                      setIsThumbnailDrawerOpen(false);
                    }}
                    className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                      isCurrent
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] ring-2 ring-[var(--accent)] text-[var(--foreground)] shadow-md"
                        : "bg-[var(--secondary)]/30 hover:bg-[var(--secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {/* Simulated page preview container */}
                    <div className="w-full aspect-[3/4] rounded-lg bg-[var(--background)] border border-[var(--border)]/80 flex flex-col items-center justify-between p-2 mb-2 relative overflow-hidden group-hover:scale-102 transition-transform shadow-inner">
                      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                        P. {pageNum}
                      </span>

                      {/* Mini skeleton lines */}
                      <div className="w-full space-y-1 my-auto opacity-40">
                        <div className="h-1 bg-[var(--foreground)] rounded w-full" />
                        <div className="h-1 bg-[var(--foreground)] rounded w-4/5" />
                        <div className="h-1 bg-[var(--foreground)] rounded w-3/4" />
                      </div>

                      {/* Study Indicator Badges on Thumbnail */}
                      <div className="flex items-center gap-1 text-[10px] z-10">
                        {isBookmarked && <span title="Bookmarked">🔖</span>}
                        {annCount > 0 && (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-xs animate-pulse"
                            title={`${annCount} study markings`}
                          />
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-serif font-bold text-[var(--foreground)]">
                      Page {pageNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Study & Annotation Suite Sub-Toolbar (Study Mode)
       * ------------------------------------------------------------- */}
      {isStudyMode && !isFocusMode && (
        <div className="absolute top-14 inset-x-0 z-30 flex flex-wrap items-center justify-between p-2 sm:px-6 bg-[var(--card)]/95 backdrop-blur-xl border-b border-[var(--border)] gap-2 animate-fade-in text-xs shadow-lg">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "pen", label: "Pen", icon: "✏️", shortcut: "P" },
              { id: "highlighter", label: "Highlighter", icon: "🖍️", shortcut: "H" },
              { id: "line", label: "Line", icon: "📏", shortcut: "L" },
              { id: "arrow", label: "Arrow", icon: "↗️", shortcut: "A" },
              { id: "circle", label: "Circle", icon: "⭕", shortcut: "C" },
              { id: "rectangle", label: "Rect", icon: "▭", shortcut: "R" },
              { id: "square", label: "Square", icon: "▢", shortcut: "" },
              { id: "diamond", label: "Diamond", icon: "💎", shortcut: "D" },
              { id: "text", label: "Text", icon: "🔤", shortcut: "T" },
              { id: "eraser", label: "Eraser", icon: "🧹", shortcut: "E" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id as any)}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTool === t.id
                    ? "bg-[var(--accent)] text-[var(--primary-foreground)] shadow-xs"
                    : "bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden md:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {(activeTool === "highlighter"
                ? ["#facc15", "#34d399", "#38bdf8", "#f472b6", "#c084fc"]
                : ["#f59e0b", "#10b981", "#06b6d4", "#f43f5e", "#a855f7", "#ffffff"]
              ).map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    if (activeTool === "highlighter") setHighlighterColor(color);
                    else setPenColor(color);
                  }}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border transition-transform cursor-pointer ${
                    (activeTool === "highlighter" ? highlighterColor : penColor) === color
                      ? "scale-125 ring-2 ring-white"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-[var(--border)]" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleUndo(currentPage)}
                disabled={(undoStack[currentPage] || []).length === 0}
                className="p-1.5 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)] cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                ↩️
              </button>
              <button
                onClick={() => handleRedo(currentPage)}
                disabled={(redoStack[currentPage] || []).length === 0}
                className="p-1.5 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)] cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                ↪️
              </button>
            </div>

            <button
              onClick={() => handleClearPageWithConfirmation(currentPage)}
              className="px-2 py-1 rounded-lg bg-[var(--secondary)] hover:bg-rose-500/20 hover:text-rose-400 text-[var(--text-secondary)] font-bold transition-all cursor-pointer text-[11px]"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Text Box Dialog
       * ------------------------------------------------------------- */}
      {textBoxDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-left">
          <div className="glass-card rounded-3xl p-6 border border-[var(--border)] bg-[var(--card)] max-w-sm w-full shadow-2xl space-y-4">
            <h4 className="font-serif font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
              <span>🔤</span>
              <span>Place Text Annotation — Page {textBoxDialog.page}</span>
            </h4>
            <input
              type="text"
              value={textBoxDialog.text}
              onChange={(e) => setTextBoxDialog({ ...textBoxDialog, text: e.target.value })}
              placeholder="e.g. Key formula, exam note, key concept..."
              autoFocus
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setTextBoxDialog({ isOpen: false, page: 1, point: null, text: "" })}
                className="px-3.5 py-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTextBox}
                className="px-4 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold cursor-pointer"
              >
                Place Text →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Floating Contextual Selection Popover
       * ------------------------------------------------------------- */}
      {selectionPopover?.visible && (
        <div
          className="absolute z-40 flex items-center gap-1.5 p-1.5 rounded-2xl glass-card border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl shadow-2xl animate-scale-up text-xs"
          style={{
            left: `${selectionPopover.x}px`,
            top: `${selectionPopover.y}px`,
          }}
        >
          <button
            onClick={() => handleCreateHighlight("amber")}
            className="w-6 h-6 rounded-full bg-amber-400/80 hover:scale-110 border border-amber-300 shadow-sm transition-transform cursor-pointer"
            title="Highlight Amber"
          />
          <button
            onClick={() => handleCreateHighlight("mint")}
            className="w-6 h-6 rounded-full bg-emerald-400/80 hover:scale-110 border border-emerald-300 shadow-sm transition-transform cursor-pointer"
            title="Highlight Mint"
          />
          <button
            onClick={() => handleCreateHighlight("cyan")}
            className="w-6 h-6 rounded-full bg-cyan-400/80 hover:scale-110 border border-cyan-300 shadow-sm transition-transform cursor-pointer"
            title="Highlight Cyan"
          />
          <button
            onClick={() => handleCreateHighlight("purple")}
            className="w-6 h-6 rounded-full bg-purple-400/80 hover:scale-110 border border-purple-300 shadow-sm transition-transform cursor-pointer"
            title="Highlight Purple"
          />

          <div className="h-4 w-px bg-[var(--border)] mx-1" />

          <button
            onClick={handleOpenNoteModal}
            className="px-2.5 py-1 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>📝</span>
            <span>Note</span>
          </button>

          <button
            onClick={() => setSelectionPopover(null)}
            className="px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Note Creation Modal
       * ------------------------------------------------------------- */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-left">
          <div className="glass-card rounded-3xl p-6 border border-[var(--border)] bg-[var(--card)] max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h4 className="font-serif font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                <span>📝</span>
                <span>Add Note — Page {noteModal.page}</span>
              </h4>
              <button
                onClick={() => setNoteModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {noteModal.selectedText && (
              <blockquote className="text-xs text-[var(--text-secondary)] italic font-serif pl-2.5 border-l-2 border-[var(--accent)] line-clamp-3 bg-[var(--background)]/50 p-2 rounded-r-xl">
                &ldquo;{noteModal.selectedText}&rdquo;
              </blockquote>
            )}

            <textarea
              rows={4}
              value={noteModal.noteText}
              onChange={(e) => setNoteModal({ ...noteModal, noteText: e.target.value })}
              placeholder="Write your personal thoughts, study notes, or questions..."
              autoFocus
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl p-3.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setNoteModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Save Note →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Eye Comfort Settings Popover
       * ------------------------------------------------------------- */}
      {showSettings && !isFocusMode && (
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
              Go to Page
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJumpToPage(Number(jumpPageInput));
                }}
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
       * Annotation Drawer
       * ------------------------------------------------------------- */}
      <AnnotationDrawer
        isOpen={isAnnotationDrawerOpen}
        onClose={() => setIsAnnotationDrawerOpen(false)}
        bookTitle={book.title}
        annotations={annotations}
        bookmarks={bookmarks}
        onJumpToPage={handleJumpToPage}
        onDeleteHighlight={(id) => {
          deleteHighlight(book.id, id);
          setAnnotations(getBookAnnotations(book.id));
        }}
        onUpdateNote={(id, text) => {
          updateNote(book.id, id, text);
          setAnnotations(getBookAnnotations(book.id));
        }}
        onDeleteNote={(id) => {
          deleteNote(book.id, id);
          setAnnotations(getBookAnnotations(book.id));
        }}
        onClearDrawing={(page) => {
          clearPageDrawings(book.id, page);
          setAnnotations(getBookAnnotations(book.id));
        }}
        onDeleteBookmark={(id) => {
          deleteBookmark(book.id, id);
          setBookmarks(getBookmarks(book.id));
        }}
      />

      {/* -------------------------------------------------------------
       * Movable Contextual Translation Overlay Panel (Docked Left/Right)
       * ------------------------------------------------------------- */}
      <TranslationDrawer
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        pages={currentSpreadExtracts}
        selectedTarget={translationTarget}
        onTargetChange={(newTarget) => {
          setTranslationTarget(newTarget);
          handlePerformTranslation(newTarget);
        }}
        onTranslate={() => handlePerformTranslation()}
        isLoading={isTranslating}
        result={translationResult}
        theme={prefs.readingMode}
        position={translationPosition}
        onPositionChange={setTranslationPosition}
      />

      {/* -------------------------------------------------------------
       * Main Book Viewport Canvas (100% Stable, Full Size)
       * ------------------------------------------------------------- */}
      <div className="flex-1 flex items-center justify-center relative p-2 sm:p-6 w-full h-full overflow-hidden">
        {pdfLoadError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto glass-card rounded-3xl border border-rose-500/30 bg-[var(--card)] space-y-4 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-3xl flex items-center justify-center text-rose-400">
              ⚠️
            </div>
            <h4 className="font-serif font-bold text-base text-[var(--foreground)]">
              Unable to Open Book
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              We encountered a network or loading interruption while reading &ldquo;{book.title}&rdquo;.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                onClick={() => {
                  setPdfLoadError(null);
                  setLoading(true);
                  setLoadingText("Retrying connection...");
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Retry Loading ↻
              </button>
              <Link
                href={`/book/${book.id}`}
                className="px-4 py-2 rounded-xl bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--foreground)] text-xs font-semibold border border-[var(--border)]"
              >
                Book Overview →
              </Link>
            </div>
          </div>
        ) : loading ? (
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
              <div
                className={`relative flex items-center rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.75)] border border-[#2b221a]/40 transition-transform duration-300 ${
                  isFlipping ? (flipDirection === "next" ? "animate-page-flip-next" : "animate-page-flip-prev") : ""
                }`}
                style={{ backgroundColor: getPageBgColor() }}
              >
                {/* Left Page */}
                <div
                  onMouseUp={(e) => handlePageMouseUp(e, activeLeftPage)}
                  className="relative flex items-center justify-center p-2 sm:p-4 border-r border-[#cfc4b4]/50 overflow-hidden min-h-[380px] sm:min-h-[500px]"
                >
                  {currentPage === 1 ? (
                    <div className="w-[300px] sm:w-[360px] h-[460px] sm:h-[540px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#cfc4b4]/40 rounded-xl bg-black/[0.02] relative overflow-hidden">
                      <div className="relative w-28 h-40 rounded-lg overflow-hidden book-shadow mb-4 border border-[var(--border)]">
                        <Image src={book.cover} alt={book.title} fill className="object-cover" sizes="120px" />
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#3b2f20] mb-1 line-clamp-2">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[#6b5840]">by {book.author}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <canvas ref={canvasLeftRef} className="block max-w-full h-auto object-contain rounded-sm" />
                      <DrawingCanvas
                        pageNumber={activeLeftPage}
                        initialStrokes={annotations.drawings[activeLeftPage] || []}
                        onStrokesChange={(strokes) => handleStrokesChange(activeLeftPage, strokes)}
                        width={pageCanvasSize.width}
                        height={pageCanvasSize.height}
                        isDrawingActive={isStudyMode}
                        activeTool={activeTool}
                        activeColor={currentColor}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                        fillMode={fillMode}
                        selectedStrokeId={selectedStrokeId}
                        onSelectStroke={setSelectedStrokeId}
                        visible={showAnnotationsOverlay}
                        onTextPrompt={(pt) => {
                          setTextBoxDialog({
                            isOpen: true,
                            page: activeLeftPage,
                            point: pt,
                            text: "",
                          });
                        }}
                      />
                    </div>
                  )}
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/15 to-transparent pointer-events-none" />
                </div>

                {/* Center Spine */}
                <div
                  className="w-2.5 self-stretch relative z-10 pointer-events-none"
                  style={{
                    background: "linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.3))",
                    boxShadow: "inset 0 0 4px rgba(0,0,0,0.35)",
                  }}
                />

                {/* Right Page */}
                <div
                  onMouseUp={(e) => handlePageMouseUp(e, activeRightPage)}
                  className="relative flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[380px] sm:min-h-[500px]"
                >
                  <div className="relative">
                    <canvas ref={canvasRightRef} className="block max-w-full h-auto object-contain rounded-sm" />
                    <DrawingCanvas
                      pageNumber={activeRightPage}
                      initialStrokes={annotations.drawings[activeRightPage] || []}
                      onStrokesChange={(strokes) => handleStrokesChange(activeRightPage, strokes)}
                      width={pageCanvasSize.width}
                      height={pageCanvasSize.height}
                      isDrawingActive={isStudyMode}
                      activeTool={activeTool}
                      activeColor={currentColor}
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                      fillMode={fillMode}
                      selectedStrokeId={selectedStrokeId}
                      onSelectStroke={setSelectedStrokeId}
                      visible={showAnnotationsOverlay}
                      onTextPrompt={(pt) => {
                        setTextBoxDialog({
                          isOpen: true,
                          page: activeRightPage,
                          point: pt,
                          text: "",
                        });
                      }}
                    />
                  </div>
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
                </div>
              </div>
            ) : (
              /* Single Page Mode */
              <div
                onMouseUp={(e) => handlePageMouseUp(e, currentPage)}
                className={`relative rounded-2xl shadow-[0_20px_55px_rgba(0,0,0,0.7)] border border-[#2b221a]/30 p-2 sm:p-4 transition-transform duration-300 ${
                  isFlipping ? (flipDirection === "next" ? "animate-page-flip-next" : "animate-page-flip-prev") : ""
                }`}
                style={{ backgroundColor: getPageBgColor() }}
              >
                <div className="relative">
                  <canvas ref={canvasSingleRef} className="block max-w-full h-auto object-contain rounded-sm" />
                  <DrawingCanvas
                    pageNumber={currentPage}
                    initialStrokes={annotations.drawings[currentPage] || []}
                    onStrokesChange={(strokes) => handleStrokesChange(currentPage, strokes)}
                    width={pageCanvasSize.width}
                    height={pageCanvasSize.height}
                    isDrawingActive={isStudyMode}
                    activeTool={activeTool}
                    activeColor={currentColor}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    fillMode={fillMode}
                    selectedStrokeId={selectedStrokeId}
                    onSelectStroke={setSelectedStrokeId}
                    visible={showAnnotationsOverlay}
                    onTextPrompt={(pt) => {
                      setTextBoxDialog({
                        isOpen: true,
                        page: currentPage,
                        point: pt,
                        text: "",
                      });
                    }}
                  />
                </div>
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
                  : showControls || isFocusMode
                  ? "opacity-80 hover:opacity-100 hover:scale-105 shadow-xl hover:border-[var(--accent)]"
                  : "opacity-0 hover:opacity-100"
              }`}
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
                  : showControls || isFocusMode
                  ? "opacity-80 hover:opacity-100 hover:scale-105 shadow-xl hover:border-[var(--accent)]"
                  : "opacity-0 hover:opacity-100"
              }`}
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
       * Bottom Progress & Navigation Toolbar
       * ------------------------------------------------------------- */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 flex flex-col gap-2 p-3 sm:p-4 bg-[var(--card)]/90 backdrop-blur-xl border-t border-[var(--border)]/70 transition-all duration-300 ${
          showControls || isFocusMode ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
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

          {/* Center Page Indicator with P1 Annotation Density Dots */}
          <div className="flex items-center gap-2">
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

              {/* Annotation density dot */}
              {pageAnnotationCount(currentPage) > 0 && (
                <span
                  className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"
                  title={`${pageAnnotationCount(currentPage)} study notes, highlights or bookmarks on this page`}
                />
              )}

              {isBookComplete ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Completed ✓
                </span>
              ) : (
                <span className="text-[10px] text-[var(--accent)] font-semibold">({progressPercent}%)</span>
              )}
            </button>
          </div>

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
            className={`h-full rounded-full transition-all duration-300 ${
              isBookComplete
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent-secondary)]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
