/**
 * canvas.types.ts — Canonical type definitions for CadDrawingCanvas
 *
 * STEP-4.1: Extracted from CadDrawingCanvas.tsx to reduce file size
 * and provide a single source of truth for canvas-related types.
 *
 * Re-exported by CadDrawingCanvas for backward compatibility.
 */

import type { Point, CadEntity } from "./types/CadEntity";
import type { DimensionEntity } from "../../core/dimensions/DimensionManager";
import type { ToolMode } from "../../core/engine/EngineState";
import type { TextRenderSettings } from "./utils";

// Re-export for convenience
export type { Point, CadEntity };

// ==================== DrawingState ====================

/**
 * DrawingState union type — represents all possible drawing/editing states
 * in the CadDrawingCanvas component.
 */
export type DrawingState =
  | { mode: "idle" }
  | { mode: "line"; points: Point[] }
  | { mode: "rect"; corner1: Point | null }
  | { mode: "circle"; center: Point | null }
  | { mode: "arc"; points: Point[] }
  | { mode: "ellipse"; center: Point | null; axisEnd?: Point; radiusX?: number }
  | { mode: "text"; position: Point; inputActive: boolean }
  | {
      mode: "selecting";
      start: Point;
      currentPos: Point;
      // For "command first, select later" workflow: store the pending modify mode to restore after selection
      pendingModifyMode?:
        | "modifyMove"
        | "modifyCopy"
        | "modifyRotate"
        | "modifyMirror"
        | "modifyScale";
    }
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
      step: "selectObjects" | "selectBase" | "selectDestination";
      basePoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
      doorIds?: string[];
      displacementInput?: string; // Input for @dx,dy or distance<angle
    }
  | {
      mode: "modifyCopy";
      step: "selectObjects" | "selectBase" | "selectDestination";
      basePoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
      doorIds?: string[];
      displacementInput?: string; // Input for @dx,dy or distance<angle
    }
  | {
      mode: "modifyRotate";
      step: "selectObjects" | "selectBase" | "selectReference" | "selectAngle";
      basePoint?: Point;
      referencePoint?: Point; // Reference point for base angle calculation
      entityIds: string[];
      dimensionIds: string[];
      doorIds?: string[];
      startAngle?: number; // Calculated from basePoint to referencePoint
    }
  | {
      mode: "modifyMirror";
      step: "selectObjects" | "selectFirst" | "selectSecond";
      firstPoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
      doorIds?: string[];
    }
  | {
      mode: "modifyScale";
      step: "selectObjects" | "selectBase" | "selectScale";
      basePoint?: Point;
      entityIds: string[];
      dimensionIds: string[];
      doorIds?: string[];
    }
  | {
      mode: "modifyOffset";
      step: "enterDistance" | "selectEntity" | "selectSide";
      distance?: number;
      entityId?: string;
    }
  | {
      mode: "modifyTrim";
      step: "selectEntity"; // Click on entity to trim
    }
  | {
      mode: "modifyExtend";
      step: "selectEntity"; // Click on entity to extend
    }
  | {
      mode: "modifyFillet";
      step: "selectFirst" | "selectSecond"; // Click on 2 lines to fillet
      firstEntityId?: string;
      firstClickPoint?: Point; // Click point on first line
      radius?: number;
    }
  | {
      mode: "modifyBoundary";
      step: "pickPoint"; // Click inside closed region
    };

// ==================== Layer ====================

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

// ==================== Dimension Grip ====================

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

// ==================== CadDrawingCanvas Props (STEP-5: moved from CadDrawingCanvas.tsx) ====================

export interface CadDrawingCanvasProps {
  activeTool: ToolMode;
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSpacing?: number;
  orthoMode?: boolean;
  osnapEnabled?: boolean;
  osnapModes?: Record<string, boolean>;
  layers?: LayerInfo[];
  currentLayerId?: string;

  // ==================== CONTROLLED ENTITIES (ĐIỀU KIỆN 1) ====================
  controlledEntities?: CadEntity[];
  controlledSelectedIds?: string[];
  useExternalHistory?: boolean;
  onAddEntity?: (entity: CadEntity) => void;
  onDeleteEntities?: (ids: string[]) => void;
  onMoveEntities?: (ids: string[], dx: number, dy: number) => void;
  onSelectEntities?: (ids: string[], additive: boolean) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  // ==================== END CONTROLLED ENTITIES ====================

