/**
 * doorRendererPrimitives.tsx
 *
 * Reusable SVG sub-components for door rendering (STEP-5.12)
 * Extracted from DoorRendererDetailed.tsx
 *
 * Exports: COLORS, dimension constants, DimensionLine, Hinge, Connector, Handle, GlassPattern
 */

"use client";

import React, { memo } from "react";

// ==================== CONSTANTS ====================

export const COLORS = {
  frame: "#00CED1", // Cyan - khung bao
  sash: "#4169E1", // Royal Blue - cánh
  glass: "#9ACD32", // Yellow Green - kính
  hinge: "#FF4444", // Red - bản lề
  handle: "#FF6B6B", // Light Red - tay nắm
  connector: "#00FFFF", // Cyan - điểm nối
  dimension: "#FF00FF", // Magenta - kích thước
  dimensionText: "#00FFFF", // Cyan - text kích thước
  selected: "#FFD700", // Gold - khi chọn
};

// Độ dày mặc định (mm) - sẽ scale theo canvas
export const FRAME_THICKNESS = 50; // Độ dày khung bao
export const SASH_THICKNESS = 40; // Độ dày cánh
export const MULLION_WIDTH = 30; // Độ rộng đố
export const HINGE_SIZE = 15; // Kích thước bản lề
export const HANDLE_WIDTH = 8; // Chiều rộng tay nắm
export const HANDLE_HEIGHT = 80; // Chiều cao tay nắm

// ==================== SUB-COMPONENTS ====================

/**
 * Dimension Line với mũi tên 2 đầu
 */
export const DimensionLine = memo(function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  value,
  offset = 30,
  isHorizontal = true,
  canvasScale = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;
  offset?: number;
  isHorizontal?: boolean;
  canvasScale?: number;
}) {
  const strokeWidth = Math.max(0.5, 1 / canvasScale);
  const fontSize = Math.max(8, 12 / canvasScale);
  const arrowSize = Math.max(3, 6 / canvasScale);

  // Offset position
  const ox = isHorizontal ? 0 : offset;
  const oy = isHorizontal ? -offset : 0;

  const dx1 = x1 + ox;
  const dy1 = y1 + oy;
  const dx2 = x2 + ox;
  const dy2 = y2 + oy;

  // Extension lines
  const extLen = offset * 0.8;
  void extLen; // Available for future use

  // Text position
  const textX = (dx1 + dx2) / 2;
  const textY = (dy1 + dy2) / 2;

  return (
    <g className="dimension">
      {/* Extension lines */}
      <line
        x1={x1}
        y1={y1}
        x2={dx1}
        y2={dy1 - extLen * 0.2}
        stroke={COLORS.dimension}
        strokeWidth={strokeWidth * 0.5}
      />
      <line
        x1={x2}
        y1={y2}
        x2={dx2}
        y2={dy2 - extLen * 0.2}
        stroke={COLORS.dimension}
        strokeWidth={strokeWidth * 0.5}
      />

      {/* Dimension line */}
      <line
        x1={dx1}
        y1={dy1}
        x2={dx2}
        y2={dy2}
        stroke={COLORS.dimension}
        strokeWidth={strokeWidth}
      />

      {/* Arrows */}
      {isHorizontal ? (
        <>
          <polygon
            points={`${dx1},${dy1} ${dx1 + arrowSize},${dy1 - arrowSize / 2} ${
              dx1 + arrowSize
            },${dy1 + arrowSize / 2}`}
            fill={COLORS.dimension}
          />
          <polygon
            points={`${dx2},${dy2} ${dx2 - arrowSize},${dy2 - arrowSize / 2} ${
              dx2 - arrowSize
            },${dy2 + arrowSize / 2}`}
            fill={COLORS.dimension}
          />
        </>
      ) : (
        <>
          <polygon
            points={`${dx1},${dy1} ${dx1 - arrowSize / 2},${dy1 + arrowSize} ${
              dx1 + arrowSize / 2
            },${dy1 + arrowSize}`}
            fill={COLORS.dimension}
          />
          <polygon
            points={`${dx2},${dy2} ${dx2 - arrowSize / 2},${dy2 - arrowSize} ${
              dx2 + arrowSize / 2
            },${dy2 - arrowSize}`}
            fill={COLORS.dimension}
          />
        </>
      )}

      {/* Text - Flip for canvas coordinate */}
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={COLORS.dimensionText}
        fontSize={fontSize}
        fontWeight="bold"
        transform={`translate(${textX}, ${textY}) scale(1, -1) translate(${-textX}, ${-textY})`}
      >
        {value}
      </text>
    </g>
  );
});

/**
 * Hinge (bản lề) - hình vuông đỏ
 */
export const Hinge = memo(function Hinge({
  x,
  y,
  size,
  canvasScale = 1,
}: {
  x: number;
  y: number;
  size: number;
  canvasScale?: number;
}) {
  const s = size / canvasScale;
  return (
    <rect
      x={x - s / 2}
      y={y - s / 2}
      width={s}
      height={s}
      fill="none"
      stroke={COLORS.hinge}
      strokeWidth={Math.max(0.5, 1 / canvasScale)}
    />
  );
});

/**
 * Connector (điểm nối góc) - hình thoi
 */
export const Connector = memo(function Connector({
  x,
  y,
  size,
  canvasScale = 1,
}: {
  x: number;
  y: number;
  size: number;
  canvasScale?: number;
}) {
  const s = size / canvasScale;
  return (
    <polygon
      points={`${x},${y - s / 2} ${x + s / 2},${y} ${x},${y + s / 2} ${
        x - s / 2
      },${y}`}
      fill="none"
      stroke={COLORS.connector}
      strokeWidth={Math.max(0.5, 1 / canvasScale)}
    />
  );
});

/**
 * Handle (tay nắm)
 */
export const Handle = memo(function Handle({
  x,
  y,
  width,
  height,
  canvasScale = 1,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  canvasScale?: number;
}) {
  return (
    <rect
      x={x - width / 2}
      y={y - height / 2}
      width={width}
      height={height}
      fill="none"
      stroke={COLORS.handle}
      strokeWidth={Math.max(0.5, 1 / canvasScale)}
    />
  );
});

/**
 * Glass pattern (đường chéo thể hiện kính)
 */
export const GlassPattern = memo(function GlassPattern({
  x,
  y,
  width,
  height,
  canvasScale = 1,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  canvasScale?: number;
}) {
  const strokeWidth = Math.max(0.3, 0.5 / canvasScale);
  const gap = Math.max(15, 30 / canvasScale);

  const lines = [];
  const numLines = Math.floor(height / gap);

  for (let i = 0; i < numLines; i++) {
    const startY = y + gap * (i + 0.5);
    const endY = startY + gap * 0.8;
    if (endY <= y + height) {
      lines.push(
        <line
          key={i}
          x1={x + 5}
          y1={startY}
          x2={x + width - 5}
          y2={Math.min(endY, y + height - 5)}
          stroke={COLORS.glass}
          strokeWidth={strokeWidth}
        />
      );
    }
  }

  return <g className="glass-pattern">{lines}</g>;
});
