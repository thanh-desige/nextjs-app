/**
 * LINE Command - Vẽ đoạn thẳng
 */

import { IVec2 } from "../../geometry/Vec2";
import { LineEntity } from "../../entities/Line";
import { IEntity } from "../../entities/Entity.types";
import { ToolMode } from "../../engine/EngineState";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
  CommandOption,
} from "../Command.types";

export class LineCommand implements IInteractiveCommand {
  readonly name = "LINE";
  readonly description = "Vẽ đoạn thẳng qua 2 điểm";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_LINE;
  readonly requiredPoints = 2;
  readonly autoComplete = false; // LINE cho phép vẽ liên tục, cần Enter/Space để hoàn thành

  private createdEntities: IEntity[] = [];
  private continuousMode = true; // Vẽ liên tục

  getPrompt(pointCount: number): string {
    if (pointCount === 0) {
      return "Chọn điểm đầu của đoạn thẳng:";
    } else if (pointCount === 1) {
      return "Chọn điểm cuối của đoạn thẳng [Close/Undo]:";
    } else {
      return "Chọn điểm tiếp theo [Close/Undo] hoặc Enter để kết thúc:";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount >= 2) {
      return [
        { key: "C", label: "Close", description: "Đóng polyline" },
        { key: "U", label: "Undo", description: "Xóa điểm cuối" },
      ];
    }
    if (pointCount === 1) {
      return [{ key: "U", label: "Undo", description: "Xóa điểm đầu" }];
    }
    return [];
  }

  createPreview(context: CommandContext, currentPoint: IVec2): IEntity | null {
    if (context.points.length === 0) return null;

    const lastPoint = context.points[context.points.length - 1];
    return LineEntity.create(lastPoint, currentPoint, context.style);
  }

  canComplete(pointCount: number): boolean {
    return pointCount >= 2;
  }

  handleOption(option: string, context: CommandContext): void {
    const opt = option.toUpperCase();

    if (opt === "U" && context.points.length > 0) {
      // Undo last point
      context.points.pop();
      // Also remove last created entity if any
      if (this.createdEntities.length > 0) {
        const lastEntity = this.createdEntities.pop();
        if (lastEntity) {
          context.engine.removeEntity(lastEntity.id);
        }
      }
    } else if (opt === "C" && context.points.length >= 3) {
      // Close - tạo đoạn thẳng từ điểm cuối về điểm đầu
      const start = context.points[context.points.length - 1];
      const end = context.points[0];
      const line = LineEntity.create(start, end, context.style);
      line.layerId = context.layerId || "default";
      context.engine.addEntity(line);
      this.createdEntities.push(line);
    }
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 2) {
      return {
        success: false,
        message: "Cần ít nhất 2 điểm để vẽ đoạn thẳng",
      };
    }

    const entities: IEntity[] = [];

    // Tạo đoạn thẳng cho mỗi cặp điểm liên tiếp
    // NOTE: Không gọi context.engine.addEntity() - executeInteractiveCommand() sẽ xử lý
    for (let i = 0; i < context.points.length - 1; i++) {
      const line = LineEntity.create(
        context.points[i],
        context.points[i + 1],
        context.style
      );
      line.layerId = context.layerId || "default";
      entities.push(line);
    }

    this.createdEntities = entities;

    return {
      success: true,
      message: `Đã tạo ${entities.length} đoạn thẳng`,
      entities,
    };
  }

  undo(context: CommandContext): void {
    for (const entity of this.createdEntities) {
      context.engine.removeEntity(entity.id);
    }
  }

  redo(context: CommandContext): CommandResult {
    if (this.createdEntities.length > 0) {
      for (const entity of this.createdEntities) {
        context.engine.addEntity(entity);
      }
      return {
        success: true,
        message: `Redo: Đã tạo lại ${this.createdEntities.length} đoạn thẳng`,
        entities: this.createdEntities,
      };
    }
    return { success: false, message: "Không có entity để redo" };
  }
}