  // Dimension support
  showDimensions?: boolean;
  dimensions?: DimensionEntity[];
  previewDimension?: DimensionEntity | null;
  previewDimensions?: DimensionEntity[];
  selectedDimensionIds?: string[];
  dimScale?: number;
  dimRounding?: boolean;
  dimShowUnit?: boolean;
  dimTextColor?: string;
  dimLineColor?: string;
  dimLineweight?: number;
  dimExtensionGap?: boolean;
  dimArrowStyle?: "closed" | "open" | "tick" | "dot" | "none";
  canvasBgColor?: string;
  osnapApertureSize?: number;
  zoomFactor?: number;
  onDimensionClick?: (
    worldPos: Point,
    circleInfo?: { center: Point; radius: number; entityId: string },
    lineInfo?: { point1: Point; point2: Point; entityId: string },
    arcInfo?: {
      center: Point;
      radius: number;
      startAngle: number;
      endAngle: number;
      entityId: string;
    },
    snapResult?: {
      point: Point;
      type: string;
      entity?: {
        id: string;
        type: string;
        points?: { x: number; y: number }[];
      };
      pointIndex?: number;
    } | null,
  ) => void;
  onDimensionSelect?: (ids: string[]) => void;
  onDimensionDelete?: (id: string) => void;
  onDimensionUpdate?: (id: string, updates: Partial<DimensionEntity>) => void;
  onDimensionCopy?: (ids: string[]) => void;
  qdimStep?: number;
  onQdimSelectionConfirm?: (entities: CadEntity[]) => void;
  onQdimConfirm?: () => void;
  dimensionToolStep?: number;
  onToggleAutoSelectMode?: () => void;
  onRepeatLastCommand?: () => void;
  placeMode?: boolean;
  onPlaceClick?: (worldPos: Point) => void;
  offsetDistance?: number;
  triggerUndo?: number;
  triggerRedo?: number;
  triggerDelete?: number;
  triggerClearSelection?: number;
  textScaleTrigger?: number;
  triggerZoomFit?: number;
  currentStrokeStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  onEntityCreated?: (entity: CadEntity) => void;
  onEntityUpdated?: (entity: CadEntity) => void;
  onEntityDeleted?: (id: string) => void;
  onSelectionChanged?: (ids: string[]) => void;
  onEntitiesChange?: (entities: CadEntity[]) => void;
  onMouseMove?: (worldPos: Point, screenPos: Point) => void;
  onPromptChange?: (prompt: string) => void;
  onStepChange?: (step: number) => void;
  onDrawingStateChange?: (isDrawing: boolean) => void;

  // ==================== Modify Command Callbacks (ĐIỀU KIỆN 1) ====================
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
  onModifyRotateComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    angle: number,
  ) => void;
  onModifyMirrorComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    point1: Point,
    point2: Point,
  ) => void;
  onModifyScaleComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    scaleFactor: number,
  ) => void;
  onModifyOffsetComplete?: (
    entityId: string,
    distance: number,
    throughPoint: Point,
  ) => void;
  onTrimComplete?: (
    entityId: string,
    pickPoint: Point,
    cuttingEdgeIds: string[],
  ) => void;
  onExtendComplete?: (
    entityId: string,
    pickPoint: Point,
    boundaryEdgeIds: string[],
  ) => void;
  onFilletComplete?: (
    entityId1: string,
    entityId2: string,
    radius: number,
    clickPoint1: Point,
    clickPoint2: Point,
  ) => void;
  onBoundaryComplete?: (pickPoint: Point) => void;

  // ==================== Command Input ====================
  commandInput?: string;
  onCommandInputConsumed?: () => void;

  // ==================== Door Drag & Drop ====================
  onDoorDrop?: (doorData: {
    variant: string;
    systemId: string;
    displayName: string;
    defaultSize: { width: number; height: number };
    position: Point;
    templateId?: string;
  }) => void;
  onDoorDoubleClick?: (doorId: string) => void;
  onDoorMove?: (doorIds: string[], dx: number, dy: number) => void;
  onClearDoorSelection?: () => void;

  // ==================== Paste Mode (Ctrl+V) ====================
  pasteMode?: boolean;
  pastePreviewEntities?: CadEntity[];
  onPasteClick?: (worldPos: Point) => void;

  // ==================== Text Settings (View Option) ====================
  textSettings?: TextRenderSettings;
}
