/**
 * Entity Commands for History Support
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi entity phải đi qua Commands
 * để History có thể Undo/Redo
 *
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Mọi property updates PHẢI được validate qua PropertySchema
 *
 * Commands:
 * - UpdateEntityPropertyCommand: Cập nhật một property của entity
 * - UpdateEntityStyleCommand: Cập nhật style của entity
 * - UpdateEntityPropertiesCommand: Cập nhật nhiều properties
 * - BatchUpdateCommand: Batch operations cho multi-selection
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";
import { IEntity, EntityStyle } from "../../entities/Entity.types";
import { CadDocument } from "../../document/CadDocument";
import { propertySchema } from "../../properties/PropertySchema";

// ============================================
// EXTENDED CONTEXT FOR ENTITY OPERATIONS
// ============================================

/**
 * Extended context that includes document access
 * This ensures ĐIỀU KIỆN 1 is followed
 */
export interface EntityCommandContext extends CommandContext {
  /** Access to CadDocument for entity operations */
  document: CadDocument;
}

// ============================================
// PROPERTY CHANGE TRACKING
// ============================================

export interface PropertyChange {
  entityId: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface StyleChange {
  entityId: string;
  oldStyle: Partial<EntityStyle>;
  newStyle: Partial<EntityStyle>;
}

// ============================================
// UPDATE ENTITY PROPERTY COMMAND
// ============================================

export interface UpdatePropertyData {
  entityId: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Command này validate property trước khi apply
 */
export class UpdateEntityPropertyCommand implements ICommand {
  readonly name = "UPDATE_ENTITY_PROPERTY";
  readonly description = "Update a single entity property";
  readonly canUndo = true;

  private data: UpdatePropertyData | null = null;
  private validatedValue: unknown = null;

  constructor(
    private entityId: string,
    private key: string,
    private newValue: unknown
  ) {}

