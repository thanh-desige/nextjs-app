/**
 * useDimensionCommands Hook
 *
 * Hook wrapper kết nối các Dimension Command classes với UI
 * Giữ interface tương thích với useDimensions để dễ dàng chuyển đổi
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi dimension phải đi qua CadDocument + Commands
 *
 * Architecture:
 * - Mỗi tool (DLI, DAL, QDIM...) là một Command class riêng
 * - Hook này quản lý active command và điều phối events
 * - Command classes xử lý logic tạo dimension
 * - DimensionManager xử lý render
 *
 * ASSOCIATIVE DIMENSIONS:
 * - Snap results are captured when user clicks with OSNAP
 * - Entity references are stored in dimension for auto-update
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
import { OsnapResult } from "../core/osnap/Osnap.types";
import { useEngineStore } from "../store/engineStore";
import {
  AddDimensionCommand,
  UpdateDimensionCommand,
  DeleteDimensionCommand,
  BatchAddDimensionCommand,
  BatchDeleteDimensionCommand,
} from "../core/commands/dimension/DimensionCommands";

// Import Command classes
import { DimLinearCommand } from "../core/commands/dimension/dimlinear";
import { DimAlignedCommand } from "../core/commands/dimension/dimaligned";
import { QdimCommand, QdimEntity } from "../core/commands/dimension/qdim";

// ============================================
// TYPES
// ============================================

export interface DimensionCommandState {
  isActive: boolean;
  dimensionType: DimensionType;
  step: number;
  points: Point[];
  /** OSNAP results for each point (for associative dimensions) */
  snapResults: (OsnapResult | null)[];
  direction: DimensionDirection;
  // Continue/Baseline mode
  lastDimension: DimensionEntity | null;
  isContinueMode: boolean;
  isBaselineMode: boolean;
}

export interface UseDimensionCommandsReturn {
  // State
  dimensions: DimensionEntity[];
  toolState: DimensionCommandState;
  style: DimensionStyle;
  previewDimension: DimensionEntity | null;
  previewDimensions: DimensionEntity[];

  // Tool control
  startDimensionTool: (type: DimensionType) => void;
  cancelDimensionTool: () => void;
  setDirection: (dir: DimensionDirection) => void;

  // Drawing
  handleClick: (
    point: Point,
    entityRef?: EntityReference,
    snapResult?: OsnapResult | null
  ) => DimensionEntity | null;
  handleMove: (point: Point) => void;

  // Continue/Baseline (delegated to useDimensions for now)
  startContinueMode: (fromDimension?: DimensionEntity) => void;
  startBaselineMode: (fromDimension?: DimensionEntity) => void;
  exitChainMode: () => void;

  // CRUD
  addDimension: (dimension: DimensionEntity) => void;
  removeDimension: (id: string) => void;
  updateDimension: (id: string, updates: Partial<DimensionEntity>) => void;
  clearDimensions: () => void;

  // Style
  setStyle: (style: Partial<DimensionStyle>) => void;

  // Render
  renderDimensions: (
    ctx: CanvasRenderingContext2D,
    viewTransform: { offsetX: number; offsetY: number; scale: number }
  ) => void;

  // QDIM
  startQdim: () => void;
  setQdimEntities: (entities: QdimEntity[]) => void;
  setQdimMode: (mode: QdimMode) => void;
  confirmQdim: () => DimensionEntity[];
}

// ============================================
// INITIAL STATE
// ============================================

const initialCommandState: DimensionCommandState = {
  isActive: false,
  dimensionType: "linear",
  step: 0,
  points: [],
  snapResults: [],
  direction: "auto",
  lastDimension: null,
  isContinueMode: false,
  isBaselineMode: false,
};

// ============================================
// HOOK
// ============================================

