/**
 * DynamicInputOverlay - AutoCAD-style dynamic input for dimension entry
 * Separated from CadDrawingCanvas for better maintainability
 */

"use client";

import React, { useRef, useEffect } from "react";
import type { Point, CadEntity } from "../types/CadEntity";

// Re-export for backward compatibility
export type { Point, CadEntity };

// ==================== Types ====================

export interface DynamicInputState {
  active: boolean;
  mode:
    | "length"
    | "width-height"
    | "radius-diameter"
    | "sides-radius"
    | "move-copy"
    | "offset-distance";
  value1: string;
  value2: string;
  focusField: 1 | 2;
  screenPos: Point; // position for the input overlay
}

export interface DrawingState {
  mode: string;
  points?: Point[];
  corner1?: Point | null;
  center?: Point | null;
}

export interface DynamicInputOverlayProps {
  dynamicInput: DynamicInputState;
  setDynamicInput: React.Dispatch<React.SetStateAction<DynamicInputState>>;
  drawState: DrawingState;
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;
  mousePos: Point;
  canvasDimensions: { width: number; height: number };
  pan: Point;
  zoom: number;
  currentLayerId: string;
  onAddEntity?: (entity: CadEntity) => void;
  setInternalEntities?: React.Dispatch<React.SetStateAction<CadEntity[]>>;
  onPromptChange?: (prompt: string) => void;
  // Handlers for rect/circle
  handleRectDynamicInput: () => void;
  handleCircleDynamicInput: (isDiameter: boolean) => void;
  // Handler for finishing command-based drawing (Space/Enter with empty input)
  onFinishDrawing?: () => void;
  // Handler for LINE input with length/angle (command-based)
  onLineInput?: (length: number, angle: number) => void;
  // Handler for POLYGON input with sides/radius (command-based)
  onPolygonInput?: (sides: number, radius: number) => void;
  // Current polygon sides (for display)
  polygonSides?: number;
  // Current drawing points count (for re-focus after click)
  pointsCount?: number;
  // Last point from command-based drawing (for calculating angle from mouse)
  lastPoint?: Point | null;
  // Ortho mode - when enabled, angle is constrained to 0/90/180/270
  orthoMode?: boolean;
  // Ortho angle (in radians) - pre-calculated from lastPoint to ortho-constrained mouse position
  orthoAngle?: number;
  // Toggle Ortho mode (F8)
  onToggleOrtho?: () => void;
  // ==================== MOVE/COPY Props ====================
  // Handler for MOVE/COPY input with distance/angle
  onMoveCopyInput?: (distance: number, angle: number) => void;
  // MOVE or COPY mode indicator
  moveCopyMode?: "MOVE" | "COPY" | null;
  // Base point for MOVE/COPY (to calculate angle from mouse)
  moveCopyBasePoint?: Point | null;
  // Cancel MOVE/COPY
  onMoveCopyCancel?: () => void;
  // Current angle from basePoint to mouse (ref for realtime access)
  moveCopyAngleRef?: React.RefObject<number>;
  // Ref to get real-time mouse position (for MOVE/COPY direction calculation)
  mousePosRef?: React.RefObject<Point>;
  // Canvas ref for accurate mouse position calculation
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  // ==================== OFFSET Props ====================
  // Handler for OFFSET distance input
  onOffsetDistanceInput?: (distance: number) => void;
  // Cancel OFFSET
  onOffsetCancel?: () => void;
}

// ==================== Styles ====================

const inputStyle = (isFocused: boolean, borderColor: string = "#4a90d9") => ({
  padding: "2px 4px",
  border: isFocused ? `1px solid ${borderColor}` : "1px solid #555",
  borderRadius: 2,
  background: "#1a1a2e",
  color: "#fff",
  fontSize: 10,
  outline: "none",
});

const labelStyle = (isFocused: boolean, activeColor: string = "#4a90d9") => ({
  color: isFocused ? activeColor : "#888",
  fontSize: 9,
});

// ==================== RULE 2: Numeric Input Filter ====================
// Chỉ cho phép: số, dấu chấm, dấu trừ (cho số âm), @, <, dấu phẩy (coordinate separator)
const filterNumericInput = (value: string): string => {
  // Cho phép: 0-9, ., -, @, <, , (để nhập: 100, -50, 100<45, @50,50)
  return value.replace(/[^0-9.,\-@<]/g, "");
};

