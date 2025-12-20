/**
 * CanvasEntityCommands - Commands cho Canvas entities
 *
 * ĐIỀU KIỆN 1: UI → CadEngine → Document → History
 * Mọi thay đổi entity từ CadDrawingCanvas PHẢI đi qua các Commands này
 *
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Mọi property updates PHẢI được validate trước khi apply
 *
 * Commands:
 * - AddCanvasEntityCommand: Thêm entity mới (line, rect, circle, polyline)
 * - DeleteCanvasEntitiesCommand: Xóa entities
 * - MoveCanvasEntitiesCommand: Di chuyển entities
 * - UpdateCanvasEntityCommand: Cập nhật properties của entity (với validation)
 * - BatchCanvasEntityCommand: Thực hiện nhiều thay đổi cùng lúc
 *
 * PHASE 2 UPDATE: Commands sử dụng EntityUtils qua EntityAdapter
 * - transformCanvasEntity() để áp dụng transformations
 * - Đảm bảo consistency giữa CanvasEntity và UnifiedEntity
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import {
  CadDocument,
  CanvasEntity,
  CanvasPoint,
} from "../../document/CadDocument";
import { EntityType } from "../../entities/Entity.types";
import { propertySchema } from "../../properties/PropertySchema";

// PHASE 2: EntityUtils and Adapter are available for future refactoring
// Commands can use these for consistent transformations:
// - transformCanvasEntity() - apply transformation via UnifiedEntity
// - translateEntity(), rotateEntity(), scaleEntity(), mirrorEntity(), offsetEntity()
//
// Currently, commands use inline logic for backwards compatibility.
// Future migration: Replace inline logic with EntityUtils calls.
//
// Example:
// const moved = transformCanvasEntity(entity, (unified) => translateEntity(unified, dx, dy));
// document.updateCanvasEntity(id, moved);

// ==================== Extended Context ====================

/**
 * Extended context that includes document access
 * This ensures ĐIỀU KIỆN 1 is followed
 */
export interface CanvasCommandContext extends CommandContext {
  /** Access to CadDocument for canvas entity operations */
  document: CadDocument;
}

// Re-export types for convenience
export type { CanvasEntity, CanvasPoint };

