/**
 * EntityRegistry + lineConfig Golden Tests — STEP-3.1
 *
 * 12 golden tests validating the EntityRegistry pattern with LINE as first type.
 * Tests from ALUBOK_ZERO_RISK_REFACTOR.md STEP-3.1 spec:
 *
 * L01: create({ start, end }) → has id, entityType='LINE'
 * L02: translate(line, 10, 20) → NEW object, start={10,20}, end={110,20}
 * L03: translate does NOT mutate original (immutable check)
 * L04: rotate(line, 90°, {0,0}) → start≈{0,0}, end≈{0,100}
 * L05: scale(line, 2, 2, {0,0}) → start={0,0}, end={200,0}
 * L06: mirror(line, {0,0}, {0,1}) → start={0,0}, end={-100,0}
 * L07: containsPoint(line, {50,0}, 5) → true
 * L08: containsPoint(line, {50,50}, 5) → false
 * L09: getBounds(line) → min={0,0}, max={100,0}
 * L10: getGripPoints(line) → 3 points (start, midpoint, end)
 * L11: clone(line) → new id, same geometry
 * L12: serialize → deserialize → equals original
 */

// Import configs/index.ts to auto-register all built-in types
import "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs";
import { entityRegistry } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/EntityRegistry";
import { lineConfig } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/lineConfig";
import type {
  LineGeometry,
  UnifiedEntity,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/UnifiedEntity";

// ==================== Helpers ====================

/** Create a standard test line: (0,0) → (100,0) */
function createTestLine(): UnifiedEntity<LineGeometry> {
  return lineConfig.create({
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
  });
}

/** Floating-point comparison tolerance */
const FP_TOL = 1e-10;

function expectClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(FP_TOL);
}

// ==================== Tests ====================

