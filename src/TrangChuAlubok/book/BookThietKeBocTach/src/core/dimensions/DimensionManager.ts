/**
 * DimensionManager.ts
 *
 * Quản lý dimension/kích thước trên bản vẽ CAD
 *
 * STEP-5.10: Split into thin facade + 4 extracted modules:
 * - dimension.types.ts: All type definitions + DEFAULT_DIMENSION_STYLE
 * - dimensionGeometry.ts: Pure math/geometry functions
 * - DimensionRenderer.ts: Canvas2D rendering logic
 * - QdimService.ts: Quick Dimension (QDIM) subsystem
 *
 * This file keeps: Style/scale state, factory methods, baseline/continue chain,
 * getDimensionValue, and delegation methods for backward compatibility.
 */

// Re-export all types for backward compatibility (30+ consumers)
export type {
  Point,
  EntityReference,
  DimensionType,
  DimensionDirection,
  QdimMode,
  DimensionStyle,
  DimensionEntity,
  LinearDimensionParams,
  AngularDimensionParams,
  RadiusDimensionParams,
  ArcDimensionParams,
} from "./dimension.types";

export { DEFAULT_DIMENSION_STYLE } from "./dimension.types";

// Import types for internal use
import type {
  Point,
  EntityReference,
  DimensionType,
  DimensionStyle,
  DimensionEntity,
  LinearDimensionParams,
  AngularDimensionParams,
  RadiusDimensionParams,
  ArcDimensionParams,
} from "./dimension.types";
import { DEFAULT_DIMENSION_STYLE } from "./dimension.types";

// Import extracted modules
import {
  calculateDistance as _calculateDistance,
  calculateHorizontalDistance as _calculateHorizontalDistance,
  calculateVerticalDistance as _calculateVerticalDistance,
  calculateLineIntersection as _calculateLineIntersection,
  autoDetectLinearDirection as _autoDetectLinearDirection,
  detectDirectionFromOffset as _detectDirectionFromOffset,
  calculateOffsetFromMouse as _calculateOffsetFromMouse,
  calculateAngle as _calculateAngle,
  formatValue as _formatValue,
} from "./dimensionGeometry";
import { renderDimension as _renderDimension } from "./DimensionRenderer";
import {
  extractPointsFromEntities as _extractPointsFromEntities,
  sortPointsByDirection as _sortPointsByDirection,
  detectQdimDirection as _detectQdimDirection,
  createQdimContinuous as _createQdimContinuous,
  createQdimBaseline as _createQdimBaseline,
  createQdimStaggered as _createQdimStaggered,
} from "./QdimService";
import type { QdimEntity } from "./QdimService";

// ============================================
// DIMENSION MANAGER CLASS
// ============================================

export class DimensionManager {
  private style: DimensionStyle;
  private scale: number = 1;

  constructor(style: Partial<DimensionStyle> = {}) {
    this.style = { ...DEFAULT_DIMENSION_STYLE, ...style };
  }

  // ============================================
  // STYLE MANAGEMENT
  // ============================================

  setStyle(style: Partial<DimensionStyle>): void {
    this.style = { ...this.style, ...style };
  }

  getStyle(): DimensionStyle {
    return { ...this.style };
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  // ============================================
  // CREATE DIMENSIONS
  // ============================================

  createLinearDimension(params: LinearDimensionParams): DimensionEntity {
    const {
      point1: p1,
      point2: p2,
      startPoint,
      endPoint,
      offset,
      direction,
      ref1,
      ref2,
      textOverride,
    } = params;

    const point1 = p1 || startPoint || { x: 0, y: 0 };
    const point2 = p2 || endPoint || { x: 0, y: 0 };

    let dimType: DimensionType = "linear";
    if (direction === "aligned") {
      dimType = "aligned";
    } else if (direction === "horizontal") {
      dimType = "horizontal";
    } else if (direction === "vertical") {
      dimType = "vertical";
    }

    return {
      id: this.generateId(),
      type: "dimension",
      dimensionType: dimType,
      direction,
      point1,
      point2,
      offset,
      textOverride,
      ref1,
      ref2,
      style: { ...this.style },
    };
  }

  createAngularDimension(params: AngularDimensionParams): DimensionEntity {
    const { center, point1, point2, offset, ref1, ref2, ref3 } = params;

    return {
      id: this.generateId(),
      type: "dimension",
      dimensionType: "angular",
      point1: center,
      point2: point1,
      point3: point2,
      offset,
      ref1,
      ref2,
      ref3,
      style: { ...this.style },
    };
  }

  createRadiusDimension(params: RadiusDimensionParams): DimensionEntity {
    const { center, radius, angle, entityRef } = params;
    const endPoint = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };

    return {
      id: this.generateId(),
      type: "dimension",
      dimensionType: "radius",
      point1: center,
      point2: endPoint,
      offset: 0,
      ref1: entityRef,
      style: { ...this.style },
    };
  }

