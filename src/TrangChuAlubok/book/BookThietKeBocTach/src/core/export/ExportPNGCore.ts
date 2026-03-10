/**
 * ExportPNGCore — IEntity-based PNG export for CAD documents
 * Phase 5.4: Canvas2D rendering from CadDocument (core IEntity data).
 *
 * Architecture:
 *   1. preparePNGExport()  → compute bounds, dimensions, scale (pure, testable)
 *   2. renderIEntityToCtx() → render one IEntity to Canvas2D (testable with mock ctx)
 *   3. renderDocumentToCtx() → render all entities with world→pixel transform
 *   4. exportDocumentToPNG() → full browser pipeline (needs DOM)
 *
 * Coordinate system:
 *   CAD uses Y-up, Canvas2D uses Y-down.
 *   Solution: ctx.scale(1, -1) after translating origin to bottom of canvas.
 *   Text gets counter-flip via ctx.save/scale(1,-1)/restore.
 *
 * Complies with:
 *   R2: Reads from CadDocument entities (not canvas render state)
 *   R6: No preview data in export
 */

import type { CadDocument } from "../document/CadDocument";
import type { ExportResult } from "./ExportManager";
import {
  calculateIEntityBounds,
  exportDocumentToSVG,
} from "./ExportSVGCore";
import type { SVGExportOptions } from "./ExportSVGCore";
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

export interface PNGExportOptions {
  /** Output pixel width (default: 1024) */
  width?: number;
  /** Output pixel height (auto-calculated from aspect ratio if not set) */
  height?: number;
  /** Background color (default: "#1a1a2e") */
  backgroundColor?: string;
  /** Transparent background (default: false) */
  transparent?: boolean;
  /** Padding in pixels (default: 20) */
  padding?: number;
  /** Image quality 0-1 for JPEG fallback (default: 1.0) */
  quality?: number;
  /** Document title for filename */
  title?: string;
  /** Include hidden entities (default: false) */
  includeHidden?: boolean;
  /** Include text entities (default: true) */
  includeText?: boolean;
  /** Include dimension entities (default: true) */
  includeDimensions?: boolean;
  /** Export method: "canvas" (Canvas2D) or "svg" (SVG→Image→Canvas) */
  method?: "canvas" | "svg";
}

const DEFAULT_PNG_OPTIONS: Required<PNGExportOptions> = {
  width: 1024,
  height: 0, // 0 = auto from aspect ratio
  backgroundColor: "#1a1a2e",
  transparent: false,
  padding: 20,
  quality: 1.0,
  title: "drawing",
  includeHidden: false,
  includeText: true,
  includeDimensions: true,
  method: "canvas",
};

// ==================== Preparation (Pure, Testable) ====================

export interface PNGPrepareResult {
  /** Filtered entities to render */
  entities: IEntity[];
  /** World-coordinate bounds */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /** Final pixel canvas width */
  canvasWidth: number;
  /** Final pixel canvas height */
  canvasHeight: number;
  /** Scale: pixels per world unit */
  pixelScale: number;
  /** Translation offset in pixels */
  offsetX: number;
  offsetY: number;
  /** Resolved options */
  options: Required<PNGExportOptions>;
}

/**
 * Compute all rendering parameters from CadDocument and options.
 * Pure function — no DOM dependency. Exported for testing.
 */
export function preparePNGExport(
  document: CadDocument,
  options?: PNGExportOptions,
): PNGPrepareResult {
  const opts = { ...DEFAULT_PNG_OPTIONS, ...options };

  const all = document.getAllEntities();

  // Filter entities
  const entities = all.filter((e) => {
    if (!opts.includeHidden && e.state?.visible === false) return false;
    if (!opts.includeText && e.type === EntityType.TEXT) return false;
    if (!opts.includeDimensions && e.type === EntityType.DIMENSION) return false;
    return true;
  });

  // Calculate world bounds
  const bounds = calculateIEntityBounds(entities);
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;

  // Calculate canvas dimensions
  const pad = opts.padding;
  const canvasWidth = opts.width;
  let canvasHeight = opts.height;

  if (!canvasHeight || canvasHeight <= 0) {
    // Auto height from aspect ratio
    const aspect = worldH / (worldW || 1);
    canvasHeight = Math.round((canvasWidth - 2 * pad) * aspect + 2 * pad);
    canvasHeight = Math.max(canvasHeight, 100); // minimum
  }

  // Scale: fit world bounds into canvas with padding
  const availW = canvasWidth - 2 * pad;
  const availH = canvasHeight - 2 * pad;
  const scaleX = availW / (worldW || 1);
  const scaleY = availH / (worldH || 1);
  const pixelScale = Math.min(scaleX, scaleY);

  // Center content in canvas
  const renderedW = worldW * pixelScale;
  const renderedH = worldH * pixelScale;
  const offsetX = pad + (availW - renderedW) / 2 - bounds.minX * pixelScale;
  const offsetY = pad + (availH - renderedH) / 2 + bounds.maxY * pixelScale; // Y-flip

  return {
    entities,
    bounds,
    canvasWidth,
    canvasHeight,
    pixelScale,
    offsetX,
    offsetY,
    options: { ...opts, height: canvasHeight },
  };
}

