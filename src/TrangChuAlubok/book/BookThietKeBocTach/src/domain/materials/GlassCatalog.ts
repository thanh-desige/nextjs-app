/**
 * GlassCatalog.ts
 * Catalog management for glass materials
 */

import {
  GlassMaterial,
  GlassCategory,
  GlassColor,
  MaterialCategory,
  MaterialUnit,
  MaterialFilter,
  MaterialSortOptions,
} from "./Material.types";

// ============================================================================
// Glass Catalog Interface
// ============================================================================

export interface IGlassCatalog {
  // CRUD operations
  addGlass(glass: GlassMaterial): void;
  updateGlass(id: string, updates: Partial<GlassMaterial>): void;
  deleteGlass(id: string): void;
  getGlass(id: string): GlassMaterial | undefined;

  // Query operations
  getAllGlass(): GlassMaterial[];
  getGlassByCategory(category: GlassCategory): GlassMaterial[];
  getGlassByColor(color: GlassColor): GlassMaterial[];
  getGlassByThickness(thickness: number): GlassMaterial[];
  searchGlass(filter: MaterialFilter): GlassMaterial[];

  // Catalog management
  importCatalog(glasses: GlassMaterial[]): void;
  exportCatalog(): GlassMaterial[];
  clearCatalog(): void;
}

// ============================================================================
// Glass Catalog Implementation
// ============================================================================

export class GlassCatalog implements IGlassCatalog {
  private glasses: Map<string, GlassMaterial> = new Map();

  constructor(initialGlasses?: GlassMaterial[]) {
    if (initialGlasses) {
      this.importCatalog(initialGlasses);
    } else {
      this.initializeDefaultCatalog();
    }
  }

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  addGlass(glass: GlassMaterial): void {
    if (this.glasses.has(glass.id)) {
      throw new Error(`Glass with ID ${glass.id} already exists`);
    }
    this.glasses.set(glass.id, {
      ...glass,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateGlass(id: string, updates: Partial<GlassMaterial>): void {
    const existing = this.glasses.get(id);
    if (!existing) {
      throw new Error(`Glass with ID ${id} not found`);
    }
    this.glasses.set(id, {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date(),
    });
  }

  deleteGlass(id: string): void {
    if (!this.glasses.has(id)) {
      throw new Error(`Glass with ID ${id} not found`);
    }
    this.glasses.delete(id);
  }

  getGlass(id: string): GlassMaterial | undefined {
    return this.glasses.get(id);
  }

  // --------------------------------------------------------------------------
  // Query Operations
  // --------------------------------------------------------------------------

  getAllGlass(): GlassMaterial[] {
    return Array.from(this.glasses.values());
  }

  getGlassByCategory(category: GlassCategory): GlassMaterial[] {
    return this.getAllGlass().filter((g) => g.glassCategory === category);
  }

  getGlassByColor(color: GlassColor): GlassMaterial[] {
    return this.getAllGlass().filter((g) => g.color === color);
  }

  getGlassByThickness(thickness: number): GlassMaterial[] {
    return this.getAllGlass().filter(
      (g) => g.properties.thickness === thickness
    );
  }

  getGlassInThicknessRange(min: number, max: number): GlassMaterial[] {
    return this.getAllGlass().filter(
      (g) => g.properties.thickness >= min && g.properties.thickness <= max
    );
  }

  searchGlass(filter: MaterialFilter): GlassMaterial[] {
    let results = this.getAllGlass();

    if (filter.glassCategory) {
      results = results.filter((g) => g.glassCategory === filter.glassCategory);
    }

    if (filter.priceRange) {
      results = results.filter(
        (g) =>
          g.unitPrice >= filter.priceRange!.min &&
          g.unitPrice <= filter.priceRange!.max
      );
    }

    if (filter.supplier) {
      results = results.filter((g) => g.supplier === filter.supplier);
    }

    if (filter.brand) {
      results = results.filter((g) => g.brand === filter.brand);
    }

    if (filter.isActive !== undefined) {
      results = results.filter((g) => g.isActive === filter.isActive);
    }

    if (filter.searchText) {
      const search = filter.searchText.toLowerCase();
      results = results.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          g.code.toLowerCase().includes(search) ||
          (g.description?.toLowerCase().includes(search) ?? false)
      );
    }

    return results;
  }

  sortGlass(
    glasses: GlassMaterial[],
    options: MaterialSortOptions
  ): GlassMaterial[] {
    const sorted = [...glasses];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (options.field) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "code":
          comparison = a.code.localeCompare(b.code);
          break;
        case "price":
          comparison = a.unitPrice - b.unitPrice;
          break;
        case "createdAt":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "updatedAt":
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }

      return options.direction === "desc" ? -comparison : comparison;
    });

