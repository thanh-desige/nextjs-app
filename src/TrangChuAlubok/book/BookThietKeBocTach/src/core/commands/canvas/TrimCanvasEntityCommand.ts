/**
 * TrimCanvasEntityCommand - Cắt entity tại điểm giao với cutting edges
 *
 * STEP-5.2: Extracted from CanvasEntityCommands.ts
 *
 * Hoạt động giống AutoCAD:
 * - Click vào phần của entity muốn xóa
 * - Phần đó bị xóa, các phần còn lại được giữ
 */

import { ICommand, CommandContext, CommandResult } from "../Command.types";
import { CanvasEntity, CanvasPoint } from "../../document/CadDocument";
import { CanvasCommandContext, generateCanvasId } from "./canvasCommandUtils";

export class TrimCanvasEntityCommand implements ICommand {
  readonly name = "TRIM_CANVAS_ENTITY";
  readonly canUndo = true;

  private entityId: string;
  private pickPoint: CanvasPoint;
  private cuttingEdgeIds: string[];

  private originalEntity: CanvasEntity | null = null;
  private createdEntityIds: string[] = [];

  constructor(
    entityId: string,
    pickPoint: CanvasPoint,
    cuttingEdgeIds: string[],
  ) {
    this.entityId = entityId;
    this.pickPoint = pickPoint;
    this.cuttingEdgeIds = cuttingEdgeIds.filter((id) => id !== entityId);
  }

  execute(context: CommandContext): CommandResult {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document) {
      return { success: false, message: "No document available" };
    }

    const entity = canvasContext.document.getCanvasEntity(this.entityId);
    if (!entity) {
      return { success: false, message: "Entity not found" };
    }

    // Lưu entity gốc để undo
    this.originalEntity = { ...entity, points: [...entity.points] };

    // Lấy cutting edges
    const cuttingEdges = this.cuttingEdgeIds
      .map((id) => canvasContext.document!.getCanvasEntity(id))
      .filter((e): e is CanvasEntity => e !== undefined);

    if (cuttingEdges.length === 0) {
      // Không có cutting edges - xóa toàn bộ entity
      canvasContext.document.deleteCanvasEntity(this.entityId);
      return {
        success: true,
        message: "Deleted entity (no cutting edges)",
      };
    }

    // Xử lý trim theo loại entity
    if (entity.type === "line") {
      return this.trimLine(entity, cuttingEdges, canvasContext);
    }

    // TODO: Hoàn thiện trim circle sau
    if (entity.type === "circle") {
      console.log("[TRIM] Circle trim not yet implemented");
      return {
        success: false,
        message: "Trim circle is not yet fully implemented",
      };
      // return this.trimCircle(entity, cuttingEdges, canvasContext);
    }

    if (entity.type === "arc") {
      return this.trimArc(entity, cuttingEdges, canvasContext);
    }

