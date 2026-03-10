/**
 * DynamicInputSection - Wrapper for DynamicInputOverlay with all inline callbacks
 * STEP-5: Extracted from CadDrawingCanvas.tsx
 *
 * This component encapsulates the DynamicInputOverlay with all the
 * callback logic that was previously inline in CadDrawingCanvas JSX.
 */

"use client";

import React, { useMemo } from "react";
import { DynamicInputOverlay } from "./DynamicInputOverlay";
import type { DynamicInputState } from "./DynamicInputOverlay";
import type { DrawingState } from "../canvas.types";
import type { Point, CadEntity } from "../types/CadEntity";
import { applyOrtho } from "../utils";

// ==================== Command Drawing Action Interface ====================
interface CommandDrawingActions {
  isCommandTool: () => boolean;
  handleEnter: () => boolean;
  handleLineInput: (length: number, angle: number) => void;
  handlePolygonSidesRadius: (sides: number, radius: number) => void;
  getPolygonSides: () => number;
}

// ==================== Props ====================
interface DynamicInputSectionProps {
  dynamicInput: DynamicInputState;
  setDynamicInput: React.Dispatch<React.SetStateAction<DynamicInputState>>;
  drawState: DrawingState;
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;
  mousePos: Point;
  canvasDimensions: { width: number; height: number };
  pan: Point;
  zoom: number;
  currentLayerId: string;
  effectiveOrtho: boolean;
  orthoMode: boolean;
  // Drawing handlers
  handleRectDynamicInput: () => void;
  handleCircleDynamicInput: (isDiameter: boolean) => void;
  // Command drawing
  commandDrawingActions: CommandDrawingActions;
  commandDrawingPoints: Point[];
  // Modify mode
  moveCopyAngleRef: React.RefObject<number>;
  setMovingPreviewDelta: React.Dispatch<React.SetStateAction<Point | null>>;
  onModifyMoveComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point,
  ) => void;
  onModifyCopyComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point,
  ) => void;
  // Ortho
  toggleOrtho: () => void;
  // Entity
  onAddEntity?: (entity: CadEntity) => void;
  setInternalEntities: React.Dispatch<React.SetStateAction<CadEntity[]>>;
  // Refs
  mousePosRef: React.RefObject<Point>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  // Callbacks
  onPromptChange?: (prompt: string) => void;
}

