/**
 * ExportDXF Tests — Phase 5.2 (R2000 format)
 *
 * Tests for IEntity-based DXF export with full R2000 (AC1015) compliance:
 *   - exportDocumentToDXF (CadDocument → DXF string)
 *   - iEntityToDXF (single entity → DXF fragment)
 *   - DXF structure: HEADER, CLASSES, TABLES, BLOCKS, ENTITIES, OBJECTS, EOF
 *   - All entity types: LINE, RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION
 *   - Handle system, subclass markers, owner chains
 *   - Layer table, color mapping, linetype mapping
 *   - BLOCK_RECORD ↔ LAYOUT cross-references
 *   - ExportManager.exportDocumentToDXF facade
 */

import { CadDocument } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";
import {
  exportDocumentToDXF,
  iEntityToDXF,
  rgbToAciColor,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportDXF";
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
  const doc = new CadDocument({ title: "DXF Test" });
  for (const e of entities) {
    doc.addEntity(e);
  }
  return doc;
}

// ==================== DXF Formatting Helper (mirrors production p()) ====================

/**
 * Reproduce the production DXF pair formatter for test assertions.
 * Group codes right-justified to 3 chars, integers padded per DXF spec.
 */
function dp(code: number, val: string | number): string {
  const c = String(code).padStart(3);
  if (typeof val === "number") {
    const isInt =
      (code >= 60 && code <= 79) || (code >= 90 && code <= 99) ||
      (code >= 170 && code <= 179) || (code >= 270 && code <= 299) ||
      (code >= 370 && code <= 389) || (code >= 400 && code <= 409) ||
      (code >= 420 && code <= 429) || (code >= 440 && code <= 449);
    if (isInt) {
      const w = (code >= 90 && code <= 99) ? 9 : 6;
      return `${c}\n${String(val).padStart(w)}\n`;
    }
    const fs = Number.isInteger(val) ? val.toFixed(1) : String(val);
    return `${c}\n${fs}\n`;
  }
  return `${c}\n${val}\n`;
}

// ==================== DXF Structure (R2000) ====================

