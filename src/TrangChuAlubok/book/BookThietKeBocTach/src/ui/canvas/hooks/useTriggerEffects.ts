/**
 * useTriggerEffects — STEP-5 extraction from CadDrawingCanvas
 *
 * Owns: All "trigger from props" effects:
 * - Trigger Undo/Redo
 * - Trigger Delete
 * - Trigger Clear Selection
 * - Focus Text Input (command + legacy)
 * - Trigger Text Scale
 */

import { useEffect, useRef } from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import type { CadEntity, DrawingState } from "../canvas.types";
import type { DynamicInputState } from "../overlay/DynamicInputOverlay";

// ==================== Interface ====================

export interface TriggerEffectsParams {
  // Trigger counters from props
  triggerUndo: number;
  triggerRedo: number;
  triggerDelete: number;
  triggerClearSelection: number;
  textScaleTrigger: number;

  // Undo/Redo functions
  undo: () => void;
  redo: () => void;

  // Delete/Selection functions
  deleteSelectedEntities: () => void;
  clearSelection: () => void;

  // Dimension state for delete
  selectedDimensionIds: string[];
  onDimensionDelete?: (id: string) => void;
  onDimensionSelect?: (ids: string[]) => void;

  // Clear selection deps
  commandDrawing: {
    state: { isActive: boolean };
    actions: {
      handleEscape: () => void;
      isWaitingForTextInput: () => boolean;
    };
  };
  drawState: DrawingState;
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;
  setDynamicInput: React.Dispatch<React.SetStateAction<DynamicInputState>>;
  setActiveTool: (tool: ToolMode) => void;

  // Text input refs
  textInputRef: React.RefObject<HTMLTextAreaElement | null>;
  textInputMountedRef: React.MutableRefObject<boolean>;

  // Text input state
  textInput: {
    active: boolean;
    value: string;
    position: { x: number; y: number };
    editingId?: string;
  };

  // Text scale
  entities: CadEntity[];
  selectedIds: string[];
  setTextScaleInput: React.Dispatch<
    React.SetStateAction<{
      active: boolean;
      value: string;
      targetIds: string[];
    }>
  >;

  // Prompt
  onPromptChange?: (msg: string) => void;
}

// ==================== Hook ====================

export function useTriggerEffects(params: TriggerEffectsParams): void {
  const {
    triggerUndo,
    triggerRedo,
    triggerDelete,
    triggerClearSelection,
    textScaleTrigger,
    undo,
    redo,
    deleteSelectedEntities,
    clearSelection,
    selectedDimensionIds,
    onDimensionDelete,
    onDimensionSelect,
    commandDrawing,
    drawState,
    setDrawState,
    setDynamicInput,
    setActiveTool,
    textInputRef,
    textInputMountedRef,
    textInput,
    entities,
    selectedIds,
    setTextScaleInput,
    onPromptChange,
  } = params;

  // ==================== Trigger Undo/Redo ====================
  const triggerUndoRef = useRef(triggerUndo);
  const triggerRedoRef = useRef(triggerRedo);

  useEffect(() => {
    if (triggerUndo > 0 && triggerUndo !== triggerUndoRef.current) {
      triggerUndoRef.current = triggerUndo;
      setTimeout(() => undo(), 0);
    }
  }, [triggerUndo, undo]);

  useEffect(() => {
    if (triggerRedo > 0 && triggerRedo !== triggerRedoRef.current) {
      triggerRedoRef.current = triggerRedo;
      setTimeout(() => redo(), 0);
    }
  }, [triggerRedo, redo]);

  // ==================== Trigger Delete ====================
  const triggerDeleteRef = useRef(triggerDelete);

  useEffect(() => {
    if (triggerDelete > 0 && triggerDelete !== triggerDeleteRef.current) {
      triggerDeleteRef.current = triggerDelete;
      setTimeout(() => {
        deleteSelectedEntities();
        if (selectedDimensionIds.length > 0) {
          selectedDimensionIds.forEach((id) => onDimensionDelete?.(id));
          onDimensionSelect?.([]);
          onPromptChange?.(
            `Deleted ${selectedDimensionIds.length} dimension(s)`,
          );
        }
      }, 0);
    }
  }, [
    triggerDelete,
    deleteSelectedEntities,
    selectedDimensionIds,
    onDimensionDelete,
    onDimensionSelect,
    onPromptChange,
  ]);

  // ==================== Trigger Clear Selection ====================
  const triggerClearSelectionRef = useRef(triggerClearSelection);

  useEffect(() => {
    if (
      triggerClearSelection > 0 &&
      triggerClearSelection !== triggerClearSelectionRef.current
    ) {
      triggerClearSelectionRef.current = triggerClearSelection;
      setTimeout(() => {
        clearSelection();
        let shouldReturnToSelect = false;

        if (commandDrawing.state.isActive) {
          commandDrawing.actions.handleEscape();
          onPromptChange?.("Command cancelled");
          shouldReturnToSelect = true;
        }
        if (drawState.mode !== "idle") {
          setDrawState({ mode: "idle" });
          onPromptChange?.("Command cancelled");
          shouldReturnToSelect = true;
        }
        setDynamicInput((prev) => ({ ...prev, active: false }));
        if (shouldReturnToSelect) {
          setActiveTool(ToolMode.SELECT);
        }
      }, 0);
    }
  }, [
    triggerClearSelection,
    clearSelection,
    drawState.mode,
    onPromptChange,
    commandDrawing.state.isActive,
    commandDrawing.actions,
    setActiveTool,
    setDrawState,
    setDynamicInput,
  ]);

  // ==================== Focus Text Input when waiting ====================
  const isWaitingForText = commandDrawing.actions.isWaitingForTextInput();
  useEffect(() => {
    if (isWaitingForText && textInputRef.current) {
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
        textInputMountedRef.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isWaitingForText, textInputRef, textInputMountedRef]);

  // ==================== Focus Text Input for Legacy mode ====================
  useEffect(() => {
    if (textInput.active && !isWaitingForText && textInputRef.current) {
      const timer = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
          textInputMountedRef.current = true;
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [textInput.active, isWaitingForText, textInputRef, textInputMountedRef]);

  // ==================== Trigger Text Scale ====================
  const textScaleTriggerRef = useRef(textScaleTrigger);

  useEffect(() => {
    if (
      textScaleTrigger > 0 &&
      textScaleTrigger !== textScaleTriggerRef.current
    ) {
      textScaleTriggerRef.current = textScaleTrigger;
      const selectedTextEntities = entities.filter(
        (ent) => selectedIds.includes(ent.id) && ent.type === "text",
      );
      if (selectedTextEntities.length > 0) {
        setTimeout(() => {
          setTextScaleInput({
            active: true,
            value: "1",
            targetIds: selectedTextEntities.map((e) => e.id),
          });
          onPromptChange?.(
            `Enter scale factor for ${selectedTextEntities.length} text(s):`,
          );
        }, 0);
      } else {
        setTimeout(() => {
          onPromptChange?.("No text selected. Select text first then press X.");
        }, 0);
      }
    }
  }, [
    textScaleTrigger,
    entities,
    selectedIds,
    onPromptChange,
    setTextScaleInput,
  ]);
}
