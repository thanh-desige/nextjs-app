/**
 * History Bypass Tests — STEP-2
 *
 * Golden tests ensuring:
 * H01: engineStore.updateEntity() throws Error (dead code trap)
 * H02-H05: DeleteCanvasEntitiesCommand undo/redo works correctly
 * H06-H10: NewDocumentCommand execute/undo/redo works correctly
 *
 * All entity mutations MUST go through Commands → History.
 */

import {
  CadDocument,
  CanvasEntity,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";
import {
  DeleteCanvasEntitiesCommand,
  NewDocumentCommand,
  CanvasCommandContext,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/canvas/CanvasEntityCommands";

// ==================== Helpers ====================

function createEntity(id: string, type = "line"): CanvasEntity {
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

function seedEntities(doc: CadDocument, count: number): string[] {
  const ids: string[] = [];
  for (let i = 1; i <= count; i++) {
    const id = `e${i}`;
    doc.addCanvasEntity(createEntity(id));
    ids.push(id);
  }
  return ids;
}

function createContext(doc: CadDocument): CanvasCommandContext {
  return {
    document: doc,
    engine: {} as any,
    points: [],
    options: {},
    style: { strokeColor: "#fff", strokeWidth: 1, lineType: "solid" as any },
    layerId: "0",
  };
}

// ==================== H01: updateEntity throws ====================

describe("engineStore.updateEntity bypass blocked", () => {
  test("H01: updateEntity throws DEPRECATED error", async () => {
    // Dynamic import to avoid side effects from store initialization
    const { useEngineStore } =
      await import("@/TrangChuAlubok/book/BookThietKeBocTach/src/store/engineStore");

    expect(() => {
      useEngineStore.getState().updateEntity("any-id", { color: "red" });
    }).toThrow(/DEPRECATED/);
  });
});

// ==================== H02-H05: DeleteCanvasEntitiesCommand ====================

describe("DeleteCanvasEntitiesCommand with undo/redo", () => {
  let doc: CadDocument;
  let ctx: CanvasCommandContext;

  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
    ctx = createContext(doc);
  });

  test("H02: execute deletes entities from document", () => {
    const ids = seedEntities(doc, 3);

    const cmd = new DeleteCanvasEntitiesCommand([ids[0], ids[1]]);
    const result = cmd.execute(ctx);

    expect(result.success).toBe(true);
    expect(doc.getCanvasEntityCount()).toBe(1);
    expect(doc.hasCanvasEntity(ids[2])).toBe(true);
    expect(doc.hasCanvasEntity(ids[0])).toBe(false);
    expect(doc.hasCanvasEntity(ids[1])).toBe(false);
  });

  test("H03: undo restores deleted entities", () => {
    const ids = seedEntities(doc, 3);

    const cmd = new DeleteCanvasEntitiesCommand([ids[0], ids[1]]);
    cmd.execute(ctx);

    // Undo → entities come back
    cmd.undo(ctx);

    expect(doc.getCanvasEntityCount()).toBe(3);
    expect(doc.hasCanvasEntity(ids[0])).toBe(true);
    expect(doc.hasCanvasEntity(ids[1])).toBe(true);
    expect(doc.hasCanvasEntity(ids[2])).toBe(true);
  });

  test("H04: redo re-deletes entities after undo", () => {
    const ids = seedEntities(doc, 3);

    const cmd = new DeleteCanvasEntitiesCommand([ids[0], ids[1]]);
    cmd.execute(ctx);
    cmd.undo(ctx);

    // Redo → History calls execute() when redo() not defined
    cmd.execute(ctx);

    expect(doc.getCanvasEntityCount()).toBe(1);
    expect(doc.hasCanvasEntity(ids[2])).toBe(true);
    expect(doc.hasCanvasEntity(ids[0])).toBe(false);
  });

  test("H05: delete single entity by string id", () => {
    const ids = seedEntities(doc, 2);

    const cmd = new DeleteCanvasEntitiesCommand(ids[0]);
    const result = cmd.execute(ctx);

    expect(result.success).toBe(true);
    expect(doc.getCanvasEntityCount()).toBe(1);
    expect(doc.hasCanvasEntity(ids[0])).toBe(false);

    // Undo restores
    cmd.undo(ctx);
    expect(doc.getCanvasEntityCount()).toBe(2);
  });
});

// ==================== H06-H10: NewDocumentCommand ====================

describe("NewDocumentCommand with undo/redo", () => {
  let doc: CadDocument;
  let ctx: CanvasCommandContext;

  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
    ctx = createContext(doc);
  });

  test("H06: execute clears ALL entities", () => {
    seedEntities(doc, 5);
    expect(doc.getCanvasEntityCount()).toBe(5);

    const cmd = new NewDocumentCommand();
    const result = cmd.execute(ctx);

    expect(result.success).toBe(true);
    expect(doc.getCanvasEntityCount()).toBe(0);
  });

  test("H07: execute clears selection", () => {
    const ids = seedEntities(doc, 3);
    doc.selectCanvasEntities([ids[0], ids[1]]);
    expect(doc.getCanvasSelectedIds()).toHaveLength(2);

    const cmd = new NewDocumentCommand();
    cmd.execute(ctx);

    expect(doc.getCanvasSelectedIds()).toHaveLength(0);
  });

  test("H08: undo restores ALL entities after clear", () => {
    const ids = seedEntities(doc, 4);

    const cmd = new NewDocumentCommand();
    cmd.execute(ctx);
    expect(doc.getCanvasEntityCount()).toBe(0);

    // Undo → all entities come back
    cmd.undo(ctx);

    expect(doc.getCanvasEntityCount()).toBe(4);
    for (const id of ids) {
      expect(doc.hasCanvasEntity(id)).toBe(true);
    }
  });

  test("H09: undo restores selection after clear", () => {
    const ids = seedEntities(doc, 3);
    doc.selectCanvasEntities([ids[0], ids[2]]);

    const cmd = new NewDocumentCommand();
    cmd.execute(ctx);

    // Undo → selection restored
    cmd.undo(ctx);

    const selectedIds = doc.getCanvasSelectedIds();
    expect(selectedIds).toHaveLength(2);
    expect(selectedIds).toContain(ids[0]);
    expect(selectedIds).toContain(ids[2]);
  });

  test("H10: redo re-clears after undo", () => {
    seedEntities(doc, 3);

    const cmd = new NewDocumentCommand();
    cmd.execute(ctx);
    cmd.undo(ctx);
    expect(doc.getCanvasEntityCount()).toBe(3);

    // Redo → NewDocumentCommand has explicit redo()
    cmd.redo!(ctx);
    expect(doc.getCanvasEntityCount()).toBe(0);
    expect(doc.getCanvasSelectedIds()).toHaveLength(0);
  });
});
