/**
 * useModifyCommands - Hook để xử lý MOVE, COPY, ROTATE, MIRROR, SCALE, OFFSET commands
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 * Hook này chỉ thu thập điểm, gọi callback để parent tạo Command và execute
 *
 * Tách từ CadDrawingCanvas.tsx để giảm kích thước file và dễ bảo trì
 */

"use client";

import { useCallback } from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import { distance, nearestPointOnSegment } from "../utils";
import type { Point, CadEntity } from "../types/CadEntity";

// ==================== Types ====================

export type ModifyMode =
  | "modifyMove"
  | "modifyCopy"
  | "modifyRotate"
  | "modifyMirror"
  | "modifyScale"
  | "modifyOffset";

export interface ModifyMoveState {
  mode: "modifyMove";
  step: "selectBase" | "selectDestination";
  basePoint?: Point;
  entityIds: string[];
  dimensionIds: string[];
}

export interface ModifyCopyState {
  mode: "modifyCopy";
  step: "selectBase" | "selectDestination";
  basePoint?: Point;
  entityIds: string[];
  dimensionIds: string[];
}

export interface ModifyRotateState {
  mode: "modifyRotate";
  step: "selectBase" | "selectReference" | "selectAngle";
  basePoint?: Point;
  referencePoint?: Point; // Reference point for base angle calculation
  entityIds: string[];
  dimensionIds: string[];
  startAngle?: number; // Calculated from basePoint to referencePoint
}

export interface ModifyMirrorState {
  mode: "modifyMirror";
  step: "selectFirst" | "selectSecond";
  firstPoint?: Point;
  entityIds: string[];
  dimensionIds: string[];
}

export interface ModifyScaleState {
  mode: "modifyScale";
  step: "selectBase" | "selectScale";
  basePoint?: Point;
  entityIds: string[];
  dimensionIds: string[];
}

export interface ModifyOffsetState {
  mode: "modifyOffset";
  step: "enterDistance" | "selectEntity" | "selectSide";
  distance?: number;
  entityId?: string;
}

export type ModifyState =
  | ModifyMoveState
  | ModifyCopyState
  | ModifyRotateState
  | ModifyMirrorState
  | ModifyScaleState
  | ModifyOffsetState
  | { mode: "idle" };

export interface ModifyCallbacks {
  onModifyMoveComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point
  ) => void;
  onModifyCopyComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point
  ) => void;
  onModifyRotateComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    angle: number
  ) => void;
  onModifyMirrorComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    point1: Point,
    point2: Point
  ) => void;
  onModifyScaleComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    scaleFactor: number
  ) => void;
  onModifyOffsetComplete?: (
    entityId: string,
    distance: number,
    throughPoint: Point
  ) => void;
}

export interface UseModifyCommandsConfig {
  activeTool: ToolMode;
  entities: CadEntity[];
  hitTolerance: number;
  callbacks: ModifyCallbacks;
  onPromptChange?: (prompt: string) => void;
}

export interface UseModifyCommandsReturn {
  /** Handle mouse down for modify tools - returns true if handled */
  handleModifyMouseDown: (
    worldPos: Point,
    state: ModifyState,
    setState: (state: ModifyState) => void
  ) => boolean;

  /** Check if current tool is a modify tool */
  isModifyTool: (tool: ToolMode) => boolean;

  /** Get initial state for a modify tool */
  getInitialModifyState: (
    tool: ToolMode,
    selectedEntityIds: string[],
    selectedDimensionIds: string[],
    offsetDistance?: number
  ) => ModifyState;
}

// ==================== Constants ====================

const MODIFY_TOOLS = [
  ToolMode.MOVE,
  ToolMode.COPY,
  ToolMode.ROTATE,
  ToolMode.MIRROR,
  ToolMode.SCALE,
  ToolMode.OFFSET,
];

// ==================== Hook Implementation ====================

