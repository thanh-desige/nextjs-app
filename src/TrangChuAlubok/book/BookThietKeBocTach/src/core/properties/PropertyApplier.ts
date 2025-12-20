/**
 * PropertyApplier.ts
 *
 * LUẬT THỰC THI cho việc apply property changes
 *
 * Mọi thay đổi property PHẢI đi qua đây:
 * - UI → PropertyApplier.applyProperty() → CadEngine → Document → History
 *
 * Chức năng:
 * 1. Validate qua PropertySchema trước khi apply
 * 2. Tạo Command để có thể Undo/Redo
 * 3. Apply changes vào entity thông qua CadEngine
 * 4. Đảm bảo consistency giữa UI và Document
 */

import { IEntity, EntityType, EntityStyle } from "../entities/Entity.types";
import { IVec2 } from "../geometry/Vec2";
import {
  propertySchema,
  PropertyDefinition,
  PropertyCategory,
  ValidationResult,
} from "./PropertySchema";

// ============================================
// TYPES
// ============================================

export interface PropertyChange {
  entityId: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ApplyResult {
  success: boolean;
  message?: string;
  changes: PropertyChange[];
}

export interface BatchApplyOptions {
  /** Skip validation (for internal use only) */
  skipValidation?: boolean;
  /** Create single undo entry for batch */
  atomic?: boolean;
}

// ============================================
// PROPERTY APPLIER CLASS
// ============================================

export class PropertyApplier {
  /**
   * Apply a single property change
   * Returns the change for undo/redo
   */
  static applyProperty(
    entity: IEntity,
    key: string,
    value: unknown,
    skipValidation = false
  ): ApplyResult {
    // Validate first
    if (!skipValidation) {
      const validation = propertySchema.validateProperty(
        entity.type,
        key,
        value
      );
      if (!validation.valid) {
        // Use corrected value if available
        if (validation.correctedValue !== undefined) {
          value = validation.correctedValue;
        } else {
          return {
            success: false,
            message: validation.message,
            changes: [],
          };
        }
      }
    }

    // Get old value for undo
    const oldValue = this.getPropertyValue(entity, key);

    // Apply the change
    const applied = this.setPropertyValue(entity, key, value);
    if (!applied) {
      return {
        success: false,
        message: `Failed to apply property: ${key}`,
        changes: [],
      };
    }

    return {
      success: true,
      changes: [
        {
          entityId: entity.id,
          key,
          oldValue,
          newValue: value,
        },
      ],
    };
  }

  /**
   * Apply multiple property changes to single entity
   */
  static applyProperties(
    entity: IEntity,
    properties: Record<string, unknown>,
    options: BatchApplyOptions = {}
  ): ApplyResult {
    const changes: PropertyChange[] = [];
    const errors: string[] = [];

    for (const [key, value] of Object.entries(properties)) {
      const result = this.applyProperty(
        entity,
        key,
        value,
        options.skipValidation
      );
      if (result.success) {
        changes.push(...result.changes);
      } else {
        errors.push(result.message ?? `Failed to apply ${key}`);
      }
    }

    return {
      success: errors.length === 0,
      message: errors.length > 0 ? errors.join("; ") : undefined,
      changes,
    };
  }

  /**
   * Apply style changes
   */
  static applyStyle(entity: IEntity, style: Partial<EntityStyle>): ApplyResult {
    const changes: PropertyChange[] = [];

    for (const [key, value] of Object.entries(style)) {
      const fullKey = `style.${key}`;
      const oldValue = entity.style[key as keyof EntityStyle];

      // Validate
      const validation = propertySchema.validateProperty(
        entity.type,
        fullKey,
        value
      );
      if (!validation.valid) {
        continue; // Skip invalid style properties
      }

      // Apply
      (entity.style as unknown as Record<string, unknown>)[key] = value;

      changes.push({
        entityId: entity.id,
        key: fullKey,
        oldValue,
        newValue: value,
      });
    }

    return {
      success: true,
      changes,
    };
  }

  /**
   * Undo a property change
   */
  static undoChange(entity: IEntity, change: PropertyChange): boolean {
    return this.setPropertyValue(entity, change.key, change.oldValue);
  }

  /**
   * Redo a property change
   */
  static redoChange(entity: IEntity, change: PropertyChange): boolean {
    return this.setPropertyValue(entity, change.key, change.newValue);
  }

