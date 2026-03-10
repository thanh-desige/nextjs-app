/**
 * SelectionHighlight — SVG overlay for selection box rendering
 *
 * STEP-4.1: Extracted from CadDrawingCanvas canvas-based rendering.
 * Renders window select (left→right, green solid) and
 * crossing select (right→left, cyan dashed) boxes.
 *
 * Matches AutoCAD behavior:
 * - Window (L→R): solid border, light fill — selects entities FULLY inside
 * - Crossing (R→L): dashed border, light fill — selects entities TOUCHING
 */

"use client";

import React from "react";

export interface SelectionHighlightProps {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Pan offset */
  pan: { x: number; y: number };
  /** Zoom level */
  zoom: number;
  /** Start point in world coordinates */
  start: { x: number; y: number } | null;
  /** Current/end point in world coordinates */
  end: { x: number; y: number } | null;
}

export const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  width,
  height,
  pan,
  zoom,
  start,
  end,
}) => {
  if (!start || !end || width <= 0 || height <= 0) {
    return null;
  }

  const centerX = width / 2 + pan.x;
  const centerY = height / 2 + pan.y;

  // World → Screen conversion
  const toScreen = (p: { x: number; y: number }) => ({
    x: centerX + p.x * zoom,
    y: centerY - p.y * zoom,
  });

  const s1 = toScreen(start);
  const s2 = toScreen(end);

  const x = Math.min(s1.x, s2.x);
  const y = Math.min(s1.y, s2.y);
  const w = Math.abs(s2.x - s1.x);
  const h = Math.abs(s2.y - s1.y);

  // Window select (L→R) = green solid, Crossing (R→L) = cyan dashed
  const isWindowSelect = s2.x >= s1.x;
  const strokeColor = isWindowSelect ? "#00ff00" : "#00ffff";
  const fillColor = isWindowSelect
    ? "rgba(0, 255, 0, 0.08)"
    : "rgba(0, 255, 255, 0.08)";
  const dashArray = isWindowSelect ? undefined : "4,4";

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
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
        strokeDasharray={dashArray}
      />
    </svg>
  );
};

export default SelectionHighlight;
