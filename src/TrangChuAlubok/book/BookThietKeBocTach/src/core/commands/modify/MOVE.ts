/**
 * MOVE Command - Di chuyển entities đã chọn
 *
 * STEP-3.9: Uses EntityBridge for immutable transforms.
 * No more BaseEntity casts — all operations via EntityRegistry.
 */

import {
  ICommand,
  CommandResult,
  CommandContext,
  MoveCommandData,
} from "../Command.types";
import { Vec2, IVec2 } from "../../geometry/Vec2";
import { IEntity } from "../../entities/Entity.types";
import { translateIEntity } from "../../entities/EntityBridge";

export class MoveCommand implements ICommand {
  readonly name = "MOVE";
  readonly description = "Move selected objects by displacement";
  readonly canUndo = true;

  private data: MoveCommandData | null = null;

  constructor(
    private delta: IVec2,
    private entityIds?: string[],
  ) {}

  execute(context: CommandContext): CommandResult {
    // Lấy entities cần move
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
        message: "No objects to move",
      };
    }

    // Lưu dữ liệu để undo
    this.data = {
      entityIds: entities.map((e) => e.id),
      delta: this.delta,
    };

    // Thực hiện di chuyển qua EntityRegistry (immutable)
    for (const entity of entities) {
      const moved = translateIEntity(entity, this.delta.x, this.delta.y);
      context.engine.updateEntity(entity.id, moved);
    }

    context.engine.requestRender();

    return {
      success: true,
      message: `Moved ${entities.length} object(s)`,
      entities,
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    // Di chuyển ngược lại (immutable)
    for (const entityId of this.data.entityIds) {
      const entity = context.engine.getEntity(entityId);
      if (entity) {
        const moved = translateIEntity(
          entity,
          -this.data.delta.x,
          -this.data.delta.y,
        );
        context.engine.updateEntity(entityId, moved);
      }
    }

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    for (const entityId of this.data.entityIds) {
      const entity = context.engine.getEntity(entityId);
      if (entity) {
        const moved = translateIEntity(
          entity,
          this.data.delta.x,
          this.data.delta.y,
        );
        context.engine.updateEntity(entityId, moved);
      }
    }

    context.engine.requestRender();
    return {
      success: true,
      message: `Moved ${this.data.entityIds.length} object(s)`,
    };
  }
}

/**
 * Factory function để tạo MoveCommand từ 2 điểm
 */
export function createMoveCommand(
  basePoint: IVec2,
  destPoint: IVec2,
  entityIds?: string[],
): MoveCommand {
  const base = Vec2.from(basePoint);
  const dest = Vec2.from(destPoint);
  const delta = dest.sub(base);
  return new MoveCommand(delta, entityIds);
}

export default MoveCommand;
