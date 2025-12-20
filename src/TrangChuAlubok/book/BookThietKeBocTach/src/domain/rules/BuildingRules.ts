/**
 * BuildingRules.ts
 * Business rules for door construction constraints
 */

import { DoorModel, DoorType, FrameType, GlassType } from "../door/DoorModel";
import { ProfileSystem } from "../materials/Material.types";

// ============================================================================
// Rule Types
// ============================================================================

export enum RuleCategory {
  DIMENSION = "dimension",
  STRUCTURAL = "structural",
  GLASS = "glass",
  HARDWARE = "hardware",
  SAFETY = "safety",
  BUILDING_CODE = "building_code",
}

export enum RuleSeverity {
  ERROR = "error", // Must fix - cannot proceed
  WARNING = "warning", // Should fix - can proceed with caution
  INFO = "info", // Information only
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: RuleSeverity;
  message: string;
  suggestion?: string;
  affectedProperty?: string;
  currentValue?: string | number;
  allowedRange?: { min?: number; max?: number };
}

export interface ValidationResult {
  isValid: boolean;
  errors: RuleViolation[];
  warnings: RuleViolation[];
  info: RuleViolation[];
}

// ============================================================================
// Dimension Constraints
// ============================================================================

export interface DimensionConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minArea: number;
  maxArea: number;
  maxAspectRatio: number;
  minPanelWidth: number;
  maxPanelWidth: number;
}

const DEFAULT_DIMENSIONS: Record<string, DimensionConstraints> = {
  [DoorType.SLIDING_2_PANELS]: {
    minWidth: 1200,
    maxWidth: 6000,
    minHeight: 1800,
    maxHeight: 3000,
    minArea: 2.16,
    maxArea: 18,
    maxAspectRatio: 4,
    minPanelWidth: 600,
    maxPanelWidth: 1500,
  },
  [DoorType.SWING_SINGLE]: {
    minWidth: 700,
    maxWidth: 1200,
    minHeight: 2000,
    maxHeight: 2700,
    minArea: 1.4,
    maxArea: 3.24,
    maxAspectRatio: 3,
    minPanelWidth: 700,
    maxPanelWidth: 1200,
  },
  [DoorType.SWING_DOUBLE]: {
    minWidth: 1200,
    maxWidth: 2400,
    minHeight: 2000,
    maxHeight: 2700,
    minArea: 2.4,
    maxArea: 6.48,
    maxAspectRatio: 3,
    minPanelWidth: 600,
    maxPanelWidth: 1200,
  },
  [DoorType.FOLDING_4_PANELS]: {
    minWidth: 2000,
    maxWidth: 8000,
    minHeight: 2000,
    maxHeight: 2700,
    minArea: 4,
    maxArea: 21.6,
    maxAspectRatio: 4,
    minPanelWidth: 400,
    maxPanelWidth: 1000,
  },
  [DoorType.PIVOT]: {
    minWidth: 800,
    maxWidth: 1500,
    minHeight: 2000,
    maxHeight: 3000,
    minArea: 1.6,
    maxArea: 4.5,
    maxAspectRatio: 3,
    minPanelWidth: 800,
    maxPanelWidth: 1500,
  },
  DEFAULT: {
    minWidth: 500,
    maxWidth: 10000,
    minHeight: 500,
    maxHeight: 4000,
    minArea: 0.25,
    maxArea: 40,
    maxAspectRatio: 5,
    minPanelWidth: 300,
    maxPanelWidth: 2000,
  },
};

// ============================================================================
// Glass Constraints
// ============================================================================

export interface GlassConstraints {
  minThickness: number;
  maxThickness: number;
  maxArea: number;
  requiresTempered: boolean;
  requiresLaminated: boolean;
}

const GLASS_CONSTRAINTS: Record<string, GlassConstraints> = {
  // Doors accessible to public
  public_access: {
    minThickness: 8,
    maxThickness: 19,
    maxArea: 3,
    requiresTempered: true,
    requiresLaminated: false,
  },
  // Residential
  residential: {
    minThickness: 5,
    maxThickness: 12,
    maxArea: 4,
    requiresTempered: false,
    requiresLaminated: false,
  },
  // High-rise (above 4th floor)
  highrise: {
    minThickness: 8,
    maxThickness: 19,
    maxArea: 2.5,
    requiresTempered: true,
    requiresLaminated: true,
  },
};

