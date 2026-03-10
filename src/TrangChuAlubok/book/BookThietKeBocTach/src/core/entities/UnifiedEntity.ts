/**
 * UnifiedEntity - Hệ thống Entity thống nhất cho CAD
 *
 * Phương án D: Data-only entities với Typed Geometry
 * - Immutable (React-friendly)
 * - Typed geometry cho từng loại entity (chuẩn CAD)
 * - Dễ mở rộng (thêm type mới vào union)
 *
 * TUÂN THỦ 3 ĐIỀU KIỆN:
 * - ĐK1: Entity chỉ được modify qua Commands → Document
 * - ĐK2: PropertySchema validate trong Commands trước khi modify
 * - ĐK3: File đặt trong core/entities/ đúng cấu trúc
 */

// ==================== Point Types ====================

export interface Point2D {
  x: number;
  y: number;
}

// ==================== Entity Type Enum ====================

export enum UnifiedEntityType {
  LINE = "LINE",
  POLYLINE = "POLYLINE",
  RECT = "RECT",
  CIRCLE = "CIRCLE",
  ARC = "ARC",
  ELLIPSE = "ELLIPSE",
  TEXT = "TEXT",
  DIMENSION = "DIMENSION",
  HATCH = "HATCH",
  BLOCK_REF = "BLOCK_REF",
  IMAGE = "IMAGE",
}

// ==================== Geometry Types (Typed per entity) ====================

/** LINE: 2 điểm start và end */
export interface LineGeometry {
  type: "LINE";
  start: Point2D;
  end: Point2D;
}

/** POLYLINE: Mảng điểm, có thể closed */
export interface PolylineGeometry {
  type: "POLYLINE";
  points: Point2D[];
  closed: boolean;
}

/** RECT: Origin + width + height + rotation */
export interface RectGeometry {
  type: "RECT";
  origin: Point2D; // Bottom-left corner
  width: number;
  height: number;
  rotation: number; // Radians
}

/** CIRCLE: Center + radius */
export interface CircleGeometry {
  type: "CIRCLE";
  center: Point2D;
  radius: number;
}

/** ARC: Center + radius + start/end angles */
export interface ArcGeometry {
  type: "ARC";
  center: Point2D;
  radius: number;
  startAngle: number; // Radians
  endAngle: number; // Radians
}

/** ELLIPSE: Center + major/minor axis + rotation */
export interface EllipseGeometry {
  type: "ELLIPSE";
  center: Point2D;
  majorRadius: number;
  minorRadius: number;
  rotation: number; // Radians
}

/** TEXT: Position + text content + styling */
export interface TextGeometry {
  type: "TEXT";
  position: Point2D;
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
  rotation: number; // Radians
}

/** DIMENSION: Start/end measurement points + text position + offset */
export interface DimensionGeometry {
  type: "DIMENSION";
  startPoint: Point2D;
  endPoint: Point2D;
  textPosition: Point2D;
  offset: number;
}

/** Union of all geometry types */
export type EntityGeometry =
  | LineGeometry
  | PolylineGeometry
  | RectGeometry
  | CircleGeometry
  | ArcGeometry
  | EllipseGeometry
  | TextGeometry
  | DimensionGeometry;

// ==================== Entity Style ====================

export interface EntityStyle {
  /** Stroke color (hex) */
  strokeColor: string;
  /** Stroke width */
  strokeWidth: number;
  /** Stroke style */
  strokeStyle: "solid" | "dashed" | "dotted" | "dashdot";
  /** Fill color (null = no fill) */
  fillColor: string | null;
  /** Opacity 0-1 */
  opacity: number;
}

export const DEFAULT_STYLE: EntityStyle = {
  strokeColor: "#FFFFFF",
  strokeWidth: 1,
  strokeStyle: "solid",
  fillColor: null,
  opacity: 1,
};

// ==================== Entity State ====================

export interface EntityState {
  /** Entity is selected */
  selected: boolean;
  /** Entity is hovered */
  hovered: boolean;
  /** Entity is visible */
  visible: boolean;
  /** Entity is locked (cannot edit) */
  locked: boolean;
}

export const DEFAULT_STATE: EntityState = {
  selected: false,
  hovered: false,
  visible: true,
  locked: false,
};

// ==================== Unified Entity Interface ====================

/**
 * UnifiedEntity - Immutable data structure cho CAD entities
 *
 * Đây là DATA ONLY - không có methods
 * Mọi transformations thực hiện qua EntityUtils functions
 */
export interface UnifiedEntity<G extends EntityGeometry = EntityGeometry> {
  /** Unique ID */
  id: string;

  /** Entity type (derived from geometry.type) */
  entityType: UnifiedEntityType;

  /** Typed geometry data */
  geometry: G;

  /** Visual style */
  style: EntityStyle;

  /** State flags */
  state: EntityState;

  /** Layer ID */
  layerId: string;

