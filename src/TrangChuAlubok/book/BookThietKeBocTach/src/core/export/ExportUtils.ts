/**
 * ExportUtils - Shared utility functions for CAD export
 * STEP-5.6: Extracted from ExportManager.ts
 *
 * 2D FIRST, 3D READY: All coordinates in world/mm units
 */

import { CadEntity, Point } from "../../ui/canvas/CadDrawingCanvas";

// ==================== Bounds Calculation ====================

/**
 * Calculate bounds of all entities including TEXT bounds
 * ========================================================================
 * 2D FIRST, 3D READY: WORLD COORDINATES ONLY
 * ========================================================================
 * Uses fontSizeMm (world/mm units) as the source of truth for TEXT bounds
 * Never uses pixel/screen coordinates in export
 * ========================================================================
 */
export function calculateBounds(entities: CadEntity[]): {
  min: Point;
  max: Point;
} {
  if (entities.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const entity of entities) {
    // Skip invisible entities
    if (entity.visible === false) continue;

    // Handle TEXT entity bounds
    if (entity.type === "text" && entity.text && entity.points.length > 0) {
      const pos = entity.points[0];
      const baseFontSize = entity.fontSize ?? 12;
      const textScale = entity.textScale ?? 1;
      const effectiveFontSize = baseFontSize * textScale;

      // Estimate text width: average char width ≈ 0.6 * fontSize
      const lines = entity.text.split("\n");
      let maxLineWidth = 0;
      for (const line of lines) {
        const lineWidth = line.length * effectiveFontSize * 0.6;
        if (lineWidth > maxLineWidth) maxLineWidth = lineWidth;
      }

      // Text height: lines * lineHeight
      const lineHeight = effectiveFontSize * 1.2;

      // TEXT in CAD: position is at bottom-left, text goes UP and RIGHT
      // Add padding for safety
      const padding = effectiveFontSize * 0.2;
      minX = Math.min(minX, pos.x - padding);
      minY = Math.min(minY, pos.y - lineHeight - padding); // First line baseline
      maxX = Math.max(maxX, pos.x + maxLineWidth + padding);
      maxY = Math.max(maxY, pos.y + (lines.length - 1) * lineHeight + padding);
      continue;
    }

    // Handle other entity points
    for (const point of entity.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    // Handle circle radius
    if (entity.type === "circle" && entity.points.length >= 2) {
      const r = entity.points[1].x;
      minX = Math.min(minX, entity.points[0].x - r);
      minY = Math.min(minY, entity.points[0].y - r);
      maxX = Math.max(maxX, entity.points[0].x + r);
      maxY = Math.max(maxY, entity.points[0].y + r);
    }

    // Handle arc radius
    if (entity.type === "arc" && entity.points.length >= 2) {
      const r = entity.points[1].x;
      minX = Math.min(minX, entity.points[0].x - r);
      minY = Math.min(minY, entity.points[0].y - r);
      maxX = Math.max(maxX, entity.points[0].x + r);
      maxY = Math.max(maxY, entity.points[0].y + r);
    }

    // Handle ellipse
    if (entity.type === "ellipse" && entity.points.length >= 1) {
      const rx = entity.radiusX ?? 50;
      const ry = entity.radiusY ?? 30;
      minX = Math.min(minX, entity.points[0].x - rx);
      minY = Math.min(minY, entity.points[0].y - ry);
      maxX = Math.max(maxX, entity.points[0].x + rx);
      maxY = Math.max(maxY, entity.points[0].y + ry);
    }

    // Handle DIMENSION entity bounds - FULL geometry including:
    // - Extension lines (from base points to dim line with offset)
    // - Dimension line itself
    // - Arrow marker extents
    // - Text bounding box
    if (entity.type === "dimension") {
      const dim = entity as unknown as {
        point1: Point;
        point2: Point;
        offset: number;
        direction?: "horizontal" | "vertical" | "aligned" | "auto";
        style?: {
          textHeight?: number;
          arrowSize?: number;
          extensionOvershoot?: number;
        };
      };

      if (dim.point1 && dim.point2) {
        const offset = dim.offset ?? 100;
        const direction = dim.direction ?? "aligned";

        // Calculate dimension length for proportional fallbacks
        const dimLength = Math.sqrt(
          (dim.point2.x - dim.point1.x) ** 2 +
            (dim.point2.y - dim.point1.y) ** 2,
        );

        // Use style values or proportional fallbacks (same as dimensionToSVGWorld)
        const textHeight =
          dim.style?.textHeight && dim.style.textHeight > 5
            ? dim.style.textHeight
            : Math.max(15, dimLength * 0.035);
        const arrowSize =
          dim.style?.arrowSize && dim.style.arrowSize > 3
            ? dim.style.arrowSize
            : Math.max(8, dimLength * 0.025);
        const extensionOvershoot =
          dim.style?.extensionOvershoot ?? Math.max(5, arrowSize * 0.3);

        // Base points
        minX = Math.min(minX, dim.point1.x, dim.point2.x);
        minY = Math.min(minY, dim.point1.y, dim.point2.y);
        maxX = Math.max(maxX, dim.point1.x, dim.point2.x);
        maxY = Math.max(maxY, dim.point1.y, dim.point2.y);

        // Calculate dimension line endpoints
        let dimP1: Point, dimP2: Point;
        if (direction === "horizontal") {
          const midY = (dim.point1.y + dim.point2.y) / 2;
          const dimLineY = midY + offset;
          dimP1 = { x: dim.point1.x, y: dimLineY };
          dimP2 = { x: dim.point2.x, y: dimLineY };
        } else if (direction === "vertical") {
          const midX = (dim.point1.x + dim.point2.x) / 2;
          const dimLineX = midX + offset;
          dimP1 = { x: dimLineX, y: dim.point1.y };
          dimP2 = { x: dimLineX, y: dim.point2.y };
        } else {
          // Aligned
          const dx = dim.point2.x - dim.point1.x;
          const dy = dim.point2.y - dim.point1.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const perpX = length > 0 ? -dy / length : 0;
          const perpY = length > 0 ? dx / length : 0;
          dimP1 = {
            x: dim.point1.x + perpX * offset,
            y: dim.point1.y + perpY * offset,
          };
          dimP2 = {
            x: dim.point2.x + perpX * offset,
            y: dim.point2.y + perpY * offset,
          };
        }

        // Dimension line points + overshoot
        const overshoot = extensionOvershoot;
        minX = Math.min(minX, dimP1.x - overshoot, dimP2.x - overshoot);
        minY = Math.min(minY, dimP1.y - overshoot, dimP2.y - overshoot);
        maxX = Math.max(maxX, dimP1.x + overshoot, dimP2.x + overshoot);
        maxY = Math.max(maxY, dimP1.y + overshoot, dimP2.y + overshoot);

        // Arrow extents (arrows at dim line endpoints)
        minX = Math.min(minX, dimP1.x - arrowSize, dimP2.x - arrowSize);
        minY = Math.min(minY, dimP1.y - arrowSize, dimP2.y - arrowSize);
        maxX = Math.max(maxX, dimP1.x + arrowSize, dimP2.x + arrowSize);
        maxY = Math.max(maxY, dimP1.y + arrowSize, dimP2.y + arrowSize);

        // Text bounding box (centered on dim line)
        const textMidX = (dimP1.x + dimP2.x) / 2;
        const textMidY = (dimP1.y + dimP2.y) / 2;
        const _dimLength = Math.sqrt(
          (dim.point2.x - dim.point1.x) ** 2 +
            (dim.point2.y - dim.point1.y) ** 2,
        );
        // Estimate text width: ~0.6 * fontSize * numChars (assume 8 chars for value)
        const textWidth = textHeight * 0.6 * 8;
        const textPadding = textHeight * 0.5;

        minX = Math.min(minX, textMidX - textWidth / 2 - textPadding);
        minY = Math.min(minY, textMidY - textHeight - textPadding);
        maxX = Math.max(maxX, textMidX + textWidth / 2 + textPadding);
        maxY = Math.max(maxY, textMidY + textHeight + textPadding);
      }
      continue;
    }
  }

  // Fallback if no valid bounds found
  if (
    !isFinite(minX) ||
    !isFinite(minY) ||
    !isFinite(maxX) ||
    !isFinite(maxY)
  ) {
    return { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } };
  }

  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

/**
 * Calculate bounds with EXPLICIT text/arrow sizes (for DIM)
 * Used after we know the drawing size to calculate appropriate DIM sizes
 */
export function calculateBoundsWithDimSizes(
  entities: CadEntity[],
  dimTextHeightMm: number,
  dimArrowSizeMm: number,
): { min: Point; max: Point } {
  if (entities.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const entity of entities) {
    if (entity.visible === false) continue;

    // Handle TEXT entity bounds
    if (entity.type === "text" && entity.text && entity.points.length > 0) {
      const pos = entity.points[0];
      const effectiveFontSize =
        (entity.fontSize ?? 12) * (entity.textScale ?? 1);
      const lines = entity.text.split("\n");
      let maxLineWidth = 0;
      for (const line of lines) {
        const lineWidth = line.length * effectiveFontSize * 0.6;
        if (lineWidth > maxLineWidth) maxLineWidth = lineWidth;
      }
      const lineHeight = effectiveFontSize * 1.2;
      const padding = effectiveFontSize * 0.2;

      minX = Math.min(minX, pos.x - padding);
      minY = Math.min(minY, pos.y - lineHeight - padding);
      maxX = Math.max(maxX, pos.x + maxLineWidth + padding);
      maxY = Math.max(maxY, pos.y + (lines.length - 1) * lineHeight + padding);
      continue;
    }

    // Handle DIMENSION with EXPLICIT sizes
    if (entity.type === "dimension") {
      const dim = entity as unknown as {
        point1: Point;
        point2: Point;
        offset: number;
        direction?: "horizontal" | "vertical" | "aligned" | "auto";
      };

      if (dim.point1 && dim.point2) {
        const offset = dim.offset ?? 100;
        const direction = dim.direction ?? "aligned";
        const textHeight = dimTextHeightMm;
        const arrowSize = dimArrowSizeMm;
        const extensionOvershoot = Math.max(3, arrowSize * 0.4);

        // Base points
        minX = Math.min(minX, dim.point1.x, dim.point2.x);
        minY = Math.min(minY, dim.point1.y, dim.point2.y);
        maxX = Math.max(maxX, dim.point1.x, dim.point2.x);
        maxY = Math.max(maxY, dim.point1.y, dim.point2.y);

        // Dimension line endpoints
        let dimP1: Point, dimP2: Point;
        if (direction === "horizontal") {
          const midY = (dim.point1.y + dim.point2.y) / 2;
          const dimLineY = midY + offset;
          dimP1 = { x: dim.point1.x, y: dimLineY };
          dimP2 = { x: dim.point2.x, y: dimLineY };
        } else if (direction === "vertical") {
          const midX = (dim.point1.x + dim.point2.x) / 2;
          const dimLineX = midX + offset;
          dimP1 = { x: dimLineX, y: dim.point1.y };
          dimP2 = { x: dimLineX, y: dim.point2.y };
        } else {
          const dx = dim.point2.x - dim.point1.x;
          const dy = dim.point2.y - dim.point1.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const perpX = length > 0 ? -dy / length : 0;
          const perpY = length > 0 ? dx / length : 0;
          dimP1 = {
            x: dim.point1.x + perpX * offset,
            y: dim.point1.y + perpY * offset,
          };
          dimP2 = {
            x: dim.point2.x + perpX * offset,
            y: dim.point2.y + perpY * offset,
          };
        }

        // Include dim line + extension overshoot
        minX = Math.min(
          minX,
          dimP1.x - extensionOvershoot,
          dimP2.x - extensionOvershoot,
        );
        minY = Math.min(
          minY,
          dimP1.y - extensionOvershoot,
          dimP2.y - extensionOvershoot,
        );
        maxX = Math.max(
          maxX,
          dimP1.x + extensionOvershoot,
          dimP2.x + extensionOvershoot,
        );
        maxY = Math.max(
          maxY,
          dimP1.y + extensionOvershoot,
          dimP2.y + extensionOvershoot,
        );

        // Arrow extents
        minX = Math.min(minX, dimP1.x - arrowSize, dimP2.x - arrowSize);
        minY = Math.min(minY, dimP1.y - arrowSize, dimP2.y - arrowSize);
        maxX = Math.max(maxX, dimP1.x + arrowSize, dimP2.x + arrowSize);
        maxY = Math.max(maxY, dimP1.y + arrowSize, dimP2.y + arrowSize);

        // Text bbox
        const textMidX = (dimP1.x + dimP2.x) / 2;
        const textMidY = (dimP1.y + dimP2.y) / 2;
        const textWidth = textHeight * 0.6 * 10; // ~10 chars
        const textPadding = textHeight * 0.5;

        minX = Math.min(minX, textMidX - textWidth / 2 - textPadding);
        minY = Math.min(minY, textMidY - textHeight - textPadding);
        maxX = Math.max(maxX, textMidX + textWidth / 2 + textPadding);
        maxY = Math.max(maxY, textMidY + textHeight + textPadding);
      }
      continue;
    }

    // Handle other entity points
    for (const point of entity.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    // Circle, arc, ellipse bounds
    if (entity.type === "circle" && entity.points.length >= 2) {
      const r = entity.points[1].x;
      minX = Math.min(minX, entity.points[0].x - r);
      minY = Math.min(minY, entity.points[0].y - r);
      maxX = Math.max(maxX, entity.points[0].x + r);
      maxY = Math.max(maxY, entity.points[0].y + r);
    }
    if (entity.type === "arc" && entity.points.length >= 2) {
      const r = entity.points[1].x;
      minX = Math.min(minX, entity.points[0].x - r);
      minY = Math.min(minY, entity.points[0].y - r);
      maxX = Math.max(maxX, entity.points[0].x + r);
      maxY = Math.max(maxY, entity.points[0].y + r);
    }
    if (entity.type === "ellipse" && entity.points.length >= 1) {
      const rx = entity.radiusX ?? 50;
      const ry = entity.radiusY ?? 30;
      minX = Math.min(minX, entity.points[0].x - rx);
      minY = Math.min(minY, entity.points[0].y - ry);
      maxX = Math.max(maxX, entity.points[0].x + rx);
      maxY = Math.max(maxY, entity.points[0].y + ry);
    }
  }

  if (
    !isFinite(minX) ||
    !isFinite(minY) ||
    !isFinite(maxX) ||
    !isFinite(maxY)
  ) {
    return { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } };
  }

  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

// ==================== Download Helper ====================

export function downloadFile(data: string | Blob, filename: string): void {
  const blob =
    typeof data === "string" ? new Blob([data], { type: "text/plain" }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
