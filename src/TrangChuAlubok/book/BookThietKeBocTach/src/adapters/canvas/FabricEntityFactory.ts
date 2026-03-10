/**
 * FabricEntityFactory.ts
 *
 * STEP-5.11: Extracted from FabricAdapter.ts
 * Pure factory functions that convert CAD entities → Fabric.js objects.
 * Stateless — no dependency on canvas state.
 */

import * as fabric from "fabric";
import { Vec2 } from "../../core/geometry/Vec2";
import { EntityType } from "../../core/entities/Entity.types";
import type { LineEntity } from "../../core/entities/Line";
import type { RectEntity } from "../../core/entities/Rect";
import type { CircleEntity } from "../../core/entities/Circle";
import type { ArcEntity } from "../../core/entities/Arc";
import type { PolylineEntity } from "../../core/entities/Polyline";
import type { TextEntity } from "../../core/entities/Text";
import type { DimensionEntity } from "../../core/entities/Dimension";
import type { RenderOptions, StrokeStyle, TextStyle } from "./CanvasAdapter";

// Entity union type
export type Entity =
  | LineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | PolylineEntity
  | TextEntity
  | DimensionEntity;

// ===== Default Styles =====
export const DEFAULT_STROKE: StrokeStyle = {
  color: "#ffffff",
  width: 1,
  lineCap: "round",
  lineJoin: "round",
  opacity: 1,
};

export const DEFAULT_FILL = {
  color: "transparent",
  opacity: 0,
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "Arial",
  fontSize: 12,
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#ffffff",
  textAlign: "left",
};

// ============================================
// MAIN DISPATCHER
// ============================================

/**
 * Creates a Fabric.js object from a CAD entity.
 * Routes to the appropriate factory based on entity type.
 */
export function createFabricObject(
  entity: Entity,
  options?: RenderOptions,
): fabric.FabricObject | null {
  const entityColor =
    "style" in entity && entity.style?.strokeColor
      ? entity.style.strokeColor
      : "#ffffff";
  const stroke = options?.stroke ?? { ...DEFAULT_STROKE, color: entityColor };
  const fill = options?.fill ?? DEFAULT_FILL;

  switch (entity.type) {
    case EntityType.LINE:
      return createLineObject(entity as LineEntity, stroke);

    case EntityType.RECT:
      return createRectObject(entity as RectEntity, stroke, fill);

    case EntityType.CIRCLE:
      return createCircleObject(entity as CircleEntity, stroke, fill);

    case EntityType.ARC:
      return createArcObject(entity as ArcEntity, stroke);

    case EntityType.POLYLINE:
      return createPolylineObject(entity as PolylineEntity, stroke, fill);

    case EntityType.TEXT:
      return createTextObject(entity as TextEntity, options?.text);

    case EntityType.DIMENSION:
      return createDimensionObject(
        entity as DimensionEntity,
        stroke,
        options?.text,
      );

    default:
      console.warn(
        `Unknown entity type: ${(entity as { type: string }).type}`,
      );
      return null;
  }
}

// ============================================
// ENTITY-SPECIFIC FACTORIES
// ============================================

function createLineObject(
  entity: LineEntity,
  stroke: StrokeStyle,
): fabric.Line {
  return new fabric.Line(
    [entity.start.x, entity.start.y, entity.end.x, entity.end.y],
    {
      stroke: stroke.color,
      strokeWidth: stroke.width,
      strokeLineCap: stroke.lineCap,
      strokeLineJoin: stroke.lineJoin,
      strokeDashArray: stroke.dashArray,
      selectable: false,
      evented: false,
    },
  );
}

function createRectObject(
  entity: RectEntity,
  stroke: StrokeStyle,
  fill: { color: string; opacity?: number },
): fabric.Rect {
  return new fabric.Rect({
    left: entity.origin.x,
    top: entity.origin.y,
    width: entity.width,
    height: entity.height,
    angle: (entity.rotation * 180) / Math.PI,
    stroke: stroke.color,
    strokeWidth: stroke.width,
    fill: fill.color,
    opacity: fill.opacity ?? 1,
    selectable: false,
    evented: false,
  });
}

function createCircleObject(
  entity: CircleEntity,
  stroke: StrokeStyle,
  fill: { color: string; opacity?: number },
): fabric.Circle {
  return new fabric.Circle({
    left: entity.center.x - entity.radius,
    top: entity.center.y - entity.radius,
    radius: entity.radius,
    stroke: stroke.color,
    strokeWidth: stroke.width,
    fill: fill.color,
    opacity: fill.opacity ?? 1,
    selectable: false,
    evented: false,
  });
}

