/**
 * Door Model
 * Core domain model for aluminum/glass door design
 */

import { IVec2 } from "../../core/geometry/Vec2";
import { IEntity } from "../../core/entities/Entity.types";

// ===== Door Types =====
export enum DoorType {
  // Sliding doors
  SLIDING_2_PANELS = "SLIDING_2_PANELS",
  SLIDING_3_PANELS = "SLIDING_3_PANELS",
  SLIDING_4_PANELS = "SLIDING_4_PANELS",

  // Swing doors
  SWING_SINGLE = "SWING_SINGLE",
  SWING_DOUBLE = "SWING_DOUBLE",
  SWING_SINGLE_FIXED = "SWING_SINGLE_FIXED",

  // Folding doors
  FOLDING_2_PANELS = "FOLDING_2_PANELS",
  FOLDING_4_PANELS = "FOLDING_4_PANELS",
  FOLDING_6_PANELS = "FOLDING_6_PANELS",

  // Fixed windows/panels
  FIXED_PANEL = "FIXED_PANEL",
  FIXED_WITH_AWNING = "FIXED_WITH_AWNING",

  // Awning/casement
  AWNING = "AWNING",
  CASEMENT = "CASEMENT",

  // Specialty
  CORNER_SLIDING = "CORNER_SLIDING",
  PIVOT = "PIVOT",
}

// ===== Door Opening Direction =====
export enum OpeningDirection {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  INSIDE = "INSIDE",
  OUTSIDE = "OUTSIDE",
  TOP = "TOP",
  BOTTOM = "BOTTOM",
}

// ===== Frame Types =====
export enum FrameType {
  STANDARD = "STANDARD",
  HEAVY_DUTY = "HEAVY_DUTY",
  SLIM = "SLIM",
  THERMAL_BREAK = "THERMAL_BREAK",
}

// ===== Glass Types =====
export enum GlassType {
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE", // IGU - Insulated Glass Unit
  TRIPLE = "TRIPLE",
  LAMINATED = "LAMINATED",
  TEMPERED = "TEMPERED",
  LOW_E = "LOW_E",
}

// ===== Hardware Types =====
export enum HardwareType {
  HANDLE_STANDARD = "HANDLE_STANDARD",
  HANDLE_PULL = "HANDLE_PULL",
  HANDLE_LEVER = "HANDLE_LEVER",
  LOCK_SINGLE = "LOCK_SINGLE",
  LOCK_MULTI = "LOCK_MULTI",
  HINGE_STANDARD = "HINGE_STANDARD",
  HINGE_CONCEALED = "HINGE_CONCEALED",
  ROLLER_STANDARD = "ROLLER_STANDARD",
  ROLLER_HEAVY_DUTY = "ROLLER_HEAVY_DUTY",
  TRACK_TOP = "TRACK_TOP",
  TRACK_BOTTOM = "TRACK_BOTTOM",
  CLOSER_STANDARD = "CLOSER_STANDARD",
  CLOSER_CONCEALED = "CLOSER_CONCEALED",
}

// ===== Profile Dimensions =====
export interface ProfileDimensions {
  width: number; // mm
  height: number; // mm
  thickness: number; // mm
}

// ===== Frame Component =====
export interface FrameComponent {
  id: string;
  name: string;
  position: "top" | "bottom" | "left" | "right" | "mullion" | "transom";
  profileId: string;
  length: number; // mm
  cutAngleLeft: number; // degrees
  cutAngleRight: number;
  offset: IVec2;
}

// ===== Panel Component =====
export interface PanelComponent {
  id: string;
  name: string;
  panelType: "fixed" | "operable" | "sliding";
  width: number; // mm
  height: number; // mm
  glassType: GlassType;
  glassThickness: number;
  frames: FrameComponent[];
  isActive: boolean; // For sliding doors - which panels move
}

// ===== Hardware Item =====
export interface HardwareItem {
  id: string;
  type: HardwareType;
  name: string;
  catalogId: string;
  quantity: number;
  position?: IVec2;
  panelId?: string;
}

