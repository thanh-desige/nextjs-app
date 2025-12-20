/**
 * Dimension utilities for CAD canvas
 * Contains dimension hit testing, grip handling, and calculations
 */

import { distance, nearestPointOnSegment } from "./geometry";
import type {
  Point,
  DimensionEntity,
  DimensionStyle,
  DimensionGrip,
  DimensionGripType,
} from "./types";

// Re-export types for backward compatibility
export type {
  DimensionEntity,
  DimensionStyle,
  DimensionGrip,
  DimensionGripType,
};

/**
 * Calculate dimP1, dimP2 based on direction
 * USED FOR: hitTestDimension, getDimensionGrips, dimensionIntersectsRect
 * Works in WORLD COORDS
 * offset NEGATIVE (mouse up) → dimLineY = midY + offset → worldY DECREASES → screenY DECREASES → dim UP
 */
export const calcDimensionLinePoints = (
  dim: DimensionEntity
): { dimP1: Point; dimP2: Point } => {
  const direction = dim.direction || "aligned";
  const offset = dim.offset;

  if (direction === "horizontal") {
    // Horizontal: negative offset → dim goes up on screen
    const midY = (dim.point1.y + dim.point2.y) / 2;
    const dimLineY = midY + offset; // ADD offset (negative when mouse up)
    return {
      dimP1: { x: dim.point1.x, y: dimLineY },
      dimP2: { x: dim.point2.x, y: dimLineY },
    };
  } else if (direction === "vertical") {
    // Vertical: positive offset = dim line to the right
    const midX = (dim.point1.x + dim.point2.x) / 2;
    const dimLineX = midX + offset;
    return {
      dimP1: { x: dimLineX, y: dim.point1.y },
      dimP2: { x: dimLineX, y: dim.point2.y },
    };
  } else {
    // Aligned - perpendicular offset
    const dx = dim.point2.x - dim.point1.x;
    const dy = dim.point2.y - dim.point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = length > 0 ? -dy / length : 0;
    const perpY = length > 0 ? dx / length : 0;
    return {
      dimP1: {
        x: dim.point1.x + perpX * offset,
        y: dim.point1.y + perpY * offset,
      },
      dimP2: {
        x: dim.point2.x + perpX * offset,
        y: dim.point2.y + perpY * offset,
      },
    };
  }
};

/**
 * Hit test for dimension entity
 */
export const hitTestDimension = (
  dim: DimensionEntity,
  worldPos: Point,
  tolerance: number
): boolean => {
  // Handle radius/diameter dimensions
  if (dim.dimensionType === "radius" || dim.dimensionType === "diameter") {
    const center = dim.point1;
    const circlePoint = dim.point2;

    // Calculate radius from stored points
    const dx = circlePoint.x - center.x;
    const dy = circlePoint.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Use generous tolerance for leader line (extends well beyond circle)
    // Leader line goes from circlePoint outward in direction of angle
    // We'll check along a longer segment to account for varying zoom levels
    const maxLeaderLength = radius * 2; // Check up to 2x radius beyond circle

    const farPoint = {
      x: circlePoint.x + maxLeaderLength * Math.cos(angle),
      y: circlePoint.y + maxLeaderLength * Math.sin(angle),
    };

    // Check distance to circle point (arrow location)
    if (distance(worldPos, circlePoint) <= tolerance * 2) return true;

    // Check distance to entire leader area (from circlePoint outward)
    const leaderNearest = nearestPointOnSegment(
      worldPos,
      circlePoint,
      farPoint
    );
    if (distance(worldPos, leaderNearest) <= tolerance * 2) return true;

    // For diameter, also check the line through center
    if (dim.dimensionType === "diameter") {
      const oppositePoint = {
        x: center.x - (circlePoint.x - center.x),
        y: center.y - (circlePoint.y - center.y),
      };
      const lineNearest = nearestPointOnSegment(
        worldPos,
        oppositePoint,
        circlePoint
      );
      if (distance(worldPos, lineNearest) <= tolerance * 2) return true;
      if (distance(worldPos, oppositePoint) <= tolerance * 2) return true;
    }

    return false;
  }

  const { dimP1, dimP2 } = calcDimensionLinePoints(dim);

  // Check distance to dimension line
  const nearest = nearestPointOnSegment(worldPos, dimP1, dimP2);
  if (distance(worldPos, nearest) <= tolerance) return true;

  // Check distance to extension lines
  const ext1Nearest = nearestPointOnSegment(worldPos, dim.point1, dimP1);
  if (distance(worldPos, ext1Nearest) <= tolerance) return true;

  const ext2Nearest = nearestPointOnSegment(worldPos, dim.point2, dimP2);
  if (distance(worldPos, ext2Nearest) <= tolerance) return true;

  // Check distance to endpoints
  if (distance(worldPos, dimP1) <= tolerance) return true;
  if (distance(worldPos, dimP2) <= tolerance) return true;

  return false;
};

