/**
 * PricingRules.ts
 * Business rules for pricing calculations and discounts
 */

import { DoorModel, DoorType, GlassType, FrameType } from "../door/DoorModel";
import { ProfileSystem } from "../materials/Material.types";

// ============================================================================
// Pricing Rule Types
// ============================================================================

export enum PricingRuleType {
  BASE_PRICE = "base_price",
  SIZE_ADJUSTMENT = "size_adjustment",
  COMPLEXITY = "complexity",
  MATERIAL_QUALITY = "material_quality",
  VOLUME_DISCOUNT = "volume_discount",
  SEASONAL = "seasonal",
  CUSTOMER_TIER = "customer_tier",
  PROMOTION = "promotion",
}

export interface PricingRule {
  id: string;
  name: string;
  type: PricingRuleType;
  description: string;
  priority: number; // Lower = applied first
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  conditions: PricingCondition[];
  adjustment: PriceAdjustment;
}

export interface PricingCondition {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "between";
  value: string | number | boolean | string[] | number[];
}

export interface PriceAdjustment {
  type: "fixed" | "percent" | "multiplier" | "per_unit";
  value: number;
  unit?: "m2" | "panel" | "door" | "meter";
  applyTo: "total" | "material" | "labor" | "specific";
  specificItem?: string;
}

// ============================================================================
// Price Breakdown
// ============================================================================

export interface PriceBreakdown {
  basePrice: number;
  adjustments: {
    rule: PricingRule;
    amount: number;
    description: string;
  }[];
  subtotal: number;
  discounts: {
    rule: PricingRule;
    amount: number;
    description: string;
  }[];
  finalPrice: number;
  pricePerM2: number;
  currency: string;
}

// ============================================================================
// Customer Tiers
// ============================================================================

export enum CustomerTier {
  STANDARD = "standard",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum",
  VIP = "vip",
}

export interface CustomerTierConfig {
  tier: CustomerTier;
  minOrderValue: number; // Minimum total orders
  discountPercent: number;
  paymentTermsDays: number;
  prioritySupport: boolean;
}

const CUSTOMER_TIER_CONFIG: CustomerTierConfig[] = [
  {
    tier: CustomerTier.STANDARD,
    minOrderValue: 0,
    discountPercent: 0,
    paymentTermsDays: 0,
    prioritySupport: false,
  },
  {
    tier: CustomerTier.SILVER,
    minOrderValue: 50000000,
    discountPercent: 3,
    paymentTermsDays: 7,
    prioritySupport: false,
  },
  {
    tier: CustomerTier.GOLD,
    minOrderValue: 200000000,
    discountPercent: 5,
    paymentTermsDays: 15,
    prioritySupport: true,
  },
  {
    tier: CustomerTier.PLATINUM,
    minOrderValue: 500000000,
    discountPercent: 8,
    paymentTermsDays: 30,
    prioritySupport: true,
  },
  {
    tier: CustomerTier.VIP,
    minOrderValue: 1000000000,
    discountPercent: 10,
    paymentTermsDays: 45,
    prioritySupport: true,
  },
];

// ============================================================================
// Base Price Matrix
// ============================================================================

export interface BasePriceMatrix {
  doorType: DoorType;
  profileSystem: ProfileSystem;
  frameType: FrameType;
  pricePerM2: number;
}

