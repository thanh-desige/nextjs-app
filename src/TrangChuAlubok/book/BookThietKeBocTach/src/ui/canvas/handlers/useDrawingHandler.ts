/**
 * useDrawingHandler - Hook kết nối useDrawingCommands với Canvas
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 *
 * Hook này:
 * 1. Nhận events từ canvas (mouse clicks, moves)
 * 2. Chuyển cho useDrawingCommands xử lý
 * 3. Command tạo entity và execute qua CadEngine
 *
 * Canvas chỉ thu thập input và hiển thị preview - KHÔNG tạo entity trực tiếp
 */

"use client";

import { useCallback, useEffect } from "react";
import { useDrawingCommands } from "../../../hooks/useDrawingCommands";
import { ToolMode } from "../../../core/engine/EngineState";
import { IVec2 } from "../../../core/geometry/Vec2";
import { IEntity } from "../../../core/entities/Entity.types";
import { Point } from "../utils/types";

// ==================== Types ====================

export interface DrawingHandlerConfig {
  activeTool: ToolMode;
  snapToGrid: boolean;
  gridSpacing: number;
  orthoMode: boolean;
  osnapEnabled: boolean;
}

export interface DrawingHandlerState {
  isDrawing: boolean;
  points: IVec2[];
  previewEntity: IEntity | null;
  prompt: string;
}

export interface DrawingHandlerActions {
  /** Handle mouse down - add point to drawing */
  handleMouseDown: (worldPos: Point) => void;
  /** Handle mouse move - update preview */
  handleMouseMove: (worldPos: Point) => void;
  /** Handle double click - finish drawing (for polyline, etc.) */
  handleDoubleClick: (worldPos: Point) => void;
  /** Handle enter key - confirm drawing */
  handleEnter: () => void;
  /** Handle escape key - cancel drawing */
  handleEscape: () => void;
  /** Handle right click - finish or cancel */
  handleRightClick: (worldPos: Point) => void;
  /** Handle option selection */
  handleOption: (option: string) => void;
  /** Set text content (for TEXT command) */
  setTextContent: (text: string) => void;
  /** Check if tool is a drawing tool */
  isDrawingTool: () => boolean;
  /** Get current prompt */
  getPrompt: () => string;
  /** Get available options */
  getOptions: () => { key: string; label: string }[];
}

export interface UseDrawingHandlerReturn {
  state: DrawingHandlerState;
  actions: DrawingHandlerActions;
}

// ==================== Drawing Tool Detection ====================

function isDrawingToolMode(tool: ToolMode): boolean {
  const drawingTools = [
    ToolMode.DRAW_LINE,
    ToolMode.DRAW_RECT,
    ToolMode.DRAW_CIRCLE,
    ToolMode.DRAW_ARC,
    ToolMode.DRAW_ELLIPSE,
    ToolMode.DRAW_TEXT,
    ToolMode.DRAW_POLYGON,
  ];
  return drawingTools.includes(tool);
}

// ==================== Hook Implementation ====================

