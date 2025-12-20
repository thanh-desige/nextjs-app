/**
 * QuantityEngine.ts
 * Engine chính cho module Phân tích - Bóc tách
 *
 * Chức năng:
 * - Orchestrate tính toán bóc tách nhôm + kính
 * - Tích hợp với CadDocument để lấy entities
 * - Xuất báo cáo bóc tách
 *
 * TUÂN THỦ ĐIỀU KIỆN 1 & 2:
 * - Đọc entities từ Document (không modify)
 * - Chỉ tính toán, không thay đổi state
 */

import {
  QuantityResult,
  QuantitySummary,
  AluminumQuantity,
  GlassQuantity,
} from "./Quantity.types";
import { AluminumCalculator, aluminumCalculator } from "./AluminumCalculator";
import { GlassCalculator, glassCalculator } from "./GlassCalculator";
import { CadDocument } from "../document/CadDocument";

// ============================================
// DOOR INFO INTERFACE
// ============================================

export interface DoorInfo {
  entityId: string;
  doorType: string;
  width: number;
  height: number;
  glassCode: string;
  glassOpenings?: Array<{
    width: number;
    height: number;
    quantity?: number;
  }>;
}

// ============================================
// QUANTITY ENGINE CLASS
// ============================================

export class QuantityEngine {
  private aluminumCalc: AluminumCalculator;
  private glassCalc: GlassCalculator;

  constructor(aluminumCalc?: AluminumCalculator, glassCalc?: GlassCalculator) {
    this.aluminumCalc = aluminumCalc ?? aluminumCalculator;
    this.glassCalc = glassCalc ?? glassCalculator;
  }

  // ==================== Main Calculation ====================

  /**
   * Tính toán bóc tách cho danh sách cửa
   */
  calculate(doors: DoorInfo[]): QuantityResult {
    const aluminumResults: AluminumQuantity[] = [];
    const glassResults: GlassQuantity[] = [];

    for (const door of doors) {
      // Tính nhôm
      const aluminum = this.aluminumCalc.calculateForDoor(
        door.entityId,
        door.doorType,
        { width: door.width, height: door.height }
      );
      aluminumResults.push(aluminum);

      // Tính kính
      if (door.glassOpenings && door.glassOpenings.length > 0) {
        const glass = this.glassCalc.calculateForDoor(
          door.entityId,
          door.glassCode,
          door.glassOpenings
        );
        glassResults.push(glass);
      } else {
        // Mặc định: 1 ô kính
        const glass = this.glassCalc.calculateSimpleDoor(
          door.entityId,
          door.width,
          door.height,
          door.glassCode
        );
        glassResults.push(glass);
      }
    }

    // Tổng hợp
    const summary = this.summarize(aluminumResults, glassResults);

    return {
      calculatedAt: new Date(),
      aluminum: aluminumResults,
      glass: glassResults,
      summary,
    };
  }

  /**
   * Tính toán từ CadDocument
   * Lấy các door entities và tính bóc tách
   */
  calculateFromDocument(
    document: CadDocument,
    doorTypeResolver: (entityId: string) => DoorInfo | null
  ): QuantityResult {
    const entities = document.getAllCanvasEntities();
    const doors: DoorInfo[] = [];

    for (const entity of entities) {
      const doorInfo = doorTypeResolver(entity.id);
      if (doorInfo) {
        doors.push(doorInfo);
      }
    }

    return this.calculate(doors);
  }

  // ==================== Summary ====================

  /**
   * Tạo tổng hợp từ kết quả bóc tách
   */
  private summarize(
    aluminum: AluminumQuantity[],
    glass: GlassQuantity[]
  ): QuantitySummary {
    const aluminumSummary = this.aluminumCalc.summarize(aluminum);
    const glassSummary = this.glassCalc.summarize(glass);

    return {
      totalAluminumWeight: aluminumSummary.total.weight,
      totalAluminumPrice: aluminumSummary.total.price,
      totalGlassArea: glassSummary.total.area,
      totalGlassPrice: glassSummary.total.price,
      totalMaterialPrice:
        aluminumSummary.total.price + glassSummary.total.price,
    };
  }

