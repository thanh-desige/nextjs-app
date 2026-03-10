/**
 * CadEngine Tests — Phase 3
 *
 * Tests for CadEngine: tool switching, viewport management,
 * entity CRUD, selection, drawing workflow, grid/snap,
 * layer management, and undo/redo via engine.
 */

import {
  CadEngine,
  createCadEngine,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/engine/CadEngine";
import {
  ToolMode,
  SelectionMode,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/engine/EngineState";
import { EngineEventType } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/engine/EngineEvents";
import {
  IEntity,
  ILineEntity,
  EntityType,
  DEFAULT_STYLE,
  DEFAULT_STATE,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Entity.types";

// ==================== Setup ====================

// Mock requestAnimationFrame (not available in Node.js)
beforeAll(() => {
  // @ts-expect-error - polyfill for test environment
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(Date.now()), 0) as unknown as number;
  };
  // @ts-expect-error - polyfill
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
});

// ==================== Helpers ====================

function makeLineEntity(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): ILineEntity {
  return {
    id,
    type: EntityType.LINE,
    layerId: "default",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    toJSON() {
      return { ...this };
    },
  } as ILineEntity;
}

// ==================== Constructor & Factory ====================

describe("CadEngine — Construction", () => {
  test("constructor creates engine with default state", () => {
    const engine = new CadEngine();
    const state = engine.getState();

    expect(state.tool).toBe(ToolMode.SELECT);
    expect(state.viewport.zoom).toBe(1);
    expect(state.drawing.isDrawing).toBe(false);
    expect(engine.getAllEntities()).toHaveLength(0);
  });

  test("createCadEngine factory returns new instance", () => {
    const e1 = createCadEngine();
    const e2 = createCadEngine();
    expect(e1).not.toBe(e2);
  });
});

// ==================== Tool Management ====================

describe("CadEngine — Tool", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
  });

  test("getTool returns current tool", () => {
    expect(engine.getTool()).toBe(ToolMode.SELECT);
  });

  test("setTool changes tool mode", () => {
    engine.setTool(ToolMode.DRAW_LINE);
    expect(engine.getTool()).toBe(ToolMode.DRAW_LINE);
  });

  test("setTool emits TOOL_CHANGED event", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.TOOL_CHANGED, listener);

    engine.setTool(ToolMode.DRAW_RECT);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: ToolMode.DRAW_RECT,
        previousTool: ToolMode.SELECT,
      }),
    );
  });

  test("setTool to same tool is no-op", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.TOOL_CHANGED, listener);

    engine.setTool(ToolMode.SELECT); // already SELECT
    expect(listener).not.toHaveBeenCalled();
  });

  test("setTool cancels active drawing", () => {
    engine.startDrawing();
    expect(engine.getState().drawing.isDrawing).toBe(true);

    engine.setTool(ToolMode.DRAW_CIRCLE);
    expect(engine.getState().drawing.isDrawing).toBe(false);
  });
});

// ==================== Viewport ====================

describe("CadEngine — Viewport", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
    engine.setViewportSize(800, 600);
  });

  test("setViewportSize updates dimensions", () => {
    const vp = engine.getViewport();
    expect(vp.width).toBe(800);
    expect(vp.height).toBe(600);
  });

  test("pan changes viewport center", () => {
    const centerBefore = { ...engine.getViewport().center };
    engine.pan(100, 0);
    const centerAfter = engine.getViewport().center;

    // Pan should move center (exact value depends on transform)
    expect(centerAfter.x).not.toBe(centerBefore.x);
  });

  test("panTo moves center to specific point", () => {
    engine.panTo({ x: 500, y: 300 });
    const vp = engine.getViewport();
    expect(vp.center.x).toBe(500);
    expect(vp.center.y).toBe(300);
  });

  test("zoom changes zoom level", () => {
    const zoomBefore = engine.getViewport().zoom;
    engine.zoom(2);
    expect(engine.getViewport().zoom).toBeCloseTo(zoomBefore * 2);
  });

  test("zoom is clamped to valid range", () => {
    engine.zoom(0.00001);
    expect(engine.getViewport().zoom).toBeGreaterThanOrEqual(0.0001);

    engine.zoom(999999);
    expect(engine.getViewport().zoom).toBeLessThanOrEqual(100000);
  });

  test("worldToScreenPoint and screenToWorldPoint are inverses", () => {
    engine.panTo({ x: 0, y: 0 });
    const world = { x: 100, y: 200 };
    const screen = engine.worldToScreenPoint(world);
    const back = engine.screenToWorldPoint(screen);

    expect(back.x).toBeCloseTo(world.x, 5);
    expect(back.y).toBeCloseTo(world.y, 5);
  });
});

