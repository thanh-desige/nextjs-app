/**
 * drawPastePreview — Ghost entities following cursor in paste mode
 *
 * STEP-5.9: Extracted from useCanvasRenderer.ts
 * Renders ghost entities at mouse position when in paste mode.
 */

import type { Point, CadEntity } from "../../types/CadEntity";

export function drawPastePreview(
  ctx: CanvasRenderingContext2D,
  pastePreviewEntities: CadEntity[],
  mousePos: Point,
  zoom: number,
  worldToScreen: (wx: number, wy: number) => Point,
): void {
  if (!pastePreviewEntities || pastePreviewEntities.length === 0) return;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([5, 5]);

  for (const entity of pastePreviewEntities) {
    // Offset entities to follow mouse position
    const offsetPoints = entity.points.map((p) => ({
      x: p.x + mousePos.x,
      y: p.y + mousePos.y,
    }));

    ctx.strokeStyle = "#00ffff"; // Cyan color for paste preview
    ctx.lineWidth = 2;

    if (entity.type === "line" && offsetPoints.length >= 2) {
      const start = worldToScreen(offsetPoints[0].x, offsetPoints[0].y);
      const end = worldToScreen(offsetPoints[1].x, offsetPoints[1].y);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (
      (entity.type === "polyline" || entity.type === "rect") &&
      offsetPoints.length >= 2
    ) {
      ctx.beginPath();
      const start = worldToScreen(offsetPoints[0].x, offsetPoints[0].y);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < offsetPoints.length; i++) {
        const pt = worldToScreen(offsetPoints[i].x, offsetPoints[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      if (entity.closed) {
        ctx.closePath();
      }
      ctx.stroke();
    } else if (entity.type === "circle" && offsetPoints.length >= 2) {
      const center = worldToScreen(offsetPoints[0].x, offsetPoints[0].y);
      const radius = entity.points[1].x * zoom; // radius stored in second point x
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}
