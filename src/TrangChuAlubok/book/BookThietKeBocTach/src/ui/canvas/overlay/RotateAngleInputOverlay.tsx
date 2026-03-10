/**
 * RotateAngleInputOverlay — STEP-5 extraction from CadDrawingCanvas JSX
 *
 * Compact angle input overlay for ROTATE command, positioned near the cursor.
 */

"use client";

import React from "react";
import type { DrawingState } from "../canvas.types";

// ==================== Interface ====================

export interface RotateAngleInputOverlayProps {
  /** Rotate angle input state */
  rotateAngleInput: { active: boolean; value: string };
  /** Setter for rotate angle input state */
  setRotateAngleInput: React.Dispatch<
    React.SetStateAction<{ active: boolean; value: string }>
  >;
  /** Ref to the angle input element */
  rotateAngleInputRef: React.RefObject<HTMLInputElement | null>;
  /** Draw state — checked for mode & step */
  drawState: DrawingState;
  /** Setter for drawState */
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;
  /** Current mouse position in world coordinates */
  mousePos: { x: number; y: number };
  /** Canvas dimensions */
  canvasDimensions: { width: number; height: number };
  /** Pan offset */
  pan: { x: number; y: number };
  /** Zoom level */
  zoom: number;
  /** Handler for rotate angle input commit */
  handleRotateAngleInput: () => void;
  /** Callback for prompt */
  onPromptChange?: (msg: string) => void;
}

// ==================== Component ====================

export const RotateAngleInputOverlay: React.FC<
  RotateAngleInputOverlayProps
> = ({
  rotateAngleInput,
  setRotateAngleInput,
  rotateAngleInputRef,
  drawState,
  setDrawState,
  mousePos,
  canvasDimensions,
  pan,
  zoom,
  handleRotateAngleInput,
  onPromptChange,
}) => {
  if (
    !rotateAngleInput.active ||
    drawState.mode !== "modifyRotate" ||
    !("step" in drawState) ||
    drawState.step !== "selectAngle" ||
    !("basePoint" in drawState) ||
    !drawState.basePoint
  ) {
    return null;
  }

  // Calculate screen position near mouse (like LINE input)
  const centerX = canvasDimensions.width / 2 + pan.x;
  const centerY = canvasDimensions.height / 2 + pan.y;
  const screenX = centerX + mousePos.x * zoom;
  const screenY = centerY - mousePos.y * zoom;

  // Smart positioning like LINE overlay
  const overlayWidth = 80;
  const overlayHeight = 24;
  const offset = 15;
  const spaceOnRight = canvasDimensions.width - screenX;
  const showOnRight = spaceOnRight > overlayWidth + offset;
  const spaceBelow = canvasDimensions.height - screenY;
  const showBelow = spaceBelow > overlayHeight + offset;
  const overlayLeft = showOnRight
    ? screenX + offset
    : screenX - overlayWidth - offset;
  const overlayTop = showBelow
    ? screenY + offset
    : screenY - overlayHeight - offset;
  const clampedLeft = Math.max(
    5,
    Math.min(overlayLeft, canvasDimensions.width - overlayWidth - 5),
  );
  const clampedTop = Math.max(
    5,
    Math.min(overlayTop, canvasDimensions.height - overlayHeight - 5),
  );

  return (
    <div
      style={{
        position: "absolute",
        left: clampedLeft,
        top: clampedTop,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        gap: 4,
        zIndex: 1000,
        pointerEvents: "auto",
        fontSize: 10,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span style={{ color: "#4a90d9", fontSize: 9 }}>A:</span>
      <input
        ref={rotateAngleInputRef}
        type="text"
        value={rotateAngleInput.value}
        onChange={(e) =>
          setRotateAngleInput((prev) => ({
            ...prev,
            value: e.target.value,
          }))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (rotateAngleInput.value.trim()) {
              handleRotateAngleInput();
            }
          } else if (e.key === "Escape") {
            e.preventDefault();
            setDrawState({ mode: "idle" });
            setRotateAngleInput({ active: false, value: "" });
            onPromptChange?.("ROTATE cancelled");
          }
        }}
        placeholder="°"
        style={{
          width: 45,
          padding: "2px 4px",
          border: "1px solid #4a90d9",
          borderRadius: 2,
          background: "#1a1a2e",
          color: "#fff",
          fontSize: 10,
          outline: "none",
          textAlign: "right",
        }}
      />
      <span style={{ color: "#888", fontSize: 9 }}>°</span>
    </div>
  );
};
