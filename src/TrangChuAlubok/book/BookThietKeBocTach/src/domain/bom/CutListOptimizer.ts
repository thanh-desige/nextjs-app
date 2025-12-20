/**
 * CutListOptimizer.ts
 * Optimizes cutting of aluminum profiles to minimize waste
 */

import { CutPiece } from "../materials/Material.types";
import { CutList, CutListItem } from "./BomItem";

// ============================================================================
// Optimizer Configuration
// ============================================================================

export interface CutOptimizerConfig {
  bladeWidth: number; // mm - Saw blade kerf
  minCutLength: number; // mm - Minimum usable cut piece
  maxWastePercent: number; // % - Maximum acceptable waste
  stockLengths: number[]; // Available stock lengths
}

const DEFAULT_CONFIG: CutOptimizerConfig = {
  bladeWidth: 3, // 3mm saw kerf
  minCutLength: 50, // Minimum 50mm piece
  maxWastePercent: 15, // Max 15% waste
  stockLengths: [6000, 5800, 4000], // Standard lengths
};

// ============================================================================
// Cut Pattern Result
// ============================================================================

export interface CutPattern {
  stockLength: number;
  pieces: {
    length: number;
    quantity: number;
    label: string;
    position: number; // Start position in stock
  }[];
  usedLength: number;
  wasteLength: number;
  wastePercent: number;
}

export interface OptimizationResult {
  patterns: CutPattern[];
  totalStocksNeeded: number;
  totalWaste: number;
  totalUsed: number;
  wastePercent: number;
  efficiency: number; // 0-100
  algorithm: string;
}

// ============================================================================
// Cut List Optimizer
// ============================================================================

export class CutListOptimizer {
  private config: CutOptimizerConfig;

