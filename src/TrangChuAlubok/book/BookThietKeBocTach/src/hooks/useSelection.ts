/**
 * useSelection - Hook for managing CAD entity selection
 *
 * STEP-1.3: Selection now reads from CadDocument (single source of truth)
 * via useCanvasEntities(). All selection actions go through Commands.
 */

"use client";

import { useCallback, useMemo } from "react";
import { useEngineStore } from "../store/engineStore";
import { useCanvasEntities } from "./useCanvasEntities";
import { IEntity } from "../core/entities/Entity.types";
import { SelectionMode } from "../core/engine/EngineState";

// ==================== Types ====================

export interface UseSelectionReturn {
  // Selection state
  selectedIds: string[];
  selectedEntities: IEntity[];
  hoveredId: string | null;
  selectionMode: SelectionMode;

  // Computed
  hasSelection: boolean;
  selectionCount: number;
  isSingleSelection: boolean;
  isMultiSelection: boolean;

  // Actions
  select: (ids: string[]) => void;
  addToSelection: (ids: string[]) => void;
  removeFromSelection: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setHovered: (id: string | null) => void;
  setSelectionMode: (mode: SelectionMode) => void;

  // Queries
  isSelected: (id: string) => boolean;
  isHovered: (id: string) => boolean;
}

// ==================== Hook Implementation ====================

export function useSelection(): UseSelectionReturn {
  // STEP-1.3: Read from CadDocument via useCanvasEntities (single source of truth)
  const {
    selectedIds,
    entities: allEntities,
    selectEntities,
    clearSelection: clearCanvasSel,
  } = useCanvasEntities();

  // Non-selection state still from engineStore
  const hoveredId = useEngineStore((state) => state.hoveredId);
  const selectionMode = useEngineStore((state) => state.selectionMode);
  const getEntity = useEngineStore((state) => state.getEntity);

  // Store actions (non-selection)
  const storeSetHovered = useEngineStore((state) => state.setHovered);
  const storeSetSelectionMode = useEngineStore(
    (state) => state.setSelectionMode,
  );

  // Computed values
  const selectedEntities = useMemo(() => {
    return selectedIds
      .map((id) => getEntity(id))
      .filter((e): e is IEntity => e !== undefined);
  }, [selectedIds, getEntity]);

  const hasSelection = selectedIds.length > 0;
  const selectionCount = selectedIds.length;
  const isSingleSelection = selectedIds.length === 1;
  const isMultiSelection = selectedIds.length > 1;

  // Selection actions — all go through Commands via useCanvasEntities
  const select = useCallback(
    (ids: string[]) => {
      selectEntities(ids, false);
    },
    [selectEntities],
  );

  const addToSelection = useCallback(
    (ids: string[]) => {
      selectEntities(ids, true);
    },
    [selectEntities],
  );

  const removeFromSelection = useCallback(
    (ids: string[]) => {
      const newIds = selectedIds.filter((id) => !ids.includes(id));
      selectEntities(newIds, false);
    },
    [selectedIds, selectEntities],
  );

  const toggleSelection = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        const newIds = selectedIds.filter((sid) => sid !== id);
        selectEntities(newIds, false);
      } else {
        selectEntities([id], true);
      }
    },
    [selectedIds, selectEntities],
  );

  const clearSelection = useCallback(() => {
    clearCanvasSel();
  }, [clearCanvasSel]);

  const selectAll = useCallback(() => {
    const allIds = allEntities.map((e) => e.id);
    selectEntities(allIds, false);
  }, [allEntities, selectEntities]);

  const setHovered = useCallback(
    (id: string | null) => {
      storeSetHovered(id);
    },
    [storeSetHovered],
  );

  const setSelectionMode = useCallback(
    (mode: SelectionMode) => {
      storeSetSelectionMode(mode);
    },
    [storeSetSelectionMode],
  );

  // Query functions
  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.includes(id);
    },
    [selectedIds],
  );

  const isHovered = useCallback(
    (id: string) => {
      return hoveredId === id;
    },
    [hoveredId],
  );

  return {
    selectedIds,
    selectedEntities,
    hoveredId,
    selectionMode,
    hasSelection,
    selectionCount,
    isSingleSelection,
    isMultiSelection,
    select,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    clearSelection,
    selectAll,
    setHovered,
    setSelectionMode,
    isSelected,
    isHovered,
  };
}

export default useSelection;