export const DynamicInputSection: React.FC<DynamicInputSectionProps> = ({
  dynamicInput,
  setDynamicInput,
  drawState,
  setDrawState,
  mousePos,
  canvasDimensions,
  pan,
  zoom,
  currentLayerId,
  effectiveOrtho,
  orthoMode,
  handleRectDynamicInput,
  handleCircleDynamicInput,
  commandDrawingActions,
  commandDrawingPoints,
  moveCopyAngleRef,
  setMovingPreviewDelta,
  onModifyMoveComplete,
  onModifyCopyComplete,
  toggleOrtho,
  onAddEntity,
  setInternalEntities,
  mousePosRef,
  canvasRef,
  onPromptChange,
}) => {
  // ==================== Computed Values ====================

  const polygonSides = commandDrawingActions.getPolygonSides();
  const pointsCount = commandDrawingPoints.length;
  const lastPoint =
    commandDrawingPoints.length > 0
      ? commandDrawingPoints[commandDrawingPoints.length - 1]
      : null;

  const moveCopyMode: "MOVE" | "COPY" | null =
    drawState.mode === "modifyMove"
      ? "MOVE"
      : drawState.mode === "modifyCopy"
        ? "COPY"
        : null;

  const moveCopyBasePoint =
    (drawState.mode === "modifyMove" || drawState.mode === "modifyCopy") &&
    "basePoint" in drawState
      ? (drawState as { basePoint?: Point | null }).basePoint || null
      : null;

  // Calculate ortho angle for LINE when ortho mode is on
  const orthoAngle = useMemo(() => {
    if (!effectiveOrtho) return undefined;
    if (!lastPoint) return undefined;
    const orthoPos = applyOrtho(lastPoint, mousePos);
    return Math.atan2(orthoPos.y - lastPoint.y, orthoPos.x - lastPoint.x);
  }, [effectiveOrtho, lastPoint, mousePos]);

  // ==================== Callbacks ====================

  const handleFinishDrawing = () => {
    if (
      commandDrawingActions.isCommandTool() &&
      commandDrawingActions.handleEnter()
    ) {
      return;
    }
  };

  const handleLineInput = (length: number, angle: number) => {
    commandDrawingActions.handleLineInput(length, angle);
  };

  const handlePolygonInput = (sides: number, radius: number) => {
    commandDrawingActions.handlePolygonSidesRadius(sides, radius);
  };

  const handleToggleOrtho = () => {
    toggleOrtho();
    onPromptChange?.(orthoMode ? "<Ortho off>" : "<Ortho on>");
  };

  const handleMoveCopyInput = (distance: number, angle: number) => {
    if (
      (drawState.mode === "modifyMove" || drawState.mode === "modifyCopy") &&
      "basePoint" in drawState &&
      (drawState as { basePoint?: Point | null }).basePoint
    ) {
      const bp = (drawState as { basePoint: Point }).basePoint;
      const dx = distance * Math.cos(angle);
      const dy = distance * Math.sin(angle);
      const destPoint = { x: bp.x + dx, y: bp.y + dy };

      if (drawState.mode === "modifyMove") {
        const ds = drawState as {
          entityIds: string[];
          dimensionIds: string[];
          basePoint: Point;
        };
        onModifyMoveComplete?.(
          ds.entityIds,
          ds.dimensionIds,
          ds.basePoint,
          destPoint,
        );
        setDrawState({ mode: "idle" });
        setDynamicInput((prev) => ({ ...prev, active: false }));
        setMovingPreviewDelta(null);
        onPromptChange?.("MOVE completed");
      } else {
        const ds = drawState as {
          entityIds: string[];
          dimensionIds: string[];
          basePoint: Point;
        };
        onModifyCopyComplete?.(
          ds.entityIds,
          ds.dimensionIds,
          ds.basePoint,
          destPoint,
        );
        onPromptChange?.(
          "COPY: type distance<angle for next copy (ESC to exit)",
        );
      }
    }
  };

  const handleMoveCopyCancel = () => {
    setDrawState({ mode: "idle" });
    setDynamicInput((prev) => ({ ...prev, active: false }));
    setMovingPreviewDelta(null);
    onPromptChange?.("Command cancelled");
  };

  const handleOffsetDistanceInput = (distance: number) => {
    setDrawState({
      mode: "modifyOffset",
      step: "selectEntity",
      distance: distance,
    } as DrawingState);
    setDynamicInput((prev) => ({ ...prev, active: false }));
    onPromptChange?.(`OFFSET distance = ${distance}. Select object:`);
  };

  const handleOffsetCancel = () => {
    setDrawState({ mode: "idle" });
    setDynamicInput((prev) => ({ ...prev, active: false }));
    onPromptChange?.("Command cancelled");
  };

  // ==================== Render ====================

  return (
    <DynamicInputOverlay
      dynamicInput={dynamicInput}
      setDynamicInput={setDynamicInput}
      drawState={
        drawState as {
          mode: string;
          points?: Point[];
          corner1?: Point | null;
          center?: Point | null;
        }
      }
      setDrawState={
        setDrawState as React.Dispatch<
          React.SetStateAction<{
            mode: string;
            points?: Point[];
            corner1?: Point | null;
            center?: Point | null;
          }>
        >
      }
      mousePos={mousePos}
      canvasDimensions={canvasDimensions}
      pan={pan}
      zoom={zoom}
      currentLayerId={currentLayerId}
      onAddEntity={onAddEntity}
      setInternalEntities={setInternalEntities}
      onPromptChange={onPromptChange}
      handleRectDynamicInput={handleRectDynamicInput}
      handleCircleDynamicInput={handleCircleDynamicInput}
      onFinishDrawing={handleFinishDrawing}
      onLineInput={handleLineInput}
      onPolygonInput={handlePolygonInput}
      polygonSides={polygonSides}
      pointsCount={pointsCount}
      lastPoint={lastPoint}
      orthoMode={effectiveOrtho}
      orthoAngle={orthoAngle}
      onToggleOrtho={handleToggleOrtho}
      moveCopyMode={moveCopyMode}
      moveCopyBasePoint={moveCopyBasePoint}
      moveCopyAngleRef={moveCopyAngleRef}
      onMoveCopyInput={handleMoveCopyInput}
      onMoveCopyCancel={handleMoveCopyCancel}
      mousePosRef={mousePosRef}
      canvasRef={canvasRef}
      onOffsetDistanceInput={handleOffsetDistanceInput}
      onOffsetCancel={handleOffsetCancel}
    />
  );
};
