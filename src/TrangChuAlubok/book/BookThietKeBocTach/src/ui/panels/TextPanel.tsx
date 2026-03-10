/**
 * TextPanel.tsx
 *
 * Panel công cụ TEXT trên bản vẽ CAD
 *
 * ============================================================================
 * 2D FIRST, 3D READY ARCHITECTURE - TEXT SETTINGS
 * ============================================================================
 *
 * TextScaleMode:
 * - AUTO_ANNOTATION: Pixel-constant rendering (worldFont = annotationPx / viewScale)
 *   Text giữ kích thước cố định trên màn hình bất kể zoom
 * - WORLD_RATIO: render = fontSizeMm * ratio
 *   Text scale theo world coordinates với ratio tùy chỉnh
 *
 * INVARIANT:
 * - Text entity chỉ lưu fontSizeMm (world/mm) + position/rotation/content
 * - TUYỆT ĐỐI KHÔNG lưu zoom/pixel vào entity
 * - ScaleMode và ratio là VIEW OPTIONS, không phải entity data
 * - SVG Export luôn dùng fontSizeMm (world/mm) làm chuẩn
 *
 * ============================================================================
 */

import React from "react";
import styles from "./TextPanel.module.css";

// ============================================================================
// TEXT SCALE MODE - VIEW OPTION (không lưu vào entity)
// ============================================================================
export type TextScaleMode = "AUTO_ANNOTATION" | "WORLD_RATIO";

// Font families available
export type TextFontFamily =
  | "Inter"
  | "Arial"
  | "Roboto"
  | "Courier New"
  | "Times New Roman";

// Font weight
export type TextFontWeight = "normal" | "bold";

// Text alignment
export type TextAlign = "left" | "center" | "right";

// Text baseline (for SVG and canvas consistency)
export type TextBaseline = "middle" | "alphabetic" | "top" | "bottom";

export interface TextSettings {
  // ===== 1) Display Settings =====
  /** Show/hide text entities */
  showText: boolean;
  /** Text color (hex) */
  textColor: string;
  /** Text opacity (0-100) */
  textOpacity: number;

  // ===== 2) Size Settings =====
  /** Scale mode: AUTO_ANNOTATION (pixel-constant) or WORLD_RATIO */
  scaleMode: TextScaleMode;
  /** Annotation size in pixels (for AUTO_ANNOTATION mode) */
  annotationPx: number;
  /** World ratio multiplier (for WORLD_RATIO mode) */
  worldRatio: number;
  /** Default font size in mm/world units for new text */
  defaultFontSizeMm: number;
  /** Minimum size clamp in px (AUTO_ANNOTATION mode only) - 0 = disabled */
  minSizeClampPx: number;

  // ===== 3) Font & Style =====
  /** Font family */
  fontFamily: TextFontFamily;
  /** Font weight */
  fontWeight: TextFontWeight;
  /** Text alignment */
  textAlign: TextAlign;
  /** Text baseline */
  textBaseline: TextBaseline;

  // ===== 4) Display Quality =====
  /** Enable anti-aliasing */
  antiAlias: boolean;

  // ===== 5) SVG Export =====
  /** Export text to SVG */
  exportText: boolean;
  /** Use system font (false = embed font) */
  useSystemFont: boolean;
}

export const DEFAULT_TEXT_SETTINGS: TextSettings = {
  // Display
  showText: true,
  textColor: "#ffffff",
  textOpacity: 100,

  // Size
  scaleMode: "WORLD_RATIO",
  annotationPx: 14,
  worldRatio: 1,
  defaultFontSizeMm: 50, // 50mm default for CAD scale
  minSizeClampPx: 0, // disabled by default

  // Font & Style
  fontFamily: "Arial",
  fontWeight: "normal",
  textAlign: "left",
  textBaseline: "alphabetic",

  // Display Quality
  antiAlias: true,

  // SVG Export
  exportText: true,
  useSystemFont: true,
};

// Preset ratios for quick selection
const RATIO_PRESETS = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "5x", value: 5 },
  { label: "10x", value: 10 },
];

// Preset annotation sizes
const ANNOTATION_PRESETS = [
  { label: "10px", value: 10 },
  { label: "12px", value: 12 },
  { label: "14px", value: 14 },
  { label: "16px", value: 16 },
  { label: "18px", value: 18 },
  { label: "20px", value: 20 },
  { label: "24px", value: 24 },
];

