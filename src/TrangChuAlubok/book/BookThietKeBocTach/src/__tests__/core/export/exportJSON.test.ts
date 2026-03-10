/**
 * ExportJSON Tests — Phase 5.1
 *
 * Tests for JSON export/import roundtrip, format validation,
 * legacy format support, version checking, and quick validation.
 *
 * Tests use IEntity data objects + EntityBridge serialization
 * (the same path used by CadDocument.toJSON / fromJSON).
 */

import { CadDocument } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument";
import {
  exportToJSON,
  importFromJSON,
  importFromJSONFull,
  parseCadFileJSON,
  validateCadJSON,
  FORMAT_VERSION,
  APP_ID,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportJSON";
import type { CadFileJSON } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportJSON";
import { ExportManager } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/export/ExportManager";
import {
  IEntity,
  ILineEntity,
  IRectEntity,
  ICircleEntity,
  EntityType,
  DEFAULT_STYLE,
  DEFAULT_STATE,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/Entity.types";
import type { DocumentData } from "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/document/CadDocument.types";

// Ensure entity configs are registered (required for serialization)
import "@/TrangChuAlubok/book/BookThietKeBocTach/src/core/entities/configs/index";

// ==================== Helpers ====================

function makeLine(id: string, x1 = 0, y1 = 0, x2 = 100, y2 = 0): ILineEntity {
  return {
    id,
    type: EntityType.LINE,
    layerId: "default",
    name: `line-${id}`,
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
    layerId: "default",
    name: `rect-${id}`,
    style: { ...DEFAULT_STYLE, fillColor: "#FF0000" },
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
    layerId: "default",
    name: `circle-${id}`,
    style: { ...DEFAULT_STYLE },
    state: { ...DEFAULT_STATE },
    center: { x: cx, y: cy },
    radius: r,
  };
}

function makeDocWithEntities(entities: IEntity[]): CadDocument {
  const doc = new CadDocument({ title: "Test Project", author: "Tester" });
  for (const e of entities) {
    doc.addEntity(e);
  }
  return doc;
}

// ==================== exportToJSON ====================

describe("ExportJSON — exportToJSON", () => {
  test("returns success with valid JSON for empty document", () => {
    const doc = new CadDocument({ title: "Empty" });
    const result = exportToJSON(doc);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.filename).toBe("Empty.cad.json");

    const parsed = JSON.parse(result.data as string) as CadFileJSON;
    expect(parsed.formatVersion).toBe(FORMAT_VERSION);
    expect(parsed.app).toBe(APP_ID);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.document).toBeDefined();
    expect(parsed.document.metadata.title).toBe("Empty");
  });

  test("includes entities in exported JSON", () => {
    const doc = makeDocWithEntities([
      makeLine("L1"),
      makeRect("R1"),
      makeCircle("C1"),
    ]);
    const result = exportToJSON(doc);

    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.data as string) as CadFileJSON;
    expect(parsed.document.entities).toHaveLength(3);
  });

  test("pretty-print produces indented output (default)", () => {
    const doc = new CadDocument();
    const result = exportToJSON(doc, true);
    const json = result.data as string;

    expect(json).toContain("\n");
    expect(json).toContain("  ");
  });

  test("compact mode produces single-line output", () => {
    const doc = new CadDocument();
    const result = exportToJSON(doc, false);
    const json = result.data as string;

    // Should not contain newlines (single line)
    expect(json.includes("\n")).toBe(false);
  });

  test("filename uses document title", () => {
    const doc = new CadDocument({ title: "My Project" });
    const result = exportToJSON(doc);
    expect(result.filename).toBe("My Project.cad.json");
  });

  test("exportedAt is a valid ISO date", () => {
    const before = new Date().toISOString();
    const doc = new CadDocument();
    const result = exportToJSON(doc);
    const parsed = JSON.parse(result.data as string) as CadFileJSON;
    const after = new Date().toISOString();

    expect(parsed.exportedAt >= before).toBe(true);
    expect(parsed.exportedAt <= after).toBe(true);
  });
});

// ==================== parseCadFileJSON ====================

