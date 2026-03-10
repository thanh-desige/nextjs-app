/**
 * SvgGridRenderer — Grid rendering for SVG canvas
 * Extracted from SvgAdapter (STEP-5.13)
 */

import { Vec2 } from "../../core/geometry/Vec2";

// ===== Grid State =====

export interface SvgGridState {
  gridVisible: boolean;
  gridSpacing: number;
  gridMajorEvery: number;
}

export function createSvgGridState(): SvgGridState {
  return {
    gridVisible: false,
    gridSpacing: 10,
    gridMajorEvery: 10,
  };
}

// ===== Grid Functions =====

export function showSvgGrid(
  gridGroup: SVGGElement | null,
  state: SvgGridState,
  spacing: number,
  majorEvery: number,
  screenToWorld: (pos: Vec2) => Vec2,
  worldToScreen: (pos: Vec2) => Vec2,
  width: number,
  height: number
): void {
  state.gridSpacing = spacing;
  state.gridMajorEvery = majorEvery;
  state.gridVisible = true;
  updateSvgGrid(
    gridGroup,
    state,
    screenToWorld,
    worldToScreen,
    width,
    height
  );
}

export function hideSvgGrid(
  gridGroup: SVGGElement | null,
  state: SvgGridState
): void {
  state.gridVisible = false;
  if (gridGroup) {
    gridGroup.innerHTML = "";
  }
}

export function updateSvgGrid(
  gridGroup: SVGGElement | null,
  state: SvgGridState,
  screenToWorld: (pos: Vec2) => Vec2,
  worldToScreen: (pos: Vec2) => Vec2,
  width: number,
  height: number
): void {
  if (!gridGroup || !state.gridVisible) return;

  gridGroup.innerHTML = "";

  const topLeft = screenToWorld(new Vec2(0, 0));
  const bottomRight = screenToWorld(new Vec2(width, height));

  const startX =
    Math.floor(topLeft.x / state.gridSpacing) * state.gridSpacing;
  const endX =
    Math.ceil(bottomRight.x / state.gridSpacing) * state.gridSpacing;
  const startY =
    Math.floor(bottomRight.y / state.gridSpacing) * state.gridSpacing;
  const endY = Math.ceil(topLeft.y / state.gridSpacing) * state.gridSpacing;

  // Vertical lines
  for (let x = startX; x <= endX; x += state.gridSpacing) {
    const isMajor =
      x % (state.gridSpacing * state.gridMajorEvery) === 0;
    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    const screenStart = worldToScreen(new Vec2(x, startY));
    const screenEnd = worldToScreen(new Vec2(x, endY));

    line.setAttribute("x1", `${screenStart.x}`);
    line.setAttribute("y1", `${screenStart.y}`);
    line.setAttribute("x2", `${screenEnd.x}`);
    line.setAttribute("y2", `${screenEnd.y}`);
    line.setAttribute("stroke", isMajor ? "#555555" : "#333333");
    line.setAttribute("stroke-width", isMajor ? "1" : "0.5");

    gridGroup.appendChild(line);
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += state.gridSpacing) {
    const isMajor =
      y % (state.gridSpacing * state.gridMajorEvery) === 0;
    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    const screenStart = worldToScreen(new Vec2(startX, y));
    const screenEnd = worldToScreen(new Vec2(endX, y));

    line.setAttribute("x1", `${screenStart.x}`);
    line.setAttribute("y1", `${screenStart.y}`);
    line.setAttribute("x2", `${screenEnd.x}`);
    line.setAttribute("y2", `${screenEnd.y}`);
    line.setAttribute("stroke", isMajor ? "#555555" : "#333333");
    line.setAttribute("stroke-width", isMajor ? "1" : "0.5");

    gridGroup.appendChild(line);
  }
}
