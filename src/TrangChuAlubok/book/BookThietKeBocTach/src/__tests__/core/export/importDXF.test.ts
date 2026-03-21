/**
 * ImportDXF Tests — PHASE NEXT: DXF Import
 *
 * Tests for DXF file parsing → IEntity[] conversion:
 *   - tokenizeDXF: DXF text → code/value pairs
 *   - splitSections: pairs → HEADER, TABLES, ENTITIES sections
 *   - parseLayers: TABLES → DXFLayerInfo[]
 *   - importFromDXF: full pipeline → DXFImportResult
 *   - Entity types: LINE, CIRCLE, ARC, ELLIPSE, LWPOLYLINE, TEXT, MTEXT
 *   - Layer mapping, color mapping (ACI → hex), scale factor
 *   - RECT autodetection from closed 4-vertex LWPOLYLINE
 *   - Edge cases: empty file, missing sections, hidden layers
 */

import {
  tokenizeDXF,
  splitSections,
  parseLayers,
  importFromDXF,
  aciToHex,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ImportDXF";
import {
  EntityType,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Entity.types";
import type {
  ILineEntity,
  ICircleEntity,
  IArcEntity,
  IEllipseEntity,
  IRectEntity,
  IPolylineEntity,
  ITextEntity,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Entity.types";

// ==================== Helpers ====================

/** Build a minimal DXF string with given ENTITIES content */
function buildDXF(entitiesContent: string, tablesContent = "", headerContent = ""): string {
  let dxf = "";
  // HEADER
  dxf += "  0\nSECTION\n  2\nHEADER\n";
  dxf += headerContent;
  dxf += "  0\nENDSEC\n";
  // TABLES
  if (tablesContent) {
    dxf += "  0\nSECTION\n  2\nTABLES\n";
    dxf += tablesContent;
    dxf += "  0\nENDSEC\n";
  }
  // ENTITIES
  dxf += "  0\nSECTION\n  2\nENTITIES\n";
  dxf += entitiesContent;
  dxf += "  0\nENDSEC\n";
  dxf += "  0\nEOF\n";
  return dxf;
}

/** Build a DXF LINE entity string */
function dxfLine(x1: number, y1: number, x2: number, y2: number, layer = "0", aci = 7): string {
  return `  0\nLINE\n  8\n${layer}\n 62\n${aci}\n 10\n${x1}\n 20\n${y1}\n 11\n${x2}\n 21\n${y2}\n`;
}

/** Build a DXF CIRCLE entity string */
function dxfCircle(cx: number, cy: number, r: number, layer = "0"): string {
  return `  0\nCIRCLE\n  8\n${layer}\n 10\n${cx}\n 20\n${cy}\n 40\n${r}\n`;
}

/** Build a DXF ARC entity string */
function dxfArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  return `  0\nARC\n  8\n0\n 10\n${cx}\n 20\n${cy}\n 40\n${r}\n 50\n${startDeg}\n 51\n${endDeg}\n`;
}

/** Build a LAYER table entry */
function dxfLayerEntry(name: string, aci = 7, flags = 0): string {
  return `  0\nLAYER\n  2\n${name}\n 62\n${aci}\n 70\n${flags}\n`;
}

/** Build a TABLES section with LAYER table */
function dxfLayerTable(...entries: string[]): string {
  return `  0\nTABLE\n  2\nLAYER\n${entries.join("")}  0\nENDTAB\n`;
}

// ==================== tokenizeDXF ====================

describe("ImportDXF — tokenizeDXF", () => {
  it("parses code/value pairs from DXF text", () => {
    const pairs = tokenizeDXF("  0\nLINE\n 10\n100.5\n 20\n200.0\n");
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toEqual({ code: 0, value: "LINE" });
    expect(pairs[1]).toEqual({ code: 10, value: "100.5" });
    expect(pairs[2]).toEqual({ code: 20, value: "200.0" });
  });

  it("handles CRLF line endings", () => {
    const pairs = tokenizeDXF("  0\r\nLINE\r\n 10\r\n50\r\n");
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toEqual({ code: 0, value: "LINE" });
  });

  it("returns empty array for empty input", () => {
    expect(tokenizeDXF("")).toHaveLength(0);
  });

  it("skips invalid group codes", () => {
    const pairs = tokenizeDXF("abc\nvalue\n  0\nLINE\n");
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual({ code: 0, value: "LINE" });
  });
});

// ==================== splitSections ====================

describe("ImportDXF — splitSections", () => {
  it("splits HEADER, ENTITIES sections", () => {
    const dxf = buildDXF(dxfLine(0, 0, 100, 100));
    const pairs = tokenizeDXF(dxf);
    const sections = splitSections(pairs);
    const names = sections.map(s => s.name);
    expect(names).toContain("HEADER");
    expect(names).toContain("ENTITIES");
  });

  it("stops at EOF", () => {
    const dxf = "  0\nSECTION\n  2\nHEADER\n  0\nENDSEC\n  0\nEOF\n  0\nSECTION\n  2\nGHOST\n  0\nENDSEC\n";
    const pairs = tokenizeDXF(dxf);
    const sections = splitSections(pairs);
    expect(sections).toHaveLength(1);
    expect(sections[0].name).toBe("HEADER");
  });
});

// ==================== parseLayers ====================

describe("ImportDXF — parseLayers", () => {
  it("parses layer names and colors", () => {
    const tables = dxfLayerTable(
      dxfLayerEntry("0", 7),
      dxfLayerEntry("Walls", 1),
      dxfLayerEntry("Doors", 3),
    );
    const dxf = buildDXF("", tables);
    const pairs = tokenizeDXF(dxf);
    const sections = splitSections(pairs);
    const tablesSection = sections.find(s => s.name === "TABLES")!;
    const layers = parseLayers(tablesSection);

    expect(layers).toHaveLength(3);
    expect(layers[0].name).toBe("0");
    expect(layers[0].color).toBe("#FFFFFF");
    expect(layers[1].name).toBe("Walls");
    expect(layers[1].color).toBe("#FF0000"); // ACI 1
    expect(layers[2].name).toBe("Doors");
    expect(layers[2].color).toBe("#00FF00"); // ACI 3
  });

  it("detects frozen layers (flag & 1)", () => {
    const tables = dxfLayerTable(dxfLayerEntry("Frozen", 7, 1));
    const dxf = buildDXF("", tables);
    const pairs = tokenizeDXF(dxf);
    const sections = splitSections(pairs);
    const layers = parseLayers(sections.find(s => s.name === "TABLES")!);

    expect(layers[0].frozen).toBe(true);
  });

  it("detects locked layers (flag & 4)", () => {
    const tables = dxfLayerTable(dxfLayerEntry("Locked", 7, 4));
    const dxf = buildDXF("", tables);
    const pairs = tokenizeDXF(dxf);
    const sections = splitSections(pairs);
    const layers = parseLayers(sections.find(s => s.name === "TABLES")!);

    expect(layers[0].locked).toBe(true);
  });

  it("detects invisible layers (negative ACI)", () => {
    const tables = dxfLayerTable("  0\nLAYER\n  2\nHidden\n 62\n-7\n 70\n0\n");
    const dxf = buildDXF("", tables);
    const pairs = tokenizeDXF(dxf);
    const sections = splitSections(pairs);
    const layers = parseLayers(sections.find(s => s.name === "TABLES")!);

    expect(layers[0].visible).toBe(false);
    expect(layers[0].color).toBe("#FFFFFF"); // abs(7) → white
  });
});

// ==================== aciToHex ====================

describe("ImportDXF — aciToHex", () => {
  it("maps standard ACI colors", () => {
    expect(aciToHex(0)).toBe("#000000");  // Black
    expect(aciToHex(1)).toBe("#FF0000");  // Red
    expect(aciToHex(2)).toBe("#FFFF00");  // Yellow
    expect(aciToHex(3)).toBe("#00FF00");  // Green
    expect(aciToHex(4)).toBe("#00FFFF");  // Cyan
    expect(aciToHex(5)).toBe("#0000FF");  // Blue
    expect(aciToHex(6)).toBe("#FF00FF");  // Magenta
    expect(aciToHex(7)).toBe("#FFFFFF");  // White
  });

  it("returns white for unknown ACI", () => {
    expect(aciToHex(99)).toBe("#FFFFFF");
    expect(aciToHex(256)).toBe("#FFFFFF");
  });
});

// ==================== importFromDXF — LINE ====================

describe("ImportDXF — LINE entities", () => {
  it("parses a single LINE entity", () => {
    const dxf = buildDXF(dxfLine(10, 20, 300, 400));
    const result = importFromDXF(dxf);

    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(1);
    const line = result.entities[0] as ILineEntity;
    expect(line.type).toBe(EntityType.LINE);
    expect(line.start).toEqual({ x: 10, y: 20 });
    expect(line.end).toEqual({ x: 300, y: 400 });
  });

  it("assigns layer from DXF layer name", () => {
    const dxf = buildDXF(dxfLine(0, 0, 1, 1, "Walls"));
    const result = importFromDXF(dxf);

    expect(result.entities[0].layerId).toBe("Walls");
  });

  it("maps ACI color to hex stroke", () => {
    const dxf = buildDXF(dxfLine(0, 0, 1, 1, "0", 1));
    const result = importFromDXF(dxf);

    expect(result.entities[0].style.strokeColor).toBe("#FF0000");
  });

  it("parses multiple LINE entities", () => {
    const dxf = buildDXF(
      dxfLine(0, 0, 100, 0) + dxfLine(0, 0, 0, 100) + dxfLine(100, 0, 100, 100)
    );
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(3);
    expect(result.stats.byType["LINE"]).toBe(3);
  });
});

// ==================== importFromDXF — CIRCLE ====================

describe("ImportDXF — CIRCLE entities", () => {
  it("parses a CIRCLE entity", () => {
    const dxf = buildDXF(dxfCircle(50, 60, 25));
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(1);
    const circle = result.entities[0] as ICircleEntity;
    expect(circle.type).toBe(EntityType.CIRCLE);
    expect(circle.center).toEqual({ x: 50, y: 60 });
    expect(circle.radius).toBe(25);
  });

  it("skips circle with zero radius", () => {
    const dxf = buildDXF(dxfCircle(50, 60, 0));
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(0);
    expect(result.stats.skippedEntities).toBe(1);
  });
});

// ==================== importFromDXF — ARC ====================

describe("ImportDXF — ARC entities", () => {
  it("parses an ARC entity with degree→radian conversion", () => {
    const dxf = buildDXF(dxfArc(100, 200, 50, 0, 90));
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(1);
    const arc = result.entities[0] as IArcEntity;
    expect(arc.type).toBe(EntityType.ARC);
    expect(arc.center).toEqual({ x: 100, y: 200 });
    expect(arc.radius).toBe(50);
    expect(arc.startAngle).toBeCloseTo(0, 5);
    expect(arc.endAngle).toBeCloseTo(Math.PI / 2, 5);
  });

  it("handles 180° arc", () => {
    const dxf = buildDXF(dxfArc(0, 0, 10, 45, 225));
    const result = importFromDXF(dxf);

    const arc = result.entities[0] as IArcEntity;
    expect(arc.startAngle).toBeCloseTo(Math.PI / 4, 5);
    expect(arc.endAngle).toBeCloseTo(225 * Math.PI / 180, 5);
  });
});

// ==================== importFromDXF — ELLIPSE ====================

describe("ImportDXF — ELLIPSE entities", () => {
  it("parses an ELLIPSE entity", () => {
    const dxf = buildDXF(
      "  0\nELLIPSE\n  8\n0\n 10\n100\n 20\n200\n 11\n50\n 21\n0\n 40\n0.5\n 41\n0.0\n 42\n6.283185\n"
    );
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(1);
    const ell = result.entities[0] as IEllipseEntity;
    expect(ell.type).toBe(EntityType.ELLIPSE);
    expect(ell.center).toEqual({ x: 100, y: 200 });
    expect(ell.radiusX).toBe(50); // sqrt(50²+0²)
    expect(ell.radiusY).toBe(25); // 50 * 0.5
    expect(ell.rotation).toBeCloseTo(0, 5); // atan2(0, 50)
  });

  it("handles rotated ellipse", () => {
    const dxf = buildDXF(
      "  0\nELLIPSE\n  8\n0\n 10\n0\n 20\n0\n 11\n0\n 21\n80\n 40\n0.5\n"
    );
    const result = importFromDXF(dxf);

    const ell = result.entities[0] as IEllipseEntity;
    expect(ell.rotation).toBeCloseTo(Math.PI / 2, 5); // vertical major axis
    expect(ell.radiusX).toBeCloseTo(80, 1);
    expect(ell.radiusY).toBeCloseTo(40, 1);
  });
});

// ==================== importFromDXF — LWPOLYLINE ====================

describe("ImportDXF — LWPOLYLINE entities", () => {
  it("parses an open polyline", () => {
    const dxf = buildDXF(
      "  0\nLWPOLYLINE\n  8\n0\n 70\n0\n 90\n3\n 10\n0\n 20\n0\n 10\n100\n 20\n0\n 10\n100\n 20\n100\n"
    );
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(1);
    const pl = result.entities[0] as IPolylineEntity;
    expect(pl.type).toBe(EntityType.POLYLINE);
    expect(pl.closed).toBe(false);
    expect(pl.points).toHaveLength(3);
    expect(pl.points[0]).toEqual({ x: 0, y: 0 });
    expect(pl.points[1]).toEqual({ x: 100, y: 0 });
    expect(pl.points[2]).toEqual({ x: 100, y: 100 });
  });

  it("detects closed axis-aligned rect → RECT entity", () => {
    // 4 vertices, closed flag, axis-aligned
    const dxf = buildDXF(
      "  0\nLWPOLYLINE\n  8\n0\n 70\n1\n 90\n4\n 10\n0\n 20\n0\n 10\n100\n 20\n0\n 10\n100\n 20\n50\n 10\n0\n 20\n50\n"
    );
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(1);
    const rect = result.entities[0] as IRectEntity;
    expect(rect.type).toBe(EntityType.RECT);
    expect(rect.origin).toEqual({ x: 0, y: 0 });
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(50);
    expect(rect.rotation).toBe(0);
  });

  it("keeps non-rectangular closed polyline as POLYLINE", () => {
    // 4 vertices, closed, but NOT axis-aligned (a diamond)
    const dxf = buildDXF(
      "  0\nLWPOLYLINE\n  8\n0\n 70\n1\n 90\n4\n 10\n50\n 20\n0\n 10\n100\n 20\n50\n 10\n50\n 20\n100\n 10\n0\n 20\n50\n"
    );
    const result = importFromDXF(dxf);

    const entity = result.entities[0] as IPolylineEntity;
    expect(entity.type).toBe(EntityType.POLYLINE);
    expect(entity.closed).toBe(true);
  });

  it("skips polyline with fewer than 2 points", () => {
    const dxf = buildDXF("  0\nLWPOLYLINE\n  8\n0\n 70\n0\n 90\n1\n 10\n0\n 20\n0\n");
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(0);
  });
});

// ==================== importFromDXF — TEXT ====================

describe("ImportDXF — TEXT entities", () => {
  it("parses a TEXT entity", () => {
    const dxf = buildDXF(
      "  0\nTEXT\n  8\n0\n 10\n50\n 20\n100\n 40\n12\n  1\nHello World\n 50\n0\n 72\n0\n"
    );
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(1);
    const text = result.entities[0] as ITextEntity;
    expect(text.type).toBe(EntityType.TEXT);
    expect(text.position).toEqual({ x: 50, y: 100 });
    expect(text.text).toBe("Hello World");
    expect(text.fontSize).toBe(12);
    expect(text.textAlign).toBe("left");
  });

  it("maps horizontal justification to textAlign", () => {
    // hjust = 1 → center
    const dxf = buildDXF(
      "  0\nTEXT\n  8\n0\n 10\n50\n 20\n100\n 11\n60\n 21\n110\n 40\n10\n  1\nCentered\n 72\n1\n"
    );
    const result = importFromDXF(dxf);

    const text = result.entities[0] as ITextEntity;
    expect(text.textAlign).toBe("center");
    // Should use alignment point (11, 21) when hjust != 0
    expect(text.position).toEqual({ x: 60, y: 110 });
  });

  it("skips TEXT with empty string", () => {
    const dxf = buildDXF("  0\nTEXT\n  8\n0\n 10\n0\n 20\n0\n 40\n10\n  1\n\n");
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(0);
  });
});

// ==================== importFromDXF — MTEXT → TEXT ====================

describe("ImportDXF — MTEXT entities", () => {
  it("parses MTEXT → TEXT entity", () => {
    const dxf = buildDXF(
      "  0\nMTEXT\n  8\n0\n 10\n200\n 20\n300\n 40\n15\n  1\nMultiline text\n"
    );
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(1);
    const text = result.entities[0] as ITextEntity;
    expect(text.type).toBe(EntityType.TEXT);
    expect(text.text).toBe("Multiline text");
    expect(text.fontSize).toBe(15);
  });

  it("strips MTEXT formatting codes", () => {
    const dxf = buildDXF(
      "  0\nMTEXT\n  8\n0\n 10\n0\n 20\n0\n 40\n10\n  1\n{\\fArial|b1|i0;Bold text}\n"
    );
    const result = importFromDXF(dxf);

    const text = result.entities[0] as ITextEntity;
    // Formatting codes should be stripped
    expect(text.text).not.toContain("\\f");
    expect(text.text).not.toContain("{");
  });
});

// ==================== importFromDXF — Layer Mapping ====================

describe("ImportDXF — Layer mapping", () => {
  it("assigns entities to correct layers", () => {
    const tables = dxfLayerTable(
      dxfLayerEntry("0", 7),
      dxfLayerEntry("Walls", 1),
    );
    const entities = dxfLine(0, 0, 10, 10, "Walls") + dxfLine(20, 20, 30, 30, "0");
    const dxf = buildDXF(entities, tables);
    const result = importFromDXF(dxf);

    expect(result.entities[0].layerId).toBe("Walls");
    expect(result.entities[1].layerId).toBe("0");
  });

  it("skips entities on frozen layers by default", () => {
    const tables = dxfLayerTable(dxfLayerEntry("Hidden", 7, 1)); // flag 1 = frozen
    const entities = dxfLine(0, 0, 10, 10, "Hidden");
    const dxf = buildDXF(entities, tables);
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(0);
    expect(result.stats.skippedEntities).toBe(1);
  });

  it("imports frozen layer entities with importHiddenLayers option", () => {
    const tables = dxfLayerTable(dxfLayerEntry("Hidden", 7, 1));
    const entities = dxfLine(0, 0, 10, 10, "Hidden");
    const dxf = buildDXF(entities, tables);
    const result = importFromDXF(dxf, { importHiddenLayers: true });

    expect(result.entities).toHaveLength(1);
  });
});

// ==================== importFromDXF — Scale Factor ====================

describe("ImportDXF — Scale factor", () => {
  it("scales all LINE coordinates", () => {
    const dxf = buildDXF(dxfLine(10, 20, 30, 40));
    const result = importFromDXF(dxf, { scaleFactor: 2 });

    const line = result.entities[0] as ILineEntity;
    expect(line.start).toEqual({ x: 20, y: 40 });
    expect(line.end).toEqual({ x: 60, y: 80 });
  });

  it("scales CIRCLE radius", () => {
    const dxf = buildDXF(dxfCircle(100, 200, 50));
    const result = importFromDXF(dxf, { scaleFactor: 0.5 });

    const circle = result.entities[0] as ICircleEntity;
    expect(circle.center).toEqual({ x: 50, y: 100 });
    expect(circle.radius).toBe(25);
  });

  it("scales TEXT position and fontSize", () => {
    const dxf = buildDXF("  0\nTEXT\n  8\n0\n 10\n100\n 20\n200\n 40\n10\n  1\nTest\n 72\n0\n");
    const result = importFromDXF(dxf, { scaleFactor: 3 });

    const text = result.entities[0] as ITextEntity;
    expect(text.position).toEqual({ x: 300, y: 600 });
    expect(text.fontSize).toBe(30);
  });
});

// ==================== importFromDXF — Stats ====================

describe("ImportDXF — Stats & edge cases", () => {
  it("reports correct stats", () => {
    const dxf = buildDXF(
      dxfLine(0, 0, 1, 1) + dxfLine(2, 2, 3, 3) + dxfCircle(0, 0, 10)
    );
    const result = importFromDXF(dxf);

    expect(result.stats.totalEntities).toBe(3);
    expect(result.stats.byType["LINE"]).toBe(2);
    expect(result.stats.byType["CIRCLE"]).toBe(1);
  });

  it("reports unsupported entity types", () => {
    const dxf = buildDXF(
      dxfLine(0, 0, 1, 1) + "  0\nSPLINE\n  8\n0\n" + "  0\n3DFACE\n  8\n0\n"
    );
    const result = importFromDXF(dxf);

    expect(result.entities).toHaveLength(1);
    expect(result.stats.unsupportedTypes).toContain("SPLINE");
    expect(result.stats.unsupportedTypes).toContain("3DFACE");
    expect(result.stats.skippedEntities).toBe(2);
  });

  it("returns error for empty DXF", () => {
    const result = importFromDXF("");

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.entities).toHaveLength(0);
  });

  it("handles DXF with no ENTITIES section", () => {
    const dxf = "  0\nSECTION\n  2\nHEADER\n  0\nENDSEC\n  0\nEOF\n";
    const result = importFromDXF(dxf);

    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(0);
  });

  it("generates unique entity IDs", () => {
    const dxf = buildDXF(dxfLine(0, 0, 1, 1) + dxfLine(2, 2, 3, 3));
    const result = importFromDXF(dxf);

    const ids = result.entities.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length); // all unique
  });

  it("sets default entity state", () => {
    const dxf = buildDXF(dxfLine(0, 0, 1, 1));
    const result = importFromDXF(dxf);

    const entity = result.entities[0];
    expect(entity.state.selected).toBe(false);
    expect(entity.state.hovered).toBe(false);
    expect(entity.state.visible).toBe(true);
    expect(entity.state.locked).toBe(false);
  });
});

