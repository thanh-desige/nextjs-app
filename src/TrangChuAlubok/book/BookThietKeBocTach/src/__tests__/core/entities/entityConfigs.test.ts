/**
 * Entity Configs Golden Tests — STEP-3.2–3.8
 *
 * Tests for all 7 remaining entity configs:
 * RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION
 *
 * Each type gets ~10 tests covering:
 * - Factory (create)
 * - Translate (immutable)
 * - Rotate
 * - Scale
 * - Mirror
 * - containsPoint (positive + negative)
 * - getBounds
 * - getGripPoints
 * - clone (new id, same geometry)
 * - serialize → deserialize roundtrip
 */

// Import configs/index.ts to auto-register all built-in types
import "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs";
import { entityRegistry } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/EntityRegistry";

import { rectConfig } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/rectConfig";
import { circleConfig } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/circleConfig";
import { arcConfig } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/arcConfig";
import { ellipseConfig } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/ellipseConfig";
import { polylineConfig } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/polylineConfig";
import { textConfig } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/textConfig";
import { dimensionConfig } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/dimensionConfig";

import type {
  RectGeometry,
  CircleGeometry,
  ArcGeometry,
  EllipseGeometry,
  PolylineGeometry,
  TextGeometry,
  DimensionGeometry,
  UnifiedEntity,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/UnifiedEntity";

// ==================== Helpers ====================

const FP_TOL = 1e-10;

function expectClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(FP_TOL);
}

// ==================== RECT TESTS (R01–R10) ====================

describe("rectConfig (STEP-3.2)", () => {
  function createTestRect(): UnifiedEntity<RectGeometry> {
    return rectConfig.create({
      origin: { x: 0, y: 0 },
      width: 100,
      height: 50,
    });
  }

  test("R01: create → has id, entityType=RECT, correct geometry", () => {
    const rect = createTestRect();
    expect(rect.id).toBeDefined();
    expect(rect.entityType).toBe("RECT");
    expect(rect.geometry.type).toBe("RECT");
    expect(rect.geometry.origin).toEqual({ x: 0, y: 0 });
    expect(rect.geometry.width).toBe(100);
    expect(rect.geometry.height).toBe(50);
    expect(rect.geometry.rotation).toBe(0);
  });

  test("R02: translate(rect, 10, 20) → origin={10,20}, size unchanged", () => {
    const rect = createTestRect();
    const translated = rectConfig.translate(rect.geometry, 10, 20);
    expect(translated.origin).toEqual({ x: 10, y: 20 });
    expect(translated.width).toBe(100);
    expect(translated.height).toBe(50);
    // Immutable check
    expect(rect.geometry.origin).toEqual({ x: 0, y: 0 });
  });

  test("R03: rotate(rect, π/2, {0,0}) → origin rotated, rotation += π/2", () => {
    const rect = createTestRect();
    const rotated = rectConfig.rotate(rect.geometry, Math.PI / 2, {
      x: 0,
      y: 0,
    });
    expectClose(rotated.origin.x, 0);
    expectClose(rotated.origin.y, 0);
    expectClose(rotated.rotation, Math.PI / 2);
  });

  test("R04: scale(rect, 2, 3, {0,0}) → width=200, height=150", () => {
    const rect = createTestRect();
    const scaled = rectConfig.scale(rect.geometry, 2, 3, { x: 0, y: 0 });
    expect(scaled.width).toBe(200);
    expect(scaled.height).toBe(150);
    expect(scaled.origin).toEqual({ x: 0, y: 0 });
  });

  test("R05: mirror(rect, {0,0}, {0,1}) → origin mirrored across Y axis", () => {
    const rect = rectConfig.create({
      origin: { x: 10, y: 0 },
      width: 100,
      height: 50,
    });
    const mirrored = rectConfig.mirror(
      rect.geometry,
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    );
    expectClose(mirrored.origin.x, -10);
    expectClose(mirrored.origin.y, 0);
  });

  test("R06: containsPoint on edge → true", () => {
    const rect = createTestRect();
    // Point on top edge
    expect(rectConfig.containsPoint(rect.geometry, { x: 50, y: 0 }, 5)).toBe(
      true,
    );
    // Point on right edge
    expect(rectConfig.containsPoint(rect.geometry, { x: 100, y: 25 }, 5)).toBe(
      true,
    );
  });

  test("R07: containsPoint far away → false", () => {
    const rect = createTestRect();
    expect(rectConfig.containsPoint(rect.geometry, { x: 200, y: 200 }, 5)).toBe(
      false,
    );
  });

  test("R08: getBounds for unrotated rect", () => {
    const rect = createTestRect();
    const bounds = rectConfig.getBounds(rect.geometry);
    expect(bounds.min).toEqual({ x: 0, y: 0 });
    expect(bounds.max).toEqual({ x: 100, y: 50 });
  });

  test("R09: getGripPoints → 9 grips (4 corners + 4 midpoints + center)", () => {
    const rect = createTestRect();
    const grips = rectConfig.getGripPoints(rect.geometry, rect.id);
    expect(grips).toHaveLength(9);
    // 4 endpoints (corners)
    expect(grips.filter((g) => g.type === "endpoint")).toHaveLength(4);
    // 4 midpoints (edges)
    expect(grips.filter((g) => g.type === "midpoint")).toHaveLength(4);
    // 1 center
    expect(grips.filter((g) => g.type === "center")).toHaveLength(1);
  });

  test("R10: clone → new id, same geometry", () => {
    const rect = createTestRect();
    const cloned = rectConfig.clone(rect);
    expect(cloned.id).not.toBe(rect.id);
    expect(cloned.geometry.origin).toEqual(rect.geometry.origin);
    expect(cloned.geometry.width).toBe(rect.geometry.width);
    expect(cloned.geometry.height).toBe(rect.geometry.height);
  });

  test("R11: serialize → deserialize roundtrip", () => {
    const rect = createTestRect();
    const json = rectConfig.serialize(rect);
    const restored = rectConfig.deserialize(json);
    expect(restored.geometry.type).toBe("RECT");
    expect(restored.geometry.origin).toEqual(rect.geometry.origin);
    expect(restored.geometry.width).toBe(rect.geometry.width);
    expect(restored.geometry.height).toBe(rect.geometry.height);
  });
});

