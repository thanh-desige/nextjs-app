/**
 * GeometryUtils - Các hàm tiện ích hình học cho CAD
 * Bao gồm: intersection, distance, projection, bounding box, etc.
 */

import { Vec2, IVec2 } from "./Vec2";

// ==================== Constants ====================

export const EPSILON = 1e-10;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

// ==================== Types ====================

export interface BoundingBox {
  min: Vec2;
  max: Vec2;
}

export interface LineSegment {
  start: IVec2;
  end: IVec2;
}

export interface Circle2D {
  center: IVec2;
  radius: number;
}

export interface Arc2D {
  center: IVec2;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface IntersectionResult {
  intersects: boolean;
  points: Vec2[];
  t1?: number; // Tham số trên đường 1
  t2?: number; // Tham số trên đường 2
}

// ==================== Angle Utilities ====================

/** Chuyển độ sang radian */
export function degToRad(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

/** Chuyển radian sang độ */
export function radToDeg(radians: number): number {
  return radians * RAD_TO_DEG;
}

/** Chuẩn hóa góc về khoảng [0, 2π) */
export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

/** Chuẩn hóa góc về khoảng [-π, π) */
export function normalizeAngleSigned(angle: number): number {
  let result = normalizeAngle(angle);
  if (result >= Math.PI) result -= Math.PI * 2;
  return result;
}

/** Góc giữa 2 góc (khoảng cách góc ngắn nhất) */
export function angleDifference(angle1: number, angle2: number): number {
  let diff = normalizeAngle(angle2 - angle1);
  if (diff > Math.PI) diff -= Math.PI * 2;
  return Math.abs(diff);
}

// ==================== Distance Calculations ====================

/** Khoảng cách giữa 2 điểm */
export function distancePointToPoint(p1: IVec2, p2: IVec2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Khoảng cách từ điểm đến đường thẳng (vô hạn) */
export function distancePointToLine(
  point: IVec2,
  lineStart: IVec2,
  lineEnd: IVec2
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq < EPSILON) {
    return distancePointToPoint(point, lineStart);
  }

  const cross = Math.abs(
    (point.x - lineStart.x) * dy - (point.y - lineStart.y) * dx
  );
  return cross / Math.sqrt(lengthSq);
}

/** Khoảng cách từ điểm đến đoạn thẳng */
export function distancePointToSegment(
  point: IVec2,
  segStart: IVec2,
  segEnd: IVec2
): number {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq < EPSILON) {
    return distancePointToPoint(point, segStart);
  }

  // Tham số t của điểm chiếu
  let t =
    ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSq;

  // Clamp t vào [0, 1]
  t = Math.max(0, Math.min(1, t));

  // Điểm chiếu
  const projX = segStart.x + t * dx;
  const projY = segStart.y + t * dy;

  return distancePointToPoint(point, { x: projX, y: projY });
}

/** Khoảng cách từ điểm đến đường tròn */
export function distancePointToCircle(point: IVec2, circle: Circle2D): number {
  const d = distancePointToPoint(point, circle.center);
  return Math.abs(d - circle.radius);
}

// ==================== Projection ====================

/** Chiếu điểm lên đường thẳng (vô hạn) */
export function projectPointToLine(
  point: IVec2,
  lineStart: IVec2,
  lineEnd: IVec2
): Vec2 {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq < EPSILON) {
    return Vec2.from(lineStart);
  }

  const t =
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;

  return new Vec2(lineStart.x + t * dx, lineStart.y + t * dy);
}

/** Chiếu điểm lên đoạn thẳng */
export function projectPointToSegment(
  point: IVec2,
  segStart: IVec2,
  segEnd: IVec2
): Vec2 {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq < EPSILON) {
    return Vec2.from(segStart);
  }

  let t =
    ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  return new Vec2(segStart.x + t * dx, segStart.y + t * dy);
}

