/**
 * BookThietKeBocTachPage - Main page component for CAD application
 * Integrates all components: Canvas, Toolbar, Panels, Dialogs
 */

"use client";

import React, { useEffect, useCallback, useState, useMemo } from "react";

// Canvas - using CadDrawingCanvas for AutoCAD-style drawing
import { CadDrawingCanvas, type CadEntity, type Point } from "./ui";

// Layout Components from layout1
import {
  Header1,
  Header2,
  Header3,
  SidebarLeft,
  SidebarRight,
} from "../layout1";

// Toolbar
import { CommandPalette, defaultCommands } from "./ui/toolbar";

// Components
import { ColorPicker, Modal } from "./ui/components";

// Hooks
import {
  useCadEngine,
  useSelection,
  usePanZoom,
  useDoorTemplates,
  useExport,
  useDimensions,
  useCanvasEntities,
} from "./hooks";

// Stores
import { useEngineStore, useUIStore, useProjectStore } from "./store";
import { ToolMode } from "./core/engine/EngineState";

// Commands - ĐIỀU KIỆN 1: Import CanvasEntityCommands (đúng file structure)
import {
  MoveCanvasEntitiesCommand,
  CopyCanvasEntitiesCommand,
  RotateCanvasEntitiesCommand,
  MirrorCanvasEntitiesCommand,
  ScaleCanvasEntitiesCommand,
  OffsetCanvasEntityCommand,
} from "./core/commands/canvas";

// ==================== Main Page Component ====================

// ĐIỀU KIỆN 1: Controlled Mode Toggle
// Set to true to enable ĐIỀU KIỆN 1 compliance (UI → CadEngine → Document → History)
// Set to false to use legacy uncontrolled mode
const USE_CONTROLLED_MODE = true;

interface BookThietKeBocTachPageProps {
  mainSidebarCollapsed?: boolean;
}

