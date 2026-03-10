/**
 * mouseHandler.types.ts — Shared types for useMouseHandlers hook
 *
 * STEP-5.23 extraction from useMouseHandlers.ts to reduce file size.
 * Contains the MouseHandlerParams interface used by the hook and all
 * extracted handler modules.
 */

import type {
  Dispatch,
  SetStateAction,
  RefObject,
  MutableRefObject,
} from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import type { DimensionEntity } from "../../../core/dimensions/DimensionManager";
import type { DrawingState, DimensionGrip } from "../canvas.types";
import type { Point, CadEntity } from "../types/CadEntity";
import type { TextHitTestContext } from "../utils";
import type { CommandDrawingActions } from "../handlers/useCommandDrawing";

export interface MouseHandlerParams {
  // Refs
  canvasRef: RefObject<HTMLCanvasElement | null>;
  lastScreenPosRef: MutableRefObject<Point>;
  mousePosRef: MutableRefObject<Point>;
  moveCopyAngleRef: MutableRefObject<number>;
  textInputRef: RefObject<HTMLTextAreaElement | null>;
  textInputOriginalValueRef: MutableRefObject<string>;
  // Tool state
  activeTool: ToolMode;
  orthoMode: boolean;
  isShiftPressed: boolean;
  effectiveOrtho: boolean;
  // Drawing state
  drawState: DrawingState;
  setDrawState: Dispatch<SetStateAction<DrawingState>>;
  // Mouse/viewport
  mousePos: Point;
  setMousePos: Dispatch<SetStateAction<Point>>;
  zoom: number;
  pan: Point;
  setPan: Dispatch<SetStateAction<Point>>;
  isPanning: boolean;
  setIsPanning: Dispatch<SetStateAction<boolean>>;
  panStart: Point;
  setPanStart: Dispatch<SetStateAction<Point>>;
  // Grid/snap
  snapToGrid: boolean;
  gridSpacing: number;
  osnapEnabled?: boolean;
  // Entities
  entities: CadEntity[];
  selectedIds: string[];
  isControlled: boolean;
  setInternalEntities: Dispatch<SetStateAction<CadEntity[]>>;
  // Dimensions
  dimensions: DimensionEntity[];
  selectedDimensionIds: string[];
  showDimensions?: boolean;
  // Hover
  hoveredId: string | null;
  setHoveredId: Dispatch<SetStateAction<string | null>>;
  setHoveredDimensionId: Dispatch<SetStateAction<string | null>>;
  setHoveredGrip: Dispatch<SetStateAction<DimensionGrip | null>>;
  // Snap point
  setSnapPoint: Dispatch<SetStateAction<{ point: Point; type: string } | null>>;
  // Moving preview
  movingPreviewDelta: Point | null;
  setMovingPreviewDelta: Dispatch<SetStateAction<Point | null>>;
  // Offset preview
  offsetPreviewEntity: { type: CadEntity["type"]; points: Point[] } | null;
  setOffsetPreviewEntity: Dispatch<
    SetStateAction<{ type: CadEntity["type"]; points: Point[] } | null>
  >;
  // Selection
  selectEntities: (ids: string[], additive?: boolean) => void;
  getSelectedEntities: () => CadEntity[];
  // Entity operations
  saveHistoryBeforeMove: () => void;
  // Dynamic input
  setDynamicInput: Dispatch<
    SetStateAction<{
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
    }>
  >;
  // Text input
  setTextInput: Dispatch<
    SetStateAction<{
      active: boolean;
      value: string;
      position: Point;
      editingId?: string;
    }>
  >;
  // Rotate angle input
  setRotateAngleInput: Dispatch<
    SetStateAction<{ active: boolean; value: string }>
  >;
  // Place/paste mode
  placeMode: boolean;
  pasteMode: boolean;
  // OMNAP
  findOsnapPoint: (
    worldPos: Point,
    fromPoint?: Point,
  ) => { point: Point; type: string } | null;
  // Coordinate transforms
  screenToWorld: (screenX: number, screenY: number) => Point;
  // Callbacks
  onPromptChange?: (prompt: string) => void;
  onMouseMove?: (worldPos: Point, screenPos: Point) => void;
  onEntityUpdated?: (entity: CadEntity) => void;
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
      entity?: { id: string; type: string; points?: Point[] };
      pointIndex?: number;
    } | null,
  ) => void;
  onDimensionSelect?: (ids: string[]) => void;
  onDimensionUpdate?: (id: string, updates: Partial<DimensionEntity>) => void;
  onPlaceClick?: (worldPos: Point) => void;
  onPasteClick?: (worldPos: Point) => void;
  onMoveEntities?: (ids: string[], dx: number, dy: number) => void;
  onDoorMove?: (doorIds: string[], dx: number, dy: number) => void;
  // QDIM
  qdimStep: number;
  onQdimConfirm?: () => void;
  // Modify command callbacks
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
  // Command drawing
  commandDrawingActions: CommandDrawingActions;
  commandDrawingIsActive: boolean;
  commandDrawingPoints: Point[];
  // Text hit test
  textHitTestContext: TextHitTestContext | undefined;
  // Text input mounted ref
  textInputMountedRef: MutableRefObject<boolean>;
  // Doors
  selectedDoorIds: Set<string>;
}
