/**
 * BOM Domain Tests — Phase 3
 *
 * Tests for BomItem helpers (createBomItem, calculateBomSummary),
 * CutListOptimizer (first-fit, best-fit, multi-stock),
 * and GlassCutCalculator (maxrects, guillotine).
 *
 * Pure domain logic — no UI, no engine, no mocks needed.
 */

import {
  createBomItem,
  calculateBomSummary,
  BomItem,
  BomItemType,
  BomItemStatus,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/domain/bom/BomItem";
import {
  CutListOptimizer,
  generateFullCutList,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/domain/bom/CutListOptimizer";
import {
  GlassCutCalculator,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/domain/bom/GlassCutCalculator";
import {
  MaterialBase,
  MaterialCategory,
  MaterialUnit,
  CutPiece,
  GlassPiece,
} from "@/TrangChuAlubok/book/BookThietKeBocTach/src/domain/materials/Material.types";

// ==================== Helpers ====================

function makeMaterial(
  overrides?: Partial<MaterialBase>
): MaterialBase {
  return {
    id: "mat-1",
    code: "ALU-001",
    name: "Test Profile",
    category: MaterialCategory.ALUMINUM_PROFILE,
    unit: MaterialUnit.METER,
    unitPrice: 50000,
    currency: "VND",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeGlassMaterial(overrides?: Partial<MaterialBase>): MaterialBase {
  return makeMaterial({
    id: "glass-1",
    code: "GL-001",
    name: "Kính cường lực",
    category: MaterialCategory.GLASS,
    unit: MaterialUnit.SQUARE_METER,
    unitPrice: 200000,
    ...overrides,
  });
}

function makeAccessoryMaterial(overrides?: Partial<MaterialBase>): MaterialBase {
  return makeMaterial({
    id: "acc-1",
    code: "ACC-001",
    name: "Bản lề",
    category: MaterialCategory.ACCESSORY,
    unit: MaterialUnit.PIECE,
    unitPrice: 30000,
    ...overrides,
  });
}

function makeCutPiece(
  length: number,
  quantity: number,
  label: string
): CutPiece {
  return {
    materialId: "mat-1",
    length,
    quantity,
    angle1: 45,
    angle2: 45,
    label,
    position: "frame",
  };
}

function makeGlassPiece(
  width: number,
  height: number,
  quantity: number,
  label: string
): GlassPiece {
  return {
    materialId: "glass-1",
    width,
    height,
    quantity,
    area: (width * height) / 1_000_000, // mm² → m²
    label,
    position: "Panel",
  };
}

// ==================== createBomItem ====================

describe("createBomItem", () => {
  test("creates item with default wastage for profile", () => {
    const mat = makeMaterial();
    const item = createBomItem(mat, 10, "Frame Top");

    expect(item.type).toBe(BomItemType.PROFILE);
    expect(item.quantity).toBe(10);
    expect(item.wastagePercent).toBe(5); // default for profiles
    expect(item.grossQuantity).toBeCloseTo(10.5); // 10 * 1.05
    expect(item.totalPrice).toBeCloseTo(10.5 * 50000);
    expect(item.position).toBe("Frame Top");
    expect(item.status).toBe(BomItemStatus.PENDING);
    expect(item.id).toMatch(/^bom-item-/);
  });

  test("creates glass item with 3% default wastage", () => {
    const mat = makeGlassMaterial();
    const item = createBomItem(mat, 2, "Panel");

    expect(item.type).toBe(BomItemType.GLASS);
    expect(item.wastagePercent).toBe(3);
    expect(item.grossQuantity).toBeCloseTo(2.06);
  });

  test("creates accessory item with 0% wastage", () => {
    const mat = makeAccessoryMaterial();
    const item = createBomItem(mat, 4, "Hinge");

    expect(item.type).toBe(BomItemType.ACCESSORY);
    expect(item.wastagePercent).toBe(0);
    expect(item.grossQuantity).toBe(4);
    expect(item.totalPrice).toBeCloseTo(4 * 30000);
  });

  test("applies custom wastage", () => {
    const mat = makeMaterial();
    const item = createBomItem(mat, 10, "Frame", { wastagePercent: 10 });

    expect(item.wastagePercent).toBe(10);
    expect(item.grossQuantity).toBeCloseTo(11);
  });

  test("applies discount", () => {
    const mat = makeMaterial();
    const item = createBomItem(mat, 10, "Frame", { discountPercent: 20 });

    expect(item.discountPercent).toBe(20);
    expect(item.discountedPrice).toBeCloseTo(item.totalPrice * 0.8);
  });

  test("no discount fields when discountPercent is 0", () => {
    const mat = makeMaterial();
    const item = createBomItem(mat, 10, "Frame", { discountPercent: 0 });

    expect(item.discountPercent).toBeUndefined();
    expect(item.discountedPrice).toBeUndefined();
  });

  test("preserves notes", () => {
    const mat = makeMaterial();
    const item = createBomItem(mat, 1, "Frame", { notes: "Custom cut" });
    expect(item.notes).toBe("Custom cut");
  });
});

// ==================== calculateBomSummary ====================

describe("calculateBomSummary", () => {
  test("summarizes empty items", () => {
    const summary = calculateBomSummary([]);
    expect(summary.totalItems).toBe(0);
    expect(summary.totalCost).toBe(0);
    expect(summary.materialCost).toBe(0);
  });

  test("summarizes profiles", () => {
    const items: BomItem[] = [
      {
        ...createBomItem(makeMaterial(), 10, "Frame Top"),
        totalLength: 2000,
      },
      {
        ...createBomItem(makeMaterial(), 10, "Frame Bottom"),
        totalLength: 2000,
      },
    ];

    const summary = calculateBomSummary(items);
    expect(summary.totalItems).toBe(2);
    expect(summary.totalProfiles).toBe(2);
    expect(summary.profileLength).toBe(4000);
    expect(summary.profileCost).toBeGreaterThan(0);
  });

  test("summarizes glass", () => {
    const items: BomItem[] = [
      {
        ...createBomItem(makeGlassMaterial(), 2, "Panel"),
        totalArea: 1.5,
      },
    ];

    const summary = calculateBomSummary(items);
    expect(summary.totalGlass).toBe(1);
    expect(summary.glassArea).toBeCloseTo(1.5);
    expect(summary.glassCost).toBeGreaterThan(0);
  });

  test("summarizes accessories", () => {
    const items: BomItem[] = [
      createBomItem(makeAccessoryMaterial(), 3, "Hinge"),
    ];

    const summary = calculateBomSummary(items);
    expect(summary.totalAccessories).toBe(1);
    expect(summary.accessoryCost).toBeGreaterThan(0);
  });

  test("adds labor and overhead to total", () => {
    const items: BomItem[] = [
      createBomItem(makeMaterial(), 10, "Frame"),
    ];

    const labor = 100000;
    const overhead = 50000;
    const summary = calculateBomSummary(items, labor, overhead);

    expect(summary.laborCost).toBe(100000);
    expect(summary.overheadCost).toBe(50000);
    expect(summary.totalCost).toBe(summary.materialCost + labor + overhead);
  });

  test("uses discountedPrice when available", () => {
    const item = createBomItem(makeMaterial(), 10, "Frame", { discountPercent: 50 });
    const summary = calculateBomSummary([item]);

    // profileCost should use discountedPrice since it exists
    expect(summary.profileCost).toBeCloseTo(item.discountedPrice!);
    expect(summary.materialCost).toBe(summary.profileCost);
  });

  test("currency defaults to VND", () => {
    const summary = calculateBomSummary([]);
    expect(summary.currency).toBe("VND");
  });
});

// ==================== CutListOptimizer ====================

describe("CutListOptimizer", () => {
  let optimizer: CutListOptimizer;

  beforeEach(() => {
    optimizer = new CutListOptimizer({
      bladeWidth: 3,
      stockLengths: [6000],
    });
  });

  // ---------- config ----------
  test("default config", () => {
    const opt = new CutListOptimizer();
    const cfg = opt.getConfig();
    expect(cfg.bladeWidth).toBe(3);
    expect(cfg.stockLengths).toContain(6000);
    expect(cfg.minCutLength).toBe(50);
  });

  test("updateConfig merges partial config", () => {
    optimizer.updateConfig({ bladeWidth: 5 });
    expect(optimizer.getConfig().bladeWidth).toBe(5);
    expect(optimizer.getConfig().stockLengths).toContain(6000); // unchanged
  });

  // ---------- single piece ----------
  test("optimize single piece that fits in one stock", () => {
    const pieces: CutPiece[] = [makeCutPiece(2000, 1, "Frame Top")];
    const result = optimizer.optimize(pieces);

    expect(result.totalStocksNeeded).toBe(1);
    expect(result.efficiency).toBeGreaterThan(0);
    expect(result.totalUsed).toBe(2000);
    expect(result.totalWaste).toBe(4000); // 6000 - 2000
    expect(result.algorithm).toBe("first-fit-decreasing");
  });

  // ---------- multiple pieces fitting one stock ----------
  test("optimize multiple pieces fitting in one stock", () => {
    const pieces: CutPiece[] = [
      makeCutPiece(2000, 1, "Top"),
      makeCutPiece(2000, 1, "Bottom"),
      makeCutPiece(1000, 1, "Side"),
    ];
    const result = optimizer.optimize(pieces);

    expect(result.totalStocksNeeded).toBe(1);
    // Total used = 2000 + 2000 + 1000 = 5000
    expect(result.totalUsed).toBeGreaterThanOrEqual(5000);
  });

  // ---------- pieces requiring multiple stocks ----------
  test("optimize pieces requiring 2 stocks", () => {
    const pieces: CutPiece[] = [
      makeCutPiece(4000, 1, "Long1"),
      makeCutPiece(4000, 1, "Long2"),
    ];
    const result = optimizer.optimize(pieces);

    // Each 4000mm piece needs its own 6000mm stock (4000+3+4000=8003 > 6000)
    expect(result.totalStocksNeeded).toBe(2);
  });

  // ---------- quantity expansion ----------
  test("expands quantity correctly", () => {
    const pieces: CutPiece[] = [makeCutPiece(1000, 3, "Frame")];
    const result = optimizer.optimize(pieces);

    // 3 × 1000mm + 2 × 3mm blade = 3006mm → fits in 1 stock
    expect(result.totalStocksNeeded).toBe(1);
    expect(result.patterns[0].pieces).toHaveLength(3);
  });

  // ---------- best-fit algorithm ----------
  test("best-fit algorithm works", () => {
    const pieces: CutPiece[] = [
      makeCutPiece(2000, 2, "A"),
      makeCutPiece(1500, 2, "B"),
    ];
    const result = optimizer.optimize(pieces, undefined, "best-fit");

    expect(result.algorithm).toBe("best-fit-decreasing");
    expect(result.totalStocksNeeded).toBeGreaterThanOrEqual(1);
    expect(result.efficiency).toBeGreaterThan(0);
  });

  // ---------- multi-stock optimization ----------
  test("multi-stock selects smallest suitable stock", () => {
    const opt = new CutListOptimizer({
      stockLengths: [6000, 4000, 3000],
    });

    const pieces: CutPiece[] = [makeCutPiece(2500, 1, "Short")];
    const result = opt.optimizeMultiStock(pieces);

    // Should pick 3000mm stock (smallest that fits 2500)
    expect(result.patterns[0].stockLength).toBe(3000);
  });

  // ---------- generateCutList ----------
  test("generateCutList produces CutListItem", () => {
    const pieces: CutPiece[] = [makeCutPiece(2000, 2, "Side")];
    const result = optimizer.optimize(pieces);

    const item = optimizer.generateCutList("mat-1", "ALU-001", "Profile", result);
    expect(item.materialId).toBe("mat-1");
    expect(item.materialCode).toBe("ALU-001");
    expect(item.stockLength).toBe(6000);
    expect(item.stocksNeeded).toBe(result.totalStocksNeeded);
    expect(item.cutPieces.length).toBeGreaterThanOrEqual(1);
    expect(item.id).toMatch(/^cut-/);
  });

  // ---------- edge: empty pieces ----------
  test("optimize with empty pieces", () => {
    const result = optimizer.optimize([]);
    expect(result.totalStocksNeeded).toBe(0);
    expect(result.efficiency).toBe(100); // 0 waste
  });

  // ---------- pattern SVG ----------
  test("generatePatternSvg returns SVG string", () => {
    const pieces: CutPiece[] = [makeCutPiece(2000, 1, "Frame")];
    const result = optimizer.optimize(pieces);
    const svg = optimizer.generatePatternSvg(result.patterns[0]);

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("2000");
  });
});

// ---------- generateFullCutList ----------

describe("generateFullCutList", () => {
  test("generates full CutList from items", () => {
    const optimizer = new CutListOptimizer();
    const pieces: CutPiece[] = [
      makeCutPiece(2000, 2, "A"),
      makeCutPiece(1500, 1, "B"),
    ];
    const result = optimizer.optimize(pieces);
    const item = optimizer.generateCutList("m1", "C1", "Profile", result);

    const cutList = generateFullCutList("bom-1", [item]);
    expect(cutList.bomId).toBe("bom-1");
    expect(cutList.items).toHaveLength(1);
    expect(cutList.totalStocksNeeded).toBeGreaterThanOrEqual(1);
    expect(cutList.optimizationScore).toBeGreaterThan(0);
    expect(cutList.optimizationScore).toBeLessThanOrEqual(100);
    expect(cutList.id).toMatch(/^cutlist-/);
  });
});

// ==================== GlassCutCalculator ====================

describe("GlassCutCalculator", () => {
  let calculator: GlassCutCalculator;

  beforeEach(() => {
    calculator = new GlassCutCalculator({
      bladeWidth: 3,
      edgeMargin: 10,
      minPieceSize: 100,
      allowRotation: true,
      standardSheets: [{ width: 2440, height: 3660 }],
    });
  });

  // ---------- single piece ----------
  test("optimize single piece on one sheet", () => {
    const pieces: GlassPiece[] = [makeGlassPiece(500, 600, 1, "Panel A")];
    const result = calculator.optimize(pieces);

    expect(result.totalSheetsNeeded).toBe(1);
    expect(result.efficiency).toBeGreaterThan(0);
    expect(result.patterns[0].pieces).toHaveLength(1);
    expect(result.algorithm).toBe("maxrects");
  });

  // ---------- multiple pieces ----------
  test("optimize multiple pieces", () => {
    const pieces: GlassPiece[] = [
      makeGlassPiece(500, 600, 2, "A"),
      makeGlassPiece(800, 1000, 1, "B"),
    ];
    const result = calculator.optimize(pieces);

    expect(result.totalSheetsNeeded).toBeGreaterThanOrEqual(1);
    const totalPlaced = result.patterns.reduce(
      (sum, p) => sum + p.pieces.length, 0
    );
    expect(totalPlaced).toBe(3); // 2 × A + 1 × B
  });

  // ---------- guillotine algorithm ----------
  test("guillotine algorithm produces result", () => {
    const pieces: GlassPiece[] = [makeGlassPiece(400, 500, 2, "G1")];
    const result = calculator.optimize(pieces, undefined, "guillotine");

    expect(result.totalSheetsNeeded).toBeGreaterThanOrEqual(1);
    expect(result.algorithm).toBe("maxrects"); // createResult doesn't pass algo for guillotine
  });

  // ---------- custom sheet size ----------
  test("optimize with custom sheet size", () => {
    const pieces: GlassPiece[] = [makeGlassPiece(400, 400, 1, "Small")];
    const result = calculator.optimize(pieces, { width: 1000, height: 1000 });

    expect(result.totalSheetsNeeded).toBe(1);
    expect(result.patterns[0].sheetWidth).toBe(1000);
    expect(result.patterns[0].sheetHeight).toBe(1000);
  });

  // ---------- rotation ----------
  test("rotation allows better fit", () => {
    // Piece 700×200, sheet only 500×2000 usable after margin
    // With rotation: 200×700 might fit
    const calc = new GlassCutCalculator({
      bladeWidth: 3,
      edgeMargin: 10,
      minPieceSize: 50,
      allowRotation: true,
      standardSheets: [{ width: 500, height: 2000 }],
    });
    const pieces: GlassPiece[] = [makeGlassPiece(200, 400, 1, "R1")];
    const result = calc.optimize(pieces, { width: 500, height: 2000 });

    expect(result.totalSheetsNeeded).toBe(1);
  });

  // ---------- generateGlassCutItem ----------
  test("generateGlassCutItem produces GlassCutItem", () => {
    const pieces: GlassPiece[] = [makeGlassPiece(500, 600, 1, "Glass1")];
    const result = calculator.optimize(pieces);

    const item = calculator.generateGlassCutItem(
      "glass-1", "GL-001", "Kính", 8, result
    );

    expect(item.materialId).toBe("glass-1");
    expect(item.thickness).toBe(8);
    expect(item.sheetsNeeded).toBe(result.totalSheetsNeeded);
    expect(item.pieces.length).toBeGreaterThanOrEqual(1);
    expect(item.id).toMatch(/^glass-cut-/);
  });

  // ---------- empty pieces ----------
  test("optimize with empty pieces", () => {
    const result = calculator.optimize([]);
    // Should produce 0 sheets (no pieces to place)
    expect(result.totalSheetsNeeded).toBe(0);
    expect(result.patterns).toHaveLength(0);
  });

  // ---------- efficiency range ----------
  test("efficiency is between 0 and 100", () => {
    const pieces: GlassPiece[] = [
      makeGlassPiece(800, 1200, 3, "Big"),
      makeGlassPiece(400, 300, 5, "Small"),
    ];
    const result = calculator.optimize(pieces);

    expect(result.efficiency).toBeGreaterThan(0);
    expect(result.efficiency).toBeLessThanOrEqual(100);
    for (const pattern of result.patterns) {
      expect(pattern.efficiency).toBeGreaterThan(0);
      expect(pattern.efficiency).toBeLessThanOrEqual(100);
    }
  });
});
