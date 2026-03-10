/**
 * dimensionMouseDown — Handles mouseDown for DIMENSION tools
 *
 * STEP-5.23 extraction from useMouseHandlers.ts to reduce file size.
 * Handles:
 * - QDIM confirm click
 * - Circle/arc detection for radius/diameter/arc dimensions
 * - Line detection for linear/aligned/angular dimensions
 * - OSNAP entity matching for associative dimension support
 *
 * ĐIỀU KIỆN 1: UI chỉ thu thập điểm, gọi callback để parent tạo Command và execute
 */

import { ToolMode } from "../../../../core/engine/EngineState";
import type { Point, CadEntity } from "../../types/CadEntity";
import type { TextHitTestContext } from "../../utils";
import { distance, hitTestEntity } from "../../utils";

export interface DimensionMouseDownParams {
  activeTool: ToolMode;
  hitTolerance: number;
  entities: CadEntity[];
  textHitTestContext: TextHitTestContext | undefined;
  qdimStep: number;
  onQdimConfirm?: () => void;
  onPromptChange?: (prompt: string) => void;
  onDimensionClick?: (
    worldPos: Point,
    circleInfo?: { center: Point; radius: number; entityId: string },
    lineInfo?: { point1: Point; point2: Point; entityId: string },
    arcInfo?: {
      center: Point;
      radius: number;
      startAngle: number;
      endAngle: number;
      entityId: string;
    },
    snapResult?: {
      point: Point;
      type: string;
      entity?: { id: string; type: string; points?: Point[] };
      pointIndex?: number;
    } | null,
  ) => void;
}

/**
 * Handle mouseDown when the active tool is a DIMENSION tool.
 */
export function handleDimensionMouseDown(
  params: DimensionMouseDownParams,
  worldPos: Point,
  osnapResult: { point: Point; type: string } | null,
): void {
  const {
    activeTool,
    hitTolerance,
    entities,
    textHitTestContext,
    qdimStep,
    onQdimConfirm,
    onPromptChange,
    onDimensionClick,
  } = params;

  // QDIM: Khi step=1, click để confirm và tạo dimensions
  if (activeTool === ToolMode.DRAW_QDIM && qdimStep === 1) {
    onQdimConfirm?.();
    onPromptChange?.("QDIM: Dimensions created");
    return;
  }

  // Check if clicking near a circle for radius/diameter dimension
  let circleInfo:
    | { center: Point; radius: number; entityId: string }
    | undefined;

  // Check if clicking on a line for linear/aligned dimension
  let lineInfo:
    | { point1: Point; point2: Point; entityId: string }
    | undefined;

  // Check if clicking on an arc for arc dimension
  let arcInfo:
    | {
        center: Point;
        radius: number;
        startAngle: number;
        endAngle: number;
        entityId: string;
      }
    | undefined;

  // Find entity near click point
  for (const entity of entities) {
    if (entity.type === "circle") {
      const center = entity.points[0];
      const radius = entity.points[1].x;
      const distToCenter = distance(worldPos, center);
      const distToEdge = Math.abs(distToCenter - radius);

      // If click is near the circle edge (within tolerance)
      if (distToEdge <= hitTolerance * 2) {
        circleInfo = {
          center,
          radius,
          entityId: entity.id,
        };
        break;
      }
    } else if (
      entity.type === "arc" &&
      activeTool === ToolMode.DRAW_DIMARC
    ) {
      // Check if click is near this arc
      const center = entity.points[0];
      const radius = entity.points[1].x;
      const distToCenter = distance(worldPos, center);
      const distToEdge = Math.abs(distToCenter - radius);

      // Get arc angle range
      const startAngle = entity.startAngle ?? 0;
      const endAngle = entity.endAngle ?? Math.PI * 2;

      // Check if point angle is within arc range (match rendering logic)
      const pointAngle = Math.atan2(
        worldPos.y - center.y,
        worldPos.x - center.x,
      );

      let sweep = endAngle - startAngle;
      while (sweep > Math.PI) sweep -= 2 * Math.PI;
      while (sweep < -Math.PI) sweep += 2 * Math.PI;

      let relativeAngle = pointAngle - startAngle;
      while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
      while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

      const isInArc =
        sweep > 0
          ? relativeAngle >= 0 && relativeAngle <= sweep
          : relativeAngle <= 0 && relativeAngle >= sweep;

      // Check if click is on arc edge AND within arc range
      if (distToEdge <= hitTolerance * 2 && isInArc) {
        arcInfo = {
          center,
          radius,
          startAngle,
          endAngle,
          entityId: entity.id,
        };
        break;
      }
    } else if (
      (entity.type === "line" || entity.type === "polyline") &&
      (activeTool === ToolMode.DRAW_DIM_LINEAR ||
        activeTool === ToolMode.DRAW_DIM_ALIGNED ||
        activeTool === ToolMode.DRAW_DIM_ANGULAR)
    ) {
      // Check if click is near this line
      if (
        hitTestEntity(
          entity,
          worldPos,
          hitTolerance,
          textHitTestContext,
        )
      ) {
        // For line/polyline, find the closest segment
        if (entity.points.length >= 2) {
          // Simple case: use first and last point for now
          // TODO: For polyline, find the clicked segment
          lineInfo = {
            point1: entity.points[0],
            point2: entity.points[entity.points.length - 1],
            entityId: entity.id,
          };
          break;
        }
      }
    }
  }

  // Pass click to parent for dimension handling
  // Include OSNAP result for associative dimension support
  // Find entity closest to snap point for associative dimension
  let snapEntity:
    | {
        id: string;
        type: string;
        points?: { x: number; y: number }[];
      }
    | undefined;
  let snapPointIndex: number | undefined;
  if (osnapResult) {
    // Find entity that contains the snap point
    for (const entity of entities) {
      if (
        hitTestEntity(
          entity,
          osnapResult.point,
          hitTolerance * 2,
          textHitTestContext,
        )
      ) {
        // Include points for EntityReference creation in associative dimensions
        snapEntity = {
          id: entity.id,
          type: entity.type,
          points: entity.points ? [...entity.points] : undefined,
        };
        // Find pointIndex for endpoint snap
        if (osnapResult.type.toUpperCase().includes("ENDPOINT")) {
          let minDist = Infinity;
          for (let i = 0; i < entity.points.length; i++) {
            const dx = entity.points[i].x - osnapResult.point.x;
            const dy = entity.points[i].y - osnapResult.point.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
              minDist = dist;
              snapPointIndex = i;
            }
          }
        }
        break;
      }
    }
  }

  const snapInfo = osnapResult
    ? {
        point: osnapResult.point,
        type: osnapResult.type,
        entity: snapEntity,
        pointIndex: snapPointIndex,
      }
    : null;
  onDimensionClick?.(
    worldPos,
    circleInfo,
    lineInfo,
    arcInfo,
    snapInfo,
  );
}