// ==================== Canvas2D Rendering (Testable with Mock) ====================

/**
 * Minimal Canvas2D interface for rendering.
 * Allows testing with mock objects without full DOM CanvasRenderingContext2D.
 */
export interface ICanvasContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  globalAlpha: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  save(): void;
  restore(): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, start: number, end: number, ccw?: boolean): void;
  ellipse(
    x: number, y: number, rx: number, ry: number,
    rotation: number, start: number, end: number, ccw?: boolean,
  ): void;
  rect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  stroke(): void;
  fill(): void;
  fillText(text: string, x: number, y: number): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
  rotate(angle: number): void;
  setLineDash(segments: number[]): void;
}

/**
 * Render a single IEntity to a Canvas2D context.
 * Context should already have the world→pixel transform applied.
 * Exported for testing.
 */
export function renderIEntityToCtx(
  ctx: ICanvasContext,
  entity: IEntity,
): void {
  const stroke = entity.style?.strokeColor ?? "#FFFFFF";
  const sw = entity.style?.strokeWidth ?? 1;
  const fillColor = entity.style?.fillColor;
  const opacity = entity.style?.opacity ?? 1;
  const linestyle = entity.style?.strokeStyle ?? "solid";

  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = sw;
  ctx.globalAlpha = opacity;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  applyLineDash(ctx, linestyle, sw);

  switch (entity.type) {
    case EntityType.LINE:
      renderLine(ctx, entity as ILineEntity);
      break;
    case EntityType.RECT:
      renderRect(ctx, entity as IRectEntity, fillColor);
      break;
    case EntityType.CIRCLE:
      renderCircle(ctx, entity as ICircleEntity, fillColor);
      break;
    case EntityType.ARC:
      renderArc(ctx, entity as IArcEntity);
      break;
    case EntityType.ELLIPSE:
      renderEllipse(ctx, entity as IEllipseEntity, fillColor);
      break;
    case EntityType.POLYLINE:
      renderPolyline(ctx, entity as IPolylineEntity, fillColor);
      break;
    case EntityType.TEXT:
      renderText(ctx, entity as ITextEntity, stroke);
      break;
    case EntityType.DIMENSION:
      renderDimension(ctx, entity as IDimensionEntity, stroke, sw);
      break;
  }

  ctx.restore();
}

/**
 * Render all entities from a CadDocument onto a Canvas2D context.
 * Sets up world→pixel transform (Y-flip, scale, translate).
 * Exported for testing.
 */
export function renderDocumentToCtx(
  ctx: ICanvasContext,
  prep: PNGPrepareResult,
): void {
  const { entities, options, canvasWidth, canvasHeight, pixelScale, offsetX, offsetY } = prep;

  // Background
  if (!options.transparent) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // World → pixel transform: translate then Y-flip via scale(1, -1)
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(pixelScale, -pixelScale); // Y-flip + scale

  for (const entity of entities) {
    renderIEntityToCtx(ctx, entity);
  }

  ctx.restore();
}

// ==================== Entity-Specific Canvas Renderers ====================

function renderLine(ctx: ICanvasContext, e: ILineEntity): void {
  ctx.beginPath();
  ctx.moveTo(e.start.x, e.start.y);
  ctx.lineTo(e.end.x, e.end.y);
  ctx.stroke();
}

