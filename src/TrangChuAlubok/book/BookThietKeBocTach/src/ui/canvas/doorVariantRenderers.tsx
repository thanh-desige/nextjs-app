/**
 * doorVariantRenderers.tsx
 *
 * Door variant renderers: HingedDouble + Sliding (STEP-5.12)
 * Extracted from DoorRendererDetailed.tsx
 */

"use client";

import React from "react";
import {
  COLORS,
  MULLION_WIDTH,
  HINGE_SIZE,
  HANDLE_WIDTH,
  HANDLE_HEIGHT,
  GlassPattern,
  Hinge,
  Handle,
  Connector,
  DimensionLine,
} from "./doorRendererPrimitives";

// ==================== HINGED DOUBLE ====================

/**
 * Render cửa đôi 2 cánh mở quay
 */
export function renderHingedDouble(
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

  const halfW = innerW / 2;
  const mullionX = width / 2;

  const _strokeWidth = Math.max(0.5, 1 / canvasScale);
  void _strokeWidth; // Available for future use

  // Bản lề
  const hingePositions = [
    innerY + innerH * 0.15,
    innerY + innerH * 0.5,
    innerY + innerH * 0.85,
  ];

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

      {/* Đố dọc giữa (mullion) */}
      <line
        x1={mullionX}
        y1={frameT}
        x2={mullionX}
        y2={height - frameT}
        stroke={COLORS.frame}
        strokeWidth={MULLION_WIDTH * 0.3}
      />

      {/* Sash trái */}
      <rect
        x={innerX + sashT / 2}
        y={innerY + sashT / 2}
        width={halfW - sashT - MULLION_WIDTH / 2}
        height={innerH - sashT}
        fill="none"
        stroke={COLORS.sash}
        strokeWidth={sashT * 0.4}
      />

      {/* Sash phải */}
      <rect
        x={mullionX + MULLION_WIDTH / 2 + sashT / 2}
        y={innerY + sashT / 2}
        width={halfW - sashT - MULLION_WIDTH / 2}
        height={innerH - sashT}
        fill="none"
        stroke={COLORS.sash}
        strokeWidth={sashT * 0.4}
      />

      {/* Glass trái */}
      <GlassPattern
        x={innerX + 15}
        y={innerY + 15}
        width={halfW - 40}
        height={innerH - 30}
        canvasScale={canvasScale}
      />

      {/* Glass phải */}
      <GlassPattern
        x={mullionX + 20}
        y={innerY + 15}
        width={halfW - 40}
        height={innerH - 30}
        canvasScale={canvasScale}
      />

      {/* Hinges - cả 2 bên */}
      {hingePositions.map((hy, i) => (
        <React.Fragment key={i}>
          <Hinge
            x={frameT / 2}
            y={hy}
            size={HINGE_SIZE}
            canvasScale={canvasScale}
          />
          <Hinge
            x={width - frameT / 2}
            y={hy}
            size={HINGE_SIZE}
            canvasScale={canvasScale}
          />
        </React.Fragment>
      ))}

      {/* Handles - cả 2 cánh */}
      <Handle
        x={mullionX - MULLION_WIDTH / 2 - HANDLE_WIDTH - 5}
        y={height / 2}
        width={HANDLE_WIDTH}
        height={HANDLE_HEIGHT}
        canvasScale={canvasScale}
      />
      <Handle
        x={mullionX + MULLION_WIDTH / 2 + HANDLE_WIDTH + 5}
        y={height / 2}
        width={HANDLE_WIDTH}
        height={HANDLE_HEIGHT}
        canvasScale={canvasScale}
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
      <Connector x={mullionX} y={frameT} size={10} canvasScale={canvasScale} />
      <Connector
        x={mullionX}
        y={height - frameT}
        size={10}
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
            offset={50}
            isHorizontal={true}
            canvasScale={canvasScale}
          />
          <DimensionLine
            x1={width}
            y1={0}
            x2={width}
            y2={height}
            value={height}
            offset={50}
            isHorizontal={false}
            canvasScale={canvasScale}
          />
        </>
      )}
    </>
  );
}

// ==================== SLIDING ====================

/**
 * Render cửa trượt
 */
export function renderSliding(
  width: number,
  height: number,
  frameT: number,
  sashT: number,
  numPanels: number,
  canvasScale: number,
  showDimensions: boolean,
) {
  const innerW = width - frameT * 2;
  const innerH = height - frameT * 2;
  const panelW = innerW / numPanels;

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

      {/* Panels */}
      {Array.from({ length: numPanels }).map((_, i) => (
        <React.Fragment key={i}>
          {/* Đố dọc */}
          {i > 0 && (
            <line
              x1={frameT + i * panelW}
              y1={frameT}
              x2={frameT + i * panelW}
              y2={height - frameT}
              stroke={COLORS.frame}
              strokeWidth={MULLION_WIDTH * 0.25}
            />
          )}

          {/* Sash */}
          <rect
            x={frameT + i * panelW + sashT / 2}
            y={frameT + sashT / 2}
            width={panelW - sashT}
            height={innerH - sashT}
            fill="none"
            stroke={COLORS.sash}
            strokeWidth={sashT * 0.4}
          />

          {/* Glass */}
          <GlassPattern
            x={frameT + i * panelW + 15}
            y={frameT + 15}
            width={panelW - 30}
            height={innerH - 30}
            canvasScale={canvasScale}
          />
        </React.Fragment>
      ))}

      {/* Sliding arrows */}
      <line
        x1={frameT + 30}
        y1={height / 2}
        x2={width - frameT - 30}
        y2={height / 2}
        stroke="#888"
        strokeWidth={Math.max(1, 2 / canvasScale)}
        markerEnd="url(#arrowhead)"
        markerStart="url(#arrowhead-reverse)"
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
            offset={50}
            isHorizontal={true}
            canvasScale={canvasScale}
          />
          <DimensionLine
            x1={width}
            y1={0}
            x2={width}
            y2={height}
            value={height}
            offset={50}
            isHorizontal={false}
            canvasScale={canvasScale}
          />
        </>
      )}
    </>
  );
}
