/**
 * useDimensions Hook
 *
 * Hook quản lý dimension/kích thước trên bản vẽ CAD
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi dimension phải đi qua CadDocument + Commands
 * để History có thể Undo/Redo
 *
 * Enhanced with:
 * - Smart direction detection (horizontal/vertical/aligned)
 * - Baseline and Continue dimension support
 * - Entity snap integration
 * - Text override support
 *
 * STEP-5.4: Extracted handleClick → useDimensionClick.ts
 *           Extracted handleMove → useDimensionPreview.ts
 *           Extracted QDIM → useDimensionQdim.ts
 */

import { useState, useCallback, useRef, useMemo } from "react";
import {
  DimensionManager,
  DimensionEntity,
  DimensionStyle,
  DimensionType,
  DimensionDirection,
  Point,
  EntityReference,
  DEFAULT_DIMENSION_STYLE,
  QdimMode,
} from "../core/dimensions/DimensionManager";
import { useEngineStore } from "../store/engineStore";
import {
  AddDimensionCommand,
  UpdateDimensionCommand,
  DeleteDimensionCommand,
  BatchDeleteDimensionCommand,
} from "../core/commands/dimension/DimensionCommands";
// findDimensionsAttachedToEntity and detachDimensionFromEntity REMOVED
// - Entity deletion now handled by CadDocument.handleEntityDeleted()

// Sub-hooks extracted in STEP-5.4
import { useDimensionClick } from "./useDimensionClick";
import { useDimensionPreview } from "./useDimensionPreview";
import { useDimensionQdim } from "./useDimensionQdim";

// Entity type for QDIM (simplified, matching CadDrawingCanvas entities)
export interface QdimEntity {
  id: string;
  type: string;
  points?: Point[];
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
}

export interface DimensionToolState {
  isActive: boolean;
  dimensionType: DimensionType;
  step: number; // 0: chÆ°a báº¯t Ä‘áº§u, 1: Ä‘Ă£ chá»n Ä‘iá»ƒm 1, 2: Ä‘Ă£ chá»n Ä‘iá»ƒm 2, 3: Ä‘ang kĂ©o offset
  point1: Point | null;
  point2: Point | null;
  point3: Point | null;
  offset: number;
  dimLinePosition: number | null; // Vị trí tuyệt đối của dim line (Y cho horizontal, X cho vertical)
  direction: DimensionDirection; // Current detected direction
  // Entity references for snapping
  ref1: EntityReference | null;
  ref2: EntityReference | null;
  ref3: EntityReference | null;
  // Continue/Baseline mode
  lastDimension: DimensionEntity | null;
  isContinueMode: boolean;
  isBaselineMode: boolean;
  // Auto select mode - 1 click to select line/circle
  autoSelectMode: boolean;
  // QDIM mode
  qdimMode: QdimMode;
  qdimSelectedEntities: QdimEntity[];
  qdimPoints: Point[]; // Extracted points from selected entities
  // Angular dimension - store 2 lines
  line1: { point1: Point; point2: Point; entityId: string } | null;
  line2: { point1: Point; point2: Point; entityId: string } | null;
}

export interface UseDimensionsReturn {
  // State
  dimensions: DimensionEntity[];
  toolState: DimensionToolState;
  style: DimensionStyle;

  // Tool control
  startDimensionTool: (type: DimensionType) => void;
  cancelDimensionTool: () => void;
  setDirection: (dir: DimensionDirection) => void;
  toggleAutoSelectMode: () => void; // Toggle 1-click mode for selecting line/circle

  // Drawing
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
    /** Simplified OSNAP result for associative dimensions */
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
  handleMove: (point: Point) => void;

  // Continue/Baseline - returns true if started successfully, false if no previous dimension
  startContinueMode: (fromDimension?: DimensionEntity) => boolean;
  startBaselineMode: (fromDimension?: DimensionEntity) => boolean;
  exitChainMode: () => void;

  // CRUD
  addDimension: (dimension: DimensionEntity) => void;
  removeDimension: (id: string) => void;
  updateDimension: (id: string, updates: Partial<DimensionEntity>) => void;
  clearDimensions: () => void;

  // Associative Dimensions
  // syncAssociativeDimensions REMOVED - now handled by TRá»¤C Sá»NG in CadDocument.commitEntitiesGeometryChange()
  // handleEntityDeleted REMOVED - now handled by CadDocument.handleEntityDeleted()

  // Style
  setStyle: (style: Partial<DimensionStyle>) => void;

  // Render
  renderDimensions: (
    ctx: CanvasRenderingContext2D,
    viewTransform: { offsetX: number; offsetY: number; scale: number },
  ) => void;

  // Preview
  previewDimension: DimensionEntity | null;

  // QDIM
  startQdim: () => void;
  setQdimEntities: (entities: QdimEntity[]) => void;
  setQdimMode: (mode: QdimMode) => void;
  confirmQdim: () => DimensionEntity[];

  // QDIM preview dimensions (nhiều dimensions)
  previewDimensions: DimensionEntity[];
}

