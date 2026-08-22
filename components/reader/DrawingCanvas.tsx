"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { DrawingStroke, DrawingPoint } from "@/lib/reader-storage";

interface DrawingCanvasProps {
  pageNumber: number;
  initialStrokes?: DrawingStroke[];
  onStrokesChange?: (strokes: DrawingStroke[]) => void;
  width: number;
  height: number;
  isDrawingActive: boolean;
  activeColor: string;
  strokeWidth: number;
  isEraser: boolean;
}

export default function DrawingCanvas({
  pageNumber,
  initialStrokes = [],
  onStrokesChange,
  width,
  height,
  isDrawingActive,
  activeColor,
  strokeWidth,
  isEraser,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialStrokes);
  const isPaintingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<DrawingPoint[]>([]);

  // Update internal strokes when initialStrokes or page changes
  useEffect(() => {
    setStrokes(initialStrokes);
  }, [pageNumber, initialStrokes]);

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

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;

      const first = stroke.points[0];
      ctx.moveTo(first.x * width, first.y * height);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.stroke();
    }
  }, [strokes, width, height]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Pointer & Touch handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isPaintingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    currentPointsRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current || !isDrawingActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    currentPointsRef.current.push({ x, y });

    // Live preview stroke
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : activeColor;
    ctx.lineWidth = isEraser ? strokeWidth * 2 : strokeWidth;

    const pts = currentPointsRef.current;
    if (pts.length >= 2) {
      ctx.beginPath();
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
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

    if (currentPointsRef.current.length > 1) {
      if (isEraser) {
        // Erase strokes intersecting with points
        const eraserRadius = (strokeWidth * 2) / width;
        const pts = currentPointsRef.current;

        const filtered = strokes.filter((s) => {
          return !s.points.some((sp) =>
            pts.some((ep) => Math.hypot(sp.x - ep.x, sp.y - ep.y) < eraserRadius)
          );
        });

        setStrokes(filtered);
        onStrokesChange?.(filtered);
      } else {
        const newStroke: DrawingStroke = {
          id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          points: [...currentPointsRef.current],
          color: activeColor,
          width: strokeWidth,
        };

        const updated = [...strokes, newStroke];
        setStrokes(updated);
        onStrokesChange?.(updated);
      }
    }

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
