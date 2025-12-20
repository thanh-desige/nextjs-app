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
 * Dimension entity interface
 * Note: dimensionType uses DimensionType from DimensionManager for full compatibility
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
  offset: number;
  value?: number;
  direction?: "horizontal" | "vertical" | "aligned" | "auto";
  style: DimensionStyle;
}

/**
 * Dimension grip type
 */
export type DimensionGripType =
  | "point1"
  | "point2"
  | "dimP1"
  | "dimP2"
  | "text";

/**
 * Dimension grip interface
 */
export interface DimensionGrip {
  dimensionId: string;
  type: DimensionGripType;
  position: Point;
}

// CadEntity is now imported from unified source above

/**
 * DrawingState union type - represents all possible drawing states
 */
export type DrawingState =
  | { mode: "idle" }
  | { mode: "line"; points: Point[] }
  | { mode: "rect"; corner1: Point | null }
  | { mode: "circle"; center: Point | null }
  | {
      mode: "arc";
      points: Point[];
    }
  | {
      mode: "ellipse";
      center: Point | null;
      axisEnd?: Point;
      radiusX?: number;
    }
  | {
      mode: "text";
      position: Point;
      inputActive: boolean;
    }
  | {
      mode: "selecting";
      start: Point;
      currentPos: Point;
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
      gripType: string;
      startPos: Point;
      originalDimension: DimensionEntity;
    }
  | {
      mode: "modifyMove";
      step: "selectBase" | "selectDestination";
      entityIds: string[];
      dimensionIds: string[];
      basePoint?: Point;
    }
  | {
      mode: "modifyCopy";
      step: "selectBase" | "selectDestination";
      entityIds: string[];
      dimensionIds: string[];
      basePoint?: Point;
    }
  | {
      mode: "modifyRotate";
      step: "selectBase" | "selectAngle";
      entityIds: string[];
      dimensionIds: string[];
      basePoint?: Point;
      startAngle?: number;
    }
  | {
      mode: "modifyMirror";
      step: "selectFirst" | "selectSecond";
      entityIds: string[];
      dimensionIds: string[];
      firstPoint?: Point;
    }
  | {
      mode: "modifyScale";
      step: "selectBase" | "selectScale";
      entityIds: string[];
      dimensionIds: string[];
      basePoint?: Point;
    }
  | {
      mode: "modifyOffset";
      step: "enterDistance" | "selectEntity" | "selectSide";
      distance?: number;
      entityId?: string;
    };

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
