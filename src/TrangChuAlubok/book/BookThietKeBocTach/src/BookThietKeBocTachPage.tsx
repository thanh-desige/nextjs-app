/**
 * BookThietKeBocTachPage - Main page component for CAD application
 * Integrates all components: Canvas, Toolbar, Panels, Dialogs
 */

"use client";

import React, { useEffect, useState } from "react";

// Canvas - using CadDrawingCanvas for AutoCAD-style drawing
import { CadDrawingCanvas, type CadEntity } from "./ui";

// Layout Components from layout2 (unified layout)
import {
  Header1,
  Header2,
  Header3,
  SidebarLeft,
  SidebarRight,
} from "./ui/layout2";

// Toolbar
import { CommandPalette, defaultCommands } from "./ui/toolbar";

// Components
import { ColorPicker, Modal } from "./ui/components";
import { NotificationToast } from "./ui/components/NotificationToast";
import ProjectInfoDropdown from "./ui/components/ProjectInfoDropdown";
import { DoorTemplateOverlay } from "./ui/components/DoorTemplateOverlay";
import { DoorConfigDialog } from "./ui/components/DoorConfigDialog";
import { PageExportDialog } from "./ui/components/PageExportDialog";
import { ShareModal } from "./ui/components/ShareModal";
import { ImportDXFDialog } from "./ui/components/ImportDXFDialog";
import BomView from "./ui/views/BomView";
import CutListView from "./ui/views/CutListView";

// Hooks
import {
  useCadEngine,
  useSelection,
  usePanZoom,
  useDoorTemplates,
  useExport,
  useDimensions,
  useCanvasEntities,
  useModifyCommands,
  usePageCommands,
  useKeyboardShortcuts,
  useDoorHandlers,
  useToolbar,
  useStyleHandlers,
  usePageSettings,
  useProjectSync,
  type UseDoorHandlersParams,
} from "./hooks";
import { useCanvasEventHandlers } from "./hooks/useCanvasEventHandlers";

// Door Store (READ ONLY - không gọi mutations trực tiếp, dùng Commands)
import { useDoorStore } from "./store/doorStore";

// Stores
import { useEngineStore, useUIStore, useProjectStore } from "./store";

// NOTE: Canvas command imports (Move, Copy, Rotate, etc.) and Boundary
// moved to useModifyCommands hook (STEP-5.3)
// NOTE: AddDoorCommand + ClipboardManager moved to useCanvasEventHandlers (STEP-5.26)

// ==================== Main Page Component ====================

// ĐIỀU KIỆN 1: Controlled Mode Toggle
// Set to true to enable ĐIỀU KIỆN 1 compliance (UI → CadEngine → Document → History)
// Set to false to use legacy uncontrolled mode
const USE_CONTROLLED_MODE = true;

interface BookThietKeBocTachPageProps {
  mainSidebarCollapsed?: boolean;
  initialTab?: 'thietke' | 'filebom' | 'filebaogia';
}

