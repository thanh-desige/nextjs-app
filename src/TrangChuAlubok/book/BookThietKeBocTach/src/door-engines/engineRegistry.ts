/**
 * Engine Registry - Quản lý tất cả door engines
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - CHỈ được gọi bởi: analysis, orchestrator
 * - KHÔNG được import từ: domain, UI, store, canvas
 */

import type {
  IDoorEngine,
  DoorEngineInput,
  DoorEngineOutput,
} from "./base/Engine.types";
import type { DoorType } from "../systems/system.types";
import { HingedDoorEngine } from "./hingedDoor/hingedDoor.engine";
// import { SlidingDoorEngine } from './slidingDoor/slidingDoor.engine';

/**
 * Registry lưu trữ engines
 */
const engineRegistry: Map<string, IDoorEngine> = new Map();

/**
 * Đăng ký engine mới
 */
export function registerEngine(engine: IDoorEngine): void {
  engineRegistry.set(engine.name, engine);
  console.log(`[EngineRegistry] Registered: ${engine.name}`);
}

/**
 * Lấy engine theo tên
 */
export function getEngine(name: string): IDoorEngine | undefined {
  return engineRegistry.get(name);
}

/**
 * Lấy engine phù hợp cho loại cửa
 */
export function getEngineForDoorType(
  doorType: DoorType
): IDoorEngine | undefined {
  for (const engine of engineRegistry.values()) {
    if (engine.supportedTypes.includes(doorType)) {
      return engine;
    }
  }
  return undefined;
}

/**
 * Lấy tất cả engines
 */
export function getAllEngines(): IDoorEngine[] {
  return Array.from(engineRegistry.values());
}

/**
 * Chạy engine cho input
 */
export function runEngine(input: DoorEngineInput): DoorEngineOutput {
  const engine = getEngineForDoorType(input.doorType);
  if (!engine) {
    throw new Error(`No engine found for door type: ${input.doorType}`);
  }
  return engine.generate(input);
}

// ==================== AUTO-REGISTER ENGINES ====================

// Đăng ký engines khi module được load
registerEngine(new HingedDoorEngine());
// registerEngine(new SlidingDoorEngine());
