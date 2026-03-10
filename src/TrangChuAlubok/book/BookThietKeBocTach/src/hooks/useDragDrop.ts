/**
 * useDragDrop - Hook xử lý kéo thả cửa từ sidebar vào canvas
 *
 * ⚠️ COMPLIANCE: G1, R7 — Mọi thay đổi PHẢI đi qua Command + History
 * - handleDrop PHẢI execute AddDoorCommand, KHÔNG gọi store trực tiếp
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: SidebarLeft, CadDrawingCanvas
 * - KHÔNG được import từ: door-engines, analysis, systems
 */

import { useCallback, useRef, useState } from "react";
import { useDoorStore } from "../store/doorStore";
import { useEngineStore } from "../store/engineStore";
import {
  AddDoorCommand,
  DoorCreateParams,
} from "../core/commands/door/DoorCommands";
import type { DoorVariant, DoorPoint } from "../core/entities/DoorEntity";

// Use DoorPoint from DoorEntity
type Point = DoorPoint;

/**
 * Thông tin item đang được kéo
 */
export interface DragItem {
  /** Loại cửa */
  variant: DoorVariant;

  /** ID hệ cửa */
  systemId: string;

  /** Tên hiển thị */
  displayName: string;

  /** Kích thước mặc định */
  defaultSize: { width: number; height: number };
}

/**
 * Hook xử lý drag từ sidebar
 */
export function useDragFromSidebar() {
  const { startDragging, endDragging, draggingDoor } = useDoorStore();
  const dragItemRef = useRef<DragItem | null>(null);

  /**
   * Bắt đầu kéo
   */
  const handleDragStart = useCallback(
    (item: DragItem, event: React.DragEvent) => {
      dragItemRef.current = item;
      startDragging(item.variant, item.systemId);

      // Set drag image (có thể customize)
      const dragImage = document.createElement("div");
      dragImage.className = "door-drag-preview";
      dragImage.textContent = item.displayName;
      dragImage.style.cssText = `
        position: absolute;
        top: -1000px;
        padding: 8px 16px;
        background: rgba(155, 89, 182, 0.9);
        color: white;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
      `;
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);

      // Set data transfer
      event.dataTransfer.setData("application/door-item", JSON.stringify(item));
      event.dataTransfer.effectAllowed = "copy";
    },
    [startDragging]
  );

  /**
   * Kết thúc kéo (từ sidebar)
   */
  const handleDragEnd = useCallback(() => {
    dragItemRef.current = null;
    endDragging();
  }, [endDragging]);

  return {
    isDragging: draggingDoor !== null,
    handleDragStart,
    handleDragEnd,
  };
}

/**
 * Hook xử lý drop vào canvas
 *
 * ⚠️ COMPLIANCE: G1, R7 — handleDrop PHẢI execute AddDoorCommand
 */
export function useDropOnCanvas(
  canvasRef: React.RefObject<HTMLElement>,
  getCanvasPosition: (clientX: number, clientY: number) => Point
) {
  const { draggingDoor, endDragging, updateDragPosition } = useDoorStore();
  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject
  );
  const [isOver, setIsOver] = useState(false);

  /**
   * Xử lý drag over canvas
   */
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";

      // Cập nhật vị trí preview
      const position = getCanvasPosition(event.clientX, event.clientY);
      updateDragPosition(position);
    },
    [getCanvasPosition, updateDragPosition]
  );

  /**
   * Xử lý drag enter
   */
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsOver(true);
  }, []);

  /**
   * Xử lý drag leave
   */
  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      // Chỉ leave khi thực sự ra khỏi canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const { clientX, clientY } = event;
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          setIsOver(false);
        }
      }
    },
    [canvasRef]
  );

  /**
   * Xử lý drop - COMPLIANT với R7
   * Sử dụng AddDoorCommand thay vì gọi store trực tiếp
   */
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsOver(false);

      // Lấy data từ drag
      const data = event.dataTransfer.getData("application/door-item");
      if (!data) {
        endDragging();
        return;
      }

      try {
        const item: DragItem = JSON.parse(data);
        const position = getCanvasPosition(event.clientX, event.clientY);

        // R7: Execute AddDoorCommand qua History
        const params: DoorCreateParams = {
          variant: item.variant,
          systemId: item.systemId,
          position,
          width: item.defaultSize.width,
          height: item.defaultSize.height,
          displayName: item.displayName,
        };

        const command = new AddDoorCommand(params);
        executeCommandObject(command);
      } catch (error) {
        console.error("[useDragDrop] Failed to create door:", error);
      }

      endDragging();
    },
    [getCanvasPosition, executeCommandObject, endDragging]
  );

  return {
    isOver,
    previewPosition: draggingDoor?.previewPosition,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}

/**
 * Hook tổng hợp cho drag & drop
 */
export function useDragDrop(
  canvasRef: React.RefObject<HTMLElement>,
  getCanvasPosition: (clientX: number, clientY: number) => Point
) {
  const sidebar = useDragFromSidebar();
  const canvas = useDropOnCanvas(canvasRef, getCanvasPosition);

  return {
    // Sidebar
    handleDragStart: sidebar.handleDragStart,
    handleDragEnd: sidebar.handleDragEnd,
    isDragging: sidebar.isDragging,

    // Canvas
    handleDragOver: canvas.handleDragOver,
    handleDragEnter: canvas.handleDragEnter,
    handleDragLeave: canvas.handleDragLeave,
    handleDrop: canvas.handleDrop,
    isOverCanvas: canvas.isOver,
    previewPosition: canvas.previewPosition,
  };
}
