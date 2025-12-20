/**
 * Viewport math utilities
 * Handles zoom clamping, grid step calculation based on zoom level, etc.
 */

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 50;
export const DEFAULT_ZOOM = 1;

/**
 * Clamp zoom level within allowed range
 */
export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/**
 * Calculate zoom factor for mouse wheel
 * @param deltaY - Mouse wheel delta (negative = zoom in)
 * @param currentZoom - Current zoom level
 * @returns New zoom level
 */
export function calculateWheelZoom(
  deltaY: number,
  currentZoom: number
): number {
  const factor = deltaY > 0 ? 0.9 : 1.1;
  return clampZoom(currentZoom * factor);
}

/**
 * Calculate adaptive grid step based on zoom level
 * Grid lines should be ~50-100 pixels apart on screen
 * @param baseSpacing - Base grid spacing in world units
 * @param zoom - Current zoom level
 * @returns Grid spacing to use for this zoom level
 */
export function getAdaptiveGridStep(baseSpacing: number, zoom: number): number {
  const targetScreenSpacing = 50; // Target pixels between grid lines
  const worldSpacing = targetScreenSpacing / zoom;

  // Round to nearest power of baseSpacing
  const steps = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  const scaledSteps = steps.map((s) => s * baseSpacing);

  // Find the step that gives closest to target spacing
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
}

/**
 * Calculate minor grid step (subdivisions of major grid)
 */
export function getMinorGridStep(
  majorStep: number,
  subdivisions: number = 5
): number {
  return majorStep / subdivisions;
}

/**
 * Zoom to fit a bounding box in the viewport
 */
export function zoomToFit(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): { zoom: number; panX: number; panY: number } {
  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;

  if (boundsWidth <= 0 || boundsHeight <= 0) {
    return { zoom: DEFAULT_ZOOM, panX: 0, panY: 0 };
  }

  const zoomX = (viewportWidth - padding * 2) / boundsWidth;
  const zoomY = (viewportHeight - padding * 2) / boundsHeight;
  const zoom = clampZoom(Math.min(zoomX, zoomY));

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return {
    zoom,
    panX: -centerX * zoom,
    panY: centerY * zoom,
  };
}

/**
 * Zoom centered on a specific screen point
 */
export function zoomAtPoint(
  screenPoint: { x: number; y: number },
  currentZoom: number,
  newZoom: number,
  currentPan: { x: number; y: number },
  viewportWidth: number,
  viewportHeight: number
): { panX: number; panY: number } {
  const centerX = viewportWidth / 2 + currentPan.x;
  const centerY = viewportHeight / 2 + currentPan.y;

  // World position under cursor before zoom
  const worldX = (screenPoint.x - centerX) / currentZoom;
  const worldY = -(screenPoint.y - centerY) / currentZoom;

  // Screen position of same world point after zoom
  const newScreenX = centerX + worldX * newZoom;
  const newScreenY = centerY - worldY * newZoom;

  // Adjust pan to keep world point under cursor
  return {
    panX: currentPan.x + (screenPoint.x - newScreenX),
    panY: currentPan.y + (screenPoint.y - newScreenY),
  };
}
