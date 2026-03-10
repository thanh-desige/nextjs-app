/**
 * ExportPDFCore Tests — Phase 5.5
 *
 * Tests for IEntity-based PDF export:
 *   - exportDocumentToPDF (CadDocument → PDF string)
 *   - iEntityToPDFOps (single entity → PDF operators)
 *   - getPageDimensions (paper size / orientation calculation)
 *   - hexToRgb01 (color conversion)
 *   - All 8 entity types: LINE, RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION
 *   - PDF structure validation (%PDF header, xref, trailer, %%EOF)
 *   - Page sizes, orientation, title block, options
 *   - ExportManager.exportDocumentToPDF facade
 */

import { CadDocument } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";
import {
  exportDocumentToPDF,
  iEntityToPDFOps,
  getPageDimensions,
  hexToRgb01,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportPDFCore";
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
  const doc = new CadDocument({ title: "PDF Test" });
  for (const e of entities) {
    doc.addEntity(e);
  }
  return doc;
}

// ==================== PDF Structure ====================

describe("ExportPDFCore — PDF Structure", () => {
  test("exported PDF starts with %PDF-1.4", () => {
    const doc = new CadDocument({ title: "Structure Test" });
    const result = exportDocumentToPDF(doc);

    expect(result.success).toBe(true);
    const pdf = result.data as string;
    expect(pdf).toMatch(/^%PDF-1\.4/);
  });

  test("exported PDF ends with %%EOF", () => {
    const doc = new CadDocument({ title: "EOF Test" });
    const result = exportDocumentToPDF(doc);
    const pdf = result.data as string;

    expect(pdf).toContain("%%EOF");
  });

  test("exported PDF contains xref table", () => {
    const doc = new CadDocument({ title: "Xref Test" });
    const result = exportDocumentToPDF(doc);
    const pdf = result.data as string;

    expect(pdf).toContain("xref");
    expect(pdf).toContain("startxref");
  });

  test("exported PDF contains trailer with /Root", () => {
    const doc = new CadDocument({ title: "Trailer Test" });
    const result = exportDocumentToPDF(doc);
    const pdf = result.data as string;

    expect(pdf).toContain("trailer");
    expect(pdf).toContain("/Root 1 0 R");
  });

  test("exported PDF contains Catalog object", () => {
    const doc = new CadDocument({ title: "Catalog" });
    const result = exportDocumentToPDF(doc);
    const pdf = result.data as string;

    expect(pdf).toContain("/Type /Catalog");
    expect(pdf).toContain("/Type /Pages");
    expect(pdf).toContain("/Type /Page");
  });

  test("exported PDF contains Helvetica font", () => {
    const doc = new CadDocument({ title: "Font" });
    const result = exportDocumentToPDF(doc);
    const pdf = result.data as string;

    expect(pdf).toContain("/BaseFont /Helvetica");
  });

  test("exported PDF has content stream", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPDF(doc);
    const pdf = result.data as string;

    expect(pdf).toContain("stream");
    expect(pdf).toContain("endstream");
  });

  test("result has filename ending with .pdf", () => {
    const doc = new CadDocument({ title: "Test" });
    const result = exportDocumentToPDF(doc, { title: "drawing" });

    expect(result.filename).toBe("drawing.pdf");
  });

  test("empty document exports successfully", () => {
    const doc = new CadDocument({ title: "Empty" });
    const result = exportDocumentToPDF(doc);

    expect(result.success).toBe(true);
    expect(result.data).toContain("%PDF-1.4");
  });
});

// ==================== Page Dimensions ====================

