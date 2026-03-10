/**
 * boundaryGeometry.ts — Planar graph geometry engine for boundary detection
 *
 * STEP-5.25: Extracted from boundary.ts
 * Contains: types, segment splitting, planar graph construction,
 * face traversal (half-edge / left-hand rule), point-in-polygon tests.
 */

import type { IVec2 } from "../../geometry/Vec2";
import type { CanvasEntity } from "../../document/CadDocument";
import { distancePointToPoint } from "../../geometry/GeometryUtils";

// ==================== Types ====================

/** Tolerance cho việc merge điểm */
export const EPSILON = 0.5;

/** Node trong đồ thị phẳng */
export interface Node {
  id: number;
  x: number;
  y: number;
  /** Danh sách half-edge xuất phát từ node này, đã sắp theo góc CCW */
  outgoingEdges: HalfEdge[];
}

/** Half-edge (cạnh có hướng) */
export interface HalfEdge {
  id: number;
  startNode: Node;
  endNode: Node;
  /** Half-edge ngược chiều (twin) */
  twin: HalfEdge | null;
  /** Half-edge tiếp theo trong cùng face (theo CCW) */
  next: HalfEdge | null;
  /** Đã được sử dụng để tạo face chưa */
  used: boolean;
  /** Góc của edge (từ startNode đến endNode) */
  angle: number;
  /** Entity ID gốc */
  entityId: string;
}

/** Face (vùng kín) */
export interface Face {
  edges: HalfEdge[];
  points: IVec2[];
  signedArea: number;
  entityIds: string[];
}

export interface BoundaryResult {
  success: boolean;
  points: IVec2[];
  message: string;
  sourceEntityIds: string[];
  color: string;
  layer?: string;
}

/** Segment sau khi split */
export interface SplitSegment {
  start: IVec2;
  end: IVec2;
  entityId: string;
}

// ==================== STEP 1: SPLIT GEOMETRY AT INTERSECTIONS ====================

/**
 * Tìm giao điểm của 2 đoạn thẳng
 */
function lineLineIntersection(
  p1: IVec2,
  p2: IVec2,
  p3: IVec2,
  p4: IVec2
): IVec2 | null {
  const x1 = p1.x,
    y1 = p1.y;
  const x2 = p2.x,
    y2 = p2.y;
  const x3 = p3.x,
    y3 = p3.y;
  const x4 = p4.x,
    y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null; // Song song hoặc trùng

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  // Giao điểm phải nằm trong cả 2 đoạn thẳng (không tính đầu mút)
  const eps = 1e-6;
  if (t > eps && t < 1 - eps && u > eps && u < 1 - eps) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }
  return null;
}

/**
 * Chuyển entity thành các segments thô (chưa split)
 */
export function entityToRawSegments(entity: CanvasEntity): SplitSegment[] {
  const segments: SplitSegment[] = [];
  const { type, points, id } = entity;

  switch (type) {
    case "line":
      if (points.length >= 2) {
        segments.push({
          start: { x: points[0].x, y: points[0].y },
          end: { x: points[1].x, y: points[1].y },
          entityId: id,
        });
      }
      break;

    case "polyline":
      for (let i = 0; i < points.length - 1; i++) {
        segments.push({
          start: { x: points[i].x, y: points[i].y },
          end: { x: points[i + 1].x, y: points[i + 1].y },
          entityId: id,
        });
      }
      if (entity.closed && points.length > 2) {
        segments.push({
          start: {
            x: points[points.length - 1].x,
            y: points[points.length - 1].y,
          },
          end: { x: points[0].x, y: points[0].y },
          entityId: id,
        });
      }
      break;

    case "rect":
      if (points.length >= 4) {
        for (let i = 0; i < points.length; i++) {
          const next = (i + 1) % points.length;
          segments.push({
            start: { x: points[i].x, y: points[i].y },
            end: { x: points[next].x, y: points[next].y },
            entityId: id,
          });
        }
      }
      break;

    case "circle":
      // Convert circle to polygon với nhiều segments
      if (points.length >= 2) {
        const center = points[0];
        const radius = points[1].x;
        const numPoints = 36;
        for (let i = 0; i < numPoints; i++) {
          const angle1 = (i * 2 * Math.PI) / numPoints;
          const angle2 = ((i + 1) * 2 * Math.PI) / numPoints;
          segments.push({
            start: {
              x: center.x + radius * Math.cos(angle1),
              y: center.y + radius * Math.sin(angle1),
            },
            end: {
              x: center.x + radius * Math.cos(angle2),
              y: center.y + radius * Math.sin(angle2),
            },
            entityId: id,
          });
        }
      }
      break;
  }

  return segments;
}

/**
 * BƯỚC 1: Split tất cả segments tại mọi giao điểm
 */
