/**
 * ExportSVGCore Tests — Phase 5.3
 *
 * Tests for IEntity-based SVG export:
 *   - exportDocumentToSVG (CadDocument → SVG string)
 *   - iEntityToSVG (single entity → SVG element)
 *   - calculateIEntityBounds (bounding box from IEntity[])
 *   - All 8 entity types: LINE, RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION
 *   - Y-flip strategy, viewBox, export modes, options
 *   - ExportManager.exportDocumentToSVG facade
 */

import { CadDocument } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";
import {
  exportDocumentToSVG,
  iEntityToSVG,
  calculateIEntityBounds,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportSVGCore";
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

// ==================== Helpers ====================

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
  const doc = new CadDocument({ title: "SVG Test" });
  for (const e of entities) {
    doc.addEntity(e);
  }
  return doc;
}

// ==================== SVG Structure ====================

describe("ExportSVGCore — SVG Structure", () => {
  test("exported SVG contains XML declaration and SVG root", () => {
    const doc = new CadDocument({ title: "Structure Test" });
    const result = exportDocumentToSVG(doc);

    expect(result.success).toBe(true);
    const svg = result.data as string;

    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('</svg>');
  });

  test("exported SVG includes title element", () => {
    const doc = new CadDocument({ title: "My Drawing" });
    const result = exportDocumentToSVG(doc, { title: "My Drawing" });
    const svg = result.data as string;

    expect(svg).toContain("<title>My Drawing</title>");
  });

  test("exported SVG includes Y-flip group", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToSVG(doc);
    const svg = result.data as string;

    expect(svg).toContain('transform="scale(1,-1)"');
  });

  test("exported SVG includes background rect by default", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToSVG(doc);
    const svg = result.data as string;

    expect(svg).toContain('fill="#1a1a2e"');
  });

  test("transparent option removes background", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToSVG(doc, { transparent: true });
    const svg = result.data as string;

    // No background rect fill
    expect(svg).not.toContain('fill="#1a1a2e"');
  });

  test("custom backgroundColor is applied", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToSVG(doc, { backgroundColor: "#FF0000" });
    const svg = result.data as string;

    expect(svg).toContain('fill="#FF0000"');
  });

  test("has viewBox attribute", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToSVG(doc);
    const svg = result.data as string;

    expect(svg).toMatch(/viewBox="[^"]+"/);
  });

  test("export mode preview uses 100% width", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToSVG(doc, { exportMode: "preview" });
    const svg = result.data as string;

    expect(svg).toContain('width="100%"');
    expect(svg).toContain('height="100%"');
  });

  test("export mode world uses mm dimensions", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToSVG(doc, { exportMode: "world" });
    const svg = result.data as string;

    expect(svg).toMatch(/width="[\d.]+mm"/);
    expect(svg).toMatch(/height="[\d.]+mm"/);
  });

  test("result has filename ending with .svg", () => {
    const doc = new CadDocument({ title: "Test" });
    const result = exportDocumentToSVG(doc, { title: "drawing" });

    expect(result.filename).toBe("drawing.svg");
  });

  test("empty document exports successfully", () => {
    const doc = new CadDocument({ title: "Empty" });
    const result = exportDocumentToSVG(doc);

    expect(result.success).toBe(true);
    expect(result.data).toContain("</svg>");
  });
});

// ==================== Entity Rendering: LINE ====================

describe("ExportSVGCore — LINE", () => {
  test("line renders as <line> element", () => {
    const svg = iEntityToSVG(makeLine("l1", 10, 20, 30, 40));

    expect(svg).toContain("<line");
    expect(svg).toContain('x1="10"');
    expect(svg).toContain('y1="20"');
    expect(svg).toContain('x2="30"');
    expect(svg).toContain('y2="40"');
  });

  test("line has stroke attributes", () => {
    const line = makeLine("l1");
    line.style.strokeColor = "#FF0000";
    line.style.strokeWidth = 2;
    const svg = iEntityToSVG(line);

    expect(svg).toContain('stroke="#FF0000"');
    expect(svg).toContain('stroke-width="2"');
  });

  test("dashed line has stroke-dasharray", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "dashed";
    const svg = iEntityToSVG(line);

    expect(svg).toContain("stroke-dasharray");
  });
});

