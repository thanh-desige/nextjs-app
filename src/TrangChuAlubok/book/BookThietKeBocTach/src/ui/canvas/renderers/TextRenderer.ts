/**
 * TextRenderer - Specialized text rendering utilities
 * Handles text measurement, word wrapping, and styled text
 */

export interface Point {
  x: number;
  y: number;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  baseline?: "top" | "middle" | "bottom";
  maxWidth?: number;
  lineHeight?: number;
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
 * Build font string from style
 */
function buildFontString(style: TextStyle, zoom: number): string {
  const scaledSize = Math.max(8, style.fontSize * zoom);
  const weight = style.bold ? "bold" : "normal";
  const fontStyle = style.italic ? "italic" : "normal";
  return `${fontStyle} ${weight} ${scaledSize}px ${style.fontFamily}`;
}

/**
 * Measure text width
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextStyle,
  zoom: number
): number {
  ctx.font = buildFontString(style, zoom);
  return ctx.measureText(text).width;
}

/**
 * Word wrap text to fit within maxWidth
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextStyle,
  zoom: number
): string[] {
  if (!style.maxWidth) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  ctx.font = buildFontString(style, zoom);

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > style.maxWidth * zoom && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Render text at world position
 */
export function renderText(
  text: string,
  worldPos: Point,
  style: TextStyle,
  context: RenderContext
): void {
  const { ctx, centerX, centerY, zoom } = context;
  const screenPos = worldToScreen(worldPos, centerX, centerY, zoom);

  ctx.save();
  ctx.font = buildFontString(style, zoom);
  ctx.fillStyle = style.color;
  ctx.textAlign = style.align || "left";
  ctx.textBaseline = style.baseline || "top";

  const lines = wrapText(ctx, text, style, zoom);
  const lineHeight = (style.lineHeight || 1.2) * style.fontSize * zoom;

  let y = screenPos.y;
  for (const line of lines) {
    ctx.fillText(line, screenPos.x, y);

    // Draw underline if needed
    if (style.underline) {
      const textWidth = ctx.measureText(line).width;
      const underlineY = y + lineHeight * 0.1;
      ctx.beginPath();
      ctx.moveTo(screenPos.x, underlineY);
      ctx.lineTo(screenPos.x + textWidth, underlineY);
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    y += lineHeight;
  }

  ctx.restore();
}

/**
 * Render multi-line text
 */
export function renderMultilineText(
  lines: string[],
  worldPos: Point,
  style: TextStyle,
  context: RenderContext
): void {
  const { ctx, centerX, centerY, zoom } = context;
  const screenPos = worldToScreen(worldPos, centerX, centerY, zoom);

  ctx.save();
  ctx.font = buildFontString(style, zoom);
  ctx.fillStyle = style.color;
  ctx.textAlign = style.align || "left";
  ctx.textBaseline = style.baseline || "top";

  const lineHeight = (style.lineHeight || 1.2) * style.fontSize * zoom;

  let y = screenPos.y;
  for (const line of lines) {
    ctx.fillText(line, screenPos.x, y);
    y += lineHeight;
  }

  ctx.restore();
}

/**
 * Get text bounding box in world coordinates
 */
export function getTextBounds(
  text: string,
  worldPos: Point,
  style: TextStyle,
  ctx: CanvasRenderingContext2D,
  zoom: number
): { minX: number; maxX: number; minY: number; maxY: number } {
  ctx.font = buildFontString(style, zoom);
  const metrics = ctx.measureText(text);
  const width = metrics.width / zoom;
  const height = style.fontSize;

  return {
    minX: worldPos.x,
    maxX: worldPos.x + width,
    minY: worldPos.y - height,
    maxY: worldPos.y,
  };
}
