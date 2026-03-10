/**
 * drawModifyPreview — Ghost entities for modify commands + ghost dimensions + mirror line
 *
 * STEP-5.9: Extracted from useCanvasRenderer.ts
 * Renders ghost/dashed previews for:
 * - MOVE/COPY translation
 * - ROTATE rotation matrix
 * - MIRROR reflection matrix
 * - SCALE scale transform
 * - Ghost dimension lines for MOVE/COPY
 * - Mirror axis line
 */

import type { Point, CadEntity } from "../../types/CadEntity";
import type { DrawingState } from "../../canvas.types";
import type { DimensionEntity } from "../../../../core/dimensions/DimensionManager";
import { calcDimensionLinePoints } from "../../utils";

export function drawModifyPreview(
  ctx: CanvasRenderingContext2D,
  entities: CadEntity[],
  modifyEntityIds: Set<string>,
  drawState: DrawingState,
  movingPreviewDelta: Point,
  dimensions: DimensionEntity[],
  dimScale: number,
  dimRounding: boolean,
  zoom: number,
  worldToScreen: (wx: number, wy: number) => Point,
): void {
  // ==================== Ghost Entity Preview for Modify Commands ====================
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 1;

  entities.forEach((entity) => {
    if (!modifyEntityIds.has(entity.id)) return;

    let previewPoints = entity.points;
    const basePoint = "basePoint" in drawState ? drawState.basePoint : null;
    const firstPoint =
      "firstPoint" in drawState ? drawState.firstPoint : null;

    if (
      drawState.mode === "modifyMove" ||
      drawState.mode === "modifyCopy"
    ) {
      // Translation preview
      // Special handling for circle/arc: only move center (points[0]), keep radius (points[1].x)
      if (entity.type === "circle" || entity.type === "arc") {
        previewPoints = entity.points.map((p, index) => {
          if (index === 0) {
            // Move center point
            return {
              x: p.x + movingPreviewDelta.x,
              y: p.y + movingPreviewDelta.y,
            };
          }
          // Keep radius point unchanged (points[1].x is radius, not coordinate)
          return { ...p };
        });
      } else {
        previewPoints = entity.points.map((p) => ({
          x: p.x + movingPreviewDelta.x,
          y: p.y + movingPreviewDelta.y,
        }));
      }
    } else if (drawState.mode === "modifyRotate" && basePoint) {
      // Rotation preview (movingPreviewDelta.x = rotation angle)
      const rotationAngle = movingPreviewDelta.x;
      const cos = Math.cos(rotationAngle);
      const sin = Math.sin(rotationAngle);
      previewPoints = entity.points.map((p) => {
        const dx = p.x - basePoint.x;
        const dy = p.y - basePoint.y;
        return {
          x: basePoint.x + dx * cos - dy * sin,
          y: basePoint.y + dx * sin + dy * cos,
        };
      });
    } else if (drawState.mode === "modifyMirror" && firstPoint) {
      // Mirror preview
      const mirrorAngle = Math.atan2(
        movingPreviewDelta.y,
        movingPreviewDelta.x,
      );
      previewPoints = entity.points.map((p) => {
        const dx = p.x - firstPoint.x;
        const dy = p.y - firstPoint.y;
        const cos = Math.cos(-mirrorAngle);
        const sin = Math.sin(-mirrorAngle);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        const my = -ry;
        const cos2 = Math.cos(mirrorAngle);
        const sin2 = Math.sin(mirrorAngle);
        return {
          x: firstPoint.x + rx * cos2 - my * sin2,
          y: firstPoint.y + rx * sin2 + my * cos2,
        };
      });
    } else if (drawState.mode === "modifyScale" && basePoint) {
      // Scale preview (movingPreviewDelta.x = scale factor)
      const scaleFactor = movingPreviewDelta.x;
      previewPoints = entity.points.map((p) => ({
        x: basePoint.x + (p.x - basePoint.x) * scaleFactor,
        y: basePoint.y + (p.y - basePoint.y) * scaleFactor,
      }));
    }

    // Draw preview entity
    if (entity.type === "line" || entity.type === "polyline") {
      if (previewPoints.length >= 2) {
        ctx.beginPath();
        const start = worldToScreen(previewPoints[0].x, previewPoints[0].y);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < previewPoints.length; i++) {
          const pt = worldToScreen(previewPoints[i].x, previewPoints[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        // Close polyline if closed=true
        if (entity.type === "polyline" && entity.closed) {
          ctx.closePath();
        }
        ctx.stroke();
      }
    } else if (entity.type === "rect") {
      if (previewPoints.length >= 2) {
        const p1 = worldToScreen(previewPoints[0].x, previewPoints[0].y);
        const p2 = worldToScreen(previewPoints[1].x, previewPoints[1].y);
        ctx.strokeRect(
          Math.min(p1.x, p2.x),
          Math.min(p1.y, p2.y),
          Math.abs(p2.x - p1.x),
          Math.abs(p2.y - p1.y),
        );
      }
    } else if (entity.type === "circle") {
      const center = worldToScreen(previewPoints[0].x, previewPoints[0].y);
      const radius = previewPoints[1].x * zoom;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // ==================== Ghost Dimension Preview for MOVE/COPY ====================
  // Draw ghost dimensions at new position - simple preview for user visibility
  if (
    (drawState.mode === "modifyMove" || drawState.mode === "modifyCopy") &&
    "dimensionIds" in drawState &&
    drawState.dimensionIds.length > 0
  ) {
    const dimIds = new Set(drawState.dimensionIds);
    ctx.strokeStyle = "#00ff00";
    ctx.fillStyle = "#00ff00";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.6;
    ctx.font = `bold ${11 * (dimScale || 1)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    dimensions.forEach((dim) => {
      if (!dimIds.has(dim.id)) return;

      // Use calcDimensionLinePoints to get dimension line endpoints
      const dimLinePoints = calcDimensionLinePoints(dim);
      if (!dimLinePoints) return;

      // Apply movingPreviewDelta to dimension line points
      const movedDimLine1 = worldToScreen(
        dimLinePoints.dimP1.x + movingPreviewDelta.x,
        dimLinePoints.dimP1.y + movingPreviewDelta.y,
      );
      const movedDimLine2 = worldToScreen(
        dimLinePoints.dimP2.x + movingPreviewDelta.x,
        dimLinePoints.dimP2.y + movingPreviewDelta.y,
      );

      // Apply delta to extension line start points (original point1/point2)
      const movedExt1Start = worldToScreen(
        dim.point1.x + movingPreviewDelta.x,
        dim.point1.y + movingPreviewDelta.y,
      );
      const movedExt2Start = worldToScreen(
        dim.point2.x + movingPreviewDelta.x,
        dim.point2.y + movingPreviewDelta.y,
      );

      // Draw dimension line
      ctx.beginPath();
      ctx.moveTo(movedDimLine1.x, movedDimLine1.y);
      ctx.lineTo(movedDimLine2.x, movedDimLine2.y);
      ctx.stroke();

      // Draw extension lines (from point1/point2 to dimension line)
      ctx.beginPath();
      ctx.moveTo(movedExt1Start.x, movedExt1Start.y);
      ctx.lineTo(movedDimLine1.x, movedDimLine1.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(movedExt2Start.x, movedExt2Start.y);
      ctx.lineTo(movedDimLine2.x, movedDimLine2.y);
      ctx.stroke();

      // Draw dimension text at moved position
      const textX = (movedDimLine1.x + movedDimLine2.x) / 2;
      const textY = (movedDimLine1.y + movedDimLine2.y) / 2;

      // Calculate displayed value based on direction
      const direction = dim.direction || "aligned";
      let displayValue: number;
      if (direction === "horizontal") {
        displayValue = Math.abs(dim.point2.x - dim.point1.x);
      } else if (direction === "vertical") {
        displayValue = Math.abs(dim.point2.y - dim.point1.y);
      } else {
        displayValue = Math.sqrt(
          Math.pow(dim.point2.x - dim.point1.x, 2) +
            Math.pow(dim.point2.y - dim.point1.y, 2),
        );
      }
      const dimText =
        dim.textOverride ||
        (dimRounding
          ? Math.round(displayValue).toString()
          : displayValue.toFixed(2));

      // Draw text background
      const textMetrics = ctx.measureText(dimText);
      ctx.fillStyle = "rgba(0, 50, 0, 0.7)";
      ctx.fillRect(
        textX - textMetrics.width / 2 - 4,
        textY - 8,
        textMetrics.width + 8,
        16,
      );
      ctx.fillStyle = "#00ff00";
      ctx.fillText(dimText, textX, textY);

      // Draw arrow markers at ends
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(movedDimLine1.x, movedDimLine1.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(movedDimLine2.x, movedDimLine2.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  // ==================== Mirror Line Preview ====================
  if (
    drawState.mode === "modifyMirror" &&
    "firstPoint" in drawState &&
    drawState.firstPoint
  ) {
    const mirrorFirstPoint = drawState.firstPoint;
    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    const p1 = worldToScreen(mirrorFirstPoint.x, mirrorFirstPoint.y);
    const p2 = worldToScreen(
      mirrorFirstPoint.x + movingPreviewDelta.x,
      mirrorFirstPoint.y + movingPreviewDelta.y,
    );
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}
