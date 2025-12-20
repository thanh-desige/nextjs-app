/**
 * DIMCONTINUE Command - Kích thước liên tục
 *
 * Tạo dimension tiếp nối từ dimension trước đó
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

export class DimContinueCommand
  implements IInteractiveCommand<DimensionEntity | null>
{
  readonly name = "DIMCONTINUE";
  readonly alias = ["DCO", "DIMCONT"];
  readonly description = "Tạo kích thước liên tục từ dimension trước";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_DIMCONTINUE;
  readonly requiredPoints = 1; // chỉ cần điểm tiếp theo

  private manager = new DimensionManager();
  private createdDimensions: DimensionEntity[] = [];
  private previousDimension: DimensionEntity | null = null;

  getPrompt(pointCount: number): string {
    if (!this.previousDimension) {
      return "DIMCONTINUE: Select continued dimension:";
    }
    return `Specify second extension line origin [Undo/Select] <Select>:`;
  }

  getOptions(pointCount: number): CommandOption[] {
    return [
      { key: "U", label: "Undo", description: "Hoàn tác dimension cuối" },
      { key: "S", label: "Select", description: "Chọn dimension khác" },
    ];
  }

  handleOption(option: string, context: CommandContext): CommandResult {
    if (option.toUpperCase() === "U") {
      const last = this.createdDimensions.pop();
      if (last) {
        return { success: false, message: "Undone last continue dimension" };
      }
      return { success: false, message: "Nothing to undo" };
    }
    if (option.toUpperCase() === "S") {
      this.previousDimension = null;
      return { success: false, message: "Select dimension to continue from" };
    }
    return { success: false, message: "Unknown option" };
  }

  setPreviousDimension(dim: DimensionEntity): void {
    this.previousDimension = dim;
  }

  createPreview(
    context: CommandContext,
    currentPoint: IVec2
  ): DimensionEntity | null {
    if (!this.previousDimension) return null;

    // Get the end point of previous dimension as start point
    const prevEndPoint = this.getPreviousEndPoint();
    if (!prevEndPoint) return null;

    // Calculate offset from previous dimension
    const offset = this.previousDimension.offset || 50;

    return this.manager.createLinearDimension({
      startPoint: prevEndPoint,
      endPoint: { x: currentPoint.x, y: prevEndPoint.y },
      offset,
      isHorizontal: true,
    });
  }

  private getPreviousEndPoint(): IVec2 | null {
    if (!this.previousDimension) return null;

    // Get end point from previous dimension (point2 is the end point)
    if (this.previousDimension.point2) {
      return this.previousDimension.point2;
    }
    return null;
  }

  canComplete(pointCount: number): boolean {
    return this.previousDimension !== null && pointCount >= 1;
  }

  execute(context: CommandContext): CommandResult {
    if (!this.previousDimension) {
      return { success: false, message: "No previous dimension selected" };
    }

    if (context.points.length < 1) {
      return { success: false, message: "Need at least 1 point" };
    }

    const prevEndPoint = this.getPreviousEndPoint();
    if (!prevEndPoint) {
      return { success: false, message: "Cannot get previous end point" };
    }

    const newEndPoint = context.points[context.points.length - 1];
    const offset = this.previousDimension.offset || 50;

    const newDimension = this.manager.createLinearDimension({
      startPoint: prevEndPoint,
      endPoint: { x: newEndPoint.x, y: prevEndPoint.y },
      offset,
      isHorizontal: true,
    });

    this.createdDimensions.push(newDimension);
    this.previousDimension = newDimension;

    // Don't complete - allow continuing
    return {
      success: false,
      data: { dimension: newDimension, continueMode: true },
      message: `Created continue dimension. Click next point or Enter to finish.`,
    };
  }

  complete(context: CommandContext): CommandResult {
    return {
      success: true,
      data: { dimensions: this.createdDimensions },
      message: `Created ${this.createdDimensions.length} continue dimensions`,
    };
  }

  undo(): void {
    const last = this.createdDimensions.pop();
    if (this.createdDimensions.length > 0) {
      this.previousDimension =
        this.createdDimensions[this.createdDimensions.length - 1];
    }
  }

  reset(): void {
    this.createdDimensions = [];
    this.previousDimension = null;
  }
}

export default DimContinueCommand;