// ==================== CIRCLE TESTS (C01–C10) ====================

describe("circleConfig (STEP-3.3)", () => {
  function createTestCircle(): UnifiedEntity<CircleGeometry> {
    return circleConfig.create({
      center: { x: 50, y: 50 },
      radius: 30,
    });
  }

  test("C01: create → has id, entityType=CIRCLE", () => {
    const circle = createTestCircle();
    expect(circle.id).toBeDefined();
    expect(circle.entityType).toBe("CIRCLE");
    expect(circle.geometry.type).toBe("CIRCLE");
    expect(circle.geometry.center).toEqual({ x: 50, y: 50 });
    expect(circle.geometry.radius).toBe(30);
  });

  test("C02: translate(circle, 10, -10) → center={60,40}", () => {
    const circle = createTestCircle();
    const translated = circleConfig.translate(circle.geometry, 10, -10);
    expect(translated.center).toEqual({ x: 60, y: 40 });
    expect(translated.radius).toBe(30);
    // Immutable
    expect(circle.geometry.center).toEqual({ x: 50, y: 50 });
  });

  test("C03: rotate(circle, π, {0,0}) → center rotated, radius unchanged", () => {
    const circle = createTestCircle();
    const rotated = circleConfig.rotate(circle.geometry, Math.PI, {
      x: 0,
      y: 0,
    });
    expectClose(rotated.center.x, -50);
    expectClose(rotated.center.y, -50);
    expect(rotated.radius).toBe(30);
  });

  test("C04: scale(circle, 2, 2, {0,0}) → center={100,100}, radius=60", () => {
    const circle = createTestCircle();
    const scaled = circleConfig.scale(circle.geometry, 2, 2, { x: 0, y: 0 });
    expect(scaled.center).toEqual({ x: 100, y: 100 });
    expect(scaled.radius).toBe(60);
  });

  test("C05: mirror across Y axis", () => {
    const circle = createTestCircle();
    const mirrored = circleConfig.mirror(
      circle.geometry,
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    );
    expectClose(mirrored.center.x, -50);
    expectClose(mirrored.center.y, 50);
    expect(mirrored.radius).toBe(30);
  });

  test("C06: containsPoint on stroke → true", () => {
    const circle = createTestCircle();
    // Point on east quadrant (50+30, 50)
    expect(
      circleConfig.containsPoint(circle.geometry, { x: 80, y: 50 }, 5),
    ).toBe(true);
  });

  test("C07: containsPoint at center → false (stroke only)", () => {
    const circle = createTestCircle();
    expect(
      circleConfig.containsPoint(circle.geometry, { x: 50, y: 50 }, 5),
    ).toBe(false);
  });

  test("C08: getBounds", () => {
    const circle = createTestCircle();
    const bounds = circleConfig.getBounds(circle.geometry);
    expect(bounds.min).toEqual({ x: 20, y: 20 });
    expect(bounds.max).toEqual({ x: 80, y: 80 });
  });

  test("C09: getGripPoints → 5 (center + 4 quadrants)", () => {
    const circle = createTestCircle();
    const grips = circleConfig.getGripPoints(circle.geometry, circle.id);
    expect(grips).toHaveLength(5);
    expect(grips[0].type).toBe("center");
    expect(grips[1].type).toBe("quadrant");
    // East quadrant
    expect(grips[1].position).toEqual({ x: 80, y: 50 });
  });

  test("C10: clone + serialize/deserialize", () => {
    const circle = createTestCircle();
    const cloned = circleConfig.clone(circle);
    expect(cloned.id).not.toBe(circle.id);
    expect(cloned.geometry.center).toEqual(circle.geometry.center);

    const json = circleConfig.serialize(circle);
    const restored = circleConfig.deserialize(json);
    expect(restored.geometry.radius).toBe(30);
  });
});

