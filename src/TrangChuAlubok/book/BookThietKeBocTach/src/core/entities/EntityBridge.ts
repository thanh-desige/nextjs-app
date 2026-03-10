/**
 * EntityBridge — Bridge between IEntity (production) and UnifiedEntity (EntityRegistry)
 *
 * STEP-3.9: Replaces direct entity method calls with EntityRegistry dispatch.
 * Provides conversion functions and operation wrappers that work with IEntity
 * objects while delegating math to EntityRegistry configs.
 *
 * COMPLIANCE:
 * - G1: Dispatch via EntityRegistry (no switch/case in callers)
 * - R5: All transforms return NEW objects (immutable)
 * - E1: New entity types just need a registered config
 *
 * 3 NON-NEGOTIABLE:
 * 1. Easily extensible — new type = new config, bridge works automatically
 * 2. 3D-ready — Point2D → Point3D upgrade in configs, bridge adapts
 * 3. External apps — EntityRegistry is the single dispatch point
 */

import { IVec2 } from "../geometry/Vec2";
import { BoundingBox } from "../geometry/GeometryUtils";
import {
  IEntity,
  EntityType,
  EntityStyle,
  EntityState,
  EntityJSON,
  DEFAULT_STYLE,
  DEFAULT_STATE,
} from "./Entity.types";
import {
  UnifiedEntity,
  EntityGeometry,
  LineGeometry,
  PolylineGeometry,
  RectGeometry,
  CircleGeometry,
  ArcGeometry,
  EllipseGeometry,
  TextGeometry,
  DimensionGeometry,
  UnifiedEntityType,
  Point2D,
} from "./UnifiedEntity";
import { entityRegistry } from "./EntityRegistry";
import type { EntityGripPoint } from "./EntityData.types";

// Ensure all configs are registered
import "./configs/index";

// ==================== IEntity → UnifiedEntity ====================

/**
 * Convert IEntity (flat properties) to UnifiedEntity (nested geometry).
 * Works with both class instances and plain objects.
 */
export function iEntityToUnified(entity: IEntity): UnifiedEntity {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = entity as any;

  let geometry: EntityGeometry;

  switch (entity.type) {
    case EntityType.LINE:
      geometry = {
        type: "LINE",
        start: { x: e.start.x, y: e.start.y },
        end: { x: e.end.x, y: e.end.y },
      } as LineGeometry;
      break;

    case EntityType.RECT:
      geometry = {
        type: "RECT",
        origin: { x: e.origin.x, y: e.origin.y },
        width: e.width,
        height: e.height,
        rotation: e.rotation ?? 0,
      } as RectGeometry;
      break;

    case EntityType.CIRCLE:
      geometry = {
        type: "CIRCLE",
        center: { x: e.center.x, y: e.center.y },
        radius: e.radius,
      } as CircleGeometry;
      break;

    case EntityType.ARC:
      geometry = {
        type: "ARC",
        center: { x: e.center.x, y: e.center.y },
        radius: e.radius,
        startAngle: e.startAngle,
        endAngle: e.endAngle,
      } as ArcGeometry;
      break;

    case EntityType.ELLIPSE:
      geometry = {
        type: "ELLIPSE",
        center: { x: e.center.x, y: e.center.y },
        majorRadius: e.radiusX ?? e.majorRadius,
        minorRadius: e.radiusY ?? e.minorRadius,
        rotation: e.rotation ?? 0,
      } as EllipseGeometry;
      break;

    case EntityType.POLYLINE:
      geometry = {
        type: "POLYLINE",
        points: (e.points as IVec2[]).map((p: IVec2) => ({
          x: p.x,
          y: p.y,
        })),
        closed: e.closed ?? false,
      } as PolylineGeometry;
      break;

    case EntityType.TEXT:
      geometry = {
        type: "TEXT",
        position: { x: e.position.x, y: e.position.y },
        text: e.text ?? e.content ?? "",
        fontSize: e.fontSize ?? 12,
        fontFamily: e.fontFamily ?? "Arial",
        textAlign: e.textAlign ?? "left",
        rotation: e.rotation ?? 0,
      } as TextGeometry;
      break;

    case EntityType.DIMENSION:
      geometry = {
        type: "DIMENSION",
        startPoint: { x: e.startPoint.x, y: e.startPoint.y },
        endPoint: { x: e.endPoint.x, y: e.endPoint.y },
        textPosition: e.textPosition
          ? { x: e.textPosition.x, y: e.textPosition.y }
          : {
              x: (e.startPoint.x + e.endPoint.x) / 2,
              y: (e.startPoint.y + e.endPoint.y) / 2,
            },
        offset: e.offset ?? 30,
      } as DimensionGeometry;
      break;

    default:
      throw new Error(`EntityBridge: unsupported entity type '${entity.type}'`);
  }

  // Map EntityType enum to UnifiedEntityType
  const entityTypeMap: Record<string, UnifiedEntityType> = {
    [EntityType.LINE]: UnifiedEntityType.LINE,
    [EntityType.RECT]: UnifiedEntityType.RECT,
    [EntityType.CIRCLE]: UnifiedEntityType.CIRCLE,
    [EntityType.ARC]: UnifiedEntityType.ARC,
    [EntityType.ELLIPSE]: UnifiedEntityType.ELLIPSE,
    [EntityType.POLYLINE]: UnifiedEntityType.POLYLINE,
    [EntityType.TEXT]: UnifiedEntityType.TEXT,
    [EntityType.DIMENSION]: UnifiedEntityType.DIMENSION,
  };

  return {
    id: entity.id,
    entityType: entityTypeMap[entity.type] ?? UnifiedEntityType.LINE,
    geometry,
    style: {
      strokeColor: entity.style?.strokeColor ?? "#FFFFFF",
      strokeWidth: entity.style?.strokeWidth ?? 1,
      strokeStyle: entity.style?.strokeStyle ?? "solid",
      fillColor: entity.style?.fillColor ?? null,
      opacity: entity.style?.opacity ?? 1,
    },
    state: {
      selected: entity.state?.selected ?? false,
      hovered: entity.state?.hovered ?? false,
      visible: entity.state?.visible ?? true,
      locked: entity.state?.locked ?? false,
    },
    layerId: entity.layerId ?? "default",
    name: entity.name,
    metadata: entity.metadata,
  };
}