// ===== Door Dimensions =====
export interface DoorDimensions {
  width: number; // Overall width (mm)
  height: number; // Overall height (mm)
  depth: number; // Frame depth (mm)
  mullionWidth?: number;
  transomHeight?: number;
}

// ===== Door Model =====
export interface DoorModelData {
  id: string;
  name: string;
  type: DoorType;
  dimensions: DoorDimensions;
  frameType: FrameType;
  glassType: GlassType;
  openingDirection: OpeningDirection;
  panels: PanelComponent[];
  frames: FrameComponent[];
  hardware: HardwareItem[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

// ===== Door Model Class =====
export class DoorModel implements DoorModelData {
  id: string;
  name: string;
  type: DoorType;
  dimensions: DoorDimensions;
  frameType: FrameType;
  glassType: GlassType;
  openingDirection: OpeningDirection;
  panels: PanelComponent[] = [];
  frames: FrameComponent[] = [];
  hardware: HardwareItem[] = [];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown> = {};

  // Generated CAD entities
  private entities: IEntity[] = [];

  constructor(
    id: string,
    name: string,
    type: DoorType = DoorType.SLIDING_2_PANELS,
    dimensions: Partial<DoorDimensions> = {}
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.dimensions = {
      width: dimensions.width ?? 2000,
      height: dimensions.height ?? 2100,
      depth: dimensions.depth ?? 70,
      mullionWidth: dimensions.mullionWidth,
      transomHeight: dimensions.transomHeight,
    };
    this.frameType = FrameType.STANDARD;
    this.glassType = GlassType.SINGLE;
    this.openingDirection = OpeningDirection.LEFT;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // === Dimension Setters ===
  setDimensions(dimensions: Partial<DoorDimensions>): void {
    this.dimensions = { ...this.dimensions, ...dimensions };
    this.updatedAt = new Date();
    this.regeneratePanels();
  }

  setWidth(width: number): void {
    this.dimensions.width = width;
    this.updatedAt = new Date();
    this.regeneratePanels();
  }

  setHeight(height: number): void {
    this.dimensions.height = height;
    this.updatedAt = new Date();
    this.regeneratePanels();
  }

  // === Type Setters ===
  setType(type: DoorType): void {
    this.type = type;
    this.updatedAt = new Date();
    this.regeneratePanels();
    this.regenerateHardware();
  }

  setFrameType(frameType: FrameType): void {
    this.frameType = frameType;
    this.updatedAt = new Date();
    this.regeneratePanels();
  }

  setGlassType(glassType: GlassType): void {
    this.glassType = glassType;
    for (const panel of this.panels) {
      panel.glassType = glassType;
    }
    this.updatedAt = new Date();
  }

  setOpeningDirection(direction: OpeningDirection): void {
    this.openingDirection = direction;
    this.updatedAt = new Date();
  }

  // === Panel Management ===
  addPanel(panel: PanelComponent): void {
    this.panels.push(panel);
    this.updatedAt = new Date();
  }

  removePanel(panelId: string): void {
    this.panels = this.panels.filter((p) => p.id !== panelId);
    this.updatedAt = new Date();
  }

  getPanel(panelId: string): PanelComponent | undefined {
    return this.panels.find((p) => p.id === panelId);
  }

  // === Frame Management ===
  addFrame(frame: FrameComponent): void {
    this.frames.push(frame);
    this.updatedAt = new Date();
  }

  removeFrame(frameId: string): void {
    this.frames = this.frames.filter((f) => f.id !== frameId);
    this.updatedAt = new Date();
  }

  // === Hardware Management ===
  addHardware(hardware: HardwareItem): void {
    this.hardware.push(hardware);
    this.updatedAt = new Date();
  }

  removeHardware(hardwareId: string): void {
    this.hardware = this.hardware.filter((h) => h.id !== hardwareId);
    this.updatedAt = new Date();
  }

  // === Panel Generation ===
  regeneratePanels(): void {
    this.panels = [];
    this.frames = [];

    const panelCount = this.getPanelCount();
    const panelWidth = this.calculatePanelWidth(panelCount);
    const frameOffset = this.getFrameOffset();

    // Generate main frame
    this.frames = this.generateMainFrame(frameOffset);

    // Generate panels based on type
    for (let i = 0; i < panelCount; i++) {
      const panel = this.createPanel(i, panelCount, panelWidth);
      this.panels.push(panel);
    }
  }

  private getPanelCount(): number {
    switch (this.type) {
      case DoorType.SLIDING_2_PANELS:
      case DoorType.SWING_DOUBLE:
      case DoorType.FOLDING_2_PANELS:
        return 2;
      case DoorType.SLIDING_3_PANELS:
        return 3;
      case DoorType.SLIDING_4_PANELS:
      case DoorType.FOLDING_4_PANELS:
        return 4;
      case DoorType.FOLDING_6_PANELS:
        return 6;
      default:
        return 1;
    }
  }

  private calculatePanelWidth(panelCount: number): number {
    const frameOffset = this.getFrameOffset();
    const availableWidth = this.dimensions.width - frameOffset * 2;

    // For sliding doors, panels overlap
    if (this.type.includes("SLIDING")) {
      const overlapFactor = 1.1; // 10% overlap
      return (availableWidth * overlapFactor) / panelCount;
    }

    return availableWidth / panelCount;
  }

  private getFrameOffset(): number {
    switch (this.frameType) {
      case FrameType.SLIM:
        return 40;
      case FrameType.HEAVY_DUTY:
        return 80;
      case FrameType.THERMAL_BREAK:
        return 90;
      default:
        return 60;
    }
  }

  private generateMainFrame(offset: number): FrameComponent[] {
    const { width, height } = this.dimensions;

    return [
      {
        id: "frame_top",
        name: "Top Frame",
        position: "top",
        profileId: "frame_horizontal",
        length: width,
        cutAngleLeft: 45,
        cutAngleRight: 45,
        offset: { x: 0, y: height - offset },
      },
      {
        id: "frame_bottom",
        name: "Bottom Frame",
        position: "bottom",
        profileId: "frame_horizontal",
        length: width,
        cutAngleLeft: 45,
        cutAngleRight: 45,
        offset: { x: 0, y: 0 },
      },
      {
        id: "frame_left",
        name: "Left Frame",
        position: "left",
        profileId: "frame_vertical",
        length: height,
        cutAngleLeft: 45,
        cutAngleRight: 45,
        offset: { x: 0, y: 0 },
      },
      {
        id: "frame_right",
        name: "Right Frame",
        position: "right",
        profileId: "frame_vertical",
        length: height,
        cutAngleLeft: 45,
        cutAngleRight: 45,
        offset: { x: width - offset, y: 0 },
      },
    ];
  }

  private createPanel(
    index: number,
    totalPanels: number,
    panelWidth: number
  ): PanelComponent {
    const frameOffset = this.getFrameOffset();
    const panelHeight = this.dimensions.height - frameOffset * 2;

    const isOperable = this.isOperablePanel(index, totalPanels);
    const panelType = this.type.includes("SLIDING")
      ? "sliding"
      : isOperable
      ? "operable"
      : "fixed";

    return {
      id: `panel_${index}`,
      name: `Panel ${index + 1}`,
      panelType,
      width: panelWidth,
      height: panelHeight,
      glassType: this.glassType,
      glassThickness: this.getDefaultGlassThickness(),
      frames: this.generatePanelFrames(panelWidth, panelHeight),
      isActive: isOperable,
    };
  }

  private isOperablePanel(index: number, totalPanels: number): boolean {
    // For sliding doors, alternating panels are operable
    if (this.type.includes("SLIDING")) {
      return index % 2 === 0;
    }

    // For swing doors, determine by opening direction
    if (this.type.includes("SWING")) {
      if (totalPanels === 1) return true;
      if (this.openingDirection === OpeningDirection.LEFT) {
        return index === 0;
      }
      return index === totalPanels - 1;
    }

    return true;
  }

  private generatePanelFrames(width: number, height: number): FrameComponent[] {
    const panelFrameOffset = 25; // Panel frame is thinner

    return [
      {
        id: "panel_top",
        name: "Panel Top Frame",
        position: "top",
        profileId: "panel_horizontal",
        length: width,
        cutAngleLeft: 45,
        cutAngleRight: 45,
        offset: { x: 0, y: height - panelFrameOffset },
      },
      {
        id: "panel_bottom",
        name: "Panel Bottom Frame",
        position: "bottom",
        profileId: "panel_horizontal",
        length: width,
        cutAngleLeft: 45,
        cutAngleRight: 45,
        offset: { x: 0, y: 0 },
      },
      {
        id: "panel_left",
        name: "Panel Left Frame",
        position: "left",
        profileId: "panel_vertical",
        length: height - panelFrameOffset * 2,
        cutAngleLeft: 90,
        cutAngleRight: 90,
        offset: { x: 0, y: panelFrameOffset },
      },
      {
        id: "panel_right",
        name: "Panel Right Frame",
        position: "right",
        profileId: "panel_vertical",
        length: height - panelFrameOffset * 2,
        cutAngleLeft: 90,
        cutAngleRight: 90,
        offset: { x: width - panelFrameOffset, y: panelFrameOffset },
      },
    ];
  }

  private getDefaultGlassThickness(): number {
    switch (this.glassType) {
      case GlassType.SINGLE:
        return 5;
      case GlassType.DOUBLE:
        return 24; // 5-14-5
      case GlassType.TRIPLE:
        return 36;
      case GlassType.LAMINATED:
        return 8.38; // 4-0.38-4
      case GlassType.TEMPERED:
        return 10;
      default:
        return 5;
    }
  }

  // === Hardware Generation ===
  regenerateHardware(): void {
    this.hardware = [];

    // Add hardware based on door type
    if (this.type.includes("SLIDING")) {
      this.addSlidingHardware();
    } else if (this.type.includes("SWING")) {
      this.addSwingHardware();
    } else if (this.type.includes("FOLDING")) {
      this.addFoldingHardware();
    }
  }

  private addSlidingHardware(): void {
    const panelCount = this.getPanelCount();

    // Top and bottom tracks
    this.hardware.push({
      id: "track_top",
      type: HardwareType.TRACK_TOP,
      name: "Top Track",
      catalogId: "TRK-TOP-001",
      quantity: 1,
    });

    this.hardware.push({
      id: "track_bottom",
      type: HardwareType.TRACK_BOTTOM,
      name: "Bottom Track",
      catalogId: "TRK-BTM-001",
      quantity: 1,
    });

    // Rollers for each operable panel
    const operablePanels = this.panels.filter((p) => p.isActive).length;
    this.hardware.push({
      id: "rollers",
      type: HardwareType.ROLLER_STANDARD,
      name: "Panel Rollers",
      catalogId: "ROL-STD-001",
      quantity: operablePanels * 4, // 4 rollers per panel
    });

    // Handles
    this.hardware.push({
      id: "handles",
      type: HardwareType.HANDLE_PULL,
      name: "Pull Handles",
      catalogId: "HDL-PULL-001",
      quantity: panelCount,
    });

    // Lock
    this.hardware.push({
      id: "lock",
      type: HardwareType.LOCK_SINGLE,
      name: "Sliding Lock",
      catalogId: "LCK-SLD-001",
      quantity: 1,
    });
  }

  private addSwingHardware(): void {
    const operablePanels = this.panels.filter(
      (p) => p.panelType === "operable"
    ).length;

    // Hinges - 3 per operable panel
    this.hardware.push({
      id: "hinges",
      type: HardwareType.HINGE_STANDARD,
      name: "Door Hinges",
      catalogId: "HNG-STD-001",
      quantity: operablePanels * 3,
    });

    // Handle
    this.hardware.push({
      id: "handle",
      type: HardwareType.HANDLE_LEVER,
      name: "Lever Handle",
      catalogId: "HDL-LVR-001",
      quantity: operablePanels,
    });

    // Lock
    this.hardware.push({
      id: "lock",
      type: HardwareType.LOCK_MULTI,
      name: "Multi-point Lock",
      catalogId: "LCK-MPT-001",
      quantity: operablePanels,
    });

    // Door closer (optional)
    if (this.metadata.hasCloser) {
      this.hardware.push({
        id: "closer",
        type: HardwareType.CLOSER_STANDARD,
        name: "Door Closer",
        catalogId: "CLS-STD-001",
        quantity: operablePanels,
      });
    }
  }

  private addFoldingHardware(): void {
    const panelCount = this.getPanelCount();

    // Hinges between panels
    this.hardware.push({
      id: "hinges",
      type: HardwareType.HINGE_CONCEALED,
      name: "Folding Hinges",
      catalogId: "HNG-FLD-001",
      quantity: (panelCount - 1) * 3,
    });

    // Top track
    this.hardware.push({
      id: "track_top",
      type: HardwareType.TRACK_TOP,
      name: "Folding Track",
      catalogId: "TRK-FLD-001",
      quantity: 1,
    });

    // Rollers
    this.hardware.push({
      id: "rollers",
      type: HardwareType.ROLLER_STANDARD,
      name: "Folding Rollers",
      catalogId: "ROL-FLD-001",
      quantity: panelCount * 2,
    });

    // Handle
    this.hardware.push({
      id: "handle",
      type: HardwareType.HANDLE_PULL,
      name: "Pull Handle",
      catalogId: "HDL-PULL-001",
      quantity: 2,
    });

    // Lock
    this.hardware.push({
      id: "lock",
      type: HardwareType.LOCK_MULTI,
      name: "Folding Door Lock",
      catalogId: "LCK-FLD-001",
      quantity: 1,
    });
  }

  // === CAD Entity Generation ===
  getEntities(): IEntity[] {
    return [...this.entities];
  }

  setEntities(entities: IEntity[]): void {
    this.entities = entities;
  }

  // === Glass Area Calculation ===
  calculateGlassArea(): number {
    let totalArea = 0;

    for (const panel of this.panels) {
      const panelFrameOffset = 25;
      const glassWidth = panel.width - panelFrameOffset * 2;
      const glassHeight = panel.height - panelFrameOffset * 2;
      totalArea += (glassWidth * glassHeight) / 1000000; // Convert to m²
    }

    return totalArea;
  }

  // === Profile Length Calculation ===
  calculateTotalProfileLength(): { profileId: string; totalLength: number }[] {
    const profileLengths = new Map<string, number>();

    // Main frame
    for (const frame of this.frames) {
      const current = profileLengths.get(frame.profileId) ?? 0;
      profileLengths.set(frame.profileId, current + frame.length);
    }

    // Panel frames
    for (const panel of this.panels) {
      for (const frame of panel.frames) {
        const current = profileLengths.get(frame.profileId) ?? 0;
        profileLengths.set(frame.profileId, current + frame.length);
      }
    }

    return Array.from(profileLengths.entries()).map(
      ([profileId, totalLength]) => ({
        profileId,
        totalLength,
      })
    );
  }

  // === Serialization ===
  toJSON(): DoorModelData {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      dimensions: { ...this.dimensions },
      frameType: this.frameType,
      glassType: this.glassType,
      openingDirection: this.openingDirection,
      panels: this.panels.map((p) => ({ ...p })),
      frames: this.frames.map((f) => ({ ...f })),
      hardware: this.hardware.map((h) => ({ ...h })),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: { ...this.metadata },
    };
  }

  static fromJSON(data: DoorModelData): DoorModel {
    const door = new DoorModel(data.id, data.name, data.type, data.dimensions);
    door.frameType = data.frameType;
    door.glassType = data.glassType;
    door.openingDirection = data.openingDirection;
    door.panels = data.panels;
    door.frames = data.frames;
    door.hardware = data.hardware;
    door.createdAt = new Date(data.createdAt);
    door.updatedAt = new Date(data.updatedAt);
    door.metadata = data.metadata;
    return door;
  }

  // === Clone ===
  clone(newId?: string): DoorModel {
    const data = this.toJSON();
    data.id = newId ?? `${this.id}_copy`;
    data.name = `${this.name} (Copy)`;
    return DoorModel.fromJSON(data);
  }
}
