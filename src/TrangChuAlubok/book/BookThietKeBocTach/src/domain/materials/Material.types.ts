/**
 * Material.types.ts
 * Type definitions for materials used in aluminum/glass door fabrication
 */

// ============================================================================
// Base Material Types
// ============================================================================

export enum MaterialCategory {
  ALUMINUM_PROFILE = "aluminum_profile",
  GLASS = "glass",
  ACCESSORY = "accessory",
  HARDWARE = "hardware",
  SEALANT = "sealant",
  CONSUMABLE = "consumable",
}

export enum MaterialUnit {
  // Length
  METER = "m",
  MILLIMETER = "mm",
  // Area
  SQUARE_METER = "m2",
  // Quantity
  PIECE = "pcs",
  SET = "set",
  PAIR = "pair",
  // Volume/Weight
  KILOGRAM = "kg",
  LITER = "l",
}

export interface MaterialBase {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  unitPrice: number;
  currency: string;
  supplier?: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Aluminum Profile Types
// ============================================================================

export enum ProfileSystem {
  XINGFA = "xingfa",
  VIET_PHAP = "viet_phap",
  HYUNDAI = "hyundai",
  PMI = "pmi",
  AUSTDOOR = "austdoor",
  JMA = "jma",
  EUROWINDOW = "eurowindow",
  CUSTOM = "custom",
}

export enum ProfileType {
  // Frame profiles
  FRAME_MAIN = "frame_main", // Khung chính
  FRAME_OUTER = "frame_outer", // Khung ngoài
  FRAME_INNER = "frame_inner", // Khung trong

  // Sash profiles
  SASH_MAIN = "sash_main", // Cánh chính
  SASH_MEETING = "sash_meeting", // Thanh giữa cánh

  // Mullion/Transom
  MULLION = "mullion", // Thanh đứng chia ô
  TRANSOM = "transom", // Thanh ngang chia ô

  // Glazing
  GLAZING_BEAD = "glazing_bead", // Nẹp kính
  GLAZING_CHANNEL = "glazing_channel", // Rãnh kính

  // Decorative
  COVER_CAP = "cover_cap", // Nắp che
  CORNER_JOINT = "corner_joint", // Góc nối

  // Threshold
  THRESHOLD = "threshold", // Ngưỡng cửa
  SILL = "sill", // Đáy cửa
}

export enum ProfileFinish {
  ANODIZED_NATURAL = "anodized_natural",
  ANODIZED_BLACK = "anodized_black",
  ANODIZED_BRONZE = "anodized_bronze",
  ANODIZED_CHAMPAGNE = "anodized_champagne",
  POWDER_WHITE = "powder_white",
  POWDER_BLACK = "powder_black",
  POWDER_GREY = "powder_grey",
  POWDER_WOOD_GRAIN = "powder_wood_grain",
  ELECTROPHORESIS = "electrophoresis",
  LAMINATED = "laminated",
}

export interface ProfileDimensions {
  width: number; // mm - Chiều rộng mặt cắt
  height: number; // mm - Chiều cao mặt cắt
  wallThickness: number; // mm - Độ dày thành
  weight: number; // kg/m - Trọng lượng trên mét
}

export interface ProfileMaterial extends MaterialBase {
  category: MaterialCategory.ALUMINUM_PROFILE;
  system: ProfileSystem;
  profileType: ProfileType;
  finish: ProfileFinish;
  dimensions: ProfileDimensions;
  standardLength: number; // mm - Chiều dài tiêu chuẩn (thường 6000mm)
  glassThicknessRange: {
    min: number;
    max: number;
  };
  color?: string;
  colorCode?: string;
}

// ============================================================================
// Glass Types
// ============================================================================

export enum GlassCategory {
  CLEAR = "clear",
  TINTED = "tinted",
  REFLECTIVE = "reflective",
  LOW_E = "low_e",
  LAMINATED = "laminated",
  TEMPERED = "tempered",
  FROSTED = "frosted",
  PATTERNED = "patterned",
  MIRROR = "mirror",
}

export enum GlassColor {
  CLEAR = "clear",
  GREY = "grey",
  BRONZE = "bronze",
  GREEN = "green",
  BLUE = "blue",
  BLACK = "black",
  WHITE_OPAL = "white_opal",
}

export interface GlassProperties {
  thickness: number; // mm
  density: number; // kg/m2
  lightTransmittance: number; // % - Độ truyền sáng
  uvBlock: number; // % - Chặn tia UV
  soundInsulation: number; // dB - Cách âm
  thermalInsulation?: number; // U-value
}

export interface GlassMaterial extends MaterialBase {
  category: MaterialCategory.GLASS;
  glassCategory: GlassCategory;
  color: GlassColor;
  properties: GlassProperties;
  isTempered: boolean;
  isLaminated: boolean;
  maxSize: {
    width: number; // mm
    height: number; // mm
  };
  minSize: {
    width: number;
    height: number;
  };
}

// ============================================================================
// Accessory Types
// ============================================================================

export enum AccessoryType {
  // Locks & Handles
  HANDLE = "handle",
  LOCK = "lock",
  CYLINDER = "cylinder",
  ESPAGNOLETTE = "espagnolette", // Thanh chốt nhiều điểm