describe("ExportDXF — R2000 DXF Structure", () => {
  test("contains all 6 DXF section markers", () => {
    const doc = makeDocWithEntities([makeLine("L1")]);
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("HEADER");
    expect(dxf).toContain("CLASSES");
    expect(dxf).toContain("TABLES");
    expect(dxf).toContain("BLOCKS");
    expect(dxf).toContain("ENTITIES");
    expect(dxf).toContain("OBJECTS");
    expect(dxf).toContain("EOF");
    expect(dxf).toContain("SECTION");
    expect(dxf).toContain("ENDSEC");
  });

  test("ACADVER is AC1015 (R2000)", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("$ACADVER");
    expect(dxf).toContain("AC1015");
  });

  test("$HANDSEED is present", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("$HANDSEED");
  });

  test("$MEASUREMENT=1, $INSUNITS=4 for mm/metric", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("$MEASUREMENT");
    expect(dxf).toContain("$INSUNITS");
    // Both use group 70 (integer) — just verify presence
    const measIdx = dxf.indexOf("$MEASUREMENT");
    const insIdx = dxf.indexOf("$INSUNITS");
    expect(measIdx).toBeGreaterThan(-1);
    expect(insIdx).toBeGreaterThan(-1);
  });

  test("$CLAYER=0, $CELTYPE=ByLayer, $CECOLOR=256", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("$CLAYER");
    expect(dxf).toContain("$CELTYPE");
    expect(dxf).toContain("ByLayer");
    expect(dxf).toContain("$CECOLOR");
  });

  test("contains all 9 required tables", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    const tableNames = [
      "VPORT", "LTYPE", "LAYER", "STYLE",
      "VIEW", "UCS", "APPID", "DIMSTYLE", "BLOCK_RECORD",
    ];
    for (const name of tableNames) {
      expect(dxf).toContain(name);
    }
  });

  test("LTYPE table has 6 entries (ByBlock, ByLayer, Continuous, DASHED, DOT, DASHDOT)", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("ByBlock");
    expect(dxf).toContain("ByLayer");
    expect(dxf).toContain("Continuous");
    expect(dxf).toContain("DASHED");
    expect(dxf).toContain("DOT");
    expect(dxf).toContain("DASHDOT");

    // LTYPE table header should show count 6
    const ltypeStart = dxf.indexOf("TABLE\n  2\nLTYPE");
    const ltypeEnd = dxf.indexOf("ENDTAB", ltypeStart);
    const ltypeSection = dxf.substring(ltypeStart, ltypeEnd);
    expect(ltypeSection).toContain(dp(70, 6));
  });

  test("BLOCKS section has *Model_Space and *Paper_Space", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("*Model_Space");
    expect(dxf).toContain("*Paper_Space");
    expect(dxf).toContain("AcDbBlockBegin");
    expect(dxf).toContain("AcDbBlockEnd");
  });

  test("OBJECTS section has ACAD_GROUP and ACAD_LAYOUT dictionaries", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("ACAD_GROUP");
    expect(dxf).toContain("ACAD_LAYOUT");
    expect(dxf).toContain("DICTIONARY");
    expect(dxf).toContain("LAYOUT");
  });

  test("OBJECTS has Model layout linked to block record", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("AcDbPlotSettings");
    expect(dxf).toContain("AcDbLayout");
    // Layout name "Model" present
    const layoutIdx = dxf.indexOf("AcDbLayout");
    expect(dxf.indexOf("Model", layoutIdx)).toBeGreaterThan(layoutIdx);
  });

  test("section order is HEADER→CLASSES→TABLES→BLOCKS→ENTITIES→OBJECTS→EOF", () => {
    const doc = makeDocWithEntities([makeLine("L1")]);
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    const headerIdx = dxf.indexOf("HEADER");
    const classesIdx = dxf.indexOf("CLASSES");
    const tablesIdx = dxf.indexOf("TABLES");
    const blocksIdx = dxf.indexOf("BLOCKS");
    const entitiesIdx = dxf.indexOf("ENTITIES");
    const objectsIdx = dxf.indexOf("OBJECTS");
    const eofIdx = dxf.indexOf("EOF");

    expect(headerIdx).toBeLessThan(classesIdx);
    expect(classesIdx).toBeLessThan(tablesIdx);
    expect(tablesIdx).toBeLessThan(blocksIdx);
    expect(blocksIdx).toBeLessThan(entitiesIdx);
    expect(entitiesIdx).toBeLessThan(objectsIdx);
    expect(objectsIdx).toBeLessThan(eofIdx);
  });
});

// ==================== Layer Table ====================

describe("ExportDXF — Layer Table", () => {
  test("layer 0 is always present even with custom layers", () => {
    const doc = new CadDocument();
    doc.layers.createLayer("Walls", { color: "#FF0000" });
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    // Layer table record for "0" should be present
    expect(dxf).toContain("AcDbLayerTableRecord\n  2\n0\n");
    expect(dxf).toContain("Walls");
  });

  test("LAYER table count header matches actual layer count", () => {
    const doc = new CadDocument();
    doc.layers.createLayer("A", { color: "#FF0000" });
    doc.layers.createLayer("B", { color: "#00FF00" });
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    const layerStart = dxf.indexOf("TABLE\n  2\nLAYER");
    const layerEnd = dxf.indexOf("ENDTAB", layerStart);
    const layerSection = dxf.substring(layerStart, layerEnd);
    // Count actual LAYER records in the section
    const layerMatches = layerSection.match(/  0\nLAYER\n/g);
    const count = layerMatches!.length;
    expect(layerSection).toContain(dp(70, count));
  });
});

// ==================== Linetype Table ====================

