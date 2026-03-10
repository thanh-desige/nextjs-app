/**
 * Modify Commands Tests — Phase 3
 *
 * Tests for MOVE, COPY, ROTATE, MIRROR, SCALE, DELETE commands.
 * Each command uses EntityBridge for immutable transforms.
 * We mock CadEngine with getEntity, getSelectedEntities, addEntity,
 * updateEntity, removeEntity, clearSelection, requestRender.
 */

import { MoveCommand, createMoveCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/modify/MOVE";
import { CopyCommand, createCopyCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/modify/copy";
import { RotateCommand, createRotateCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/modify/rotate";
import { MirrorCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/modify/mirror";
import { ScaleCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/modify/SCALE";
import { DeleteCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/modify/DELETE";
import { CommandContext } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/Command.types";
import { LineEntity } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Line";
import { DEFAULT_STYLE, IEntity } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Entity.types";
import { IVec2 } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Vec2";

// ==================== Helpers ====================

const P = (x: number, y: number): IVec2 => ({ x, y });

function expectNear(actual: number, expected: number, eps = 1e-6) {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

/** Create a LineEntity to use in tests */
function makeLine(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): IEntity {
  const line = LineEntity.create(P(x1, y1), P(x2, y2), DEFAULT_STYLE);
  // Override auto-generated id for test determinism
  (line as any).id = id;
  return line;
}

/**
 * Create a mock CadEngine with a local entity store.
 * getEntity, addEntity, updateEntity, removeEntity work against an in-memory Map.
 */
function createMockEngine(initialEntities: IEntity[] = []) {
  const store = new Map<string, IEntity>();
  for (const e of initialEntities) {
    store.set(e.id, e);
  }

  const selectedIds = new Set<string>();

  const engine = {
    addEntity: jest.fn((entity: IEntity) => {
      store.set(entity.id, entity);
    }),
    removeEntity: jest.fn((id: string) => {
      store.delete(id);
    }),
    updateEntity: jest.fn((id: string, entity: IEntity) => {
      store.set(id, entity);
    }),
    getEntity: jest.fn((id: string) => store.get(id)),
    getSelectedEntities: jest.fn(() => {
      return Array.from(store.values()).filter((e) =>
        selectedIds.has(e.id)
      );
    }),
    clearSelection: jest.fn(() => selectedIds.clear()),
    requestRender: jest.fn(),
    // helper — not part of real engine
    _selectIds: (...ids: string[]) => {
      ids.forEach((id) => selectedIds.add(id));
    },
    _store: store,
  };

  return engine;
}

function ctx(
  engine: ReturnType<typeof createMockEngine>,
  options?: Record<string, unknown>
): CommandContext {
  return {
    engine: engine as any,
    points: [],
    options: options ?? {},
    style: { ...DEFAULT_STYLE },
    layerId: "0",
  };
}

// ==================== MoveCommand ====================

describe("MoveCommand", () => {
  test("metadata", () => {
    const cmd = new MoveCommand(P(10, 0));
    expect(cmd.name).toBe("MOVE");
    expect(cmd.canUndo).toBe(true);
  });

  test("execute moves entities by delta using entityIds", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MoveCommand(P(10, 20), ["l1"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);

    // Engine should have been called to update entity
    expect(eng.updateEntity).toHaveBeenCalledTimes(1);
    // The updated entity should have moved
    const updated = eng._store.get("l1") as any;
    expectNear(updated.start.x, 10);
    expectNear(updated.start.y, 20);
    expectNear(updated.end.x, 110);
    expectNear(updated.end.y, 20);
  });

  test("execute uses selected entities when no entityIds", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    eng._selectIds("l1");

    const cmd = new MoveCommand(P(5, 5));
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.getSelectedEntities).toHaveBeenCalled();
  });

  test("execute fails when no entities found", () => {
    const eng = createMockEngine([]);
    const cmd = new MoveCommand(P(10, 10), ["nonexistent"]);
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(false);
  });

  test("undo reverses the move", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MoveCommand(P(50, 50), ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));

    const restored = eng._store.get("l1") as any;
    expectNear(restored.start.x, 0);
    expectNear(restored.start.y, 0);
    expectNear(restored.end.x, 100);
    expectNear(restored.end.y, 0);
  });

  test("redo re-applies the move", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MoveCommand(P(50, 50), ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(true);

    const moved = eng._store.get("l1") as any;
    expectNear(moved.start.x, 50);
    expectNear(moved.start.y, 50);
  });

  test("redo fails when no data", () => {
    const eng = createMockEngine([]);
    const cmd = new MoveCommand(P(10, 10));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(false);
  });

  test("requestRender called on execute, undo, redo", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MoveCommand(P(1, 1), ["l1"]);
    const c = ctx(eng);

    cmd.execute(c);
    expect(eng.requestRender).toHaveBeenCalledTimes(1);

    cmd.undo(c);
    expect(eng.requestRender).toHaveBeenCalledTimes(2);

    cmd.redo!(c);
    expect(eng.requestRender).toHaveBeenCalledTimes(3);
  });
});

describe("createMoveCommand", () => {
  test("creates MoveCommand from base/dest points", () => {
    const cmd = createMoveCommand(P(0, 0), P(30, 40), ["l1"]);
    expect(cmd.name).toBe("MOVE");

    const l1 = makeLine("l1", 0, 0, 10, 0);
    const eng = createMockEngine([l1]);
    cmd.execute(ctx(eng));

    const moved = eng._store.get("l1") as any;
    expectNear(moved.start.x, 30);
    expectNear(moved.start.y, 40);
  });
});

// ==================== CopyCommand ====================

describe("CopyCommand", () => {
  test("metadata", () => {
    const cmd = new CopyCommand(P(10, 0));
    expect(cmd.name).toBe("COPY");
    expect(cmd.canUndo).toBe(true);
  });

  test("execute creates copy of entities at offset", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new CopyCommand(P(50, 50), ["l1"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.addEntity).toHaveBeenCalledTimes(1);

    // Original should still exist
    expect(eng._store.has("l1")).toBe(true);
    // A new entity should exist (with a different id)
    expect(eng._store.size).toBe(2);
  });

  test("execute uses selected entities when no entityIds", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    eng._selectIds("l1");

    const cmd = new CopyCommand(P(10, 10));
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.getSelectedEntities).toHaveBeenCalled();
  });

  test("execute fails when no entities", () => {
    const eng = createMockEngine([]);
    const cmd = new CopyCommand(P(10, 10), ["nonexistent"]);
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(false);
  });

  test("undo removes copied entities", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new CopyCommand(P(50, 50), ["l1"]);

    cmd.execute(ctx(eng));
    expect(eng._store.size).toBe(2);

    cmd.undo(ctx(eng));
    expect(eng.removeEntity).toHaveBeenCalledTimes(1);
    expect(eng._store.size).toBe(1);
    // Only original remains
    expect(eng._store.has("l1")).toBe(true);
  });

  test("redo re-creates the copies", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new CopyCommand(P(50, 50), ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng._store.size).toBe(2);
  });

  test("redo fails when no data", () => {
    const eng = createMockEngine([]);
    const cmd = new CopyCommand(P(10, 10));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(false);
  });
});

