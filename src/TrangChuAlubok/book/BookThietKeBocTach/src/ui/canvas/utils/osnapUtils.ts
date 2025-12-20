/**
 * OSNAP utilities for CAD canvas
 * Contains object snap calculations and utilities
 */

import {
  Point,
  distance,
  nearestPointOnSegment,
  perpendicularPointOnLine,
  lineSegmentIntersection,
  lineCircleIntersection,
  circleCircleIntersection,
} from "./geometry";
import { CadEntity } from "./entityUtils";

/**
 * OSNAP modes configuration
 */
export interface OsnapModes {
  endpoint: boolean;
  midpoint: boolean;
  center: boolean;
  intersection: boolean;
  perpendicular: boolean;
  nearest: boolean;
}

/**
 * Layer interface for visibility checking
 */
export interface Layer {
  id: string;
  visible: boolean;
  color?: string;
}

/**
 * OSNAP result
 */
export interface OsnapResult {
  point: Point;
  type: string;
}

/**
 * Check if an OSNAP mode is enabled
 */
export const isOsnapModeEnabled = (
  type: string,
  osnapModes: OsnapModes
): boolean => {
  const typeMap: Record<string, string> = {
    ENDPOINT: "endpoint",
    MIDPOINT: "midpoint",
    CENTER: "center",
    INTERSECTION: "intersection",
    PERPENDICULAR: "perpendicular",
    NEAREST: "nearest",
    QUADRANT: "endpoint", // Quadrant uses endpoint mode
    NODE: "endpoint", // Node uses endpoint mode
  };
  const modeKey = typeMap[type] || type.toLowerCase();
  return osnapModes[modeKey as keyof OsnapModes] ?? false;
};

/**
 * Find OSNAP point candidates for line/polyline entities
 */
const findLinePolylineOsnaps = (
  entity: CadEntity,
  cursor: Point,
  fromPoint: Point | undefined,
  osnapAperture: number,
  osnapModes: OsnapModes
): { point: Point; type: string; dist: number }[] => {
  const candidates: { point: Point; type: string; dist: number }[] = [];

  // Endpoints - only if endpoint mode is enabled
  if (isOsnapModeEnabled("ENDPOINT", osnapModes)) {
    entity.points.forEach((pt, idx) => {
      const dist = distance(cursor, pt);
      if (dist <= osnapAperture) {
        candidates.push({
          point: pt,
          type:
            idx === 0
              ? "ENDPOINT"
              : idx === entity.points.length - 1
              ? "ENDPOINT"
              : "NODE",
          dist,
        });
      }
    });
  }

  // Midpoints - only if midpoint mode is enabled
  if (isOsnapModeEnabled("MIDPOINT", osnapModes)) {
    for (let i = 0; i < entity.points.length - 1; i++) {
      const p1 = entity.points[i];
      const p2 = entity.points[i + 1];
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const dist = distance(cursor, mid);
      if (dist <= osnapAperture) {
        candidates.push({ point: mid, type: "MIDPOINT", dist });
      }
    }
  }

  // Nearest point on line segments - only if nearest mode is enabled
  if (isOsnapModeEnabled("NEAREST", osnapModes)) {
    for (let i = 0; i < entity.points.length - 1; i++) {
      const p1 = entity.points[i];
      const p2 = entity.points[i + 1];
      const nearest = nearestPointOnSegment(cursor, p1, p2);
      const dist = distance(cursor, nearest);
      if (dist <= osnapAperture && dist < osnapAperture * 0.8) {
        candidates.push({ point: nearest, type: "NEAREST", dist });
      }
    }
  }

  // Perpendicular point - only if perpendicular mode is enabled and we have a fromPoint
  if (isOsnapModeEnabled("PERPENDICULAR", osnapModes) && fromPoint) {
    for (let i = 0; i < entity.points.length - 1; i++) {
      const p1 = entity.points[i];
      const p2 = entity.points[i + 1];
      // Calculate perpendicular foot from fromPoint to line segment
      const perpPoint = perpendicularPointOnLine(fromPoint, p1, p2);
      if (perpPoint) {
        const dist = distance(cursor, perpPoint);
        if (dist <= osnapAperture * 1.5) {
          candidates.push({
            point: perpPoint,
            type: "PERPENDICULAR",
            dist,
          });
        }
      }
    }
  }

  return candidates;
};

