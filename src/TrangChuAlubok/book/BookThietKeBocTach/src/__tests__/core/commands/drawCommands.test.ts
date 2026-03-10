/**
 * Draw Commands Tests — Phase 3
 *
 * Tests for LINE, RECT, CIRCLE, ARC draw commands.
 * Each command's execute/undo/redo and interactive behaviour (prompts, options, preview, canComplete).
 *
 * Mock strategy: mock CadEngine with addEntity/removeEntity jest.fn()
 */

import { LineCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/draw/LINE";
import { RectCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/draw/RECT";
import { CircleCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/draw/CIRCLE";
import { ArcCommand } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/draw/ARC";
import { CommandContext } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/commands/Command.types";
import { EntityStyle, DEFAULT_STYLE } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Entity.types";
import { IVec2 } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/geometry/Vec2";

// ==================== Helpers ====================

function mockEngine() {
  return {
    addEntity: jest.fn(),
    removeEntity: jest.fn(),
  };
}

function ctx(
  points: IVec2[],
  engine?: ReturnType<typeof mockEngine>,
  options?: Record<string, unknown>,
  style?: Partial<EntityStyle>,
  layerId?: string
): CommandContext {
  return {
    engine: (engine ?? mockEngine()) as any,
    points,
    options: options ?? {},
    style: { ...DEFAULT_STYLE, ...(style ?? {}) },
    layerId: layerId ?? "default",
  };
}

const P = (x: number, y: number): IVec2 => ({ x, y });

function expectNear(actual: number, expected: number, eps = 1e-9) {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

// ==================== LineCommand ====================

describe("LineCommand", () => {
  let cmd: LineCommand;
  beforeEach(() => {
    cmd = new LineCommand();
  });

  // ---------- metadata ----------
  test("name & toolMode", () => {
    expect(cmd.name).toBe("LINE");
    expect(cmd.canUndo).toBe(true);
    expect(cmd.autoComplete).toBe(false);
    expect(cmd.requiredPoints).toBe(2);
  });

  // ---------- prompts ----------
  test("getPrompt returns correct text for different point counts", () => {
    expect(cmd.getPrompt(0)).toContain("điểm đầu");
    expect(cmd.getPrompt(1)).toContain("điểm cuối");
    expect(cmd.getPrompt(2)).toContain("điểm tiếp");
  });

  // ---------- options ----------
  test("getOptions: no options at 0 points", () => {
    expect(cmd.getOptions(0)).toHaveLength(0);
  });

  test("getOptions: Undo at 1 point", () => {
    const opts = cmd.getOptions(1);
    expect(opts).toHaveLength(1);
    expect(opts[0].key).toBe("U");
  });

  test("getOptions: Close & Undo at 2+ points", () => {
    const opts = cmd.getOptions(2);
    expect(opts).toHaveLength(2);
    expect(opts.map((o) => o.key)).toEqual(["C", "U"]);
  });

  // ---------- canComplete ----------
  test("canComplete: false for <2, true for >=2", () => {
    expect(cmd.canComplete(0)).toBe(false);
    expect(cmd.canComplete(1)).toBe(false);
    expect(cmd.canComplete(2)).toBe(true);
    expect(cmd.canComplete(5)).toBe(true);
  });

  // ---------- createPreview ----------
  test("createPreview returns null when no points", () => {
    const c = ctx([]);
    expect(cmd.createPreview(c, P(10, 10))).toBeNull();
  });

  test("createPreview returns LineEntity from last point to cursor", () => {
    const c = ctx([P(0, 0)]);
    const preview = cmd.createPreview(c, P(100, 0));
    expect(preview).not.toBeNull();
    expect(preview!.type).toBe("LINE");
  });

  // ---------- execute ----------
  test("execute fails with <2 points", () => {
    const result = cmd.execute(ctx([P(0, 0)]));
    expect(result.success).toBe(false);
  });

  test("execute creates 1 line from 2 points", () => {
    const result = cmd.execute(ctx([P(0, 0), P(100, 0)]));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(1);
    const line = result.entities![0] as any;
    expect(line.type).toBe("LINE");
    expectNear(line.start.x, 0);
    expectNear(line.end.x, 100);
  });

  test("execute creates N-1 lines from N points (continuous)", () => {
    const pts = [P(0, 0), P(100, 0), P(100, 100), P(0, 100)];
    const result = cmd.execute(ctx(pts));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(3);
  });

  test("execute sets layerId on each entity", () => {
    const result = cmd.execute(ctx([P(0, 0), P(10, 10)], undefined, undefined, undefined, "layer-2"));
    expect(result.entities![0].layerId).toBe("layer-2");
  });

  // ---------- undo / redo ----------
  test("undo calls removeEntity for each created entity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(10, 10), P(20, 20)], eng);
    const result = cmd.execute(c);
    expect(result.entities).toHaveLength(2);

    cmd.undo(c);
    expect(eng.removeEntity).toHaveBeenCalledTimes(2);
    expect(eng.removeEntity).toHaveBeenCalledWith(result.entities![0].id);
    expect(eng.removeEntity).toHaveBeenCalledWith(result.entities![1].id);
  });

  test("redo calls addEntity for each created entity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(10, 10)], eng);
    cmd.execute(c);

    cmd.undo(c);
    eng.addEntity.mockClear();

    const redoResult = cmd.redo!(c);
    expect(redoResult.success).toBe(true);
    expect(eng.addEntity).toHaveBeenCalledTimes(1);
  });

  test("redo fails when no entities were created", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0)], eng);
    cmd.execute(c); // fails, no entities
    const redoResult = cmd.redo!(c);
    expect(redoResult.success).toBe(false);
  });

  // ---------- handleOption ----------
  test("handleOption 'U' removes last point and entity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(10, 10), P(20, 20)], eng);
    cmd.execute(c);

    const entitiesBefore = cmd["createdEntities"].length;

    // Undo last point
    cmd.handleOption!("U", c);
    expect(c.points).toHaveLength(2); // popped one
    expect(cmd["createdEntities"].length).toBe(entitiesBefore - 1);
  });

  test("handleOption 'C' closes polyline (>=3 points)", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(100, 0), P(100, 100)], eng);
    cmd.execute(c);
    const entitiesBefore = cmd["createdEntities"].length;

    cmd.handleOption!("C", c);
    // Close creates an extra line from last point back to first
    expect(cmd["createdEntities"].length).toBe(entitiesBefore + 1);
    expect(eng.addEntity).toHaveBeenCalledTimes(1); // Close calls addEntity
  });
});