export function useModifyCommands(
  config: UseModifyCommandsConfig
): UseModifyCommandsReturn {
  const { entities, hitTolerance, callbacks, onPromptChange } = config;

  const {
    onModifyMoveComplete,
    onModifyCopyComplete,
    onModifyRotateComplete,
    onModifyMirrorComplete,
    onModifyScaleComplete,
    onModifyOffsetComplete,
  } = callbacks;

  // Check if tool is a modify tool
  const isModifyTool = useCallback((tool: ToolMode): boolean => {
    return MODIFY_TOOLS.includes(tool);
  }, []);

  // Get initial state for a modify tool
  const getInitialModifyState = useCallback(
    (
      tool: ToolMode,
      selectedEntityIds: string[],
      selectedDimensionIds: string[],
      offsetDistance?: number
    ): ModifyState => {
      switch (tool) {
        case ToolMode.MOVE:
          return {
            mode: "modifyMove",
            step: "selectBase",
            entityIds: selectedEntityIds,
            dimensionIds: selectedDimensionIds,
          };
        case ToolMode.COPY:
          return {
            mode: "modifyCopy",
            step: "selectBase",
            entityIds: selectedEntityIds,
            dimensionIds: selectedDimensionIds,
          };
        case ToolMode.ROTATE:
          return {
            mode: "modifyRotate",
            step: "selectBase",
            entityIds: selectedEntityIds,
            dimensionIds: selectedDimensionIds,
          };
        case ToolMode.MIRROR:
          return {
            mode: "modifyMirror",
            step: "selectFirst",
            entityIds: selectedEntityIds,
            dimensionIds: selectedDimensionIds,
          };
        case ToolMode.SCALE:
          return {
            mode: "modifyScale",
            step: "selectBase",
            entityIds: selectedEntityIds,
            dimensionIds: selectedDimensionIds,
          };
        case ToolMode.OFFSET:
          return {
            mode: "modifyOffset",
            step:
              offsetDistance !== undefined ? "selectEntity" : "enterDistance",
            distance: offsetDistance,
          };
        default:
          return { mode: "idle" };
      }
    },
    []
  );

  // Find nearest entity for OFFSET command
  const findNearestEntity = useCallback(
    (worldPos: Point): CadEntity | null => {
      let nearestEntity: CadEntity | null = null;
      let nearestDist = hitTolerance;

      for (const entity of entities) {
        // Check line/polyline segments
        for (let i = 0; i < entity.points.length - 1; i++) {
          const pt = nearestPointOnSegment(
            worldPos,
            entity.points[i],
            entity.points[i + 1]
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
      }

      return nearestEntity;
    },
    [entities, hitTolerance]
  );

  // Handle mouse down for modify tools
  const handleModifyMouseDown = useCallback(
    (
      worldPos: Point,
      state: ModifyState,
      setState: (state: ModifyState) => void
    ): boolean => {
      if (state.mode === "idle") return false;

      // ==================== MOVE ====================
      if (state.mode === "modifyMove") {
        if (state.step === "selectBase") {
          setState({
            ...state,
            step: "selectDestination",
            basePoint: worldPos,
          });
          onPromptChange?.("MOVE: Specify destination point");
          return true;
        } else if (state.step === "selectDestination" && state.basePoint) {
          // ĐIỀU KIỆN 1: Gọi callback - parent sẽ tạo MoveCommand và execute
          onModifyMoveComplete?.(
            state.entityIds,
            state.dimensionIds,
            state.basePoint,
            worldPos
          );
          setState({ mode: "idle" });
          onPromptChange?.("MOVE completed");
          return true;
        }
      }

      // ==================== COPY ====================
      if (state.mode === "modifyCopy") {
        if (state.step === "selectBase") {
          setState({
            ...state,
            step: "selectDestination",
            basePoint: worldPos,
          });
          onPromptChange?.("COPY: Specify destination point");
          return true;
        } else if (state.step === "selectDestination" && state.basePoint) {
          // ĐIỀU KIỆN 1: Gọi callback - parent sẽ tạo CopyCommand và execute
          onModifyCopyComplete?.(
            state.entityIds,
            state.dimensionIds,
            state.basePoint,
            worldPos
          );
          // Stay in copy mode for multiple copies
          setState({
            ...state,
            step: "selectDestination",
          });
          onPromptChange?.("COPY: Specify next destination or ESC to exit");
          return true;
        }
      }

      // ==================== ROTATE ====================
      if (state.mode === "modifyRotate") {
        if (state.step === "selectBase") {
          // Calculate start angle (from base point to current mouse)
          setState({
            ...state,
            step: "selectAngle",
            basePoint: worldPos,
            startAngle: 0,
          });
          onPromptChange?.("ROTATE: Specify rotation angle");
          return true;
        } else if (state.step === "selectAngle" && state.basePoint) {
          // Calculate rotation angle
          const angle = Math.atan2(
            worldPos.y - state.basePoint.y,
            worldPos.x - state.basePoint.x
          );
          const startAngle = state.startAngle ?? 0;
          const rotationAngle = angle - startAngle;

          // ĐIỀU KIỆN 1: Gọi callback - parent sẽ tạo RotateCommand và execute
          onModifyRotateComplete?.(
            state.entityIds,
            state.dimensionIds,
            state.basePoint,
            rotationAngle
          );
          setState({ mode: "idle" });
          onPromptChange?.(
            `ROTATE completed (${((rotationAngle * 180) / Math.PI).toFixed(
              1
            )}°)`
          );
          return true;
        }
      }

      // ==================== MIRROR ====================
      if (state.mode === "modifyMirror") {
        if (state.step === "selectFirst") {
          setState({
            ...state,
            step: "selectSecond",
            firstPoint: worldPos,
          });
          onPromptChange?.("MIRROR: Specify second point of mirror line");
          return true;
        } else if (state.step === "selectSecond" && state.firstPoint) {
          // ĐIỀU KIỆN 1: Gọi callback - parent sẽ tạo MirrorCommand và execute
          onModifyMirrorComplete?.(
            state.entityIds,
            state.dimensionIds,
            state.firstPoint,
            worldPos
          );
          setState({ mode: "idle" });
          onPromptChange?.("MIRROR completed");
          return true;
        }
      }

      // ==================== SCALE ====================
      if (state.mode === "modifyScale") {
        if (state.step === "selectBase") {
          setState({
            ...state,
            step: "selectScale",
            basePoint: worldPos,
          });
          onPromptChange?.("SCALE: Specify scale factor or reference point");
          return true;
        } else if (state.step === "selectScale" && state.basePoint) {
          // Calculate scale factor based on distance
          const newDist = distance(worldPos, state.basePoint);
          const scaleFactor = newDist / 100; // Simplified scale

          // ĐIỀU KIỆN 1: Gọi callback - parent sẽ tạo ScaleCommand và execute
          onModifyScaleComplete?.(
            state.entityIds,
            state.dimensionIds,
            state.basePoint,
            scaleFactor
          );
          setState({ mode: "idle" });
          onPromptChange?.(
            `SCALE completed (factor: ${scaleFactor.toFixed(2)})`
          );
          return true;
        }
      }

      // ==================== OFFSET ====================
      if (state.mode === "modifyOffset") {
        if (state.step === "selectEntity") {
          const nearestEntity = findNearestEntity(worldPos);

          if (nearestEntity && state.distance !== undefined) {
            setState({
              ...state,
              step: "selectSide",
              entityId: nearestEntity.id,
            });
            onPromptChange?.(
              `OFFSET: Select side to offset (Entity: ${nearestEntity.type})`
            );
          } else {
            onPromptChange?.("OFFSET: No entity found. Select an object:");
          }
          return true;
        } else if (
          state.step === "selectSide" &&
          state.entityId &&
          state.distance !== undefined
        ) {
          // ĐIỀU KIỆN 1: Gọi callback với throughPoint
          onModifyOffsetComplete?.(state.entityId, state.distance, worldPos);

          // Tiếp tục cho phép offset thêm
          setState({
            mode: "modifyOffset",
            step: "selectEntity",
            distance: state.distance,
          });
          onPromptChange?.(
            "OFFSET completed. Select next object to offset or ESC to exit:"
          );
          return true;
        }
      }

      return false;
    },
    [
      findNearestEntity,
      onModifyCopyComplete,
      onModifyMirrorComplete,
      onModifyMoveComplete,
      onModifyOffsetComplete,
      onModifyRotateComplete,
      onModifyScaleComplete,
      onPromptChange,
    ]
  );

  return {
    handleModifyMouseDown,
    isModifyTool,
    getInitialModifyState,
  };
}
