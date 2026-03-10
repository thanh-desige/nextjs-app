/**
 * useModifyCommands Hook
 *
 * Extracted from BookThietKeBocTachPage.tsx (STEP-5.3)
 * Contains all modify command completion handlers:
 * Move, Copy, Rotate, Mirror, Scale, Offset, Trim, Extend, Explode, Fillet, Boundary
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 */

import { useCallback, useEffect } from "react";
import type { Point, CadEntity } from "../ui";
import { ToolMode } from "../core/engine/EngineState";

// Commands - ĐIỀU KIỆN 1
import {
  MoveCanvasEntitiesCommand,
  CopyCanvasEntitiesCommand,
  RotateCanvasEntitiesCommand,
  MirrorCanvasEntitiesCommand,
  ScaleCanvasEntitiesCommand,
  OffsetCanvasEntityCommand,
  TrimCanvasEntityCommand,
  ExtendCanvasEntityCommand,
  ExplodeCanvasEntitiesCommand,
  FilletCanvasEntityCommand,
} from "../core/commands/canvas";

// Door Commands
import {
  MoveDoorCommand,
  CloneDoorCommand,
} from "../core/commands/door/DoorCommands";

// Boundary Command
import { findBoundaryFromEntities } from "../core/commands/modify/boundary";

import type { DimensionEntity } from "../core/dimensions/DimensionManager";

// ==================== Types ====================

interface NotificationParams {
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  duration?: number;
}

interface DoorEntity {
  id: string;
  position: { x: number; y: number };
  [key: string]: unknown;
}

interface CommandResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface UseModifyCommandsParams {
  // Command execution
  executeCommandObject: (cmd: unknown) => CommandResult | undefined;

  // Document entities
  documentEntities: CadEntity[];
  documentSelectedIds: string[];
  addDocumentEntity: (entity: unknown) => void;
  clearDocumentSelection: () => void;

  // Dimensions
  dimensions: DimensionEntity[];
  updateDimension: (id: string, updates: Partial<DimensionEntity>) => void;
  addDimension: (dim: DimensionEntity) => void;

  // Notifications
  addNotification: (n: NotificationParams) => void;

  // Tool control
  setTool: (tool: ToolMode) => void;

  // Door access (READ ONLY)
  getSelectedDoors: () => DoorEntity[];

  // Explode ref (for keyboard shortcut binding)
  handleExplodeCommandRef: React.MutableRefObject<() => void>;
}

export interface UseModifyCommandsReturn {
  handleModifyMoveComplete: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point,
  ) => void;
  handleModifyCopyComplete: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    destPoint: Point,
  ) => void;
  handleModifyRotateComplete: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    angle: number,
  ) => void;
  handleModifyMirrorComplete: (
    entityIds: string[],
    dimensionIds: string[],
    point1: Point,
    point2: Point,
  ) => void;
  handleModifyScaleComplete: (
    entityIds: string[],
    dimensionIds: string[],
    center: Point,
    scaleFactor: number,
  ) => void;
  handleModifyOffsetComplete: (
    entityId: string,
    distance: number,
    throughPoint: Point,
  ) => void;
  handleTrimComplete: (
    entityId: string,
    pickPoint: Point,
    cuttingEdgeIds: string[],
  ) => void;
  handleExtendComplete: (
    entityId: string,
    pickPoint: Point,
    boundaryEdgeIds: string[],
  ) => void;
  handleExplodeCommand: () => void;
  handleFilletComplete: (
    entityId1: string,
    entityId2: string,
    radius: number,
    clickPoint1: Point,
    clickPoint2: Point,
  ) => void;
  handleBoundaryComplete: (pickPoint: Point) => void;
}

// ==================== Hook ====================

