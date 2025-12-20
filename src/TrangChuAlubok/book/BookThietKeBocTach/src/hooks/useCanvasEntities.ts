/**
 * useCanvasEntities Hook
 *
 * ĐIỀU KIỆN 1: UI → CadEngine → Document → History
 * Hook này kết nối CadDrawingCanvas với CadDocument thông qua Commands
 *
 * Tất cả thay đổi canvas entities PHẢI đi qua hook này
 * KHÔNG được gọi setEntities trực tiếp trong component
 */

import { useCallback, useMemo } from "react";
import { useEngineStore } from "../store/engineStore";
import { CanvasEntity, CanvasPoint } from "../core/document/CadDocument";
import {
  AddCanvasEntityCommand,
  DeleteCanvasEntitiesCommand,
  MoveCanvasEntitiesCommand,
  UpdateCanvasEntityCommand,
  BatchAddCanvasEntitiesCommand,
  SelectCanvasEntitiesCommand,
  ClearCanvasSelectionCommand,
  CopyCanvasEntitiesCommand,
} from "../core/commands/canvas/CanvasEntityCommands";

export interface UseCanvasEntitiesReturn {
  // Data (read from document)
  entities: CanvasEntity[];
  selectedIds: string[];
  selectedEntities: CanvasEntity[];

  // CRUD operations (via Commands)
  addEntity: (
    entity: Omit<CanvasEntity, "id"> | CanvasEntity
  ) => CanvasEntity | null;
  addEntities: (
    entities: (Omit<CanvasEntity, "id"> | CanvasEntity)[]
  ) => CanvasEntity[];
  deleteEntities: (ids: string | string[]) => boolean;
  updateEntity: (id: string, updates: Partial<CanvasEntity>) => boolean;
  moveEntities: (ids: string | string[], dx: number, dy: number) => boolean;
  copyEntities: (
    ids: string[],
    offset?: { dx: number; dy: number }
  ) => CanvasEntity[];

  // Selection (via Commands)
  selectEntities: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;

  // Helpers
  getEntity: (id: string) => CanvasEntity | undefined;
  getEntitiesInBounds: (
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ) => CanvasEntity[];

  // Undo/Redo (from document history)
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useCanvasEntities(): UseCanvasEntitiesReturn {
  // Get store actions
  const executeCommandObject = useEngineStore((s) => s.executeCommandObject);
  const getDocument = useEngineStore((s) => s.getDocument);
  const storeUndo = useEngineStore((s) => s.undo);
  const storeRedo = useEngineStore((s) => s.redo);
  const canUndo = useEngineStore((s) => s.canUndo);
  const canRedo = useEngineStore((s) => s.canRedo);
  // documentVersion triggers re-render when document data changes
  const documentVersion = useEngineStore((s) => s.documentVersion);

  // ==================== Data (Read from Document) ====================
  // Use documentVersion as dependency to trigger re-render when data changes
  // Note: getDocument() is called inside useMemo to always get fresh data

  const entities = useMemo(() => {
    const doc = getDocument();
    return doc?.getAllCanvasEntities() ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentVersion, getDocument]);

  const selectedIds = useMemo(() => {
    const doc = getDocument();
    return doc?.getCanvasSelectedIds() ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentVersion, getDocument]);

  const selectedEntities = useMemo(() => {
    const doc = getDocument();
    return doc?.getSelectedCanvasEntities() ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentVersion, getDocument]);

  // ==================== CRUD Operations (Via Commands) ====================

  const addEntity = useCallback(
    (entity: Omit<CanvasEntity, "id"> | CanvasEntity): CanvasEntity | null => {
      const command = new AddCanvasEntityCommand(entity);
      const result = executeCommandObject(command);

      if (result?.success && result.data) {
        return (result.data as { entity: CanvasEntity }).entity;
      }
      return null;
    },
    [executeCommandObject]
  );

  const addEntities = useCallback(
    (entities: (Omit<CanvasEntity, "id"> | CanvasEntity)[]): CanvasEntity[] => {
      const command = new BatchAddCanvasEntitiesCommand(entities);
      const result = executeCommandObject(command);

      if (result?.success && result.data) {
        return (result.data as { entities: CanvasEntity[] }).entities;
      }
      return [];
    },
    [executeCommandObject]
  );

  const deleteEntities = useCallback(
    (ids: string | string[]): boolean => {
      const command = new DeleteCanvasEntitiesCommand(ids);
      const result = executeCommandObject(command);
      return result?.success ?? false;
    },
    [executeCommandObject]
  );

  const updateEntity = useCallback(
    (id: string, updates: Partial<CanvasEntity>): boolean => {
      const command = new UpdateCanvasEntityCommand(id, updates);
      const result = executeCommandObject(command);
      return result?.success ?? false;
    },
    [executeCommandObject]
  );

  const moveEntities = useCallback(
    (ids: string | string[], dx: number, dy: number): boolean => {
      const command = new MoveCanvasEntitiesCommand(ids, dx, dy);
      const result = executeCommandObject(command);
      return result?.success ?? false;
    },
    [executeCommandObject]
  );

  const copyEntities = useCallback(
    (ids: string[], offset = { dx: 20, dy: 20 }): CanvasEntity[] => {
      const command = new CopyCanvasEntitiesCommand(ids, offset);
      const result = executeCommandObject(command);

      if (result?.success && result.data) {
        return (result.data as { copiedEntities: CanvasEntity[] })
          .copiedEntities;
      }
      return [];
    },
    [executeCommandObject]
  );

  // ==================== Selection (Via Commands) ====================

  const selectEntities = useCallback(
    (ids: string[], additive = false): void => {
      const command = new SelectCanvasEntitiesCommand(ids, additive);
      executeCommandObject(command);
    },
    [executeCommandObject]
  );

  const clearSelection = useCallback((): void => {
    const command = new ClearCanvasSelectionCommand();
    executeCommandObject(command);
  }, [executeCommandObject]);

  // ==================== Helpers ====================

  const getEntity = useCallback(
    (id: string): CanvasEntity | undefined => {
      const doc = getDocument();
      return doc?.getCanvasEntity(id);
    },
    [getDocument]
  );

  const getEntitiesInBounds = useCallback(
    (
      minX: number,
      minY: number,
      maxX: number,
      maxY: number
    ): CanvasEntity[] => {
      const doc = getDocument();
      const allEntities = doc?.getAllCanvasEntities() ?? [];

      return allEntities.filter((entity) => {
        // Check if any point of the entity is within bounds
        return entity.points.some(
          (p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
        );
      });
    },
    [getDocument]
  );

  // ==================== Undo/Redo ====================

  const undo = useCallback(() => {
    storeUndo();
  }, [storeUndo]);

  const redo = useCallback(() => {
    storeRedo();
  }, [storeRedo]);

  return {
    // Data
    entities,
    selectedIds,
    selectedEntities,

    // CRUD
    addEntity,
    addEntities,
    deleteEntities,
    updateEntity,
    moveEntities,
    copyEntities,

    // Selection
    selectEntities,
    clearSelection,

    // Helpers
    getEntity,
    getEntitiesInBounds,

    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

export default useCanvasEntities;

// Re-export types
export type { CanvasEntity, CanvasPoint };
