/**
 * Door Engine Types - Contract chuẩn cho tất cả door engines
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: tất cả door engines, analysis
 * - KHÔNG được import từ: domain, UI, store, canvas
 */

import type { DoorType } from "../../systems/system.types";

// ==================== INPUT TYPES ====================

/**
 * Input cơ bản cho tất cả door engines
 */
export interface DoorEngineInput {
  /** ID hệ cửa (vd: 'xf55', 'pma55') */
  systemId: string;

  /** Loại cửa */
  doorType: DoorType;

  /** Chiều rộng tổng thể (mm) */
  width: number;

  /** Chiều cao tổng thể (mm) */
  height: number;

  /** Tùy chọn bổ sung */
  options?: DoorEngineOptions;
}

/**
 * Tùy chọn bổ sung
 */
export interface DoorEngineOptions {
  /** Độ dày kính (mm) */
  glassThickness?: number;

  /** Loại kính */
  glassType?: string;

  /** Hướng mở (cho cửa mở) */
  openDirection?: "left" | "right" | "inward" | "outward";

  /** Số cánh (cho cửa trượt) */
  panelCount?: 2 | 4 | 6;

  /** Có đố ngang không */
  hasTransom?: boolean;

  /** Chiều cao đố ngang (mm) */
  transomHeight?: number;

  /** Có đố đứng không */
  hasMullion?: boolean;

  /** Loại khóa */
  lockType?: string;

  /** Loại tay nắm */
  handleType?: string;

  /** Màu sắc */
  color?: string;
}

// ==================== OUTPUT TYPES ====================

/**
 * Output từ door engine
 */
export interface DoorEngineOutput {
  /** ID duy nhất của output */
  id: string;

  /** Timestamp tạo */
  createdAt: number;

  /** Input đã xử lý */
  input: DoorEngineInput;

  /** Geometry đơn giản (cho preview) */
  previewGeometry: PreviewGeometry;

  /** Geometry chi tiết (cho CAD/DXF) */
  detailedGeometry: DetailedGeometry;

  /** Danh sách vật liệu (cho BOM) */
  materials: MaterialItem[];

  /** Danh sách phụ kiện */
  accessories: AccessoryItem[];

  /** Thông tin validation */
  validation: ValidationResult;
}

/**
 * Geometry đơn giản cho preview/canvas
 */
export interface PreviewGeometry {
  /** Bounding box */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** Các đường outline chính */
  outlines: Line2D[];

  /** Vị trí tay nắm (để vẽ icon) */
  handlePosition?: Point2D;

  /** Hướng mở (để vẽ arc) */
  openingArc?: {
    center: Point2D;
    radius: number;
    startAngle: number;
    endAngle: number;
  };
}

/**
 * Geometry chi tiết cho CAD export
 */
export interface DetailedGeometry {
  /** Các layer geometry */
  layers: GeometryLayer[];

  /** Kích thước chi tiết */
  dimensions: DimensionAnnotation[];
}

/**
 * Layer geometry
 */
export interface GeometryLayer {
  name: string;
  color: string;
  lineType: "solid" | "dashed" | "dotted";
  elements: GeometryElement[];
}

/**
 * Phần tử geometry
 */
export interface GeometryElement {
  type: "line" | "rect" | "arc" | "polyline" | "text";
  data: Line2D | Rect2D | Arc2D | Polyline2D | Text2D;
}

// ==================== GEOMETRY PRIMITIVES ====================

export interface Point2D {
  x: number;
  y: number;
}

export interface Line2D {
  start: Point2D;
  end: Point2D;
}

export interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Arc2D {
  center: Point2D;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface Polyline2D {
  points: Point2D[];
  closed: boolean;
}

export interface Text2D {
  position: Point2D;
  content: string;
  fontSize: number;
  rotation?: number;
}

export interface DimensionAnnotation {
  start: Point2D;
  end: Point2D;
  value: number;
  unit: "mm" | "m";
  offset: number;
}

// ==================== MATERIAL TYPES ====================

/**
 * Item vật liệu (nhôm, kính...)
 */
export interface MaterialItem {
  /** Mã profile/vật liệu */
  code: string;

  /** Tên */
  name: string;

  /** Loại (frame, sash, glass...) */
  type: string;

  /** Số lượng */
  quantity: number;

  /** Đơn vị */
  unit: "mm" | "m" | "m2" | "pcs";

  /** Chiều dài (nếu là thanh) */
  length?: number;

  /** Kích thước (nếu là tấm) */
  size?: { width: number; height: number };

  /** Đơn giá */
  unitPrice: number;

  /** Thành tiền */
  totalPrice: number;

  /** Ghi chú cắt */
  cutNote?: string;
}

/**
 * Item phụ kiện
 */
export interface AccessoryItem {
  /** Mã phụ kiện */
  code: string;

  /** Tên */
  name: string;

  /** Loại */
  type: string;

  /** Số lượng */
  quantity: number;

  /** Đơn vị */
  unit: "pcs" | "set" | "m";

  /** Đơn giá */
  unitPrice: number;

  /** Thành tiền */
  totalPrice: number;
}

// ==================== VALIDATION ====================

/**
 * Kết quả validation
 */
export interface ValidationResult {
  /** Hợp lệ không */
  isValid: boolean;

  /** Danh sách lỗi */
  errors: ValidationError[];

  /** Danh sách cảnh báo */
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// ==================== ENGINE INTERFACE ====================

/**
 * Interface chuẩn cho tất cả door engines
 */
export interface IDoorEngine {
  /** Tên engine */
  readonly name: string;

  /** Loại cửa hỗ trợ */
  readonly supportedTypes: DoorType[];

  /** Validate input */
  validate(input: DoorEngineInput): ValidationResult;

  /** Sinh output */
  generate(input: DoorEngineInput): DoorEngineOutput;
}
