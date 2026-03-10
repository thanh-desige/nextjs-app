/**
 * entitySchemas.ts
 *
 * Entity-specific PropertySchema definitions.
 * Each schema defines properties for a CAD entity type.
 * Extracted from PropertySchema.ts (STEP-5.14)
 */

import { EntityType } from "../entities/Entity.types";
import { IVec2 } from "../geometry/Vec2";
import { EntitySchema, PropertyCategory } from "./propertySchema.types";
import { BASE_PROPERTIES, STYLE_PROPERTIES } from "./propertyBaseDefinitions";

// ============================================
// LINE
// ============================================

export const LINE_SCHEMA: EntitySchema = {
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

// ============================================
// RECT
// ============================================

export const RECT_SCHEMA: EntitySchema = {
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

// ============================================
// CIRCLE
// ============================================

export const CIRCLE_SCHEMA: EntitySchema = {
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

// ============================================
// ARC
// ============================================

export const ARC_SCHEMA: EntitySchema = {
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

// ============================================
// POLYLINE
// ============================================

export const POLYLINE_SCHEMA: EntitySchema = {
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

// ============================================
// ELLIPSE
// ============================================

export const ELLIPSE_SCHEMA: EntitySchema = {
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

// ============================================
// TEXT
// ============================================

export const TEXT_SCHEMA: EntitySchema = {
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

// ============================================
// DIMENSION
// ============================================

export const DIMENSION_SCHEMA: EntitySchema = {
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
