"use client";
import React from "react";
import StylePanel from "./StylePanel";
import ToolGroupPanel from "./ToolGroupPanel";

interface Tool {
  id: string;
  label: string;
}

interface ToolGroup {
  name: string;
  color: string;
  tools: Tool[];
}

interface Header2Props {
  toolGroups: ToolGroup[];
  drawingMode: string;
  flashingTool?: string | null;
  osnapModes: Record<string, boolean>;
  onSelectTool: (id: string) => void;
  onToggleOsnap: (id: string) => void;
  isCollapsed?: boolean;
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
  /** Whether editing selected entity (show indicator) */
  isEditingSelection?: boolean;
  /** Number of selected entities */
  selectedCount?: number;
}

export default function Header2({
  toolGroups,
  drawingMode,
  flashingTool,
  osnapModes,
  onSelectTool,
  onToggleOsnap,
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
  isEditingSelection = false,
  selectedCount = 0,
}: Header2Props) {
  // Animation styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: "#1a1a2e",
    borderBottom: "1px solid #333",
    overflow: "visible",
    position: "relative",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    maxHeight: isCollapsed ? "0px" : "150px",
    opacity: isCollapsed ? 0 : 1,
    pointerEvents: isCollapsed ? "none" : "auto",
    visibility: isCollapsed ? "hidden" : "visible",
  };

  // Collapse button - always visible at bottom center
  const collapseButton = onToggle && (
    <div
      style={{
        position: "absolute",
        bottom: isCollapsed ? "-28px" : "-10px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 25,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: 60,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          background: "#1a1a2e",
          border: "1px solid #444",
          borderRadius: "4px",
          cursor: "pointer",
          color: "#888",
          fontSize: 11,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2a2a3e";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#1a1a2e";
          e.currentTarget.style.color = "#888";
        }}
        title={isCollapsed ? "Expand Toolbar" : "Collapse Toolbar"}
      >
        {isCollapsed ? "▼ Toolbar" : "▲"}
      </button>
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      {/* Main toolbar content with animation */}
      <div style={containerStyle}>
        <div
          style={{
            height: "150px",
            padding: "0px 2px",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "2px",
            alignItems: "start",
            overflowY: "auto",
          }}
        >
          {toolGroups.map((group) => {
            // Special rendering for View group - show Stroke/Fill color pickers
            if (group.name === "View") {
              return (
                <StylePanel
                  key={group.name}
                  strokeColor={strokeColor}
                  fillColor={fillColor}
                  onStrokeColorChange={onStrokeColorChange}
                  onFillColorChange={onFillColorChange}
                  opacity={opacity}
                  onOpacityChange={onOpacityChange}
                  strokeStyle={strokeStyle}
                  onStrokeStyleChange={onStrokeStyleChange}
                  strokeWidth={strokeWidth}
                  onStrokeWidthChange={onStrokeWidthChange}
                  isEditingSelection={isEditingSelection}
                  selectedCount={selectedCount}
                />
              );
            }

            // Normal rendering for other groups
            return (
              <ToolGroupPanel
                key={group.name}
                group={group}
                drawingMode={drawingMode}
                flashingTool={flashingTool}
                osnapModes={osnapModes}
                onSelectTool={onSelectTool}
                onToggleOsnap={onToggleOsnap}
              />
            );
          })}
        </div>
      </div>

      {/* Collapse button at bottom center */}
      {collapseButton}
    </div>
  );
}
