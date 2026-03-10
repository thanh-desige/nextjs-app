/**
 * Preview Registry - Stub registry cho Door Preview Data
 *
 * ⚠️ STUB IMPLEMENTATION - Trả về null cho mọi lookup
 * Full implementation sẽ load từ static JSON files (giai đoạn sau)
 *
 * ⚠️ PREVIEW_CONTRACT:
 * - Preview CHỈ dùng cho UI render
 * - KHÔNG dùng cho geometry/BOM/material/cost
 * - door-engines/ và analysis/ KHÔNG được import module này
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Import từ: types/DoorPreviewData
 * - Được import bởi: ui/, adapters/preview/
 * - KHÔNG được import từ: door-engines/, analysis/, domain/
 */

import type { DoorPreviewData } from "../../types/DoorPreviewData";

// ==================== TYPES ====================

export interface PreviewRegistry {
  /**
   * Lấy preview data theo template ID
   * @returns DoorPreviewData | null
   *
   * ⚠️ STUB: Hiện tại trả về null
   * ⚠️ Implementation sau sẽ load từ static JSON
   */
  get(templateId: string): DoorPreviewData | null;

  /**
   * Kiểm tra có preview không
   */
  has(templateId: string): boolean;

  /**
   * Đăng ký preview (chỉ dùng trong admin mode - giai đoạn sau)
   */
  register(templateId: string, data: DoorPreviewData): void;

  /**
   * Xóa preview (chỉ dùng trong admin mode - giai đoạn sau)
   */
  unregister(templateId: string): void;

  /**
   * Lấy tất cả template IDs đã đăng ký
   */
  listIds(): string[];
}

// ==================== STUB IMPLEMENTATION ====================

/**
 * In-memory store (chỉ dùng khi development/admin mode)
 * Production sẽ load từ static files
 */
const _store = new Map<string, DoorPreviewData>();

/**
 * Stub implementation của PreviewRegistry
 */
const previewRegistryImpl: PreviewRegistry = {
  get(templateId: string): DoorPreviewData | null {
    // STUB: Trả về từ memory store nếu có, null nếu không
    const data = _store.get(templateId);
    if (data) {
      return data;
    }

    // TODO: Giai đoạn sau sẽ load từ static JSON
    // const staticData = loadStaticPreview(templateId);
    // if (staticData) return staticData;

    // Log để debug
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[previewRegistry] No preview found for templateId: ${templateId}`
      );
    }

    return null;
  },

  has(templateId: string): boolean {
    return _store.has(templateId);
    // TODO: Giai đoạn sau sẽ check cả static files
  },

  register(templateId: string, data: DoorPreviewData): void {
    // Validate data
    if (!data || !data.id || data.version !== "1.0") {
      console.warn(
        `[previewRegistry] Invalid preview data for templateId: ${templateId}`
      );
      return;
    }

    _store.set(templateId, data);

    if (process.env.NODE_ENV === "development") {
      console.debug(`[previewRegistry] Registered preview: ${templateId}`);
    }
  },

  unregister(templateId: string): void {
    _store.delete(templateId);

    if (process.env.NODE_ENV === "development") {
      console.debug(`[previewRegistry] Unregistered preview: ${templateId}`);
    }
  },

  listIds(): string[] {
    return Array.from(_store.keys());
    // TODO: Giai đoạn sau sẽ merge với static files
  },
};

// ==================== EXPORTS ====================

/**
 * Singleton instance của PreviewRegistry
 */
export const previewRegistry: PreviewRegistry = previewRegistryImpl;

/**
 * Convenience function: get preview
 */
export function getPreview(templateId: string): DoorPreviewData | null {
  return previewRegistry.get(templateId);
}

/**
 * Convenience function: check if preview exists
 */
export function hasPreview(templateId: string): boolean {
  return previewRegistry.has(templateId);
}

// ==================== DEBUG HELPERS ====================

/**
 * Clear all registered previews (chỉ dùng trong testing)
 */
export function _clearAllPreviews(): void {
  _store.clear();
}

/**
 * Get store size (chỉ dùng trong testing/debugging)
 */
export function _getStoreSize(): number {
  return _store.size;
}
