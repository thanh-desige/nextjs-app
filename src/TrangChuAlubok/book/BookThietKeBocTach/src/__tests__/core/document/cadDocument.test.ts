/**
 * CadDocument Tests — Phase 3
 *
 * Tests for CadDocument entity CRUD, canvas entity CRUD,
 * canvas selection, door CRUD, metadata & state, and getInfo.
 *
 * Does NOT test dimension subsystem (DimensionDocumentService) or
 * serialization (toJSON/fromJSON) — those have separate test suites.
 */

import {
  CadDocument,
  CanvasEntity,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";
import { LineEntity } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Line";
import { DEFAULT_STYLE, IEntity } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Entity.types";
import { IVec2 } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Vec2";

// ==================== Helpers ====================

const P = (x: number, y: number): IVec2 => ({ x, y });

function makeLineEntity(id: string): IEntity {
  const line = LineEntity.create(P(0, 0), P(100, 0), DEFAULT_STYLE);
  (line as any).id = id;
  return line;
}

function makeCanvasEntity(id: string, type = "line"): CanvasEntity {
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

// ==================== Constructor & Metadata ====================

describe("CadDocument — Constructor & Metadata", () => {
  test("creates document with default metadata", () => {
    const doc = new CadDocument();
    expect(doc.metadata.title).toBe("Untitled");
    expect(doc.metadata.version).toBe("1.0.0");
    expect(doc.metadata.created).toBeInstanceOf(Date);
    expect(doc.metadata.modified).toBeInstanceOf(Date);
  });

  test("creates document with custom title", () => {
    const doc = new CadDocument({ title: "Test" });
    expect(doc.metadata.title).toBe("Test");
  });

  test("creates document with custom units", () => {
    const doc = new CadDocument({ units: { primary: "cm", precision: 3, scale: 10 } });
    expect(doc.metadata.units.primary).toBe("cm");
    expect(doc.metadata.units.precision).toBe(3);
  });

  test("createNew static factory", () => {
    const doc = CadDocument.createNew("MyDoc");
    expect(doc.metadata.title).toBe("MyDoc");
    expect(doc.getEntityCount()).toBe(0);
  });

  test("viewport defaults", () => {
    const doc = new CadDocument();
    expect(doc.viewport.center).toEqual({ x: 0, y: 0 });
    expect(doc.viewport.zoom).toBe(1);
    expect(doc.viewport.rotation).toBe(0);
  });
});

// ==================== Entity CRUD ====================

describe("CadDocument — Entity CRUD", () => {
  let doc: CadDocument;
  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
  });

  test("addEntity and getEntity", () => {
    const e = makeLineEntity("e1");
    doc.addEntity(e);
    expect(doc.getEntity("e1")).toBe(e);
  });

  test("addEntities bulk", () => {
    doc.addEntities([makeLineEntity("e1"), makeLineEntity("e2")]);
    expect(doc.getEntityCount()).toBe(2);
  });

  test("getEntity returns undefined for non-existent id", () => {
    expect(doc.getEntity("nope")).toBeUndefined();
  });

  test("removeEntity", () => {
    doc.addEntity(makeLineEntity("e1"));
    expect(doc.removeEntity("e1")).toBe(true);
    expect(doc.getEntity("e1")).toBeUndefined();
    expect(doc.getEntityCount()).toBe(0);
  });

  test("removeEntity returns false for non-existent id", () => {
    expect(doc.removeEntity("nope")).toBe(false);
  });

  test("removeEntities bulk", () => {
    doc.addEntities([makeLineEntity("e1"), makeLineEntity("e2"), makeLineEntity("e3")]);
    const count = doc.removeEntities(["e1", "e3", "nope"]);
    expect(count).toBe(2);
    expect(doc.getEntityCount()).toBe(1);
    expect(doc.hasEntity("e2")).toBe(true);
  });

  test("getAllEntities", () => {
    doc.addEntities([makeLineEntity("e1"), makeLineEntity("e2")]);
    const all = doc.getAllEntities();
    expect(all).toHaveLength(2);
  });

  test("hasEntity", () => {
    doc.addEntity(makeLineEntity("e1"));
    expect(doc.hasEntity("e1")).toBe(true);
    expect(doc.hasEntity("e2")).toBe(false);
  });

  test("clearEntities", () => {
    doc.addEntities([makeLineEntity("e1"), makeLineEntity("e2")]);
    doc.clearEntities();
    expect(doc.getEntityCount()).toBe(0);
  });

  test("getEntitiesOnLayer", () => {
    const e1 = makeLineEntity("e1");
    e1.layerId = "layer-A";
    const e2 = makeLineEntity("e2");
    e2.layerId = "layer-B";
    doc.addEntities([e1, e2]);

    const onA = doc.getEntitiesOnLayer("layer-A");
    expect(onA).toHaveLength(1);
    expect(onA[0].id).toBe("e1");
  });
});

