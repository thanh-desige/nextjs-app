/**
 * ExportPNG - PNG export functionality for CAD drawings
 * STEP-5.6: Extracted from ExportManager.ts
 */

import { CadEntity } from "../../ui/canvas/CadDrawingCanvas";
import type { ExportOptions, ExportResult } from "./ExportManager";
import { calculateBounds } from "./ExportUtils";

// ==================== PNG Export ====================

export function exportToPNG(
  entities: CadEntity[],
  canvas: HTMLCanvasElement,
  options: ExportOptions,
): ExportResult {
  try {
    // Create offscreen canvas
    const offscreen = document.createElement("canvas");
    const width = options.width || canvas.width;
    const height = options.height || canvas.height;
    offscreen.width = width;
    offscreen.height = height;

    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      return { success: false, error: "Cannot get canvas context" };
    }

    // Background
    ctx.fillStyle = options.backgroundColor || "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Grid (optional)
    if (options.includeGrid) {
      drawGrid(ctx, width, height, 20);
    }

    // Draw entities
    for (const entity of entities) {
      if (entity.visible === false) continue;
      drawEntityToCanvas(ctx, entity);
    }

    // Convert to blob
    return new Promise<ExportResult>((resolve) => {
      offscreen.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              success: true,
              data: blob,
              filename: `${options.title || "drawing"}.png`,
            });
          } else {
            resolve({ success: false, error: "Failed to create PNG blob" });
          }
        },
        "image/png",
        1.0,
      );
    }) as unknown as ExportResult;
  } catch (error) {
    return {
      success: false,
      error: `PNG export failed: ${error}`,
    };
  }
}

export async function exportToPNGAsync(
  entities: CadEntity[],
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    const width = options.width || 800;
    const height = options.height || 600;

    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;

    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      return { success: false, error: "Cannot get canvas context" };
    }

    // Background
    ctx.fillStyle = options.backgroundColor || "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Grid (optional)
    if (options.includeGrid) {
      drawGrid(ctx, width, height, 20);
    }

    // Calculate transform to fit content
    const bounds = calculateBounds(entities);
    const margin = options.margin || 20;
    const scale = options.scale || 1;

    ctx.save();
    ctx.translate(margin - bounds.min.x * scale, margin - bounds.min.y * scale);
    ctx.scale(scale, scale);

    // Draw entities
    for (const entity of entities) {
      if (entity.visible === false) continue;
      drawEntityToCanvas(ctx, entity);
    }

    ctx.restore();

    // Convert to blob
    return new Promise<ExportResult>((resolve) => {
      offscreen.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              success: true,
              data: blob,
              filename: `${options.title || "drawing"}.png`,
            });
          } else {
            resolve({ success: false, error: "Failed to create PNG blob" });
          }
        },
        "image/png",
        1.0,
      );
    });
  } catch (error) {
    return {
      success: false,
      error: `PNG export failed: ${error}`,
    };
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
): void {
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.5;

  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawEntityToCanvas(
  ctx: CanvasRenderingContext2D,
  entity: CadEntity,
): void {
  ctx.strokeStyle = entity.color || "#FFFFFF";
  ctx.lineWidth = entity.lineWidth || 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (entity.type) {
    case "line":
      if (entity.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(entity.points[0].x, entity.points[0].y);
      ctx.lineTo(entity.points[1].x, entity.points[1].y);
      ctx.stroke();
      break;

    case "polyline":
      if (entity.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(entity.points[0].x, entity.points[0].y);
      for (let i = 1; i < entity.points.length; i++) {
        ctx.lineTo(entity.points[i].x, entity.points[i].y);
      }
      ctx.stroke();
      break;

    case "rect":
      if (entity.points.length < 2) return;
      const x = Math.min(entity.points[0].x, entity.points[1].x);
      const y = Math.min(entity.points[0].y, entity.points[1].y);
      const w = Math.abs(entity.points[1].x - entity.points[0].x);
      const h = Math.abs(entity.points[1].y - entity.points[0].y);
      ctx.strokeRect(x, y, w, h);
      break;

    case "circle":
      if (entity.points.length < 2) return;
      ctx.beginPath();
      ctx.arc(
        entity.points[0].x,
        entity.points[0].y,
        entity.points[1].x,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
  }
}
