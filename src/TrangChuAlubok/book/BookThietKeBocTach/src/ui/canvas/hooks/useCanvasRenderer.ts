/**
 * useCanvasRenderer - Hook that owns the Canvas2D draw() callback
 *
 * STEP-5 extraction from CadDrawingCanvas.tsx
 * STEP-5.9: Split into thin orchestrator + 5 renderer functions
 *
 * This hook creates a memoized draw callback that renders all canvas content:
 * - Grid, crosshair, snap markers
 * - Entities (lines, rects, circles, arcs, ellipses, text)
 * - Selection highlights and grips
 * - Ghost/preview entities for modify commands
 * - Command-based drawing preview (DIEU KIEN 1)
 * - Dynamic dimension display
 * - Dimension annotations
 * - Paste mode preview
 * - Selection box
 */

"use client";

import { useCallback, type RefObject } from "react";
import type { DimensionEntity } from "../../../core/dimensions/DimensionManager";
import type { DrawingState, LayerInfo, DimensionGrip } from "../canvas.types";
import type { Point, CadEntity } from "../types/CadEntity";
import type { TextHitTestContext, TextRenderSettings } from "../utils";
import {
  drawGrid,
  drawSelectionBox,
  drawCrosshair,
  renderAllDimensions,
} from "../utils";

// STEP-5.9: Extracted renderer functions
import {
  drawEntities,
  drawModifyPreview,
  drawDynamicDimension,
  drawCommandPreview,
  drawPastePreview,
} from "./renderers";

// ==================== Params Interface ====================

export interface CanvasRendererParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  // Entities
  entities: CadEntity[];
  selectedIds: string[];
  hoveredId: string | null;
  // Drawing state
  drawState: DrawingState;
  mousePos: Point;
  // Viewport
  zoom: number;
  worldToScreen: (worldX: number, worldY: number) => Point;
  canvasBgColor: string;
  // Grid / snap
  showGrid: boolean;
  snapToGrid: boolean;
  snapPoint: { point: Point; type: string } | null;
  // Layers
  layers: LayerInfo[];
  // Dimensions
  showDimensions: boolean;
  dimensions: DimensionEntity[];
  hoveredDimensionId: string | null;
  hoveredGrip: DimensionGrip | null;
  selectedDimensionIds: string[];
  previewDimension: DimensionEntity | null;
  previewDimensions: DimensionEntity[];
  dimScale: number;
  dimRounding: boolean;
  dimShowUnit: boolean;
  dimTextColor: string;
  dimLineColor: string;
  dimLineweight: number;
  dimExtensionGap: boolean;
  dimArrowStyle: "closed" | "open" | "tick" | "dot" | "none";
  // Preview state
  isControlled: boolean;
  movingPreviewDelta: Point | null;
  offsetPreviewEntity: { type: CadEntity["type"]; points: Point[] } | null;
  commandPreviewEntity: CadEntity | null;
  // Paste mode
  pasteMode: boolean;
  pastePreviewEntities: CadEntity[];
  // Text
  textHitTestContext: TextHitTestContext | undefined;
  textSettings?: TextRenderSettings;
}

// ==================== Hook ====================

