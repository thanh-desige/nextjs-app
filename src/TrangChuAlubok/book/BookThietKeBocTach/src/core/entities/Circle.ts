/**
 * Circle Entity - Đường tròn trong CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import {
  BoundingBox,
  distancePointToPoint,
  boundingBoxFromCircle,
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
  ICircleEntity,
} from "./Entity.types";

export class CircleEntity implements ICircleEntity {
  public id: string;
  public readonly type = EntityType.CIRCLE;
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
  public center: Vec2;
  public radius: number;

  constructor(
    center: IVec2,
    radius: number,
    options?: {
      id?: string;
      name?: string;
      layerId?: string;
      style?: Partial<EntityStyle>;
    },
  ) {
    const base = initEntityBase(options);
    this.id = base.id;
    this.name = base.name;
    this.layerId = base.layerId;
    this.style = base.style;
    this.state = base.state;
    this.metadata = base.metadata;
    this.center = Vec2.from(center);
    this.radius = Math.abs(radius);
  }

  // ==================== Factory Methods ====================

  static create(
    center: IVec2,
    radius: number,
    style?: Partial<EntityStyle>,
  ): CircleEntity {
    return new CircleEntity(center, radius, { style });
  }

  /** Tạo từ tâm và điểm trên đường tròn */
  static fromCenterAndPoint(
    center: IVec2,
    pointOnCircle: IVec2,
    style?: Partial<EntityStyle>,
  ): CircleEntity {
    const radius = distancePointToPoint(center, pointOnCircle);
    return new CircleEntity(center, radius, { style });
  }

  /** Tạo từ 2 điểm (đường kính) */
  static fromDiameter(
    p1: IVec2,
    p2: IVec2,
    style?: Partial<EntityStyle>,
  ): CircleEntity {
    const center = new Vec2((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    const radius = distancePointToPoint(p1, p2) / 2;
    return new CircleEntity(center, radius, { style });
  }

  /** Tạo từ 3 điểm */
  static from3Points(
    p1: IVec2,
    p2: IVec2,
    p3: IVec2,
    style?: Partial<EntityStyle>,
  ): CircleEntity | null {
    // Tính tâm đường tròn ngoại tiếp
    const ax = p1.x,
      ay = p1.y;
    const bx = p2.x,
      by = p2.y;
    const cx = p3.x,
      cy = p3.y;

    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < 1e-10) return null; // 3 điểm thẳng hàng

    const ux =
      ((ax * ax + ay * ay) * (by - cy) +
        (bx * bx + by * by) * (cy - ay) +
        (cx * cx + cy * cy) * (ay - by)) /
      d;
    const uy =
      ((ax * ax + ay * ay) * (cx - bx) +
        (bx * bx + by * by) * (ax - cx) +
        (cx * cx + cy * cy) * (bx - ax)) /
      d;

    const center = new Vec2(ux, uy);
    const radius = distancePointToPoint(center, p1);
    return new CircleEntity(center, radius, { style });
  }

  static fromJSON(json: EntityJSON): CircleEntity {
    const circle = new CircleEntity(
      json.center as IVec2,
      json.radius as number,
      {
        id: json.id,
        name: json.name,
        layerId: json.layerId,
        style: json.style,
      },
    );
    circle.metadata = json.metadata;
    return circle;
  }

  // ==================== Geometry ====================

  /** Diện tích */
  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  /** Chu vi */
  getCircumference(): number {
    return 2 * Math.PI * this.radius;
  }

  /** Đường kính */
  getDiameter(): number {
    return this.radius * 2;
  }

  /** Điểm tại góc (radian) */
  getPointAtAngle(angle: number): Vec2 {
    return new Vec2(
      this.center.x + this.radius * Math.cos(angle),
      this.center.y + this.radius * Math.sin(angle),
    );
  }

  /** 4 điểm quadrant (0°, 90°, 180°, 270°) */
  getQuadrantPoints(): Vec2[] {
    return [
      this.getPointAtAngle(0), // East
      this.getPointAtAngle(Math.PI / 2), // North
      this.getPointAtAngle(Math.PI), // West
      this.getPointAtAngle((3 * Math.PI) / 2), // South
    ];
  }

  // ==================== BaseEntity Implementation ====================

  clone(): CircleEntity {
    const cloned = new CircleEntity(this.center.clone(), this.radius, {
      layerId: this.layerId,
      style: { ...this.style },
      name: this.name,
    });
    cloned.state = { ...this.state };
    cloned.metadata = this.metadata ? { ...this.metadata } : undefined;
    return cloned;
  }

  getBounds(): BoundingBox {
    return boundingBoxFromCircle({ center: this.center, radius: this.radius });
  }

  containsPoint(point: IVec2, tolerance: number = 5): boolean {
    const distance = distancePointToPoint(point, this.center);

    if (this.style.fillColor) {
      // Filled circle - check if inside
      return distance <= this.radius + tolerance;
    }

    // Stroke only - check if on the circle
    return Math.abs(distance - this.radius) <= tolerance;
  }

  getGripPoints(): GripPoint[] {
    const quadrants = this.getQuadrantPoints();

    return [
      createGripPoint(this.center, GripType.CENTER, this.id, 0),
      createGripPoint(quadrants[0], GripType.QUADRANT, this.id, 1), // East
      createGripPoint(quadrants[1], GripType.QUADRANT, this.id, 2), // North
      createGripPoint(quadrants[2], GripType.QUADRANT, this.id, 3), // West
      createGripPoint(quadrants[3], GripType.QUADRANT, this.id, 4), // South
    ];
  }

  moveGripPoint(gripIndex: number, newPosition: IVec2): void {
    if (gripIndex === 0) {
      // Move center
      this.center.copy(newPosition);
    } else {
      // Move quadrant point = change radius
      this.radius = distancePointToPoint(this.center, newPosition);
    }
  }

  getPoints(): Vec2[] {
    return [this.center];
  }

  translate(dx: number, dy: number): void {
    this.center.addSelf({ x: dx, y: dy });
  }

  rotate(_angle: number, center: IVec2): void {
    // Circle không thay đổi hình dạng khi xoay, chỉ xoay tâm
    const rotated = this.center.rotateAround(center, _angle);
    this.center.copy(rotated);
  }

  scale(sx: number, sy: number, center: IVec2): void {
    // Scale center position
    const dx = this.center.x - center.x;
    const dy = this.center.y - center.y;
    this.center.set(center.x + dx * sx, center.y + dy * sy);

    // Scale radius (uniform scale = average)
    this.radius *= (Math.abs(sx) + Math.abs(sy)) / 2;
  }

  // ==================== Circle-specific Methods ====================

  /** Offset (concentric circle) */
  offset(distance: number): CircleEntity {
    const newRadius = this.radius + distance;
    if (newRadius <= 0) {
      throw new Error("Offset would result in negative radius");
    }
    return new CircleEntity(this.center.clone(), newRadius, {
      style: { ...this.style },
      layerId: this.layerId,
    });
  }

  // ==================== Serialization ====================

  toJSON(): EntityJSON {
    return {
      ...serializeEntityBase(this),
      type: this.type,
      center: this.center.toObject(),
      radius: this.radius,
    } as EntityJSON;
  }
}
