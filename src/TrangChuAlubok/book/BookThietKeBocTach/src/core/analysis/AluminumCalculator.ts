/**
 * AluminumCalculator.ts
 * Tính toán bóc tách khối lượng nhôm
 *
 * Chức năng:
 * - Tính toán danh sách cắt profile
 * - Tính tổng trọng lượng nhôm
 * - Tính tổng giá nhôm
 * - Tối ưu cắt thanh (cut optimization)
 */

import {
  AluminumQuantity,
  ProfileCut,
  ProfileSpec,
  CutType,
  ProfileCategory,
} from "./Quantity.types";
import { ProfileMapping, profileMapping } from "./ProfileMapping";

// ============================================
// ALUMINUM CALCULATOR CLASS
// ============================================

export class AluminumCalculator {
  private profileMapping: ProfileMapping;

  constructor(mapping?: ProfileMapping) {
    this.profileMapping = mapping ?? profileMapping;
  }

  // ==================== Main Calculation ====================

  /**
   * Tính toán bóc tách nhôm cho một cửa
   */
  calculateForDoor(
    entityId: string,
    doorType: string,
    dimensions: { width: number; height: number }
  ): AluminumQuantity {
    const cuts = this.profileMapping.calculateCutsForDoor(doorType, dimensions);

    const profileCuts: ProfileCut[] = [];
    let totalWeight = 0;
    let totalPrice = 0;

    for (const cut of cuts) {
      const profile = this.profileMapping.getProfile(cut.profileCode);
      if (!profile) continue;

      const lengthInMeters = cut.length / 1000;
      const weight = profile.weightPerMeter * lengthInMeters * cut.quantity;
      const price = profile.pricePerMeter * lengthInMeters * cut.quantity;

      profileCuts.push({
        profile,
        length: cut.length,
        quantity: cut.quantity,
        cutType1: cut.cutType,
        cutType2: cut.cutType,
      });

      totalWeight += weight;
      totalPrice += price;
    }

    return {
      entityId,
      doorType,
      cuts: profileCuts,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalPrice: Math.round(totalPrice),
    };
  }

  /**
   * Tính toán bóc tách cho nhiều cửa
   */
  calculateForMultipleDoors(
    doors: Array<{
      entityId: string;
      doorType: string;
      width: number;
      height: number;
    }>
  ): AluminumQuantity[] {
    return doors.map((door) =>
      this.calculateForDoor(door.entityId, door.doorType, {
        width: door.width,
        height: door.height,
      })
    );
  }

  // ==================== Cut Optimization ====================

  /**
   * Tối ưu cắt thanh - giảm hao phí
   * Sử dụng thuật toán First Fit Decreasing (FFD)
   */
  optimizeCuts(
    cuts: { length: number; quantity: number }[],
    standardLength: number = 6000
  ): {
    bars: { cuts: number[]; waste: number }[];
    totalBars: number;
    totalWaste: number;
    wastePercentage: number;
  } {
    // Expand cuts thành mảng đơn
    const allCuts: number[] = [];
    for (const cut of cuts) {
      for (let i = 0; i < cut.quantity; i++) {
        allCuts.push(cut.length);
      }
    }

    // Sort giảm dần (FFD)
    allCuts.sort((a, b) => b - a);

    // Allocate cuts to bars
    const bars: { cuts: number[]; remaining: number }[] = [];

    for (const cutLength of allCuts) {
      // Tìm thanh có thể chứa cut này
      let placed = false;
      for (const bar of bars) {
        if (bar.remaining >= cutLength) {
          bar.cuts.push(cutLength);
          bar.remaining -= cutLength;
          placed = true;
          break;
        }
      }

      // Nếu không tìm được, tạo thanh mới
      if (!placed) {
        bars.push({
          cuts: [cutLength],
          remaining: standardLength - cutLength,
        });
      }
    }

    // Calculate results
    const totalWaste = bars.reduce((sum, bar) => sum + bar.remaining, 0);
    const totalMaterial = bars.length * standardLength;

    return {
      bars: bars.map((bar) => ({
        cuts: bar.cuts,
        waste: bar.remaining,
      })),
      totalBars: bars.length,
      totalWaste,
      wastePercentage: Math.round((totalWaste / totalMaterial) * 10000) / 100,
    };
  }

  // ==================== Summary ====================

  /**
   * Tổng hợp bóc tách nhôm
   */
  summarize(quantities: AluminumQuantity[]): {
    byProfile: Map<string, { length: number; weight: number; price: number }>;
    byCategory: Map<
      ProfileCategory,
      { length: number; weight: number; price: number }
    >;
    total: { weight: number; price: number };
  } {
    const byProfile = new Map<
      string,
      { length: number; weight: number; price: number }
    >();
    const byCategory = new Map<
      ProfileCategory,
      { length: number; weight: number; price: number }
    >();

    let totalWeight = 0;
    let totalPrice = 0;

    for (const qty of quantities) {
      for (const cut of qty.cuts) {
        const profile = cut.profile;
        const lengthInMeters = (cut.length * cut.quantity) / 1000;
        const weight = profile.weightPerMeter * lengthInMeters;
        const price = profile.pricePerMeter * lengthInMeters;

        // By profile
        const existing = byProfile.get(profile.code) ?? {
          length: 0,
          weight: 0,
          price: 0,
        };
        byProfile.set(profile.code, {
          length: existing.length + cut.length * cut.quantity,
          weight: existing.weight + weight,
          price: existing.price + price,
        });

        // By category
        const catExisting = byCategory.get(profile.category) ?? {
          length: 0,
          weight: 0,
          price: 0,
        };
        byCategory.set(profile.category, {
          length: catExisting.length + cut.length * cut.quantity,
          weight: catExisting.weight + weight,
          price: catExisting.price + price,
        });

        totalWeight += weight;
        totalPrice += price;
      }
    }

    return {
      byProfile,
      byCategory,
      total: {
        weight: Math.round(totalWeight * 100) / 100,
        price: Math.round(totalPrice),
      },
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const aluminumCalculator = new AluminumCalculator();

export default AluminumCalculator;