/**
 * Get grip points for a dimension - 5 points like AutoCAD
 */
export const getDimensionGrips = (dim: DimensionEntity): DimensionGrip[] => {
  // Handle radius/diameter dimensions
  if (dim.dimensionType === "radius" || dim.dimensionType === "diameter") {
    const center = dim.point1;
    const circlePoint = dim.point2;

    // Calculate radius and angle for leader line
    const dx = circlePoint.x - center.x;
    const dy = circlePoint.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Text grip position - use radius-based offset (matches hitTest logic)
    // Leader extends about 0.5 * radius beyond circle point
    const leaderExtend = radius * 0.5;
    const textGripPoint = {
      x: circlePoint.x + leaderExtend * Math.cos(angle),
      y: circlePoint.y + leaderExtend * Math.sin(angle),
    };

    const grips: DimensionGrip[] = [
      { dimensionId: dim.id, type: "point1", position: center }, // Center
      { dimensionId: dim.id, type: "point2", position: circlePoint }, // Point on circle
      { dimensionId: dim.id, type: "text", position: textGripPoint }, // Text point (drag to change angle)
    ];

    // For diameter, add opposite point grip
    if (dim.dimensionType === "diameter") {
      const oppositePoint = {
        x: center.x - (circlePoint.x - center.x),
        y: center.y - (circlePoint.y - center.y),
      };
      grips.push({
        dimensionId: dim.id,
        type: "dimP1",
        position: oppositePoint,
      });
    }

    return grips;
  }

  const { dimP1, dimP2 } = calcDimensionLinePoints(dim);
  // Text position at middle of dimension line
  const textPos = { x: (dimP1.x + dimP2.x) / 2, y: (dimP1.y + dimP2.y) / 2 };

  return [
    { dimensionId: dim.id, type: "point1", position: dim.point1 }, // Origin point 1
    { dimensionId: dim.id, type: "point2", position: dim.point2 }, // Origin point 2
    { dimensionId: dim.id, type: "dimP1", position: dimP1 }, // Dim line end 1
    { dimensionId: dim.id, type: "dimP2", position: dimP2 }, // Dim line end 2
    { dimensionId: dim.id, type: "text", position: textPos }, // Text point at middle
  ];
};

/**
 * Hit test for grip points
 */
export const hitTestDimensionGrip = (
  dim: DimensionEntity,
  worldPos: Point,
  tolerance: number
): DimensionGrip | null => {
  const grips = getDimensionGrips(dim);
  for (const grip of grips) {
    if (distance(worldPos, grip.position) <= tolerance) {
      return grip;
    }
  }
  return null;
};

/**
 * Check if dimension intersects a selection box
 */
export const dimensionIntersectsRect = (
  dim: DimensionEntity,
  r1: Point,
  r2: Point
): boolean => {
  const minX = Math.min(r1.x, r2.x);
  const maxX = Math.max(r1.x, r2.x);
  const minY = Math.min(r1.y, r2.y);
  const maxY = Math.max(r1.y, r2.y);

  const isPointInRect = (pt: Point) =>
    pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;

  // Handle radius/diameter dimensions
  if (dim.dimensionType === "radius" || dim.dimensionType === "diameter") {
    const center = dim.point1;
    const circlePoint = dim.point2;

    // Calculate radius and angle
    const dx = circlePoint.x - center.x;
    const dy = circlePoint.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Leader extends beyond circle - use radius-based calculation
    const maxLeaderLength = radius * 2;

    const farPoint = {
      x: circlePoint.x + maxLeaderLength * Math.cos(angle),
      y: circlePoint.y + maxLeaderLength * Math.sin(angle),
    };

    // Check key points
    if (isPointInRect(circlePoint)) return true;
    if (isPointInRect(farPoint)) return true;

    // Check if leader line segment intersects rect
    // Simplified: check midpoint of leader
    const leaderMid = {
      x: (circlePoint.x + farPoint.x) / 2,
      y: (circlePoint.y + farPoint.y) / 2,
    };
    if (isPointInRect(leaderMid)) return true;

    // For diameter, also check center and opposite point
    if (dim.dimensionType === "diameter") {
      if (isPointInRect(center)) return true;
      const oppositePoint = {
        x: center.x - (circlePoint.x - center.x),
        y: center.y - (circlePoint.y - center.y),
      };
      if (isPointInRect(oppositePoint)) return true;
    }

    return false;
  }

  // Use shared helper to get dimension line points
  const { dimP1, dimP2 } = calcDimensionLinePoints(dim);

  const pointsToCheck = [dim.point1, dim.point2, dimP1, dimP2];

  for (const pt of pointsToCheck) {
    if (isPointInRect(pt)) {
      return true;
    }
  }

  return false;
};
