/**
 * BomItem.ts
 * Bill of Materials item types and structures
 */

import {
  MaterialBase,
  MaterialCategory,
  MaterialUnit,
  CutPiece,
  GlassPiece,
} from "../materials/Material.types";

// ============================================================================
// BOM Item Types
// ============================================================================

export enum BomItemType {
  PROFILE = "profile",
  GLASS = "glass",
  ACCESSORY = "accessory",
  LABOR = "labor",
  OVERHEAD = "overhead",
}

export enum BomItemStatus {
  PENDING = "pending",
  ORDERED = "ordered",
  IN_STOCK = "in_stock",
  CUT = "cut",
  ASSEMBLED = "assembled",
  INSTALLED = "installed",
}

// ============================================================================
// BOM Item Interface
// ============================================================================

export interface BomItem {
  id: string;
  type: BomItemType;
  material: MaterialBase;

  // Quantities
  quantity: number;
  unit: MaterialUnit;
  wastagePercent: number;
  grossQuantity: number; // quantity * (1 + wastagePercent/100)

  // Pricing
  unitPrice: number;
  totalPrice: number;
  discountPercent?: number;
  discountedPrice?: number;

  // For profiles
  cutPieces?: CutPiece[];
  totalLength?: number; // mm

  // For glass
  glassPieces?: GlassPiece[];
  totalArea?: number; // m2

  // Metadata
  position: string; // e.g., "Frame", "Sash 1", "Fixed Panel"
  notes?: string;
  status: BomItemStatus;
}

// ============================================================================
// BOM Summary
// ============================================================================

export interface BomSummary {
  totalItems: number;
  totalProfiles: number;
  totalGlass: number;
  totalAccessories: number;

  // Profile summary
  profileLength: number; // Total length in mm
  profileWeight: number; // Total weight in kg
  profileCost: number; // Total cost

  // Glass summary
  glassArea: number; // Total area in m2
  glassWeight: number; // Total weight in kg
  glassCost: number; // Total cost

  // Accessory summary
  accessoryCost: number; // Total cost

  // Labor & overhead
  laborCost: number;
  overheadCost: number;

  // Totals
  materialCost: number;
  totalCost: number;
  currency: string;
}

// ============================================================================
// BOM Document
// ============================================================================

export interface BomDocument {
  id: string;
  projectId: string;
  projectName: string;
  doorId: string;
  doorName: string;

  // Items
  items: BomItem[];
  summary: BomSummary;

  // Metadata
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // Status
  status: "draft" | "review" | "approved" | "ordered" | "completed";
  approvedBy?: string;
  approvedAt?: Date;

  // Notes
  notes?: string;
  internalNotes?: string;
}

// ============================================================================
// Cut List
// ============================================================================

export interface CutListItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;

  // Dimensions
  stockLength: number; // Standard stock length (e.g., 6000mm)
  cutPieces: {
    length: number;
    quantity: number;
    label: string;
    angle1: number;
    angle2: number;
  }[];

  // Optimization results
  usedLength: number;
  wasteLength: number;
  wastePercent: number;
  stocksNeeded: number;
}

export interface CutList {
  id: string;
  bomId: string;
  items: CutListItem[];

  // Summary
  totalStocksNeeded: number;
  totalWasteLength: number;
  averageWastePercent: number;
  optimizationScore: number; // 0-100

  // Metadata
  createdAt: Date;
  algorithm: "first-fit" | "best-fit" | "genetic" | "linear-programming";
}

// ============================================================================
// Glass Cut List
// ============================================================================

export interface GlassCutItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  thickness: number;

  // Stock sheet
  stockWidth: number;
  stockHeight: number;

  // Cut pieces
  pieces: {
    width: number;
    height: number;
    quantity: number;
    label: string;
    rotation: boolean; // Can be rotated 90°
  }[];

  // Optimization results
  usedArea: number;
  wasteArea: number;
  wastePercent: number;
  sheetsNeeded: number;

  // Cutting pattern
  pattern?: {
    sheetIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
    label: string;
  }[];
}

export interface GlassCutList {
  id: string;
  bomId: string;
  items: GlassCutItem[];

  // Summary
  totalSheetsNeeded: number;
  totalWasteArea: number;
  averageWastePercent: number;
  optimizationScore: number;