  // ==================== Optimization ====================

  /**
   * Tối ưu cắt tổng hợp
   */
  optimizeCutting(result: QuantityResult): {
    aluminum: ReturnType<AluminumCalculator["optimizeCuts"]>;
    glass: ReturnType<GlassCalculator["optimizeSheetCutting"]>;
  } {
    // Collect all aluminum cuts
    const allAluminumCuts: { length: number; quantity: number }[] = [];
    for (const qty of result.aluminum) {
      for (const cut of qty.cuts) {
        allAluminumCuts.push({
          length: cut.length,
          quantity: cut.quantity,
        });
      }
    }

    // Collect all glass pieces
    const allGlassPieces: {
      width: number;
      height: number;
      quantity: number;
    }[] = [];
    for (const qty of result.glass) {
      for (const piece of qty.pieces) {
        allGlassPieces.push({
          width: piece.width,
          height: piece.height,
          quantity: piece.quantity,
        });
      }
    }

    return {
      aluminum: this.aluminumCalc.optimizeCuts(allAluminumCuts),
      glass: this.glassCalc.optimizeSheetCutting(allGlassPieces),
    };
  }

  // ==================== Export ====================

  /**
   * Xuất báo cáo dạng text
   */
  exportTextReport(result: QuantityResult): string {
    const lines: string[] = [];

    lines.push("=".repeat(60));
    lines.push("BÁO CÁO BÓC TÁCH VẬT LIỆU");
    lines.push(`Ngày: ${result.calculatedAt.toLocaleString("vi-VN")}`);
    lines.push("=".repeat(60));

    // Nhôm
    lines.push("\n📦 BÓC TÁCH NHÔM");
    lines.push("-".repeat(40));
    for (const qty of result.aluminum) {
      lines.push(`\nCửa: ${qty.doorType} (${qty.entityId})`);
      for (const cut of qty.cuts) {
        lines.push(
          `  - ${cut.profile.name}: ${cut.length}mm x ${cut.quantity} thanh`
        );
      }
      lines.push(
        `  Tổng: ${qty.totalWeight}kg - ${qty.totalPrice.toLocaleString(
          "vi-VN"
        )}đ`
      );
    }

    // Kính
    lines.push("\n📦 BÓC TÁCH KÍNH");
    lines.push("-".repeat(40));
    for (const qty of result.glass) {
      lines.push(`\nCửa: ${qty.entityId}`);
      for (const piece of qty.pieces) {
        lines.push(
          `  - ${piece.glass.type} ${piece.glass.thickness}mm: ${piece.width}x${piece.height}mm x ${piece.quantity}`
        );
      }
      lines.push(
        `  Tổng: ${qty.totalArea}m² - ${qty.totalPrice.toLocaleString(
          "vi-VN"
        )}đ`
      );
    }

    // Tổng hợp
    lines.push("\n" + "=".repeat(60));
    lines.push("TỔNG HỢP");
    lines.push("=".repeat(60));
    lines.push(
      `Nhôm: ${
        result.summary.totalAluminumWeight
      }kg - ${result.summary.totalAluminumPrice.toLocaleString("vi-VN")}đ`
    );
    lines.push(
      `Kính: ${
        result.summary.totalGlassArea
      }m² - ${result.summary.totalGlassPrice.toLocaleString("vi-VN")}đ`
    );
    lines.push(
      `TỔNG GIÁ VẬT LIỆU: ${result.summary.totalMaterialPrice.toLocaleString(
        "vi-VN"
      )}đ`
    );

    return lines.join("\n");
  }

  /**
   * Xuất báo cáo dạng JSON
   */
  exportJson(result: QuantityResult): string {
    return JSON.stringify(result, null, 2);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const quantityEngine = new QuantityEngine();

export default QuantityEngine;
