/**
 * Arc Entity - Cung tròn trong CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import {
  BoundingBox,
  distancePointToPoint,
  normalizeAngle,
  EPSILON,
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
  IArcEntity,
} from "./Entity.types";

export class ArcEntity implements IArcEntity {
  public id: string;
  public readonly type = EntityType.ARC;
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
  public startAngle: number; // radian
  public endAngle: number; // radian

  constructor(
    center: IVec2,
    radius: number,
    startAngle: number,
    endAngle: number,
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
    this.startAngle = startAngle;
    this.endAngle = endAngle;
  }

  // ==================== Factory Methods ====================

  static create(
    center: IVec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: Partial<EntityStyle>,
  ): ArcEntity {
    return new ArcEntity(center, radius, startAngle, endAngle, { style });
  }

  /** Tạo từ tâm, điểm đầu, điểm cuối */
  static fromCenterAndPoints(
    center: IVec2,
    startPoint: IVec2,
    endPoint: IVec2,
    style?: Partial<EntityStyle>,
  ): ArcEntity {
    const radius = distancePointToPoint(center, startPoint);
    const startAngle = Math.atan2(
      startPoint.y - center.y,
      startPoint.x - center.x,
    );
    const endAngle = Math.atan2(endPoint.y - center.y, endPoint.x - center.x);
    return new ArcEntity(center, radius, startAngle, endAngle, { style });
  }

  /** Tạo từ 3 điểm trên cung */
  static from3Points(
    startPoint: IVec2,
    midPoint: IVec2,
    endPoint: IVec2,
    style?: Partial<EntityStyle>,
  ): ArcEntity | null {
    // Tính tâm đường tròn qua 3 điểm
    const ax = startPoint.x,
      ay = startPoint.y;
    const bx = midPoint.x,
      by = midPoint.y;
    const cx = endPoint.x,
      cy = endPoint.y;

    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < EPSILON) return null;

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
    const radius = distancePointToPoint(center, startPoint);
    const startAngle = Math.atan2(ay - uy, ax - ux);
    const endAngle = Math.atan2(cy - uy, cx - ux);

    return new ArcEntity(center, radius, startAngle, endAngle, { style });
  }

  static fromJSON(json: EntityJSON): ArcEntity {
    const arc = new ArcEntity(
      json.center as IVec2,
      json.radius as number,
      json.startAngle as number,
      json.endAngle as number,
      {
        id: json.id,
        name: json.name,
        layerId: json.layerId,
        style: json.style,
      },
    );
    arc.metadata = json.metadata;
    return arc;
  }

  // ==================== Geometry ====================

  /** Điểm đầu */
  getStartPoint(): Vec2 {
    return this.getPointAtAngle(this.startAngle);
  }

  /** Điểm cuối */
  getEndPoint(): Vec2 {
    return this.getPointAtAngle(this.endAngle);
  }

  /** Điểm giữa cung */
  getMidPoint(): Vec2 {
    const midAngle = this.startAngle + this.getSweepAngle() / 2;
    return this.getPointAtAngle(midAngle);
  }

  /** Điểm tại góc */
  getPointAtAngle(angle: number): Vec2 {
    return new Vec2(
      this.center.x + this.radius * Math.cos(angle),
      this.center.y + this.radius * Math.sin(angle),
    );
  }

  /** Góc quét (luôn dương) */
  getSweepAngle(): number {
    let sweep = this.endAngle - this.startAngle;
    if (sweep < 0) sweep += Math.PI * 2;
    return sweep;
  }

  /** Góc quét (độ) */
  getSweepAngleDeg(): number {
    return (this.getSweepAngle() * 180) / Math.PI;
  }

  /** Độ dài cung */
  getArcLength(): number {
    return this.radius * this.getSweepAngle();
  }

  /** Diện tích hình quạt */
  getSectorArea(): number {
    return 0.5 * this.radius * this.radius * this.getSweepAngle();
  }

  /** Kiểm tra góc có nằm trong cung */
  containsAngle(angle: number): boolean {
    const normalStart = normalizeAngle(this.startAngle);
    const normalEnd = normalizeAngle(this.endAngle);
    const normalAngle = normalizeAngle(angle);

    if (normalStart <= normalEnd) {
      return normalAngle >= normalStart && normalAngle <= normalEnd;
    } else {
      // Cung đi qua 0
      return normalAngle >= normalStart || normalAngle <= normalEnd;
    }
  }

  // ==================== BaseEntity Implementation ====================

  clone(): ArcEntity {
    const cloned = new ArcEntity(
      this.center.clone(),
      this.radius,
      this.startAngle,
      this.endAngle,
      { layerId: this.layerId, style: { ...this.style }, name: this.name },
    );
    cloned.state = { ...this.state };
    cloned.metadata = this.metadata ? { ...this.metadata } : undefined;
    return cloned;
  }

  getBounds(): BoundingBox {
    const points: Vec2[] = [this.getStartPoint(), this.getEndPoint()];

    // Thêm các điểm quadrant nếu cung đi qua
    const quadrantAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (const angle of quadrantAngles) {
      if (this.containsAngle(angle)) {
        points.push(this.getPointAtAngle(angle));
      }
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      min: new Vec2(minX, minY),
      max: new Vec2(maxX, maxY),
    };
  }

  containsPoint(point: IVec2, tolerance: number = 5): boolean {
    const distance = distancePointToPoint(point, this.center);

    // Kiểm tra khoảng cách đến đường tròn
    if (Math.abs(distance - this.radius) > tolerance) {
      return false;
    }

    // Kiểm tra góc có nằm trong cung
    const angle = Math.atan2(point.y - this.center.y, point.x - this.center.x);
    return this.containsAngle(angle);
  }

  getGripPoints(): GripPoint[] {
    return [
      createGripPoint(this.center, GripType.CENTER, this.id, 0),
      createGripPoint(this.getStartPoint(), GripType.ENDPOINT, this.id, 1),
      createGripPoint(this.getMidPoint(), GripType.MIDPOINT, this.id, 2),
      createGripPoint(this.getEndPoint(), GripType.ENDPOINT, this.id, 3),
    ];
  }

  moveGripPoint(gripIndex: number, newPosition: IVec2): void {
    switch (gripIndex) {
      case 0: // Center
        this.center.copy(newPosition);
        break;
      case 1: // Start point
        this.startAngle = Math.atan2(
          newPosition.y - this.center.y,
          newPosition.x - this.center.x,
        );
        break;
      case 2: // Mid point - change radius
        this.radius = distancePointToPoint(this.center, newPosition);
        break;
      case 3: // End point
        this.endAngle = Math.atan2(
          newPosition.y - this.center.y,
          newPosition.x - this.center.x,
        );
        break;
    }
  }

  getPoints(): Vec2[] {
    return [this.center];
  }

  translate(dx: number, dy: number): void {
    this.center.addSelf({ x: dx, y: dy });
  }

  rotate(angle: number, center: IVec2): void {
    const rotated = this.center.rotateAround(center, angle);
    this.center.copy(rotated);
    this.startAngle += angle;
    this.endAngle += angle;
  }

  // ==================== Serialization ====================

  toJSON(): EntityJSON {
    return {
      ...serializeEntityBase(this),
      type: this.type,
      center: this.center.toObject(),
      radius: this.radius,
      startAngle: this.startAngle,
      endAngle: this.endAngle,
    } as EntityJSON;
  }
}
