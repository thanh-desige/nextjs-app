/**
 * GlassCutCalculator.ts
 * Optimizes glass sheet cutting to minimize waste using 2D bin packing
 */

import { GlassPiece } from "../materials/Material.types";
import { GlassCutItem, GlassCutList } from "./BomItem";

// ============================================================================
// Configuration
// ============================================================================

export interface GlassCutConfig {
  bladeWidth: number; // mm - Saw blade kerf
  edgeMargin: number; // mm - Margin from sheet edge
  minPieceSize: number; // mm - Minimum cut dimension
  allowRotation: boolean; // Allow 90° rotation
  standardSheets: {
    width: number;
    height: number;
  }[];
}

const DEFAULT_CONFIG: GlassCutConfig = {
  bladeWidth: 3,
  edgeMargin: 10,
  minPieceSize: 100,
  allowRotation: true,
  standardSheets: [
    { width: 2440, height: 3660 }, // Standard sheet
    { width: 2440, height: 3050 },
    { width: 2134, height: 3660 },
    { width: 1830, height: 2440 },
  ],
};

// ============================================================================
// Cut Pattern Types
// ============================================================================

export interface PlacedPiece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  label: string;
}

export interface SheetPattern {
  sheetIndex: number;
  sheetWidth: number;
  sheetHeight: number;
  pieces: PlacedPiece[];
  usedArea: number;
  wasteArea: number;
  efficiency: number;
}

export interface GlassOptimizationResult {
  patterns: SheetPattern[];
  totalSheetsNeeded: number;
  totalUsedArea: number;
  totalWasteArea: number;
  efficiency: number;
  algorithm: string;
}

// ============================================================================
// Rectangle for MaxRects Algorithm
// ============================================================================

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Glass Cut Calculator
// ============================================================================

export class GlassCutCalculator {
  private config: GlassCutConfig;

