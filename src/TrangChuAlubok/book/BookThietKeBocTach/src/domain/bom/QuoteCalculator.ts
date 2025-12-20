/**
 * QuoteCalculator.ts
 * Calculate pricing and generate quotes for door projects
 */

import { BomDocument, BomItem, BomItemType } from "./BomItem";

// ============================================================================
// Pricing Configuration
// ============================================================================

export interface PricingConfig {
  // Labor rates
  laborRatePerHour: number; // VND/hour
  installationRatePerM2: number; // VND/m2

  // Markup percentages
  materialMarkup: number; // % markup on materials
  laborMarkup: number; // % markup on labor
  overheadPercent: number; // % overhead
  profitMargin: number; // % profit margin

  // Discounts
  volumeDiscountThreshold: number; // m2 for volume discount
  volumeDiscountPercent: number; // % discount

  // Taxes
  vatPercent: number; // VAT percentage

  // Currency
  currency: string;
  roundTo: number; // Round prices to this amount
}

const DEFAULT_PRICING: PricingConfig = {
  laborRatePerHour: 100000,
  installationRatePerM2: 150000,
  materialMarkup: 15,
  laborMarkup: 10,
  overheadPercent: 10,
  profitMargin: 20,
  volumeDiscountThreshold: 50,
  volumeDiscountPercent: 5,
  vatPercent: 10,
  currency: "VND",
  roundTo: 1000,
};

// ============================================================================
// Quote Types
// ============================================================================

export interface QuoteLineItem {
  id: string;
  description: string;
  category: "material" | "labor" | "installation" | "overhead" | "other";
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  discountPercent?: number;
  discountedPrice?: number;
  notes?: string;
}

export interface QuoteSummary {
  // Subtotals
  materialSubtotal: number;
  laborSubtotal: number;
  installationSubtotal: number;
  overheadAmount: number;

  // Totals before adjustments
  subtotal: number;

  // Adjustments
  discountAmount: number;
  discountPercent: number;

  // Taxes
  taxableAmount: number;
  vatAmount: number;

  // Final
  grandTotal: number;

  // Per unit metrics
  pricePerM2: number;
  totalArea: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  version: number;

  // Customer
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;

  // Project
  projectId: string;
  projectName: string;
  projectAddress?: string;

  // Items
  lineItems: QuoteLineItem[];
  summary: QuoteSummary;

  // Terms
  validUntil: Date;
  paymentTerms: string;
  deliveryTerms: string;
  warrantyTerms: string;

  // Status
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "revised";

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  notes?: string;
  internalNotes?: string;
}

// ============================================================================
// Quote Calculator
// ============================================================================

export class QuoteCalculator {
  private config: PricingConfig;

  constructor(config?: Partial<PricingConfig>) {
    this.config = { ...DEFAULT_PRICING, ...config };
  }

  // --------------------------------------------------------------------------
  // Quote Generation
  // --------------------------------------------------------------------------

  /**
   * Generate quote from BOM
   */
  generateQuote(
    bom: BomDocument,
    customer: {
      id?: string;
      name: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    options?: {
      customDiscount?: number;
      includeInstallation?: boolean;
      validDays?: number;
      notes?: string;
    }
  ): Quote {
    const lineItems = this.generateLineItems(
      bom,
      options?.includeInstallation ?? true
    );
    const summary = this.calculateSummary(
      lineItems,
      bom,
      options?.customDiscount
    );

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (options?.validDays ?? 30));

    return {
      id: this.generateQuoteId(),
      quoteNumber: this.generateQuoteNumber(),
      version: 1,
      customerId: customer.id,
      customerName: customer.name,
      customerAddress: customer.address,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      projectId: bom.projectId,
      projectName: bom.projectName,
      lineItems,
      summary,
      validUntil,
      paymentTerms: "Đặt cọc 50%, thanh toán nốt khi hoàn thành",
      deliveryTerms: "Giao hàng trong 15-20 ngày làm việc",
      warrantyTerms: "Bảo hành 12 tháng cho khung nhôm, 24 tháng cho phụ kiện",
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: bom.createdBy,
      notes: options?.notes,
    };
  }

