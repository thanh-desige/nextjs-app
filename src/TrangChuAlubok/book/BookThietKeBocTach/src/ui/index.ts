/**
 * UI Module - Main Barrel Export
 *
 * Exports all UI components for the CAD application
 */

// ==================== Canvas ====================
export {
  CadCanvas,
  type CadCanvasProps,
  type CadCanvasRef,
} from "./canvas/CadCanvas";

export {
  CadDrawingCanvas,
  type CadDrawingCanvasProps,
  type CadEntity,
  type Point,
} from "./canvas/CadDrawingCanvas";

// ==================== Toolbar ====================
export {
  DrawToolbar,
  ModifyToolbar,
  ViewToolbar,
  StatusBar,
  CommandPalette,
  defaultCommands,
  type DrawTool,
  type DrawToolbarProps,
  type ModifyTool,
  type ModifyToolbarProps,
  type ViewAction,
  type ViewToolbarProps,
  type StatusBarProps,
  type CommandDefinition,
  type CommandPaletteProps,
} from "./toolbar";

// ==================== Panels ====================
export {
  PropertiesPanel,
  LayersPanel,
  BomPanel,
  DoorLibraryPanel,
  QuotePanel,
  ProjectPanel,
  type PropertyValue,
  type PropertyGroup,
  type PropertiesPanelProps,
  type Layer,
  type LayersPanelProps,
  type BomPanelProps,
  type DoorLibraryPanelProps,
  type QuoteItem,
  type QuotePanelProps,
  type Project,
  type ProjectPanelProps,
} from "./panels";

// Layer Panel (Advanced)
export { LayerPanel } from "./panels/LayerPanel";
export type { LayerPanelProps } from "./panels/LayerPanel";

// History Panel
export { HistoryPanel } from "./panels/HistoryPanel";
export type { HistoryItem, HistoryPanelProps } from "./panels/HistoryPanel";

// Dimension Panel
export { DimensionPanel } from "./panels/DimensionPanel";

// ==================== Layout ====================
export {
  CadLayout,
  Header1,
  Header2,
  Header3,
  SidebarLeft,
  SidebarRight,
  type PanelPosition,
  type PanelConfig,
  type CadLayoutProps,
} from "./layout2";

// ==================== Components ====================
export {
  Button,
  Input,
  Modal,
  Dropdown,
  ColorPicker,
  type ButtonVariant,
  type ButtonSize,
  type ButtonProps,
  type InputSize,
  type InputProps,
  type ModalSize,
  type ModalProps,
  type DropdownOption,
  type DropdownProps,
  type ColorPickerProps,
} from "./components";

// Export Dialog
export { ExportDialog } from "./components/ExportDialog";
export type {
  ExportSettings,
  ExportDialogProps,
} from "./components/ExportDialog";
