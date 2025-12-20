/**
 * DIMARC Command - Kích thước độ dài cung
 *
 * Tạo dimension cho độ dài cung tròn
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

export class DimArcCommand
  implements IInteractiveCommand<DimensionEntity | null>
{
  readonly name = "DIMARC";
  readonly alias = ["DAR"];
  readonly description = "Tạo kích thước độ dài cung";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_DIMARC;
  readonly requiredPoints = 3; // center, start point, end point

  private manager = new DimensionManager();
  private createdDimension: DimensionEntity | null = null;

  getPrompt(pointCount: number): string {
    switch (pointCount) {
      case 0:
        return "DIMARC: Select arc or specify center:";
      case 1:
        return "Specify start point on arc:";
      case 2:
        return "Specify end point on arc:";
      default:
        return "Ready";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 2) {
      return [
        { key: "T", label: "Text", description: "Nhập giá trị kích thước" },
        { key: "L", label: "Leader", description: "Thêm leader line" },
        { key: "P", label: "Partial", description: "Đo một phần cung" },
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
    if (context.points.length < 2) return null;

    const center = context.points[0];
    const startPoint = context.points[1];

    // Calculate arc parameters
    const radius = Math.sqrt(
      Math.pow(startPoint.x - center.x, 2) +
        Math.pow(startPoint.y - center.y, 2)
    );

    const startAngle = Math.atan2(
      startPoint.y - center.y,
      startPoint.x - center.x
    );

    const endAngle = Math.atan2(
      currentPoint.y - center.y,
      currentPoint.x - center.x
    );

    // Calculate arc length
    let sweepAngle = endAngle - startAngle;
    if (sweepAngle < 0) sweepAngle += 2 * Math.PI;
    const arcLength = radius * sweepAngle;

    // Create dimension with arc data
    return this.manager.createArcDimension({
      center: { x: center.x, y: center.y },
      radius,
      startAngle,
      endAngle,
      arcLength,
    });
  }

  canComplete(pointCount: number): boolean {
    return pointCount >= 3;
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 3) {
      return { success: false, message: "Need 3 points" };
    }

    const center = context.points[0];
    const startPoint = context.points[1];
    const endPoint = context.points[2];

    const radius = Math.sqrt(
      Math.pow(startPoint.x - center.x, 2) +
        Math.pow(startPoint.y - center.y, 2)
    );

    const startAngle = Math.atan2(
      startPoint.y - center.y,
      startPoint.x - center.x
    );

    const endAngle = Math.atan2(endPoint.y - center.y, endPoint.x - center.x);

    let sweepAngle = endAngle - startAngle;
    if (sweepAngle < 0) sweepAngle += 2 * Math.PI;
    const arcLength = radius * sweepAngle;

    this.createdDimension = this.manager.createArcDimension({
      center: { x: center.x, y: center.y },
      radius,
      startAngle,
      endAngle,
      arcLength,
    });

    return {
      success: true,
      data: { dimension: this.createdDimension },
      message: `Created arc dimension: ${arcLength.toFixed(2)}`,
    };
  }

  undo(): void {
    this.createdDimension = null;
  }

  reset(): void {
    this.createdDimension = null;
  }
}

export default DimArcCommand;
