/**
 * DimensionEventHandler - Pure functions for handling dimension events
 *
 * ĐIỀU KIỆN 1: Các hàm này chỉ xử lý logic hit testing và calculations
 * Việc update dimension state được thực hiện qua callbacks
 *
 * File này cung cấp:
 * 1. Dimension hit testing
 * 2. Dimension grip detection
 * 3. Dimension offset calculations
 * 4. QDIM helper functions
 */

import { Point, DimensionEntity } from "../utils/types";
import { distance } from "../utils/geometry";
import { hitTestDimension, getDimensionGrips } from "../utils/dimensionUtils";

// ==================== Types ====================

export interface DimensionGripInfo {
  dimensionId: string;
  type: "start" | "end" | "mid" | "offset";
  point: Point;
}

export interface DimensionHitResult {
  dimension: DimensionEntity;
  hitType: "body" | "grip";
  gripInfo?: DimensionGripInfo;
}

// ==================== Hit Testing ====================

/**
 * Find dimension at a world position
 */
export function findDimensionAtPoint(
  dimensions: DimensionEntity[],
  worldPos: Point,
  hitTolerance: number
): DimensionEntity | null {
  // Iterate in reverse to hit top-most dimensions first
  for (let i = dimensions.length - 1; i >= 0; i--) {
    const dimension = dimensions[i];
    if (hitTestDimension(dimension, worldPos, hitTolerance)) {
      return dimension;
    }
  }
  return null;
}

/**
 * Find dimension grip at a world position
 */
export function findDimensionGripAtPoint(
  dimensions: DimensionEntity[],
  selectedDimensionIds: string[],
  worldPos: Point,
  gripSize: number
): DimensionGripInfo | null {
  for (const dimension of dimensions) {
    if (!selectedDimensionIds.includes(dimension.id)) continue;

    const grips = getDimensionGrips(dimension);
    for (const grip of grips) {
      // DimensionGrip uses 'position' not 'point'
      const dx = grip.position.x - worldPos.x;
      const dy = grip.position.y - worldPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= gripSize) {
        // Map DimensionGripType to our simplified type
        let mappedType: "start" | "end" | "mid" | "offset";
        switch (grip.type) {
          case "point1":
            mappedType = "start";
            break;
          case "point2":
            mappedType = "end";
            break;
          case "dimP1":
          case "dimP2":
            mappedType = "offset";
            break;
          case "text":
            mappedType = "mid";
            break;
          default:
            mappedType = "offset";
        }
        return {
          dimensionId: dimension.id,
          type: mappedType,
          point: grip.position,
        };
      }
    }
  }

  return null;
}

// ==================== Dimension Calculations ====================

/**
 * Calculate dimension offset from a line and perpendicular point
 */
export function calculateDimensionOffset(
  point1: Point,
  point2: Point,
  offsetPoint: Point
): number {
  // Calculate perpendicular distance from offsetPoint to the line p1-p2
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 1e-10) return 0;

  // Unit perpendicular vector
  const perpX = -dy / length;
  const perpY = dx / length;

  // Vector from p1 to offsetPoint
  const toOffsetX = offsetPoint.x - point1.x;
  const toOffsetY = offsetPoint.y - point1.y;

  // Signed distance (dot product with perpendicular)
  const offset = toOffsetX * perpX + toOffsetY * perpY;

  return offset;
}

/**
 * Calculate aligned dimension angle
 */
export function calculateAlignedDimensionAngle(
  point1: Point,
  point2: Point
): number {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x);
}

/**
 * Calculate linear dimension measurement (horizontal or vertical)
 */
export function calculateLinearMeasurement(
  point1: Point,
  point2: Point,
  isHorizontal: boolean
): number {
  if (isHorizontal) {
    return Math.abs(point2.x - point1.x);
  } else {
    return Math.abs(point2.y - point1.y);
  }
}

/**
 * Calculate aligned dimension measurement
 */
export function calculateAlignedMeasurement(
  point1: Point,
  point2: Point
): number {
  return distance(point1, point2);
}

// ==================== Dimension Type Detection ====================

/**
 * Detect appropriate dimension type based on entity
 */
export function detectDimensionType(entity: {
  type: string;
  center?: Point;
  radius?: number;
}): "linear" | "radius" | "diameter" | "angular" {
  if (
    entity.type === "circle" &&
    entity.center &&
    entity.radius !== undefined
  ) {
    return "radius"; // or could be "diameter"
  }
  if (entity.type === "arc") {
    return "radius";
  }
  return "linear";
}

