/**
 * ExportSVG - SVG export functionality for CAD drawings
 * STEP-5.6: Extracted from ExportManager.ts
 *
 * 2D FIRST, 3D READY: All coordinates in world/mm units
 */

import { CadEntity, Point } from "../../ui/canvas/CadDrawingCanvas";
import type { ExportOptions, ExportResult } from "./ExportManager";
import { calculateBounds, calculateBoundsWithDimSizes } from "./ExportUtils";

// ==================== SVG Export ====================

export function exportToSVG(
  entities: CadEntity[],
  options: ExportOptions,
): ExportResult {
  try {
    const scale = options.scale || 1;
    const pad = options.margin || 10; // Padding in world/mm units
    const bgColor = options.backgroundColor || "#1a1a2e";

    // ===== 2D FIRST, 3D READY: Export Options =====
    const exportText = options.exportText ?? true;
    const exportDim = options.exportDim ?? true;
    const dimLineColor = options.dimLineColor ?? "#00ff00";
    const dimTextColor = options.dimTextColor ?? dimLineColor; // Default to lineColor if not set
    const dimLineweight = options.dimLineweight ?? 0.25; // Default Normal
    const dimArrowStyle = options.dimArrowStyle ?? "closed";

    // ===== WORLD/MM ONLY =====
    // Step 1: Filter entities based on export options
    const exportableEntities = entities.filter((e) => {
      if (e.visible === false) return false;
      if (e.type === "text" && !exportText) return false;
      if (e.type === "dimension" && !exportDim) return false;
      return true;
    });

    // Step 2: Calculate GEOMETRY bounds first (exclude DIM for sizing)
    const geometryEntities = exportableEntities.filter(
      (e) => e.type !== "dimension",
    );
    const geoBounds = calculateBounds(geometryEntities);
    const geoWidth = geoBounds.max.x - geoBounds.min.x;
    const geoHeight = geoBounds.max.y - geoBounds.min.y;
    const geoMinDim = Math.min(geoWidth, geoHeight);

    // Step 3: Calculate DIM text/arrow sizes based on DRAWING size, not dim length
    // Text height: ~1-2% of drawing's smaller dimension, min 8mm, max 25mm
    const dimTextHeightMm = Math.max(8, Math.min(25, geoMinDim * 0.015));
    // Arrow size: ~0.8-1.5% of drawing size, min 5mm, max 15mm
    const dimArrowSizeMm = Math.max(5, Math.min(15, geoMinDim * 0.012));

    // Step 4: Calculate FULL bounds including DIM with correct sizes
    const bounds = calculateBoundsWithDimSizes(
      exportableEntities,
      dimTextHeightMm,
      dimArrowSizeMm,
    );

    // World/mm dimensions
    const minX = bounds.min.x;
    const minY = bounds.min.y;
    const maxX = bounds.max.x;
    const maxY = bounds.max.y;
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    // ===== viewBox: Flip Y by using negative Y coordinates =====
    // CAD: Y-up, SVG: Y-down
    // viewBox starts at (minX-pad, -(maxY+pad)) so that:
    //   - X range: [minX-pad, maxX+pad]
    //   - Y range after flip: [minY-pad, maxY+pad] visually
    const vbX = minX - pad;
    const vbY = -(maxY + pad); // Flip: top of viewBox is -maxY
    const vbW = worldWidth + 2 * pad;
    const vbH = worldHeight + 2 * pad;

    // SVG width/height in mm units (apply scale)
    const svgWidthMm = vbW * scale;
    const svgHeightMm = vbH * scale;

    // ===== Export Mode: "world" vs "preview" =====
    // - "world": width/height in mm units (for technical CAD export, printing)
    // - "preview" (default): width/height = 100% (for browser viewing, fits screen)
    // INVARIANT: viewBox always uses WORLD/mm coordinates in BOTH modes
    const exportMode = options.exportMode ?? "preview";
    let svgWidthAttr: string;
    let svgHeightAttr: string;

    if (exportMode === "world") {
      // Technical export: actual mm dimensions
      svgWidthAttr = `${svgWidthMm.toFixed(2)}mm`;
      svgHeightAttr = `${svgHeightMm.toFixed(2)}mm`;
    } else {
      // Preview mode: fit to browser/container
      svgWidthAttr = "100%";
      svgHeightAttr = "100%";
    }

    // Generate arrowhead defs with calculated size
    const arrowDefs = generateArrowDefs(
      dimLineColor,
      dimArrowStyle,
      dimArrowSizeMm,
      dimArrowSizeMm * 0.4,
    );

    // ===== SVG Header =====
    // Y-flip done via: viewBox negative Y + scale(1,-1) on content
    // INVARIANT: viewBox always WORLD/mm, only width/height changes per exportMode
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${svgWidthAttr}" height="${svgHeightAttr}"
     viewBox="${vbX} ${vbY} ${vbW} ${vbH}"
     preserveAspectRatio="xMidYMid meet">
  <title>${options.title || "CAD Drawing"}</title>
  <desc>Exported from CAD - World/mm, mode=${exportMode} (bounds: ${minX.toFixed(
    0,
  )},${minY.toFixed(0)} to ${maxX.toFixed(0)},${maxY.toFixed(0)})</desc>
  
  ${arrowDefs}
  
  ${
    options.transparent
      ? ""
      : `<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bgColor}"/>`
  }
  
  ${options.includeGrid ? generateSVGGrid(vbW, vbH, 20) : ""}
  
  <!-- Root transform: flip Y (negate Y coords to match viewBox) -->
  <g transform="scale(1, -1)">
`;

    // Add entities - pass dimTextHeightMm for dimension rendering
    for (const entity of exportableEntities) {
      svg += entityToSVGSimple(
        entity,
        dimTextHeightMm,
        dimArrowSizeMm,
        dimLineweight,
        dimLineColor,
        dimTextColor,
      );
    }

    svg += `  </g>
</svg>`;

    return {
      success: true,
      data: svg,
      filename: `${options.title || "drawing"}.svg`,
    };
  } catch (error) {
    return {
      success: false,
      error: `SVG export failed: ${error}`,
    };
  }
}

// Simple entity to SVG - NO Y flip, transform handles it
// Entity to SVG - receives calculated dim sizes from export
function entityToSVGSimple(
  entity: CadEntity,
  dimTextHeightMm: number = 12,
  dimArrowSizeMm: number = 8,
  dimLineweight: number = 0.25,
  dimLineColor: string = "#00ff00",
  dimTextColor: string = "#00ff00",
): string {
  const stroke = entity.color || "#FFFFFF";
  const strokeWidth = entity.lineWidth || 1;

  // IMPORTANT: entity.opacity should only affect FILL, not stroke
  // Stroke should always be visible (opacity 1)
  // fillOpacity combines entity.opacity and entity.fillOpacity
  const entityOpacity = entity.visible === false ? 0 : (entity.opacity ?? 1);

  // Fill support - combine opacity into fill-opacity
  const fill = entity.fillColor || "none";
  const baseFillOpacity = entity.fillOpacity ?? 1;
  const combinedFillOpacity = baseFillOpacity * entityOpacity;
  const fillAttr =
    fill && fill !== "none"
      ? `fill="${fill}" fill-opacity="${combinedFillOpacity}"`
      : `fill="none"`;

  // Stroke attributes - always visible (stroke-opacity=1)
  const strokeAttr = `stroke="${stroke}" stroke-width="${strokeWidth}" stroke-opacity="1" vector-effect="non-scaling-stroke"`;

  switch (entity.type) {
    case "line":
      if (entity.points.length < 2) return "";
      return `    <line x1="${entity.points[0].x}" y1="${entity.points[0].y}" 
                 x2="${entity.points[1].x}" y2="${entity.points[1].y}" 
                 ${strokeAttr}/>
`;

    case "polyline":
      if (entity.points.length < 2) return "";
      const points = entity.points.map((p) => `${p.x},${p.y}`).join(" ");
      const isClosed =
        entity.closed === true ||
        (entity.points.length > 2 &&
          Math.abs(
            entity.points[0].x - entity.points[entity.points.length - 1].x,
          ) < 0.1 &&
          Math.abs(
            entity.points[0].y - entity.points[entity.points.length - 1].y,
          ) < 0.1);
      if (isClosed) {
        return `    <polygon points="${points}" 
                    ${strokeAttr} 
                    ${fillAttr}/>
`;
      }
      return `    <polyline points="${points}" 
                    ${strokeAttr} 
                    ${fillAttr}/>
`;

    case "rect":
      if (entity.points.length < 2) return "";
      const x = Math.min(entity.points[0].x, entity.points[1].x);
      const y = Math.min(entity.points[0].y, entity.points[1].y);
      const w = Math.abs(entity.points[1].x - entity.points[0].x);
      const h = Math.abs(entity.points[1].y - entity.points[0].y);
      return `    <rect x="${x}" y="${y}" width="${w}" height="${h}" 
                 ${strokeAttr} 
                 ${fillAttr}/>
`;

    case "circle":
      if (entity.points.length < 2) return "";
      const cx = entity.points[0].x;
      const cy = entity.points[0].y;
      const r = entity.points[1].x;
      return `    <circle cx="${cx}" cy="${cy}" r="${r}" 
                   ${strokeAttr} 
                   ${fillAttr}/>
`;

    case "arc":
      if (entity.points.length < 2) return "";
      const arcCx = entity.points[0].x;
      const arcCy = entity.points[0].y;
      const arcR = entity.points[1].x;
      const startAngle = entity.startAngle ?? 0;
      const endAngle = entity.endAngle ?? Math.PI * 2;
      const startX = arcCx + arcR * Math.cos(startAngle);
      const startY = arcCy + arcR * Math.sin(startAngle);
      const endX = arcCx + arcR * Math.cos(endAngle);
      const endY = arcCy + arcR * Math.sin(endAngle);
      let angleDiff = endAngle - startAngle;
      if (angleDiff < 0) angleDiff += Math.PI * 2;
      const largeArc = angleDiff > Math.PI ? 1 : 0;
      return `    <path d="M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArc} 1 ${endX} ${endY}" 
                   ${strokeAttr} 
                   fill="none"/>
`;

    case "ellipse":
      if (entity.points.length < 1) return "";
      const ellipseCx = entity.points[0].x;
      const ellipseCy = entity.points[0].y;
      const rx = entity.radiusX ?? 50;
      const ry = entity.radiusY ?? 30;
      return `    <ellipse cx="${ellipseCx}" cy="${ellipseCy}" rx="${rx}" ry="${ry}" 
                   ${strokeAttr} 
                   ${fillAttr}/>
`;

    case "text":
      // ========================================================================
      // 2D FIRST, 3D READY: TEXT EXPORT (World/mm Coordinates)
      // ========================================================================
      // fontSizeMm (entity.fontSize) is the SOURCE OF TRUTH in world/mm units
      // Root group has scale(1,-1), so text needs scale(1,-1) to counter-flip
      // ========================================================================
      if (entity.points.length < 1 || !entity.text) return "";
      const textX = entity.points[0].x;
      const textY = entity.points[0].y;
      // Font size in mm - use entity value directly (no hardcode)
      const fontSizeMm = (entity.fontSize ?? 12) * (entity.textScale ?? 1);
      const fontFamily = entity.fontFamily ?? "Arial";
      const textRotationDeg = ((entity.textRotation ?? 0) * 180) / Math.PI;

      // Handle multiline text
      const lines = entity.text.split("\n");
      const lineHeightMm = fontSizeMm * 1.2;

      // Build tspan elements - dy positive goes DOWN after counter-flip
      const tspanElements = lines
        .map((line, index) => {
          const dy = index === 0 ? 0 : lineHeightMm;
          const escapedLine = line
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<tspan x="0" dy="${dy}">${escapedLine}</tspan>`;
        })
        .join("");

      // Transform: translate, counter-flip, rotate
      return `    <g transform="translate(${textX}, ${textY}) scale(1, -1) rotate(${textRotationDeg})">
    <text x="0" y="0" font-size="${fontSizeMm}" font-family="${fontFamily}" 
          text-anchor="start" dominant-baseline="hanging" fill="${stroke}">
      ${tspanElements}
    </text>
  </g>
`;

    case "dimension":
      // ========================================================================
      // 2D FIRST, 3D READY: DIMENSION EXPORT (World Coordinates)
      // ========================================================================
      // dimTextHeightMm and dimArrowSizeMm are calculated based on DRAWING size
      // Colors use ExportOptions (priority) > dim.style (fallback)
      // ========================================================================
      return dimensionToSVGWorld(
        entity,
        dimTextHeightMm,
        dimArrowSizeMm,
        dimLineweight,
        dimLineColor,
        dimTextColor,
      );

    default:
      return "";
  }
}

