/**
 * Dimension Entity - Kích thước trong CAD
 * Dùng để hiển thị và đo kích thước giữa 2 điểm
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { Matrix3 } from "../geometry/Matrix3";
import {
  BoundingBox,
  boundingBoxFromPoints,
  distancePointToPoint,
  distancePointToSegment,
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
  IDimensionEntity,
} from "./Entity.types";

export interface DimensionStyle {
  /** Chiều cao chữ */
  textHeight: number;
  /** Độ dài mũi tên */
  arrowSize: number;
  /** Khoảng cách từ điểm đo đến đường extension */
  extensionOffset: number;
  /** Khoảng vượt quá của extension line */
  extensionOvershoot: number;
  /** Độ chính xác thập phân */
  precision: number;
  /** Đơn vị hiển thị */
  unit: "mm" | "cm" | "m" | "in";
  /** Hệ số chuyển đổi đơn vị */
  unitScale: number;
}

const DEFAULT_DIMENSION_STYLE: DimensionStyle = {
  textHeight: 10,
  arrowSize: 8,
  extensionOffset: 2,
  extensionOvershoot: 2,
  precision: 0,
  unit: "mm",
  unitScale: 1,
};

export class DimensionEntity implements IDimensionEntity {
  public id: string;
  public readonly type = EntityType.DIMENSION;
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
  public startPoint: Vec2;
  public endPoint: Vec2;
  public textPosition: Vec2;
  public offset: number;
  public value?: number;
  public prefix?: string;
  public suffix?: string;
  public dimStyle: DimensionStyle;

  constructor(
    startPoint: IVec2,
    endPoint: IVec2,
    options?: {
      id?: string;
      name?: string;
      layerId?: string;
      style?: Partial<EntityStyle>;
      offset?: number;
      value?: number;
      prefix?: string;
      suffix?: string;
      dimStyle?: Partial<DimensionStyle>;
    },
  ) {
    const base = initEntityBase(options);
    this.id = base.id;
    this.name = base.name;
    this.layerId = base.layerId;
    this.style = base.style;
    this.state = base.state;
    this.metadata = base.metadata;
    this.startPoint = Vec2.from(startPoint);
    this.endPoint = Vec2.from(endPoint);
    this.offset = options?.offset ?? 30;
    this.value = options?.value;
    this.prefix = options?.prefix;
    this.suffix = options?.suffix ?? "mm";
    this.dimStyle = { ...DEFAULT_DIMENSION_STYLE, ...options?.dimStyle };

    // Tính vị trí text mặc định
    this.textPosition = this.calculateDefaultTextPosition();
  }

  // ==================== Factory Methods ====================

  static create(
    startPoint: IVec2,
    endPoint: IVec2,
    offset: number = 30,
    style?: Partial<EntityStyle>,
  ): DimensionEntity {
    return new DimensionEntity(startPoint, endPoint, { offset, style });
  }

  /** Tạo dimension ngang */
  static createHorizontal(
    startPoint: IVec2,
    endPoint: IVec2,
    yOffset: number,
    style?: Partial<EntityStyle>,
  ): DimensionEntity {
    const dim = new DimensionEntity(
      { x: startPoint.x, y: startPoint.y },
      { x: endPoint.x, y: startPoint.y },
      { style },
    );
    dim.offset = yOffset;
    dim.textPosition = dim.calculateDefaultTextPosition();
    return dim;
  }

  /** Tạo dimension dọc */
  static createVertical(
    startPoint: IVec2,
    endPoint: IVec2,
    xOffset: number,
    style?: Partial<EntityStyle>,
  ): DimensionEntity {
    const dim = new DimensionEntity(
      { x: startPoint.x, y: startPoint.y },
      { x: startPoint.x, y: endPoint.y },
      { style },
    );
    dim.offset = xOffset;
    dim.textPosition = dim.calculateDefaultTextPosition();
    return dim;
  }

