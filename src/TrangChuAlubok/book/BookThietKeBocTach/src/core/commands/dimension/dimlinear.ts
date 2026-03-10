/**
 * DIMLINEAR Command - Kích thước đường thẳng (ngang/dọc)
 *
 * Tạo dimension theo phương ngang hoặc dọc giữa 2 điểm
 * Logic:
 * - Step 0→1: Chọn điểm 1
 * - Step 1→2: Chọn điểm 2, tự động detect hướng dựa trên góc
 * - Step 2→3: Kéo chuột để xác định offset, hướng dim theo vị trí chuột
 *
 * ASSOCIATIVE DIMENSIONS:
 * - When points are snapped to entities (via OSNAP), store entity references
 * - Dimensions will follow when referenced entities are moved/modified
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
  EntityReference,
} from "../../dimensions/DimensionManager";
import { OsnapMode, OsnapResult } from "../../osnap/Osnap.types";

/**
 * Convert OsnapMode to EntityReference snapType
 */
function osnapModeToSnapType(mode: OsnapMode): EntityReference["snapType"] {
  switch (mode) {
    case OsnapMode.ENDPOINT:
      return "endpoint";
    case OsnapMode.MIDPOINT:
      return "midpoint";
    case OsnapMode.CENTER:
      return "center";
    case OsnapMode.QUADRANT:
      return "quadrant";
    case OsnapMode.INTERSECTION:
      return "intersection";
    case OsnapMode.NEAREST:
      return "nearest";
    default:
      return "endpoint";
  }
}

/**
 * Create EntityReference from OsnapResult
 * Includes pointIndex for accurate point tracking during entity modifications
 */
function createEntityRefFromSnap(
  snap: OsnapResult
): EntityReference | undefined {
  if (!snap.entity) {
    return undefined;
  }

  const entityType = snap.entity
    .type as unknown as EntityReference["entityType"];

  // Only support known entity types
  if (!["line", "circle", "arc", "polyline", "rect"].includes(entityType)) {
    return undefined;
  }

  // Calculate pointIndex for endpoint snaps
  let pointIndex: number | undefined;
  // Cast to access points array (line, polyline, rect have points)
  const entityWithPoints = snap.entity as unknown as {
    points?: { x: number; y: number }[];
  };
  if (
    snap.mode === OsnapMode.ENDPOINT &&
    entityWithPoints.points &&
    entityWithPoints.points.length > 0
  ) {
    // Find which point index was snapped to
    let closestIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < entityWithPoints.points.length; i++) {
      const p = entityWithPoints.points[i];
      const dx = p.x - snap.point.x;
      const dy = p.y - snap.point.y;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }
    // Only set pointIndex if we found a close match (within 1 unit)
    if (minDist < 1) {
      pointIndex = closestIndex;
    }
  }

  return {
    entityId: snap.entity.id,
    entityType,
    snapType: osnapModeToSnapType(snap.mode),
    point: { x: snap.point.x, y: snap.point.y },
    pointIndex,
  };
}

