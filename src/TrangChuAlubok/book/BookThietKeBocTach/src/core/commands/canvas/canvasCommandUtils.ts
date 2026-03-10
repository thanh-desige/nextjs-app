/**
 * Canvas Command Utilities - Shared helpers for all canvas commands
 *
 * STEP-5.2: Extracted from CanvasEntityCommands.ts to support modular command files.
 * These utilities are used across multiple command classes.
 */

import { CommandContext } from "../Command.types";
import { CadDocument, CanvasEntity } from "../../document/CadDocument";
import { EntityType } from "../../entities/Entity.types";
import { propertySchema } from "../../properties/PropertySchema";

// ==================== Extended Context ====================

/**
 * Extended context that includes document access
 * This ensures ĐIỀU KIỆN 1 is followed
 */
export interface CanvasCommandContext extends CommandContext {
  /** Access to CadDocument for canvas entity operations */
  document: CadDocument;
}

// ==================== ID Generation ====================

/** Helper to generate unique ID */
export function generateCanvasId(): string {
  return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== ĐIỀU KIỆN 2: Property Validation ====================

/**
 * Map CanvasEntity.type (lowercase) sang EntityType (uppercase)
 * Đảm bảo compatibility với PropertySchema
 */
export function mapCanvasTypeToEntityType(
  canvasType: CanvasEntity["type"],
): EntityType {
  const typeMap: Record<CanvasEntity["type"], EntityType> = {
    line: EntityType.LINE,
    polyline: EntityType.POLYLINE,
    rect: EntityType.RECT,
    circle: EntityType.CIRCLE,
    arc: EntityType.ARC,
    ellipse: EntityType.ELLIPSE,
    text: EntityType.TEXT,
  };
  return typeMap[canvasType] || EntityType.LINE;
}

/**
 * Validate canvas entity property theo PropertySchema
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 */
export function validateCanvasProperty(
  entityType: CanvasEntity["type"],
  key: string,
  value: unknown,
): { valid: boolean; error?: string; coercedValue?: unknown } {
  const mappedType = mapCanvasTypeToEntityType(entityType);

  // Map canvas property keys sang PropertySchema keys
  const keyMap: Record<string, string> = {
    color: "strokeColor",
    lineWidth: "strokeWidth",
  };
  const schemaKey = keyMap[key] || key;

  // Validate qua PropertySchema
  const result = propertySchema.validateProperty(mappedType, schemaKey, value);
  return result;
}

/**
 * Validate tất cả updates cho canvas entity
 *
 * NOTE: Canvas entities có cấu trúc đơn giản hơn core entities:
 * - color (string) thay vì style.strokeColor
 * - lineWidth (number) thay vì style.strokeWidth
 * - layer (string) - ID của layer
 *
 * Validation cơ bản cho các trường này, không cần đi qua PropertySchema
 * vì PropertySchema được thiết kế cho core entities phức tạp hơn.
 */
export function validateCanvasUpdates(
  entity: CanvasEntity,
  updates: Partial<CanvasEntity>,
): {
  valid: boolean;
  errors: string[];
  validatedUpdates: Partial<CanvasEntity>;
} {
  const errors: string[] = [];
  const validatedUpdates: Partial<CanvasEntity> = {};

  for (const [key, value] of Object.entries(updates)) {
    // Skip core fields - always valid
    if (key === "id" || key === "type" || key === "points") {
      (validatedUpdates as Record<string, unknown>)[key] = value;
      continue;
    }

    // Basic validation for canvas-specific properties
    switch (key) {
      case "color":
        // Color should be a string (hex, rgb, etc.)
        if (typeof value === "string" && value.length > 0) {
          validatedUpdates.color = value;
        } else {
          validatedUpdates.color = "#ffffff"; // Default white
        }
        break;

      case "lineWidth":
        // LineWidth should be a positive number
        if (typeof value === "number" && value > 0) {
          validatedUpdates.lineWidth = value;
        } else {
          validatedUpdates.lineWidth = 2; // Default
        }
        break;

      case "layer":
        // Layer ID - any string is valid
        if (typeof value === "string") {
          validatedUpdates.layer = value;
        }
        break;

      case "selected":
      case "locked":
      case "visible":
        // Boolean flags
        (validatedUpdates as Record<string, unknown>)[key] = Boolean(value);
        break;

      default:
        // Accept other properties as-is
        (validatedUpdates as Record<string, unknown>)[key] = value;
    }
  }

  return {
    valid: true, // Always valid after coercion
    errors,
    validatedUpdates,
  };
}
