/**
 * Osnap Types - Object Snap Types cho CAD
 */

import { IVec2 } from "../geometry/Vec2";
import { IEntity } from "../entities/Entity.types";

// ==================== Osnap Mode Enum ====================

export enum OsnapMode {
  NONE = 0,
  ENDPOINT = 1 << 0, // Điểm cuối
  MIDPOINT = 1 << 1, // Điểm giữa
  CENTER = 1 << 2, // Tâm (circle, arc)
  NODE = 1 << 3, // Điểm node
  QUADRANT = 1 << 4, // Điểm góc phần tư (circle)
  INTERSECTION = 1 << 5, // Giao điểm
  INSERTION = 1 << 6, // Điểm chèn (block, text)
  PERPENDICULAR = 1 << 7, // Vuông góc
  TANGENT = 1 << 8, // Tiếp tuyến
  NEAREST = 1 << 9, // Điểm gần nhất
  APPARENT = 1 << 10, // Giao điểm ảo
  PARALLEL = 1 << 11, // Song song
  EXTENSION = 1 << 12, // Kéo dài

  // Common combinations
  ALL = 0xffff,
  BASIC = ENDPOINT | MIDPOINT | CENTER | INTERSECTION,
  GEOMETRIC = ENDPOINT | MIDPOINT | CENTER | QUADRANT | INTERSECTION,
}

// ==================== Osnap Result ====================

export interface OsnapResult {
  /** Điểm snap */
  point: IVec2;
  /** Loại snap */
  mode: OsnapMode;
  /** Entity liên quan */
  entity?: IEntity;
  /** Entity thứ 2 (cho intersection) */
  entity2?: IEntity;
  /** Khoảng cách từ cursor đến snap point */
  distance: number;
  /** Mô tả */
  description: string;
}

// ==================== Osnap Settings ====================

export interface OsnapSettings {
  /** Các mode được bật */
  enabledModes: OsnapMode;
  /** Aperture size (pixel) - vùng tìm kiếm */
  apertureSize: number;
  /** Osnap có bật không */
  enabled: boolean;
  /** Hiển thị marker */
  showMarker: boolean;
  /** Hiển thị tooltip */
  showTooltip: boolean;
}

export const DEFAULT_OSNAP_SETTINGS: OsnapSettings = {
  enabledModes: OsnapMode.BASIC,
  apertureSize: 10,
  enabled: true,
  showMarker: true,
  showTooltip: true,
};

// ==================== Osnap Marker Styles ====================

export interface OsnapMarkerStyle {
  color: string;
  size: number;
  lineWidth: number;
}

export const OSNAP_MARKER_STYLES: Record<OsnapMode, OsnapMarkerStyle> = {
  [OsnapMode.NONE]: { color: "#FFFF00", size: 8, lineWidth: 1 },
  [OsnapMode.ENDPOINT]: { color: "#00FF00", size: 8, lineWidth: 2 },
  [OsnapMode.MIDPOINT]: { color: "#00FF00", size: 8, lineWidth: 2 },
  [OsnapMode.CENTER]: { color: "#00FF00", size: 10, lineWidth: 2 },
  [OsnapMode.NODE]: { color: "#00FF00", size: 6, lineWidth: 2 },
  [OsnapMode.QUADRANT]: { color: "#00FF00", size: 8, lineWidth: 2 },
  [OsnapMode.INTERSECTION]: { color: "#FF00FF", size: 10, lineWidth: 2 },
  [OsnapMode.INSERTION]: { color: "#00FFFF", size: 8, lineWidth: 2 },
  [OsnapMode.PERPENDICULAR]: { color: "#FF00FF", size: 10, lineWidth: 2 },
  [OsnapMode.TANGENT]: { color: "#FF00FF", size: 10, lineWidth: 2 },
  [OsnapMode.NEAREST]: { color: "#FFFF00", size: 8, lineWidth: 1 },
  [OsnapMode.APPARENT]: { color: "#FF00FF", size: 10, lineWidth: 2 },
  [OsnapMode.PARALLEL]: { color: "#00FFFF", size: 10, lineWidth: 2 },
  [OsnapMode.EXTENSION]: { color: "#00FFFF", size: 8, lineWidth: 1 },
  [OsnapMode.ALL]: { color: "#FFFF00", size: 8, lineWidth: 1 },
  [OsnapMode.BASIC]: { color: "#00FF00", size: 8, lineWidth: 2 },
  [OsnapMode.GEOMETRIC]: { color: "#00FF00", size: 8, lineWidth: 2 },
};

// ==================== Osnap Mode Names ====================

export const OSNAP_MODE_NAMES: Record<OsnapMode, string> = {
  [OsnapMode.NONE]: "None",
  [OsnapMode.ENDPOINT]: "Endpoint",
  [OsnapMode.MIDPOINT]: "Midpoint",
  [OsnapMode.CENTER]: "Center",
  [OsnapMode.NODE]: "Node",
  [OsnapMode.QUADRANT]: "Quadrant",
  [OsnapMode.INTERSECTION]: "Intersection",
  [OsnapMode.INSERTION]: "Insertion",
  [OsnapMode.PERPENDICULAR]: "Perpendicular",
  [OsnapMode.TANGENT]: "Tangent",
  [OsnapMode.NEAREST]: "Nearest",
  [OsnapMode.APPARENT]: "Apparent Intersection",
  [OsnapMode.PARALLEL]: "Parallel",
  [OsnapMode.EXTENSION]: "Extension",
  [OsnapMode.ALL]: "All",
  [OsnapMode.BASIC]: "Basic",
  [OsnapMode.GEOMETRIC]: "Geometric",
};

// ==================== Helper Functions ====================

export function isModeEnabled(
  settings: OsnapSettings,
  mode: OsnapMode
): boolean {
  return (settings.enabledModes & mode) !== 0;
}

export function toggleMode(
  settings: OsnapSettings,
  mode: OsnapMode
): OsnapSettings {
  return {
    ...settings,
    enabledModes: settings.enabledModes ^ mode,
  };
}

export function enableMode(
  settings: OsnapSettings,
  mode: OsnapMode
): OsnapSettings {
  return {
    ...settings,
    enabledModes: settings.enabledModes | mode,
  };
}

export function disableMode(
  settings: OsnapSettings,
  mode: OsnapMode
): OsnapSettings {
  return {
    ...settings,
    enabledModes: settings.enabledModes & ~mode,
  };
}
