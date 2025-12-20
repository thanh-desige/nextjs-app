/**
 * Engine State - Trạng thái của CAD Engine
 */

import { Vec2 } from "../geometry/Vec2";
import { IEntity } from "../entities/Entity.types";

// ==================== Tool/Mode Types ====================

export enum ToolMode {
  SELECT = "SELECT",
  PAN = "PAN",
  ZOOM = "ZOOM",
  DRAW_LINE = "DRAW_LINE",
  DRAW_RECT = "DRAW_RECT",
  DRAW_CIRCLE = "DRAW_CIRCLE",
  DRAW_ARC = "DRAW_ARC",
  DRAW_POLYGON = "DRAW_POLYGON",
  DRAW_ELLIPSE = "DRAW_ELLIPSE",
  DRAW_TEXT = "DRAW_TEXT",
  DRAW_DIMENSION = "DRAW_DIMENSION",
  DRAW_DIM_LINEAR = "DRAW_DIM_LINEAR",
  DRAW_DIM_ALIGNED = "DRAW_DIM_ALIGNED",
  DRAW_DIM_ANGULAR = "DRAW_DIM_ANGULAR",
  DRAW_DIM_RADIUS = "DRAW_DIM_RADIUS",
  DRAW_QDIM = "DRAW_QDIM",
  DRAW_DIMCONTINUE = "DRAW_DIMCONTINUE",
  DRAW_DIMARC = "DRAW_DIMARC",
  MOVE = "MOVE",
  COPY = "COPY",
  ROTATE = "ROTATE",
  SCALE = "SCALE",
  MIRROR = "MIRROR",
  TRIM = "TRIM",
  EXTEND = "EXTEND",
  OFFSET = "OFFSET",
  FILLET = "FILLET",
  MEASURE = "MEASURE",
}

export enum SelectionMode {
  SINGLE = "SINGLE",
  WINDOW = "WINDOW", // Chọn object nằm hoàn toàn trong window
  CROSSING = "CROSSING", // Chọn object giao với window
}

// ==================== Viewport State ====================

export interface ViewportState {
  /** Tâm viewport trong world coordinates */
  center: Vec2;
  /** Zoom level (1 = 100%) */
  zoom: number;
  /** Góc xoay viewport (radian) */
  rotation: number;
  /** Kích thước viewport (pixels) */
  width: number;
  height: number;
}

export const DEFAULT_VIEWPORT: ViewportState = {
  center: new Vec2(0, 0),
  zoom: 1,
  rotation: 0,
  width: 800,
  height: 600,
};

// ==================== Grid State ====================

export interface GridState {
  /** Bật/tắt grid */
  visible: boolean;
  /** Snap to grid */
  snap: boolean;
  /** Kích thước ô grid chính */
  majorSpacing: number;
  /** Số ô nhỏ trong 1 ô lớn */
  minorDivisions: number;
  /** Màu grid chính */
  majorColor: string;
  /** Màu grid phụ */
  minorColor: string;
}

export const DEFAULT_GRID: GridState = {
  visible: true,
  snap: true,
  majorSpacing: 100,
  minorDivisions: 10,
  majorColor: "#444444",
  minorColor: "#333333",
};

// ==================== Snap State ====================

export interface SnapState {
  /** Bật/tắt object snap */
  enabled: boolean;
  /** Các loại snap được bật */
  modes: {
    endpoint: boolean;
    midpoint: boolean;
    center: boolean;
    quadrant: boolean;
    intersection: boolean;
    perpendicular: boolean;
    tangent: boolean;
    nearest: boolean;
  };
  /** Bán kính snap (pixels) */
  radius: number;
}

export const DEFAULT_SNAP: SnapState = {
  enabled: true,
  modes: {
    endpoint: true,
    midpoint: true,
    center: true,
    quadrant: true,
    intersection: true,
    perpendicular: false,
    tangent: false,
    nearest: true,
  },
  radius: 10,
};

// ==================== Input State ====================

export interface InputState {
  /** Vị trí chuột hiện tại (screen) */
  mouseScreen: Vec2;
  /** Vị trí chuột hiện tại (world) */
  mouseWorld: Vec2;
  /** Vị trí chuột đã snap */
  mouseSnapped: Vec2;
  /** Chuột đang được nhấn */
  mouseDown: boolean;
  /** Nút chuột được nhấn */
  mouseButton: number;
  /** Điểm bắt đầu kéo */
  dragStart: Vec2 | null;
  /** Phím đang được nhấn */
  keysDown: Set<string>;
  /** Shift key */
  shiftKey: boolean;
  /** Ctrl key */
  ctrlKey: boolean;
  /** Alt key */
  altKey: boolean;
}

export const DEFAULT_INPUT: InputState = {
  mouseScreen: new Vec2(0, 0),
  mouseWorld: new Vec2(0, 0),
  mouseSnapped: new Vec2(0, 0),
  mouseDown: false,
  mouseButton: 0,
  dragStart: null,
  keysDown: new Set(),
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
};

// ==================== Selection State ====================

export interface SelectionState {
  /** IDs của các entities đang được chọn */
  selectedIds: Set<string>;
  /** ID của entity đang hover */
  hoveredId: string | null;
  /** Đang trong quá trình chọn (drag selection box) */
  isSelecting: boolean;
  /** Selection box */
  selectionBox: {
    start: Vec2;
    end: Vec2;
    mode: SelectionMode;
  } | null;
}

export const DEFAULT_SELECTION: SelectionState = {
  selectedIds: new Set(),
  hoveredId: null,
  isSelecting: false,
  selectionBox: null,
};

// ==================== Drawing State (khi đang vẽ) ====================

export interface DrawingState {
  /** Đang trong quá trình vẽ */
  isDrawing: boolean;
  /** Các điểm đã nhập */
  points: Vec2[];
  /** Preview entity (chưa được thêm vào document) */
  preview: IEntity | null;
  /** Prompt hiện tại cho user */
  prompt: string;
  /** Các option cho command hiện tại */
  options: string[];
}

export const DEFAULT_DRAWING: DrawingState = {
  isDrawing: false,
  points: [],
  preview: null,
  prompt: "",
  options: [],
};

// ==================== Complete Engine State ====================

export interface EngineState {
  /** Tool/Mode hiện tại */
  tool: ToolMode;
  /** Viewport state */
  viewport: ViewportState;
  /** Grid state */
  grid: GridState;
  /** Snap state */
  snap: SnapState;
  /** Input state */
  input: InputState;
  /** Selection state */
  selection: SelectionState;
  /** Drawing state */
  drawing: DrawingState;
  /** Có thay đổi chưa save */
  isDirty: boolean;
  /** Đang loading */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}

export function createDefaultEngineState(): EngineState {
  return {
    tool: ToolMode.SELECT,
    viewport: { ...DEFAULT_VIEWPORT, center: new Vec2(0, 0) },
    grid: { ...DEFAULT_GRID },
    snap: { ...DEFAULT_SNAP },
    input: {
      ...DEFAULT_INPUT,
      mouseScreen: new Vec2(0, 0),
      mouseWorld: new Vec2(0, 0),
      mouseSnapped: new Vec2(0, 0),
      keysDown: new Set(),
    },
    selection: {
      ...DEFAULT_SELECTION,
      selectedIds: new Set(),
    },
    drawing: {
      ...DEFAULT_DRAWING,
      points: [],
    },
    isDirty: false,
    isLoading: false,
    error: null,
  };
}
