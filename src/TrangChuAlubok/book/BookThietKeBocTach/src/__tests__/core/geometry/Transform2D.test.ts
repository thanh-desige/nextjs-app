/**
 * Transform2D Tests — Phase 3 Geometry
 *
 * Tests for Transform2D wrapper: position/rotation/scale management,
 * matrix computation, point transformations, and serialization.
 */

import { Transform2D } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Transform2D";
import { Vec2 } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Vec2";

const EPS = 1e-9;

function expectNear(actual: number, expected: number, eps = EPS) {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

describe("Transform2D", () => {
  // ==================== Construction ====================

  describe("construction", () => {
    test("default constructor creates identity", () => {
      const t = new Transform2D();
      expect(t.isIdentity()).toBe(true);
    });

    test("constructor with position", () => {
      const t = new Transform2D({ x: 10, y: 20 });
      expectNear(t.x, 10);
      expectNear(t.y, 20);
      expectNear(t.rotation, 0);
    });

    test("constructor with position, rotation, scale", () => {
      const t = new Transform2D({ x: 5, y: 5 }, Math.PI / 4, { x: 2, y: 3 });
      expectNear(t.x, 5);
      expectNear(t.y, 5);
      expectNear(t.rotation, Math.PI / 4);
      expectNear(t.scaleX, 2);
      expectNear(t.scaleY, 3);
    });

    test("identity() creates identity transform", () => {
      const t = Transform2D.identity();
      expect(t.isIdentity()).toBe(true);
    });
  });

  // ==================== Getters & Setters ====================

  describe("getters & setters", () => {
    test("position getter returns clone", () => {
      const t = new Transform2D({ x: 10, y: 20 });
      const p = t.position;
      p.x = 999; // Modify clone
      expectNear(t.x, 10); // Original unchanged
    });

    test("position setter updates", () => {
      const t = new Transform2D();
      t.position = { x: 30, y: 40 };
      expectNear(t.x, 30);
      expectNear(t.y, 40);
    });

    test("x/y getters and setters", () => {
      const t = new Transform2D();
      t.x = 5;
      t.y = 10;
      expectNear(t.x, 5);
      expectNear(t.y, 10);
    });

    test("rotation getter/setter", () => {
      const t = new Transform2D();
      t.rotation = Math.PI;
      expectNear(t.rotation, Math.PI);
    });

    test("rotationDeg getter/setter", () => {
      const t = new Transform2D();
      t.rotationDeg = 45;
      expectNear(t.rotationDeg, 45);
      expectNear(t.rotation, Math.PI / 4);
    });

    test("scale getter returns clone", () => {
      const t = new Transform2D({ x: 0, y: 0 }, 0, { x: 2, y: 3 });
      const s = t.scale;
      s.x = 99;
      expectNear(t.scaleX, 2); // Original unchanged
    });

    test("scaleX/scaleY getters and setters", () => {
      const t = new Transform2D();
      t.scaleX = 2;
      t.scaleY = 3;
      expectNear(t.scaleX, 2);
      expectNear(t.scaleY, 3);
    });
  });

  // ==================== Matrix ====================

  describe("matrix", () => {
    test("identity transform produces identity matrix", () => {
      const t = Transform2D.identity();
      expect(t.matrix.isIdentity()).toBe(true);
    });

    test("translation-only transform produces correct matrix", () => {
      const t = new Transform2D({ x: 10, y: 20 });
      const p = t.matrix.transformPoint({ x: 0, y: 0 });
      expectNear(p.x, 10);
      expectNear(p.y, 20);
    });

    test("inverseMatrix undoes transform", () => {
      const t = new Transform2D({ x: 10, y: 20 }, Math.PI / 4, { x: 2, y: 2 });
      const inv = t.inverseMatrix;
      expect(inv).not.toBeNull();
      const p = t.matrix.transformPoint({ x: 5, y: 5 });
      const back = inv!.transformPoint(p);
      expectNear(back.x, 5);
      expectNear(back.y, 5);
    });
  });

  // ==================== Transform Operations ====================

  describe("transform operations", () => {
    test("translate moves position", () => {
      const t = new Transform2D({ x: 10, y: 10 });
      t.translate(5, -3);
      expectNear(t.x, 15);
      expectNear(t.y, 7);
    });

    test("translateBy moves by vector", () => {
      const t = new Transform2D({ x: 10, y: 10 });
      t.translateBy({ x: 5, y: 5 });
      expectNear(t.x, 15);
      expectNear(t.y, 15);
    });

    test("rotate adds rotation", () => {
      const t = new Transform2D();
      t.rotate(Math.PI / 4);
      t.rotate(Math.PI / 4);
      expectNear(t.rotation, Math.PI / 2);
    });

    test("rotateDeg adds degrees", () => {
      const t = new Transform2D();
      t.rotateDeg(30);
      t.rotateDeg(60);
      expectNear(t.rotationDeg, 90);
    });

    test("scaleUniform multiplies scale", () => {
      const t = new Transform2D();
      t.scaleUniform(3);
      expectNear(t.scaleX, 3);
      expectNear(t.scaleY, 3);
    });

    test("scaleBy multiplies non-uniform", () => {
      const t = new Transform2D({ x: 0, y: 0 }, 0, { x: 2, y: 2 });
      t.scaleBy(3, 4);
      expectNear(t.scaleX, 6);
      expectNear(t.scaleY, 8);
    });

    test("chaining returns this", () => {
      const t = new Transform2D();
      const result = t.translate(1, 2).rotate(0.5).scaleUniform(2);
      expect(result).toBe(t);
    });
  });

  // ==================== Point Transformation ====================

  describe("point transformation", () => {
    test("transformPoint applies translation", () => {
      const t = new Transform2D({ x: 10, y: 20 });
      const p = t.transformPoint({ x: 5, y: 5 });
      expectNear(p.x, 15);
      expectNear(p.y, 25);
    });

    test("transformPoint applies rotation", () => {
      const t = new Transform2D({ x: 0, y: 0 }, Math.PI / 2);
      const p = t.transformPoint({ x: 1, y: 0 });
      expectNear(p.x, 0);
      expectNear(p.y, 1);
    });

    test("transformPoint applies scale", () => {
      const t = new Transform2D({ x: 0, y: 0 }, 0, { x: 3, y: 2 });
      const p = t.transformPoint({ x: 5, y: 10 });
      expectNear(p.x, 15);
      expectNear(p.y, 20);
    });

    test("inverseTransformPoint reverses transformPoint", () => {
      const t = new Transform2D({ x: 10, y: 20 }, Math.PI / 6, { x: 2, y: 2 });
      const worldPt = t.transformPoint({ x: 5, y: 5 });
      const localPt = t.inverseTransformPoint(worldPt);
      expect(localPt).not.toBeNull();
      expectNear(localPt!.x, 5);
      expectNear(localPt!.y, 5);
    });

    test("transformVector ignores translation", () => {
      const t = new Transform2D({ x: 100, y: 200 });
      const v = t.transformVector({ x: 1, y: 0 });
      expectNear(v.x, 1);
      expectNear(v.y, 0);
    });

    test("transformPoints maps array", () => {
      const t = new Transform2D({ x: 10, y: 10 });
      const pts = t.transformPoints([{ x: 0, y: 0 }, { x: 5, y: 5 }]);
      expect(pts).toHaveLength(2);
      expectNear(pts[0].x, 10);
      expectNear(pts[1].x, 15);
    });
  });

  // ==================== Combine Transforms ====================

  describe("combine transforms", () => {
    test("combine produces correct result", () => {
      const t1 = new Transform2D({ x: 10, y: 0 });
      const t2 = new Transform2D({ x: 0, y: 20 });
      const combined = t1.combine(t2);
      const p = combined.transformPoint({ x: 0, y: 0 });
      expectNear(p.x, 10);
      expectNear(p.y, 20);
    });
  });

  // ==================== Utility ====================

  describe("utility", () => {
    test("clone creates independent copy", () => {
      const t1 = new Transform2D({ x: 10, y: 20 }, 0.5, { x: 2, y: 3 });
      const t2 = t1.clone();
      t2.x = 99;
      expectNear(t1.x, 10);
    });

    test("reset returns to identity", () => {
      const t = new Transform2D({ x: 10, y: 20 }, 0.5, { x: 2, y: 3 });
      t.reset();
      expect(t.isIdentity()).toBe(true);
    });

    test("copy copies from another transform", () => {
      const t1 = new Transform2D({ x: 10, y: 20 }, 0.5, { x: 2, y: 3 });
      const t2 = Transform2D.identity();
      t2.copy(t1);
      expect(t2.equals(t1)).toBe(true);
    });

    test("equals returns true for same transforms", () => {
      const t1 = new Transform2D({ x: 10, y: 20 }, 0.5, { x: 2, y: 3 });
      const t2 = new Transform2D({ x: 10, y: 20 }, 0.5, { x: 2, y: 3 });
      expect(t1.equals(t2)).toBe(true);
    });

    test("equals returns false for different transforms", () => {
      const t1 = new Transform2D({ x: 10, y: 20 });
      const t2 = new Transform2D({ x: 30, y: 40 });
      expect(t1.equals(t2)).toBe(false);
    });

    test("isIdentity for default transform", () => {
      expect(new Transform2D().isIdentity()).toBe(true);
    });

    test("isIdentity false for non-identity", () => {
      expect(new Transform2D({ x: 1, y: 0 }).isIdentity()).toBe(false);
    });

    test("toJSON serializes correctly", () => {
      const t = new Transform2D({ x: 10, y: 20 }, 0.5, { x: 2, y: 3 });
      const json = t.toJSON() as { position: { x: number; y: number }; rotation: number; scale: { x: number; y: number } };
      expect(json.position.x).toBe(10);
      expect(json.position.y).toBe(20);
      expect(json.rotation).toBe(0.5);
      expect(json.scale.x).toBe(2);
      expect(json.scale.y).toBe(3);
    });

    test("fromJSON deserializes correctly", () => {
      const t1 = new Transform2D({ x: 10, y: 20 }, 0.5, { x: 2, y: 3 });
      const json = t1.toJSON() as { position: { x: number; y: number }; rotation: number; scale: { x: number; y: number } };
      const t2 = Transform2D.fromJSON(json);
      expect(t2.equals(t1)).toBe(true);
    });

    test("toString contains Transform2D", () => {
      expect(new Transform2D().toString()).toContain("Transform2D");
    });
  });
});
