/**
 * Hinged Door Types - Types riêng cho cửa mở
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: hingedDoor.engine.ts, hingedDoor.rules.ts
 * - KHÔNG được import từ: domain, UI, store, canvas
 */

import type { DoorEngineOptions } from "../base/Engine.types";

/**
 * Options mở rộng cho cửa mở
 */
export interface HingedDoorOptions extends DoorEngineOptions {
  /** Hướng mở */
  openDirection: "left" | "right";

  /** Mở vào trong hay ra ngoài */
  openInward: boolean;

  /** Loại cửa: đơn hay đôi */
  doorStyle: "single" | "double";

  /** Có đố ngang phía trên không */
  hasTopTransom: boolean;

  /** Chiều cao đố ngang (mm) */
  transomHeight?: number;

  /** Loại bản lề */
  hingeType: "2d" | "3d";

  /** Số bản lề */
  hingeCount: 2 | 3 | 4;
}

/**
 * Cấu hình mặc định cho cửa mở đơn
 */
export const DEFAULT_HINGED_SINGLE_OPTIONS: HingedDoorOptions = {
  openDirection: "left",
  openInward: true,
  doorStyle: "single",
  hasTopTransom: false,
  hingeType: "3d",
  hingeCount: 3,
  glassThickness: 8,
  glassType: "tempered",
};

/**
 * Cấu hình mặc định cho cửa mở đôi
 */
export const DEFAULT_HINGED_DOUBLE_OPTIONS: HingedDoorOptions = {
  openDirection: "left",
  openInward: true,
  doorStyle: "double",
  hasTopTransom: false,
  hingeType: "3d",
  hingeCount: 3,
  glassThickness: 10,
  glassType: "tempered",
};
