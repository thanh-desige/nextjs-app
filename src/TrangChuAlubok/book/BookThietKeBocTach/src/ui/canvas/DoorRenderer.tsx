/**
 * DoorRenderer - Render cửa trên canvas (Preview đơn giản)
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: CadDrawingCanvas
 * - KHÔNG được import từ: door-engines, analysis, systems
 *
 * Component này CHỈ render preview/bounding box
 * KHÔNG render geometry chi tiết
 */

"use client";

import React, { memo } from "react";
import type { DoorEntity } from "../../core/entities/DoorEntity";

interface DoorRendererProps {
  /** Door entity để render */
  door: DoorEntity;

  /** Có đang được chọn không */
  isSelected?: boolean;

  /** Có đang hover không */
  isHovered?: boolean;

  /** Scale của canvas (để tính stroke width) */
  canvasScale?: number;

  /** Callback khi click */
  onClick?: (door: DoorEntity, event: React.MouseEvent) => void;

  /** Callback khi double-click (để mở config dialog) */
  onDoubleClick?: (door: DoorEntity, event: React.MouseEvent) => void;

  /** Callback khi hover */
  onMouseEnter?: (door: DoorEntity) => void;
  onMouseLeave?: (door: DoorEntity) => void;
}

/**
 * Màu sắc theo loại cửa
 */
const DOOR_COLORS: Record<string, string> = {
  "hinged-single": "#3498db",
  "hinged-double": "#2980b9",
  "sliding-2p": "#27ae60",
  "sliding-4p": "#16a085",
  fixed: "#9b59b6",
  awning: "#e67e22",
  casement: "#e74c3c",
};

/**
 * Icon cho tay nắm theo loại
 */
const HANDLE_ICONS: Record<string, string> = {
  "hinged-single": "⟨",
  "hinged-double": "⟨⟩",
  "sliding-2p": "↔",
  "sliding-4p": "↔↔",
  fixed: "✕",
  awning: "↑",
  casement: "⟨",
};

/**
 * Door Renderer Component
 */
