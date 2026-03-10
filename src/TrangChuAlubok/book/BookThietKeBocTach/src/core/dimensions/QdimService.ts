/**
 * QdimService.ts
 *
 * STEP-5.10: Extracted from DimensionManager.ts
 * Quick Dimension (QDIM) functions — self-contained subsystem.
 * All functions are stateless; `createLinearDimension` is injected as a callback.
 */

import type {
  Point,
  DimensionEntity,
  LinearDimensionParams,
} from "./dimension.types";

// ============================================
// TYPES
// ============================================

/** Entity shape for QDIM point extraction */
export interface QdimEntity {
  type: string;
  points?: Point[];
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
}

/** Factory callback — injected from DimensionManager */
export type CreateLinearDimensionFn = (params: LinearDimensionParams) => DimensionEntity;

// ============================================
// POINT EXTRACTION
// ============================================

/**
 * Trích xuất tất cả endpoints từ các entities được chọn
 * Trả về danh sách điểm đã được sắp xếp theo tọa độ
 */
export function extractPointsFromEntities(entities: QdimEntity[]): Point[] {
  const points: Point[] = [];
  const pointSet = new Set<string>(); // Để tránh trùng lặp

  for (const entity of entities) {
    if (
      entity.type === "line" &&
      entity.points &&
      entity.points.length >= 2
    ) {
      // Line: lấy 2 endpoints
      for (const p of entity.points) {
        const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        if (!pointSet.has(key)) {
          pointSet.add(key);
          points.push({ x: p.x, y: p.y });
        }
      }
    } else if (entity.type === "polyline" && entity.points) {
      // Polyline: lấy tất cả vertices
      for (const p of entity.points) {
        const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        if (!pointSet.has(key)) {
          pointSet.add(key);
          points.push({ x: p.x, y: p.y });
        }
      }
    } else if (
      entity.type === "rect" &&
      entity.points &&
      entity.points.length >= 2
    ) {
      // Rectangle: lấy 4 góc
      const [p1, p2] = entity.points;
      const corners = [
        { x: p1.x, y: p1.y },
        { x: p2.x, y: p1.y },
        { x: p2.x, y: p2.y },
        { x: p1.x, y: p2.y },
      ];
      for (const p of corners) {
        const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        if (!pointSet.has(key)) {
          pointSet.add(key);
          points.push(p);
        }
      }
    } else if (entity.type === "circle" && entity.center && entity.radius) {
      // Circle: lấy 4 quadrant points
      const c = entity.center;
      const r = entity.radius;
      const quadrants = [
        { x: c.x + r, y: c.y }, // 0°
        { x: c.x, y: c.y + r }, // 90°
        { x: c.x - r, y: c.y }, // 180°
        { x: c.x, y: c.y - r }, // 270°
      ];
      for (const p of quadrants) {
        const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        if (!pointSet.has(key)) {
          pointSet.add(key);
          points.push(p);
        }
      }
    } else if (entity.type === "arc" && entity.center && entity.radius) {
      // Arc: lấy start và end points
      const c = entity.center;
      const r = entity.radius;
      const startAngle = entity.startAngle || 0;
      const endAngle = entity.endAngle || Math.PI;
      const arcPoints = [
        {
          x: c.x + r * Math.cos(startAngle),
          y: c.y + r * Math.sin(startAngle),
        },
        { x: c.x + r * Math.cos(endAngle), y: c.y + r * Math.sin(endAngle) },
      ];
      for (const p of arcPoints) {
        const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        if (!pointSet.has(key)) {
          pointSet.add(key);
          points.push(p);
        }
      }
    }
  }

  return points;
}

// ============================================
// SORTING & DIRECTION DETECTION
// ============================================

/**
 * Sắp xếp điểm theo hướng (horizontal: theo X, vertical: theo Y)
 */
export function sortPointsByDirection(
  points: Point[],
  direction: "horizontal" | "vertical",
): Point[] {
  return [...points].sort((a, b) => {
    if (direction === "horizontal") {
      return a.x - b.x; // Sắp xếp theo X (trái → phải)
    } else {
      return a.y - b.y; // Sắp xếp theo Y (dưới → trên trong world coords)
    }
  });
}

/**
 * Xác định hướng tốt nhất cho QDIM dựa trên vị trí chuột so với bounding box
 */
