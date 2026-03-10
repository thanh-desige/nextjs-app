/**
 * CIRCLE Command - Vẽ đường tròn
 */

import { IVec2 } from "../../geometry/Vec2";
import { CircleEntity } from "../../entities/Circle";
import { IEntity } from "../../entities/Entity.types";
import { ToolMode } from "../../engine/EngineState";
import { distancePointToPoint } from "../../geometry/GeometryUtils";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
  CommandOption,
} from "../Command.types";

export type CircleMode =
  | "center-radius"
  | "center-diameter"
  | "2-points"
  | "3-points";

export class CircleCommand implements IInteractiveCommand {
  readonly name = "CIRCLE";
  readonly description = "Vẽ đường tròn";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_CIRCLE;
  readonly requiredPoints = 2;

  private mode: CircleMode = "center-radius";
  private createdEntity: IEntity | null = null;

  get maxPoints(): number {
    switch (this.mode) {
      case "3-points":
        return 3;
      case "2-points":
        return 2;
      default:
        return 2;
    }
  }

  getPrompt(pointCount: number): string {
    switch (this.mode) {
      case "center-radius":
        if (pointCount === 0) {
          return "Chọn tâm đường tròn [2P/3P/Diameter]:";
        }
        return "Chọn bán kính hoặc nhập giá trị:";

      case "center-diameter":
        if (pointCount === 0) {
          return "Chọn tâm đường tròn:";
        }
        return "Chọn điểm trên đường kính:";

      case "2-points":
        if (pointCount === 0) {
          return "Chọn điểm đầu của đường kính:";
        }
        return "Chọn điểm cuối của đường kính:";

      case "3-points":
        if (pointCount === 0) {
          return "Chọn điểm thứ 1 trên đường tròn:";
        } else if (pointCount === 1) {
          return "Chọn điểm thứ 2 trên đường tròn:";
        }
        return "Chọn điểm thứ 3 trên đường tròn:";

      default:
        return "";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 0 && this.mode === "center-radius") {
      return [
        {
          key: "2P",
          label: "2 Points",
          description: "Vẽ từ 2 điểm (đường kính)",
        },
        { key: "3P", label: "3 Points", description: "Vẽ qua 3 điểm" },
        {
          key: "D",
          label: "Diameter",
          description: "Nhập đường kính thay vì bán kính",
        },
      ];
    }
    return [];
  }

  createPreview(context: CommandContext, currentPoint: IVec2): IEntity | null {
    switch (this.mode) {
      case "center-radius":
      case "center-diameter":
        if (context.points.length === 0) return null;
        const center = context.points[0];
        let radius = distancePointToPoint(center, currentPoint);
        if (this.mode === "center-diameter") {
          radius = radius / 2;
        }
        return CircleEntity.create(center, radius, context.style);

      case "2-points":
        if (context.points.length === 0) return null;
        return CircleEntity.fromDiameter(
          context.points[0],
          currentPoint,
          context.style
        );

      case "3-points":
        if (context.points.length < 2) return null;
        const circle = CircleEntity.from3Points(
          context.points[0],
          context.points[1],
          currentPoint,
          context.style
        );
        return circle;

      default:
        return null;
    }
  }

  canComplete(pointCount: number): boolean {
    switch (this.mode) {
      case "3-points":
        return pointCount >= 3;
      default:
        return pointCount >= 2;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleOption(option: string, _context: CommandContext): void {
    const opt = option.toUpperCase();

    switch (opt) {
      case "2P":
        this.mode = "2-points";
        break;
      case "3P":
        this.mode = "3-points";
        break;
      case "D":
        this.mode = "center-diameter";
        break;
    }
  }

  execute(context: CommandContext): CommandResult {
    let circle: CircleEntity | null = null;

    switch (this.mode) {
      case "center-radius":
        if (context.points.length < 2) {
          return { success: false, message: "Cần tâm và điểm trên đường tròn" };
        }
        const radius = distancePointToPoint(
          context.points[0],
          context.points[1]
        );
        circle = CircleEntity.create(context.points[0], radius, context.style);
        break;

      case "center-diameter":
        if (context.points.length < 2) {
          return { success: false, message: "Cần tâm và điểm trên đường kính" };
        }
        const dRadius =
          distancePointToPoint(context.points[0], context.points[1]) / 2;
        circle = CircleEntity.create(context.points[0], dRadius, context.style);
        break;

      case "2-points":
        if (context.points.length < 2) {
          return { success: false, message: "Cần 2 điểm trên đường kính" };
        }
        circle = CircleEntity.fromDiameter(
          context.points[0],
          context.points[1],
          context.style
        );
        break;

      case "3-points":
        if (context.points.length < 3) {
          return { success: false, message: "Cần 3 điểm trên đường tròn" };
        }
        circle = CircleEntity.from3Points(
          context.points[0],
          context.points[1],
          context.points[2],
          context.style
        );
        if (!circle) {
          return {
            success: false,
            message: "3 điểm thẳng hàng, không thể tạo đường tròn",
          };
        }
        break;
    }

    if (!circle) {
      return { success: false, message: "Không thể tạo đường tròn" };
    }

    circle.layerId = context.layerId || "default";
    // NOTE: Không gọi context.engine.addEntity() - executeInteractiveCommand() sẽ xử lý
    this.createdEntity = circle;

    return {
      success: true,
      message: `Đã tạo đường tròn bán kính ${circle.radius.toFixed(2)}`,
      entities: [circle],
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
        message: `Redo: Đã tạo lại đường tròn`,
        entities: [this.createdEntity],
      };
    }
    return { success: false, message: "Không có entity để redo" };
  }
}