function renderRect(ctx: ICanvasContext, e: IRectEntity, fillColor?: string | null): void {
  ctx.save();
  if (e.rotation && e.rotation !== 0) {
    const cx = e.origin.x + e.width / 2;
    const cy = e.origin.y + e.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(e.rotation);
    ctx.translate(-cx, -cy);
  }
  ctx.beginPath();
  ctx.rect(e.origin.x, e.origin.y, e.width, e.height);
  if (fillColor && fillColor !== "none") {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

function renderCircle(ctx: ICanvasContext, e: ICircleEntity, fillColor?: string | null): void {
  ctx.beginPath();
  ctx.arc(e.center.x, e.center.y, e.radius, 0, Math.PI * 2);
  if (fillColor && fillColor !== "none") {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
}

function renderArc(ctx: ICanvasContext, e: IArcEntity): void {
  ctx.beginPath();
  ctx.arc(e.center.x, e.center.y, e.radius, e.startAngle, e.endAngle);
  ctx.stroke();
}

function renderEllipse(ctx: ICanvasContext, e: IEllipseEntity, fillColor?: string | null): void {
  ctx.beginPath();
  ctx.ellipse(
    e.center.x, e.center.y,
    e.radiusX, e.radiusY,
    e.rotation || 0,
    0, Math.PI * 2,
  );
  if (fillColor && fillColor !== "none") {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
}

function renderPolyline(ctx: ICanvasContext, e: IPolylineEntity, fillColor?: string | null): void {
  if (e.points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(e.points[0].x, e.points[0].y);
  for (let i = 1; i < e.points.length; i++) {
    ctx.lineTo(e.points[i].x, e.points[i].y);
  }
  if (e.closed) {
    ctx.closePath();
    if (fillColor && fillColor !== "none") {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
  }
  ctx.stroke();
}

function renderText(ctx: ICanvasContext, e: ITextEntity, color: string): void {
  ctx.save();
  ctx.translate(e.position.x, e.position.y);
  // Counter-flip: parent has scale(1, -1), so flip text back
  ctx.scale(1, -1);
  if (e.rotation) ctx.rotate(e.rotation);

  ctx.fillStyle = color;
  ctx.font = `${e.fontSize}px ${e.fontFamily}`;
  ctx.textAlign = e.textAlign === "center" ? "center" : e.textAlign === "right" ? "end" : "start";
  ctx.textBaseline = "top";

  const lines = e.text.split("\n");
  const lineH = e.fontSize * 1.2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 0, i * lineH);
  }

  ctx.restore();
}

function renderDimension(ctx: ICanvasContext, e: IDimensionEntity, color: string, sw: number): void {
  // Dimension line
  ctx.beginPath();
  ctx.moveTo(e.startPoint.x, e.startPoint.y);
  ctx.lineTo(e.endPoint.x, e.endPoint.y);
  ctx.stroke();

  // Dimension text
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

  ctx.save();
  ctx.translate(tx, ty);
  ctx.scale(1, -1); // Counter-flip for readable text
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(valueText, 0, 0);
  ctx.restore();
}

// ==================== Utilities ====================

function applyLineDash(ctx: ICanvasContext, style: string, sw: number): void {
  switch (style) {
    case "dashed":
      ctx.setLineDash([sw * 6, sw * 4]);
      break;
    case "dotted":
      ctx.setLineDash([sw, sw * 3]);
      break;
    case "dashdot":
      ctx.setLineDash([sw * 6, sw * 2, sw, sw * 2]);
      break;
    default:
      ctx.setLineDash([]);
      break;
  }
}

// ==================== Full PNG Export (Browser-Only) ====================

/**
 * Export CadDocument to PNG blob.
 * Requires browser DOM (document.createElement, Image, Canvas).
 * For Node.js testing, use preparePNGExport + renderDocumentToCtx with mock.
 */
export function exportDocumentToPNG(
  doc: CadDocument,
  options?: PNGExportOptions,
): ExportResult {
  const opts = { ...DEFAULT_PNG_OPTIONS, ...options };
  const method = opts.method;

  if (method === "svg") {
    return exportViaSVG(doc, opts);
  }
  return exportViaCanvas(doc, opts);
}

function exportViaCanvas(
  doc: CadDocument,
  opts: Required<PNGExportOptions>,
): ExportResult {
  try {
    if (typeof document === "undefined") {
      return { success: false, error: "PNG canvas export requires browser DOM" };
    }

    const prep = preparePNGExport(doc, opts);
    const canvas = document.createElement("canvas");
    canvas.width = prep.canvasWidth;
    canvas.height = prep.canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { success: false, error: "Cannot get Canvas2D context" };
    }

    renderDocumentToCtx(ctx as unknown as ICanvasContext, prep);

    const dataUrl = canvas.toDataURL("image/png", opts.quality);
    return {
      success: true,
      data: dataUrl,
      filename: `${opts.title}.png`,
    };
  } catch (error) {
    return {
      success: false,
      error: `PNG export failed: ${error instanceof Error ? error.message : error}`,
    };
  }
}

function exportViaSVG(
  doc: CadDocument,
  opts: Required<PNGExportOptions>,
): ExportResult {
  try {
    if (typeof document === "undefined") {
      return { success: false, error: "PNG SVG export requires browser DOM" };
    }

    const svgOpts: SVGExportOptions = {
      title: opts.title,
      backgroundColor: opts.backgroundColor,
      transparent: opts.transparent,
      padding: opts.padding,
      includeHidden: opts.includeHidden,
      includeText: opts.includeText,
      includeDimensions: opts.includeDimensions,
      exportMode: "preview",
    };

    const svgResult = exportDocumentToSVG(doc, svgOpts);
    if (!svgResult.success || !svgResult.data) {
      return { success: false, error: "SVG generation failed for PNG export" };
    }

    // Return SVG data URL — actual Image→Canvas conversion is async
    // and handled by exportDocumentToPNGAsync
    const svgString = svgResult.data as string;
    const encoded = encodeURIComponent(svgString);
    const dataUrl = `data:image/svg+xml,${encoded}`;

    return {
      success: true,
      data: dataUrl,
      filename: `${opts.title}.png`,
    };
  } catch (error) {
    return {
      success: false,
      error: `PNG SVG export failed: ${error instanceof Error ? error.message : error}`,
    };
  }
}

/**
 * Async PNG export: renders SVG to Image, then to Canvas, then to Blob.
 * Full browser pipeline. Returns a Promise<ExportResult> with Blob data.
 */
export async function exportDocumentToPNGAsync(
  doc: CadDocument,
  options?: PNGExportOptions,
): Promise<ExportResult> {
  const opts = { ...DEFAULT_PNG_OPTIONS, ...options };

  try {
    if (typeof document === "undefined") {
      return { success: false, error: "PNG async export requires browser DOM" };
    }

    const prep = preparePNGExport(doc, opts);

    if (opts.method === "svg") {
      return await svgToBlob(doc, prep, opts);
    }

    // Canvas method: render directly, then toBlob
    const canvas = document.createElement("canvas");
    canvas.width = prep.canvasWidth;
    canvas.height = prep.canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { success: false, error: "Cannot get Canvas2D context" };
    }

    renderDocumentToCtx(ctx as unknown as ICanvasContext, prep);

    return new Promise<ExportResult>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              success: true,
              data: blob,
              filename: `${opts.title}.png`,
            });
          } else {
            resolve({ success: false, error: "Failed to create PNG blob" });
          }
        },
        "image/png",
        opts.quality,
      );
    });
  } catch (error) {
    return {
      success: false,
      error: `PNG async export failed: ${error instanceof Error ? error.message : error}`,
    };
  }
}