const BASE_PRICES: BasePriceMatrix[] = [
  // Xingfa Standard
  {
    doorType: DoorType.SLIDING_2_PANELS,
    profileSystem: ProfileSystem.XINGFA,
    frameType: FrameType.STANDARD,
    pricePerM2: 2800000,
  },
  {
    doorType: DoorType.SLIDING_2_PANELS,
    profileSystem: ProfileSystem.XINGFA,
    frameType: FrameType.HEAVY_DUTY,
    pricePerM2: 3200000,
  },
  {
    doorType: DoorType.SWING_SINGLE,
    profileSystem: ProfileSystem.XINGFA,
    frameType: FrameType.STANDARD,
    pricePerM2: 2500000,
  },
  {
    doorType: DoorType.SWING_DOUBLE,
    profileSystem: ProfileSystem.XINGFA,
    frameType: FrameType.STANDARD,
    pricePerM2: 2600000,
  },
  {
    doorType: DoorType.FOLDING_4_PANELS,
    profileSystem: ProfileSystem.XINGFA,
    frameType: FrameType.STANDARD,
    pricePerM2: 3500000,
  },
  {
    doorType: DoorType.PIVOT,
    profileSystem: ProfileSystem.XINGFA,
    frameType: FrameType.HEAVY_DUTY,
    pricePerM2: 4500000,
  },

  // Viet Phap
  {
    doorType: DoorType.SLIDING_2_PANELS,
    profileSystem: ProfileSystem.VIET_PHAP,
    frameType: FrameType.STANDARD,
    pricePerM2: 2500000,
  },
  {
    doorType: DoorType.SWING_SINGLE,
    profileSystem: ProfileSystem.VIET_PHAP,
    frameType: FrameType.STANDARD,
    pricePerM2: 2200000,
  },
  {
    doorType: DoorType.SWING_DOUBLE,
    profileSystem: ProfileSystem.VIET_PHAP,
    frameType: FrameType.STANDARD,
    pricePerM2: 2300000,
  },

  // PMI
  {
    doorType: DoorType.SLIDING_2_PANELS,
    profileSystem: ProfileSystem.PMI,
    frameType: FrameType.STANDARD,
    pricePerM2: 2300000,
  },
  {
    doorType: DoorType.SWING_SINGLE,
    profileSystem: ProfileSystem.PMI,
    frameType: FrameType.STANDARD,
    pricePerM2: 2000000,
  },
];

// ============================================================================
// Glass Price Adjustments
// ============================================================================

export interface GlassPriceAdjustment {
  glassType: GlassType;
  multiplier: number;
  additionalPerM2: number;
}

const GLASS_ADJUSTMENTS: GlassPriceAdjustment[] = [
  { glassType: GlassType.SINGLE, multiplier: 1.0, additionalPerM2: 0 },
  { glassType: GlassType.DOUBLE, multiplier: 1.0, additionalPerM2: 450000 },
  { glassType: GlassType.TEMPERED, multiplier: 1.0, additionalPerM2: 180000 },
  { glassType: GlassType.LAMINATED, multiplier: 1.0, additionalPerM2: 350000 },
  { glassType: GlassType.LOW_E, multiplier: 1.0, additionalPerM2: 550000 },
  { glassType: GlassType.TRIPLE, multiplier: 1.0, additionalPerM2: 800000 },
];

// ============================================================================
// Pricing Rules Engine
// ============================================================================

export class PricingRules {
  private rules: PricingRule[] = [];
  private basePrices: BasePriceMatrix[] = [...BASE_PRICES];
  private customerTierConfig: CustomerTierConfig[] = [...CUSTOMER_TIER_CONFIG];
  private currency = "VND";

  constructor() {
    this.initializeDefaultRules();
  }

  // --------------------------------------------------------------------------
  // Main Pricing Methods
  // --------------------------------------------------------------------------

