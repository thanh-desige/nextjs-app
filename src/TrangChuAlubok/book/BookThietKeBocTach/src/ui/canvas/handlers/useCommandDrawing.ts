/**
 * useCommandDrawing - Hook để xử lý drawing tools qua Command pattern
 * STEP-5.7: Orchestrator - delegates to sub-hooks
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 *
 * Hook này được thiết kế để dễ dàng integrate vào CadDrawingCanvas:
 * 1. Nhận mouse events từ canvas
 * 2. Nếu là drawing tool → xử lý qua Commands, return true
 * 3. Nếu không phải drawing tool → return false để canvas xử lý như cũ
 */

"use client";

import {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
  startTransition,
} from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import { useEngineStore } from "../../../store/engineStore";
import type {
  IInteractiveCommand,
  CommandContext,
} from "../../../core/commands/Command.types";
import { PolygonCommand } from "../../../core/commands/draw/POLYGON";
import { LineEntity } from "../../../core/entities/Line";
import { PolylineEntity } from "../../../core/entities/Polyline";
import type { Point, CadEntity } from "../types/CadEntity";

// Types (re-exported for backward compatibility)
export type {
  CommandDrawingConfig,
  CommandDrawingState,
  CommandDrawingActions,
  UseCommandDrawingReturn,
  Point,
  CadEntity,
} from "./commandDrawing.types";
import type {
  CommandDrawingConfig,
  CommandDrawingState,
  CommandDrawingActions,
  UseCommandDrawingReturn,
  CommandDrawingInternals,
} from "./commandDrawing.types";

// Helpers
import {
  isDrawingTool,
  createCommand,
  convertToCadEntity,
  applyOrthoMode as applyOrthoModeHelper,
  restartDrawingCommand,
} from "./commandDrawingHelpers";

// Sub-hooks
import { usePolygonHandlers } from "./usePolygonHandlers";
import { useTextHandlers } from "./useTextHandlers";
import { useDimensionInputHandlers } from "./useDimensionInputHandlers";

// ==================== Hook Implementation ====================