export function splitSegmentsAtIntersections(
  rawSegments: SplitSegment[]
): SplitSegment[] {
  // Tìm tất cả giao điểm cho mỗi segment
  const intersectionsBySegment: Map<number, IVec2[]> = new Map();

  for (let i = 0; i < rawSegments.length; i++) {
    intersectionsBySegment.set(i, []);
  }

  // Tìm giao điểm giữa mọi cặp segments
  for (let i = 0; i < rawSegments.length; i++) {
    for (let j = i + 1; j < rawSegments.length; j++) {
      const seg1 = rawSegments[i];
      const seg2 = rawSegments[j];

      const intersection = lineLineIntersection(
        seg1.start,
        seg1.end,
        seg2.start,
        seg2.end
      );

      if (intersection) {
        intersectionsBySegment.get(i)!.push(intersection);
        intersectionsBySegment.get(j)!.push(intersection);
      }
    }
  }

  // Split mỗi segment tại các giao điểm
  const result: SplitSegment[] = [];

  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    const intersections = intersectionsBySegment.get(i)!;

    if (intersections.length === 0) {
      result.push(seg);
      continue;
    }

    // Sắp xếp giao điểm theo thứ tự từ start đến end
    const dx = seg.end.x - seg.start.x;
    const dy = seg.end.y - seg.start.y;

    const pointsWithT: { point: IVec2; t: number }[] = intersections.map(
      (p) => ({
        point: p,
        t:
          Math.abs(dx) > Math.abs(dy)
            ? (p.x - seg.start.x) / dx
            : (p.y - seg.start.y) / dy,
      })
    );

    pointsWithT.sort((a, b) => a.t - b.t);

    // Tạo các segment nhỏ
    let current = seg.start;
    for (const { point } of pointsWithT) {
      result.push({
        start: { x: current.x, y: current.y },
        end: { x: point.x, y: point.y },
        entityId: seg.entityId,
      });
      current = point;
    }
    result.push({
      start: { x: current.x, y: current.y },
      end: { x: seg.end.x, y: seg.end.y },
      entityId: seg.entityId,
    });
  }

  return result;
}

// ==================== STEP 2: BUILD PLANAR GRAPH ====================

/**
 * Kiểm tra 2 điểm có trùng nhau không
 */
function pointsEqual(p1: IVec2, p2: IVec2, tolerance = EPSILON): boolean {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

/**
 * Tìm hoặc tạo node trong danh sách nodes
 */
function findOrCreateNode(nodes: Node[], point: IVec2): Node {
  // Tìm node đã tồn tại
  for (const node of nodes) {
    if (pointsEqual({ x: node.x, y: node.y }, point)) {
      return node;
    }
  }
  // Tạo node mới
  const newNode: Node = {
    id: nodes.length,
    x: point.x,
    y: point.y,
    outgoingEdges: [],
  };
  nodes.push(newNode);
  return newNode;
}

/**
 * Tính góc từ một điểm đến điểm khác (radians, chuẩn hóa về [0, 2π))
 */
function calculateAngle(from: IVec2, to: IVec2): number {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  return angle >= 0 ? angle : angle + 2 * Math.PI;
}

/**
 * BƯỚC 2 & 3: Xây dựng Planar Graph với half-edges, sắp xếp theo góc
 */
export function buildPlanarGraph(segments: SplitSegment[]): {
  nodes: Node[];
  halfEdges: HalfEdge[];
} {
  const nodes: Node[] = [];
  const halfEdges: HalfEdge[] = [];
  let edgeId = 0;

  // Tạo half-edges từ segments
  for (const seg of segments) {
    const startNode = findOrCreateNode(nodes, seg.start);
    const endNode = findOrCreateNode(nodes, seg.end);

    // Bỏ qua segments có độ dài quá nhỏ
    const length = Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y);
    if (length < EPSILON) continue;

    // Tạo 2 half-edges (2 hướng)
    const edge1: HalfEdge = {
      id: edgeId++,
      startNode,
      endNode,
      twin: null,
      next: null,
      used: false,
      angle: calculateAngle(
        { x: startNode.x, y: startNode.y },
        { x: endNode.x, y: endNode.y }
      ),
      entityId: seg.entityId,
    };

    const edge2: HalfEdge = {
      id: edgeId++,
      startNode: endNode,
      endNode: startNode,
      twin: edge1,
      next: null,
      used: false,
      angle: calculateAngle(
        { x: endNode.x, y: endNode.y },
        { x: startNode.x, y: startNode.y }
      ),
      entityId: seg.entityId,
    };

    edge1.twin = edge2;

    // Thêm vào outgoing edges của mỗi node
    startNode.outgoingEdges.push(edge1);
    endNode.outgoingEdges.push(edge2);

    halfEdges.push(edge1, edge2);
  }

  // BƯỚC 3: Sắp xếp các cạnh quanh mỗi node theo góc CCW
  for (const node of nodes) {
    node.outgoingEdges.sort((a, b) => a.angle - b.angle);
  }

  return { nodes, halfEdges };
}

