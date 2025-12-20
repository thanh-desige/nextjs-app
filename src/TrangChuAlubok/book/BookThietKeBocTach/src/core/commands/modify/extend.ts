/**
 * EXTEND Command - Kéo dài entity đến boundary edges
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";
import { Vec2, IVec2 } from "../../geometry/Vec2";
import { IEntity, EntityType } from "../../entities/Entity.types";
import { LineEntity } from "../../entities/Line";
import { intersectSegments } from "../../geometry/GeometryUtils";

interface ExtendData {
  entityId: string;
  originalStart: IVec2;
  originalEnd: IVec2;
  pickPoint: IVec2;
}

export class ExtendCommand implements ICommand {
  readonly name = "EXTEND";
  readonly description = "Extend entity to boundary edges";
  readonly canUndo = true;

  private data: ExtendData | null = null;

  /**
   * @param entityId ID của entity cần extend
   * @param pickPoint Điểm pick (xác định đầu nào cần extend)
   * @param boundaryEdgeIds IDs của các boundary edges
   */
  constructor(
    private entityId: string,
    private pickPoint: IVec2,
    private boundaryEdgeIds: string[]
  ) {}

  execute(context: CommandContext): CommandResult {
    const entity = context.engine.getEntity(this.entityId);

    if (!entity) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Lấy boundary edges
    const boundaryEdges = this.boundaryEdgeIds
      .map((id) => context.engine.getEntity(id))
      .filter((e): e is IEntity => e !== undefined);

    if (boundaryEdges.length === 0) {
      return {
        success: false,
        message: "No boundary edges",
      };
    }

    // Xử lý extend
    const result = this.extendEntity(entity, boundaryEdges);

    context.engine.requestRender();
    return result;
  }

  private extendEntity(
    entity: IEntity,
    boundaryEdges: IEntity[]
  ): CommandResult {
    if (entity.type === EntityType.LINE) {
      return this.extendLine(entity as LineEntity, boundaryEdges);
    }

    return {
      success: false,
      message: `Extend not supported for ${entity.type}`,
    };
  }

  private extendLine(
    line: LineEntity,
    boundaryEdges: IEntity[]
  ): CommandResult {
    const lineStart = line.start.clone();
    const lineEnd = line.end.clone();
    const pickPt = Vec2.from(this.pickPoint);

    // Lưu trạng thái gốc
    this.data = {
      entityId: this.entityId,
      originalStart: lineStart.clone(),
      originalEnd: lineEnd.clone(),
      pickPoint: this.pickPoint,
    };

    // Xác định đầu nào cần extend
    const distToStart = lineStart.distanceTo(pickPt);
    const distToEnd = lineEnd.distanceTo(pickPt);
    const extendFromStart = distToStart < distToEnd;

    // Direction của line
    const direction = lineEnd.sub(lineStart).normalize();

    // Tìm điểm giao gần nhất
    let closestIntersection: Vec2 | null = null;
    let closestDist = Infinity;

    for (const edge of boundaryEdges) {
      if (edge.id === line.id) continue;

      if (edge.type === EntityType.LINE) {
        const edgeLine = edge as LineEntity;

        // Kéo dài line vô hạn
        let rayStart: Vec2;
        let rayEnd: Vec2;

        if (extendFromStart) {
          rayEnd = lineStart;
          rayStart = lineStart.sub(direction.mul(10000));
        } else {
          rayStart = lineEnd;
          rayEnd = lineEnd.add(direction.mul(10000));
        }

        const result = intersectSegments(
          rayStart,
          rayEnd,
          edgeLine.start,
          edgeLine.end
        );

        if (result.intersects && result.points.length > 0) {
          const intersection = result.points[0];
          const dist = extendFromStart
            ? lineStart.distanceTo(intersection)
            : lineEnd.distanceTo(intersection);

          // Chỉ lấy intersection ở phía extend
          const validDirection = extendFromStart
            ? intersection.sub(lineStart).dot(direction.negate()) > 0
            : intersection.sub(lineEnd).dot(direction) > 0;

          if (validDirection && dist < closestDist) {
            closestDist = dist;
            closestIntersection = intersection;
          }
        }
      }
    }
    if (!closestIntersection) {
      return {
        success: false,
        message: "No valid intersection found",
      };
    }

    // Extend line
    if (extendFromStart) {
      line.start = closestIntersection;
    } else {
      line.end = closestIntersection;
    }

    return {
      success: true,
      message: "Extended line to boundary",
      entities: [line],
    };
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    const entity = context.engine.getEntity(this.data.entityId);
    if (entity && entity.type === EntityType.LINE) {
      const line = entity as LineEntity;
      line.start = Vec2.from(this.data.originalStart);
      line.end = Vec2.from(this.data.originalEnd);
    }

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

export default ExtendCommand;
