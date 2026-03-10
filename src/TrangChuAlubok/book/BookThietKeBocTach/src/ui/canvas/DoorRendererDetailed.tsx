/**
 * DoorRendererDetailed.tsx — Thin facade (STEP-5.12)
 *
 * Render cửa chi tiết trên Canvas (AutoCAD style)
 *
 * Delegates to extracted modules:
 * - doorRendererPrimitives.tsx: SVG sub-components (DimensionLine, Hinge, Connector, Handle, GlassPattern)
 * - doorVariantRenderers.tsx: renderHingedDouble, renderSliding
 * - renderAwning.tsx: renderAwning (3D profile awning window)
 *
 * Keeps: renderHingedSingle, renderCasement, renderFixed, main component
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: DoorOverlay.tsx
 * - KHÔNG được import từ: door-engines, analysis, systems
 */

"use client";

import React from "react";
import type { DoorEntity } from "../../core/entities/DoorEntity";

// Extracted modules
import {
  COLORS,
  FRAME_THICKNESS,
  SASH_THICKNESS,
  HINGE_SIZE,
  HANDLE_WIDTH,
  HANDLE_HEIGHT,
  DimensionLine,
  Hinge,
  Connector,
  Handle,
  GlassPattern,
} from "./doorRendererPrimitives";
import { renderHingedDouble } from "./doorVariantRenderers";
import { renderSliding } from "./doorVariantRenderers";
import { renderAwning } from "./renderAwning";

// ==================== INTERFACES ====================

interface DoorRendererDetailedProps {
  door: DoorEntity;
  isSelected?: boolean;
  isHovered?: boolean;
  canvasScale?: number;
  showDimensions?: boolean;
  onClick?: (door: DoorEntity, event: React.MouseEvent) => void;
  onDoubleClick?: (door: DoorEntity, event: React.MouseEvent) => void;
  onMouseEnter?: (door: DoorEntity) => void;
  onMouseLeave?: (door: DoorEntity) => void;
}

// ==================== DOOR TYPE RENDERERS (kept in facade) ====================

/**
 * Render cửa đơn 1 cánh mở quay
 */
