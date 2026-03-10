/**
 * DoorCommands - Commands cho Door entities
 *
 * ĐIỀU KIỆN 1: UI → CadEngine → Document → History
 * Mọi thay đổi Door PHẢI đi qua các Commands này
 *
 * RULE 7: Mọi thay đổi phải đi qua Command + History
 * - Mỗi thay đổi có execute() và undo()
 * - Ghi vào History để hỗ trợ undo/redo
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - KHÔNG import door-engines, analysis, systems
 * - CHỈ import DoorEntity (data) và DoorFactory (creation)
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import { CadDocument } from "../../document/CadDocument";
import { DoorEntity, DoorVariant, DoorPoint } from "../../entities/DoorEntity";
import { DoorFactory } from "../../../domain/door/DoorFactory";

// ==================== Extended Context ====================

/**
 * Extended context that includes document access
 * This ensures ĐIỀU KIỆN 1 is followed
 */
export interface DoorCommandContext extends CommandContext {
  /** Access to CadDocument for door operations */
  document: CadDocument;
}

// ==================== Door Create Params ====================

export interface DoorCreateParams {
  variant: DoorVariant;
  systemId: string;
  position: DoorPoint;
  width: number;
  height: number;
  displayName?: string;
  options?: Record<string, unknown>;
  /** ID của template (để lookup SVG thumbnail) */
  previewTemplateId?: string;
}

// ==================== Add Door Command ====================

/**
 * Command thêm cửa mới
 * RULE 7: Có undo để xóa cửa đã thêm
 */
export class AddDoorCommand implements ICommand {
  readonly name = "Add Door";
  readonly description = "Thêm cửa mới vào document";
  readonly canUndo = true;

  private door: DoorEntity | null = null;

  constructor(private params: DoorCreateParams) {}

  execute(context: CommandContext): CommandResult {
    const ctx = context as DoorCommandContext;

    if (!ctx.document) {
      return {
        success: false,
        message: "Document not available in context",
      };
    }

    // Tạo door qua Factory (Rule 5: Entity chỉ chứa data)
    this.door = DoorFactory.create({
      variant: this.params.variant,
      systemId: this.params.systemId,
      position: this.params.position,
      width: this.params.width,
      height: this.params.height,
      displayName: this.params.displayName,
      options: this.params.options,
      previewTemplateId: this.params.previewTemplateId,
    });

    // Thêm vào Document (ĐIỀU KIỆN 1)
    ctx.document.addDoor(this.door);

    return {
      success: true,
      message: `Added door: ${this.door.doorInfo.displayName}`,
      data: { doorId: this.door.id },
    };
  }

  undo(context: CommandContext): void {
    const ctx = context as DoorCommandContext;

    if (this.door && ctx.document) {
      ctx.document.removeDoor(this.door.id);
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }

  /** Lấy door đã tạo (để UI có thể sync) */
  getCreatedDoor(): DoorEntity | null {
    return this.door;
  }
}

// ==================== Remove Door Command ====================

/**
 * Command xóa cửa
 * RULE 7: Lưu door cũ để undo
 */
export class RemoveDoorCommand implements ICommand {
  readonly name = "Remove Door";
  readonly description = "Xóa cửa khỏi document";
  readonly canUndo = true;

  private removedDoor: DoorEntity | null = null;

  constructor(private doorId: string) {}

  execute(context: CommandContext): CommandResult {
    const ctx = context as DoorCommandContext;

    if (!ctx.document) {
      return {
        success: false,
        message: "Document not available in context",
      };
    }

    // Lưu door để undo
    this.removedDoor = ctx.document.getDoor(this.doorId) || null;

    if (!this.removedDoor) {
      return {
        success: false,
        message: `Door not found: ${this.doorId}`,
      };
    }

    // Xóa khỏi Document
    ctx.document.removeDoor(this.doorId);

    return {
      success: true,
      message: `Removed door: ${this.removedDoor.doorInfo.displayName}`,
      data: { doorId: this.doorId },
    };
  }

