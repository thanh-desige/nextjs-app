/**
 * Domain Layer Index
 * Exports all domain modules for aluminum/glass door CAD application
 */

// ============================================================================
// Door Domain - Classes and Enums (can be used as values)
// ============================================================================
export {
  DoorModel,
  DoorType,
  FrameType,
  GlassType,
  OpeningDirection,
  HardwareType,
} from "./door/DoorModel";

export type {
  DoorModelData,
  ProfileDimensions,
  FrameComponent,
  PanelComponent,
  HardwareItem,
  DoorDimensions,
} from "./door/DoorModel";

export { DoorParametrics } from "./door/DoorParametrics";

export type {
  DoorConstraints,
  ValidationResult,
  FrameCutItem,
} from "./door/DoorParametrics";

export { DoorTemplate, TemplateCategory } from "./door/DoorTemplate";

export type { DoorTemplateData } from "./door/DoorTemplate";

// ============================================================================
// Materials Domain
// ============================================================================
export {
  ProfileSystem,
  MaterialCategory,
  MaterialUnit,
  ProfileType,
  GlassCategory,
  AccessoryType,
  AccessoryMaterial,
} from "./materials/Material.types";

export type {
  ProfileMaterial,
  GlassMaterial,
  AccessoryItem,
  CutPiece,
  GlassPiece,
} from "./materials/Material.types";

export { ProfileCatalog } from "./materials/ProfileCatalog";
export { GlassCatalog } from "./materials/GlassCatalog";
export { AccessoryCatalog } from "./materials/AccessoryCatalog";

// ============================================================================
// BOM Domain
// ============================================================================
export { BomItemType, createBomItem, calculateBomSummary } from "./bom/BomItem";

export type {
  BomItem,
  BomDocument,
  CutList,
  GlassCutList,
} from "./bom/BomItem";

export { BomCalculator } from "./bom/BomCalculator";
export type { BomCalculatorConfig } from "./bom/BomCalculator";

export { CutListOptimizer } from "./bom/CutListOptimizer";
export type { CutOptimizerConfig } from "./bom/CutListOptimizer";

export { GlassCutCalculator } from "./bom/GlassCutCalculator";
export type { GlassCutConfig } from "./bom/GlassCutCalculator";

export { QuoteCalculator } from "./bom/QuoteCalculator";

export { ReportGenerator } from "./bom/ReportGenerator";
export type { ReportFormat } from "./bom/ReportGenerator";

// ============================================================================
// Rules Domain
// ============================================================================
export { BuildingRules } from "./rules/BuildingRules";
export type { ValidationResult as BuildingValidationResult } from "./rules/BuildingRules";

export {
  PricingRules,
  PricingRuleType,
  CustomerTier,
  getQuickEstimate,
} from "./rules/PricingRules";

export type {
  PricingRule,
  PriceBreakdown,
  BasePriceMatrix,
} from "./rules/PricingRules";

// ============================================================================
// Projects Domain
// ============================================================================
export {
  ProjectStatus,
  ProjectPhase,
  ProjectCategory,
  CustomerType,
  DocumentType,
  QuotationStatus,
  TeamRole,
  ProjectPermission,
  MilestoneStatus,
  NoteType,
  ProjectEventType,
  createDefaultProject,
  createProjectSummary,
} from "./projects/Project.types";

export type {
  Project,
  ProjectSummary,
  CustomerInfo,
  Address,
  ProjectLocation,
  ProjectDocument,
  Quotation,
  QuotationItem,
  PaymentTerms,
  TeamMember,
  Milestone,
  ProjectNote,
  ProjectSettings,
  ProjectFilter,
  ProjectSort,
  ProjectPagination,
  ProjectEvent,
  ProjectTemplate,
  QuotationDiscount,
} from "./projects/Project.types";

export type { CustomerTierConfig } from "./rules/PricingRules";

export {
  IndexedDBProjectRepository,
  InMemoryProjectRepository,
} from "./projects/ProjectRepository";

export type { IProjectRepository } from "./projects/ProjectRepository";

export {
  ProjectService,
  createProjectService,
} from "./projects/ProjectService";

export type {
  ProjectServiceOptions,
  ServiceResult,
} from "./projects/ProjectService";
