/**
 * ExportSVGCore — IEntity-based SVG export for CAD documents
 * Phase 5.3: Reads from CadDocument (core IEntity data), no canvas dependency.
 *
 * Complies with:
 *   R2: Reads from CadDocument entities (not canvas render state)
 *   R6: No preview data in export
 *
 * Entity mapping:
 *   LINE       → <line>
 *   RECT       → <rect> (with rotation via transform)
 *   CIRCLE     → <circle>
 *   ARC        → <path> (SVG arc command)
 *   ELLIPSE    → <ellipse> (with rotation via transform)
 *   POLYLINE   → <polyline> or <polygon> (if closed)
 *   TEXT       → <text> with counter-flip for readability
 *   DIMENSION  → <g> with line + text
 *
 * Coordinate system:
 *   CAD uses Y-up, SVG uses Y-down.
 *   Solution: viewBox flips Y via negative Y start, entities rendered
 *   inside <g transform="scale(1,-1)">. Text gets double-flip to stay readable.
 */

import type { CadDocument } from "../document/CadDocument";
import type { ExportResult } from "./ExportManager";
import type {
  IEntity,
  ILineEntity,
  IRectEntity,
  ICircleEntity,
  IArcEntity,
  IEllipseEntity,
  IPolylineEntity,
  ITextEntity,
  IDimensionEntity,
} from "../entities/Entity.types";
import { EntityType } from "../entities/Entity.types";

// ==================== Export Options ====================

export interface SVGExportOptions {
  /** Document title for SVG <title> element */
  title?: string;
  /** Background color (default: "#1a1a2e") */
  backgroundColor?: string;
  /** Transparent background (no bg rect) */
  transparent?: boolean;
  /** Scale factor (default: 1) */
  scale?: number;
  /** Padding in world/mm units (default: 10) */
  padding?: number;
  /** Export mode: "world" (mm dimensions) or "preview" (100% fit) */
  exportMode?: "world" | "preview";
  /** Include hidden entities (default: false) */
  includeHidden?: boolean;
  /** Include text entities (default: true) */
  includeText?: boolean;
  /** Include dimension entities (default: true) */
  includeDimensions?: boolean;
  /** Stroke width override for all entities (null = use entity style) */
  strokeWidthOverride?: number | null;
}

const DEFAULT_SVG_OPTIONS: Required<SVGExportOptions> = {
  title: "CAD Drawing",
  backgroundColor: "#1a1a2e",
  transparent: false,
  scale: 1,
  padding: 10,
  exportMode: "preview",
  includeHidden: false,
  includeText: true,
  includeDimensions: true,
  strokeWidthOverride: null,
};

// ==================== Bounds Calculation ====================

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculate bounding box from IEntity array.
 * Exported for testing.
 */
