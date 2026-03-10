/**
 * CanvasEntityCommands - Commands cho Canvas entities
 *
 * STEP-5.2: Large geometry commands extracted to separate files:
 * - TrimCanvasEntityCommand.ts (~940 lines)
 * - FilletCanvasEntityCommand.ts (~660 lines)
 * - ExtendCanvasEntityCommand.ts (~310 lines)
 * - OffsetCanvasEntityCommand.ts (~240 lines)
 * - ExplodeCanvasEntitiesCommand.ts (~185 lines)
 * - canvasCommandUtils.ts (shared utilities)
 *
 * This file retains CRUD + Selection + Transform commands (~1200 lines)
 *
 * ĐIỀU KIỆN 1: UI → CadEngine → Document → History
 * Mọi thay đổi entity từ CadDrawingCanvas PHẢI đi qua các Commands này
 *
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Mọi property updates PHẢI được validate trước khi apply
 *
 * PHASE 2 UPDATE: Commands sử dụng EntityUtils qua EntityAdapter
 * - transformCanvasEntity() để áp dụng transformations
 * - Đảm bảo consistency giữa CanvasEntity và UnifiedEntity
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import { CanvasEntity, CanvasPoint } from "../../document/CadDocument";

// Import shared utilities from canvasCommandUtils
import {
  CanvasCommandContext,
  generateCanvasId,
  mapCanvasTypeToEntityType,
  validateCanvasProperty,
  validateCanvasUpdates,
} from "./canvasCommandUtils";

// Re-export types and utilities for backward compatibility
export type { CanvasCommandContext };
export type { CanvasEntity, CanvasPoint };

// Re-export extracted commands for backward compatibility
export { TrimCanvasEntityCommand } from "./TrimCanvasEntityCommand";
export { FilletCanvasEntityCommand } from "./FilletCanvasEntityCommand";
export { ExtendCanvasEntityCommand } from "./ExtendCanvasEntityCommand";
export { OffsetCanvasEntityCommand } from "./OffsetCanvasEntityCommand";
export { ExplodeCanvasEntitiesCommand } from "./ExplodeCanvasEntitiesCommand";

// Re-export transform commands for backward compatibility (STEP-5.20)
export {
  MoveCanvasEntitiesCommand,
  RotateCanvasEntitiesCommand,
  MirrorCanvasEntitiesCommand,
  ScaleCanvasEntitiesCommand,
  CopyCanvasEntitiesCommand,
} from "./canvasTransformCommands";

// ==================== ADD ENTITY ====================

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Command này validate entity properties trước khi add
 */
export class AddCanvasEntityCommand implements ICommand {
  readonly name = "ADD_CANVAS_ENTITY";
  readonly canUndo = true;

  private entity: CanvasEntity;
  private validatedEntity: CanvasEntity | null = null;
  private addedId: string | null = null;

  constructor(entity: Omit<CanvasEntity, "id"> | CanvasEntity) {
    // Nếu không có id, tạo mới
    this.entity = {
      ...entity,
      id: (entity as CanvasEntity).id || generateCanvasId(),
    };
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // ĐIỀU KIỆN 2: Validate entity properties
    const validation = validateCanvasUpdates(
      this.entity, // Use self as reference for type
      this.entity, // Validate all properties
    );
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }
    this.validatedEntity = {
      ...this.entity,
      ...validation.validatedUpdates,
    };

    // Lưu entity vào document
    canvasContext.document.addCanvasEntity(this.validatedEntity);
    this.addedId = this.validatedEntity.id;

    return {
      success: true,
      message: `Added ${this.validatedEntity.type}: ${this.validatedEntity.id}`,
      data: { entity: this.validatedEntity },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document || !this.addedId) {
      return;
    }

    canvasContext.document.deleteCanvasEntity(this.addedId);
  }

  getDescription(): string {
    return `Add ${this.entity.type}`;
  }
}

// ==================== DELETE ENTITIES ====================

export class DeleteCanvasEntitiesCommand implements ICommand {
  readonly name = "DELETE_CANVAS_ENTITIES";
  readonly canUndo = true;

  private ids: string[];
  private deletedEntities: CanvasEntity[] = [];

