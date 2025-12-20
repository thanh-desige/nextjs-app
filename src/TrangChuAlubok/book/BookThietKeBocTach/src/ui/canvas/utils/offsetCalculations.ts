/**
 * OFFSET preview calculations for CAD canvas
 * Used for OFFSET command overlay rendering
 */

import { Point } from "./geometry";

/**
 * CadEntity type for offset calculations
 */
export interface OffsetCadEntity {
  type: "line" | "polyline" | "rect" | "circle" | "arc" | "ellipse" | "text";
  points: Point[];
}

/**
 * Calculate offset preview points for OFFSET command overlay
 */
export const calculateOffsetPreview = (
  entity: OffsetCadEntity,
  dist: number,
  throughPoint: Point
): Point[] => {
  switch (entity.type) {
    case "line":
    case "polyline":
      return calculateOffsetLinePreview(entity.points, dist, throughPoint);
    case "rect":
      return calculateOffsetRectPreview(entity.points, dist, throughPoint);
    case "circle":
      return calculateOffsetCirclePreview(entity.points, dist, throughPoint);
    default:
      return [];
  }
};

/**
 * Calculate offset preview for line/polyline entities
 */
export const calculateOffsetLinePreview = (
  points: Point[],
  dist: number,
  throughPoint: Point
): Point[] => {
  if (points.length < 2) return [];

  const offsetPoints: Point[] = [];

  // Calculate center to determine offset side
  let centerX = 0,
    centerY = 0;
  for (const p of points) {
    centerX += p.x;
    centerY += p.y;
  }
  centerX /= points.length;
  centerY /= points.length;

  // Vector from center to throughPoint to determine side
  const toThroughX = throughPoint.x - centerX;
  const toThroughY = throughPoint.y - centerY;

  for (let i = 0; i < points.length; i++) {
    let perpX = 0,
      perpY = 0;
    let count = 0;

    // Previous segment
    if (i > 0) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        perpX += -dy / len;
        perpY += dx / len;
        count++;
      }
    }

    // Next segment
    if (i < points.length - 1) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        perpX += -dy / len;
        perpY += dx / len;
        count++;
      }
    }

    if (count > 0) {
      perpX /= count;
      perpY /= count;
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
      if (perpLen > 0) {
        perpX /= perpLen;
        perpY /= perpLen;
      }
    }

    // Determine side
    const side = toThroughX * perpX + toThroughY * perpY > 0 ? 1 : -1;

    offsetPoints.push({
      x: points[i].x + perpX * dist * side,
      y: points[i].y + perpY * dist * side,
    });
  }

  return offsetPoints;
};

/**
 * Calculate offset preview for rectangle entities
 */
export const calculateOffsetRectPreview = (
  points: Point[],
  dist: number,
  throughPoint: Point
): Point[] => {
  if (points.length < 2) return [];

  const p1 = points[0];
  const p2 = points[1];

  // Check if throughPoint is outside rect
  const isOutside =
    throughPoint.x < Math.min(p1.x, p2.x) ||
    throughPoint.x > Math.max(p1.x, p2.x) ||
    throughPoint.y < Math.min(p1.y, p2.y) ||
    throughPoint.y > Math.max(p1.y, p2.y);

  const expand = isOutside ? 1 : -1;

  // Offset rect (expand outward or shrink inward)
  const dx = p2.x > p1.x ? dist * expand : -dist * expand;
  const dy = p2.y > p1.y ? dist * expand : -dist * expand;

  return [
    { x: p1.x - dx, y: p1.y - dy },
    { x: p2.x + dx, y: p2.y + dy },
  ];
};

/**
 * Calculate offset preview for circle entities
 */
export const calculateOffsetCirclePreview = (
  points: Point[],
  dist: number,
  throughPoint: Point
): Point[] => {
  if (points.length < 2) return [];

  const center = points[0];
  const radius = points[1].x;

  // Determine side (inside or outside)
  const distToCenter = Math.sqrt(
    Math.pow(throughPoint.x - center.x, 2) +
      Math.pow(throughPoint.y - center.y, 2)
  );

  const isOutside = distToCenter > radius;
  const newRadius = isOutside ? radius + dist : Math.max(0.1, radius - dist);

  return [center, { x: newRadius, y: 0 }];
};
