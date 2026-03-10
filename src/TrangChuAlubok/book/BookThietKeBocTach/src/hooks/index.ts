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

// Door Entities hooks (Kéo thả cửa)
export { useDoorEntities } from "./useDoorEntities";

// Drag & Drop hooks
export {
  useDragDrop,
  useDragFromSidebar,
  useDropOnCanvas,
} from "./useDragDrop";
export type { DragItem } from "./useDragDrop";

// Page-level hooks (STEP-5.3: extracted from BookThietKeBocTachPage.tsx)
export { useModifyCommands } from "./useModifyCommands";
export type {
  UseModifyCommandsParams,
  UseModifyCommandsReturn,
} from "./useModifyCommands";

export { usePageCommands } from "./usePageCommands";
export type {
  UsePageCommandsParams,
  UsePageCommandsReturn,
} from "./usePageCommands";

export { useKeyboardShortcuts } from "./useKeyboardShortcuts";
export type { UseKeyboardShortcutsParams } from "./useKeyboardShortcuts";

// Dimension sub-hooks (STEP-5.4: extracted from useDimensions.ts)
export { useDimensionClick } from "./useDimensionClick";
export type {
  UseDimensionClickParams,
  UseDimensionClickReturn,
} from "./useDimensionClick";

export { useDimensionPreview } from "./useDimensionPreview";
export type {
  UseDimensionPreviewParams,
  UseDimensionPreviewReturn,
} from "./useDimensionPreview";

export { useDimensionQdim } from "./useDimensionQdim";
export type {
  UseDimensionQdimParams,
  UseDimensionQdimReturn,
} from "./useDimensionQdim";

// Page sub-hooks (STEP-5.5: extracted from BookThietKeBocTachPage.tsx)
export { useDoorHandlers } from "./useDoorHandlers";
export type {
  UseDoorHandlersParams,
  UseDoorHandlersReturn,
} from "./useDoorHandlers";

export { useToolbar } from "./useToolbar";
export type { UseToolbarParams, UseToolbarReturn } from "./useToolbar";

export { useStyleHandlers } from "./useStyleHandlers";
export type {
  UseStyleHandlersParams,
  UseStyleHandlersReturn,
} from "./useStyleHandlers";

// Page settings hook (STEP-5.22: extracted from BookThietKeBocTachPage.tsx)
export { usePageSettings } from "./usePageSettings";
export type { PageSettings, TextSettings } from "./usePageSettings";

// Canvas event handlers (STEP-5.26: inline callbacks extracted from BookThietKeBocTachPage.tsx)
export { useCanvasEventHandlers } from "./useCanvasEventHandlers";
export type { UseCanvasEventHandlersParams } from "./useCanvasEventHandlers";