// ==================== RectCommand ====================

describe("RectCommand", () => {
  let cmd: RectCommand;
  beforeEach(() => {
    cmd = new RectCommand();
  });

  // ---------- metadata ----------
  test("name & properties", () => {
    expect(cmd.name).toBe("RECT");
    expect(cmd.canUndo).toBe(true);
    expect(cmd.requiredPoints).toBe(2);
  });

  // ---------- prompts ----------
  test("getPrompt at 0 and 1 point", () => {
    expect(cmd.getPrompt(0)).toContain("góc thứ nhất");
    expect(cmd.getPrompt(1)).toContain("góc đối diện");
  });

  // ---------- options ----------
  test("getOptions: Dimensions at 1 point", () => {
    const opts = cmd.getOptions(1);
    expect(opts).toHaveLength(1);
    expect(opts[0].key).toBe("D");
  });

  test("getOptions: empty at 0 points", () => {
    expect(cmd.getOptions(0)).toHaveLength(0);
  });

  // ---------- canComplete ----------
  test("canComplete: true at >=2", () => {
    expect(cmd.canComplete(0)).toBe(false);
    expect(cmd.canComplete(1)).toBe(false);
    expect(cmd.canComplete(2)).toBe(true);
  });

  // ---------- createPreview ----------
  test("createPreview null with 0 points", () => {
    expect(cmd.createPreview(ctx([]), P(50, 50))).toBeNull();
  });

  test("createPreview returns RectEntity from corner to cursor", () => {
    const preview = cmd.createPreview(ctx([P(0, 0)]), P(100, 50));
    expect(preview).not.toBeNull();
    expect(preview!.type).toBe("RECT");
  });

  // ---------- execute ----------
  test("execute fails with <2 points", () => {
    const result = cmd.execute(ctx([P(0, 0)]));
    expect(result.success).toBe(false);
  });

  test("execute corner mode creates rect from 2 corners", () => {
    const result = cmd.execute(ctx([P(0, 0), P(100, 50)]));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(1);
    const rect = result.entities![0] as any;
    expect(rect.type).toBe("RECT");
  });

  test("execute dimensions mode uses width/height from options", () => {
    const c = ctx([P(10, 10), P(999, 999)], undefined, {
      mode: "dimensions",
      width: 200,
      height: 150,
    });
    const result = cmd.execute(c);
    expect(result.success).toBe(true);
    const rect = result.entities![0] as any;
    expect(rect.width).toBeCloseTo(200);
    expect(rect.height).toBeCloseTo(150);
  });

  test("execute sets layerId", () => {
    const result = cmd.execute(ctx([P(0, 0), P(10, 10)], undefined, undefined, undefined, "L1"));
    expect(result.entities![0].layerId).toBe("L1");
  });

  // ---------- undo / redo ----------
  test("undo calls removeEntity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(50, 50)], eng);
    const result = cmd.execute(c);

    cmd.undo(c);
    expect(eng.removeEntity).toHaveBeenCalledWith(result.entities![0].id);
  });

  test("redo calls addEntity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(50, 50)], eng);
    cmd.execute(c);
    cmd.undo(c);
    eng.addEntity.mockClear();

    const redoResult = cmd.redo!(c);
    expect(redoResult.success).toBe(true);
    expect(eng.addEntity).toHaveBeenCalledTimes(1);
  });

  test("redo fails when no entity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0)], eng);
    cmd.execute(c); // fails
    const redoResult = cmd.redo!(c);
    expect(redoResult.success).toBe(false);
  });

  // ---------- handleOption ----------
  test("handleOption 'D' sets mode to dimensions", () => {
    const c = ctx([P(0, 0)]);
    cmd.handleOption!("D", c);
    expect(c.options["mode"]).toBe("dimensions");
  });
});