export function useDimensionCommands(): UseDimensionCommandsReturn {
  // Refs for managers and commands
  const managerRef = useRef(new DimensionManager());
  const linearCommandRef = useRef<DimLinearCommand | null>(null);
  const alignedCommandRef = useRef<DimAlignedCommand | null>(null);
  const qdimCommandRef = useRef<QdimCommand | null>(null);

  // ĐIỀU KIỆN 1: Get dimensions from CadDocument qua store
  const getDocument = useEngineStore((state) => state.getDocument);
  const executeCommandObject = useEngineStore(
    (state) => state.executeCommandObject
  );

  // documentVersion: increments on every command/undo/redo to trigger re-render
  const documentVersion = useEngineStore((state) => state.documentVersion);

  // Trigger re-render khi document thay đổi
  const [updateCounter, forceUpdate] = useState(0);

  // Get dimensions from document
  // Use documentVersion as dependency to re-render after undo/redo
  const dimensions = useMemo(() => {
    const doc = getDocument();
    if (!doc) return [];
    return doc.getAllDimensions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDocument, updateCounter, documentVersion]);

  // Helper to refresh dimensions after changes
  const refreshDimensions = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const [style, setStyleState] = useState<DimensionStyle>(
    DEFAULT_DIMENSION_STYLE
  );
  const [previewDimension, setPreviewDimension] =
    useState<DimensionEntity | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<DimensionEntity[]>(
    []
  );
  const [commandState, setCommandState] =
    useState<DimensionCommandState>(initialCommandState);

  // ============================================
  // TOOL CONTROL
  // ============================================

  const startDimensionTool = useCallback((type: DimensionType) => {
    // Reset previous command
    linearCommandRef.current?.reset();
    alignedCommandRef.current?.reset();
    qdimCommandRef.current?.reset();

    // Create new command instance based on type
    switch (type) {
      case "linear":
        linearCommandRef.current = new DimLinearCommand();
        break;
      case "aligned":
        alignedCommandRef.current = new DimAlignedCommand();
        break;
      case "qdim":
        qdimCommandRef.current = new QdimCommand();
        break;
    }

    setCommandState({
      ...initialCommandState,
      isActive: true,
      dimensionType: type,
    });
    setPreviewDimension(null);
    setPreviewDimensions([]);
  }, []);

  const cancelDimensionTool = useCallback(() => {
    linearCommandRef.current?.reset();
    alignedCommandRef.current?.reset();
    qdimCommandRef.current?.reset();

    setCommandState(initialCommandState);
    setPreviewDimension(null);
    setPreviewDimensions([]);
  }, []);

  const setDirection = useCallback((dir: DimensionDirection) => {
    setCommandState((prev) => ({ ...prev, direction: dir }));
  }, []);

  // ============================================
  // CLICK HANDLING
  // ============================================

  const handleClick = useCallback(
    (
      point: Point,
      _entityRef?: EntityReference,
      snapResult?: OsnapResult | null
    ): DimensionEntity | null => {
      if (!commandState.isActive) return null;

      const { dimensionType, points, snapResults } = commandState;

      // DLI - Linear
      if (dimensionType === "linear" && linearCommandRef.current) {
        const newPoints = [...points, point];
        const newSnapResults = [...snapResults, snapResult || null];

        if (newPoints.length < 3) {
          // Collecting points - store snap result for later
          setCommandState((prev) => ({
            ...prev,
            step: newPoints.length,
            points: newPoints,
            snapResults: newSnapResults,
          }));
          return null;
        }

        // Execute command with 3 points + snap results
        const context = {
          engine: null as never, // Not used by DimLinearCommand
          points: newPoints.map((p) => ({ x: p.x, y: p.y })),
          options: {},
          style: {} as never,
          layerId: "",
          snapResults: newSnapResults, // Pass snap results for associative dimensions
        };

        const result = linearCommandRef.current.execute(context);
        if (result.success && result.data) {
          const dimension = (result.data as { dimension: DimensionEntity })
            .dimension;
          // Use Command to add dimension (ĐIỀU KIỆN 1: UI → CadEngine → Document → History)
          const addCmd = new AddDimensionCommand(dimension);
          executeCommandObject(addCmd);
          refreshDimensions();

          // Reset for next dimension
          setCommandState((prev) => ({
            ...prev,
            step: 0,
            points: [],
            snapResults: [],
            lastDimension: dimension,
          }));
          setPreviewDimension(null);

          return dimension;
        }
      }

      // DAL - Aligned
      if (dimensionType === "aligned" && alignedCommandRef.current) {
        const newPoints = [...points, point];
        const newSnapResults = [...snapResults, snapResult || null];

        if (newPoints.length < 3) {
          setCommandState((prev) => ({
            ...prev,
            step: newPoints.length,
            points: newPoints,
            snapResults: newSnapResults,
          }));
          return null;
        }

        const context = {
          engine: null as never,
          points: newPoints.map((p) => ({ x: p.x, y: p.y })),
          options: {},
          style: {} as never,
          layerId: "",
          snapResults: newSnapResults,
        };

        const result = alignedCommandRef.current.execute(context);
        if (result.success && result.data) {
          const dimension = (result.data as { dimension: DimensionEntity })
            .dimension;
          // Use Command to add dimension (ĐIỀU KIỆN 1: UI → CadEngine → Document → History)
          const addCmd = new AddDimensionCommand(dimension);
          executeCommandObject(addCmd);
          refreshDimensions();

          setCommandState((prev) => ({
            ...prev,
            step: 0,
            points: [],
            snapResults: [],
            lastDimension: dimension,
          }));
          setPreviewDimension(null);

          return dimension;
        }
      }

      // QDIM - Quick Dimension (step 1: confirm position)
      if (dimensionType === "qdim" && qdimCommandRef.current) {
        const qdimCommand = qdimCommandRef.current;

        if (qdimCommand.getStep() === 1) {
          // Confirm and create dimensions
          const context = {
            engine: null as never,
            points: [point],
            options: {},
            style: {} as never,
            layerId: "",
          };

          const result = qdimCommand.execute(context);
          if (result.success && result.data) {
            const newDimensions = (
              result.data as { dimensions: DimensionEntity[] }
            ).dimensions;
            // Use Command to add dimensions (ĐIỀU KIỆN 1: UI → CadEngine → Document → History)
            const batchCmd = new BatchAddDimensionCommand(newDimensions);
            executeCommandObject(batchCmd);
            refreshDimensions();
          }

          // Reset
          setCommandState(initialCommandState);
          setPreviewDimension(null);
          setPreviewDimensions([]);
        }
      }

      return null;
    },
    [commandState, executeCommandObject, refreshDimensions]
  );

  // ============================================
  // MOUSE MOVE HANDLING
  // ============================================

  const handleMove = useCallback(
    (point: Point) => {
      if (!commandState.isActive) return;

      const { dimensionType, points } = commandState;

      // DLI - Linear preview
      if (dimensionType === "linear" && linearCommandRef.current) {
        const context = {
          engine: null as never,
          points: points.map((p) => ({ x: p.x, y: p.y })),
          options: {},
          style: {} as never,
          layerId: "",
        };

        const preview = linearCommandRef.current.createPreview(context, point);
        setPreviewDimension(preview);
        return;
      }

      // DAL - Aligned preview
      if (dimensionType === "aligned" && alignedCommandRef.current) {
        const context = {
          engine: null as never,
          points: points.map((p) => ({ x: p.x, y: p.y })),
          options: {},
          style: {} as never,
          layerId: "",
        };

        const preview = alignedCommandRef.current.createPreview(context, point);
        setPreviewDimension(preview);
        return;
      }

      // QDIM preview
      if (dimensionType === "qdim" && qdimCommandRef.current) {
        const qdimCommand = qdimCommandRef.current;
        if (qdimCommand.getStep() === 1) {
          const previews = qdimCommand.createPreviewDimensions(point);
          setPreviewDimensions(previews);
        }
        return;
      }
    },
    [commandState]
  );

  // ============================================
  // CONTINUE / BASELINE (TODO: Implement with commands)
  // ============================================

  const startContinueMode = useCallback((_fromDimension?: DimensionEntity) => {
    // TODO: Implement using DimContinueCommand
    console.log("Continue mode not yet implemented in command pattern");
  }, []);

  const startBaselineMode = useCallback((_fromDimension?: DimensionEntity) => {
    // TODO: Implement using baseline command
    console.log("Baseline mode not yet implemented in command pattern");
  }, []);

  const exitChainMode = useCallback(() => {
    setCommandState((prev) => ({
      ...prev,
      isContinueMode: false,
      isBaselineMode: false,
      lastDimension: null,
    }));
  }, []);

  // ============================================
  // QDIM
  // ============================================

  const startQdim = useCallback(() => {
    qdimCommandRef.current = new QdimCommand();

    setCommandState({
      ...initialCommandState,
      isActive: true,
      dimensionType: "qdim",
      step: 0,
    });
    setPreviewDimension(null);
    setPreviewDimensions([]);
  }, []);

  const setQdimEntities = useCallback((entities: QdimEntity[]) => {
    if (qdimCommandRef.current) {
      qdimCommandRef.current.setSelectedEntities(entities);

      // Update step if we have enough points
      setCommandState((prev) => ({
        ...prev,
        step: entities.length >= 1 ? 1 : 0,
      }));
    }
  }, []);

  const setQdimMode = useCallback((mode: QdimMode) => {
    if (qdimCommandRef.current) {
      qdimCommandRef.current.setMode(mode);
    }
  }, []);

  const confirmQdim = useCallback((): DimensionEntity[] => {
    if (!qdimCommandRef.current) return [];

    // Confirm selection first (transition to step 1)
    if (qdimCommandRef.current.getStep() === 0) {
      const success = qdimCommandRef.current.confirmSelection();
      if (success) {
        setCommandState((prev) => ({ ...prev, step: 1 }));
      }
      return [];
    }

    // Already at step 1, get created dimensions
    const dims = qdimCommandRef.current.getCreatedDimensions();
    if (dims.length > 0) {
      // ĐIỀU KIỆN 1: Use Commands to add dimensions
      for (const dim of dims) {
        const command = new AddDimensionCommand(dim);
        executeCommandObject(command);
      }
      refreshDimensions();
    }

    // Reset
    setCommandState(initialCommandState);
    setPreviewDimension(null);
    setPreviewDimensions([]);

    return dims;
  }, [executeCommandObject, refreshDimensions]);

  // ============================================
  // CRUD OPERATIONS - ĐIỀU KIỆN 1: Qua Commands + Document
  // ============================================

  const addDimension = useCallback(
    (dimension: DimensionEntity) => {
      const command = new AddDimensionCommand(dimension);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      }
    },
    [executeCommandObject, refreshDimensions]
  );

  const removeDimension = useCallback(
    (id: string) => {
      const command = new DeleteDimensionCommand(id);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      }
    },
    [executeCommandObject, refreshDimensions]
  );

  const updateDimension = useCallback(
    (id: string, updates: Partial<DimensionEntity>) => {
      const command = new UpdateDimensionCommand(id, updates);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      }
    },
    [executeCommandObject, refreshDimensions]
  );

  const clearDimensions = useCallback(() => {
    const allIds = dimensions.map((d) => d.id);
    if (allIds.length > 0) {
      const command = new BatchDeleteDimensionCommand(allIds);
      const result = executeCommandObject(command);
      if (result?.success) {
        refreshDimensions();
      }
    }
  }, [dimensions, executeCommandObject, refreshDimensions]);

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
      viewTransform: { offsetX: number; offsetY: number; scale: number }
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

      // Render QDIM preview dimensions
      if (previewDimensions.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        previewDimensions.forEach((dim) => {
          manager.renderDimension(ctx, dim, viewTransform);
        });
        ctx.restore();
      }
    },
    [dimensions, previewDimension, previewDimensions]
  );

  // ============================================
  // RETURN - Compatible interface with useDimensions
  // ============================================

  return {
    dimensions,
    toolState: commandState,
    style,
    previewDimension,
    previewDimensions,

    startDimensionTool,
    cancelDimensionTool,
    setDirection,

    handleClick,
    handleMove,

    startContinueMode,
    startBaselineMode,
    exitChainMode,

    addDimension,
    removeDimension,
    updateDimension,
    clearDimensions,

    setStyle,
    renderDimensions,

    // QDIM
    startQdim,
    setQdimEntities,
    setQdimMode,
    confirmQdim,
  };
}
