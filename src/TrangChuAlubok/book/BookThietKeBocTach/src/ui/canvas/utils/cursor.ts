/**
 * Cursor style mapping utilities
 * Maps tool modes and states to CSS cursor values
 */

import { ToolMode } from "../../../core/engine/EngineState";

export type CursorStyle =
  | "default"
  | "crosshair"
  | "pointer"
  | "move"
  | "grab"
  | "grabbing"
  | "ns-resize"
  | "ew-resize"
  | "nesw-resize"
  | "nwse-resize"
  | "text"
  | "not-allowed"
  | "wait"
  | "help";

export interface CursorContext {
  tool: ToolMode;
  isDrawing: boolean;
  isSelecting: boolean;
  isMoving: boolean;
  isPanning: boolean;
  hoveredEntityId: string | null;
  hoveredDimensionId: string | null;
  hoveredGripType: string | null;
}

/**
 * Get cursor style based on current context
 */
export function getCursorStyle(context: CursorContext): CursorStyle {
  // Panning takes priority
  if (context.isPanning) {
    return "grabbing";
  }

  // Moving entities
  if (context.isMoving) {
    return "move";
  }

  // Selecting with box
  if (context.isSelecting) {
    return "crosshair";
  }

  // Hovering over grip points
  if (context.hoveredGripType) {
    switch (context.hoveredGripType) {
      case "point1":
      case "point2":
      case "dimP1":
      case "dimP2":
        return "move";
      case "text":
        return "ns-resize";
      default:
        return "pointer";
    }
  }

  // Drawing mode
  if (context.isDrawing) {
    return "crosshair";
  }

  // Tool-specific cursors
  switch (context.tool) {
    case ToolMode.SELECT:
      if (context.hoveredEntityId || context.hoveredDimensionId) {
        return "pointer";
      }
      return "default";

    case ToolMode.DRAW_LINE:
    case ToolMode.DRAW_POLYGON:
    case ToolMode.DRAW_RECT:
    case ToolMode.DRAW_CIRCLE:
    case ToolMode.DRAW_ARC:
    case ToolMode.DRAW_ELLIPSE:
    case ToolMode.DRAW_DIMENSION:
    case ToolMode.DRAW_DIM_LINEAR:
    case ToolMode.DRAW_DIM_ALIGNED:
    case ToolMode.DRAW_DIM_ANGULAR:
    case ToolMode.DRAW_DIM_RADIUS:
    case ToolMode.DRAW_QDIM:
    case ToolMode.DRAW_DIMCONTINUE:
    case ToolMode.DRAW_DIMARC:
      return "crosshair";

    case ToolMode.DRAW_TEXT:
      return "text";

    case ToolMode.MOVE:
    case ToolMode.COPY:
      return "move";

    case ToolMode.ROTATE:
    case ToolMode.SCALE:
    case ToolMode.MIRROR:
      return "crosshair";

    case ToolMode.TRIM:
    case ToolMode.EXTEND:
    case ToolMode.OFFSET:
    case ToolMode.FILLET:
      return "crosshair";

    case ToolMode.PAN:
      return "grab";

    case ToolMode.ZOOM:
      return "crosshair";

    default:
      return "default";
  }
}

/**
 * Get cursor URL for custom cursors (if needed)
 */
export function getCustomCursorUrl(cursorName: string): string | null {
  const customCursors: Record<string, string> = {
    // Add custom cursor URLs here if needed
    // crosshairSnap: '/cursors/crosshair-snap.cur',
  };
  return customCursors[cursorName] || null;
}
