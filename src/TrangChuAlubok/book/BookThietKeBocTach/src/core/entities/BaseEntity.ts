/**
 * BaseEntity - Lớp cơ sở cho tất cả entities trong CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { Matrix3 } from "../geometry/Matrix3";
import { BoundingBox } from "../geometry/GeometryUtils";
import {
  IEntity,
  EntityType,
  EntityStyle,
  EntityState,
  EntityJSON,
  GripPoint,
  GripType,
  DEFAULT_STYLE,
  DEFAULT_STATE,
} from "./Entity.types";

/** Tạo UUID */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * BaseEntity - Abstract class cho tất cả CAD entities
 */
export abstract class BaseEntity implements IEntity {
  public id: string;
  public abstract type: EntityType;
  public name?: string;
  public layerId: string;
  public style: EntityStyle;
  public state: EntityState;
  public metadata?: Record<string, unknown>;

  constructor(options?: {
    id?: string;
    name?: string;
    layerId?: string;
    style?: Partial<EntityStyle>;
    metadata?: Record<string, unknown>;
  }) {
    this.id = options?.id ?? generateId();
    this.name = options?.name;
    this.layerId = options?.layerId ?? "default";
    this.style = { ...DEFAULT_STYLE, ...options?.style };
    this.state = { ...DEFAULT_STATE };
    this.metadata = options?.metadata;
  }

  // ==================== Abstract Methods (phải implement) ====================

  /** Clone entity */
  abstract clone(): IEntity;

  /** Lấy bounding box */
  abstract getBounds(): BoundingBox;

  /** Kiểm tra điểm có trong entity */
  abstract containsPoint(point: IVec2, tolerance?: number): boolean;

  /** Lấy các grip points để chỉnh sửa */
  abstract getGripPoints(): GripPoint[];

  /** Di chuyển grip point */
  abstract moveGripPoint(gripIndex: number, newPosition: IVec2): void;

  /** Lấy các điểm định nghĩa entity (để vẽ) */
  abstract getPoints(): Vec2[];

  // ==================== Common Methods ====================

  /** Di chuyển entity */
  translate(dx: number, dy: number): void {
    const points = this.getPoints();
    const matrix = Matrix3.translation(dx, dy);
    for (const point of points) {
      const transformed = matrix.transformPoint(point);
      point.x = transformed.x;
      point.y = transformed.y;
    }
  }

  /** Xoay entity quanh điểm */
  rotate(angle: number, center: IVec2): void {
    const points = this.getPoints();
    const matrix = Matrix3.rotationAround(center, angle);
    for (const point of points) {
      const transformed = matrix.transformPoint(point);
      point.x = transformed.x;
      point.y = transformed.y;
    }
  }

  /** Scale entity từ điểm */
  scale(sx: number, sy: number, center: IVec2): void {
    const points = this.getPoints();
    const matrix = Matrix3.scalingFrom(center, sx, sy);
    for (const point of points) {
      const transformed = matrix.transformPoint(point);
      point.x = transformed.x;
      point.y = transformed.y;
    }
  }

  /** Mirror entity qua trục */
  mirror(axisStart: IVec2, axisEnd: IVec2): void {
    const points = this.getPoints();
    const dx = axisEnd.x - axisStart.x;
    const dy = axisEnd.y - axisStart.y;
    const angle = Math.atan2(dy, dx);

    // Mirror = Rotate to align axis with X, scale Y by -1, rotate back
    const matrix = Matrix3.translation(axisStart.x, axisStart.y)
      .rotate(-angle)
      .scale(1, -1)
      .rotate(angle)
      .translate(-axisStart.x, -axisStart.y);

    for (const point of points) {
      const transformed = matrix.transformPoint(point);
      point.x = transformed.x;
      point.y = transformed.y;
    }
  }

  // ==================== State Management ====================

  /** Chọn entity */
  select(): void {
    this.state.selected = true;
  }

  /** Bỏ chọn entity */
  deselect(): void {
    this.state.selected = false;
  }

  /** Toggle selection */
  toggleSelect(): void {
    this.state.selected = !this.state.selected;
  }

  /** Hover entity */
  hover(): void {
    this.state.hovered = true;
  }

  /** Unhover entity */
  unhover(): void {
    this.state.hovered = false;
  }

  /** Show entity */
  show(): void {
    this.state.visible = true;
  }

  /** Hide entity */
  hide(): void {
    this.state.visible = false;
  }

  /** Lock entity */
  lock(): void {
    this.state.locked = true;
  }

  /** Unlock entity */
  unlock(): void {
    this.state.locked = false;
  }

  // ==================== Style ====================

  /** Set style */
  setStyle(style: Partial<EntityStyle>): void {
    Object.assign(this.style, style);
  }

  /** Get effective color (considering state) */
  getEffectiveStrokeColor(): string {
    if (this.state.selected) return "#00FF00"; // Green when selected
    if (this.state.hovered) return "#FFFF00"; // Yellow when hovered
    return this.style.strokeColor;
  }

  // ==================== Bounds Helpers ====================

  /** Lấy tâm bounding box */
  getCenter(): Vec2 {
    const bounds = this.getBounds();
    return new Vec2(
      (bounds.min.x + bounds.max.x) / 2,
      (bounds.min.y + bounds.max.y) / 2
    );
  }

  /** Lấy kích thước */
  getSize(): Vec2 {
    const bounds = this.getBounds();
    return new Vec2(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
  }

  // ==================== Serialization ====================

  /** Serialize base properties */
  protected serializeBase(): Partial<EntityJSON> {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      layerId: this.layerId,
      style: { ...this.style },
      metadata: this.metadata ? { ...this.metadata } : undefined,
    };
  }

  /** Serialize to JSON */
  abstract toJSON(): EntityJSON;

  /** Copy base properties from another entity */
  protected copyBaseFrom(other: BaseEntity): void {
    this.name = other.name;
    this.layerId = other.layerId;
    this.style = { ...other.style };
    this.state = { ...other.state };
    this.metadata = other.metadata ? { ...other.metadata } : undefined;
  }
}

// ==================== Helper để tạo grip point ====================

export function createGripPoint(
  position: IVec2,
  type: GripType,
  entityId: string,
  index?: number
): GripPoint {
  return {
    position: Vec2.from(position),
    type,
    entityId,
    index,
  };
}
