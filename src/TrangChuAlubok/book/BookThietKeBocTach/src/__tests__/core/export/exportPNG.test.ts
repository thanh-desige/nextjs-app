/**
 * ExportPNGCore Tests — Phase 5.4
 *
 * Tests for IEntity-based PNG export:
 *   - preparePNGExport (pure bounds/scale/dimension computation)
 *   - renderIEntityToCtx (Canvas2D rendering via mock context)
 *   - renderDocumentToCtx (full document rendering pipeline)
 *   - All 8 entity types: LINE, RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION
 *   - Options handling, filtering, stroke styles
 *   - ExportManager.exportDocumentToPNG facade (non-DOM path)
 *   - ExportManager.preparePNGExport facade
 */

import { CadDocument } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";
import {
  preparePNGExport,
  renderIEntityToCtx,
  renderDocumentToCtx,
  exportDocumentToPNG,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportPNGCore";
import type { ICanvasContext, PNGPrepareResult } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportPNGCore";
import { ExportManager } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportManager";
import {
  IEntity,
  ILineEntity,
  IRectEntity,
  ICircleEntity,
  IArcEntity,
  IEllipseEntity,
  IPolylineEntity,
  ITextEntity,
  IDimensionEntity,
  EntityType,
  DEFAULT_STYLE,
  DEFAULT_STATE,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Entity.types";

// Ensure entity configs are registered
import "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/index";

// ==================== Mock Canvas Context ====================

interface MockCall {
  method: string;
  args: unknown[];
}

function createMockCtx(): ICanvasContext & { calls: MockCall[] } {
  const calls: MockCall[] = [];

  function track(method: string) {
    return (...args: unknown[]) => {
      calls.push({ method, args });
    };
  }

  return {
    calls,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt" as CanvasLineCap,
    lineJoin: "miter" as CanvasLineJoin,
    globalAlpha: 1,
    font: "",
    textAlign: "start" as CanvasTextAlign,
    textBaseline: "alphabetic" as CanvasTextBaseline,
    save: track("save"),
    restore: track("restore"),
    beginPath: track("beginPath"),
    closePath: track("closePath"),
    moveTo: track("moveTo"),
    lineTo: track("lineTo"),
    arc: track("arc"),
    ellipse: track("ellipse"),
    rect: track("rect"),
    fillRect: track("fillRect"),
    stroke: track("stroke"),
    fill: track("fill"),
    fillText: track("fillText"),
    translate: track("translate"),
    scale: track("scale"),
    rotate: track("rotate"),
    setLineDash: track("setLineDash"),
  };
}

// ==================== Entity Helpers ====================

function makeLine(id: string, x1 = 0, y1 = 0, x2 = 100, y2 = 0): ILineEntity {
  return {
    id,
    type: EntityType.LINE,
    layerId: "0",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
  };
}

function makeRect(id: string, x = 0, y = 0, w = 200, h = 100): IRectEntity {
  return {
    id,
    type: EntityType.RECT,
    layerId: "0",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    origin: { x, y },
    width: w,
    height: h,
    rotation: 0,
  };
}

function makeCircle(id: string, cx = 50, cy = 50, r = 25): ICircleEntity {
  return {
    id,
    type: EntityType.CIRCLE,
    layerId: "0",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    center: { x: cx, y: cy },
    radius: r,
  };
}

function makeArc(
  id: string,
  cx = 0, cy = 0, r = 50,
  startAngle = 0, endAngle = Math.PI / 2,
): IArcEntity {
  return {
    id,
    type: EntityType.ARC,
    layerId: "0",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    center: { x: cx, y: cy },
    radius: r,
    startAngle,
    endAngle,
  };
}

function makeEllipse(
  id: string,
  cx = 0, cy = 0,
  rx = 100, ry = 50,
  rotation = 0,
): IEllipseEntity {
  return {
    id,
    type: EntityType.ELLIPSE,
    layerId: "0",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    center: { x: cx, y: cy },
    radiusX: rx,
    radiusY: ry,
    rotation,
  };
}

function makePolyline(
  id: string,
  points = [{ x: 0, y: 0 }, { x: 10, y: 20 }, { x: 30, y: 10 }],
  closed = false,
): IPolylineEntity {
  return {
    id,
    type: EntityType.POLYLINE,
    layerId: "0",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    points,
    closed,
  };
}

function makeText(
  id: string,
  text = "Hello",
  x = 10, y = 20,
): ITextEntity {
  return {
    id,
    type: EntityType.TEXT,
    layerId: "0",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    position: { x, y },
    text,
    fontSize: 12,
    fontFamily: "Arial",
    textAlign: "left",
    rotation: 0,
  };
}

function makeDimension(
  id: string,
  sx = 0, sy = 0, ex = 100, ey = 0,
): IDimensionEntity {
  return {
    id,
    type: EntityType.DIMENSION,
    layerId: "0",
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    startPoint: { x: sx, y: sy },
    endPoint: { x: ex, y: ey },
    textPosition: { x: (sx + ex) / 2, y: (sy + ey) / 2 + 10 },
    offset: 30,
  };
}

function makeDocWithEntities(entities: IEntity[]): CadDocument {
  const doc = new CadDocument({ title: "PNG Test" });
  for (const e of entities) {
    doc.addEntity(e);
  }
  return doc;
}

// ==================== preparePNGExport ====================

describe("ExportPNGCore — preparePNGExport", () => {
  test("returns correct default canvas width", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const prep = preparePNGExport(doc);

    expect(prep.canvasWidth).toBe(1024);
  });

  test("auto-calculates height from aspect ratio", () => {
    const doc = makeDocWithEntities([makeLine("l1", 0, 0, 100, 100)]);
    const prep = preparePNGExport(doc);

    // Square content → height should approximate width
    expect(prep.canvasHeight).toBeGreaterThan(0);
    expect(prep.canvasHeight).toBeLessThanOrEqual(prep.canvasWidth + 100);
  });

  test("respects explicit width and height", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const prep = preparePNGExport(doc, { width: 800, height: 600 });

    expect(prep.canvasWidth).toBe(800);
    expect(prep.canvasHeight).toBe(600);
  });

  test("filters hidden entities by default", () => {
    const visible = makeLine("vis");
    const hidden = makeLine("hid");
    hidden.state.visible = false;
    const doc = makeDocWithEntities([visible, hidden]);
    const prep = preparePNGExport(doc);

    expect(prep.entities).toHaveLength(1);
    expect(prep.entities[0].id).toBe("vis");
  });

  test("includeHidden=true keeps hidden entities", () => {
    const visible = makeLine("vis");
    const hidden = makeLine("hid");
    hidden.state.visible = false;
    const doc = makeDocWithEntities([visible, hidden]);
    const prep = preparePNGExport(doc, { includeHidden: true });

    expect(prep.entities).toHaveLength(2);
  });

  test("includeText=false filters text entities", () => {
    const doc = makeDocWithEntities([makeLine("l1"), makeText("t1")]);
    const prep = preparePNGExport(doc, { includeText: false });

    expect(prep.entities).toHaveLength(1);
    expect(prep.entities[0].type).toBe(EntityType.LINE);
  });

  test("includeDimensions=false filters dimension entities", () => {
    const doc = makeDocWithEntities([makeLine("l1"), makeDimension("d1")]);
    const prep = preparePNGExport(doc, { includeDimensions: false });

    expect(prep.entities).toHaveLength(1);
    expect(prep.entities[0].type).toBe(EntityType.LINE);
  });

  test("pixelScale is positive", () => {
    const doc = makeDocWithEntities([makeLine("l1", 0, 0, 100, 100)]);
    const prep = preparePNGExport(doc);

    expect(prep.pixelScale).toBeGreaterThan(0);
  });

  test("empty document produces valid prep result", () => {
    const doc = new CadDocument({ title: "Empty" });
    const prep = preparePNGExport(doc);

    expect(prep.canvasWidth).toBe(1024);
    expect(prep.canvasHeight).toBeGreaterThan(0);
    expect(prep.entities).toHaveLength(0);
    expect(prep.pixelScale).toBeGreaterThan(0);
  });

  test("resolved options contain defaults", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const prep = preparePNGExport(doc);

    expect(prep.options.backgroundColor).toBe("#1a1a2e");
    expect(prep.options.padding).toBe(20);
    expect(prep.options.quality).toBe(1.0);
    expect(prep.options.method).toBe("canvas");
  });

  test("custom options are preserved", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const prep = preparePNGExport(doc, {
      backgroundColor: "#FF0000",
      padding: 50,
      title: "custom",
    });

    expect(prep.options.backgroundColor).toBe("#FF0000");
    expect(prep.options.padding).toBe(50);
    expect(prep.options.title).toBe("custom");
  });
});