/**
 * Find OSNAP point candidates for rectangle entities
 */
const findRectOsnaps = (
  entity: CadEntity,
  cursor: Point,
  fromPoint: Point | undefined,
  osnapAperture: number,
  osnapModes: OsnapModes
): { point: Point; type: string; dist: number }[] => {
  const candidates: { point: Point; type: string; dist: number }[] = [];
  const [c1, c2] = entity.points;
  const corners = [c1, { x: c2.x, y: c1.y }, c2, { x: c1.x, y: c2.y }];

  // Corner endpoints - only if endpoint mode is enabled
  if (isOsnapModeEnabled("ENDPOINT", osnapModes)) {
    corners.forEach((corner) => {
      const dist = distance(cursor, corner);
      if (dist <= osnapAperture) {
        candidates.push({ point: corner, type: "ENDPOINT", dist });
      }
    });
  }

  // Midpoints of edges - only if midpoint mode is enabled
  if (isOsnapModeEnabled("MIDPOINT", osnapModes)) {
    const edges = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]],
    ];
    edges.forEach(([e1, e2]) => {
      const mid = { x: (e1.x + e2.x) / 2, y: (e1.y + e2.y) / 2 };
      const dist = distance(cursor, mid);
      if (dist <= osnapAperture) {
        candidates.push({ point: mid, type: "MIDPOINT", dist });
      }
    });
  }

  // Center of rectangle - only if center mode is enabled
  if (isOsnapModeEnabled("CENTER", osnapModes)) {
    const center = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };
    const centerDist = distance(cursor, center);
    if (centerDist <= osnapAperture) {
      candidates.push({
        point: center,
        type: "CENTER",
        dist: centerDist,
      });
    }
  }

  // Perpendicular to edges - only if perpendicular mode is enabled
  if (isOsnapModeEnabled("PERPENDICULAR", osnapModes) && fromPoint) {
    const edges = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]],
    ];
    edges.forEach(([e1, e2]) => {
      const perpPoint = perpendicularPointOnLine(fromPoint, e1, e2);
      if (perpPoint) {
        const dist = distance(cursor, perpPoint);
        if (dist <= osnapAperture * 1.5) {
          candidates.push({
            point: perpPoint,
            type: "PERPENDICULAR",
            dist,
          });
        }
      }
    });
  }

  // Nearest point on rectangle edges - only if nearest mode is enabled
  if (isOsnapModeEnabled("NEAREST", osnapModes)) {
    const edges = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]],
    ];

    // Find nearest point on each edge
    let nearestPoint: Point | null = null;
    let minDist = Infinity;

    edges.forEach(([e1, e2]) => {
      const nearest = nearestPointOnSegment(cursor, e1, e2);
      const dist = distance(cursor, nearest);
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = nearest;
      }
    });

    if (nearestPoint && minDist <= osnapAperture) {
      candidates.push({
        point: nearestPoint,
        type: "NEAREST",
        dist: minDist,
      });
    }
  }

  return candidates;
};

/**
 * Find OSNAP point candidates for circle entities
 */
