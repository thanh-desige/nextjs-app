/**
 * DimensionManager.ts
 *
 * Quản lý dimension/kích thước trên bản vẽ CAD
 * - Linear dimensions (đường thẳng ngang/dọc)
 * - Aligned dimensions (theo cạnh nghiêng)
 * - Angular dimensions (góc)
 * - Radius/Diameter dimensions (bán kính/đường kính)
 * - Arc dimensions (chiều dài cung)
 * - Baseline/Continue dimensions
 *
 * Enhanced Features:
 * - Entity snap support
 * - Auto-detect direction for linear dimension
 * - Entity-based dimension creation
 * - Continue/Baseline mode
 */

// Point type for dimension calculations
export interface Point {
  x: number;
  y: number;
}

// Entity reference for dimension snapping
export interface EntityReference {
  entityId: string;
  entityType: "line" | "circle" | "arc" | "polyline" | "rect";
  snapType:
    | "endpoint"
    | "midpoint"
    | "center"
    | "intersection"
    | "nearest"
    | "quadrant";
  point: Point;
}

// ============================================
// TYPES
// ============================================

export type DimensionType =
  | "linear" // DLI - Kích thước thẳng (tự động ngang/dọc theo góc 2 điểm)
  | "horizontal" // DHO - Kích thước ngang cưỡng ép
  | "vertical" // DVE - Kích thước dọc cưỡng ép
  | "aligned" // DAL - Kích thước song song cạnh xiên
  | "angular" // DAN - Góc
  | "radius" // DRA - Bán kính
  | "diameter" // Đường kính
  | "arc" // DAR - Chiều dài cung tròn
  | "ordinate" // Tọa độ
  | "continue" // DCO - Kích thước nối tiếp
  | "baseline" // DBA - Kích thước chuẩn gốc (bậc thang)
  | "qdim"; // QD - Quick Dimension (kích thước nhanh nhiều điểm)

export type DimensionDirection = "horizontal" | "vertical" | "aligned" | "auto";

// QDIM modes
export type QdimMode =
  | "continuous" // Chuỗi kích thước nối tiếp
  | "staggered" // Kích thước so le (offset khác nhau)
  | "baseline" // Kích thước từ điểm gốc chung
  | "ordinate"; // Tọa độ X hoặc Y

export interface DimensionStyle {
  textHeight: number;
  arrowSize: number;
  extensionLineGap: number;
  extensionLineOffset: number;
  lineColor: string;
  textColor: string;
  font: string;
  precision: number;
  unit: "mm" | "cm" | "m" | "inch";
  showUnit: boolean;
  prefix: string;
  suffix: string;
  textPosition: "above" | "center" | "outside";
  arrowType: "closed" | "open" | "dot" | "tick";
  // New style options
  textRotation: number; // Override text rotation (degrees)
  textOffset: Point; // Manual text offset
  suppressExtLine1: boolean; // Hide first extension line
  suppressExtLine2: boolean; // Hide second extension line
}

export interface DimensionEntity {
  id: string;
  type: "dimension";
  dimensionType: DimensionType;
  point1: Point;
  point2: Point;
  point3?: Point; // Cho angular dimension
  offset: number; // Khoảng cách từ đối tượng đến dimension line
  direction?: DimensionDirection; // Direction for linear dimension
  value?: number; // Override value (nếu muốn hiển thị giá trị khác)
  textOverride?: string; // Custom text override
  style: DimensionStyle;
  // Entity references for snapping
  ref1?: EntityReference;
  ref2?: EntityReference;
  ref3?: EntityReference;
  // Baseline/Continue chain
  parentDimId?: string; // Parent dimension for continue/baseline
  chainIndex?: number; // Position in chain
  // Absolute dim line position for continue/qdim (Y for horizontal, X for vertical)
  dimLinePosition?: number;
}

export interface LinearDimensionParams {
  point1?: Point;
  point2?: Point;
  startPoint?: Point;
  endPoint?: Point;
  offset: number;
  direction?: DimensionDirection;
  isHorizontal?: boolean;
  ref1?: EntityReference;
  ref2?: EntityReference;
  textOverride?: string;
}

export interface AngularDimensionParams {
  center: Point;
  point1: Point;
  point2: Point;
  offset: number;
  ref1?: EntityReference;
  ref2?: EntityReference;
  ref3?: EntityReference;
}

export interface RadiusDimensionParams {
  center: Point;
  radius: number;
  angle: number; // Góc đặt dimension
  entityRef?: EntityReference;
}

