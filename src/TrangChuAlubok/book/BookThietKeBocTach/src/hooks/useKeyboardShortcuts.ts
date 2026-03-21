/**
 * useKeyboardShortcuts Hook
 *
 * Extracted from BookThietKeBocTachPage.tsx (STEP-5.3)
 * Contains the keyboard event handler (Ctrl+C, Ctrl+V, Ctrl+A, Delete, ESC cascade, etc.)
 *
 * RULE 2: Command Lock — block letter keys when drawing in progress
 * RULE 10+11: ESC Cascade — multi-level escape handling
 */

import { useEffect } from "react";
import type { CadEntity } from "../ui";
import { ToolMode } from "../core/engine/EngineState";
import { useEngineStore } from "../store/engineStore";

// Clipboard
import { ClipboardManager } from "../core/clipboard";

// Door Commands
import { DeleteDoorCommand } from "../core/commands/door/DoorCommands";

import type { DimensionEntity } from "../core/dimensions/DimensionManager";
import type { DimensionToolState } from "./useDimensions";

// ==================== Types ====================

interface NotificationParams {
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  duration?: number;
}

// DoorEntity from core for ClipboardManager compatibility
import type { DoorEntity } from "../core/entities/DoorEntity";

interface CommandResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface UseKeyboardShortcutsParams {
  // Document entities
  documentEntities: CadEntity[];
  documentSelectedIds: string[];
  selectDocumentEntities: (ids: string[], additive?: boolean) => void;
  deleteDocumentEntities: (ids: string[]) => void;
  clearDocumentSelection: () => void;

  // Selection
  clearSelection: () => void;
  hasSelection: boolean;
  selectAll: () => void;

  // Door access
  getSelectedDoors: () => DoorEntity[];
  clearDoorSelection: () => void;
  executeCommandObject: (cmd: unknown) => CommandResult | undefined;

  // Notifications
  addNotification: (n: NotificationParams) => void;

  // Dimensions
  dimensions: DimensionEntity[];
  selectedDimensionIds: string[];
  setSelectedDimensionIds: (ids: string[]) => void;

  // Paste mode
  setIsPasteMode: (v: boolean) => void;
  setIsQuickCopyMode: (v: boolean) => void;
  isPasteMode: boolean;
  isQuickCopyMode: boolean;

  // Drawing state (Rule 2)
  isDrawingInProgress: boolean;

  // Command buffer
  commandBuffer: string;
  setCommandBuffer: React.Dispatch<React.SetStateAction<string>>;

  // Refs
  handleCommandRef: React.MutableRefObject<(cmd: string) => void>;

  // Command palette
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (v: boolean) => void;

  // Dimension tool
  dimensionToolState: DimensionToolState;
  exitChainMode: () => void;
  cancelDimensionTool: () => void;

  // Tool control
  setTool: (tool: ToolMode) => void;
  activeTool: ToolMode;

  // Offset
  offsetDistance: number | undefined;

  // Trigger counters
  setTriggerClearSelection: React.Dispatch<React.SetStateAction<number>>;

  /** Phase 7: Block mutating shortcuts when project is locked */
  isLocked?: boolean;
}

// ==================== Hook ====================