// ==================== renderIEntityToCtx — LINE ====================

describe("ExportPNGCore — render LINE", () => {
  test("renders line with moveTo and lineTo", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeLine("l1", 10, 20, 30, 40));

    const methodNames = ctx.calls.map((c) => c.method);
    expect(methodNames).toContain("moveTo");
    expect(methodNames).toContain("lineTo");
    expect(methodNames).toContain("stroke");

    const moveTo = ctx.calls.find((c) => c.method === "moveTo");
    expect(moveTo?.args).toEqual([10, 20]);
    const lineTo = ctx.calls.find((c) => c.method === "lineTo");
    expect(lineTo?.args).toEqual([30, 40]);
  });

  test("sets stroke color from entity style", () => {
    const ctx = createMockCtx();
    const line = makeLine("l1");
    line.style.strokeColor = "#FF0000";
    renderIEntityToCtx(ctx, line);

    expect(ctx.strokeStyle).toBe("#FF0000");
  });

  test("applies dashed line style", () => {
    const ctx = createMockCtx();
    const line = makeLine("l1");
    line.style.strokeStyle = "dashed";
    renderIEntityToCtx(ctx, line);

    const dashCall = ctx.calls.find((c) => c.method === "setLineDash");
    expect(dashCall).toBeDefined();
    const segments = dashCall?.args[0] as number[];
    expect(segments.length).toBeGreaterThan(0);
  });

  test("solid line sets empty dash array", () => {
    const ctx = createMockCtx();
    const line = makeLine("l1");
    line.style.strokeStyle = "solid";
    renderIEntityToCtx(ctx, line);

    const dashCall = ctx.calls.find((c) => c.method === "setLineDash");
    expect(dashCall).toBeDefined();
    const segments = dashCall?.args[0] as number[];
    expect(segments).toEqual([]);
  });
});