describe("ExportJSON — parseCadFileJSON", () => {
  test("parses valid CadFileJSON wrapper", () => {
    const doc = new CadDocument({ title: "Parsed" });
    const result = exportToJSON(doc);
    const fileData = parseCadFileJSON(result.data as string);

    expect(fileData.formatVersion).toBe(FORMAT_VERSION);
    expect(fileData.app).toBe(APP_ID);
    expect(fileData.document.metadata.title).toBe("Parsed");
  });

  test("wraps legacy DocumentData format", () => {
    const doc = new CadDocument({ title: "Legacy" });
    const docData = doc.toJSON();
    const legacyJSON = JSON.stringify(docData);

    const fileData = parseCadFileJSON(legacyJSON);
    expect(fileData.formatVersion).toBe("0.0.0"); // Legacy marker
    expect(fileData.app).toBe("unknown");
    expect(fileData.document.metadata.title).toBe("Legacy");
  });

  test("throws on incompatible major version", () => {
    const futureFile: CadFileJSON = {
      formatVersion: "99.0.0",
      app: APP_ID,
      exportedAt: new Date().toISOString(),
      document: new CadDocument().toJSON(),
    };

    expect(() => parseCadFileJSON(JSON.stringify(futureFile))).toThrow(
      /Incompatible file format version.*99\.0\.0/,
    );
  });

  test("throws on non-object root", () => {
    expect(() => parseCadFileJSON('"hello"')).toThrow("expected object");
  });

  test("throws on invalid structure", () => {
    expect(() => parseCadFileJSON('{"foo": "bar"}')).toThrow(
      /Invalid file format/,
    );
  });

  test("throws on invalid JSON syntax", () => {
    expect(() => parseCadFileJSON("not json")).toThrow();
  });
});

// ==================== importFromJSON ====================

describe("ExportJSON — importFromJSON", () => {
  test("restores basic document metadata", () => {
    const original = new CadDocument({
      title: "Import Test",
      author: "Author A",
    });
    const { data } = exportToJSON(original);
    const restored = importFromJSON(data as string);

    expect(restored.metadata.title).toBe("Import Test");
    expect(restored.metadata.author).toBe("Author A");
  });

  test("restores empty document", () => {
    const original = new CadDocument({ title: "Empty" });
    const { data } = exportToJSON(original);
    const restored = importFromJSON(data as string);

    expect(restored.getAllEntities()).toHaveLength(0);
    expect(restored.metadata.title).toBe("Empty");
  });

  test("restores line entities with correct geometry", () => {
    const line = makeLine("L1", 10, 20, 300, 400);
    const doc = makeDocWithEntities([line]);

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    const entities = restored.getAllEntities();

    expect(entities).toHaveLength(1);
    const e = entities[0] as ILineEntity;
    expect(e.id).toBe("L1");
    expect(e.type).toBe(EntityType.LINE);
    expect(e.start.x).toBe(10);
    expect(e.start.y).toBe(20);
    expect(e.end.x).toBe(300);
    expect(e.end.y).toBe(400);
  });

  test("restores rect entities with correct geometry", () => {
    const rect = makeRect("R1", 50, 60, 400, 300);
    const doc = makeDocWithEntities([rect]);

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    const entities = restored.getAllEntities();

    expect(entities).toHaveLength(1);
    const e = entities[0] as IRectEntity;
    expect(e.id).toBe("R1");
    expect(e.type).toBe(EntityType.RECT);
    expect(e.origin.x).toBe(50);
    expect(e.origin.y).toBe(60);
    expect(e.width).toBe(400);
    expect(e.height).toBe(300);
  });

  test("restores circle entities with correct geometry", () => {
    const circle = makeCircle("C1", 100, 200, 75);
    const doc = makeDocWithEntities([circle]);

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    const entities = restored.getAllEntities();

    expect(entities).toHaveLength(1);
    const e = entities[0] as ICircleEntity;
    expect(e.id).toBe("C1");
    expect(e.type).toBe(EntityType.CIRCLE);
    expect(e.center.x).toBe(100);
    expect(e.center.y).toBe(200);
    expect(e.radius).toBe(75);
  });

  test("restores entity style properties", () => {
    const rect = makeRect("R1");
    rect.style = {
      strokeColor: "#00FF00",
      strokeWidth: 3,
      strokeStyle: "dashed",
      fillColor: "#AABBCC",
      opacity: 0.5,
    };
    const doc = makeDocWithEntities([rect]);

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    const e = restored.getAllEntities()[0];

    expect(e.style.strokeColor).toBe("#00FF00");
    expect(e.style.strokeWidth).toBe(3);
    expect(e.style.strokeStyle).toBe("dashed");
    expect(e.style.fillColor).toBe("#AABBCC");
    expect(e.style.opacity).toBe(0.5);
  });
});

// ==================== Full Roundtrip ====================

