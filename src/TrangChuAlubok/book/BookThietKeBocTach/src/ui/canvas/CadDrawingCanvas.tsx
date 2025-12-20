/**
 * CadDrawingCanvas - AutoCAD-style drawing canvas with Selection & Editing
 * Phase 5 Features:
 * - Selection: Click to select, Shift+click multi-select, selection box
 * - Move: Drag selected entities or use arrow keys
 * - Copy/Delete: Ctrl+C, Ctrl+V, Delete key
 * - Visual feedback for selection, hover
 * - Integration with engineStore
 *
 * REFACTORED: Utility functions extracted to ./utils/ folder
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ToolMode } from "../../core/engine/EngineState";
import { useEngineStore } from "../../store/engineStore";
import type { DimensionEntity } from "../../core/dimensions/DimensionManager";

// ==================== Utility Imports ====================
import {
  // Geometry
  distance,
  nearestPointOnSegment,
  snapToGridPoint,
  applyOrtho,
  // Entity utils
  entityBounds,
  entityIntersectsRect,
  hitTestEntity,
  moveEntity,
  copyEntity,
  // Dimension utils
  hitTestDimension,
  hitTestDimensionGrip,
  dimensionIntersectsRect,
  // OFFSET calculations
  calculateOffsetPreview,
  // OSNAP utilities
  findOsnapPoint as findOsnapPointUtil,
  // Tool helpers
  getToolType,
  getToolName,
  getCursor,
  // Render helpers
  drawGrid,
  drawSelectionBox,
  drawCrosshair,
  drawOsnapMarker,
  // Dimension rendering
  renderAllDimensions,
} from "./utils";

// ==================== Overlay Components ====================
import { HudOverlay, OsnapOverlay, DynamicInputOverlay } from "./overlay";

// ==================== Handler Helpers ====================
import {
  calculateArcFrom3Points,
  calculateEllipseRadiusY,
  createArcEntity,
  createEllipseEntity,
  // NEW: Command-based drawing hook (ĐIỀU KIỆN 1)
  useCommandDrawing,
} from "./handlers";
import type { Point, CadEntity } from "./types/CadEntity";

// Re-export for backward compatibility
export type { Point, CadEntity };

type DrawingState =
  | { mode: "idle" }
  | { mode: "line"; points: Point[] }
  | { mode: "rect"; corner1: Point | null }
  | { mode: "circle"; center: Point | null }
  | { mode: "arc"; points: Point[] }
  | { mode: "ellipse"; center: Point | null; axisEnd?: Point; radiusX?: number }
  | { mode: "text"; position: Point; inputActive: boolean }
  | { mode: "selecting"; start: Point; currentPos: Point }
  | {
      mode: "moving";
      startPos: Point;
      entities: CadEntity[];
      originalPositions: Point[][];
    }
  | {
      mode: "movingDimension";
      startPos: Point;
      dimensionId: string;
      originalOffset: number;
    }
  | {
      mode: "editingDimensionGrip";
      dimensionId: string;
      gripType: DimensionGripType;
      startPos: Point;
      originalDimension: DimensionEntity;
    }
  // ==================== Modify Commands (AutoCAD style) ====================
  | {
      mode: "modifyMove";
      step: "selectBase" | "selectDestination";
      basePoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
    }
  | {
      mode: "modifyCopy";
      step: "selectBase" | "selectDestination";
      basePoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
    }
  | {
      mode: "modifyRotate";
      step: "selectBase" | "selectAngle";
      basePoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
      startAngle?: number;
    }
  | {
      mode: "modifyMirror";
      step: "selectFirst" | "selectSecond";
      firstPoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
    }
  | {
      mode: "modifyScale";
      step: "selectBase" | "selectScale";
      basePoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
    }
  | {
      mode: "modifyOffset";
      step: "enterDistance" | "selectEntity" | "selectSide";
      distance?: number;
      entityId?: string;
    };

export interface LayerInfo {
  id: string;
  visible: boolean;
  locked: boolean;
  color?: string;
  // Extended style properties (ByLayer visual preset)
  fillColor?: string | null;
  opacity?: number;
  lineType?: string;
  lineWeight?: number;
}

// Dimension grip type
// point1, point2: điểm gốc (origin của extension lines)
// dimP1, dimP2: điểm trên dimension line (2 đầu)
// text: điểm giữa (để kéo offset hoặc di chuyển text)
export type DimensionGripType =
  | "point1"
  | "point2"
  | "dimP1"
  | "dimP2"
  | "text";

export interface DimensionGrip {
  dimensionId: string;
  type: DimensionGripType;
  position: Point; // World position
}

export interface CadDrawingCanvasProps {
  activeTool: ToolMode;
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSpacing?: number;
  orthoMode?: boolean;
  // OSNAP enabled (master toggle)
  osnapEnabled?: boolean;
  // OSNAP modes
  osnapModes?: Record<string, boolean>;
  // Layer support
  layers?: LayerInfo[];
  currentLayerId?: string;

  // ==================== CONTROLLED ENTITIES (ĐIỀU KIỆN 1) ====================
  // Khi sử dụng controlled mode, entities được quản lý từ bên ngoài (CadDocument)
  // và tất cả thay đổi đều thông qua callbacks

  /** Controlled entities from CadDocument. If provided, internal state is disabled. */
  controlledEntities?: CadEntity[];
  /** Controlled selection from CadDocument. */
  controlledSelectedIds?: string[];
  /** Use external undo/redo (from CadDocument History) instead of internal stack */
  useExternalHistory?: boolean;
  /** Callback when entity needs to be added (for controlled mode) */
  onAddEntity?: (entity: CadEntity) => void;
  /** Callback when entities need to be deleted (for controlled mode) */
  onDeleteEntities?: (ids: string[]) => void;
  /** Callback when entities need to be moved (for controlled mode) */
  onMoveEntities?: (ids: string[], dx: number, dy: number) => void;
  /** Callback when selection changes (for controlled mode) */
  onSelectEntities?: (ids: string[], additive: boolean) => void;
  /** Callback for external undo */
  onUndo?: () => void;
  /** Callback for external redo */
  onRedo?: () => void;

  // ==================== END CONTROLLED ENTITIES ====================

  // Dimension support
  dimensions?: DimensionEntity[];
  previewDimension?: DimensionEntity | null;
  previewDimensions?: DimensionEntity[]; // QDIM preview (nhiều dimensions)
  selectedDimensionIds?: string[];
  onDimensionClick?: (
    worldPos: Point,
    circleInfo?: { center: Point; radius: number; entityId: string },
    lineInfo?: { point1: Point; point2: Point; entityId: string }
  ) => void;
  onDimensionSelect?: (ids: string[]) => void;
  onDimensionDelete?: (id: string) => void;
  onDimensionUpdate?: (id: string, updates: Partial<DimensionEntity>) => void;
  onDimensionCopy?: (ids: string[]) => void;
  // QDIM support
  qdimStep?: number; // 0: selecting objects, 1: positioning offset
  onQdimSelectionConfirm?: (entities: CadEntity[]) => void;
  onQdimConfirm?: () => void;
  // Dimension tool auto select mode toggle
  dimensionToolStep?: number; // Current step of dimension tool
  onToggleAutoSelectMode?: () => void;
  // Repeat last command (AutoCAD Space behavior)
  onRepeatLastCommand?: () => void;
  // Place mode (for door templates, etc.)
  placeMode?: boolean;
  onPlaceClick?: (worldPos: Point) => void;
  // OFFSET distance from parent (set via command input)
  offsetDistance?: number;
  // Undo/Redo/Delete/ClearSelection triggers from parent
  triggerUndo?: number;
  triggerRedo?: number;
  triggerDelete?: number;
  triggerClearSelection?: number;
  // Text scale trigger from parent (when user types X in command input)
  textScaleTrigger?: number;
  // Current drawing style from Header2
  currentStrokeStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  // Callbacks
  onEntityCreated?: (entity: CadEntity) => void;
  onEntityUpdated?: (entity: CadEntity) => void;
  onEntityDeleted?: (id: string) => void;
  onSelectionChanged?: (ids: string[]) => void;
  onEntitiesChange?: (entities: CadEntity[]) => void;
  onMouseMove?: (worldPos: Point, screenPos: Point) => void;
  onPromptChange?: (prompt: string) => void;
  // Command step change callback for Command Steps Guide
  onStepChange?: (step: number) => void;

  // ==================== Modify Command Callbacks (ĐIỀU KIỆN 1) ====================
  // UI chỉ thu thập điểm, gọi callback để parent tạo Command và execute
  onModifyMoveComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point
  ) => void;
  onModifyCopyComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point
  ) => void;
  onModifyRotateComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    angle: number
  ) => void;
  onModifyMirrorComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    point1: Point,
    point2: Point
  ) => void;
  onModifyScaleComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    scaleFactor: number
  ) => void;
  onModifyOffsetComplete?: (
    entityId: string,
    distance: number,
    throughPoint: Point
  ) => void;

  // ==================== Command Input for special tools ====================
  /** Raw command input from Header3 for tools like POLYGON that need text input */
  commandInput?: string;
  /** Callback when command input is consumed */
  onCommandInputConsumed?: () => void;
}

// ==================== Component ====================

