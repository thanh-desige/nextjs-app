/**
 * modifyMouseDown — Handles mouseDown for all modify commands
 *
 * Extracted from useMouseHandlers.ts to reduce file size.
 * Commands handled: MOVE, COPY, ROTATE, MIRROR, SCALE, OFFSET, TRIM, EXTEND, FILLET, BOUNDARY
 *
 * ĐIỀU KIỆN 1: UI chỉ thu thập điểm, gọi callback để parent tạo Command và execute
 */

import type { Dispatch, SetStateAction } from "react";
import type { DimensionEntity } from "../../../../core/dimensions/DimensionManager";
import type { DrawingState } from "../../canvas.types";
import type { Point, CadEntity } from "../../types/CadEntity";
import type { TextHitTestContext } from "../../utils";
import {
  distance,
  nearestPointOnSegment,
  applyOrtho,
  hitTestEntity,
  hitTestDimension,
} from "../../utils";

export interface ModifyMouseDownParams {
  drawState: DrawingState;
  setDrawState: Dispatch<SetStateAction<DrawingState>>;
  effectiveOrtho: boolean;
  hitTolerance: number;
  entities: CadEntity[];
  dimensions: DimensionEntity[];
  selectedIds: string[];
  selectedDimensionIds: string[];
  selectEntities: (ids: string[], additive?: boolean) => void;
  onDimensionSelect?: (ids: string[]) => void;
  setDynamicInput: Dispatch<
    SetStateAction<{
      active: boolean;
      mode:
        | "length"
        | "width-height"
        | "radius-diameter"
        | "sides-radius"
        | "move-copy"
        | "offset-distance";
      value1: string;
      value2: string;
      focusField: 1 | 2;
      screenPos: Point;
    }>
  >;
  setRotateAngleInput: Dispatch<
    SetStateAction<{ active: boolean; value: string }>
  >;
  setMovingPreviewDelta: Dispatch<SetStateAction<Point | null>>;
  onPromptChange?: (prompt: string) => void;
  onModifyMoveComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point,
  ) => void;
  onModifyCopyComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point,
  ) => void;
  onModifyRotateComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    angle: number,
  ) => void;
  onModifyMirrorComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    point1: Point,
    point2: Point,
  ) => void;
  onModifyScaleComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    scaleFactor: number,
  ) => void;
  onModifyOffsetComplete?: (
    entityId: string,
    distance: number,
    throughPoint: Point,
  ) => void;
  onTrimComplete?: (
    entityId: string,
    pickPoint: Point,
    cuttingEdgeIds: string[],
  ) => void;
  onExtendComplete?: (
    entityId: string,
    pickPoint: Point,
    boundaryEdgeIds: string[],
  ) => void;
  onFilletComplete?: (
    entityId1: string,
    entityId2: string,
    radius: number,
    clickPoint1: Point,
    clickPoint2: Point,
  ) => void;
  onBoundaryComplete?: (pickPoint: Point) => void;
  textHitTestContext: TextHitTestContext | undefined;
}

/**
 * Handle mouseDown for modify commands.
 * Returns true if the event was handled (caller should return early).
 */
