/**
 * drawEntities — Main entity rendering loop
 *
 * STEP-5.9: Extracted from useCanvasRenderer.ts
 * Renders all display entities: style resolution (ByLayer/Custom),
 * shape rendering (line, rect, circle, arc, ellipse, text),
 * fill, selection highlights, and selection grips.
 */

import type { Point, CadEntity } from "../../types/CadEntity";
import type { LayerInfo } from "../../canvas.types";
import type { TextHitTestContext, TextRenderSettings } from "../../utils";
import { entityBounds } from "../../utils";

export function drawEntities(
  ctx: CanvasRenderingContext2D,
  displayEntities: CadEntity[],
  selectedIds: string[],
  hoveredId: string | null,
  layers: LayerInfo[],
  zoom: number,
  worldToScreen: (wx: number, wy: number) => Point,
  textHitTestContext: TextHitTestContext | undefined,
  textSettings: TextRenderSettings | undefined,
): void {
  displayEntities.forEach((entity) => {
    // Check layer visibility
    if (entity.layer && layers.length > 0) {
      const entityLayer = layers.find((l) => l.id === entity.layer);
      if (entityLayer && !entityLayer.visible) {
        return; // Skip hidden layers
      }
    }

    // Check entity visibility
    if (entity.visible === false) {
      return;
    }

    const isSelected = selectedIds.includes(entity.id);
    const isHovered = hoveredId === entity.id;

    // === RESOLVE STYLE FROM LAYER (ByLayer) or Entity (Custom) ===
    const entityLayer = layers.find((l) => l.id === entity.layer);

    // Check if entity uses ByLayer mode (inherits from layer)
    // useLayerStyle: true = ByLayer, false = Custom (entity's own style)
    // Default to true for backward compatibility with old entities
    const shouldUseLayerStyle = entity.useLayerStyle !== false;

    // Stroke color
    const resolvedStroke = shouldUseLayerStyle
      ? entityLayer?.color || entity.color || "#FFFFFF"
      : entity.color || "#FFFFFF";

    // Line weight
    const resolvedLineWeight = shouldUseLayerStyle
      ? entityLayer?.lineWeight || entity.lineWidth || 1
      : entity.lineWidth || 1;

    // Line type
    const resolvedLineType = shouldUseLayerStyle
      ? entityLayer?.lineType?.toLowerCase() || entity.strokeStyle || "solid"
      : entity.strokeStyle || "solid";

    // Fill color
    const resolvedFillColor = shouldUseLayerStyle
      ? entityLayer?.fillColor || entity.fillColor || null
      : entity.fillColor || null;

    // Opacity - ensure number type (check entity.opacity first, then fallback to fillOpacity)
    const resolvedOpacity: number = shouldUseLayerStyle
      ? (entityLayer?.opacity ?? entity.opacity ?? entity.fillOpacity ?? 1)
      : (entity.opacity ?? entity.fillOpacity ?? 1);

    if (isSelected) {
      ctx.strokeStyle = "#00bfff";
      ctx.lineWidth = resolvedLineWeight + 1;
    } else if (isHovered) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = resolvedLineWeight + 0.5;
    } else {
      ctx.strokeStyle = resolvedStroke;
      ctx.lineWidth = resolvedLineWeight;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Apply line type (dash pattern) - resolved from layer or entity
    const lineType = resolvedLineType;
    if (lineType === "dashed") {
      ctx.setLineDash([8, 4]);
    } else if (lineType === "dotted") {
      ctx.setLineDash([2, 4]);
    } else if (lineType === "dashdot") {
      ctx.setLineDash([8, 4, 2, 4]);
    } else {
      ctx.setLineDash([]); // solid/continuous
    }

    if (entity.type === "line" || entity.type === "polyline") {
      if (entity.points.length >= 2) {
        ctx.beginPath();
        const start = worldToScreen(entity.points[0].x, entity.points[0].y);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < entity.points.length; i++) {
          const pt = worldToScreen(entity.points[i].x, entity.points[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        // Close polyline if closed=true (AutoCAD-style)
        if (entity.type === "polyline" && entity.closed) {
          ctx.closePath();

          // Fill closed polyline - use resolved layer style
          if (resolvedFillColor) {
            ctx.save();
            ctx.globalAlpha = resolvedOpacity;
            ctx.fillStyle = resolvedFillColor;
            ctx.fill();
            ctx.restore();
          }
        }
        ctx.stroke();
      }
    } else if (entity.type === "rect") {
      const p1 = worldToScreen(entity.points[0].x, entity.points[0].y);
      const p2 = worldToScreen(entity.points[1].x, entity.points[1].y);
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const w = Math.abs(p2.x - p1.x);
      const h = Math.abs(p2.y - p1.y);

      // Fill first (behind stroke) - use resolved layer style
      if (resolvedFillColor) {
        ctx.save();
        ctx.globalAlpha = resolvedOpacity;
        ctx.fillStyle = resolvedFillColor;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      }

      ctx.strokeRect(x, y, w, h);
    } else if (entity.type === "circle") {
      const center = worldToScreen(entity.points[0].x, entity.points[0].y);
      const radius = entity.points[1].x * zoom;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

      // Fill first (behind stroke) - use resolved layer style
      if (resolvedFillColor) {
        ctx.save();
        ctx.globalAlpha = resolvedOpacity;
        ctx.fillStyle = resolvedFillColor;
        ctx.fill();
        ctx.restore();
      }

      ctx.stroke();
    } else if (entity.type === "arc") {
      // Arc entity rendering
      const center = worldToScreen(entity.points[0].x, entity.points[0].y);
      const radius = entity.points[1].x * zoom;
      const startAngle = entity.startAngle ?? 0;
      const endAngle = entity.endAngle ?? Math.PI * 2;

      // Canvas coordinate: Y goes DOWN (positive Y is down)
      // CAD coordinate: Y goes UP (positive Y is up)
      // Để hiển thị đúng, cần đảo dấu góc (vì đảo Y = đảo hướng góc)

      // Tính sweep angle để xác định hướng arc
      let sweep = endAngle - startAngle;
      while (sweep > Math.PI) sweep -= 2 * Math.PI;
      while (sweep < -Math.PI) sweep += 2 * Math.PI;

      // Trong canvas với Y-flipped:
      // - Góc CAD angle α tương ứng với góc canvas -α
      // - sweep > 0 (CCW trong CAD) → vẽ CW trong canvas (anticlockwise = false)
      // - sweep < 0 (CW trong CAD) → vẽ CCW trong canvas (anticlockwise = true)

      ctx.beginPath();

      // Chuyển đổi góc CAD sang góc canvas (đảo dấu vì Y flipped)
      const canvasStartAngle = -startAngle;
      const canvasEndAngle = -endAngle;

      // Nếu sweep > 0: từ startAngle đến endAngle theo CCW (CAD) = CW trong canvas
      // Canvas arc(startAngle, endAngle, anticlockwise):
      //   - anticlockwise = false: vẽ từ start đến end theo CW
      //   - anticlockwise = true: vẽ từ start đến end theo CCW
      const anticlockwise = sweep > 0;

      ctx.arc(
        center.x,
        center.y,
        radius,
        canvasStartAngle,
        canvasEndAngle,
        anticlockwise,
      );
      ctx.stroke();
    } else if (entity.type === "ellipse") {
      // Ellipse entity rendering
      const center = worldToScreen(entity.points[0].x, entity.points[0].y);
      const radiusX = (entity.radiusX ?? 50) * zoom;
      const radiusY = (entity.radiusY ?? 25) * zoom;
      const rotation = entity.rotation ?? 0;
      ctx.beginPath();
      ctx.ellipse(
        center.x,
        center.y,
        radiusX,
        radiusY,
        -rotation,
        0,
        Math.PI * 2,
      );

      // Fill first (behind stroke) - use resolved layer style
      if (resolvedFillColor) {
        ctx.save();
        ctx.globalAlpha = resolvedOpacity;
        ctx.fillStyle = resolvedFillColor;
        ctx.fill();
        ctx.restore();
      }

      ctx.stroke();
    } else if (entity.type === "text") {
      // Check showText setting
      if (textSettings?.showText === false) {
        // Skip rendering text if hidden
      } else {
        // Text entity rendering with rotation, scale, and multiline support
        const pos = worldToScreen(entity.points[0].x, entity.points[0].y);
        const fontSizeMm = entity.fontSize ?? 12;
        const entityScale = entity.textScale ?? 1;
        const rotation = entity.textRotation ?? 0;

        // Calculate fontSize based on textSettings (VIEW OPTION)
        let fontSize: number;
        if (textSettings?.scaleMode === "AUTO_ANNOTATION") {
          // Pixel-constant: text giữ kích thước cố định trên màn hình
          fontSize = (textSettings.annotationPx ?? 14) * entityScale;
        } else {
          // WORLD_RATIO: fontSize = fontSizeMm * zoom * worldRatio * entityScale
          const worldRatio = textSettings?.worldRatio ?? 1;
          fontSize = fontSizeMm * zoom * worldRatio * entityScale;

          // Apply min size clamp if enabled
          const minClamp = textSettings?.minSizeClampPx ?? 0;
          if (minClamp > 0 && fontSize < minClamp) {
            fontSize = minClamp;
          }
        }

        const lineHeight = fontSize * 1.2; // 1.2 line height multiplier

        // Get font settings from textSettings or entity
        const fontFamily =
          textSettings?.fontFamily ?? entity.fontFamily ?? "Arial";
        const fontWeight = textSettings?.fontWeight ?? "normal";
        const textColor =
          textSettings?.textColor ?? entity.color ?? "#ffffff";
        const textOpacity = textSettings?.textOpacity ?? 1;

        ctx.save();

        // Apply anti-aliasing setting
        if (textSettings?.antiAlias === false) {
          ctx.imageSmoothingEnabled = false;
        }

        // Apply transformations
        ctx.translate(pos.x, pos.y);
        ctx.rotate(-rotation); // Negative because canvas Y is inverted

        // Set text properties
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = textOpacity;
        ctx.textBaseline = "bottom";

        // Draw multiline text
        const textContent = entity.text ?? "";
        const lines = textContent.split("\n");
        lines.forEach((line, index) => {
          // Each line is drawn below the previous one
          // First line at y=0, second at y=lineHeight, etc.
          ctx.fillText(line, 0, index * lineHeight);
        });

        ctx.restore();

        // Draw hover overlay for text (bounding box when hovering)
        if (isHovered && !isSelected && entity.text) {
          ctx.save();
          ctx.strokeStyle = "#ffff00";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

          // Calculate bounding box for multiline text
          const hoverLines = entity.text.split("\n");
          let maxWidth = 0;
          hoverLines.forEach((line) => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxWidth) maxWidth = metrics.width;
          });
          const textWidth = maxWidth;
          const textHeight = hoverLines.length * lineHeight;

          // Apply same transforms for correct position
          const hoverPos = worldToScreen(
            entity.points[0].x,
            entity.points[0].y,
          );
          ctx.strokeRect(
            hoverPos.x - 2,
            hoverPos.y - fontSize - 2,
            textWidth + 4,
            textHeight + 4,
          );
          ctx.restore();
        }
      }
    }

    // Selection handles - draw grips based on entity type
    if (isSelected) {
      ctx.fillStyle = "#00bfff";

      if (entity.type === "line" || entity.type === "polyline") {
        // Draw grips at actual points for line/polyline
        entity.points.forEach((pt) => {
          const screenPt = worldToScreen(pt.x, pt.y);
          ctx.fillRect(screenPt.x - 4, screenPt.y - 4, 8, 8);
        });
      } else if (entity.type === "circle") {
        // Draw grip at center
        const center = worldToScreen(entity.points[0].x, entity.points[0].y);
        ctx.fillRect(center.x - 4, center.y - 4, 8, 8);
        // Draw grips at quadrant points (top, bottom, left, right)
        const radius = entity.points[1].x;
        const quadrants = [
          { x: entity.points[0].x, y: entity.points[0].y - radius }, // top
          { x: entity.points[0].x, y: entity.points[0].y + radius }, // bottom
          { x: entity.points[0].x - radius, y: entity.points[0].y }, // left
          { x: entity.points[0].x + radius, y: entity.points[0].y }, // right
        ];
        quadrants.forEach((q) => {
          const screenQ = worldToScreen(q.x, q.y);
          ctx.fillRect(screenQ.x - 4, screenQ.y - 4, 8, 8);
        });
      } else if (entity.type === "arc" && entity.points.length >= 2) {
        // Draw 4 grips for arc: center, start, end, midpoint
        const arcCenter = entity.points[0];
        const arcRadius = entity.points[1].x;
        const startAngle = entity.startAngle ?? 0;
        const endAngle = entity.endAngle ?? Math.PI * 2;

        // Calculate mid angle
        let sweep = endAngle - startAngle;
        while (sweep > Math.PI) sweep -= 2 * Math.PI;
        while (sweep < -Math.PI) sweep += 2 * Math.PI;
        const midAngle = startAngle + sweep / 2;

        // Grip positions in world coordinates
        const grips = [
          { x: arcCenter.x, y: arcCenter.y }, // center
          {
            x: arcCenter.x + arcRadius * Math.cos(startAngle),
            y: arcCenter.y + arcRadius * Math.sin(startAngle),
          }, // start
          {
            x: arcCenter.x + arcRadius * Math.cos(endAngle),
            y: arcCenter.y + arcRadius * Math.sin(endAngle),
          }, // end
          {
            x: arcCenter.x + arcRadius * Math.cos(midAngle),
            y: arcCenter.y + arcRadius * Math.sin(midAngle),
          }, // mid
        ];

        grips.forEach((g) => {
          const screenG = worldToScreen(g.x, g.y);
          ctx.fillRect(screenG.x - 4, screenG.y - 4, 8, 8);
        });
      } else if (entity.type === "rect") {
        // Draw grips at 4 corners for rectangle
        const bounds = entityBounds(entity, textHitTestContext);
        const corners = [
          worldToScreen(bounds.min.x, bounds.min.y),
          worldToScreen(bounds.max.x, bounds.min.y),
          worldToScreen(bounds.min.x, bounds.max.y),
          worldToScreen(bounds.max.x, bounds.max.y),
        ];
        corners.forEach((c) => ctx.fillRect(c.x - 4, c.y - 4, 8, 8));
      } else if (entity.type === "text") {
        // Draw grip at text position
        if (entity.points.length > 0) {
          const textPos = worldToScreen(
            entity.points[0].x,
            entity.points[0].y,
          );
          ctx.fillRect(textPos.x - 4, textPos.y - 4, 8, 8);

          // Draw bounding box for text
          if (entity.text) {
            ctx.save();
            ctx.strokeStyle = "#00bfff";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            const fontSize = (entity.fontSize ?? 12) * zoom;
            ctx.font = `${fontSize}px ${entity.fontFamily ?? "Arial"}`;
            const metrics = ctx.measureText(entity.text);
            const textWidth = metrics.width;
            const textHeight = fontSize;
            ctx.strokeRect(
              textPos.x - 2,
              textPos.y - textHeight - 2,
              textWidth + 4,
              textHeight + 4,
            );
            ctx.restore();
          }
        }
      }
    }
  });
}