  createArcDimension(params: ArcDimensionParams): DimensionEntity {
    const { center, radius, startAngle, endAngle, offset = 50 } = params;

    let sweepAngle = endAngle - startAngle;
    if (sweepAngle < 0) sweepAngle += 2 * Math.PI;
    const arcLength = radius * sweepAngle;

    const point1 = {
      x: center.x + radius * Math.cos(startAngle),
      y: center.y + radius * Math.sin(startAngle),
    };
    const point2 = {
      x: center.x + radius * Math.cos(endAngle),
      y: center.y + radius * Math.sin(endAngle),
    };

    return {
      id: this.generateId(),
      type: "dimension",
      dimensionType: "arc",
      point1,
      point2,
      point3: center,
      offset,
      value: arcLength,
      style: { ...this.style },
    };
  }

  createDiameterDimension(
    center: Point,
    radius: number,
    angle: number,
    entityRef?: EntityReference,
  ): DimensionEntity {
    const point1 = {
      x: center.x - radius * Math.cos(angle),
      y: center.y - radius * Math.sin(angle),
    };
    const point2 = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };

    return {
      id: this.generateId(),
      type: "dimension",
      dimensionType: "diameter",
      point1,
      point2,
      offset: 0,
      ref1: entityRef,
      style: { ...this.style },
    };
  }

  // ============================================
  // GEOMETRY — Delegation to dimensionGeometry.ts
  // ============================================

  calculateDistance(p1: Point, p2: Point): number {
    return _calculateDistance(p1, p2, this.scale);
  }

  calculateLineIntersection(
    line1: { point1: Point; point2: Point },
    line2: { point1: Point; point2: Point },
  ): Point | null {
    return _calculateLineIntersection(line1, line2);
  }

  calculateHorizontalDistance(p1: Point, p2: Point): number {
    return _calculateHorizontalDistance(p1, p2, this.scale);
  }

  calculateVerticalDistance(p1: Point, p2: Point): number {
    return _calculateVerticalDistance(p1, p2, this.scale);
  }

  autoDetectLinearDirection(p1: Point, p2: Point): "horizontal" | "vertical" {
    return _autoDetectLinearDirection(p1, p2);
  }

  detectDirectionFromOffset(
    p1: Point,
    p2: Point,
    mousePos: Point,
  ): "horizontal" | "vertical" {
    return _detectDirectionFromOffset(p1, p2, mousePos);
  }

  calculateOffsetFromMouse(
    p1: Point,
    p2: Point,
    mousePos: Point,
    direction: "horizontal" | "vertical" | "aligned" | "auto",
  ): number {
    return _calculateOffsetFromMouse(p1, p2, mousePos, direction);
  }

  calculateAngle(center: Point, p1: Point, p2: Point): number {
    return _calculateAngle(center, p1, p2);
  }

  formatValue(value: number, style?: DimensionStyle): string {
    return _formatValue(value, style || this.style);
  }

  // ============================================
  // BASELINE / CONTINUE DIMENSIONS
  // ============================================

  createBaselineDimension(
    parentDim: DimensionEntity,
    newPoint: Point,
    offsetIncrement: number = 10,
  ): DimensionEntity {
    const chainIndex = (parentDim.chainIndex ?? 0) + 1;
    const newOffset = parentDim.offset + offsetIncrement * chainIndex;

    return {
      id: this.generateId(),
      type: "dimension",
      dimensionType: "baseline",
      direction: parentDim.direction,
      point1: parentDim.point1,
      point2: newPoint,
      offset: newOffset,
      parentDimId: parentDim.id,
      chainIndex,
      style: { ...parentDim.style },
    };
  }

  createContinueDimension(
    parentDim: DimensionEntity,
    newPoint: Point,
    fixedDimLinePosition?: number,
  ): DimensionEntity {
    const chainIndex = (parentDim.chainIndex ?? 0) + 1;
    const direction = parentDim.direction || "horizontal";

    let dimLinePosition: number;
    if (fixedDimLinePosition !== undefined) {
      dimLinePosition = fixedDimLinePosition;
    } else {
      const parentMidY = (parentDim.point1.y + parentDim.point2.y) / 2;
      const parentMidX = (parentDim.point1.x + parentDim.point2.x) / 2;
      if (direction === "horizontal") {
        dimLinePosition = parentMidY + parentDim.offset;
      } else {
        dimLinePosition = parentMidX + parentDim.offset;
      }
    }

    const point1 = parentDim.point2;
    const point2 = newPoint;

    let newOffset: number;
    if (direction === "horizontal") {
      const newMidY = (point1.y + point2.y) / 2;
      newOffset = dimLinePosition - newMidY;
    } else {
      const newMidX = (point1.x + point2.x) / 2;
      newOffset = dimLinePosition - newMidX;
    }

    return {
      id: this.generateId(),
      type: "dimension",
      dimensionType: "continue",
      direction,
      point1,
      point2,
      offset: newOffset,
      dimLinePosition,
      parentDimId: parentDim.id,
      chainIndex,
      style: { ...parentDim.style },
    };
  }

  // ============================================
  // VALUE RESOLUTION
  // ============================================

  getDimensionValue(dim: DimensionEntity): number {
    if (dim.value !== undefined) return dim.value;

    switch (dim.dimensionType) {
      case "horizontal":
        return this.calculateHorizontalDistance(dim.point1, dim.point2);
      case "vertical":
        return this.calculateVerticalDistance(dim.point1, dim.point2);
      case "linear":
      case "aligned":
      case "baseline":
      case "continue":
        if (dim.direction === "horizontal") {
          return this.calculateHorizontalDistance(dim.point1, dim.point2);
        } else if (dim.direction === "vertical") {
          return this.calculateVerticalDistance(dim.point1, dim.point2);
        }
        return this.calculateDistance(dim.point1, dim.point2);
      case "angular":
        return dim.point3
          ? this.calculateAngle(dim.point1, dim.point2, dim.point3)
          : 0;
      case "radius":
        return this.calculateDistance(dim.point1, dim.point2);
      case "diameter":
        return this.calculateDistance(dim.point1, dim.point2);
      case "arc":
        return dim.value ?? 0;
      default:
        return this.calculateDistance(dim.point1, dim.point2);
    }
  }

  // ============================================
  // RENDER — Delegation to DimensionRenderer.ts
  // ============================================

  renderDimension(
    ctx: CanvasRenderingContext2D,
    dimension: DimensionEntity,
    viewTransform: { offsetX: number; offsetY: number; scale: number },
  ): void {
    _renderDimension(ctx, dimension, viewTransform, this.scale);
  }

  // ============================================
  // QDIM — Delegation to QdimService.ts
  // ============================================

  extractPointsFromEntities(entities: QdimEntity[]): Point[] {
    return _extractPointsFromEntities(entities);
  }

  sortPointsByDirection(
    points: Point[],
    direction: "horizontal" | "vertical",
  ): Point[] {
    return _sortPointsByDirection(points, direction);
  }

  detectQdimDirection(
    points: Point[],
    mousePos: Point,
  ): "horizontal" | "vertical" {
    return _detectQdimDirection(points, mousePos);
  }

  createQdimContinuous(
    points: Point[],
    dimLinePosition: number,
    direction: "horizontal" | "vertical",
  ): DimensionEntity[] {
    return _createQdimContinuous(
      points,
      dimLinePosition,
      direction,
      this.createLinearDimension.bind(this),
    );
  }

  createQdimBaseline(
    points: Point[],
    dimLinePosition: number,
    offsetIncrement: number,
    direction: "horizontal" | "vertical",
  ): DimensionEntity[] {
    return _createQdimBaseline(
      points,
      dimLinePosition,
      offsetIncrement,
      direction,
      this.createLinearDimension.bind(this),
    );
  }

  createQdimStaggered(
    points: Point[],
    dimLinePosition: number,
    offsetIncrement: number,
    direction: "horizontal" | "vertical",
  ): DimensionEntity[] {
    return _createQdimStaggered(
      points,
      dimLinePosition,
      offsetIncrement,
      direction,
      this.createLinearDimension.bind(this),
    );
  }

  // ============================================
  // PRIVATE UTILITY
  // ============================================

  private generateId(): string {
    return `dim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const dimensionManager = new DimensionManager();
