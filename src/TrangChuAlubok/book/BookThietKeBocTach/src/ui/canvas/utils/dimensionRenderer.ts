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
  /** Current zoom level */
  zoom?: number;
  /** Dimension scale: 0 = auto (scale with zoom), or fixed values like 5, 10, 15, 20 */
  dimScale?: number;
  /** Dimension rounding: true = round to 0 decimals, false = show 2 decimals */
  dimRounding?: boolean;
  /** Dimension show unit: true = show mm, false = hide mm */
  dimShowUnit?: boolean;
  /** Dimension text color */
  dimTextColor?: string;
  /** Dimension line color */
  dimLineColor?: string;
  /** Dimension lineweight in mm (0.18=Thin, 0.25=Normal, 0.35=Thick) */
  dimLineweight?: number;
  /** Dimension extension gap: true = 3mm gap at extension line start, false = no gap */
  dimExtensionGap?: boolean;
  /** Dimension arrow style */
  dimArrowStyle?: "closed" | "open" | "tick" | "dot" | "none";
}

/**
 * Arrow style type
 */
type ArrowStyle = "closed" | "open" | "tick" | "dot" | "none";

/**
 * Draw an arrow at the specified position with the given style
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  style: ArrowStyle,
  inward: boolean = true
): void {
  if (style === "none") return;

  const direction = inward ? 1 : -1;

  switch (style) {
    case "closed":
      // Filled arrow (closed)
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + direction * size * Math.cos(angle - Math.PI / 6),
        y + direction * size * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        x + direction * size * Math.cos(angle + Math.PI / 6),
        y + direction * size * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
      break;

    case "open":
      // Open arrow (just lines)
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + direction * size * Math.cos(angle - Math.PI / 6),
        y + direction * size * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + direction * size * Math.cos(angle + Math.PI / 6),
        y + direction * size * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      break;

    case "tick":
      // Oblique tick mark (45 degrees)
      const tickAngle = angle + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(
        x - size * 0.5 * Math.cos(tickAngle),
        y - size * 0.5 * Math.sin(tickAngle)
      );
      ctx.lineTo(
        x + size * 0.5 * Math.cos(tickAngle),
        y + size * 0.5 * Math.sin(tickAngle)
      );
      ctx.stroke();
      break;

    case "dot":
      // Filled circle/dot
      ctx.beginPath();
      ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
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
 * Render arc dimension (arc length)
 * AutoCAD style: arc with arrows at ends, text showing arc length
 */
