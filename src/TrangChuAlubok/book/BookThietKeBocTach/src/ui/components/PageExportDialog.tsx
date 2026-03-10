/**
 * PageExportDialog - Inline export modal for BookThietKeBocTachPage
 *
 * STEP-5.22 extraction from BookThietKeBocTachPage.tsx
 * Renders the export modal with SVG, PNG, DXF, PDF buttons and options.
 * Uses the Modal component directly (not ExportDialog component).
 */

"use client";

import React from "react";
import { Modal } from "./Modal";

// ==================== Types ====================

interface DimensionEntityLike {
  id: string;
  point1: { x: number; y: number };
  point2: { x: number; y: number };
  point3?: { x: number; y: number };
  offset?: number;
  value?: number;
  direction?: string;
  dimensionType?: string;
  style?: {
    textHeight?: number;
    arrowSize?: number;
    precision?: number;
    prefix?: string;
    suffix?: string;
    unit?: string;
    font?: string;
    lineColor?: string;
    textColor?: string;
    showUnit?: boolean;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CadEntityLike = any;

export type PageExportFormat = "pdf" | "svg" | "png" | "dxf";

export interface PageExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEntities: CadEntityLike[];
  allEntities: CadEntityLike[];
  dimensions: DimensionEntityLike[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportLayers: any[];
  exportDrawing: (
    format: PageExportFormat,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entities: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any,
  ) => void;
  isExporting: boolean;
  exportTransparent: boolean;
  onExportTransparentChange: (value: boolean) => void;
  exportText: boolean;
  exportDim: boolean;
  exportMode: "world" | "preview";
  dimLineColor: string;
  dimLineweight: number;
  dimTextColor: string;
  dimArrowStyle: string;
  onExportPdf: () => void;
  projectTitle: string;
}

// ==================== Component ====================

export function PageExportDialog({
  isOpen,
  onClose,
  selectedEntities,
  allEntities,
  dimensions,
  exportLayers,
  exportDrawing,
  isExporting,
  exportTransparent,
  onExportTransparentChange,
  exportText,
  exportDim,
  exportMode,
  dimLineColor,
  dimLineweight,
  dimTextColor,
  dimArrowStyle,
  onExportPdf,
  projectTitle,
}: PageExportDialogProps) {
  if (!isOpen) return null;

  // Get base entities to export
  const baseEntities =
    selectedEntities.length > 0 ? selectedEntities : allEntities;

  // Convert dimensions to CadEntity format for export
  const dimensionEntities = dimensions.map((dim) => ({
    id: dim.id,
    type: "dimension" as const,
    points: [dim.point1, dim.point2],
    color: dim.style?.lineColor ?? "#00ff00",
    lineWidth: 1,
    visible: true,
    opacity: 1,
    // Store dimension-specific data
    point1: dim.point1,
    point2: dim.point2,
    point3: dim.point3,
    offset: dim.offset,
    value: dim.value,
    direction: dim.direction,
    dimensionType: dim.dimensionType,
    style: {
      textHeight: dim.style?.textHeight ?? 50,
      arrowSize: dim.style?.arrowSize ?? 30,
      extensionOvershoot: 10,
      extensionOffset: 5,
      precision: dim.style?.precision ?? 0,
      prefix: dim.style?.prefix ?? "",
      suffix: dim.style?.suffix ?? "",
      unit: dim.style?.unit ?? "mm",
      font: dim.style?.font ?? "Arial",
      color: dim.style?.lineColor ?? "#00ff00",
      textColor: dim.style?.textColor ?? "#00ff00",
      lineColor: dim.style?.lineColor ?? "#00ff00",
      showUnit: dim.style?.showUnit ?? false,
    },
  }));

  const handleSvgExport = () => {
    // ===== DEBUG: Check why only some entities =====
    console.log("[SVG Export] Entity sources:", {
      "selectedEntities.length": selectedEntities.length,
      "allEntities.length": allEntities.length,
      "baseEntities.length": baseEntities.length,
      "baseEntities types": baseEntities.map(
        (e: CadEntityLike) => e.type,
      ),
    });
    // ===== END DEBUG =====

    // Merge entities (no duplicates expected since types differ)
    const entitiesToExport = [...baseEntities, ...dimensionEntities];

    // ===== DEBUG: Check DIM export pipeline =====
    console.log("[SVG Export Debug]", {
      "dimensions.length": dimensions.length,
      "dimensionEntities.length": dimensionEntities.length,
      "baseEntities.length": baseEntities.length,
      "entitiesToExport.length": entitiesToExport.length,
      "exportDim setting": exportDim,
      "dimensionEntities types": dimensionEntities.map((e) => e.type),
      "first dim entity": dimensionEntities[0],
    });
    // ===== END DEBUG =====

    exportDrawing("svg", entitiesToExport, exportLayers, {
      title: projectTitle,
      transparent: exportTransparent,
      // ===== 2D FIRST, 3D READY: SVG Export Options =====
      exportText: exportText,
      exportDim: exportDim,
      exportMode: exportMode,
      dimLineColor: dimLineColor,
      dimLineweight: dimLineweight,
      dimTextColor: dimTextColor,
      dimArrowStyle: dimArrowStyle,
    });
    onClose();
  };

  const handlePngExport = () => {
    const entitiesToExport =
      selectedEntities.length > 0 ? selectedEntities : allEntities;
    exportDrawing("png", entitiesToExport, exportLayers, {
      title: projectTitle,
      width: 1920,
      height: 1080,
    });
    onClose();
  };

  const handleDxfExport = () => {
    const entitiesToExport =
      selectedEntities.length > 0 ? selectedEntities : allEntities;
    exportDrawing("dxf", entitiesToExport, exportLayers, {
      title: projectTitle,
    });
    onClose();
  };

  const handlePdfExport = () => {
    onExportPdf();
    onClose();
  };

  const selectionLabel =
    selectedEntities.length > 0
      ? `[${selectedEntities.length} đối tượng]`
      : "[Tất cả]";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xuất bản vẽ">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Export Mode Info */}
        <div
          style={{
            padding: "8px 12px",
            background:
              selectedEntities.length > 0 ? "#2d4a2d" : "#3a3a4a",
            borderRadius: "4px",
            border:
              selectedEntities.length > 0
                ? "1px solid #4ade80"
                : "1px solid #555",
          }}
        >
          <p
            style={{
              color: selectedEntities.length > 0 ? "#4ade80" : "#888",
              fontSize: "12px",
              margin: 0,
            }}
          >
            {selectedEntities.length > 0
              ? `✓ Đang chọn ${selectedEntities.length} đối tượng - Sẽ xuất SELECTION`
              : "Không có đối tượng được chọn - Sẽ xuất TẤT CẢ"}
          </p>
        </div>

        <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>
          Chọn định dạng xuất file:
        </p>

        {/* Transparent background option */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#fff",
            fontSize: "12px",
            cursor: "pointer",
            padding: "8px",
            background: "#2a2a3e",
            borderRadius: "4px",
          }}
        >
          <input
            type="checkbox"
            checked={exportTransparent}
            onChange={(e) => onExportTransparentChange(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          Nền trong suốt (dùng cho thumbnail)
        </label>

        {/* SVG Export */}
        <button
          onClick={handleSvgExport}
          disabled={isExporting}
          style={{
            padding: "12px",
            background: "#4ade80",
            border: "none",
            borderRadius: "4px",
            color: "#000",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📐 Xuất SVG (Vector) {selectionLabel}
        </button>

        {/* PNG Export */}
        <button
          onClick={handlePngExport}
          disabled={isExporting}
          style={{
            padding: "12px",
            background: "#4a90d9",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🖼️ Xuất PNG (Image) {selectionLabel}
        </button>

        {/* DXF Export */}
        <button
          onClick={handleDxfExport}
          disabled={isExporting}
          style={{
            padding: "12px",
            background: "#fbbf24",
            border: "none",
            borderRadius: "4px",
            color: "#000",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📁 Xuất DXF (AutoCAD) {selectionLabel}
        </button>

        {/* PDF Export */}
        <button
          onClick={handlePdfExport}
          disabled={isExporting}
          style={{
            padding: "12px",
            background: "#ff6b6b",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📄 Xuất PDF (Print)
        </button>

        {/* Tip */}
        <p
          style={{
            color: "#666",
            fontSize: "11px",
            margin: "8px 0 0 0",
            fontStyle: "italic",
          }}
        >
          💡 Tip: Chọn đối tượng trước khi mở Export để xuất theo vùng chọn
        </p>

        {isExporting && (
          <p
            style={{
              color: "#4a90d9",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            Đang xuất file...
          </p>
        )}
      </div>
    </Modal>
  );
}
