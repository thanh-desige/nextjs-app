/**
 * useEntityOperations  STEP-5 extraction from CadDrawingCanvas
 *
 * Owns: selectEntities, clearSelection, getSelectedEntities,
 *       addEntity, deleteSelectedEntities,
 *       copySelectedToClipboard, pasteFromClipboard,
 *       duplicateSelected, moveSelectedEntities, saveHistoryBeforeMove
 */

import { useCallback, useState } from "react";
import type { CadEntity } from "../types/CadEntity";
import { moveEntity, copyEntity } from "../utils";

// ==================== Interface ====================

export interface EntityOperationsParams {
  // Entity state
  entities: CadEntity[];
  selectedIds: string[];
  isControlled: boolean;
  internalEntities: CadEntity[];
  setInternalEntities: React.Dispatch<React.SetStateAction<CadEntity[]>>;
  useExternalHistory?: boolean;

  // Zoom (for paste/duplicate offset)
  zoom: number;

  // History
  saveToHistory: (entities: CadEntity[]) => void;

  // Callbacks
  onSelectEntities?: (ids: string[], additive: boolean) => void;
  onSelectionChanged?: (ids: string[]) => void;
  onAddEntity?: (entity: CadEntity) => void;
  onDeleteEntities?: (ids: string[]) => void;
  onMoveEntities?: (ids: string[], dx: number, dy: number) => void;
  onEntityCreated?: (entity: CadEntity) => void;
  onEntityUpdated?: (entity: CadEntity) => void;
  onEntityDeleted?: (id: string) => void;
  onPromptChange?: (msg: string) => void;
}

export interface EntityOperationsReturn {
  selectEntities: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  getSelectedEntities: () => CadEntity[];
  addEntity: (entity: CadEntity) => void;
  deleteSelectedEntities: () => void;
  copySelectedToClipboard: () => void;
  pasteFromClipboard: () => void;
  duplicateSelected: () => void;
  moveSelectedEntities: (dx: number, dy: number) => void;
  saveHistoryBeforeMove: () => void;
  clipboard: CadEntity[];
  setClipboard: React.Dispatch<React.SetStateAction<CadEntity[]>>;
}

// ==================== Hook ====================

