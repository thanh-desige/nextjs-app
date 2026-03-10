/**
 * useTextSettings.ts
 *
 * Hook quản lý TEXT Settings (view options)
 *
 * ============================================================================
 * 2D FIRST, 3D READY ARCHITECTURE - TEXT RENDER SETTINGS
 * ============================================================================
 *
 * INVARIANT:
 * - Text entity chỉ lưu fontSizeMm (world/mm) + position/rotation/content
 * - TUYỆT ĐỐI KHÔNG lưu zoom/pixel vào entity
 * - TextSettings là VIEW OPTIONS, không phải entity data
 * - SVG Export luôn dùng fontSizeMm (world/mm) làm chuẩn
 *
 * PERSISTENCE:
 * - TextSettings được lưu vào localStorage với key "cad-text-settings"
 * - Load on mount, save on change
 *
 * ============================================================================
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  TextSettings,
  TextScaleMode,
  TextFontFamily,
  TextFontWeight,
  TextAlign,
  TextBaseline,
  DEFAULT_TEXT_SETTINGS,
} from "../ui/panels/TextPanel";

// ==================== Storage Key ====================
const TEXT_SETTINGS_STORAGE_KEY = "cad-text-settings";

/**
 * Load TextSettings from localStorage
 */
function loadTextSettings(): TextSettings {
  if (typeof window === "undefined") return DEFAULT_TEXT_SETTINGS;

  try {
    const stored = localStorage.getItem(TEXT_SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and merge with defaults
      return {
        // Display
        showText:
          typeof parsed.showText === "boolean"
            ? parsed.showText
            : DEFAULT_TEXT_SETTINGS.showText,
        textColor:
          typeof parsed.textColor === "string" &&
          parsed.textColor.startsWith("#")
            ? parsed.textColor
            : DEFAULT_TEXT_SETTINGS.textColor,
        textOpacity:
          typeof parsed.textOpacity === "number" &&
          parsed.textOpacity >= 0 &&
          parsed.textOpacity <= 100
            ? parsed.textOpacity
            : DEFAULT_TEXT_SETTINGS.textOpacity,

        // Size
        scaleMode:
          parsed.scaleMode === "AUTO_ANNOTATION" ||
          parsed.scaleMode === "WORLD_RATIO"
            ? parsed.scaleMode
            : DEFAULT_TEXT_SETTINGS.scaleMode,
        annotationPx:
          typeof parsed.annotationPx === "number" && parsed.annotationPx > 0
            ? parsed.annotationPx
            : DEFAULT_TEXT_SETTINGS.annotationPx,
        worldRatio:
          typeof parsed.worldRatio === "number" && parsed.worldRatio > 0
            ? parsed.worldRatio
            : DEFAULT_TEXT_SETTINGS.worldRatio,
        defaultFontSizeMm:
          typeof parsed.defaultFontSizeMm === "number" &&
          parsed.defaultFontSizeMm > 0
            ? parsed.defaultFontSizeMm
            : DEFAULT_TEXT_SETTINGS.defaultFontSizeMm,
        minSizeClampPx:
          typeof parsed.minSizeClampPx === "number" &&
          parsed.minSizeClampPx >= 0
            ? parsed.minSizeClampPx
            : DEFAULT_TEXT_SETTINGS.minSizeClampPx,

        // Font & Style
        fontFamily: isValidFontFamily(parsed.fontFamily)
          ? parsed.fontFamily
          : DEFAULT_TEXT_SETTINGS.fontFamily,
        fontWeight: isValidFontWeight(parsed.fontWeight)
          ? parsed.fontWeight
          : DEFAULT_TEXT_SETTINGS.fontWeight,
        textAlign: isValidTextAlign(parsed.textAlign)
          ? parsed.textAlign
          : DEFAULT_TEXT_SETTINGS.textAlign,
        textBaseline: isValidTextBaseline(parsed.textBaseline)
          ? parsed.textBaseline
          : DEFAULT_TEXT_SETTINGS.textBaseline,

        // Display Quality
        antiAlias:
          typeof parsed.antiAlias === "boolean"
            ? parsed.antiAlias
            : DEFAULT_TEXT_SETTINGS.antiAlias,

        // SVG Export
        exportText:
          typeof parsed.exportText === "boolean"
            ? parsed.exportText
            : DEFAULT_TEXT_SETTINGS.exportText,
        useSystemFont:
          typeof parsed.useSystemFont === "boolean"
            ? parsed.useSystemFont
            : DEFAULT_TEXT_SETTINGS.useSystemFont,
      };
    }
  } catch (e) {
    console.warn("[useTextSettings] Failed to load from localStorage:", e);
  }
  return DEFAULT_TEXT_SETTINGS;
}

// Validation helpers
function isValidFontFamily(value: unknown): value is TextFontFamily {
  return (
    value === "Inter" ||
    value === "Arial" ||
    value === "Roboto" ||
    value === "Courier New" ||
    value === "Times New Roman"
  );
}

function isValidFontWeight(value: unknown): value is TextFontWeight {
  return value === "normal" || value === "bold";
}

function isValidTextAlign(value: unknown): value is TextAlign {
  return value === "left" || value === "center" || value === "right";
}

