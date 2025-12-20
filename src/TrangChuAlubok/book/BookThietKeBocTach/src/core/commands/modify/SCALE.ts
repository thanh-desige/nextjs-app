/**
 * SCALE Command - Scale entities từ điểm tâm
 */

import {
  ICommand,
  CommandResult,
  CommandContext,
  ScaleCommandData,
} from "../Command.types";
import { IVec2 } from "../../geometry/Vec2";
import { IEntity } from "../../entities/Entity.types";
import { BaseEntity } from "../../entities/BaseEntity";

export class ScaleCommand implements ICommand {
  readonly name = "SCALE";
  readonly description = "Scale selected objects from a base point";
  readonly canUndo = true;

  private data: ScaleCommandData | null = null;

  /**
   * @param center Điểm tâm scale
   * @param scaleX Hệ số scale theo X
   * @param scaleY Hệ số scale theo Y (mặc định = scaleX)
   * @param entityIds Entity IDs, nếu không có sẽ dùng selected entities
   */
  constructor(
    private center: IVec2,
    private scaleX: number,
    private scaleY?: number,
    private entityIds?: string[]
  ) {
    if (this.scaleY === undefined) {
      this.scaleY = this.scaleX;
    }
  }

  execute(context: CommandContext): CommandResult {
    // Lấy entities cần scale
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
        message: "No objects to scale",
      };
    }

    const sy = this.scaleY ?? this.scaleX;

    // Lưu dữ liệu để undo
    this.data = {
      entityIds: entities.map((e) => e.id),
      center: this.center,
      scaleX: this.scaleX,
      scaleY: sy,
    };

    // Thực hiện scale
    for (const entity of entities) {
      const baseEntity = entity as BaseEntity;
      baseEntity.scale(this.scaleX, sy, this.center);
    }

    context.engine.requestRender();

    return {
      success: true,
      message: `Scaled ${entities.length} object(s) by ${this.scaleX.toFixed(
        2
      )}`,
      entities,
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    // Scale ngược lại
    const invScaleX = 1 / this.data.scaleX;
    const invScaleY = 1 / this.data.scaleY;

    for (const entityId of this.data.entityIds) {
      const entity = context.engine.getEntity(entityId) as BaseEntity;
      if (entity) {
        entity.scale(invScaleX, invScaleY, this.data.center);
      }
    }

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    for (const entityId of this.data.entityIds) {
      const entity = context.engine.getEntity(entityId) as BaseEntity;
      if (entity) {
        entity.scale(this.data.scaleX, this.data.scaleY, this.data.center);
      }
    }

    context.engine.requestRender();
    return {
      success: true,
      message: `Scaled ${this.data.entityIds.length} object(s)`,
    };
  }
}

export default ScaleCommand;