  static fromJSON(json: EntityJSON): DimensionEntity {
    const dim = new DimensionEntity(
      json.startPoint as IVec2,
      json.endPoint as IVec2,
      {
        id: json.id,
        name: json.name,
        layerId: json.layerId,
        style: json.style,
        offset: json.offset as number,
        value: json.value as number | undefined,
        prefix: json.prefix as string | undefined,
        suffix: json.suffix as string | undefined,
        dimStyle: json.dimStyle as Partial<DimensionStyle>,
      },
    );
    dim.textPosition = Vec2.from(json.textPosition as IVec2);
    dim.metadata = json.metadata;
    return dim;
  }

  // ==================== Geometry ====================

  /** Tính giá trị đo */
  getMeasuredValue(): number {
    if (this.value !== undefined) return this.value;
    return (
      distancePointToPoint(this.startPoint, this.endPoint) *
      this.dimStyle.unitScale
    );
  }

  /** Lấy text hiển thị */
  getDisplayText(): string {
    const value = this.getMeasuredValue();
    const formatted = value.toFixed(this.dimStyle.precision);
    return `${this.prefix ?? ""}${formatted}${this.suffix ?? ""}`;
  }

  /** Tính vị trí text mặc định */
  calculateDefaultTextPosition(): Vec2 {
    const mid = this.startPoint.midpoint(this.endPoint);
    const dir = this.endPoint.sub(this.startPoint).normalize();
    const normal = dir.perpendicular();
    return mid.add(normal.mul(this.offset));
  }

  /** Lấy các điểm để vẽ dimension */
  getDimensionGeometry(): {
    dimLineStart: Vec2;
    dimLineEnd: Vec2;
    extLine1Start: Vec2;
    extLine1End: Vec2;
    extLine2Start: Vec2;
    extLine2End: Vec2;
    arrow1: Vec2[];
    arrow2: Vec2[];
    textPos: Vec2;
    textAngle: number;
  } {
    const dir = this.endPoint.sub(this.startPoint).normalize();
    const normal = dir.perpendicular();
    const offsetVec = normal.mul(this.offset);

    // Dimension line
    const dimLineStart = this.startPoint.add(offsetVec);
    const dimLineEnd = this.endPoint.add(offsetVec);

    // Extension lines
    const extOffset = normal.mul(this.dimStyle.extensionOffset);
    const extEnd = normal.mul(this.offset + this.dimStyle.extensionOvershoot);

    const extLine1Start = this.startPoint.add(extOffset);
    const extLine1End = this.startPoint.add(extEnd);
    const extLine2Start = this.endPoint.add(extOffset);
    const extLine2End = this.endPoint.add(extEnd);

    // Arrows
    const arrowSize = this.dimStyle.arrowSize;
    const arrow1 = this.createArrowHead(dimLineStart, dir, arrowSize);
    const arrow2 = this.createArrowHead(dimLineEnd, dir.negate(), arrowSize);

    // Text
    const textAngle = Math.atan2(dir.y, dir.x);

    return {
      dimLineStart,
      dimLineEnd,
      extLine1Start,
      extLine1End,
      extLine2Start,
      extLine2End,
      arrow1,
      arrow2,
      textPos: this.textPosition,
      textAngle,
    };
  }

  private createArrowHead(tip: Vec2, direction: Vec2, size: number): Vec2[] {
    const back = direction.negate().mul(size);
    const side = direction.perpendicular().mul(size * 0.3);

    return [tip, tip.add(back).add(side), tip.add(back).sub(side)];
  }

  // ==================== BaseEntity Implementation ====================

