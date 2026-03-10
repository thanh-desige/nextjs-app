/**
 * arcConfig — EntityConfig for ARC entities.
 *
 * STEP-3.4: Arc entity config.
 * ARC geometry: { type: 'ARC', center: Point2D, radius, startAngle, endAngle }
 *
 * All transforms are IMMUTABLE — return new geometry objects.
 * Self-contained: includes all math needed for arc operations.
 */

import type {
  EntityConfig,
  EntityGripPoint,
  Point2D,
} from "../EntityData.types";
import type { BoundingBox, UnifiedEntity } from "../UnifiedEntity";
import {
  ArcGeometry,
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

// ==================== Arc Math Helpers ====================

/** Normalize angle to [0, 2π) */
function normalizeAngle(angle: number): number {
  const TWO_PI = Math.PI * 2;
  let a = angle % TWO_PI;
  if (a < 0) a += TWO_PI;
  return a;
}

/** Check if angle is within arc sweep (from startAngle to endAngle, counter-clockwise) */
function containsAngle(
  startAngle: number,
  endAngle: number,
  angle: number,
): boolean {
  const normStart = normalizeAngle(startAngle);
  const normEnd = normalizeAngle(endAngle);
  const normAngle = normalizeAngle(angle);

  if (normStart <= normEnd) {
    return normAngle >= normStart && normAngle <= normEnd;
  }
  // Arc wraps around 0
  return normAngle >= normStart || normAngle <= normEnd;
}

/** Get point on arc at given angle */
function pointAtAngle(center: Point2D, radius: number, angle: number): Point2D {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

/** Get midpoint angle of arc */
function getMidAngle(startAngle: number, endAngle: number): number {
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += Math.PI * 2;
  return startAngle + sweep / 2;
}

// ==================== Arc Config ====================

export const arcConfig: EntityConfig<ArcGeometry> = {
  type: "ARC",

  // ==================== Factory ====================

  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<ArcGeometry> {
    const center = params.center as Point2D;
    const radius = params.radius as number;
    const startAngle = params.startAngle as number;
    const endAngle = params.endAngle as number;

    if (!center || radius == null || startAngle == null || endAngle == null) {
      throw new Error(
        "arcConfig.create requires 'center', 'radius', 'startAngle', 'endAngle'",
      );
    }

    return {
      id: generateEntityId(),
      entityType: UnifiedEntityType.ARC,
      geometry: {
        type: "ARC",
        center: { x: center.x, y: center.y },
        radius,
        startAngle,
        endAngle,
      },
      style: { ...DEFAULT_STYLE, ...style },
      state: { ...DEFAULT_STATE },
      layerId: (params.layerId as string) ?? "default",
      name: params.name as string | undefined,
    };
  },

  // ==================== Transforms ====================

  translate(geometry: ArcGeometry, dx: number, dy: number): ArcGeometry {
    return {
      ...geometry,
      type: "ARC",
      center: translatePoint(geometry.center, dx, dy),
    };
  },

  rotate(geometry: ArcGeometry, angle: number, center: Point2D): ArcGeometry {
    return {
      type: "ARC",
      center: rotatePoint(geometry.center, angle, center),
      radius: geometry.radius,
      startAngle: geometry.startAngle + angle,
      endAngle: geometry.endAngle + angle,
    };
  },

  scale(
    geometry: ArcGeometry,
    sx: number,
    sy: number,
    center: Point2D,
  ): ArcGeometry {
    return {
      type: "ARC",
      center: scalePoint(geometry.center, sx, sy, center),
      radius: (geometry.radius * (Math.abs(sx) + Math.abs(sy))) / 2,
      startAngle: geometry.startAngle,
      endAngle: geometry.endAngle,
    };
  },

  mirror(
    geometry: ArcGeometry,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): ArcGeometry {
    const newCenter = mirrorPoint(geometry.center, axisStart, axisEnd);
    // Mirror flips angles: reflect across axis
    const axisDx = axisEnd.x - axisStart.x;
    const axisDy = axisEnd.y - axisStart.y;
    const axisAngle = Math.atan2(axisDy, axisDx);
    // Reflecting an angle across axisAngle: newAngle = 2*axisAngle - angle
    // Also swap start/end because mirror reverses winding
    const newStartAngle = 2 * axisAngle - geometry.endAngle;
    const newEndAngle = 2 * axisAngle - geometry.startAngle;

    return {
      type: "ARC",
      center: newCenter,
      radius: geometry.radius,
      startAngle: newStartAngle,
      endAngle: newEndAngle,
    };
  },

  // ==================== Queries ====================

  containsPoint(
    geometry: ArcGeometry,
    point: Point2D,
    tolerance: number,
  ): boolean {
    const dx = point.x - geometry.center.x;
    const dy = point.y - geometry.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check distance to arc stroke
    if (Math.abs(dist - geometry.radius) > tolerance) return false;

    // Check angle within arc
    const angle = Math.atan2(dy, dx);
    return containsAngle(geometry.startAngle, geometry.endAngle, angle);
  },

  getBounds(geometry: ArcGeometry): BoundingBox {
    const { center, radius, startAngle, endAngle } = geometry;
    const points: Point2D[] = [
      pointAtAngle(center, radius, startAngle),
      pointAtAngle(center, radius, endAngle),
    ];

    // Add quadrant points if arc passes through them
    const quadrants = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (const q of quadrants) {
      if (containsAngle(startAngle, endAngle, q)) {
        points.push(pointAtAngle(center, radius, q));
      }
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  },

  getGripPoints(geometry: ArcGeometry, _entityId: string): EntityGripPoint[] {
    const { center, radius, startAngle, endAngle } = geometry;
    const midAngle = getMidAngle(startAngle, endAngle);

    return [
      // Center
      { position: { ...center }, type: "center", index: 0 },
      // Start point
      {
        position: pointAtAngle(center, radius, startAngle),
        type: "endpoint",
        index: 1,
      },
      // Mid point
      {
        position: pointAtAngle(center, radius, midAngle),
        type: "midpoint",
        index: 2,
      },
      // End point
      {
        position: pointAtAngle(center, radius, endAngle),
        type: "endpoint",
        index: 3,
      },
    ];
  },

  // ==================== Clone / Serialize ====================

  clone(entity: UnifiedEntity<ArcGeometry>): UnifiedEntity<ArcGeometry> {
    return {
      ...entity,
      id: generateEntityId(),
      geometry: {
        type: "ARC",
        center: { ...entity.geometry.center },
        radius: entity.geometry.radius,
        startAngle: entity.geometry.startAngle,
        endAngle: entity.geometry.endAngle,
      },
      style: { ...entity.style },
      state: { ...entity.state, selected: false, hovered: false },
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  serialize(entity: UnifiedEntity<ArcGeometry>): Record<string, unknown> {
    return {
      id: entity.id,
      entityType: entity.entityType,
      geometry: {
        type: entity.geometry.type,
        center: { ...entity.geometry.center },
        radius: entity.geometry.radius,
        startAngle: entity.geometry.startAngle,
        endAngle: entity.geometry.endAngle,
      },
      style: { ...entity.style },
      state: { ...entity.state },
      layerId: entity.layerId,
      name: entity.name,
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  deserialize(data: Record<string, unknown>): UnifiedEntity<ArcGeometry> {
    const geometry = data.geometry as ArcGeometry;
    return {
      id: data.id as string,
      entityType: data.entityType as UnifiedEntityType,
      geometry: {
        type: "ARC",
        center: { ...(geometry.center as Point2D) },
        radius: geometry.radius,
        startAngle: geometry.startAngle,
        endAngle: geometry.endAngle,
      },
      style: { ...DEFAULT_STYLE, ...(data.style as Partial<EntityStyle>) },
      state: { ...DEFAULT_STATE, ...(data.state as Record<string, unknown>) },
      layerId: (data.layerId as string) ?? "default",
      name: data.name as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  },
};
