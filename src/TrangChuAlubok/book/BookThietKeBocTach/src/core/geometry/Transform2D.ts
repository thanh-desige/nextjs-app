/**
 * Transform2D - Wrapper cho Matrix3 với API thân thiện hơn
 * Dùng để quản lý biến đổi của entity trong CAD
 */

import { Vec2, IVec2 } from "./Vec2";
import { Matrix3 } from "./Matrix3";

export class Transform2D {
  private _position: Vec2;
  private _rotation: number; // radian
  private _scale: Vec2;
  private _matrix: Matrix3 | null = null;
  private _inverseMatrix: Matrix3 | null = null;

  constructor(
    position: IVec2 = { x: 0, y: 0 },
    rotation: number = 0,
    scale: IVec2 = { x: 1, y: 1 }
  ) {
    this._position = Vec2.from(position);
    this._rotation = rotation;
    this._scale = Vec2.from(scale);
  }

  // ==================== Static Factory Methods ====================

  static identity(): Transform2D {
    return new Transform2D();
  }

  static fromMatrix(matrix: Matrix3): Transform2D {
    const { translation, rotation, scale } = matrix.decompose();
    return new Transform2D(translation, rotation, scale);
  }

  // ==================== Getters & Setters ====================

  get position(): Vec2 {
    return this._position.clone();
  }

  set position(value: IVec2) {
    this._position.copy(value);
    this.invalidate();
  }

  get x(): number {
    return this._position.x;
  }

  set x(value: number) {
    this._position.x = value;
    this.invalidate();
  }

  get y(): number {
    return this._position.y;
  }

  set y(value: number) {
    this._position.y = value;
    this.invalidate();
  }

  get rotation(): number {
    return this._rotation;
  }

  set rotation(value: number) {
    this._rotation = value;
    this.invalidate();
  }

  get rotationDeg(): number {
    return (this._rotation * 180) / Math.PI;
  }

  set rotationDeg(value: number) {
    this._rotation = (value * Math.PI) / 180;
    this.invalidate();
  }

  get scale(): Vec2 {
    return this._scale.clone();
  }

  set scale(value: IVec2) {
    this._scale.copy(value);
    this.invalidate();
  }

  get scaleX(): number {
    return this._scale.x;
  }

  set scaleX(value: number) {
    this._scale.x = value;
    this.invalidate();
  }

  get scaleY(): number {
    return this._scale.y;
  }

  set scaleY(value: number) {
    this._scale.y = value;
    this.invalidate();
  }

  // ==================== Matrix ====================

  /** Invalidate cached matrices */
  private invalidate(): void {
    this._matrix = null;
    this._inverseMatrix = null;
  }

  /** Lấy ma trận biến đổi (lazy computation) */
  get matrix(): Matrix3 {
    if (!this._matrix) {
      this._matrix = Matrix3.translation(this._position.x, this._position.y)
        .rotate(this._rotation)
        .scale(this._scale.x, this._scale.y);
    }
    return this._matrix.clone();
  }

  /** Lấy ma trận nghịch đảo */
  get inverseMatrix(): Matrix3 | null {
    if (!this._inverseMatrix) {
      this._inverseMatrix = this.matrix.inverse();
    }
    return this._inverseMatrix?.clone() ?? null;
  }

  // ==================== Transform Operations ====================

  /** Translate */
  translate(dx: number, dy: number): this {
    this._position.x += dx;
    this._position.y += dy;
    this.invalidate();
    return this;
  }

  /** Translate by vector */
  translateBy(delta: IVec2): this {
    return this.translate(delta.x, delta.y);
  }

  /** Rotate (radian) */
  rotate(angle: number): this {
    this._rotation += angle;
    this.invalidate();
    return this;
  }

  /** Rotate (độ) */
  rotateDeg(angleDeg: number): this {
    return this.rotate((angleDeg * Math.PI) / 180);
  }

  /** Scale uniform */
  scaleUniform(factor: number): this {
    this._scale.x *= factor;
    this._scale.y *= factor;
    this.invalidate();
    return this;
  }

  /** Scale non-uniform */
  scaleBy(sx: number, sy: number = sx): this {
    this._scale.x *= sx;
    this._scale.y *= sy;
    this.invalidate();
    return this;
  }

  // ==================== Point Transformation ====================

  /** Biến đổi điểm từ local space sang world space */
  transformPoint(localPoint: IVec2): Vec2 {
    return this.matrix.transformPoint(localPoint);
  }

  /** Biến đổi điểm từ world space sang local space */
  inverseTransformPoint(worldPoint: IVec2): Vec2 | null {
    const inv = this.inverseMatrix;
    return inv ? inv.transformPoint(worldPoint) : null;
  }

  /** Biến đổi vector (không áp dụng translation) */
  transformVector(localVector: IVec2): Vec2 {
    return this.matrix.transformVector(localVector);
  }

  /** Biến đổi mảng điểm */
  transformPoints(localPoints: IVec2[]): Vec2[] {
    return this.matrix.transformPoints(localPoints);
  }

  // ==================== Combine Transforms ====================

  /** Kết hợp với transform khác: this * other */
  combine(other: Transform2D): Transform2D {
    const combined = this.matrix.multiply(other.matrix);
    return Transform2D.fromMatrix(combined);
  }

  /** Apply transform khác lên this */
  apply(other: Transform2D): this {
    const combined = this.combine(other);
    this._position.copy(combined._position);
    this._rotation = combined._rotation;
    this._scale.copy(combined._scale);
    this.invalidate();
    return this;
  }

  // ==================== Utility ====================

  /** Clone */
  clone(): Transform2D {
    return new Transform2D(
      this._position.clone(),
      this._rotation,
      this._scale.clone()
    );
  }

  /** Reset về identity */
  reset(): this {
    this._position.set(0, 0);
    this._rotation = 0;
    this._scale.set(1, 1);
    this.invalidate();
    return this;
  }

  /** Copy từ transform khác */
  copy(other: Transform2D): this {
    this._position.copy(other._position);
    this._rotation = other._rotation;
    this._scale.copy(other._scale);
    this.invalidate();
    return this;
  }

  /** So sánh bằng */
  equals(other: Transform2D, epsilon: number = 1e-10): boolean {
    return (
      this._position.equals(other._position, epsilon) &&
      Math.abs(this._rotation - other._rotation) < epsilon &&
      this._scale.equals(other._scale, epsilon)
    );
  }

  /** Kiểm tra là identity */
  isIdentity(epsilon: number = 1e-10): boolean {
    return (
      this._position.isZero(epsilon) &&
      Math.abs(this._rotation) < epsilon &&
      Math.abs(this._scale.x - 1) < epsilon &&
      Math.abs(this._scale.y - 1) < epsilon
    );
  }

  /** Serialize */
  toJSON(): object {
    return {
      position: this._position.toObject(),
      rotation: this._rotation,
      scale: this._scale.toObject(),
    };
  }

  /** Deserialize */
  static fromJSON(json: {
    position: IVec2;
    rotation: number;
    scale: IVec2;
  }): Transform2D {
    return new Transform2D(json.position, json.rotation, json.scale);
  }

  /** Convert sang string */
  toString(): string {
    return `Transform2D(pos: ${this._position.toString()}, rot: ${this.rotationDeg.toFixed(
      1
    )}°, scale: ${this._scale.toString()})`;
  }
}