describe("createCopyCommand", () => {
  test("creates CopyCommand from base/dest points", () => {
    const cmd = createCopyCommand(P(0, 0), P(20, 30), ["l1"]);
    expect(cmd.name).toBe("COPY");
  });
});

// ==================== RotateCommand ====================

describe("RotateCommand", () => {
  test("metadata", () => {
    const cmd = new RotateCommand(P(0, 0), Math.PI / 2);
    expect(cmd.name).toBe("ROTATE");
    expect(cmd.canUndo).toBe(true);
  });

  test("execute rotates entity 90° around origin", () => {
    // Line from (100,0) to (200,0), rotate 90° around origin
    const l1 = makeLine("l1", 100, 0, 200, 0);
    const eng = createMockEngine([l1]);
    const cmd = new RotateCommand(P(0, 0), Math.PI / 2, ["l1"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.updateEntity).toHaveBeenCalledTimes(1);

    const rotated = eng._store.get("l1") as any;
    // (100,0) rotated 90° → (0,100)
    expectNear(rotated.start.x, 0, 1e-3);
    expectNear(rotated.start.y, 100, 1e-3);
    // (200,0) rotated 90° → (0,200)
    expectNear(rotated.end.x, 0, 1e-3);
    expectNear(rotated.end.y, 200, 1e-3);
  });

  test("execute uses selected entities when no entityIds", () => {
    const l1 = makeLine("l1", 100, 0, 200, 0);
    const eng = createMockEngine([l1]);
    eng._selectIds("l1");

    const cmd = new RotateCommand(P(0, 0), Math.PI / 4);
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.getSelectedEntities).toHaveBeenCalled();
  });

  test("execute fails with no entities", () => {
    const eng = createMockEngine([]);
    const cmd = new RotateCommand(P(0, 0), Math.PI / 2, ["nonexistent"]);
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(false);
  });

  test("undo reverses rotation", () => {
    const l1 = makeLine("l1", 100, 0, 200, 0);
    const eng = createMockEngine([l1]);
    const cmd = new RotateCommand(P(0, 0), Math.PI / 2, ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));

    const restored = eng._store.get("l1") as any;
    expectNear(restored.start.x, 100, 1e-3);
    expectNear(restored.start.y, 0, 1e-3);
  });

  test("redo re-applies rotation", () => {
    const l1 = makeLine("l1", 100, 0, 200, 0);
    const eng = createMockEngine([l1]);
    const cmd = new RotateCommand(P(0, 0), Math.PI / 2, ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(true);

    const rotated = eng._store.get("l1") as any;
    expectNear(rotated.start.x, 0, 1e-3);
    expectNear(rotated.start.y, 100, 1e-3);
  });

  test("redo fails when no data", () => {
    const eng = createMockEngine([]);
    const cmd = new RotateCommand(P(0, 0), 0);
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(false);
  });
});

