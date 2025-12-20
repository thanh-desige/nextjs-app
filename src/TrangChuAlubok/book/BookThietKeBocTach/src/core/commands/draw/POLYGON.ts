/**
 * POLYGON Command - Vẽ đa giác đều (regular polygon)
 * Phím tắt: POL
 *
 * Simplified workflow (like CIRCLE):
 * 1. Click để chọn tâm polygon
 * 2. Dynamic Input hiển thị: số cạnh (S) + bán kính (R)
 * 3. Kéo chuột để xem preview, click hoặc nhập số để hoàn thành
 */

import { IVec2 } from "../../geometry/Vec2";
import { PolylineEntity } from "../../entities/Polyline";
import { IEntity } from "../../entities/Entity.types";
import { ToolMode } from "../../engine/EngineState";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
  CommandOption,
} from "../Command.types";

// Command step - simplified
type PolygonStep = "select_center" | "specify_radius";

export class PolygonCommand implements IInteractiveCommand {
  readonly name = "POLYGON";
  readonly description = "Vẽ đa giác đều (regular polygon)";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_POLYGON;
  readonly requiredPoints = 2; // Center + radius point
  readonly maxPoints = 2;
  readonly autoComplete = false; // We handle completion manually

  // Internal state
  private sides: number = 6; // Số cạnh mặc định
  private step: PolygonStep = "select_center";
  private center: IVec2 | null = null;
  private createdEntity: IEntity | null = null;

  // Lưu giá trị cuối cùng để sử dụng lại
  private static lastSides: number = 6;

  constructor() {
    // Sử dụng giá trị từ lần vẽ trước
    this.sides = PolygonCommand.lastSides;
  }

  getPrompt(_pointCount: number): string {
    switch (this.step) {
      case "select_center":
        return `POLYGON (${this.sides} cạnh): Chỉ định tâm đa giác`;

      case "specify_radius":
        return `POLYGON (${this.sides} cạnh): Nhập bán kính hoặc click điểm`;

      default:
        return "POLYGON:";
    }
  }

  getOptions(_pointCount: number): CommandOption[] {
    return [];
  }

  /**
   * Lấy step hiện tại
   */
  getCurrentStep(): PolygonStep {
    return this.step;
  }

  /**
   * Lấy số cạnh hiện tại
   */
  getSides(): number {
    return this.sides;
  }

  /**
   * Set số cạnh
   */
  setSides(sides: number): boolean {
    if (sides >= 3 && sides <= 1024) {
      this.sides = sides;
      PolygonCommand.lastSides = sides;
      return true;
    }
    return false;
  }

  /**
   * Lấy tâm polygon
   */
  getCenter(): IVec2 | null {
    return this.center;
  }

  /**
   * Tính các điểm của polygon đều
   * @param center Tâm polygon
   * @param radius Bán kính (khoảng cách từ tâm đến đỉnh)
   * @param sides Số cạnh
   * @param startAngle Góc bắt đầu (mặc định: -π/2 = đỉnh ở 12 giờ)
   */
  calculatePolygonPoints(
    center: IVec2,
    radius: number,
    sides: number,
    startAngle: number = -Math.PI / 2
  ): IVec2[] {
    const points: IVec2[] = [];
    const angleStep = (2 * Math.PI) / sides;

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    }

    return points;
  }

  createPreview(context: CommandContext, currentPoint: IVec2): IEntity | null {
    // Cần có tâm để preview
    if (this.step !== "specify_radius" || !this.center) {
      return null;
    }

    // Tính bán kính từ khoảng cách
    const radius = Math.sqrt(
      Math.pow(currentPoint.x - this.center.x, 2) +
        Math.pow(currentPoint.y - this.center.y, 2)
    );

    if (radius < 1) return null;

    // Tính góc bắt đầu từ currentPoint để polygon quay theo chuột
    const startAngle = Math.atan2(
      currentPoint.y - this.center.y,
      currentPoint.x - this.center.x
    );

    const points = this.calculatePolygonPoints(
      this.center,
      radius,
      this.sides,
      startAngle
    );

    return PolylineEntity.create(points, true, context.style);
  }

  canComplete(pointCount: number): boolean {
    return this.center !== null && pointCount >= 1;
  }

  /**
   * Xử lý nhập bán kính từ input
   */
  handleInput(input: string, context: CommandContext): boolean {
    const trimmed = input.trim();
    if (!trimmed) return false;

    // Chỉ xử lý khi đang ở bước specify_radius
    if (this.step !== "specify_radius" || !this.center) {
      return false;
    }

    const radius = parseFloat(trimmed);
    if (!isNaN(radius) && radius > 0) {
      // Tạo polygon với bán kính nhập vào
      const startAngle = -Math.PI / 2; // Đỉnh ở 12 giờ
      const points = this.calculatePolygonPoints(
        this.center,
        radius,
        this.sides,
        startAngle
      );

      // Thêm điểm vào context để execute có thể xử lý
      context.points.length = 0;
      points.forEach((p) => context.points.push(p));

      return true;
    }

    return false;
  }

  handleOption(_option: string, _context: CommandContext): void {
    // Không cần options trong workflow mới
  }

  /**
   * Xử lý click điểm
   */
  handlePoint(point: IVec2, context: CommandContext): boolean {
    switch (this.step) {
      case "select_center":
        // Chọn tâm polygon
        this.center = { ...point };
        this.step = "specify_radius";
        return false; // Chưa hoàn thành, đợi radius

      case "specify_radius":
        if (this.center) {
          // Tính bán kính và góc bắt đầu
          const radius = Math.sqrt(
            Math.pow(point.x - this.center.x, 2) +
              Math.pow(point.y - this.center.y, 2)
          );

          if (radius < 1) return false; // Radius quá nhỏ

          const startAngle = Math.atan2(
            point.y - this.center.y,
            point.x - this.center.x
          );

          // Tạo các điểm polygon
          const points = this.calculatePolygonPoints(
            this.center,
            radius,
            this.sides,
            startAngle
          );

          // Cập nhật context.points
          context.points.length = 0;
          points.forEach((p) => context.points.push(p));

          return true; // Hoàn thành
        }
        break;
    }

    return false;
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 3) {
      return {
        success: false,
        message: "Không đủ điểm để tạo polygon",
      };
    }

    // Tạo polygon entity (closed polyline)
    const entity = PolylineEntity.create(context.points, true, context.style);

    if (context.engine) {
      context.engine.addEntity(entity);
    }

    this.createdEntity = entity;

    return {
      success: true,
      message: `POLYGON created with ${this.sides} sides`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { entity } as any,
    };
  }

  undo(context: CommandContext): void {
    if (this.createdEntity) {
      context.engine.removeEntity(this.createdEntity.id);
      this.createdEntity = null;
    }
  }

  /**
   * Reset command về trạng thái ban đầu
   */
  reset(): void {
    this.step = "select_center";
    this.center = null;
    this.createdEntity = null;
    // Giữ lại số cạnh từ lần trước
  }
}
