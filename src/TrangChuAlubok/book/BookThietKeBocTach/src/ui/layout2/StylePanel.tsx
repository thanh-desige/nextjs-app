"use client";
import React, { useState, useRef, useEffect } from "react";

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

export interface StylePanelProps {
  strokeColor: string;
  fillColor: string | null;
  opacity: number;
  strokeStyle: "solid" | "dashed" | "dotted" | "dashdot";
  strokeWidth: number;
  onStrokeColorChange?: (color: string) => void;
  onFillColorChange?: (color: string | null) => void;
  onOpacityChange?: (opacity: number) => void;
  onStrokeStyleChange?: (
    style: "solid" | "dashed" | "dotted" | "dashdot"
  ) => void;
  onStrokeWidthChange?: (width: number) => void;
  isEditingSelection?: boolean;
  selectedCount?: number;
}

export default function StylePanel({
  strokeColor,
  fillColor,
  opacity,
  strokeStyle,
  strokeWidth,
  onStrokeColorChange,
  onFillColorChange,
  onOpacityChange,
  onStrokeStyleChange,
  onStrokeWidthChange,
  isEditingSelection = false,
  selectedCount = 0,
}: StylePanelProps) {
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokeStylePicker, setShowStrokeStylePicker] = useState(false);
  const strokeStyleButtonRef = useRef<HTMLDivElement>(null);
  const [strokeStyleButtonRect, setStrokeStyleButtonRect] =
    useState<DOMRect | null>(null);
  const [strokeButtonRect, setStrokeButtonRect] = useState<DOMRect | null>(
    null
  );
  const [fillButtonRect, setFillButtonRect] = useState<DOMRect | null>(null);
  const strokeButtonRef = useRef<HTMLDivElement>(null);
  const fillButtonRef = useRef<HTMLDivElement>(null);

  // Update button positions when pickers are shown
  useEffect(() => {
    if (showStrokePicker && strokeButtonRef.current) {
      setStrokeButtonRect(strokeButtonRef.current.getBoundingClientRect());
    }
  }, [showStrokePicker]);

  useEffect(() => {
    if (showFillPicker && fillButtonRef.current) {
      setFillButtonRect(fillButtonRef.current.getBoundingClientRect());
    }
  }, [showFillPicker]);

  useEffect(() => {
    if (showStrokeStylePicker && strokeStyleButtonRef.current) {
      setStrokeStyleButtonRect(
        strokeStyleButtonRef.current.getBoundingClientRect()
      );
    }
  }, [showStrokeStylePicker]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showStrokePicker || showFillPicker || showStrokeStylePicker) {
        const target = e.target as HTMLElement;
        if (
          !target.closest("[data-color-picker]") &&
          !target.closest("[data-style-picker]")
        ) {
          setShowStrokePicker(false);
          setShowFillPicker(false);
          setShowStrokeStylePicker(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStrokePicker, showFillPicker, showStrokeStylePicker]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        padding: "1px 2px 2px 2px",
        backgroundColor: "#252526",
        borderRadius: "0px",
        border: "2px solid #252526",
        height: "149px",
        position: "relative",
        zIndex: 100,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          color: "#BA00AE",
          fontSize: "13px",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: "0px",
        }}
      >
        Style
        {isEditingSelection && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: "#4ade80",
              marginLeft: "4px",
            }}
            title={`Editing ${selectedCount} selected object(s)`}
          >
            ({selectedCount})
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "4px",
          position: "relative",
          zIndex: 101,
        }}
      >
        {/* Stroke Color */}
        <div style={{ position: "relative" }} data-color-picker>
          <div
            ref={strokeButtonRef}
            onClick={() => {
              setShowStrokePicker(!showStrokePicker);
              setShowFillPicker(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              padding: "0 6px",
              height: 26,
              borderRadius: 4,
              backgroundColor: showStrokePicker ? "#3a3a4a" : "#515D50",
              border: "1px solid #6a7a68",
            }}
            title="Stroke Color (Màu viền)"
          >
            <span
              style={{
                fontSize: 11,
                color: "#e0e0e0",
                fontWeight: 500,
                flex: 1,
              }}
            >
              Stroke
            </span>
            {/* Stroke icon - border square with diagonal line */}
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: "transparent",
                border: `2px solid ${strokeColor}`,
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
                  backgroundColor: strokeColor,
                  transform: "rotate(-45deg)",
                  transformOrigin: "center",
                }}
              />
            </div>
          </div>

          {/* Stroke Color Dropdown - Fixed position */}
          {showStrokePicker && strokeButtonRect && (
            <div
              data-color-picker
              style={{
                position: "fixed",
                top: strokeButtonRect.bottom + 4,
                left: strokeButtonRect.left,
                padding: 10,
                backgroundColor: "#2a2a3a",
                border: "1px solid #555",
                borderRadius: 8,
                boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                zIndex: 999999,
                minWidth: 180,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#999",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Chọn màu viền:
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 6,
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
                      width: 28,
                      height: 28,
                      backgroundColor: color,
                      border:
                        strokeColor === color
                          ? "3px solid #4ade80"
                          : "2px solid #555",
                      borderRadius: 4,
                      cursor: "pointer",
                      transition: "transform 0.1s, box-shadow 0.1s",
                    }}
                    title={color}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.15)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                ))}
              </div>
              {/* Custom color input */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange?.(e.target.value)}
                  style={{
                    width: 32,
                    height: 28,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: 4,
                  }}
                />
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange?.(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "4px 6px",
                    fontSize: 11,
                    backgroundColor: "#1e1e2e",
                    border: "1px solid #555",
                    borderRadius: 4,
                    color: "#ddd",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Fill Color */}
        <div style={{ position: "relative" }} data-color-picker>
          <div
            ref={fillButtonRef}
            onClick={() => {
              setShowFillPicker(!showFillPicker);
              setShowStrokePicker(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              padding: "0 6px",
              height: 26,
              borderRadius: 4,
              backgroundColor: showFillPicker ? "#3a3a4a" : "#515D50",
              border: "1px solid #6a7a68",
            }}
            title="Fill Color (Màu nền)"
          >
            <span
              style={{
                fontSize: 11,
                color: "#e0e0e0",
                fontWeight: 500,
                flex: 1,
              }}
            >
              Fill
            </span>
            {/* Fill icon - solid filled square */}
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: fillColor || "#FFFFFF",
                border: "2px solid #888",
                borderRadius: 3,
              }}
            />
          </div>

          {/* Fill Color Dropdown - Fixed position */}
          {showFillPicker && fillButtonRect && (
            <div
              data-color-picker
              style={{
                position: "fixed",
                top: fillButtonRect.bottom + 4,
                left: fillButtonRect.left,
                padding: 10,
                backgroundColor: "#2a2a3a",
                border: "1px solid #555",
                borderRadius: 8,
                boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                zIndex: 999999,
                minWidth: 180,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#999",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
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
                  gap: 8,
                  padding: "6px 8px",
                  marginBottom: 8,
                  backgroundColor:
                    fillColor === null ? "#3a3a4a" : "transparent",
                  border:
                    fillColor === null
                      ? "2px solid #4ade80"
                      : "1px solid #555",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: "transparent",
                    border: "2px solid #666",
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
                <span style={{ fontSize: 11, color: "#ccc" }}>None</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 6,
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
                      width: 28,
                      height: 28,
                      backgroundColor: color,
                      border:
                        fillColor === color
                          ? "3px solid #4ade80"
                          : "2px solid #555",
                      borderRadius: 4,
                      cursor: "pointer",
                      transition: "transform 0.1s, box-shadow 0.1s",
                    }}
                    title={color}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.15)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                ))}
              </div>
              {/* Custom color input */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <input
                  type="color"
                  value={fillColor || "#FFFFFF"}
                  onChange={(e) => onFillColorChange?.(e.target.value)}
                  style={{
                    width: 32,
                    height: 28,
                    cursor: "pointer",
                    border: "none",
                    borderRadius: 4,
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
                    padding: "4px 6px",
                    fontSize: 11,
                    backgroundColor: "#1e1e2e",
                    border: "1px solid #555",
                    borderRadius: 4,
                    color: "#ddd",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Opacity Slider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 6px",
            height: 26,
            borderRadius: 4,
            backgroundColor: "#515D50",
            border: "1px solid #6a7a68",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#e0e0e0",
              fontWeight: 500,
            }}
          >
            Opacity
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) =>
              onOpacityChange?.(parseInt(e.target.value) / 100)
            }
            style={{
              flex: 1,
              minWidth: 0,
              height: 4,
              cursor: "pointer",
              accentColor: "#4ade80",
            }}
            title={`Opacity: ${Math.round(opacity * 100)}%`}
          />
          <span style={{ fontSize: 10, color: "#aaa" }}>
            {Math.round(opacity * 100)}%
          </span>
        </div>

        {/* Stroke Style Picker */}
        <div style={{ position: "relative" }} data-style-picker>
          <div
            ref={strokeStyleButtonRef}
            onClick={() => {
              setShowStrokeStylePicker(!showStrokeStylePicker);
              setShowStrokePicker(false);
              setShowFillPicker(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              padding: "0 6px",
              height: 26,
              borderRadius: 4,
              backgroundColor: showStrokeStylePicker ? "#3a3a4a" : "#515D50",
              border: "1px solid #6a7a68",
            }}
            title="Stroke Style (Kiểu nét)"
          >
            <span
              style={{
                fontSize: 11,
                color: "#e0e0e0",
                fontWeight: 500,
                flex: 1,
              }}
            >
              Line
            </span>
            {/* Line preview */}
            <div
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#1e1e2e",
                border: "2px solid #888",
                borderRadius: 3,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <line
                  x1="2"
                  y1="8"
                  x2="14"
                  y2="8"
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
          </div>

          {/* Stroke Style Dropdown - Fixed position */}
          {showStrokeStylePicker && strokeStyleButtonRect && (
            <div
              data-style-picker
              style={{
                position: "fixed",
                top: strokeStyleButtonRect.bottom + 4,
                left: strokeStyleButtonRect.left,
                padding: 10,
                backgroundColor: "#2a2a3a",
                border: "1px solid #555",
                borderRadius: 8,
                boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                zIndex: 999999,
                minWidth: 180,
              }}
            >
              {/* Stroke Style Options */}
              <div
                style={{
                  fontSize: 11,
                  color: "#999",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Kiểu nét:
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
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
                        padding: "6px 8px",
                        backgroundColor:
                          strokeStyle === style ? "#3a3a4a" : "transparent",
                        border:
                          strokeStyle === style
                            ? "2px solid #4ade80"
                            : "1px solid #555",
                        borderRadius: 6,
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
                      <span style={{ fontSize: 11, color: "#ccc" }}>
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
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: "1px solid #444",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#999",
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Độ dày: {strokeWidth}px
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
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
                      fontSize: 11,
                      backgroundColor: "#1e1e2e",
                      border: "1px solid #555",
                      borderRadius: 4,
                      color: "#ddd",
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