  constructor(config?: Partial<CutOptimizerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Main Optimization Methods
  // --------------------------------------------------------------------------

  /**
   * Optimize cutting for a list of pieces
   */
  optimize(
    pieces: CutPiece[],
    stockLength?: number,
    algorithm: "first-fit" | "best-fit" | "ffd" = "ffd"
  ): OptimizationResult {
    // Use provided stock length or default
    const stock = stockLength || this.config.stockLengths[0];

    // Expand pieces by quantity
    const expandedPieces = this.expandPieces(pieces);

    switch (algorithm) {
      case "first-fit":
        return this.firstFitDecreasing(expandedPieces, stock);
      case "best-fit":
        return this.bestFitDecreasing(expandedPieces, stock);
      case "ffd":
      default:
        return this.firstFitDecreasing(expandedPieces, stock);
    }
  }

  /**
   * Generate cut list from optimization result
   */
  generateCutList(
    materialId: string,
    materialCode: string,
    materialName: string,
    result: OptimizationResult
  ): CutListItem {
    const cutPieces = result.patterns.flatMap((pattern) =>
      pattern.pieces.map((p) => ({
        length: p.length,
        quantity: p.quantity,
        label: p.label,
        angle1: 45, // Default angle
        angle2: 45,
      }))
    );

    // Aggregate by length
    const aggregated = this.aggregatePieces(cutPieces);

    return {
      id: `cut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      materialId,
      materialCode,
      materialName,
      stockLength:
        result.patterns[0]?.stockLength || this.config.stockLengths[0],
      cutPieces: aggregated,
      usedLength: result.totalUsed,
      wasteLength: result.totalWaste,
      wastePercent: result.wastePercent,
      stocksNeeded: result.totalStocksNeeded,
    };
  }

  // --------------------------------------------------------------------------
  // First Fit Decreasing Algorithm
  // --------------------------------------------------------------------------

  private firstFitDecreasing(
    pieces: { length: number; label: string }[],
    stockLength: number
  ): OptimizationResult {
    // Sort pieces by length descending
    const sorted = [...pieces].sort((a, b) => b.length - a.length);

    const patterns: CutPattern[] = [];

    for (const piece of sorted) {
      let placed = false;

      // Try to fit in existing patterns
      for (const pattern of patterns) {
        if (this.canFit(pattern, piece.length, stockLength)) {
          this.addPiece(pattern, piece);
          placed = true;
          break;
        }
      }

      // Create new pattern if doesn't fit
      if (!placed) {
        const newPattern = this.createPattern(stockLength);
        this.addPiece(newPattern, piece);
        patterns.push(newPattern);
      }
    }

    return this.createResult(patterns, "first-fit-decreasing");
  }

  // --------------------------------------------------------------------------
  // Best Fit Decreasing Algorithm
  // --------------------------------------------------------------------------

  private bestFitDecreasing(
    pieces: { length: number; label: string }[],
    stockLength: number
  ): OptimizationResult {
    // Sort pieces by length descending
    const sorted = [...pieces].sort((a, b) => b.length - a.length);

    const patterns: CutPattern[] = [];

    for (const piece of sorted) {
      let bestPattern: CutPattern | null = null;
      let minRemainder = Infinity;

      // Find pattern with minimum remaining space
      for (const pattern of patterns) {
        if (this.canFit(pattern, piece.length, stockLength)) {
          const remainder =
            stockLength -
            pattern.usedLength -
            piece.length -
            this.config.bladeWidth;
          if (remainder < minRemainder) {
            minRemainder = remainder;
            bestPattern = pattern;
          }
        }
      }

      if (bestPattern) {
        this.addPiece(bestPattern, piece);
      } else {
        const newPattern = this.createPattern(stockLength);
        this.addPiece(newPattern, piece);
        patterns.push(newPattern);
      }
    }

    return this.createResult(patterns, "best-fit-decreasing");
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private expandPieces(
    pieces: CutPiece[]
  ): { length: number; label: string }[] {
    const expanded: { length: number; label: string }[] = [];

    for (const piece of pieces) {
      for (let i = 0; i < piece.quantity; i++) {
        expanded.push({
          length: piece.length,
          label: piece.label,
        });
      }
    }

    return expanded;
  }

  private createPattern(stockLength: number): CutPattern {
    return {
      stockLength,
      pieces: [],
      usedLength: 0,
      wasteLength: stockLength,
      wastePercent: 100,
    };
  }

  private canFit(
    pattern: CutPattern,
    pieceLength: number,
    stockLength: number
  ): boolean {
    const totalNeeded =
      pattern.usedLength +
      pieceLength +
      (pattern.pieces.length > 0 ? this.config.bladeWidth : 0);
    return totalNeeded <= stockLength;
  }

  private addPiece(
    pattern: CutPattern,
    piece: { length: number; label: string }
  ): void {
    const position =
      pattern.usedLength +
      (pattern.pieces.length > 0 ? this.config.bladeWidth : 0);

    pattern.pieces.push({
      length: piece.length,
      quantity: 1,
      label: piece.label,
      position,
    });

    pattern.usedLength = position + piece.length;
    pattern.wasteLength = pattern.stockLength - pattern.usedLength;
    pattern.wastePercent = (pattern.wasteLength / pattern.stockLength) * 100;
  }

  private createResult(
    patterns: CutPattern[],
    algorithm: string
  ): OptimizationResult {
    const totalStocksNeeded = patterns.length;
    const totalStock = patterns.reduce((sum, p) => sum + p.stockLength, 0);
    const totalUsed = patterns.reduce((sum, p) => sum + p.usedLength, 0);
    const totalWaste = totalStock - totalUsed;
    const wastePercent = totalStock > 0 ? (totalWaste / totalStock) * 100 : 0;
    const efficiency = 100 - wastePercent;

    return {
      patterns,
      totalStocksNeeded,
      totalWaste,
      totalUsed,
      wastePercent,
      efficiency,
      algorithm,
    };
  }

  private aggregatePieces(
    pieces: {
      length: number;
      quantity: number;
      label: string;
      angle1: number;
      angle2: number;
    }[]
  ): {
    length: number;
    quantity: number;
    label: string;
    angle1: number;
    angle2: number;
  }[] {
    const map = new Map<number, (typeof pieces)[0]>();

    for (const piece of pieces) {
      const existing = map.get(piece.length);
      if (existing) {
        existing.quantity += piece.quantity;
      } else {
        map.set(piece.length, { ...piece });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.length - a.length);
  }

  // --------------------------------------------------------------------------
  // Multi-Stock Optimization
  // --------------------------------------------------------------------------

  /**
   * Optimize using multiple available stock lengths
   */
  optimizeMultiStock(pieces: CutPiece[]): OptimizationResult {
    const expandedPieces = this.expandPieces(pieces);
    const sorted = [...expandedPieces].sort((a, b) => b.length - a.length);

    const patterns: CutPattern[] = [];

    for (const piece of sorted) {
      let placed = false;
      let bestPattern: CutPattern | null = null;
      let minRemainder = Infinity;

      // Try existing patterns
      for (const pattern of patterns) {
        if (this.canFit(pattern, piece.length, pattern.stockLength)) {
          const remainder =
            pattern.stockLength -
            pattern.usedLength -
            piece.length -
            this.config.bladeWidth;
          if (remainder < minRemainder) {
            minRemainder = remainder;
            bestPattern = pattern;
          }
        }
      }

      if (bestPattern) {
        this.addPiece(bestPattern, piece);
        placed = true;
      }

      // Create new pattern with smallest suitable stock
      if (!placed) {
        const suitableStock = this.config.stockLengths
          .filter((s) => s >= piece.length)
          .sort((a, b) => a - b)[0];

        if (suitableStock) {
          const newPattern = this.createPattern(suitableStock);
          this.addPiece(newPattern, piece);
          patterns.push(newPattern);
        }
      }
    }

    return this.createResult(patterns, "multi-stock-best-fit");
  }

  // --------------------------------------------------------------------------
  // Visualization Helpers
  // --------------------------------------------------------------------------

  /**
   * Generate SVG representation of cut pattern
   */
  generatePatternSvg(pattern: CutPattern, scale = 0.1): string {
    const width = pattern.stockLength * scale;
    const height = 40;

    let svg = `<svg width="${width + 20}" height="${
      height + 20
    }" xmlns="http://www.w3.org/2000/svg">`;

    // Background (stock)
    svg += `<rect x="10" y="10" width="${width}" height="${height}" fill="#e0e0e0" stroke="#333"/>`;

    // Pieces
    let x = 10;
    const colors = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"];

    pattern.pieces.forEach((piece, i) => {
      const pieceWidth = piece.length * scale;
      const color = colors[i % colors.length];

      svg += `<rect x="${x}" y="10" width="${pieceWidth}" height="${height}" fill="${color}" stroke="#333"/>`;
      svg += `<text x="${
        x + pieceWidth / 2
      }" y="35" text-anchor="middle" font-size="10">${piece.length}</text>`;

      x += pieceWidth + this.config.bladeWidth * scale;
    });

    // Waste
    if (pattern.wasteLength > 0) {
      svg += `<rect x="${x}" y="10" width="${
        pattern.wasteLength * scale
      }" height="${height}" fill="#ff5252" stroke="#333" opacity="0.5"/>`;
    }

    svg += "</svg>";
    return svg;
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  updateConfig(config: Partial<CutOptimizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CutOptimizerConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Full Cut List Generator
// ============================================================================

export function generateFullCutList(
  bomId: string,
  cutListItems: CutListItem[],
  algorithm:
    | "first-fit"
    | "best-fit"
    | "genetic"
    | "linear-programming" = "best-fit"
): CutList {
  const totalStocksNeeded = cutListItems.reduce(
    (sum, item) => sum + item.stocksNeeded,
    0
  );
  const totalWasteLength = cutListItems.reduce(
    (sum, item) => sum + item.wasteLength,
    0
  );
  const totalUsedLength = cutListItems.reduce(
    (sum, item) => sum + item.usedLength,
    0
  );
  const totalLength = totalUsedLength + totalWasteLength;
  const averageWastePercent =
    totalLength > 0 ? (totalWasteLength / totalLength) * 100 : 0;
  const optimizationScore = 100 - averageWastePercent;

  return {
    id: `cutlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bomId,
    items: cutListItems,
    totalStocksNeeded,
    totalWasteLength,
    averageWastePercent,
    optimizationScore,
    createdAt: new Date(),
    algorithm,
  };
}
