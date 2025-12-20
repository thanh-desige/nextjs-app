/**
 * Matrix3 - Ma trận 3x3 cho biến đổi 2D
 * Dùng cho translate, rotate, scale, skew trong CAD
 */

import { Vec2, IVec2 } from "./Vec2";

/**
 * Ma trận 3x3 được lưu theo column-major order:
 * | a  c  tx |   | m[0]  m[3]  m[6] |
 * | b  d  ty | = | m[1]  m[4]  m[7] |
 * | 0  0  1  |   | m[2]  m[5]  m[8] |
 */
export class Matrix3 {
  public elements: Float64Array;

  constructor() {
    this.elements = new Float64Array([
      1,
      0,
      0, // column 0
      0,
      1,
      0, // column 1
      0,
      0,
      1, // column 2
    ]);
  }

  // ==================== Static Factory Methods ====================

  /** Ma trận đơn vị */
  static identity(): Matrix3 {
    return new Matrix3();
  }

  /** Ma trận dịch chuyển */
  static translation(tx: number, ty: number): Matrix3 {
    const m = new Matrix3();
    m.elements[6] = tx;
    m.elements[7] = ty;
    return m;
  }

  /** Ma trận xoay (radian) */
  static rotation(angle: number): Matrix3 {
    const m = new Matrix3();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    m.elements[0] = cos;
    m.elements[1] = sin;
    m.elements[3] = -sin;
    m.elements[4] = cos;
    return m;
  }

  /** Ma trận xoay (độ) */
  static rotationDeg(angleDeg: number): Matrix3 {
    return Matrix3.rotation((angleDeg * Math.PI) / 180);
  }

  /** Ma trận co giãn */
  static scaling(sx: number, sy: number = sx): Matrix3 {
    const m = new Matrix3();
    m.elements[0] = sx;
    m.elements[4] = sy;
    return m;
  }

  /** Ma trận xoay quanh một điểm */
  static rotationAround(center: IVec2, angle: number): Matrix3 {
    return Matrix3.translation(center.x, center.y)
      .multiply(Matrix3.rotation(angle))
      .multiply(Matrix3.translation(-center.x, -center.y));
  }

  /** Ma trận co giãn từ một điểm */
  static scalingFrom(center: IVec2, sx: number, sy: number = sx): Matrix3 {
    return Matrix3.translation(center.x, center.y)
      .multiply(Matrix3.scaling(sx, sy))
      .multiply(Matrix3.translation(-center.x, -center.y));
  }

  /** Tạo từ 6 giá trị affine (a, b, c, d, tx, ty) */
  static fromValues(
    a: number,
    b: number,
    c: number,
    d: number,
    tx: number,
    ty: number
  ): Matrix3 {
    const m = new Matrix3();
    m.elements[0] = a;
    m.elements[1] = b;
    m.elements[3] = c;
    m.elements[4] = d;
    m.elements[6] = tx;
    m.elements[7] = ty;
    return m;
  }

  // ==================== Instance Methods ====================

  /** Clone ma trận */
  clone(): Matrix3 {
    const m = new Matrix3();
    m.elements.set(this.elements);
    return m;
  }

  /** Copy từ ma trận khác */
  copy(m: Matrix3): this {
    this.elements.set(m.elements);
    return this;
  }

  /** Reset về ma trận đơn vị */
  identity(): this {
    this.elements.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    return this;
  }

  /** Lấy giá trị tại vị trí (row, col) */
  get(row: number, col: number): number {
    return this.elements[col * 3 + row];
  }

  /** Set giá trị tại vị trí (row, col) */
  set(row: number, col: number, value: number): this {
    this.elements[col * 3 + row] = value;
    return this;
  }

  // ==================== Transform Operations ====================

  /** Nhân 2 ma trận: this * m */
  multiply(m: Matrix3): Matrix3 {
    const ae = this.elements;
    const be = m.elements;
    const result = new Matrix3();
    const te = result.elements;

    const a11 = ae[0],
      a12 = ae[3],
      a13 = ae[6];
    const a21 = ae[1],
      a22 = ae[4],
      a23 = ae[7];
    const a31 = ae[2],
      a32 = ae[5],
      a33 = ae[8];

    const b11 = be[0],
      b12 = be[3],
      b13 = be[6];
    const b21 = be[1],
      b22 = be[4],
      b23 = be[7];
    const b31 = be[2],
      b32 = be[5],
      b33 = be[8];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31;
    te[3] = a11 * b12 + a12 * b22 + a13 * b32;
    te[6] = a11 * b13 + a12 * b23 + a13 * b33;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31;
    te[4] = a21 * b12 + a22 * b22 + a23 * b32;
    te[7] = a21 * b13 + a22 * b23 + a23 * b33;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31;
    te[5] = a31 * b12 + a32 * b22 + a33 * b32;
    te[8] = a31 * b13 + a32 * b23 + a33 * b33;

    return result;
  }

  /** Nhân tại chỗ */
  multiplySelf(m: Matrix3): this {
    const result = this.multiply(m);
    this.elements.set(result.elements);
    return this;
  }

  /** Pre-multiply: m * this */
  premultiply(m: Matrix3): Matrix3 {
    return m.multiply(this);
  }

