/**
 * SvgPrimitiveDrawer — Standalone SVG primitive drawing API
 * Extracted from SvgAdapter (STEP-5.13)
 */

import { Vec2 } from "../../core/geometry/Vec2";
import {
  RenderOptions,
  RenderedObject,
  StrokeStyle,
  TextStyle,
} from "./CanvasAdapter";
import { DEFAULT_STROKE, DEFAULT_TEXT_STYLE } from "./SvgEntityFactory";

// ===== ID Generation =====

export function generateSvgId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== Primitive Drawing Functions =====

export function drawLine(
  mainGroup: SVGGElement | null,
  start: Vec2,
  end: Vec2,
  style?: StrokeStyle
): RenderedObject {
  const stroke = style ?? DEFAULT_STROKE;
  const id = generateSvgId("line");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("id", id);
  line.setAttribute("x1", `${start.x}`);
  line.setAttribute("y1", `${start.y}`);
  line.setAttribute("x2", `${end.x}`);
  line.setAttribute("y2", `${end.y}`);
  line.setAttribute("stroke", stroke.color);
  line.setAttribute("stroke-width", `${stroke.width}`);

  mainGroup?.appendChild(line);

  return {
    id,
    type: "line",
    bounds: {
      min: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
      max: { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
    },
  };
}

export function drawRect(
  mainGroup: SVGGElement | null,
  position: Vec2,
  width: number,
  height: number,
  style?: RenderOptions
): RenderedObject {
  const stroke = style?.stroke ?? DEFAULT_STROKE;
  const fill = style?.fill ?? { color: "none" };
  const id = generateSvgId("rect");

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("id", id);
  rect.setAttribute("x", `${position.x}`);
  rect.setAttribute("y", `${position.y}`);
  rect.setAttribute("width", `${width}`);
  rect.setAttribute("height", `${height}`);
  rect.setAttribute("stroke", stroke.color);
  rect.setAttribute("stroke-width", `${stroke.width}`);
  rect.setAttribute("fill", fill.color);

  mainGroup?.appendChild(rect);

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
  mainGroup: SVGGElement | null,
  center: Vec2,
  radius: number,
  style?: RenderOptions
): RenderedObject {
  const stroke = style?.stroke ?? DEFAULT_STROKE;
  const fill = style?.fill ?? { color: "none" };
  const id = generateSvgId("circle");

  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("id", id);
  circle.setAttribute("cx", `${center.x}`);
  circle.setAttribute("cy", `${center.y}`);
  circle.setAttribute("r", `${radius}`);
  circle.setAttribute("stroke", stroke.color);
  circle.setAttribute("stroke-width", `${stroke.width}`);
  circle.setAttribute("fill", fill.color);

  mainGroup?.appendChild(circle);

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
  mainGroup: SVGGElement | null,
  center: Vec2,
  radius: number,
  startAngle: number,
  endAngle: number,
  style?: StrokeStyle
): RenderedObject {
  const stroke = style ?? DEFAULT_STROKE;
  const id = generateSvgId("arc");

  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);

  const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 1 : 0;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", id);
  path.setAttribute(
    "d",
    `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`
  );
  path.setAttribute("stroke", stroke.color);
  path.setAttribute("stroke-width", `${stroke.width}`);
  path.setAttribute("fill", "none");

  mainGroup?.appendChild(path);

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
  mainGroup: SVGGElement | null,
  points: Vec2[],
  closed: boolean,
  style?: RenderOptions
): RenderedObject {
  const stroke = style?.stroke ?? DEFAULT_STROKE;
  const fill = style?.fill ?? { color: "none" };
  const id = generateSvgId("polyline");

  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    closed ? "polygon" : "polyline"
  );
  element.setAttribute("id", id);
  element.setAttribute("points", pointsStr);
  element.setAttribute("stroke", stroke.color);
  element.setAttribute("stroke-width", `${stroke.width}`);
  element.setAttribute("fill", closed ? fill.color : "none");

  mainGroup?.appendChild(element);

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
  mainGroup: SVGGElement | null,
  position: Vec2,
  text: string,
  style?: TextStyle
): RenderedObject {
  const textStyle = style ?? DEFAULT_TEXT_STYLE;
  const id = generateSvgId("text");

  const textElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  textElement.setAttribute("id", id);
  textElement.setAttribute("x", `${position.x}`);
  textElement.setAttribute("y", `${position.y}`);
  textElement.setAttribute("font-family", textStyle.fontFamily);
  textElement.setAttribute("font-size", `${textStyle.fontSize}`);
  textElement.setAttribute("fill", textStyle.color);
  textElement.textContent = text;

  mainGroup?.appendChild(textElement);

  // Estimate text bounds (rough approximation)
  const estimatedWidth = text.length * textStyle.fontSize * 0.6;
  const estimatedHeight = textStyle.fontSize;

  return {
    id,
    type: "text",
    bounds: {
      min: position,
      max: {
        x: position.x + estimatedWidth,
        y: position.y + estimatedHeight,
      },
    },
  };
}

export function drawPath(
  mainGroup: SVGGElement | null,
  pathData: string,
  style?: RenderOptions
): RenderedObject {
  const stroke = style?.stroke ?? DEFAULT_STROKE;
  const fill = style?.fill ?? { color: "none" };
  const id = generateSvgId("path");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", id);
  path.setAttribute("d", pathData);
  path.setAttribute("stroke", stroke.color);
  path.setAttribute("stroke-width", `${stroke.width}`);
  path.setAttribute("fill", fill.color);

  mainGroup?.appendChild(path);

  // Get bounding box after adding to DOM
  const bbox = path.getBBox();

  return {
    id,
    type: "path",
    bounds: {
      min: { x: bbox.x, y: bbox.y },
      max: { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
    },
  };
}