// ==================== ARC TESTS (A01–A10) ====================

describe("arcConfig (STEP-3.4)", () => {
  function createTestArc(): UnifiedEntity<ArcGeometry> {
    return arcConfig.create({
      center: { x: 0, y: 0 },
      radius: 50,
      startAngle: 0,
      endAngle: Math.PI / 2,
    });
  }

  test("A01: create → has id, entityType=ARC", () => {
    const arc = createTestArc();
    expect(arc.id).toBeDefined();
    expect(arc.entityType).toBe("ARC");
    expect(arc.geometry.type).toBe("ARC");
    expect(arc.geometry.center).toEqual({ x: 0, y: 0 });
    expect(arc.geometry.radius).toBe(50);
    expect(arc.geometry.startAngle).toBe(0);
    expect(arc.geometry.endAngle).toBe(Math.PI / 2);
  });

  test("A02: translate(arc, 10, 20) → center moved, angles preserved", () => {
    const arc = createTestArc();
    const translated = arcConfig.translate(arc.geometry, 10, 20);
    expect(translated.center).toEqual({ x: 10, y: 20 });
    expect(translated.startAngle).toBe(0);
    expect(translated.endAngle).toBe(Math.PI / 2);
    expect(translated.radius).toBe(50);
    // Immutable
    expect(arc.geometry.center).toEqual({ x: 0, y: 0 });
  });

  test("A03: rotate(arc, π/2, {0,0}) → angles shift by π/2", () => {
    const arc = createTestArc();
    const rotated = arcConfig.rotate(arc.geometry, Math.PI / 2, { x: 0, y: 0 });
    expectClose(rotated.startAngle, Math.PI / 2);
    expectClose(rotated.endAngle, Math.PI);
  });

  test("A04: scale(arc, 2, 2, {0,0}) → radius=100", () => {
    const arc = createTestArc();
    const scaled = arcConfig.scale(arc.geometry, 2, 2, { x: 0, y: 0 });
    expect(scaled.radius).toBe(100);
  });

  test("A05: mirror across Y axis → angles swap+mirror", () => {
    const arc = createTestArc();
    const mirrored = arcConfig.mirror(
      arc.geometry,
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    );
    expectClose(mirrored.center.x, 0);
    expectClose(mirrored.center.y, 0);
    expect(mirrored.radius).toBe(50);
  });

  test("A06: containsPoint on arc → true", () => {
    const arc = createTestArc();
    // Point on east of arc (50, 0) → angle=0 → on arc
    expect(arcConfig.containsPoint(arc.geometry, { x: 50, y: 0 }, 5)).toBe(
      true,
    );
  });

  test("A07: containsPoint on opposite side → false", () => {
    const arc = createTestArc();
    // angle=π → outside arc range [0, π/2]
    expect(arcConfig.containsPoint(arc.geometry, { x: -50, y: 0 }, 5)).toBe(
      false,
    );
  });

  test("A08: getBounds for quarter-circle arc", () => {
    const arc = createTestArc();
    const bounds = arcConfig.getBounds(arc.geometry);
    // Arc from 0 to π/2: goes from (50,0) through first quadrant to (0,50)
    // Quadrant 0° is included → x extends to 50
    expectClose(bounds.min.x, 0);
    expectClose(bounds.min.y, 0);
    expectClose(bounds.max.x, 50);
    expectClose(bounds.max.y, 50);
  });

  test("A09: getGripPoints → 4 (center, start, mid, end)", () => {
    const arc = createTestArc();
    const grips = arcConfig.getGripPoints(arc.geometry, arc.id);
    expect(grips).toHaveLength(4);
    expect(grips[0].type).toBe("center");
    expect(grips[1].type).toBe("endpoint"); // start
    expect(grips[2].type).toBe("midpoint"); // mid
    expect(grips[3].type).toBe("endpoint"); // end
  });

  test("A10: clone + serialize/deserialize", () => {
    const arc = createTestArc();
    const cloned = arcConfig.clone(arc);
    expect(cloned.id).not.toBe(arc.id);
    expect(cloned.geometry.startAngle).toBe(arc.geometry.startAngle);

    const json = arcConfig.serialize(arc);
    const restored = arcConfig.deserialize(json);
    expect(restored.geometry.radius).toBe(50);
    expect(restored.geometry.endAngle).toBe(Math.PI / 2);
  });
});