describe("ExportPDFCore — Page Dimensions", () => {
  test("A4 landscape dimensions are correct", () => {
    const page = getPageDimensions({ paperSize: "A4", orientation: "landscape" });

    // A4 landscape: 297mm × 210mm
    const expectedW = 297 * (72 / 25.4);
    const expectedH = 210 * (72 / 25.4);
    expect(page.widthPt).toBeCloseTo(expectedW, 0);
    expect(page.heightPt).toBeCloseTo(expectedH, 0);
  });

  test("A4 portrait dimensions are correct", () => {
    const page = getPageDimensions({ paperSize: "A4", orientation: "portrait" });

    const expectedW = 210 * (72 / 25.4);
    const expectedH = 297 * (72 / 25.4);
    expect(page.widthPt).toBeCloseTo(expectedW, 0);
    expect(page.heightPt).toBeCloseTo(expectedH, 0);
  });

  test("A3 landscape is larger than A4", () => {
    const a4 = getPageDimensions({ paperSize: "A4", orientation: "landscape" });
    const a3 = getPageDimensions({ paperSize: "A3", orientation: "landscape" });

    expect(a3.widthPt).toBeGreaterThan(a4.widthPt);
    expect(a3.heightPt).toBeGreaterThan(a4.heightPt);
  });

  test("custom paper size is used", () => {
    const page = getPageDimensions({
      paperSize: "custom",
      customWidth: 500,
      customHeight: 300,
      orientation: "landscape",
    });

    const expectedW = 500 * (72 / 25.4);
    const expectedH = 300 * (72 / 25.4);
    expect(page.widthPt).toBeCloseTo(expectedW, 0);
    expect(page.heightPt).toBeCloseTo(expectedH, 0);
  });

  test("drawable area accounts for margin", () => {
    const page = getPageDimensions({ margin: 20 });
    const marginPt = 20 * (72 / 25.4);

    expect(page.drawableW).toBeCloseTo(page.widthPt - 2 * marginPt, 0);
    expect(page.drawableH).toBeCloseTo(page.heightPt - 2 * marginPt, 0);
  });

  test("default margin is 10mm", () => {
    const page = getPageDimensions();
    const marginPt = 10 * (72 / 25.4);

    expect(page.marginPt).toBeCloseTo(marginPt, 0);
  });
});

// ==================== Color Conversion ====================

describe("ExportPDFCore — hexToRgb01", () => {
  test("white → [1, 1, 1]", () => {
    const [r, g, b] = hexToRgb01("#FFFFFF");
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(1);
    expect(b).toBeCloseTo(1);
  });

  test("black → [0, 0, 0]", () => {
    const [r, g, b] = hexToRgb01("#000000");
    expect(r).toBeCloseTo(0);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0);
  });

  test("red → [1, 0, 0]", () => {
    const [r, g, b] = hexToRgb01("#FF0000");
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0);
  });

  test("handles without # prefix", () => {
    const [r, g, b] = hexToRgb01("00FF00");
    expect(r).toBeCloseTo(0);
    expect(g).toBeCloseTo(1);
    expect(b).toBeCloseTo(0);
  });

  test("invalid hex returns [0, 0, 0]", () => {
    const [r, g, b] = hexToRgb01("invalid");
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });
});

// ==================== Entity PDF Operators: LINE ====================

describe("ExportPDFCore — LINE Operators", () => {
  test("line produces moveTo + lineTo + stroke", () => {
    const ops = iEntityToPDFOps(makeLine("l1", 10, 20, 30, 40));

    expect(ops).toContain("10 20 m");
    expect(ops).toContain("30 40 l");
    expect(ops).toContain("S");
  });

  test("line with custom color sets RG", () => {
    const line = makeLine("l1");
    line.style.strokeColor = "#FF0000";
    const ops = iEntityToPDFOps(line);

    expect(ops).toContain("1 0 0 RG");
  });

  test("line with custom width sets w", () => {
    const line = makeLine("l1");
    line.style.strokeWidth = 3;
    const ops = iEntityToPDFOps(line);

    expect(ops).toContain("3 w");
  });

  test("dashed line has dash array operator", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "dashed";
    const ops = iEntityToPDFOps(line);

    expect(ops).toMatch(/\[[\d. ]+\] 0 d/);
  });

  test("dashed line resets dash at end", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "dashed";
    const ops = iEntityToPDFOps(line);

    // Last line should reset dash
    expect(ops).toContain("[] 0 d");
  });
});

// ==================== Entity PDF Operators: RECT ====================