// ==================== DIMENSION SVG EXPORT (WORLD/mm) ====================
/**
 * Export DimensionEntity to SVG in WORLD coordinates
 *
 * @param entity - The dimension entity
 * @param textHeightMm - Text height calculated from drawing bounds
 * @param arrowSizeMm - Arrow size calculated from drawing bounds
 * @param lineweightMm - Line weight in mm
 * @param optLineColor - Line color from ExportOptions (priority over dim.style)
 * @param optTextColor - Text color from ExportOptions (priority over dim.style)
 */
function dimensionToSVGWorld(
  entity: CadEntity,
  textHeightMm: number = 12,
  arrowSizeMm: number = 8,
  lineweightMm: number = 0.25,
  optLineColor: string = "#00ff00",
  optTextColor: string = "#00ff00",
): string {
  // Extract dimension properties
  const dim = entity as unknown as {
    point1: Point;
    point2: Point;
    point3?: Point;
    offset: number;
    value?: number;
    direction?: "horizontal" | "vertical" | "aligned" | "auto";
    dimensionType?: string;
    style: {
      textHeight: number;
      arrowSize: number;
      extensionOvershoot: number;
      extensionOffset: number;
      precision: number;
      prefix: string;
      suffix: string;
      unit: string;
      font: string;
      color: string;
      textColor?: string;
      lineColor?: string;
      showUnit?: boolean;
    };
  };

  if (!dim.point1 || !dim.point2) {
    return "";
  }

  // ===== Use PASSED sizes (calculated from drawing bounds) =====
  const style = dim.style ?? {};

  // Extension line parameters proportional to arrow size
  const extensionOvershootMm = Math.max(3, arrowSizeMm * 0.4);
  const extensionOffsetMm = Math.max(2, arrowSizeMm * 0.25);

  const precision = style.precision ?? 0;
  const prefix = style.prefix ?? "";
  const suffix = style.suffix ?? "";
  const unit = style.unit ?? "mm";
  const font = style.font ?? "Arial";
  // Priority: ExportOptions > dim.style (style is fallback)
  const lineColor = optLineColor;
  const textColor = optTextColor;
  const showUnit = style.showUnit ?? false;
  const direction = dim.direction ?? "aligned";

  // Calculate dimension line points based on direction
  let dimP1: Point, dimP2: Point;
  const offset = dim.offset ?? 100;

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
    // Aligned - perpendicular offset
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

  // Calculate measured value
  let measuredValue: number;
  if (direction === "horizontal") {
    measuredValue = Math.abs(dim.point2.x - dim.point1.x);
  } else if (direction === "vertical") {
    measuredValue = Math.abs(dim.point2.y - dim.point1.y);
  } else {
    const dx = dim.point2.x - dim.point1.x;
    const dy = dim.point2.y - dim.point1.y;
    measuredValue = Math.sqrt(dx * dx + dy * dy);
  }
  const displayValue = dim.value ?? measuredValue;
  const text = `${prefix}${displayValue.toFixed(precision)}${
    showUnit ? unit : ""
  }${suffix}`;

  // Calculate text position and angle
  const textX = (dimP1.x + dimP2.x) / 2;
  const textY = (dimP1.y + dimP2.y) / 2;
  const angle = Math.atan2(dimP2.y - dimP1.y, dimP2.x - dimP1.x);
  let textAngle = angle;

  // Keep text readable (not upside down)
  if (textAngle > Math.PI / 2) textAngle -= Math.PI;
  if (textAngle < -Math.PI / 2) textAngle += Math.PI;
  const textAngleDeg = (textAngle * 180) / Math.PI;

  // Text offset from dimension line (in mm)
  const textOffsetMm = textHeightMm * 0.4;

  // Build SVG elements - use lineweightMm for stroke-width (in mm/world units)
  let svg = `    <g class="dimension" stroke="${lineColor}" stroke-width="${lineweightMm}" fill="none">
`;

  // Extension line 1: from point1 to dimP1 (with gap and overshoot)
  const ext1StartY =
    dim.point1.y + (offset > 0 ? extensionOffsetMm : -extensionOffsetMm);
  const ext1EndY =
    dimP1.y + (offset > 0 ? extensionOvershootMm : -extensionOvershootMm);
  if (direction === "horizontal") {
    svg += `      <line x1="${dim.point1.x}" y1="${ext1StartY}" x2="${dim.point1.x}" y2="${ext1EndY}" />
`;
  } else if (direction === "vertical") {
    const ext1StartX =
      dim.point1.x + (offset > 0 ? extensionOffsetMm : -extensionOffsetMm);
    const ext1EndX =
      dimP1.x + (offset > 0 ? extensionOvershootMm : -extensionOvershootMm);
    svg += `      <line x1="${ext1StartX}" y1="${dim.point1.y}" x2="${ext1EndX}" y2="${dim.point1.y}" />
`;
  } else {
    // Aligned extension lines
    const dx = dim.point2.x - dim.point1.x;
    const dy = dim.point2.y - dim.point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = length > 0 ? -dy / length : 0;
    const perpY = length > 0 ? dx / length : 0;
    const gapSign = offset > 0 ? 1 : -1;
    svg += `      <line x1="${
      dim.point1.x + perpX * extensionOffsetMm * gapSign
    }" y1="${dim.point1.y + perpY * extensionOffsetMm * gapSign}" x2="${
      dimP1.x + perpX * extensionOvershootMm * gapSign
    }" y2="${dimP1.y + perpY * extensionOvershootMm * gapSign}" />
`;
  }

  // Extension line 2: from point2 to dimP2 (with gap and overshoot)
  if (direction === "horizontal") {
    const ext2StartY =
      dim.point2.y + (offset > 0 ? extensionOffsetMm : -extensionOffsetMm);
    const ext2EndY =
      dimP2.y + (offset > 0 ? extensionOvershootMm : -extensionOvershootMm);
    svg += `      <line x1="${dim.point2.x}" y1="${ext2StartY}" x2="${dim.point2.x}" y2="${ext2EndY}" />
`;
  } else if (direction === "vertical") {
    const ext2StartX =
      dim.point2.x + (offset > 0 ? extensionOffsetMm : -extensionOffsetMm);
    const ext2EndX =
      dimP2.x + (offset > 0 ? extensionOvershootMm : -extensionOvershootMm);
    svg += `      <line x1="${ext2StartX}" y1="${dim.point2.y}" x2="${ext2EndX}" y2="${dim.point2.y}" />
`;
  } else {
    // Aligned extension lines
    const dx = dim.point2.x - dim.point1.x;
    const dy = dim.point2.y - dim.point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = length > 0 ? -dy / length : 0;
    const perpY = length > 0 ? dx / length : 0;
    const gapSign = offset > 0 ? 1 : -1;
    svg += `      <line x1="${
      dim.point2.x + perpX * extensionOffsetMm * gapSign
    }" y1="${dim.point2.y + perpY * extensionOffsetMm * gapSign}" x2="${
      dimP2.x + perpX * extensionOvershootMm * gapSign
    }" y2="${dimP2.y + perpY * extensionOvershootMm * gapSign}" />
`;
  }

  // Dimension line (with arrows using marker refs)
  svg += `      <line x1="${dimP1.x}" y1="${dimP1.y}" x2="${dimP2.x}" y2="${dimP2.y}" marker-start="url(#dim-arrow-start)" marker-end="url(#dim-arrow-end)" />
`;

  // Dimension text - counter-flip for readability
  const perpAngle = angle + Math.PI / 2;
  const actualTextX = textX + textOffsetMm * Math.cos(perpAngle);
  const actualTextY = textY + textOffsetMm * Math.sin(perpAngle);

  // Estimate text width for background rect (approximate: 0.6 * fontSize per char)
  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const textWidthEstimate = text.length * textHeightMm * 0.6;
  const textHeightPadding = textHeightMm * 0.3;
  const bgWidth = textWidthEstimate + textHeightMm * 0.8;
  const bgHeight = textHeightMm + textHeightPadding * 2;

  // Text: font-size in mm, centered, with background rect to mask dim line
  svg += `      <g transform="translate(${actualTextX}, ${actualTextY}) scale(1, -1) rotate(${textAngleDeg})">
      <rect x="${-bgWidth / 2}" y="${
        -bgHeight / 2
      }" width="${bgWidth}" height="${bgHeight}" 
            fill="#1a1a2e" stroke="none" />
      <text x="0" y="0" font-size="${textHeightMm}" font-family="${font}" 
            text-anchor="middle" dominant-baseline="middle" 
            fill="${textColor}" stroke="none">
        ${escapedText}
      </text>
    </g>
`;

  svg += `    </g>
`;

  return svg;
}

