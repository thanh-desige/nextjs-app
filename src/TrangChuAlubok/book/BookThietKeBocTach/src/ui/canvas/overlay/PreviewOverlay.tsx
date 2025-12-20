/**
 * PreviewOverlay - Renders preview shapes while drawing
 * Shows rubber-band preview for lines, rectangles, circles, etc.
 */

"use client";

import React from "react";

export interface Point {
  x: number;
  y: number;
}

export type DrawingMode =
  | "idle"
  | "line"
  | "rect"
  | "circle"
  | "arc"
  | "ellipse"
  | "polyline"
  | "selecting";

export interface PreviewState {
  mode: DrawingMode;
  points: Point[];
  currentPoint?: Point;
  // For arc
  startAngle?: number;
  endAngle?: number;
  // For ellipse
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
}

export interface PreviewOverlayProps {
  width: number;
  height: number;
  pan: { x: number; y: number };
  zoom: number;
  preview: PreviewState | null;
  color?: string;
  lineWidth?: number;
  dashArray?: string;
}

export const PreviewOverlay: React.FC<PreviewOverlayProps> = ({
  width,
  height,
  pan,
  zoom,
  preview,
  color = "#00BFFF",
  lineWidth = 1,
  dashArray = "5,5",
}) => {
  if (!preview || preview.mode === "idle" || width <= 0 || height <= 0) {
    return null;
  }

  const centerX = width / 2 + pan.x;
  const centerY = height / 2 + pan.y;

  // Convert world to screen
  const toScreen = (p: Point) => ({
    x: centerX + p.x * zoom,
    y: centerY - p.y * zoom,
  });

  const renderPreview = () => {
    const { mode, points, currentPoint } = preview;

    if (!currentPoint || points.length === 0) {
      return null;
    }

    switch (mode) {
      case "line":
      case "polyline": {
        const screenPoints = [...points, currentPoint].map(toScreen);
        const pathData = screenPoints
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
        return (
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={lineWidth}
            strokeDasharray={dashArray}
          />
        );
      }

      case "rect": {
        const p1 = toScreen(points[0]);
        const p2 = toScreen(currentPoint);
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        return (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill="none"
            stroke={color}
            strokeWidth={lineWidth}
            strokeDasharray={dashArray}
          />
        );
      }

      case "circle": {
        const center = toScreen(points[0]);
        const edge = toScreen(currentPoint);
        const dx = edge.x - center.x;
        const dy = edge.y - center.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        return (
          <circle
            cx={center.x}
            cy={center.y}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={lineWidth}
            strokeDasharray={dashArray}
          />
        );
      }

      case "selecting": {
        const p1 = toScreen(points[0]);
        const p2 = toScreen(currentPoint);
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);

        // Crossing selection (right to left) uses dashed line
        const isCrossing = currentPoint.x < points[0].x;

        return (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill={
              isCrossing ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 100, 255, 0.1)"
            }
            stroke={isCrossing ? "#00FF00" : "#0064FF"}
            strokeWidth={1}
            strokeDasharray={isCrossing ? "5,5" : "none"}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      {renderPreview()}
    </svg>
  );
};

export default PreviewOverlay;
