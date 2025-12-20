/**
 * DIMALIGNED Command - Kích thước theo cạnh (nghiêng)
 *
 * Tạo dimension song song với đường nối 2 điểm
 * Logic:
 * - Step 0→1: Chọn điểm 1
 * - Step 1→2: Chọn điểm 2
 * - Step 2→3: Kéo chuột để xác định offset vuông góc với đường
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

export class DimAlignedCommand
  implements IInteractiveCommand<DimensionEntity | null>
{
  readonly name = "DIMALIGNED";
  readonly alias = ["DAL"];
  readonly description = "Tạo kích thước song song với đường nối 2 điểm";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_DIM_ALIGNED;
  readonly requiredPoints = 3;

  private manager = new DimensionManager();
  private createdDimension: DimensionEntity | null = null;
  private lastOffset: number = 30;

  getPrompt(pointCount: number): string {
    switch (pointCount) {
      case 0:
        return "DIMALIGNED: Specify first extension line origin:";
      case 1:
        return "Specify second extension line origin:";
      case 2:
        return "Specify dimension line location:";
      default:
        return "Ready";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 2) {
      return [
        { key: "T", label: "Text", description: "Nhập giá trị kích thước" },
        { key: "A", label: "Angle", description: "Xoay text" },
      ];
    }
    return [];
  }

  handleOption(option: string, context: CommandContext): CommandResult {
    return { success: false, message: "Option not implemented" };
  }

  createPreview(
    context: CommandContext,
    currentPoint: IVec2
  ): DimensionEntity | null {
    if (context.points.length === 0) return null;

    const point1 = context.points[0];

    if (context.points.length === 1) {
      // Step 1: Đang chọn điểm 2 - preview với offset mặc định
      return this.manager.createLinearDimension({
        point1: { x: point1.x, y: point1.y },
        point2: { x: currentPoint.x, y: currentPoint.y },
        offset: this.lastOffset,
        direction: "aligned",
      });
    }

    if (context.points.length === 2) {
      const point2 = context.points[1];
      const p1 = { x: point1.x, y: point1.y };
      const p2 = { x: point2.x, y: point2.y };
      const mousePos = { x: currentPoint.x, y: currentPoint.y };

      // Step 2: Kéo offset - sử dụng calculateOffsetFromMouse của DimensionManager
      const offset = this.manager.calculateOffsetFromMouse(
        p1,
        p2,
        mousePos,
        "aligned"
      );

      // Lưu lại để dùng cho execute
      this.lastOffset = offset;

      return this.manager.createLinearDimension({
        point1: p1,
        point2: p2,
        offset,
        direction: "aligned",
      });
    }

    return null;
  }

  canComplete(pointCount: number): boolean {
    return pointCount >= 3;
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 3) {
      return { success: false, message: "Need 3 points" };
    }

    const point1 = context.points[0];
    const point2 = context.points[1];
    const offsetPoint = context.points[2];

    const p1 = { x: point1.x, y: point1.y };
    const p2 = { x: point2.x, y: point2.y };
    const mousePos = { x: offsetPoint.x, y: offsetPoint.y };

    // Sử dụng calculateOffsetFromMouse để tính offset vuông góc
    const offset = this.manager.calculateOffsetFromMouse(
      p1,
      p2,
      mousePos,
      "aligned"
    );

    this.createdDimension = this.manager.createLinearDimension({
      point1: p1,
      point2: p2,
      offset,
      direction: "aligned",
    });

    return {
      success: true,
      message: `Created aligned dimension: ${this.createdDimension.id}`,
      data: { dimension: this.createdDimension },
    };
  }

  undo(context: CommandContext): void {
    // Sẽ được xử lý bởi CommandManager - xóa dimension khỏi danh sách
    this.createdDimension = null;
  }

  reset(): void {
    this.createdDimension = null;
    this.lastOffset = 30;
  }

  /**
   * Lấy dimension vừa tạo (để sử dụng cho Continue/Baseline)
   */
  getCreatedDimension(): DimensionEntity | null {
    return this.createdDimension;
  }
}

export default DimAlignedCommand;
