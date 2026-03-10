/**
 * SvgEntityFactory — Pure SVG string generation from CAD entities
 * Extracted from SvgAdapter (STEP-5.13)
 */

import { EntityType } from "../../core/entities/Entity.types";
import { LineEntity } from "../../core/entities/Line";
import { RectEntity } from "../../core/entities/Rect";
import { CircleEntity } from "../../core/entities/Circle";
import { ArcEntity } from "../../core/entities/Arc";
import { PolylineEntity } from "../../core/entities/Polyline";
import { TextEntity } from "../../core/entities/Text";
import { DimensionEntity } from "../../core/entities/Dimension";
import { Vec2 } from "../../core/geometry/Vec2";
import { RenderOptions, StrokeStyle, TextStyle } from "./CanvasAdapter";

// ===== SVG Element Interface =====
export interface SvgElement {
  id: string;
  type: string;
  svgString: string;
  bounds: { min: Vec2; max: Vec2 };
  entityId?: string;
}

// ===== Default Styles =====
export const DEFAULT_STROKE: StrokeStyle = {
  color: "#000000",
  width: 1,
  lineCap: "round",
  lineJoin: "round",
  opacity: 1,
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "Arial",
  fontSize: 12,
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#000000",
  textAlign: "left",
};

// Local Entity type union
export type Entity =
  | LineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | PolylineEntity
  | TextEntity
  | DimensionEntity;

// ===== Entity → SVG String Conversion =====

export function entityToSvg(
  entity: Entity,
  options?: RenderOptions,
  defsElement?: SVGDefsElement | null
): string {
  const entityColor =
    "style" in entity && entity.style?.strokeColor
      ? entity.style.strokeColor
      : "#000000";
  const stroke = options?.stroke ?? { ...DEFAULT_STROKE, color: entityColor };
  const fill = options?.fill ?? { color: "none", opacity: 0 };

  switch (entity.type) {
    case EntityType.LINE:
      return lineToSvg(entity as LineEntity, stroke);
    case EntityType.RECT:
      return rectToSvg(entity as RectEntity, stroke, fill);
    case EntityType.CIRCLE:
      return circleToSvg(entity as CircleEntity, stroke, fill);
    case EntityType.ARC:
      return arcToSvg(entity as ArcEntity, stroke);
    case EntityType.POLYLINE:
      return polylineToSvg(entity as PolylineEntity, stroke, fill);
    case EntityType.TEXT:
      return textToSvg(entity as TextEntity, options?.text);
    case EntityType.DIMENSION:
      return dimensionToSvg(
        entity as DimensionEntity,
        stroke,
        defsElement ?? null,
        options?.text
      );
    default:
      return "";
  }
}

// ===== Private Converters =====

function lineToSvg(entity: LineEntity, stroke: StrokeStyle): string {
  const dashArray = stroke.dashArray
    ? `stroke-dasharray="${stroke.dashArray.join(",")}"`
    : "";
  return `<line x1="${entity.start.x}" y1="${entity.start.y}" x2="${
    entity.end.x
  }" y2="${entity.end.y}" 
      stroke="${stroke.color}" stroke-width="${stroke.width}" 
      stroke-linecap="${stroke.lineCap ?? "round"}" stroke-linejoin="${
    stroke.lineJoin ?? "round"
  }"
      ${dashArray} opacity="${stroke.opacity ?? 1}"/>`;
}

function rectToSvg(
  entity: RectEntity,
  stroke: StrokeStyle,
  fill: { color: string; opacity?: number }
): string {
  const transform =
    entity.rotation !== 0
      ? `transform="rotate(${(entity.rotation * 180) / Math.PI}, ${
          entity.origin.x + entity.width / 2
        }, ${entity.origin.y + entity.height / 2})"`
      : "";
  return `<rect x="${entity.origin.x}" y="${entity.origin.y}" 
      width="${entity.width}" height="${entity.height}"
      stroke="${stroke.color}" stroke-width="${stroke.width}"
      fill="${fill.color}" fill-opacity="${fill.opacity ?? 1}"
      ${transform}/>`;
}

function circleToSvg(
  entity: CircleEntity,
  stroke: StrokeStyle,
  fill: { color: string; opacity?: number }
): string {
  return `<circle cx="${entity.center.x}" cy="${entity.center.y}" r="${
    entity.radius
  }"
      stroke="${stroke.color}" stroke-width="${stroke.width}"
      fill="${fill.color}" fill-opacity="${fill.opacity ?? 1}"/>`;
}