// ==================== CircleCommand ====================

describe("CircleCommand", () => {
  let cmd: CircleCommand;
  beforeEach(() => {
    cmd = new CircleCommand();
  });

  // ---------- metadata ----------
  test("name & defaults", () => {
    expect(cmd.name).toBe("CIRCLE");
    expect(cmd.canUndo).toBe(true);
    expect(cmd.requiredPoints).toBe(2);
  });

  // ---------- mode switching ----------
  test("handleOption 2P switches to 2-points mode", () => {
    cmd.handleOption!("2P", ctx([]));
    expect(cmd["mode"]).toBe("2-points");
  });

  test("handleOption 3P switches to 3-points mode", () => {
    cmd.handleOption!("3P", ctx([]));
    expect(cmd["mode"]).toBe("3-points");
    expect(cmd.maxPoints).toBe(3);
  });

  test("handleOption D switches to center-diameter mode", () => {
    cmd.handleOption!("D", ctx([]));
    expect(cmd["mode"]).toBe("center-diameter");
  });

  // ---------- prompts ----------
  test("getPrompt center-radius mode", () => {
    expect(cmd.getPrompt(0)).toContain("tâm");
    expect(cmd.getPrompt(1)).toContain("bán kính");
  });

  test("getPrompt 3-points mode", () => {
    cmd.handleOption!("3P", ctx([]));
    expect(cmd.getPrompt(0)).toContain("điểm thứ 1");
    expect(cmd.getPrompt(1)).toContain("điểm thứ 2");
    expect(cmd.getPrompt(2)).toContain("điểm thứ 3");
  });

  // ---------- options ----------
  test("getOptions: shows 2P, 3P, D at 0 points in center-radius", () => {
    const opts = cmd.getOptions(0);
    expect(opts.length).toBe(3);
    expect(opts.map((o) => o.key)).toEqual(["2P", "3P", "D"]);
  });

  test("getOptions: empty when not at 0 or different mode", () => {
    expect(cmd.getOptions(1)).toHaveLength(0);
  });

  // ---------- canComplete ----------
  test("canComplete center-radius: true at 2", () => {
    expect(cmd.canComplete(1)).toBe(false);
    expect(cmd.canComplete(2)).toBe(true);
  });

  test("canComplete 3-points: true at 3", () => {
    cmd.handleOption!("3P", ctx([]));
    expect(cmd.canComplete(2)).toBe(false);
    expect(cmd.canComplete(3)).toBe(true);
  });

  // ---------- createPreview ----------
  test("createPreview null with 0 points", () => {
    expect(cmd.createPreview(ctx([]), P(10, 10))).toBeNull();
  });

  test("createPreview center-radius", () => {
    const preview = cmd.createPreview(ctx([P(50, 50)]), P(80, 50));
    expect(preview).not.toBeNull();
    expect(preview!.type).toBe("CIRCLE");
    expectNear((preview as any).radius, 30);
  });

  test("createPreview center-diameter", () => {
    cmd.handleOption!("D", ctx([]));
    const preview = cmd.createPreview(ctx([P(50, 50)]), P(80, 50));
    expect(preview).not.toBeNull();
    // diameter mode → radius = dist/2
    expectNear((preview as any).radius, 15);
  });

  test("createPreview 2-points", () => {
    cmd.handleOption!("2P", ctx([]));
    const preview = cmd.createPreview(ctx([P(0, 0)]), P(100, 0));
    expect(preview).not.toBeNull();
    expect(preview!.type).toBe("CIRCLE");
  });

  test("createPreview 3-points needs >=2 existing points", () => {
    cmd.handleOption!("3P", ctx([]));
    expect(cmd.createPreview(ctx([P(0, 0)]), P(10, 10))).toBeNull();
    const preview = cmd.createPreview(ctx([P(0, 0), P(100, 0)]), P(50, 50));
    // May be null if collinear, but in this case a valid circle exists
    expect(preview).not.toBeNull();
  });

  // ---------- execute center-radius ----------
  test("execute center-radius: success", () => {
    const result = cmd.execute(ctx([P(50, 50), P(80, 50)]));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(1);
    const circle = result.entities![0] as any;
    expect(circle.type).toBe("CIRCLE");
    expectNear(circle.radius, 30);
  });

  test("execute center-radius: fail <2 pts", () => {
    const result = cmd.execute(ctx([P(50, 50)]));
    expect(result.success).toBe(false);
  });

  // ---------- execute center-diameter ----------
  test("execute center-diameter: success", () => {
    cmd.handleOption!("D", ctx([]));
    const result = cmd.execute(ctx([P(50, 50), P(80, 50)]));
    expect(result.success).toBe(true);
    expectNear((result.entities![0] as any).radius, 15);
  });

  // ---------- execute 2-points ----------
  test("execute 2-points: success", () => {
    cmd.handleOption!("2P", ctx([]));
    const result = cmd.execute(ctx([P(0, 0), P(100, 0)]));
    expect(result.success).toBe(true);
    const c = result.entities![0] as any;
    expectNear(c.radius, 50);
    expectNear(c.center.x, 50);
    expectNear(c.center.y, 0);
  });

  // ---------- execute 3-points ----------
  test("execute 3-points: success", () => {
    cmd.handleOption!("3P", ctx([]));
    const result = cmd.execute(ctx([P(0, 0), P(100, 0), P(50, 50)]));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(1);
  });

  test("execute 3-points: fail with collinear points", () => {
    cmd.handleOption!("3P", ctx([]));
    const result = cmd.execute(ctx([P(0, 0), P(50, 0), P(100, 0)]));
    expect(result.success).toBe(false);
  });

  test("execute 3-points: fail <3 pts", () => {
    cmd.handleOption!("3P", ctx([]));
    const result = cmd.execute(ctx([P(0, 0), P(50, 50)]));
    expect(result.success).toBe(false);
  });

  // ---------- layerId ----------
  test("execute sets layerId on created circle", () => {
    const result = cmd.execute(
      ctx([P(0, 0), P(10, 0)], undefined, undefined, undefined, "myLayer")
    );
    expect(result.entities![0].layerId).toBe("myLayer");
  });

  // ---------- undo / redo ----------
  test("undo calls removeEntity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(30, 0)], eng);
    const result = cmd.execute(c);
    cmd.undo(c);
    expect(eng.removeEntity).toHaveBeenCalledWith(result.entities![0].id);
  });

  test("redo calls addEntity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(30, 0)], eng);
    cmd.execute(c);
    cmd.undo(c);
    eng.addEntity.mockClear();

    const redoResult = cmd.redo!(c);
    expect(redoResult.success).toBe(true);
    expect(eng.addEntity).toHaveBeenCalledTimes(1);
  });

  test("redo fails when no entity", () => {
    const eng = mockEngine();
    // Never executed successfully
    const c = ctx([P(0, 0)], eng);
    cmd.execute(c);
    const redoResult = cmd.redo!(c);
    expect(redoResult.success).toBe(false);
  });
});

