/**
 * drawCommandPreview — Command-based drawing preview (ĐIỀU KIỆN 1)
 *
 * STEP-5.9: Extracted from useCanvasRenderer.ts
 * Renders preview entity from useCommandDrawing hook:
 * - Line/Polyline preview + inline dynamic dimension (distance + angle)
 * - Rect preview + width/height dimension labels
 * - Circle preview + radius label
 * - Arc preview
 * - Ellipse preview
 * - Text preview
 */

import type { Point, CadEntity } from "../../types/CadEntity";
import { distance } from "../../utils";

export function drawCommandPreview(
  ctx: CanvasRenderingContext2D,
  commandPreviewEntity: CadEntity | null,
  zoom: number,
  worldToScreen: (wx: number, wy: number) => Point,
): void {
  const cmdPreview = commandPreviewEntity;
  if (!cmdPreview || cmdPreview.points.length === 0) return;

  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 2;

  if (cmdPreview.type === "line" || cmdPreview.type === "polyline") {
    ctx.beginPath();
    const start = worldToScreen(
      cmdPreview.points[0].x,
      cmdPreview.points[0].y,
    );
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < cmdPreview.points.length; i++) {
      const pt = worldToScreen(
        cmdPreview.points[i].x,
        cmdPreview.points[i].y,
      );
      ctx.lineTo(pt.x, pt.y);
    }
    // Close polyline if closed=true
    if (cmdPreview.type === "polyline" && cmdPreview.closed) {
      ctx.closePath();
    }
    ctx.stroke();

    // Draw points
    cmdPreview.points.forEach((pt) => {
      const screen = worldToScreen(pt.x, pt.y);
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // ==================== Dynamic Dimension Display for LINE ====================
    // Show length and angle while drawing
    if (cmdPreview.points.length >= 2) {
      const lastIdx = cmdPreview.points.length - 1;
      const prevPt = cmdPreview.points[lastIdx - 1];
      const currPt = cmdPreview.points[lastIdx];
      const prevScreen = worldToScreen(prevPt.x, prevPt.y);
      const currScreen = worldToScreen(currPt.x, currPt.y);

      const lineDist = distance(prevPt, currPt);
      if (lineDist > 0.1) {
        const midX = (prevScreen.x + currScreen.x) / 2;
        const midY = (prevScreen.y + currScreen.y) / 2;
        const screenAngle = Math.atan2(
          currScreen.y - prevScreen.y,
          currScreen.x - prevScreen.x,
        );

        // Calculate world angle (0° = right, counter-clockwise positive)
        const worldAngle = Math.atan2(
          currPt.y - prevPt.y,
          currPt.x - prevPt.x,
        );
        let angleDeg = (worldAngle * 180) / Math.PI;
        if (angleDeg < 0) angleDeg += 360;

        // Offset text perpendicular to line
        const offsetDist = 12;
        const textX = midX - Math.sin(screenAngle) * offsetDist;
        const textY = midY + Math.cos(screenAngle) * offsetDist;

        ctx.save();
        ctx.setLineDash([]);
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw distance text
        const distText = lineDist.toFixed(2);
        const distMetrics = ctx.measureText(distText);
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          textX - distMetrics.width / 2 - 3,
          textY - 7,
          distMetrics.width + 6,
          14,
        );
        ctx.fillStyle = "#4fd1c5";
        ctx.fillText(distText, textX, textY);

        // Draw angle text (near the end point)
        const angleText = angleDeg.toFixed(1) + "°";
        const angleMetrics = ctx.measureText(angleText);
        const angleX = currScreen.x + 20;
        const angleY = currScreen.y - 15;
        ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
        ctx.fillRect(
          angleX - angleMetrics.width / 2 - 3,
          angleY - 7,
          angleMetrics.width + 6,
          14,
        );
        ctx.fillStyle = "#ffa500"; // Orange for angle
        ctx.fillText(angleText, angleX, angleY);

        ctx.restore();
      }
    }
  } else if (cmdPreview.type === "rect" && cmdPreview.points.length >= 2) {
    const c1 = worldToScreen(
      cmdPreview.points[0].x,
      cmdPreview.points[0].y,
    );
    const c2 = worldToScreen(
      cmdPreview.points[1].x,
      cmdPreview.points[1].y,
    );
    ctx.strokeRect(
      Math.min(c1.x, c2.x),
      Math.min(c1.y, c2.y),
      Math.abs(c2.x - c1.x),
      Math.abs(c2.y - c1.y),
    );

    // ==================== Dynamic Dimension Display for RECT ====================
    const rectWidth = Math.abs(
      cmdPreview.points[1].x - cmdPreview.points[0].x,
    );
    const rectHeight = Math.abs(
      cmdPreview.points[1].y - cmdPreview.points[0].y,
    );

    ctx.save();
    ctx.setLineDash([]);
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Width dimension (on top edge)
    const widthText = rectWidth.toFixed(2);
    const widthMetrics = ctx.measureText(widthText);
    const widthX = (c1.x + c2.x) / 2;
    const widthY = Math.min(c1.y, c2.y) - 15;
    ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
    ctx.fillRect(
      widthX - widthMetrics.width / 2 - 3,
      widthY - 7,
      widthMetrics.width + 6,
      14,
    );
    ctx.fillStyle = "#4fd1c5";
    ctx.fillText(widthText, widthX, widthY);

    // Height dimension (on right edge)
    const heightText = rectHeight.toFixed(2);
    const heightMetrics = ctx.measureText(heightText);
    const heightX = Math.max(c1.x, c2.x) + 20;
    const heightY = (c1.y + c2.y) / 2;
    ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
    ctx.fillRect(
      heightX - heightMetrics.width / 2 - 3,
      heightY - 7,
      heightMetrics.width + 6,
      14,
    );
    ctx.fillStyle = "#ffa500";
    ctx.fillText(heightText, heightX, heightY);

    ctx.restore();
  } else if (
    cmdPreview.type === "circle" &&
    cmdPreview.points.length >= 2
  ) {
    const centerScreen = worldToScreen(
      cmdPreview.points[0].x,
      cmdPreview.points[0].y,
    );
    const radiusWorld = cmdPreview.points[1].x; // Radius stored in point.x
    const radiusScreen = radiusWorld * zoom;
    ctx.beginPath();
    ctx.arc(centerScreen.x, centerScreen.y, radiusScreen, 0, Math.PI * 2);
    ctx.stroke();
    // Center point
    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.arc(centerScreen.x, centerScreen.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // ==================== Dynamic Dimension Display for CIRCLE ====================
    ctx.save();
    ctx.setLineDash([]);
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Radius dimension
    const radiusText = "R: " + radiusWorld.toFixed(2);
    const radiusMetrics = ctx.measureText(radiusText);
    const radiusTextX = centerScreen.x + radiusScreen + 20;
    const radiusTextY = centerScreen.y;
    ctx.fillStyle = "rgba(20, 20, 35, 0.85)";
    ctx.fillRect(
      radiusTextX - radiusMetrics.width / 2 - 3,
      radiusTextY - 7,
      radiusMetrics.width + 6,
      14,
    );
    ctx.fillStyle = "#4fd1c5";
    ctx.fillText(radiusText, radiusTextX, radiusTextY);

    ctx.restore();
  } else if (cmdPreview.type === "arc" && cmdPreview.points.length >= 2) {
    const centerScreen = worldToScreen(
      cmdPreview.points[0].x,
      cmdPreview.points[0].y,
    );
    const radiusWorld = cmdPreview.points[1].x;
    const radiusScreen = radiusWorld * zoom;
    const startAngle = cmdPreview.startAngle ?? 0;
    const endAngle = cmdPreview.endAngle ?? Math.PI * 2;
    ctx.beginPath();
    // Note: canvas arc is clockwise, CAD is counter-clockwise
    ctx.arc(
      centerScreen.x,
      centerScreen.y,
      radiusScreen,
      -startAngle,
      -endAngle,
      true,
    );
    ctx.stroke();
  } else if (
    cmdPreview.type === "ellipse" &&
    cmdPreview.points.length >= 1
  ) {
    const centerScreen = worldToScreen(
      cmdPreview.points[0].x,
      cmdPreview.points[0].y,
    );
    const radiusX = (cmdPreview.radiusX ?? 0) * zoom;
    const radiusY = (cmdPreview.radiusY ?? 0) * zoom;
    const rotation = cmdPreview.rotation ?? 0;
    ctx.beginPath();
    ctx.ellipse(
      centerScreen.x,
      centerScreen.y,
      radiusX,
      radiusY,
      -rotation,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  } else if (cmdPreview.type === "text" && cmdPreview.text) {
    const posScreen = worldToScreen(
      cmdPreview.points[0].x,
      cmdPreview.points[0].y,
    );
    ctx.font = `${(cmdPreview.fontSize ?? 12) * zoom}px ${
      cmdPreview.fontFamily ?? "Arial"
    }`;
    ctx.fillStyle = cmdPreview.color;
    ctx.textBaseline = "bottom";
    ctx.fillText(cmdPreview.text, posScreen.x, posScreen.y);
  }

  ctx.restore();
}
