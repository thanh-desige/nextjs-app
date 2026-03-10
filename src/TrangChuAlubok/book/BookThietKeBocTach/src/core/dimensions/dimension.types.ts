/**
 * dimension.types.ts
 *
 * STEP-5.10: Extracted from DimensionManager.ts
 * All type definitions, interfaces, and constants for the dimension system.
 * Consumed by 30+ files across the codebase.
 */

// ============================================
// BASIC TYPES
// ============================================

/** Point type for dimension calculations */
export interface Point {
  x: number;
  y: number;
}

/** Entity reference for dimension snapping */
export interface EntityReference {
  entityId: string;
  entityType: "line" | "circle" | "arc" | "polyline" | "rect";
  snapType:
    | "endpoint"
    | "midpoint"
    | "center"
    | "intersection"
    | "nearest"
    | "quadrant";
  point: Point;
  /** Index of the point in entity.points array (for endpoint snap) */
  pointIndex?: number;
}

// ============================================
// DIMENSION TYPES
// ============================================

export type DimensionType =
  | "linear" // DLI - Kích thước thẳng (tự động ngang/dọc theo góc 2 điểm)
  | "horizontal" // DHO - Kích thước ngang cưỡng ép
  | "vertical" // DVE - Kích thước dọc cưỡng ép
  | "aligned" // DAL - Kích thước song song cạnh xiên
  | "angular" // DAN - Góc
  | "radius" // DRA - Bán kính
  | "diameter" // Đường kính
  | "arc" // DAR - Chiều dài cung tròn
  | "ordinate" // Tọa độ
  | "continue" // DCO - Kích thước nối tiếp
  | "baseline" // DBA - Kích thước chuẩn gốc (bậc thang)
  | "qdim"; // QD - Quick Dimension (kích thước nhanh nhiều điểm)

export type DimensionDirection = "horizontal" | "vertical" | "aligned" | "auto";

/** QDIM modes */
export type QdimMode =
  | "continuous" // Chuỗi kích thước nối tiếp
  | "staggered" // Kích thước so le (offset khác nhau)
  | "baseline" // Kích thước từ điểm gốc chung
  | "ordinate"; // Tọa độ X hoặc Y

// ============================================
// STYLE
// ============================================

export interface DimensionStyle {
  textHeight: number;
  arrowSize: number;
  extensionLineGap: number;
  extensionLineOffset: number;
  lineColor: string;
  textColor: string;
  font: string;
  precision: number;
  unit: "mm" | "cm" | "m" | "inch";
  showUnit: boolean;
  prefix: string;
  suffix: string;
  textPosition: "above" | "center" | "outside";
  arrowType: "closed" | "open" | "dot" | "tick";
  // New style options
  textRotation: number; // Override text rotation (degrees)
  textOffset: Point; // Manual text offset
  suppressExtLine1: boolean; // Hide first extension line
  suppressExtLine2: boolean; // Hide second extension line
}

// ============================================
// DIMENSION ENTITY
// ============================================

export interface DimensionEntity {
  id: string;
  type: "dimension";
  dimensionType: DimensionType;
  point1: Point;
  point2: Point;
  point3?: Point; // Cho angular dimension
  offset: number; // Khoảng cách từ đối tượng đến dimension line
  direction?: DimensionDirection; // Direction for linear dimension
  value?: number; // Override value (nếu muốn hiển thị giá trị khác)
  textOverride?: string; // Custom text override
  style: DimensionStyle;
  // Entity references for snapping
  ref1?: EntityReference;
  ref2?: EntityReference;
  ref3?: EntityReference;
  // Baseline/Continue chain
  parentDimId?: string; // Parent dimension for continue/baseline
  chainIndex?: number; // Position in chain
  // Absolute dim line position for continue/qdim (Y for horizontal, X for vertical)
  dimLinePosition?: number;

  // ========================================================================
  // LEGACY FLAG - 2D FIRST, 3D READY ARCHITECTURE
  // ========================================================================
  // When true, this dimension is LEGACY (non-associative):
  // - Display only (shows measurement in 2D)
  // - NOT indexed in entityToDimensionIndex
  // - NOT updated by lifecycle (commitEntityGeometryChange)
  // - NOT used for BOM / bóc tách / constraints
  // - NOT migrated to 3D
  //
  // Legacy dimensions are created for RECT and CIRCLE entities as a
  // temporary workaround. This flag will be REMOVED when EDGE-based
  // geometry architecture is implemented in Phase 3D.
  // ========================================================================
  isLegacy?: boolean;
}

// ============================================
// CREATION PARAMS
// ============================================

export interface LinearDimensionParams {
  point1?: Point;
  point2?: Point;
  startPoint?: Point;
  endPoint?: Point;
  offset: number;
  direction?: DimensionDirection;
  isHorizontal?: boolean;
  ref1?: EntityReference;
  ref2?: EntityReference;
  textOverride?: string;
}

export interface AngularDimensionParams {
  center: Point;
  point1: Point;
  point2: Point;
  offset: number;
  ref1?: EntityReference;
  ref2?: EntityReference;
  ref3?: EntityReference;
}

export interface RadiusDimensionParams {
  center: Point;
  radius: number;
  angle: number; // Góc đặt dimension
  entityRef?: EntityReference;
}

export interface ArcDimensionParams {
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  offset?: number;
  arcLength?: number;
}

// ============================================
// DEFAULT STYLE
// ============================================

export const DEFAULT_DIMENSION_STYLE: DimensionStyle = {
  textHeight: 14,
  arrowSize: 8,
  extensionLineGap: 2,
  extensionLineOffset: 4,
  lineColor: "#00ff00",
  textColor: "#00ff00",
  font: "Arial",
  precision: 2, // 2 decimal places for mm (e.g., 0.45mm)
  unit: "mm",
  showUnit: true,
  prefix: "",
  suffix: "",
  textPosition: "above",
  arrowType: "closed",
  textRotation: 0,
  textOffset: { x: 0, y: 0 },
  suppressExtLine1: false,
  suppressExtLine2: false,
};
