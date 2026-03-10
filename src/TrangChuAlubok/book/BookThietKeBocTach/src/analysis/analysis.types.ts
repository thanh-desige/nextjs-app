/**
 * Analysis Types - Định nghĩa cho module phân tích BOM
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - CHỈ được import từ: door-engines (đọc output)
 * - KHÔNG được import từ: domain, UI, store, canvas, systems
 */

import type { DoorEngineOutput } from "../door-engines/base/Engine.types";

/**
 * BOM Item - Một dòng trong bảng BOM
 */
export interface BomLineItem {
  /** ID duy nhất */
  id: string;

  /** Mã vật liệu/phụ kiện */
  code: string;

  /** Tên */
  name: string;

  /** Danh mục */
  category: "aluminum" | "glass" | "accessory" | "other";

  /** Đơn vị */
  unit: string;

  /** Số lượng */
  quantity: number;

  /** Đơn giá */
  unitPrice: number;

  /** Thành tiền */
  totalPrice: number;

  /** Ghi chú */
  note?: string;

  /** Nguồn từ cửa nào (engineOutputId) */
  sourceIds: string[];
}

/**
 * BOM Summary - Tổng hợp BOM
 */
export interface BomSummary {
  /** ID duy nhất */
  id: string;

  /** Timestamp tạo */
  createdAt: number;

  /** Danh sách chi tiết */
  lineItems: BomLineItem[];

  /** Tổng nhôm (m) */
  totalAluminum: {
    length: number; // Tổng chiều dài (m)
    weight: number; // Tổng trọng lượng (kg)
    cost: number; // Tổng chi phí
  };

  /** Tổng kính (m²) */
  totalGlass: {
    area: number; // Tổng diện tích (m²)
    cost: number; // Tổng chi phí
  };

  /** Tổng phụ kiện */
  totalAccessories: {
    count: number; // Tổng số lượng
    cost: number; // Tổng chi phí
  };

  /** Tổng cộng */
  grandTotal: number;

  /** Nguồn từ các engine output nào */
  sourceOutputIds: string[];
}

/**
 * Cut List Item - Danh sách cắt nhôm
 */
export interface CutListItem {
  /** Mã profile */
  profileCode: string;

  /** Tên profile */
  profileName: string;

  /** Chiều dài cần cắt (mm) */
  cutLength: number;

  /** Số lượng */
  quantity: number;

  /** Góc cắt đầu */
  angleStart: number;

  /** Góc cắt cuối */
  angleEnd: number;

  /** Ghi chú */
  note?: string;

  /** Thuộc cửa nào */
  doorId: string;
}

/**
 * Optimized Cut List - Danh sách cắt tối ưu
 */
export interface OptimizedCutList {
  /** ID */
  id: string;

  /** Mã profile */
  profileCode: string;

  /** Chiều dài thanh nguyên liệu (mm) */
  stockLength: number;

  /** Các thanh cần cắt */
  bars: OptimizedBar[];

  /** Tổng số thanh nguyên liệu cần */
  totalStockBars: number;

  /** Tổng phế liệu (mm) */
  totalWaste: number;

  /** Tỷ lệ sử dụng (%) */
  utilizationRate: number;
}

export interface OptimizedBar {
  /** Số thứ tự thanh nguyên liệu */
  stockBarIndex: number;

  /** Các đoạn cắt */
  cuts: {
    length: number;
    quantity: number;
    doorId: string;
  }[];

  /** Phần còn lại (phế liệu) */
  waste: number;
}

/**
 * Input cho Quantity Engine
 */
export interface QuantityEngineInput {
  /** Danh sách engine outputs để tính BOM */
  engineOutputs: DoorEngineOutput[];

  /** Tùy chọn */
  options?: {
    /** Chiều dài thanh nguyên liệu (mm) */
    stockLength?: number;

    /** Tối ưu cắt không */
    optimizeCutting?: boolean;

    /** Nhóm theo mã code không */
    groupByCode?: boolean;
  };
}