  // Metadata
  createdAt: Date;
  algorithm: "guillotine" | "maxrects" | "genetic";
}

// ============================================================================
// BOM Comparison
// ============================================================================

export interface BomComparison {
  originalBom: BomDocument;
  comparedBom: BomDocument;

  // Differences
  addedItems: BomItem[];
  removedItems: BomItem[];
  modifiedItems: {
    original: BomItem;
    modified: BomItem;
    changes: string[];
  }[];

  // Cost comparison
  originalCost: number;
  comparedCost: number;
  costDifference: number;
  costDifferencePercent: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function createBomItem(
  material: MaterialBase,
  quantity: number,
  position: string,
  options?: {
    wastagePercent?: number;
    discountPercent?: number;
    notes?: string;
  }
): BomItem {
  const wastagePercent =
    options?.wastagePercent ?? getDefaultWastage(material.category);
  const grossQuantity = quantity * (1 + wastagePercent / 100);
  const totalPrice = grossQuantity * material.unitPrice;

  const discountPercent = options?.discountPercent ?? 0;
  const discountedPrice = totalPrice * (1 - discountPercent / 100);

  return {
    id: generateBomItemId(),
    type: getBomItemType(material.category),
    material,
    quantity,
    unit: material.unit,
    wastagePercent,
    grossQuantity,
    unitPrice: material.unitPrice,
    totalPrice,
    discountPercent: discountPercent > 0 ? discountPercent : undefined,
    discountedPrice: discountPercent > 0 ? discountedPrice : undefined,
    position,
    notes: options?.notes,
    status: BomItemStatus.PENDING,
  };
}

export function calculateBomSummary(
  items: BomItem[],
  laborCost = 0,
  overheadCost = 0
): BomSummary {
  let profileLength = 0;
  const profileWeight = 0; // TODO: Calculate from material density
  let profileCost = 0;

  let glassArea = 0;
  const glassWeight = 0; // TODO: Calculate from glass density
  let glassCost = 0;

  let accessoryCost = 0;

  let totalProfiles = 0;
  let totalGlass = 0;
  let totalAccessories = 0;

  for (const item of items) {
    const cost = item.discountedPrice ?? item.totalPrice;

    switch (item.type) {
      case BomItemType.PROFILE:
        totalProfiles++;
        profileLength += item.totalLength ?? 0;
        profileCost += cost;
        break;

      case BomItemType.GLASS:
        totalGlass++;
        glassArea += item.totalArea ?? 0;
        glassCost += cost;
        break;

      case BomItemType.ACCESSORY:
        totalAccessories++;
        accessoryCost += cost;
        break;
    }
  }

  const materialCost = profileCost + glassCost + accessoryCost;
  const totalCost = materialCost + laborCost + overheadCost;

  return {
    totalItems: items.length,
    totalProfiles,
    totalGlass,
    totalAccessories,
    profileLength,
    profileWeight,
    profileCost,
    glassArea,
    glassWeight,
    glassCost,
    accessoryCost,
    laborCost,
    overheadCost,
    materialCost,
    totalCost,
    currency: "VND",
  };
}

function getBomItemType(category: MaterialCategory): BomItemType {
  switch (category) {
    case MaterialCategory.ALUMINUM_PROFILE:
      return BomItemType.PROFILE;
    case MaterialCategory.GLASS:
      return BomItemType.GLASS;
    default:
      return BomItemType.ACCESSORY;
  }
}

function getDefaultWastage(category: MaterialCategory): number {
  switch (category) {
    case MaterialCategory.ALUMINUM_PROFILE:
      return 5; // 5% wastage for profiles
    case MaterialCategory.GLASS:
      return 3; // 3% wastage for glass
    default:
      return 0; // No wastage for accessories
  }
}

function generateBomItemId(): string {
  return `bom-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Export Types
// ============================================================================

export interface BomExportOptions {
  format: "json" | "csv" | "excel" | "pdf";
  includeDetails: boolean;
  includePricing: boolean;
  includeNotes: boolean;
  groupBy?: "type" | "position" | "material";
  language?: "vi" | "en";
}

export interface BomImportResult {
  success: boolean;
  importedItems: number;
  failedItems: number;
  errors: string[];
  warnings: string[];
  bom?: BomDocument;
}
