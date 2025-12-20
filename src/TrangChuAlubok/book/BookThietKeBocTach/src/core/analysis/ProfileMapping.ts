/**
 * ProfileMapping.ts
 * Mapping profile nhôm với cấu kiện của cửa
 *
 * Chức năng:
 * - Map loại cửa → danh sách profile cần dùng
 * - Tính toán chiều dài từng thanh profile
 * - Áp dụng công thức bóc tách
 */

import {
  ProfileSpec,
  ProfileCategory,
  ProfileMappingRule,
  ProfileMappingConfig,
  CutType,
} from "./Quantity.types";

// ============================================
// PROFILE DATABASE
// ============================================

/**
 * Database các profile nhôm
 * TODO: Load từ file config hoặc database
 */
const PROFILE_DATABASE: Map<string, ProfileSpec> = new Map([
  [
    "XF55-01",
    {
      code: "XF55-01",
      name: "Khung chính XingFa 55",
      system: "XingFa 55",
      category: ProfileCategory.FRAME,
      weightPerMeter: 1.2,
      pricePerMeter: 85000,
      standardLength: 6000,
      availableColors: ["Trắng", "Đen", "Xám", "Vân gỗ"],
    },
  ],
  [
    "XF55-02",
    {
      code: "XF55-02",
      name: "Cánh cửa XingFa 55",
      system: "XingFa 55",
      category: ProfileCategory.SASH,
      weightPerMeter: 0.9,
      pricePerMeter: 75000,
      standardLength: 6000,
      availableColors: ["Trắng", "Đen", "Xám", "Vân gỗ"],
    },
  ],
  [
    "XF55-03",
    {
      code: "XF55-03",
      name: "Đố đứng XingFa 55",
      system: "XingFa 55",
      category: ProfileCategory.MULLION,
      weightPerMeter: 0.8,
      pricePerMeter: 70000,
      standardLength: 6000,
      availableColors: ["Trắng", "Đen", "Xám", "Vân gỗ"],
    },
  ],
  [
    "XF55-04",
    {
      code: "XF55-04",
      name: "Đố ngang XingFa 55",
      system: "XingFa 55",
      category: ProfileCategory.TRANSOM,
      weightPerMeter: 0.7,
      pricePerMeter: 65000,
      standardLength: 6000,
      availableColors: ["Trắng", "Đen", "Xám", "Vân gỗ"],
    },
  ],
  [
    "XF55-05",
    {
      code: "XF55-05",
      name: "Nẹp kính XingFa 55",
      system: "XingFa 55",
      category: ProfileCategory.BEAD,
      weightPerMeter: 0.3,
      pricePerMeter: 25000,
      standardLength: 6000,
      availableColors: ["Trắng", "Đen", "Xám", "Vân gỗ"],
    },
  ],
]);

// ============================================
// DEFAULT MAPPING RULES
// ============================================

/**
 * Rules mặc định cho mapping profile
 * Công thức sử dụng các biến: W (width), H (height), D (depth)
 */
const DEFAULT_MAPPING_RULES: ProfileMappingRule[] = [
  // Cửa đi 1 cánh
  {
    id: "door-1p-frame-top",
    doorType: "door_1_panel",
    position: ProfileCategory.FRAME,
    profileCode: "XF55-01",
    lengthFormula: "W",
    quantityFormula: "1",
  },
  {
    id: "door-1p-frame-bottom",
    doorType: "door_1_panel",
    position: ProfileCategory.FRAME,
    profileCode: "XF55-01",
    lengthFormula: "W",
    quantityFormula: "1",
  },
  {
    id: "door-1p-frame-left",
    doorType: "door_1_panel",
    position: ProfileCategory.FRAME,
    profileCode: "XF55-01",
    lengthFormula: "H",
    quantityFormula: "1",
  },
  {
    id: "door-1p-frame-right",
    doorType: "door_1_panel",
    position: ProfileCategory.FRAME,
    profileCode: "XF55-01",
    lengthFormula: "H",
    quantityFormula: "1",
  },
  {
    id: "door-1p-sash-top",
    doorType: "door_1_panel",
    position: ProfileCategory.SASH,
    profileCode: "XF55-02",
    lengthFormula: "W - 20",
    quantityFormula: "1",
  },
  {
    id: "door-1p-sash-bottom",
    doorType: "door_1_panel",
    position: ProfileCategory.SASH,
    profileCode: "XF55-02",
    lengthFormula: "W - 20",
    quantityFormula: "1",
  },
  {
    id: "door-1p-sash-left",
    doorType: "door_1_panel",
    position: ProfileCategory.SASH,
    profileCode: "XF55-02",
    lengthFormula: "H - 40",
    quantityFormula: "1",
  },
  {
    id: "door-1p-sash-right",
    doorType: "door_1_panel",
    position: ProfileCategory.SASH,
    profileCode: "XF55-02",
    lengthFormula: "H - 40",
    quantityFormula: "1",
  },
  // Nẹp kính
  {
    id: "door-1p-bead",
    doorType: "door_1_panel",
    position: ProfileCategory.BEAD,
    profileCode: "XF55-05",
    lengthFormula: "(W - 60) * 2 + (H - 80) * 2",
    quantityFormula: "1",
  },
];

