/**
 * PropertySchema.ts — Facade + Registry
 *
 * LUẬT TỐI CAO cho tất cả properties của entities
 *
 * See: propertySchema.types.ts, propertyBaseDefinitions.ts, entitySchemas.ts
 * Extracted in STEP-5.14: types + base definitions + 8 entity schemas
 */

import { EntityType } from "../entities/Entity.types";
import {
  EntitySchema,
  PropertyDefinition,
  PropertyCategory,
  ValidationResult,
} from "./propertySchema.types";
import {
  LINE_SCHEMA,
  RECT_SCHEMA,
  CIRCLE_SCHEMA,
  ARC_SCHEMA,
  ELLIPSE_SCHEMA,
  POLYLINE_SCHEMA,
  TEXT_SCHEMA,
  DIMENSION_SCHEMA,
} from "./entitySchemas";

// Re-export everything for backward compatibility
export type { PropertyValueType } from "./propertySchema.types";
export {
  type PropertyDefinition,
  type EnumOption,
  type ValidationResult,
  PropertyCategory,
  type EntitySchema,
} from "./propertySchema.types";
export { BASE_PROPERTIES, STYLE_PROPERTIES } from "./propertyBaseDefinitions";
export {
  LINE_SCHEMA,
  RECT_SCHEMA,
  CIRCLE_SCHEMA,
  ARC_SCHEMA,
  ELLIPSE_SCHEMA,
  POLYLINE_SCHEMA,
  TEXT_SCHEMA,
  DIMENSION_SCHEMA,
} from "./entitySchemas";

// ============================================
// SCHEMA REGISTRY
// ============================================

class PropertySchemaRegistry {
  private schemas: Map<EntityType, EntitySchema> = new Map();
  private customProperties: Map<string, PropertyDefinition[]> = new Map();

  constructor() {
    // Register built-in schemas
    this.registerSchema(LINE_SCHEMA);
    this.registerSchema(RECT_SCHEMA);
    this.registerSchema(CIRCLE_SCHEMA);
    this.registerSchema(ARC_SCHEMA);
    this.registerSchema(ELLIPSE_SCHEMA);
    this.registerSchema(POLYLINE_SCHEMA);
    this.registerSchema(TEXT_SCHEMA);
    this.registerSchema(DIMENSION_SCHEMA);
  }

  // ============================================
  // SCHEMA REGISTRATION
  // ============================================

  /**
   * Register a new entity schema
   * Used by plugins to add new entity types
   */
  registerSchema(schema: EntitySchema): void {
    this.schemas.set(schema.entityType, schema);
  }

  /**
   * Add custom properties to an existing entity type
   * Used by plugins to extend entities
   */
  addCustomProperties(
    entityType: EntityType,
    properties: PropertyDefinition[]
  ): void {
    const key = entityType.toString();
    const existing = this.customProperties.get(key) ?? [];
    this.customProperties.set(key, [...existing, ...properties]);
  }

  // ============================================
  // SCHEMA ACCESS
  // ============================================

  /**
   * Get schema for entity type
   */
  getSchema(entityType: EntityType): EntitySchema | undefined {
    const baseSchema = this.schemas.get(entityType);
    if (!baseSchema) return undefined;

    // Merge with custom properties
    const customProps = this.customProperties.get(entityType.toString()) ?? [];
    if (customProps.length === 0) return baseSchema;

    return {
      ...baseSchema,
      properties: [...baseSchema.properties, ...customProps],
    };
  }

  /**
   * Get all properties for entity type
   */
  getProperties(entityType: EntityType): PropertyDefinition[] {
    return this.getSchema(entityType)?.properties ?? [];
  }

  /**
   * Get property definition by key
   */
  getProperty(
    entityType: EntityType,
    key: string
  ): PropertyDefinition | undefined {
    return this.getProperties(entityType).find((p) => p.key === key);
  }

