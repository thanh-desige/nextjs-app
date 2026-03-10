/**
 * Canvas utilities index
 * Exports all canvas utility functions and types
 */

// Geometry utilities
export {
  distance,
  nearestPointOnSegment,
  perpendicularPointOnLine,
  lineSegmentIntersection,
  lineCircleIntersection,
  circleCircleIntersection,
  snapToGridPoint,
  applyOrtho,
  applyOrthoAngle,
} from "./geometry";
export type { Point } from "./geometry";

// Entity utilities
export {
  entityBounds,
  entityIntersectsRect,
  hitTestEntity,
  moveEntity,
  copyEntity,
  scaleEntity,
  editTextEntity,
} from "./entityUtils";
export type { CadEntity, TextHitTestContext } from "./entityUtils";

// Dimension utilities
export {
  calcDimensionLinePoints,
  hitTestDimension,
  getDimensionGrips,
  hitTestDimensionGrip,
  dimensionIntersectsRect,
} from "./dimensionUtils";
export type {
  DimensionEntity,
  DimensionStyle,
  DimensionGrip,
  DimensionGripType,
} from "./dimensionUtils";

// OFFSET calculations
export {
  calculateOffsetPreview,
  calculateOffsetLinePreview,
  calculateOffsetRectPreview,
  calculateOffsetCirclePreview,
} from "./offsetCalculations";
export type { OffsetCadEntity } from "./offsetCalculations";

// OSNAP utilities
export { isOsnapModeEnabled, findOsnapPoint } from "./osnapUtils";
export type { OsnapModes, OsnapResult, Layer } from "./osnapUtils";

// Tool helpers
export { getToolType, getToolName, getCursor } from "./toolHelpers";

// Screen <-> World coordinate helpers
export {
  screenToWorld,
  worldToScreen,
  worldDistanceToScreen,
  screenDistanceToWorld,
  getMouseWorldPos,
  isPointInViewport,
  getViewportWorldBounds,
} from "./screenWorld";
export type { ViewportState } from "./screenWorld";

// Viewport math utilities
export {
  clampZoom,
  calculateWheelZoom,
  getAdaptiveGridStep,
  getMinorGridStep,
  zoomToFit,
  zoomAtPoint,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
} from "./viewportMath";

// Cursor utilities
export { getCursorStyle, getCustomCursorUrl } from "./cursor";
export type { CursorStyle, CursorContext } from "./cursor";

// Render helpers
export {
  drawGrid,
  drawPolyline,
  drawRect,
  drawCircle,
  drawGhostEntity,
  drawOsnapMarker,
  drawCrosshair,
  drawSelectionBox,
  drawDimensionText,
  drawGrip,
  translatePoints,
  rotatePoints,
  scalePoints,
  mirrorPoints,
} from "./renderHelpers";
export type { RenderContext, GridOptions, OsnapType } from "./renderHelpers";

// Dimension rendering
export {
  renderDimension,
  renderLinearDimension,
  renderRadiusDiameterDimension,
  renderAllDimensions,
} from "./dimensionRenderer";
export type { DimensionRenderContext } from "./dimensionRenderer";

// Entity rendering
export {
  renderEntity,
  renderLine,
  renderRect,
  renderCircle,
  renderArc,
  renderEllipse,
  renderText,
  renderSelectionGrips,
  renderPreviewEntity,
  getLineDashPattern,
  DEFAULT_TEXT_RENDER_SETTINGS,
} from "./renderEntity";
export type {
  RenderContext as EntityRenderContext,
  EntityRenderOptions,
  TextRenderSettings,
  TextScaleMode as TextRenderScaleMode,
} from "./renderEntity";

// Types
export type { DrawingState, DynamicInputState, TextInputState } from "./types";
