/**
 * FabricPrimitiveDrawer.ts
 *
 * STEP-5.11: Extracted from FabricAdapter.ts
 * Standalone primitive drawing API — draws shapes not tied to CAD entities.
 * Each function creates a Fabric object, adds to canvas, returns RenderedObject.
 */

import * as fabric from "fabric";
import type { Vec2 } from "../../core/geometry/Vec2";
import type { RenderOptions, StrokeStyle, TextStyle, RenderedObject } from "./CanvasAdapter";
import { DEFAULT_STROKE, DEFAULT_FILL, DEFAULT_TEXT_STYLE } from "./FabricEntityFactory";

// ============================================
// ID GENERATOR
// ============================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// PRIMITIVE DRAWING FUNCTIONS
// ============================================

export function drawLine(
  canvas: fabric.Canvas,
  start: Vec2,
  end: Vec2,
  style?: StrokeStyle,
): RenderedObject {
  const stroke = style ?? DEFAULT_STROKE;
  const line = new fabric.Line([start.x, start.y, end.x, end.y], {
    stroke: stroke.color,
    strokeWidth: stroke.width,
    strokeLineCap: stroke.lineCap,
    strokeLineJoin: stroke.lineJoin,
    strokeDashArray: stroke.dashArray,
    selectable: false,
    evented: false,
  });

  const id = generateId("line");
  canvas.add(line);
  canvas.requestRenderAll();

  return {
    id,
    type: "line",
    bounds: { min: start, max: end },
  };
}

export function drawRect(
  canvas: fabric.Canvas,
  position: Vec2,
  width: number,
  height: number,
  style?: RenderOptions,
): RenderedObject {
  const stroke = style?.stroke ?? DEFAULT_STROKE;
  const fill = style?.fill ?? DEFAULT_FILL;

  const rect = new fabric.Rect({
    left: position.x,
    top: position.y,
    width,
    height,
    stroke: stroke.color,
    strokeWidth: stroke.width,
    fill: fill.color,
    opacity: fill.opacity ?? 1,
    selectable: false,
    evented: false,
  });

  const id = generateId("rect");
  canvas.add(rect);
  canvas.requestRenderAll();

  return {
    id,
    type: "rect",
    bounds: {
      min: position,
      max: { x: position.x + width, y: position.y + height },
    },
  };
}

export function drawCircle(
  canvas: fabric.Canvas,
  center: Vec2,
  radius: number,
  style?: RenderOptions,
): RenderedObject {
  const stroke = style?.stroke ?? DEFAULT_STROKE;
  const fill = style?.fill ?? DEFAULT_FILL;

  const circle = new fabric.Circle({
    left: center.x - radius,
    top: center.y - radius,
    radius,
    stroke: stroke.color,
    strokeWidth: stroke.width,
    fill: fill.color,
    opacity: fill.opacity ?? 1,
    selectable: false,
    evented: false,
  });

  const id = generateId("circle");
  canvas.add(circle);
  canvas.requestRenderAll();

  return {
    id,
    type: "circle",
    bounds: {
      min: { x: center.x - radius, y: center.y - radius },
      max: { x: center.x + radius, y: center.y + radius },
    },
  };
}

export function drawArc(
  canvas: fabric.Canvas,
  center: Vec2,
  radius: number,
  startAngle: number,
  endAngle: number,
  style?: StrokeStyle,
): RenderedObject {
  const stroke = style ?? DEFAULT_STROKE;

  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);

  const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 1 : 0;

  const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

  const path = new fabric.Path(pathData, {
    stroke: stroke.color,
    strokeWidth: stroke.width,
    fill: "transparent",
    selectable: false,
    evented: false,
  });

  const id = generateId("arc");
  canvas.add(path);
  canvas.requestRenderAll();

  return {
    id,
    type: "arc",
    bounds: {
      min: { x: center.x - radius, y: center.y - radius },
      max: { x: center.x + radius, y: center.y + radius },
    },
  };
}

export function drawPolyline(
  canvas: fabric.Canvas,
  points: Vec2[],
  closed: boolean,
  style?: RenderOptions,
): RenderedObject {
  const stroke = style?.stroke ?? DEFAULT_STROKE;
  const fill = style?.fill ?? DEFAULT_FILL;
  const fabricPoints = points.map((p) => ({ x: p.x, y: p.y }));

  const poly = closed
    ? new fabric.Polygon(fabricPoints, {
        stroke: stroke.color,
        strokeWidth: stroke.width,
        fill: fill.color,
        opacity: fill.opacity ?? 1,
        selectable: false,
        evented: false,
      })
    : new fabric.Polyline(fabricPoints, {
        stroke: stroke.color,
        strokeWidth: stroke.width,
        fill: "transparent",
        selectable: false,
        evented: false,
      });

  const id = generateId("polyline");
  canvas.add(poly);
  canvas.requestRenderAll();

  // Calculate bounds
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    id,
    type: closed ? "polygon" : "polyline",
    bounds: { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } },
  };
}

export function drawText(
  canvas: fabric.Canvas,
  position: Vec2,
  text: string,
  style?: TextStyle,
): RenderedObject {
  const textStyle = style ?? DEFAULT_TEXT_STYLE;

  const textObj = new fabric.Text(text, {
    left: position.x,
    top: position.y,
    fontSize: textStyle.fontSize,
    fontFamily: textStyle.fontFamily,
    fontWeight: textStyle.fontWeight,
    fontStyle: textStyle.fontStyle,
    fill: textStyle.color,
    textAlign: textStyle.textAlign,
    selectable: false,
    evented: false,
  });

  const id = generateId("text");
  canvas.add(textObj);
  canvas.requestRenderAll();

  const bounds = textObj.getBoundingRect();
  return {
    id,
    type: "text",
    bounds: {
      min: { x: bounds.left, y: bounds.top },
      max: { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
    },
  };
}

export function drawPath(
  canvas: fabric.Canvas,
  pathData: string,
  style?: RenderOptions,
): RenderedObject {
  const stroke = style?.stroke ?? DEFAULT_STROKE;
  const fill = style?.fill ?? DEFAULT_FILL;

  const path = new fabric.Path(pathData, {
    stroke: stroke.color,
    strokeWidth: stroke.width,
    fill: fill.color,
    opacity: fill.opacity ?? 1,
    selectable: false,
    evented: false,
  });

  const id = generateId("path");
  canvas.add(path);
  canvas.requestRenderAll();

  const bounds = path.getBoundingRect();
  return {
    id,
    type: "path",
    bounds: {
      min: { x: bounds.left, y: bounds.top },
      max: { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
    },
  };
}
