/**
 * Export Module - Barrel Export
 * STEP-5.6: ExportManager split into ExportSVG, ExportPNG, ExportDXF, ExportUtils
 * Phase 5.1: Added ExportJSON for project save/load
 */

// Facade class (backward-compatible API)
export { ExportManager } from "./ExportManager";
export type {
  ExportFormat,
  ExportOptions,
  ExportResult,
} from "./ExportManager";

// Direct access to format-specific modules
export { exportToSVG, entityToSVGLegacy } from "./ExportSVG";
export { exportToPNG, exportToPNGAsync } from "./ExportPNG";
export { exportToDXF, exportDocumentToDXF, iEntityToDXF, rgbToAciColor } from "./ExportDXF";
export type { DXFExportOptions } from "./ExportDXF";
export { exportDocumentToSVG, iEntityToSVG, calculateIEntityBounds } from "./ExportSVGCore";
export type { SVGExportOptions } from "./ExportSVGCore";
export {
  exportDocumentToPNG,
  exportDocumentToPNGAsync,
  preparePNGExport,
  renderIEntityToCtx,
  renderDocumentToCtx,
} from "./ExportPNGCore";
export type { PNGExportOptions, PNGPrepareResult, ICanvasContext } from "./ExportPNGCore";
export { exportDocumentToPDF, iEntityToPDFOps, getPageDimensions, hexToRgb01 } from "./ExportPDFCore";
export type { PDFExportOptions, PaperSize, Orientation, PageDimensions } from "./ExportPDFCore";
export {
  exportToJSON,
  importFromJSON,
  importFromJSONFull,
  validateCadJSON,
  parseCadFileJSON,
  FORMAT_VERSION,
  APP_ID,
} from "./ExportJSON";
export type { CadFileJSON } from "./ExportJSON";
export {
  calculateBounds,
  calculateBoundsWithDimSizes,
  downloadFile,
} from "./ExportUtils";
// DXF Import
export { importFromDXF, tokenizeDXF, splitSections, parseLayers, aciToHex } from "./ImportDXF";
export type { DXFImportOptions, DXFImportResult, DXFLayerInfo, DXFImportStats } from "./ImportDXF";
