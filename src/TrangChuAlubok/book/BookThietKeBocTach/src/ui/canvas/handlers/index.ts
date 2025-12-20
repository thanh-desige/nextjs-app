/**
 * Handlers module index
 * Re-exports all handler components and utilities
 */

export { PointerBindings } from "./PointerBindings";
export { KeyboardBindings } from "./KeyboardBindings";
export { DndBindings } from "./DndBindings";

// Mouse handler helpers
export {
  calculateArcFrom3Points,
  calculateEllipseRadiusY,
  createLineEntity,
  createPolylineEntity,
  createRectEntity,
  createCircleEntity,
  createArcEntity,
  createEllipseEntity,
  createTextEntity,
  isWindowSelection,
  getSelectionBounds,
  translatePoints,
  rotatePointsAroundCenter,
  mirrorPointsAcrossLine,
  scalePointsFromBase,
} from "./mouseHandlerHelpers";

// ==================== NEW: Event Handlers (ĐIỀU KIỆN 1) ====================
// These are pure functions for handling events - separated from component logic

// Drawing Event Handler
export {
  generateLinePreview,
  generateRectPreview,
  generateCirclePreview,
  generateArcPreview,
  generateEllipsePreview,
  generateTextPreview,
  calculateArcFrom3Points as calcArc3Points, // renamed to avoid conflict
  calculateEllipseRadiusY as calcEllipseRY, // renamed to avoid conflict
  createArcEntityData,
  createEllipseEntityData,
  getInitialDrawingState,
  canFinishDrawing,
} from "./DrawingEventHandler";
export type {
  DrawingEventState,
  PreviewData,
  PreviewLineData,
  PreviewRectData,
  PreviewCircleData,
  PreviewArcData,
  PreviewEllipseData,
  PreviewTextData,
} from "./DrawingEventHandler";

// Selection Event Handler
export {
  findEntityAtPoint,
  findEntitiesInBox,
  getSelectionMode,
  getEntityGrips,
  findGripAtPoint,
  getSelectionBoxStyle,
  calculateMoveDelta,
  applyOrthoToMove,
  snapMoveToGrid,
  toggleEntityInSelection,
  addEntityToSelection,
  addEntitiesToSelection,
  replaceSelection,
} from "./SelectionEventHandler";
export type {
  SelectionState,
  GripInfo,
  SelectionResult,
} from "./SelectionEventHandler";

// Dimension Event Handler
export {
  findDimensionAtPoint,
  findDimensionGripAtPoint,
  calculateDimensionOffset,
  calculateAlignedDimensionAngle,
  calculateLinearMeasurement,
  calculateAlignedMeasurement,
  detectDimensionType,
  isPointNearCircleEdge,
  extractQdimPoints,
  removeDuplicatePoints,
  sortQdimPoints,
  generateQdimPairs,
  formatDimensionText,
  getDimensionTextPosition,
  toggleDimensionInSelection,
  isPointInDimensionTextBox,
} from "./DimensionEventHandler";
export type {
  DimensionGripInfo,
  DimensionHitResult,
} from "./DimensionEventHandler";

// Drawing Handler Hook
export { useDrawingHandler } from "./useDrawingHandler";
export type {
  DrawingHandlerConfig,
  DrawingHandlerState,
  DrawingHandlerActions,
  UseDrawingHandlerReturn,
} from "./useDrawingHandler";

// Canvas Drawing Integration Hook
export { useCanvasDrawing } from "./useCanvasDrawing";
export type {
  CanvasDrawingConfig,
  CanvasDrawingState,
  CanvasDrawingHandlers,
  UseCanvasDrawingReturn,
} from "./useCanvasDrawing";

// Command Drawing Hook - Main hook for ĐIỀU KIỆN 1 compliance
export { useCommandDrawing } from "./useCommandDrawing";
export type {
  CommandDrawingConfig,
  CommandDrawingState,
  CommandDrawingActions,
  UseCommandDrawingReturn,
} from "./useCommandDrawing";

// Types
export type { PointerBindingsProps } from "./PointerBindings";
export type { KeyboardBindingsProps, KeyModifiers } from "./KeyboardBindings";
export type { DndBindingsProps, DropData } from "./DndBindings";
export type { DrawState, EntityCreationResult } from "./mouseHandlerHelpers";
