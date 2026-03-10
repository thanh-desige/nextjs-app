/**
 * CadEntity.ts - UNIFIED ENTITY INTERFACE
 *
 * ĐÂY LÀ NGUỒN TRUTH DUY NHẤT cho CadEntity trong UI layer.
 * Tất cả các file khác PHẢI import từ đây.
 *
 * Mapping với core types:
 * - CadEntity (UI) ←→ IEntity (Core)
 * - Point (UI) ←→ IVec2 (Core)
 *
 * Không được định nghĩa CadEntity ở bất kỳ file nào khác!
 */

// ============================================
// POINT INTERFACE
// ============================================

export interface Point {
  x: number;
  y: number;
}

// ============================================
// ENTITY TYPES
// ============================================

export type CadEntityType =
  | "line"
  | "polyline"
  | "rect"
  | "circle"
  | "arc"
  | "ellipse"
  | "text"
  | "dimension";

// ============================================
// STROKE STYLE
// ============================================

export type StrokeStyle = "solid" | "dashed" | "dotted" | "dashdot";

// ============================================
// CAD ENTITY INTERFACE
// ============================================

export interface CadEntity {
  /** Unique identifier */
  id: string;

  /** Entity type */
  type: CadEntityType;

  /** Points defining the entity geometry */
  points: Point[];

  /** Stroke color (hex) */
  color: string;

  /** Stroke width in pixels */
  lineWidth: number;

  // ==================== State ====================

  /** Is entity selected */
  selected?: boolean;

  /** Is entity locked (non-editable) */
  locked?: boolean;

  /** Is entity visible */
  visible?: boolean;

  // ==================== Layer ====================

  /** Layer ID this entity belongs to */
  layer?: string;

  /**
   * Use layer style (ByLayer) or entity's own style (ByObject)
   * - true: Entity inherits style from layer
   * - false: Entity uses its own color/lineWidth/etc (Custom mode)
   */
  useLayerStyle?: boolean;

  // ==================== Style ====================

  /** Stroke style: solid, dashed, dotted, dashdot */
  strokeStyle?: StrokeStyle;

  /** Fill color (hex or null for no fill) */
  fillColor?: string | null;

  /** Fill opacity (0-1) */
  fillOpacity?: number;

  /** Entity opacity (0-1, for entire entity including stroke) */
  opacity?: number;

  // ==================== Polyline ====================

  /** Whether polyline is closed (forms a polygon) */
  closed?: boolean;

  // ==================== Arc ====================

  /** Start angle in radians */
  startAngle?: number;

  /** End angle in radians */
  endAngle?: number;

  // ==================== Ellipse ====================

  /** Radius X for ellipse */
  radiusX?: number;

  /** Radius Y for ellipse */
  radiusY?: number;

  /** Rotation angle in radians */
  rotation?: number;

  // ==================== Text ====================

  /** Text content */
  text?: string;

  /** Font size in pixels */
  fontSize?: number;

  /** Font family */
  fontFamily?: string;

  /** Text rotation angle in radians */
  textRotation?: number;

  /** Text scale factor (1 = normal) */
  textScale?: number;

  // ==================== Dimension (for SVG Export) ====================
  // These fields are used when converting DimensionEntity to CadEntity for export

  /** Dimension point1 (start point) */
  point1?: Point;

  /** Dimension point2 (end point) */
  point2?: Point;

  /** Dimension point3 (for angular dimensions) */
  point3?: Point;

  /** Dimension offset from points */
  offset?: number;

  /** Dimension value override */
  value?: number;

  /** Dimension direction */
  direction?: "horizontal" | "vertical" | "aligned" | "auto";

  /** Dimension type */
  dimensionType?: string;

  /** Dimension style object */
  style?: {
    textHeight: number;
    arrowSize: number;
    extensionOvershoot: number;
    extensionOffset: number;
    precision: number;
    prefix: string;
    suffix: string;
    unit: string;
    font: string;
    color: string;
    textColor?: string;
    lineColor?: string;
    showUnit?: boolean;
  };
}

// ============================================
// RE-EXPORT UTILITY TYPES
// ============================================

/**
 * Entity creation input (without id)
 */
export type CadEntityInput = Omit<CadEntity, "id">;

/**
 * Partial entity update
 */
export type CadEntityUpdate = Partial<Omit<CadEntity, "id" | "type">>;

/**
 * Entity with required selection state
 */
export interface SelectableCadEntity extends CadEntity {
  selected: boolean;
}
