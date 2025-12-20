/**
 * AccessoryCatalog.ts
 * Catalog management for door accessories and hardware
 */

import {
  AccessoryItem,
  AccessoryType,
  AccessoryMaterial,
  MaterialCategory,
  MaterialUnit,
  MaterialFilter,
  MaterialSortOptions,
  ProfileSystem,
} from "./Material.types";

// ============================================================================
// Accessory Catalog Interface
// ============================================================================

export interface IAccessoryCatalog {
  // CRUD operations
  addAccessory(accessory: AccessoryItem): void;
  updateAccessory(id: string, updates: Partial<AccessoryItem>): void;
  deleteAccessory(id: string): void;
  getAccessory(id: string): AccessoryItem | undefined;

  // Query operations
  getAllAccessories(): AccessoryItem[];
  getAccessoriesByType(type: AccessoryType): AccessoryItem[];
  getAccessoriesForDoorType(doorType: string): AccessoryItem[];
  getAccessoriesForSystem(system: ProfileSystem): AccessoryItem[];
  searchAccessories(filter: MaterialFilter): AccessoryItem[];

  // Catalog management
  importCatalog(accessories: AccessoryItem[]): void;
  exportCatalog(): AccessoryItem[];
  clearCatalog(): void;
}

// ============================================================================
// Accessory Catalog Implementation
// ============================================================================

export class AccessoryCatalog implements IAccessoryCatalog {
  private accessories: Map<string, AccessoryItem> = new Map();