export function calculateIEntityBounds(entities: IEntity[]): Bounds {
  if (entities.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function expand(x: number, y: number): void {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  for (const e of entities) {
    switch (e.type) {
      case EntityType.LINE: {
        const l = e as ILineEntity;
        expand(l.start.x, l.start.y);
        expand(l.end.x, l.end.y);
        break;
      }
      case EntityType.RECT: {
        const r = e as IRectEntity;
        // 4 corners (with rotation)
        const corners = getRectCorners(r);
        for (const c of corners) expand(c.x, c.y);
        break;
      }
      case EntityType.CIRCLE: {
        const c = e as ICircleEntity;
        expand(c.center.x - c.radius, c.center.y - c.radius);
        expand(c.center.x + c.radius, c.center.y + c.radius);
        break;
      }
      case EntityType.ARC: {
        const a = e as IArcEntity;
        // Conservative: use full circle bounds
        expand(a.center.x - a.radius, a.center.y - a.radius);
        expand(a.center.x + a.radius, a.center.y + a.radius);
        break;
      }
      case EntityType.ELLIPSE: {
        const el = e as IEllipseEntity;
        const maxR = Math.max(el.radiusX, el.radiusY);
        expand(el.center.x - maxR, el.center.y - maxR);
        expand(el.center.x + maxR, el.center.y + maxR);
        break;
      }
      case EntityType.POLYLINE: {
        const pl = e as IPolylineEntity;
        for (const p of pl.points) expand(p.x, p.y);
        break;
      }
      case EntityType.TEXT: {
        const t = e as ITextEntity;
        expand(t.position.x, t.position.y);
        // Approximate text extent
        const textW = t.text.length * t.fontSize * 0.6;
        expand(t.position.x + textW, t.position.y + t.fontSize);
        break;
      }
      case EntityType.DIMENSION: {
        const d = e as IDimensionEntity;
        expand(d.startPoint.x, d.startPoint.y);
        expand(d.endPoint.x, d.endPoint.y);
        if (d.textPosition) expand(d.textPosition.x, d.textPosition.y);
        break;
      }
    }
  }

  // Safety: handle degenerate cases
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  if (maxX - minX < 1) { minX -= 50; maxX += 50; }
  if (maxY - minY < 1) { minY -= 50; maxY += 50; }

  return { minX, minY, maxX, maxY };
}

// ==================== Main Export Function ====================

/**
 * Export a CadDocument to SVG format.
 * Reads from core IEntity data — no canvas/DOM dependency.
 */
export function exportDocumentToSVG(
  document: CadDocument,
  options?: SVGExportOptions,
): ExportResult {
  try {
    const opts = { ...DEFAULT_SVG_OPTIONS, ...options };
    const title = opts.title ?? document.metadata.title ?? "drawing";

    const all = document.getAllEntities();

    // Filter entities
    const entities = all.filter((e) => {
      if (!opts.includeHidden && e.state?.visible === false) return false;
      if (!opts.includeText && e.type === EntityType.TEXT) return false;
      if (!opts.includeDimensions && e.type === EntityType.DIMENSION) return false;
      return true;
    });

    // Calculate bounds
    const bounds = calculateIEntityBounds(entities);
    const pad = opts.padding;

    const worldW = bounds.maxX - bounds.minX + 2 * pad;
    const worldH = bounds.maxY - bounds.minY + 2 * pad;

    // ViewBox: flip Y (CAD Y-up → SVG Y-down)
    const vbX = bounds.minX - pad;
    const vbY = -(bounds.maxY + pad);
    const vbW = worldW;
    const vbH = worldH;

    // Width/Height attributes
    const scaledW = vbW * opts.scale;
    const scaledH = vbH * opts.scale;
    const widthAttr = opts.exportMode === "world"
      ? `${scaledW.toFixed(2)}mm`
      : "100%";
    const heightAttr = opts.exportMode === "world"
      ? `${scaledH.toFixed(2)}mm`
      : "100%";

    // Build SVG
    const parts: string[] = [];
    parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `width="${widthAttr}" height="${heightAttr}" ` +
      `viewBox="${vbX} ${vbY} ${vbW} ${vbH}" ` +
      `preserveAspectRatio="xMidYMid meet">`,
    );
    parts.push(`  <title>${escapeXml(title)}</title>`);

    // Background
    if (!opts.transparent) {
      parts.push(
        `  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${opts.backgroundColor}"/>`,
      );
    }

    // Root Y-flip group
    parts.push(`  <g transform="scale(1,-1)">`);

    // Render entities
    for (const entity of entities) {
      const svgEl = iEntityToSVG(entity, opts.strokeWidthOverride);
      if (svgEl) parts.push(svgEl);
    }

    parts.push(`  </g>`);
    parts.push(`</svg>`);

    return {
      success: true,
      data: parts.join("\n"),
      filename: `${title}.svg`,
    };
  } catch (error) {
    return {
      success: false,
      error: `SVG export failed: ${error instanceof Error ? error.message : error}`,
    };
  }
}

// ==================== IEntity → SVG Element ====================

/**
 * Convert a single IEntity to its SVG element string.
 * Exported for testing.
 */
export function iEntityToSVG(
  entity: IEntity,
  strokeWidthOverride?: number | null,
): string {
  const stroke = entity.style?.strokeColor ?? "#FFFFFF";
  const sw = strokeWidthOverride ?? entity.style?.strokeWidth ?? 1;
  const fill = entity.style?.fillColor ?? "none";
  const opacity = entity.style?.opacity ?? 1;
  const linestyle = entity.style?.strokeStyle ?? "solid";

  const strokeAttr = `stroke="${stroke}" stroke-width="${sw}" stroke-opacity="${opacity}"`;
  const fillAttr = fill && fill !== "none"
    ? `fill="${fill}" fill-opacity="${opacity}"`
    : `fill="none"`;
  const dashAttr = buildDashArray(linestyle, sw);

  switch (entity.type) {
    case EntityType.LINE:
      return lineToSVG(entity as ILineEntity, strokeAttr, dashAttr);
    case EntityType.RECT:
      return rectToSVG(entity as IRectEntity, strokeAttr, fillAttr, dashAttr);
    case EntityType.CIRCLE:
      return circleToSVG(entity as ICircleEntity, strokeAttr, fillAttr, dashAttr);
    case EntityType.ARC:
      return arcToSVG(entity as IArcEntity, strokeAttr, dashAttr);
    case EntityType.ELLIPSE:
      return ellipseToSVG(entity as IEllipseEntity, strokeAttr, fillAttr, dashAttr);
    case EntityType.POLYLINE:
      return polylineToSVG(entity as IPolylineEntity, strokeAttr, fillAttr, dashAttr);
    case EntityType.TEXT:
      return textToSVG(entity as ITextEntity, stroke);
    case EntityType.DIMENSION:
      return dimensionToSVG(entity as IDimensionEntity, stroke, sw);
    default:
      return `    <!-- unsupported entity type: ${entity.type} -->`;
  }
}

// ==================== Entity-Specific SVG Generators ====================

function lineToSVG(e: ILineEntity, strokeAttr: string, dashAttr: string): string {
  return `    <line x1="${e.start.x}" y1="${e.start.y}" x2="${e.end.x}" y2="${e.end.y}" ${strokeAttr}${dashAttr}/>`;
}

function rectToSVG(
  e: IRectEntity, strokeAttr: string, fillAttr: string, dashAttr: string,
): string {
  if (e.rotation && e.rotation !== 0) {
    // Rotated rect: use transform
    const cx = e.origin.x + e.width / 2;
    const cy = e.origin.y + e.height / 2;
    const rotDeg = (e.rotation * 180) / Math.PI;
    return (
      `    <rect x="${e.origin.x}" y="${e.origin.y}" width="${e.width}" height="${e.height}" ` +
      `${strokeAttr} ${fillAttr}${dashAttr} ` +
      `transform="rotate(${rotDeg} ${cx} ${cy})"/>`
    );
  }
  return (
    `    <rect x="${e.origin.x}" y="${e.origin.y}" width="${e.width}" height="${e.height}" ` +
    `${strokeAttr} ${fillAttr}${dashAttr}/>`
  );
}

function circleToSVG(
  e: ICircleEntity, strokeAttr: string, fillAttr: string, dashAttr: string,
): string {
  return (
    `    <circle cx="${e.center.x}" cy="${e.center.y}" r="${e.radius}" ` +
    `${strokeAttr} ${fillAttr}${dashAttr}/>`
  );
}

function arcToSVG(e: IArcEntity, strokeAttr: string, dashAttr: string): string {
  const startX = e.center.x + e.radius * Math.cos(e.startAngle);
  const startY = e.center.y + e.radius * Math.sin(e.startAngle);
  const endX = e.center.x + e.radius * Math.cos(e.endAngle);
  const endY = e.center.y + e.radius * Math.sin(e.endAngle);

  let angleDiff = e.endAngle - e.startAngle;
  if (angleDiff < 0) angleDiff += Math.PI * 2;
  const largeArc = angleDiff > Math.PI ? 1 : 0;

  return (
    `    <path d="M ${startX} ${startY} A ${e.radius} ${e.radius} 0 ${largeArc} 1 ${endX} ${endY}" ` +
    `${strokeAttr} fill="none"${dashAttr}/>`
  );
}

function ellipseToSVG(
  e: IEllipseEntity, strokeAttr: string, fillAttr: string, dashAttr: string,
): string {
  if (e.rotation && e.rotation !== 0) {
    const rotDeg = (e.rotation * 180) / Math.PI;
    return (
      `    <ellipse cx="${e.center.x}" cy="${e.center.y}" rx="${e.radiusX}" ry="${e.radiusY}" ` +
      `${strokeAttr} ${fillAttr}${dashAttr} ` +
      `transform="rotate(${rotDeg} ${e.center.x} ${e.center.y})"/>`
    );
  }
  return (
    `    <ellipse cx="${e.center.x}" cy="${e.center.y}" rx="${e.radiusX}" ry="${e.radiusY}" ` +
    `${strokeAttr} ${fillAttr}${dashAttr}/>`
  );
}

function polylineToSVG(
  e: IPolylineEntity, strokeAttr: string, fillAttr: string, dashAttr: string,
): string {
  if (e.points.length < 2) return "";
  const pts = e.points.map((p) => `${p.x},${p.y}`).join(" ");

  if (e.closed) {
    return `    <polygon points="${pts}" ${strokeAttr} ${fillAttr}${dashAttr}/>`;
  }
  return `    <polyline points="${pts}" ${strokeAttr} ${fillAttr}${dashAttr}/>`;
}

function textToSVG(e: ITextEntity, color: string): string {
  const rotDeg = e.rotation ? (e.rotation * 180) / Math.PI : 0;
  const anchor =
    e.textAlign === "center" ? "middle" : e.textAlign === "right" ? "end" : "start";
  const escaped = escapeXml(e.text);

  // Text needs counter-flip (scale(1,-1) in parent) to be readable
  // Handle multiline with tspan
  const lines = escaped.split("\n");
  const lineH = e.fontSize * 1.2;

  let tspans: string;
  if (lines.length === 1) {
    tspans = escaped;
  } else {
    tspans = lines
      .map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : lineH}">${line}</tspan>`)
      .join("");
  }

  return (
    `    <g transform="translate(${e.position.x},${e.position.y}) scale(1,-1)${rotDeg ? ` rotate(${rotDeg})` : ""}">` +
    `<text x="0" y="0" font-size="${e.fontSize}" font-family="${e.fontFamily}" ` +
    `text-anchor="${anchor}" dominant-baseline="hanging" fill="${color}">` +
    `${tspans}</text></g>`
  );
}