  // --------------------------------------------------------------------------
  // Line Items Generation
  // --------------------------------------------------------------------------

  private generateLineItems(
    bom: BomDocument,
    includeInstallation: boolean
  ): QuoteLineItem[] {
    const lineItems: QuoteLineItem[] = [];
    let itemIndex = 1;

    // Group BOM items by type
    const profileItems = bom.items.filter(
      (i) => i.type === BomItemType.PROFILE
    );
    const glassItems = bom.items.filter((i) => i.type === BomItemType.GLASS);
    const accessoryItems = bom.items.filter(
      (i) => i.type === BomItemType.ACCESSORY
    );

    // Add profile line items
    if (profileItems.length > 0) {
      const profileTotal = this.calculateItemsTotal(profileItems);
      lineItems.push({
        id: `line-${itemIndex++}`,
        description: "Khung nhôm (Aluminum Profiles)",
        category: "material",
        quantity: 1,
        unit: "bộ",
        unitPrice: profileTotal,
        totalPrice: this.applyMarkup(profileTotal, this.config.materialMarkup),
      });
    }

    // Add individual profile details as sub-items
    for (const item of profileItems) {
      const totalPrice = item.discountedPrice ?? item.totalPrice;
      lineItems.push({
        id: `line-${itemIndex++}`,
        description: `  - ${item.material.name}`,
        category: "material",
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: this.applyMarkup(totalPrice, this.config.materialMarkup),
        notes: item.position,
      });
    }

    // Add glass line items
    if (glassItems.length > 0) {
      const glassTotal = this.calculateItemsTotal(glassItems);
      lineItems.push({
        id: `line-${itemIndex++}`,
        description: "Kính (Glass)",
        category: "material",
        quantity: 1,
        unit: "bộ",
        unitPrice: glassTotal,
        totalPrice: this.applyMarkup(glassTotal, this.config.materialMarkup),
      });
    }

    // Add individual glass details
    for (const item of glassItems) {
      const totalPrice = item.discountedPrice ?? item.totalPrice;
      lineItems.push({
        id: `line-${itemIndex++}`,
        description: `  - ${item.material.name}`,
        category: "material",
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: this.applyMarkup(totalPrice, this.config.materialMarkup),
        notes: `${item.totalArea?.toFixed(2)} m²`,
      });
    }

    // Add accessory line items
    if (accessoryItems.length > 0) {
      const accessoryTotal = this.calculateItemsTotal(accessoryItems);
      lineItems.push({
        id: `line-${itemIndex++}`,
        description: "Phụ kiện (Accessories)",
        category: "material",
        quantity: 1,
        unit: "bộ",
        unitPrice: accessoryTotal,
        totalPrice: this.applyMarkup(
          accessoryTotal,
          this.config.materialMarkup
        ),
      });
    }

    // Add individual accessory details
    for (const item of accessoryItems) {
      const totalPrice = item.discountedPrice ?? item.totalPrice;
      lineItems.push({
        id: `line-${itemIndex++}`,
        description: `  - ${item.material.name}`,
        category: "material",
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: this.applyMarkup(totalPrice, this.config.materialMarkup),
      });
    }

    // Add labor
    const laborCost = this.applyMarkup(
      bom.summary.laborCost,
      this.config.laborMarkup
    );
    lineItems.push({
      id: `line-${itemIndex++}`,
      description: "Nhân công gia công (Fabrication Labor)",
      category: "labor",
      quantity: 1,
      unit: "công",
      unitPrice: laborCost,
      totalPrice: laborCost,
    });

    // Add installation if requested
    if (includeInstallation) {
      const area = this.calculateTotalArea(bom);
      const installationCost = area * this.config.installationRatePerM2;
      lineItems.push({
        id: `line-${itemIndex++}`,
        description: "Lắp đặt tại công trình (Installation)",
        category: "installation",
        quantity: area,
        unit: "m²",
        unitPrice: this.config.installationRatePerM2,
        totalPrice: this.roundPrice(installationCost),
      });
    }

    return lineItems;
  }