describe("createRotateCommand", () => {
  test("creates RotateCommand from degrees", () => {
    const cmd = createRotateCommand(P(0, 0), 90, ["l1"]);
    expect(cmd.name).toBe("ROTATE");

    const l1 = makeLine("l1", 100, 0, 200, 0);
    const eng = createMockEngine([l1]);
    cmd.execute(ctx(eng));

    const rotated = eng._store.get("l1") as any;
    expectNear(rotated.start.x, 0, 1e-3);
    expectNear(rotated.start.y, 100, 1e-3);
  });
});

// ==================== MirrorCommand ====================

describe("MirrorCommand", () => {
  test("metadata", () => {
    const cmd = new MirrorCommand(P(0, 0), P(0, 100));
    expect(cmd.name).toBe("MIRROR");
    expect(cmd.canUndo).toBe(true);
  });

  test("execute mirror (keep original) creates copies", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MirrorCommand(P(0, 0), P(0, 100), false, ["l1"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.addEntity).toHaveBeenCalledTimes(1);
    expect(eng._store.size).toBe(2); // original + mirrored copy
  });

  test("execute mirror (delete original) replaces in-place", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MirrorCommand(P(0, 0), P(0, 100), true, ["l1"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.updateEntity).toHaveBeenCalledTimes(1);
    expect(eng._store.size).toBe(1); // same entity, updated

    // Mirrored across Y axis: x → -x
    const mirrored = eng._store.get("l1") as any;
    expectNear(mirrored.start.x, -10, 1e-3);
    expectNear(mirrored.end.x, -20, 1e-3);
  });

  test("execute uses selected entities when no entityIds", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    eng._selectIds("l1");

    const cmd = new MirrorCommand(P(0, 0), P(0, 100));
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.getSelectedEntities).toHaveBeenCalled();
  });

  test("execute fails with no entities", () => {
    const eng = createMockEngine([]);
    const cmd = new MirrorCommand(P(0, 0), P(0, 100), false, ["nonexistent"]);
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(false);
  });

  test("undo (keep original) removes the copies", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MirrorCommand(P(0, 0), P(0, 100), false, ["l1"]);

    cmd.execute(ctx(eng));
    expect(eng._store.size).toBe(2);

    cmd.undo(ctx(eng));
    expect(eng._store.size).toBe(1);
    expect(eng._store.has("l1")).toBe(true);
  });

  test("undo (delete original) mirrors back", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MirrorCommand(P(0, 0), P(0, 100), true, ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));

    const restored = eng._store.get("l1") as any;
    expectNear(restored.start.x, 10, 1e-3);
    expectNear(restored.end.x, 20, 1e-3);
  });

  test("redo (keep original) re-creates copies", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MirrorCommand(P(0, 0), P(0, 100), false, ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng._store.size).toBe(2);
  });

  test("redo (delete original) re-mirrors", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new MirrorCommand(P(0, 0), P(0, 100), true, ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(true);

    const mirrored = eng._store.get("l1") as any;
    expectNear(mirrored.start.x, -10, 1e-3);
  });

  test("redo fails when no data", () => {
    const eng = createMockEngine([]);
    const cmd = new MirrorCommand(P(0, 0), P(0, 100));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(false);
  });
});

// ==================== ScaleCommand ====================