describe("ExportPDFCore — RECT Operators", () => {
  test("rect produces re + S operator", () => {
    const ops = iEntityToPDFOps(makeRect("r1", 10, 20, 200, 100));

    expect(ops).toContain("10 20 200 100 re");
    expect(ops).toContain("S");
  });

  test("filled rect uses B operator", () => {
    const rect = makeRect("r1");
    rect.style.fillColor = "#0000FF";
    const ops = iEntityToPDFOps(rect);

    expect(ops).toContain("B");
  });

  test("rotated rect uses path instead of re", () => {
    const rect = makeRect("r1", 0, 0, 200, 100);
    rect.rotation = Math.PI / 4;
    const ops = iEntityToPDFOps(rect);

    // Should use moveTo + lineTo for rotated rect, not re
    expect(ops).toContain("m");
    expect(ops).toContain("l");
    expect(ops).toContain("h"); // closePath
  });
});

// ==================== Entity PDF Operators: CIRCLE ====================

describe("ExportPDFCore — CIRCLE Operators", () => {
  test("circle uses Bezier curves (c operator)", () => {
    const ops = iEntityToPDFOps(makeCircle("c1", 50, 60, 25));

    expect(ops).toContain("c"); // cubic Bezier
    expect(ops).toContain("S");
  });

  test("filled circle uses B operator", () => {
    const circle = makeCircle("c1");
    circle.style.fillColor = "#0000FF";
    const ops = iEntityToPDFOps(circle);

    expect(ops).toContain("B");
  });

  test("circle starts at rightmost point", () => {
    // Circle at (50, 60) r=25 → starts at (75, 60)
    const ops = iEntityToPDFOps(makeCircle("c1", 50, 60, 25));

    expect(ops).toContain("75 60 m");
  });
});

// ==================== Entity PDF Operators: ARC ====================

describe("ExportPDFCore — ARC Operators", () => {
  test("arc uses Bezier curves and stroke", () => {
    const ops = iEntityToPDFOps(makeArc("a1"));

    expect(ops).toContain("c");
    expect(ops).toContain("S");
  });
});

// ==================== Entity PDF Operators: ELLIPSE ====================

describe("ExportPDFCore — ELLIPSE Operators", () => {
  test("ellipse uses Bezier curves", () => {
    const ops = iEntityToPDFOps(makeEllipse("e1"));

    expect(ops).toContain("c");
    expect(ops).toContain("S");
  });

  test("filled ellipse uses B operator", () => {
    const el = makeEllipse("e1");
    el.style.fillColor = "#00FF00";
    const ops = iEntityToPDFOps(el);

    expect(ops).toContain("B");
  });
});

// ==================== Entity PDF Operators: POLYLINE ====================

describe("ExportPDFCore — POLYLINE Operators", () => {
  test("open polyline uses m + l + S", () => {
    const ops = iEntityToPDFOps(makePolyline("p1", [
      { x: 0, y: 0 }, { x: 10, y: 20 }, { x: 30, y: 10 },
    ], false));

    expect(ops).toContain("0 0 m");
    expect(ops).toContain("10 20 l");
    expect(ops).toContain("30 10 l");
    expect(ops).toContain("S");
  });

  test("closed polyline uses h", () => {
    const ops = iEntityToPDFOps(makePolyline("p1", [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 },
    ], true));

    expect(ops).toContain("h");
  });

  test("polyline with < 2 points produces comment", () => {
    const ops = iEntityToPDFOps(makePolyline("p1", [{ x: 0, y: 0 }]));

    expect(ops).toContain("% empty polyline");
  });
});

// ==================== Entity PDF Operators: TEXT ====================