export function useCommandDrawing(
  config: CommandDrawingConfig
): UseCommandDrawingReturn {
  const {
    activeTool,
    currentLayerId,
    orthoMode,
    onPromptChange,
    onEntityAdded,
  } = config;

  // Engine store
  const engine = useEngineStore((state) => state.engine);
  const currentStyle = useEngineStore((state) => state.currentStyle);
  const useByLayer = useEngineStore((state) => state.useByLayer);
  const layers = useEngineStore((state) => state.layers);

  // Effective layer ID: undefined when Layers OFF, currentLayerId when Layers ON
  const effectiveLayerId = useByLayer ? currentLayerId : undefined;

  /**
   * 🔒 SNAPSHOT STYLE: Clone để entity giữ style tại lúc vẽ (chuẩn AutoCAD)
   */
  const getSnapshotStyle = useCallback(() => {
    const defaultStyle = {
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
      strokeStyle: "solid" as const,
      fillColor: null as string | null,
      opacity: 1,
    };

    if (!useByLayer) {
      if (!currentStyle) return defaultStyle;
      return JSON.parse(JSON.stringify(currentStyle));
    }

    const activeLayer = layers.find((l) => l.id === currentLayerId);
    if (activeLayer) {
      const strokeStyleMap: Record<
        string,
        "solid" | "dashed" | "dotted" | "dashdot"
      > = {
        Continuous: "solid",
        Dashed: "dashed",
        Dotted: "dotted",
        DashDot: "dashdot",
      };
      return {
        strokeColor: activeLayer.color,
        strokeWidth: activeLayer.lineWeight,
        strokeStyle: strokeStyleMap[activeLayer.lineType] || "solid",
        fillColor: activeLayer.fillColor ?? null,
        opacity: activeLayer.opacity ?? 1,
      };
    }

    return defaultStyle;
  }, [currentStyle, useByLayer, layers, currentLayerId]);

  // State
  const [command, setCommand] = useState<IInteractiveCommand | null>(() =>
    isDrawingTool(activeTool) ? createCommand(activeTool) : null
  );
  const [points, setPoints] = useState<Point[]>([]);
  const [prompt, setPrompt] = useState(() => {
    if (isDrawingTool(activeTool)) {
      const cmd = createCommand(activeTool);
      return cmd?.getPrompt(0) ?? "Ready";
    }
    return "Ready";
  });
  const [previewEntity, setPreviewEntity] = useState<CadEntity | null>(null);

  // Refs only for callback closures (not accessed during render)
  const pointsRef = useRef<Point[]>([]);
  const commandRef = useRef<IInteractiveCommand | null>(command);
  const onPromptChangeRef = useRef(onPromptChange);
  const onEntityAddedRef = useRef(onEntityAdded);
  const prevActiveToolRef = useRef<ToolMode>(activeTool);

  // Sync refs in effects
  useEffect(() => {
    onPromptChangeRef.current = onPromptChange;
  }, [onPromptChange]);
  useEffect(() => {
    onEntityAddedRef.current = onEntityAdded;
  }, [onEntityAdded]);
  useEffect(() => {
    commandRef.current = command;
  }, [command]);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // Reset when tool changes
  useEffect(() => {
    if (prevActiveToolRef.current === activeTool) return;
    prevActiveToolRef.current = activeTool;

    startTransition(() => {
      if (isDrawingTool(activeTool)) {
        const newCommand = createCommand(activeTool);
        setCommand(newCommand);
        pointsRef.current = [];
        setPoints([]);
        const newPrompt = newCommand?.getPrompt(0) ?? "Ready";
        setPrompt(newPrompt);
        onPromptChangeRef.current?.(newPrompt);
      } else {
        setCommand(null);
        pointsRef.current = [];
        setPoints([]);
        setPreviewEntity(null);
      }
    });
  }, [activeTool]);

  // Derived state
  const isActive = isDrawingTool(activeTool) && command !== null;

  // ==================== Shared Internals for Sub-hooks ====================

  const internals: CommandDrawingInternals = useMemo(
    () => ({
      commandRef,
      pointsRef,
      onPromptChangeRef,
      onEntityAddedRef,
      activeTool,
      engine,
      currentLayerId,
      effectiveLayerId,
      getSnapshotStyle,
      setCommand,
      setPoints,
      setPreviewEntity,
      setPrompt,
      points,
    }),
    [activeTool, engine, currentLayerId, effectiveLayerId, getSnapshotStyle, points]
  );

  // ==================== Sub-hooks ====================

  const polygonHandlers = usePolygonHandlers(internals);
  const textHandlers = useTextHandlers(internals);
  const dimensionInputHandlers = useDimensionInputHandlers(internals);

  // ==================== Core Utilities ====================

  const applyOrthoMode = useCallback(
    (point: Point): Point =>
      applyOrthoModeHelper(point, orthoMode, pointsRef),
    [orthoMode]
  );

  const createContext = useCallback((): CommandContext | null => {
    if (!engine) return null;
    return {
      engine,
      points: [...pointsRef.current],
      options: {},
      style: getSnapshotStyle(),
      layerId: effectiveLayerId,
    };
  }, [engine, getSnapshotStyle, effectiveLayerId]);

  const convertPreview = useCallback(
    (entity: unknown): CadEntity | null =>
      convertToCadEntity(entity, effectiveLayerId),
    [effectiveLayerId]
  );

  // ==================== Core Mouse/Keyboard Handlers ====================

  const handleMouseDown = useCallback(
    (worldPos: Point): boolean => {
      const command = commandRef.current;
      if (!command || !isDrawingTool(activeTool)) {
        return false;
      }

      // Apply ortho to 1D objects (Line, Arc) and Polygon
      let finalPos = worldPos;
      const orthoApplicableTools = [
        ToolMode.DRAW_LINE,
        ToolMode.DRAW_ARC,
        ToolMode.DRAW_POLYGON,
      ];
      if (
        orthoMode &&
        pointsRef.current.length > 0 &&
        orthoApplicableTools.includes(activeTool)
      ) {
        finalPos = applyOrthoMode(worldPos);
      }

      // TEXT mode: replace point if already waiting for text input
      if (activeTool === ToolMode.DRAW_TEXT && pointsRef.current.length >= 1) {
        pointsRef.current = [finalPos];
        setPoints([finalPos]);
        onPromptChangeRef.current?.(
          "TEXT: Nhập văn bản rồi click ra ngoài để lưu"
        );
        return true;
      }

      // Add point
      const newPoints = [...pointsRef.current, finalPos];
      pointsRef.current = newPoints;
      setPoints(newPoints);

      const newPrompt = command.getPrompt(newPoints.length);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);

      // Auto-complete check (for rect, circle - not LINE)
      const shouldAutoComplete = command.autoComplete !== false;

      if (shouldAutoComplete && command.canComplete(newPoints.length)) {
        if (engine) {
          const styleSnapshot = getSnapshotStyle();
          const result = engine.executeInteractiveCommand(command, {
            points: newPoints,
            style: styleSnapshot,
            layerId: effectiveLayerId,
          });

          if (result.success) {
            onPromptChangeRef.current?.(
              `Created ${activeTool.replace("DRAW_", "").toLowerCase()}`
            );
            restartDrawingCommand(internals);
          }
        }
      } else if (!shouldAutoComplete && newPoints.length >= 2) {
        // LINE continuous mode
        if (engine && activeTool === ToolMode.DRAW_LINE) {
          const start = newPoints[newPoints.length - 2];
          const end = newPoints[newPoints.length - 1];

          const styleSnapshot = getSnapshotStyle();
          const lineEntity = LineEntity.create(start, end, styleSnapshot);
          lineEntity.layerId = currentLayerId;
          engine.addEntity(lineEntity);

          const cadEntity: CadEntity = {
            id: lineEntity.id,
            type: "line",
            points: [
              { x: start.x, y: start.y },
              { x: end.x, y: end.y },
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
            `Created line segment ${newPoints.length - 1}`
          );
          setPreviewEntity(null);
        } else if (activeTool === ToolMode.DRAW_POLYGON) {
          // POLYGON: Use PolygonCommand's handlePoint for simplified workflow
          if (
            !command ||
            !("handlePoint" in command) ||
            typeof command.handlePoint !== "function"
          ) {
            return false;
          }
          const polygonCmd = command as PolygonCommand;
          const styleSnapshot = getSnapshotStyle();
          const context = {
            points: [] as Point[],
            style: styleSnapshot,
            layerId: effectiveLayerId,
            engine: engine!,
            options: {} as Record<string, unknown>,
          };

          const completed = polygonCmd.handlePoint(finalPos, context);

          if (completed && context.points.length >= 3 && engine) {
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
              points: context.points.map((p) => ({ x: p.x, y: p.y })),
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
              `POLYGON created with ${polygonCmd.getSides()} sides`
            );

            polygonCmd.reset();
            pointsRef.current = [];
            setPoints([]);
            setPreviewEntity(null);
          } else {
            const center = polygonCmd.getCenter();
            if (center) {
              pointsRef.current = [center];
              setPoints([center]);
            }
          }

          const polygonPrompt = polygonCmd.getPrompt(0);
          setPrompt(polygonPrompt);
          onPromptChangeRef.current?.(polygonPrompt);
        }
      } else if (!shouldAutoComplete && activeTool === ToolMode.DRAW_TEXT) {
        if (newPoints.length > 1) {
          pointsRef.current = [finalPos];
          setPoints([finalPos]);
        }
        onPromptChangeRef.current?.(
          "TEXT: Nhập văn bản rồi click ra ngoài để lưu"
        );
      }

      return true;
    },
    [
      activeTool,
      orthoMode,
      applyOrthoMode,
      engine,
      currentLayerId,
      effectiveLayerId,
      getSnapshotStyle,
      internals,
    ]
  );

  const handleMouseMove = useCallback(
    (worldPos: Point): void => {
      const command = commandRef.current;
      if (!command || !isDrawingTool(activeTool)) return;

      let finalPos = worldPos;
      const orthoApplicableTools = [
        ToolMode.DRAW_LINE,
        ToolMode.DRAW_ARC,
        ToolMode.DRAW_POLYGON,
      ];
      if (
        orthoMode &&
        pointsRef.current.length > 0 &&
        orthoApplicableTools.includes(activeTool)
      ) {
        finalPos = applyOrthoMode(worldPos);
      }

      // POLYGON special handling
      if (activeTool === ToolMode.DRAW_POLYGON) {
        if (
          command &&
          "getCurrentStep" in command &&
          typeof command.getCurrentStep === "function"
        ) {
          const polygonCmd = command as PolygonCommand;
          const step = polygonCmd.getCurrentStep();

          if (step === "specify_radius") {
            const context = createContext();
            if (context) {
              context.points = pointsRef.current;
              const preview = polygonCmd.createPreview(context, finalPos);
              setPreviewEntity(convertPreview(preview));
            }
          } else {
            setPreviewEntity(null);
          }
        } else {
          setPreviewEntity(null);
        }
        return;
      }

      if (pointsRef.current.length === 0) {
        setPreviewEntity(null);
        return;
      }

      const context = createContext();
      if (context) {
        context.points = pointsRef.current;
        const preview = command.createPreview(context, finalPos);
        setPreviewEntity(convertPreview(preview));
      }
    },
    [activeTool, orthoMode, applyOrthoMode, createContext, convertPreview]
  );

  const handleRightClick = useCallback((): boolean => {
    const command = commandRef.current;
    if (!command || !isDrawingTool(activeTool)) return false;

    if (
      (activeTool === ToolMode.DRAW_LINE ||
        activeTool === ToolMode.DRAW_POLYGON) &&
      command.canComplete(pointsRef.current.length)
    ) {
      if (engine) {
        const styleSnapshot = getSnapshotStyle();
        const result = engine.executeInteractiveCommand(command, {
          points: pointsRef.current,
          style: styleSnapshot,
          layerId: effectiveLayerId,
        });
        if (result.success) {
          onPromptChangeRef.current?.(
            `Created ${activeTool.replace("DRAW_", "").toLowerCase()}`
          );
        }
      }
    }

    restartDrawingCommand(internals);
    return true;
  }, [activeTool, engine, effectiveLayerId, getSnapshotStyle, internals]);

  const handleEnter = useCallback((): boolean => {
    const command = commandRef.current;
    if (!command || !isDrawingTool(activeTool)) return false;

    const isContinuousMode =
      (activeTool === ToolMode.DRAW_LINE ||
        activeTool === ToolMode.DRAW_POLYGON) &&
      command.autoComplete === false;

    if (isContinuousMode) {
      if (activeTool === ToolMode.DRAW_LINE) {
        if (pointsRef.current.length >= 1) {
          onPromptChangeRef.current?.("LINE command completed");
        }
      } else if (activeTool === ToolMode.DRAW_POLYGON) {
        if (engine && pointsRef.current.length >= 3) {
          const styleSnapshot = getSnapshotStyle();
          const polygonEntity = PolylineEntity.create(
            pointsRef.current,
            true,
            styleSnapshot
          );
          polygonEntity.layerId = currentLayerId;
          engine.addEntity(polygonEntity);

          const cadEntity: CadEntity = {
            id: polygonEntity.id,
            type: "polyline",
            points: pointsRef.current.map((p) => ({ x: p.x, y: p.y })),
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
            `POLYGON created with ${pointsRef.current.length} points`
          );
        } else {
          onPromptChangeRef.current?.("Need at least 3 points for POLYGON");
        }
      }

      restartDrawingCommand(internals);
      return true;
    }

    // Standard commands
    if (command.canComplete(pointsRef.current.length)) {
      if (engine) {
        const styleSnapshot = getSnapshotStyle();
        const result = engine.executeInteractiveCommand(command, {
          points: pointsRef.current,
          style: styleSnapshot,
          layerId: effectiveLayerId,
        });
        if (result.success) {
          onPromptChangeRef.current?.(
            `Created ${activeTool.replace("DRAW_", "").toLowerCase()}`
          );
        }
      }
      restartDrawingCommand(internals);
    } else {
      onPromptChangeRef.current?.(
        `Need at least ${command.requiredPoints} points to complete`
      );
    }

    return true;
  }, [activeTool, engine, currentLayerId, effectiveLayerId, getSnapshotStyle, internals]);

  const handleEscape = useCallback((): boolean => {
    const command = commandRef.current;
    if (!command || !isDrawingTool(activeTool)) return false;
    restartDrawingCommand(internals);
    return true;
  }, [activeTool, internals]);

  const getPreviewEntity = useCallback(
    (): CadEntity | null => previewEntity,
    [previewEntity]
  );

  const isCommandTool = useCallback(
    (): boolean => isDrawingTool(activeTool),
    [activeTool]
  );

  // ==================== Build Return ====================

  const state: CommandDrawingState = {
    isActive,
    activeTool,
    points,
    previewEntity,
    prompt,
  };

  const actions: CommandDrawingActions = {
    handleMouseDown,
    handleMouseMove,
    handleRightClick,
    handleEnter,
    handleEscape,
    getPreviewEntity,
    isCommandTool,
    // Dimension input (from sub-hook)
    handleLineInput: dimensionInputHandlers.handleLineInput,
    handleRectInput: dimensionInputHandlers.handleRectInput,
    handleCircleInput: dimensionInputHandlers.handleCircleInput,
    // Polygon (from sub-hook)
    handlePolygonOption: polygonHandlers.handlePolygonOption,
    handlePolygonInput: polygonHandlers.handlePolygonInput,
    handlePolygonSidesRadius: polygonHandlers.handlePolygonSidesRadius,
    getPolygonSides: polygonHandlers.getPolygonSides,
    // Text (from sub-hook)
    handleTextInput: textHandlers.handleTextInput,
    isWaitingForTextInput: textHandlers.isWaitingForTextInput,
    handleTextOption: textHandlers.handleTextOption,
  };

  return { state, actions };
}

export default useCommandDrawing;
