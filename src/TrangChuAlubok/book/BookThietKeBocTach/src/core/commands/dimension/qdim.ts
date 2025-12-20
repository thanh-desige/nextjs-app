/**
 * QDIM Command - Quick Dimension
 *
 * Tạo nhiều dimension cùng lúc từ selection hoặc các điểm
 *
 * Workflow (như AutoCAD):
 * - Step 0: Chọn các đối tượng (entities)
 * - Enter: Xác nhận selection, chuyển sang step 1
 * - Step 1: Di chuyển chuột để xác định vị trí dim line
 *   + Hướng dim tự động dựa trên vị trí chuột so với bounding box
 *   + Chuột ở trên/dưới → horizontal dims
 *   + Chuột ở trái/phải → vertical dims
 * - Click: Xác nhận và tạo tất cả dimensions
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
  Point,
  QdimMode,
} from "../../dimensions/DimensionManager";

// Entity interface for QDIM (matching CadDrawingCanvas entities)
export interface QdimEntity {
  id: string;
  type: string;
  points?: Point[];
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
}

export class QdimCommand
  implements IInteractiveCommand<DimensionEntity | null>
{
  readonly name = "QDIM";
  readonly alias = ["QD"];
  readonly description = "Tạo nhanh nhiều dimension từ các đối tượng đã chọn";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_QDIM;
  readonly requiredPoints = 1; // Chỉ cần 1 click để confirm vị trí dim line

  private manager = new DimensionManager();
  private createdDimensions: DimensionEntity[] = [];
  private mode: QdimMode = "continuous";

  // State
  private step: number = 0; // 0: selecting entities, 1: positioning dim line
  private selectedEntities: QdimEntity[] = [];
  private extractedPoints: Point[] = [];
  private dimLinePosition: number = 0;
  private direction: "horizontal" | "vertical" = "horizontal";

  // Preview dimensions (for rendering during step 1)
  private previewDimensions: DimensionEntity[] = [];

  getPrompt(pointCount: number): string {
    if (this.step === 0) {
      if (this.selectedEntities.length === 0) {
        return "QDIM: Select objects to dimension:";
      }
      return `QDIM: ${this.selectedEntities.length} objects selected. Press Enter to specify dimension line position, or select more objects:`;
    }
    return `Specify dimension line position [Continuous/Staggered/Baseline]:`;
  }

  getOptions(pointCount: number): CommandOption[] {
    return [
      {
        key: "C",
        label: "Continuous",
        description: "Dimension liên tục (aligned)",
      },
      { key: "S", label: "Staggered", description: "Dimension so le" },
      { key: "B", label: "Baseline", description: "Dimension baseline" },
    ];
  }

  handleOption(option: string, context: CommandContext): CommandResult {
    const opt = option.toUpperCase();
    switch (opt) {
      case "C":
        this.mode = "continuous";
        return { success: false, message: "Mode: Continuous" };
      case "S":
        this.mode = "staggered";
        return { success: false, message: "Mode: Staggered" };
      case "B":
        this.mode = "baseline";
        return { success: false, message: "Mode: Baseline" };
      default:
        return { success: false, message: "Unknown option" };
    }
  }

  /**
   * Đặt danh sách entities đã chọn
   */
  setSelectedEntities(entities: QdimEntity[]): void {
    this.selectedEntities = entities;
    this.extractedPoints = this.manager.extractPointsFromEntities(entities);
  }

  /**
   * Xác nhận selection và chuyển sang step 1 (positioning)
   */
  confirmSelection(): boolean {
    if (this.extractedPoints.length < 2) {
      return false;
    }
    this.step = 1;
    return true;
  }

  /**
   * Tạo preview dimensions dựa trên vị trí chuột hiện tại
   */
  createPreview(
    _context: CommandContext,
    _currentPoint: IVec2
  ): DimensionEntity | null {
    // QDIM trả về nhiều dimensions, nên không dùng method này
    // Thay vào đó dùng createPreviewDimensions()
    return null;
  }

  /**
   * Tạo preview dimensions (nhiều) dựa trên vị trí chuột
   * Gọi method này từ UI khi mouse move ở step 1
   */
  createPreviewDimensions(mousePos: Point): DimensionEntity[] {
    if (this.step !== 1 || this.extractedPoints.length < 2) {
      return [];
    }

    // Xác định hướng dựa trên vị trí chuột
    this.direction = this.manager.detectQdimDirection(
      this.extractedPoints,
      mousePos
    );

    // dimLinePosition = vị trí Y (horizontal) hoặc X (vertical) của dim line
    this.dimLinePosition =
      this.direction === "horizontal" ? mousePos.y : mousePos.x;

    // Tạo preview dimensions
    switch (this.mode) {
      case "continuous":
        this.previewDimensions = this.manager.createQdimContinuous(
          this.extractedPoints,
          this.dimLinePosition,
          this.direction
        );
        break;
      case "baseline":
        this.previewDimensions = this.manager.createQdimBaseline(
          this.extractedPoints,
          this.dimLinePosition,
          15,
          this.direction
        );
        break;
      case "staggered":
        this.previewDimensions = this.manager.createQdimStaggered(
          this.extractedPoints,
          this.dimLinePosition,
          10,
          this.direction
        );
        break;
      default:
        this.previewDimensions = this.manager.createQdimContinuous(
          this.extractedPoints,
          this.dimLinePosition,
          this.direction
        );
    }

    return this.previewDimensions;
  }

  /**
   * Lấy preview dimensions hiện tại
   */
  getPreviewDimensions(): DimensionEntity[] {
    return this.previewDimensions;
  }

  canComplete(pointCount: number): boolean {
    return this.step === 1 && this.extractedPoints.length >= 2;
  }

  execute(context: CommandContext): CommandResult {
    if (this.step !== 1) {
      return {
        success: false,
        message: "Please select objects and press Enter first",
      };
    }

    if (this.extractedPoints.length < 2) {
      return {
        success: false,
        message: "Need at least 2 points from selected objects",
      };
    }

    // Sử dụng preview dimensions đã tạo (hoặc tạo mới nếu chưa có)
    if (this.previewDimensions.length === 0) {
      // Nếu chưa có preview, tạo từ click point
      if (context.points.length > 0) {
        const clickPoint = context.points[context.points.length - 1];
        this.createPreviewDimensions({ x: clickPoint.x, y: clickPoint.y });
      }
    }

    this.createdDimensions = [...this.previewDimensions];

    return {
      success: true,
      message: `Created ${this.createdDimensions.length} quick dimensions`,
      data: { dimensions: this.createdDimensions },
    };
  }

  /**
   * Lấy các dimensions đã tạo
   */
  getCreatedDimensions(): DimensionEntity[] {
    return this.createdDimensions;
  }

  /**
   * Lấy step hiện tại
   */
  getStep(): number {
    return this.step;
  }

  /**
   * Lấy mode hiện tại
   */
  getMode(): QdimMode {
    return this.mode;
  }

  /**
   * Set mode
   */
  setMode(mode: QdimMode): void {
    this.mode = mode;
  }

  undo(context: CommandContext): void {
    this.createdDimensions = [];
  }

  reset(): void {
    this.createdDimensions = [];
    this.previewDimensions = [];
    this.selectedEntities = [];
    this.extractedPoints = [];
    this.step = 0;
    this.mode = "continuous";
    this.dimLinePosition = 0;
    this.direction = "horizontal";
  }
}

export default QdimCommand;
