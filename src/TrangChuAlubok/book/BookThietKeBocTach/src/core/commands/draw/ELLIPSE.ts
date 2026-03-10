/**
 * ELLIPSE Command - Vẽ hình elip
 */

import { IVec2 } from "../../geometry/Vec2";
import { EllipseEntity } from "../../entities/Ellipse";
import { IEntity } from "../../entities/Entity.types";
import { ToolMode } from "../../engine/EngineState";
import { distancePointToPoint } from "../../geometry/GeometryUtils";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
  CommandOption,
} from "../Command.types";

export type EllipseMode =
  | "center-axis" // Tâm, điểm cuối trục chính, điểm trục phụ
  | "axis-end"; // 2 điểm cuối trục chính, điểm trục phụ

export class EllipseCommand implements IInteractiveCommand {
  readonly name = "ELLIPSE";
  readonly description = "Vẽ hình elip";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_ELLIPSE;
  readonly requiredPoints = 3;

  private mode: EllipseMode = "center-axis";
  private createdEntity: IEntity | null = null;

  get maxPoints(): number {
    return 3;
  }

  getPrompt(pointCount: number): string {
    switch (this.mode) {
      case "center-axis":
        if (pointCount === 0) {
          return "ELLIPSE: Chọn tâm elip [Axis endpoint]:";
        } else if (pointCount === 1) {
          return "ELLIPSE: Chọn điểm cuối trục chính:";
        }
        return "ELLIPSE: Chọn điểm trên trục phụ hoặc nhập bán kính:";

      case "axis-end":
        if (pointCount === 0) {
          return "ELLIPSE: Chọn điểm đầu trục chính:";
        } else if (pointCount === 1) {
          return "ELLIPSE: Chọn điểm cuối trục chính:";
        }
        return "ELLIPSE: Chọn điểm trên trục phụ:";

      default:
        return "";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 0 && this.mode === "center-axis") {
      return [
        {
          key: "A",
          label: "Axis endpoint",
          description: "Vẽ từ 2 điểm cuối trục chính",
        },
      ];
    }
    return [];
  }

  createPreview(context: CommandContext, currentPoint: IVec2): IEntity | null {
    switch (this.mode) {
      case "center-axis":
        if (context.points.length === 0) return null;

        if (context.points.length === 1) {
          // Preview với radiusY = radiusX (tròn)
          const center = context.points[0];
          const radiusX = distancePointToPoint(center, currentPoint);
          const rotation = Math.atan2(
            currentPoint.y - center.y,
            currentPoint.x - center.x
          );
          return EllipseEntity.create(
            center,
            radiusX,
            radiusX,
            rotation,
            context.style
          );
        }

        if (context.points.length === 2) {
          const center = context.points[0];
          const axisEnd = context.points[1];
          const radiusX = distancePointToPoint(center, axisEnd);
          const rotation = Math.atan2(
            axisEnd.y - center.y,
            axisEnd.x - center.x
          );

          // Tính radiusY từ khoảng cách vuông góc đến trục chính
          const radiusY = this.calculateMinorRadius(
            center,
            axisEnd,
            currentPoint
          );

          return EllipseEntity.create(
            center,
            radiusX,
            radiusY,
            rotation,
            context.style
          );
        }
        break;

      case "axis-end":
        if (context.points.length < 2) return null;

        // Tâm là trung điểm của trục chính
        const p1 = context.points[0];
        const p2 = context.points[1];
        const center = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
        const radiusX = distancePointToPoint(p1, p2) / 2;
        const rotation = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const radiusY = this.calculateMinorRadius(center, p2, currentPoint);

        return EllipseEntity.create(
          center,
          radiusX,
          radiusY,
          rotation,
          context.style
        );
    }

    return null;
  }

  /**
   * Tính bán kính trục phụ từ điểm người dùng chọn
   * Đây là khoảng cách vuông góc từ currentPoint đến trục chính
   */
  private calculateMinorRadius(
    center: IVec2,
    axisEnd: IVec2,
    currentPoint: IVec2
  ): number {
    // Vector trục chính
    const axisX = axisEnd.x - center.x;
    const axisY = axisEnd.y - center.y;
    const axisLength = Math.sqrt(axisX * axisX + axisY * axisY);

    if (axisLength < 0.001) return 0;

    // Unit vector của trục chính
    const ux = axisX / axisLength;
    const uy = axisY / axisLength;

    // Vector từ center đến currentPoint
    const dx = currentPoint.x - center.x;
    const dy = currentPoint.y - center.y;

    // Khoảng cách vuông góc = |cross product| / |axis|
    // cross = dx * uy - dy * ux
    const perpDistance = Math.abs(dx * uy - dy * ux);

    return perpDistance;
  }

  canComplete(pointCount: number): boolean {
    return pointCount >= 3;
  }

  handleOption(option: string, _context: CommandContext): void {
    const opt = option.toUpperCase();

    if (opt === "A") {
      this.mode = "axis-end";
    }
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 3) {
      return { success: false, message: "Cần 3 điểm để vẽ elip" };
    }

    let ellipse: EllipseEntity;

    switch (this.mode) {
      case "center-axis": {
        const center = context.points[0];
        const axisEnd = context.points[1];
        const minorPoint = context.points[2];

        const radiusX = distancePointToPoint(center, axisEnd);
        const rotation = Math.atan2(axisEnd.y - center.y, axisEnd.x - center.x);
        const radiusY = this.calculateMinorRadius(center, axisEnd, minorPoint);

        ellipse = EllipseEntity.create(
          center,
          radiusX,
          radiusY,
          rotation,
          context.style
        );
        break;
      }

      case "axis-end": {
        const p1 = context.points[0];
        const p2 = context.points[1];
        const minorPoint = context.points[2];

        const center = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
        const radiusX = distancePointToPoint(p1, p2) / 2;
        const rotation = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const radiusY = this.calculateMinorRadius(center, p2, minorPoint);

        ellipse = EllipseEntity.create(
          center,
          radiusX,
          radiusY,
          rotation,
          context.style
        );
        break;
      }

      default:
        return { success: false, message: "Chế độ vẽ không hợp lệ" };
    }

    if (context.layerId) ellipse.layerId = context.layerId;
    // NOTE: Không gọi context.engine.addEntity() - executeInteractiveCommand() sẽ xử lý
    this.createdEntity = ellipse;

    return {
      success: true,
      message: `Đã tạo elip (RX=${ellipse.radiusX.toFixed(
        2
      )}, RY=${ellipse.radiusY.toFixed(2)})`,
      entities: [ellipse],
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
        message: `Redo: Đã tạo lại elip`,
        entities: [this.createdEntity],
      };
    }
    return { success: false, message: "Không có entity để redo" };
  }
}