function renderHingedSingle(
  width: number,
  height: number,
  frameT: number,
  sashT: number,
  canvasScale: number,
  showDimensions: boolean,
) {
  const innerX = frameT;
  const innerY = frameT;
  const innerW = width - frameT * 2;
  const innerH = height - frameT * 2;

  const sashX = innerX + sashT / 2;
  const sashY = innerY + sashT / 2;
  const sashW = innerW - sashT;
  const sashH = innerH - sashT;

  const _strokeWidth = Math.max(0.5, 1 / canvasScale);
  void _strokeWidth; // Available for future use

  // Vị trí bản lề (3 cái)
  const hingePositions = [
    innerY + innerH * 0.15,
    innerY + innerH * 0.5,
    innerY + innerH * 0.85,
  ];

  return (
    <>
      {/* Frame (khung bao) */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="none"
        stroke={COLORS.frame}
        strokeWidth={frameT * 0.3}
      />

      {/* Sash (cánh cửa) */}
      <rect
        x={sashX}
        y={sashY}
        width={sashW}
        height={sashH}
        fill="none"
        stroke={COLORS.sash}
        strokeWidth={sashT * 0.5}
      />

      {/* Glass */}
      <GlassPattern
        x={sashX + 10}
        y={sashY + 10}
        width={sashW - 20}
        height={sashH - 20}
        canvasScale={canvasScale}
      />

      {/* Hinges - bên trái */}
      {hingePositions.map((hy, i) => (
        <Hinge
          key={i}
          x={frameT / 2}
          y={hy}
          size={HINGE_SIZE}
          canvasScale={canvasScale}
        />
      ))}

      {/* Handle - bên phải, giữa cửa */}
      <Handle
        x={width - frameT - sashT - HANDLE_WIDTH}
        y={height / 2}
        width={HANDLE_WIDTH}
        height={HANDLE_HEIGHT}
        canvasScale={canvasScale}
      />

      {/* Connectors - 4 góc */}
      <Connector x={frameT} y={frameT} size={12} canvasScale={canvasScale} />
      <Connector
        x={width - frameT}
        y={frameT}
        size={12}
        canvasScale={canvasScale}
      />
      <Connector
        x={frameT}
        y={height - frameT}
        size={12}
        canvasScale={canvasScale}
      />
      <Connector
        x={width - frameT}
        y={height - frameT}
        size={12}
        canvasScale={canvasScale}
      />

      {/* Dimensions */}
      {showDimensions && (
        <>
          <DimensionLine
            x1={0}
            y1={height}
            x2={width}
            y2={height}
            value={width}
            offset={40}
            isHorizontal={true}
            canvasScale={canvasScale}
          />
          <DimensionLine
            x1={width}
            y1={0}
            x2={width}
            y2={height}
            value={height}
            offset={40}
            isHorizontal={false}
            canvasScale={canvasScale}
          />
        </>
      )}
    </>
  );
}

/**
 * Render cửa sổ mở quay (casement)
 */
function renderCasement(
  width: number,
  height: number,
  frameT: number,
  sashT: number,
  canvasScale: number,
  showDimensions: boolean,
) {
  // Tương tự hinged-single nhưng nhỏ hơn
  return renderHingedSingle(
    width,
    height,
    frameT * 0.8,
    sashT * 0.8,
    canvasScale,
    showDimensions,
  );
}

/**
 * Render cửa fix
 */
function renderFixed(
  width: number,
  height: number,
  frameT: number,
  canvasScale: number,
  showDimensions: boolean,
) {
  return (
    <>
      {/* Frame */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="none"
        stroke={COLORS.frame}
        strokeWidth={frameT * 0.3}
      />

      {/* Glass area */}
      <rect
        x={frameT}
        y={frameT}
        width={width - frameT * 2}
        height={height - frameT * 2}
        fill="none"
        stroke={COLORS.sash}
        strokeWidth={frameT * 0.2}
      />

      {/* X pattern for fix */}
      <line
        x1={frameT + 10}
        y1={frameT + 10}
        x2={width - frameT - 10}
        y2={height - frameT - 10}
        stroke={COLORS.glass}
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />
      <line
        x1={width - frameT - 10}
        y1={frameT + 10}
        x2={frameT + 10}
        y2={height - frameT - 10}
        stroke={COLORS.glass}
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* Connectors */}
      <Connector x={frameT} y={frameT} size={12} canvasScale={canvasScale} />
      <Connector
        x={width - frameT}
        y={frameT}
        size={12}
        canvasScale={canvasScale}
      />
      <Connector
        x={frameT}
        y={height - frameT}
        size={12}
        canvasScale={canvasScale}
      />
      <Connector
        x={width - frameT}
        y={height - frameT}
        size={12}
        canvasScale={canvasScale}
      />

      {/* Dimensions */}
      {showDimensions && (
        <>
          <DimensionLine
            x1={0}
            y1={height}
            x2={width}
            y2={height}
            value={width}
            offset={40}
            isHorizontal={true}
            canvasScale={canvasScale}
          />
          <DimensionLine
            x1={width}
            y1={0}
            x2={width}
            y2={height}
            value={height}
            offset={40}
            isHorizontal={false}
            canvasScale={canvasScale}
          />
        </>
      )}
    </>
  );
}

// ==================== MAIN COMPONENT ====================

/**
 * Door Renderer Detailed - Chi tiết đầy đủ cho Canvas
 * TEMPORARILY REMOVED MEMO FOR DEBUGGING
 */
export const DoorRendererDetailed = function DoorRendererDetailed({
  door,
  isSelected = false,
  isHovered = false,
  canvasScale = 1,
  showDimensions = true,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}: DoorRendererDetailedProps) {
  const { previewBounds, doorInfo, rotation = 0 } = door;

  // Scale: mm → canvas units (1:1 - 1mm = 1 canvas unit)
  const SCALE_FACTOR = 1;

  const x = previewBounds.x;
  const y = previewBounds.y;
  const width = doorInfo.width * SCALE_FACTOR;
  const height = doorInfo.height * SCALE_FACTOR;

  // Scaled thicknesses
  const frameT = FRAME_THICKNESS * SCALE_FACTOR;
  const sashT = SASH_THICKNESS * SCALE_FACTOR;

  const handleClick = (e: React.MouseEvent) => onClick?.(door, e);
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(door, e);
  };

  // Selection highlight
  const selectionStroke = isSelected
    ? COLORS.selected
    : isHovered
    ? "#FFA500"
    : "none";
  const selectionWidth = isSelected
    ? 3 / canvasScale
    : isHovered
    ? 2 / canvasScale
    : 0;

  // Selection highlight - mở rộng để bao phủ cả dimensions
  const dimOffset = showDimensions ? width * 0.15 : 0;
  const selectionPadding = 5 / canvasScale;

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
      {/* Selection highlight - bao phủ cả dim */}
      {(isSelected || isHovered) && (
        <rect
          x={-selectionPadding}
          y={-dimOffset - selectionPadding}
          width={width + dimOffset + selectionPadding * 2}
          height={height + dimOffset + selectionPadding * 2}
          fill="none"
          stroke={selectionStroke}
          strokeWidth={selectionWidth}
          strokeDasharray={
            isSelected ? "none" : `${6 / canvasScale} ${3 / canvasScale}`
          }
        />
      )}

      {/* Render based on variant */}
      {doorInfo.variant === "hinged-single" &&
        renderHingedSingle(
          width,
          height,
          frameT,
          sashT,
          canvasScale,
          showDimensions,
        )}

      {doorInfo.variant === "hinged-double" &&
        renderHingedDouble(
          width,
          height,
          frameT,
          sashT,
          canvasScale,
          showDimensions,
        )}

      {doorInfo.variant === "casement" &&
        renderCasement(
          width,
          height,
          frameT,
          sashT,
          canvasScale,
          showDimensions,
        )}

      {doorInfo.variant === "sliding-2p" &&
        renderSliding(
          width,
          height,
          frameT,
          sashT,
          2,
          canvasScale,
          showDimensions,
        )}

      {doorInfo.variant === "sliding-4p" &&
        renderSliding(
          width,
          height,
          frameT,
          sashT,
          4,
          canvasScale,
          showDimensions,
        )}

      {doorInfo.variant === "fixed" &&
        renderFixed(width, height, frameT, canvasScale, showDimensions)}

      {doorInfo.variant === "awning" &&
        renderAwning(width, height, frameT, sashT, canvasScale, showDimensions)}

      {/* Label */}
      <text
        x={width / 2}
        y={height + 25 / canvasScale}
        textAnchor="middle"
        fill="#aaa"
        fontSize={Math.max(8, 11 / canvasScale)}
        transform={`translate(${width / 2}, ${
          height + 25 / canvasScale
        }) scale(1, -1) translate(${-width / 2}, ${-(
          height +
          25 / canvasScale
        )})`}
      >
        {doorInfo.displayName}
      </text>
    </g>
  );
};

export default DoorRendererDetailed;
