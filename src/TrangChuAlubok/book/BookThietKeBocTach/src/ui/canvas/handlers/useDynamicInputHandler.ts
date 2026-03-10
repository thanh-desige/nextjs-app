/**
 * useDynamicInputHandler.ts - Dynamic Input handling hook
 *
 * Tách từ CadDrawingCanvas.tsx để giảm kích thước file và dễ bảo trì.
 * Xử lý nhập giá trị số trực tiếp (Rect: width x height, Circle: radius/diameter)
 */

import { useCallback } from "react";
import type { CadEntity } from "../utils/entityUtils";
import type { Point } from "../utils/geometry";

// ==================== Types ====================

export interface DynamicInputState {
  active: boolean;
  mode:
    | "none"
    | "rect"
    | "circle_radius"
    | "circle_diameter"
    | "polar"
    | "cartesian";
  value1: string;
  value2: string;
  focusField: 1 | 2;
}

export interface DrawStateForDynamicInput {
  mode: string;
  corner1?: Point;
  center?: Point;
}

export interface DynamicInputCallbacks {
  onAddEntity?: (entity: CadEntity) => void;
  onPromptChange?: (message: string) => void;
}

export interface DynamicInputConfig {
  dynamicInput: DynamicInputState;
  setDynamicInput: React.Dispatch<React.SetStateAction<DynamicInputState>>;
  drawState: DrawStateForDynamicInput;
  setDrawState: React.Dispatch<React.SetStateAction<DrawStateForDynamicInput>>;
  currentLayerId: string;

  // Command drawing integration
  commandDrawingActions: {
    handleRectInput: (width: number, height: number) => boolean;
    handleCircleInput: (value: number, isDiameter: boolean) => boolean;
  };

  // Legacy fallback
  onAddEntity?: (entity: CadEntity) => void;
  setInternalEntities?: React.Dispatch<React.SetStateAction<CadEntity[]>>;
  onPromptChange?: (message: string) => void;
}

export interface UseDynamicInputHandlerReturn {
  handleRectDynamicInput: () => void;
  handleCircleDynamicInput: (isDiameter: boolean) => void;
  resetDynamicInput: () => void;
  activateDynamicInput: (mode: DynamicInputState["mode"]) => void;
}

// ==================== Hook ====================

export function useDynamicInputHandler(
  config: DynamicInputConfig
): UseDynamicInputHandlerReturn {
  const {
    dynamicInput,
    setDynamicInput,
    drawState,
    setDrawState,
    currentLayerId,
    commandDrawingActions,
    onAddEntity,
    setInternalEntities,
    onPromptChange,
  } = config;

  // ==================== Rect Dynamic Input ====================
  const handleRectDynamicInput = useCallback(() => {
    const width = parseFloat(dynamicInput.value1);
    const height = parseFloat(dynamicInput.value2);

    if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
      onPromptChange?.("Vui lòng nhập chiều ngang và chiều dọc hợp lệ");
      return;
    }

    // ĐIỀU KIỆN 1: Try command-based drawing first
    if (commandDrawingActions.handleRectInput(width, height)) {
      setDynamicInput((prev) => ({
        ...prev,
        active: false,
        value1: "",
        value2: "",
      }));
      return;
    }

    // Legacy fallback
    if (drawState.mode === "rect" && drawState.corner1) {
      const corner1 = drawState.corner1;
      const corner2 = {
        x: corner1.x + width,
        y: corner1.y + height,
      };

      const entity: CadEntity = {
        id: `rect-${Date.now()}`,
        type: "rect",
        points: [corner1, corner2],
        color: "#ffffff",
        lineWidth: 1,
        layer: currentLayerId,
      };

      if (onAddEntity) {
        onAddEntity(entity);
      } else if (setInternalEntities) {
        setInternalEntities((prev) => [...prev, entity]);
      }

      onPromptChange?.(`Rectangle created: ${width} x ${height} mm`);
      setDrawState({ mode: "idle" });
      setDynamicInput((prev) => ({
        ...prev,
        active: false,
        value1: "",
        value2: "",
      }));
    }
  }, [
    dynamicInput,
    drawState,
    currentLayerId,
    commandDrawingActions,
    onAddEntity,
    setInternalEntities,
    onPromptChange,
    setDynamicInput,
    setDrawState,
  ]);

  // ==================== Circle Dynamic Input ====================
  const handleCircleDynamicInput = useCallback(
    (isDiameter: boolean) => {
      const inputValue = isDiameter
        ? parseFloat(dynamicInput.value2)
        : parseFloat(dynamicInput.value1);

      if (isNaN(inputValue) || inputValue <= 0) {
        onPromptChange?.(
          `Vui lòng nhập ${isDiameter ? "đường kính" : "bán kính"} hợp lệ`
        );
        return;
      }

      // ĐIỀU KIỆN 1: Try command-based drawing first
      if (commandDrawingActions.handleCircleInput(inputValue, isDiameter)) {
        setDynamicInput((prev) => ({
          ...prev,
          active: false,
          value1: "",
          value2: "",
        }));
        return;
      }

      // Legacy fallback
      const radius = isDiameter ? inputValue / 2 : inputValue;

      if (drawState.mode === "circle" && drawState.center) {
        const center = drawState.center;

        const entity: CadEntity = {
          id: `circle-${Date.now()}`,
          type: "circle",
          points: [center, { x: radius, y: 0 }], // points[1].x = radius
          color: "#ffffff",
          lineWidth: 1,
          layer: currentLayerId,
        };

        if (onAddEntity) {
          onAddEntity(entity);
        } else if (setInternalEntities) {
          setInternalEntities((prev) => [...prev, entity]);
        }

        onPromptChange?.(
          `Circle created: ${isDiameter ? "D" : "R"} = ${inputValue} mm`
        );
        setDrawState({ mode: "idle" });
        setDynamicInput((prev) => ({
          ...prev,
          active: false,
          value1: "",
          value2: "",
        }));
      }
    },
    [
      dynamicInput,
      drawState,
      currentLayerId,
      commandDrawingActions,
      onAddEntity,
      setInternalEntities,
      onPromptChange,
      setDynamicInput,
      setDrawState,
    ]
  );

  // ==================== Utility Functions ====================
  const resetDynamicInput = useCallback(() => {
    setDynamicInput({
      active: false,
      mode: "none",
      value1: "",
      value2: "",
      focusField: 1,
    });
  }, [setDynamicInput]);

  const activateDynamicInput = useCallback(
    (mode: DynamicInputState["mode"]) => {
      setDynamicInput({
        active: true,
        mode,
        value1: "",
        value2: "",
        focusField: 1,
      });
    },
    [setDynamicInput]
  );

  return {
    handleRectDynamicInput,
    handleCircleDynamicInput,
    resetDynamicInput,
    activateDynamicInput,
  };
}
