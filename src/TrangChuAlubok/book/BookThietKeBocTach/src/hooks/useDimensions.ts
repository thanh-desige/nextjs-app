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
  BatchAddDimensionCommand,
  BatchDeleteDimensionCommand,
} from "../core/commands/dimension/DimensionCommands";

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
  step: number; // 0: chưa bắt đầu, 1: đã chọn điểm 1, 2: đã chọn điểm 2, 3: đang kéo offset
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
    lineInfo?: { point1: Point; point2: Point; entityId: string }
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

  // Style
  setStyle: (style: Partial<DimensionStyle>) => void;

  // Render
  renderDimensions: (
    ctx: CanvasRenderingContext2D,
    viewTransform: { offsetX: number; offsetY: number; scale: number }
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
};

export function useDimensions(): UseDimensionsReturn {
  const managerRef = useRef(new DimensionManager());

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
    if (!doc) {
      console.log("[useDimensions] No document!");
      return [];
    }
    const dims = doc.getAllDimensions();
    console.log(
      "[useDimensions] Got dimensions from doc:",
      dims.length,
      dims.map((d) => d.dimensionType)
    );
    return dims;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDocument, updateCounter, documentVersion]);

  // Helper to refresh dimensions after changes
  const refreshDimensions = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  // ĐIỀU KIỆN 1: Helper để thêm dimension qua Command
  const addDimensionInternal = useCallback(
    (dimension: DimensionEntity) => {
      console.log(
        "[addDimensionInternal] Adding dimension:",
        dimension.id,
        dimension.dimensionType
      );
      const command = new AddDimensionCommand(dimension);
      const result = executeCommandObject(command);
      console.log("[addDimensionInternal] Command result:", result);
      if (result?.success) {
        console.log("[addDimensionInternal] Success, refreshing dimensions");
        refreshDimensions();
      } else {
        console.log("[addDimensionInternal] FAILED!");
      }
    },
    [executeCommandObject, refreshDimensions]
  );

  const [style, setStyleState] = useState<DimensionStyle>(
    DEFAULT_DIMENSION_STYLE
  );
  const [previewDimension, setPreviewDimension] =
    useState<DimensionEntity | null>(null);

  // QDIM preview (nhiều dimensions)
  const [previewDimensions, setPreviewDimensions] = useState<DimensionEntity[]>(
    []
  );

  const [toolState, setToolState] =
    useState<DimensionToolState>(initialToolState);

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
      // Nếu đang ở step 2 (kéo offset), cập nhật preview ngay
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
  // CONTINUE / BASELINE MODE
  // ============================================

  const startContinueMode = useCallback(
    (fromDimension?: DimensionEntity): boolean => {
      const lastDim = fromDimension || dimensions[dimensions.length - 1];
      if (!lastDim) {
        // No previous dimension to continue from
        return false;
      }

      // Tính vị trí tuyệt đối của dim line từ dimension gốc
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
        point1: lastDim.point2, // Start from end point of last dimension
        direction: direction,
        offset: lastDim.offset,
        dimLinePosition: dimLinePos, // Lưu vị trí tuyệt đối của dim line
      }));
      return true;
    },
    [dimensions]
  );

  const startBaselineMode = useCallback(
    (fromDimension?: DimensionEntity): boolean => {
      const lastDim = fromDimension || dimensions[dimensions.length - 1];
      if (!lastDim) {
        // No previous dimension to use as baseline
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
        point1: lastDim.point1, // Keep same base point
        direction: lastDim.direction || "auto",
        offset: lastDim.offset,
      }));
      return true;
    },
    [dimensions]
  );

  const exitChainMode = useCallback(() => {
    setToolState((prev) => ({
      ...prev,
      isContinueMode: false,
      isBaselineMode: false,
      lastDimension: null,
    }));
  }, []);

  // ============================================
  // CLICK HANDLING
  // ============================================

  const handleClick = useCallback(
    (
      point: Point,
      entityRef?: EntityReference,
      circleInfo?: { center: Point; radius: number; entityId: string },
      lineInfo?: { point1: Point; point2: Point; entityId: string }
    ): DimensionEntity | null => {
      if (!toolState.isActive) return null;

      const manager = managerRef.current;

      switch (toolState.dimensionType) {
        // DLI - Linear: Tự động ngang/dọc theo góc 2 điểm
        case "linear": {
          // One-click mode: Chỉ khi autoSelectMode = true VÀ có lineInfo
          if (toolState.autoSelectMode && lineInfo && toolState.step === 0) {
            console.log("[DLI] One-click mode: Line detected!", lineInfo);
            const autoDirection = manager.autoDetectLinearDirection(
              lineInfo.point1,
              lineInfo.point2
            );
            setToolState((prev) => ({
              ...prev,
              step: 2, // Skip to step 2 - wait for offset position
              point1: lineInfo.point1,
              point2: lineInfo.point2,
              ref1: {
                entityId: lineInfo.entityId,
                entityType: "line",
                snapType: "endpoint",
                point: lineInfo.point1,
              },
              ref2: {
                entityId: lineInfo.entityId,
                entityType: "line",
                snapType: "endpoint",
                point: lineInfo.point2,
              },
              direction: autoDirection,
            }));
            return null;
          }

          if (toolState.step === 0) {
            // Chọn điểm đầu
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: entityRef || null,
            }));
            return null;
          } else if (toolState.step === 1) {
            // Chọn điểm cuối - tự động xác định hướng
            const autoDirection = manager.autoDetectLinearDirection(
              toolState.point1!,
              point
            );
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
              ref2: entityRef || null,
              direction: autoDirection, // Tự động set horizontal/vertical
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            // Xác nhận offset - tạo dimension
            // DLI luôn là horizontal hoặc vertical, KHÔNG aligned
            const direction =
              toolState.direction === "auto"
                ? manager.autoDetectLinearDirection(
                    toolState.point1,
                    toolState.point2
                  )
                : (toolState.direction as "horizontal" | "vertical");

            console.log(
              "[DLI] Creating dimension with direction:",
              direction,
              "toolState.direction:",
              toolState.direction
            );

            const dimension = manager.createLinearDimension({
              point1: toolState.point1,
              point2: toolState.point2,
              offset: toolState.offset,
              direction,
              ref1: toolState.ref1 || undefined,
              ref2: toolState.ref2 || undefined,
            });

            console.log(
              "[DLI] Created dimension:",
              dimension.dimensionType,
              dimension.direction
            );

            addDimensionInternal(dimension);

            // Reset để vẽ tiếp
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
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: entityRef || null,
              direction: "horizontal", // Luôn là horizontal
            }));
            return null;
          } else if (toolState.step === 1) {
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
              ref2: entityRef || null,
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            const dimension = manager.createLinearDimension({
              point1: toolState.point1,
              point2: toolState.point2,
              offset: toolState.offset,
              direction: "horizontal", // Cưỡng ép horizontal
              ref1: toolState.ref1 || undefined,
              ref2: toolState.ref2 || undefined,
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
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: entityRef || null,
              direction: "vertical", // Luôn là vertical
            }));
            return null;
          } else if (toolState.step === 1) {
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
              ref2: entityRef || null,
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            const dimension = manager.createLinearDimension({
              point1: toolState.point1,
              point2: toolState.point2,
              offset: toolState.offset,
              direction: "vertical", // Cưỡng ép vertical
              ref1: toolState.ref1 || undefined,
              ref2: toolState.ref2 || undefined,
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
          // One-click mode: Chỉ khi autoSelectMode = true VÀ có lineInfo
          if (toolState.autoSelectMode && lineInfo && toolState.step === 0) {
            console.log("[DAL] One-click mode: Line detected!", lineInfo);
            setToolState((prev) => ({
              ...prev,
              step: 2, // Skip to step 2 - wait for offset position
              point1: lineInfo.point1,
              point2: lineInfo.point2,
              ref1: {
                entityId: lineInfo.entityId,
                entityType: "line",
                snapType: "endpoint",
                point: lineInfo.point1,
              },
              ref2: {
                entityId: lineInfo.entityId,
                entityType: "line",
                snapType: "endpoint",
                point: lineInfo.point2,
              },
              direction: "aligned",
            }));
            return null;
          }

          if (toolState.step === 0) {
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: entityRef || null,
              direction: "aligned", // Luôn là aligned
            }));
            return null;
          } else if (toolState.step === 1) {
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
              ref2: entityRef || null,
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            const dimension = manager.createLinearDimension({
              point1: toolState.point1,
              point2: toolState.point2,
              offset: toolState.offset,
              direction: "aligned", // Song song với cạnh
              ref1: toolState.ref1 || undefined,
              ref2: toolState.ref2 || undefined,
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
            // No previous dimension, start fresh
            return null;
          }

          // Create continue dimension từ điểm cuối của dim trước
          // Với dimLinePosition cố định để tất cả dim nằm trên cùng 1 đường
          const continueDim = manager.createContinueDimension(
            toolState.lastDimension,
            point,
            toolState.dimLinePosition // Truyền vị trí cố định của dim line
          );

          addDimensionInternal(continueDim);

          // Update last dimension for next continue (giữ nguyên dimLinePosition)
          setToolState((prev) => ({
            ...prev,
            lastDimension: continueDim,
            point1: continueDim.point2, // Update point1 cho lần click tiếp theo
          }));
          setPreviewDimension(null);

          return continueDim;
        }

        // Baseline dimension mode
        case "baseline": {
          if (!toolState.lastDimension) {
            return null;
          }

          // Create baseline dimension from base point to new point
          const baselineDim = manager.createBaselineDimension(
            toolState.lastDimension,
            point,
            15 // offset increment
          );

          addDimensionInternal(baselineDim);

          // Update last dimension for next baseline (keep increasing offset)
          setToolState((prev) => ({
            ...prev,
            lastDimension: baselineDim,
          }));
          setPreviewDimension(null);

          return baselineDim;
        }

        case "angular": {
          if (toolState.step === 0) {
            // Chọn tâm góc
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point,
              ref1: entityRef || null,
            }));
            return null;
          } else if (toolState.step === 1) {
            // Chọn cạnh 1
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point,
            }));
            return null;
          } else if (toolState.step === 2) {
            // Chọn cạnh 2
            setToolState((prev) => ({
              ...prev,
              step: 3,
              point3: point,
            }));
            return null;
          } else if (
            toolState.step === 3 &&
            toolState.point1 &&
            toolState.point2 &&
            toolState.point3
          ) {
            // Xác nhận
            const dimension = manager.createAngularDimension({
              center: toolState.point1,
              point1: toolState.point2,
              point2: toolState.point3,
              offset: toolState.offset,
            });

            addDimensionInternal(dimension);

            setToolState((prev) => ({
              ...prev,
              step: 0,
              point1: null,
              point2: null,
              point3: null,
            }));
            setPreviewDimension(null);

            return dimension;
          }
          break;
        }

        case "radius":
        case "diameter": {
          // If circleInfo is provided (clicked on circle edge or center), use it directly
          if (circleInfo) {
            console.log("[DRA] Circle detected!", circleInfo);

            const center = circleInfo.center;
            const radius = circleInfo.radius;
            // Tính angle từ tâm đến điểm click để xác định hướng leader
            const angle = Math.atan2(point.y - center.y, point.x - center.x);

            const dimension =
              toolState.dimensionType === "radius"
                ? manager.createRadiusDimension({
                    center,
                    radius,
                    angle,
                  })
                : manager.createDiameterDimension(center, radius, angle);

            console.log("[DRA] Created dimension:", dimension);
            addDimensionInternal(dimension);
            console.log("[DRA] Added dimension to document");

            // Reset state
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

          // Manual mode (no circle detected): Chọn tâm và điểm trên circle
          if (toolState.step === 0) {
            console.log("[DRA] Manual mode: Select center");
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point, // Tâm thủ công
            }));
            return null;
          } else if (toolState.step === 1) {
            // Step 1: Đã chọn tâm, giờ chọn điểm trên circle
            if (toolState.point1) {
              console.log(
                "[DRA] Manual mode step 1: Select point on circle",
                point
              );
              const radius = manager.calculateDistance(toolState.point1, point);
              const angle = Math.atan2(
                point.y - toolState.point1.y,
                point.x - toolState.point1.x
              );
              console.log("[DRA] Radius:", radius, "Angle:", angle);

              const dimension =
                toolState.dimensionType === "radius"
                  ? manager.createRadiusDimension({
                      center: toolState.point1,
                      radius,
                      angle,
                    })
                  : manager.createDiameterDimension(
                      toolState.point1,
                      radius,
                      angle
                    );

              console.log("[DRA] Created dimension:", dimension);
              addDimensionInternal(dimension);
              console.log("[DRA] Added dimension to document");

              setToolState((prev) => ({
                ...prev,
                step: 0,
                point1: null,
                point2: null,
              }));
              setPreviewDimension(null);

              return dimension;
            }
          }
          break;
        }

        // DAR - Arc dimension: Đo chiều dài cung
        case "arc": {
          if (toolState.step === 0) {
            // Step 1: Chọn tâm cung
            setToolState((prev) => ({
              ...prev,
              step: 1,
              point1: point, // center
              ref1: entityRef || null,
            }));
            return null;
          } else if (toolState.step === 1 && toolState.point1) {
            // Step 2: Chọn điểm bắt đầu cung (xác định radius và startAngle)
            setToolState((prev) => ({
              ...prev,
              step: 2,
              point2: point, // start point
              ref2: entityRef || null,
            }));
            return null;
          } else if (
            toolState.step === 2 &&
            toolState.point1 &&
            toolState.point2
          ) {
            // Step 3: Chọn điểm kết thúc cung (xác định endAngle)
            setToolState((prev) => ({
              ...prev,
              step: 3,
              point3: point, // end point
              offset: toolState.offset || 20, // Default offset for dim line
            }));
            return null;
          } else if (
            toolState.step === 3 &&
            toolState.point1 &&
            toolState.point2 &&
            toolState.point3
          ) {
            // Step 4: Xác nhận offset - tạo arc dimension
            const center = toolState.point1;
            const startPoint = toolState.point2;
            const endPoint = toolState.point3;

            const radius = manager.calculateDistance(center, startPoint);
            const startAngle = Math.atan2(
              startPoint.y - center.y,
              startPoint.x - center.x
            );
            const endAngle = Math.atan2(
              endPoint.y - center.y,
              endPoint.x - center.x
            );

            const dimension = manager.createArcDimension({
              center,
              radius,
              startAngle,
              endAngle,
              offset: toolState.offset,
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
    [toolState, addDimensionInternal]
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

        // Xác định hướng dựa trên vị trí chuột
        const direction = manager.detectQdimDirection(qdimPoints, point);

        // dimLinePosition = vị trí Y (horizontal) hoặc X (vertical) của dim line
        // Đó chính là vị trí chuột hiện tại
        const dimLinePosition = direction === "horizontal" ? point.y : point.x;

        // Tạo preview dimensions
        let previewDims: DimensionEntity[] = [];
        switch (qdimMode) {
          case "continuous":
            previewDims = manager.createQdimContinuous(
              qdimPoints,
              dimLinePosition,
              direction
            );
            break;
          case "baseline":
            previewDims = manager.createQdimBaseline(
              qdimPoints,
              dimLinePosition,
              15,
              direction
            );
            break;
          case "staggered":
            previewDims = manager.createQdimStaggered(
              qdimPoints,
              dimLinePosition,
              10,
              direction
            );
            break;
          default:
            previewDims = manager.createQdimContinuous(
              qdimPoints,
              dimLinePosition,
              direction
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
          toolState.dimLinePosition // Sử dụng dimLinePosition cố định từ dimension gốc
        );
        setPreviewDimension(preview);
        return;
      }

      // DBA - Baseline preview
      if (toolState.dimensionType === "baseline" && toolState.lastDimension) {
        const preview = manager.createBaselineDimension(
          toolState.lastDimension,
          point,
          15
        );
        setPreviewDimension(preview);
        return;
      }

      // DLI - Linear (tự động ngang/dọc)
      // Hướng được xác định từ góc 2 điểm, offset theo hướng chuột di chuyển
      if (toolState.dimensionType === "linear") {
        if (toolState.step === 1 && toolState.point1) {
          // Step 1: Đang chọn điểm 2 - preview với hướng tự động
          const autoDirection = manager.autoDetectLinearDirection(
            toolState.point1,
            point
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
          // Step 2: Đang kéo offset - hướng dim theo vị trí chuột (như AutoCAD)
          // Kéo lên/xuống → horizontal, kéo trái/phải → vertical
          const direction = manager.detectDirectionFromOffset(
            toolState.point1,
            toolState.point2,
            point
          );

          // Tính offset - dim line nhảy về phía chuột đang ở
          const offset = manager.calculateOffsetFromMouse(
            toolState.point1,
            toolState.point2,
            point,
            direction
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
          // Sử dụng calculateOffsetFromMouse để đảm bảo nhất quán
          const offset = manager.calculateOffsetFromMouse(
            toolState.point1,
            toolState.point2,
            point,
            "horizontal"
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
          // Sử dụng calculateOffsetFromMouse để đảm bảo nhất quán
          const offset = manager.calculateOffsetFromMouse(
            toolState.point1,
            toolState.point2,
            point,
            "vertical"
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
          // Offset vuông góc với đường
          const offset = manager.calculateOffsetFromMouse(
            toolState.point1,
            toolState.point2,
            point,
            "aligned"
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
          point.x - toolState.point1.x
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
          // Step 1: Đang chọn điểm bắt đầu cung - hiển thị radius
          const radius = manager.calculateDistance(toolState.point1, point);
          const startAngle = Math.atan2(
            point.y - toolState.point1.y,
            point.x - toolState.point1.x
          );
          // Preview với endAngle = startAngle (chỉ là 1 điểm)
          const preview = manager.createArcDimension({
            center: toolState.point1,
            radius,
            startAngle,
            endAngle: startAngle + 0.1, // Small arc for preview
            offset: 20,
          });
          setPreviewDimension(preview);
        } else if (
          toolState.step === 2 &&
          toolState.point1 &&
          toolState.point2
        ) {
          // Step 2: Đang chọn điểm kết thúc cung
          const center = toolState.point1;
          const startPoint = toolState.point2;
          const radius = manager.calculateDistance(center, startPoint);
          const startAngle = Math.atan2(
            startPoint.y - center.y,
            startPoint.x - center.x
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
          // Step 3: Đang kéo offset
          const center = toolState.point1;
          const startPoint = toolState.point2;
          const endPoint = toolState.point3;
          const radius = manager.calculateDistance(center, startPoint);
          const startAngle = Math.atan2(
            startPoint.y - center.y,
            startPoint.x - center.x
          );
          const endAngle = Math.atan2(
            endPoint.y - center.y,
            endPoint.x - center.x
          );

          // Calculate offset from mouse position
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
          point.x - toolState.point1.x
        );
        const preview = manager.createDiameterDimension(
          toolState.point1,
          radius,
          angle
        );
        setPreviewDimension(preview);
      }
    },
    [toolState]
  );

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
  // QDIM - QUICK DIMENSION
  // ============================================

  /**
   * Bắt đầu QDIM tool
   */
  const startQdim = useCallback(() => {
    setToolState({
      ...initialToolState,
      isActive: true,
      dimensionType: "qdim",
      step: 0, // Step 0: Chờ chọn objects
    });
    setPreviewDimension(null);
    setPreviewDimensions([]);
  }, []);

  /**
   * Đặt danh sách entities đã chọn cho QDIM
   * Khi entities được chọn, tự động extract points
   */
  const setQdimEntities = useCallback((entities: QdimEntity[]) => {
    const manager = managerRef.current;
    const points = manager.extractPointsFromEntities(entities);

    setToolState((prev) => ({
      ...prev,
      qdimSelectedEntities: entities,
      qdimPoints: points,
      step: points.length >= 2 ? 1 : 0, // Step 1: Đã có đủ điểm, chờ kéo offset
    }));
  }, []);

  /**
   * Đổi mode của QDIM (continuous, baseline, staggered)
   */
  const setQdimMode = useCallback((mode: QdimMode) => {
    setToolState((prev) => ({
      ...prev,
      qdimMode: mode,
    }));
  }, []);

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

    // Nếu không có dimLinePosition (chưa di chuyển chuột), dùng giá trị mặc định
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
          dir
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
    setToolState(initialToolState);
    setPreviewDimension(null);
    setPreviewDimensions([]);

    return newDimensions;
  }, [toolState, executeCommandObject, refreshDimensions]);

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

      // Render QDIM preview dimensions (nhiều dimensions)
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
