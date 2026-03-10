"use client";
import React from "react";

interface Tool {
  id: string;
  label: string;
}

interface ToolGroup {
  name: string;
  color: string;
  tools: Tool[];
}

export interface ToolGroupPanelProps {
  group: ToolGroup;
  drawingMode: string;
  flashingTool?: string | null;
  osnapModes: Record<string, boolean>;
  onSelectTool: (id: string) => void;
  onToggleOsnap: (id: string) => void;
}

export default function ToolGroupPanel({
  group,
  drawingMode,
  flashingTool,
  osnapModes,
  onSelectTool,
  onToggleOsnap,
}: ToolGroupPanelProps) {
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
        {group.name}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1px",
          maxHeight: "120px",
          overflowY:
            group.name === "Draw" || group.name === "Osnap"
              ? "hidden"
              : "auto",
          overflowX: "hidden",
        }}
      >
        {group.tools.map((tool) => {
          const isOsnap = group.name === "Osnap";
          const isChecked = isOsnap ? osnapModes[tool.id] : false;
          const isSelect = tool.id === "select";
          const isFlashing = flashingTool === tool.id;
          const isActive = isOsnap
            ? isChecked
            : drawingMode === tool.id || isFlashing;
          return (
            <button
              key={tool.id}
              onClick={() =>
                isOsnap ? onToggleOsnap(tool.id) : onSelectTool(tool.id)
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#5C8259";
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0,0,0,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#515D50";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.98)";
                e.currentTarget.style.boxShadow =
                  "inset 0 2px 4px rgba(0,0,0,0.2)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 2px 4px rgba(0,0,0,0.2)";
              }}
              style={{
                padding: "3px 8px",
                height: "22px",
                backgroundColor: isActive ? "#328F4B" : "#515D50",
                color: isActive ? "#a8d08d" : "#e0e0e0",
                border: isActive
                  ? "1px solid #2a322a"
                  : "1px solid #6a7a68",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: isSelect ? 700 : 500,
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: isSelect ? "center" : "space-between",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                gridColumn: isSelect ? "span 2" : "span 1",
                boxSizing: "border-box",
                boxShadow: isActive
                  ? "inset 0 2px 4px rgba(0,0,0,0.3)"
                  : "none",
              }}
              title={tool.label}
            >
              {/* Parse label to separate name and shortcut */}
              {(() => {
                const match = tool.label.match(/^(.+?)\s*\(([^)]+)\)$/);
                if (match) {
                  return (
                    <>
                      <span style={{ flex: 1, textAlign: "left" }}>
                        {match[1]}
                      </span>
                      <span
                        style={{
                          color: "#666",
                          fontSize: "10px",
                          fontWeight: 600,
                        }}
                      >
                        {match[2]}
                      </span>
                    </>
                  );
                }
                return <span>{tool.label}</span>;
              })()}
              {isOsnap && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "18px",
                    height: "18px",
                    border: "2px solid #000000",
                    borderRadius: "2px",
                    marginLeft: "4px",
                    backgroundColor: isChecked ? "#BA00AE" : "#ffffff",
                    fontWeight: "bold",
                    color: "#ffffff",
                    fontSize: "14px",
                  }}
                >
                  {isChecked ? "✓" : ""}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