/** Tham số t của điểm chiếu trên đoạn thẳng */
export function projectPointToSegmentT(
  point: IVec2,
  segStart: IVec2,
  segEnd: IVec2
): number {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq < EPSILON) return 0;

  const t =
    ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSq;
  return Math.max(0, Math.min(1, t));
}

// ==================== Intersection ====================

/** Giao điểm của 2 đường thẳng (vô hạn) */
export function intersectLines(
  line1Start: IVec2,
  line1End: IVec2,
  line2Start: IVec2,
  line2End: IVec2
): IntersectionResult {
  const d1x = line1End.x - line1Start.x;
  const d1y = line1End.y - line1Start.y;
  const d2x = line2End.x - line2Start.x;
  const d2y = line2End.y - line2Start.y;

  const cross = d1x * d2y - d1y * d2x;

  if (Math.abs(cross) < EPSILON) {
    // Đường thẳng song song hoặc trùng nhau
    return { intersects: false, points: [] };
  }

  const dx = line2Start.x - line1Start.x;
  const dy = line2Start.y - line1Start.y;

  const t1 = (dx * d2y - dy * d2x) / cross;
  const t2 = (dx * d1y - dy * d1x) / cross;

  const intersection = new Vec2(
    line1Start.x + t1 * d1x,
    line1Start.y + t1 * d1y
  );

  return {
    intersects: true,
    points: [intersection],
    t1,
    t2,
  };
}

/** Giao điểm của 2 đoạn thẳng */
export function intersectSegments(
  seg1Start: IVec2,
  seg1End: IVec2,
  seg2Start: IVec2,
  seg2End: IVec2
): IntersectionResult {
  const result = intersectLines(seg1Start, seg1End, seg2Start, seg2End);

  if (!result.intersects) {
    return { intersects: false, points: [] };
  }

  const t1 = result.t1!;
  const t2 = result.t2!;

  // Kiểm tra t1, t2 có nằm trong [0, 1] không
  if (
    t1 >= -EPSILON &&
    t1 <= 1 + EPSILON &&
    t2 >= -EPSILON &&
    t2 <= 1 + EPSILON
  ) {
    return result;
  }

  return { intersects: false, points: [] };
}

/** Giao điểm của đường thẳng và đường tròn */
export function intersectLineCircle(
  lineStart: IVec2,
  lineEnd: IVec2,
  circle: Circle2D
): IntersectionResult {
  const d = new Vec2(lineEnd.x - lineStart.x, lineEnd.y - lineStart.y);
  const f = new Vec2(
    lineStart.x - circle.center.x,
    lineStart.y - circle.center.y
  );

  const a = d.dot(d);
  const b = 2 * f.dot(d);
  const c = f.dot(f) - circle.radius * circle.radius;

  const discriminant = b * b - 4 * a * c;

  if (discriminant < -EPSILON) {
    return { intersects: false, points: [] };
  }

  const points: Vec2[] = [];

  if (discriminant < EPSILON) {
    // 1 giao điểm (tiếp tuyến)
    const t = -b / (2 * a);
    points.push(new Vec2(lineStart.x + t * d.x, lineStart.y + t * d.y));
  } else {
    // 2 giao điểm
    const sqrtD = Math.sqrt(discriminant);
    const t1 = (-b - sqrtD) / (2 * a);
    const t2 = (-b + sqrtD) / (2 * a);

    points.push(new Vec2(lineStart.x + t1 * d.x, lineStart.y + t1 * d.y));
    points.push(new Vec2(lineStart.x + t2 * d.x, lineStart.y + t2 * d.y));
  }

  return { intersects: true, points };
}