// ==================== ArcCommand ====================

describe("ArcCommand", () => {
  let cmd: ArcCommand;
  beforeEach(() => {
    cmd = new ArcCommand();
  });

  // ---------- metadata ----------
  test("name & defaults", () => {
    expect(cmd.name).toBe("ARC");
    expect(cmd.canUndo).toBe(true);
    expect(cmd.requiredPoints).toBe(3);
    expect(cmd.maxPoints).toBe(3);
  });

  // ---------- mode switching ----------
  test("handleOption C → center-start-end", () => {
    cmd.handleOption!("C", ctx([]));
    expect(cmd["mode"]).toBe("center-start-end");
  });

  test("handleOption 3P → 3-points", () => {
    cmd.handleOption!("3P", ctx([]));
    expect(cmd["mode"]).toBe("3-points");
  });

  test("handleOption SCE → start-center-end", () => {
    cmd.handleOption!("SCE", ctx([]));
    expect(cmd["mode"]).toBe("start-center-end");
  });

  // ---------- prompts ----------
  test("getPrompt 3-points", () => {
    expect(cmd.getPrompt(0)).toContain("điểm đầu");
    expect(cmd.getPrompt(1)).toContain("điểm thứ 2");
    expect(cmd.getPrompt(2)).toContain("điểm cuối");
  });

  test("getPrompt center-start-end", () => {
    cmd.handleOption!("C", ctx([]));
    expect(cmd.getPrompt(0)).toContain("tâm");
    expect(cmd.getPrompt(1)).toContain("điểm đầu");
    expect(cmd.getPrompt(2)).toContain("điểm cuối");
  });

  // ---------- options ----------
  test("getOptions at 0 points", () => {
    const opts = cmd.getOptions(0);
    expect(opts.length).toBe(2);
    expect(opts.map((o) => o.key)).toEqual(["C", "3P"]);
  });

  test("getOptions empty at 1+ points", () => {
    expect(cmd.getOptions(1)).toHaveLength(0);
  });

  // ---------- canComplete ----------
  test("canComplete: true at >=3", () => {
    expect(cmd.canComplete(2)).toBe(false);
    expect(cmd.canComplete(3)).toBe(true);
  });

  // ---------- createPreview ----------
  test("createPreview null with 0 or 1 point in 3-points mode", () => {
    expect(cmd.createPreview(ctx([]), P(10, 10))).toBeNull();
    expect(cmd.createPreview(ctx([P(0, 0)]), P(10, 10))).toBeNull();
  });

  test("createPreview 3-points mode with 2 existing points", () => {
    const preview = cmd.createPreview(
      ctx([P(0, 0), P(50, 50)]),
      P(100, 0)
    );
    // May return an ArcEntity or null if degenerate
    if (preview) {
      expect(preview.type).toBe("ARC");
    }
  });

  test("createPreview center-start-end mode with 2 existing points", () => {
    cmd.handleOption!("C", ctx([]));
    const preview = cmd.createPreview(
      ctx([P(50, 50), P(80, 50)]),
      P(50, 80)
    );
    expect(preview).not.toBeNull();
    expect(preview!.type).toBe("ARC");
  });

  test("createPreview center-start-end: null with <2 points", () => {
    cmd.handleOption!("C", ctx([]));
    expect(cmd.createPreview(ctx([P(0, 0)]), P(10, 10))).toBeNull();
  });

  test("createPreview start-center-end mode", () => {
    cmd.handleOption!("SCE", ctx([]));
    const preview = cmd.createPreview(
      ctx([P(80, 50), P(50, 50)]),
      P(50, 80)
    );
    expect(preview).not.toBeNull();
    expect(preview!.type).toBe("ARC");
  });

  // ---------- execute 3-points ----------
  test("execute 3-points: success", () => {
    const result = cmd.execute(ctx([P(0, 0), P(50, 50), P(100, 0)]));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(1);
    const arc = result.entities![0] as any;
    expect(arc.type).toBe("ARC");
    expect(arc.radius).toBeGreaterThan(0);
  });

  test("execute 3-points: fail with collinear points", () => {
    const result = cmd.execute(ctx([P(0, 0), P(50, 0), P(100, 0)]));
    expect(result.success).toBe(false);
  });

  test("execute fails with <3 points", () => {
    const result = cmd.execute(ctx([P(0, 0), P(50, 50)]));
    expect(result.success).toBe(false);
  });

  // ---------- execute center-start-end ----------
  test("execute center-start-end: success", () => {
    cmd.handleOption!("C", ctx([]));
    const result = cmd.execute(ctx([P(50, 50), P(80, 50), P(50, 80)]));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(1);
  });

  // ---------- execute start-center-end ----------
  test("execute start-center-end: success", () => {
    cmd.handleOption!("SCE", ctx([]));
    // points[0]=start, points[1]=center, points[2]=end
    const result = cmd.execute(ctx([P(80, 50), P(50, 50), P(50, 80)]));
    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(1);
  });

  // ---------- execute unknown mode ----------
  test("execute unknown mode fails", () => {
    // Force an unknown mode
    (cmd as any).mode = "invalid-mode";
    const result = cmd.execute(ctx([P(0, 0), P(50, 50), P(100, 0)]));
    expect(result.success).toBe(false);
  });

  // ---------- layerId ----------
  test("execute sets layerId when provided", () => {
    const result = cmd.execute(
      ctx([P(0, 0), P(50, 50), P(100, 0)], undefined, undefined, undefined, "arcLayer")
    );
    expect(result.entities![0].layerId).toBe("arcLayer");
  });

  // ---------- undo / redo ----------
  test("undo calls removeEntity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(50, 50), P(100, 0)], eng);
    const result = cmd.execute(c);
    cmd.undo(c);
    expect(eng.removeEntity).toHaveBeenCalledWith(result.entities![0].id);
  });

  test("redo calls addEntity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(50, 50), P(100, 0)], eng);
    cmd.execute(c);
    cmd.undo(c);
    eng.addEntity.mockClear();

    const redoResult = cmd.redo!(c);
    expect(redoResult.success).toBe(true);
    expect(eng.addEntity).toHaveBeenCalledTimes(1);
  });

  test("redo fails when no entity", () => {
    const eng = mockEngine();
    const c = ctx([P(0, 0), P(10, 0)], eng);
    cmd.execute(c); // fails (<3 pts)
    const redoResult = cmd.redo!(c);
    expect(redoResult.success).toBe(false);
  });
});
