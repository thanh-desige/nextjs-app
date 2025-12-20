/**
 * EntityUtils - Pure utility functions cho Entity transformations
 *
 * TUÂN THỦ 3 ĐIỀU KIỆN:
 * - ĐK1: Functions này CHỈ được gọi từ Commands, KHÔNG từ UI trực tiếp
 * - ĐK2: Commands phải validate qua PropertySchema TRƯỚC khi gọi utils
 * - ĐK3: File đặt trong core/entities/ đúng cấu trúc
 *
 * Đặc điểm:
 * - Pure functions (no side effects)
 * - Immutable (return new objects)
 * - Dễ test
 */

import {
  UnifiedEntity,
  EntityGeometry,
  LineGeometry,
  PolylineGeometry,
  RectGeometry,
  CircleGeometry,
  TextGeometry,
  Point2D,
  BoundingBox,
  generateEntityId,
} from "./UnifiedEntity";

// ==================== Point Utilities ====================

/**
 * Calculate distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Translate a point
 */
export function translatePoint(
  point: Point2D,
  dx: number,
  dy: number
): Point2D {
  return { x: point.x + dx, y: point.y + dy };
}

/**
 * Rotate a point around a center
 */
export function rotatePoint(
  point: Point2D,
  angle: number,
  center: Point2D
): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Scale a point from a center
 */
export function scalePoint(
  point: Point2D,
  sx: number,
  sy: number,
  center: Point2D
): Point2D {
  return {
    x: center.x + (point.x - center.x) * sx,
    y: center.y + (point.y - center.y) * sy,
  };
}

/**
 * Mirror a point across a line defined by two points
 */
export function mirrorPoint(
  point: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D
): Point2D {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { ...point };

  // Normalize line direction
  const nx = dx / len;
  const ny = dy / len;

  // Vector from line start to point
  const px = point.x - lineStart.x;
  const py = point.y - lineStart.y;

  // Project point onto line
  const dot = px * nx + py * ny;
  const projX = lineStart.x + dot * nx;
  const projY = lineStart.y + dot * ny;

  // Mirror = point + 2 * (projection - point)
  return {
    x: 2 * projX - point.x,
    y: 2 * projY - point.y,
  };
}

// ==================== Geometry Transform Functions ====================

/**
 * Translate geometry
 */
export function translateGeometry<G extends EntityGeometry>(
  geometry: G,
  dx: number,
  dy: number
): G {
  switch (geometry.type) {
    case "LINE":
      return {
        ...geometry,
        start: translatePoint(geometry.start, dx, dy),
        end: translatePoint(geometry.end, dx, dy),
      } as G;

    case "POLYLINE":
      return {
        ...geometry,
        points: geometry.points.map((p) => translatePoint(p, dx, dy)),
      } as G;

    case "RECT":
      return {
        ...geometry,
        origin: translatePoint(geometry.origin, dx, dy),
      } as G;

    case "CIRCLE":
      return {
        ...geometry,
        center: translatePoint(geometry.center, dx, dy),
      } as G;

    case "ARC":
      return {
        ...geometry,
        center: translatePoint(geometry.center, dx, dy),
      } as G;

    case "ELLIPSE":
      return {
        ...geometry,
        center: translatePoint(geometry.center, dx, dy),
      } as G;

    case "TEXT":
      return {
        ...geometry,
        position: translatePoint(geometry.position, dx, dy),
      } as G;

    default:
      return geometry;
  }
}

/**
 * Rotate geometry around a center point
 */
export function rotateGeometry<G extends EntityGeometry>(
  geometry: G,
  angle: number,
  center: Point2D
): G {
  switch (geometry.type) {
    case "LINE":
      return {
        ...geometry,
        start: rotatePoint(geometry.start, angle, center),
        end: rotatePoint(geometry.end, angle, center),
      } as G;

    case "POLYLINE":
      return {
        ...geometry,
        points: geometry.points.map((p) => rotatePoint(p, angle, center)),
      } as G;

    case "RECT":
      return {
        ...geometry,
        origin: rotatePoint(geometry.origin, angle, center),
        rotation: geometry.rotation + angle,
      } as G;

    case "CIRCLE":
      return {
        ...geometry,
        center: rotatePoint(geometry.center, angle, center),
      } as G;

    case "ARC":
      return {
        ...geometry,
        center: rotatePoint(geometry.center, angle, center),
        startAngle: geometry.startAngle + angle,
        endAngle: geometry.endAngle + angle,
      } as G;

    case "ELLIPSE":
      return {
        ...geometry,
        center: rotatePoint(geometry.center, angle, center),
        rotation: geometry.rotation + angle,
      } as G;

    case "TEXT":
      return {
        ...geometry,
        position: rotatePoint(geometry.position, angle, center),
        rotation: (geometry as TextGeometry).rotation + angle,
      } as G;

    default:
      return geometry;
  }
}