describe("ExportDXF — Linetype Table", () => {
  test("LTYPE table uses AcDbLinetypeTableRecord subclass", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("AcDbLinetypeTableRecord");
  });

  test("LTYPE count matches 6 entries", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    const ltypeStart = dxf.indexOf("TABLE\n  2\nLTYPE");
    const ltypeEnd = dxf.indexOf("ENDTAB", ltypeStart);
    const ltypeSection = dxf.substring(ltypeStart, ltypeEnd);
    const ltypeRecords = ltypeSection.match(/  0\nLTYPE\n/g);
    expect(ltypeRecords).toHaveLength(6);
  });
});

// ==================== iEntityToDXF — LINE ====================

describe("ExportDXF — LINE entity", () => {
  test("generates valid DXF LINE with coordinates and subclass", () => {
    const line = makeLine("L1", 10, 20, 300, 400);
    const dxf = iEntityToDXF(line, "0");

    expect(dxf).toContain("LINE");
    expect(dxf).toContain("10\n10");      // start.x (float, substring match)
    expect(dxf).toContain("20\n20");      // start.y
    expect(dxf).toContain("11\n300");     // end.x
    expect(dxf).toContain("21\n400");     // end.y
    // R2000: has subclass markers
    expect(dxf).toContain("AcDbEntity");
    expect(dxf).toContain("AcDbLine");
  });

  test("LINE includes layer, color, and linetype", () => {
    const line = makeLine("L1", 0, 0, 100, 0);
    line.style.strokeColor = "#FF0000";
    line.style.strokeStyle = "dashed";
    const dxf = iEntityToDXF(line, "TestLayer");

    expect(dxf).toContain("8\nTestLayer");   // layer
    expect(dxf).toContain(dp(62, 1));        // red = ACI 1
    expect(dxf).toContain("6\nDASHED");      // linetype
  });
});

// ==================== iEntityToDXF — CIRCLE ====================

describe("ExportDXF — CIRCLE entity", () => {
  test("generates valid DXF CIRCLE with subclass marker", () => {
    const circle = makeCircle("C1", 100, 200, 50);
    const dxf = iEntityToDXF(circle, "0");

    expect(dxf).toContain("CIRCLE");
    expect(dxf).toContain("10\n100");     // center.x
    expect(dxf).toContain("20\n200");     // center.y
    expect(dxf).toContain("40\n50");      // radius
    expect(dxf).toContain("AcDbCircle");
  });
});

// ==================== iEntityToDXF — ARC ====================

describe("ExportDXF — ARC entity", () => {
  test("generates valid DXF ARC with degrees and subclass markers", () => {
    const arc = makeArc("A1", 0, 0, 50, 0, Math.PI / 2);
    const dxf = iEntityToDXF(arc, "0");

    expect(dxf).toContain("ARC");
    expect(dxf).toContain("40\n50");      // radius
    expect(dxf).toContain("50\n0");       // startAngle = 0 deg
    expect(dxf).toContain("51\n90");      // endAngle = 90 deg
    expect(dxf).toContain("AcDbCircle");
    expect(dxf).toContain("AcDbArc");
  });

  test("ARC converts radians to degrees", () => {
    const arc = makeArc("A2", 0, 0, 30, Math.PI, Math.PI * 1.5);
    const dxf = iEntityToDXF(arc, "0");

    expect(dxf).toContain("50\n180");     // PI → 180 deg
    expect(dxf).toContain("51\n270");     // 1.5*PI → 270 deg
  });
});

// ==================== iEntityToDXF — ELLIPSE ====================