// ==================== Entity Management ====================

describe("CadEngine — Entities", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
    engine.setViewportSize(800, 600);
  });

  test("addEntity stores entity", () => {
    const line = makeLineEntity("e1", 0, 0, 100, 100);
    engine.addEntity(line);

    expect(engine.getAllEntities()).toHaveLength(1);
    expect(engine.getEntity("e1")).toBe(line);
  });

  test("addEntities stores multiple entities", () => {
    const entities = [
      makeLineEntity("e1", 0, 0, 100, 0),
      makeLineEntity("e2", 0, 0, 0, 100),
    ];
    engine.addEntities(entities);

    expect(engine.getAllEntities()).toHaveLength(2);
  });

  test("removeEntity removes and returns entity", () => {
    const line = makeLineEntity("e1", 0, 0, 100, 100);
    engine.addEntity(line);

    const removed = engine.removeEntity("e1");
    expect(removed).toBe(line);
    expect(engine.getAllEntities()).toHaveLength(0);
  });

  test("removeEntity returns undefined for missing id", () => {
    expect(engine.removeEntity("nonexistent")).toBeUndefined();
  });

  test("removeEntities removes multiple", () => {
    engine.addEntity(makeLineEntity("e1", 0, 0, 10, 10));
    engine.addEntity(makeLineEntity("e2", 0, 0, 20, 20));
    engine.addEntity(makeLineEntity("e3", 0, 0, 30, 30));

    engine.removeEntities(["e1", "e3"]);
    expect(engine.getAllEntities()).toHaveLength(1);
    expect(engine.getEntity("e2")).toBeDefined();
  });

  test("updateEntity replaces entity in-place", () => {
    const line1 = makeLineEntity("e1", 0, 0, 100, 100);
    engine.addEntity(line1);

    const line2 = makeLineEntity("e1", 50, 50, 200, 200);
    engine.updateEntity("e1", line2);

    expect(engine.getEntity("e1")).toBe(line2);
    expect(engine.getAllEntities()).toHaveLength(1);
  });

  test("updateEntity is no-op for missing id", () => {
    engine.updateEntity("missing", makeLineEntity("missing", 0, 0, 1, 1));
    expect(engine.getAllEntities()).toHaveLength(0);
  });

  test("clearAllEntities removes everything", () => {
    engine.addEntity(makeLineEntity("e1", 0, 0, 10, 10));
    engine.addEntity(makeLineEntity("e2", 0, 0, 20, 20));

    engine.clearAllEntities();
    expect(engine.getAllEntities()).toHaveLength(0);
  });

  test("addEntity emits ENTITY_ADDED event", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.ENTITY_ADDED, listener);

    engine.addEntity(makeLineEntity("e1", 0, 0, 10, 10));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("removeEntity emits ENTITY_REMOVED event", () => {
    engine.addEntity(makeLineEntity("e1", 0, 0, 10, 10));

    const listener = jest.fn();
    engine.on(EngineEventType.ENTITY_REMOVED, listener);

    engine.removeEntity("e1");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("getVisibleEntities filters by visibility", () => {
    const visible = makeLineEntity("e1", 0, 0, 10, 10);
    const hidden = makeLineEntity("e2", 0, 0, 20, 20);
    hidden.state.visible = false;

    engine.addEntity(visible);
    engine.addEntity(hidden);

    expect(engine.getVisibleEntities()).toHaveLength(1);
    expect(engine.getVisibleEntities()[0].id).toBe("e1");
  });
});

// ==================== Selection ====================

