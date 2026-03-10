/**
 * FilletCanvasEntityCommand - Tạo góc bo tròn giữa 2 đường thẳng giao nhau
 *
 * STEP-5.2: Extracted from CanvasEntityCommands.ts
 *
 * Hoạt động giống AutoCAD:
 * - Chọn 2 LINE giao nhau (hoặc có thể extend để giao nhau)
 * - Tạo ARC với radius cho trước
 * - Cắt bớt 2 đường thẳng tại điểm tiếp xúc
 * - Với 2 đường song song: tạo arc bán nguyệt nối 2 endpoints gần click points
 *
 * Nếu radius = 0: chỉ extend/trim 2 đường đến điểm giao
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import { CanvasEntity, CanvasPoint } from "../../document/CadDocument";
import { CanvasCommandContext, generateCanvasId } from "./canvasCommandUtils";

export class FilletCanvasEntityCommand implements ICommand {
  readonly name = "FILLET_CANVAS_ENTITY";
  readonly canUndo = true;

  private entityId1: string;
  private entityId2: string;
  private radius: number;
  private clickPoint1: CanvasPoint | null;
  private clickPoint2: CanvasPoint | null;

  private originalEntity1: CanvasEntity | null = null;
  private originalEntity2: CanvasEntity | null = null;
  private createdArcId: string | null = null;

  constructor(
    entityId1: string,
    entityId2: string,
    radius: number = 0,
    clickPoint1?: CanvasPoint,
    clickPoint2?: CanvasPoint,
  ) {
    this.entityId1 = entityId1;
    this.entityId2 = entityId2;
    this.radius = Math.max(0, radius);
    this.clickPoint1 = clickPoint1 ?? null;
    this.clickPoint2 = clickPoint2 ?? null;
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    const entity1 = canvasContext.document.getCanvasEntity(this.entityId1);
    const entity2 = canvasContext.document.getCanvasEntity(this.entityId2);

    if (!entity1 || !entity2) {
      return { success: false, message: "One or both entities not found" };
    }

    // Chỉ hỗ trợ fillet giữa 2 lines
    if (entity1.type !== "line" || entity2.type !== "line") {
      return {
        success: false,
        message: "Fillet only supported between two lines",
      };
    }

    if (entity1.points.length < 2 || entity2.points.length < 2) {
      return { success: false, message: "Invalid line entities" };
    }

    // Lưu entities gốc để undo
    this.originalEntity1 = { ...entity1, points: [...entity1.points] };
    this.originalEntity2 = { ...entity2, points: [...entity2.points] };

    // Tìm điểm giao của 2 đường thẳng (mở rộng vô hạn)
    const intersection = this.findLinesIntersection(
      entity1.points[0],
      entity1.points[1],
      entity2.points[0],
      entity2.points[1],
    );

    if (!intersection) {
      // 2 đường song song - thử fillet bằng arc bán nguyệt
      return this.filletParallelLines(entity1, entity2, canvasContext);
    }

    if (this.radius === 0) {
      // Radius = 0: chỉ trim/extend đến điểm giao
      return this.filletRadiusZero(
        entity1,
        entity2,
        intersection,
        canvasContext,
      );
    }

    // Radius > 0: tạo arc và trim
    return this.filletWithArc(entity1, entity2, intersection, canvasContext);
  }

  /**
   * Fillet 2 đường song song - tạo arc bán nguyệt nối 2 đầu gần nhất
   * AutoCAD: nối 2 endpoints gần nhau nhất bằng arc bán nguyệt
   */
  private filletParallelLines(
    line1: CanvasEntity,
    line2: CanvasEntity,
    context: CanvasCommandContext,
  ): CommandResult {
    const A1 = line1.points[0];
    const A2 = line1.points[1];
    const B1 = line2.points[0];
    const B2 = line2.points[1];

    // Xác định endpoint gần click point nhất trên mỗi line (giống AutoCAD)
    let filletEnd1: CanvasPoint;
    let keepEnd1: CanvasPoint;
    let filletEnd2: CanvasPoint;
    let keepEnd2: CanvasPoint;

    // BƯỚC 1: Xác định filletEnd1 từ click point trên line 1
    if (this.clickPoint1) {
      // Endpoint gần click point nhất trên line 1
      const d1A1 = this.distance(this.clickPoint1, A1);
      const d1A2 = this.distance(this.clickPoint1, A2);
      if (d1A1 < d1A2) {
        filletEnd1 = A1;
        keepEnd1 = A2;
      } else {
        filletEnd1 = A2;
        keepEnd1 = A1;
      }
    } else {
      // Fallback: dùng endpoint gần line 2 nhất
      const d1 = Math.min(this.distance(A1, B1), this.distance(A1, B2));
      const d2 = Math.min(this.distance(A2, B1), this.distance(A2, B2));
      if (d1 < d2) {
        filletEnd1 = A1;
        keepEnd1 = A2;
      } else {
        filletEnd1 = A2;
        keepEnd1 = A1;
      }
    }

    // BƯỚC 2: Xác định filletEnd2 từ click point trên line 2
    if (this.clickPoint2) {
      // Endpoint gần click point nhất trên line 2
      const d2B1 = this.distance(this.clickPoint2, B1);
      const d2B2 = this.distance(this.clickPoint2, B2);
      if (d2B1 < d2B2) {
        filletEnd2 = B1;
        keepEnd2 = B2;
      } else {
        filletEnd2 = B2;
        keepEnd2 = B1;
      }
    } else {
      // Fallback: dùng endpoint gần filletEnd1 nhất
      const d2B1 = this.distance(filletEnd1, B1);
      const d2B2 = this.distance(filletEnd1, B2);
      if (d2B1 < d2B2) {
        filletEnd2 = B1;
        keepEnd2 = B2;
      } else {
        filletEnd2 = B2;
        keepEnd2 = B1;
      }
    }

    // Khoảng cách giữa 2 endpoints cần fillet
    const gap = this.distance(filletEnd1, filletEnd2);

    if (gap < 1e-6) {
      return {
        success: false,
        message: "Endpoints are too close for parallel fillet",
      };
    }

    // Bán kính arc = nửa khoảng cách giữa 2 endpoints
    const arcRadius = gap / 2;

    // Tâm arc = trung điểm của 2 endpoints
    const arcCenter: CanvasPoint = {
      x: (filletEnd1.x + filletEnd2.x) / 2,
      y: (filletEnd1.y + filletEnd2.y) / 2,
    };

    // Góc của mỗi endpoint so với tâm
    const angle1 = Math.atan2(
      filletEnd1.y - arcCenter.y,
      filletEnd1.x - arcCenter.x,
    );
    const angle2 = Math.atan2(
      filletEnd2.y - arcCenter.y,
      filletEnd2.x - arcCenter.x,
    );

    // ===== XÁC ĐỊNH HƯỚNG ARC: Phải cong RA NGOÀI (đối diện keepEnd1) =====
    // Dùng cross product để xác định keepEnd1 nằm bên nào của đường filletEnd1→filletEnd2
    // Sau đó chọn midArc nằm phía ngược lại

    // Vector filletEnd1 → filletEnd2
    const fVec = {
      x: filletEnd2.x - filletEnd1.x,
      y: filletEnd2.y - filletEnd1.y,
    };
    const fLen = Math.sqrt(fVec.x * fVec.x + fVec.y * fVec.y);

    // Vector filletEnd1 → keepEnd1
    const toKeep = {
      x: keepEnd1.x - filletEnd1.x,
      y: keepEnd1.y - filletEnd1.y,
    };

    // Cross product: fVec × toKeep
    // > 0: keepEnd1 bên trái của fVec
    // < 0: keepEnd1 bên phải của fVec
    const crossKeep = fVec.x * toKeep.y - fVec.y * toKeep.x;

    // Vector vuông góc với fVec
    const perpX = -fVec.y / fLen;
    const perpY = fVec.x / fLen;

    // 2 midpoints của arc (2 phía)
    const midArc1: CanvasPoint = {
      x: arcCenter.x + perpX * arcRadius,
      y: arcCenter.y + perpY * arcRadius,
    };
    const midArc2: CanvasPoint = {
      x: arcCenter.x - perpX * arcRadius,
      y: arcCenter.y - perpY * arcRadius,
    };

    // Xác định midArc1 nằm bên nào của fVec
    const toMid1 = { x: midArc1.x - filletEnd1.x, y: midArc1.y - filletEnd1.y };
    const crossMid1 = fVec.x * toMid1.y - fVec.y * toMid1.x;

    // Chọn midArc nằm ĐỐI DIỆN với keepEnd1 (khác dấu cross product)
    const correctMidArc = crossKeep * crossMid1 < 0 ? midArc1 : midArc2;

    // Góc của correctMidArc so với center
    const midAngle = Math.atan2(
      correctMidArc.y - arcCenter.y,
      correctMidArc.x - arcCenter.x,
    );

    // ===== XÁC ĐỊNH HƯỚNG ARC ĐÚNG =====
    // Arc phải đi TỪ angle1 ĐẾN angle2 và ĐI QUA midAngle

    // Normalize tất cả góc về [0, 2π)
    const normalizeAngle = (a: number) => {
      while (a < 0) a += 2 * Math.PI;
      while (a >= 2 * Math.PI) a -= 2 * Math.PI;
      return a;
    };

    const a1 = normalizeAngle(angle1);
    const a2 = normalizeAngle(angle2);
    const am = normalizeAngle(midAngle);

    // Kiểm tra am có nằm giữa a1 và a2 theo chiều CCW không
    const isBetweenCCW = (start: number, mid: number, end: number) => {
      if (start <= end) {
        return mid >= start && mid <= end;
      } else {
        return mid >= start || mid <= end;
      }
    };

    const midInCCWPath = isBetweenCCW(a1, am, a2);

    let startAngle = angle1;
    let endAngle = angle2;

    if (!midInCCWPath) {
      startAngle = angle2;
      endAngle = angle1;
    }

    console.log("PARALLEL FILLET:", {
      filletEnd1,
      filletEnd2,
      angle1: (angle1 * 180) / Math.PI,
      angle2: (angle2 * 180) / Math.PI,
      midAngle: (midAngle * 180) / Math.PI,
      midInCCWPath,
      startAngle: (startAngle * 180) / Math.PI,
      endAngle: (endAngle * 180) / Math.PI,
    });

    // ===== TRIM LINES =====
    const line1PointsNew: CanvasPoint[] = [keepEnd1, filletEnd1];
    const line2PointsNew: CanvasPoint[] = [keepEnd2, filletEnd2];

    context.document!.updateCanvasEntity(this.entityId1, {
      points: line1PointsNew,
    });
    context.document!.updateCanvasEntity(this.entityId2, {
      points: line2PointsNew,
    });

    // Tạo arc
    const arcId = generateCanvasId();
    const arc: CanvasEntity = {
      id: arcId,
      type: "arc",
      points: [arcCenter, { x: arcRadius, y: 0 }],
      color: line1.color,
      lineWidth: line1.lineWidth,
      layer: line1.layer,
      selected: false,
      startAngle: startAngle,
      endAngle: endAngle,
    };

    context.document!.addCanvasEntity(arc);
    this.createdArcId = arcId;

    console.log("PARALLEL FILLET:", {
      filletEnd1,
      filletEnd2,
      center: arcCenter,
      radius: arcRadius,
      startAngle: (startAngle * 180) / Math.PI,
      endAngle: (endAngle * 180) / Math.PI,
    });

    return {
      success: true,
      message: `Parallel fillet applied with arc radius ${arcRadius.toFixed(
        1,
      )}`,
    };
  }

  /**
   * Fillet với radius = 0: extend/trim 2 lines đến điểm giao
   */
  private filletRadiusZero(
    line1: CanvasEntity,
    line2: CanvasEntity,
    intersection: CanvasPoint,
    context: CanvasCommandContext,
  ): CommandResult {
    // Xác định endpoint nào gần giao điểm nhất cho mỗi line và trim/extend
    const newLine1Points = this.trimOrExtendLineToPoint(
      line1.points,
      intersection,
    );
    const newLine2Points = this.trimOrExtendLineToPoint(
      line2.points,
      intersection,
    );

    // Cập nhật entities
    context.document!.updateCanvasEntity(this.entityId1, {
      points: newLine1Points,
    });
    context.document!.updateCanvasEntity(this.entityId2, {
      points: newLine2Points,
    });

    return {
      success: true,
      message: "Fillet applied (radius=0, corner created)",
    };
  }

  /**
   * Fillet với radius > 0: tạo arc nối 2 lines (AutoCAD style)
   *
   * Thuật toán chuẩn AutoCAD:
   * 1. Tìm intersection P của 2 lines (mở rộng nếu cần)
   * 2. Với mỗi line, xác định unit vector từ P hướng về phía giữ lại (phía xa P)
   * 3. Tính half-angle = góc giữa / 2
   * 4. tangentDist = R / tan(halfAngle)
   * 5. Tangent points = P + direction * tangentDist
   * 6. Arc center = offset từ P theo bisector
   * 7. Trim lines và tạo arc nối T1 đến T2
   */
  private filletWithArc(
    line1: CanvasEntity,
    line2: CanvasEntity,
    intersection: CanvasPoint,
    context: CanvasCommandContext,
  ): CommandResult {
    const P = intersection;
    const A1 = line1.points[0];
    const A2 = line1.points[1];
    const B1 = line2.points[0];
    const B2 = line2.points[1];

    // Khoảng cách từ P đến các endpoints
    const dA1 = this.distance(P, A1);
    const dA2 = this.distance(P, A2);
    const dB1 = this.distance(P, B1);
    const dB2 = this.distance(P, B2);

    // Endpoint xa P (phần giữ lại của line)
    const keepA = dA1 > dA2 ? A1 : A2;
    const keepB = dB1 > dB2 ? B1 : B2;

    // Unit vector từ P hướng về keep endpoint
    const lenA = this.distance(P, keepA);
    const lenB = this.distance(P, keepB);

    if (lenA < 1e-6 || lenB < 1e-6) {
      return { success: false, message: "Lines are too short for fillet" };
    }

    const uA: CanvasPoint = {
      x: (keepA.x - P.x) / lenA,
      y: (keepA.y - P.y) / lenA,
    };
    const uB: CanvasPoint = {
      x: (keepB.x - P.x) / lenB,
      y: (keepB.y - P.y) / lenB,
    };

    // Góc giữa 2 hướng (góc tại P của vùng fillet)
    const dot = uA.x * uB.x + uA.y * uB.y;
    const theta = Math.acos(Math.max(-1, Math.min(1, dot)));

    if (theta < 0.02) {
      return { success: false, message: "Lines are nearly parallel" };
    }
    if (theta > Math.PI - 0.02) {
      return { success: false, message: "Lines are nearly collinear" };
    }

    const halfAngle = theta / 2;

    // Khoảng cách từ P đến tangent point
    const tangentDist = this.radius / Math.tan(halfAngle);

    // Kiểm tra radius không quá lớn
    if (tangentDist > lenA || tangentDist > lenB) {
      return { success: false, message: "Radius too large for these lines" };
    }

    // Tangent points
    const T1: CanvasPoint = {
      x: P.x + uA.x * tangentDist,
      y: P.y + uA.y * tangentDist,
    };
    const T2: CanvasPoint = {
      x: P.x + uB.x * tangentDist,
      y: P.y + uB.y * tangentDist,
    };

    // Bisector direction
    const bisX = uA.x + uB.x;
    const bisY = uA.y + uB.y;
    const bisLen = Math.sqrt(bisX * bisX + bisY * bisY);

    if (bisLen < 1e-6) {
      return { success: false, message: "Cannot compute bisector" };
    }

    const bisector: CanvasPoint = { x: bisX / bisLen, y: bisY / bisLen };

    // Khoảng cách từ P đến center
    const centerDist = this.radius / Math.sin(halfAngle);

    // Arc center
    const C: CanvasPoint = {
      x: P.x + bisector.x * centerDist,
      y: P.y + bisector.y * centerDist,
    };

    // Verify: khoảng cách từ C đến T1 và T2 phải bằng radius
    const distCT1 = this.distance(C, T1);
    const distCT2 = this.distance(C, T2);

    console.log("FILLET DEBUG:", {
      P,
      T1,
      T2,
      C,
      radius: this.radius,
      distCT1,
      distCT2,
      theta: (theta * 180) / Math.PI,
      tangentDist,
      centerDist,
    });

    // Góc của T1 và T2 so với center C
    const arcAngle1 = Math.atan2(T1.y - C.y, T1.x - C.x);
    const arcAngle2 = Math.atan2(T2.y - C.y, T2.x - C.x);

    // Xác định hướng vẽ arc
    const cross = uA.x * uB.y - uA.y * uB.x;

    const startAngle = arcAngle1;
    const endAngle = arcAngle2;

    // Đảm bảo arc sweep < PI (arc nhỏ)
    let sweep = endAngle - startAngle;
    while (sweep > Math.PI) sweep -= 2 * Math.PI;
    while (sweep < -Math.PI) sweep += 2 * Math.PI;

    console.log("ARC ANGLES:", {
      startAngle: (startAngle * 180) / Math.PI,
      endAngle: (endAngle * 180) / Math.PI,
      sweep: (sweep * 180) / Math.PI,
      cross,
    });

    // Trim lines: giữ từ tangent point đến keep endpoint
    const newLine1Points: CanvasPoint[] = [T1, keepA];
    const newLine2Points: CanvasPoint[] = [T2, keepB];

    context.document!.updateCanvasEntity(this.entityId1, {
      points: newLine1Points,
    });
    context.document!.updateCanvasEntity(this.entityId2, {
      points: newLine2Points,
    });

    // Tạo arc với startAngle và endAngle
    const arcId = generateCanvasId();
    const arc: CanvasEntity = {
      id: arcId,
      type: "arc",
      points: [C, { x: this.radius, y: 0 }],
      color: line1.color,
      lineWidth: line1.lineWidth,
      layer: line1.layer,
      selected: false,
      startAngle: startAngle,
      endAngle: endAngle,
    };

    context.document!.addCanvasEntity(arc);
    this.createdArcId = arcId;

    return {
      success: true,
      message: `Fillet applied with radius ${this.radius}`,
    };
  }

  /**
   * Tìm giao điểm của 2 đường thẳng (mở rộng vô hạn)
   */
  private findLinesIntersection(
    p1: CanvasPoint,
    p2: CanvasPoint,
    p3: CanvasPoint,
    p4: CanvasPoint,
  ): CanvasPoint | null {
    const d1x = p2.x - p1.x;
    const d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x;
    const d2y = p4.y - p3.y;

    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 1e-10) {
      return null; // Parallel
    }

    const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / cross;

    return {
      x: p1.x + t * d1x,
      y: p1.y + t * d1y,
    };
  }

  /**
   * Lấy endpoint gần intersection nhất
   */
  private getNearEndpoint(
    points: CanvasPoint[],
    intersection: CanvasPoint,
  ): CanvasPoint {
    const d0 = this.distance(points[0], intersection);
    const d1 = this.distance(points[1], intersection);
    return d0 < d1 ? points[0] : points[1];
  }

  /**
   * Lấy endpoint xa intersection nhất
   */
  private getFarEndpoint(
    points: CanvasPoint[],
    intersection: CanvasPoint,
  ): CanvasPoint {
    const d0 = this.distance(points[0], intersection);
    const d1 = this.distance(points[1], intersection);
    return d0 >= d1 ? points[0] : points[1];
  }

  /**
   * Normalize vector
   */
  private normalize(v: CanvasPoint): CanvasPoint {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len < 1e-10) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  }

  /**
   * Trim hoặc extend line để endpoint gần nhất trở thành điểm mới
   */
  private trimOrExtendLineToPoint(
    points: CanvasPoint[],
    newPoint: CanvasPoint,
  ): CanvasPoint[] {
    const d0 = this.distance(points[0], newPoint);
    const d1 = this.distance(points[1], newPoint);

    // Thay thế endpoint gần hơn bằng điểm mới
    if (d0 < d1) {
      return [newPoint, points[1]];
    } else {
      return [points[0], newPoint];
    }
  }

  private distance(p1: CanvasPoint, p2: CanvasPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) return;

    // Xóa arc đã tạo
    if (this.createdArcId) {
      canvasContext.document.deleteCanvasEntity(this.createdArcId);
      this.createdArcId = null;
    }

    // Khôi phục entities gốc
    if (this.originalEntity1) {
      canvasContext.document.updateCanvasEntity(this.entityId1, {
        points: this.originalEntity1.points,
      });
    }
    if (this.originalEntity2) {
      canvasContext.document.updateCanvasEntity(this.entityId2, {
        points: this.originalEntity2.points,
      });
    }
  }

  getDescription(): string {
    return `Fillet with radius ${this.radius}`;
  }
}
