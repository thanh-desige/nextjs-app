/**
 * BomCalculator.ts
 * Bill of Materials calculation engine
 */

import { DoorModel } from "../door/DoorModel";
import { ProfileCatalog } from "../materials/ProfileCatalog";
import { GlassCatalog } from "../materials/GlassCatalog";
import { AccessoryCatalog } from "../materials/AccessoryCatalog";
import {
  ProfileMaterial,
  GlassMaterial,
  AccessoryItem,
  CutPiece,
  GlassPiece,
  ProfileType,
} from "../materials/Material.types";
import {
  BomItem,
  BomDocument,
  BomItemType,
  createBomItem,
  calculateBomSummary,
} from "./BomItem";

// ============================================================================
// BOM Calculator Configuration
// ============================================================================

export interface BomCalculatorConfig {
  // Wastage percentages
  profileWastage: number;
  glassWastage: number;

  // Labor rates
  laborRatePerHour: number;
  laborHoursPerSquareMeter: number;

  // Overhead
  overheadPercent: number;

  // Cutting angles
  defaultFrameAngle: number; // Usually 45°
  defaultMullionAngle: number; // Usually 90°

  // Glass deductions (from frame opening)
  glassWidthDeduction: number; // mm
  glassHeightDeduction: number; // mm

  // Accessory quantities
  hingesPerPanel: number;
  screwsPerMeter: number;
  gasketMultiplier: number;

  // Pricing
  currency: string;
  priceRoundTo: number;
}

const DEFAULT_CONFIG: BomCalculatorConfig = {
  profileWastage: 5,
  glassWastage: 3,
  laborRatePerHour: 100000, // VND
  laborHoursPerSquareMeter: 2,
  overheadPercent: 10,
  defaultFrameAngle: 45,
  defaultMullionAngle: 90,
  glassWidthDeduction: 10,
  glassHeightDeduction: 10,
  hingesPerPanel: 3,
  screwsPerMeter: 8,
  gasketMultiplier: 2,
  currency: "VND",
  priceRoundTo: 1000,
};

// ============================================================================
// BOM Calculator
// ============================================================================

export class BomCalculator {
  private config: BomCalculatorConfig;
  private profileCatalog: ProfileCatalog;
  private glassCatalog: GlassCatalog;
  private accessoryCatalog: AccessoryCatalog;