// Helper to generate unique ID
function generateCanvasId(): string {
  return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== ĐIỀU KIỆN 2: Property Validation ====================

/**
 * Map CanvasEntity.type (lowercase) sang EntityType (uppercase)
 * Đảm bảo compatibility với PropertySchema
 */
function mapCanvasTypeToEntityType(
  canvasType: CanvasEntity["type"]
): EntityType {
  const typeMap: Record<CanvasEntity["type"], EntityType> = {
    line: EntityType.LINE,
    polyline: EntityType.POLYLINE,
    rect: EntityType.RECT,
    circle: EntityType.CIRCLE,
    arc: EntityType.ARC,
    ellipse: EntityType.ELLIPSE,
    text: EntityType.TEXT,
  };
  return typeMap[canvasType] || EntityType.LINE;
}

/**
 * Validate canvas entity property theo PropertySchema
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 */
function validateCanvasProperty(
  entityType: CanvasEntity["type"],
  key: string,
  value: unknown
): { valid: boolean; error?: string; coercedValue?: unknown } {
  const mappedType = mapCanvasTypeToEntityType(entityType);

  // Map canvas property keys sang PropertySchema keys
  const keyMap: Record<string, string> = {
    color: "strokeColor",
    lineWidth: "strokeWidth",
  };
  const schemaKey = keyMap[key] || key;

  // Validate qua PropertySchema
  const result = propertySchema.validateProperty(mappedType, schemaKey, value);
  return result;
}

/**
 * Validate tất cả updates cho canvas entity
 *
 * NOTE: Canvas entities có cấu trúc đơn giản hơn core entities:
 * - color (string) thay vì style.strokeColor
 * - lineWidth (number) thay vì style.strokeWidth
 * - layer (string) - ID của layer
 *
 * Validation cơ bản cho các trường này, không cần đi qua PropertySchema
 * vì PropertySchema được thiết kế cho core entities phức tạp hơn.
 */
function validateCanvasUpdates(
  entity: CanvasEntity,
  updates: Partial<CanvasEntity>
): {
  valid: boolean;
  errors: string[];
  validatedUpdates: Partial<CanvasEntity>;
} {
  const errors: string[] = [];
  const validatedUpdates: Partial<CanvasEntity> = {};

  for (const [key, value] of Object.entries(updates)) {
    // Skip core fields - always valid
    if (key === "id" || key === "type" || key === "points") {
      (validatedUpdates as Record<string, unknown>)[key] = value;
      continue;
    }

    // Basic validation for canvas-specific properties
    switch (key) {
      case "color":
        // Color should be a string (hex, rgb, etc.)
        if (typeof value === "string" && value.length > 0) {
          validatedUpdates.color = value;
        } else {
          validatedUpdates.color = "#ffffff"; // Default white
        }
        break;

      case "lineWidth":
        // LineWidth should be a positive number
        if (typeof value === "number" && value > 0) {
          validatedUpdates.lineWidth = value;
        } else {
          validatedUpdates.lineWidth = 2; // Default
        }
        break;

      case "layer":
        // Layer ID - any string is valid
        if (typeof value === "string") {
          validatedUpdates.layer = value;
        }
        break;

      case "selected":
      case "locked":
      case "visible":
        // Boolean flags
        (validatedUpdates as Record<string, unknown>)[key] = Boolean(value);
        break;

      default:
        // Accept other properties as-is
        (validatedUpdates as Record<string, unknown>)[key] = value;
    }
  }

  return {
    valid: true, // Always valid after coercion
    errors,
    validatedUpdates,
  };
}

// ==================== ADD ENTITY ====================

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Command này validate entity properties trước khi add
 */
export class AddCanvasEntityCommand implements ICommand {
  readonly name = "ADD_CANVAS_ENTITY";
  readonly canUndo = true;

  private entity: CanvasEntity;
  private validatedEntity: CanvasEntity | null = null;
  private addedId: string | null = null;

  constructor(entity: Omit<CanvasEntity, "id"> | CanvasEntity) {
    // Nếu không có id, tạo mới
    this.entity = {
      ...entity,
      id: (entity as CanvasEntity).id || generateCanvasId(),
    };
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // ĐIỀU KIỆN 2: Validate entity properties
    const validation = validateCanvasUpdates(
      this.entity, // Use self as reference for type
      this.entity // Validate all properties
    );
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }
    this.validatedEntity = {
      ...this.entity,
      ...validation.validatedUpdates,
    };

    // Lưu entity vào document
    canvasContext.document.addCanvasEntity(this.validatedEntity);
    this.addedId = this.validatedEntity.id;

    return {
      success: true,
      message: `Added ${this.validatedEntity.type}: ${this.validatedEntity.id}`,
      data: { entity: this.validatedEntity },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document || !this.addedId) {
      return;
    }

    canvasContext.document.deleteCanvasEntity(this.addedId);
  }

  getDescription(): string {
    return `Add ${this.entity.type}`;
  }
}

// ==================== DELETE ENTITIES ====================

export class DeleteCanvasEntitiesCommand implements ICommand {
  readonly name = "DELETE_CANVAS_ENTITIES";
  readonly canUndo = true;

  private ids: string[];
  private deletedEntities: CanvasEntity[] = [];

  constructor(ids: string | string[]) {
    this.ids = Array.isArray(ids) ? ids : [ids];
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // Lưu entities trước khi xóa (để undo)
    this.deletedEntities = [];
    for (const id of this.ids) {
      const entity = canvasContext.document.getCanvasEntity(id);
      if (entity) {
        this.deletedEntities.push({ ...entity });
        canvasContext.document.deleteCanvasEntity(id);
      }
    }

    return {
      success: true,
      message: `Deleted ${this.deletedEntities.length} entity(s)`,
      data: { deletedIds: this.ids, deletedEntities: this.deletedEntities },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    // Khôi phục entities đã xóa
    for (const entity of this.deletedEntities) {
      canvasContext.document.addCanvasEntity(entity);
    }
  }

  getDescription(): string {
    return `Delete ${this.ids.length} entity(s)`;
  }
}

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
          entity.points.map((p: CanvasPoint) => ({ ...p }))
        );

        // Di chuyển
        const newPoints = entity.points.map((p: CanvasPoint) => ({
          x: p.x + this.dx,
          y: p.y + this.dy,
        }));
        canvasContext.document.updateCanvasEntity(id, { points: newPoints });
      }
    }

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
  }

  getDescription(): string {
    return `Move ${this.ids.length} entity(s)`;
  }
}

