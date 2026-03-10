/**
 * commandDrawing.types.ts - Types for useCommandDrawing hook
 * STEP-5.7: Extracted from useCommandDrawing.ts
 */

import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { ToolMode } from "../../../core/engine/EngineState";
import type { IInteractiveCommand } from "../../../core/commands/Command.types";
import type { CadEngine } from "../../../core/engine/CadEngine";
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

// ==================== Shared Internals for Sub-hooks ====================

/** Style snapshot returned by getSnapshotStyle */
export interface SnapshotStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted" | "dashdot";
  fillColor: string | null;
  opacity: number;
}

/**
 * Shared internal context passed to sub-hooks.
 * Contains refs, state setters, and computed values from the main hook.
 */
export interface CommandDrawingInternals {
  commandRef: MutableRefObject<IInteractiveCommand | null>;
  pointsRef: MutableRefObject<Point[]>;
  onPromptChangeRef: MutableRefObject<
    ((prompt: string) => void) | undefined
  >;
  onEntityAddedRef: MutableRefObject<
    ((entity: CadEntity) => void) | undefined
  >;
  activeTool: ToolMode;
  engine: CadEngine | null;
  currentLayerId: string;
  effectiveLayerId: string | undefined;
  getSnapshotStyle: () => SnapshotStyle;
  setCommand: Dispatch<SetStateAction<IInteractiveCommand | null>>;
  setPoints: Dispatch<SetStateAction<Point[]>>;
  setPreviewEntity: Dispatch<SetStateAction<CadEntity | null>>;
  setPrompt: Dispatch<SetStateAction<string>>;
  /** State-based points (for isWaitingForTextInput re-render) */
  points: Point[];
}
