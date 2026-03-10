/**
 * Preview Adapters - Export công khai
 *
 * ⚠️ PREVIEW_CONTRACT:
 * - Preview CHỈ dùng cho UI render
 * - KHÔNG dùng cho geometry/BOM/material/cost
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: ui/, hooks/
 * - KHÔNG được import từ: door-engines/, analysis/, domain/
 */

// Renderer
export {
  PreviewRenderer,
  hasPreviewData,
  loadPreviewData,
  hasStoredPreview,
} from "./PreviewRenderer";
export type { PreviewRendererProps } from "./PreviewRenderer";

// Registry
export { previewRegistry, getPreview, hasPreview } from "./previewRegistry";
export type { PreviewRegistry } from "./previewRegistry";