// ============================================================================
// Building Rules Engine
// ============================================================================

export class BuildingRules {
  private customConstraints: Map<string, DimensionConstraints> = new Map();
  private glassConstraints: GlassConstraints;
  private profileSystem: ProfileSystem;

  constructor(
    profileSystem: ProfileSystem = ProfileSystem.XINGFA,
    buildingType: "public_access" | "residential" | "highrise" = "residential"
  ) {
    this.profileSystem = profileSystem;
    this.glassConstraints = GLASS_CONSTRAINTS[buildingType];
  }

  // --------------------------------------------------------------------------
  // Main Validation
  // --------------------------------------------------------------------------

  validateDoor(door: DoorModel): ValidationResult {
    const violations: RuleViolation[] = [];

    // Dimension rules
    violations.push(...this.validateDimensions(door));

    // Panel rules
    violations.push(...this.validatePanels(door));

    // Glass rules
    violations.push(...this.validateGlass(door));

    // Hardware rules
    violations.push(...this.validateHardware(door));

    // Safety rules
    violations.push(...this.validateSafety(door));

    // Structural rules
    violations.push(...this.validateStructural(door));

    return this.createResult(violations);
  }

  // --------------------------------------------------------------------------
  // Dimension Validation
  // --------------------------------------------------------------------------

