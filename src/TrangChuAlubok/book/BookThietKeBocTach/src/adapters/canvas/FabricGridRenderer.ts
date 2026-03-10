/**
 * FabricGridRenderer.ts
 *
 * STEP-5.11: Extracted from FabricAdapter.ts
 * Grid rendering and configuration for the Fabric.js canvas.
 */

import * as fabric from "fabric";
import type { Vec2 } from "../../core/geometry/Vec2";
import type { StrokeStyle } from "./CanvasAdapter";

// ============================================
// GRID CONFIGURATION
// ============================================

export interface GridConfig {
  spacing: number;
  majorEvery: number;
  minorStyle: StrokeStyle;
  majorStyle: StrokeStyle;
  visible: boolean;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  spacing: 10,
  majorEvery: 10,
  minorStyle: { color: "#333333", width: 0.5 },
  majorStyle: { color: "#555555", width: 1 },
  visible: false,
};

// ============================================
// GRID STATE
// ============================================

export interface GridState {
  config: GridConfig;
  group: fabric.Group | null;
}

export function createGridState(
  config?: Partial<GridConfig>,
): GridState {
  return {
    config: { ...DEFAULT_GRID_CONFIG, ...config },
    group: null,
  };
}

// ============================================
// GRID OPERATIONS
// ============================================

export function showGrid(
  canvas: fabric.Canvas,
  state: GridState,
  spacing: number,
  majorEvery: number,
  screenToWorld: (pos: Vec2) => Vec2,
  canvasWidth: number,
  canvasHeight: number,
): void {
  state.config.spacing = spacing;
  state.config.majorEvery = majorEvery;
  state.config.visible = true;
  updateGrid(canvas, state, screenToWorld, canvasWidth, canvasHeight);
}

export function hideGrid(
  canvas: fabric.Canvas,
  state: GridState,
): void {
  state.config.visible = false;
  if (state.group) {
    canvas.remove(state.group);
    state.group = null;
    canvas.requestRenderAll();
  }
}

export function setGridStyle(
  canvas: fabric.Canvas,
  state: GridState,
  minor: StrokeStyle | undefined,
  major: StrokeStyle | undefined,
  screenToWorld: (pos: Vec2) => Vec2,
  canvasWidth: number,
  canvasHeight: number,
): void {
  if (minor) state.config.minorStyle = minor;
  if (major) state.config.majorStyle = major;
  if (state.config.visible) {
    updateGrid(canvas, state, screenToWorld, canvasWidth, canvasHeight);
  }
}

export function updateGrid(
  canvas: fabric.Canvas,
  state: GridState,
  screenToWorld: (pos: Vec2) => Vec2,
  canvasWidth: number,
  canvasHeight: number,
): void {
  if (!state.config.visible) return;

  // Remove existing grid
  if (state.group) {
    canvas.remove(state.group);
  }

  const { spacing, majorEvery, minorStyle, majorStyle } = state.config;
  const lines: fabric.Line[] = [];

  // Calculate visible area in world coordinates
  const topLeft = screenToWorld({ x: 0, y: 0 } as Vec2);
  const bottomRight = screenToWorld({
    x: canvasWidth,
    y: canvasHeight,
  } as Vec2);

  const startX = Math.floor(topLeft.x / spacing) * spacing;
  const endX = Math.ceil(bottomRight.x / spacing) * spacing;
  const startY = Math.floor(bottomRight.y / spacing) * spacing;
  const endY = Math.ceil(topLeft.y / spacing) * spacing;

  // Vertical lines
  for (let x = startX; x <= endX; x += spacing) {
    const isMajor = x % (spacing * majorEvery) === 0;
    const style = isMajor ? majorStyle : minorStyle;

    lines.push(
      new fabric.Line([x, startY, x, endY], {
        stroke: style.color,
        strokeWidth: style.width,
      }),
    );
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += spacing) {
    const isMajor = y % (spacing * majorEvery) === 0;
    const style = isMajor ? majorStyle : minorStyle;

    lines.push(
      new fabric.Line([startX, y, endX, y], {
        stroke: style.color,
        strokeWidth: style.width,
      }),
    );
  }

  state.group = new fabric.Group(lines, {
    selectable: false,
    evented: false,
  });

  canvas.add(state.group);
  canvas.sendObjectToBack(state.group);
  canvas.requestRenderAll();
}
