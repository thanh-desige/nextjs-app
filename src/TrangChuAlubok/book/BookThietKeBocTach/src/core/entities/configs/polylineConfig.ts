/**
 * polylineConfig — EntityConfig for POLYLINE entities.
 *
 * STEP-3.6: Polyline entity config.
 * POLYLINE geometry: { type: 'POLYLINE', points: Point2D[], closed: boolean }
 *
 * All transforms are IMMUTABLE — return new geometry objects.
 * Self-contained: includes all math needed for polyline operations.
 */

import type {
  EntityConfig,
  EntityGripPoint,
  Point2D,
} from "../EntityData.types";
import type { BoundingBox, UnifiedEntity } from "../UnifiedEntity";
import {
  PolylineGeometry,
  UnifiedEntityType,
  DEFAULT_STYLE,
  DEFAULT_STATE,
  generateEntityId,
} from "../UnifiedEntity";
import type { EntityStyle } from "../UnifiedEntity";

// ==================== Point Math Helpers ====================

function translatePoint(p: Point2D, dx: number, dy: number): Point2D {
  return { x: p.x + dx, y: p.y + dy };
}

function rotatePoint(p: Point2D, angle: number, center: Point2D): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function scalePoint(
  p: Point2D,
  sx: number,
  sy: number,
  center: Point2D,
): Point2D {
  return {
    x: center.x + (p.x - center.x) * sx,
    y: center.y + (p.y - center.y) * sy,
  };
}

function mirrorPoint(
  p: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D,
): Point2D {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { ...p };

  const nx = dx / Math.sqrt(len2);
  const ny = dy / Math.sqrt(len2);

  const px = p.x - lineStart.x;
  const py = p.y - lineStart.y;

  const dot = px * nx + py * ny;
  const projX = lineStart.x + dot * nx;
  const projY = lineStart.y + dot * ny;

  return {
    x: 2 * projX - p.x,
    y: 2 * projY - p.y,
  };
}

function midpoint(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ==================== Polyline Helpers ====================

/** Distance from point to line segment */
function distanceToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const nearest = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.sqrt((p.x - nearest.x) ** 2 + (p.y - nearest.y) ** 2);
}

/** Check if point is inside polygon (ray-casting) */
function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;
    if (yi > point.y !== yj > point.y) {
      const intersectX = ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (point.x < intersectX) inside = !inside;
    }
  }
  return inside;
}

/** Get segment count */
function getSegmentCount(g: PolylineGeometry): number {
  if (g.points.length < 2) return 0;
  return g.closed ? g.points.length : g.points.length - 1;
}

// ==================== Polyline Config ====================

export const polylineConfig: EntityConfig<PolylineGeometry> = {
  type: "POLYLINE",

  // ==================== Factory ====================

  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<PolylineGeometry> {
    const points = params.points as Point2D[];
    const closed = (params.closed as boolean) ?? false;

    if (!points || !Array.isArray(points)) {
      throw new Error("polylineConfig.create requires 'points' (Point2D[])");
    }

    return {
      id: generateEntityId(),
      entityType: UnifiedEntityType.POLYLINE,
      geometry: {
        type: "POLYLINE",
        points: points.map((p) => ({ x: p.x, y: p.y })),
        closed,
      },
      style: { ...DEFAULT_STYLE, ...style },
      state: { ...DEFAULT_STATE },
      layerId: (params.layerId as string) ?? "default",
      name: params.name as string | undefined,
    };
  },

  // ==================== Transforms ====================

  translate(
    geometry: PolylineGeometry,
    dx: number,
    dy: number,
  ): PolylineGeometry {
    return {
      type: "POLYLINE",
      points: geometry.points.map((p) => translatePoint(p, dx, dy)),
      closed: geometry.closed,
    };
  },

  rotate(
    geometry: PolylineGeometry,
    angle: number,
    center: Point2D,
  ): PolylineGeometry {
    return {
      type: "POLYLINE",
      points: geometry.points.map((p) => rotatePoint(p, angle, center)),
      closed: geometry.closed,
    };
  },

  scale(
    geometry: PolylineGeometry,
    sx: number,
    sy: number,
    center: Point2D,
  ): PolylineGeometry {
    return {
      type: "POLYLINE",
      points: geometry.points.map((p) => scalePoint(p, sx, sy, center)),
      closed: geometry.closed,
    };
  },

  mirror(
    geometry: PolylineGeometry,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): PolylineGeometry {
    return {
      type: "POLYLINE",
      points: geometry.points.map((p) => mirrorPoint(p, axisStart, axisEnd)),
      closed: geometry.closed,
    };
  },

  // ==================== Queries ====================

  containsPoint(
    geometry: PolylineGeometry,
    point: Point2D,
    tolerance: number,
  ): boolean {
    // If closed polygon, check inside
    if (geometry.closed && geometry.points.length >= 3) {
      if (isPointInPolygon(point, geometry.points)) return true;
    }

    // Check on segments
    const segCount = getSegmentCount(geometry);
    for (let i = 0; i < segCount; i++) {
      const start = geometry.points[i];
      const end = geometry.points[(i + 1) % geometry.points.length];
      if (distanceToSegment(point, start, end) <= tolerance) return true;
    }

    return false;
  },

  getBounds(geometry: PolylineGeometry): BoundingBox {
    if (geometry.points.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of geometry.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  },

  getGripPoints(
    geometry: PolylineGeometry,
    _entityId: string,
  ): EntityGripPoint[] {
    const grips: EntityGripPoint[] = [];

    // Grip at each vertex
    geometry.points.forEach((p, i) => {
      grips.push({
        position: { ...p },
        type: "endpoint",
        index: i,
      });
    });

    // Grip at segment midpoints
    const segCount = getSegmentCount(geometry);
    for (let i = 0; i < segCount; i++) {
      const start = geometry.points[i];
      const end = geometry.points[(i + 1) % geometry.points.length];
      grips.push({
        position: midpoint(start, end),
        type: "midpoint",
        index: geometry.points.length + i,
      });
    }

    return grips;
  },

  // ==================== Clone / Serialize ====================

  clone(
    entity: UnifiedEntity<PolylineGeometry>,
  ): UnifiedEntity<PolylineGeometry> {
    return {
      ...entity,
      id: generateEntityId(),
      geometry: {
        type: "POLYLINE",
        points: entity.geometry.points.map((p) => ({ ...p })),
        closed: entity.geometry.closed,
      },
      style: { ...entity.style },
      state: { ...entity.state, selected: false, hovered: false },
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  serialize(entity: UnifiedEntity<PolylineGeometry>): Record<string, unknown> {
    return {
      id: entity.id,
      entityType: entity.entityType,
      geometry: {
        type: entity.geometry.type,
        points: entity.geometry.points.map((p) => ({ ...p })),
        closed: entity.geometry.closed,
      },
      style: { ...entity.style },
      state: { ...entity.state },
      layerId: entity.layerId,
      name: entity.name,
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  deserialize(data: Record<string, unknown>): UnifiedEntity<PolylineGeometry> {
    const geometry = data.geometry as PolylineGeometry;
    return {
      id: data.id as string,
      entityType: data.entityType as UnifiedEntityType,
      geometry: {
        type: "POLYLINE",
        points: (geometry.points as Point2D[]).map((p) => ({ ...p })),
        closed: geometry.closed,
      },
      style: { ...DEFAULT_STYLE, ...(data.style as Partial<EntityStyle>) },
      state: { ...DEFAULT_STATE, ...(data.state as Record<string, unknown>) },
      layerId: (data.layerId as string) ?? "default",
      name: data.name as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  },
};