describe("ScaleCommand", () => {
  test("metadata", () => {
    const cmd = new ScaleCommand(P(0, 0), 2);
    expect(cmd.name).toBe("SCALE");
    expect(cmd.canUndo).toBe(true);
  });

  test("execute scales entity by factor 2 around origin", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new ScaleCommand(P(0, 0), 2, undefined, ["l1"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.updateEntity).toHaveBeenCalledTimes(1);

    const scaled = eng._store.get("l1") as any;
    expectNear(scaled.start.x, 20, 1e-3);
    expectNear(scaled.end.x, 40, 1e-3);
  });

  test("execute non-uniform scale (different scaleX/scaleY)", () => {
    const l1 = makeLine("l1", 10, 10, 20, 20);
    const eng = createMockEngine([l1]);
    const cmd = new ScaleCommand(P(0, 0), 2, 3, ["l1"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);

    const scaled = eng._store.get("l1") as any;
    expectNear(scaled.start.x, 20, 1e-3);
    expectNear(scaled.start.y, 30, 1e-3);
  });

  test("execute uses selected entities when no entityIds", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    eng._selectIds("l1");

    const cmd = new ScaleCommand(P(0, 0), 2);
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.getSelectedEntities).toHaveBeenCalled();
  });

  test("execute fails with no entities", () => {
    const eng = createMockEngine([]);
    const cmd = new ScaleCommand(P(0, 0), 2, undefined, ["nonexistent"]);
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(false);
  });

  test("undo reverses scale", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new ScaleCommand(P(0, 0), 2, undefined, ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));

    const restored = eng._store.get("l1") as any;
    expectNear(restored.start.x, 10, 1e-3);
    expectNear(restored.end.x, 20, 1e-3);
  });

  test("redo re-applies scale", () => {
    const l1 = makeLine("l1", 10, 0, 20, 0);
    const eng = createMockEngine([l1]);
    const cmd = new ScaleCommand(P(0, 0), 2, undefined, ["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(true);

    const scaled = eng._store.get("l1") as any;
    expectNear(scaled.start.x, 20, 1e-3);
  });

  test("redo fails when no data", () => {
    const eng = createMockEngine([]);
    const cmd = new ScaleCommand(P(0, 0), 2);
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(false);
  });
});

// ==================== DeleteCommand ====================

describe("DeleteCommand", () => {
  test("metadata", () => {
    const cmd = new DeleteCommand();
    expect(cmd.name).toBe("DELETE");
    expect(cmd.canUndo).toBe(true);
  });

  test("execute removes entities by entityIds", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const l2 = makeLine("l2", 0, 0, 0, 100);
    const eng = createMockEngine([l1, l2]);
    const cmd = new DeleteCommand(["l1"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.removeEntity).toHaveBeenCalledWith("l1");
    expect(eng._store.size).toBe(1);
    expect(eng._store.has("l2")).toBe(true);
  });

  test("execute uses selected entities when no entityIds", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    eng._selectIds("l1");

    const cmd = new DeleteCommand();
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng.getSelectedEntities).toHaveBeenCalled();
    expect(eng._store.size).toBe(0);
  });

  test("execute fails with no entities", () => {
    const eng = createMockEngine([]);
    const cmd = new DeleteCommand(["nonexistent"]);
    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(false);
  });

  test("execute calls clearSelection and requestRender", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new DeleteCommand(["l1"]);

    cmd.execute(ctx(eng));
    expect(eng.clearSelection).toHaveBeenCalled();
    expect(eng.requestRender).toHaveBeenCalled();
  });

  test("undo restores deleted entities", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new DeleteCommand(["l1"]);

    cmd.execute(ctx(eng));
    expect(eng._store.size).toBe(0);

    cmd.undo(ctx(eng));
    expect(eng.addEntity).toHaveBeenCalled();
    expect(eng._store.size).toBe(1);
  });

  test("redo re-deletes entities", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const eng = createMockEngine([l1]);
    const cmd = new DeleteCommand(["l1"]);

    cmd.execute(ctx(eng));
    cmd.undo(ctx(eng));
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(true);
    expect(eng._store.size).toBe(0);
  });

  test("redo fails when no data", () => {
    const eng = createMockEngine([]);
    const cmd = new DeleteCommand();
    const result = cmd.redo!(ctx(eng));
    expect(result.success).toBe(false);
  });

  test("deletes multiple entities", () => {
    const l1 = makeLine("l1", 0, 0, 100, 0);
    const l2 = makeLine("l2", 0, 0, 0, 100);
    const l3 = makeLine("l3", 0, 0, 50, 50);
    const eng = createMockEngine([l1, l2, l3]);
    const cmd = new DeleteCommand(["l1", "l2"]);

    const result = cmd.execute(ctx(eng));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(2);
    expect(eng._store.size).toBe(1);
    expect(eng._store.has("l3")).toBe(true);
  });
});
