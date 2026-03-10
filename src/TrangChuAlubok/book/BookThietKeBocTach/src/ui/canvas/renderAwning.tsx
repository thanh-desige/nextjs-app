/**
 * renderAwning.tsx
 *
 * Awning window renderer (STEP-5.12)
 * Extracted from DoorRendererDetailed.tsx
 *
 * Renders: 3D trapezoid profiles, glass, triangle opening lines, handle, custom dims
 */

"use client";

import React from "react";
import { COLORS } from "./doorRendererPrimitives";

/**
 * Render cửa hất (awning) - Style giống SVG export
 * Bao gồm: Khung profile 3D, kính, đường mở tam giác, tay nắm
 */
export function renderAwning(
  width: number,
  height: number,
  frameT: number,
  sashT: number,
  canvasScale: number,
  showDimensions: boolean,
) {
  void sashT; // Available for future use

  // Độ dày profile (cho hiệu ứng 3D)
  const profileDepth = frameT * 0.8; // Độ sâu profile tạo viền nghiêng
  const innerFrameT = frameT * 0.8; // Khung trong (sash)

  // Tính toán vùng bên trong
  const outerX = 0;
  const outerY = 0;
  const innerX = frameT;
  const innerY = frameT;
  const innerW = width - frameT * 2;
  const innerH = height - frameT * 2;

  // Vùng kính (bên trong sash)
  const glassX = innerX + innerFrameT;
  const glassY = innerY + innerFrameT;
  const glassW = innerW - innerFrameT * 2;
  const glassH = innerH - innerFrameT * 2;

  // Màu sắc
  const profileColor = "#CCCCFF"; // Màu profile nhôm
  const glassColor = "#AAFFAA"; // Màu kính xanh lá
  const glassOpacity = 0.15;
  const openingLineColor = "#FF00FF"; // Màu đường mở (magenta)
  const handleColor = "#00FFFF"; // Màu tay nắm (cyan)

  return (
    <>
      {/* ===== KHUNG NGOÀI (FRAME) - 4 thanh profile 3D ===== */}

      {/* Thanh trên - hình thang */}
      <polygon
        points={`
          ${outerX},${outerY}
          ${outerX + width},${outerY}
          ${outerX + width - profileDepth},${outerY + profileDepth}
          ${outerX + profileDepth},${outerY + profileDepth}
        `}
        fill={profileColor}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* Thanh dưới - hình thang */}
      <polygon
        points={`
          ${outerX + profileDepth},${outerY + height - profileDepth}
          ${outerX + width - profileDepth},${outerY + height - profileDepth}
          ${outerX + width},${outerY + height}
          ${outerX},${outerY + height}
        `}
        fill={profileColor}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* Thanh trái - hình thang */}
      <polygon
        points={`
          ${outerX},${outerY}
          ${outerX + profileDepth},${outerY + profileDepth}
          ${outerX + profileDepth},${outerY + height - profileDepth}
          ${outerX},${outerY + height}
        `}
        fill={profileColor}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* Thanh phải - hình thang */}
      <polygon
        points={`
          ${outerX + width - profileDepth},${outerY + profileDepth}
          ${outerX + width},${outerY}
          ${outerX + width},${outerY + height}
          ${outerX + width - profileDepth},${outerY + height - profileDepth}
        `}
        fill={profileColor}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* ===== KHUNG TRONG (SASH) - 4 thanh profile 3D ===== */}

      {/* Sash - Thanh trên */}
      <polygon
        points={`
          ${innerX},${innerY}
          ${innerX + innerW},${innerY}
          ${innerX + innerW - innerFrameT},${innerY + innerFrameT}
          ${innerX + innerFrameT},${innerY + innerFrameT}
        `}
        fill={profileColor}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* Sash - Thanh dưới */}
      <polygon
        points={`
          ${innerX + innerFrameT},${innerY + innerH - innerFrameT}
          ${innerX + innerW - innerFrameT},${innerY + innerH - innerFrameT}
          ${innerX + innerW},${innerY + innerH}
          ${innerX},${innerY + innerH}
        `}
        fill={profileColor}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* Sash - Thanh trái */}
      <polygon
        points={`
          ${innerX},${innerY}
          ${innerX + innerFrameT},${innerY + innerFrameT}
          ${innerX + innerFrameT},${innerY + innerH - innerFrameT}
          ${innerX},${innerY + innerH}
        `}
        fill={profileColor}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* Sash - Thanh phải */}
      <polygon
        points={`
          ${innerX + innerW - innerFrameT},${innerY + innerFrameT}
          ${innerX + innerW},${innerY}
          ${innerX + innerW},${innerY + innerH}
          ${innerX + innerW - innerFrameT},${innerY + innerH - innerFrameT}
        `}
        fill={profileColor}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* ===== KÍNH ===== */}
      <rect
        x={glassX}
        y={glassY}
        width={glassW}
        height={glassH}
        fill={glassColor}
        fillOpacity={glassOpacity}
        stroke="#FFFFFF"
        strokeWidth={Math.max(0.5, 1 / canvasScale)}
      />

      {/* ===== ĐƯỜNG MỞ TAM GIÁC (bản lề ở trên, hất ra ngoài) ===== */}
      {/* Trong hệ CAD: Y tăng đi lên, nên đỉnh tam giác ở glassY + glassH (trên) */}
      {/* Đường chéo trái: từ đỉnh giữa TRÊN xuống góc DƯỚI trái */}
      <line
        x1={glassX + glassW / 2}
        y1={glassY + glassH}
        x2={glassX}
        y2={glassY}
        stroke={openingLineColor}
        strokeWidth={Math.max(2, 3 / canvasScale)}
      />

      {/* Đường chéo phải: từ đỉnh giữa TRÊN xuống góc DƯỚI phải */}
      <line
        x1={glassX + glassW / 2}
        y1={glassY + glassH}
        x2={glassX + glassW}
        y2={glassY}
        stroke={openingLineColor}
        strokeWidth={Math.max(2, 3 / canvasScale)}
      />

      {/* ===== TAY NẮM - nằm trong vùng SASH phía dưới (giữa innerY và glassY) ===== */}
      {(() => {
        // Vị trí tay nắm: giữa vùng sash dưới
        // Tính theo tỉ lệ SVG gốc: circle r=5, thanh dài ~47, khung ~421 width
        const handleCenterX = width / 2;
        const handleCenterY = (innerY + glassY) / 2; // Giữa sash bottom và kính bottom
        const handleRadius = width * 0.012; // ~1.2% width (r=5 / 421)
        const handleBarLength = width * 0.11; // ~11% width (47 / 421)
        const handleBarHalfHeight = width * 0.012; // Bằng radius

        return (
          <>
            {/* Đường ngang trên */}
            <line
              x1={handleCenterX}
              y1={handleCenterY + handleBarHalfHeight}
              x2={handleCenterX + handleBarLength}
              y2={handleCenterY + handleBarHalfHeight}
              stroke={openingLineColor}
              strokeWidth={Math.max(0.25, 0.5 / canvasScale)}
            />
            {/* Đường ngang dưới */}
            <line
              x1={handleCenterX}
              y1={handleCenterY - handleBarHalfHeight}
              x2={handleCenterX + handleBarLength}
              y2={handleCenterY - handleBarHalfHeight}
              stroke={openingLineColor}
              strokeWidth={Math.max(0.25, 0.5 / canvasScale)}
            />
            {/* Circle tay nắm */}
            <circle
              cx={handleCenterX}
              cy={handleCenterY}
              r={handleRadius}
              fill={handleColor}
              stroke={openingLineColor}
              strokeWidth={Math.max(0.25, 0.5 / canvasScale)}
            />
            {/* Thanh ngang từ circle đi sang phải */}
            <line
              x1={handleCenterX + handleRadius}
              y1={handleCenterY}
              x2={handleCenterX + handleBarLength}
              y2={handleCenterY}
              stroke={openingLineColor}
              strokeWidth={Math.max(0.25, 0.5 / canvasScale)}
            />
            {/* Đường dọc kết thúc */}
            <line
              x1={handleCenterX + handleBarLength}
              y1={handleCenterY - handleBarHalfHeight}
              x2={handleCenterX + handleBarLength}
              y2={handleCenterY + handleBarHalfHeight}
              stroke={openingLineColor}
              strokeWidth={Math.max(0.25, 0.5 / canvasScale)}
            />
          </>
        );
      })()}

      {/* Dimensions - Vẽ trực tiếp cho chính xác trong hệ CAD */}
      {showDimensions &&
        (() => {
          const dimOffset = width * 0.2; // Khoảng cách dim ra ngoài cửa
          const arrowSize = width * 0.015;
          const fontSize = Math.max(10, 14 / canvasScale);
          const strokeW = Math.max(0.5, 1 / canvasScale);
          const extLineGap = dimOffset * 0.1; // Khoảng cách từ cửa đến extension line

          return (
            <>
              {/* ===== DIM NGANG (width) - ở DƯỚI cửa ===== */}
              {/* Extension line trái */}
              <line
                x1={0}
                y1={-extLineGap}
                x2={0}
                y2={-dimOffset}
                stroke={COLORS.dimension}
                strokeWidth={strokeW * 0.5}
              />
              {/* Extension line phải */}
              <line
                x1={width}
                y1={-extLineGap}
                x2={width}
                y2={-dimOffset}
                stroke={COLORS.dimension}
                strokeWidth={strokeW * 0.5}
              />
              {/* Dimension line ngang */}
              <line
                x1={0}
                y1={-dimOffset * 0.8}
                x2={width}
                y2={-dimOffset * 0.8}
                stroke={COLORS.dimension}
                strokeWidth={strokeW}
              />
              {/* Arrow trái */}
              <polygon
                points={`
                  ${0},${-dimOffset * 0.8}
                  ${arrowSize},${-dimOffset * 0.8 + arrowSize * 0.5}
                  ${arrowSize},${-dimOffset * 0.8 - arrowSize * 0.5}
                `}
                fill={COLORS.dimension}
              />
              {/* Arrow phải */}
              <polygon
                points={`
                  ${width},${-dimOffset * 0.8}
                  ${width - arrowSize},${-dimOffset * 0.8 + arrowSize * 0.5}
                  ${width - arrowSize},${-dimOffset * 0.8 - arrowSize * 0.5}
                `}
                fill={COLORS.dimension}
              />
              {/* Text width - cần flip vì hệ CAD, offset để lọt lòng dim */}
              <g
                transform={`translate(${width / 2}, ${
                  -dimOffset * 0.8 - fontSize * 0.8
                }) scale(1, -1)`}
              >
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={COLORS.dimensionText}
                  fontSize={fontSize}
                  fontWeight="bold"
                >
                  {Math.round(width)}
                </text>
              </g>

              {/* ===== DIM DỌC (height) - ở BÊN PHẢI cửa ===== */}
              {/* Extension line dưới */}
              <line
                x1={width + extLineGap}
                y1={0}
                x2={width + dimOffset}
                y2={0}
                stroke={COLORS.dimension}
                strokeWidth={strokeW * 0.5}
              />
              {/* Extension line trên */}
              <line
                x1={width + extLineGap}
                y1={height}
                x2={width + dimOffset}
                y2={height}
                stroke={COLORS.dimension}
                strokeWidth={strokeW * 0.5}
              />
              {/* Dimension line dọc */}
              <line
                x1={width + dimOffset * 0.8}
                y1={0}
                x2={width + dimOffset * 0.8}
                y2={height}
                stroke={COLORS.dimension}
                strokeWidth={strokeW}
              />
              {/* Arrow dưới */}
              <polygon
                points={`
                  ${width + dimOffset * 0.8},${0}
                  ${width + dimOffset * 0.8 - arrowSize * 0.5},${arrowSize}
                  ${width + dimOffset * 0.8 + arrowSize * 0.5},${arrowSize}
                `}
                fill={COLORS.dimension}
              />
              {/* Arrow trên */}
              <polygon
                points={`
                  ${width + dimOffset * 0.8},${height}
                  ${width + dimOffset * 0.8 - arrowSize * 0.5},${
                  height - arrowSize
                }
                  ${width + dimOffset * 0.8 + arrowSize * 0.5},${
                  height - arrowSize
                }
                `}
                fill={COLORS.dimension}
              />
              {/* Text height - cần flip và rotate, offset để lọt lòng dim */}
              <g
                transform={`translate(${
                  width + dimOffset * 0.8 + fontSize * 0.8
                }, ${height / 2}) scale(1, -1) rotate(-90)`}
              >
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={COLORS.dimensionText}
                  fontSize={fontSize}
                  fontWeight="bold"
                >
                  {Math.round(height)}
                </text>
              </g>
            </>
          );
        })()}
    </>
  );
}