  // --------------------------------------------------------------------------
  // Summary Calculation
  // --------------------------------------------------------------------------

  private calculateSummary(
    lineItems: QuoteLineItem[],
    bom: BomDocument,
    customDiscount?: number
  ): QuoteSummary {
    // Calculate subtotals
    const materialSubtotal = lineItems
      .filter((i) => i.category === "material")
      .reduce((sum, i) => sum + (i.discountedPrice ?? i.totalPrice), 0);

    const laborSubtotal = lineItems
      .filter((i) => i.category === "labor")
      .reduce((sum, i) => sum + (i.discountedPrice ?? i.totalPrice), 0);

    const installationSubtotal = lineItems
      .filter((i) => i.category === "installation")
      .reduce((sum, i) => sum + (i.discountedPrice ?? i.totalPrice), 0);

    // Calculate overhead
    const subtotalBeforeOverhead =
      materialSubtotal + laborSubtotal + installationSubtotal;
    const overheadAmount = this.roundPrice(
      subtotalBeforeOverhead * (this.config.overheadPercent / 100)
    );

    // Calculate subtotal before profit
    const subtotalBeforeProfit = subtotalBeforeOverhead + overheadAmount;

    // Apply profit margin
    const profitAmount = this.roundPrice(
      subtotalBeforeProfit * (this.config.profitMargin / 100)
    );
    const subtotal = subtotalBeforeProfit + profitAmount;

    // Calculate discount
    const totalArea = this.calculateTotalArea(bom);
    let discountPercent = customDiscount ?? 0;

    // Apply volume discount if applicable
    if (!customDiscount && totalArea >= this.config.volumeDiscountThreshold) {
      discountPercent = this.config.volumeDiscountPercent;
    }

    const discountAmount = this.roundPrice(subtotal * (discountPercent / 100));
    const taxableAmount = subtotal - discountAmount;

    // Calculate VAT
    const vatAmount = this.roundPrice(
      taxableAmount * (this.config.vatPercent / 100)
    );

    // Grand total
    const grandTotal = taxableAmount + vatAmount;

    // Per unit metrics
    const pricePerM2 =
      totalArea > 0 ? this.roundPrice(grandTotal / totalArea) : 0;

    return {
      materialSubtotal: this.roundPrice(materialSubtotal),
      laborSubtotal: this.roundPrice(laborSubtotal),
      installationSubtotal: this.roundPrice(installationSubtotal),
      overheadAmount,
      subtotal: this.roundPrice(subtotal),
      discountAmount,
      discountPercent,
      taxableAmount: this.roundPrice(taxableAmount),
      vatAmount,
      grandTotal: this.roundPrice(grandTotal),
      pricePerM2,
      totalArea,
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private calculateItemsTotal(items: BomItem[]): number {
    return items.reduce(
      (sum, item) => sum + (item.discountedPrice ?? item.totalPrice),
      0
    );
  }

  private calculateTotalArea(bom: BomDocument): number {
    // Calculate from glass items or estimate from dimensions
    const glassArea = bom.items
      .filter((i) => i.type === BomItemType.GLASS)
      .reduce((sum, i) => sum + (i.totalArea ?? 0), 0);

    return glassArea > 0 ? glassArea : 4; // Default to 4m² if not available
  }

  private applyMarkup(amount: number, markupPercent: number): number {
    return this.roundPrice(amount * (1 + markupPercent / 100));
  }

  private roundPrice(price: number): number {
    return Math.ceil(price / this.config.roundTo) * this.config.roundTo;
  }

  private generateQuoteId(): string {
    return `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateQuoteNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `BG${year}${month}-${random}`;
  }

  // --------------------------------------------------------------------------
  // Quote Operations
  // --------------------------------------------------------------------------

  /**
   * Recalculate quote with updated configuration
   */
  recalculateQuote(quote: Quote, bom: BomDocument): Quote {
    const lineItems = this.generateLineItems(
      bom,
      quote.lineItems.some((i) => i.category === "installation")
    );
    const summary = this.calculateSummary(
      lineItems,
      bom,
      quote.summary.discountPercent
    );

    return {
      ...quote,
      lineItems,
      summary,
      version: quote.version + 1,
      updatedAt: new Date(),
    };
  }

  /**
   * Apply additional discount to quote
   */
  applyDiscount(quote: Quote, discountPercent: number): Quote {
    const subtotal = quote.summary.subtotal;
    const discountAmount = this.roundPrice(subtotal * (discountPercent / 100));
    const taxableAmount = subtotal - discountAmount;
    const vatAmount = this.roundPrice(
      taxableAmount * (this.config.vatPercent / 100)
    );
    const grandTotal = taxableAmount + vatAmount;

    return {
      ...quote,
      summary: {
        ...quote.summary,
        discountPercent,
        discountAmount,
        taxableAmount,
        vatAmount,
        grandTotal,
        pricePerM2:
          quote.summary.totalArea > 0
            ? this.roundPrice(grandTotal / quote.summary.totalArea)
            : 0,
      },
      updatedAt: new Date(),
    };
  }

  /**
   * Compare two quotes
   */
  compareQuotes(
    quote1: Quote,
    quote2: Quote
  ): {
    priceDifference: number;
    percentDifference: number;
    summary: string;
  } {
    const diff = quote2.summary.grandTotal - quote1.summary.grandTotal;
    const percent =
      quote1.summary.grandTotal > 0
        ? (diff / quote1.summary.grandTotal) * 100
        : 0;

    return {
      priceDifference: diff,
      percentDifference: percent,
      summary:
        diff > 0
          ? `Báo giá 2 cao hơn ${this.formatCurrency(diff)} (${percent.toFixed(
              1
            )}%)`
          : `Báo giá 2 thấp hơn ${this.formatCurrency(
              Math.abs(diff)
            )} (${Math.abs(percent).toFixed(1)}%)`,
    };
  }

  // --------------------------------------------------------------------------
  // Formatting
  // --------------------------------------------------------------------------

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: this.config.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  updateConfig(config: Partial<PricingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PricingConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Quick Price Estimate
// ============================================================================

export function estimateQuickPrice(
  width: number, // mm
  height: number, // mm
  doorType: string,
  glassType: string,
  config?: Partial<PricingConfig>
): {
  area: number;
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  pricePerM2: number;
} {
  const pricing = { ...DEFAULT_PRICING, ...config };

  // Calculate area in m²
  const area = (width / 1000) * (height / 1000);

  // Base prices per m² by door type
  const basePrices: Record<string, number> = {
    sliding: 3500000,
    swing: 3000000,
    folding: 4500000,
    pivot: 5000000,
    fixed: 2500000,
    default: 3000000,
  };

  // Glass type multipliers
  const glassMultipliers: Record<string, number> = {
    single: 1.0,
    double: 1.3,
    tempered: 1.4,
    laminated: 1.5,
    low_e: 1.6,
    default: 1.0,
  };

  const basePrice = basePrices[doorType.toLowerCase()] || basePrices["default"];
  const glassMultiplier =
    glassMultipliers[glassType.toLowerCase()] || glassMultipliers["default"];

  const pricePerM2 = basePrice * glassMultiplier;
  const estimatedPrice =
    Math.ceil((area * pricePerM2) / pricing.roundTo) * pricing.roundTo;

  return {
    area,
    estimatedPrice,
    priceRange: {
      min:
        Math.ceil((estimatedPrice * 0.85) / pricing.roundTo) * pricing.roundTo,
      max:
        Math.ceil((estimatedPrice * 1.15) / pricing.roundTo) * pricing.roundTo,
    },
    pricePerM2,
  };
}
