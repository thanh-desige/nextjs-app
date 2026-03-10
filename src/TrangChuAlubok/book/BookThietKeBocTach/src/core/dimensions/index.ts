/**
 * Dimensions Module Export
 *
 * STEP-5.10: DimensionManager split into 5 files:
 * - dimension.types.ts: Type definitions + DEFAULT_DIMENSION_STYLE
 * - dimensionGeometry.ts: Pure math/geometry functions
 * - DimensionRenderer.ts: Canvas2D rendering
 * - QdimService.ts: Quick Dimension subsystem
 * - DimensionManager.ts: Thin facade (class + singleton)
 */

// DimensionManager re-exports all types for backward compatibility
export * from "./DimensionManager";

// Direct exports for consumers that want specific modules
export * from "./dimension.types";
export {
  calculateDistance,
  calculateHorizontalDistance,
  calculateVerticalDistance,
  calculateLineIntersection,
  autoDetectLinearDirection,
  detectDirectionFromOffset,
  calculateOffsetFromMouse,
  calculateAngle,
  formatValue,
} from "./dimensionGeometry";
export { renderDimension } from "./DimensionRenderer";
export {
  extractPointsFromEntities,
  sortPointsByDirection,
  detectQdimDirection,
  createQdimContinuous,
  createQdimBaseline,
  createQdimStaggered,
} from "./QdimService";
export type { QdimEntity, CreateLinearDimensionFn } from "./QdimService";