  constructor(ids: string | string[]) {
    this.ids = Array.isArray(ids) ? ids : [ids];
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // Lưu entities trước khi xóa (để undo)
    this.deletedEntities = [];
    for (const id of this.ids) {
      const entity = canvasContext.document.getCanvasEntity(id);
      if (entity) {
        this.deletedEntities.push({ ...entity });

        // ========== ENTITY GEOMETRY LIFECYCLE ==========
        // TRỤC SỐNG: Trước khi xóa entity, detach all dimensions referencing it
        canvasContext.document.handleEntityDeleted(id);

        canvasContext.document.deleteCanvasEntity(id);
      }
    }

    return {
      success: true,
      message: `Deleted ${this.deletedEntities.length} entity(s)`,
      data: { deletedIds: this.ids, deletedEntities: this.deletedEntities },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    // Khôi phục entities đã xóa
    for (const entity of this.deletedEntities) {
      canvasContext.document.addCanvasEntity(entity);
    }

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Sau khi restore entities, commit để dimensions re-attach
    canvasContext.document.commitEntitiesGeometryChange(this.ids);
  }

  getDescription(): string {
    return `Delete ${this.ids.length} entity(s)`;
  }
}

// ==================== NEW DOCUMENT (CLEAR ALL) ====================

/**
 * STEP-2: NewDocumentCommand — clears all canvas entities with undo support.
 * Unlike raw engine.removeEntity() loops, this goes through History.
 */
export class NewDocumentCommand implements ICommand {
  readonly name = "NEW_DOCUMENT";
  readonly canUndo = true;

  private savedEntities: CanvasEntity[] = [];
  private savedSelectedIds: string[] = [];

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // Save all entities + selection for undo
    this.savedEntities = canvasContext.document
      .getAllCanvasEntities()
      .map((e) => ({ ...e }));
    this.savedSelectedIds = [...canvasContext.document.getCanvasSelectedIds()];

    // Detach dimensions before deleting (ENTITY GEOMETRY LIFECYCLE)
    for (const entity of this.savedEntities) {
      canvasContext.document.handleEntityDeleted(entity.id);
    }

    // Clear everything
    canvasContext.document.clearCanvasEntities();

    return {
      success: true,
      message: `New document — cleared ${this.savedEntities.length} entity(s)`,
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) return;

    // Restore all entities
    for (const entity of this.savedEntities) {
      canvasContext.document.addCanvasEntity(entity);
    }

    // Restore selection
    if (this.savedSelectedIds.length > 0) {
      canvasContext.document.selectCanvasEntities(this.savedSelectedIds);
    }

    // Re-attach dimensions (ENTITY GEOMETRY LIFECYCLE)
    const ids = this.savedEntities.map((e) => e.id);
    canvasContext.document.commitEntitiesGeometryChange(ids);
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }

  getDescription(): string {
    return "New Document";
  }
}

// ==================== UPDATE ENTITY ====================

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Command này validate TẤT CẢ updates qua PropertySchema trước khi apply
 */
export class UpdateCanvasEntityCommand implements ICommand {
  readonly name = "UPDATE_CANVAS_ENTITY";
  readonly canUndo = true;

  private id: string;
  private updates: Partial<CanvasEntity>;
  private validatedUpdates: Partial<CanvasEntity> = {};
  private previousValues: Partial<CanvasEntity> = {};

  constructor(id: string, updates: Partial<CanvasEntity>) {
    this.id = id;
    this.updates = updates;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    const entity = canvasContext.document.getCanvasEntity(this.id);
    if (!entity) {
      return { success: false, message: `Entity not found: ${this.id}` };
    }

    // ĐIỀU KIỆN 2: Validate updates qua PropertySchema
    const validation = validateCanvasUpdates(entity, this.updates);
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }
    this.validatedUpdates = validation.validatedUpdates;

    // Lưu giá trị cũ để undo
    this.previousValues = {};
    for (const key of Object.keys(
      this.validatedUpdates,
    ) as (keyof CanvasEntity)[]) {
      if (key === "points") {
        this.previousValues.points = entity.points.map((p: CanvasPoint) => ({
          ...p,
        }));
      } else {
        (this.previousValues as Record<string, unknown>)[key] = entity[key];
      }
    }

    // Áp dụng validated updates
    canvasContext.document.updateCanvasEntity(this.id, this.validatedUpdates);

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Nếu points được update, phải commit geometry change
    if (this.validatedUpdates.points) {
      canvasContext.document.commitEntitiesGeometryChange([this.id]);
    }