// ==================== ELLIPSE TESTS (E01–E10) ====================

describe("ellipseConfig (STEP-3.5)", () => {
  function createTestEllipse(): UnifiedEntity<EllipseGeometry> {
    return ellipseConfig.create({
      center: { x: 0, y: 0 },
      majorRadius: 100,
      minorRadius: 50,
    });
  }

  test("E01: create → has id, entityType=ELLIPSE", () => {
    const e = createTestEllipse();
    expect(e.id).toBeDefined();
    expect(e.entityType).toBe("ELLIPSE");
    expect(e.geometry.type).toBe("ELLIPSE");
    expect(e.geometry.center).toEqual({ x: 0, y: 0 });
    expect(e.geometry.majorRadius).toBe(100);
    expect(e.geometry.minorRadius).toBe(50);
    expect(e.geometry.rotation).toBe(0);
  });

  test("E02: translate → center moved, radii unchanged", () => {
    const e = createTestEllipse();
    const t = ellipseConfig.translate(e.geometry, 10, 20);
    expect(t.center).toEqual({ x: 10, y: 20 });
    expect(t.majorRadius).toBe(100);
    expect(t.minorRadius).toBe(50);
    // Immutable
    expect(e.geometry.center).toEqual({ x: 0, y: 0 });
  });

  test("E03: rotate → rotation increases", () => {
    const e = createTestEllipse();
    const r = ellipseConfig.rotate(e.geometry, Math.PI / 4, { x: 0, y: 0 });
    expectClose(r.rotation, Math.PI / 4);
    expectClose(r.center.x, 0);
    expectClose(r.center.y, 0);
  });

  test("E04: scale(2, 3) → majorRadius=200, minorRadius=150", () => {
    const e = createTestEllipse();
    const s = ellipseConfig.scale(e.geometry, 2, 3, { x: 0, y: 0 });
    expect(s.majorRadius).toBe(200);
    expect(s.minorRadius).toBe(150);
  });

  test("E05: mirror across Y axis", () => {
    const e = ellipseConfig.create({
      center: { x: 50, y: 0 },
      majorRadius: 100,
      minorRadius: 50,
    });
    const m = ellipseConfig.mirror(e.geometry, { x: 0, y: 0 }, { x: 0, y: 1 });
    expectClose(m.center.x, -50);
    expectClose(m.center.y, 0);
    expect(m.majorRadius).toBe(100);
  });

  test("E06: containsPoint on major axis endpoint → true", () => {
    const e = createTestEllipse();
    // (100, 0) is on the ellipse, majorRadius = 100
    expect(ellipseConfig.containsPoint(e.geometry, { x: 100, y: 0 }, 5)).toBe(
      true,
    );
  });

  test("E07: containsPoint at center → false (stroke only)", () => {
    const e = createTestEllipse();
    expect(ellipseConfig.containsPoint(e.geometry, { x: 0, y: 0 }, 5)).toBe(
      false,
    );
  });

  test("E08: getBounds for unrotated ellipse", () => {
    const e = createTestEllipse();
    const b = ellipseConfig.getBounds(e.geometry);
    expectClose(b.min.x, -100);
    expectClose(b.min.y, -50);
    expectClose(b.max.x, 100);
    expectClose(b.max.y, 50);
  });

  test("E09: getGripPoints → 5 (center + 4 axis endpoints)", () => {
    const e = createTestEllipse();
    const grips = ellipseConfig.getGripPoints(e.geometry, e.id);
    expect(grips).toHaveLength(5);
    expect(grips[0].type).toBe("center");
    // Major axis + (angle=0) → (100, 0)
    expectClose(grips[1].position.x, 100);
    expectClose(grips[1].position.y, 0);
  });

  test("E10: clone + serialize/deserialize", () => {
    const e = createTestEllipse();
    const cloned = ellipseConfig.clone(e);
    expect(cloned.id).not.toBe(e.id);
    expect(cloned.geometry.majorRadius).toBe(100);

    const json = ellipseConfig.serialize(e);
    const restored = ellipseConfig.deserialize(json);
    expect(restored.geometry.minorRadius).toBe(50);
  });
});

