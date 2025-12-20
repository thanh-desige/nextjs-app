/**
 * MIRROR Command - Đối xứng entities qua trục
 */

import {
  ICommand,
  CommandResult,
  CommandContext,
  MirrorCommandData,
} from "../Command.types";
import { IVec2 } from "../../geometry/Vec2";
import { IEntity } from "../../entities/Entity.types";
import { BaseEntity } from "../../entities/BaseEntity";

export class MirrorCommand implements ICommand {
  readonly name = "MIRROR";
  readonly description = "Mirror selected objects across an axis";
  readonly canUndo = true;

  private data: MirrorCommandData | null = null;
  private newEntityIds: string[] = [];

  /**
   * @param axisStart Điểm đầu trục đối xứng
   * @param axisEnd Điểm cuối trục đối xứng
   * @param deleteOriginal Xóa đối tượng gốc sau khi mirror
   * @param entityIds Entity IDs, nếu không có sẽ dùng selected entities
   */
  constructor(
    private axisStart: IVec2,
    private axisEnd: IVec2,
    private deleteOriginal: boolean = false,
    private entityIds?: string[]
  ) {}

  execute(context: CommandContext): CommandResult {
    // Lấy entities cần mirror
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
        message: "No objects to mirror",
      };
    }

    // Lưu dữ liệu để undo
    this.data = {
      entityIds: entities.map((e) => e.id),
      axisStart: this.axisStart,
      axisEnd: this.axisEnd,
      deleteOriginal: this.deleteOriginal,
    };

    const resultEntities: IEntity[] = [];

    if (this.deleteOriginal) {
      // Mirror entities tại chỗ (không tạo bản sao)
      for (const entity of entities) {
        const baseEntity = entity as BaseEntity;
        baseEntity.mirror(this.axisStart, this.axisEnd);
        resultEntities.push(entity);
      }
    } else {
      // Tạo bản sao đã mirror
      for (const entity of entities) {
        const baseEntity = entity as BaseEntity;
        const copy = baseEntity.clone() as BaseEntity;
        copy.mirror(this.axisStart, this.axisEnd);
        context.engine.addEntity(copy);
        this.newEntityIds.push(copy.id);
        resultEntities.push(copy);
      }
    }

    context.engine.requestRender();

    return {
      success: true,
      message: `Mirrored ${entities.length} object(s)`,
      entities: resultEntities,
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    if (this.data.deleteOriginal) {
      // Mirror ngược lại (mirror lần nữa sẽ về vị trí ban đầu)
      for (const entityId of this.data.entityIds) {
        const entity = context.engine.getEntity(entityId) as BaseEntity;
        if (entity) {
          entity.mirror(this.data.axisStart, this.data.axisEnd);
        }
      }
    } else {
      // Xóa các bản sao đã tạo
      for (const entityId of this.newEntityIds) {
        context.engine.removeEntity(entityId);
      }
      this.newEntityIds = [];
    }

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    if (!this.data) {
      return { success: false, message: "No data to redo" };
    }

    if (this.data.deleteOriginal) {
      for (const entityId of this.data.entityIds) {
        const entity = context.engine.getEntity(entityId) as BaseEntity;
        if (entity) {
          entity.mirror(this.data.axisStart, this.data.axisEnd);
        }
      }
    } else {
      // Re-create copies
      const entities = this.data.entityIds
        .map((id) => context.engine.getEntity(id))
        .filter((e): e is IEntity => e !== undefined);

      this.newEntityIds = [];
      for (const entity of entities) {
        const baseEntity = entity as BaseEntity;
        const copy = baseEntity.clone() as BaseEntity;
        copy.mirror(this.data.axisStart, this.data.axisEnd);
        context.engine.addEntity(copy);
        this.newEntityIds.push(copy.id);
      }
    }

    context.engine.requestRender();
    return {
      success: true,
      message: `Mirrored ${this.data.entityIds.length} object(s)`,
    };
  }
}

export default MirrorCommand;
