/**
 * ExportManager - Thin facade for CAD export functionality
 * STEP-5.6: Extracted into ExportSVG, ExportPNG, ExportDXF, ExportUtils
 *
 * This class delegates to specialized modules while maintaining
 * backward-compatible API for all consumers. Zero import changes needed.
 */

import { CadEntity } from "../../ui/canvas/CadDrawingCanvas";
import { Layer } from "../layers/LayerManager";
import { exportToSVG, entityToSVGLegacy } from "./ExportSVG";
import { exportToPNG, exportToPNGAsync } from "./ExportPNG";
import { exportToDXF, exportDocumentToDXF } from "./ExportDXF";
import type { DXFExportOptions } from "./ExportDXF";
import { exportDocumentToSVG } from "./ExportSVGCore";
import type { SVGExportOptions } from "./ExportSVGCore";
import {
  exportDocumentToPNG as exportDocumentToPNGCore,
  preparePNGExport,
} from "./ExportPNGCore";
import type { PNGExportOptions } from "./ExportPNGCore";
import { exportDocumentToPDF } from "./ExportPDFCore";
import type { PDFExportOptions } from "./ExportPDFCore";
import {
  exportToJSON,
  importFromJSON,
  importFromJSONFull,
  validateCadJSON,
} from "./ExportJSON";
import { CadDocument } from "../document/CadDocument";
import {
  calculateBounds,
  calculateBoundsWithDimSizes,
  downloadFile,
} from "./ExportUtils";

// ==================== Types ====================

export type ExportFormat = "pdf" | "svg" | "png" | "dxf" | "json";

export interface ExportOptions {
  format: ExportFormat;
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  transparent?: boolean; // Nếu true, không vẽ background - dùng cho thumbnail
  includeLayers?: string[];
  excludeLayers?: string[];
  includeGrid?: boolean;
  includeDimensions?: boolean;
  title?: string;
  author?: string;
  margin?: number;

  // ===== 2D FIRST, 3D READY: SVG Export Options =====
  /** Export TEXT entities to SVG (default: true) */
  exportText?: boolean;
  /** Export DIM entities to SVG (default: true) */
  exportDim?: boolean;
  /**
   * Export mode:
   * - "world": Technical export - width/height in mm units (e.g., "1234mm")
   * - "preview" (default): Browser preview - width/height="100%", fits to screen
   *
   * INVARIANT: viewBox always uses WORLD/mm coordinates in both modes.
   * Only the width/height attribute changes for display purposes.
   */
  exportMode?: "world" | "preview";
  /** Dimension text color for export */
  dimTextColor?: string;
  /** Dimension line color for export */
  dimLineColor?: string;
  /** Dimension lineweight in mm (0.18=Thin, 0.25=Normal, 0.35=Thick) */
  dimLineweight?: number;
  /** Dimension arrow style for export */
  dimArrowStyle?: "closed" | "open" | "tick" | "dot" | "none";
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename?: string;
  error?: string;
}

// ==================== Export Manager (Facade) ====================

export class ExportManager {
  // ==================== SVG Export ====================
  static exportToSVG(
    entities: CadEntity[],
    options: ExportOptions,
  ): ExportResult {
    return exportToSVG(entities, options);
  }

  /** Legacy entity to SVG with explicit flipY */
  static entityToSVG(
    entity: CadEntity,
    boundsHeight: number,
    minY: number,
  ): string {
    return entityToSVGLegacy(entity, boundsHeight, minY);
  }

  // ==================== PNG Export ====================
  static exportToPNG(
    entities: CadEntity[],
    canvas: HTMLCanvasElement,
    options: ExportOptions,
  ): ExportResult {
    return exportToPNG(entities, canvas, options);
  }

  static async exportToPNGAsync(
    entities: CadEntity[],
    options: ExportOptions,
  ): Promise<ExportResult> {
    return exportToPNGAsync(entities, options);
  }

  // ==================== IEntity SVG Export ====================
  /** Phase 5.3: export from CadDocument (IEntity data, no canvas dependency) */
  static exportDocumentToSVG(
    document: CadDocument,
    options?: SVGExportOptions,
  ): ExportResult {
    return exportDocumentToSVG(document, options);
  }

  // ==================== IEntity PNG Export ====================
  /** Phase 5.4: export from CadDocument to PNG (IEntity data, browser-only for actual output) */
  static exportDocumentToPNG(
    document: CadDocument,
    options?: PNGExportOptions,
  ): ExportResult {
    return exportDocumentToPNGCore(document, options);
  }

  /** Phase 5.4: prepare PNG export data (pure, no DOM needed) */
  static preparePNGExport(
    document: CadDocument,
    options?: PNGExportOptions,
  ) {
    return preparePNGExport(document, options);
  }

  // ==================== IEntity PDF Export ====================
  /** Phase 5.5: export from CadDocument to PDF (IEntity data, no external deps) */
  static exportDocumentToPDF(
    document: CadDocument,
    options?: PDFExportOptions,
  ): ExportResult {
    return exportDocumentToPDF(document, options);
  }

  // ==================== DXF Export ====================
  /** Legacy: export from canvas CadEntity objects */
  static exportToDXF(
    entities: CadEntity[],
    layers: Layer[],
    options: ExportOptions,
  ): ExportResult {
    return exportToDXF(entities, layers, options);
  }

  /** Phase 5.2: export from CadDocument (IEntity data, no canvas dependency) */
  static exportDocumentToDXF(
    document: CadDocument,
    options?: DXFExportOptions,
  ): ExportResult {
    return exportDocumentToDXF(document, options);
  }

  // ==================== JSON Export/Import ====================
  static exportToJSON(
    document: CadDocument,
    pretty: boolean = true,
  ): ExportResult {
    return exportToJSON(document, pretty);
  }

  static importFromJSON(jsonString: string): CadDocument {
    return importFromJSON(jsonString);
  }

  static importFromJSONFull(jsonString: string) {
    return importFromJSONFull(jsonString);
  }

  static validateCadJSON(jsonString: string) {
    return validateCadJSON(jsonString);
  }

  // ==================== Utilities ====================
  static calculateBounds(entities: CadEntity[]): {
    min: { x: number; y: number };
    max: { x: number; y: number };
  } {
    return calculateBounds(entities);
  }

  static calculateBoundsWithDimSizes(
    entities: CadEntity[],
    dimTextHeightMm: number,
    dimArrowSizeMm: number,
  ): { min: { x: number; y: number }; max: { x: number; y: number } } {
    return calculateBoundsWithDimSizes(
      entities,
      dimTextHeightMm,
      dimArrowSizeMm,
    );
  }

  static downloadFile(data: string | Blob, filename: string): void {
    downloadFile(data, filename);
  }
}

export default ExportManager;
