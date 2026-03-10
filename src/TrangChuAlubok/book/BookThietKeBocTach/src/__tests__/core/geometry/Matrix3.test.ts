/**
 * Matrix3 Tests — Phase 3 Geometry
 *
 * Tests for 3x3 affine transformation matrix used throughout CAD.
 * Column-major order: | a c tx | = | m[0] m[3] m[6] |
 *                     | b d ty |   | m[1] m[4] m[7] |
 *                     | 0 0 1  |   | m[2] m[5] m[8] |
 */

import { Matrix3 } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Matrix3";
import { Vec2 } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Vec2";

const EPSILON = 1e-9;

function expectNear(actual: number, expected: number, eps = EPSILON) {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

describe("Matrix3", () => {
  // ==================== Factory Methods ====================

  describe("factory methods", () => {
    test("identity() creates identity matrix", () => {
      const m = Matrix3.identity();
      expect(m.elements[0]).toBe(1);
      expect(m.elements[4]).toBe(1);
      expect(m.elements[8]).toBe(1);
      expect(m.elements[1]).toBe(0);
      expect(m.elements[3]).toBe(0);
      expect(m.elements[6]).toBe(0);
      expect(m.elements[7]).toBe(0);
    });

    test("translation(tx, ty) creates translation matrix", () => {
      const m = Matrix3.translation(10, 20);
      expect(m.elements[6]).toBe(10);
      expect(m.elements[7]).toBe(20);
      expect(m.elements[0]).toBe(1);
      expect(m.elements[4]).toBe(1);
    });

    test("rotation(angle) creates rotation matrix", () => {
      const m = Matrix3.rotation(Math.PI / 2); // 90°
      expectNear(m.elements[0], 0);   // cos(90)
      expectNear(m.elements[1], 1);   // sin(90)
      expectNear(m.elements[3], -1);  // -sin(90)
      expectNear(m.elements[4], 0);   // cos(90)
    });

    test("rotationDeg(90) same as rotation(PI/2)", () => {
      const m1 = Matrix3.rotation(Math.PI / 2);
      const m2 = Matrix3.rotationDeg(90);
      expect(m1.equals(m2)).toBe(true);
    });

    test("scaling(sx, sy) creates scale matrix", () => {
      const m = Matrix3.scaling(2, 3);
      expect(m.elements[0]).toBe(2);
      expect(m.elements[4]).toBe(3);
    });

    test("scaling(s) creates uniform scale", () => {
      const m = Matrix3.scaling(5);
      expect(m.elements[0]).toBe(5);
      expect(m.elements[4]).toBe(5);
    });

    test("rotationAround(center, angle) rotates around center", () => {
      const center = { x: 100, y: 100 };
      const m = Matrix3.rotationAround(center, Math.PI / 2);
      // Point (200, 100) rotated 90° around (100, 100) → (100, 200)
      const result = m.transformPoint({ x: 200, y: 100 });
      expectNear(result.x, 100);
      expectNear(result.y, 200);
    });

    test("scalingFrom(center, sx, sy) scales from center", () => {
      const center = { x: 50, y: 50 };
      const m = Matrix3.scalingFrom(center, 2);
      // Point (100, 100) scaled 2x from (50, 50) → (150, 150)
      const result = m.transformPoint({ x: 100, y: 100 });
      expectNear(result.x, 150);
      expectNear(result.y, 150);
    });

    test("fromValues(a, b, c, d, tx, ty) sets affine values", () => {
      const m = Matrix3.fromValues(2, 0, 0, 3, 10, 20);
      expect(m.elements[0]).toBe(2);
      expect(m.elements[4]).toBe(3);
      expect(m.elements[6]).toBe(10);
      expect(m.elements[7]).toBe(20);
    });
  });

  // ==================== Instance Methods ====================

  describe("instance methods", () => {
    test("clone() creates independent copy", () => {
      const m1 = Matrix3.translation(5, 10);
      const m2 = m1.clone();
      m2.elements[6] = 99;
      expect(m1.elements[6]).toBe(5); // Original unchanged
    });

    test("copy() copies from another matrix", () => {
      const m1 = Matrix3.translation(5, 10);
      const m2 = new Matrix3();
      m2.copy(m1);
      expect(m2.elements[6]).toBe(5);
      expect(m2.elements[7]).toBe(10);
    });

    test("identity() resets to identity", () => {
      const m = Matrix3.translation(5, 10);
      m.identity();
      expect(m.isIdentity()).toBe(true);
    });

    test("get(row, col) returns correct element", () => {
      const m = Matrix3.translation(10, 20);
      expect(m.get(0, 2)).toBe(10); // tx
      expect(m.get(1, 2)).toBe(20); // ty
      expect(m.get(0, 0)).toBe(1);  // a
    });

    test("set(row, col, value) sets element", () => {
      const m = new Matrix3();
      m.set(0, 2, 42);
      expect(m.elements[6]).toBe(42);
    });
  });

  // ==================== Transform Operations ====================

  describe("transform operations", () => {
    test("multiply combines two matrices", () => {
      const t = Matrix3.translation(10, 0);
      const s = Matrix3.scaling(2);
      // Scale first, then translate: T * S
      const result = t.multiply(s);
      const p = result.transformPoint({ x: 5, y: 0 });
      expectNear(p.x, 20); // 5 * 2 + 10
      expectNear(p.y, 0);
    });

    test("multiply identity does not change", () => {
      const m = Matrix3.translation(3, 4);
      const result = m.multiply(Matrix3.identity());
      expect(m.equals(result)).toBe(true);
    });

    test("premultiply reverses order", () => {
      const t = Matrix3.translation(10, 0);
      const s = Matrix3.scaling(2);
      // premultiply: s * t → scale then translate
      const result = t.premultiply(s);
      const p = result.transformPoint({ x: 5, y: 0 });
      expectNear(p.x, 30); // (5 + 10) * 2
    });

    test("translate chains correctly", () => {
      const m = Matrix3.identity().translate(10, 20);
      const p = m.transformPoint({ x: 0, y: 0 });
      expectNear(p.x, 10);
      expectNear(p.y, 20);
    });

    test("rotate chains correctly", () => {
      const m = Matrix3.identity().rotate(Math.PI);
      const p = m.transformPoint({ x: 1, y: 0 });
      expectNear(p.x, -1);
      expectNear(p.y, 0);
    });

    test("scale chains correctly", () => {
      const m = Matrix3.identity().scale(3, 2);
      const p = m.transformPoint({ x: 5, y: 10 });
      expectNear(p.x, 15);
      expectNear(p.y, 20);
    });
  });

  // ==================== Matrix Operations ====================

  describe("matrix operations", () => {
    test("determinant of identity is 1", () => {
      expect(Matrix3.identity().determinant()).toBe(1);
    });

    test("determinant of scaling(2, 3) is 6", () => {
      expectNear(Matrix3.scaling(2, 3).determinant(), 6);
    });

    test("determinant of rotation is 1", () => {
      expectNear(Matrix3.rotation(0.7).determinant(), 1);
    });

    test("inverse of identity is identity", () => {
      const inv = Matrix3.identity().inverse();
      expect(inv).not.toBeNull();
      expect(inv!.isIdentity()).toBe(true);
    });

    test("inverse of translation reverses it", () => {
      const m = Matrix3.translation(10, 20);
      const inv = m.inverse()!;
      const p = inv.transformPoint({ x: 10, y: 20 });
      expectNear(p.x, 0);
      expectNear(p.y, 0);
    });

    test("M * M^-1 = identity", () => {
      const m = Matrix3.translation(5, 10)
        .rotate(Math.PI / 4)
        .scale(2, 3);
      const inv = m.inverse()!;
      const product = m.multiply(inv);
      expect(product.isIdentity()).toBe(true);
    });

    test("inverse of singular matrix returns null", () => {
      const m = Matrix3.scaling(0, 0);
      expect(m.inverse()).toBeNull();
    });

    test("transpose swaps rows and columns", () => {
      const m = Matrix3.fromValues(1, 2, 3, 4, 5, 6);
      const t = m.transpose();
      expect(t.get(0, 1)).toBe(m.get(1, 0));
      expect(t.get(1, 0)).toBe(m.get(0, 1));
    });
  });

  // ==================== Apply Transform ====================

  describe("point & vector transforms", () => {
    test("transformPoint applies translation", () => {
      const m = Matrix3.translation(100, 200);
      const p = m.transformPoint({ x: 10, y: 20 });
      expectNear(p.x, 110);
      expectNear(p.y, 220);
    });

    test("transformVector ignores translation", () => {
      const m = Matrix3.translation(100, 200);
      const v = m.transformVector({ x: 10, y: 20 });
      expectNear(v.x, 10);
      expectNear(v.y, 20);
    });

    test("transformVector applies rotation", () => {
      const m = Matrix3.rotation(Math.PI / 2);
      const v = m.transformVector({ x: 1, y: 0 });
      expectNear(v.x, 0);
      expectNear(v.y, 1);
    });

    test("transformPoints maps array", () => {
      const m = Matrix3.translation(10, 10);
      const pts = m.transformPoints([
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ]);
      expect(pts).toHaveLength(2);
      expectNear(pts[0].x, 10);
      expectNear(pts[1].x, 15);
    });
  });

  // ==================== Decompose ====================

  describe("decompose", () => {
    test("decomposes pure translation", () => {
      const m = Matrix3.translation(10, 20);
      const { translation, rotation, scale } = m.decompose();
      expectNear(translation.x, 10);
      expectNear(translation.y, 20);
      expectNear(rotation, 0);
      expectNear(scale.x, 1);
      expectNear(scale.y, 1);
    });

    test("decomposes pure rotation", () => {
      const m = Matrix3.rotation(Math.PI / 3);
      const { rotation } = m.decompose();
      expectNear(rotation, Math.PI / 3);
    });

    test("decomposes pure scale", () => {
      const m = Matrix3.scaling(2, 3);
      const { scale } = m.decompose();
      expectNear(scale.x, 2);
      expectNear(scale.y, 3);
    });
  });

  // ==================== Utility ====================

  describe("utility", () => {
    test("equals returns true for same matrix", () => {
      const m1 = Matrix3.translation(1, 2);
      const m2 = Matrix3.translation(1, 2);
      expect(m1.equals(m2)).toBe(true);
    });

    test("equals returns false for different matrix", () => {
      const m1 = Matrix3.translation(1, 2);
      const m2 = Matrix3.translation(3, 4);
      expect(m1.equals(m2)).toBe(false);
    });

    test("isIdentity returns true for identity", () => {
      expect(new Matrix3().isIdentity()).toBe(true);
    });

    test("isIdentity returns false for non-identity", () => {
      expect(Matrix3.translation(1, 0).isIdentity()).toBe(false);
    });

    test("toArray returns 9-element array", () => {
      const arr = Matrix3.identity().toArray();
      expect(arr).toHaveLength(9);
      expect(arr[0]).toBe(1);
    });

    test("toCssMatrix returns valid CSS", () => {
      const css = Matrix3.identity().toCssMatrix();
      expect(css).toBe("matrix(1, 0, 0, 1, 0, 0)");
    });

    test("toString contains Matrix3", () => {
      expect(Matrix3.identity().toString()).toContain("Matrix3");
    });
  });
});