// ==================== UnifiedEntity → IEntity ====================

/**
 * Convert UnifiedEntity (nested geometry) back to IEntity (flat properties).
 * The returned object is a plain data object — no class methods.
 * Preserves style, state, layerId, name, metadata from template if provided.
 */
export function unifiedToIEntity(
  unified: UnifiedEntity,
  template?: Partial<IEntity>,
): IEntity {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    id: unified.id,
    type:
      template?.type ??
      (unified.geometry.type as unknown as EntityType) ??
      EntityType.LINE,
    layerId: template?.layerId ?? unified.layerId ?? "default",
    name: template?.name ?? unified.name,
    style: template?.style
      ? { ...template.style }
      : {
          strokeColor: unified.style.strokeColor,
          strokeWidth: unified.style.strokeWidth,
          strokeStyle: unified.style.strokeStyle,
          fillColor: unified.style.fillColor,
          opacity: unified.style.opacity,
        },
    state: template?.state
      ? { ...template.state }
      : {
          selected: unified.state.selected,
          hovered: unified.state.hovered,
          visible: unified.state.visible,
          locked: unified.state.locked,
        },
    metadata: template?.metadata ?? unified.metadata,
  };

  // Spread geometry properties flat (to match IEntity shape)
  const geom = unified.geometry;
  switch (geom.type) {
    case "LINE":
      result.start = { x: geom.start.x, y: geom.start.y };
      result.end = { x: geom.end.x, y: geom.end.y };
      break;

    case "RECT":
      result.origin = { x: geom.origin.x, y: geom.origin.y };
      result.width = geom.width;
      result.height = geom.height;
      result.rotation = geom.rotation;
      break;

    case "CIRCLE":
      result.center = { x: geom.center.x, y: geom.center.y };
      result.radius = geom.radius;
      break;

    case "ARC":
      result.center = { x: geom.center.x, y: geom.center.y };
      result.radius = geom.radius;
      result.startAngle = geom.startAngle;
      result.endAngle = geom.endAngle;
      break;

    case "ELLIPSE":
      result.center = { x: geom.center.x, y: geom.center.y };
      result.radiusX = geom.majorRadius;
      result.radiusY = geom.minorRadius;
      result.rotation = geom.rotation;
      break;

    case "POLYLINE":
      result.points = geom.points.map((p: Point2D) => ({ x: p.x, y: p.y }));
      result.closed = geom.closed;
      break;

    case "TEXT":
      result.position = { x: geom.position.x, y: geom.position.y };
      result.text = geom.text;
      result.fontSize = geom.fontSize;
      result.fontFamily = geom.fontFamily;
      result.textAlign = geom.textAlign;
      result.rotation = geom.rotation;
      break;

    case "DIMENSION":
      result.startPoint = { x: geom.startPoint.x, y: geom.startPoint.y };
      result.endPoint = { x: geom.endPoint.x, y: geom.endPoint.y };
      result.textPosition = {
        x: geom.textPosition.x,
        y: geom.textPosition.y,
      };
      result.offset = geom.offset;
      break;
  }

  return result as IEntity;
}