/** Giao điểm của 2 đường tròn */
export function intersectCircles(
  circle1: Circle2D,
  circle2: Circle2D
): IntersectionResult {
  const dx = circle2.center.x - circle1.center.x;
  const dy = circle2.center.y - circle1.center.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  // Không giao nhau
  if (d > circle1.radius + circle2.radius + EPSILON) {
    return { intersects: false, points: [] };
  }

  // Một đường tròn nằm trong đường tròn kia
  if (d < Math.abs(circle1.radius - circle2.radius) - EPSILON) {
    return { intersects: false, points: [] };
  }

  // Trùng nhau
  if (d < EPSILON && Math.abs(circle1.radius - circle2.radius) < EPSILON) {
    return { intersects: false, points: [] }; // Vô số giao điểm
  }

  const a =
    (circle1.radius * circle1.radius -
      circle2.radius * circle2.radius +
      d * d) /
    (2 * d);
  const h = Math.sqrt(Math.max(0, circle1.radius * circle1.radius - a * a));

  const px = circle1.center.x + (a * dx) / d;
  const py = circle1.center.y + (a * dy) / d;

  const points: Vec2[] = [];

  if (h < EPSILON) {
    // 1 giao điểm (tiếp xúc)
    points.push(new Vec2(px, py));
  } else {
    // 2 giao điểm
    const hx = (h * dy) / d;
    const hy = (h * dx) / d;
    points.push(new Vec2(px + hx, py - hy));
    points.push(new Vec2(px - hx, py + hy));
  }

  return { intersects: true, points };
}

// ==================== Bounding Box ====================

