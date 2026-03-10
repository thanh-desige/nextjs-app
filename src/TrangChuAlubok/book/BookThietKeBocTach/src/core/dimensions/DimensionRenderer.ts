/**
 * DimensionRenderer.ts
 *
 * STEP-5.10: Extracted from DimensionManager.ts
 * Canvas2D rendering logic for all dimension types.
 * Stateless — receives all data via parameters.
 */

import type { Point, DimensionEntity } from "./dimension.types";
import { calculateDistance, calculateAngle, formatValue } from "./dimensionGeometry";

// ============================================
// PRIVATE HELPERS
// ============================================

function transformPoint(
  p: Point,
  offsetX: number,
  offsetY: number,
  scale: number,
): Point {
  return {
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
  };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  tip: Point,
  direction: Point,
  size: number,
): void {
  const angle = Math.PI / 6; // 30 degrees

  const p1 = {
    x:
      tip.x +
      size * (direction.x * Math.cos(angle) - direction.y * Math.sin(angle)),
    y:
      tip.y +
      size * (direction.x * Math.sin(angle) + direction.y * Math.cos(angle)),
  };
  const p2 = {
    x:
      tip.x +
      size *
        (direction.x * Math.cos(-angle) - direction.y * Math.sin(-angle)),
    y:
      tip.y +
      size *
        (direction.x * Math.sin(-angle) + direction.y * Math.cos(-angle)),
  };

  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

// ============================================
// RENDER DISPATCH
// ============================================

/**
 * Vẽ dimension lên canvas
 * @param dimensionScale - The DimensionManager's unit scale (NOT the viewport scale)
 */
export function renderDimension(
  ctx: CanvasRenderingContext2D,
  dimension: DimensionEntity,
  viewTransform: { offsetX: number; offsetY: number; scale: number },
  dimensionScale: number = 1,
): void {
  ctx.save();

  const { offsetX, offsetY, scale } = viewTransform;
  const style = dimension.style;

  ctx.strokeStyle = style.lineColor;
  ctx.fillStyle = style.textColor;
  ctx.font = `${style.textHeight}px ${style.font}`;
  ctx.lineWidth = 1;

  switch (dimension.dimensionType) {
    case "linear":
    case "aligned":
    case "horizontal":
    case "vertical":
    case "baseline":
    case "continue":
      renderLinearDimension(ctx, dimension, offsetX, offsetY, scale, dimensionScale);
      break;
    case "arc":
      renderArcDimension(ctx, dimension, offsetX, offsetY, scale, dimensionScale);
      break;
    case "angular":
      renderAngularDimension(ctx, dimension, offsetX, offsetY, scale);
      break;
    case "radius":
      renderRadiusDimension(ctx, dimension, offsetX, offsetY, scale, dimensionScale);
      break;
    case "diameter":
      renderDiameterDimension(ctx, dimension, offsetX, offsetY, scale, dimensionScale);
      break;
  }

  ctx.restore();
}

// ============================================
// LINEAR DIMENSION
// ============================================

function renderLinearDimension(
  ctx: CanvasRenderingContext2D,
  dim: DimensionEntity,
  offsetX: number,
  offsetY: number,
  scale: number,
  dimensionScale: number,
): void {
  const style = dim.style;
  const p1 = transformPoint(dim.point1, offsetX, offsetY, scale);
  const p2 = transformPoint(dim.point2, offsetX, offsetY, scale);

  // Determine dimension direction
  const direction = dim.direction || "aligned";

  let d1: Point, d2: Point;
  let dimLineAngle: number;
  let dimValue: number;
  const offset = dim.offset * scale;

  if (direction === "horizontal") {
    // HORIZONTAL DIMENSION - đo khoảng cách theo X
    let dimLineY: number;
    if (dim.dimLinePosition !== undefined) {
      dimLineY = dim.dimLinePosition * scale + offsetY;
    } else {
      const midY = (p1.y + p2.y) / 2;
      dimLineY = midY + offset;
    }

    d1 = { x: p1.x, y: dimLineY };
    d2 = { x: p2.x, y: dimLineY };
    dimLineAngle = 0;
    dimValue = Math.abs(dim.point2.x - dim.point1.x) / dimensionScale;
  } else if (direction === "vertical") {
    // VERTICAL DIMENSION - đo khoảng cách theo Y
    let dimLineX: number;
    if (dim.dimLinePosition !== undefined) {
      dimLineX = dim.dimLinePosition * scale + offsetX;
    } else {
      const midX = (p1.x + p2.x) / 2;
      dimLineX = midX + offset;
    }

    d1 = { x: dimLineX, y: p1.y };
    d2 = { x: dimLineX, y: p2.y };
    dimLineAngle = Math.PI / 2;
    dimValue = Math.abs(dim.point2.y - dim.point1.y) / dimensionScale;
  } else {
    // Aligned dimension
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      ctx.restore();
      return;
    }

    const nx = -dy / length;
    const ny = dx / length;
    const alignedOffset = dim.offset * scale;

    d1 = { x: p1.x + nx * alignedOffset, y: p1.y + ny * alignedOffset };
    d2 = { x: p2.x + nx * alignedOffset, y: p2.y + ny * alignedOffset };
    dimLineAngle = Math.atan2(dy, dx);
    dimValue = calculateDistance(dim.point1, dim.point2, dimensionScale);
  }

  // Extension lines
  const gap = style.extensionLineGap * scale;
  const ext = style.extensionLineOffset * scale;

  ctx.beginPath();

  if (direction === "horizontal") {
    if (!style.suppressExtLine1) {
      const dir1 = d1.y > p1.y ? 1 : -1;
      ctx.moveTo(p1.x, p1.y + gap * dir1);
      ctx.lineTo(d1.x, d1.y + ext * dir1);
    }
    if (!style.suppressExtLine2) {
      const dir2 = d2.y > p2.y ? 1 : -1;
      ctx.moveTo(p2.x, p2.y + gap * dir2);
      ctx.lineTo(d2.x, d2.y + ext * dir2);
    }
  } else if (direction === "vertical") {
    if (!style.suppressExtLine1) {
      const dir1 = d1.x > p1.x ? 1 : -1;
      ctx.moveTo(p1.x + gap * dir1, p1.y);
      ctx.lineTo(d1.x + ext * dir1, d1.y);
    }
    if (!style.suppressExtLine2) {
      const dir2 = d2.x > p2.x ? 1 : -1;
      ctx.moveTo(p2.x + gap * dir2, p2.y);
      ctx.lineTo(d2.x + ext * dir2, d2.y);
    }
  } else {
    // Extension lines for aligned
    const dx = d2.x - d1.x;
    const dy = d2.y - d1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      const nx = -dy / length;
      const ny = dx / length;

      if (!style.suppressExtLine1) {
        ctx.moveTo(p1.x + nx * gap, p1.y + ny * gap);
        ctx.lineTo(d1.x + nx * ext, d1.y + ny * ext);
      }
      if (!style.suppressExtLine2) {
        ctx.moveTo(p2.x + nx * gap, p2.y + ny * gap);
        ctx.lineTo(d2.x + nx * ext, d2.y + ny * ext);
      }
    }
  }

  // Dimension line
  ctx.moveTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.stroke();

  // Arrows
  const arrowDx = d2.x - d1.x;
  const arrowDy = d2.y - d1.y;
  const arrowLen = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);

  if (arrowLen > 0) {
    drawArrow(
      ctx,
      d1,
      { x: arrowDx / arrowLen, y: arrowDy / arrowLen },
      style.arrowSize * scale,
    );
    drawArrow(
      ctx,
      d2,
      { x: -arrowDx / arrowLen, y: -arrowDy / arrowLen },
      style.arrowSize * scale,
    );
  }

  // Text
  const value = dim.value ?? dimValue;
  const text = dim.textOverride || formatValue(value, style);
  const midX = (d1.x + d2.x) / 2 + (style.textOffset?.x || 0);
  const midY = (d1.y + d2.y) / 2 + (style.textOffset?.y || 0);

  ctx.save();
  ctx.translate(midX, midY);

  // Rotate text to align with dimension line
  let textAngle = dimLineAngle;
  if (style.textRotation) {
    textAngle = style.textRotation * (Math.PI / 180);
  } else if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
    textAngle += Math.PI;
  }
  ctx.rotate(textAngle);

  ctx.textAlign = "center";
  ctx.textBaseline = style.textPosition === "above" ? "bottom" : "middle";
  const textOffset = style.textPosition === "above" ? -4 : 0;
  ctx.fillText(text, 0, textOffset);
  ctx.restore();
}

