/**
 * CadDrawingCanvasWrapper
 *
 * ĐIỀU KIỆN 1: UI → CadEngine → Document → History
 *
 * Wrapper component kết nối CadDrawingCanvas với CadDocument.
 *
 * Thay vì refactor toàn bộ 2988 lines, wrapper này:
 * 1. Đọc entities từ CadDocument (useCanvasEntities hook)
 * 2. Chuyển tiếp tất cả callbacks để ghi qua Commands
 * 3. Sync entities giữa CadDocument và internal state của Canvas
 *
 * Sau này khi có thời gian, có thể refactor trực tiếp CadDrawingCanvas
 * để bỏ internal state hoàn toàn.
 */

"use client";

import React, { useEffect, useRef, useCallback } from "react";
import {
  CadDrawingCanvas,
  CadDrawingCanvasProps,
  CadEntity,
  Point,
} from "./CadDrawingCanvas";
import { useCanvasEntities, CanvasEntity } from "../../hooks/useCanvasEntities";

// Convert from CadEntity to CanvasEntity (same structure, just type alias)
function cadToCanvas(entity: CadEntity): CanvasEntity {
  return {
    id: entity.id,
    type: entity.type,
    points: entity.points,
    color: entity.color,
    lineWidth: entity.lineWidth,
    selected: entity.selected,
    locked: entity.locked,
    visible: entity.visible,
    layer: entity.layer,
    // Arc properties
    startAngle: entity.startAngle,
    endAngle: entity.endAngle,
    // Ellipse properties
    radiusX: entity.radiusX,
    radiusY: entity.radiusY,
    rotation: entity.rotation,
    // Text properties
    text: entity.text,
    fontSize: entity.fontSize,
    fontFamily: entity.fontFamily,
  };
}

// Convert from CanvasEntity to CadEntity
function canvasToCad(entity: CanvasEntity): CadEntity {
  return {
    id: entity.id,
    type: entity.type,
    points: entity.points,
    color: entity.color,
    lineWidth: entity.lineWidth,
    selected: entity.selected,
    locked: entity.locked,
    visible: entity.visible,
    layer: entity.layer,
    // Arc properties
    startAngle: entity.startAngle,
    endAngle: entity.endAngle,
    // Ellipse properties
    radiusX: entity.radiusX,
    radiusY: entity.radiusY,
    rotation: entity.rotation,
    // Text properties
    text: entity.text,
    fontSize: entity.fontSize,
    fontFamily: entity.fontFamily,
  };
}

export interface CadDrawingCanvasWrapperProps
  extends Omit<
    CadDrawingCanvasProps,
    | "onEntityCreated"
    | "onEntityUpdated"
    | "onEntityDeleted"
    | "onEntitiesChange"
    | "onSelectionChanged"
    | "triggerUndo"
    | "triggerRedo"
    | "triggerDelete"
    | "triggerClearSelection"
  > {
  // Tất cả props từ CadDrawingCanvasProps trừ các callback entity
  // vì wrapper sẽ handle các callback này
}

export const CadDrawingCanvasWrapper: React.FC<CadDrawingCanvasWrapperProps> = (
  props
) => {
  const {
    entities: documentEntities,
    selectedIds,
    addEntity,
    deleteEntities,
    updateEntity,
    moveEntities,
    selectEntities,
    clearSelection,
    undo,
    redo,
  } = useCanvasEntities();

  // Refs để track triggers
  const triggerUndoRef = useRef(0);
  const triggerRedoRef = useRef(0);
  const triggerDeleteRef = useRef(0);
  const triggerClearRef = useRef(0);

  // Track previous document entities để detect changes
  const prevDocEntitiesRef = useRef<CanvasEntity[]>([]);

  // Handle entity created from canvas
  const handleEntityCreated = useCallback(
    (entity: CadEntity) => {
      // Entity được tạo trong canvas → thêm vào Document qua Command
      addEntity(cadToCanvas(entity));
    },
    [addEntity]
  );

  // Handle entity updated from canvas
  const handleEntityUpdated = useCallback(
    (entity: CadEntity) => {
      // Entity được update trong canvas → update Document qua Command
      updateEntity(entity.id, cadToCanvas(entity));
    },
    [updateEntity]
  );

  // Handle entity deleted from canvas
  const handleEntityDeleted = useCallback(
    (id: string) => {
      // Entity bị xóa trong canvas → xóa từ Document qua Command
      deleteEntities(id);
    },
    [deleteEntities]
  );

  // Handle selection changed from canvas
  const handleSelectionChanged = useCallback(
    (ids: string[]) => {
      // Selection thay đổi trong canvas → update Document
      selectEntities(ids);
    },
    [selectEntities]
  );

  // Handle entities change from canvas (sync back)
  const handleEntitiesChange = useCallback((newEntities: CadEntity[]) => {
    // Khi internal state của canvas thay đổi,
    // chúng ta cần detect những thay đổi và sync lại Document

    // Tuy nhiên, việc này phức tạp vì cần diff
    // Hiện tại, wrapper chỉ đảm bảo các operations đi qua Commands
    // Canvas internal state sẽ được sync khi component mount

    // TODO: Implement proper sync khi có thời gian refactor Canvas
    console.log("[Wrapper] Entities changed:", newEntities.length);
  }, []);

  // Sync document entities vào canvas khi mount và khi document thay đổi
  // Hiện tại Canvas tự quản lý state, wrapper chỉ đảm bảo callbacks đi qua Commands

  // Convert document entities thành CadEntity format để pass vào canvas
  // Note: Canvas hiện không nhận entities như props, nên cần refactor sau

  return (
    <CadDrawingCanvas
      {...props}
      // ĐIỀU KIỆN 1: Pass controlled entities from CadDocument
      controlledEntities={documentEntities.map(canvasToCad)}
      controlledSelectedIds={selectedIds}
      useExternalHistory={true}
      // Wrap callbacks để đi qua Commands
      onEntityCreated={handleEntityCreated}
      onEntityUpdated={handleEntityUpdated}
      onEntityDeleted={handleEntityDeleted}
      onEntitiesChange={handleEntitiesChange}
      onSelectionChanged={handleSelectionChanged}
      // Undo/Redo từ Document history
      triggerUndo={triggerUndoRef.current}
      triggerRedo={triggerRedoRef.current}
      triggerDelete={triggerDeleteRef.current}
      triggerClearSelection={triggerClearRef.current}
      onUndo={undo}
      onRedo={redo}
    />
  );
};

export default CadDrawingCanvasWrapper;