// ==================== importFromDXF — Linetype Mapping ====================

describe("ImportDXF — Linetype mapping", () => {
  it("maps DASHED linetype to dashed strokeStyle", () => {
    const dxf = buildDXF("  0\nLINE\n  8\n0\n  6\nDASHED\n 10\n0\n 20\n0\n 11\n1\n 21\n1\n");
    const result = importFromDXF(dxf);

    expect(result.entities[0].style.strokeStyle).toBe("dashed");
  });

  it("maps DOT linetype to dotted strokeStyle", () => {
    const dxf = buildDXF("  0\nLINE\n  8\n0\n  6\nDOT\n 10\n0\n 20\n0\n 11\n1\n 21\n1\n");
    const result = importFromDXF(dxf);

    expect(result.entities[0].style.strokeStyle).toBe("dotted");
  });

  it("maps DASHDOT linetype to dashdot strokeStyle", () => {
    const dxf = buildDXF("  0\nLINE\n  8\n0\n  6\nDASHDOT\n 10\n0\n 20\n0\n 11\n1\n 21\n1\n");
    const result = importFromDXF(dxf);

    expect(result.entities[0].style.strokeStyle).toBe("dashdot");
  });

  it("maps Continuous linetype to solid strokeStyle", () => {
    const dxf = buildDXF("  0\nLINE\n  8\n0\n  6\nContinuous\n 10\n0\n 20\n0\n 11\n1\n 21\n1\n");
    const result = importFromDXF(dxf);

    expect(result.entities[0].style.strokeStyle).toBe("solid");
  });
});

// ==================== Roundtrip: Export → Import ====================

describe("ImportDXF — Roundtrip compatibility", () => {
  it("import entities maintain correct types and structure", () => {
    // Build a DXF with all supported types
    const entities = [
      dxfLine(10, 20, 300, 400),
      dxfCircle(50, 60, 25),
      dxfArc(100, 200, 50, 0, 90),
    ].join("");
    const dxf = buildDXF(entities);
    const result = importFromDXF(dxf);

    expect(result.success).toBe(true);
    expect(result.entities).toHaveLength(3);
    expect(result.entities[0].type).toBe(EntityType.LINE);
    expect(result.entities[1].type).toBe(EntityType.CIRCLE);
    expect(result.entities[2].type).toBe(EntityType.ARC);
  });
});
