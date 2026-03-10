/**
 * boundaryPostProcess.ts — Post-processing utilities for boundary polyline
 *
 * STEP-5.25: Extracted from boundary.ts
 * Pure functions: normalize winding order, remove duplicates/short edges,
 * convexity check, final polyline normalization.
 */

import type { IVec2 } from "../../geometry/Vec2";

/** Tolerance cho việc merge điểm */
const EPSILON = 0.5;

// ==================== POST-PROCESSING: NORMALIZE POLYLINE ====================

/**
 * Tính signed area của polygon
 * Positive = CCW, Negative = CW
 */
export function signedPolygonArea(points: IVec2[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return area / 2;
}

/**
 * Đảo ngược thứ tự điểm để đổi hướng CW <-> CCW
 */
function reversePoints(points: IVec2[]): IVec2[] {
  return [...points].reverse();
}

/**
 * Chuẩn hóa hướng polyline thành CCW
 */
function normalizeWindingOrder(points: IVec2[]): IVec2[] {
  const signedArea = signedPolygonArea(points);

  // Nếu CW (signedArea < 0), đảo thành CCW
  if (signedArea < 0) {
    console.log("[BOUNDARY] Reversing points from CW to CCW");
    return reversePoints(points);
  }

  return points;
}

/**
 * Loại bỏ điểm trùng liên tiếp
 */
function removeDuplicatePoints(points: IVec2[], tolerance = EPSILON): IVec2[] {
  if (points.length < 2) return points;

  const result: IVec2[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);

    if (dist >= tolerance) {
      result.push(curr);
    }
  }

  // Kiểm tra điểm cuối với điểm đầu (cho closed polyline)
  if (result.length > 2) {
    const first = result[0];
    const last = result[result.length - 1];
    const dist = Math.hypot(last.x - first.x, last.y - first.y);

    if (dist < tolerance) {
      result.pop(); // Loại bỏ điểm cuối trùng với đầu
    }
  }

  return result;
}

/**
 * Loại bỏ cạnh quá ngắn (collinear points)
 * Nếu 3 điểm liên tiếp gần như thẳng hàng, loại bỏ điểm giữa
 */
function removeShortEdges(
  points: IVec2[],
  minEdgeLength = EPSILON * 2
): IVec2[] {
  if (points.length < 3) return points;

  const result: IVec2[] = [];

  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const edgeLength = Math.hypot(next.x - curr.x, next.y - curr.y);

    // Chỉ thêm điểm nếu cạnh tiếp theo đủ dài
    if (edgeLength >= minEdgeLength) {
      result.push(curr);
    } else {
      console.log(
        "[BOUNDARY] Removing short edge at point",
        i,
        "length:",
        edgeLength.toFixed(3)
      );
    }
  }

  return result.length >= 3 ? result : points; // Đảm bảo ít nhất 3 điểm
}

/**
 * Kiểm tra và xác định góc lõm/lồi tại mỗi điểm
 * Trả về true nếu tất cả các góc đều lồi (convex)
 */
function isConvexPolygon(points: IVec2[]): boolean {
  if (points.length < 3) return false;

  const n = points.length;
  let sign = 0;

  for (let i = 0; i < n; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % n];
    const p2 = points[(i + 2) % n];

    // Cross product của 2 cạnh liên tiếp
    const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);

    if (cross !== 0) {
      if (sign === 0) {
        sign = cross > 0 ? 1 : -1;
      } else if ((cross > 0 ? 1 : -1) !== sign) {
        return false; // Có góc lõm
      }
    }
  }

  return true;
}

/**
 * POST-PROCESSING: Chuẩn hóa polyline sau khi tìm face
 *
 * Checklist:
 * 1. ✅ Polyline CCW
 * 2. ✅ Không point trùng
 * 3. ✅ Không edge quá ngắn
 * 4. ✅ Log thông tin convex/concave
 */
export function normalizePolyline(points: IVec2[]): IVec2[] {
  console.log("[BOUNDARY] POST-PROCESSING: Normalizing polyline...");
  console.log("[BOUNDARY] Original points:", points.length);

  // Step 1: Loại bỏ điểm trùng
  let result = removeDuplicatePoints(points);
  console.log("[BOUNDARY] After removing duplicates:", result.length);

  // Step 2: Loại bỏ cạnh quá ngắn
  result = removeShortEdges(result);
  console.log("[BOUNDARY] After removing short edges:", result.length);

  // Step 3: Chuẩn hóa hướng CCW
  result = normalizeWindingOrder(result);

  // Step 4: Log thông tin convex/concave
  const isConvex = isConvexPolygon(result);
  console.log("[BOUNDARY] Polygon is", isConvex ? "CONVEX" : "CONCAVE");

  // Final verification
  const finalArea = signedPolygonArea(result);
  console.log(
    "[BOUNDARY] Final signed area:",
    finalArea.toFixed(2),
    finalArea > 0 ? "(CCW)" : "(CW)"
  );

  return result;
}
