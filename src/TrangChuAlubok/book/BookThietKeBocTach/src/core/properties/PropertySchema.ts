/**
 * PropertySchema.ts
 *
 * LUẬT TỐI CAO cho tất cả properties của entities
 *
 * Mọi thao tác property PHẢI đi qua đây:
 * - UI → PropertySchema.validate() → PropertyApplier → Entity
 * - Plugin thêm property → registerSchema()
 * - Script tạo entity → validateEntity()
 * - Parametric constraint → applyConstraint() qua schema
 *
 * Vi phạm = PropertiesPanel vỡ, Undo/Redo hỏng
 */

import { EntityType, DEFAULT_STYLE } from "../entities/Entity.types";
import { IVec2 } from "../geometry/Vec2";

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
  entityType: EntityType;
  properties: PropertyDefinition[];
  /** Custom entity-level validator */
  validate?: (entity: Record<string, unknown>) => ValidationResult;
}

// ============================================
// BASE PROPERTIES (shared by all entities)
// ============================================

const BASE_PROPERTIES: PropertyDefinition[] = [
  {
    key: "id",
    label: "ID",
    type: "readonly",
    category: PropertyCategory.GENERAL,
    editable: false,
    description: "Unique identifier",
  },
  {
    key: "type",
    label: "Type",
    type: "readonly",
    category: PropertyCategory.GENERAL,
    editable: false,
    description: "Entity type",
  },
  {
    key: "name",
    label: "Name",
    type: "string",
    category: PropertyCategory.GENERAL,
    editable: true,
    defaultValue: "",
    description: "Optional name for the entity",
  },
  {
    key: "layerId",
    label: "Layer",
    type: "string",
    category: PropertyCategory.GENERAL,
    editable: true,
    description: "Layer this entity belongs to",
  },
];

// ============================================
// STYLE PROPERTIES
// ============================================

const STYLE_PROPERTIES: PropertyDefinition[] = [
  {
    key: "style.strokeColor",
    label: "Stroke Color",
    type: "color",
    category: PropertyCategory.STYLE,
    editable: true,
    defaultValue: DEFAULT_STYLE.strokeColor,
  },
  {
    key: "style.strokeWidth",
    label: "Stroke Width",
    type: "number",
    category: PropertyCategory.STYLE,
    editable: true,
    defaultValue: DEFAULT_STYLE.strokeWidth,
    min: 0.5,
    max: 20,
    step: 0.5,
    unit: "px",
  },
  {
    key: "style.strokeStyle",
    label: "Stroke Style",
    type: "enum",
    category: PropertyCategory.STYLE,
    editable: true,
    defaultValue: DEFAULT_STYLE.strokeStyle,
    options: [
      { value: "solid", label: "Solid" },
      { value: "dashed", label: "Dashed" },
      { value: "dotted", label: "Dotted" },
      { value: "dashdot", label: "Dash-Dot" },
    ],
  },
  {
    key: "style.fillColor",
    label: "Fill Color",
    type: "color",
    category: PropertyCategory.STYLE,
    editable: true,
    defaultValue: null,
    description: "Fill color (null for no fill)",
  },
  {
    key: "style.opacity",
    label: "Opacity",
    type: "number",
    category: PropertyCategory.STYLE,
    editable: true,
    defaultValue: DEFAULT_STYLE.opacity,
    min: 0,
    max: 1,
    step: 0.1,
  },
];

// ============================================
// ENTITY-SPECIFIC SCHEMAS
// ============================================

const LINE_SCHEMA: EntitySchema = {
  entityType: EntityType.LINE,
  properties: [
    ...BASE_PROPERTIES,
    {
      key: "start",
      label: "Start Point",
      type: "point",
      category: PropertyCategory.GEOMETRY,
      editable: true,
    },
    {
      key: "start.x",
      label: "Start X",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "start.y",
      label: "Start Y",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "end",
      label: "End Point",
      type: "point",
      category: PropertyCategory.GEOMETRY,
      editable: true,
    },
    {
      key: "end.x",
      label: "End X",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "end.y",
      label: "End Y",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "length",
      label: "Length",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => {
        const start = entity.start as IVec2;
        const end = entity.end as IVec2;
        if (!start || !end) return 0;
        return Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
      },
      precision: 2,
    },
    {
      key: "angle",
      label: "Angle",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => {
        const start = entity.start as IVec2;
        const end = entity.end as IVec2;
        if (!start || !end) return 0;
        return Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
      },
      unit: "°",
      precision: 2,
    },
    ...STYLE_PROPERTIES,
  ],
};