function dimensionToSVG(
  e: IDimensionEntity, color: string, sw: number,
): string {
  // Simplified dimension: line between points + text label
  const dist = Math.sqrt(
    (e.endPoint.x - e.startPoint.x) ** 2 +
    (e.endPoint.y - e.startPoint.y) ** 2,
  );
  const valueText = e.value != null
    ? `${e.value}${e.suffix ?? ""}`
    : `${dist.toFixed(1)}${e.suffix ?? ""}`;

  const tx = e.textPosition?.x ?? (e.startPoint.x + e.endPoint.x) / 2;
  const ty = e.textPosition?.y ?? (e.startPoint.y + e.endPoint.y) / 2;
  const fontSize = Math.max(8, dist * 0.05);

  const escaped = escapeXml(valueText);

  return [
    `    <g class="dimension">`,
    `      <line x1="${e.startPoint.x}" y1="${e.startPoint.y}" x2="${e.endPoint.x}" y2="${e.endPoint.y}" stroke="${color}" stroke-width="${sw}"/>`,
    `      <g transform="translate(${tx},${ty}) scale(1,-1)">`,
    `        <text x="0" y="0" font-size="${fontSize}" text-anchor="middle" dominant-baseline="auto" fill="${color}">${escaped}</text>`,
    `      </g>`,
    `    </g>`,
  ].join("\n");
}

// ==================== Utilities ====================

function getRectCorners(r: IRectEntity): { x: number; y: number }[] {
  const corners = [
    { x: r.origin.x, y: r.origin.y },
    { x: r.origin.x + r.width, y: r.origin.y },
    { x: r.origin.x + r.width, y: r.origin.y + r.height },
    { x: r.origin.x, y: r.origin.y + r.height },
  ];

  if (!r.rotation || r.rotation === 0) return corners;

  const cos = Math.cos(r.rotation);
  const sin = Math.sin(r.rotation);
  return corners.map((p) => {
    const dx = p.x - r.origin.x;
    const dy = p.y - r.origin.y;
    return {
      x: r.origin.x + dx * cos - dy * sin,
      y: r.origin.y + dx * sin + dy * cos,
    };
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildDashArray(style: string, sw: number): string {
  switch (style) {
    case "dashed":
      return ` stroke-dasharray="${sw * 6} ${sw * 4}"`;
    case "dotted":
      return ` stroke-dasharray="${sw} ${sw * 3}"`;
    case "dashdot":
      return ` stroke-dasharray="${sw * 6} ${sw * 2} ${sw} ${sw * 2}"`;
    default:
      return "";
  }
}
