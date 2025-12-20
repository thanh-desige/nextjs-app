/**
 * useEngineEntities - Hook để lấy entities từ CadEngine và convert sang CadEntity format
 *
 * ĐIỀU KIỆN 1: Entities được lưu trong Document, hook này sync lên UI
 *
 * Cách sử dụng:
 * ```
 * const { entities, isLoading } = useEngineEntities();
 *
 * return <CadDrawingCanvas controlledEntities={entities} ... />;
 * ```
 */

"use client";

import { useMemo } from "react";
import { useEngineStore } from "../store/engineStore";
import { IEntity, EntityType } from "../core/entities/Entity.types";
import type { CadEntity } from "../ui/canvas/types/CadEntity";

// Re-export for backward compatibility
export type { CadEntity };

// Map EntityType enum to canvas entity type string
function mapEntityType(
  entityType: EntityType
): "line" | "polyline" | "rect" | "circle" | "arc" | "ellipse" | "text" {
  // Based on Entity.types.ts: LINE, RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION, BLOCK_REF, GROUP, IMAGE, HATCH
  const typeMap: Record<
    EntityType,
    "line" | "polyline" | "rect" | "circle" | "arc" | "ellipse" | "text"
  > = {
    [EntityType.LINE]: "line",
    [EntityType.POLYLINE]: "polyline",
    [EntityType.RECT]: "rect",
    [EntityType.CIRCLE]: "circle",
    [EntityType.ARC]: "arc",
    [EntityType.ELLIPSE]: "ellipse",
    [EntityType.TEXT]: "text",
    // Fallback for complex types
    [EntityType.HATCH]: "polyline",
    [EntityType.DIMENSION]: "line",
    [EntityType.BLOCK_REF]: "line",
    [EntityType.IMAGE]: "rect",
    [EntityType.GROUP]: "line",
  };
  return typeMap[entityType] || "line";
}

// Convert IEntity to CadEntity format
function convertToCadEntity(entity: IEntity): CadEntity | null {
  if (!entity) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = entity as any;

  // Get points from entity
  let points: { x: number; y: number }[] = [];
  if (typeof e.getPoints === "function") {
    points = e.getPoints();
  } else if (e.start && e.end) {
    // Line entity
    points = [
      { x: e.start.x, y: e.start.y },
      { x: e.end.x, y: e.end.y },
    ];
  } else if (e.center && e.radius !== undefined) {
    // Circle entity
    points = [
      { x: e.center.x, y: e.center.y },
      { x: e.radius, y: 0 }, // radius stored in x
    ];
  } else if (e.position) {
    // Text entity
    points = [{ x: e.position.x, y: e.position.y }];
  } else if (e.points) {
    // Already has points
    points = e.points;
  }

  const base: CadEntity = {
    id: entity.id,
    type: mapEntityType(entity.type),
    points,
    color: entity.style?.strokeColor || "#FFFFFF",
    lineWidth: entity.style?.strokeWidth || 1,
    fillColor: entity.style?.fillColor || null,
    fillOpacity: entity.style?.opacity ?? 0.5,
    layer: entity.layerId,
  };

  // Add specific properties
  if (e.startAngle !== undefined) base.startAngle = e.startAngle;
  if (e.endAngle !== undefined) base.endAngle = e.endAngle;
  if (e.radiusX !== undefined) base.radiusX = e.radiusX;
  if (e.radiusY !== undefined) base.radiusY = e.radiusY;
  if (e.rotation !== undefined) base.rotation = e.rotation;
  if (e.text !== undefined) base.text = e.text;
  if (e.fontSize !== undefined) base.fontSize = e.fontSize;
  if (e.fontFamily !== undefined) base.fontFamily = e.fontFamily;

  return base;
}

export interface UseEngineEntitiesReturn {
  /** Entities in canvas format */
  entities: CadEntity[];
  /** Document version for change tracking */
  version: number;
  /** Is engine initialized */
  isReady: boolean;
}

/**
 * Hook to get entities from CadEngine in canvas-compatible format
 * Re-computes when documentVersion changes
 */
export function useEngineEntities(): UseEngineEntitiesReturn {
  const engine = useEngineStore((state) => state.engine);
  const documentVersion = useEngineStore((state) => state.documentVersion);

  // Convert entities when documentVersion changes
  // documentVersion is needed to trigger re-computation when document changes
  const entities = useMemo(() => {
    if (!engine) return [];

    const engineEntities = engine.getAllEntities();
    const converted: CadEntity[] = [];

    for (const entity of engineEntities) {
      const cadEntity = convertToCadEntity(entity);
      if (cadEntity) {
        converted.push(cadEntity);
      }
    }

    return converted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, documentVersion]);

  return {
    entities,
    version: documentVersion,
    isReady: engine !== null,
  };
}

export default useEngineEntities;
