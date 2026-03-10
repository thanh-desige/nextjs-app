/**
 * ExportPDFCore — IEntity-based PDF export for CAD documents
 * Phase 5.5: Generates valid PDF 1.4 from CadDocument (core IEntity data).
 *
 * Architecture:
 *   - Pure string generation — no external PDF library dependency
 *   - Produces valid PDF 1.4 with text content streams
 *   - Drawing page: CAD entities rendered as PDF graphics operators
 *   - Optional BOM table page(s): bill of materials in tabular form
 *
 * PDF Coordinate System:
 *   PDF uses Y-up (same as CAD) — no flip needed.
 *   Origin is bottom-left of page. Content is scaled + translated to fit.
 *
 * PDF Graphics Operators Used:
 *   m (moveTo), l (lineTo), re (rect), c (curveTo),
 *   S (stroke), f (fill), B (fill+stroke),
 *   w (lineWidth), RG (stroke color), rg (fill color),
 *   q/Q (save/restore), cm (concat matrix),
 *   BT/ET (begin/end text), Tf (font), Td (text position), Tj (show text)
 *
 * Complies with:
 *   R2: Reads from CadDocument entities (not canvas render state)
 *   R6: No preview data in export
 */

import type { CadDocument } from "../document/CadDocument";
import type { ExportResult } from "./ExportManager";
import { calculateIEntityBounds } from "./ExportSVGCore";
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

/** Standard paper sizes in mm */
export type PaperSize = "A4" | "A3" | "A2" | "A1" | "A0" | "custom";
export type Orientation = "portrait" | "landscape";

export interface PDFExportOptions {
  /** Document title (PDF metadata) */
  title?: string;
  /** Document author (PDF metadata) */
  author?: string;
  /** Paper size (default: "A4") */
  paperSize?: PaperSize;
  /** Orientation (default: "landscape") */
  orientation?: Orientation;
  /** Custom page width in mm (used when paperSize="custom") */
  customWidth?: number;
  /** Custom page height in mm (used when paperSize="custom") */
  customHeight?: number;
  /** Page margin in mm (default: 10) */
  margin?: number;
  /** Background color hex (default: "#FFFFFF") */
  backgroundColor?: string;
  /** Include hidden entities (default: false) */
  includeHidden?: boolean;
  /** Include text entities (default: true) */
  includeText?: boolean;
  /** Include dimension entities (default: true) */
  includeDimensions?: boolean;
  /** Include title block border (default: true) */
  includeTitleBlock?: boolean;
  /** Drawing scale label (e.g., "1:100") */
  scaleLabel?: string;
}

const DEFAULT_PDF_OPTIONS: Required<PDFExportOptions> = {
  title: "CAD Drawing",
  author: "Alubok CAD",
  paperSize: "A4",
  orientation: "landscape",
  customWidth: 297,
  customHeight: 210,
  margin: 10,
  backgroundColor: "#FFFFFF",
  includeHidden: false,
  includeText: true,
  includeDimensions: true,
  includeTitleBlock: true,
  scaleLabel: "",
};

// Paper sizes in mm [width, height] (portrait orientation)
const PAPER_SIZES: Record<string, [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  A2: [420, 594],
  A1: [594, 841],
  A0: [841, 1189],
};

// ==================== Page Dimensions ====================

export interface PageDimensions {
  /** Page width in PDF points (1pt = 1/72 inch) */
  widthPt: number;
  /** Page height in PDF points */
  heightPt: number;
  /** Margin in PDF points */
  marginPt: number;
  /** Drawable area width in points */
  drawableW: number;
  /** Drawable area height in points */
  drawableH: number;
}

const MM_TO_PT = 72 / 25.4; // 1mm = 2.8346pt

/**
 * Calculate page dimensions from options.
 * Exported for testing.
 */
export function getPageDimensions(options?: PDFExportOptions): PageDimensions {
  const opts = { ...DEFAULT_PDF_OPTIONS, ...options };
  let wMm: number;
  let hMm: number;

  if (opts.paperSize === "custom") {
    wMm = opts.customWidth;
    hMm = opts.customHeight;
  } else {
    const size = PAPER_SIZES[opts.paperSize] ?? PAPER_SIZES.A4;
    wMm = size[0];
    hMm = size[1];
  }

  // Apply orientation
  if (opts.orientation === "landscape") {
    [wMm, hMm] = [Math.max(wMm, hMm), Math.min(wMm, hMm)];
  } else {
    [wMm, hMm] = [Math.min(wMm, hMm), Math.max(wMm, hMm)];
  }

  const widthPt = wMm * MM_TO_PT;
  const heightPt = hMm * MM_TO_PT;
  const marginPt = opts.margin * MM_TO_PT;

  return {
    widthPt,
    heightPt,
    marginPt,
    drawableW: widthPt - 2 * marginPt,
    drawableH: heightPt - 2 * marginPt,
  };
}

