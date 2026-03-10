/**
 * Door Engines - Barrel Export
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - CHỈ được import bởi: analysis, orchestrator
 * - KHÔNG được import từ: domain, UI, store, canvas
 */

// Base types & classes
export type {
  IDoorEngine,
  DoorEngineInput,
  DoorEngineOutput,
  DoorEngineOptions,
  PreviewGeometry,
  DetailedGeometry,
  MaterialItem,
  AccessoryItem,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  Point2D,
  Line2D,
  Rect2D,
  Arc2D,
} from "./base/Engine.types";

export { BaseDoorEngine } from "./base/BaseDoorEngine";
export * from "./base/engine.utils";

// Specific engines
export { HingedDoorEngine } from "./hingedDoor/hingedDoor.engine";
// export { SlidingDoorEngine } from './slidingDoor/slidingDoor.engine';
// export { FixedWindowEngine } from './fixedWindow/fixedWindow.engine';

// Engine registry
export { getEngine, registerEngine, getAllEngines } from "./engineRegistry";
