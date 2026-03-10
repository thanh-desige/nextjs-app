/**
 * useCanvasEventHandlers.ts — Inline JSX callbacks extracted from BookThietKeBocTachPage
 *
 * STEP-5.26: Contains paste logic, CadDrawingCanvas inline callbacks,
 * controlled-mode props computation, and ProjectInfoDropdown handler.
 */

"use client";

import { useCallback, useMemo } from "react";
import type { CadEntity, Point } from "../ui";
import { ClipboardManager } from "../core/clipboard";
import { AddDoorCommand } from "../core/commands/door/DoorCommands";
import type { DoorVariant } from "../core/entities/DoorEntity";
import { useEngineStore, useProjectStore } from "../store";
import type { ProjectInfoData } from "../ui/components/ProjectInfoDropdown";

// Mirror the constant from BookThietKeBocTachPage
const USE_CONTROLLED_MODE = true;

// ==================== Types ====================

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface UseCanvasEventHandlersParams {
  // Paste mode
  isPasteMode: boolean;

  // Document operations (useCanvasEntities)
  documentEntities: any[];
  documentSelectedIds: string[];
  addDocumentEntity: (entity: any) => void;
  deleteDocumentEntities: (ids: string[]) => void;
  moveDocumentEntities: (ids: string[], dx: number, dy: number) => void;
  selectDocumentEntities: (ids: string[], additive: boolean) => void;
  documentUndo: () => void;
  documentRedo: () => void;

  // Legacy mode
  setLegacyCanvasEntities: (entities: CadEntity[]) => void;
  setLegacyCanvasSelectedIds: (ids: string[]) => void;

  // Commands
  executeCommandObject: (cmd: any) => void;
  addNotification: (n: {
    type: string;
    title: string;
    message: string;
    duration: number;
  }) => void;

  // Dimension
  dimensionToolState: {
    isActive: boolean;
    step: number;
    autoSelectMode: boolean;
    dimensionType: string;
  };
  toggleAutoSelectMode: () => void;
  handleDimensionClick: (...args: any[]) => any;
  handleDimensionMove: (pos: Point) => void;
  setSelectedDimensionIds: (ids: string[]) => void;
  removeDimension: (id: string) => void;
  updateDimension: (id: string, updates: any) => void;
  setQdimEntities: (entities: any[]) => void;
  confirmQdim: () => any[];

  // Command repeat
  lastCommand: string;
  handleCommand: (cmd: string) => void;

  // Template
  selectedTemplate: { id: string; name: string } | null;
  insertTemplate: (id: string, pos: { x: number; y: number }) => void;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ==================== Hook ====================

export function useCanvasEventHandlers(params: UseCanvasEventHandlersParams) {
  const {
    isPasteMode,
    documentEntities,
    documentSelectedIds,
    addDocumentEntity,
    deleteDocumentEntities,
    moveDocumentEntities,
    selectDocumentEntities,
    documentUndo,
    documentRedo,
    setLegacyCanvasEntities,
    setLegacyCanvasSelectedIds,
    executeCommandObject,
    addNotification,
    dimensionToolState,
    toggleAutoSelectMode,
    handleDimensionClick,
    handleDimensionMove,
    setSelectedDimensionIds,
    removeDimension,
    updateDimension,
    setQdimEntities,
    confirmQdim,
    lastCommand,
    handleCommand,
    selectedTemplate,
    insertTemplate,
  } = params;

  // ==================== PASTE ====================

  const pastePreviewEntities = useMemo(() => {
    if (!isPasteMode || !ClipboardManager.hasData()) return [];
    const clipboardData = ClipboardManager.paste({ x: 0, y: 0 });
    return clipboardData?.entities || [];
  }, [isPasteMode]);

  const handlePasteClick = useCallback(
    (worldPos: Point) => {
      if (!ClipboardManager.hasData()) return;

      const pasteData = ClipboardManager.paste(worldPos);
      if (!pasteData) return;

      for (const entity of pasteData.entities) {
        addDocumentEntity(entity);
      }

      for (const door of pasteData.doors) {
        const doorInfo = door.doorInfo;
        const command = new AddDoorCommand({
          variant: doorInfo.variant as DoorVariant,
          width: doorInfo.width,
          height: doorInfo.height,
          position: door.position,
          systemId: doorInfo.systemId,
          displayName: `${doorInfo.displayName} (copy)`,
        });
        executeCommandObject(command);
      }

      const totalCount = pasteData.entities.length + pasteData.doors.length;
      addNotification({
        type: "success",
        title: "Paste thành công",
        message: `Đã paste ${totalCount} đối tượng`,
        duration: 2000,
      });
    },
    [addDocumentEntity, executeCommandObject, addNotification],
  );

  // ==================== CONTROLLED MODE PROPS ====================

  const controlledModeProps = useMemo(
    () =>
      USE_CONTROLLED_MODE
        ? {
            controlledEntities: documentEntities as CadEntity[],
            controlledSelectedIds: documentSelectedIds,
            useExternalHistory: true,
            onAddEntity: (entity: CadEntity) => {
              addDocumentEntity(entity);
            },
            onDeleteEntities: (ids: string[]) => {
              deleteDocumentEntities(ids);
            },
            onMoveEntities: (ids: string[], dx: number, dy: number) => {
              moveDocumentEntities(ids, dx, dy);
            },
            onSelectEntities: (ids: string[], additive: boolean) => {
              selectDocumentEntities(ids, additive);
            },
            onUndo: documentUndo,
            onRedo: documentRedo,
          }
        : {},
    [
      documentEntities,
      documentSelectedIds,
      addDocumentEntity,
      deleteDocumentEntities,
      moveDocumentEntities,
      selectDocumentEntities,
      documentUndo,
      documentRedo,
    ],
  );

  // ==================== CANVAS EVENT CALLBACKS ====================

  const handleToggleAutoSelectMode = useCallback(() => {
    const newAutoSelectMode = !dimensionToolState.autoSelectMode;
    toggleAutoSelectMode();
    addNotification({
      type: "info",
      title: newAutoSelectMode ? "Chế độ chọn nhanh" : "Chế độ thường",
      message: newAutoSelectMode
        ? "Click vào đối tượng để tạo dimension"
        : "Click chọn điểm 1 và điểm 2",
      duration: 2000,
    });
  }, [dimensionToolState.autoSelectMode, toggleAutoSelectMode, addNotification]);

  const handleRepeatLastCommand = useCallback(() => {
    if (lastCommand) {
      handleCommand(lastCommand);
    }
  }, [lastCommand, handleCommand]);

  const handleQdimSelectionConfirm = useCallback(
    (entities: CadEntity[]) => {
      const qdimEntities = entities.map((ent) => ({
        id: ent.id,
        type: ent.type,
        points: ent.points,
        center: ent.type === "circle" ? ent.points?.[0] : undefined,
        radius:
          ent.type === "circle" && ent.points?.[1]
            ? ent.points[1].x
            : undefined,
      }));
      setQdimEntities(qdimEntities);
    },
    [setQdimEntities],
  );

  const handleQdimConfirm = useCallback(() => {
    const created = confirmQdim();
    if (created.length > 0) {
      addNotification({
        type: "success",
        title: "QDIM",
        message: `Created ${created.length} dimension(s)`,
        duration: 2000,
      });
    }
  }, [confirmQdim, addNotification]);

  const handleCanvasDimensionClick = useCallback(
    (
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
        entity?: {
          id: string;
          type: string;
          points?: { x: number; y: number }[];
        };
        pointIndex?: number;
      } | null,
    ) => {
      if (dimensionToolState.isActive) {
        const osnapResult: Record<string, unknown> | null = snapResult
          ? {
              point: snapResult.point,
              mode: 0,
              distance: 0,
              description: snapResult.type,
              entity: snapResult.entity
                ? {
                    id: snapResult.entity.id,
                    type: snapResult.entity.type,
                    points: snapResult.entity.points,
                  }
                : undefined,
              pointIndex: snapResult.pointIndex,
            }
          : null;

        const result = handleDimensionClick(
          worldPos,
          undefined,
          circleInfo,
          lineInfo,
          arcInfo,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          osnapResult as any,
        );
        if (result) {
          const dimResult = result as { ref1?: unknown; ref2?: unknown };
          const isAssociative = !!(dimResult.ref1 || dimResult.ref2);
          addNotification({
            type: "success",
            title: isAssociative ? "Associative Dimension" : "Dimension",
            message: `Created: ${result.id}`,
            duration: 2000,
          });
        }
      }
    },
    [dimensionToolState.isActive, handleDimensionClick, addNotification],
  );

  const handleDimensionSelectCb = useCallback(
    (ids: string[]) => setSelectedDimensionIds(ids),
    [setSelectedDimensionIds],
  );

  const handleDimensionDeleteCb = useCallback(
    (id: string) => removeDimension(id),
    [removeDimension],
  );

  const handleDimensionUpdateCb = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (id: string, updates: Partial<any>) => updateDimension(id, updates),
    [updateDimension],
  );

  const handleDimensionCopyCb = useCallback((ids: string[]) => {
    console.log("Dimensions copied:", ids);
  }, []);

  const handleCanvasMouseMove = useCallback(
    (worldPos: Point) => {
      useEngineStore.setState({
        mouseWorld: { x: worldPos.x, y: worldPos.y },
      });
      if (dimensionToolState.isActive) {
        handleDimensionMove(worldPos);
      }
    },
    [dimensionToolState.isActive, handleDimensionMove],
  );

  const handlePromptChange = useCallback((prompt: string) => {
    useEngineStore.setState({ commandPrompt: prompt });
  }, []);

  const handleCanvasEntityCreated = useCallback((entity: CadEntity) => {
    console.log("Entity created:", entity);
  }, []);

  const handleCanvasEntitiesChange = useCallback(
    (entities: CadEntity[]) => {
      if (!USE_CONTROLLED_MODE) {
        setLegacyCanvasEntities(entities);
      }
    },
    [setLegacyCanvasEntities],
  );

  const handleCanvasSelectionChanged = useCallback(
    (selectedIds: string[]) => {
      if (!USE_CONTROLLED_MODE) {
        setLegacyCanvasSelectedIds(selectedIds);
      }
    },
    [setLegacyCanvasSelectedIds],
  );

  const handleCanvasPlaceClick = useCallback(
    (worldPos: Point) => {
      if (selectedTemplate) {
        insertTemplate(selectedTemplate.id, {
          x: worldPos.x,
          y: worldPos.y,
        });
        addNotification({
          type: "success",
          title: "Door Placed",
          message: `${selectedTemplate.name} placed at (${Math.round(worldPos.x)}, ${Math.round(worldPos.y)})`,
          duration: 2000,
        });
      }
    },
    [selectedTemplate, insertTemplate, addNotification],
  );

  // ==================== PROJECT INFO ====================

  const handleProjectInfoChange = useCallback(
    (info: Partial<ProjectInfoData>) => {
      const projectInfo = useProjectStore.getState().currentProject;
      if (projectInfo) {
        useProjectStore.setState({
          currentProject: {
            ...projectInfo,
            ...info,
            modified: new Date().toISOString(),
          },
        });
      }
    },
    [],
  );

  return {
    // Paste
    pastePreviewEntities,
    handlePasteClick,
    // Controlled mode
    controlledModeProps,
    // Canvas callbacks
    handleToggleAutoSelectMode,
    handleRepeatLastCommand,
    handleQdimSelectionConfirm,
    handleQdimConfirm,
    handleCanvasDimensionClick,
    handleDimensionSelectCb,
    handleDimensionDeleteCb,
    handleDimensionUpdateCb,
    handleDimensionCopyCb,
    handleCanvasMouseMove,
    handlePromptChange,
    handleCanvasEntityCreated,
    handleCanvasEntitiesChange,
    handleCanvasSelectionChanged,
    handleCanvasPlaceClick,
    // Project info
    handleProjectInfoChange,
  };
}