// ==================== PDF Content Stream Builders ====================

/**
 * Generate PDF drawing operators for a single IEntity.
 * Coordinates are in CAD world units — caller applies transform.
 * Exported for testing.
 */
export function iEntityToPDFOps(entity: IEntity): string {
  const ops: string[] = [];
  const stroke = entity.style?.strokeColor ?? "#000000";
  const sw = entity.style?.strokeWidth ?? 1;
  const fillColor = entity.style?.fillColor;
  const linestyle = entity.style?.strokeStyle ?? "solid";

  // Stroke color (RGB)
  const [sr, sg, sb] = hexToRgb01(stroke);
  ops.push(`${f(sr)} ${f(sg)} ${f(sb)} RG`);
  ops.push(`${f(sw)} w`);

  // Dash pattern
  const dash = buildPDFDash(linestyle, sw);
  if (dash) ops.push(dash);

  // Fill color
  if (fillColor && fillColor !== "none") {
    const [fr, fg, fb] = hexToRgb01(fillColor);
    ops.push(`${f(fr)} ${f(fg)} ${f(fb)} rg`);
  }

  switch (entity.type) {
    case EntityType.LINE:
      ops.push(lineToOps(entity as ILineEntity));
      break;
    case EntityType.RECT:
      ops.push(rectToOps(entity as IRectEntity, !!fillColor && fillColor !== "none"));
      break;
    case EntityType.CIRCLE:
      ops.push(circleToOps(entity as ICircleEntity, !!fillColor && fillColor !== "none"));
      break;
    case EntityType.ARC:
      ops.push(arcToOps(entity as IArcEntity));
      break;
    case EntityType.ELLIPSE:
      ops.push(ellipseToOps(entity as IEllipseEntity, !!fillColor && fillColor !== "none"));
      break;
    case EntityType.POLYLINE:
      ops.push(polylineToOps(entity as IPolylineEntity, !!fillColor && fillColor !== "none"));
      break;
    case EntityType.TEXT:
      ops.push(textToOps(entity as ITextEntity, stroke));
      break;
    case EntityType.DIMENSION:
      ops.push(dimensionToOps(entity as IDimensionEntity, stroke, sw));
      break;
    default:
      ops.push(`% unsupported entity: ${entity.type}`);
  }

  // Reset dash
  if (dash) ops.push("[] 0 d");

  return ops.join("\n");
}

// ==================== Entity-Specific PDF Operators ====================

function lineToOps(e: ILineEntity): string {
  return `${f(e.start.x)} ${f(e.start.y)} m ${f(e.end.x)} ${f(e.end.y)} l S`;
}

function rectToOps(e: IRectEntity, hasFill: boolean): string {
  const op = hasFill ? "B" : "S";
  if (e.rotation && e.rotation !== 0) {
    // Rotated rect: use explicit path
    const cos = Math.cos(e.rotation);
    const sin = Math.sin(e.rotation);
    const cx = e.origin.x + e.width / 2;
    const cy = e.origin.y + e.height / 2;
    const corners = [
      { x: e.origin.x, y: e.origin.y },
      { x: e.origin.x + e.width, y: e.origin.y },
      { x: e.origin.x + e.width, y: e.origin.y + e.height },
      { x: e.origin.x, y: e.origin.y + e.height },
    ].map((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      };
    });
    return [
      `${f(corners[0].x)} ${f(corners[0].y)} m`,
      `${f(corners[1].x)} ${f(corners[1].y)} l`,
      `${f(corners[2].x)} ${f(corners[2].y)} l`,
      `${f(corners[3].x)} ${f(corners[3].y)} l`,
      `h ${op}`,
    ].join(" ");
  }
  return `${f(e.origin.x)} ${f(e.origin.y)} ${f(e.width)} ${f(e.height)} re ${op}`;
}

