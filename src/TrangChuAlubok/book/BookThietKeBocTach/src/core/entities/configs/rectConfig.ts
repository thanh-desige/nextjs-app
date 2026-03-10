/**
 * rectConfig — EntityConfig for RECT entities.
 *
 * STEP-3.2: Rectangle entity config.
 * RECT geometry: { type: 'RECT', origin: Point2D, width, height, rotation }
 *
 * All transforms are IMMUTABLE — return new geometry objects.
 * Self-contained: includes all math needed for rectangle operations.
 */

import type {
  EntityConfig,
  EntityGripPoint,
  Point2D,
} from "../EntityData.types";
import type { BoundingBox, UnifiedEntity } from "../UnifiedEntity";
import {
  RectGeometry,
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

// ==================== Rect Helpers ====================

/** Get 4 corners of rect in world space (accounting for rotation) */
function getCorners(g: RectGeometry): [Point2D, Point2D, Point2D, Point2D] {
  const local: Point2D[] = [
    { x: 0, y: 0 },
    { x: g.width, y: 0 },
    { x: g.width, y: g.height },
    { x: 0, y: g.height },
  ];

  if (g.rotation === 0) {
    return local.map((p) => ({
      x: p.x + g.origin.x,
      y: p.y + g.origin.y,
    })) as [Point2D, Point2D, Point2D, Point2D];
  }

  const cos = Math.cos(g.rotation);
  const sin = Math.sin(g.rotation);
  return local.map((p) => ({
    x: g.origin.x + p.x * cos - p.y * sin,
    y: g.origin.y + p.x * sin + p.y * cos,
  })) as [Point2D, Point2D, Point2D, Point2D];
}

/** Get center of rect */
function getCenter(g: RectGeometry): Point2D {
  const corners = getCorners(g);
  return {
    x: (corners[0].x + corners[2].x) / 2,
    y: (corners[0].y + corners[2].y) / 2,
  };
}

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

/** Check if point is inside polygon */
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

// ==================== Rect Config ====================

export const rectConfig: EntityConfig<RectGeometry> = {
  type: "RECT",

  // ==================== Factory ====================

  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<RectGeometry> {
    const origin = params.origin as Point2D;
    const width = params.width as number;
    const height = params.height as number;
    const rotation = (params.rotation as number) ?? 0;

    if (!origin || width == null || height == null) {
      throw new Error(
        "rectConfig.create requires 'origin' (Point2D), 'width', and 'height'",
      );
    }

    return {
      id: generateEntityId(),
      entityType: UnifiedEntityType.RECT,
      geometry: {
        type: "RECT",
        origin: { x: origin.x, y: origin.y },
        width,
        height,
        rotation,
      },
      style: { ...DEFAULT_STYLE, ...style },
      state: { ...DEFAULT_STATE },
      layerId: (params.layerId as string) ?? "default",
      name: params.name as string | undefined,
    };
  },

  // ==================== Transforms ====================

  translate(geometry: RectGeometry, dx: number, dy: number): RectGeometry {
    return {
      ...geometry,
      type: "RECT",
      origin: translatePoint(geometry.origin, dx, dy),
    };
  },

  rotate(geometry: RectGeometry, angle: number, center: Point2D): RectGeometry {
    return {
      ...geometry,
      type: "RECT",
      origin: rotatePoint(geometry.origin, angle, center),
      rotation: geometry.rotation + angle,
    };
  },

  scale(
    geometry: RectGeometry,
    sx: number,
    sy: number,
    center: Point2D,
  ): RectGeometry {
    return {
      type: "RECT",
      origin: scalePoint(geometry.origin, sx, sy, center),
      width: geometry.width * Math.abs(sx),
      height: geometry.height * Math.abs(sy),
      rotation: geometry.rotation,
    };
  },

  mirror(
    geometry: RectGeometry,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): RectGeometry {
    // Mirror origin
    const newOrigin = mirrorPoint(geometry.origin, axisStart, axisEnd);
    // Mirror flips the rotation: mirrored angle = π - rotation relative to axis
    const axisDx = axisEnd.x - axisStart.x;
    const axisDy = axisEnd.y - axisStart.y;
    const axisAngle = Math.atan2(axisDy, axisDx);
    const newRotation = 2 * axisAngle - geometry.rotation;

    return {
      type: "RECT",
      origin: newOrigin,
      width: geometry.width,
      height: geometry.height,
      rotation: newRotation,
    };
  },

  // ==================== Queries ====================

  containsPoint(
    geometry: RectGeometry,
    point: Point2D,
    tolerance: number,
  ): boolean {
    const corners = getCorners(geometry);

    // Check if filled (check inside polygon)
    if (isPointInPolygon(point, corners)) return true;

    // Check on edges
    for (let i = 0; i < 4; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 4];
      if (distanceToSegment(point, a, b) <= tolerance) return true;
    }

    return false;
  },

  getBounds(geometry: RectGeometry): BoundingBox {
    const corners = getCorners(geometry);
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const c of corners) {
      if (c.x < minX) minX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.x > maxX) maxX = c.x;
      if (c.y > maxY) maxY = c.y;
    }
    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  },

  getGripPoints(geometry: RectGeometry, _entityId: string): EntityGripPoint[] {
    const corners = getCorners(geometry);
    const center = getCenter(geometry);

    return [
      // 4 corners
      { position: { ...corners[0] }, type: "endpoint", index: 0 },
      { position: { ...corners[1] }, type: "endpoint", index: 1 },
      { position: { ...corners[2] }, type: "endpoint", index: 2 },
      { position: { ...corners[3] }, type: "endpoint", index: 3 },
      // 4 edge midpoints
      {
        position: midpoint(corners[0], corners[1]),
        type: "midpoint",
        index: 4,
      },
      {
        position: midpoint(corners[1], corners[2]),
        type: "midpoint",
        index: 5,
      },
      {
        position: midpoint(corners[2], corners[3]),
        type: "midpoint",
        index: 6,
      },
      {
        position: midpoint(corners[3], corners[0]),
        type: "midpoint",
        index: 7,
      },
      // Center
      { position: center, type: "center", index: 8 },
    ];
  },

  // ==================== Clone / Serialize ====================

  clone(entity: UnifiedEntity<RectGeometry>): UnifiedEntity<RectGeometry> {
    return {
      ...entity,
      id: generateEntityId(),
      geometry: {
        type: "RECT",
        origin: { ...entity.geometry.origin },
        width: entity.geometry.width,
        height: entity.geometry.height,
        rotation: entity.geometry.rotation,
      },
      style: { ...entity.style },
      state: { ...entity.state, selected: false, hovered: false },
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  serialize(entity: UnifiedEntity<RectGeometry>): Record<string, unknown> {
    return {
      id: entity.id,
      entityType: entity.entityType,
      geometry: {
        type: entity.geometry.type,
        origin: { ...entity.geometry.origin },
        width: entity.geometry.width,
        height: entity.geometry.height,
        rotation: entity.geometry.rotation,
      },
      style: { ...entity.style },
      state: { ...entity.state },
      layerId: entity.layerId,
      name: entity.name,
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  deserialize(data: Record<string, unknown>): UnifiedEntity<RectGeometry> {
    const geometry = data.geometry as RectGeometry;
    return {
      id: data.id as string,
      entityType: data.entityType as UnifiedEntityType,
      geometry: {
        type: "RECT",
        origin: { ...(geometry.origin as Point2D) },
        width: geometry.width,
        height: geometry.height,
        rotation: geometry.rotation,
      },
      style: { ...DEFAULT_STYLE, ...(data.style as Partial<EntityStyle>) },
      state: { ...DEFAULT_STATE, ...(data.state as Record<string, unknown>) },
      layerId: (data.layerId as string) ?? "default",
      name: data.name as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  },
};
