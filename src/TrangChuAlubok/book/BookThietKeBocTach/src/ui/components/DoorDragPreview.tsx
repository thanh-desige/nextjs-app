/**
 * DoorDragPreview - Preview khi đang kéo cửa từ sidebar
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: CadDrawingCanvas
 * - KHÔNG được import từ: door-engines, analysis, systems
 */

"use client";

import React, { memo } from "react";
import { useDoorStore } from "../../store/doorStore";
import { DoorFactory } from "../../domain/door/DoorFactory";
import type { DoorVariant } from "../../core/entities/DoorEntity";

interface DoorDragPreviewProps {
  /** Scale của canvas */
  canvasScale?: number;
}

/**
 * Màu preview theo loại cửa
 */
const PREVIEW_COLORS: Record<string, string> = {
  "hinged-single": "#3498db",
  "hinged-double": "#2980b9",
  "sliding-2p": "#27ae60",
  "sliding-4p": "#16a085",
  fixed: "#9b59b6",
  awning: "#e67e22",
  casement: "#e74c3c",
};

/**
 * Door Drag Preview Component
 */
export const DoorDragPreview = memo(function DoorDragPreview({
  canvasScale = 1,
}: DoorDragPreviewProps) {
  const draggingDoor = useDoorStore((state) => state.draggingDoor);

  // Không render nếu không có cửa đang kéo
  if (!draggingDoor || !draggingDoor.previewPosition) {
    return null;
  }

  const { variant, previewPosition } = draggingDoor;
  const defaultSize = DoorFactory.getDefaultSize(variant as DoorVariant);
  const { width, height } = defaultSize;
  const { x, y } = previewPosition;

  const color = PREVIEW_COLORS[variant] || "#9b59b6";
  const strokeWidth = Math.max(2, 2 / canvasScale);

  return (
    <g
      transform={`translate(${x - width / 2}, ${y - height / 2})`}
      style={{ pointerEvents: "none" }}
      opacity={0.7}
    >
      {/* Outer frame */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={`${color}20`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${8 / canvasScale} ${4 / canvasScale}`}
      />

      {/* Inner frame */}
      <rect
        x={width * 0.05}
        y={height * 0.05}
        width={width * 0.9}
        height={height * 0.9}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * 0.5}
        strokeDasharray={`${4 / canvasScale} ${2 / canvasScale}`}
      />

      {/* Center crosshair */}
      <line
        x1={width / 2 - 20 / canvasScale}
        y1={height / 2}
        x2={width / 2 + 20 / canvasScale}
        y2={height / 2}
        stroke={color}
        strokeWidth={1 / canvasScale}
      />
      <line
        x1={width / 2}
        y1={height / 2 - 20 / canvasScale}
        x2={width / 2}
        y2={height / 2 + 20 / canvasScale}
        stroke={color}
        strokeWidth={1 / canvasScale}
      />

      {/* Size label */}
      <text
        x={width / 2}
        y={height / 2 + 30 / canvasScale}
        textAnchor="middle"
        fill={color}
        fontSize={Math.max(12 / canvasScale, 10)}
        fontWeight="bold"
      >
        {width} × {height}
      </text>
    </g>
  );
});

export default DoorDragPreview;