  /**
   * Undo multiple changes (in reverse order)
   */
  static undoChanges(
    entityMap: Map<string, IEntity>,
    changes: PropertyChange[]
  ): void {
    // Apply in reverse order
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];
      const entity = entityMap.get(change.entityId);
      if (entity) {
        this.undoChange(entity, change);
      }
    }
  }

  /**
   * Redo multiple changes
   */
  static redoChanges(
    entityMap: Map<string, IEntity>,
    changes: PropertyChange[]
  ): void {
    for (const change of changes) {
      const entity = entityMap.get(change.entityId);
      if (entity) {
        this.redoChange(entity, change);
      }
    }
  }

  // ============================================
  // PROPERTY ACCESS HELPERS
  // ============================================

  /**
   * Get property value from entity (supports nested paths like "style.strokeColor")
   */
  static getPropertyValue(entity: IEntity, key: string): unknown {
    const parts = key.split(".");

    if (parts.length === 1) {
      return (entity as unknown as Record<string, unknown>)[key];
    }

    // Handle nested properties
    let current: unknown = entity;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  /**
   * Set property value on entity (supports nested paths)
   */
  static setPropertyValue(
    entity: IEntity,
    key: string,
    value: unknown
  ): boolean {
    const parts = key.split(".");

    if (parts.length === 1) {
      // Direct property
      (entity as unknown as Record<string, unknown>)[key] = value;
      return true;
    }

    // Handle nested properties like "style.strokeColor" or "start.x"
    if (parts.length === 2) {
      const [parent, child] = parts;
      const parentObj = (entity as unknown as Record<string, unknown>)[parent];

      if (parentObj && typeof parentObj === "object") {
        (parentObj as Record<string, unknown>)[child] = value;
        return true;
      }

      // Special handling for point properties
      if (
        parent === "start" ||
        parent === "end" ||
        parent === "center" ||
        parent === "origin" ||
        parent === "position" ||
        parent === "startPoint" ||
        parent === "endPoint" ||
        parent === "textPosition"
      ) {
        // Get existing point or create new one
        let point = (entity as unknown as Record<string, unknown>)[parent] as
          | IVec2
          | undefined;
        if (!point) {
          point = { x: 0, y: 0 };
          (entity as unknown as Record<string, unknown>)[parent] = point;
        }
        (point as unknown as Record<string, unknown>)[child] = value;
        return true;
      }
    }

    return false;
  }

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  /**
   * Get all property values for an entity (including computed)
   */
  static getAllPropertyValues(entity: IEntity): Record<string, unknown> {
    const properties = propertySchema.getProperties(entity.type);
    const values: Record<string, unknown> = {};

    for (const prop of properties) {
      if (prop.computed) {
        // Compute the value
        values[prop.key] = prop.computed(
          entity as unknown as Record<string, unknown>
        );
      } else {
        values[prop.key] = this.getPropertyValue(entity, prop.key);
      }
    }

    return values;
  }

  /**
   * Get editable properties only
   */
  static getEditableProperties(entity: IEntity): PropertyDefinition[] {
    return propertySchema.getProperties(entity.type).filter((p) => p.editable);
  }

  /**
   * Get properties by category
   */
  static getPropertiesByCategory(
    entity: IEntity
  ): Map<PropertyCategory, PropertyDefinition[]> {
    return propertySchema.getPropertiesByCategory(entity.type);
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  /**
   * Validate a value for a property
   */
  static validate(
    entityType: EntityType,
    key: string,
    value: unknown
  ): ValidationResult {
    return propertySchema.validateProperty(entityType, key, value);
  }

  /**
   * Check if entity is valid
   */
  static validateEntity(entity: IEntity): ValidationResult {
    return propertySchema.validateEntity(
      entity as unknown as Record<string, unknown>
    );
  }

  // ============================================
  // CLONE/SNAPSHOT
  // ============================================

  /**
   * Create a snapshot of entity's editable properties
   */
  static createSnapshot(entity: IEntity): Record<string, unknown> {
    const editableProps = this.getEditableProperties(entity);
    const snapshot: Record<string, unknown> = {};

    for (const prop of editableProps) {
      snapshot[prop.key] = this.getPropertyValue(entity, prop.key);
    }

    return snapshot;
  }

  /**
   * Restore entity from snapshot
   */
  static restoreFromSnapshot(
    entity: IEntity,
    snapshot: Record<string, unknown>
  ): PropertyChange[] {
    const changes: PropertyChange[] = [];

    for (const [key, value] of Object.entries(snapshot)) {
      const oldValue = this.getPropertyValue(entity, key);
      if (this.setPropertyValue(entity, key, value)) {
        changes.push({
          entityId: entity.id,
          key,
          oldValue,
          newValue: value,
        });
      }
    }

    return changes;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const propertyApplier = PropertyApplier;

export default PropertyApplier;