const initialToolState: DimensionToolState = {
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
  // QDIM
  qdimMode: "continuous",
  qdimSelectedEntities: [],
  qdimPoints: [],
  // Angular
  line1: null,
  line2: null,
};

export function useDimensions(): UseDimensionsReturn {
  const managerRef = useRef(new DimensionManager());

  // ÄIá»€U KIá»†N 1: Get dimensions from CadDocument qua store
  const getDocument = useEngineStore((state) => state.getDocument);
  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject,
  );

  // documentVersion: increments on every command/undo/redo to trigger re-render
  const documentVersion = useEngineStore((state) => state.documentVersion);

  // Trigger re-render khi document thay Ä‘á»•i
  const [updateCounter, forceUpdate] = useState(0);

  // Get dimensions from document
  // Use documentVersion as dependency to re-render after undo/redo
  const dimensions = useMemo(() => {
    const doc = getDocument();
    if (!doc) {
      return [];
    }
    const dims = doc.getAllDimensions();
    return dims;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDocument, updateCounter, documentVersion]);

  // Helper to refresh dimensions after changes
  const refreshDimensions = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  // ========================================================================
  // 2D FIRST, 3D READY ARCHITECTURE - LEGACY DIMENSION DETECTION
  // ========================================================================
  // RECT vĂ  CIRCLE Ä‘Æ°á»£c phĂ©p táº¡o dimension nhÆ°ng lĂ  LEGACY (non-associative)
  // Legacy dimensions: display-only, khĂ´ng index, khĂ´ng lifecycle
  // ========================================================================
  const isLegacyEntityType = (entityType: string): boolean => {
    return entityType === "rect" || entityType === "circle";
  };

  /**
   * Helper Ä‘á»ƒ check náº¿u dimension tham chiáº¿u Ä‘áº¿n LEGACY entity (RECT/CIRCLE)
   * Legacy dimensions: display-only, khĂ´ng index, khĂ´ng lifecycle
   */
  const shouldBeLegacyDimension = useCallback(
    (dimension: DimensionEntity): boolean => {
      // Check ref1
      if (
        dimension.ref1?.entityType &&
        isLegacyEntityType(dimension.ref1.entityType)
      ) {
        return true;
      }

      // Check ref2 (for linear dimensions)
      if (
        dimension.ref2?.entityType &&
        isLegacyEntityType(dimension.ref2.entityType)
      ) {
        return true;
      }

      // Check ref3 (for angular dimensions)
      if (
        dimension.ref3?.entityType &&
        isLegacyEntityType(dimension.ref3.entityType)
      ) {
        return true;
      }

      return false;
    },
    [],
  );

  // ÄIá»€U KIá»†N 1: Helper Ä‘á»ƒ thĂªm dimension qua Command
  const addDimensionInternal = useCallback(
    (dimension: DimensionEntity) => {
      // ========== 2D FIRST, 3D READY: Auto-detect legacy dimensions ==========
      // Náº¿u dimension tham chiáº¿u Ä‘áº¿n RECT/CIRCLE, Ä‘Ă¡nh dáº¥u lĂ  LEGACY
      // Legacy dimensions: display-only, khĂ´ng index, khĂ´ng lifecycle
      // PRESERVE existing isLegacy flag (e.g., from radius/diameter creation)
      const isLegacy = dimension.isLegacy || shouldBeLegacyDimension(dimension);
      const finalDimension = isLegacy
        ? { ...dimension, isLegacy: true }
        : dimension;

      if (isLegacy) {
        console.log(
          `[LEGACY DIMENSION] Creating legacy dimension (${dimension.dimensionType}) - ` +
            `display-only, khĂ´ng index, khĂ´ng lifecycle update`,
        );
      }

      const command = new AddDimensionCommand(finalDimension);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      } else {
        // ABORT: Dimension bá»‹ tá»« chá»‘i bá»Ÿi GUARD
        console.error(
          "[useDimensions] ABORT: Dimension not added -",
          result?.message,
        );
      }
    },
    [executeCommandObject, refreshDimensions, shouldBeLegacyDimension],
  );

  const [style, setStyleState] = useState<DimensionStyle>(
    DEFAULT_DIMENSION_STYLE,
  );

  const [toolState, setToolState] =
    useState<DimensionToolState>(initialToolState);

  // ============================================
  // SUB-HOOKS (STEP-5.4 extraction)
  // ============================================

  // Preview state + handleMove
  const {
    handleMove,
    previewDimension,
    setPreviewDimension,
    previewDimensions,
    setPreviewDimensions,
  } = useDimensionPreview({
    toolState,
    setToolState,
    managerRef,
  });

  // Click handling + continue/baseline mode
  const {
    handleClick,
    snapToEntityRef,
    startContinueMode,
    startBaselineMode,
    exitChainMode,
  } = useDimensionClick({
    toolState,
    setToolState,
    managerRef,
    addDimensionInternal,
    dimensions,
    setPreviewDimension,
  });

  // QDIM sub-feature
  const { startQdim, setQdimEntities, setQdimMode, confirmQdim } =
    useDimensionQdim({
      toolState,
      setToolState,
      managerRef,
      refreshDimensions,
      setPreviewDimension,
      setPreviewDimensions,
    });

  // ============================================
  // TOOL CONTROL
  // ============================================

  const startDimensionTool = useCallback((type: DimensionType) => {
    setToolState({
      ...initialToolState,
      isActive: true,
      dimensionType: type,
    });
    setPreviewDimension(null);
    setPreviewDimensions([]);
  }, []);

  const cancelDimensionTool = useCallback(() => {
    setToolState(initialToolState);
    setPreviewDimension(null);
    setPreviewDimensions([]);
  }, []);

  const setDirection = useCallback((dir: DimensionDirection) => {
    setToolState((prev) => {
      // Náº¿u Ä‘ang á»Ÿ step 2 (kĂ©o offset), cáº­p nháº­t preview ngay
      if (
        prev.step === 2 &&
        prev.point1 &&
        prev.point2 &&
        prev.dimensionType === "linear"
      ) {
        const manager = managerRef.current;
        const preview = manager.createLinearDimension({
          point1: prev.point1,
          point2: prev.point2,
          offset: prev.offset,
          direction:
            dir === "auto"
              ? manager.autoDetectLinearDirection(prev.point1, prev.point2)
              : (dir as "horizontal" | "vertical" | "aligned"),
        });
        setPreviewDimension(preview);
      }
      return { ...prev, direction: dir };
    });
  }, []);

  // Toggle auto select mode - 1 click to select line/circle
  const toggleAutoSelectMode = useCallback(() => {
    setToolState((prev) => ({
      ...prev,
      autoSelectMode: !prev.autoSelectMode,
    }));
  }, []);

  // ============================================
  // CRUD OPERATIONS - ÄIá»€U KIá»†N 1: Qua Commands + Document
  // ============================================

  // ============================================
  // CRUD OPERATIONS - ÄIá»€U KIá»†N 1: Qua Commands + Document
  // ============================================

  const addDimension = useCallback(
    (dimension: DimensionEntity) => {
      const command = new AddDimensionCommand(dimension);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      }
    },
    [executeCommandObject, refreshDimensions],
  );

  const removeDimension = useCallback(
    (id: string) => {
      const command = new DeleteDimensionCommand(id);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      }
    },
    [executeCommandObject, refreshDimensions],
  );

  const updateDimension = useCallback(
    (id: string, updates: Partial<DimensionEntity>) => {
      const command = new UpdateDimensionCommand(id, updates);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      }
    },
    [executeCommandObject, refreshDimensions],
  );

  const clearDimensions = useCallback(() => {
    const doc = getDocument();
    if (!doc) return;

    const allIds = doc.getAllDimensions().map((d) => d.id);
    if (allIds.length === 0) return;

    const command = new BatchDeleteDimensionCommand(allIds);
    const result = executeCommandObject(command);
    if (result?.success) {
      refreshDimensions();
    }
  }, [getDocument, executeCommandObject, refreshDimensions]);

  // ==================== ASSOCIATIVE DIMENSIONS ====================
  // syncAssociativeDimensions REMOVED - now handled by TRá»¤C Sá»NG in CadDocument.commitEntitiesGeometryChange()
  // handleEntityDeleted REMOVED - now handled by CadDocument.handleEntityDeleted()

  // ============================================
  // STYLE
  // ============================================

  const setStyle = useCallback((newStyle: Partial<DimensionStyle>) => {
    setStyleState((prev) => {
      const updated = { ...prev, ...newStyle };
      managerRef.current.setStyle(updated);
      return updated;
    });
  }, []);

  // ============================================
  // RENDER
  // ============================================

  const renderDimensions = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      viewTransform: { offsetX: number; offsetY: number; scale: number },
    ) => {
      const manager = managerRef.current;

      // Render all dimensions
      dimensions.forEach((dim) => {
        manager.renderDimension(ctx, dim, viewTransform);
      });

      // Render single preview
      if (previewDimension) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        manager.renderDimension(ctx, previewDimension, viewTransform);
        ctx.restore();
      }

      // Render QDIM preview dimensions (nhiá»u dimensions)
      if (previewDimensions.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        previewDimensions.forEach((dim) => {
          manager.renderDimension(ctx, dim, viewTransform);
        });
        ctx.restore();
      }
    },
    [dimensions, previewDimension, previewDimensions],
  );

  return {
    dimensions,
    toolState,
    style,
    startDimensionTool,
    cancelDimensionTool,
    setDirection,
    toggleAutoSelectMode,
    handleClick,
    handleMove,
    startContinueMode,
    startBaselineMode,
    exitChainMode,
    addDimension,
    removeDimension,
    updateDimension,
    clearDimensions,
    // Associative Dimensions - ALL REMOVED (TRá»¤C Sá»NG handles everything)
    // syncAssociativeDimensions: removed
    // handleEntityDeleted: removed (use CadDocument.handleEntityDeleted instead)
    setStyle,
    renderDimensions,
    previewDimension,
    // QDIM
    startQdim,
    setQdimEntities,
    setQdimMode,
    confirmQdim,
    previewDimensions,
  };
}
