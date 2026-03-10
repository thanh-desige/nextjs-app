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

    // ========================================================================
    // 2D FIRST, 3D READY: LEGACY RADIAL/DIAMETER SHORT-CIRCUIT
    // ========================================================================
    // Legacy radial/diameter dimensions are DISPLAY-ONLY:
    // - ref1 is OPTIONAL, MUST NOT be validated
    // - Skip ALL invariant checks, validation, indexing, lifecycle
    // - Never enter history re-binding or undo invariants
    // - If this type reaches validateDimensionRefs, it's a BUG
    // ========================================================================
    const isLegacyRadial =
      this.dimension.isLegacy &&
      (this.dimension.dimensionType === "radius" ||
        this.dimension.dimensionType === "diameter");

    if (isLegacyRadial) {
      console.log(
        `[AddDimensionCommand] LEGACY RADIAL SHORT-CIRCUIT: ${this.dimension.id} ` +
          `(${this.dimension.dimensionType}) - display-only, no validation, no indexing`
      );
      // Store for undo
      this.data = { dimension: { ...this.dimension } };
      // Direct add without validation - completely bypass validateDimensionRefs
      dimContext.document.addLegacyRadialDimension(this.dimension);
      context.engine.requestRender();
      return {
        success: true,
        message: `Added legacy ${this.dimension.dimensionType} dimension (display-only)`,
        data: { dimension: this.dimension },
      };
    }

    // Store for undo
    this.data = {
      dimension: { ...this.dimension },
    };

    // ========== GUARD RULE: Validate and add to document ==========
    // addDimension will throw INVARIANT VIOLATION if refs are invalid
    // This prevents "orphan dimensions" from being committed
    try {
      dimContext.document.addDimension(this.dimension);
    } catch (error) {
      // ABORT: Dimension refs are invalid - do not commit
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[AddDimensionCommand] ABORT:", errorMessage);
      this.data = null; // Clear data to prevent undo of failed operation
      return {
        success: false,
        message: `ABORT: ${errorMessage}`,
      };
    }

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

    // Use restoreDimension to bypass validation (dimension was already validated when first created)
    dimContext.document.restoreDimension(this.data.dimension);
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

    // Use restoreDimension to bypass validation (dimension was valid when deleted)
    dimContext.document.restoreDimension(this.data.dimension);
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
  private addedDimensions: DimensionEntity[] = [];

  constructor(private dimensions: DimensionEntity[]) {}

  execute(context: CommandContext): CommandResult {
    if (this.dimensions.length === 0) {
      return { success: false, message: "No dimensions to add" };
    }

    const dimContext = context as DimensionCommandContext;
    if (!dimContext.document) {
      return { success: false, message: "Document not available in context" };
    }

    // ========== GUARD RULE: Validate and add each dimension ==========
    // Only add dimensions that pass INVARIANT validation
    // Skip orphan dimensions (those with invalid refs)
    // EXCEPTION: Legacy radial/diameter dimensions short-circuit validation
    this.addedDimensions = [];
    const errors: string[] = [];

    for (const dim of this.dimensions) {
      // ========== LEGACY RADIAL SHORT-CIRCUIT ==========
      const isLegacyRadial =
        dim.isLegacy &&
        (dim.dimensionType === "radius" || dim.dimensionType === "diameter");

      if (isLegacyRadial) {
        console.log(
          `[BatchAddDimensionCommand] LEGACY RADIAL SHORT-CIRCUIT: ${dim.id} ` +
            `(${dim.dimensionType}) - display-only, no validation`
        );
        dimContext.document.addLegacyRadialDimension(dim);
        this.addedDimensions.push({ ...dim });
        continue;
      }

      try {
        dimContext.document.addDimension(dim);
        this.addedDimensions.push({ ...dim });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push(errorMessage);
        console.error(
          "[BatchAddDimensionCommand] Skipping invalid dimension:",
          errorMessage
        );
      }
    }

    // Store for undo (only successfully added dimensions)
    this.data = {
      dimensions: this.addedDimensions,
    };

    context.engine.requestRender();

    if (this.addedDimensions.length === 0) {
      return {
        success: false,
        message: `All dimensions failed validation: ${errors.join("; ")}`,
      };
    }

    return {
      success: true,
      message: `Added ${this.addedDimensions.length} dimensions${
        errors.length > 0 ? ` (${errors.length} skipped)` : ""
      }`,
      data: { dimensions: this.addedDimensions },
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

    // Use restoreDimensions to bypass validation (dimensions were already validated when first created)
    dimContext.document.restoreDimensions(this.data.dimensions);
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

    // Use restoreDimensions to bypass validation (dimensions were valid when deleted)
    dimContext.document.restoreDimensions(this.data.dimensions);
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