  /**
   * Calculate price for a door
   */
  calculatePrice(
    door: DoorModel,
    options?: {
      profileSystem?: ProfileSystem;
      customerTier?: CustomerTier;
      promotionCode?: string;
      quantity?: number;
    }
  ): PriceBreakdown {
    const area = this.calculateArea(door);
    const profileSystem = options?.profileSystem || ProfileSystem.XINGFA;

    // Get base price
    const basePrice = this.getBasePrice(door, profileSystem);
    const basePriceTotal = basePrice * area;

    // Get applicable rules
    const applicableRules = this.getApplicableRules(door, options);

    // Apply adjustments (increases)
    const adjustments: PriceBreakdown["adjustments"] = [];
    let adjustedPrice = basePriceTotal;

    // Glass adjustment
    const glassAdjustment = this.getGlassAdjustment(door, area);
    if (glassAdjustment > 0) {
      adjustments.push({
        rule: this.createVirtualRule(
          "GLASS",
          "Glass Type Adjustment",
          PricingRuleType.MATERIAL_QUALITY
        ),
        amount: glassAdjustment,
        description: `Phụ thu kính ${door.glassType}: +${this.formatCurrency(
          glassAdjustment
        )}`,
      });
      adjustedPrice += glassAdjustment;
    }

    // Size adjustment for non-standard sizes
    const sizeAdjustment = this.getSizeAdjustment(door, basePriceTotal);
    if (sizeAdjustment !== 0) {
      adjustments.push({
        rule: this.createVirtualRule(
          "SIZE",
          "Size Adjustment",
          PricingRuleType.SIZE_ADJUSTMENT
        ),
        amount: sizeAdjustment,
        description:
          sizeAdjustment > 0
            ? `Phụ thu kích thước đặc biệt: +${this.formatCurrency(
                sizeAdjustment
              )}`
            : `Giảm giá kích thước nhỏ: ${this.formatCurrency(sizeAdjustment)}`,
      });
      adjustedPrice += sizeAdjustment;
    }

    // Complexity adjustment
    const complexityAdjustment = this.getComplexityAdjustment(
      door,
      basePriceTotal
    );
    if (complexityAdjustment > 0) {
      adjustments.push({
        rule: this.createVirtualRule(
          "COMPLEXITY",
          "Complexity Adjustment",
          PricingRuleType.COMPLEXITY
        ),
        amount: complexityAdjustment,
        description: `Phụ thu độ phức tạp: +${this.formatCurrency(
          complexityAdjustment
        )}`,
      });
      adjustedPrice += complexityAdjustment;
    }

    // Apply custom rules
    for (const rule of applicableRules.filter((r) => r.adjustment.value > 0)) {
      const amount = this.calculateRuleAdjustment(rule, adjustedPrice, area);
      adjustments.push({
        rule,
        amount,
        description: `${rule.name}: +${this.formatCurrency(amount)}`,
      });
      adjustedPrice += amount;
    }

    const subtotal = adjustedPrice;

    // Apply discounts
    const discounts: PriceBreakdown["discounts"] = [];
    let discountedPrice = subtotal;

    // Customer tier discount
    if (options?.customerTier) {
      const tierDiscount = this.getCustomerTierDiscount(
        options.customerTier,
        subtotal
      );
      if (tierDiscount > 0) {
        discounts.push({
          rule: this.createVirtualRule(
            "TIER",
            `Customer Tier: ${options.customerTier}`,
            PricingRuleType.CUSTOMER_TIER
          ),
          amount: tierDiscount,
          description: `Chiết khấu ${
            options.customerTier
          }: -${this.formatCurrency(tierDiscount)}`,
        });
        discountedPrice -= tierDiscount;
      }
    }

    // Volume discount
    if (options?.quantity && options.quantity > 3) {
      const volumeDiscount = this.getVolumeDiscount(options.quantity, subtotal);
      discounts.push({
        rule: this.createVirtualRule(
          "VOLUME",
          "Volume Discount",
          PricingRuleType.VOLUME_DISCOUNT
        ),
        amount: volumeDiscount,
        description: `Chiết khấu số lượng (${
          options.quantity
        } bộ): -${this.formatCurrency(volumeDiscount)}`,
      });
      discountedPrice -= volumeDiscount;
    }

    // Promotion code
    if (options?.promotionCode) {
      const promoDiscount = this.getPromotionDiscount(
        options.promotionCode,
        subtotal
      );
      if (promoDiscount > 0) {
        discounts.push({
          rule: this.createVirtualRule(
            "PROMO",
            `Promotion: ${options.promotionCode}`,
            PricingRuleType.PROMOTION
          ),
          amount: promoDiscount,
          description: `Mã khuyến mãi ${
            options.promotionCode
          }: -${this.formatCurrency(promoDiscount)}`,
        });
        discountedPrice -= promoDiscount;
      }
    }

    // Apply discount rules
    for (const rule of applicableRules.filter((r) => r.adjustment.value < 0)) {
      const amount = Math.abs(
        this.calculateRuleAdjustment(rule, discountedPrice, area)
      );
      discounts.push({
        rule,
        amount,
        description: `${rule.name}: -${this.formatCurrency(amount)}`,
      });
      discountedPrice -= amount;
    }

    const finalPrice = this.roundPrice(discountedPrice);

    return {
      basePrice: basePriceTotal,
      adjustments,
      subtotal,
      discounts,
      finalPrice,
      pricePerM2: finalPrice / area,
      currency: this.currency,
    };
  }

