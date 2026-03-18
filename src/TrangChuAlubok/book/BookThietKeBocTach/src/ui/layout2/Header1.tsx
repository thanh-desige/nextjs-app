"use client";
import React, { useState } from "react";
import SettingsMenu, { type SettingsState } from "./SettingsMenu";

export type { SettingsState };

type TabType = "thietke" | "filebom" | "filebaogia";

interface Header1Props {
  filename?: string;
  setFilename?: (name: string) => void;
  settings?: SettingsState;
  onSettingsChange?: (settings: SettingsState) => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  autoSave?: boolean;
  onAutoSaveChange?: (enabled: boolean) => void;
  isSaved?: boolean;
  onBackClick?: () => void;
}

export default function Header1({
  settings = {
    gridVisible: true,
    snapToGrid: false,
    osnapEnabled: false,
    orthoMode: false,
    showDimensions: true,
    dimScaleEnabled: true,
    dimScale: 0,
    dimRounding: true,
    dimShowUnit: false,
    dimTextColor: "#00ff00",
    dimLineColor: "#00ff00",
    dimLineweight: 0.25,
    dimExtensionGap: true,
    dimArrowStyle: "closed",
    canvasBgColor: "#1E1E1E",
    osnapApertureSize: 5,
    zoomFactor: 1.1,
    showText: true,
    textColor: "#ffffff",
    textOpacity: 100,
    textScaleMode: "WORLD_RATIO",
    textAnnotationPx: 14,
    textWorldRatio: 1,
    textFontFamily: "Arial",
    textFontWeight: "normal",
    textAntiAlias: true,
    exportText: true,
    exportDim: true,
    exportMode: "world",
  },
  onSettingsChange,
  activeTab = "thietke",
  onTabChange,
  autoSave = true,
  onAutoSaveChange,
  isSaved = true,
  onBackClick,
}: Header1Props) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const tabs: { id: TabType; label: string }[] = [
    { id: "thietke", label: "Thiết kế" },
    { id: "filebom", label: "Bóc tách (BOM)" },
    { id: "filebaogia", label: "Danh sách cắt" },
  ];

  return (
    <div
      style={{
        backgroundColor: "#1a1a2e",
        color: "#ddd",
        height: "36px",
        padding: "0 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #333",
        fontSize: "14px",
        fontWeight: 500,
      }}
    >
      {/* Left: Back button */}
      <div style={{ display: "flex", alignItems: "center", minWidth: 60 }}>
        <button
          onClick={onBackClick}
          style={{
            background: "transparent",
            border: "none",
            color: "#888",
            fontSize: 0,
            cursor: "pointer",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
          }}
          title="Quay lại"
        >
          ←
        </button>
      </div>

      {/* Center: 3 Tab Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => onTabChange?.(tab.id)}
              style={{
                width: 100,
                height: 22,
                padding: 0,
                fontSize: 12,
                fontWeight: 500,
                border:
                  activeTab === tab.id ? "1px solid #9b59b6" : "1px solid #444",
                borderRadius: 4,
                backgroundColor:
                  activeTab === tab.id ? "#9b59b6" : "transparent",
                color: activeTab === tab.id ? "#1a1a2e" : "#888",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = "#666";
                  e.currentTarget.style.color = "#aaa";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = "#444";
                  e.currentTarget.style.color = "#888";
                }
              }}
            >
              {tab.label}
            </button>
            {/* Arrow indicator below active tab */}
            {activeTab === tab.id && (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "8px solid #9b59b6",
                  marginTop: -1,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Right: Auto Save + Status + Settings */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          fontSize: "12px",
          alignItems: "center",
        }}
      >
        {/* Auto Save Toggle */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            color: "#888",
          }}
          onClick={() => onAutoSaveChange?.(!autoSave)}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: autoSave ? "2px solid #4a90d9" : "2px solid #555",
              backgroundColor: autoSave ? "#4a90d9" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            {autoSave && <span style={{ color: "#fff", fontSize: 9 }}>✓</span>}
          </span>
          Lưu tự động
        </label>

        {/* Save Status */}
        <span
          style={{
            color: isSaved ? "#f87171" : "#888",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {isSaved ? (
            <>
              <span style={{ color: "#f87171", fontSize: 16 }}>✱</span> Đã lưu
            </>
          ) : (
            "Chưa lưu"
          )}
        </span>

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
            <SettingsMenu
              settings={settings}
              onSettingsChange={onSettingsChange}
              onClose={() => setShowSettingsMenu(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
