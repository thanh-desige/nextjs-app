/**
 * GlassCalculator.ts
 * Tính toán bóc tách khối lượng kính
 *
 * Chức năng:
 * - Tính toán kích thước kính từ khung cửa
 * - Tính diện tích kính
 * - Tính tổng giá kính
 * - Tối ưu cắt kính (sheet optimization)
 */

import {
  GlassQuantity,
  GlassPiece,
  GlassSpec,
  GlassType,
} from "./Quantity.types";

// ============================================
// GLASS DATABASE
// ============================================

/**
 * Database các loại kính
 * TODO: Load từ file config hoặc database
 */
const GLASS_DATABASE: Map<string, GlassSpec> = new Map([
  [
    "clear-5",
    {
      type: GlassType.SINGLE,
      thickness: 5,
      color: "Trong suốt",
      pricePerSqm: 150000,
      weightPerSqm: 12.5, // 2.5 kg/mm/m²
    },
  ],
  [
    "clear-8",
    {
      type: GlassType.SINGLE,
      thickness: 8,
      color: "Trong suốt",
      pricePerSqm: 240000,
      weightPerSqm: 20,
    },
  ],
  [
    "tempered-8",
    {
      type: GlassType.TEMPERED,
      thickness: 8,
      color: "Trong suốt",
      pricePerSqm: 380000,
      weightPerSqm: 20,
    },
  ],
  [
    "tempered-10",
    {
      type: GlassType.TEMPERED,
      thickness: 10,
      color: "Trong suốt",
      pricePerSqm: 450000,
      weightPerSqm: 25,
    },
  ],
  [
    "tempered-12",
    {
      type: GlassType.TEMPERED,
      thickness: 12,
      color: "Trong suốt",
      pricePerSqm: 520000,
      weightPerSqm: 30,
    },
  ],
  [
    "laminated-6.38",
    {
      type: GlassType.LAMINATED,
      thickness: 6.38, // 3mm + 0.38pvb + 3mm
      color: "Trong suốt",
      pricePerSqm: 420000,
      weightPerSqm: 16,
    },
  ],
  [
    "laminated-8.38",
    {
      type: GlassType.LAMINATED,
      thickness: 8.38, // 4mm + 0.38pvb + 4mm
      color: "Trong suốt",
      pricePerSqm: 520000,
      weightPerSqm: 21,
    },
  ],
  [
    "insulated-5-12-5",
    {
      type: GlassType.INSULATED,
      thickness: 22, // 5mm + 12air + 5mm
      color: "Trong suốt",
      pricePerSqm: 680000,
      weightPerSqm: 25,
    },
  ],
  [
    "low-e-6-12-6",
    {
      type: GlassType.LOW_E,
      thickness: 24, // 6mm + 12air + 6mm Low-E
      color: "Low-E xanh",
      pricePerSqm: 950000,
      weightPerSqm: 30,
    },
  ],
]);

// ============================================
// GLASS CALCULATOR CLASS
// ============================================

export class GlassCalculator {
  private glassDatabase: Map<string, GlassSpec>;

  constructor() {
    this.glassDatabase = new Map(GLASS_DATABASE);
  }

  // ==================== Glass Management ====================

  /**
   * Lấy thông tin kính
   */
  getGlass(code: string): GlassSpec | undefined {
    return this.glassDatabase.get(code);
  }

  /**
   * Lấy tất cả kính theo loại
   */
  getGlassByType(type: GlassType): GlassSpec[] {
    return Array.from(this.glassDatabase.values()).filter(
      (g) => g.type === type
    );
  }

  /**
   * Thêm loại kính mới
   */
  addGlass(code: string, spec: GlassSpec): void {
    this.glassDatabase.set(code, spec);
  }

  // ==================== Calculation ====================

  /**
   * Tính kích thước kính từ kích thước ô kính
   * Trừ đi khe hở cho nẹp và ron
   */
  calculateGlassSize(
    openingWidth: number,
    openingHeight: number,
    gap: number = 10 // mm mỗi bên
  ): { width: number; height: number } {
    return {
      width: openingWidth - gap * 2,
      height: openingHeight - gap * 2,
    };
  }

  /**
   * Tính toán bóc tách kính cho một cửa
   */
  calculateForDoor(
    entityId: string,
    glassCode: string,
    openings: Array<{ width: number; height: number; quantity?: number }>
  ): GlassQuantity {
    const glass = this.getGlass(glassCode);
    if (!glass) {
      throw new Error(`Glass not found: ${glassCode}`);
    }

    const pieces: GlassPiece[] = [];
    let totalArea = 0;
    let totalWeight = 0;
    let totalPrice = 0;

    for (const opening of openings) {
      const size = this.calculateGlassSize(opening.width, opening.height);
      const quantity = opening.quantity ?? 1;
      const areaSqm = (size.width * size.height * quantity) / 1000000; // mm² → m²

      const weight = glass.weightPerSqm * areaSqm;
      const price = glass.pricePerSqm * areaSqm;

      pieces.push({
        glass,
        width: size.width,
        height: size.height,
        quantity,
        area: Math.round(areaSqm * 100) / 100,
      });

      totalArea += areaSqm;
      totalWeight += weight;
      totalPrice += price;
    }

    return {
      entityId,
      pieces,
      totalArea: Math.round(totalArea * 100) / 100,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalPrice: Math.round(totalPrice),
    };
  }