export class DimLinearCommand
  implements IInteractiveCommand<DimensionEntity | null>
{
  readonly name = "DIMLINEAR";
  readonly alias = ["DLI"];
  readonly description =
    "Tạo kích thước đường thẳng theo phương ngang hoặc dọc";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_DIM_LINEAR;
  readonly requiredPoints = 3; // point1, point2, offset position

  private manager = new DimensionManager();
  private createdDimension: DimensionEntity | null = null;
  private direction: "horizontal" | "vertical" | "auto" = "auto";
  private lastOffset: number = 30;

  getPrompt(pointCount: number): string {
    switch (pointCount) {
      case 0:
        return "DIMLINEAR: Specify first extension line origin:";
      case 1:
        return "Specify second extension line origin:";
      case 2:
        return "Specify dimension line location [Horizontal/Vertical]:";
      default:
        return "Ready";
    }
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 2) {
      return [
        {
          key: "H",
          label: "Horizontal",
          description: "Kích thước theo phương ngang",
        },
        {
          key: "V",
          label: "Vertical",
          description: "Kích thước theo phương dọc",
        },
      ];
    }
    return [];
  }

  handleOption(option: string, context: CommandContext): CommandResult {
    const upperOption = option.toUpperCase();
    if (upperOption === "H" || upperOption === "HORIZONTAL") {
      this.direction = "horizontal";
      return { success: false, message: "Direction: Horizontal" };
    }
    if (upperOption === "V" || upperOption === "VERTICAL") {
      this.direction = "vertical";
      return { success: false, message: "Direction: Vertical" };
    }
    return { success: false, message: "Invalid option" };
  }

  createPreview(
    context: CommandContext,
    currentPoint: IVec2
  ): DimensionEntity | null {
    if (context.points.length === 0) return null;

    const point1 = context.points[0];

    if (context.points.length === 1) {
      // Step 1: Đang chọn điểm 2 - preview với hướng tự động
      const autoDirection = this.manager.autoDetectLinearDirection(
        { x: point1.x, y: point1.y },
        { x: currentPoint.x, y: currentPoint.y }
      );
      return this.manager.createLinearDimension({
        point1: { x: point1.x, y: point1.y },
        point2: { x: currentPoint.x, y: currentPoint.y },
        offset: this.lastOffset,
        direction: autoDirection,
      });
    }

    if (context.points.length === 2) {
      const point2 = context.points[1];
      const p1 = { x: point1.x, y: point1.y };
      const p2 = { x: point2.x, y: point2.y };
      const mousePos = { x: currentPoint.x, y: currentPoint.y };

      // Step 2: Đang kéo offset - hướng dim theo vị trí chuột (như AutoCAD)
      // Kéo lên/xuống → horizontal, kéo trái/phải → vertical
      const direction = this.manager.detectDirectionFromOffset(
        p1,
        p2,
        mousePos
      );

      // Tính offset - dim line nhảy về phía chuột đang ở
      const offset = this.manager.calculateOffsetFromMouse(
        p1,
        p2,
        mousePos,
        direction
      );

      // Lưu lại để dùng cho execute
      this.direction = direction;
      this.lastOffset = offset;

      return this.manager.createLinearDimension({
        point1: p1,
        point2: p2,
        offset,
        direction,
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

    // Xác định hướng và offset dựa trên vị trí click cuối
    const direction = this.manager.detectDirectionFromOffset(p1, p2, mousePos);
    const offset = this.manager.calculateOffsetFromMouse(
      p1,
      p2,
      mousePos,
      direction
    );

    // Create entity references from OSNAP results (for associative dimensions)
    let ref1: EntityReference | undefined;
    let ref2: EntityReference | undefined;

    if (context.snapResults && context.snapResults.length >= 2) {
      const snap1 = context.snapResults[0];
      const snap2 = context.snapResults[1];

      if (snap1) {
        ref1 = createEntityRefFromSnap(snap1);
      }
      if (snap2) {
        ref2 = createEntityRefFromSnap(snap2);
      }
    }

    this.createdDimension = this.manager.createLinearDimension({
      point1: p1,
      point2: p2,
      offset,
      direction,
      ref1,
      ref2,
    });

    const isAssociative = !!(ref1 || ref2);
    const msg = isAssociative
      ? `Created associative linear dimension: ${this.createdDimension.id}`
      : `Created linear dimension: ${this.createdDimension.id}`;

    return {
      success: true,
      message: msg,
      data: { dimension: this.createdDimension },
    };
  }

  undo(context: CommandContext): void {
    // Sẽ được xử lý bởi CommandManager - xóa dimension khỏi danh sách
    this.createdDimension = null;
  }

  reset(): void {
    this.createdDimension = null;
    this.direction = "auto";
    this.lastOffset = 30;
  }

  /**
   * Lấy dimension vừa tạo (để sử dụng cho Continue/Baseline)
   */
  getCreatedDimension(): DimensionEntity | null {
    return this.createdDimension;
  }
}

export default DimLinearCommand;