  undo(context: CommandContext): void {
    const ctx = context as DoorCommandContext;

    if (this.removedDoor && ctx.document) {
      ctx.document.addDoor(this.removedDoor);
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

// ==================== Remove Multiple Doors Command ====================

/**
 * Command xóa nhiều cửa cùng lúc
 */
export class RemoveDoorsCommand implements ICommand {
  readonly name = "Remove Doors";
  readonly description = "Xóa nhiều cửa khỏi document";
  readonly canUndo = true;

  private removedDoors: DoorEntity[] = [];

  constructor(private doorIds: string[]) {}

  execute(context: CommandContext): CommandResult {
    const ctx = context as DoorCommandContext;

    if (!ctx.document) {
      return {
        success: false,
        message: "Document not available in context",
      };
    }

    // Lưu tất cả doors để undo
    this.removedDoors = [];
    for (const id of this.doorIds) {
      const door = ctx.document.getDoor(id);
      if (door) {
        this.removedDoors.push(door);
      }
    }

    // Xóa tất cả
    const count = ctx.document.removeDoors(this.doorIds);

    return {
      success: true,
      message: `Removed ${count} door(s)`,
      data: { removedCount: count },
    };
  }

  undo(context: CommandContext): void {
    const ctx = context as DoorCommandContext;

    if (ctx.document) {
      for (const door of this.removedDoors) {
        ctx.document.addDoor(door);
      }
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

// ==================== Update Door Command ====================

/**
 * Command cập nhật cửa
 * RULE 7: Lưu giá trị cũ để undo
 */
export class UpdateDoorCommand implements ICommand {
  readonly name = "Update Door";
  readonly description = "Cập nhật thông tin cửa";
  readonly canUndo = true;

  private previousValues: Partial<DoorEntity> | null = null;

  constructor(private doorId: string, private updates: Partial<DoorEntity>) {}

  execute(context: CommandContext): CommandResult {
    const ctx = context as DoorCommandContext;

    if (!ctx.document) {
      return {
        success: false,
        message: "Document not available in context",
      };
    }

    const door = ctx.document.getDoor(this.doorId);
    if (!door) {
      return {
        success: false,
        message: `Door not found: ${this.doorId}`,
      };
    }

    // Lưu giá trị cũ để undo
    this.previousValues = {};
    for (const key of Object.keys(this.updates) as (keyof DoorEntity)[]) {
      (this.previousValues as Record<string, unknown>)[key] = door[key];
    }

    // Apply updates
    ctx.document.updateDoor(this.doorId, this.updates);

    return {
      success: true,
      message: `Updated door: ${this.doorId}`,
      data: { doorId: this.doorId, updates: this.updates },
    };
  }

  undo(context: CommandContext): void {
    const ctx = context as DoorCommandContext;

    if (this.previousValues && ctx.document) {
      ctx.document.updateDoor(this.doorId, this.previousValues);
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

// ==================== Move Door Command ====================

/**
 * Command di chuyển cửa
 * RULE 7: Lưu vị trí cũ để undo
 */
export class MoveDoorCommand implements ICommand {
  readonly name = "Move Door";
  readonly description = "Di chuyển cửa đến vị trí mới";
  readonly canUndo = true;

  private previousPosition: DoorPoint | null = null;

  constructor(private doorId: string, private newPosition: DoorPoint) {}

  execute(context: CommandContext): CommandResult {
    const ctx = context as DoorCommandContext;

    if (!ctx.document) {
      return {
        success: false,
        message: "Document not available in context",
      };
    }

    const door = ctx.document.getDoor(this.doorId);
    if (!door) {
      return {
        success: false,
        message: `Door not found: ${this.doorId}`,
      };
    }

    // Lưu vị trí cũ
    this.previousPosition = { ...door.position };

    // Move door - update position and previewBounds
    ctx.document.updateDoor(this.doorId, {
      position: { ...this.newPosition },
      previewBounds: {
        ...door.previewBounds,
        x: this.newPosition.x,
        y: this.newPosition.y,
      },
    });

    return {
      success: true,
      message: `Moved door to (${this.newPosition.x}, ${this.newPosition.y})`,
      data: { doorId: this.doorId, position: this.newPosition },
    };
  }

  undo(context: CommandContext): void {
    const ctx = context as DoorCommandContext;

    if (this.previousPosition && ctx.document) {
      const door = ctx.document.getDoor(this.doorId);
      if (door) {
        ctx.document.updateDoor(this.doorId, {
          position: this.previousPosition,
          previewBounds: {
            ...door.previewBounds,
            x: this.previousPosition.x,
            y: this.previousPosition.y,
          },
        });
      }
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

// ==================== Resize Door Command ====================

/**
 * Command thay đổi kích thước cửa
 */
export class ResizeDoorCommand implements ICommand {
  readonly name = "Resize Door";
  readonly description = "Thay đổi kích thước cửa";
  readonly canUndo = true;

  private previousSize: { width: number; height: number } | null = null;

  constructor(
    private doorId: string,
    private newWidth: number,
    private newHeight: number
  ) {}

  execute(context: CommandContext): CommandResult {
    const ctx = context as DoorCommandContext;

    if (!ctx.document) {
      return {
        success: false,
        message: "Document not available in context",
      };
    }

    const door = ctx.document.getDoor(this.doorId);
    if (!door) {
      return {
        success: false,
        message: `Door not found: ${this.doorId}`,
      };
    }

    // Lưu kích thước cũ
    this.previousSize = {
      width: door.doorInfo.width,
      height: door.doorInfo.height,
    };

    // Resize door
    ctx.document.updateDoor(this.doorId, {
      doorInfo: {
        ...door.doorInfo,
        width: this.newWidth,
        height: this.newHeight,
      },
      previewBounds: {
        ...door.previewBounds,
        width: this.newWidth,
        height: this.newHeight,
      },
    });

    return {
      success: true,
      message: `Resized door to ${this.newWidth}x${this.newHeight}mm`,
      data: {
        doorId: this.doorId,
        width: this.newWidth,
        height: this.newHeight,
      },
    };
  }

  undo(context: CommandContext): void {
    const ctx = context as DoorCommandContext;

    if (this.previousSize && ctx.document) {
      const door = ctx.document.getDoor(this.doorId);
      if (door) {
        ctx.document.updateDoor(this.doorId, {
          doorInfo: {
            ...door.doorInfo,
            width: this.previousSize.width,
            height: this.previousSize.height,
          },
          previewBounds: {
            ...door.previewBounds,
            width: this.previousSize.width,
            height: this.previousSize.height,
          },
        });
      }
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

// ==================== Clone Door Command ====================

/**
 * Command clone cửa - tạo bản sao với ID mới tại vị trí mới
 * RULE 7: Có undo để xóa cửa đã clone
 *
 * Khác với AddDoorCommand:
 * - Clone từ door hiện có (giữ nguyên params/spec)
 * - Áp dụng transform (offset position)
 */
export class CloneDoorCommand implements ICommand {
  readonly name = "Clone Door";
  readonly description = "Clone cửa tại vị trí mới";
  readonly canUndo = true;

  private clonedDoor: DoorEntity | null = null;

  /**
   * @param sourceDoorId - ID của door nguồn để clone
   * @param offsetX - Offset X từ vị trí nguồn
   * @param offsetY - Offset Y từ vị trí nguồn
   */
  constructor(
    private sourceDoorId: string,
    private offsetX: number,
    private offsetY: number
  ) {}

  execute(context: CommandContext): CommandResult {
    const ctx = context as DoorCommandContext;
    console.log(
      "[CloneDoorCommand] execute",
      this.sourceDoorId,
      this.offsetX,
      this.offsetY
    );

    if (!ctx.document) {
      console.log("[CloneDoorCommand] ERROR: Document not available");
      return {
        success: false,
        message: "Document not available in context",
      };
    }

    // Lấy door nguồn
    const sourceDoor = ctx.document.getDoor(this.sourceDoorId);
    console.log("[CloneDoorCommand] sourceDoor:", sourceDoor);
    if (!sourceDoor) {
      return {
        success: false,
        message: `Source door not found: ${this.sourceDoorId}`,
      };
    }

    // Tính vị trí mới
    const newPosition = {
      x: sourceDoor.position.x + this.offsetX,
      y: sourceDoor.position.y + this.offsetY,
    };

    // Clone door qua Factory (tạo ID mới)
    this.clonedDoor = DoorFactory.create({
      variant: sourceDoor.doorInfo.variant,
      systemId: sourceDoor.doorInfo.systemId,
      position: newPosition,
      width: sourceDoor.doorInfo.width,
      height: sourceDoor.doorInfo.height,
      displayName: `${sourceDoor.doorInfo.displayName} (copy)`,
      options: sourceDoor.doorInfo.options,
      // previewTemplateId từ entity, không phải doorInfo
      previewTemplateId: sourceDoor.previewTemplateId,
    });

    // Thêm vào Document (ĐIỀU KIỆN 1)
    ctx.document.addDoor(this.clonedDoor);

    return {
      success: true,
      message: `Cloned door: ${this.clonedDoor.doorInfo.displayName}`,
      data: {
        doorId: this.clonedDoor.id,
        sourceDoorId: this.sourceDoorId,
      },
    };
  }

  undo(context: CommandContext): void {
    const ctx = context as DoorCommandContext;

    if (this.clonedDoor && ctx.document) {
      ctx.document.removeDoor(this.clonedDoor.id);
    }
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }

  /** Lấy door đã clone (để UI có thể sync) */
  getClonedDoor(): DoorEntity | null {
    return this.clonedDoor;
  }
}

/**
 * Command xóa cửa - xóa 1 hoặc nhiều cửa khỏi Document
 * RULE 7: Có undo để khôi phục cửa đã xóa
 *
 * Xóa door từ canvas là cách DUY NHẤT để giảm số lượng trong BOM
 */
export class DeleteDoorCommand implements ICommand {
  readonly name = "Delete Door";
  readonly description = "Xóa cửa khỏi canvas";
  readonly canUndo = true;

  private deletedDoors: DoorEntity[] = [];

  /**
   * @param doorIds - Mảng ID của các door cần xóa
   */
  constructor(private doorIds: string[]) {}

  execute(context: CommandContext): CommandResult {
    const ctx = context as DoorCommandContext;

    if (!ctx.document) {
      return {
        success: false,
        message: "Document not available in context",
      };
    }

    // Lưu lại doors để có thể undo
    this.deletedDoors = [];
    let deletedCount = 0;

    this.doorIds.forEach((doorId) => {
      const door = ctx.document!.getDoor(doorId);
      if (door) {
        // Clone door data để lưu lại cho undo
        this.deletedDoors.push({ ...door });
        ctx.document!.removeDoor(doorId);
        deletedCount++;
      }
    });

    if (deletedCount === 0) {
      return {
        success: false,
        message: "No doors found to delete",
      };
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} door(s)`,
      data: {
        deletedCount,
        doorIds: this.doorIds,
      },
    };
  }

  undo(context: CommandContext): void {
    const ctx = context as DoorCommandContext;

    if (!ctx.document) return;

    // Khôi phục các doors đã xóa
    this.deletedDoors.forEach((door) => {
      ctx.document!.addDoor(door);
    });
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }

  /** Lấy danh sách doors đã xóa (để UI có thể sync) */
  getDeletedDoors(): DoorEntity[] {
    return this.deletedDoors;
  }
}