export const DoorRenderer = memo(function DoorRenderer({
  door,
  isSelected = false,
  isHovered = false,
  canvasScale = 1,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: DoorRendererProps) {
  const { previewBounds, doorInfo, rotation = 0 } = door;

  // Scale factor: chuyển mm → canvas units (1:1 - 1mm = 1 canvas unit)
  const SCALE_FACTOR = 1;

  const x = previewBounds.x;
  const y = previewBounds.y;
  const width = previewBounds.width * SCALE_FACTOR;
  const height = previewBounds.height * SCALE_FACTOR;

  // Tính stroke width dựa trên scale
  const strokeWidth = Math.max(1, 2 / canvasScale);

  // Màu sắc
  const baseColor = DOOR_COLORS[doorInfo.variant] || "#666666";
  const fillColor = isSelected
    ? `${baseColor}40`
    : isHovered
    ? `${baseColor}20`
    : `${baseColor}10`;
  const strokeColor = isSelected || isHovered ? baseColor : "#888888";

  // Handle icon
  const handleIcon = HANDLE_ICONS[doorInfo.variant] || "○";

  // Font size dựa trên kích thước cửa
  const fontSize = Math.max(8, Math.min(width, height) * 0.15);
  const labelFontSize = Math.max(8, 12 / canvasScale);

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(door, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(door, e);
  };

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation}, ${width / 2}, ${
        height / 2
      })`}
      style={{ cursor: "pointer", pointerEvents: "all" }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => onMouseEnter?.(door)}
      onMouseLeave={() => onMouseLeave?.(door)}
    >
      {/* Bounding box / Frame */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Inner frame (sash area) */}
      <rect
        x={width * 0.05}
        y={height * 0.05}
        width={width * 0.9}
        height={height * 0.9}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 0.5}
        strokeDasharray={
          isSelected ? "none" : `${4 / canvasScale} ${2 / canvasScale}`
        }
      />

      {/* Đường chéo cho cửa mở (indicator hướng mở) */}
      {(doorInfo.variant === "hinged-single" ||
        doorInfo.variant === "casement") && (
        <line
          x1={width * 0.1}
          y1={height * 0.1}
          x2={width * 0.9}
          y2={height * 0.9}
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.5}
          strokeDasharray={`${6 / canvasScale} ${3 / canvasScale}`}
        />
      )}

      {/* Đường chéo kép cho cửa đôi */}
      {doorInfo.variant === "hinged-double" && (
        <>
          <line
            x1={width * 0.1}
            y1={height * 0.1}
            x2={width * 0.5}
            y2={height * 0.9}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.5}
            strokeDasharray={`${6 / canvasScale} ${3 / canvasScale}`}
          />
          <line
            x1={width * 0.9}
            y1={height * 0.1}
            x2={width * 0.5}
            y2={height * 0.9}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.5}
            strokeDasharray={`${6 / canvasScale} ${3 / canvasScale}`}
          />
        </>
      )}

      {/* Mũi tên cho cửa trượt */}
      {(doorInfo.variant === "sliding-2p" ||
        doorInfo.variant === "sliding-4p") && (
        <line
          x1={width * 0.2}
          y1={height * 0.5}
          x2={width * 0.8}
          y2={height * 0.5}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#arrowhead)"
          markerStart="url(#arrowhead-reverse)"
        />
      )}

      {/* Handle icon - flip Y để không bị ngược */}
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={strokeColor}
        fontSize={fontSize}
        fontWeight="bold"
        transform={`translate(${width / 2}, ${
          height / 2
        }) scale(1, -1) translate(${-width / 2}, ${-height / 2})`}
      >
        {handleIcon}
      </text>

      {/* Label (tên + kích thước) - flip Y */}
      <text
        x={width / 2}
        y={-(labelFontSize + 4)}
        textAnchor="middle"
        fill="#aaaaaa"
        fontSize={labelFontSize}
        transform={`translate(${width / 2}, ${-(
          labelFontSize + 4
        )}) scale(1, -1) translate(${-width / 2}, ${labelFontSize + 4})`}
      >
        {doorInfo.displayName}
      </text>
      <text
        x={width / 2}
        y={-(labelFontSize * 2 + 8)}
        textAnchor="middle"
        fill="#888888"
        fontSize={labelFontSize * 0.9}
        transform={`translate(${width / 2}, ${-(
          labelFontSize * 2 +
          8
        )}) scale(1, -1) translate(${-width / 2}, ${labelFontSize * 2 + 8})`}
      >
        {doorInfo.width}×{doorInfo.height}
      </text>

      {/* Selection handles */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <rect
            x={-4 / canvasScale}
            y={-4 / canvasScale}
            width={8 / canvasScale}
            height={8 / canvasScale}
            fill={baseColor}
          />
          <rect
            x={width - 4 / canvasScale}
            y={-4 / canvasScale}
            width={8 / canvasScale}
            height={8 / canvasScale}
            fill={baseColor}
          />
          <rect
            x={-4 / canvasScale}
            y={height - 4 / canvasScale}
            width={8 / canvasScale}
            height={8 / canvasScale}
            fill={baseColor}
          />
          <rect
            x={width - 4 / canvasScale}
            y={height - 4 / canvasScale}
            width={8 / canvasScale}
            height={8 / canvasScale}
            fill={baseColor}
          />

          {/* Edge handles */}
          <rect
            x={width / 2 - 4 / canvasScale}
            y={-4 / canvasScale}
            width={8 / canvasScale}
            height={8 / canvasScale}
            fill={baseColor}
          />
          <rect
            x={width / 2 - 4 / canvasScale}
            y={height - 4 / canvasScale}
            width={8 / canvasScale}
            height={8 / canvasScale}
            fill={baseColor}
          />
          <rect
            x={-4 / canvasScale}
            y={height / 2 - 4 / canvasScale}
            width={8 / canvasScale}
            height={8 / canvasScale}
            fill={baseColor}
          />
          <rect
            x={width - 4 / canvasScale}
            y={height / 2 - 4 / canvasScale}
            width={8 / canvasScale}
            height={8 / canvasScale}
            fill={baseColor}
          />
        </>
      )}

      {/* Engine status indicator */}
      {/* R5 COMPLIANT: Check data directly instead of calling method */}
      {(!door.engineOutputRef ||
        door.engineOutputRef.status === "outdated") && (
        <circle
          cx={width - 8 / canvasScale}
          cy={8 / canvasScale}
          r={6 / canvasScale}
          fill="#f39c12"
          stroke="white"
          strokeWidth={1 / canvasScale}
        />
      )}
    </g>
  );
});

/**
 * SVG Defs cho markers (mũi tên)
 */
export const DoorRendererDefs = () => (
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon points="0 0, 10 3.5, 0 7" fill="#888888" />
    </marker>
    <marker
      id="arrowhead-reverse"
      markerWidth="10"
      markerHeight="7"
      refX="1"
      refY="3.5"
      orient="auto"
    >
      <polygon points="10 0, 0 3.5, 10 7" fill="#888888" />
    </marker>
  </defs>
);

export default DoorRenderer;