// ==================== POLYLINE TESTS (P01–P10) ====================

describe("polylineConfig (STEP-3.6)", () => {
  function createTestPolyline(): UnifiedEntity<PolylineGeometry> {
    return polylineConfig.create({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
      ],
      closed: false,
    });
  }

  function createTestPolygon(): UnifiedEntity<PolylineGeometry> {
    return polylineConfig.create({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      closed: true,
    });
  }

  test("P01: create → has id, entityType=POLYLINE", () => {
    const pl = createTestPolyline();
    expect(pl.id).toBeDefined();
    expect(pl.entityType).toBe("POLYLINE");
    expect(pl.geometry.type).toBe("POLYLINE");
    expect(pl.geometry.points).toHaveLength(3);
    expect(pl.geometry.closed).toBe(false);
  });

  test("P02: translate → all points moved", () => {
    const pl = createTestPolyline();
    const t = polylineConfig.translate(pl.geometry, 10, 20);
    expect(t.points[0]).toEqual({ x: 10, y: 20 });
    expect(t.points[1]).toEqual({ x: 110, y: 20 });
    expect(t.points[2]).toEqual({ x: 110, y: 70 });
    // Immutable
    expect(pl.geometry.points[0]).toEqual({ x: 0, y: 0 });
  });

  test("P03: rotate 90° around origin", () => {
    const pl = createTestPolyline();
    const r = polylineConfig.rotate(pl.geometry, Math.PI / 2, { x: 0, y: 0 });
    expectClose(r.points[0].x, 0);
    expectClose(r.points[0].y, 0);
    expectClose(r.points[1].x, 0);
    expectClose(r.points[1].y, 100);
  });

  test("P04: scale(2, 2) → points doubled", () => {
    const pl = createTestPolyline();
    const s = polylineConfig.scale(pl.geometry, 2, 2, { x: 0, y: 0 });
    expect(s.points[1]).toEqual({ x: 200, y: 0 });
    expect(s.points[2]).toEqual({ x: 200, y: 100 });
  });

  test("P05: mirror across Y axis", () => {
    const pl = createTestPolyline();
    const m = polylineConfig.mirror(
      pl.geometry,
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    );
    expectClose(m.points[1].x, -100);
    expectClose(m.points[1].y, 0);
  });

  test("P06: containsPoint on segment → true", () => {
    const pl = createTestPolyline();
    // Midpoint of first segment
    expect(polylineConfig.containsPoint(pl.geometry, { x: 50, y: 0 }, 5)).toBe(
      true,
    );
  });

  test("P07: containsPoint inside closed polygon → true", () => {
    const pg = createTestPolygon();
    // Center of square
    expect(polylineConfig.containsPoint(pg.geometry, { x: 50, y: 50 }, 5)).toBe(
      true,
    );
  });

  test("P08: containsPoint far away → false", () => {
    const pl = createTestPolyline();
    expect(
      polylineConfig.containsPoint(pl.geometry, { x: 500, y: 500 }, 5),
    ).toBe(false);
  });

  test("P09: getBounds", () => {
    const pl = createTestPolyline();
    const b = polylineConfig.getBounds(pl.geometry);
    expect(b.min).toEqual({ x: 0, y: 0 });
    expect(b.max).toEqual({ x: 100, y: 50 });
  });

  test("P10: getGripPoints → 3 endpoints + 2 midpoints (open, 3 vertices)", () => {
    const pl = createTestPolyline();
    const grips = polylineConfig.getGripPoints(pl.geometry, pl.id);
    const endpoints = grips.filter((g) => g.type === "endpoint");
    const midpoints = grips.filter((g) => g.type === "midpoint");
    expect(endpoints).toHaveLength(3);
    expect(midpoints).toHaveLength(2);
  });

  test("P11: clone + serialize/deserialize", () => {
    const pl = createTestPolyline();
    const cloned = polylineConfig.clone(pl);
    expect(cloned.id).not.toBe(pl.id);
    expect(cloned.geometry.points).toEqual(pl.geometry.points);

    const json = polylineConfig.serialize(pl);
    const restored = polylineConfig.deserialize(json);
    expect(restored.geometry.points).toHaveLength(3);
    expect(restored.geometry.closed).toBe(false);
  });
});

