/**
 * System Loader - Đọc dữ liệu hãng/hệ từ JSON
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Chỉ được gọi bởi door-engines
 * - KHÔNG được import từ: domain, UI, store, canvas, analysis
 */

import type { SystemData } from "./system.types";

// Import tĩnh các file JSON (để Next.js bundle)
import xf55Data from "./xingfa/xf55.json";
import xf93Data from "./xingfa/xf93.json";
import pma55Data from "./pma/pma55.json";

/**
 * Registry của tất cả systems
 */
const systemRegistry: Record<string, SystemData> = {
  xf55: xf55Data as SystemData,
  xf93: xf93Data as SystemData,
  pma55: pma55Data as SystemData,
};

/**
 * Load system data theo ID
 * @param systemId - ID của hệ (vd: 'xf55', 'pma55')
 * @returns SystemData hoặc null nếu không tìm thấy
 */
export function loadSystem(systemId: string): SystemData | null {
  const system = systemRegistry[systemId];
  if (!system) {
    console.warn(`[SystemLoader] System "${systemId}" not found`);
    return null;
  }
  return system;
}

/**
 * Lấy danh sách tất cả systems khả dụng
 * @returns Danh sách {id, name, brand}
 */
export function getAvailableSystems(): Array<{
  id: string;
  name: string;
  brand: string;
}> {
  return Object.values(systemRegistry).map((system) => ({
    id: system.id,
    name: system.name,
    brand: system.brand,
  }));
}

/**
 * Kiểm tra system có tồn tại không
 * @param systemId - ID của hệ
 */
export function systemExists(systemId: string): boolean {
  return systemId in systemRegistry;
}

/**
 * Lấy danh sách systems theo hãng
 * @param brand - Tên hãng (vd: 'Xingfa', 'PMA')
 */
export function getSystemsByBrand(brand: string): SystemData[] {
  return Object.values(systemRegistry).filter(
    (system) => system.brand.toLowerCase() === brand.toLowerCase()
  );
}
