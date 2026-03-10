/**
 * useDimensionClick Hook
 *
 * Extracted from useDimensions.ts (STEP-5.4)
 * Contains:
 * - handleClick: Main click handler for all dimension types (linear, horizontal, vertical, aligned, angular, radius, arc, diameter, continue, baseline)
 * - snapToEntityRef: Convert OSNAP result to EntityReference
 * - startContinueMode / startBaselineMode / exitChainMode
 *
 * ĐIỀU KIỆN 1: UI → Command → CadEngine → Document → History
 */

import { useCallback } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type {
  DimensionManager,
  DimensionEntity,
  Point,
  EntityReference,
} from "../core/dimensions/DimensionManager";
import type { DimensionToolState } from "./useDimensions";

// ==================== Types ====================

export interface UseDimensionClickParams {
  toolState: DimensionToolState;
  setToolState: Dispatch<SetStateAction<DimensionToolState>>;
  managerRef: MutableRefObject<DimensionManager>;
  addDimensionInternal: (dimension: DimensionEntity) => void;
  dimensions: DimensionEntity[];
  setPreviewDimension: Dispatch<SetStateAction<DimensionEntity | null>>;
}

export interface UseDimensionClickReturn {
  handleClick: (
    point: Point,
    entityRef?: EntityReference,
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
      entity?: {
        id: string;
        type: string;
        points?: { x: number; y: number }[];
      };
      pointIndex?: number;
    } | null,
  ) => DimensionEntity | null;
  snapToEntityRef: (snap: {
    point: Point;
    type: string;
    entity?: {
      id: string;
      type: string;
      points?: { x: number; y: number }[];
    };
    pointIndex?: number;
  }) => EntityReference | undefined;
  startContinueMode: (fromDimension?: DimensionEntity) => boolean;
  startBaselineMode: (fromDimension?: DimensionEntity) => boolean;
  exitChainMode: () => void;
}

// ==================== Hook ====================