/**
 * Scale geometry from a center point
 */
export function scaleGeometry<G extends EntityGeometry>(
  geometry: G,
  sx: number,
  sy: number,
  center: Point2D
): G {
  // For uniform scale
  const uniformScale = sx;

  switch (geometry.type) {
    case "LINE":
      return {
        ...geometry,
        start: scalePoint(geometry.start, sx, sy, center),
        end: scalePoint(geometry.end, sx, sy, center),
      } as G;

    case "POLYLINE":
      return {
        ...geometry,
        points: geometry.points.map((p) => scalePoint(p, sx, sy, center)),
      } as G;

    case "RECT":
      return {
        ...geometry,
        origin: scalePoint(geometry.origin, sx, sy, center),
        width: geometry.width * Math.abs(sx),
        height: geometry.height * Math.abs(sy),
      } as G;

    case "CIRCLE":
      return {
        ...geometry,
        center: scalePoint(geometry.center, sx, sy, center),
        radius: geometry.radius * uniformScale,
      } as G;

    case "ARC":
      return {
        ...geometry,
        center: scalePoint(geometry.center, sx, sy, center),
        radius: geometry.radius * uniformScale,
      } as G;

    case "ELLIPSE":
      return {
        ...geometry,
        center: scalePoint(geometry.center, sx, sy, center),
        majorRadius: geometry.majorRadius * Math.abs(sx),
        minorRadius: geometry.minorRadius * Math.abs(sy),
      } as G;

    case "TEXT":
      return {
        ...geometry,
        position: scalePoint(geometry.position, sx, sy, center),
        fontSize: (geometry as TextGeometry).fontSize * uniformScale,
      } as G;

    default:
      return geometry;
  }
}

/**
 * Mirror geometry across a line
 */
export function mirrorGeometry<G extends EntityGeometry>(
  geometry: G,
  lineStart: Point2D,
  lineEnd: Point2D
): G {
  // Calculate mirror angle for rotation adjustments
  const mirrorAngle = Math.atan2(
    lineEnd.y - lineStart.y,
    lineEnd.x - lineStart.x
  );

  switch (geometry.type) {
    case "LINE":
      return {
        ...geometry,
        start: mirrorPoint(geometry.start, lineStart, lineEnd),
        end: mirrorPoint(geometry.end, lineStart, lineEnd),
      } as G;

    case "POLYLINE":
      return {
        ...geometry,
        points: geometry.points.map((p) => mirrorPoint(p, lineStart, lineEnd)),
      } as G;

    case "RECT": {
      // Mirror the corner points properly
      const corners = getRectCorners(geometry);
      const mirroredCorners = corners.map((c) =>
        mirrorPoint(c, lineStart, lineEnd)
      );
      // Recalculate origin from mirrored corners
      const minX = Math.min(...mirroredCorners.map((c) => c.x));
      const minY = Math.min(...mirroredCorners.map((c) => c.y));
      return {
        ...geometry,
        origin: { x: minX, y: minY },
        rotation: 2 * mirrorAngle - geometry.rotation,
      } as G;
    }

    case "CIRCLE":
      return {
        ...geometry,
        center: mirrorPoint(geometry.center, lineStart, lineEnd),
      } as G;

    case "ARC":
      return {
        ...geometry,
        center: mirrorPoint(geometry.center, lineStart, lineEnd),
        startAngle: 2 * mirrorAngle - geometry.endAngle,
        endAngle: 2 * mirrorAngle - geometry.startAngle,
      } as G;

    case "ELLIPSE":
      return {
        ...geometry,
        center: mirrorPoint(geometry.center, lineStart, lineEnd),
        rotation: 2 * mirrorAngle - geometry.rotation,
      } as G;

    case "TEXT":
      return {
        ...geometry,
        position: mirrorPoint(geometry.position, lineStart, lineEnd),
        rotation: 2 * mirrorAngle - (geometry as TextGeometry).rotation,
      } as G;

    default:
      return geometry;
  }
}

