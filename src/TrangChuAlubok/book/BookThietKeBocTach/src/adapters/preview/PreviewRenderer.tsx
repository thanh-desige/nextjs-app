/**
 * PreviewRenderer - Adapter/Stub để render Door Preview Data
 *
 * ⚠️ STUB IMPLEMENTATION - Chỉ cung cấp interface và fallback
 * Full implementation sẽ được thêm sau khi có PreviewExporter
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Import từ: types/DoorPreviewData
 * - Được import bởi: ui/canvas/, ui/components/
 * - KHÔNG được import từ: door-engines/, analysis/, domain/
 */

"use client";

import React, { memo } from "react";
import type {
  DoorPreviewData,
  PreviewPath,
  PreviewRenderOptions,
  NormalizedPoint,
} from "../../types/DoorPreviewData";

// ==================== CONSTANTS ====================

const DEFAULT_COLORS = {
  frame: "#00CED1",
  sash: "#4169E1",
  glass: "#9ACD32",
  mullions: "#00CED1",
  decorations: "#888888",
  auxiliary: "#666666",
  hinge: "#FF4444",
  handle: "#FF6B6B",
  connector: "#00FFFF",
};

// ==================== INTERFACES ====================

export interface PreviewRendererProps {
  /** Preview data (nếu có) */
  previewData?: DoorPreviewData | null;
  /** Render options */
  options: PreviewRenderOptions;
  /** Canvas scale (để tính stroke width) */
  canvasScale?: number;
  /** Transform (position on canvas) */
  transform?: {
    x: number;
    y: number;
    rotation?: number;
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Scale normalized point (0-1) to target size
 */
function scalePoint(
  point: NormalizedPoint,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

/**
 * Render một path
 */
function renderPath(
  path: PreviewPath,
  width: number,
  height: number,
  colorOverride?: string
): React.ReactNode {
  const stroke = colorOverride || path.style.stroke;
  const strokeWidth = path.style.strokeWidth * width;
  const fill = path.style.fill || "none";

  switch (path.type) {
    case "line": {
      if (path.points.length < 2) return null;
      const p1 = scalePoint(path.points[0], width, height);
      const p2 = scalePoint(path.points[1], width, height);
      return (
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }

    case "rect": {
      if (path.points.length < 2) return null;
      const topLeft = scalePoint(path.points[0], width, height);
      const bottomRight = scalePoint(path.points[1], width, height);
      return (
        <rect
          x={topLeft.x}
          y={topLeft.y}
          width={bottomRight.x - topLeft.x}
          height={bottomRight.y - topLeft.y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={fill}
        />
      );
    }

    case "polyline": {
      if (path.points.length < 2) return null;
      const pointsStr = path.points
        .map((p) => {
          const scaled = scalePoint(p, width, height);
          return `${scaled.x},${scaled.y}`;
        })
        .join(" ");
      return (
        <polyline
          points={pointsStr}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={fill}
        />
      );
    }

    default:
      return null;
  }
}

// ==================== FALLBACK RENDERER ====================

/**
 * Render fallback khi không có preview data
 * Vẽ hình chữ nhật đơn giản với X ở giữa
 */
function renderFallback(
  width: number,
  height: number,
  _canvasScale: number
): React.ReactNode {
  const strokeWidth = Math.max(1, width * 0.01);

  return (
    <>
      {/* Outer frame */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        stroke={DEFAULT_COLORS.frame}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* X mark */}
      <line
        x1={width * 0.2}
        y1={height * 0.2}
        x2={width * 0.8}
        y2={height * 0.8}
        stroke={DEFAULT_COLORS.auxiliary}
        strokeWidth={strokeWidth * 0.5}
        strokeDasharray="4,4"
      />
      <line
        x1={width * 0.8}
        y1={height * 0.2}
        x2={width * 0.2}
        y2={height * 0.8}
        stroke={DEFAULT_COLORS.auxiliary}
        strokeWidth={strokeWidth * 0.5}
        strokeDasharray="4,4"
      />
      {/* "No Preview" text placeholder */}
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.min(width, height) * 0.08}
        fill={DEFAULT_COLORS.auxiliary}
      >
        Preview N/A
      </text>
    </>
  );
}

// ==================== MAIN COMPONENT ====================

/**
 * PreviewRenderer - Render door preview từ DoorPreviewData
 *
 * Nếu không có previewData → render fallback
 * Nếu có previewData → render các layers theo thứ tự
 */
export const PreviewRenderer = memo(function PreviewRenderer({
  previewData,
  options,
  canvasScale = 1,
  transform,
}: PreviewRendererProps) {
  const { targetWidth, targetHeight, showMarkers, colorOverrides, opacity } =
    options;

  const groupTransform = transform
    ? `translate(${transform.x}, ${transform.y}) rotate(${
        transform.rotation || 0
      })`
    : undefined;

  const groupOpacity = opacity ?? 1;

  // Không có preview data → fallback
  if (!previewData) {
    return (
      <g transform={groupTransform} opacity={groupOpacity}>
        {renderFallback(targetWidth, targetHeight, canvasScale)}
      </g>
    );
  }

  // Có preview data → render layers
  const { layers, markers } = previewData;

  // Layer order (từ dưới lên trên)
  const layerOrder: (keyof typeof layers)[] = [
    "auxiliary",
    "glass",
    "mullions",
    "sash",
    "frame",
    "decorations",
  ];

  return (
    <g transform={groupTransform} opacity={groupOpacity}>
      {/* Render layers */}
      {layerOrder.map((layerName) => {
        const paths = layers[layerName];
        if (!paths || paths.length === 0) return null;

        const colorOverride =
          colorOverrides?.[layerName as keyof typeof colorOverrides];

        return (
          <g key={layerName} data-layer={layerName}>
            {paths.map((path, idx) => (
              <React.Fragment key={`${layerName}-${idx}`}>
                {renderPath(path, targetWidth, targetHeight, colorOverride)}
              </React.Fragment>
            ))}
          </g>
        );
      })}

      {/* Render markers (optional) */}
      {showMarkers && (
        <g data-layer="markers">
          {/* Hinges */}
          {markers.hinges.map((hinge, idx) => {
            const pos = scalePoint(hinge, targetWidth, targetHeight);
            const size = Math.min(targetWidth, targetHeight) * 0.02;
            return (
              <rect
                key={`hinge-${idx}`}
                x={pos.x - size / 2}
                y={pos.y - size / 2}
                width={size}
                height={size}
                fill={DEFAULT_COLORS.hinge}
              />
            );
          })}

          {/* Handle */}
          {markers.handle &&
            (() => {
              const pos = scalePoint(markers.handle, targetWidth, targetHeight);
              const w = targetWidth * 0.015;
              const h = targetHeight * 0.04;
              return (
                <rect
                  x={pos.x - w / 2}
                  y={pos.y - h / 2}
                  width={w}
                  height={h}
                  fill={DEFAULT_COLORS.handle}
                />
              );
            })()}

          {/* Connectors */}
          {markers.connectors.map((conn, idx) => {
            const pos = scalePoint(conn, targetWidth, targetHeight);
            const size = Math.min(targetWidth, targetHeight) * 0.015;
            return (
              <polygon
                key={`conn-${idx}`}
                points={`${pos.x},${pos.y - size} ${pos.x + size},${pos.y} ${
                  pos.x
                },${pos.y + size} ${pos.x - size},${pos.y}`}
                fill={DEFAULT_COLORS.connector}
              />
            );
          })}
        </g>
      )}
    </g>
  );
});

// ==================== EXPORTS ====================

export default PreviewRenderer;

/**
 * Type guard: kiểm tra có preview data không
 */
export function hasPreviewData(
  data: DoorPreviewData | null | undefined
): data is DoorPreviewData {
  return data !== null && data !== undefined && data.version === "1.0";
}

/**
 * Stub: Load preview data (sẽ implement sau)
 * Hiện tại trả về null
 */
export async function loadPreviewData(
  _templateId: string
): Promise<DoorPreviewData | null> {
  // TODO: Implement khi có PreviewExporter
  // Sẽ load từ: /door-previews/{templateId}.json
  console.warn("[PreviewRenderer] loadPreviewData not implemented yet");
  return null;
}

/**
 * Stub: Check if preview exists (sẽ implement sau)
 */
export function hasStoredPreview(_templateId: string): boolean {
  // TODO: Implement khi có PreviewExporter
  return false;
}
