/**
 * dimensionGeometry.ts
 *
 * STEP-5.10: Extracted from DimensionManager.ts
 * Pure geometry/math functions for dimension calculations.
 * All functions are stateless — `scale` is passed as a parameter.
 */

import type { Point, DimensionDirection, DimensionStyle } from "./dimension.types";

// ============================================
// DISTANCE CALCULATIONS
// ============================================

/**
 * Tính khoảng cách giữa 2 điểm
 */
export function calculateDistance(p1: Point, p2: Point, scale: number = 1): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy) / scale;
}

/**
 * Tính khoảng cách ngang (chỉ theo X)
 */
export function calculateHorizontalDistance(p1: Point, p2: Point, scale: number = 1): number {
  return Math.abs(p2.x - p1.x) / scale;
}

/**
 * Tính khoảng cách dọc (chỉ theo Y)
 */
export function calculateVerticalDistance(p1: Point, p2: Point, scale: number = 1): number {
  return Math.abs(p2.y - p1.y) / scale;
}

// ============================================
// LINE INTERSECTION
// ============================================

/**
 * Tính giao điểm của 2 đường thẳng (extended lines, not segments)
 * Returns null if lines are parallel
 */
export function calculateLineIntersection(
  line1: { point1: Point; point2: Point },
  line2: { point1: Point; point2: Point },
): Point | null {
  const x1 = line1.point1.x,
    y1 = line1.point1.y;
  const x2 = line1.point2.x,
    y2 = line1.point2.y;
  const x3 = line2.point1.x,
    y3 = line2.point1.y;
  const x4 = line2.point2.x,
    y4 = line2.point2.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  // Lines are parallel or coincident
  if (Math.abs(denom) < 0.0001) {
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

// ============================================
// DIRECTION DETECTION
// ============================================

/**
 * DLI - Tự động xác định hướng dimension dựa trên góc của 2 điểm
 * Như AutoCAD: nếu góc gần ngang → horizontal, gần dọc → vertical
 * KHÔNG trả về aligned - đó là nhiệm vụ của DAL
 */
export function autoDetectLinearDirection(p1: Point, p2: Point): "horizontal" | "vertical" {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);

  // Nếu delta X lớn hơn delta Y → đường gần ngang → đo horizontal
  // Nếu delta Y lớn hơn delta X → đường gần dọc → đo vertical
  return dx >= dy ? "horizontal" : "vertical";
}

/**
 * Xác định hướng dựa trên vị trí offset (kéo chuột)
 * Dùng cho trường hợp người dùng muốn chọn hướng thủ công khi kéo offset
 */
export function detectDirectionFromOffset(
  p1: Point,
  p2: Point,
  mousePos: Point,
): "horizontal" | "vertical" {
  // Tính vector từ midpoint đến mouse
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  const dx = Math.abs(mousePos.x - midX);
  const dy = Math.abs(mousePos.y - midY);

  // Nếu kéo theo chiều dọc (dy > dx) → dimension nằm ngang → đo horizontal
  // Nếu kéo theo chiều ngang (dx > dy) → dimension nằm dọc → đo vertical
  return dy >= dx ? "horizontal" : "vertical";
}

// ============================================
// OFFSET CALCULATION
// ============================================

/**
 * Tính offset dựa trên vị trí chuột (WORLD COORDS)
 * Offset được tính theo khoảng cách vuông góc từ chuột đến đường đo
 * Di chuột về phía nào thì dim đi về phía đó
 */
export function calculateOffsetFromMouse(
  p1: Point,
  p2: Point,
  mousePos: Point,
  direction: DimensionDirection,
): number {
  if (direction === "horizontal") {
    // Horizontal dimension: dim line nằm ngang
    // Offset theo Y - chuột LÊN màn hình → dim LÊN
    const midY = (p1.y + p2.y) / 2;
    return mousePos.y - midY; // Kéo lên (worldY tăng) → offset dương → dim lên
  } else if (direction === "vertical") {
    // Vertical dimension: dim line nằm dọc
    // Offset theo X - chuột SANG PHẢI → dim SANG PHẢI
    const midX = (p1.x + p2.x) / 2;
    return mousePos.x - midX;
  } else {
    // Aligned - dim line song song với đoạn p1-p2, đi qua vị trí chuột
    // calcDimensionLinePoints dùng: perpX = -dy/length, perpY = dx/length
    // dimP1 = p1 + perp * offset, dimP2 = p2 + perp * offset
    // Để dim line đi qua chuột: offset = (mouse - p1) · perp
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return 0;
    const length = Math.sqrt(lengthSq);

    // Perpendicular vector (phải khớp với calcDimensionLinePoints)
    const perpX = -dy / length;
    const perpY = dx / length;

    // Offset = projection của (mouse - p1) lên perp vector
    // Dim line sẽ đi qua điểm chuột
    return (mousePos.x - p1.x) * perpX + (mousePos.y - p1.y) * perpY;
  }
}

// ============================================
// ANGLE & FORMATTING
// ============================================

/**
 * Tính góc giữa 2 vector
 */
export function calculateAngle(center: Point, p1: Point, p2: Point): number {
  const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);
  let angle = Math.abs(angle2 - angle1) * (180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Format giá trị dimension
 */
export function formatValue(value: number, style: DimensionStyle): string {
  const formatted = value.toFixed(style.precision);
  const unit = style.showUnit ? style.unit : "";
  return `${style.prefix}${formatted}${unit}${style.suffix}`;
}