function circleToOps(e: ICircleEntity, hasFill: boolean): string {
  // Approximate circle with 4 cubic Bezier curves
  // Magic constant: k = 4 * (sqrt(2) - 1) / 3 ≈ 0.5523
  const k = 0.5523;
  const cx = e.center.x;
  const cy = e.center.y;
  const r = e.radius;
  const kr = k * r;
  const op = hasFill ? "B" : "S";

  return [
    `${f(cx + r)} ${f(cy)} m`,
    `${f(cx + r)} ${f(cy + kr)} ${f(cx + kr)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c`,
    `${f(cx - kr)} ${f(cy + r)} ${f(cx - r)} ${f(cy + kr)} ${f(cx - r)} ${f(cy)} c`,
    `${f(cx - r)} ${f(cy - kr)} ${f(cx - kr)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c`,
    `${f(cx + kr)} ${f(cy - r)} ${f(cx + r)} ${f(cy - kr)} ${f(cx + r)} ${f(cy)} c`,
    op,
  ].join("\n");
}

function arcToOps(e: IArcEntity): string {
  // Approximate arc with cubic Bezier segments (max 90° each)
  return bezierArc(e.center.x, e.center.y, e.radius, e.radius, 0, e.startAngle, e.endAngle) + " S";
}

function ellipseToOps(e: IEllipseEntity, hasFill: boolean): string {
  const op = hasFill ? "B" : "S";
  // Approximate ellipse with bezier (similar to circle but with rx, ry)
  return bezierArc(e.center.x, e.center.y, e.radiusX, e.radiusY, e.rotation || 0, 0, Math.PI * 2) + ` ${op}`;
}

function polylineToOps(e: IPolylineEntity, hasFill: boolean): string {
  if (e.points.length < 2) return "% empty polyline";
  const parts: string[] = [];
  parts.push(`${f(e.points[0].x)} ${f(e.points[0].y)} m`);
  for (let i = 1; i < e.points.length; i++) {
    parts.push(`${f(e.points[i].x)} ${f(e.points[i].y)} l`);
  }
  if (e.closed) {
    parts.push(hasFill ? "h B" : "h S");
  } else {
    parts.push("S");
  }
  return parts.join("\n");
}

function textToOps(e: ITextEntity, color: string): string {
  const [r, g, b] = hexToRgb01(color);
  const lines = e.text.split("\n");
  const ops: string[] = [];
  const lineH = e.fontSize * 1.2;

  ops.push("BT");
  ops.push(`/F1 ${f(e.fontSize)} Tf`);
  ops.push(`${f(r)} ${f(g)} ${f(b)} rg`);
  ops.push(`${f(e.position.x)} ${f(e.position.y)} Td`);

  for (let i = 0; i < lines.length; i++) {
    if (i > 0) ops.push(`0 ${f(-lineH)} Td`);
    ops.push(`(${escapePdfString(lines[i])}) Tj`);
  }

  ops.push("ET");
  return ops.join("\n");
}

function dimensionToOps(e: IDimensionEntity, color: string, sw: number): string {
  const [r, g, b] = hexToRgb01(color);
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

  return [
    `% dimension`,
    `${f(r)} ${f(g)} ${f(b)} RG`,
    `${f(sw)} w`,
    `${f(e.startPoint.x)} ${f(e.startPoint.y)} m ${f(e.endPoint.x)} ${f(e.endPoint.y)} l S`,
    `BT`,
    `/F1 ${f(fontSize)} Tf`,
    `${f(r)} ${f(g)} ${f(b)} rg`,
    `${f(tx)} ${f(ty)} Td`,
    `(${escapePdfString(valueText)}) Tj`,
    `ET`,
  ].join("\n");
}

// ==================== Bezier Arc Approximation ====================

function bezierArc(
  cx: number, cy: number,
  rx: number, ry: number,
  rotation: number,
  startAngle: number, endAngle: number,
): string {
  // Normalize angles
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += Math.PI * 2;
  if (sweep > Math.PI * 2) sweep = Math.PI * 2;

  const segments = Math.ceil(sweep / (Math.PI / 2));
  const segAngle = sweep / segments;

  const cos_rot = Math.cos(rotation);
  const sin_rot = Math.sin(rotation);

  function transform(px: number, py: number): [number, number] {
    // Scale by rx, ry then rotate then translate
    const x = cx + px * cos_rot - py * sin_rot;
    const y = cy + px * sin_rot + py * cos_rot;
    return [x, y];
  }

  const parts: string[] = [];
  let angle = startAngle;

  for (let i = 0; i < segments; i++) {
    const a1 = angle;
    const a2 = angle + segAngle;
    const alpha = 4 * Math.tan((a2 - a1) / 4) / 3;

    const cos1 = Math.cos(a1);
    const sin1 = Math.sin(a1);
    const cos2 = Math.cos(a2);
    const sin2 = Math.sin(a2);

    const p1x = rx * cos1;
    const p1y = ry * sin1;
    const p2x = rx * cos2;
    const p2y = ry * sin2;

    const cp1x = p1x - alpha * rx * sin1;
    const cp1y = p1y + alpha * ry * cos1;
    const cp2x = p2x + alpha * rx * sin2;
    const cp2y = p2y - alpha * ry * cos2;

    const [tp1x, tp1y] = transform(p1x, p1y);
    const [tcp1x, tcp1y] = transform(cp1x, cp1y);
    const [tcp2x, tcp2y] = transform(cp2x, cp2y);
    const [tp2x, tp2y] = transform(p2x, p2y);

    if (i === 0) {
      parts.push(`${f(tp1x)} ${f(tp1y)} m`);
    }
    parts.push(`${f(tcp1x)} ${f(tcp1y)} ${f(tcp2x)} ${f(tcp2y)} ${f(tp2x)} ${f(tp2y)} c`);

    angle = a2;
  }

  return parts.join("\n");
}