export function detectQdimDirection(
  points: Point[],
  mousePos: Point,
): "horizontal" | "vertical" {
  if (points.length === 0) return "horizontal";

  // Tính bounding box
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Khoảng cách từ chuột đến center theo X và Y
  const dx = Math.abs(mousePos.x - centerX);
  const dy = Math.abs(mousePos.y - centerY);

  // Nếu chuột ở trên/dưới → horizontal dimensions
  // Nếu chuột ở trái/phải → vertical dimensions
  return dy > dx ? "horizontal" : "vertical";
}

// ============================================
// QDIM CREATION MODES
// ============================================

/**
 * Tạo nhiều dimensions từ danh sách điểm (QDIM - Continuous mode)
 * Tạo chuỗi dimension liên tiếp giữa các điểm
 * Tất cả dimensions nằm trên cùng một đường (dimLineY hoặc dimLineX cố định)
 */
export function createQdimContinuous(
  points: Point[],
  dimLinePosition: number,
  direction: "horizontal" | "vertical",
  createLinearDimension: CreateLinearDimensionFn,
): DimensionEntity[] {
  if (points.length < 2) return [];

  const sortedPoints = sortPointsByDirection(points, direction);
  const dimensions: DimensionEntity[] = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];

    let offset: number;
    if (direction === "horizontal") {
      const midY = (p1.y + p2.y) / 2;
      offset = dimLinePosition - midY;
    } else {
      const midX = (p1.x + p2.x) / 2;
      offset = dimLinePosition - midX;
    }

    const dim = createLinearDimension({
      point1: p1,
      point2: p2,
      offset,
      direction,
    });
    dim.dimensionType = "qdim";
    dim.isLegacy = true; // QDIM = display-only, no entity refs, bypass validation
    dimensions.push(dim);
  }

  return dimensions;
}

/**
 * Tạo nhiều dimensions từ danh sách điểm (QDIM - Baseline mode)
 * Tất cả dimensions đo từ điểm gốc (điểm đầu tiên)
 * Các dimension nằm trên các đường song song với khoảng cách offsetIncrement
 */
export function createQdimBaseline(
  points: Point[],
  dimLinePosition: number,
  offsetIncrement: number,
  direction: "horizontal" | "vertical",
  createLinearDimension: CreateLinearDimensionFn,
): DimensionEntity[] {
  if (points.length < 2) return [];

  const sortedPoints = sortPointsByDirection(points, direction);
  const basePoint = sortedPoints[0];
  const dimensions: DimensionEntity[] = [];

  for (let i = 1; i < sortedPoints.length; i++) {
    const p2 = sortedPoints[i];
    const midY = (basePoint.y + p2.y) / 2;
    const midX = (basePoint.x + p2.x) / 2;

    const currentDimLinePos = dimLinePosition + (i - 1) * offsetIncrement;
    let offset: number;
    if (direction === "horizontal") {
      offset = currentDimLinePos - midY;
    } else {
      offset = currentDimLinePos - midX;
    }

    const dim = createLinearDimension({
      point1: basePoint,
      point2: p2,
      offset,
      direction,
    });
    dim.dimensionType = "qdim";
    dim.isLegacy = true; // QDIM = display-only, no entity refs, bypass validation
    dimensions.push(dim);
  }

  return dimensions;
}

/**
 * Tạo nhiều dimensions từ danh sách điểm (QDIM - Staggered mode)
 * Dimensions so le với offset khác nhau
 */
export function createQdimStaggered(
  points: Point[],
  dimLinePosition: number,
  offsetIncrement: number,
  direction: "horizontal" | "vertical",
  createLinearDimension: CreateLinearDimensionFn,
): DimensionEntity[] {
  if (points.length < 2) return [];

  const sortedPoints = sortPointsByDirection(points, direction);
  const dimensions: DimensionEntity[] = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];
    const midY = (p1.y + p2.y) / 2;
    const midX = (p1.x + p2.x) / 2;

    const currentDimLinePos = dimLinePosition + i * offsetIncrement;
    let offset: number;
    if (direction === "horizontal") {
      offset = currentDimLinePos - midY;
    } else {
      offset = currentDimLinePos - midX;
    }

    const dim = createLinearDimension({
      point1: p1,
      point2: p2,
      offset,
      direction,
    });
    dim.dimensionType = "qdim";
    dim.isLegacy = true; // QDIM = display-only, no entity refs, bypass validation
    dimensions.push(dim);
  }

  return dimensions;
}
