/**
 * OsnapOverlay - Renders object snap markers
 * Pure rendering component - displays snap points detected by engine
 */

"use client";

import React from "react";

export interface OsnapPoint {
  x: number;
  y: number;
  type:
    | "endpoint"
    | "midpoint"
    | "center"
    | "intersection"
    | "perpendicular"
    | "nearest"
    | "quadrant";
}

export interface OsnapOverlayProps {
  width: number;
  height: number;
  osnapPoint: OsnapPoint | null;
  pan: { x: number; y: number };
  zoom: number;
  markerSize?: number;
}

const OSNAP_COLORS: Record<string, string> = {
  endpoint: "#00FF00",
  midpoint: "#00FFFF",
  center: "#FF00FF",
  intersection: "#FFFF00",
  perpendicular: "#00FF00",
  nearest: "#FFA500",
  quadrant: "#00FFFF",
};

const OSNAP_LABELS: Record<string, string> = {
  endpoint: "END",
  midpoint: "MID",
  center: "CEN",
  intersection: "INT",
  perpendicular: "PER",
  nearest: "NEA",
  quadrant: "QUA",
};

export const OsnapOverlay: React.FC<OsnapOverlayProps> = ({
  width,
  height,
  osnapPoint,
  pan,
  zoom,
  markerSize = 8,
}) => {
  if (!osnapPoint || width <= 0 || height <= 0) {
    return null;
  }

  const centerX = width / 2 + pan.x;
  const centerY = height / 2 + pan.y;

  // Convert world to screen
  const screenX = centerX + osnapPoint.x * zoom;
  const screenY = centerY - osnapPoint.y * zoom;

  const color = OSNAP_COLORS[osnapPoint.type] || "#00FF00";
  const label = OSNAP_LABELS[osnapPoint.type] || "";

  const renderMarker = () => {
    const halfSize = markerSize / 2;

    switch (osnapPoint.type) {
      case "endpoint":
        // Square marker
        return (
          <rect
            x={screenX - halfSize}
            y={screenY - halfSize}
            width={markerSize}
            height={markerSize}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        );

      case "midpoint":
        // Triangle marker
        return (
          <polygon
            points={`${screenX},${screenY - halfSize} ${screenX - halfSize},${
              screenY + halfSize
            } ${screenX + halfSize},${screenY + halfSize}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        );

      case "center":
        // Circle marker
        return (
          <circle
            cx={screenX}
            cy={screenY}
            r={halfSize}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        );

      case "intersection":
        // X marker
        return (
          <g>
            <line
              x1={screenX - halfSize}
              y1={screenY - halfSize}
              x2={screenX + halfSize}
              y2={screenY + halfSize}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={screenX + halfSize}
              y1={screenY - halfSize}
              x2={screenX - halfSize}
              y2={screenY + halfSize}
              stroke={color}
              strokeWidth={2}
            />
          </g>
        );

      case "perpendicular":
        // Right angle marker
        return (
          <g>
            <line
              x1={screenX - halfSize}
              y1={screenY}
              x2={screenX}
              y2={screenY}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={screenX}
              y1={screenY}
              x2={screenX}
              y2={screenY - halfSize}
              stroke={color}
              strokeWidth={2}
            />
          </g>
        );

      case "nearest":
        // Hourglass marker
        return (
          <g>
            <line
              x1={screenX - halfSize}
              y1={screenY - halfSize}
              x2={screenX + halfSize}
              y2={screenY + halfSize}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={screenX - halfSize}
              y1={screenY + halfSize}
              x2={screenX + halfSize}
              y2={screenY - halfSize}
              stroke={color}
              strokeWidth={2}
            />
          </g>
        );

      case "quadrant":
        // Diamond marker
        return (
          <polygon
            points={`${screenX},${screenY - halfSize} ${
              screenX + halfSize
            },${screenY} ${screenX},${screenY + halfSize} ${
              screenX - halfSize
            },${screenY}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        );

      default:
        return <circle cx={screenX} cy={screenY} r={3} fill={color} />;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      {renderMarker()}
      {/* Label */}
      <text
        x={screenX + markerSize + 4}
        y={screenY - 4}
        fill={color}
        fontSize={10}
        fontFamily="monospace"
      >
        {label}
      </text>
    </svg>
  );
};

export default OsnapOverlay;