  // --------------------------------------------------------------------------
  // Price Components
  // --------------------------------------------------------------------------

  private getBasePrice(door: DoorModel, profileSystem: ProfileSystem): number {
    const matrix =
      this.basePrices.find(
        (bp) =>
          bp.doorType === door.type &&
          bp.profileSystem === profileSystem &&
          bp.frameType === door.frameType
      ) ||
      this.basePrices.find(
        (bp) => bp.doorType === door.type && bp.profileSystem === profileSystem
      );

    // Default price if not found
    return matrix?.pricePerM2 || 2500000;
  }

  private getGlassAdjustment(door: DoorModel, area: number): number {
    const adjustment = GLASS_ADJUSTMENTS.find(
      (g) => g.glassType === door.glassType
    );
    if (!adjustment) return 0;

    return area * adjustment.additionalPerM2;
  }

  private getSizeAdjustment(door: DoorModel, basePrice: number): number {
    const area = this.calculateArea(door);

    // Small doors get a premium (minimum charge)
    if (area < 2) {
      return basePrice * 0.1; // 10% premium for small doors
    }

    // Very large doors get a premium
    if (area > 8) {
      return basePrice * ((area - 8) * 0.03); // 3% per m2 over 8m2
    }

    return 0;
  }

  private getComplexityAdjustment(door: DoorModel, basePrice: number): number {
    let complexity = 0;

    // More panels = more complexity
    if (door.panels.length > 2) {
      complexity += (door.panels.length - 2) * 0.05;
    }

    // Mullions and transoms add complexity
    const dividers = door.frames.filter(
      (f) => f.position === "mullion" || f.position === "transom"
    ).length;
    complexity += dividers * 0.03;

    // Special door types
    if (
      door.type === DoorType.FOLDING_4_PANELS ||
      door.type === DoorType.FOLDING_6_PANELS
    ) {
      complexity += 0.15;
    }
    if (door.type === DoorType.PIVOT) {
      complexity += 0.2;
    }
    if (door.type === DoorType.CORNER_SLIDING) {
      complexity += 0.25;
    }

    return basePrice * complexity;
  }

  private getCustomerTierDiscount(tier: CustomerTier, amount: number): number {
    const config = this.customerTierConfig.find((c) => c.tier === tier);
    if (!config) return 0;

    return amount * (config.discountPercent / 100);
  }

  private getVolumeDiscount(quantity: number, amount: number): number {
    let discountPercent = 0;

    if (quantity >= 10) {
      discountPercent = 8;
    } else if (quantity >= 5) {
      discountPercent = 5;
    } else if (quantity >= 3) {
      discountPercent = 3;
    }

    return amount * (discountPercent / 100);
  }

  private getPromotionDiscount(code: string, amount: number): number {
    // Simple promotion code logic - in real app, check against database
    const promotions: Record<string, number> = {
      SUMMER2024: 5,
      NEWYEAR: 10,
      VIP10: 10,
      INTRO15: 15,
    };

    const discountPercent = promotions[code.toUpperCase()] || 0;
    return amount * (discountPercent / 100);
  }