/**
 * Legacy entity to SVG with explicit flipY (not used by current exportToSVG)
 * Kept for backward compatibility
 */
export function entityToSVGLegacy(
  entity: CadEntity,
  boundsHeight: number,
  minY: number,
): string {
  const stroke = entity.color || "#FFFFFF";
  const strokeWidth = entity.lineWidth || 1;
  const opacity = entity.visible === false ? 0 : (entity.opacity ?? 1);

  // Fill support - use fillColor from CadEntity interface
  const fill = entity.fillColor || "none";
  const fillOpacity = entity.fillOpacity ?? 1;
  const fillAttr =
    fill && fill !== "none"
      ? `fill="${fill}" fill-opacity="${fillOpacity}"`
      : `fill="none"`;

  // Helper to flip Y coordinate
  // CAD: Y increases upward, SVG: Y increases downward
  // svgY = boundsHeight - (cadY - minY) = boundsHeight - cadY + minY
  const flipY = (y: number) => boundsHeight - (y - minY);

  switch (entity.type) {
    case "line":
      if (entity.points.length < 2) return "";
      return `    <line x1="${entity.points[0].x}" y1="${flipY(
        entity.points[0].y,
      )}" 
                 x2="${entity.points[1].x}" y2="${flipY(entity.points[1].y)}" 
                 stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
`;

    case "polyline":
      if (entity.points.length < 2) return "";
      const points = entity.points.map((p) => `${p.x},${flipY(p.y)}`).join(" ");
      // Check if closed polyline - either by entity.closed property or first==last point
      const isClosed =
        entity.closed === true ||
        (entity.points.length > 2 &&
          Math.abs(
            entity.points[0].x - entity.points[entity.points.length - 1].x,
          ) < 0.1 &&
          Math.abs(
            entity.points[0].y - entity.points[entity.points.length - 1].y,
          ) < 0.1);
      if (isClosed) {
        // Use polygon for closed polylines to support fill
        return `    <polygon points="${points}" 
                    stroke="${stroke}" stroke-width="${strokeWidth}" 
                    ${fillAttr} opacity="${opacity}"/>
`;
      }
      return `    <polyline points="${points}" 
                    stroke="${stroke}" stroke-width="${strokeWidth}" 
                    ${fillAttr} opacity="${opacity}"/>
`;

    case "rect":
      if (entity.points.length < 2) return "";
      const x = Math.min(entity.points[0].x, entity.points[1].x);
      // For rect, Y needs special handling - flip and use top-left corner
      const y1Flipped = flipY(entity.points[0].y);
      const y2Flipped = flipY(entity.points[1].y);
      const yTop = Math.min(y1Flipped, y2Flipped);
      const w = Math.abs(entity.points[1].x - entity.points[0].x);
      const h = Math.abs(entity.points[1].y - entity.points[0].y);
      return `    <rect x="${x}" y="${yTop}" width="${w}" height="${h}" 
                 stroke="${stroke}" stroke-width="${strokeWidth}" 
                 ${fillAttr} opacity="${opacity}"/>
`;

    case "circle":
      if (entity.points.length < 2) return "";
      const cx = entity.points[0].x;
      const cy = flipY(entity.points[0].y);
      const r = entity.points[1].x; // radius stored in x
      return `    <circle cx="${cx}" cy="${cy}" r="${r}" 
                   stroke="${stroke}" stroke-width="${strokeWidth}" 
                   ${fillAttr} opacity="${opacity}"/>
`;

    case "arc":
      if (entity.points.length < 2) return "";
      const arcCx = entity.points[0].x;
      const arcCy = flipY(entity.points[0].y);
      const arcR = entity.points[1].x; // radius stored in x
      const startAngle = entity.startAngle ?? 0;
      const endAngle = entity.endAngle ?? Math.PI * 2;

      // SVG arc: M start A rx ry rotation large-arc sweep-flag end
      // Note: SVG Y is flipped, so angles need adjustment
      const startX = arcCx + arcR * Math.cos(-startAngle);
      const startY = arcCy + arcR * Math.sin(-startAngle);
      const endX = arcCx + arcR * Math.cos(-endAngle);
      const endY = arcCy + arcR * Math.sin(-endAngle);

      // Determine large-arc-flag (1 if arc > 180 degrees)
      let angleDiff = endAngle - startAngle;
      if (angleDiff < 0) angleDiff += Math.PI * 2;
      const largeArc = angleDiff > Math.PI ? 1 : 0;
      const sweepFlag = 1; // clockwise in flipped coords

      return `    <path d="M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}" 
                   stroke="${stroke}" stroke-width="${strokeWidth}" 
                   fill="none" opacity="${opacity}"/>
`;

    case "ellipse":
      if (entity.points.length < 1) return "";
      const ellipseCx = entity.points[0].x;
      const ellipseCy = flipY(entity.points[0].y);
      const rx = entity.radiusX ?? entity.points[1]?.x ?? 50;
      const ry = entity.radiusY ?? entity.points[1]?.y ?? 30;
      const rotation = ((entity.rotation ?? 0) * 180) / Math.PI; // Convert to degrees
      return `    <ellipse cx="${ellipseCx}" cy="${ellipseCy}" rx="${rx}" ry="${ry}" 
                   transform="rotate(${-rotation} ${ellipseCx} ${ellipseCy})"
                   stroke="${stroke}" stroke-width="${strokeWidth}" 
                   ${fillAttr} opacity="${opacity}"/>
`;

    case "text":
      // ========================================================================
      // 2D FIRST, 3D READY: TEXT EXPORT (flipY variant)
      // ========================================================================
      if (entity.points.length < 1 || !entity.text) return "";
      const textX = entity.points[0].x;
      const textY = flipY(entity.points[0].y);
      const baseFontSize = entity.fontSize ?? 12;
      const textScale = entity.textScale ?? 1;
      const effectiveFontSize = baseFontSize * textScale;
      const fontFamily = entity.fontFamily ?? "Arial";
      const textRotationRad = entity.textRotation ?? 0;
      const textRotationDeg = (textRotationRad * 180) / Math.PI;

      // Handle multiline text with <tspan> elements
      const lines = entity.text.split("\n");
      const lineHeight = effectiveFontSize * 1.2;

      // Build tspan elements - escape HTML entities
      const tspanElements = lines
        .map((line, index) => {
          const dy = index === 0 ? 0 : lineHeight;
          const escapedLine = line
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<tspan x="${textX}" dy="${dy}">${escapedLine}</tspan>`;
        })
        .join("");

      return `    <text x="${textX}" y="${textY}" 
               font-size="${effectiveFontSize}" font-family="${fontFamily}"
               text-anchor="start" dominant-baseline="alphabetic"
               transform="rotate(${-textRotationDeg} ${textX} ${textY})"
               fill="${stroke}" opacity="${opacity}">
    ${tspanElements}
  </text>
`;

    default:
      // Log unknown entity types for debugging
      console.warn(`[ExportSVG] Unknown entity type: ${entity.type}`);
      return "";
  }
}

function generateSVGGrid(
  width: number,
  height: number,
  spacing: number,
): string {
  let grid = `  <g stroke="#333" stroke-width="0.5" opacity="0.5">
`;
  for (let x = 0; x <= width; x += spacing) {
    grid += `    <line x1="${x}" y1="0" x2="${x}" y2="${height}"/>
`;
  }
  for (let y = 0; y <= height; y += spacing) {
    grid += `    <line x1="0" y1="${y}" x2="${width}" y2="${y}"/>
`;
  }
  grid += `  </g>
`;
  return grid;
}

// ==================== Arrow Defs for Dimensions ====================
/**
 * Generate SVG defs for dimension arrowhead markers
 *
 * INVARIANT: Arrow sizes are in world/mm units (scaled by viewBox)
 */
function generateArrowDefs(
  color: string,
  style: "closed" | "open" | "tick" | "dot" | "none",
  arrowLength: number = 30,
  arrowWidth: number = 12,
): string {
  if (style === "none") {
    return `<defs>
    <marker id="dim-arrow-start" markerWidth="1" markerHeight="1" refX="0" refY="0" orient="auto">
    </marker>
    <marker id="dim-arrow-end" markerWidth="1" markerHeight="1" refX="0" refY="0" orient="auto">
    </marker>
  </defs>`;
  }

  // Arrow size now passed as parameters, in world/mm units

  switch (style) {
    case "closed":
      // Filled arrow pointing inward (CAD style)
      return `<defs>
    <marker id="dim-arrow-start" markerWidth="${arrowLength}" markerHeight="${arrowWidth}" 
            refX="0" refY="${
              arrowWidth / 2
            }" orient="auto" markerUnits="userSpaceOnUse" overflow="visible">
      <polygon points="0,${
        arrowWidth / 2
      } ${arrowLength},0 ${arrowLength},${arrowWidth}" fill="${color}"/>
    </marker>
    <marker id="dim-arrow-end" markerWidth="${arrowLength}" markerHeight="${arrowWidth}" 
            refX="${arrowLength}" refY="${
              arrowWidth / 2
            }" orient="auto" markerUnits="userSpaceOnUse" overflow="visible">
      <polygon points="${arrowLength},${
        arrowWidth / 2
      } 0,0 0,${arrowWidth}" fill="${color}"/>
    </marker>
  </defs>`;

    case "open":
      // Open arrow (just lines, no fill)
      return `<defs>
    <marker id="dim-arrow-start" markerWidth="${arrowLength}" markerHeight="${arrowWidth}" 
            refX="${arrowLength}" refY="${
              arrowWidth / 2
            }" orient="auto" markerUnits="userSpaceOnUse">
      <polyline points="${arrowLength},0 0,${
        arrowWidth / 2
      } ${arrowLength},${arrowWidth}" 
                fill="none" stroke="${color}" stroke-width="1"/>
    </marker>
    <marker id="dim-arrow-end" markerWidth="${arrowLength}" markerHeight="${arrowWidth}" 
            refX="0" refY="${
              arrowWidth / 2
            }" orient="auto" markerUnits="userSpaceOnUse">
      <polyline points="0,0 ${arrowLength},${arrowWidth / 2} 0,${arrowWidth}" 
                fill="none" stroke="${color}" stroke-width="1"/>
    </marker>
  </defs>`;

    case "tick":
      // Oblique tick mark
      const tickSize = arrowWidth;
      return `<defs>
    <marker id="dim-arrow-start" markerWidth="${tickSize}" markerHeight="${tickSize}" 
            refX="${tickSize / 2}" refY="${
              tickSize / 2
            }" orient="auto" markerUnits="userSpaceOnUse">
      <line x1="0" y1="${tickSize}" x2="${tickSize}" y2="0" stroke="${color}" stroke-width="2"/>
    </marker>
    <marker id="dim-arrow-end" markerWidth="${tickSize}" markerHeight="${tickSize}" 
            refX="${tickSize / 2}" refY="${
              tickSize / 2
            }" orient="auto" markerUnits="userSpaceOnUse">
      <line x1="0" y1="${tickSize}" x2="${tickSize}" y2="0" stroke="${color}" stroke-width="2"/>
    </marker>
  </defs>`;

    case "dot":
      // Filled circle/dot
      const dotRadius = arrowWidth / 3;
      return `<defs>
    <marker id="dim-arrow-start" markerWidth="${arrowWidth}" markerHeight="${arrowWidth}" 
            refX="${arrowWidth / 2}" refY="${
              arrowWidth / 2
            }" orient="auto" markerUnits="userSpaceOnUse">
      <circle cx="${arrowWidth / 2}" cy="${
        arrowWidth / 2
      }" r="${dotRadius}" fill="${color}"/>
    </marker>
    <marker id="dim-arrow-end" markerWidth="${arrowWidth}" markerHeight="${arrowWidth}" 
            refX="${arrowWidth / 2}" refY="${
              arrowWidth / 2
            }" orient="auto" markerUnits="userSpaceOnUse">
      <circle cx="${arrowWidth / 2}" cy="${
        arrowWidth / 2
      }" r="${dotRadius}" fill="${color}"/>
    </marker>
  </defs>`;

    default:
      // Default to closed arrow
      return `<defs>
    <marker id="dim-arrow-start" markerWidth="${arrowLength}" markerHeight="${arrowWidth}" 
            refX="${arrowLength}" refY="${
              arrowWidth / 2
            }" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="${arrowLength},0 ${arrowLength},${arrowWidth} 0,${
        arrowWidth / 2
      }" fill="${color}"/>
    </marker>
    <marker id="dim-arrow-end" markerWidth="${arrowLength}" markerHeight="${arrowWidth}" 
            refX="0" refY="${
              arrowWidth / 2
            }" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0,0 0,${arrowWidth} ${arrowLength},${
        arrowWidth / 2
      }" fill="${color}"/>
    </marker>
  </defs>`;
  }
}
