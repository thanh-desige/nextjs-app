/**
 * ARC Command - Vẽ cung tròn
 */

import { IVec2 } from "../../geometry/Vec2";
import { ArcEntity } from "../../entities/Arc";
import { IEntity } from "../../entities/Entity.types";
import { ToolMode } from "../../engine/EngineState";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
  CommandOption,
} from "../Command.types";

export type ArcMode =
  | "3-points" // Mặc định: 3 điểm trên cung
  | "center-start-end" // Tâm, điểm đầu, điểm cuối
  | "center-start-angle" // Tâm, điểm đầu, góc
  | "start-center-end" // Điểm đầu, tâm, điểm cuối
  | "start-end-radius"; // Điểm đầu, điểm cuối, bán kính

export class ArcCommand implements IInteractiveCommand {
  readonly name = "ARC";
  readonly description = "Vẽ cung tròn";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_ARC;
  readonly requiredPoints = 3;

  private mode: ArcMode = "3-points";
  private createdEntity: IEntity | null = null;

  get maxPoints(): number {
    return 3;
  }

  getPrompt(pointCount: number): string {
    switch (this.mode) {
      case "3-points":
        if (pointCount === 0) {
          return "ARC: Chọn điểm đầu cung [Center/Start]:";
        } else if (pointCount === 1) {
          return "ARC: Chọn điểm thứ 2 trên cung:";
        }
        return "ARC: Chọn điểm cuối cung:";

      case "center-start-end":
        if (pointCount === 0) {
          return "ARC: Chọn tâm cung:";
        } else if (pointCount === 1) {
          return "ARC: Chọn điểm đầu cung:";
        }
        return "ARC: Chọn điểm cuối cung:";

      case "start-center-end":
        if (pointCount === 0) {
          return "ARC: Chọn điểm đầu cung:";
        } else if (pointCount === 1) {
          return "ARC: Chọn tâm cung:";
        }
        return "ARC: Chọn điểm cuối cung:";

      default:
        return "";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 0) {
      return [
        { key: "C", label: "Center", description: "Bắt đầu từ tâm" },
        { key: "3P", label: "3 Points", description: "Vẽ qua 3 điểm" },
      ];
    }
    return [];
  }

  createPreview(context: CommandContext, currentPoint: IVec2): IEntity | null {
    switch (this.mode) {
      case "3-points":
        if (context.points.length === 0) return null;
        if (context.points.length === 1) {
          // Chỉ hiển thị đường thẳng preview từ điểm đầu đến vị trí hiện tại
          return null;
        }
        // 2 điểm đã có, preview arc qua 3 điểm
        const arc = ArcEntity.from3Points(
          context.points[0],
          context.points[1],
          currentPoint,
          context.style
        );
        return arc;

      case "center-start-end":
        if (context.points.length < 2) return null;
        const center = context.points[0];
        const startPt = context.points[1];
        return ArcEntity.fromCenterAndPoints(
          center,
          startPt,
          currentPoint,
          context.style
        );

      case "start-center-end":
        if (context.points.length < 2) return null;
        const start = context.points[0];
        const centerPt = context.points[1];
        return ArcEntity.fromCenterAndPoints(
          centerPt,
          start,
          currentPoint,
          context.style
        );

      default:
        return null;
    }
  }

  canComplete(pointCount: number): boolean {
    return pointCount >= 3;
  }

  handleOption(option: string, _context: CommandContext): void {
    const opt = option.toUpperCase();

    switch (opt) {
      case "C":
        this.mode = "center-start-end";
        break;
      case "3P":
        this.mode = "3-points";
        break;
      case "SCE":
        this.mode = "start-center-end";
        break;
    }
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 3) {
      return { success: false, message: "Cần 3 điểm để vẽ cung tròn" };
    }

    let arc: ArcEntity | null = null;

    switch (this.mode) {
      case "3-points":
        arc = ArcEntity.from3Points(
          context.points[0],
          context.points[1],
          context.points[2],
          context.style
        );
        break;

      case "center-start-end":
        arc = ArcEntity.fromCenterAndPoints(
          context.points[0],
          context.points[1],
          context.points[2],
          context.style
        );
        break;

      case "start-center-end":
        arc = ArcEntity.fromCenterAndPoints(
          context.points[1],
          context.points[0],
          context.points[2],
          context.style
        );
        break;

      default:
        return { success: false, message: "Chế độ vẽ không hợp lệ" };
    }

    if (!arc) {
      return { success: false, message: "Không thể tạo cung từ các điểm này" };
    }

    if (context.layerId) arc.layerId = context.layerId;
    // NOTE: Không gọi context.engine.addEntity() - executeInteractiveCommand() sẽ xử lý
    this.createdEntity = arc;

    return {
      success: true,
      message: `Đã tạo cung tròn (R=${arc.radius.toFixed(2)})`,
      entities: [arc],
    };
  }

  undo(context: CommandContext): void {
    if (this.createdEntity) {
      context.engine.removeEntity(this.createdEntity.id);
    }
  }

  redo(context: CommandContext): CommandResult {
    if (this.createdEntity) {
      context.engine.addEntity(this.createdEntity);
      return {
        success: true,
        message: `Redo: Đã tạo lại cung tròn`,
        entities: [this.createdEntity],
      };
    }
    return { success: false, message: "Không có entity để redo" };
  }
}