export function useModifyCommands(
  params: UseModifyCommandsParams,
): UseModifyCommandsReturn {
  const {
    executeCommandObject,
    documentEntities,
    documentSelectedIds,
    addDocumentEntity,
    clearDocumentSelection,
    dimensions,
    updateDimension,
    addDimension,
    addNotification,
    setTool,
    getSelectedDoors,
    handleExplodeCommandRef,
  } = params;

  // ==================== MOVE ====================
  const handleModifyMoveComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      basePoint: Point,
      destPoint: Point,
    ) => {
      // Tính delta
      const dx = destPoint.x - basePoint.x;
      const dy = destPoint.y - basePoint.y;

      let movedEntities = 0;
      let movedDoors = 0;
      let movedDims = 0;

      // Move CAD entities
      if (entityIds.length > 0) {
        const command = new MoveCanvasEntitiesCommand(entityIds, dx, dy);
        const result = executeCommandObject(command);
        if (result?.success) {
          movedEntities = entityIds.length;
        }
      }

      // Move doors via MoveDoorCommand (CAD standard MOVE)
      const selectedDoorEntities = getSelectedDoors();
      if (selectedDoorEntities.length > 0) {
        selectedDoorEntities.forEach((door) => {
          const newPosition = {
            x: door.position.x + dx,
            y: door.position.y + dy,
          };
          const command = new MoveDoorCommand(door.id, newPosition);
          const result = executeCommandObject(command);
          if (result?.success) {
            movedDoors++;
          }
        });
      }

      // Move dimensions
      // ========== GUARD RULE: ASSOCIATIVE DIMENSIONS KHÔNG ĐƯỢC TRANSFORM ==========
      if (dimensionIds.length > 0) {
        dimensionIds.forEach((dimId) => {
          const dim = dimensions.find((d) => d.id === dimId);
          if (dim) {
            const dimData = dim as unknown as Record<string, unknown>;
            const hasRef1 = dimData.ref1 && typeof dimData.ref1 === "object";
            const hasRef2 = dimData.ref2 && typeof dimData.ref2 === "object";
            const isAssociative = hasRef1 || hasRef2;

            if (isAssociative) {
              return;
            }

            updateDimension(dimId, {
              point1: { x: dim.point1.x + dx, y: dim.point1.y + dy },
              point2: { x: dim.point2.x + dx, y: dim.point2.y + dy },
            });
            movedDims++;
          }
        });
      }

      const totalMoved = movedEntities + movedDoors + movedDims;
      if (totalMoved > 0) {
        addNotification({
          type: "success",
          title: "MOVE",
          message: `Moved ${totalMoved} object(s)${
            movedDoors > 0 ? ` (${movedDoors} door(s))` : ""
          }${movedDims > 0 ? ` (${movedDims} dimension(s))` : ""}`,
          duration: 2000,
        });
      }

      setTool(ToolMode.SELECT);
    },
    [
      executeCommandObject,
      dimensions,
      updateDimension,
      addNotification,
      setTool,
      getSelectedDoors,
    ],
  );

  // ==================== COPY ====================
  const handleModifyCopyComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      basePoint: Point,
      destPoint: Point,
    ) => {
      const dx = destPoint.x - basePoint.x;
      const dy = destPoint.y - basePoint.y;

      let copiedEntities = 0;
      let copiedDoors = 0;
      let copiedDims = 0;

      if (entityIds.length > 0) {
        const command = new CopyCanvasEntitiesCommand(entityIds, { dx, dy });
        const result = executeCommandObject(command);
        if (result?.success) {
          copiedEntities = entityIds.length;
        }
      }

      const selectedDoorEntities = getSelectedDoors();
      if (selectedDoorEntities.length > 0) {
        selectedDoorEntities.forEach((door) => {
          const command = new CloneDoorCommand(door.id, dx, dy);
          const result = executeCommandObject(command);
          if (result?.success) {
            copiedDoors++;
          }
        });
      }

      if (dimensionIds.length > 0) {
        dimensionIds.forEach((dimId) => {
          const dim = dimensions.find((d) => d.id === dimId);
          if (dim) {
            const newDim = {
              ...dim,
              id: `dim-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              point1: { x: dim.point1.x + dx, y: dim.point1.y + dy },
              point2: { x: dim.point2.x + dx, y: dim.point2.y + dy },
              ...(dim.point3
                ? { point3: { x: dim.point3.x + dx, y: dim.point3.y + dy } }
                : {}),
              ref1: undefined,
              ref2: undefined,
              ref3: undefined,
              parentDimId: undefined,
              chainIndex: undefined,
            };
            addDimension(newDim as DimensionEntity);
            copiedDims++;
          }
        });
      }

      const totalCopied = copiedEntities + copiedDoors + copiedDims;
      if (totalCopied > 0) {
        addNotification({
          type: "success",
          title: "COPY",
          message: `Copied ${totalCopied} object(s)${
            copiedDoors > 0 ? ` (${copiedDoors} door(s))` : ""
          }${copiedDims > 0 ? ` (${copiedDims} dimension(s))` : ""}`,
          duration: 2000,
        });
      }
    },
    [
      executeCommandObject,
      addNotification,
      dimensions,
      addDimension,
      getSelectedDoors,
    ],
  );

  // ==================== ROTATE ====================
  const handleModifyRotateComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      center: Point,
      angle: number,
    ) => {
      const command = new RotateCanvasEntitiesCommand(entityIds, center, angle);
      const result = executeCommandObject(command);

      // ========== GUARD RULE: ASSOCIATIVE DIMENSIONS KHÔNG ĐƯỢC TRANSFORM ==========
      if (dimensionIds.length > 0) {
        dimensionIds.forEach((dimId) => {
          const dim = dimensions.find((d) => d.id === dimId);
          if (dim) {
            const dimData = dim as unknown as Record<string, unknown>;
            const hasRef1 = dimData.ref1 && typeof dimData.ref1 === "object";
            const hasRef2 = dimData.ref2 && typeof dimData.ref2 === "object";
            const isAssociative = hasRef1 || hasRef2;

            if (isAssociative) {
              return;
            }

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatePoint = (p: Point): Point => {
              const dx = p.x - center.x;
              const dy = p.y - center.y;
              return {
                x: center.x + dx * cos - dy * sin,
                y: center.y + dx * sin + dy * cos,
              };
            };
            updateDimension(dimId, {
              point1: rotatePoint(dim.point1),
              point2: rotatePoint(dim.point2),
            });
          }
        });
      }

      if (result?.success) {
        addNotification({
          type: "success",
          title: "ROTATE",
          message: `Rotated ${entityIds.length} object(s) by ${(
            (angle * 180) /
            Math.PI
          ).toFixed(1)}°`,
          duration: 2000,
        });
      }

      setTool(ToolMode.SELECT);
    },
    [
      executeCommandObject,
      dimensions,
      updateDimension,
      addNotification,
      setTool,
    ],
  );

  // ==================== MIRROR ====================
  const handleModifyMirrorComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      point1: Point,
      point2: Point,
    ) => {
      const command = new MirrorCanvasEntitiesCommand(
        entityIds,
        point1,
        point2,
        false,
      );
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "MIRROR",
          message: result.message || `Mirrored ${entityIds.length} object(s)`,
          duration: 2000,
        });
      }

      setTool(ToolMode.SELECT);
    },
    [executeCommandObject, addNotification, setTool],
  );

  // ==================== SCALE ====================
  const handleModifyScaleComplete = useCallback(
    (
      entityIds: string[],
      dimensionIds: string[],
      center: Point,
      scaleFactor: number,
    ) => {
      const command = new ScaleCanvasEntitiesCommand(
        entityIds,
        center,
        scaleFactor,
      );
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "SCALE",
          message: `Scaled ${
            entityIds.length
          } object(s) by ${scaleFactor.toFixed(2)}`,
          duration: 2000,
        });
      }

      setTool(ToolMode.SELECT);
    },
    [executeCommandObject, addNotification, setTool],
  );

  // ==================== OFFSET ====================
  const handleModifyOffsetComplete = useCallback(
    (entityId: string, distance: number, throughPoint: Point) => {
      const command = new OffsetCanvasEntityCommand(
        entityId,
        distance,
        throughPoint,
      );
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "OFFSET",
          message: result.message || `Created offset at distance ${distance}`,
          duration: 2000,
        });
      } else {
        addNotification({
          type: "error",
          title: "OFFSET",
          message: result?.message || "Failed to create offset",
          duration: 3000,
        });
      }
    },
    [executeCommandObject, addNotification],
  );

  // ==================== TRIM ====================
  const handleTrimComplete = useCallback(
    (entityId: string, pickPoint: Point, cuttingEdgeIds: string[]) => {
      const command = new TrimCanvasEntityCommand(
        entityId,
        pickPoint,
        cuttingEdgeIds,
      );
      const result = executeCommandObject(command);

      console.log("[handleTrimComplete] result:", result);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "TRIM",
          message: result.message || "Entity trimmed successfully",
          duration: 2000,
        });
      } else {
        console.log(
          "[handleTrimComplete] showing error notification:",
          result?.message,
        );
        addNotification({
          type: "error",
          title: "TRIM",
          message: result?.message || "Failed to trim entity",
          duration: 3000,
        });
      }
    },
    [executeCommandObject, addNotification],
  );

  // ==================== EXTEND ====================
  const handleExtendComplete = useCallback(
    (entityId: string, pickPoint: Point, boundaryEdgeIds: string[]) => {
      const command = new ExtendCanvasEntityCommand(
        entityId,
        pickPoint,
        boundaryEdgeIds,
      );
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "EXTEND",
          message: result.message || "Entity extended successfully",
          duration: 2000,
        });
      } else {
        addNotification({
          type: "error",
          title: "EXTEND",
          message: result?.message || "Failed to extend entity",
          duration: 3000,
        });
      }
    },
    [executeCommandObject, addNotification],
  );

  // ==================== EXPLODE ====================
  const handleExplodeCommand = useCallback(() => {
    const selectedEntityIds = documentSelectedIds;

    if (selectedEntityIds.length === 0) {
      addNotification({
        type: "warning",
        title: "EXPLODE",
        message: "Select objects to explode first",
        duration: 2000,
      });
      return;
    }

    const command = new ExplodeCanvasEntitiesCommand(selectedEntityIds);
    const result = executeCommandObject(command);

    if (result?.success) {
      addNotification({
        type: "success",
        title: "EXPLODE",
        message: result.message || "Objects exploded successfully",
        duration: 2000,
      });
      clearDocumentSelection();
    } else {
      addNotification({
        type: "error",
        title: "EXPLODE",
        message: result?.message || "Failed to explode objects",
        duration: 3000,
      });
    }
  }, [
    documentSelectedIds,
    executeCommandObject,
    addNotification,
    clearDocumentSelection,
  ]);

  // Sync handleExplodeCommandRef
  useEffect(() => {
    handleExplodeCommandRef.current = handleExplodeCommand;
  }, [handleExplodeCommand, handleExplodeCommandRef]);

  // ==================== FILLET ====================
  const handleFilletComplete = useCallback(
    (
      entityId1: string,
      entityId2: string,
      radius: number,
      clickPoint1: Point,
      clickPoint2: Point,
    ) => {
      const command = new FilletCanvasEntityCommand(
        entityId1,
        entityId2,
        radius,
        clickPoint1,
        clickPoint2,
      );
      const result = executeCommandObject(command);

      if (result?.success) {
        addNotification({
          type: "success",
          title: "FILLET",
          message: result.message || "Fillet applied successfully",
          duration: 2000,
        });
      } else {
        addNotification({
          type: "error",
          title: "FILLET",
          message: result?.message || "Failed to apply fillet",
          duration: 3000,
        });
      }
    },
    [executeCommandObject, addNotification],
  );

  // ==================== BOUNDARY ====================
  const handleBoundaryComplete = useCallback(
    (pickPoint: Point) => {
      const allEntities = documentEntities;

      // Cast CadEntity[] → CanvasEntity[] (boundary only uses geometry fields)
      const result = findBoundaryFromEntities(
        allEntities as unknown as import("../core/commands/canvas/CanvasEntityCommands").CanvasEntity[],
        pickPoint,
      );

      if (result.success && result.points.length >= 3) {
        const newEntity = {
          id: `boundary_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          type: "polyline" as const,
          points: result.points.map((p: { x: number; y: number }) => ({
            x: p.x,
            y: p.y,
          })),
          color: result.color,
          lineWidth: 2,
          closed: true,
          selected: true,
          layer: result.layer,
        };

        addDocumentEntity(newEntity);

        addNotification({
          type: "success",
          title: "BOUNDARY",
          message: `Created boundary polyline with ${result.points.length} vertices`,
          duration: 2000,
        });
      } else {
        addNotification({
          type: "error",
          title: "BOUNDARY",
          message: result.message || "No closed boundary found at pick point",
          duration: 3000,
        });
      }
    },
    [documentEntities, addDocumentEntity, addNotification],
  );

  return {
    handleModifyMoveComplete,
    handleModifyCopyComplete,
    handleModifyRotateComplete,
    handleModifyMirrorComplete,
    handleModifyScaleComplete,
    handleModifyOffsetComplete,
    handleTrimComplete,
    handleExtendComplete,
    handleExplodeCommand,
    handleFilletComplete,
    handleBoundaryComplete,
  };
}