export function useKeyboardShortcuts(params: UseKeyboardShortcutsParams): void {
  const {
    documentEntities,
    documentSelectedIds,
    selectDocumentEntities,
    deleteDocumentEntities,
    clearDocumentSelection,
    clearSelection,
    hasSelection,
    selectAll,
    getSelectedDoors,
    clearDoorSelection,
    executeCommandObject,
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
    isLocked,
  } = params;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC should always work, even when input is focused
      const isInputFocused =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      // Ignore most keys if typing in input (but allow ESC)
      if (isInputFocused && e.key !== "Escape") {
        return;
      }

      // NOTE: Undo/Redo (Ctrl+Z/Y) is handled by CadDrawingCanvas directly

      // Copy (Ctrl+C) - Copy selected entities to clipboard (read-only, always allowed)
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        const selectedCadEntities = documentEntities.filter((ent) =>
          documentSelectedIds.includes(ent.id),
        );
        const selectedDoorEntities = getSelectedDoors();

        if (selectedCadEntities.length > 0 || selectedDoorEntities.length > 0) {
          ClipboardManager.copy(selectedCadEntities, selectedDoorEntities);
          const count = ClipboardManager.getCount();
          console.log(
            `Copied ${count.entities} entities, ${count.doors} doors to clipboard`,
          );
        }
        return;
      }

      // Select all - select all canvas entities and dimensions (read-only, always allowed)
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        const allEntityIds = documentEntities.map((e) => e.id);
        if (allEntityIds.length > 0) {
          selectDocumentEntities(allEntityIds);
        }
        if (dimensions.length > 0) {
          setSelectedDimensionIds(dimensions.map((d) => d.id));
        }
        selectAll();
        return;
      }

      // Phase 7: Block ALL mutating shortcuts when project is locked
      // (Ctrl+C, Ctrl+A, ESC are allowed; everything below mutates state)
      if (isLocked && e.key !== "Escape") return;

      // Paste (Ctrl+V) - Enter paste mode, click to place
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        if (ClipboardManager.hasData()) {
          setIsPasteMode(true);
          setIsQuickCopyMode(false);
          console.log("Paste mode activated - click to place");
        }
        return;
      }

      // Delete - xóa entities và doors đang được chọn
      const selectedDoorEntities = getSelectedDoors();
      const hasDoorSelection = selectedDoorEntities.length > 0;

      if (e.key === "Delete" && (hasSelection || hasDoorSelection)) {
        e.preventDefault();

        let deletedEntities = 0;
        let deletedDoors = 0;

        if (hasSelection && documentSelectedIds.length > 0) {
          deleteDocumentEntities(documentSelectedIds);
          deletedEntities = documentSelectedIds.length;
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

        const total = deletedEntities + deletedDoors;
        if (total > 0) {
          addNotification({
            type: "success",
            title: "DELETE",
            message: `Deleted ${total} object(s)${
              deletedDoors > 0 ? ` (${deletedDoors} door(s))` : ""
            }`,
            duration: 2000,
          });
        }
        return;
      }

      // ==================== ESC CASCADE (Rule 10 + 11) ====================
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();

        // Level 1: Clear command buffer
        if (commandBuffer.length > 0) {
          setCommandBuffer("");
          return;
        }

        // Level 2: Close Command Palette
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          return;
        }

        // Level 3: Cancel paste/quick copy mode
        if (isPasteMode || isQuickCopyMode) {
          setIsPasteMode(false);
          setIsQuickCopyMode(false);
          return;
        }

        // Level 4: Exit dimension chain mode
        if (
          dimensionToolState.isContinueMode ||
          dimensionToolState.isBaselineMode
        ) {
          exitChainMode();
          return;
        }

        // Level 5: Clear dimension selection
        if (selectedDimensionIds.length > 0) {
          setSelectedDimensionIds([]);
          return;
        }

        // Level 6: Clear door selection
        const selectedDoors = getSelectedDoors();
        if (selectedDoors.length > 0) {
          clearDoorSelection();
          return;
        }

        // Level 7: Cancel drawing or clear entity selection
        if (isDrawingInProgress || documentSelectedIds.length > 0) {
          setTriggerClearSelection((prev) => prev + 1);
          if (documentSelectedIds.length > 0) {
            clearSelection();
          }
          return;
        }

        // Level 8: Reset to SELECT tool
        if (activeTool !== ToolMode.SELECT) {
          cancelDimensionTool();
          setTool(ToolMode.SELECT);
          return;
        }

        return;
      }

      // Enter or Space - execute command buffer if not empty
      if (e.key === "Enter" || e.key === " ") {
        if (commandBuffer.trim()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleCommandRef.current(commandBuffer.trim());
          setCommandBuffer("");
          return;
        }
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

      // ==================== RULE 2: Command Lock ====================
      if (isDrawingInProgress) {
        const currentTool = useEngineStore.getState().activeTool;
        const isOffsetWaitingDistance =
          currentTool === ToolMode.OFFSET && offsetDistance === undefined;

        if (isOffsetWaitingDistance && /^[0-9.]$/.test(e.key)) {
          e.preventDefault();
          setCommandBuffer((prev) => prev + e.key);
          return;
        }

        if (/^[0-9.,@<\-+]$/.test(e.key)) {
          return;
        }
        if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // Alphanumeric keys - add to command buffer
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

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    selectAll,
    hasSelection,
    deleteDocumentEntities,
    clearDocumentSelection,
    setTool,
    dimensionToolState.isContinueMode,
    dimensionToolState.isBaselineMode,
    exitChainMode,
    cancelDimensionTool,
    commandBuffer,
    selectedDimensionIds,
    documentEntities,
    selectDocumentEntities,
    dimensions,
    isCommandPaletteOpen,
    isPasteMode,
    isQuickCopyMode,
    activeTool,
    documentSelectedIds,
    getSelectedDoors,
    clearDoorSelection,
    addNotification,
    executeCommandObject,
    isDrawingInProgress,
    offsetDistance,
    setCommandBuffer,
    handleCommandRef,
    setIsPasteMode,
    setIsQuickCopyMode,
    setIsCommandPaletteOpen,
    setSelectedDimensionIds,
    setTriggerClearSelection,
    clearSelection,
    isLocked,
  ]);
}
