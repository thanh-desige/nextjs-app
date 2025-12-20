/**
 * Dimension Commands for History Support
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi dimension phải đi qua Commands
 * để History có thể Undo/Redo
 *
 * Commands:
 * - AddDimensionCommand: Thêm dimension mới
 * - UpdateDimensionCommand: Cập nhật dimension
 * - DeleteDimensionCommand: Xóa dimension
 * - BatchDimensionCommand: Batch operations (QDIM)
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";
import { DimensionEntity } from "../../dimensions/DimensionManager";
import { CadDocument } from "../../document/CadDocument";

// ============================================
// EXTENDED CONTEXT FOR DIMENSIONS
// ============================================

/**
 * Extended context that includes document access
 * This ensures ĐIỀU KIỆN 1 is followed
 */
export interface DimensionCommandContext extends CommandContext {
  /** Access to CadDocument for dimension operations */
  document: CadDocument;
}

// ============================================
// ADD DIMENSION COMMAND
// ============================================

export interface AddDimensionData {
  dimension: DimensionEntity;
}

export class AddDimensionCommand implements ICommand {
  readonly name = "ADD_DIMENSION";
  readonly description = "Add a new dimension";
  readonly canUndo = true;

  private data: AddDimensionData | null = null;

  constructor(private dimension: DimensionEntity) {}

  execute(context: CommandContext): CommandResult {
    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    // Store for undo
    this.data = {
      dimension: { ...this.dimension },
    };

    // Add to document
    dimContext.document.addDimension(this.dimension);
    context.engine.requestRender();

    return {
      success: true,
      message: `Added ${this.dimension.dimensionType} dimension`,
      data: { dimension: this.dimension },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) return;

    dimContext.document.removeDimension(this.data.dimension.id);
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available" };
    }

    dimContext.document.addDimension(this.data.dimension);
    context.engine.requestRender();

    return {
      success: true,
      message: `Re-added ${this.data.dimension.dimensionType} dimension`,
    };
  }
}

// ============================================
// UPDATE DIMENSION COMMAND
// ============================================

export interface UpdateDimensionData {
  dimensionId: string;
  oldValues: Partial<DimensionEntity>;
  newValues: Partial<DimensionEntity>;
}

export class UpdateDimensionCommand implements ICommand {
  readonly name = "UPDATE_DIMENSION";
  readonly description = "Update dimension properties";
  readonly canUndo = true;

  private data: UpdateDimensionData | null = null;

  constructor(
    private dimensionId: string,
    private updates: Partial<DimensionEntity>
  ) {}

  execute(context: CommandContext): CommandResult {
    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    const dimension = dimContext.document.getDimension(this.dimensionId);

    if (!dimension) {
      return {
        success: false,
        message: `Dimension ${this.dimensionId} not found`,
      };
    }

    // Store old values for undo
    const oldValues: Partial<DimensionEntity> = {};
    for (const key of Object.keys(this.updates) as (keyof DimensionEntity)[]) {
      oldValues[key] = dimension[key] as never;
    }

    this.data = {
      dimensionId: this.dimensionId,
      oldValues,
      newValues: { ...this.updates },
    };

    // Apply updates
    dimContext.document.updateDimension(this.dimensionId, this.updates);
    context.engine.requestRender();

    return {
      success: true,
      message: "Updated dimension",
      data: { dimensionId: this.dimensionId, updates: this.updates },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) return;

    dimContext.document.updateDimension(
      this.data.dimensionId,
      this.data.oldValues
    );
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available" };
    }

    dimContext.document.updateDimension(
      this.data.dimensionId,
      this.data.newValues
    );
    context.engine.requestRender();

    return {
      success: true,
      message: "Re-updated dimension",
    };
  }
}

// ============================================
// DELETE DIMENSION COMMAND
// ============================================

export interface DeleteDimensionData {
  dimension: DimensionEntity;
}

export class DeleteDimensionCommand implements ICommand {
  readonly name = "DELETE_DIMENSION";
  readonly description = "Delete a dimension";
  readonly canUndo = true;

  private data: DeleteDimensionData | null = null;

  constructor(private dimensionId: string) {}

