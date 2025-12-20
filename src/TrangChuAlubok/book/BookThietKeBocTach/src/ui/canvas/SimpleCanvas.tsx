/**
 * SimpleCanvas - A simple canvas with grid and basic drawing
 * Uses HTML Canvas 2D directly for reliability
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ToolMode } from "../../core/engine/EngineState";

interface Point {
  x: number;
  y: number;
}

interface DrawnEntity {
  id: string;
  type: "line" | "rect" | "circle";
  points: Point[];
  color: string;
  lineWidth: number;
}

export interface SimpleCanvasProps {
  activeTool: ToolMode;
  showGrid?: boolean;
  gridSpacing?: number;
  onEntityCreated?: (entity: DrawnEntity) => void;
  onMouseMove?: (pos: Point) => void;
}

// Helper function to get drawing type from tool mode (moved outside component)
const getToolType = (
  tool: ToolMode
): "line" | "rect" | "circle" | "select" | null => {
  switch (tool) {
    case ToolMode.DRAW_LINE:
      return "line";
    case ToolMode.DRAW_RECT:
      return "rect";
    case ToolMode.DRAW_CIRCLE:
      return "circle";
    case ToolMode.SELECT:
      return "select";
    default:
      return null;
  }
};

export const SimpleCanvas: React.FC<SimpleCanvasProps> = ({
  activeTool,
  showGrid = true,
  gridSpacing: _gridSpacing = 20, // Reserved for future use
  onEntityCreated,
  onMouseMove,
}) => {
  void _gridSpacing; // Suppress unused warning
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [entities, setEntities] = useState<DrawnEntity[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, _setPan] = useState<Point>({ x: 0, y: 0 });
  void _setPan; // For future pan implementation

  // Resize canvas to fit container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Draw everything
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Draw grid FIRST in screen space (fixed 20px spacing)
    if (showGrid) {
      const screenSpacing = 20; // Fixed 20px on screen
      const majorEvery = 5;

      // Minor grid lines
      ctx.strokeStyle = "#2a2a3e";
      ctx.lineWidth = 0.5;
      ctx.beginPath();

      for (let x = 0; x <= width; x += screenSpacing) {
        if (Math.round(x / screenSpacing) % majorEvery !== 0) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
      }

      for (let y = 0; y <= height; y += screenSpacing) {
        if (Math.round(y / screenSpacing) % majorEvery !== 0) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
      }

      ctx.stroke();

      // Major grid lines
      ctx.strokeStyle = "#3a3a4e";
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let x = 0; x <= width; x += screenSpacing) {
        if (Math.round(x / screenSpacing) % majorEvery === 0) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
      }

      for (let y = 0; y <= height; y += screenSpacing) {
        if (Math.round(y / screenSpacing) % majorEvery === 0) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
      }

      ctx.stroke();

      // Origin cross (in world space, transformed)
      const originScreenX = pan.x;
      const originScreenY = pan.y;

      if (originScreenX >= 0 && originScreenX <= width) {
        ctx.strokeStyle = "#4a4a6e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originScreenX, 0);
        ctx.lineTo(originScreenX, height);
        ctx.stroke();
      }

      if (originScreenY >= 0 && originScreenY <= height) {
        ctx.strokeStyle = "#4a4a6e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, originScreenY);
        ctx.lineTo(width, originScreenY);
        ctx.stroke();
      }
    }

    // Apply pan/zoom transform for entities
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw entities
    entities.forEach((entity) => {
      ctx.strokeStyle = entity.color;
      ctx.lineWidth = entity.lineWidth / zoom;
      ctx.beginPath();

      if (entity.type === "line" && entity.points.length >= 2) {
        ctx.moveTo(entity.points[0].x, entity.points[0].y);
        ctx.lineTo(entity.points[1].x, entity.points[1].y);
        ctx.stroke();
      } else if (entity.type === "rect" && entity.points.length >= 2) {
        const [p1, p2] = entity.points;
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (entity.type === "circle" && entity.points.length >= 2) {
        const [center, edge] = entity.points;
        const radius = Math.sqrt(
          Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
        );
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw preview (current drawing)
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      const toolType = getToolType(activeTool);

      if (toolType === "line") {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      } else if (toolType === "rect") {
        ctx.strokeRect(
          startPoint.x,
          startPoint.y,
          currentPoint.x - startPoint.x,
          currentPoint.y - startPoint.y
        );
      } else if (toolType === "circle") {
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) +
            Math.pow(currentPoint.y - startPoint.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    ctx.restore();

    // Draw crosshair cursor
    if (currentPoint) {
      const screenX = currentPoint.x * zoom + pan.x;
      const screenY = currentPoint.y * zoom + pan.y;

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [
    entities,
    isDrawing,
    startPoint,
    currentPoint,
    showGrid,
    zoom,
    pan,
    activeTool,
  ]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Convert screen to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      return {
        x: (screenX - pan.x) / zoom,
        y: (screenY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldPos = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top
      );

      // Middle mouse button for pan
      if (e.button === 1) {
        e.preventDefault();
        return;
      }

      const toolType = getToolType(activeTool);

      if (toolType && toolType !== "select") {
        setIsDrawing(true);
        setStartPoint(worldPos);
        setCurrentPoint(worldPos);
      }
    },
    [activeTool, screenToWorld]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldPos = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      setCurrentPoint(worldPos);
      onMouseMove?.(worldPos);

      if (isDrawing) {
        draw();
      }
    },
    [isDrawing, screenToWorld, onMouseMove, draw]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !startPoint || !currentPoint) {
        setIsDrawing(false);
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldPos = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      const toolType = getToolType(activeTool);

      if (toolType && toolType !== "select") {
        // Check if there's actual movement (not just a click)
        const dx = Math.abs(worldPos.x - startPoint.x);
        const dy = Math.abs(worldPos.y - startPoint.y);

        if (dx > 5 || dy > 5) {
          const newEntity: DrawnEntity = {
            id: `entity-${Date.now()}`,
            type: toolType as "line" | "rect" | "circle",
            points: [startPoint, worldPos],
            color: "#ffffff",
            lineWidth: 2,
          };

          setEntities((prev) => [...prev, newEntity]);
          onEntityCreated?.(newEntity);
        }
      }

      setIsDrawing(false);
      setStartPoint(null);
    },
    [
      isDrawing,
      startPoint,
      currentPoint,
      activeTool,
      screenToWorld,
      onEntityCreated,
    ]
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.0001, Math.min(100000, prev * delta)));
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          cursor: activeTool === ToolMode.SELECT ? "default" : "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) {
            setIsDrawing(false);
            setStartPoint(null);
          }
          setCurrentPoint(null);
        }}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default SimpleCanvas;
