/**
 * useCommandDrawing - Hook để xử lý drawing tools qua Command pattern
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 *
 * Hook này được thiết kế để dễ dàng integrate vào CadDrawingCanvas:
 * 1. Nhận mouse events từ canvas
 * 2. Nếu là drawing tool → xử lý qua Commands, return true
 * 3. Nếu không phải drawing tool → return false để canvas xử lý như cũ
 *
 * Cách sử dụng trong CadDrawingCanvas:
 * ```
 * const commandDrawing = useCommandDrawing({ activeTool, ... });
 *
 * const handleMouseDown = (e) => {
 *   // ... basic setup ...
 *
 *   // Let command handle if it's a drawing tool
 *   if (commandDrawing.handleMouseDown(worldPos)) {
 *     return; // Command handled it
 *   }
 *
 *   // ... existing code for select, modify, etc ...
 * }
 * ```
 */

"use client";

import {
  useCallback,
  useRef,
  useState,
  useEffect,
  startTransition,
} from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import { useEngineStore } from "../../../store/engineStore";
import {
  IInteractiveCommand,
  CommandContext,
} from "../../../core/commands/Command.types";
import { EntityType } from "../../../core/entities/Entity.types";

// Import Commands
import { LineCommand } from "../../../core/commands/draw/LINE";
import { RectCommand } from "../../../core/commands/draw/RECT";
import { CircleCommand } from "../../../core/commands/draw/CIRCLE";
import { ArcCommand } from "../../../core/commands/draw/ARC";
import { EllipseCommand } from "../../../core/commands/draw/ELLIPSE";
import { TextCommand } from "../../../core/commands/draw/TEXT";
import { PolygonCommand } from "../../../core/commands/draw/POLYGON";
import { LineEntity } from "../../../core/entities/Line";
import { RectEntity } from "../../../core/entities/Rect";
import { CircleEntity } from "../../../core/entities/Circle";
import { PolylineEntity } from "../../../core/entities/Polyline";
import { TextEntity } from "../../../core/entities/Text";
import type { Point, CadEntity } from "../types/CadEntity";

// Re-export for backward compatibility
export type { Point, CadEntity };

export interface CommandDrawingConfig {
  activeTool: ToolMode;
  currentLayerId: string;
  orthoMode: boolean;
  /** Callback to update prompt */
  onPromptChange?: (prompt: string) => void;
  /** Callback when entity is added (for CadDrawingCanvas to update) */
  onEntityAdded?: (entity: CadEntity) => void;
}

export interface CommandDrawingState {
  /** Is a drawing command active */
  isActive: boolean;
  /** Current tool mode */
  activeTool: ToolMode;
  /** Points collected so far */
  points: Point[];
  /** Preview entity for rendering */
  previewEntity: CadEntity | null;
  /** Current prompt */
  prompt: string;
}

export interface CommandDrawingActions {
  /** Handle mouse down - returns true if handled */
  handleMouseDown: (worldPos: Point) => boolean;
  /** Handle mouse move - update preview */
  handleMouseMove: (worldPos: Point) => void;
  /** Handle right click - finish or cancel */
  handleRightClick: () => boolean;
  /** Handle Enter key - finish drawing */
  handleEnter: () => boolean;
  /** Handle Escape key - cancel drawing */
  handleEscape: () => boolean;
  /** Get current preview entity for rendering */
  getPreviewEntity: () => CadEntity | null;
  /** Check if this tool should be handled by commands */
  isCommandTool: () => boolean;
  /** Handle line input with length/angle from DynamicInputOverlay */
  handleLineInput: (length: number, angle: number) => boolean;
  /** Handle rect input with width/height from DynamicInputOverlay */
  handleRectInput: (width: number, height: number) => boolean;
  /** Handle circle input with radius or diameter from DynamicInputOverlay */
  handleCircleInput: (value: number, isDiameter: boolean) => boolean;
  /** Handle polygon option (E = Edge, I = Inscribed, C = Circumscribed) */
  handlePolygonOption: (option: string) => boolean;
  /** Handle polygon input (number of sides or radius) */
  handlePolygonInput: (input: string) => boolean;
  /** Handle polygon input with sides and radius from DynamicInputOverlay */
  handlePolygonSidesRadius: (sides: number, radius: number) => boolean;
  /** Get current polygon sides */
  getPolygonSides: () => number;
  /** Handle text input - create text entity with content */
  handleTextInput: (text: string) => boolean;
  /** Check if waiting for text input (after clicking position) */
  isWaitingForTextInput: () => boolean;
  /** Handle text option (H = Height, J = Justify, S = Style, R = Rotation, SC = Scale, B = Bold, I = Italic) */
  handleTextOption: (option: string) => boolean;
}