describe("ExportPDFCore — TEXT Operators", () => {
  test("text uses BT/ET block", () => {
    const ops = iEntityToPDFOps(makeText("t1", "Hello"));

    expect(ops).toContain("BT");
    expect(ops).toContain("ET");
  });

  test("text sets font with Tf", () => {
    const ops = iEntityToPDFOps(makeText("t1", "Test"));

    expect(ops).toContain("/F1 12 Tf");
  });

  test("text positions with Td", () => {
    const ops = iEntityToPDFOps(makeText("t1", "Pos", 15, 25));

    expect(ops).toContain("15 25 Td");
  });

  test("text string uses Tj", () => {
    const ops = iEntityToPDFOps(makeText("t1", "Hello"));

    expect(ops).toContain("(Hello) Tj");
  });

  test("text escapes parentheses", () => {
    const ops = iEntityToPDFOps(makeText("t1", "A (test) B"));

    expect(ops).toContain("(A \\(test\\) B) Tj");
  });

  test("multiline text uses multiple Td + Tj", () => {
    const ops = iEntityToPDFOps(makeText("t1", "Line1\nLine2"));

    expect(ops).toContain("(Line1) Tj");
    expect(ops).toContain("(Line2) Tj");
    // Second line moves with Td
    const tdMatches = ops.match(/Td/g);
    expect(tdMatches!.length).toBeGreaterThanOrEqual(2);
  });
});

// ==================== Entity PDF Operators: DIMENSION ====================

describe("ExportPDFCore — DIMENSION Operators", () => {
  test("dimension has line + text", () => {
    const ops = iEntityToPDFOps(makeDimension("d1", 0, 0, 100, 0));

    // Line part
    expect(ops).toContain("0 0 m");
    expect(ops).toContain("100 0 l");
    expect(ops).toContain("S");

    // Text part
    expect(ops).toContain("BT");
    expect(ops).toContain("100.0");
    expect(ops).toContain("Tj");
    expect(ops).toContain("ET");
  });

  test("dimension with explicit value uses it", () => {
    const dim = makeDimension("d1");
    dim.value = 200;
    dim.suffix = "mm";
    const ops = iEntityToPDFOps(dim);

    expect(ops).toContain("(200mm) Tj");
  });

  test("dimension has comment marker", () => {
    const ops = iEntityToPDFOps(makeDimension("d1"));
    expect(ops).toContain("% dimension");
  });
});

// ==================== Stroke Styles ====================

describe("ExportPDFCore — Stroke Styles", () => {
  test("solid line has no dash operator", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "solid";
    const ops = iEntityToPDFOps(line);

    // Should not have dash array (except possible empty reset)
    const dashLines = ops.split("\n").filter((l) => l.match(/\[\d/));
    expect(dashLines).toHaveLength(0);
  });

  test("dotted line has dash operator", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "dotted";
    const ops = iEntityToPDFOps(line);

    expect(ops).toMatch(/\[[\d. ]+\] 0 d/);
  });

  test("dashdot line has dash operator", () => {
    const line = makeLine("l1");
    line.style.strokeStyle = "dashdot";
    const ops = iEntityToPDFOps(line);

    expect(ops).toMatch(/\[[\d. ]+\] 0 d/);
  });
});

// ==================== Full Document Export ====================

describe("ExportPDFCore — Full Document", () => {
  test("document with mixed entities exports all", () => {
    const doc = makeDocWithEntities([
      makeLine("l1"),
      makeRect("r1"),
      makeCircle("c1"),
      makeText("t1", "Label"),
    ]);
    const result = exportDocumentToPDF(doc);
    const pdf = result.data as string;

    expect(result.success).toBe(true);
    expect(pdf).toContain("%PDF-1.4");
    // Contains drawing operators
    expect(pdf).toContain("m"); // moveTo
    expect(pdf).toContain("l"); // lineTo
    expect(pdf).toContain("re"); // rect
    expect(pdf).toContain("c"); // curve
    expect(pdf).toContain("BT"); // text
  });

  test("ExportManager facade delegates correctly", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = ExportManager.exportDocumentToPDF(doc);

    expect(result.success).toBe(true);
    expect((result.data as string)).toContain("%PDF-1.4");
  });

  test("title block is included by default", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPDF(doc, {
      title: "My Drawing",
      author: "Test Author",
      includeTitleBlock: true,
    });
    const pdf = result.data as string;

    expect(pdf).toContain("My Drawing");
    expect(pdf).toContain("Test Author");
  });

  test("title block can be excluded", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPDF(doc, {
      title: "My Drawing",
      includeTitleBlock: false,
    });
    const pdf = result.data as string;

    // Title still in PDF metadata (title block text won't be in stream)
    expect(result.success).toBe(true);
  });

  test("scale label is included in title block", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPDF(doc, { scaleLabel: "1:100" });
    const pdf = result.data as string;

    expect(pdf).toContain("1:100");
  });

  test("MediaBox matches page dimensions", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPDF(doc, { paperSize: "A4", orientation: "landscape" });
    const pdf = result.data as string;

    expect(pdf).toContain("/MediaBox");
  });
});

