/**
 * Door Parametrics
 * Parametric calculations and constraints for door design
 */

import { IVec2 } from "../../core/geometry/Vec2";
import {
  DoorModel,
  DoorType,
  FrameType,
  GlassType,
  PanelComponent,
} from "./DoorModel";

// ===== Parametric Constraints =====
export interface DoorConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minPanelWidth: number;
  maxPanelWidth: number;
  maxGlassArea: number; // m² - for safety
  minFrameWidth: number;
  maxWeight: number; // kg
}

// ===== Default Constraints by Door Type =====
export const DEFAULT_CONSTRAINTS: Record<DoorType, DoorConstraints> = {
  [DoorType.SLIDING_2_PANELS]: {
    minWidth: 1200,
    maxWidth: 6000,
    minHeight: 1800,
    maxHeight: 3000,
    minPanelWidth: 600,
    maxPanelWidth: 1500,
    maxGlassArea: 2.5,
    minFrameWidth: 50,
    maxWeight: 150,
  },
  [DoorType.SLIDING_3_PANELS]: {
    minWidth: 1800,
    maxWidth: 9000,
    minHeight: 1800,
    maxHeight: 3000,
    minPanelWidth: 600,
    maxPanelWidth: 1500,
    maxGlassArea: 2.5,
    minFrameWidth: 50,
    maxWeight: 150,
  },
  [DoorType.SLIDING_4_PANELS]: {
    minWidth: 2400,
    maxWidth: 12000,
    minHeight: 1800,
    maxHeight: 3000,
    minPanelWidth: 600,
    maxPanelWidth: 1500,
    maxGlassArea: 2.5,
    minFrameWidth: 50,
    maxWeight: 150,
  },
  [DoorType.SWING_SINGLE]: {
    minWidth: 600,
    maxWidth: 1200,
    minHeight: 1800,
    maxHeight: 2700,
    minPanelWidth: 600,
    maxPanelWidth: 1200,
    maxGlassArea: 3.0,
    minFrameWidth: 50,
    maxWeight: 100,
  },
  [DoorType.SWING_DOUBLE]: {
    minWidth: 1200,
    maxWidth: 2400,
    minHeight: 1800,
    maxHeight: 2700,
    minPanelWidth: 600,
    maxPanelWidth: 1200,
    maxGlassArea: 3.0,
    minFrameWidth: 50,
    maxWeight: 100,
  },
  [DoorType.SWING_SINGLE_FIXED]: {
    minWidth: 900,
    maxWidth: 2400,
    minHeight: 1800,
    maxHeight: 2700,
    minPanelWidth: 600,
    maxPanelWidth: 1200,
    maxGlassArea: 3.0,
    minFrameWidth: 50,
    maxWeight: 100,
  },
  [DoorType.FOLDING_2_PANELS]: {
    minWidth: 1200,
    maxWidth: 3000,
    minHeight: 1800,
    maxHeight: 2700,
    minPanelWidth: 400,
    maxPanelWidth: 800,
    maxGlassArea: 2.0,
    minFrameWidth: 50,
    maxWeight: 80,
  },
  [DoorType.FOLDING_4_PANELS]: {
    minWidth: 2400,
    maxWidth: 6000,
    minHeight: 1800,
    maxHeight: 2700,
    minPanelWidth: 400,
    maxPanelWidth: 800,
    maxGlassArea: 2.0,
    minFrameWidth: 50,
    maxWeight: 80,
  },
  [DoorType.FOLDING_6_PANELS]: {
    minWidth: 3600,
    maxWidth: 9000,
    minHeight: 1800,
    maxHeight: 2700,
    minPanelWidth: 400,
    maxPanelWidth: 800,
    maxGlassArea: 2.0,
    minFrameWidth: 50,
    maxWeight: 80,
  },
  [DoorType.FIXED_PANEL]: {
    minWidth: 300,
    maxWidth: 3000,
    minHeight: 300,
    maxHeight: 3500,
    minPanelWidth: 300,
    maxPanelWidth: 3000,
    maxGlassArea: 6.0,
    minFrameWidth: 40,
    maxWeight: 200,
  },
  [DoorType.FIXED_WITH_AWNING]: {
    minWidth: 600,
    maxWidth: 2400,
    minHeight: 600,
    maxHeight: 3000,
    minPanelWidth: 300,
    maxPanelWidth: 1500,
    maxGlassArea: 4.0,
    minFrameWidth: 50,
    maxWeight: 150,
  },
  [DoorType.AWNING]: {
    minWidth: 400,
    maxWidth: 2000,
    minHeight: 400,
    maxHeight: 1200,
    minPanelWidth: 400,
    maxPanelWidth: 2000,
    maxGlassArea: 2.0,
    minFrameWidth: 50,
    maxWeight: 60,
  },
  [DoorType.CASEMENT]: {
    minWidth: 400,
    maxWidth: 1000,
    minHeight: 600,
    maxHeight: 2400,
    minPanelWidth: 400,
    maxPanelWidth: 1000,
    maxGlassArea: 2.0,
    minFrameWidth: 50,
    maxWeight: 60,
  },
  [DoorType.CORNER_SLIDING]: {
    minWidth: 2000,
    maxWidth: 8000,
    minHeight: 1800,
    maxHeight: 3000,
    minPanelWidth: 600,
    maxPanelWidth: 1500,
    maxGlassArea: 2.5,
    minFrameWidth: 60,
    maxWeight: 150,
  },
  [DoorType.PIVOT]: {
    minWidth: 600,
    maxWidth: 1500,
    minHeight: 1800,
    maxHeight: 3000,
    minPanelWidth: 600,
    maxPanelWidth: 1500,
    maxGlassArea: 4.0,
    minFrameWidth: 60,
    maxWeight: 200,
  },
};