// ==================== renderIEntityToCtx — RECT ====================

describe("ExportPNGCore — render RECT", () => {
  test("renders rect with ctx.rect and stroke", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeRect("r1", 10, 20, 200, 100));

    const rectCall = ctx.calls.find((c) => c.method === "rect");
    expect(rectCall).toBeDefined();
    expect(rectCall?.args).toEqual([10, 20, 200, 100]);
    expect(ctx.calls.map((c) => c.method)).toContain("stroke");
  });

  test("renders filled rect when fillColor set", () => {
    const ctx = createMockCtx();
    const rect = makeRect("r1");
    rect.style.fillColor = "#00FF00";
    renderIEntityToCtx(ctx, rect);

    expect(ctx.calls.map((c) => c.method)).toContain("fill");
  });

  test("no fill when fillColor is null", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeRect("r1"));

    expect(ctx.calls.map((c) => c.method)).not.toContain("fill");
  });

  test("rotated rect uses translate + rotate + translate", () => {
    const ctx = createMockCtx();
    const rect = makeRect("r1", 0, 0, 200, 100);
    rect.rotation = Math.PI / 4;
    renderIEntityToCtx(ctx, rect);

    const translateCalls = ctx.calls.filter((c) => c.method === "translate");
    const rotateCalls = ctx.calls.filter((c) => c.method === "rotate");
    // Inner save/restore has translate→rotate→translate
    expect(translateCalls.length).toBeGreaterThanOrEqual(2);
    expect(rotateCalls.length).toBeGreaterThanOrEqual(1);
  });
});

// ==================== renderIEntityToCtx — CIRCLE ====================

describe("ExportPNGCore — render CIRCLE", () => {
  test("renders circle with ctx.arc", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeCircle("c1", 50, 60, 25));

    const arcCall = ctx.calls.find((c) => c.method === "arc");
    expect(arcCall).toBeDefined();
    expect(arcCall?.args[0]).toBe(50);  // cx
    expect(arcCall?.args[1]).toBe(60);  // cy
    expect(arcCall?.args[2]).toBe(25);  // r
  });

  test("filled circle calls fill", () => {
    const ctx = createMockCtx();
    const circle = makeCircle("c1");
    circle.style.fillColor = "#0000FF";
    renderIEntityToCtx(ctx, circle);

    expect(ctx.calls.map((c) => c.method)).toContain("fill");
  });
});

