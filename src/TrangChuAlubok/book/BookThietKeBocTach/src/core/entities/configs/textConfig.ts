/**
 * textConfig — EntityConfig for TEXT entities.
 *
 * STEP-3.7: Text entity config.
 * TEXT geometry: { type: 'TEXT', position: Point2D, text, fontSize, fontFamily, textAlign, rotation }
 *
 * All transforms are IMMUTABLE — return new geometry objects.
 * Self-contained: includes all math needed for text operations.
 */

import type {
  EntityConfig,
  EntityGripPoint,
  Point2D,
} from "../EntityData.types";
import type { BoundingBox, UnifiedEntity } from "../UnifiedEntity";
import {
  TextGeometry,
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

// ==================== Text Helpers ====================

/** Estimate text width (approximate: 0.6 * fontSize * charCount) */
function estimateWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

/** Estimate text height (lines * fontSize * 1.2) */
function estimateHeight(text: string, fontSize: number): number {
  const lineCount = text.split("\n").length;
  return lineCount * fontSize * 1.2;
}

/** Get text bounds considering alignment */
function getTextBounds(g: TextGeometry): BoundingBox {
  const width = estimateWidth(g.text, g.fontSize);
  const height = estimateHeight(g.text, g.fontSize);

  let offsetX = 0;
  switch (g.textAlign) {
    case "center":
      offsetX = -width / 2;
      break;
    case "right":
      offsetX = -width;
      break;
  }

  // Simplified: textBaseline = middle (default)
  const offsetY = -height / 2;

  if (g.rotation === 0) {
    return {
      min: { x: g.position.x + offsetX, y: g.position.y + offsetY },
      max: {
        x: g.position.x + offsetX + width,
        y: g.position.y + offsetY + height,
      },
    };
  }

  // Rotated text: compute AABB of rotated corners
  const corners: Point2D[] = [
    { x: offsetX, y: offsetY },
    { x: offsetX + width, y: offsetY },
    { x: offsetX + width, y: offsetY + height },
    { x: offsetX, y: offsetY + height },
  ];

  const cos = Math.cos(g.rotation);
  const sin = Math.sin(g.rotation);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const c of corners) {
    const rx = g.position.x + c.x * cos - c.y * sin;
    const ry = g.position.y + c.x * sin + c.y * cos;
    if (rx < minX) minX = rx;
    if (ry < minY) minY = ry;
    if (rx > maxX) maxX = rx;
    if (ry > maxY) maxY = ry;
  }

  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

// ==================== Text Config ====================

export const textConfig: EntityConfig<TextGeometry> = {
  type: "TEXT",

  // ==================== Factory ====================

  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<TextGeometry> {
    const position = params.position as Point2D;
    const text = params.text as string;

    if (!position || text == null) {
      throw new Error(
        "textConfig.create requires 'position' (Point2D) and 'text' (string)",
      );
    }

    return {
      id: generateEntityId(),
      entityType: UnifiedEntityType.TEXT,
      geometry: {
        type: "TEXT",
        position: { x: position.x, y: position.y },
        text,
        fontSize: (params.fontSize as number) ?? 12,
        fontFamily: (params.fontFamily as string) ?? "Arial",
        textAlign: (params.textAlign as "left" | "center" | "right") ?? "left",
        rotation: (params.rotation as number) ?? 0,
      },
      style: { ...DEFAULT_STYLE, ...style },
      state: { ...DEFAULT_STATE },
      layerId: (params.layerId as string) ?? "default",
      name: params.name as string | undefined,
    };
  },

  // ==================== Transforms ====================

  translate(geometry: TextGeometry, dx: number, dy: number): TextGeometry {
    return {
      ...geometry,
      type: "TEXT",
      position: translatePoint(geometry.position, dx, dy),
    };
  },

  rotate(geometry: TextGeometry, angle: number, center: Point2D): TextGeometry {
    return {
      ...geometry,
      type: "TEXT",
      position: rotatePoint(geometry.position, angle, center),
      rotation: geometry.rotation + angle,
    };
  },

  scale(
    geometry: TextGeometry,
    sx: number,
    sy: number,
    center: Point2D,
  ): TextGeometry {
    // Scale position + fontSize
    const uniformScale = Math.abs((sx + sy) / 2);
    return {
      ...geometry,
      type: "TEXT",
      position: scalePoint(geometry.position, sx, sy, center),
      fontSize: geometry.fontSize * uniformScale,
    };
  },

  mirror(
    geometry: TextGeometry,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): TextGeometry {
    const axisDx = axisEnd.x - axisStart.x;
    const axisDy = axisEnd.y - axisStart.y;
    const axisAngle = Math.atan2(axisDy, axisDx);

    return {
      ...geometry,
      type: "TEXT",
      position: mirrorPoint(geometry.position, axisStart, axisEnd),
      rotation: 2 * axisAngle - geometry.rotation,
    };
  },

  // ==================== Queries ====================

  containsPoint(
    geometry: TextGeometry,
    point: Point2D,
    tolerance: number,
  ): boolean {
    const bounds = getTextBounds(geometry);
    return (
      point.x >= bounds.min.x - tolerance &&
      point.x <= bounds.max.x + tolerance &&
      point.y >= bounds.min.y - tolerance &&
      point.y <= bounds.max.y + tolerance
    );
  },

  getBounds(geometry: TextGeometry): BoundingBox {
    return getTextBounds(geometry);
  },

  getGripPoints(geometry: TextGeometry, _entityId: string): EntityGripPoint[] {
    const bounds = getTextBounds(geometry);
    const center: Point2D = {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2,
    };

    return [
      // Position (insertion point)
      { position: { ...geometry.position }, type: "endpoint", index: 0 },
      // Center of bounds
      { position: center, type: "center", index: 1 },
      // Rotation grip (above text)
      {
        position: { x: center.x, y: bounds.min.y - 20 },
        type: "rotation",
        index: 2,
      },
    ];
  },

  // ==================== Clone / Serialize ====================

  clone(entity: UnifiedEntity<TextGeometry>): UnifiedEntity<TextGeometry> {
    return {
      ...entity,
      id: generateEntityId(),
      geometry: {
        type: "TEXT",
        position: { ...entity.geometry.position },
        text: entity.geometry.text,
        fontSize: entity.geometry.fontSize,
        fontFamily: entity.geometry.fontFamily,
        textAlign: entity.geometry.textAlign,
        rotation: entity.geometry.rotation,
      },
      style: { ...entity.style },
      state: { ...entity.state, selected: false, hovered: false },
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  serialize(entity: UnifiedEntity<TextGeometry>): Record<string, unknown> {
    return {
      id: entity.id,
      entityType: entity.entityType,
      geometry: {
        type: entity.geometry.type,
        position: { ...entity.geometry.position },
        text: entity.geometry.text,
        fontSize: entity.geometry.fontSize,
        fontFamily: entity.geometry.fontFamily,
        textAlign: entity.geometry.textAlign,
        rotation: entity.geometry.rotation,
      },
      style: { ...entity.style },
      state: { ...entity.state },
      layerId: entity.layerId,
      name: entity.name,
      metadata: entity.metadata ? { ...entity.metadata } : undefined,
    };
  },

  deserialize(data: Record<string, unknown>): UnifiedEntity<TextGeometry> {
    const geometry = data.geometry as TextGeometry;
    return {
      id: data.id as string,
      entityType: data.entityType as UnifiedEntityType,
      geometry: {
        type: "TEXT",
        position: { ...(geometry.position as Point2D) },
        text: geometry.text,
        fontSize: geometry.fontSize,
        fontFamily: geometry.fontFamily,
        textAlign: geometry.textAlign,
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