const findCircleOsnaps = (
  entity: CadEntity,
  cursor: Point,
  fromPoint: Point | undefined,
  osnapAperture: number,
  osnapModes: OsnapModes
): { point: Point; type: string; dist: number }[] => {
  const candidates: { point: Point; type: string; dist: number }[] = [];
  const center = entity.points[0];
  const radius = entity.points[1].x;
  const centerDist = distance(cursor, center);

  // Center - only if center mode is enabled
  if (isOsnapModeEnabled("CENTER", osnapModes)) {
    if (centerDist <= osnapAperture) {
      candidates.push({
        point: center,
        type: "CENTER",
        dist: centerDist,
      });
    }
  }

  // Quadrant points - uses endpoint mode
  if (isOsnapModeEnabled("ENDPOINT", osnapModes)) {
    const quadrants = [
      { x: center.x + radius, y: center.y },
      { x: center.x - radius, y: center.y },
      { x: center.x, y: center.y + radius },
      { x: center.x, y: center.y - radius },
    ];
    quadrants.forEach((q) => {
      const dist = distance(cursor, q);
      if (dist <= osnapAperture) {
        candidates.push({ point: q, type: "QUADRANT", dist });
      }
    });
  }

  // Nearest point on circle - only if nearest mode is enabled
  if (isOsnapModeEnabled("NEAREST", osnapModes)) {
    if (centerDist > 0) {
      const angle = Math.atan2(cursor.y - center.y, cursor.x - center.x);
      const nearestOnCircle = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
      const dist = distance(cursor, nearestOnCircle);
      if (dist <= osnapAperture) {
        candidates.push({
          point: nearestOnCircle,
          type: "NEAREST",
          dist,
        });
      }
    }
  }

  // Perpendicular point on circle - only if perpendicular mode is enabled
  if (isOsnapModeEnabled("PERPENDICULAR", osnapModes) && fromPoint) {
    // Perpendicular to circle = point on circle closest to fromPoint
    const distToCenter = distance(fromPoint, center);
    if (distToCenter > 0) {
      const angle = Math.atan2(fromPoint.y - center.y, fromPoint.x - center.x);
      const perpOnCircle = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
      const dist = distance(cursor, perpOnCircle);
      if (dist <= osnapAperture * 1.5) {
        candidates.push({
          point: perpOnCircle,
          type: "PERPENDICULAR",
          dist,
        });
      }
    }
  }

  return candidates;
};

/**
 * Helper to get line segments from entity
 */
const getEntitySegments = (entity: CadEntity): { p1: Point; p2: Point }[] => {
  const segments: { p1: Point; p2: Point }[] = [];
  if (entity.type === "line" || entity.type === "polyline") {
    for (let i = 0; i < entity.points.length - 1; i++) {
      segments.push({ p1: entity.points[i], p2: entity.points[i + 1] });
    }
  } else if (entity.type === "rect") {
    const [c1, c2] = entity.points;
    const corners = [c1, { x: c2.x, y: c1.y }, c2, { x: c1.x, y: c2.y }];
    for (let i = 0; i < 4; i++) {
      segments.push({
        p1: corners[i],
        p2: corners[(i + 1) % 4],
      });
    }
  }
  return segments;
};

/**
 * Find intersection OSNAP candidates between all visible entities
 */
const findIntersectionOsnaps = (
  entities: CadEntity[],
  cursor: Point,
  osnapAperture: number,
  layers: Layer[]
): { point: Point; type: string; dist: number }[] => {
  const candidates: { point: Point; type: string; dist: number }[] = [];

  const visibleEntities = entities.filter((entity) => {
    if (entity.layer && layers.length > 0) {
      const entityLayer = layers.find((l) => l.id === entity.layer);
      if (entityLayer && !entityLayer.visible) return false;
    }
    return true;
  });

  // Check intersections between all pairs of entities
  for (let i = 0; i < visibleEntities.length; i++) {
    for (let j = i + 1; j < visibleEntities.length; j++) {
      const e1 = visibleEntities[i];
      const e2 = visibleEntities[j];

      // Line/Polyline/Rect vs Line/Polyline/Rect
      if (
        (e1.type === "line" || e1.type === "polyline" || e1.type === "rect") &&
        (e2.type === "line" || e2.type === "polyline" || e2.type === "rect")
      ) {
        const segs1 = getEntitySegments(e1);
        const segs2 = getEntitySegments(e2);
        for (const s1 of segs1) {
          for (const s2 of segs2) {
            const intersection = lineSegmentIntersection(
              s1.p1,
              s1.p2,
              s2.p1,
              s2.p2
            );
            if (intersection) {
              const dist = distance(cursor, intersection);
              if (dist <= osnapAperture) {
                candidates.push({
                  point: intersection,
                  type: "INTERSECTION",
                  dist,
                });
              }
            }
          }
        }
      }

      // Line/Polyline/Rect vs Circle
      if (
        (e1.type === "line" || e1.type === "polyline" || e1.type === "rect") &&
        e2.type === "circle"
      ) {
        const segs = getEntitySegments(e1);
        const center = e2.points[0];
        const radius = e2.points[1].x;
        for (const seg of segs) {
          const intersections = lineCircleIntersection(
            seg.p1,
            seg.p2,
            center,
            radius
          );
          for (const pt of intersections) {
            const dist = distance(cursor, pt);
            if (dist <= osnapAperture) {
              candidates.push({
                point: pt,
                type: "INTERSECTION",
                dist,
              });
            }
          }
        }
      }

      // Circle vs Line/Polyline/Rect
      if (
        e1.type === "circle" &&
        (e2.type === "line" || e2.type === "polyline" || e2.type === "rect")
      ) {
        const segs = getEntitySegments(e2);
        const center = e1.points[0];
        const radius = e1.points[1].x;
        for (const seg of segs) {
          const intersections = lineCircleIntersection(
            seg.p1,
            seg.p2,
            center,
            radius
          );
          for (const pt of intersections) {
            const dist = distance(cursor, pt);
            if (dist <= osnapAperture) {
              candidates.push({
                point: pt,
                type: "INTERSECTION",
                dist,
              });
            }
          }
        }
      }

      // Circle vs Circle
      if (e1.type === "circle" && e2.type === "circle") {
        const c1 = e1.points[0];
        const r1 = e1.points[1].x;
        const c2 = e2.points[0];
        const r2 = e2.points[1].x;
        const intersections = circleCircleIntersection(c1, r1, c2, r2);
        for (const pt of intersections) {
          const dist = distance(cursor, pt);
          if (dist <= osnapAperture) {
            candidates.push({
              point: pt,
              type: "INTERSECTION",
              dist,
            });
          }
        }
      }
    }
  }

  return candidates;
};