export default function BookThietKeBocTachPage({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mainSidebarCollapsed = false,
  initialTab = 'thietke',
}: BookThietKeBocTachPageProps = {}) {
  // Canvas tab state
  const [activeCanvasTab, setActiveCanvasTab] = useState<'thietke' | 'filebom' | 'filebaogia'>(initialTab);

  // Local state - MUST be declared first
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerTarget] = useState<"stroke" | "fill">("stroke");
  const [currentColor, setCurrentColor] = useState("#FFFFFF");

  // UI collapse states
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  // Door Template Overlay + Config Dialog + Drag/Drop (STEP-5.5: extracted to useDoorHandlers)
  // States and handlers managed by useDoorHandlers hook (initialized after getDoor is available)

  // Command buffer for direct keyboard input (AutoCAD-style)
  const [commandBuffer, setCommandBuffer] = useState("");

  // Last executed command (for Space to repeat)
  const [lastCommand, setLastCommand] = useState("");

  // OFFSET distance state
  const [offsetDistance, setOffsetDistance] = useState<number | undefined>(
    undefined,
  );

  // Quick Copy Mode state - cho phép click liên tục để paste
  const [isQuickCopyMode, setIsQuickCopyMode] = useState(false);
  const [isPasteMode, setIsPasteMode] = useState(false);

  // ==================== RULE 2: Command Lock ====================
  // Track khi modal command đang tiến hành (đã click điểm 1)
  // Block phím chữ, chỉ cho phép số/coordinate input
  const [isDrawingInProgress, setIsDrawingInProgress] = useState(false);

  // Canvas entities - ĐIỀU KIỆN 1 compliant via useCanvasEntities
  const {
    entities: documentEntities,
    selectedIds: documentSelectedIds,
    selectedEntities: documentSelectedEntities,
    addEntity: addDocumentEntity,
    deleteEntities: deleteDocumentEntities,
    moveEntities: moveDocumentEntities,
    updateEntity: updateDocumentEntity,
    selectEntities: selectDocumentEntities,
    clearSelection: clearDocumentSelection,
    undo: documentUndo,
    redo: documentRedo,
  } = useCanvasEntities();

  // Legacy canvas entities state (only used when USE_CONTROLLED_MODE = false)
  const [legacyCanvasEntities, setLegacyCanvasEntities] = useState<CadEntity[]>([]);
  const [_legacyCanvasSelectedIds, setLegacyCanvasSelectedIds] = useState<string[]>([]);

  // Effective entities based on mode
  const canvasEntities = USE_CONTROLLED_MODE ? documentEntities : legacyCanvasEntities;

  // Engine initialization
  const {
    isReady,
    engine,
    setTool,
    activeTool,
    // undo/redo are handled by CadDrawingCanvas internally
    zoomFit,
    // STEP-1.3: selectedIds removed — use documentSelectedIds from useCanvasEntities
  } = useCadEngine();

  // Selection
  const { hasSelection, clearSelection, selectAll } = useSelection();

  // Phase 2: Sync door count + designRevision to project
  useProjectSync();

  // Door Templates
  const { selectedTemplate, insertTemplate, loadDefaultTemplates } =
    useDoorTemplates();

  // Pan/Zoom
  const { zoom } = usePanZoom();

  // Layers from engineStore (centralized)
  const activeLayerId = useEngineStore((state) => state.activeLayerId);

  const currentLayerId = activeLayerId;

  // Export (Phase 6)
  const { isExporting, export: exportDrawing } = useExport();

  // Dimensions (Phase 6)
  const {
    dimensions,
    toolState: dimensionToolState,
    startDimensionTool,
    cancelDimensionTool,
    handleClick: handleDimensionClick,
    handleMove: handleDimensionMove,
    startContinueMode,
    startBaselineMode,
    exitChainMode,
    toggleAutoSelectMode,
    previewDimension,
    addDimension,
    removeDimension,
    updateDimension,
    // Associative Dimensions - ALL REMOVED (now handled by TRỤC SỐNG in CadDocument)
    // syncAssociativeDimensions: removed - dimensions auto-update via lifecycle
    // handleEntityDeleted: removed - use CadDocument.handleEntityDeleted() instead
    // QDIM
    startQdim,
    setQdimEntities,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setQdimMode,
    confirmQdim,
    previewDimensions,
  } = useDimensions();

  // Page settings (STEP-5.22: extracted settings state, layers, textSettings, dim prompt)
  const {
    settings,
    onSettingsChange,
    textSettings,
    canvasLayers,
    exportLayers,
    showDimensions,
    effectiveDimScale,
    dimRounding,
    dimShowUnit,
    dimTextColor,
    dimLineColor,
    dimLineweight,
    dimExtensionGap,
    dimArrowStyle,
    canvasBgColor,
    osnapApertureSize,
    zoomFactor,
    exportTransparent,
    setExportTransparent,
    exportText,
    exportDim,
    exportMode,
  } = usePageSettings({ dimensionToolState });

  // Selected dimensions state
  const [selectedDimensionIds, setSelectedDimensionIds] = useState<string[]>(
    [],
  );

  // SidebarLeft width state (để ProjectInfoDropdown theo dõi)
  const [sidebarLeftWidth, setSidebarLeftWidth] = useState(250);

  // Lắng nghe sidebarResize event
  useEffect(() => {
    const handleSidebarResize = (e: CustomEvent<{ width: number }>) => {
      if (e.detail?.width) {
        setSidebarLeftWidth(e.detail.width);
      }
    };
    window.addEventListener(
      "sidebarResize",
      handleSidebarResize as EventListener,
    );
    return () => {
      window.removeEventListener(
        "sidebarResize",
        handleSidebarResize as EventListener,
      );
    };
  }, []);

  // Trigger counters for undo/redo/delete/clearSelection (to pass to CadDrawingCanvas)
  const [triggerUndo, setTriggerUndo] = useState(0);
  const [triggerRedo, setTriggerRedo] = useState(0);
  const [triggerDelete, setTriggerDelete] = useState(0);
  const [triggerClearSelection, setTriggerClearSelection] = useState(0);
  const [textScaleTrigger, setTextScaleTrigger] = useState(0);

  // Zoom fit trigger — read from engineStore, incremented by zoomFit()
  const zoomFitTrigger = useEngineStore((state) => state.zoomFitTrigger);

  // Polygon command input (for passing raw input to canvas when POLYGON is active)
  const [polygonCommandInput, setPolygonCommandInput] = useState<
    string | undefined
  >(undefined);

  // Store selectors
  const addNotification = useUIStore((state) => state.addNotification);
  const mouseWorld = useEngineStore((state) => state.mouseWorld);
  const grid = useEngineStore((state) => state.grid);
  const osnap = useEngineStore((state) => state.osnap);
  const orthoMode = useEngineStore((state) => state.orthoMode);
  // STEP-1.3: deleteEntities from engineStore removed — use deleteDocumentEntities from useCanvasEntities
  const currentStyle = useEngineStore((state) => state.currentStyle);
  const setCurrentStyle = useEngineStore((state) => state.setCurrentStyle);
  const getDocument = useEngineStore((state) => state.getDocument);

  // Style handlers (STEP-5.5: extracted to useStyleHandlers)
  const {
    displayStyle,
    hasSelectedEntity,
    handleStrokeColorChange,
    handleFillColorChange,
    handleOpacityChange,
    handleStrokeStyleChange,
    handleStrokeWidthChange,
    handleExport,
    handleColorChange,
  } = useStyleHandlers({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documentSelectedEntities: documentSelectedEntities as any,
    currentStyle,
    setCurrentStyle,
    updateDocumentEntity,
    addNotification,
    colorPickerTarget,
    setShowColorPicker,
    setCurrentColor,
    setShowExportDialog,
  });

  // Project store
  const projectInfo = useProjectStore((state) => state.currentProject);
  const calculateBom = useProjectStore((state) => state.calculateBom);

  // ĐIỀU KIỆN 1: executeCommandObject để thực thi Commands qua CadEngine
  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject,
  );

  // Door store - READ ONLY (G1 compliant)
  // KHÔNG gọi addDoor/updateDoor/removeDoor trực tiếp - dùng Commands
  const getDoor = useDoorStore((state) => state.getDoor);
  const getAllDoors = useDoorStore((state) => state.getAllDoors);
  const getSelectedDoors = useDoorStore((state) => state.getSelectedDoors);
  const clearDoorSelection = useDoorStore((state) => state.clearSelection);
  const _doors = getAllDoors();

  // Door handlers (STEP-5.5: extracted to useDoorHandlers)
  const {
    templateOverlayOpen,
    templateOverlayCategory,
    templateOverlaySubCategory,
    handleOpenTemplateOverlay,
    handleCloseTemplateOverlay,
    handleSelectTemplate,
    handleTemplateDragStart,
    configDialogOpen,
    configDialogDoor,
    configDialogDoorId,
    handleDoorDoubleClick,
    handleConfigDialogClose,
    handleConfigDialogConfirm,
    handleDoorDrop,
    handleDoorMove,
  } = useDoorHandlers({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeCommandObject: executeCommandObject as any,
    addNotification,
    getDoor: getDoor as UseDoorHandlersParams["getDoor"],
  });

  // Ref to hold handleCommand callback (avoids circular dependency)
  const handleCommandRef = React.useRef<(cmd: string) => void>(() => {});
  // Ref to hold handleExplodeCommand callback (avoids circular dependency)
  const handleExplodeCommandRef = React.useRef<() => void>(() => {});

  // Load default templates on mount
  useEffect(() => {
    loadDefaultTemplates();
  }, [loadDefaultTemplates]);

  // Handle keyboard shortcuts (STEP-5.3: extracted to useKeyboardShortcuts)
  useKeyboardShortcuts({
    documentEntities,
    documentSelectedIds,
    selectDocumentEntities: selectDocumentEntities,
    deleteDocumentEntities,
    clearDocumentSelection,
    clearSelection,
    hasSelection,
    selectAll,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSelectedDoors: getSelectedDoors as any,
    clearDoorSelection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeCommandObject: executeCommandObject as any,
    addNotification,
    dimensions,
    selectedDimensionIds,
    setSelectedDimensionIds,
    setIsPasteMode,
    setIsQuickCopyMode,
    isPasteMode,
    isQuickCopyMode,
    isDrawingInProgress,
    commandBuffer,
    setCommandBuffer,
    handleCommandRef,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    dimensionToolState,
    exitChainMode,
    cancelDimensionTool,
    setTool,
    activeTool,
    offsetDistance,
    setTriggerClearSelection,
    isLocked: projectInfo?.isLocked,
  });

  // Toolbar (STEP-5.5: extracted to useToolbar)
  const {
    toolGroups,
    osnapModes,
    activeToolString,
    handleSelectTool,
    handleToggleOsnapMode,
  } = useToolbar({
    activeTool,
    setTool,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startDimensionTool: startDimensionTool as any,
    cancelDimensionTool,
    startQdim,
    engine,
    zoomFit,
    setTriggerUndo,
    setTriggerRedo,
    setTriggerDelete,
    setShowExportDialog,
    setShowImportDialog,
    setShowShareModal,
    isLocked: projectInfo?.isLocked,
  });

  // Style handlers provided by useStyleHandlers hook (STEP-5.5)

  // Flashing tool state - for instant commands like ERASE that flash toolbar button
  // (Declared before useKeyboardShortcuts which references setFlashingTool)
  const [flashingTool, setFlashingTool] = useState<string | null>(null);

  // Handle command from Header3 command line (STEP-5.3: extracted to usePageCommands)
  const { handleCommand } = usePageCommands({
    handleSelectTool,
    setTool,
    activeTool,
    documentSelectedIds,
    deleteDocumentEntities,
    clearDocumentSelection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSelectedDoors: getSelectedDoors as any,
    clearDoorSelection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeCommandObject: executeCommandObject as any,
    addNotification,
    dimensionToolState,
    startContinueMode,
    startBaselineMode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startDimensionTool: startDimensionTool as any,
    cancelDimensionTool,
    startQdim,
    toggleAutoSelectMode,
    offsetDistance,
    setOffsetDistance,
    selectedDimensionIds,
    removeDimension,
    setSelectedDimensionIds,
    handleExplodeCommandRef,
    setFlashingTool,
    setPolygonCommandInput,
    setTextScaleTrigger,
    setIsCommandPaletteOpen,
    setLastCommand,
  });

  // Sync handleCommandRef with handleCommand to avoid circular dependency
  useEffect(() => {
    handleCommandRef.current = handleCommand;
  }, [handleCommand]);

  // Paste + canvas event callbacks (STEP-5.26: extracted to useCanvasEventHandlers)
  const {
    pastePreviewEntities,
    handlePasteClick,
    controlledModeProps,
    handleToggleAutoSelectMode: handleToggleAutoSelectModeCb,
    handleRepeatLastCommand,
    handleQdimSelectionConfirm,
    handleQdimConfirm,
    handleCanvasDimensionClick,
    handleDimensionSelectCb,
    handleDimensionDeleteCb,
    handleDimensionUpdateCb,
    handleDimensionCopyCb,
    handleCanvasMouseMove,
    handlePromptChange,
    handleCanvasEntityCreated,
    handleCanvasEntitiesChange,
    handleCanvasSelectionChanged,
    handleCanvasPlaceClick,
    handleProjectInfoChange,
  } = useCanvasEventHandlers({
    isPasteMode,
    documentEntities,
    documentSelectedIds,
    addDocumentEntity: addDocumentEntity as (entity: unknown) => void,
    deleteDocumentEntities,
    moveDocumentEntities,
    selectDocumentEntities,
    documentUndo,
    documentRedo,
    setLegacyCanvasEntities,
    setLegacyCanvasSelectedIds,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeCommandObject: executeCommandObject as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addNotification: addNotification as any,
    dimensionToolState,
    toggleAutoSelectMode,
    handleDimensionClick,
    handleDimensionMove,
    setSelectedDimensionIds,
    removeDimension,
    updateDimension,
    setQdimEntities,
    confirmQdim,
    lastCommand,
    handleCommand,
    selectedTemplate,
    insertTemplate,
  });

  // activeToolString provided by useToolbar hook (STEP-5.5)

  // Sidebar states
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  // flashingTool state declared earlier (before useKeyboardShortcuts)

  // Current step tracking for Command Steps Guide
  // This is updated by CadDrawingCanvas via onStepChange callback
  const [commandStep, setCommandStep] = useState(0);

  // Compute effective step - prioritize dimension tool step when dimension tool is active
  const effectiveCommandStep = dimensionToolState.isActive
    ? dimensionToolState.step
    : commandStep;

  // Dimension prompt effect moved to usePageSettings (STEP-5.22)

  // ==================== ĐIỀU KIỆN 1: Modify Command Handlers (STEP-5.3) ====================
  // Extracted to useModifyCommands hook
  const {
    handleModifyMoveComplete,
    handleModifyCopyComplete,
    handleModifyRotateComplete,
    handleModifyMirrorComplete,
    handleModifyScaleComplete,
    handleModifyOffsetComplete,
    handleTrimComplete,
    handleExtendComplete,
    handleExplodeCommand: _handleExplodeCommand,
    handleFilletComplete,
    handleBoundaryComplete,
  } = useModifyCommands({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeCommandObject: executeCommandObject as any,
    documentEntities,
    documentSelectedIds,
    addDocumentEntity: addDocumentEntity as (entity: unknown) => void,
    clearDocumentSelection,
    dimensions,
    updateDimension,
    addDimension,
    addNotification,
    setTool,
    getSelectedDoors: getSelectedDoors as unknown as () => {
      id: string;
      position: { x: number; y: number };
      [key: string]: unknown;
    }[],
    handleExplodeCommandRef,
  });

  // Door drag/drop handlers provided by useDoorHandlers hook (STEP-5.5)

  // Loading state
  if (!isReady) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#1E1E1E",
          color: "#fff",
        }}
      >
        <p>Đang tải CAD Engine...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "#1E1E1E",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header 1 - Tab Navigation (z-index: 100 to show dropdown above Header2) */}
      <div style={{ position: "relative", zIndex: 100 }}>
        <Header1
          activeTab={activeCanvasTab}
          onTabChange={(tab) => {
            setActiveCanvasTab(tab);
          }}
          autoSave={true}
          onAutoSaveChange={(enabled) => {
            console.log("Auto save:", enabled);
            // TODO: Handle auto save toggle
          }}
          isSaved={true}
          onBackClick={() => {
            console.log("Back clicked");
            // TODO: Handle back navigation
          }}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </div>

      {/* ── Tab: Thiết kế ── */}
      {activeCanvasTab === 'thietke' && (<>
      {/* Header 2 - Toolbar (z-index: 50 to show dropdown above canvas) */}
      <div style={{ position: "relative", zIndex: 50 }}>
        <Header2
          toolGroups={toolGroups}
          drawingMode={activeToolString}
          flashingTool={flashingTool}
          osnapModes={osnapModes}
          onSelectTool={handleSelectTool}
          onToggleOsnap={handleToggleOsnapMode}
          isCollapsed={isToolbarCollapsed}
          onToggle={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
          strokeColor={displayStyle.strokeColor}
          fillColor={displayStyle.fillColor}
          onStrokeColorChange={handleStrokeColorChange}
          onFillColorChange={handleFillColorChange}
          opacity={displayStyle.opacity}
          onOpacityChange={handleOpacityChange}
          strokeStyle={displayStyle.strokeStyle}
          onStrokeStyleChange={handleStrokeStyleChange}
          strokeWidth={displayStyle.strokeWidth}
          onStrokeWidthChange={handleStrokeWidthChange}
          isEditingSelection={hasSelectedEntity}
          selectedCount={documentSelectedEntities.length}
        />
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Project Info Dropdown - positioned on top left of canvas */}
        <ProjectInfoDropdown
          projectInfo={{
            name: projectInfo?.name || "Untitle Project",
            investor: projectInfo?.investor || "",
            investorPhone: projectInfo?.investorPhone || "",
            investorEmail: projectInfo?.investorEmail || "",
            houseNumber: projectInfo?.houseNumber || "",
            street: projectInfo?.street || "",
            ward: projectInfo?.ward || "",
            district: projectInfo?.district || "",
            city: projectInfo?.city || "",
            projectType: projectInfo?.projectType || "",
            area: projectInfo?.area,
            startDate: projectInfo?.startDate || "",
            expectedEndDate: projectInfo?.expectedEndDate || "",
            notes: projectInfo?.notes || "",
          }}
          onProjectInfoChange={handleProjectInfoChange}
          sidebarLeftWidth={sidebarLeftWidth}
        />

        {/* Canvas Area - Layer 1 (bottom layer, absolute full size) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
          }}
        >
          <CadDrawingCanvas
            activeTool={activeTool}
            showGrid={grid.visible}
            snapToGrid={grid.snapToGrid}
            gridSpacing={grid.minorSpacing}
            orthoMode={orthoMode}
            osnapEnabled={osnap.enabled}
            osnapModes={osnapModes}
            layers={canvasLayers}
            currentLayerId={currentLayerId}
            showDimensions={showDimensions}
            dimensions={dimensions}
            previewDimension={previewDimension}
            previewDimensions={previewDimensions}
            selectedDimensionIds={selectedDimensionIds}
            dimScale={effectiveDimScale}
            dimRounding={dimRounding}
            dimShowUnit={dimShowUnit}
            dimTextColor={dimTextColor}
            dimLineColor={dimLineColor}
            dimLineweight={dimLineweight}
            dimExtensionGap={dimExtensionGap}
            dimArrowStyle={dimArrowStyle}
            canvasBgColor={canvasBgColor}
            osnapApertureSize={osnapApertureSize}
            zoomFactor={zoomFactor}
            triggerUndo={triggerUndo}
            triggerRedo={triggerRedo}
            triggerDelete={triggerDelete}
            triggerClearSelection={triggerClearSelection}
            textScaleTrigger={textScaleTrigger}
            triggerZoomFit={zoomFitTrigger}
            currentStrokeStyle={currentStyle.strokeStyle}
            // ==================== TEXT Settings ====================
            textSettings={textSettings}
            // ĐIỀU KIỆN 1: Controlled Mode (STEP-5.26: computed in useCanvasEventHandlers)
            {...controlledModeProps}
            // Modify Command Callbacks
            onModifyMoveComplete={handleModifyMoveComplete}
            onModifyCopyComplete={handleModifyCopyComplete}
            onModifyRotateComplete={handleModifyRotateComplete}
            onModifyMirrorComplete={handleModifyMirrorComplete}
            onModifyScaleComplete={handleModifyScaleComplete}
            onModifyOffsetComplete={handleModifyOffsetComplete}
            onTrimComplete={handleTrimComplete}
            onExtendComplete={handleExtendComplete}
            onFilletComplete={handleFilletComplete}
            onBoundaryComplete={handleBoundaryComplete}
            offsetDistance={offsetDistance}
            // ==================== END Modify Command Callbacks ====================
            // ==================== DOOR DRAG & DROP ====================
            onDoorDrop={handleDoorDrop}
            onDoorDoubleClick={handleDoorDoubleClick}
            onDoorMove={handleDoorMove}
            onClearDoorSelection={clearDoorSelection}
            // ==================== END DOOR DRAG & DROP ====================
            // ==================== RULE 2: Command Lock ====================
            onDrawingStateChange={setIsDrawingInProgress}
            // ==================== END RULE 2 ====================
            // ==================== PASTE MODE (Ctrl+V) ====================
            pasteMode={isPasteMode}
            pastePreviewEntities={pastePreviewEntities}
            onPasteClick={handlePasteClick}
            // ==================== END PASTE MODE ====================
            // ==================== POLYGON Command Input ====================
            commandInput={polygonCommandInput}
            onCommandInputConsumed={() => setPolygonCommandInput(undefined)}
            // ==================== END POLYGON Command Input ====================
            // QDIM support
            qdimStep={
              dimensionToolState.dimensionType === "qdim"
                ? dimensionToolState.step
                : 0
            }
            // Dimension tool auto select mode
            dimensionToolStep={dimensionToolState.step}
            onToggleAutoSelectMode={handleToggleAutoSelectModeCb}
            onRepeatLastCommand={handleRepeatLastCommand}
            onQdimSelectionConfirm={handleQdimSelectionConfirm}
            onQdimConfirm={handleQdimConfirm}
            onDimensionClick={handleCanvasDimensionClick}
            onDimensionSelect={handleDimensionSelectCb}
            onDimensionDelete={handleDimensionDeleteCb}
            onDimensionUpdate={handleDimensionUpdateCb}
            onDimensionCopy={handleDimensionCopyCb}
            onMouseMove={handleCanvasMouseMove}
            onPromptChange={handlePromptChange}
            onEntityCreated={handleCanvasEntityCreated}
            onEntitiesChange={handleCanvasEntitiesChange}
            onSelectionChanged={handleCanvasSelectionChanged}
            onStepChange={setCommandStep}
            placeMode={selectedTemplate !== null}
            onPlaceClick={handleCanvasPlaceClick}
          />
        </div>

        {/* Phase 7: Lock Banner — read-only mode overlay */}
        {projectInfo?.isLocked && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 16,
              background: "rgba(220, 38, 38, 0.9)",
              color: "#fff",
              padding: "6px 20px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            🔒 Dự án đã khóa — Chế độ xem
          </div>
        )}

        {/* Left Sidebar - Layer 2 (above canvas, absolute positioning) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 15,
          }}
        >
          <SidebarLeft
            onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            onOpenTemplateOverlay={handleOpenTemplateOverlay}
          />
        </div>

        {/* Right Sidebar - Layer 2 (above canvas, absolute positioning) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 15,
          }}
        >
          <SidebarRight
            onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        </div>

        {/* "Xuất BOM" button — inside canvas, bottom-right (offset by sidebar width) */}
        <div style={{ position: 'absolute', bottom: 4, right: 284, zIndex: 18 }}>
          <button
            onClick={() => {
              calculateBom();
              setActiveCanvasTab('filebom');
            }}
            style={{
              padding: '10px 20px', borderRadius: 8,
              border: 'none', backgroundColor: '#f59e0b', color: '#1a1a2e',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            📊 Xuất BOM →
          </button>
        </div>
      </div>

      {/* Header 3 - Command Line / Status Bar (z-index: 20) */}
      <div style={{ position: "relative", zIndex: 20 }}>
        <Header3
          mouseX={mouseWorld.x}
          mouseY={mouseWorld.y}
          zoom={zoom * 100}
          onCommand={handleCommand}
          activeTool={activeToolString}
          currentStep={effectiveCommandStep}
          commandBuffer={commandBuffer}
          onCommandBufferChange={setCommandBuffer}
          onCommandExecuted={(cmd) => setLastCommand(cmd)}
        />
      </div>
      </>)}

      {/* ── Tab: Bóc tách (BOM) ── */}
      {activeCanvasTab === 'filebom' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <BomView />
        </div>
      )}

      {/* ── Tab: Danh sách cắt ── */}
      {activeCanvasTab === 'filebaogia' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CutListView />
        </div>
      )}

      {/* Command Palette Modal */}
      {isCommandPaletteOpen && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          commands={defaultCommands}
          onExecute={handleCommand}
        />
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <Modal
          isOpen={showColorPicker}
          onClose={() => setShowColorPicker(false)}
          title={colorPickerTarget === "stroke" ? "Màu nét vẽ" : "Màu fill"}
        >
          <ColorPicker value={currentColor} onChange={handleColorChange} />
        </Modal>
      )}

      {/* Export Dialog (STEP-5.22: extracted to PageExportDialog) */}
      <PageExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        selectedEntities={documentSelectedEntities}
        allEntities={canvasEntities}
        dimensions={dimensions}
        exportLayers={exportLayers}
        exportDrawing={exportDrawing}
        isExporting={isExporting}
        exportTransparent={exportTransparent}
        onExportTransparentChange={setExportTransparent}
        exportText={exportText}
        exportDim={exportDim}
        exportMode={exportMode}
        dimLineColor={dimLineColor}
        dimLineweight={dimLineweight}
        dimTextColor={dimTextColor}
        dimArrowStyle={dimArrowStyle}
        onExportPdf={() => handleExport("pdf")}
        projectTitle={projectInfo?.name || "drawing"}
      />

      {/* Door Template Overlay - Hiển thị khi click subcategory từ SidebarLeft */}
      <DoorTemplateOverlay
        isOpen={templateOverlayOpen}
        category={templateOverlayCategory}
        subCategory={templateOverlaySubCategory}
        onClose={handleCloseTemplateOverlay}
        onSelectTemplate={handleSelectTemplate}
        onDragStart={handleTemplateDragStart}
      />

      {/* Door Config Dialog - Hiển thị khi double-click cửa trên canvas */}
      <DoorConfigDialog
        key={configDialogDoorId || "no-door"}
        isOpen={configDialogOpen}
        door={configDialogDoor}
        onClose={handleConfigDialogClose}
        onConfirm={handleConfigDialogConfirm}
      />

      {/* Notification Toast - Hiển thị thông báo cho người dùng */}
      <NotificationToast />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        projectTitle={projectInfo?.name || "Dự án"}
        getDocumentData={() => getDocument()?.toJSON() ?? null}
      />

      {/* Import DXF Dialog */}
      {showImportDialog && (
        <ImportDXFDialog
          onClose={() => setShowImportDialog(false)}
          getEngine={() => useEngineStore.getState().engine}
          zoomFit={zoomFit}
        />
      )}
    </div>
  );
}