// ============================================
// ARC DIMENSION
// ============================================

function renderArcDimension(
  ctx: CanvasRenderingContext2D,
  dim: DimensionEntity,
  offsetX: number,
  offsetY: number,
  scale: number,
  _dimensionScale: number,
): void {
  if (!dim.point3) return;

  const style = dim.style;
  const p1 = transformPoint(dim.point1, offsetX, offsetY, scale);
  const p2 = transformPoint(dim.point2, offsetX, offsetY, scale);
  const center = transformPoint(dim.point3, offsetX, offsetY, scale);

  // Calculate arc parameters
  const r1 = Math.sqrt(
    Math.pow(p1.x - center.x, 2) + Math.pow(p1.y - center.y, 2),
  );
  const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
  const endAngle = Math.atan2(p2.y - center.y, p2.x - center.x);

  // Dimension arc radius (offset from original arc)
  const dimRadius = r1 + dim.offset * scale;

  // Draw dimension arc
  ctx.beginPath();
  ctx.arc(center.x, center.y, dimRadius, startAngle, endAngle);
  ctx.stroke();

  // Extension lines
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(
    center.x + dimRadius * 1.05 * Math.cos(startAngle),
    center.y + dimRadius * 1.05 * Math.sin(startAngle),
  );
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(
    center.x + dimRadius * 1.05 * Math.cos(endAngle),
    center.y + dimRadius * 1.05 * Math.sin(endAngle),
  );
  ctx.stroke();

  // Text - arc length
  const arcLength = dim.value ?? 0;
  const text = dim.textOverride || `⌒${formatValue(arcLength, style)}`;
  const midAngle = (startAngle + endAngle) / 2;
  const textRadius = dimRadius + style.textHeight;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    text,
    center.x + textRadius * Math.cos(midAngle),
    center.y + textRadius * Math.sin(midAngle),
  );
}