// ==================== Entity Rendering: RECT ====================

describe("ExportSVGCore — RECT", () => {
  test("rect renders as <rect> element", () => {
    const svg = iEntityToSVG(makeRect("r1", 10, 20, 200, 100));

    expect(svg).toContain("<rect");
    expect(svg).toContain('x="10"');
    expect(svg).toContain('y="20"');
    expect(svg).toContain('width="200"');
    expect(svg).toContain('height="100"');
  });

  test("rotated rect has transform attribute", () => {
    const rect = makeRect("r1", 0, 0, 200, 100);
    rect.rotation = Math.PI / 4;
    const svg = iEntityToSVG(rect);

    expect(svg).toContain('transform="rotate(');
  });

  test("non-rotated rect has no transform", () => {
    const svg = iEntityToSVG(makeRect("r1"));

    expect(svg).not.toContain("transform");
  });

  test("rect with fill color", () => {
    const rect = makeRect("r1");
    rect.style.fillColor = "#0000FF";
    const svg = iEntityToSVG(rect);

    expect(svg).toContain('fill="#0000FF"');
  });
});

// ==================== Entity Rendering: CIRCLE ====================

describe("ExportSVGCore — CIRCLE", () => {
  test("circle renders as <circle> element", () => {
    const svg = iEntityToSVG(makeCircle("c1", 50, 60, 25));

    expect(svg).toContain("<circle");
    expect(svg).toContain('cx="50"');
    expect(svg).toContain('cy="60"');
    expect(svg).toContain('r="25"');
  });
});

// ==================== Entity Rendering: ARC ====================

describe("ExportSVGCore — ARC", () => {
  test("arc renders as <path> with A command", () => {
    const svg = iEntityToSVG(makeArc("a1", 0, 0, 50, 0, Math.PI / 2));

    expect(svg).toContain("<path");
    expect(svg).toContain(" A ");
    expect(svg).toContain("M ");
    expect(svg).toContain('fill="none"');
  });

  test("arc > 180 degrees uses large-arc flag", () => {
    const arc = makeArc("a1", 0, 0, 50, 0, Math.PI * 1.5);
    const svg = iEntityToSVG(arc);

    // large-arc flag should be 1
    expect(svg).toMatch(/A \d+ \d+ 0 1 1/);
  });

  test("arc < 180 degrees uses small-arc flag", () => {
    const arc = makeArc("a1", 0, 0, 50, 0, Math.PI / 2);
    const svg = iEntityToSVG(arc);

    // large-arc flag should be 0
    expect(svg).toMatch(/A \d+ \d+ 0 0 1/);
  });
});

// ==================== Entity Rendering: ELLIPSE ====================

describe("ExportSVGCore — ELLIPSE", () => {
  test("ellipse renders as <ellipse> element", () => {
    const svg = iEntityToSVG(makeEllipse("e1", 10, 20, 100, 50));

    expect(svg).toContain("<ellipse");
    expect(svg).toContain('cx="10"');
    expect(svg).toContain('cy="20"');
    expect(svg).toContain('rx="100"');
    expect(svg).toContain('ry="50"');
  });

  test("rotated ellipse has transform", () => {
    const el = makeEllipse("e1", 0, 0, 100, 50, Math.PI / 6);
    const svg = iEntityToSVG(el);

    expect(svg).toContain("transform=\"rotate(");
  });

  test("non-rotated ellipse has no transform", () => {
    const svg = iEntityToSVG(makeEllipse("e1"));

    expect(svg).not.toContain("transform");
  });
});

// ==================== Entity Rendering: POLYLINE ====================

