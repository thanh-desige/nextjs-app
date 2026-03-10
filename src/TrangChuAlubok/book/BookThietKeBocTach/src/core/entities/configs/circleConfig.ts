/**
 * circleConfig — EntityConfig for CIRCLE entities.
 *
 * STEP-3.3: Circle entity config.
 * CIRCLE geometry: { type: 'CIRCLE', center: Point2D, radius: number }
 *
 * All transforms are IMMUTABLE — return new geometry objects.
 * Self-contained: includes all math needed for circle operations.
 */

import type {
  EntityConfig,
  EntityGripPoint,
  Point2D,
} from "../EntityData.types";
import type { BoundingBox, UnifiedEntity } from "../UnifiedEntity";
import {
  CircleGeometry,
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

// ==================== Circle Config ====================

export const circleConfig: EntityConfig<CircleGeometry> = {
  type: "CIRCLE",

  // ==================== Factory ====================

  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<CircleGeometry> {
    const center = params.center as Point2D;
    const radius = params.radius as number;

    if (!center || radius == null) {
      throw new Error(
        "circleConfig.create requires 'center' (Point2D) and 'radius' (number)",
      );
    }

    return {
      id: generateEntityId(),
      entityType: UnifiedEntityType.CIRCLE,
      geometry: {
        type: "CIRCLE",
        center: { x: center.x, y: center.y },
        radius,
      },
      style: { ...DEFAULT_STYLE, ...style },
      state: { ...DEFAULT_STATE },
      layerId: (params.layerId as string) ?? "default",
      name: params.name as string | undefined,
    };
  },

  // ==================== Transforms ====================

  translate(geometry: CircleGeometry, dx: number, dy: number): CircleGeometry {
    return {
      type: "CIRCLE",
      center: translatePoint(geometry.center, dx, dy),
      radius: geometry.radius,
    };
  },

  rotate(
    geometry: CircleGeometry,
    angle: number,
    center: Point2D,
  ): CircleGeometry {
    return {
      type: "CIRCLE",
      center: rotatePoint(geometry.center, angle, center),
      radius: geometry.radius,
    };
  },

  scale(
    geometry: CircleGeometry,
    sx: number,
    sy: number,
    center: Point2D,
  ): CircleGeometry {
    return {
      type: "CIRCLE",
      center: scalePoint(geometry.center, sx, sy, center),
      // Scale radius with average of |sx|, |sy| (uniform for circle shape)
      radius: (geometry.radius * (Math.abs(sx) + Math.abs(sy))) / 2,
    };
  },

  mirror(
    geometry: CircleGeometry,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): CircleGeometry {
    return {
      type: "CIRCLE",
      center: mirrorPoint(geometry.center, axisStart, axisEnd),
      radius: geometry.radius,
    };
  },

  // ==================== Queries ====================

  containsPoint(
    geometry: CircleGeometry,
    point: Point2D,
    tolerance: number,
  ): boolean {
    const dx = point.x - geometry.center.x;
    const dy = point.y - geometry.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Point on stroke: |distance - radius| <= tolerance
    return Math.abs(dist - geometry.radius) <= tolerance;
  },

  getBounds(geometry: CircleGeometry): BoundingBox {
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
  },

  getGripPoints(
    geometry: CircleGeometry,
    _entityId: string,
  ): EntityGripPoint[] {
    const { center, radius } = geometry;
    return [
      // Center
      { position: { ...center }, type: "center", index: 0 },
      // East (right)
      {
        position: { x: center.x + radius, y: center.y },
        type: "quadrant",
        index: 1,
      },
      // North (top)
      {
        position: { x: center.x, y: center.y + radius },
        type: "quadrant",
        index: 2,
      },
      // West (left)
      {
        position: { x: center.x - radius, y: center.y },
        type: "quadrant",
        index: 3,
      },
      // South (bottom)
      {
        position: { x: center.x, y: center.y - radius },
        type: "quadrant",
        index: 4,
      },
    ];
  },

  // ==================== Clone / Serialize ====================

  clone(entity: UnifiedEntity<CircleGeometry>): UnifiedEntity<CircleGeometry> {
    return {
      ...entity,
      id: generateEntityId(),
      geometry: {
        type: "CIRCLE",
        center: { ...entity.geometry.center },
        radius: entity.geometry.radius,
      },
      style: { ...entity.style },
      state: { ...entity.state, selected: false, hovered: false },
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  serialize(entity: UnifiedEntity<CircleGeometry>): Record<string, unknown> {
    return {
      id: entity.id,
      entityType: entity.entityType,
      geometry: {
        type: entity.geometry.type,
        center: { ...entity.geometry.center },
        radius: entity.geometry.radius,
      },
      style: { ...entity.style },
      state: { ...entity.state },
      layerId: entity.layerId,
      name: entity.name,
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  deserialize(data: Record<string, unknown>): UnifiedEntity<CircleGeometry> {
    const geometry = data.geometry as CircleGeometry;
    return {
      id: data.id as string,
      entityType: data.entityType as UnifiedEntityType,
      geometry: {
        type: "CIRCLE",
        center: { ...(geometry.center as Point2D) },
        radius: geometry.radius,
      },
      style: { ...DEFAULT_STYLE, ...(data.style as Partial<EntityStyle>) },
      state: { ...DEFAULT_STATE, ...(data.state as Record<string, unknown>) },
      layerId: (data.layerId as string) ?? "default",
      name: data.name as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  },
};