    return {
      success: false,
      message: `Trim not yet supported for ${entity.type}`,
    };
  }

  private trimLine(
    line: CanvasEntity,
    cuttingEdges: CanvasEntity[],
    context: CanvasCommandContext,
  ): CommandResult {
    if (line.points.length < 2) {
      return { success: false, message: "Invalid line" };
    }

    const lineStart = line.points[0];
    const lineEnd = line.points[1];
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lineLength = Math.sqrt(dx * dx + dy * dy);

    if (lineLength < 0.0001) {
      return { success: false, message: "Line too short" };
    }

    // Tính t của pickPoint (projection lên line)
    const toPickX = this.pickPoint.x - lineStart.x;
    const toPickY = this.pickPoint.y - lineStart.y;
    const pickT = Math.max(
      0,
      Math.min(1, (toPickX * dx + toPickY * dy) / (lineLength * lineLength)),
    );

    // Tìm tất cả điểm giao với cutting edges
    const intersectionTs: number[] = [];

    for (const edge of cuttingEdges) {
      const edgeTs = this.findLineIntersections(
        lineStart,
        lineEnd,
        lineLength,
        edge,
      );
      for (const t of edgeTs) {
        if (t > 0.0001 && t < 0.9999) {
          intersectionTs.push(t);
        }
      }
    }

    if (intersectionTs.length === 0) {
      // Không có giao điểm - xóa toàn bộ line
      context.document!.deleteCanvasEntity(this.entityId);
      return {
        success: true,
        message: "Deleted line (no intersections)",
      };
    }

    // Sắp xếp và loại bỏ duplicates
    intersectionTs.sort((a, b) => a - b);
    const uniqueTs = intersectionTs.filter(
      (t, i, arr) => i === 0 || Math.abs(t - arr[i - 1]) > 0.0001,
    );

    // Tạo danh sách segments: [0, t1], [t1, t2], ..., [tn, 1]
    const segmentBounds: [number, number][] = [];
    let prevT = 0;
    for (const t of uniqueTs) {
      segmentBounds.push([prevT, t]);
      prevT = t;
    }
    segmentBounds.push([prevT, 1]);

    // Tìm segment chứa pickT
    let segmentToRemove = -1;
    for (let i = 0; i < segmentBounds.length; i++) {
      const [start, end] = segmentBounds[i];
      if (pickT >= start - 0.0001 && pickT <= end + 0.0001) {
        segmentToRemove = i;
        break;
      }
    }

    if (segmentToRemove === -1) {
      return { success: false, message: "Could not determine segment to trim" };
    }

    // Xóa entity gốc
    context.document!.deleteCanvasEntity(this.entityId);

    // Tạo các segments mới (trừ segment bị xóa)
    let createdCount = 0;
    for (let i = 0; i < segmentBounds.length; i++) {
      if (i === segmentToRemove) continue;

      const [startT, endT] = segmentBounds[i];
      if (endT - startT < 0.0001) continue;

      const segStart: CanvasPoint = {
        x: lineStart.x + dx * startT,
        y: lineStart.y + dy * startT,
      };
      const segEnd: CanvasPoint = {
        x: lineStart.x + dx * endT,
        y: lineStart.y + dy * endT,
      };

      const newLine: CanvasEntity = {
        ...line,
        id: generateCanvasId(),
        selected: false,
        points: [segStart, segEnd],
      };

      context.document!.addCanvasEntity(newLine);
      this.createdEntityIds.push(newLine.id);
      createdCount++;
    }

    const removedSegment = segmentBounds[segmentToRemove];
    const removedLength = (removedSegment[1] - removedSegment[0]) * lineLength;

    return {
      success: true,
      message: `Trimmed ${removedLength.toFixed(
        1,
      )} units, kept ${createdCount} segment(s)`,
    };
  }

  private findLineIntersections(
    lineStart: CanvasPoint,
    lineEnd: CanvasPoint,
    lineLength: number,
    edge: CanvasEntity,
  ): number[] {
    const results: number[] = [];

    if (edge.type === "line" && edge.points.length >= 2) {
      const intersection = this.lineLineIntersection(
        lineStart,
        lineEnd,
        edge.points[0],
        edge.points[1],
      );
      if (intersection) {
        const t = this.distanceBetween(lineStart, intersection) / lineLength;
        results.push(t);
      }
    } else if (edge.type === "rect" && edge.points.length >= 2) {
      const p1 = edge.points[0];
      const p2 = edge.points[1];
      const corners = [p1, { x: p2.x, y: p1.y }, p2, { x: p1.x, y: p2.y }];
      for (let i = 0; i < 4; i++) {
        const edgeStart = corners[i];
        const edgeEnd = corners[(i + 1) % 4];
        const intersection = this.lineLineIntersection(
          lineStart,
          lineEnd,
          edgeStart,
          edgeEnd,
        );
        if (intersection) {
          const t = this.distanceBetween(lineStart, intersection) / lineLength;
          results.push(t);
        }
      }
    } else if (edge.type === "polyline" && edge.points.length >= 2) {
      for (let i = 0; i < edge.points.length - 1; i++) {
        const intersection = this.lineLineIntersection(
          lineStart,
          lineEnd,
          edge.points[i],
          edge.points[i + 1],
        );
        if (intersection) {
          const t = this.distanceBetween(lineStart, intersection) / lineLength;
          results.push(t);
        }
      }
    } else if (edge.type === "circle" && edge.points.length >= 2) {
      const center = edge.points[0];
      const radius = edge.points[1].x;
      const circleIntersections = this.lineCircleIntersection(
        lineStart,
        lineEnd,
        center,
        radius,
      );
      for (const pt of circleIntersections) {
        const t = this.distanceBetween(lineStart, pt) / lineLength;
        if (t >= 0 && t <= 1) {
          results.push(t);
        }
      }
    }

    return results;
  }

  private lineLineIntersection(
    a1: CanvasPoint,
    a2: CanvasPoint,
    b1: CanvasPoint,
    b2: CanvasPoint,
  ): CanvasPoint | null {
    const d1x = a2.x - a1.x;
    const d1y = a2.y - a1.y;
    const d2x = b2.x - b1.x;
    const d2y = b2.y - b1.y;

    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 1e-10) return null; // Parallel

    const dx = b1.x - a1.x;
    const dy = b1.y - a1.y;

    const t1 = (dx * d2y - dy * d2x) / cross;
    const t2 = (dx * d1y - dy * d1x) / cross;

    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
      return {
        x: a1.x + t1 * d1x,
        y: a1.y + t1 * d1y,
      };
    }

    return null;
  }

  private lineCircleIntersection(
    lineStart: CanvasPoint,
    lineEnd: CanvasPoint,
    center: CanvasPoint,
    radius: number,
  ): CanvasPoint[] {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const fx = lineStart.x - center.x;
    const fy = lineStart.y - center.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];

    const results: CanvasPoint[] = [];
    const sqrtD = Math.sqrt(discriminant);

    const t1 = (-b - sqrtD) / (2 * a);
    const t2 = (-b + sqrtD) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
      results.push({
        x: lineStart.x + t1 * dx,
        y: lineStart.y + t1 * dy,
      });
    }

    if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-10) {
      results.push({
        x: lineStart.x + t2 * dx,
        y: lineStart.y + t2 * dy,
      });
    }

    return results;
  }

  private distanceBetween(p1: CanvasPoint, p2: CanvasPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Trim CIRCLE entity - biến circle thành arc
   * AutoCAD behavior: Click vào phần cần XÓA → giữ lại phần còn lại
   */
  private trimCircle(
    circle: CanvasEntity,
    cuttingEdges: CanvasEntity[],
    context: CanvasCommandContext,
  ): CommandResult {
    if (circle.points.length < 2) {
      return { success: false, message: "Invalid circle" };
    }

    const center = circle.points[0];
    const radius = circle.points[1].x;

    // Tính góc của pickPoint (điểm user click = phần cần XÓA trong AutoCAD)
    const pickAngle = this.normalizeAngle(
      Math.atan2(this.pickPoint.y - center.y, this.pickPoint.x - center.x),
    );

    // Tìm tất cả điểm giao với cutting edges → góc (đã normalized 0 to 2π)
    const intersectionAngles: number[] = [];

    for (const edge of cuttingEdges) {
      const angles = this.findCircleIntersectionAngles(center, radius, edge);
      intersectionAngles.push(...angles);
    }

    // Debug log
    console.log(
      "[TRIM CIRCLE] pickAngle:",
      ((pickAngle * 180) / Math.PI).toFixed(1) + "°",
    );
    console.log(
      "[TRIM CIRCLE] intersectionAngles:",
      intersectionAngles.map((a) => ((a * 180) / Math.PI).toFixed(1) + "°"),
    );

    // Nếu không có giao điểm → xóa toàn bộ circle
    if (intersectionAngles.length === 0) {
      context.document!.deleteCanvasEntity(this.entityId);
      return {
        success: true,
        message: "Deleted circle (no intersections found)",
      };
    }

    // Cần ít nhất 2 giao điểm để tạo arc
    if (intersectionAngles.length < 2) {
      return {
        success: false,
        message: "Need at least 2 intersection points to trim circle",
      };
    }

    // Sắp xếp góc tăng dần (0 → 2π)
    intersectionAngles.sort((a, b) => a - b);

    // Loại bỏ duplicates (góc gần nhau < 0.01 rad ≈ 0.5°)
    const uniqueAngles = intersectionAngles.filter(
      (a, i, arr) => i === 0 || Math.abs(a - arr[i - 1]) > 0.01,
    );

    console.log(
      "[TRIM CIRCLE] uniqueAngles (sorted):",
      uniqueAngles.map((a) => ((a * 180) / Math.PI).toFixed(1) + "°"),
    );

    if (uniqueAngles.length < 2) {
      return {
        success: false,
        message: "Need at least 2 distinct intersection points",
      };
    }

    // Với 2 góc giao điểm A và B (A < B sau khi sort), circle chia thành 2 arc:
    // Arc 1: A → B (phần giữa A và B)
    // Arc 2: B → A+2π (phần qua 0°)
    //
    // AutoCAD TRIM: Click vào phần nào → XÓA phần đó

    const A = uniqueAngles[0];
    const B = uniqueAngles[1];

    // Kiểm tra pickAngle có nằm giữa A và B không
    const pickInMiddle = pickAngle > A && pickAngle < B;

    console.log(
      "[TRIM CIRCLE] A =",
      ((A * 180) / Math.PI).toFixed(1) + "°, B =",
      ((B * 180) / Math.PI).toFixed(1) + "°",
    );
    console.log(
      "[TRIM CIRCLE] pickAngle in middle (between A and B)?",
      pickInMiddle,
    );

    // Xóa entity gốc
    context.document!.deleteCanvasEntity(this.entityId);

    let keepStart: number, keepEnd: number;

    // Logic cuối cùng - đảo ngược lại lần nữa
    if (pickInMiddle) {
      // PickAngle ở GIỮA A và B → user muốn XÓA phần giữa → GIỮ phần qua 0°
      keepStart = B;
      keepEnd = A + Math.PI * 2;
      console.log(
        "[TRIM CIRCLE] Click in middle → REMOVE middle → KEEP B→A+2π",
      );
    } else {
      // PickAngle ở phần qua 0° → user muốn XÓA phần qua 0° → GIỮ phần giữa
      keepStart = A;
      keepEnd = B;
      console.log(
        "[TRIM CIRCLE] Click through 0° → REMOVE through 0° → KEEP A→B",
      );
    }

    console.log(
      "[TRIM CIRCLE] KEEP arc:",
      ((keepStart * 180) / Math.PI).toFixed(1) +
        "° → " +
        ((keepEnd * 180) / Math.PI).toFixed(1) +
        "°",
    );

    const newArc: CanvasEntity = {
      ...circle,
      id: generateCanvasId(),
      type: "arc",
      selected: false,
      points: [center, { x: radius, y: 0 }],
      startAngle: keepStart,
      endAngle: keepEnd,
    };

    context.document!.addCanvasEntity(newArc);
    this.createdEntityIds.push(newArc.id);

    return {
      success: true,
      message: `Trimmed circle, kept arc from ${(
        (keepStart * 180) /
        Math.PI
      ).toFixed(0)}° to ${((keepEnd * 180) / Math.PI).toFixed(0)}°`,
    };
  }

  /**
   * Kiểm tra angle có nằm giữa startAngle và endAngle không (theo chiều dương CCW)
   */
  private isAngleBetween(
    angle: number,
    startAngle: number,
    endAngle: number,
  ): boolean {
    const normAngle = this.normalizeAngle(angle);
    const normStart = this.normalizeAngle(startAngle);
    const normEnd = this.normalizeAngle(endAngle);

    if (normStart < normEnd) {
      // Không qua 0
      return normAngle > normStart && normAngle < normEnd;
    } else {
      // Qua 0 (ví dụ: từ 300° đến 60°)
      return normAngle > normStart || normAngle < normEnd;
    }
  }

  /**
   * Trim ARC entity
   * AutoCAD behavior: Click vào phần cần xóa
   */
  private trimArc(
    arc: CanvasEntity,
    cuttingEdges: CanvasEntity[],
    context: CanvasCommandContext,
  ): CommandResult {
    if (arc.points.length < 2) {
      return { success: false, message: "Invalid arc" };
    }

    const center = arc.points[0];
    const radius = arc.points[1].x;
    const arcStart = arc.startAngle ?? 0;
    const arcEnd = arc.endAngle ?? Math.PI * 2;

    // Tính góc của pickPoint (phần cần xóa)
    const pickAngle = this.normalizeAngle(
      Math.atan2(this.pickPoint.y - center.y, this.pickPoint.x - center.x),
    );

    // Tìm tất cả điểm giao với cutting edges trong phạm vi arc
    const intersectionAngles: number[] = [];

    for (const edge of cuttingEdges) {
      const angles = this.findCircleIntersectionAngles(center, radius, edge);
      // Chỉ lấy góc nằm trong phạm vi arc
      for (const angle of angles) {
        if (this.isAngleInArc(angle, arcStart, arcEnd)) {
          intersectionAngles.push(angle);
        }
      }
    }

    // Nếu không có giao điểm trong arc
    if (intersectionAngles.length === 0) {
      context.document!.deleteCanvasEntity(this.entityId);
      return {
        success: true,
        message: "Deleted arc (no intersections found)",
      };
    }

    // Thêm arcStart và arcEnd vào danh sách để xác định bounds
    // Sắp xếp tất cả các góc theo thứ tự trên arc
    const allAngles = [...intersectionAngles];
    allAngles.sort((a, b) => {
      const aDist = this.angleDistanceFromStart(a, arcStart);
      const bDist = this.angleDistanceFromStart(b, arcStart);
      return aDist - bDist;
    });

    // Loại bỏ duplicates
    const uniqueIntersections = allAngles.filter(
      (a, i, arr) => i === 0 || Math.abs(a - arr[i - 1]) > 0.01,
    );

    if (uniqueIntersections.length === 0) {
      context.document!.deleteCanvasEntity(this.entityId);
      return {
        success: true,
        message: "Deleted arc (no valid intersections)",
      };
    }

    // AutoCAD style: Tìm góc giao bên trái và bên phải của pickAngle
    // Xét cả arcStart và arcEnd như boundary
    const allBoundaries = [arcStart, ...uniqueIntersections, arcEnd];
    allBoundaries.sort((a, b) => {
      const aDist = this.angleDistanceFromStart(a, arcStart);
      const bDist = this.angleDistanceFromStart(b, arcStart);
      return aDist - bDist;
    });

    // Loại bỏ duplicates
    const uniqueBoundaries = allBoundaries.filter(
      (a, i, arr) => i === 0 || Math.abs(a - arr[i - 1]) > 0.01,
    );

    // Tìm 2 boundaries bao quanh pickAngle
    let leftBoundary = arcStart;
    let rightBoundary = arcEnd;
    const pickDist = this.angleDistanceFromStart(pickAngle, arcStart);

    for (let i = 0; i < uniqueBoundaries.length - 1; i++) {
      const currDist = this.angleDistanceFromStart(
        uniqueBoundaries[i],
        arcStart,
      );
      const nextDist = this.angleDistanceFromStart(
        uniqueBoundaries[i + 1],
        arcStart,
      );

      if (pickDist >= currDist && pickDist <= nextDist) {
        leftBoundary = uniqueBoundaries[i];
        rightBoundary = uniqueBoundaries[i + 1];
        break;
      }
    }

    // Xóa entity gốc
    context.document!.deleteCanvasEntity(this.entityId);

    // Tạo các arc còn lại (không chứa pickAngle)
    const newArcs: CanvasEntity[] = [];

    // Arc từ arcStart đến leftBoundary (nếu leftBoundary !== arcStart)
    if (Math.abs(leftBoundary - arcStart) > 0.01) {
      const newArc1: CanvasEntity = {
        ...arc,
        id: generateCanvasId(),
        selected: false,
        startAngle: arcStart,
        endAngle: leftBoundary,
      };
      context.document!.addCanvasEntity(newArc1);
      this.createdEntityIds.push(newArc1.id);
      newArcs.push(newArc1);
    }

    // Arc từ rightBoundary đến arcEnd (nếu rightBoundary !== arcEnd)
    if (Math.abs(rightBoundary - arcEnd) > 0.01) {
      const newArc2: CanvasEntity = {
        ...arc,
        id: generateCanvasId(),
        selected: false,
        startAngle: rightBoundary,
        endAngle: arcEnd,
      };
      context.document!.addCanvasEntity(newArc2);
      this.createdEntityIds.push(newArc2.id);
      newArcs.push(newArc2);
    }

    return {
      success: true,
      message: `Trimmed arc, kept ${newArcs.length} segment(s)`,
    };
  }

  /**
   * Tìm góc giao điểm giữa circle/arc và một cutting edge
   */
  private findCircleIntersectionAngles(
    center: CanvasPoint,
    radius: number,
    edge: CanvasEntity,
  ): number[] {
    const results: number[] = [];

    if (edge.type === "line" && edge.points.length >= 2) {
      const intersections = this.lineCircleIntersection(
        edge.points[0],
        edge.points[1],
        center,
        radius,
      );

      for (const pt of intersections) {
        const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
        results.push(this.normalizeAngle(angle));
      }
    } else if (edge.type === "polyline" && edge.points.length >= 2) {
      for (let i = 0; i < edge.points.length - 1; i++) {
        const intersections = this.lineCircleIntersection(
          edge.points[i],
          edge.points[i + 1],
          center,
          radius,
        );

        for (const pt of intersections) {
          const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
          results.push(this.normalizeAngle(angle));
        }
      }
    } else if (edge.type === "rect" && edge.points.length >= 2) {
      const p1 = edge.points[0];
      const p2 = edge.points[1];
      const corners = [p1, { x: p2.x, y: p1.y }, p2, { x: p1.x, y: p2.y }];

      for (let i = 0; i < 4; i++) {
        const edgeStart = corners[i];
        const edgeEnd = corners[(i + 1) % 4];
        const intersections = this.lineCircleIntersection(
          edgeStart,
          edgeEnd,
          center,
          radius,
        );

        for (const pt of intersections) {
          const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
          results.push(this.normalizeAngle(angle));
        }
      }
    } else if (edge.type === "circle" && edge.points.length >= 2) {
      const edgeCenter = edge.points[0];
      const edgeRadius = edge.points[1].x;
      const circleIntersections = this.circleCircleIntersection(
        center,
        radius,
        edgeCenter,
        edgeRadius,
      );

      for (const pt of circleIntersections) {
        const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
        results.push(this.normalizeAngle(angle));
      }
    } else if (edge.type === "arc" && edge.points.length >= 2) {
      const edgeCenter = edge.points[0];
      const edgeRadius = edge.points[1].x;
      const edgeArcStart = edge.startAngle ?? 0;
      const edgeArcEnd = edge.endAngle ?? Math.PI * 2;

      const circleIntersections = this.circleCircleIntersection(
        center,
        radius,
        edgeCenter,
        edgeRadius,
      );

      for (const pt of circleIntersections) {
        // Check if intersection point is on the arc
        const angleOnArc = Math.atan2(pt.y - edgeCenter.y, pt.x - edgeCenter.x);
        if (this.isAngleInArc(angleOnArc, edgeArcStart, edgeArcEnd)) {
          const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
          results.push(this.normalizeAngle(angle));
        }
      }
    }

    return results;
  }

  /**
   * Find intersections between two circles
   */
  private circleCircleIntersection(
    center1: CanvasPoint,
    radius1: number,
    center2: CanvasPoint,
    radius2: number,
  ): CanvasPoint[] {
    const d = Math.sqrt(
      (center2.x - center1.x) ** 2 + (center2.y - center1.y) ** 2,
    );

    // No intersection
    if (
      d > radius1 + radius2 ||
      d < Math.abs(radius1 - radius2) ||
      d < 0.0001
    ) {
      return [];
    }

    const a = (radius1 * radius1 - radius2 * radius2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, radius1 * radius1 - a * a));

    const px = center1.x + (a * (center2.x - center1.x)) / d;
    const py = center1.y + (a * (center2.y - center1.y)) / d;

    if (h < 0.0001) {
      // One intersection (tangent)
      return [{ x: px, y: py }];
    }

    // Two intersections
    const dx = (h * (center2.y - center1.y)) / d;
    const dy = (h * (center2.x - center1.x)) / d;

    return [
      { x: px + dx, y: py - dy },
      { x: px - dx, y: py + dy },
    ];
  }

  /**
   * Normalize angle to [0, 2π)
   */
  private normalizeAngle(angle: number): number {
    let result = angle % (Math.PI * 2);
    if (result < 0) result += Math.PI * 2;
    return result;
  }

  /**
   * Check if angle is within arc (from start to end in positive direction)
   */
  private isAngleInArc(
    angle: number,
    arcStart: number,
    arcEnd: number,
  ): boolean {
    const normAngle = this.normalizeAngle(angle);
    const normStart = this.normalizeAngle(arcStart);
    const normEnd = this.normalizeAngle(arcEnd);

    if (normStart <= normEnd) {
      return normAngle >= normStart - 0.001 && normAngle <= normEnd + 0.001;
    } else {
      // Arc crosses 0
      return normAngle >= normStart - 0.001 || normAngle <= normEnd + 0.001;
    }
  }

  /**
   * Calculate angular distance from arcStart (in positive direction)
   */
  private angleDistanceFromStart(angle: number, arcStart: number): number {
    let dist = this.normalizeAngle(angle) - this.normalizeAngle(arcStart);
    if (dist < 0) dist += Math.PI * 2;
    return dist;
  }

  undo(context: CommandContext): void {
    const canvasContext = context as CanvasCommandContext;
    if (!canvasContext.document || !this.originalEntity) return;

    // Xóa các entity đã tạo
    for (const id of this.createdEntityIds) {
      canvasContext.document.deleteCanvasEntity(id);
    }

    // Khôi phục entity gốc
    canvasContext.document.addCanvasEntity(this.originalEntity);
    this.createdEntityIds = [];
  }

  getDescription(): string {
    return "Trim entity at cutting edges";
  }
}