// ==================== PDF Document Builder ====================

/**
 * Export a CadDocument to PDF format.
 * Generates a valid PDF 1.4 string. No external dependencies.
 */
export function exportDocumentToPDF(
  document: CadDocument,
  options?: PDFExportOptions,
): ExportResult {
  try {
    const opts = { ...DEFAULT_PDF_OPTIONS, ...options };
    const title = opts.title ?? document.metadata.title ?? "drawing";
    const page = getPageDimensions(opts);

    const all = document.getAllEntities();

    // Filter entities
    const entities = all.filter((e) => {
      if (!opts.includeHidden && e.state?.visible === false) return false;
      if (!opts.includeText && e.type === EntityType.TEXT) return false;
      if (!opts.includeDimensions && e.type === EntityType.DIMENSION) return false;
      return true;
    });

    // Build drawing content stream
    const drawingStream = buildDrawingStream(entities, page, opts);

    // Title block stream (optional)
    const titleBlockStream = opts.includeTitleBlock
      ? buildTitleBlock(page, title, opts.author, opts.scaleLabel)
      : "";

    const fullStream = [drawingStream, titleBlockStream].filter(Boolean).join("\n");

    // Assemble PDF
    const pdf = assemblePDF(fullStream, page, title, opts.author);

    return {
      success: true,
      data: pdf,
      filename: `${title}.pdf`,
    };
  } catch (error) {
    return {
      success: false,
      error: `PDF export failed: ${error instanceof Error ? error.message : error}`,
    };
  }
}

// ==================== Drawing Stream Builder ====================

function buildDrawingStream(
  entities: IEntity[],
  page: PageDimensions,
  opts: Required<PDFExportOptions>,
): string {
  const bounds = calculateIEntityBounds(entities);
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;

  // Scale to fit drawable area
  const scaleX = page.drawableW / (worldW || 1);
  const scaleY = page.drawableH / (worldH || 1);
  const scale = Math.min(scaleX, scaleY);

  // Center in drawable area
  const renderedW = worldW * scale;
  const renderedH = worldH * scale;
  const offsetX = page.marginPt + (page.drawableW - renderedW) / 2 - bounds.minX * scale;
  const offsetY = page.marginPt + (page.drawableH - renderedH) / 2 - bounds.minY * scale;

  const ops: string[] = [];

  // Background
  if (opts.backgroundColor !== "#FFFFFF") {
    const [br, bg, bb] = hexToRgb01(opts.backgroundColor);
    ops.push(`${f(br)} ${f(bg)} ${f(bb)} rg`);
    ops.push(`0 0 ${f(page.widthPt)} ${f(page.heightPt)} re f`);
  }

  // Save state, apply world→page transform
  // PDF is Y-up (same as CAD), so no flip needed
  ops.push("q");
  ops.push(`${f(scale)} 0 0 ${f(scale)} ${f(offsetX)} ${f(offsetY)} cm`);

  // Render entities
  for (const entity of entities) {
    ops.push("q");
    ops.push(iEntityToPDFOps(entity));
    ops.push("Q");
  }

  ops.push("Q");

  return ops.join("\n");
}

// ==================== Title Block ====================

