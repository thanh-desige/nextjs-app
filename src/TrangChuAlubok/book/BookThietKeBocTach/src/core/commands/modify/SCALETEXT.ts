/**
 * SCALETEXT Command - Scale text entities
 * Allows scaling text size by a factor
 *
 * TODO: Implement when text entity scaling is needed
 * Currently a placeholder to avoid breaking the build
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";

export interface ScaleTextCommandParams {
  entityIds: string[];
  scaleFactor: number;
}

export class ScaleTextCommand implements ICommand {
  readonly name = "SCALETEXT";
  readonly canUndo = true;

  private params: ScaleTextCommandParams;

  constructor(params: ScaleTextCommandParams) {
    this.params = params;
  }

  execute(_context: CommandContext): CommandResult {
    // TODO: Implement text scaling when updateEntity is available on CadEngine
    console.warn("SCALETEXT command not implemented yet");
    return {
      success: false,
      message: "SCALETEXT command not yet implemented",
    };
  }

  undo(_context: CommandContext): void {
    // TODO: Implement undo when execute is implemented
  }

  validate(): boolean {
    return (
      this.params.entityIds.length > 0 &&
      this.params.scaleFactor > 0 &&
      this.params.scaleFactor !== 1
    );
  }
}
