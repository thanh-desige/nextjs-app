/**
 * Adapters Layer Index
 * Exports all adapter modules for CAD application integration
 */

// ============================================================================
// Canvas Adapters
// ============================================================================
export { BaseCanvasAdapter } from "./canvas/CanvasAdapter";

export type {
  ICanvasAdapter,
  RenderOptions,
  StrokeStyle,
  FillStyle,
  TextStyle,
  CanvasPointerEvent,
  CanvasWheelEvent,
  CanvasKeyEvent,
  RenderedObject,
  PointerEventHandler,
  WheelEventHandler,
  KeyEventHandler,
} from "./canvas/CanvasAdapter";

export { FabricAdapter } from "./canvas/FabricAdapter";

export { SvgAdapter } from "./canvas/SvgAdapter";

// ============================================================================
// Input Adapters
// ============================================================================
export { MouseAdapter } from "./input/MouseAdapter";

export type { MouseState, MouseButton } from "./input/MouseAdapter";

export { KeyboardAdapter } from "./input/KeyboardAdapter";

export type { KeyState } from "./input/KeyboardAdapter";

// ============================================================================
// Persistence Adapters
// ============================================================================
export { LocalStorageAdapter } from "./persistence/LocalStorageAdapter";

export type { StorageItem } from "./persistence/LocalStorageAdapter";

export { FileSystemAdapter } from "./persistence/FileSystemAdapter";

export type { FileInfo, FileFilter } from "./persistence/FileSystemAdapter";

export { RemoteStorageAdapter } from "./persistence/RemoteStorageAdapter";

export type { RemoteStorageConfig } from "./persistence/RemoteStorageAdapter";
