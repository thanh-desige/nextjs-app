/**
 * Hinged Door Rules - Luật tính toán cho cửa mở
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: hingedDoor.engine.ts
 * - CHỈ được import từ: systems (đọc data)
 * - KHÔNG được import từ: domain, UI, store, canvas
 */

import type {
  SystemData,
  Profile,
  Accessory,
} from "../../systems/system.types";

/**
 * Luật tính số bản lề theo chiều cao
 */
export function calculateHingeCount(height: number): 2 | 3 | 4 {
  if (height <= 1800) return 2;
  if (height <= 2400) return 3;
  return 4;
}

/**
 * Luật tính số ke góc theo loại
 */
export function calculateCornerBracketCount(
  doorStyle: "single" | "double"
): number {
  // Mỗi khung cần 4 ke góc
  // Frame: 4, Sash: 4 (đơn) hoặc 8 (đôi)
  return doorStyle === "single" ? 8 : 12;
}

/**
 * Luật tính chiều dài ron
 */
export function calculateSealLength(
  width: number,
  height: number,
  doorStyle: "single" | "double"
): number {
  const perimeter = (width + height) * 2;
  // Ron khung bao + ron cánh
  const sashPerimeter =
    doorStyle === "single"
      ? perimeter - 40 // trừ phần khung bao
      : (perimeter - 40) * 2; // 2 cánh

  return perimeter + sashPerimeter;
}

/**
 * Luật tính chiều dài nẹp kính
 */
export function calculateBeadLength(
  glassWidth: number,
  glassHeight: number,
  beadOverlap: number
): number {
  // Chu vi kính + chồng lấn góc
  return (glassWidth + glassHeight) * 2 + beadOverlap * 4;
}

/**
 * Luật chọn profile frame
 */
export function getFrameProfile(system: SystemData): Profile {
  return system.profiles.frame || Object.values(system.profiles)[0];
}

/**
 * Luật chọn profile sash
 */
export function getSashProfile(system: SystemData): Profile {
  return system.profiles.sash || system.profiles.frame;
}

/**
 * Luật chọn profile bead
 */
export function getBeadProfile(system: SystemData): Profile {
  return (
    system.profiles.beadSquare ||
    system.profiles.bead ||
    Object.values(system.profiles).find((p) => p.type === "bead")!
  );
}

/**
 * Luật chọn bản lề
 */
export function getHingeAccessory(
  system: SystemData,
  hingeType: "2d" | "3d"
): Accessory {
  const hingeKey = hingeType === "3d" ? "hinge3d" : "hinge2d";
  return (
    system.accessories[hingeKey] ||
    Object.values(system.accessories).find((a) => a.type === "hinge")!
  );
}

/**
 * Luật chọn khóa
 */
export function getLockAccessory(
  system: SystemData,
  doorStyle: "single" | "double"
): Accessory {
  if (doorStyle === "double") {
    return system.accessories.lockCremon || system.accessories.lockMortise;
  }
  return (
    system.accessories.lockMortise ||
    Object.values(system.accessories).find((a) => a.type === "lock")!
  );
}

/**
 * Luật chọn tay nắm
 */
export function getHandleAccessory(system: SystemData): Accessory {
  return (
    system.accessories.handleLever ||
    Object.values(system.accessories).find((a) => a.type === "handle")!
  );
}

/**
 * Luật chọn ron
 */
export function getSealAccessory(system: SystemData): Accessory {
  return (
    system.accessories.sealRubber ||
    system.accessories.sealWool ||
    Object.values(system.accessories).find((a) => a.type === "seal")!
  );
}

/**
 * Luật chọn ke góc
 */
export function getCornerBracketAccessory(system: SystemData): Accessory {
  return (
    system.accessories.cornerBracket ||
    Object.values(system.accessories).find((a) => a.type === "corner")!
  );
}