describe("ExportSVGCore — POLYLINE", () => {
  test("open polyline renders as <polyline>", () => {
    const svg = iEntityToSVG(makePolyline("p1", [
      { x: 0, y: 0 }, { x: 10, y: 20 }, { x: 30, y: 10 },
    ], false));

    expect(svg).toContain("<polyline");
    expect(svg).toContain("0,0 10,20 30,10");
  });

  test("closed polyline renders as <polygon>", () => {
    const svg = iEntityToSVG(makePolyline("p1", [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 },
    ], true));

    expect(svg).toContain("<polygon");
  });

  test("polyline with < 2 points returns empty string", () => {
    const svg = iEntityToSVG(makePolyline("p1", [{ x: 0, y: 0 }]));
    expect(svg).toBe("");
  });
});

// ==================== Entity Rendering: TEXT ====================

describe("ExportSVGCore — TEXT", () => {
  test("text renders as <text> inside counter-flip group", () => {
    const svg = iEntityToSVG(makeText("t1", "Hello", 10, 20));

    expect(svg).toContain("<text");
    expect(svg).toContain("Hello");
    // Counter-flip for readable text inside Y-flip root
    expect(svg).toContain("scale(1,-1)");
    expect(svg).toContain("translate(10,20)");
  });

  test("text has font-size attribute", () => {
    const svg = iEntityToSVG(makeText("t1", "Test"));

    expect(svg).toContain('font-size="12"');
    expect(svg).toContain('font-family="Arial"');
  });

  test("text with center align uses middle anchor", () => {
    const t = makeText("t1", "Center");
    t.textAlign = "center";
    const svg = iEntityToSVG(t);

    expect(svg).toContain('text-anchor="middle"');
  });

  test("text with right align uses end anchor", () => {
    const t = makeText("t1", "Right");
    t.textAlign = "right";
    const svg = iEntityToSVG(t);

    expect(svg).toContain('text-anchor="end"');
  });

  test("multiline text uses tspan elements", () => {
    const svg = iEntityToSVG(makeText("t1", "Line1\nLine2"));

    expect(svg).toContain("<tspan");
    expect(svg).toContain("Line1");
    expect(svg).toContain("Line2");
  });

  test("text escapes special XML characters", () => {
    const svg = iEntityToSVG(makeText("t1", "A & B < C"));

    expect(svg).toContain("A &amp; B &lt; C");
  });

  test("rotated text includes rotation", () => {
    const t = makeText("t1", "Rotated");
    t.rotation = Math.PI / 4;
    const svg = iEntityToSVG(t);

    expect(svg).toContain("rotate(");
  });
});

// ==================== Entity Rendering: DIMENSION ====================

describe("ExportSVGCore — DIMENSION", () => {
  test("dimension renders as group with line and text", () => {
    const svg = iEntityToSVG(makeDimension("d1", 0, 0, 100, 0));

    expect(svg).toContain("<g");
    expect(svg).toContain("<line");
    expect(svg).toContain("<text");
    expect(svg).toContain('class="dimension"');
  });

  test("dimension displays computed distance", () => {
    const svg = iEntityToSVG(makeDimension("d1", 0, 0, 100, 0));

    // Distance is 100.0
    expect(svg).toContain("100.0");
  });

  test("dimension with explicit value uses it", () => {
    const dim = makeDimension("d1", 0, 0, 100, 0);
    dim.value = 200;
    dim.suffix = "mm";
    const svg = iEntityToSVG(dim);

    expect(svg).toContain("200mm");
  });

  test("dimension text has counter-flip", () => {
    const svg = iEntityToSVG(makeDimension("d1"));

    expect(svg).toContain("scale(1,-1)");
  });
});

// ==================== Bounds Calculation ====================

