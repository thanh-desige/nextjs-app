/**
 * OverlayRoot - Composes all overlay layers
 * Manages overlay stacking order and passes props to children
 */

"use client";

import React from "react";
import { GridOverlay } from "./GridOverlay";
import { OsnapOverlay, OsnapPoint } from "./OsnapOverlay";
import { PreviewOverlay, PreviewState } from "./PreviewOverlay";
import { HudOverlay } from "./HudOverlay";

export interface Point {
  x: number;
  y: number;
}

export interface OverlayRootProps {
  width: number;
  height: number;
  pan: { x: number; y: number };
  zoom: number;

  // Grid
  showGrid: boolean;
  gridSpacing: number;

  // Osnap
  osnapPoint: OsnapPoint | null;

  // Preview
  preview: PreviewState | null;

  // HUD
  mouseWorld: Point;
  orthoEnabled?: boolean;
  snapEnabled?: boolean;
  selectedCount?: number;
  commandPrompt?: string;
  dynamicInput?: {
    active: boolean;
    mode: string;
    value1: string;
    value2?: string;
  };
  screenPosition?: Point;
}

export const OverlayRoot: React.FC<OverlayRootProps> = ({
  width,
  height,
  pan,
  zoom,
  showGrid,
  gridSpacing,
  osnapPoint,
  preview,
  mouseWorld,
  orthoEnabled,
  snapEnabled,
  selectedCount,
  commandPrompt,
  dynamicInput,
  screenPosition,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "none",
      }}
    >
      {/* Layer 1: Grid (bottom) */}
      <GridOverlay
        width={width}
        height={height}
        pan={pan}
        zoom={zoom}
        gridSpacing={gridSpacing}
        visible={showGrid}
      />

      {/* Layer 2: Preview (drawing feedback) */}
      <PreviewOverlay
        width={width}
        height={height}
        pan={pan}
        zoom={zoom}
        preview={preview}
      />

      {/* Layer 3: Osnap markers */}
      <OsnapOverlay
        width={width}
        height={height}
        osnapPoint={osnapPoint}
        pan={pan}
        zoom={zoom}
      />

      {/* Layer 4: HUD (top) */}
      <HudOverlay
        width={width}
        height={height}
        mouseWorld={mouseWorld}
        zoom={zoom}
        orthoEnabled={orthoEnabled}
        snapEnabled={snapEnabled}
        selectedCount={selectedCount}
        commandPrompt={commandPrompt}
        dynamicInput={dynamicInput}
        screenPosition={screenPosition}
      />
    </div>
  );
};

// Re-export child components for individual use
export { GridOverlay } from "./GridOverlay";
export { OsnapOverlay } from "./OsnapOverlay";
export { PreviewOverlay } from "./PreviewOverlay";
export { HudOverlay } from "./HudOverlay";
export type { OsnapPoint, PreviewState };

export default OverlayRoot;
