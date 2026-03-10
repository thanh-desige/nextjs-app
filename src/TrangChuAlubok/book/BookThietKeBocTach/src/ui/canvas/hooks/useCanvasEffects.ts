/**
 * useCanvasEffects - Miscellaneous canvas lifecycle effects
 * STEP-5: Extracted from CadDrawingCanvas.tsx
 *
 * Groups smaller effects that don't warrant their own hooks:
 * - Step change notification
 * - moveCopy angle window listener
 * - Canvas resize observer
 * - Entities change callback
 * - Offset distance update
 * - Rotate angle input activation
 * - Command lock reporting
 * - Global mouse up for panning
 * - Animation frame loop
 * - Wheel event listener
 */

import { useEffect, useRef } from "react";
import type { Point } from "../types/CadEntity";
import type { CadEntity } from "../types/CadEntity";
import type { DrawingState } from "../canvas.types";

interface CanvasEffectsParams {
  // Step notification
  drawState: DrawingState;
  onStepChange?: (step: number) => void;

  // moveCopy angle tracking
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  moveCopyAngleRef: React.MutableRefObject<number>;
  canvasDimensions: { width: number; height: number };
  pan: Point;
  zoom: number;

  // Resize
  containerRef: React.RefObject<HTMLDivElement | null>;
  setCanvasDimensions: React.Dispatch<
    React.SetStateAction<{ width: number; height: number }>
  >;

  // Entities change
  entities: CadEntity[];
  onEntitiesChange?: (entities: CadEntity[]) => void;

  // Offset distance
  offsetDistance?: number;
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;
  onPromptChange?: (prompt: string) => void;

  // Rotate angle activation
  rotateAngleInput: { active: boolean; value: string };
  setRotateAngleInput: React.Dispatch<
    React.SetStateAction<{ active: boolean; value: string }>
  >;
  rotateAngleInputRef: React.RefObject<HTMLInputElement | null>;

  // Command lock
  commandDrawingIsActive: boolean;
  onDrawingStateChange?: (isDrawing: boolean) => void;

  // Global mouse up for pan
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;

  // Animation frame
  draw: () => void;

  // Wheel listener
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
}

