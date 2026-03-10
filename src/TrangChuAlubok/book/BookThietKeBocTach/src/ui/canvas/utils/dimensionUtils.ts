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

// ==================== ASSOCIATIVE DIMENSION UTILITIES ====================

import type { DimensionAttachment, CadEntity } from "./types";
import type { EntityReference } from "../../../core/dimensions/DimensionManager";

/**
 * Resolve EntityReference to current entity point
 * EntityReference is used by DimensionManager for associative dimensions
 * Returns the actual world coordinate based on entity and snap info
 */
export const resolveEntityReference = (
  ref: EntityReference,
  entities: CadEntity[]
): Point | null => {
  const entity = entities.find((e) => e.id === ref.entityId);
  if (!entity) return null;

  // Handle different snap types
  switch (ref.snapType) {
    case "center":
      // For circles/arcs, return center
      if (entity.type === "circle" || entity.type === "arc") {
        return { ...entity.points[0] }; // Center point
      }
      // For rectangles/polylines, return centroid
      if (entity.points.length >= 2) {
        const sumX = entity.points.reduce((s, p) => s + p.x, 0);
        const sumY = entity.points.reduce((s, p) => s + p.y, 0);
        return {
          x: sumX / entity.points.length,
          y: sumY / entity.points.length,
        };
      }
      break;

    case "midpoint":
      // For lines, return midpoint of first segment
      if (entity.points.length >= 2) {
        const p1 = entity.points[0];
        const p2 = entity.points[1];
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      }
      break;

    case "quadrant":
      // For circles, return quadrant point based on original point angle
      if (entity.type === "circle" && entity.radius) {
        const center = entity.points[0];
        // Calculate angle from original ref point
        const angle = Math.atan2(
          ref.point.y - center.y,
          ref.point.x - center.x
        );
        // Snap to nearest quadrant
        const quadrantAngle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
        return {
          x: center.x + entity.radius * Math.cos(quadrantAngle),
          y: center.y + entity.radius * Math.sin(quadrantAngle),
        };
      }
      break;

    case "endpoint":
      // Return the endpoint - find which point on entity is closest to ref.point
      if (entity.points.length > 0) {
        let closestIdx = 0;
        let closestDist = Infinity;
        entity.points.forEach((p, idx) => {
          const dist = Math.hypot(p.x - ref.point.x, p.y - ref.point.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
          }
        });
        return { ...entity.points[closestIdx] };
      }
      break;

    case "intersection":
    case "nearest":
    default:
      // For these types, we need to recalculate based on current entity geometry
      // For now, just return the stored point (will work for simple cases)
      if (entity.points.length > 0) {
        // Find closest point on entity
        let closestIdx = 0;
        let closestDist = Infinity;
        entity.points.forEach((p, idx) => {
          const dist = Math.hypot(p.x - ref.point.x, p.y - ref.point.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
          }
        });
        return { ...entity.points[closestIdx] };
      }
      break;
  }

  return null;
};

/**
 * Resolve attachment point from entity (legacy interface)
 * Returns the actual world coordinate based on entity and attachment info
 */