  /** Optional name */
  name?: string;

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

// ==================== Type Guards ====================

export function isLineEntity(
  entity: UnifiedEntity,
): entity is UnifiedEntity<LineGeometry> {
  return entity.geometry.type === "LINE";
}

export function isPolylineEntity(
  entity: UnifiedEntity,
): entity is UnifiedEntity<PolylineGeometry> {
  return entity.geometry.type === "POLYLINE";
}

export function isRectEntity(
  entity: UnifiedEntity,
): entity is UnifiedEntity<RectGeometry> {
  return entity.geometry.type === "RECT";
}

export function isCircleEntity(
  entity: UnifiedEntity,
): entity is UnifiedEntity<CircleGeometry> {
  return entity.geometry.type === "CIRCLE";
}

export function isArcEntity(
  entity: UnifiedEntity,
): entity is UnifiedEntity<ArcGeometry> {
  return entity.geometry.type === "ARC";
}

export function isEllipseEntity(
  entity: UnifiedEntity,
): entity is UnifiedEntity<EllipseGeometry> {
  return entity.geometry.type === "ELLIPSE";
}

export function isTextEntity(
  entity: UnifiedEntity,
): entity is UnifiedEntity<TextGeometry> {
  return entity.geometry.type === "TEXT";
}

export function isDimensionEntity(
  entity: UnifiedEntity,
): entity is UnifiedEntity<DimensionGeometry> {
  return entity.geometry.type === "DIMENSION";
}

// ==================== Bounding Box ====================

export interface BoundingBox {
  min: Point2D;
  max: Point2D;
}

// ==================== Factory Functions ====================

let entityIdCounter = 0;

export function generateEntityId(): string {
  return `entity_${Date.now()}_${++entityIdCounter}_${Math.random()
    .toString(36)
    .substr(2, 6)}`;
}

/**
 * Create a new LINE entity
 */
export function createLineEntity(
  start: Point2D,
  end: Point2D,
  options?: Partial<EntityStyle & { layerId: string; name: string }>,
): UnifiedEntity<LineGeometry> {
  return {
    id: generateEntityId(),
    entityType: UnifiedEntityType.LINE,
    geometry: {
      type: "LINE",
      start: { ...start },
      end: { ...end },
    },
    style: { ...DEFAULT_STYLE, ...options },
    state: { ...DEFAULT_STATE },
    layerId: options?.layerId ?? "default",
    name: options?.name,
  };
}

/**
 * Create a new POLYLINE entity
 */
export function createPolylineEntity(
  points: Point2D[],
  closed = false,
  options?: Partial<EntityStyle & { layerId: string; name: string }>,
): UnifiedEntity<PolylineGeometry> {
  return {
    id: generateEntityId(),
    entityType: UnifiedEntityType.POLYLINE,
    geometry: {
      type: "POLYLINE",
      points: points.map((p) => ({ ...p })),
      closed,
    },
    style: { ...DEFAULT_STYLE, ...options },
    state: { ...DEFAULT_STATE },
    layerId: options?.layerId ?? "default",
    name: options?.name,
  };
}

/**
 * Create a new RECT entity
 */
export function createRectEntity(
  origin: Point2D,
  width: number,
  height: number,
  rotation = 0,
  options?: Partial<EntityStyle & { layerId: string; name: string }>,
): UnifiedEntity<RectGeometry> {
  return {
    id: generateEntityId(),
    entityType: UnifiedEntityType.RECT,
    geometry: {
      type: "RECT",
      origin: { ...origin },
      width,
      height,
      rotation,
    },
    style: { ...DEFAULT_STYLE, ...options },
    state: { ...DEFAULT_STATE },
    layerId: options?.layerId ?? "default",
    name: options?.name,
  };
}

/**
 * Create a new CIRCLE entity
 */
export function createCircleEntity(
  center: Point2D,
  radius: number,
  options?: Partial<EntityStyle & { layerId: string; name: string }>,
): UnifiedEntity<CircleGeometry> {
  return {
    id: generateEntityId(),
    entityType: UnifiedEntityType.CIRCLE,
    geometry: {
      type: "CIRCLE",
      center: { ...center },
      radius,
    },
    style: { ...DEFAULT_STYLE, ...options },
    state: { ...DEFAULT_STATE },
    layerId: options?.layerId ?? "default",
    name: options?.name,
  };
}

/**
 * Create a new ARC entity
 */
export function createArcEntity(
  center: Point2D,
  radius: number,
  startAngle: number,
  endAngle: number,
  options?: Partial<EntityStyle & { layerId: string; name: string }>,
): UnifiedEntity<ArcGeometry> {
  return {
    id: generateEntityId(),
    entityType: UnifiedEntityType.ARC,
    geometry: {
      type: "ARC",
      center: { ...center },
      radius,
      startAngle,
      endAngle,
    },
    style: { ...DEFAULT_STYLE, ...options },
    state: { ...DEFAULT_STATE },
    layerId: options?.layerId ?? "default",
    name: options?.name,
  };
}

/**
 * Create a new DIMENSION entity
 */
export function createDimensionEntity(
  startPoint: Point2D,
  endPoint: Point2D,
  offset: number = 30,
  options?: Partial<EntityStyle & { layerId: string; name: string }>,
): UnifiedEntity<DimensionGeometry> {
  // Calculate default text position
  const mid = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  };
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = len > 0 ? -dy / len : 0;
  const ny = len > 0 ? dx / len : 1;
  const textPosition = {
    x: mid.x + nx * offset,
    y: mid.y + ny * offset,
  };

  return {
    id: generateEntityId(),
    entityType: UnifiedEntityType.DIMENSION,
    geometry: {
      type: "DIMENSION",
      startPoint: { ...startPoint },
      endPoint: { ...endPoint },
      textPosition,
      offset,
    },
    style: { ...DEFAULT_STYLE, ...options },
    state: { ...DEFAULT_STATE },
    layerId: options?.layerId ?? "default",
    name: options?.name,
  };
}
