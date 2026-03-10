/**
 * DoorPreviewData - Schema cho dữ liệu preview cửa
 *
 * ⚠️ ĐÂY LÀ DỮ LIỆU PREVIEW (UI-only), KHÔNG PHẢI GEOMETRY KỸ THUẬT
 * - Dùng cho: render visual trên canvas, thumbnail
 * - KHÔNG dùng cho: BOM, pricing, cắt nhôm/kính, door-engine
 *
 * Luồng sử dụng:
 * 1. Admin vẽ mẫu cửa trên canvas (giai đoạn sau)
 * 2. Export thành DoorPreviewData JSON
 * 3. User kéo mẫu → render từ preview data (scale theo W/H)
 * 4. Khi tính BOM → door-engine chạy riêng, độc lập với preview
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: ui/, adapters/preview/
 * - KHÔNG được import bởi: door-engines/, analysis/, domain/
 */

// ==================== CORE TYPES ====================

/**
 * Điểm tọa độ normalized (0-1)
 * - (0,0) = góc trên-trái
 * - (1,1) = góc dưới-phải
 */
export interface NormalizedPoint {
  x: number; // 0-1
  y: number; // 0-1
}

/**
 * Kiểu path được hỗ trợ trong preview
 */
export type PreviewPathType =
  | "line"
  | "rect"
  | "polyline"
  | "arc"
  | "circle"
  | "ellipse";

/**
 * Style cho path (chỉ visual, không liên quan material)
 */
export interface PreviewPathStyle {
  /** Màu stroke (hex) */
  stroke: string;
  /** Độ dày stroke (% của width, ví dụ: 0.02 = 2% width) */
  strokeWidth: number;
  /** Màu fill (hex hoặc "none") */
  fill?: string;
  /** Dash pattern (optional) */
  dashArray?: number[];
}

/**
 * Path cơ bản trong preview
 */
export interface PreviewPath {
  type: PreviewPathType;
  /** Tọa độ normalized (0-1) */
  points: NormalizedPoint[];
  /** Style */
  style: PreviewPathStyle;
  /** Metadata (optional) */
  meta?: {
    /** Tên/mô tả path */
    name?: string;
    /** Layer gợi ý (frame, sash, glass, etc.) */
    layer?: string;
  };
}

/**
 * Path đặc biệt: Arc (cung tròn)
 */
export interface PreviewArc extends Omit<PreviewPath, "type" | "points"> {
  type: "arc";
  /** Tâm (normalized) */
  center: NormalizedPoint;
  /** Bán kính X (% của width) */
  radiusX: number;
  /** Bán kính Y (% của height) */
  radiusY: number;
  /** Góc bắt đầu (degrees) */
  startAngle: number;
  /** Góc kết thúc (degrees) */
  endAngle: number;
  style: PreviewPathStyle;
}

/**
 * Path đặc biệt: Circle
 */
export interface PreviewCircle extends Omit<PreviewPath, "type" | "points"> {
  type: "circle";
  /** Tâm (normalized) */
  center: NormalizedPoint;
  /** Bán kính (% của width) */
  radius: number;
  style: PreviewPathStyle;
}

// ==================== LAYER DEFINITIONS ====================

/**
 * Các layer trong preview (theo role, không theo material)
 */
export interface PreviewLayers {
  /** Khung bao ngoài */
  frame: PreviewPath[];
  /** Cánh cửa */
  sash: PreviewPath[];
  /** Kính */
  glass: PreviewPath[];
  /** Đố ngang/dọc */
  mullions: PreviewPath[];
  /** Hoa văn, chi tiết trang trí */
  decorations: PreviewPath[];
  /** Các đường phụ trợ (swing arc, slide direction, etc.) */
  auxiliary: PreviewPath[];
}

/**
 * Marker positions (vị trí tương đối 0-1)
 */
export interface PreviewMarkers {
  /** Vị trí bản lề */
  hinges: NormalizedPoint[];
  /** Vị trí tay nắm */
  handle?: NormalizedPoint;
  /** Điểm kết nối góc (để snap) */
  connectors: NormalizedPoint[];
  /** Điểm gốc (origin) */
  origin?: NormalizedPoint;
}

// ==================== MAIN SCHEMA ====================

/**
 * Schema chính cho Door Preview Data
 */
export interface DoorPreviewData {
  /** ID unique của preview */
  id: string;

  /** Tên hiển thị */
  name: string;

  /** Phiên bản schema */
  version: "1.0";

  /** Loại cửa tương ứng */
  doorType: string;

  /** Kích thước gốc khi vẽ (mm) - dùng để tham chiếu tỷ lệ */
  baseSize: {
    width: number;
    height: number;
  };

  /** Các layer paths (normalized 0-1) */
  layers: PreviewLayers;

  /** Marker positions */
  markers: PreviewMarkers;

  /** Metadata */
  meta: {
    /** Người tạo */
    createdBy?: string;
    /** Ngày tạo */
    createdAt?: string;
    /** Ghi chú */
    notes?: string;
  };
}

// ==================== RENDER OPTIONS ====================

/**
 * Options khi render preview
 */
export interface PreviewRenderOptions {
  /** Kích thước target (mm) */
  targetWidth: number;
  targetHeight: number;

  /** Có hiển thị markers không */
  showMarkers?: boolean;

  /** Có hiển thị dimensions không */
  showDimensions?: boolean;

  /** Override colors (optional) */
  colorOverrides?: Partial<{
    frame: string;
    sash: string;
    glass: string;
    mullions: string;
  }>;

  /** Opacity */
  opacity?: number;

  /** Highlight selected */
  isSelected?: boolean;
  isHovered?: boolean;
}

// ==================== FACTORY HELPERS ====================

/**
 * Tạo empty preview data
 */
export function createEmptyPreviewData(
  id: string,
  name: string,
  doorType: string
): DoorPreviewData {
  return {
    id,
    name,
    version: "1.0",
    doorType,
    baseSize: { width: 1000, height: 2100 },
    layers: {
      frame: [],
      sash: [],
      glass: [],
      mullions: [],
      decorations: [],
      auxiliary: [],
    },
    markers: {
      hinges: [],
      connectors: [],
    },
    meta: {
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Validate preview data
 */
export function validatePreviewData(data: unknown): data is DoorPreviewData {
  if (!data || typeof data !== "object") return false;

  const d = data as Partial<DoorPreviewData>;

  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    d.version === "1.0" &&
    typeof d.doorType === "string" &&
    d.baseSize !== undefined &&
    typeof d.baseSize.width === "number" &&
    typeof d.baseSize.height === "number" &&
    d.layers !== undefined &&
    d.markers !== undefined
  );
}
