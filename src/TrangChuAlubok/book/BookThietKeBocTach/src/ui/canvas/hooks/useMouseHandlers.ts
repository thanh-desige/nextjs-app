/**
 * useMouseHandlers - Hook that owns mouse event handling (mouseDown, mouseMove, mouseUp)
 *
 * STEP-5 extraction from CadDrawingCanvas.tsx
 * STEP-5.23: Split into sub-modules for ≤800 line compliance
 *
 * Handles:
 * - Click selection / deselection  → mouseHandlers/selectMouseDown.ts
 * - Drawing tool mouse interactions (via command pattern)
 * - Pan (middle-click drag)
 * - Modify commands  → mouseHandlers/modifyMouseDown.ts
 * - Selection box (window/crossing) → mouseHandlers/selectionBoxComplete.ts
 * - Dimension interactions → mouseHandlers/dimensionMouseDown.ts
 * - Door interactions
 * - OSNAP snapping
 */

"use client";

import React, {
  useCallback,
  useRef,
} from "react";
import {
  snapToGridPoint,
  applyOrtho,
  calculateOffsetPreview,
  getToolType,
  distance,
} from "../utils";
import { handleModifyMouseDown } from "./mouseHandlers/modifyMouseDown";
import { handleSelectMouseDown } from "./mouseHandlers/selectMouseDown";
import { handleDimensionMouseDown } from "./mouseHandlers/dimensionMouseDown";
import { handleSelectionBoxComplete } from "./mouseHandlers/selectionBoxComplete";
import {
  handleDimensionMoving,
  handleDimensionGripMove,
} from "./mouseHandlers/dimensionMouseMove";
import { updateHoverDetection } from "./mouseHandlers/hoverDetection";

// Re-export MouseHandlerParams for backward compatibility
export type { MouseHandlerParams } from "./mouseHandler.types";
import type { MouseHandlerParams } from "./mouseHandler.types";
import type { Point } from "../types/CadEntity";

// ==================== Hook ====================

