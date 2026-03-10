/**
 * useCadCanvasCore.ts — Core state, derived values, and infrastructure hooks
 * for CadDrawingCanvas.
 *
 * STEP-5.24: Extracted from CadDrawingCanvas.tsx to reduce file size.
 * Contains:
 *   - Door store hooks
 *   - Controlled vs uncontrolled mode logic
 *   - All useState / useRef declarations
 *   - Store actions (toggleOrtho, setActiveTool)
 *   - useCommandDrawing setup + derivedDynamicInputMode
 *   - Coordinate transforms (screenToWorld, worldToScreen)
 *   - TextHitTestContext
 *   - Door drag & drop (useDoorDragDrop)
 *   - findOsnapPoint
 *   - Undo / Redo
 *   - useEntityOperations
 *   - Command input handler effect
 */

"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { ToolMode } from "../../../core/engine/EngineState";
import { useEngineStore } from "../../../store/engineStore";
import { useDoorStore } from "../../../store/doorStore";
import type { DimensionEntity } from "../../../core/dimensions/DimensionManager";
import type {
  DrawingState,
  DimensionGrip,
  CadDrawingCanvasProps,
} from "../canvas.types";
import type { Point, CadEntity } from "../types/CadEntity";
import type { TextHitTestContext } from "../utils";
import { findOsnapPoint as findOsnapPointUtil } from "../utils";
import { useCommandDrawing } from "../handlers";
import { useDoorDragDrop } from "./useDoorDragDrop";
import { useEntityOperations } from "./useEntityOperations";

// ---------------------------------------------------------------------------
// Params — Pick relevant props from CadDrawingCanvasProps
// ---------------------------------------------------------------------------

export type CadCanvasCoreParams = Pick<
  CadDrawingCanvasProps,
  | "activeTool"
  | "currentLayerId"
  | "orthoMode"
  | "osnapEnabled"
  | "osnapModes"
  | "osnapApertureSize"
  | "layers"
  | "controlledEntities"
  | "controlledSelectedIds"
  | "useExternalHistory"
  | "onAddEntity"
  | "onDeleteEntities"
  | "onMoveEntities"
  | "onSelectEntities"
  | "onUndo"
  | "onRedo"
  | "onSelectionChanged"
  | "onEntityCreated"
  | "onEntityUpdated"
  | "onEntityDeleted"
  | "onEntitiesChange"
  | "onPromptChange"
  | "textSettings"
  | "commandInput"
  | "onCommandInputConsumed"
  | "onDoorDrop"
