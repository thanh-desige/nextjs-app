/**
 * RECT Command - Vẽ hình chữ nhật
 */

import { IVec2 } from "../../geometry/Vec2";
import { RectEntity } from "../../entities/Rect";
import { IEntity } from "../../entities/Entity.types";
import { ToolMode } from "../../engine/EngineState";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
  CommandOption,
} from "../Command.types";

export class RectCommand implements IInteractiveCommand {
  readonly name = "RECT";
  readonly description = "Vẽ hình chữ nhật từ 2 góc đối diện";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_RECT;
  readonly requiredPoints = 2;

  private createdEntity: IEntity | null = null;

  getPrompt(pointCount: number): string {
    if (pointCount === 0) {
      return "Chọn góc thứ nhất của hình chữ nhật:";
    } else {
      return "Chọn góc đối diện [Dimensions]:";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 1) {
      return [
        { key: "D", label: "Dimensions", description: "Nhập kích thước" },
      ];
    }
    return [];
  }

  createPreview(context: CommandContext, currentPoint: IVec2): IEntity | null {
    if (context.points.length === 0) return null;

    const corner1 = context.points[0];
    return RectEntity.fromCorners(corner1, currentPoint, context.style);
  }

  canComplete(pointCount: number): boolean {
    return pointCount >= 2;
  }

  handleOption(option: string, context: CommandContext): void {
    const opt = option.toUpperCase();

    if (opt === "D") {
      // Dimensions mode - sẽ cần nhập width và height
      // TODO: Implement dimensions input
      context.options["mode"] = "dimensions";
    }
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 2) {
      return {
        success: false,
        message: "Cần 2 điểm để vẽ hình chữ nhật",
      };
    }

    let rect: RectEntity;

    if (context.options["mode"] === "dimensions") {
      // Dimensions mode
      const width = (context.options["width"] as number) ?? 100;
      const height = (context.options["height"] as number) ?? 100;
      rect = RectEntity.create(context.points[0], width, height, context.style);
    } else {
      // Corner mode
      rect = RectEntity.fromCorners(
        context.points[0],
        context.points[1],
        context.style
      );
    }

    rect.layerId = context.layerId;
    // NOTE: Không gọi context.engine.addEntity() - executeInteractiveCommand() sẽ xử lý
    this.createdEntity = rect;

    return {
      success: true,
      message: "Đã tạo hình chữ nhật",
      entities: [rect],
    };
  }

  undo(context: CommandContext): void {
    if (this.createdEntity) {
      context.engine.removeEntity(this.createdEntity.id);
      this.createdEntity = null;
    }
  }
}
