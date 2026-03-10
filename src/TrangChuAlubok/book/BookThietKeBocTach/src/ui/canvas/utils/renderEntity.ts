/**
 * renderEntity.ts - Entity rendering utilities
 *
 * Tách từ CadDrawingCanvas.tsx để giảm kích thước file và dễ bảo trì.
 * Chứa các hàm render cho từng loại entity (line, rect, circle, arc, ellipse, text)
 *
 * ============================================================================
 * TEXT RENDERING - 2D FIRST, 3D READY
 * ============================================================================
 * TextScaleMode (VIEW OPTION - không lưu vào entity):
 * - AUTO_ANNOTATION: Pixel-constant, text giữ kích thước cố định trên màn hình
 * - WORLD_RATIO: render = fontSizeMm * viewScale * worldRatio
 *
 * INVARIANT: Entity chỉ lưu fontSizeMm (world/mm), không lưu zoom/pixel
 * ============================================================================
 */

import type { Point, CadEntity } from "../types/CadEntity";

// ==================== Types ====================

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  zoom: number;
  worldToScreen: (x: number, y: number) => Point;
}

// Text scale mode (VIEW OPTION)
export type TextScaleMode = "AUTO_ANNOTATION" | "WORLD_RATIO";

// Font families available
export type TextFontFamily =
  | "Inter"
  | "Arial"
  | "Roboto"
  | "Courier New"
  | "Times New Roman";

// Font weight
export type TextFontWeight = "normal" | "bold";

// Text alignment
export type TextAlign = "left" | "center" | "right";

// Text baseline
export type TextBaseline = "middle" | "alphabetic" | "top" | "bottom";

export interface TextRenderSettings {
  scaleMode: TextScaleMode;
  /** Annotation size in pixels (for AUTO_ANNOTATION mode) */
  annotationPx: number;
  /** World ratio multiplier (for WORLD_RATIO mode) */
  worldRatio: number;
  /** Minimum size clamp in px (AUTO_ANNOTATION mode only) - 0 = disabled */
  minSizeClampPx?: number;
  /** Font family */
  fontFamily?: TextFontFamily;
  /** Font weight */
  fontWeight?: TextFontWeight;
  /** Text alignment */
  textAlign?: TextAlign;
  /** Text baseline */
  textBaseline?: TextBaseline;
  /** Enable anti-aliasing */
  antiAlias?: boolean;
  /** Text color (override entity color) */
  textColor?: string;
  /** Text opacity (0-1) */
  textOpacity?: number;
  /** Show/hide text */
  showText?: boolean;
}

export const DEFAULT_TEXT_RENDER_SETTINGS: TextRenderSettings = {
  scaleMode: "WORLD_RATIO",
  annotationPx: 14,
  worldRatio: 1,
  minSizeClampPx: 0,
  fontFamily: "Arial",
  fontWeight: "normal",
  textAlign: "left",
  textBaseline: "alphabetic",
  antiAlias: true,
  textColor: undefined, // use entity color
  textOpacity: 1,
  showText: true,
};

export interface EntityRenderOptions {
  isSelected?: boolean;
  isHovered?: boolean;
  resolvedStrokeColor?: string;
  resolvedFillColor?: string | null;
  resolvedLineWidth?: number;
  resolvedOpacity?: number;
  resolvedLineType?: string;
  /** Text render settings (VIEW OPTION) */
  textSettings?: TextRenderSettings;
}

// ==================== Line Dash Patterns ====================

const LINE_DASH_PATTERNS: Record<string, number[]> = {
  solid: [],
  Continuous: [],
  dashed: [10, 5],
  Dashed: [10, 5],
  dotted: [2, 3],
  Dotted: [2, 3],
  dashdot: [10, 3, 2, 3],
  DashDot: [10, 3, 2, 3],
};

export function getLineDashPattern(lineType: string, zoom: number): number[] {
  const pattern = LINE_DASH_PATTERNS[lineType] || [];
  // Scale pattern with zoom
  return pattern.map((v) => v * Math.max(1, zoom * 0.5));
}

// ==================== Entity Renderers ====================