function isValidTextBaseline(value: unknown): value is TextBaseline {
  return (
    value === "middle" ||
    value === "alphabetic" ||
    value === "top" ||
    value === "bottom"
  );
}

/**
 * Save TextSettings to localStorage
 */
function saveTextSettings(settings: TextSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TEXT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("[useTextSettings] Failed to save to localStorage:", e);
  }
}

export interface UseTextSettingsReturn {
  /** Current text settings */
  settings: TextSettings;
  /** Update settings */
  setSettings: (settings: Partial<TextSettings>) => void;
  /** Calculate render font size based on current mode */
  calculateRenderFontSize: (fontSizeMm: number, viewScale: number) => number;
  /** Get default font size for new text entities */
  getDefaultFontSizeMm: () => number;
  /** Check if text should be visible */
  isTextVisible: () => boolean;
  /** Get text opacity (0-1) */
  getTextOpacity: () => number;
  /** Get CSS font string */
  getFontString: (sizePx: number) => string;
}

/**
 * Hook để quản lý Text Settings với localStorage persistence
 */
export function useTextSettings(
  initialSettings: Partial<TextSettings> = {}
): UseTextSettingsReturn {
  // Load from localStorage on first render
  const [settings, setSettingsState] = useState<TextSettings>(() => {
    const loaded = loadTextSettings();
    return { ...loaded, ...initialSettings };
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    saveTextSettings(settings);
  }, [settings]);

  const setSettings = useCallback((newSettings: Partial<TextSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }));
  }, []);

  /**
   * Calculate render font size based on current mode
   *
   * @param fontSizeMm - Font size stored in entity (world/mm units)
   * @param viewScale - Current view scale (zoom level)
   * @returns Font size in pixels for rendering
   *
   * MODES:
   * - AUTO_ANNOTATION: Pixel-constant, worldFont = annotationPx / viewScale
   *   => renderPx = annotationPx (constant on screen)
   * - WORLD_RATIO: render = fontSizeMm * viewScale * worldRatio
   *   => renderPx scales with zoom
   */
  const calculateRenderFontSize = useCallback(
    (fontSizeMm: number, viewScale: number): number => {
      if (settings.scaleMode === "AUTO_ANNOTATION") {
        // Pixel-constant: text giữ kích thước cố định trên màn hình
        // Không phụ thuộc vào fontSizeMm của entity (chỉ dùng annotationPx)
        return settings.annotationPx;
      } else {
        // WORLD_RATIO: scale theo world coordinates với ratio
        // renderPx = fontSizeMm * viewScale * worldRatio
        let size = fontSizeMm * viewScale * settings.worldRatio;

        // Apply min size clamp if in annotation mode (for WORLD_RATIO, clamp if enabled)
        if (settings.minSizeClampPx > 0 && size < settings.minSizeClampPx) {
          size = settings.minSizeClampPx;
        }

        return size;
      }
    },
    [
      settings.scaleMode,
      settings.annotationPx,
      settings.worldRatio,
      settings.minSizeClampPx,
    ]
  );

  /**
   * Get default font size for new text entities (in mm/world units)
   */
  const getDefaultFontSizeMm = useCallback((): number => {
    return settings.defaultFontSizeMm;
  }, [settings.defaultFontSizeMm]);

  /**
   * Check if text should be visible
   */
  const isTextVisible = useCallback((): boolean => {
    return settings.showText;
  }, [settings.showText]);

  /**
   * Get text opacity (0-1 range)
   */
  const getTextOpacity = useCallback((): number => {
    return settings.textOpacity / 100;
  }, [settings.textOpacity]);

  /**
   * Get CSS font string
   */
  const getFontString = useCallback(
    (sizePx: number): string => {
      const weight = settings.fontWeight;
      const family = settings.fontFamily;
      return `${weight} ${sizePx}px ${family}`;
    },
    [settings.fontWeight, settings.fontFamily]
  );

  return useMemo(
    () => ({
      settings,
      setSettings,
      calculateRenderFontSize,
      getDefaultFontSizeMm,
      isTextVisible,
      getTextOpacity,
      getFontString,
    }),
    [
      settings,
      setSettings,
      calculateRenderFontSize,
      getDefaultFontSizeMm,
      isTextVisible,
      getTextOpacity,
      getFontString,
    ]
  );
}

/**
 * Convert TextSettings (panel) to TextRenderSettings (for render)
 * This helper ensures compatibility between the panel settings and render settings
 */
export function toTextRenderSettings(
  settings: TextSettings
): import("../ui/canvas/utils/renderEntity").TextRenderSettings {
  return {
    scaleMode: settings.scaleMode,
    annotationPx: settings.annotationPx,
    worldRatio: settings.worldRatio,
    minSizeClampPx: settings.minSizeClampPx,
    fontFamily: settings.fontFamily,
    fontWeight: settings.fontWeight,
    textAlign: settings.textAlign,
    textBaseline: settings.textBaseline,
    antiAlias: settings.antiAlias,
    textColor: settings.textColor,
    textOpacity: settings.textOpacity / 100, // Convert from 0-100 to 0-1
    showText: settings.showText,
  };
}

export default useTextSettings;

// Re-export types
export type {
  TextSettings,
  TextScaleMode,
  TextFontFamily,
  TextFontWeight,
  TextAlign,
  TextBaseline,
};
export { DEFAULT_TEXT_SETTINGS };
