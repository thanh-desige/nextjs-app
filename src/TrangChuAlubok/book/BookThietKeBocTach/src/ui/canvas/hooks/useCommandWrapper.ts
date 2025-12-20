/**
 * useCommandWrapper - Wrapper để kết nối CadDrawingCanvas với Commands
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 * ĐIỀU KIỆN 2: Validate qua PropertySchema trước khi apply
 *
 * Mục đích: Thay thế các addEntity() trực tiếp bằng Commands
 */

import { useCallback } from "react";
import { useEngineStore } from "../../../store/engineStore";
import { useDrawingCommands } from "../../../hooks/useDrawingCommands";
import { propertySchema } from "../../../core/properties/PropertySchema";
import {
  AddCanvasEntityCommand,
  UpdateCanvasEntityCommand,
  DeleteCanvasEntitiesCommand,
  BatchAddCanvasEntitiesCommand,
} from "../../../core/commands/canvas/CanvasEntityCommands";
import type { CadEntity } from "../utils/entityUtils";

export const useCommandWrapper = () => {
  const { engine } = useEngineStore();
  const drawingCommands = useDrawingCommands();

  /**
   * Thêm entity qua Command (thay thế addEntity trực tiếp)
   * ĐIỀU KIỆN 1: Đi qua Command → Engine
   * ĐIỀU KIỆN 2: Command sẽ validate qua PropertySchema
   */
  const addEntityViaCommand = useCallback(
    (entity: CadEntity) => {
      if (!engine) {
        console.warn("Engine not initialized");
        return false;
      }

      try {
        // Tạo command để add entity
        const command = new AddCanvasEntityCommand(entity);

        // Execute qua engine (sẽ tự động validate PropertySchema)
        const success = engine.executeCommand(command);

        if (!success) {
          console.error("Failed to add entity via command");
        }

        return success;
      } catch (error) {
        console.error("Error adding entity:", error);
        return false;
      }
    },
    [engine]
  );

  /**
   * Update entity qua Command
   * ĐIỀU KIỆN 1 & 2: Tương tự
   */
  const updateEntityViaCommand = useCallback(
    (entityId: string, updates: Partial<CadEntity>) => {
      if (!engine) {
        console.warn("Engine not initialized");
        return false;
      }

      try {
        const command = new UpdateCanvasEntityCommand(entityId, updates);
        return engine.executeCommand(command);
      } catch (error) {
        console.error("Error updating entity:", error);
        return false;
      }
    },
    [engine]
  );

  /**
   * Delete entity qua Command
   */
  const deleteEntityViaCommand = useCallback(
    (entityId: string) => {
      if (!engine) {
        console.warn("Engine not initialized");
        return false;
      }

      try {
        const command = new DeleteCanvasEntitiesCommand(entityId);
        return engine.executeCommand(command);
      } catch (error) {
        console.error("Error deleting entity:", error);
        return false;
      }
    },
    [engine]
  );

  /**
   * Batch add entities qua Command
   */
  const batchAddEntitiesViaCommand = useCallback(
    (entities: CadEntity[]) => {
      if (!engine) {
        console.warn("Engine not initialized");
        return false;
      }

      try {
        const command = new BatchAddCanvasEntitiesCommand(entities);
        return engine.executeCommand(command);
      } catch (error) {
        console.error("Error batch adding entities:", error);
        return false;
      }
    },
    [engine]
  );

  /**
   * Helper: Validate property trước khi update
   * ĐIỀU KIỆN 2: PropertySchema validation
   */
  const validateProperty = useCallback(
    (entityType: string, propertyKey: string, value: any): boolean => {
      try {
        // Map canvas type sang EntityType cho PropertySchema
        const typeMap: Record<string, string> = {
          line: "LINE",
          polyline: "POLYLINE",
          rect: "RECTANGLE",
          circle: "CIRCLE",
          arc: "ARC",
          ellipse: "ELLIPSE",
          text: "TEXT",
        };

        const mappedType =
          typeMap[entityType.toLowerCase()] || entityType.toUpperCase();

        // Validate qua PropertySchema
        const result = propertySchema.validateProperty(
          mappedType as any,
          propertyKey,
          value
        );

        return result.valid;
      } catch (error) {
        console.warn("Property validation error:", error);
        return true; // Allow if validation fails (backward compatibility)
      }
    },
    []
  );

  return {
    // Command wrappers (thay thế direct operations)
    addEntityViaCommand,
    updateEntityViaCommand,
    deleteEntityViaCommand,
    batchAddEntitiesViaCommand,

    // Validation helper
    validateProperty,

    // Original drawing commands (đã tuân thủ)
    ...drawingCommands,
  };
};
