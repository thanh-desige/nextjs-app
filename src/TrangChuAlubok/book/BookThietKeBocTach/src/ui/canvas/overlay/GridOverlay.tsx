/**
 * GridOverlay - Renders the grid according to viewport state
 * Pure rendering component - no business logic
 */

"use client";

import React from "react";

export interface GridOverlayProps {
  width: number;
  height: number;
  pan: { x: number; y: number };
  zoom: number;
  gridSpacing: number;
  visible: boolean;
  majorColor?: string;
  minorColor?: string;
  subdivisions?: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  width,
  height,
  pan,
  zoom,
  gridSpacing,
  visible,
  majorColor = "rgba(100, 100, 100, 0.3)",
  minorColor = "rgba(60, 60, 60, 0.2)",
  subdivisions = 5,
}) => {
  if (!visible || width <= 0 || height <= 0) {
    return null;
  }

  const centerX = width / 2 + pan.x;
  const centerY = height / 2 + pan.y;

  // Calculate adaptive grid step based on zoom
  const getAdaptiveStep = () => {
    const targetScreenSpacing = 50;
    const worldSpacing = targetScreenSpacing / zoom;
    const steps = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    const scaledSteps = steps.map((s) => s * gridSpacing);

    let bestStep = scaledSteps[0];
    let bestDiff = Math.abs(bestStep - worldSpacing);

    for (const step of scaledSteps) {
      const diff = Math.abs(step - worldSpacing);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestStep = step;
      }
    }
    return bestStep;
  };

  const majorStep = getAdaptiveStep();
  const minorStep = majorStep / subdivisions;

  // Calculate visible range in world coordinates
  const worldLeft = -centerX / zoom;
  const worldRight = (width - centerX) / zoom;
  const worldTop = centerY / zoom;
  const worldBottom = -(height - centerY) / zoom;

  const lines: React.ReactElement[] = [];
  let keyIndex = 0;

  // Draw minor vertical lines
  const startX = Math.floor(worldLeft / minorStep) * minorStep;
  for (let wx = startX; wx <= worldRight; wx += minorStep) {
    const screenX = centerX + wx * zoom;
    const isMajor = Math.abs(wx % majorStep) < 0.001;

    lines.push(
      <line
        key={`v-${keyIndex++}`}
        x1={screenX}
        y1={0}
        x2={screenX}
        y2={height}
        stroke={isMajor ? majorColor : minorColor}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
  }

  // Draw minor horizontal lines
  const startY = Math.floor(worldBottom / minorStep) * minorStep;
  for (let wy = startY; wy <= worldTop; wy += minorStep) {
    const screenY = centerY - wy * zoom;
    const isMajor = Math.abs(wy % majorStep) < 0.001;

    lines.push(
      <line
        key={`h-${keyIndex++}`}
        x1={0}
        y1={screenY}
        x2={width}
        y2={screenY}
        stroke={isMajor ? majorColor : minorColor}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
  }

  // Draw origin axes
  const originScreenX = centerX;
  const originScreenY = centerY;

  lines.push(
    <line
      key="axis-x"
      x1={0}
      y1={originScreenY}
      x2={width}
      y2={originScreenY}
      stroke="rgba(255, 100, 100, 0.5)"
      strokeWidth={1}
    />,
    <line
      key="axis-y"
      x1={originScreenX}
      y1={0}
      x2={originScreenX}
      y2={height}
      stroke="rgba(100, 255, 100, 0.5)"
      strokeWidth={1}
    />
  );

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
      {lines}
    </svg>
  );
};

export default GridOverlay;
