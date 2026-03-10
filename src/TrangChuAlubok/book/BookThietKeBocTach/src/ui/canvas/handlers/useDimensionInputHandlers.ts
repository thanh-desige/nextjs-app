/**
 * useDimensionInputHandlers.ts - Dynamic input handlers for useCommandDrawing
 * STEP-5.7: Extracted from useCommandDrawing.ts
 *
 * Handles DynamicInputOverlay dimensional inputs:
 * - handleLineInput (length + angle)
 * - handleRectInput (width + height)
 * - handleCircleInput (radius or diameter)
 */

"use client";

import { useCallback } from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import { LineEntity } from "../../../core/entities/Line";
import { RectEntity } from "../../../core/entities/Rect";
import { CircleEntity } from "../../../core/entities/Circle";
import type { Point, CadEntity } from "../types/CadEntity";
import type { CommandDrawingInternals } from "./commandDrawing.types";
import { isDrawingTool, restartDrawingCommand } from "./commandDrawingHelpers";

export interface DimensionInputHandlers {
  handleLineInput: (length: number, angle: number) => boolean;
  handleRectInput: (width: number, height: number) => boolean;
  handleCircleInput: (value: number, isDiameter: boolean) => boolean;
}

export function useDimensionInputHandlers(
  internals: CommandDrawingInternals
): DimensionInputHandlers {
  const {
    commandRef,
    pointsRef,
    onPromptChangeRef,
    onEntityAddedRef,
    activeTool,
    engine,
    currentLayerId,
    effectiveLayerId,
    getSnapshotStyle,
    setPoints,
    setPreviewEntity,
    setPrompt,
  } = internals;

  // Handle line input with length/angle from DynamicInputOverlay
  const handleLineInput = useCallback(
    (length: number, angle: number): boolean => {
      const command = commandRef.current;
      if (!command || activeTool !== ToolMode.DRAW_LINE) {
        return false;
      }

      // Need at least 1 point to calculate new point
      if (pointsRef.current.length === 0) {
        onPromptChangeRef.current?.(
          "Click first point before entering dimensions"
        );
        return false;
      }

      // Calculate new point from last point + length/angle
      const lastPoint = pointsRef.current[pointsRef.current.length - 1];
      const newPoint: Point = {
        x: lastPoint.x + length * Math.cos(angle),
        y: lastPoint.y + length * Math.sin(angle),
      };

      // LINE mode: Create LINE entity immediately (AutoCAD-style)
      if (engine) {
        const styleSnapshot = getSnapshotStyle();
        const lineEntity = LineEntity.create(
          lastPoint,
          newPoint,
          styleSnapshot
        );
        lineEntity.layerId = currentLayerId;

        // ĐIỀU KIỆN 1: Thêm entity qua engine
        engine.addEntity(lineEntity);

        // Notify CadDrawingCanvas to update entities list
        const cadEntity: CadEntity = {
          id: lineEntity.id,
          type: "line",
          points: [
            { x: lastPoint.x, y: lastPoint.y },
            { x: newPoint.x, y: newPoint.y },
          ],
          color: lineEntity.style?.strokeColor || "#FFFFFF",
          lineWidth: lineEntity.style?.strokeWidth || 1,
          strokeStyle:
            (styleSnapshot.strokeStyle as
              | "solid"
              | "dashed"
              | "dotted"
              | "dashdot") || "solid",
          layer: effectiveLayerId,
        };
        onEntityAddedRef.current?.(cadEntity);

        onPromptChangeRef.current?.(
          `Created line: L=${length.toFixed(1)}, A=${(
            (angle * 180) /
            Math.PI
          ).toFixed(1)}°`
        );
      }

      // Add the new point (for continuous drawing)
      const newPoints = [...pointsRef.current, newPoint];
      pointsRef.current = newPoints;
      setPoints(newPoints);

      // Update prompt
      const newPrompt = command.getPrompt(newPoints.length);
      setPrompt(newPrompt);

      // Clear preview
      setPreviewEntity(null);

      return true;
    },
    [
      activeTool,
      commandRef,
      pointsRef,
      onPromptChangeRef,
      onEntityAddedRef,
      engine,
      currentLayerId,
      effectiveLayerId,
      getSnapshotStyle,
      setPoints,
      setPreviewEntity,
      setPrompt,
    ]
  );

  // Handle rect input with width/height from DynamicInputOverlay
  const handleRectInput = useCallback(
    (width: number, height: number): boolean => {
      const command = commandRef.current;
      if (!command || activeTool !== ToolMode.DRAW_RECT) {
        return false;
      }

      // Need at least 1 point (corner1)
      if (pointsRef.current.length === 0) {
        onPromptChangeRef.current?.(
          "Click first corner before entering dimensions"
        );
        return false;
      }

      // Calculate corner2 from corner1 + width/height
      const corner1 = pointsRef.current[0];
      const corner2: Point = {
        x: corner1.x + width,
        y: corner1.y + height,
      };

      // Create RECT entity with snapshot style
      if (engine) {
        const styleSnapshot = getSnapshotStyle();
        const rectEntity = RectEntity.fromCorners(
          corner1,
          corner2,
          styleSnapshot
        );
        rectEntity.layerId = currentLayerId;

        // ĐIỀU KIỆN 1: Thêm entity qua engine
        engine.addEntity(rectEntity);

        // Notify CadDrawingCanvas to update entities list
        const cadEntity: CadEntity = {
          id: rectEntity.id,
          type: "rect",
          points: [
            { x: corner1.x, y: corner1.y },
            { x: corner2.x, y: corner2.y },
          ],
          color: rectEntity.style?.strokeColor || "#FFFFFF",
          lineWidth: rectEntity.style?.strokeWidth || 1,
          fillColor: rectEntity.style?.fillColor || null,
          fillOpacity: rectEntity.style?.opacity ?? 0.5,
          strokeStyle:
            (styleSnapshot.strokeStyle as
              | "solid"
              | "dashed"
              | "dotted"
              | "dashdot") || "solid",
          layer: effectiveLayerId,
        };
        onEntityAddedRef.current?.(cadEntity);

        onPromptChangeRef.current?.(
          `Created rect: ${width.toFixed(1)} x ${height.toFixed(1)}`
        );
      }

      // Reset for next rect
      restartDrawingCommand(internals);

      return true;
    },
    [
      activeTool,
      commandRef,
      pointsRef,
      onPromptChangeRef,
      onEntityAddedRef,
      engine,
      currentLayerId,
      effectiveLayerId,
      getSnapshotStyle,
      internals,
    ]
  );

  // Handle circle input with radius or diameter from DynamicInputOverlay
  const handleCircleInput = useCallback(
    (value: number, isDiameter: boolean): boolean => {
      const command = commandRef.current;
      if (
        !command ||
        activeTool !== ToolMode.DRAW_CIRCLE ||
        !isDrawingTool(activeTool)
      ) {
        return false;
      }

      // Need at least 1 point (center)
      if (pointsRef.current.length === 0) {
        onPromptChangeRef.current?.(
          "Click center point before entering radius/diameter"
        );
        return false;
      }

      const radius = isDiameter ? value / 2 : value;
      const center = pointsRef.current[0];

      // Create CIRCLE entity
      if (engine) {
        const styleSnapshot = getSnapshotStyle();
        const circleEntity = CircleEntity.create(center, radius, styleSnapshot);
        circleEntity.layerId = currentLayerId;

        // ĐIỀU KIỆN 1: Thêm entity qua engine
        engine.addEntity(circleEntity);

        // Notify CadDrawingCanvas to update entities list
        const cadEntity: CadEntity = {
          id: circleEntity.id,
          type: "circle",
          points: [
            { x: center.x, y: center.y },
            { x: radius, y: 0 }, // radius stored in points[1].x
          ],
          color: circleEntity.style?.strokeColor || "#FFFFFF",
          lineWidth: circleEntity.style?.strokeWidth || 1,
          fillColor: circleEntity.style?.fillColor || null,
          fillOpacity: circleEntity.style?.opacity ?? 0.5,
          strokeStyle:
            (styleSnapshot.strokeStyle as
              | "solid"
              | "dashed"
              | "dotted"
              | "dashdot") || "solid",
          layer: effectiveLayerId,
        };
        onEntityAddedRef.current?.(cadEntity);

        onPromptChangeRef.current?.(
          `Created circle: ${isDiameter ? "D" : "R"}=${value.toFixed(1)}`
        );
      }

      // Reset for next circle
      restartDrawingCommand(internals);

      return true;
    },
    [
      activeTool,
      commandRef,
      pointsRef,
      onPromptChangeRef,
      onEntityAddedRef,
      engine,
      currentLayerId,
      effectiveLayerId,
      getSnapshotStyle,
      internals,
    ]
  );

  return {
    handleLineInput,
    handleRectInput,
    handleCircleInput,
  };
}