  execute(context: CommandContext): CommandResult {
    const entContext = context as EntityCommandContext;
    if (!entContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    const entity = entContext.document.getEntity(this.entityId);
    if (!entity) {
      return { success: false, message: `Entity ${this.entityId} not found` };
    }

    // ĐIỀU KIỆN 2: Validate property qua PropertySchema
    // Map style property keys nếu cần
    const schemaKey = this.key in entity.style ? `style.${this.key}` : this.key;
    const validation = propertySchema.validateProperty(
      entity.type,
      schemaKey,
      this.newValue
    );

    if (!validation.valid) {
      // Nếu có correctedValue, sử dụng nó
      if (validation.correctedValue !== undefined) {
        this.validatedValue = validation.correctedValue;
      } else {
        return {
          success: false,
          message: `Validation failed for ${this.key}: ${validation.message}`,
        };
      }
    } else {
      this.validatedValue = this.newValue;
    }

    // Store old value for undo
    const oldValue = this.getPropertyValue(entity, this.key);

    this.data = {
      entityId: this.entityId,
      key: this.key,
      oldValue,
      newValue: this.validatedValue,
    };

    // Apply validated value
    this.setPropertyValue(entity, this.key, this.validatedValue);
    context.engine.requestRender();

    return {
      success: true,
      message: `Updated ${this.key} on entity ${this.entityId}`,
      data: { change: this.data },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const entContext = context as EntityCommandContext;
    if (!entContext.document) return;

    const entity = entContext.document.getEntity(this.data.entityId);
    if (!entity) return;

    // Restore old value
    this.setPropertyValue(entity, this.data.key, this.data.oldValue);
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const entContext = context as EntityCommandContext;
    if (!entContext.document) {
      return { success: false, message: "Document not available" };
    }

    const entity = entContext.document.getEntity(this.data.entityId);
    if (!entity) {
      return { success: false, message: "Entity not found" };
    }

    this.setPropertyValue(entity, this.data.key, this.data.newValue);
    context.engine.requestRender();

    return {
      success: true,
      message: `Re-applied ${this.data.key} change`,
    };
  }

  private getPropertyValue(entity: IEntity, key: string): unknown {
    // Check if it's a style property
    if (key in entity.style) {
      return (entity.style as unknown as Record<string, unknown>)[key];
    }
    // Check if it's a direct entity property
    return (entity as unknown as Record<string, unknown>)[key];
  }

  private setPropertyValue(entity: IEntity, key: string, value: unknown): void {
    // Check if it's a style property
    if (key in entity.style) {
      (entity.style as unknown as Record<string, unknown>)[key] = value;
    } else {
      (entity as unknown as Record<string, unknown>)[key] = value;
    }
  }
}

// ============================================
// UPDATE ENTITY STYLE COMMAND
// ============================================

export interface UpdateStyleData {
  entityId: string;
  oldStyle: Partial<EntityStyle>;
  newStyle: Partial<EntityStyle>;
}

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Command này validate TẤT CẢ style properties trước khi apply
 */
export class UpdateEntityStyleCommand implements ICommand {
  readonly name = "UPDATE_ENTITY_STYLE";
  readonly description = "Update entity style properties";
  readonly canUndo = true;

  private data: UpdateStyleData | null = null;
  private validatedStyles: Partial<EntityStyle> = {};

  constructor(
    private entityId: string,
    private styleUpdates: Partial<EntityStyle>
  ) {}

  execute(context: CommandContext): CommandResult {
    const entContext = context as EntityCommandContext;
    if (!entContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    const entity = entContext.document.getEntity(this.entityId);
    if (!entity) {
      return { success: false, message: `Entity ${this.entityId} not found` };
    }

    // ĐIỀU KIỆN 2: Validate TẤT CẢ style properties qua PropertySchema
    const errors: string[] = [];
    this.validatedStyles = {};

    for (const [key, value] of Object.entries(this.styleUpdates)) {
      const schemaKey = `style.${key}`;
      const validation = propertySchema.validateProperty(
        entity.type,
        schemaKey,
        value
      );

      if (!validation.valid) {
        if (validation.correctedValue !== undefined) {
          (this.validatedStyles as Record<string, unknown>)[key] =
            validation.correctedValue;
        } else {
          errors.push(`${key}: ${validation.message}`);
        }
      } else {
        (this.validatedStyles as Record<string, unknown>)[key] = value;
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Style validation failed: ${errors.join(", ")}`,
      };
    }

    // Store old values for undo
    const oldStyle: Record<string, unknown> = {};
    for (const key of Object.keys(this.validatedStyles)) {
      oldStyle[key] = (entity.style as unknown as Record<string, unknown>)[key];
    }

    this.data = {
      entityId: this.entityId,
      oldStyle: oldStyle as Partial<EntityStyle>,
      newStyle: { ...this.validatedStyles },
    };

    // Apply validated styles
    Object.assign(entity.style, this.validatedStyles);
    context.engine.requestRender();

    return {
      success: true,
      message: `Updated style on entity ${this.entityId}`,
      data: { change: this.data },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const entContext = context as EntityCommandContext;
    if (!entContext.document) return;

    const entity = entContext.document.getEntity(this.data.entityId);
    if (!entity) return;

    // Restore old style
    Object.assign(entity.style, this.data.oldStyle);
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const entContext = context as EntityCommandContext;
    if (!entContext.document) {
      return { success: false, message: "Document not available" };
    }

    const entity = entContext.document.getEntity(this.data.entityId);
    if (!entity) {
      return { success: false, message: "Entity not found" };
    }

    Object.assign(entity.style, this.data.newStyle);
    context.engine.requestRender();

    return {
      success: true,
      message: `Re-applied style change`,
    };
  }
}

// ============================================
// UPDATE MULTIPLE PROPERTIES COMMAND
// ============================================

export interface UpdatePropertiesData {
  entityId: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  oldStyle: Partial<EntityStyle>;
  newStyle: Partial<EntityStyle>;
}

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Command này validate TẤT CẢ properties trước khi apply
 */
export class UpdateEntityPropertiesCommand implements ICommand {
  readonly name = "UPDATE_ENTITY_PROPERTIES";
  readonly description = "Update multiple entity properties";
  readonly canUndo = true;

  private data: UpdatePropertiesData | null = null;

  constructor(
    private entityId: string,
    private updates: Record<string, unknown>
  ) {}

  execute(context: CommandContext): CommandResult {
    const entContext = context as EntityCommandContext;
    if (!entContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    const entity = entContext.document.getEntity(this.entityId);
    if (!entity) {
      return { success: false, message: `Entity ${this.entityId} not found` };
    }

    // ĐIỀU KIỆN 2: Validate TẤT CẢ properties qua PropertySchema
    const errors: string[] = [];
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    const oldStyleObj: Record<string, unknown> = {};
    const newStyleObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(this.updates)) {
      const isStyleProp = key in entity.style;
      const schemaKey = isStyleProp ? `style.${key}` : key;

      const validation = propertySchema.validateProperty(
        entity.type,
        schemaKey,
        value
      );

      if (!validation.valid) {
        if (validation.correctedValue !== undefined) {
          // Use corrected value
          if (isStyleProp) {
            oldStyleObj[key] = (
              entity.style as unknown as Record<string, unknown>
            )[key];
            newStyleObj[key] = validation.correctedValue;
          } else {
            oldValues[key] = (entity as unknown as Record<string, unknown>)[
              key
            ];
            newValues[key] = validation.correctedValue;
          }
        } else {
          errors.push(`${key}: ${validation.message}`);
        }
      } else {
        // Use original value
        if (isStyleProp) {
          oldStyleObj[key] = (
            entity.style as unknown as Record<string, unknown>
          )[key];
          newStyleObj[key] = value;
        } else {
          oldValues[key] = (entity as unknown as Record<string, unknown>)[key];
          newValues[key] = value;
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Validation failed: ${errors.join(", ")}`,
      };
    }

    this.data = {
      entityId: this.entityId,
      oldValues,
      newValues,
      oldStyle: oldStyleObj as Partial<EntityStyle>,
      newStyle: newStyleObj as Partial<EntityStyle>,
    };

    // Apply all validated updates
    Object.assign(entity, newValues);
    Object.assign(entity.style, newStyleObj);
    context.engine.requestRender();

    return {
      success: true,
      message: `Updated ${
        Object.keys(this.updates).length
      } properties on entity ${this.entityId}`,
      data: { change: this.data },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const entContext = context as EntityCommandContext;
    if (!entContext.document) return;

    const entity = entContext.document.getEntity(this.data.entityId);
    if (!entity) return;

    // Restore old values
    Object.assign(entity, this.data.oldValues);
    Object.assign(entity.style, this.data.oldStyle);
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const entContext = context as EntityCommandContext;
    if (!entContext.document) {
      return { success: false, message: "Document not available" };
    }

    const entity = entContext.document.getEntity(this.data.entityId);
    if (!entity) {
      return { success: false, message: "Entity not found" };
    }

    Object.assign(entity, this.data.newValues);
    Object.assign(entity.style, this.data.newStyle);
    context.engine.requestRender();

    return {
      success: true,
      message: `Re-applied property changes`,
    };
  }
}

// ============================================
// BATCH UPDATE COMMAND (Multi-selection)
// ============================================

export interface BatchUpdateData {
  changes: UpdatePropertiesData[];
}

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Batch command cũng validate TẤT CẢ properties cho TẤT CẢ entities
 */
export class BatchUpdateEntitiesCommand implements ICommand {
  readonly name = "BATCH_UPDATE_ENTITIES";
  readonly description = "Update multiple entities at once";
  readonly canUndo = true;

  private data: BatchUpdateData | null = null;

  constructor(
    private entityIds: string[],
    private updates: Record<string, unknown>
  ) {}

  execute(context: CommandContext): CommandResult {
    const entContext = context as EntityCommandContext;
    if (!entContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    const changes: UpdatePropertiesData[] = [];
    const allErrors: string[] = [];

    for (const entityId of this.entityIds) {
      const entity = entContext.document.getEntity(entityId);
      if (!entity) continue;

      // ĐIỀU KIỆN 2: Validate TẤT CẢ properties cho mỗi entity
      const entityErrors: string[] = [];
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};
      const oldStyleObj: Record<string, unknown> = {};
      const newStyleObj: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(this.updates)) {
        const isStyleProp = key in entity.style;
        const schemaKey = isStyleProp ? `style.${key}` : key;

        const validation = propertySchema.validateProperty(
          entity.type,
          schemaKey,
          value
        );

        if (!validation.valid) {
          if (validation.correctedValue !== undefined) {
            if (isStyleProp) {
              oldStyleObj[key] = (
                entity.style as unknown as Record<string, unknown>
              )[key];
              newStyleObj[key] = validation.correctedValue;
            } else {
              oldValues[key] = (entity as unknown as Record<string, unknown>)[
                key
              ];
              newValues[key] = validation.correctedValue;
            }
          } else {
            entityErrors.push(`${key}: ${validation.message}`);
          }
        } else {
          if (isStyleProp) {
            oldStyleObj[key] = (
              entity.style as unknown as Record<string, unknown>
            )[key];
            newStyleObj[key] = value;
          } else {
            oldValues[key] = (entity as unknown as Record<string, unknown>)[
              key
            ];
            newValues[key] = value;
          }
        }
      }

      if (entityErrors.length > 0) {
        allErrors.push(`Entity ${entityId}: ${entityErrors.join(", ")}`);
        continue; // Skip this entity
      }

      changes.push({
        entityId,
        oldValues,
        newValues,
        oldStyle: oldStyleObj as Partial<EntityStyle>,
        newStyle: newStyleObj as Partial<EntityStyle>,
      });

      // Apply validated updates
      Object.assign(entity, newValues);
      Object.assign(entity.style, newStyleObj);
    }

    if (allErrors.length > 0) {
      return {
        success: false,
        message: `Batch validation failed: ${allErrors.join("; ")}`,
      };
    }

    this.data = { changes };
    context.engine.requestRender();

    return {
      success: true,
      message: `Updated ${changes.length} entities`,
      data: { changes },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const entContext = context as EntityCommandContext;
    if (!entContext.document) return;

    // Restore all entities
    for (const change of this.data.changes) {
      const entity = entContext.document.getEntity(change.entityId);
      if (!entity) continue;

      Object.assign(entity, change.oldValues);
      Object.assign(entity.style, change.oldStyle);
    }

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const entContext = context as EntityCommandContext;
    if (!entContext.document) {
      return { success: false, message: "Document not available" };
    }

    for (const change of this.data.changes) {
      const entity = entContext.document.getEntity(change.entityId);
      if (!entity) continue;

      Object.assign(entity, change.newValues);
      Object.assign(entity.style, change.newStyle);
    }

    context.engine.requestRender();

    return {
      success: true,
      message: `Re-applied changes to ${this.data.changes.length} entities`,
    };
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  UpdateEntityPropertyCommand as UpdatePropertyCommand,
  UpdateEntityStyleCommand as UpdateStyleCommand,
  UpdateEntityPropertiesCommand as UpdatePropertiesCommand,
  BatchUpdateEntitiesCommand as BatchUpdateCommand,
};
