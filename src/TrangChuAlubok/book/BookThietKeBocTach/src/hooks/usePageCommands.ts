/**
 * usePageCommands Hook
 *
 * Extracted from BookThietKeBocTachPage.tsx (STEP-5.3)
 * Contains the handleCommand callback — the massive AutoCAD-style command dispatcher.
 *
 * Maps command strings (L, R, C, CO, M, TR, etc.) to tool actions.
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 */

import { useCallback } from "react";
import { ToolMode } from "../core/engine/EngineState";
import { useEngineStore } from "../store/engineStore";

// Door Commands
import { DeleteDoorCommand } from "../core/commands/door/DoorCommands";

import type { DimensionToolState } from "./useDimensions";

// ==================== Types ====================

interface NotificationParams {
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  duration?: number;
}

interface DoorEntity {
  id: string;
  [key: string]: unknown;
}

interface CommandResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface UsePageCommandsParams {
  // Tool control
  handleSelectTool: (toolId: string) => void;
  setTool: (tool: ToolMode) => void;
  activeTool: ToolMode;

  // Document state
  documentSelectedIds: string[];
  deleteDocumentEntities: (ids: string[]) => void;
  clearDocumentSelection: () => void;

  // Door access
  getSelectedDoors: () => DoorEntity[];
  clearDoorSelection: () => void;
  executeCommandObject: (cmd: unknown) => CommandResult | undefined;

  // Notifications
  addNotification: (n: NotificationParams) => void;

  // Dimension tool
  dimensionToolState: DimensionToolState;
  startContinueMode: () => boolean;
  startBaselineMode: () => boolean;
  startDimensionTool: (type: string) => void;
  cancelDimensionTool: () => void;
  startQdim: () => void;
  toggleAutoSelectMode: () => void;

  // Offset
  offsetDistance: number | undefined;
  setOffsetDistance: (d: number | undefined) => void;

  // Dimensions
  selectedDimensionIds: string[];
  removeDimension: (id: string) => void;
  setSelectedDimensionIds: (ids: string[]) => void;

  // Refs
  handleExplodeCommandRef: React.MutableRefObject<() => void>;

  // UI state setters
  setFlashingTool: (tool: string | null) => void;
  setPolygonCommandInput: (input: string | undefined) => void;
  setTextScaleTrigger: React.Dispatch<React.SetStateAction<number>>;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setLastCommand: (cmd: string) => void;
}

export interface UsePageCommandsReturn {
  handleCommand: (command: string) => void;
}

// ==================== Hook ====================