export const resolveAttachmentPoint = (
  attachment: DimensionAttachment,
  entities: CadEntity[]
): Point | null => {
  const entity = entities.find((e) => e.id === attachment.entityId);
  if (!entity) return null;

  // Handle different snap types
  switch (attachment.snapType) {
    case "center":
      // For circles/arcs, return center
      if (entity.type === "circle" || entity.type === "arc") {
        return entity.points[0]; // Center point
      }
      // For rectangles/polylines, return centroid
      if (entity.points.length >= 2) {
        const sumX = entity.points.reduce((s, p) => s + p.x, 0);
        const sumY = entity.points.reduce((s, p) => s + p.y, 0);
        return {
          x: sumX / entity.points.length,
          y: sumY / entity.points.length,
        };
      }
      break;

    case "midpoint":
      // For lines, return midpoint
      if (entity.points.length >= 2) {
        const idx = Math.min(attachment.pointIndex, entity.points.length - 2);
        const p1 = entity.points[idx];
        const p2 = entity.points[idx + 1];
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      }
      break;

    case "quadrant":
      // For circles, return quadrant point
      if (entity.type === "circle" && entity.radius) {
        const center = entity.points[0];
        const quadrants = [
          { x: center.x + entity.radius, y: center.y }, // 0°
          { x: center.x, y: center.y + entity.radius }, // 90°
          { x: center.x - entity.radius, y: center.y }, // 180°
          { x: center.x, y: center.y - entity.radius }, // 270°
        ];
        return quadrants[attachment.pointIndex % 4];
      }
      break;

    case "endpoint":
    default:
      // Return specific point by index
      if (entity.points.length > 0) {
        const idx = Math.min(attachment.pointIndex, entity.points.length - 1);
        return { ...entity.points[idx] };
      }
      break;
  }

  return null;
};

/**
 * Check if dimension has entity references (is associative)
 * Uses ref1/ref2/ref3 from DimensionManager
 */
export const isAssociativeDimension = (dim: DimensionEntity): boolean => {
  // Check for ref1/ref2/ref3 (DimensionManager style)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = dim as any;
  return !!(
    d.ref1 ||
    d.ref2 ||
    d.ref3 ||
    dim.attachment1 ||
    dim.attachment2 ||
    dim.attachment3
  );
};

/**
 * Update dimension points from entity references
 * Call this after entities have moved to keep dimensions in sync
 * Supports both ref1/ref2/ref3 (DimensionManager) and attachment1/attachment2/attachment3 (legacy)
 */
export const updateDimensionFromAttachments = (
  dim: DimensionEntity,
  entities: CadEntity[]
): DimensionEntity => {
  // Check if dimension has any entity references
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = dim as any;
  const hasRefs = d.ref1 || d.ref2 || d.ref3;
  const hasAttachments = dim.attachment1 || dim.attachment2 || dim.attachment3;

  if (!hasRefs && !hasAttachments) return dim;

  let updated = { ...dim };
  let hasChanges = false;

  // Priority: use ref1/ref2/ref3 (DimensionManager style) first
  if (d.ref1) {
    const newPoint1 = resolveEntityReference(d.ref1, entities);
    if (
      newPoint1 &&
      (newPoint1.x !== dim.point1.x || newPoint1.y !== dim.point1.y)
    ) {
      updated.point1 = newPoint1;
      hasChanges = true;
    }
  } else if (dim.attachment1) {
    const newPoint1 = resolveAttachmentPoint(dim.attachment1, entities);
    if (
      newPoint1 &&
      (newPoint1.x !== dim.point1.x || newPoint1.y !== dim.point1.y)
    ) {
      updated.point1 = newPoint1;
      hasChanges = true;
    }
  }

  if (d.ref2) {
    const newPoint2 = resolveEntityReference(d.ref2, entities);
    if (
      newPoint2 &&
      (newPoint2.x !== dim.point2.x || newPoint2.y !== dim.point2.y)
    ) {
      updated.point2 = newPoint2;
      hasChanges = true;
    }
  } else if (dim.attachment2) {
    const newPoint2 = resolveAttachmentPoint(dim.attachment2, entities);
    if (
      newPoint2 &&
      (newPoint2.x !== dim.point2.x || newPoint2.y !== dim.point2.y)
    ) {
      updated.point2 = newPoint2;
      hasChanges = true;
    }
  }

  // Resolve ref3/attachment3 → point3 (for angular dimensions)
  if (d.ref3 && dim.point3) {
    const newPoint3 = resolveEntityReference(d.ref3, entities);
    if (
      newPoint3 &&
      (newPoint3.x !== dim.point3.x || newPoint3.y !== dim.point3.y)
    ) {
      updated.point3 = newPoint3;
      hasChanges = true;
    }
  } else if (dim.attachment3 && dim.point3) {
    const newPoint3 = resolveAttachmentPoint(dim.attachment3, entities);
    if (
      newPoint3 &&
      (newPoint3.x !== dim.point3.x || newPoint3.y !== dim.point3.y)
    ) {
      updated.point3 = newPoint3;
      hasChanges = true;
    }
  }

  // Recalculate value if points changed
  if (hasChanges) {
    if (dim.dimensionType === "radius" || dim.dimensionType === "diameter") {
      // For radius/diameter, value is the radius itself
      // (kept as-is, circle entity should update this)
    } else {
      // Calculate distance between points
      const dx = updated.point2.x - updated.point1.x;
      const dy = updated.point2.y - updated.point1.y;
      updated.value = Math.sqrt(dx * dx + dy * dy);
    }
  }

  return hasChanges ? updated : dim;
};

