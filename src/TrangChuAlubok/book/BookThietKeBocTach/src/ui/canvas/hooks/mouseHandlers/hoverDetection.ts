/**
 * hoverDetection — Handles hover detection for different tool modes
 *
 * Extracted from useMouseHandlers.ts (handleMouseMove) to reduce file size.
 * Handles hover highlight for:
 * - SELECT tool: entity + dimension + grip hover
 * - DRA (radius dimension): circle hover
 * - DLI/DAL (linear/aligned dimension): line/polyline hover
 * - selectObjects step: entity + dimension hover for modify commands
 * - OFFSET selectEntity: entity hover with edge detection
 * - TRIM selectEntity: entity hover with edge detection
 * - EXTEND selectEntity: entity hover with edge detection
 */

import type { Dispatch, SetStateAction } from "react";
import { ToolMode } from "../../../../core/engine/EngineState";
import type { DimensionEntity } from "../../../../core/dimensions/DimensionManager";
import type { DrawingState, DimensionGrip } from "../../canvas.types";
import type { Point, CadEntity } from "../../types/CadEntity";
import type { TextHitTestContext } from "../../utils";
import {
  distance,
  nearestPointOnSegment,
  hitTestEntity,
  hitTestDimension,
  hitTestDimensionGrip,
} from "../../utils";

export interface HoverDetectionParams {
  activeTool: ToolMode;
  drawState: DrawingState;
  hitTolerance: number;
  entities: CadEntity[];
  dimensions: DimensionEntity[];
  selectedDimensionIds: string[];
  setHoveredId: Dispatch<SetStateAction<string | null>>;
  setHoveredDimensionId: Dispatch<SetStateAction<string | null>>;
  setHoveredGrip: Dispatch<SetStateAction<DimensionGrip | null>>;
  textHitTestContext: TextHitTestContext | undefined;
}

/**
 * Find nearest entity using edge/circle detection within tolerance.
 * Used by OFFSET, TRIM, EXTEND hover modes.
 */
function findNearestEntityByEdge(
  entities: CadEntity[],
  worldPos: Point,
  hitTolerance: number,
  includeTypes: Set<string> = new Set([
    "line",
    "polyline",
    "circle",
    "rect",
    "arc",
  ]),
): CadEntity | null {
  let nearestEntity: CadEntity | null = null;
  let nearestDist = hitTolerance * 2;

  for (const entity of entities) {
    if (!includeTypes.has(entity.type)) continue;

    // Check line/polyline segments
    if (entity.type === "line" || entity.type === "polyline") {
      const segmentCount =
        entity.type === "polyline" && entity.closed
          ? entity.points.length
          : entity.points.length - 1;
      for (let i = 0; i < segmentCount; i++) {
        const nextIdx = (i + 1) % entity.points.length;
        const pt = nearestPointOnSegment(
          worldPos,
          entity.points[i],
          entity.points[nextIdx],
        );
        const dist = distance(worldPos, pt);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEntity = entity;
        }
      }
    }
    // Check circle
    if (entity.type === "circle" && entity.points.length >= 2) {
      const center = entity.points[0];
      const radius = entity.points[1].x;
      const distToCenter = distance(worldPos, center);
      const distToCircle = Math.abs(distToCenter - radius);
      if (distToCircle < nearestDist) {
        nearestDist = distToCircle;
        nearestEntity = entity;
      }
    }
    // Check rect (as 4 edges)
    if (entity.type === "rect" && entity.points.length >= 2) {
      const [p1, p2] = entity.points;
      const edges: [Point, Point][] = [
        [p1, { x: p2.x, y: p1.y }],
        [{ x: p2.x, y: p1.y }, p2],
        [p2, { x: p1.x, y: p2.y }],
        [{ x: p1.x, y: p2.y }, p1],
      ];
      for (const [a, b] of edges) {
        const pt = nearestPointOnSegment(worldPos, a, b);
        const dist = distance(worldPos, pt);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEntity = entity;
        }
      }
    }
    // Check arc
    if (entity.type === "arc" && entity.points.length >= 2) {
      const center = entity.points[0];
      const radius = entity.points[1].x;
      const startAngle = entity.startAngle ?? 0;
      const endAngle = entity.endAngle ?? Math.PI * 2;
      const distToCenter = distance(worldPos, center);
      const distToArc = Math.abs(distToCenter - radius);
      // Check if point is within arc angle range
      const angle = Math.atan2(worldPos.y - center.y, worldPos.x - center.x);
      const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
      const inArcRange =
        startAngle <= endAngle
          ? normalizedAngle >= startAngle && normalizedAngle <= endAngle
          : normalizedAngle >= startAngle || normalizedAngle <= endAngle;
      if (distToArc < nearestDist && inArcRange) {
        nearestDist = distToArc;
        nearestEntity = entity;
      }
    }
  }

  return nearestEntity;
}

