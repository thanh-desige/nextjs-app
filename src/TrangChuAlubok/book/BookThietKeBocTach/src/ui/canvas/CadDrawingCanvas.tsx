/**
 * CadDrawingCanvas - AutoCAD-style drawing canvas with Selection & Editing
 *
 * STEP-5.24: Thin facade — state & infrastructure in useCadCanvasCore;
 *            this file handles hook wiring + JSX only.
 */

"use client";

import React, { useEffect, useRef } from "react";

// ==================== Utility Imports ====================
import { getCursor } from "./utils";

// ==================== Overlay Components ====================
import { HudOverlay, OsnapOverlay } from "./overlay";
import { DoorOverlay } from "./overlay/DoorOverlay";
import { RotateAngleInputOverlay } from "./overlay/RotateAngleInputOverlay";
import { TextScaleInputOverlay } from "./overlay/TextScaleInputOverlay";
import { TextInputCommandOverlay } from "./overlay/TextInputCommandOverlay";
import { TextInputLegacyOverlay } from "./overlay/TextInputLegacyOverlay";
import { DynamicInputSection } from "./overlay/DynamicInputSection";

// ==================== Handler Helpers ====================
import { useWheelHandler } from "./handlers";

// ==================== Hook Imports ====================
import { useCanvasRenderer } from "./hooks/useCanvasRenderer";
import { useKeyboardHandler } from "./hooks/useKeyboardHandler";
import { useMouseHandlers } from "./hooks/useMouseHandlers";
import { useDynamicInputHandlers } from "./hooks/useDynamicInputHandlers";
import { useToolChangeEffect } from "./hooks/useToolChangeEffect";
import { useTriggerEffects } from "./hooks/useTriggerEffects";
import { useCanvasEffects } from "./hooks/useCanvasEffects";
import { useCadCanvasCore } from "./hooks/useCadCanvasCore";

// ==================== Types ====================
import type {
  DrawingState,
  LayerInfo,
  DimensionGripType,
  DimensionGrip,
} from "./canvas.types";
import type { Point, CadEntity } from "./types/CadEntity";

// Re-export for backward compatibility
export type { Point, CadEntity };
export type { DrawingState, LayerInfo, DimensionGripType, DimensionGrip };

// Props interface moved to canvas.types.ts (STEP-5)
import type { CadDrawingCanvasProps } from "./canvas.types";
export type { CadDrawingCanvasProps };

// ==================== Component ====================

// ==================== Component ====================

