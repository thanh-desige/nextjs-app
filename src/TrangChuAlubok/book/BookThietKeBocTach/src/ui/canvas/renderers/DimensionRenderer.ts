/**
 * DimensionRenderer - Renders dimension entities to canvas
 * Supports linear, aligned, angular, radius, diameter dimensions
 */

export interface Point {
  x: number;
  y: number;
}

export interface DimensionStyle {
  textHeight: number;
  arrowSize: number;
  extensionLineGap: number;
  extensionLineOffset: number;
  lineColor: string;
  textColor: string;
  font: string;
  precision: number;
  prefix?: string;
  suffix?: string;
  unit?: string;
  showUnit?: boolean;
}

export interface DimensionEntity {
  id: string;
  type: "dimension";
  dimensionType?: string;
  point1: Point;
  point2: Point;
  offset: number;
  value?: number;
  direction?: string;
  style: DimensionStyle;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  zoom: number;
}

/**
 * Convert world to screen coordinates
 */
function worldToScreen(
  point: Point,
  centerX: number,
  centerY: number,
  zoom: number
): Point {
  return {
    x: centerX + point.x * zoom,
    y: centerY - point.y * zoom,
  };
}

/**
 * Calculate dimension line points based on direction
 */
function calcDimensionLinePoints(dim: DimensionEntity): {
  dimP1: Point;
  dimP2: Point;
} {
  const direction = dim.direction || "aligned";
  const offset = dim.offset;

  if (direction === "horizontal") {
    const midY = (dim.point1.y + dim.point2.y) / 2;
    const dimLineY = midY + offset;
    return {
      dimP1: { x: dim.point1.x, y: dimLineY },
      dimP2: { x: dim.point2.x, y: dimLineY },
    };
  } else if (direction === "vertical") {
    const midX = (dim.point1.x + dim.point2.x) / 2;
    const dimLineX = midX + offset;
    return {
      dimP1: { x: dimLineX, y: dim.point1.y },
      dimP2: { x: dimLineX, y: dim.point2.y },
    };
  } else {
    // Aligned - perpendicular offset
    const dx = dim.point2.x - dim.point1.x;
    const dy = dim.point2.y - dim.point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = length > 0 ? -dy / length : 0;
    const perpY = length > 0 ? dx / length : 0;
    return {
      dimP1: {
        x: dim.point1.x + perpX * offset,
        y: dim.point1.y + perpY * offset,
      },
      dimP2: {
        x: dim.point2.x + perpX * offset,
        y: dim.point2.y + perpY * offset,
      },
    };
  }
}

/**
 * Draw an arrow at position pointing in direction
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  angle: number,
  size: number
): void {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, size / 3);
  ctx.lineTo(-size, -size / 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Render a dimension entity
 */
export function renderDimension(
  dim: DimensionEntity,
  context: RenderContext,
  options: {
    isSelected?: boolean;
    isHovered?: boolean;
    selectionColor?: string;
    hoverColor?: string;
  } = {}
): void {
  const { ctx, centerX, centerY, zoom } = context;
  const {
    isSelected,
    isHovered,
    selectionColor = "#00BFFF",
    hoverColor = "#FFD700",
  } = options;

  const { style } = dim;
  const { dimP1, dimP2 } = calcDimensionLinePoints(dim);

  // Convert to screen coordinates
  const screenP1 = worldToScreen(dim.point1, centerX, centerY, zoom);
  const screenP2 = worldToScreen(dim.point2, centerX, centerY, zoom);
  const screenDimP1 = worldToScreen(dimP1, centerX, centerY, zoom);
  const screenDimP2 = worldToScreen(dimP2, centerX, centerY, zoom);

  // Determine color
  let lineColor = style.lineColor;
  let textColor = style.textColor;
  if (isSelected) {
    lineColor = selectionColor;
    textColor = selectionColor;
  } else if (isHovered) {
    lineColor = hoverColor;
    textColor = hoverColor;
  }

  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.fillStyle = lineColor;
  ctx.lineWidth = 1;

  // Draw extension lines
  ctx.beginPath();
  ctx.moveTo(screenP1.x, screenP1.y);
  ctx.lineTo(screenDimP1.x, screenDimP1.y);
  ctx.moveTo(screenP2.x, screenP2.y);
  ctx.lineTo(screenDimP2.x, screenDimP2.y);
  ctx.stroke();

  // Draw dimension line
  ctx.beginPath();
  ctx.moveTo(screenDimP1.x, screenDimP1.y);
  ctx.lineTo(screenDimP2.x, screenDimP2.y);
  ctx.stroke();

  // Calculate dimension line angle
  const dx = screenDimP2.x - screenDimP1.x;
  const dy = screenDimP2.y - screenDimP1.y;
  const angle = Math.atan2(dy, dx);
  const arrowSize = style.arrowSize * zoom;

  // Draw arrows
  drawArrow(ctx, screenDimP1, angle, arrowSize);
  drawArrow(ctx, screenDimP2, angle + Math.PI, arrowSize);

  // Calculate and draw text
  const distance =
    dim.value ??
    Math.sqrt(
      Math.pow(dim.point2.x - dim.point1.x, 2) +
        Math.pow(dim.point2.y - dim.point1.y, 2)
    );

  let text = distance.toFixed(style.precision);
  if (style.prefix) text = style.prefix + text;
  if (style.suffix) text = text + style.suffix;
  if (style.showUnit && style.unit) text = text + " " + style.unit;

  const textX = (screenDimP1.x + screenDimP2.x) / 2;
  const textY = (screenDimP1.y + screenDimP2.y) / 2;
  const fontSize = Math.max(8, style.textHeight * zoom);

  ctx.font = `${fontSize}px ${style.font}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  // Rotate text to align with dimension line if needed
  ctx.save();
  ctx.translate(textX, textY);
  // Keep text readable (not upside down)
  let textAngle = angle;
  if (textAngle > Math.PI / 2) textAngle -= Math.PI;
  if (textAngle < -Math.PI / 2) textAngle += Math.PI;
  ctx.rotate(textAngle);
  ctx.fillText(text, 0, -4);
  ctx.restore();

  ctx.restore();
}

/**
 * Render multiple dimensions
 */
export function renderDimensions(
  dimensions: DimensionEntity[],
  context: RenderContext,
  selectedIds: Set<string>,
  hoveredId: string | null
): void {
  for (const dim of dimensions) {
    renderDimension(dim, context, {
      isSelected: selectedIds.has(dim.id),
      isHovered: dim.id === hoveredId,
    });
  }
}

/**
 * Render dimension grips for selected dimensions
 */
export function renderDimensionGrips(
  dimensions: DimensionEntity[],
  context: RenderContext,
  gripSize: number = 6
): void {
  const { ctx, centerX, centerY, zoom } = context;

  for (const dim of dimensions) {
    const { dimP1, dimP2 } = calcDimensionLinePoints(dim);

    // Grip points
    const grips = [
      dim.point1,
      dim.point2,
      dimP1,
      dimP2,
      { x: (dimP1.x + dimP2.x) / 2, y: (dimP1.y + dimP2.y) / 2 }, // text/center grip
    ];

    for (const grip of grips) {
      const screenPos = worldToScreen(grip, centerX, centerY, zoom);
      ctx.fillStyle = "#00BFFF";
      ctx.fillRect(
        screenPos.x - gripSize / 2,
        screenPos.y - gripSize / 2,
        gripSize,
        gripSize
      );
    }
  }
}