export function useDrawingHandler(
  config: DrawingHandlerConfig,
  onPromptChange?: (prompt: string) => void
): UseDrawingHandlerReturn {
  const { activeTool, orthoMode } = config;

  // Use the drawing commands hook
  const {
    drawingState,
    startDrawing,
    addPoint,
    updatePreview,
    finishDrawing,
    cancelDrawing,
    handleOption,
    setTextContent,
    canFinish,
    getPrompt,
    getOptions,
  } = useDrawingCommands();

  // Auto-start drawing when switching to a drawing tool
  useEffect(() => {
    if (isDrawingToolMode(activeTool)) {
      if (!drawingState.isActive) {
        startDrawing(activeTool);
      }
    } else {
      // If switching away from drawing tool, cancel any active drawing
      if (drawingState.isActive) {
        cancelDrawing();
      }
    }
  }, [activeTool, drawingState.isActive, startDrawing, cancelDrawing]);

  // Update prompt when drawing state changes
  useEffect(() => {
    if (drawingState.prompt) {
      onPromptChange?.(drawingState.prompt);
    }
  }, [drawingState.prompt, onPromptChange]);

  // Apply ortho mode to point
  const applyOrthoMode = useCallback(
    (point: IVec2): IVec2 => {
      if (!orthoMode || drawingState.points.length === 0) {
        return point;
      }
      const lastPoint = drawingState.points[drawingState.points.length - 1];
      const dx = Math.abs(point.x - lastPoint.x);
      const dy = Math.abs(point.y - lastPoint.y);

      if (dx > dy) {
        return { x: point.x, y: lastPoint.y };
      } else {
        return { x: lastPoint.x, y: point.y };
      }
    },
    [orthoMode, drawingState.points]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (worldPos: Point) => {
      if (!isDrawingToolMode(activeTool) || !drawingState.isActive) {
        return;
      }

      let finalPos: IVec2 = worldPos;

      // Apply ortho if enabled
      if (orthoMode && drawingState.points.length > 0) {
        finalPos = applyOrthoMode(worldPos);
      }

      // Add point to the command
      addPoint(finalPos);

      // Check if drawing should auto-finish (rect, circle need 2 points)
      if (canFinish()) {
        const result = finishDrawing();
        if (result.success) {
          // Restart drawing for the same tool (continuous mode like AutoCAD)
          startDrawing(activeTool);
        }
      }
    },
    [
      activeTool,
      drawingState.isActive,
      drawingState.points.length,
      orthoMode,
      applyOrthoMode,
      addPoint,
      canFinish,
      finishDrawing,
      startDrawing,
    ]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (worldPos: Point) => {
      if (!isDrawingToolMode(activeTool) || !drawingState.isActive) {
        return;
      }

      let finalPos: IVec2 = worldPos;

      // Apply ortho if enabled
      if (orthoMode && drawingState.points.length > 0) {
        finalPos = applyOrthoMode(worldPos);
      }

      // Update preview
      updatePreview(finalPos);
    },
    [
      activeTool,
      drawingState.isActive,
      drawingState.points.length,
      orthoMode,
      applyOrthoMode,
      updatePreview,
    ]
  );

  // Handle double click (for polyline finish)
  const handleDoubleClick = useCallback(
    (_worldPos: Point) => {
      if (!isDrawingToolMode(activeTool) || !drawingState.isActive) {
        return;
      }

      // For polygon, double click finishes the drawing
      if (
        activeTool === ToolMode.DRAW_POLYGON ||
        activeTool === ToolMode.DRAW_LINE
      ) {
        if (canFinish()) {
          const result = finishDrawing();
          if (result.success) {
            startDrawing(activeTool);
          }
        }
      }
    },
    [activeTool, drawingState.isActive, canFinish, finishDrawing, startDrawing]
  );

  // Handle enter key
  const handleEnter = useCallback(() => {
    if (!isDrawingToolMode(activeTool) || !drawingState.isActive) {
      return;
    }

    if (canFinish()) {
      const result = finishDrawing();
      if (result.success) {
        startDrawing(activeTool);
      }
    }
  }, [
    activeTool,
    drawingState.isActive,
    canFinish,
    finishDrawing,
    startDrawing,
  ]);

  // Handle escape key
  const handleEscape = useCallback(() => {
    if (drawingState.isActive) {
      cancelDrawing();
      // Restart to allow new drawing
      if (isDrawingToolMode(activeTool)) {
        startDrawing(activeTool);
      }
    }
  }, [activeTool, drawingState.isActive, cancelDrawing, startDrawing]);

  // Handle right click
  const handleRightClick = useCallback(
    (_worldPos: Point) => {
      if (!drawingState.isActive) {
        return;
      }

      // For polygon/line, right click finishes if we have enough points
      if (
        (activeTool === ToolMode.DRAW_POLYGON ||
          activeTool === ToolMode.DRAW_LINE) &&
        canFinish()
      ) {
        const result = finishDrawing();
        if (result.success) {
          startDrawing(activeTool);
        }
      } else {
        // Otherwise cancel
        cancelDrawing();
        if (isDrawingToolMode(activeTool)) {
          startDrawing(activeTool);
        }
      }
    },
    [
      activeTool,
      drawingState.isActive,
      canFinish,
      finishDrawing,
      cancelDrawing,
      startDrawing,
    ]
  );

  // Check if current tool is a drawing tool
  const isDrawingTool = useCallback(() => {
    return isDrawingToolMode(activeTool);
  }, [activeTool]);

  // Build state
  const state: DrawingHandlerState = {
    isDrawing: drawingState.isActive,
    points: drawingState.points,
    previewEntity: drawingState.previewEntity,
    prompt: drawingState.prompt,
  };

  // Build actions
  const actions: DrawingHandlerActions = {
    handleMouseDown,
    handleMouseMove,
    handleDoubleClick,
    handleEnter,
    handleEscape,
    handleRightClick,
    handleOption,
    setTextContent,
    isDrawingTool,
    getPrompt,
    getOptions,
  };

  return { state, actions };
}

export default useDrawingHandler;
