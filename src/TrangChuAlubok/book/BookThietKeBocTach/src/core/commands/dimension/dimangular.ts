/**
 * DIMANGULAR Command - Kích thước góc
 *
 * Tạo dimension đo góc giữa 2 đường thẳng hoặc 3 điểm
 */

import { IVec2 } from "../../geometry/Vec2";
import { ToolMode } from "../../engine/EngineState";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
  CommandOption,
} from "../Command.types";
import {
  DimensionEntity,
  DimensionManager,
} from "../../dimensions/DimensionManager";

export class DimAngularCommand
  implements IInteractiveCommand<DimensionEntity | null>
{
  readonly name = "DIMANGULAR";
  readonly alias = ["DAN"];
  readonly description = "Tạo kích thước góc giữa 2 đường thẳng";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_DIM_ANGULAR;
  readonly requiredPoints = 4; // center, point1, point2, arc position

  private manager = new DimensionManager();
  private createdDimension: DimensionEntity | null = null;

  getPrompt(pointCount: number): string {
    switch (pointCount) {
      case 0:
        return "DIMANGULAR: Select arc, circle, or specify vertex:";
      case 1:
        return "Specify first angle endpoint:";
      case 2:
        return "Specify second angle endpoint:";
      case 3:
        return "Specify dimension arc location:";
      default:
        return "Ready";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 0) {
      return [{ key: "L", label: "Line", description: "Chọn 2 đường thẳng" }];
    }
    return [];
  }

  handleOption(_option: string, _context: CommandContext): CommandResult {
    return { success: false, message: "Option not implemented" };
  }

  createPreview(
    context: CommandContext,
    currentPoint: IVec2
  ): DimensionEntity | null {
    if (context.points.length < 2) return null;

    const center = context.points[0];
    const point1 = context.points[1];

    if (context.points.length === 2) {
      // Preview with mouse as point2
      return this.manager.createAngularDimension({
        center: { x: center.x, y: center.y },
        point1: { x: point1.x, y: point1.y },
        point2: { x: currentPoint.x, y: currentPoint.y },
        offset: 50,
      });
    }

    if (context.points.length === 3) {
      const point2 = context.points[2];
      // Calculate offset from mouse position
      const dist = Math.sqrt(
        Math.pow(currentPoint.x - center.x, 2) +
          Math.pow(currentPoint.y - center.y, 2)
      );

      return this.manager.createAngularDimension({
        center: { x: center.x, y: center.y },
        point1: { x: point1.x, y: point1.y },
        point2: { x: point2.x, y: point2.y },
        offset: dist,
      });
    }

    return null;
  }

  canComplete(pointCount: number): boolean {
    return pointCount >= 4;
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 4) {
      return { success: false, message: "Need 4 points" };
    }

    const center = context.points[0];
    const point1 = context.points[1];
    const point2 = context.points[2];
    const arcPoint = context.points[3];

    const dist = Math.sqrt(
      Math.pow(arcPoint.x - center.x, 2) + Math.pow(arcPoint.y - center.y, 2)
    );

    this.createdDimension = this.manager.createAngularDimension({
      center: { x: center.x, y: center.y },
      point1: { x: point1.x, y: point1.y },
      point2: { x: point2.x, y: point2.y },
      offset: dist,
    });

    return {
      success: true,
      data: { dimension: this.createdDimension },
      message: `Created angular dimension: ${this.createdDimension.id}`,
    };
  }

  undo(): void {
    this.createdDimension = null;
  }

  reset(): void {
    this.createdDimension = null;
  }
}

export default DimAngularCommand;