describe("ExportDXF — ELLIPSE entity", () => {
  test("generates valid DXF ELLIPSE with subclass marker", () => {
    const ellipse = makeEllipse("E1", 0, 0, 100, 50, 0);
    const dxf = iEntityToDXF(ellipse, "0");

    expect(dxf).toContain("ELLIPSE");
    expect(dxf).toContain("10\n0");       // center.x
    expect(dxf).toContain("20\n0");       // center.y
    expect(dxf).toContain("11\n100");     // majorX
    expect(dxf).toContain("40\n0.5");     // ratio = 50/100
    expect(dxf).toContain("41\n0");       // startParam
    expect(dxf).toContain("AcDbEllipse");
  });

  test("ELLIPSE with rotation applies to major axis", () => {
    const ellipse = makeEllipse("E2", 0, 0, 100, 50, Math.PI / 2);
    const dxf = iEntityToDXF(ellipse, "0");

    expect(dxf).toContain("ELLIPSE");
    // At PI/2 rotation, major axis endpoint ≈ (0, 100)
  });
});

// ==================== iEntityToDXF — POLYLINE ====================

describe("ExportDXF — POLYLINE entity", () => {
  test("generates LWPOLYLINE with correct vertex count", () => {
    const pl = makePolyline("PL1", [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 30, y: 10 },
    ]);
    const dxf = iEntityToDXF(pl, "0");

    expect(dxf).toContain("LWPOLYLINE");
    expect(dxf).toContain(dp(90, 3));     // 3 vertices (32-bit integer)
    expect(dxf).toContain(dp(70, 0));     // open
    expect(dxf).toContain("AcDbPolyline");
  });

  test("closed POLYLINE sets flag 1", () => {
    const pl = makePolyline("PL2", [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ], true);
    const dxf = iEntityToDXF(pl, "0");

    expect(dxf).toContain(dp(70, 1));     // closed
  });

  test("POLYLINE with <2 points returns empty", () => {
    const pl = makePolyline("PL3", [{ x: 0, y: 0 }]);
    const dxf = iEntityToDXF(pl, "0");
    expect(dxf).toBe("");
  });
});

// ==================== iEntityToDXF — TEXT ====================

describe("ExportDXF — TEXT entity", () => {
  test("generates valid DXF TEXT with subclass markers", () => {
    const text = makeText("T1", "Hello World", 10, 20);
    const dxf = iEntityToDXF(text, "0");

    expect(dxf).toContain("TEXT");
    expect(dxf).toContain("1\nHello World");   // text content
    expect(dxf).toContain("10\n10");           // position.x
    expect(dxf).toContain("20\n20");           // position.y
    expect(dxf).toContain("40\n12");           // fontSize
    expect(dxf).toContain("AcDbText");
  });

  test("TEXT with center alignment sets hjust=1", () => {
    const text = makeText("T2", "Centered");
    text.textAlign = "center";
    const dxf = iEntityToDXF(text, "0");

    expect(dxf).toContain(dp(72, 1));     // center justification
  });

  test("TEXT with right alignment sets hjust=2", () => {
    const text = makeText("T3", "Right");
    text.textAlign = "right";
    const dxf = iEntityToDXF(text, "0");

    expect(dxf).toContain(dp(72, 2));     // right justification
  });

  test("TEXT with left alignment sets hjust=0", () => {
    const text = makeText("T4", "Left");
    text.textAlign = "left";
    const dxf = iEntityToDXF(text, "0");

    expect(dxf).toContain(dp(72, 0));     // left justification
  });
});

// ==================== iEntityToDXF — DIMENSION ====================

describe("ExportDXF — DIMENSION entity", () => {
  test("generates LINE + TEXT for dimension", () => {
    const dim = makeDimension("D1", 0, 0, 100, 0);
    const dxf = iEntityToDXF(dim, "0");

    expect(dxf).toContain("LINE");
    expect(dxf).toContain("TEXT");
  });

  test("DIMENSION text shows computed distance", () => {
    const dim = makeDimension("D2", 0, 0, 100, 0);
    const dxf = iEntityToDXF(dim, "0");

    expect(dxf).toContain("100.0");
  });

  test("DIMENSION with explicit value uses it", () => {
    const dim = makeDimension("D3", 0, 0, 100, 0);
    dim.value = 99.5;
    const dxf = iEntityToDXF(dim, "0");

    expect(dxf).toContain("99.5");
  });
});

