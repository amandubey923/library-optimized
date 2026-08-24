"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { DrawingStroke, DrawingPoint, AnnotationToolType } from "@/lib/reader-storage";

interface DrawingCanvasProps {
  pageNumber: number;
  initialStrokes?: DrawingStroke[];
  onStrokesChange?: (strokes: DrawingStroke[]) => void;
  width: number;
  height: number;
  isDrawingActive: boolean;
  activeTool: AnnotationToolType | "eraser" | "select";
  activeColor: string;
  strokeWidth: number;
  opacity: number; // 0.1 to 1.0
  fillMode: boolean; // For shapes
  onTextPrompt?: (point: DrawingPoint) => void;
  selectedStrokeId?: string | null;
  onSelectStroke?: (id: string | null) => void;
  visible?: boolean;
}

type HandleType =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "rot"
  | "start"
  | "end";

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

// -------------------------------------------------------------
// Geometric & Hit-Testing Helpers
// -------------------------------------------------------------
function distToSegmentSquared(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2;
}

function distToPolyline(px: number, py: number, points: DrawingPoint[], w: number, h: number): number {
  if (points.length < 2) {
    if (points.length === 1) {
      return Math.hypot(px - points[0].x * w, py - points[0].y * h);
    }
    return Infinity;
  }
  let minDistSq = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const d2 = distToSegmentSquared(
      px,
      py,
      points[i].x * w,
      points[i].y * h,
      points[i + 1].x * w,
      points[i + 1].y * h
    );
    if (d2 < minDistSq) minDistSq = d2;
  }
  return Math.sqrt(minDistSq);
}

