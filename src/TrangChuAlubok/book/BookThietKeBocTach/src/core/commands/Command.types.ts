/**
 * Command Types - Định nghĩa kiểu cho Command Pattern
 */

import { IVec2 } from "../geometry/Vec2";
import { IEntity, EntityStyle } from "../entities/Entity.types";
import { CadEngine } from "../engine/CadEngine";
import { ToolMode } from "../engine/EngineState";

// ==================== Command Interface ====================

export interface ICommand {
  /** Tên command (hiển thị) */
  readonly name: string;
  /** Mô tả command */
  readonly description?: string;
  /** Command có thể undo không */
  readonly canUndo: boolean;

  /** Thực thi command */
  execute(context: CommandContext): CommandResult;
  /** Undo command */
  undo(context: CommandContext): void;
  /** Redo command (mặc định = execute) */
  redo?(context: CommandContext): CommandResult;
}

// ==================== Command Result ====================

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  /** Entities được tạo/sửa */
  entities?: IEntity[];
}

// ==================== Command Context ====================

export interface CommandContext {
  /** CAD Engine instance */
  engine: CadEngine;
  /** Input points từ user */
  points: IVec2[];
  /** Options từ user */
  options: Record<string, unknown>;
  /** Current style */
  style: EntityStyle;
  /** Active layer ID - undefined when layers are disabled */
  layerId?: string;
}

// ==================== Interactive Command ====================

/**
 * Command cần tương tác với user (nhập điểm, chọn options)
 */
export interface IInteractiveCommand<TPreview = IEntity | null>
  extends ICommand {
  /** Tool mode tương ứng */
  readonly toolMode: ToolMode;

  /** Số điểm cần thiết */
  readonly requiredPoints: number;

  /** Số điểm tối đa (undefined = unlimited) */
  readonly maxPoints?: number;

  /** Auto-complete khi đủ điểm? (default: true)
   * - true: RECT, CIRCLE tự động hoàn thành sau 2 điểm
   * - false: LINE, POLYLINE cần Enter/Space để hoàn thành
   */
  readonly autoComplete?: boolean;

  /** Prompt hiện tại cho user */
  getPrompt(pointCount: number): string;

  /** Các options có thể chọn */
  getOptions(pointCount: number): CommandOption[];

  /** Tạo preview entity */
  createPreview(context: CommandContext, currentPoint: IVec2): TPreview;

  /** Kiểm tra có đủ điểm để complete chưa */
  canComplete(pointCount: number): boolean;

  /** Xử lý khi chọn option */
  handleOption?(option: string, context: CommandContext): void;
}

export interface CommandOption {
  key: string; // Phím tắt
  label: string; // Text hiển thị
  description?: string;
}

// ==================== Command Categories ====================

export enum CommandCategory {
  DRAW = "draw",
  MODIFY = "modify",
  VIEW = "view",
  DIMENSION = "dimension",
  SELECTION = "selection",
  FILE = "file",
  EDIT = "edit",
  LAYER = "layer",
  TOOLS = "tools",
}

// ==================== Command Registry Entry ====================

export interface CommandRegistryEntry {
  command: new () => ICommand;
  name: string;
  category: CommandCategory;
  shortcut?: string;
  icon?: string;
  toolMode?: ToolMode;
}

// ==================== Modify Command Data ====================

export interface MoveCommandData {
  entityIds: string[];
  delta: IVec2;
}

export interface RotateCommandData {
  entityIds: string[];
  center: IVec2;
  angle: number; // radian
}

export interface ScaleCommandData {
  entityIds: string[];
  center: IVec2;
  scaleX: number;
  scaleY: number;
}

export interface CopyCommandData {
  entityIds: string[];
  delta: IVec2;
}

export interface DeleteCommandData {
  entities: IEntity[];
}

export interface MirrorCommandData {
  entityIds: string[];
  axisStart: IVec2;
  axisEnd: IVec2;
  deleteOriginal: boolean;
}

// ==================== Draw Command Data ====================

export interface DrawLineData {
  start: IVec2;
  end: IVec2;
  style: EntityStyle;
  layerId: string;
}

export interface DrawRectData {
  corner1: IVec2;
  corner2: IVec2;
  style: EntityStyle;
  layerId: string;
}

export interface DrawCircleData {
  center: IVec2;
  radius: number;
  style: EntityStyle;
  layerId: string;
}

export interface DrawArcData {
  center: IVec2;
  radius: number;
  startAngle: number;
  endAngle: number;
  style: EntityStyle;
  layerId: string;
}

export interface DrawPolylineData {
  points: IVec2[];
  closed: boolean;
  style: EntityStyle;
  layerId: string;
}

export interface DrawTextData {
  position: IVec2;
  text: string;
  fontSize: number;
  style: EntityStyle;
  layerId: string;
}

// ==================== History Entry ====================

export interface HistoryEntry {
  command: ICommand;
  context: CommandContext;
  timestamp: number;
  /** Snapshot data để undo */
  snapshot?: unknown;
}
