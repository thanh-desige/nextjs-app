/**
 * useDimensionPreview Hook
 *
 * Extracted from useDimensions.ts (STEP-5.4)
 * Contains:
 * - handleMove: Mouse move handler for dimension preview rendering
 * - Preview state management (previewDimension, previewDimensions)
 *
 * Handles preview for all dimension types:
 * Linear, Horizontal, Vertical, Aligned, Continue, Baseline, Radius, Arc, Diameter, QDIM
 */

import { useState, useCallback } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type {
  DimensionManager,
  DimensionEntity,
  Point,
} from "../core/dimensions/DimensionManager";
import type { DimensionToolState } from "./useDimensions";

// ==================== Types ====================

export interface UseDimensionPreviewParams {
  toolState: DimensionToolState;
  setToolState: Dispatch<SetStateAction<DimensionToolState>>;
  managerRef: MutableRefObject<DimensionManager>;
}

export interface UseDimensionPreviewReturn {
  handleMove: (point: Point) => void;
  previewDimension: DimensionEntity | null;
  setPreviewDimension: Dispatch<SetStateAction<DimensionEntity | null>>;
  previewDimensions: DimensionEntity[];
  setPreviewDimensions: Dispatch<SetStateAction<DimensionEntity[]>>;
}

// ==================== Hook ====================