const RECT_SCHEMA: EntitySchema = {
  entityType: EntityType.RECT,
  properties: [
    ...BASE_PROPERTIES,
    {
      key: "origin",
      label: "Origin",
      type: "point",
      category: PropertyCategory.GEOMETRY,
      editable: true,
    },
    {
      key: "origin.x",
      label: "Origin X",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "origin.y",
      label: "Origin Y",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "width",
      label: "Width",
      type: "length",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      min: 0,
      step: 1,
    },
    {
      key: "height",
      label: "Height",
      type: "length",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      min: 0,
      step: 1,
    },
    {
      key: "rotation",
      label: "Rotation",
      type: "angle",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
      unit: "°",
    },
    {
      key: "area",
      label: "Area",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => {
        const width = entity.width as number;
        const height = entity.height as number;
        return width * height;
      },
      precision: 2,
    },
    ...STYLE_PROPERTIES,
  ],
};

const CIRCLE_SCHEMA: EntitySchema = {
  entityType: EntityType.CIRCLE,
  properties: [
    ...BASE_PROPERTIES,
    {
      key: "center",
      label: "Center",
      type: "point",
      category: PropertyCategory.GEOMETRY,
      editable: true,
    },
    {
      key: "center.x",
      label: "Center X",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "center.y",
      label: "Center Y",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "radius",
      label: "Radius",
      type: "length",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      min: 0,
      step: 1,
    },
    {
      key: "diameter",
      label: "Diameter",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => (entity.radius as number) * 2,
      precision: 2,
    },
    {
      key: "circumference",
      label: "Circumference",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => 2 * Math.PI * (entity.radius as number),
      precision: 2,
    },
    {
      key: "area",
      label: "Area",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => Math.PI * Math.pow(entity.radius as number, 2),
      precision: 2,
    },
    ...STYLE_PROPERTIES,
  ],
};

const ARC_SCHEMA: EntitySchema = {
  entityType: EntityType.ARC,
  properties: [
    ...BASE_PROPERTIES,
    {
      key: "center",
      label: "Center",
      type: "point",
      category: PropertyCategory.GEOMETRY,
      editable: true,
    },
    {
      key: "center.x",
      label: "Center X",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "center.y",
      label: "Center Y",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "radius",
      label: "Radius",
      type: "length",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      min: 0,
      step: 1,
    },
    {
      key: "startAngle",
      label: "Start Angle",
      type: "angle",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      unit: "°",
    },
    {
      key: "endAngle",
      label: "End Angle",
      type: "angle",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      unit: "°",
    },
    {
      key: "arcLength",
      label: "Arc Length",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => {
        const radius = entity.radius as number;
        const startAngle = entity.startAngle as number;
        const endAngle = entity.endAngle as number;
        let sweep = endAngle - startAngle;
        if (sweep < 0) sweep += 2 * Math.PI;
        return radius * sweep;
      },
      precision: 2,
    },
    ...STYLE_PROPERTIES,
  ],
};

const POLYLINE_SCHEMA: EntitySchema = {
  entityType: EntityType.POLYLINE,
  properties: [
    ...BASE_PROPERTIES,
    {
      key: "points",
      label: "Points",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      description: "Array of vertices",
    },
    {
      key: "pointCount",
      label: "Point Count",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => (entity.points as IVec2[])?.length ?? 0,
    },
    {
      key: "closed",
      label: "Closed",
      type: "boolean",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      defaultValue: false,
    },
    {
      key: "length",
      label: "Total Length",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => {
        const points = entity.points as IVec2[];
        if (!points || points.length < 2) return 0;
        let total = 0;
        for (let i = 1; i < points.length; i++) {
          const dx = points[i].x - points[i - 1].x;
          const dy = points[i].y - points[i - 1].y;
          total += Math.sqrt(dx * dx + dy * dy);
        }
        if (entity.closed && points.length > 2) {
          const dx = points[0].x - points[points.length - 1].x;
          const dy = points[0].y - points[points.length - 1].y;
          total += Math.sqrt(dx * dx + dy * dy);
        }
        return total;
      },
      precision: 2,
    },
    ...STYLE_PROPERTIES,
  ],
};

const ELLIPSE_SCHEMA: EntitySchema = {
  entityType: EntityType.ELLIPSE,
  properties: [
    ...BASE_PROPERTIES,
    {
      key: "center",
      label: "Center",
      type: "point",
      category: PropertyCategory.GEOMETRY,
      editable: true,
    },
    {
      key: "center.x",
      label: "Center X",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "center.y",
      label: "Center Y",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "radiusX",
      label: "Major Radius",
      type: "length",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      min: 0,
      step: 1,
      description: "Semi-major axis length",
    },
    {
      key: "radiusY",
      label: "Minor Radius",
      type: "length",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      min: 0,
      step: 1,
      description: "Semi-minor axis length",
    },
    {
      key: "rotation",
      label: "Rotation",
      type: "angle",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      unit: "°",
    },
    {
      key: "area",
      label: "Area",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) =>
        Math.PI * (entity.radiusX as number) * (entity.radiusY as number),
      precision: 2,
    },
    {
      key: "perimeter",
      label: "Perimeter (approx)",
      type: "readonly",
      category: PropertyCategory.GEOMETRY,
      editable: false,
      computed: (entity) => {
        // Ramanujan approximation
        const a = entity.radiusX as number;
        const b = entity.radiusY as number;
        const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
        return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
      },
      precision: 2,
    },
    ...STYLE_PROPERTIES,
  ],
};