describe("ExportSVGCore — Bounds", () => {
  test("bounds from line entities", () => {
    const bounds = calculateIEntityBounds([
      makeLine("l1", 10, 20, 90, 80),
    ]);

    expect(bounds.minX).toBe(10);
    expect(bounds.minY).toBe(20);
    expect(bounds.maxX).toBe(90);
    expect(bounds.maxY).toBe(80);
  });

  test("bounds from rect entity", () => {
    const bounds = calculateIEntityBounds([
      makeRect("r1", 50, 60, 200, 100),
    ]);

    expect(bounds.minX).toBe(50);
    expect(bounds.minY).toBe(60);
    expect(bounds.maxX).toBe(250);
    expect(bounds.maxY).toBe(160);
  });

  test("bounds from circle entity", () => {
    const bounds = calculateIEntityBounds([
      makeCircle("c1", 100, 100, 50),
    ]);

    expect(bounds.minX).toBe(50);
    expect(bounds.minY).toBe(50);
    expect(bounds.maxX).toBe(150);
    expect(bounds.maxY).toBe(150);
  });

  test("bounds from multiple entities merge correctly", () => {
    const bounds = calculateIEntityBounds([
      makeLine("l1", 0, 0, 50, 50),
      makeLine("l2", -20, -30, 100, 200),
    ]);

    expect(bounds.minX).toBe(-20);
    expect(bounds.minY).toBe(-30);
    expect(bounds.maxX).toBe(100);
    expect(bounds.maxY).toBe(200);
  });

  test("empty entities returns default bounds", () => {
    const bounds = calculateIEntityBounds([]);

    expect(bounds.minX).toBe(0);
    expect(bounds.minY).toBe(0);
    expect(bounds.maxX).toBe(100);
    expect(bounds.maxY).toBe(100);
  });

  test("bounds from polyline points", () => {
    const bounds = calculateIEntityBounds([
      makePolyline("p1", [
        { x: -10, y: 5 }, { x: 40, y: 80 }, { x: 20, y: -15 },
      ]),
    ]);

    expect(bounds.minX).toBe(-10);
    expect(bounds.minY).toBe(-15);
    expect(bounds.maxX).toBe(40);
    expect(bounds.maxY).toBe(80);
  });

  test("bounds from dimension uses start and end points", () => {
    const bounds = calculateIEntityBounds([
      makeDimension("d1", -50, 10, 150, 90),
    ]);

    // min/max from start/end + textPosition
    expect(bounds.minX).toBe(-50);
    expect(bounds.maxX).toBe(150);
    expect(bounds.minY).toBe(10);
    // textPosition y = (10 + 90) / 2 + 10 = 60, endPoint.y = 90
    expect(bounds.maxY).toBe(90);
  });
});

// ==================== Export Options ====================

describe("ExportSVGCore — Options", () => {
  test("hidden entities are excluded by default", () => {
    const line = makeLine("hidden");
    line.state.visible = false;
    const doc = makeDocWithEntities([line, makeLine("visible")]);
    const result = exportDocumentToSVG(doc);
    const svg = result.data as string;

    // Only 1 line element in the SVG (visible one)
    const lineMatches = svg.match(/<line /g);
    expect(lineMatches?.length).toBe(1);
  });

  test("includeHidden shows hidden entities", () => {
    const line = makeLine("hidden");
    line.state.visible = false;
    const doc = makeDocWithEntities([line, makeLine("visible")]);
    const result = exportDocumentToSVG(doc, { includeHidden: true });
    const svg = result.data as string;

    const lineMatches = svg.match(/<line /g);
    expect(lineMatches?.length).toBe(2);
  });

  test("includeText=false excludes text entities", () => {
    const doc = makeDocWithEntities([makeLine("l1"), makeText("t1", "Hello")]);
    const result = exportDocumentToSVG(doc, { includeText: false });
    const svg = result.data as string;

    expect(svg).not.toContain("Hello");
    expect(svg).toContain("<line");
  });

  test("includeDimensions=false excludes dimension entities", () => {
    const doc = makeDocWithEntities([makeLine("l1"), makeDimension("d1")]);
    const result = exportDocumentToSVG(doc, { includeDimensions: false });
    const svg = result.data as string;

    expect(svg).not.toContain('class="dimension"');
    expect(svg).toContain("<line");
  });

  test("strokeWidthOverride overrides all entities", () => {
    const line = makeLine("l1");
    line.style.strokeWidth = 1;
    const doc = makeDocWithEntities([line]);
    const result = exportDocumentToSVG(doc, { strokeWidthOverride: 3 });
    const svg = result.data as string;

    expect(svg).toContain('stroke-width="3"');
    expect(svg).not.toContain('stroke-width="1"');
  });

  test("padding affects viewBox", () => {
    const doc = makeDocWithEntities([makeLine("l1", 0, 0, 100, 100)]);

    const r1 = exportDocumentToSVG(doc, { padding: 10 });
    const r2 = exportDocumentToSVG(doc, { padding: 50 });

    // Different padding → different viewBox values
    const vb1 = (r1.data as string).match(/viewBox="([^"]+)"/)?.[1];
    const vb2 = (r2.data as string).match(/viewBox="([^"]+)"/)?.[1];
    expect(vb1).not.toBe(vb2);
  });
});