export interface UseCommandDrawingReturn {
  state: CommandDrawingState;
  actions: CommandDrawingActions;
}

// ==================== Drawing Tool Detection ====================

const DRAWING_TOOLS = [
  ToolMode.DRAW_LINE,
  ToolMode.DRAW_RECT,
  ToolMode.DRAW_CIRCLE,
  ToolMode.DRAW_ARC,
  ToolMode.DRAW_ELLIPSE,
  ToolMode.DRAW_TEXT,
  ToolMode.DRAW_POLYGON,
];

function isDrawingTool(tool: ToolMode): boolean {
  return DRAWING_TOOLS.includes(tool);
}

function createCommand(tool: ToolMode): IInteractiveCommand | null {
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
   *
   * Layers ON (useByLayer=true):
   *   - Entity được gán layer
   *   - Style kế thừa từ layer (visual preset)
   *
   * Layers OFF (useByLayer=false):
   *   - Entity KHÔNG có layer
   *   - Style từ currentStyle (Header2 style picker)
   */
  const getSnapshotStyle = useCallback(() => {
    const defaultStyle = {
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
      strokeStyle: "solid" as const,
      fillColor: null as string | null,
      opacity: 1,
    };

    // Layers OFF: Use currentStyle from Header2 (no layer inheritance)
    if (!useByLayer) {
      if (!currentStyle) return defaultStyle;
      return JSON.parse(JSON.stringify(currentStyle));
    }

    // Layers ON: Get style from active layer
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

  // State - use state instead of refs for command to trigger proper re-renders
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

  // Sync refs in effects (not during render)
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
  // This is an intentional state reset when activeTool prop changes
  // Only reset if tool actually changed (not on every render)
  useEffect(() => {
    // Skip if tool hasn't actually changed
    if (prevActiveToolRef.current === activeTool) {
      return;
    }
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

  // NOTE: pointsRef is the source of truth for callbacks

  // Create command context - uses snapshot style
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

  // Map EntityType enum to canvas entity type string
  const mapEntityType = useCallback(
    (entityType: EntityType): CadEntity["type"] => {
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
    },
    []
  );

  // Convert IEntity to CadEntity for canvas rendering
  const convertToCadEntity = useCallback(
    (entity: unknown): CadEntity | null => {
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
    },
    [effectiveLayerId, mapEntityType]
  );

  // Apply ortho mode to point
  const applyOrthoMode = useCallback(
    (point: Point): Point => {
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
    },
    [orthoMode]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (worldPos: Point): boolean => {
      const command = commandRef.current;
      if (!command || !isDrawingTool(activeTool)) {
        return false; // Not handled
      }

      // Apply ortho
      let finalPos = worldPos;
      if (orthoMode && pointsRef.current.length > 0) {
        finalPos = applyOrthoMode(worldPos);
      }

      // TEXT mode: Chỉ cần 1 point. Nếu đã có 1 point (đang chờ text input),
      // thay thế bằng point mới thay vì thêm vào
      if (activeTool === ToolMode.DRAW_TEXT && pointsRef.current.length >= 1) {
        // Đang chờ text input, click mới sẽ thay đổi vị trí
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

      // Update prompt
      const newPrompt = command.getPrompt(newPoints.length);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);

      // Check if command can auto-complete (for rect, circle - not for LINE)
      // autoComplete default = true, LINE sets it to false
      const shouldAutoComplete = command.autoComplete !== false;

      if (shouldAutoComplete && command.canComplete(newPoints.length)) {
        // ĐIỀU KIỆN 1: Gọi engine.executeInteractiveCommand() thay vì tự execute
        // Flow: UI → CadEngine.executeInteractiveCommand() → Document → History
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

            // Restart for continuous drawing
            const newCommand = createCommand(activeTool);
            if (newCommand) {
              // Update both ref (for immediate use) and state (for React)
              commandRef.current = newCommand;
              setCommand(newCommand);
              pointsRef.current = [];
              setPoints([]);
              setPreviewEntity(null);
              const restartPrompt = newCommand.getPrompt(0);
              setPrompt(restartPrompt);
              onPromptChangeRef.current?.(restartPrompt);
            }
          }
        }
      } else if (!shouldAutoComplete && newPoints.length >= 2) {
        // LINE/POLYLINE mode: AutoCAD-style continuous drawing
        if (engine && activeTool === ToolMode.DRAW_LINE) {
          // LINE: Tạo LINE entity ngay khi click điểm thứ 2+
          // Mỗi click tạo 1 đoạn thẳng riêng biệt
          const start = newPoints[newPoints.length - 2];
          const end = newPoints[newPoints.length - 1];

          // Tạo LINE entity từ 2 điểm cuối
          const styleSnapshot = getSnapshotStyle();
          const lineEntity = LineEntity.create(start, end, styleSnapshot);
          lineEntity.layerId = currentLayerId;

          // ĐIỀU KIỆN 1: Thêm entity qua engine
          engine.addEntity(lineEntity);

          // Notify CadDrawingCanvas to update entities list
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
            // ByLayer or Custom mode
          };
          onEntityAddedRef.current?.(cadEntity);

          onPromptChangeRef.current?.(
            `Created line segment ${newPoints.length - 1}`
          );

          // Clear preview after creating entity
          setPreviewEntity(null);
        } else if (activeTool === ToolMode.DRAW_POLYGON) {
          // POLYGON: Use PolygonCommand's handlePoint for simplified workflow
          // Check if command is actually a PolygonCommand (may still be old command during transition)
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
            // Create polygon entity
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

            // Restart command
            polygonCmd.reset();
            pointsRef.current = [];
            setPoints([]);
            setPreviewEntity(null);
          } else {
            // Not completed - update points to track center selection
            // This enables DynamicInputOverlay to show when center is selected
            const center = polygonCmd.getCenter();
            if (center) {
              pointsRef.current = [center];
              setPoints([center]);
            }
          }

          // Update prompt
          const polygonPrompt = polygonCmd.getPrompt(0);
          setPrompt(polygonPrompt);
          onPromptChangeRef.current?.(polygonPrompt);
        }
      } else if (!shouldAutoComplete && activeTool === ToolMode.DRAW_TEXT) {
        // TEXT: Click vị trí xong → đợi text input
        // Nếu đã có 1 point (đang chờ text input), bỏ qua click mới
        if (newPoints.length > 1) {
          // Reset về chỉ giữ point mới nhất
          pointsRef.current = [finalPos];
          setPoints([finalPos]);
        }
        // Prompt sẽ hiển thị "Enter text..." và UI sẽ hiển thị text input
        onPromptChangeRef.current?.(
          "TEXT: Nhập văn bản rồi click ra ngoài để lưu"
        );
      }

      return true; // Handled
    },
    [
      activeTool,
      orthoMode,
      applyOrthoMode,
      engine,
      currentLayerId,
      effectiveLayerId,
      getSnapshotStyle,
    ]
  );

  // Handle mouse move - update preview
  const handleMouseMove = useCallback(
    (worldPos: Point): void => {
      const command = commandRef.current;
      if (!command || !isDrawingTool(activeTool)) {
        return;
      }

      // Apply ortho
      let finalPos = worldPos;
      if (orthoMode && pointsRef.current.length > 0) {
        finalPos = applyOrthoMode(worldPos);
      }

      // Special handling for POLYGON - it uses internal state
      if (activeTool === ToolMode.DRAW_POLYGON) {
        // Check if command is actually a PolygonCommand (may still be old command during transition)
        if (
          command &&
          "getCurrentStep" in command &&
          typeof command.getCurrentStep === "function"
        ) {
          const polygonCmd = command as PolygonCommand;
          const step = polygonCmd.getCurrentStep();

          // Only show preview when in specify_radius step (simplified workflow)
          if (step === "specify_radius") {
            const context = createContext();
            if (context) {
              context.points = pointsRef.current;
              const preview = polygonCmd.createPreview(context, finalPos);
              setPreviewEntity(convertToCadEntity(preview));
            }
          } else {
            setPreviewEntity(null);
          }
        } else {
          setPreviewEntity(null);
        }
        return;
      }

      // Only show preview if we have at least one point
      if (pointsRef.current.length === 0) {
        setPreviewEntity(null);
        return;
      }

      // Get preview from command
      const context = createContext();
      if (context) {
        context.points = pointsRef.current;
        const preview = command.createPreview(context, finalPos);
        setPreviewEntity(convertToCadEntity(preview));
      }
    },
    [activeTool, orthoMode, applyOrthoMode, createContext, convertToCadEntity]
  );

  // Handle right click - finish or cancel
  const handleRightClick = useCallback((): boolean => {
    const command = commandRef.current;
    if (!command || !isDrawingTool(activeTool)) {
      return false;
    }

    // For line/polygon: finish if we have enough points
    // ĐIỀU KIỆN 1: Gọi engine.executeInteractiveCommand()
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

    // Restart command
    const newCommand = createCommand(activeTool);
    if (newCommand) {
      commandRef.current = newCommand;
      setCommand(newCommand);
      pointsRef.current = [];
      setPoints([]);
      setPreviewEntity(null);
      const newPrompt = newCommand.getPrompt(0);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);
    }

    return true;
  }, [activeTool, engine, effectiveLayerId, getSnapshotStyle]);

  // Handle Enter key - finish drawing
  const handleEnter = useCallback((): boolean => {
    const command = commandRef.current;
    if (!command || !isDrawingTool(activeTool)) {
      return false;
    }

    // Command tool is active - we will handle this event
    // Even if we can't complete, we should return true to indicate
    // that the command system is handling Enter/Space

    // For LINE/POLYGON with autoComplete=false
    const isContinuousMode =
      (activeTool === ToolMode.DRAW_LINE ||
        activeTool === ToolMode.DRAW_POLYGON) &&
      command.autoComplete === false;

    if (isContinuousMode) {
      // LINE mode: entities already created on each click, just restart
      if (activeTool === ToolMode.DRAW_LINE) {
        if (pointsRef.current.length >= 1) {
          onPromptChangeRef.current?.("LINE command completed");
        }
      }
      // POLYGON mode: create entity now with all collected points (always closed)
      else if (activeTool === ToolMode.DRAW_POLYGON) {
        if (engine && pointsRef.current.length >= 3) {
          const styleSnapshot = getSnapshotStyle();
          const polygonEntity = PolylineEntity.create(
            pointsRef.current,
            true, // Polygon luôn đóng
            styleSnapshot
          );
          polygonEntity.layerId = currentLayerId;

          // ĐIỀU KIỆN 1: Thêm entity qua engine
          engine.addEntity(polygonEntity);

          // Notify CadDrawingCanvas
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
            closed: true, // Polygon luôn đóng
          };
          onEntityAddedRef.current?.(cadEntity);

          onPromptChangeRef.current?.(
            `POLYGON created with ${pointsRef.current.length} points`
          );
        } else {
          onPromptChangeRef.current?.("Need at least 3 points for POLYGON");
        }
      }

      // Restart command
      const newCommand = createCommand(activeTool);
      if (newCommand) {
        commandRef.current = newCommand;
        setCommand(newCommand);
        pointsRef.current = [];
        setPoints([]);
        setPreviewEntity(null);
        const newPrompt = newCommand.getPrompt(0);
        setPrompt(newPrompt);
        onPromptChangeRef.current?.(newPrompt);
      }
      return true;
    }

    // ĐIỀU KIỆN 1: Gọi engine.executeInteractiveCommand() for other commands
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

      // Restart command
      const newCommand = createCommand(activeTool);
      if (newCommand) {
        commandRef.current = newCommand;
        setCommand(newCommand);
        pointsRef.current = [];
        setPoints([]);
        setPreviewEntity(null);
        const newPrompt = newCommand.getPrompt(0);
        setPrompt(newPrompt);
        onPromptChangeRef.current?.(newPrompt);
      }
    } else {
      // Not enough points - show message but still handled
      onPromptChangeRef.current?.(
        `Need at least ${command.requiredPoints} points to complete`
      );
    }

    // Always return true when command tool is active
    // This prevents legacy mode from taking over
    return true;
  }, [activeTool, engine, currentLayerId, effectiveLayerId, getSnapshotStyle]);

  // Handle Escape key - cancel drawing
  const handleEscape = useCallback((): boolean => {
    const command = commandRef.current;
    if (!command || !isDrawingTool(activeTool)) {
      return false;
    }

    // Restart command (cancel current drawing)
    const newCommand = createCommand(activeTool);
    if (newCommand) {
      commandRef.current = newCommand;
      setCommand(newCommand);
      pointsRef.current = [];
      setPoints([]);
      setPreviewEntity(null);
      const newPrompt = newCommand.getPrompt(0);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);
    }

    return true;
  }, [activeTool]);

  // Get preview entity
  const getPreviewEntity = useCallback((): CadEntity | null => {
    return previewEntity;
  }, [previewEntity]);

  // Check if current tool is command-based
  const isCommandTool = useCallback((): boolean => {
    return isDrawingTool(activeTool);
  }, [activeTool]);

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
    [activeTool, engine, currentLayerId, effectiveLayerId, getSnapshotStyle]
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
      const newCommand = createCommand(activeTool);
      if (newCommand) {
        commandRef.current = newCommand;
        setCommand(newCommand);
        pointsRef.current = [];
        setPoints([]);
        setPreviewEntity(null);
        const restartPrompt = newCommand.getPrompt(0);
        setPrompt(restartPrompt);
        onPromptChangeRef.current?.(restartPrompt);
      }

      return true;
    },
    [activeTool, engine, currentLayerId, effectiveLayerId, getSnapshotStyle]
  );

  // Handle circle input with radius or diameter from DynamicInputOverlay
  const handleCircleInput = useCallback(
    (value: number, isDiameter: boolean): boolean => {
      const command = commandRef.current;
      if (!command || activeTool !== ToolMode.DRAW_CIRCLE) {
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
      const newCommand = createCommand(activeTool);
      if (newCommand) {
        commandRef.current = newCommand;
        setCommand(newCommand);
        pointsRef.current = [];
        setPoints([]);
        setPreviewEntity(null);
        const restartPrompt = newCommand.getPrompt(0);
        setPrompt(restartPrompt);
        onPromptChangeRef.current?.(restartPrompt);
      }

      return true;
    },
    [activeTool, engine, currentLayerId, effectiveLayerId, getSnapshotStyle]
  );

  // Handle polygon option: E (Edge), I (Inscribed), C (Circumscribed)
  const handlePolygonOption = useCallback(
    (option: string): boolean => {
      if (activeTool !== ToolMode.DRAW_POLYGON) {
        return false;
      }

      const cmd = commandRef.current;
      // Check if command is actually a PolygonCommand
      if (
        !cmd ||
        !("handleOption" in cmd) ||
        typeof cmd.handleOption !== "function"
      ) {
        return false;
      }
      const command = cmd as PolygonCommand;

      const opt = option.toUpperCase();

      // Delegate to command's handleOption
      const styleSnapshot = getSnapshotStyle();
      const context = {
        points: pointsRef.current,
        style: styleSnapshot,
        layerId: effectiveLayerId,
        engine: engine!,
        options: {} as Record<string, unknown>,
      };

      command.handleOption(opt, context);

      // Update prompt
      const newPrompt = command.getPrompt(pointsRef.current.length);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);

      return true;
    },
    [activeTool, engine, effectiveLayerId, getSnapshotStyle]
  );

  // Handle polygon input: number of sides or radius
  const handlePolygonInput = useCallback(
    (input: string): boolean => {
      if (activeTool !== ToolMode.DRAW_POLYGON) {
        return false;
      }

      const cmd = commandRef.current;
      // Check if command is actually a PolygonCommand
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
          // Create polygon entity
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
      engine,
      currentLayerId,
      effectiveLayerId,
      handlePolygonOption,
      getSnapshotStyle,
    ]
  );

  // Handle polygon input with sides and radius from DynamicInputOverlay
  const handlePolygonSidesRadius = useCallback(
    (sides: number, radius: number): boolean => {
      if (activeTool !== ToolMode.DRAW_POLYGON) {
        return false;
      }

      const cmd = commandRef.current;
      // Check if command is actually a PolygonCommand
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
        points: points.map((p) => ({ x: p.x, y: p.y })),
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
    [activeTool, engine, currentLayerId, effectiveLayerId, getSnapshotStyle]
  );

  // Get current polygon sides
  const getPolygonSides = useCallback((): number => {
    if (activeTool !== ToolMode.DRAW_POLYGON) {
      return 6; // Default
    }
    const command = commandRef.current;
    // Check if command is actually a PolygonCommand (may still be old command during transition)
    if (
      command &&
      "getSides" in command &&
      typeof command.getSides === "function"
    ) {
      return command.getSides();
    }
    return 6; // Default
  }, [activeTool]);

  // Handle text option: H (Height), J (Justify), S (Style), R (Rotation), SC (Scale), B (Bold), I (Italic)
  const handleTextOption = useCallback(
    (option: string): boolean => {
      if (activeTool !== ToolMode.DRAW_TEXT) {
        return false;
      }

      const cmd = commandRef.current;
      // Check if command is actually a TextCommand
      if (
        !cmd ||
        !("handleOption" in cmd) ||
        typeof cmd.handleOption !== "function"
      ) {
        return false;
      }
      const command = cmd as TextCommand;

      const opt = option.toUpperCase();

      // Delegate to command's handleOption
      const styleSnapshot = getSnapshotStyle();
      const context = {
        points: pointsRef.current,
        style: styleSnapshot,
        layerId: effectiveLayerId,
        engine: engine!,
        options: {} as Record<string, unknown>,
      };

      command.handleOption(opt, context);

      // Update prompt
      const newPrompt = command.getPrompt(pointsRef.current.length);
      setPrompt(newPrompt);
      onPromptChangeRef.current?.(newPrompt);

      return true;
    },
    [activeTool, engine, effectiveLayerId, getSnapshotStyle]
  );

  // Check if waiting for text input (TEXT command clicked position, need text content)
  // Use points state (not ref) to trigger re-render when points change
  const isWaitingForTextInput = useCallback((): boolean => {
    return activeTool === ToolMode.DRAW_TEXT && points.length === 1;
  }, [activeTool, points.length]);

  // Handle text input - create TEXT entity with content
  const handleTextInput = useCallback(
    (text: string): boolean => {
      if (activeTool !== ToolMode.DRAW_TEXT) {
        return false;
      }

      if (pointsRef.current.length < 1) {
        onPromptChangeRef.current?.("Click a position first");
        return false;
      }

      if (!text.trim()) {
        onPromptChangeRef.current?.("Text cannot be empty");
        return false;
      }

      if (engine) {
        const position = pointsRef.current[0];

        // Get text options from TextCommand if available
        const cmd = commandRef.current as TextCommand | null;
        let textOptions = {
          fontSize: 14,
          fontFamily: "Arial",
          textAlign: "left" as "left" | "center" | "right",
          fontWeight: "normal" as "normal" | "bold",
          fontStyle: "normal" as "normal" | "italic",
          textBaseline: "middle" as "top" | "middle" | "bottom",
        };
        let scale = 1;

        if (
          cmd &&
          "getTextOptions" in cmd &&
          typeof cmd.getTextOptions === "function"
        ) {
          const opts = cmd.getTextOptions();
          textOptions = {
            fontSize: opts.fontSize || 14,
            fontFamily: opts.fontFamily || "Arial",
            textAlign: opts.textAlign || "left",
            fontWeight: opts.fontWeight || "normal",
            fontStyle: opts.fontStyle || "normal",
            textBaseline: opts.textBaseline || "middle",
          };
          scale = opts.scale || 1;
        }

        // Apply scale to fontSize
        const scaledFontSize = textOptions.fontSize * scale;
        const styleSnapshot = getSnapshotStyle();

        const textEntity = TextEntity.create(position, text, styleSnapshot, {
          fontSize: scaledFontSize,
          fontFamily: textOptions.fontFamily,
          fontWeight: textOptions.fontWeight,
          fontStyle: textOptions.fontStyle,
          textAlign: textOptions.textAlign,
          textBaseline: textOptions.textBaseline,
        });
        textEntity.layerId = currentLayerId;

        // ĐIỀU KIỆN 1: Thêm entity qua engine
        engine.addEntity(textEntity);

        // Notify CadDrawingCanvas - IMPORTANT: Include text content!
        const cadEntity: CadEntity = {
          id: textEntity.id,
          type: "text",
          points: [{ x: position.x, y: position.y }],
          color: textEntity.style?.strokeColor || "#FFFFFF",
          lineWidth: 1,
          layer: effectiveLayerId,
          text: text, // CRITICAL: Must include text content!
          fontSize: scaledFontSize,
          fontFamily: textOptions.fontFamily,
          strokeStyle:
            (styleSnapshot.strokeStyle as
              | "solid"
              | "dashed"
              | "dotted"
              | "dashdot") || "solid",
        };
        onEntityAddedRef.current?.(cadEntity);

        onPromptChangeRef.current?.(
          `Created text: "${text}" (size: ${scaledFontSize}px)`
        );
      }

      // Restart command
      const newCommand = createCommand(activeTool);
      if (newCommand) {
        commandRef.current = newCommand;
        setCommand(newCommand);
        pointsRef.current = [];
        setPoints([]);
        setPreviewEntity(null);
        const restartPrompt = newCommand.getPrompt(0);
        setPrompt(restartPrompt);
        onPromptChangeRef.current?.(restartPrompt);
      }

      return true;
    },
    [activeTool, engine, currentLayerId, effectiveLayerId, getSnapshotStyle]
  );

  // Build state
  const state: CommandDrawingState = {
    isActive,
    activeTool,
    points,
    previewEntity,
    prompt,
  };

  // Build actions
  const actions: CommandDrawingActions = {
    handleMouseDown,
    handleMouseMove,
    handleRightClick,
    handleEnter,
    handleEscape,
    getPreviewEntity,
    isCommandTool,
    handleLineInput,
    handleRectInput,
    handleCircleInput,
    handlePolygonOption,
    handlePolygonInput,
    handlePolygonSidesRadius,
    getPolygonSides,
    handleTextInput,
    isWaitingForTextInput,
    handleTextOption,
  };

  return { state, actions };
}

export default useCommandDrawing;
