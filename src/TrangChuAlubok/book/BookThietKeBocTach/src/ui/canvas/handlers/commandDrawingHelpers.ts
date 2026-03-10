/**
 * commandDrawingHelpers.ts - Helper functions for useCommandDrawing
 * STEP-5.7: Extracted from useCommandDrawing.ts
 *
 * Pure functions with no React dependencies (except types).
 * Used by the main hook and all sub-hooks.
 */

import { ToolMode } from "../../../core/engine/EngineState";
import type { IInteractiveCommand } from "../../../core/commands/Command.types";
import { EntityType } from "../../../core/entities/Entity.types";
import { LineCommand } from "../../../core/commands/draw/LINE";
import { RectCommand } from "../../../core/commands/draw/RECT";
import { CircleCommand } from "../../../core/commands/draw/CIRCLE";
import { ArcCommand } from "../../../core/commands/draw/ARC";
import { EllipseCommand } from "../../../core/commands/draw/ELLIPSE";
import { TextCommand } from "../../../core/commands/draw/TEXT";
import { PolygonCommand } from "../../../core/commands/draw/POLYGON";
import type { Point, CadEntity } from "../types/CadEntity";
import type { CommandDrawingInternals } from "./commandDrawing.types";

// ==================== Drawing Tool Detection ====================

export const DRAWING_TOOLS = [
  ToolMode.DRAW_LINE,
  ToolMode.DRAW_RECT,
  ToolMode.DRAW_CIRCLE,
  ToolMode.DRAW_ARC,
  ToolMode.DRAW_ELLIPSE,
  ToolMode.DRAW_TEXT,
  ToolMode.DRAW_POLYGON,
];

export function isDrawingTool(tool: ToolMode): boolean {
  return DRAWING_TOOLS.includes(tool);
}

export function createCommand(tool: ToolMode): IInteractiveCommand | null {
  switch (tool) {
    case ToolMode.DRAW_LINE:
      return new LineCommand();
    case ToolMode.DRAW_RECT:
      return new RectCommand();
    case ToolMode.DRAW_CIRCLE:
      return new CircleCommand();
    case ToolMode.DRAW_ARC:
      return new ArcCommand();
    case ToolMode.DRAW_ELLIPSE:
      return new EllipseCommand();
    case ToolMode.DRAW_TEXT:
      return new TextCommand();
    case ToolMode.DRAW_POLYGON:
      return new PolygonCommand();
    default:
      return null;
  }
}

// ==================== Entity Type Mapping ====================

/** Map EntityType enum to canvas entity type string */
export function mapEntityType(entityType: EntityType): CadEntity["type"] {
  const typeMap: Record<string, CadEntity["type"]> = {
    [EntityType.LINE]: "line",
    [EntityType.RECT]: "rect",
    [EntityType.CIRCLE]: "circle",
    [EntityType.ARC]: "arc",
    [EntityType.ELLIPSE]: "ellipse",
    [EntityType.TEXT]: "text",
    [EntityType.POLYLINE]: "polyline",
  };
  return typeMap[entityType] || "line";
}

// ==================== Convert IEntity to CadEntity ====================

/**
 * Convert IEntity (from Command system) to CadEntity (for canvas rendering)
 */
export function convertToCadEntity(
  entity: unknown,
  effectiveLayerId: string | undefined
): CadEntity | null {
  if (!entity) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = entity as any;

  // Get points from entity - check specific entity types FIRST before generic getPoints()
  let points: Point[] = [];

  // Check specific entity types first (their getPoints() may not return what we need)
  if (e.origin && e.width !== undefined && e.height !== undefined) {
    // Rect entity - use 2 opposite corners for preview
    points = [
      { x: e.origin.x, y: e.origin.y },
      { x: e.origin.x + e.width, y: e.origin.y + e.height },
    ];
  } else if (e.center && e.radius !== undefined) {
    // Circle/Arc entity
    points = [
      { x: e.center.x, y: e.center.y },
      { x: e.radius, y: 0 },
    ];
  } else if (e.start && e.end) {
    // Line entity
    points = [
      { x: e.start.x, y: e.start.y },
      { x: e.end.x, y: e.end.y },
    ];
  } else if (e.type === EntityType.POLYLINE && Array.isArray(e.points)) {
    // Polyline entity - has points array and closed property
    points = e.points.map((p: { x: number; y: number }) => ({
      x: p.x,
      y: p.y,
    }));
  } else if (typeof e.getPoints === "function") {
    // Generic fallback
    const rawPoints = e.getPoints();
    points = rawPoints.map((p: { x: number; y: number }) => ({
      x: p.x,
      y: p.y,
    }));
  } else if (e.points) {
    points = e.points;
  }

  // Basic conversion
  const base: CadEntity = {
    id: e.id || `entity-${Date.now()}`,
    type: mapEntityType(e.type),
    points,
    color: e.style?.strokeColor || "#ffffff",
    lineWidth: e.style?.strokeWidth || 2,
    fillColor: e.style?.fillColor || null,
    fillOpacity: e.style?.opacity ?? 0.5,
    layer: effectiveLayerId,
    useLayerStyle: true, // Default to ByLayer for converted entities
  };

  // Polyline-specific: closed property
  if (e.type === EntityType.POLYLINE || e.type === "POLYLINE") {
    base.closed = e.closed ?? false;
  }

  // Arc-specific properties
  if (e.type === EntityType.ARC || e.type === "ARC") {
    base.startAngle = e.startAngle;
    base.endAngle = e.endAngle;
  }

  // Ellipse-specific properties
  if (e.type === EntityType.ELLIPSE || e.type === "ELLIPSE") {
    base.radiusX = e.radiusX;
    base.radiusY = e.radiusY;
    base.rotation = e.rotation || 0;
  }

  // Text-specific properties
  if (e.type === EntityType.TEXT || e.type === "TEXT") {
    base.text = e.content || e.text || "";
    base.fontSize = e.fontSize;
    base.fontFamily = e.fontFamily;
  }

  return base;
}

// ==================== Ortho Mode ====================

/** Apply ortho constraint to point (horizontal/vertical snap) */
export function applyOrthoMode(
  point: Point,
  orthoMode: boolean,
  pointsRef: { current: Point[] }
): Point {
  if (!orthoMode || pointsRef.current.length === 0) {
    return point;
  }
  const lastPoint = pointsRef.current[pointsRef.current.length - 1];
  const dx = Math.abs(point.x - lastPoint.x);
  const dy = Math.abs(point.y - lastPoint.y);

  if (dx > dy) {
    return { x: point.x, y: lastPoint.y };
  } else {
    return { x: lastPoint.x, y: point.y };
  }
}

// ==================== Restart Command (DRY) ====================

/**
 * Restart drawing command — shared pattern used by all handlers.
 * Resets command, points, preview, and prompt.
 */
export function restartDrawingCommand(
  internals: CommandDrawingInternals
): void {
  const { activeTool } = internals;
  const newCommand = createCommand(activeTool);
  if (newCommand) {
    internals.commandRef.current = newCommand;
    internals.setCommand(newCommand);
    internals.pointsRef.current = [];
    internals.setPoints([]);
    internals.setPreviewEntity(null);
    const newPrompt = newCommand.getPrompt(0);
    internals.setPrompt(newPrompt);
    internals.onPromptChangeRef.current?.(newPrompt);
  }
}