/**
 * Offset geometry by a distance
 * throughPoint determines which side to offset
 */
export function offsetGeometry<G extends EntityGeometry>(
  geometry: G,
  distance: number,
  throughPoint: Point2D
): G | null {
  switch (geometry.type) {
    case "LINE":
      return offsetLineGeometry(geometry, distance, throughPoint) as G | null;

    case "POLYLINE":
      return offsetPolylineGeometry(
        geometry,
        distance,
        throughPoint
      ) as G | null;

    case "RECT":
      return offsetRectGeometry(geometry, distance, throughPoint) as G | null;

    case "CIRCLE":
      return offsetCircleGeometry(geometry, distance, throughPoint) as G | null;

    default:
      return null;
  }
}

// ==================== Offset Helper Functions ====================

function offsetLineGeometry(
  geometry: LineGeometry,
  dist: number,
  throughPoint: Point2D
): LineGeometry {
  const dx = geometry.end.x - geometry.start.x;
  const dy = geometry.end.y - geometry.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { ...geometry };

  // Perpendicular vector
  const perpX = -dy / len;
  const perpY = dx / len;

  // Determine side based on throughPoint
  const midX = (geometry.start.x + geometry.end.x) / 2;
  const midY = (geometry.start.y + geometry.end.y) / 2;
  const toThroughX = throughPoint.x - midX;
  const toThroughY = throughPoint.y - midY;
  const side = toThroughX * perpX + toThroughY * perpY > 0 ? 1 : -1;

  const offsetX = perpX * dist * side;
  const offsetY = perpY * dist * side;

  return {
    type: "LINE",
    start: { x: geometry.start.x + offsetX, y: geometry.start.y + offsetY },
    end: { x: geometry.end.x + offsetX, y: geometry.end.y + offsetY },
  };
}

function offsetPolylineGeometry(
  geometry: PolylineGeometry,
  dist: number,
  throughPoint: Point2D
): PolylineGeometry {
  const points = geometry.points;
  if (points.length < 2) return { ...geometry };

  // Calculate center
  let centerX = 0,
    centerY = 0;
  for (const p of points) {
    centerX += p.x;
    centerY += p.y;
  }
  centerX /= points.length;
  centerY /= points.length;

  const toThroughX = throughPoint.x - centerX;
  const toThroughY = throughPoint.y - centerY;

  const offsetPoints: Point2D[] = [];

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

    const side = toThroughX * perpX + toThroughY * perpY > 0 ? 1 : -1;

    offsetPoints.push({
      x: points[i].x + perpX * dist * side,
      y: points[i].y + perpY * dist * side,
    });
  }

  return {
    type: "POLYLINE",
    points: offsetPoints,
    closed: geometry.closed,
  };
}

function offsetRectGeometry(
  geometry: RectGeometry,
  dist: number,
  throughPoint: Point2D
): RectGeometry {
  // Check if throughPoint is outside rect
  const isOutside =
    throughPoint.x < geometry.origin.x ||
    throughPoint.x > geometry.origin.x + geometry.width ||
    throughPoint.y < geometry.origin.y ||
    throughPoint.y > geometry.origin.y + geometry.height;

  const expand = isOutside ? 1 : -1;

  return {
    type: "RECT",
    origin: {
      x: geometry.origin.x - dist * expand,
      y: geometry.origin.y - dist * expand,
    },
    width: Math.max(0.1, geometry.width + 2 * dist * expand),
    height: Math.max(0.1, geometry.height + 2 * dist * expand),
    rotation: geometry.rotation,
  };
}

function offsetCircleGeometry(
  geometry: CircleGeometry,
  dist: number,
  throughPoint: Point2D
): CircleGeometry {
  const distToCenter = Math.sqrt(
    Math.pow(throughPoint.x - geometry.center.x, 2) +
      Math.pow(throughPoint.y - geometry.center.y, 2)
  );

  const isOutside = distToCenter > geometry.radius;
  const newRadius = isOutside
    ? geometry.radius + dist
    : Math.max(0.1, geometry.radius - dist);

  return {
    type: "CIRCLE",
    center: { ...geometry.center },
    radius: newRadius,
  };
}