describe("ExportJSON — Full Roundtrip", () => {
  test("roundtrip preserves multiple entity types", () => {
    const entities: IEntity[] = [
      makeLine("L1", 0, 0, 100, 100),
      makeLine("L2", 50, 50, 200, 300),
      makeRect("R1", 10, 20, 500, 400),
      makeCircle("C1", 250, 250, 100),
    ];
    const original = makeDocWithEntities(entities);
    original.metadata.title = "Roundtrip Test";
    original.metadata.author = "Test Author";

    // Export
    const result = exportToJSON(original);
    expect(result.success).toBe(true);

    // Import
    const restored = importFromJSON(result.data as string);

    // Verify metadata
    expect(restored.metadata.title).toBe("Roundtrip Test");
    expect(restored.metadata.author).toBe("Test Author");

    // Verify entity count
    const restoredEntities = restored.getAllEntities();
    expect(restoredEntities.length).toBe(entities.length);

    // Verify each entity by ID
    for (const orig of entities) {
      const found = restoredEntities.find((e) => e.id === orig.id);
      expect(found).toBeDefined();
      expect(found!.type).toBe(orig.type);
    }
  });

  test("roundtrip preserves line geometry exactly", () => {
    const line = makeLine("precise", 1.23456, 7.89012, 345.678, 901.234);
    const doc = makeDocWithEntities([line]);

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    const e = restored.getAllEntities()[0] as ILineEntity;

    expect(e.start.x).toBeCloseTo(1.23456, 5);
    expect(e.start.y).toBeCloseTo(7.89012, 5);
    expect(e.end.x).toBeCloseTo(345.678, 3);
    expect(e.end.y).toBeCloseTo(901.234, 3);
  });

  test("roundtrip preserves document version", () => {
    const doc = new CadDocument({ title: "VersionTest" });
    doc.metadata.version = "2.5.0";

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    expect(restored.metadata.version).toBe("2.5.0");
  });

  test("roundtrip preserves entity layerId", () => {
    const line = makeLine("L1");
    line.layerId = "layer-42";
    const doc = makeDocWithEntities([line]);

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    const e = restored.getAllEntities()[0];
    expect(e.layerId).toBe("layer-42");
  });

  test("double roundtrip produces identical JSON", () => {
    const doc = makeDocWithEntities([
      makeLine("L1", 0, 0, 100, 100),
      makeRect("R1", 10, 20, 300, 200),
    ]);

    // First roundtrip
    const json1 = exportToJSON(doc, false).data as string;
    const doc2 = importFromJSON(json1);

    // Second roundtrip
    const json2 = exportToJSON(doc2, false).data as string;

    // Parse and compare document data (exportedAt will differ)
    const parsed1 = JSON.parse(json1) as CadFileJSON;
    const parsed2 = JSON.parse(json2) as CadFileJSON;

    expect(parsed1.document.entities.length).toBe(
      parsed2.document.entities.length,
    );
    expect(parsed1.document.metadata.title).toBe(
      parsed2.document.metadata.title,
    );
  });
});

// ==================== importFromJSONFull ====================

describe("ExportJSON — importFromJSONFull", () => {
  test("returns document and file metadata", () => {
    const doc = new CadDocument({ title: "Full Import" });
    const { data } = exportToJSON(doc);

    const result = importFromJSONFull(data as string);

    expect(result.document).toBeInstanceOf(CadDocument);
    expect(result.document.metadata.title).toBe("Full Import");
    expect(result.formatVersion).toBe(FORMAT_VERSION);
    expect(result.app).toBe(APP_ID);
    expect(result.exportedAt).toBeDefined();
  });

  test("legacy format returns version 0.0.0", () => {
    const doc = new CadDocument({ title: "Legacy Full" });
    const legacyJSON = JSON.stringify(doc.toJSON());

    const result = importFromJSONFull(legacyJSON);

    expect(result.formatVersion).toBe("0.0.0");
    expect(result.app).toBe("unknown");
    expect(result.document.metadata.title).toBe("Legacy Full");
  });
});

// ==================== validateCadJSON ====================

