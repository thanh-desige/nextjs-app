/**
 * Type definitions for CAD canvas
 * Contains DrawingState, CadEntity and other shared types
 */

// ==================== Import from unified source ====================
import type {
  Point as UnifiedPoint,
  CadEntity as UnifiedCadEntity,
} from "../types/CadEntity";

// Re-export for backward compatibility
export type Point = UnifiedPoint;
export type CadEntity = UnifiedCadEntity;

/**
 * Dimension style configuration
 */
export interface DimensionStyle {
  lineColor: string;
  textColor: string;
  arrowSize: number;
  textHeight: number;
  font: string;
  precision: number;
  prefix: string;
  suffix: string;
  unit: string;
  showUnit: boolean;
}

/**
 * Dimension attachment - reference to entity point
 * For Associative Dimensions (AutoCAD-style)
 */
export interface DimensionAttachment {
  /** Entity ID that this dimension point is attached to */
  entityId: string;
  /** Which point on the entity (0 = first point, 1 = second point, etc.) */
  pointIndex: number;
  /** OSNAP type used when attaching (endpoint, midpoint, center, etc.) */
  snapType?:
    | "endpoint"
    | "midpoint"
    | "center"
    | "quadrant"
    | "intersection"
    | "perpendicular"
    | "tangent"
    | "nearest";
}

/**
 * Dimension entity interface
 * Note: dimensionType uses DimensionType from DimensionManager for full compatibility
 *
 * ASSOCIATIVE DIMENSIONS:
 * - attachment1/attachment2 reference entities by ID
 * - When entity moves, dimension auto-updates
 * - point1/point2 are computed from attachments if present
 */
export interface DimensionEntity {
  id: string;
  type: "dimension";
  dimensionType?:
    | "linear"
    | "horizontal"
    | "vertical"
    | "aligned"
    | "angular"
    | "radius"
    | "diameter"
    | "arc"
    | "ordinate"
    | "continue"
    | "baseline"
    | "qdim";
  point1: Point;
  point2: Point;
  point3?: Point; // For angular dimension (third point)
  offset: number;
  value?: number;
  direction?: "horizontal" | "vertical" | "aligned" | "auto";
  style: DimensionStyle;

  // ==================== ASSOCIATIVE DIMENSION ====================
  /** Attachment for point1 - if set, dimension follows this entity */
  attachment1?: DimensionAttachment;
  /** Attachment for point2 - if set, dimension follows this entity */
  attachment2?: DimensionAttachment;
  /** Attachment for point3 (angular dimensions) */
  attachment3?: DimensionAttachment;
  /** Whether dimension is associative (auto-computed from attachments) */
  isAssociative?: boolean;
}

// ==================== STEP-4.1: Re-export from canonical canvas.types.ts ====================
export type {
  DrawingState,
  DimensionGripType,
  DimensionGrip,
  LayerInfo,
} from "../canvas.types";

// CadEntity is now imported from unified source above

/**
 * Dynamic input state for dimension entry
 */
export interface DynamicInputState {
  active: boolean;
  mode: "length" | "width-height" | "radius-diameter";
  value1: string; // length, width, or radius
  value2: string; // height (for rect) or diameter (for circle)
  focusField: 1 | 2; // which field has focus
  screenPos: Point; // position for the input overlay
}

/**
 * Text input state for TEXT tool
 */
export interface TextInputState {
  active: boolean;
  value: string;
  position: Point;
}

/**
 * Layer interface
 */
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

/**
 * OSNAP modes configuration
 */
export interface OsnapModes {
  endpoint: boolean;
  midpoint: boolean;
  center: boolean;
  intersection: boolean;
  perpendicular: boolean;
  nearest: boolean;
}
