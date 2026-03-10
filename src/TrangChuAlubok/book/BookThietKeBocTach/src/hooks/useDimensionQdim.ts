/**
 * useDimensionQdim Hook
 *
 * Extracted from useDimensions.ts (STEP-5.4)
 * Contains:
 * - startQdim: Initialize QDIM tool
 * - setQdimEntities: Set selected entities + extract points
 * - setQdimMode: Change QDIM mode (continuous, baseline, staggered)
 * - confirmQdim: Create all QDIM dimensions via BatchAddDimensionCommand
 *
 * ĐIỀU KIỆN 1: Sử dụng BatchAddDimensionCommand cho History support
 */

import { useCallback } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type {
  DimensionManager,
  DimensionEntity,
  QdimMode,
} from "../core/dimensions/DimensionManager";
import { BatchAddDimensionCommand } from "../core/commands/dimension/DimensionCommands";
import { useEngineStore } from "../store/engineStore";
import type { DimensionToolState, QdimEntity } from "./useDimensions";

// ==================== Types ====================

/** Initial tool state needed for reset */
const qdimInitialState: Partial<DimensionToolState> = {
  isActive: false,
  dimensionType: "linear",
  step: 0,
  point1: null,
  point2: null,
  point3: null,
  offset: 30,
  dimLinePosition: null,
  direction: "auto",
  ref1: null,
  ref2: null,
  ref3: null,
  lastDimension: null,
  isContinueMode: false,
  isBaselineMode: false,
  autoSelectMode: false,
  qdimMode: "continuous",
  qdimSelectedEntities: [],
  qdimPoints: [],
  line1: null,
  line2: null,
};

export interface UseDimensionQdimParams {
  toolState: DimensionToolState;
  setToolState: Dispatch<SetStateAction<DimensionToolState>>;
  managerRef: MutableRefObject<DimensionManager>;
  refreshDimensions: () => void;
  setPreviewDimension: Dispatch<SetStateAction<DimensionEntity | null>>;
  setPreviewDimensions: Dispatch<SetStateAction<DimensionEntity[]>>;
}

export interface UseDimensionQdimReturn {
  startQdim: () => void;
  setQdimEntities: (entities: QdimEntity[]) => void;
  setQdimMode: (mode: QdimMode) => void;
  confirmQdim: () => DimensionEntity[];
}

// ==================== Hook ====================

export function useDimensionQdim(
  params: UseDimensionQdimParams,
): UseDimensionQdimReturn {
  const {
    toolState,
    setToolState,
    managerRef,
    refreshDimensions,
    setPreviewDimension,
    setPreviewDimensions,
  } = params;

  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject,
  );

  /**
   * Bắt đầu QDIM tool
   */
  const startQdim = useCallback(() => {
    setToolState(
      (prev) =>
        ({
          ...prev,
          ...qdimInitialState,
          isActive: true,
          dimensionType: "qdim",
          step: 0,
        }) as DimensionToolState,
    );
    setPreviewDimension(null);
    setPreviewDimensions([]);
  }, [setToolState, setPreviewDimension, setPreviewDimensions]);

  /**
   * Đặt danh sách entities đã chọn cho QDIM
   * Khi entities được chọn, tự động extract points
   */
  const setQdimEntities = useCallback(
    (entities: QdimEntity[]) => {
      const manager = managerRef.current;
      const points = manager.extractPointsFromEntities(entities);

      setToolState((prev) => ({
        ...prev,
        qdimSelectedEntities: entities,
        qdimPoints: points,
        step: points.length >= 2 ? 1 : 0,
      }));
    },
    [managerRef, setToolState],
  );

  /**
   * Đổi mode của QDIM (continuous, baseline, staggered)
   */
  const setQdimMode = useCallback(
    (mode: QdimMode) => {
      setToolState((prev) => ({
        ...prev,
        qdimMode: mode,
      }));
    },
    [setToolState],
  );

  /**
   * Xác nhận và tạo tất cả dimensions từ QDIM
   * ĐIỀU KIỆN 1: Sử dụng BatchAddDimensionCommand
   */
  const confirmQdim = useCallback((): DimensionEntity[] => {
    const manager = managerRef.current;
    const { qdimPoints, qdimMode, dimLinePosition, direction } = toolState;

    if (qdimPoints.length < 2) return [];

    const dir =
      direction === "auto" || direction === "aligned"
        ? "horizontal"
        : direction;

    const dimPos = dimLinePosition ?? 0;

    let newDimensions: DimensionEntity[] = [];

    switch (qdimMode) {
      case "continuous":
        newDimensions = manager.createQdimContinuous(qdimPoints, dimPos, dir);
        break;
      case "baseline":
        newDimensions = manager.createQdimBaseline(qdimPoints, dimPos, 15, dir);
        break;
      case "staggered":
        newDimensions = manager.createQdimStaggered(
          qdimPoints,
          dimPos,
          10,
          dir,
        );
        break;
      default:
        newDimensions = manager.createQdimContinuous(qdimPoints, dimPos, dir);
    }

    // ĐIỀU KIỆN 1: Sử dụng BatchAddDimensionCommand
    if (newDimensions.length > 0) {
      const command = new BatchAddDimensionCommand(newDimensions);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      }
    }

    // Reset tool state
    setToolState(
      (prev) =>
        ({
          ...prev,
          ...qdimInitialState,
        }) as DimensionToolState,
    );
    setPreviewDimension(null);
    setPreviewDimensions([]);

    return newDimensions;
  }, [
    toolState,
    executeCommandObject,
    refreshDimensions,
    managerRef,
    setToolState,
    setPreviewDimension,
    setPreviewDimensions,
  ]);

  return {
    startQdim,
    setQdimEntities,
    setQdimMode,
    confirmQdim,
  };
}
