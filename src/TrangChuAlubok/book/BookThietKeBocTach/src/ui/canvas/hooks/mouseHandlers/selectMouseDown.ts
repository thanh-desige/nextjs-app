/**
 * selectMouseDown — Handles mouseDown for SELECT tool
 *
 * STEP-5.23 extraction from useMouseHandlers.ts to reduce file size.
 * Handles:
 * - Dimension grip editing start
 * - Dimension selection (click, Ctrl+click, move)
 * - Entity selection (click, double-click text edit, Ctrl+click toggle, move start)
 * - Window/crossing selection start (click on empty canvas)
 *
 * ĐIỀU KIỆN 1: UI chỉ thu thập điểm, gọi callback để parent tạo Command và execute
 */

import React from "react";
import type { Dispatch, SetStateAction, RefObject, MutableRefObject } from "react";
import type { DimensionEntity } from "../../../../core/dimensions/DimensionManager";
import type { DrawingState } from "../../canvas.types";
import type { Point, CadEntity } from "../../types/CadEntity";
import type { TextHitTestContext } from "../../utils";
import {
  hitTestEntity,
  hitTestDimension,
  hitTestDimensionGrip,
} from "../../utils";

export interface SelectMouseDownParams {
  drawState: DrawingState;
  setDrawState: Dispatch<SetStateAction<DrawingState>>;
  hitTolerance: number;
  isShiftPressed: boolean;
  entities: CadEntity[];
  dimensions: DimensionEntity[];
  selectedIds: string[];
  selectedDimensionIds: string[];
  selectEntities: (ids: string[], additive?: boolean) => void;
  getSelectedEntities: () => CadEntity[];
  saveHistoryBeforeMove: () => void;
  setTextInput: Dispatch<
    SetStateAction<{
      active: boolean;
      value: string;
      position: Point;
      editingId?: string;
    }>
  >;
  textInputRef: RefObject<HTMLTextAreaElement | null>;
  textInputOriginalValueRef: MutableRefObject<string>;
  textInputMountedRef: MutableRefObject<boolean>;
  textHitTestContext: TextHitTestContext | undefined;
  onPromptChange?: (prompt: string) => void;
  onDimensionSelect?: (ids: string[]) => void;
  // Double-click tracking refs (owned by hook, passed in)
  lastClickedEntity: MutableRefObject<string | null>;
  lastClickTime: MutableRefObject<number>;
}

/**
 * Handle mouseDown when the active tool is SELECT.
 * Returns true if the event was handled and the caller should return early.
 */