  // Hinges
  HINGE = "hinge",
  PIVOT_HINGE = "pivot_hinge",
  CONCEALED_HINGE = "concealed_hinge",

  // Rollers & Tracks
  ROLLER = "roller",
  TRACK = "track",
  GUIDE_RAIL = "guide_rail",

  // Sealing
  GASKET = "gasket", // Gioăng
  BRUSH_SEAL = "brush_seal",
  WEATHER_STRIP = "weather_strip",
  SILICONE = "silicone",

  // Closers
  DOOR_CLOSER = "door_closer",
  FLOOR_SPRING = "floor_spring",

  // Glass Fittings
  GLASS_CLAMP = "glass_clamp",
  GLAZING_BLOCK = "glazing_block",
  SPACER = "spacer",

  // Screws & Fasteners
  SCREW = "screw",
  ANCHOR = "anchor",
  CORNER_BRACKET = "corner_bracket",

  // Other
  DRAIN_COVER = "drain_cover",
  MOSQUITO_NET = "mosquito_net",
}

export enum AccessoryMaterial {
  STAINLESS_STEEL = "stainless_steel",
  ZINC_ALLOY = "zinc_alloy",
  ALUMINUM = "aluminum",
  PLASTIC = "plastic",
  RUBBER = "rubber",
  EPDM = "epdm",
  SILICONE = "silicone",
  BRASS = "brass",
}

export interface AccessoryItem extends MaterialBase {
  category: MaterialCategory.ACCESSORY;
  accessoryType: AccessoryType;
  material: AccessoryMaterial;
  finish?: string;
  loadCapacity?: number; // kg - Tải trọng
  specifications?: Record<string, string | number>;
  compatibleSystems?: ProfileSystem[];
  compatibleDoorTypes?: string[];
}

// ============================================================================
// Pricing & Inventory
// ============================================================================

export interface PriceHistory {
  date: Date;
  price: number;
  currency: string;
  supplier?: string;
}

export interface InventoryInfo {
  materialId: string;
  quantity: number;
  unit: MaterialUnit;
  location?: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  lastRestocked?: Date;
}

export interface MaterialWithInventory extends MaterialBase {
  inventory: InventoryInfo;
  priceHistory: PriceHistory[];
}

// ============================================================================
// Material Selection
// ============================================================================

export interface MaterialFilter {
  category?: MaterialCategory;
  system?: ProfileSystem;
  profileType?: ProfileType;
  glassCategory?: GlassCategory;
  accessoryType?: AccessoryType;
  priceRange?: {
    min: number;
    max: number;
  };
  supplier?: string;
  brand?: string;
  isActive?: boolean;
  searchText?: string;
}

export interface MaterialSortOptions {
  field: "name" | "code" | "price" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}

// ============================================================================
// Material Usage in BOM
// ============================================================================

export interface MaterialUsage {
  material: MaterialBase;
  quantity: number;
  unit: MaterialUnit;
  wastagePercent: number;
  grossQuantity: number; // quantity + wastage
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface CutPiece {
  materialId: string;
  length: number; // mm
  quantity: number;
  angle1: number; // degrees - góc cắt đầu 1
  angle2: number; // degrees - góc cắt đầu 2
  label: string;
  position: string; // e.g., "Frame Top", "Frame Left"
}

export interface GlassPiece {
  materialId: string;
  width: number; // mm
  height: number; // mm
  quantity: number;
  area: number; // m2
  edgeFinish?: "raw" | "polished" | "beveled";
  holes?: {
    x: number;
    y: number;
    diameter: number;
  }[];
  notches?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  label: string;
  position: string;
}

// ============================================================================
// Material Catalog Summary
// ============================================================================

export interface CatalogSummary {
  totalMaterials: number;
  byCategory: Record<MaterialCategory, number>;
  totalValue: number;
  currency: string;
  lastUpdated: Date;
}

// Type guards
export function isProfileMaterial(
  material: MaterialBase
): material is ProfileMaterial {
  return material.category === MaterialCategory.ALUMINUM_PROFILE;
}

export function isGlassMaterial(
  material: MaterialBase
): material is GlassMaterial {
  return material.category === MaterialCategory.GLASS;
}

export function isAccessoryItem(
  material: MaterialBase
): material is AccessoryItem {
  return material.category === MaterialCategory.ACCESSORY;
}
