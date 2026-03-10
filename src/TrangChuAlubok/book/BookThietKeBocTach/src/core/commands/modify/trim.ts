/**
 * TRIM Command - Cắt entity tại điểm giao với cutting edges
 * Hoạt động giống AutoCAD:
 * - Click vào phần của entity muốn xóa
 * - Phần đó (giữa 2 điểm giao hoặc từ điểm giao đến endpoint) sẽ bị xóa
 * - Các phần còn lại được giữ nguyên
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";
import { Vec2, IVec2 } from "../../geometry/Vec2";
import { IEntity, EntityType, EntityJSON } from "../../entities/Entity.types";
import { LineEntity } from "../../entities/Line";
import { CircleEntity } from "../../entities/Circle";
import { ArcEntity } from "../../entities/Arc";
import {
  intersectSegments,
  intersectLineCircle,
  normalizeAngle,
} from "../../geometry/GeometryUtils";

interface TrimData {
  entityId: string;
  originalJSON: EntityJSON;
  pickPoint: IVec2;
  createdEntityIds: string[];
  deletedEntityId: string;
}

export class TrimCommand implements ICommand {
  readonly name = "TRIM";
  readonly description = "Trim entity at cutting edges (AutoCAD style)";
  readonly canUndo = true;

  private data: TrimData | null = null;

  /**
   * @param entityId ID của entity cần trim
   * @param pickPoint Điểm pick (phần cần xóa)
   * @param cuttingEdgeIds IDs của các cutting edges
   */
  constructor(
    private entityId: string,
    private pickPoint: IVec2,
    private cuttingEdgeIds: string[]
  ) {}

  execute(context: CommandContext): CommandResult {
    const entity = context.engine.getEntity(this.entityId);

    if (!entity) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Lưu trạng thái gốc
    this.data = {
      entityId: this.entityId,
      originalJSON: entity.toJSON(),
      pickPoint: this.pickPoint,
      createdEntityIds: [],
      deletedEntityId: this.entityId,
    };

    // Lấy cutting edges (không bao gồm chính entity đang trim)
    const cuttingEdges = this.cuttingEdgeIds
      .filter((id) => id !== this.entityId)
      .map((id) => context.engine.getEntity(id))
      .filter((e): e is IEntity => e !== undefined);

    if (cuttingEdges.length === 0) {
      // Không có cutting edges - xóa toàn bộ entity
      context.engine.removeEntity(this.entityId);
      context.engine.requestRender();
      return {
        success: true,
        message: "Deleted entity (no cutting edges)",
      };
    }

    // Xử lý trim theo loại entity
    const result = this.trimEntity(entity, cuttingEdges, context);

    context.engine.requestRender();
    return result;
  }

  private trimEntity(
    entity: IEntity,
    cuttingEdges: IEntity[],
    context: CommandContext
  ): CommandResult {
    if (entity.type === EntityType.LINE) {
      return this.trimLine(entity as LineEntity, cuttingEdges, context);
    }

    if (entity.type === EntityType.CIRCLE) {
      return this.trimCircle(entity as CircleEntity, cuttingEdges, context);
    }

    if (entity.type === EntityType.ARC) {
      return this.trimArc(entity as ArcEntity, cuttingEdges, context);
    }

    // TODO: Support POLYLINE
    return {
      success: false,
      message: `Trim not yet supported for ${entity.type}`,
    };
  }

  /**
   * Trim LINE entity
   * Logic giống AutoCAD:
   * 1. Tìm tất cả điểm giao với cutting edges
   * 2. Chia line thành các segments bởi các điểm giao
   * 3. Xác định segment nào chứa pickPoint
   * 4. Xóa segment đó, giữ lại các segments khác
   */
  private trimLine(
    line: LineEntity,
    cuttingEdges: IEntity[],
    context: CommandContext
  ): CommandResult {
    const lineStart = line.start.clone();
    const lineEnd = line.end.clone();
    const lineDir = lineEnd.sub(lineStart);
    const lineLength = lineDir.length();

    if (lineLength < 0.0001) {
      return { success: false, message: "Line too short" };
    }

    // Tính t của pickPoint (projection lên line)
    const pickPt = Vec2.from(this.pickPoint);
    const toPickPt = pickPt.sub(lineStart);
    const pickT = Math.max(
      0,
      Math.min(1, toPickPt.dot(lineDir) / (lineLength * lineLength))
    );

    // Tìm tất cả điểm giao với cutting edges
    const intersectionTs: number[] = [];

    for (const edge of cuttingEdges) {
      const edgeIntersections = this.findIntersections(
        lineStart,
        lineEnd,
        edge
      );
      for (const t of edgeIntersections) {
        // Chỉ lấy giao điểm trong phạm vi (0, 1) - không tính endpoints
        if (t > 0.0001 && t < 0.9999) {
          intersectionTs.push(t);
        }
      }
    }

    // Nếu không có giao điểm
    if (intersectionTs.length === 0) {
      // Xóa toàn bộ line
      context.engine.removeEntity(this.entityId);
      return {
        success: true,
        message: "Deleted line (no intersections found)",
      };
    }

    // Sắp xếp các t theo thứ tự tăng dần
    intersectionTs.sort((a, b) => a - b);

    // Loại bỏ duplicates (các giao điểm trùng nhau)
    const uniqueTs = intersectionTs.filter(
      (t, i, arr) => i === 0 || Math.abs(t - arr[i - 1]) > 0.0001
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
    context.engine.removeEntity(this.entityId);

    // Tạo các segments mới (trừ segment bị xóa)
    const newEntities: IEntity[] = [];

    for (let i = 0; i < segmentBounds.length; i++) {
      if (i === segmentToRemove) continue; // Bỏ qua segment bị trim

      const [startT, endT] = segmentBounds[i];

      // Bỏ qua segments quá ngắn
      if (endT - startT < 0.0001) continue;

      const segStart = lineStart.lerp(lineEnd, startT);
      const segEnd = lineStart.lerp(lineEnd, endT);

      const newLine = new LineEntity(segStart, segEnd, {
        style: line.style,
        layerId: line.layerId,
      });

      context.engine.addEntity(newLine);
      newEntities.push(newLine);
      this.data!.createdEntityIds.push(newLine.id);
    }

    const removedSegment = segmentBounds[segmentToRemove];
    const removedLength = (removedSegment[1] - removedSegment[0]) * lineLength;

    return {
      success: true,
      message: `Trimmed ${removedLength.toFixed(1)} units, kept ${
        newEntities.length
      } segment(s)`,
      entities: newEntities,
    };
  }

  /**
   * Trim CIRCLE entity - biến circle thành arc(s)
   * Logic:
   * 1. Tìm tất cả điểm giao với cutting edges → tính góc
   * 2. Chia circle thành các arc bởi các góc giao điểm
   * 3. Xác định arc nào chứa pickPoint (góc pickPoint)
   * 4. Xóa arc đó, giữ lại các arcs khác
   */
  private trimCircle(
    circle: CircleEntity,
    cuttingEdges: IEntity[],
    context: CommandContext
  ): CommandResult {
    const center = circle.center.clone();
    const radius = circle.radius;

    // Tính góc của pickPoint
    const pickPt = Vec2.from(this.pickPoint);
    const pickAngle = normalizeAngle(
      Math.atan2(pickPt.y - center.y, pickPt.x - center.x)
    );

    // Tìm tất cả điểm giao với cutting edges → góc
    const intersectionAngles: number[] = [];

    for (const edge of cuttingEdges) {
      const angles = this.findCircleIntersectionAngles(center, radius, edge);
      intersectionAngles.push(...angles);
    }

    // Nếu không có giao điểm
    if (intersectionAngles.length === 0) {
      context.engine.removeEntity(this.entityId);
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

    // Sắp xếp góc tăng dần
    intersectionAngles.sort((a, b) => a - b);

    // Loại bỏ duplicates
    const uniqueAngles = intersectionAngles.filter(
      (a, i, arr) => i === 0 || Math.abs(a - arr[i - 1]) > 0.001
    );

    if (uniqueAngles.length < 2) {
      return {
        success: false,
        message: "Need at least 2 distinct intersection points",
      };
    }

    // Tạo các arc segments từ các góc giao điểm
    // Ví dụ: góc [30°, 120°, 240°] → arcs: [30→120], [120→240], [240→30(+360)]
    const arcSegments: { start: number; end: number }[] = [];
    for (let i = 0; i < uniqueAngles.length; i++) {
      const startAngle = uniqueAngles[i];
      const endAngle = uniqueAngles[(i + 1) % uniqueAngles.length];
      arcSegments.push({ start: startAngle, end: endAngle });
    }

    // Tìm arc chứa pickAngle
    let arcToRemove = -1;
    for (let i = 0; i < arcSegments.length; i++) {
      const { start, end } = arcSegments[i];
      if (this.isAngleInArc(pickAngle, start, end)) {
        arcToRemove = i;
        break;
      }
    }

    if (arcToRemove === -1) {
      return { success: false, message: "Could not determine arc to trim" };
    }

    // Xóa entity gốc
    context.engine.removeEntity(this.entityId);

    // Tạo các arc mới (trừ arc bị xóa)
    const newEntities: IEntity[] = [];

    for (let i = 0; i < arcSegments.length; i++) {
      if (i === arcToRemove) continue;

      const { start, end } = arcSegments[i];

      const newArc = new ArcEntity(center, radius, start, end, {
        style: circle.style,
        layerId: circle.layerId,
      });

      context.engine.addEntity(newArc);
      newEntities.push(newArc);
      this.data!.createdEntityIds.push(newArc.id);
    }

    return {
      success: true,
      message: `Trimmed circle, created ${newEntities.length} arc(s)`,
      entities: newEntities,
    };
  }

  /**
   * Trim ARC entity
   * Logic tương tự trimCircle nhưng chỉ xét trong phạm vi arc
   */
  private trimArc(
    arc: ArcEntity,
    cuttingEdges: IEntity[],
    context: CommandContext
  ): CommandResult {
    const center = arc.center.clone();
    const radius = arc.radius;
    const arcStart = arc.startAngle;
    const arcEnd = arc.endAngle;

    // Tính góc của pickPoint
    const pickPt = Vec2.from(this.pickPoint);
    const pickAngle = normalizeAngle(
      Math.atan2(pickPt.y - center.y, pickPt.x - center.x)
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
      context.engine.removeEntity(this.entityId);
      return {
        success: true,
        message: "Deleted arc (no intersections found)",
      };
    }

    // Thêm arcStart và arcEnd vào danh sách điểm phân chia
    const allAngles = [arcStart, ...intersectionAngles, arcEnd];

    // Sắp xếp theo thứ tự trên arc
    allAngles.sort((a, b) => {
      const aNorm = this.angleDistanceFromStart(a, arcStart);
      const bNorm = this.angleDistanceFromStart(b, arcStart);
      return aNorm - bNorm;
    });

    // Loại bỏ duplicates
    const uniqueAngles = allAngles.filter(
      (a, i, arr) => i === 0 || Math.abs(a - arr[i - 1]) > 0.001
    );

    if (uniqueAngles.length < 2) {
      return {
        success: false,
        message: "No valid segments to create",
      };
    }

    // Tạo các arc segments
    const arcSegments: { start: number; end: number }[] = [];
    for (let i = 0; i < uniqueAngles.length - 1; i++) {
      arcSegments.push({ start: uniqueAngles[i], end: uniqueAngles[i + 1] });
    }

    // Tìm segment chứa pickAngle
    let segmentToRemove = -1;
    for (let i = 0; i < arcSegments.length; i++) {
      const { start, end } = arcSegments[i];
      if (this.isAngleInArc(pickAngle, start, end)) {
        segmentToRemove = i;
        break;
      }
    }

    if (segmentToRemove === -1) {
      return {
        success: false,
        message: "Could not determine arc segment to trim",
      };
    }

    // Xóa entity gốc
    context.engine.removeEntity(this.entityId);

    // Tạo các arc mới (trừ segment bị xóa)
    const newEntities: IEntity[] = [];

    for (let i = 0; i < arcSegments.length; i++) {
      if (i === segmentToRemove) continue;

      const { start, end } = arcSegments[i];

      // Bỏ qua arc quá ngắn
      let sweep = end - start;
      if (sweep < 0) sweep += Math.PI * 2;
      if (sweep < 0.001) continue;

      const newArc = new ArcEntity(center, radius, start, end, {
        style: arc.style,
        layerId: arc.layerId,
      });

      context.engine.addEntity(newArc);
      newEntities.push(newArc);
      this.data!.createdEntityIds.push(newArc.id);
    }

    return {
      success: true,
      message: `Trimmed arc, kept ${newEntities.length} segment(s)`,
      entities: newEntities,
    };
  }

  /**
   * Kiểm tra góc có nằm trong arc (từ start đến end theo chiều dương)
   */
  private isAngleInArc(
    angle: number,
    arcStart: number,
    arcEnd: number
  ): boolean {
    const normAngle = normalizeAngle(angle);
    const normStart = normalizeAngle(arcStart);
    const normEnd = normalizeAngle(arcEnd);

    if (normStart <= normEnd) {
      return normAngle >= normStart - 0.001 && normAngle <= normEnd + 0.001;
    } else {
      // Arc qua 0
      return normAngle >= normStart - 0.001 || normAngle <= normEnd + 0.001;
    }
  }

  /**
   * Tính khoảng cách góc từ arcStart (theo chiều dương)
   */
  private angleDistanceFromStart(angle: number, arcStart: number): number {
    let dist = normalizeAngle(angle) - normalizeAngle(arcStart);
    if (dist < 0) dist += Math.PI * 2;
    return dist;
  }

  /**
   * Tìm góc giao điểm giữa circle/arc và một cutting edge
   */
  private findCircleIntersectionAngles(
    center: Vec2,
    radius: number,
    edge: IEntity
  ): number[] {
    const results: number[] = [];

    if (edge.type === EntityType.LINE) {
      const line = edge as LineEntity;
      const circleResult = intersectLineCircle(line.start, line.end, {
        center,
        radius,
      });

      if (circleResult.intersects) {
        for (const pt of circleResult.points) {
          // Kiểm tra điểm giao nằm trên segment
          const t = this.pointOnLineT(pt, line.start, line.end);
          if (t >= -0.001 && t <= 1.001) {
            const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
            results.push(normalizeAngle(angle));
          }
        }
      }
    } else if (edge.type === EntityType.POLYLINE) {
      const polyline = edge as unknown as { getPoints(): IVec2[] };
      const points = polyline.getPoints();
      for (let i = 0; i < points.length - 1; i++) {
        const segStart = Vec2.from(points[i]);
        const segEnd = Vec2.from(points[i + 1]);
        const circleResult = intersectLineCircle(segStart, segEnd, {
          center,
          radius,
        });

        if (circleResult.intersects) {
          for (const pt of circleResult.points) {
            const t = this.pointOnLineT(pt, segStart, segEnd);
            if (t >= -0.001 && t <= 1.001) {
              const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
              results.push(normalizeAngle(angle));
            }
          }
        }
      }
    } else if (edge.type === EntityType.RECT) {
      const rect = edge as unknown as { getPoints(): IVec2[] };
      const points = rect.getPoints();
      if (points.length >= 2) {
        const p1 = Vec2.from(points[0]);
        const p2 = Vec2.from(points[1]);
        const corners = [p1, new Vec2(p2.x, p1.y), p2, new Vec2(p1.x, p2.y)];

        for (let i = 0; i < 4; i++) {
          const edgeStart = corners[i];
          const edgeEnd = corners[(i + 1) % 4];
          const circleResult = intersectLineCircle(edgeStart, edgeEnd, {
            center,
            radius,
          });

          if (circleResult.intersects) {
            for (const pt of circleResult.points) {
              const t = this.pointOnLineT(pt, edgeStart, edgeEnd);
              if (t >= -0.001 && t <= 1.001) {
                const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
                results.push(normalizeAngle(angle));
              }
            }
          }
        }
      }
    } else if (edge.type === EntityType.ARC) {
      // Arc as cutting edge - find circle-circle intersection
      const arcEdge = edge as ArcEntity;
      const circleIntersections = this.findCircleCircleIntersections(
        center,
        radius,
        arcEdge.center,
        arcEdge.radius
      );

      for (const pt of circleIntersections) {
        // Check if intersection point is on the arc
        const angleOnArc = Math.atan2(
          pt.y - arcEdge.center.y,
          pt.x - arcEdge.center.x
        );
        if (arcEdge.containsAngle(angleOnArc)) {
          const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
          results.push(normalizeAngle(angle));
        }
      }
    } else if (edge.type === EntityType.CIRCLE) {
      // Circle as cutting edge
      const circleEdge = edge as CircleEntity;
      const circleIntersections = this.findCircleCircleIntersections(
        center,
        radius,
        circleEdge.center,
        circleEdge.radius
      );

      for (const pt of circleIntersections) {
        const angle = Math.atan2(pt.y - center.y, pt.x - center.x);
        results.push(normalizeAngle(angle));
      }
    }

    return results;
  }

  /**
   * Find intersections between two circles
   */
  private findCircleCircleIntersections(
    center1: IVec2,
    radius1: number,
    center2: IVec2,
    radius2: number
  ): Vec2[] {
    const d = Math.sqrt(
      (center2.x - center1.x) ** 2 + (center2.y - center1.y) ** 2
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
      return [new Vec2(px, py)];
    }

    // Two intersections
    const dx = (h * (center2.y - center1.y)) / d;
    const dy = (h * (center2.x - center1.x)) / d;

    return [new Vec2(px + dx, py - dy), new Vec2(px - dx, py + dy)];
  }

  /**
   * Tính t của điểm trên line segment (0-1)
   */
  private pointOnLineT(point: IVec2, lineStart: Vec2, lineEnd: Vec2): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 0.0001) return 0;
    return (
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq
    );
  }

  /**
   * Tìm tất cả giao điểm giữa line và một cutting edge
   * Trả về array các giá trị t (0-1) trên line
   */
  private findIntersections(
    lineStart: Vec2,
    lineEnd: Vec2,
    edge: IEntity
  ): number[] {
    const results: number[] = [];
    const lineLength = lineStart.distanceTo(lineEnd);

    if (edge.type === EntityType.LINE) {
      const edgeLine = edge as LineEntity;
      const result = intersectSegments(
        lineStart,
        lineEnd,
        edgeLine.start,
        edgeLine.end
      );

      if (result.intersects && result.points.length > 0) {
        for (const pt of result.points) {
          const t = lineStart.distanceTo(pt) / lineLength;
          results.push(t);
        }
      }
    } else if (edge.type === EntityType.CIRCLE) {
      // Circle intersection
      const circleEntity = edge as CircleEntity;
      const center = circleEntity.center;
      const radius = circleEntity.radius;

      const circleResult = intersectLineCircle(lineStart, lineEnd, {
        center,
        radius,
      });
      if (circleResult.intersects) {
        for (const pt of circleResult.points) {
          const t = lineStart.distanceTo(pt) / lineLength;
          // Chỉ lấy điểm trong phạm vi segment
          if (t >= 0 && t <= 1) {
            results.push(t);
          }
        }
      }
    } else if (edge.type === EntityType.RECT) {
      // Rect = 4 edges
      const rect = edge as unknown as { getPoints(): IVec2[] };
      const points = rect.getPoints();
      if (points.length >= 2) {
        const p1 = Vec2.from(points[0]);
        const p2 = Vec2.from(points[1]);
        const corners = [p1, new Vec2(p2.x, p1.y), p2, new Vec2(p1.x, p2.y)];

        for (let i = 0; i < 4; i++) {
          const edgeStart = corners[i];
          const edgeEnd = corners[(i + 1) % 4];
          const result = intersectSegments(
            lineStart,
            lineEnd,
            edgeStart,
            edgeEnd
          );

          if (result.intersects && result.points.length > 0) {
            for (const pt of result.points) {
              const t = lineStart.distanceTo(pt) / lineLength;
              results.push(t);
            }
          }
        }
      }
    } else if (edge.type === EntityType.POLYLINE) {
      // Polyline = multiple segments
      const polyline = edge as unknown as { getPoints(): IVec2[] };
      const points = polyline.getPoints();
      for (let i = 0; i < points.length - 1; i++) {
        const edgeStart = Vec2.from(points[i]);
        const edgeEnd = Vec2.from(points[i + 1]);
        const result = intersectSegments(
          lineStart,
          lineEnd,
          edgeStart,
          edgeEnd
        );

        if (result.intersects && result.points.length > 0) {
          for (const pt of result.points) {
            const t = lineStart.distanceTo(pt) / lineLength;
            results.push(t);
          }
        }
      }
    } else if (edge.type === EntityType.ARC) {
      // Arc as cutting edge for line
      const arcEdge = edge as ArcEntity;
      const circleResult = intersectLineCircle(lineStart, lineEnd, {
        center: arcEdge.center,
        radius: arcEdge.radius,
      });

      if (circleResult.intersects) {
        for (const pt of circleResult.points) {
          // Check if point is on the arc
          const angleOnArc = Math.atan2(
            pt.y - arcEdge.center.y,
            pt.x - arcEdge.center.x
          );
          if (arcEdge.containsAngle(angleOnArc)) {
            const t = lineStart.distanceTo(pt) / lineLength;
            // Only take points within segment
            if (t >= 0 && t <= 1) {
              results.push(t);
            }
          }
        }
      }
    }

    return results;
  }

  undo(context: CommandContext): void {
    if (!this.data) return;

    // Xóa các entity đã tạo
    for (const id of this.data.createdEntityIds) {
      context.engine.removeEntity(id);
    }

    // Restore entity gốc từ JSON
    const originalJSON = this.data.originalJSON;
    let restoredEntity: IEntity | null = null;

    if (originalJSON.type === EntityType.LINE) {
      const points = originalJSON.points as IVec2[];
      restoredEntity = new LineEntity(
        Vec2.from(points[0]),
        Vec2.from(points[1]),
        {
          style: originalJSON.style,
          layerId: originalJSON.layerId,
        }
      );
    } else if (originalJSON.type === EntityType.CIRCLE) {
      restoredEntity = new CircleEntity(
        Vec2.from(originalJSON.center as IVec2),
        originalJSON.radius as number,
        {
          style: originalJSON.style,
          layerId: originalJSON.layerId,
        }
      );
    } else if (originalJSON.type === EntityType.ARC) {
      restoredEntity = new ArcEntity(
        Vec2.from(originalJSON.center as IVec2),
        originalJSON.radius as number,
        originalJSON.startAngle as number,
        originalJSON.endAngle as number,
        {
          style: originalJSON.style,
          layerId: originalJSON.layerId,
        }
      );
    }

    if (restoredEntity) {
      // Gán lại ID gốc
      (restoredEntity as unknown as { _id: string })._id = this.data.entityId;
      context.engine.addEntity(restoredEntity);
    }

    context.engine.requestRender();
  }

  redo(context: CommandContext): CommandResult {
    return this.execute(context);
  }
}

export default TrimCommand;
