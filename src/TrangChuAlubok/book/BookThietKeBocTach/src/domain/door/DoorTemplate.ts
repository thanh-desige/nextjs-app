/**
 * Door Template
 * Pre-defined door templates and template management
 */

import {
  DoorModel,
  DoorType,
  DoorDimensions,
  FrameType,
  GlassType,
  OpeningDirection,
  HardwareItem,
  HardwareType,
} from "./DoorModel";

// ===== Template Category =====
export enum TemplateCategory {
  RESIDENTIAL = "RESIDENTIAL",
  COMMERCIAL = "COMMERCIAL",
  INDUSTRIAL = "INDUSTRIAL",
  STOREFRONT = "STOREFRONT",
  INTERIOR = "INTERIOR",
  CUSTOM = "CUSTOM",
}

// ===== Template Definition =====
export interface DoorTemplateData {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: DoorType;
  thumbnail?: string;

  // Default values
  defaultDimensions: DoorDimensions;
  defaultFrameType: FrameType;
  defaultGlassType: GlassType;
  defaultOpeningDirection: OpeningDirection;
  defaultHardware: HardwareItem[];

  // Constraints/Options
  allowedFrameTypes: FrameType[];
  allowedGlassTypes: GlassType[];

  // Metadata
  tags: string[];
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Door Template Class =====
export class DoorTemplate implements DoorTemplateData {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: DoorType;
  thumbnail?: string;

  defaultDimensions: DoorDimensions;
  defaultFrameType: FrameType;
  defaultGlassType: GlassType;
  defaultOpeningDirection: OpeningDirection;
  defaultHardware: HardwareItem[];

  allowedFrameTypes: FrameType[];
  allowedGlassTypes: GlassType[];

  tags: string[];
  popularity: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<DoorTemplateData> & { id: string; name: string }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description ?? "";
    this.category = data.category ?? TemplateCategory.CUSTOM;
    this.type = data.type ?? DoorType.SLIDING_2_PANELS;
    this.thumbnail = data.thumbnail;

    this.defaultDimensions = data.defaultDimensions ?? {
      width: 2000,
      height: 2100,
      depth: 70,
    };
    this.defaultFrameType = data.defaultFrameType ?? FrameType.STANDARD;
    this.defaultGlassType = data.defaultGlassType ?? GlassType.SINGLE;
    this.defaultOpeningDirection =
      data.defaultOpeningDirection ?? OpeningDirection.LEFT;
    this.defaultHardware = data.defaultHardware ?? [];

    this.allowedFrameTypes = data.allowedFrameTypes ?? Object.values(FrameType);
    this.allowedGlassTypes = data.allowedGlassTypes ?? Object.values(GlassType);

    this.tags = data.tags ?? [];
    this.popularity = data.popularity ?? 0;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  // === Create Door Model from Template ===
  createDoor(
    id: string,
    name: string,
    customDimensions?: Partial<DoorDimensions>
  ): DoorModel {
    const dimensions = { ...this.defaultDimensions, ...customDimensions };

    const door = new DoorModel(id, name, this.type, dimensions);
    door.setFrameType(this.defaultFrameType);
    door.setGlassType(this.defaultGlassType);
    door.setOpeningDirection(this.defaultOpeningDirection);

    // Add default hardware
    for (const hw of this.defaultHardware) {
      door.addHardware({ ...hw, id: `${hw.id}_${Date.now()}` });
    }

    // Generate panels and frames
    door.regeneratePanels();
    door.regenerateHardware();

    // Store template reference
    door.metadata.templateId = this.id;

    return door;
  }

