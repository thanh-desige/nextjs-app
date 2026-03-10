/**
 * propertySchema.types.ts
 *
 * Core type definitions for the Property Schema system.
 * Extracted from PropertySchema.ts (STEP-5.14)
 */

// ============================================
// PROPERTY VALUE TYPES
// ============================================

export type PropertyValueType =
  | "string"
  | "number"
  | "boolean"
  | "color"
  | "point" // IVec2
  | "enum"
  | "readonly"
  | "angle" // number in radians, displayed as degrees
  | "length"; // number with unit conversion

// ============================================
// PROPERTY DEFINITION
// ============================================

export interface PropertyDefinition {
  /** Unique key for this property */
  key: string;

  /** Display label */
  label: string;

  /** Value type */
  type: PropertyValueType;

  /** Property category/group */
  category: PropertyCategory;

  /** Is this property editable? */
  editable: boolean;

  /** Default value */
  defaultValue?: unknown;

  // Validation constraints
  /** Min value for numbers */
  min?: number;
  /** Max value for numbers */
  max?: number;
  /** Step for number inputs */
  step?: number;
  /** Enum options */
  options?: EnumOption[];
  /** Custom validator function */
  validate?: (value: unknown) => ValidationResult;

  // Display hints
  /** Unit suffix to display */
  unit?: string;
  /** Precision for numbers */
  precision?: number;
  /** Tooltip/description */
  description?: string;

  // Dependencies
  /** Only show if these conditions are met */
  showIf?: (entity: Record<string, unknown>) => boolean;
  /** Computed from other properties */
  computed?: (entity: Record<string, unknown>) => unknown;
}

export interface EnumOption {
  value: string | number;
  label: string;
  icon?: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  correctedValue?: unknown;
}

// ============================================
// PROPERTY CATEGORIES
// ============================================

export enum PropertyCategory {
  GENERAL = "general",
  GEOMETRY = "geometry",
  STYLE = "style",
  DIMENSION = "dimension",
  TEXT = "text",
  CUSTOM = "custom",
}

// ============================================
// ENTITY SCHEMA
// ============================================

export interface EntitySchema {
  entityType: import("../entities/Entity.types").EntityType;
  properties: PropertyDefinition[];
  /** Custom entity-level validator */
  validate?: (entity: Record<string, unknown>) => ValidationResult;
}
