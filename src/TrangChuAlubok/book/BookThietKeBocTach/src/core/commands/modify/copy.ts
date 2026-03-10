/**
 * COPY Command - Tạo bản sao của entities
 *
 * STEP-3.9: Uses EntityBridge for immutable clone + translate.
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";
import { Vec2, IVec2 } from "../../geometry/Vec2";
import { IEntity } from "../../entities/Entity.types";
import { cloneIEntity, translateIEntity } from "../../entities/EntityBridge";

interface CopyData {
  sourceEntityIds: string[];
  newEntityIds: string[];
  delta: IVec2;
}

export class CopyCommand implements ICommand {
  readonly name = "COPY";
  readonly description = "Copy selected objects by displacement";
  readonly canUndo = true;

  private data: CopyData | null = null;

  constructor(
    private delta: IVec2,
    private entityIds?: string[],
  ) {}

  execute(context: CommandContext): CommandResult {
    // Lấy entities cần copy
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
        message: "No objects to copy",
      };
    }

    // Tạo bản sao (immutable clone + translate)
    const newEntities: IEntity[] = [];

    for (const entity of entities) {
      const copy = cloneIEntity(entity);
      const moved = translateIEntity(copy, this.delta.x, this.delta.y);

      // Thêm vào engine
      context.engine.addEntity(moved);
      newEntities.push(moved);
    }

    // Lưu dữ liệu để undo
    this.data = {
      sourceEntityIds: entities.map((e) => e.id),
      newEntityIds: newEntities.map((e) => e.id),
      delta: this.delta,
    };

    context.engine.requestRender();

    return {
      success: true,
      message: `Copied ${newEntities.length} object(s)`,
      entities: newEntities,
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    // Xóa các bản sao đã tạo
    for (const entityId of this.data.newEntityIds) {
      context.engine.removeEntity(entityId);
    }

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    // Lấy lại source entities
    const entities = this.data.sourceEntityIds
      .map((id) => context.engine.getEntity(id))
      .filter((e): e is IEntity => e !== undefined);

    const newEntities: IEntity[] = [];

    for (const entity of entities) {
      const copy = cloneIEntity(entity);
      const moved = translateIEntity(
        copy,
        this.data.delta.x,
        this.data.delta.y,
      );
      context.engine.addEntity(moved);
      newEntities.push(moved);
    }

    // Cập nhật data với new entity IDs
    this.data.newEntityIds = newEntities.map((e) => e.id);

    context.engine.requestRender();
    return { success: true, message: `Copied ${newEntities.length} object(s)` };
  }
}

/**
 * Factory function để tạo CopyCommand từ 2 điểm
 */
export function createCopyCommand(
  basePoint: IVec2,
  destPoint: IVec2,
  entityIds?: string[],
): CopyCommand {
  const base = Vec2.from(basePoint);
  const dest = Vec2.from(destPoint);
  const delta = dest.sub(base);
  return new CopyCommand(delta, entityIds);
}

export default CopyCommand;
