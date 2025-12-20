/**
 * CadDrawingCanvasV2 - Command-based drawing canvas
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 *
 * This is a wrapper around CadDrawingCanvas that uses useDrawingHandler
 * to handle drawing operations through the command pattern.
 *
 * Benefits:
 * 1. Drawing operations go through Commands
 * 2. History is managed by CadDocument
 * 3. Preview entities from Commands
 * 4. Cleaner separation of concerns
 */

"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import {
  CadDrawingCanvas,
  CadDrawingCanvasProps,
  CadEntity,
} from "./CadDrawingCanvas";
import { useDrawingHandler } from "./handlers/useDrawingHandler";

// ==================== Types ====================

export interface CadDrawingCanvasV2Props
  extends Omit<CadDrawingCanvasProps, "onEntityCreated"> {
  /** Use command-based drawing (ĐIỀU KIỆN 1) */
  useCommandBasedDrawing?: boolean;
  /** Callback when command creates an entity */
  onCommandEntityCreated?: (entity: CadEntity) => void;
}

// ==================== Component ====================

export const CadDrawingCanvasV2: React.FC<CadDrawingCanvasV2Props> = ({
  activeTool,
  snapToGrid = false,
  gridSpacing = 10,
  orthoMode = false,
  osnapEnabled = true,
  useCommandBasedDrawing = false,
  onCommandEntityCreated,
  onPromptChange,
  ...restProps
}) => {
  // Use drawing handler for command-based drawing
  const drawingHandler = useDrawingHandler(
    {
      activeTool,
      snapToGrid,
      gridSpacing,
      orthoMode,
      osnapEnabled,
    },
    onPromptChange
  );

  const { state: drawingState, actions: drawingActions } = drawingHandler;

  // Handle prompt changes from drawing handler
  useEffect(() => {
    if (useCommandBasedDrawing && drawingState.prompt) {
      onPromptChange?.(drawingState.prompt);
    }
  }, [useCommandBasedDrawing, drawingState.prompt, onPromptChange]);

  // Check if we should use command-based drawing for current tool
  const isCommandBasedTool = useMemo(() => {
    if (!useCommandBasedDrawing) return false;
    return drawingActions.isDrawingTool();
  }, [useCommandBasedDrawing, drawingActions]);

  // Custom entity created handler that routes through commands
  const handleEntityCreated = useCallback(
    (entity: CadEntity) => {
      if (isCommandBasedTool) {
        // Entity created by command - notify parent
        onCommandEntityCreated?.(entity);
      }
    },
    [isCommandBasedTool, onCommandEntityCreated]
  );

  // Render preview entity from command
  const renderCommandPreview = useCallback(() => {
    if (!isCommandBasedTool || !drawingState.previewEntity) {
      return null;
    }

    // The preview entity from the command can be rendered as a custom overlay
    // For now, we'll let the base canvas handle it
    return null;
  }, [isCommandBasedTool, drawingState.previewEntity]);

  // Get prompt from command or pass through
  const effectivePromptChange = useCallback(
    (prompt: string) => {
      if (isCommandBasedTool) {
        // Command is handling prompts
        return;
      }
      onPromptChange?.(prompt);
    },
    [isCommandBasedTool, onPromptChange]
  );

  return (
    <>
      <CadDrawingCanvas
        activeTool={activeTool}
        snapToGrid={snapToGrid}
        gridSpacing={gridSpacing}
        orthoMode={orthoMode}
        osnapEnabled={osnapEnabled}
        onPromptChange={effectivePromptChange}
        onEntityCreated={handleEntityCreated}
        {...restProps}
      />
      {renderCommandPreview()}
    </>
  );
};

// ==================== Exports ====================

export default CadDrawingCanvasV2;

// Re-export types
export type { CadEntity, Point } from "./CadDrawingCanvas";