// ==================== Canvas Entity CRUD ====================

describe("CadDocument — Canvas Entity CRUD", () => {
  let doc: CadDocument;
  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
  });

  test("addCanvasEntity and getCanvasEntity", () => {
    const ce = makeCanvasEntity("c1");
    doc.addCanvasEntity(ce);
    expect(doc.getCanvasEntity("c1")).toEqual(ce);
  });

  test("addCanvasEntities bulk", () => {
    doc.addCanvasEntities([makeCanvasEntity("c1"), makeCanvasEntity("c2")]);
    expect(doc.getCanvasEntityCount()).toBe(2);
  });

  test("getCanvasEntity undefined for missing", () => {
    expect(doc.getCanvasEntity("nope")).toBeUndefined();
  });

  test("updateCanvasEntity merges updates", () => {
    doc.addCanvasEntity(makeCanvasEntity("c1"));
    const ok = doc.updateCanvasEntity("c1", { color: "#ff0000" });
    expect(ok).toBe(true);
    expect(doc.getCanvasEntity("c1")!.color).toBe("#ff0000");
  });

  test("updateCanvasEntity returns false for missing", () => {
    expect(doc.updateCanvasEntity("nope", { color: "red" })).toBe(false);
  });

  test("deleteCanvasEntity", () => {
    doc.addCanvasEntity(makeCanvasEntity("c1"));
    const deleted = doc.deleteCanvasEntity("c1");
    expect(deleted).toBeDefined();
    expect(deleted!.id).toBe("c1");
    expect(doc.getCanvasEntityCount()).toBe(0);
  });

  test("deleteCanvasEntity returns undefined for missing", () => {
    expect(doc.deleteCanvasEntity("nope")).toBeUndefined();
  });

  test("deleteCanvasEntities bulk", () => {
    doc.addCanvasEntities([makeCanvasEntity("c1"), makeCanvasEntity("c2"), makeCanvasEntity("c3")]);
    const count = doc.deleteCanvasEntities(["c1", "c3", "nope"]);
    expect(count).toBe(2);
    expect(doc.getCanvasEntityCount()).toBe(1);
  });

  test("getAllCanvasEntities", () => {
    doc.addCanvasEntities([makeCanvasEntity("c1"), makeCanvasEntity("c2")]);
    expect(doc.getAllCanvasEntities()).toHaveLength(2);
  });

  test("hasCanvasEntity", () => {
    doc.addCanvasEntity(makeCanvasEntity("c1"));
    expect(doc.hasCanvasEntity("c1")).toBe(true);
    expect(doc.hasCanvasEntity("c2")).toBe(false);
  });

  test("clearCanvasEntities also clears selection", () => {
    doc.addCanvasEntities([makeCanvasEntity("c1"), makeCanvasEntity("c2")]);
    doc.selectCanvasEntities(["c1"]);
    doc.clearCanvasEntities();
    expect(doc.getCanvasEntityCount()).toBe(0);
    expect(doc.getCanvasSelectedIds()).toHaveLength(0);
  });
});

// ==================== Canvas Selection ====================

describe("CadDocument — Canvas Selection", () => {
  let doc: CadDocument;
  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
    doc.addCanvasEntities([
      makeCanvasEntity("c1"),
      makeCanvasEntity("c2"),
      makeCanvasEntity("c3"),
    ]);
  });

  test("selectCanvasEntities replaces selection (non-additive)", () => {
    doc.selectCanvasEntities(["c1", "c2"]);
    expect(doc.getCanvasSelectedIds().sort()).toEqual(["c1", "c2"]);

    doc.selectCanvasEntities(["c3"]);
    expect(doc.getCanvasSelectedIds()).toEqual(["c3"]);
  });

  test("selectCanvasEntities additive mode adds to selection", () => {
    doc.selectCanvasEntities(["c1"]);
    doc.selectCanvasEntities(["c2"], true);
    expect(doc.getCanvasSelectedIds().sort()).toEqual(["c1", "c2"]);
  });

  test("selectCanvasEntities additive mode toggles off", () => {
    doc.selectCanvasEntities(["c1", "c2"]);
    doc.selectCanvasEntities(["c1"], true); // toggle c1 off
    expect(doc.getCanvasSelectedIds()).toEqual(["c2"]);
  });

  test("selectCanvasEntities ignores non-existent ids", () => {
    doc.selectCanvasEntities(["c1", "nonexistent"]);
    expect(doc.getCanvasSelectedIds()).toEqual(["c1"]);
  });

  test("clearCanvasSelection", () => {
    doc.selectCanvasEntities(["c1", "c2"]);
    doc.clearCanvasSelection();
    expect(doc.getCanvasSelectedIds()).toHaveLength(0);
  });

  test("getSelectedCanvasEntities returns selected entities", () => {
    doc.selectCanvasEntities(["c1", "c3"]);
    const selected = doc.getSelectedCanvasEntities();
    expect(selected).toHaveLength(2);
    expect(selected.map((e) => e.id).sort()).toEqual(["c1", "c3"]);
  });

  test("isCanvasEntitySelected", () => {
    doc.selectCanvasEntities(["c1"]);
    expect(doc.isCanvasEntitySelected("c1")).toBe(true);
    expect(doc.isCanvasEntitySelected("c2")).toBe(false);
  });

  test("selection state reflects on canvas entities", () => {
    doc.selectCanvasEntities(["c1"]);
    expect(doc.getCanvasEntity("c1")!.selected).toBe(true);
    expect(doc.getCanvasEntity("c2")!.selected).toBeFalsy();
  });

  test("clearCanvasSelection removes selected flag from entities", () => {
    doc.selectCanvasEntities(["c1"]);
    doc.clearCanvasSelection();
    expect(doc.getCanvasEntity("c1")!.selected).toBe(false);
  });

  test("deleteCanvasEntity removes from selection", () => {
    doc.selectCanvasEntities(["c1", "c2"]);
    doc.deleteCanvasEntity("c1");
    expect(doc.getCanvasSelectedIds()).toEqual(["c2"]);
  });
});

