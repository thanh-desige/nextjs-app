/**
 * GeometryUtils Tests — Phase 3 Geometry
 *
 * Tests for geometry utility functions: angles, distances, intersections,
 * bounding boxes, polygon operations, and utility helpers.
 */

import {
  degToRad,
  radToDeg,
  normalizeAngle,
  normalizeAngleSigned,
  angleDifference,
  distancePointToPoint,
  distancePointToLine,
  distancePointToSegment,
  distancePointToCircle,
  projectPointToLine,
  projectPointToSegment,
  projectPointToSegmentT,
  intersectLines,
  intersectSegments,
  intersectLineCircle,
  intersectCircles,
  boundingBoxFromPoints,
  boundingBoxFromCircle,
  expandBoundingBox,
  unionBoundingBoxes,
  intersectBoundingBoxes,
  isPointInBoundingBox,
  doBoundingBoxesIntersect,
  getBoundingBoxCenter,
  getBoundingBoxSize,
  isPointInPolygon,
  isPointInCircle,
  isPointOnSegment,
  triangleArea,
  polygonArea,
  polygonPerimeter,
  polygonCentroid,
  snapToGrid,
  snapPointToGrid,
  clamp,
  lerp,
  nearlyEqual,
  midpoint,
  subdivideSegment,
  EPSILON,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/GeometryUtils";
import { Vec2 } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Vec2";

const EPS = 1e-9;

function expectNear(actual: number, expected: number, eps = EPS) {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

describe("GeometryUtils", () => {
  // ==================== Angle Utilities ====================

  describe("angle utilities", () => {
    test("degToRad converts 180° to π", () => {
      expectNear(degToRad(180), Math.PI);
    });

    test("degToRad converts 90° to π/2", () => {
      expectNear(degToRad(90), Math.PI / 2);
    });

    test("radToDeg converts π to 180°", () => {
      expectNear(radToDeg(Math.PI), 180);
    });

    test("radToDeg converts π/2 to 90°", () => {
      expectNear(radToDeg(Math.PI / 2), 90);
    });

    test("degToRad and radToDeg are inverse", () => {
      expectNear(radToDeg(degToRad(45)), 45);
      expectNear(degToRad(radToDeg(1.5)), 1.5);
    });

    test("normalizeAngle wraps negative angles to [0, 2π)", () => {
      const result = normalizeAngle(-Math.PI / 2);
      expectNear(result, (3 * Math.PI) / 2);
    });

    test("normalizeAngle wraps >2π angles", () => {
      const result = normalizeAngle(3 * Math.PI);
      expectNear(result, Math.PI);
    });

    test("normalizeAngle keeps angle in [0, 2π)", () => {
      const result = normalizeAngle(Math.PI / 4);
      expectNear(result, Math.PI / 4);
    });

    test("normalizeAngleSigned wraps to [-π, π)", () => {
      expectNear(normalizeAngleSigned(3 * Math.PI / 2), -Math.PI / 2);
    });

    test("normalizeAngleSigned keeps small positive angle", () => {
      expectNear(normalizeAngleSigned(Math.PI / 4), Math.PI / 4);
    });

    test("angleDifference returns shortest angle between two angles", () => {
      // 10° to 350° → 20° (not 340°)
      const diff = angleDifference(degToRad(10), degToRad(350));
      expectNear(diff, degToRad(20));
    });

    test("angleDifference for same angle is 0", () => {
      expectNear(angleDifference(Math.PI, Math.PI), 0);
    });

    test("angleDifference for opposite angles is π", () => {
      expectNear(angleDifference(0, Math.PI), Math.PI);
    });
  });

  // ==================== Distance Calculations ====================

  describe("distance calculations", () => {
    test("distancePointToPoint basic case", () => {
      expectNear(distancePointToPoint({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
    });

    test("distancePointToPoint same point is 0", () => {
      expectNear(distancePointToPoint({ x: 5, y: 5 }, { x: 5, y: 5 }), 0);
    });

    test("distancePointToLine for perpendicular point", () => {
      // Point (0, 5) to horizontal line y=0 from (0,0) to (10,0)
      const d = distancePointToLine({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(d, 5);
    });

    test("distancePointToLine for point on line is 0", () => {
      const d = distancePointToLine({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(d, 0);
    });

    test("distancePointToLine for degenerate line (zero length)", () => {
      const d = distancePointToLine({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 });
      expectNear(d, 5);
    });

    test("distancePointToSegment for point projecting within segment", () => {
      const d = distancePointToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(d, 3);
    });

    test("distancePointToSegment for point beyond segment end", () => {
      // Point (15, 0) beyond segment (0,0)-(10,0) → distance = 5
      const d = distancePointToSegment({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(d, 5);
    });

    test("distancePointToSegment for point before segment start", () => {
      const d = distancePointToSegment({ x: -3, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(d, 5);
    });

    test("distancePointToCircle for point outside circle", () => {
      const d = distancePointToCircle({ x: 10, y: 0 }, { center: { x: 0, y: 0 }, radius: 5 });
      expectNear(d, 5);
    });

    test("distancePointToCircle for point inside circle", () => {
      const d = distancePointToCircle({ x: 2, y: 0 }, { center: { x: 0, y: 0 }, radius: 5 });
      expectNear(d, 3);
    });

    test("distancePointToCircle for point on circle is 0", () => {
      const d = distancePointToCircle({ x: 5, y: 0 }, { center: { x: 0, y: 0 }, radius: 5 });
      expectNear(d, 0);
    });
  });

  // ==================== Projection ====================

  describe("projection", () => {
    test("projectPointToLine projects perpendicular point", () => {
      const p = projectPointToLine({ x: 5, y: 10 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(p.x, 5);
      expectNear(p.y, 0);
    });

    test("projectPointToLine projects beyond line ends", () => {
      const p = projectPointToLine({ x: 20, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(p.x, 20);
      expectNear(p.y, 0);
    });

    test("projectPointToSegment clamps to segment", () => {
      const p = projectPointToSegment({ x: 20, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(p.x, 10);
      expectNear(p.y, 0);
    });

    test("projectPointToSegment clamps to start", () => {
      const p = projectPointToSegment({ x: -5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(p.x, 0);
      expectNear(p.y, 0);
    });

    test("projectPointToSegmentT returns t in [0,1]", () => {
      const t = projectPointToSegmentT({ x: 5, y: 10 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(t, 0.5);
    });

    test("projectPointToSegmentT clamps beyond end", () => {
      const t = projectPointToSegmentT({ x: 20, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(t, 1);
    });

    test("projectPointToSegmentT clamps before start", () => {
      const t = projectPointToSegmentT({ x: -10, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expectNear(t, 0);
    });
  });

  // ==================== Intersection ====================

  describe("intersection", () => {
    test("intersectLines finds crossing point", () => {
      // Line from (0,0)→(10,10) and (10,0)→(0,10) cross at (5,5)
      const result = intersectLines(
        { x: 0, y: 0 }, { x: 10, y: 10 },
        { x: 10, y: 0 }, { x: 0, y: 10 }
      );
      expect(result.intersects).toBe(true);
      expect(result.points).toHaveLength(1);
      expectNear(result.points[0].x, 5);
      expectNear(result.points[0].y, 5);
    });

    test("intersectLines parallel lines do not intersect", () => {
      const result = intersectLines(
        { x: 0, y: 0 }, { x: 10, y: 0 },
        { x: 0, y: 5 }, { x: 10, y: 5 }
      );
      expect(result.intersects).toBe(false);
    });

    test("intersectLines returns t parameters", () => {
      const result = intersectLines(
        { x: 0, y: 0 }, { x: 10, y: 0 },
        { x: 5, y: -5 }, { x: 5, y: 5 }
      );
      expect(result.intersects).toBe(true);
      expectNear(result.t1!, 0.5);
      expectNear(result.t2!, 0.5);
    });

    test("intersectSegments finds intersection within segments", () => {
      const result = intersectSegments(
        { x: 0, y: 0 }, { x: 10, y: 10 },
        { x: 10, y: 0 }, { x: 0, y: 10 }
      );
      expect(result.intersects).toBe(true);
      expectNear(result.points[0].x, 5);
      expectNear(result.points[0].y, 5);
    });

    test("intersectSegments misses when extensions would cross", () => {
      // Segments that would cross if extended but don't overlap
      const result = intersectSegments(
        { x: 0, y: 0 }, { x: 3, y: 3 },
        { x: 10, y: 0 }, { x: 7, y: 3 }
      );
      expect(result.intersects).toBe(false);
    });

    test("intersectLineCircle finds 2 intersection points", () => {
      const result = intersectLineCircle(
        { x: -10, y: 0 }, { x: 10, y: 0 },
        { center: { x: 0, y: 0 }, radius: 5 }
      );
      expect(result.intersects).toBe(true);
      expect(result.points).toHaveLength(2);
      // Points should be (-5, 0) and (5, 0)
      const xs = result.points.map((p) => p.x).sort((a, b) => a - b);
      expectNear(xs[0], -5);
      expectNear(xs[1], 5);
    });

    test("intersectLineCircle tangent returns 1 point", () => {
      const result = intersectLineCircle(
        { x: -10, y: 5 }, { x: 10, y: 5 },
        { center: { x: 0, y: 0 }, radius: 5 }
      );
      expect(result.intersects).toBe(true);
      expect(result.points).toHaveLength(1);
      expectNear(result.points[0].y, 5);
    });

    test("intersectLineCircle no intersection", () => {
      const result = intersectLineCircle(
        { x: -10, y: 10 }, { x: 10, y: 10 },
        { center: { x: 0, y: 0 }, radius: 5 }
      );
      expect(result.intersects).toBe(false);
    });

    test("intersectCircles finds 2 intersection points", () => {
      const result = intersectCircles(
        { center: { x: 0, y: 0 }, radius: 5 },
        { center: { x: 6, y: 0 }, radius: 5 }
      );
      expect(result.intersects).toBe(true);
      expect(result.points).toHaveLength(2);
    });

    test("intersectCircles tangent returns 1 point", () => {
      const result = intersectCircles(
        { center: { x: 0, y: 0 }, radius: 5 },
        { center: { x: 10, y: 0 }, radius: 5 }
      );
      expect(result.intersects).toBe(true);
      expect(result.points).toHaveLength(1);
      expectNear(result.points[0].x, 5);
    });

    test("intersectCircles too far apart", () => {
      const result = intersectCircles(
        { center: { x: 0, y: 0 }, radius: 3 },
        { center: { x: 20, y: 0 }, radius: 3 }
      );
      expect(result.intersects).toBe(false);
    });

    test("intersectCircles one inside the other", () => {
      const result = intersectCircles(
        { center: { x: 0, y: 0 }, radius: 10 },
        { center: { x: 1, y: 0 }, radius: 3 }
      );
      expect(result.intersects).toBe(false);
    });
  });

  // ==================== Bounding Box ====================

  describe("bounding box", () => {
    test("boundingBoxFromPoints creates correct box", () => {
      const box = boundingBoxFromPoints([
        { x: -5, y: -10 },
        { x: 15, y: 20 },
        { x: 3, y: 7 },
      ]);
      expect(box).not.toBeNull();
      expect(box!.min.x).toBe(-5);
      expect(box!.min.y).toBe(-10);
      expect(box!.max.x).toBe(15);
      expect(box!.max.y).toBe(20);
    });

    test("boundingBoxFromPoints empty array returns null", () => {
      expect(boundingBoxFromPoints([])).toBeNull();
    });

    test("boundingBoxFromCircle creates correct box", () => {
      const box = boundingBoxFromCircle({ center: { x: 10, y: 10 }, radius: 5 });
      expect(box.min.x).toBe(5);
      expect(box.min.y).toBe(5);
      expect(box.max.x).toBe(15);
      expect(box.max.y).toBe(15);
    });

    test("expandBoundingBox expands by amount", () => {
      const box = { min: new Vec2(0, 0), max: new Vec2(10, 10) };
      const expanded = expandBoundingBox(box, 5);
      expect(expanded.min.x).toBe(-5);
      expect(expanded.min.y).toBe(-5);
      expect(expanded.max.x).toBe(15);
      expect(expanded.max.y).toBe(15);
    });

    test("unionBoundingBoxes merges two boxes", () => {
      const box1 = { min: new Vec2(0, 0), max: new Vec2(10, 10) };
      const box2 = { min: new Vec2(5, 5), max: new Vec2(20, 20) };
      const u = unionBoundingBoxes(box1, box2);
      expect(u.min.x).toBe(0);
      expect(u.min.y).toBe(0);
      expect(u.max.x).toBe(20);
      expect(u.max.y).toBe(20);
    });

    test("intersectBoundingBoxes finds overlap", () => {
      const box1 = { min: new Vec2(0, 0), max: new Vec2(10, 10) };
      const box2 = { min: new Vec2(5, 5), max: new Vec2(20, 20) };
      const i = intersectBoundingBoxes(box1, box2);
      expect(i).not.toBeNull();
      expect(i!.min.x).toBe(5);
      expect(i!.min.y).toBe(5);
      expect(i!.max.x).toBe(10);
      expect(i!.max.y).toBe(10);
    });

    test("intersectBoundingBoxes returns null when no overlap", () => {
      const box1 = { min: new Vec2(0, 0), max: new Vec2(5, 5) };
      const box2 = { min: new Vec2(10, 10), max: new Vec2(20, 20) };
      expect(intersectBoundingBoxes(box1, box2)).toBeNull();
    });

    test("isPointInBoundingBox for point inside", () => {
      const box = { min: new Vec2(0, 0), max: new Vec2(10, 10) };
      expect(isPointInBoundingBox({ x: 5, y: 5 }, box)).toBe(true);
    });

    test("isPointInBoundingBox for point outside", () => {
      const box = { min: new Vec2(0, 0), max: new Vec2(10, 10) };
      expect(isPointInBoundingBox({ x: 15, y: 5 }, box)).toBe(false);
    });

    test("isPointInBoundingBox for point on edge", () => {
      const box = { min: new Vec2(0, 0), max: new Vec2(10, 10) };
      expect(isPointInBoundingBox({ x: 10, y: 5 }, box)).toBe(true);
    });

    test("doBoundingBoxesIntersect for overlapping boxes", () => {
      const box1 = { min: new Vec2(0, 0), max: new Vec2(10, 10) };
      const box2 = { min: new Vec2(5, 5), max: new Vec2(15, 15) };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(true);
    });

    test("doBoundingBoxesIntersect for non-overlapping boxes", () => {
      const box1 = { min: new Vec2(0, 0), max: new Vec2(5, 5) };
      const box2 = { min: new Vec2(10, 10), max: new Vec2(15, 15) };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(false);
    });

    test("getBoundingBoxCenter returns center", () => {
      const box = { min: new Vec2(0, 0), max: new Vec2(10, 20) };
      const c = getBoundingBoxCenter(box);
      expectNear(c.x, 5);
      expectNear(c.y, 10);
    });

    test("getBoundingBoxSize returns width and height", () => {
      const box = { min: new Vec2(5, 10), max: new Vec2(15, 30) };
      const s = getBoundingBoxSize(box);
      expectNear(s.x, 10);
      expectNear(s.y, 20);
    });
  });

  // ==================== Point in Polygon/Circle ====================

  describe("point containment", () => {
    test("isPointInPolygon for point inside square", () => {
      const square = [
        { x: 0, y: 0 }, { x: 10, y: 0 },
        { x: 10, y: 10 }, { x: 0, y: 10 },
      ];
      expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    });

    test("isPointInPolygon for point outside square", () => {
      const square = [
        { x: 0, y: 0 }, { x: 10, y: 0 },
        { x: 10, y: 10 }, { x: 0, y: 10 },
      ];
      expect(isPointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
    });

    test("isPointInPolygon for triangle", () => {
      const triangle = [
        { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 },
      ];
      expect(isPointInPolygon({ x: 5, y: 3 }, triangle)).toBe(true);
      expect(isPointInPolygon({ x: 0, y: 10 }, triangle)).toBe(false);
    });

    test("isPointInPolygon returns false for < 3 vertices", () => {
      expect(isPointInPolygon({ x: 0, y: 0 }, [{ x: 0, y: 0 }, { x: 1, y: 0 }])).toBe(false);
    });

    test("isPointInCircle for point inside", () => {
      expect(isPointInCircle({ x: 2, y: 2 }, { center: { x: 0, y: 0 }, radius: 5 })).toBe(true);
    });

    test("isPointInCircle for point outside", () => {
      expect(isPointInCircle({ x: 10, y: 0 }, { center: { x: 0, y: 0 }, radius: 5 })).toBe(false);
    });

    test("isPointInCircle for point on circle", () => {
      expect(isPointInCircle({ x: 5, y: 0 }, { center: { x: 0, y: 0 }, radius: 5 })).toBe(true);
    });

    test("isPointOnSegment for point on segment", () => {
      expect(isPointOnSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(true);
    });

    test("isPointOnSegment for point off segment", () => {
      expect(isPointOnSegment({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(false);
    });
  });

  // ==================== Area & Perimeter ====================

  describe("area & perimeter", () => {
    test("triangleArea for right triangle", () => {
      // Triangle (0,0), (10,0), (0,10) → area = 50
      const area = triangleArea({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 });
      expectNear(area, 50);
    });

    test("triangleArea for degenerate triangle is 0", () => {
      const area = triangleArea({ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 });
      expectNear(area, 0);
    });

    test("polygonArea for unit square is 1", () => {
      const square = [
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: 1 }, { x: 0, y: 1 },
      ];
      expectNear(polygonArea(square), 1);
    });

    test("polygonArea for 10x20 rectangle is 200", () => {
      const rect = [
        { x: 0, y: 0 }, { x: 10, y: 0 },
        { x: 10, y: 20 }, { x: 0, y: 20 },
      ];
      expectNear(polygonArea(rect), 200);
    });

    test("polygonArea for < 3 vertices is 0", () => {
      expect(polygonArea([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(0);
    });

    test("polygonPerimeter for unit square is 4", () => {
      const square = [
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: 1 }, { x: 0, y: 1 },
      ];
      expectNear(polygonPerimeter(square), 4);
    });

    test("polygonPerimeter for triangle 3-4-5", () => {
      const tri = [
        { x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 },
      ];
      expectNear(polygonPerimeter(tri), 12); // 3 + 4 + 5
    });

    test("polygonCentroid for unit square is (0.5, 0.5)", () => {
      const square = [
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: 1 }, { x: 0, y: 1 },
      ];
      const c = polygonCentroid(square);
      expect(c).not.toBeNull();
      expectNear(c!.x, 0.5);
      expectNear(c!.y, 0.5);
    });

    test("polygonCentroid for empty array is null", () => {
      expect(polygonCentroid([])).toBeNull();
    });

    test("polygonCentroid for single point", () => {
      const c = polygonCentroid([{ x: 5, y: 10 }]);
      expect(c).not.toBeNull();
      expectNear(c!.x, 5);
      expectNear(c!.y, 10);
    });

    test("polygonCentroid for two points is midpoint", () => {
      const c = polygonCentroid([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
      expectNear(c!.x, 5);
      expectNear(c!.y, 5);
    });
  });

  // ==================== Utility Functions ====================

  describe("utility functions", () => {
    test("snapToGrid snaps to nearest grid", () => {
      expect(snapToGrid(7, 5)).toBe(5);
      expect(snapToGrid(8, 5)).toBe(10);
      expect(snapToGrid(12.3, 5)).toBe(10);
    });

    test("snapPointToGrid snaps both coordinates", () => {
      const p = snapPointToGrid({ x: 7, y: 13 }, 5);
      expect(p.x).toBe(5);
      expect(p.y).toBe(15);
    });

    test("clamp keeps value in range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    test("lerp interpolates linearly", () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0.25)).toBe(2.5);
    });

    test("nearlyEqual returns true for close values", () => {
      expect(nearlyEqual(1.0, 1.0 + 1e-12)).toBe(true);
    });

    test("nearlyEqual returns false for far values", () => {
      expect(nearlyEqual(1.0, 2.0)).toBe(false);
    });

    test("nearlyEqual with custom epsilon", () => {
      expect(nearlyEqual(1.0, 1.05, 0.1)).toBe(true);
      expect(nearlyEqual(1.0, 1.2, 0.1)).toBe(false);
    });

    test("midpoint returns center of two points", () => {
      const m = midpoint({ x: 0, y: 0 }, { x: 10, y: 20 });
      expectNear(m.x, 5);
      expectNear(m.y, 10);
    });

    test("subdivideSegment creates correct number of points", () => {
      const pts = subdivideSegment({ x: 0, y: 0 }, { x: 10, y: 0 }, 4);
      expect(pts).toHaveLength(5); // n+1 points for n divisions
    });

    test("subdivideSegment creates evenly spaced points", () => {
      const pts = subdivideSegment({ x: 0, y: 0 }, { x: 10, y: 0 }, 2);
      expectNear(pts[0].x, 0);
      expectNear(pts[1].x, 5);
      expectNear(pts[2].x, 10);
    });

    test("EPSILON is a very small positive number", () => {
      expect(EPSILON).toBeGreaterThan(0);
      expect(EPSILON).toBeLessThan(1e-5);
    });
  });
});