// ==================== Transform Operations via EntityRegistry ====================

/**
 * Translate an IEntity by (dx, dy) → returns NEW IEntity.
 * Delegates math to EntityRegistry.
 */
export function translateIEntity(
  entity: IEntity,
  dx: number,
  dy: number,
): IEntity {
  const unified = iEntityToUnified(entity);
  const translated = entityRegistry.translate(unified, dx, dy);
  return unifiedToIEntity(translated, entity);
}

/**
 * Rotate an IEntity around center by angle → returns NEW IEntity.
 */
export function rotateIEntity(
  entity: IEntity,
  angle: number,
  center: IVec2,
): IEntity {
  const unified = iEntityToUnified(entity);
  const rotated = entityRegistry.rotate(unified, angle, {
    x: center.x,
    y: center.y,
  });
  return unifiedToIEntity(rotated, entity);
}

/**
 * Scale an IEntity from center → returns NEW IEntity.
 */
export function scaleIEntity(
  entity: IEntity,
  sx: number,
  sy: number,
  center: IVec2,
): IEntity {
  const unified = iEntityToUnified(entity);
  const scaled = entityRegistry.scale(unified, sx, sy, {
    x: center.x,
    y: center.y,
  });
  return unifiedToIEntity(scaled, entity);
}

/**
 * Mirror an IEntity across axis → returns NEW IEntity.
 */
export function mirrorIEntity(
  entity: IEntity,
  axisStart: IVec2,
  axisEnd: IVec2,
): IEntity {
  const unified = iEntityToUnified(entity);
  const mirrored = entityRegistry.mirror(
    unified,
    { x: axisStart.x, y: axisStart.y },
    { x: axisEnd.x, y: axisEnd.y },
  );
  return unifiedToIEntity(mirrored, entity);
}

// ==================== Query Operations via EntityRegistry ====================

/**
 * Get bounding box of an IEntity via EntityRegistry.
 */
export function getIEntityBounds(entity: IEntity): BoundingBox {
  const unified = iEntityToUnified(entity);
  const bounds = entityRegistry.getBounds(unified);
  return {
    min: { x: bounds.min.x, y: bounds.min.y },
    max: { x: bounds.max.x, y: bounds.max.y },
  };
}

/**
 * Hit test: check if a point is within tolerance of an IEntity.
 */
export function iEntityContainsPoint(
  entity: IEntity,
  point: IVec2,
  tolerance: number,
): boolean {
  const unified = iEntityToUnified(entity);
  return entityRegistry.containsPoint(
    unified,
    { x: point.x, y: point.y },
    tolerance,
  );
}

/**
 * Get grip points for an IEntity.
 */
export function getIEntityGripPoints(entity: IEntity): EntityGripPoint[] {
  const unified = iEntityToUnified(entity);
  return entityRegistry.getGripPoints(unified);
}

/**
 * Clone an IEntity → returns NEW IEntity with new ID.
 */
export function cloneIEntity(entity: IEntity): IEntity {
  const unified = iEntityToUnified(entity);
  const cloned = entityRegistry.clone(unified);
  return unifiedToIEntity(cloned, entity);
}

/**
 * Serialize an IEntity to JSON via EntityRegistry.
 */
export function serializeIEntity(entity: IEntity): Record<string, unknown> {
  const unified = iEntityToUnified(entity);
  const config = entityRegistry.get(unified.geometry.type);
  return config.serialize(unified);
}

/**
 * Deserialize an IEntity from JSON via EntityRegistry.
 */
export function deserializeIEntity(
  type: string,
  data: Record<string, unknown>,
): IEntity {
  const config = entityRegistry.get(type);
  const unified = config.deserialize(data);
  return unifiedToIEntity(unified);
}