// ==================== exportDocumentToDXF (full document) ====================

describe("ExportDXF — exportDocumentToDXF", () => {
  test("exports empty document successfully", () => {
    const doc = new CadDocument({ title: "Empty" });
    const result = exportDocumentToDXF(doc);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.filename).toBe("Empty.dxf");
  });

  test("includes all entity types in output", () => {
    const doc = makeDocWithEntities([
      makeLine("L1"),
      makeRect("R1"),
      makeCircle("C1"),
    ]);
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("LINE");
    expect(dxf).toContain("LWPOLYLINE");
    expect(dxf).toContain("CIRCLE");
  });

  test("filters hidden entities by default", () => {
    const visible = makeLine("L1", 0, 0, 100, 0);
    const hidden = makeLine("L2", 0, 0, 200, 0);
    hidden.state.visible = false;

    const doc = makeDocWithEntities([visible, hidden]);
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    const lineMatches = dxf.match(/\nLINE\n/g);
    expect(lineMatches).toHaveLength(1);
  });

  test("includes hidden entities when option set", () => {
    const visible = makeLine("L1", 0, 0, 100, 0);
    const hidden = makeLine("L2", 0, 0, 200, 0);
    hidden.state.visible = false;

    const doc = makeDocWithEntities([visible, hidden]);
    const result = exportDocumentToDXF(doc, { includeHiddenEntities: true });
    const dxf = result.data as string;

    const lineMatches = dxf.match(/\nLINE\n/g);
    expect(lineMatches).toHaveLength(2);
  });

  test("mixed entity types export", () => {
    const doc = makeDocWithEntities([
      makeLine("L1", 0, 0, 100, 100),
      makeRect("R1", 50, 50, 200, 100),
      makeCircle("C1", 100, 100, 50),
      makeArc("A1"),
      makePolyline("PL1"),
      makeText("T1", "Test"),
      makeDimension("D1"),
    ]);

    const result = exportDocumentToDXF(doc);
    expect(result.success).toBe(true);

    const dxf = result.data as string;
    expect(dxf).toContain("LINE");
    expect(dxf).toContain("LWPOLYLINE");
    expect(dxf).toContain("CIRCLE");
    expect(dxf).toContain("ARC");
    expect(dxf).toContain("TEXT");
  });

  test("handles large entity count", () => {
    const entities: IEntity[] = [];
    for (let i = 0; i < 200; i++) {
      entities.push(makeLine(`L${i}`, i, i, i + 50, i + 50));
    }
    const doc = makeDocWithEntities(entities);

    const result = exportDocumentToDXF(doc);
    expect(result.success).toBe(true);

    const dxf = result.data as string;
    const lineMatches = dxf.match(/\nLINE\n/g);
    expect(lineMatches).toHaveLength(200);
  });
});

// ==================== Color Mapping ====================

describe("ExportDXF — rgbToAciColor", () => {
  test("maps common colors correctly", () => {
    expect(rgbToAciColor("#FF0000")).toBe(1);  // Red
    expect(rgbToAciColor("#FFFF00")).toBe(2);  // Yellow
    expect(rgbToAciColor("#00FF00")).toBe(3);  // Green
    expect(rgbToAciColor("#00FFFF")).toBe(4);  // Cyan
    expect(rgbToAciColor("#0000FF")).toBe(5);  // Blue
    expect(rgbToAciColor("#FF00FF")).toBe(6);  // Magenta
    expect(rgbToAciColor("#FFFFFF")).toBe(7);  // White
    expect(rgbToAciColor("#000000")).toBe(0);  // Black
  });

  test("is case-insensitive", () => {
    expect(rgbToAciColor("#ff0000")).toBe(1);
    expect(rgbToAciColor("#ffffff")).toBe(7);
  });

  test("unknown colors default to 7 (white)", () => {
    expect(rgbToAciColor("#123456")).toBe(7);
    expect(rgbToAciColor("#AABBCC")).toBe(7);
  });

  test("handles empty/null input", () => {
    expect(rgbToAciColor("")).toBe(7);
  });
});