// ===== Validation Result =====
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ===== Profile Dimensions by Frame Type =====
export const FRAME_PROFILE_DIMENSIONS: Record<
  FrameType,
  { width: number; height: number }
> = {
  [FrameType.STANDARD]: { width: 60, height: 40 },
  [FrameType.HEAVY_DUTY]: { width: 80, height: 50 },
  [FrameType.SLIM]: { width: 40, height: 30 },
  [FrameType.THERMAL_BREAK]: { width: 90, height: 55 },
};

// ===== Glass Weight per m² by Type =====
export const GLASS_WEIGHT_PER_M2: Record<GlassType, number> = {
  [GlassType.SINGLE]: 12.5, // 5mm = 12.5 kg/m²
  [GlassType.DOUBLE]: 30, // 5-14-5 IGU
  [GlassType.TRIPLE]: 45, // Triple IGU
  [GlassType.LAMINATED]: 21, // 4-0.38-4 laminated
  [GlassType.TEMPERED]: 25, // 10mm tempered
  [GlassType.LOW_E]: 30, // Low-E IGU
};

// ===== Door Parametrics Calculator =====
export class DoorParametrics {
  private door: DoorModel;
  private constraints: DoorConstraints;

  constructor(door: DoorModel) {
    this.door = door;
    this.constraints = DEFAULT_CONSTRAINTS[door.type];
  }

  // === Validation ===
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate dimensions
    const dimResult = this.validateDimensions();
    errors.push(...dimResult.errors);
    warnings.push(...dimResult.warnings);

    // Validate panels
    const panelResult = this.validatePanels();
    errors.push(...panelResult.errors);
    warnings.push(...panelResult.warnings);

    // Validate weight
    const weightResult = this.validateWeight();
    errors.push(...weightResult.errors);
    warnings.push(...weightResult.warnings);

