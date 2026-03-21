/**
 * useToolbar - Tool groups, tool selection, osnap modes, and active tool string
 * STEP-5.5: Extracted from BookThietKeBocTachPage.tsx
 */

import { useCallback, useMemo, useState } from "react";
import { ToolMode } from "../core/engine/EngineState";

// ==================== Types ====================

export interface UseToolbarParams {
  activeTool: ToolMode;
  setTool: (mode: ToolMode) => void;
  startDimensionTool: (type: string) => void;
  cancelDimensionTool: () => void;
  startQdim: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: any;
  zoomFit: () => void;
  setTriggerUndo: React.Dispatch<React.SetStateAction<number>>;
  setTriggerRedo: React.Dispatch<React.SetStateAction<number>>;
  setTriggerDelete: React.Dispatch<React.SetStateAction<number>>;
  setShowExportDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowImportDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowShareModal: React.Dispatch<React.SetStateAction<boolean>>;
  /** Phase 7: Block mutating tools when project is locked */
  isLocked?: boolean;
}

export interface UseToolbarReturn {
  toolGroups: {
    name: string;
    color: string;
    tools: { id: string; label: string }[];
  }[];
  osnapModes: Record<string, boolean>;
  setOsnapModes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeToolString: string;
  handleToolChange: (tool: string) => void;
  handleSelectTool: (toolId: string) => void;
  handleToggleOsnapMode: (modeId: string) => void;
}

// ==================== Hook ====================

export function useToolbar({
  activeTool,
  setTool,
  startDimensionTool,
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
  isLocked,
}: UseToolbarParams): UseToolbarReturn {
  // Phase 7: Tool IDs that are safe in locked (view-only) mode
  const VIEW_SAFE_TOOLS = useMemo(
    () =>
      new Set([
        "select",
        "pan",
        "zoom-in",
        "zoom-out",
        "zoom-fit",
        "export",
        "share",
        // Osnap toggles are read-only state
        "endpoint",
        "midpoint",
        "center",
        "intersection",
        "perpendicular",
        "nearest",
      ]),
    [],
  );

  // ===== Tool Groups =====
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
          { id: "import", label: "Import" },
          { id: "export", label: "Export" },
          { id: "share", label: "Share" },
        ],
      },
    ],
    [],
  );

  // ===== Osnap Modes =====
  const [osnapModes, setOsnapModes] = useState<Record<string, boolean>>({
    endpoint: true,
    midpoint: true,
    center: true,
    intersection: false,
    perpendicular: false,
    nearest: false,
  });

  // ===== Active Tool String for Header2 =====
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
      [ToolMode.OFFSET]: "offset",
      [ToolMode.TRIM]: "trim",
      [ToolMode.EXTEND]: "extend",
      [ToolMode.EXPLODE]: "explode",
      [ToolMode.FILLET]: "fillet",
      [ToolMode.BOUNDARY]: "boundary",
      [ToolMode.MEASURE]: "measure",
    };
    return reverseMap[activeTool] || "select";
  }, [activeTool]) as string;

  // ===== Handle Tool Change from Toolbar =====
  const handleToolChange = useCallback(
    (tool: string) => {
      const toolMap: Record<string, ToolMode> = {
        select: ToolMode.SELECT,
        line: ToolMode.DRAW_LINE,
        rect: ToolMode.DRAW_RECT,
        circle: ToolMode.DRAW_CIRCLE,
        arc: ToolMode.DRAW_ARC,
        polygon: ToolMode.DRAW_POLYGON,
        polyline: ToolMode.DRAW_POLYGON,
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
        boundary: ToolMode.BOUNDARY,
        bo: ToolMode.BOUNDARY,
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
        dimcontinue: "linear",
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

      console.log("Tool changed to:", tool, "→", mode);
    },
    [setTool, startDimensionTool, cancelDimensionTool, startQdim],
  );

  // ===== Handle Tool Selection from Header2 =====
  const handleSelectTool = useCallback(
    (toolId: string) => {
      // Phase 7: Block mutating tools when locked
      if (isLocked && !VIEW_SAFE_TOOLS.has(toolId)) {
        console.warn("Project locked — tool blocked:", toolId);
        return;
      }

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
      if (toolId === "import") {
        setShowImportDialog(true);
        return;
      }
      if (toolId === "export") {
        setShowExportDialog(true);
        return;
      }
      if (toolId === "share") {
        setShowShareModal(true);
        return;
      }

      // Handle drawing tools
      handleToolChange(toolId);
    },
    [
      isLocked,
      VIEW_SAFE_TOOLS,
      engine,
      zoomFit,
      handleToolChange,
      setTriggerUndo,
      setTriggerRedo,
      setTriggerDelete,
      setShowExportDialog,
      setShowImportDialog,
      setShowShareModal,
    ],
  );

  // ===== Handle Osnap Toggle =====
  const handleToggleOsnapMode = useCallback((modeId: string) => {
    setOsnapModes((prev) => ({
      ...prev,
      [modeId]: !prev[modeId],
    }));
  }, []);

  return {
    toolGroups,
    osnapModes,
    setOsnapModes,
    activeToolString,
    handleToolChange,
    handleSelectTool,
    handleToggleOsnapMode,
  };
}
