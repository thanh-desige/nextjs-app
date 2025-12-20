/**
 * Quantity.types.ts
 * Type definitions cho module Phân tích - Bóc tách
 *
 * Module này định nghĩa các types cho:
 * - Bóc tách khối lượng nhôm
 * - Bóc tách khối lượng kính
 * - Mapping profile với cấu kiện
 */

// ============================================
// ENUMS
// ============================================

export enum MaterialType {
  ALUMINUM = "aluminum",
  GLASS = "glass",
  ACCESSORY = "accessory",
  SEALANT = "sealant",
  OTHER = "other",
}

export enum ProfileCategory {
  FRAME = "frame", // Khung chính
  SASH = "sash", // Cánh
  MULLION = "mullion", // Thanh đố đứng
  TRANSOM = "transom", // Thanh đố ngang
  BEAD = "bead", // Nẹp kính
  THRESHOLD = "threshold", // Ngưỡng cửa
  OTHER = "other",
}

export enum CutType {
  MITER_45 = "miter_45", // Cắt góc 45°
  MITER_90 = "miter_90", // Cắt vuông 90°
  CUSTOM = "custom", // Góc tùy chỉnh
}

export enum GlassType {
  SINGLE = "single", // Kính đơn
  LAMINATED = "laminated", // Kính dán
  TEMPERED = "tempered", // Kính cường lực
  INSULATED = "insulated", // Kính hộp
  LOW_E = "low_e", // Kính Low-E
}

// ============================================
// PROFILE & ALUMINUM TYPES
// ============================================

export interface ProfileSpec {
  /** Mã profile (VD: "XF55-01") */
  code: string;
  /** Tên profile */
  name: string;
  /** Hệ profile (VD: "XingFa 55", "PMI 65") */
  system: string;
  /** Loại cấu kiện */
  category: ProfileCategory;
  /** Trọng lượng (kg/m) */
  weightPerMeter: number;
  /** Giá (VND/m) */
  pricePerMeter: number;
  /** Chiều dài thanh nguyên (mm) */
  standardLength: number;
  /** Màu sắc có sẵn */
  availableColors: string[];
}

export interface ProfileCut {
  /** Profile được sử dụng */
  profile: ProfileSpec;
  /** Chiều dài cắt (mm) */
  length: number;
  /** Số lượng thanh */
  quantity: number;
  /** Kiểu cắt đầu 1 */
  cutType1: CutType;
  /** Kiểu cắt đầu 2 */
  cutType2: CutType;
  /** Góc cắt tùy chỉnh (nếu có) */
  customAngle1?: number;
  customAngle2?: number;
  /** Ghi chú */
  note?: string;
}

export interface AluminumQuantity {
  /** ID của entity liên quan */
  entityId: string;
  /** Loại cửa/vách */
  doorType: string;
  /** Danh sách thanh cắt */
  cuts: ProfileCut[];
  /** Tổng trọng lượng (kg) */
  totalWeight: number;
  /** Tổng giá vật liệu (VND) */
  totalPrice: number;
}

// ============================================
// GLASS TYPES
// ============================================

export interface GlassSpec {
  /** Loại kính */
  type: GlassType;
  /** Độ dày (mm) */
  thickness: number;
  /** Màu kính */
  color: string;
  /** Giá (VND/m²) */
  pricePerSqm: number;
  /** Trọng lượng (kg/m²) */
  weightPerSqm: number;
}

export interface GlassPiece {
  /** Kính sử dụng */
  glass: GlassSpec;
  /** Chiều rộng (mm) */
  width: number;
  /** Chiều cao (mm) */
  height: number;
  /** Số lượng */
  quantity: number;
  /** Diện tích (m²) */
  area: number;
  /** Ghi chú */
  note?: string;
}

export interface GlassQuantity {
  /** ID của entity liên quan */
  entityId: string;
  /** Danh sách tấm kính */
  pieces: GlassPiece[];
  /** Tổng diện tích (m²) */
  totalArea: number;
  /** Tổng trọng lượng (kg) */
  totalWeight: number;
  /** Tổng giá (VND) */
  totalPrice: number;
}

// ============================================
// QUANTITY RESULT
// ============================================

export interface QuantityResult {
  /** Timestamp tính toán */
  calculatedAt: Date;
  /** Danh sách bóc tách nhôm */
  aluminum: AluminumQuantity[];
  /** Danh sách bóc tách kính */
  glass: GlassQuantity[];
  /** Tổng hợp */
  summary: QuantitySummary;
}

export interface QuantitySummary {
  /** Tổng trọng lượng nhôm (kg) */
  totalAluminumWeight: number;
  /** Tổng giá nhôm (VND) */
  totalAluminumPrice: number;
  /** Tổng diện tích kính (m²) */
  totalGlassArea: number;
  /** Tổng giá kính (VND) */
  totalGlassPrice: number;
  /** Tổng giá vật liệu (VND) */
  totalMaterialPrice: number;
}

// ============================================
// PROFILE MAPPING
// ============================================

export interface ProfileMappingRule {
  /** ID rule */
  id: string;
  /** Loại cửa áp dụng */
  doorType: string;
  /** Vị trí cấu kiện */
  position: ProfileCategory;
  /** Profile được gán */
  profileCode: string;
  /** Công thức tính chiều dài (expression) */
  lengthFormula: string;
  /** Công thức tính số lượng */
  quantityFormula: string;
  /** Điều kiện áp dụng (optional) */
  condition?: string;
}

export interface ProfileMappingConfig {
  /** Hệ profile mặc định */
  defaultSystem: string;
  /** Danh sách rules */
  rules: ProfileMappingRule[];
}