export const CadDrawingCanvas: React.FC<CadDrawingCanvasProps> = ({
  activeTool,
  showGrid = true,
  snapToGrid = false,
  gridSpacing = 10,
  orthoMode = false,
  osnapEnabled = true, // Master OSNAP toggle
  osnapModes = {
    endpoint: true,
    midpoint: true,
    center: true,
    intersection: false,
    perpendicular: false,
    nearest: false,
  },
  layers = [],
  currentLayerId = "default",
  // Controlled entities (ĐIỀU KIỆN 1)
  controlledEntities,
  controlledSelectedIds,
  useExternalHistory = false,
  onAddEntity,
  onDeleteEntities,
  onMoveEntities,
  onSelectEntities,
  onUndo,
  onRedo,
  // Dimensions
  dimensions = [],
  previewDimension = null,
  previewDimensions = [],
  selectedDimensionIds = [],
  onDimensionClick,
  onDimensionSelect,
  onDimensionDelete,
  onDimensionUpdate,
  onDimensionCopy,
  // QDIM
  qdimStep = 0,
  onQdimSelectionConfirm,
  onQdimConfirm,
  // Dimension tool auto select mode
  dimensionToolStep = 0,
  onToggleAutoSelectMode,
  onRepeatLastCommand,
  placeMode = false,
  onPlaceClick,
  offsetDistance,
  triggerUndo = 0,
  triggerRedo = 0,
  triggerDelete = 0,
  triggerClearSelection = 0,
  textScaleTrigger = 0,
  currentStrokeStyle = "solid",
  onEntityCreated,
  onEntityUpdated,
  onEntityDeleted,
  onSelectionChanged,
  onEntitiesChange,
  onMouseMove,
  onPromptChange,
  onStepChange,
  // Modify command callbacks (ĐIỀU KIỆN 1)
  onModifyMoveComplete,
  onModifyCopyComplete,
  onModifyRotateComplete,
  onModifyMirrorComplete,
  onModifyScaleComplete,
  onModifyOffsetComplete,
  // Command input for special tools
  commandInput,
  onCommandInputConsumed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ==================== CONTROLLED VS UNCONTROLLED MODE ====================
  // Nếu controlledEntities được cung cấp → controlled mode (ĐIỀU KIỆN 1)
  // Nếu không → uncontrolled mode (legacy, internal state)
  const isControlled = controlledEntities !== undefined;

  // Internal entities state (chỉ dùng khi uncontrolled)
  const [internalEntities, setInternalEntities] = useState<CadEntity[]>([]);
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  // Effective entities (controlled hoặc internal)
  const entities = isControlled ? controlledEntities : internalEntities;
  const selectedIds =
    isControlled && controlledSelectedIds !== undefined
      ? controlledSelectedIds
      : internalSelectedIds;

  // NOTE: setEntities và setSelectedIds helpers đã được thay thế bằng
  // logic trực tiếp trong các functions để support controlled mode tốt hơn.
  // Controlled mode: các operations đi qua callbacks (onAddEntity, onMoveEntities, etc.)
  // Uncontrolled mode: dùng setInternalEntities trực tiếp

  // ==================== END CONTROLLED MODE ====================

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredDimensionId, setHoveredDimensionId] = useState<string | null>(
    null
  );
  const [hoveredGrip, setHoveredGrip] = useState<DimensionGrip | null>(null);
  const [clipboard, setClipboard] = useState<CadEntity[]>([]);
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
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Keep mousePosRef in sync with state (in effect, not during render)
  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  // Notify parent of step changes for Command Steps Guide
  useEffect(() => {
    if (!onStepChange) return;

    // Calculate step based on drawState
    let step = 0;

    if (drawState.mode === "idle") {
      step = 0;
    } else if (drawState.mode === "line") {
      // Line: step 0 = first point, step 1+ = next points
      step = drawState.points.length > 0 ? 1 : 0;
    } else if (drawState.mode === "rect") {
      step = drawState.corner1 ? 1 : 0;
    } else if (drawState.mode === "circle") {
      step = drawState.center ? 1 : 0;
    } else if (
      drawState.mode === "modifyMove" ||
      drawState.mode === "modifyCopy"
    ) {
      // Modify: step 0 = select, step 1 = base point, step 2 = destination
      if (drawState.step === "selectBase") step = 1;
      else if (drawState.step === "selectDestination") step = 2;
    } else if (drawState.mode === "modifyRotate") {
      if (drawState.step === "selectBase") step = 1;
      else if (drawState.step === "selectAngle") step = 2;
    } else if (drawState.mode === "modifyMirror") {
      if (drawState.step === "selectFirst") step = 1;
      else if (drawState.step === "selectSecond") step = 2;
    } else if (drawState.mode === "modifyScale") {
      if (drawState.step === "selectBase") step = 1;
      else if (drawState.step === "selectScale") step = 2;
    } else if (drawState.mode === "modifyOffset") {
      if (drawState.step === "enterDistance") step = 0;
      else if (drawState.step === "selectEntity") step = 1;
      else if (drawState.step === "selectSide") step = 2;
    }

    onStepChange(step);
  }, [drawState, onStepChange]);

  // Moving preview state - dùng cho controlled mode
  // Lưu delta di chuyển để preview entities khi đang drag
  const [movingPreviewDelta, setMovingPreviewDelta] = useState<Point | null>(
    null
  );

  // OFFSET preview state - để hiển thị overlay giống COPY
  const [offsetPreviewEntity, setOffsetPreviewEntity] = useState<{
    type: CadEntity["type"];
    points: Point[];
  } | null>(null);

  // Canvas dimensions state (updated via effect to avoid ref access during render)
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

  // Dynamic input state for dimension entry
  const [dynamicInput, setDynamicInput] = useState<{
    active: boolean;
    mode: "length" | "width-height" | "radius-diameter" | "sides-radius";
    value1: string; // length, width, radius, or sides
    value2: string; // height (for rect), diameter (for circle), or radius (for polygon)
    focusField: 1 | 2; // which field has focus
    screenPos: Point; // position for the input overlay
  }>({
    active: false,
    mode: "length",
    value1: "",
    value2: "",
    focusField: 1,
    screenPos: { x: 0, y: 0 },
  });

  // Text input state for TEXT tool
  const [textInput, setTextInput] = useState<{
    active: boolean;
    value: string;
    position: Point;
    editingId?: string; // ID of text being edited
  }>({
    active: false,
    value: "",
    position: { x: 0, y: 0 },
  });
  const textInputRef = React.useRef<HTMLTextAreaElement>(null);
  const textInputMountedRef = React.useRef<boolean>(false); // Track if textarea was focused
  const textInputOriginalValueRef = React.useRef<string>(""); // Track original value when editing

  // Text scale input state for editing selected text entities
  const [textScaleInput, setTextScaleInput] = useState<{
    active: boolean;
    value: string;
    targetIds: string[]; // IDs of text entities being scaled
  }>({
    active: false,
    value: "",
    targetIds: [],
  });
  const textScaleInputRef = React.useRef<HTMLInputElement>(null);

  // Track last click time for double-click detection
  const lastClickTime = useRef<number>(0);
  const lastClickedEntity = useRef<string | null>(null);

  // Store actions
  const storeSelect = useEngineStore((s) => s.select);
  const storeClearSelection = useEngineStore((s) => s.clearSelection);
  const toggleOrtho = useEngineStore((s) => s.toggleOrtho);

  const effectiveOrtho = orthoMode || isShiftPressed;
  // hitTolerance: 5 pixels on screen converted to world units
  // AutoCAD-style: purely pixel-based, scales with zoom
  const hitTolerance = 5 / zoom;

  // ==================== Command-Based Drawing (ĐIỀU KIỆN 1) ====================
  // Hook để xử lý drawing tools qua Command pattern
  // UI → Command → CadEngine → Document → History
  const commandDrawing = useCommandDrawing({
    activeTool,
    currentLayerId,
    orthoMode: effectiveOrtho,
    onPromptChange,
    onEntityAdded: (entity) => {
      // Thêm entity vào canvas khi LINE được tạo
      if (isControlled && onAddEntity) {
        onAddEntity(entity);
      } else {
        setInternalEntities((prev) => [...prev, entity]);
      }
    },
  });

  // Derive dynamic input activation from both drawState (legacy) and commandDrawing (ĐIỀU KIỆN 1)
  const derivedDynamicInputMode = React.useMemo(() => {
    // ĐIỀU KIỆN 1: Check command-based drawing first
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
        // POLYGON: Show sides-radius input after center is selected
        return "sides-radius" as const;
      }
      // Other tools: no dynamic input by default
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

  // Track previous mode to detect changes and reset values
  const prevDerivedModeRef = React.useRef<typeof derivedDynamicInputMode>(null);

  // Update dynamic input when derived mode changes (using layout effect for sync)
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
    [pan, zoom]
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
    [pan, zoom]
  );

  // ==================== OSNAP Functions ====================
  // Using imported findOsnapPointUtil from ./utils/osnapUtils

  const osnapAperture = 15 / zoom; // Aperture size in world units

  const findOsnapPoint = useCallback(
    (
      cursor: Point,
      fromPoint?: Point
    ): { point: Point; type: string } | null => {
      // Convert layers prop to Layer interface expected by utils
      const layersForOsnap = layers.map((l) => ({
        id: l.id,
        visible: l.visible,
        color: l.color,
      }));

      // Cast osnapModes to OsnapModes type expected by utils
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
        fromPoint
      );
    },
    [entities, layers, osnapAperture, osnapEnabled, osnapModes]
  );

  // ==================== Undo/Redo ====================
  // ĐIỀU KIỆN 1: Trong controlled mode với external history,
  // undo/redo đi qua CadDocument History thay vì internal stack

  const saveToHistory = useCallback(
    (currentEntities: CadEntity[]) => {
      if (isControlled || useExternalHistory) {
        // External history: không cần save nội bộ
        return;
      }
      setUndoStack((prev) => {
        const newStack = [...prev, currentEntities.map((e) => ({ ...e }))];
        if (newStack.length > MAX_HISTORY) {
          return newStack.slice(-MAX_HISTORY);
        }
        return newStack;
      });
      setRedoStack([]); // Clear redo when new action is performed
    },
    [isControlled, useExternalHistory]
  );

  const undo = useCallback(() => {
    if (useExternalHistory && onUndo) {
      // External history: gọi callback
      onUndo();
      return;
    }

    if (isControlled) {
      // Controlled mode không có internal undo
      return;
    }

    if (undoStack.length === 0) {
      onPromptChange?.("Nothing to undo");
      return;
    }

    const previousState = undoStack[undoStack.length - 1];
    const currentState = internalEntities.map((e) => ({ ...e }));

    setRedoStack((prev) => [...prev, currentState]);
    setUndoStack((prev) => prev.slice(0, -1));
    setInternalEntities(previousState);
    setInternalSelectedIds([]);
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
      // External history: gọi callback
      onRedo();
      return;
    }

    if (isControlled) {
      // Controlled mode không có internal redo
      return;
    }

    if (redoStack.length === 0) {
      onPromptChange?.("Nothing to redo");
      return;
    }

    const nextState = redoStack[redoStack.length - 1];
    const currentState = internalEntities.map((e) => ({ ...e }));

    setUndoStack((prev) => [...prev, currentState]);
    setRedoStack((prev) => prev.slice(0, -1));
    setInternalEntities(nextState);
    setInternalSelectedIds([]);
    onPromptChange?.(`Redo (${redoStack.length - 1} remaining)`);
  }, [
    useExternalHistory,
    onRedo,
    isControlled,
    redoStack,
    internalEntities,
    onPromptChange,
  ]);

  // ==================== Trigger Undo/Redo from Props ====================
  const triggerUndoRef = useRef(triggerUndo);
  const triggerRedoRef = useRef(triggerRedo);

  useEffect(() => {
    if (triggerUndo > 0 && triggerUndo !== triggerUndoRef.current) {
      triggerUndoRef.current = triggerUndo;
      // Use setTimeout to avoid cascading renders warning
      setTimeout(() => undo(), 0);
    }
  }, [triggerUndo, undo]);

  useEffect(() => {
    if (triggerRedo > 0 && triggerRedo !== triggerRedoRef.current) {
      triggerRedoRef.current = triggerRedo;
      // Use setTimeout to avoid cascading renders warning
      setTimeout(() => redo(), 0);
    }
  }, [triggerRedo, redo]);

  // ==================== Selection Helpers ====================

  const selectEntities = useCallback(
    (ids: string[], additive = false) => {
      let newSelection: string[];
      if (additive) {
        const existing = new Set(selectedIds);
        ids.forEach((id) => {
          if (existing.has(id)) existing.delete(id);
          else existing.add(id);
        });
        newSelection = Array.from(existing);
      } else {
        newSelection = ids;
      }

      if (isControlled && onSelectEntities) {
        // Controlled mode: gọi callback
        onSelectEntities(newSelection, additive);
        return;
      }

      // Uncontrolled mode
      setInternalSelectedIds(newSelection);
      setInternalEntities((prev) =>
        prev.map((e) => ({ ...e, selected: newSelection.includes(e.id) }))
      );
      onSelectionChanged?.(newSelection);
      storeSelect(newSelection);
    },
    [
      isControlled,
      onSelectEntities,
      selectedIds,
      onSelectionChanged,
      storeSelect,
    ]
  );

  const clearSelection = useCallback(() => {
    if (isControlled && onSelectEntities) {
      // Controlled mode: gọi callback với empty array
      onSelectEntities([], false);
      return;
    }

    // Uncontrolled mode
    setInternalSelectedIds([]);
    setInternalEntities((prev) => prev.map((e) => ({ ...e, selected: false })));
    onSelectionChanged?.([]);
    storeClearSelection();
  }, [isControlled, onSelectEntities, onSelectionChanged, storeClearSelection]);

  const getSelectedEntities = useCallback((): CadEntity[] => {
    return entities.filter((e) => selectedIds.includes(e.id));
  }, [entities, selectedIds]);

  // ==================== Entity Operations ====================
  // ĐIỀU KIỆN 1: Trong controlled mode, tất cả operations đều đi qua callbacks

  const addEntity = useCallback(
    (entity: CadEntity) => {
      if (isControlled && onAddEntity) {
        // Controlled mode: gọi callback để thêm qua Commands
        onAddEntity(entity);
        return;
      }
      // Uncontrolled mode: internal state
      if (!useExternalHistory) {
        saveToHistory(internalEntities);
      }
      setInternalEntities((prev) => [...prev, entity]);
      onEntityCreated?.(entity);
    },
    [
      isControlled,
      onAddEntity,
      useExternalHistory,
      internalEntities,
      saveToHistory,
      onEntityCreated,
    ]
  );

  const deleteSelectedEntities = useCallback(() => {
    if (selectedIds.length === 0) return;

    if (isControlled && onDeleteEntities) {
      // Controlled mode: gọi callback để xóa qua Commands
      onDeleteEntities(selectedIds);
      return;
    }
    // Uncontrolled mode: internal state
    if (!useExternalHistory) {
      saveToHistory(internalEntities);
    }
    setInternalEntities((prev) =>
      prev.filter((e) => !selectedIds.includes(e.id))
    );
    selectedIds.forEach((id) => onEntityDeleted?.(id));
    clearSelection();
    onPromptChange?.(`Deleted ${selectedIds.length} object(s)`);
  }, [
    isControlled,
    onDeleteEntities,
    selectedIds,
    useExternalHistory,
    internalEntities,
    saveToHistory,
    onEntityDeleted,
    clearSelection,
    onPromptChange,
  ]);

  // ==================== Trigger Delete from Props ====================
  const triggerDeleteRef = useRef(triggerDelete);

  useEffect(() => {
    if (triggerDelete > 0 && triggerDelete !== triggerDeleteRef.current) {
      triggerDeleteRef.current = triggerDelete;
      // Use setTimeout to avoid cascading renders warning
      setTimeout(() => deleteSelectedEntities(), 0);
    }
  }, [triggerDelete, deleteSelectedEntities]);

  // ==================== Trigger Clear Selection from Props ====================
  const triggerClearSelectionRef = useRef(triggerClearSelection);

  useEffect(() => {
    if (
      triggerClearSelection > 0 &&
      triggerClearSelection !== triggerClearSelectionRef.current
    ) {
      triggerClearSelectionRef.current = triggerClearSelection;
      // Use setTimeout to avoid cascading renders warning
      setTimeout(() => {
        clearSelection();
        // Also cancel any drawing in progress
        if (drawState.mode !== "idle") {
          setDrawState({ mode: "idle" });
          onPromptChange?.("Command cancelled");
        }
      }, 0);
    }
  }, [triggerClearSelection, clearSelection, drawState.mode, onPromptChange]);

  // ==================== Focus Text Input when waiting ====================
  // When isWaitingForTextInput becomes true, focus the textarea with a delay
  // to ensure the mouse event is fully processed
  const isWaitingForText = commandDrawing.actions.isWaitingForTextInput();
  useEffect(() => {
    if (isWaitingForText && textInputRef.current) {
      // Delay focus to ensure mouse event is processed
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
        textInputMountedRef.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isWaitingForText]);

  // ==================== Focus Text Input for Legacy mode (edit existing text) ====================
  useEffect(() => {
    if (textInput.active && !isWaitingForText && textInputRef.current) {
      // Legacy mode: editing existing text entity
      // Use longer delay to ensure click event is fully processed
      const timer = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
          textInputMountedRef.current = true;
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [textInput.active, isWaitingForText]);

  // ==================== Trigger Text Scale from Props ====================
  const textScaleTriggerRef = useRef(textScaleTrigger);

  useEffect(() => {
    if (
      textScaleTrigger > 0 &&
      textScaleTrigger !== textScaleTriggerRef.current
    ) {
      textScaleTriggerRef.current = textScaleTrigger;

      // Check for selected text entities
      const selectedTextEntities = entities.filter(
        (ent) => selectedIds.includes(ent.id) && ent.type === "text"
      );

      if (selectedTextEntities.length > 0) {
        // Open scale dialog - use setTimeout to avoid cascading renders
        setTimeout(() => {
          setTextScaleInput({
            active: true,
            value: "1",
            targetIds: selectedTextEntities.map((e) => e.id),
          });
          onPromptChange?.(
            `Enter scale factor for ${selectedTextEntities.length} text(s):`
          );
        }, 0);
      } else {
        setTimeout(() => {
          onPromptChange?.("No text selected. Select text first then press X.");
        }, 0);
      }
    }
  }, [textScaleTrigger, entities, selectedIds, onPromptChange]);

  const copySelectedToClipboard = useCallback(() => {
    const selected = getSelectedEntities();
    if (selected.length > 0) {
      setClipboard(selected.map(copyEntity));
      onPromptChange?.(`Copied ${selected.length} object(s)`);
    }
  }, [getSelectedEntities, onPromptChange]);

  const pasteFromClipboard = useCallback(() => {
    if (clipboard.length === 0) return;

    const offset = 20 / zoom;
    const pasted = clipboard.map((e) =>
      moveEntity(copyEntity(e), offset, offset)
    );

    if (isControlled && onAddEntity) {
      // Controlled mode: add entities through callback
      pasted.forEach((entity) => onAddEntity(entity));
    } else {
      // Uncontrolled mode
      if (!useExternalHistory) {
        saveToHistory(internalEntities);
      }
      setInternalEntities((prev) => [...prev, ...pasted]);
    }
    selectEntities(pasted.map((e) => e.id));
    onPromptChange?.(`Pasted ${pasted.length} object(s)`);
  }, [
    clipboard,
    zoom,
    isControlled,
    onAddEntity,
    useExternalHistory,
    internalEntities,
    saveToHistory,
    selectEntities,
    onPromptChange,
  ]);

  const duplicateSelected = useCallback(() => {
    const selected = getSelectedEntities();
    if (selected.length === 0) return;

    const offset = 20 / zoom;
    const duplicated = selected.map((e) =>
      moveEntity(copyEntity(e), offset, offset)
    );

    if (isControlled && onAddEntity) {
      // Controlled mode: add entities through callback
      duplicated.forEach((entity) => onAddEntity(entity));
    } else {
      // Uncontrolled mode
      if (!useExternalHistory) {
        saveToHistory(internalEntities);
      }
      setInternalEntities((prev) => [...prev, ...duplicated]);
    }
    selectEntities(duplicated.map((e) => e.id));
    onPromptChange?.(`Duplicated ${duplicated.length} object(s)`);
  }, [
    getSelectedEntities,
    zoom,
    saveToHistory,
    selectEntities,
    onPromptChange,
    isControlled,
    onAddEntity,
    useExternalHistory,
    internalEntities,
  ]);

  const moveSelectedEntities = useCallback(
    (dx: number, dy: number) => {
      if (selectedIds.length === 0) return;

      if (isControlled && onMoveEntities) {
        // Controlled mode: gọi callback để move qua Commands
        onMoveEntities(selectedIds, dx, dy);
        return;
      }

      // Uncontrolled mode: internal state
      setInternalEntities((prev) =>
        prev.map((e) => {
          if (selectedIds.includes(e.id)) {
            const moved = moveEntity(e, dx, dy);
            onEntityUpdated?.(moved);
            return moved;
          }
          return e;
        })
      );
    },
    [isControlled, onMoveEntities, selectedIds, onEntityUpdated]
  );

  // Save history when move ends (called from mouseUp)
  const saveHistoryBeforeMove = useCallback(() => {
    if (!isControlled && !useExternalHistory) {
      saveToHistory(internalEntities);
    }
  }, [isControlled, useExternalHistory, internalEntities, saveToHistory]);

  // ==================== Resize ====================

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      // Update canvas dimensions state for use in render
      setCanvasDimensions({ width: canvas.width, height: canvas.height });
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ==================== Tool Change ====================

  // Handle tool change - only call external callbacks, state reset handled in mouse handlers
  useEffect(() => {
    const toolName = getToolName(activeTool);
    if (activeTool === ToolMode.SELECT) {
      onPromptChange?.("SELECT: Click to select, drag for box select");
    } else if (activeTool === ToolMode.DRAW_DIM_LINEAR) {
      onPromptChange?.("DIMLINEAR: Specify first extension line origin");
    } else if (activeTool === ToolMode.DRAW_DIM_ALIGNED) {
      onPromptChange?.("DIMALIGNED: Specify first extension line origin");
    } else if (activeTool === ToolMode.DRAW_DIM_ANGULAR) {
      onPromptChange?.("DIMANGULAR: Select arc, circle, or line");
    } else if (activeTool === ToolMode.DRAW_DIM_RADIUS) {
      onPromptChange?.("DIMRADIUS: Select arc or circle");
    } else if (activeTool === ToolMode.DRAW_QDIM) {
      if (qdimStep === 0) {
        onPromptChange?.("QDIM: Select objects to dimension, then press Enter");
      } else if (qdimStep === 1) {
        onPromptChange?.("QDIM: Specify dimension line position");
      }
    } else if (activeTool === ToolMode.DRAW_DIMCONTINUE) {
      onPromptChange?.("DIMCONTINUE: Select continued dimension");
    } else if (activeTool === ToolMode.DRAW_DIMARC) {
      onPromptChange?.("DIMARC: Select arc");
    } else if (activeTool === ToolMode.DRAW_POLYGON) {
      // POLYGON uses command-based workflow with multiple steps
      // The prompt will be updated by useCommandDrawing hook
      onPromptChange?.("POLYGON Nhập số cạnh <6>:");
    } else if (toolName) {
      onPromptChange?.(`${toolName}: Specify first point`);
    } else {
      onPromptChange?.("Ready");
    }
  }, [activeTool, qdimStep, onPromptChange]);

  // ==================== Command Input Handler for POLYGON ====================
  // Xử lý input từ command line khi POLYGON đang active
  const commandInputRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Only process if input changed and POLYGON is active
    if (
      commandInput !== undefined &&
      commandInput !== commandInputRef.current &&
      activeTool === ToolMode.DRAW_POLYGON
    ) {
      commandInputRef.current = commandInput;

      // Try to handle polygon input
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

  // Reset draw state when tool changes - use separate handler
  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    if (activeToolRef.current !== activeTool) {
      activeToolRef.current = activeTool;
      // Defer state update to avoid cascading render warning
      queueMicrotask(() => {
        const toolType = getToolType(activeTool);

        // Initialize modify mode with selected entities
        if (toolType === "modify") {
          const currentSelectedIds = selectedIds;
          const currentSelectedDimIds = selectedDimensionIds;

          // OFFSET không cần selection trước - xử lý riêng
          if (activeTool === ToolMode.OFFSET) {
            setDrawState({
              mode: "modifyOffset",
              step: "enterDistance",
            });
            onPromptChange?.(
              "OFFSET: Specify offset distance or [Through] <10>:"
            );
            return;
          }

          if (
            currentSelectedIds.length === 0 &&
            currentSelectedDimIds.length === 0
          ) {
            // No selection - prompt to select objects first
            onPromptChange?.("Select objects: ");
            setDrawState({ mode: "idle" });
            return;
          }

          // Initialize the appropriate modify mode
          switch (activeTool) {
            case ToolMode.MOVE:
              setDrawState({
                mode: "modifyMove",
                step: "selectBase",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
              });
              onPromptChange?.("MOVE: Specify base point");
              break;
            case ToolMode.COPY:
              setDrawState({
                mode: "modifyCopy",
                step: "selectBase",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
              });
              onPromptChange?.("COPY: Specify base point");
              break;
            case ToolMode.ROTATE:
              setDrawState({
                mode: "modifyRotate",
                step: "selectBase",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
              });
              onPromptChange?.("ROTATE: Specify base point");
              break;
            case ToolMode.MIRROR:
              setDrawState({
                mode: "modifyMirror",
                step: "selectFirst",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
              });
              onPromptChange?.("MIRROR: Specify first point of mirror line");
              break;
            case ToolMode.SCALE:
              setDrawState({
                mode: "modifyScale",
                step: "selectBase",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
              });
              onPromptChange?.("SCALE: Specify base point");
              break;
            default:
              setDrawState({ mode: "idle" });
          }
        } else {
          setDrawState({ mode: "idle" });
        }
      });
    }
  }, [activeTool, selectedIds, selectedDimensionIds, onPromptChange]);

  // ==================== Entities Change Callback ====================

  useEffect(() => {
    onEntitiesChange?.(entities);
  }, [entities, onEntitiesChange]);

  // ==================== OFFSET Distance Update ====================
  // Khi parent set offsetDistance, chuyển từ enterDistance → selectEntity
  // Sử dụng ref để tránh cascading render
  const offsetDistanceRef = useRef(offsetDistance);
  useEffect(() => {
    offsetDistanceRef.current = offsetDistance;
  }, [offsetDistance]);

  useEffect(() => {
    if (
      offsetDistance !== undefined &&
      offsetDistance > 0 &&
      drawState.mode === "modifyOffset" &&
      "step" in drawState &&
      drawState.step === "enterDistance"
    ) {
      // Use setTimeout to avoid cascading renders
      setTimeout(() => {
        setDrawState({
          mode: "modifyOffset",
          step: "selectEntity",
          distance: offsetDistance,
        });
        onPromptChange?.(`OFFSET distance = ${offsetDistance}. Select object:`);
      }, 0);
    }
  }, [offsetDistance, drawState, onPromptChange]);

  // ==================== Keyboard Events ====================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);

      // F8 - Toggle Ortho mode (works during drawing too)
      if (e.key === "F8") {
        e.preventDefault();
        toggleOrtho();
        onPromptChange?.(orthoMode ? "<Ortho off>" : "<Ortho on>");
        return;
      }

      // ==================== POLYGON Option: U (Undo) ====================
      if (activeTool === ToolMode.DRAW_POLYGON) {
        const key = e.key.toUpperCase();
        if (key === "U") {
          e.preventDefault();
          if (commandDrawing.actions.handlePolygonOption("U")) {
            return;
          }
        }
      }

      // ==================== TEXT Options: H, J, S, R, X (Scale), B, I ====================
      // Chỉ xử lý khi KHÔNG đang chờ text input (để người dùng có thể nhập các ký tự này)
      if (
        activeTool === ToolMode.DRAW_TEXT &&
        !commandDrawing.actions.isWaitingForTextInput()
      ) {
        const key = e.key.toUpperCase();
        // H = Height, J = Justify, S = Style, R = Rotation, X = Scale, B = Bold, I = Italic
        if (
          key === "H" ||
          key === "J" ||
          key === "S" ||
          key === "R" ||
          key === "X" ||
          key === "B" ||
          key === "I"
        ) {
          e.preventDefault();
          if (commandDrawing.actions.handleTextOption(key)) {
            return;
          }
        }
      }

      // ==================== EDIT SELECTED TEXT: X (Scale) ====================
      // Khi có text entities được chọn, nhấn X để scale (hoạt động ở MỌI tool)
      // Bỏ qua nếu đang chờ text input
      if (
        e.key.toUpperCase() === "X" &&
        !commandDrawing.actions.isWaitingForTextInput()
      ) {
        // Bỏ qua nếu đang ở TEXT tool và chưa có selection (X sẽ dùng cho text options)
        if (activeTool === ToolMode.DRAW_TEXT && selectedIds.length === 0) {
          // Let TEXT tool handle X for scale option
          return;
        }

        const selectedTextEntities = entities.filter(
          (ent) => selectedIds.includes(ent.id) && ent.type === "text"
        );
        if (selectedTextEntities.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          // Mở input để nhập scale factor
          setTextScaleInput({
            active: true,
            value: "1",
            targetIds: selectedTextEntities.map((ent) => ent.id),
          });
          onPromptChange?.(
            `Enter scale factor for ${selectedTextEntities.length} text(s) [current size will be multiplied]:`
          );
          // Focus input sau khi render
          setTimeout(() => {
            textScaleInputRef.current?.focus();
          }, 100);
          return;
        }
      }

      if (e.key === "Escape") {
        // Cancel text scale input if active
        if (textScaleInput.active) {
          setTextScaleInput({ active: false, value: "", targetIds: [] });
          onPromptChange?.("Scale cancelled");
          return;
        }

        // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Cancel ====================
        // Nếu drawing command đang active, cancel nó trước
        if (
          commandDrawing.actions.isCommandTool() &&
          commandDrawing.actions.handleEscape()
        ) {
          // Command handled it
          return;
        }

        // Always clear selection on ESC
        clearSelection();
        // Also cancel any drawing in progress
        if (drawState.mode !== "idle") {
          setDrawState({ mode: "idle" });
          onPromptChange?.("Command cancelled");
        } else {
          onPromptChange?.("Selection cleared");
        }
        return;
      }

      // ==================== SPACE / ENTER - AutoCAD Style ====================
      // Space and Enter work the same way in AutoCAD
      const isConfirmKey = e.key === " " || e.key === "Enter";

      if (isConfirmKey) {
        // Skip if text input is waiting for user input (allow space in text)
        if (commandDrawing.actions.isWaitingForTextInput()) {
          return; // Let the text input handle it
        }
        e.preventDefault();

        // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Confirm ====================
        // Nếu drawing command đang active, let it handle Enter/Space first
        if (
          commandDrawing.actions.isCommandTool() &&
          commandDrawing.actions.handleEnter()
        ) {
          // Command handled it (e.g., finish LINE/POLYLINE)
          return;
        }

        // 1. In SELECT mode and idle = repeat last command
        if (activeTool === ToolMode.SELECT && drawState.mode === "idle") {
          onRepeatLastCommand?.();
          return;
        }

        // 2. Dimension tools at step 0 = toggle auto select mode
        if (
          drawState.mode === "idle" &&
          dimensionToolStep === 0 &&
          (activeTool === ToolMode.DRAW_DIM_LINEAR ||
            activeTool === ToolMode.DRAW_DIM_ALIGNED ||
            activeTool === ToolMode.DRAW_DIM_RADIUS)
        ) {
          onToggleAutoSelectMode?.();
          return;
        }

        // 3. Line mode = finish drawing (legacy fallback)
        if (drawState.mode === "line") {
          if (drawState.points.length >= 2) {
            addEntity({
              id: `polyline-${Date.now()}`,
              type: "polyline",
              points: [...drawState.points],
              color: "#ffffff",
              lineWidth: 2,
              strokeStyle: currentStrokeStyle,
              layer: currentLayerId,
            });
          }
          setDrawState({ mode: "idle" });
          onPromptChange?.("LINE: Specify first point");
          return;
        }

        // 4. Rect/Circle mode = just prevent default, let user continue
        if (drawState.mode === "rect" || drawState.mode === "circle") {
          return;
        }

        // 5. QDIM step 0 = confirm selection
        if (activeTool === ToolMode.DRAW_QDIM && qdimStep === 0) {
          if (selectedIds.length > 0) {
            const selectedEntities = entities.filter((ent) =>
              selectedIds.includes(ent.id)
            );
            onQdimSelectionConfirm?.(selectedEntities);
            onPromptChange?.(
              `QDIM: ${selectedEntities.length} objects selected. Specify dimension line position`
            );
          } else {
            onPromptChange?.("QDIM: No objects selected. Select objects first");
          }
          return;
        }

        return;
      }
      // ==================== END SPACE / ENTER ====================

      if (e.key === "Delete") {
        // Delete selected entities
        deleteSelectedEntities();
        // Delete selected dimensions
        if (selectedDimensionIds.length > 0) {
          selectedDimensionIds.forEach((id) => onDimensionDelete?.(id));
          onDimensionSelect?.([]);
          onPromptChange?.(
            `Deleted ${selectedDimensionIds.length} dimension(s)`
          );
        }
        return;
      }

      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        // If dimensions are selected or in dimension tool, select all dimensions
        if (
          selectedDimensionIds.length > 0 ||
          activeTool === ToolMode.DRAW_DIMENSION
        ) {
          onDimensionSelect?.(dimensions.map((d) => d.id));
          onPromptChange?.(`Selected all dimensions (${dimensions.length})`);
        } else {
          // Select all entities
          selectEntities(entities.map((e) => e.id));
          onPromptChange?.(`Selected all (${entities.length} objects)`);
        }
        return;
      }

      // Ctrl+Shift+A: Select both entities AND dimensions
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        selectEntities(entities.map((e) => e.id));
        onDimensionSelect?.(dimensions.map((d) => d.id));
        onPromptChange?.(
          `Selected all (${entities.length} objects, ${dimensions.length} dimensions)`
        );
        return;
      }

      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        // Copy dimensions if selected
        if (selectedDimensionIds.length > 0) {
          const selectedDims = dimensions.filter((d) =>
            selectedDimensionIds.includes(d.id)
          );
          setDimensionClipboard(selectedDims);
          onDimensionCopy?.(selectedDimensionIds);
          onPromptChange?.(`Copied ${selectedDims.length} dimension(s)`);
        } else {
          copySelectedToClipboard();
        }
        return;
      }

      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        // Paste dimensions if clipboard has them
        if (dimensionClipboard.length > 0) {
          const offset = 20 / zoom;
          dimensionClipboard.forEach((dim) => {
            const newDim: DimensionEntity = {
              ...dim,
              id: `dim-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              point1: { x: dim.point1.x + offset, y: dim.point1.y + offset },
              point2: { x: dim.point2.x + offset, y: dim.point2.y + offset },
            };
            onDimensionUpdate?.(newDim.id, newDim);
          });
          onPromptChange?.(`Pasted ${dimensionClipboard.length} dimension(s)`);
        } else {
          pasteFromClipboard();
        }
        return;
      }

      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Arrow keys to move
      if (selectedIds.length > 0 && !e.ctrlKey) {
        const step = e.shiftKey ? 10 : 1;
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            moveSelectedEntities(0, step);
            break;
          case "ArrowDown":
            e.preventDefault();
            moveSelectedEntities(0, -step);
            break;
          case "ArrowLeft":
            e.preventDefault();
            moveSelectedEntities(-step, 0);
            break;
          case "ArrowRight":
            e.preventDefault();
            moveSelectedEntities(step, 0);
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    activeTool,
    currentLayerId,
    dimensions,
    dimensionClipboard,
    drawState,
    entities,
    selectedIds,
    selectedDimensionIds,
    zoom,
    clearSelection,
    addEntity,
    deleteSelectedEntities,
    copySelectedToClipboard,
    pasteFromClipboard,
    duplicateSelected,
    moveSelectedEntities,
    selectEntities,
    undo,
    redo,
    onPromptChange,
    onDimensionDelete,
    onDimensionSelect,
    onDimensionUpdate,
    onDimensionCopy,
    qdimStep,
    onQdimSelectionConfirm,
    dimensionToolStep,
    onToggleAutoSelectMode,
    onRepeatLastCommand,
    commandDrawing.actions, // ĐIỀU KIỆN 1: Command-based drawing
    toggleOrtho,
    orthoMode,
    textScaleInput.active, // Text scale input state
    currentStrokeStyle,
  ]);

  // ==================== Global Mouse Up for Pan ====================
  // Handle mouseup outside canvas when panning
  useEffect(() => {
    if (!isPanning) return;

    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Middle button released anywhere
      if (e.button === 1 || !e.buttons) {
        setIsPanning(false);
      }
    };

    const handleBlur = () => setIsPanning(false);

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isPanning]);

  // ==================== Mouse Events ====================

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      let worldPos = screenToWorld(screenX, screenY);

      if (e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        return;
      }

      if (e.button === 2) {
        // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Right Click ====================
        // Nếu drawing command đang active, delegate cho hook
        if (
          commandDrawing.actions.isCommandTool() &&
          commandDrawing.actions.handleRightClick()
        ) {
          // Command handled it (e.g., finish LINE/POLYLINE)
          return;
        }

        // Legacy fallback for line mode
        if (drawState.mode === "line" && drawState.points.length >= 2) {
          addEntity({
            id: `polyline-${Date.now()}`,
            type: "polyline",
            points: [...drawState.points],
            color: "#ffffff",
            lineWidth: 2,
            strokeStyle: currentStrokeStyle,
            layer: currentLayerId,
          });
        }
        setDrawState({ mode: "idle" });
        onPromptChange?.("Ready");
        return;
      }

      // Use OSNAP point if available, otherwise grid snap
      // Pass the last point of current drawing for perpendicular snap
      const fromPoint =
        drawState.mode === "line" && drawState.points.length > 0
          ? drawState.points[drawState.points.length - 1]
          : undefined;
      const osnapResult = findOsnapPoint(worldPos, fromPoint);
      if (osnapResult) {
        worldPos = osnapResult.point;
        onPromptChange?.(`Snapped to ${osnapResult.type}`);
      } else if (snapToGrid) {
        worldPos = snapToGridPoint(worldPos, gridSpacing);
      }

      // ==================== ĐIỀU KIỆN 1: Command-Based Drawing ====================
      // Nếu là drawing tool, delegate cho useCommandDrawing hook
      // Hook sẽ tạo Command, execute qua CadEngine, và entities được tạo qua Document
      const isCommandToolResult = commandDrawing.actions.isCommandTool();
      if (isCommandToolResult) {
        const handled = commandDrawing.actions.handleMouseDown(worldPos);
        if (handled) {
          return; // Command handled it
        }
      }

      // PLACE MODE (for door templates, etc.)
      if (placeMode && onPlaceClick) {
        onPlaceClick(worldPos);
        return;
      }

      const toolType = getToolType(activeTool);

      // SELECT TOOL
      if (toolType === "select") {
        // First check if clicking on a grip of selected dimension
        for (const dimId of selectedDimensionIds) {
          const dim = dimensions.find((d) => d.id === dimId);
          if (dim) {
            const grip = hitTestDimensionGrip(dim, worldPos, hitTolerance * 2);
            if (grip) {
              // Start grip editing mode
              setDrawState({
                mode: "editingDimensionGrip",
                dimensionId: dim.id,
                gripType: grip.type,
                startPos: worldPos,
                originalDimension: { ...dim },
              });
              onPromptChange?.(`Editing dimension ${grip.type}`);
              return;
            }
          }
        }

        // Check if clicking on a dimension
        const hitDimension = dimensions.find((dim) =>
          hitTestDimension(dim, worldPos, hitTolerance)
        );

        if (hitDimension) {
          if (isShiftPressed) {
            // Toggle dimension selection
            const newSelection = selectedDimensionIds.includes(hitDimension.id)
              ? selectedDimensionIds.filter((id) => id !== hitDimension.id)
              : [...selectedDimensionIds, hitDimension.id];
            onDimensionSelect?.(newSelection);
          } else if (selectedDimensionIds.includes(hitDimension.id)) {
            // Already selected - start moving
            setDrawState({
              mode: "movingDimension",
              startPos: worldPos,
              dimensionId: hitDimension.id,
              originalOffset: hitDimension.offset,
            });
            onPromptChange?.("MOVE DIMENSION: Drag to adjust offset");
            return;
          } else {
            // Clear entity selection and select only this dimension
            clearSelection();
            onDimensionSelect?.([hitDimension.id]);
          }
          onPromptChange?.(`Dimension selected: ${hitDimension.id}`);
          return;
        }

        // Then check entities
        const hitEntity = entities.find((ent) =>
          hitTestEntity(ent, worldPos, hitTolerance)
        );

        if (hitEntity) {
          // Check for double-click on text entity for editing
          const currentTime = Date.now();
          const isDoubleClick =
            lastClickedEntity.current === hitEntity.id &&
            currentTime - lastClickTime.current < 500; // 500ms for double-click

          lastClickTime.current = currentTime;
          lastClickedEntity.current = hitEntity.id;

          // Handle double-click on text for editing
          if (isDoubleClick && hitEntity.type === "text") {
            // Store original value to detect changes
            textInputOriginalValueRef.current = hitEntity.text || "";
            textInputMountedRef.current = false; // Reset mounted flag

            // Start text editing mode
            setTextInput({
              active: true,
              value: hitEntity.text || "",
              position: hitEntity.points[0],
              editingId: hitEntity.id,
            });
            setDrawState({
              mode: "text",
              position: hitEntity.points[0],
              inputActive: true,
            });
            onPromptChange?.("TEXT: Edit text and press Enter to save");

            // Focus input after a short delay
            setTimeout(() => {
              textInputRef.current?.focus();
              textInputRef.current?.select();
            }, 50);
            return;
          }

          // Clear dimension selection when selecting entity
          if (!isShiftPressed) {
            onDimensionSelect?.([]);
          }
          if (isShiftPressed) {
            selectEntities([hitEntity.id], true);
          } else if (selectedIds.includes(hitEntity.id)) {
            // Entity is already selected
            // For TEXT entities: click on selected text enters edit mode
            if (hitEntity.type === "text") {
              // Store original value to detect changes
              textInputOriginalValueRef.current = hitEntity.text || "";
              textInputMountedRef.current = false; // Reset mounted flag

              // Start text editing mode
              setTextInput({
                active: true,
                value: hitEntity.text || "",
                position: hitEntity.points[0],
                editingId: hitEntity.id,
              });
              setDrawState({
                mode: "text",
                position: hitEntity.points[0],
                inputActive: true,
              });
              onPromptChange?.(
                "TEXT: Edit text (click outside to save, Escape to cancel)"
              );

              // Focus input after a short delay
              setTimeout(() => {
                textInputRef.current?.focus();
                textInputRef.current?.select();
              }, 50);
              return;
            }

            // Check if Ctrl is pressed for scaling
            if (e.ctrlKey) {
              // Start scaling mode
              setDrawState({
                mode: "modifyScale",
                step: "selectScale",
                basePoint: hitEntity.points[0], // Use first point as scale center
                entityIds: [hitEntity.id],
                dimensionIds: [],
              });
              onPromptChange?.("SCALE: Move mouse to scale");
            } else {
              // Save history before moving
              saveHistoryBeforeMove();
              setDrawState({
                mode: "moving",
                startPos: worldPos,
                entities: getSelectedEntities(),
                originalPositions: getSelectedEntities().map((ent) => [
                  ...ent.points,
                ]),
              });
              onPromptChange?.("MOVE: Specify destination point");
            }
          } else {
            selectEntities([hitEntity.id]);
          }
        } else {
          if (!isShiftPressed) {
            clearSelection();
            onDimensionSelect?.([]); // Clear dimension selection too
          }
          setDrawState({
            mode: "selecting",
            start: worldPos,
            currentPos: worldPos,
          });
          onPromptChange?.("SELECT: Drag to select objects");
        }
        return;
      }

      // DRAWING TOOLS
      switch (toolType) {
        case "line":
          if (drawState.mode !== "line") {
            setDrawState({ mode: "line", points: [worldPos] });
            onPromptChange?.("LINE: Specify next point [Enter to finish]");
          } else {
            let newPoint = worldPos;
            const lastPoint = drawState.points[drawState.points.length - 1];
            if (effectiveOrtho && lastPoint)
              newPoint = applyOrtho(lastPoint, worldPos);
            setDrawState({
              mode: "line",
              points: [...drawState.points, newPoint],
            });
            onPromptChange?.(
              `LINE: ${drawState.points.length + 1} points [Enter to finish]`
            );
          }
          break;

        case "rect":
          if (drawState.mode !== "rect" || !drawState.corner1) {
            setDrawState({ mode: "rect", corner1: worldPos });
            onPromptChange?.("RECTANGLE: Specify opposite corner");
          } else {
            let corner2 = worldPos;
            if (effectiveOrtho) {
              const size = Math.max(
                Math.abs(corner2.x - drawState.corner1.x),
                Math.abs(corner2.y - drawState.corner1.y)
              );
              corner2 = {
                x:
                  drawState.corner1.x +
                  Math.sign(corner2.x - drawState.corner1.x) * size,
                y:
                  drawState.corner1.y +
                  Math.sign(corner2.y - drawState.corner1.y) * size,
              };
            }
            addEntity({
              id: `rect-${Date.now()}`,
              type: "rect",
              points: [drawState.corner1, corner2],
              color: "#ffffff",
              lineWidth: 2,
              strokeStyle: currentStrokeStyle,
              layer: currentLayerId,
            });
            setDrawState({ mode: "rect", corner1: null });
            onPromptChange?.("RECTANGLE: Specify first corner");
          }
          break;

        case "circle":
          if (drawState.mode !== "circle" || !drawState.center) {
            setDrawState({ mode: "circle", center: worldPos });
            onPromptChange?.("CIRCLE: Specify radius");
          } else {
            const radius = distance(drawState.center, worldPos);
            addEntity({
              id: `circle-${Date.now()}`,
              type: "circle",
              points: [drawState.center, { x: radius, y: 0 }],
              color: "#ffffff",
              lineWidth: 2,
              strokeStyle: currentStrokeStyle,
              layer: currentLayerId,
            });
            setDrawState({ mode: "circle", center: null });
            onPromptChange?.("CIRCLE: Specify center point");
          }
          break;

        case "arc":
          // Arc: 3-point arc (start, point on arc, end)
          if (drawState.mode !== "arc") {
            setDrawState({ mode: "arc", points: [worldPos] });
            onPromptChange?.("ARC: Specify second point");
          } else if (drawState.points.length === 1) {
            setDrawState({
              mode: "arc",
              points: [...drawState.points, worldPos],
            });
            onPromptChange?.("ARC: Specify end point");
          } else if (drawState.points.length === 2) {
            // Calculate arc from 3 points using helper
            const arcData = calculateArcFrom3Points(
              drawState.points[0],
              drawState.points[1],
              worldPos
            );
            if (arcData) {
              addEntity(
                createArcEntity(
                  arcData.center,
                  arcData.radius,
                  arcData.startAngle,
                  arcData.endAngle,
                  currentLayerId
                )
              );
            }
            setDrawState({ mode: "arc", points: [] });
            onPromptChange?.("ARC: Specify start point");
          }
          break;

        case "ellipse":
          // Ellipse: center, end of first axis, distance to other axis
          if (drawState.mode !== "ellipse") {
            setDrawState({ mode: "ellipse", center: worldPos });
            onPromptChange?.("ELLIPSE: Specify end of axis");
          } else if (!drawState.axisEnd && drawState.center) {
            const radiusX = distance(drawState.center, worldPos);
            setDrawState({
              mode: "ellipse",
              center: drawState.center,
              axisEnd: worldPos,
              radiusX,
            });
            onPromptChange?.("ELLIPSE: Specify distance to other axis");
          } else if (
            drawState.axisEnd &&
            drawState.center &&
            drawState.radiusX
          ) {
            // Calculate radiusY and create ellipse using helpers
            const radiusY = calculateEllipseRadiusY(
              drawState.center,
              drawState.axisEnd,
              worldPos
            );
            const axisAngle = Math.atan2(
              drawState.axisEnd.y - drawState.center.y,
              drawState.axisEnd.x - drawState.center.x
            );
            addEntity(
              createEllipseEntity(
                drawState.center,
                drawState.radiusX,
                radiusY,
                axisAngle,
                currentLayerId
              )
            );
            setDrawState({ mode: "ellipse", center: null });
            onPromptChange?.("ELLIPSE: Specify center point");
          }
          break;

        case "text":
          // Text: single click to place text
          if (drawState.mode !== "text") {
            setDrawState({
              mode: "text",
              position: worldPos,
              inputActive: true,
            });
            setTextInput({ active: true, value: "", position: worldPos });
            onPromptChange?.("TEXT: Type text and press Enter");
          }
          break;

        case "dimension":
          // QDIM: Khi step=1, click để confirm và tạo dimensions
          if (activeTool === ToolMode.DRAW_QDIM && qdimStep === 1) {
            onQdimConfirm?.();
            onPromptChange?.("QDIM: Dimensions created");
          } else {
            // Check if clicking near a circle for radius/diameter dimension
            let circleInfo:
              | { center: Point; radius: number; entityId: string }
              | undefined;

            // Check if clicking on a line for linear/aligned dimension
            let lineInfo:
              | { point1: Point; point2: Point; entityId: string }
              | undefined;

            // Find entity near click point
            for (const entity of entities) {
              if (entity.type === "circle") {
                const center = entity.points[0];
                const radius = entity.points[1].x;
                const distToCenter = distance(worldPos, center);
                const distToEdge = Math.abs(distToCenter - radius);

                // If click is near the circle edge (within tolerance)
                if (distToEdge <= hitTolerance * 2) {
                  circleInfo = {
                    center,
                    radius,
                    entityId: entity.id,
                  };
                  break;
                }
              } else if (
                (entity.type === "line" || entity.type === "polyline") &&
                (activeTool === ToolMode.DRAW_DIM_LINEAR ||
                  activeTool === ToolMode.DRAW_DIM_ALIGNED)
              ) {
                // Check if click is near this line
                if (hitTestEntity(entity, worldPos, hitTolerance)) {
                  // For line/polyline, find the closest segment
                  if (entity.points.length >= 2) {
                    // Simple case: use first and last point for now
                    // TODO: For polyline, find the clicked segment
                    lineInfo = {
                      point1: entity.points[0],
                      point2: entity.points[entity.points.length - 1],
                      entityId: entity.id,
                    };
                    break;
                  }
                }
              }
            }

            // Pass click to parent for dimension handling
            onDimensionClick?.(worldPos, circleInfo, lineInfo);
          }
          break;

        case "modify":
          // Handle modify commands (MOVE, COPY, ROTATE, MIRROR, SCALE)
          // ĐIỀU KIỆN 1: UI chỉ thu thập điểm, gọi callback để parent tạo Command và execute
          if (drawState.mode === "modifyMove") {
            if (drawState.step === "selectBase") {
              // Set base point and move to next step
              setDrawState({
                ...drawState,
                step: "selectDestination",
                basePoint: worldPos,
              });
              onPromptChange?.("MOVE: Specify destination point");
            } else if (
              drawState.step === "selectDestination" &&
              drawState.basePoint
            ) {
              // Gọi callback - parent sẽ tạo MoveCommand và execute
              onModifyMoveComplete?.(
                drawState.entityIds,
                drawState.dimensionIds,
                drawState.basePoint,
                worldPos
              );
              // Done - reset
              setDrawState({ mode: "idle" });
              onPromptChange?.("MOVE completed");
            }
          } else if (drawState.mode === "modifyCopy") {
            if (drawState.step === "selectBase") {
              setDrawState({
                ...drawState,
                step: "selectDestination",
                basePoint: worldPos,
              });
              onPromptChange?.(
                "COPY: Specify destination point (or ESC to exit)"
              );
            } else if (
              drawState.step === "selectDestination" &&
              drawState.basePoint
            ) {
              // Gọi callback - parent sẽ tạo CopyCommand và execute
              onModifyCopyComplete?.(
                drawState.entityIds,
                drawState.dimensionIds,
                drawState.basePoint,
                worldPos
              );
              // Stay in copy mode for more copies
              onPromptChange?.(
                "COPY: Specify next destination point (or ESC to exit)"
              );
            }
          } else if (drawState.mode === "modifyRotate") {
            if (drawState.step === "selectBase") {
              setDrawState({
                ...drawState,
                step: "selectAngle",
                basePoint: worldPos,
              });
              onPromptChange?.("ROTATE: Specify rotation angle");
            } else if (
              drawState.step === "selectAngle" &&
              drawState.basePoint
            ) {
              // Calculate angle
              const angle = Math.atan2(
                worldPos.y - drawState.basePoint.y,
                worldPos.x - drawState.basePoint.x
              );
              const startAngle = drawState.startAngle ?? 0;
              const rotationAngle = angle - startAngle;

              // Gọi callback - parent sẽ tạo RotateCommand và execute
              onModifyRotateComplete?.(
                drawState.entityIds,
                drawState.dimensionIds,
                drawState.basePoint,
                rotationAngle
              );

              setDrawState({ mode: "idle" });
              onPromptChange?.(
                `ROTATE completed (${((rotationAngle * 180) / Math.PI).toFixed(
                  1
                )}°)`
              );
            }
          } else if (drawState.mode === "modifyMirror") {
            if (drawState.step === "selectFirst") {
              setDrawState({
                ...drawState,
                step: "selectSecond",
                firstPoint: worldPos,
              });
              onPromptChange?.("MIRROR: Specify second point of mirror line");
            } else if (
              drawState.step === "selectSecond" &&
              drawState.firstPoint
            ) {
              // Gọi callback - parent sẽ tạo MirrorCommand và execute
              onModifyMirrorComplete?.(
                drawState.entityIds,
                drawState.dimensionIds,
                drawState.firstPoint,
                worldPos
              );

              setDrawState({ mode: "idle" });
              onPromptChange?.("MIRROR completed");
            }
          } else if (drawState.mode === "modifyScale") {
            if (drawState.step === "selectBase") {
              setDrawState({
                ...drawState,
                step: "selectScale",
                basePoint: worldPos,
              });
              onPromptChange?.(
                "SCALE: Specify scale factor or reference point"
              );
            } else if (
              drawState.step === "selectScale" &&
              drawState.basePoint
            ) {
              // Calculate scale factor based on distance
              const newDist = distance(worldPos, drawState.basePoint);
              const scaleFactor = newDist / 100; // Simplified scale

              // Gọi callback - parent sẽ tạo ScaleCommand và execute
              onModifyScaleComplete?.(
                drawState.entityIds,
                drawState.dimensionIds,
                drawState.basePoint,
                scaleFactor
              );

              setDrawState({ mode: "idle" });
              onPromptChange?.(
                `SCALE completed (factor: ${scaleFactor.toFixed(2)})`
              );
            }
          } else if (drawState.mode === "modifyOffset") {
            if (drawState.step === "selectEntity") {
              // Tìm entity gần nhất
              let nearestEntity: CadEntity | null = null;
              let nearestDist = hitTolerance;

              for (const entity of entities) {
                for (let i = 0; i < entity.points.length - 1; i++) {
                  const pt = nearestPointOnSegment(
                    worldPos,
                    entity.points[i],
                    entity.points[i + 1]
                  );
                  const dist = distance(worldPos, pt);
                  if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEntity = entity;
                  }
                }
                // Check circle
                if (entity.type === "circle" && entity.points.length >= 2) {
                  const center = entity.points[0];
                  const radius = entity.points[1].x;
                  const distToCenter = distance(worldPos, center);
                  const distToCircle = Math.abs(distToCenter - radius);
                  if (distToCircle < nearestDist) {
                    nearestDist = distToCircle;
                    nearestEntity = entity;
                  }
                }
                // Check rect
                if (entity.type === "rect" && entity.points.length >= 2) {
                  const [p1, p2] = entity.points;
                  const edges = [
                    [p1, { x: p2.x, y: p1.y }],
                    [{ x: p2.x, y: p1.y }, p2],
                    [p2, { x: p1.x, y: p2.y }],
                    [{ x: p1.x, y: p2.y }, p1],
                  ];
                  for (const [a, b] of edges) {
                    const pt = nearestPointOnSegment(worldPos, a, b);
                    const dist = distance(worldPos, pt);
                    if (dist < nearestDist) {
                      nearestDist = dist;
                      nearestEntity = entity;
                    }
                  }
                }
              }

              if (nearestEntity && drawState.distance !== undefined) {
                setDrawState({
                  ...drawState,
                  step: "selectSide",
                  entityId: nearestEntity.id,
                });
                onPromptChange?.(
                  `OFFSET: Select side to offset (Entity: ${nearestEntity.type})`
                );
              } else {
                onPromptChange?.("OFFSET: No entity found. Select an object:");
              }
            } else if (
              drawState.step === "selectSide" &&
              drawState.entityId &&
              drawState.distance !== undefined
            ) {
              // Gọi callback với throughPoint
              onModifyOffsetComplete?.(
                drawState.entityId,
                drawState.distance,
                worldPos
              );

              // Tiếp tục cho phép offset thêm
              setDrawState({
                mode: "modifyOffset",
                step: "selectEntity",
                distance: drawState.distance,
              });
              onPromptChange?.(
                `OFFSET completed. Select next object to offset or ESC to exit:`
              );
            }
          }
          break;
      }
    },
    [
      activeTool,
      currentLayerId,
      currentStrokeStyle,
      dimensions,
      drawState,
      effectiveOrtho,
      entities,
      findOsnapPoint,
      gridSpacing,
      hitTolerance,
      isShiftPressed,
      pan,
      placeMode,
      screenToWorld,
      selectedDimensionIds,
      selectedIds,
      snapToGrid,
      addEntity,
      clearSelection,
      getSelectedEntities,
      selectEntities,
      saveHistoryBeforeMove,
      onPromptChange,
      onDimensionClick,
      onDimensionSelect,
      onPlaceClick,
      qdimStep,
      onQdimConfirm,
      // Modify command callbacks (ĐIỀU KIỆN 1)
      onModifyMoveComplete,
      onModifyCopyComplete,
      onModifyRotateComplete,
      onModifyMirrorComplete,
      onModifyScaleComplete,
      onModifyOffsetComplete,
      commandDrawing.actions, // ĐIỀU KIỆN 1: Command-based drawing
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      let worldPos = screenToWorld(screenX, screenY);

      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        setSnapPoint(null);
        return;
      }

      // Find OSNAP point first (higher priority than grid snap)
      // Pass the last point of current drawing for perpendicular snap
      const fromPoint =
        drawState.mode === "line" && drawState.points.length > 0
          ? drawState.points[drawState.points.length - 1]
          : undefined;
      const osnapResult = findOsnapPoint(worldPos, fromPoint);
      if (osnapResult) {
        setSnapPoint(osnapResult);
        worldPos = osnapResult.point;
      } else {
        setSnapPoint(null);
        // Fall back to grid snap
        if (snapToGrid) worldPos = snapToGridPoint(worldPos, gridSpacing);
      }

      if (
        effectiveOrtho &&
        drawState.mode === "line" &&
        drawState.points.length > 0
      ) {
        worldPos = applyOrtho(
          drawState.points[drawState.points.length - 1],
          worldPos
        );
        // Clear osnap if ortho overrides it
        if (osnapResult) setSnapPoint(null);
      }

      setMousePos(worldPos);
      onMouseMove?.(worldPos, { x: screenX, y: screenY });

      // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Preview ====================
      // Cập nhật preview cho drawing tools qua useCommandDrawing hook
      if (commandDrawing.actions.isCommandTool()) {
        commandDrawing.actions.handleMouseMove(worldPos);
        // Note: Preview entity is rendered from commandDrawing.state.previewEntity
      }

      if (drawState.mode === "selecting") {
        setDrawState({ ...drawState, currentPos: worldPos });
        return;
      }

      if (drawState.mode === "moving") {
        const dx = worldPos.x - drawState.startPos.x;
        const dy = worldPos.y - drawState.startPos.y;

        if (isControlled) {
          // Controlled mode: dùng movingPreviewDelta để preview
          // Không modify entities trực tiếp (tuân thủ ĐIỀU KIỆN 1)
          setMovingPreviewDelta({ x: dx, y: dy });
        } else {
          // Uncontrolled mode: modify entities trực tiếp
          setInternalEntities((prev) =>
            prev.map((entity) => {
              const idx = drawState.entities.findIndex(
                (ent) => ent.id === entity.id
              );
              if (idx !== -1) {
                return {
                  ...entity,
                  points: drawState.originalPositions[idx].map((p) => ({
                    x: p.x + dx,
                    y: p.y + dy,
                  })),
                };
              }
              return entity;
            })
          );
        }
        return;
      }

      // Handle dimension moving (adjusting offset)
      if (drawState.mode === "movingDimension") {
        const dim = dimensions.find((d) => d.id === drawState.dimensionId);
        if (dim) {
          const direction = dim.direction || "aligned";
          const midX = (dim.point1.x + dim.point2.x) / 2;
          const midY = (dim.point1.y + dim.point2.y) / 2;
          let newOffset: number;

          if (direction === "horizontal") {
            // Horizontal: offset theo Y, đảo dấu để di chuột lên thì dim đi lên
            newOffset = -(worldPos.y - midY);
          } else if (direction === "vertical") {
            // Vertical: offset theo X
            newOffset = worldPos.x - midX;
          } else {
            // Aligned: offset vuông góc với đường
            const dx = dim.point2.x - dim.point1.x;
            const dy = dim.point2.y - dim.point1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 0) {
              const perpX = -dy / length;
              const perpY = dx / length;
              newOffset = -(
                (worldPos.x - midX) * perpX +
                (worldPos.y - midY) * perpY
              );
            } else {
              newOffset = 0;
            }
          }

          // Update dimension
          onDimensionUpdate?.(dim.id, { offset: newOffset });
        }
        return;
      }

      // Handle dimension grip editing
      if (drawState.mode === "editingDimensionGrip") {
        const originalDim = drawState.originalDimension;
        const dx = worldPos.x - drawState.startPos.x;
        const dy = worldPos.y - drawState.startPos.y;
        const direction = originalDim.direction || "aligned";

        // Handle radius/diameter dimension grip editing
        if (
          originalDim.dimensionType === "radius" ||
          originalDim.dimensionType === "diameter"
        ) {
          const center = originalDim.point1;

          if (drawState.gripType === "point1") {
            // Di chuyển tâm - di chuyển cả dimension
            onDimensionUpdate?.(originalDim.id, {
              point1: {
                x: originalDim.point1.x + dx,
                y: originalDim.point1.y + dy,
              },
              point2: {
                x: originalDim.point2.x + dx,
                y: originalDim.point2.y + dy,
              },
            });
          } else if (drawState.gripType === "point2") {
            // Kéo điểm trên đường tròn - chỉ thay đổi GÓC, giữ nguyên bán kính
            // Để bám vào đường tròn gốc
            const oldDx = originalDim.point2.x - center.x;
            const oldDy = originalDim.point2.y - center.y;
            const radius = Math.sqrt(oldDx * oldDx + oldDy * oldDy);

            // Tính góc mới từ tâm đến vị trí chuột
            const newAngle = Math.atan2(
              worldPos.y - center.y,
              worldPos.x - center.x
            );

            // Điểm mới trên đường tròn (giữ nguyên bán kính)
            onDimensionUpdate?.(originalDim.id, {
              point2: {
                x: center.x + radius * Math.cos(newAngle),
                y: center.y + radius * Math.sin(newAngle),
              },
            });
          } else if (drawState.gripType === "text") {
            // Kéo text grip - chỉ thay đổi GÓC, giữ nguyên bán kính
            const oldDx = originalDim.point2.x - center.x;
            const oldDy = originalDim.point2.y - center.y;
            const radius = Math.sqrt(oldDx * oldDx + oldDy * oldDy);

            // Tính góc mới từ tâm đến vị trí chuột
            const newAngle = Math.atan2(
              worldPos.y - center.y,
              worldPos.x - center.x
            );

            // Điểm mới trên đường tròn (giữ nguyên bán kính)
            onDimensionUpdate?.(originalDim.id, {
              point2: {
                x: center.x + radius * Math.cos(newAngle),
                y: center.y + radius * Math.sin(newAngle),
              },
            });
          } else if (drawState.gripType === "dimP1") {
            // For diameter: di chuyển opposite point - thay đổi góc
            const oldDx = originalDim.point2.x - center.x;
            const oldDy = originalDim.point2.y - center.y;
            const radius = Math.sqrt(oldDx * oldDx + oldDy * oldDy);

            // Tính góc từ tâm đến opposite point (ngược với point2)
            const newAngle = Math.atan2(
              worldPos.y - center.y,
              worldPos.x - center.x
            );

            // Point2 là điểm đối diện với opposite
            onDimensionUpdate?.(originalDim.id, {
              point2: {
                x: center.x - radius * Math.cos(newAngle),
                y: center.y - radius * Math.sin(newAngle),
              },
            });
          }
          return;
        }

        if (drawState.gripType === "point1") {
          // Di chuyển điểm gốc 1
          onDimensionUpdate?.(originalDim.id, {
            point1: {
              x: originalDim.point1.x + dx,
              y: originalDim.point1.y + dy,
            },
          });
        } else if (drawState.gripType === "point2") {
          // Di chuyển điểm gốc 2
          onDimensionUpdate?.(originalDim.id, {
            point2: {
              x: originalDim.point2.x + dx,
              y: originalDim.point2.y + dy,
            },
          });
        } else if (drawState.gripType === "dimP1") {
          // Di chuyển đầu dim line 1 - thay đổi cả point1 và offset
          if (direction === "horizontal") {
            // Horizontal: kéo ngang thay đổi X của point1, kéo dọc thay đổi offset
            onDimensionUpdate?.(originalDim.id, {
              point1: { x: originalDim.point1.x + dx, y: originalDim.point1.y },
              offset: originalDim.offset + dy, // Đảo dấu vì Y ngược
            });
          } else if (direction === "vertical") {
            // Vertical: kéo dọc thay đổi Y của point1, kéo ngang thay đổi offset
            onDimensionUpdate?.(originalDim.id, {
              point1: { x: originalDim.point1.x, y: originalDim.point1.y + dy },
              offset: originalDim.offset + dx,
            });
          } else {
            // Aligned: di chuyển point1 theo hướng song song, offset theo hướng vuông góc
            onDimensionUpdate?.(originalDim.id, {
              point1: {
                x: originalDim.point1.x + dx,
                y: originalDim.point1.y + dy,
              },
            });
          }
        } else if (drawState.gripType === "dimP2") {
          // Di chuyển đầu dim line 2 - thay đổi cả point2 và offset
          if (direction === "horizontal") {
            onDimensionUpdate?.(originalDim.id, {
              point2: { x: originalDim.point2.x + dx, y: originalDim.point2.y },
              offset: originalDim.offset + dy,
            });
          } else if (direction === "vertical") {
            onDimensionUpdate?.(originalDim.id, {
              point2: { x: originalDim.point2.x, y: originalDim.point2.y + dy },
              offset: originalDim.offset + dx,
            });
          } else {
            onDimensionUpdate?.(originalDim.id, {
              point2: {
                x: originalDim.point2.x + dx,
                y: originalDim.point2.y + dy,
              },
            });
          }
        } else if (drawState.gripType === "text") {
          // Di chuyển text - chỉ thay đổi offset
          // Offset luôn theo hướng chuột di chuyển (vuông góc với dim line)
          const midX = (originalDim.point1.x + originalDim.point2.x) / 2;
          const midY = (originalDim.point1.y + originalDim.point2.y) / 2;

          if (direction === "horizontal") {
            // Horizontal dim line nằm ngang → offset theo Y
            // Kéo lên (worldY tăng) → dim lên màn hình
            // worldToScreen đảo Y, calcDimensionLinePoints dùng midY + offset
            // Để grip đi đâu dim theo đó: offset = worldPos.y - midY
            const newOffset = worldPos.y - midY;
            onDimensionUpdate?.(originalDim.id, { offset: newOffset });
          } else if (direction === "vertical") {
            // Vertical dim line nằm dọc → offset theo X
            // Kéo phải (worldX tăng) → offset dương → dim sang phải
            // NHƯNG: grip ở vị trí dim line, nên kéo về đâu thì dim line theo đó
            const newOffset = worldPos.x - midX;
            onDimensionUpdate?.(originalDim.id, { offset: newOffset });
          } else {
            // Aligned - dim line song song với đoạn, đi qua vị trí chuột
            // Phải khớp với calcDimensionLinePoints: perpX = -dy/length, perpY = dx/length
            const dimDx = originalDim.point2.x - originalDim.point1.x;
            const dimDy = originalDim.point2.y - originalDim.point1.y;
            const lengthSq = dimDx * dimDx + dimDy * dimDy;
            if (lengthSq > 0) {
              const length = Math.sqrt(lengthSq);
              const perpX = -dimDy / length;
              const perpY = dimDx / length;
              // Offset = projection của (mouse - p1) lên perp vector
              const newOffset =
                (worldPos.x - originalDim.point1.x) * perpX +
                (worldPos.y - originalDim.point1.y) * perpY;
              onDimensionUpdate?.(originalDim.id, { offset: newOffset });
            }
          }
        }
        return;
      }

      if (activeTool === ToolMode.SELECT && drawState.mode === "idle") {
        // Check grip hover first for selected dimensions
        let foundGrip: DimensionGrip | null = null;
        for (const dimId of selectedDimensionIds) {
          const dim = dimensions.find((d) => d.id === dimId);
          if (dim) {
            const grip = hitTestDimensionGrip(dim, worldPos, hitTolerance * 2);
            if (grip) {
              foundGrip = grip;
              break;
            }
          }
        }
        setHoveredGrip(foundGrip);

        // Check dimension hover
        const hoveredDim = dimensions.find((dim) =>
          hitTestDimension(dim, worldPos, hitTolerance)
        );
        setHoveredDimensionId(hoveredDim?.id || null);

        // Then check entity hover
        const hovered = entities.find((ent) =>
          hitTestEntity(ent, worldPos, hitTolerance)
        );
        setHoveredId(hovered?.id || null);
      }

      // DRA/DDI mode: Highlight circle on hover
      if (
        activeTool === ToolMode.DRAW_DIM_RADIUS &&
        drawState.mode === "idle"
      ) {
        // Find circle near mouse (on edge)
        let foundCircleId: string | null = null;
        for (const entity of entities) {
          if (entity.type === "circle") {
            const center = entity.points[0];
            const radius = entity.points[1].x;
            const distToCenter = Math.sqrt(
              Math.pow(worldPos.x - center.x, 2) +
                Math.pow(worldPos.y - center.y, 2)
            );
            const distToEdge = Math.abs(distToCenter - radius);

            if (distToEdge <= hitTolerance * 2) {
              foundCircleId = entity.id;
              break;
            }
          }
        }
        setHoveredId(foundCircleId);
      }

      // DLI/DAL mode: Highlight line/polyline on hover
      if (
        (activeTool === ToolMode.DRAW_DIM_LINEAR ||
          activeTool === ToolMode.DRAW_DIM_ALIGNED) &&
        drawState.mode === "idle"
      ) {
        // Find line/polyline near mouse
        const hoveredEntity = entities.find((ent) =>
          hitTestEntity(ent, worldPos, hitTolerance)
        );
        setHoveredId(hoveredEntity?.id || null);
      }

      // OFFSET mode: Highlight entity on hover when selecting
      if (
        drawState.mode === "modifyOffset" &&
        "step" in drawState &&
        drawState.step === "selectEntity"
      ) {
        // Find nearest entity within tolerance
        let nearestEntity: CadEntity | null = null;
        let nearestDist = hitTolerance * 2;

        for (const entity of entities) {
          // Check polyline/line segments
          if (entity.type === "line" || entity.type === "polyline") {
            const segmentCount =
              entity.type === "polyline" && entity.closed
                ? entity.points.length // closed polyline: include segment from last to first
                : entity.points.length - 1;
            for (let i = 0; i < segmentCount; i++) {
              const nextIdx = (i + 1) % entity.points.length;
              const pt = nearestPointOnSegment(
                worldPos,
                entity.points[i],
                entity.points[nextIdx]
              );
              const dist = distance(worldPos, pt);
              if (dist < nearestDist) {
                nearestDist = dist;
                nearestEntity = entity;
              }
            }
          }
          // Check circle
          if (entity.type === "circle" && entity.points.length >= 2) {
            const center = entity.points[0];
            const radius = entity.points[1].x;
            const distToCenter = distance(worldPos, center);
            const distToCircle = Math.abs(distToCenter - radius);
            if (distToCircle < nearestDist) {
              nearestDist = distToCircle;
              nearestEntity = entity;
            }
          }
          // Check rect
          if (entity.type === "rect" && entity.points.length >= 2) {
            const [p1, p2] = entity.points;
            const edges: [Point, Point][] = [
              [p1, { x: p2.x, y: p1.y }],
              [{ x: p2.x, y: p1.y }, p2],
              [p2, { x: p1.x, y: p2.y }],
              [{ x: p1.x, y: p2.y }, p1],
            ];
            for (const [a, b] of edges) {
              const pt = nearestPointOnSegment(worldPos, a, b);
              const dist = distance(worldPos, pt);
              if (dist < nearestDist) {
                nearestDist = dist;
                nearestEntity = entity;
              }
            }
          }
        }

        setHoveredId(nearestEntity?.id || null);
      }

      // OFFSET mode selectSide: Calculate and show preview of offset entity
      if (
        drawState.mode === "modifyOffset" &&
        "step" in drawState &&
        drawState.step === "selectSide" &&
        drawState.entityId &&
        drawState.distance !== undefined
      ) {
        const sourceEntity = entities.find((e) => e.id === drawState.entityId);
        if (sourceEntity) {
          const offsetPoints = calculateOffsetPreview(
            sourceEntity,
            drawState.distance,
            worldPos
          );
          if (offsetPoints && offsetPoints.length > 0) {
            setOffsetPreviewEntity({
              type: sourceEntity.type,
              points: offsetPoints,
            });
          } else {
            setOffsetPreviewEntity(null);
          }
        }
      } else if (
        drawState.mode !== "modifyOffset" ||
        ("step" in drawState && drawState.step !== "selectSide")
      ) {
        // Clear preview when not in selectSide step
        if (offsetPreviewEntity) {
          setOffsetPreviewEntity(null);
        }
      }

      // Modify commands preview - show ghost of entities at new position
      if (
        (drawState.mode === "modifyMove" &&
          drawState.step === "selectDestination" &&
          drawState.basePoint) ||
        (drawState.mode === "modifyCopy" &&
          drawState.step === "selectDestination" &&
          drawState.basePoint)
      ) {
        const dx = worldPos.x - drawState.basePoint.x;
        const dy = worldPos.y - drawState.basePoint.y;
        setMovingPreviewDelta({ x: dx, y: dy });
      } else if (
        drawState.mode === "modifyRotate" &&
        drawState.step === "selectAngle" &&
        drawState.basePoint
      ) {
        const angle = Math.atan2(
          worldPos.y - drawState.basePoint.y,
          worldPos.x - drawState.basePoint.x
        );
        const startAngle = drawState.startAngle ?? 0;
        // Store rotation delta as x: angle
        setMovingPreviewDelta({ x: angle - startAngle, y: 0 });
      } else if (
        drawState.mode === "modifyMirror" &&
        drawState.step === "selectSecond" &&
        drawState.firstPoint
      ) {
        // Store mirror line as delta
        setMovingPreviewDelta({
          x: worldPos.x - drawState.firstPoint.x,
          y: worldPos.y - drawState.firstPoint.y,
        });
      } else if (
        drawState.mode === "modifyScale" &&
        drawState.step === "selectScale" &&
        drawState.basePoint
      ) {
        const dist = distance(worldPos, drawState.basePoint);
        // Store scale factor as x
        setMovingPreviewDelta({ x: dist / 100, y: 0 });
      } else if (
        movingPreviewDelta !== null &&
        ![
          "moving",
          "modifyMove",
          "modifyCopy",
          "modifyRotate",
          "modifyMirror",
          "modifyScale",
        ].includes(drawState.mode)
      ) {
        // Clear preview delta when not in modify mode
        setMovingPreviewDelta(null);
      }
    },
    [
      activeTool,
      dimensions,
      drawState,
      effectiveOrtho,
      entities,
      findOsnapPoint,
      gridSpacing,
      hitTolerance,
      isPanning,
      movingPreviewDelta,
      offsetPreviewEntity,
      onMouseMove,
      panStart,
      screenToWorld,
      selectedDimensionIds,
      snapToGrid,
      onDimensionUpdate,
      isControlled,
      commandDrawing.actions, // ĐIỀU KIỆN 1: Command-based drawing
    ]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1) {
        setIsPanning(false);
        return;
      }

      if (drawState.mode === "selecting") {
        // Select entities in box
        const inBox = entities.filter((ent) =>
          entityIntersectsRect(ent, drawState.start, drawState.currentPos)
        );

        // Also select dimensions in box
        const dimsInBox = dimensions.filter((dim) =>
          dimensionIntersectsRect(dim, drawState.start, drawState.currentPos)
        );

        if (inBox.length > 0) {
          selectEntities(
            inBox.map((ent) => ent.id),
            isShiftPressed
          );
        }

        if (dimsInBox.length > 0) {
          const newDimSelection = isShiftPressed
            ? [...selectedDimensionIds, ...dimsInBox.map((d) => d.id)]
            : dimsInBox.map((d) => d.id);
          onDimensionSelect?.(newDimSelection);
        }

        const totalSelected = inBox.length + dimsInBox.length;
        if (totalSelected > 0) {
          onPromptChange?.(
            `Selected ${inBox.length} object(s), ${dimsInBox.length} dimension(s)`
          );
        }

        setDrawState({ mode: "idle" });
        return;
      }

      if (drawState.mode === "moving") {
        // Tính delta di chuyển (use ref to avoid stale closure)
        const currentMousePos = mousePosRef.current;
        const dx = currentMousePos.x - drawState.startPos.x;
        const dy = currentMousePos.y - drawState.startPos.y;
        const movedIds = drawState.entities.map((e) => e.id);

        if (isControlled && onMoveEntities) {
          // Controlled mode: gọi callback để commit qua Commands
          // (preview được xử lý riêng - entities chưa được cập nhật thực sự)
          onMoveEntities(movedIds, dx, dy);
          setMovingPreviewDelta(null); // Reset preview
        } else {
          // Uncontrolled mode: entities đã được cập nhật trong handleMouseMove
          const movedEntities = getSelectedEntities();
          movedEntities.forEach((ent) => onEntityUpdated?.(ent));
        }

        onPromptChange?.(`Moved ${movedIds.length} object(s)`);
        setDrawState({ mode: "idle" });
        return;
      }

      if (drawState.mode === "movingDimension") {
        onPromptChange?.("Dimension offset adjusted");
        setDrawState({ mode: "idle" });
        return;
      }

      if (drawState.mode === "editingDimensionGrip") {
        onPromptChange?.("Dimension updated");
        setDrawState({ mode: "idle" });
        return;
      }
    },
    [
      dimensions,
      drawState,
      entities,
      isShiftPressed,
      selectedDimensionIds,
      selectEntities,
      getSelectedEntities,
      onEntityUpdated,
      onPromptChange,
      onDimensionSelect,
      isControlled,
      onMoveEntities,
    ]
  );

  // ==================== Dynamic Input Handlers ====================

  const handleRectDynamicInput = useCallback(() => {
    const width = parseFloat(dynamicInput.value1);
    const height = parseFloat(dynamicInput.value2);

    if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
      onPromptChange?.("Vui lòng nhập chiều ngang và chiều dọc hợp lệ");
      return;
    }

    // ĐIỀU KIỆN 1: Try command-based drawing first
    if (commandDrawing.actions.handleRectInput(width, height)) {
      setDynamicInput((prev) => ({
        ...prev,
        active: false,
        value1: "",
        value2: "",
      }));
      return;
    }

    // Legacy fallback
    if (drawState.mode === "rect" && drawState.corner1) {
      const corner1 = drawState.corner1;
      const corner2 = {
        x: corner1.x + width,
        y: corner1.y + height,
      };

      const entity: CadEntity = {
        id: `rect-${Date.now()}`,
        type: "rect",
        points: [corner1, corner2],
        color: "#ffffff",
        lineWidth: 1,
        layer: currentLayerId,
      };

      if (onAddEntity) {
        onAddEntity(entity);
      } else {
        setInternalEntities((prev) => [...prev, entity]);
      }

      onPromptChange?.(`Rectangle created: ${width} x ${height} mm`);
      setDrawState({ mode: "idle" });
      setDynamicInput((prev) => ({
        ...prev,
        active: false,
        value1: "",
        value2: "",
      }));
    }
  }, [
    dynamicInput,
    drawState,
    currentLayerId,
    onAddEntity,
    onPromptChange,
    commandDrawing.actions,
  ]);

  const handleCircleDynamicInput = useCallback(
    (isDiameter: boolean) => {
      const inputValue = isDiameter
        ? parseFloat(dynamicInput.value2)
        : parseFloat(dynamicInput.value1);

      if (isNaN(inputValue) || inputValue <= 0) {
        onPromptChange?.(
          `Vui lòng nhập ${isDiameter ? "đường kính" : "bán kính"} hợp lệ`
        );
        return;
      }

      // ĐIỀU KIỆN 1: Try command-based drawing first
      if (commandDrawing.actions.handleCircleInput(inputValue, isDiameter)) {
        setDynamicInput((prev) => ({
          ...prev,
          active: false,
          value1: "",
          value2: "",
        }));
        return;
      }

      // Legacy fallback
      const radius = isDiameter ? inputValue / 2 : inputValue;

      if (drawState.mode === "circle" && drawState.center) {
        const center = drawState.center;

        const entity: CadEntity = {
          id: `circle-${Date.now()}`,
          type: "circle",
          points: [center, { x: radius, y: 0 }], // points[1].x = radius
          color: "#ffffff",
          lineWidth: 1,
          layer: currentLayerId,
        };

        if (onAddEntity) {
          onAddEntity(entity);
        } else {
          setInternalEntities((prev) => [...prev, entity]);
        }

        onPromptChange?.(
          `Circle created: ${isDiameter ? "D" : "R"} = ${inputValue} mm`
        );
        setDrawState({ mode: "idle" });
        setDynamicInput((prev) => ({
          ...prev,
          active: false,
          value1: "",
          value2: "",
        }));
      }
    },
    [
      dynamicInput,
      drawState,
      currentLayerId,
      onAddEntity,
      onPromptChange,
      commandDrawing.actions,
    ]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;

      const canvas = canvasRef.current;
      if (!canvas) {
        setZoom((prev) => Math.max(0.0001, Math.min(100000, prev * delta)));
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Get zoom target point - use snap point if available, otherwise mouse position
      let targetWorld: Point;
      if (snapPoint) {
        targetWorld = snapPoint.point;
      } else {
        // Convert screen to world
        const centerX = canvas.width / 2 + pan.x;
        const centerY = canvas.height / 2 + pan.y;
        targetWorld = {
          x: (screenX - centerX) / zoom,
          y: -(screenY - centerY) / zoom,
        };
      }

      // Calculate new zoom
      const newZoom = Math.max(0.0001, Math.min(100000, zoom * delta));

      // Adjust pan so that targetWorld stays at the same screen position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Screen position of target with old zoom
      const oldScreenX = targetWorld.x * zoom + centerX + pan.x;
      const oldScreenY = -targetWorld.y * zoom + centerY + pan.y;

      // Screen position of target with new zoom (without pan adjustment)
      const newScreenXWithoutPan = targetWorld.x * newZoom + centerX;
      const newScreenYWithoutPan = -targetWorld.y * newZoom + centerY;

      // Calculate new pan to keep target at same screen position
      const newPanX = oldScreenX - newScreenXWithoutPan;
      const newPanY = oldScreenY - newScreenYWithoutPan;

      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    },
    [zoom, pan, snapPoint]
  );

  // ==================== Drawing ====================

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "#1E1E1E";
    ctx.fillRect(0, 0, width, height);

    // Create render context for helper functions
    const renderContext = {
      ctx,
      width,
      height,
      zoom,
      worldToScreen,
    };

    // Grid
    if (showGrid) {
      drawGrid(renderContext);
    }

    // Compute display entities - apply moving preview delta in controlled mode
    const movingEntityIds =
      drawState.mode === "moving"
        ? new Set(drawState.entities.map((e) => e.id))
        : null;

    // Get entity IDs for modify commands preview
    const modifyEntityIds =
      (drawState.mode === "modifyMove" ||
        drawState.mode === "modifyCopy" ||
        drawState.mode === "modifyRotate" ||
        drawState.mode === "modifyMirror" ||
        drawState.mode === "modifyScale") &&
      "entityIds" in drawState
        ? new Set(drawState.entityIds)
        : null;

    const displayEntities =
      isControlled && movingPreviewDelta && movingEntityIds
        ? entities.map((entity) => {
            if (movingEntityIds.has(entity.id)) {
              // Apply preview delta
              return {
                ...entity,
                points: entity.points.map((p) => ({
                  x: p.x + movingPreviewDelta.x,
                  y: p.y + movingPreviewDelta.y,
                })),
              };
            }
            return entity;
          })
        : entities;

    // Draw ghost entities for modify commands
    if (movingPreviewDelta && modifyEntityIds) {
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 1;

      entities.forEach((entity) => {
        if (!modifyEntityIds.has(entity.id)) return;

        let previewPoints = entity.points;
        const basePoint = "basePoint" in drawState ? drawState.basePoint : null;
        const firstPoint =
          "firstPoint" in drawState ? drawState.firstPoint : null;

        if (
          drawState.mode === "modifyMove" ||
          drawState.mode === "modifyCopy"
        ) {
          // Translation preview
          previewPoints = entity.points.map((p) => ({
            x: p.x + movingPreviewDelta.x,
            y: p.y + movingPreviewDelta.y,
          }));
        } else if (drawState.mode === "modifyRotate" && basePoint) {
          // Rotation preview (movingPreviewDelta.x = rotation angle)
          const rotationAngle = movingPreviewDelta.x;
          const cos = Math.cos(rotationAngle);
          const sin = Math.sin(rotationAngle);
          previewPoints = entity.points.map((p) => {
            const dx = p.x - basePoint.x;
            const dy = p.y - basePoint.y;
            return {
              x: basePoint.x + dx * cos - dy * sin,
              y: basePoint.y + dx * sin + dy * cos,
            };
          });
        } else if (drawState.mode === "modifyMirror" && firstPoint) {
          // Mirror preview
          const mirrorAngle = Math.atan2(
            movingPreviewDelta.y,
            movingPreviewDelta.x
          );
          previewPoints = entity.points.map((p) => {
            const dx = p.x - firstPoint.x;
            const dy = p.y - firstPoint.y;
            const cos = Math.cos(-mirrorAngle);
            const sin = Math.sin(-mirrorAngle);
            const rx = dx * cos - dy * sin;
            const ry = dx * sin + dy * cos;
            const my = -ry;
            const cos2 = Math.cos(mirrorAngle);
            const sin2 = Math.sin(mirrorAngle);
            return {
              x: firstPoint.x + rx * cos2 - my * sin2,
              y: firstPoint.y + rx * sin2 + my * cos2,
            };
          });
        } else if (drawState.mode === "modifyScale" && basePoint) {
          // Scale preview (movingPreviewDelta.x = scale factor)
          const scaleFactor = movingPreviewDelta.x;
          previewPoints = entity.points.map((p) => ({
            x: basePoint.x + (p.x - basePoint.x) * scaleFactor,
            y: basePoint.y + (p.y - basePoint.y) * scaleFactor,
          }));
        }

        // Draw preview entity
        if (entity.type === "line" || entity.type === "polyline") {
          if (previewPoints.length >= 2) {
            ctx.beginPath();
            const start = worldToScreen(previewPoints[0].x, previewPoints[0].y);
            ctx.moveTo(start.x, start.y);
            for (let i = 1; i < previewPoints.length; i++) {
              const pt = worldToScreen(previewPoints[i].x, previewPoints[i].y);
              ctx.lineTo(pt.x, pt.y);
            }
            // Close polyline if closed=true
            if (entity.type === "polyline" && entity.closed) {
              ctx.closePath();
            }
            ctx.stroke();
          }
        } else if (entity.type === "rect") {
          const p1 = worldToScreen(previewPoints[0].x, previewPoints[0].y);
          const p2 = worldToScreen(previewPoints[1].x, previewPoints[1].y);
          ctx.strokeRect(
            Math.min(p1.x, p2.x),
            Math.min(p1.y, p2.y),
            Math.abs(p2.x - p1.x),
            Math.abs(p2.y - p1.y)
          );
        } else if (entity.type === "circle") {
          const center = worldToScreen(previewPoints[0].x, previewPoints[0].y);
          const radius = previewPoints[1].x * zoom;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Draw mirror line preview
      if (
        drawState.mode === "modifyMirror" &&
        "firstPoint" in drawState &&
        drawState.firstPoint
      ) {
        const mirrorFirstPoint = drawState.firstPoint;
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        const p1 = worldToScreen(mirrorFirstPoint.x, mirrorFirstPoint.y);
        const p2 = worldToScreen(
          mirrorFirstPoint.x + movingPreviewDelta.x,
          mirrorFirstPoint.y + movingPreviewDelta.y
        );
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // ==================== OFFSET Preview Rendering ====================
    // Draw ghost entity for OFFSET command (similar to COPY)
    if (offsetPreviewEntity && offsetPreviewEntity.points.length > 0) {
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#00ff00"; // Green ghost
      ctx.lineWidth = 2;

      const previewPoints = offsetPreviewEntity.points;

      if (
        offsetPreviewEntity.type === "line" ||
        offsetPreviewEntity.type === "polyline"
      ) {
        if (previewPoints.length >= 2) {
          ctx.beginPath();
          const start = worldToScreen(previewPoints[0].x, previewPoints[0].y);
          ctx.moveTo(start.x, start.y);
          for (let i = 1; i < previewPoints.length; i++) {
            const pt = worldToScreen(previewPoints[i].x, previewPoints[i].y);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }
      } else if (offsetPreviewEntity.type === "rect") {
        const p1 = worldToScreen(previewPoints[0].x, previewPoints[0].y);
        const p2 = worldToScreen(previewPoints[1].x, previewPoints[1].y);
        ctx.strokeRect(
          Math.min(p1.x, p2.x),
          Math.min(p1.y, p2.y),
          Math.abs(p2.x - p1.x),
          Math.abs(p2.y - p1.y)
        );
      } else if (offsetPreviewEntity.type === "circle") {
        const center = worldToScreen(previewPoints[0].x, previewPoints[0].y);
        const radius = previewPoints[1].x * zoom; // radius stored in x
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // Draw entities
    displayEntities.forEach((entity) => {
      // Check layer visibility
      if (entity.layer && layers.length > 0) {
        const entityLayer = layers.find((l) => l.id === entity.layer);
        if (entityLayer && !entityLayer.visible) {
          return; // Skip hidden layers
        }
      }

      // Check entity visibility
      if (entity.visible === false) {
        return;
      }

      const isSelected = selectedIds.includes(entity.id);
      const isHovered = hoveredId === entity.id;

      // === RESOLVE STYLE FROM LAYER (ByLayer) or Entity (Custom) ===
      const entityLayer = layers.find((l) => l.id === entity.layer);

      // Check if entity uses ByLayer mode (inherits from layer)
      // useLayerStyle: true = ByLayer, false = Custom (entity's own style)
      // Default to true for backward compatibility with old entities
      const shouldUseLayerStyle = entity.useLayerStyle !== false;

      // Stroke color
      const resolvedStroke = shouldUseLayerStyle
        ? entityLayer?.color || entity.color || "#FFFFFF"
        : entity.color || "#FFFFFF";

      // Line weight
      const resolvedLineWeight = shouldUseLayerStyle
        ? entityLayer?.lineWeight || entity.lineWidth || 1
        : entity.lineWidth || 1;

      // Line type
      const resolvedLineType = shouldUseLayerStyle
        ? entityLayer?.lineType?.toLowerCase() || entity.strokeStyle || "solid"
        : entity.strokeStyle || "solid";

      // Fill color
      const resolvedFillColor = shouldUseLayerStyle
        ? entityLayer?.fillColor || entity.fillColor || null
        : entity.fillColor || null;

      // Opacity - ensure number type
      const resolvedOpacity: number = shouldUseLayerStyle
        ? entityLayer?.opacity ?? entity.fillOpacity ?? 1
        : entity.fillOpacity ?? 1;

      if (isSelected) {
        ctx.strokeStyle = "#00bfff";
        ctx.lineWidth = resolvedLineWeight + 1;
      } else if (isHovered) {
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = resolvedLineWeight + 0.5;
      } else {
        ctx.strokeStyle = resolvedStroke;
        ctx.lineWidth = resolvedLineWeight;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Apply line type (dash pattern) - resolved from layer or entity
      const lineType = resolvedLineType;
      if (lineType === "dashed") {
        ctx.setLineDash([8, 4]);
      } else if (lineType === "dotted") {
        ctx.setLineDash([2, 4]);
      } else if (lineType === "dashdot") {
        ctx.setLineDash([8, 4, 2, 4]);
      } else {
        ctx.setLineDash([]); // solid/continuous
      }

      if (entity.type === "line" || entity.type === "polyline") {
        if (entity.points.length >= 2) {
          ctx.beginPath();
          const start = worldToScreen(entity.points[0].x, entity.points[0].y);
          ctx.moveTo(start.x, start.y);
          for (let i = 1; i < entity.points.length; i++) {
            const pt = worldToScreen(entity.points[i].x, entity.points[i].y);
            ctx.lineTo(pt.x, pt.y);
          }
          // Close polyline if closed=true (AutoCAD-style)
          if (entity.type === "polyline" && entity.closed) {
            ctx.closePath();

            // Fill closed polyline - use resolved layer style
            if (resolvedFillColor) {
              ctx.save();
              ctx.globalAlpha = resolvedOpacity;
              ctx.fillStyle = resolvedFillColor;
              ctx.fill();
              ctx.restore();
            }
          }
          ctx.stroke();
        }
      } else if (entity.type === "rect") {
        const p1 = worldToScreen(entity.points[0].x, entity.points[0].y);
        const p2 = worldToScreen(entity.points[1].x, entity.points[1].y);
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);

        // Fill first (behind stroke) - use resolved layer style
        if (resolvedFillColor) {
          ctx.save();
          ctx.globalAlpha = resolvedOpacity;
          ctx.fillStyle = resolvedFillColor;
          ctx.fillRect(x, y, w, h);
          ctx.restore();
        }

        ctx.strokeRect(x, y, w, h);
      } else if (entity.type === "circle") {
        const center = worldToScreen(entity.points[0].x, entity.points[0].y);
        const radius = entity.points[1].x * zoom;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

        // Fill first (behind stroke) - use resolved layer style
        if (resolvedFillColor) {
          ctx.save();
          ctx.globalAlpha = resolvedOpacity;
          ctx.fillStyle = resolvedFillColor;
          ctx.fill();
          ctx.restore();
        }

        ctx.stroke();
      } else if (entity.type === "arc") {
        // Arc entity rendering
        const center = worldToScreen(entity.points[0].x, entity.points[0].y);
        const radius = entity.points[1].x * zoom;
        const startAngle = entity.startAngle ?? 0;
        const endAngle = entity.endAngle ?? Math.PI * 2;
        ctx.beginPath();
        // Note: Canvas arc goes clockwise, CAD usually counter-clockwise
        ctx.arc(center.x, center.y, radius, -startAngle, -endAngle, true);
        ctx.stroke();
      } else if (entity.type === "ellipse") {
        // Ellipse entity rendering
        const center = worldToScreen(entity.points[0].x, entity.points[0].y);
        const radiusX = (entity.radiusX ?? 50) * zoom;
        const radiusY = (entity.radiusY ?? 25) * zoom;
        const rotation = entity.rotation ?? 0;
        ctx.beginPath();
        ctx.ellipse(
          center.x,
          center.y,
          radiusX,
          radiusY,
          -rotation,
          0,
          Math.PI * 2
        );

        // Fill first (behind stroke) - use resolved layer style
        if (resolvedFillColor) {
          ctx.save();
          ctx.globalAlpha = resolvedOpacity;
          ctx.fillStyle = resolvedFillColor;
          ctx.fill();
          ctx.restore();
        }

        ctx.stroke();
      } else if (entity.type === "text") {
        // Text entity rendering with rotation, scale, and multiline support
        const pos = worldToScreen(entity.points[0].x, entity.points[0].y);
        const baseFontSize = (entity.fontSize ?? 12) * zoom;
        const scale = entity.textScale ?? 1;
        const rotation = entity.textRotation ?? 0;
        const fontSize = baseFontSize * scale;
        const lineHeight = fontSize * 1.2; // 1.2 line height multiplier

        ctx.save();

        // Apply transformations
        ctx.translate(pos.x, pos.y);
        ctx.rotate(-rotation); // Negative because canvas Y is inverted

        // Set text properties
        ctx.font = `${fontSize}px ${entity.fontFamily ?? "Arial"}`;
        ctx.fillStyle = entity.color ?? "#ffffff";
        ctx.textBaseline = "bottom";

        // Draw multiline text
        const textContent = entity.text ?? "";
        const lines = textContent.split("\n");
        lines.forEach((line, index) => {
          // Each line is drawn below the previous one
          // First line at y=0, second at y=lineHeight, etc.
          ctx.fillText(line, 0, index * lineHeight);
        });

        ctx.restore();

        // Draw hover overlay for text (bounding box when hovering)
        if (isHovered && !isSelected && entity.text) {
          ctx.save();
          ctx.strokeStyle = "#ffff00";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          const hoverFontSize = fontSize;
          ctx.font = `${hoverFontSize}px ${entity.fontFamily ?? "Arial"}`;

          // Calculate bounding box for multiline text
          const hoverLines = entity.text.split("\n");
          let maxWidth = 0;
          hoverLines.forEach((line) => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxWidth) maxWidth = metrics.width;
          });
          const textWidth = maxWidth;
          const textHeight = hoverLines.length * lineHeight;

          // Apply same transforms for correct position
          const hoverPos = worldToScreen(
            entity.points[0].x,
            entity.points[0].y
          );
          ctx.strokeRect(
            hoverPos.x - 2,
            hoverPos.y - hoverFontSize - 2,
            textWidth + 4,
            textHeight + 4
          );
          ctx.restore();
        }
      }

      // Selection handles - draw grips based on entity type
      if (isSelected) {
        ctx.fillStyle = "#00bfff";

        if (entity.type === "line" || entity.type === "polyline") {
          // Draw grips at actual points for line/polyline
          entity.points.forEach((pt) => {
            const screenPt = worldToScreen(pt.x, pt.y);
            ctx.fillRect(screenPt.x - 4, screenPt.y - 4, 8, 8);
          });
        } else if (entity.type === "circle") {
          // Draw grip at center
          const center = worldToScreen(entity.points[0].x, entity.points[0].y);
          ctx.fillRect(center.x - 4, center.y - 4, 8, 8);
          // Draw grips at quadrant points (top, bottom, left, right)
          const radius = entity.points[1].x;
          const quadrants = [
            { x: entity.points[0].x, y: entity.points[0].y - radius }, // top
            { x: entity.points[0].x, y: entity.points[0].y + radius }, // bottom
            { x: entity.points[0].x - radius, y: entity.points[0].y }, // left
            { x: entity.points[0].x + radius, y: entity.points[0].y }, // right
          ];
          quadrants.forEach((q) => {
            const screenQ = worldToScreen(q.x, q.y);
            ctx.fillRect(screenQ.x - 4, screenQ.y - 4, 8, 8);
          });
        } else if (entity.type === "rect") {
          // Draw grips at 4 corners for rectangle
          const bounds = entityBounds(entity);
          const corners = [
            worldToScreen(bounds.min.x, bounds.min.y),
            worldToScreen(bounds.max.x, bounds.min.y),
            worldToScreen(bounds.min.x, bounds.max.y),
            worldToScreen(bounds.max.x, bounds.max.y),
          ];
          corners.forEach((c) => ctx.fillRect(c.x - 4, c.y - 4, 8, 8));
        } else if (entity.type === "text") {
          // Draw grip at text position
          if (entity.points.length > 0) {
            const textPos = worldToScreen(
              entity.points[0].x,
              entity.points[0].y
            );
            ctx.fillRect(textPos.x - 4, textPos.y - 4, 8, 8);

            // Draw bounding box for text
            if (entity.text) {
              ctx.save();
              ctx.strokeStyle = "#00bfff";
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              const fontSize = (entity.fontSize ?? 12) * zoom;
              ctx.font = `${fontSize}px ${entity.fontFamily ?? "Arial"}`;
              const metrics = ctx.measureText(entity.text);
              const textWidth = metrics.width;
              const textHeight = fontSize;
              ctx.strokeRect(
                textPos.x - 2,
                textPos.y - textHeight - 2,
                textWidth + 4,
                textHeight + 4
              );
              ctx.restore();
            }
          }
        }
      }
    });

    // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Preview ====================
    // Render preview entity from useCommandDrawing hook
    const cmdPreview = commandDrawing.state.previewEntity;
    if (cmdPreview && cmdPreview.points.length > 0) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;

      if (cmdPreview.type === "line" || cmdPreview.type === "polyline") {
        ctx.beginPath();
        const start = worldToScreen(
          cmdPreview.points[0].x,
          cmdPreview.points[0].y
        );
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < cmdPreview.points.length; i++) {
          const pt = worldToScreen(
            cmdPreview.points[i].x,
            cmdPreview.points[i].y
          );
          ctx.lineTo(pt.x, pt.y);
        }
        // Close polyline if closed=true
        if (cmdPreview.type === "polyline" && cmdPreview.closed) {
          ctx.closePath();
        }
        ctx.stroke();

        // Draw points
        cmdPreview.points.forEach((pt) => {
          const screen = worldToScreen(pt.x, pt.y);
          ctx.fillStyle = "#00ff00";
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // ==================== Dynamic Dimension Display for LINE ====================
        // Show length and angle while drawing
        if (cmdPreview.points.length >= 2) {
          const lastIdx = cmdPreview.points.length - 1;
          const prevPt = cmdPreview.points[lastIdx - 1];
          const currPt = cmdPreview.points[lastIdx];
          const prevScreen = worldToScreen(prevPt.x, prevPt.y);
          const currScreen = worldToScreen(currPt.x, currPt.y);

          const lineDist = distance(prevPt, currPt);
          if (lineDist > 0.1) {
            const midX = (prevScreen.x + currScreen.x) / 2;
            const midY = (prevScreen.y + currScreen.y) / 2;
            const screenAngle = Math.atan2(
              currScreen.y - prevScreen.y,
              currScreen.x - prevScreen.x
            );

            // Calculate world angle (0° = right, counter-clockwise positive)
            const worldAngle = Math.atan2(
              currPt.y - prevPt.y,
              currPt.x - prevPt.x
            );
            let angleDeg = (worldAngle * 180) / Math.PI;
            if (angleDeg < 0) angleDeg += 360;

            // Offset text perpendicular to line
            const offsetDist = 12;
            const textX = midX - Math.sin(screenAngle) * offsetDist;
            const textY = midY + Math.cos(screenAngle) * offsetDist;

            ctx.save();
            ctx.setLineDash([]);
            ctx.font = "bold 11px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Draw distance text
            const distText = lineDist.toFixed(2);
            const distMetrics = ctx.measureText(distText);
            ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
            ctx.fillRect(
              textX - distMetrics.width / 2 - 3,
              textY - 7,
              distMetrics.width + 6,
              14
            );
            ctx.fillStyle = "#4fd1c5";
            ctx.fillText(distText, textX, textY);

            // Draw angle text (near the end point)
            const angleText = angleDeg.toFixed(1) + "°";
            const angleMetrics = ctx.measureText(angleText);
            const angleX = currScreen.x + 20;
            const angleY = currScreen.y - 15;
            ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
            ctx.fillRect(
              angleX - angleMetrics.width / 2 - 3,
              angleY - 7,
              angleMetrics.width + 6,
              14
            );
            ctx.fillStyle = "#ffa500"; // Orange for angle
            ctx.fillText(angleText, angleX, angleY);

            ctx.restore();
          }
        }
      } else if (cmdPreview.type === "rect" && cmdPreview.points.length >= 2) {
        const c1 = worldToScreen(
          cmdPreview.points[0].x,
          cmdPreview.points[0].y
        );
        const c2 = worldToScreen(
          cmdPreview.points[1].x,
          cmdPreview.points[1].y
        );
        ctx.strokeRect(
          Math.min(c1.x, c2.x),
          Math.min(c1.y, c2.y),
          Math.abs(c2.x - c1.x),
          Math.abs(c2.y - c1.y)
        );

        // ==================== Dynamic Dimension Display for RECT ====================
        const rectWidth = Math.abs(
          cmdPreview.points[1].x - cmdPreview.points[0].x
        );
        const rectHeight = Math.abs(
          cmdPreview.points[1].y - cmdPreview.points[0].y
        );

        ctx.save();
        ctx.setLineDash([]);
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Width dimension (on top edge)
        const widthText = rectWidth.toFixed(2);
        const widthMetrics = ctx.measureText(widthText);
        const widthX = (c1.x + c2.x) / 2;
        const widthY = Math.min(c1.y, c2.y) - 15;
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          widthX - widthMetrics.width / 2 - 3,
          widthY - 7,
          widthMetrics.width + 6,
          14
        );
        ctx.fillStyle = "#4fd1c5";
        ctx.fillText(widthText, widthX, widthY);

        // Height dimension (on right edge)
        const heightText = rectHeight.toFixed(2);
        const heightMetrics = ctx.measureText(heightText);
        const heightX = Math.max(c1.x, c2.x) + 20;
        const heightY = (c1.y + c2.y) / 2;
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          heightX - heightMetrics.width / 2 - 3,
          heightY - 7,
          heightMetrics.width + 6,
          14
        );
        ctx.fillStyle = "#ffa500";
        ctx.fillText(heightText, heightX, heightY);

        ctx.restore();
      } else if (
        cmdPreview.type === "circle" &&
        cmdPreview.points.length >= 2
      ) {
        const centerScreen = worldToScreen(
          cmdPreview.points[0].x,
          cmdPreview.points[0].y
        );
        const radiusWorld = cmdPreview.points[1].x; // Radius stored in point.x
        const radiusScreen = radiusWorld * zoom;
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radiusScreen, 0, Math.PI * 2);
        ctx.stroke();
        // Center point
        ctx.fillStyle = "#00ff00";
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // ==================== Dynamic Dimension Display for CIRCLE ====================
        ctx.save();
        ctx.setLineDash([]);
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Radius dimension
        const radiusText = "R: " + radiusWorld.toFixed(2);
        const radiusMetrics = ctx.measureText(radiusText);
        const radiusTextX = centerScreen.x + radiusScreen + 20;
        const radiusTextY = centerScreen.y;
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          radiusTextX - radiusMetrics.width / 2 - 3,
          radiusTextY - 7,
          radiusMetrics.width + 6,
          14
        );
        ctx.fillStyle = "#4fd1c5";
        ctx.fillText(radiusText, radiusTextX, radiusTextY);

        ctx.restore();
      } else if (cmdPreview.type === "arc" && cmdPreview.points.length >= 2) {
        const centerScreen = worldToScreen(
          cmdPreview.points[0].x,
          cmdPreview.points[0].y
        );
        const radiusWorld = cmdPreview.points[1].x;
        const radiusScreen = radiusWorld * zoom;
        const startAngle = cmdPreview.startAngle ?? 0;
        const endAngle = cmdPreview.endAngle ?? Math.PI * 2;
        ctx.beginPath();
        // Note: canvas arc is clockwise, CAD is counter-clockwise
        ctx.arc(
          centerScreen.x,
          centerScreen.y,
          radiusScreen,
          -startAngle,
          -endAngle,
          true
        );
        ctx.stroke();
      } else if (
        cmdPreview.type === "ellipse" &&
        cmdPreview.points.length >= 1
      ) {
        const centerScreen = worldToScreen(
          cmdPreview.points[0].x,
          cmdPreview.points[0].y
        );
        const radiusX = (cmdPreview.radiusX ?? 0) * zoom;
        const radiusY = (cmdPreview.radiusY ?? 0) * zoom;
        const rotation = cmdPreview.rotation ?? 0;
        ctx.beginPath();
        ctx.ellipse(
          centerScreen.x,
          centerScreen.y,
          radiusX,
          radiusY,
          -rotation,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (cmdPreview.type === "text" && cmdPreview.text) {
        const posScreen = worldToScreen(
          cmdPreview.points[0].x,
          cmdPreview.points[0].y
        );
        ctx.font = `${(cmdPreview.fontSize ?? 12) * zoom}px ${
          cmdPreview.fontFamily ?? "Arial"
        }`;
        ctx.fillStyle = cmdPreview.color;
        ctx.textBaseline = "bottom";
        ctx.fillText(cmdPreview.text, posScreen.x, posScreen.y);
      }
      ctx.restore();
    }

    // Legacy drawing preview (will be gradually replaced by command-based preview above)
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;

    if (drawState.mode === "line" && drawState.points.length > 0) {
      ctx.setLineDash([]);
      if (drawState.points.length >= 2) {
        ctx.beginPath();
        const start = worldToScreen(
          drawState.points[0].x,
          drawState.points[0].y
        );
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < drawState.points.length; i++) {
          const pt = worldToScreen(
            drawState.points[i].x,
            drawState.points[i].y
          );
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      ctx.setLineDash([5, 5]);
      const lastPt = drawState.points[drawState.points.length - 1];
      const lastScreen = worldToScreen(lastPt.x, lastPt.y);
      const mouseScreen = worldToScreen(mousePos.x, mousePos.y);
      ctx.beginPath();
      ctx.moveTo(lastScreen.x, lastScreen.y);
      ctx.lineTo(mouseScreen.x, mouseScreen.y);
      ctx.stroke();

      // Draw dimension on the line preview
      const lineDist = distance(lastPt, mousePos);
      if (lineDist > 0.1) {
        const midX = (lastScreen.x + mouseScreen.x) / 2;
        const midY = (lastScreen.y + mouseScreen.y) / 2;
        const angle = Math.atan2(
          mouseScreen.y - lastScreen.y,
          mouseScreen.x - lastScreen.x
        );
        // Offset text perpendicular to line
        const offsetDist = 12;
        const textX = midX - Math.sin(angle) * offsetDist;
        const textY = midY + Math.cos(angle) * offsetDist;

        // Calculate angle in degrees (0° = right, counter-clockwise positive)
        const angleWorld = Math.atan2(
          mousePos.y - lastPt.y,
          mousePos.x - lastPt.x
        );
        let angleDeg = (angleWorld * 180) / Math.PI;
        // Normalize to 0-360
        if (angleDeg < 0) angleDeg += 360;

        ctx.save();
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw distance text
        const distText = lineDist.toFixed(2);
        const distMetrics = ctx.measureText(distText);
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          textX - distMetrics.width / 2 - 3,
          textY - 7,
          distMetrics.width + 6,
          14
        );
        ctx.fillStyle = "#4fd1c5";
        ctx.fillText(distText, textX, textY);

        // Draw angle text (near the mouse cursor)
        const angleText = angleDeg.toFixed(1) + "°";
        const angleMetrics = ctx.measureText(angleText);
        const angleX = mouseScreen.x + 20;
        const angleY = mouseScreen.y - 15;
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          angleX - angleMetrics.width / 2 - 3,
          angleY - 7,
          angleMetrics.width + 6,
          14
        );
        ctx.fillStyle = "#ffa500"; // Orange for angle
        ctx.fillText(angleText, angleX, angleY);

        ctx.restore();
      }

      drawState.points.forEach((pt) => {
        const screen = worldToScreen(pt.x, pt.y);
        ctx.fillStyle = "#00ff00";
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (drawState.mode === "rect" && drawState.corner1) {
      const c1 = worldToScreen(drawState.corner1.x, drawState.corner1.y);
      const c2 = worldToScreen(mousePos.x, mousePos.y);
      ctx.strokeRect(
        Math.min(c1.x, c2.x),
        Math.min(c1.y, c2.y),
        Math.abs(c2.x - c1.x),
        Math.abs(c2.y - c1.y)
      );

      // Draw dimensions on rect preview
      const rectW = Math.abs(mousePos.x - drawState.corner1.x);
      const rectH = Math.abs(mousePos.y - drawState.corner1.y);
      if (rectW > 0.1 || rectH > 0.1) {
        ctx.save();
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Width dimension (top edge)
        const widthText = rectW.toFixed(2);
        const widthX = (c1.x + c2.x) / 2;
        const widthY = Math.min(c1.y, c2.y) - 12;
        const wMetrics = ctx.measureText(widthText);
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          widthX - wMetrics.width / 2 - 3,
          widthY - 7,
          wMetrics.width + 6,
          14
        );
        ctx.fillStyle = "#4fd1c5";
        ctx.fillText(widthText, widthX, widthY);

        // Height dimension (right edge)
        const heightText = rectH.toFixed(2);
        const heightX = Math.max(c1.x, c2.x) + 12;
        const heightY = (c1.y + c2.y) / 2;
        const hMetrics = ctx.measureText(heightText);
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          heightX - hMetrics.width / 2 - 3,
          heightY - 7,
          hMetrics.width + 6,
          14
        );
        ctx.fillStyle = "#4fd1c5";
        ctx.fillText(heightText, heightX, heightY);

        ctx.restore();
      }
    }

    if (drawState.mode === "circle" && drawState.center) {
      const centerScreen = worldToScreen(
        drawState.center.x,
        drawState.center.y
      );
      const radiusWorld = distance(drawState.center, mousePos);
      const radiusScreen = radiusWorld * zoom;
      ctx.beginPath();
      ctx.arc(centerScreen.x, centerScreen.y, radiusScreen, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(centerScreen.x, centerScreen.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw radius dimension on circle preview
      if (radiusWorld > 0.1) {
        const mouseScreen = worldToScreen(mousePos.x, mousePos.y);
        // Draw radius line
        ctx.setLineDash([]);
        ctx.strokeStyle = "#4fd1c5";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerScreen.x, centerScreen.y);
        ctx.lineTo(mouseScreen.x, mouseScreen.y);
        ctx.stroke();

        // Draw radius text at midpoint
        const midX = (centerScreen.x + mouseScreen.x) / 2;
        const midY = (centerScreen.y + mouseScreen.y) / 2;
        const angle = Math.atan2(
          mouseScreen.y - centerScreen.y,
          mouseScreen.x - centerScreen.x
        );
        const offsetDist = 12;
        const textX = midX - Math.sin(angle) * offsetDist;
        const textY = midY + Math.cos(angle) * offsetDist;

        ctx.save();
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const text = "R " + radiusWorld.toFixed(2);
        const metrics = ctx.measureText(text);
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          textX - metrics.width / 2 - 3,
          textY - 7,
          metrics.width + 6,
          14
        );
        ctx.fillStyle = "#4fd1c5";
        ctx.fillText(text, textX, textY);
        ctx.restore();

        // Reset stroke style
        ctx.strokeStyle = "#00ff00";
        ctx.setLineDash([5, 5]);
      }
    }

    // Arc preview
    if (
      drawState.mode === "arc" &&
      drawState.points &&
      drawState.points.length > 0
    ) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;

      if (drawState.points.length === 1) {
        // Draw line from first point to mouse
        const p1 = worldToScreen(drawState.points[0].x, drawState.points[0].y);
        const mouse = worldToScreen(mousePos.x, mousePos.y);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();

        // Draw first point
        ctx.fillStyle = "#00ff00";
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (drawState.points.length === 2) {
        // Preview arc with 3 points
        const p1 = drawState.points[0];
        const p2 = drawState.points[1];
        const p3 = mousePos;

        // Calculate center from 3 points
        const ax = p1.x,
          ay = p1.y;
        const bx = p2.x,
          by = p2.y;
        const cx = p3.x,
          cy = p3.y;

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) > 0.0001) {
          const ux =
            ((ax * ax + ay * ay) * (by - cy) +
              (bx * bx + by * by) * (cy - ay) +
              (cx * cx + cy * cy) * (ay - by)) /
            d;
          const uy =
            ((ax * ax + ay * ay) * (cx - bx) +
              (bx * bx + by * by) * (ax - cx) +
              (cx * cx + cy * cy) * (bx - ax)) /
            d;
          const center = worldToScreen(ux, uy);
          const radius =
            Math.sqrt((ax - ux) * (ax - ux) + (ay - uy) * (ay - uy)) * zoom;

          const startAngle = Math.atan2(p1.y - uy, p1.x - ux);
          const endAngle = Math.atan2(p3.y - uy, p3.x - ux);

          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, -startAngle, -endAngle, true);
          ctx.stroke();
        }

        // Draw points
        ctx.fillStyle = "#00ff00";
        drawState.points.forEach((pt) => {
          const screen = worldToScreen(pt.x, pt.y);
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    // Ellipse preview
    if (drawState.mode === "ellipse" && drawState.center) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;

      const center = worldToScreen(drawState.center.x, drawState.center.y);

      if (!drawState.axisEnd) {
        // First axis - draw line from center to mouse
        const mouse = worldToScreen(mousePos.x, mousePos.y);
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();

        // Draw ellipse preview with equal radii
        const radiusX = distance(drawState.center, mousePos) * zoom;
        ctx.beginPath();
        ctx.ellipse(
          center.x,
          center.y,
          radiusX,
          radiusX * 0.5,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (drawState.radiusX && drawState.axisEnd) {
        // Second axis - draw full ellipse preview
        const radiusX = drawState.radiusX * zoom;
        const dx = drawState.axisEnd.x - drawState.center.x;
        const dy = drawState.axisEnd.y - drawState.center.y;
        const rotation = Math.atan2(dy, dx);

        // Calculate radiusY from mouse
        const mouseVec = {
          x: mousePos.x - drawState.center.x,
          y: mousePos.y - drawState.center.y,
        };
        const perpAngle = rotation + Math.PI / 2;
        const radiusY =
          Math.abs(
            mouseVec.x * Math.cos(perpAngle) + mouseVec.y * Math.sin(perpAngle)
          ) * zoom;

        ctx.beginPath();
        ctx.ellipse(
          center.x,
          center.y,
          radiusX,
          radiusY,
          -rotation,
          0,
          Math.PI * 2
        );
        ctx.stroke();

        // Draw axis lines
        const axisEnd = worldToScreen(drawState.axisEnd.x, drawState.axisEnd.y);
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(axisEnd.x, axisEnd.y);
        ctx.stroke();
      }

      // Draw center point
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Selection box
    if (drawState.mode === "selecting") {
      drawSelectionBox(renderContext, drawState.start, drawState.currentPos);
    }

    ctx.setLineDash([]);

    // Render dimensions using utility function
    const dimensionContext = {
      ctx,
      worldToScreen,
      selectedDimensionIds,
      hoveredDimensionId,
      hoveredGrip,
    };
    renderAllDimensions(
      dimensionContext,
      dimensions,
      previewDimension,
      previewDimensions || []
    );

    // Crosshair
    const mouseScreen = worldToScreen(mousePos.x, mousePos.y);
    drawCrosshair(ctx, mouseScreen, width, height);

    // OSNAP marker
    if (snapPoint) {
      const snapScreen = worldToScreen(snapPoint.point.x, snapPoint.point.y);
      drawOsnapMarker(
        ctx,
        snapScreen,
        snapPoint.type as import("./utils").OsnapType
      );

      // OSNAP tooltip
      ctx.fillStyle = "#00ff00";
      ctx.font = "10px Arial";
      ctx.textAlign = "left";
      ctx.fillText(snapPoint.type, snapScreen.x + 12, snapScreen.y - 4);
    } else if (snapToGrid) {
      ctx.fillStyle = "#ff0";
      ctx.beginPath();
      ctx.arc(mouseScreen.x, mouseScreen.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [
    entities,
    selectedIds,
    hoveredId,
    hoveredDimensionId,
    hoveredGrip,
    selectedDimensionIds,
    drawState,
    mousePos,
    showGrid,
    worldToScreen,
    zoom,
    snapToGrid,
    snapPoint,
    layers,
    dimensions,
    previewDimension,
    previewDimensions,
    isControlled,
    movingPreviewDelta,
    offsetPreviewEntity,
    commandDrawing.state.previewEntity, // ĐIỀU KIỆN 1: Command-based preview
  ]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid Overlay - SVG grid (optional, can use canvas grid instead) */}
      {/* Note: Currently grid is rendered on canvas. This SVG overlay can replace it if needed */}
      {/* <GridOverlay
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        pan={pan}
        zoom={zoom}
        gridSpacing={10}
        visible={showGrid}
      /> */}

      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          cursor: getCursor(
            activeTool,
            drawState,
            hoveredId,
            hoveredDimensionId,
            hoveredGrip
          ),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setMousePos({ x: 0, y: 0 });
          setHoveredId(null);
        }}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* HUD Overlay - coordinates, status indicators */}
      <HudOverlay
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        mouseWorld={mousePos}
        zoom={zoom}
        orthoEnabled={effectiveOrtho}
        snapEnabled={snapToGrid}
        selectedCount={selectedIds.length}
      />

      {/* OSNAP Overlay - snap point markers */}
      {snapPoint && (
        <OsnapOverlay
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          osnapPoint={{
            x: snapPoint.point.x,
            y: snapPoint.point.y,
            type: snapPoint.type.toLowerCase() as
              | "endpoint"
              | "midpoint"
              | "center"
              | "intersection"
              | "perpendicular"
              | "nearest"
              | "quadrant",
          }}
          pan={pan}
          zoom={zoom}
        />
      )}

      {/* Dynamic Input Overlay - Extracted Component */}
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
        onFinishDrawing={() => {
          // ĐIỀU KIỆN 1: Try command-based drawing first
          if (
            commandDrawing.actions.isCommandTool() &&
            commandDrawing.actions.handleEnter()
          ) {
            return;
          }
        }}
        onLineInput={(length, angle) => {
          // ĐIỀU KIỆN 1: Handle LINE input from DynamicInputOverlay
          commandDrawing.actions.handleLineInput(length, angle);
        }}
        onPolygonInput={(sides, radius) => {
          // ĐIỀU KIỆN 1: Handle POLYGON input from DynamicInputOverlay
          commandDrawing.actions.handlePolygonSidesRadius(sides, radius);
        }}
        polygonSides={commandDrawing.actions.getPolygonSides()}
        pointsCount={commandDrawing.state.points.length}
        lastPoint={
          commandDrawing.state.points.length > 0
            ? commandDrawing.state.points[
                commandDrawing.state.points.length - 1
              ]
            : null
        }
      />

      {/* Debug log for text input - more detailed */}
      {/* Text Input Overlay - Command-based */}
      {commandDrawing.actions.isWaitingForTextInput() &&
        (() => {
          // Use first point from state, or fallback to a default position
          const textPos = commandDrawing.state.points[0] || { x: 0, y: 0 };
          // Calculate screen position
          const centerX = canvasDimensions.width / 2 + pan.x;
          const centerY = canvasDimensions.height / 2 + pan.y;
          const textScreenX = centerX + textPos.x * zoom;
          const textScreenY = centerY - textPos.y * zoom;

          const handleSaveText = () => {
            // Ignore blur events if textarea was never properly focused
            if (!textInputMountedRef.current) {
              return;
            }

            if (textInput.value.trim()) {
              textInputMountedRef.current = false; // Reset for next time
              commandDrawing.actions.handleTextInput(textInput.value);
              setTextInput({
                active: false,
                value: "",
                position: { x: 0, y: 0 },
              });
            }
            // If empty text, do nothing - keep textarea open
            // User can press Escape to cancel or type text then click outside
          };

          return (
            <div
              style={{
                position: "absolute",
                left: textScreenX,
                top: textScreenY - 60,
                zIndex: 1001,
              }}
            >
              <textarea
                ref={textInputRef}
                value={textInput.value}
                onChange={(e) =>
                  setTextInput((prev) => ({ ...prev, value: e.target.value }))
                }
                onFocus={() => {
                  // Mark as properly focused - now blur events are valid
                  textInputMountedRef.current = true;
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Escape") {
                    commandDrawing.actions.handleEscape();
                    setTextInput({
                      active: false,
                      value: "",
                      position: { x: 0, y: 0 },
                    });
                    textInputMountedRef.current = false; // Reset for next time
                  }
                  // Enter now inserts newline (default behavior)
                }}
                onBlur={handleSaveText}
                autoFocus
                rows={3}
                style={{
                  padding: "8px",
                  fontSize: 14,
                  border: "2px solid #4a90d9",
                  borderRadius: 4,
                  background: "#1a1a2e",
                  color: "#fff",
                  outline: "none",
                  minWidth: 200,
                  minHeight: 60,
                  resize: "both",
                  fontFamily: "Arial, sans-serif",
                }}
                placeholder="Enter text... (click outside to save)"
              />
            </div>
          );
        })()}

      {/* Text Input Overlay - Legacy mode */}
      {textInput.active &&
        !commandDrawing.actions.isWaitingForTextInput() &&
        (() => {
          // Calculate screen position using canvasDimensions state (avoid ref access during render)
          const centerX = canvasDimensions.width / 2 + pan.x;
          const centerY = canvasDimensions.height / 2 + pan.y;
          const textScreenX = centerX + textInput.position.x * zoom;
          const textScreenY = centerY - textInput.position.y * zoom;

          // Helper function to save text (used by both onBlur and Escape handling)
          const handleSaveText = () => {
            // Ignore blur events if textarea was never properly focused
            if (!textInputMountedRef.current) {
              return;
            }

            textInputMountedRef.current = false; // Reset for next time

            if (!textInput.value.trim()) {
              // Empty text - just cancel
              setTextInput({
                active: false,
                value: "",
                position: { x: 0, y: 0 },
                editingId: undefined,
              });
              setDrawState({ mode: "idle" });
              onPromptChange?.("TEXT: Cancelled");
              return;
            }

            if (textInput.editingId) {
              // Update existing text entity
              if (isControlled) {
                // Controlled mode: Find the entity and create updated version
                const entityToUpdate = entities.find(
                  (e) => e.id === textInput.editingId
                );
                if (entityToUpdate && onAddEntity) {
                  // Create a new entity with updated text
                  const updatedEntity = {
                    ...entityToUpdate,
                    text: textInput.value,
                  };
                  // Remove old entity and add updated one
                  if (onDeleteEntities) {
                    onDeleteEntities([textInput.editingId]);
                  }
                  onAddEntity(updatedEntity);
                  onEntityUpdated?.(updatedEntity);
                }
              } else {
                // Uncontrolled mode: update internal state directly
                // Save to history first
                if (!useExternalHistory) {
                  saveToHistory(internalEntities);
                }

                setInternalEntities((prev) => {
                  const newEntities = prev.map((entity) => {
                    if (entity.id === textInput.editingId) {
                      const updated = {
                        ...entity,
                        text: textInput.value,
                      };
                      // Notify parent about the update
                      setTimeout(() => {
                        onEntityUpdated?.(updated);
                        onEntitiesChange?.(newEntities);
                      }, 0);
                      return updated;
                    }
                    return entity;
                  });
                  return newEntities;
                });
              }
              onPromptChange?.("TEXT: Text updated");
            } else {
              // Create new text entity
              addEntity({
                id: `text-${Date.now()}`,
                type: "text",
                points: [textInput.position],
                text: textInput.value,
                fontSize: 24,
                fontFamily: "Arial",
                color: "#ffffff",
                lineWidth: 1,
                layer: currentLayerId,
              });
              onPromptChange?.("TEXT: Text created");
            }

            setTextInput({
              active: false,
              value: "",
              position: { x: 0, y: 0 },
              editingId: undefined,
            });
            setDrawState({ mode: "idle" });
          };

          return (
            <div
              style={{
                position: "absolute",
                left: textScreenX,
                top: textScreenY - 60,
                zIndex: 1001,
              }}
            >
              <textarea
                ref={textInputRef}
                value={textInput.value}
                onChange={(e) =>
                  setTextInput((prev) => ({ ...prev, value: e.target.value }))
                }
                onFocus={() => {
                  // Mark as properly focused - now blur events are valid
                  textInputMountedRef.current = true;
                }}
                onKeyDown={(e) => {
                  // Stop propagation to prevent global handler from capturing Space, etc.
                  e.stopPropagation();

                  // Escape to cancel
                  if (e.key === "Escape") {
                    setTextInput({
                      active: false,
                      value: "",
                      position: { x: 0, y: 0 },
                    });
                    setDrawState({ mode: "idle" });
                    onPromptChange?.("TEXT: Cancelled");
                    textInputMountedRef.current = false; // Reset for next time
                  }
                  // Enter now inserts newline (default behavior for textarea)
                }}
                onBlur={handleSaveText}
                rows={3}
                style={{
                  padding: "8px",
                  fontSize: 14,
                  border: "2px solid #4a90d9",
                  borderRadius: 4,
                  background: "#1a1a2e",
                  color: "#fff",
                  outline: "none",
                  minWidth: 200,
                  minHeight: 60,
                  resize: "both",
                  fontFamily: "Arial, sans-serif",
                }}
                placeholder="Enter text... (click outside to save)"
              />
            </div>
          );
        })()}

      {/* Text Scale Input Overlay - for scaling selected text entities */}
      {textScaleInput.active && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1002,
            background: "#1a1a2e",
            border: "2px solid #4a90d9",
            borderRadius: 8,
            padding: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ color: "#fff", marginBottom: 8, fontSize: 14 }}>
            Scale {textScaleInput.targetIds.length} text(s)
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              ref={textScaleInputRef}
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={textScaleInput.value}
              onChange={(e) =>
                setTextScaleInput((prev) => ({
                  ...prev,
                  value: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const scaleFactor = parseFloat(textScaleInput.value);
                  if (!isNaN(scaleFactor) && scaleFactor > 0) {
                    // Apply scale to selected text entities
                    if (isControlled) {
                      // Controlled mode
                      textScaleInput.targetIds.forEach((id) => {
                        const entity = entities.find((ent) => ent.id === id);
                        if (entity && entity.type === "text") {
                          const currentFontSize = entity.fontSize || 14;
                          const newFontSize = currentFontSize * scaleFactor;
                          const updatedEntity = {
                            ...entity,
                            fontSize: newFontSize,
                          };
                          // Update via callbacks
                          if (onDeleteEntities && onAddEntity) {
                            onDeleteEntities([id]);
                            onAddEntity(updatedEntity);
                          }
                          onEntityUpdated?.(updatedEntity);
                        }
                      });
                    } else {
                      // Uncontrolled mode
                      if (!useExternalHistory) {
                        saveToHistory(internalEntities);
                      }
                      setInternalEntities((prev) =>
                        prev.map((entity) => {
                          if (
                            textScaleInput.targetIds.includes(entity.id) &&
                            entity.type === "text"
                          ) {
                            const currentFontSize = entity.fontSize || 14;
                            const newFontSize = currentFontSize * scaleFactor;
                            const updated = {
                              ...entity,
                              fontSize: newFontSize,
                            };
                            onEntityUpdated?.(updated);
                            return updated;
                          }
                          return entity;
                        })
                      );
                    }
                    onPromptChange?.(
                      `Scaled ${textScaleInput.targetIds.length} text(s) by ${scaleFactor}x`
                    );
                  }
                  setTextScaleInput({
                    active: false,
                    value: "",
                    targetIds: [],
                  });
                } else if (e.key === "Escape") {
                  setTextScaleInput({
                    active: false,
                    value: "",
                    targetIds: [],
                  });
                  onPromptChange?.("Scale cancelled");
                }
                e.stopPropagation();
              }}
              onBlur={() => {
                // Close scale input when clicking outside
                setTextScaleInput({
                  active: false,
                  value: "",
                  targetIds: [],
                });
                onPromptChange?.("Scale cancelled");
              }}
              autoFocus
              style={{
                padding: "6px 10px",
                fontSize: 14,
                border: "1px solid #4a90d9",
                borderRadius: 4,
                background: "#2a2a3e",
                color: "#fff",
                outline: "none",
                width: 80,
              }}
            />
            <span style={{ color: "#888", fontSize: 12 }}>
              × (Enter to apply)
            </span>
          </div>
          <div style={{ color: "#666", fontSize: 11, marginTop: 8 }}>
            Esc to cancel
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Helpers ====================
// These helper functions have been extracted to ./utils/toolHelpers.ts
// Imported at the top of the file from "./utils"

export default CadDrawingCanvas;