/**
 * Run hover detection for the current mode and update hover state.
 */
export function updateHoverDetection(
  p: HoverDetectionParams,
  worldPos: Point,
): void {
  const {
    activeTool,
    drawState,
    hitTolerance,
    entities,
    dimensions,
    selectedDimensionIds,
    setHoveredId,
    setHoveredDimensionId,
    setHoveredGrip,
    textHitTestContext,
  } = p;

  // SELECT tool idle: grip + dimension + entity hover
  if (activeTool === ToolMode.SELECT && drawState.mode === "idle") {
    // Check grip hover first for selected dimensions
    let foundGrip: DimensionGrip | null = null;
    for (const dimId of selectedDimensionIds) {
      const dim = dimensions.find((d) => d.id === dimId);
      if (dim) {
        const grip = hitTestDimensionGrip(dim, worldPos, hitTolerance * 2);
        if (grip) {
          foundGrip = grip;
          break;
        }
      }
    }
    setHoveredGrip(foundGrip);

    // Check dimension hover
    const hoveredDim = dimensions.find((dim) =>
      hitTestDimension(dim, worldPos, hitTolerance),
    );
    setHoveredDimensionId(hoveredDim?.id || null);

    // Then check entity hover
    const hovered = entities.find((ent) =>
      hitTestEntity(ent, worldPos, hitTolerance, textHitTestContext),
    );
    setHoveredId(hovered?.id || null);
    return;
  }

  // DRA/DDI mode: Highlight circle on hover
  if (activeTool === ToolMode.DRAW_DIM_RADIUS && drawState.mode === "idle") {
    let foundCircleId: string | null = null;
    for (const entity of entities) {
      if (entity.type === "circle") {
        const center = entity.points[0];
        const radius = entity.points[1].x;
        const distToCenter = Math.sqrt(
          Math.pow(worldPos.x - center.x, 2) +
            Math.pow(worldPos.y - center.y, 2),
        );
        const distToEdge = Math.abs(distToCenter - radius);

        if (distToEdge <= hitTolerance * 2) {
          foundCircleId = entity.id;
          break;
        }
      }
    }
    setHoveredId(foundCircleId);
    return;
  }

  // DLI/DAL mode: Highlight line/polyline on hover
  if (
    (activeTool === ToolMode.DRAW_DIM_LINEAR ||
      activeTool === ToolMode.DRAW_DIM_ALIGNED) &&
    drawState.mode === "idle"
  ) {
    const hoveredEntity = entities.find((ent) =>
      hitTestEntity(ent, worldPos, hitTolerance, textHitTestContext),
    );
    setHoveredId(hoveredEntity?.id || null);
    return;
  }

  // selectObjects step: Highlight entity/dimension on hover
  // This provides visual feedback for "command first, select later" workflow
  if (
    (drawState.mode === "modifyMove" ||
      drawState.mode === "modifyCopy" ||
      drawState.mode === "modifyRotate" ||
      drawState.mode === "modifyMirror" ||
      drawState.mode === "modifyScale") &&
    "step" in drawState &&
    drawState.step === "selectObjects"
  ) {
    const hoveredDim = dimensions.find((dim) =>
      hitTestDimension(dim, worldPos, hitTolerance),
    );
    setHoveredDimensionId(hoveredDim?.id || null);

    const hoveredEntity = entities.find((ent) =>
      hitTestEntity(ent, worldPos, hitTolerance, textHitTestContext),
    );
    setHoveredId(hoveredEntity?.id || null);
    return;
  }

  // OFFSET mode: Highlight entity on hover when selecting
  if (
    drawState.mode === "modifyOffset" &&
    "step" in drawState &&
    drawState.step === "selectEntity"
  ) {
    const nearestEntity = findNearestEntityByEdge(
      entities,
      worldPos,
      hitTolerance,
    );
    setHoveredId(nearestEntity?.id || null);
    return;
  }

  // TRIM mode: Highlight entity on hover when selecting (glow effect)
  if (
    drawState.mode === "modifyTrim" &&
    "step" in drawState &&
    drawState.step === "selectEntity"
  ) {
    const nearestEntity = findNearestEntityByEdge(
      entities,
      worldPos,
      hitTolerance,
    );
    setHoveredId(nearestEntity?.id || null);
    return;
  }

  // EXTEND mode: Highlight entity on hover when selecting
  if (
    drawState.mode === "modifyExtend" &&
    "step" in drawState &&
    drawState.step === "selectEntity"
  ) {
    // EXTEND only works with line/polyline/arc
    const nearestEntity = findNearestEntityByEdge(
      entities,
      worldPos,
      hitTolerance,
      new Set(["line", "polyline", "arc"]),
    );
    setHoveredId(nearestEntity?.id || null);
    return;
  }
}