  // === Serialization ===
  toJSON(): DoorTemplateData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      type: this.type,
      thumbnail: this.thumbnail,
      defaultDimensions: { ...this.defaultDimensions },
      defaultFrameType: this.defaultFrameType,
      defaultGlassType: this.defaultGlassType,
      defaultOpeningDirection: this.defaultOpeningDirection,
      defaultHardware: this.defaultHardware.map((h) => ({ ...h })),
      allowedFrameTypes: [...this.allowedFrameTypes],
      allowedGlassTypes: [...this.allowedGlassTypes],
      tags: [...this.tags],
      popularity: this.popularity,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(data: DoorTemplateData): DoorTemplate {
    return new DoorTemplate({
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}

// ===== Template Registry =====
export class TemplateRegistry {
  private templates: Map<string, DoorTemplate> = new Map();

  constructor() {
    // Load built-in templates
    this.loadBuiltInTemplates();
  }

  // === Template Management ===
  register(template: DoorTemplate): void {
    this.templates.set(template.id, template);
  }

  unregister(templateId: string): void {
    this.templates.delete(templateId);
  }

  get(templateId: string): DoorTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAll(): DoorTemplate[] {
    return Array.from(this.templates.values());
  }

  getByCategory(category: TemplateCategory): DoorTemplate[] {
    return this.getAll().filter((t) => t.category === category);
  }

  getByType(type: DoorType): DoorTemplate[] {
    return this.getAll().filter((t) => t.type === type);
  }

  search(query: string): DoorTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getPopular(limit = 10): DoorTemplate[] {
    return this.getAll()
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  // === Built-in Templates ===
  private loadBuiltInTemplates(): void {
    const builtInTemplates = BUILT_IN_TEMPLATES.map((data) =>
      DoorTemplate.fromJSON(data)
    );

    for (const template of builtInTemplates) {
      this.register(template);
    }
  }

  // === Import/Export ===
  exportAll(): string {
    const templates = this.getAll()
      .filter((t) => t.category === TemplateCategory.CUSTOM)
      .map((t) => t.toJSON());
    return JSON.stringify(templates, null, 2);
  }

  importTemplates(jsonString: string): number {
    const data = JSON.parse(jsonString) as DoorTemplateData[];
    let imported = 0;

    for (const templateData of data) {
      const template = DoorTemplate.fromJSON(templateData);
      template.category = TemplateCategory.CUSTOM; // Force custom category
      this.register(template);
      imported++;
    }

    return imported;
  }
}

// ===== Built-in Templates =====
export const BUILT_IN_TEMPLATES: DoorTemplateData[] = [
  // Sliding Doors
  {
    id: "tpl_sliding_2_standard",
    name: "Cửa Lùa 2 Cánh Tiêu Chuẩn",
    description:
      "Cửa lùa 2 cánh nhôm kính tiêu chuẩn, phù hợp cho ban công và lối đi",
    category: TemplateCategory.RESIDENTIAL,
    type: DoorType.SLIDING_2_PANELS,
    defaultDimensions: { width: 2000, height: 2100, depth: 70 },
    defaultFrameType: FrameType.STANDARD,
    defaultGlassType: GlassType.SINGLE,
    defaultOpeningDirection: OpeningDirection.LEFT,
    defaultHardware: [
      {
        id: "hw_1",
        type: HardwareType.TRACK_TOP,
        name: "Ray trên",
        catalogId: "TRK-TOP-001",
        quantity: 1,
      },
      {
        id: "hw_2",
        type: HardwareType.TRACK_BOTTOM,
        name: "Ray dưới",
        catalogId: "TRK-BTM-001",
        quantity: 1,
      },
      {
        id: "hw_3",
        type: HardwareType.ROLLER_STANDARD,
        name: "Bánh xe",
        catalogId: "ROL-STD-001",
        quantity: 4,
      },
      {
        id: "hw_4",
        type: HardwareType.HANDLE_PULL,
        name: "Tay nắm",
        catalogId: "HDL-PULL-001",
        quantity: 2,
      },
      {
        id: "hw_5",
        type: HardwareType.LOCK_SINGLE,
        name: "Khóa",
        catalogId: "LCK-SLD-001",
        quantity: 1,
      },
    ],
    allowedFrameTypes: [
      FrameType.STANDARD,
      FrameType.HEAVY_DUTY,
      FrameType.THERMAL_BREAK,
    ],
    allowedGlassTypes: [
      GlassType.SINGLE,
      GlassType.DOUBLE,
      GlassType.TEMPERED,
      GlassType.LOW_E,
    ],
    tags: ["cửa lùa", "sliding", "ban công", "phổ biến"],
    popularity: 100,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "tpl_sliding_3_large",
    name: "Cửa Lùa 3 Cánh Lớn",
    description: "Cửa lùa 3 cánh cho không gian lớn, mở rộng tầm nhìn",
    category: TemplateCategory.RESIDENTIAL,
    type: DoorType.SLIDING_3_PANELS,
    defaultDimensions: { width: 3000, height: 2200, depth: 80 },
    defaultFrameType: FrameType.HEAVY_DUTY,
    defaultGlassType: GlassType.DOUBLE,
    defaultOpeningDirection: OpeningDirection.LEFT,
    defaultHardware: [
      {
        id: "hw_1",
        type: HardwareType.TRACK_TOP,
        name: "Ray trên HD",
        catalogId: "TRK-TOP-HD",
        quantity: 1,
      },
      {
        id: "hw_2",
        type: HardwareType.TRACK_BOTTOM,
        name: "Ray dưới HD",
        catalogId: "TRK-BTM-HD",
        quantity: 1,
      },
      {
        id: "hw_3",
        type: HardwareType.ROLLER_HEAVY_DUTY,
        name: "Bánh xe HD",
        catalogId: "ROL-HD-001",
        quantity: 8,
      },
      {
        id: "hw_4",
        type: HardwareType.HANDLE_PULL,
        name: "Tay nắm",
        catalogId: "HDL-PULL-001",
        quantity: 3,
      },
      {
        id: "hw_5",
        type: HardwareType.LOCK_MULTI,
        name: "Khóa đa điểm",
        catalogId: "LCK-MPT-001",
        quantity: 1,
      },
    ],
    allowedFrameTypes: [FrameType.HEAVY_DUTY, FrameType.THERMAL_BREAK],
    allowedGlassTypes: [
      GlassType.DOUBLE,
      GlassType.TRIPLE,
      GlassType.TEMPERED,
      GlassType.LOW_E,
    ],
    tags: ["cửa lùa", "sliding", "lớn", "panorama"],
    popularity: 80,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },

  // Swing Doors
  {
    id: "tpl_swing_single_entrance",
    name: "Cửa Đơn Mở Quay",
    description: "Cửa đơn mở quay, phù hợp cho cửa phòng hoặc cửa phụ",
    category: TemplateCategory.RESIDENTIAL,
    type: DoorType.SWING_SINGLE,
    defaultDimensions: { width: 900, height: 2100, depth: 60 },
    defaultFrameType: FrameType.STANDARD,
    defaultGlassType: GlassType.TEMPERED,
    defaultOpeningDirection: OpeningDirection.LEFT,
    defaultHardware: [
      {
        id: "hw_1",
        type: HardwareType.HINGE_STANDARD,
        name: "Bản lề",
        catalogId: "HNG-STD-001",
        quantity: 3,
      },
      {
        id: "hw_2",
        type: HardwareType.HANDLE_LEVER,
        name: "Tay nắm đòn bẩy",
        catalogId: "HDL-LVR-001",
        quantity: 1,
      },
      {
        id: "hw_3",
        type: HardwareType.LOCK_MULTI,
        name: "Khóa đa điểm",
        catalogId: "LCK-MPT-001",
        quantity: 1,
      },
    ],
    allowedFrameTypes: [
      FrameType.STANDARD,
      FrameType.SLIM,
      FrameType.THERMAL_BREAK,
    ],
    allowedGlassTypes: [
      GlassType.SINGLE,
      GlassType.DOUBLE,
      GlassType.TEMPERED,
      GlassType.LAMINATED,
    ],
    tags: ["cửa mở", "swing", "cửa phòng"],
    popularity: 90,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "tpl_swing_double_main",
    name: "Cửa Đôi Mở Quay",
    description: "Cửa đôi mở quay, phù hợp cho cửa chính",
    category: TemplateCategory.RESIDENTIAL,
    type: DoorType.SWING_DOUBLE,
    defaultDimensions: { width: 1600, height: 2100, depth: 70 },
    defaultFrameType: FrameType.STANDARD,
    defaultGlassType: GlassType.TEMPERED,
    defaultOpeningDirection: OpeningDirection.OUTSIDE,
    defaultHardware: [
      {
        id: "hw_1",
        type: HardwareType.HINGE_STANDARD,
        name: "Bản lề",
        catalogId: "HNG-STD-001",
        quantity: 6,
      },
      {
        id: "hw_2",
        type: HardwareType.HANDLE_LEVER,
        name: "Tay nắm đòn bẩy",
        catalogId: "HDL-LVR-001",
        quantity: 2,
      },
      {
        id: "hw_3",
        type: HardwareType.LOCK_MULTI,
        name: "Khóa đa điểm",
        catalogId: "LCK-MPT-001",
        quantity: 2,
      },
    ],
    allowedFrameTypes: [
      FrameType.STANDARD,
      FrameType.HEAVY_DUTY,
      FrameType.THERMAL_BREAK,
    ],
    allowedGlassTypes: [
      GlassType.DOUBLE,
      GlassType.TEMPERED,
      GlassType.LAMINATED,
      GlassType.LOW_E,
    ],
    tags: ["cửa mở", "swing", "cửa chính", "cửa đôi"],
    popularity: 85,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },

  // Folding Doors
  {
    id: "tpl_folding_4_patio",
    name: "Cửa Gấp 4 Cánh",
    description: "Cửa gấp 4 cánh, mở rộng không gian sinh hoạt ra ngoài trời",
    category: TemplateCategory.RESIDENTIAL,
    type: DoorType.FOLDING_4_PANELS,
    defaultDimensions: { width: 3200, height: 2200, depth: 80 },
    defaultFrameType: FrameType.HEAVY_DUTY,
    defaultGlassType: GlassType.DOUBLE,
    defaultOpeningDirection: OpeningDirection.LEFT,
    defaultHardware: [
      {
        id: "hw_1",
        type: HardwareType.HINGE_CONCEALED,
        name: "Bản lề gấp",
        catalogId: "HNG-FLD-001",
        quantity: 9,
      },
      {
        id: "hw_2",
        type: HardwareType.TRACK_TOP,
        name: "Ray gấp",
        catalogId: "TRK-FLD-001",
        quantity: 1,
      },
      {
        id: "hw_3",
        type: HardwareType.ROLLER_STANDARD,
        name: "Bánh xe",
        catalogId: "ROL-FLD-001",
        quantity: 8,
      },
      {
        id: "hw_4",
        type: HardwareType.HANDLE_PULL,
        name: "Tay nắm",
        catalogId: "HDL-PULL-001",
        quantity: 2,
      },
      {
        id: "hw_5",
        type: HardwareType.LOCK_MULTI,
        name: "Khóa",
        catalogId: "LCK-FLD-001",
        quantity: 1,
      },
    ],
    allowedFrameTypes: [FrameType.HEAVY_DUTY, FrameType.THERMAL_BREAK],
    allowedGlassTypes: [
      GlassType.DOUBLE,
      GlassType.TRIPLE,
      GlassType.TEMPERED,
      GlassType.LOW_E,
    ],
    tags: ["cửa gấp", "folding", "patio", "sân vườn"],
    popularity: 70,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },

  // Fixed Panels
  {
    id: "tpl_fixed_window",
    name: "Cửa Sổ Cố Định",
    description: "Cửa sổ kính cố định, tối đa ánh sáng tự nhiên",
    category: TemplateCategory.RESIDENTIAL,
    type: DoorType.FIXED_PANEL,
    defaultDimensions: { width: 1200, height: 1500, depth: 50 },
    defaultFrameType: FrameType.SLIM,
    defaultGlassType: GlassType.DOUBLE,
    defaultOpeningDirection: OpeningDirection.LEFT,
    defaultHardware: [],
    allowedFrameTypes: [
      FrameType.SLIM,
      FrameType.STANDARD,
      FrameType.THERMAL_BREAK,
    ],
    allowedGlassTypes: [
      GlassType.SINGLE,
      GlassType.DOUBLE,
      GlassType.TRIPLE,
      GlassType.LOW_E,
    ],
    tags: ["cửa sổ", "fixed", "ánh sáng"],
    popularity: 60,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },

  // Commercial
  {
    id: "tpl_storefront_entrance",
    name: "Cửa Mặt Tiền Cửa Hàng",
    description: "Hệ cửa mặt tiền cho cửa hàng thương mại",
    category: TemplateCategory.STOREFRONT,
    type: DoorType.SWING_DOUBLE,
    defaultDimensions: { width: 1800, height: 2400, depth: 100 },
    defaultFrameType: FrameType.HEAVY_DUTY,
    defaultGlassType: GlassType.TEMPERED,
    defaultOpeningDirection: OpeningDirection.OUTSIDE,
    defaultHardware: [
      {
        id: "hw_1",
        type: HardwareType.HINGE_CONCEALED,
        name: "Bản lề ẩn",
        catalogId: "HNG-CON-001",
        quantity: 6,
      },
      {
        id: "hw_2",
        type: HardwareType.HANDLE_PULL,
        name: "Tay nắm kéo",
        catalogId: "HDL-PULL-002",
        quantity: 2,
      },
      {
        id: "hw_3",
        type: HardwareType.LOCK_MULTI,
        name: "Khóa đa điểm",
        catalogId: "LCK-MPT-002",
        quantity: 2,
      },
      {
        id: "hw_4",
        type: HardwareType.CLOSER_CONCEALED,
        name: "Cửa tự đóng ẩn",
        catalogId: "CLS-CON-001",
        quantity: 2,
      },
    ],
    allowedFrameTypes: [FrameType.HEAVY_DUTY, FrameType.THERMAL_BREAK],
    allowedGlassTypes: [
      GlassType.TEMPERED,
      GlassType.LAMINATED,
      GlassType.LOW_E,
    ],
    tags: ["cửa hàng", "storefront", "thương mại"],
    popularity: 75,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },

  // Awning
  {
    id: "tpl_awning_bathroom",
    name: "Cửa Sổ Hất - Nhà Vệ Sinh",
    description: "Cửa sổ hất nhỏ cho nhà vệ sinh hoặc bếp",
    category: TemplateCategory.RESIDENTIAL,
    type: DoorType.AWNING,
    defaultDimensions: { width: 600, height: 600, depth: 50 },
    defaultFrameType: FrameType.STANDARD,
    defaultGlassType: GlassType.SINGLE,
    defaultOpeningDirection: OpeningDirection.TOP,
    defaultHardware: [
      {
        id: "hw_1",
        type: HardwareType.HINGE_STANDARD,
        name: "Bản lề hất",
        catalogId: "HNG-AWN-001",
        quantity: 2,
      },
      {
        id: "hw_2",
        type: HardwareType.HANDLE_STANDARD,
        name: "Tay quay",
        catalogId: "HDL-CRK-001",
        quantity: 1,
      },
    ],
    allowedFrameTypes: [FrameType.SLIM, FrameType.STANDARD],
    allowedGlassTypes: [GlassType.SINGLE, GlassType.DOUBLE, GlassType.TEMPERED],
    tags: ["cửa hất", "awning", "nhà vệ sinh", "bếp"],
    popularity: 55,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// ===== Singleton Instance =====
export const templateRegistry = new TemplateRegistry();