// ==================== UPDATE ENTITY ====================

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Command này validate TẤT CẢ updates qua PropertySchema trước khi apply
 */
export class UpdateCanvasEntityCommand implements ICommand {
  readonly name = "UPDATE_CANVAS_ENTITY";
  readonly canUndo = true;

  private id: string;
  private updates: Partial<CanvasEntity>;
  private validatedUpdates: Partial<CanvasEntity> = {};
  private previousValues: Partial<CanvasEntity> = {};

  constructor(id: string, updates: Partial<CanvasEntity>) {
    this.id = id;
    this.updates = updates;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    const entity = canvasContext.document.getCanvasEntity(this.id);
    if (!entity) {
      return { success: false, message: `Entity not found: ${this.id}` };
    }

    // ĐIỀU KIỆN 2: Validate updates qua PropertySchema
    const validation = validateCanvasUpdates(entity, this.updates);
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }
    this.validatedUpdates = validation.validatedUpdates;

    // Lưu giá trị cũ để undo
    this.previousValues = {};
    for (const key of Object.keys(
      this.validatedUpdates
    ) as (keyof CanvasEntity)[]) {
      if (key === "points") {
        this.previousValues.points = entity.points.map((p: CanvasPoint) => ({
          ...p,
        }));
      } else {
        (this.previousValues as Record<string, unknown>)[key] = entity[key];
      }
    }

    // Áp dụng validated updates
    canvasContext.document.updateCanvasEntity(this.id, this.validatedUpdates);

    return {
      success: true,
      message: `Updated entity: ${this.id}`,
      data: { id: this.id, updates: this.validatedUpdates },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    canvasContext.document.updateCanvasEntity(this.id, this.previousValues);
  }

  getDescription(): string {
    return `Update entity ${this.id}`;
  }
}

// ==================== BATCH ADD ENTITIES ====================

/**
 * ĐIỀU KIỆN 2: PropertySchema là luật tối cao
 * Batch command cũng validate TẤT CẢ entities trước khi add
 */
export class BatchAddCanvasEntitiesCommand implements ICommand {
  readonly name = "BATCH_ADD_CANVAS_ENTITIES";
  readonly canUndo = true;

  private entities: CanvasEntity[];
  private validatedEntities: CanvasEntity[] = [];
  private addedIds: string[] = [];

  constructor(entities: (Omit<CanvasEntity, "id"> | CanvasEntity)[]) {
    this.entities = entities.map((e) => ({
      ...e,
      id: (e as CanvasEntity).id || generateCanvasId(),
    }));
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    // ĐIỀU KIỆN 2: Validate TẤT CẢ entities trước khi add
    this.validatedEntities = [];
    const allErrors: string[] = [];

    for (const entity of this.entities) {
      const validation = validateCanvasUpdates(entity, entity);
      if (!validation.valid) {
        allErrors.push(`Entity ${entity.id}: ${validation.errors.join(", ")}`);
      } else {
        this.validatedEntities.push({
          ...entity,
          ...validation.validatedUpdates,
        });
      }
    }

    // Nếu có bất kỳ entity nào invalid, reject toàn bộ batch
    if (allErrors.length > 0) {
      return {
        success: false,
        message: `Validation failed: ${allErrors.join("; ")}`,
      };
    }

    this.addedIds = [];
    for (const entity of this.validatedEntities) {
      canvasContext.document.addCanvasEntity(entity);
      this.addedIds.push(entity.id);
    }

    return {
      success: true,
      message: `Added ${this.validatedEntities.length} entities`,
      data: { entities: this.validatedEntities, ids: this.addedIds },
    };
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return;
    }

    for (const id of this.addedIds) {
      canvasContext.document.deleteCanvasEntity(id);
    }
  }

  getDescription(): string {
    return `Batch add ${this.entities.length} entities`;
  }
}

