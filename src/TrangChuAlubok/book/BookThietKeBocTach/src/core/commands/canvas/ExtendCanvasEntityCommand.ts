/**
 * ExtendCanvasEntityCommand - Kéo dài entity đến boundary edges
 *
 * STEP-5.2: Extracted from CanvasEntityCommands.ts
 *
 * Hoạt động giống AutoCAD:
 * - Click vào đầu của entity cần kéo dài
 * - Entity được kéo dài đến boundary edge gần nhất
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import { CanvasEntity, CanvasPoint } from "../../document/CadDocument";
import { CanvasCommandContext } from "./canvasCommandUtils";

export class ExtendCanvasEntityCommand implements ICommand {
  readonly name = "EXTEND_CANVAS_ENTITY";
  readonly canUndo = true;

  private entityId: string;
  private pickPoint: CanvasPoint;
  private boundaryEdgeIds: string[];

  private originalEntity: CanvasEntity | null = null;

  constructor(
    entityId: string,
    pickPoint: CanvasPoint,
    boundaryEdgeIds: string[],
  ) {
    this.entityId = entityId;
    this.pickPoint = pickPoint;
    this.boundaryEdgeIds = boundaryEdgeIds.filter((id) => id !== entityId);
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    const entity = canvasContext.document.getCanvasEntity(this.entityId);
    if (!entity) {
      return { success: false, message: "Entity not found" };
    }

    // Lưu entity gốc để undo
    this.originalEntity = { ...entity, points: [...entity.points] };

    // Lấy boundary edges
    const boundaryEdges = this.boundaryEdgeIds
      .map((id) => canvasContext.document!.getCanvasEntity(id))
      .filter((e): e is CanvasEntity => e !== undefined);

    if (boundaryEdges.length === 0) {
      return {
        success: false,
        message: "No boundary edges found",
      };
    }

    // Xử lý extend theo loại entity
    if (entity.type === "line") {
      return this.extendLine(entity, boundaryEdges, canvasContext);
    }

    return {
      success: false,
      message: `Extend not yet supported for ${entity.type}`,
    };
  }

  private extendLine(
    line: CanvasEntity,
    boundaryEdges: CanvasEntity[],
    context: CanvasCommandContext,
  ): CommandResult {
    if (line.points.length < 2) {
      return { success: false, message: "Invalid line" };
    }

    const lineStart = line.points[0];
    const lineEnd = line.points[1];
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lineLength = Math.sqrt(dx * dx + dy * dy);

    if (lineLength < 0.0001) {
      return { success: false, message: "Line too short" };
    }

    // Normalize direction
    const dirX = dx / lineLength;
    const dirY = dy / lineLength;

    // Xác định đầu nào cần extend dựa trên pickPoint
    const distToStart = this.distanceBetween(this.pickPoint, lineStart);
    const distToEnd = this.distanceBetween(this.pickPoint, lineEnd);
    const extendFromStart = distToStart < distToEnd;

    // Tìm điểm giao gần nhất trên đường kéo dài vô hạn
    let closestIntersection: CanvasPoint | null = null;
    let closestDist = Infinity;

    // Kéo dài line ra phía cần extend (10000 units)
    const extendLength = 10000;
    let rayStart: CanvasPoint;
    let rayEnd: CanvasPoint;

    if (extendFromStart) {
      // Kéo dài từ start về phía ngược direction
      rayStart = {
        x: lineStart.x - dirX * extendLength,
        y: lineStart.y - dirY * extendLength,
      };
      rayEnd = lineStart;
    } else {
      // Kéo dài từ end về phía direction
      rayStart = lineEnd;
      rayEnd = {
        x: lineEnd.x + dirX * extendLength,
        y: lineEnd.y + dirY * extendLength,
      };
    }

    for (const edge of boundaryEdges) {
      const intersections = this.findRayIntersections(rayStart, rayEnd, edge);

      for (const pt of intersections) {
        // Kiểm tra intersection nằm ở phía extend đúng
        if (extendFromStart) {
          // Intersection phải nằm phía trước lineStart (ngược direction)
          const toIntersection = {
            x: pt.x - lineStart.x,
            y: pt.y - lineStart.y,
          };
          const dot = toIntersection.x * -dirX + toIntersection.y * -dirY;
          if (dot > 0.0001) {
            const dist = Math.sqrt(
              toIntersection.x * toIntersection.x +
                toIntersection.y * toIntersection.y,
            );
            if (dist < closestDist) {
              closestDist = dist;
              closestIntersection = pt;
            }
          }
        } else {
          // Intersection phải nằm phía sau lineEnd (theo direction)
          const toIntersection = {
            x: pt.x - lineEnd.x,
            y: pt.y - lineEnd.y,
          };
          const dot = toIntersection.x * dirX + toIntersection.y * dirY;
          if (dot > 0.0001) {
            const dist = Math.sqrt(
              toIntersection.x * toIntersection.x +
                toIntersection.y * toIntersection.y,
            );
            if (dist < closestDist) {
              closestDist = dist;
              closestIntersection = pt;
            }
          }
        }
      }
    }

    if (!closestIntersection) {
      return {
        success: false,
        message: "No valid boundary found to extend to",
      };
    }

    // Update line points
    const newPoints = [...line.points];
    if (extendFromStart) {
      newPoints[0] = closestIntersection;
    } else {
      newPoints[1] = closestIntersection;
    }

    // Update entity in document
    context.document!.updateCanvasEntity(this.entityId, { points: newPoints });

    return {
      success: true,
      message: `Extended line by ${closestDist.toFixed(1)} units`,
    };
  }

  private findRayIntersections(
    rayStart: CanvasPoint,
    rayEnd: CanvasPoint,
    edge: CanvasEntity,
  ): CanvasPoint[] {
    const results: CanvasPoint[] = [];

    if (edge.type === "line" && edge.points.length >= 2) {
      const intersection = this.lineLineIntersectionExtended(
        rayStart,
        rayEnd,
        edge.points[0],
        edge.points[1],
      );
      if (intersection) {
        results.push(intersection);
      }
    } else if (edge.type === "rect" && edge.points.length >= 2) {
      const p1 = edge.points[0];
      const p2 = edge.points[1];
      const corners = [p1, { x: p2.x, y: p1.y }, p2, { x: p1.x, y: p2.y }];
      for (let i = 0; i < 4; i++) {
        const edgeStart = corners[i];
        const edgeEnd = corners[(i + 1) % 4];
        const intersection = this.lineLineIntersectionExtended(
          rayStart,
          rayEnd,
          edgeStart,
          edgeEnd,
        );
        if (intersection) {
          results.push(intersection);
        }
      }
    } else if (edge.type === "polyline" && edge.points.length >= 2) {
      for (let i = 0; i < edge.points.length - 1; i++) {
        const intersection = this.lineLineIntersectionExtended(
          rayStart,
          rayEnd,
          edge.points[i],
          edge.points[i + 1],
        );
        if (intersection) {
          results.push(intersection);
        }
      }
    } else if (edge.type === "circle" && edge.points.length >= 2) {
      const center = edge.points[0];
      const radius = edge.points[1].x;
      const circleIntersections = this.lineCircleIntersectionExtended(
        rayStart,
        rayEnd,
        center,
        radius,
      );
      results.push(...circleIntersections);
    }

    return results;
  }

  /**
   * Line-line intersection: ray (infinite) vs segment (bounded)
   * Ray extends infinitely, but boundary edge is bounded
   */
  private lineLineIntersectionExtended(
    rayStart: CanvasPoint,
    rayEnd: CanvasPoint,
    edgeStart: CanvasPoint,
    edgeEnd: CanvasPoint,
  ): CanvasPoint | null {
    const d1x = rayEnd.x - rayStart.x;
    const d1y = rayEnd.y - rayStart.y;
    const d2x = edgeEnd.x - edgeStart.x;
    const d2y = edgeEnd.y - edgeStart.y;

    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 1e-10) return null; // Parallel

    const dx = edgeStart.x - rayStart.x;
    const dy = edgeStart.y - rayStart.y;

    const t1 = (dx * d2y - dy * d2x) / cross;
    const t2 = (dx * d1y - dy * d1x) / cross;

    // t1 can be any value (ray is conceptually infinite for this check)
    // t2 must be between 0 and 1 (intersection must be on the edge segment)
    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
      return {
        x: rayStart.x + t1 * d1x,
        y: rayStart.y + t1 * d1y,
      };
    }

    return null;
  }

  private lineCircleIntersectionExtended(
    rayStart: CanvasPoint,
    rayEnd: CanvasPoint,
    center: CanvasPoint,
    radius: number,
  ): CanvasPoint[] {
    const dx = rayEnd.x - rayStart.x;
    const dy = rayEnd.y - rayStart.y;
    const fx = rayStart.x - center.x;
    const fy = rayStart.y - center.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];

    const results: CanvasPoint[] = [];
    const sqrtD = Math.sqrt(discriminant);

    const t1 = (-b - sqrtD) / (2 * a);
    const t2 = (-b + sqrtD) / (2 * a);

    // For extend, t must be in range [0, 1] of the extended ray
    if (t1 >= 0 && t1 <= 1) {
      results.push({
        x: rayStart.x + t1 * dx,
        y: rayStart.y + t1 * dy,
      });
    }

    if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-10) {
      results.push({
        x: rayStart.x + t2 * dx,
        y: rayStart.y + t2 * dy,
      });
    }

    return results;
  }

  private distanceBetween(p1: CanvasPoint, p2: CanvasPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document || !this.originalEntity) return;

    // Khôi phục entity gốc
    canvasContext.document.updateCanvasEntity(this.entityId, {
      points: this.originalEntity.points,
    });
  }

  getDescription(): string {
    return "Extend entity to boundary edges";
  }
}
