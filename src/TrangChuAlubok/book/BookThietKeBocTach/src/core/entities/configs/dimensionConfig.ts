/**
 * dimensionConfig — EntityConfig for DIMENSION entities.
 *
 * STEP-3.8: Dimension entity config.
 * DIMENSION geometry: { type: 'DIMENSION', startPoint, endPoint, textPosition, offset }
 *
 * All transforms are IMMUTABLE — return new geometry objects.
 * Self-contained: includes all math needed for dimension operations.
 */

import type {
  EntityConfig,
  EntityGripPoint,
  Point2D,
} from "../EntityData.types";
import type { BoundingBox, UnifiedEntity } from "../UnifiedEntity";
import {
  DimensionGeometry,
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

// ==================== Dimension Helpers ====================

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

/** Calculate default text position from start, end, offset */
function calcDefaultTextPosition(
  startPoint: Point2D,
  endPoint: Point2D,
  offset: number,
): Point2D {
  const mid = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  };
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Normal perpendicular to dimension line
  const nx = len > 0 ? -dy / len : 0;
  const ny = len > 0 ? dx / len : 1;
  return {
    x: mid.x + nx * offset,
    y: mid.y + ny * offset,
  };
}

// ==================== Dimension Config ====================

export const dimensionConfig: EntityConfig<DimensionGeometry> = {
  type: "DIMENSION",

  // ==================== Factory ====================

  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<DimensionGeometry> {
    const startPoint = params.startPoint as Point2D;
    const endPoint = params.endPoint as Point2D;
    const offset = (params.offset as number) ?? 30;

    if (!startPoint || !endPoint) {
      throw new Error(
        "dimensionConfig.create requires 'startPoint' and 'endPoint' (Point2D)",
      );
    }

    const textPosition = calcDefaultTextPosition(startPoint, endPoint, offset);

    return {
      id: generateEntityId(),
      entityType: UnifiedEntityType.DIMENSION,
      geometry: {
        type: "DIMENSION",
        startPoint: { x: startPoint.x, y: startPoint.y },
        endPoint: { x: endPoint.x, y: endPoint.y },
        textPosition,
        offset,
      },
      style: { ...DEFAULT_STYLE, ...style },
      state: { ...DEFAULT_STATE },
      layerId: (params.layerId as string) ?? "default",
      name: params.name as string | undefined,
    };
  },

  // ==================== Transforms ====================

  translate(
    geometry: DimensionGeometry,
    dx: number,
    dy: number,
  ): DimensionGeometry {
    return {
      type: "DIMENSION",
      startPoint: translatePoint(geometry.startPoint, dx, dy),
      endPoint: translatePoint(geometry.endPoint, dx, dy),
      textPosition: translatePoint(geometry.textPosition, dx, dy),
      offset: geometry.offset,
    };
  },

  rotate(
    geometry: DimensionGeometry,
    angle: number,
    center: Point2D,
  ): DimensionGeometry {
    return {
      type: "DIMENSION",
      startPoint: rotatePoint(geometry.startPoint, angle, center),
      endPoint: rotatePoint(geometry.endPoint, angle, center),
      textPosition: rotatePoint(geometry.textPosition, angle, center),
      offset: geometry.offset,
    };
  },

  scale(
    geometry: DimensionGeometry,
    sx: number,
    sy: number,
    center: Point2D,
  ): DimensionGeometry {
    return {
      type: "DIMENSION",
      startPoint: scalePoint(geometry.startPoint, sx, sy, center),
      endPoint: scalePoint(geometry.endPoint, sx, sy, center),
      textPosition: scalePoint(geometry.textPosition, sx, sy, center),
      offset: (geometry.offset * (Math.abs(sx) + Math.abs(sy))) / 2,
    };
  },

  mirror(
    geometry: DimensionGeometry,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): DimensionGeometry {
    return {
      type: "DIMENSION",
      startPoint: mirrorPoint(geometry.startPoint, axisStart, axisEnd),
      endPoint: mirrorPoint(geometry.endPoint, axisStart, axisEnd),
      textPosition: mirrorPoint(geometry.textPosition, axisStart, axisEnd),
      offset: geometry.offset,
    };
  },

  // ==================== Queries ====================

  containsPoint(
    geometry: DimensionGeometry,
    point: Point2D,
    tolerance: number,
  ): boolean {
    // Check dimension line (offset from start/end)
    const dx = geometry.endPoint.x - geometry.startPoint.x;
    const dy = geometry.endPoint.y - geometry.startPoint.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = len > 0 ? -dy / len : 0;
    const ny = len > 0 ? dx / len : 1;
    const offsetVec = { x: nx * geometry.offset, y: ny * geometry.offset };

    const dimStart = {
      x: geometry.startPoint.x + offsetVec.x,
      y: geometry.startPoint.y + offsetVec.y,
    };
    const dimEnd = {
      x: geometry.endPoint.x + offsetVec.x,
      y: geometry.endPoint.y + offsetVec.y,
    };

    // Check dim line
    if (distanceToSegment(point, dimStart, dimEnd) <= tolerance) return true;

    // Check extension lines
    if (distanceToSegment(point, geometry.startPoint, dimStart) <= tolerance)
      return true;
    if (distanceToSegment(point, geometry.endPoint, dimEnd) <= tolerance)
      return true;

    // Check text area (rough)
    if (
      Math.abs(point.x - geometry.textPosition.x) <= 30 + tolerance &&
      Math.abs(point.y - geometry.textPosition.y) <= 10 + tolerance
    )
      return true;

    return false;
  },

  getBounds(geometry: DimensionGeometry): BoundingBox {
    const points = [
      geometry.startPoint,
      geometry.endPoint,
      geometry.textPosition,
    ];

    // Also include offset dimension line endpoints
    const dx = geometry.endPoint.x - geometry.startPoint.x;
    const dy = geometry.endPoint.y - geometry.startPoint.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = len > 0 ? -dy / len : 0;
    const ny = len > 0 ? dx / len : 1;
    const offsetVec = { x: nx * geometry.offset, y: ny * geometry.offset };

    points.push({
      x: geometry.startPoint.x + offsetVec.x,
      y: geometry.startPoint.y + offsetVec.y,
    });
    points.push({
      x: geometry.endPoint.x + offsetVec.x,
      y: geometry.endPoint.y + offsetVec.y,
    });

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

  getGripPoints(
    geometry: DimensionGeometry,
    _entityId: string,
  ): EntityGripPoint[] {
    return [
      // Start point
      { position: { ...geometry.startPoint }, type: "endpoint", index: 0 },
      // End point
      { position: { ...geometry.endPoint }, type: "endpoint", index: 1 },
      // Text position (control point)
      { position: { ...geometry.textPosition }, type: "control", index: 2 },
    ];
  },

  // ==================== Clone / Serialize ====================

  clone(
    entity: UnifiedEntity<DimensionGeometry>,
  ): UnifiedEntity<DimensionGeometry> {
    return {
      ...entity,
      id: generateEntityId(),
      geometry: {
        type: "DIMENSION",
        startPoint: { ...entity.geometry.startPoint },
        endPoint: { ...entity.geometry.endPoint },
        textPosition: { ...entity.geometry.textPosition },
        offset: entity.geometry.offset,
      },
      style: { ...entity.style },
      state: { ...entity.state, selected: false, hovered: false },
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  serialize(entity: UnifiedEntity<DimensionGeometry>): Record<string, unknown> {
    return {
      id: entity.id,
      entityType: entity.entityType,
      geometry: {
        type: entity.geometry.type,
        startPoint: { ...entity.geometry.startPoint },
        endPoint: { ...entity.geometry.endPoint },
        textPosition: { ...entity.geometry.textPosition },
        offset: entity.geometry.offset,
      },
      style: { ...entity.style },
      state: { ...entity.state },
      layerId: entity.layerId,
      name: entity.name,
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  deserialize(data: Record<string, unknown>): UnifiedEntity<DimensionGeometry> {
    const geometry = data.geometry as DimensionGeometry;
    return {
      id: data.id as string,
      entityType: data.entityType as UnifiedEntityType,
      geometry: {
        type: "DIMENSION",
        startPoint: { ...(geometry.startPoint as Point2D) },
        endPoint: { ...(geometry.endPoint as Point2D) },
        textPosition: { ...(geometry.textPosition as Point2D) },
        offset: geometry.offset,
      },
      style: { ...DEFAULT_STYLE, ...(data.style as Partial<EntityStyle>) },
      state: { ...DEFAULT_STATE, ...(data.state as Record<string, unknown>) },
      layerId: (data.layerId as string) ?? "default",
      name: data.name as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  },
};