  /** Translate */
  translate(tx: number, ty: number): Matrix3 {
    return this.multiply(Matrix3.translation(tx, ty));
  }

  /** Rotate (radian) */
  rotate(angle: number): Matrix3 {
    return this.multiply(Matrix3.rotation(angle));
  }

  /** Rotate (độ) */
  rotateDeg(angleDeg: number): Matrix3 {
    return this.rotate((angleDeg * Math.PI) / 180);
  }

  /** Scale */
  scale(sx: number, sy: number = sx): Matrix3 {
    return this.multiply(Matrix3.scaling(sx, sy));
  }

  // ==================== Matrix Operations ====================

  /** Định thức */
  determinant(): number {
    const e = this.elements;
    const a = e[0],
      b = e[1],
      c = e[2];
    const d = e[3],
      f = e[4],
      g = e[5];
    const h = e[6],
      i = e[7],
      j = e[8];

    return a * (f * j - g * i) - d * (b * j - c * i) + h * (b * g - c * f);
  }

  /** Ma trận nghịch đảo */
  inverse(): Matrix3 | null {
    const det = this.determinant();
    if (Math.abs(det) < 1e-10) return null;

    const e = this.elements;
    const result = new Matrix3();
    const te = result.elements;

    const a = e[0],
      b = e[1],
      c = e[2];
    const d = e[3],
      f = e[4],
      g = e[5];
    const h = e[6],
      i = e[7],
      j = e[8];

    te[0] = (f * j - g * i) / det;
    te[1] = (c * i - b * j) / det;
    te[2] = (b * g - c * f) / det;
    te[3] = (g * h - d * j) / det;
    te[4] = (a * j - c * h) / det;
    te[5] = (c * d - a * g) / det;
    te[6] = (d * i - f * h) / det;
    te[7] = (b * h - a * i) / det;
    te[8] = (a * f - b * d) / det;

    return result;
  }

  /** Ma trận chuyển vị */
  transpose(): Matrix3 {
    const result = new Matrix3();
    const te = result.elements;
    const e = this.elements;

    te[0] = e[0];
    te[1] = e[3];
    te[2] = e[6];
    te[3] = e[1];
    te[4] = e[4];
    te[5] = e[7];
    te[6] = e[2];
    te[7] = e[5];
    te[8] = e[8];

    return result;
  }

  // ==================== Apply Transform ====================

  /** Áp dụng biến đổi cho điểm */
  transformPoint(point: IVec2): Vec2 {
    const e = this.elements;
    return new Vec2(
      e[0] * point.x + e[3] * point.y + e[6],
      e[1] * point.x + e[4] * point.y + e[7]
    );
  }

  /** Áp dụng biến đổi cho vector (không áp dụng translation) */
  transformVector(vector: IVec2): Vec2 {
    const e = this.elements;
    return new Vec2(
      e[0] * vector.x + e[3] * vector.y,
      e[1] * vector.x + e[4] * vector.y
    );
  }

  /** Áp dụng biến đổi cho mảng điểm */
  transformPoints(points: IVec2[]): Vec2[] {
    return points.map((p) => this.transformPoint(p));
  }

  // ==================== Decomposition ====================

  /** Phân tích thành các thành phần: translation, rotation, scale */
  decompose(): {
    translation: Vec2;
    rotation: number;
    scale: Vec2;
  } {
    const e = this.elements;

    const translation = new Vec2(e[6], e[7]);

    const scaleX = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
    const scaleY = Math.sqrt(e[3] * e[3] + e[4] * e[4]);
    const scale = new Vec2(scaleX, scaleY);

    const rotation = Math.atan2(e[1], e[0]);

    return { translation, rotation, scale };
  }

  // ==================== Utility ====================

  /** So sánh bằng */
  equals(m: Matrix3, epsilon: number = 1e-10): boolean {
    for (let i = 0; i < 9; i++) {
      if (Math.abs(this.elements[i] - m.elements[i]) > epsilon) {
        return false;
      }
    }
    return true;
  }

  /** Kiểm tra là ma trận đơn vị */
  isIdentity(epsilon: number = 1e-10): boolean {
    return this.equals(Matrix3.identity(), epsilon);
  }

  /** Convert sang array */
  toArray(): number[] {
    return Array.from(this.elements);
  }

  /** Convert sang CSS transform string */
  toCssMatrix(): string {
    const e = this.elements;
    return `matrix(${e[0]}, ${e[1]}, ${e[3]}, ${e[4]}, ${e[6]}, ${e[7]})`;
  }

  /** Convert sang string */
  toString(precision: number = 4): string {
    const e = this.elements;
    return (
      `Matrix3(\n` +
      `  ${e[0].toFixed(precision)}, ${e[3].toFixed(precision)}, ${e[6].toFixed(
        precision
      )}\n` +
      `  ${e[1].toFixed(precision)}, ${e[4].toFixed(precision)}, ${e[7].toFixed(
        precision
      )}\n` +
      `  ${e[2].toFixed(precision)}, ${e[5].toFixed(precision)}, ${e[8].toFixed(
        precision
      )}\n` +
      `)`
    );
  }
}