export function renderArcDimension(
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
    zoom = 1,
    dimScale = 0,
    dimRounding = true,
    dimShowUnit = false,
    dimTextColor = "#00ff00",
    dimLineColor = "#00ff00",
    dimLineweight = 0.25,
    dimArrowStyle = "closed",
  } = context;
  const isSelected = selectedDimensionIds.includes(dim.id);
  const isHovered = hoveredDimensionId === dim.id;

  // Scale factor for dimension elements (text, arrows)
  const scaleFactor = dimScale === 0 ? 1 : zoom * (dimScale / 10);

  // point1 = start point of arc
  // point2 = end point of arc
  // point3 = center of arc
  if (!dim.point1 || !dim.point2 || !dim.point3) return;

  const startPt = worldToScreen(dim.point1.x, dim.point1.y);
  const endPt = worldToScreen(dim.point2.x, dim.point2.y);
  const center = worldToScreen(dim.point3.x, dim.point3.y);

  // Calculate angles and radius in screen coords
  const angle1 = Math.atan2(startPt.y - center.y, startPt.x - center.x);
  const angle2 = Math.atan2(endPt.y - center.y, endPt.x - center.x);
  const baseRadius = Math.sqrt(
    (startPt.x - center.x) ** 2 + (startPt.y - center.y) ** 2
  );

  // Offset the arc outward (dim line is outside the original arc)
  const offsetScreen = (dim.offset || 20) * zoom;
  const arcRadius = baseRadius + offsetScreen;

  // Calculate sweep angle
  let sweepAngle = angle2 - angle1;
  if (sweepAngle < 0) sweepAngle += 2 * Math.PI;

  // Determine color based on state
  let lineColor = dimLineColor;
  let textColor = dimTextColor;
  // Canvas: fixed lineWidth (1px normal, 1.5px selected, 1.2px hovered)
  // dimLineweight setting only affects SVG export
  let lineWidth = 1;

  if (isSelected) {
    lineColor = "#00bfff";
    textColor = "#00bfff";
    lineWidth = 1.5;
  } else if (isHovered) {
    lineColor = "#ffff00";
    textColor = "#ffff00";
    lineWidth = 1.2;
  }

  if (isPreview) {
    lineColor = lineColor + "80";
    textColor = textColor + "80";
  }

  ctx.strokeStyle = lineColor;
  ctx.fillStyle = textColor;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(isPreview ? [5, 5] : []);

  // Draw extension lines from original arc to dimension arc
  const ext1End = {
    x: center.x + arcRadius * Math.cos(angle1),
    y: center.y + arcRadius * Math.sin(angle1),
  };
  const ext2End = {
    x: center.x + arcRadius * Math.cos(angle2),
    y: center.y + arcRadius * Math.sin(angle2),
  };

  ctx.beginPath();
  ctx.moveTo(startPt.x, startPt.y);
  ctx.lineTo(ext1End.x, ext1End.y);
  ctx.moveTo(endPt.x, endPt.y);
  ctx.lineTo(ext2End.x, ext2End.y);
  ctx.stroke();

  // Draw the dimension arc
  ctx.beginPath();
  ctx.arc(center.x, center.y, arcRadius, angle1, angle2, false);
  ctx.stroke();

  // Draw arrows at arc ends
  const arrowSize = (dim.style?.arrowSize || 10) * scaleFactor;

  // Arrow at start - tangent to arc
  const tangent1 = angle1 + Math.PI / 2;
  drawArrow(
    ctx,
    ext1End.x,
    ext1End.y,
    tangent1,
    arrowSize,
    dimArrowStyle,
    true
  );

  // Arrow at end - tangent to arc (pointing inward)
  const tangent2 = angle2 - Math.PI / 2;
  drawArrow(
    ctx,
    ext2End.x,
    ext2End.y,
    tangent2,
    arrowSize,
    dimArrowStyle,
    true
  );

  // Text at middle of arc - show arc length
  const midAngle = angle1 + sweepAngle / 2;
  const textRadius = arcRadius + 15 * scaleFactor;
  const textX = center.x + textRadius * Math.cos(midAngle);
  const textY = center.y + textRadius * Math.sin(midAngle);

  // Arc length value (pre-calculated in createArcDimension)
  const arcLength = dim.value || 0;
  const precision = dimRounding ? 0 : 2;
  const text = `⌒${arcLength.toFixed(precision)}${dimShowUnit ? "mm" : ""}`;
  const textHeight = (dim.style?.textHeight || 12) * scaleFactor;
  ctx.font = `${textHeight}px ${dim.style?.font || "Arial"}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
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
 * Render angular dimension (angle between two lines)
 */
export function renderAngularDimension(
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
    zoom = 1,
    dimScale = 0,
    dimRounding = true,
    dimShowUnit = false,
    dimTextColor = "#00ff00",
    dimLineColor = "#00ff00",
    dimLineweight = 0.25,
    dimArrowStyle = "closed",
  } = context;
  const isSelected = selectedDimensionIds.includes(dim.id);
  const isHovered = hoveredDimensionId === dim.id;

  // Scale factor for dimension elements (text, arrows)
  const scaleFactor = dimScale === 0 ? 1 : zoom * (dimScale / 10);

  // point1 = vertex (center of angle)
  // point2 = point on first ray
  // point3 = point on second ray
  if (!dim.point1 || !dim.point2 || !dim.point3) return;

  const center = worldToScreen(dim.point1.x, dim.point1.y);
  const p1 = worldToScreen(dim.point2.x, dim.point2.y);
  const p2 = worldToScreen(dim.point3.x, dim.point3.y);

  // Calculate angles from center to each point
  const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);

  // Ensure we draw the smaller angle (< 180°)
  let sweepAngle = angle2 - angle1;
  if (sweepAngle > Math.PI) {
    sweepAngle -= 2 * Math.PI;
  } else if (sweepAngle < -Math.PI) {
    sweepAngle += 2 * Math.PI;
  }

  // Calculate the actual angle value in degrees
  const angleDegrees = Math.abs(sweepAngle) * (180 / Math.PI);

  // Arc radius - use a portion of the distance from center to points
  // or a minimum fixed screen size
  const dist1 = Math.sqrt((p1.x - center.x) ** 2 + (p1.y - center.y) ** 2);
  const dist2 = Math.sqrt((p2.x - center.x) ** 2 + (p2.y - center.y) ** 2);
  const minDist = Math.min(dist1, dist2);
  // Use 40% of the shorter ray length, but at least 30 pixels and at most 100 pixels
  const arcRadius = Math.max(30, Math.min(100, minDist * 0.4));

  // Determine color based on state
  let lineColor = dimLineColor;
  let textColor = dimTextColor;
  // Canvas: fixed lineWidth (1px normal, 1.5px selected, 1.2px hovered)
  // dimLineweight setting only affects SVG export
  let lineWidth = 1;

  if (isSelected) {
    lineColor = "#00bfff";
    textColor = "#00bfff";
    lineWidth = 1.5;
  } else if (isHovered) {
    lineColor = "#ffff00";
    textColor = "#ffff00";
    lineWidth = 1.2;
  }

  if (isPreview) {
    lineColor = lineColor + "80";
    textColor = textColor + "80";
  }

  ctx.strokeStyle = lineColor;
  ctx.fillStyle = textColor;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(isPreview ? [5, 5] : []);

  // Calculate arc endpoint positions (for arrows)
  const ext1End = {
    x: center.x + arcRadius * Math.cos(angle1),
    y: center.y + arcRadius * Math.sin(angle1),
  };
  const ext2End = {
    x: center.x + arcRadius * Math.cos(angle2),
    y: center.y + arcRadius * Math.sin(angle2),
  };

  // AutoCAD style: Only draw the arc, NO extension lines from center
  // Draw the arc
  const startAngle = sweepAngle > 0 ? angle1 : angle2;
  const endAngle = sweepAngle > 0 ? angle2 : angle1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, arcRadius, startAngle, endAngle, false);
  ctx.stroke();

  // Draw arrows at arc ends
  const arrowSize = (dim.style?.arrowSize || 10) * scaleFactor;

  // Arrow at ext1End - tangent to arc (perpendicular to radius)
  const tangent1 = sweepAngle > 0 ? angle1 + Math.PI / 2 : angle1 - Math.PI / 2;
  drawArrow(
    ctx,
    ext1End.x,
    ext1End.y,
    tangent1,
    arrowSize,
    dimArrowStyle,
    true
  );

  // Arrow at ext2End - tangent to arc (perpendicular to radius)
  const tangent2 = sweepAngle > 0 ? angle2 - Math.PI / 2 : angle2 + Math.PI / 2;
  drawArrow(
    ctx,
    ext2End.x,
    ext2End.y,
    tangent2,
    arrowSize,
    dimArrowStyle,
    true
  );

  // Text at middle of arc
  const midAngle = angle1 + sweepAngle / 2;
  const textRadius = arcRadius + 15 * scaleFactor;
  const textX = center.x + textRadius * Math.cos(midAngle);
  const textY = center.y + textRadius * Math.sin(midAngle);

  const precision = dimRounding ? 0 : 2;
  const text = `${angleDegrees.toFixed(precision)}°${dimShowUnit ? "" : ""}`;
  const textHeight = (dim.style?.textHeight || 12) * scaleFactor;
  ctx.font = `${textHeight}px ${dim.style?.font || "Arial"}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
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
    zoom = 1,
    dimScale = 0,
    dimRounding = true,
    dimShowUnit = false,
    dimTextColor = "#00ff00",
    dimLineColor = "#00ff00",
    dimLineweight = 0.25,
    dimArrowStyle = "closed",
  } = context;
  const isSelected = selectedDimensionIds.includes(dim.id);
  const isHovered = hoveredDimensionId === dim.id;

  // Scale factor for dimension elements (text, arrows)
  // dimScale = 0: fixed screen size (NOT following zoom) - default when toggle OFF
  // dimScale > 0: scale with zoom using multiplier (10 = 1x, 5 = 0.5x, 20 = 2x)
  const scaleFactor = dimScale === 0 ? 1 : zoom * (dimScale / 10);

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
  let lineColor = dimLineColor;
  let textColor = dimTextColor;
  // Canvas: fixed lineWidth (1px normal, 1.5px selected, 1.2px hovered)
  // dimLineweight setting only affects SVG export
  let lineWidth = 1;

  if (isSelected) {
    lineColor = "#00bfff";
    textColor = "#00bfff";
    lineWidth = 1.5;
  } else if (isHovered) {
    lineColor = "#ffff00";
    textColor = "#ffff00";
    lineWidth = 1.2;
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
  const precision = dimRounding ? 0 : 2;
  const text = `${prefix}${value.toFixed(precision)}${
    dimShowUnit ? dim.style.unit : ""
  }`;
  const textHeight = dim.style.textHeight * scaleFactor;
  ctx.font = `${textHeight}px ${dim.style.font}`;
  const textWidth = ctx.measureText(text).width;

  // AutoCAD style: leader extends beyond circle with horizontal tail - scale with zoom
  const leaderExtend = 30 * scaleFactor;
  const horizontalTail = textWidth + 15 * scaleFactor;

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

    // Arrow at opposite point (pointing inward toward center) - scale with zoom
    const arrowSize = dim.style.arrowSize * scaleFactor;
    const angle2 = screenAngle + Math.PI;
    drawArrow(
      ctx,
      oppositePoint.x,
      oppositePoint.y,
      angle2,
      arrowSize,
      dimArrowStyle,
      false
    );
  } else {
    // Radius: line from circle point outward (AutoCAD style - no line to center)
    ctx.beginPath();
    ctx.moveTo(circlePoint.x, circlePoint.y);
    ctx.lineTo(extendPoint.x, extendPoint.y);
    ctx.lineTo(tailEnd.x, tailEnd.y);
    ctx.stroke();
  }

  // Arrow at circle point (pointing toward center) - AutoCAD style - scale with zoom
  const arrowSize = dim.style.arrowSize * scaleFactor;
  drawArrow(
    ctx,
    circlePoint.x,
    circlePoint.y,
    screenAngle,
    arrowSize,
    dimArrowStyle,
    true
  );

  // Text at the end of horizontal tail - scale offset with zoom
  ctx.textAlign = isRightSide ? "left" : "right";
  ctx.textBaseline = "bottom";
  const textX = isRightSide
    ? extendPoint.x + 5 * scaleFactor
    : extendPoint.x - 5 * scaleFactor;
  const textY = extendPoint.y - 3 * scaleFactor;
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
    zoom = 1,
    dimScale = 0,
    dimRounding = true,
    dimShowUnit = false,
    dimTextColor = "#00ff00",
    dimLineColor = "#00ff00",
    dimLineweight = 0.25,
    dimExtensionGap = true,
    dimArrowStyle = "closed",
  } = context;
  const isSelected = selectedDimensionIds.includes(dim.id);
  const isHovered = hoveredDimensionId === dim.id;

  // Scale factor for dimension elements (text, arrows)
  // dimScale = 0: fixed screen size (NOT following zoom) - default when toggle OFF
  // dimScale > 0: scale with zoom using multiplier (10 = 1x, 5 = 0.5x, 20 = 2x)
  const scaleFactor = dimScale === 0 ? 1 : zoom * (dimScale / 10);

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
  let lineColor = dimLineColor;
  let textColor = dimTextColor;
  // Canvas: fixed lineWidth (1px normal, 1.5px selected, 1.2px hovered)
  // dimLineweight setting only affects SVG export
  let lineWidth = 1;

  if (isSelected) {
    lineColor = "#00bfff";
    textColor = "#00bfff";
    lineWidth = 1.5; // 1.5x thicker when selected
  } else if (isHovered) {
    lineColor = "#ffff00";
    textColor = "#ffff00";
    lineWidth = 1.2; // 1.2x thicker when hovered
  }

  if (isPreview) {
    lineColor = lineColor + "80";
    textColor = textColor + "80";
  }

  ctx.strokeStyle = lineColor;
  ctx.fillStyle = textColor;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(isPreview ? [5, 5] : []);

  // Extension lines with optional gap at start
  // Gap is 3mm in world units, converted to screen pixels
  const gapWorld = 3; // 3mm gap in world units
  const gapScreen = dimExtensionGap ? gapWorld * zoom : 0;

  ctx.beginPath();
  // Calculate direction from p1 to dimP1
  const ext1DirX = dimP1.x - p1.x;
  const ext1DirY = dimP1.y - p1.y;
  const ext1Len = Math.sqrt(ext1DirX * ext1DirX + ext1DirY * ext1DirY);
  if (ext1Len > 0) {
    const ext1StartX = p1.x + (ext1DirX / ext1Len) * gapScreen;
    const ext1StartY = p1.y + (ext1DirY / ext1Len) * gapScreen;
    ctx.moveTo(ext1StartX, ext1StartY);
    ctx.lineTo(dimP1.x, dimP1.y);
  }

  // Calculate direction from p2 to dimP2
  const ext2DirX = dimP2.x - p2.x;
  const ext2DirY = dimP2.y - p2.y;
  const ext2Len = Math.sqrt(ext2DirX * ext2DirX + ext2DirY * ext2DirY);
  if (ext2Len > 0) {
    const ext2StartX = p2.x + (ext2DirX / ext2Len) * gapScreen;
    const ext2StartY = p2.y + (ext2DirY / ext2Len) * gapScreen;
    ctx.moveTo(ext2StartX, ext2StartY);
    ctx.lineTo(dimP2.x, dimP2.y);
  }
  ctx.stroke();

  // Dimension line
  ctx.beginPath();
  ctx.moveTo(dimP1.x, dimP1.y);
  ctx.lineTo(dimP2.x, dimP2.y);
  ctx.stroke();

  // Arrows - scale with zoom
  const arrowSize = dim.style.arrowSize * scaleFactor;
  const angle = Math.atan2(dimP2.y - dimP1.y, dimP2.x - dimP1.x);

  // Draw arrows using the arrow style helper
  drawArrow(ctx, dimP1.x, dimP1.y, angle, arrowSize, dimArrowStyle, true);
  drawArrow(
    ctx,
    dimP2.x,
    dimP2.y,
    angle + Math.PI,
    arrowSize,
    dimArrowStyle,
    true
  );

  // Text - scale with zoom
  const value = dim.value ?? dimValue;
  const precision = dimRounding ? 0 : 2;
  const text = `${dim.style.prefix}${value.toFixed(precision)}${
    dimShowUnit ? dim.style.unit : ""
  }${dim.style.suffix}`;
  const textHeight = dim.style.textHeight * scaleFactor;
  ctx.font = `${textHeight}px ${dim.style.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Calculate text position and rotation
  const textX = (dimP1.x + dimP2.x) / 2;
  const textY = (dimP1.y + dimP2.y) / 2;

  // Text offset distance (outside the dimension line) - scale with zoom
  const textOffset = textHeight * 0.8 + 5 * scaleFactor;

  // Calculate angle of dimension line
  let textAngle = angle;

  // Normalize angle to range [-PI, PI]
  while (textAngle > Math.PI) textAngle -= 2 * Math.PI;
  while (textAngle < -Math.PI) textAngle += 2 * Math.PI;

  // Ensure text is always readable (not upside down)
  // Text should read left-to-right or bottom-to-top, never right-to-left or top-to-bottom
  // If angle is in the left half (between 90° and -90° on the left side), flip by 180°
  if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
    textAngle += Math.PI;
  }

  // Calculate the offset direction: from measured points (p1/p2) toward dimension line (dimP1/dimP2)
  // This ensures text is always on the OUTSIDE (same direction as the dimension offset)
  const offsetDirX = dimP1.x - p1.x;
  const offsetDirY = dimP1.y - p1.y;
  const offsetDirLen = Math.sqrt(
    offsetDirX * offsetDirX + offsetDirY * offsetDirY
  );

  // Normalize and apply text offset in the same direction
  let offsetX = 0;
  let offsetY = 0;
  if (offsetDirLen > 0.1) {
    offsetX = (offsetDirX / offsetDirLen) * textOffset;
    offsetY = (offsetDirY / offsetDirLen) * textOffset;
  }

  // Draw rotated text
  ctx.save();
  ctx.translate(textX + offsetX, textY + offsetY);
  ctx.rotate(textAngle);
  ctx.fillText(text, 0, 0);
  ctx.restore();

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
  } else if (dim.dimensionType === "angular") {
    renderAngularDimension(context, dim, isPreview);
  } else if (dim.dimensionType === "arc") {
    renderArcDimension(context, dim, isPreview);
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