async function svgToBlob(
  doc: CadDocument,
  prep: PNGPrepareResult,
  opts: Required<PNGExportOptions>,
): Promise<ExportResult> {
  const svgResult = exportDocumentToSVG(doc, {
    title: opts.title,
    backgroundColor: opts.backgroundColor,
    transparent: opts.transparent,
    padding: opts.padding,
    includeHidden: opts.includeHidden,
    includeText: opts.includeText,
    includeDimensions: opts.includeDimensions,
    exportMode: "preview",
  });

  if (!svgResult.success || !svgResult.data) {
    return { success: false, error: "SVG generation failed" };
  }

  const svgString = svgResult.data as string;
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  return new Promise<ExportResult>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = prep.canvasWidth;
      canvas.height = prep.canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve({ success: false, error: "Cannot get Canvas2D context" });
        return;
      }
      ctx.drawImage(img, 0, 0, prep.canvasWidth, prep.canvasHeight);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (pngBlob) => {
          if (pngBlob) {
            resolve({
              success: true,
              data: pngBlob,
              filename: `${opts.title}.png`,
            });
          } else {
            resolve({ success: false, error: "Failed to create PNG blob" });
          }
        },
        "image/png",
        opts.quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ success: false, error: "Failed to load SVG as image" });
    };
    img.src = url;
  });
}
