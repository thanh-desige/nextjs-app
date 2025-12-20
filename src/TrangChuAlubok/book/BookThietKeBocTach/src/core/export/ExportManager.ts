/**
 * ExportManager - Export CAD drawings to various formats
 * Supports: PDF, SVG, PNG, DXF
 */

import { CadEntity, Point } from "../../ui/canvas/CadDrawingCanvas";
import { Layer } from "../layers/LayerManager";

// ==================== Types ====================

export type ExportFormat = "pdf" | "svg" | "png" | "dxf";

export interface ExportOptions {
  format: ExportFormat;
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  includeLayers?: string[];
  excludeLayers?: string[];
  includeGrid?: boolean;
  includeDimensions?: boolean;
  title?: string;
  author?: string;
  margin?: number;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename?: string;
  error?: string;
}

// ==================== Export Manager ====================

export class ExportManager {
  // ==================== SVG Export ====================

  static exportToSVG(
    entities: CadEntity[],
    options: ExportOptions
  ): ExportResult {
    try {
      const width = options.width || 800;
      const height = options.height || 600;
      const scale = options.scale || 1;
      const margin = options.margin || 20;
      const bgColor = options.backgroundColor || "#1a1a2e";

      // Calculate bounds
      const bounds = this.calculateBounds(entities);
      const contentWidth = (bounds.max.x - bounds.min.x) * scale + margin * 2;
      const contentHeight = (bounds.max.y - bounds.min.y) * scale + margin * 2;

      const svgWidth = Math.max(width, contentWidth);
      const svgHeight = Math.max(height, contentHeight);

      // Start SVG
      let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${svgWidth}" height="${svgHeight}" 
     viewBox="0 0 ${svgWidth} ${svgHeight}">
  <title>${options.title || "CAD Drawing"}</title>
  <desc>Exported from CAD Thiết Kế Bóc Tách</desc>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="${bgColor}"/>
  
  <!-- Grid (optional) -->
  ${options.includeGrid ? this.generateSVGGrid(svgWidth, svgHeight, 20) : ""}
  
  <!-- Entities -->
  <g transform="translate(${margin - bounds.min.x * scale}, ${
        margin - bounds.min.y * scale
      }) scale(${scale})">
`;

      // Add entities
      for (const entity of entities) {
        if (entity.visible === false) continue;
        svg += this.entityToSVG(entity);
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

  private static entityToSVG(entity: CadEntity): string {
    const stroke = entity.color || "#FFFFFF";
    const strokeWidth = entity.lineWidth || 1;
    const opacity = entity.visible === false ? 0 : 1;

    switch (entity.type) {
      case "line":
        if (entity.points.length < 2) return "";
        return `    <line x1="${entity.points[0].x}" y1="${entity.points[0].y}" 
                   x2="${entity.points[1].x}" y2="${entity.points[1].y}" 
                   stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
`;

      case "polyline":
        if (entity.points.length < 2) return "";
        const points = entity.points.map((p) => `${p.x},${p.y}`).join(" ");
        return `    <polyline points="${points}" 
                      stroke="${stroke}" stroke-width="${strokeWidth}" 
                      fill="none" opacity="${opacity}"/>
`;

      case "rect":
        if (entity.points.length < 2) return "";
        const x = Math.min(entity.points[0].x, entity.points[1].x);
        const y = Math.min(entity.points[0].y, entity.points[1].y);
        const w = Math.abs(entity.points[1].x - entity.points[0].x);
        const h = Math.abs(entity.points[1].y - entity.points[0].y);
        return `    <rect x="${x}" y="${y}" width="${w}" height="${h}" 
                   stroke="${stroke}" stroke-width="${strokeWidth}" 
                   fill="none" opacity="${opacity}"/>
`;

      case "circle":
        if (entity.points.length < 2) return "";
        const cx = entity.points[0].x;
        const cy = entity.points[0].y;
        const r = entity.points[1].x; // radius stored in x
        return `    <circle cx="${cx}" cy="${cy}" r="${r}" 
                     stroke="${stroke}" stroke-width="${strokeWidth}" 
                     fill="none" opacity="${opacity}"/>
`;

      default:
        return "";
    }
  }

  private static generateSVGGrid(
    width: number,
    height: number,
    spacing: number
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

  // ==================== PNG Export ====================

  static exportToPNG(
    entities: CadEntity[],
    canvas: HTMLCanvasElement,
    options: ExportOptions
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
        this.drawGrid(ctx, width, height, 20);
      }

      // Draw entities
      for (const entity of entities) {
        if (entity.visible === false) continue;
        this.drawEntityToCanvas(ctx, entity);
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
          1.0
        );
      }) as unknown as ExportResult;
    } catch (error) {
      return {
        success: false,
        error: `PNG export failed: ${error}`,
      };
    }
  }

  static async exportToPNGAsync(
    entities: CadEntity[],
    options: ExportOptions
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
        this.drawGrid(ctx, width, height, 20);
      }

      // Calculate transform to fit content
      const bounds = this.calculateBounds(entities);
      const margin = options.margin || 20;
      const scale = options.scale || 1;

      ctx.save();
      ctx.translate(
        margin - bounds.min.x * scale,
        margin - bounds.min.y * scale
      );
      ctx.scale(scale, scale);

      // Draw entities
      for (const entity of entities) {
        if (entity.visible === false) continue;
        this.drawEntityToCanvas(ctx, entity);
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
          1.0
        );
      });
    } catch (error) {
      return {
        success: false,
        error: `PNG export failed: ${error}`,
      };
    }
  }

  private static drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number
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

  private static drawEntityToCanvas(
    ctx: CanvasRenderingContext2D,
    entity: CadEntity
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
          Math.PI * 2
        );
        ctx.stroke();
        break;
    }
  }

  // ==================== DXF Export ====================

  static exportToDXF(
    entities: CadEntity[],
    layers: Layer[],
    options: ExportOptions
  ): ExportResult {
    try {
      let dxf = "";

      // Header section
      dxf += `0
SECTION
2
HEADER
0
ENDSEC
`;

      // Tables section (layers)
      dxf += `0
SECTION
2
TABLES
0
TABLE
2
LAYER
`;

      for (const layer of layers) {
        const colorIndex = this.rgbToAciColor(layer.color);
        dxf += `0
LAYER
2
${layer.name}
70
${layer.frozen ? 1 : 0}
62
${layer.visible ? colorIndex : -colorIndex}
6
CONTINUOUS
`;
      }

      dxf += `0
ENDTAB
0
ENDSEC
`;

      // Entities section
      dxf += `0
SECTION
2
ENTITIES
`;

      for (const entity of entities) {
        if (entity.visible === false) continue;
        dxf += this.entityToDXF(entity);
      }

      dxf += `0
ENDSEC
0
EOF
`;

      return {
        success: true,
        data: dxf,
        filename: `${options.title || "drawing"}.dxf`,
      };
    } catch (error) {
      return {
        success: false,
        error: `DXF export failed: ${error}`,
      };
    }
  }

  private static entityToDXF(entity: CadEntity): string {
    const layer = entity.layer || "0";
    const colorIndex = this.rgbToAciColor(entity.color);

    switch (entity.type) {
      case "line":
        if (entity.points.length < 2) return "";
        return `0
LINE
8
${layer}
62
${colorIndex}
10
${entity.points[0].x}
20
${entity.points[0].y}
30
0
11
${entity.points[1].x}
21
${entity.points[1].y}
31
0
`;

      case "polyline":
        if (entity.points.length < 2) return "";
        let polyDxf = `0
LWPOLYLINE
8
${layer}
62
${colorIndex}
90
${entity.points.length}
70
0
`;
        for (const p of entity.points) {
          polyDxf += `10
${p.x}
20
${p.y}
`;
        }
        return polyDxf;

      case "rect":
        if (entity.points.length < 2) return "";
        const x1 = entity.points[0].x;
        const y1 = entity.points[0].y;
        const x2 = entity.points[1].x;
        const y2 = entity.points[1].y;
        return `0
LWPOLYLINE
8
${layer}
62
${colorIndex}
90
4
70
1
10
${x1}
20
${y1}
10
${x2}
20
${y1}
10
${x2}
20
${y2}
10
${x1}
20
${y2}
`;

      case "circle":
        if (entity.points.length < 2) return "";
        return `0
CIRCLE
8
${layer}
62
${colorIndex}
10
${entity.points[0].x}
20
${entity.points[0].y}
30
0
40
${entity.points[1].x}
`;

      default:
        return "";
    }
  }

  private static rgbToAciColor(hex: string): number {
    // Simple mapping of common colors to AutoCAD Color Index
    const colorMap: Record<string, number> = {
      "#FF0000": 1, // Red
      "#FFFF00": 2, // Yellow
      "#00FF00": 3, // Green
      "#00FFFF": 4, // Cyan
      "#0000FF": 5, // Blue
      "#FF00FF": 6, // Magenta
      "#FFFFFF": 7, // White
      "#808080": 8, // Gray
      "#C0C0C0": 9, // Light gray
    };
    return colorMap[hex.toUpperCase()] || 7;
  }

  // ==================== Utility Functions ====================

  private static calculateBounds(entities: CadEntity[]): {
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
    }

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  }

  // ==================== Download Helper ====================

  static downloadFile(data: string | Blob, filename: string): void {
    const blob =
      typeof data === "string"
        ? new Blob([data], { type: "text/plain" })
        : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default ExportManager;