function arcToSvg(entity: ArcEntity, stroke: StrokeStyle): string {
  const { center, radius, startAngle, endAngle } = entity;

  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);

  const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 1 : 0;

  return `<path d="M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}"
      stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none"/>`;
}

function polylineToSvg(
  entity: PolylineEntity,
  stroke: StrokeStyle,
  fill: { color: string; opacity?: number }
): string {
  const points = entity.points.map((p) => `${p.x},${p.y}`).join(" ");
  const tag = entity.closed ? "polygon" : "polyline";
  const fillValue = entity.closed ? fill.color : "none";

  return `<${tag} points="${points}"
      stroke="${stroke.color}" stroke-width="${stroke.width}"
      fill="${fillValue}" fill-opacity="${fill.opacity ?? 1}"
      stroke-linecap="${stroke.lineCap ?? "round"}" stroke-linejoin="${
    stroke.lineJoin ?? "round"
  }"/>`;
}

function textToSvg(entity: TextEntity, textStyle?: TextStyle): string {
  const entityColor = entity.style?.strokeColor ?? "#000000";
  const style = textStyle ?? { ...DEFAULT_TEXT_STYLE, color: entityColor };
  const transform =
    entity.rotation !== 0
      ? `transform="rotate(${(entity.rotation * 180) / Math.PI}, ${
          entity.position.x
        }, ${entity.position.y})"`
      : "";

  return `<text x="${entity.position.x}" y="${entity.position.y}"
      font-family="${style.fontFamily}" font-size="${style.fontSize}"
      font-weight="${style.fontWeight ?? "normal"}" font-style="${
    style.fontStyle ?? "normal"
  }"
      fill="${style.color}" text-anchor="${getTextAnchor(style.textAlign)}"
      ${transform}>${escapeXml(entity.text)}</text>`;
}

function dimensionToSvg(
  entity: DimensionEntity,
  stroke: StrokeStyle,
  defsElement: SVGDefsElement | null,
  textStyle?: TextStyle
): string {
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

  // Display value
  const displayValue =
    value !== undefined ? value : startPoint.distanceTo(endPoint);
  const text = `${prefix ?? ""}${displayValue.toFixed(precision ?? 2)}${
    suffix ?? ""
  }`;
  const entityColor = entity.style?.strokeColor ?? "#000000";
  const style = textStyle ?? { ...DEFAULT_TEXT_STYLE, color: entityColor };

  const svg = `
      <g class="dimension">
        <!-- Extension lines -->
        <line x1="${startPoint.x}" y1="${startPoint.y}" x2="${
    dimStart.x
  }" y2="${dimStart.y}"
          stroke="${stroke.color}" stroke-width="${stroke.width * 0.5}"/>
        <line x1="${endPoint.x}" y1="${endPoint.y}" x2="${dimEnd.x}" y2="${
    dimEnd.y
  }"
          stroke="${stroke.color}" stroke-width="${stroke.width * 0.5}"/>
        <!-- Dimension line -->
        <line x1="${dimStart.x}" y1="${dimStart.y}" x2="${dimEnd.x}" y2="${
    dimEnd.y
  }"
          stroke="${stroke.color}" stroke-width="${stroke.width}"
          marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>
        <!-- Text -->
        <text x="${midPoint.x}" y="${midPoint.y - 5}"
          font-family="${style.fontFamily}" font-size="${style.fontSize}"
          fill="${style.color}" text-anchor="middle">${text}</text>
      </g>
    `;

  // Add arrowhead marker to defs if not exists
  ensureArrowheadMarker(defsElement, stroke.color);

  return svg;
}

// ===== SVG Utility Helpers =====

export function ensureArrowheadMarker(
  defsElement: SVGDefsElement | null,
  color: string
): void {
  if (!defsElement) return;

  const existingMarker = defsElement.querySelector("#arrowhead");
  if (!existingMarker) {
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    marker.innerHTML = `<polygon points="0 0, 10 3.5, 0 7" fill="${color}"/>`;
    defsElement.appendChild(marker);
  }
}

export function getTextAnchor(align?: string): string {
  switch (align) {
    case "center":
      return "middle";
    case "right":
      return "end";
    default:
      return "start";
  }
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