describe("EntityRegistry + lineConfig (STEP-3.1)", () => {
  // ==================== L01: Factory ====================

  test("L01: create({ start, end }) → has id, entityType=LINE", () => {
    const line = lineConfig.create({
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    });

    expect(line.id).toBeDefined();
    expect(typeof line.id).toBe("string");
    expect(line.id.length).toBeGreaterThan(0);
    expect(line.entityType).toBe("LINE");
    expect(line.geometry.type).toBe("LINE");
    expect(line.geometry.start).toEqual({ x: 0, y: 0 });
    expect(line.geometry.end).toEqual({ x: 100, y: 0 });
    expect(line.style).toBeDefined();
    expect(line.state).toBeDefined();
    expect(line.layerId).toBe("default");
  });

  // ==================== L02: Translate ====================

  test("L02: translate(line, 10, 20) → NEW object, start={10,20}, end={110,20}", () => {
    const line = createTestLine();

    const translated = entityRegistry.translate(line, 10, 20);

    expect(translated.geometry.start).toEqual({ x: 10, y: 20 });
    expect(translated.geometry.end).toEqual({ x: 110, y: 20 });
    // Must be a different object
    expect(translated).not.toBe(line);
    expect(translated.geometry).not.toBe(line.geometry);
  });

  // ==================== L03: Immutable check ====================

  test("L03: translate does NOT mutate original", () => {
    const line = createTestLine();
    const originalStart = { ...line.geometry.start };
    const originalEnd = { ...line.geometry.end };

    entityRegistry.translate(line, 10, 20);

    // Original must be untouched
    expect(line.geometry.start).toEqual(originalStart);
    expect(line.geometry.end).toEqual(originalEnd);
  });

  // ==================== L04: Rotate ====================

  test("L04: rotate(line, 90°, {0,0}) → start≈{0,0}, end≈{0,100}", () => {
    const line = createTestLine();
    const angle = Math.PI / 2; // 90 degrees

    const rotated = entityRegistry.rotate(line, angle, { x: 0, y: 0 });

    expectClose(rotated.geometry.start.x, 0);
    expectClose(rotated.geometry.start.y, 0);
    expectClose(rotated.geometry.end.x, 0);
    expectClose(rotated.geometry.end.y, 100);
  });

  // ==================== L05: Scale ====================

  test("L05: scale(line, 2, 2, {0,0}) → start={0,0}, end={200,0}", () => {
    const line = createTestLine();

    const scaled = entityRegistry.scale(line, 2, 2, { x: 0, y: 0 });

    expect(scaled.geometry.start).toEqual({ x: 0, y: 0 });
    expect(scaled.geometry.end).toEqual({ x: 200, y: 0 });
  });

  // ==================== L06: Mirror ====================

  test("L06: mirror(line, {0,0}, {0,1}) → start={0,0}, end={-100,0}", () => {
    const line = createTestLine();

    // Mirror across vertical axis (Y-axis through origin)
    const mirrored = entityRegistry.mirror(
      line,
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    );

    expectClose(mirrored.geometry.start.x, 0);
    expectClose(mirrored.geometry.start.y, 0);
    expectClose(mirrored.geometry.end.x, -100);
    expectClose(mirrored.geometry.end.y, 0);
  });

  // ==================== L07-L08: containsPoint ====================

  test("L07: containsPoint(line, {50,0}, 5) → true", () => {
    const line = createTestLine();

    expect(entityRegistry.containsPoint(line, { x: 50, y: 0 }, 5)).toBe(true);
  });

  test("L08: containsPoint(line, {50,50}, 5) → false", () => {
    const line = createTestLine();

    expect(entityRegistry.containsPoint(line, { x: 50, y: 50 }, 5)).toBe(false);
  });

  // ==================== L09: getBounds ====================

  test("L09: getBounds(line) → min={0,0}, max={100,0}", () => {
    const line = createTestLine();

    const bounds = entityRegistry.getBounds(line);

    expect(bounds.min).toEqual({ x: 0, y: 0 });
    expect(bounds.max).toEqual({ x: 100, y: 0 });
  });

  // ==================== L10: getGripPoints ====================

  test("L10: getGripPoints(line) → 3 points (start, midpoint, end)", () => {
    const line = createTestLine();

    const grips = entityRegistry.getGripPoints(line);

    expect(grips).toHaveLength(3);

    // Start endpoint
    expect(grips[0].position).toEqual({ x: 0, y: 0 });
    expect(grips[0].type).toBe("endpoint");
    expect(grips[0].index).toBe(0);

    // Midpoint
    expect(grips[1].position).toEqual({ x: 50, y: 0 });
    expect(grips[1].type).toBe("midpoint");
    expect(grips[1].index).toBe(1);

    // End endpoint
    expect(grips[2].position).toEqual({ x: 100, y: 0 });
    expect(grips[2].type).toBe("endpoint");
    expect(grips[2].index).toBe(2);
  });

  // ==================== L11: Clone ====================

  test("L11: clone(line) → new id, same geometry", () => {
    const line = createTestLine();

    const cloned = entityRegistry.clone(line);

    // New ID
    expect(cloned.id).not.toBe(line.id);
    expect(cloned.id.length).toBeGreaterThan(0);

    // Same geometry values
    expect(cloned.geometry.start).toEqual(line.geometry.start);
    expect(cloned.geometry.end).toEqual(line.geometry.end);

    // Deep copy — not same reference
    expect(cloned.geometry).not.toBe(line.geometry);
    expect(cloned.geometry.start).not.toBe(line.geometry.start);
  });

  // ==================== L12: Serialize → Deserialize ====================

  test("L12: serialize → deserialize → equals original (geometry + style)", () => {
    const line = lineConfig.create(
      { start: { x: 10, y: 20 }, end: { x: 30, y: 40 } },
      { strokeColor: "#FF0000", strokeWidth: 2 },
    );

    const serialized = lineConfig.serialize(line);
    const deserialized = lineConfig.deserialize(serialized);

    // Same geometry
    expect(deserialized.geometry.start).toEqual(line.geometry.start);
    expect(deserialized.geometry.end).toEqual(line.geometry.end);
    expect(deserialized.geometry.type).toBe("LINE");

    // Same ID (serialization preserves ID)
    expect(deserialized.id).toBe(line.id);

    // Same style
    expect(deserialized.style.strokeColor).toBe("#FF0000");
    expect(deserialized.style.strokeWidth).toBe(2);

    // Same entityType
    expect(deserialized.entityType).toBe(line.entityType);
  });

  // ==================== Registry Smoke ====================

  test("Registry has LINE registered", () => {
    expect(entityRegistry.has("LINE")).toBe(true);
    expect(entityRegistry.getRegisteredTypes()).toContain("LINE");
  });

  test("Registry.get('LINE') returns lineConfig", () => {
    const config = entityRegistry.get("LINE");
    expect(config.type).toBe("LINE");
  });

  test("Registry.get unknown type throws", () => {
    expect(() => entityRegistry.get("UNKNOWN")).toThrow(/no config registered/);
  });
});