export default function BookThietKeBocTachPage({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mainSidebarCollapsed = false,
}: BookThietKeBocTachPageProps = {}) {
  // Local state - MUST be declared first
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerTarget] = useState<"stroke" | "fill">("stroke");
  const [currentColor, setCurrentColor] = useState("#FFFFFF");

  // UI collapse states
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  // Command buffer for direct keyboard input (AutoCAD-style)
  const [commandBuffer, setCommandBuffer] = useState("");

  // Last executed command (for Space to repeat)
  const [lastCommand, setLastCommand] = useState("");

  // OFFSET distance state
  const [offsetDistance, setOffsetDistance] = useState<number | undefined>(
    undefined
  );

  // Canvas entities - ĐIỀU KIỆN 1 compliant via useCanvasEntities
  const {
    entities: documentEntities,
    selectedIds: documentSelectedIds,
    addEntity: addDocumentEntity,
    deleteEntities: deleteDocumentEntities,
    moveEntities: moveDocumentEntities,
    selectEntities: selectDocumentEntities,
    undo: documentUndo,
    redo: documentRedo,
  } = useCanvasEntities();

  // Legacy canvas entities state (only used when USE_CONTROLLED_MODE = false)
  const [legacyCanvasEntities, setLegacyCanvasEntities] = useState<CadEntity[]>(
    []
  );
  const [legacyCanvasSelectedIds, setLegacyCanvasSelectedIds] = useState<
    string[]
  >([]);

  // Effective entities based on mode
  const canvasEntities = USE_CONTROLLED_MODE
    ? documentEntities
    : legacyCanvasEntities;
  // _canvasSelectedIds is available for future use when needed
  const _canvasSelectedIds = USE_CONTROLLED_MODE
    ? documentSelectedIds
    : legacyCanvasSelectedIds;
  void _canvasSelectedIds; // Suppress unused warning

  // Engine initialization
  const {
    isReady,
    engine,
    setTool,
    activeTool,
    // undo/redo are handled by CadDrawingCanvas internally
    zoomFit,
    selectedIds,
  } = useCadEngine();

  // Selection
  const { hasSelection, clearSelection, selectAll } = useSelection();

  // Door Templates
  const { selectedTemplate, insertTemplate, loadDefaultTemplates } =
    useDoorTemplates();

  // Pan/Zoom
  const { zoom } = usePanZoom();

  // Layers from engineStore (centralized)
  const storeLayers = useEngineStore((state) => state.layers);
  const activeLayerId = useEngineStore((state) => state.activeLayerId);

  // Convert LayerData to LayerInfo for CadDrawingCanvas (include all style properties)
  const canvasLayers = useMemo(
    () =>
      storeLayers.map((l) => ({
        id: l.id,
        visible: l.state?.visible !== false,
        locked: l.state?.locked === true,
        color: l.color,
        // Extended style properties for ByLayer rendering
        fillColor: l.fillColor,
        opacity: l.opacity,
        lineType: l.lineType,
        lineWeight: l.lineWeight,
      })),
    [storeLayers]
  );

  // Convert LayerData to Layer for export (full properties)
  const exportLayers = useMemo(
    () =>
      storeLayers.map((l, index) => ({
        id: l.id,
        name: l.name,
        color: l.color,
        lineWeight: l.lineWeight,
        visible: l.state?.visible !== false,
        locked: l.state?.locked === true,
        frozen: l.state?.frozen === true,
        order: index,
      })),
    [storeLayers]
  );

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
    removeDimension,
    updateDimension,
    // QDIM
    startQdim,
    setQdimEntities,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setQdimMode,
    confirmQdim,
    previewDimensions,
  } = useDimensions();

  // Selected dimensions state
  const [selectedDimensionIds, setSelectedDimensionIds] = useState<string[]>(
    []
  );

  // Trigger counters for undo/redo/delete/clearSelection (to pass to CadDrawingCanvas)
  const [triggerUndo, setTriggerUndo] = useState(0);
  const [triggerRedo, setTriggerRedo] = useState(0);
  const [triggerDelete, setTriggerDelete] = useState(0);
  const [triggerClearSelection, setTriggerClearSelection] = useState(0);
  const [textScaleTrigger, setTextScaleTrigger] = useState(0);

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
  const deleteEntities = useEngineStore((state) => state.deleteEntities);
  const currentStyle = useEngineStore((state) => state.currentStyle);
  const setCurrentStyle = useEngineStore((state) => state.setCurrentStyle);

  // Project store
  const projectInfo = useProjectStore((state) => state.currentProject);

  // ĐIỀU KIỆN 1: executeCommandObject để thực thi Commands qua CadEngine
  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject
  );

  // Ref to hold handleCommand callback (avoids circular dependency)
  const handleCommandRef = React.useRef<(cmd: string) => void>(() => {});

  // Load default templates on mount
  useEffect(() => {
    loadDefaultTemplates();
  }, [loadDefaultTemplates]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // NOTE: Undo/Redo (Ctrl+Z/Y) is handled by CadDrawingCanvas directly
      // to manage canvas entities history

      // Select all
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      // Delete
      if (e.key === "Delete" && hasSelection) {
        e.preventDefault();
        deleteEntities(selectedIds);
        clearSelection();
        return;
      }

      // Escape - cancel command buffer, selection and switch to Select tool
      if (e.key === "Escape") {
        e.preventDefault();
        setCommandBuffer(""); // Clear command buffer
        clearSelection();
        setTriggerClearSelection((prev) => prev + 1);
        if (
          dimensionToolState.isContinueMode ||
          dimensionToolState.isBaselineMode
        ) {
          exitChainMode();
        } else {
          cancelDimensionTool();
          setTool(ToolMode.SELECT);
        }
        setIsCommandPaletteOpen(false);
        return;
      }

      // Enter or Space - execute command buffer if not empty
      if (e.key === "Enter" || e.key === " ") {
        if (commandBuffer.trim()) {
          e.preventDefault();
          handleCommandRef.current(commandBuffer.trim());
          setCommandBuffer("");
          return;
        }
        // If buffer empty, let CadDrawingCanvas handle Space/Enter
        // (for finishing line drawing, repeat last command, etc.)
        // Don't intercept here - just return without preventDefault
        return;
      }

      // Backspace - remove last character from buffer
      if (e.key === "Backspace") {
        e.preventDefault();
        setCommandBuffer((prev) => prev.slice(0, -1));
        return;
      }

      // Command palette
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Alphanumeric keys - add to command buffer (no Ctrl/Alt)
      if (
        !e.ctrlKey &&
        !e.altKey &&
        e.key.length === 1 &&
        /[a-zA-Z0-9]/.test(e.key)
      ) {
        e.preventDefault();
        setCommandBuffer((prev) => prev + e.key.toUpperCase());
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectAll,
    hasSelection,
    deleteEntities,
    selectedIds,
    clearSelection,
    setTool,
    dimensionToolState.isContinueMode,
    dimensionToolState.isBaselineMode,
    exitChainMode,
    cancelDimensionTool,
    commandBuffer,
  ]);

  // Tool groups for Header2 layout1
  const toolGroups = useMemo(
    () => [
      {
        name: "Draw",
        color: "#c6e0b4",
        tools: [
          { id: "select", label: "Select" },
          { id: "line", label: "Line (L)" },
          { id: "rect", label: "Rect (R)" },
          { id: "arc", label: "Arc (A)" },
          { id: "circle", label: "Circle (C)" },
          { id: "polygon", label: "Polygon (POL)" },
          { id: "text", label: "Text (T)" },
        ],
      },
      {
        name: "Modify",
        color: "#b4c6e0",
        tools: [
          { id: "copy", label: "Copy (CO)" },
          { id: "move", label: "Move (M)" },
          { id: "rotate", label: "Rotate (RO)" },
          { id: "scale", label: "Scale (SC)" },
          { id: "mirror", label: "Mirror (MI)" },
          { id: "offset", label: "Offset (O)" },
          { id: "trim", label: "Trim (TR)" },
          { id: "extend", label: "Extend (EX)" },
          { id: "fillet", label: "Fillet (F)" },
          { id: "erase", label: "Erase (E)" },
        ],
      },
      {
        name: "Dimensions",
        color: "#e0c6b4",
        tools: [
          { id: "dim-linear", label: "Linear (DLI)" },
          { id: "dim-aligned", label: "Aligned (DAL)" },
          { id: "dim-angular", label: "Angular (DAN)" },
          { id: "dim-radius", label: "Radius (DRA)" },
          { id: "qdim", label: "Qdim (QD)" },
          { id: "dimcontinue", label: "DContinue (DCO)" },
          { id: "dimarc", label: "Dimarc (DAR)" },
        ],
      },
      {
        name: "Osnap",
        color: "#e0e0b4",
        tools: [
          { id: "endpoint", label: "Endpoint" },
          { id: "midpoint", label: "Midpoint" },
          { id: "center", label: "Center" },
          { id: "intersection", label: "Intersect" },
          { id: "perpendicular", label: "Perpend" },
          { id: "nearest", label: "Nearest" },
        ],
      },
      {
        name: "View",
        color: "#b4e0c6",
        tools: [
          { id: "zoom-in", label: "Zoom In" },
          { id: "zoom-out", label: "Zoom Out" },
          { id: "zoom-fit", label: "Fit" },
          { id: "pan", label: "Pan" },
        ],
      },
      {
        name: "Tools",
        color: "#e0b4c6",
        tools: [
          { id: "undo", label: "Undo" },
          { id: "redo", label: "Redo" },
          { id: "delete", label: "Delete" },
          { id: "export", label: "Export" },
        ],
      },
    ],
    []
  );

  // Osnap modes state for Header2
  const [osnapModes, setOsnapModes] = useState<Record<string, boolean>>({
    endpoint: true,
    midpoint: true,
    center: true,
    intersection: false,
    perpendicular: false,
    nearest: false,
  });

  // Handle tool change from toolbar - MUST be before handleSelectTool
  const handleToolChange = useCallback(
    (tool: string) => {
      const toolMap: Record<string, ToolMode> = {
        select: ToolMode.SELECT,
        line: ToolMode.DRAW_LINE,
        rect: ToolMode.DRAW_RECT,
        circle: ToolMode.DRAW_CIRCLE,
        arc: ToolMode.DRAW_ARC,
        polygon: ToolMode.DRAW_POLYGON,
        polyline: ToolMode.DRAW_POLYGON, // Polyline uses DRAW_POLYGON mode
        ellipse: ToolMode.DRAW_ELLIPSE,
        text: ToolMode.DRAW_TEXT,
        dimension: ToolMode.DRAW_DIMENSION,
        "dim-linear": ToolMode.DRAW_DIM_LINEAR,
        "dim-aligned": ToolMode.DRAW_DIM_ALIGNED,
        "dim-angular": ToolMode.DRAW_DIM_ANGULAR,
        "dim-radius": ToolMode.DRAW_DIM_RADIUS,
        qdim: ToolMode.DRAW_QDIM,
        dimcontinue: ToolMode.DRAW_DIMCONTINUE,
        dimarc: ToolMode.DRAW_DIMARC,
        // Modify tools
        move: ToolMode.MOVE,
        copy: ToolMode.COPY,
        rotate: ToolMode.ROTATE,
        scale: ToolMode.SCALE,
        mirror: ToolMode.MIRROR,
        offset: ToolMode.OFFSET,
        trim: ToolMode.TRIM,
        extend: ToolMode.EXTEND,
        fillet: ToolMode.FILLET,
      };

      const mode = toolMap[tool] || ToolMode.SELECT;
      setTool(mode);

      // Start dimension tool if it's a dimension mode
      const dimensionTypeMap: Record<
        string,
        "linear" | "aligned" | "angular" | "radius" | "arc"
      > = {
        "dim-linear": "linear",
        "dim-aligned": "aligned",
        "dim-angular": "angular",
        "dim-radius": "radius",
        dimension: "linear",
        dimcontinue: "linear", // Continue dimension uses last type
        dimarc: "arc",
      };

      // QDIM uses special handler
      if (tool === "qdim") {
        startQdim();
      } else if (dimensionTypeMap[tool]) {
        startDimensionTool(dimensionTypeMap[tool]);
      } else {
        cancelDimensionTool();
      }

      // Debug log
      console.log("Tool changed to:", tool, "→", mode);
    },
    [setTool, startDimensionTool, cancelDimensionTool, startQdim]
  );

  // Handle tool selection from Header2
  const handleSelectTool = useCallback(
    (toolId: string) => {
      // Handle view tools
      if (toolId === "zoom-in") {
        if (engine) engine.zoom(1.25);
        return;
      }
      if (toolId === "zoom-out") {
        if (engine) engine.zoom(1 / 1.25);
        return;
      }
      if (toolId === "zoom-fit") {
        zoomFit();
        return;
      }
      if (toolId === "undo") {
        setTriggerUndo((prev) => prev + 1);
        return;
      }
      if (toolId === "redo") {
        setTriggerRedo((prev) => prev + 1);
        return;
      }
      if (toolId === "delete" || toolId === "erase") {
        setTriggerDelete((prev) => prev + 1);
        return;
      }
      if (toolId === "export") {
        setShowExportDialog(true);
        return;
      }

      // Handle drawing tools
      handleToolChange(toolId);
    },
    [engine, zoomFit, handleToolChange]
  );

  // Handle osnap toggle from Header2
  const handleToggleOsnapMode = useCallback((modeId: string) => {
    setOsnapModes((prev) => ({
      ...prev,
      [modeId]: !prev[modeId],
    }));
  }, []);

  // Handle stroke color change from Header2
  const handleStrokeColorChange = useCallback(
    (color: string) => {
      setCurrentStyle({ strokeColor: color });
    },
    [setCurrentStyle]
  );

  // Handle fill color change from Header2
  const handleFillColorChange = useCallback(
    (color: string | null) => {
      setCurrentStyle({ fillColor: color });
    },
    [setCurrentStyle]
  );

  // Handle opacity change from Header2
  const handleOpacityChange = useCallback(
    (opacity: number) => {
      setCurrentStyle({ opacity });
    },
    [setCurrentStyle]
  );

  // Handle stroke style change from Header2
  const handleStrokeStyleChange = useCallback(
    (strokeStyle: "solid" | "dashed" | "dotted" | "dashdot") => {
      setCurrentStyle({ strokeStyle });
    },
    [setCurrentStyle]
  );

  // Handle stroke width change from Header2
  const handleStrokeWidthChange = useCallback(
    (strokeWidth: number) => {
      setCurrentStyle({ strokeWidth });
    },
    [setCurrentStyle]
  );

  // Handle export
  const handleExport = useCallback(
    async (format: string) => {
      try {
        addNotification({
          type: "info",
          title: "Export",
          message: `Đang xuất file ${format.toUpperCase()}...`,
          duration: 2000,
        });

        // Export logic would go here
        setShowExportDialog(false);

        addNotification({
          type: "success",
          title: "Export",
          message: `Xuất ${format.toUpperCase()} thành công!`,
          duration: 3000,
        });
      } catch (error) {
        addNotification({
          type: "error",
          title: "Export Error",
          message: `Lỗi khi xuất file: ${error}`,
          duration: 5000,
        });
      }
    },
    [addNotification]
  );

  // Handle color change
  const handleColorChange = useCallback(
    (color: string) => {
      setCurrentColor(color);
      const setCurrentStyle = useEngineStore.getState().setCurrentStyle;

      if (colorPickerTarget === "stroke") {
        setCurrentStyle({ strokeColor: color });
      } else {
        setCurrentStyle({ fillColor: color });
      }

      setShowColorPicker(false);
    },
    [colorPickerTarget]
  );

  // Handle command from Header3 command line
  const handleCommand = useCallback(
    (command: string) => {
      setIsCommandPaletteOpen(false);

      // Normalize command to lowercase
      const cmd = command.toLowerCase().trim();

      // Track last command for Space repeat (exclude empty commands)
      if (cmd) {
        setLastCommand(cmd);
      }

      // ==================== POLYGON Input Handling ====================
      // When POLYGON is active, pass raw input to canvas for number/option handling
      if (activeTool === ToolMode.DRAW_POLYGON) {
        // Check if it's a number or option (E, I, C)
        const isNumber = /^\d+$/.test(cmd);
        const isOption = /^[eic]$/.test(cmd);
        const isEnter = cmd === ""; // Empty = Enter with default value

        if (isNumber || isOption || isEnter) {
          setPolygonCommandInput(command.trim());
          return;
        }
      }

      // Empty command: Toggle autoSelectMode if dimension tool is active
      if (!cmd && dimensionToolState.isActive) {
        // Toggle first, then show notification with NEW state
        const newAutoSelectMode = !dimensionToolState.autoSelectMode;
        toggleAutoSelectMode();
        addNotification({
          type: "info",
          title: newAutoSelectMode ? "Chế độ chọn nhanh" : "Chế độ thường",
          message: newAutoSelectMode
            ? "Click vào đối tượng để tạo dimension"
            : "Click chọn điểm 1 và điểm 2",
          duration: 2000,
        });
        return;
      }

      // Map command actions to tool selection
      const toolActions = [
        "line",
        "rect",
        "circle",
        "arc",
        "ellipse",
        "polyline",
        "text",
        "select",
        "move",
        "copy",
        "rotate",
        "scale",
        "mirror",
        "dim-linear",
        "dim-aligned",
        "dim-angular",
        "dim-radius",
        "qdim",
        "dimcontinue",
        "dimarc",
        "zoom-in",
        "zoom-out",
        "zoom-fit",
        "pan",
        "undo",
        "redo",
        "delete",
        "export",
      ];

      if (toolActions.includes(cmd)) {
        // This is a tool action, trigger handleSelectTool
        handleSelectTool(cmd);
      } else if (cmd === "qd") {
        // QD - Quick dim
        setTool(ToolMode.DRAW_QDIM);
        startQdim();
      } else if (cmd === "dco") {
        // DCO - Dimcontinue: kích thước nối tiếp
        const success = startContinueMode();
        if (success) {
          setTool(ToolMode.DRAW_DIMCONTINUE);
        } else {
          addNotification({
            type: "warning",
            title: "DIMCONTINUE",
            message:
              "Cần có dimension trước đó. Hãy vẽ dimension trước (DLI, DAL...)",
            duration: 3000,
          });
        }
      } else if (cmd === "dba") {
        // DBA - Dimbaseline: kích thước bậc thang
        const success = startBaselineMode();
        if (success) {
          setTool(ToolMode.DRAW_DIMCONTINUE);
        } else {
          addNotification({
            type: "warning",
            title: "DIMBASELINE",
            message:
              "Cần có dimension trước đó. Hãy vẽ dimension trước (DLI, DAL...)",
            duration: 3000,
          });
        }
      } else if (cmd === "dar") {
        // DAR - Dimarc: đo chiều dài cung
        setTool(ToolMode.DRAW_DIMARC);
        startDimensionTool("arc");
      } else if (cmd === "dli") {
        // DLI - Dimlinear: tự động ngang/dọc
        setTool(ToolMode.DRAW_DIM_LINEAR);
        startDimensionTool("linear");
      } else if (cmd === "dho" || cmd === "dimhorizontal") {
        // DHO - Horizontal dimension: cưỡng ép ngang
        setTool(ToolMode.DRAW_DIM_LINEAR);
        startDimensionTool("horizontal");
      } else if (cmd === "dve" || cmd === "dimvertical") {
        // DVE - Vertical dimension: cưỡng ép dọc
        setTool(ToolMode.DRAW_DIM_LINEAR);
        startDimensionTool("vertical");
      } else if (cmd === "dal") {
        // DAL - Dimaligned: song song cạnh
        setTool(ToolMode.DRAW_DIM_ALIGNED);
        startDimensionTool("aligned");
      } else if (cmd === "dan") {
        // DAN - Dimangular: đo góc
        setTool(ToolMode.DRAW_DIM_ANGULAR);
        startDimensionTool("angular");
      } else if (cmd === "dra") {
        // DRA - Dimradius: đo bán kính
        setTool(ToolMode.DRAW_DIM_RADIUS);
        startDimensionTool("radius");
      } else if (cmd === "l" || cmd === "line") {
        // L - Line tool
        setTool(ToolMode.DRAW_LINE);
      } else if (
        cmd === "r" ||
        cmd === "rec" ||
        cmd === "rect" ||
        cmd === "rectangle"
      ) {
        // R - Rectangle tool
        setTool(ToolMode.DRAW_RECT);
      } else if (cmd === "c" || cmd === "circle") {
        // C - Circle tool
        setTool(ToolMode.DRAW_CIRCLE);
      } else if (cmd === "a" || cmd === "arc") {
        // A - Arc tool
        setTool(ToolMode.DRAW_ARC);
      } else if (cmd === "el" || cmd === "ellipse") {
        // EL - Ellipse tool
        setTool(ToolMode.DRAW_ELLIPSE);
      } else if (cmd === "pl" || cmd === "pline" || cmd === "polyline") {
        // PL - Polyline tool
        setTool(ToolMode.DRAW_POLYGON);
      } else if (cmd === "pol" || cmd === "polygon") {
        // POL - Polygon tool (đa giác đóng)
        setTool(ToolMode.DRAW_POLYGON);
      } else if (
        cmd === "t" ||
        cmd === "text" ||
        cmd === "dt" ||
        cmd === "dtext"
      ) {
        // T - Text tool
        setTool(ToolMode.DRAW_TEXT);
      } else if (cmd === "m" || cmd === "move") {
        // M - Move tool
        setTool(ToolMode.MOVE);
      } else if (cmd === "co" || cmd === "cp" || cmd === "copy") {
        // CO/CP - Copy tool
        setTool(ToolMode.COPY);
      } else if (cmd === "ro" || cmd === "rotate") {
        // RO - Rotate tool
        setTool(ToolMode.ROTATE);
      } else if (cmd === "sc" || cmd === "scale") {
        // SC - Scale tool
        setTool(ToolMode.SCALE);
      } else if (cmd === "mi" || cmd === "mirror") {
        // MI - Mirror tool
        setTool(ToolMode.MIRROR);
      } else if (cmd === "tr" || cmd === "trim") {
        // TR - Trim tool
        setTool(ToolMode.TRIM);
      } else if (cmd === "ex" || cmd === "extend") {
        // EX - Extend tool
        setTool(ToolMode.EXTEND);
      } else if (cmd === "o" || cmd === "offset") {
        // O - Offset tool
        setTool(ToolMode.OFFSET);
        setOffsetDistance(undefined); // Reset distance when starting new offset
      } else if (cmd === "f" || cmd === "fillet") {
        // F - Fillet tool
        setTool(ToolMode.FILLET);
      } else if (cmd === "z" || cmd === "zoom") {
        // Z - Zoom (zoom fit)
        handleSelectTool("zoom-fit");
      } else if (cmd === "p" || cmd === "pan") {
        // P - Pan tool
        setTool(ToolMode.PAN);
      } else if (cmd === "u" || cmd === "undo") {
        // U - Undo
        handleSelectTool("undo");
      } else if (cmd === "redo") {
        // Redo
        handleSelectTool("redo");
      } else if (
        cmd === "e" ||
        cmd === "erase" ||
        cmd === "del" ||
        cmd === "delete"
      ) {
        // E - Erase/Delete
        handleSelectTool("delete");
      } else if (cmd === "escape" || cmd === "esc") {
        // Cancel current action
        cancelDimensionTool();
        setTool(ToolMode.SELECT);
      } else if (cmd === "grid") {
        useEngineStore.setState((state) => ({
          grid: { ...state.grid, visible: !state.grid.visible },
        }));
      } else if (cmd === "ortho") {
        useEngineStore.setState((state) => ({
          orthoMode: !state.orthoMode,
        }));
      } else if (cmd === "snap" || cmd === "osnap") {
        useEngineStore.setState((state) => ({
          osnap: { ...state.osnap, enabled: !state.osnap.enabled },
        }));
      } else if (cmd === "x" || cmd === "textscale") {
        // X - Text Scale: trigger scale dialog for selected text entities
        // This is handled by CadDrawingCanvas via textScaleTrigger
        setTextScaleTrigger((prev) => prev + 1);
      } else if (/^\d+(\.\d+)?$/.test(cmd)) {
        // Numeric input - check if we're in OFFSET mode waiting for distance
        const currentTool = useEngineStore.getState().activeTool;
        if (currentTool === ToolMode.OFFSET && offsetDistance === undefined) {
          const dist = parseFloat(cmd);
          if (!isNaN(dist) && dist > 0) {
            setOffsetDistance(dist);
            addNotification({
              type: "info",
              title: "OFFSET",
              message: `Distance set to ${dist}. Select object to offset.`,
              duration: 2000,
            });
          }
        }
      } else {
        // Try to execute as engine command
        const executeCommand = useEngineStore.getState().executeCommand;
        executeCommand(cmd);
      }
    },
    [
      handleSelectTool,
      setTool,
      startContinueMode,
      startBaselineMode,
      startDimensionTool,
      cancelDimensionTool,
      startQdim,
      addNotification,
      dimensionToolState.isActive,
      dimensionToolState.autoSelectMode,
      toggleAutoSelectMode,
      offsetDistance,
      activeTool,
    ]
  );

  // Sync handleCommandRef with handleCommand to avoid circular dependency
  useEffect(() => {
    handleCommandRef.current = handleCommand;
  }, [handleCommand]);

  // Get tool string for toolbar (DrawTool type: 'select' | 'line' | 'rect' | 'circle' | 'arc' | 'polyline' | 'text' | 'dimension')
  const activeToolString = useMemo(() => {
    const reverseMap: Record<ToolMode, string> = {
      [ToolMode.SELECT]: "select",
      [ToolMode.DRAW_LINE]: "line",
      [ToolMode.DRAW_RECT]: "rect",
      [ToolMode.DRAW_CIRCLE]: "circle",
      [ToolMode.DRAW_ARC]: "arc",
      [ToolMode.DRAW_POLYGON]: "polygon",
      [ToolMode.DRAW_ELLIPSE]: "ellipse",
      [ToolMode.DRAW_TEXT]: "text",
      [ToolMode.DRAW_DIMENSION]: "dimension",
      [ToolMode.DRAW_DIM_LINEAR]: "dim-linear",
      [ToolMode.DRAW_DIM_ALIGNED]: "dim-aligned",
      [ToolMode.DRAW_DIM_ANGULAR]: "dim-angular",
      [ToolMode.DRAW_DIM_RADIUS]: "dim-radius",
      [ToolMode.DRAW_QDIM]: "qdim",
      [ToolMode.DRAW_DIMCONTINUE]: "dimcontinue",
      [ToolMode.DRAW_DIMARC]: "dimarc",
      [ToolMode.PAN]: "pan",
      [ToolMode.ZOOM]: "zoom",
      [ToolMode.MOVE]: "move",
      [ToolMode.COPY]: "copy",
      [ToolMode.ROTATE]: "rotate",
      [ToolMode.SCALE]: "scale",
      [ToolMode.MIRROR]: "mirror",
      [ToolMode.TRIM]: "trim",
      [ToolMode.EXTEND]: "extend",
      [ToolMode.OFFSET]: "offset",
      [ToolMode.FILLET]: "fillet",
      [ToolMode.MEASURE]: "measure",
    };
    return reverseMap[activeTool] || "select";
  }, [activeTool]) as string;

  // Sidebar states
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  // Current step tracking for Command Steps Guide
  // This is updated by CadDrawingCanvas via onStepChange callback
  const [commandStep, setCommandStep] = useState(0);

  // Compute effective step - prioritize dimension tool step when dimension tool is active
  const effectiveCommandStep = dimensionToolState.isActive
    ? dimensionToolState.step
    : commandStep;

  // Update prompt based on dimension tool state
  useEffect(() => {
    if (!dimensionToolState.isActive) return;

    let prompt = "";
    const type = dimensionToolState.dimensionType;
    const step = dimensionToolState.step;
    const dir = dimensionToolState.direction;

    if (type === "linear") {
      if (step === 0) {
        prompt =
          "DIMLINEAR: Chỉ định điểm gốc đường kéo dài thứ nhất hoặc chọn đối tượng:";
      } else if (step === 1) {
        prompt = "DIMLINEAR: Chỉ định điểm gốc đường kéo dài thứ hai:";
      } else if (step === 2) {
        const dirText =
          dir === "horizontal"
            ? "NGANG"
            : dir === "vertical"
            ? "DỌC"
            : "TỰ ĐỘNG";
        prompt = `DIMLINEAR [${dirText}]: Chỉ định vị trí đường dim hoặc [H=Ngang/O=Dọc]:`;
      }
    } else if (type === "horizontal") {
      if (step === 0) {
        prompt = "DIMHORIZONTAL: Chỉ định điểm gốc thứ nhất:";
      } else if (step === 1) {
        prompt = "DIMHORIZONTAL: Chỉ định điểm gốc thứ hai:";
      } else if (step === 2) {
        prompt = "DIMHORIZONTAL: Chỉ định vị trí đường dim:";
      }
    } else if (type === "vertical") {
      if (step === 0) {
        prompt = "DIMVERTICAL: Chỉ định điểm gốc thứ nhất:";
      } else if (step === 1) {
        prompt = "DIMVERTICAL: Chỉ định điểm gốc thứ hai:";
      } else if (step === 2) {
        prompt = "DIMVERTICAL: Chỉ định vị trí đường dim:";
      }
    }

    if (prompt) {
      useEngineStore.setState({ commandPrompt: prompt });
    }
  }, [
    dimensionToolState.isActive,
    dimensionToolState.dimensionType,
    dimensionToolState.step,
    dimensionToolState.direction,
  ]);

  // ==================== ĐIỀU KIỆN 1: Modify Command Handlers ====================
  // UI đã thu thập đủ điểm → tạo Command → executeCommandObject
  // SỬ DỤNG CanvasEntityCommands (ĐIỀU KIỆN 3: đúng file structure)

  const handleModifyMoveComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      basePoint: Point,
      destPoint: Point
    ) => {
      // Tính delta
      const dx = destPoint.x - basePoint.x;
      const dy = destPoint.y - basePoint.y;

      // Tạo MoveCanvasEntitiesCommand và execute
      const command = new MoveCanvasEntitiesCommand(entityIds, dx, dy);
      const result = executeCommandObject(command);

      // TODO: Handle dimensions separately (dimensions are not in CadEngine)
      if (dimensionIds.length > 0) {
        dimensionIds.forEach((dimId) => {
          const dim = dimensions.find((d) => d.id === dimId);
          if (dim) {
            updateDimension(dimId, {
              point1: { x: dim.point1.x + dx, y: dim.point1.y + dy },
              point2: { x: dim.point2.x + dx, y: dim.point2.y + dy },
            });
          }
        });
      }

      if (result?.success) {
        addNotification({
          type: "success",
          title: "MOVE",
          message: result.message || `Moved ${entityIds.length} object(s)`,
          duration: 2000,
        });
      }

      // Return to SELECT mode
      setTool(ToolMode.SELECT);
    },
    [
      executeCommandObject,
      dimensions,
      updateDimension,
      addNotification,
      setTool,
    ]
  );

  const handleModifyCopyComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      basePoint: Point,
      destPoint: Point
    ) => {
      // Tính offset
      const dx = destPoint.x - basePoint.x;
      const dy = destPoint.y - basePoint.y;

      // Tạo CopyCanvasEntitiesCommand
      const command = new CopyCanvasEntitiesCommand(entityIds, { dx, dy });
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "COPY",
          message: result.message || `Copied ${entityIds.length} object(s)`,
          duration: 2000,
        });
      }
      // Stay in COPY mode for more copies
    },
    [executeCommandObject, addNotification]
  );

  const handleModifyRotateComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      center: Point,
      angle: number
    ) => {
      // Tạo RotateCanvasEntitiesCommand
      const command = new RotateCanvasEntitiesCommand(entityIds, center, angle);
      const result = executeCommandObject(command);

      // Handle dimensions
      if (dimensionIds.length > 0) {
        dimensionIds.forEach((dimId) => {
          const dim = dimensions.find((d) => d.id === dimId);
          if (dim) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatePoint = (p: Point): Point => {
              const dx = p.x - center.x;
              const dy = p.y - center.y;
              return {
                x: center.x + dx * cos - dy * sin,
                y: center.y + dx * sin + dy * cos,
              };
            };
            updateDimension(dimId, {
              point1: rotatePoint(dim.point1),
              point2: rotatePoint(dim.point2),
            });
          }
        });
      }

      if (result?.success) {
        addNotification({
          type: "success",
          title: "ROTATE",
          message: `Rotated ${entityIds.length} object(s) by ${(
            (angle * 180) /
            Math.PI
          ).toFixed(1)}°`,
          duration: 2000,
        });
      }

      setTool(ToolMode.SELECT);
    },
    [
      executeCommandObject,
      dimensions,
      updateDimension,
      addNotification,
      setTool,
    ]
  );

  const handleModifyMirrorComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      point1: Point,
      point2: Point
    ) => {
      // Tạo MirrorCanvasEntitiesCommand
      const command = new MirrorCanvasEntitiesCommand(
        entityIds,
        point1,
        point2,
        false // deleteOriginal = false → create copy
      );
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "MIRROR",
          message: result.message || `Mirrored ${entityIds.length} object(s)`,
          duration: 2000,
        });
      }

      setTool(ToolMode.SELECT);
    },
    [executeCommandObject, addNotification, setTool]
  );

  const handleModifyScaleComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      center: Point,
      scaleFactor: number
    ) => {
      // Tạo ScaleCanvasEntitiesCommand
      const command = new ScaleCanvasEntitiesCommand(
        entityIds,
        center,
        scaleFactor
      );
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "SCALE",
          message: `Scaled ${
            entityIds.length
          } object(s) by ${scaleFactor.toFixed(2)}`,
          duration: 2000,
        });
      }

      setTool(ToolMode.SELECT);
    },
    [executeCommandObject, addNotification, setTool]
  );

  const handleModifyOffsetComplete = useCallback(
    (entityId: string, distance: number, throughPoint: Point) => {
      // Tạo OffsetCanvasEntityCommand
      const command = new OffsetCanvasEntityCommand(
        entityId,
        distance,
        throughPoint
      );
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "OFFSET",
          message: result.message || `Created offset at distance ${distance}`,
          duration: 2000,
        });
      } else {
        addNotification({
          type: "error",
          title: "OFFSET",
          message: result?.message || "Failed to create offset",
          duration: 3000,
        });
      }
      // Không chuyển về SELECT - cho phép tiếp tục offset
    },
    [executeCommandObject, addNotification]
  );
  // ==================== END ĐIỀU KIỆN 1: Modify Command Handlers ====================

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
      {/* Header 1 - Filename (z-index: 100 to show dropdown above Header2) */}
      <div style={{ position: "relative", zIndex: 100 }}>
        <Header1
          filename={projectInfo?.name || "Untitled Project"}
          setFilename={(name) => {
            if (projectInfo) {
              useProjectStore.setState({
                currentProject: { ...projectInfo, name },
              });
            }
          }}
          settings={{
            gridVisible: grid.visible,
            snapToGrid: grid.snapToGrid,
            osnapEnabled: osnap.enabled,
            orthoMode: orthoMode,
            showDimensions: true, // TODO: add to store if needed
          }}
          onSettingsChange={(newSettings) => {
            // Update grid visibility
            if (newSettings.gridVisible !== grid.visible) {
              useEngineStore.getState().toggleGrid();
            }
            // Update snap to grid
            if (newSettings.snapToGrid !== grid.snapToGrid) {
              useEngineStore.getState().toggleSnapToGrid();
            }
            // Update OSNAP
            if (newSettings.osnapEnabled !== osnap.enabled) {
              useEngineStore.getState().toggleOsnap();
            }
            // Update Ortho mode
            if (newSettings.orthoMode !== orthoMode) {
              useEngineStore.getState().toggleOrtho();
            }
          }}
        />
      </div>

      {/* Header 2 - Toolbar (z-index: 50 to show dropdown above canvas) */}
      <div style={{ position: "relative", zIndex: 50 }}>
        <Header2
          toolGroups={toolGroups}
          drawingMode={activeToolString}
          osnapModes={osnapModes}
          onSelectTool={handleSelectTool}
          onToggleOsnap={handleToggleOsnapMode}
          isCollapsed={isToolbarCollapsed}
          onToggle={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
          strokeColor={currentStyle.strokeColor}
          fillColor={currentStyle.fillColor}
          onStrokeColorChange={handleStrokeColorChange}
          onFillColorChange={handleFillColorChange}
          opacity={currentStyle.opacity}
          onOpacityChange={handleOpacityChange}
          strokeStyle={currentStyle.strokeStyle}
          onStrokeStyleChange={handleStrokeStyleChange}
          strokeWidth={currentStyle.strokeWidth}
          onStrokeWidthChange={handleStrokeWidthChange}
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
            dimensions={dimensions}
            previewDimension={previewDimension}
            previewDimensions={previewDimensions}
            selectedDimensionIds={selectedDimensionIds}
            triggerUndo={triggerUndo}
            triggerRedo={triggerRedo}
            triggerDelete={triggerDelete}
            triggerClearSelection={triggerClearSelection}
            textScaleTrigger={textScaleTrigger}
            currentStrokeStyle={currentStyle.strokeStyle}
            // ==================== ĐIỀU KIỆN 1: Controlled Mode ====================
            // Khi USE_CONTROLLED_MODE = true, canvas sẽ dùng entities từ CadDocument
            // và mọi thay đổi sẽ đi qua Commands → Document → History
            {...(USE_CONTROLLED_MODE && {
              controlledEntities: documentEntities as CadEntity[],
              controlledSelectedIds: documentSelectedIds,
              useExternalHistory: true,
              onAddEntity: (entity: CadEntity) => {
                addDocumentEntity(
                  entity as unknown as Parameters<typeof addDocumentEntity>[0]
                );
              },
              onDeleteEntities: (ids: string[]) => {
                deleteDocumentEntities(ids);
              },
              onMoveEntities: (ids: string[], dx: number, dy: number) => {
                moveDocumentEntities(ids, dx, dy);
              },
              onSelectEntities: (ids: string[], additive: boolean) => {
                selectDocumentEntities(ids, additive);
              },
              onUndo: documentUndo,
              onRedo: documentRedo,
            })}
            // ==================== END ĐIỀU KIỆN 1 ====================
            // ==================== ĐIỀU KIỆN 1: Modify Command Callbacks ====================
            onModifyMoveComplete={handleModifyMoveComplete}
            onModifyCopyComplete={handleModifyCopyComplete}
            onModifyRotateComplete={handleModifyRotateComplete}
            onModifyMirrorComplete={handleModifyMirrorComplete}
            onModifyScaleComplete={handleModifyScaleComplete}
            onModifyOffsetComplete={handleModifyOffsetComplete}
            offsetDistance={offsetDistance}
            // ==================== END Modify Command Callbacks ====================
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
            onToggleAutoSelectMode={() => {
              const newAutoSelectMode = !dimensionToolState.autoSelectMode;
              toggleAutoSelectMode();
              addNotification({
                type: "info",
                title: newAutoSelectMode
                  ? "Chế độ chọn nhanh"
                  : "Chế độ thường",
                message: newAutoSelectMode
                  ? "Click vào đối tượng để tạo dimension"
                  : "Click chọn điểm 1 và điểm 2",
                duration: 2000,
              });
            }}
            onRepeatLastCommand={() => {
              if (lastCommand) {
                handleCommand(lastCommand);
              }
            }}
            onQdimSelectionConfirm={(entities) => {
              // Convert CadEntity to QdimEntity format
              const qdimEntities = entities.map((ent) => ({
                id: ent.id,
                type: ent.type,
                points: ent.points,
                center: ent.type === "circle" ? ent.points?.[0] : undefined,
                radius:
                  ent.type === "circle" && ent.points?.[1]
                    ? ent.points[1].x
                    : undefined,
              }));
              setQdimEntities(qdimEntities);
            }}
            onQdimConfirm={() => {
              const created = confirmQdim();
              if (created.length > 0) {
                addNotification({
                  type: "success",
                  title: "QDIM",
                  message: `Created ${created.length} dimension(s)`,
                  duration: 2000,
                });
              }
            }}
            onDimensionClick={(
              worldPos: Point,
              circleInfo?: { center: Point; radius: number; entityId: string },
              lineInfo?: { point1: Point; point2: Point; entityId: string }
            ) => {
              if (dimensionToolState.isActive) {
                const result = handleDimensionClick(
                  worldPos,
                  undefined,
                  circleInfo,
                  lineInfo
                );
                if (result) {
                  addNotification({
                    type: "success",
                    title: "Dimension",
                    message: `Created: ${result.id}`,
                    duration: 2000,
                  });
                }
              }
            }}
            onDimensionSelect={(ids: string[]) => {
              setSelectedDimensionIds(ids);
            }}
            onDimensionDelete={(id: string) => {
              removeDimension(id);
            }}
            onDimensionUpdate={(
              id: string,
              updates: Partial<(typeof dimensions)[0]>
            ) => {
              updateDimension(id, updates);
            }}
            onDimensionCopy={(ids: string[]) => {
              // Copy dimensions to clipboard (handled internally)
              console.log("Dimensions copied:", ids);
            }}
            onMouseMove={(worldPos: Point) => {
              useEngineStore.setState({
                mouseWorld: { x: worldPos.x, y: worldPos.y },
              });
              // Update dimension preview on mouse move
              if (dimensionToolState.isActive) {
                handleDimensionMove(worldPos);
              }
            }}
            onPromptChange={(prompt: string) => {
              useEngineStore.setState({ commandPrompt: prompt });
            }}
            onEntityCreated={(entity: CadEntity) => {
              console.log("Entity created:", entity);
              // Trong controlled mode, entity đã được add qua onAddEntity callback
            }}
            onEntitiesChange={(entities: CadEntity[]) => {
              // Chỉ update legacy state khi không dùng controlled mode
              if (!USE_CONTROLLED_MODE) {
                setLegacyCanvasEntities(entities);
              }
            }}
            onSelectionChanged={(selectedIds: string[]) => {
              // Chỉ update legacy state khi không dùng controlled mode
              if (!USE_CONTROLLED_MODE) {
                setLegacyCanvasSelectedIds(selectedIds);
              }
            }}
            onStepChange={setCommandStep}
            placeMode={selectedTemplate !== null}
            onPlaceClick={(worldPos: Point) => {
              if (selectedTemplate) {
                insertTemplate(selectedTemplate.id, {
                  x: worldPos.x,
                  y: worldPos.y,
                });
                addNotification({
                  type: "success",
                  title: "Door Placed",
                  message: `${selectedTemplate.name} placed at (${Math.round(
                    worldPos.x
                  )}, ${Math.round(worldPos.y)})`,
                  duration: 2000,
                });
              }
            }}
          />
        </div>

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

      {/* Export Dialog */}
      {showExportDialog && (
        <Modal
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          title="Xuất bản vẽ"
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>
              Chọn định dạng xuất file:
            </p>
            <button
              onClick={() => {
                exportDrawing("svg", canvasEntities, exportLayers, {
                  title: projectInfo?.name || "drawing",
                });
                setShowExportDialog(false);
              }}
              disabled={isExporting}
              style={{
                padding: "12px",
                background: "#4ade80",
                border: "none",
                borderRadius: "4px",
                color: "#000",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              📐 Xuất SVG (Vector)
            </button>
            <button
              onClick={() => {
                exportDrawing("png", canvasEntities, exportLayers, {
                  title: projectInfo?.name || "drawing",
                  width: 1920,
                  height: 1080,
                });
                setShowExportDialog(false);
              }}
              disabled={isExporting}
              style={{
                padding: "12px",
                background: "#4a90d9",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🖼️ Xuất PNG (Image)
            </button>
            <button
              onClick={() => {
                exportDrawing("dxf", canvasEntities, exportLayers, {
                  title: projectInfo?.name || "drawing",
                });
                setShowExportDialog(false);
              }}
              disabled={isExporting}
              style={{
                padding: "12px",
                background: "#fbbf24",
                border: "none",
                borderRadius: "4px",
                color: "#000",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              📁 Xuất DXF (AutoCAD)
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              style={{
                padding: "12px",
                background: "#ff6b6b",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              📄 Xuất PDF (Print)
            </button>
            {isExporting && (
              <p
                style={{
                  color: "#4a90d9",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                Đang xuất file...
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