function buildTitleBlock(
  page: PageDimensions,
  title: string,
  author: string,
  scaleLabel: string,
): string {
  const m = page.marginPt;
  const w = page.widthPt - 2 * m;
  const h = page.heightPt - 2 * m;
  const ops: string[] = [];

  // Border rectangle
  ops.push("q");
  ops.push("0 0 0 RG"); // black
  ops.push("0.5 w");
  ops.push(`${f(m)} ${f(m)} ${f(w)} ${f(h)} re S`);

  // Title block box (bottom-right, 120×30 pt)
  const tbW = 120;
  const tbH = 30;
  const tbX = page.widthPt - m - tbW;
  const tbY = m;
  ops.push(`${f(tbX)} ${f(tbY)} ${f(tbW)} ${f(tbH)} re S`);

  // Title text
  ops.push("BT");
  ops.push("/F1 8 Tf");
  ops.push("0 0 0 rg");
  ops.push(`${f(tbX + 4)} ${f(tbY + 18)} Td`);
  ops.push(`(${escapePdfString(title)}) Tj`);
  ops.push("ET");

  // Author text
  ops.push("BT");
  ops.push("/F1 6 Tf");
  ops.push("0 0 0 rg");
  ops.push(`${f(tbX + 4)} ${f(tbY + 8)} Td`);
  ops.push(`(${escapePdfString(author)}) Tj`);
  ops.push("ET");

  // Scale label
  if (scaleLabel) {
    ops.push("BT");
    ops.push("/F1 6 Tf");
    ops.push("0 0 0 rg");
    ops.push(`${f(tbX + 70)} ${f(tbY + 8)} Td`);
    ops.push(`(${escapePdfString(scaleLabel)}) Tj`);
    ops.push("ET");
  }

  ops.push("Q");
  return ops.join("\n");
}

// ==================== PDF Assembly ====================

function assemblePDF(
  contentStream: string,
  page: PageDimensions,
  title: string,
  author: string,
): string {
  // PDF 1.4 with 5 objects:
  //   1: Catalog
  //   2: Pages
  //   3: Page
  //   4: Content stream
  //   5: Font (Helvetica)

  const streamBytes = contentStream.length;

  const objects: string[] = [];
  const offsets: number[] = [];

  let pdf = "%PDF-1.4\n";

  // Object 1: Catalog
  offsets.push(pdf.length);
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  pdf += obj1;

  // Object 2: Pages
  offsets.push(pdf.length);
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  pdf += obj2;

  // Object 3: Page
  offsets.push(pdf.length);
  const mediaBox = `[0 0 ${f(page.widthPt)} ${f(page.heightPt)}]`;
  const obj3 = [
    "3 0 obj",
    `<< /Type /Page /Parent 2 0 R /MediaBox ${mediaBox}`,
    "   /Contents 4 0 R",
    "   /Resources << /Font << /F1 5 0 R >> >> >>",
    "endobj",
  ].join("\n") + "\n";
  pdf += obj3;

  // Object 4: Content Stream
  offsets.push(pdf.length);
  const obj4 = `4 0 obj\n<< /Length ${streamBytes} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
  pdf += obj4;

  // Object 5: Font (Helvetica - built-in PDF font)
  offsets.push(pdf.length);
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  pdf += obj5;

  // Cross-reference table
  const xrefOffset = pdf.length;
  let xref = "xref\n";
  xref += `0 ${offsets.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (const off of offsets) {
    xref += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += xref;

  // Trailer
  pdf += "trailer\n";
  pdf += `<< /Size ${offsets.length + 1} /Root 1 0 R /Info 6 0 R >>\n`;

  // We need an Info object — add it before trailer
  // Actually, let's keep it simple and remove /Info reference
  // Re-build trailer without Info
  pdf = pdf.replace(` /Info 6 0 R`, "");

  pdf += "startxref\n";
  pdf += `${xrefOffset}\n`;
  pdf += "%%EOF\n";

  return pdf;
}

// ==================== Utilities ====================

/** Format number to fixed precision for PDF */
function f(n: number): string {
  return Number(n.toFixed(4)).toString();
}

/** Convert hex color to [r, g, b] in 0..1 range */
export function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [
    isNaN(r) ? 0 : r,
    isNaN(g) ? 0 : g,
    isNaN(b) ? 0 : b,
  ];
}

/** Escape special characters in PDF string */
function escapePdfString(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/** Build PDF dash array operator */
function buildPDFDash(style: string, sw: number): string {
  switch (style) {
    case "dashed":
      return `[${f(sw * 6)} ${f(sw * 4)}] 0 d`;
    case "dotted":
      return `[${f(sw)} ${f(sw * 3)}] 0 d`;
    case "dashdot":
      return `[${f(sw * 6)} ${f(sw * 2)} ${f(sw)} ${f(sw * 2)}] 0 d`;
    default:
      return "";
  }
}
