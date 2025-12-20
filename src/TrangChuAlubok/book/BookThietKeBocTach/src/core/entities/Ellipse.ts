/**
 * Ellipse Entity - Hình elip trong CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { Matrix3 } from "../geometry/Matrix3";
import { BoundingBox, distancePointToPoint } from "../geometry/GeometryUtils";
import { BaseEntity, createGripPoint } from "./BaseEntity";
import {
  EntityType,
  EntityStyle,
  EntityJSON,
  GripPoint,
  GripType,
  IEllipseEntity,
} from "./Entity.types";

export class EllipseEntity extends BaseEntity implements IEllipseEntity {
  public readonly type = EntityType.ELLIPSE;
  public center: Vec2;
  public radiusX: number; // Major axis
  public radiusY: number; // Minor axis
  public rotation: number; // Radian

  constructor(
    center: IVec2,
    radiusX: number,
    radiusY: number,
    options?: {
      id?: string;
      name?: string;
      layerId?: string;
      style?: Partial<EntityStyle>;
      rotation?: number;
    }
  ) {
    super(options);
    this.center = Vec2.from(center);
    this.radiusX = Math.abs(radiusX);
    this.radiusY = Math.abs(radiusY);
    this.rotation = options?.rotation ?? 0;
  }

  // ==================== Factory Methods ====================

  static create(
    center: IVec2,
    radiusX: number,
    radiusY: number,
    rotation: number = 0,
    style?: Partial<EntityStyle>
  ): EllipseEntity {
    return new EllipseEntity(center, radiusX, radiusY, { rotation, style });
  }

  /**
   * Tạo ellipse từ center, điểm cuối trục chính, và khoảng cách trục phụ
   * @param center Tâm ellipse
   * @param axisEnd Điểm cuối trục chính (xác định radiusX và rotation)
   * @param minorRadius Bán kính trục phụ
   */
  static fromAxisEndpoint(
    center: IVec2,
    axisEnd: IVec2,
    minorRadius: number,
    style?: Partial<EntityStyle>
  ): EllipseEntity {
    const radiusX = distancePointToPoint(center, axisEnd);
    const rotation = Math.atan2(axisEnd.y - center.y, axisEnd.x - center.x);
    return new EllipseEntity(center, radiusX, minorRadius, { rotation, style });
  }

  static fromJSON(json: EntityJSON): EllipseEntity {
    const entity = new EllipseEntity(
      json.center as IVec2,
      json.radiusX as number,
      json.radiusY as number,
      {
        id: json.id,
        name: json.name,
        layerId: json.layerId,
        style: json.style,
        rotation: json.rotation as number,
      }
    );
    entity.metadata = json.metadata;
    return entity;
  }

  // ==================== Geometry ====================

  /** Diện tích ellipse */
  getArea(): number {
    return Math.PI * this.radiusX * this.radiusY;
  }

  /** Chu vi ellipse (xấp xỉ Ramanujan) */
  getPerimeter(): number {
    const a = this.radiusX;
    const b = this.radiusY;
    const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  }

  /** Lấy điểm trên ellipse theo góc theta (0-2PI) */
  getPointAtAngle(theta: number): Vec2 {
    // Điểm trên ellipse chưa xoay
    const x = this.radiusX * Math.cos(theta);
    const y = this.radiusY * Math.sin(theta);

    // Xoay theo rotation
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    return new Vec2(
      this.center.x + x * cos - y * sin,
      this.center.y + x * sin + y * cos
    );
  }

  /** Lấy điểm cuối trục chính */
  getMajorAxisEnd(): Vec2 {
    return this.getPointAtAngle(0);
  }

  /** Lấy điểm cuối trục phụ */
  getMinorAxisEnd(): Vec2 {
    return this.getPointAtAngle(Math.PI / 2);
  }

  // ==================== BaseEntity Implementation ====================

  clone(): EllipseEntity {
    const cloned = new EllipseEntity(
      this.center.clone(),
      this.radiusX,
      this.radiusY,
      { rotation: this.rotation }
    );
    cloned.copyBaseFrom(this);
    return cloned;
  }

  getBounds(): BoundingBox {
    // Tính bounding box cho ellipse xoay
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    // Các điểm cực trị theo x và y
    const ux = this.radiusX * cos;
    const uy = this.radiusX * sin;
    const vx = this.radiusY * sin;
    const vy = this.radiusY * cos;

    const halfWidth = Math.sqrt(ux * ux + vx * vx);
    const halfHeight = Math.sqrt(uy * uy + vy * vy);

    return {
      min: new Vec2(this.center.x - halfWidth, this.center.y - halfHeight),
      max: new Vec2(this.center.x + halfWidth, this.center.y + halfHeight),
    };
  }

  containsPoint(point: IVec2, tolerance: number = 5): boolean {
    // Transform point về hệ tọa độ ellipse (không xoay)
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);

    const dx = point.x - this.center.x;
    const dy = point.y - this.center.y;

    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Kiểm tra điểm có trên đường ellipse không
    // (x/a)^2 + (y/b)^2 = 1
    const normalizedDistance =
      (localX * localX) / (this.radiusX * this.radiusX) +
      (localY * localY) / (this.radiusY * this.radiusY);

    // Điểm nằm trên đường viền nếu normalized distance gần 1
    return (
      Math.abs(Math.sqrt(normalizedDistance) - 1) *
        Math.max(this.radiusX, this.radiusY) <=
      tolerance
    );
  }

  getGripPoints(): GripPoint[] {
    return [
      // Center
      createGripPoint(this.center, GripType.CENTER, this.id, 0),
      // Major axis ends
      createGripPoint(this.getPointAtAngle(0), GripType.ENDPOINT, this.id, 1),
      createGripPoint(
        this.getPointAtAngle(Math.PI),
        GripType.ENDPOINT,
        this.id,
        2
      ),
      // Minor axis ends
      createGripPoint(
        this.getPointAtAngle(Math.PI / 2),
        GripType.ENDPOINT,
        this.id,
        3
      ),
      createGripPoint(
        this.getPointAtAngle((3 * Math.PI) / 2),
        GripType.ENDPOINT,
        this.id,
        4
      ),
    ];
  }

  moveGripPoint(gripIndex: number, newPosition: IVec2): void {
    switch (gripIndex) {
      case 0:
        // Move center
        this.center = Vec2.from(newPosition);
        break;
      case 1:
      case 2:
        // Adjust major axis
        const newRadiusX = distancePointToPoint(this.center, newPosition);
        const newRotation = Math.atan2(
          newPosition.y - this.center.y,
          newPosition.x - this.center.x
        );
        this.radiusX = newRadiusX;
        this.rotation = gripIndex === 1 ? newRotation : newRotation + Math.PI;
        break;
      case 3:
      case 4:
        // Adjust minor axis
        this.radiusY = distancePointToPoint(this.center, newPosition);
        break;
    }
  }

  /** Lấy các điểm định nghĩa entity */
  getPoints(): Vec2[] {
    // Trả về center và các điểm trên trục
    return [
      this.center,
      this.getPointAtAngle(0),
      this.getPointAtAngle(Math.PI / 2),
      this.getPointAtAngle(Math.PI),
      this.getPointAtAngle((3 * Math.PI) / 2),
    ];
  }

  translate(dx: number, dy: number): void {
    this.center = this.center.add(new Vec2(dx, dy));
  }

  rotate(angle: number, pivot: IVec2): void {
    // Rotate center around pivot
    const matrix = Matrix3.rotationAround(pivot, angle);
    this.center = matrix.transformPoint(this.center);
    // Update ellipse rotation
    this.rotation += angle;
  }

  scale(sx: number, sy: number, pivot: IVec2): void {
    // Scale center position
    this.center = new Vec2(
      pivot.x + (this.center.x - pivot.x) * sx,
      pivot.y + (this.center.y - pivot.y) * sy
    );

    // Scale radii (average for non-uniform scale to maintain ellipse shape)
    this.radiusX *= Math.abs(sx);
    this.radiusY *= Math.abs(sy);
  }

  toJSON(): EntityJSON {
    return {
      ...this.serializeBase(),
      type: this.type,
      center: { x: this.center.x, y: this.center.y },
      radiusX: this.radiusX,
      radiusY: this.radiusY,
      rotation: this.rotation,
    } as EntityJSON;
  }
}
