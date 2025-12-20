/**
 * dimensionRenderer.ts
 * Dimension rendering utilities - pure functions for dimension drawing
 */

import type { DimensionEntity, DimensionGrip } from "./dimensionUtils";
import { calcDimensionLinePoints, getDimensionGrips } from "./dimensionUtils";

/**
 * World to screen transformation function type
 */
type WorldToScreen = (x: number, y: number) => { x: number; y: number };

/**
 * Render context for dimensions
 */
interface DimensionRenderContext {
  ctx: CanvasRenderingContext2D;
  worldToScreen: WorldToScreen;
  selectedDimensionIds: string[];
  hoveredDimensionId: string | null;
  hoveredGrip: DimensionGrip | null;
}

/**
 * Draw a grip point at the specified position
 */
function drawGripPoint(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  type: string,
  isHovered: boolean
): void {
  ctx.fillStyle = isHovered ? "#ff6600" : "#00bfff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  const size = 6;

  if (type === "text") {
    // Diamond grip for text/offset adjustment
    ctx.beginPath();
    const dSize = 7;
    ctx.moveTo(pos.x, pos.y - dSize);
    ctx.lineTo(pos.x + dSize, pos.y);
    ctx.lineTo(pos.x, pos.y + dSize);
    ctx.lineTo(pos.x - dSize, pos.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Square grips for all other types
    ctx.fillRect(pos.x - size, pos.y - size, size * 2, size * 2);
    ctx.strokeRect(pos.x - size, pos.y - size, size * 2, size * 2);
  }
}

/**
 * Render radius or diameter dimension
 */
export function renderRadiusDiameterDimension(
  context: DimensionRenderContext,
  dim: DimensionEntity,
  isPreview: boolean = false
): void {
  const {
    ctx,
    worldToScreen,
    selectedDimensionIds,
    hoveredDimensionId,
    hoveredGrip,
  } = context;
  const isSelected = selectedDimensionIds.includes(dim.id);
  const isHovered = hoveredDimensionId === dim.id;

  // point1 = center, point2 = point on circle
  const center = worldToScreen(dim.point1.x, dim.point1.y);

  // Calculate radius and angle from dimension's point1 and point2
  const dx = dim.point2.x - dim.point1.x;
  const dy = dim.point2.y - dim.point1.y;
  const actualRadius = Math.sqrt(dx * dx + dy * dy);

  // Use dimension's point2 directly (allows resizing)
  const circlePoint = worldToScreen(dim.point2.x, dim.point2.y);

  // Screen angle (may be different due to coordinate system)
  const screenAngle = Math.atan2(
    circlePoint.y - center.y,
    circlePoint.x - center.x
  );

  // Determine color based on state
  let lineColor = dim.style.lineColor;
  let textColor = dim.style.textColor;
  let lineWidth = 1;

  if (isSelected) {
    lineColor = "#00bfff";
    textColor = "#00bfff";
    lineWidth = 2;
  } else if (isHovered) {
    lineColor = "#ffff00";
    textColor = "#ffff00";
    lineWidth = 1.5;
  }

  if (isPreview) {
    lineColor = lineColor + "80";
    textColor = textColor + "80";
  }

  ctx.strokeStyle = lineColor;
  ctx.fillStyle = textColor;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(isPreview ? [5, 5] : []);

  // Text preparation - use actualRadius for display value
  const value =
    dim.dimensionType === "diameter" ? actualRadius * 2 : actualRadius;
  const prefix = dim.dimensionType === "diameter" ? "⌀" : "R";
  const text = `${prefix}${value.toFixed(dim.style.precision)}${
    dim.style.showUnit ? dim.style.unit : ""
  }`;
  ctx.font = `${dim.style.textHeight}px ${dim.style.font}`;
  const textWidth = ctx.measureText(text).width;

  // AutoCAD style: leader extends beyond circle with horizontal tail
  const leaderExtend = 30;
  const horizontalTail = textWidth + 15;

  // Determine which side the text should be on (right or left)
  const isRightSide = Math.cos(screenAngle) >= 0;

  // Calculate leader points - AutoCAD style
  const extendPoint = {
    x: circlePoint.x + leaderExtend * Math.cos(screenAngle),
    y: circlePoint.y + leaderExtend * Math.sin(screenAngle),
  };

  const tailEnd = {
    x: isRightSide
      ? extendPoint.x + horizontalTail
      : extendPoint.x - horizontalTail,
    y: extendPoint.y,
  };

  if (dim.dimensionType === "diameter") {
    // Diameter: line goes through center
    const oppositePoint = {
      x: center.x - (circlePoint.x - center.x),
      y: center.y - (circlePoint.y - center.y),
    };
    ctx.beginPath();
    ctx.moveTo(oppositePoint.x, oppositePoint.y);
    ctx.lineTo(circlePoint.x, circlePoint.y);
    ctx.lineTo(extendPoint.x, extendPoint.y);
    ctx.lineTo(tailEnd.x, tailEnd.y);
    ctx.stroke();

    // Arrow at opposite point (pointing inward toward center)
    const arrowSize = dim.style.arrowSize;
    const angle2 = screenAngle + Math.PI;
    ctx.beginPath();
    ctx.moveTo(oppositePoint.x, oppositePoint.y);
    ctx.lineTo(
      oppositePoint.x - arrowSize * Math.cos(angle2 - Math.PI / 6),
      oppositePoint.y - arrowSize * Math.sin(angle2 - Math.PI / 6)
    );
    ctx.moveTo(oppositePoint.x, oppositePoint.y);
    ctx.lineTo(
      oppositePoint.x - arrowSize * Math.cos(angle2 + Math.PI / 6),
      oppositePoint.y - arrowSize * Math.sin(angle2 + Math.PI / 6)
    );
    ctx.stroke();
  } else {
    // Radius: line from circle point outward (AutoCAD style - no line to center)
    ctx.beginPath();
    ctx.moveTo(circlePoint.x, circlePoint.y);
    ctx.lineTo(extendPoint.x, extendPoint.y);
    ctx.lineTo(tailEnd.x, tailEnd.y);
    ctx.stroke();
  }

  // Arrow at circle point (pointing toward center) - AutoCAD style
  const arrowSize = dim.style.arrowSize;
  ctx.beginPath();
  ctx.moveTo(circlePoint.x, circlePoint.y);
  ctx.lineTo(
    circlePoint.x + arrowSize * Math.cos(screenAngle - Math.PI / 6),
    circlePoint.y + arrowSize * Math.sin(screenAngle - Math.PI / 6)
  );
  ctx.moveTo(circlePoint.x, circlePoint.y);
  ctx.lineTo(
    circlePoint.x + arrowSize * Math.cos(screenAngle + Math.PI / 6),
    circlePoint.y + arrowSize * Math.sin(screenAngle + Math.PI / 6)
  );
  ctx.stroke();

  // Text at the end of horizontal tail
  ctx.textAlign = isRightSide ? "left" : "right";
  ctx.textBaseline = "bottom";
  const textX = isRightSide ? extendPoint.x + 5 : extendPoint.x - 5;
  const textY = extendPoint.y - 3;
  ctx.fillText(text, textX, textY);

  ctx.setLineDash([]);

  // Draw grip points for selected radius/diameter dimensions
  if (isSelected && !isPreview) {
    const grips = getDimensionGrips(dim);
    grips.forEach((grip) => {
      const gripScreen = worldToScreen(grip.position.x, grip.position.y);
      const isHoveredGrip =
        hoveredGrip?.dimensionId === dim.id && hoveredGrip?.type === grip.type;
      drawGripPoint(ctx, gripScreen, grip.type, isHoveredGrip);
    });
  }
}

/**
 * Render linear dimension (horizontal, vertical, aligned)
 */
export function renderLinearDimension(
  context: DimensionRenderContext,
  dim: DimensionEntity,
  isPreview: boolean = false
): void {
  const {
    ctx,
    worldToScreen,
    selectedDimensionIds,
    hoveredDimensionId,
    hoveredGrip,
  } = context;
  const isSelected = selectedDimensionIds.includes(dim.id);
  const isHovered = hoveredDimensionId === dim.id;

  const p1 = worldToScreen(dim.point1.x, dim.point1.y);
  const p2 = worldToScreen(dim.point2.x, dim.point2.y);

  // Tính dimP1, dimP2 bằng world coords rồi chuyển sang screen
  const { dimP1: worldDimP1, dimP2: worldDimP2 } = calcDimensionLinePoints(dim);
  const dimP1 = worldToScreen(worldDimP1.x, worldDimP1.y);
  const dimP2 = worldToScreen(worldDimP2.x, worldDimP2.y);

  // Calculate dimension value
  const direction = dim.direction || "aligned";
  let dimValue: number;
  if (direction === "horizontal") {
    dimValue = Math.abs(dim.point2.x - dim.point1.x);
  } else if (direction === "vertical") {
    dimValue = Math.abs(dim.point2.y - dim.point1.y);
  } else {
    const dx = dim.point2.x - dim.point1.x;
    const dy = dim.point2.y - dim.point1.y;
    dimValue = Math.sqrt(dx * dx + dy * dy);
  }

  // Determine color based on state
  let lineColor = dim.style.lineColor;
  let textColor = dim.style.textColor;
  let lineWidth = 1;

  if (isSelected) {
    lineColor = "#00bfff";
    textColor = "#00bfff";
    lineWidth = 2;
  } else if (isHovered) {
    lineColor = "#ffff00";
    textColor = "#ffff00";
    lineWidth = 1.5;
  }

  if (isPreview) {
    lineColor = lineColor + "80";
    textColor = textColor + "80";
  }

  ctx.strokeStyle = lineColor;
  ctx.fillStyle = textColor;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(isPreview ? [5, 5] : []);

  // Extension lines
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(dimP1.x, dimP1.y);
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(dimP2.x, dimP2.y);
  ctx.stroke();

  // Dimension line
  ctx.beginPath();
  ctx.moveTo(dimP1.x, dimP1.y);
  ctx.lineTo(dimP2.x, dimP2.y);
  ctx.stroke();

  // Arrows
  const arrowSize = dim.style.arrowSize;
  const angle = Math.atan2(dimP2.y - dimP1.y, dimP2.x - dimP1.x);

  ctx.beginPath();
  ctx.moveTo(dimP1.x, dimP1.y);
  ctx.lineTo(
    dimP1.x + arrowSize * Math.cos(angle - Math.PI / 6),
    dimP1.y + arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(dimP1.x, dimP1.y);
  ctx.lineTo(
    dimP1.x + arrowSize * Math.cos(angle + Math.PI / 6),
    dimP1.y + arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(dimP2.x, dimP2.y);
  ctx.lineTo(
    dimP2.x - arrowSize * Math.cos(angle - Math.PI / 6),
    dimP2.y - arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(dimP2.x, dimP2.y);
  ctx.lineTo(
    dimP2.x - arrowSize * Math.cos(angle + Math.PI / 6),
    dimP2.y - arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();

  // Text
  const value = dim.value ?? dimValue;
  const text = `${dim.style.prefix}${value.toFixed(dim.style.precision)}${
    dim.style.showUnit ? dim.style.unit : ""
  }${dim.style.suffix}`;
  ctx.font = `${dim.style.textHeight}px ${dim.style.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const textX = (dimP1.x + dimP2.x) / 2;
  const textY = (dimP1.y + dimP2.y) / 2 - 5;
  ctx.fillText(text, textX, textY);

  ctx.setLineDash([]);

  // Draw grip points for selected dimensions
  if (isSelected && !isPreview) {
    const grips = getDimensionGrips(dim);
    grips.forEach((grip) => {
      const gripScreen = worldToScreen(grip.position.x, grip.position.y);
      const isHoveredGrip =
        hoveredGrip?.dimensionId === dim.id && hoveredGrip?.type === grip.type;
      drawGripPoint(ctx, gripScreen, grip.type, isHoveredGrip);
    });
  }
}

/**
 * Render any dimension type (dispatcher function)
 */
export function renderDimension(
  context: DimensionRenderContext,
  dim: DimensionEntity,
  isPreview: boolean = false
): void {
  if (dim.dimensionType === "radius" || dim.dimensionType === "diameter") {
    renderRadiusDiameterDimension(context, dim, isPreview);
  } else {
    renderLinearDimension(context, dim, isPreview);
  }
}

/**
 * Render all dimensions including previews
 */
export function renderAllDimensions(
  context: DimensionRenderContext,
  dimensions: DimensionEntity[],
  previewDimension: DimensionEntity | null,
  previewDimensions: DimensionEntity[] = []
): void {
  // Render existing dimensions
  dimensions.forEach((dim) => renderDimension(context, dim, false));

  // Render single preview dimension (DIM command)
  if (previewDimension) {
    renderDimension(context, previewDimension, true);
  }

  // QDIM preview dimensions (multiple dimensions)
  if (previewDimensions.length > 0) {
    previewDimensions.forEach((dim) => renderDimension(context, dim, true));
  }
}

// Re-export types for convenience
export type { DimensionRenderContext };
