/**
 * canvasTransformCommands.ts
 *
 * STEP-5.20: Extracted from CanvasEntityCommands.ts
 * Transform commands: Move, Rotate, Mirror, Scale, Copy for canvas entities.
 *
 * ĐIỀU KIỆN 1: UI → CadEngine → Document → History
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import { CanvasEntity, CanvasPoint } from "../../document/CadDocument";
import {
  CanvasCommandContext,
  generateCanvasId,
  validateCanvasUpdates,
} from "./canvasCommandUtils";

// ==================== MOVE ENTITIES ====================

export class MoveCanvasEntitiesCommand implements ICommand {
  readonly name = "MOVE_CANVAS_ENTITIES";
  readonly canUndo = true;

  private ids: string[];
  private dx: number;
  private dy: number;
  private originalPositions: Map<string, CanvasPoint[]> = new Map();

  constructor(ids: string | string[], dx: number, dy: number) {
    this.ids = Array.isArray(ids) ? ids : [ids];
    this.dx = dx;
    this.dy = dy;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // Lưu vị trí gốc và di chuyển
    this.originalPositions.clear();
    for (const id of this.ids) {
      const entity = canvasContext.document.getCanvasEntity(id);
      if (entity) {
        // Lưu vị trí gốc
        this.originalPositions.set(
          id,
          entity.points.map((p: CanvasPoint) => ({ ...p })),
        );

        // Di chuyển - special handling for circle/arc (only move center, keep radius)
        let newPoints: CanvasPoint[];
        if (entity.type === "circle" || entity.type === "arc") {
          // For circle/arc: points[0] is center, points[1].x is radius
          // Only move center point, keep radius unchanged
          newPoints = entity.points.map((p: CanvasPoint, index: number) => {
            if (index === 0) {
              return { x: p.x + this.dx, y: p.y + this.dy };
            }
            return { ...p }; // Keep radius point unchanged
          });
        } else {
          newPoints = entity.points.map((p: CanvasPoint) => ({
            x: p.x + this.dx,
            y: p.y + this.dy,
          }));
        }
        canvasContext.document.updateCanvasEntity(id, { points: newPoints });
      }
    }

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Sau khi geometry thay đổi, commit để update associative dimensions
    canvasContext.document.commitEntitiesGeometryChange(this.ids);

    return {
      success: true,
      message: `Moved ${this.originalPositions.size} entity(s) by (${this.dx}, ${this.dy})`,
      data: { ids: this.ids, dx: this.dx, dy: this.dy },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    // Khôi phục vị trí gốc
    for (const [id, points] of this.originalPositions) {
      canvasContext.document.updateCanvasEntity(id, { points });
    }

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Sau khi undo, cũng phải commit để dimension quay về vị trí cũ
    canvasContext.document.commitEntitiesGeometryChange(this.ids);
  }

  getDescription(): string {
    return `Move ${this.ids.length} entity(s)`;
  }
}

// ==================== ROTATE ENTITIES ====================

/**
 * Xoay canvas entities quanh một điểm tâm
 */
export class RotateCanvasEntitiesCommand implements ICommand {
  readonly name = "ROTATE_CANVAS_ENTITIES";
  readonly canUndo = true;

  private ids: string[];
  private center: CanvasPoint;
  private angle: number; // radians
  private originalPoints: Map<string, CanvasPoint[]> = new Map();

  constructor(ids: string[], center: CanvasPoint, angle: number) {
    this.ids = ids;
    this.center = center;
    this.angle = angle;
  }

  private rotatePoint(point: CanvasPoint): CanvasPoint {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    const dx = point.x - this.center.x;
    const dy = point.y - this.center.y;
    return {
      x: this.center.x + dx * cos - dy * sin,
      y: this.center.y + dx * sin + dy * cos,
    };
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    this.originalPoints.clear();
    for (const id of this.ids) {
      const entity = canvasContext.document.getCanvasEntity(id);
      if (entity) {
        // Lưu vị trí gốc
        this.originalPoints.set(
          id,
          entity.points.map((p: CanvasPoint) => ({ ...p })),
        );

        // Xoay - special handling for circle/arc
        let newPoints: CanvasPoint[];
        if (entity.type === "circle" || entity.type === "arc") {
          // Only rotate center (points[0]), keep radius (points[1]) unchanged
          newPoints = [
            this.rotatePoint(entity.points[0]),
            { ...entity.points[1] }, // Keep radius unchanged
          ];
          // Copy additional arc points if any
          for (let i = 2; i < entity.points.length; i++) {
            newPoints.push({ ...entity.points[i] });
          }
        } else {
          newPoints = entity.points.map((p: CanvasPoint) =>
            this.rotatePoint(p),
          );
        }
        canvasContext.document.updateCanvasEntity(id, { points: newPoints });
      }
    }

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Sau khi rotate geometry, commit để update associative dimensions
    canvasContext.document.commitEntitiesGeometryChange(this.ids);

    const angleDeg = ((this.angle * 180) / Math.PI).toFixed(1);
    return {
      success: true,
      message: `Rotated ${this.originalPoints.size} entity(s) by ${angleDeg}°`,
      data: { ids: this.ids, angle: this.angle },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    for (const [id, points] of this.originalPoints) {
      canvasContext.document.updateCanvasEntity(id, { points });
    }

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Sau khi undo rotation, commit để dimension quay về vị trí cũ
    canvasContext.document.commitEntitiesGeometryChange(this.ids);
  }

  getDescription(): string {
    return `Rotate ${this.ids.length} entity(s)`;
  }
}

// ==================== MIRROR ENTITIES ====================

/**
 * Mirror canvas entities qua một trục (2 điểm)
 */
export class MirrorCanvasEntitiesCommand implements ICommand {
  readonly name = "MIRROR_CANVAS_ENTITIES";
  readonly canUndo = true;

