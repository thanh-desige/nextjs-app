/**
 * Door Factory - Tạo DoorEntity cho canvas
 *
 * ⚠️ COMPLIANCE: R5 — Factory tạo entity, không gọi methods trên entity
 * - Entity chỉ chứa data, không có logic methods
 * - Factory tự xây dựng data thay vì gọi entity.setXxx()
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: UI, hooks, Commands
 * - KHÔNG được import từ: door-engines, analysis, systems
 */

import {
  DoorEntity,
  type DoorInfo,
  type DoorVariant,
  type DoorPoint,
} from "../../core/entities/DoorEntity";

// Use DoorPoint from DoorEntity
type Point = DoorPoint;

/**
 * Input để tạo DoorEntity
 */
export interface CreateDoorInput {
  /** Tên hiển thị */
  displayName?: string;

  /** Loại cửa */
  variant: DoorVariant;

  /** ID hệ cửa */
  systemId: string;

  /** Chiều rộng (mm) */
  width: number;

  /** Chiều cao (mm) */
  height: number;

  /** Vị trí trên canvas */
  position: Point;

  /** Tùy chọn bổ sung */
  options?: Record<string, unknown>;

  /** ID của template (để lookup SVG thumbnail) */
  previewTemplateId?: string;
}

/**
 * Sinh ID duy nhất cho door entity
 */
function generateDoorId(): string {
  return `door_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .substring(2, 6)}`;
}

/**
 * Tên hiển thị mặc định theo loại
 */
const DEFAULT_NAMES: Record<DoorVariant, string> = {
  "hinged-single": "Cửa đơn mở quay",
  "hinged-double": "Cửa đôi mở quay",
  "sliding-2p": "Cửa trượt 2 cánh",
  "sliding-4p": "Cửa trượt 4 cánh",
  fixed: "Cửa sổ fix",
  awning: "Cửa sổ hất",
  casement: "Cửa sổ mở",
};

/**
 * Kích thước mặc định theo loại (mm)
 */
const DEFAULT_SIZES: Record<DoorVariant, { width: number; height: number }> = {
  "hinged-single": { width: 900, height: 2100 },
  "hinged-double": { width: 1800, height: 2100 },
  "sliding-2p": { width: 2000, height: 2100 },
  "sliding-4p": { width: 4000, height: 2100 },
  fixed: { width: 1200, height: 1400 },
  awning: { width: 800, height: 600 },
  casement: { width: 600, height: 1200 },
};

/**
 * Door Factory
 */
export class DoorFactory {
  /**
   * Tạo DoorEntity mới
   */
  static create(input: CreateDoorInput): DoorEntity {
    const id = generateDoorId();

    const doorInfo: DoorInfo = {
      displayName: input.displayName || DEFAULT_NAMES[input.variant],
      variant: input.variant,
      systemId: input.systemId,
      width: input.width,
      height: input.height,
      options: input.options,
    };

    const entity = new DoorEntity(id, input.position, doorInfo);
    // Set previewTemplateId nếu có
    if (input.previewTemplateId) {
      entity.previewTemplateId = input.previewTemplateId;
    }
    return entity;
  }

  /**
   * Tạo DoorEntity với kích thước mặc định
   */
  static createWithDefaults(
    variant: DoorVariant,
    systemId: string,
    position: Point
  ): DoorEntity {
    const defaults = DEFAULT_SIZES[variant];

    return this.create({
      variant,
      systemId,
      position,
      width: defaults.width,
      height: defaults.height,
    });
  }

  /**
   * Clone một DoorEntity
   * R5 COMPLIANT: Không gọi methods trên entity, tự tạo data mới
   */
  static clone(source: DoorEntity, newPosition?: Point): DoorEntity {
    // R5: Tạo entity mới với data copy, không gọi source.clone()
    return this.create({
      variant: source.doorInfo.variant,
      systemId: source.doorInfo.systemId,
      position: newPosition || { ...source.position },
      width: source.doorInfo.width,
      height: source.doorInfo.height,
      displayName: `${source.doorInfo.displayName} (copy)`,
      options: source.doorInfo.options
        ? { ...source.doorInfo.options }
        : undefined,
    });
  }

  /**
   * Lấy kích thước mặc định cho loại cửa
   */
  static getDefaultSize(variant: DoorVariant): {
    width: number;
    height: number;
  } {
    return { ...DEFAULT_SIZES[variant] };
  }

  /**
   * Lấy tên mặc định cho loại cửa
   */
  static getDefaultName(variant: DoorVariant): string {
    return DEFAULT_NAMES[variant];
  }

  /**
   * Lấy tất cả loại cửa khả dụng
   */
  static getAllVariants(): {
    variant: DoorVariant;
    name: string;
    defaultSize: { width: number; height: number };
  }[] {
    return (Object.keys(DEFAULT_NAMES) as DoorVariant[]).map((variant) => ({
      variant,
      name: DEFAULT_NAMES[variant],
      defaultSize: DEFAULT_SIZES[variant],
    }));
  }
}
