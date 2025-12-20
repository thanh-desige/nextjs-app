/**
 * HistoryManager - Undo/Redo system for CAD operations
 * Implements Command Pattern for reversible operations
 */

import { CadEntity } from "../../ui/canvas/CadDrawingCanvas";

// ==================== Command Types ====================

export type CommandType =
  | "ADD_ENTITY"
  | "DELETE_ENTITY"
  | "UPDATE_ENTITY"
  | "MOVE_ENTITIES"
  | "COPY_ENTITIES"
  | "CHANGE_LAYER"
  | "CHANGE_PROPERTIES"
  | "GROUP"
  | "UNGROUP";

export interface HistoryCommand {
  id: string;
  type: CommandType;
  timestamp: number;
  description: string;
  // State needed to undo
  undoData: unknown;
  // State needed to redo
  redoData: unknown;
}

// ==================== Command Implementations ====================

export interface AddEntityCommand extends HistoryCommand {
  type: "ADD_ENTITY";
  undoData: { entityId: string };
  redoData: { entity: CadEntity };
}

export interface DeleteEntityCommand extends HistoryCommand {
  type: "DELETE_ENTITY";
  undoData: { entity: CadEntity };
  redoData: { entityId: string };
}

export interface UpdateEntityCommand extends HistoryCommand {
  type: "UPDATE_ENTITY";
  undoData: { entity: CadEntity };
  redoData: { entity: CadEntity };
}

export interface MoveEntitiesCommand extends HistoryCommand {
  type: "MOVE_ENTITIES";
  undoData: { entityIds: string[]; dx: number; dy: number };
  redoData: { entityIds: string[]; dx: number; dy: number };
}

export interface ChangeLayerCommand extends HistoryCommand {
  type: "CHANGE_LAYER";
  undoData: { entityId: string; oldLayerId: string };
  redoData: { entityId: string; newLayerId: string };
}

export interface ChangePropertiesCommand extends HistoryCommand {
  type: "CHANGE_PROPERTIES";
  undoData: { entityId: string; oldProps: Partial<CadEntity> };
  redoData: { entityId: string; newProps: Partial<CadEntity> };
}

// ==================== History Manager ====================

export interface HistoryManagerState {
  undoStack: HistoryCommand[];
  redoStack: HistoryCommand[];
  maxHistorySize: number;
}

export type HistoryEventType = "push" | "undo" | "redo" | "clear";
export type HistoryListener = (
  event: HistoryEventType,
  command?: HistoryCommand
) => void;

export class HistoryManager {
  private undoStack: HistoryCommand[] = [];
  private redoStack: HistoryCommand[] = [];
  private maxHistorySize: number;
  private listeners: HistoryListener[] = [];

  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  // ==================== Command Execution ====================

  pushCommand(command: HistoryCommand): void {
    // Clear redo stack when new command is pushed
    this.redoStack = [];

    // Add to undo stack
    this.undoStack.push(command);

    // Trim if exceeds max size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    this.notifyListeners("push", command);
  }

  // ==================== Undo/Redo ====================

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getUndoCommand(): HistoryCommand | undefined {
    const command = this.undoStack.pop();
    if (command) {
      this.redoStack.push(command);
      this.notifyListeners("undo", command);
    }
    return command;
  }

  getRedoCommand(): HistoryCommand | undefined {
    const command = this.redoStack.pop();
    if (command) {
      this.undoStack.push(command);
      this.notifyListeners("redo", command);
    }
    return command;
  }

  // ==================== Command Builders ====================

  static createAddEntityCommand(
    entity: CadEntity,
    description?: string
  ): AddEntityCommand {
    return {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "ADD_ENTITY",
      timestamp: Date.now(),
      description: description || `Add ${entity.type}`,
      undoData: { entityId: entity.id },
      redoData: { entity: { ...entity } },
    };
  }

  static createDeleteEntityCommand(
    entity: CadEntity,
    description?: string
  ): DeleteEntityCommand {
    return {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "DELETE_ENTITY",
      timestamp: Date.now(),
      description: description || `Delete ${entity.type}`,
      undoData: { entity: { ...entity } },
      redoData: { entityId: entity.id },
    };
  }

