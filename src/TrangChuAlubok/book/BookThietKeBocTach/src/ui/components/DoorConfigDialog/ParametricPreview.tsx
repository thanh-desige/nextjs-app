/**
 * ParametricPreview - SVG Preview với Dimension Input trực tiếp
 *
 * ⚠️ PREVIEW_CONTRACT: UI-only, không sinh geometry kỹ thuật
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: DoorConfigDialog
 * - KHÔNG import door-engines, analysis, domain
 */

"use client";

import React, { memo, useCallback, useState, useRef } from "react";
import type {
  ParametricPreviewProps,
  MullionPosition,
  OpenType,
} from "./types";
import { createMullion } from "./types";

// ==================== CONSTANTS ====================

const COLORS = {
  frame: "#00CED1", // Cyan - khung bao
  sash: "#4169E1", // Royal Blue - cánh
  glass: "#9ACD32", // Yellow Green - kính
  mullion: "#00CED1", // Cyan - đố
  dimension: "#FF00FF", // Magenta - kích thước
  dimensionText: "#FFFFFF", // White - text
  grid: "#333333", // Grid lines
  handle: "#FF6B6B", // Handle
  hinge: "#FF4444", // Hinge
};

const SVG_PADDING = 60; // Padding cho dimension lines
const MIN_SIZE = 100; // Kích thước tối thiểu (mm)
const MAX_SIZE = 10000; // Kích thước tối đa (mm)

// ==================== SUB-COMPONENTS ====================

/**
 * Dimension Line với input
 */
interface DimensionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;
  onChange: (value: number) => void;
  orientation: "horizontal" | "vertical";
  editable?: boolean;
}

const DimensionLine = memo(function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  value,
  onChange,
  orientation,
  editable = true,
}: DimensionLineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const handleClick = useCallback(() => {
    if (editable) {
      setIsEditing(true);
      setEditValue(value.toString());
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editable, value]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue) && newValue >= MIN_SIZE && newValue <= MAX_SIZE) {
      onChange(newValue);
    } else {
      setEditValue(value.toString());
    }
  }, [editValue, onChange, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBlur();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(value.toString());
      }
    },
    [handleBlur, value]
  );

  const arrowSize = 6;

  return (
    <g className="dimension-line">
      {/* Main line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={COLORS.dimension}
        strokeWidth={1}
      />

      {/* Extension lines */}
      {orientation === "horizontal" ? (
        <>
          <line
            x1={x1}
            y1={y1 - 8}
            x2={x1}
            y2={y1 + 8}
            stroke={COLORS.dimension}
            strokeWidth={1}
          />
          <line
            x1={x2}
            y1={y2 - 8}
            x2={x2}
            y2={y2 + 8}
            stroke={COLORS.dimension}
            strokeWidth={1}
          />
        </>
      ) : (
        <>
          <line
            x1={x1 - 8}
            y1={y1}
            x2={x1 + 8}
            y2={y1}
            stroke={COLORS.dimension}
            strokeWidth={1}
          />
          <line
            x1={x2 - 8}
            y1={y2}
            x2={x2 + 8}
            y2={y2}
            stroke={COLORS.dimension}
            strokeWidth={1}
          />
        </>
      )}

      {/* Arrows */}
      {orientation === "horizontal" ? (
        <>
          <polygon
            points={`${x1},${y1} ${x1 + arrowSize},${y1 - arrowSize / 2} ${
              x1 + arrowSize
            },${y1 + arrowSize / 2}`}
            fill={COLORS.dimension}
          />
          <polygon
            points={`${x2},${y2} ${x2 - arrowSize},${y2 - arrowSize / 2} ${
              x2 - arrowSize
            },${y2 + arrowSize / 2}`}
            fill={COLORS.dimension}
          />
        </>
      ) : (
        <>
          <polygon
            points={`${x1},${y1} ${x1 - arrowSize / 2},${y1 + arrowSize} ${
              x1 + arrowSize / 2
            },${y1 + arrowSize}`}
            fill={COLORS.dimension}
          />
          <polygon
            points={`${x2},${y2} ${x2 - arrowSize / 2},${y2 - arrowSize} ${
              x2 + arrowSize / 2
            },${y2 - arrowSize}`}
            fill={COLORS.dimension}
          />
        </>
      )}

      {/* Value display/input */}
      {isEditing ? (
        <foreignObject
          x={orientation === "horizontal" ? midX - 35 : midX + 5}
          y={orientation === "horizontal" ? midY - 20 : midY - 10}
          width={70}
          height={24}
        >
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            min={MIN_SIZE}
            max={MAX_SIZE}
            step={10}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#2a2a3e",
              border: "1px solid " + COLORS.dimension,
              borderRadius: 3,
              color: "#fff",
              fontSize: 12,
              textAlign: "center",
              outline: "none",
            }}
            autoFocus
          />
        </foreignObject>
      ) : (
        <g
          onClick={handleClick}
          style={{ cursor: editable ? "pointer" : "default" }}
        >
          <rect
            x={orientation === "horizontal" ? midX - 25 : midX + 5}
            y={orientation === "horizontal" ? midY - 20 : midY - 8}
            width={50}
            height={16}
            fill="#1e1e2e"
            rx={3}
          />
          <text
            x={orientation === "horizontal" ? midX : midX + 30}
            y={orientation === "horizontal" ? midY - 8 : midY + 4}
            fill={COLORS.dimensionText}
            fontSize={11}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {value}
          </text>
        </g>
      )}
    </g>
  );
});