function computeBoundingBox(stroke: DrawingStroke, w: number, h: number): BoundingBox {
  const pts = stroke.points;
  if (!pts || pts.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (stroke.type === "text" && stroke.text) {
    const pt = pts[0];
    const tx = pt.x * w;
    const ty = pt.y * h;
    const fontSize = stroke.fontSize || 16;
    const approxWidth = Math.max(60, stroke.text.length * (fontSize * 0.62) + 18);
    const approxHeight = fontSize + 16;

    minX = tx;
    minY = ty - fontSize - 6;
    maxX = tx + approxWidth;
    maxY = ty + 10;
  } else if (stroke.type === "square" && pts.length >= 2) {
    const p1 = pts[0];
    const p2 = pts[pts.length - 1];
    const dx = (p2.x - p1.x) * w;
    const dy = (p2.y - p1.y) * h;
    const side = Math.max(Math.abs(dx), Math.abs(dy));
    const sx = dx >= 0 ? p1.x * w : p1.x * w - side;
    const sy = dy >= 0 ? p1.y * h : p1.y * h - side;
    minX = sx;
    minY = sy;
    maxX = sx + side;
    maxY = sy + side;
  } else {
    for (const p of pts) {
      const px = p.x * w;
      const py = p.y * h;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }

  // Padding
  const pad = Math.max(6, (stroke.width || 2) * 1.5);
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(12, maxX - minX),
    height: Math.max(12, maxY - minY),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export default function DrawingCanvas({
  pageNumber,
  initialStrokes = [],
  onStrokesChange,
  width,
  height,
  isDrawingActive,
  activeTool,
  activeColor,
  strokeWidth,
  opacity,
  fillMode,
  onTextPrompt,
  selectedStrokeId = null,
  onSelectStroke,
  visible = true,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialStrokes);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedStrokeId);
  const [editingTextStroke, setEditingTextStroke] = useState<DrawingStroke | null>(null);
  const [editTextValue, setEditTextValue] = useState<string>("");

  // Interaction State
  const interactionModeRef = useRef<
    "idle" | "drawing" | "moving" | "resizing" | "dragging_handle" | "rotating"
  >("idle");
  const activeHandleRef = useRef<HandleType | null>(null);
  const startPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startStrokeSnapshotRef = useRef<DrawingStroke | null>(null);
  const currentPointsRef = useRef<DrawingPoint[]>([]);

  // Sync stroke state
  useEffect(() => {
    setStrokes(initialStrokes);
  }, [pageNumber, initialStrokes]);

  useEffect(() => {
    setLocalSelectedId(selectedStrokeId);
  }, [selectedStrokeId]);

  const selectStroke = useCallback(
    (id: string | null) => {
      setLocalSelectedId(id);
      onSelectStroke?.(id);
    },
    [onSelectStroke]
  );

  const selectedStroke = strokes.find((s) => s.id === localSelectedId) || null;

  // -------------------------------------------------------------
  // Draw Vector Objects
  // -------------------------------------------------------------
  const drawStrokeObject = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      stroke: DrawingStroke,
      w: number,
      h: number,
      isPreview = false
    ) => {
      const toolType = stroke.type || "pen";
      const pts = stroke.points;
      if (!pts || pts.length === 0) return;

      const strokeColor = stroke.color || "#f59e0b";
      const strokeWidthVal = stroke.width || 2;
      const isHighlighter = toolType === "highlighter";
      const itemOpacity = stroke.opacity ?? (isHighlighter ? 0.35 : 1.0);
      const isFilled = stroke.fill ?? false;

      ctx.save();
      ctx.globalAlpha = itemOpacity;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = strokeWidthVal;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 1. Freehand Pen & Highlighter
      if (toolType === "pen" || toolType === "highlighter") {
        if (pts.length < 2) {
          if (pts.length === 1) {
            ctx.beginPath();
            ctx.arc(pts[0].x * w, pts[0].y * h, strokeWidthVal / 2, 0, 2 * Math.PI);
            ctx.fill();
          }
          ctx.restore();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(pts[0].x * w, pts[0].y * h);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x * w + pts[i + 1].x * w) / 2;
          const yc = (pts[i].y * h + pts[i + 1].y * h) / 2;
          ctx.quadraticCurveTo(pts[i].x * w, pts[i].y * h, xc, yc);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x * w, last.y * h);
        ctx.stroke();
      }

      // 2. Straight Line
      else if (toolType === "line" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }

      // 3. Arrow (Excalidraw-Style Vector Arrow)
      else if (toolType === "arrow" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        const x1 = p1.x * w;
        const y1 = p1.y * h;
        const x2 = p2.x * w;
        const y2 = p2.y * h;

        // Line shaft
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = Math.max(12, strokeWidthVal * 3.5);

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }

      // 4. Circle / Ellipse
      else if (toolType === "circle" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        const x1 = p1.x * w;
        const y1 = p1.y * h;
        const x2 = p2.x * w;
        const y2 = p2.y * h;

        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.abs(y2 - y1) / 2;

        if (rx > 0 && ry > 0) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          if (isFilled) {
            ctx.globalAlpha = itemOpacity * 0.25;
            ctx.fill();
            ctx.globalAlpha = itemOpacity;
          }
          ctx.stroke();
        }
      }

      // 5. Rectangle
      else if (toolType === "rectangle" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        const rx = Math.min(p1.x, p2.x) * w;
        const ry = Math.min(p1.y, p2.y) * h;
        const rw = Math.abs(p2.x - p1.x) * w;
        const rh = Math.abs(p2.y - p1.y) * h;

        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        if (isFilled) {
          ctx.globalAlpha = itemOpacity * 0.25;
          ctx.fill();
          ctx.globalAlpha = itemOpacity;
        }
        ctx.stroke();
      }

      // 6. Square (1:1 Ratio)
      else if (toolType === "square" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        const dx = (p2.x - p1.x) * w;
        const dy = (p2.y - p1.y) * h;
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        const sx = dx >= 0 ? p1.x * w : p1.x * w - side;
        const sy = dy >= 0 ? p1.y * h : p1.y * h - side;

        ctx.beginPath();
        ctx.rect(sx, sy, side, side);
        if (isFilled) {
          ctx.globalAlpha = itemOpacity * 0.25;
          ctx.fill();
          ctx.globalAlpha = itemOpacity;
        }
        ctx.stroke();
      }

      // 7. Diamond (Rhombus)
      else if (toolType === "diamond" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        const x1 = p1.x * w;
        const y1 = p1.y * h;
        const x2 = p2.x * w;
        const y2 = p2.y * h;

        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.abs(y2 - y1) / 2;

        ctx.beginPath();
        ctx.moveTo(cx, cy - ry);
        ctx.lineTo(cx + rx, cy);
        ctx.lineTo(cx, cy + ry);
        ctx.lineTo(cx - rx, cy);
        ctx.closePath();

        if (isFilled) {
          ctx.globalAlpha = itemOpacity * 0.25;
          ctx.fill();
          ctx.globalAlpha = itemOpacity;
        }
        ctx.stroke();
      }

      // 8. Text Box Annotation
      else if (toolType === "text" && stroke.text) {
        const pt = pts[0];
        const tx = pt.x * w;
        const ty = pt.y * h;
        const fontSize = stroke.fontSize || 16;

        ctx.font = `600 ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(stroke.text);
        const padX = 10;
        const padY = 6;
        const textW = textMetrics.width + padX * 2;
        const textH = fontSize + padY * 2;

        // Clean backdrop pill with subtle shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.beginPath();
        ctx.roundRect(tx, ty - fontSize - padY, textW, textH, 8);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = strokeColor;
        ctx.fillText(stroke.text, tx + padX, ty - padY / 2);
      }

      ctx.restore();
    },
    []
  );

  // -------------------------------------------------------------
  // Draw Excalidraw-Style Selection Bounding Box & Handles
  // -------------------------------------------------------------
  const drawSelectionOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: DrawingStroke, w: number, h: number) => {
      const isArrowOrLine = stroke.type === "arrow" || stroke.type === "line";
      const pts = stroke.points;

      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#38bdf8"; // Excalidraw selection blue
      ctx.fillStyle = "#ffffff";

      if (isArrowOrLine && pts.length >= 2) {
        // Arrow/Line specific anchor handles
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        const x1 = p1.x * w;
        const y1 = p1.y * h;
        const x2 = p2.x * w;
        const y2 = p2.y * h;

        // Dotted connection line
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Start handle
        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // End handle
        ctx.beginPath();
        ctx.arc(x2, y2, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        // 8-Point Bounding Box Handles
        const bbox = computeBoundingBox(stroke, w, h);
        const { minX, minY, maxX, maxY, width: bw, height: bh, centerX } = bbox;

        ctx.setLineDash([4, 4]);
        ctx.strokeRect(minX, minY, bw, bh);
        ctx.setLineDash([]);

        const handleSize = 8;
        const half = handleSize / 2;

        const handles = [
          { x: minX, y: minY }, // nw
          { x: centerX, y: minY }, // n
          { x: maxX, y: minY }, // ne
          { x: maxX, y: (minY + maxY) / 2 }, // e
          { x: maxX, y: maxY }, // se
          { x: centerX, y: maxY }, // s
          { x: minX, y: maxY }, // sw
          { x: minX, y: (minY + maxY) / 2 }, // w
        ];

        for (const h of handles) {
          ctx.fillRect(h.x - half, h.y - half, handleSize, handleSize);
          ctx.strokeRect(h.x - half, h.y - half, handleSize, handleSize);
        }

        // Top rotation handle stem
        const rotY = minY - 20;
        ctx.beginPath();
        ctx.moveTo(centerX, minY);
        ctx.lineTo(centerX, rotY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, rotY, 4.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    },
    []
  );

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!visible) return;

    // Layer 1: Highlighters
    for (const stroke of strokes) {
      if (stroke.type === "highlighter") {
        drawStrokeObject(ctx, stroke, width, height);
      }
    }

    // Layer 2: Pen strokes, shapes, and texts
    for (const stroke of strokes) {
      if (stroke.type !== "highlighter") {
        drawStrokeObject(ctx, stroke, width, height);
      }
    }

    // Layer 3: Selection handles (if in select mode or study mode)
    if (isDrawingActive && selectedStroke) {
      drawSelectionOverlay(ctx, selectedStroke, width, height);
    }
  }, [strokes, width, height, visible, isDrawingActive, selectedStroke, drawStrokeObject, drawSelectionOverlay]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // -------------------------------------------------------------
  // Hit-Testing: Check if pointer clicked an object or handle
  // -------------------------------------------------------------
  const getHandleUnderPointer = (
    stroke: DrawingStroke,
    px: number,
    py: number
  ): HandleType | null => {
    const isArrowOrLine = stroke.type === "arrow" || stroke.type === "line";
    const pts = stroke.points;
    const hitRadius = 10;

    if (isArrowOrLine && pts.length >= 2) {
      const p1 = pts[0];
      const p2 = pts[pts.length - 1];
      if (Math.hypot(px - p1.x * width, py - p1.y * height) <= hitRadius) return "start";
      if (Math.hypot(px - p2.x * width, py - p2.y * height) <= hitRadius) return "end";
      return null;
    }

    const bbox = computeBoundingBox(stroke, width, height);
    const { minX, minY, maxX, maxY, centerX } = bbox;

    if (Math.hypot(px - centerX, py - (minY - 20)) <= hitRadius) return "rot";
    if (Math.hypot(px - minX, py - minY) <= hitRadius) return "nw";
    if (Math.hypot(px - centerX, py - minY) <= hitRadius) return "n";
    if (Math.hypot(px - maxX, py - minY) <= hitRadius) return "ne";
    if (Math.hypot(px - maxX, py - (minY + maxY) / 2) <= hitRadius) return "e";
    if (Math.hypot(px - maxX, py - maxY) <= hitRadius) return "se";
    if (Math.hypot(px - centerX, py - maxY) <= hitRadius) return "s";
    if (Math.hypot(px - minX, py - maxY) <= hitRadius) return "sw";
    if (Math.hypot(px - minX, py - (minY + maxY) / 2) <= hitRadius) return "w";

    return null;
  };

  const getStrokeUnderPointer = (px: number, py: number): DrawingStroke | null => {
    const hitThreshold = 14;
    // Test in reverse order (topmost first)
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      const pts = s.points;
      if (!pts || pts.length === 0) continue;

      if (s.type === "text") {
        const bbox = computeBoundingBox(s, width, height);
        if (px >= bbox.minX && px <= bbox.maxX && py >= bbox.minY && py <= bbox.maxY) {
          return s;
        }
      } else if (
        s.type === "rectangle" ||
        s.type === "square" ||
        s.type === "circle" ||
        s.type === "diamond"
      ) {
        const bbox = computeBoundingBox(s, width, height);
        // If filled, check inside bounds; otherwise check boundary distance
        if (s.fill && px >= bbox.minX && px <= bbox.maxX && py >= bbox.minY && py <= bbox.maxY) {
          return s;
        }
        if (distToPolyline(px, py, pts, width, height) <= hitThreshold) {
          return s;
        }
        if (
          Math.abs(px - bbox.minX) <= hitThreshold ||
          Math.abs(px - bbox.maxX) <= hitThreshold ||
          Math.abs(py - bbox.minY) <= hitThreshold ||
          Math.abs(py - bbox.maxY) <= hitThreshold
        ) {
          if (px >= bbox.minX - 6 && px <= bbox.maxX + 6 && py >= bbox.minY - 6 && py <= bbox.maxY + 6) {
            return s;
          }
        }
      } else {
        // Freehand pen, highlighter, lines, arrows
        if (distToPolyline(px, py, pts, width, height) <= hitThreshold) {
          return s;
        }
      }
    }
    return null;
  };

  // -------------------------------------------------------------
  // Pointer Event Handlers
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const normX = Math.max(0, Math.min(1, px / width));
    const normY = Math.max(0, Math.min(1, py / height));

    startPointerPosRef.current = { x: px, y: py };

    // 1. Text Tool -> Trigger prompt/modal
    if (activeTool === "text") {
      onTextPrompt?.({ x: normX, y: normY });
      return;
    }

    // 2. Eraser Mode -> Hit and remove
    if (activeTool === "eraser") {
      const hit = getStrokeUnderPointer(px, py);
      if (hit) {
        const updated = strokes.filter((s) => s.id !== hit.id);
        setStrokes(updated);
        onStrokesChange?.(updated);
        selectStroke(null);
      }
      return;
    }

    // 3. Selection Handle Drag (Resize / Anchor Move)
    if (selectedStroke) {
      const handle = getHandleUnderPointer(selectedStroke, px, py);
      if (handle) {
        canvas.setPointerCapture(e.pointerId);
        interactionModeRef.current = "resizing";
        activeHandleRef.current = handle;
        startStrokeSnapshotRef.current = JSON.parse(JSON.stringify(selectedStroke));
        return;
      }
    }

    // 4. Object Click / Selection
    const clickedStroke = getStrokeUnderPointer(px, py);

    if (activeTool === "select" || (clickedStroke && activeTool === "pen")) {
      if (clickedStroke) {
        selectStroke(clickedStroke.id);
        canvas.setPointerCapture(e.pointerId);
        interactionModeRef.current = "moving";
        startStrokeSnapshotRef.current = JSON.parse(JSON.stringify(clickedStroke));
        return;
      } else if (activeTool === "select") {
        selectStroke(null);
        return;
      }
    }

    // 5. Draw New Stroke / Shape
    canvas.setPointerCapture(e.pointerId);
    interactionModeRef.current = "drawing";
    currentPointsRef.current = [{ x: normX, y: normY }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingActive || interactionModeRef.current === "idle") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const normX = Math.max(0, Math.min(1, px / width));
    const normY = Math.max(0, Math.min(1, py / height));

    const dx = (px - startPointerPosRef.current.x) / width;
    const dy = (py - startPointerPosRef.current.y) / height;

    // A. Move Selected Object
    if (interactionModeRef.current === "moving" && startStrokeSnapshotRef.current) {
      const snapshot = startStrokeSnapshotRef.current;
      const updatedStroke: DrawingStroke = {
        ...snapshot,
        points: snapshot.points.map((p) => ({
          x: Math.max(0, Math.min(1, p.x + dx)),
          y: Math.max(0, Math.min(1, p.y + dy)),
        })),
      };

      setStrokes((prev) => prev.map((s) => (s.id === updatedStroke.id ? updatedStroke : s)));
      return;
    }

    // B. Resize / Anchor Handle Drag
    if (
      interactionModeRef.current === "resizing" &&
      startStrokeSnapshotRef.current &&
      activeHandleRef.current
    ) {
      const snapshot = startStrokeSnapshotRef.current;
      const handle = activeHandleRef.current;
      const pts = [...snapshot.points];

      if (handle === "start" && pts.length >= 1) {
        pts[0] = { x: normX, y: normY };
      } else if (handle === "end" && pts.length >= 2) {
        pts[pts.length - 1] = { x: normX, y: normY };
      } else if (pts.length >= 2) {
        // Shape resize (p1 = top-left/start, p2 = bottom-right/end)
        const p1 = { ...pts[0] };
        const p2 = { ...pts[pts.length - 1] };

        if (handle.includes("w")) p1.x = Math.min(normX, p2.x - 0.01);
        if (handle.includes("e")) p2.x = Math.max(normX, p1.x + 0.01);
        if (handle.includes("n")) p1.y = Math.min(normY, p2.y - 0.01);
        if (handle.includes("s")) p2.y = Math.max(normY, p1.y + 0.01);

        pts[0] = p1;
        pts[pts.length - 1] = p2;
      }

      const updatedStroke: DrawingStroke = { ...snapshot, points: pts };
      setStrokes((prev) => prev.map((s) => (s.id === updatedStroke.id ? updatedStroke : s)));
      return;
    }

    // C. Live Drawing Mode
    if (interactionModeRef.current === "drawing") {
      if (activeTool === "pen" || activeTool === "highlighter") {
        currentPointsRef.current.push({ x: normX, y: normY });
      } else {
        currentPointsRef.current = [currentPointsRef.current[0] || { x: normX, y: normY }, { x: normX, y: normY }];
      }

      // Render live preview
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const s of strokes) {
        drawStrokeObject(ctx, s, width, height);
      }

      const validTool: AnnotationToolType =
        activeTool === "select" || activeTool === "eraser" ? "pen" : activeTool;

      const previewStroke: DrawingStroke = {
        id: "preview",
        type: validTool,
        points: currentPointsRef.current,
        color: activeColor,
        width: activeTool === "highlighter" ? strokeWidth * 3.5 : strokeWidth,
        opacity: activeTool === "highlighter" ? 0.35 : opacity,
        fill: fillMode,
      };
      drawStrokeObject(ctx, previewStroke, width, height, true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }

    // Commit Move or Resize
    if (interactionModeRef.current === "moving" || interactionModeRef.current === "resizing") {
      interactionModeRef.current = "idle";
      activeHandleRef.current = null;
      startStrokeSnapshotRef.current = null;
      onStrokesChange?.(strokes);
      redraw();
      return;
    }

    // Commit New Drawing
    if (interactionModeRef.current === "drawing") {
      interactionModeRef.current = "idle";

      if (currentPointsRef.current.length >= 2 && activeTool !== "eraser" && activeTool !== "select") {
        const validTool: AnnotationToolType = activeTool;
        const newStroke: DrawingStroke = {
          id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: validTool,
          points: [...currentPointsRef.current],
          color: activeColor,
          width: activeTool === "highlighter" ? strokeWidth * 3.5 : strokeWidth,
          opacity: activeTool === "highlighter" ? 0.35 : opacity,
          fill: fillMode,
        };

        const updated = [...strokes, newStroke];
        setStrokes(updated);
        onStrokesChange?.(updated);
        selectStroke(newStroke.id);
      }

      currentPointsRef.current = [];
      redraw();
    }
  };

  // Double click text -> inline editor
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const hit = getStrokeUnderPointer(px, py);
    if (hit && hit.type === "text") {
      setEditingTextStroke(hit);
      setEditTextValue(hit.text || "");
    }
  };

  // Keyboard Shortcuts for Object Editing
  useEffect(() => {
    if (!isDrawingActive || !localSelectedId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      // Delete / Backspace -> Delete Object
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const updated = strokes.filter((s) => s.id !== localSelectedId);
        setStrokes(updated);
        onStrokesChange?.(updated);
        selectStroke(null);
      }

      // Duplicate (Ctrl+D / Cmd+D)
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        const target = strokes.find((s) => s.id === localSelectedId);
        if (target) {
          const offset = 18 / width;
          const clone: DrawingStroke = {
            ...target,
            id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            points: target.points.map((p) => ({ x: Math.min(1, p.x + offset), y: Math.min(1, p.y + offset) })),
          };
          const updated = [...strokes, clone];
          setStrokes(updated);
          onStrokesChange?.(updated);
          selectStroke(clone.id);
        }
      }

      // Escape -> Deselect
      if (e.key === "Escape") {
        selectStroke(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawingActive, localSelectedId, strokes, onStrokesChange, selectStroke, width]);

  // Selected Object Bounding Box for Floating Action Pill
  const selectedBBox = selectedStroke ? computeBoundingBox(selectedStroke, width, height) : null;

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={`w-full h-full touch-none ${
          isDrawingActive
            ? activeTool === "select"
              ? "cursor-default pointer-events-auto"
              : "cursor-crosshair pointer-events-auto"
            : "pointer-events-none"
        }`}
      />

      {/* Floating Excalidraw-Style Action Pill for Selected Object */}
      {isDrawingActive && selectedStroke && selectedBBox && !editingTextStroke && (
        <div
          style={{
            position: "absolute",
            left: `${Math.max(10, Math.min(width - 160, selectedBBox.centerX - 65))}px`,
            top: `${Math.max(10, selectedBBox.minY - 42)}px`,
            zIndex: 35,
          }}
          className="pointer-events-auto flex items-center gap-1 p-1 bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl animate-fade-in text-xs"
        >
          {selectedStroke.type === "text" && (
            <button
              onClick={() => {
                setEditingTextStroke(selectedStroke);
                setEditTextValue(selectedStroke.text || "");
              }}
              className="p-1 px-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Edit Text"
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={() => {
              const offset = 18 / width;
              const clone: DrawingStroke = {
                ...selectedStroke,
                id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                points: selectedStroke.points.map((p) => ({
                  x: Math.min(1, p.x + offset),
                  y: Math.min(1, p.y + offset),
                })),
              };
              const updated = [...strokes, clone];
              setStrokes(updated);
              onStrokesChange?.(updated);
              selectStroke(clone.id);
            }}
            className="p-1 px-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            title="Duplicate Object (Ctrl+D)"
          >
            <span>📋</span>
          </button>

          <button
            onClick={() => {
              const updated = strokes.filter((s) => s.id !== selectedStroke.id);
              setStrokes(updated);
              onStrokesChange?.(updated);
              selectStroke(null);
            }}
            className="p-1 px-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            title="Delete Selected Object (Del)"
          >
            <span>🗑️</span>
          </button>
        </div>
      )}

      {/* Inline Text Editing Modal / Overlay */}
      {editingTextStroke && (
        <div
          style={{
            position: "absolute",
            left: `${editingTextStroke.points[0].x * width}px`,
            top: `${editingTextStroke.points[0].y * height - 20}px`,
            zIndex: 40,
          }}
          className="pointer-events-auto animate-fade-in"
        >
          <div className="flex flex-col gap-1 p-2 bg-[var(--card)]/95 backdrop-blur-2xl border border-[var(--accent)] rounded-2xl shadow-2xl min-w-[200px]">
            <textarea
              autoFocus
              rows={2}
              value={editTextValue}
              onChange={(e) => setEditTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const updated = strokes.map((s) =>
                    s.id === editingTextStroke.id ? { ...s, text: editTextValue } : s
                  );
                  setStrokes(updated);
                  onStrokesChange?.(updated);
                  setEditingTextStroke(null);
                } else if (e.key === "Escape") {
                  setEditingTextStroke(null);
                }
              }}
              className="w-full p-2 bg-black/40 border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--accent)] resize-none"
            />
            <div className="flex justify-end gap-1.5 pt-1 text-xs">
              <button
                onClick={() => setEditingTextStroke(null)}
                className="px-2.5 py-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updated = strokes.map((s) =>
                    s.id === editingTextStroke.id ? { ...s, text: editTextValue } : s
                  );
                  setStrokes(updated);
                  onStrokesChange?.(updated);
                  setEditingTextStroke(null);
                }}
                className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