export interface ArcDimensionParams {
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  offset?: number;
  arcLength?: number;
}

// ============================================
// DEFAULT STYLE
// ============================================

export const DEFAULT_DIMENSION_STYLE: DimensionStyle = {
  textHeight: 14,
  arrowSize: 8,
  extensionLineGap: 2,
  extensionLineOffset: 4,
  lineColor: "#00ff00",
  textColor: "#00ff00",
  font: "Arial",
  precision: 2, // 2 decimal places for mm (e.g., 0.45mm)
  unit: "mm",
  showUnit: true,
  prefix: "",
  suffix: "",
  textPosition: "above",
  arrowType: "closed",
  textRotation: 0,
  textOffset: { x: 0, y: 0 },
  suppressExtLine1: false,
  suppressExtLine2: false,
};

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

  /**
   * Tạo linear dimension (kích thước đường thẳng)
   * Supports auto direction detection based on mouse position
   */
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

    // Support both naming conventions
    const point1 = p1 || startPoint || { x: 0, y: 0 };
    const point2 = p2 || endPoint || { x: 0, y: 0 };

    // Determine dimension type based on direction
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

  /**
   * Tạo angular dimension (kích thước góc)
   */
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

  /**
   * Tạo radius dimension
   */
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

  /**
   * Tạo arc dimension (chiều dài cung)
   */
  createArcDimension(params: ArcDimensionParams): DimensionEntity {
    const { center, radius, startAngle, endAngle, offset = 50 } = params;

    // Calculate arc length
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

  /**
   * Tạo diameter dimension
   */
  createDiameterDimension(
    center: Point,
    radius: number,
    angle: number
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
      style: { ...this.style },
    };
  }

  // ============================================
  // CALCULATE VALUES
  // ============================================

  /**
   * Tính khoảng cách giữa 2 điểm
   */
  calculateDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy) / this.scale;
  }

  /**
   * Tính khoảng cách ngang (chỉ theo X)
   */
  calculateHorizontalDistance(p1: Point, p2: Point): number {
    return Math.abs(p2.x - p1.x) / this.scale;
  }

  /**
   * Tính khoảng cách dọc (chỉ theo Y)
   */
  calculateVerticalDistance(p1: Point, p2: Point): number {
    return Math.abs(p2.y - p1.y) / this.scale;
  }

  /**
   * DLI - Tự động xác định hướng dimension dựa trên góc của 2 điểm
   * Như AutoCAD: nếu góc gần ngang → horizontal, gần dọc → vertical
   * KHÔNG trả về aligned - đó là nhiệm vụ của DAL
   */
  autoDetectLinearDirection(p1: Point, p2: Point): "horizontal" | "vertical" {
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);

    // Nếu delta X lớn hơn delta Y → đường gần ngang → đo horizontal
    // Nếu delta Y lớn hơn delta X → đường gần dọc → đo vertical
    return dx >= dy ? "horizontal" : "vertical";
  }

  /**
   * Xác định hướng dựa trên vị trí offset (kéo chuột)
   * Dùng cho trường hợp người dùng muốn chọn hướng thủ công khi kéo offset
   */
  detectDirectionFromOffset(
    p1: Point,
    p2: Point,
    mousePos: Point
  ): "horizontal" | "vertical" {
    // Tính vector từ midpoint đến mouse
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    const dx = Math.abs(mousePos.x - midX);
    const dy = Math.abs(mousePos.y - midY);

    // Nếu kéo theo chiều dọc (dy > dx) → dimension nằm ngang → đo horizontal
    // Nếu kéo theo chiều ngang (dx > dy) → dimension nằm dọc → đo vertical
    return dy >= dx ? "horizontal" : "vertical";
  }

  /**
   * Tính offset dựa trên vị trí chuột (WORLD COORDS)
   * Offset được tính theo khoảng cách vuông góc từ chuột đến đường đo
   * Di chuột về phía nào thì dim đi về phía đó
   */
  calculateOffsetFromMouse(
    p1: Point,
    p2: Point,
    mousePos: Point,
    direction: DimensionDirection
  ): number {
    if (direction === "horizontal") {
      // Horizontal dimension: dim line nằm ngang
      // Offset theo Y - chuột LÊN màn hình → dim LÊN
      const midY = (p1.y + p2.y) / 2;
      return mousePos.y - midY; // Kéo lên (worldY tăng) → offset dương → dim lên
    } else if (direction === "vertical") {
      // Vertical dimension: dim line nằm dọc
      // Offset theo X - chuột SANG PHẢI → dim SANG PHẢI
      // Nhưng worldToScreen KHÔNG đảo X, nên giữ nguyên
      const midX = (p1.x + p2.x) / 2;
      return mousePos.x - midX;
    } else {
      // Aligned - dim line song song với đoạn p1-p2, đi qua vị trí chuột
      // calcDimensionLinePoints dùng: perpX = -dy/length, perpY = dx/length
      // dimP1 = p1 + perp * offset, dimP2 = p2 + perp * offset
      // Để dim line đi qua chuột: offset = (mouse - p1) · perp
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lengthSq = dx * dx + dy * dy;
      if (lengthSq === 0) return 0;
      const length = Math.sqrt(lengthSq);

      // Perpendicular vector (phải khớp với calcDimensionLinePoints)
      const perpX = -dy / length;
      const perpY = dx / length;

      // Offset = projection của (mouse - p1) lên perp vector
      // Dim line sẽ đi qua điểm chuột
      return (mousePos.x - p1.x) * perpX + (mousePos.y - p1.y) * perpY;
    }
  }

  /**
   * Tính góc giữa 2 vector
   */
  calculateAngle(center: Point, p1: Point, p2: Point): number {
    const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);
    let angle = Math.abs(angle2 - angle1) * (180 / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  }

  /**
   * Format giá trị dimension
   */
  formatValue(value: number, style?: DimensionStyle): string {
    const s = style || this.style;
    const formatted = value.toFixed(s.precision);
    const unit = s.showUnit ? s.unit : "";
    return `${s.prefix}${formatted}${unit}${s.suffix}`;
  }

  // ============================================
  // BASELINE / CONTINUE DIMENSIONS
  // ============================================

  /**
   * Tạo baseline dimension từ dimension trước
   * Baseline dimension bắt đầu từ cùng điểm gốc
   */
  createBaselineDimension(
    parentDim: DimensionEntity,
    newPoint: Point,
    offsetIncrement: number = 10
  ): DimensionEntity {
    const chainIndex = (parentDim.chainIndex ?? 0) + 1;
    const newOffset = parentDim.offset + offsetIncrement * chainIndex;

    return {
      id: this.generateId(),
      type: "dimension",
      dimensionType: "baseline",
      direction: parentDim.direction,
      point1: parentDim.point1, // Giữ nguyên điểm gốc
      point2: newPoint,
      offset: newOffset,
      parentDimId: parentDim.id,
      chainIndex,
      style: { ...parentDim.style },
    };
  }

  /**
   * Tạo continue dimension từ dimension trước
   * Continue dimension tiếp nối từ điểm cuối
   * Quan trọng: Dim line phải nằm cùng vị trí tuyệt đối với dimension gốc
   * @param parentDim Dimension trước đó (để lấy point2 làm điểm bắt đầu)
   * @param newPoint Điểm kết thúc mới
   * @param fixedDimLinePosition Vị trí tuyệt đối cố định của dim line (từ dimension gốc)
   */
  createContinueDimension(
    parentDim: DimensionEntity,
    newPoint: Point,
    fixedDimLinePosition?: number
  ): DimensionEntity {
    const chainIndex = (parentDim.chainIndex ?? 0) + 1;
    const direction = parentDim.direction || "horizontal";

    // Nếu không có fixedDimLinePosition, tính từ parentDim
    let dimLinePosition: number;
    if (fixedDimLinePosition !== undefined) {
      dimLinePosition = fixedDimLinePosition;
    } else {
      // Fallback: tính từ parentDim (legacy behavior)
      const parentMidY = (parentDim.point1.y + parentDim.point2.y) / 2;
      const parentMidX = (parentDim.point1.x + parentDim.point2.x) / 2;
      if (direction === "horizontal") {
        dimLinePosition = parentMidY + parentDim.offset;
      } else {
        dimLinePosition = parentMidX + parentDim.offset;
      }
    }

    // Điểm bắt đầu là điểm cuối của dim trước
    const point1 = parentDim.point2;
    const point2 = newPoint;

    // Tính offset mới để dim line nằm cùng vị trí tuyệt đối
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
      dimLinePosition, // Lưu vị trí tuyệt đối để render sử dụng
      parentDimId: parentDim.id,
      chainIndex,
      style: { ...parentDim.style },
    };
  }

  /**
   * Tính giá trị dimension dựa trên loại và hướng
   */
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
        return dim.value ?? 0; // Arc length calculated at creation
      default:
        return this.calculateDistance(dim.point1, dim.point2);
    }
  }

  // ============================================
  // RENDER DIMENSIONS
  // ============================================

  /**
   * Vẽ dimension lên canvas
   */
  renderDimension(
    ctx: CanvasRenderingContext2D,
    dimension: DimensionEntity,
    viewTransform: { offsetX: number; offsetY: number; scale: number }
  ): void {
    ctx.save();

    const { offsetX, offsetY, scale } = viewTransform;
    const style = dimension.style;

    ctx.strokeStyle = style.lineColor;
    ctx.fillStyle = style.textColor;
    ctx.font = `${style.textHeight}px ${style.font}`;
    ctx.lineWidth = 1;

    switch (dimension.dimensionType) {
      case "linear":
      case "aligned":
      case "horizontal":
      case "vertical":
      case "baseline":
      case "continue":
        this.renderLinearDimension(ctx, dimension, offsetX, offsetY, scale);
        break;
      case "arc":
        this.renderArcDimension(ctx, dimension, offsetX, offsetY, scale);
        break;
      case "angular":
        this.renderAngularDimension(ctx, dimension, offsetX, offsetY, scale);
        break;
      case "radius":
        this.renderRadiusDimension(ctx, dimension, offsetX, offsetY, scale);
        break;
      case "diameter":
        this.renderDiameterDimension(ctx, dimension, offsetX, offsetY, scale);
        break;
    }

    ctx.restore();
  }

  private renderLinearDimension(
    ctx: CanvasRenderingContext2D,
    dim: DimensionEntity,
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    const style = dim.style;
    const p1 = this.transformPoint(dim.point1, offsetX, offsetY, scale);
    const p2 = this.transformPoint(dim.point2, offsetX, offsetY, scale);

    // Determine dimension direction
    const direction = dim.direction || "aligned";

    let d1: Point, d2: Point;
    let dimLineAngle: number;
    let dimValue: number;
    const offset = dim.offset * scale;

    if (direction === "horizontal") {
      // HORIZONTAL DIMENSION - đo khoảng cách theo X
      // Dimension line là đường ngang, extension lines đi thẳng đứng

      let dimLineY: number;
      if (dim.dimLinePosition !== undefined) {
        // Sử dụng vị trí tuyệt đối nếu có (cho continue/qdim)
        dimLineY = dim.dimLinePosition * scale + offsetY;
      } else {
        // Tính từ midpoint + offset
        const midY = (p1.y + p2.y) / 2;
        dimLineY = midY + offset;
      }

      // Điểm trên dimension line (cùng Y)
      d1 = { x: p1.x, y: dimLineY };
      d2 = { x: p2.x, y: dimLineY };
      dimLineAngle = 0;
      dimValue = Math.abs(dim.point2.x - dim.point1.x) / this.scale;
    } else if (direction === "vertical") {
      // VERTICAL DIMENSION - đo khoảng cách theo Y
      // Dimension line là đường dọc, extension lines đi ngang

      let dimLineX: number;
      if (dim.dimLinePosition !== undefined) {
        // Sử dụng vị trí tuyệt đối nếu có (cho continue/qdim)
        dimLineX = dim.dimLinePosition * scale + offsetX;
      } else {
        // Tính từ midpoint + offset
        const midX = (p1.x + p2.x) / 2;
        dimLineX = midX + offset;
      }

      // Điểm trên dimension line (cùng X)
      d1 = { x: dimLineX, y: p1.y };
      d2 = { x: dimLineX, y: p2.y };
      dimLineAngle = Math.PI / 2;
      dimValue = Math.abs(dim.point2.y - dim.point1.y) / this.scale;
    } else {
      // Aligned dimension - đo theo đường nối 2 điểm
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) {
        ctx.restore();
        return;
      }

      // Normal vector (vuông góc)
      const nx = -dy / length;
      const ny = dx / length;
      const offset = dim.offset * scale;

      d1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
      d2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };
      dimLineAngle = Math.atan2(dy, dx);
      dimValue = this.calculateDistance(dim.point1, dim.point2);
    }

    // Extension lines
    const gap = style.extensionLineGap * scale;
    const ext = style.extensionLineOffset * scale;

    ctx.beginPath();

    if (direction === "horizontal") {
      // Extension lines cho HORIZONTAL dimension
      // Extension lines đi thẳng đứng từ điểm gốc đến dimension line
      if (!style.suppressExtLine1) {
        // Xác định hướng extension line (lên hay xuống)
        const dir1 = d1.y > p1.y ? 1 : -1;
        ctx.moveTo(p1.x, p1.y + gap * dir1);
        ctx.lineTo(d1.x, d1.y + ext * dir1);
      }
      if (!style.suppressExtLine2) {
        const dir2 = d2.y > p2.y ? 1 : -1;
        ctx.moveTo(p2.x, p2.y + gap * dir2);
        ctx.lineTo(d2.x, d2.y + ext * dir2);
      }
    } else if (direction === "vertical") {
      // Extension lines cho VERTICAL dimension
      // Extension lines đi ngang từ điểm gốc đến dimension line
      if (!style.suppressExtLine1) {
        const dir1 = d1.x > p1.x ? 1 : -1;
        ctx.moveTo(p1.x + gap * dir1, p1.y);
        ctx.lineTo(d1.x + ext * dir1, d1.y);
      }
      if (!style.suppressExtLine2) {
        const dir2 = d2.x > p2.x ? 1 : -1;
        ctx.moveTo(p2.x + gap * dir2, p2.y);
        ctx.lineTo(d2.x + ext * dir2, d2.y);
      }
    } else {
      // Extension lines for aligned
      const dx = d2.x - d1.x;
      const dy = d2.y - d1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        const nx = -dy / length;
        const ny = dx / length;

        if (!style.suppressExtLine1) {
          ctx.moveTo(p1.x + nx * gap, p1.y + ny * gap);
          ctx.lineTo(d1.x + nx * ext, d1.y + ny * ext);
        }
        if (!style.suppressExtLine2) {
          ctx.moveTo(p2.x + nx * gap, p2.y + ny * gap);
          ctx.lineTo(d2.x + nx * ext, d2.y + ny * ext);
        }
      }
    }

    // Dimension line
    ctx.moveTo(d1.x, d1.y);
    ctx.lineTo(d2.x, d2.y);
    ctx.stroke();

    // Arrows
    const arrowDx = d2.x - d1.x;
    const arrowDy = d2.y - d1.y;
    const arrowLen = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);

    if (arrowLen > 0) {
      this.drawArrow(
        ctx,
        d1,
        { x: arrowDx / arrowLen, y: arrowDy / arrowLen },
        style.arrowSize * scale
      );
      this.drawArrow(
        ctx,
        d2,
        { x: -arrowDx / arrowLen, y: -arrowDy / arrowLen },
        style.arrowSize * scale
      );
    }

    // Text
    const value = dim.value ?? dimValue;
    const text = dim.textOverride || this.formatValue(value, style);
    const midX = (d1.x + d2.x) / 2 + (style.textOffset?.x || 0);
    const midY = (d1.y + d2.y) / 2 + (style.textOffset?.y || 0);

    ctx.save();
    ctx.translate(midX, midY);

    // Rotate text to align with dimension line
    let textAngle = dimLineAngle;
    if (style.textRotation) {
      textAngle = style.textRotation * (Math.PI / 180);
    } else if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
      textAngle += Math.PI;
    }
    ctx.rotate(textAngle);

    ctx.textAlign = "center";
    ctx.textBaseline = style.textPosition === "above" ? "bottom" : "middle";
    const textOffset = style.textPosition === "above" ? -4 : 0;
    ctx.fillText(text, 0, textOffset);
    ctx.restore();
  }

  /**
   * Render arc dimension (chiều dài cung)
   */
  private renderArcDimension(
    ctx: CanvasRenderingContext2D,
    dim: DimensionEntity,
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    if (!dim.point3) return;

    const style = dim.style;
    const p1 = this.transformPoint(dim.point1, offsetX, offsetY, scale);
    const p2 = this.transformPoint(dim.point2, offsetX, offsetY, scale);
    const center = this.transformPoint(dim.point3, offsetX, offsetY, scale);

    // Calculate arc parameters
    const r1 = Math.sqrt(
      Math.pow(p1.x - center.x, 2) + Math.pow(p1.y - center.y, 2)
    );
    const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
    const endAngle = Math.atan2(p2.y - center.y, p2.x - center.x);

    // Dimension arc radius (offset from original arc)
    const dimRadius = r1 + dim.offset * scale;

    // Draw dimension arc
    ctx.beginPath();
    ctx.arc(center.x, center.y, dimRadius, startAngle, endAngle);
    ctx.stroke();

    // Extension lines
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(
      center.x + dimRadius * 1.05 * Math.cos(startAngle),
      center.y + dimRadius * 1.05 * Math.sin(startAngle)
    );
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(
      center.x + dimRadius * 1.05 * Math.cos(endAngle),
      center.y + dimRadius * 1.05 * Math.sin(endAngle)
    );
    ctx.stroke();

    // Text - arc length
    const arcLength = dim.value ?? 0;
    const text = dim.textOverride || `⌒${this.formatValue(arcLength, style)}`;
    const midAngle = (startAngle + endAngle) / 2;
    const textRadius = dimRadius + style.textHeight;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      text,
      center.x + textRadius * Math.cos(midAngle),
      center.y + textRadius * Math.sin(midAngle)
    );
  }

  private renderAngularDimension(
    ctx: CanvasRenderingContext2D,
    dim: DimensionEntity,
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    if (!dim.point3) return;

    const style = dim.style;
    const center = this.transformPoint(dim.point1, offsetX, offsetY, scale);
    const p1 = this.transformPoint(dim.point2, offsetX, offsetY, scale);
    const p2 = this.transformPoint(dim.point3, offsetX, offsetY, scale);

    const radius = dim.offset * scale;
    const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
    const endAngle = Math.atan2(p2.y - center.y, p2.x - center.x);

    // Draw arc
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startAngle, endAngle);
    ctx.stroke();

    // Extension lines
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(
      center.x + radius * 1.1 * Math.cos(startAngle),
      center.y + radius * 1.1 * Math.sin(startAngle)
    );
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(
      center.x + radius * 1.1 * Math.cos(endAngle),
      center.y + radius * 1.1 * Math.sin(endAngle)
    );
    ctx.stroke();

    // Text
    const angle =
      dim.value ?? this.calculateAngle(dim.point1, dim.point2, dim.point3);
    const text = `${angle.toFixed(style.precision)}°`;
    const midAngle = (startAngle + endAngle) / 2;
    const textRadius = radius + style.textHeight;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      text,
      center.x + textRadius * Math.cos(midAngle),
      center.y + textRadius * Math.sin(midAngle)
    );
  }

  private renderRadiusDimension(
    ctx: CanvasRenderingContext2D,
    dim: DimensionEntity,
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    const style = dim.style;
    const center = this.transformPoint(dim.point1, offsetX, offsetY, scale);
    const end = this.transformPoint(dim.point2, offsetX, offsetY, scale);

    // Leader line
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrow at end
    const dx = end.x - center.x;
    const dy = end.y - center.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    this.drawArrow(
      ctx,
      end,
      { x: -dx / length, y: -dy / length },
      style.arrowSize * scale
    );

    // Text
    const radius = dim.value ?? this.calculateDistance(dim.point1, dim.point2);
    const text = `R${this.formatValue(radius, style)}`;

    const midX = (center.x + end.x) / 2;
    const midY = (center.y + end.y) / 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(text, midX, midY - 4);
  }

  private renderDiameterDimension(
    ctx: CanvasRenderingContext2D,
    dim: DimensionEntity,
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    const style = dim.style;
    const p1 = this.transformPoint(dim.point1, offsetX, offsetY, scale);
    const p2 = this.transformPoint(dim.point2, offsetX, offsetY, scale);

    // Diameter line
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Arrows at both ends
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    this.drawArrow(
      ctx,
      p1,
      { x: dx / length, y: dy / length },
      style.arrowSize * scale
    );
    this.drawArrow(
      ctx,
      p2,
      { x: -dx / length, y: -dy / length },
      style.arrowSize * scale
    );

    // Text
    const diameter =
      dim.value ?? this.calculateDistance(dim.point1, dim.point2);
    const text = `⌀${this.formatValue(diameter, style)}`;

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    ctx.save();
    ctx.translate(midX, midY);
    const angle = Math.atan2(dy, dx);
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
      ctx.rotate(angle + Math.PI);
    } else {
      ctx.rotate(angle);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(text, 0, -4);
    ctx.restore();
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private transformPoint(
    p: Point,
    offsetX: number,
    offsetY: number,
    scale: number
  ): Point {
    return {
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    };
  }

  private drawArrow(
    ctx: CanvasRenderingContext2D,
    tip: Point,
    direction: Point,
    size: number
  ): void {
    const angle = Math.PI / 6; // 30 degrees

    const p1 = {
      x:
        tip.x +
        size * (direction.x * Math.cos(angle) - direction.y * Math.sin(angle)),
      y:
        tip.y +
        size * (direction.x * Math.sin(angle) + direction.y * Math.cos(angle)),
    };
    const p2 = {
      x:
        tip.x +
        size *
          (direction.x * Math.cos(-angle) - direction.y * Math.sin(-angle)),
      y:
        tip.y +
        size *
          (direction.x * Math.sin(-angle) + direction.y * Math.cos(-angle)),
    };

    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  private generateId(): string {
    return `dim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // QDIM - QUICK DIMENSION
  // ============================================

  /**
   * Trích xuất tất cả endpoints từ các entities được chọn
   * Trả về danh sách điểm đã được sắp xếp theo tọa độ
   */
  extractPointsFromEntities(
    entities: Array<{
      type: string;
      points?: Point[];
      center?: Point;
      radius?: number;
      startAngle?: number;
      endAngle?: number;
    }>
  ): Point[] {
    const points: Point[] = [];
    const pointSet = new Set<string>(); // Để tránh trùng lặp

    for (const entity of entities) {
      if (
        entity.type === "line" &&
        entity.points &&
        entity.points.length >= 2
      ) {
        // Line: lấy 2 endpoints
        for (const p of entity.points) {
          const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
          if (!pointSet.has(key)) {
            pointSet.add(key);
            points.push({ x: p.x, y: p.y });
          }
        }
      } else if (entity.type === "polyline" && entity.points) {
        // Polyline: lấy tất cả vertices
        for (const p of entity.points) {
          const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
          if (!pointSet.has(key)) {
            pointSet.add(key);
            points.push({ x: p.x, y: p.y });
          }
        }
      } else if (
        entity.type === "rect" &&
        entity.points &&
        entity.points.length >= 2
      ) {
        // Rectangle: lấy 4 góc
        const [p1, p2] = entity.points;
        const corners = [
          { x: p1.x, y: p1.y },
          { x: p2.x, y: p1.y },
          { x: p2.x, y: p2.y },
          { x: p1.x, y: p2.y },
        ];
        for (const p of corners) {
          const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
          if (!pointSet.has(key)) {
            pointSet.add(key);
            points.push(p);
          }
        }
      } else if (entity.type === "circle" && entity.center && entity.radius) {
        // Circle: lấy 4 quadrant points
        const c = entity.center;
        const r = entity.radius;
        const quadrants = [
          { x: c.x + r, y: c.y }, // 0°
          { x: c.x, y: c.y + r }, // 90°
          { x: c.x - r, y: c.y }, // 180°
          { x: c.x, y: c.y - r }, // 270°
        ];
        for (const p of quadrants) {
          const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
          if (!pointSet.has(key)) {
            pointSet.add(key);
            points.push(p);
          }
        }
      } else if (entity.type === "arc" && entity.center && entity.radius) {
        // Arc: lấy start và end points
        const c = entity.center;
        const r = entity.radius;
        const startAngle = entity.startAngle || 0;
        const endAngle = entity.endAngle || Math.PI;
        const arcPoints = [
          {
            x: c.x + r * Math.cos(startAngle),
            y: c.y + r * Math.sin(startAngle),
          },
          { x: c.x + r * Math.cos(endAngle), y: c.y + r * Math.sin(endAngle) },
        ];
        for (const p of arcPoints) {
          const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
          if (!pointSet.has(key)) {
            pointSet.add(key);
            points.push(p);
          }
        }
      }
    }

    return points;
  }

  /**
   * Sắp xếp điểm theo hướng (horizontal: theo X, vertical: theo Y)
   */
  sortPointsByDirection(
    points: Point[],
    direction: "horizontal" | "vertical"
  ): Point[] {
    return [...points].sort((a, b) => {
      if (direction === "horizontal") {
        return a.x - b.x; // Sắp xếp theo X (trái → phải)
      } else {
        return a.y - b.y; // Sắp xếp theo Y (dưới → trên trong world coords)
      }
    });
  }

  /**
   * Xác định hướng tốt nhất cho QDIM dựa trên vị trí chuột so với bounding box
   */
  detectQdimDirection(
    points: Point[],
    mousePos: Point
  ): "horizontal" | "vertical" {
    if (points.length === 0) return "horizontal";

    // Tính bounding box
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Khoảng cách từ chuột đến center theo X và Y
    const dx = Math.abs(mousePos.x - centerX);
    const dy = Math.abs(mousePos.y - centerY);

    // Nếu chuột ở trên/dưới → horizontal dimensions
    // Nếu chuột ở trái/phải → vertical dimensions
    return dy > dx ? "horizontal" : "vertical";
  }

  /**
   * Tạo nhiều dimensions từ danh sách điểm (QDIM - Continuous mode)
   * Tạo chuỗi dimension liên tiếp giữa các điểm
   * Tất cả dimensions nằm trên cùng một đường (dimLineY hoặc dimLineX cố định)
   */
  createQdimContinuous(
    points: Point[],
    dimLinePosition: number, // Vị trí Y (horizontal) hoặc X (vertical) của dim line
    direction: "horizontal" | "vertical"
  ): DimensionEntity[] {
    if (points.length < 2) return [];

    // Sắp xếp điểm
    const sortedPoints = this.sortPointsByDirection(points, direction);
    const dimensions: DimensionEntity[] = [];

    // Tạo dimension giữa các cặp điểm liên tiếp
    // Mỗi dimension cần offset riêng để dimLine nằm ở vị trí cố định
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];

      // Tính offset để dimLine nằm ở dimLinePosition
      // Với horizontal: dimLineY = midY + offset → offset = dimLinePosition - midY
      // Với vertical: dimLineX = midX + offset → offset = dimLinePosition - midX
      let offset: number;
      if (direction === "horizontal") {
        const midY = (p1.y + p2.y) / 2;
        offset = dimLinePosition - midY;
      } else {
        const midX = (p1.x + p2.x) / 2;
        offset = dimLinePosition - midX;
      }

      const dim = this.createLinearDimension({
        point1: p1,
        point2: p2,
        offset,
        direction,
      });
      dim.dimensionType = "qdim";
      dimensions.push(dim);
    }

    return dimensions;
  }

  /**
   * Tạo nhiều dimensions từ danh sách điểm (QDIM - Baseline mode)
   * Tất cả dimensions đo từ điểm gốc (điểm đầu tiên)
   * Các dimension nằm trên các đường song song với khoảng cách offsetIncrement
   */
  createQdimBaseline(
    points: Point[],
    dimLinePosition: number, // Vị trí Y (horizontal) hoặc X (vertical) của dim line đầu tiên
    offsetIncrement: number,
    direction: "horizontal" | "vertical"
  ): DimensionEntity[] {
    if (points.length < 2) return [];

    // Sắp xếp điểm
    const sortedPoints = this.sortPointsByDirection(points, direction);
    const basePoint = sortedPoints[0];
    const dimensions: DimensionEntity[] = [];

    // Tạo dimension từ base point đến từng điểm khác
    // Mỗi dimension nằm trên đường riêng, cách nhau offsetIncrement
    for (let i = 1; i < sortedPoints.length; i++) {
      const p2 = sortedPoints[i];
      const midY = (basePoint.y + p2.y) / 2;
      const midX = (basePoint.x + p2.x) / 2;

      // Tính offset để dim line nằm đúng vị trí
      // Với baseline, mỗi dimension xa hơn 1 chút
      const currentDimLinePos = dimLinePosition + (i - 1) * offsetIncrement;
      let offset: number;
      if (direction === "horizontal") {
        offset = currentDimLinePos - midY;
      } else {
        offset = currentDimLinePos - midX;
      }

      const dim = this.createLinearDimension({
        point1: basePoint,
        point2: p2,
        offset,
        direction,
      });
      dim.dimensionType = "qdim";
      dimensions.push(dim);
    }

    return dimensions;
  }

  /**
   * Tạo nhiều dimensions từ danh sách điểm (QDIM - Staggered mode)
   * Dimensions so le với offset khác nhau
   */
  createQdimStaggered(
    points: Point[],
    dimLinePosition: number, // Vị trí Y (horizontal) hoặc X (vertical) của dim line đầu tiên
    offsetIncrement: number,
    direction: "horizontal" | "vertical"
  ): DimensionEntity[] {
    if (points.length < 2) return [];

    // Sắp xếp điểm
    const sortedPoints = this.sortPointsByDirection(points, direction);
    const dimensions: DimensionEntity[] = [];

    // Tạo dimension giữa các cặp điểm liên tiếp với offset so le
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];
      const midY = (p1.y + p2.y) / 2;
      const midX = (p1.x + p2.x) / 2;

      // Staggered: mỗi dim cách nhau offsetIncrement
      const currentDimLinePos = dimLinePosition + i * offsetIncrement;
      let offset: number;
      if (direction === "horizontal") {
        offset = currentDimLinePos - midY;
      } else {
        offset = currentDimLinePos - midX;
      }

      const dim = this.createLinearDimension({
        point1: p1,
        point2: p2,
        offset,
        direction,
      });
      dim.dimensionType = "qdim";
      dimensions.push(dim);
    }

    return dimensions;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const dimensionManager = new DimensionManager();
