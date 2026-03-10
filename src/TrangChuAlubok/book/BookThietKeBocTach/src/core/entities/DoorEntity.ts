/**
 * Door Entity - Entity cửa trên canvas (DATA ONLY)
 *
 * ⚠️ COMPLIANCE: R5 — Entity chỉ chứa data, không chứa logic
 * - Entity KHÔNG có methods hành vi (setPosition, setSize, clone...)
 * - Entity KHÔNG gọi engine, không tự mutate
 * - Mọi thay đổi đi qua Command + History (R7)
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: DoorFactory, UI, hooks, Commands
 * - KHÔNG được import từ: door-engines, analysis, systems
 */

/**
 * Point interface đơn giản
 */
export interface DoorPoint {
  x: number;
  y: number;
}

/**
 * Loại cửa (domain concept, không phải engine)
 */
export type DoorVariant =
  | "hinged-single" // Cửa đơn mở quay
  | "hinged-double" // Cửa đôi mở quay
  | "sliding-2p" // Cửa trượt 2 cánh
  | "sliding-4p" // Cửa trượt 4 cánh
  | "fixed" // Cửa sổ fix
  | "awning" // Cửa sổ hất
  | "casement"; // Cửa sổ mở quay

/**
 * Thông tin cửa cơ bản (UI level)
 */
export interface DoorInfo {
  /** Tên hiển thị */
  displayName: string;

  /** Loại cửa */
  variant: DoorVariant;

  /** ID hệ (vd: 'xf55', 'pma55') - CHỈ LƯU ID, KHÔNG ĐỌC DATA */
  systemId: string;

  /** Chiều rộng (mm) */
  width: number;

  /** Chiều cao (mm) */
  height: number;

  /** Tùy chọn bổ sung (truyền cho engine khi cần) */
  options?: Record<string, unknown>;
}

/**
 * Engine output status
 */
export type EngineOutputStatus = "none" | "generated" | "outdated";

/**
 * Tham chiếu đến engine output (nếu đã chạy engine)
 * COMPLIANCE: E1 - engineOutputRef/engineOutputId + status
 */
export interface EngineOutputRef {
  /** ID của engine output */
  outputId: string;

  /** Timestamp chạy engine */
  generatedAt: number;

  /** Status: none | generated | outdated */
  status: EngineOutputStatus;
}

/**
 * Bounding box cho preview (UI-only)
 * COMPLIANCE: R6 - Preview chỉ để nhìn, không dùng cho tính toán
 */
export interface DoorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Door Entity Data - Cửa trên canvas (DATA ONLY - No behavior)
 *
 * COMPLIANCE:
 * - R5: Entity chỉ chứa data, không chứa logic
 * - E1: DoorEntity schema tối thiểu (data-only)
 * - R6: previewBounds chỉ dùng render & thao tác UI
 *
 * CHÚ Ý: Entity này CHỈ lưu thông tin để render preview
 * KHÔNG chứa geometry chi tiết hay BOM (Rule 4, Rule 2)
 */
export interface DoorEntityData {
  /** ID duy nhất */
  readonly id: string;

  /** Loại entity */
  readonly type: "door";

  /** Vị trí trên canvas */
  position: DoorPoint;

  /** Góc xoay (degrees) */
  rotation: number;

  /** Scale */
  scale: { x: number; y: number };

  /** Thông tin cửa */
  doorInfo: DoorInfo;

  /** Tham chiếu đến engine output (nếu đã chạy) */
  engineOutputRef: EngineOutputRef | null;

  /** Preview geometry đơn giản (bounding box) - UI ONLY */
  previewBounds: DoorBounds;

  /**
   * ID của preview template (optional)
   *
   * ⚠️ PREVIEW_CONTRACT: CHỈ LƯU ID STRING, KHÔNG LOAD JSON
   * ⚠️ KHÔNG dùng cho geometry/BOM/material/cost
   * ⚠️ Chỉ dùng để lookup preview khi render (via previewRegistry)
   *
   * Nếu undefined → dùng fallback renderer (DoorRendererDetailed)
   */
  previewTemplateId?: string;

  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

/**
 * Tạo DoorEntityData mới
 * Factory function thay vì class constructor
 */
export function createDoorEntityData(
  id: string,
  position: DoorPoint,
  doorInfo: DoorInfo
): DoorEntityData {
  const now = Date.now();
  return {
    id,
    type: "door",
    position: { ...position },
    rotation: 0,
    scale: { x: 1, y: 1 },
    doorInfo: { ...doorInfo },
    engineOutputRef: null,
    previewBounds: {
      x: position.x,
      y: position.y,
      width: doorInfo.width,
      height: doorInfo.height,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Serialize DoorEntityData to JSON
 */
export function doorEntityToJSON(entity: DoorEntityData): object {
  return {
    id: entity.id,
    type: entity.type,
    position: entity.position,
    rotation: entity.rotation,
    scale: entity.scale,
    doorInfo: entity.doorInfo,
    engineOutputRef: entity.engineOutputRef,
    previewBounds: entity.previewBounds,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

/**
 * Deserialize DoorEntityData from JSON
 */
export function doorEntityFromJSON(
  data: Record<string, unknown>
): DoorEntityData {
  return {
    id: data.id as string,
    type: "door",
    position: data.position as DoorPoint,
    rotation: (data.rotation as number) || 0,
    scale: (data.scale as { x: number; y: number }) || { x: 1, y: 1 },
    doorInfo: data.doorInfo as DoorInfo,
    engineOutputRef: (data.engineOutputRef as EngineOutputRef) || null,
    previewBounds: data.previewBounds as DoorBounds,
    createdAt: (data.createdAt as number) || Date.now(),
    updatedAt: (data.updatedAt as number) || Date.now(),
  };
}

// ==================== BACKWARD COMPATIBILITY ====================
// TODO: Remove after migration complete

/**
 * @deprecated Use DoorEntityData interface instead
 * This class is kept for backward compatibility during migration
 */
export class DoorEntity implements DoorEntityData {
  readonly id: string;
  readonly type = "door" as const;
  position: DoorPoint;
  rotation: number = 0;
  scale: { x: number; y: number } = { x: 1, y: 1 };
  doorInfo: DoorInfo;
  engineOutputRef: EngineOutputRef | null = null;
  previewBounds: DoorBounds;
  /** ID của template (để lookup SVG thumbnail) */
  previewTemplateId?: string;
  createdAt: number;
  updatedAt: number;

  constructor(id: string, position: DoorPoint, doorInfo: DoorInfo) {
    this.id = id;
    this.position = { ...position };
    this.doorInfo = { ...doorInfo };
    this.previewBounds = {
      x: position.x,
      y: position.y,
      width: doorInfo.width,
      height: doorInfo.height,
    };
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  // NOTE: Không có methods logic - tuân thủ R5
  // Mọi thay đổi qua Commands (R7)
}
