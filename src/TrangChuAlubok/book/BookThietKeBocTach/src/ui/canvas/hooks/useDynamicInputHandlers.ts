/**
 * useDynamicInputHandlers  STEP-5 extraction from CadDrawingCanvas
 *
 * Owns: handleRectDynamicInput, handleCircleDynamicInput, handleRotateAngleInput
 */

import { useCallback } from "react";
import type { Point } from "../types/CadEntity";
import type { DrawingState } from "../canvas.types";

// ==================== Interface ====================

export interface DynamicInputHandlersParams {
  dynamicInput: {
    value1: string;
    value2: string;
    [key: string]: unknown;
  };
  setDynamicInput: React.Dispatch<React.SetStateAction<any>>;
  rotateAngleInput: { active: boolean; value: string };
  setRotateAngleInput: React.Dispatch<React.SetStateAction<{ active: boolean; value: string }>>;
  drawState: DrawingState;
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;

  // Command drawing actions
  commandDrawingActions: {
    handleRectInput: (width: number, height: number) => boolean;
    handleCircleInput: (value: number, isDiameter: boolean) => boolean;
  };

  // Modify callbacks
  onModifyRotateComplete?: (
    entityIds: string[],
    dimensionIds: string[],
    basePoint: Point,
    angle: number,
  ) => void;
  onPromptChange?: (msg: string) => void;
}

export interface DynamicInputHandlersReturn {
  handleRectDynamicInput: () => void;
  handleCircleDynamicInput: (isDiameter: boolean) => void;
  handleRotateAngleInput: () => void;
}

// ==================== Hook ====================

export function useDynamicInputHandlers(
  params: DynamicInputHandlersParams,
): DynamicInputHandlersReturn {
  const {
    dynamicInput,
    setDynamicInput,
    rotateAngleInput,
    setRotateAngleInput,
    drawState,
    setDrawState,
    commandDrawingActions,
    onModifyRotateComplete,
    onPromptChange,
  } = params;

  const handleRectDynamicInput = useCallback(() => {
    const width = parseFloat(dynamicInput.value1);
    const height = parseFloat(dynamicInput.value2);

    if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
      onPromptChange?.("Vui lòng nhập chiều ngang và chiều dọc hợp lệ");
      return;
    }

    // ĐIỀU KIỆN 1: Command-based drawing (legacy fallback removed)
    if (commandDrawingActions.handleRectInput(width, height)) {
      setDynamicInput((prev: any) => ({
        ...prev,
        active: false,
        value1: "",
        value2: "",
      }));
    }
  }, [dynamicInput, commandDrawingActions, onPromptChange]);

  const handleCircleDynamicInput = useCallback(
    (isDiameter: boolean) => {
      const inputValue = isDiameter
        ? parseFloat(dynamicInput.value2)
        : parseFloat(dynamicInput.value1);

      if (isNaN(inputValue) || inputValue <= 0) {
        onPromptChange?.(
          `Vui lòng nhập ${isDiameter ? "đường kính" : "bán kính"} hợp lệ`,
        );
        return;
      }

      // ĐIỀU KIỆN 1: Command-based drawing (legacy fallback removed)
      if (commandDrawingActions.handleCircleInput(inputValue, isDiameter)) {
        setDynamicInput((prev: any) => ({
          ...prev,
          active: false,
          value1: "",
          value2: "",
        }));
      }
    },
    [dynamicInput, commandDrawingActions, onPromptChange],
  );

  // Handler for ROTATE angle input (enter angle in degrees)
  // AutoCAD Reference mode: entered angle is the TARGET angle (absolute position)
  // Rotation amount = targetAngle - startAngle
  // 0 = right (+X), 90 = up (+Y), 180 = left (-X), 270 = down (-Y)
  const handleRotateAngleInput = useCallback(() => {
    const targetAngleDegrees = parseFloat(rotateAngleInput.value);

    if (isNaN(targetAngleDegrees)) {
      onPromptChange?.("Please enter a valid angle in degrees");
      return;
    }

    // Check if in correct state
    if (
      drawState.mode !== "modifyRotate" ||
      drawState.step !== "selectAngle" ||
      !drawState.basePoint
    ) {
      return;
    }

    // Convert target angle to radians
    const targetAngle = (targetAngleDegrees * Math.PI) / 180;

    // Calculate rotation amount: how much to rotate from current position
    // startAngle is the angle from basePoint to referencePoint (current orientation)
    const startAngle = drawState.startAngle ?? 0;
    const rotationAngle = targetAngle - startAngle;

    // Call callback to execute rotate command
    onModifyRotateComplete?.(
      drawState.entityIds,
      drawState.dimensionIds,
      drawState.basePoint,
      rotationAngle,
    );

    // Reset state
    setDrawState({ mode: "idle" });
    setRotateAngleInput({ active: false, value: "" });

    // Display actual rotation performed
    const rotationDegrees = (rotationAngle * 180) / Math.PI;
    onPromptChange?.(
      `ROTATE completed (rotated ${rotationDegrees.toFixed(
        1,
      )} to ${targetAngleDegrees.toFixed(1)})`,
    );
  }, [
    rotateAngleInput.value,
    drawState,
    onModifyRotateComplete,
    onPromptChange,
  ]);

  return {
    handleRectDynamicInput,
    handleCircleDynamicInput,
    handleRotateAngleInput,
  };
}
