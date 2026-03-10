/**
 * keyboardHandler.types.ts - Type definitions for useKeyboardHandler
 *
 * STEP-5.21 extraction from useKeyboardHandler.ts
 * Contains the KeyboardHandlerParams interface that defines all inputs
 * for the keyboard handler hook.
 */

import type {
  Dispatch,
  SetStateAction,
  RefObject,
} from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import type { DimensionEntity } from "../../../core/dimensions/DimensionManager";
import type { DrawingState } from "../canvas.types";
import type { Point, CadEntity } from "../types/CadEntity";

// ==================== Params Interface ====================

export interface KeyboardHandlerParams {
  // Tool state
  activeTool: ToolMode;
  currentLayerId: string;
  orthoMode: boolean;
  effectiveOrtho: boolean;
  // Drawing state
  drawState: DrawingState;
  setDrawState: Dispatch<SetStateAction<DrawingState>>;
  // Entities
  entities: CadEntity[];
  selectedIds: string[];
  // Dimensions
  dimensions: DimensionEntity[];
  selectedDimensionIds: string[];
  dimensionClipboard: DimensionEntity[];
  setDimensionClipboard: Dispatch<SetStateAction<DimensionEntity[]>>;
  // Viewport
  zoom: number;
  mousePos: Point;
  // Shift key tracking
  setIsShiftPressed: (v: boolean) => void;
  // Selection
  clearSelection: () => void;
  selectEntities: (ids: string[], additive?: boolean) => void;
  // Entity operations
  addEntity: (entity: CadEntity) => void;
  deleteSelectedEntities: () => void;
  copySelectedToClipboard: () => void;
  pasteFromClipboard: () => void;
  duplicateSelected: () => void;
  moveSelectedEntities: (dx: number, dy: number) => void;
  // History
  undo: () => void;
  redo: () => void;
  // Modify callbacks
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
  setMovingPreviewDelta: Dispatch<SetStateAction<Point | null>>;
  // Dynamic input
  dynamicInput: {
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
  };
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
  // Text scale input
  textScaleInput: { active: boolean; value: string; targetIds: string[] };
  setTextScaleInput: Dispatch<
    SetStateAction<{ active: boolean; value: string; targetIds: string[] }>
  >;
  textScaleInputRef: RefObject<HTMLInputElement | null>;
  // Doors
  selectedDoorIds: Set<string>;
  clearDoorSelection: () => void;
  // Callbacks
  onPromptChange?: (prompt: string) => void;
  onDimensionDelete?: (id: string) => void;
  onDimensionSelect?: (ids: string[]) => void;
  onDimensionUpdate?: (id: string, updates: Partial<DimensionEntity>) => void;
  onDimensionCopy?: (ids: string[]) => void;
  onQdimSelectionConfirm?: (entities: CadEntity[]) => void;
  dimensionToolStep: number;
  qdimStep: number;
  onToggleAutoSelectMode?: () => void;
  onRepeatLastCommand?: () => void;
  onPasteClick?: (worldPos: Point) => void;
  // Style
  currentStrokeStyle: string;
  // Command drawing actions
  commandDrawingActions: {
    handlePolygonOption: (opt: string) => boolean;
    handleTextOption: (opt: string) => boolean;
    isWaitingForTextInput: () => boolean;
    isCommandTool: () => boolean;
    handleEscape: () => boolean;
    handleEnter: () => boolean;
  };
  // Ortho
  toggleOrtho: () => void;
}