  // --------------------------------------------------------------------------
  // Rule Management
  // --------------------------------------------------------------------------

  private initializeDefaultRules(): void {
    // Seasonal promotion
    this.rules.push({
      id: "seasonal-summer",
      name: "Khuyến mãi hè",
      type: PricingRuleType.SEASONAL,
      description: "Giảm 5% trong mùa hè",
      priority: 100,
      isActive: true,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-08-31"),
      conditions: [],
      adjustment: {
        type: "percent",
        value: -5,
        applyTo: "total",
      },
    });

    // Large order premium
    this.rules.push({
      id: "large-order-handling",
      name: "Phí xử lý đơn hàng lớn",
      type: PricingRuleType.COMPLEXITY,
      description: "Phụ thu 2% cho đơn hàng trên 100 triệu",
      priority: 50,
      isActive: true,
      conditions: [{ field: "orderTotal", operator: "gt", value: 100000000 }],
      adjustment: {
        type: "percent",
        value: 2,
        applyTo: "total",
      },
    });
  }

  private getApplicableRules(
    door: DoorModel,
    options?: Record<string, unknown>
  ): PricingRule[] {
    const now = new Date();

    return this.rules
      .filter((rule) => {
        // Check if active
        if (!rule.isActive) return false;

        // Check date range
        if (rule.startDate && now < rule.startDate) return false;
        if (rule.endDate && now > rule.endDate) return false;

        // Check conditions
        return this.checkConditions(rule.conditions, door, options);
      })
      .sort((a, b) => a.priority - b.priority);
  }

  private checkConditions(
    conditions: PricingCondition[],
    door: DoorModel,
    options?: Record<string, unknown>
  ): boolean {
    for (const condition of conditions) {
      const value = this.getFieldValue(condition.field, door, options);
      if (!this.evaluateCondition(condition, value)) {
        return false;
      }
    }
    return true;
  }

  private getFieldValue(
    field: string,
    door: DoorModel,
    options?: Record<string, unknown>
  ): unknown {
    if (field.startsWith("door.")) {
      const path = field.substring(5).split(".");
      let value: unknown = door;
      for (const key of path) {
        value = (value as Record<string, unknown>)?.[key];
      }
      return value;
    }

    return options?.[field];
  }

  private evaluateCondition(
    condition: PricingCondition,
    value: unknown
  ): boolean {
    switch (condition.operator) {
      case "eq":
        return value === condition.value;
      case "ne":
        return value !== condition.value;
      case "gt":
        return (value as number) > (condition.value as number);
      case "gte":
        return (value as number) >= (condition.value as number);
      case "lt":
        return (value as number) < (condition.value as number);
      case "lte":
        return (value as number) <= (condition.value as number);
      case "in":
        return (condition.value as unknown[]).includes(value);
      case "between":
        const [min, max] = condition.value as number[];
        return (value as number) >= min && (value as number) <= max;
      default:
        return true;
    }
  }