export function useEntityOperations(params: EntityOperationsParams): EntityOperationsReturn {
  const {
    entities,
    selectedIds,
    isControlled,
    internalEntities,
    setInternalEntities,
    useExternalHistory,
    zoom,
    saveToHistory,
    onSelectEntities,
    onSelectionChanged,
    onAddEntity,
    onDeleteEntities,
    onMoveEntities,
    onEntityCreated,
    onEntityUpdated,
    onEntityDeleted,
    onPromptChange,
  } = params;

  // Clipboard state (moved from CadDrawingCanvas)
  const [clipboard, setClipboard] = useState<CadEntity[]>([]);

  // ==================== Selection Helpers ====================
  // STEP-1.3: Selection is always controlled  no internalSelectedIds fallback

  const selectEntities = useCallback(
    (ids: string[], additive = false) => {
      let newSelection: string[];
      if (additive) {
        const existing = new Set(selectedIds);
        ids.forEach((id) => {
          if (existing.has(id)) existing.delete(id);
          else existing.add(id);
        });
        newSelection = Array.from(existing);
      } else {
        newSelection = ids;
      }

      if (onSelectEntities) {
        // Controlled mode: gọi callback với newSelection đã được tính toán
        // Luôn dùng additive = false vì newSelection đã bao gồm logic toggle rồi
        onSelectEntities(newSelection, false);
        return;
      }

      // Uncontrolled legacy fallback  notify parent only
      onSelectionChanged?.(newSelection);
    },
    [onSelectEntities, selectedIds, onSelectionChanged],
  );

  const clearSelection = useCallback(() => {
    if (onSelectEntities) {
      // Controlled mode: gọi callback với empty array
      onSelectEntities([], false);
      return;
    }

    // Uncontrolled legacy fallback  notify parent only
    onSelectionChanged?.([]);
  }, [onSelectEntities, onSelectionChanged]);

  const getSelectedEntities = useCallback((): CadEntity[] => {
    return entities.filter((e) => selectedIds.includes(e.id));
  }, [entities, selectedIds]);

  // ==================== Entity Operations ====================
  // ĐIỀU KIỆN 1: Trong controlled mode, tất cả operations đều đi qua callbacks

  const addEntity = useCallback(
    (entity: CadEntity) => {
      if (isControlled && onAddEntity) {
        // Controlled mode: gọi callback để thêm qua Commands
        onAddEntity(entity);
        return;
      }
      // Uncontrolled mode: internal state
      if (!useExternalHistory) {
        saveToHistory(internalEntities);
      }
      setInternalEntities((prev) => [...prev, entity]);
      onEntityCreated?.(entity);
    },
    [
      isControlled,
      onAddEntity,
      useExternalHistory,
      internalEntities,
      saveToHistory,
      onEntityCreated,
    ],
  );

  const deleteSelectedEntities = useCallback(() => {
    if (selectedIds.length === 0) return;

    if (isControlled && onDeleteEntities) {
      // Controlled mode: gọi callback để xóa qua Commands
      onDeleteEntities(selectedIds);
      return;
    }
    // Uncontrolled mode: internal state
    if (!useExternalHistory) {
      saveToHistory(internalEntities);
    }
    setInternalEntities((prev) =>
      prev.filter((e) => !selectedIds.includes(e.id)),
    );
    selectedIds.forEach((id) => onEntityDeleted?.(id));
    clearSelection();
    onPromptChange?.(`Deleted ${selectedIds.length} object(s)`);
  }, [
    isControlled,
    onDeleteEntities,
    selectedIds,
    useExternalHistory,
    internalEntities,
    saveToHistory,
    onEntityDeleted,
    clearSelection,
    onPromptChange,
  ]);

  const copySelectedToClipboard = useCallback(() => {
    const selected = getSelectedEntities();
    if (selected.length > 0) {
      setClipboard(selected.map(copyEntity));
      onPromptChange?.(`Copied ${selected.length} object(s)`);
    }
  }, [getSelectedEntities, onPromptChange]);

  const pasteFromClipboard = useCallback(() => {
    if (clipboard.length === 0) return;

    const offset = 20 / zoom;
    const pasted = clipboard.map((e) =>
      moveEntity(copyEntity(e), offset, offset),
    );

    if (isControlled && onAddEntity) {
      // Controlled mode: add entities through callback
      pasted.forEach((entity) => onAddEntity(entity));
    } else {
      // Uncontrolled mode
      if (!useExternalHistory) {
        saveToHistory(internalEntities);
      }
      setInternalEntities((prev) => [...prev, ...pasted]);
    }
    selectEntities(pasted.map((e) => e.id));
    onPromptChange?.(`Pasted ${pasted.length} object(s)`);
  }, [
    clipboard,
    zoom,
    isControlled,
    onAddEntity,
    useExternalHistory,
    internalEntities,
    saveToHistory,
    selectEntities,
    onPromptChange,
  ]);

  const duplicateSelected = useCallback(() => {
    const selected = getSelectedEntities();
    if (selected.length === 0) return;

    const offset = 20 / zoom;
    const duplicated = selected.map((e) =>
      moveEntity(copyEntity(e), offset, offset),
    );

    if (isControlled && onAddEntity) {
      // Controlled mode: add entities through callback
      duplicated.forEach((entity) => onAddEntity(entity));
    } else {
      // Uncontrolled mode
      if (!useExternalHistory) {
        saveToHistory(internalEntities);
      }
      setInternalEntities((prev) => [...prev, ...duplicated]);
    }
    selectEntities(duplicated.map((e) => e.id));
    onPromptChange?.(`Duplicated ${duplicated.length} object(s)`);
  }, [
    getSelectedEntities,
    zoom,
    saveToHistory,
    selectEntities,
    onPromptChange,
    isControlled,
    onAddEntity,
    useExternalHistory,
    internalEntities,
  ]);

  const moveSelectedEntities = useCallback(
    (dx: number, dy: number) => {
      if (selectedIds.length === 0) return;

      if (isControlled && onMoveEntities) {
        // Controlled mode: gọi callback để move qua Commands
        onMoveEntities(selectedIds, dx, dy);
        return;
      }

      // Uncontrolled mode: internal state
      setInternalEntities((prev) =>
        prev.map((e) => {
          if (selectedIds.includes(e.id)) {
            const moved = moveEntity(e, dx, dy);
            onEntityUpdated?.(moved);
            return moved;
          }
          return e;
        }),
      );
    },
    [isControlled, onMoveEntities, selectedIds, onEntityUpdated],
  );

  // Save history when move ends (called from mouseUp)
  const saveHistoryBeforeMove = useCallback(() => {
    if (!isControlled && !useExternalHistory) {
      saveToHistory(internalEntities);
    }
  }, [isControlled, useExternalHistory, internalEntities, saveToHistory]);

  return {
    selectEntities,
    clearSelection,
    getSelectedEntities,
    addEntity,
    deleteSelectedEntities,
    copySelectedToClipboard,
    pasteFromClipboard,
    duplicateSelected,
    moveSelectedEntities,
    saveHistoryBeforeMove,
    clipboard,
    setClipboard,
  };
}