const TEXT_SCHEMA: EntitySchema = {
  entityType: EntityType.TEXT,
  properties: [
    ...BASE_PROPERTIES,
    {
      key: "position",
      label: "Position",
      type: "point",
      category: PropertyCategory.GEOMETRY,
      editable: true,
    },
    {
      key: "position.x",
      label: "Position X",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "position.y",
      label: "Position Y",
      type: "number",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      step: 1,
    },
    {
      key: "text",
      label: "Text",
      type: "string",
      category: PropertyCategory.TEXT,
      editable: true,
    },
    {
      key: "fontSize",
      label: "Font Size",
      type: "number",
      category: PropertyCategory.TEXT,
      editable: true,
      min: 1,
      max: 1000,
      step: 1,
      unit: "px",
    },
    {
      key: "fontFamily",
      label: "Font Family",
      type: "enum",
      category: PropertyCategory.TEXT,
      editable: true,
      options: [
        { value: "Arial", label: "Arial" },
        { value: "Helvetica", label: "Helvetica" },
        { value: "Times New Roman", label: "Times New Roman" },
        { value: "Courier New", label: "Courier New" },
      ],
    },
    {
      key: "textAlign",
      label: "Alignment",
      type: "enum",
      category: PropertyCategory.TEXT,
      editable: true,
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ],
    },
    {
      key: "rotation",
      label: "Rotation",
      type: "angle",
      category: PropertyCategory.GEOMETRY,
      editable: true,
      unit: "°",
    },
    ...STYLE_PROPERTIES,
  ],
};

const DIMENSION_SCHEMA: EntitySchema = {
  entityType: EntityType.DIMENSION,
  properties: [
    ...BASE_PROPERTIES,
    {
      key: "startPoint",
      label: "Start Point",
      type: "point",
      category: PropertyCategory.DIMENSION,
      editable: true,
    },
    {
      key: "startPoint.x",
      label: "Start X",
      type: "number",
      category: PropertyCategory.DIMENSION,
      editable: true,
      step: 1,
    },
    {
      key: "startPoint.y",
      label: "Start Y",
      type: "number",
      category: PropertyCategory.DIMENSION,
      editable: true,
      step: 1,
    },
    {
      key: "endPoint",
      label: "End Point",
      type: "point",
      category: PropertyCategory.DIMENSION,
      editable: true,
    },
    {
      key: "endPoint.x",
      label: "End X",
      type: "number",
      category: PropertyCategory.DIMENSION,
      editable: true,
      step: 1,
    },
    {
      key: "endPoint.y",
      label: "End Y",
      type: "number",
      category: PropertyCategory.DIMENSION,
      editable: true,
      step: 1,
    },
    {
      key: "offset",
      label: "Offset",
      type: "number",
      category: PropertyCategory.DIMENSION,
      editable: true,
      step: 1,
    },
    {
      key: "value",
      label: "Value",
      type: "readonly",
      category: PropertyCategory.DIMENSION,
      editable: false,
      computed: (entity) => {
        const start = entity.startPoint as IVec2;
        const end = entity.endPoint as IVec2;
        if (!start || !end) return 0;
        return Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
      },
      precision: 2,
    },
    {
      key: "prefix",
      label: "Prefix",
      type: "string",
      category: PropertyCategory.DIMENSION,
      editable: true,
      defaultValue: "",
    },
    {
      key: "suffix",
      label: "Suffix",
      type: "string",
      category: PropertyCategory.DIMENSION,
      editable: true,
      defaultValue: "",
    },
    ...STYLE_PROPERTIES,
  ],
};

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

// ============================================
// EXPORTS
// ============================================

export {
  PropertySchemaRegistry,
  BASE_PROPERTIES,
  STYLE_PROPERTIES,
  LINE_SCHEMA,
  RECT_SCHEMA,
  CIRCLE_SCHEMA,
  ARC_SCHEMA,
  ELLIPSE_SCHEMA,
  POLYLINE_SCHEMA,
  TEXT_SCHEMA,
  DIMENSION_SCHEMA,
};
