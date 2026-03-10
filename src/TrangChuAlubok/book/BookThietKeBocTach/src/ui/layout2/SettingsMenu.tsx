"use client";
import React, { useState } from "react";

// ==================== SettingsState Interface ====================
export interface SettingsState {
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
  // TEXT Settings
  showText: boolean;
  textColor: string;
  textOpacity: number;
  textScaleMode: "AUTO_ANNOTATION" | "WORLD_RATIO";
  textAnnotationPx: number;
  textWorldRatio: number;
  textFontFamily: string;
  textFontWeight: "normal" | "bold";
  textAntiAlias: boolean;
  // SVG Export Settings
  exportText: boolean;
  exportDim: boolean;
  exportMode: "world" | "preview";
}

// ==================== SettingsMenu Props ====================
export interface SettingsMenuProps {
  settings: SettingsState;
  onSettingsChange?: (settings: SettingsState) => void;
  onClose: () => void;
}

// ==================== Reusable Styles ====================
const selectStyle: React.CSSProperties = {
  padding: "3px 6px",
  backgroundColor: "#1a1a2e",
  border: "1px solid #444",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "11px",
  cursor: "pointer",
};

const colorInputStyle: React.CSSProperties = {
  width: "28px",
  height: "20px",
  border: "1px solid #444",
  borderRadius: "3px",
  backgroundColor: "transparent",
  cursor: "pointer",
  padding: 0,
};

const miniButtonStyle: React.CSSProperties = {
  padding: "3px 8px",
  border: "1px solid #444",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "10px",
  cursor: "pointer",
};

