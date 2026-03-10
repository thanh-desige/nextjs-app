/**
 * Golden Selection Tests — STEP-1.1
 *
 * Purpose: Capture CURRENT selection behavior on CadDocument
 * so we can verify zero regression after Selection Unify refactor.
 *
 * These tests exercise CadDocument directly (no CadEngine, no store).
 * After refactor, ALL selection flows must pass through these same APIs.
 *
 * Test count: 20 golden cases
 */

import {
  CadDocument,
  CanvasEntity,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";

// ==================== Helpers ====================

/** Create a minimal CanvasEntity for testing */
function createEntity(
  id: string,
  type: CanvasEntity["type"] = "line",
): CanvasEntity {
  return {
    id,
    type,
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
    color: "#ffffff",
    lineWidth: 1,
  };
}

/** Add N entities to document, returns their IDs */
function seedEntities(doc: CadDocument, count: number): string[] {
  const ids: string[] = [];
  for (let i = 1; i <= count; i++) {
    const id = `entity-${i}`;
    doc.addCanvasEntity(createEntity(id));
    ids.push(id);
  }
  return ids;
}

// ==================== Tests ====================

describe("CadDocument — Canvas Selection (Golden Tests)", () => {
  let doc: CadDocument;

  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
  });

  // ---------- Basic Selection ----------

  test("G01: selectCanvasEntities — single entity", () => {
    const [id1] = seedEntities(doc, 3);

    doc.selectCanvasEntities([id1]);

    expect(doc.getCanvasSelectedIds()).toEqual([id1]);
  });

  test("G02: selectCanvasEntities — multiple entities", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    doc.selectCanvasEntities([id1, id2]);

    const selected = doc.getCanvasSelectedIds();
    expect(selected).toHaveLength(2);
    expect(selected).toContain(id1);
    expect(selected).toContain(id2);
    expect(selected).not.toContain(id3);
  });

  test("G03: selectCanvasEntities — replaces previous selection (non-additive)", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    doc.selectCanvasEntities([id1, id2]);
    doc.selectCanvasEntities([id3]); // Should replace, not add

    expect(doc.getCanvasSelectedIds()).toEqual([id3]);
  });

  test("G04: selectCanvasEntities — additive=true adds to existing", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    doc.selectCanvasEntities([id1]);
    doc.selectCanvasEntities([id2], true); // additive

    const selected = doc.getCanvasSelectedIds();
    expect(selected).toHaveLength(2);
    expect(selected).toContain(id1);
    expect(selected).toContain(id2);
  });

  test("G05: selectCanvasEntities — additive toggle OFF already-selected", () => {
    const [id1, id2] = seedEntities(doc, 2);

    doc.selectCanvasEntities([id1, id2]);
    doc.selectCanvasEntities([id1], true); // id1 already selected → toggle off

    const selected = doc.getCanvasSelectedIds();
    expect(selected).toEqual([id2]);
  });

  test("G06: selectCanvasEntities — ignores non-existent entity IDs", () => {
    seedEntities(doc, 2);

    doc.selectCanvasEntities(["non-existent-id"]);

    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });

  // ---------- Clear Selection ----------

  test("G07: clearCanvasSelection — clears all", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    doc.selectCanvasEntities([id1, id2, id3]);
    expect(doc.getCanvasSelectedIds()).toHaveLength(3);

    doc.clearCanvasSelection();
    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });

  test("G08: clearCanvasSelection — safe to call when nothing selected", () => {
    seedEntities(doc, 2);

    doc.clearCanvasSelection(); // Should not throw

    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });

  // ---------- Entity Selected State Sync ----------

  test("G09: entity.selected property syncs with selection", () => {
    const [id1, id2] = seedEntities(doc, 2);

    doc.selectCanvasEntities([id1]);

    const e1 = doc.getCanvasEntity(id1);
    const e2 = doc.getCanvasEntity(id2);

    expect(e1?.selected).toBe(true);
    expect(e2?.selected).toBe(false);
  });

  test("G10: clearCanvasSelection resets entity.selected to false", () => {
    const [id1] = seedEntities(doc, 1);

    doc.selectCanvasEntities([id1]);
    expect(doc.getCanvasEntity(id1)?.selected).toBe(true);

    doc.clearCanvasSelection();
    expect(doc.getCanvasEntity(id1)?.selected).toBe(false);
  });

  // ---------- Delete removes from selection ----------

  test("G11: deleteCanvasEntity removes entity from selection", () => {
    const [id1, id2] = seedEntities(doc, 2);

    doc.selectCanvasEntities([id1, id2]);
    doc.deleteCanvasEntity(id1);

    expect(doc.getCanvasSelectedIds()).toEqual([id2]);
    expect(doc.hasCanvasEntity(id1)).toBe(false);
  });

  test("G12: deleteCanvasEntities removes multiple from selection", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    doc.selectCanvasEntities([id1, id2, id3]);
    doc.deleteCanvasEntities([id1, id3]);

    expect(doc.getCanvasSelectedIds()).toEqual([id2]);
    expect(doc.getCanvasEntityCount()).toBe(1);
  });

  // ---------- Query Methods ----------

  test("G13: getSelectedCanvasEntities returns entity objects", () => {
    const [id1, id2] = seedEntities(doc, 3);

    doc.selectCanvasEntities([id1, id2]);

    const selected = doc.getSelectedCanvasEntities();
    expect(selected).toHaveLength(2);
    expect(selected.map((e) => e.id).sort()).toEqual([id1, id2].sort());
  });

  test("G14: isCanvasEntitySelected returns correct boolean", () => {
    const [id1, id2] = seedEntities(doc, 2);

    doc.selectCanvasEntities([id1]);

    expect(doc.isCanvasEntitySelected(id1)).toBe(true);
    expect(doc.isCanvasEntitySelected(id2)).toBe(false);
  });

  // ---------- clearCanvasEntities clears selection too ----------

  test("G15: clearCanvasEntities also clears selection", () => {
    const [id1, id2] = seedEntities(doc, 2);

    doc.selectCanvasEntities([id1, id2]);
    doc.clearCanvasEntities();

    expect(doc.getCanvasSelectedIds()).toEqual([]);
    expect(doc.getCanvasEntityCount()).toBe(0);
  });

  // ---------- Select All ----------

  test("G16: select all entities", () => {
    const ids = seedEntities(doc, 5);

    doc.selectCanvasEntities(ids);

    expect(doc.getCanvasSelectedIds()).toHaveLength(5);
    for (const id of ids) {
      expect(doc.isCanvasEntitySelected(id)).toBe(true);
    }
  });

  // ---------- Additive batch ----------

  test("G17: additive select multiple entities at once", () => {
    const [id1, id2, id3, id4] = seedEntities(doc, 4);

    doc.selectCanvasEntities([id1]);
    doc.selectCanvasEntities([id2, id3], true); // additive batch

    const selected = doc.getCanvasSelectedIds();
    expect(selected).toHaveLength(3);
    expect(selected).toContain(id1);
    expect(selected).toContain(id2);
    expect(selected).toContain(id3);
    expect(selected).not.toContain(id4);
  });

  // ---------- Edge Cases ----------

  test("G18: select empty array clears selection (non-additive)", () => {
    const [id1] = seedEntities(doc, 1);

    doc.selectCanvasEntities([id1]);
    doc.selectCanvasEntities([]); // empty, non-additive

    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });

  test("G19: additive with empty array preserves existing selection", () => {
    const [id1] = seedEntities(doc, 1);

    doc.selectCanvasEntities([id1]);
    doc.selectCanvasEntities([], true); // empty, additive

    expect(doc.getCanvasSelectedIds()).toEqual([id1]);
  });

  test("G20: select same entity twice in one call — no duplicate", () => {
    const [id1] = seedEntities(doc, 1);

    doc.selectCanvasEntities([id1, id1]); // duplicate in array

    expect(doc.getCanvasSelectedIds()).toEqual([id1]);
  });
});
