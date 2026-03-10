/**
 * useWheelHandler.ts - Wheel/Zoom event handler hook
 *
 * Tách từ CadDrawingCanvas.tsx để giảm kích thước file và dễ bảo trì.
 * Xử lý zoom qua scroll wheel với các tính năng:
 * - Zoom về phía con trỏ chuột
 * - Zoom về điểm snap nếu có
 * - Giới hạn zoom min/max
 */

import { useCallback } from "react";
import type { RefObject } from "react";

import type { Point } from "../utils/geometry";

// ==================== Types ====================

export interface WheelHandlerConfig {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  pan: Point;
  setPan: (pan: Point | ((prev: Point) => Point)) => void;
  snapPoint: { point: Point; type: string } | null;
  minZoom?: number;
  maxZoom?: number;
  zoomFactor?: number;
}

export interface UseWheelHandlerReturn {
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
}

// ==================== Hook ====================

export function useWheelHandler(
  config: WheelHandlerConfig
): UseWheelHandlerReturn {
  const {
    canvasRef,
    zoom,
    setZoom,
    pan,
    setPan,
    snapPoint,
    minZoom = 0.0001,
    maxZoom = 100000,
    zoomFactor = 1.1,
  } = config;

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;

      const canvas = canvasRef.current;
      if (!canvas) {
        setZoom((prev) => Math.max(minZoom, Math.min(maxZoom, prev * delta)));
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Get zoom target point - use snap point if available, otherwise mouse position
      let targetWorld: Point;
      if (snapPoint) {
        targetWorld = snapPoint.point;
      } else {
        // Convert screen to world
        const centerX = canvas.width / 2 + pan.x;
        const centerY = canvas.height / 2 + pan.y;
        targetWorld = {
          x: (screenX - centerX) / zoom,
          y: -(screenY - centerY) / zoom,
        };
      }

      // Calculate new zoom
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * delta));

      // Adjust pan so that targetWorld stays at the same screen position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Screen position of target with old zoom
      const oldScreenX = targetWorld.x * zoom + centerX + pan.x;
      const oldScreenY = -targetWorld.y * zoom + centerY + pan.y;

      // Screen position of target with new zoom (without pan adjustment)
      const newScreenXWithoutPan = targetWorld.x * newZoom + centerX;
      const newScreenYWithoutPan = -targetWorld.y * newZoom + centerY;

      // Calculate new pan to keep target at same screen position
      const newPanX = oldScreenX - newScreenXWithoutPan;
      const newPanY = oldScreenY - newScreenYWithoutPan;

      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    },
    [
      zoom,
      pan,
      snapPoint,
      canvasRef,
      setZoom,
      setPan,
      minZoom,
      maxZoom,
      zoomFactor,
    ]
  );

  return { handleWheel };
}
