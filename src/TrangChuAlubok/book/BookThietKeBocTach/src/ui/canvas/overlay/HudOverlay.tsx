/**
 * HudOverlay - Heads-up display overlay
 * Shows mouse coordinates, dimension temp values, command feedback
 */

"use client";

import React from "react";

// CSS keyframes for cursor blink animation
const blinkKeyframes = `
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
`;

export interface Point {
  x: number;
  y: number;
}

export interface HudOverlayProps {
  width: number;
  height: number;
  mouseWorld: Point;
  zoom: number;
  orthoEnabled?: boolean;
  snapEnabled?: boolean;
  selectedCount?: number;
  commandPrompt?: string;
  dynamicInput?: {
    active: boolean;
    mode: string;
    value1: string;
    value2?: string;
    label1?: string;
    label2?: string;
  };
  screenPosition?: Point; // Position for dynamic input near cursor
  displacementInput?: string; // User's typed input for distance<angle
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  width,
  height,
  mouseWorld,
  zoom,
  orthoEnabled = false,
  snapEnabled = false,
  selectedCount = 0,
  commandPrompt,
  dynamicInput,
  screenPosition,
  displacementInput,
}) => {
  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "none",
      }}
    >
      {/* Inject keyframes for blink animation */}
      <style>{blinkKeyframes}</style>

      {/* Coordinate display - bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          background: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        X: {mouseWorld.x.toFixed(2)} Y: {mouseWorld.y.toFixed(2)} | Zoom:{" "}
        {(zoom * 100).toFixed(0)}%{orthoEnabled && " | ORTHO"}
        {snapEnabled && " | SNAP"}
        {selectedCount > 0 && ` | ${selectedCount} selected`}
      </div>

      {/* Command prompt - bottom center */}
      {commandPrompt && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "#0ff",
            padding: "4px 12px",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          {commandPrompt}
        </div>
      )}

      {/* Dynamic input near cursor */}
      {dynamicInput?.active && screenPosition && (
        <div
          style={{
            position: "absolute",
            left: screenPosition.x + 15,
            top: screenPosition.y + 15,
            background: "transparent",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            pointerEvents: "auto",
          }}
        >
          {/* User input field - highlighted when typing */}
          {displacementInput !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(0, 100, 200, 0.3)",
                padding: "2px 6px",
                borderRadius: 3,
                border: "1px solid #4a90d9",
              }}
            >
              <span
                style={{
                  color: "#0ff",
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                {displacementInput || "type distance<angle"}
                <span
                  style={{
                    animation: "blink 1s infinite",
                    marginLeft: 1,
                  }}
                >
                  |
                </span>
              </span>
            </div>
          )}
          {/* Distance and Angle display */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  color: "#888",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {dynamicInput.label1 || "D:"}
              </span>
              <span
                style={{
                  minWidth: 60,
                  padding: "2px 4px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  background: "#1a1a2e",
                  border: "1px solid #4a90d9",
                  borderRadius: 2,
                  color: "#fff",
                }}
              >
                {dynamicInput.value1}
              </span>
            </div>
            {dynamicInput.value2 !== undefined && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    color: "#888",
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                >
                  {dynamicInput.label2 || "A:"}
                </span>
                <span
                  style={{
                    minWidth: 60,
                    padding: "2px 4px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    background: "#1a1a2e",
                    border: "1px solid #888",
                    borderRadius: 2,
                    color: "#fff",
                  }}
                >
                  {dynamicInput.value2}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HudOverlay;