// Preset default font sizes (world/mm)
const FONTSIZE_PRESETS = [
  { label: "25mm", value: 25 },
  { label: "50mm", value: 50 },
  { label: "100mm", value: 100 },
  { label: "200mm", value: 200 },
  { label: "500mm", value: 500 },
];

// Font family options
const FONT_FAMILY_OPTIONS: { label: string; value: TextFontFamily }[] = [
  { label: "Arial", value: "Arial" },
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Courier New", value: "Courier New" },
  { label: "Times New Roman", value: "Times New Roman" },
];

// Min size clamp presets
const MIN_SIZE_CLAMP_PRESETS = [
  { label: "Off", value: 0 },
  { label: "6px", value: 6 },
  { label: "8px", value: 8 },
  { label: "10px", value: 10 },
  { label: "12px", value: 12 },
];

// Color presets
const COLOR_PRESETS = [
  "#ffffff", // White
  "#ffff00", // Yellow
  "#00ff00", // Green
  "#00ffff", // Cyan
  "#ff00ff", // Magenta
  "#ff0000", // Red
  "#0080ff", // Blue
  "#ff8000", // Orange
];

interface TextPanelProps {
  settings: TextSettings;
  onSettingsChange: (settings: Partial<TextSettings>) => void;
}

export function TextPanel({ settings, onSettingsChange }: TextPanelProps) {
  const [customRatio, setCustomRatio] = React.useState("");
  const [customFontSize, setCustomFontSize] = React.useState("");
  const [customAnnotation, setCustomAnnotation] = React.useState("");
  const [customMinClamp, setCustomMinClamp] = React.useState("");

  const handleAddCustomRatio = () => {
    const value = parseFloat(customRatio);
    if (!isNaN(value) && value > 0) {
      onSettingsChange({ worldRatio: value });
      setCustomRatio("");
    }
  };

  const handleAddCustomFontSize = () => {
    const value = parseFloat(customFontSize);
    if (!isNaN(value) && value > 0) {
      onSettingsChange({ defaultFontSizeMm: value });
      setCustomFontSize("");
    }
  };

  const handleAddCustomAnnotation = () => {
    const value = parseInt(customAnnotation);
    if (!isNaN(value) && value >= 6 && value <= 72) {
      onSettingsChange({ annotationPx: value });
      setCustomAnnotation("");
    }
  };

  const handleAddCustomMinClamp = () => {
    const value = parseInt(customMinClamp);
    if (!isNaN(value) && value >= 0) {
      onSettingsChange({ minSizeClampPx: value });
      setCustomMinClamp("");
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>📝 Text Settings</span>
      </div>

      {/* ===== SECTION 1: Display Settings ===== */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>1. Hiển thị TEXT</div>

        {/* Show/Hide Toggle */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Hiển thị Text:</label>
          <button
            className={`${styles.toggleSmall} ${
              settings.showText ? styles.active : ""
            }`}
            onClick={() => onSettingsChange({ showText: !settings.showText })}
          >
            {settings.showText ? "ON" : "OFF"}
          </button>
        </div>

        {/* Color Picker */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Màu Text:</label>
          <div className={styles.colorRow}>
            <input
              type="color"
              value={settings.textColor}
              onChange={(e) => onSettingsChange({ textColor: e.target.value })}
              className={styles.colorPicker}
            />
            <div className={styles.colorPresets}>
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  className={`${styles.colorPreset} ${
                    settings.textColor === color ? styles.active : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => onSettingsChange({ textColor: color })}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Opacity */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Opacity:</label>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.textOpacity}
            onChange={(e) =>
              onSettingsChange({ textOpacity: Number(e.target.value) })
            }
            className={styles.slider}
          />
          <span className={styles.sliderValue}>{settings.textOpacity}%</span>
        </div>
      </div>

      {/* ===== SECTION 2: Size Settings (most important) ===== */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>2. Kích thước TEXT</div>

        {/* Scale Mode Toggle */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Chế độ Scale:</label>
        </div>
        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleButton} ${
              settings.scaleMode === "AUTO_ANNOTATION" ? styles.active : ""
            }`}
            onClick={() => onSettingsChange({ scaleMode: "AUTO_ANNOTATION" })}
            title="Text giữ kích thước cố định trên màn hình (pixel-constant)"
          >
            🎯 Tự động (Annotation)
          </button>
          <button
            className={`${styles.toggleButton} ${
              settings.scaleMode === "WORLD_RATIO" ? styles.active : ""
            }`}
            onClick={() => onSettingsChange({ scaleMode: "WORLD_RATIO" })}
            title="Text scale theo world coordinates với ratio"
          >
            📏 Tỉ lệ (World/mm)
          </button>
        </div>
        <p className={styles.modeDescription}>
          {settings.scaleMode === "AUTO_ANNOTATION"
            ? "Chữ luôn dễ đọc ở mọi mức zoom (pixel-constant)"
            : "Chữ đúng kích thước theo bản vẽ, phục vụ xuất SVG chuẩn"}
        </p>

        {/* AUTO_ANNOTATION Options */}
        {settings.scaleMode === "AUTO_ANNOTATION" && (
          <>
            <div className={styles.subSection}>
              <div className={styles.subSectionHeader}>
                Cỡ chữ màn hình (px)
              </div>
              <div className={styles.presetGrid}>
                {ANNOTATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    className={`${styles.presetButton} ${
                      settings.annotationPx === preset.value
                        ? styles.active
                        : ""
                    }`}
                    onClick={() =>
                      onSettingsChange({ annotationPx: preset.value })
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className={styles.customInput}>
                <input
                  type="number"
                  placeholder="Custom"
                  value={customAnnotation}
                  onChange={(e) => setCustomAnnotation(e.target.value)}
                  min={6}
                  max={72}
                  className={styles.numberInput}
                />
                <button
                  className={styles.addButton}
                  onClick={handleAddCustomAnnotation}
                  title="Set custom size"
                >
                  Set
                </button>
              </div>
              <p className={styles.currentValue}>
                Hiện tại: <strong>{settings.annotationPx}px</strong>
              </p>
            </div>

            {/* Min Size Clamp */}
            <div className={styles.subSection}>
              <div className={styles.subSectionHeader}>
                Min size clamp (zoom out)
              </div>
              <div className={styles.presetGrid}>
                {MIN_SIZE_CLAMP_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    className={`${styles.presetButton} ${
                      settings.minSizeClampPx === preset.value
                        ? styles.active
                        : ""
                    }`}
                    onClick={() =>
                      onSettingsChange({ minSizeClampPx: preset.value })
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className={styles.customInput}>
                <input
                  type="number"
                  placeholder="Custom"
                  value={customMinClamp}
                  onChange={(e) => setCustomMinClamp(e.target.value)}
                  min={0}
                  className={styles.numberInput}
                />
                <button
                  className={styles.addButton}
                  onClick={handleAddCustomMinClamp}
                  title="Set custom min clamp"
                >
                  Set
                </button>
              </div>
              <p className={styles.hint}>
                Không cho nhỏ hơn X px khi zoom out (0 = tắt)
              </p>
            </div>
          </>
        )}

        {/* WORLD_RATIO Options */}
        {settings.scaleMode === "WORLD_RATIO" && (
          <div className={styles.subSection}>
            <div className={styles.subSectionHeader}>Tỉ lệ hiển thị</div>
            <div className={styles.presetGrid}>
              {RATIO_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className={`${styles.presetButton} ${
                    settings.worldRatio === preset.value ? styles.active : ""
                  }`}
                  onClick={() => onSettingsChange({ worldRatio: preset.value })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className={styles.customInput}>
              <input
                type="number"
                placeholder="Custom"
                value={customRatio}
                onChange={(e) => setCustomRatio(e.target.value)}
                step={0.1}
                min={0.1}
                className={styles.numberInput}
              />
              <button
                className={styles.addButton}
                onClick={handleAddCustomRatio}
                title="Set custom ratio"
              >
                Set
              </button>
            </div>
            <p className={styles.currentValue}>
              Hiện tại: <strong>{settings.worldRatio}x</strong>
            </p>
          </div>
        )}

        {/* Default Font Size (World/mm) */}
        <div className={styles.subSection}>
          <div className={styles.subSectionHeader}>Cỡ chữ mặc định (mm)</div>
          <div className={styles.presetGrid}>
            {FONTSIZE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={`${styles.presetButton} ${
                  settings.defaultFontSizeMm === preset.value
                    ? styles.active
                    : ""
                }`}
                onClick={() =>
                  onSettingsChange({ defaultFontSizeMm: preset.value })
                }
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className={styles.customInput}>
            <input
              type="number"
              placeholder="Custom"
              value={customFontSize}
              onChange={(e) => setCustomFontSize(e.target.value)}
              min={1}
              className={styles.numberInput}
            />
            <button
              className={styles.addButton}
              onClick={handleAddCustomFontSize}
              title="Set custom size"
            >
              Set
            </button>
          </div>
          <p className={styles.currentValue}>
            Hiện tại: <strong>{settings.defaultFontSizeMm}mm</strong>
          </p>
        </div>
      </div>

      {/* ===== SECTION 3: Font & Style ===== */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>3. Font & Kiểu chữ</div>

        {/* Font Family */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Font:</label>
          <select
            value={settings.fontFamily}
            onChange={(e) =>
              onSettingsChange({ fontFamily: e.target.value as TextFontFamily })
            }
            className={styles.select}
          >
            {FONT_FAMILY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Weight */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Weight:</label>
          <div className={styles.toggleGroupSmall}>
            <button
              className={`${styles.toggleSmall} ${
                settings.fontWeight === "normal" ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ fontWeight: "normal" })}
            >
              Regular
            </button>
            <button
              className={`${styles.toggleSmall} ${
                settings.fontWeight === "bold" ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ fontWeight: "bold" })}
            >
              <strong>Bold</strong>
            </button>
          </div>
        </div>

        {/* Text Align */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Align:</label>
          <div className={styles.toggleGroupSmall}>
            <button
              className={`${styles.toggleSmall} ${
                settings.textAlign === "left" ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ textAlign: "left" })}
              title="Left"
            >
              ⬅
            </button>
            <button
              className={`${styles.toggleSmall} ${
                settings.textAlign === "center" ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ textAlign: "center" })}
              title="Center"
            >
              ⬌
            </button>
            <button
              className={`${styles.toggleSmall} ${
                settings.textAlign === "right" ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ textAlign: "right" })}
              title="Right"
            >
              ➡
            </button>
          </div>
        </div>

        {/* Baseline */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Baseline:</label>
          <div className={styles.toggleGroupSmall}>
            <button
              className={`${styles.toggleSmall} ${
                settings.textBaseline === "alphabetic" ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ textBaseline: "alphabetic" })}
              title="Alphabetic - chuẩn cho SVG export"
            >
              Abc
            </button>
            <button
              className={`${styles.toggleSmall} ${
                settings.textBaseline === "middle" ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ textBaseline: "middle" })}
              title="Middle - căn giữa theo chiều dọc"
            >
              ⬍
            </button>
            <button
              className={`${styles.toggleSmall} ${
                settings.textBaseline === "top" ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ textBaseline: "top" })}
              title="Top"
            >
              ⬆
            </button>
          </div>
        </div>
      </div>

      {/* ===== SECTION 4: Display Quality ===== */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>4. Chất lượng hiển thị</div>

        {/* Anti-alias */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Anti-alias:</label>
          <button
            className={`${styles.toggleSmall} ${
              settings.antiAlias ? styles.active : ""
            }`}
            onClick={() => onSettingsChange({ antiAlias: !settings.antiAlias })}
          >
            {settings.antiAlias ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* ===== SECTION 5: SVG Export ===== */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>5. Xuất SVG</div>

        {/* Export Text */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Export Text:</label>
          <button
            className={`${styles.toggleSmall} ${
              settings.exportText ? styles.active : ""
            }`}
            onClick={() =>
              onSettingsChange({ exportText: !settings.exportText })
            }
          >
            {settings.exportText ? "ON" : "OFF"}
          </button>
        </div>

        {/* Use System Font */}
        <div className={styles.row}>
          <label className={styles.rowLabel}>Font:</label>
          <div className={styles.toggleGroupSmall}>
            <button
              className={`${styles.toggleSmall} ${
                settings.useSystemFont ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ useSystemFont: true })}
              title="Sử dụng font hệ thống"
            >
              System
            </button>
            <button
              className={`${styles.toggleSmall} ${
                !settings.useSystemFont ? styles.active : ""
              }`}
              onClick={() => onSettingsChange({ useSystemFont: false })}
              title="Embed font vào SVG"
            >
              Embed
            </button>
          </div>
        </div>

        {/* Multiline info */}
        <p className={styles.hint}>✓ Multiline: tspan per line (luôn bật)</p>
      </div>

      {/* Info box */}
      <div className={styles.infoBox}>
        <strong>📋 Invariant (3D-Ready):</strong>
        <ul>
          <li>Entity lưu fontSizeMm (world/mm)</li>
          <li>Scale mode chỉ ảnh hưởng render</li>
          <li>SVG export dùng world size</li>
        </ul>
      </div>
    </div>
  );
}

export default TextPanel;