/**
 * Render mullion line
 */
interface MullionLineProps {
  mullion: MullionPosition;
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  onDrag?: (id: string, newPosition: number) => void;
  onRemove?: (id: string) => void;
  editable?: boolean;
}

const MullionLine = memo(function MullionLine({
  mullion,
  frameX,
  frameY,
  frameWidth,
  frameHeight,
  scale,
  onDrag,
  onRemove,
  editable = true,
}: MullionLineProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Tính vị trí thực
  const positionPx =
    mullion.unit === "percent"
      ? mullion.position *
        (mullion.type === "horizontal" ? frameHeight : frameWidth)
      : mullion.position * scale;

  const x1 = mullion.type === "horizontal" ? frameX : frameX + positionPx;
  const y1 = mullion.type === "horizontal" ? frameY + positionPx : frameY;
  const x2 =
    mullion.type === "horizontal" ? frameX + frameWidth : frameX + positionPx;
  const y2 =
    mullion.type === "horizontal" ? frameY + positionPx : frameY + frameHeight;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editable || !onDrag) return;
      e.stopPropagation();
      setIsDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const svg = (e.target as SVGElement).ownerSVGElement;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const scaleX = svg.viewBox.baseVal.width / rect.width;

        if (mullion.type === "horizontal") {
          const mouseY = (moveEvent.clientY - rect.top) * scaleX;
          const newPos = Math.max(
            0.1,
            Math.min(0.9, (mouseY - frameY) / frameHeight)
          );
          onDrag(mullion.id, newPos);
        } else {
          const mouseX = (moveEvent.clientX - rect.left) * scaleX;
          const newPos = Math.max(
            0.1,
            Math.min(0.9, (mouseX - frameX) / frameWidth)
          );
          onDrag(mullion.id, newPos);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [editable, onDrag, mullion, frameX, frameY, frameWidth, frameHeight]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editable && onRemove) {
        onRemove(mullion.id);
      }
    },
    [editable, onRemove, mullion.id]
  );

  return (
    <g className="mullion-line">
      {/* Hit area (wider for easier clicking) */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: editable ? "move" : "default" }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />
      {/* Visible line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isDragging ? "#FFD700" : COLORS.mullion}
        strokeWidth={3}
        pointerEvents="none"
      />
    </g>
  );
});

// ==================== MAIN COMPONENT ====================

/**
 * Render door frame theo openType
 */
function renderDoorFrame(
  frameX: number,
  frameY: number,
  frameWidth: number,
  frameHeight: number,
  openType: OpenType
): React.ReactNode {
  const frameThickness = Math.min(frameWidth, frameHeight) * 0.03;
  const sashThickness = frameThickness * 0.8;

  // Inner area
  const innerX = frameX + frameThickness;
  const innerY = frameY + frameThickness;
  const innerW = frameWidth - frameThickness * 2;
  const innerH = frameHeight - frameThickness * 2;

  return (
    <>
      {/* Outer frame */}
      <rect
        x={frameX}
        y={frameY}
        width={frameWidth}
        height={frameHeight}
        fill="none"
        stroke={COLORS.frame}
        strokeWidth={frameThickness}
      />

      {/* Sash based on openType */}
      {openType === "hinged" && (
        <>
          {/* Single sash */}
          <rect
            x={innerX + sashThickness / 2}
            y={innerY + sashThickness / 2}
            width={innerW - sashThickness}
            height={innerH - sashThickness}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={sashThickness}
          />
          {/* Swing arc */}
          <path
            d={`M ${innerX} ${innerY + innerH} A ${innerW} ${innerW} 0 0 1 ${
              innerX + innerW
            } ${innerY + innerH}`}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
          {/* Handle */}
          <rect
            x={innerX + innerW - 15}
            y={innerY + innerH / 2 - 20}
            width={6}
            height={40}
            fill={COLORS.handle}
          />
          {/* Hinges */}
          {[0.15, 0.5, 0.85].map((pos, i) => (
            <rect
              key={i}
              x={innerX - 4}
              y={innerY + innerH * pos - 5}
              width={8}
              height={10}
              fill={COLORS.hinge}
            />
          ))}
        </>
      )}

      {openType === "sliding" && (
        <>
          {/* Left sash */}
          <rect
            x={innerX + sashThickness / 2}
            y={innerY + sashThickness / 2}
            width={innerW / 2 - sashThickness}
            height={innerH - sashThickness}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={sashThickness}
          />
          {/* Right sash */}
          <rect
            x={innerX + innerW / 2 + sashThickness / 2}
            y={innerY + sashThickness / 2}
            width={innerW / 2 - sashThickness}
            height={innerH - sashThickness}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={sashThickness}
          />
          {/* Slide direction arrow */}
          <line
            x1={innerX + innerW * 0.3}
            y1={innerY + innerH / 2}
            x2={innerX + innerW * 0.7}
            y2={innerY + innerH / 2}
            stroke={COLORS.sash}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
            markerEnd="url(#arrowhead)"
          />
        </>
      )}

      {openType === "fixed" && (
        <>
          {/* Glass with X */}
          <rect
            x={innerX}
            y={innerY}
            width={innerW}
            height={innerH}
            fill="none"
            stroke={COLORS.glass}
            strokeWidth={1}
          />
          <line
            x1={innerX}
            y1={innerY}
            x2={innerX + innerW}
            y2={innerY + innerH}
            stroke={COLORS.glass}
            strokeWidth={1}
            opacity={0.5}
          />
          <line
            x1={innerX + innerW}
            y1={innerY}
            x2={innerX}
            y2={innerY + innerH}
            stroke={COLORS.glass}
            strokeWidth={1}
            opacity={0.5}
          />
        </>
      )}

      {openType === "awning" && (
        <>
          <rect
            x={innerX + sashThickness / 2}
            y={innerY + sashThickness / 2}
            width={innerW - sashThickness}
            height={innerH - sashThickness}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={sashThickness}
          />
          {/* Top swing arc */}
          <path
            d={`M ${innerX} ${innerY} A ${innerH * 0.3} ${innerH * 0.3} 0 0 1 ${
              innerX + innerW
            } ${innerY}`}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        </>
      )}

      {openType === "casement" && (
        <>
          <rect
            x={innerX + sashThickness / 2}
            y={innerY + sashThickness / 2}
            width={innerW - sashThickness}
            height={innerH - sashThickness}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={sashThickness}
          />
          {/* Side swing arc */}
          <path
            d={`M ${innerX} ${innerY} A ${innerW * 0.3} ${
              innerW * 0.3
            } 0 0 0 ${innerX} ${innerY + innerH}`}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        </>
      )}
    </>
  );
}

/**
 * ParametricPreview Component
 */
export const ParametricPreview = memo(function ParametricPreview({
  width,
  height,
  openType,
  mullions,
  onWidthChange,
  onHeightChange,
  onMullionsChange,
  editable = true,
}: ParametricPreviewProps) {
  // Tính scale để fit vào viewport
  const viewportWidth = 280;
  const viewportHeight = 200;
  const contentWidth = viewportWidth - SVG_PADDING * 2;
  const contentHeight = viewportHeight - SVG_PADDING * 2;

  // Scale để giữ tỷ lệ
  const scaleX = contentWidth / width;
  const scaleY = contentHeight / height;
  const scale = Math.min(scaleX, scaleY);

  const frameWidth = width * scale;
  const frameHeight = height * scale;
  const frameX = SVG_PADDING + (contentWidth - frameWidth) / 2;
  const frameY = SVG_PADDING + (contentHeight - frameHeight) / 2;

  // Handlers
  const handleMullionDrag = useCallback(
    (id: string, newPosition: number) => {
      const updated = mullions.map((m) =>
        m.id === id ? { ...m, position: newPosition } : m
      );
      onMullionsChange(updated);
    },
    [mullions, onMullionsChange]
  );

  const handleMullionRemove = useCallback(
    (id: string) => {
      onMullionsChange(mullions.filter((m) => m.id !== id));
    },
    [mullions, onMullionsChange]
  );

  const handleAddMullion = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!editable) return;

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleXRatio = viewportWidth / rect.width;
      const scaleYRatio = viewportHeight / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleXRatio;
      const mouseY = (e.clientY - rect.top) * scaleYRatio;

      // Check if click is inside frame
      if (
        mouseX > frameX &&
        mouseX < frameX + frameWidth &&
        mouseY > frameY &&
        mouseY < frameY + frameHeight
      ) {
        // Determine if closer to horizontal or vertical
        const relX = (mouseX - frameX) / frameWidth;
        const relY = (mouseY - frameY) / frameHeight;

        const distToHorizontal = Math.min(relY, 1 - relY);
        const distToVertical = Math.min(relX, 1 - relX);

        if (distToHorizontal < distToVertical) {
          // Add horizontal mullion
          onMullionsChange([...mullions, createMullion("horizontal", relY)]);
        } else {
          // Add vertical mullion
          onMullionsChange([...mullions, createMullion("vertical", relX)]);
        }
      }
    },
    [
      editable,
      mullions,
      onMullionsChange,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      viewportWidth,
      viewportHeight,
    ]
  );

  return (
    <div
      style={{
        backgroundColor: "#1a1a2e",
        borderRadius: 8,
        padding: 8,
        marginBottom: 16,
      }}
    >
      <svg
        viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
        width="100%"
        height={200}
        style={{ display: "block" }}
        onDoubleClick={handleAddMullion}
      >
        {/* Defs */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <polygon points="0,0 6,3 0,6" fill={COLORS.sash} opacity={0.5} />
          </marker>
        </defs>

        {/* Door frame and sash */}
        {renderDoorFrame(frameX, frameY, frameWidth, frameHeight, openType)}

        {/* Mullions */}
        {mullions.map((mullion) => (
          <MullionLine
            key={mullion.id}
            mullion={mullion}
            frameX={frameX}
            frameY={frameY}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            scale={scale}
            onDrag={handleMullionDrag}
            onRemove={handleMullionRemove}
            editable={editable}
          />
        ))}

        {/* Width dimension (bottom) */}
        <DimensionLine
          x1={frameX}
          y1={frameY + frameHeight + 25}
          x2={frameX + frameWidth}
          y2={frameY + frameHeight + 25}
          value={width}
          onChange={onWidthChange}
          orientation="horizontal"
          editable={editable}
        />

        {/* Height dimension (left) */}
        <DimensionLine
          x1={frameX - 25}
          y1={frameY}
          x2={frameX - 25}
          y2={frameY + frameHeight}
          value={height}
          onChange={onHeightChange}
          orientation="vertical"
          editable={editable}
        />

        {/* Help text */}
        {editable && (
          <text
            x={viewportWidth / 2}
            y={viewportHeight - 5}
            fill="#666"
            fontSize={9}
            textAnchor="middle"
          >
            Double-click để thêm đố | Kéo để di chuyển | Double-click đố để xóa
          </text>
        )}
      </svg>
    </div>
  );
});

export default ParametricPreview;