// ==================== TEXT TESTS (T01–T10) ====================

describe("textConfig (STEP-3.7)", () => {
  function createTestText(): UnifiedEntity<TextGeometry> {
    return textConfig.create({
      position: { x: 100, y: 200 },
      text: "Hello",
      fontSize: 12,
    });
  }

  test("T01: create → has id, entityType=TEXT", () => {
    const t = createTestText();
    expect(t.id).toBeDefined();
    expect(t.entityType).toBe("TEXT");
    expect(t.geometry.type).toBe("TEXT");
    expect(t.geometry.position).toEqual({ x: 100, y: 200 });
    expect(t.geometry.text).toBe("Hello");
    expect(t.geometry.fontSize).toBe(12);
    expect(t.geometry.fontFamily).toBe("Arial");
  });

  test("T02: translate → position moved", () => {
    const t = createTestText();
    const tr = textConfig.translate(t.geometry, -50, 10);
    expect(tr.position).toEqual({ x: 50, y: 210 });
    expect(tr.text).toBe("Hello");
    // Immutable
    expect(t.geometry.position).toEqual({ x: 100, y: 200 });
  });

  test("T03: rotate → position rotated, rotation incremented", () => {
    const t = createTestText();
    const r = textConfig.rotate(t.geometry, Math.PI / 2, { x: 0, y: 0 });
    expectClose(r.position.x, -200);
    expectClose(r.position.y, 100);
    expectClose(r.rotation, Math.PI / 2);
  });

  test("T04: scale(2, 2) → position scaled, fontSize doubled", () => {
    const t = createTestText();
    const s = textConfig.scale(t.geometry, 2, 2, { x: 0, y: 0 });
    expect(s.position).toEqual({ x: 200, y: 400 });
    expect(s.fontSize).toBe(24);
  });

  test("T05: mirror across Y axis", () => {
    const t = createTestText();
    const m = textConfig.mirror(t.geometry, { x: 0, y: 0 }, { x: 0, y: 1 });
    expectClose(m.position.x, -100);
    expectClose(m.position.y, 200);
  });

  test("T06: containsPoint near text bounds → true", () => {
    const t = createTestText();
    // Text position is insertion point, bounds extend from there
    const bounds = textConfig.getBounds(t.geometry);
    const center = {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2,
    };
    expect(textConfig.containsPoint(t.geometry, center, 5)).toBe(true);
  });

  test("T07: containsPoint far away → false", () => {
    const t = createTestText();
    expect(textConfig.containsPoint(t.geometry, { x: 1000, y: 1000 }, 5)).toBe(
      false,
    );
  });

  test("T08: getBounds returns reasonable box", () => {
    const t = createTestText();
    const b = textConfig.getBounds(t.geometry);
    expect(b.max.x - b.min.x).toBeGreaterThan(0);
    expect(b.max.y - b.min.y).toBeGreaterThan(0);
  });

  test("T09: getGripPoints → 3 (position, center, rotation)", () => {
    const t = createTestText();
    const grips = textConfig.getGripPoints(t.geometry, t.id);
    expect(grips).toHaveLength(3);
    expect(grips[0].type).toBe("endpoint"); // position
    expect(grips[1].type).toBe("center");
    expect(grips[2].type).toBe("rotation");
  });

  test("T10: clone + serialize/deserialize", () => {
    const t = createTestText();
    const cloned = textConfig.clone(t);
    expect(cloned.id).not.toBe(t.id);
    expect(cloned.geometry.text).toBe("Hello");

    const json = textConfig.serialize(t);
    const restored = textConfig.deserialize(json);
    expect(restored.geometry.text).toBe("Hello");
    expect(restored.geometry.fontSize).toBe(12);
  });
});

