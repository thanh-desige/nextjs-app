/**
 * useExport - Hook for exporting CAD drawings
 */

"use client";

import { useCallback, useState } from "react";
import {
  ExportManager,
  ExportFormat,
  ExportOptions,
  ExportResult,
} from "../core/export";
import { CadEntity } from "../ui/canvas/CadDrawingCanvas";
import { Layer } from "../core/layers";

export interface UseExportReturn {
  isExporting: boolean;
  lastResult: ExportResult | null;

  exportToSVG: (
    entities: CadEntity[],
    options?: Partial<ExportOptions>
  ) => ExportResult;
  exportToPNG: (
    entities: CadEntity[],
    options?: Partial<ExportOptions>
  ) => Promise<ExportResult>;
  exportToDXF: (
    entities: CadEntity[],
    layers: Layer[],
    options?: Partial<ExportOptions>
  ) => ExportResult;

  downloadResult: (result: ExportResult) => void;

  export: (
    format: ExportFormat,
    entities: CadEntity[],
    layers: Layer[],
    options?: Partial<ExportOptions>
  ) => Promise<ExportResult>;
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);

  const exportToSVG = useCallback(
    (entities: CadEntity[], options?: Partial<ExportOptions>): ExportResult => {
      const fullOptions: ExportOptions = {
        format: "svg",
        width: 800,
        height: 600,
        scale: 1,
        backgroundColor: "#1a1a2e",
        includeGrid: false,
        includeDimensions: true,
        title: "drawing",
        ...options,
      };

      const result = ExportManager.exportToSVG(entities, fullOptions);
      setLastResult(result);
      return result;
    },
    []
  );

  const exportToPNG = useCallback(
    async (
      entities: CadEntity[],
      options?: Partial<ExportOptions>
    ): Promise<ExportResult> => {
      setIsExporting(true);

      const fullOptions: ExportOptions = {
        format: "png",
        width: 1920,
        height: 1080,
        scale: 1,
        backgroundColor: "#1a1a2e",
        includeGrid: false,
        includeDimensions: true,
        title: "drawing",
        ...options,
      };

      try {
        const result = await ExportManager.exportToPNGAsync(
          entities,
          fullOptions
        );
        setLastResult(result);
        return result;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportToDXF = useCallback(
    (
      entities: CadEntity[],
      layers: Layer[],
      options?: Partial<ExportOptions>
    ): ExportResult => {
      const fullOptions: ExportOptions = {
        format: "dxf",
        title: "drawing",
        ...options,
      };

      const result = ExportManager.exportToDXF(entities, layers, fullOptions);
      setLastResult(result);
      return result;
    },
    []
  );

  const downloadResult = useCallback((result: ExportResult) => {
    if (result.success && result.data && result.filename) {
      ExportManager.downloadFile(result.data, result.filename);
    }
  }, []);

  const exportFn = useCallback(
    async (
      format: ExportFormat,
      entities: CadEntity[],
      layers: Layer[],
      options?: Partial<ExportOptions>
    ): Promise<ExportResult> => {
      setIsExporting(true);

      try {
        let result: ExportResult;

        switch (format) {
          case "svg":
            result = exportToSVG(entities, options);
            break;
          case "png":
            result = await exportToPNG(entities, options);
            break;
          case "dxf":
            result = exportToDXF(entities, layers, options);
            break;
          case "pdf":
            // PDF would require a library like jsPDF
            result = {
              success: false,
              error:
                "PDF export not implemented yet. Use SVG and print to PDF.",
            };
            break;
          default:
            result = {
              success: false,
              error: `Unsupported format: ${format}`,
            };
        }

        if (result.success) {
          downloadResult(result);
        }

        return result;
      } finally {
        setIsExporting(false);
      }
    },
    [exportToSVG, exportToPNG, exportToDXF, downloadResult]
  );

  return {
    isExporting,
    lastResult,
    exportToSVG,
    exportToPNG,
    exportToDXF,
    downloadResult,
    export: exportFn,
  };
}

export default useExport;