// ==================== Stroke Style Mapping ====================

describe("ExportSVGCore — Stroke Styles", () => {
  test("solid style has no dasharray", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "solid";
    const svg = iEntityToSVG(line);

    expect(svg).not.toContain("stroke-dasharray");
  });

  test("dashed style produces dasharray", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "dashed";
    const svg = iEntityToSVG(line);

    expect(svg).toContain("stroke-dasharray");
  });

  test("dotted style produces dasharray", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "dotted";
    const svg = iEntityToSVG(line);

    expect(svg).toContain("stroke-dasharray");
  });

  test("dashdot style produces dasharray", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "dashdot";
    const svg = iEntityToSVG(line);

    expect(svg).toContain("stroke-dasharray");
  });
});

// ==================== Full Document Export ====================

describe("ExportSVGCore — Full Document", () => {
  test("document with mixed entities exports all", () => {
    const doc = makeDocWithEntities([
      makeLine("l1"),
      makeRect("r1"),
      makeCircle("c1"),
      makeText("t1", "Label"),
    ]);
    const result = exportDocumentToSVG(doc);
    const svg = result.data as string;

    expect(result.success).toBe(true);
    expect(svg).toContain("<line");
    expect(svg).toContain("<rect");
    expect(svg).toContain("<circle");
    expect(svg).toContain("Label");
  });

  test("ExportManager facade delegates correctly", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = ExportManager.exportDocumentToSVG(doc);

    expect(result.success).toBe(true);
    const svg = result.data as string;
    expect(svg).toContain("<line");
    expect(svg).toContain("</svg>");
  });

  test("large document with 50 entities exports successfully", () => {
    const entities: IEntity[] = [];
    for (let i = 0; i < 50; i++) {
      entities.push(makeLine(`l${i}`, i * 10, 0, i * 10 + 10, 100));
    }
    const doc = makeDocWithEntities(entities);
    const result = exportDocumentToSVG(doc);

    expect(result.success).toBe(true);
    const svg = result.data as string;
    const lineMatches = svg.match(/<line /g);
    expect(lineMatches?.length).toBe(50);
  });
});

// ==================== Edge Cases & Error Handling ====================

describe("ExportSVGCore — Edge Cases", () => {
  test("SVG escapes special characters in title", () => {
    const doc = new CadDocument({ title: "Test" });
    const result = exportDocumentToSVG(doc, { title: "A & B < C" });
    const svg = result.data as string;

    expect(svg).toContain("A &amp; B &lt; C");
  });

  test("entities with zero-size produce valid bounds", () => {
    // Single point line (zero length)
    const bounds = calculateIEntityBounds([makeLine("l1", 50, 50, 50, 50)]);
    // Should expand to avoid zero-size
    expect(bounds.maxX - bounds.minX).toBeGreaterThan(0);
    expect(bounds.maxY - bounds.minY).toBeGreaterThan(0);
  });

  test("text entity contributes to bounds", () => {
    const bounds = calculateIEntityBounds([
      makeText("t1", "Hello World", 100, 200),
    ]);

    expect(bounds.minX).toBe(100);
    expect(bounds.minY).toBe(200);
    // Text extends rightward
    expect(bounds.maxX).toBeGreaterThan(100);
  });

  test("ellipse bounds use max radius", () => {
    const bounds = calculateIEntityBounds([
      makeEllipse("e1", 0, 0, 100, 50),
    ]);
    // maxR = 100
    expect(bounds.minX).toBe(-100);
    expect(bounds.maxX).toBe(100);
    expect(bounds.minY).toBe(-100);
    expect(bounds.maxY).toBe(100);
  });
});
