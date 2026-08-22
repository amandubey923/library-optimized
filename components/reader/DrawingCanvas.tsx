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
  const isPaintingRef = useRef<boolean>(false);
  const startPointRef = useRef<DrawingPoint | null>(null);
  const currentPointsRef = useRef<DrawingPoint[]>([]);

  // Update internal strokes when initialStrokes or page changes
  useEffect(() => {
    setStrokes(initialStrokes);
  }, [pageNumber, initialStrokes]);

  // Helper to draw an individual stroke or shape onto context
  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: DrawingStroke, w: number, h: number, isPreview = false) => {
      const toolType = stroke.type || "pen";
      const pts = stroke.points;
      if (!pts || pts.length === 0) return;

      const strokeColor = stroke.color;
      const strokeWidthVal = stroke.width;
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

      if (stroke.id === selectedStrokeId && !isPreview) {
        ctx.shadowColor = "var(--accent, #f59e0b)";
        ctx.shadowBlur = 8;
      }

      // -------------------------------------------------------------
      // 1. Pen & Highlighter (Freehand)
      // -------------------------------------------------------------
      if (toolType === "pen" || toolType === "highlighter") {
        if (pts.length < 2) {
          ctx.restore();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(pts[0].x * w, pts[0].y * h);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * w, pts[i].y * h);
        }
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // 2. Straight Line
      // -------------------------------------------------------------
      else if (toolType === "line" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // 3. Arrow
      // -------------------------------------------------------------
      else if (toolType === "arrow" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[pts.length - 1];
        const x1 = p1.x * w;
        const y1 = p1.y * h;
        const x2 = p2.x * w;
        const y2 = p2.y * h;

        // Main line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = Math.max(10, strokeWidthVal * 3);

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

      // -------------------------------------------------------------
      // 4. Circle / Ellipse
      // -------------------------------------------------------------
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

      // -------------------------------------------------------------
      // 5. Rectangle
      // -------------------------------------------------------------
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

      // -------------------------------------------------------------
      // 6. Square (1:1 Equal Dimensions)
      // -------------------------------------------------------------
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

      // -------------------------------------------------------------
      // 7. Diamond (Rhombus 4-Point Polygon)
      // -------------------------------------------------------------
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

      // -------------------------------------------------------------
      // 8. Text Box Annotation
      // -------------------------------------------------------------
      else if (toolType === "text" && stroke.text) {
        const pt = pts[0];
        const tx = pt.x * w;
        const ty = pt.y * h;
        const fontSize = stroke.fontSize || 14;

        ctx.font = `bold ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(stroke.text);
        const padX = 8;
        const padY = 4;
        const textW = textMetrics.width + padX * 2;
        const textH = fontSize + padY * 2;

        // Background pill
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.beginPath();
        ctx.roundRect(tx, ty - fontSize - padY, textW, textH, 6);
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Text
        ctx.fillStyle = strokeColor;
        ctx.fillText(stroke.text, tx + padX, ty - padY / 2);
      }

      ctx.restore();
    },
    [selectedStrokeId]
  );

  // Redraw all strokes onto canvas with high-DPI
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

    // Layer 1: Highlighters first (so they stay underneath opaque pen marks)
    for (const stroke of strokes) {
      if (stroke.type === "highlighter") {
        drawShape(ctx, stroke, width, height);
      }
    }

    // Layer 2: Other vector strokes, shapes, and texts
    for (const stroke of strokes) {
      if (stroke.type !== "highlighter") {
        drawShape(ctx, stroke, width, height);
      }
    }
  }, [strokes, width, height, visible, drawShape]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Pointer & Touch Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // -------------------------------------------------------------
    // Text Tool: Prompt for Text Insertion
    // -------------------------------------------------------------
    if (activeTool === "text") {
      onTextPrompt?.({ x, y });
      return;
    }

    // -------------------------------------------------------------
    // Smart Eraser / Select Mode: Hit-Testing
    // -------------------------------------------------------------
    if (activeTool === "eraser" || activeTool === "select") {
      const hitRadius = 14 / width;
      const clickedStroke = strokes.find((s) =>
        s.points.some((p) => Math.hypot(p.x - x, p.y - y) < hitRadius)
      );

      if (clickedStroke) {
        if (activeTool === "eraser") {
          const updated = strokes.filter((s) => s.id !== clickedStroke.id);
          setStrokes(updated);
          onStrokesChange?.(updated);
          onSelectStroke?.(null);
        } else {
          onSelectStroke?.(clickedStroke.id);
        }
      } else if (activeTool === "select") {
        onSelectStroke?.(null);
      }
      return;
    }

    // Standard Drawing / Shape Mode
    canvas.setPointerCapture(e.pointerId);
    isPaintingRef.current = true;
    startPointRef.current = { x, y };
    currentPointsRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current || !isDrawingActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (activeTool === "pen" || activeTool === "highlighter") {
      currentPointsRef.current.push({ x, y });
    } else {
      // For shapes, keep start point and update current end point
      currentPointsRef.current = [startPointRef.current || { x, y }, { x, y }];
    }

    // Live preview on canvas
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and redraw committed strokes
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    for (const s of strokes) {
      drawShape(ctx, s, width, height);
    }

    // Draw active preview stroke/shape
    const validToolType: AnnotationToolType =
      activeTool === "select" || activeTool === "eraser" ? "pen" : activeTool;

    const previewStroke: DrawingStroke = {
      id: "preview",
      type: validToolType,
      points: currentPointsRef.current,
      color: activeColor,
      width: activeTool === "highlighter" ? strokeWidth * 3.5 : strokeWidth,
      opacity: activeTool === "highlighter" ? 0.35 : opacity,
      fill: fillMode,
    };
    drawShape(ctx, previewStroke, width, height, true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    if (currentPointsRef.current.length >= 2 && activeTool !== "eraser" && activeTool !== "select") {
      const validToolType: AnnotationToolType = activeTool;
      const newStroke: DrawingStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: validToolType,
        points: [...currentPointsRef.current],
        color: activeColor,
        width: activeTool === "highlighter" ? strokeWidth * 3.5 : strokeWidth,
        opacity: activeTool === "highlighter" ? 0.35 : opacity,
        fill: fillMode,
      };

      const updated = [...strokes, newStroke];
      setStrokes(updated);
      onStrokesChange?.(updated);
    }

    startPointRef.current = null;
    currentPointsRef.current = [];
    redraw();
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`absolute inset-0 z-20 touch-none ${
        isDrawingActive ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
      }`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}
