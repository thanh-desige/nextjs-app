/**
 * Geometry utilities for CAD canvas
 * Contains common geometric calculations used throughout the canvas
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculate Euclidean distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Find the nearest point on a line segment to a given point
 */
export const nearestPointOnSegment = (p: Point, a: Point, b: Point): Point => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return a;

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));

  return { x: a.x + t * dx, y: a.y + t * dy };
};

/**
 * Calculate perpendicular foot from point P to line segment AB
 * Returns the perpendicular point if it falls on the segment, null otherwise
 */
export const perpendicularPointOnLine = (
  p: Point,
  a: Point,
  b: Point
): Point | null => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return null;

  // Calculate parameter t for the perpendicular foot
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;

  // Only return if perpendicular foot is on the segment (0 <= t <= 1)
  if (t < 0 || t > 1) return null;

  return { x: a.x + t * dx, y: a.y + t * dy };
};

/**
 * Calculate intersection point of two line segments
 * Returns null if segments don't intersect
 */
export const lineSegmentIntersection = (
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): Point | null => {
  const d1x = a2.x - a1.x;
  const d1y = a2.y - a1.y;
  const d2x = b2.x - b1.x;
  const d2y = b2.y - b1.y;

  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null; // Parallel or coincident

  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;

  const t1 = (dx * d2y - dy * d2x) / cross;
  const t2 = (dx * d1y - dy * d1x) / cross;

  // Check if intersection is within both segments
  if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
    return {
      x: a1.x + t1 * d1x,
      y: a1.y + t1 * d1y,
    };
  }

  return null;
};

/**
 * Calculate intersection points between a line segment and a circle
 */
export const lineCircleIntersection = (
  p1: Point,
  p2: Point,
  center: Point,
  radius: number
): Point[] => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];

  const intersections: Point[] = [];
  const sqrtDisc = Math.sqrt(discriminant);

  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);

  if (t1 >= 0 && t1 <= 1) {
    intersections.push({ x: p1.x + t1 * dx, y: p1.y + t1 * dy });
  }
  if (t2 >= 0 && t2 <= 1 && Math.abs(t1 - t2) > 1e-10) {
    intersections.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
  }

  return intersections;
};

/**
 * Calculate intersection points between two circles
 */
export const circleCircleIntersection = (
  c1: Point,
  r1: number,
  c2: Point,
  r2: number
): Point[] => {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  // No intersection cases
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return [];

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);

  const px = c1.x + (a * dx) / d;
  const py = c1.y + (a * dy) / d;

  const intersections: Point[] = [
    { x: px + (h * dy) / d, y: py - (h * dx) / d },
  ];

  if (Math.abs(h) > 1e-10) {
    intersections.push({ x: px - (h * dy) / d, y: py + (h * dx) / d });
  }

  return intersections;
};

/**
 * Snap a point to grid
 */
export const snapToGridPoint = (point: Point, spacing: number): Point => ({
  x: Math.round(point.x / spacing) * spacing,
  y: Math.round(point.y / spacing) * spacing,
});

/**
 * Apply orthogonal constraint (horizontal or vertical only)
 */
export const applyOrtho = (start: Point, end: Point): Point => {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  return dx > dy ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
};

/**
 * Apply orthogonal constraint for angles (snap to 0°, 90°, 180°, 270°)
 * Used for ROTATE command to constrain angle direction from center
 * Returns a point on the ortho-constrained ray from center
 */
export const applyOrthoAngle = (center: Point, point: Point): Point => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return point;

  // Calculate current angle (in radians)
  const angle = Math.atan2(dy, dx);

  // Snap to nearest 90° (0, π/2, π, -π/2)
  // 0° = right, 90° = up, 180° = left, 270° = down
  const snapAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

  let nearestAngle = 0;
  let minDiff = Math.PI;

  for (const snapAngle of snapAngles) {
    // Calculate angular difference (handle wrap-around)
    let diff = Math.abs(angle - snapAngle);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;

    if (diff < minDiff) {
      minDiff = diff;
      nearestAngle = snapAngle;
    }
  }

  // Return point at same distance but at snapped angle
  return {
    x: center.x + dist * Math.cos(nearestAngle),
    y: center.y + dist * Math.sin(nearestAngle),
  };
};