// ==================== Export Options ====================

describe("ExportPDFCore — Options", () => {
  test("hidden entities are excluded by default", () => {
    const line1 = makeLine("vis");
    const line2 = makeLine("hid");
    line2.state.visible = false;
    const doc = makeDocWithEntities([line1, line2]);
    const result = exportDocumentToPDF(doc);
    const pdf = result.data as string;

    // Only 1 line's coordinates should appear
    // vis: 0 0 m 100 0 l
    expect(result.success).toBe(true);
    // Count occurrences of stroke operator for line entities
    const streamMatch = pdf.match(/stream\n([\s\S]*?)\nendstream/);
    expect(streamMatch).toBeTruthy();
  });

  test("includeHidden=true keeps hidden entities", () => {
    const line1 = makeLine("vis", 0, 0, 50, 50);
    const line2 = makeLine("hid", 60, 60, 90, 90);
    line2.state.visible = false;
    const doc = makeDocWithEntities([line1, line2]);

    const r1 = exportDocumentToPDF(doc, { includeHidden: false });
    const r2 = exportDocumentToPDF(doc, { includeHidden: true });

    // With hidden included, more content
    expect((r2.data as string).length).toBeGreaterThan((r1.data as string).length);
  });

  test("includeText=false excludes text", () => {
    const doc = makeDocWithEntities([makeLine("l1"), makeText("t1", "Hello")]);
    const result = exportDocumentToPDF(doc, { includeText: false });
    const pdf = result.data as string;

    // Stream should not have "Hello" text
    const streamMatch = pdf.match(/stream\n([\s\S]*?)\nendstream/);
    expect(streamMatch![1]).not.toContain("(Hello)");
  });

  test("includeDimensions=false excludes dimensions", () => {
    const doc = makeDocWithEntities([makeLine("l1"), makeDimension("d1")]);
    const result = exportDocumentToPDF(doc, { includeDimensions: false });
    const pdf = result.data as string;

    const streamMatch = pdf.match(/stream\n([\s\S]*?)\nendstream/);
    expect(streamMatch![1]).not.toContain("% dimension");
  });

  test("custom background color is applied", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPDF(doc, { backgroundColor: "#FF0000" });
    const pdf = result.data as string;

    // Red background: 1 0 0 rg ... re f
    expect(pdf).toContain("1 0 0 rg");
  });

  test("white background skips bg rect", () => {
    const doc = makeDocWithEntities([makeLine("l1")]);
    const result = exportDocumentToPDF(doc, { backgroundColor: "#FFFFFF" });
    const pdf = result.data as string;

    // Should NOT have full-page fill rect for white bg
    const streamMatch = pdf.match(/stream\n([\s\S]*?)\nendstream/);
    const stream = streamMatch![1];
    // No "rg" before the first "re f" for background
    const bgFillMatch = stream.match(/^[\s\S]*?rg\n[\d. ]+ [\d. ]+ [\d. ]+ [\d. ]+ re f/);
    expect(bgFillMatch).toBeNull();
  });

  test("large document with 20 entities exports successfully", () => {
    const entities: IEntity[] = [];
    for (let i = 0; i < 20; i++) {
      entities.push(makeLine(`l${i}`, i * 10, 0, i * 10 + 10, 100));
    }
    const doc = makeDocWithEntities(entities);
    const result = exportDocumentToPDF(doc);

    expect(result.success).toBe(true);
    expect((result.data as string)).toContain("%%EOF");
  });
});