>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCadCanvasCore(params: CadCanvasCoreParams) {
  const {
    activeTool,
    currentLayerId = "default",
    orthoMode = false,
    osnapEnabled = true,
    osnapModes = {
      endpoint: true,
      midpoint: true,
      center: true,
      intersection: false,
      perpendicular: false,
      nearest: false,
    },
    osnapApertureSize = 5,
    layers = [],
    controlledEntities,
    controlledSelectedIds,
    useExternalHistory = false,
    onAddEntity,
    onDeleteEntities,
    onMoveEntities,
    onSelectEntities,
    onUndo,
    onRedo,
    onSelectionChanged,
    onEntityCreated,
    onEntityUpdated,
    onEntityDeleted,
    onEntitiesChange: _onEntitiesChange,
    onPromptChange,
    textSettings,
    commandInput,
    onCommandInputConsumed,
    onDoorDrop,
  } = params;

  // ==================== Refs ====================

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScreenPosRef = useRef<Point>({ x: 0, y: 0 });

  // ==================== DOOR STORE ====================

  const getAllDoors = useDoorStore((state) => state.getAllDoors);
  const selectedDoorIdsArray = useDoorStore(
    useShallow((state) => Array.from(state.selectedDoorIds)),
  );
  const selectedDoorIds = useMemo(
    () => new Set(selectedDoorIdsArray),
    [selectedDoorIdsArray],
  );
  const hoveredDoorId = useDoorStore((state) => state.hoveredDoorId);
  const selectDoor = useDoorStore((state) => state.selectDoor);
  const setHoveredDoor = useDoorStore((state) => state.setHoveredDoor);
  const clearDoorSelection = useDoorStore((state) => state.clearSelection);
  const doors = getAllDoors();

  // ==================== CONTROLLED VS UNCONTROLLED MODE ====================

  const isControlled = controlledEntities !== undefined;
  const [internalEntities, setInternalEntities] = useState<CadEntity[]>([]);
  const entities = isControlled ? controlledEntities : internalEntities;
  const selectedIds =
    isControlled && controlledSelectedIds !== undefined
      ? controlledSelectedIds
      : [];

  // ==================== STATE DECLARATIONS ====================

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredDimensionId, setHoveredDimensionId] = useState<string | null>(
    null,
  );
  const [hoveredGrip, setHoveredGrip] = useState<DimensionGrip | null>(null);
  const [dimensionClipboard, setDimensionClipboard] = useState<
    DimensionEntity[]
  >([]);

  // Undo/Redo History (chỉ dùng khi uncontrolled và không dùng external history)
  const [undoStack, setUndoStack] = useState<CadEntity[][]>([]);
  const [redoStack, setRedoStack] = useState<CadEntity[][]>([]);
  const MAX_HISTORY = 50;

  // Drawing state
  const [drawState, setDrawState] = useState<DrawingState>({ mode: "idle" });
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const mousePosRef = React.useRef<Point>({ x: 0, y: 0 });
  const moveCopyAngleRef = React.useRef<number>(0);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  // Moving preview state (controlled mode)
  const [movingPreviewDelta, setMovingPreviewDelta] = useState<Point | null>(
    null,
  );

  // OFFSET preview state
  const [offsetPreviewEntity, setOffsetPreviewEntity] = useState<{
    type: CadEntity["type"];
    points: Point[];
  } | null>(null);

  // Canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  // Viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // OSNAP state
  const [snapPoint, setSnapPoint] = useState<{
    point: Point;
    type: string;
  } | null>(null);

  // Dynamic input state
  const [dynamicInput, setDynamicInput] = useState<{
    active: boolean;
    mode:
      | "length"
      | "width-height"
      | "radius-diameter"
      | "sides-radius"
      | "move-copy"
      | "offset-distance";
    value1: string;
    value2: string;
    focusField: 1 | 2;
    screenPos: Point;
  }>({
    active: false,
    mode: "length",
    value1: "",
    value2: "",
    focusField: 1,
    screenPos: { x: 0, y: 0 },
  });

  // Text input state
  const [textInput, setTextInput] = useState<{
    active: boolean;
    value: string;
    position: Point;
    editingId?: string;
  }>({
    active: false,
    value: "",
    position: { x: 0, y: 0 },
  });
  const textInputRef = React.useRef<HTMLTextAreaElement>(null);
  const textInputMountedRef = React.useRef<boolean>(false);
  const textInputOriginalValueRef = React.useRef<string>("");

  // Text scale input state
  const [textScaleInput, setTextScaleInput] = useState<{
    active: boolean;
    value: string;
    targetIds: string[];
  }>({
    active: false,
    value: "",
    targetIds: [],
  });
  const textScaleInputRef = React.useRef<HTMLInputElement>(null);

  // Rotate angle input state
  const [rotateAngleInput, setRotateAngleInput] = useState<{
    active: boolean;
    value: string;
  }>({
    active: false,
    value: "",
  });
  const rotateAngleInputRef = React.useRef<HTMLInputElement>(null);

  // ==================== STORE ACTIONS ====================

  const toggleOrtho = useEngineStore((s) => s.toggleOrtho);
  const setActiveTool = useEngineStore((s) => s.setActiveTool);
  const effectiveOrtho = orthoMode || isShiftPressed;

  // ==================== Command-Based Drawing (ĐIỀU KIỆN 1) ====================

  const commandDrawing = useCommandDrawing({
    activeTool,
    currentLayerId,
    orthoMode: effectiveOrtho,
    onPromptChange,
    onEntityAdded: (entity) => {
      if (isControlled && onAddEntity) {
        onAddEntity(entity);
      } else {
        setInternalEntities((prev) => [...prev, entity]);
      }
    },
  });

  // ==================== Derived Dynamic Input Mode ====================

  const derivedDynamicInputMode = React.useMemo(() => {
    // OFFSET mode
    if (
      drawState.mode === "modifyOffset" &&
      "step" in drawState &&
      drawState.step === "enterDistance"
    ) {
      return "offset-distance" as const;
    }

    // ĐIỀU KIỆN 1: command-based drawing
    if (commandDrawing.state.isActive) {
      const tool = commandDrawing.state.activeTool;
      const hasCenter = commandDrawing.state.points.length >= 1;

      if (tool === ToolMode.DRAW_LINE && hasCenter) {
        return "length" as const;
      } else if (tool === ToolMode.DRAW_RECT && hasCenter) {
        return "width-height" as const;
      } else if (tool === ToolMode.DRAW_CIRCLE && hasCenter) {
        return "radius-diameter" as const;
      } else if (tool === ToolMode.DRAW_POLYGON && hasCenter) {
        return "sides-radius" as const;
      }
    }

    // Legacy mode fallback
    if (drawState.mode === "line" && drawState.points.length === 1) {
      return "length" as const;
    } else if (drawState.mode === "rect" && drawState.corner1) {
      return "width-height" as const;
    } else if (drawState.mode === "circle" && drawState.center) {
      return "radius-diameter" as const;
    }
    return null;
  }, [
    drawState,
    commandDrawing.state.isActive,
    commandDrawing.state.points.length,
    commandDrawing.state.activeTool,
  ]);

  const prevDerivedModeRef = React.useRef<typeof derivedDynamicInputMode>(null);

  React.useLayoutEffect(() => {
    if (derivedDynamicInputMode !== prevDerivedModeRef.current) {
      prevDerivedModeRef.current = derivedDynamicInputMode;
      if (derivedDynamicInputMode) {
        setDynamicInput({
          active: true,
          mode: derivedDynamicInputMode,
          value1: "",
          value2: "",
          focusField: 1,
          screenPos: { x: 0, y: 0 },
        });
      } else {
        setDynamicInput((prev) => ({
          ...prev,
          active: false,
          value1: "",
          value2: "",
        }));
      }
    }
  }, [derivedDynamicInputMode]);

  // ==================== Coordinate Transforms ====================

  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const centerX = canvas.width / 2 + pan.x;
      const centerY = canvas.height / 2 + pan.y;
      return {
        x: (screenX - centerX) / zoom,
        y: -(screenY - centerY) / zoom,
      };
    },
    [pan, zoom],
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const centerX = canvas.width / 2 + pan.x;
      const centerY = canvas.height / 2 + pan.y;
      return {
        x: worldX * zoom + centerX,
        y: -worldY * zoom + centerY,
      };
    },
    [pan, zoom],
  );

  // ==================== TEXT HIT TEST CONTEXT ====================

  const textHitTestContext = useMemo<TextHitTestContext | undefined>(() => {
    if (!textSettings) return undefined;
    return {
      zoom,
      textSettings,
    };
  }, [zoom, textSettings]);

  // ==================== DOOR DRAG & DROP ====================

  const {
    isDragOver,
    dragPreviewPos,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDoorDragDrop({
    containerRef,
    screenToWorld,
    onDoorDrop,
    onPromptChange,
  });

  // ==================== OSNAP Functions ====================

  const osnapAperture = osnapApertureSize / zoom;

  const findOsnapPoint = useCallback(
    (
      cursor: Point,
      fromPoint?: Point,
    ): { point: Point; type: string } | null => {
      const layersForOsnap = layers.map((l) => ({
        id: l.id,
        visible: l.visible,
        color: l.color,
      }));

      const osnapModesTyped = osnapModes as {
        endpoint: boolean;
        midpoint: boolean;
        center: boolean;
        intersection: boolean;
        perpendicular: boolean;
        nearest: boolean;
      };

      return findOsnapPointUtil(
        cursor,
        entities,
        layersForOsnap,
        osnapEnabled,
        osnapModesTyped,
        osnapAperture,
        fromPoint,
      );
    },
    [entities, layers, osnapAperture, osnapEnabled, osnapModes],
  );

  // ==================== Undo / Redo ====================

  const saveToHistory = useCallback(
    (currentEntities: CadEntity[]) => {
      if (isControlled || useExternalHistory) {
        return;
      }
      setUndoStack((prev) => {
        const newStack = [...prev, currentEntities.map((e) => ({ ...e }))];
        if (newStack.length > MAX_HISTORY) {
          return newStack.slice(-MAX_HISTORY);
        }
        return newStack;
      });
      setRedoStack([]);
    },
    [isControlled, useExternalHistory],
  );

  const undo = useCallback(() => {
    if (useExternalHistory && onUndo) {
      onUndo();
      return;
    }
    if (isControlled) return;
    if (undoStack.length === 0) {
      onPromptChange?.("Nothing to undo");
      return;
    }
    const previousState = undoStack[undoStack.length - 1];
    const currentState = internalEntities.map((e) => ({ ...e }));
    setRedoStack((prev) => [...prev, currentState]);
    setUndoStack((prev) => prev.slice(0, -1));
    setInternalEntities(previousState);
    onPromptChange?.(`Undo (${undoStack.length - 1} remaining)`);
  }, [
    useExternalHistory,
    onUndo,
    isControlled,
    undoStack,
    internalEntities,
    onPromptChange,
  ]);

  const redo = useCallback(() => {
    if (useExternalHistory && onRedo) {
      onRedo();
      return;
    }
    if (isControlled) return;
    if (redoStack.length === 0) {
      onPromptChange?.("Nothing to redo");
      return;
    }
    const nextState = redoStack[redoStack.length - 1];
    const currentState = internalEntities.map((e) => ({ ...e }));
    setUndoStack((prev) => [...prev, currentState]);
    setRedoStack((prev) => prev.slice(0, -1));
    setInternalEntities(nextState);
    onPromptChange?.(`Redo (${redoStack.length - 1} remaining)`);
  }, [
    useExternalHistory,
    onRedo,
    isControlled,
    redoStack,
    internalEntities,
    onPromptChange,
  ]);

  // ==================== Entity Operations ====================

  const {
    selectEntities,
    clearSelection,
    getSelectedEntities,
    addEntity,
    deleteSelectedEntities,
    copySelectedToClipboard,
    pasteFromClipboard,
    duplicateSelected,
    moveSelectedEntities,
    saveHistoryBeforeMove,
  } = useEntityOperations({
    entities,
    selectedIds,
    isControlled,
    internalEntities,
    setInternalEntities,
    useExternalHistory,
    zoom,
    saveToHistory,
    onSelectEntities,
    onSelectionChanged,
    onAddEntity,
    onDeleteEntities,
    onMoveEntities,
    onEntityCreated,
    onEntityUpdated,
    onEntityDeleted,
    onPromptChange,
  });

  // ==================== Command Input Handler (POLYGON) ====================

  const commandInputRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      commandInput !== undefined &&
      commandInput !== commandInputRef.current &&
      activeTool === ToolMode.DRAW_POLYGON
    ) {
      commandInputRef.current = commandInput;
      if (commandDrawing.actions.handlePolygonInput(commandInput)) {
        onCommandInputConsumed?.();
      }
    } else if (commandInput === undefined) {
      commandInputRef.current = undefined;
    }
  }, [
    commandInput,
    activeTool,
    commandDrawing.actions,
    onCommandInputConsumed,
  ]);

  // ==================== Return ====================

  return {
    // Refs
    canvasRef,
    containerRef,
    lastScreenPosRef,
    mousePosRef,
    moveCopyAngleRef,
    textInputRef,
    textInputMountedRef,
    textInputOriginalValueRef,
    textScaleInputRef,
    rotateAngleInputRef,

    // Door store
    doors,
    selectedDoorIds,
    hoveredDoorId,
    selectDoor,
    setHoveredDoor,
    clearDoorSelection,

    // Controlled mode
    isControlled,
    entities,
    selectedIds,
    internalEntities,
    setInternalEntities,

    // UI state
    hoveredId,
    setHoveredId,
    hoveredDimensionId,
    setHoveredDimensionId,
    hoveredGrip,
    setHoveredGrip,
    dimensionClipboard,
    setDimensionClipboard,

    // Drawing state
    drawState,
    setDrawState,
    mousePos,
    setMousePos,
    isShiftPressed,
    setIsShiftPressed,
    movingPreviewDelta,
    setMovingPreviewDelta,
    offsetPreviewEntity,
    setOffsetPreviewEntity,

    // Canvas dimensions
    canvasDimensions,
    setCanvasDimensions,

    // Viewport
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,

    // OSNAP
    snapPoint,
    setSnapPoint,

    // Dynamic input
    dynamicInput,
    setDynamicInput,

    // Text input
    textInput,
    setTextInput,
    textScaleInput,
    setTextScaleInput,
    rotateAngleInput,
    setRotateAngleInput,

    // Store actions
    toggleOrtho,
    setActiveTool,
    effectiveOrtho,

    // Command drawing
    commandDrawing,

    // Computed values
    screenToWorld,
    worldToScreen,
    textHitTestContext,
    findOsnapPoint,

    // Drag & drop
    isDragOver,
    dragPreviewPos,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,

    // History
    saveToHistory,
    undo,
    redo,

    // Entity operations
    selectEntities,
    clearSelection,
    getSelectedEntities,
    addEntity,
    deleteSelectedEntities,
    copySelectedToClipboard,
    pasteFromClipboard,
    duplicateSelected,
    moveSelectedEntities,
    saveHistoryBeforeMove,
  };
}
