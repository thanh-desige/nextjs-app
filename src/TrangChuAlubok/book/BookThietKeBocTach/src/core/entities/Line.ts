/**
 * Line Entity - Đoạn thẳng trong CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import {
  BoundingBox,
  distancePointToSegment,
  midpoint,
} from "../geometry/GeometryUtils";
import {
  initEntityBase,
  createGripPoint,
  copyEntityBase,
  serializeEntityBase,
} from "./EntityBaseUtils";
import { DEFAULT_STYLE, DEFAULT_STATE } from "./Entity.types";
import {
  EntityType,
  EntityStyle,
  EntityJSON,
  GripPoint,
  GripType,
  ILineEntity,
} from "./Entity.types";

export class LineEntity implements ILineEntity {
  public id: string;
  public readonly type = EntityType.LINE;
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
  public start: Vec2;
  public end: Vec2;

  constructor(
    start: IVec2,
    end: IVec2,
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
    this.start = Vec2.from(start);
    this.end = Vec2.from(end);
  }

  // ==================== Factory Methods ====================

  static create(
    start: IVec2,
    end: IVec2,
    style?: Partial<EntityStyle>,
  ): LineEntity {
    return new LineEntity(start, end, { style });
  }

  static fromJSON(json: EntityJSON): LineEntity {
    const line = new LineEntity(json.start as IVec2, json.end as IVec2, {
      id: json.id,
      name: json.name,
      layerId: json.layerId,
      style: json.style,
    });
    line.metadata = json.metadata;
    return line;
  }

  // ==================== Geometry ====================

  /** Độ dài đoạn thẳng */
  getLength(): number {
    return this.start.distanceTo(this.end);
  }

  /** Góc của đoạn thẳng (radian) */
  getAngle(): number {
    return this.start.angleTo(this.end);
  }

  /** Góc của đoạn thẳng (độ) */
  getAngleDeg(): number {
    return this.start.angleToDeg(this.end);
  }

  /** Vector hướng */
  getDirection(): Vec2 {
    return this.end.sub(this.start).normalize();
  }

  /** Điểm giữa */
  getMidpoint(): Vec2 {
    return midpoint(this.start, this.end);
  }

  /** Điểm tại tham số t (0-1) */
  getPointAt(t: number): Vec2 {
    return this.start.lerp(this.end, t);
  }

  // ==================== BaseEntity Implementation ====================

  clone(): LineEntity {
    const cloned = new LineEntity(this.start.clone(), this.end.clone(), {
      layerId: this.layerId,
      style: { ...this.style },
      name: this.name,
    });
    cloned.state = { ...this.state };
    cloned.metadata = this.metadata ? { ...this.metadata } : undefined;
    return cloned;
  }

  getBounds(): BoundingBox {
    return {
      min: new Vec2(
        Math.min(this.start.x, this.end.x),
        Math.min(this.start.y, this.end.y),
      ),
      max: new Vec2(
        Math.max(this.start.x, this.end.x),
        Math.max(this.start.y, this.end.y),
      ),
    };
  }

  containsPoint(point: IVec2, tolerance: number = 5): boolean {
    const distance = distancePointToSegment(point, this.start, this.end);
    return distance <= tolerance;
  }

  getGripPoints(): GripPoint[] {
    return [
      createGripPoint(this.start, GripType.ENDPOINT, this.id, 0),
      createGripPoint(this.getMidpoint(), GripType.MIDPOINT, this.id),
      createGripPoint(this.end, GripType.ENDPOINT, this.id, 1),
    ];
  }

  moveGripPoint(gripIndex: number, newPosition: IVec2): void {
    switch (gripIndex) {
      case 0: // Start point
        this.start.copy(newPosition);
        break;
      case 1: // Midpoint - move cả 2 đầu
        const mid = this.getMidpoint();
        const dx = newPosition.x - mid.x;
        const dy = newPosition.y - mid.y;
        this.start.addSelf({ x: dx, y: dy });
        this.end.addSelf({ x: dx, y: dy });
        break;
      case 2: // End point
        this.end.copy(newPosition);
        break;
    }
  }

  getPoints(): Vec2[] {
    return [this.start, this.end];
  }

  // ==================== Line-specific Transform ====================

  /** Set endpoints */
  setEndpoints(start: IVec2, end: IVec2): void {
    this.start.copy(start);
    this.end.copy(end);
  }

  /** Extend đoạn thẳng theo tỷ lệ */
  extend(startFactor: number, endFactor: number): void {
    const dir = this.getDirection();
    const len = this.getLength();

    this.start.subSelf(dir.mul(len * startFactor));
    this.end.addSelf(dir.mul(len * endFactor));
  }

  /** Trim đoạn thẳng tại t */
  trimAt(t: number, keepStart: boolean = true): void {
    const splitPoint = this.getPointAt(t);
    if (keepStart) {
      this.end.copy(splitPoint);
    } else {
      this.start.copy(splitPoint);
    }
  }

  /** Offset đoạn thẳng */
  offset(distance: number): LineEntity {
    const dir = this.getDirection();
    const perpendicular = dir.perpendicular().mul(distance);

    return new LineEntity(
      this.start.add(perpendicular),
      this.end.add(perpendicular),
      { style: { ...this.style }, layerId: this.layerId },
    );
  }

  // ==================== Serialization ====================

  toJSON(): EntityJSON {
    return {
      ...serializeEntityBase(this),
      type: this.type,
      start: this.start.toObject(),
      end: this.end.toObject(),
    } as EntityJSON;
  }
}
