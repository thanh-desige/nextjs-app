/**
 * SCALETEXT Command - Scale text entities
 * Allows scaling text size by a factor
 */

import { Command } from "../Command";
import { CadDocument } from "../../document/CadDocument";
import { Point } from "../../entities/Point";

export interface ScaleTextCommandParams {
  entityIds: string[];
  scaleFactor: number;
}

export class ScaleTextCommand extends Command<ScaleTextCommandParams> {
  name = "SCALETEXT";

  constructor(params: ScaleTextCommandParams) {
    super(params);
  }

  execute(document: CadDocument): void {
    const { entityIds, scaleFactor } = this.params;

    entityIds.forEach((id) => {
      const entity = document.getEntity(id);
      if (entity && entity.type === "text") {
        const currentScale = (entity as any).textScale || 1;
        const newScale = currentScale * scaleFactor;

        document.updateEntity(id, {
          textScale: newScale,
        });
      }
    });
  }

  undo(document: CadDocument): void {
    const { entityIds, scaleFactor } = this.params;

    entityIds.forEach((id) => {
      const entity = document.getEntity(id);
      if (entity && entity.type === "text") {
        const currentScale = (entity as any).textScale || 1;
        const originalScale = currentScale / scaleFactor;

        document.updateEntity(id, {
          textScale: originalScale,
        });
      }
    });
  }

  validate(): boolean {
    return (
      this.params.entityIds.length > 0 &&
      this.params.scaleFactor > 0 &&
      this.params.scaleFactor !== 1
    );
  }
}
