/**
 * DELETE Command - Xóa entities
 */

import {
  ICommand,
  CommandResult,
  CommandContext,
  DeleteCommandData,
} from "../Command.types";
import { IEntity, EntityJSON } from "../../entities/Entity.types";

export class DeleteCommand implements ICommand {
  readonly name = "DELETE";
  readonly description = "Delete selected objects";
  readonly canUndo = true;

  private data: DeleteCommandData | null = null;
  private entitySnapshots: EntityJSON[] = [];

  constructor(private entityIds?: string[]) {}

  execute(context: CommandContext): CommandResult {
    // Lấy entities cần xóa
    let entities: IEntity[];

    if (this.entityIds && this.entityIds.length > 0) {
      entities = this.entityIds
        .map((id) => context.engine.getEntity(id))
        .filter((e): e is IEntity => e !== undefined);
    } else {
      entities = context.engine.getSelectedEntities();
    }

    if (entities.length === 0) {
      return {
        success: false,
        message: "No objects to delete",
      };
    }

    // Lưu snapshot để restore khi undo
    this.entitySnapshots = entities.map((e) => e.toJSON());

    // Lưu dữ liệu
    this.data = {
      entities: [...entities],
    };

    // Xóa entities
    for (const entity of entities) {
      context.engine.removeEntity(entity.id);
    }

    // Clear selection
    context.engine.clearSelection();
    context.engine.requestRender();

    return {
      success: true,
      message: `Deleted ${entities.length} object(s)`,
      entities,
    };
  }

  undo(context: CommandContext): void {
    if (!this.entitySnapshots.length) return;

    // Restore entities từ snapshots
    // TODO: Implement createEntityFromJSON in CadEngine
    // For now, we re-add the saved entities
    if (this.data) {
      for (const entity of this.data.entities) {
        context.engine.addEntity(entity);
      }
    }

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    // Xóa lại các entities
    for (const entity of this.data.entities) {
      context.engine.removeEntity(entity.id);
    }

    context.engine.clearSelection();
    context.engine.requestRender();
    return {
      success: true,
      message: `Deleted ${this.data.entities.length} object(s)`,
    };
  }
}

/**
 * Alias cho DeleteCommand (Erase) - Exported separately
 */
export const EraseCommand = DeleteCommand;

export default DeleteCommand;
