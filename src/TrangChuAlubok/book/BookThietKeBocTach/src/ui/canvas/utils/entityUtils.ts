/**
 * Entity utilities for CAD canvas
 * Contains hit testing, bounds calculation, and entity manipulation functions
 */

import { distance } from "./geometry";
import type { Point, CadEntity } from "../types/CadEntity";

// Re-export for backward compatibility
export type { Point, CadEntity };

/**
 * Calculate bounding box of an entity
 */
export const entityBounds = (entity: CadEntity): { min: Point; max: Point } => {
  if (entity.type === "circle") {
    const center = entity.points[0];
    const radius = entity.points[1].x;
    return {
      min: { x: center.x - radius, y: center.y - radius },
      max: { x: center.x + radius, y: center.y + radius },
    };
  }

  if (entity.type === "text" && entity.text) {
    // Better text bounds calculation with multiline support
    const pos = entity.points[0];
    const fontSize = entity.fontSize || 14;
    const lineHeight = fontSize * 1.2;
    // More accurate width estimation based on average character width
    // Monospace fonts: ~0.6, Sans-serif: ~0.5, Serif: ~0.45
    const avgCharWidth = entity.fontFamily?.includes("mono") ? 0.6 : 0.5;

    // Split text into lines and find the widest line
    const lines = entity.text.split("\n");
    let maxWidth = 0;
    lines.forEach((line) => {
      const lineWidth = line.length * fontSize * avgCharWidth;
      if (lineWidth > maxWidth) maxWidth = lineWidth;
    });
    const textWidth = maxWidth;
    const textHeight = lines.length * lineHeight;

    return {
      min: { x: pos.x, y: pos.y - lineHeight }, // First line baseline
      max: { x: pos.x + textWidth, y: pos.y + (lines.length - 1) * lineHeight },
    };
  }

  const xs = entity.points.map((p) => p.x);
  const ys = entity.points.map((p) => p.y);
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
};

/**
 * Check if a line segment intersects with a rectangle
 */
const lineIntersectsRect = (
  p1: Point,
  p2: Point,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): boolean => {
  // Check if either endpoint is inside the rectangle
  const p1Inside = p1.x >= minX && p1.x <= maxX && p1.y >= minY && p1.y <= maxY;
  const p2Inside = p2.x >= minX && p2.x <= maxX && p2.y >= minY && p2.y <= maxY;
  if (p1Inside || p2Inside) return true;

  // Check if line segment intersects any of the 4 edges of the rectangle
  // Using line-line intersection
  const edges: [Point, Point][] = [
    [
      { x: minX, y: minY },
      { x: maxX, y: minY },
    ], // bottom
    [
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
    ], // right
    [
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ], // top
    [
      { x: minX, y: maxY },
      { x: minX, y: minY },
    ], // left
  ];

  for (const [e1, e2] of edges) {
    if (lineSegmentsIntersect(p1, p2, e1, e2)) {
      return true;
    }
  }

  return false;
};

/**
 * Check if two line segments intersect
 */
const lineSegmentsIntersect = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): boolean => {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
};

const direction = (p1: Point, p2: Point, p3: Point): number => {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
};

const onSegment = (p1: Point, p2: Point, p: Point): boolean => {
  return (
    Math.min(p1.x, p2.x) <= p.x &&
    p.x <= Math.max(p1.x, p2.x) &&
    Math.min(p1.y, p2.y) <= p.y &&
    p.y <= Math.max(p1.y, p2.y)
  );
};

/**
 * Check if entity intersects with selection rectangle
 * For LINE/POLYLINE: checks actual line segments, NOT bounding box
 */
export const entityIntersectsRect = (
  entity: CadEntity,
  r1: Point,
  r2: Point
): boolean => {
  const minX = Math.min(r1.x, r2.x);
  const maxX = Math.max(r1.x, r2.x);
  const minY = Math.min(r1.y, r2.y);
  const maxY = Math.max(r1.y, r2.y);

  // For LINE and POLYLINE: check actual line segments
  if (entity.type === "line" || entity.type === "polyline") {
    for (let i = 0; i < entity.points.length - 1; i++) {
      const p1 = entity.points[i];
      const p2 = entity.points[i + 1];
      if (lineIntersectsRect(p1, p2, minX, maxX, minY, maxY)) {
        return true;
      }
    }
    return false;
  }

  // For other entities: use bounding box
  const bounds = entityBounds(entity);
  return !(
    bounds.max.x < minX ||
    bounds.min.x > maxX ||
    bounds.max.y < minY ||
    bounds.min.y > maxY
  );
};

/**
 * Hit test an entity at a world position
 */