  clone(): DimensionEntity {
    const cloned = new DimensionEntity(
      this.startPoint.clone(),
      this.endPoint.clone(),
      {
        layerId: this.layerId,
        style: { ...this.style },
        name: this.name,
        offset: this.offset,
        value: this.value,
        prefix: this.prefix,
        suffix: this.suffix,
        dimStyle: { ...this.dimStyle },
      },
    );
    cloned.textPosition = this.textPosition.clone();
    cloned.state = { ...this.state };
    cloned.metadata = this.metadata ? { ...this.metadata } : undefined;
    return cloned;
  }

  getBounds(): BoundingBox {
    const geom = this.getDimensionGeometry();
    const points = [
      this.startPoint,
      this.endPoint,
      geom.dimLineStart,
      geom.dimLineEnd,
      geom.textPos,
    ];
    return boundingBoxFromPoints(points)!;
  }

  containsPoint(point: IVec2, tolerance: number = 5): boolean {
    const geom = this.getDimensionGeometry();

    // Check dimension line
    if (
      distancePointToSegment(point, geom.dimLineStart, geom.dimLineEnd) <=
      tolerance
    ) {
      return true;
    }

    // Check extension lines
    if (
      distancePointToSegment(point, geom.extLine1Start, geom.extLine1End) <=
      tolerance
    ) {
      return true;
    }
    if (
      distancePointToSegment(point, geom.extLine2Start, geom.extLine2End) <=
      tolerance
    ) {
      return true;
    }

    // Check text area (rough)
    const textWidth =
      this.getDisplayText().length * this.dimStyle.textHeight * 0.6;
    const textHeight = this.dimStyle.textHeight;
    if (
      Math.abs(point.x - geom.textPos.x) <= textWidth / 2 + tolerance &&
      Math.abs(point.y - geom.textPos.y) <= textHeight / 2 + tolerance
    ) {
      return true;
    }

    return false;
  }

  getGripPoints(): GripPoint[] {
    return [
      createGripPoint(this.startPoint, GripType.ENDPOINT, this.id, 0),
      createGripPoint(this.endPoint, GripType.ENDPOINT, this.id, 1),
      createGripPoint(this.textPosition, GripType.CONTROL, this.id, 2),
    ];
  }

  moveGripPoint(gripIndex: number, newPosition: IVec2): void {
    switch (gripIndex) {
      case 0:
        this.startPoint.copy(newPosition);
        this.textPosition = this.calculateDefaultTextPosition();
        break;
      case 1:
        this.endPoint.copy(newPosition);
        this.textPosition = this.calculateDefaultTextPosition();
        break;
      case 2:
        this.textPosition.copy(newPosition);
        // Cập nhật offset dựa trên vị trí text mới
        const mid = this.startPoint.midpoint(this.endPoint);
        const dir = this.endPoint.sub(this.startPoint).normalize();
        const normal = dir.perpendicular();
        const toText = Vec2.from(newPosition).sub(mid);
        this.offset = toText.dot(normal);
        break;
    }
  }

  getPoints(): Vec2[] {
    return [this.startPoint, this.endPoint, this.textPosition];
  }

  translate(dx: number, dy: number): void {
    this.startPoint.addSelf({ x: dx, y: dy });
    this.endPoint.addSelf({ x: dx, y: dy });
    this.textPosition.addSelf({ x: dx, y: dy });
  }

  rotate(angle: number, center: IVec2): void {
    const matrix = Matrix3.rotationAround(center, angle);
    this.startPoint = matrix.transformPoint(this.startPoint);
    this.endPoint = matrix.transformPoint(this.endPoint);
    this.textPosition = matrix.transformPoint(this.textPosition);
  }

  // ==================== Serialization ====================

  toJSON(): EntityJSON {
    return {
      ...serializeEntityBase(this),
      type: this.type,
      startPoint: this.startPoint.toObject(),
      endPoint: this.endPoint.toObject(),
      textPosition: this.textPosition.toObject(),
      offset: this.offset,
      value: this.value,
      prefix: this.prefix,
      suffix: this.suffix,
      dimStyle: { ...this.dimStyle },
    } as EntityJSON;
  }
}