// ==================== SELECT ENTITIES ====================
// Selection không cần undo - chỉ là UI state

export class SelectCanvasEntitiesCommand implements ICommand {
  readonly name = "SELECT_CANVAS_ENTITIES";
  readonly canUndo = false; // Selection không cần undo

  private ids: string[];
  private additive: boolean;

  constructor(ids: string[], additive = false) {
    this.ids = ids;
    this.additive = additive;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    canvasContext.document.selectCanvasEntities(this.ids, this.additive);

    return {
      success: true,
      message: `Selected ${this.ids.length} entity(s)`,
      data: { ids: this.ids, additive: this.additive },
    };
  }

  undo(): void {
    // Selection không cần undo
  }

  getDescription(): string {
    return `Select ${this.ids.length} entity(s)`;
  }
}

// ==================== CLEAR SELECTION ====================

export class ClearCanvasSelectionCommand implements ICommand {
  readonly name = "CLEAR_CANVAS_SELECTION";
  readonly canUndo = false;

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    canvasContext.document.clearCanvasSelection();

    return {
      success: true,
      message: "Cleared selection",
    };
  }

  undo(): void {
    // Clear selection không cần undo
  }

  getDescription(): string {
    return "Clear selection";
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
          entity.points.map((p: CanvasPoint) => ({ ...p }))
        );

        // Xoay
        const newPoints = entity.points.map((p: CanvasPoint) =>
          this.rotatePoint(p)
        );
        canvasContext.document.updateCanvasEntity(id, { points: newPoints });
      }
    }

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
    deleteOriginal = false
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
        if (this.deleteOriginal) {
          // Mirror in place
          this.originalPoints.set(
            id,
            entity.points.map((p: CanvasPoint) => ({ ...p }))
          );
          const newPoints = entity.points.map((p: CanvasPoint) =>
            this.mirrorPoint(p)
          );
          canvasContext.document.updateCanvasEntity(id, { points: newPoints });
        } else {
          // Create mirrored copy
          const mirroredPoints = entity.points.map((p: CanvasPoint) =>
            this.mirrorPoint(p)
          );
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
    scaleY?: number
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
          entity.points.map((p: CanvasPoint) => ({ ...p }))
        );

        // Scale
        const newPoints = entity.points.map((p: CanvasPoint) =>
          this.scalePoint(p)
        );
        canvasContext.document.updateCanvasEntity(id, { points: newPoints });
      }
    }

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
        const copied: CanvasEntity = {
          ...source,
          id: generateCanvasId(),
          selected: false,
          points: source.points.map((p: CanvasPoint) => ({
            x: p.x + this.offset.dx,
            y: p.y + this.offset.dy,
          })),
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

// ==================== OFFSET ENTITY ====================

/**
 * Offset canvas entity - tạo đường song song
 * Hỗ trợ: line, polyline, rect, circle
 */
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
        return this.offsetPolyline(source.points);
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

  private offsetPolyline(points: CanvasPoint[]): CanvasPoint[] {
    if (points.length < 2) return [];

    const offsetPoints: CanvasPoint[] = [];

    // Tính trung tâm để xác định phía offset
    let centerX = 0,
      centerY = 0;
    for (const p of points) {
      centerX += p.x;
      centerY += p.y;
    }
    centerX /= points.length;
    centerY /= points.length;

    // Vector từ center đến throughPoint để xác định phía
    const toThroughX = this.throughPoint.x - centerX;
    const toThroughY = this.throughPoint.y - centerY;
    void toThroughX; // Used for side determination
    void toThroughY; // Used for side determination

    for (let i = 0; i < points.length; i++) {
      let perpX = 0,
        perpY = 0;
      let count = 0;

      // Segment trước
      if (i > 0) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          perpX += -dy / len;
          perpY += dx / len;
          count++;
        }
      }

      // Segment sau
      if (i < points.length - 1) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
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
        Math.pow(this.throughPoint.y - center.y, 2)
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

// ==================== EXPORTS ====================

// Export validation helpers for external use
export {
  mapCanvasTypeToEntityType,
  validateCanvasProperty,
  validateCanvasUpdates,
};
