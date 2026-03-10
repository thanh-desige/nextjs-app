/**
 * System Types - Định nghĩa cấu trúc dữ liệu hãng/hệ
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - File này là DATA THUẦN
 * - KHÔNG được import từ bất kỳ module nào khác
 */

/**
 * Loại profile nhôm
 */
export type ProfileType =
  | "frame"
  | "sash"
  | "mullion"
  | "transom"
  | "bead"
  | "other";

/**
 * Loại phụ kiện
 */
export type AccessoryType =
  | "hinge"
  | "handle"
  | "lock"
  | "roller"
  | "seal"
  | "corner"
  | "screw"
  | "other";

/**
 * Đơn vị tính
 */
export type UnitType = "pcs" | "set" | "m" | "kg";

/**
 * Loại cửa
 */
export type DoorType =
  | "hinged-single" // Cửa đơn mở quay
  | "hinged-double" // Cửa đôi mở quay
  | "sliding-2p" // Cửa trượt 2 cánh
  | "sliding-4p" // Cửa trượt 4 cánh
  | "fixed" // Cửa sổ fix
  | "awning" // Cửa sổ hất
  | "casement"; // Cửa sổ mở quay

/**
 * Profile - Thanh nhôm
 */
export interface Profile {
  code: string; // Mã profile (vd: XF55-001)
  name: string; // Tên profile (vd: Khung bao)
  type: ProfileType; // Loại profile
  width: number; // Chiều rộng mặt cắt (mm)
  height: number; // Chiều cao mặt cắt (mm)
  weight: number; // Trọng lượng (kg/m)
  price: number; // Đơn giá (VND/m)
  color: string; // Màu mặc định
}

/**
 * Accessory - Phụ kiện
 */
export interface Accessory {
  code: string; // Mã phụ kiện
  name: string; // Tên phụ kiện
  type: AccessoryType; // Loại phụ kiện
  unit: UnitType; // Đơn vị tính
  price: number; // Đơn giá
  applicableTo: DoorType[]; // Áp dụng cho loại cửa nào
}

/**
 * Glass Config - Thông số kính
 */
export interface GlassConfig {
  minThickness: number; // Độ dày tối thiểu (mm)
  maxThickness: number; // Độ dày tối đa (mm)
  supportedTypes: string[]; // Loại kính hỗ trợ
  defaultThickness: number; // Độ dày mặc định
  defaultType: string; // Loại mặc định
}

/**
 * Constraints - Ràng buộc kỹ thuật
 */
export interface Constraints {
  minWidth: number; // Chiều rộng tối thiểu (mm)
  maxWidth: number; // Chiều rộng tối đa (mm)
  minHeight: number; // Chiều cao tối thiểu (mm)
  maxHeight: number; // Chiều cao tối đa (mm)
  maxArea?: number; // Diện tích tối đa (m²)
  maxWeight?: number; // Trọng lượng tối đa (kg)
  maxPanelWidth?: number; // Chiều rộng tối đa 1 cánh (mm)
  maxPanelWeight?: number; // Trọng lượng tối đa 1 cánh (kg)
}

/**
 * Formulas - Công thức tính toán
 */
export interface Formulas {
  frameDeduction: number; // Trừ hao khung bao (mm)
  sashDeduction: number; // Trừ hao khung cánh (mm)
  glassDeduction: number; // Trừ hao kính (mm)
  beadOverlap?: number; // Chồng lấn nẹp kính (mm)
  overlap?: number; // Chồng lấn cánh trượt (mm)
}

/**
 * SystemData - Dữ liệu hoàn chỉnh của 1 hệ cửa
 */
export interface SystemData {
  id: string; // ID duy nhất (vd: xf55, pma55)
  name: string; // Tên hiển thị (vd: Xingfa 55)
  brand: string; // Tên hãng
  version: string; // Phiên bản dữ liệu
  description?: string; // Mô tả

  profiles: Record<string, Profile>; // Danh sách profile
  accessories: Record<string, Accessory>; // Danh sách phụ kiện
  glass: GlassConfig; // Thông số kính
  constraints: Constraints; // Ràng buộc kỹ thuật
  formulas: Formulas; // Công thức tính
}
