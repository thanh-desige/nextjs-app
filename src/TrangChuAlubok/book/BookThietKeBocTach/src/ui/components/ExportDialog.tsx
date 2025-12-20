/**
 * ExportDialog - Modal for exporting drawings
 * Supports: PDF, SVG, PNG, DXF with options
 */

"use client";

import React, { useState, useCallback } from "react";
import styles from "./ExportDialog.module.css";

// ==================== Types ====================

export type ExportFormat = "pdf" | "svg" | "png" | "dxf";

export interface ExportSettings {
  format: ExportFormat;
  width: number;
  height: number;
  scale: number;
  backgroundColor: string;
  includeGrid: boolean;
  includeDimensions: boolean;
  title: string;
}

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
  defaultTitle?: string;
}

// ==================== Icons ====================

const FileIcon = ({ format }: { format: ExportFormat }) => {
  const colors: Record<ExportFormat, string> = {
    pdf: "#ff6b6b",
    svg: "#4ade80",
    png: "#4a90d9",
    dxf: "#fbbf24",
  };

  return (
    <div
      className={styles.fileIcon}
      style={{ backgroundColor: colors[format] }}
    >
      {format.toUpperCase()}
    </div>
  );
};

// ==================== Component ====================

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  defaultTitle = "drawing",
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: "png",
    width: 1920,
    height: 1080,
    scale: 1,
    backgroundColor: "#1a1a2e",
    includeGrid: false,
    includeDimensions: true,
    title: defaultTitle,
  });

  const formats: { value: ExportFormat; label: string; desc: string }[] = [
    { value: "png", label: "PNG Image", desc: "Hình ảnh chất lượng cao" },
    { value: "svg", label: "SVG Vector", desc: "Đồ họa vector có thể scale" },
    { value: "dxf", label: "DXF AutoCAD", desc: "Tương thích AutoCAD" },
    { value: "pdf", label: "PDF Document", desc: "Tài liệu in ấn" },
  ];

  const presets = [
    { label: "HD", width: 1280, height: 720 },
    { label: "Full HD", width: 1920, height: 1080 },
    { label: "2K", width: 2560, height: 1440 },
    { label: "4K", width: 3840, height: 2160 },
    { label: "A4", width: 2480, height: 3508 },
    { label: "A3", width: 3508, height: 4961 },
  ];

  const handleExport = useCallback(() => {
    onExport(settings);
    onClose();
  }, [settings, onExport, onClose]);

  const updateSetting = <K extends keyof ExportSettings>(
    key: K,
    value: ExportSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Xuất bản vẽ</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Format Selection */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Định dạng</label>
            <div className={styles.formatGrid}>
              {formats.map((f) => (
                <button
                  key={f.value}
                  className={`${styles.formatButton} ${
                    settings.format === f.value ? styles.active : ""
                  }`}
                  onClick={() => updateSetting("format", f.value)}
                >
                  <FileIcon format={f.value} />
                  <div className={styles.formatInfo}>
                    <span className={styles.formatLabel}>{f.label}</span>
                    <span className={styles.formatDesc}>{f.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Tên file</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => updateSetting("title", e.target.value)}
              className={styles.input}
              placeholder="Nhập tên file..."
            />
          </div>

          {/* Size Settings (for image formats) */}
          {(settings.format === "png" || settings.format === "svg") && (
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Kích thước</label>

              {/* Presets */}
              <div className={styles.presets}>
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    className={`${styles.presetButton} ${
                      settings.width === preset.width &&
                      settings.height === preset.height
                        ? styles.active
                        : ""
                    }`}
                    onClick={() => {
                      updateSetting("width", preset.width);
                      updateSetting("height", preset.height);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Size */}
              <div className={styles.sizeInputs}>
                <div className={styles.sizeInput}>
                  <label>Width</label>
                  <input
                    type="number"
                    value={settings.width}
                    onChange={(e) =>
                      updateSetting("width", parseInt(e.target.value) || 800)
                    }
                    min={100}
                    max={8000}
                  />
                  <span>px</span>
                </div>
                <span className={styles.sizeSeparator}>×</span>
                <div className={styles.sizeInput}>
                  <label>Height</label>
                  <input
                    type="number"
                    value={settings.height}
                    onChange={(e) =>
                      updateSetting("height", parseInt(e.target.value) || 600)
                    }
                    min={100}
                    max={8000}
                  />
                  <span>px</span>
                </div>
              </div>
            </div>
          )}

          {/* Scale */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Tỷ lệ</label>
            <div className={styles.scaleInput}>
              <input
                type="range"
                min={0.25}
                max={4}
                step={0.25}
                value={settings.scale}
                onChange={(e) =>
                  updateSetting("scale", parseFloat(e.target.value))
                }
                className={styles.slider}
              />
              <span className={styles.scaleValue}>{settings.scale}x</span>
            </div>
          </div>

          {/* Options */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Tùy chọn</label>
            <div className={styles.options}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={settings.includeGrid}
                  onChange={(e) =>
                    updateSetting("includeGrid", e.target.checked)
                  }
                />
                <span>Bao gồm lưới</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={settings.includeDimensions}
                  onChange={(e) =>
                    updateSetting("includeDimensions", e.target.checked)
                  }
                />
                <span>Bao gồm kích thước</span>
              </label>
            </div>
          </div>

          {/* Background Color */}
          <div className={styles.section}>
            <label className={styles.sectionTitle}>Màu nền</label>
            <div className={styles.colorInput}>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) =>
                  updateSetting("backgroundColor", e.target.value)
                }
                className={styles.colorPicker}
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) =>
                  updateSetting("backgroundColor", e.target.value)
                }
                className={styles.colorText}
              />
              <button
                className={styles.transparentButton}
                onClick={() => updateSetting("backgroundColor", "transparent")}
              >
                Trong suốt
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Hủy
          </button>
          <button className={styles.exportButton} onClick={handleExport}>
            Xuất {settings.format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
