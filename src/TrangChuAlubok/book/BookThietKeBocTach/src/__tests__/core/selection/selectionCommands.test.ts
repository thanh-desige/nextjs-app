/**
 * Selection Commands Tests — STEP-1.2
 *
 * Tests for SelectCanvasEntitiesCommand and ClearCanvasSelectionCommand
 * with undo/redo support via History.
 *
 * These commands go through CadDocument directly (no CadEngine needed).
 * We mock a minimal CommandContext with document access.
 */

import {
  CadDocument,
  CanvasEntity,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";
import {
  SelectCanvasEntitiesCommand,
  ClearCanvasSelectionCommand,
  CanvasCommandContext,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/canvas/CanvasEntityCommands";
import { CommandContext } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/Command.types";

// ==================== Helpers ====================

function createEntity(id: string): CanvasEntity {
  return {
    id,
    type: "line",
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

/** Create a minimal CanvasCommandContext with document */
function createContext(doc: CadDocument): CanvasCommandContext {
  return {
    document: doc,
    // Minimal CommandContext fields (not used by selection commands)
    engine: {} as any,
    points: [],
    options: {},
    style: { strokeColor: "#fff", strokeWidth: 1, lineType: "solid" },
    layerId: "0",
  };
}

// ==================== SelectCanvasEntitiesCommand ====================

describe("SelectCanvasEntitiesCommand", () => {
  let doc: CadDocument;
  let ctx: CanvasCommandContext;

  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
    ctx = createContext(doc);
  });

  test("SC01: execute selects entities", () => {
    const [id1, id2] = seedEntities(doc, 3);

    const cmd = new SelectCanvasEntitiesCommand([id1, id2]);
    const result = cmd.execute(ctx);

    expect(result.success).toBe(true);
    expect(doc.getCanvasSelectedIds()).toHaveLength(2);
    expect(doc.getCanvasSelectedIds()).toContain(id1);
    expect(doc.getCanvasSelectedIds()).toContain(id2);
  });

  test("SC02: execute replaces selection (non-additive)", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    new SelectCanvasEntitiesCommand([id1]).execute(ctx);
    new SelectCanvasEntitiesCommand([id2, id3]).execute(ctx);

    expect(doc.getCanvasSelectedIds()).toHaveLength(2);
    expect(doc.getCanvasSelectedIds()).not.toContain(id1);
  });

  test("SC03: execute with additive=true adds to selection", () => {
    const [id1, id2] = seedEntities(doc, 2);

    new SelectCanvasEntitiesCommand([id1]).execute(ctx);
    new SelectCanvasEntitiesCommand([id2], true).execute(ctx);

    expect(doc.getCanvasSelectedIds()).toHaveLength(2);
    expect(doc.getCanvasSelectedIds()).toContain(id1);
    expect(doc.getCanvasSelectedIds()).toContain(id2);
  });

  test("SC04: undo restores previous selection", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    // Initial selection
    doc.selectCanvasEntities([id1]);
    expect(doc.getCanvasSelectedIds()).toEqual([id1]);

    // Execute command that changes selection
    const cmd = new SelectCanvasEntitiesCommand([id2, id3]);
    cmd.execute(ctx);
    expect(doc.getCanvasSelectedIds()).toHaveLength(2);
    expect(doc.getCanvasSelectedIds()).toContain(id2);

    // Undo → back to [id1]
    cmd.undo(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([id1]);
  });

  test('SC05: undo from "something selected" to "nothing selected"', () => {
    const [id1] = seedEntities(doc, 1);

    // Start with no selection
    expect(doc.getCanvasSelectedIds()).toEqual([]);

    const cmd = new SelectCanvasEntitiesCommand([id1]);
    cmd.execute(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([id1]);

    // Undo → back to empty
    cmd.undo(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });

  test("SC06: redo re-applies selection", () => {
    const [id1, id2] = seedEntities(doc, 2);

    const cmd = new SelectCanvasEntitiesCommand([id1, id2]);
    cmd.execute(ctx);
    cmd.undo(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([]);

    // Redo
    const result = cmd.redo!(ctx);
    expect(result.success).toBe(true);
    expect(doc.getCanvasSelectedIds()).toHaveLength(2);
  });

  test("SC07: undo additive selection restores exact previous state", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    // Select id1
    doc.selectCanvasEntities([id1]);

    // Additive select id2
    const cmd = new SelectCanvasEntitiesCommand([id2], true);
    cmd.execute(ctx);
    expect(doc.getCanvasSelectedIds()).toHaveLength(2);

    // Undo → only id1
    cmd.undo(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([id1]);
  });

  test("SC08: canUndo is true", () => {
    const cmd = new SelectCanvasEntitiesCommand([]);
    expect(cmd.canUndo).toBe(true);
  });

  test("SC09: execute fails gracefully without document", () => {
    const cmd = new SelectCanvasEntitiesCommand(["e1"]);
    const badCtx = { ...ctx, document: undefined as any };

    const result = cmd.execute(badCtx);
    expect(result.success).toBe(false);
  });

  test("SC10: multiple undo/redo cycles work correctly", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    const cmd1 = new SelectCanvasEntitiesCommand([id1]);
    cmd1.execute(ctx);

    const cmd2 = new SelectCanvasEntitiesCommand([id2, id3]);
    cmd2.execute(ctx);

    // Undo cmd2 → back to [id1]
    cmd2.undo(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([id1]);

    // Redo cmd2 → [id2, id3]
    cmd2.redo!(ctx);
    const selected = doc.getCanvasSelectedIds();
    expect(selected).toHaveLength(2);
    expect(selected).toContain(id2);
    expect(selected).toContain(id3);

    // Undo cmd2 again → [id1]
    cmd2.undo(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([id1]);

    // Undo cmd1 → []
    cmd1.undo(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });
});

// ==================== ClearCanvasSelectionCommand ====================

describe("ClearCanvasSelectionCommand", () => {
  let doc: CadDocument;
  let ctx: CanvasCommandContext;

  beforeEach(() => {
    doc = new CadDocument({ title: "Test" });
    ctx = createContext(doc);
  });

  test("CC01: execute clears selection", () => {
    const [id1, id2] = seedEntities(doc, 2);

    doc.selectCanvasEntities([id1, id2]);
    expect(doc.getCanvasSelectedIds()).toHaveLength(2);

    const cmd = new ClearCanvasSelectionCommand();
    const result = cmd.execute(ctx);

    expect(result.success).toBe(true);
    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });

  test("CC02: undo restores previous selection", () => {
    const [id1, id2, id3] = seedEntities(doc, 3);

    doc.selectCanvasEntities([id1, id2, id3]);

    const cmd = new ClearCanvasSelectionCommand();
    cmd.execute(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([]);

    // Undo → all 3 back
    cmd.undo(ctx);
    const selected = doc.getCanvasSelectedIds();
    expect(selected).toHaveLength(3);
    expect(selected).toContain(id1);
    expect(selected).toContain(id2);
    expect(selected).toContain(id3);
  });

  test("CC03: undo when nothing was selected = no-op", () => {
    seedEntities(doc, 2);

    const cmd = new ClearCanvasSelectionCommand();
    cmd.execute(ctx);
    cmd.undo(ctx);

    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });

  test("CC04: redo clears again", () => {
    const [id1] = seedEntities(doc, 1);

    doc.selectCanvasEntities([id1]);

    const cmd = new ClearCanvasSelectionCommand();
    cmd.execute(ctx);
    cmd.undo(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([id1]);

    cmd.redo!(ctx);
    expect(doc.getCanvasSelectedIds()).toEqual([]);
  });

  test("CC05: canUndo is true", () => {
    const cmd = new ClearCanvasSelectionCommand();
    expect(cmd.canUndo).toBe(true);
  });

  test("CC06: execute fails gracefully without document", () => {
    const cmd = new ClearCanvasSelectionCommand();
    const badCtx = { ...ctx, document: undefined as any };

    const result = cmd.execute(badCtx);
    expect(result.success).toBe(false);
  });
});