// ==================== Entity Transform Functions ====================

/**
 * Clone an entity with a new ID
 */
export function cloneEntity<G extends EntityGeometry>(
  entity: UnifiedEntity<G>
): UnifiedEntity<G> {
  return {
    ...entity,
    id: generateEntityId(),
    geometry: { ...entity.geometry } as G,
    style: { ...entity.style },
    state: { ...entity.state, selected: false, hovered: false },
    metadata: entity.metadata ? { ...entity.metadata } : undefined,
  };
}

/**
 * Translate an entity
 */
export function translateEntity<G extends EntityGeometry>(
  entity: UnifiedEntity<G>,
  dx: number,
  dy: number
): UnifiedEntity<G> {
  return {
    ...entity,
    geometry: translateGeometry(entity.geometry, dx, dy),
  };
}

/**
 * Rotate an entity around a center
 */
export function rotateEntity<G extends EntityGeometry>(
  entity: UnifiedEntity<G>,
  angle: number,
  center: Point2D
): UnifiedEntity<G> {
  return {
    ...entity,
    geometry: rotateGeometry(entity.geometry, angle, center),
  };
}

/**
 * Scale an entity from a center (uniform scale)
 */
export function scaleEntity<G extends EntityGeometry>(
  entity: UnifiedEntity<G>,
  scale: number,
  center: Point2D
): UnifiedEntity<G> {
  return {
    ...entity,
    geometry: scaleGeometry(entity.geometry, scale, scale, center),
  };
}

/**
 * Mirror an entity across a line
 */
export function mirrorEntity<G extends EntityGeometry>(
  entity: UnifiedEntity<G>,
  lineStart: Point2D,
  lineEnd: Point2D
): UnifiedEntity<G> {
  return {
    ...entity,
    id: generateEntityId(), // Mirror creates a new entity
    geometry: mirrorGeometry(entity.geometry, lineStart, lineEnd),
    state: { ...entity.state, selected: false, hovered: false },
  };
}

/**
 * Offset an entity
 */
export function offsetEntity<G extends EntityGeometry>(
  entity: UnifiedEntity<G>,
  distance: number,
  throughPoint: Point2D
): UnifiedEntity<G> | null {
  const newGeometry = offsetGeometry(entity.geometry, distance, throughPoint);
  if (!newGeometry) return null;

  return {
    ...entity,
    id: generateEntityId(),
    geometry: newGeometry,
    state: { ...entity.state, selected: false, hovered: false },
  };
}

// ==================== Bounding Box Functions ====================

/**
 * Get bounding box of geometry
 */
export function getGeometryBounds(geometry: EntityGeometry): BoundingBox {
  switch (geometry.type) {
    case "LINE":
      return {
        min: {
          x: Math.min(geometry.start.x, geometry.end.x),
          y: Math.min(geometry.start.y, geometry.end.y),
        },
        max: {
          x: Math.max(geometry.start.x, geometry.end.x),
          y: Math.max(geometry.start.y, geometry.end.y),
        },
      };

    case "POLYLINE": {
      const xs = geometry.points.map((p) => p.x);
      const ys = geometry.points.map((p) => p.y);
      return {
        min: { x: Math.min(...xs), y: Math.min(...ys) },
        max: { x: Math.max(...xs), y: Math.max(...ys) },
      };
    }

    case "RECT": {
      const corners = getRectCorners(geometry);
      const xs = corners.map((c) => c.x);
      const ys = corners.map((c) => c.y);
      return {
        min: { x: Math.min(...xs), y: Math.min(...ys) },
        max: { x: Math.max(...xs), y: Math.max(...ys) },
      };
    }

    case "CIRCLE":
      return {
        min: {
          x: geometry.center.x - geometry.radius,
          y: geometry.center.y - geometry.radius,
        },
        max: {
          x: geometry.center.x + geometry.radius,
          y: geometry.center.y + geometry.radius,
        },
      };

    case "ARC":
      // Simplified - use circle bounds
      return {
        min: {
          x: geometry.center.x - geometry.radius,
          y: geometry.center.y - geometry.radius,
        },
        max: {
          x: geometry.center.x + geometry.radius,
          y: geometry.center.y + geometry.radius,
        },
      };

    case "ELLIPSE":
      // Simplified - use major radius for both
      const maxRadius = Math.max(geometry.majorRadius, geometry.minorRadius);
      return {
        min: {
          x: geometry.center.x - maxRadius,
          y: geometry.center.y - maxRadius,
        },
        max: {
          x: geometry.center.x + maxRadius,
          y: geometry.center.y + maxRadius,
        },
      };

    case "TEXT":
      // Approximate text bounds
      const textWidth = geometry.text.length * geometry.fontSize * 0.6;
      const textHeight = geometry.fontSize;
      return {
        min: geometry.position,
        max: {
          x: geometry.position.x + textWidth,
          y: geometry.position.y + textHeight,
        },
      };

    default:
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  }
}

