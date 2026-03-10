/**
 * Systems Module - Barrel Export
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Chỉ được đọc bởi door-engines
 * - KHÔNG được import từ: domain, UI, store, canvas, analysis
 */

// Re-export types
export type {
  SystemData,
  Profile,
  Accessory,
  GlassConfig,
  Constraints,
} from "./system.types";

// System loader utility
export { loadSystem, getAvailableSystems } from "./systemLoader";
