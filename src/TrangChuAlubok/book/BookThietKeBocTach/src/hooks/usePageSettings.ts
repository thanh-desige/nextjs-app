/**
 * usePageSettings - Hook managing all page-level visual settings
 *
 * STEP-5.22 extraction from BookThietKeBocTachPage.tsx
 * Handles:
 * - Dimension display settings (scale, colors, rounding, units, arrows, etc.)
 * - Text display settings (color, opacity, scale mode, font, etc.)
 * - Canvas settings (background color, OSNAP aperture, zoom factor)
 * - SVG export settings (text, dimensions, mode)
 * - Export transparent background
 * - Layer format conversion (canvasLayers, exportLayers)
 * - Settings object for Header1 + onSettingsChange handler
 * - TextSettings object for CadDrawingCanvas
 * - Dimension tool prompt effect
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useEngineStore } from "../store";

// ==================== Types ====================

export interface PageSettings {
  gridVisible: boolean;
  snapToGrid: boolean;
  osnapEnabled: boolean;
  orthoMode: boolean;
  showDimensions: boolean;
  dimScaleEnabled: boolean;
  dimScale: number;
  dimRounding: boolean;
  dimShowUnit: boolean;
  dimTextColor: string;
  dimLineColor: string;
  dimLineweight: number;
  dimExtensionGap: boolean;
  dimArrowStyle: "closed" | "open" | "tick" | "dot" | "none";
  canvasBgColor: string;
  osnapApertureSize: number;
  zoomFactor: number;
  // TEXT settings
  showText: boolean;
  textColor: string;
  textOpacity: number;
  textScaleMode: "AUTO_ANNOTATION" | "WORLD_RATIO";
  textAnnotationPx: number;
  textWorldRatio: number;
  textFontFamily: string;
  textFontWeight: "normal" | "bold";
  textAntiAlias: boolean;
  // SVG Export settings
  exportText: boolean;
  exportDim: boolean;
  exportMode: "world" | "preview";
}

export interface TextSettings {
  scaleMode: "AUTO_ANNOTATION" | "WORLD_RATIO";
  annotationPx: number;
  worldRatio: number;
  fontFamily:
    | "Arial"
    | "Inter"
    | "Roboto"
    | "Courier New"
    | "Times New Roman";
  fontWeight: "normal" | "bold";
  antiAlias: boolean;
  textColor: string;
  textOpacity: number;
  showText: boolean;
}

interface DimensionToolStateInput {
  isActive: boolean;
  dimensionType: string;
  step: number;
  direction?: string;
}

interface UsePageSettingsParams {
  dimensionToolState: DimensionToolStateInput;
}

// ==================== Hook ====================

export function usePageSettings({ dimensionToolState }: UsePageSettingsParams) {
  // ==================== Store reads ====================
  const grid = useEngineStore((state) => state.grid);
  const osnap = useEngineStore((state) => state.osnap);
  const orthoMode = useEngineStore((state) => state.orthoMode);
  const storeLayers = useEngineStore((state) => state.layers);

  // ==================== Dimension settings ====================
  const [showDimensions, setShowDimensions] = useState(true);
  const [dimScale, setDimScale] = useState(0);
  const [dimScaleEnabled, setDimScaleEnabled] = useState(true);
  const [dimRounding, setDimRounding] = useState(true); // true = round to 0 decimals
  const [dimShowUnit, setDimShowUnit] = useState(false); // false = hide mm (default)
  const [dimTextColor, setDimTextColor] = useState("#00ff00"); // Green by default
  const [dimLineColor, setDimLineColor] = useState("#00ff00"); // Green by default
  const [dimLineweight, setDimLineweight] = useState(0.25); // Normal (0.18=Thin, 0.25=Normal, 0.35=Thick)
  const [dimExtensionGap, setDimExtensionGap] = useState(true); // true = 3mm gap (default)
  const [dimArrowStyle, setDimArrowStyle] = useState<
    "closed" | "open" | "tick" | "dot" | "none"
  >("closed"); // Closed filled arrow (default)

  // ==================== Canvas settings ====================
  const [canvasBgColor, setCanvasBgColor] = useState("#1E1E1E"); // Dark gray (current default)
  const [osnapApertureSize, setOsnapApertureSize] = useState(5); // 5 pixels (default)
  const [zoomFactor, setZoomFactor] = useState(1.1); // 1.1 = normal zoom speed (default)

  // ==================== TEXT settings ====================
  const [showText, setShowText] = useState(true);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textOpacity, setTextOpacity] = useState(100);
  const [textScaleMode, setTextScaleMode] = useState<
    "AUTO_ANNOTATION" | "WORLD_RATIO"
  >("WORLD_RATIO");
  const [textAnnotationPx, setTextAnnotationPx] = useState(14);
  const [textWorldRatio, setTextWorldRatio] = useState(1);
  const [textFontFamily, setTextFontFamily] = useState("Arial");
  const [textFontWeight, setTextFontWeight] = useState<"normal" | "bold">(
    "normal",
  );
  const [textAntiAlias, setTextAntiAlias] = useState(true);

  // ==================== SVG Export settings ====================
  const [exportText, setExportText] = useState(true);
  const [exportDim, setExportDim] = useState(true);
  const [exportMode, setExportMode] = useState<"world" | "preview">("preview");

  // ==================== Export dialog settings ====================
  const [exportTransparent, setExportTransparent] = useState(false);

  // ==================== Layer format conversions ====================

  // Convert LayerData to LayerInfo for CadDrawingCanvas (include all style properties)
  const canvasLayers = useMemo(
    () =>
      storeLayers.map((l) => ({
        id: l.id,
        visible: l.state?.visible !== false,
        locked: l.state?.locked === true,
        color: l.color,
        // Extended style properties for ByLayer rendering
        fillColor: l.fillColor,
        opacity: l.opacity,
        lineType: l.lineType,
        lineWeight: l.lineWeight,
      })),
    [storeLayers],
  );

  // Convert LayerData to Layer for export (full properties)
  const exportLayers = useMemo(
    () =>
      storeLayers.map((l, index) => ({
        id: l.id,
        name: l.name,
        color: l.color,
        lineWeight: l.lineWeight,
        visible: l.state?.visible !== false,
        locked: l.state?.locked === true,
        frozen: l.state?.frozen === true,
        order: index,
      })),
    [storeLayers],
  );

  // ==================== Settings object for Header1 ====================

  const settings: PageSettings = {
    gridVisible: grid.visible,
    snapToGrid: grid.snapToGrid,
    osnapEnabled: osnap.enabled,
    orthoMode: orthoMode,
    showDimensions: showDimensions,
    dimScaleEnabled: dimScaleEnabled,
    dimScale: dimScale,
    dimRounding: dimRounding,
    dimShowUnit: dimShowUnit,
    dimTextColor: dimTextColor,
    dimLineColor: dimLineColor,
    dimLineweight: dimLineweight,
    dimExtensionGap: dimExtensionGap,
    dimArrowStyle: dimArrowStyle,
    canvasBgColor: canvasBgColor,
    osnapApertureSize: osnapApertureSize,
    zoomFactor: zoomFactor,
    // TEXT settings
    showText: showText,
    textColor: textColor,
    textOpacity: textOpacity,
    textScaleMode: textScaleMode,
    textAnnotationPx: textAnnotationPx,
    textWorldRatio: textWorldRatio,
    textFontFamily: textFontFamily,
    textFontWeight: textFontWeight,
    textAntiAlias: textAntiAlias,
    // SVG Export settings (2D First, 3D Ready)
    exportText: exportText,
    exportDim: exportDim,
    exportMode: exportMode,
  };

  // ==================== onSettingsChange handler for Header1 ====================

  const onSettingsChange = (newSettings: PageSettings) => {
    // Update grid visibility
    if (newSettings.gridVisible !== grid.visible) {
      useEngineStore.getState().toggleGrid();
    }
    // Update snap to grid
    if (newSettings.snapToGrid !== grid.snapToGrid) {
      useEngineStore.getState().toggleSnapToGrid();
    }
    // Update OSNAP
    if (newSettings.osnapEnabled !== osnap.enabled) {
      useEngineStore.getState().toggleOsnap();
    }
    // Update Ortho mode
    if (newSettings.orthoMode !== orthoMode) {
      useEngineStore.getState().toggleOrtho();
    }
    // Update Show Dimensions
    if (
      newSettings.showDimensions !== undefined &&
      newSettings.showDimensions !== showDimensions
    ) {
      setShowDimensions(newSettings.showDimensions);
    }
    // Update Dimension Scale
    if (newSettings.dimScale !== dimScale) {
      setDimScale(newSettings.dimScale);
    }
    // Update Dimension Scale Enabled
    if (newSettings.dimScaleEnabled !== dimScaleEnabled) {
      setDimScaleEnabled(newSettings.dimScaleEnabled);
    }
    // Update Dimension Rounding
    if (newSettings.dimRounding !== dimRounding) {
      setDimRounding(newSettings.dimRounding);
    }
    // Update Dimension Show Unit
    if (newSettings.dimShowUnit !== dimShowUnit) {
      setDimShowUnit(newSettings.dimShowUnit);
    }
    // Update Dimension Text Color
    if (newSettings.dimTextColor !== dimTextColor) {
      setDimTextColor(newSettings.dimTextColor);
    }
    // Update Dimension Line Color
    if (newSettings.dimLineColor !== dimLineColor) {
      setDimLineColor(newSettings.dimLineColor);
    }
    // Update Dimension Lineweight
    if (newSettings.dimLineweight !== dimLineweight) {
      setDimLineweight(newSettings.dimLineweight);
    }
    // Update Dimension Extension Gap
    if (newSettings.dimExtensionGap !== dimExtensionGap) {
      setDimExtensionGap(newSettings.dimExtensionGap);
    }
    // Update Dimension Arrow Style
    if (newSettings.dimArrowStyle !== dimArrowStyle) {
      setDimArrowStyle(newSettings.dimArrowStyle);
    }
    // Update Canvas Background Color
    if (newSettings.canvasBgColor !== canvasBgColor) {
      setCanvasBgColor(newSettings.canvasBgColor);
    }
    // Update OSNAP Aperture Size
    if (newSettings.osnapApertureSize !== osnapApertureSize) {
      setOsnapApertureSize(newSettings.osnapApertureSize);
    }
    // Update Zoom Factor
    if (newSettings.zoomFactor !== zoomFactor) {
      setZoomFactor(newSettings.zoomFactor);
    }
    // ========== TEXT Settings Updates ==========
    if (newSettings.showText !== showText) {
      setShowText(newSettings.showText);
    }
    if (newSettings.textColor !== textColor) {
      setTextColor(newSettings.textColor);
    }
    if (newSettings.textOpacity !== textOpacity) {
      setTextOpacity(newSettings.textOpacity);
    }
    if (newSettings.textScaleMode !== textScaleMode) {
      setTextScaleMode(newSettings.textScaleMode);
    }
    if (newSettings.textAnnotationPx !== textAnnotationPx) {
      setTextAnnotationPx(newSettings.textAnnotationPx);
    }
    if (newSettings.textWorldRatio !== textWorldRatio) {
      setTextWorldRatio(newSettings.textWorldRatio);
    }
    if (newSettings.textFontFamily !== textFontFamily) {
      setTextFontFamily(newSettings.textFontFamily);
    }
    if (newSettings.textFontWeight !== textFontWeight) {
      setTextFontWeight(newSettings.textFontWeight);
    }
    if (newSettings.textAntiAlias !== textAntiAlias) {
      setTextAntiAlias(newSettings.textAntiAlias);
    }
    // ===== SVG Export settings =====
    if (newSettings.exportText !== exportText) {
      setExportText(newSettings.exportText);
    }
    if (newSettings.exportDim !== exportDim) {
      setExportDim(newSettings.exportDim);
    }
    if (newSettings.exportMode !== exportMode) {
      setExportMode(newSettings.exportMode);
    }
  };

  // ==================== TextSettings for CadDrawingCanvas ====================

  const textSettings: TextSettings = {
    scaleMode: textScaleMode,
    annotationPx: textAnnotationPx,
    worldRatio: textWorldRatio,
    fontFamily: textFontFamily as
      | "Arial"
      | "Inter"
      | "Roboto"
      | "Courier New"
      | "Times New Roman",
    fontWeight: textFontWeight,
    antiAlias: textAntiAlias,
    textColor: textColor,
    textOpacity: textOpacity / 100, // Convert 0-100 to 0-1
    showText: showText,
  };

  // ==================== Dimension tool prompt effect ====================

  useEffect(() => {
    if (!dimensionToolState.isActive) return;

    let prompt = "";
    const type = dimensionToolState.dimensionType;
    const step = dimensionToolState.step;
    const dir = dimensionToolState.direction;

    if (type === "linear") {
      if (step === 0) {
        prompt =
          "DIMLINEAR: Chỉ định điểm gốc đường kéo dài thứ nhất hoặc chọn đối tượng:";
      } else if (step === 1) {
        prompt = "DIMLINEAR: Chỉ định điểm gốc đường kéo dài thứ hai:";
      } else if (step === 2) {
        const dirText =
          dir === "horizontal"
            ? "NGANG"
            : dir === "vertical"
              ? "DỌC"
              : "TỰ ĐỘNG";
        prompt = `DIMLINEAR [${dirText}]: Chỉ định vị trí đường dim hoặc [H=Ngang/O=Dọc]:`;
      }
    } else if (type === "horizontal") {
      if (step === 0) {
        prompt = "DIMHORIZONTAL: Chỉ định điểm gốc thứ nhất:";
      } else if (step === 1) {
        prompt = "DIMHORIZONTAL: Chỉ định điểm gốc thứ hai:";
      } else if (step === 2) {
        prompt = "DIMHORIZONTAL: Chỉ định vị trí đường dim:";
      }
    } else if (type === "vertical") {
      if (step === 0) {
        prompt = "DIMVERTICAL: Chỉ định điểm gốc thứ nhất:";
      } else if (step === 1) {
        prompt = "DIMVERTICAL: Chỉ định điểm gốc thứ hai:";
      } else if (step === 2) {
        prompt = "DIMVERTICAL: Chỉ định vị trí đường dim:";
      }
    }

    if (prompt) {
      useEngineStore.setState({ commandPrompt: prompt });
    }
  }, [
    dimensionToolState.isActive,
    dimensionToolState.dimensionType,
    dimensionToolState.step,
    dimensionToolState.direction,
  ]);

  // ==================== Return ====================

  return {
    // Header1 props
    settings,
    onSettingsChange,
    // CadDrawingCanvas props
    textSettings,
    canvasLayers,
    showDimensions,
    effectiveDimScale: dimScaleEnabled ? dimScale : 0,
    dimRounding,
    dimShowUnit,
    dimTextColor,
    dimLineColor,
    dimLineweight,
    dimExtensionGap,
    dimArrowStyle,
    canvasBgColor,
    osnapApertureSize,
    zoomFactor,
    // Export dialog props
    exportLayers,
    exportTransparent,
    setExportTransparent,
    exportText,
    exportDim,
    exportMode,
  };
}