/**
 * Get bounding box of an entity
 */
export function getEntityBounds(entity: UnifiedEntity): BoundingBox {
  return getGeometryBounds(entity.geometry);
}

/**
 * Get center point of an entity
 */
export function getEntityCenter(entity: UnifiedEntity): Point2D {
  const bounds = getEntityBounds(entity);
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
  };
}

// ==================== Helper Functions ====================

/**
 * Get corners of a rectangle (considering rotation)
 */
function getRectCorners(geometry: RectGeometry): Point2D[] {
  const { origin, width, height, rotation } = geometry;

  // Calculate corners without rotation
  const corners: Point2D[] = [
    { x: origin.x, y: origin.y },
    { x: origin.x + width, y: origin.y },
    { x: origin.x + width, y: origin.y + height },
    { x: origin.x, y: origin.y + height },
  ];

  // Rotate if needed
  if (rotation !== 0) {
    const center = {
      x: origin.x + width / 2,
      y: origin.y + height / 2,
    };
    return corners.map((c) => rotatePoint(c, rotation, center));
  }

  return corners;
}

// ==================== Hit Testing ====================

/**
 * Check if a point is near the geometry (within tolerance)
 */
export function hitTestGeometry(
  geometry: EntityGeometry,
  point: Point2D,
  tolerance: number
): boolean {
  switch (geometry.type) {
    case "LINE":
      return (
        distanceToLineSegment(point, geometry.start, geometry.end) <= tolerance
      );

    case "POLYLINE":
      for (let i = 0; i < geometry.points.length - 1; i++) {
        if (
          distanceToLineSegment(
            point,
            geometry.points[i],
            geometry.points[i + 1]
          ) <= tolerance
        ) {
          return true;
        }
      }
      return false;

    case "RECT": {
      const corners = getRectCorners(geometry);
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        if (
          distanceToLineSegment(point, corners[i], corners[next]) <= tolerance
        ) {
          return true;
        }
      }
      return false;
    }

    case "CIRCLE": {
      const distToCenter = distance(point, geometry.center);
      return Math.abs(distToCenter - geometry.radius) <= tolerance;
    }

    case "ARC": {
      const distToCenter = distance(point, geometry.center);
      if (Math.abs(distToCenter - geometry.radius) > tolerance) return false;
      // Check if angle is within arc range
      const angle = Math.atan2(
        point.y - geometry.center.y,
        point.x - geometry.center.x
      );
      return isAngleInRange(angle, geometry.startAngle, geometry.endAngle);
    }

    default:
      return false;
  }
}

/**
 * Check if a point hits an entity
 */
export function hitTestEntity(
  entity: UnifiedEntity,
  point: Point2D,
  tolerance: number
): boolean {
  return hitTestGeometry(entity.geometry, point, tolerance);
}

// ==================== Internal Helpers ====================

function distanceToLineSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;

  if (len2 === 0) return distance(p, a);

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));

  const nearest = { x: a.x + t * dx, y: a.y + t * dy };
  return distance(p, nearest);
}

function isAngleInRange(angle: number, start: number, end: number): boolean {
  // Normalize angles to [0, 2π]
  const normalize = (a: number) =>
    ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const normAngle = normalize(angle);
  const normStart = normalize(start);
  const normEnd = normalize(end);

  if (normStart <= normEnd) {
    return normAngle >= normStart && normAngle <= normEnd;
  } else {
    return normAngle >= normStart || normAngle <= normEnd;
  }
}
