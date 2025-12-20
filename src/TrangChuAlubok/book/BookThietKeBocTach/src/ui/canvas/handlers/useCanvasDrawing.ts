/**
 * useCanvasDrawing - Complete integration hook for canvas drawing
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 *
 * This hook provides:
 * 1. Mouse event handlers that delegate to commands
 * 2. Keyboard event handlers (Enter, Escape, etc.)
 * 3. Preview entity management
 * 4. State synchronization with canvas
 */

"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useDrawingHandler, DrawingHandlerConfig } from "./useDrawingHandler";
import { findOsnapPoint } from "../utils/osnapUtils";
import { snapToGridPoint, applyOrtho } from "../utils/geometry";
import type { Point } from "../utils/types";
import type { IEntity } from "../../../core/entities/Entity.types";

// ==================== Types ====================

export interface CanvasDrawingConfig extends DrawingHandlerConfig {
  /** Entities for OSNAP detection */
  entities: Array<{
    id?: string;
    type: string;
    points: Point[];
    color?: string;
    lineWidth?: number;
  }>;
  /** Dimensions for OSNAP detection */
  dimensions?: Array<{ point1: Point; point2: Point }>;
  /** OSNAP modes */
  osnapModes?: Record<string, boolean>;
}

export interface CanvasDrawingState {
  /** Is currently drawing */
  isDrawing: boolean;
  /** Points collected so far */
  points: Point[];
  /** Preview entity from command */
  previewEntity: IEntity | null;
  /** Current prompt message */
  prompt: string;
  /** Current OSNAP point if any */
  osnapPoint: { point: Point; type: string } | null;
  /** Available options for current command */
  options: Array<{ key: string; label: string }>;
}

export interface CanvasDrawingHandlers {
  /** Process mouse down event - returns true if handled */
  onMouseDown: (worldPos: Point, screenPos: Point, button: number) => boolean;
  /** Process mouse move event - update preview */
  onMouseMove: (worldPos: Point, screenPos: Point) => void;
  /** Process double click - finish drawing */
  onDoubleClick: (worldPos: Point) => boolean;
  /** Process key down */
  onKeyDown: (key: string, ctrl: boolean, shift: boolean) => boolean;
  /** Process right click - context menu or finish */
  onRightClick: (worldPos: Point) => boolean;
  /** Cancel current drawing */
  cancel: () => void;
  /** Apply snap (grid, osnap, ortho) to a point */
  applySnap: (worldPos: Point, fromPoint?: Point) => Point;
}

export interface UseCanvasDrawingReturn {
  state: CanvasDrawingState;
  handlers: CanvasDrawingHandlers;
}

// ==================== Hook Implementation ====================

