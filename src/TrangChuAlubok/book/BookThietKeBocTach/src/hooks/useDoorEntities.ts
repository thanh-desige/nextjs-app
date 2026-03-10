/**
 * useDoorEntities - Hook quản lý cửa trên canvas
 *
 * ⚠️ COMPLIANCE: G1, R7 — Mọi thay đổi PHẢI đi qua Command + History
 * - KHÔNG gọi store.addDoor/removeDoor/updateDoor trực tiếp
 * - PHẢI execute commands qua executeCommandObject()
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: UI components
 * - KHÔNG được import từ: door-engines, analysis, systems
 */

import { useCallback } from "react";
import { useDoorStore } from "../store/doorStore";
import { useEngineStore } from "../store/engineStore";
import { DoorFactory } from "../domain/door/DoorFactory";
import {
  AddDoorCommand,
  RemoveDoorCommand,
  RemoveDoorsCommand,
  MoveDoorCommand,
  ResizeDoorCommand,
  UpdateDoorCommand,
  DoorCreateParams,
} from "../core/commands/door/DoorCommands";
import type {
  DoorEntity,
  DoorVariant,
  DoorPoint,
} from "../core/entities/DoorEntity";

// Use DoorPoint from DoorEntity
type Point = DoorPoint;

/**
 * Hook quản lý cửa trên canvas
 *
 * ⚠️ COMPLIANCE: G1, R7 — Mọi thay đổi PHẢI đi qua Command + History
 */
export function useDoorEntities() {
  // Read-only state từ store
  const {
    doors,
    selectedDoorIds,
    hoveredDoorId,
    selectDoor,
    deselectDoor,
    selectAllDoors,
    clearSelection,
    setHoveredDoor,
    getDoor,
    getSelectedDoors,
    getAllDoors,
  } = useDoorStore();

  // Execute command object để đi qua History (R7)
  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject
  );

  /**
   * Tạo cửa mới từ input - COMPLIANT với R7
   * Sử dụng AddDoorCommand thay vì gọi store trực tiếp
   */
  const createDoor = useCallback(
    (
      variant: DoorVariant,
      systemId: string,
      position: Point,
      width?: number,
      height?: number
    ): DoorEntity | null => {
      const defaults = DoorFactory.getDefaultSize(variant);

      const params: DoorCreateParams = {
        variant,
        systemId,
        position,
        width: width || defaults.width,
        height: height || defaults.height,
      };

      // R7: Execute command qua History
      const command = new AddDoorCommand(params);
      executeCommandObject(command);

      // Return the created door
      return command.getCreatedDoor();
    },
    [executeCommandObject]
  );

  /**
   * Clone cửa đang chọn - COMPLIANT với R7
   * Mỗi clone là một AddDoorCommand riêng
   */
  const cloneSelectedDoors = useCallback(
    (offset: Point = { x: 50, y: 50 }): DoorEntity[] => {
      const selected = getSelectedDoors();
      const cloned: DoorEntity[] = [];

      for (const door of selected) {
        const params: DoorCreateParams = {
          variant: door.doorInfo.variant,
          systemId: door.doorInfo.systemId,
          position: {
            x: door.position.x + offset.x,
            y: door.position.y + offset.y,
          },
          width: door.doorInfo.width,
          height: door.doorInfo.height,
          displayName: `${door.doorInfo.displayName} (copy)`,
          options: door.doorInfo.options,
        };

        // R7: Execute command qua History
        const command = new AddDoorCommand(params);
        executeCommandObject(command);

        const createdDoor = command.getCreatedDoor();
        if (createdDoor) {
          cloned.push(createdDoor);
        }
      }

      // Chọn các cửa vừa clone
      clearSelection();
      for (const door of cloned) {
        selectDoor(door.id, true);
      }

      return cloned;
    },
    [getSelectedDoors, executeCommandObject, clearSelection, selectDoor]
  );

  /**
   * Xóa cửa đang chọn - COMPLIANT với R7
   * Sử dụng RemoveDoorsCommand cho batch delete
   */
  const deleteSelectedDoors = useCallback(() => {
    const selected = getSelectedDoors();
    if (selected.length === 0) return;

    const doorIds = selected.map((door) => door.id);

    // R7: Execute command qua History
    const command = new RemoveDoorsCommand(doorIds);
    executeCommandObject(command);
  }, [getSelectedDoors, executeCommandObject]);

  /**
   * Di chuyển cửa đang chọn - COMPLIANT với R7
   * Mỗi door được di chuyển bằng MoveDoorCommand
   */
  const moveSelectedDoors = useCallback(
    (deltaX: number, deltaY: number) => {
      const selected = getSelectedDoors();
      for (const door of selected) {
        const newPosition = {
          x: door.position.x + deltaX,
          y: door.position.y + deltaY,
        };

        // R7: Execute command qua History
        const command = new MoveDoorCommand(door.id, newPosition);
        executeCommandObject(command);
      }
    },
    [getSelectedDoors, executeCommandObject]
  );

  /**
   * Thay đổi kích thước cửa - COMPLIANT với R7
   * Sử dụng ResizeDoorCommand
   */
  const resizeDoor = useCallback(
    (doorId: string, width: number, height: number) => {
      // R7: Execute command qua History
      const command = new ResizeDoorCommand(doorId, width, height);
      executeCommandObject(command);
    },
    [executeCommandObject]
  );

  /**
   * Thay đổi hệ cửa - COMPLIANT với R7
   * Sử dụng UpdateDoorCommand
   */
  const changeDoorSystem = useCallback(
    (doorId: string, systemId: string) => {
      const door = getDoor(doorId);
      if (!door) return;

      // R7: Execute command qua History
      const command = new UpdateDoorCommand(doorId, {
        doorInfo: {
          ...door.doorInfo,
          systemId,
        },
      });
      executeCommandObject(command);
    },
    [getDoor, executeCommandObject]
  );

  /**
   * Danh sách cửa dạng array
   */
  const doorList = getAllDoors();

  /**
   * Danh sách cửa đang chọn
   */
  const selectedDoors = getSelectedDoors();

  /**
   * Số lượng cửa
   */
  const doorCount = doors.size;

  /**
   * Có cửa đang chọn không
   */
  const hasSelection = selectedDoorIds.size > 0;

  /**
   * Xóa một cửa theo ID - COMPLIANT với R7
   * Sử dụng RemoveDoorCommand
   */
  const removeDoor = useCallback(
    (doorId: string) => {
      const command = new RemoveDoorCommand(doorId);
      executeCommandObject(command);
    },
    [executeCommandObject]
  );

  return {
    // State (read-only)
    doors: doorList,
    selectedDoors,
    selectedDoorIds,
    hoveredDoorId,
    doorCount,
    hasSelection,

    // CRUD - All compliant with R7 (via Commands)
    createDoor,
    removeDoor,
    cloneSelectedDoors,
    deleteSelectedDoors,

    // Selection (UI-only state, không cần Command)
    selectDoor,
    deselectDoor,
    selectAllDoors,
    clearSelection,

    // Hover (UI-only state)
    setHoveredDoor,

    // Transform - All compliant with R7 (via Commands)
    moveSelectedDoors,
    resizeDoor,
    changeDoorSystem,

    // Getters (read-only)
    getDoor,
  };
}
