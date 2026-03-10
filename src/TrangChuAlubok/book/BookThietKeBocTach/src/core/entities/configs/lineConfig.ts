/**
 * lineConfig — EntityConfig for LINE entities.
 *
 * STEP-3.1: First entity config implementation.
 * Validates the EntityRegistry pattern before migrating other types.
 *
 * LINE geometry: { type: 'LINE', start: Point2D, end: Point2D }
 *
 * All transforms are IMMUTABLE — return new geometry objects.
 * Self-contained: includes all math needed for line operations.
 */

import type {
  EntityConfig,
  EntityGripPoint,
  Point2D,
} from "../EntityData.types";
import type { BoundingBox, UnifiedEntity } from "../UnifiedEntity";
import {
  LineGeometry,
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

function distanceToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const nearest = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.sqrt((p.x - nearest.x) ** 2 + (p.y - nearest.y) ** 2);
}

function midpoint(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ==================== Line Config ====================

export const lineConfig: EntityConfig<LineGeometry> = {
  type: "LINE",

  // ==================== Factory ====================

  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<LineGeometry> {
    const start = params.start as Point2D;
    const end = params.end as Point2D;

    if (!start || !end) {
      throw new Error(
        "lineConfig.create requires 'start' and 'end' Point2D params",
      );
    }

    return {
      id: generateEntityId(),
      entityType: UnifiedEntityType.LINE,
      geometry: {
        type: "LINE",
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
      },
      style: { ...DEFAULT_STYLE, ...style },
      state: { ...DEFAULT_STATE },
      layerId: (params.layerId as string) ?? "default",
      name: params.name as string | undefined,
    };
  },

  // ==================== Transforms ====================

  translate(geometry: LineGeometry, dx: number, dy: number): LineGeometry {
    return {
      type: "LINE",
      start: translatePoint(geometry.start, dx, dy),
      end: translatePoint(geometry.end, dx, dy),
    };
  },

  rotate(geometry: LineGeometry, angle: number, center: Point2D): LineGeometry {
    return {
      type: "LINE",
      start: rotatePoint(geometry.start, angle, center),
      end: rotatePoint(geometry.end, angle, center),
    };
  },

  scale(
    geometry: LineGeometry,
    sx: number,
    sy: number,
    center: Point2D,
  ): LineGeometry {
    return {
      type: "LINE",
      start: scalePoint(geometry.start, sx, sy, center),
      end: scalePoint(geometry.end, sx, sy, center),
    };
  },

  mirror(
    geometry: LineGeometry,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): LineGeometry {
    return {
      type: "LINE",
      start: mirrorPoint(geometry.start, axisStart, axisEnd),
      end: mirrorPoint(geometry.end, axisStart, axisEnd),
    };
  },

  // ==================== Queries ====================

  containsPoint(
    geometry: LineGeometry,
    point: Point2D,
    tolerance: number,
  ): boolean {
    return distanceToSegment(point, geometry.start, geometry.end) <= tolerance;
  },

  getBounds(geometry: LineGeometry): BoundingBox {
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
  },

  getGripPoints(geometry: LineGeometry, _entityId: string): EntityGripPoint[] {
    return [
      {
        position: { ...geometry.start },
        type: "endpoint",
        index: 0,
      },
      {
        position: midpoint(geometry.start, geometry.end),
        type: "midpoint",
        index: 1,
      },
      {
        position: { ...geometry.end },
        type: "endpoint",
        index: 2,
      },
    ];
  },

  // ==================== Clone / Serialize ====================

  clone(entity: UnifiedEntity<LineGeometry>): UnifiedEntity<LineGeometry> {
    return {
      ...entity,
      id: generateEntityId(),
      geometry: {
        type: "LINE",
        start: { ...entity.geometry.start },
        end: { ...entity.geometry.end },
      },
      style: { ...entity.style },
      state: { ...entity.state, selected: false, hovered: false },
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  serialize(entity: UnifiedEntity<LineGeometry>): Record<string, unknown> {
    return {
      id: entity.id,
      entityType: entity.entityType,
      geometry: {
        type: entity.geometry.type,
        start: { ...entity.geometry.start },
        end: { ...entity.geometry.end },
      },
      style: { ...entity.style },
      state: { ...entity.state },
      layerId: entity.layerId,
      name: entity.name,
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  deserialize(data: Record<string, unknown>): UnifiedEntity<LineGeometry> {
    const geometry = data.geometry as LineGeometry;
    return {
      id: data.id as string,
      entityType: data.entityType as UnifiedEntityType,
      geometry: {
        type: "LINE",
        start: { ...(geometry.start as Point2D) },
        end: { ...(geometry.end as Point2D) },
      },
      style: { ...DEFAULT_STYLE, ...(data.style as Partial<EntityStyle>) },
      state: { ...DEFAULT_STATE, ...(data.state as Record<string, unknown>) },
      layerId: (data.layerId as string) ?? "default",
      name: data.name as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  },
};
