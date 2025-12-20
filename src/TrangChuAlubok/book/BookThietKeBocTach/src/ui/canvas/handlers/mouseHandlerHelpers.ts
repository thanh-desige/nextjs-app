/**
 * mouseHandlerHelpers.ts
 * Pure helper functions for mouse event handling
 * These functions handle common calculations and entity creation patterns
 */

import type { Point, CadEntity } from "../types/CadEntity";

// Re-export for backward compatibility
export type { Point, CadEntity };

export interface DrawState {
  mode: string;
  points?: Point[];
  corner1?: Point | null;
  center?: Point | null;
  axisEnd?: Point;
  radiusX?: number;
  [key: string]: unknown;
}

export interface EntityCreationResult {
  entity: CadEntity;
  nextDrawState: DrawState;
  promptMessage: string;
}

// ==================== Arc Calculations ====================

/**
 * Calculate arc center and radius from 3 points
 */
export function calculateArcFrom3Points(
  p1: Point,
  p2: Point,
  p3: Point
): {
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
} | null {
  const ax = p1.x,
    ay = p1.y;
  const bx = p2.x,
    by = p2.y;
  const cx = p3.x,
    cy = p3.y;

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) <= 0.0001) {
    return null; // Points are collinear
  }

  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    d;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    d;

  const center = { x: ux, y: uy };
  const radius = Math.sqrt((ax - ux) * (ax - ux) + (ay - uy) * (ay - uy));
  const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
  const endAngle = Math.atan2(p3.y - center.y, p3.x - center.x);

  return { center, radius, startAngle, endAngle };
}

// ==================== Ellipse Calculations ====================

/**
 * Calculate ellipse second radius from perpendicular distance
 */
export function calculateEllipseRadiusY(
  center: Point,
  axisEnd: Point,
  mousePos: Point
): number {
  const dx = axisEnd.x - center.x;
  const dy = axisEnd.y - center.y;
  const axisAngle = Math.atan2(dy, dx);

  const mouseVec = {
    x: mousePos.x - center.x,
    y: mousePos.y - center.y,
  };
  const perpAngle = axisAngle + Math.PI / 2;
  return Math.abs(
    mouseVec.x * Math.cos(perpAngle) + mouseVec.y * Math.sin(perpAngle)
  );
}

// ==================== Entity Creation Helpers ====================

/**
 * Create a line entity
 */
export function createLineEntity(
  points: Point[],
  layerId: string,
  color = "#ffffff",
  lineWidth = 2
): CadEntity {
  return {
    id: `line-${Date.now()}`,
    type: "line",
    points,
    color,
    lineWidth,
    layer: layerId,
  };
}

/**
 * Create a polyline entity
 */
export function createPolylineEntity(
  points: Point[],
  layerId: string,
  color = "#ffffff",
  lineWidth = 2
): CadEntity {
  return {
    id: `polyline-${Date.now()}`,
    type: "polyline",
    points,
    color,
    lineWidth,
    layer: layerId,
  };
}

/**
 * Create a rectangle entity
 */
export function createRectEntity(
  corner1: Point,
  corner2: Point,
  layerId: string,
  color = "#ffffff",
  lineWidth = 2
): CadEntity {
  return {
    id: `rect-${Date.now()}`,
    type: "rect",
    points: [corner1, corner2],
    color,
    lineWidth,
    layer: layerId,
  };
}

/**
 * Create a circle entity
 */
export function createCircleEntity(
  center: Point,
  radius: number,
  layerId: string,
  color = "#ffffff",
  lineWidth = 2
): CadEntity {
  return {
    id: `circle-${Date.now()}`,
    type: "circle",
    points: [center, { x: radius, y: 0 }],
    color,
    lineWidth,
    layer: layerId,
  };
}

/**
 * Create an arc entity
 */
export function createArcEntity(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  layerId: string,
  color = "#ffffff",
  lineWidth = 2,
  strokeStyle: "solid" | "dashed" | "dotted" | "dashdot" = "solid"
): CadEntity {
  return {
    id: `arc-${Date.now()}`,
    type: "arc",
    points: [center, { x: radius, y: 0 }],
    startAngle,
    endAngle,
    color,
    lineWidth,
    strokeStyle,
    layer: layerId,
  };
}

/**
 * Create an ellipse entity
 */
export function createEllipseEntity(
  center: Point,
  radiusX: number,
  radiusY: number,
  rotation: number,
  layerId: string,
  color = "#ffffff",
  lineWidth = 2,
  strokeStyle: "solid" | "dashed" | "dotted" | "dashdot" = "solid"
): CadEntity {
  return {
    id: `ellipse-${Date.now()}`,
    type: "ellipse",
    points: [center],
    radiusX,
    radiusY,
    rotation,
    color,
    lineWidth,
    strokeStyle,
    layer: layerId,
  };
}

/**
 * Create a text entity
 */
export function createTextEntity(
  position: Point,
  text: string,
  layerId: string,
  fontSize = 12,
  fontFamily = "Arial",
  color = "#ffffff",
  strokeStyle: "solid" | "dashed" | "dotted" | "dashdot" = "solid"
): CadEntity {
  return {
    id: `text-${Date.now()}`,
    type: "text",
    points: [position],
    text,
    fontSize,
    fontFamily,
    color,
    lineWidth: 1,
    strokeStyle,
    layer: layerId,
  };
}

// ==================== Selection Box Helpers ====================

/**
 * Check if selection is left-to-right (window) or right-to-left (crossing)
 */
export function isWindowSelection(start: Point, current: Point): boolean {
  return current.x > start.x;
}

/**
 * Get selection rectangle bounds
 */
export function getSelectionBounds(
  start: Point,
  current: Point
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  return {
    minX: Math.min(start.x, current.x),
    minY: Math.min(start.y, current.y),
    maxX: Math.max(start.x, current.x),
    maxY: Math.max(start.y, current.y),
  };
}

// ==================== Movement Helpers ====================

/**
 * Calculate moved points
 */
export function translatePoints(
  points: Point[],
  dx: number,
  dy: number
): Point[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

/**
 * Calculate rotated points around a center
 */
export function rotatePointsAroundCenter(
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
 * Calculate mirrored points across a line
 */
export function mirrorPointsAcrossLine(
  points: Point[],
  lineStart: Point,
  lineEnd: Point
): Point[] {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return points;

  const nx = dx / len;
  const ny = dy / len;

  return points.map((p) => {
    const px = p.x - lineStart.x;
    const py = p.y - lineStart.y;
    const dot = px * nx + py * ny;
    const projX = dot * nx;
    const projY = dot * ny;
    const perpX = px - projX;
    const perpY = py - projY;

    return {
      x: lineStart.x + projX - perpX,
      y: lineStart.y + projY - perpY,
    };
  });
}

/**
 * Calculate scaled points from a base point
 */
export function scalePointsFromBase(
  points: Point[],
  basePoint: Point,
  scaleFactor: number
): Point[] {
  return points.map((p) => ({
    x: basePoint.x + (p.x - basePoint.x) * scaleFactor,
    y: basePoint.y + (p.y - basePoint.y) * scaleFactor,
  }));
}