// ==================== renderIEntityToCtx — ARC ====================

describe("ExportPNGCore — render ARC", () => {
  test("renders arc with ctx.arc using start/end angles", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeArc("a1", 10, 20, 50, 0, Math.PI / 2));

    const arcCall = ctx.calls.find((c) => c.method === "arc");
    expect(arcCall).toBeDefined();
    expect(arcCall?.args[0]).toBe(10);       // cx
    expect(arcCall?.args[1]).toBe(20);       // cy
    expect(arcCall?.args[2]).toBe(50);       // r
    expect(arcCall?.args[3]).toBe(0);        // startAngle
    expect(arcCall?.args[4]).toBeCloseTo(Math.PI / 2); // endAngle
    expect(ctx.calls.map((c) => c.method)).toContain("stroke");
  });
});

// ==================== renderIEntityToCtx — ELLIPSE ====================

describe("ExportPNGCore — render ELLIPSE", () => {
  test("renders ellipse with ctx.ellipse", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeEllipse("e1", 10, 20, 100, 50, 0));

    const ellipseCall = ctx.calls.find((c) => c.method === "ellipse");
    expect(ellipseCall).toBeDefined();
    expect(ellipseCall?.args[0]).toBe(10);   // cx
    expect(ellipseCall?.args[1]).toBe(20);   // cy
    expect(ellipseCall?.args[2]).toBe(100);  // rx
    expect(ellipseCall?.args[3]).toBe(50);   // ry
  });

  test("rotated ellipse passes rotation to ctx.ellipse", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeEllipse("e1", 0, 0, 100, 50, Math.PI / 6));

    const ellipseCall = ctx.calls.find((c) => c.method === "ellipse");
    expect(ellipseCall?.args[4]).toBeCloseTo(Math.PI / 6);
  });
});

// ==================== renderIEntityToCtx — POLYLINE ====================

describe("ExportPNGCore — render POLYLINE", () => {
  test("open polyline renders moveTo + lineTo sequence", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makePolyline("p1", [
      { x: 0, y: 0 }, { x: 10, y: 20 }, { x: 30, y: 10 },
    ], false));

    const moveToCalls = ctx.calls.filter((c) => c.method === "moveTo");
    const lineToCalls = ctx.calls.filter((c) => c.method === "lineTo");
    expect(moveToCalls).toHaveLength(1);
    expect(lineToCalls).toHaveLength(2);
    expect(ctx.calls.map((c) => c.method)).toContain("stroke");
    // Should NOT closePath for open polyline
    expect(ctx.calls.map((c) => c.method)).not.toContain("closePath");
  });

  test("closed polyline calls closePath", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makePolyline("p1", [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 },
    ], true));

    expect(ctx.calls.map((c) => c.method)).toContain("closePath");
  });

  test("closed polyline with fill calls fill", () => {
    const ctx = createMockCtx();
    const poly = makePolyline("p1", [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 },
    ], true);
    poly.style.fillColor = "#FF0000";
    renderIEntityToCtx(ctx, poly);

    expect(ctx.calls.map((c) => c.method)).toContain("fill");
  });

  test("polyline with < 2 points produces no drawing calls", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makePolyline("p1", [{ x: 0, y: 0 }]));

    // Only save/restore + style setup, no drawing primitives
    expect(ctx.calls.map((c) => c.method)).not.toContain("moveTo");
    expect(ctx.calls.map((c) => c.method)).not.toContain("lineTo");
  });
});

// ==================== renderIEntityToCtx — TEXT ====================