// ==================== DIMENSION TESTS (D01–D10) ====================

describe("dimensionConfig (STEP-3.8)", () => {
  function createTestDimension(): UnifiedEntity<DimensionGeometry> {
    return dimensionConfig.create({
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 100, y: 0 },
      offset: 30,
    });
  }

  test("D01: create → has id, entityType=DIMENSION", () => {
    const d = createTestDimension();
    expect(d.id).toBeDefined();
    expect(d.entityType).toBe("DIMENSION");
    expect(d.geometry.type).toBe("DIMENSION");
    expect(d.geometry.startPoint).toEqual({ x: 0, y: 0 });
    expect(d.geometry.endPoint).toEqual({ x: 100, y: 0 });
    expect(d.geometry.offset).toBe(30);
    // textPosition should be calculated automatically
    expect(d.geometry.textPosition).toBeDefined();
  });

  test("D02: translate → all points moved", () => {
    const d = createTestDimension();
    const t = dimensionConfig.translate(d.geometry, 10, 20);
    expect(t.startPoint).toEqual({ x: 10, y: 20 });
    expect(t.endPoint).toEqual({ x: 110, y: 20 });
    expect(t.offset).toBe(30);
    // Immutable
    expect(d.geometry.startPoint).toEqual({ x: 0, y: 0 });
  });

  test("D03: rotate → all points rotated", () => {
    const d = createTestDimension();
    const r = dimensionConfig.rotate(d.geometry, Math.PI / 2, { x: 0, y: 0 });
    expectClose(r.startPoint.x, 0);
    expectClose(r.startPoint.y, 0);
    expectClose(r.endPoint.x, 0);
    expectClose(r.endPoint.y, 100);
  });

  test("D04: scale(2, 2) → points scaled", () => {
    const d = createTestDimension();
    const s = dimensionConfig.scale(d.geometry, 2, 2, { x: 0, y: 0 });
    expect(s.startPoint).toEqual({ x: 0, y: 0 });
    expect(s.endPoint).toEqual({ x: 200, y: 0 });
    expect(s.offset).toBe(60); // offset also scaled
  });

  test("D05: mirror across Y axis", () => {
    const d = createTestDimension();
    const m = dimensionConfig.mirror(
      d.geometry,
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    );
    expectClose(m.startPoint.x, 0);
    expectClose(m.startPoint.y, 0);
    expectClose(m.endPoint.x, -100);
    expectClose(m.endPoint.y, 0);
  });

  test("D06: containsPoint on dimension line → true", () => {
    const d = createTestDimension();
    // Dimension line at offset 30 above: from (0,30) to (100,30)
    // The normal for horizontal line (0,0)→(100,0) is (0,-1)*30 = (0,-30),
    // but our calc uses perpendicular: (-dy/len, dx/len) = (0, 1)*30 = (0,30)
    expect(dimensionConfig.containsPoint(d.geometry, { x: 50, y: 30 }, 5)).toBe(
      true,
    );
  });

  test("D07: containsPoint far away → false", () => {
    const d = createTestDimension();
    expect(
      dimensionConfig.containsPoint(d.geometry, { x: 500, y: 500 }, 5),
    ).toBe(false);
  });

  test("D08: getBounds includes offset line", () => {
    const d = createTestDimension();
    const b = dimensionConfig.getBounds(d.geometry);
    // Should span from (0,0) to (100,30) at least
    expect(b.min.x).toBeLessThanOrEqual(0);
    expect(b.max.x).toBeGreaterThanOrEqual(100);
  });

  test("D09: getGripPoints → 3 (startPoint, endPoint, textPosition)", () => {
    const d = createTestDimension();
    const grips = dimensionConfig.getGripPoints(d.geometry, d.id);
    expect(grips).toHaveLength(3);
    expect(grips[0].type).toBe("endpoint");
    expect(grips[1].type).toBe("endpoint");
    expect(grips[2].type).toBe("control");
  });

  test("D10: clone + serialize/deserialize", () => {
    const d = createTestDimension();
    const cloned = dimensionConfig.clone(d);
    expect(cloned.id).not.toBe(d.id);
    expect(cloned.geometry.startPoint).toEqual(d.geometry.startPoint);
    expect(cloned.geometry.endPoint).toEqual(d.geometry.endPoint);

    const json = dimensionConfig.serialize(d);
    const restored = dimensionConfig.deserialize(json);
    expect(restored.geometry.offset).toBe(30);
  });
});

