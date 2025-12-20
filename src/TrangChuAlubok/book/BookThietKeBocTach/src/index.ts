/**
 * BookThietKeBocTach - Main export file
 * CAD Application for Door Design & BOM Calculation
 */

// Main Page Component
export { default as BookThietKeBocTachPage } from "./BookThietKeBocTachPage";

// Stores
export * from "./store";

// Hooks
export * from "./hooks";

// Core Engine
export { CadEngine } from "./core/engine/CadEngine";
export { ToolMode, SelectionMode } from "./core/engine/EngineState";
export type { ViewportState } from "./core/engine/EngineState";

// Geometry - exports first to establish Point2D and BoundingBox sources
export * from "./core/geometry";

// Entities - excluding duplicate exports
export {
  EntityType,
  GripType,
  UnifiedEntityType,
  DEFAULT_STYLE,
  DEFAULT_STATE,
  isLineEntity,
  isPolylineEntity,
  isRectEntity,
  isCircleEntity,
  isArcEntity,
  isEllipseEntity,
  isTextEntity,
  EntityFactory,
  entityFactory,
} from "./core/entities";
export type {
  IEntity,
  ILineEntity,
  IRectEntity,
  ICircleEntity,
  IArcEntity,
  IEllipseEntity,
  IPolylineEntity,
  ITextEntity,
  IDimensionEntity,
  EntityJSON,
  IEntityFactory,
  GripPoint,
  SelectionBox,
  HitTestResult,
  LineGeometry,
  PolylineGeometry,
  RectGeometry,
  CircleGeometry,
  ArcGeometry,
  EllipseGeometry,
  TextGeometry,
  EntityGeometry,
  EntityStyle,
  EntityState,
  UnifiedEntity,
} from "./core/entities";

// UI Components - Layout
export { CadLayout } from "./ui/layout2/CadLayout";
export { default as SidebarLeft } from "./ui/layout2/SidebarLeft";
export { default as SidebarRight } from "./ui/layout2/SidebarRight";
export { default as Header1 } from "./ui/layout2/Header1";
export { default as Header2 } from "./ui/layout2/Header2";
export { default as Header3 } from "./ui/layout2/Header3";

// UI Components - Toolbar
export { DrawToolbar } from "./ui/toolbar/DrawToolbar";
export { ModifyToolbar } from "./ui/toolbar/ModifyToolbar";
export { ViewToolbar } from "./ui/toolbar/ViewToolbar";

// UI Components - Panels
export { PropertiesPanel } from "./ui/panels/PropertiesPanel";
export { LayersPanel } from "./ui/panels/LayersPanel";
export { BomPanel } from "./ui/panels/BomPanel";
export { DoorLibraryPanel } from "./ui/panels/DoorLibraryPanel";

// UI Components - Common
export { Button } from "./ui/components/Button";
export { Modal } from "./ui/components/Modal";
export { Dropdown } from "./ui/components/Dropdown";

// Canvas
export { CadCanvas } from "./ui/canvas/CadCanvas";
