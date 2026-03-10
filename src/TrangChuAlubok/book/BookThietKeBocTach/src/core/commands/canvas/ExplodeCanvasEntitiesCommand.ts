/**
 * ExplodeCanvasEntitiesCommand - Phá vỡ đối tượng phức hợp thành các thành phần riêng lẻ
 *
 * STEP-5.2: Extracted from CanvasEntityCommands.ts
 *
 * Hoạt động giống AutoCAD:
 * - RECT → 4 LINE (4 cạnh riêng biệt)
 * - POLYLINE → nhiều LINE riêng biệt (mỗi segment là 1 line)
 * - LINE, CIRCLE, ARC → không explode được (đã là primitive)
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import { CanvasEntity, CanvasPoint } from "../../document/CadDocument";
import { CanvasCommandContext, generateCanvasId } from "./canvasCommandUtils";

export class ExplodeCanvasEntitiesCommand implements ICommand {
  readonly name = "EXPLODE_CANVAS_ENTITIES";
  readonly canUndo = true;

  private entityIds: string[];
  private originalEntities: CanvasEntity[] = [];
  private createdEntityIds: string[] = [];

  constructor(entityIds: string[]) {
    this.entityIds = entityIds;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    const entities = this.entityIds
      .map((id) => canvasContext.document!.getCanvasEntity(id))
      .filter((e): e is CanvasEntity => e !== undefined);

    if (entities.length === 0) {
      return { success: false, message: "No entities to explode" };
    }

    this.originalEntities = [];
    this.createdEntityIds = [];

    let explodedCount = 0;
    let skippedCount = 0;

    for (const entity of entities) {
      const result = this.explodeEntity(entity, canvasContext);
      if (result.exploded) {
        explodedCount++;
        // Lưu entity gốc để undo
        this.originalEntities.push({ ...entity, points: [...entity.points] });
        this.createdEntityIds.push(...result.newEntityIds);

        // Xóa entity gốc
        canvasContext.document!.deleteCanvasEntity(entity.id);
      } else {
        skippedCount++;
      }
    }

    if (explodedCount === 0) {
      return {
        success: false,
        message: `Cannot explode ${skippedCount} object(s) - already primitive`,
      };
    }

    return {
      success: true,
      message: `Exploded ${explodedCount} object(s) into ${
        this.createdEntityIds.length
      } parts${skippedCount > 0 ? `, skipped ${skippedCount}` : ""}`,
    };
  }

  private explodeEntity(
    entity: CanvasEntity,
    context: CanvasCommandContext,
  ): { exploded: boolean; newEntityIds: string[] } {
    switch (entity.type) {
      case "rect":
        return this.explodeRect(entity, context);
      case "polyline":
        return this.explodePolyline(entity, context);
      // Primitives - cannot explode
      case "line":
      case "circle":
      case "arc":
      case "text":
        return { exploded: false, newEntityIds: [] };
      default:
        return { exploded: false, newEntityIds: [] };
    }
  }

  private explodeRect(
    entity: CanvasEntity,
    context: CanvasCommandContext,
  ): { exploded: boolean; newEntityIds: string[] } {
    if (entity.points.length < 2) {
      return { exploded: false, newEntityIds: [] };
    }

    const p1 = entity.points[0];
    const p2 = entity.points[1];

    // 4 corners
    const topLeft: CanvasPoint = {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
    };
    const topRight: CanvasPoint = {
      x: Math.max(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
    };
    const bottomRight: CanvasPoint = {
      x: Math.max(p1.x, p2.x),
      y: Math.max(p1.y, p2.y),
    };
    const bottomLeft: CanvasPoint = {
      x: Math.min(p1.x, p2.x),
      y: Math.max(p1.y, p2.y),
    };

    // Create 4 lines
    const edges: [CanvasPoint, CanvasPoint][] = [
      [topLeft, topRight], // Top edge
      [topRight, bottomRight], // Right edge
      [bottomRight, bottomLeft], // Bottom edge
      [bottomLeft, topLeft], // Left edge
    ];

    const newEntityIds: string[] = [];

    for (const [start, end] of edges) {
      const newLine: CanvasEntity = {
        id: generateCanvasId(),
        type: "line",
        points: [start, end],
        color: entity.color,
        lineWidth: entity.lineWidth,
        layer: entity.layer,
        selected: false,
      };
      context.document!.addCanvasEntity(newLine);
      newEntityIds.push(newLine.id);
    }

    return { exploded: true, newEntityIds };
  }

  private explodePolyline(
    entity: CanvasEntity,
    context: CanvasCommandContext,
  ): { exploded: boolean; newEntityIds: string[] } {
    if (entity.points.length < 2) {
      return { exploded: false, newEntityIds: [] };
    }

    const newEntityIds: string[] = [];

    // Create lines for each segment
    for (let i = 0; i < entity.points.length - 1; i++) {
      const newLine: CanvasEntity = {
        id: generateCanvasId(),
        type: "line",
        points: [entity.points[i], entity.points[i + 1]],
        color: entity.color,
        lineWidth: entity.lineWidth,
        layer: entity.layer,
        selected: false,
      };
      context.document!.addCanvasEntity(newLine);
      newEntityIds.push(newLine.id);
    }

    // If closed polyline, add closing segment
    if (entity.closed && entity.points.length > 2) {
      const newLine: CanvasEntity = {
        id: generateCanvasId(),
        type: "line",
        points: [entity.points[entity.points.length - 1], entity.points[0]],
        color: entity.color,
        lineWidth: entity.lineWidth,
        layer: entity.layer,
        selected: false,
      };
      context.document!.addCanvasEntity(newLine);
      newEntityIds.push(newLine.id);
    }

    return { exploded: true, newEntityIds };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) return;

    // Xóa các entities đã tạo
    for (const id of this.createdEntityIds) {
      canvasContext.document.deleteCanvasEntity(id);
    }

    // Khôi phục entities gốc
    for (const entity of this.originalEntities) {
      canvasContext.document.addCanvasEntity(entity);
    }

    this.createdEntityIds = [];
  }

  getDescription(): string {
    return "Explode compound objects into parts";
  }
}
