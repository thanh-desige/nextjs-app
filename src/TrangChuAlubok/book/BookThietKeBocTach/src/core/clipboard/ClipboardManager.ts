/**
 * ClipboardManager - Quản lý clipboard cho CAD entities
 *
 * Lưu trữ entities đã copy và cung cấp chức năng paste
 * Theo nguyên tắc: Commands là nơi DUY NHẤT thay đổi Canvas
 */

import { CadEntity } from "../../ui/canvas/CadDrawingCanvas";
import { DoorEntity } from "../entities/DoorEntity";

export interface ClipboardData {
  /** Entities được copy (deep clone) */
  entities: CadEntity[];
  /** Doors được copy (deep clone) */
  doors: DoorEntity[];
  /** Thời điểm copy */
  timestamp: number;
  /** Điểm gốc (base point) để tính offset khi paste */
  basePoint: { x: number; y: number };
}

/**
 * Singleton ClipboardManager
 */
class ClipboardManagerClass {
  private static instance: ClipboardManagerClass;
  private clipboard: ClipboardData | null = null;

  private constructor() {}

  static getInstance(): ClipboardManagerClass {
    if (!ClipboardManagerClass.instance) {
      ClipboardManagerClass.instance = new ClipboardManagerClass();
    }
    return ClipboardManagerClass.instance;
  }

  /**
   * Copy entities vào clipboard
   * @param entities - Các CAD entities cần copy
   * @param doors - Các Door entities cần copy
   * @param basePoint - Điểm gốc (thường là center của selection)
   */
  copy(
    entities: CadEntity[],
    doors: DoorEntity[],
    basePoint?: { x: number; y: number }
  ): void {
    // Deep clone entities
    const clonedEntities: CadEntity[] = entities.map((e) => ({
      ...e,
      id: "", // Sẽ được tạo mới khi paste
      points: e.points.map((p) => ({ ...p })),
    }));

    // Deep clone doors (manual clone since DoorEntity has no clone method - R5 compliant)
    const clonedDoors: DoorEntity[] = doors.map((d) => {
      const clone = new DoorEntity(
        "", // Sẽ được tạo mới khi paste
        { x: d.position.x, y: d.position.y },
        {
          displayName: d.doorInfo.displayName,
          variant: d.doorInfo.variant,
          systemId: d.doorInfo.systemId,
          width: d.doorInfo.width,
          height: d.doorInfo.height,
          options: d.doorInfo.options ? { ...d.doorInfo.options } : undefined,
        }
      );
      clone.rotation = d.rotation;
      clone.scale = { ...d.scale };
      clone.previewTemplateId = d.previewTemplateId;
      return clone;
    });

    // Tính base point nếu không được cung cấp
    let calculatedBasePoint = basePoint;
    if (!calculatedBasePoint) {
      calculatedBasePoint = this.calculateCenter(entities, doors);
    }

    this.clipboard = {
      entities: clonedEntities,
      doors: clonedDoors,
      timestamp: Date.now(),
      basePoint: calculatedBasePoint,
    };
  }

  /**
   * Lấy dữ liệu từ clipboard để paste
   * @param targetPoint - Điểm đích để paste
   * @returns Dữ liệu đã được offset theo targetPoint
   */
  paste(targetPoint: { x: number; y: number }): ClipboardData | null {
    if (!this.clipboard) return null;

    const offsetX = targetPoint.x - this.clipboard.basePoint.x;
    const offsetY = targetPoint.y - this.clipboard.basePoint.y;

    // Clone và offset entities
    const offsetEntities: CadEntity[] = this.clipboard.entities.map((e) => ({
      ...e,
      id: this.generateId(),
      points: e.points.map((p) => ({
        x: p.x + offsetX,
        y: p.y + offsetY,
      })),
    }));

    // Clone và offset doors (manual clone - R5 compliant)
    const offsetDoors: DoorEntity[] = this.clipboard.doors.map((d) => {
      const clone = new DoorEntity(
        this.generateId(),
        {
          x: d.position.x + offsetX,
          y: d.position.y + offsetY,
        },
        {
          displayName: d.doorInfo.displayName,
          variant: d.doorInfo.variant,
          systemId: d.doorInfo.systemId,
          width: d.doorInfo.width,
          height: d.doorInfo.height,
          options: d.doorInfo.options ? { ...d.doorInfo.options } : undefined,
        }
      );
      clone.rotation = d.rotation;
      clone.scale = { ...d.scale };
      clone.previewTemplateId = d.previewTemplateId;
      return clone;
    });

    return {
      entities: offsetEntities,
      doors: offsetDoors,
      timestamp: Date.now(),
      basePoint: targetPoint,
    };
  }

  /**
   * Kiểm tra clipboard có dữ liệu không
   */
  hasData(): boolean {
    return (
      this.clipboard !== null &&
      (this.clipboard.entities.length > 0 || this.clipboard.doors.length > 0)
    );
  }

  /**
   * Lấy số lượng items trong clipboard
   */
  getCount(): { entities: number; doors: number } {
    if (!this.clipboard) return { entities: 0, doors: 0 };
    return {
      entities: this.clipboard.entities.length,
      doors: this.clipboard.doors.length,
    };
  }

  /**
   * Xóa clipboard
   */
  clear(): void {
    this.clipboard = null;
  }

  /**
   * Tính center point của selection
   */
  private calculateCenter(
    entities: CadEntity[],
    doors: DoorEntity[]
  ): { x: number; y: number } {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // Entities bounds
    for (const entity of entities) {
      for (const point of entity.points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }

    // Doors bounds
    for (const door of doors) {
      const pos = door.position;
      const w = door.doorInfo.width;
      const h = door.doorInfo.height;
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + w);
      maxY = Math.max(maxY, pos.y + h);
    }

    if (minX === Infinity) {
      return { x: 0, y: 0 };
    }

    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const ClipboardManager = ClipboardManagerClass.getInstance();
export default ClipboardManager;