export function usePageCommands(
  params: UsePageCommandsParams,
): UsePageCommandsReturn {
  const {
    handleSelectTool,
    setTool,
    activeTool,
    documentSelectedIds,
    deleteDocumentEntities,
    clearDocumentSelection,
    getSelectedDoors,
    clearDoorSelection,
    executeCommandObject,
    addNotification,
    dimensionToolState,
    startContinueMode,
    startBaselineMode,
    startDimensionTool,
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
  } = params;

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
      if (activeTool === ToolMode.DRAW_POLYGON) {
        const isNumber = /^\d+$/.test(cmd);
        const isOption = /^[eic]$/.test(cmd);
        const isEnter = cmd === "";

        if (isNumber || isOption || isEnter) {
          setPolygonCommandInput(command.trim());
          return;
        }
      }

      // Empty command: Toggle autoSelectMode if dimension tool is active
      if (!cmd && dimensionToolState.isActive) {
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
        handleSelectTool(cmd);
      } else if (cmd === "qd") {
        setTool(ToolMode.DRAW_QDIM);
        startQdim();
      } else if (cmd === "dco") {
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
        setTool(ToolMode.DRAW_DIMARC);
        startDimensionTool("arc");
      } else if (cmd === "dli") {
        setTool(ToolMode.DRAW_DIM_LINEAR);
        startDimensionTool("linear");
      } else if (cmd === "dho" || cmd === "dimhorizontal") {
        setTool(ToolMode.DRAW_DIM_LINEAR);
        startDimensionTool("horizontal");
      } else if (cmd === "dve" || cmd === "dimvertical") {
        setTool(ToolMode.DRAW_DIM_LINEAR);
        startDimensionTool("vertical");
      } else if (cmd === "dal") {
        setTool(ToolMode.DRAW_DIM_ALIGNED);
        startDimensionTool("aligned");
      } else if (cmd === "dan") {
        setTool(ToolMode.DRAW_DIM_ANGULAR);
        startDimensionTool("angular");
      } else if (cmd === "dra") {
        setTool(ToolMode.DRAW_DIM_RADIUS);
        startDimensionTool("radius");
      }
      // ==================== RULE 5: Selection Priority ====================
      else if (
        (cmd === "l" ||
          cmd === "r" ||
          cmd === "c" ||
          cmd === "a" ||
          cmd === "el" ||
          cmd === "pl" ||
          cmd === "pol" ||
          cmd === "t" ||
          cmd === "dt") &&
        documentSelectedIds.length > 0
      ) {
        addNotification({
          type: "warning",
          title: "Selection Active",
          message:
            "Clear selection (ESC) or use Modify commands (M, E, CO, RO, SC, MI)",
          duration: 2000,
        });
        return;
      } else if (cmd === "l" || cmd === "line") {
        setTool(ToolMode.DRAW_LINE);
      } else if (
        cmd === "r" ||
        cmd === "rec" ||
        cmd === "rect" ||
        cmd === "rectangle"
      ) {
        setTool(ToolMode.DRAW_RECT);
      } else if (cmd === "c" || cmd === "circle") {
        setTool(ToolMode.DRAW_CIRCLE);
      } else if (cmd === "a" || cmd === "arc") {
        setTool(ToolMode.DRAW_ARC);
      } else if (cmd === "el" || cmd === "ellipse") {
        setTool(ToolMode.DRAW_ELLIPSE);
      } else if (cmd === "pl" || cmd === "pline" || cmd === "polyline") {
        setTool(ToolMode.DRAW_POLYGON);
      } else if (cmd === "pol" || cmd === "polygon") {
        setTool(ToolMode.DRAW_POLYGON);
      } else if (
        cmd === "t" ||
        cmd === "text" ||
        cmd === "dt" ||
        cmd === "dtext"
      ) {
        setTool(ToolMode.DRAW_TEXT);
      } else if (cmd === "m" || cmd === "move") {
        setTool(ToolMode.MOVE);
      } else if (
        cmd === "e" ||
        cmd === "erase" ||
        cmd === "del" ||
        cmd === "delete"
      ) {
        // E - Erase/Delete selected entities, doors, and dimensions
        const currentSelectedIds = documentSelectedIds;
        const currentHasSelection = currentSelectedIds.length > 0;
        const selectedDoorEntities = getSelectedDoors();
        const hasDoorSelection = selectedDoorEntities.length > 0;
        const hasDimensionSelection = selectedDimensionIds.length > 0;

        if (currentHasSelection || hasDoorSelection || hasDimensionSelection) {
          let deletedEntities = 0;
          let deletedDoors = 0;
          let deletedDimensions = 0;

          if (currentHasSelection) {
            deleteDocumentEntities(currentSelectedIds);
            deletedEntities = currentSelectedIds.length;
            clearDocumentSelection();
          }

          if (hasDoorSelection) {
            const doorIds = selectedDoorEntities.map((d) => d.id);
            const command = new DeleteDoorCommand(doorIds);
            const result = executeCommandObject(command);
            if (result?.success) {
              deletedDoors = doorIds.length;
            }
            clearDoorSelection();
          }

          if (hasDimensionSelection) {
            for (const dimId of selectedDimensionIds) {
              removeDimension(dimId);
            }
            deletedDimensions = selectedDimensionIds.length;
            setSelectedDimensionIds([]);
          }

          const total = deletedEntities + deletedDoors + deletedDimensions;
          if (total > 0) {
            setFlashingTool("erase");
            setTimeout(() => setFlashingTool(null), 500);

            const parts: string[] = [];
            if (deletedDoors > 0) parts.push(`${deletedDoors} door(s)`);
            if (deletedDimensions > 0)
              parts.push(`${deletedDimensions} dimension(s)`);
            const details = parts.length > 0 ? ` (${parts.join(", ")})` : "";

            addNotification({
              type: "success",
              title: "ERASE",
              message: `Erased ${total} object(s)${details}`,
              duration: 2000,
            });
          }
        } else {
          addNotification({
            type: "warning",
            title: "ERASE",
            message: "No objects selected. Select objects first.",
            duration: 2000,
          });
        }
      } else if (cmd === "co" || cmd === "cp" || cmd === "copy") {
        setTool(ToolMode.COPY);
      } else if (cmd === "ro" || cmd === "rotate") {
        setTool(ToolMode.ROTATE);
      } else if (cmd === "sc" || cmd === "scale") {
        setTool(ToolMode.SCALE);
      } else if (cmd === "mi" || cmd === "mirror") {
        setTool(ToolMode.MIRROR);
      } else if (cmd === "tr" || cmd === "trim") {
        setTool(ToolMode.TRIM);
      } else if (cmd === "ex" || cmd === "extend") {
        setTool(ToolMode.EXTEND);
      } else if (cmd === "o" || cmd === "offset") {
        setTool(ToolMode.OFFSET);
        setOffsetDistance(undefined);
      } else if (cmd === "x" || cmd === "explode") {
        handleExplodeCommandRef.current();
      } else if (cmd === "f" || cmd === "fillet") {
        setTool(ToolMode.FILLET);
      } else if (cmd === "bo" || cmd === "boundary") {
        setTool(ToolMode.BOUNDARY);
      } else if (cmd === "z" || cmd === "zoom") {
        handleSelectTool("zoom-fit");
      } else if (cmd === "p" || cmd === "pan") {
        setTool(ToolMode.PAN);
      } else if (cmd === "u" || cmd === "undo") {
        handleSelectTool("undo");
      } else if (cmd === "redo") {
        handleSelectTool("redo");
      } else if (cmd === "escape" || cmd === "esc") {
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
        setTextScaleTrigger((prev) => prev + 1);
      } else if (/^\d+(\.\d+)?$/.test(cmd)) {
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
      clearDoorSelection,
      executeCommandObject,
      clearDocumentSelection,
      deleteDocumentEntities,
      getSelectedDoors,
      selectedDimensionIds,
      removeDimension,
      setSelectedDimensionIds,
      setFlashingTool,
      setPolygonCommandInput,
      setTextScaleTrigger,
      setIsCommandPaletteOpen,
      setLastCommand,
      setOffsetDistance,
      handleExplodeCommandRef,
      documentSelectedIds,
    ],
  );

  return { handleCommand };
}
