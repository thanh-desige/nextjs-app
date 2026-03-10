/**
 * useKeyboardHandler - Hook that owns keyboard event handling
 *
 * STEP-5 extraction from CadDrawingCanvas.tsx
 * Handles:
 * - F8 toggle ortho (global capture phase)
 * - Undo/Redo (Ctrl+Z / Ctrl+Y)
 * - Drawing tool keyboard shortcuts
 * - Modify command keyboard input (displacement, backspace)
 * - Copy/Paste/Duplicate/Delete
 * - Arrow key movement
 * - Escape to cancel
 * - Space/Enter to confirm
 */

"use client";

import { useEffect } from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import type { DimensionEntity } from "../../../core/dimensions/DimensionManager";
import { applyOrtho } from "../utils";
import { parseDisplacementInput } from "./keyboardDisplacementParser";
import type { KeyboardHandlerParams } from "./keyboardHandler.types";

// Re-export for backward compatibility
export type { KeyboardHandlerParams } from "./keyboardHandler.types";

// ==================== Hook ====================

export function useKeyboardHandler(params: KeyboardHandlerParams) {
  const {
    activeTool,
    currentLayerId,
    orthoMode,
    effectiveOrtho,
    drawState,
    setDrawState,
    entities,
    selectedIds,
    dimensions,
    selectedDimensionIds,
    dimensionClipboard,
    setDimensionClipboard,
    zoom,
    mousePos,
    setIsShiftPressed,
    clearSelection,
    selectEntities,
    addEntity,
    deleteSelectedEntities,
    copySelectedToClipboard,
    pasteFromClipboard,
    duplicateSelected,
    moveSelectedEntities,
    undo,
    redo,
    onModifyMoveComplete,
    onModifyCopyComplete,
    setMovingPreviewDelta,
    dynamicInput,
    setDynamicInput,
    textScaleInput,
    setTextScaleInput,
    textScaleInputRef,
    selectedDoorIds,
    clearDoorSelection,
    onPromptChange,
    onDimensionDelete,
    onDimensionSelect,
    onDimensionUpdate,
    onDimensionCopy,
    onQdimSelectionConfirm,
    dimensionToolStep,
    qdimStep,
    onToggleAutoSelectMode,
    onRepeatLastCommand,
    onPasteClick,
    currentStrokeStyle,
    commandDrawingActions,
    toggleOrtho,
  } = params;

  // ==================== Keyboard Events ====================

  // Global F8 handler with capture phase - ensures F8 works even when inputs are focused
  useEffect(() => {
    const handleGlobalF8 = (e: KeyboardEvent) => {
      if (e.key === "F8") {
        e.preventDefault();
        e.stopPropagation();
        toggleOrtho();
        onPromptChange?.(orthoMode ? "<Ortho off>" : "<Ortho on>");
      }
    };

    // Use capture phase to intercept F8 before any input receives it
    window.addEventListener("keydown", handleGlobalF8, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalF8, true);
    };
  }, [toggleOrtho, orthoMode, onPromptChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);

      // F8 is handled by global handler above, skip here
      if (e.key === "F8") {
        return;
      }

      // ==================== UNDO/REDO: Ctrl+Z / Ctrl+Y ====================
      if (e.ctrlKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        e.stopPropagation();
        undo();
        return;
      }
      if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        e.stopPropagation();
        redo();
        return;
      }

      // ==================== POLYGON Option: U (Undo) ====================
      if (activeTool === ToolMode.DRAW_POLYGON) {
        const key = e.key.toUpperCase();
        if (key === "U") {
          e.preventDefault();
          if (commandDrawingActions.handlePolygonOption("U")) {
            return;
          }
        }
      }

      // ==================== TEXT Options: H, J, S, R, X (Scale), B, I ====================
      // Chỉ xử lý khi KHÔNG đang chờ text input (để người dùng có thể nhập các ký tự này)
      if (
        activeTool === ToolMode.DRAW_TEXT &&
        !commandDrawingActions.isWaitingForTextInput()
      ) {
        const key = e.key.toUpperCase();
        // H = Height, J = Justify, S = Style, R = Rotation, X = Scale, B = Bold, I = Italic
        if (
          key === "H" ||
          key === "J" ||
          key === "S" ||
          key === "R" ||
          key === "X" ||
          key === "B" ||
          key === "I"
        ) {
          e.preventDefault();
          if (commandDrawingActions.handleTextOption(key)) {
            return;
          }
        }
      }

      // ==================== EDIT SELECTED TEXT: X (Scale) ====================
      // Khi có text entities được chọn, nhấn X để scale (hoạt động ở MỌI tool)
      // Bỏ qua nếu đang chờ text input
      if (
        e.key.toUpperCase() === "X" &&
        !commandDrawingActions.isWaitingForTextInput()
      ) {
        // Bỏ qua nếu đang ở TEXT tool và chưa có selection (X sẽ dùng cho text options)
        if (activeTool === ToolMode.DRAW_TEXT && selectedIds.length === 0) {
          // Let TEXT tool handle X for scale option
          return;
        }

        const selectedTextEntities = entities.filter(
          (ent) => selectedIds.includes(ent.id) && ent.type === "text",
        );
        if (selectedTextEntities.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          // Mở input để nhập scale factor
          setTextScaleInput({
            active: true,
            value: "1",
            targetIds: selectedTextEntities.map((ent) => ent.id),
          });
          onPromptChange?.(
            `Enter scale factor for ${selectedTextEntities.length} text(s) [current size will be multiplied]:`,
          );
          // Focus input sau khi render
          setTimeout(() => {
            textScaleInputRef.current?.focus();
          }, 100);
          return;
        }
      }

      if (e.key === "Escape") {
        // Cancel text scale input if active
        if (textScaleInput.active) {
          setTextScaleInput({ active: false, value: "", targetIds: [] });
          onPromptChange?.("Scale cancelled");
          return;
        }

        // ==================== CLEAR ALL INPUT OVERLAYS ON ESC ====================
        // This ensures only ONE HUD is ever visible
        if (dynamicInput.active) {
          setDynamicInput((prev) => ({ ...prev, active: false }));
        }

        // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Cancel ====================
        // Nếu drawing command đang active, cancel nó trước
        const commandHandled =
          commandDrawingActions.isCommandTool() &&
          commandDrawingActions.handleEscape();

        // Always clear entity selection on ESC
        clearSelection();

        // Always clear dimension selection on ESC
        if (selectedDimensionIds.length > 0) {
          onDimensionSelect?.([]);
        }

        // Always clear door selection on ESC
        clearDoorSelection();

        // If command was handled, we're done
        if (commandHandled) {
          onPromptChange?.("Command cancelled");
          return;
        }

        // Also cancel any drawing in progress
        if (drawState.mode !== "idle") {
          setDrawState({ mode: "idle" });
          setMovingPreviewDelta(null); // Clear ghost preview
          onPromptChange?.("Command cancelled");
        } else {
          onPromptChange?.("Selection cleared");
        }
        return;
      }

      // ==================== SPACE / ENTER - AutoCAD Style ====================
      // Space and Enter work the same way in AutoCAD
      const isConfirmKey = e.key === " " || e.key === "Enter";

      if (isConfirmKey) {
        // Skip if text input is waiting for user input (allow space in text)
        if (commandDrawingActions.isWaitingForTextInput()) {
          return; // Let the text input handle it
        }
        e.preventDefault();

        // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Confirm ====================
        // Nếu drawing command đang active, let it handle Enter/Space first
        if (
          commandDrawingActions.isCommandTool() &&
          commandDrawingActions.handleEnter()
        ) {
          // Command handled it (e.g., finish LINE/POLYLINE)
          return;
        }

        // ==================== MODIFY MOVE/COPY: selectObjects → selectBase ====================
        // AutoCAD workflow: command first, select later, press Space/Enter to confirm selection
        if (
          (drawState.mode === "modifyMove" ||
            drawState.mode === "modifyCopy") &&
          drawState.step === "selectObjects"
        ) {
          // Check if user has selected any objects
          const hasSelection =
            selectedIds.length > 0 ||
            selectedDimensionIds.length > 0 ||
            selectedDoorIds.size > 0;

          if (hasSelection) {
            // Transition to selectBase step
            setDrawState({
              ...drawState,
              step: "selectBase",
              entityIds: selectedIds,
              dimensionIds: selectedDimensionIds,
              doorIds: Array.from(selectedDoorIds),
            });
            const modeName = drawState.mode === "modifyMove" ? "MOVE" : "COPY";
            onPromptChange?.(`${modeName}: Specify base point`);
          } else {
            onPromptChange?.("No objects selected. Select objects first.");
          }
          return;
        }

        // ==================== MODIFY ROTATE: selectObjects → selectBase ====================
        if (
          drawState.mode === "modifyRotate" &&
          drawState.step === "selectObjects"
        ) {
          const hasSelection =
            selectedIds.length > 0 ||
            selectedDimensionIds.length > 0 ||
            selectedDoorIds.size > 0;

          if (hasSelection) {
            setDrawState({
              ...drawState,
              step: "selectBase",
              entityIds: selectedIds,
              dimensionIds: selectedDimensionIds,
              doorIds: Array.from(selectedDoorIds),
            });
            onPromptChange?.("ROTATE: Specify base point");
          } else {
            onPromptChange?.("No objects selected. Select objects first.");
          }
          return;
        }

        // ==================== MODIFY MIRROR: selectObjects → selectFirst ====================
        if (
          drawState.mode === "modifyMirror" &&
          drawState.step === "selectObjects"
        ) {
          const hasSelection =
            selectedIds.length > 0 ||
            selectedDimensionIds.length > 0 ||
            selectedDoorIds.size > 0;

          if (hasSelection) {
            setDrawState({
              ...drawState,
              step: "selectFirst",
              entityIds: selectedIds,
              dimensionIds: selectedDimensionIds,
              doorIds: Array.from(selectedDoorIds),
            });
            onPromptChange?.("MIRROR: Specify first point of mirror line");
          } else {
            onPromptChange?.("No objects selected. Select objects first.");
          }
          return;
        }

        // ==================== MODIFY SCALE: selectObjects → selectBase ====================
        if (
          drawState.mode === "modifyScale" &&
          drawState.step === "selectObjects"
        ) {
          const hasSelection =
            selectedIds.length > 0 ||
            selectedDimensionIds.length > 0 ||
            selectedDoorIds.size > 0;

          if (hasSelection) {
            setDrawState({
              ...drawState,
              step: "selectBase",
              entityIds: selectedIds,
              dimensionIds: selectedDimensionIds,
              doorIds: Array.from(selectedDoorIds),
            });
            onPromptChange?.("SCALE: Specify base point");
          } else {
            onPromptChange?.("No objects selected. Select objects first.");
          }
          return;
        }

        // ==================== MODIFY MOVE/COPY: Enter to commit displacement input ====================
        // Check dynamicInput.value1 first (displayed in input box), fallback to drawState.displacementInput
        const moveCopyInput =
          dynamicInput.value1 ||
          ("displacementInput" in drawState
            ? drawState.displacementInput
            : "") ||
          "";

        if (
          (drawState.mode === "modifyMove" ||
            drawState.mode === "modifyCopy") &&
          drawState.step === "selectDestination" &&
          drawState.basePoint &&
          moveCopyInput
        ) {
          // Calculate angle from mousePos (same as LINE command)
          // Apply ortho constraint if enabled - snap to 0°, 90°, 180°, 270°
          let effectiveMousePos = mousePos;
          if (effectiveOrtho) {
            effectiveMousePos = applyOrtho(drawState.basePoint, mousePos);
          }
          const currentAngle = Math.atan2(
            effectiveMousePos.y - drawState.basePoint.y,
            effectiveMousePos.x - drawState.basePoint.x,
          );

          const parsed = parseDisplacementInput(moveCopyInput, currentAngle);

          if (parsed) {
            const destPoint = {
              x: drawState.basePoint.x + parsed.dx,
              y: drawState.basePoint.y + parsed.dy,
            };

            // Call the appropriate callback
            if (drawState.mode === "modifyMove") {
              onModifyMoveComplete?.(
                drawState.entityIds,
                drawState.dimensionIds,
                drawState.basePoint,
                destPoint,
              );
              setDrawState({ mode: "idle" });
              setDynamicInput((prev) => ({
                ...prev,
                active: false,
                value1: "",
                value2: "",
              })); // Clear input overlay
              setMovingPreviewDelta(null);
              onPromptChange?.("MOVE completed");
            } else {
              onModifyCopyComplete?.(
                drawState.entityIds,
                drawState.dimensionIds,
                drawState.basePoint,
                destPoint,
              );
              // Stay in copy mode for more copies, reset input
              setDrawState({
                ...drawState,
                displacementInput: "",
              });
              // Also reset dynamicInput.value1
              setDynamicInput((prev) => ({ ...prev, value1: "", value2: "" }));
              onPromptChange?.(
                "COPY: type distance<angle or click for next copy (ESC to exit)",
              );
            }
            return;
          }
        }

        // 1. In SELECT mode and idle = repeat last command
        if (activeTool === ToolMode.SELECT && drawState.mode === "idle") {
          onRepeatLastCommand?.();
          return;
        }

        // 2. Dimension tools at step 0 = toggle auto select mode
        if (
          drawState.mode === "idle" &&
          dimensionToolStep === 0 &&
          (activeTool === ToolMode.DRAW_DIM_LINEAR ||
            activeTool === ToolMode.DRAW_DIM_ALIGNED ||
            activeTool === ToolMode.DRAW_DIM_RADIUS)
        ) {
          onToggleAutoSelectMode?.();
          return;
        }

        // 3. Line/Rect/Circle modes → Đã được xử lý bởi useCommandDrawing (ĐIỀU KIỆN 1)
        // Legacy code đã bị xóa - các drawing tools giờ đều qua commandDrawingActions.handleEnter()

        // 4. QDIM step 0 = confirm selection
        if (activeTool === ToolMode.DRAW_QDIM && qdimStep === 0) {
          if (selectedIds.length > 0) {
            const selectedEntities = entities.filter((ent) =>
              selectedIds.includes(ent.id),
            );
            onQdimSelectionConfirm?.(selectedEntities);
            onPromptChange?.(
              `QDIM: ${selectedEntities.length} objects selected. Specify dimension line position`,
            );
          } else {
            onPromptChange?.("QDIM: No objects selected. Select objects first");
          }
          return;
        }

        return;
      }
      // ==================== END SPACE / ENTER ====================

      if (e.key === "Delete") {
        // Delete selected entities
        deleteSelectedEntities();
        // Delete selected dimensions
        if (selectedDimensionIds.length > 0) {
          selectedDimensionIds.forEach((id) => onDimensionDelete?.(id));
          onDimensionSelect?.([]);
          onPromptChange?.(
            `Deleted ${selectedDimensionIds.length} dimension(s)`,
          );
        }
        return;
      }

      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        // If dimensions are selected or in dimension tool, select all dimensions
        if (
          selectedDimensionIds.length > 0 ||
          activeTool === ToolMode.DRAW_DIMENSION
        ) {
          onDimensionSelect?.(dimensions.map((d) => d.id));
          onPromptChange?.(`Selected all dimensions (${dimensions.length})`);
        } else {
          // Select all entities
          selectEntities(entities.map((e) => e.id));
          onPromptChange?.(`Selected all (${entities.length} objects)`);
        }
        return;
      }

      // Ctrl+Shift+A: Select both entities AND dimensions
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        selectEntities(entities.map((e) => e.id));
        onDimensionSelect?.(dimensions.map((d) => d.id));
        onPromptChange?.(
          `Selected all (${entities.length} objects, ${dimensions.length} dimensions)`,
        );
        return;
      }

      if (e.ctrlKey && e.key === "c") {
        // Copy dimensions if selected
        if (selectedDimensionIds.length > 0) {
          e.preventDefault();
          const selectedDims = dimensions.filter((d) =>
            selectedDimensionIds.includes(d.id),
          );
          setDimensionClipboard(selectedDims);
          onDimensionCopy?.(selectedDimensionIds);
          onPromptChange?.(`Copied ${selectedDims.length} dimension(s)`);
          return;
        }
        // If onPasteClick is provided, parent handles entity/door copy via ClipboardManager
        // So we don't handle it here - let event bubble up
        if (onPasteClick) {
          return; // Let parent handle Ctrl+C for entities/doors
        }
        e.preventDefault();
        copySelectedToClipboard();
        return;
      }

      if (e.ctrlKey && e.key === "v") {
        // Paste dimensions if clipboard has them
        if (dimensionClipboard.length > 0) {
          e.preventDefault();
          const offset = 20 / zoom;
          dimensionClipboard.forEach((dim) => {
            const newDim: DimensionEntity = {
              ...dim,
              id: `dim-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              point1: { x: dim.point1.x + offset, y: dim.point1.y + offset },
              point2: { x: dim.point2.x + offset, y: dim.point2.y + offset },
            };
            onDimensionUpdate?.(newDim.id, newDim);
          });
          onPromptChange?.(`Pasted ${dimensionClipboard.length} dimension(s)`);
          return;
        }
        // If onPasteClick is provided, parent handles paste mode for entities/doors
        if (onPasteClick) {
          return; // Let parent handle Ctrl+V for paste mode
        }
        e.preventDefault();
        pasteFromClipboard();
        return;
      }

      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // ==================== DISPLACEMENT INPUT for MOVE/COPY ====================
      // Block numeric/symbol input during selectObjects and selectBase steps
      // These keys should only be processed during selectDestination step
      if (
        (drawState.mode === "modifyMove" || drawState.mode === "modifyCopy") &&
        (drawState.step === "selectObjects" ||
          drawState.step === "selectBase") &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        // Block numeric/symbol keys that could cause issues - just ignore them
        const numericChars = /^[0-9@<,.\-]$/;
        if (numericChars.test(e.key)) {
          e.preventDefault();
          // Show helpful prompt based on current step
          const modeName = drawState.mode === "modifyMove" ? "MOVE" : "COPY";
          if (drawState.step === "selectObjects") {
            onPromptChange?.(
              `${modeName}: Select objects first, then press Enter`,
            );
          } else {
            onPromptChange?.(`${modeName}: Click to specify base point`);
          }
          return;
        }
      }

      // When in selectDestination step, accept numeric/symbol input for @dx,dy or distance<angle
      // BUT: If dynamicInput is active (overlay has focus), let the overlay handle input instead
      if (
        (drawState.mode === "modifyMove" || drawState.mode === "modifyCopy") &&
        drawState.step === "selectDestination" &&
        !e.ctrlKey &&
        !e.altKey &&
        !(dynamicInput.active && dynamicInput.mode === "move-copy") // Let overlay handle when active
      ) {
        // Accept: 0-9, @, <, ,, -, . and Backspace
        const validChars = /^[0-9@<,.\-]$/;

        if (validChars.test(e.key)) {
          e.preventDefault();
          // Update dynamicInput.value1 so it shows in the input box
          const currentInput = dynamicInput.value1 || "";
          const newInput = currentInput + e.key;

          setDynamicInput((prev) => ({
            ...prev,
            value1: newInput,
          }));

          // Also update drawState for backup
          setDrawState({
            ...drawState,
            displacementInput: newInput,
          });

          // Parse and update preview - calculate angle from basePoint to mousePos (like LINE)
          const currentAngle = drawState.basePoint
            ? Math.atan2(
                mousePos.y - drawState.basePoint.y,
                mousePos.x - drawState.basePoint.x,
              )
            : 0;
          const parsed = parseDisplacementInput(newInput, currentAngle);
          if (parsed && drawState.basePoint) {
            setMovingPreviewDelta({ x: parsed.dx, y: parsed.dy });
          }

          const modeName = drawState.mode === "modifyMove" ? "MOVE" : "COPY";
          onPromptChange?.(`${modeName}: ${newInput}`);
          return;
        }

        // Backspace to delete last character
        if (e.key === "Backspace") {
          e.preventDefault();
          // Use dynamicInput.value1 as source of truth
          const currentInput = dynamicInput.value1 || "";
          if (currentInput.length > 0) {
            const newInput = currentInput.slice(0, -1);

            // Update dynamicInput for display
            setDynamicInput((prev) => ({
              ...prev,
              value1: newInput,
            }));

            // Also update drawState for backup
            setDrawState({
              ...drawState,
              displacementInput: newInput,
            });

            // Parse and update preview - calculate angle from basePoint to mousePos (like LINE)
            const currentAngle = drawState.basePoint
              ? Math.atan2(
                  mousePos.y - drawState.basePoint.y,
                  mousePos.x - drawState.basePoint.x,
                )
              : 0;
            const parsed = parseDisplacementInput(newInput, currentAngle);
            if (parsed && drawState.basePoint) {
              setMovingPreviewDelta({ x: parsed.dx, y: parsed.dy });
            } else if (newInput === "") {
              // Reset to mouse position preview
              setMovingPreviewDelta(null);
            }

            const modeName = drawState.mode === "modifyMove" ? "MOVE" : "COPY";
            onPromptChange?.(
              `${modeName}: ${newInput || "type distance<angle or click"}`,
            );
          }
          return;
        }
      }

      // Arrow keys to move
      if (selectedIds.length > 0 && !e.ctrlKey) {
        const step = e.shiftKey ? 10 : 1;
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            moveSelectedEntities(0, step);
            break;
          case "ArrowDown":
            e.preventDefault();
            moveSelectedEntities(0, -step);
            break;
          case "ArrowLeft":
            e.preventDefault();
            moveSelectedEntities(-step, 0);
            break;
          case "ArrowRight":
            e.preventDefault();
            moveSelectedEntities(step, 0);
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    activeTool,
    currentLayerId,
    dimensions,
    dimensionClipboard,
    drawState,
    entities,
    selectedIds,
    selectedDimensionIds,
    zoom,
    clearSelection,
    addEntity,
    deleteSelectedEntities,
    copySelectedToClipboard,
    pasteFromClipboard,
    duplicateSelected,
    moveSelectedEntities,
    selectEntities,
    undo,
    redo,
    onPromptChange,
    onDimensionDelete,
    onDimensionSelect,
    onDimensionUpdate,
    onDimensionCopy,
    qdimStep,
    onQdimSelectionConfirm,
    dimensionToolStep,
    onToggleAutoSelectMode,
    onRepeatLastCommand,
    commandDrawingActions, // ĐIỀU KIỆN 1: Command-based drawing
    toggleOrtho,
    orthoMode,
    textScaleInput.active, // Text scale input state
    currentStrokeStyle,
    clearDoorSelection, // Direct store access for door selection on ESC
  ]);
}
