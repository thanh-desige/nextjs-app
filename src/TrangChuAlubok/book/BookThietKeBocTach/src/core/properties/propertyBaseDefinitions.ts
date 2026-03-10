/**
 * propertyBaseDefinitions.ts
 *
 * Shared property arrays used by all entity schemas.
 * Extracted from PropertySchema.ts (STEP-5.14)
 */

import { DEFAULT_STYLE } from "../entities/Entity.types";
import { PropertyDefinition, PropertyCategory } from "./propertySchema.types";

// ============================================
// BASE PROPERTIES (shared by all entities)
// ============================================

export const BASE_PROPERTIES: PropertyDefinition[] = [
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

export const STYLE_PROPERTIES: PropertyDefinition[] = [
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