export const CadDrawingCanvas: React.FC<CadDrawingCanvasProps> = ({
  activeTool,
  showGrid = true,
  snapToGrid = false,
  gridSpacing = 10,
  orthoMode = false,
  osnapEnabled = true,
  osnapModes = {
    endpoint: true,
    midpoint: true,
    center: true,
    intersection: false,
    perpendicular: false,
    nearest: false,
  },
  layers = [],
  currentLayerId = "default",
  controlledEntities,
  controlledSelectedIds,
  useExternalHistory = false,
  onAddEntity,
  onDeleteEntities,
  onMoveEntities,
  onSelectEntities,
  onUndo,
  onRedo,
  showDimensions = true,
  dimensions = [],
  previewDimension = null,
  previewDimensions = [],
  selectedDimensionIds = [],
  dimScale = 0,
  dimRounding = true,
  dimShowUnit = false,
  dimTextColor = "#00ff00",
  dimLineColor = "#00ff00",
  dimLineweight = 0.25,
  dimExtensionGap = true,
  dimArrowStyle = "closed",
  canvasBgColor = "#1E1E1E",
  osnapApertureSize = 5,
  zoomFactor = 1.1,
  onDimensionClick,
  onDimensionSelect,
  onDimensionDelete,
  onDimensionUpdate,
  onDimensionCopy,
  qdimStep = 0,
  onQdimSelectionConfirm,
  onQdimConfirm,
  dimensionToolStep = 0,
  onToggleAutoSelectMode,
  onRepeatLastCommand,
  placeMode = false,
  onPlaceClick,
  offsetDistance,
  triggerUndo = 0,
  triggerRedo = 0,
  triggerDelete = 0,
  triggerClearSelection = 0,
  textScaleTrigger = 0,
  triggerZoomFit = 0,
  currentStrokeStyle = "solid",
  onEntityCreated,
  onEntityUpdated,
  onEntityDeleted,
  onSelectionChanged,
  onEntitiesChange,
  onMouseMove,
  onPromptChange,
  onStepChange,
  onDrawingStateChange,
  onModifyMoveComplete,
  onModifyCopyComplete,
  onModifyRotateComplete,
  onModifyMirrorComplete,
  onModifyScaleComplete,
  onModifyOffsetComplete,
  onTrimComplete,
  onExtendComplete,
  onFilletComplete,
  onBoundaryComplete,
  commandInput,
  onCommandInputConsumed,
  onDoorDrop,
  onDoorDoubleClick,
  onDoorMove,
  onClearDoorSelection: _onClearDoorSelection,
  pasteMode = false,
  pastePreviewEntities = [],
  onPasteClick,
  textSettings,
}) => {
  // ==================== CORE HOOK (STEP-5.24) ====================
  const core = useCadCanvasCore({
    activeTool,
    currentLayerId,
    orthoMode,
    osnapEnabled,
    osnapModes,
    osnapApertureSize,
    layers,
    controlledEntities,
    controlledSelectedIds,
    useExternalHistory,
    onAddEntity,
    onDeleteEntities,
    onMoveEntities,
    onSelectEntities,
    onUndo,
    onRedo,
    onSelectionChanged,
    onEntityCreated,
    onEntityUpdated,
    onEntityDeleted,
    onEntitiesChange,
    onPromptChange,
    textSettings,
    commandInput,
    onCommandInputConsumed,
    onDoorDrop,
  });

  const {
    canvasRef, containerRef, lastScreenPosRef, mousePosRef, moveCopyAngleRef,
    textInputRef, textInputMountedRef, textInputOriginalValueRef,
    textScaleInputRef, rotateAngleInputRef,
    doors, selectedDoorIds, hoveredDoorId, selectDoor, setHoveredDoor, clearDoorSelection,
    isControlled, entities, selectedIds, internalEntities, setInternalEntities,
    hoveredId, setHoveredId, hoveredDimensionId, setHoveredDimensionId,
    hoveredGrip, setHoveredGrip, dimensionClipboard, setDimensionClipboard,
    drawState, setDrawState, mousePos, setMousePos,
    isShiftPressed, setIsShiftPressed,
    movingPreviewDelta, setMovingPreviewDelta,
    offsetPreviewEntity, setOffsetPreviewEntity,
    canvasDimensions, setCanvasDimensions,
    zoom, setZoom, pan, setPan, isPanning, setIsPanning, panStart, setPanStart,
    snapPoint, setSnapPoint,
    dynamicInput, setDynamicInput,
    textInput, setTextInput, textScaleInput, setTextScaleInput,
    rotateAngleInput, setRotateAngleInput,
    toggleOrtho, setActiveTool, effectiveOrtho,
    commandDrawing,
    screenToWorld, worldToScreen, textHitTestContext, findOsnapPoint,
    isDragOver, dragPreviewPos, handleDragOver, handleDragEnter, handleDragLeave, handleDrop,
    saveToHistory, undo, redo,
    selectEntities, clearSelection, getSelectedEntities, addEntity,
    deleteSelectedEntities, copySelectedToClipboard, pasteFromClipboard,
    duplicateSelected, moveSelectedEntities, saveHistoryBeforeMove,
  } = core;

  // ==================== Trigger Effects ====================

  useTriggerEffects({
    triggerUndo,
    triggerRedo,
    triggerDelete,
    triggerClearSelection,
    textScaleTrigger,
    undo,
    redo,
    deleteSelectedEntities,
    clearSelection,
    selectedDimensionIds,
    onDimensionDelete,
    onDimensionSelect,
    commandDrawing,
    drawState,
    setDrawState,
    setDynamicInput,
    setActiveTool,
    textInputRef,
    textInputMountedRef,
    textInput,
    entities,
    selectedIds,
    setTextScaleInput,
    onPromptChange,
  });

  // ==================== Trigger Zoom Fit ====================
  const triggerZoomFitRef = useRef(0);
  useEffect(() => {
    if (triggerZoomFit > 0 && triggerZoomFit !== triggerZoomFitRef.current) {
      triggerZoomFitRef.current = triggerZoomFit;
      if (entities.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const e of entities) {
        if (e.type === "circle" || e.type === "arc") {
          if (e.points.length >= 2) {
            const cx = e.points[0].x, cy = e.points[0].y;
            const r = e.points[1].x;
            minX = Math.min(minX, cx - r); minY = Math.min(minY, cy - r);
            maxX = Math.max(maxX, cx + r); maxY = Math.max(maxY, cy + r);
          }
        } else if (e.type === "ellipse") {
          if (e.points.length >= 1) {
            const cx = e.points[0].x, cy = e.points[0].y;
            const rx = e.radiusX ?? 0, ry = e.radiusY ?? 0;
            minX = Math.min(minX, cx - rx); minY = Math.min(minY, cy - ry);
            maxX = Math.max(maxX, cx + rx); maxY = Math.max(maxY, cy + ry);
          }
        } else {
          for (const p of e.points) {
            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
          }
        }
      }
      if (!isFinite(minX) || !isFinite(maxX)) return;
      const cv = canvasRef.current;
      if (!cv) return;
      const cw = cv.width || 800, ch = cv.height || 600;
      const ww = maxX - minX || 1, wh = maxY - minY || 1;
      const newZoom = Math.min(cw / ww, ch / wh) * 0.85;
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      setZoom(newZoom);
      setPan({ x: -cx * newZoom, y: cy * newZoom });
    }
  }, [triggerZoomFit, entities, canvasRef, setZoom, setPan]);

  // ==================== Tool Change ====================

  useToolChangeEffect({
    activeTool,
    selectedIds,
    selectedDimensionIds,
    selectedDoorIds,
    drawState,
    setDrawState,
    qdimStep,
    onPromptChange,
  });

  // ==================== Keyboard Events ====================

  useKeyboardHandler({
    activeTool,
    currentLayerId,
    orthoMode,
    effectiveOrtho,
    drawState,
    setDrawState,
    entities,
    selectedIds,
    dimensions,
    selectedDimensionIds,
    dimensionClipboard,
    setDimensionClipboard,
    zoom,
    mousePos,
    setIsShiftPressed,
    clearSelection,
    selectEntities,
    addEntity,
    deleteSelectedEntities,
    copySelectedToClipboard,
    pasteFromClipboard,
    duplicateSelected,
    moveSelectedEntities,
    undo,
    redo,
    onModifyMoveComplete,
    onModifyCopyComplete,
    setMovingPreviewDelta,
    dynamicInput,
    setDynamicInput,
    textScaleInput,
    setTextScaleInput,
    textScaleInputRef,
    selectedDoorIds,
    clearDoorSelection,
    onPromptChange,
    onDimensionDelete,
    onDimensionSelect,
    onDimensionUpdate,
    onDimensionCopy,
    onQdimSelectionConfirm,
    dimensionToolStep,
    qdimStep,
    onToggleAutoSelectMode,
    onRepeatLastCommand,
    onPasteClick,
    currentStrokeStyle,
    commandDrawingActions: commandDrawing.actions,
    toggleOrtho,
  });

  // Global mouse up for pan → moved to useCanvasEffects

  // ==================== Mouse Events (STEP-5: extracted to useMouseHandlers) ====================

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useMouseHandlers({
    canvasRef,
    lastScreenPosRef,
    mousePosRef,
    moveCopyAngleRef,
    textInputRef,
    textInputOriginalValueRef,
    activeTool,
    orthoMode,
    isShiftPressed,
    effectiveOrtho,
    drawState,
    setDrawState,
    mousePos,
    setMousePos,
    zoom,
    pan,
    setPan,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    snapToGrid,
    gridSpacing,
    entities,
    selectedIds,
    isControlled,
    setInternalEntities,
    dimensions,
    selectedDimensionIds,
    hoveredId,
    setHoveredId,
    setHoveredDimensionId,
    setHoveredGrip,
    setSnapPoint,
    movingPreviewDelta,
    setMovingPreviewDelta,
    offsetPreviewEntity,
    setOffsetPreviewEntity,
    selectEntities,
    getSelectedEntities,
    saveHistoryBeforeMove,
    setDynamicInput,
    setTextInput,
    setRotateAngleInput,
    placeMode,
    pasteMode,
    findOsnapPoint,
    screenToWorld,
    onPromptChange,
    onMouseMove,
    onEntityUpdated,
    onDimensionClick,
    onDimensionSelect,
    onDimensionUpdate,
    onPlaceClick,
    onPasteClick,
    onMoveEntities,
    onDoorMove,
    qdimStep,
    onQdimConfirm,
    onModifyMoveComplete,
    onModifyCopyComplete,
    onModifyRotateComplete,
    onModifyMirrorComplete,
    onModifyScaleComplete,
    onModifyOffsetComplete,
    onTrimComplete,
    onExtendComplete,
    onFilletComplete,
    onBoundaryComplete,
    commandDrawingActions: commandDrawing.actions,
    commandDrawingIsActive: commandDrawing.state.isActive,
    commandDrawingPoints: commandDrawing.state.points,
    textHitTestContext,
    textInputMountedRef,
    selectedDoorIds,
  });

  // ==================== Dynamic Input Handlers (STEP-5: extracted) ====================

  const {
    handleRectDynamicInput,
    handleCircleDynamicInput,
    handleRotateAngleInput,
  } = useDynamicInputHandlers({
    dynamicInput,
    setDynamicInput,
    rotateAngleInput,
    setRotateAngleInput,
    drawState,
    setDrawState,
    commandDrawingActions: commandDrawing.actions,
    onModifyRotateComplete,
    onPromptChange,
  });

  // Use extracted wheel handler hook
  const { handleWheel } = useWheelHandler({
    canvasRef,
    zoom,
    setZoom,
    pan,
    setPan,
    snapPoint,
    zoomFactor, // Pass zoom factor from settings
  });

  // ==================== Drawing (STEP-5: extracted to useCanvasRenderer) ====================

  const { draw } = useCanvasRenderer({
    canvasRef,
    entities,
    selectedIds,
    hoveredId,
    drawState,
    mousePos,
    zoom,
    worldToScreen,
    canvasBgColor,
    showGrid,
    snapToGrid,
    snapPoint,
    layers,
    showDimensions,
    dimensions,
    hoveredDimensionId,
    hoveredGrip,
    selectedDimensionIds,
    previewDimension,
    previewDimensions,
    dimScale,
    dimRounding,
    dimShowUnit,
    dimTextColor,
    dimLineColor,
    dimLineweight,
    dimExtensionGap,
    dimArrowStyle,
    isControlled,
    movingPreviewDelta,
    offsetPreviewEntity,
    commandPreviewEntity: commandDrawing.state.previewEntity,
    pasteMode,
    pastePreviewEntities,
    textHitTestContext,
    textSettings,
  });

  // ==================== Canvas Effects (STEP-5: extracted to useCanvasEffects) ====================
  useCanvasEffects({
    drawState,
    onStepChange,
    canvasRef,
    moveCopyAngleRef,
    canvasDimensions,
    pan,
    zoom,
    containerRef,
    setCanvasDimensions,
    entities,
    onEntitiesChange,
    offsetDistance,
    setDrawState,
    onPromptChange,
    rotateAngleInput,
    setRotateAngleInput,
    rotateAngleInputRef,
    commandDrawingIsActive: commandDrawing.state.isActive,
    onDrawingStateChange,
    isPanning,
    setIsPanning,
    draw,
    handleWheel,
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        touchAction: "none", // Prevent passive event listener issues on Chrome/Edge
      }}
      // Door drag & drop events
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Over Highlight */}
      {isDragOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "3px dashed #9b59b6",
            background: "rgba(155, 89, 182, 0.1)",
            pointerEvents: "none",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(155, 89, 182, 0.9)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            🚪 Thả để thêm cửa
            {dragPreviewPos && (
              <span style={{ marginLeft: 8, opacity: 0.8, fontSize: 12 }}>
                ({Math.round(dragPreviewPos.x)}, {Math.round(dragPreviewPos.y)})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grid Overlay - SVG grid (optional, can use canvas grid instead) */}
      {/* Note: Currently grid is rendered on canvas. This SVG overlay can replace it if needed */}
      {/* <GridOverlay
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        pan={pan}
        zoom={zoom}
        gridSpacing={10}
        visible={showGrid}
      /> */}

      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          cursor: getCursor(
            activeTool,
            drawState,
            hoveredId,
            hoveredDimensionId,
            hoveredGrip,
          ),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setMousePos({ x: 0, y: 0 });
          setHoveredId(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* HUD Overlay - coordinates, status indicators */}
      {/* NOTE: When DynamicInputOverlay is active, HudOverlay only shows coordinates/status
          DynamicInputOverlay is the PRIMARY input source for MOVE/COPY/LINE etc */}
      <HudOverlay
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        mouseWorld={mousePos}
        zoom={zoom}
        orthoEnabled={effectiveOrtho}
        snapEnabled={snapToGrid}
        selectedCount={selectedIds.length}
        // CRITICAL: Do NOT pass dynamicInput when DynamicInputOverlay is active
        // This prevents duplicate HUD rendering
        dynamicInput={undefined}
        screenPosition={undefined}
        displacementInput={undefined}
      />

      {/* ==================== DOOR OVERLAY (STEP-5: extracted) ==================== */}
      <DoorOverlay
        doors={doors}
        selectedDoorIds={selectedDoorIds}
        hoveredDoorId={hoveredDoorId}
        canvasDimensions={canvasDimensions}
        pan={pan}
        zoom={zoom}
        showDimensions={showDimensions}
        drawState={drawState}
        setDrawState={setDrawState}
        movingPreviewDelta={movingPreviewDelta}
        containerRef={containerRef}
        screenToWorld={screenToWorld}
        getSelectedEntities={getSelectedEntities}
        selectDoor={selectDoor}
        setHoveredDoor={setHoveredDoor}
        onPromptChange={onPromptChange}
        onDoorDoubleClick={onDoorDoubleClick}
      />

      {/* OSNAP Overlay - snap point markers */}
      {snapPoint && (
        <OsnapOverlay
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          osnapPoint={{
            x: snapPoint.point.x,
            y: snapPoint.point.y,
            type: snapPoint.type.toLowerCase() as
              | "endpoint"
              | "midpoint"
              | "center"
              | "intersection"
              | "perpendicular"
              | "nearest"
              | "quadrant",
          }}
          pan={pan}
          zoom={zoom}
        />
      )}

      {/* Dynamic Input Section (STEP-5: extracted to DynamicInputSection) */}
      <DynamicInputSection
        dynamicInput={dynamicInput}
        setDynamicInput={setDynamicInput}
        drawState={drawState}
        setDrawState={setDrawState}
        mousePos={mousePos}
        canvasDimensions={canvasDimensions}
        pan={pan}
        zoom={zoom}
        currentLayerId={currentLayerId}
        effectiveOrtho={effectiveOrtho}
        orthoMode={orthoMode}
        handleRectDynamicInput={handleRectDynamicInput}
        handleCircleDynamicInput={handleCircleDynamicInput}
        commandDrawingActions={commandDrawing.actions}
        commandDrawingPoints={commandDrawing.state.points}
        moveCopyAngleRef={moveCopyAngleRef}
        setMovingPreviewDelta={setMovingPreviewDelta}
        onModifyMoveComplete={onModifyMoveComplete}
        onModifyCopyComplete={onModifyCopyComplete}
        toggleOrtho={toggleOrtho}
        onAddEntity={onAddEntity}
        setInternalEntities={setInternalEntities}
        mousePosRef={mousePosRef}
        canvasRef={canvasRef}
        onPromptChange={onPromptChange}
      />

      {/* ROTATE Angle Input Overlay (STEP-5: extracted) */}
      <RotateAngleInputOverlay
        rotateAngleInput={rotateAngleInput}
        setRotateAngleInput={setRotateAngleInput}
        rotateAngleInputRef={rotateAngleInputRef}
        drawState={drawState}
        setDrawState={setDrawState}
        mousePos={mousePos}
        canvasDimensions={canvasDimensions}
        pan={pan}
        zoom={zoom}
        handleRotateAngleInput={handleRotateAngleInput}
        onPromptChange={onPromptChange}
      />

      {/* Text Input Overlay - Command-based (STEP-5: extracted) */}
      <TextInputCommandOverlay
        visible={commandDrawing.actions.isWaitingForTextInput()}
        commandDrawingPoints={commandDrawing.state.points}
        textInputValue={textInput.value}
        setTextInput={setTextInput}
        textInputRef={textInputRef}
        textInputMountedRef={textInputMountedRef}
        onTextInputCommand={commandDrawing.actions.handleTextInput}
        onEscape={commandDrawing.actions.handleEscape}
        canvasDimensions={canvasDimensions}
        pan={pan}
        zoom={zoom}
      />

      {/* Text Input Overlay - Legacy mode (STEP-5: extracted) */}
      {!commandDrawing.actions.isWaitingForTextInput() && (
        <TextInputLegacyOverlay
          textInput={textInput}
          setTextInput={setTextInput}
          textInputRef={textInputRef}
          textInputMountedRef={textInputMountedRef}
          setDrawState={setDrawState}
          canvasDimensions={canvasDimensions}
          pan={pan}
          zoom={zoom}
          entities={entities}
          isControlled={isControlled}
          currentLayerId={currentLayerId}
          useExternalHistory={useExternalHistory}
          saveToHistory={saveToHistory}
          internalEntities={internalEntities}
          setInternalEntities={setInternalEntities}
          onAddEntity={onAddEntity}
          onDeleteEntities={onDeleteEntities}
          onEntityUpdated={onEntityUpdated}
          onEntitiesChange={onEntitiesChange}
          onPromptChange={onPromptChange}
          commandDrawingPoints={commandDrawing.state.points}
          commandHandleTextInput={commandDrawing.actions.handleTextInput}
        />
      )}

      {/* Text Scale Input Overlay (STEP-5: extracted) */}
      <TextScaleInputOverlay
        textScaleInput={textScaleInput}
        setTextScaleInput={setTextScaleInput}
        textScaleInputRef={textScaleInputRef}
        entities={entities}
        isControlled={isControlled}
        onDeleteEntities={onDeleteEntities}
        onAddEntity={onAddEntity}
        onEntityUpdated={onEntityUpdated}
        internalEntities={internalEntities}
        setInternalEntities={setInternalEntities}
        useExternalHistory={useExternalHistory}
        saveToHistory={saveToHistory}
        onPromptChange={onPromptChange}
      />
    </div>
  );
};

// ==================== Helpers ====================
// These helper functions have been extracted to ./utils/toolHelpers.ts
// Imported at the top of the file from "./utils"

export default CadDrawingCanvas;
