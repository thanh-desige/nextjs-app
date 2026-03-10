/**
 * ellipseConfig — EntityConfig for ELLIPSE entities.
 *
 * STEP-3.5: Ellipse entity config.
 * ELLIPSE geometry: { type: 'ELLIPSE', center: Point2D, majorRadius, minorRadius, rotation }
 *
 * All transforms are IMMUTABLE — return new geometry objects.
 * Self-contained: includes all math needed for ellipse operations.
 */

import type {
  EntityConfig,
  EntityGripPoint,
  Point2D,
} from "../EntityData.types";
import type { BoundingBox, UnifiedEntity } from "../UnifiedEntity";
import {
  EllipseGeometry,
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

// ==================== Ellipse Math Helpers ====================

/** Get point on ellipse at parametric angle (in local frame) */
function pointAtAngle(g: EllipseGeometry, angle: number): Point2D {
  // Local point on unrotated ellipse
  const localX = g.majorRadius * Math.cos(angle);
  const localY = g.minorRadius * Math.sin(angle);

  // Apply rotation
  const cos = Math.cos(g.rotation);
  const sin = Math.sin(g.rotation);
  return {
    x: g.center.x + localX * cos - localY * sin,
    y: g.center.y + localX * sin + localY * cos,
  };
}

// ==================== Ellipse Config ====================

export const ellipseConfig: EntityConfig<EllipseGeometry> = {
  type: "ELLIPSE",

  // ==================== Factory ====================

  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<EllipseGeometry> {
    const center = params.center as Point2D;
    const majorRadius = params.majorRadius as number;
    const minorRadius = params.minorRadius as number;
    const rotation = (params.rotation as number) ?? 0;

    if (!center || majorRadius == null || minorRadius == null) {
      throw new Error(
        "ellipseConfig.create requires 'center', 'majorRadius', 'minorRadius'",
      );
    }

    return {
      id: generateEntityId(),
      entityType: UnifiedEntityType.ELLIPSE,
      geometry: {
        type: "ELLIPSE",
        center: { x: center.x, y: center.y },
        majorRadius,
        minorRadius,
        rotation,
      },
      style: { ...DEFAULT_STYLE, ...style },
      state: { ...DEFAULT_STATE },
      layerId: (params.layerId as string) ?? "default",
      name: params.name as string | undefined,
    };
  },

  // ==================== Transforms ====================

  translate(
    geometry: EllipseGeometry,
    dx: number,
    dy: number,
  ): EllipseGeometry {
    return {
      ...geometry,
      type: "ELLIPSE",
      center: translatePoint(geometry.center, dx, dy),
    };
  },

  rotate(
    geometry: EllipseGeometry,
    angle: number,
    center: Point2D,
  ): EllipseGeometry {
    return {
      type: "ELLIPSE",
      center: rotatePoint(geometry.center, angle, center),
      majorRadius: geometry.majorRadius,
      minorRadius: geometry.minorRadius,
      rotation: geometry.rotation + angle,
    };
  },

  scale(
    geometry: EllipseGeometry,
    sx: number,
    sy: number,
    center: Point2D,
  ): EllipseGeometry {
    return {
      type: "ELLIPSE",
      center: scalePoint(geometry.center, sx, sy, center),
      majorRadius: geometry.majorRadius * Math.abs(sx),
      minorRadius: geometry.minorRadius * Math.abs(sy),
      rotation: geometry.rotation,
    };
  },

  mirror(
    geometry: EllipseGeometry,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): EllipseGeometry {
    const newCenter = mirrorPoint(geometry.center, axisStart, axisEnd);
    // Mirror flips rotation
    const axisDx = axisEnd.x - axisStart.x;
    const axisDy = axisEnd.y - axisStart.y;
    const axisAngle = Math.atan2(axisDy, axisDx);
    const newRotation = 2 * axisAngle - geometry.rotation;

    return {
      type: "ELLIPSE",
      center: newCenter,
      majorRadius: geometry.majorRadius,
      minorRadius: geometry.minorRadius,
      rotation: newRotation,
    };
  },

  // ==================== Queries ====================

  containsPoint(
    geometry: EllipseGeometry,
    point: Point2D,
    tolerance: number,
  ): boolean {
    // Transform point to local ellipse frame
    const dx = point.x - geometry.center.x;
    const dy = point.y - geometry.center.y;
    const cos = Math.cos(-geometry.rotation);
    const sin = Math.sin(-geometry.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Normalized distance: (x/a)² + (y/b)² — if near 1.0, point is on ellipse
    const a = geometry.majorRadius;
    const b = geometry.minorRadius;
    if (a === 0 || b === 0) return false;

    const normDist = (localX * localX) / (a * a) + (localY * localY) / (b * b);
    // tolerance in normalized space: approximate
    const tol = tolerance / Math.min(a, b);
    return Math.abs(Math.sqrt(normDist) - 1) <= tol;
  },

  getBounds(geometry: EllipseGeometry): BoundingBox {
    const { center, majorRadius: a, minorRadius: b, rotation } = geometry;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Half-extents of rotated ellipse AABB
    const halfX = Math.sqrt(a * a * cos * cos + b * b * sin * sin);
    const halfY = Math.sqrt(a * a * sin * sin + b * b * cos * cos);

    return {
      min: { x: center.x - halfX, y: center.y - halfY },
      max: { x: center.x + halfX, y: center.y + halfY },
    };
  },

  getGripPoints(
    geometry: EllipseGeometry,
    _entityId: string,
  ): EntityGripPoint[] {
    return [
      // Center
      { position: { ...geometry.center }, type: "center", index: 0 },
      // Major axis + end (angle=0)
      { position: pointAtAngle(geometry, 0), type: "endpoint", index: 1 },
      // Major axis − end (angle=π)
      { position: pointAtAngle(geometry, Math.PI), type: "endpoint", index: 2 },
      // Minor axis + end (angle=π/2)
      {
        position: pointAtAngle(geometry, Math.PI / 2),
        type: "endpoint",
        index: 3,
      },
      // Minor axis − end (angle=3π/2)
      {
        position: pointAtAngle(geometry, (3 * Math.PI) / 2),
        type: "endpoint",
        index: 4,
      },
    ];
  },

  // ==================== Clone / Serialize ====================

  clone(
    entity: UnifiedEntity<EllipseGeometry>,
  ): UnifiedEntity<EllipseGeometry> {
    return {
      ...entity,
      id: generateEntityId(),
      geometry: {
        type: "ELLIPSE",
        center: { ...entity.geometry.center },
        majorRadius: entity.geometry.majorRadius,
        minorRadius: entity.geometry.minorRadius,
        rotation: entity.geometry.rotation,
      },
      style: { ...entity.style },
      state: { ...entity.state, selected: false, hovered: false },
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  serialize(entity: UnifiedEntity<EllipseGeometry>): Record<string, unknown> {
    return {
      id: entity.id,
      entityType: entity.entityType,
      geometry: {
        type: entity.geometry.type,
        center: { ...entity.geometry.center },
        majorRadius: entity.geometry.majorRadius,
        minorRadius: entity.geometry.minorRadius,
        rotation: entity.geometry.rotation,
      },
      style: { ...entity.style },
      state: { ...entity.state },
      layerId: entity.layerId,
      name: entity.name,
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  deserialize(data: Record<string, unknown>): UnifiedEntity<EllipseGeometry> {
    const geometry = data.geometry as EllipseGeometry;
    return {
      id: data.id as string,
      entityType: data.entityType as UnifiedEntityType,
      geometry: {
        type: "ELLIPSE",
        center: { ...(geometry.center as Point2D) },
        majorRadius: geometry.majorRadius,
        minorRadius: geometry.minorRadius,
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