export function renderLine(
  rc: RenderContext,
  entity: CadEntity,
  options: EntityRenderOptions
): void {
  const { ctx, zoom, worldToScreen } = rc;
  const {
    resolvedStrokeColor = "#ffffff",
    resolvedLineWidth = 1,
    resolvedLineType = "solid",
  } = options;

  if (entity.points.length < 2) return;

  ctx.strokeStyle = resolvedStrokeColor;
  ctx.lineWidth = resolvedLineWidth * zoom;
  ctx.setLineDash(getLineDashPattern(resolvedLineType, zoom));

  ctx.beginPath();
  const start = worldToScreen(entity.points[0].x, entity.points[0].y);
  ctx.moveTo(start.x, start.y);

  for (let i = 1; i < entity.points.length; i++) {
    const pt = worldToScreen(entity.points[i].x, entity.points[i].y);
    ctx.lineTo(pt.x, pt.y);
  }

  // Close polyline if needed
  if (
    entity.type === "polyline" &&
    entity.closed &&
    entity.points.length >= 3
  ) {
    ctx.closePath();
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

export function renderRect(
  rc: RenderContext,
  entity: CadEntity,
  options: EntityRenderOptions
): void {
  const { ctx, zoom, worldToScreen } = rc;
  const {
    resolvedStrokeColor = "#ffffff",
    resolvedFillColor,
    resolvedLineWidth = 1,
    resolvedOpacity = 1,
    resolvedLineType = "solid",
  } = options;

  if (entity.points.length < 2) return;

  const p1 = worldToScreen(entity.points[0].x, entity.points[0].y);
  const p2 = worldToScreen(entity.points[1].x, entity.points[1].y);

  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const w = Math.abs(p2.x - p1.x);
  const h = Math.abs(p2.y - p1.y);

  ctx.strokeStyle = resolvedStrokeColor;
  ctx.lineWidth = resolvedLineWidth * zoom;
  ctx.setLineDash(getLineDashPattern(resolvedLineType, zoom));

  // Fill first (behind stroke)
  if (resolvedFillColor) {
    ctx.save();
    ctx.globalAlpha = resolvedOpacity;
    ctx.fillStyle = resolvedFillColor;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}

export function renderCircle(
  rc: RenderContext,
  entity: CadEntity,
  options: EntityRenderOptions
): void {
  const { ctx, zoom, worldToScreen } = rc;
  const {
    resolvedStrokeColor = "#ffffff",
    resolvedFillColor,
    resolvedLineWidth = 1,
    resolvedOpacity = 1,
    resolvedLineType = "solid",
  } = options;

  if (entity.points.length < 2) return;

  const center = worldToScreen(entity.points[0].x, entity.points[0].y);
  const radius = entity.points[1].x * zoom;

  ctx.strokeStyle = resolvedStrokeColor;
  ctx.lineWidth = resolvedLineWidth * zoom;
  ctx.setLineDash(getLineDashPattern(resolvedLineType, zoom));

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

  // Fill first (behind stroke)
  if (resolvedFillColor) {
    ctx.save();
    ctx.globalAlpha = resolvedOpacity;
    ctx.fillStyle = resolvedFillColor;
    ctx.fill();
    ctx.restore();
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

export function renderArc(
  rc: RenderContext,
  entity: CadEntity,
  options: EntityRenderOptions
): void {
  const { ctx, zoom, worldToScreen } = rc;
  const {
    resolvedStrokeColor = "#ffffff",
    resolvedLineWidth = 1,
    resolvedLineType = "solid",
  } = options;

  if (entity.points.length < 2) return;

  const center = worldToScreen(entity.points[0].x, entity.points[0].y);
  const radius = entity.points[1].x * zoom;
  const startAngle = entity.startAngle ?? 0;
  const endAngle = entity.endAngle ?? Math.PI * 2;

  ctx.strokeStyle = resolvedStrokeColor;
  ctx.lineWidth = resolvedLineWidth * zoom;
  ctx.setLineDash(getLineDashPattern(resolvedLineType, zoom));

  ctx.beginPath();
  // Canvas arc goes clockwise, CAD usually counter-clockwise
  ctx.arc(center.x, center.y, radius, -startAngle, -endAngle, true);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function renderEllipse(
  rc: RenderContext,
  entity: CadEntity,
  options: EntityRenderOptions
): void {
  const { ctx, zoom, worldToScreen } = rc;
  const {
    resolvedStrokeColor = "#ffffff",
    resolvedFillColor,
    resolvedLineWidth = 1,
    resolvedOpacity = 1,
    resolvedLineType = "solid",
  } = options;

  if (entity.points.length < 1) return;

  const center = worldToScreen(entity.points[0].x, entity.points[0].y);
  const radiusX = (entity.radiusX ?? 50) * zoom;
  const radiusY = (entity.radiusY ?? 25) * zoom;
  const rotation = entity.rotation ?? 0;

  ctx.strokeStyle = resolvedStrokeColor;
  ctx.lineWidth = resolvedLineWidth * zoom;
  ctx.setLineDash(getLineDashPattern(resolvedLineType, zoom));

  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radiusX, radiusY, -rotation, 0, Math.PI * 2);

  // Fill first (behind stroke)
  if (resolvedFillColor) {
    ctx.save();
    ctx.globalAlpha = resolvedOpacity;
    ctx.fillStyle = resolvedFillColor;
    ctx.fill();
    ctx.restore();
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

export function renderText(
  rc: RenderContext,
  entity: CadEntity,
  options: EntityRenderOptions
): void {
  const { ctx, zoom, worldToScreen } = rc;
  const {
    resolvedStrokeColor = "#ffffff",
    isHovered,
    isSelected,
    textSettings = DEFAULT_TEXT_RENDER_SETTINGS,
  } = options;

  // Check showText setting
  if (textSettings.showText === false) return;

  if (entity.points.length < 1) return;

  const pos = worldToScreen(entity.points[0].x, entity.points[0].y);

  // ========================================================================
  // 2D FIRST, 3D READY: TEXT RENDER SIZE CALCULATION
  // ========================================================================
  // Entity stores fontSizeMm (world/mm units) - INVARIANT
  // TextSettings controls HOW to render (VIEW OPTION)
  // ========================================================================
  const fontSizeMm = entity.fontSize ?? 12;
  const entityScale = entity.textScale ?? 1;
  const rotation = entity.textRotation ?? 0;

  let fontSize: number;
  if (textSettings.scaleMode === "AUTO_ANNOTATION") {
    // Pixel-constant: text giữ kích thước cố định trên màn hình
    // Không phụ thuộc zoom, chỉ dùng annotationPx
    fontSize = textSettings.annotationPx * entityScale;
  } else {
    // WORLD_RATIO: render = fontSizeMm * zoom * worldRatio * entityScale
    fontSize = fontSizeMm * zoom * textSettings.worldRatio * entityScale;

    // Apply min size clamp if enabled
    const minClamp = textSettings.minSizeClampPx ?? 0;
    if (minClamp > 0 && fontSize < minClamp) {
      fontSize = minClamp;
    }
  }

  const lineHeight = fontSize * 1.2;

  // Determine font settings from TextRenderSettings or entity
  const fontFamily = textSettings.fontFamily ?? entity.fontFamily ?? "Arial";
  const fontWeight = textSettings.fontWeight ?? "normal";
  const textAlign = textSettings.textAlign ?? "left";
  const textBaseline = textSettings.textBaseline ?? "alphabetic";
  const textColor =
    textSettings.textColor ?? entity.color ?? resolvedStrokeColor ?? "#ffffff";
  const textOpacity = textSettings.textOpacity ?? 1;

  ctx.save();

  // Apply anti-aliasing setting
  if (textSettings.antiAlias === false) {
    ctx.imageSmoothingEnabled = false;
  }

  // Apply transformations
  ctx.translate(pos.x, pos.y);
  ctx.rotate(-rotation); // Negative because canvas Y is inverted

  // Set text properties
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.globalAlpha = textOpacity;
  ctx.textAlign = textAlign as CanvasTextAlign;
  ctx.textBaseline =
    textBaseline === "alphabetic"
      ? "bottom"
      : (textBaseline as CanvasTextBaseline);

  // Draw multiline text
  const textContent = entity.text ?? "";
  const lines = textContent.split("\n");
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, index * lineHeight);
  });

  ctx.restore();

  // Draw hover overlay for text (bounding box when hovering)
  if (isHovered && !isSelected && entity.text) {
    ctx.save();
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // Calculate bounding box for multiline text
    let maxWidth = 0;
    lines.forEach((line) => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) maxWidth = metrics.width;
    });
    const textWidth = maxWidth;
    const textHeight = lines.length * lineHeight;

    ctx.strokeRect(
      pos.x - 2,
      pos.y - fontSize - 2,
      textWidth + 4,
      textHeight + 4
    );
    ctx.restore();
  }
}

// ==================== Selection Grips ====================

export function renderSelectionGrips(
  rc: RenderContext,
  entity: CadEntity,
  entityBoundsFn: (entity: CadEntity) => { min: Point; max: Point }
): void {
  const { ctx, worldToScreen } = rc;

  ctx.fillStyle = "#00bfff";

  if (entity.type === "line" || entity.type === "polyline") {
    // Draw grips at actual points
    entity.points.forEach((pt) => {
      const screenPt = worldToScreen(pt.x, pt.y);
      ctx.fillRect(screenPt.x - 4, screenPt.y - 4, 8, 8);
    });
  } else if (entity.type === "circle") {
    // Draw grip at center
    const center = worldToScreen(entity.points[0].x, entity.points[0].y);
    ctx.fillRect(center.x - 4, center.y - 4, 8, 8);

    // Draw grips at quadrant points
    const radius = entity.points[1].x;
    const quadrants = [
      { x: entity.points[0].x, y: entity.points[0].y - radius },
      { x: entity.points[0].x, y: entity.points[0].y + radius },
      { x: entity.points[0].x - radius, y: entity.points[0].y },
      { x: entity.points[0].x + radius, y: entity.points[0].y },
    ];
    quadrants.forEach((q) => {
      const screenQ = worldToScreen(q.x, q.y);
      ctx.fillRect(screenQ.x - 4, screenQ.y - 4, 8, 8);
    });
  } else if (entity.type === "rect") {
    // Draw grips at 4 corners
    const bounds = entityBoundsFn(entity);
    const corners = [
      worldToScreen(bounds.min.x, bounds.min.y),
      worldToScreen(bounds.max.x, bounds.min.y),
      worldToScreen(bounds.min.x, bounds.max.y),
      worldToScreen(bounds.max.x, bounds.max.y),
    ];
    corners.forEach((c) => ctx.fillRect(c.x - 4, c.y - 4, 8, 8));
  } else if (entity.type === "text") {
    // Draw grip at text position
    if (entity.points.length > 0) {
      const textPos = worldToScreen(entity.points[0].x, entity.points[0].y);
      ctx.fillRect(textPos.x - 4, textPos.y - 4, 8, 8);
    }
  }
}

// ==================== Main Entity Render Function ====================

export function renderEntity(
  rc: RenderContext,
  entity: CadEntity,
  options: EntityRenderOptions,
  entityBoundsFn: (entity: CadEntity) => { min: Point; max: Point }
): void {
  const { isSelected } = options;

  switch (entity.type) {
    case "line":
    case "polyline":
      renderLine(rc, entity, options);
      break;
    case "rect":
      renderRect(rc, entity, options);
      break;
    case "circle":
      renderCircle(rc, entity, options);
      break;
    case "arc":
      renderArc(rc, entity, options);
      break;
    case "ellipse":
      renderEllipse(rc, entity, options);
      break;
    case "text":
      renderText(rc, entity, options);
      break;
  }

  // Draw selection grips if selected
  if (isSelected) {
    renderSelectionGrips(rc, entity, entityBoundsFn);
  }
}

// ==================== Preview Entity Render ====================

export function renderPreviewEntity(
  rc: RenderContext,
  preview: CadEntity
): void {
  const { ctx, zoom, worldToScreen } = rc;

  if (!preview.points.length) return;

  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 2;

  if (preview.type === "line" || preview.type === "polyline") {
    ctx.beginPath();
    const start = worldToScreen(preview.points[0].x, preview.points[0].y);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < preview.points.length; i++) {
      const pt = worldToScreen(preview.points[i].x, preview.points[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    if (preview.closed && preview.points.length >= 3) {
      ctx.closePath();
    }
    ctx.stroke();
  } else if (preview.type === "rect" && preview.points.length >= 2) {
    const p1 = worldToScreen(preview.points[0].x, preview.points[0].y);
    const p2 = worldToScreen(preview.points[1].x, preview.points[1].y);
    ctx.strokeRect(
      Math.min(p1.x, p2.x),
      Math.min(p1.y, p2.y),
      Math.abs(p2.x - p1.x),
      Math.abs(p2.y - p1.y)
    );
  } else if (preview.type === "circle" && preview.points.length >= 2) {
    const center = worldToScreen(preview.points[0].x, preview.points[0].y);
    const radius = preview.points[1].x * zoom;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (preview.type === "ellipse" && preview.points.length >= 1) {
    const center = worldToScreen(preview.points[0].x, preview.points[0].y);
    const radiusX = (preview.radiusX ?? 50) * zoom;
    const radiusY = (preview.radiusY ?? 25) * zoom;
    const rotation = preview.rotation ?? 0;
    ctx.beginPath();
    ctx.ellipse(
      center.x,
      center.y,
      radiusX,
      radiusY,
      -rotation,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  } else if (preview.type === "arc" && preview.points.length >= 2) {
    const center = worldToScreen(preview.points[0].x, preview.points[0].y);
    const radius = preview.points[1].x * zoom;
    const startAngle = preview.startAngle ?? 0;
    const endAngle = preview.endAngle ?? Math.PI * 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, -startAngle, -endAngle, true);
    ctx.stroke();
  } else if (preview.type === "text" && preview.points.length >= 1) {
    const pos = worldToScreen(preview.points[0].x, preview.points[0].y);
    const fontSize = (preview.fontSize ?? 12) * zoom;
    ctx.font = `${fontSize}px ${preview.fontFamily ?? "Arial"}`;
    ctx.fillStyle = "#00ff00";
    ctx.textBaseline = "bottom";
    ctx.fillText(preview.text ?? "Text", pos.x, pos.y);
  }

  ctx.restore();
}
