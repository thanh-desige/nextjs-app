/**
 * Rect Entity - Hình chữ nhật trong CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { Matrix3 } from "../geometry/Matrix3";
import {
  BoundingBox,
  boundingBoxFromPoints,
  isPointInPolygon,
} from "../geometry/GeometryUtils";
import {
  initEntityBase,
  createGripPoint,
  serializeEntityBase,
} from "./EntityBaseUtils";
import {
  EntityType,
  EntityStyle,
  EntityJSON,
  GripPoint,
  GripType,
  IRectEntity,
} from "./Entity.types";

export class RectEntity implements IRectEntity {
  public id: string;
  public readonly type = EntityType.RECT;
  public name?: string;
  public layerId: string;
  public style: EntityStyle;
  public state: {
    selected: boolean;
    hovered: boolean;
    visible: boolean;
    locked: boolean;
  };
  public metadata?: Record<string, unknown>;
  public origin: Vec2;
  public width: number;
  public height: number;
  public rotation: number; // radian

  constructor(
    origin: IVec2,
    width: number,
    height: number,
    options?: {
      id?: string;
      name?: string;
      layerId?: string;
      style?: Partial<EntityStyle>;
      rotation?: number;
    },
  ) {
    const base = initEntityBase(options);
    this.id = base.id;
    this.name = base.name;
    this.layerId = base.layerId;
    this.style = base.style;
    this.state = base.state;
    this.metadata = base.metadata;
    this.origin = Vec2.from(origin);
    this.width = width;
    this.height = height;
    this.rotation = options?.rotation ?? 0;
  }

  // ==================== Factory Methods ====================

  static create(
    origin: IVec2,
    width: number,
    height: number,
    style?: Partial<EntityStyle>,
  ): RectEntity {
    return new RectEntity(origin, width, height, { style });
  }

  /** Tạo từ 2 điểm đối góc */
  static fromCorners(
    p1: IVec2,
    p2: IVec2,
    style?: Partial<EntityStyle>,
  ): RectEntity {
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    return new RectEntity({ x: minX, y: minY }, width, height, { style });
  }

  /** Tạo từ tâm và kích thước */
  static fromCenter(
    center: IVec2,
    width: number,
    height: number,
    style?: Partial<EntityStyle>,
  ): RectEntity {
    return new RectEntity(
      { x: center.x - width / 2, y: center.y - height / 2 },
      width,
      height,
      { style },
    );
  }

  static fromJSON(json: EntityJSON): RectEntity {
    const rect = new RectEntity(
      json.origin as IVec2,
      json.width as number,
      json.height as number,
      {
        id: json.id,
        name: json.name,
        layerId: json.layerId,
        style: json.style,
        rotation: json.rotation as number,
      },
    );
    rect.metadata = json.metadata;
    return rect;
  }

  // ==================== Geometry ====================

  /** Lấy 4 góc của hình chữ nhật (đã xoay) */
  getCorners(): Vec2[] {
    const corners = [
      new Vec2(0, 0),
      new Vec2(this.width, 0),
      new Vec2(this.width, this.height),
      new Vec2(0, this.height),
    ];

    if (this.rotation !== 0) {
      const matrix = Matrix3.translation(this.origin.x, this.origin.y).rotate(
        this.rotation,
      );
      return corners.map((c) => matrix.transformPoint(c));
    }

    return corners.map((c) => c.add(this.origin));
  }

  /** Lấy tâm */
  getCenter(): Vec2 {
    const center = new Vec2(this.width / 2, this.height / 2);
    if (this.rotation !== 0) {
      const matrix = Matrix3.translation(this.origin.x, this.origin.y).rotate(
        this.rotation,
      );
      return matrix.transformPoint(center);
    }
    return center.add(this.origin);
  }

  /** Diện tích */
  getArea(): number {
    return this.width * this.height;
  }

  /** Chu vi */
  getPerimeter(): number {
    return 2 * (this.width + this.height);
  }

  // ==================== BaseEntity Implementation ====================

  clone(): RectEntity {
    const cloned = new RectEntity(
      this.origin.clone(),
      this.width,
      this.height,
      {
        rotation: this.rotation,
        layerId: this.layerId,
        style: { ...this.style },
        name: this.name,
      },
    );
    cloned.state = { ...this.state };
    cloned.metadata = this.metadata ? { ...this.metadata } : undefined;
    return cloned;
  }

  getBounds(): BoundingBox {
    const corners = this.getCorners();
    return boundingBoxFromPoints(corners)!;
  }

  containsPoint(point: IVec2, tolerance: number = 5): boolean {
    // Transform point về local space
    if (this.rotation !== 0) {
      const inverse = Matrix3.translation(this.origin.x, this.origin.y)
        .rotate(this.rotation)
        .inverse();
      if (!inverse) return false;
      const localPoint = inverse.transformPoint(point);

      // Check fill
      if (this.style.fillColor) {
        return (
          localPoint.x >= -tolerance &&
          localPoint.x <= this.width + tolerance &&
          localPoint.y >= -tolerance &&
          localPoint.y <= this.height + tolerance
        );
      }

      // Check stroke only
      const onLeft =
        Math.abs(localPoint.x) <= tolerance &&
        localPoint.y >= -tolerance &&
        localPoint.y <= this.height + tolerance;
      const onRight =
        Math.abs(localPoint.x - this.width) <= tolerance &&
        localPoint.y >= -tolerance &&
        localPoint.y <= this.height + tolerance;
      const onTop =
        Math.abs(localPoint.y) <= tolerance &&
        localPoint.x >= -tolerance &&
        localPoint.x <= this.width + tolerance;
      const onBottom =
        Math.abs(localPoint.y - this.height) <= tolerance &&
        localPoint.x >= -tolerance &&
        localPoint.x <= this.width + tolerance;

      return onLeft || onRight || onTop || onBottom;
    }

    // Không xoay
    if (this.style.fillColor) {
      return (
        point.x >= this.origin.x - tolerance &&
        point.x <= this.origin.x + this.width + tolerance &&
        point.y >= this.origin.y - tolerance &&
        point.y <= this.origin.y + this.height + tolerance
      );
    }

    const corners = this.getCorners();
    return isPointInPolygon(point, corners);
  }

  getGripPoints(): GripPoint[] {
    const corners = this.getCorners();
    const center = this.getCenter();

    return [
      // 4 góc
      createGripPoint(corners[0], GripType.ENDPOINT, this.id, 0),
      createGripPoint(corners[1], GripType.ENDPOINT, this.id, 1),
      createGripPoint(corners[2], GripType.ENDPOINT, this.id, 2),
      createGripPoint(corners[3], GripType.ENDPOINT, this.id, 3),
      // 4 cạnh (midpoints)
      createGripPoint(
        corners[0].midpoint(corners[1]),
        GripType.MIDPOINT,
        this.id,
        4,
      ),
      createGripPoint(
        corners[1].midpoint(corners[2]),
        GripType.MIDPOINT,
        this.id,
        5,
      ),
      createGripPoint(
        corners[2].midpoint(corners[3]),
        GripType.MIDPOINT,
        this.id,
        6,
      ),
      createGripPoint(
        corners[3].midpoint(corners[0]),
        GripType.MIDPOINT,
        this.id,
        7,
      ),
      // Tâm
      createGripPoint(center, GripType.CENTER, this.id),
    ];
  }

  moveGripPoint(gripIndex: number, newPosition: IVec2): void {
    // Simplified: chỉ move corner points
    if (gripIndex >= 0 && gripIndex <= 3) {
      const corners = this.getCorners();
      const oppositeIndex = (gripIndex + 2) % 4;
      const opposite = corners[oppositeIndex];

      // Recalculate origin, width, height từ 2 góc đối diện
      const minX = Math.min(newPosition.x, opposite.x);
      const minY = Math.min(newPosition.y, opposite.y);
      const maxX = Math.max(newPosition.x, opposite.x);
      const maxY = Math.max(newPosition.y, opposite.y);

      this.origin.set(minX, minY);
      this.width = maxX - minX;
      this.height = maxY - minY;
      this.rotation = 0; // Reset rotation khi resize
    } else if (gripIndex === 8) {
      // Move center = move whole rect
      const center = this.getCenter();
      const dx = newPosition.x - center.x;
      const dy = newPosition.y - center.y;
      this.origin.addSelf({ x: dx, y: dy });
    }
  }

  getPoints(): Vec2[] {
    return [this.origin]; // Chỉ trả về origin, width/height là properties
  }

  translate(dx: number, dy: number): void {
    this.origin.addSelf({ x: dx, y: dy });
  }

  rotate(angle: number, center: IVec2): void {
    // Xoay origin quanh center
    const matrix = Matrix3.rotationAround(center, angle);
    const newOrigin = matrix.transformPoint(this.origin);
    this.origin.copy(newOrigin);
    this.rotation += angle;
  }

  // ==================== Serialization ====================

  toJSON(): EntityJSON {
    return {
      ...serializeEntityBase(this),
      type: this.type,
      origin: this.origin.toObject(),
      width: this.width,
      height: this.height,
      rotation: this.rotation,
    } as EntityJSON;
  }
}
