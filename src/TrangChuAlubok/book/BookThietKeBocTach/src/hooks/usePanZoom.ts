/**
 * usePanZoom - Hook for viewport pan and zoom control
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { useEngineStore } from "../store/engineStore";
import { IVec2 } from "../core/geometry/Vec2";

// ==================== Types ====================

export interface UsePanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  panSpeed?: number;
  wheelZoomFactor?: number;
}

export interface UsePanZoomReturn {
  // Viewport state
  zoom: number;
  panOffset: IVec2;

  // Zoom controls
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  zoomToSelection: () => void;
  zoomToPoint: (point: IVec2, newZoom: number) => void;

  // Pan controls
  setPanOffset: (offset: IVec2) => void;
  pan: (delta: IVec2) => void;
  panTo: (point: IVec2) => void;

  // Event handlers for canvas
  handleWheel: (e: WheelEvent) => void;
  handlePanStart: (e: MouseEvent | TouchEvent) => void;
  handlePanMove: (e: MouseEvent | TouchEvent) => void;
  handlePanEnd: () => void;

  // State
  isPanning: boolean;
}

// ==================== Hook Implementation ====================

export function usePanZoom(options: UsePanZoomOptions = {}): UsePanZoomReturn {
  const {
    minZoom = 0.0001,
    maxZoom = 100000,
    // zoomStep = 1.25, // Reserved for future use
    wheelZoomFactor = 0.001,
  } = options;

  // Pan state - using useState for isPanning since it affects render
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPointRef = useRef<IVec2>({ x: 0, y: 0 });

  // Store selectors
  const zoom = useEngineStore((state) => state.zoom);
  const panOffset = useEngineStore((state) => state.panOffset);

  // Store actions
  const storeSetZoom = useEngineStore((state) => state.setZoom);
  const storeSetPanOffset = useEngineStore((state) => state.setPanOffset);
  const storeZoomIn = useEngineStore((state) => state.zoomIn);
  const storeZoomOut = useEngineStore((state) => state.zoomOut);
  const storeZoomFit = useEngineStore((state) => state.zoomFit);
  const storeZoomToSelection = useEngineStore((state) => state.zoomToSelection);

  // Clamp zoom
  const clampZoom = useCallback(
    (z: number) => {
      return Math.max(minZoom, Math.min(maxZoom, z));
    },
    [minZoom, maxZoom]
  );

  // Set zoom with clamping
  const setZoom = useCallback(
    (z: number) => {
      storeSetZoom(clampZoom(z));
    },
    [storeSetZoom, clampZoom]
  );

  // Zoom in/out
  const zoomIn = useCallback(() => {
    storeZoomIn();
  }, [storeZoomIn]);

  const zoomOut = useCallback(() => {
    storeZoomOut();
  }, [storeZoomOut]);

  // Zoom to fit
  const zoomFit = useCallback(() => {
    storeZoomFit();
  }, [storeZoomFit]);

  // Zoom to selection
  const zoomToSelection = useCallback(() => {
    storeZoomToSelection();
  }, [storeZoomToSelection]);

  // Zoom to specific point (keeps point in same screen position)
  const zoomToPoint = useCallback(
    (point: IVec2, newZoom: number) => {
      const clampedZoom = clampZoom(newZoom);
      const zoomRatio = clampedZoom / zoom;

      // Calculate new pan offset to keep point in same position
      const newPanOffset: IVec2 = {
        x: point.x - (point.x - panOffset.x) * zoomRatio,
        y: point.y - (point.y - panOffset.y) * zoomRatio,
      };

      storeSetZoom(clampedZoom);
      storeSetPanOffset(newPanOffset);
    },
    [zoom, panOffset, clampZoom, storeSetZoom, storeSetPanOffset]
  );

  // Set pan offset
  const setPanOffset = useCallback(
    (offset: IVec2) => {
      storeSetPanOffset(offset);
    },
    [storeSetPanOffset]
  );

  // Pan by delta
  const pan = useCallback(
    (delta: IVec2) => {
      storeSetPanOffset({
        x: panOffset.x + delta.x,
        y: panOffset.y + delta.y,
      });
    },
    [panOffset, storeSetPanOffset]
  );

  // Pan to specific point (center on point)
  const panTo = useCallback(
    (point: IVec2) => {
      storeSetPanOffset(point);
    },
    [storeSetPanOffset]
  );

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const zoomDelta = -e.deltaY * wheelZoomFactor;
      const newZoom = zoom * (1 + zoomDelta);

      // Zoom towards mouse position
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      zoomToPoint({ x: mouseX, y: mouseY }, newZoom);
    },
    [zoom, wheelZoomFactor, zoomToPoint]
  );

  // Get point from event
  const getEventPoint = useCallback((e: MouseEvent | TouchEvent): IVec2 => {
    if ("touches" in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ("clientX" in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  }, []);

  // Pan start
  const handlePanStart = useCallback(
    (e: MouseEvent | TouchEvent) => {
      setIsPanning(true);
      lastPanPointRef.current = getEventPoint(e);
    },
    [getEventPoint]
  );

  // Pan move
  const handlePanMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isPanning) return;

      const currentPoint = getEventPoint(e);
      const delta: IVec2 = {
        x: currentPoint.x - lastPanPointRef.current.x,
        y: currentPoint.y - lastPanPointRef.current.y,
      };

      pan({
        x: delta.x / zoom,
        y: delta.y / zoom,
      });

      lastPanPointRef.current = currentPoint;
    },
    [zoom, pan, getEventPoint, isPanning]
  );

  // Pan end
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  return {
    zoom,
    panOffset,
    setZoom,
    zoomIn,
    zoomOut,
    zoomFit,
    zoomToSelection,
    zoomToPoint,
    setPanOffset,
    pan,
    panTo,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    isPanning,
  };
}

export default usePanZoom;
