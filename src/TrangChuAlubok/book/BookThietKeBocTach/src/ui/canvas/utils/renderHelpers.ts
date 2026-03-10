/**
 * Render Helpers - Pure rendering functions extracted from CadDrawingCanvas
 * These are stateless functions that can be used for drawing on canvas
 */

import { Point } from "./geometry";
import { CadEntity } from "./entityUtils";

// ==================== Types ====================

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  zoom: number;
  worldToScreen: (worldX: number, worldY: number) => Point;
}

// ==================== Grid Rendering ====================

export interface GridOptions {
  screenSpacing?: number;
  majorEvery?: number;
  minorColor?: string;
  majorColor?: string;
  axisColor?: string;
}

/**
 * Draw grid with minor/major lines and axis
 */
export function drawGrid(
  context: RenderContext,
  options: GridOptions = {}
): void {
  const { ctx, width, height, worldToScreen } = context;
  const {
    screenSpacing = 20,
    majorEvery = 5,
    minorColor = "#2a2a3e",
    majorColor = "#3a3a4e",
    axisColor = "#5a5a7e",
  } = options;

  // Minor grid lines
  ctx.strokeStyle = minorColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= width; x += screenSpacing) {
    if (Math.round(x / screenSpacing) % majorEvery !== 0) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
  }
  for (let y = 0; y <= height; y += screenSpacing) {
    if (Math.round(y / screenSpacing) % majorEvery !== 0) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
  }
  ctx.stroke();

  // Major grid lines
  ctx.strokeStyle = majorColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += screenSpacing) {
    if (Math.round(x / screenSpacing) % majorEvery === 0) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
  }
  for (let y = 0; y <= height; y += screenSpacing) {
    if (Math.round(y / screenSpacing) % majorEvery === 0) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
  }
  ctx.stroke();

  // Axis lines
  const origin = worldToScreen(0, 0);
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(origin.x, 0);
  ctx.lineTo(origin.x, height);
  ctx.moveTo(0, origin.y);
  ctx.lineTo(width, origin.y);
  ctx.stroke();
}

// ==================== Entity Transform Helpers ====================

/**
 * Apply translation to points
 */
export function translatePoints(
  points: Point[],
  dx: number,
  dy: number
): Point[] {
  return points.map((p) => ({
    x: p.x + dx,
    y: p.y + dy,
  }));
}

/**
 * Apply rotation to points around a center
 */
export function rotatePoints(
  points: Point[],
  center: Point,
  angle: number
): Point[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  });
}

/**
 * Apply scale to points around a center
 */
export function scalePoints(
  points: Point[],
  center: Point,
  factor: number
): Point[] {
  return points.map((p) => ({
    x: center.x + (p.x - center.x) * factor,
    y: center.y + (p.y - center.y) * factor,
  }));
}

/**
 * Apply mirror to points across a line defined by point and angle
 */