  constructor(
    profileCatalog: ProfileCatalog,
    glassCatalog: GlassCatalog,
    accessoryCatalog: AccessoryCatalog,
    config?: Partial<BomCalculatorConfig>
  ) {
    this.profileCatalog = profileCatalog;
    this.glassCatalog = glassCatalog;
    this.accessoryCatalog = accessoryCatalog;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Main Calculation Methods
  // --------------------------------------------------------------------------

  /**
   * Calculate complete BOM for a door
   */
  calculateBom(
    door: DoorModel,
    projectId: string,
    projectName: string,
    createdBy: string
  ): BomDocument {
    const items: BomItem[] = [];

    // 1. Calculate frame profiles
    const frameItems = this.calculateFrameProfiles(door);
    items.push(...frameItems);

    // 2. Calculate sash profiles
    const sashItems = this.calculateSashProfiles(door);
    items.push(...sashItems);

    // 3. Calculate mullion/transom profiles
    const mullionItems = this.calculateMullionProfiles(door);
    items.push(...mullionItems);

    // 4. Calculate glazing beads
    const glazingBeadItems = this.calculateGlazingBeads(door);
    items.push(...glazingBeadItems);

    // 5. Calculate glass
    const glassItems = this.calculateGlass(door);
    items.push(...glassItems);

    // 6. Calculate accessories
    const accessoryItems = this.calculateAccessories(door);
    items.push(...accessoryItems);

    // Calculate labor and overhead
    const area = (door.dimensions.width * door.dimensions.height) / 1000000; // m2
    const laborCost =
      area *
      this.config.laborHoursPerSquareMeter *
      this.config.laborRatePerHour;

    const materialCost = items.reduce(
      (sum, item) => sum + (item.discountedPrice ?? item.totalPrice),
      0
    );
    const overheadCost = materialCost * (this.config.overheadPercent / 100);

    // Calculate summary
    const summary = calculateBomSummary(items, laborCost, overheadCost);

    // Create BOM document
    const bomDocument: BomDocument = {
      id: this.generateBomId(),
      projectId,
      projectName,
      doorId: door.id,
      doorName: door.name,
      items,
      summary,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      status: "draft",
    };

    return bomDocument;
  }

  // --------------------------------------------------------------------------
  // Profile Calculations
  // --------------------------------------------------------------------------

  private calculateFrameProfiles(door: DoorModel): BomItem[] {
    const items: BomItem[] = [];
    const { width, height } = door.dimensions;
    const frameProfile = this.getFrameProfile(door);

    if (!frameProfile) return items;

    // Frame cut pieces
    const frameCuts: CutPiece[] = [
      // Top frame
      {
        materialId: frameProfile.id,
        length: width,
        quantity: 1,
        angle1: this.config.defaultFrameAngle,
        angle2: this.config.defaultFrameAngle,
        label: "Frame Top",
        position: "top",
      },
      // Bottom frame
      {
        materialId: frameProfile.id,
        length: width,
        quantity: 1,
        angle1: this.config.defaultFrameAngle,
        angle2: this.config.defaultFrameAngle,
        label: "Frame Bottom",
        position: "bottom",
      },
      // Left frame
      {
        materialId: frameProfile.id,
        length: height,
        quantity: 1,
        angle1: this.config.defaultFrameAngle,
        angle2: this.config.defaultFrameAngle,
        label: "Frame Left",
        position: "left",
      },
      // Right frame
      {
        materialId: frameProfile.id,
        length: height,
        quantity: 1,
        angle1: this.config.defaultFrameAngle,
        angle2: this.config.defaultFrameAngle,
        label: "Frame Right",
        position: "right",
      },
    ];

    const totalLength = frameCuts.reduce(
      (sum, cut) => sum + cut.length * cut.quantity,
      0
    );
    const bomItem = createBomItem(
      frameProfile,
      totalLength / 1000, // Convert to meters
      "Frame",
      { wastagePercent: this.config.profileWastage }
    );

    bomItem.cutPieces = frameCuts;
    bomItem.totalLength = totalLength;

    items.push(bomItem);

    return items;
  }

  private calculateSashProfiles(door: DoorModel): BomItem[] {
    const items: BomItem[] = [];
    const sashProfile = this.getSashProfile(door);

    if (!sashProfile) return items;

    for (let i = 0; i < door.panels.length; i++) {
      const panel = door.panels[i];
      const sashCuts: CutPiece[] = [];

      // Calculate sash dimensions based on panel
      const sashWidth = panel.width;
      const sashHeight = panel.height;

      // Top sash
      sashCuts.push({
        materialId: sashProfile.id,
        length: sashWidth,
        quantity: 1,
        angle1: this.config.defaultFrameAngle,
        angle2: this.config.defaultFrameAngle,
        label: `Sash ${i + 1} Top`,
        position: "top",
      });

      // Bottom sash
      sashCuts.push({
        materialId: sashProfile.id,
        length: sashWidth,
        quantity: 1,
        angle1: this.config.defaultFrameAngle,
        angle2: this.config.defaultFrameAngle,
        label: `Sash ${i + 1} Bottom`,
        position: "bottom",
      });

      // Left sash
      sashCuts.push({
        materialId: sashProfile.id,
        length: sashHeight,
        quantity: 1,
        angle1: this.config.defaultFrameAngle,
        angle2: this.config.defaultFrameAngle,
        label: `Sash ${i + 1} Left`,
        position: "left",
      });

      // Right sash
      sashCuts.push({
        materialId: sashProfile.id,
        length: sashHeight,
        quantity: 1,
        angle1: this.config.defaultFrameAngle,
        angle2: this.config.defaultFrameAngle,
        label: `Sash ${i + 1} Right`,
        position: "right",
      });

      const totalLength = sashCuts.reduce(
        (sum, cut) => sum + cut.length * cut.quantity,
        0
      );
      const bomItem = createBomItem(
        sashProfile,
        totalLength / 1000,
        `Sash Panel ${i + 1}`,
        { wastagePercent: this.config.profileWastage }
      );

      bomItem.cutPieces = sashCuts;
      bomItem.totalLength = totalLength;

      items.push(bomItem);
    }

    return items;
  }

  private calculateMullionProfiles(door: DoorModel): BomItem[] {
    const items: BomItem[] = [];
    const mullionProfile = this.getMullionProfile();

    if (!mullionProfile) return items;

    // Calculate mullions from frames with position 'mullion' or 'transom'
    const mullionFrames = door.frames.filter(
      (f) => f.position === "mullion" || f.position === "transom"
    );

    if (mullionFrames.length === 0) return items;

    const mullionCuts: CutPiece[] = [];

    for (let i = 0; i < mullionFrames.length; i++) {
      const frame = mullionFrames[i];

      mullionCuts.push({
        materialId: mullionProfile.id,
        length: frame.length,
        quantity: 1,
        angle1: frame.cutAngleLeft,
        angle2: frame.cutAngleRight,
        label:
          frame.position === "mullion"
            ? `Mullion ${i + 1}`
            : `Transom ${i + 1}`,
        position: frame.position,
      });
    }

    if (mullionCuts.length > 0) {
      const totalLength = mullionCuts.reduce(
        (sum, cut) => sum + cut.length * cut.quantity,
        0
      );
      const bomItem = createBomItem(
        mullionProfile,
        totalLength / 1000,
        "Mullions & Transoms",
        { wastagePercent: this.config.profileWastage }
      );

      bomItem.cutPieces = mullionCuts;
      bomItem.totalLength = totalLength;

      items.push(bomItem);
    }

    return items;
  }

  private calculateGlazingBeads(door: DoorModel): BomItem[] {
    const items: BomItem[] = [];
    const glazingBead = this.getGlazingBead(door);

    if (!glazingBead) return items;

    let totalBeadLength = 0;

    // Calculate glazing bead for each panel
    for (const panel of door.panels) {
      // Perimeter of glass opening (4 sides)
      const beadLength = (panel.width + panel.height) * 2;
      totalBeadLength += beadLength;
    }

    // Fixed panels are identified by panelType === 'fixed'
    const fixedPanels = door.panels.filter((p) => p.panelType === "fixed");
    for (const panel of fixedPanels) {
      const beadLength = (panel.width + panel.height) * 2;
      totalBeadLength += beadLength;
    }

    // Multiply by 2 for inner and outer glazing beads
    totalBeadLength *= 2;

    const bomItem = createBomItem(
      glazingBead,
      totalBeadLength / 1000,
      "Glazing Beads",
      { wastagePercent: this.config.profileWastage }
    );

    bomItem.totalLength = totalBeadLength;

    items.push(bomItem);

    return items;
  }

  // --------------------------------------------------------------------------
  // Glass Calculations
  // --------------------------------------------------------------------------

  private calculateGlass(door: DoorModel): BomItem[] {
    const items: BomItem[] = [];
    const glassMaterial = this.getGlassMaterial(door);

    if (!glassMaterial) return items;

    const glassPieces: GlassPiece[] = [];

    // Glass for each panel
    for (let i = 0; i < door.panels.length; i++) {
      const panel = door.panels[i];

      // Deduct glazing clearance
      const glassWidth = panel.width - this.config.glassWidthDeduction;
      const glassHeight = panel.height - this.config.glassHeightDeduction;
      const area = (glassWidth / 1000) * (glassHeight / 1000);

      glassPieces.push({
        materialId: glassMaterial.id,
        width: glassWidth,
        height: glassHeight,
        quantity: 1,
        area,
        label: `Panel ${i + 1} Glass`,
        position: `panel-${i + 1}`,
      });
    }

    // Glass is already included in panels above
    // Fixed panels have panelType === 'fixed'

    const totalArea = glassPieces.reduce(
      (sum, piece) => sum + piece.area * piece.quantity,
      0
    );
    const bomItem = createBomItem(glassMaterial, totalArea, "Glass", {
      wastagePercent: this.config.glassWastage,
    });

    bomItem.glassPieces = glassPieces;
    bomItem.totalArea = totalArea;

    items.push(bomItem);

    return items;
  }

  // --------------------------------------------------------------------------
  // Accessory Calculations
  // --------------------------------------------------------------------------

  private calculateAccessories(door: DoorModel): BomItem[] {
    const items: BomItem[] = [];

    // Hinges
    const hinges = this.calculateHinges(door);
    if (hinges) items.push(hinges);

    // Locks
    const locks = this.calculateLocks(door);
    if (locks) items.push(locks);

    // Handles
    const handles = this.calculateHandles(door);
    if (handles) items.push(handles);

    // Gaskets
    const gaskets = this.calculateGaskets(door);
    if (gaskets) items.push(gaskets);

    // Rollers (for sliding doors)
    const rollers = this.calculateRollers(door);
    if (rollers) items.push(rollers);

    // Door closers
    const closers = this.calculateDoorClosers(door);
    if (closers) items.push(closers);

    // Screws
    const screws = this.calculateScrews(door);
    if (screws) items.push(screws);

    // Corner brackets
    const brackets = this.calculateCornerBrackets(door);
    if (brackets) items.push(brackets);

    // Silicone
    const silicone = this.calculateSilicone(door);
    if (silicone) items.push(silicone);

    return items;
  }

  private calculateHinges(door: DoorModel): BomItem | null {
    // Only for swing doors
    if (this.isSlidingDoor(door) || this.isFoldingDoor(door)) return null;

    const hinge = this.accessoryCatalog.getAccessoriesByType(
      "hinge" as never
    )[0] as AccessoryItem | undefined;
    if (!hinge) return null;

    const totalHinges = door.panels.length * this.config.hingesPerPanel;
    return createBomItem(hinge, totalHinges, "Hinges");
  }

  private calculateLocks(door: DoorModel): BomItem | null {
    const locks = this.accessoryCatalog.getAccessoriesByType("lock" as never);
    const lock =
      (locks.find((l) =>
        (l as AccessoryItem).compatibleDoorTypes?.includes(door.type)
      ) as AccessoryItem | undefined) ||
      (locks[0] as AccessoryItem | undefined);

    if (!lock) return null;

    return createBomItem(lock, 1, "Lock");
  }

  private calculateHandles(door: DoorModel): BomItem | null {
    const handles = this.accessoryCatalog.getAccessoriesByType(
      "handle" as never
    );
    const handle = handles[0] as AccessoryItem | undefined;

    if (!handle) return null;

    // One handle per operable panel
    const handleCount = door.panels.filter(
      (p) => p.panelType === "operable" || p.panelType === "sliding"
    ).length;
    if (handleCount === 0) return null;

    return createBomItem(handle, handleCount, "Handles");
  }

  private calculateGaskets(door: DoorModel): BomItem | null {
    const gaskets = this.accessoryCatalog.getAccessoriesByType(
      "gasket" as never
    );
    const gasket = gaskets[0] as AccessoryItem | undefined;

    if (!gasket) return null;

    // Calculate total perimeter
    const framePerimeter = (door.dimensions.width + door.dimensions.height) * 2;
    let sashPerimeter = 0;

    for (const panel of door.panels) {
      sashPerimeter += (panel.width + panel.height) * 2;
    }

    const totalLength =
      ((framePerimeter + sashPerimeter) * this.config.gasketMultiplier) / 1000;

    return createBomItem(gasket, totalLength, "Gaskets");
  }

  private calculateRollers(door: DoorModel): BomItem | null {
    if (!this.isSlidingDoor(door)) return null;

    const rollers = this.accessoryCatalog.getAccessoriesByType(
      "roller" as never
    );
    const roller = rollers[0] as AccessoryItem | undefined;

    if (!roller) return null;

    // 2 roller sets per sliding panel
    const rollerSets =
      door.panels.filter((p) => p.panelType === "sliding").length * 2;

    return createBomItem(roller, rollerSets, "Rollers");
  }

  private calculateDoorClosers(door: DoorModel): BomItem | null {
    // Only for swing doors
    if (this.isSlidingDoor(door)) return null;

    const closers = this.accessoryCatalog.getAccessoriesByType(
      "door_closer" as never
    );
    const closer = closers[0] as AccessoryItem | undefined;

    if (!closer) return null;

    return createBomItem(closer, 1, "Door Closer");
  }

  private calculateScrews(door: DoorModel): BomItem | null {
    const screws = this.accessoryCatalog.getAccessoriesByType("screw" as never);
    const screw = screws[0] as AccessoryItem | undefined;

    if (!screw) return null;

    // Calculate total profile length for screw estimation
    const frameLength = (door.dimensions.width + door.dimensions.height) * 2;
    let sashLength = 0;

    for (const panel of door.panels) {
      sashLength += (panel.width + panel.height) * 2;
    }

    const totalLength = (frameLength + sashLength) / 1000; // meters
    const screwCount = Math.ceil(totalLength * this.config.screwsPerMeter);

    return createBomItem(screw, screwCount, "Screws");
  }

  private calculateCornerBrackets(door: DoorModel): BomItem | null {
    const brackets = this.accessoryCatalog.getAccessoriesByType(
      "corner_bracket" as never
    );
    const bracket = brackets[0] as AccessoryItem | undefined;

    if (!bracket) return null;

    // 4 brackets for frame + 4 for each panel
    const bracketCount = 4 + door.panels.length * 4;

    return createBomItem(bracket, bracketCount, "Corner Brackets");
  }

  private calculateSilicone(door: DoorModel): BomItem | null {
    const silicones = this.accessoryCatalog.getAccessoriesByType(
      "silicone" as never
    );
    const silicone = silicones[0] as AccessoryItem | undefined;

    if (!silicone) return null;

    // Estimate: 1 tube per square meter
    const area = (door.dimensions.width * door.dimensions.height) / 1000000;
    const tubeCount = Math.ceil(area);

    return createBomItem(silicone, tubeCount, "Silicone Sealant");
  }

  // --------------------------------------------------------------------------
  // Material Selection Helpers
  // --------------------------------------------------------------------------

  private getFrameProfile(_door: DoorModel): ProfileMaterial | undefined {
    void _door; // Reserved for future use with door's profile system
    const profiles = this.profileCatalog.getProfilesByType(
      ProfileType.FRAME_MAIN
    );
    // In real implementation, filter by door's profile system
    return profiles[0];
  }

  private getSashProfile(_door: DoorModel): ProfileMaterial | undefined {
    void _door; // Reserved for future use
    const profiles = this.profileCatalog.getProfilesByType(
      ProfileType.SASH_MAIN
    );
    return profiles[0];
  }

  private getMullionProfile(): ProfileMaterial | undefined {
    const profiles = this.profileCatalog.getProfilesByType(ProfileType.MULLION);
    return profiles[0];
  }

  private getGlazingBead(door: DoorModel): ProfileMaterial | undefined {
    // Get glass thickness from first panel
    const glassThickness = door.panels[0]?.glassThickness ?? 5;
    const profiles =
      this.profileCatalog.getCompatibleGlazingBeads(glassThickness);
    return profiles[0];
  }

  private getGlassMaterial(door: DoorModel): GlassMaterial | undefined {
    // Get glass thickness from first panel
    const glassThickness = door.panels[0]?.glassThickness ?? 5;
    const glasses = this.glassCatalog.getGlassByThickness(glassThickness);
    return glasses[0];
  }

  // --------------------------------------------------------------------------
  // Door Type Helpers
  // --------------------------------------------------------------------------

  private isSlidingDoor(door: DoorModel): boolean {
    return door.type.toString().includes("SLIDING");
  }

  private isFoldingDoor(door: DoorModel): boolean {
    return door.type.toString().includes("FOLDING");
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private generateBomId(): string {
    return `bom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Round price to configured precision
   */
  roundPrice(price: number): number {
    return (
      Math.ceil(price / this.config.priceRoundTo) * this.config.priceRoundTo
    );
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BomCalculatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): BomCalculatorConfig {
    return { ...this.config };
  }

  /**
   * Recalculate BOM with updated materials or configuration
   */
  recalculateBom(existingBom: BomDocument): BomDocument {
    // Recalculate all item prices
    const updatedItems = existingBom.items.map((item) => {
      const material = this.getMaterialById(item.material.id, item.type);
      if (material) {
        const grossQuantity = item.quantity * (1 + item.wastagePercent / 100);
        const totalPrice = grossQuantity * material.unitPrice;
        const discountedPrice = item.discountPercent
          ? totalPrice * (1 - item.discountPercent / 100)
          : undefined;

        return {
          ...item,
          material,
          unitPrice: material.unitPrice,
          grossQuantity,
          totalPrice,
          discountedPrice,
        };
      }
      return item;
    });

    // Recalculate summary
    const summary = calculateBomSummary(
      updatedItems,
      existingBom.summary.laborCost,
      existingBom.summary.overheadCost
    );

    return {
      ...existingBom,
      items: updatedItems,
      summary,
      version: existingBom.version + 1,
      updatedAt: new Date(),
    };
  }

  private getMaterialById(
    id: string,
    type: BomItemType
  ): ProfileMaterial | GlassMaterial | AccessoryItem | undefined {
    switch (type) {
      case BomItemType.PROFILE:
        return this.profileCatalog.getProfile(id);
      case BomItemType.GLASS:
        return this.glassCatalog.getGlass(id);
      case BomItemType.ACCESSORY:
        return this.accessoryCatalog.getAccessory(id);
      default:
        return undefined;
    }
  }
}
