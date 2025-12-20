"use client";
import React, { useState, useEffect } from "react";

interface ToolGroup {
  id: string;
  label: string;
  tools: {
    id: string;
    icon: string;
    label: string;
    shortcut?: string;
  }[];
}

interface Header2Props {
  activeTool?: string;
  onToolChange?: (toolId: string) => void;
  osnapEnabled?: boolean;
  orthoEnabled?: boolean;
  gridEnabled?: boolean;
  onOsnapToggle?: () => void;
  onOrthoToggle?: () => void;
  onGridToggle?: () => void;
  /** Toolbar collapsed state */
  isCollapsed?: boolean;
  /** Toggle collapse callback */
  onToggle?: () => void;
  /** Current stroke color */
  strokeColor?: string;
  /** Current fill color (null = no fill) */
  fillColor?: string | null;
  /** Stroke color change callback */
  onStrokeColorChange?: (color: string) => void;
  /** Fill color change callback */
  onFillColorChange?: (color: string | null) => void;
  /** Current opacity (0-1) */
  opacity?: number;
  /** Opacity change callback */
  onOpacityChange?: (opacity: number) => void;
  /** Current stroke style */
  strokeStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  /** Stroke style change callback */
  onStrokeStyleChange?: (
    style: "solid" | "dashed" | "dotted" | "dashdot"
  ) => void;
  /** Current stroke width */
  strokeWidth?: number;
  /** Stroke width change callback */
  onStrokeWidthChange?: (width: number) => void;
}

const toolGroups: ToolGroup[] = [
  {
    id: "draw",
    label: "Vẽ",
    tools: [
      { id: "line", icon: "📏", label: "Line", shortcut: "L" },
      { id: "rect", icon: "⬜", label: "Rect", shortcut: "R" },
      { id: "circle", icon: "⭕", label: "Circle", shortcut: "C" },
      { id: "arc", icon: "◠", label: "Arc", shortcut: "A" },
      { id: "ellipse", icon: "⬭", label: "Ellipse", shortcut: "EL" },
      { id: "polygon", icon: "📐", label: "Polygon", shortcut: "POL" },
    ],
  },
  {
    id: "modify",
    label: "Chỉnh sửa",
    tools: [
      { id: "move", icon: "↔️", label: "Move", shortcut: "M" },
      { id: "copy", icon: "📋", label: "Copy", shortcut: "CO" },
      { id: "rotate", icon: "🔄", label: "Rotate", shortcut: "RO" },
      { id: "scale", icon: "⤡", label: "Scale", shortcut: "SC" },
      { id: "mirror", icon: "🪞", label: "Mirror", shortcut: "MI" },
    ],
  },
  {
    id: "edit",
    label: "Biến đổi",
    tools: [
      { id: "trim", icon: "✂️", label: "Trim", shortcut: "TR" },
      { id: "extend", icon: "➡️", label: "Extend", shortcut: "EX" },
      { id: "offset", icon: "⟺", label: "Offset", shortcut: "O" },
      { id: "fillet", icon: "◜", label: "Fillet", shortcut: "F" },
    ],
  },
  {
    id: "annotate",
    label: "Ghi chú",
    tools: [
      { id: "dimension", icon: "📐", label: "Dim", shortcut: "D" },
      { id: "qdim", icon: "📐", label: "Qdim", shortcut: "QD" },
      { id: "dimcontinue", icon: "📐", label: "Dimcontinue", shortcut: "DCO" },
      { id: "dimarc", icon: "⌒", label: "Dimarc", shortcut: "DAR" },
      { id: "text", icon: "T", label: "Text", shortcut: "T" },
      { id: "leader", icon: "➤", label: "Leader" },
    ],
  },
  {
    id: "view",
    label: "Xem",
    tools: [
      { id: "zoomIn", icon: "🔍+", label: "Zoom In" },
      { id: "zoomOut", icon: "🔍-", label: "Zoom Out" },
      { id: "zoomFit", icon: "⛶", label: "Fit" },
      { id: "pan", icon: "✋", label: "Pan" },
    ],
  },
  {
    id: "tools",
    label: "Công cụ",
    tools: [
      { id: "measure", icon: "📏", label: "Measure" },
      { id: "select", icon: "◻️", label: "Select", shortcut: "V" },
      { id: "undo", icon: "↩️", label: "Undo", shortcut: "Ctrl+Z" },
      { id: "redo", icon: "↪️", label: "Redo", shortcut: "Ctrl+Y" },
    ],
  },
];

