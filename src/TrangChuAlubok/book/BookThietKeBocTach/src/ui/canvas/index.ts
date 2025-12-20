/**
 * Canvas module - main exports
 * Provides all components, utilities and types for CAD canvas
 */

// Main canvas components
export { CadDrawingCanvas } from "./CadDrawingCanvas";
export { CadDrawingCanvasV2 } from "./CadDrawingCanvasV2"; // NEW: Command-based canvas
export { default as CadCanvas } from "./CadCanvas";
export { View } from "./View";

// Overlay components
export {
  OverlayRoot,
  GridOverlay,
  OsnapOverlay,
  PreviewOverlay,
  HudOverlay,
} from "./overlay";

// Renderer modules
export {
  renderEntity,
  renderEntities,
  renderSelectionGrips,
  renderDimension,
  renderDimensions,
  renderText,
  renderMultilineText,
} from "./renderers";

// Handler components
export { PointerBindings, KeyboardBindings, DndBindings } from "./handlers";

// NEW: Event handlers (ĐIỀU KIỆN 1 compliant)
export {
  // Drawing handler hook
  useDrawingHandler,
  // Drawing event helpers
  generateLinePreview,
  generateRectPreview,
  generateCirclePreview,
  generateArcPreview,
  generateEllipsePreview,
  // Selection event helpers
  findEntityAtPoint,
  findEntitiesInBox,
  getSelectionMode,
  findGripAtPoint,
  // Dimension event helpers
  findDimensionAtPoint,
  findDimensionGripAtPoint,
} from "./handlers";

// Utility functions and types
export * from "./utils";
