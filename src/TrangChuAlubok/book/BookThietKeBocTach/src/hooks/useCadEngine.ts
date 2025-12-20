/**
 * useCadEngine - Hook to access and control the CAD engine
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi entity phải đi qua Commands → History
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEngineStore } from "../store/engineStore";
import { CadEngine } from "../core/engine/CadEngine";
import { IEntity } from "../core/entities/Entity.types";
import { ToolMode } from "../core/engine/EngineState";
import { IVec2 } from "../core/geometry/Vec2";
import { UpdateEntityPropertiesCommand } from "../core/commands/entity/EntityCommands";

// ==================== Types ====================

export interface UseCadEngineReturn {
  // Engine instance
  engine: CadEngine | null;
  isReady: boolean;

  // Tool controls
  activeTool: ToolMode;
  setTool: (tool: ToolMode) => void;

  // Selection
  selectedIds: string[];
  selectedEntities: IEntity[];
  select: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Entity operations
  addEntity: (entity: IEntity) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<IEntity>) => void;
  getEntity: (id: string) => IEntity | undefined;
  getAllEntities: () => IEntity[];

  // Document operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isModified: boolean;
  newDocument: () => void;

  // Command execution
  executeCommand: (command: string, args?: string[]) => void;
  cancelCommand: () => void;
  activeCommand: string | null;
  commandPrompt: string;

  // Viewport
  zoom: number;
  panOffset: IVec2;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: IVec2) => void;
  zoomFit: () => void;
  zoomToSelection: () => void;

  // Lifecycle
  destroyEngine: () => void;
}

// ==================== Hook Implementation ====================

export function useCadEngine(): UseCadEngineReturn {
  const initCalled = useRef(false);

  // Store selectors
  const engine = useEngineStore((state) => state.engine);
  const activeTool = useEngineStore((state) => state.activeTool);
  const selectedIds = useEngineStore((state) => state.selectedIds);
  const zoom = useEngineStore((state) => state.zoom);
  const panOffset = useEngineStore((state) => state.panOffset);
  const canUndo = useEngineStore((state) => state.canUndo);
  const canRedo = useEngineStore((state) => state.canRedo);
  const isModified = useEngineStore((state) => state.isModified);
  const activeCommand = useEngineStore((state) => state.activeCommand);
  const commandPrompt = useEngineStore((state) => state.commandPrompt);

  // Store actions
  const initEngine = useEngineStore((state) => state.initEngine);
  const _destroyEngine = useEngineStore((state) => state.destroyEngine);
  const setActiveTool = useEngineStore((state) => state.setActiveTool);
  const storeSelect = useEngineStore((state) => state.select);
  const storeClearSelection = useEngineStore((state) => state.clearSelection);
  const storeSelectAll = useEngineStore((state) => state.selectAll);
  const storeAddEntity = useEngineStore((state) => state.addEntity);
  const storeDeleteEntities = useEngineStore((state) => state.deleteEntities);
  // ĐIỀU KIỆN 1: Use executeCommandObject for updateEntity
  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject
  );
  const storeGetEntity = useEngineStore((state) => state.getEntity);
  const storeGetAllEntities = useEngineStore((state) => state.getAllEntities);
  const storeUndo = useEngineStore((state) => state.undo);
  const storeRedo = useEngineStore((state) => state.redo);
  const storeNewDocument = useEngineStore((state) => state.newDocument);
  const storeExecuteCommand = useEngineStore((state) => state.executeCommand);
  const storeCancelCommand = useEngineStore((state) => state.cancelCommand);
  const storeSetZoom = useEngineStore((state) => state.setZoom);
  const storeSetPanOffset = useEngineStore((state) => state.setPanOffset);
  const storeZoomFit = useEngineStore((state) => state.zoomFit);
  const storeZoomToSelection = useEngineStore((state) => state.zoomToSelection);

  // Initialize engine on mount
  useEffect(() => {
    if (!initCalled.current) {
      initCalled.current = true;
      initEngine();
    }

    return () => {
      // Don't destroy on unmount to allow component remounts
      // destroyEngine();
    };
  }, [initEngine]);

  // Computed selected entities
  const selectedEntities = selectedIds
    .map((id) => storeGetEntity(id))
    .filter((e): e is IEntity => e !== undefined);

  // Memoized callbacks
  const setTool = useCallback(
    (tool: ToolMode) => {
      setActiveTool(tool);
    },
    [setActiveTool]
  );

  const select = useCallback(
    (ids: string[]) => {
      storeSelect(ids);
    },
    [storeSelect]
  );

  const clearSelection = useCallback(() => {
    storeClearSelection();
  }, [storeClearSelection]);

  const selectAll = useCallback(() => {
    storeSelectAll();
  }, [storeSelectAll]);

  const addEntity = useCallback(
    (entity: IEntity) => {
      storeAddEntity(entity);
    },
    [storeAddEntity]
  );

  const removeEntity = useCallback(
    (id: string) => {
      storeDeleteEntities([id]);
    },
    [storeDeleteEntities]
  );

  // ĐIỀU KIỆN 1: updateEntity phải đi qua Commands → History
  const updateEntity = useCallback(
    (id: string, updates: Partial<IEntity>) => {
      // Use UpdateEntityPropertiesCommand instead of direct store update
      const command = new UpdateEntityPropertiesCommand(id, updates);
      executeCommandObject(command);
    },
    [executeCommandObject]
  );

  const getEntity = useCallback(
    (id: string) => {
      return storeGetEntity(id);
    },
    [storeGetEntity]
  );

  const getAllEntities = useCallback(() => {
    return storeGetAllEntities();
  }, [storeGetAllEntities]);

  const undo = useCallback(() => {
    storeUndo();
  }, [storeUndo]);

  const redo = useCallback(() => {
    storeRedo();
  }, [storeRedo]);

  const newDocument = useCallback(() => {
    storeNewDocument();
  }, [storeNewDocument]);

  const executeCommand = useCallback(
    (command: string, args?: string[]) => {
      storeExecuteCommand(command, args);
    },
    [storeExecuteCommand]
  );

  const cancelCommand = useCallback(() => {
    storeCancelCommand();
  }, [storeCancelCommand]);

  const setZoom = useCallback(
    (z: number) => {
      storeSetZoom(z);
    },
    [storeSetZoom]
  );

  const setPanOffset = useCallback(
    (offset: IVec2) => {
      storeSetPanOffset(offset);
    },
    [storeSetPanOffset]
  );

  const zoomFit = useCallback(() => {
    storeZoomFit();
  }, [storeZoomFit]);

  const zoomToSelection = useCallback(() => {
    storeZoomToSelection();
  }, [storeZoomToSelection]);

  return {
    engine,
    isReady: engine !== null,
    activeTool,
    setTool,
    selectedIds,
    selectedEntities,
    select,
    clearSelection,
    selectAll,
    addEntity,
    removeEntity,
    updateEntity,
    getEntity,
    getAllEntities,
    undo,
    redo,
    canUndo,
    canRedo,
    isModified,
    newDocument,
    executeCommand,
    cancelCommand,
    activeCommand,
    commandPrompt,
    zoom,
    panOffset,
    setZoom,
    setPanOffset,
    zoomFit,
    zoomToSelection,
    destroyEngine: _destroyEngine,
  };
}

export default useCadEngine;