export default function Header2({
  activeTool = "select",
  onToolChange,
  osnapEnabled = true,
  orthoEnabled = false,
  gridEnabled = true,
  onOsnapToggle,
  onOrthoToggle,
  onGridToggle,
  isCollapsed = false,
  onToggle,
  strokeColor = "#FFFFFF",
  fillColor = null,
  onStrokeColorChange,
  onFillColorChange,
  opacity = 1,
  onOpacityChange,
  strokeStyle = "solid",
  onStrokeStyleChange,
  strokeWidth = 1,
  onStrokeWidthChange,
}: Header2Props): React.ReactElement {
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [showAllTools, setShowAllTools] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokeStylePicker, setShowStrokeStylePicker] = useState(false);

  // Preset colors for quick selection
  const presetColors = [
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#808080",
    "#000000",
    "#88CCFF",
    "#AAFFAA",
    "#FFCCCC",
    "#CCCCFF",
    "#FFFFCC",
  ];

  // Responsive check
  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize("mobile");
      else if (width < 1024) setScreenSize("tablet");
      else setScreenSize("desktop");
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";

  // Collapsed state - show minimal toolbar
  if (isCollapsed) {
    return (
      <div
        style={{
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#1e1e2e",
          borderBottom: "1px solid #333",
          padding: "0 8px",
        }}
      >
        <span style={{ fontSize: 11, color: "#888" }}>Toolbar</span>
        <button
          onClick={onToggle}
          style={{
            width: 24,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid #444",
            borderRadius: 3,
            cursor: "pointer",
            color: "#888",
            fontSize: 10,
          }}
          title="Expand Toolbar"
        >
          ▼
        </button>
      </div>
    );
  }

  // For mobile, show only essential tools unless expanded
  const visibleGroups =
    isMobile && !showAllTools
      ? toolGroups.filter((g) => ["draw", "tools"].includes(g.id))
      : toolGroups;

  const gridColumns = isMobile ? 2 : isTablet ? 3 : 6;

  return (
    <div
      style={{
        minHeight: isMobile ? 48 : 64,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e2e",
        borderBottom: "1px solid #333",
        padding: isMobile ? "4px" : "4px 8px",
        position: "relative",
      }}
    >
      {/* Collapse button - always visible on non-mobile */}
      {!isMobile && onToggle && (
        <button
          onClick={onToggle}
          style={{
            position: "absolute",
            top: 4,
            right: 8,
            width: 24,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid #444",
            borderRadius: 3,
            cursor: "pointer",
            color: "#888",
            fontSize: 10,
            zIndex: 10,
          }}
          title="Collapse Toolbar"
        >
          ▲
        </button>
      )}

      {/* Mobile: Toggle button */}
      {isMobile && (
        <button
          onClick={() => setShowAllTools(!showAllTools)}
          style={{
            alignSelf: "flex-end",
            background: "transparent",
            border: "1px solid #444",
            borderRadius: 4,
            padding: "2px 8px",
            fontSize: 10,
            color: "#888",
            marginBottom: 4,
            cursor: "pointer",
          }}
        >
          {showAllTools ? "Thu gọn ▲" : "Thêm công cụ ▼"}
        </button>
      )}

      {/* Tool Groups Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: isMobile ? 2 : 4,
          flex: 1,
        }}
      >
        {visibleGroups.map((group) => (
          <div
            key={group.id}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: isMobile ? 2 : 4,
              borderRadius: 4,
              backgroundColor: "#252535",
            }}
          >
            <span
              style={{
                fontSize: isMobile ? 8 : 9,
                color: "#888",
                textAlign: "center",
                marginBottom: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {group.label}
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: isMobile ? 1 : 2,
                justifyContent: "center",
              }}
            >
              {group.tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onToolChange?.(tool.id)}
                  title={`${tool.label}${
                    tool.shortcut ? ` (${tool.shortcut})` : ""
                  }`}
                  style={{
                    width: isMobile ? 24 : 28,
                    height: isMobile ? 22 : 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? 10 : 12,
                    background:
                      activeTool === tool.id ? "#4a90d9" : "transparent",
                    border: "none",
                    borderRadius: 3,
                    cursor: "pointer",
                    color: activeTool === tool.id ? "#fff" : "#ccc",
                  }}
                >
                  {tool.icon}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* OSNAP / ORTHO / GRID Toggles */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: isMobile ? 8 : 16,
          marginTop: 4,
          paddingTop: 4,
          borderTop: "1px solid #333",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: isMobile ? 9 : 10,
            color: osnapEnabled ? "#4ade80" : "#888",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={osnapEnabled}
            onChange={onOsnapToggle}
            style={{ width: isMobile ? 10 : 12, height: isMobile ? 10 : 12 }}
          />
          {isMobile ? "SNAP" : "OSNAP"}
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: isMobile ? 9 : 10,
            color: orthoEnabled ? "#4ade80" : "#888",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={orthoEnabled}
            onChange={onOrthoToggle}
            style={{ width: isMobile ? 10 : 12, height: isMobile ? 10 : 12 }}
          />
          ORTHO
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: isMobile ? 9 : 10,
            color: gridEnabled ? "#4ade80" : "#888",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={gridEnabled}
            onChange={onGridToggle}
            style={{ width: isMobile ? 10 : 12, height: isMobile ? 10 : 12 }}
          />
          GRID
        </label>

        {/* Separator */}
        <div
          style={{
            width: 1,
            height: 16,
            backgroundColor: "#444",
            margin: "0 8px",
          }}
        />

        {/* Stroke Color Picker */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => {
              setShowStrokePicker(!showStrokePicker);
              setShowFillPicker(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: showStrokePicker ? "#333" : "transparent",
            }}
            title="Stroke Color (Màu viền)"
          >
            <span style={{ fontSize: isMobile ? 9 : 10, color: "#888" }}>
              Stroke:
            </span>
            <div
              style={{
                width: isMobile ? 16 : 20,
                height: isMobile ? 16 : 20,
                backgroundColor: strokeColor,
                border: "2px solid #555",
                borderRadius: 3,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.3)",
              }}
            />
            <span style={{ fontSize: 8, color: "#666" }}>▼</span>
          </div>

          {/* Stroke Color Dropdown */}
          {showStrokePicker && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                padding: 8,
                backgroundColor: "#2a2a3a",
                border: "1px solid #444",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                zIndex: 1000,
                minWidth: 160,
              }}
            >
              <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
                Chọn màu viền:
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 4,
                }}
              >
                {presetColors.map((color) => (
                  <div
                    key={color}
                    onClick={() => {
                      onStrokeColorChange?.(color);
                      setShowStrokePicker(false);
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: color,
                      border:
                        strokeColor === color
                          ? "2px solid #4ade80"
                          : "1px solid #555",
                      borderRadius: 4,
                      cursor: "pointer",
                      transition: "transform 0.1s",
                    }}
                    title={color}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  />
                ))}
              </div>
              {/* Custom color input */}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange?.(e.target.value)}
                  style={{
                    width: 28,
                    height: 24,
                    cursor: "pointer",
                    border: "none",
                  }}
                />
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange?.(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "2px 4px",
                    fontSize: 10,
                    backgroundColor: "#1e1e2e",
                    border: "1px solid #444",
                    borderRadius: 3,
                    color: "#ccc",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Fill Color Picker */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => {
              setShowFillPicker(!showFillPicker);
              setShowStrokePicker(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: showFillPicker ? "#333" : "transparent",
            }}
            title="Fill Color (Màu nền)"
          >
            <span style={{ fontSize: isMobile ? 9 : 10, color: "#888" }}>
              Fill:
            </span>
            <div
              style={{
                width: isMobile ? 16 : 20,
                height: isMobile ? 16 : 20,
                backgroundColor: fillColor || "transparent",
                border: "2px solid #555",
                borderRadius: 3,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.3)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* No fill indicator (diagonal line) */}
              {!fillColor && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "-20%",
                    width: "140%",
                    height: 2,
                    backgroundColor: "#ff4444",
                    transform: "rotate(-45deg)",
                    transformOrigin: "center",
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 8, color: "#666" }}>▼</span>
          </div>

          {/* Fill Color Dropdown */}
          {showFillPicker && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                padding: 8,
                backgroundColor: "#2a2a3a",
                border: "1px solid #444",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                zIndex: 1000,
                minWidth: 160,
              }}
            >
              <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
                Chọn màu nền:
              </div>

              {/* No Fill Option */}
              <div
                onClick={() => {
                  onFillColorChange?.(null);
                  setShowFillPicker(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 6px",
                  marginBottom: 6,
                  backgroundColor:
                    fillColor === null ? "#3a3a4a" : "transparent",
                  border: "1px solid #444",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: "transparent",
                    border: "1px solid #666",
                    borderRadius: 3,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "-20%",
                      width: "140%",
                      height: 2,
                      backgroundColor: "#ff4444",
                      transform: "rotate(-45deg)",
                      transformOrigin: "center",
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "#ccc" }}>
                  Không nền (None)
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 4,
                }}
              >
                {presetColors.map((color) => (
                  <div
                    key={color}
                    onClick={() => {
                      onFillColorChange?.(color);
                      setShowFillPicker(false);
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: color,
                      border:
                        fillColor === color
                          ? "2px solid #4ade80"
                          : "1px solid #555",
                      borderRadius: 4,
                      cursor: "pointer",
                      transition: "transform 0.1s",
                    }}
                    title={color}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  />
                ))}
              </div>
              {/* Custom color input */}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <input
                  type="color"
                  value={fillColor || "#FFFFFF"}
                  onChange={(e) => onFillColorChange?.(e.target.value)}
                  style={{
                    width: 28,
                    height: 24,
                    cursor: "pointer",
                    border: "none",
                  }}
                />
                <input
                  type="text"
                  value={fillColor || "None"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.toLowerCase() === "none" || val === "") {
                      onFillColorChange?.(null);
                    } else {
                      onFillColorChange?.(val);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "2px 4px",
                    fontSize: 10,
                    backgroundColor: "#1e1e2e",
                    border: "1px solid #444",
                    borderRadius: 3,
                    color: "#ccc",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Opacity Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: isMobile ? 9 : 10, color: "#888" }}>
            Opacity:
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => onOpacityChange?.(parseInt(e.target.value) / 100)}
            style={{
              width: isMobile ? 40 : 60,
              height: 4,
              cursor: "pointer",
              accentColor: "#4ade80",
            }}
            title={`Opacity: ${Math.round(opacity * 100)}%`}
          />
          <span style={{ fontSize: 9, color: "#aaa", minWidth: 28 }}>
            {Math.round(opacity * 100)}%
          </span>
        </div>

        {/* Stroke Style Picker */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => {
              setShowStrokeStylePicker(!showStrokeStylePicker);
              setShowStrokePicker(false);
              setShowFillPicker(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: showStrokeStylePicker ? "#333" : "transparent",
            }}
            title="Stroke Style (Kiểu nét)"
          >
            <span style={{ fontSize: isMobile ? 9 : 10, color: "#888" }}>
              Line:
            </span>
            {/* Line preview */}
            <div
              style={{
                width: isMobile ? 24 : 32,
                height: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #555",
                borderRadius: 2,
                backgroundColor: "#1e1e2e",
              }}
            >
              <svg width="28" height="8" viewBox="0 0 28 8">
                <line
                  x1="2"
                  y1="4"
                  x2="26"
                  y2="4"
                  stroke={strokeColor}
                  strokeWidth={Math.min(strokeWidth, 3)}
                  strokeDasharray={
                    strokeStyle === "dashed"
                      ? "4,2"
                      : strokeStyle === "dotted"
                      ? "1,2"
                      : strokeStyle === "dashdot"
                      ? "4,2,1,2"
                      : "none"
                  }
                />
              </svg>
            </div>
            <span style={{ fontSize: 8, color: "#666" }}>▼</span>
          </div>

          {/* Stroke Style Dropdown */}
          {showStrokeStylePicker && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                padding: 8,
                backgroundColor: "#2a2a3a",
                border: "1px solid #444",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                zIndex: 1000,
                minWidth: 180,
              }}
            >
              {/* Stroke Style Options */}
              <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
                Kiểu nét:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(["solid", "dashed", "dotted", "dashdot"] as const).map(
                  (style) => (
                    <div
                      key={style}
                      onClick={() => {
                        onStrokeStyleChange?.(style);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 6px",
                        backgroundColor:
                          strokeStyle === style ? "#3a3a4a" : "transparent",
                        border: "1px solid #444",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      <svg width="40" height="10" viewBox="0 0 40 10">
                        <line
                          x1="2"
                          y1="5"
                          x2="38"
                          y2="5"
                          stroke="#ccc"
                          strokeWidth="2"
                          strokeDasharray={
                            style === "dashed"
                              ? "6,3"
                              : style === "dotted"
                              ? "2,3"
                              : style === "dashdot"
                              ? "6,3,2,3"
                              : "none"
                          }
                        />
                      </svg>
                      <span style={{ fontSize: 10, color: "#ccc" }}>
                        {style === "solid"
                          ? "Nét liền"
                          : style === "dashed"
                          ? "Nét đứt"
                          : style === "dotted"
                          ? "Nét chấm"
                          : "Gạch-chấm"}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Stroke Width */}
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: "1px solid #444",
                }}
              >
                <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
                  Độ dày: {strokeWidth}px
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) =>
                      onStrokeWidthChange?.(parseInt(e.target.value))
                    }
                    style={{
                      flex: 1,
                      height: 4,
                      cursor: "pointer",
                      accentColor: "#4ade80",
                    }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) =>
                      onStrokeWidthChange?.(parseInt(e.target.value) || 1)
                    }
                    style={{
                      width: 40,
                      padding: "2px 4px",
                      fontSize: 10,
                      backgroundColor: "#1e1e2e",
                      border: "1px solid #444",
                      borderRadius: 3,
                      color: "#ccc",
                      textAlign: "center",
                    }}
                  />
                </div>
                {/* Width preview */}
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <svg width="120" height="20" viewBox="0 0 120 20">
                    <line
                      x1="10"
                      y1="10"
                      x2="110"
                      y2="10"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={
                        strokeStyle === "dashed"
                          ? "8,4"
                          : strokeStyle === "dotted"
                          ? "2,4"
                          : strokeStyle === "dashdot"
                          ? "8,4,2,4"
                          : "none"
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