export function handleSelectMouseDown(
  params: SelectMouseDownParams,
  worldPos: Point,
  e: React.MouseEvent<HTMLCanvasElement>,
): void {
  const {
    setDrawState,
    hitTolerance,
    isShiftPressed,
    entities,
    dimensions,
    selectedIds,
    selectedDimensionIds,
    selectEntities,
    getSelectedEntities,
    saveHistoryBeforeMove,
    setTextInput,
    textInputRef,
    textInputOriginalValueRef,
    textInputMountedRef,
    textHitTestContext,
    onPromptChange,
    onDimensionSelect,
    lastClickedEntity,
    lastClickTime,
  } = params;

  // First check if clicking on a grip of selected dimension
  for (const dimId of selectedDimensionIds) {
    const dim = dimensions.find((d) => d.id === dimId);
    if (dim) {
      const grip = hitTestDimensionGrip(dim, worldPos, hitTolerance * 2);
      if (grip) {
        // Start grip editing mode
        setDrawState({
          mode: "editingDimensionGrip",
          dimensionId: dim.id,
          gripType: grip.type,
          startPos: worldPos,
          originalDimension: { ...dim },
        });
        onPromptChange?.(`Editing dimension ${grip.type}`);
        return;
      }
    }
  }

  // Check if clicking on a dimension
  const hitDimension = dimensions.find((dim) =>
    hitTestDimension(dim, worldPos, hitTolerance),
  );

  if (hitDimension) {
    // ==================== AutoCAD Selection Behavior for Dimensions ====================
    // Ctrl+Click = Toggle (remove if selected, add if not)
    // Click = Append to selection (incremental)
    // Click on already selected = start move operation

    if (e.ctrlKey) {
      // Ctrl+Click: Toggle dimension selection
      const newSelection = selectedDimensionIds.includes(hitDimension.id)
        ? selectedDimensionIds.filter((id) => id !== hitDimension.id)
        : [...selectedDimensionIds, hitDimension.id];
      onDimensionSelect?.(newSelection);
    } else if (selectedDimensionIds.includes(hitDimension.id)) {
      // Already selected - start moving
      setDrawState({
        mode: "movingDimension",
        startPos: worldPos,
        dimensionId: hitDimension.id,
        originalOffset: hitDimension.offset,
      });
      onPromptChange?.("MOVE DIMENSION: Drag to adjust offset");
      return;
    } else {
      // Click on unselected dimension = APPEND to selection (AutoCAD behavior)
      const newSelection = [...selectedDimensionIds, hitDimension.id];
      onDimensionSelect?.(newSelection);
    }
    onPromptChange?.(`Dimension selected: ${hitDimension.id}`);
    return;
  }

  // Then check entities
  const hitEntity = entities.find((ent) =>
    hitTestEntity(ent, worldPos, hitTolerance, textHitTestContext),
  );

  if (hitEntity) {
    // Check for double-click on text entity for editing
    const currentTime = Date.now();
    const isDoubleClick =
      lastClickedEntity.current === hitEntity.id &&
      currentTime - lastClickTime.current < 500; // 500ms for double-click

    lastClickTime.current = currentTime;
    lastClickedEntity.current = hitEntity.id;

    // Handle double-click on text for editing
    if (isDoubleClick && hitEntity.type === "text") {
      // Store original value to detect changes
      textInputOriginalValueRef.current = hitEntity.text || "";
      textInputMountedRef.current = false; // Reset mounted flag

      // Start text editing mode
      setTextInput({
        active: true,
        value: hitEntity.text || "",
        position: hitEntity.points[0],
        editingId: hitEntity.id,
      });
      setDrawState({
        mode: "text",
        position: hitEntity.points[0],
        inputActive: true,
      });
      onPromptChange?.("TEXT: Edit text and press Enter to save");

      // Focus input after a short delay
      setTimeout(() => {
        textInputRef.current?.focus();
        textInputRef.current?.select();
      }, 50);
      return;
    }

    // Clear dimension selection when selecting entity (unless Ctrl/Shift held)
    if (!isShiftPressed && !e.ctrlKey) {
      onDimensionSelect?.([]);
    }

    // ==================== AutoCAD Selection Behavior ====================
    // Rule 10: Selection Persistence
    // - Click = Append to selection (incremental)
    // - Ctrl+Click = Toggle (remove if selected, add if not)
    // - Shift+Click = Same as Click (append) for compatibility
    // - Click on already selected = start move/edit operation
    // - ESC is the only way to clear selection (handled elsewhere)

    if (e.ctrlKey) {
      // Ctrl+Click = Toggle selection
      if (selectedIds.includes(hitEntity.id)) {
        // Remove from selection
        const newSelection = selectedIds.filter(
          (id) => id !== hitEntity.id,
        );
        selectEntities(newSelection);
      } else {
        // Add to selection
        selectEntities([hitEntity.id], true);
      }
    } else if (selectedIds.includes(hitEntity.id)) {
      // Entity is already selected
      // For TEXT entities: click on selected text enters edit mode
      if (hitEntity.type === "text") {
        // Store original value to detect changes
        textInputOriginalValueRef.current = hitEntity.text || "";
        textInputMountedRef.current = false; // Reset mounted flag

        // Start text editing mode
        setTextInput({
          active: true,
          value: hitEntity.text || "",
          position: hitEntity.points[0],
          editingId: hitEntity.id,
        });
        setDrawState({
          mode: "text",
          position: hitEntity.points[0],
          inputActive: true,
        });
        onPromptChange?.(
          "TEXT: Edit text (click outside to save, Escape to cancel)",
        );

        // Focus input after a short delay
        setTimeout(() => {
          textInputRef.current?.focus();
          textInputRef.current?.select();
        }, 50);
        return;
      }

      // Check if Ctrl is pressed for scaling
      if (e.ctrlKey) {
        // Start scaling mode
        setDrawState({
          mode: "modifyScale",
          step: "selectScale",
          basePoint: hitEntity.points[0], // Use first point as scale center
          entityIds: [hitEntity.id],
          dimensionIds: [],
        });
        onPromptChange?.("SCALE: Move mouse to scale");
      } else {
        // Save history before moving
        saveHistoryBeforeMove();
        setDrawState({
          mode: "moving",
          startPos: worldPos,
          entities: getSelectedEntities(),
          originalPositions: getSelectedEntities().map((ent) => [
            ...ent.points,
          ]),
        });
        onPromptChange?.(
          "MOVE: type distance<angle or click destination",
        );
      }
    } else {
      // ==================== AutoCAD Selection Behavior ====================
      // Click on unselected entity = APPEND to selection (not replace)
      // This follows Rule 10: Selection Persistence
      selectEntities([hitEntity.id], true); // Always additive
    }
  } else {
    // ==================== AutoCAD Selection Behavior ====================
    // Click on empty canvas = Start window/crossing selection
    // DO NOT clear selection here! ESC is the only way to clear (Rule 10)
    setDrawState({
      mode: "selecting",
      start: worldPos,
      currentPos: worldPos,
    });
    onPromptChange?.("SELECT: Drag to select objects");
  }
}