  private sourceIds: string[];
  private axisStart: CanvasPoint;
  private axisEnd: CanvasPoint;
  private deleteOriginal: boolean;
  private originalPoints: Map<string, CanvasPoint[]> = new Map();
  private copiedEntities: CanvasEntity[] = [];

  constructor(
    sourceIds: string[],
    axisStart: CanvasPoint,
    axisEnd: CanvasPoint,
    deleteOriginal = false,
  ) {
    this.sourceIds = sourceIds;
    this.axisStart = axisStart;
    this.axisEnd = axisEnd;
    this.deleteOriginal = deleteOriginal;
  }

  private mirrorPoint(point: CanvasPoint): CanvasPoint {
    // Mirror point across line defined by axisStart and axisEnd
    const dx = this.axisEnd.x - this.axisStart.x;
    const dy = this.axisEnd.y - this.axisStart.y;
    const len2 = dx * dx + dy * dy;

    if (len2 === 0) return point;

    // Project point onto line
    const t =
      ((point.x - this.axisStart.x) * dx + (point.y - this.axisStart.y) * dy) /
      len2;
    const projX = this.axisStart.x + t * dx;
    const projY = this.axisStart.y + t * dy;

    // Mirror = 2 * projection - original
    return {
      x: 2 * projX - point.x,
      y: 2 * projY - point.y,
    };
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    this.originalPoints.clear();
    this.copiedEntities = [];

    for (const id of this.sourceIds) {
      const entity = canvasContext.document.getCanvasEntity(id);
      if (entity) {
        // Helper to get mirrored points with special handling for circle/arc
        const getMirroredPoints = (): CanvasPoint[] => {
          if (entity.type === "circle" || entity.type === "arc") {
            // Only mirror center (points[0]), keep radius (points[1]) unchanged
            const mirroredPoints: CanvasPoint[] = [
              this.mirrorPoint(entity.points[0]),
              { ...entity.points[1] }, // Keep radius unchanged
            ];
            // Copy additional arc points if any
            for (let i = 2; i < entity.points.length; i++) {
              mirroredPoints.push({ ...entity.points[i] });
            }
            return mirroredPoints;
          } else {
            return entity.points.map((p: CanvasPoint) => this.mirrorPoint(p));
          }
        };

        if (this.deleteOriginal) {
          // Mirror in place
          this.originalPoints.set(
            id,
            entity.points.map((p: CanvasPoint) => ({ ...p })),
          );
          const newPoints = getMirroredPoints();
          canvasContext.document.updateCanvasEntity(id, { points: newPoints });
        } else {
          // Create mirrored copy
          const mirroredPoints = getMirroredPoints();
          const copied: CanvasEntity = {
            ...entity,
            id: generateCanvasId(),
            selected: false,
            points: mirroredPoints,
          };
          canvasContext.document.addCanvasEntity(copied);
          this.copiedEntities.push(copied);
        }
      }
    }

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Khi mirror in place (deleteOriginal=true), phải commit geometry change
    if (this.deleteOriginal && this.originalPoints.size > 0) {
      canvasContext.document.commitEntitiesGeometryChange(this.sourceIds);
    }

    return {
      success: true,
      message: `Mirrored ${this.sourceIds.length} entity(s)`,
      data: { ids: this.sourceIds },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    if (this.deleteOriginal) {
      // Restore original positions
      for (const [id, points] of this.originalPoints) {
        canvasContext.document.updateCanvasEntity(id, { points });
      }
      // ========== ENTITY GEOMETRY LIFECYCLE ==========
      // TRỤC SỐNG: Sau khi undo mirror, commit để dimension quay về vị trí cũ
      canvasContext.document.commitEntitiesGeometryChange(this.sourceIds);
    } else {
      // Delete copied entities
      for (const entity of this.copiedEntities) {
        canvasContext.document.deleteCanvasEntity(entity.id);
      }
    }
  }

  getDescription(): string {
    return `Mirror ${this.sourceIds.length} entity(s)`;
  }
}

// ==================== SCALE ENTITIES ====================

/**
 * Scale canvas entities từ một điểm tâm
 */
export class ScaleCanvasEntitiesCommand implements ICommand {
  readonly name = "SCALE_CANVAS_ENTITIES";
  readonly canUndo = true;

  private ids: string[];
  private center: CanvasPoint;
  private scaleX: number;
  private scaleY: number;
  private originalPoints: Map<string, CanvasPoint[]> = new Map();

