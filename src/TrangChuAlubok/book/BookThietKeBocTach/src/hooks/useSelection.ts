/**
 * useSelection - Hook for managing CAD entity selection
 */

"use client";

import { useCallback, useMemo } from "react";
import { useEngineStore } from "../store/engineStore";
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
  // Store selectors
  const selectedIds = useEngineStore((state) => state.selectedIds);
  const hoveredId = useEngineStore((state) => state.hoveredId);
  const selectionMode = useEngineStore((state) => state.selectionMode);
  const getEntity = useEngineStore((state) => state.getEntity);

  // Store actions
  const storeSelect = useEngineStore((state) => state.select);
  const storeAddToSelection = useEngineStore((state) => state.addToSelection);
  const storeRemoveFromSelection = useEngineStore(
    (state) => state.removeFromSelection
  );
  const storeClearSelection = useEngineStore((state) => state.clearSelection);
  const storeSelectAll = useEngineStore((state) => state.selectAll);
  const storeSetHovered = useEngineStore((state) => state.setHovered);
  const storeSetSelectionMode = useEngineStore(
    (state) => state.setSelectionMode
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

  // Memoized callbacks
  const select = useCallback(
    (ids: string[]) => {
      storeSelect(ids);
    },
    [storeSelect]
  );

  const addToSelection = useCallback(
    (ids: string[]) => {
      storeAddToSelection(ids);
    },
    [storeAddToSelection]
  );

  const removeFromSelection = useCallback(
    (ids: string[]) => {
      storeRemoveFromSelection(ids);
    },
    [storeRemoveFromSelection]
  );

  const toggleSelection = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        storeRemoveFromSelection([id]);
      } else {
        storeAddToSelection([id]);
      }
    },
    [selectedIds, storeAddToSelection, storeRemoveFromSelection]
  );

  const clearSelection = useCallback(() => {
    storeClearSelection();
  }, [storeClearSelection]);

  const selectAll = useCallback(() => {
    storeSelectAll();
  }, [storeSelectAll]);

  const setHovered = useCallback(
    (id: string | null) => {
      storeSetHovered(id);
    },
    [storeSetHovered]
  );

  const setSelectionMode = useCallback(
    (mode: SelectionMode) => {
      storeSetSelectionMode(mode);
    },
    [storeSetSelectionMode]
  );

  // Query functions
  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.includes(id);
    },
    [selectedIds]
  );

  const isHovered = useCallback(
    (id: string) => {
      return hoveredId === id;
    },
    [hoveredId]
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
