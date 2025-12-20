/**
 * TRIM Command - Cắt entity tại điểm giao với cutting edges
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";
import { Vec2, IVec2 } from "../../geometry/Vec2";
import { IEntity, EntityType, EntityJSON } from "../../entities/Entity.types";
import { LineEntity } from "../../entities/Line";
import { intersectSegments } from "../../geometry/GeometryUtils";

interface TrimData {
  entityId: string;
  originalJSON: EntityJSON;
  pickPoint: IVec2;
  createdEntityIds: string[];
}

export class TrimCommand implements ICommand {
  readonly name = "TRIM";
  readonly description = "Trim entity at cutting edges";
  readonly canUndo = true;

  private data: TrimData | null = null;

  /**
   * @param entityId ID của entity cần trim
   * @param pickPoint Điểm pick (phần cần xóa)
   * @param cuttingEdgeIds IDs của các cutting edges
   */
  constructor(
    private entityId: string,
    private pickPoint: IVec2,
    private cuttingEdgeIds: string[]
  ) {}

  execute(context: CommandContext): CommandResult {
    const entity = context.engine.getEntity(this.entityId);

    if (!entity) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Lưu trạng thái gốc
    this.data = {
      entityId: this.entityId,
      originalJSON: entity.toJSON(),
      pickPoint: this.pickPoint,
      createdEntityIds: [],
    };

    // Lấy cutting edges
    const cuttingEdges = this.cuttingEdgeIds
      .map((id) => context.engine.getEntity(id))
      .filter((e): e is IEntity => e !== undefined);

    if (cuttingEdges.length === 0) {
      // Xóa toàn bộ entity nếu không có cutting edges
      context.engine.removeEntity(this.entityId);
      context.engine.requestRender();
      return {
        success: true,
        message: "Deleted entity (no cutting edges)",
      };
    }

    // Xử lý trim
    const result = this.trimEntity(entity, cuttingEdges, context);

    context.engine.requestRender();
    return result;
  }

  private trimEntity(
    entity: IEntity,
    cuttingEdges: IEntity[],
    context: CommandContext
  ): CommandResult {
    if (entity.type === EntityType.LINE) {
      return this.trimLine(entity as LineEntity, cuttingEdges, context);
    }

    return {
      success: false,
      message: `Trim not supported for ${entity.type}`,
    };
  }

  private trimLine(
    line: LineEntity,
    cuttingEdges: IEntity[],
    context: CommandContext
  ): CommandResult {
    const lineStart = line.start.clone();
    const lineEnd = line.end.clone();
    const pickPt = Vec2.from(this.pickPoint);

    // Tìm tất cả điểm giao
    const intersections: { point: Vec2; t: number }[] = [];

    for (const edge of cuttingEdges) {
      if (edge.type === EntityType.LINE) {
        const edgeLine = edge as LineEntity;
        const result = intersectSegments(
          lineStart,
          lineEnd,
          edgeLine.start,
          edgeLine.end
        );

        if (result.intersects && result.points.length > 0) {
          const intersection = result.points[0];
          const t =
            lineStart.distanceTo(intersection) / lineStart.distanceTo(lineEnd);
          if (t > 0.001 && t < 0.999) {
            intersections.push({ point: intersection, t });
          }
        }
      }
    }

    if (intersections.length === 0) {
      context.engine.removeEntity(this.entityId);
      return {
        success: true,
        message: "Deleted line (no intersections)",
      };
    }

    // Sắp xếp theo t
    intersections.sort((a, b) => a.t - b.t);

    // Tìm segment chứa pick point
    const pickT = lineStart.distanceTo(pickPt) / lineStart.distanceTo(lineEnd);

    let trimStart = 0;
    let trimEnd = 1;

    for (let i = 0; i < intersections.length; i++) {
      if (intersections[i].t > pickT) {
        trimEnd = intersections[i].t;
        if (i > 0) {
          trimStart = intersections[i - 1].t;
        }
        break;
      }
      trimStart = intersections[i].t;
    }

    if (pickT > intersections[intersections.length - 1].t) {
      trimStart = intersections[intersections.length - 1].t;
      trimEnd = 1;
    }

    // Xóa entity gốc
    context.engine.removeEntity(this.entityId);

    const newEntities: IEntity[] = [];

    // Tạo segments mới
    if (trimStart > 0.001) {
      const newEnd = lineStart.lerp(lineEnd, trimStart);
      const line1 = new LineEntity(lineStart, newEnd, {
        style: line.style,
        layerId: line.layerId,
      });
      context.engine.addEntity(line1);
      newEntities.push(line1);
      this.data!.createdEntityIds.push(line1.id);
    }

    if (trimEnd < 0.999) {
      const newStart = lineStart.lerp(lineEnd, trimEnd);
      const line2 = new LineEntity(newStart, lineEnd, {
        style: line.style,
        layerId: line.layerId,
      });
      context.engine.addEntity(line2);
      newEntities.push(line2);
      this.data!.createdEntityIds.push(line2.id);
    }

    return {
      success: true,
      message: `Trimmed line, created ${newEntities.length} segment(s)`,
      entities: newEntities,
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    // Xóa các entity đã tạo
    for (const id of this.data.createdEntityIds) {
      context.engine.removeEntity(id);
    }

    // TODO: Restore original entity from JSON

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

export default TrimCommand;
