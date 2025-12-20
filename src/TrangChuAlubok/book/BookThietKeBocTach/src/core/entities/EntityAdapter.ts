/**
 * EntityAdapter - Convert giữa CanvasEntity và UnifiedEntity
 *
 * TUÂN THỦ 3 ĐIỀU KIỆN:
 * - ĐK1: Adapter CHỈ được dùng trong Commands hoặc Document
 * - ĐK2: Không thay đổi logic validation
 * - ĐK3: File đặt trong core/entities/ đúng cấu trúc
 *
 * Mục đích:
 * - Cho phép migrate dần từ CanvasEntity sang UnifiedEntity
 * - UI vẫn dùng CanvasEntity (không thay đổi)
 * - Commands có thể dùng EntityUtils qua adapter
 */

import { CanvasEntity, CanvasPoint } from "../document/CadDocument";
import {
  UnifiedEntity,
  UnifiedEntityType,
  LineGeometry,
  PolylineGeometry,
  RectGeometry,
  CircleGeometry,
  Point2D,
  EntityStyle,
  EntityState,
  DEFAULT_STYLE,
  DEFAULT_STATE,
  generateEntityId,
} from "./UnifiedEntity";

// ==================== CanvasEntity → UnifiedEntity ====================

/**
 * Convert CanvasEntity to UnifiedEntity
 */
export function canvasToUnified(canvas: CanvasEntity): UnifiedEntity | null {
  const baseProps = {
    id: canvas.id,
    style: canvasStyleToUnified(canvas),
    state: canvasStateToUnified(canvas),
    layerId: canvas.layer ?? "default",
  };

  switch (canvas.type) {
    case "line":
      if (canvas.points.length < 2) return null;
      return {
        ...baseProps,
        entityType: UnifiedEntityType.LINE,
        geometry: {
          type: "LINE",
          start: pointToPoint2D(canvas.points[0]),
          end: pointToPoint2D(canvas.points[1]),
        } as LineGeometry,
      };

    case "polyline":
      if (canvas.points.length < 2) return null;
      return {
        ...baseProps,
        entityType: UnifiedEntityType.POLYLINE,
        geometry: {
          type: "POLYLINE",
          points: canvas.points.map(pointToPoint2D),
          closed: false, // CanvasEntity doesn't track closed state
        } as PolylineGeometry,
      };

    case "rect":
      if (canvas.points.length < 2) return null;
      // CanvasEntity rect: points[0] = corner1, points[1] = corner2
      const p1 = canvas.points[0];
      const p2 = canvas.points[1];
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const width = Math.abs(p2.x - p1.x);
      const height = Math.abs(p2.y - p1.y);
      return {
        ...baseProps,
        entityType: UnifiedEntityType.RECT,
        geometry: {
          type: "RECT",
          origin: { x: minX, y: minY },
          width,
          height,
          rotation: 0,
        } as RectGeometry,
      };

    case "circle":
      if (canvas.points.length < 2) return null;
      // CanvasEntity circle: points[0] = center, points[1].x = radius
      return {
        ...baseProps,
        entityType: UnifiedEntityType.CIRCLE,
        geometry: {
          type: "CIRCLE",
          center: pointToPoint2D(canvas.points[0]),
          radius: canvas.points[1].x,
        } as CircleGeometry,
      };

    default:
      return null;
  }
}

// ==================== UnifiedEntity → CanvasEntity ====================

/**
 * Convert UnifiedEntity to CanvasEntity
 */
export function unifiedToCanvas(entity: UnifiedEntity): CanvasEntity | null {
  const baseProps = {
    id: entity.id,
    color: entity.style.strokeColor,
    lineWidth: entity.style.strokeWidth,
    selected: entity.state.selected,
    locked: entity.state.locked,
    visible: entity.state.visible,
    layer: entity.layerId,
  };

  switch (entity.geometry.type) {
    case "LINE": {
      const geo = entity.geometry as LineGeometry;
      return {
        ...baseProps,
        type: "line",
        points: [
          point2DToCanvasPoint(geo.start),
          point2DToCanvasPoint(geo.end),
        ],
      };
    }

    case "POLYLINE": {
      const geo = entity.geometry as PolylineGeometry;
      return {
        ...baseProps,
        type: "polyline",
        points: geo.points.map(point2DToCanvasPoint),
      };
    }

    case "RECT": {
      const geo = entity.geometry as RectGeometry;
      // Convert back to 2-corner format
      const p1 = { x: geo.origin.x, y: geo.origin.y };
      const p2 = { x: geo.origin.x + geo.width, y: geo.origin.y + geo.height };

      // If rotated, we need to apply rotation (simplified - ignore for now)
      // Full implementation would transform corners
      return {
        ...baseProps,
        type: "rect",
        points: [point2DToCanvasPoint(p1), point2DToCanvasPoint(p2)],
      };
    }

    case "CIRCLE": {
      const geo = entity.geometry as CircleGeometry;
      return {
        ...baseProps,
        type: "circle",
        points: [
          point2DToCanvasPoint(geo.center),
          { x: geo.radius, y: 0 }, // Store radius in points[1].x
        ],
      };
    }

    default:
      return null;
  }
}

