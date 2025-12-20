/**
 * OFFSET Command - Tạo đường song song với entity
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";
import { Vec2, IVec2 } from "../../geometry/Vec2";
import { IEntity, EntityType } from "../../entities/Entity.types";
import { BaseEntity } from "../../entities/BaseEntity";
import { LineEntity } from "../../entities/Line";
import { PolylineEntity } from "../../entities/Polyline";
import { CircleEntity } from "../../entities/Circle";
import { ArcEntity } from "../../entities/Arc";

interface OffsetData {
  sourceEntityId: string;
  newEntityId: string;
  distance: number;
  throughPoint: IVec2;
}

export class OffsetCommand implements ICommand {
  readonly name = "OFFSET";
  readonly description = "Create parallel copy of entity at specified distance";
  readonly canUndo = true;

  private data: OffsetData | null = null;

  /**
   * @param sourceEntityId ID của entity gốc
   * @param distance Khoảng cách offset
   * @param throughPoint Điểm để xác định phía offset
   */
  constructor(
    private sourceEntityId: string,
    private distance: number,
    private throughPoint: IVec2
  ) {}

  execute(context: CommandContext): CommandResult {
    const sourceEntity = context.engine.getEntity(this.sourceEntityId);

    if (!sourceEntity) {
      return {
        success: false,
        message: "Source entity not found",
      };
    }

    // Tạo offset entity tùy theo loại
    const offsetEntity = this.createOffsetEntity(sourceEntity);

    if (!offsetEntity) {
      return {
        success: false,
        message: `Cannot offset ${sourceEntity.type} entity`,
      };
    }

    context.engine.addEntity(offsetEntity);

    this.data = {
      sourceEntityId: this.sourceEntityId,
      newEntityId: offsetEntity.id,
      distance: this.distance,
      throughPoint: this.throughPoint,
    };

    context.engine.requestRender();

    return {
      success: true,
      message: `Created offset at distance ${this.distance}`,
      entities: [offsetEntity],
    };
  }

  private createOffsetEntity(source: IEntity): IEntity | null {
    const baseEntity = source as BaseEntity;

    switch (source.type) {
      case EntityType.LINE:
        return this.offsetLine(source as LineEntity);

      case EntityType.POLYLINE:
        return this.offsetPolyline(source as PolylineEntity);

      case EntityType.CIRCLE:
        return this.offsetCircle(source as CircleEntity);

      case EntityType.ARC:
        return this.offsetArc(source as ArcEntity);

      default:
        // Fallback: clone và translate
        const copy = baseEntity.clone() as BaseEntity;
        const bounds = copy.getBounds();
        const center = Vec2.from({
          x: (bounds.min.x + bounds.max.x) / 2,
          y: (bounds.min.y + bounds.max.y) / 2,
        });
        const toPoint = Vec2.from(this.throughPoint).sub(center);
        const direction = toPoint.normalize();
        copy.translate(
          direction.x * this.distance,
          direction.y * this.distance
        );
        return copy;
    }
  }

  private offsetLine(line: LineEntity): LineEntity {
    const start = line.start.clone();
    const end = line.end.clone();

    // Tính vector vuông góc
    const direction = end.sub(start).normalize();
    const perpendicular = new Vec2(-direction.y, direction.x);

    // Xác định phía offset dựa trên through point
    const midPoint = start.add(end).mul(0.5);
    const toThrough = Vec2.from(this.throughPoint).sub(midPoint);
    const side = toThrough.dot(perpendicular) > 0 ? 1 : -1;

    // Offset
    const offset = perpendicular.mul(this.distance * side);

    return new LineEntity(start.add(offset), end.add(offset), {
      style: line.style,
      layerId: line.layerId,
    });
  }

  private offsetPolyline(polyline: PolylineEntity): PolylineEntity {
    const points = polyline.getPoints();
    if (points.length < 2) return polyline.clone() as PolylineEntity;

    const offsetPoints: Vec2[] = [];

    for (let i = 0; i < points.length; i++) {
      const perpSum = Vec2.zero();
      let count = 0;

      // Segment trước
      if (i > 0) {
        const prev = points[i - 1];
        const curr = points[i];
        const dir = curr.sub(prev).normalize();
        perpSum.addSelf({ x: -dir.y, y: dir.x });
        count++;
      }

      // Segment sau
      if (i < points.length - 1) {
        const curr = points[i];
        const next = points[i + 1];
        const dir = next.sub(curr).normalize();
        perpSum.addSelf({ x: -dir.y, y: dir.x });
        count++;
      }

      if (count > 0) {
        const avgPerp = perpSum.div(count).normalize();
        const toThrough = Vec2.from(this.throughPoint).sub(points[i]);
        const side = toThrough.dot(avgPerp) > 0 ? 1 : -1;

        offsetPoints.push(points[i].add(avgPerp.mul(this.distance * side)));
      } else {
        offsetPoints.push(points[i].clone());
      }
    }

    return PolylineEntity.create(offsetPoints, polyline.closed, polyline.style);
  }

  private offsetCircle(circle: CircleEntity): CircleEntity {
    const center = Vec2.from(circle.center);
    const toThrough = Vec2.from(this.throughPoint).sub(center);

    const distToThrough = toThrough.length();
    const isOutside = distToThrough > circle.radius;

    const newRadius = isOutside
      ? circle.radius + this.distance
      : Math.max(0.1, circle.radius - this.distance);

    return new CircleEntity(circle.center, newRadius, {
      style: circle.style,
      layerId: circle.layerId,
    });
  }

  private offsetArc(arc: ArcEntity): ArcEntity {
    const center = Vec2.from(arc.center);
    const toThrough = Vec2.from(this.throughPoint).sub(center);

    const distToThrough = toThrough.length();
    const isOutside = distToThrough > arc.radius;

    const newRadius = isOutside
      ? arc.radius + this.distance
      : Math.max(0.1, arc.radius - this.distance);

    return new ArcEntity(arc.center, newRadius, arc.startAngle, arc.endAngle, {
      style: arc.style,
      layerId: arc.layerId,
    });
  }

  undo(context: CommandContext): void {
    if (!this.data) return;
    context.engine.removeEntity(this.data.newEntityId);
    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

export default OffsetCommand;