export function useMouseHandlers(params: MouseHandlerParams) {
  const {
    canvasRef,
    lastScreenPosRef,
    mousePosRef,
    moveCopyAngleRef,
    textInputRef,
    textInputOriginalValueRef,
    activeTool,
    // orthoMode — not used directly, passed to sub-handlers via params
    isShiftPressed,
    effectiveOrtho,
    drawState,
    setDrawState,
    // mousePos — not used directly, mousePosRef.current set in handleMouseMove
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
    commandDrawingActions,
    commandDrawingIsActive,
    commandDrawingPoints,
    textHitTestContext,
    textInputMountedRef,
    selectedDoorIds,
  } = params;

  // Derived values
  const hitTolerance = 10 / zoom;

  // Double-click tracking refs
  const lastClickedEntity = useRef<string | null>(null);
  const lastClickTime = useRef<number>(0);

  // ==================== Mouse Events ====================

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      let worldPos = screenToWorld(screenX, screenY);

      if (e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        return;
      }

      if (e.button === 2) {
        // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Right Click ====================
        // Nếu drawing command đang active, delegate cho hook
        if (
          commandDrawingActions.isCommandTool() &&
          commandDrawingActions.handleRightClick()
        ) {
          // Command handled it (e.g., finish LINE/POLYLINE)
          return;
        }

        // Legacy drawing modes đã được xử lý bởi useCommandDrawing (ĐIỀU KIỆN 1)
        // Chỉ reset state và prompt
        setDrawState({ mode: "idle" });
        onPromptChange?.("Ready");
        return;
      }

      // Use OSNAP point if available, otherwise grid snap
      // Pass the last point of current drawing for perpendicular snap
      // Check both legacy drawState and command-based drawing state
      let fromPoint: Point | undefined = undefined;
      if (drawState.mode === "line" && drawState.points.length > 0) {
        fromPoint = drawState.points[drawState.points.length - 1];
      } else if (commandDrawingIsActive && commandDrawingPoints.length > 0) {
        // Command-based drawing (LINE, POLYLINE, etc.)
        fromPoint = commandDrawingPoints[commandDrawingPoints.length - 1];
      }
      const osnapResult = findOsnapPoint(worldPos, fromPoint);
      if (osnapResult) {
        worldPos = osnapResult.point;
        onPromptChange?.(`Snapped to ${osnapResult.type}`);
      } else if (snapToGrid) {
        worldPos = snapToGridPoint(worldPos, gridSpacing);
      }

      // ==================== ĐIỀU KIỆN 1: Command-Based Drawing ====================
      // Nếu là drawing tool, delegate cho useCommandDrawing hook
      // Hook sẽ tạo Command, execute qua CadEngine, và entities được tạo qua Document
      const isCommandToolResult = commandDrawingActions.isCommandTool();
      if (isCommandToolResult) {
        const handled = commandDrawingActions.handleMouseDown(worldPos);
        if (handled) {
          return; // Command handled it
        }
      }

      // PASTE MODE (Ctrl+V) - click to paste entities from clipboard
      if (pasteMode && onPasteClick) {
        onPasteClick(worldPos);
        return;
      }

      // PLACE MODE (for door templates, etc.)
      if (placeMode && onPlaceClick) {
        onPlaceClick(worldPos);
        return;
      }

      const toolType = getToolType(activeTool);

      // SELECT TOOL
      if (toolType === "select") {
        handleSelectMouseDown(
          {
            drawState,
            setDrawState,
            hitTolerance,
            isShiftPressed,
            entities,
            dimensions,
            selectedIds,
            selectedDimensionIds,
            selectEntities,
            getSelectedEntities,
            saveHistoryBeforeMove,
            setTextInput,
            textInputRef,
            textInputOriginalValueRef,
            textInputMountedRef,
            textHitTestContext,
            onPromptChange,
            onDimensionSelect,
            lastClickedEntity,
            lastClickTime,
          },
          worldPos,
          e,
        );
        return;
      }

      // DRAWING TOOLS - Line, Rect, Circle, Arc, Ellipse, Text, Polygon
      // ==================== ĐIỀU KIỆN 1: ĐÃ ĐƯỢC XỬ LÝ BỞI useCommandDrawing ====================
      // Các tools này đã được handle ở trên bởi commandDrawingActions.handleMouseDown()
      // Nếu đến đây nghĩa là không phải drawing tool hoặc command đã handle

      switch (toolType) {
        // case "line": → Đã xử lý bởi useCommandDrawing (ĐIỀU KIỆN 1)
        // case "rect": → Đã xử lý bởi useCommandDrawing (ĐIỀU KIỆN 1)
        // case "circle": → Đã xử lý bởi useCommandDrawing (ĐIỀU KIỆN 1)
        // case "arc": → Đã xử lý bởi useCommandDrawing (ĐIỀU KIỆN 1)
        // case "ellipse": → Đã xử lý bởi useCommandDrawing (ĐIỀU KIỆN 1)
        // case "text": → Đã xử lý bởi useCommandDrawing (ĐIỀU KIỆN 1)

        case "dimension":
          handleDimensionMouseDown(
            {
              activeTool,
              hitTolerance,
              entities,
              textHitTestContext,
              qdimStep,
              onQdimConfirm,
              onPromptChange,
              onDimensionClick,
            },
            worldPos,
            osnapResult,
          );
          break;

        case "modify":
          handleModifyMouseDown(
            {
              drawState,
              setDrawState,
              effectiveOrtho,
              hitTolerance,
              entities,
              dimensions,
              selectedIds,
              selectedDimensionIds,
              selectEntities,
              onDimensionSelect,
              setDynamicInput,
              setRotateAngleInput,
              setMovingPreviewDelta,
              onPromptChange,
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
              textHitTestContext,
            },
            worldPos,
          );
          break;
      }
    },
    [
      activeTool,
      // currentLayerId - không còn sử dụng trực tiếp trong handleMouseDown
      // currentStrokeStyle - không còn sử dụng trực tiếp trong handleMouseDown
      dimensions,
      drawState,
      effectiveOrtho, // Used for modify commands ortho constraint
      entities,
      findOsnapPoint,
      gridSpacing,
      hitTolerance,
      isShiftPressed,
      pan,
      placeMode,
      pasteMode,
      screenToWorld,
      selectedDimensionIds,
      selectedIds,
      snapToGrid,
      // addEntity - không còn gọi trực tiếp trong handleMouseDown (đã delegate cho useCommandDrawing)
      // clearSelection - không còn cần vì không clear khi click empty (AutoCAD Rule 10)
      getSelectedEntities,
      selectEntities,
      saveHistoryBeforeMove,
      onPromptChange,
      onDimensionClick,
      onDimensionSelect,
      onPlaceClick,
      onPasteClick,
      qdimStep,
      onQdimConfirm,
      // Modify command callbacks (ĐIỀU KIỆN 1)
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
      commandDrawingActions, // ĐIỀU KIỆN 1: Command-based drawing
      commandDrawingIsActive,
      commandDrawingPoints,
      textHitTestContext, // TEXT hit test context
      // clearDoorSelection - không còn cần vì không clear khi click empty (AutoCAD Rule 10)
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      let worldPos = screenToWorld(screenX, screenY);

      // Update screen position ref for HUD overlay
      lastScreenPosRef.current = { x: screenX, y: screenY };

      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        setSnapPoint(null);
        return;
      }

      // Skip OSNAP when editing dimension grips or moving dimensions
      // (user wants free movement without snapping to entities)
      const skipOsnap =
        drawState.mode === "editingDimensionGrip" ||
        drawState.mode === "movingDimension";

      // Find OSNAP point first (higher priority than grid snap)
      // Pass the last point of current drawing for perpendicular snap
      // Check both legacy drawState and command-based drawing state
      let fromPoint: Point | undefined = undefined;
      if (drawState.mode === "line" && drawState.points.length > 0) {
        fromPoint = drawState.points[drawState.points.length - 1];
      } else if (commandDrawingIsActive && commandDrawingPoints.length > 0) {
        // Command-based drawing (LINE, POLYLINE, etc.)
        fromPoint = commandDrawingPoints[commandDrawingPoints.length - 1];
      }

      let osnapResult: { point: Point; type: string } | null = null;
      if (!skipOsnap) {
        osnapResult = findOsnapPoint(worldPos, fromPoint);
        if (osnapResult) {
          setSnapPoint(osnapResult);
          worldPos = osnapResult.point;
        } else {
          setSnapPoint(null);
          // Fall back to grid snap
          if (snapToGrid) worldPos = snapToGridPoint(worldPos, gridSpacing);
        }
      } else {
        // When editing dimensions, don't snap
        setSnapPoint(null);
      }

      if (
        effectiveOrtho &&
        drawState.mode === "line" &&
        drawState.points.length > 0
      ) {
        worldPos = applyOrtho(
          drawState.points[drawState.points.length - 1],
          worldPos,
        );
        // Clear osnap if ortho overrides it
        if (osnapResult) setSnapPoint(null);
      }

      // Update ref immediately (before state) for real-time access in DynamicInputOverlay
      mousePosRef.current = worldPos;

      // Update moveCopyAngleRef for MOVE/COPY direction
      if (
        (drawState.mode === "modifyMove" || drawState.mode === "modifyCopy") &&
        "basePoint" in drawState &&
        drawState.basePoint
      ) {
        const bp = drawState.basePoint;
        const dirX = worldPos.x - bp.x;
        const dirY = worldPos.y - bp.y;
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len > 0.001) {
          moveCopyAngleRef.current = Math.atan2(dirY, dirX);
        }
      }

      setMousePos(worldPos);
      onMouseMove?.(worldPos, { x: screenX, y: screenY });

      // ==================== ĐIỀU KIỆN 1: Command-Based Drawing Preview ====================
      // Cập nhật preview cho drawing tools qua useCommandDrawing hook
      if (commandDrawingActions.isCommandTool()) {
        commandDrawingActions.handleMouseMove(worldPos);
        // Note: Preview entity is rendered from commandDrawing.state.previewEntity
      }

      if (drawState.mode === "selecting") {
        setDrawState({ ...drawState, currentPos: worldPos });
        return;
      }

      if (drawState.mode === "moving") {
        const dx = worldPos.x - drawState.startPos.x;
        const dy = worldPos.y - drawState.startPos.y;

        if (isControlled) {
          // Controlled mode: dùng movingPreviewDelta để preview
          // Không modify entities trực tiếp (tuân thủ ĐIỀU KIỆN 1)
          setMovingPreviewDelta({ x: dx, y: dy });
        } else {
          // Uncontrolled mode: modify entities trực tiếp
          setInternalEntities((prev) =>
            prev.map((entity) => {
              const idx = drawState.entities.findIndex(
                (ent) => ent.id === entity.id,
              );
              if (idx !== -1) {
                // Special handling for circle/arc: only move center, keep radius
                if (entity.type === "circle" || entity.type === "arc") {
                  return {
                    ...entity,
                    points: drawState.originalPositions[idx].map((p, i) => {
                      if (i === 0) {
                        return { x: p.x + dx, y: p.y + dy };
                      }
                      return { ...p };
                    }),
                  };
                }
                return {
                  ...entity,
                  points: drawState.originalPositions[idx].map((p) => ({
                    x: p.x + dx,
                    y: p.y + dy,
                  })),
                };
              }
              return entity;
            }),
          );
        }
        return;
      }

      // Handle dimension moving (adjusting offset)
      if (drawState.mode === "movingDimension") {
        if (
          handleDimensionMoving(
            { drawState, dimensions, onDimensionUpdate },
            worldPos,
          )
        )
          return;
      }

      // Handle dimension grip editing
      if (drawState.mode === "editingDimensionGrip") {
        if (
          handleDimensionGripMove(
            { drawState, dimensions, onDimensionUpdate },
            worldPos,
          )
        )
          return;
      }

      // ==================== Hover Detection ====================
      updateHoverDetection(
        {
          activeTool,
          drawState,
          hitTolerance,
          entities,
          dimensions,
          selectedDimensionIds,
          setHoveredId,
          setHoveredDimensionId,
          setHoveredGrip,
          textHitTestContext,
        },
        worldPos,
      );

      // OFFSET mode selectSide: Calculate and show preview of offset entity
      if (
        drawState.mode === "modifyOffset" &&
        "step" in drawState &&
        drawState.step === "selectSide" &&
        drawState.entityId &&
        drawState.distance !== undefined
      ) {
        const sourceEntity = entities.find((e) => e.id === drawState.entityId);
        if (sourceEntity) {
          const offsetPoints = calculateOffsetPreview(
            sourceEntity,
            drawState.distance,
            worldPos,
          );
          if (offsetPoints && offsetPoints.length > 0) {
            setOffsetPreviewEntity({
              type: sourceEntity.type,
              points: offsetPoints,
            });
          } else {
            setOffsetPreviewEntity(null);
          }
        }
      } else if (
        drawState.mode !== "modifyOffset" ||
        ("step" in drawState && drawState.step !== "selectSide")
      ) {
        // Clear preview when not in selectSide step
        if (offsetPreviewEntity) {
          setOffsetPreviewEntity(null);
        }
      }

      // Modify commands preview - show ghost of entities at new position
      if (
        (drawState.mode === "modifyMove" &&
          drawState.step === "selectDestination" &&
          drawState.basePoint) ||
        (drawState.mode === "modifyCopy" &&
          drawState.step === "selectDestination" &&
          drawState.basePoint)
      ) {
        // Apply ortho constraint for preview
        const previewPos = effectiveOrtho
          ? applyOrtho(drawState.basePoint, worldPos)
          : worldPos;
        const dx = previewPos.x - drawState.basePoint.x;
        const dy = previewPos.y - drawState.basePoint.y;
        setMovingPreviewDelta({ x: dx, y: dy });
      } else if (
        drawState.mode === "modifyRotate" &&
        drawState.step === "selectAngle" &&
        drawState.basePoint
      ) {
        // Calculate angle from mouse position
        let angle = Math.atan2(
          worldPos.y - drawState.basePoint.y,
          worldPos.x - drawState.basePoint.x,
        );

        // Apply ortho constraint: snap FINAL angle to 0°, 90°, 180°, 270° (absolute direction)
        if (effectiveOrtho) {
          const snapAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
          let nearestAngle = 0;
          let minDiff = Math.PI * 2;
          for (const snapAngle of snapAngles) {
            let diff = Math.abs(angle - snapAngle);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            if (diff < minDiff) {
              minDiff = diff;
              nearestAngle = snapAngle;
            }
          }
          angle = nearestAngle;
        }

        const startAngle = drawState.startAngle ?? 0;
        const rotationAngle = angle - startAngle;

        // Store rotation delta as x: angle
        setMovingPreviewDelta({ x: rotationAngle, y: 0 });
      } else if (
        drawState.mode === "modifyMirror" &&
        drawState.step === "selectSecond" &&
        drawState.firstPoint
      ) {
        // Apply ortho constraint for mirror line preview
        const previewPos = effectiveOrtho
          ? applyOrtho(drawState.firstPoint, worldPos)
          : worldPos;
        // Store mirror line as delta
        setMovingPreviewDelta({
          x: previewPos.x - drawState.firstPoint.x,
          y: previewPos.y - drawState.firstPoint.y,
        });
      } else if (
        drawState.mode === "modifyScale" &&
        drawState.step === "selectScale" &&
        drawState.basePoint
      ) {
        const dist = distance(worldPos, drawState.basePoint);
        // Store scale factor as x
        setMovingPreviewDelta({ x: dist / 100, y: 0 });
      } else if (
        movingPreviewDelta !== null &&
        ![
          "moving",
          "modifyMove",
          "modifyCopy",
          "modifyRotate",
          "modifyMirror",
          "modifyScale",
        ].includes(drawState.mode)
      ) {
        // Clear preview delta when not in modify mode
        setMovingPreviewDelta(null);
      }
    },
    [
      activeTool,
      dimensions,
      drawState,
      effectiveOrtho,
      entities,
      findOsnapPoint,
      gridSpacing,
      hitTolerance,
      isPanning,
      movingPreviewDelta,
      offsetPreviewEntity,
      onMouseMove,
      panStart,
      screenToWorld,
      selectedDimensionIds,
      snapToGrid,
      onDimensionUpdate,
      isControlled,
      commandDrawingActions, // ĐIỀU KIỆN 1: Command-based drawing
      commandDrawingIsActive,
      commandDrawingPoints,
      textHitTestContext, // TEXT hit test context
    ],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1) {
        setIsPanning(false);
        return;
      }

      if (drawState.mode === "selecting") {
        handleSelectionBoxComplete(
          {
            drawState,
            setDrawState,
            entities,
            dimensions,
            selectedIds,
            selectedDimensionIds,
            selectEntities,
            onPromptChange,
            onDimensionSelect,
          },
          e,
        );
        return;
      }

      if (drawState.mode === "moving") {
        // Tính delta di chuyển (use ref to avoid stale closure)
        const currentMousePos = mousePosRef.current;
        const dx = currentMousePos.x - drawState.startPos.x;
        const dy = currentMousePos.y - drawState.startPos.y;
        const movedIds = drawState.entities.map((e) => e.id);

        if (isControlled && onMoveEntities) {
          // Controlled mode: gọi callback để commit qua Commands
          // (preview được xử lý riêng - entities chưa được cập nhật thực sự)
          onMoveEntities(movedIds, dx, dy);
          setMovingPreviewDelta(null); // Reset preview
        } else {
          // Uncontrolled mode: entities đã được cập nhật trong handleMouseMove
          const movedEntities = getSelectedEntities();
          movedEntities.forEach((ent) => onEntityUpdated?.(ent));
        }

        // Also move selected doors (via Command)
        if (onDoorMove && selectedDoorIds.size > 0) {
          const doorIdsToMove = Array.from(selectedDoorIds);
          onDoorMove(doorIdsToMove, dx, dy);
        }

        const totalMoved = movedIds.length + selectedDoorIds.size;
        onPromptChange?.(`Moved ${totalMoved} object(s)`);
        setDrawState({ mode: "idle" });
        return;
      }

      if (drawState.mode === "movingDimension") {
        onPromptChange?.("Dimension offset adjusted");
        setDrawState({ mode: "idle" });
        return;
      }

      if (drawState.mode === "editingDimensionGrip") {
        onPromptChange?.("Dimension updated");
        setDrawState({ mode: "idle" });
        return;
      }
    },
    [
      dimensions,
      drawState,
      entities,
      selectedIds,
      selectedDimensionIds,
      selectEntities,
      getSelectedEntities,
      onEntityUpdated,
      onPromptChange,
      onDimensionSelect,
      isControlled,
      onMoveEntities,
      onDoorMove,
      selectedDoorIds,
    ],
  );

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
