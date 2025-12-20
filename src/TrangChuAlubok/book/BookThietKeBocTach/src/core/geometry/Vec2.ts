/**
 * Vec2 - Lớp Vector 2D cơ bản cho CAD
 * Đây là nền tảng cho mọi phép tính hình học
 */

export interface IVec2 {
  x: number;
  y: number;
}

export class Vec2 implements IVec2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  // ==================== Static Factory Methods ====================

  /** Tạo vector zero (0, 0) */
  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  /** Tạo vector đơn vị theo trục X */
  static unitX(): Vec2 {
    return new Vec2(1, 0);
  }

  /** Tạo vector đơn vị theo trục Y */
  static unitY(): Vec2 {
    return new Vec2(0, 1);
  }

  /** Tạo Vec2 từ object có x, y */
  static from(obj: IVec2): Vec2 {
    return new Vec2(obj.x, obj.y);
  }

  /** Tạo Vec2 từ góc (radian) và độ dài */
  static fromAngle(angle: number, length: number = 1): Vec2 {
    return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  /** Tạo Vec2 từ góc (độ) và độ dài */
  static fromAngleDeg(angleDeg: number, length: number = 1): Vec2 {
    const rad = (angleDeg * Math.PI) / 180;
    return Vec2.fromAngle(rad, length);
  }

  // ==================== Instance Methods ====================

  /** Clone vector */
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  /** Set giá trị x, y */
  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /** Copy từ vector khác */
  copy(v: IVec2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  // ==================== Arithmetic Operations ====================

  /** Cộng vector */
  add(v: IVec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  /** Trừ vector */
  sub(v: IVec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  /** Nhân với scalar */
  mul(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  /** Chia cho scalar */
  div(scalar: number): Vec2 {
    if (scalar === 0) throw new Error("Cannot divide by zero");
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  /** Đảo dấu */
  negate(): Vec2 {
    return new Vec2(-this.x, -this.y);
  }

  // ==================== In-place Operations (Mutating) ====================

  /** Cộng tại chỗ */
  addSelf(v: IVec2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /** Trừ tại chỗ */
  subSelf(v: IVec2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /** Nhân tại chỗ */
  mulSelf(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /** Chia tại chỗ */
  divSelf(scalar: number): this {
    if (scalar === 0) throw new Error("Cannot divide by zero");
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  // ==================== Vector Operations ====================

  /** Tích vô hướng (dot product) */
  dot(v: IVec2): number {
    return this.x * v.x + this.y * v.y;
  }

  /** Tích có hướng 2D (cross product - trả về scalar) */
  cross(v: IVec2): number {
    return this.x * v.y - this.y * v.x;
  }

  /** Độ dài vector */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** Bình phương độ dài (nhanh hơn, dùng để so sánh) */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /** Chuẩn hóa vector (độ dài = 1) */
  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) return new Vec2(0, 0);
    return this.div(len);
  }

  /** Chuẩn hóa tại chỗ */
  normalizeSelf(): this {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  /** Khoảng cách đến vector khác */
  distanceTo(v: IVec2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Bình phương khoảng cách */
  distanceToSquared(v: IVec2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  /** Góc của vector (radian) */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /** Góc của vector (độ) */
  angleDeg(): number {
    return (this.angle() * 180) / Math.PI;
  }

  /** Góc giữa 2 vector (radian) */
  angleTo(v: IVec2): number {
    return Math.atan2(v.y - this.y, v.x - this.x);
  }

  /** Góc giữa 2 vector (độ) */
  angleToDeg(v: IVec2): number {
    return (this.angleTo(v) * 180) / Math.PI;
  }

  // ==================== Transformation ====================

  /** Xoay vector quanh gốc tọa độ (radian) */
  rotate(angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  /** Xoay vector quanh gốc tọa độ (độ) */
  rotateDeg(angleDeg: number): Vec2 {
    return this.rotate((angleDeg * Math.PI) / 180);
  }

  /** Xoay quanh một điểm */
  rotateAround(center: IVec2, angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = this.x - center.x;
    const dy = this.y - center.y;
    return new Vec2(
      center.x + dx * cos - dy * sin,
      center.y + dx * sin + dy * cos
    );
  }

  /** Vector vuông góc (quay 90 độ ngược chiều kim đồng hồ) */
  perpendicular(): Vec2 {
    return new Vec2(-this.y, this.x);
  }

  /** Vector phản xạ qua normal */
  reflect(normal: IVec2): Vec2 {
    const n = Vec2.from(normal).normalize();
    const dot = this.dot(n);
    return new Vec2(this.x - 2 * dot * n.x, this.y - 2 * dot * n.y);
  }

  /** Nội suy tuyến tính (lerp) */
  lerp(v: IVec2, t: number): Vec2 {
    return new Vec2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
  }

  /** Điểm giữa */
  midpoint(v: IVec2): Vec2 {
    return this.lerp(v, 0.5);
  }

  // ==================== Comparison ====================

  /** So sánh bằng (với epsilon) */
  equals(v: IVec2, epsilon: number = 1e-10): boolean {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  /** Kiểm tra vector zero */
  isZero(epsilon: number = 1e-10): boolean {
    return Math.abs(this.x) < epsilon && Math.abs(this.y) < epsilon;
  }

  // ==================== Utility ====================

  /** Làm tròn */
  round(): Vec2 {
    return new Vec2(Math.round(this.x), Math.round(this.y));
  }

  /** Làm tròn xuống */
  floor(): Vec2 {
    return new Vec2(Math.floor(this.x), Math.floor(this.y));
  }

  /** Làm tròn lên */
  ceil(): Vec2 {
    return new Vec2(Math.ceil(this.x), Math.ceil(this.y));
  }

  /** Giới hạn trong khoảng */
  clamp(min: IVec2, max: IVec2): Vec2 {
    return new Vec2(
      Math.max(min.x, Math.min(max.x, this.x)),
      Math.max(min.y, Math.min(max.y, this.y))
    );
  }

  /** Convert sang array */
  toArray(): [number, number] {
    return [this.x, this.y];
  }

  /** Convert sang object */
  toObject(): IVec2 {
    return { x: this.x, y: this.y };
  }

  /** Convert sang string */
  toString(precision: number = 2): string {
    return `(${this.x.toFixed(precision)}, ${this.y.toFixed(precision)})`;
  }
}

// Export type alias cho dễ sử dụng
export type Point2D = Vec2;
export const Point2D = Vec2;