    // Validate glass
    const glassResult = this.validateGlass();
    errors.push(...glassResult.errors);
    warnings.push(...glassResult.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateDimensions(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { width, height } = this.door.dimensions;

    if (width < this.constraints.minWidth) {
      errors.push(
        `Width ${width}mm is below minimum ${this.constraints.minWidth}mm`
      );
    }
    if (width > this.constraints.maxWidth) {
      errors.push(
        `Width ${width}mm exceeds maximum ${this.constraints.maxWidth}mm`
      );
    }
    if (height < this.constraints.minHeight) {
      errors.push(
        `Height ${height}mm is below minimum ${this.constraints.minHeight}mm`
      );
    }
    if (height > this.constraints.maxHeight) {
      errors.push(
        `Height ${height}mm exceeds maximum ${this.constraints.maxHeight}mm`
      );
    }

    // Aspect ratio warning
    const aspectRatio = width / height;
    if (aspectRatio > 3 || aspectRatio < 0.3) {
      warnings.push("Unusual aspect ratio may affect structural integrity");
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validatePanels(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const panel of this.door.panels) {
      if (panel.width < this.constraints.minPanelWidth) {
        errors.push(
          `Panel ${panel.name} width ${panel.width}mm is below minimum ${this.constraints.minPanelWidth}mm`
        );
      }
      if (panel.width > this.constraints.maxPanelWidth) {
        errors.push(
          `Panel ${panel.name} width ${panel.width}mm exceeds maximum ${this.constraints.maxPanelWidth}mm`
        );
      }

      // Glass area per panel
      const glassArea = this.calculatePanelGlassArea(panel);
      if (glassArea > this.constraints.maxGlassArea) {
        errors.push(
          `Panel ${panel.name} glass area ${glassArea.toFixed(
            2
          )}m² exceeds maximum ${this.constraints.maxGlassArea}m²`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateWeight(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const panel of this.door.panels) {
      const weight = this.calculatePanelWeight(panel);

      if (weight > this.constraints.maxWeight) {
        errors.push(
          `Panel ${panel.name} weight ${weight.toFixed(1)}kg exceeds maximum ${
            this.constraints.maxWeight
          }kg`
        );
      } else if (weight > this.constraints.maxWeight * 0.9) {
        warnings.push(
          `Panel ${panel.name} weight ${weight.toFixed(
            1
          )}kg is near maximum capacity`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateGlass(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const panel of this.door.panels) {
      const glassArea = this.calculatePanelGlassArea(panel);

      // Safety glass requirement for large areas
      if (glassArea > 1.5 && panel.glassType === GlassType.SINGLE) {
        warnings.push(
          `Panel ${panel.name}: Consider tempered or laminated glass for safety (area > 1.5m²)`
        );
      }

      // Minimum glass thickness by area
      const minThickness = this.getMinGlassThickness(glassArea);
      if (panel.glassThickness < minThickness) {
        warnings.push(
          `Panel ${panel.name}: Glass thickness ${
            panel.glassThickness
          }mm may be insufficient for ${glassArea.toFixed(2)}m² area`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Calculations ===
  calculatePanelGlassArea(panel: PanelComponent): number {
    const frameOffset = 25; // Panel frame width
    const glassWidth = (panel.width - frameOffset * 2) / 1000;
    const glassHeight = (panel.height - frameOffset * 2) / 1000;
    return glassWidth * glassHeight;
  }

  calculatePanelWeight(panel: PanelComponent): number {
    // Glass weight
    const glassArea = this.calculatePanelGlassArea(panel);
    const glassWeight = glassArea * GLASS_WEIGHT_PER_M2[panel.glassType];

    // Frame weight (aluminum ~2.7 kg/dm³)
    const profileDims = FRAME_PROFILE_DIMENSIONS[this.door.frameType];
    const framePerimeter = ((panel.width + panel.height) * 2) / 1000; // meters
    const frameVolume =
      ((profileDims.width * profileDims.height) / 1000000) * framePerimeter; // dm³
    const frameWeight = frameVolume * 2.7 * 1000; // kg

    return glassWeight + frameWeight;
  }

  calculateTotalWeight(): number {
    return this.door.panels.reduce(
      (sum, panel) => sum + this.calculatePanelWeight(panel),
      0
    );
  }

  calculateTotalGlassArea(): number {
    return this.door.panels.reduce(
      (sum, panel) => sum + this.calculatePanelGlassArea(panel),
      0
    );
  }

  private getMinGlassThickness(area: number): number {
    if (area <= 0.5) return 4;
    if (area <= 1.0) return 5;
    if (area <= 2.0) return 6;
    if (area <= 3.0) return 8;
    return 10;
  }

  // === Parametric Adjustments ===
  suggestOptimalPanelCount(): number {
    const { width } = this.door.dimensions;
    const optimalPanelWidth = 800; // mm - ideal panel width
    return Math.max(1, Math.round(width / optimalPanelWidth));
  }

  suggestFrameType(): FrameType {
    const totalWeight = this.calculateTotalWeight();
    const maxPanelWeight = Math.max(
      ...this.door.panels.map((p) => this.calculatePanelWeight(p))
    );

    if (maxPanelWeight > 100 || totalWeight > 300) {
      return FrameType.HEAVY_DUTY;
    }
    if (maxPanelWeight < 40 && totalWeight < 100) {
      return FrameType.SLIM;
    }
    if (this.door.metadata.thermalRequirement) {
      return FrameType.THERMAL_BREAK;
    }
    return FrameType.STANDARD;
  }

  suggestGlassType(): GlassType {
    const maxGlassArea = Math.max(
      ...this.door.panels.map((p) => this.calculatePanelGlassArea(p))
    );

    // Safety considerations
    if (maxGlassArea > 2.0) {
      return GlassType.TEMPERED;
    }

    // Thermal considerations
    if (this.door.metadata.thermalRequirement) {
      return GlassType.LOW_E;
    }

    // Standard
    if (maxGlassArea > 1.0) {
      return GlassType.DOUBLE;
    }

    return GlassType.SINGLE;
  }

  // === Geometry Calculations ===
  calculateMullionPositions(): IVec2[] {
    const positions: IVec2[] = [];
    const panelCount = this.door.panels.length;

    if (panelCount <= 1) return positions;

    const frameOffset = FRAME_PROFILE_DIMENSIONS[this.door.frameType].width;
    const availableWidth = this.door.dimensions.width - frameOffset * 2;
    const panelWidth = availableWidth / panelCount;

    for (let i = 1; i < panelCount; i++) {
      positions.push({
        x: frameOffset + panelWidth * i,
        y: this.door.dimensions.height / 2,
      });
    }

    return positions;
  }

  calculateTransomPosition(): IVec2 | null {
    if (!this.door.dimensions.transomHeight) {
      return null;
    }

    return {
      x: this.door.dimensions.width / 2,
      y: this.door.dimensions.height - this.door.dimensions.transomHeight,
    };
  }

  // === Cut List Generation ===
  generateCutList(): FrameCutItem[] {
    const cuts: FrameCutItem[] = [];

    // Main frame cuts
    for (const frame of this.door.frames) {
      cuts.push({
        profileId: frame.profileId,
        length: frame.length,
        quantity: 1,
        cutAngleLeft: frame.cutAngleLeft,
        cutAngleRight: frame.cutAngleRight,
        description: frame.name,
      });
    }

    // Panel frame cuts
    for (const panel of this.door.panels) {
      for (const frame of panel.frames) {
        // Check if similar cut already exists
        const existing = cuts.find(
          (c) =>
            c.profileId === frame.profileId &&
            Math.abs(c.length - frame.length) < 1 &&
            c.cutAngleLeft === frame.cutAngleLeft &&
            c.cutAngleRight === frame.cutAngleRight
        );

        if (existing) {
          existing.quantity++;
        } else {
          cuts.push({
            profileId: frame.profileId,
            length: frame.length,
            quantity: 1,
            cutAngleLeft: frame.cutAngleLeft,
            cutAngleRight: frame.cutAngleRight,
            description: `${panel.name} - ${frame.name}`,
          });
        }
      }
    }

    return cuts;
  }

  // === Glass Cut List ===
  generateGlassCutList(): GlassCutItem[] {
    const cuts: GlassCutItem[] = [];
    const frameOffset = 25; // Panel frame width

    for (const panel of this.door.panels) {
      const glassWidth = panel.width - frameOffset * 2;
      const glassHeight = panel.height - frameOffset * 2;

      cuts.push({
        width: glassWidth,
        height: glassHeight,
        thickness: panel.glassThickness,
        type: panel.glassType,
        quantity: 1,
        panelId: panel.id,
        description: panel.name,
      });
    }

    return cuts;
  }
}

// ===== Cut List Types =====
export interface FrameCutItem {
  profileId: string;
  length: number;
  quantity: number;
  cutAngleLeft: number;
  cutAngleRight: number;
  description: string;
}

export interface GlassCutItem {
  width: number;
  height: number;
  thickness: number;
  type: GlassType;
  quantity: number;
  panelId: string;
  description: string;
}
