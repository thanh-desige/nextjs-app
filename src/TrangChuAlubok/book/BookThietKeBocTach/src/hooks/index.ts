/**
 * Hooks Index - Barrel export cho tất cả custom hooks
 */

// Engine hooks
export { useCadEngine } from "./useCadEngine";
export type { UseCadEngineReturn } from "./useCadEngine";

// Selection hooks
export { useSelection } from "./useSelection";
export type { UseSelectionReturn } from "./useSelection";

// Pan/Zoom hooks
export { usePanZoom } from "./usePanZoom";
export type { UsePanZoomReturn } from "./usePanZoom";

// Keyboard hooks
export { useKeyboard } from "./useKeyboard";
export type { UseKeyboardReturn, KeyboardShortcut } from "./useKeyboard";

// Properties hooks
export { useProperties } from "./useProperties";
export type { UsePropertiesReturn } from "./useProperties";

// BOM Calculator hooks
export { useBomCalculator } from "./useBomCalculator";
export type { UseBomCalculatorReturn } from "./useBomCalculator";

// Door Templates hooks
export { useDoorTemplates } from "./useDoorTemplates";
export type { UseDoorTemplatesReturn } from "./useDoorTemplates";

// Layer hooks
export { useLayers } from "./useLayers";
export type { UseLayersReturn } from "./useLayers";

// Export hooks
export { useExport } from "./useExport";
export type { UseExportReturn } from "./useExport";

// Dimension hooks
export { useDimensions } from "./useDimensions";
export type { UseDimensionsReturn, DimensionToolState } from "./useDimensions";

// Canvas Entities hooks (Phase 4 - ĐIỀU KIỆN 1 compliance)
export { useCanvasEntities } from "./useCanvasEntities";
export type { UseCanvasEntitiesReturn } from "./useCanvasEntities";

// Drawing Commands hooks (ĐIỀU KIỆN 1 - Canvas only collects input, Commands execute via CadEngine)
export { useDrawingCommands } from "./useDrawingCommands";
export type {
  UseDrawingCommandsReturn,
  DrawingState,
} from "./useDrawingCommands";