    return {
      success: true,
      message: `Updated entity: ${this.id}`,
      data: { id: this.id, updates: this.validatedUpdates },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    canvasContext.document.updateCanvasEntity(this.id, this.previousValues);

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Nếu points được restore, phải commit geometry change
    if (this.previousValues.points) {
      canvasContext.document.commitEntitiesGeometryChange([this.id]);
    }
  }

  getDescription(): string {
    return `Update entity ${this.id}`;
  }
}

// ==================== BATCH ADD ENTITIES ====================

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Batch command cũng validate TẤT CẢ entities trước khi add
 */
export class BatchAddCanvasEntitiesCommand implements ICommand {
  readonly name = "BATCH_ADD_CANVAS_ENTITIES";
  readonly canUndo = true;

  private entities: CanvasEntity[];
  private validatedEntities: CanvasEntity[] = [];
  private addedIds: string[] = [];

  constructor(entities: (Omit<CanvasEntity, "id"> | CanvasEntity)[]) {
    this.entities = entities.map((e) => ({
      ...e,
      id: (e as CanvasEntity).id || generateCanvasId(),
    }));
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // ĐIỀU KIỆN 2: Validate TẤT CẢ entities trước khi add
    this.validatedEntities = [];
    const allErrors: string[] = [];

    for (const entity of this.entities) {
      const validation = validateCanvasUpdates(entity, entity);
      if (!validation.valid) {
        allErrors.push(`Entity ${entity.id}: ${validation.errors.join(", ")}`);
      } else {
        this.validatedEntities.push({
          ...entity,
          ...validation.validatedUpdates,
        });
      }
    }

    // Nếu có bất kỳ entity nào invalid, reject toàn bộ batch
    if (allErrors.length > 0) {
      return {
        success: false,
        message: `Validation failed: ${allErrors.join("; ")}`,
      };
    }

    this.addedIds = [];
    for (const entity of this.validatedEntities) {
      canvasContext.document.addCanvasEntity(entity);
      this.addedIds.push(entity.id);
    }

    return {
      success: true,
      message: `Added ${this.validatedEntities.length} entities`,
      data: { entities: this.validatedEntities, ids: this.addedIds },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    for (const id of this.addedIds) {
      canvasContext.document.deleteCanvasEntity(id);
    }
  }

  getDescription(): string {
    return `Batch add ${this.entities.length} entities`;
  }
}

// ==================== SELECT ENTITIES ====================
// Selection có undo — khôi phục selection cũ khi Ctrl+Z

export class SelectCanvasEntitiesCommand implements ICommand {
  readonly name = "SELECT_CANVAS_ENTITIES";
  readonly canUndo = true;

  private ids: string[];
  private additive: boolean;
  /** Previous selection state for undo */
  private previousSelectedIds: string[] = [];

  constructor(ids: string[], additive = false) {
    this.ids = ids;
    this.additive = additive;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // Save previous selection for undo
    this.previousSelectedIds = canvasContext.document.getCanvasSelectedIds();

    canvasContext.document.selectCanvasEntities(this.ids, this.additive);

    return {
      success: true,
      message: `Selected ${this.ids.length} entity(s)`,
      data: { ids: this.ids, additive: this.additive },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) return;

    // Restore previous selection
    canvasContext.document.clearCanvasSelection();
    if (this.previousSelectedIds.length > 0) {
      canvasContext.document.selectCanvasEntities(this.previousSelectedIds);
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }

  getDescription(): string {
    return `Select ${this.ids.length} entity(s)`;
  }
}

// ==================== CLEAR SELECTION ====================

export class ClearCanvasSelectionCommand implements ICommand {
  readonly name = "CLEAR_CANVAS_SELECTION";
  readonly canUndo = true;

  /** Previous selection state for undo */
  private previousSelectedIds: string[] = [];

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // Save previous selection for undo
    this.previousSelectedIds = canvasContext.document.getCanvasSelectedIds();

    canvasContext.document.clearCanvasSelection();

    return {
      success: true,
      message: "Cleared selection",
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) return;

    // Restore previous selection
    if (this.previousSelectedIds.length > 0) {
      canvasContext.document.selectCanvasEntities(this.previousSelectedIds);
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }

  getDescription(): string {
    return "Clear selection";
  }
}

// ==================== EXPORTS ====================

// Export validation helpers for external use (from canvasCommandUtils)
export {
  mapCanvasTypeToEntityType,
  validateCanvasProperty,
  validateCanvasUpdates,
};