// ============================================
// ANGULAR DIMENSION
// ============================================

function renderAngularDimension(
  ctx: CanvasRenderingContext2D,
  dim: DimensionEntity,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  if (!dim.point3) return;

  const style = dim.style;
  const center = transformPoint(dim.point1, offsetX, offsetY, scale);
  const p1 = transformPoint(dim.point2, offsetX, offsetY, scale);
  const p2 = transformPoint(dim.point3, offsetX, offsetY, scale);

  const radius = dim.offset * scale;
  const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
  const endAngle = Math.atan2(p2.y - center.y, p2.x - center.x);

  // Draw arc
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, startAngle, endAngle);
  ctx.stroke();

  // Extension lines
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(
    center.x + radius * 1.1 * Math.cos(startAngle),
    center.y + radius * 1.1 * Math.sin(startAngle),
  );
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(
    center.x + radius * 1.1 * Math.cos(endAngle),
    center.y + radius * 1.1 * Math.sin(endAngle),
  );
  ctx.stroke();

  // Text
  const angle =
    dim.value ?? calculateAngle(dim.point1, dim.point2, dim.point3);
  const text = `${angle.toFixed(style.precision)}°`;
  const midAngle = (startAngle + endAngle) / 2;
  const textRadius = radius + style.textHeight;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    text,
    center.x + textRadius * Math.cos(midAngle),
    center.y + textRadius * Math.sin(midAngle),
  );
}

// ============================================
// RADIUS DIMENSION
// ============================================

function renderRadiusDimension(
  ctx: CanvasRenderingContext2D,
  dim: DimensionEntity,
  offsetX: number,
  offsetY: number,
  scale: number,
  dimensionScale: number,
): void {
  const style = dim.style;
  const center = transformPoint(dim.point1, offsetX, offsetY, scale);
  const end = transformPoint(dim.point2, offsetX, offsetY, scale);

  // Leader line
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Arrow at end
  const dx = end.x - center.x;
  const dy = end.y - center.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  drawArrow(
    ctx,
    end,
    { x: -dx / length, y: -dy / length },
    style.arrowSize * scale,
  );

  // Text
  const radius = dim.value ?? calculateDistance(dim.point1, dim.point2, dimensionScale);
  const text = `R${formatValue(radius, style)}`;

  const midX = (center.x + end.x) / 2;
  const midY = (center.y + end.y) / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, midX, midY - 4);
}

// ============================================
// DIAMETER DIMENSION
// ============================================

function renderDiameterDimension(
  ctx: CanvasRenderingContext2D,
  dim: DimensionEntity,
  offsetX: number,
  offsetY: number,
  scale: number,
  dimensionScale: number,
): void {
  const style = dim.style;
  const p1 = transformPoint(dim.point1, offsetX, offsetY, scale);
  const p2 = transformPoint(dim.point2, offsetX, offsetY, scale);

  // Diameter line
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Arrows at both ends
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  drawArrow(
    ctx,
    p1,
    { x: dx / length, y: dy / length },
    style.arrowSize * scale,
  );
  drawArrow(
    ctx,
    p2,
    { x: -dx / length, y: -dy / length },
    style.arrowSize * scale,
  );

  // Text
  const diameter =
    dim.value ?? calculateDistance(dim.point1, dim.point2, dimensionScale);
  const text = `⌀${formatValue(diameter, style)}`;

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  ctx.save();
  ctx.translate(midX, midY);
  const angle = Math.atan2(dy, dx);
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    ctx.rotate(angle + Math.PI);
  } else {
    ctx.rotate(angle);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, 0, -4);
  ctx.restore();
}
