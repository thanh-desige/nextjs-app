/**
 * ROTATE Command - Xoay entities quanh điểm
 *
 * STEP-3.9: Uses EntityBridge for immutable transforms.
 */

import {
  ICommand,
  CommandResult,
  CommandContext,
  RotateCommandData,
} from "../Command.types";
import { IVec2 } from "../../geometry/Vec2";
import { IEntity } from "../../entities/Entity.types";
import { rotateIEntity } from "../../entities/EntityBridge";

export class RotateCommand implements ICommand {
  readonly name = "ROTATE";
  readonly description = "Rotate selected objects around a center point";
  readonly canUndo = true;

  private data: RotateCommandData | null = null;

  /**
   * @param center Điểm tâm xoay
   * @param angle Góc xoay (radian)
   * @param entityIds Entity IDs, nếu không có sẽ dùng selected entities
   */
  constructor(
    private center: IVec2,
    private angle: number,
    private entityIds?: string[],
  ) {}

  execute(context: CommandContext): CommandResult {
    // Lấy entities cần rotate
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
        message: "No objects to rotate",
      };
    }

    // Lưu dữ liệu để undo
    this.data = {
      entityIds: entities.map((e) => e.id),
      center: this.center,
      angle: this.angle,
    };

    // Thực hiện xoay qua EntityRegistry (immutable)
    for (const entity of entities) {
      const rotated = rotateIEntity(entity, this.angle, this.center);
      context.engine.updateEntity(entity.id, rotated);
    }

    context.engine.requestRender();

    return {
      success: true,
      message: `Rotated ${entities.length} object(s) by ${(
        (this.angle * 180) /
        Math.PI
      ).toFixed(1)}°`,
      entities,
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    // Xoay ngược lại (immutable)
    for (const entityId of this.data.entityIds) {
      const entity = context.engine.getEntity(entityId);
      if (entity) {
        const rotated = rotateIEntity(
          entity,
          -this.data.angle,
          this.data.center,
        );
        context.engine.updateEntity(entityId, rotated);
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
        const rotated = rotateIEntity(
          entity,
          this.data.angle,
          this.data.center,
        );
        context.engine.updateEntity(entityId, rotated);
      }
    }

    context.engine.requestRender();
    return {
      success: true,
      message: `Rotated ${this.data.entityIds.length} object(s)`,
    };
  }
}

/**
 * Factory để tạo RotateCommand từ góc độ
 */
export function createRotateCommand(
  center: IVec2,
  angleDegrees: number,
  entityIds?: string[],
): RotateCommand {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return new RotateCommand(center, angleRadians, entityIds);
}

export default RotateCommand;
