/**
 * Tool helpers for CAD canvas
 * Contains tool type detection, naming, and cursor utilities
 */

import { ToolMode } from "../../../core/engine/EngineState";
import type { DrawingState, DimensionGrip } from "./types";

/**
 * Get the tool type from ToolMode
 */
export function getToolType(
  tool: ToolMode
):
  | "line"
  | "rect"
  | "circle"
  | "arc"
  | "ellipse"
  | "text"
  | "select"
  | "dimension"
  | "modify"
  | null {
  switch (tool) {
    case ToolMode.DRAW_LINE:
    case ToolMode.DRAW_POLYGON:
      return "line";
    case ToolMode.DRAW_RECT:
      return "rect";
    case ToolMode.DRAW_CIRCLE:
      return "circle";
    case ToolMode.DRAW_ARC:
      return "arc";
    case ToolMode.DRAW_ELLIPSE:
      return "ellipse";
    case ToolMode.DRAW_TEXT:
      return "text";
    case ToolMode.SELECT:
      return "select";
    case ToolMode.DRAW_DIMENSION:
    case ToolMode.DRAW_DIM_LINEAR:
    case ToolMode.DRAW_DIM_ALIGNED:
    case ToolMode.DRAW_DIM_ANGULAR:
    case ToolMode.DRAW_DIM_RADIUS:
    case ToolMode.DRAW_QDIM:
    case ToolMode.DRAW_DIMCONTINUE:
    case ToolMode.DRAW_DIMARC:
      return "dimension";
    case ToolMode.MOVE:
    case ToolMode.COPY:
    case ToolMode.ROTATE:
    case ToolMode.SCALE:
    case ToolMode.MIRROR:
    case ToolMode.TRIM:
    case ToolMode.EXTEND:
    case ToolMode.OFFSET:
    case ToolMode.FILLET:
      return "modify";
    default:
      return null;
  }
}

/**
 * Get the display name for a tool
 */
export function getToolName(tool: ToolMode): string | null {
  switch (tool) {
    case ToolMode.DRAW_LINE:
      return "LINE";
    case ToolMode.DRAW_POLYGON:
      return "POLYGON";
    case ToolMode.DRAW_RECT:
      return "RECTANGLE";
    case ToolMode.DRAW_CIRCLE:
      return "CIRCLE";
    case ToolMode.DRAW_ARC:
      return "ARC";
    case ToolMode.DRAW_ELLIPSE:
      return "ELLIPSE";
    case ToolMode.DRAW_TEXT:
      return "TEXT";
    case ToolMode.DRAW_DIMENSION:
      return "DIMENSION";
    case ToolMode.DRAW_DIM_LINEAR:
      return "DIMLINEAR";
    case ToolMode.DRAW_DIM_ALIGNED:
      return "DIMALIGNED";
    case ToolMode.DRAW_DIM_ANGULAR:
      return "DIMANGULAR";
    case ToolMode.DRAW_DIM_RADIUS:
      return "DIMRADIUS";
    case ToolMode.DRAW_QDIM:
      return "QDIM";
    case ToolMode.DRAW_DIMCONTINUE:
      return "DIMCONTINUE";
    case ToolMode.DRAW_DIMARC:
      return "DIMARC";
    default:
      return null;
  }
}

/**
 * Get the appropriate cursor for current tool/state
 */
export function getCursor(
  tool: ToolMode,
  state: DrawingState,
  hoveredId: string | null,
  hoveredDimensionId: string | null,
  hoveredGrip: DimensionGrip | null
): string {
  if (state.mode === "moving") return "move";
  if (state.mode === "movingDimension") return "ns-resize";
  if (state.mode === "editingDimensionGrip") return "move";
  if (state.mode === "selecting") return "crosshair";
  if (state.mode !== "idle") return "crosshair";
  if (hoveredGrip) return "pointer";
  if (tool === ToolMode.SELECT) {
    if (hoveredDimensionId) return "pointer";
    return hoveredId ? "pointer" : "default";
  }
  switch (tool) {
    case ToolMode.DRAW_LINE:
    case ToolMode.DRAW_POLYGON:
    case ToolMode.DRAW_RECT:
    case ToolMode.DRAW_CIRCLE:
    case ToolMode.DRAW_ARC:
    case ToolMode.DRAW_ELLIPSE:
    case ToolMode.DRAW_TEXT:
    case ToolMode.DRAW_DIMENSION:
    case ToolMode.DRAW_DIM_LINEAR:
    case ToolMode.DRAW_DIM_ALIGNED:
    case ToolMode.DRAW_DIM_ANGULAR:
    case ToolMode.DRAW_DIM_RADIUS:
    case ToolMode.DRAW_QDIM:
    case ToolMode.DRAW_DIMCONTINUE:
    case ToolMode.DRAW_DIMARC:
      return "crosshair";
    default:
      return "default";
  }
}
