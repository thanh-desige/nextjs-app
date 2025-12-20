/**
 * EntityRenderer - Renders CAD entities to canvas
 * Pure rendering functions - no state management
 */

import type { Point, CadEntity } from "../types/CadEntity";

// Re-export for backward compatibility
export type { Point, CadEntity };

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  zoom: number;
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  point: Point,
  centerX: number,
  centerY: number,
  zoom: number
): Point {
  return {
    x: centerX + point.x * zoom,
    y: centerY - point.y * zoom,
  };
}

/**
 * Render a single entity
 */
export function renderEntity(
  entity: CadEntity,
  context: RenderContext,
  options: {
    isSelected?: boolean;
    isHovered?: boolean;
    selectionColor?: string;
    hoverColor?: string;
  } = {}
): void {
  const { ctx, zoom } = context;
  const {
    isSelected,
    isHovered,
    selectionColor = "#00BFFF",
    hoverColor = "#FFD700",
  } = options;

  if (entity.visible === false) return;

  ctx.save();

  // Set stroke style
  if (isSelected) {
    ctx.strokeStyle = selectionColor;
    ctx.lineWidth = (entity.lineWidth + 1) * (zoom > 1 ? 1 : zoom);
  } else if (isHovered) {
    ctx.strokeStyle = hoverColor;
    ctx.lineWidth = (entity.lineWidth + 0.5) * (zoom > 1 ? 1 : zoom);
  } else {
    ctx.strokeStyle = entity.color;
    ctx.lineWidth = entity.lineWidth * (zoom > 1 ? 1 : zoom);
  }

  switch (entity.type) {
    case "line":
    case "polyline":
      renderPolyline(entity, context);
      break;
    case "rect":
      renderRect(entity, context);
      break;
    case "circle":
      renderCircle(entity, context);
      break;
    case "arc":
      renderArc(entity, context);
      break;
    case "ellipse":
      renderEllipse(entity, context);
      break;
    case "text":
      renderText(entity, context, isSelected);
      break;
  }

  ctx.restore();
}

function renderPolyline(entity: CadEntity, context: RenderContext): void {
  const { ctx, centerX, centerY, zoom } = context;
  const { points } = entity;

  if (points.length < 2) return;

  ctx.beginPath();
  const start = worldToScreen(points[0], centerX, centerY, zoom);
  ctx.moveTo(start.x, start.y);

  for (let i = 1; i < points.length; i++) {
    const p = worldToScreen(points[i], centerX, centerY, zoom);
    ctx.lineTo(p.x, p.y);
  }

  ctx.stroke();
}

function renderRect(entity: CadEntity, context: RenderContext): void {
  const { ctx, centerX, centerY, zoom } = context;
  const { points } = entity;

  if (points.length < 2) return;

  // 2 points: opposite corners (origin and opposite corner)
  const p1 = worldToScreen(points[0], centerX, centerY, zoom);
  const p2 = worldToScreen(points[1], centerX, centerY, zoom);

  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const w = Math.abs(p2.x - p1.x);
  const h = Math.abs(p2.y - p1.y);

  ctx.strokeRect(x, y, w, h);
}

function renderCircle(entity: CadEntity, context: RenderContext): void {
  const { ctx, centerX, centerY, zoom } = context;
  const { points } = entity;

  if (points.length < 2) return;

  const center = worldToScreen(points[0], centerX, centerY, zoom);
  const radius = points[1].x * zoom; // radius stored in points[1].x

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function renderArc(entity: CadEntity, context: RenderContext): void {
  const { ctx, centerX, centerY, zoom } = context;
  const { points, startAngle = 0, endAngle = Math.PI } = entity;

  if (points.length < 2) return;

  const center = worldToScreen(points[0], centerX, centerY, zoom);
  const radius = points[1].x * zoom;

  ctx.beginPath();
  // Note: Canvas arc uses clockwise, CAD uses counter-clockwise
  ctx.arc(center.x, center.y, radius, -startAngle, -endAngle, true);
  ctx.stroke();
}

function renderEllipse(entity: CadEntity, context: RenderContext): void {
  const { ctx, centerX, centerY, zoom } = context;
  const { points, radiusX = 50, radiusY = 30, rotation = 0 } = entity;

  if (points.length < 1) return;

  const center = worldToScreen(points[0], centerX, centerY, zoom);
  const rx = radiusX * zoom;
  const ry = radiusY * zoom;

  ctx.beginPath();
  ctx.ellipse(center.x, center.y, rx, ry, -rotation, 0, Math.PI * 2);
  ctx.stroke();
}

function renderText(
  entity: CadEntity,
  context: RenderContext,
  isSelected?: boolean
): void {
  const { ctx, centerX, centerY, zoom } = context;
  const { points, text = "", fontSize = 14, fontFamily = "Arial" } = entity;

  if (points.length < 1 || !text) return;

  const pos = worldToScreen(points[0], centerX, centerY, zoom);
  const scaledFontSize = Math.max(8, fontSize * zoom);

  ctx.font = `${scaledFontSize}px ${fontFamily}`;
  ctx.fillStyle = isSelected ? "#00BFFF" : entity.color;
  ctx.textBaseline = "bottom";
  ctx.fillText(text, pos.x, pos.y);
}

/**
 * Render multiple entities
 */
export function renderEntities(
  entities: CadEntity[],
  context: RenderContext,
  selectedIds: Set<string>,
  hoveredId: string | null
): void {
  for (const entity of entities) {
    renderEntity(entity, context, {
      isSelected: selectedIds.has(entity.id),
      isHovered: entity.id === hoveredId,
    });
  }
}

/**
 * Render selection grips for selected entities
 */
export function renderSelectionGrips(
  entities: CadEntity[],
  context: RenderContext,
  gripSize: number = 6
): void {
  const { ctx, centerX, centerY, zoom } = context;

  ctx.fillStyle = "#00BFFF";

  for (const entity of entities) {
    for (const point of entity.points) {
      const screenPos = worldToScreen(point, centerX, centerY, zoom);
      ctx.fillRect(
        screenPos.x - gripSize / 2,
        screenPos.y - gripSize / 2,
        gripSize,
        gripSize
      );
    }
  }
}