// ==================== Component ====================

export const DynamicInputOverlay: React.FC<DynamicInputOverlayProps> = ({
  dynamicInput,
  setDynamicInput,
  drawState,
  setDrawState,
  mousePos,
  canvasDimensions,
  pan,
  zoom,
  currentLayerId,
  onAddEntity,
  setInternalEntities,
  onPromptChange,
  handleRectDynamicInput,
  handleCircleDynamicInput,
  onFinishDrawing,
  onLineInput,
  onPolygonInput,
  polygonSides = 6,
  pointsCount = 0,
  lastPoint = null,
  orthoMode = false,
  orthoAngle,
  onToggleOrtho,
  // MOVE/COPY props
  onMoveCopyInput,
  moveCopyMode = null,
  moveCopyBasePoint = null,
  onMoveCopyCancel,
  mousePosRef,
  canvasRef,
  moveCopyAngleRef,
  // OFFSET props
  onOffsetDistanceInput,
  onOffsetCancel,
}) => {
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);

  // Track real-time mouse position via document listener (for MOVE/COPY direction)
  const localMousePosRef = useRef<Point | null>(null);

  useEffect(() => {
    if (
      dynamicInput.active &&
      dynamicInput.mode === "move-copy" &&
      moveCopyBasePoint
    ) {
      const handleDocumentMouseMove = (e: MouseEvent) => {
        // Get canvas bounding rect for accurate position calculation
        const canvas = canvasRef?.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // Calculate mouse position relative to canvas
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        // Convert to world coords (same logic as CadDrawingCanvas handleMouseMove)
        const centerX = canvasDimensions.width / 2 + pan.x;
        const centerY = canvasDimensions.height / 2 + pan.y;
        const worldX = (canvasX - centerX) / zoom;
        const worldY = -(canvasY - centerY) / zoom;
        localMousePosRef.current = { x: worldX, y: worldY };
      };

      document.addEventListener("mousemove", handleDocumentMouseMove);
      return () =>
        document.removeEventListener("mousemove", handleDocumentMouseMove);
    }
  }, [
    dynamicInput.active,
    dynamicInput.mode,
    moveCopyBasePoint,
    canvasDimensions,
    pan,
    zoom,
  ]);

  // Note: F8 is handled globally by CadDrawingCanvas with capture phase
  // No need to handle F8 here

  // Focus management - focus input when overlay becomes active or points change
  // Use setTimeout to ensure focus happens after canvas click event
  useEffect(() => {
    if (dynamicInput.active) {
      // Use multiple delayed attempts to ensure focus after canvas click event completes
      // This handles cases where the canvas steals focus
      const focusInput = () => {
        if (dynamicInput.focusField === 1) {
          inputRef1.current?.focus();
          inputRef1.current?.select();
        } else {
          inputRef2.current?.focus();
          inputRef2.current?.select();
        }
      };

      // Try multiple times with increasing delays to ensure focus
      const timeoutId1 = setTimeout(focusInput, 0);
      const timeoutId2 = setTimeout(focusInput, 50);
      const timeoutId3 = setTimeout(focusInput, 100);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
      };
    }
  }, [
    dynamicInput.active,
    dynamicInput.focusField,
    pointsCount,
    dynamicInput.mode,
  ]);

  if (!dynamicInput.active) return null;

  // Calculate screen position
  const centerX = canvasDimensions.width / 2 + pan.x;
  const centerY = canvasDimensions.height / 2 + pan.y;
  const screenX = centerX + mousePos.x * zoom;
  const screenY = centerY - mousePos.y * zoom;

  // Note: F8 is handled globally by CadDrawingCanvas, no need for handleF8 here

  // Helper to create entity
  const addEntity = (entity: CadEntity) => {
    if (onAddEntity) {
      onAddEntity(entity);
    } else if (setInternalEntities) {
      setInternalEntities((prev) => [...prev, entity]);
    }
  };

  // Handle line creation from length/angle input
  const handleLineInput = (length: number, angle: number) => {
    // Try command-based drawing first (ĐIỀU KIỆN 1)
    if (onLineInput) {
      onLineInput(length, angle);
      setDynamicInput((prev) => ({ ...prev, value1: "", value2: "" }));
      return;
    }

    // Legacy fallback
    if (
      drawState.mode === "line" &&
      drawState.points &&
      drawState.points.length > 0
    ) {
      const lastPoint = drawState.points[drawState.points.length - 1];
      const newPoint = {
        x: lastPoint.x + length * Math.cos(angle),
        y: lastPoint.y + length * Math.sin(angle),
      };

      const entity: CadEntity = {
        id: `line-${Date.now()}`,
        type: "line",
        points: [lastPoint, newPoint],
        color: "#ffffff",
        lineWidth: 1,
        layer: currentLayerId,
      };

      addEntity(entity);
      setDrawState({ mode: "line", points: [newPoint] });
      setDynamicInput((prev) => ({ ...prev, value1: "", value2: "" }));
    }
  };

  // Handle finish line drawing (Space/Enter with empty input)
  const handleFinishLine = () => {
    // Try command-based drawing first (ĐIỀU KIỆN 1)
    if (onFinishDrawing) {
      onFinishDrawing();
      return;
    }

    // Legacy fallback
    if (
      drawState.mode === "line" &&
      drawState.points &&
      drawState.points.length >= 2
    ) {
      const entity: CadEntity = {
        id: `polyline-${Date.now()}`,
        type: "polyline",
        points: [...drawState.points],
        color: "#ffffff",
        lineWidth: 1,
        layer: currentLayerId,
      };
      addEntity(entity);
    }
    setDrawState({ mode: "idle" });
    setDynamicInput((prev) => ({ ...prev, active: false }));
    onPromptChange?.("LINE: Command completed");
  };

  // Handle escape
  const handleEscape = () => {
    setDynamicInput((prev) => ({ ...prev, active: false }));
    setDrawState({ mode: "idle" });
  };

  // Tab to switch fields
  const handleTab = (
    nextField: 1 | 2,
    nextRef: React.RefObject<HTMLInputElement | null>
  ) => {
    setDynamicInput((prev) => ({ ...prev, focusField: nextField }));
    nextRef.current?.focus();
  };

  // Calculate overlay position with smart edge detection
  // Overlay width estimate: ~180px for line mode and move-copy mode, ~150px for others
  const overlayWidth =
    dynamicInput.mode === "length" || dynamicInput.mode === "move-copy"
      ? 180
      : dynamicInput.mode === "offset-distance"
      ? 140
      : 150;
  const overlayHeight = 30;
  // For move-copy mode, use larger offset to avoid overlapping with ΔX/ΔY display
  const offset = dynamicInput.mode === "move-copy" ? 45 : 15;

  // Determine if overlay should appear on left or right of cursor
  const spaceOnRight = canvasDimensions.width - screenX;
  const showOnRight = spaceOnRight > overlayWidth + offset;

  // Determine if overlay should appear above or below cursor
  const spaceBelow = canvasDimensions.height - screenY;
  const showBelow = spaceBelow > overlayHeight + offset;

  // Calculate final position
  const overlayLeft = showOnRight
    ? screenX + offset
    : screenX - overlayWidth - offset;
  const overlayTop = showBelow
    ? screenY + offset
    : screenY - overlayHeight - offset;

  // Clamp to canvas bounds to ensure visibility
  const clampedLeft = Math.max(
    5,
    Math.min(overlayLeft, canvasDimensions.width - overlayWidth - 5)
  );
  const clampedTop = Math.max(
    5,
    Math.min(overlayTop, canvasDimensions.height - overlayHeight - 5)
  );

  return (
    <div
      style={{
        position: "absolute",
        left: clampedLeft,
        top: clampedTop,
        background: "transparent",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "2px",
        zIndex: 1000,
        pointerEvents: "auto",
        fontSize: 10,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Line mode - length and angle input */}
      {dynamicInput.mode === "length" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={labelStyle(dynamicInput.focusField === 1)}>L:</span>
          <input
            ref={inputRef1}
            type="text"
            value={dynamicInput.value1}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value1: filterNumericInput(e.target.value),
              }))
            }
            onFocus={() =>
              setDynamicInput((prev) => ({ ...prev, focusField: 1 }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(2, inputRef2);
              } else if (
                e.key === "Enter" ||
                (e.key === " " && dynamicInput.value1.trim())
              ) {
                e.preventDefault();
                const length = parseFloat(dynamicInput.value1);
                let angle: number;
                if (dynamicInput.value2.trim()) {
                  // User entered angle explicitly
                  angle = (parseFloat(dynamicInput.value2) * Math.PI) / 180;
                } else if (orthoMode && orthoAngle !== undefined) {
                  // Ortho mode: use pre-calculated ortho angle (0, 90, 180, 270)
                  angle = orthoAngle;
                } else if (lastPoint) {
                  // Command-based drawing: use angle from lastPoint to mouse position
                  angle = Math.atan2(
                    mousePos.y - lastPoint.y,
                    mousePos.x - lastPoint.x
                  );
                } else if (
                  drawState.mode === "line" &&
                  drawState.points &&
                  drawState.points.length > 0
                ) {
                  // Legacy mode fallback
                  const legacyLastPoint =
                    drawState.points[drawState.points.length - 1];
                  angle = Math.atan2(
                    mousePos.y - legacyLastPoint.y,
                    mousePos.x - legacyLastPoint.x
                  );
                } else {
                  angle = 0;
                }
                if (!isNaN(length) && length > 0) {
                  handleLineInput(length, angle);
                }
              } else if (e.key === " " && !dynamicInput.value1.trim()) {
                e.preventDefault();
                handleFinishLine();
              } else if (e.key === "Escape") {
                handleEscape();
              }
            }}
            style={{ ...inputStyle(dynamicInput.focusField === 1), width: 50 }}
            placeholder="mm"
          />
          <span style={labelStyle(dynamicInput.focusField === 2, "#ffa500")}>
            A:
          </span>
          <input
            ref={inputRef2}
            type="text"
            value={dynamicInput.value2}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value2: filterNumericInput(e.target.value),
              }))
            }
            onFocus={() =>
              setDynamicInput((prev) => ({ ...prev, focusField: 2 }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(1, inputRef1);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const length = parseFloat(dynamicInput.value1);
                const angleDeg = parseFloat(dynamicInput.value2);
                if (!isNaN(length) && length > 0 && !isNaN(angleDeg)) {
                  const angle = (angleDeg * Math.PI) / 180;
                  handleLineInput(length, angle);
                }
              } else if (e.key === "Escape") {
                handleEscape();
              }
            }}
            style={{
              ...inputStyle(dynamicInput.focusField === 2, "#ffa500"),
              width: 40,
            }}
            placeholder="°"
          />
        </div>
      )}

      {/* Rect mode - width and height */}
      {dynamicInput.mode === "width-height" && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={labelStyle(dynamicInput.focusField === 1)}>W:</span>
          <input
            ref={inputRef1}
            type="text"
            value={dynamicInput.value1}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value1: filterNumericInput(e.target.value),
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(2, inputRef2);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleRectDynamicInput();
              } else if (e.key === "Escape") {
                handleEscape();
              }
            }}
            style={{ ...inputStyle(dynamicInput.focusField === 1), width: 45 }}
            placeholder="mm"
          />
          <span style={labelStyle(dynamicInput.focusField === 2)}>H:</span>
          <input
            ref={inputRef2}
            type="text"
            value={dynamicInput.value2}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value2: filterNumericInput(e.target.value),
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(1, inputRef1);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleRectDynamicInput();
              } else if (e.key === "Escape") {
                handleEscape();
              }
            }}
            style={{ ...inputStyle(dynamicInput.focusField === 2), width: 45 }}
            placeholder="mm"
          />
        </div>
      )}

      {/* Circle mode - radius/diameter */}
      {dynamicInput.mode === "radius-diameter" && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={labelStyle(dynamicInput.focusField === 1)}>R:</span>
          <input
            ref={inputRef1}
            type="text"
            value={dynamicInput.value1}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value1: filterNumericInput(e.target.value),
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(2, inputRef2);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCircleDynamicInput(false);
              } else if (e.key === "Escape") {
                handleEscape();
              }
            }}
            style={{ ...inputStyle(dynamicInput.focusField === 1), width: 45 }}
            placeholder="mm"
          />
          <span style={labelStyle(dynamicInput.focusField === 2)}>D:</span>
          <input
            ref={inputRef2}
            type="text"
            value={dynamicInput.value2}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value2: filterNumericInput(e.target.value),
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(1, inputRef1);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCircleDynamicInput(true);
              } else if (e.key === "Escape") {
                handleEscape();
              }
            }}
            style={{ ...inputStyle(dynamicInput.focusField === 2), width: 45 }}
            placeholder="mm"
          />
        </div>
      )}

      {/* Polygon mode - sides/radius */}
      {dynamicInput.mode === "sides-radius" && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={labelStyle(dynamicInput.focusField === 1, "#00cc66")}>
            S:
          </span>
          <input
            ref={inputRef1}
            type="text"
            value={dynamicInput.value1}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value1: filterNumericInput(e.target.value),
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(2, inputRef2);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                // Handle polygon input
                const sides = parseInt(dynamicInput.value1) || polygonSides;
                const radius = parseFloat(dynamicInput.value2);
                if (!isNaN(radius) && radius > 0 && sides >= 3) {
                  onPolygonInput?.(sides, radius);
                  setDynamicInput((prev) => ({
                    ...prev,
                    value1: "",
                    value2: "",
                  }));
                }
              } else if (e.key === "Escape") {
                handleEscape();
              }
            }}
            style={{
              ...inputStyle(dynamicInput.focusField === 1, "#00cc66"),
              width: 35,
            }}
            placeholder={String(polygonSides)}
          />
          <span style={labelStyle(dynamicInput.focusField === 2)}>R:</span>
          <input
            ref={inputRef2}
            type="text"
            value={dynamicInput.value2}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value2: filterNumericInput(e.target.value),
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(1, inputRef1);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                // Handle polygon input
                const sides = parseInt(dynamicInput.value1) || polygonSides;
                const radius = parseFloat(dynamicInput.value2);
                if (!isNaN(radius) && radius > 0 && sides >= 3) {
                  onPolygonInput?.(sides, radius);
                  setDynamicInput((prev) => ({
                    ...prev,
                    value1: "",
                    value2: "",
                  }));
                }
              } else if (e.key === "Escape") {
                handleEscape();
              }
            }}
            style={{ ...inputStyle(dynamicInput.focusField === 2), width: 45 }}
            placeholder="mm"
          />
        </div>
      )}

      {/* ==================== MOVE/COPY mode - same UI as LINE: L + A inputs ==================== */}
      {dynamicInput.mode === "move-copy" && moveCopyMode && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={labelStyle(
              dynamicInput.focusField === 1,
              moveCopyMode === "MOVE" ? "#4a90d9" : "#00cc66"
            )}
          >
            L:
          </span>
          <input
            ref={inputRef1}
            type="text"
            value={dynamicInput.value1}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value1: filterNumericInput(e.target.value),
              }))
            }
            onFocus={() =>
              setDynamicInput((prev) => ({ ...prev, focusField: 1 }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(2, inputRef2);
              } else if (
                e.key === "Enter" ||
                (e.key === " " && dynamicInput.value1.trim())
              ) {
                e.preventDefault();
                const input = dynamicInput.value1.trim();

                // Empty input = use mouse position (handled by parent as fallback)
                if (!input) {
                  return;
                }

                let dx = 0,
                  dy = 0;
                let parsed = false;

                // Check if input starts with @ (relative mode)
                if (input.startsWith("@")) {
                  const relInput = input.substring(1); // Remove @

                  // Try @d<angle format (polar)
                  const polarMatch = relInput.match(
                    /^(-?\d+\.?\d*)\s*<\s*(-?\d+\.?\d*)$/
                  );
                  if (polarMatch) {
                    const distance = parseFloat(polarMatch[1]);
                    const angleDeg = parseFloat(polarMatch[2]);
                    if (!isNaN(distance) && !isNaN(angleDeg)) {
                      const angleRad = (angleDeg * Math.PI) / 180;
                      dx = distance * Math.cos(angleRad);
                      dy = distance * Math.sin(angleRad);
                      parsed = true;
                    }
                  }

                  // Try @dx,dy format (cartesian)
                  if (!parsed) {
                    const cartMatch = relInput.match(
                      /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
                    );
                    if (cartMatch) {
                      dx = parseFloat(cartMatch[1]);
                      dy = parseFloat(cartMatch[2]);
                      if (!isNaN(dx) && !isNaN(dy)) {
                        parsed = true;
                      }
                    }
                  }
                } else {
                  // Default: number = distance
                  const distance = parseFloat(input);
                  if (!isNaN(distance) && distance !== 0) {
                    let angle: number;

                    // Check if user entered angle in field 2
                    if (dynamicInput.value2.trim()) {
                      // User entered angle explicitly
                      angle = (parseFloat(dynamicInput.value2) * Math.PI) / 180;
                    } else if (moveCopyBasePoint) {
                      // Calculate angle from basePoint to current mouse position (like LINE)
                      // Apply ortho constraint if enabled - snap to 0°, 90°, 180°, 270°
                      let effectiveX = mousePos.x;
                      let effectiveY = mousePos.y;

                      if (orthoMode) {
                        // Apply ortho: snap to horizontal or vertical
                        const dx = mousePos.x - moveCopyBasePoint.x;
                        const dy = mousePos.y - moveCopyBasePoint.y;
                        if (Math.abs(dx) > Math.abs(dy)) {
                          // Horizontal (0° or 180°)
                          effectiveY = moveCopyBasePoint.y;
                        } else {
                          // Vertical (90° or 270°)
                          effectiveX = moveCopyBasePoint.x;
                        }
                      }

                      angle = Math.atan2(
                        effectiveY - moveCopyBasePoint.y,
                        effectiveX - moveCopyBasePoint.x
                      );
                    } else {
                      angle = 0;
                    }

                    dx = distance * Math.cos(angle);
                    dy = distance * Math.sin(angle);
                    parsed = true;
                  }
                }

                if (parsed) {
                  // Calculate angle from dx, dy for callback
                  const angle = Math.atan2(dy, dx);
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  onMoveCopyInput?.(dist, angle);
                  // Reset input for next copy
                  setDynamicInput((prev) => ({
                    ...prev,
                    value1: "",
                    value2: "",
                  }));
                }
              } else if (e.key === " " && !dynamicInput.value1.trim()) {
                // Space with empty input - could finish multi-copy
                e.preventDefault();
              } else if (e.key === "Escape") {
                onMoveCopyCancel?.();
              }
            }}
            style={{
              ...inputStyle(
                dynamicInput.focusField === 1,
                moveCopyMode === "MOVE" ? "#4a90d9" : "#00cc66"
              ),
              width: 50,
            }}
            placeholder="mm"
          />
          <span style={labelStyle(dynamicInput.focusField === 2, "#ffa500")}>
            A:
          </span>
          <input
            ref={inputRef2}
            type="text"
            value={dynamicInput.value2}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value2: filterNumericInput(e.target.value),
              }))
            }
            onFocus={() =>
              setDynamicInput((prev) => ({ ...prev, focusField: 2 }))
            }
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                handleTab(1, inputRef1);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const distance = parseFloat(dynamicInput.value1);
                const angleDeg = parseFloat(dynamicInput.value2);
                if (!isNaN(distance) && distance > 0 && !isNaN(angleDeg)) {
                  const angle = (angleDeg * Math.PI) / 180;
                  onMoveCopyInput?.(distance, angle);
                  // Reset input for next copy
                  setDynamicInput((prev) => ({
                    ...prev,
                    value1: "",
                    value2: "",
                  }));
                }
              } else if (e.key === "Escape") {
                onMoveCopyCancel?.();
              }
            }}
            style={{
              ...inputStyle(dynamicInput.focusField === 2, "#ffa500"),
              width: 40,
            }}
            placeholder="°"
          />
        </div>
      )}

      {/* ==================== OFFSET mode - single distance input ==================== */}
      {dynamicInput.mode === "offset-distance" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              ...labelStyle(dynamicInput.focusField === 1, "#ff6b35"),
              fontWeight: "bold",
            }}
          >
            OFFSET:
          </span>
          <input
            ref={inputRef1}
            type="text"
            value={dynamicInput.value1}
            onChange={(e) =>
              setDynamicInput((prev) => ({
                ...prev,
                value1: filterNumericInput(e.target.value),
              }))
            }
            onFocus={() =>
              setDynamicInput((prev) => ({ ...prev, focusField: 1 }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                const distance = parseFloat(dynamicInput.value1);
                if (!isNaN(distance) && distance > 0) {
                  onOffsetDistanceInput?.(distance);
                  // Keep input for next offset (don't clear)
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                onOffsetCancel?.();
              }
            }}
            style={{
              ...inputStyle(dynamicInput.focusField === 1, "#ff6b35"),
              width: 60,
            }}
            placeholder="mm"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

export default DynamicInputOverlay;
