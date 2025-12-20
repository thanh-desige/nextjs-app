"use client";
import React, { useState } from "react";

interface SettingsState {
  gridVisible: boolean;
  snapToGrid: boolean;
  osnapEnabled: boolean;
  orthoMode: boolean;
  showDimensions: boolean;
}

interface Header1Props {
  filename: string;
  setFilename: (name: string) => void;
  settings?: SettingsState;
  onSettingsChange?: (settings: SettingsState) => void;
}

export default function Header1({
  filename,
  setFilename,
  settings = {
    gridVisible: true,
    snapToGrid: false,
    osnapEnabled: false,
    orthoMode: false,
    showDimensions: true,
  },
  onSettingsChange,
}: Header1Props) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

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
        backgroundColor: "#1a1a2e",
        color: "#ddd",
        height: "33px",
        padding: "0 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #333",
        fontSize: "14px",
        fontWeight: 500,
      }}
    >
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <span>📁 File:</span>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            border: "none",
            fontSize: "13px",
            width: "200px",
            backgroundColor: "#252535",
            color: "#ddd",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          fontSize: "12px",
          alignItems: "center",
        }}
      >
        <span>✓ Lưu tự động</span>
        <span>📌 Đã lưu</span>

        {/* Settings Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            style={{
              background: showSettingsMenu ? "#3a3a5e" : "transparent",
              border: "1px solid #444",
              borderRadius: "4px",
              padding: "4px 10px",
              color: "#ddd",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
            }}
            title="Cài đặt"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Cài đặt
          </button>

          {/* Settings Dropdown Menu */}
          {showSettingsMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                backgroundColor: "#252540",
                border: "1px solid #444",
                borderRadius: "6px",
                padding: "8px 0 18px 0",
                minWidth: "220px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: "6px 12px",
                  color: "#888",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Hiển thị
              </div>

              <SettingsToggle
                label="Grid (Lưới)"
                checked={settings.gridVisible}
                onChange={() => handleToggle("gridVisible")}
                shortcut="G"
              />

              <SettingsToggle
                label="Dimensions (Kích thước)"
                checked={settings.showDimensions}
                onChange={() => handleToggle("showDimensions")}
                shortcut="D"
              />

              <div style={{ borderTop: "1px solid #444", margin: "6px 0" }} />

              <div
                style={{
                  padding: "6px 12px",
                  color: "#888",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Snap & Mode
              </div>

              <SettingsToggle
                label="Snap to Grid"
                checked={settings.snapToGrid}
                onChange={() => handleToggle("snapToGrid")}
                shortcut="F9"
              />

              <SettingsToggle
                label="OSNAP (Object Snap)"
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

              {/* Close Button */}
              <div
                style={{ borderTop: "1px solid #444", margin: "10px 0 6px 0" }}
              />
              <div style={{ padding: "0 12px" }}>
                <button
                  onClick={() => setShowSettingsMenu(false)}
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
          )}
        </div>
      </div>
    </div>
  );
}

// Toggle component for settings menu
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