export function useDimensionPreview(
  params: UseDimensionPreviewParams,
): UseDimensionPreviewReturn {
  const { toolState, setToolState, managerRef } = params;

  const [previewDimension, setPreviewDimension] =
    useState<DimensionEntity | null>(null);

  // QDIM preview (nhiều dimensions)
  const [previewDimensions, setPreviewDimensions] = useState<DimensionEntity[]>(
    [],
  );

  // ============================================
  // MOUSE MOVE HANDLING
  // ============================================

  const handleMove = useCallback(
    (point: Point) => {
      if (!toolState.isActive) return;

      const manager = managerRef.current;

      // QDIM - Quick Dimension preview
      if (toolState.dimensionType === "qdim" && toolState.step === 1) {
        const { qdimPoints, qdimMode } = toolState;
        if (qdimPoints.length < 2) return;

        const direction = manager.detectQdimDirection(qdimPoints, point);
        const dimLinePosition = direction === "horizontal" ? point.y : point.x;

        let previewDims: DimensionEntity[] = [];
        switch (qdimMode) {
          case "continuous":
            previewDims = manager.createQdimContinuous(
              qdimPoints,
              dimLinePosition,
              direction,
            );
            break;
          case "baseline":
            previewDims = manager.createQdimBaseline(
              qdimPoints,
              dimLinePosition,
              15,
              direction,
            );
            break;
          case "staggered":
            previewDims = manager.createQdimStaggered(
              qdimPoints,
              dimLinePosition,
              10,
              direction,
            );
            break;
          default:
            previewDims = manager.createQdimContinuous(
              qdimPoints,
              dimLinePosition,
              direction,
            );
        }

        setPreviewDimensions(previewDims);
        setToolState((prev) => ({ ...prev, dimLinePosition, direction }));
        return;
      }

      // DCO - Continue preview
      if (
        toolState.dimensionType === "continue" &&
        toolState.lastDimension &&
        toolState.dimLinePosition !== null
      ) {
        const preview = manager.createContinueDimension(
          toolState.lastDimension,
          point,
          toolState.dimLinePosition,
        );
        setPreviewDimension(preview);
        return;
      }

      // DBA - Baseline preview
      if (toolState.dimensionType === "baseline" && toolState.lastDimension) {
        const preview = manager.createBaselineDimension(
          toolState.lastDimension,
          point,
          15,
        );
        setPreviewDimension(preview);
        return;
      }

      // DLI - Linear (tự động ngang/dọc)
      if (toolState.dimensionType === "linear") {
        if (toolState.step === 1 && toolState.point1) {
          const autoDirection = manager.autoDetectLinearDirection(
            toolState.point1,
            point,
          );
          const preview = manager.createLinearDimension({
            point1: toolState.point1,
            point2: point,
            offset: toolState.offset,
            direction: autoDirection,
          });
          setPreviewDimension(preview);
        } else if (
          toolState.step === 2 &&
          toolState.point1 &&
          toolState.point2
        ) {
          const direction = manager.detectDirectionFromOffset(
            toolState.point1,
            toolState.point2,
            point,
          );

          const offset = manager.calculateOffsetFromMouse(
            toolState.point1,
            toolState.point2,
            point,
            direction,
          );

          setToolState((prev) => ({ ...prev, offset, direction }));

          const preview = manager.createLinearDimension({
            point1: toolState.point1,
            point2: toolState.point2,
            offset,
            direction,
          });
          setPreviewDimension(preview);
        }
        return;
      }

      // DHO - Horizontal (cưỡng ép ngang)
      if (toolState.dimensionType === "horizontal") {
        if (toolState.step === 1 && toolState.point1) {
          const preview = manager.createLinearDimension({
            point1: toolState.point1,
            point2: point,
            offset: toolState.offset,
            direction: "horizontal",
          });
          setPreviewDimension(preview);
        } else if (
          toolState.step === 2 &&
          toolState.point1 &&
          toolState.point2
        ) {
          const offset = manager.calculateOffsetFromMouse(
            toolState.point1,
            toolState.point2,
            point,
            "horizontal",
          );

          setToolState((prev) => ({ ...prev, offset }));

          const preview = manager.createLinearDimension({
            point1: toolState.point1,
            point2: toolState.point2,
            offset,
            direction: "horizontal",
          });
          setPreviewDimension(preview);
        }
        return;
      }

      // DVE - Vertical (cưỡng ép dọc)
      if (toolState.dimensionType === "vertical") {
        if (toolState.step === 1 && toolState.point1) {
          const preview = manager.createLinearDimension({
            point1: toolState.point1,
            point2: point,
            offset: toolState.offset,
            direction: "vertical",
          });
          setPreviewDimension(preview);
        } else if (
          toolState.step === 2 &&
          toolState.point1 &&
          toolState.point2
        ) {
          const offset = manager.calculateOffsetFromMouse(
            toolState.point1,
            toolState.point2,
            point,
            "vertical",
          );

          setToolState((prev) => ({ ...prev, offset }));

          const preview = manager.createLinearDimension({
            point1: toolState.point1,
            point2: toolState.point2,
            offset,
            direction: "vertical",
          });
          setPreviewDimension(preview);
        }
        return;
      }

      // DAL - Aligned (song song cạnh)
      if (toolState.dimensionType === "aligned") {
        if (toolState.step === 1 && toolState.point1) {
          const preview = manager.createLinearDimension({
            point1: toolState.point1,
            point2: point,
            offset: toolState.offset,
            direction: "aligned",
          });
          setPreviewDimension(preview);
        } else if (
          toolState.step === 2 &&
          toolState.point1 &&
          toolState.point2
        ) {
          const offset = manager.calculateOffsetFromMouse(
            toolState.point1,
            toolState.point2,
            point,
            "aligned",
          );

          setToolState((prev) => ({ ...prev, offset }));

          const preview = manager.createLinearDimension({
            point1: toolState.point1,
            point2: toolState.point2,
            offset,
            direction: "aligned",
          });
          setPreviewDimension(preview);
        }
        return;
      }

      // DRA - Radius preview
      if (
        toolState.dimensionType === "radius" &&
        toolState.step === 1 &&
        toolState.point1
      ) {
        const radius = manager.calculateDistance(toolState.point1, point);
        const angle = Math.atan2(
          point.y - toolState.point1.y,
          point.x - toolState.point1.x,
        );
        const preview = manager.createRadiusDimension({
          center: toolState.point1,
          radius,
          angle,
        });
        setPreviewDimension(preview);
        return;
      }

      // DAR - Arc dimension preview
      if (toolState.dimensionType === "arc") {
        if (toolState.step === 1 && toolState.point1) {
          const radius = manager.calculateDistance(toolState.point1, point);
          const startAngle = Math.atan2(
            point.y - toolState.point1.y,
            point.x - toolState.point1.x,
          );
          const preview = manager.createArcDimension({
            center: toolState.point1,
            radius,
            startAngle,
            endAngle: startAngle + 0.1,
            offset: 20,
          });
          setPreviewDimension(preview);
        } else if (
          toolState.step === 2 &&
          toolState.point1 &&
          toolState.point2
        ) {
          const center = toolState.point1;
          const startPoint = toolState.point2;
          const radius = manager.calculateDistance(center, startPoint);
          const startAngle = Math.atan2(
            startPoint.y - center.y,
            startPoint.x - center.x,
          );
          const endAngle = Math.atan2(point.y - center.y, point.x - center.x);

          const preview = manager.createArcDimension({
            center,
            radius,
            startAngle,
            endAngle,
            offset: 20,
          });
          setPreviewDimension(preview);
        } else if (
          toolState.step === 3 &&
          toolState.point1 &&
          toolState.point2 &&
          toolState.point3
        ) {
          const center = toolState.point1;
          const startPoint = toolState.point2;
          const endPoint = toolState.point3;
          const radius = manager.calculateDistance(center, startPoint);
          const startAngle = Math.atan2(
            startPoint.y - center.y,
            startPoint.x - center.x,
          );
          const endAngle = Math.atan2(
            endPoint.y - center.y,
            endPoint.x - center.x,
          );

          const distFromCenter = manager.calculateDistance(center, point);
          const offset = distFromCenter - radius;
          setToolState((prev) => ({ ...prev, offset }));

          const preview = manager.createArcDimension({
            center,
            radius,
            startAngle,
            endAngle,
            offset,
          });
          setPreviewDimension(preview);
        }
        return;
      }

      // Diameter preview
      if (
        toolState.dimensionType === "diameter" &&
        toolState.step === 1 &&
        toolState.point1
      ) {
        const radius = manager.calculateDistance(toolState.point1, point);
        const angle = Math.atan2(
          point.y - toolState.point1.y,
          point.x - toolState.point1.x,
        );
        const preview = manager.createDiameterDimension(
          toolState.point1,
          radius,
          angle,
        );
        setPreviewDimension(preview);
        return;
      }

      // Angular preview
      if (
        toolState.dimensionType === "angular" &&
        toolState.step === 1 &&
        toolState.line1
      ) {
        setPreviewDimension(null);
        return;
      }
    },
    [toolState, managerRef, setToolState],
  );

  return {
    handleMove,
    previewDimension,
    setPreviewDimension,
    previewDimensions,
    setPreviewDimensions,
  };
}