describe("ExportPNGCore — render TEXT", () => {
  test("renders text with fillText", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeText("t1", "Hello", 10, 20));

    const fillTextCall = ctx.calls.find((c) => c.method === "fillText");
    expect(fillTextCall).toBeDefined();
    expect(fillTextCall?.args[0]).toBe("Hello");
  });

  test("text has counter-flip via scale(1, -1)", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeText("t1", "Test"));

    const scaleCalls = ctx.calls.filter((c) => c.method === "scale");
    const counterFlip = scaleCalls.find((c) =>
      (c.args as number[])[0] === 1 && (c.args as number[])[1] === -1
    );
    expect(counterFlip).toBeDefined();
  });

  test("text uses translate to position", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeText("t1", "Pos", 15, 25));

    const translateCalls = ctx.calls.filter((c) => c.method === "translate");
    const posTranslate = translateCalls.find((c) =>
      (c.args as number[])[0] === 15 && (c.args as number[])[1] === 25
    );
    expect(posTranslate).toBeDefined();
  });

  test("multiline text calls fillText for each line", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeText("t1", "Line1\nLine2\nLine3"));

    const fillTextCalls = ctx.calls.filter((c) => c.method === "fillText");
    expect(fillTextCalls).toHaveLength(3);
    expect(fillTextCalls[0].args[0]).toBe("Line1");
    expect(fillTextCalls[1].args[0]).toBe("Line2");
    expect(fillTextCalls[2].args[0]).toBe("Line3");
  });

  test("rotated text calls rotate", () => {
    const ctx = createMockCtx();
    const text = makeText("t1", "Rotated");
    text.rotation = Math.PI / 4;
    renderIEntityToCtx(ctx, text);

    const rotateCalls = ctx.calls.filter((c) => c.method === "rotate");
    expect(rotateCalls.length).toBeGreaterThanOrEqual(1);
  });
});

// ==================== renderIEntityToCtx — DIMENSION ====================

describe("ExportPNGCore — render DIMENSION", () => {
  test("renders dimension line between start and end", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeDimension("d1", 0, 0, 100, 0));

    const moveTo = ctx.calls.find((c) => c.method === "moveTo");
    const lineTo = ctx.calls.find((c) => c.method === "lineTo");
    expect(moveTo?.args).toEqual([0, 0]);
    expect(lineTo?.args).toEqual([100, 0]);
  });

  test("renders dimension text with fillText", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeDimension("d1", 0, 0, 100, 0));

    const fillTextCall = ctx.calls.find((c) => c.method === "fillText");
    expect(fillTextCall).toBeDefined();
    // Distance = 100.0
    expect((fillTextCall?.args[0] as string)).toContain("100.0");
  });

  test("dimension with explicit value uses that value", () => {
    const ctx = createMockCtx();
    const dim = makeDimension("d1");
    dim.value = 250;
    dim.suffix = "mm";
    renderIEntityToCtx(ctx, dim);

    const fillTextCall = ctx.calls.find((c) => c.method === "fillText");
    expect((fillTextCall?.args[0] as string)).toBe("250mm");
  });

  test("dimension text has counter-flip", () => {
    const ctx = createMockCtx();
    renderIEntityToCtx(ctx, makeDimension("d1"));

    const scaleCalls = ctx.calls.filter((c) => c.method === "scale");
    const counterFlip = scaleCalls.find((c) =>
      (c.args as number[])[0] === 1 && (c.args as number[])[1] === -1
    );
    expect(counterFlip).toBeDefined();
  });
});

// ==================== renderDocumentToCtx ====================

describe("ExportPNGCore — renderDocumentToCtx", () => {
  test("draws background before entities", () => {
    const ctx = createMockCtx();
    const doc = makeDocWithEntities([makeLine("l1")]);
    const prep = preparePNGExport(doc);
    renderDocumentToCtx(ctx, prep);

    const fillRectIdx = ctx.calls.findIndex((c) => c.method === "fillRect");
    const moveToIdx = ctx.calls.findIndex((c) => c.method === "moveTo");
    expect(fillRectIdx).toBeLessThan(moveToIdx);
  });

  test("transparent option skips background fillRect", () => {
    const ctx = createMockCtx();
    const doc = makeDocWithEntities([makeLine("l1")]);
    const prep = preparePNGExport(doc, { transparent: true });
    renderDocumentToCtx(ctx, prep);

    // fillRect should not be called for background
    // (entity rendering may still call fillRect for filled shapes)
    const bgFillRect = ctx.calls.find((c) =>
      c.method === "fillRect" &&
      (c.args as number[])[2] === prep.canvasWidth &&
      (c.args as number[])[3] === prep.canvasHeight
    );
    expect(bgFillRect).toBeUndefined();
  });

  test("sets up Y-flip transform via scale(px, -px)", () => {
    const ctx = createMockCtx();
    const doc = makeDocWithEntities([makeLine("l1")]);
    const prep = preparePNGExport(doc);
    renderDocumentToCtx(ctx, prep);

    const scaleCalls = ctx.calls.filter((c) => c.method === "scale");
    // Should have a scale call with negative Y component (Y-flip)
    const yFlip = scaleCalls.find((c) => (c.args as number[])[1] < 0);
    expect(yFlip).toBeDefined();
  });

  test("renders all entities in document", () => {
    const ctx = createMockCtx();
    const doc = makeDocWithEntities([
      makeLine("l1", 0, 0, 50, 50),
      makeLine("l2", 50, 50, 100, 0),
    ]);
    const prep = preparePNGExport(doc);
    renderDocumentToCtx(ctx, prep);

    // 2 lines → 2 moveTo + 2 lineTo
    const moveToCalls = ctx.calls.filter((c) => c.method === "moveTo");
    expect(moveToCalls).toHaveLength(2);
  });
});