  execute(context: CommandContext): CommandResult {
    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    const dimension = dimContext.document.getDimension(this.dimensionId);

    if (!dimension) {
      return {
        success: false,
        message: `Dimension ${this.dimensionId} not found`,
      };
    }

    // Store for undo
    this.data = {
      dimension: { ...dimension },
    };

    // Remove from document
    dimContext.document.removeDimension(this.dimensionId);
    context.engine.requestRender();

    return {
      success: true,
      message: "Deleted dimension",
      data: { dimensionId: this.dimensionId },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) return;

    dimContext.document.addDimension(this.data.dimension);
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available" };
    }

    dimContext.document.removeDimension(this.data.dimension.id);
    context.engine.requestRender();

    return {
      success: true,
      message: "Re-deleted dimension",
    };
  }
}

// ============================================
// BATCH DIMENSION COMMAND (for QDIM)
// ============================================

export interface BatchDimensionData {
  dimensions: DimensionEntity[];
}

export class BatchAddDimensionCommand implements ICommand {
  readonly name = "BATCH_ADD_DIMENSION";
  readonly description = "Add multiple dimensions (QDIM)";
  readonly canUndo = true;

  private data: BatchDimensionData | null = null;

  constructor(private dimensions: DimensionEntity[]) {}

  execute(context: CommandContext): CommandResult {
    if (this.dimensions.length === 0) {
      return { success: false, message: "No dimensions to add" };
    }

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    // Store for undo
    this.data = {
      dimensions: this.dimensions.map((d) => ({ ...d })),
    };

    // Add all to document
    dimContext.document.addDimensions(this.dimensions);
    context.engine.requestRender();

    return {
      success: true,
      message: `Added ${this.dimensions.length} dimensions`,
      data: { dimensions: this.dimensions },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) return;

    for (const dim of this.data.dimensions) {
      dimContext.document.removeDimension(dim.id);
    }
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available" };
    }

    dimContext.document.addDimensions(this.data.dimensions);
    context.engine.requestRender();

    return {
      success: true,
      message: `Re-added ${this.data.dimensions.length} dimensions`,
    };
  }
}

// ============================================
// BATCH DELETE DIMENSION COMMAND
// ============================================

export class BatchDeleteDimensionCommand implements ICommand {
  readonly name = "BATCH_DELETE_DIMENSION";
  readonly description = "Delete multiple dimensions";
  readonly canUndo = true;

  private data: BatchDimensionData | null = null;

  constructor(private dimensionIds: string[]) {}

  execute(context: CommandContext): CommandResult {
    if (this.dimensionIds.length === 0) {
      return { success: false, message: "No dimensions to delete" };
    }

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    const dimensions: DimensionEntity[] = [];

    // Collect dimensions before deleting
    for (const id of this.dimensionIds) {
      const dim = dimContext.document.getDimension(id);
      if (dim) {
        dimensions.push({ ...dim });
      }
    }

    if (dimensions.length === 0) {
      return { success: false, message: "No valid dimensions found" };
    }

    // Store for undo
    this.data = { dimensions };

    // Delete all
    dimContext.document.removeDimensions(this.dimensionIds);
    context.engine.requestRender();

    return {
      success: true,
      message: `Deleted ${dimensions.length} dimensions`,
      data: { dimensionIds: this.dimensionIds },
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) return;

    dimContext.document.addDimensions(this.data.dimensions);
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available" };
    }

    for (const dim of this.data.dimensions) {
      dimContext.document.removeDimension(dim.id);
    }
    context.engine.requestRender();

    return {
      success: true,
      message: `Re-deleted ${this.data.dimensions.length} dimensions`,
    };
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createAddDimensionCommand(
  dimension: DimensionEntity
): AddDimensionCommand {
  return new AddDimensionCommand(dimension);
}

export function createUpdateDimensionCommand(
  dimensionId: string,
  updates: Partial<DimensionEntity>
): UpdateDimensionCommand {
  return new UpdateDimensionCommand(dimensionId, updates);
}

export function createDeleteDimensionCommand(
  dimensionId: string
): DeleteDimensionCommand {
  return new DeleteDimensionCommand(dimensionId);
}

export function createBatchAddDimensionCommand(
  dimensions: DimensionEntity[]
): BatchAddDimensionCommand {
  return new BatchAddDimensionCommand(dimensions);
}

export function createBatchDeleteDimensionCommand(
  dimensionIds: string[]
): BatchDeleteDimensionCommand {
  return new BatchDeleteDimensionCommand(dimensionIds);
}