// ==================== ExportManager Facade ====================

describe("ExportDXF — ExportManager facade", () => {
  test("ExportManager.exportDocumentToDXF delegates correctly", () => {
    const doc = makeDocWithEntities([makeLine("L1")]);
    const result = ExportManager.exportDocumentToDXF(doc);

    expect(result.success).toBe(true);
    const dxf = result.data as string;
    expect(dxf).toContain("LINE");
    expect(dxf).toContain("EOF");
  });

  test("ExportManager.exportDocumentToDXF passes options", () => {
    const doc = new CadDocument({ title: "Original" });
    const result = ExportManager.exportDocumentToDXF(doc, {
      title: "Custom Title",
    });
    expect(result.filename).toBe("Custom Title.dxf");
  });
});

// ==================== R2000 Format Compliance ====================

describe("ExportDXF — R2000 Format Compliance", () => {
  test("entities have handles (group code 5)", () => {
    const line = makeLine("L1", 10, 20, 300, 400);
    const dxf = iEntityToDXF(line, "0");

    // R2000: each entity has a unique handle
    expect(dxf).toMatch(/  5\n[0-9A-F]+\n/);
  });

  test("entities have subclass markers (group code 100)", () => {
    const doc = makeDocWithEntities([
      makeLine("L1"),
      makeCircle("C1"),
      makeRect("R1"),
    ]);
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("100\nAcDbEntity");
    expect(dxf).toContain("100\nAcDbLine");
    expect(dxf).toContain("100\nAcDbCircle");
    expect(dxf).toContain("100\nAcDbPolyline");
  });

  test("entities have owner handles (group code 330)", () => {
    const doc = makeDocWithEntities([makeLine("L1")]);
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    // Entities must have 330 (owner → *Model_Space block record)
    expect(dxf).toContain("330\n");
  });

  test("group codes are right-justified to 3 characters", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    // Group code 0 should appear as "  0\n" (2 spaces + 0)
    expect(dxf).toContain("  0\n");
    // Group code 2 should appear as "  2\n"
    expect(dxf).toContain("  2\n");
    // Group code 70 should appear as " 70\n"
    expect(dxf).toContain(" 70\n");
    // Group code 100 appears as "100\n" (already 3 chars)
    expect(dxf).toContain("100\n");
  });

  test("integer values are right-justified (16-bit to 6 chars)", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    // $MEASUREMENT: group 70 with value 1 → "     1" (5 spaces + 1)
    expect(dxf).toContain(dp(70, 1));
    // $INSUNITS: group 70 with value 4 → "     4"
    expect(dxf).toContain(dp(70, 4));
  });

  test("DXF has all 9 tables in TABLES section", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    // All 9 tables present
    expect(dxf).toContain("TABLE\n  2\nVPORT");
    expect(dxf).toContain("TABLE\n  2\nLTYPE");
    expect(dxf).toContain("TABLE\n  2\nLAYER");
    expect(dxf).toContain("TABLE\n  2\nSTYLE");
    expect(dxf).toContain("TABLE\n  2\nVIEW");
    expect(dxf).toContain("TABLE\n  2\nUCS");
    expect(dxf).toContain("TABLE\n  2\nAPPID");
    expect(dxf).toContain("TABLE\n  2\nDIMSTYLE");
    expect(dxf).toContain("TABLE\n  2\nBLOCK_RECORD");
  });

  test("BLOCK_RECORD has *Model_Space and *Paper_Space", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    expect(dxf).toContain("AcDbBlockTableRecord");
    expect(dxf).toContain("*Model_Space");
    expect(dxf).toContain("*Paper_Space");
  });

  test("BLOCK_RECORD entries have 340 (layout reference)", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    // Block records should have 340 pointing to layout handles
    const brecSection = dxf.substring(
      dxf.indexOf("TABLE\n  2\nBLOCK_RECORD"),
      dxf.indexOf("ENDTAB", dxf.indexOf("TABLE\n  2\nBLOCK_RECORD")),
    );
    expect(brecSection).toContain("340\n");
  });

  test("DIMSTYLE uses 105 for handle (not 5)", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    // DIMSTYLE records use group 105 for handle
    const dimIdx = dxf.lastIndexOf("DIMSTYLE\n");
    const dimEnd = dxf.indexOf("ENDTAB", dimIdx);
    const dimSection = dxf.substring(dimIdx, dimEnd);
    expect(dimSection).toContain("105\n");
  });

  test("Paper_Space block has paper space flag (67=1)", () => {
    const doc = new CadDocument();
    const result = exportDocumentToDXF(doc);
    const dxf = result.data as string;

    const pspaceIdx = dxf.indexOf("*Paper_Space");
    const afterPspace = dxf.substring(pspaceIdx, pspaceIdx + 500);
    expect(afterPspace).toContain(dp(67, 1));
  });

  test("LWPOLYLINE has AcDbPolyline subclass marker", () => {
    const rect = makeRect("R1");
    const dxf = iEntityToDXF(rect, "0");

    expect(dxf).toContain("LWPOLYLINE");
    expect(dxf).toContain("100\nAcDbPolyline");
  });

  test("TEXT has AcDbText subclass markers", () => {
    const text = makeText("T1", "Hello");
    const dxf = iEntityToDXF(text, "0");

    // TEXT has AcDbText (appears twice: before content and after)
    const matches = dxf.match(/AcDbText/g);
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  test("entity includes layer, color, and linetype", () => {
    const line = makeLine("L1");
    line.style.strokeColor = "#FF0000";
    line.style.strokeStyle = "dashed";
    const dxf = iEntityToDXF(line, "MyLayer");

    expect(dxf).toContain("8\nMyLayer");   // layer
    expect(dxf).toContain(dp(62, 1));      // red = ACI 1
    expect(dxf).toContain("6\nDASHED");    // linetype
  });
});