// ==================== Collapsible Section Component ====================
function CollapsibleSection({
  title,
  icon,
  defaultExpanded = false,
  children,
}: {
  title: string;
  icon?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={{ borderBottom: "1px solid #333" }}>
      {/* Header - clickable */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          cursor: "pointer",
          backgroundColor: expanded ? "#2a2a4a" : "transparent",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!expanded) e.currentTarget.style.backgroundColor = "#2a2a4a";
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {icon && <span style={{ fontSize: "12px" }}>{icon}</span>}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: expanded ? "#ddd" : "#888",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            color: "#666",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </div>
      {/* Content - collapsible */}
      {expanded && (
        <div style={{ padding: "4px 0 8px 0", backgroundColor: "#1e1e38" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ==================== Toggle Component ====================
function SettingsToggle({
  label,
  checked,
  onChange,
  shortcut,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  shortcut?: string;
}) {
  return (
    <div
      onClick={onChange}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#3a3a5e")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Toggle Switch */}
        <div
          style={{
            width: "32px",
            height: "18px",
            borderRadius: "9px",
            backgroundColor: checked ? "#4CAF50" : "#555",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              position: "absolute",
              top: "2px",
              left: checked ? "16px" : "2px",
              transition: "left 0.2s",
            }}
          />
        </div>
        <span style={{ fontSize: "13px", color: "#ddd" }}>{label}</span>
      </div>
      {shortcut && (
        <span
          style={{
            fontSize: "11px",
            color: "#666",
            backgroundColor: "#1a1a2e",
            padding: "2px 6px",
            borderRadius: "3px",
          }}
        >
          {shortcut}
        </span>
      )}
    </div>
  );
}

// ==================== Settings Row Component ====================
function SettingsRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: "12px", color: "#ddd" }}>{label}</span>
      {children}
    </div>
  );
}

// ==================== Settings Menu Component ====================
export default function SettingsMenu({
  settings,
  onSettingsChange,
  onClose,
}: SettingsMenuProps) {
  const [customScales] = useState<number[]>([]);

  const handleToggle = (key: keyof SettingsState) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        [key]: !settings[key],
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "60px",
        right: "10px",
        bottom: "10px",
        backgroundColor: "#252540",
        border: "1px solid #444",
        borderRadius: "6px",
        width: "240px",
        maxWidth: "calc(100vw - 20px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {/* ==================== 1. HIỂN THỊ ==================== */}
        <CollapsibleSection
          title="Hiển thị"
          icon="🖥️"
          defaultExpanded={true}
        >
          <SettingsToggle
            label="Grid (Lưới)"
            checked={settings.gridVisible}
            onChange={() => handleToggle("gridVisible")}
            shortcut="G"
          />

          {/* Canvas Background Color */}
          <SettingsRow label="Màu nền Canvas">
            <select
              value={settings.canvasBgColor}
              onChange={(e) => {
                if (onSettingsChange) {
                  onSettingsChange({
                    ...settings,
                    canvasBgColor: e.target.value,
                  });
                }
              }}
              style={selectStyle}
            >
              <option value="#1E1E1E">Xám đậm</option>
              <option value="#000000">Đen</option>
              <option value="#FFFFFF">Trắng</option>
            </select>
          </SettingsRow>

          {/* OSNAP Aperture Size */}
          <SettingsRow label="Độ nhạy OSNAP">
            <select
              value={settings.osnapApertureSize}
              onChange={(e) => {
                if (onSettingsChange) {
                  onSettingsChange({
                    ...settings,
                    osnapApertureSize: parseInt(e.target.value),
                  });
                }
              }}
              style={selectStyle}
            >
              <option value="3">Nhỏ (3px)</option>
              <option value="5">Vừa (5px)</option>
              <option value="8">Lớn (8px)</option>
              <option value="12">Rất lớn (12px)</option>
            </select>
          </SettingsRow>

          {/* Zoom Speed */}
          <div style={{ padding: "6px 12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#ddd" }}>
                Tốc độ Zoom
              </span>
              <span style={{ fontSize: "10px", color: "#888" }}>
                {settings.zoomFactor <= 1.05
                  ? "Chậm"
                  : settings.zoomFactor <= 1.1
                  ? "Vừa"
                  : settings.zoomFactor <= 1.2
                  ? "Nhanh"
                  : "Rất nhanh"}
              </span>
            </div>
            <input
              type="range"
              min="1.02"
              max="1.5"
              step="0.01"
              value={settings.zoomFactor}
              onChange={(e) => {
                if (onSettingsChange) {
                  onSettingsChange({
                    ...settings,
                    zoomFactor: parseFloat(e.target.value),
                  });
                }
              }}
              style={{
                width: "100%",
                height: "4px",
                cursor: "pointer",
              }}
            />
          </div>
        </CollapsibleSection>

        {/* ==================== 2. DIMENSION ==================== */}
        <CollapsibleSection title="Dimension" icon="📏">
          <SettingsToggle
            label="Hiển thị Dim"
            checked={settings.showDimensions}
            onChange={() => handleToggle("showDimensions")}
            shortcut="D"
          />
          <SettingsToggle
            label="Làm tròn Dim"
            checked={settings.dimRounding}
            onChange={() => handleToggle("dimRounding")}
          />
          <SettingsToggle
            label="Hiển thị đơn vị (mm)"
            checked={settings.dimShowUnit}
            onChange={() => handleToggle("dimShowUnit")}
          />
          <SettingsToggle
            label="Hở chân Dim"
            checked={settings.dimExtensionGap}
            onChange={() => handleToggle("dimExtensionGap")}
          />

          {/* Dim Colors */}
          <SettingsRow label="Màu text">
            <input
              type="color"
              value={settings.dimTextColor}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  dimTextColor: e.target.value,
                })
              }
              style={colorInputStyle}
            />
          </SettingsRow>
          <SettingsRow label="Màu line">
            <input
              type="color"
              value={settings.dimLineColor}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  dimLineColor: e.target.value,
                })
              }
              style={colorInputStyle}
            />
          </SettingsRow>

          {/* Lineweight */}
          <SettingsRow label="Độ dày nét">
            <select
              value={settings.dimLineweight}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  dimLineweight: parseFloat(e.target.value),
                })
              }
              style={selectStyle}
            >
              <option value={0.18}>Thin (0.18mm)</option>
              <option value={0.25}>Normal (0.25mm)</option>
              <option value={0.35}>Thick (0.35mm)</option>
            </select>
          </SettingsRow>

          {/* Arrow Style */}
          <SettingsRow label="Kiểu mũi tên">
            <select
              value={settings.dimArrowStyle}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  dimArrowStyle: e.target.value as
                    | "closed"
                    | "open"
                    | "tick"
                    | "dot"
                    | "none",
                })
              }
              style={selectStyle}
            >
              <option value="closed">Closed</option>
              <option value="open">Open</option>
              <option value="tick">Tick</option>
              <option value="dot">Dot</option>
              <option value="none">None</option>
            </select>
          </SettingsRow>

          {/* Dim Scale */}
          <SettingsToggle
            label="Tỉ lệ Dim"
            checked={settings.dimScaleEnabled}
            onChange={() => handleToggle("dimScaleEnabled")}
          />
          {settings.dimScaleEnabled && (
            <div style={{ paddingLeft: "12px" }}>
              <SettingsRow label="Tỉ lệ">
                <select
                  value={settings.dimScale}
                  onChange={(e) =>
                    onSettingsChange?.({
                      ...settings,
                      dimScale: Number(e.target.value),
                    })
                  }
                  style={selectStyle}
                >
                  <option value={0}>Auto (Zoom)</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  {customScales.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </SettingsRow>
            </div>
          )}
        </CollapsibleSection>

        {/* ==================== 3. TEXT ==================== */}
        <CollapsibleSection title="Text" icon="📝">
          <SettingsToggle
            label="Hiển thị Text"
            checked={settings.showText}
            onChange={() => handleToggle("showText")}
          />

          <SettingsRow label="Màu Text">
            <input
              type="color"
              value={settings.textColor}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  textColor: e.target.value,
                })
              }
              style={colorInputStyle}
            />
          </SettingsRow>

          {/* Opacity */}
          <div
            style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#ddd",
                minWidth: "50px",
              }}
            >
              Opacity
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.textOpacity}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  textOpacity: Number(e.target.value),
                })
              }
              style={{ flex: 1, height: "4px", cursor: "pointer" }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "#4a90d9",
                minWidth: "30px",
                textAlign: "right",
              }}
            >
              {settings.textOpacity}%
            </span>
          </div>

          {/* Scale Mode */}
          <SettingsRow label="Chế độ Scale">
            <select
              value={settings.textScaleMode}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  textScaleMode: e.target.value as
                    | "AUTO_ANNOTATION"
                    | "WORLD_RATIO",
                })
              }
              style={selectStyle}
            >
              <option value="AUTO_ANNOTATION">Auto (px)</option>
              <option value="WORLD_RATIO">World Ratio</option>
            </select>
          </SettingsRow>

          {settings.textScaleMode === "AUTO_ANNOTATION" && (
            <div style={{ paddingLeft: "12px" }}>
              <SettingsRow label="Cỡ chữ (px)">
                <select
                  value={settings.textAnnotationPx}
                  onChange={(e) =>
                    onSettingsChange?.({
                      ...settings,
                      textAnnotationPx: Number(e.target.value),
                    })
                  }
                  style={selectStyle}
                >
                  {[10, 12, 14, 16, 18, 20, 24].map((v) => (
                    <option key={v} value={v}>
                      {v}px
                    </option>
                  ))}
                </select>
              </SettingsRow>
            </div>
          )}

          {settings.textScaleMode === "WORLD_RATIO" && (
            <div style={{ paddingLeft: "12px" }}>
              <SettingsRow label="Tỉ lệ">
                <select
                  value={settings.textWorldRatio}
                  onChange={(e) =>
                    onSettingsChange?.({
                      ...settings,
                      textWorldRatio: Number(e.target.value),
                    })
                  }
                  style={selectStyle}
                >
                  {[0.5, 1, 2, 5, 10].map((v) => (
                    <option key={v} value={v}>
                      {v}x
                    </option>
                  ))}
                </select>
              </SettingsRow>
            </div>
          )}

          {/* Font */}
          <SettingsRow label="Font">
            <select
              value={settings.textFontFamily}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  textFontFamily: e.target.value,
                })
              }
              style={selectStyle}
            >
              <option value="Arial">Arial</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Courier New">Courier</option>
            </select>
          </SettingsRow>

          {/* Font Weight */}
          <SettingsRow label="Độ đậm">
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                onClick={() =>
                  onSettingsChange?.({
                    ...settings,
                    textFontWeight: "normal",
                  })
                }
                style={{
                  ...miniButtonStyle,
                  backgroundColor:
                    settings.textFontWeight === "normal"
                      ? "#4a90d9"
                      : "#333",
                }}
              >
                R
              </button>
              <button
                onClick={() =>
                  onSettingsChange?.({
                    ...settings,
                    textFontWeight: "bold",
                  })
                }
                style={{
                  ...miniButtonStyle,
                  backgroundColor:
                    settings.textFontWeight === "bold"
                      ? "#4a90d9"
                      : "#333",
                  fontWeight: "bold",
                }}
              >
                B
              </button>
            </div>
          </SettingsRow>

          <SettingsToggle
            label="Anti-alias"
            checked={settings.textAntiAlias}
            onChange={() => handleToggle("textAntiAlias")}
          />
        </CollapsibleSection>

        {/* ==================== 4. SVG EXPORT ==================== */}
        <CollapsibleSection title="SVG Export" icon="📤">
          <SettingsToggle
            label="Export TEXT"
            checked={settings.exportText}
            onChange={() => handleToggle("exportText")}
          />
          <SettingsToggle
            label="Export Dimensions"
            checked={settings.exportDim}
            onChange={() => handleToggle("exportDim")}
          />
          <SettingsRow label="Export Mode">
            <select
              value={settings.exportMode}
              onChange={(e) =>
                onSettingsChange?.({
                  ...settings,
                  exportMode: e.target.value as "world" | "preview",
                })
              }
              style={selectStyle}
            >
              <option value="world">World/mm</option>
              <option value="preview">Preview</option>
            </select>
          </SettingsRow>
          <div
            style={{
              padding: "4px 12px",
              fontSize: "10px",
              color: "#666",
              fontStyle: "italic",
            }}
          >
            {settings.exportMode === "world"
              ? "✓ Technical export (mm units)"
              : "✓ Browser preview (100%)"}
          </div>
        </CollapsibleSection>

        {/* ==================== 5. SNAP & MODE ==================== */}
        <CollapsibleSection title="Snap & Mode" icon="🎯">
          <SettingsToggle
            label="Snap to Grid"
            checked={settings.snapToGrid}
            onChange={() => handleToggle("snapToGrid")}
            shortcut="F9"
          />
          <SettingsToggle
            label="OSNAP"
            checked={settings.osnapEnabled}
            onChange={() => handleToggle("osnapEnabled")}
            shortcut="F3"
          />
          <SettingsToggle
            label="Ortho Mode"
            checked={settings.orthoMode}
            onChange={() => handleToggle("orthoMode")}
            shortcut="F8"
          />
        </CollapsibleSection>
      </div>

      {/* Close Button - Fixed at bottom */}
      <div
        style={{
          borderTop: "1px solid #444",
          padding: "10px 12px 8px 12px",
          backgroundColor: "#252540",
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "8px 12px",
            backgroundColor: "#3a3a5e",
            border: "1px solid #555",
            borderRadius: "4px",
            color: "#ddd",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#4a4a6e")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#3a3a5e")
          }
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Đóng
        </button>
      </div>
    </div>
  );
}
