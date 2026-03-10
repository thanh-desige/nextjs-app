/**
 * BOUNDARY Command (BO) - Tạo polyline khép kín từ vùng khép kín
 *
 * STEP-5.25: Thin facade — orchestrator + command class
 * Geometry engine  → ./boundaryGeometry.ts
 * Post-processing  → ./boundaryPostProcess.ts
 *
 * THUẬT TOÁN:
 * 1. SPLIT - Tách tất cả entity tại mọi giao điểm
 * 2. PLANAR GRAPH - Xây dựng đồ thị phẳng với half-edges
 * 3. SORT EDGES - Sắp xếp cạnh quanh mỗi node theo góc polar (CCW)
 * 4. FACE TRAVERSAL - Dò tất cả face bằng left-hand rule
 * 5. REMOVE OUTER FACE - Loại face ngoài (diện tích lớn nhất/unbounded)
 * 6. SELECT BY SEED - Chọn face chứa seed point
 * 7. OUTPUT - Xuất polyline khép kín
 */

import { ICommand, CommandResult, CommandContext } from "../Command.types";
import { IVec2 } from "../../geometry/Vec2";
import { CanvasEntity } from "../../document/CadDocument";

// Re-export types for backward compatibility
export type {
  BoundaryResult,
  SplitSegment,
  Node,
  HalfEdge,
  Face,
} from "./boundaryGeometry";

import {
  entityToRawSegments,
  splitSegmentsAtIntersections,
  buildPlanarGraph,
  findAllFaces,
  isPointInPolygon,
  polygonArea,
  isPointInClosedEntity,
} from "./boundaryGeometry";
import type { BoundaryResult, SplitSegment } from "./boundaryGeometry";
import { normalizePolyline } from "./boundaryPostProcess";

// ==================== MAIN BOUNDARY FUNCTION ====================

/**
 * Tìm boundary từ danh sách entities và điểm pick
 *
 * THUẬT TOÁN ĐÚNG:
 * 1. SPLIT - Tách tất cả segments tại mọi giao điểm
 * 2. BUILD PLANAR GRAPH - Xây dựng đồ thị với half-edges
 * 3. SORT EDGES - Sắp xếp cạnh quanh mỗi node theo góc CCW
 * 4. FACE TRAVERSAL - Dò tất cả faces bằng left-hand rule
 * 5. REMOVE OUTER FACE - Loại face ngoài (diện tích lớn nhất)
 * 6. SELECT BY SEED - Chọn face chứa seed point
 */