export function useDimensionClick(
  params: UseDimensionClickParams,
): UseDimensionClickReturn {
  const {
    toolState,
    setToolState,
    managerRef,
    addDimensionInternal,
    dimensions,
    setPreviewDimension,
  } = params;

  // ============================================
  // CONTINUE / BASELINE MODE
  // ============================================

  const startContinueMode = useCallback(
    (fromDimension?: DimensionEntity): boolean => {
      const lastDim = fromDimension || dimensions[dimensions.length - 1];
      if (!lastDim) {
        return false;
      }

      const direction = lastDim.direction || "horizontal";
      const midY = (lastDim.point1.y + lastDim.point2.y) / 2;
      const midX = (lastDim.point1.x + lastDim.point2.x) / 2;
      const dimLinePos =
        direction === "horizontal"
          ? midY + lastDim.offset
          : midX + lastDim.offset;

      setToolState((prev) => ({
        ...prev,
        isActive: true,
        dimensionType: "continue",
        isContinueMode: true,
        isBaselineMode: false,
        lastDimension: lastDim,
        step: 0,
        point1: lastDim.point2,
        direction: direction,
        offset: lastDim.offset,
        dimLinePosition: dimLinePos,
      }));
      return true;
    },
    [dimensions, setToolState],
  );

  const startBaselineMode = useCallback(
    (fromDimension?: DimensionEntity): boolean => {
      const lastDim = fromDimension || dimensions[dimensions.length - 1];
      if (!lastDim) {
        return false;
      }

      setToolState((prev) => ({
        ...prev,
        isActive: true,
        dimensionType: "baseline",
        isContinueMode: false,
        isBaselineMode: true,
        lastDimension: lastDim,
        step: 0,
        point1: lastDim.point1,
        direction: lastDim.direction || "auto",
        offset: lastDim.offset,
      }));
      return true;
    },
    [dimensions, setToolState],
  );

  const exitChainMode = useCallback(() => {
    setToolState((prev) => ({
      ...prev,
      isContinueMode: false,
      isBaselineMode: false,
      lastDimension: null,
    }));
  }, [setToolState]);

  // ============================================
  // SNAP TO ENTITY REF
  // ============================================

  /**
   * Convert snap result to EntityReference
   * CRITICAL: Must include pointIndex for associative dimensions to work with lifecycle
   */
  const snapToEntityRef = useCallback(
    (snap: {
      point: Point;
      type: string;
      entity?: {
        id: string;
        type: string;
        points?: { x: number; y: number }[];
      };
      pointIndex?: number;
    }): EntityReference | undefined => {
      if (!snap.entity) return undefined;

      const entityType = snap.entity.type as EntityReference["entityType"];

      if (!["line", "circle", "arc", "polyline", "rect"].includes(entityType)) {
        return undefined;
      }

      let snapType: EntityReference["snapType"] = "endpoint";
      const type = (snap.type || "").toUpperCase();
      if (type.includes("MIDPOINT")) snapType = "midpoint";
      else if (type.includes("CENTER")) snapType = "center";
      else if (type.includes("QUADRANT")) snapType = "quadrant";
      else if (type.includes("INTERSECTION")) snapType = "intersection";
      else if (type.includes("NEAREST")) snapType = "nearest";

      // ========== CRITICAL: Calculate pointIndex for endpoint snaps ==========
      let calculatedPointIndex = snap.pointIndex;
      if (
        calculatedPointIndex === undefined &&
        snapType === "endpoint" &&
        snap.entity.points &&
        snap.entity.points.length > 0
      ) {
        let minDist = Infinity;
        for (let i = 0; i < snap.entity.points.length; i++) {
          const p = snap.entity.points[i];
          const dx = p.x - snap.point.x;
          const dy = p.y - snap.point.y;
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            calculatedPointIndex = i;
          }
        }
        if (minDist > 100) {
          console.warn(
            "[snapToEntityRef] Warning: snap point far from entity points, minDist=",
            Math.sqrt(minDist),
          );
        }
      }

      return {
        entityId: snap.entity.id,
        entityType,
        snapType,
        point: { x: snap.point.x, y: snap.point.y },
        pointIndex: calculatedPointIndex,
      };
    },
    [],
  );

  // ============================================
  // CLICK HANDLING
  // ============================================

  const handleClick = useCallback(
    (
      point: Point,
      entityRef?: EntityReference,
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
        entity?: {
          id: string;
          type: string;
          points?: { x: number; y: number }[];
        };
        pointIndex?: number;
      } | null,
    ): DimensionEntity | null => {
      if (!toolState.isActive) return null;

      // Convert snap result to entity reference if available
      const effectiveRef = snapResult ? snapToEntityRef(snapResult) : entityRef;

      const manager = managerRef.current;

      switch (toolState.dimensionType) {
        // DLI - Linear: Tự động ngang/dọc theo góc 2 điểm
        case "linear": {
          // One-click mode: Chỉ khi autoSelectMode = true VÀ có lineInfo
          if (toolState.autoSelectMode && lineInfo && toolState.step === 0) {
            console.log("[DLI] One-click mode: Line detected!", lineInfo);
            const autoDirection = manager.autoDetectLinearDirection(
              lineInfo.point1,
              lineInfo.point2,
            );
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point1: lineInfo.point1,
              point2: lineInfo.point2,
              // ========== CRITICAL: Include pointIndex for associative dimensions ==========
              ref1: {
                entityId: lineInfo.entityId,
                entityType: "line",
                snapType: "endpoint",
                point: lineInfo.point1,
                pointIndex: 0,
              },
              ref2: {
                entityId: lineInfo.entityId,
                entityType: "line",
                snapType: "endpoint",
                point: lineInfo.point2,
                pointIndex: 1,
              },
              direction: autoDirection,
            }));
            return null;
          }

          if (toolState.step === 0) {
            // ========== GUARD: PHẢI có OSNAP để tạo associative dimension ==========
            if (!effectiveRef) {
              console.warn(
                "[DLI] Step 0: No OSNAP - ABORT. Must snap to entity endpoint.",
              );
              return null;
            }
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: effectiveRef,
            }));
            return null;
          } else if (toolState.step === 1) {
            // ========== GUARD: PHẢI có OSNAP ==========
            if (!effectiveRef) {
              console.warn(
                "[DLI] Step 1: No OSNAP - ABORT. Must snap to entity endpoint.",
              );
              return null;
            }
            const autoDirection = manager.autoDetectLinearDirection(
              toolState.point1!,
              point,
            );
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
              ref2: effectiveRef,
              direction: autoDirection,
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            // ========== GUARD: Validate refs ==========
            if (!toolState.ref1 || !toolState.ref2) {
              console.error("[DLI] Step 2: Missing ref1 or ref2 - ABORT");
              return null;
            }

            const direction =
              toolState.direction === "auto"
                ? manager.autoDetectLinearDirection(
                    toolState.point1,
                    toolState.point2,
                  )
                : (toolState.direction as "horizontal" | "vertical");

            console.log(
              "[DLI] Creating dimension with direction:",
              direction,
              "toolState.direction:",
              toolState.direction,
            );

            const dimension = manager.createLinearDimension({
              point1: toolState.point1,
              point2: toolState.point2,
              offset: toolState.offset,
              direction,
              ref1: toolState.ref1,
              ref2: toolState.ref2,
            });

            console.log(
              "[DLI] Created dimension:",
              dimension.dimensionType,
              dimension.direction,
            );

            addDimensionInternal(dimension);

            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              point3: null,
              ref1: null,
              ref2: null,
              lastDimension: dimension,
            }));
            setPreviewDimension(null);

            return dimension;
          }
          break;
        }

        // DHO - Horizontal: Cưỡng ép ngang
        case "horizontal": {
          if (toolState.step === 0) {
            if (!effectiveRef) {
              console.warn(
                "[DHO] Step 0: No OSNAP - ABORT. Must snap to entity endpoint.",
              );
              return null;
            }
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: effectiveRef,
              direction: "horizontal",
            }));
            return null;
          } else if (toolState.step === 1) {
            if (!effectiveRef) {
              console.warn(
                "[DHO] Step 1: No OSNAP - ABORT. Must snap to entity endpoint.",
              );
              return null;
            }
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
              ref2: effectiveRef,
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            if (!toolState.ref1 || !toolState.ref2) {
              console.error("[DHO] Step 2: Missing ref1 or ref2 - ABORT");
              return null;
            }

            const dimension = manager.createLinearDimension({
              point1: toolState.point1,
              point2: toolState.point2,
              offset: toolState.offset,
              direction: "horizontal",
              ref1: toolState.ref1,
              ref2: toolState.ref2,
            });

            addDimensionInternal(dimension);
            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              ref1: null,
              ref2: null,
              lastDimension: dimension,
            }));
            setPreviewDimension(null);
            return dimension;
          }
          break;
        }

        // DVE - Vertical: Cưỡng ép dọc
        case "vertical": {
          if (toolState.step === 0) {
            if (!effectiveRef) {
              console.warn(
                "[DVE] Step 0: No OSNAP - ABORT. Must snap to entity endpoint.",
              );
              return null;
            }
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: effectiveRef,
              direction: "vertical",
            }));
            return null;
          } else if (toolState.step === 1) {
            if (!effectiveRef) {
              console.warn(
                "[DVE] Step 1: No OSNAP - ABORT. Must snap to entity endpoint.",
              );
              return null;
            }
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
              ref2: effectiveRef,
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            if (!toolState.ref1 || !toolState.ref2) {
              console.error("[DVE] Step 2: Missing ref1 or ref2 - ABORT");
              return null;
            }

            const dimension = manager.createLinearDimension({
              point1: toolState.point1,
              point2: toolState.point2,
              offset: toolState.offset,
              direction: "vertical",
              ref1: toolState.ref1,
              ref2: toolState.ref2,
            });

            addDimensionInternal(dimension);
            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              ref1: null,
              ref2: null,
              lastDimension: dimension,
            }));
            setPreviewDimension(null);
            return dimension;
          }
          break;
        }

        // DAL - Aligned: Đo theo cạnh xiên (song song với đoạn cần đo)
        case "aligned": {
          // One-click mode
          if (toolState.autoSelectMode && lineInfo && toolState.step === 0) {
            console.log("[DAL] One-click mode: Line detected!", lineInfo);
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point1: lineInfo.point1,
              point2: lineInfo.point2,
              ref1: {
                entityId: lineInfo.entityId,
                entityType: "line",
                snapType: "endpoint",
                point: lineInfo.point1,
                pointIndex: 0,
              },
              ref2: {
                entityId: lineInfo.entityId,
                entityType: "line",
                snapType: "endpoint",
                point: lineInfo.point2,
                pointIndex: 1,
              },
              direction: "aligned",
            }));
            return null;
          }

          if (toolState.step === 0) {
            if (!effectiveRef) {
              console.warn(
                "[DAL] Step 0: No OSNAP - ABORT. Must snap to entity endpoint.",
              );
              return null;
            }
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: effectiveRef,
              direction: "aligned",
            }));
            return null;
          } else if (toolState.step === 1) {
            if (!effectiveRef) {
              console.warn(
                "[DAL] Step 1: No OSNAP - ABORT. Must snap to entity endpoint.",
              );
              return null;
            }
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
              ref2: effectiveRef,
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            if (!toolState.ref1 || !toolState.ref2) {
              console.error("[DAL] Step 2: Missing ref1 or ref2 - ABORT");
              return null;
            }

            const dimension = manager.createLinearDimension({
              point1: toolState.point1,
              point2: toolState.point2,
              offset: toolState.offset,
              direction: "aligned",
              ref1: toolState.ref1,
              ref2: toolState.ref2,
            });

            addDimensionInternal(dimension);
            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              ref1: null,
              ref2: null,
              lastDimension: dimension,
            }));
            setPreviewDimension(null);
            return dimension;
          }
          break;
        }

        // DCO - Continue: Kích thước nối tiếp
        case "continue": {
          if (!toolState.lastDimension || toolState.dimLinePosition === null) {
            return null;
          }

          const continueDim = manager.createContinueDimension(
            toolState.lastDimension,
            point,
            toolState.dimLinePosition,
          );

          addDimensionInternal(continueDim);

          setToolState((prev) => ({
            ...prev,
            lastDimension: continueDim,
            point1: continueDim.point2,
          }));
          setPreviewDimension(null);

          return continueDim;
        }

        // Baseline dimension mode
        case "baseline": {
          if (!toolState.lastDimension) {
            return null;
          }

          const baselineDim = manager.createBaselineDimension(
            toolState.lastDimension,
            point,
            15,
          );

          addDimensionInternal(baselineDim);

          setToolState((prev) => ({
            ...prev,
            lastDimension: baselineDim,
          }));
          setPreviewDimension(null);

          return baselineDim;
        }

        case "angular": {
          if (!lineInfo) {
            console.log("[DAN] Please select a line");
            return null;
          }

          if (toolState.step === 0) {
            setToolState((prev) => ({
              ...prev,
              step: 1,
              line1: lineInfo,
              ref1: effectiveRef || null,
            }));
            return null;
          } else if (toolState.step === 1 && toolState.line1) {
            const intersection = manager.calculateLineIntersection(
              toolState.line1,
              lineInfo,
            );

            if (!intersection) {
              console.log("[DAN] Lines are parallel - no intersection");
              return null;
            }

            const dist1a = manager.calculateDistance(
              intersection,
              toolState.line1.point1,
            );
            const dist1b = manager.calculateDistance(
              intersection,
              toolState.line1.point2,
            );
            const rayPoint1 =
              dist1a > dist1b ? toolState.line1.point1 : toolState.line1.point2;

            const dist2a = manager.calculateDistance(
              intersection,
              lineInfo.point1,
            );
            const dist2b = manager.calculateDistance(
              intersection,
              lineInfo.point2,
            );
            const rayPoint2 =
              dist2a > dist2b ? lineInfo.point1 : lineInfo.point2;

            const dimension = manager.createAngularDimension({
              center: intersection,
              point1: rayPoint1,
              point2: rayPoint2,
              offset: 50,
            });

            addDimensionInternal(dimension);

            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              point3: null,
              line1: null,
              line2: null,
            }));
            setPreviewDimension(null);

            return dimension;
          }
          break;
        }

        case "radius":
        case "diameter": {
          if (circleInfo) {
            console.log("[DRA] Circle detected!", circleInfo);

            const center = circleInfo.center;
            const radius = circleInfo.radius;
            const angle = Math.atan2(point.y - center.y, point.x - center.x);

            // ========== 2D FIRST: Create entityRef for LEGACY radial dimension ==========
            const circleEntityRef: EntityReference = {
              entityId: circleInfo.entityId,
              entityType: "circle",
              snapType: "center",
              point: center,
            };

            const dimension =
              toolState.dimensionType === "radius"
                ? manager.createRadiusDimension({
                    center,
                    radius,
                    angle,
                    entityRef: circleEntityRef,
                  })
                : manager.createDiameterDimension(
                    center,
                    radius,
                    angle,
                    circleEntityRef,
                  );

            // Mark as LEGACY for circle/arc (display-only, no lifecycle)
            dimension.isLegacy = true;

            console.log("[DRA] Created LEGACY dimension:", dimension);
            addDimensionInternal(dimension);
            console.log("[DRA] Added dimension to document");

            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              offset: 30,
            }));
            setPreviewDimension(null);

            return dimension;
          }

          // ========================================================================
          // 2D FIRST INVARIANT: DRA REQUIRES ENTITY REFERENCE
          // ========================================================================
          console.warn(
            "[DRA] ABORT: No circle/arc entity detected. " +
              "Radius/diameter dimensions require clicking on a circle or arc entity. " +
              "Manual mode is disabled to enforce ref1 invariant.",
          );
          break;
        }

        // DAR - Arc dimension: Đo chiều dài cung
        case "arc": {
          // Flow 1: Nếu click vào arc entity - tạo dimension ngay
          if (arcInfo) {
            const dimension = manager.createArcDimension({
              center: arcInfo.center,
              radius: arcInfo.radius,
              startAngle: arcInfo.startAngle,
              endAngle: arcInfo.endAngle,
              offset: 20,
            });

            addDimensionInternal(dimension);

            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              point3: null,
              lastDimension: dimension,
            }));
            setPreviewDimension(null);

            return dimension;
          }

          // Flow 2: Nếu click vào circle - chọn 2 điểm
          if (circleInfo && toolState.step === 0) {
            const clickAngle = Math.atan2(
              point.y - circleInfo.center.y,
              point.x - circleInfo.center.x,
            );
            const startPoint = {
              x: circleInfo.center.x + circleInfo.radius * Math.cos(clickAngle),
              y: circleInfo.center.y + circleInfo.radius * Math.sin(clickAngle),
            };

            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: circleInfo.center,
              point2: startPoint,
              ref1: effectiveRef || null,
            }));
            return null;
          }

          // Flow 2 tiếp: Click điểm thứ 2 trên circle
          if (
            toolState.step === 1 &&
            toolState.point1 &&
            toolState.point2 &&
            circleInfo
          ) {
            const center = toolState.point1;
            const clickAngle = Math.atan2(
              point.y - center.y,
              point.x - center.x,
            );

            const startAngle = Math.atan2(
              toolState.point2.y - center.y,
              toolState.point2.x - center.x,
            );
            const endAngle = clickAngle;

            const dimension = manager.createArcDimension({
              center,
              radius: circleInfo.radius,
              startAngle,
              endAngle,
              offset: 20,
            });

            addDimensionInternal(dimension);

            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              point3: null,
              lastDimension: dimension,
            }));
            setPreviewDimension(null);

            return dimension;
          }

          break;
        }
      }

      return null;
    },
    [
      toolState,
      addDimensionInternal,
      snapToEntityRef,
      managerRef,
      setToolState,
      setPreviewDimension,
    ],
  );

  return {
    handleClick,
    snapToEntityRef,
    startContinueMode,
    startBaselineMode,
    exitChainMode,
  };
}