  static createUpdateEntityCommand(
    oldEntity: CadEntity,
    newEntity: CadEntity,
    description?: string
  ): UpdateEntityCommand {
    return {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "UPDATE_ENTITY",
      timestamp: Date.now(),
      description: description || `Update ${oldEntity.type}`,
      undoData: { entity: { ...oldEntity } },
      redoData: { entity: { ...newEntity } },
    };
  }

  static createMoveEntitiesCommand(
    entityIds: string[],
    dx: number,
    dy: number,
    description?: string
  ): MoveEntitiesCommand {
    return {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "MOVE_ENTITIES",
      timestamp: Date.now(),
      description: description || `Move ${entityIds.length} object(s)`,
      undoData: { entityIds, dx: -dx, dy: -dy }, // Reverse for undo
      redoData: { entityIds, dx, dy },
    };
  }

  static createChangeLayerCommand(
    entityId: string,
    oldLayerId: string,
    newLayerId: string,
    description?: string
  ): ChangeLayerCommand {
    return {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "CHANGE_LAYER",
      timestamp: Date.now(),
      description: description || `Change layer`,
      undoData: { entityId, oldLayerId },
      redoData: { entityId, newLayerId },
    };
  }

  static createChangePropertiesCommand(
    entityId: string,
    oldProps: Partial<CadEntity>,
    newProps: Partial<CadEntity>,
    description?: string
  ): ChangePropertiesCommand {
    return {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "CHANGE_PROPERTIES",
      timestamp: Date.now(),
      description: description || `Change properties`,
      undoData: { entityId, oldProps },
      redoData: { entityId, newProps },
    };
  }

  // ==================== History Info ====================

  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  getRedoStackSize(): number {
    return this.redoStack.length;
  }

  getUndoDescription(): string | null {
    const last = this.undoStack[this.undoStack.length - 1];
    return last ? last.description : null;
  }

  getRedoDescription(): string | null {
    const last = this.redoStack[this.redoStack.length - 1];
    return last ? last.description : null;
  }

  getHistory(): HistoryCommand[] {
    return [...this.undoStack];
  }

  // ==================== Clear ====================

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners("clear");
  }

  // ==================== Listeners ====================

  addListener(listener: HistoryListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(
    event: HistoryEventType,
    command?: HistoryCommand
  ): void {
    this.listeners.forEach((listener) => listener(event, command));
  }

  // ==================== Serialization ====================

  getState(): HistoryManagerState {
    return {
      undoStack: [...this.undoStack],
      redoStack: [...this.redoStack],
      maxHistorySize: this.maxHistorySize,
    };
  }

  loadState(state: HistoryManagerState): void {
    this.undoStack = [...state.undoStack];
    this.redoStack = [...state.redoStack];
    this.maxHistorySize = state.maxHistorySize;
  }
}

// ==================== React Hook ====================

import { useState, useCallback } from "react";

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
  historySize: number;
}

export interface UseHistoryReturn extends HistoryState {
  pushCommand: (command: HistoryCommand) => void;
  undo: () => HistoryCommand | undefined;
  redo: () => HistoryCommand | undefined;
  clear: () => void;
}

// Create a singleton manager instance
const historyManagerInstance = new HistoryManager(100);

export function useHistory(): UseHistoryReturn {
  const [historyState, setHistoryState] = useState<HistoryState>({
    canUndo: false,
    canRedo: false,
    undoDescription: null,
    redoDescription: null,
    historySize: 0,
  });

  const updateState = useCallback(() => {
    setHistoryState({
      canUndo: historyManagerInstance.canUndo(),
      canRedo: historyManagerInstance.canRedo(),
      undoDescription: historyManagerInstance.getUndoDescription(),
      redoDescription: historyManagerInstance.getRedoDescription(),
      historySize: historyManagerInstance.getUndoStackSize(),
    });
  }, []);

  const pushCommand = useCallback(
    (command: HistoryCommand) => {
      historyManagerInstance.pushCommand(command);
      updateState();
    },
    [updateState]
  );

  const undo = useCallback(() => {
    const command = historyManagerInstance.getUndoCommand();
    updateState();
    return command;
  }, [updateState]);

  const redo = useCallback(() => {
    const command = historyManagerInstance.getRedoCommand();
    updateState();
    return command;
  }, [updateState]);

  const clear = useCallback(() => {
    historyManagerInstance.clear();
    updateState();
  }, [updateState]);

  return {
    ...historyState,
    pushCommand,
    undo,
    redo,
    clear,
  };
}

export default HistoryManager;
