/**
 * Command Manager - Quản lý thực thi và undo/redo commands
 */

import {
  ICommand,
  CommandResult,
  CommandContext,
  HistoryEntry,
  CommandRegistryEntry,
  CommandCategory,
} from "./Command.types";
import { CadEngine } from "../engine/CadEngine";
import { EngineEventType } from "../engine/EngineEvents";

export class CommandManager {
  private engine: CadEngine;

  // Command registry
  private registry: Map<string, CommandRegistryEntry> = new Map();

  // Undo/Redo stacks
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  // Configuration
  private maxHistorySize: number = 100;

  // Active command (for interactive commands)
  private activeCommand: ICommand | null = null;

  constructor(engine: CadEngine) {
    this.engine = engine;
  }

  // ==================== Command Registration ====================

  /**
   * Đăng ký command
   */
  register(entry: CommandRegistryEntry): void {
    this.registry.set(entry.name.toLowerCase(), entry);
  }

  /**
   * Đăng ký nhiều commands
   */
  registerAll(entries: CommandRegistryEntry[]): void {
    for (const entry of entries) {
      this.register(entry);
    }
  }

  /**
   * Lấy command từ registry
   */
  getRegistryEntry(name: string): CommandRegistryEntry | undefined {
    return this.registry.get(name.toLowerCase());
  }

  /**
   * Lấy tất cả commands theo category
   */
  getCommandsByCategory(category: CommandCategory): CommandRegistryEntry[] {
    return Array.from(this.registry.values()).filter(
      (entry) => entry.category === category
    );
  }

  /**
   * Tạo instance của command từ registry
   */
  createCommand(name: string): ICommand | null {
    const entry = this.getRegistryEntry(name);
    if (!entry) return null;
    return new entry.command();
  }

  // ==================== Command Execution ====================

  /**
   * Thực thi command
   */
  execute(command: ICommand, context: CommandContext): CommandResult {
    try {
      const result = command.execute(context);

      if (result.success && command.canUndo) {
        // Add to undo stack
        this.undoStack.push({
          command,
          context: { ...context, points: [...context.points] },
          timestamp: Date.now(),
        });

        // Clear redo stack
        this.redoStack = [];

        // Limit history size
        while (this.undoStack.length > this.maxHistorySize) {
          this.undoStack.shift();
        }
      }

      // Emit event
      this.engine["emit"](EngineEventType.COMMAND_EXECUTE, {
        commandName: command.name,
        data: result.data,
      });

      return result;
    } catch (error) {
      console.error(`Error executing command ${command.name}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Thực thi command theo tên
   */
  executeByName(
    name: string,
    context?: Partial<CommandContext>
  ): CommandResult {
    const command = this.createCommand(name);
    if (!command) {
      return {
        success: false,
        message: `Command not found: ${name}`,
      };
    }

    const fullContext: CommandContext = {
      engine: this.engine,
      points: context?.points ?? [],
      options: context?.options ?? {},
      style: context?.style ?? this.engine.getCurrentStyle(),
      layerId: context?.layerId ?? this.engine.getActiveLayerId(),
    };

    return this.execute(command, fullContext);
  }

  // ==================== Undo/Redo ====================

  /**
   * Kiểm tra có thể undo không
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Kiểm tra có thể redo không
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Undo command cuối cùng
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    const entry = this.undoStack.pop()!;

    try {
      entry.command.undo(entry.context);
      this.redoStack.push(entry);

      this.engine["emit"](EngineEventType.COMMAND_UNDO, {
        commandName: entry.command.name,
      });

      return true;
    } catch (error) {
      console.error(`Error undoing command ${entry.command.name}:`, error);
      return false;
    }
  }

  /**
   * Redo command
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    const entry = this.redoStack.pop()!;

    try {
      const result = entry.command.redo
        ? entry.command.redo(entry.context)
        : entry.command.execute(entry.context);

      if (result.success) {
        this.undoStack.push(entry);
      }

      this.engine["emit"](EngineEventType.COMMAND_REDO, {
        commandName: entry.command.name,
      });

      return result.success;
    } catch (error) {
      console.error(`Error redoing command ${entry.command.name}:`, error);
      return false;
    }
  }

  /**
   * Xóa history
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Lấy undo history
   */
  getUndoHistory(): string[] {
    return this.undoStack.map((e) => e.command.name);
  }

  /**
   * Lấy redo history
   */
  getRedoHistory(): string[] {
    return this.redoStack.map((e) => e.command.name);
  }

  // ==================== Active Command ====================

  /**
   * Set active command (for interactive drawing)
   */
  setActiveCommand(command: ICommand | null): void {
    this.activeCommand = command;
  }

  /**
   * Get active command
   */
  getActiveCommand(): ICommand | null {
    return this.activeCommand;
  }

  // ==================== Configuration ====================

  /**
   * Set max history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    while (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }
}

// ==================== Singleton ====================

let commandManagerInstance: CommandManager | null = null;

export function getCommandManager(engine: CadEngine): CommandManager {
  if (!commandManagerInstance) {
    commandManagerInstance = new CommandManager(engine);
  }
  return commandManagerInstance;
}

export function createCommandManager(engine: CadEngine): CommandManager {
  return new CommandManager(engine);
}
