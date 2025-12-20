/**
 * Analysis Module - Phân tích & Bóc tách
 *
 * Module này cung cấp các chức năng:
 * - Bóc tách khối lượng nhôm (ProfileMapping, AluminumCalculator)
 * - Bóc tách khối lượng kính (GlassCalculator)
 * - Tối ưu cắt vật liệu (cut optimization)
 * - Xuất báo cáo bóc tách
 */

// Types
export * from "./Quantity.types";

// Profile Mapping
export { ProfileMapping, profileMapping } from "./ProfileMapping";

// Aluminum Calculator
export { AluminumCalculator, aluminumCalculator } from "./AluminumCalculator";

// Glass Calculator
export { GlassCalculator, glassCalculator } from "./GlassCalculator";

// Quantity Engine (main entry point)
export { QuantityEngine, quantityEngine } from "./QuantityEngine";
export type { DoorInfo } from "./QuantityEngine";
