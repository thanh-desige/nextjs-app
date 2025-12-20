"use client";
import React, { useState, useEffect } from "react";

interface PropertyItem {
  key: string;
  label: string;
  value: string | number;
  type: "text" | "number" | "color" | "select";
  options?: string[];
  editable?: boolean;
}

interface SidebarRightProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  selectedObject?: {
    id: string;
    type: string;
    properties: PropertyItem[];
  } | null;
  onPropertyChange?: (key: string, value: string | number) => void;
}

export default function SidebarRight({
  isCollapsed: externalIsCollapsed,
  onToggle,
  selectedObject = null,
  onPropertyChange,
}: SidebarRightProps): React.ReactElement {
  const [width, setWidth] = useState(250);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"properties" | "layers" | "bom">(
    "properties"
  );
  const [isMobile, setIsMobile] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Responsive hook
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setInternalCollapsed(true);
        setWidth(Math.min(200, window.innerWidth * 0.6));
      } else {
        setWidth(250);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isCollapsed =
    externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;
  const handleToggle =
    onToggle || (() => setInternalCollapsed(!internalCollapsed));

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const maxWidth = isMobile ? 250 : 400;
      const minWidth = isMobile ? 120 : 150;
      const newWidth = Math.min(
        Math.max(window.innerWidth - e.clientX, minWidth),
        maxWidth
      );
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isMobile]);

  if (isCollapsed) {
    return (
      <div
        style={{
          width: 32,
          backgroundColor: "#1e1e2e",
          borderLeft: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 8,
        }}
      >
        <button
          onClick={handleToggle}
          style={{
            width: 24,
            height: 24,
            background: "transparent",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: 14,
          }}
          title="Expand Properties"
        >
          ◀
        </button>
      </div>
    );
  }

  const minWidthValue = isMobile ? 120 : 150;
  const maxWidthValue = isMobile ? 250 : 400;

  return (
    <div
      style={{
        width,
        minWidth: minWidthValue,
        maxWidth: maxWidthValue,
        backgroundColor: "#1e1e2e",
        borderLeft: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: "ew-resize",
          background: isDragging ? "#4a90d9" : "transparent",
        }}
      />

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #333",
        }}
      >
        {(["properties", "layers", "bom"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "8px 4px",
              background: activeTab === tab ? "#252535" : "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #4a90d9" : "none",
              color: activeTab === tab ? "#fff" : "#888",
              fontSize: 10,
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {tab === "properties" && "📋"}
            {tab === "layers" && "📚"}
            {tab === "bom" && "📊"}
            <span
              style={{ marginLeft: 4, display: isMobile ? "none" : "inline" }}
            >
              {tab}
            </span>
          </button>
        ))}
        <button
          onClick={handleToggle}
          style={{
            width: 28,
            background: "transparent",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: 10,
          }}
          title="Collapse"
        >
          ▶
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {activeTab === "properties" && (
          <div>
            {selectedObject ? (
              <>
                <div
                  style={{
                    padding: "8px",
                    background: "#252535",
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 10, color: "#888" }}>Type: </span>
                  <span style={{ fontSize: 11, color: "#4a90d9" }}>
                    {selectedObject.type}
                  </span>
                </div>
                {selectedObject.properties.map((prop) => (
                  <div
                    key={prop.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 8,
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: "#888",
                        width: 60,
                        flexShrink: 0,
                      }}
                    >
                      {prop.label}:
                    </span>
                    {prop.type === "color" ? (
                      <input
                        type="color"
                        value={String(prop.value)}
                        onChange={(e) =>
                          onPropertyChange?.(prop.key, e.target.value)
                        }
                        disabled={!prop.editable}
                        style={{ width: 32, height: 20, border: "none" }}
                      />
                    ) : prop.type === "select" ? (
                      <select
                        value={String(prop.value)}
                        onChange={(e) =>
                          onPropertyChange?.(prop.key, e.target.value)
                        }
                        disabled={!prop.editable}
                        style={{
                          flex: 1,
                          padding: "3px 6px",
                          background: "#252535",
                          border: "1px solid #444",
                          borderRadius: 3,
                          color: "#ddd",
                          fontSize: 10,
                        }}
                      >
                        {prop.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={prop.type}
                        value={prop.value}
                        onChange={(e) =>
                          onPropertyChange?.(
                            prop.key,
                            prop.type === "number"
                              ? parseFloat(e.target.value)
                              : e.target.value
                          )
                        }
                        disabled={!prop.editable}
                        style={{
                          flex: 1,
                          padding: "3px 6px",
                          background: "#252535",
                          border: "1px solid #444",
                          borderRadius: 3,
                          color: "#ddd",
                          fontSize: 10,
                        }}
                      />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#666", fontSize: 11 }}>
                <p>No object selected</p>
                <p style={{ fontSize: 10 }}>
                  Click on an object to view properties
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "layers" && (
          <div style={{ color: "#888", fontSize: 11 }}>
            <p>Layers panel - Coming soon</p>
          </div>
        )}

        {activeTab === "bom" && (
          <div style={{ color: "#888", fontSize: 11 }}>
            <p>BOM panel - Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
