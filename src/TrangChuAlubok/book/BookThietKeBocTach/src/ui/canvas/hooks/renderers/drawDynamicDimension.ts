/**
 * drawDynamicDimension — Dynamic dimension HUD while dragging/moving
 *
 * STEP-5.9: Extracted from useCanvasRenderer.ts
 * DRY merge of "Dynamic Dimension Display for MOVE/COPY" (Group E)
 * and "Dynamic Dimension Display for DRAG MOVING" (Group G).
 *
 * Shows: vector line, base point marker, distance (cyan),
 * angle (orange), ΔX/ΔY (light green)
 */

import type { Point } from "../../types/CadEntity";

export function drawDynamicDimension(
  ctx: CanvasRenderingContext2D,
  startWorld: Point,
  endWorld: Point,
  delta: Point,
  worldToScreen: (wx: number, wy: number) => Point,
): void {
  const moveDist = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
  if (moveDist <= 0.1) return;

  const startScreen = worldToScreen(startWorld.x, startWorld.y);
  const endScreen = worldToScreen(endWorld.x, endWorld.y);

  ctx.save();

  // Draw vector line from start to end
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(startScreen.x, startScreen.y);
  ctx.lineTo(endScreen.x, endScreen.y);
  ctx.stroke();

  // Draw start point marker
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(startScreen.x, startScreen.y, 5, 0, Math.PI * 2);
  ctx.fill();

  // Calculate angle (0° = right, counter-clockwise positive)
  const worldAngle = Math.atan2(delta.y, delta.x);
  let angleDeg = (worldAngle * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;

  // Screen angle for text positioning
  const screenAngle = Math.atan2(
    endScreen.y - startScreen.y,
    endScreen.x - startScreen.x,
  );

  // Calculate midpoint for distance text
  const midX = (startScreen.x + endScreen.x) / 2;
  const midY = (startScreen.y + endScreen.y) / 2;

  // Offset text perpendicular to line
  const offsetDist = 15;
  const textX = midX - Math.sin(screenAngle) * offsetDist;
  const textY = midY + Math.cos(screenAngle) * offsetDist;

  ctx.setLineDash([]);
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Draw distance text (cyan)
  const distText = moveDist.toFixed(2);
  const distMetrics = ctx.measureText(distText);
  ctx.fillStyle = "rgba(20, 20, 35, 0.9)";
  ctx.fillRect(
    textX - distMetrics.width / 2 - 4,
    textY - 8,
    distMetrics.width + 8,
    16,
  );
  ctx.fillStyle = "#4fd1c5";
  ctx.fillText(distText, textX, textY);

  // Draw angle text (orange, near end point)
  const angleText = angleDeg.toFixed(1) + "°";
  const angleMetrics = ctx.measureText(angleText);
  const angleX = endScreen.x + 25;
  const angleY = endScreen.y - 20;
  ctx.fillStyle = "rgba(20, 20, 35, 0.9)";
  ctx.fillRect(
    angleX - angleMetrics.width / 2 - 4,
    angleY - 8,
    angleMetrics.width + 8,
    16,
  );
  ctx.fillStyle = "#ffa500";
  ctx.fillText(angleText, angleX, angleY);

  // Draw ΔX/ΔY text (light green)
  const dxText = `ΔX: ${delta.x.toFixed(2)}`;
  const dyText = `ΔY: ${delta.y.toFixed(2)}`;
  const dxMetrics = ctx.measureText(dxText);
  const dyMetrics = ctx.measureText(dyText);
  const maxWidth = Math.max(dxMetrics.width, dyMetrics.width);

  const infoX = endScreen.x + 25;
  const infoY = endScreen.y + 10;
  ctx.fillStyle = "rgba(20, 20, 35, 0.9)";
  ctx.fillRect(infoX - 4, infoY - 8, maxWidth + 8, 30);
  ctx.fillStyle = "#90ee90";
  ctx.textAlign = "left";
  ctx.fillText(dxText, infoX, infoY);
  ctx.fillText(dyText, infoX, infoY + 14);

  ctx.restore();
}