export function handleModifyMouseDown(
  p: ModifyMouseDownParams,
  worldPos: Point,
): boolean {
  const {
    drawState,
    setDrawState,
    effectiveOrtho,
    hitTolerance,
    entities,
    dimensions,
    selectedIds,
    selectedDimensionIds,
    selectEntities,
    onDimensionSelect,
    setDynamicInput,
    setRotateAngleInput,
    setMovingPreviewDelta,
    onPromptChange,
    onModifyMoveComplete,
    onModifyCopyComplete,
    onModifyRotateComplete,
    onModifyMirrorComplete,
    onModifyScaleComplete,
    onModifyOffsetComplete,
    onTrimComplete,
    onExtendComplete,
    onFilletComplete,
    onBoundaryComplete,
    textHitTestContext,
  } = p;

  // ==================== selectObjects step: click to select entities ====================
  // This supports "command first, select later" workflow (AutoCAD standard)
  if (
    (drawState.mode === "modifyMove" ||
      drawState.mode === "modifyCopy" ||
      drawState.mode === "modifyRotate" ||
      drawState.mode === "modifyMirror" ||
      drawState.mode === "modifyScale") &&
    drawState.step === "selectObjects"
  ) {
    // Check if clicking on a dimension
    const hitDim = dimensions.find((dim) =>
      hitTestDimension(dim, worldPos, hitTolerance),
    );
    if (hitDim) {
      // Toggle dimension selection (additive by default in selectObjects mode)
      if (selectedDimensionIds.includes(hitDim.id)) {
        onDimensionSelect?.(
          selectedDimensionIds.filter((id) => id !== hitDim.id),
        );
      } else {
        onDimensionSelect?.([...selectedDimensionIds, hitDim.id]);
      }
      return true;
    }

    // Check if clicking on an entity
    const hitEnt = entities.find((ent) =>
      hitTestEntity(ent, worldPos, hitTolerance, textHitTestContext),
    );
    if (hitEnt) {
      // Toggle entity selection (additive by default in selectObjects mode)
      if (selectedIds.includes(hitEnt.id)) {
        selectEntities(selectedIds.filter((id) => id !== hitEnt.id));
      } else {
        selectEntities([...selectedIds, hitEnt.id]);
      }
      return true;
    }

    // Click on empty space - start selection box, save pending mode to restore later
    const pendingMode = drawState.mode as
      | "modifyMove"
      | "modifyCopy"
      | "modifyRotate"
      | "modifyMirror"
      | "modifyScale";
    setDrawState({
      mode: "selecting",
      start: worldPos,
      currentPos: worldPos,
      pendingModifyMode: pendingMode,
    });
    return true;
  }

  if (drawState.mode === "modifyMove") {
    if (drawState.step === "selectBase") {
      // Set base point and move to next step
      setDrawState({
        ...drawState,
        step: "selectDestination",
        basePoint: worldPos,
      });
      // Activate DynamicInput for MOVE - this is the INPUT SOURCE
      setDynamicInput({
        active: true,
        mode: "move-copy",
        value1: "",
        value2: "",
        focusField: 1,
        screenPos: { x: 0, y: 0 },
      });
      onPromptChange?.("MOVE: type distance<angle or click destination");
    } else if (drawState.step === "selectDestination" && drawState.basePoint) {
      // Apply ortho constraint for destination point
      const destPoint = effectiveOrtho
        ? applyOrtho(drawState.basePoint, worldPos)
        : worldPos;
      // Gọi callback - parent sẽ tạo MoveCommand và execute
      onModifyMoveComplete?.(
        drawState.entityIds,
        drawState.dimensionIds,
        drawState.basePoint,
        destPoint,
      );
      // Done - reset and CLEAR input overlay
      setDrawState({ mode: "idle" });
      setDynamicInput((prev) => ({ ...prev, active: false }));
      setMovingPreviewDelta(null);
      onPromptChange?.("MOVE completed");
    }
    return true;
  }

  if (drawState.mode === "modifyCopy") {
    if (drawState.step === "selectBase") {
      setDrawState({
        ...drawState,
        step: "selectDestination",
        basePoint: worldPos,
      });
      // Activate DynamicInput for COPY - this is the INPUT SOURCE
      setDynamicInput({
        active: true,
        mode: "move-copy",
        value1: "",
        value2: "",
        focusField: 1,
        screenPos: { x: 0, y: 0 },
      });
      onPromptChange?.("COPY: type distance<angle or click (ESC to exit)");
    } else if (drawState.step === "selectDestination" && drawState.basePoint) {
      // Apply ortho constraint for destination point
      const destPoint = effectiveOrtho
        ? applyOrtho(drawState.basePoint, worldPos)
        : worldPos;
      // Gọi callback - parent sẽ tạo CopyCommand và execute
      onModifyCopyComplete?.(
        drawState.entityIds,
        drawState.dimensionIds,
        drawState.basePoint,
        destPoint,
      );
      // Stay in copy mode for more copies
      onPromptChange?.(
        "COPY: type distance<angle or click for next copy (ESC to exit)",
      );
    }
    return true;
  }

  if (drawState.mode === "modifyRotate") {
    // Step 1: Select rotation center (base point)
    if (drawState.step === "selectBase") {
      setDrawState({
        ...drawState,
        step: "selectReference",
        basePoint: worldPos,
      });
      onPromptChange?.("ROTATE: Specify reference point (or enter angle)");
    }
    // Step 2: Select reference point (to calculate base angle)
    // No ortho constraint here - user selects the reference direction freely
    else if (drawState.step === "selectReference" && drawState.basePoint) {
      // Calculate start angle from basePoint to referencePoint
      const startAngle = Math.atan2(
        worldPos.y - drawState.basePoint.y,
        worldPos.x - drawState.basePoint.x,
      );
      setDrawState({
        ...drawState,
        step: "selectAngle",
        referencePoint: worldPos,
        startAngle: startAngle,
      });
      onPromptChange?.(
        "ROTATE: Specify rotation angle (or enter angle in degrees)",
      );
    }
    // Step 3: Click to set final angle, or user can enter angle via input
    else if (drawState.step === "selectAngle" && drawState.basePoint) {
      // Calculate angle from mouse position
      let angle = Math.atan2(
        worldPos.y - drawState.basePoint.y,
        worldPos.x - drawState.basePoint.x,
      );

      // Apply ortho constraint: snap FINAL angle to 0°, 90°, 180°, 270° (absolute direction)
      if (effectiveOrtho) {
        const snapAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        let nearestAngle = 0;
        let minDiff = Math.PI * 2;
        for (const snapAngle of snapAngles) {
          let diff = Math.abs(angle - snapAngle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          if (diff < minDiff) {
            minDiff = diff;
            nearestAngle = snapAngle;
          }
        }
        angle = nearestAngle;
      }

      const startAngle = drawState.startAngle ?? 0;
      const rotationAngle = angle - startAngle;

      // Gọi callback - parent sẽ tạo RotateCommand và execute
      onModifyRotateComplete?.(
        drawState.entityIds,
        drawState.dimensionIds,
        drawState.basePoint,
        rotationAngle,
      );

      setDrawState({ mode: "idle" });
      setRotateAngleInput({ active: false, value: "" });
      onPromptChange?.(
        `ROTATE completed (${((rotationAngle * 180) / Math.PI).toFixed(1)}°)`,
      );
    }
    return true;
  }

  if (drawState.mode === "modifyMirror") {
    if (drawState.step === "selectFirst") {
      setDrawState({
        ...drawState,
        step: "selectSecond",
        firstPoint: worldPos,
      });
      onPromptChange?.("MIRROR: Specify second point of mirror line");
    } else if (drawState.step === "selectSecond" && drawState.firstPoint) {
      // Apply ortho constraint for second point of mirror line
      const secondPoint = effectiveOrtho
        ? applyOrtho(drawState.firstPoint, worldPos)
        : worldPos;
      // Gọi callback - parent sẽ tạo MirrorCommand và execute
      onModifyMirrorComplete?.(
        drawState.entityIds,
        drawState.dimensionIds,
        drawState.firstPoint,
        secondPoint,
      );

      setDrawState({ mode: "idle" });
      onPromptChange?.("MIRROR completed");
    }
    return true;
  }

  if (drawState.mode === "modifyScale") {
    if (drawState.step === "selectBase") {
      setDrawState({
        ...drawState,
        step: "selectScale",
        basePoint: worldPos,
      });
      onPromptChange?.("SCALE: Specify scale factor or reference point");
    } else if (drawState.step === "selectScale" && drawState.basePoint) {
      // Calculate scale factor based on distance
      const newDist = distance(worldPos, drawState.basePoint);
      const scaleFactor = newDist / 100; // Simplified scale

      // Gọi callback - parent sẽ tạo ScaleCommand và execute
      onModifyScaleComplete?.(
        drawState.entityIds,
        drawState.dimensionIds,
        drawState.basePoint,
        scaleFactor,
      );

      setDrawState({ mode: "idle" });
      onPromptChange?.(`SCALE completed (factor: ${scaleFactor.toFixed(2)})`);
    }
    return true;
  }

  if (drawState.mode === "modifyOffset") {
    if (drawState.step === "selectEntity") {
      // Tìm entity gần nhất
      let nearestEntity: CadEntity | null = null;
      let nearestDist = hitTolerance;

      for (const entity of entities) {
        for (let i = 0; i < entity.points.length - 1; i++) {
          const pt = nearestPointOnSegment(
            worldPos,
            entity.points[i],
            entity.points[i + 1],
          );
          const dist = distance(worldPos, pt);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestEntity = entity;
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
        // Check rect
        if (entity.type === "rect" && entity.points.length >= 2) {
          const [p1, p2] = entity.points;
          const edges = [
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
      }

      if (nearestEntity && drawState.distance !== undefined) {
        setDrawState({
          ...drawState,
          step: "selectSide",
          entityId: nearestEntity.id,
        });
        onPromptChange?.(
          `OFFSET: Select side to offset (Entity: ${nearestEntity.type})`,
        );
      } else {
        onPromptChange?.("OFFSET: No entity found. Select an object:");
      }
    } else if (
      drawState.step === "selectSide" &&
      drawState.entityId &&
      drawState.distance !== undefined
    ) {
      // Gọi callback với throughPoint
      onModifyOffsetComplete?.(
        drawState.entityId,
        drawState.distance,
        worldPos,
      );

      // Tiếp tục cho phép offset thêm
      setDrawState({
        mode: "modifyOffset",
        step: "selectEntity",
        distance: drawState.distance,
      });
      onPromptChange?.(
        `OFFSET completed. Select next object to offset or ESC to exit:`,
      );
    }
    return true;
  }

  if (drawState.mode === "modifyTrim") {
    // TRIM: Click on entity to trim
    if (drawState.step === "selectEntity") {
      // Tìm entity được click
      let hitEntity: CadEntity | null = null;
      let hitDist = hitTolerance;

      for (const entity of entities) {
        // Check line/polyline
        if (entity.type === "line" || entity.type === "polyline") {
          for (let i = 0; i < entity.points.length - 1; i++) {
            const pt = nearestPointOnSegment(
              worldPos,
              entity.points[i],
              entity.points[i + 1],
            );
            const dist = distance(worldPos, pt);
            if (dist < hitDist) {
              hitDist = dist;
              hitEntity = entity;
            }
          }
        }
        // Check rect (as 4 edges)
        if (entity.type === "rect" && entity.points.length >= 2) {
          const [p1, p2] = entity.points;
          const edges = [
            [p1, { x: p2.x, y: p1.y }],
            [{ x: p2.x, y: p1.y }, p2],
            [p2, { x: p1.x, y: p2.y }],
            [{ x: p1.x, y: p2.y }, p1],
          ];
          for (const [a, b] of edges) {
            const pt = nearestPointOnSegment(worldPos, a, b);
            const dist = distance(worldPos, pt);
            if (dist < hitDist) {
              hitDist = dist;
              hitEntity = entity;
            }
          }
        }
        // Check circle
        if (entity.type === "circle" && entity.points.length >= 2) {
          const center = entity.points[0];
          const radius = entity.points[1].x;
          const distToCenter = distance(worldPos, center);
          const distToCircle = Math.abs(distToCenter - radius);
          if (distToCircle < hitDist) {
            hitDist = distToCircle;
            hitEntity = entity;
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

          // Check if point angle is within arc range
          // Must match the rendering logic which uses sweep direction
          const pointAngle = Math.atan2(
            worldPos.y - center.y,
            worldPos.x - center.x,
          );

          // Calculate sweep same as rendering
          let sweep = endAngle - startAngle;
          while (sweep > Math.PI) sweep -= 2 * Math.PI;
          while (sweep < -Math.PI) sweep += 2 * Math.PI;

          // Check if pointAngle is within the arc
          let isInArc = false;

          // Normalize pointAngle relative to startAngle
          let relativeAngle = pointAngle - startAngle;
          while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
          while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

          if (sweep > 0) {
            // Arc goes CCW from startAngle
            isInArc = relativeAngle >= 0 && relativeAngle <= sweep;
          } else {
            // Arc goes CW from startAngle (sweep is negative)
            isInArc = relativeAngle <= 0 && relativeAngle >= sweep;
          }

          if (isInArc && distToArc < hitDist) {
            hitDist = distToArc;
            hitEntity = entity;
          }
        }
      }

      if (hitEntity) {
        // Get all other entities as cutting edges
        const cuttingEdgeIds = entities
          .filter((e) => e.id !== hitEntity!.id)
          .map((e) => e.id);

        // Call trim callback
        onTrimComplete?.(hitEntity.id, worldPos, cuttingEdgeIds);

        // Stay in trim mode for more trims
        onPromptChange?.("TRIM: Select next object to trim or ESC to exit");
      } else {
        onPromptChange?.("TRIM: No object found. Click on an object to trim:");
      }
    }
    return true;
  }

  if (drawState.mode === "modifyExtend") {
    // EXTEND: Click on entity to extend
    if (drawState.step === "selectEntity") {
      // Tìm entity được click (ưu tiên LINE)
      let hitEntity: CadEntity | null = null;
      let hitDist = hitTolerance;

      for (const entity of entities) {
        // Check line/polyline
        if (entity.type === "line" || entity.type === "polyline") {
          for (let i = 0; i < entity.points.length - 1; i++) {
            const pt = nearestPointOnSegment(
              worldPos,
              entity.points[i],
              entity.points[i + 1],
            );
            const dist = distance(worldPos, pt);
            if (dist < hitDist) {
              hitDist = dist;
              hitEntity = entity;
            }
          }
        }
      }

      if (hitEntity) {
        // Get all other entities as boundary edges
        const boundaryEdgeIds = entities
          .filter((e) => e.id !== hitEntity!.id)
          .map((e) => e.id);

        // Call extend callback
        onExtendComplete?.(hitEntity.id, worldPos, boundaryEdgeIds);

        // Stay in extend mode for more extends
        onPromptChange?.("EXTEND: Select next object to extend or ESC to exit");
      } else {
        onPromptChange?.(
          "EXTEND: No object found. Click near the end of a line to extend:",
        );
      }
    }
    return true;
  }

  if (drawState.mode === "modifyFillet") {
    // FILLET: Click on 2 lines to create fillet
    // Tìm LINE được click
    let hitEntity: CadEntity | null = null;
    let hitDist = hitTolerance;

    for (const entity of entities) {
      // Chỉ hỗ trợ fillet giữa 2 lines
      if (entity.type === "line" && entity.points.length >= 2) {
        const pt = nearestPointOnSegment(
          worldPos,
          entity.points[0],
          entity.points[1],
        );
        const dist = distance(worldPos, pt);
        if (dist < hitDist) {
          hitDist = dist;
          hitEntity = entity;
        }
      }
    }

    if (drawState.step === "selectFirst") {
      if (hitEntity) {
        // Lưu entity đầu tiên, click point và chuyển sang chọn entity thứ 2
        setDrawState({
          mode: "modifyFillet",
          step: "selectSecond",
          firstEntityId: hitEntity.id,
          firstClickPoint: worldPos,
          radius: drawState.radius ?? 10,
        });
        onPromptChange?.("FILLET: Select second line");
      } else {
        onPromptChange?.("FILLET: No line found. Click on a line to fillet:");
      }
    } else if (drawState.step === "selectSecond") {
      if (hitEntity && drawState.firstEntityId) {
        // Không cho chọn cùng 1 entity
        if (hitEntity.id === drawState.firstEntityId) {
          onPromptChange?.(
            "FILLET: Cannot fillet a line with itself. Select a different line:",
          );
        } else {
          // Gọi fillet callback với cả 2 click points
          onFilletComplete?.(
            drawState.firstEntityId,
            hitEntity.id,
            drawState.radius ?? 10,
            drawState.firstClickPoint ?? worldPos,
            worldPos,
          );

          // Reset về chọn entity đầu tiên cho fillet tiếp theo
          setDrawState({
            mode: "modifyFillet",
            step: "selectFirst",
            radius: drawState.radius ?? 10,
          });
          onPromptChange?.(
            "FILLET: Select first line for next fillet or ESC to exit",
          );
        }
      } else {
        onPromptChange?.("FILLET: No line found. Click on a line to fillet:");
      }
    }
    return true;
  }

  if (drawState.mode === "modifyBoundary") {
    // BOUNDARY: Click để chọn điểm bên trong vùng khép kín
    if (drawState.step === "pickPoint") {
      // Gọi callback để xử lý boundary
      onBoundaryComplete?.(worldPos);

      // Reset về pick point mode
      setDrawState({
        mode: "modifyBoundary",
        step: "pickPoint",
      });
      onPromptChange?.("BOUNDARY: Pick another internal point or ESC to exit");
    }
    return true;
  }

  // Not a modify mode we handle
  return false;
}