// ==================== STEP 4: FACE TRAVERSAL (Left-hand rule) ====================

/**
 * Tìm half-edge tiếp theo khi traverse (quay trái = next CCW edge)
 * Khi đến endNode của edge hiện tại, tìm edge tiếp theo trong danh sách CCW
 */
function findNextEdge(currentEdge: HalfEdge): HalfEdge | null {
  const node = currentEdge.endNode;
  const incomingTwin = currentEdge.twin!;

  // Tìm vị trí của twin trong outgoing edges của node
  const edges = node.outgoingEdges;
  const twinIdx = edges.findIndex((e) => e.id === incomingTwin.id);

  if (twinIdx === -1) return null;

  // Edge tiếp theo là edge ngay sau twin trong thứ tự CCW
  // (Đây là left-hand rule: rẽ trái tại mỗi giao điểm)
  const nextIdx = (twinIdx + 1) % edges.length;
  return edges[nextIdx];
}

/**
 * BƯỚC 4: Traverse để tìm tất cả faces
 */
export function findAllFaces(halfEdges: HalfEdge[]): Face[] {
  const faces: Face[] = [];

  for (const startEdge of halfEdges) {
    if (startEdge.used) continue;

    const faceEdges: HalfEdge[] = [];
    const facePoints: IVec2[] = [];
    const entityIds = new Set<string>();

    let currentEdge: HalfEdge | null = startEdge;
    let maxIterations = halfEdges.length;
    let valid = true;

    while (currentEdge && maxIterations-- > 0) {
      if (currentEdge.used && currentEdge !== startEdge) {
        // Đã gặp edge đã sử dụng (không phải start) = không hợp lệ
        valid = false;
        break;
      }

      faceEdges.push(currentEdge);
      facePoints.push({
        x: currentEdge.startNode.x,
        y: currentEdge.startNode.y,
      });
      entityIds.add(currentEdge.entityId);
      currentEdge.used = true;

      const nextEdge = findNextEdge(currentEdge);

      if (!nextEdge) {
        valid = false;
        break;
      }

      if (nextEdge.id === startEdge.id) {
        // Đã quay về start = hoàn thành face
        break;
      }

      currentEdge = nextEdge;
    }

    if (valid && faceEdges.length >= 3) {
      // Tính signed area để xác định hướng (CCW = positive, CW = negative)
      let signedArea = 0;
      for (let i = 0; i < facePoints.length; i++) {
        const j = (i + 1) % facePoints.length;
        signedArea += facePoints[i].x * facePoints[j].y;
        signedArea -= facePoints[j].x * facePoints[i].y;
      }
      signedArea /= 2;

      faces.push({
        edges: faceEdges,
        points: facePoints,
        signedArea,
        entityIds: Array.from(entityIds),
      });
    }
  }

  return faces;
}

// ==================== STEP 5 & 6: REMOVE OUTER FACE & SELECT BY SEED ====================

/**
 * Kiểm tra điểm có nằm trong polygon không (Ray casting algorithm)
 */
export function isPointInPolygon(point: IVec2, polygon: IVec2[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Tính diện tích polygon (absolute)
 */
export function polygonArea(points: IVec2[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area / 2);
}

/**
 * Kiểm tra điểm có nằm trong entity khép kín không
 */
export function isPointInClosedEntity(
  entity: CanvasEntity,
  point: IVec2
): { inside: boolean; points: IVec2[] } {
  const { type, points } = entity;

  // Polyline closed
  if (type === "polyline" && entity.closed && points.length >= 3) {
    const polyPoints = points.map((p) => ({ x: p.x, y: p.y }));
    const inside = isPointInPolygon(point, polyPoints);
    return { inside, points: polyPoints };
  }

  // Rect
  if (type === "rect" && points.length >= 4) {
    const rectPoints = points.map((p) => ({ x: p.x, y: p.y }));
    const inside = isPointInPolygon(point, rectPoints);
    return { inside, points: rectPoints };
  }

  // Circle
  if (type === "circle" && points.length >= 2) {
    const center = points[0];
    const radius = points[1].x;
    const dist = distancePointToPoint(point, center);
    if (dist < radius) {
      const circlePoints: IVec2[] = [];
      const numPoints = 36;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        circlePoints.push({
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
        });
      }
      return { inside: true, points: circlePoints };
    }
  }

  return { inside: false, points: [] };
}