function createArcObject(
  entity: ArcEntity,
  stroke: StrokeStyle,
): fabric.Path {
  const { center, radius, startAngle, endAngle } = entity;

  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);

  const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 1 : 0;

  const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

  return new fabric.Path(pathData, {
    stroke: stroke.color,
    strokeWidth: stroke.width,
    fill: "transparent",
    selectable: false,
    evented: false,
  });
}

function createPolylineObject(
  entity: PolylineEntity,
  stroke: StrokeStyle,
  fill: { color: string; opacity?: number },
): fabric.Polyline | fabric.Polygon {
  const points = entity.points.map((p) => ({ x: p.x, y: p.y }));

  if (entity.closed) {
    return new fabric.Polygon(points, {
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: fill.color,
      opacity: fill.opacity ?? 1,
      selectable: false,
      evented: false,
    });
  } else {
    return new fabric.Polyline(points, {
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: "transparent",
      selectable: false,
      evented: false,
    });
  }
}

function createTextObject(
  entity: TextEntity,
  textStyle?: TextStyle,
): fabric.Text {
  const entityColor = entity.style?.strokeColor ?? "#ffffff";
  const style = textStyle ?? { ...DEFAULT_TEXT_STYLE, color: entityColor };

  return new fabric.Text(entity.text, {
    left: entity.position.x,
    top: entity.position.y,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    fill: style.color,
    textAlign: style.textAlign,
    angle: (entity.rotation * 180) / Math.PI,
    selectable: false,
    evented: false,
  });
}

function createDimensionObject(
  entity: DimensionEntity,
  stroke: StrokeStyle,
  textStyle?: TextStyle,
): fabric.Group {
  const { startPoint, endPoint, offset, value, prefix, suffix, dimStyle } =
    entity;
  const precision = dimStyle.precision;

  // Calculate dimension line position
  const direction = endPoint.sub(startPoint).normalize();
  const perpendicular = new Vec2(-direction.y, direction.x);
  const offsetVec = perpendicular.mul(offset);

  const dimStart = startPoint.add(offsetVec);
  const dimEnd = endPoint.add(offsetVec);
  const midPoint = dimStart.add(dimEnd).mul(0.5);

  // Create extension lines
  const extLine1 = new fabric.Line(
    [startPoint.x, startPoint.y, dimStart.x, dimStart.y],
    { stroke: stroke.color, strokeWidth: stroke.width * 0.5 },
  );

  const extLine2 = new fabric.Line(
    [endPoint.x, endPoint.y, dimEnd.x, dimEnd.y],
    { stroke: stroke.color, strokeWidth: stroke.width * 0.5 },
  );

  // Create dimension line
  const dimLine = new fabric.Line(
    [dimStart.x, dimStart.y, dimEnd.x, dimEnd.y],
    { stroke: stroke.color, strokeWidth: stroke.width },
  );

  // Create text
  const displayValue =
    value !== undefined ? value : startPoint.distanceTo(endPoint);
  const text = `${prefix ?? ""}${displayValue.toFixed(precision ?? 2)}${
    suffix ?? ""
  }`;
  const entityColor = entity.style?.strokeColor ?? "#ffffff";
  const style = textStyle ?? { ...DEFAULT_TEXT_STYLE, color: entityColor };

  const dimText = new fabric.Text(text, {
    left: midPoint.x,
    top: midPoint.y - 10,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fill: style.color,
    textAlign: "center",
    originX: "center",
    originY: "bottom",
  });

  // Create arrow heads
  const arrowSize = 8;
  const arrow1 = createArrowHead(dimStart, direction, arrowSize, stroke.color);
  const arrow2 = createArrowHead(
    dimEnd,
    direction.mul(-1),
    arrowSize,
    stroke.color,
  );

  return new fabric.Group(
    [extLine1, extLine2, dimLine, arrow1, arrow2, dimText],
    {
      selectable: false,
      evented: false,
    },
  );
}

// ============================================
// HELPERS
// ============================================

export function createArrowHead(
  tip: Vec2,
  direction: Vec2,
  size: number,
  color: string,
): fabric.Triangle {
  const angle = (Math.atan2(direction.y, direction.x) * 180) / Math.PI;

  return new fabric.Triangle({
    left: tip.x,
    top: tip.y,
    width: size,
    height: size * 0.6,
    fill: color,
    angle: angle + 90,
    originX: "center",
    originY: "center",
  });
}

/**
 * Builds a RenderedObject from an entity and its bounds.
 */
export function createRenderedObject(
  id: string,
  entity: Entity,
  _fabricObj: fabric.FabricObject | null,
): {
  id: string;
  entityId: string;
  type: string;
  bounds: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  };
} {
  let bounds: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  };
  if ("getBounds" in entity && typeof entity.getBounds === "function") {
    bounds = entity.getBounds();
  } else {
    bounds = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  }

  return {
    id,
    entityId: entity.id,
    type: entity.type,
    bounds: {
      min: bounds.min,
      max: bounds.max,
    },
  };
}