// ============================================
// PROFILE MAPPING CLASS
// ============================================

export class ProfileMapping {
  private profiles: Map<string, ProfileSpec>;
  private config: ProfileMappingConfig;

  constructor(config?: Partial<ProfileMappingConfig>) {
    this.profiles = new Map(PROFILE_DATABASE);
    this.config = {
      defaultSystem: config?.defaultSystem ?? "XingFa 55",
      rules: config?.rules ?? DEFAULT_MAPPING_RULES,
    };
  }

  // ==================== Profile Management ====================

  /**
   * Lấy profile theo mã
   */
  getProfile(code: string): ProfileSpec | undefined {
    return this.profiles.get(code);
  }

  /**
   * Lấy tất cả profiles của một hệ
   */
  getProfilesBySystem(system: string): ProfileSpec[] {
    return Array.from(this.profiles.values()).filter(
      (p) => p.system === system
    );
  }

  /**
   * Lấy profiles theo category
   */
  getProfilesByCategory(category: ProfileCategory): ProfileSpec[] {
    return Array.from(this.profiles.values()).filter(
      (p) => p.category === category
    );
  }

  /**
   * Thêm profile mới
   */
  addProfile(profile: ProfileSpec): void {
    this.profiles.set(profile.code, profile);
  }

  // ==================== Mapping Rules ====================

  /**
   * Lấy rules cho loại cửa
   */
  getRulesForDoorType(doorType: string): ProfileMappingRule[] {
    return this.config.rules.filter((r) => r.doorType === doorType);
  }

  /**
   * Thêm rule mới
   */
  addRule(rule: ProfileMappingRule): void {
    this.config.rules.push(rule);
  }

  /**
   * Xóa rule
   */
  removeRule(ruleId: string): void {
    this.config.rules = this.config.rules.filter((r) => r.id !== ruleId);
  }

  // ==================== Formula Evaluation ====================

  /**
   * Đánh giá công thức với các biến
   * @param formula Công thức (VD: "W - 20", "H * 2")
   * @param variables Các biến { W: 900, H: 2100 }
   */
  evaluateFormula(formula: string, variables: Record<string, number>): number {
    try {
      // Thay thế biến trong công thức
      let expression = formula;
      for (const [key, value] of Object.entries(variables)) {
        expression = expression.replace(new RegExp(key, "g"), value.toString());
      }

      // Evaluate expression (safe eval)
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expression}`)();
      return typeof result === "number" ? result : 0;
    } catch {
      console.error(`Failed to evaluate formula: ${formula}`);
      return 0;
    }
  }

  /**
   * Tính toán danh sách cắt cho một cửa
   */
  calculateCutsForDoor(
    doorType: string,
    dimensions: { width: number; height: number; depth?: number }
  ): {
    profileCode: string;
    length: number;
    quantity: number;
    position: ProfileCategory;
    cutType: CutType;
  }[] {
    const rules = this.getRulesForDoorType(doorType);
    const variables = {
      W: dimensions.width,
      H: dimensions.height,
      D: dimensions.depth ?? 55,
    };

    const cuts: {
      profileCode: string;
      length: number;
      quantity: number;
      position: ProfileCategory;
      cutType: CutType;
    }[] = [];

    for (const rule of rules) {
      const length = this.evaluateFormula(rule.lengthFormula, variables);
      const quantity = this.evaluateFormula(rule.quantityFormula, variables);

      if (length > 0 && quantity > 0) {
        cuts.push({
          profileCode: rule.profileCode,
          length: Math.round(length),
          quantity: Math.round(quantity),
          position: rule.position,
          cutType:
            rule.position === ProfileCategory.FRAME
              ? CutType.MITER_45
              : CutType.MITER_90,
        });
      }
    }

    return cuts;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const profileMapping = new ProfileMapping();

export default ProfileMapping;