  private calculateRuleAdjustment(
    rule: PricingRule,
    currentPrice: number,
    area: number
  ): number {
    const adj = rule.adjustment;

    switch (adj.type) {
      case "fixed":
        return adj.value;
      case "percent":
        return currentPrice * (adj.value / 100);
      case "multiplier":
        return currentPrice * (adj.value - 1);
      case "per_unit":
        switch (adj.unit) {
          case "m2":
            return adj.value * area;
          case "panel":
            return adj.value; // Would need panel count
          default:
            return adj.value;
        }
      default:
        return 0;
    }
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private calculateArea(door: DoorModel): number {
    return (door.dimensions.width * door.dimensions.height) / 1000000;
  }

  private roundPrice(price: number, roundTo = 1000): number {
    return Math.ceil(price / roundTo) * roundTo;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private createVirtualRule(
    id: string,
    name: string,
    type: PricingRuleType
  ): PricingRule {
    return {
      id,
      name,
      type,
      description: "",
      priority: 0,
      isActive: true,
      conditions: [],
      adjustment: { type: "fixed", value: 0, applyTo: "total" },
    };
  }

  // --------------------------------------------------------------------------
  // Rule CRUD
  // --------------------------------------------------------------------------

  addRule(rule: PricingRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  updateRule(ruleId: string, updates: Partial<PricingRule>): void {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index >= 0) {
      this.rules[index] = { ...this.rules[index], ...updates };
      this.rules.sort((a, b) => a.priority - b.priority);
    }
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  getRules(): PricingRule[] {
    return [...this.rules];
  }

  // --------------------------------------------------------------------------
  // Base Price Management
  // --------------------------------------------------------------------------

  setBasePrice(
    doorType: DoorType,
    profileSystem: ProfileSystem,
    frameType: FrameType,
    pricePerM2: number
  ): void {
    const index = this.basePrices.findIndex(
      (bp) =>
        bp.doorType === doorType &&
        bp.profileSystem === profileSystem &&
        bp.frameType === frameType
    );

    if (index >= 0) {
      this.basePrices[index].pricePerM2 = pricePerM2;
    } else {
      this.basePrices.push({ doorType, profileSystem, frameType, pricePerM2 });
    }
  }

  getBasePrices(): BasePriceMatrix[] {
    return [...this.basePrices];
  }

  // --------------------------------------------------------------------------
  // Customer Tier Management
  // --------------------------------------------------------------------------

  getCustomerTierConfig(tier: CustomerTier): CustomerTierConfig | undefined {
    return this.customerTierConfig.find((c) => c.tier === tier);
  }

  setCustomerTierConfig(config: CustomerTierConfig): void {
    const index = this.customerTierConfig.findIndex(
      (c) => c.tier === config.tier
    );
    if (index >= 0) {
      this.customerTierConfig[index] = config;
    }
  }

  determineCustomerTier(totalOrderValue: number): CustomerTier {
    const sortedTiers = [...this.customerTierConfig].sort(
      (a, b) => b.minOrderValue - a.minOrderValue
    );

    for (const tier of sortedTiers) {
      if (totalOrderValue >= tier.minOrderValue) {
        return tier.tier;
      }
    }

    return CustomerTier.STANDARD;
  }
}

// ============================================================================
// Quick Price Estimate
// ============================================================================

export function getQuickEstimate(
  width: number,
  height: number,
  doorType: DoorType,
  profileSystem: ProfileSystem = ProfileSystem.XINGFA,
  glassType: GlassType = GlassType.SINGLE
): {
  area: number;
  estimatedPrice: number;
  pricePerM2: number;
  breakdown: string;
} {
  const area = (width * height) / 1000000;

  // Find base price
  const baseMatrix = BASE_PRICES.find(
    (bp) => bp.doorType === doorType && bp.profileSystem === profileSystem
  );
  const basePricePerM2 = baseMatrix?.pricePerM2 || 2500000;

  // Glass adjustment
  const glassAdj = GLASS_ADJUSTMENTS.find((g) => g.glassType === glassType);
  const glassAddition = glassAdj?.additionalPerM2 || 0;

  const pricePerM2 = basePricePerM2 + glassAddition;
  const estimatedPrice = Math.ceil((area * pricePerM2) / 1000) * 1000;

  return {
    area,
    estimatedPrice,
    pricePerM2,
    breakdown: `
      Diện tích: ${area.toFixed(2)} m²
      Giá cơ bản: ${basePricePerM2.toLocaleString()} VND/m²
      Phụ thu kính: ${glassAddition.toLocaleString()} VND/m²
      Tổng: ${estimatedPrice.toLocaleString()} VND
    `.trim(),
  };
}