export function useCanvasRenderer(params: CanvasRendererParams) {
  const {
    canvasRef,
    entities,
    selectedIds,
    hoveredId,
    drawState,
    mousePos,
    zoom,
    worldToScreen,
    canvasBgColor,
    showGrid,
    snapToGrid,
    snapPoint,
    layers,
    showDimensions,
    dimensions,
    hoveredDimensionId,
    hoveredGrip,
    selectedDimensionIds,
    previewDimension,
    previewDimensions,
    dimScale,
    dimRounding,
    dimShowUnit,
    dimTextColor,
    dimLineColor,
    dimLineweight,
    dimExtensionGap,
    dimArrowStyle,
    isControlled,
    movingPreviewDelta,
    offsetPreviewEntity,
    commandPreviewEntity,
    pasteMode,
    pastePreviewEntities,
    textHitTestContext,
    textSettings,
  } = params;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, width, height);

    // Create render context for helper functions
    const renderContext = {
      ctx,
      width,
      height,
      zoom,
      worldToScreen,
    };

    // Grid
    if (showGrid) {
      drawGrid(renderContext);
    }

    // ==================== Compute Display Entities ====================
    // Apply moving preview delta in controlled mode
    const movingEntityIds =
      drawState.mode === "moving"
        ? new Set(drawState.entities.map((e) => e.id))
        : null;

    // Get entity IDs for modify commands preview
    const modifyEntityIds =
      (drawState.mode === "modifyMove" ||
        drawState.mode === "modifyCopy" ||
        drawState.mode === "modifyRotate" ||
        drawState.mode === "modifyMirror" ||
        drawState.mode === "modifyScale") &&
      "entityIds" in drawState
        ? new Set(drawState.entityIds)
        : null;

    const displayEntities =
      isControlled && movingPreviewDelta && movingEntityIds
        ? entities.map((entity) => {
            if (movingEntityIds.has(entity.id)) {
              // Special handling for circle/arc: only move center, keep radius
              if (entity.type === "circle" || entity.type === "arc") {
                return {
                  ...entity,
                  points: entity.points.map((p, index) => {
                    if (index === 0) {
                      return {
                        x: p.x + movingPreviewDelta.x,
                        y: p.y + movingPreviewDelta.y,
                      };
                    }
                    return { ...p };
                  }),
                };
              }
              return {
                ...entity,
                points: entity.points.map((p) => ({
                  x: p.x + movingPreviewDelta.x,
                  y: p.y + movingPreviewDelta.y,
                })),
              };
            }
            return entity;
          })
        : entities;

    // ==================== Ghost Modify Preview ====================
    if (movingPreviewDelta && modifyEntityIds) {
      drawModifyPreview(
        ctx,
        entities,
        modifyEntityIds,
        drawState,
        movingPreviewDelta,
        dimensions,
        dimScale,
        dimRounding,
        zoom,
        worldToScreen,
      );

      // Dynamic dimension display for MOVE/COPY
      if (
        (drawState.mode === "modifyMove" || drawState.mode === "modifyCopy") &&
        "basePoint" in drawState &&
        drawState.basePoint
      ) {
        const basePoint = drawState.basePoint;
        const secondPoint = {
          x: basePoint.x + movingPreviewDelta.x,
          y: basePoint.y + movingPreviewDelta.y,
        };
        drawDynamicDimension(
          ctx,
          basePoint,
          secondPoint,
          movingPreviewDelta,
          worldToScreen,
        );
      }

      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // ==================== OFFSET Preview ====================
    if (offsetPreviewEntity && offsetPreviewEntity.points.length > 0) {
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;

      const previewPoints = offsetPreviewEntity.points;

      if (
        offsetPreviewEntity.type === "line" ||
        offsetPreviewEntity.type === "polyline"
      ) {
        if (previewPoints.length >= 2) {
          ctx.beginPath();
          const start = worldToScreen(previewPoints[0].x, previewPoints[0].y);
          ctx.moveTo(start.x, start.y);
          for (let i = 1; i < previewPoints.length; i++) {
            const pt = worldToScreen(previewPoints[i].x, previewPoints[i].y);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }
      } else if (offsetPreviewEntity.type === "rect") {
        const p1 = worldToScreen(previewPoints[0].x, previewPoints[0].y);
        const p2 = worldToScreen(previewPoints[1].x, previewPoints[1].y);
        ctx.strokeRect(
          Math.min(p1.x, p2.x),
          Math.min(p1.y, p2.y),
          Math.abs(p2.x - p1.x),
          Math.abs(p2.y - p1.y),
        );
      } else if (offsetPreviewEntity.type === "circle") {
        const center = worldToScreen(previewPoints[0].x, previewPoints[0].y);
        const radius = previewPoints[1].x * zoom;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // ==================== Dynamic Dimension for DRAG MOVING ====================
    if (
      drawState.mode === "moving" &&
      "startPos" in drawState &&
      drawState.startPos
    ) {
      const startPos = drawState.startPos;
      const delta = {
        x: mousePos.x - startPos.x,
        y: mousePos.y - startPos.y,
      };
      drawDynamicDimension(ctx, startPos, mousePos, delta, worldToScreen);
    }

    // ==================== Entity Rendering ====================
    drawEntities(
      ctx,
      displayEntities,
      selectedIds,
      hoveredId,
      layers,
      zoom,
      worldToScreen,
      textHitTestContext,
      textSettings,
    );

    // ==================== Command Preview (ĐIỀU KIỆN 1) ====================
    drawCommandPreview(ctx, commandPreviewEntity, zoom, worldToScreen);

    // NOTE: Legacy drawing preview code removed — now using command-based preview above (ĐIỀU KIỆN 1)

    // ==================== Paste Mode Preview ====================
    if (pasteMode) {
      drawPastePreview(
        ctx,
        pastePreviewEntities,
        mousePos,
        zoom,
        worldToScreen,
      );
    }

    // ==================== Selection Box ====================
    if (drawState.mode === "selecting") {
      drawSelectionBox(renderContext, drawState.start, drawState.currentPos);
    }

    ctx.setLineDash([]);

    // ==================== Dimensions ====================
    const dimensionContext = {
      ctx,
      worldToScreen,
      selectedDimensionIds,
      hoveredDimensionId,
      hoveredGrip,
      zoom,
      dimScale,
      dimRounding,
      dimShowUnit,
      dimTextColor,
      dimLineColor,
      dimLineweight,
      dimExtensionGap,
      dimArrowStyle,
    };
    if (showDimensions) {
      renderAllDimensions(
        dimensionContext,
        dimensions,
        previewDimension,
        previewDimensions || [],
      );
    }

    // ==================== Crosshair + OSNAP ====================
    const mouseScreen = worldToScreen(mousePos.x, mousePos.y);
    drawCrosshair(ctx, mouseScreen, width, height);

    // OSNAP marker - handled by OsnapOverlay component
    if (!snapPoint && snapToGrid) {
      ctx.fillStyle = "#ff0";
      ctx.beginPath();
      ctx.arc(mouseScreen.x, mouseScreen.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [
    entities,
    selectedIds,
    hoveredId,
    hoveredDimensionId,
    hoveredGrip,
    selectedDimensionIds,
    drawState,
    mousePos,
    showGrid,
    showDimensions,
    worldToScreen,
    zoom,
    snapToGrid,
    snapPoint,
    layers,
    dimensions,
    previewDimension,
    previewDimensions,
    dimScale,
    dimRounding,
    dimShowUnit,
    dimTextColor,
    dimLineColor,
    dimLineweight,
    dimExtensionGap,
    dimArrowStyle,
    canvasBgColor,
    isControlled,
    movingPreviewDelta,
    offsetPreviewEntity,
    commandPreviewEntity,
    pasteMode,
    pastePreviewEntities,
    textHitTestContext,
  ]);


  return { draw };
}
