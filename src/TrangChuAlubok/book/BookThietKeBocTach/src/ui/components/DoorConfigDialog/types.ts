/**
 * DoorConfigDialog Types - Form state và interfaces
 *
 * ⚠️ PREVIEW_CONTRACT: Chỉ UI state, không logic
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: DoorConfigDialog components
 * - KHÔNG import door-engines, analysis
 */

/**
 * Loại mở cửa (để filter hệ phù hợp)
 */
export type OpenType = "hinged" | "sliding" | "fixed" | "awning" | "casement";

/**
 * Vị trí đố (mullion)
 */
export interface MullionPosition {
  /** ID duy nhất */
  id: string;
  /** Loại đố */
  type: "horizontal" | "vertical";
  /** Vị trí (% từ 0-1, hoặc mm) */
  position: number;
  /** Đơn vị */
  unit: "percent" | "mm";
}

/**
 * Form state cho DoorConfigDialog
 */
export interface DoorConfigFormState {
  /** Chiều rộng (mm) */
  width: number;
  /** Chiều cao (mm) */
  height: number;
  /** Tên hiển thị */
  displayName: string;
  /** Loại mở cửa */
  openType: OpenType;
  /** ID hãng */
  brandId: string;
  /** ID hệ */
  systemId: string;
  /** Danh sách đố */
  mullions: MullionPosition[];
}

/**
 * Thông tin hãng cửa
 */
export interface DoorBrand {
  id: string;
  name: string;
}

/**
 * Thông tin hệ cửa
 */
export interface DoorSystem {
  id: string;
  name: string;
  /** Các loại mở hỗ trợ */
  supportedOpenTypes: OpenType[];
}

/**
 * Props cho ParametricPreview
 */
export interface ParametricPreviewProps {
  /** Chiều rộng (mm) */
  width: number;
  /** Chiều cao (mm) */
  height: number;
  /** Loại mở */
  openType: OpenType;
  /** Danh sách đố */
  mullions: MullionPosition[];
  /** Callback khi thay đổi width */
  onWidthChange: (width: number) => void;
  /** Callback khi thay đổi height */
  onHeightChange: (height: number) => void;
  /** Callback khi thay đổi mullions */
  onMullionsChange: (mullions: MullionPosition[]) => void;
  /** Có cho phép edit không */
  editable?: boolean;
}

/**
 * Tạo ID unique cho mullion
 */
export function createMullionId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Tạo mullion mới
 */
export function createMullion(
  type: "horizontal" | "vertical",
  position: number,
  unit: "percent" | "mm" = "percent"
): MullionPosition {
  return {
    id: createMullionId(),
    type,
    position,
    unit,
  };
}

/**
 * Tạo form state mặc định
 */
export function createDefaultFormState(): DoorConfigFormState {
  return {
    width: 900,
    height: 2200,
    displayName: "",
    openType: "hinged",
    brandId: "xingfa",
    systemId: "xf55",
    mullions: [],
  };
}

/**
 * Map từ DoorVariant sang OpenType
 */
export function variantToOpenType(variant: string): OpenType {
  switch (variant) {
    case "hinged-single":
    case "hinged-double":
      return "hinged";
    case "sliding-2p":
    case "sliding-4p":
      return "sliding";
    case "fixed":
      return "fixed";
    case "awning":
      return "awning";
    case "casement":
      return "casement";
    default:
      return "hinged";
  }
}
