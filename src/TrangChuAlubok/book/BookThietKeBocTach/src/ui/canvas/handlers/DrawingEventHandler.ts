/**
 * DrawingEventHandler - Pure functions for handling drawing events
 *
 * ĐIỀU KIỆN 1: Các hàm này chỉ xử lý logic preview và state transitions
 * Việc tạo entity thực sự được thực hiện bởi Commands qua useDrawingHandler
 *
 * File này cung cấp:
 * 1. Preview entity creation cho từng tool
 * 2. State transitions cho drawing modes
 * 3. Helper functions cho drawing logic
 */

import { Point } from "../utils/types";
import { distance, applyOrtho } from "../utils/geometry";

// ==================== Types ====================

export interface DrawingEventState {
  mode: string;
  points: Point[];
  corner1?: Point | null;
  center?: Point | null;
  axisEnd?: Point | null;
  radiusX?: number;
  position?: Point | null;
  inputActive?: boolean;
  // Arc 3-point state
  arcPoints?: Point[];
  // Text state
  textContent?: string;
}

export interface PreviewLineData {
  type: "line";
  points: Point[];
}

export interface PreviewRectData {
  type: "rect";
  points: [Point, Point];
}

export interface PreviewCircleData {
  type: "circle";
  center: Point;
  radius: number;
}