export const hitTestEntity = (
  entity: CadEntity,
  worldPos: Point,
  tolerance: number
): boolean => {
  if (entity.type === "circle") {
    const center = entity.points[0];
    const radius = entity.points[1].x;
    const dist = distance(worldPos, center);
    return Math.abs(dist - radius) <= tolerance;
  }

  if (entity.type === "rect") {
    const [p1, p2] = entity.points;
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const nearLeft =
      Math.abs(worldPos.x - minX) <= tolerance &&
      worldPos.y >= minY - tolerance &&
      worldPos.y <= maxY + tolerance;
    const nearRight =
      Math.abs(worldPos.x - maxX) <= tolerance &&
      worldPos.y >= minY - tolerance &&
      worldPos.y <= maxY + tolerance;
    const nearTop =
      Math.abs(worldPos.y - maxY) <= tolerance &&
      worldPos.x >= minX - tolerance &&
      worldPos.x <= maxX + tolerance;
    const nearBottom =
      Math.abs(worldPos.y - minY) <= tolerance &&
      worldPos.x >= minX - tolerance &&
      worldPos.x <= maxX + tolerance;

    return nearLeft || nearRight || nearTop || nearBottom;
  }

  // Text entity - check if click is within text bounds (multiline support)
  // Text thường khó click hơn, nên sử dụng tolerance lớn hơn
  if (entity.type === "text" && entity.text) {
    const pos = entity.points[0];
    const fontSize = entity.fontSize || 14;
    const lineHeight = fontSize * 1.2;
    // Better width estimation
    const avgCharWidth = entity.fontFamily?.includes("mono") ? 0.6 : 0.5;

    // Split text into lines and find the widest line
    const lines = entity.text.split("\n");
    let maxWidth = 0;
    lines.forEach((line) => {
      const lineWidth = line.length * fontSize * avgCharWidth;
      if (lineWidth > maxWidth) maxWidth = lineWidth;
    });
    const textWidth = maxWidth;
    const textHeight = lines.length * lineHeight;

    // Tăng tolerance cho text để dễ click hơn
    const textTolerance = Math.max(tolerance, fontSize * 0.5);

    // Check if click is within text bounding box
    // First line is at pos.y (baseline), subsequent lines go down
    return (
      worldPos.x >= pos.x - textTolerance &&
      worldPos.x <= pos.x + textWidth + textTolerance &&
      worldPos.y >= pos.y - lineHeight - textTolerance &&
      worldPos.y <= pos.y + (lines.length - 1) * lineHeight + textTolerance
    );
  }

  // Line/Polyline - check distance to line segment, NOT bounding box
  for (let i = 0; i < entity.points.length - 1; i++) {
    const a = entity.points[i];
    const b = entity.points[i + 1];

    const lenSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (lenSq === 0) continue;

    let t =
      ((worldPos.x - a.x) * (b.x - a.x) + (worldPos.y - a.y) * (b.y - a.y)) /
      lenSq;
    t = Math.max(0, Math.min(1, t));

    const closest = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    const dist = distance(worldPos, closest);

    if (dist <= tolerance) return true;
  }

  return false;
};

/**
 * Move an entity by delta
 */
export const moveEntity = (
  entity: CadEntity,
  dx: number,
  dy: number
): CadEntity => {
  return {
    ...entity,
    points: entity.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
  };
};

/**
 * Copy an entity with new ID
 */
export const copyEntity = (entity: CadEntity): CadEntity => {
  return {
    ...entity,
    id: `${entity.type}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    points: entity.points.map((p) => ({ ...p })),
    selected: false,
  };
};

/**
 * Scale an entity by factor from a base point
 */
export const scaleEntity = (
  entity: CadEntity,
  scaleFactor: number,
  basePoint: Point
): CadEntity => {
  const scaledEntity = {
    ...entity,
    points: entity.points.map((p) => ({
      x: basePoint.x + (p.x - basePoint.x) * scaleFactor,
      y: basePoint.y + (p.y - basePoint.y) * scaleFactor,
    })),
  };

  // Scale radius for circle
  if (entity.type === "circle" && entity.points.length >= 2) {
    scaledEntity.points[1] = {
      x: entity.points[1].x * scaleFactor,
      y: entity.points[1].y * scaleFactor,
    };
  }

  // Scale font size for text
  if (entity.type === "text") {
    scaledEntity.fontSize = (entity.fontSize || 14) * scaleFactor;
  }

  return scaledEntity;
};

/**
 * Edit text content of a text entity
 */
export const editTextEntity = (
  entity: CadEntity,
  newText: string,
  fontSize?: number,
  fontFamily?: string
): CadEntity => {
  if (entity.type !== "text") return entity;

  return {
    ...entity,
    text: newText,
    fontSize: fontSize || entity.fontSize || 14,
    fontFamily: fontFamily || entity.fontFamily || "Arial",
  };
};