describe("CadEngine — Selection", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
    engine.addEntity(makeLineEntity("e1", 0, 0, 100, 0));
    engine.addEntity(makeLineEntity("e2", 0, 0, 0, 100));
    engine.addEntity(makeLineEntity("e3", 50, 50, 150, 150));
  });

  test("select single entity", () => {
    engine.select("e1");
    expect(engine.getSelectedIds()).toEqual(["e1"]);
  });

  test("select replaces previous selection", () => {
    engine.select("e1");
    engine.select("e2");
    expect(engine.getSelectedIds()).toEqual(["e2"]);
  });

  test("select with addToSelection", () => {
    engine.select("e1");
    engine.select("e2", true);
    expect(engine.getSelectedIds()).toContain("e1");
    expect(engine.getSelectedIds()).toContain("e2");
  });

  test("select multiple by array", () => {
    engine.select(["e1", "e3"]);
    expect(engine.getSelectedIds()).toHaveLength(2);
    expect(engine.getSelectedIds()).toContain("e1");
    expect(engine.getSelectedIds()).toContain("e3");
  });

  test("deselect specific entity", () => {
    engine.select(["e1", "e2"]);
    engine.deselect("e1");
    expect(engine.getSelectedIds()).toEqual(["e2"]);
  });

  test("deselect without args clears all", () => {
    engine.select(["e1", "e2"]);
    engine.deselect();
    expect(engine.getSelectedIds()).toHaveLength(0);
  });

  test("clearSelection clears all", () => {
    engine.select(["e1", "e2", "e3"]);
    engine.clearSelection();
    expect(engine.getSelectedIds()).toHaveLength(0);
  });

  test("getSelectedEntities returns entity objects", () => {
    engine.select(["e1", "e2"]);
    const selected = engine.getSelectedEntities();
    expect(selected).toHaveLength(2);
    expect(selected.every((e) => e.id === "e1" || e.id === "e2")).toBe(true);
  });

  test("removeEntity clears from selection", () => {
    engine.select("e1");
    engine.removeEntity("e1");
    expect(engine.getSelectedIds()).toHaveLength(0);
  });

  test("select emits SELECTION_CHANGED event", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.SELECTION_CHANGED, listener);

    engine.select("e1");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedIds: ["e1"],
        added: ["e1"],
      }),
    );
  });
});

// ==================== Drawing Workflow ====================

describe("CadEngine — Drawing", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
    engine.setViewportSize(800, 600);
  });

  test("startDrawing sets isDrawing", () => {
    engine.startDrawing();
    expect(engine.getState().drawing.isDrawing).toBe(true);
  });

  test("addDrawingPoint adds point to drawing state", () => {
    engine.startDrawing();
    engine.addDrawingPoint({ x: 100, y: 200 });

    const points = engine.getDrawingPoints();
    expect(points).toHaveLength(1);
    expect(points[0].x).toBe(100);
    expect(points[0].y).toBe(200);
  });

  test("addDrawingPoint accumulates points", () => {
    engine.startDrawing();
    engine.addDrawingPoint({ x: 0, y: 0 });
    engine.addDrawingPoint({ x: 100, y: 100 });
    engine.addDrawingPoint({ x: 200, y: 0 });

    expect(engine.getDrawingPoints()).toHaveLength(3);
  });

  test("completeDrawing adds preview entity and resets state", () => {
    engine.startDrawing();
    engine.addDrawingPoint({ x: 0, y: 0 });

    const preview = makeLineEntity("preview-1", 0, 0, 100, 100);
    engine.updatePreview(preview);

    const result = engine.completeDrawing();
    expect(result).toBe(preview);
    expect(engine.getState().drawing.isDrawing).toBe(false);
    expect(engine.getState().drawing.points).toHaveLength(0);
    expect(engine.getState().drawing.preview).toBeNull();
    expect(engine.getAllEntities()).toHaveLength(1);
  });

  test("completeDrawing without preview returns null", () => {
    engine.startDrawing();
    const result = engine.completeDrawing();
    expect(result).toBeNull();
    expect(engine.getAllEntities()).toHaveLength(0);
  });

  test("cancelDrawing resets drawing state", () => {
    engine.startDrawing();
    engine.addDrawingPoint({ x: 0, y: 0 });
    engine.updatePreview(makeLineEntity("p", 0, 0, 10, 10));

    engine.cancelDrawing();
    expect(engine.getState().drawing.isDrawing).toBe(false);
    expect(engine.getState().drawing.points).toHaveLength(0);
    expect(engine.getState().drawing.preview).toBeNull();
    expect(engine.getAllEntities()).toHaveLength(0); // preview NOT added
  });

  test("startDrawing emits DRAWING_START", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.DRAWING_START, listener);
    engine.startDrawing();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("completeDrawing emits DRAWING_COMPLETE", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.DRAWING_COMPLETE, listener);

    engine.startDrawing();
    engine.completeDrawing();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("cancelDrawing emits DRAWING_CANCEL", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.DRAWING_CANCEL, listener);

    engine.startDrawing();
    engine.cancelDrawing();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

// ==================== Grid & Snap ====================

describe("CadEngine — Grid & Snap", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
  });

  test("setGrid updates grid state", () => {
    engine.setGrid({ visible: false, majorSpacing: 200 });
    const grid = engine.getGrid();
    expect(grid.visible).toBe(false);
    expect(grid.majorSpacing).toBe(200);
  });

  test("setSnap updates snap state", () => {
    engine.setSnap({ enabled: false });
    expect(engine.getSnap().enabled).toBe(false);
  });

  test("snapPoint snaps to grid", () => {
    // Default grid: majorSpacing = 100, minorDivisions = 5 → step = 20
    engine.setGrid({ snap: true, majorSpacing: 100, minorDivisions: 5 });
    const snapped = engine.snapPoint({ x: 13, y: 47 });
    expect(snapped.x).toBe(20); // nearest 20
    expect(snapped.y).toBe(40); // nearest 20 (47 rounds to 40; 60 would round from 50+)
  });

  test("snapPoint without grid snap returns original", () => {
    engine.setGrid({ snap: false });
    const snapped = engine.snapPoint({ x: 13, y: 47 });
    expect(snapped.x).toBe(13);
    expect(snapped.y).toBe(47);
  });
});