  constructor(config?: Partial<GlassCutConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Main Optimization Method
  // --------------------------------------------------------------------------

  /**
   * Optimize glass cutting using MaxRects algorithm
   */
  optimize(
    pieces: GlassPiece[],
    sheetSize?: { width: number; height: number },
    algorithm: "guillotine" | "maxrects" = "maxrects"
  ): GlassOptimizationResult {
    const sheet = sheetSize || this.config.standardSheets[0];

    // Expand pieces by quantity
    const expandedPieces = this.expandPieces(pieces);

    if (algorithm === "guillotine") {
      return this.guillotinePacking(expandedPieces, sheet);
    }

    return this.maxRectsPacking(expandedPieces, sheet);
  }

  /**
   * Generate cut list from optimization result
   */
  generateGlassCutItem(
    materialId: string,
    materialCode: string,
    materialName: string,
    thickness: number,
    result: GlassOptimizationResult
  ): GlassCutItem {
    const pieces = result.patterns.flatMap((pattern) =>
      pattern.pieces.map((p) => ({
        width: p.rotated ? p.height : p.width,
        height: p.rotated ? p.width : p.height,
        quantity: 1,
        label: p.label,
        rotation: p.rotated,
      }))
    );

    // Aggregate by size
    const aggregated = this.aggregatePieces(pieces);

    const pattern = result.patterns.flatMap((sheet, sheetIndex) =>
      sheet.pieces.map((p) => ({
        sheetIndex,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        rotated: p.rotated,
        label: p.label,
      }))
    );

    return {
      id: `glass-cut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      materialId,
      materialCode,
      materialName,
      thickness,
      stockWidth:
        result.patterns[0]?.sheetWidth || this.config.standardSheets[0].width,
      stockHeight:
        result.patterns[0]?.sheetHeight || this.config.standardSheets[0].height,
      pieces: aggregated,
      usedArea: result.totalUsedArea,
      wasteArea: result.totalWasteArea,
      wastePercent:
        (result.totalWasteArea /
          (result.totalUsedArea + result.totalWasteArea)) *
        100,
      sheetsNeeded: result.totalSheetsNeeded,
      pattern,
    };
  }

  // --------------------------------------------------------------------------
  // MaxRects Bin Packing Algorithm
  // --------------------------------------------------------------------------

  private maxRectsPacking(
    pieces: { width: number; height: number; label: string }[],
    sheet: { width: number; height: number }
  ): GlassOptimizationResult {
    const patterns: SheetPattern[] = [];

    // Sort pieces by area (largest first)
    const sorted = [...pieces].sort(
      (a, b) => b.width * b.height - a.width * a.height
    );

    const remaining = [...sorted];
    let sheetIndex = 0;

    while (remaining.length > 0) {
      const pattern = this.packSheet(remaining, sheet, sheetIndex);
      patterns.push(pattern);
      sheetIndex++;

      // Remove placed pieces
      for (const placed of pattern.pieces) {
        const index = remaining.findIndex(
          (p) =>
            p.label === placed.label &&
            ((p.width === placed.width && p.height === placed.height) ||
              (this.config.allowRotation &&
                p.width === placed.height &&
                p.height === placed.width))
        );
        if (index >= 0) {
          remaining.splice(index, 1);
        }
      }
    }

    return this.createResult(patterns);
  }

  private packSheet(
    pieces: { width: number; height: number; label: string }[],
    sheet: { width: number; height: number },
    sheetIndex: number
  ): SheetPattern {
    const usableWidth = sheet.width - 2 * this.config.edgeMargin;
    const usableHeight = sheet.height - 2 * this.config.edgeMargin;

    // Initialize free rectangles with the entire sheet
    const freeRects: Rect[] = [
      {
        x: this.config.edgeMargin,
        y: this.config.edgeMargin,
        width: usableWidth,
        height: usableHeight,
      },
    ];

    const placedPieces: PlacedPiece[] = [];
    let pieceId = 0;

    for (const piece of pieces) {
      const result = this.findBestPosition(piece, freeRects);

      if (result) {
        const placed: PlacedPiece = {
          id: `piece-${sheetIndex}-${pieceId++}`,
          x: result.x,
          y: result.y,
          width: result.rotated ? piece.height : piece.width,
          height: result.rotated ? piece.width : piece.height,
          rotated: result.rotated,
          label: piece.label,
        };

        placedPieces.push(placed);

        // Split free rectangles
        this.splitFreeRects(freeRects, placed);

        // Remove redundant rectangles
        this.pruneFreeRects(freeRects);
      }
    }

    const sheetArea = sheet.width * sheet.height;
    const usedArea = placedPieces.reduce(
      (sum, p) => sum + p.width * p.height,
      0
    );
    const wasteArea = sheetArea - usedArea;

    return {
      sheetIndex,
      sheetWidth: sheet.width,
      sheetHeight: sheet.height,
      pieces: placedPieces,
      usedArea,
      wasteArea,
      efficiency: (usedArea / sheetArea) * 100,
    };
  }

  private findBestPosition(
    piece: { width: number; height: number },
    freeRects: Rect[]
  ): { x: number; y: number; rotated: boolean } | null {
    let bestRect: Rect | null = null;
    let bestRotated = false;
    let bestScore = Infinity;

    for (const rect of freeRects) {
      // Try normal orientation
      if (piece.width <= rect.width && piece.height <= rect.height) {
        const score = this.scorePlacement(rect, piece.width, piece.height);
        if (score < bestScore) {
          bestScore = score;
          bestRect = rect;
          bestRotated = false;
        }
      }

      // Try rotated orientation
      if (
        this.config.allowRotation &&
        piece.height <= rect.width &&
        piece.width <= rect.height
      ) {
        const score = this.scorePlacement(rect, piece.height, piece.width);
        if (score < bestScore) {
          bestScore = score;
          bestRect = rect;
          bestRotated = true;
        }
      }
    }

    if (bestRect) {
      return {
        x: bestRect.x,
        y: bestRect.y,
        rotated: bestRotated,
      };
    }

    return null;
  }

  private scorePlacement(rect: Rect, width: number, height: number): number {
    // Best Short Side Fit (BSSF) scoring
    const leftoverWidth = rect.width - width;
    const leftoverHeight = rect.height - height;
    return Math.min(leftoverWidth, leftoverHeight);
  }

  private splitFreeRects(freeRects: Rect[], placed: PlacedPiece): void {
    const newRects: Rect[] = [];

    for (let i = freeRects.length - 1; i >= 0; i--) {
      const rect = freeRects[i];

      if (this.intersects(rect, placed)) {
        // Split the rectangle
        const splits = this.splitRect(rect, placed);
        newRects.push(...splits);
        freeRects.splice(i, 1);
      }
    }

    freeRects.push(...newRects);
  }

  private intersects(rect: Rect, placed: PlacedPiece): boolean {
    return !(
      placed.x >= rect.x + rect.width ||
      placed.x + placed.width <= rect.x ||
      placed.y >= rect.y + rect.height ||
      placed.y + placed.height <= rect.y
    );
  }

  private splitRect(rect: Rect, placed: PlacedPiece): Rect[] {
    const result: Rect[] = [];
    const blade = this.config.bladeWidth;

    // Left
    if (placed.x > rect.x) {
      result.push({
        x: rect.x,
        y: rect.y,
        width: placed.x - rect.x - blade,
        height: rect.height,
      });
    }

    // Right
    if (placed.x + placed.width < rect.x + rect.width) {
      result.push({
        x: placed.x + placed.width + blade,
        y: rect.y,
        width: rect.x + rect.width - placed.x - placed.width - blade,
        height: rect.height,
      });
    }

    // Bottom
    if (placed.y > rect.y) {
      result.push({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: placed.y - rect.y - blade,
      });
    }

    // Top
    if (placed.y + placed.height < rect.y + rect.height) {
      result.push({
        x: rect.x,
        y: placed.y + placed.height + blade,
        width: rect.width,
        height: rect.y + rect.height - placed.y - placed.height - blade,
      });
    }

    // Filter out invalid rectangles
    return result.filter(
      (r) =>
        r.width >= this.config.minPieceSize &&
        r.height >= this.config.minPieceSize
    );
  }

  private pruneFreeRects(freeRects: Rect[]): void {
    // Remove rectangles that are contained within others
    for (let i = freeRects.length - 1; i >= 0; i--) {
      for (let j = 0; j < freeRects.length; j++) {
        if (i !== j && this.isContained(freeRects[i], freeRects[j])) {
          freeRects.splice(i, 1);
          break;
        }
      }
    }
  }

  private isContained(inner: Rect, outer: Rect): boolean {
    return (
      inner.x >= outer.x &&
      inner.y >= outer.y &&
      inner.x + inner.width <= outer.x + outer.width &&
      inner.y + inner.height <= outer.y + outer.height
    );
  }

  // --------------------------------------------------------------------------
  // Guillotine Cutting Algorithm
  // --------------------------------------------------------------------------

  private guillotinePacking(
    pieces: { width: number; height: number; label: string }[],
    sheet: { width: number; height: number }
  ): GlassOptimizationResult {
    // Simplified guillotine - uses horizontal first cut
    const patterns: SheetPattern[] = [];
    const sorted = [...pieces].sort(
      (a, b) => b.width * b.height - a.width * a.height
    );

    const remaining = [...sorted];
    let sheetIndex = 0;

    while (remaining.length > 0) {
      const pattern = this.guillotinePackSheet(remaining, sheet, sheetIndex);
      patterns.push(pattern);
      sheetIndex++;

      // Remove placed pieces
      for (const placed of pattern.pieces) {
        const index = remaining.findIndex((p) => p.label === placed.label);
        if (index >= 0) {
          remaining.splice(index, 1);
        }
      }
    }

    return this.createResult(patterns);
  }

  private guillotinePackSheet(
    pieces: { width: number; height: number; label: string }[],
    sheet: { width: number; height: number },
    sheetIndex: number
  ): SheetPattern {
    const placedPieces: PlacedPiece[] = [];
    let currentY = this.config.edgeMargin;
    let rowHeight = 0;
    let currentX = this.config.edgeMargin;
    let pieceId = 0;

    const maxX = sheet.width - this.config.edgeMargin;
    const maxY = sheet.height - this.config.edgeMargin;

    for (const piece of pieces) {
      // Check if piece fits in current row
      if (currentX + piece.width <= maxX && currentY + piece.height <= maxY) {
        placedPieces.push({
          id: `piece-${sheetIndex}-${pieceId++}`,
          x: currentX,
          y: currentY,
          width: piece.width,
          height: piece.height,
          rotated: false,
          label: piece.label,
        });

        currentX += piece.width + this.config.bladeWidth;
        rowHeight = Math.max(rowHeight, piece.height);
      } else if (
        currentY + rowHeight + this.config.bladeWidth + piece.height <=
        maxY
      ) {
        // Start new row
        currentY += rowHeight + this.config.bladeWidth;
        currentX = this.config.edgeMargin;
        rowHeight = piece.height;

        if (currentX + piece.width <= maxX) {
          placedPieces.push({
            id: `piece-${sheetIndex}-${pieceId++}`,
            x: currentX,
            y: currentY,
            width: piece.width,
            height: piece.height,
            rotated: false,
            label: piece.label,
          });

          currentX += piece.width + this.config.bladeWidth;
        }
      }
    }

    const sheetArea = sheet.width * sheet.height;
    const usedArea = placedPieces.reduce(
      (sum, p) => sum + p.width * p.height,
      0
    );
    const wasteArea = sheetArea - usedArea;

    return {
      sheetIndex,
      sheetWidth: sheet.width,
      sheetHeight: sheet.height,
      pieces: placedPieces,
      usedArea,
      wasteArea,
      efficiency: (usedArea / sheetArea) * 100,
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private expandPieces(
    pieces: GlassPiece[]
  ): { width: number; height: number; label: string }[] {
    const expanded: { width: number; height: number; label: string }[] = [];

    for (const piece of pieces) {
      for (let i = 0; i < piece.quantity; i++) {
        expanded.push({
          width: piece.width,
          height: piece.height,
          label: piece.label,
        });
      }
    }

    return expanded;
  }

  private aggregatePieces(
    pieces: {
      width: number;
      height: number;
      quantity: number;
      label: string;
      rotation: boolean;
    }[]
  ): {
    width: number;
    height: number;
    quantity: number;
    label: string;
    rotation: boolean;
  }[] {
    const map = new Map<string, (typeof pieces)[0]>();

    for (const piece of pieces) {
      const key = `${piece.width}x${piece.height}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += piece.quantity;
      } else {
        map.set(key, { ...piece });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.width * b.height - a.width * a.height
    );
  }

  private createResult(patterns: SheetPattern[]): GlassOptimizationResult {
    const totalSheetsNeeded = patterns.length;
    const totalUsedArea = patterns.reduce((sum, p) => sum + p.usedArea, 0);
    const totalWasteArea = patterns.reduce((sum, p) => sum + p.wasteArea, 0);
    const totalArea = totalUsedArea + totalWasteArea;
    const efficiency = totalArea > 0 ? (totalUsedArea / totalArea) * 100 : 0;

    return {
      patterns,
      totalSheetsNeeded,
      totalUsedArea,
      totalWasteArea,
      efficiency,
      algorithm: "maxrects",
    };
  }

  // --------------------------------------------------------------------------
  // Visualization
  // --------------------------------------------------------------------------

  /**
   * Generate SVG representation of glass cutting pattern
   */
  generatePatternSvg(pattern: SheetPattern, scale = 0.15): string {
    const width = pattern.sheetWidth * scale;
    const height = pattern.sheetHeight * scale;

    let svg = `<svg width="${width + 20}" height="${
      height + 20
    }" xmlns="http://www.w3.org/2000/svg">`;

    // Background (sheet)
    svg += `<rect x="10" y="10" width="${width}" height="${height}" fill="#e8f5e9" stroke="#333"/>`;

    // Pieces
    const colors = [
      "#81D4FA",
      "#80CBC4",
      "#C5E1A5",
      "#FFE082",
      "#FFAB91",
      "#CE93D8",
    ];

    pattern.pieces.forEach((piece, i) => {
      const x = 10 + piece.x * scale;
      const y = 10 + piece.y * scale;
      const w = piece.width * scale;
      const h = piece.height * scale;
      const color = colors[i % colors.length];

      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="#333"/>`;
      svg += `<text x="${x + w / 2}" y="${
        y + h / 2
      }" text-anchor="middle" dominant-baseline="middle" font-size="10">${
        piece.width
      }x${piece.height}</text>`;
    });

    svg += "</svg>";
    return svg;
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  updateConfig(config: Partial<GlassCutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): GlassCutConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Generate Full Glass Cut List
// ============================================================================

export function generateGlassCutList(
  bomId: string,
  cutItems: GlassCutItem[],
  algorithm: "guillotine" | "maxrects" | "genetic" = "maxrects"
): GlassCutList {
  const totalSheetsNeeded = cutItems.reduce(
    (sum, item) => sum + item.sheetsNeeded,
    0
  );
  const totalWasteArea = cutItems.reduce(
    (sum, item) => sum + item.wasteArea,
    0
  );
  const totalUsedArea = cutItems.reduce((sum, item) => sum + item.usedArea, 0);
  const totalArea = totalUsedArea + totalWasteArea;
  const averageWastePercent =
    totalArea > 0 ? (totalWasteArea / totalArea) * 100 : 0;
  const optimizationScore = 100 - averageWastePercent;

  return {
    id: `glass-cutlist-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    bomId,
    items: cutItems,
    totalSheetsNeeded,
    totalWasteArea,
    averageWastePercent,
    optimizationScore,
    createdAt: new Date(),
    algorithm,
  };
}
