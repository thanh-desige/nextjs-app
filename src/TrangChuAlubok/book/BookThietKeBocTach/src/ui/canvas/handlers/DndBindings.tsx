/**
 * DndBindings - Drag and drop bindings for template placement
 * Handles dropping door templates and other draggable items onto canvas
 */

"use client";

import React, { useCallback, useState } from "react";

export interface Point {
  x: number;
  y: number;
}

export interface ViewportState {
  pan: Point;
  zoom: number;
  width: number;
  height: number;
}

export interface DropData {
  type: string;
  templateId?: string;
  data?: unknown;
}

export interface DndBindingsProps {
  children: React.ReactNode;
  viewport: ViewportState;
  disabled?: boolean;
  acceptTypes?: string[];

  // Drop handlers
  onDragEnter?: (dropData: DropData, worldPos: Point) => void;
  onDragOver?: (dropData: DropData, worldPos: Point) => void;
  onDragLeave?: () => void;
  onDrop?: (dropData: DropData, worldPos: Point) => void;
}

/**
 * Convert screen coordinates to world coordinates
 */
function screenToWorld(screenPos: Point, viewport: ViewportState): Point {
  const centerX = viewport.width / 2 + viewport.pan.x;
  const centerY = viewport.height / 2 + viewport.pan.y;
  return {
    x: (screenPos.x - centerX) / viewport.zoom,
    y: -(screenPos.y - centerY) / viewport.zoom,
  };
}

/**
 * Parse drop data from drag event
 */
function parseDropData(e: React.DragEvent): DropData | null {
  try {
    // Try to get JSON data
    const jsonData = e.dataTransfer.getData("application/json");
    if (jsonData) {
      return JSON.parse(jsonData);
    }

    // Try to get text data
    const textData = e.dataTransfer.getData("text/plain");
    if (textData) {
      try {
        return JSON.parse(textData);
      } catch {
        return { type: "text", data: textData };
      }
    }

    // Check for files
    if (e.dataTransfer.files.length > 0) {
      return {
        type: "file",
        data: Array.from(e.dataTransfer.files),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export const DndBindings: React.FC<DndBindingsProps> = ({
  children,
  viewport,
  disabled = false,
  acceptTypes = [],
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getScreenPos = useCallback((e: React.DragEvent): Point => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      setIsDragOver(true);

      const dropData = parseDropData(e);
      if (!dropData) return;

      // Check if we accept this type
      if (acceptTypes.length > 0 && !acceptTypes.includes(dropData.type)) {
        return;
      }

      const screenPos = getScreenPos(e);
      const worldPos = screenToWorld(screenPos, viewport);
      onDragEnter?.(dropData, worldPos);
    },
    [disabled, acceptTypes, viewport, getScreenPos, onDragEnter]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      // Set drop effect
      e.dataTransfer.dropEffect = "copy";

      const dropData = parseDropData(e);
      if (!dropData) return;

      if (acceptTypes.length > 0 && !acceptTypes.includes(dropData.type)) {
        e.dataTransfer.dropEffect = "none";
        return;
      }

      const screenPos = getScreenPos(e);
      const worldPos = screenToWorld(screenPos, viewport);
      onDragOver?.(dropData, worldPos);
    },
    [disabled, acceptTypes, viewport, getScreenPos, onDragOver]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      // Only trigger if leaving the container (not entering a child)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragOver(false);
        onDragLeave?.();
      }
    },
    [disabled, onDragLeave]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      setIsDragOver(false);

      const dropData = parseDropData(e);
      if (!dropData) return;

      if (acceptTypes.length > 0 && !acceptTypes.includes(dropData.type)) {
        return;
      }

      const screenPos = getScreenPos(e);
      const worldPos = screenToWorld(screenPos, viewport);
      onDrop?.(dropData, worldPos);
    },
    [disabled, acceptTypes, viewport, getScreenPos, onDrop]
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        // NOTE: touchAction handled by parent canvas container
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {/* Drop indicator overlay */}
      {isDragOver && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 100, 255, 0.1)",
            border: "2px dashed rgba(0, 100, 255, 0.5)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

export default DndBindings;