// ==================== Door CRUD ====================

describe("CadDocument — Door CRUD", () => {
  let doc: CadDocument;
  const mockDoor = (id: string) => ({ id, type: "door", templateId: "t1" } as any);

  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
  });

  test("addDoor and getDoor", () => {
    doc.addDoor(mockDoor("d1"));
    expect(doc.getDoor("d1")).toBeDefined();
    expect(doc.getDoor("d1")!.id).toBe("d1");
  });

  test("addDoors bulk", () => {
    doc.addDoors([mockDoor("d1"), mockDoor("d2")]);
    expect(doc.getDoorCount()).toBe(2);
  });

  test("updateDoor merges updates", () => {
    doc.addDoor(mockDoor("d1"));
    const ok = doc.updateDoor("d1", { templateId: "t2" } as any);
    expect(ok).toBe(true);
    expect(doc.getDoor("d1")!.templateId).toBe("t2");
  });

  test("updateDoor returns false for missing", () => {
    expect(doc.updateDoor("nope", {} as any)).toBe(false);
  });

  test("removeDoor", () => {
    doc.addDoor(mockDoor("d1"));
    expect(doc.removeDoor("d1")).toBe(true);
    expect(doc.getDoorCount()).toBe(0);
  });

  test("removeDoor returns false for missing", () => {
    expect(doc.removeDoor("nope")).toBe(false);
  });

  test("removeDoors bulk", () => {
    doc.addDoors([mockDoor("d1"), mockDoor("d2"), mockDoor("d3")]);
    const count = doc.removeDoors(["d1", "d3"]);
    expect(count).toBe(2);
    expect(doc.getDoorCount()).toBe(1);
  });

  test("getAllDoors", () => {
    doc.addDoors([mockDoor("d1"), mockDoor("d2")]);
    expect(doc.getAllDoors()).toHaveLength(2);
  });

  test("hasDoor", () => {
    doc.addDoor(mockDoor("d1"));
    expect(doc.hasDoor("d1")).toBe(true);
    expect(doc.hasDoor("d2")).toBe(false);
  });

  test("clearDoors", () => {
    doc.addDoors([mockDoor("d1"), mockDoor("d2")]);
    doc.clearDoors();
    expect(doc.getDoorCount()).toBe(0);
  });
});

// ==================== Document State ====================

describe("CadDocument — State & Info", () => {
  test("markModified updates metadata.modified on entity changes", () => {
    const doc = new CadDocument({ title: "Test" });
    const before = doc.metadata.modified.getTime();
    doc.addEntity(makeLineEntity("e1"));
    // modified should be >= before (same ms possible)
    expect(doc.metadata.modified.getTime()).toBeGreaterThanOrEqual(before);
  });

  test("getInfo returns complete stats", () => {
    const doc = new CadDocument({ title: "InfoTest" });
    doc.addEntities([makeLineEntity("e1"), makeLineEntity("e2")]);
    doc.addCanvasEntities([makeCanvasEntity("c1")]);
    doc.addDoor({ id: "d1", type: "door" } as any);

    const info = doc.getInfo();
    expect(info.title).toBe("InfoTest");
    expect(info.entityCount).toBe(2);
    expect(info.canvasEntityCount).toBe(1);
    expect(info.doorCount).toBe(1);
    expect(info.layerCount).toBeGreaterThanOrEqual(1); // default layer
    expect(info.created).toBeInstanceOf(Date);
    expect(info.modified).toBeInstanceOf(Date);
  });

  test("managers are initialized", () => {
    const doc = new CadDocument();
    expect(doc.layers).toBeDefined();
    expect(doc.blocks).toBeDefined();
    expect(doc.history).toBeDefined();
    expect(doc.dimensionService).toBeDefined();
  });
});
