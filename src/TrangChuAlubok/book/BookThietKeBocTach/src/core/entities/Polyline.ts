/**
 * Polyline Entity - Đường gấp khúc trong CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import {
  BoundingBox,
  boundingBoxFromPoints,
  distancePointToSegment,
  polygonArea,
  polygonPerimeter,
  polygonCentroid,
  isPointInPolygon,
  midpoint,
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
  IPolylineEntity,
} from "./Entity.types";

export class PolylineEntity implements IPolylineEntity {
  public id: string;
  public readonly type = EntityType.POLYLINE;
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
  public points: Vec2[];
  public closed: boolean;

  constructor(
    points: IVec2[],
    options?: {
      id?: string;
      name?: string;
      layerId?: string;
      style?: Partial<EntityStyle>;
      closed?: boolean;
    },
  ) {
    const base = initEntityBase(options);
    this.id = base.id;
    this.name = base.name;
    this.layerId = base.layerId;
    this.style = base.style;
    this.state = base.state;
    this.metadata = base.metadata;
    this.points = points.map((p) => Vec2.from(p));
    this.closed = options?.closed ?? false;
  }

  // ==================== Factory Methods ====================

  static create(
    points: IVec2[],
    closed: boolean = false,
    style?: Partial<EntityStyle>,
  ): PolylineEntity {
    return new PolylineEntity(points, { closed, style });
  }

  /** Tạo hình chữ nhật từ 2 góc */
  static createRectangle(
    p1: IVec2,
    p2: IVec2,
    style?: Partial<EntityStyle>,
  ): PolylineEntity {
    const points = [
      { x: p1.x, y: p1.y },
      { x: p2.x, y: p1.y },
      { x: p2.x, y: p2.y },
      { x: p1.x, y: p2.y },
    ];
    return new PolylineEntity(points, { closed: true, style });
  }

  /** Tạo đa giác đều */
  static createRegularPolygon(
    center: IVec2,
    radius: number,
    sides: number,
    startAngle: number = 0,
    style?: Partial<EntityStyle>,
  ): PolylineEntity {
    const points: IVec2[] = [];
    const angleStep = (Math.PI * 2) / sides;

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    }

    return new PolylineEntity(points, { closed: true, style });
  }

  static fromJSON(json: EntityJSON): PolylineEntity {
    const polyline = new PolylineEntity(json.points as IVec2[], {
      id: json.id,
      name: json.name,
      layerId: json.layerId,
      style: json.style,
      closed: json.closed as boolean,
    });
    polyline.metadata = json.metadata;
    return polyline;
  }

  // ==================== Geometry ====================

  /** Số điểm */
  getPointCount(): number {
    return this.points.length;
  }

  /** Số đoạn */
  getSegmentCount(): number {
    if (this.points.length < 2) return 0;
    return this.closed ? this.points.length : this.points.length - 1;
  }

  /** Lấy đoạn thứ i */
  getSegment(index: number): [Vec2, Vec2] | null {
    const count = this.getSegmentCount();
    if (index < 0 || index >= count) return null;

    const start = this.points[index];
    const end = this.points[(index + 1) % this.points.length];
    return [start, end];
  }

  /** Tổng chiều dài */
  getLength(): number {
    return polygonPerimeter(this.closed ? this.points : this.points);
  }

  /** Diện tích (nếu closed) */
  getArea(): number {
    if (!this.closed || this.points.length < 3) return 0;
    return polygonArea(this.points);
  }

  /** Trọng tâm */
  getCentroid(): Vec2 | null {
    return polygonCentroid(this.points);
  }

  /** Điểm đầu */
  getFirstPoint(): Vec2 | null {
    return this.points.length > 0 ? this.points[0].clone() : null;
  }

  /** Điểm cuối */
  getLastPoint(): Vec2 | null {
    return this.points.length > 0
      ? this.points[this.points.length - 1].clone()
      : null;
  }

  // ==================== BaseEntity Implementation ====================

  clone(): PolylineEntity {
    const cloned = new PolylineEntity(
      this.points.map((p) => p.clone()),
      {
        closed: this.closed,
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
    return (
      boundingBoxFromPoints(this.points) ?? {
        min: new Vec2(0, 0),
        max: new Vec2(0, 0),
      }
    );
  }

  containsPoint(point: IVec2, tolerance: number = 5): boolean {
    // Kiểm tra fill nếu closed
    if (this.closed && this.style.fillColor && this.points.length >= 3) {
      if (isPointInPolygon(point, this.points)) return true;
    }

    // Kiểm tra trên các đoạn
    const segmentCount = this.getSegmentCount();
    for (let i = 0; i < segmentCount; i++) {
      const [start, end] = this.getSegment(i)!;
      const distance = distancePointToSegment(point, start, end);
      if (distance <= tolerance) return true;
    }

    return false;
  }

  getGripPoints(): GripPoint[] {
    const grips: GripPoint[] = [];

    // Grip tại mỗi điểm
    this.points.forEach((p, i) => {
      grips.push(createGripPoint(p, GripType.ENDPOINT, this.id, i));
    });

    // Grip tại điểm giữa mỗi đoạn
    const segmentCount = this.getSegmentCount();
    for (let i = 0; i < segmentCount; i++) {
      const [start, end] = this.getSegment(i)!;
      grips.push(
        createGripPoint(
          midpoint(start, end),
          GripType.MIDPOINT,
          this.id,
          this.points.length + i,
        ),
      );
    }

    return grips;
  }

  moveGripPoint(gripIndex: number, newPosition: IVec2): void {
    if (gripIndex < this.points.length) {
      // Di chuyển điểm
      this.points[gripIndex].copy(newPosition);
    } else {
      // Di chuyển midpoint = thêm điểm mới
      const segmentIndex = gripIndex - this.points.length;
      if (segmentIndex >= 0 && segmentIndex < this.getSegmentCount()) {
        this.insertPoint(segmentIndex + 1, newPosition);
      }
    }
  }

  getPoints(): Vec2[] {
    return this.points;
  }

  // ==================== Polyline-specific Methods ====================

  /** Thêm điểm vào cuối */
  addPoint(point: IVec2): void {
    this.points.push(Vec2.from(point));
  }

  /** Thêm điểm tại vị trí */
  insertPoint(index: number, point: IVec2): void {
    this.points.splice(index, 0, Vec2.from(point));
  }

  /** Xóa điểm tại vị trí */
  removePoint(index: number): void {
    if (index >= 0 && index < this.points.length) {
      this.points.splice(index, 1);
    }
  }

  /** Đóng polyline */
  close(): void {
    this.closed = true;
  }

  /** Mở polyline */
  open(): void {
    this.closed = false;
  }

  /** Đảo ngược hướng */
  reverse(): void {
    this.points.reverse();
  }

  /** Simplify (Douglas-Peucker) */
  simplify(tolerance: number): void {
    if (this.points.length <= 2) return;
    this.points = this.douglasPeucker(this.points, tolerance);
  }

  private douglasPeucker(points: Vec2[], tolerance: number): Vec2[] {
    if (points.length <= 2) return points;

    let maxDist = 0;
    let maxIndex = 0;

    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = distancePointToSegment(points[i], start, end);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    if (maxDist > tolerance) {
      const left = this.douglasPeucker(
        points.slice(0, maxIndex + 1),
        tolerance,
      );
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
      return [...left.slice(0, -1), ...right];
    }

    return [start, end];
  }

  /** Offset polyline */
  offset(distance: number): PolylineEntity {
    // Simple offset - di chuyển mỗi đoạn theo normal
    const newPoints: Vec2[] = [];

    for (let i = 0; i < this.points.length; i++) {
      const prevIndex = (i - 1 + this.points.length) % this.points.length;
      const nextIndex = (i + 1) % this.points.length;

      let normal: Vec2;

      if (!this.closed && i === 0) {
        // Điểm đầu
        const dir = this.points[1].sub(this.points[0]).normalize();
        normal = dir.perpendicular();
      } else if (!this.closed && i === this.points.length - 1) {
        // Điểm cuối
        const dir = this.points[i].sub(this.points[i - 1]).normalize();
        normal = dir.perpendicular();
      } else {
        // Điểm giữa - lấy trung bình normal
        const dir1 = this.points[i].sub(this.points[prevIndex]).normalize();
        const dir2 = this.points[nextIndex].sub(this.points[i]).normalize();
        const n1 = dir1.perpendicular();
        const n2 = dir2.perpendicular();
        normal = n1.add(n2).normalize();

        // Điều chỉnh độ dài để bù góc
        const dot = n1.dot(normal);
        if (Math.abs(dot) > 0.001) {
          normal = normal.mul(1 / dot);
        }
      }

      newPoints.push(this.points[i].add(normal.mul(distance)));
    }

    return new PolylineEntity(newPoints, {
      closed: this.closed,
      style: { ...this.style },
      layerId: this.layerId,
    });
  }

  // ==================== Serialization ====================

  toJSON(): EntityJSON {
    return {
      ...serializeEntityBase(this),
      type: this.type,
      points: this.points.map((p) => p.toObject()),
      closed: this.closed,
    } as EntityJSON;
  }
}