export function mirrorPoints(
  points: Point[],
  linePoint: Point,
  lineAngle: number
): Point[] {
  return points.map((p) => {
    const dx = p.x - linePoint.x;
    const dy = p.y - linePoint.y;
    const cos = Math.cos(-lineAngle);
    const sin = Math.sin(-lineAngle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const my = -ry;
    const cos2 = Math.cos(lineAngle);
    const sin2 = Math.sin(lineAngle);
    return {
      x: linePoint.x + rx * cos2 - my * sin2,
      y: linePoint.y + rx * sin2 + my * cos2,
    };
  });
}

// ==================== Entity Rendering ====================

/**
 * Draw a polyline/line entity
 */
export function drawPolyline(
  context: RenderContext,
  points: Point[],
  options: {
    strokeStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
  } = {}
): void {
  const { ctx, worldToScreen } = context;
  const { strokeStyle = "#ffffff", lineWidth = 2, lineDash = [] } = options;

  if (points.length < 2) return;

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(lineDash);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  const start = worldToScreen(points[0].x, points[0].y);
  ctx.moveTo(start.x, start.y);
  for (let i = 1; i < points.length; i++) {
    const pt = worldToScreen(points[i].x, points[i].y);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw a rectangle entity
 */
export function drawRect(
  context: RenderContext,
  p1: Point,
  p2: Point,
  options: {
    strokeStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
  } = {}
): void {
  const { ctx, worldToScreen } = context;
  const { strokeStyle = "#ffffff", lineWidth = 2, lineDash = [] } = options;

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(lineDash);

  const sp1 = worldToScreen(p1.x, p1.y);
  const sp2 = worldToScreen(p2.x, p2.y);
  ctx.strokeRect(
    Math.min(sp1.x, sp2.x),
    Math.min(sp1.y, sp2.y),
    Math.abs(sp2.x - sp1.x),
    Math.abs(sp2.y - sp1.y)
  );
  ctx.setLineDash([]);
}

/**
 * Draw a circle entity
 */
export function drawCircle(
  context: RenderContext,
  center: Point,
  radius: number,
  options: {
    strokeStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
  } = {}
): void {
  const { ctx, zoom, worldToScreen } = context;
  const { strokeStyle = "#ffffff", lineWidth = 2, lineDash = [] } = options;

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(lineDash);

  const screenCenter = worldToScreen(center.x, center.y);
  ctx.beginPath();
  ctx.arc(screenCenter.x, screenCenter.y, radius * zoom, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw a ghost preview entity (for COPY, OFFSET, etc.)
 */
export function drawGhostEntity(
  context: RenderContext,
  entity: CadEntity,
  points: Point[]
): void {
  const { ctx, zoom, worldToScreen } = context;

  ctx.globalAlpha = 0.5;
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 1;

  if (entity.type === "line" || entity.type === "polyline") {
    if (points.length >= 2) {
      ctx.beginPath();
      const start = worldToScreen(points[0].x, points[0].y);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < points.length; i++) {
        const pt = worldToScreen(points[i].x, points[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
  } else if (entity.type === "rect") {
    const p1 = worldToScreen(points[0].x, points[0].y);
    const p2 = worldToScreen(points[1].x, points[1].y);
    ctx.strokeRect(
      Math.min(p1.x, p2.x),
      Math.min(p1.y, p2.y),
      Math.abs(p2.x - p1.x),
      Math.abs(p2.y - p1.y)
    );
  } else if (entity.type === "circle") {
    const center = worldToScreen(points[0].x, points[0].y);
    const radius = points[1].x * zoom;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
}

// ==================== OSNAP Markers ====================

export type OsnapType =
  | "ENDPOINT"
  | "MIDPOINT"
  | "CENTER"
  | "QUADRANT"
  | "INTERSECTION"
  | "PERPENDICULAR"
  | "NEAREST";

/**
 * Draw OSNAP marker at screen position
 */
export function drawOsnapMarker(
  ctx: CanvasRenderingContext2D,
  screenPos: Point,
  type: OsnapType,
  options: {
    size?: number;
    color?: string;
  } = {}
): void {
  const { size = 8, color = "#00ff00" } = options;

  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
  ctx.lineWidth = 2;

  switch (type) {
    case "ENDPOINT":
      // Square marker
      ctx.strokeRect(
        screenPos.x - size,
        screenPos.y - size,
        size * 2,
        size * 2
      );
      break;

    case "MIDPOINT":
      // Triangle marker
      ctx.beginPath();
      ctx.moveTo(screenPos.x, screenPos.y - size);
      ctx.lineTo(screenPos.x - size, screenPos.y + size);
      ctx.lineTo(screenPos.x + size, screenPos.y + size);
      ctx.closePath();
      ctx.stroke();
      break;

    case "CENTER":
      // Circle marker
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case "QUADRANT":
      // Diamond marker
      ctx.beginPath();
      ctx.moveTo(screenPos.x, screenPos.y - size);
      ctx.lineTo(screenPos.x + size, screenPos.y);
      ctx.lineTo(screenPos.x, screenPos.y + size);
      ctx.lineTo(screenPos.x - size, screenPos.y);
      ctx.closePath();
      ctx.stroke();
      break;

    case "INTERSECTION":
      // X with circle marker
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screenPos.x - size, screenPos.y - size);
      ctx.lineTo(screenPos.x + size, screenPos.y + size);
      ctx.moveTo(screenPos.x + size, screenPos.y - size);
      ctx.lineTo(screenPos.x - size, screenPos.y + size);
      ctx.stroke();
      break;

    case "PERPENDICULAR":
      // Right angle marker
      ctx.beginPath();
      ctx.moveTo(screenPos.x - size, screenPos.y);
      ctx.lineTo(screenPos.x - size, screenPos.y - size);
      ctx.lineTo(screenPos.x, screenPos.y - size);
      ctx.stroke();
      break;

    case "NEAREST":
      // X marker
      ctx.beginPath();
      ctx.moveTo(screenPos.x - size, screenPos.y - size);
      ctx.lineTo(screenPos.x + size, screenPos.y + size);
      ctx.moveTo(screenPos.x + size, screenPos.y - size);
      ctx.lineTo(screenPos.x - size, screenPos.y + size);
      ctx.stroke();
      break;

    default:
      // Circle for unknown types
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  }
}

// ==================== Crosshair ====================

/**
 * Draw crosshair at screen position with pickbox (AutoCAD style)
 */
export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  screenPos: Point,
  width: number,
  height: number,
  options: {
    color?: string;
    lineDash?: number[];
    pickboxSize?: number; // Size of pickbox in pixels
    showPickbox?: boolean;
  } = {}
): void {
  const {
    color = "rgba(255, 255, 255, 0.5)",
    lineDash = [3, 3],
    pickboxSize = 20,
    showPickbox = true,
  } = options;

  const halfBox = pickboxSize / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash(lineDash);
  ctx.beginPath();

  // Vertical line - with gap for pickbox
  if (showPickbox) {
    // Top part (from top to pickbox)
    ctx.moveTo(screenPos.x, 0);
    ctx.lineTo(screenPos.x, screenPos.y - halfBox);
    // Bottom part (from pickbox to bottom)
    ctx.moveTo(screenPos.x, screenPos.y + halfBox);
    ctx.lineTo(screenPos.x, height);

    // Horizontal line - with gap for pickbox
    // Left part (from left to pickbox)
    ctx.moveTo(0, screenPos.y);
    ctx.lineTo(screenPos.x - halfBox, screenPos.y);
    // Right part (from pickbox to right)
    ctx.moveTo(screenPos.x + halfBox, screenPos.y);
    ctx.lineTo(width, screenPos.y);
  } else {
    // No pickbox - draw full lines
    ctx.moveTo(screenPos.x, 0);
    ctx.lineTo(screenPos.x, height);
    ctx.moveTo(0, screenPos.y);
    ctx.lineTo(width, screenPos.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw pickbox (solid square at cursor center)
  if (showPickbox) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(
      screenPos.x - halfBox,
      screenPos.y - halfBox,
      pickboxSize,
      pickboxSize
    );
    ctx.stroke();
  }
}

// ==================== Selection Box ====================

/**
 * Draw selection box
 */
export function drawSelectionBox(
  context: RenderContext,
  start: Point,
  end: Point,
  options: {
    strokeColor?: string;
    fillColor?: string;
  } = {}
): void {
  const { ctx, worldToScreen } = context;
  const { strokeColor = "#00ff00", fillColor = "rgba(0, 255, 0, 0.1)" } =
    options;

  const s1 = worldToScreen(start.x, start.y);
  const s2 = worldToScreen(end.x, end.y);

  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.fillStyle = fillColor;

  const x = Math.min(s1.x, s2.x);
  const y = Math.min(s1.y, s2.y);
  const w = Math.abs(s2.x - s1.x);
  const h = Math.abs(s2.y - s1.y);

  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}

// ==================== Dimension Text ====================

/**
 * Draw dimension text with background
 */
export function drawDimensionText(
  ctx: CanvasRenderingContext2D,
  text: string,
  screenPos: Point,
  options: {
    font?: string;
    textColor?: string;
    bgColor?: string;
    padding?: number;
  } = {}
): void {
  const {
    font = "bold 11px monospace",
    textColor = "#4fd1c5",
    bgColor = "rgba(20, 20, 35, 0.85)",
    padding = 3,
  } = options;

  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const metrics = ctx.measureText(text);

  // Draw background
  ctx.fillStyle = bgColor;
  ctx.fillRect(
    screenPos.x - metrics.width / 2 - padding,
    screenPos.y - 7,
    metrics.width + padding * 2,
    14
  );

  // Draw text
  ctx.fillStyle = textColor;
  ctx.fillText(text, screenPos.x, screenPos.y);
}

// ==================== Selection Grips ====================

/**
 * Draw selection grip at screen position
 */
export function drawGrip(
  ctx: CanvasRenderingContext2D,
  screenPos: Point,
  options: {
    size?: number;
    fillColor?: string;
    isHovered?: boolean;
  } = {}
): void {
  const { size = 4, fillColor = "#00bfff", isHovered = false } = options;

  ctx.fillStyle = isHovered ? "#ff6600" : fillColor;
  ctx.fillRect(screenPos.x - size, screenPos.y - size, size * 2, size * 2);
}