/** Tạo bounding box từ mảng điểm */
export function boundingBoxFromPoints(points: IVec2[]): BoundingBox | null {
  if (points.length === 0) return null;

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

/** Tạo bounding box từ đường tròn */
export function boundingBoxFromCircle(circle: Circle2D): BoundingBox {
  return {
    min: new Vec2(
      circle.center.x - circle.radius,
      circle.center.y - circle.radius
    ),
    max: new Vec2(
      circle.center.x + circle.radius,
      circle.center.y + circle.radius
    ),
  };
}

/** Mở rộng bounding box */
export function expandBoundingBox(
  box: BoundingBox,
  amount: number
): BoundingBox {
  return {
    min: new Vec2(box.min.x - amount, box.min.y - amount),
    max: new Vec2(box.max.x + amount, box.max.y + amount),
  };
}

/** Hợp 2 bounding box */
export function unionBoundingBoxes(
  box1: BoundingBox,
  box2: BoundingBox
): BoundingBox {
  return {
    min: new Vec2(
      Math.min(box1.min.x, box2.min.x),
      Math.min(box1.min.y, box2.min.y)
    ),
    max: new Vec2(
      Math.max(box1.max.x, box2.max.x),
      Math.max(box1.max.y, box2.max.y)
    ),
  };
}

/** Giao 2 bounding box */
export function intersectBoundingBoxes(
  box1: BoundingBox,
  box2: BoundingBox
): BoundingBox | null {
  const minX = Math.max(box1.min.x, box2.min.x);
  const minY = Math.max(box1.min.y, box2.min.y);
  const maxX = Math.min(box1.max.x, box2.max.x);
  const maxY = Math.min(box1.max.y, box2.max.y);

  if (minX > maxX || minY > maxY) return null;

  return {
    min: new Vec2(minX, minY),
    max: new Vec2(maxX, maxY),
  };
}

/** Kiểm tra điểm có trong bounding box */
export function isPointInBoundingBox(point: IVec2, box: BoundingBox): boolean {
  return (
    point.x >= box.min.x &&
    point.x <= box.max.x &&
    point.y >= box.min.y &&
    point.y <= box.max.y
  );
}

/** Kiểm tra 2 bounding box có giao nhau */
export function doBoundingBoxesIntersect(
  box1: BoundingBox,
  box2: BoundingBox
): boolean {
  return !(
    box1.max.x < box2.min.x ||
    box1.min.x > box2.max.x ||
    box1.max.y < box2.min.y ||
    box1.min.y > box2.max.y
  );
}

/** Lấy tâm bounding box */
export function getBoundingBoxCenter(box: BoundingBox): Vec2 {
  return new Vec2((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2);
}

/** Lấy kích thước bounding box */
export function getBoundingBoxSize(box: BoundingBox): Vec2 {
  return new Vec2(box.max.x - box.min.x, box.max.y - box.min.y);
}

// ==================== Point in Polygon ====================

/** Kiểm tra điểm có trong đa giác (ray casting algorithm) */
export function isPointInPolygon(point: IVec2, polygon: IVec2[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/** Kiểm tra điểm có trong đường tròn */
export function isPointInCircle(point: IVec2, circle: Circle2D): boolean {
  const d = distancePointToPoint(point, circle.center);
  return d <= circle.radius + EPSILON;
}

/** Kiểm tra điểm có trên đoạn thẳng */
export function isPointOnSegment(
  point: IVec2,
  segStart: IVec2,
  segEnd: IVec2,
  tolerance: number = EPSILON
): boolean {
  const d = distancePointToSegment(point, segStart, segEnd);
  return d <= tolerance;
}

// ==================== Area & Perimeter ====================

/** Diện tích tam giác */
export function triangleArea(p1: IVec2, p2: IVec2, p3: IVec2): number {
  return Math.abs(
    (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2
  );
}

/** Diện tích đa giác (shoelace formula) */
export function polygonArea(polygon: IVec2[]): number {
  if (polygon.length < 3) return 0;

  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }

  return Math.abs(area) / 2;
}

/** Chu vi đa giác */
export function polygonPerimeter(polygon: IVec2[]): number {
  if (polygon.length < 2) return 0;

  let perimeter = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += distancePointToPoint(polygon[i], polygon[j]);
  }

  return perimeter;
}

/** Trọng tâm đa giác */
export function polygonCentroid(polygon: IVec2[]): Vec2 | null {
  if (polygon.length === 0) return null;
  if (polygon.length === 1) return Vec2.from(polygon[0]);
  if (polygon.length === 2) {
    return new Vec2(
      (polygon[0].x + polygon[1].x) / 2,
      (polygon[0].y + polygon[1].y) / 2
    );
  }

  let cx = 0,
    cy = 0;
  let signedArea = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const a = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    signedArea += a;
    cx += (polygon[i].x + polygon[j].x) * a;
    cy += (polygon[i].y + polygon[j].y) * a;
  }

  signedArea *= 0.5;
  if (Math.abs(signedArea) < EPSILON) {
    // Đa giác suy biến, lấy trung bình điểm
    let sumX = 0,
      sumY = 0;
    for (const p of polygon) {
      sumX += p.x;
      sumY += p.y;
    }
    return new Vec2(sumX / polygon.length, sumY / polygon.length);
  }

  cx /= 6 * signedArea;
  cy /= 6 * signedArea;

  return new Vec2(cx, cy);
}

// ==================== Utility Functions ====================

/** Snap giá trị về lưới */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Snap điểm về lưới */
export function snapPointToGrid(point: IVec2, gridSize: number): Vec2 {
  return new Vec2(snapToGrid(point.x, gridSize), snapToGrid(point.y, gridSize));
}

/** Clamp giá trị */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Nội suy tuyến tính */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** So sánh gần bằng */
export function nearlyEqual(
  a: number,
  b: number,
  epsilon: number = EPSILON
): boolean {
  return Math.abs(a - b) < epsilon;
}

/** Điểm giữa của đoạn thẳng */
export function midpoint(p1: IVec2, p2: IVec2): Vec2 {
  return new Vec2((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

/** Tạo các điểm chia đều trên đoạn thẳng */
export function subdivideSegment(
  start: IVec2,
  end: IVec2,
  divisions: number
): Vec2[] {
  const points: Vec2[] = [];
  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions;
    points.push(
      new Vec2(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t)
    );
  }
  return points;
}