// ==================== Batch Conversions ====================

/**
 * Convert multiple CanvasEntities to UnifiedEntities
 */
export function canvasArrayToUnified(
  canvasEntities: CanvasEntity[]
): UnifiedEntity[] {
  return canvasEntities
    .map(canvasToUnified)
    .filter((e): e is UnifiedEntity => e !== null);
}

/**
 * Convert multiple UnifiedEntities to CanvasEntities
 */
export function unifiedArrayToCanvas(
  entities: UnifiedEntity[]
): CanvasEntity[] {
  return entities
    .map(unifiedToCanvas)
    .filter((e): e is CanvasEntity => e !== null);
}

// ==================== Helper Functions ====================

function pointToPoint2D(point: CanvasPoint): Point2D {
  return { x: point.x, y: point.y };
}

function point2DToCanvasPoint(point: Point2D): CanvasPoint {
  return { x: point.x, y: point.y };
}

function canvasStyleToUnified(canvas: CanvasEntity): EntityStyle {
  return {
    ...DEFAULT_STYLE,
    strokeColor: canvas.color,
    strokeWidth: canvas.lineWidth,
  };
}

function canvasStateToUnified(canvas: CanvasEntity): EntityState {
  return {
    ...DEFAULT_STATE,
    selected: canvas.selected ?? false,
    locked: canvas.locked ?? false,
    visible: canvas.visible ?? true,
  };
}

// ==================== Transform Helpers for Commands ====================

/**
 * Apply a transformation to CanvasEntity using UnifiedEntity system
 * This is the bridge for Commands to use EntityUtils
 *
 * Usage in Commands:
 * ```
 * import { transformCanvasEntity } from "./EntityAdapter";
 * import { translateEntity } from "./EntityUtils";
 *
 * const transformed = transformCanvasEntity(canvasEntity, (unified) =>
 *   translateEntity(unified, dx, dy)
 * );
 * ```
 */
export function transformCanvasEntity(
  canvas: CanvasEntity,
  transform: (entity: UnifiedEntity) => UnifiedEntity | null
): CanvasEntity | null {
  // 1. Convert to UnifiedEntity
  const unified = canvasToUnified(canvas);
  if (!unified) return null;

  // 2. Apply transformation
  const transformed = transform(unified);
  if (!transformed) return null;

  // 3. Convert back to CanvasEntity
  return unifiedToCanvas(transformed);
}

/**
 * Apply a transformation that creates a new entity (like copy, mirror, offset)
 */
export function transformCanvasEntityWithNewId(
  canvas: CanvasEntity,
  transform: (entity: UnifiedEntity) => UnifiedEntity | null
): CanvasEntity | null {
  const result = transformCanvasEntity(canvas, transform);
  if (!result) return null;

  // Ensure new ID
  return {
    ...result,
    id: generateEntityId(),
    selected: false,
  };
}

// ==================== Geometry Extraction for Preview ====================

/**
 * Get points array from UnifiedEntity (for preview rendering)
 */
export function getPreviewPoints(entity: UnifiedEntity): Point2D[] {
  switch (entity.geometry.type) {
    case "LINE": {
      const geo = entity.geometry as LineGeometry;
      return [geo.start, geo.end];
    }

    case "POLYLINE": {
      const geo = entity.geometry as PolylineGeometry;
      return [...geo.points];
    }

    case "RECT": {
      const geo = entity.geometry as RectGeometry;
      // Return 2 corner points for rect
      return [
        geo.origin,
        { x: geo.origin.x + geo.width, y: geo.origin.y + geo.height },
      ];
    }

    case "CIRCLE": {
      const geo = entity.geometry as CircleGeometry;
      // Return center and radius point
      return [geo.center, { x: geo.radius, y: 0 }];
    }

    default:
      return [];
  }
}

/**
 * Get entity type string (for preview rendering)
 */
export function getCanvasType(
  entity: UnifiedEntity
): "line" | "polyline" | "rect" | "circle" {
  switch (entity.geometry.type) {
    case "LINE":
      return "line";
    case "POLYLINE":
      return "polyline";
    case "RECT":
      return "rect";
    case "CIRCLE":
      return "circle";
    default:
      return "line";
  }
}
