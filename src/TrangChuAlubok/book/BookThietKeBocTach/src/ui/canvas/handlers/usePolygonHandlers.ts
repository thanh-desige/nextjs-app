/**
 * usePolygonHandlers.ts - Polygon-specific handlers for useCommandDrawing
 * STEP-5.7: Extracted from useCommandDrawing.ts
 *
 * Handles: handlePolygonOption, handlePolygonInput, handlePolygonSidesRadius, getPolygonSides
 */

"use client";

import { useCallback } from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import { PolygonCommand } from "../../../core/commands/draw/POLYGON";
import { PolylineEntity } from "../../../core/entities/Polyline";
import type { Point, CadEntity } from "../types/CadEntity";
import type { CommandDrawingInternals } from "./commandDrawing.types";

export interface PolygonHandlers {
  handlePolygonOption: (option: string) => boolean;
  handlePolygonInput: (input: string) => boolean;
  handlePolygonSidesRadius: (sides: number, radius: number) => boolean;
  getPolygonSides: () => number;
}

export function usePolygonHandlers(
  internals: CommandDrawingInternals
): PolygonHandlers {
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

  // Handle polygon option: E (Edge), I (Inscribed), C (Circumscribed)
  const handlePolygonOption = useCallback(
    (option: string): boolean => {
      if (activeTool !== ToolMode.DRAW_POLYGON) {
        return false;
      }

      const cmd = commandRef.current;
      if (
        !cmd ||
        !("handleOption" in cmd) ||
        typeof cmd.handleOption !== "function"
      ) {
        return false;
      }
      const command = cmd as PolygonCommand;

      const opt = option.toUpperCase();

      const styleSnapshot = getSnapshotStyle();
      const context = {
        points: pointsRef.current,
        style: styleSnapshot,
        layerId: effectiveLayerId,
        engine: engine!,
        options: {} as Record<string, unknown>,
      };

      command.handleOption(opt, context);

      const newPrompt = command.getPrompt(pointsRef.current.length);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);

      return true;
    },
    [
      activeTool,
      commandRef,
      pointsRef,
      onPromptChangeRef,
      engine,
      effectiveLayerId,
      getSnapshotStyle,
      setPrompt,
    ]
  );

  // Handle polygon input: number of sides or radius
  const handlePolygonInput = useCallback(
    (input: string): boolean => {
      if (activeTool !== ToolMode.DRAW_POLYGON) {
        return false;
      }

      const cmd = commandRef.current;
      if (
        !cmd ||
        !("handleInput" in cmd) ||
        typeof cmd.handleInput !== "function"
      ) {
        return false;
      }
      const command = cmd as PolygonCommand;

      const styleSnapshot = getSnapshotStyle();
      const context = {
        points: pointsRef.current,
        style: styleSnapshot,
        layerId: effectiveLayerId,
        engine: engine!,
        options: {} as Record<string, unknown>,
      };

      // Check for options first
      const trimmed = input.trim().toUpperCase();
      if (trimmed === "E" || trimmed === "I" || trimmed === "C") {
        return handlePolygonOption(trimmed);
      }

      // Try to handle as input (number of sides or radius)
      const success = command.handleInput(input, context);

      if (success) {
        // Check if command completed (context.points now has polygon points)
        if (context.points.length >= 3 && engine) {
          const polygonEntity = PolylineEntity.create(
            context.points,
            true,
            styleSnapshot
          );
          polygonEntity.layerId = currentLayerId;

          engine.addEntity(polygonEntity);

          const cadEntity: CadEntity = {
            id: polygonEntity.id,
            type: "polyline",
            points: context.points.map((p: Point) => ({ x: p.x, y: p.y })),
            color: polygonEntity.style?.strokeColor || "#FFFFFF",
            lineWidth: polygonEntity.style?.strokeWidth || 1,
            fillColor: polygonEntity.style?.fillColor || null,
            fillOpacity: polygonEntity.style?.opacity ?? 0.5,
            strokeStyle:
              (styleSnapshot.strokeStyle as
                | "solid"
                | "dashed"
                | "dotted"
                | "dashdot") || "solid",
            layer: effectiveLayerId,
            closed: true,
          };
          onEntityAddedRef.current?.(cadEntity);

          onPromptChangeRef.current?.(
            `POLYGON created with ${command.getSides()} sides`
          );

          // Restart command
          command.reset();
          pointsRef.current = [];
          setPoints([]);
          setPreviewEntity(null);
        }
      }

      // Update prompt
      const newPrompt = command.getPrompt(pointsRef.current.length);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);

      return success;
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
      handlePolygonOption,
      getSnapshotStyle,
      setPoints,
      setPreviewEntity,
      setPrompt,
    ]
  );

  // Handle polygon input with sides and radius from DynamicInputOverlay
  const handlePolygonSidesRadius = useCallback(
    (sides: number, radius: number): boolean => {
      if (activeTool !== ToolMode.DRAW_POLYGON) {
        return false;
      }

      const cmd = commandRef.current;
      if (
        !cmd ||
        !("getCenter" in cmd) ||
        typeof cmd.getCenter !== "function"
      ) {
        return false;
      }
      const command = cmd as PolygonCommand;

      // Need center point first
      const center = command.getCenter();
      if (!center) return false;

      // Update sides if valid
      if (sides >= 3 && sides <= 1024) {
        command.setSides(sides);
      }

      // Calculate polygon points
      const startAngle = -Math.PI / 2; // Top vertex
      const points = command.calculatePolygonPoints(
        center,
        radius,
        command.getSides(),
        startAngle
      );

      if (points.length < 3 || !engine) return false;

      // Create polygon entity
      const styleSnapshot = getSnapshotStyle();
      const polygonEntity = PolylineEntity.create(points, true, styleSnapshot);
      polygonEntity.layerId = currentLayerId;

      engine.addEntity(polygonEntity);

      const cadEntity: CadEntity = {
        id: polygonEntity.id,
        type: "polyline",
        points: points.map((p: Point) => ({ x: p.x, y: p.y })),
        color: polygonEntity.style?.strokeColor || "#FFFFFF",
        lineWidth: polygonEntity.style?.strokeWidth || 1,
        fillColor: polygonEntity.style?.fillColor || null,
        fillOpacity: polygonEntity.style?.opacity ?? 0.5,
        strokeStyle:
          (styleSnapshot.strokeStyle as
            | "solid"
            | "dashed"
            | "dotted"
            | "dashdot") || "solid",
        layer: effectiveLayerId,
        closed: true,
      };
      onEntityAddedRef.current?.(cadEntity);

      onPromptChangeRef.current?.(
        `POLYGON created with ${command.getSides()} sides`
      );

      // Restart command
      command.reset();
      pointsRef.current = [];
      setPoints([]);
      setPreviewEntity(null);

      const restartPrompt = command.getPrompt(0);
      setPrompt(restartPrompt);
      onPromptChangeRef.current?.(restartPrompt);

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

  // Get current polygon sides
  const getPolygonSides = useCallback((): number => {
    if (activeTool !== ToolMode.DRAW_POLYGON) {
      return 6; // Default
    }
    const command = commandRef.current;
    if (
      command &&
      "getSides" in command &&
      typeof command.getSides === "function"
    ) {
      return command.getSides();
    }
    return 6; // Default
  }, [activeTool, commandRef]);

  return {
    handlePolygonOption,
    handlePolygonInput,
    handlePolygonSidesRadius,
    getPolygonSides,
  };
}