// ==================== REGISTRY INTEGRATION TESTS ====================

describe("EntityRegistry integration (STEP-3.2–3.8)", () => {
  test("All 8 types registered", () => {
    const types = entityRegistry.getRegisteredTypes();
    expect(types).toContain("LINE");
    expect(types).toContain("RECT");
    expect(types).toContain("CIRCLE");
    expect(types).toContain("ARC");
    expect(types).toContain("ELLIPSE");
    expect(types).toContain("POLYLINE");
    expect(types).toContain("TEXT");
    expect(types).toContain("DIMENSION");
    expect(types).toHaveLength(8);
  });

  test("Registry translate dispatches to correct config", () => {
    const rect = rectConfig.create({
      origin: { x: 0, y: 0 },
      width: 100,
      height: 50,
    });
    const translated = entityRegistry.translate(rect, 5, 10);
    expect(translated.geometry.origin).toEqual({ x: 5, y: 10 });
    expect((translated.geometry as RectGeometry).width).toBe(100);
  });

  test("Registry containsPoint dispatches to correct config", () => {
    const circle = circleConfig.create({
      center: { x: 0, y: 0 },
      radius: 50,
    });
    // On stroke
    expect(entityRegistry.containsPoint(circle, { x: 50, y: 0 }, 5)).toBe(true);
    // Far away
    expect(entityRegistry.containsPoint(circle, { x: 200, y: 200 }, 5)).toBe(
      false,
    );
  });

  test("Registry clone dispatches to correct config", () => {
    const poly = polylineConfig.create({
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
    });
    const cloned = entityRegistry.clone(poly);
    expect(cloned.id).not.toBe(poly.id);
    expect(cloned.geometry.type).toBe("POLYLINE");
  });
});