export function useCanvasEffects({
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
  commandDrawingIsActive,
  onDrawingStateChange,
  isPanning,
  setIsPanning,
  draw,
  handleWheel,
}: CanvasEffectsParams): void {
  // ==================== Step Change Notification ====================
  useEffect(() => {
    if (!onStepChange) return;

    let step = 0;

    if (drawState.mode === "idle") {
      step = 0;
    } else if (drawState.mode === "line") {
      step =
        "points" in drawState &&
        (drawState as { points: Point[] }).points.length > 0
          ? 1
          : 0;
    } else if (drawState.mode === "rect") {
      step = "corner1" in drawState && drawState.corner1 ? 1 : 0;
    } else if (drawState.mode === "circle") {
      step = "center" in drawState && drawState.center ? 1 : 0;
    } else if (
      drawState.mode === "modifyMove" ||
      drawState.mode === "modifyCopy"
    ) {
      if ("step" in drawState && drawState.step === "selectBase") step = 1;
      else if ("step" in drawState && drawState.step === "selectDestination")
        step = 2;
    } else if (drawState.mode === "modifyRotate") {
      if ("step" in drawState && drawState.step === "selectBase") step = 1;
      else if ("step" in drawState && drawState.step === "selectReference")
        step = 2;
      else if ("step" in drawState && drawState.step === "selectAngle")
        step = 3;
    } else if (drawState.mode === "modifyMirror") {
      if ("step" in drawState && drawState.step === "selectFirst") step = 1;
      else if ("step" in drawState && drawState.step === "selectSecond")
        step = 2;
    } else if (drawState.mode === "modifyScale") {
      if ("step" in drawState && drawState.step === "selectBase") step = 1;
      else if ("step" in drawState && drawState.step === "selectScale")
        step = 2;
    } else if (drawState.mode === "modifyOffset") {
      if ("step" in drawState && drawState.step === "enterDistance") step = 0;
      else if ("step" in drawState && drawState.step === "selectEntity")
        step = 1;
      else if ("step" in drawState && drawState.step === "selectSide") step = 2;
    }

    onStepChange(step);
  }, [drawState, onStepChange]);

  // ==================== moveCopy Angle Window Listener ====================
  useEffect(() => {
    if (
      (drawState.mode === "modifyMove" || drawState.mode === "modifyCopy") &&
      "basePoint" in drawState &&
      (drawState as { basePoint?: Point }).basePoint
    ) {
      const bp = (drawState as { basePoint: Point }).basePoint;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWindowMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        const centerX = canvasDimensions.width / 2 + pan.x;
        const centerY = canvasDimensions.height / 2 + pan.y;
        const worldX = (canvasX - centerX) / zoom;
        const worldY = -(canvasY - centerY) / zoom;

        const dirX = worldX - bp.x;
        const dirY = worldY - bp.y;
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len > 0.001) {
          moveCopyAngleRef.current = Math.atan2(dirY, dirX);
        }
      };

      window.addEventListener("mousemove", handleWindowMouseMove);

      const initialEvent = new MouseEvent("mousemove", {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2,
      });
      handleWindowMouseMove(initialEvent);

      return () =>
        window.removeEventListener("mousemove", handleWindowMouseMove);
    }
  }, [drawState, canvasDimensions, pan, zoom, canvasRef, moveCopyAngleRef]);

  // ==================== Resize Observer ====================
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      setCanvasDimensions({ width: canvas.width, height: canvas.height });
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, canvasRef, setCanvasDimensions]);

  // ==================== Entities Change Callback ====================
  useEffect(() => {
    onEntitiesChange?.(entities);
  }, [entities, onEntitiesChange]);

  // ==================== Offset Distance Update ====================
  const offsetDistanceRef = useRef(offsetDistance);
  useEffect(() => {
    offsetDistanceRef.current = offsetDistance;
  }, [offsetDistance]);

  useEffect(() => {
    if (
      offsetDistance !== undefined &&
      offsetDistance > 0 &&
      drawState.mode === "modifyOffset" &&
      "step" in drawState &&
      drawState.step === "enterDistance"
    ) {
      setTimeout(() => {
        setDrawState({
          mode: "modifyOffset",
          step: "selectEntity",
          distance: offsetDistance,
        } as DrawingState);
        onPromptChange?.(`OFFSET distance = ${offsetDistance}. Select object:`);
      }, 0);
    }
  }, [offsetDistance, drawState, onPromptChange, setDrawState]);

  // ==================== Rotate Angle Input Activation ====================
  const drawStateStep =
    "step" in drawState ? (drawState as { step: string }).step : null;

  useEffect(() => {
    if (drawState.mode === "modifyRotate" && drawStateStep === "selectAngle") {
      setRotateAngleInput({ active: true, value: "" });
      setTimeout(() => {
        rotateAngleInputRef.current?.focus();
        rotateAngleInputRef.current?.select();
      }, 50);
    } else {
      if (rotateAngleInput.active) {
        setRotateAngleInput({ active: false, value: "" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawState.mode, drawStateStep]);

  // ==================== Command Lock Reporting ====================
  useEffect(() => {
    const isCommandToolActive = commandDrawingIsActive;
    const isLegacyDrawing = drawState.mode !== "idle";
    const isDrawing = isCommandToolActive || isLegacyDrawing;
    onDrawingStateChange?.(isDrawing);
  }, [drawState.mode, commandDrawingIsActive, onDrawingStateChange]);

  // ==================== Global Mouse Up for Pan ====================
  useEffect(() => {
    if (!isPanning) return;

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 1 || !e.buttons) {
        setIsPanning(false);
      }
    };

    const handleBlur = () => setIsPanning(false);

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isPanning, setIsPanning]);

  // ==================== Animation Frame Loop ====================
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  // ==================== Wheel Event Listener ====================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e: WheelEvent) => {
      handleWheel(e as unknown as React.WheelEvent<HTMLCanvasElement>);
    };

    canvas.addEventListener("wheel", wheelHandler, { passive: false });
    return () => canvas.removeEventListener("wheel", wheelHandler);
  }, [handleWheel, canvasRef]);
}
