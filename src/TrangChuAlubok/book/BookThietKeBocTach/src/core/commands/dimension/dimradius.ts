/**
 * DIMRADIUS Command - Kích thước bán kính
 *
 * Tạo dimension bán kính cho đường tròn hoặc cung tròn
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

export class DimRadiusCommand
  implements IInteractiveCommand<DimensionEntity | null>
{
  readonly name = "DIMRADIUS";
  readonly alias = ["DRA", "DIMRAD"];
  readonly description = "Tạo kích thước bán kính cho đường tròn hoặc cung";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_DIM_RADIUS;
  readonly requiredPoints = 2; // center, point on circle

  private manager = new DimensionManager();
  private createdDimension: DimensionEntity | null = null;

  getPrompt(pointCount: number): string {
    switch (pointCount) {
      case 0:
        return "DIMRADIUS: Select arc or circle:";
      case 1:
        return "Specify dimension line location:";
      default:
        return "Ready";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 1) {
      return [
        { key: "T", label: "Text", description: "Nhập giá trị kích thước" },
        { key: "A", label: "Angle", description: "Xoay text" },
      ];
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
    if (context.points.length === 0) return null;

    const center = context.points[0];

    // Calculate radius and angle from mouse position
    const radius = Math.sqrt(
      Math.pow(currentPoint.x - center.x, 2) +
        Math.pow(currentPoint.y - center.y, 2)
    );
    const angle = Math.atan2(
      currentPoint.y - center.y,
      currentPoint.x - center.x
    );

    return this.manager.createRadiusDimension({
      center: { x: center.x, y: center.y },
      radius,
      angle,
    });
  }

  canComplete(pointCount: number): boolean {
    return pointCount >= 2;
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 2) {
      return { success: false, message: "Need 2 points" };
    }

    const center = context.points[0];
    const pointOnCircle = context.points[1];

    const radius = Math.sqrt(
      Math.pow(pointOnCircle.x - center.x, 2) +
        Math.pow(pointOnCircle.y - center.y, 2)
    );
    const angle = Math.atan2(
      pointOnCircle.y - center.y,
      pointOnCircle.x - center.x
    );

    this.createdDimension = this.manager.createRadiusDimension({
      center: { x: center.x, y: center.y },
      radius,
      angle,
    });

    return {
      success: true,
      data: { dimension: this.createdDimension },
      message: `Created radius dimension: R${radius.toFixed(2)}`,
    };
  }

  undo(): void {
    this.createdDimension = null;
  }

  reset(): void {
    this.createdDimension = null;
  }
}

export default DimRadiusCommand;