describe("ExportJSON — validateCadJSON", () => {
  test("valid file returns valid=true with info", () => {
    const doc = makeDocWithEntities([makeLine("L1"), makeCircle("C1")]);
    doc.metadata.title = "Validated";
    const { data } = exportToJSON(doc);

    const result = validateCadJSON(data as string);

    expect(result.valid).toBe(true);
    expect(result.formatVersion).toBe(FORMAT_VERSION);
    expect(result.entityCount).toBe(2);
    expect(result.title).toBe("Validated");
    expect(result.error).toBeUndefined();
  });

  test("invalid JSON returns valid=false with error", () => {
    const result = validateCadJSON("not json {{{");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("incompatible version returns valid=false", () => {
    const futureFile = JSON.stringify({
      formatVersion: "99.0.0",
      app: APP_ID,
      exportedAt: new Date().toISOString(),
      document: new CadDocument().toJSON(),
    });

    const result = validateCadJSON(futureFile);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Incompatible/);
  });

  test("empty entities returns entityCount=0", () => {
    const doc = new CadDocument();
    const { data } = exportToJSON(doc);

    const result = validateCadJSON(data as string);
    expect(result.valid).toBe(true);
    expect(result.entityCount).toBe(0);
  });

  test("wrong structure returns valid=false", () => {
    const result = validateCadJSON('{"random": true}');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Invalid file format/);
  });
});

// ==================== ExportManager Facade ====================

describe("ExportJSON — ExportManager facade", () => {
  test("ExportManager.exportToJSON delegates correctly", () => {
    const doc = new CadDocument({ title: "Facade Test" });
    const result = ExportManager.exportToJSON(doc);

    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.data as string) as CadFileJSON;
    expect(parsed.document.metadata.title).toBe("Facade Test");
  });

  test("ExportManager.importFromJSON delegates correctly", () => {
    const doc = new CadDocument({ title: "Facade Import" });
    const { data } = ExportManager.exportToJSON(doc);
    const restored = ExportManager.importFromJSON(data as string);

    expect(restored.metadata.title).toBe("Facade Import");
  });

  test("ExportManager.validateCadJSON delegates correctly", () => {
    const doc = new CadDocument({ title: "Validate" });
    const { data } = ExportManager.exportToJSON(doc);
    const result = ExportManager.validateCadJSON(data as string);

    expect(result.valid).toBe(true);
    expect(result.title).toBe("Validate");
  });

  test("ExportManager.importFromJSONFull delegates correctly", () => {
    const doc = new CadDocument({ title: "Full" });
    const { data } = ExportManager.exportToJSON(doc);
    const result = ExportManager.importFromJSONFull(data as string);

    expect(result.document.metadata.title).toBe("Full");
    expect(result.formatVersion).toBe(FORMAT_VERSION);
  });
});

// ==================== Edge Cases ====================

describe("ExportJSON — Edge Cases", () => {
  test("handles document with many entities", () => {
    const entities: IEntity[] = [];
    for (let i = 0; i < 100; i++) {
      entities.push(makeLine(`L${i}`, i, i, i + 100, i + 100));
    }
    const doc = makeDocWithEntities(entities);

    const result = exportToJSON(doc, false);
    expect(result.success).toBe(true);

    const restored = importFromJSON(result.data as string);
    expect(restored.getAllEntities()).toHaveLength(100);
  });

  test("preserves entity name through roundtrip", () => {
    const line = makeLine("named");
    line.name = "MySpecialLine";
    const doc = makeDocWithEntities([line]);

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    expect(restored.getAllEntities()[0].name).toBe("MySpecialLine");
  });

  test("preserves metadata through roundtrip", () => {
    const line = makeLine("meta");
    line.metadata = { customProp: "hello", count: 42 };
    const doc = makeDocWithEntities([line]);

    const { data } = exportToJSON(doc);
    const restored = importFromJSON(data as string);
    const e = restored.getAllEntities()[0];
    expect(e.metadata).toBeDefined();
    expect(e.metadata!.customProp).toBe("hello");
    expect(e.metadata!.count).toBe(42);
  });

  test("CadDocument.fromJSON works with default factory (no factory arg)", () => {
    const doc = makeDocWithEntities([makeLine("L1"), makeRect("R1")]);
    const data = doc.toJSON();

    // Call fromJSON WITHOUT entityFactory — should use default
    const restored = CadDocument.fromJSON(data);
    expect(restored.getAllEntities()).toHaveLength(2);
  });

  test("CadDocument.fromJSONString works with default factory", () => {
    const doc = makeDocWithEntities([makeCircle("C1")]);
    const jsonStr = doc.toJSONString(true);

    // Call fromJSONString WITHOUT entityFactory
    const restored = CadDocument.fromJSONString(jsonStr);
    expect(restored.getAllEntities()).toHaveLength(1);
    const e = restored.getAllEntities()[0] as ICircleEntity;
    expect(e.type).toBe(EntityType.CIRCLE);
  });
});
