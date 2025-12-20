/**
 * History - Quản lý lịch sử Undo/Redo cho Document
 */

import {
  ICommand,
  CommandResult,
  CommandContext,
} from "../commands/Command.types";

// ==================== History Entry ====================

export interface HistoryEntry {
  id: string;
  command: ICommand;
  context: CommandContext;
  result: CommandResult;
  timestamp: number;
  /** Mô tả cho hiển thị */
  description: string;
}

// ==================== History Events ====================

export type HistoryEventType = "push" | "undo" | "redo" | "clear";

export interface HistoryEvent {
  type: HistoryEventType;
  entry?: HistoryEntry;
  undoCount: number;
  redoCount: number;
}

export type HistoryListener = (event: HistoryEvent) => void;

// ==================== History Manager ====================

export class History {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxSize: number;
  private listeners: Set<HistoryListener> = new Set();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  // ==================== Stack Operations ====================

  /**
   * Thêm command vào history
   */
  push(
    command: ICommand,
    context: CommandContext,
    result: CommandResult
  ): void {
    if (!command.canUndo) return;

    const entry: HistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      command,
      context,
      result,
      timestamp: Date.now(),
      description: command.description ?? command.name,
    };

    this.undoStack.push(entry);

    // Clear redo stack khi có action mới
    this.redoStack = [];

    // Giới hạn kích thước
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }

    this.emit({ type: "push", entry });
  }

  /**
   * Undo command gần nhất
   */
  undo(): boolean {
    const entry = this.undoStack.pop();
    if (!entry) return false;

    // Thực hiện undo
    entry.command.undo(entry.context);

    // Chuyển sang redo stack
    this.redoStack.push(entry);

    this.emit({ type: "undo", entry });
    return true;
  }

  /**
   * Redo command gần nhất
   */
  redo(): boolean {
    const entry = this.redoStack.pop();
    if (!entry) return false;

    // Thực hiện redo
    if (entry.command.redo) {
      entry.command.redo(entry.context);
    } else {
      entry.command.execute(entry.context);
    }

    // Chuyển lại undo stack
    this.undoStack.push(entry);

    this.emit({ type: "redo", entry });
    return true;
  }

  /**
   * Clear tất cả history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.emit({ type: "clear" });
  }

  // ==================== State Queries ====================

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getUndoCount(): number {
    return this.undoStack.length;
  }

  getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * Lấy mô tả của action có thể undo
   */
  getUndoDescription(): string | null {
    const entry = this.undoStack[this.undoStack.length - 1];
    return entry ? entry.description : null;
  }

  /**
   * Lấy mô tả của action có thể redo
   */
  getRedoDescription(): string | null {
    const entry = this.redoStack[this.redoStack.length - 1];
    return entry ? entry.description : null;
  }

  /**
   * Lấy danh sách undo entries (gần nhất trước)
   */
  getUndoHistory(limit: number = 10): HistoryEntry[] {
    return this.undoStack.slice(-limit).reverse();
  }

  /**
   * Lấy danh sách redo entries (gần nhất trước)
   */
  getRedoHistory(limit: number = 10): HistoryEntry[] {
    return this.redoStack.slice(-limit).reverse();
  }

  // ==================== Event System ====================

  subscribe(listener: HistoryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: Omit<HistoryEvent, "undoCount" | "redoCount">): void {
    const fullEvent: HistoryEvent = {
      ...event,
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
    };

    for (const listener of this.listeners) {
      listener(fullEvent);
    }
  }

  // ==================== Advanced Operations ====================

  /**
   * Undo nhiều bước
   */
  undoMultiple(count: number): number {
    let undone = 0;
    for (let i = 0; i < count && this.canUndo(); i++) {
      if (this.undo()) undone++;
    }
    return undone;
  }

  /**
   * Redo nhiều bước
   */
  redoMultiple(count: number): number {
    let redone = 0;
    for (let i = 0; i < count && this.canRedo(); i++) {
      if (this.redo()) redone++;
    }
    return redone;
  }

  /**
   * Undo đến một entry cụ thể
   */
  undoTo(entryId: string): boolean {
    const index = this.undoStack.findIndex((e) => e.id === entryId);
    if (index === -1) return false;

    const count = this.undoStack.length - index - 1;
    this.undoMultiple(count);
    return true;
  }

  // ==================== Serialization ====================

  getState(): {
    undoCount: number;
    redoCount: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }
}

export default History;
