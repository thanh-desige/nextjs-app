/**
 * Screen <-> World coordinate transformation helpers
 * UI-level utilities for converting between screen pixels and world units
 */

export interface Point {
  x: number;
  y: number;
}

export interface ViewportState {
  pan: Point;
  zoom: number;
  width: number;
  height: number;
}

/**
 * Convert screen coordinates to world coordinates
 * @param screenPos - Position in screen pixels (0,0 is top-left)
 * @param viewport - Current viewport state
 * @returns World position
 */
export function screenToWorld(
  screenPos: Point,
  viewport: ViewportState
): Point {
  const centerX = viewport.width / 2 + viewport.pan.x;
  const centerY = viewport.height / 2 + viewport.pan.y;
  return {
    x: (screenPos.x - centerX) / viewport.zoom,
    y: -(screenPos.y - centerY) / viewport.zoom, // Y is inverted in world coords
  };
}

/**
 * Convert world coordinates to screen coordinates
 * @param worldPos - Position in world units
 * @param viewport - Current viewport state
 * @returns Screen position in pixels
 */
export function worldToScreen(worldPos: Point, viewport: ViewportState): Point {
  const centerX = viewport.width / 2 + viewport.pan.x;
  const centerY = viewport.height / 2 + viewport.pan.y;
  return {
    x: centerX + worldPos.x * viewport.zoom,
    y: centerY - worldPos.y * viewport.zoom, // Y is inverted
  };
}

/**
 * Convert a distance from world units to screen pixels
 */
export function worldDistanceToScreen(
  worldDistance: number,
  zoom: number
): number {
  return worldDistance * zoom;
}

/**
 * Convert a distance from screen pixels to world units
 */
export function screenDistanceToWorld(
  screenDistance: number,
  zoom: number
): number {
  return screenDistance / zoom;
}

/**
 * Get mouse world position from mouse event
 */
export function getMouseWorldPos(
  e: MouseEvent | React.MouseEvent,
  canvas: HTMLCanvasElement,
  viewport: ViewportState
): Point {
  const rect = canvas.getBoundingClientRect();
  const screenPos = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  return screenToWorld(screenPos, viewport);
}

/**
 * Check if a world point is visible in the current viewport
 */
export function isPointInViewport(
  worldPos: Point,
  viewport: ViewportState
): boolean {
  const screenPos = worldToScreen(worldPos, viewport);
  return (
    screenPos.x >= 0 &&
    screenPos.x <= viewport.width &&
    screenPos.y >= 0 &&
    screenPos.y <= viewport.height
  );
}

/**
 * Get the world bounds of the current viewport
 */
export function getViewportWorldBounds(viewport: ViewportState): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const topLeft = screenToWorld({ x: 0, y: 0 }, viewport);
  const bottomRight = screenToWorld(
    { x: viewport.width, y: viewport.height },
    viewport
  );
  return {
    minX: topLeft.x,
    maxX: bottomRight.x,
    minY: bottomRight.y, // Y is inverted
    maxY: topLeft.y,
  };
}