export function findBoundaryFromEntities(
  entities: CanvasEntity[],
  pickPoint: IVec2
): BoundaryResult {
  console.log("[BOUNDARY] ====== START BOUNDARY ALGORITHM ======");
  console.log(
    "[BOUNDARY] Pick point:",
    pickPoint.x.toFixed(1),
    pickPoint.y.toFixed(1)
  );
  console.log("[BOUNDARY] Total entities:", entities.length);

  const defaultColor = "#FFFFFF";

  // BƯỚC 0: Kiểm tra entity khép kín sẵn (polyline closed, rect, circle)
  const closedEntities: {
    entity: CanvasEntity;
    points: IVec2[];
    area: number;
  }[] = [];

  for (const entity of entities) {
    if (entity.visible !== false && entity.locked !== true) {
      const result = isPointInClosedEntity(entity, pickPoint);
      if (result.inside && result.points.length >= 3) {
        const area = polygonArea(result.points);
        closedEntities.push({ entity, points: result.points, area });
        console.log(
          "[BOUNDARY] Found closed entity:",
          entity.type,
          "area:",
          area.toFixed(0)
        );
      }
    }
  }

  if (closedEntities.length > 0) {
    closedEntities.sort((a, b) => a.area - b.area);
    const smallest = closedEntities[0];
    console.log(
      "[BOUNDARY] Using smallest closed entity:",
      smallest.entity.type
    );
    return {
      success: true,
      points: smallest.points,
      message: `Found closed ${smallest.entity.type} containing the pick point`,
      sourceEntityIds: [smallest.entity.id],
      color: smallest.entity.color || defaultColor,
      layer: smallest.entity.layer,
    };
  }

  // BƯỚC 1: Chuyển entities thành raw segments
  console.log("[BOUNDARY] Step 1: Converting entities to segments...");
  const rawSegments: SplitSegment[] = [];
  for (const entity of entities) {
    if (entity.visible !== false && entity.locked !== true) {
      const segs = entityToRawSegments(entity);
      rawSegments.push(...segs);
    }
  }
  console.log("[BOUNDARY] Raw segments:", rawSegments.length);

  if (rawSegments.length < 3) {
    return {
      success: false,
      points: [],
      message: "Not enough segments to form a boundary",
      sourceEntityIds: [],
      color: defaultColor,
    };
  }

  // BƯỚC 1b: Split segments tại mọi giao điểm
  console.log("[BOUNDARY] Step 1b: Splitting at intersections...");
  const splitSegments = splitSegmentsAtIntersections(rawSegments);
  console.log("[BOUNDARY] Split segments:", splitSegments.length);

  // BƯỚC 2 & 3: Xây dựng Planar Graph + sắp xếp edges theo góc
  console.log("[BOUNDARY] Step 2&3: Building planar graph...");
  const { nodes, halfEdges } = buildPlanarGraph(splitSegments);
  console.log(
    "[BOUNDARY] Nodes:",
    nodes.length,
    "| Half-edges:",
    halfEdges.length
  );

  if (halfEdges.length < 6) {
    // Cần ít nhất 3 cạnh (6 half-edges)
    return {
      success: false,
      points: [],
      message: "Not enough edges to form a boundary",
      sourceEntityIds: [],
      color: defaultColor,
    };
  }

  // BƯỚC 4: Face Traversal (Left-hand rule)
  console.log("[BOUNDARY] Step 4: Finding all faces...");
  const faces = findAllFaces(halfEdges);
  console.log("[BOUNDARY] Total faces found:", faces.length);

  if (faces.length === 0) {
    return {
      success: false,
      points: [],
      message: "No faces found in the geometry",
      sourceEntityIds: [],
      color: defaultColor,
    };
  }

  // BƯỚC 5 & 6: Chọn face chứa seed point (KHÔNG filter theo diện tích)
  // Outer face được xác định bằng signedArea orientation, không phải maxArea
  console.log("[BOUNDARY] Step 5&6: Finding face containing seed point...");

  // Log tất cả faces
  for (let i = 0; i < faces.length; i++) {
    const f = faces[i];
    const area = polygonArea(f.points);
    const orientation = f.signedArea > 0 ? "CCW" : "CW";
    console.log(
      `[BOUNDARY] Face ${i}: pts=${f.points.length}, area=${area.toFixed(
        0
      )}, signedArea=${f.signedArea.toFixed(0)} (${orientation})`
    );
  }

  // Tìm TẤT CẢ faces chứa seed point (không filter trước)
  const containingFaces: { face: typeof faces[number]; area: number }[] = [];

  for (const face of faces) {
    const inside = isPointInPolygon(pickPoint, face.points);
    if (inside) {
      const area = Math.abs(face.signedArea);
      console.log(
        "[BOUNDARY] ✓ Face contains seed point, area:",
        area.toFixed(0),
        "| signedArea:",
        face.signedArea.toFixed(0)
      );
      containingFaces.push({ face, area });
    }
  }

  console.log(
    "[BOUNDARY] Faces containing seed point:",
    containingFaces.length
  );

  if (containingFaces.length === 0) {
    console.log("[BOUNDARY] No face contains seed point. FAIL.");
    return {
      success: false,
      points: [],
      message: "No face found containing the seed point",
      sourceEntityIds: [],
      color: defaultColor,
    };
  }

  // Chọn face NHỎ NHẤT chứa seed point (inner-most face)
  // Đây là cách đúng để chọn face, không cần loại outer face trước
  containingFaces.sort((a, b) => a.area - b.area);
  const selectedFace = containingFaces[0].face;

  console.log(
    "[BOUNDARY] ✓ Selected face with",
    selectedFace.points.length,
    "vertices, area:",
    containingFaces[0].area.toFixed(0)
  );

  // BƯỚC 7: POST-PROCESSING - Chuẩn hóa polyline
  const normalizedPoints = normalizePolyline(selectedFace.points);

  // Verify pickPoint vẫn nằm trong polyline sau khi chuẩn hóa
  if (!isPointInPolygon(pickPoint, normalizedPoints)) {
    console.log(
      "[BOUNDARY] WARNING: pickPoint outside normalized polyline, using original"
    );
    // Fallback về points gốc nếu chuẩn hóa làm sai
  }

  const firstEntityId = selectedFace.entityIds[0];
  const firstEntity = entities.find((e) => e.id === firstEntityId);
  const color = firstEntity?.color || defaultColor;
  const layer = firstEntity?.layer;

  console.log("[BOUNDARY] ====== BOUNDARY COMPLETE ======");

  return {
    success: true,
    points: normalizedPoints,
    message: `Found boundary with ${normalizedPoints.length} vertices`,
    sourceEntityIds: selectedFace.entityIds,
    color,
    layer,
  };
}

// ==================== BOUNDARY Command ====================

export interface BoundaryCommandData {
  pickPoint: IVec2;
  newEntityId?: string;
}

export class BoundaryCommand implements ICommand {
  readonly name = "BOUNDARY";
  readonly description = "Create closed polyline from boundary region";
  readonly canUndo = true;

  private data: BoundaryCommandData;
  private createdEntityId: string | null = null;

  constructor(pickPoint: IVec2) {
    this.data = { pickPoint };
  }

  execute(context: CommandContext): CommandResult {
    const allEntities =
      context.engine.getAllEntities() as unknown as CanvasEntity[];

    if (!allEntities || allEntities.length === 0) {
      return {
        success: false,
        message: "No entities found in document",
      };
    }

    const result = findBoundaryFromEntities(allEntities, this.data.pickPoint);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    const newEntity: CanvasEntity = {
      id: `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "polyline",
      points: result.points.map((p) => ({ x: p.x, y: p.y })),
      color: "#00FF00",
      lineWidth: 2,
      closed: true,
      selected: true,
    };

    this.createdEntityId = newEntity.id;
    this.data.newEntityId = newEntity.id;

    context.engine.requestRender();

    return {
      success: true,
      message: `Created boundary polyline with ${result.points.length} vertices`,
      entities: [
        newEntity as unknown as import("../../entities/Entity.types").IEntity,
      ],
      data: {
        entityId: newEntity.id,
        points: result.points,
        entity: newEntity,
      },
    };
  }

  undo(context: CommandContext): void {
    if (this.createdEntityId) {
      context.engine.removeEntity(this.createdEntityId);
      context.engine.requestRender();
    }
  }

  getDescription(): string {
    return `Create boundary at (${this.data.pickPoint.x.toFixed(
      2
    )}, ${this.data.pickPoint.y.toFixed(2)})`;
  }
}

export function createBoundaryCommand(pickPoint: IVec2): BoundaryCommand {
  return new BoundaryCommand(pickPoint);
}
