/**
 * Store Barrel Export
 */

export {
  useEngineStore,
  // STEP-1.3: selectSelectedEntities, selectHasSelection REMOVED — use CadDocument via useCanvasEntities
  selectActiveTool,
  selectViewport,
  selectMousePosition,
  selectOsnap,
  selectGrid,
  selectDocumentState,
  type OsnapSettings,
  type GridSettings,
  type EngineStoreState,
  type EngineStoreActions,
} from "./engineStore";

export {
  useUIStore,
  selectIsPanelVisible,
  selectIsToolbarVisible,
  selectHasNotifications,
  type ThemeMode,
  type PanelPosition,
  type PanelState,
  type ToolbarState,
  type ContextMenuItem,
  type Notification,
  type UIStoreState,
  type UIStoreActions,
} from "./uiStore";

export {
  useProjectStore,
  selectBomByCategory,
  selectTotalBomCost,
  selectHasProject,
  selectProjectStatus,
  type ProjectInfo,
  type BomItem,
  type MaterialEntry,
  type QuoteSettings,
  type QuoteSummary,
  type ProjectStoreState,
  type ProjectStoreActions,
} from "./projectStore";

// Door Store (Quản lý cửa trên canvas)
export {
  useDoorStore,
  selectDoorCount,
  selectIsDragging,
  selectHasSelection as selectHasDoorSelection,
  type DoorStoreState,
  type DoorStoreActions,
} from "./doorStore";