export function useCanvasDrawing(
  config: CanvasDrawingConfig,
  onPromptChange?: (prompt: string) => void
): UseCanvasDrawingReturn {
  const {
    activeTool,
    snapToGrid,
    gridSpacing,
    orthoMode,
    osnapEnabled,
    entities,
    osnapModes = {
      endpoint: true,
      midpoint: true,
      center: true,
      intersection: false,
      perpendicular: false,
      nearest: false,
    },
  } = config;

  // Use the base drawing handler
  const { state: drawingState, actions: drawingActions } = useDrawingHandler(
    { activeTool, snapToGrid, gridSpacing, orthoMode, osnapEnabled },
    onPromptChange
  );

  // OSNAP state
  const [osnapPoint, setOsnapPoint] = useState<{
    point: Point;
    type: string;
  } | null>(null);

  // Entities ref for OSNAP (avoid stale closure)
  const entitiesRef = useRef(entities);
  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);

  // Apply snap logic (grid, osnap, ortho)
  const applySnap = useCallback(
    (worldPos: Point, fromPoint?: Point): Point => {
      let result = worldPos;

      // 1. Check OSNAP first (highest priority)
      if (osnapEnabled) {
        // findOsnapPoint signature: (cursor, entities, layers, osnapEnabled, osnapModes, osnapAperture, fromPoint)
        const osnap = findOsnapPoint(
          worldPos,
          entitiesRef.current as unknown as Parameters<
            typeof findOsnapPoint
          >[1],
          [], // layers - empty for now
          true, // osnapEnabled
          osnapModes as unknown as Parameters<typeof findOsnapPoint>[4], // osnapModes
          10, // osnapAperture
          fromPoint
        );
        if (osnap) {
          setOsnapPoint(osnap);
          result = osnap.point;
          return result;
        }
      }

      // 2. Apply ortho mode
      if (orthoMode && fromPoint) {
        result = applyOrtho(fromPoint, result);
      }

      // 3. Apply grid snap
      if (snapToGrid) {
        result = snapToGridPoint(result, gridSpacing);
      }

      setOsnapPoint(null);
      return result;
    },
    [osnapEnabled, osnapModes, orthoMode, snapToGrid, gridSpacing]
  );

  // Get from point for ortho/perpendicular
  const getFromPoint = useCallback((): Point | undefined => {
    if (drawingState.points.length > 0) {
      return drawingState.points[drawingState.points.length - 1];
    }
    return undefined;
  }, [drawingState.points]);

  // Handle mouse down
  const onMouseDown = useCallback(
    (worldPos: Point, _screenPos: Point, button: number): boolean => {
      // Only handle left click for drawing
      if (button !== 0) return false;

      // Check if this is a drawing tool
      if (!drawingActions.isDrawingTool()) {
        return false;
      }

      // Apply snapping
      const fromPoint = getFromPoint();
      const snappedPos = applySnap(worldPos, fromPoint);

      // Delegate to drawing handler
      drawingActions.handleMouseDown(snappedPos);

      return true;
    },
    [drawingActions, applySnap, getFromPoint]
  );

  // Handle mouse move
  const onMouseMove = useCallback(
    (worldPos: Point, _screenPos: Point): void => {
      if (!drawingActions.isDrawingTool()) {
        setOsnapPoint(null);
        return;
      }

      // Apply snapping
      const fromPoint = getFromPoint();
      const snappedPos = applySnap(worldPos, fromPoint);

      // Update preview
      drawingActions.handleMouseMove(snappedPos);
    },
    [drawingActions, applySnap, getFromPoint]
  );

  // Handle double click
  const onDoubleClick = useCallback(
    (worldPos: Point): boolean => {
      if (!drawingActions.isDrawingTool()) {
        return false;
      }

      const fromPoint = getFromPoint();
      const snappedPos = applySnap(worldPos, fromPoint);

      drawingActions.handleDoubleClick(snappedPos);
      return true;
    },
    [drawingActions, applySnap, getFromPoint]
  );

  // Handle key down
  const onKeyDown = useCallback(
    (key: string, _ctrl: boolean, _shift: boolean): boolean => {
      if (!drawingActions.isDrawingTool()) {
        return false;
      }

      const lowerKey = key.toLowerCase();

      if (lowerKey === "enter" || lowerKey === "space") {
        drawingActions.handleEnter();
        return true;
      }

      if (lowerKey === "escape") {
        drawingActions.handleEscape();
        return true;
      }

      // Check for command options (single letter shortcuts)
      const options = drawingActions.getOptions();
      const matchingOption = options.find(
        (opt) => opt.key.toLowerCase() === lowerKey
      );
      if (matchingOption) {
        drawingActions.handleOption(matchingOption.key);
        return true;
      }

      return false;
    },
    [drawingActions]
  );

  // Handle right click
  const onRightClick = useCallback(
    (worldPos: Point): boolean => {
      if (!drawingActions.isDrawingTool()) {
        return false;
      }

      const fromPoint = getFromPoint();
      const snappedPos = applySnap(worldPos, fromPoint);

      drawingActions.handleRightClick(snappedPos);
      return true;
    },
    [drawingActions, applySnap, getFromPoint]
  );

  // Cancel
  const cancel = useCallback(() => {
    drawingActions.handleEscape();
    setOsnapPoint(null);
  }, [drawingActions]);

  // Build state
  const state: CanvasDrawingState = {
    isDrawing: drawingState.isDrawing,
    points: drawingState.points,
    previewEntity: drawingState.previewEntity,
    prompt: drawingState.prompt,
    osnapPoint,
    options: drawingActions.getOptions(),
  };

  // Build handlers
  const handlers: CanvasDrawingHandlers = {
    onMouseDown,
    onMouseMove,
    onDoubleClick,
    onKeyDown,
    onRightClick,
    cancel,
    applySnap,
  };

  return { state, handlers };
}

export default useCanvasDrawing;
