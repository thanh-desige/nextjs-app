/**
 * ProfileCatalog.ts
 * Catalog management for aluminum profiles
 */

import {
  ProfileMaterial,
  ProfileSystem,
  ProfileType,
  ProfileFinish,
  MaterialCategory,
  MaterialUnit,
  MaterialFilter,
  MaterialSortOptions,
} from "./Material.types";

// ============================================================================
// Profile Catalog Interface
// ============================================================================

export interface IProfileCatalog {
  // CRUD operations
  addProfile(profile: ProfileMaterial): void;
  updateProfile(id: string, updates: Partial<ProfileMaterial>): void;
  deleteProfile(id: string): void;
  getProfile(id: string): ProfileMaterial | undefined;

  // Query operations
  getAllProfiles(): ProfileMaterial[];
  getProfilesBySystem(system: ProfileSystem): ProfileMaterial[];
  getProfilesByType(type: ProfileType): ProfileMaterial[];
  getProfilesByFinish(finish: ProfileFinish): ProfileMaterial[];
  searchProfiles(filter: MaterialFilter): ProfileMaterial[];

  // Catalog management
  importCatalog(profiles: ProfileMaterial[]): void;
  exportCatalog(): ProfileMaterial[];
  clearCatalog(): void;
}

// ============================================================================
// Profile Catalog Implementation
// ============================================================================

export class ProfileCatalog implements IProfileCatalog {
  private profiles: Map<string, ProfileMaterial> = new Map();