/**
 * Find the best OSNAP point for current cursor position
 */
export const findOsnapPoint = (
  cursor: Point,
  entities: CadEntity[],
  layers: Layer[],
  osnapEnabled: boolean,
  osnapModes: OsnapModes,
  osnapAperture: number,
  fromPoint?: Point
): OsnapResult | null => {
  if (!osnapEnabled) return null;

  // Check if any osnap mode is enabled
  const hasAnyOsnapEnabled = Object.values(osnapModes).some((v) => v);
  if (!hasAnyOsnapEnabled) return null;

  const candidates: { point: Point; type: string; dist: number }[] = [];

  entities.forEach((entity) => {
    // Check layer visibility
    if (entity.layer && layers.length > 0) {
      const entityLayer = layers.find((l) => l.id === entity.layer);
      if (entityLayer && !entityLayer.visible) return;
    }

    if (entity.type === "line" || entity.type === "polyline") {
      candidates.push(
        ...findLinePolylineOsnaps(
          entity,
          cursor,
          fromPoint,
          osnapAperture,
          osnapModes
        )
      );
    }

    if (entity.type === "rect") {
      candidates.push(
        ...findRectOsnaps(entity, cursor, fromPoint, osnapAperture, osnapModes)
      );
    }

    if (entity.type === "circle") {
      candidates.push(
        ...findCircleOsnaps(
          entity,
          cursor,
          fromPoint,
          osnapAperture,
          osnapModes
        )
      );
    }
  });

  // Add intersection candidates
  if (isOsnapModeEnabled("INTERSECTION", osnapModes)) {
    candidates.push(
      ...findIntersectionOsnaps(entities, cursor, osnapAperture, layers)
    );
  }

  if (candidates.length === 0) return null;

  // Sort by priority: INTERSECTION > ENDPOINT > CENTER > PERPENDICULAR > MIDPOINT > QUADRANT > NEAREST
  const priority: Record<string, number> = {
    INTERSECTION: 1,
    ENDPOINT: 2,
    CENTER: 3,
    PERPENDICULAR: 4,
    MIDPOINT: 5,
    QUADRANT: 6,
    NODE: 7,
    NEAREST: 8,
  };

  candidates.sort((a, b) => {
    const pa = priority[a.type] || 99;
    const pb = priority[b.type] || 99;
    if (pa !== pb) return pa - pb;
    return a.dist - b.dist;
  });

  return { point: candidates[0].point, type: candidates[0].type };
};