  /**
   * Get properties grouped by category
   */
  getPropertiesByCategory(
    entityType: EntityType
  ): Map<PropertyCategory, PropertyDefinition[]> {
    const properties = this.getProperties(entityType);
    const grouped = new Map<PropertyCategory, PropertyDefinition[]>();

    for (const prop of properties) {
      const category = prop.category;
      const existing = grouped.get(category) ?? [];
      grouped.set(category, [...existing, prop]);
    }

    return grouped;
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate a single property value
   */
  validateProperty(
    entityType: EntityType,
    key: string,
    value: unknown
  ): ValidationResult {
    const propDef = this.getProperty(entityType, key);
    if (!propDef) {
      return { valid: false, message: `Unknown property: ${key}` };
    }

    // Check if editable
    if (!propDef.editable) {
      return { valid: false, message: `Property ${key} is read-only` };
    }

    // Type validation
    const typeResult = this.validateType(propDef, value);
    if (!typeResult.valid) return typeResult;

    // Range validation for numbers
    if (
      propDef.type === "number" ||
      propDef.type === "length" ||
      propDef.type === "angle"
    ) {
      const numValue = value as number;
      if (propDef.min !== undefined && numValue < propDef.min) {
        return {
          valid: false,
          message: `Value must be at least ${propDef.min}`,
          correctedValue: propDef.min,
        };
      }
      if (propDef.max !== undefined && numValue > propDef.max) {
        return {
          valid: false,
          message: `Value must be at most ${propDef.max}`,
          correctedValue: propDef.max,
        };
      }
    }

    // Enum validation
    if (propDef.type === "enum" && propDef.options) {
      const validValues = propDef.options.map((o) => o.value);
      if (!validValues.includes(value as string | number)) {
        return {
          valid: false,
          message: `Value must be one of: ${validValues.join(", ")}`,
        };
      }
    }

    // Custom validator
    if (propDef.validate) {
      return propDef.validate(value);
    }

    return { valid: true };
  }

  /**
   * Validate value type
   */
  private validateType(
    propDef: PropertyDefinition,
    value: unknown
  ): ValidationResult {
    switch (propDef.type) {
      case "string":
        if (typeof value !== "string") {
          return { valid: false, message: "Value must be a string" };
        }
        break;

      case "number":
      case "length":
      case "angle":
        if (typeof value !== "number" || isNaN(value)) {
          return { valid: false, message: "Value must be a number" };
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          return { valid: false, message: "Value must be a boolean" };
        }
        break;

      case "color":
        if (value !== null && typeof value !== "string") {
          return {
            valid: false,
            message: "Value must be a color string or null",
          };
        }
        break;

      case "point":
        if (!value || typeof value !== "object") {
          return { valid: false, message: "Value must be a point object" };
        }
        const point = value as Record<string, unknown>;
        if (typeof point.x !== "number" || typeof point.y !== "number") {
          return { valid: false, message: "Point must have x and y numbers" };
        }
        break;

      case "enum":
        // Enum validation handled separately
        break;

      case "readonly":
        return { valid: false, message: "Cannot modify read-only property" };
    }

    return { valid: true };
  }

  /**
   * Validate entire entity
   */
  validateEntity(entity: Record<string, unknown>): ValidationResult {
    const entityType = entity.type as EntityType;
    const schema = this.getSchema(entityType);

    if (!schema) {
      return { valid: false, message: `Unknown entity type: ${entityType}` };
    }

    // Validate all required properties exist
    for (const prop of schema.properties) {
      if (!prop.editable) continue; // Skip readonly

      const value = this.getNestedValue(entity, prop.key);
      if (value === undefined && prop.defaultValue === undefined) {
        // Check if it's a nested property (like start.x)
        if (!prop.key.includes(".")) {
          return {
            valid: false,
            message: `Missing required property: ${prop.key}`,
          };
        }
      }
    }

    // Run entity-level validator
    if (schema.validate) {
      return schema.validate(entity);
    }

    return { valid: true };
  }

  /**
   * Get nested value from entity (e.g., "start.x")
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const propertySchema = new PropertySchemaRegistry();

export { PropertySchemaRegistry };