/**
 * Update all associative dimensions after entities changed
 * Returns updated dimensions array
 */
export const updateAssociativeDimensions = (
  dimensions: DimensionEntity[],
  entities: CadEntity[]
): DimensionEntity[] => {
  return dimensions.map((dim) => updateDimensionFromAttachments(dim, entities));
};

/**
 * Find dimensions attached to a specific entity
 * Used when entity is deleted to handle orphan dimensions
 * Checks both ref1/ref2/ref3 (DimensionManager style) and attachment1/attachment2/attachment3 (legacy)
 */
export const findDimensionsAttachedToEntity = (
  entityId: string,
  dimensions: DimensionEntity[]
): DimensionEntity[] => {
  return dimensions.filter((dim) => {
    const d = dim as any;

    // Check DimensionManager style refs first
    if (
      d.ref1?.entityId === entityId ||
      d.ref2?.entityId === entityId ||
      d.ref3?.entityId === entityId
    ) {
      return true;
    }

    // Check legacy attachment fields
    return (
      dim.attachment1?.entityId === entityId ||
      dim.attachment2?.entityId === entityId ||
      dim.attachment3?.entityId === entityId
    );
  });
};

/**
 * Detach dimension from deleted entity
 * Converts associative dimension to dumb dimension (keeps current coordinates)
 * Supports both ref1/ref2/ref3 (DimensionManager style) and attachment1/attachment2/attachment3 (legacy)
 */
export const detachDimensionFromEntity = (
  dim: DimensionEntity,
  deletedEntityId: string
): DimensionEntity => {
  const updated = { ...dim } as any;

  // Clear DimensionManager style refs
  if (updated.ref1?.entityId === deletedEntityId) {
    delete updated.ref1;
  }
  if (updated.ref2?.entityId === deletedEntityId) {
    delete updated.ref2;
  }
  if (updated.ref3?.entityId === deletedEntityId) {
    delete updated.ref3;
  }

  // Clear legacy attachment fields
  if (dim.attachment1?.entityId === deletedEntityId) {
    delete updated.attachment1;
  }
  if (dim.attachment2?.entityId === deletedEntityId) {
    delete updated.attachment2;
  }
  if (dim.attachment3?.entityId === deletedEntityId) {
    delete updated.attachment3;
  }

  // If no attachments or refs left, mark as non-associative
  const hasAnyRef =
    updated.ref1 ||
    updated.ref2 ||
    updated.ref3 ||
    updated.attachment1 ||
    updated.attachment2 ||
    updated.attachment3;
  if (!hasAnyRef) {
    updated.isAssociative = false;
  }

  return updated as DimensionEntity;
};

/**
 * Create attachment from OSNAP result
 * Call this when user snaps to an entity point while creating dimension
 */
export const createAttachmentFromSnap = (
  entityId: string,
  pointIndex: number,
  snapType: DimensionAttachment["snapType"]
): DimensionAttachment => {
  return {
    entityId,
    pointIndex,
    snapType: snapType || "endpoint",
  };
};