  private validateDimensions(door: DoorModel): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const constraints = this.getConstraints(door.type);
    const { width, height } = door.dimensions;
    const area = (width * height) / 1000000;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);

    // Width check
    if (width < constraints.minWidth) {
      violations.push({
        ruleId: "DIM-001",
        ruleName: "Minimum Width",
        category: RuleCategory.DIMENSION,
        severity: RuleSeverity.ERROR,
        message: `Chiều rộng ${width}mm nhỏ hơn tối thiểu ${constraints.minWidth}mm`,
        suggestion: `Tăng chiều rộng lên ít nhất ${constraints.minWidth}mm`,
        affectedProperty: "dimensions.width",
        currentValue: width,
        allowedRange: { min: constraints.minWidth, max: constraints.maxWidth },
      });
    } else if (width > constraints.maxWidth) {
      violations.push({
        ruleId: "DIM-002",
        ruleName: "Maximum Width",
        category: RuleCategory.DIMENSION,
        severity: RuleSeverity.ERROR,
        message: `Chiều rộng ${width}mm lớn hơn tối đa ${constraints.maxWidth}mm`,
        suggestion: `Giảm chiều rộng xuống tối đa ${constraints.maxWidth}mm hoặc chia thành nhiều cửa`,
        affectedProperty: "dimensions.width",
        currentValue: width,
        allowedRange: { min: constraints.minWidth, max: constraints.maxWidth },
      });
    }

    // Height check
    if (height < constraints.minHeight) {
      violations.push({
        ruleId: "DIM-003",
        ruleName: "Minimum Height",
        category: RuleCategory.DIMENSION,
        severity: RuleSeverity.ERROR,
        message: `Chiều cao ${height}mm nhỏ hơn tối thiểu ${constraints.minHeight}mm`,
        suggestion: `Tăng chiều cao lên ít nhất ${constraints.minHeight}mm`,
        affectedProperty: "dimensions.height",
        currentValue: height,
        allowedRange: {
          min: constraints.minHeight,
          max: constraints.maxHeight,
        },
      });
    } else if (height > constraints.maxHeight) {
      violations.push({
        ruleId: "DIM-004",
        ruleName: "Maximum Height",
        category: RuleCategory.DIMENSION,
        severity: RuleSeverity.ERROR,
        message: `Chiều cao ${height}mm lớn hơn tối đa ${constraints.maxHeight}mm`,
        suggestion: `Giảm chiều cao hoặc thêm thanh ngang chia ô`,
        affectedProperty: "dimensions.height",
        currentValue: height,
        allowedRange: {
          min: constraints.minHeight,
          max: constraints.maxHeight,
        },
      });
    }

    // Area check
    if (area > constraints.maxArea) {
      violations.push({
        ruleId: "DIM-005",
        ruleName: "Maximum Area",
        category: RuleCategory.DIMENSION,
        severity: RuleSeverity.WARNING,
        message: `Diện tích ${area.toFixed(2)}m² vượt quá khuyến nghị ${
          constraints.maxArea
        }m²`,
        suggestion: "Cân nhắc chia nhỏ hoặc tăng cường khung",
        affectedProperty: "area",
        currentValue: area,
        allowedRange: { max: constraints.maxArea },
      });
    }

    // Aspect ratio check
    if (aspectRatio > constraints.maxAspectRatio) {
      violations.push({
        ruleId: "DIM-006",
        ruleName: "Aspect Ratio",
        category: RuleCategory.DIMENSION,
        severity: RuleSeverity.WARNING,
        message: `Tỷ lệ kích thước ${aspectRatio.toFixed(
          2
        )} vượt quá khuyến nghị ${constraints.maxAspectRatio}`,
        suggestion: "Điều chỉnh kích thước để có tỷ lệ cân đối hơn",
        affectedProperty: "aspectRatio",
        currentValue: aspectRatio,
        allowedRange: { max: constraints.maxAspectRatio },
      });
    }

    return violations;
  }

  // --------------------------------------------------------------------------
  // Panel Validation
  // --------------------------------------------------------------------------

  private validatePanels(door: DoorModel): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const constraints = this.getConstraints(door.type);

    for (let i = 0; i < door.panels.length; i++) {
      const panel = door.panels[i];

      if (panel.width < constraints.minPanelWidth) {
        violations.push({
          ruleId: "PNL-001",
          ruleName: "Minimum Panel Width",
          category: RuleCategory.STRUCTURAL,
          severity: RuleSeverity.ERROR,
          message: `Cánh ${i + 1}: Chiều rộng ${
            panel.width
          }mm nhỏ hơn tối thiểu ${constraints.minPanelWidth}mm`,
          suggestion: "Tăng chiều rộng cánh hoặc giảm số lượng cánh",
          affectedProperty: `panels[${i}].width`,
          currentValue: panel.width,
          allowedRange: {
            min: constraints.minPanelWidth,
            max: constraints.maxPanelWidth,
          },
        });
      } else if (panel.width > constraints.maxPanelWidth) {
        violations.push({
          ruleId: "PNL-002",
          ruleName: "Maximum Panel Width",
          category: RuleCategory.STRUCTURAL,
          severity: RuleSeverity.ERROR,
          message: `Cánh ${i + 1}: Chiều rộng ${panel.width}mm lớn hơn tối đa ${
            constraints.maxPanelWidth
          }mm`,
          suggestion: "Giảm chiều rộng cánh hoặc thêm cánh",
          affectedProperty: `panels[${i}].width`,
          currentValue: panel.width,
          allowedRange: {
            min: constraints.minPanelWidth,
            max: constraints.maxPanelWidth,
          },
        });
      }

      // Panel height should not exceed certain ratio
      if (panel.height > panel.width * 4) {
        violations.push({
          ruleId: "PNL-003",
          ruleName: "Panel Aspect Ratio",
          category: RuleCategory.STRUCTURAL,
          severity: RuleSeverity.WARNING,
          message: `Cánh ${
            i + 1
          }: Tỷ lệ cao/rộng quá lớn, có thể gây cong vênh`,
          suggestion: "Thêm thanh ngang chia ô hoặc tăng chiều rộng cánh",
          affectedProperty: `panels[${i}]`,
        });
      }
    }

    return violations;
  }

  // --------------------------------------------------------------------------
  // Glass Validation
  // --------------------------------------------------------------------------

  private validateGlass(door: DoorModel): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (let i = 0; i < door.panels.length; i++) {
      const panel = door.panels[i];
      const glassArea = (panel.width * panel.height) / 1000000;

      // Thickness check
      if (panel.glassThickness < this.glassConstraints.minThickness) {
        violations.push({
          ruleId: "GLS-001",
          ruleName: "Minimum Glass Thickness",
          category: RuleCategory.GLASS,
          severity: RuleSeverity.ERROR,
          message: `Cánh ${i + 1}: Độ dày kính ${
            panel.glassThickness
          }mm nhỏ hơn tối thiểu ${this.glassConstraints.minThickness}mm`,
          suggestion: `Sử dụng kính dày ít nhất ${this.glassConstraints.minThickness}mm`,
          affectedProperty: `panels[${i}].glassThickness`,
          currentValue: panel.glassThickness,
          allowedRange: {
            min: this.glassConstraints.minThickness,
            max: this.glassConstraints.maxThickness,
          },
        });
      }

      // Area check
      if (glassArea > this.glassConstraints.maxArea) {
        violations.push({
          ruleId: "GLS-002",
          ruleName: "Maximum Glass Area",
          category: RuleCategory.GLASS,
          severity: RuleSeverity.WARNING,
          message: `Cánh ${i + 1}: Diện tích kính ${glassArea.toFixed(
            2
          )}m² vượt khuyến nghị ${this.glassConstraints.maxArea}m²`,
          suggestion: "Chia ô kính hoặc sử dụng kính cường lực",
          affectedProperty: `panels[${i}].glassArea`,
          currentValue: glassArea,
          allowedRange: { max: this.glassConstraints.maxArea },
        });
      }

      // Tempered glass requirement
      if (
        this.glassConstraints.requiresTempered &&
        panel.glassType !== GlassType.TEMPERED
      ) {
        violations.push({
          ruleId: "GLS-003",
          ruleName: "Tempered Glass Required",
          category: RuleCategory.SAFETY,
          severity: RuleSeverity.ERROR,
          message: `Cánh ${
            i + 1
          }: Yêu cầu sử dụng kính cường lực theo quy định an toàn`,
          suggestion: "Đổi sang kính cường lực hoặc kính an toàn",
          affectedProperty: `panels[${i}].glassType`,
          currentValue: panel.glassType,
        });
      }

      // Laminated glass requirement for high-rise
      if (
        this.glassConstraints.requiresLaminated &&
        panel.glassType !== GlassType.LAMINATED
      ) {
        violations.push({
          ruleId: "GLS-004",
          ruleName: "Laminated Glass Required",
          category: RuleCategory.SAFETY,
          severity: RuleSeverity.WARNING,
          message: `Cánh ${
            i + 1
          }: Khuyến nghị sử dụng kính dán an toàn cho tầng cao`,
          suggestion: "Cân nhắc sử dụng kính dán laminated",
          affectedProperty: `panels[${i}].glassType`,
          currentValue: panel.glassType,
        });
      }
    }

    return violations;
  }

  // --------------------------------------------------------------------------
  // Hardware Validation
  // --------------------------------------------------------------------------

  private validateHardware(door: DoorModel): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Check minimum hardware
    const hasHandle = door.hardware.some((h) =>
      h.type.toString().includes("HANDLE")
    );
    const hasLock = door.hardware.some((h) =>
      h.type.toString().includes("LOCK")
    );

    if (!hasHandle && door.panels.some((p) => p.panelType === "operable")) {
      violations.push({
        ruleId: "HDW-001",
        ruleName: "Handle Required",
        category: RuleCategory.HARDWARE,
        severity: RuleSeverity.WARNING,
        message: "Cửa có cánh mở nhưng chưa có tay nắm",
        suggestion: "Thêm tay nắm cho cánh cửa",
      });
    }

    if (!hasLock) {
      violations.push({
        ruleId: "HDW-002",
        ruleName: "Lock Recommended",
        category: RuleCategory.HARDWARE,
        severity: RuleSeverity.INFO,
        message: "Cửa chưa có khóa",
        suggestion: "Cân nhắc thêm khóa cho an ninh",
      });
    }

    // Check hinges for swing doors
    if (door.type.toString().includes("SWING")) {
      const hinges = door.hardware.filter((h) =>
        h.type.toString().includes("HINGE")
      );
      const requiredHinges = door.dimensions.height > 2400 ? 4 : 3;

      const totalHinges = hinges.reduce((sum, h) => sum + h.quantity, 0);
      if (totalHinges < requiredHinges) {
        violations.push({
          ruleId: "HDW-003",
          ruleName: "Insufficient Hinges",
          category: RuleCategory.HARDWARE,
          severity: RuleSeverity.WARNING,
          message: `Cần tối thiểu ${requiredHinges} bản lề cho chiều cao ${door.dimensions.height}mm`,
          suggestion: `Thêm bản lề (hiện có ${totalHinges})`,
          currentValue: totalHinges,
          allowedRange: { min: requiredHinges },
        });
      }
    }

    // Check rollers for sliding doors
    if (door.type.toString().includes("SLIDING")) {
      const hasRoller = door.hardware.some((h) =>
        h.type.toString().includes("ROLLER")
      );
      const hasTrack = door.hardware.some((h) =>
        h.type.toString().includes("TRACK")
      );

      if (!hasRoller) {
        violations.push({
          ruleId: "HDW-004",
          ruleName: "Roller Required",
          category: RuleCategory.HARDWARE,
          severity: RuleSeverity.ERROR,
          message: "Cửa lùa cần có bánh xe",
          suggestion: "Thêm bộ bánh xe cho cửa lùa",
        });
      }

      if (!hasTrack) {
        violations.push({
          ruleId: "HDW-005",
          ruleName: "Track Required",
          category: RuleCategory.HARDWARE,
          severity: RuleSeverity.ERROR,
          message: "Cửa lùa cần có ray trượt",
          suggestion: "Thêm ray trên và ray dưới",
        });
      }
    }

    return violations;
  }

  // --------------------------------------------------------------------------
  // Safety Validation
  // --------------------------------------------------------------------------

  private validateSafety(door: DoorModel): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Emergency exit requirements
    if (door.dimensions.width < 900) {
      violations.push({
        ruleId: "SAF-001",
        ruleName: "Emergency Exit Width",
        category: RuleCategory.SAFETY,
        severity: RuleSeverity.INFO,
        message:
          "Chiều rộng thông thủy dưới 900mm, không đạt tiêu chuẩn lối thoát hiểm",
        suggestion:
          "Nếu là lối thoát hiểm, cần tăng chiều rộng lên ít nhất 900mm",
        affectedProperty: "dimensions.width",
        currentValue: door.dimensions.width,
        allowedRange: { min: 900 },
      });
    }

    // Check glass safety for children
    const hasLowGlass = door.panels.some(
      (p) => p.height > 0 && p.panelType !== "fixed"
    );

    if (hasLowGlass) {
      const hasTempered = door.panels.every(
        (p) =>
          p.glassType === GlassType.TEMPERED ||
          p.glassType === GlassType.LAMINATED
      );

      if (!hasTempered) {
        violations.push({
          ruleId: "SAF-002",
          ruleName: "Safety Glass for Children",
          category: RuleCategory.SAFETY,
          severity: RuleSeverity.WARNING,
          message: "Kính ở vùng thấp (dưới 900mm) nên dùng kính an toàn",
          suggestion: "Sử dụng kính cường lực hoặc kính dán cho an toàn trẻ em",
        });
      }
    }

    return violations;
  }

  // --------------------------------------------------------------------------
  // Structural Validation
  // --------------------------------------------------------------------------

  private validateStructural(door: DoorModel): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Frame type recommendations based on size
    const area = (door.dimensions.width * door.dimensions.height) / 1000000;

    if (area > 4 && door.frameType === FrameType.SLIM) {
      violations.push({
        ruleId: "STR-001",
        ruleName: "Frame Type for Large Door",
        category: RuleCategory.STRUCTURAL,
        severity: RuleSeverity.WARNING,
        message: "Cửa diện tích lớn nên dùng khung Heavy Duty",
        suggestion: "Đổi sang khung Heavy Duty cho độ bền tốt hơn",
        affectedProperty: "frameType",
        currentValue: door.frameType,
      });
    }

    // Weight distribution check
    const estimatedWeight = this.estimateDoorWeight(door);
    if (
      estimatedWeight > 100 &&
      !door.hardware.some((h) => h.type.toString().includes("HEAVY"))
    ) {
      violations.push({
        ruleId: "STR-002",
        ruleName: "Heavy Duty Hardware Required",
        category: RuleCategory.STRUCTURAL,
        severity: RuleSeverity.WARNING,
        message: `Trọng lượng cửa ước tính ${estimatedWeight.toFixed(
          0
        )}kg, cần phụ kiện chịu tải cao`,
        suggestion: "Sử dụng bản lề/bánh xe chịu tải nặng",
        currentValue: estimatedWeight,
      });
    }

    // Mullion requirement for wide doors
    if (
      door.dimensions.width > 3000 &&
      door.frames.filter((f) => f.position === "mullion").length === 0
    ) {
      violations.push({
        ruleId: "STR-003",
        ruleName: "Mullion Required",
        category: RuleCategory.STRUCTURAL,
        severity: RuleSeverity.WARNING,
        message: "Cửa rộng trên 3000mm nên có thanh đứng chia ô",
        suggestion: "Thêm thanh mullion để tăng độ cứng vững",
        affectedProperty: "frames",
      });
    }

    return violations;
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private getConstraints(doorType: DoorType): DimensionConstraints {
    return (
      this.customConstraints.get(doorType.toString()) ||
      DEFAULT_DIMENSIONS[doorType.toString()] ||
      DEFAULT_DIMENSIONS["DEFAULT"]
    );
  }

  private estimateDoorWeight(door: DoorModel): number {
    let weight = 0;

    // Frame weight (approx 1.5 kg/m for standard profile)
    const frameLength = (door.dimensions.width + door.dimensions.height) * 2;
    weight += (frameLength / 1000) * 1.5;

    // Panel weight
    for (const panel of door.panels) {
      // Frame weight
      const panelFrame = (panel.width + panel.height) * 2;
      weight += (panelFrame / 1000) * 1.2;

      // Glass weight (approx 2.5 kg/m² per mm thickness)
      const glassArea = (panel.width * panel.height) / 1000000;
      weight += glassArea * panel.glassThickness * 2.5;
    }

    return weight;
  }

  private createResult(violations: RuleViolation[]): ValidationResult {
    const errors = violations.filter((v) => v.severity === RuleSeverity.ERROR);
    const warnings = violations.filter(
      (v) => v.severity === RuleSeverity.WARNING
    );
    const info = violations.filter((v) => v.severity === RuleSeverity.INFO);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  }

  // --------------------------------------------------------------------------
  // Custom Rules
  // --------------------------------------------------------------------------

  setCustomConstraints(
    doorType: string,
    constraints: Partial<DimensionConstraints>
  ): void {
    const base = DEFAULT_DIMENSIONS[doorType] || DEFAULT_DIMENSIONS["DEFAULT"];
    this.customConstraints.set(doorType, { ...base, ...constraints });
  }

  setGlassConstraints(constraints: Partial<GlassConstraints>): void {
    this.glassConstraints = { ...this.glassConstraints, ...constraints };
  }

  setProfileSystem(system: ProfileSystem): void {
    this.profileSystem = system;
  }

  getProfileSystem(): ProfileSystem {
    return this.profileSystem;
  }
}

