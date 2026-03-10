/**
 * useToolChangeEffect  STEP-5 extraction from CadDrawingCanvas
 *
 * Owns: Tool change prompt + modify mode initialization effect
 */

import { useEffect, useRef } from "react";
import { ToolMode } from "../../../core/engine/EngineState";
import type { DrawingState } from "../canvas.types";
import { getToolType, getToolName } from "../utils";

// ==================== Interface ====================

export interface ToolChangeEffectParams {
  activeTool: ToolMode;
  selectedIds: string[];
  selectedDimensionIds: string[];
  selectedDoorIds: Set<string>;
  drawState: DrawingState;
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;
  qdimStep?: number;
  onPromptChange?: (msg: string) => void;
}

// ==================== Hook ====================

export function useToolChangeEffect(params: ToolChangeEffectParams): void {
  const {
    activeTool,
    selectedIds,
    selectedDimensionIds,
    selectedDoorIds,
    drawState,
    setDrawState,
    qdimStep,
    onPromptChange,
  } = params;

  // ==================== Tool Change Prompt ====================
  useEffect(() => {
    const toolName = getToolName(activeTool);
    if (activeTool === ToolMode.SELECT) {
      onPromptChange?.("SELECT: Click to select, drag for box select");
    } else if (activeTool === ToolMode.DRAW_DIM_LINEAR) {
      onPromptChange?.("DIMLINEAR: Specify first extension line origin");
    } else if (activeTool === ToolMode.DRAW_DIM_ALIGNED) {
      onPromptChange?.("DIMALIGNED: Specify first extension line origin");
    } else if (activeTool === ToolMode.DRAW_DIM_ANGULAR) {
      onPromptChange?.("DIMANGULAR: Select first line");
    } else if (activeTool === ToolMode.DRAW_DIM_RADIUS) {
      onPromptChange?.("DIMRADIUS: Select arc or circle");
    } else if (activeTool === ToolMode.DRAW_QDIM) {
      if (qdimStep === 0) {
        onPromptChange?.("QDIM: Select objects to dimension, then press Enter");
      } else if (qdimStep === 1) {
        onPromptChange?.("QDIM: Specify dimension line position");
      }
    } else if (activeTool === ToolMode.DRAW_DIMCONTINUE) {
      onPromptChange?.("DIMCONTINUE: Select continued dimension");
    } else if (activeTool === ToolMode.DRAW_DIMARC) {
      onPromptChange?.("DIMARC: Select arc");
    } else if (activeTool === ToolMode.DRAW_POLYGON) {
      onPromptChange?.("POLYGON Nhập số cạnh <6>:");
    } else if (toolName) {
      onPromptChange?.(`${toolName}: Specify first point`);
    } else {
      onPromptChange?.("Ready");
    }
  }, [activeTool, qdimStep, onPromptChange]);

  // ==================== Tool Change State Initialize ====================
  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    if (activeToolRef.current !== activeTool) {
      activeToolRef.current = activeTool;
      queueMicrotask(() => {
        const toolType = getToolType(activeTool);

        if (toolType === "modify") {
          const currentSelectedIds = selectedIds;
          const currentSelectedDimIds = selectedDimensionIds;

          // OFFSET
          if (activeTool === ToolMode.OFFSET) {
            setDrawState({
              mode: "modifyOffset",
              step: "enterDistance",
            });
            onPromptChange?.(
              "OFFSET: Specify offset distance or [Through] <10>:",
            );
            return;
          }

          // TRIM
          if (activeTool === ToolMode.TRIM) {
            setDrawState({
              mode: "modifyTrim",
              step: "selectEntity",
            });
            onPromptChange?.(
              "TRIM: Select object to trim (click on the part to remove)",
            );
            return;
          }

          // EXTEND
          if (activeTool === ToolMode.EXTEND) {
            setDrawState({
              mode: "modifyExtend",
              step: "selectEntity",
            });
            onPromptChange?.(
              "EXTEND: Select object to extend (click near the end to extend)",
            );
            return;
          }

          // FILLET
          if (activeTool === ToolMode.FILLET) {
            setDrawState({
              mode: "modifyFillet",
              step: "selectFirst",
              radius: 10,
            });
            onPromptChange?.(
              "FILLET: Select first line (or type radius value)",
            );
            return;
          }

          // BOUNDARY
          if (activeTool === ToolMode.BOUNDARY) {
            setDrawState({
              mode: "modifyBoundary",
              step: "pickPoint",
            });
            onPromptChange?.(
              "BOUNDARY: Pick internal point to create boundary polyline",
            );
            return;
          }

          if (
            currentSelectedIds.length === 0 &&
            currentSelectedDimIds.length === 0 &&
            selectedDoorIds.size === 0
          ) {
            // No selection  "command first, select later" workflow
            if (activeTool === ToolMode.MOVE) {
              setDrawState({
                mode: "modifyMove",
                step: "selectObjects",
                entityIds: [],
                dimensionIds: [],
                doorIds: [],
              });
              onPromptChange?.(
                "MOVE: Select objects (press Space/Enter when done)",
              );
              return;
            }
            if (activeTool === ToolMode.COPY) {
              setDrawState({
                mode: "modifyCopy",
                step: "selectObjects",
                entityIds: [],
                dimensionIds: [],
                doorIds: [],
              });
              onPromptChange?.(
                "COPY: Select objects (press Space/Enter when done)",
              );
              return;
            }
            if (activeTool === ToolMode.ROTATE) {
              setDrawState({
                mode: "modifyRotate",
                step: "selectObjects",
                entityIds: [],
                dimensionIds: [],
                doorIds: [],
              });
              onPromptChange?.(
                "ROTATE: Select objects (press Space/Enter when done)",
              );
              return;
            }
            if (activeTool === ToolMode.MIRROR) {
              setDrawState({
                mode: "modifyMirror",
                step: "selectObjects",
                entityIds: [],
                dimensionIds: [],
                doorIds: [],
              });
              onPromptChange?.(
                "MIRROR: Select objects (press Space/Enter when done)",
              );
              return;
            }
            if (activeTool === ToolMode.SCALE) {
              setDrawState({
                mode: "modifyScale",
                step: "selectObjects",
                entityIds: [],
                dimensionIds: [],
                doorIds: [],
              });
              onPromptChange?.(
                "SCALE: Select objects (press Space/Enter when done)",
              );
              return;
            }
            onPromptChange?.("Select objects: ");
            setDrawState({ mode: "idle" });
            return;
          }

          // Initialize the appropriate modify mode
          switch (activeTool) {
            case ToolMode.MOVE:
              setDrawState({
                mode: "modifyMove",
                step: "selectBase",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
                doorIds: Array.from(selectedDoorIds),
              });
              onPromptChange?.("MOVE: Specify base point");
              break;
            case ToolMode.COPY:
              setDrawState({
                mode: "modifyCopy",
                step: "selectBase",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
                doorIds: Array.from(selectedDoorIds),
              });
              onPromptChange?.("COPY: Specify base point");
              break;
            case ToolMode.ROTATE:
              setDrawState({
                mode: "modifyRotate",
                step: "selectBase",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
              });
              onPromptChange?.("ROTATE: Specify base point");
              break;
            case ToolMode.MIRROR:
              setDrawState({
                mode: "modifyMirror",
                step: "selectFirst",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
              });
              onPromptChange?.("MIRROR: Specify first point of mirror line");
              break;
            case ToolMode.SCALE:
              setDrawState({
                mode: "modifyScale",
                step: "selectBase",
                entityIds: currentSelectedIds,
                dimensionIds: currentSelectedDimIds,
              });
              onPromptChange?.("SCALE: Specify base point");
              break;
            default:
              setDrawState({ mode: "idle" });
          }
        } else {
          setDrawState({ mode: "idle" });
        }
      });
    }
  }, [activeTool, selectedIds, selectedDimensionIds, onPromptChange]);
}