  /**
   * Tính kính cho cửa đơn giản (1 ô kính)
   */
  calculateSimpleDoor(
    entityId: string,
    doorWidth: number,
    doorHeight: number,
    glassCode: string,
    frameDeduction: number = 100 // mm trừ cho khung
  ): GlassQuantity {
    const openingWidth = doorWidth - frameDeduction;
    const openingHeight = doorHeight - frameDeduction;

    return this.calculateForDoor(entityId, glassCode, [
      { width: openingWidth, height: openingHeight, quantity: 1 },
    ]);
  }

  // ==================== Sheet Optimization ====================

  /**
   * Tối ưu cắt kính từ tấm lớn
   * Sử dụng thuật toán Guillotine Cut
   */
  optimizeSheetCutting(
    pieces: Array<{ width: number; height: number; quantity: number }>,
    sheetWidth: number = 2440, // mm (standard sheet)
    sheetHeight: number = 3660 // mm
  ): {
    sheets: Array<{
      pieces: Array<{ width: number; height: number; x: number; y: number }>;
      waste: number;
    }>;
    totalSheets: number;
    totalWaste: number;
    wastePercentage: number;
  } {
    // Expand pieces
    const allPieces: Array<{ width: number; height: number }> = [];
    for (const piece of pieces) {
      for (let i = 0; i < piece.quantity; i++) {
        allPieces.push({ width: piece.width, height: piece.height });
      }
    }

    // Sort by area (largest first)
    allPieces.sort((a, b) => b.width * b.height - a.width * a.height);

    // Simple placement algorithm (can be improved with more sophisticated algorithms)
    const sheets: Array<{
      pieces: Array<{ width: number; height: number; x: number; y: number }>;
      usedArea: number;
    }> = [];

    const sheetArea = sheetWidth * sheetHeight;

    for (const piece of allPieces) {
      let placed = false;

      // Try to place in existing sheets
      for (const sheet of sheets) {
        // Simple check - just track used area for now
        // Real implementation would need proper 2D bin packing
        if (sheet.usedArea + piece.width * piece.height <= sheetArea * 0.85) {
          sheet.pieces.push({ ...piece, x: 0, y: 0 }); // Placeholder positions
          sheet.usedArea += piece.width * piece.height;
          placed = true;
          break;
        }
      }

      if (!placed) {
        sheets.push({
          pieces: [{ ...piece, x: 0, y: 0 }],
          usedArea: piece.width * piece.height,
        });
      }
    }

    // Calculate waste
    const totalSheetArea = sheets.length * sheetArea;
    const totalUsedArea = sheets.reduce((sum, s) => sum + s.usedArea, 0);
    const totalWaste = totalSheetArea - totalUsedArea;

    return {
      sheets: sheets.map((s) => ({
        pieces: s.pieces,
        waste: sheetArea - s.usedArea,
      })),
      totalSheets: sheets.length,
      totalWaste,
      wastePercentage: Math.round((totalWaste / totalSheetArea) * 10000) / 100,
    };
  }

  // ==================== Summary ====================

  /**
   * Tổng hợp bóc tách kính
   */
  summarize(quantities: GlassQuantity[]): {
    byType: Map<GlassType, { area: number; weight: number; price: number }>;
    byThickness: Map<number, { area: number; weight: number; price: number }>;
    total: { area: number; weight: number; price: number };
  } {
    const byType = new Map<
      GlassType,
      { area: number; weight: number; price: number }
    >();
    const byThickness = new Map<
      number,
      { area: number; weight: number; price: number }
    >();

    let totalArea = 0;
    let totalWeight = 0;
    let totalPrice = 0;

    for (const qty of quantities) {
      for (const piece of qty.pieces) {
        const glass = piece.glass;
        const area = piece.area;
        const weight = glass.weightPerSqm * area;
        const price = glass.pricePerSqm * area;

        // By type
        const typeExisting = byType.get(glass.type) ?? {
          area: 0,
          weight: 0,
          price: 0,
        };
        byType.set(glass.type, {
          area: typeExisting.area + area,
          weight: typeExisting.weight + weight,
          price: typeExisting.price + price,
        });

        // By thickness
        const thickExisting = byThickness.get(glass.thickness) ?? {
          area: 0,
          weight: 0,
          price: 0,
        };
        byThickness.set(glass.thickness, {
          area: thickExisting.area + area,
          weight: thickExisting.weight + weight,
          price: thickExisting.price + price,
        });

        totalArea += area;
        totalWeight += weight;
        totalPrice += price;
      }
    }

    return {
      byType,
      byThickness,
      total: {
        area: Math.round(totalArea * 100) / 100,
        weight: Math.round(totalWeight * 100) / 100,
        price: Math.round(totalPrice),
      },
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const glassCalculator = new GlassCalculator();

export default GlassCalculator;
