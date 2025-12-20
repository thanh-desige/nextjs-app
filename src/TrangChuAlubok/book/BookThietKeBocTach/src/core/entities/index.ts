/**
 * Entities Module - Export tất cả entities
 */

// ==================== NEW: Unified Entity System (Phase 2) ====================
// Phương án D: Data-only entities với Typed Geometry
export * from "./UnifiedEntity";
export * from "./EntityUtils";
export * from "./EntityAdapter";

// ==================== LEGACY: Old Entity System ====================
// Types - Exclude duplicates that are already exported from UnifiedEntity
export { EntityType, GripType } from "./Entity.types";
export type {
  IEntity,
  ILineEntity,
  IRectEntity,
  ICircleEntity,
  IArcEntity,
  IEllipseEntity,
  IPolylineEntity,
  ITextEntity,
  IDimensionEntity,
  EntityJSON,
  IEntityFactory,
  GripPoint,
  SelectionBox,
  HitTestResult,
} from "./Entity.types";

// Base
export * from "./BaseEntity";

// Entities
export * from "./Line";
export * from "./Rect";
export * from "./Circle";
export * from "./Arc";
export * from "./Ellipse";
export * from "./Polyline";
export * from "./Text";
export * from "./Dimension";

// ==================== Entity Factory ====================

import { IVec2 } from "../geometry/Vec2";
import {
  EntityType,
  EntityStyle,
  EntityJSON,
  IEntityFactory,
  IEntity,
} from "./Entity.types";
import { LineEntity } from "./Line";
import { RectEntity } from "./Rect";
import { CircleEntity } from "./Circle";
import { ArcEntity } from "./Arc";
import { PolylineEntity } from "./Polyline";
import { TextEntity } from "./Text";
import { DimensionEntity } from "./Dimension";

export class EntityFactory implements IEntityFactory {
  createLine(
    start: IVec2,
    end: IVec2,
    options?: Partial<EntityStyle>
  ): LineEntity {
    return LineEntity.create(start, end, options);
  }

  createRect(
    origin: IVec2,
    width: number,
    height: number,
    options?: Partial<EntityStyle>
  ): RectEntity {
    return RectEntity.create(origin, width, height, options);
  }

  createCircle(
    center: IVec2,
    radius: number,
    options?: Partial<EntityStyle>
  ): CircleEntity {
    return CircleEntity.create(center, radius, options);
  }

  createArc(
    center: IVec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    options?: Partial<EntityStyle>
  ): ArcEntity {
    return ArcEntity.create(center, radius, startAngle, endAngle, options);
  }

  createPolyline(
    points: IVec2[],
    closed?: boolean,
    options?: Partial<EntityStyle>
  ): PolylineEntity {
    return PolylineEntity.create(points, closed, options);
  }

  createText(
    position: IVec2,
    text: string,
    options?: Partial<EntityStyle>
  ): TextEntity {
    return TextEntity.create(position, text, options);
  }

  createDimension(
    startPoint: IVec2,
    endPoint: IVec2,
    offset?: number,
    options?: Partial<EntityStyle>
  ): DimensionEntity {
    return DimensionEntity.create(startPoint, endPoint, offset, options);
  }

  createFromJSON(json: EntityJSON): IEntity {
    switch (json.type) {
      case EntityType.LINE:
        return LineEntity.fromJSON(json);
      case EntityType.RECT:
        return RectEntity.fromJSON(json);
      case EntityType.CIRCLE:
        return CircleEntity.fromJSON(json);
      case EntityType.ARC:
        return ArcEntity.fromJSON(json);
      case EntityType.POLYLINE:
        return PolylineEntity.fromJSON(json);
      case EntityType.TEXT:
        return TextEntity.fromJSON(json);
      case EntityType.DIMENSION:
        return DimensionEntity.fromJSON(json);
      default:
        throw new Error(`Unknown entity type: ${json.type}`);
    }
  }
}

// Singleton factory instance
export const entityFactory = new EntityFactory();
