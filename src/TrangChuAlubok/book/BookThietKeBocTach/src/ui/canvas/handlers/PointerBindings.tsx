/**
 * PointerBindings - Binds pointer/mouse events to engine actions
 * Translates DOM events to commands and hook calls
 */

"use client";

import React, { useCallback, useRef } from "react";
import { ToolMode } from "../../../core/engine/EngineState";

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

export interface PointerBindingsProps {
  children: React.ReactNode;
  viewport: ViewportState;
  activeTool: ToolMode;
  disabled?: boolean;

  // Event handlers - called with world coordinates
  onPointerDown?: (
    worldPos: Point,
    screenPos: Point,
    e: React.PointerEvent
  ) => void;
  onPointerMove?: (
    worldPos: Point,
    screenPos: Point,
    e: React.PointerEvent
  ) => void;
  onPointerUp?: (
    worldPos: Point,
    screenPos: Point,
    e: React.PointerEvent
  ) => void;
  onWheel?: (deltaY: number, screenPos: Point, e: React.WheelEvent) => void;
  onContextMenu?: (
    worldPos: Point,
    screenPos: Point,
    e: React.MouseEvent
  ) => void;

  // Pan handling
  onPanStart?: (screenPos: Point) => void;
  onPanMove?: (delta: Point) => void;
  onPanEnd?: () => void;
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

export const PointerBindings: React.FC<PointerBindingsProps> = ({
  children,
  viewport,
  // activeTool - kept in props interface for future use
  disabled = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onContextMenu,
  onPanStart,
  onPanMove,
  onPanEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef<Point>({ x: 0, y: 0 });

  const getScreenPos = useCallback(
    (e: React.PointerEvent | React.MouseEvent | React.WheelEvent): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      const screenPos = getScreenPos(e);
      const worldPos = screenToWorld(screenPos, viewport);

      // Middle mouse button starts panning
      if (e.button === 1) {
        e.preventDefault();
        isPanningRef.current = true;
        lastPanPosRef.current = screenPos;
        onPanStart?.(screenPos);
        return;
      }

      onPointerDown?.(worldPos, screenPos, e);
    },
    [disabled, viewport, getScreenPos, onPointerDown, onPanStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      const screenPos = getScreenPos(e);
      const worldPos = screenToWorld(screenPos, viewport);

      // Handle panning
      if (isPanningRef.current) {
        const delta = {
          x: screenPos.x - lastPanPosRef.current.x,
          y: screenPos.y - lastPanPosRef.current.y,
        };
        lastPanPosRef.current = screenPos;
        onPanMove?.(delta);
        return;
      }

      onPointerMove?.(worldPos, screenPos, e);
    },
    [disabled, viewport, getScreenPos, onPointerMove, onPanMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      const screenPos = getScreenPos(e);
      const worldPos = screenToWorld(screenPos, viewport);

      // End panning
      if (e.button === 1 && isPanningRef.current) {
        isPanningRef.current = false;
        onPanEnd?.();
        return;
      }

      onPointerUp?.(worldPos, screenPos, e);
    },
    [disabled, viewport, getScreenPos, onPointerUp, onPanEnd]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;
      e.preventDefault();

      const screenPos = getScreenPos(e);
      onWheel?.(e.deltaY, screenPos, e);
    },
    [disabled, getScreenPos, onWheel]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();

      const screenPos = getScreenPos(e);
      const worldPos = screenToWorld(screenPos, viewport);
      onContextMenu?.(worldPos, screenPos, e);
    },
    [disabled, viewport, getScreenPos, onContextMenu]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        if (isPanningRef.current) {
          isPanningRef.current = false;
          onPanEnd?.();
        }
      }}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      {children}
    </div>
  );
};

export default PointerBindings;