/**
 * Check if a point is near a circle edge
 */
export function isPointNearCircleEdge(
  center: Point,
  radius: number,
  point: Point,
  tolerance: number
): boolean {
  const distToCenter = distance(center, point);
  const distToEdge = Math.abs(distToCenter - radius);
  return distToEdge <= tolerance;
}

// ==================== QDIM Helpers ====================

/**
 * Extract dimension points from selected entities
 */
export function extractQdimPoints(
  entities: { type: string; points: Point[] }[]
): Point[] {
  const allPoints: Point[] = [];

  for (const entity of entities) {
    if (entity.type === "line" || entity.type === "polyline") {
      // Add all vertices
      allPoints.push(...entity.points);
    } else if (entity.type === "rect" && entity.points.length >= 2) {
      // Add all 4 corners
      const [p1, p2] = entity.points;
      allPoints.push({ ...p1 });
      allPoints.push({ x: p2.x, y: p1.y });
      allPoints.push({ ...p2 });
      allPoints.push({ x: p1.x, y: p2.y });
    }
  }

  // Remove duplicate points
  return removeDuplicatePoints(allPoints);
}

/**
 * Remove duplicate points (within tolerance)
 */
export function removeDuplicatePoints(
  points: Point[],
  tolerance: number = 0.001
): Point[] {
  const unique: Point[] = [];

  for (const point of points) {
    let isDuplicate = false;
    for (const existing of unique) {
      if (distance(point, existing) < tolerance) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      unique.push(point);
    }
  }

  return unique;
}

/**
 * Sort points for QDIM (left to right, top to bottom)
 */
export function sortQdimPoints(
  points: Point[],
  isHorizontal: boolean
): Point[] {
  if (isHorizontal) {
    // Sort by X coordinate
    return [...points].sort((a, b) => a.x - b.x);
  } else {
    // Sort by Y coordinate
    return [...points].sort((a, b) => b.y - a.y);
  }
}

/**
 * Generate QDIM dimension pairs from sorted points
 */
export function generateQdimPairs(
  sortedPoints: Point[]
): Array<{ point1: Point; point2: Point }> {
  const pairs: Array<{ point1: Point; point2: Point }> = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    pairs.push({
      point1: sortedPoints[i],
      point2: sortedPoints[i + 1],
    });
  }

  return pairs;
}

// ==================== Dimension Text Helpers ====================

/**
 * Format dimension text
 */
export function formatDimensionText(
  value: number,
  precision: number = 2,
  prefix: string = "",
  suffix: string = ""
): string {
  const formatted = value.toFixed(precision);
  return `${prefix}${formatted}${suffix}`;
}

/**
 * Get dimension text position
 */
export function getDimensionTextPosition(
  point1: Point,
  point2: Point,
  offset: number,
  isHorizontal: boolean
): Point {
  const midX = (point1.x + point2.x) / 2;
  const midY = (point1.y + point2.y) / 2;

  if (isHorizontal) {
    return { x: midX, y: midY + offset };
  } else {
    return { x: midX + offset, y: midY };
  }
}

// ==================== Selection Helpers ====================

/**
 * Toggle dimension in selection
 */
export function toggleDimensionInSelection(
  currentSelection: string[],
  dimensionId: string
): string[] {
  if (currentSelection.includes(dimensionId)) {
    return currentSelection.filter((id) => id !== dimensionId);
  } else {
    return [...currentSelection, dimensionId];
  }
}

/**
 * Check if point is inside dimension text box
 */
export function isPointInDimensionTextBox(
  dimension: DimensionEntity,
  point: Point,
  textWidth: number = 50,
  textHeight: number = 20
): boolean {
  // DimensionEntity has type: "dimension" and dimensionType for the actual direction
  const isHorizontal =
    dimension.dimensionType === "horizontal" ||
    dimension.direction === "horizontal";

  const textPos = getDimensionTextPosition(
    dimension.point1,
    dimension.point2,
    dimension.offset,
    isHorizontal
  );

  const halfWidth = textWidth / 2;
  const halfHeight = textHeight / 2;

  return (
    point.x >= textPos.x - halfWidth &&
    point.x <= textPos.x + halfWidth &&
    point.y >= textPos.y - halfHeight &&
    point.y <= textPos.y + halfHeight
  );
}
