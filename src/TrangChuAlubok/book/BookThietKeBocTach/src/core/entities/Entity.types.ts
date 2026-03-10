/**
 * Entity Types - Định nghĩa kiểu cho tất cả entities trong CAD
 */

import { IVec2 } from "../geometry/Vec2";

// BoundingBox import removed — IEntity is now data-only (STEP-3.9)
// Operations like getBounds() go through EntityBridge or EntityRegistry

// ==================== Entity Type Enum ====================

export enum EntityType {
  LINE = "LINE",
  RECT = "RECT",
  CIRCLE = "CIRCLE",
  ARC = "ARC",
  ELLIPSE = "ELLIPSE",
  POLYLINE = "POLYLINE",
  TEXT = "TEXT",
  DIMENSION = "DIMENSION",
  BLOCK_REF = "BLOCK_REF",
  GROUP = "GROUP",
  IMAGE = "IMAGE",
  HATCH = "HATCH",
}

// ==================== Entity Style ====================

export interface EntityStyle {
  /** Màu stroke (hex) */
  strokeColor: string;
  /** Độ dày nét */
  strokeWidth: number;
  /** Kiểu nét: solid, dashed, dotted */
  strokeStyle: "solid" | "dashed" | "dotted" | "dashdot";
  /** Màu fill (hex hoặc null nếu không fill) */
  fillColor: string | null;
  /** Độ trong suốt 0-1 */
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
  /** Entity có đang được chọn */
  selected: boolean;
  /** Entity có đang bị hover */
  hovered: boolean;
  /** Entity có đang visible */
  visible: boolean;
  /** Entity có bị khóa (không thể chỉnh sửa) */
  locked: boolean;
}

export const DEFAULT_STATE: EntityState = {
  selected: false,
  hovered: false,
  visible: true,
  locked: false,
};

// ==================== Entity Base Interface ====================

/**
 * IEntity — Data-only interface for all CAD entities.
 *
 * STEP-3.9: Method signatures REMOVED.
 * All operations (translate, rotate, scale, getBounds, containsPoint, clone)
 * go through EntityBridge utility functions or EntityRegistry.
 *
 * This is a PURE DATA interface — no behavior methods.
 */
export interface IEntity {
  /** ID duy nhất */
  id: string;
  /** Loại entity */
  type: EntityType;
  /** Tên entity (optional) */
  name?: string;
  /** Layer chứa entity */
  layerId: string;
  /** Style */
  style: EntityStyle;
  /** State */
  state: EntityState;
  /** Metadata tùy chỉnh */
  metadata?: Record<string, unknown>;

  // NO METHOD SIGNATURES — all operations via EntityBridge / EntityRegistry
  // See: EntityBridge.ts for translateIEntity, rotateIEntity, scaleIEntity, etc.
  // See: EntityRegistry.ts for entityRegistry.translate(), .rotate(), etc.
}

// ==================== Specific Entity Interfaces ====================

export interface ILineEntity extends IEntity {
  type: EntityType.LINE;
  start: IVec2;
  end: IVec2;
}

export interface IRectEntity extends IEntity {
  type: EntityType.RECT;
  /** Góc trái trên */
  origin: IVec2;
  width: number;
  height: number;
  /** Góc xoay (radian) */
  rotation: number;
}

export interface ICircleEntity extends IEntity {
  type: EntityType.CIRCLE;
  center: IVec2;
  radius: number;
}

export interface IArcEntity extends IEntity {
  type: EntityType.ARC;
  center: IVec2;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface IEllipseEntity extends IEntity {
  type: EntityType.ELLIPSE;
  center: IVec2;
  /** Bán trục lớn (major axis) */
  radiusX: number;
  /** Bán trục nhỏ (minor axis) */
  radiusY: number;
  /** Góc xoay của ellipse (radian) */
  rotation: number;
}

export interface IPolylineEntity extends IEntity {
  type: EntityType.POLYLINE;
  points: IVec2[];
  closed: boolean;
}

export interface ITextEntity extends IEntity {
  type: EntityType.TEXT;
  position: IVec2;
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
  rotation: number;
}

export interface IDimensionEntity extends IEntity {
  type: EntityType.DIMENSION;
  startPoint: IVec2;
  endPoint: IVec2;
  textPosition: IVec2;
  /** Offset từ đường đo */
  offset: number;
  /** Giá trị dimension (tính toán hoặc override) */
  value?: number;
  /** Hậu tố đơn vị */
  suffix?: string;
  /** Tiền tố */
  prefix?: string;
}

// ==================== Entity JSON for Serialization ====================

export interface EntityJSON {
  id: string;
  type: EntityType;
  name?: string;
  layerId: string;
  style: EntityStyle;
  metadata?: Record<string, unknown>;
  // Các thuộc tính cụ thể theo type
  [key: string]: unknown;
}

// ==================== Entity Factory Interface ====================

export interface IEntityFactory {
  createLine(
    start: IVec2,
    end: IVec2,
    options?: Partial<EntityStyle>,
  ): ILineEntity;
  createRect(
    origin: IVec2,
    width: number,
    height: number,
    options?: Partial<EntityStyle>,
  ): IRectEntity;
  createCircle(
    center: IVec2,
    radius: number,
    options?: Partial<EntityStyle>,
  ): ICircleEntity;
  createArc(
    center: IVec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    options?: Partial<EntityStyle>,
  ): IArcEntity;
  createPolyline(
    points: IVec2[],
    closed?: boolean,
    options?: Partial<EntityStyle>,
  ): IPolylineEntity;
  createText(
    position: IVec2,
    text: string,
    options?: Partial<EntityStyle>,
  ): ITextEntity;
  createFromJSON(json: EntityJSON): IEntity;
}

// ==================== Grip Point (Handle để chỉnh sửa) ====================

export enum GripType {
  ENDPOINT = "ENDPOINT",
  MIDPOINT = "MIDPOINT",
  CENTER = "CENTER",
  QUADRANT = "QUADRANT",
  CONTROL = "CONTROL",
  ROTATION = "ROTATION",
}

export interface GripPoint {
  position: IVec2;
  type: GripType;
  entityId: string;
  /** Index trong mảng points (cho polyline) */
  index?: number;
}

// ==================== Selection ====================

export interface SelectionBox {
  start: IVec2;
  end: IVec2;
  mode: "window" | "crossing";
}

export interface HitTestResult {
  hit: boolean;
  entity?: IEntity;
  point?: IVec2;
  distance?: number;
  grip?: GripPoint;
}
