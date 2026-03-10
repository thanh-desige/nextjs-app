/**
 * useDoorDragDrop — STEP-5 extraction from CadDrawingCanvas
 *
 * Owns: Door drag & drop state (isDragOver, dragPreviewPos) + event handlers
 * (handleDragOver, handleDragEnter, handleDragLeave, handleDrop).
 */

import { useState, useCallback } from "react";
import type { Point } from "../canvas.types";

// ==================== Interface ====================

export interface DoorDragDropParams {
  containerRef: React.RefObject<HTMLDivElement | null>;
  screenToWorld: (screenX: number, screenY: number) => Point;
  onDoorDrop?: (doorData: {
    variant: string;
    systemId: string;
    displayName: string;
    defaultSize: { width: number; height: number };
    position: Point;
    templateId?: string;
  }) => void;
  onPromptChange?: (msg: string) => void;
}

export interface DoorDragDropReturn {
  isDragOver: boolean;
  dragPreviewPos: Point | null;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

// ==================== Hook ====================

export function useDoorDragDrop(
  params: DoorDragDropParams,
): DoorDragDropReturn {
  const { containerRef, screenToWorld, onDoorDrop, onPromptChange } = params;

  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPreviewPos, setDragPreviewPos] = useState<Point | null>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      const isDoorTemplate = e.dataTransfer.types.includes(
        "application/door-template",
      );
      const isDoorItem = e.dataTransfer.types.includes("application/door-item");

      if (isDoorTemplate || isDoorItem) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";

        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          setDragPreviewPos(screenToWorld(screenX, screenY));
        }
      }
    },
    [containerRef, screenToWorld],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    const isDoorTemplate = e.dataTransfer.types.includes(
      "application/door-template",
    );
    const isDoorItem = e.dataTransfer.types.includes("application/door-item");

    if (isDoorTemplate || isDoorItem) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const { clientX, clientY } = e;
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          setIsDragOver(false);
          setDragPreviewPos(null);
        }
      }
    },
    [containerRef],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setDragPreviewPos(null);

      // Try door-template format first (from DoorTemplateOverlay)
      const templateData = e.dataTransfer.getData("application/door-template");
      if (templateData) {
        try {
          const doorData = JSON.parse(templateData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect && onDoorDrop) {
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = screenToWorld(screenX, screenY);

            onDoorDrop({
              variant: doorData.variant,
              systemId: doorData.systemId,
              displayName: doorData.displayName,
              defaultSize: doorData.defaultSize,
              position: worldPos,
              templateId: doorData.templateId,
            });

            onPromptChange?.(
              `Đã thêm cửa: ${doorData.displayName} tại (${Math.round(
                worldPos.x,
              )}, ${Math.round(worldPos.y)})`,
            );
          }
          return;
        } catch (error) {
          console.error(
            "[CadDrawingCanvas] Failed to parse door-template data:",
            error,
          );
        }
      }

      // Fallback to door-item format (legacy)
      const data = e.dataTransfer.getData("application/door-item");
      if (!data || !onDoorDrop) return;

      try {
        const doorData = JSON.parse(data);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          const worldPos = screenToWorld(screenX, screenY);

          onDoorDrop({
            ...doorData,
            position: worldPos,
          });

          onPromptChange?.(
            `Đã thêm cửa: ${doorData.displayName} tại (${Math.round(
              worldPos.x,
            )}, ${Math.round(worldPos.y)})`,
          );
        }
      } catch (error) {
        console.error("[CadDrawingCanvas] Failed to parse door data:", error);
      }
    },
    [containerRef, screenToWorld, onDoorDrop, onPromptChange],
  );

  return {
    isDragOver,
    dragPreviewPos,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