  constructor(
    ids: string[],
    center: CanvasPoint,
    scaleX: number,
    scaleY?: number,
  ) {
    this.ids = ids;
    this.center = center;
    this.scaleX = scaleX;
    this.scaleY = scaleY ?? scaleX;
  }

  private scalePoint(point: CanvasPoint): CanvasPoint {
    return {
      x: this.center.x + (point.x - this.center.x) * this.scaleX,
      y: this.center.y + (point.y - this.center.y) * this.scaleY,
    };
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    this.originalPoints.clear();
    for (const id of this.ids) {
      const entity = canvasContext.document.getCanvasEntity(id);
      if (entity) {
        // Lưu vị trí gốc
        this.originalPoints.set(
          id,
          entity.points.map((p: CanvasPoint) => ({ ...p })),
        );

        // Scale - special handling for circle/arc
        let newPoints: CanvasPoint[];
        if (entity.type === "circle" || entity.type === "arc") {
          // Scale center position
          const newCenter = this.scalePoint(entity.points[0]);
          // Scale radius using average of scaleX and scaleY
          const avgScale = (Math.abs(this.scaleX) + Math.abs(this.scaleY)) / 2;
          const newRadius = Math.abs(entity.points[1].x * avgScale);
          newPoints = [
            newCenter,
            { x: newRadius, y: 0 }, // Scaled radius
          ];
          // Copy additional arc points if any
          for (let i = 2; i < entity.points.length; i++) {
            newPoints.push({ ...entity.points[i] });
          }
        } else {
          newPoints = entity.points.map((p: CanvasPoint) => this.scalePoint(p));
        }
        canvasContext.document.updateCanvasEntity(id, { points: newPoints });
      }
    }

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Sau khi scale geometry, commit để update associative dimensions
    canvasContext.document.commitEntitiesGeometryChange(this.ids);

    return {
      success: true,
      message: `Scaled ${
        this.originalPoints.size
      } entity(s) by ${this.scaleX.toFixed(2)}`,
      data: { ids: this.ids, scaleX: this.scaleX, scaleY: this.scaleY },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    for (const [id, points] of this.originalPoints) {
      canvasContext.document.updateCanvasEntity(id, { points });
    }

    // ========== ENTITY GEOMETRY LIFECYCLE ==========
    // TRỤC SỐNG: Sau khi undo scale, commit để dimension quay về kích thước cũ
    canvasContext.document.commitEntitiesGeometryChange(this.ids);
  }

  getDescription(): string {
    return `Scale ${this.ids.length} entity(s)`;
  }
}

// ==================== COPY ENTITIES ====================

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Copy command cũng validate entities sau khi copy
 */
export class CopyCanvasEntitiesCommand implements ICommand {
  readonly name = "COPY_CANVAS_ENTITIES";
  readonly canUndo = true;

  private sourceIds: string[];
  private offset: { dx: number; dy: number };
  private copiedEntities: CanvasEntity[] = [];

  constructor(sourceIds: string[], offset = { dx: 20, dy: 20 }) {
    this.sourceIds = sourceIds;
    this.offset = offset;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    this.copiedEntities = [];
    const allErrors: string[] = [];

    for (const id of this.sourceIds) {
      const source = canvasContext.document.getCanvasEntity(id);
      if (source) {
        // Special handling for circle/arc: points[1].x is radius, not coordinate
        let copiedPoints: CanvasPoint[];
        if (source.type === "circle" || source.type === "arc") {
          copiedPoints = [
            {
              x: source.points[0].x + this.offset.dx,
              y: source.points[0].y + this.offset.dy,
            },
            { ...source.points[1] }, // Keep radius unchanged
          ];
          // Copy additional arc points if any
          for (let i = 2; i < source.points.length; i++) {
            copiedPoints.push({ ...source.points[i] });
          }
        } else {
          copiedPoints = source.points.map((p: CanvasPoint) => ({
            x: p.x + this.offset.dx,
            y: p.y + this.offset.dy,
          }));
        }

        const copied: CanvasEntity = {
          ...source,
          id: generateCanvasId(),
          selected: false,
          points: copiedPoints,
        };

        // ĐIỀU KIỆN 2: Validate copied entity
        const validation = validateCanvasUpdates(copied, copied);
        if (!validation.valid) {
          allErrors.push(`Copy of ${id}: ${validation.errors.join(", ")}`);
        } else {
          const validatedCopy = { ...copied, ...validation.validatedUpdates };
          canvasContext.document.addCanvasEntity(validatedCopy);
          this.copiedEntities.push(validatedCopy);
        }
      }
    }

    if (allErrors.length > 0) {
      return {
        success: false,
        message: `Copy validation failed: ${allErrors.join("; ")}`,
      };
    }

    return {
      success: true,
      message: `Copied ${this.copiedEntities.length} entity(s)`,
      data: { copiedEntities: this.copiedEntities },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    for (const entity of this.copiedEntities) {
      canvasContext.document.deleteCanvasEntity(entity.id);
    }
  }

  getDescription(): string {
    return `Copy ${this.sourceIds.length} entity(s)`;
  }
}
