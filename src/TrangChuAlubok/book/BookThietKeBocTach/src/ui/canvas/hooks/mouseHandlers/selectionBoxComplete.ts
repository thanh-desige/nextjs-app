/**
 * selectionBoxComplete — Handles mouseUp selection box completion
 *
 * STEP-5.23 extraction from useMouseHandlers.ts to reduce file size.
 * Handles:
 * - Window/crossing selection box entity/dimension selection
 * - Ctrl+box removal from selection
 * - Pending modify mode restoration after selection
 *
 * ĐIỀU KIỆN 1: UI chỉ thu thập điểm, gọi callback để parent tạo Command và execute
 */

import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DimensionEntity } from "../../../../core/dimensions/DimensionManager";
import type { DrawingState } from "../../canvas.types";
import type { CadEntity } from "../../types/CadEntity";
import { entityIntersectsRect, dimensionIntersectsRect } from "../../utils";

export interface SelectionBoxCompleteParams {
  drawState: DrawingState;
  setDrawState: Dispatch<SetStateAction<DrawingState>>;
  entities: CadEntity[];
  dimensions: DimensionEntity[];
  selectedIds: string[];
  selectedDimensionIds: string[];
  selectEntities: (ids: string[], additive?: boolean) => void;
  onPromptChange?: (prompt: string) => void;
  onDimensionSelect?: (ids: string[]) => void;
}

/**
 * Handle mouseUp when drawState.mode === "selecting" (selection box completion).
 * Returns true if handled (caller should return early).
 */
export function handleSelectionBoxComplete(
  params: SelectionBoxCompleteParams,
  e: React.MouseEvent<HTMLCanvasElement>,
): boolean {
  const {
    drawState,
    setDrawState,
    entities,
    dimensions,
    selectedIds,
    selectedDimensionIds,
    selectEntities,
    onPromptChange,
    onDimensionSelect,
  } = params;

  if (drawState.mode !== "selecting") return false;

  // Select entities in box
  const inBox = entities.filter((ent) =>
    entityIntersectsRect(ent, drawState.start, drawState.currentPos),
  );

  // Also select dimensions in box
  const dimsInBox = dimensions.filter((dim) =>
    dimensionIntersectsRect(dim, drawState.start, drawState.currentPos),
  );

  // ==================== AutoCAD Selection Behavior ====================
  // Window/Crossing selection = APPEND to existing selection (Rule 10)
  // Ctrl+drag = REMOVE from selection (toggle)
  // Shift+drag = Same as normal (append) for compatibility

  if (inBox.length > 0) {
    const inBoxIds = inBox.map((ent) => ent.id);
    if (e.ctrlKey) {
      // Ctrl+box: Remove entities in box from selection
      const newSelection = selectedIds.filter(
        (id) => !inBoxIds.includes(id),
      );
      selectEntities(newSelection);
    } else {
      // Normal box: APPEND entities to selection (AutoCAD behavior)
      selectEntities(inBoxIds, true); // true = additive
    }
  }

  if (dimsInBox.length > 0) {
    const inBoxDimIds = dimsInBox.map((d) => d.id);
    if (e.ctrlKey) {
      // Ctrl+box: Remove dimensions from selection
      const newDimSelection = selectedDimensionIds.filter(
        (id) => !inBoxDimIds.includes(id),
      );
      onDimensionSelect?.(newDimSelection);
    } else {
      // Normal box: APPEND dimensions to selection
      const newDimSelection = [
        ...new Set([...selectedDimensionIds, ...inBoxDimIds]),
      ];
      onDimensionSelect?.(newDimSelection);
    }
  }

  const totalSelected = inBox.length + dimsInBox.length;
  if (totalSelected > 0) {
    const action = e.ctrlKey ? "Removed" : "Added";
    onPromptChange?.(
      `${action} ${inBox.length} object(s), ${dimsInBox.length} dimension(s) to selection`,
    );
  }

  // Check if we need to restore a pending modify mode (for "command first, select later" workflow)
  if (drawState.pendingModifyMode) {
    const modeName = drawState.pendingModifyMode;
    // Restore the modify mode with selectObjects step
    if (modeName === "modifyMove" || modeName === "modifyCopy") {
      setDrawState({
        mode: modeName,
        step: "selectObjects",
        entityIds: [],
        dimensionIds: [],
        doorIds: [],
      });
    } else if (modeName === "modifyRotate") {
      setDrawState({
        mode: modeName,
        step: "selectObjects",
        entityIds: [],
        dimensionIds: [],
        doorIds: [],
      });
    } else if (modeName === "modifyMirror") {
      setDrawState({
        mode: modeName,
        step: "selectObjects",
        entityIds: [],
        dimensionIds: [],
        doorIds: [],
      });
    } else if (modeName === "modifyScale") {
      setDrawState({
        mode: modeName,
        step: "selectObjects",
        entityIds: [],
        dimensionIds: [],
        doorIds: [],
      });
    }

    // Show appropriate prompt
    const modeNames: Record<string, string> = {
      modifyMove: "MOVE",
      modifyCopy: "COPY",
      modifyRotate: "ROTATE",
      modifyMirror: "MIRROR",
      modifyScale: "SCALE",
    };
    onPromptChange?.(
      `${
        modeNames[modeName] || modeName
      }: Select objects (press Space/Enter when done)`,
    );
  } else {
    setDrawState({ mode: "idle" });
  }

  return true;
}
