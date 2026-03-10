/**
 * Vec2 Smoke Test — STEP-0 verification
 *
 * Purpose: Verify Jest + ts-jest + path alias works correctly.
 * This is the very first test in the ALUBOK project.
 */

import {
  Vec2,
  IVec2,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Vec2";

describe("Vec2 — Smoke Tests", () => {
  // ==================== Construction ====================

  test("constructor creates vector with correct values", () => {
    const v = new Vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  test("default constructor creates zero vector", () => {
    const v = new Vec2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  test("Vec2.zero() creates (0,0)", () => {
    const v = Vec2.zero();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  test("Vec2.from() creates from IVec2", () => {
    const v = Vec2.from({ x: 5, y: 10 });
    expect(v.x).toBe(5);
    expect(v.y).toBe(10);
  });

  // ==================== Arithmetic ====================

  test("add returns new vector with sum", () => {
    const a = new Vec2(1, 2);
    const b: IVec2 = { x: 3, y: 4 };
    const result = a.add(b);

    expect(result.x).toBe(4);
    expect(result.y).toBe(6);

    // Original unchanged (immutable)
    expect(a.x).toBe(1);
    expect(a.y).toBe(2);
  });

  test("sub returns new vector with difference", () => {
    const a = new Vec2(10, 20);
    const b: IVec2 = { x: 3, y: 5 };
    const result = a.sub(b);

    expect(result.x).toBe(7);
    expect(result.y).toBe(15);
  });

  test("mul scales vector", () => {
    const v = new Vec2(3, 4);
    const result = v.mul(2);

    expect(result.x).toBe(6);
    expect(result.y).toBe(8);
  });

  test("div divides vector", () => {
    const v = new Vec2(10, 20);
    const result = v.div(2);

    expect(result.x).toBe(5);
    expect(result.y).toBe(10);
  });

  test("div by zero throws", () => {
    const v = new Vec2(1, 1);
    expect(() => v.div(0)).toThrow("Cannot divide by zero");
  });

  // ==================== Vector Operations ====================

  test("length calculates correctly (3-4-5 triangle)", () => {
    const v = new Vec2(3, 4);
    expect(v.length()).toBe(5);
  });

  test("distanceTo calculates distance between two points", () => {
    const a = new Vec2(0, 0);
    const b: IVec2 = { x: 3, y: 4 };
    expect(a.distanceTo(b)).toBe(5);
  });

  test("dot product calculates correctly", () => {
    const a = new Vec2(1, 0);
    const b: IVec2 = { x: 0, y: 1 };
    // Perpendicular vectors → dot = 0
    expect(a.dot(b)).toBe(0);

    const c = new Vec2(2, 3);
    const d: IVec2 = { x: 4, y: 5 };
    // 2*4 + 3*5 = 23
    expect(c.dot(d)).toBe(23);
  });

  test("cross product calculates correctly", () => {
    const a = new Vec2(1, 0);
    const b: IVec2 = { x: 0, y: 1 };
    // i×j = 1
    expect(a.cross(b)).toBe(1);
  });

  test("normalize returns unit vector", () => {
    const v = new Vec2(3, 4);
    const n = v.normalize();

    expect(n.length()).toBeCloseTo(1, 10);
    expect(n.x).toBeCloseTo(0.6, 10);
    expect(n.y).toBeCloseTo(0.8, 10);
  });

  test("clone creates independent copy", () => {
    const a = new Vec2(1, 2);
    const b = a.clone();

    expect(b.x).toBe(1);
    expect(b.y).toBe(2);

    // Mutate clone → original unchanged
    b.x = 99;
    expect(a.x).toBe(1);
  });

  // ==================== In-place Operations ====================

  test("addSelf mutates in place", () => {
    const v = new Vec2(1, 2);
    v.addSelf({ x: 3, y: 4 });

    expect(v.x).toBe(4);
    expect(v.y).toBe(6);
  });

  // ==================== Static Helpers ====================

  test("fromAngleDeg creates correct vector", () => {
    const v = Vec2.fromAngleDeg(90, 1);
    expect(v.x).toBeCloseTo(0, 10);
    expect(v.y).toBeCloseTo(1, 10);
  });
});
