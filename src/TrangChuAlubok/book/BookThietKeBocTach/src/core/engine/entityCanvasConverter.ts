/**
 * entityCanvasConverter.ts
 *
 * STEP-5.19: Extracted from CadEngine.ts
 * Pure function: converts IEntity (core) → CanvasEntity (UI canvas format).
 * No class/state dependency — operates solely on the entity argument.
 */

import { IEntity, EntityType } from "../entities/Entity.types";
import { CanvasEntity } from "../document/CadDocument";

/**
 * Convert IEntity to CanvasEntity format for UI rendering.
 * This bridges the gap between core entities and canvas entities.
 */
export function convertIEntityToCanvasEntity(
  entity: IEntity,
): CanvasEntity | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = entity as any;

  // Map EntityType to canvas type string
  // Based on Entity.types.ts: LINE, RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION, BLOCK_REF, GROUP, IMAGE, HATCH
  const typeMap: Record<EntityType, CanvasEntity["type"]> = {
    [EntityType.LINE]: "line",
    [EntityType.POLYLINE]: "polyline",
    [EntityType.RECT]: "rect",
    [EntityType.CIRCLE]: "circle",
    [EntityType.ARC]: "arc",
    [EntityType.ELLIPSE]: "ellipse",
    [EntityType.TEXT]: "text",
    [EntityType.HATCH]: "polyline",
    [EntityType.DIMENSION]: "line",
    [EntityType.BLOCK_REF]: "line",
    [EntityType.IMAGE]: "rect",
    [EntityType.GROUP]: "line",
  };

  // Get points from entity based on type
  let points: { x: number; y: number }[] = [];

  // Handle specific entity types
  switch (entity.type) {
    case EntityType.LINE:
      if (e.start && e.end) {
        points = [
          { x: e.start.x, y: e.start.y },
          { x: e.end.x, y: e.end.y },
        ];
      }
      break;

    case EntityType.RECT:
      // RectEntity has origin, width, height - use 2 opposite corners for CadDrawingCanvas
      // CadDrawingCanvas expects points[0] = origin, points[1] = opposite corner
      if (e.origin && e.width !== undefined && e.height !== undefined) {
        const ox = e.origin.x;
        const oy = e.origin.y;
        points = [
          { x: ox, y: oy },
          { x: ox + e.width, y: oy + e.height },
        ];
      }
      break;

    case EntityType.CIRCLE:
      // CircleEntity has center, radius
      if (e.center && e.radius !== undefined) {
        points = [
          { x: e.center.x, y: e.center.y },
          { x: e.radius, y: 0 }, // radius stored in x
        ];
      }
      break;

    case EntityType.ARC:
      // ArcEntity has center, radius, startAngle, endAngle
      if (e.center && e.radius !== undefined) {
        points = [
          { x: e.center.x, y: e.center.y },
          { x: e.radius, y: 0 },
        ];
      }
      break;

    case EntityType.ELLIPSE:
      // EllipseEntity has center, radiusX, radiusY, rotation
      if (e.center) {
        points = [
          { x: e.center.x, y: e.center.y },
          { x: e.radiusX || 0, y: e.radiusY || 0 },
        ];
      }
      break;

    case EntityType.TEXT:
      if (e.position) {
        points = [{ x: e.position.x, y: e.position.y }];
      }
      break;

    case EntityType.POLYLINE:
      if (typeof e.getPoints === "function") {
        points = e.getPoints();
      } else if (e.points) {
        points = e.points;
      }
      break;

    default:
      // Generic fallback
      if (typeof e.getPoints === "function") {
        points = e.getPoints();
      } else if (e.points) {
        points = e.points;
      }
      break;
  }

  // Build base canvas entity
  const canvasEntity: CanvasEntity = {
    id: entity.id,
    type: typeMap[entity.type] || "line",
    points,
    color: entity.style?.strokeColor || "#FFFFFF",
    lineWidth: entity.style?.strokeWidth || 1,
    strokeStyle:
      (entity.style?.strokeStyle as
        | "solid"
        | "dashed"
        | "dotted"
        | "dashdot") || "solid",
    fillColor: entity.style?.fillColor || null,
    fillOpacity: entity.style?.opacity ?? 0.5,
    opacity: entity.style?.opacity ?? 1,
    layer: entity.layerId,
  };

  // Add type-specific properties
  if (entity.type === EntityType.ARC) {
    canvasEntity.startAngle = e.startAngle;
    canvasEntity.endAngle = e.endAngle;
  }

  if (entity.type === EntityType.ELLIPSE) {
    canvasEntity.radiusX = e.radiusX;
    canvasEntity.radiusY = e.radiusY;
    canvasEntity.rotation = e.rotation;
  }

  if (entity.type === EntityType.TEXT) {
    canvasEntity.text = e.content || e.text || "";
    canvasEntity.fontSize = e.fontSize;
    canvasEntity.fontFamily = e.fontFamily;
  }

  return canvasEntity;
}