// ==================== Stroke Style Rendering ====================

describe("ExportPNGCore — Stroke Styles", () => {
  test("dotted style produces non-empty dash array", () => {
    const ctx = createMockCtx();
    const line = makeLine("l1");
    line.style.strokeStyle = "dotted";
    renderIEntityToCtx(ctx, line);

    const dashCall = ctx.calls.find((c) => c.method === "setLineDash");
    const segments = dashCall?.args[0] as number[];
    expect(segments.length).toBeGreaterThan(0);
  });

  test("dashdot style produces 4-element dash array", () => {
    const ctx = createMockCtx();
    const line = makeLine("l1");
    line.style.strokeStyle = "dashdot";
    renderIEntityToCtx(ctx, line);

    const dashCall = ctx.calls.find((c) => c.method === "setLineDash");
    const segments = dashCall?.args[0] as number[];
    expect(segments).toHaveLength(4);
  });
});

// ==================== ExportManager Facade ====================

describe("ExportPNGCore — ExportManager Facade", () => {
  test("ExportManager.preparePNGExport delegates correctly", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const prep = ExportManager.preparePNGExport(doc);

    expect(prep.canvasWidth).toBe(1024);
    expect(prep.entities).toHaveLength(1);
    expect(prep.pixelScale).toBeGreaterThan(0);
  });

  test("ExportManager.exportDocumentToPNG returns error in non-DOM env", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = ExportManager.exportDocumentToPNG(doc);

    // Jest runs without DOM → should gracefully fail
    expect(result.success).toBe(false);
    expect(result.error).toContain("DOM");
  });
});

// ==================== exportDocumentToPNG (No DOM) ====================

describe("ExportPNGCore — exportDocumentToPNG without DOM", () => {
  test("canvas method returns error without DOM", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPNG(doc, { method: "canvas" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("DOM");
  });

  test("svg method returns error without DOM", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPNG(doc, { method: "svg" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("DOM");
  });
});

// ==================== Mixed Entity Document ====================

describe("ExportPNGCore — Full Pipeline", () => {
  test("mixed document renders all entity types via mock ctx", () => {
    const ctx = createMockCtx();
    const doc = makeDocWithEntities([
      makeLine("l1"),
      makeRect("r1"),
      makeCircle("c1"),
      makeArc("a1"),
      makeEllipse("e1"),
      makePolyline("p1"),
      makeText("t1", "Label"),
      makeDimension("d1"),
    ]);
    const prep = preparePNGExport(doc);
    renderDocumentToCtx(ctx, prep);

    const methods = ctx.calls.map((c) => c.method);
    // Should call drawing primitives for each entity
    expect(methods).toContain("moveTo");
    expect(methods).toContain("lineTo");
    expect(methods).toContain("arc");
    expect(methods).toContain("ellipse");
    expect(methods).toContain("rect");
    expect(methods).toContain("fillText");
    expect(methods).toContain("stroke");
  });

  test("save/restore are balanced", () => {
    const ctx = createMockCtx();
    const doc = makeDocWithEntities([
      makeLine("l1"),
      makeRect("r1"),
      makeText("t1"),
    ]);
    const prep = preparePNGExport(doc);
    renderDocumentToCtx(ctx, prep);

    const saves = ctx.calls.filter((c) => c.method === "save").length;
    const restores = ctx.calls.filter((c) => c.method === "restore").length;
    expect(saves).toBe(restores);
  });
});