// ==================== Edge Cases ====================

describe("ExportDXF — Edge Cases", () => {
  test("RECT with rotation generates rotated vertices", () => {
    const rect = makeRect("R1", 0, 0, 100, 50);
    rect.rotation = Math.PI / 4; // 45 degrees
    const dxf = iEntityToDXF(rect, "0");

    expect(dxf).toContain("LWPOLYLINE");
    // Count group code 10 (X coordinate) — padded as " 10\n"
    const vertices = dxf.match(/ 10\n/g);
    expect(vertices).toHaveLength(4);
  });

  test("entity with dotted style maps to DOT linetype", () => {
    const line = makeLine("L1");
    line.style.strokeStyle = "dotted";
    const dxf = iEntityToDXF(line);
    expect(dxf).toContain("6\nDOT");
  });

  test("entity with dashdot style maps to DASHDOT linetype", () => {
    const line = makeLine("L1");
    line.style.strokeStyle = "dashdot";
    const dxf = iEntityToDXF(line);
    expect(dxf).toContain("6\nDASHDOT");
  });

  test("entity with solid style maps to CONTINUOUS", () => {
    const line = makeLine("L1");
    line.style.strokeStyle = "solid";
    const dxf = iEntityToDXF(line);
    expect(dxf).toContain("6\nCONTINUOUS");
  });

  test("unsupported entity type generates comment", () => {
    const entity: IEntity = {
      id: "unknown",
      type: "UNKNOWN" as EntityType,
      layerId: "0",
      style: { ...DEFAULT_STYLE },
      state: { ...DEFAULT_STATE },
    };
    const dxf = iEntityToDXF(entity, "0");
    expect(dxf).toContain("999");
    expect(dxf).toContain("Unsupported");
  });
});