export interface PreviewArcData {
  type: "arc";
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface PreviewEllipseData {
  type: "ellipse";
  center: Point;
  radiusX: number;
  radiusY: number;
  rotation: number;
}

export interface PreviewTextData {
  type: "text";
  position: Point;
  content: string;
}

export type PreviewData =
  | PreviewLineData
  | PreviewRectData
  | PreviewCircleData
  | PreviewArcData
  | PreviewEllipseData
  | PreviewTextData
  | null;

// ==================== Preview Generators ====================

/**
 * Generate preview data for line drawing
 */
export function generateLinePreview(
  existingPoints: Point[],
  currentPoint: Point,
  orthoMode: boolean
): PreviewLineData | null {
  if (existingPoints.length === 0) {
    return null;
  }

  const lastPoint = existingPoints[existingPoints.length - 1];
  let finalPoint = currentPoint;

  if (orthoMode) {
    finalPoint = applyOrtho(lastPoint, currentPoint);
  }

  return {
    type: "line",
    points: [...existingPoints, finalPoint],
  };
}

/**
 * Generate preview data for rectangle drawing
 */
export function generateRectPreview(
  corner1: Point,
  currentPoint: Point,
  orthoMode: boolean
): PreviewRectData {
  let corner2 = currentPoint;

  if (orthoMode) {
    // Make square in ortho mode
    const size = Math.max(
      Math.abs(corner2.x - corner1.x),
      Math.abs(corner2.y - corner1.y)
    );
    corner2 = {
      x: corner1.x + Math.sign(corner2.x - corner1.x) * size,
      y: corner1.y + Math.sign(corner2.y - corner1.y) * size,
    };
  }

  return {
    type: "rect",
    points: [corner1, corner2],
  };
}

/**
 * Generate preview data for circle drawing
 */
export function generateCirclePreview(
  center: Point,
  currentPoint: Point
): PreviewCircleData {
  const radius = distance(center, currentPoint);
  return {
    type: "circle",
    center,
    radius,
  };
}

/**
 * Calculate arc from 3 points (start, middle, end)
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
  // Calculate circumcenter of triangle formed by 3 points
  const ax = p1.x;
  const ay = p1.y;
  const bx = p2.x;
  const by = p2.y;
  const cx = p3.x;
  const cy = p3.y;

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

  if (Math.abs(d) < 1e-10) {
    // Points are collinear, can't form arc
    return null;
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

  const center: Point = { x: ux, y: uy };
  const radius = distance(center, p1);

  // Calculate angles
  let startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
  let midAngle = Math.atan2(p2.y - center.y, p2.x - center.x);
  let endAngle = Math.atan2(p3.y - center.y, p3.x - center.x);

  // Normalize angles to [0, 2π]
  if (startAngle < 0) startAngle += 2 * Math.PI;
  if (midAngle < 0) midAngle += 2 * Math.PI;
  if (endAngle < 0) endAngle += 2 * Math.PI;

  // Determine arc direction based on midpoint
  // Check if midpoint is on the arc going counterclockwise from start to end
  const normalizeAngle = (a: number): number => {
    while (a < 0) a += 2 * Math.PI;
    while (a >= 2 * Math.PI) a -= 2 * Math.PI;
    return a;
  };

  const angleDiff = normalizeAngle(endAngle - startAngle);
  const midDiff = normalizeAngle(midAngle - startAngle);

  // If mid is between start and end going counterclockwise, keep direction
  // Otherwise swap start and end
  if (midDiff > angleDiff) {
    // Swap
    const temp = startAngle;
    startAngle = endAngle;
    endAngle = temp;
  }

  return { center, radius, startAngle, endAngle };
}

/**
 * Generate preview data for arc drawing (3-point arc)
 */
export function generateArcPreview(
  points: Point[],
  currentPoint: Point
): PreviewArcData | null {
  if (points.length === 0) {
    return null;
  }

  if (points.length === 1) {
    // Just show a line from first point to current
    return null; // Will be rendered as a line in canvas
  }

  if (points.length === 2) {
    // Calculate arc through 3 points
    const arcData = calculateArcFrom3Points(points[0], points[1], currentPoint);
    if (!arcData) {
      return null;
    }
    return {
      type: "arc",
      center: arcData.center,
      radius: arcData.radius,
      startAngle: arcData.startAngle,
      endAngle: arcData.endAngle,
    };
  }

  return null;
}

/**
 * Calculate ellipse's second radius based on perpendicular distance
 */
export function calculateEllipseRadiusY(
  center: Point,
  axisEnd: Point,
  currentPoint: Point
): number {
  // Calculate perpendicular distance from currentPoint to the axis line
  const axisAngle = Math.atan2(axisEnd.y - center.y, axisEnd.x - center.x);

  // Vector from center to currentPoint
  const dx = currentPoint.x - center.x;
  const dy = currentPoint.y - center.y;

  // Perpendicular distance = |cross product| / |axis vector|
  // For 2D: cross = dx * sin(axisAngle) - dy * cos(axisAngle)
  // Actually, we want the distance perpendicular to the axis
  const perpAngle = axisAngle + Math.PI / 2;
  const perpDistance = Math.abs(
    dx * Math.cos(perpAngle) + dy * Math.sin(perpAngle)
  );

  return perpDistance;
}

/**
 * Generate preview data for ellipse drawing
 */
export function generateEllipsePreview(
  center: Point,
  axisEnd: Point | null,
  radiusX: number | undefined,
  currentPoint: Point
): PreviewEllipseData | null {
  if (!axisEnd) {
    // Step 1: Show circle preview from center to current point
    const rx = distance(center, currentPoint);
    return {
      type: "ellipse",
      center,
      radiusX: rx,
      radiusY: rx,
      rotation: 0,
    };
  }

  if (radiusX !== undefined) {
    // Step 2: Show ellipse with variable second axis
    const radiusY = calculateEllipseRadiusY(center, axisEnd, currentPoint);
    const rotation = Math.atan2(axisEnd.y - center.y, axisEnd.x - center.x);

    return {
      type: "ellipse",
      center,
      radiusX,
      radiusY,
      rotation,
    };
  }

  return null;
}

/**
 * Generate preview data for text
 */
export function generateTextPreview(
  position: Point,
  content: string
): PreviewTextData {
  return {
    type: "text",
    position,
    content: content || "Text",
  };
}

// ==================== Entity Creation Helpers ====================
// These are used by legacy code - Commands should use PropertySchema instead

/**
 * Create arc entity data
 */
export function createArcEntityData(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  layerId: string
): {
  id: string;
  type: "arc";
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
  lineWidth: number;
  layer: string;
} {
  return {
    id: `arc-${Date.now()}`,
    type: "arc",
    center,
    radius,
    startAngle,
    endAngle,
    color: "#ffffff",
    lineWidth: 2,
    layer: layerId,
  };
}

/**
 * Create ellipse entity data
 */
export function createEllipseEntityData(
  center: Point,
  radiusX: number,
  radiusY: number,
  rotation: number,
  layerId: string
): {
  id: string;
  type: "ellipse";
  center: Point;
  radiusX: number;
  radiusY: number;
  rotation: number;
  color: string;
  lineWidth: number;
  layer: string;
} {
  return {
    id: `ellipse-${Date.now()}`,
    type: "ellipse",
    center,
    radiusX,
    radiusY,
    rotation,
    color: "#ffffff",
    lineWidth: 2,
    layer: layerId,
  };
}

// ==================== State Management Helpers ====================

/**
 * Get initial drawing state for a tool
 */
export function getInitialDrawingState(toolType: string): DrawingEventState {
  switch (toolType) {
    case "line":
      return { mode: "idle", points: [] };
    case "rect":
      return { mode: "idle", points: [], corner1: null };
    case "circle":
      return { mode: "idle", points: [], center: null };
    case "arc":
      return { mode: "idle", points: [], arcPoints: [] };
    case "ellipse":
      return { mode: "idle", points: [], center: null, axisEnd: null };
    case "text":
      return { mode: "idle", points: [], position: null, inputActive: false };
    default:
      return { mode: "idle", points: [] };
  }
}

/**
 * Check if drawing can be finished
 */
export function canFinishDrawing(
  toolType: string,
  state: DrawingEventState
): boolean {
  switch (toolType) {
    case "line":
      return state.points.length >= 2;
    case "rect":
      return (
        state.corner1 !== null &&
        state.corner1 !== undefined &&
        state.points.length >= 1
      );
    case "circle":
      return (
        state.center !== null &&
        state.center !== undefined &&
        state.points.length >= 1
      );
    case "arc":
      return (state.arcPoints?.length || 0) >= 2;
    case "ellipse":
      return state.center !== null && state.axisEnd !== null;
    case "text":
      return state.position !== null && (state.textContent?.length || 0) > 0;
    default:
      return false;
  }
}