  constructor(initialProfiles?: ProfileMaterial[]) {
    if (initialProfiles) {
      this.importCatalog(initialProfiles);
    } else {
      this.initializeDefaultCatalog();
    }
  }

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  addProfile(profile: ProfileMaterial): void {
    if (this.profiles.has(profile.id)) {
      throw new Error(`Profile with ID ${profile.id} already exists`);
    }
    this.profiles.set(profile.id, {
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateProfile(id: string, updates: Partial<ProfileMaterial>): void {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error(`Profile with ID ${id} not found`);
    }
    this.profiles.set(id, {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID change
      updatedAt: new Date(),
    });
  }

  deleteProfile(id: string): void {
    if (!this.profiles.has(id)) {
      throw new Error(`Profile with ID ${id} not found`);
    }
    this.profiles.delete(id);
  }

  getProfile(id: string): ProfileMaterial | undefined {
    return this.profiles.get(id);
  }

  // --------------------------------------------------------------------------
  // Query Operations
  // --------------------------------------------------------------------------

  getAllProfiles(): ProfileMaterial[] {
    return Array.from(this.profiles.values());
  }

  getProfilesBySystem(system: ProfileSystem): ProfileMaterial[] {
    return this.getAllProfiles().filter((p) => p.system === system);
  }

  getProfilesByType(type: ProfileType): ProfileMaterial[] {
    return this.getAllProfiles().filter((p) => p.profileType === type);
  }

  getProfilesByFinish(finish: ProfileFinish): ProfileMaterial[] {
    return this.getAllProfiles().filter((p) => p.finish === finish);
  }

  searchProfiles(filter: MaterialFilter): ProfileMaterial[] {
    let results = this.getAllProfiles();

    if (filter.system) {
      results = results.filter((p) => p.system === filter.system);
    }

    if (filter.profileType) {
      results = results.filter((p) => p.profileType === filter.profileType);
    }

    if (filter.priceRange) {
      results = results.filter(
        (p) =>
          p.unitPrice >= filter.priceRange!.min &&
          p.unitPrice <= filter.priceRange!.max
      );
    }

    if (filter.supplier) {
      results = results.filter((p) => p.supplier === filter.supplier);
    }

    if (filter.brand) {
      results = results.filter((p) => p.brand === filter.brand);
    }

    if (filter.isActive !== undefined) {
      results = results.filter((p) => p.isActive === filter.isActive);
    }

    if (filter.searchText) {
      const search = filter.searchText.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.code.toLowerCase().includes(search) ||
          (p.description?.toLowerCase().includes(search) ?? false)
      );
    }

    return results;
  }

  sortProfiles(
    profiles: ProfileMaterial[],
    options: MaterialSortOptions
  ): ProfileMaterial[] {
    const sorted = [...profiles];

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

  importCatalog(profiles: ProfileMaterial[]): void {
    for (const profile of profiles) {
      this.profiles.set(profile.id, profile);
    }
  }

  exportCatalog(): ProfileMaterial[] {
    return this.getAllProfiles();
  }

  clearCatalog(): void {
    this.profiles.clear();
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  getProfileForDoorType(
    doorType: string,
    position: "frame" | "sash" | "mullion"
  ): ProfileMaterial[] {
    const typeMap: Record<string, ProfileType[]> = {
      frame: [
        ProfileType.FRAME_MAIN,
        ProfileType.FRAME_OUTER,
        ProfileType.FRAME_INNER,
      ],
      sash: [ProfileType.SASH_MAIN, ProfileType.SASH_MEETING],
      mullion: [ProfileType.MULLION, ProfileType.TRANSOM],
    };

    const types = typeMap[position] || [];
    return this.getAllProfiles().filter((p) => types.includes(p.profileType));
  }

  getCompatibleGlazingBeads(glassThickness: number): ProfileMaterial[] {
    return this.getProfilesByType(ProfileType.GLAZING_BEAD).filter(
      (p) =>
        p.glassThicknessRange.min <= glassThickness &&
        p.glassThicknessRange.max >= glassThickness
    );
  }

  calculateProfileWeight(profileId: string, length: number): number {
    const profile = this.getProfile(profileId);
    if (!profile) return 0;
    // length in mm, weight in kg/m
    return (length / 1000) * profile.dimensions.weight;
  }

  // --------------------------------------------------------------------------
  // Default Catalog Initialization
  // --------------------------------------------------------------------------

  private initializeDefaultCatalog(): void {
    const now = new Date();

    // Xingfa profiles
    const xingfaProfiles: ProfileMaterial[] = [
      {
        id: "xf-frame-55",
        code: "XF-55-FM",
        name: "Xingfa Frame 55 Series",
        category: MaterialCategory.ALUMINUM_PROFILE,
        unit: MaterialUnit.METER,
        unitPrice: 85000,
        currency: "VND",
        system: ProfileSystem.XINGFA,
        profileType: ProfileType.FRAME_MAIN,
        finish: ProfileFinish.ANODIZED_NATURAL,
        dimensions: {
          width: 55,
          height: 45,
          wallThickness: 1.4,
          weight: 1.2,
        },
        standardLength: 6000,
        glassThicknessRange: { min: 5, max: 10 },
        brand: "Xingfa",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "xf-sash-55",
        code: "XF-55-SH",
        name: "Xingfa Sash 55 Series",
        category: MaterialCategory.ALUMINUM_PROFILE,
        unit: MaterialUnit.METER,
        unitPrice: 78000,
        currency: "VND",
        system: ProfileSystem.XINGFA,
        profileType: ProfileType.SASH_MAIN,
        finish: ProfileFinish.ANODIZED_NATURAL,
        dimensions: {
          width: 50,
          height: 40,
          wallThickness: 1.2,
          weight: 0.95,
        },
        standardLength: 6000,
        glassThicknessRange: { min: 5, max: 8 },
        brand: "Xingfa",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "xf-mullion-55",
        code: "XF-55-ML",
        name: "Xingfa Mullion 55 Series",
        category: MaterialCategory.ALUMINUM_PROFILE,
        unit: MaterialUnit.METER,
        unitPrice: 72000,
        currency: "VND",
        system: ProfileSystem.XINGFA,
        profileType: ProfileType.MULLION,
        finish: ProfileFinish.ANODIZED_NATURAL,
        dimensions: {
          width: 40,
          height: 55,
          wallThickness: 1.2,
          weight: 0.85,
        },
        standardLength: 6000,
        glassThicknessRange: { min: 5, max: 10 },
        brand: "Xingfa",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "xf-glazing-55",
        code: "XF-55-GB",
        name: "Xingfa Glazing Bead 55 Series",
        category: MaterialCategory.ALUMINUM_PROFILE,
        unit: MaterialUnit.METER,
        unitPrice: 25000,
        currency: "VND",
        system: ProfileSystem.XINGFA,
        profileType: ProfileType.GLAZING_BEAD,
        finish: ProfileFinish.ANODIZED_NATURAL,
        dimensions: {
          width: 20,
          height: 15,
          wallThickness: 1.0,
          weight: 0.25,
        },
        standardLength: 6000,
        glassThicknessRange: { min: 5, max: 8 },
        brand: "Xingfa",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Viet Phap profiles
    const vietPhapProfiles: ProfileMaterial[] = [
      {
        id: "vp-frame-4500",
        code: "VP-4500-FM",
        name: "Việt Pháp Frame 4500 Series",
        category: MaterialCategory.ALUMINUM_PROFILE,
        unit: MaterialUnit.METER,
        unitPrice: 120000,
        currency: "VND",
        system: ProfileSystem.VIET_PHAP,
        profileType: ProfileType.FRAME_MAIN,
        finish: ProfileFinish.POWDER_WHITE,
        dimensions: {
          width: 60,
          height: 50,
          wallThickness: 1.6,
          weight: 1.5,
        },
        standardLength: 6000,
        glassThicknessRange: { min: 5, max: 24 },
        brand: "Việt Pháp",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "vp-sash-4500",
        code: "VP-4500-SH",
        name: "Việt Pháp Sash 4500 Series",
        category: MaterialCategory.ALUMINUM_PROFILE,
        unit: MaterialUnit.METER,
        unitPrice: 110000,
        currency: "VND",
        system: ProfileSystem.VIET_PHAP,
        profileType: ProfileType.SASH_MAIN,
        finish: ProfileFinish.POWDER_WHITE,
        dimensions: {
          width: 55,
          height: 45,
          wallThickness: 1.4,
          weight: 1.2,
        },
        standardLength: 6000,
        glassThicknessRange: { min: 5, max: 20 },
        brand: "Việt Pháp",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Import all default profiles
    this.importCatalog([...xingfaProfiles, ...vietPhapProfiles]);
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStatistics(): {
    totalProfiles: number;
    bySystem: Record<ProfileSystem, number>;
    byType: Record<ProfileType, number>;
    averagePrice: number;
  } {
    const profiles = this.getAllProfiles();

    const bySystem: Record<string, number> = {};
    const byType: Record<string, number> = {};

    let totalPrice = 0;

    for (const profile of profiles) {
      bySystem[profile.system] = (bySystem[profile.system] || 0) + 1;
      byType[profile.profileType] = (byType[profile.profileType] || 0) + 1;
      totalPrice += profile.unitPrice;
    }

    return {
      totalProfiles: profiles.length,
      bySystem: bySystem as Record<ProfileSystem, number>,
      byType: byType as Record<ProfileType, number>,
      averagePrice: profiles.length > 0 ? totalPrice / profiles.length : 0,
    };
  }
}