  constructor(initialAccessories?: AccessoryItem[]) {
    if (initialAccessories) {
      this.importCatalog(initialAccessories);
    } else {
      this.initializeDefaultCatalog();
    }
  }

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  addAccessory(accessory: AccessoryItem): void {
    if (this.accessories.has(accessory.id)) {
      throw new Error(`Accessory with ID ${accessory.id} already exists`);
    }
    this.accessories.set(accessory.id, {
      ...accessory,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateAccessory(id: string, updates: Partial<AccessoryItem>): void {
    const existing = this.accessories.get(id);
    if (!existing) {
      throw new Error(`Accessory with ID ${id} not found`);
    }
    this.accessories.set(id, {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date(),
    });
  }

  deleteAccessory(id: string): void {
    if (!this.accessories.has(id)) {
      throw new Error(`Accessory with ID ${id} not found`);
    }
    this.accessories.delete(id);
  }

  getAccessory(id: string): AccessoryItem | undefined {
    return this.accessories.get(id);
  }

  // --------------------------------------------------------------------------
  // Query Operations
  // --------------------------------------------------------------------------

  getAllAccessories(): AccessoryItem[] {
    return Array.from(this.accessories.values());
  }

  getAccessoriesByType(type: AccessoryType): AccessoryItem[] {
    return this.getAllAccessories().filter((a) => a.accessoryType === type);
  }

  getAccessoriesForDoorType(doorType: string): AccessoryItem[] {
    return this.getAllAccessories().filter(
      (a) => a.compatibleDoorTypes?.includes(doorType) ?? true
    );
  }

  getAccessoriesForSystem(system: ProfileSystem): AccessoryItem[] {
    return this.getAllAccessories().filter(
      (a) => a.compatibleSystems?.includes(system) ?? true
    );
  }

  getAccessoriesByMaterial(material: AccessoryMaterial): AccessoryItem[] {
    return this.getAllAccessories().filter((a) => a.material === material);
  }

  searchAccessories(filter: MaterialFilter): AccessoryItem[] {
    let results = this.getAllAccessories();

    if (filter.accessoryType) {
      results = results.filter((a) => a.accessoryType === filter.accessoryType);
    }

    if (filter.priceRange) {
      results = results.filter(
        (a) =>
          a.unitPrice >= filter.priceRange!.min &&
          a.unitPrice <= filter.priceRange!.max
      );
    }

    if (filter.supplier) {
      results = results.filter((a) => a.supplier === filter.supplier);
    }

    if (filter.brand) {
      results = results.filter((a) => a.brand === filter.brand);
    }

    if (filter.isActive !== undefined) {
      results = results.filter((a) => a.isActive === filter.isActive);
    }

    if (filter.searchText) {
      const search = filter.searchText.toLowerCase();
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.code.toLowerCase().includes(search) ||
          (a.description?.toLowerCase().includes(search) ?? false)
      );
    }

    return results;
  }

  sortAccessories(
    accessories: AccessoryItem[],
    options: MaterialSortOptions
  ): AccessoryItem[] {
    const sorted = [...accessories];

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

  importCatalog(accessories: AccessoryItem[]): void {
    for (const accessory of accessories) {
      this.accessories.set(accessory.id, accessory);
    }
  }

  exportCatalog(): AccessoryItem[] {
    return this.getAllAccessories();
  }

  clearCatalog(): void {
    this.accessories.clear();
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Get required accessories for a door configuration
   */
  getRequiredAccessories(doorConfig: {
    doorType: string;
    hasLock: boolean;
    hasCloser: boolean;
    panelCount: number;
  }): AccessoryItem[] {
    const required: AccessoryItem[] = [];

    // Always need handles
    const handles = this.getAccessoriesByType(AccessoryType.HANDLE).filter(
      (h) => h.isActive
    );
    if (handles.length > 0) {
      required.push(handles[0]);
    }

    // Lock if specified
    if (doorConfig.hasLock) {
      const locks = this.getAccessoriesByType(AccessoryType.LOCK).filter(
        (l) => l.isActive
      );
      if (locks.length > 0) {
        required.push(locks[0]);
      }
    }

    // Door closer if specified
    if (doorConfig.hasCloser) {
      const closers = this.getAccessoriesByType(
        AccessoryType.DOOR_CLOSER
      ).filter((c) => c.isActive);
      if (closers.length > 0) {
        required.push(closers[0]);
      }
    }

    // Hinges for swing doors
    if (doorConfig.doorType === "swing" || doorConfig.doorType === "single") {
      const hinges = this.getAccessoriesByType(AccessoryType.HINGE).filter(
        (h) => h.isActive
      );
      if (hinges.length > 0) {
        required.push(hinges[0]);
      }
    }

    // Rollers for sliding doors
    if (doorConfig.doorType === "sliding") {
      const rollers = this.getAccessoriesByType(AccessoryType.ROLLER).filter(
        (r) => r.isActive
      );
      if (rollers.length > 0) {
        required.push(rollers[0]);
      }

      const tracks = this.getAccessoriesByType(AccessoryType.TRACK).filter(
        (t) => t.isActive
      );
      if (tracks.length > 0) {
        required.push(tracks[0]);
      }
    }

    // Gaskets for all doors
    const gaskets = this.getAccessoriesByType(AccessoryType.GASKET).filter(
      (g) => g.isActive
    );
    if (gaskets.length > 0) {
      required.push(gaskets[0]);
    }

    return required;
  }

  /**
   * Calculate total price for a list of accessories
   */
  calculateTotalPrice(
    accessoryIds: string[],
    quantities: Record<string, number>
  ): number {
    let total = 0;

    for (const id of accessoryIds) {
      const accessory = this.getAccessory(id);
      if (accessory) {
        const qty = quantities[id] || 1;
        total += accessory.unitPrice * qty;
      }
    }

    return total;
  }

  // --------------------------------------------------------------------------
  // Default Catalog Initialization
  // --------------------------------------------------------------------------

  private initializeDefaultCatalog(): void {
    const now = new Date();

    const defaultAccessories: AccessoryItem[] = [
      // Handles
      {
        id: "handle-lever-ss",
        code: "HND-LVR-SS",
        name: "Tay nắm cửa inox",
        nameEn: "Stainless Steel Lever Handle",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PAIR,
        unitPrice: 350000,
        currency: "VND",
        accessoryType: AccessoryType.HANDLE,
        material: AccessoryMaterial.STAINLESS_STEEL,
        finish: "Brushed",
        specifications: {
          length: 130,
          projection: 55,
        },
        compatibleDoorTypes: ["single", "double", "swing"],
        brand: "VVP",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "handle-pull-600",
        code: "HND-PUL-600",
        name: "Tay kéo dài 600mm",
        nameEn: "Pull Handle 600mm",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PAIR,
        unitPrice: 580000,
        currency: "VND",
        accessoryType: AccessoryType.HANDLE,
        material: AccessoryMaterial.STAINLESS_STEEL,
        finish: "Mirror Polish",
        specifications: {
          length: 600,
          diameter: 32,
        },
        compatibleDoorTypes: ["single", "double", "pivot"],
        brand: "VVP",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Locks
      {
        id: "lock-mortise-ss",
        code: "LCK-MRT-SS",
        name: "Khóa âm cửa nhôm",
        nameEn: "Mortise Lock for Aluminum Door",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.SET,
        unitPrice: 420000,
        currency: "VND",
        accessoryType: AccessoryType.LOCK,
        material: AccessoryMaterial.STAINLESS_STEEL,
        specifications: {
          backset: 45,
          faceplate_width: 22,
        },
        compatibleDoorTypes: ["single", "double"],
        compatibleSystems: [ProfileSystem.XINGFA, ProfileSystem.VIET_PHAP],
        brand: "VVP",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "lock-sliding",
        code: "LCK-SLD",
        name: "Khóa cửa lùa",
        nameEn: "Sliding Door Lock",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.SET,
        unitPrice: 280000,
        currency: "VND",
        accessoryType: AccessoryType.LOCK,
        material: AccessoryMaterial.ZINC_ALLOY,
        specifications: {
          type: "flush",
        },
        compatibleDoorTypes: ["sliding"],
        brand: "Generic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Hinges
      {
        id: "hinge-3d-adjustable",
        code: "HNG-3D",
        name: "Bản lề 3D điều chỉnh",
        nameEn: "3D Adjustable Hinge",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PIECE,
        unitPrice: 180000,
        currency: "VND",
        accessoryType: AccessoryType.HINGE,
        material: AccessoryMaterial.ZINC_ALLOY,
        loadCapacity: 60,
        specifications: {
          adjustment: "3D",
          angle: 180,
        },
        compatibleDoorTypes: ["single", "double"],
        compatibleSystems: [ProfileSystem.XINGFA, ProfileSystem.VIET_PHAP],
        brand: "VVP",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "hinge-concealed",
        code: "HNG-CON",
        name: "Bản lề âm cánh",
        nameEn: "Concealed Hinge",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PIECE,
        unitPrice: 250000,
        currency: "VND",
        accessoryType: AccessoryType.CONCEALED_HINGE,
        material: AccessoryMaterial.STAINLESS_STEEL,
        loadCapacity: 80,
        specifications: {
          opening_angle: 180,
        },
        compatibleDoorTypes: ["single", "double"],
        brand: "VVP",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Rollers
      {
        id: "roller-sliding-heavy",
        code: "RLR-SLD-HVY",
        name: "Bánh xe cửa lùa chịu tải",
        nameEn: "Heavy Duty Sliding Roller",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.SET,
        unitPrice: 320000,
        currency: "VND",
        accessoryType: AccessoryType.ROLLER,
        material: AccessoryMaterial.STAINLESS_STEEL,
        loadCapacity: 150,
        specifications: {
          wheel_diameter: 30,
          bearing: "ball bearing",
        },
        compatibleDoorTypes: ["sliding"],
        brand: "VVP",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Tracks
      {
        id: "track-sliding-upper",
        code: "TRK-SLD-UP",
        name: "Ray trên cửa lùa",
        nameEn: "Upper Sliding Track",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.METER,
        unitPrice: 85000,
        currency: "VND",
        accessoryType: AccessoryType.TRACK,
        material: AccessoryMaterial.ALUMINUM,
        specifications: {
          width: 30,
          height: 15,
        },
        compatibleDoorTypes: ["sliding"],
        brand: "Generic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "track-sliding-lower",
        code: "TRK-SLD-LW",
        name: "Ray dưới cửa lùa",
        nameEn: "Lower Sliding Track",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.METER,
        unitPrice: 95000,
        currency: "VND",
        accessoryType: AccessoryType.TRACK,
        material: AccessoryMaterial.ALUMINUM,
        specifications: {
          width: 35,
          height: 12,
        },
        compatibleDoorTypes: ["sliding"],
        brand: "Generic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Door Closers
      {
        id: "closer-hydraulic",
        code: "CLS-HYD",
        name: "Tay co thủy lực",
        nameEn: "Hydraulic Door Closer",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PIECE,
        unitPrice: 450000,
        currency: "VND",
        accessoryType: AccessoryType.DOOR_CLOSER,
        material: AccessoryMaterial.ALUMINUM,
        loadCapacity: 85,
        specifications: {
          size: 4,
          backcheck: "yes",
          delayed_action: "yes",
        },
        compatibleDoorTypes: ["single", "double"],
        brand: "Yale",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "floor-spring",
        code: "FLR-SPR",
        name: "Bản lề sàn",
        nameEn: "Floor Spring",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PIECE,
        unitPrice: 1800000,
        currency: "VND",
        accessoryType: AccessoryType.FLOOR_SPRING,
        material: AccessoryMaterial.STAINLESS_STEEL,
        loadCapacity: 120,
        specifications: {
          door_width_max: 1100,
          door_weight_max: 120,
        },
        compatibleDoorTypes: ["pivot"],
        brand: "Dorma",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Gaskets
      {
        id: "gasket-epdm",
        code: "GSK-EPDM",
        name: "Gioăng EPDM",
        nameEn: "EPDM Gasket",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.METER,
        unitPrice: 15000,
        currency: "VND",
        accessoryType: AccessoryType.GASKET,
        material: AccessoryMaterial.EPDM,
        specifications: {
          width: 8,
          type: "compression",
        },
        compatibleDoorTypes: ["single", "double", "sliding", "folding"],
        compatibleSystems: [
          ProfileSystem.XINGFA,
          ProfileSystem.VIET_PHAP,
          ProfileSystem.PMI,
        ],
        brand: "Generic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "brush-seal",
        code: "BSH-SEL",
        name: "Chổi chắn bụi",
        nameEn: "Brush Seal",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.METER,
        unitPrice: 25000,
        currency: "VND",
        accessoryType: AccessoryType.BRUSH_SEAL,
        material: AccessoryMaterial.PLASTIC,
        specifications: {
          brush_height: 15,
        },
        compatibleDoorTypes: ["sliding"],
        brand: "Generic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Silicone
      {
        id: "silicone-structural",
        code: "SIL-STR",
        name: "Keo silicone kết cấu",
        nameEn: "Structural Silicone",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PIECE,
        unitPrice: 85000,
        currency: "VND",
        accessoryType: AccessoryType.SILICONE,
        material: AccessoryMaterial.SILICONE,
        specifications: {
          volume: 300,
          unit: "ml",
          color: "clear",
        },
        compatibleDoorTypes: [
          "single",
          "double",
          "sliding",
          "folding",
          "pivot",
        ],
        brand: "Dow Corning",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Glass Clamps
      {
        id: "glass-clamp-square",
        code: "GLC-SQR",
        name: "Kẹp kính vuông",
        nameEn: "Square Glass Clamp",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PIECE,
        unitPrice: 75000,
        currency: "VND",
        accessoryType: AccessoryType.GLASS_CLAMP,
        material: AccessoryMaterial.STAINLESS_STEEL,
        specifications: {
          glass_thickness_range: "8-12mm",
          size: "55x55",
        },
        compatibleDoorTypes: ["pivot", "frameless"],
        brand: "Generic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Screws
      {
        id: "screw-self-drilling",
        code: "SCR-SD",
        name: "Vít tự khoan 4.2x25",
        nameEn: "Self Drilling Screw 4.2x25",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PIECE,
        unitPrice: 500,
        currency: "VND",
        accessoryType: AccessoryType.SCREW,
        material: AccessoryMaterial.STAINLESS_STEEL,
        specifications: {
          diameter: 4.2,
          length: 25,
        },
        compatibleDoorTypes: ["single", "double", "sliding", "folding"],
        brand: "Generic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Corner Brackets
      {
        id: "corner-bracket-90",
        code: "CRN-BRK-90",
        name: "Ke góc vuông 90°",
        nameEn: "90° Corner Bracket",
        category: MaterialCategory.ACCESSORY,
        unit: MaterialUnit.PIECE,
        unitPrice: 8000,
        currency: "VND",
        accessoryType: AccessoryType.CORNER_BRACKET,
        material: AccessoryMaterial.ALUMINUM,
        specifications: {
          angle: 90,
          arm_length: 30,
        },
        compatibleDoorTypes: ["single", "double", "sliding", "folding"],
        brand: "Generic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.importCatalog(defaultAccessories);
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStatistics(): {
    totalAccessories: number;
    byType: Record<AccessoryType, number>;
    byMaterial: Record<AccessoryMaterial, number>;
    averagePrice: number;
  } {
    const accessories = this.getAllAccessories();

    const byType: Record<string, number> = {};
    const byMaterial: Record<string, number> = {};

    let totalPrice = 0;

    for (const accessory of accessories) {
      byType[accessory.accessoryType] =
        (byType[accessory.accessoryType] || 0) + 1;
      byMaterial[accessory.material] =
        (byMaterial[accessory.material] || 0) + 1;
      totalPrice += accessory.unitPrice;
    }

    return {
      totalAccessories: accessories.length,
      byType: byType as Record<AccessoryType, number>,
      byMaterial: byMaterial as Record<AccessoryMaterial, number>,
      averagePrice:
        accessories.length > 0 ? totalPrice / accessories.length : 0,
    };
  }
}