// ============================================================================
// Quick Validation Functions
// ============================================================================

export function validateDoorDimensions(
  width: number,
  height: number,
  doorType: DoorType
): ValidationResult {
  const constraints =
    DEFAULT_DIMENSIONS[doorType.toString()] || DEFAULT_DIMENSIONS["DEFAULT"];
  const violations: RuleViolation[] = [];

  if (width < constraints.minWidth || width > constraints.maxWidth) {
    violations.push({
      ruleId: "QUICK-001",
      ruleName: "Width Check",
      category: RuleCategory.DIMENSION,
      severity: RuleSeverity.ERROR,
      message: `Chiều rộng phải từ ${constraints.minWidth}mm đến ${constraints.maxWidth}mm`,
      currentValue: width,
      allowedRange: { min: constraints.minWidth, max: constraints.maxWidth },
    });
  }

  if (height < constraints.minHeight || height > constraints.maxHeight) {
    violations.push({
      ruleId: "QUICK-002",
      ruleName: "Height Check",
      category: RuleCategory.DIMENSION,
      severity: RuleSeverity.ERROR,
      message: `Chiều cao phải từ ${constraints.minHeight}mm đến ${constraints.maxHeight}mm`,
      currentValue: height,
      allowedRange: { min: constraints.minHeight, max: constraints.maxHeight },
    });
  }

  return {
    isValid: violations.length === 0,
    errors: violations.filter((v) => v.severity === RuleSeverity.ERROR),
    warnings: violations.filter((v) => v.severity === RuleSeverity.WARNING),
    info: violations.filter((v) => v.severity === RuleSeverity.INFO),
  };
}