    return sorted;
  }

  // --------------------------------------------------------------------------
  // Catalog Management
  // --------------------------------------------------------------------------

  importCatalog(glasses: GlassMaterial[]): void {
    for (const glass of glasses) {
      this.glasses.set(glass.id, glass);
    }
  }

  exportCatalog(): GlassMaterial[] {
    return this.getAllGlass();
  }

  clearCatalog(): void {
    this.glasses.clear();
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Calculate glass area in square meters
   */
  calculateArea(width: number, height: number): number {
    return (width / 1000) * (height / 1000);
  }

  /**
   * Calculate glass weight
   */
  calculateWeight(glassId: string, width: number, height: number): number {
    const glass = this.getGlass(glassId);
    if (!glass) return 0;

    const area = this.calculateArea(width, height);
    return area * glass.properties.density;
  }

  /**
   * Calculate glass price
   */
  calculatePrice(glassId: string, width: number, height: number): number {
    const glass = this.getGlass(glassId);
    if (!glass) return 0;

    const area = this.calculateArea(width, height);
    return area * glass.unitPrice;
  }

  /**
   * Check if glass size is within limits
   */
  isValidSize(
    glassId: string,
    width: number,
    height: number
  ): { valid: boolean; reason?: string } {
    const glass = this.getGlass(glassId);
    if (!glass) {
      return { valid: false, reason: "Glass not found" };
    }

    if (width < glass.minSize.width || height < glass.minSize.height) {
      return {
        valid: false,
        reason: `Size too small. Minimum: ${glass.minSize.width}x${glass.minSize.height}mm`,
      };
    }

    if (width > glass.maxSize.width || height > glass.maxSize.height) {
      return {
        valid: false,
        reason: `Size too large. Maximum: ${glass.maxSize.width}x${glass.maxSize.height}mm`,
      };
    }

    return { valid: true };
  }

  /**
   * Get recommended glass for door type
   */
  getRecommendedGlass(
    doorType: string,
    location: "interior" | "exterior"
  ): GlassMaterial[] {
    let recommendations = this.getAllGlass().filter((g) => g.isActive);

    if (location === "exterior") {
      // Prefer tempered, low-e or laminated for exterior
      recommendations = recommendations.filter(
        (g) =>
          g.isTempered ||
          g.isLaminated ||
          g.glassCategory === GlassCategory.LOW_E
      );
    }

    if (doorType === "bathroom") {
      // Prefer frosted or patterned for bathroom
      recommendations = recommendations.filter(
        (g) =>
          g.glassCategory === GlassCategory.FROSTED ||
          g.glassCategory === GlassCategory.PATTERNED
      );
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Default Catalog Initialization
  // --------------------------------------------------------------------------

  private initializeDefaultCatalog(): void {
    const now = new Date();

    const defaultGlasses: GlassMaterial[] = [
      // Clear glass
      {
        id: "glass-clear-5",
        code: "GL-CLR-5",
        name: "Kính trắng 5mm",
        nameEn: "Clear Glass 5mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 180000,
        currency: "VND",
        glassCategory: GlassCategory.CLEAR,
        color: GlassColor.CLEAR,
        properties: {
          thickness: 5,
          density: 12.5, // kg/m2
          lightTransmittance: 89,
          uvBlock: 25,
          soundInsulation: 25,
        },
        isTempered: false,
        isLaminated: false,
        maxSize: { width: 2440, height: 3660 },
        minSize: { width: 100, height: 100 },
        brand: "Việt Nhật",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "glass-clear-8",
        code: "GL-CLR-8",
        name: "Kính trắng 8mm",
        nameEn: "Clear Glass 8mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 280000,
        currency: "VND",
        glassCategory: GlassCategory.CLEAR,
        color: GlassColor.CLEAR,
        properties: {
          thickness: 8,
          density: 20,
          lightTransmittance: 88,
          uvBlock: 28,
          soundInsulation: 28,
        },
        isTempered: false,
        isLaminated: false,
        maxSize: { width: 2440, height: 3660 },
        minSize: { width: 100, height: 100 },
        brand: "Việt Nhật",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Tempered glass
      {
        id: "glass-tempered-10",
        code: "GL-TMP-10",
        name: "Kính cường lực 10mm",
        nameEn: "Tempered Glass 10mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 650000,
        currency: "VND",
        glassCategory: GlassCategory.TEMPERED,
        color: GlassColor.CLEAR,
        properties: {
          thickness: 10,
          density: 25,
          lightTransmittance: 87,
          uvBlock: 30,
          soundInsulation: 32,
        },
        isTempered: true,
        isLaminated: false,
        maxSize: { width: 2440, height: 4500 },
        minSize: { width: 150, height: 150 },
        brand: "Việt Nhật",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "glass-tempered-12",
        code: "GL-TMP-12",
        name: "Kính cường lực 12mm",
        nameEn: "Tempered Glass 12mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 780000,
        currency: "VND",
        glassCategory: GlassCategory.TEMPERED,
        color: GlassColor.CLEAR,
        properties: {
          thickness: 12,
          density: 30,
          lightTransmittance: 86,
          uvBlock: 32,
          soundInsulation: 35,
        },
        isTempered: true,
        isLaminated: false,
        maxSize: { width: 2440, height: 4500 },
        minSize: { width: 150, height: 150 },
        brand: "Việt Nhật",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Tinted glass
      {
        id: "glass-grey-8",
        code: "GL-GRY-8",
        name: "Kính màu xám 8mm",
        nameEn: "Grey Tinted Glass 8mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 350000,
        currency: "VND",
        glassCategory: GlassCategory.TINTED,
        color: GlassColor.GREY,
        properties: {
          thickness: 8,
          density: 20,
          lightTransmittance: 45,
          uvBlock: 55,
          soundInsulation: 28,
        },
        isTempered: false,
        isLaminated: false,
        maxSize: { width: 2440, height: 3660 },
        minSize: { width: 100, height: 100 },
        brand: "Việt Nhật",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Low-E glass
      {
        id: "glass-lowe-6",
        code: "GL-LOW-6",
        name: "Kính Low-E 6mm",
        nameEn: "Low-E Glass 6mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 520000,
        currency: "VND",
        glassCategory: GlassCategory.LOW_E,
        color: GlassColor.CLEAR,
        properties: {
          thickness: 6,
          density: 15,
          lightTransmittance: 75,
          uvBlock: 70,
          soundInsulation: 30,
          thermalInsulation: 1.8,
        },
        isTempered: false,
        isLaminated: false,
        maxSize: { width: 2440, height: 3660 },
        minSize: { width: 100, height: 100 },
        brand: "AGC",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Laminated glass
      {
        id: "glass-laminated-6.38",
        code: "GL-LAM-6.38",
        name: "Kính dán an toàn 6.38mm",
        nameEn: "Laminated Safety Glass 6.38mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 480000,
        currency: "VND",
        glassCategory: GlassCategory.LAMINATED,
        color: GlassColor.CLEAR,
        properties: {
          thickness: 6.38,
          density: 16,
          lightTransmittance: 85,
          uvBlock: 99,
          soundInsulation: 35,
        },
        isTempered: false,
        isLaminated: true,
        maxSize: { width: 2440, height: 3660 },
        minSize: { width: 100, height: 100 },
        brand: "AGC",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Frosted glass
      {
        id: "glass-frosted-5",
        code: "GL-FRS-5",
        name: "Kính mờ 5mm",
        nameEn: "Frosted Glass 5mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 280000,
        currency: "VND",
        glassCategory: GlassCategory.FROSTED,
        color: GlassColor.WHITE_OPAL,
        properties: {
          thickness: 5,
          density: 12.5,
          lightTransmittance: 65,
          uvBlock: 30,
          soundInsulation: 25,
        },
        isTempered: false,
        isLaminated: false,
        maxSize: { width: 2440, height: 3660 },
        minSize: { width: 100, height: 100 },
        brand: "Việt Nhật",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Reflective glass
      {
        id: "glass-reflective-8",
        code: "GL-REF-8",
        name: "Kính phản quang 8mm",
        nameEn: "Reflective Glass 8mm",
        category: MaterialCategory.GLASS,
        unit: MaterialUnit.SQUARE_METER,
        unitPrice: 450000,
        currency: "VND",
        glassCategory: GlassCategory.REFLECTIVE,
        color: GlassColor.BLUE,
        properties: {
          thickness: 8,
          density: 20,
          lightTransmittance: 35,
          uvBlock: 65,
          soundInsulation: 30,
        },
        isTempered: false,
        isLaminated: false,
        maxSize: { width: 2440, height: 3660 },
        minSize: { width: 100, height: 100 },
        brand: "Guardian",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.importCatalog(defaultGlasses);
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStatistics(): {
    totalGlasses: number;
    byCategory: Record<GlassCategory, number>;
    byThickness: Record<number, number>;
    averagePrice: number;
  } {
    const glasses = this.getAllGlass();

    const byCategory: Record<string, number> = {};
    const byThickness: Record<number, number> = {};

    let totalPrice = 0;

    for (const glass of glasses) {
      byCategory[glass.glassCategory] =
        (byCategory[glass.glassCategory] || 0) + 1;
      byThickness[glass.properties.thickness] =
        (byThickness[glass.properties.thickness] || 0) + 1;
      totalPrice += glass.unitPrice;
    }

    return {
      totalGlasses: glasses.length,
      byCategory: byCategory as Record<GlassCategory, number>,
      byThickness,
      averagePrice: glasses.length > 0 ? totalPrice / glasses.length : 0,
    };
  }
}