// ==================== Style ====================

describe("CadEngine — Style", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
  });

  test("getCurrentStyle returns default style", () => {
    const style = engine.getCurrentStyle();
    expect(style.strokeColor).toBe("#FFFFFF");
    expect(style.strokeWidth).toBe(1);
    expect(style.strokeStyle).toBe("solid");
    expect(style.fillColor).toBeNull();
    expect(style.opacity).toBe(1);
  });

  test("setCurrentStyle merges partial style", () => {
    engine.setCurrentStyle({ strokeColor: "#FF0000", strokeWidth: 3 });
    const style = engine.getCurrentStyle();
    expect(style.strokeColor).toBe("#FF0000");
    expect(style.strokeWidth).toBe(3);
    expect(style.strokeStyle).toBe("solid"); // unchanged
  });

  test("getCurrentStyle returns a copy", () => {
    const s1 = engine.getCurrentStyle();
    s1.strokeColor = "#000000";
    const s2 = engine.getCurrentStyle();
    expect(s2.strokeColor).toBe("#FFFFFF"); // unaffected
  });
});

// ==================== Layers ====================

describe("CadEngine — Layers", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
  });

  test("default active layer is 'default'", () => {
    expect(engine.getActiveLayerId()).toBe("default");
  });

  test("setActiveLayer changes active layer (if exists)", () => {
    // 'default' exists, 'nonexistent' doesn't
    engine.setActiveLayer("nonexistent");
    expect(engine.getActiveLayerId()).toBe("default"); // unchanged

    engine.setActiveLayer("default");
    expect(engine.getActiveLayerId()).toBe("default");
  });
});

// ==================== Hover ====================

describe("CadEngine — Hover", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
    engine.addEntity(makeLineEntity("e1", 0, 0, 100, 100));
  });

  test("setHover updates hover state", () => {
    engine.setHover("e1");
    expect(engine.getState().selection.hoveredId).toBe("e1");

    const entity = engine.getEntity("e1")!;
    expect(entity.state.hovered).toBe(true);
  });

  test("setHover null clears hover", () => {
    engine.setHover("e1");
    engine.setHover(null);
    expect(engine.getState().selection.hoveredId).toBeNull();
  });

  test("setHover emits HOVER_CHANGED", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.HOVER_CHANGED, listener);

    engine.setHover("e1");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: "e1", previousId: null }),
    );
  });
});

// ==================== Document Access ====================

describe("CadEngine — Document", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
  });

  test("getDocument returns CadDocument", () => {
    const doc = engine.getDocument();
    expect(doc).toBeDefined();
    expect(typeof doc.addEntity).toBe("function");
  });

  test("canUndo is false initially", () => {
    expect(engine.canUndo()).toBe(false);
  });

  test("canRedo is false initially", () => {
    expect(engine.canRedo()).toBe(false);
  });
});

// ==================== Event System ====================

describe("CadEngine — Events", () => {
  let engine: CadEngine;

  beforeEach(() => {
    engine = new CadEngine();
  });

  test("on returns unsubscribe function", () => {
    const listener = jest.fn();
    const unsub = engine.on(EngineEventType.TOOL_CHANGED, listener);

    engine.setTool(ToolMode.DRAW_LINE);
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    engine.setTool(ToolMode.DRAW_RECT);
    expect(listener).toHaveBeenCalledTimes(1); // not called again
  });

  test("off removes listener", () => {
    const listener = jest.fn();
    engine.on(EngineEventType.TOOL_CHANGED, listener);

    engine.off(EngineEventType.TOOL_CHANGED, listener);
    engine.setTool(ToolMode.DRAW_LINE);
    expect(listener).not.toHaveBeenCalled();
  });
});

// ==================== toJSON ====================

describe("CadEngine — Serialization", () => {
  test("toJSON returns serializable object", () => {
    const engine = new CadEngine();
    engine.setViewportSize(800, 600);

    const json = engine.toJSON();
    expect(json).toEqual(
      expect.objectContaining({
        entities: expect.any(Array),
        layers: expect.any(Array),
        activeLayerId: "default",
        viewport: expect.objectContaining({
          zoom: expect.any(Number),
        }),
      }),
    );
  });
});
