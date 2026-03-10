/**
 * OffsetCanvasEntityCommand - Tạo đường song song
 *
 * STEP-5.2: Extracted from CanvasEntityCommands.ts
 *
 * Hỗ trợ: line, polyline, rect, circle
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import { CanvasEntity, CanvasPoint } from "../../document/CadDocument";
import { CanvasCommandContext, generateCanvasId } from "./canvasCommandUtils";

export class OffsetCanvasEntityCommand implements ICommand {
  readonly name = "OFFSET_CANVAS_ENTITY";
  readonly canUndo = true;

  private sourceId: string;
  private distance: number;
  private throughPoint: CanvasPoint; // Điểm xác định phía offset
  private offsetEntity: CanvasEntity | null = null;

  constructor(sourceId: string, distance: number, throughPoint: CanvasPoint) {
    this.sourceId = sourceId;
    this.distance = distance;
    this.throughPoint = throughPoint;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    const source = canvasContext.document.getCanvasEntity(this.sourceId);
    if (!source) {
      return { success: false, message: "Source entity not found" };
    }

    // Tạo offset entity dựa trên loại
    const offsetPoints = this.calculateOffsetPoints(source);
    if (!offsetPoints || offsetPoints.length === 0) {
      return { success: false, message: `Cannot offset ${source.type} entity` };
    }

    this.offsetEntity = {
      ...source,
      id: generateCanvasId(),
      selected: false,
      points: offsetPoints,
    };

    canvasContext.document.addCanvasEntity(this.offsetEntity);

    return {
      success: true,
      message: `Created offset at distance ${this.distance}`,
      data: { offsetEntity: this.offsetEntity },
    };
  }

  private calculateOffsetPoints(source: CanvasEntity): CanvasPoint[] {
    switch (source.type) {
      case "line":
        return this.offsetLine(source.points);
      case "polyline":
        return this.offsetPolyline(source.points, source.closed === true);
      case "rect":
        return this.offsetRect(source.points);
      case "circle":
        return this.offsetCircle(source.points);
      default:
        return [];
    }
  }

  private offsetLine(points: CanvasPoint[]): CanvasPoint[] {
    if (points.length < 2) return [];

    const start = points[0];
    const end = points[1];

    // Tính vector direction và perpendicular
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return [];

    const dirX = dx / len;
    const dirY = dy / len;

    // Perpendicular vector (rotate 90°)
    const perpX = -dirY;
    const perpY = dirX;

    // Xác định phía offset dựa trên throughPoint
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const toThroughX = this.throughPoint.x - midX;
    const toThroughY = this.throughPoint.y - midY;
    const side = toThroughX * perpX + toThroughY * perpY > 0 ? 1 : -1;

    // Offset points
    const offsetX = perpX * this.distance * side;
    const offsetY = perpY * this.distance * side;

    return [
      { x: start.x + offsetX, y: start.y + offsetY },
      { x: end.x + offsetX, y: end.y + offsetY },
    ];
  }

  private offsetPolyline(
    points: CanvasPoint[],
    isClosed: boolean = false,
  ): CanvasPoint[] {
    if (points.length < 2) return [];

    const n = points.length;
    const offsetPoints: CanvasPoint[] = [];

    // Tính trung tâm để xác định phía offset
    let centerX = 0,
      centerY = 0;
    for (const p of points) {
      centerX += p.x;
      centerY += p.y;
    }
    centerX /= n;
    centerY /= n;

    // Vector từ center đến throughPoint để xác định phía
    const toThroughX = this.throughPoint.x - centerX;
    const toThroughY = this.throughPoint.y - centerY;

    for (let i = 0; i < n; i++) {
      let perpX = 0,
        perpY = 0;
      let count = 0;

      // Segment trước (với closed: điểm 0 kết nối với điểm cuối)
      const prevIdx = isClosed ? (i - 1 + n) % n : i - 1;
      if (isClosed || i > 0) {
        const dx = points[i].x - points[prevIdx].x;
        const dy = points[i].y - points[prevIdx].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          perpX += -dy / len;
          perpY += dx / len;
          count++;
        }
      }

      // Segment sau (với closed: điểm cuối kết nối với điểm 0)
      const nextIdx = isClosed ? (i + 1) % n : i + 1;
      if (isClosed || i < n - 1) {
        const dx = points[nextIdx].x - points[i].x;
        const dy = points[nextIdx].y - points[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          perpX += -dy / len;
          perpY += dx / len;
          count++;
        }
      }

      if (count > 0) {
        perpX /= count;
        perpY /= count;
        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
        if (perpLen > 0) {
          perpX /= perpLen;
          perpY /= perpLen;
        }
      }

      // Xác định side
      const side = toThroughX * perpX + toThroughY * perpY > 0 ? 1 : -1;

      offsetPoints.push({
        x: points[i].x + perpX * this.distance * side,
        y: points[i].y + perpY * this.distance * side,
      });
    }

    return offsetPoints;
  }

  private offsetRect(points: CanvasPoint[]): CanvasPoint[] {
    if (points.length < 2) return [];

    const p1 = points[0];
    const p2 = points[1];

    // Check if throughPoint is outside rect
    const isOutside =
      this.throughPoint.x < Math.min(p1.x, p2.x) ||
      this.throughPoint.x > Math.max(p1.x, p2.x) ||
      this.throughPoint.y < Math.min(p1.y, p2.y) ||
      this.throughPoint.y > Math.max(p1.y, p2.y);

    const expand = isOutside ? 1 : -1;

    // Offset rect (expand outward or shrink inward)
    const dx = p2.x > p1.x ? this.distance * expand : -this.distance * expand;
    const dy = p2.y > p1.y ? this.distance * expand : -this.distance * expand;

    return [
      { x: p1.x - dx, y: p1.y - dy },
      { x: p2.x + dx, y: p2.y + dy },
    ];
  }

  private offsetCircle(points: CanvasPoint[]): CanvasPoint[] {
    if (points.length < 2) return [];

    const center = points[0];
    const radiusPoint = points[1]; // { x: radius, y: 0 } typically

    // Xác định expand hay shrink
    const distToThrough = Math.sqrt(
      Math.pow(this.throughPoint.x - center.x, 2) +
        Math.pow(this.throughPoint.y - center.y, 2),
    );
    const currentRadius = radiusPoint.x;

    // If throughPoint is outside circle, expand; otherwise shrink
    const expand = distToThrough > currentRadius ? 1 : -1;
    const newRadius = Math.max(0.1, currentRadius + this.distance * expand);

    return [center, { x: newRadius, y: 0 }];
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document || !this.offsetEntity) {
      return;
    }

    canvasContext.document.deleteCanvasEntity(this.offsetEntity.id);
  }

  getDescription(): string {
    return `Offset entity by ${this.distance}`;
  }
}
