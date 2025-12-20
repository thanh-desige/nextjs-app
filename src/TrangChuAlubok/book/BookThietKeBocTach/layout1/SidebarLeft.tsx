"use client";
import React, { useState, useRef } from "react";
import { COLORS } from "../constants/colors";

interface SidebarLeftProps {
  onToggle?: () => void;
}

export default function SidebarLeft({ onToggle }: SidebarLeftProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "doors"
  );
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [textFontSize, setTextFontSize] = useState(12);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      if (sidebarRef.current) {
        const newWidth =
          e.clientX - sidebarRef.current.getBoundingClientRect().left;
        if (newWidth >= 48 && newWidth <= 250) {
          setWidth(newWidth);
          // Tính toán font size dựa trên width: 48px = 10px, 250px = 12px
          const calculatedFontSize = Math.max(
            10,
            Math.min(12, ((newWidth - 48) / (250 - 48)) * 2 + 10)
          );
          setTextFontSize(calculatedFontSize);
          // Dispatch custom event khi width thay đổi
          window.dispatchEvent(new CustomEvent("sidebarResize"));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const categories = [
    {
      id: "doors",
      name: "🚪 Cửa đi",
      items: ["Cửa đơn", "Cửa đôi", "Cửa trượt", "Cửa trợt"],
    },
    {
      id: "windows",
      name: "◻️ Cửa sổ",
      items: ["Cửa sổ cố định", "Cửa sổ trượt", "Cửa sổ mở"],
    },
    {
      id: "walls",
      name: "█ Vách",
      items: ["Vách bê tông", "Vách kính", "Vách gạch"],
    },
    {
      id: "accessories",
      name: "🔧 Phụ kiện",
      items: ["Tay nắm", "Bản lề", "Khóa"],
    },
  ];

  return (
    <div
      ref={sidebarRef}
      style={{
        width: `${width}px`,
        height: "100%",
        backgroundColor: "#252526",
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        transition: isResizing ? "none" : "width 0.3s ease",
        userSelect: "none",
      }}
    >
      {/* Resize Handle - kéo co dãn */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "6px",
          height: "100%",
          cursor: "col-resize",
          backgroundColor: isResizing ? "rgba(255, 0, 0, 0.3)" : "transparent",
          transition: "background-color 0.2s",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          if (!isResizing)
            e.currentTarget.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          if (!isResizing)
            e.currentTarget.style.backgroundColor = "transparent";
        }}
      />

      {/* Collapse Button - positioned at middle right edge, protruding outside */}
      <div
        onClick={() => {
          setCollapsed(!collapsed);
          // Nếu đang collapsed, set width về 250, nếu đang expanded thì set về 48
          if (!collapsed) {
            setWidth(48);
          } else {
            setWidth(250);
          }
        }}
        style={{
          width: "0px",
          height: "0px",
          backgroundColor: "#1e1e2e",
          borderRadius: "50%",
          position: "absolute",
          top: "50%",
          right: "-12px",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: `1px solid #444`,
          transition: "all 0.2s ease",
          zIndex: 999,
          boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2a2a3e";
          e.currentTarget.style.borderColor = "#666";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#1e1e2e";
          e.currentTarget.style.borderColor = "#444";
        }}
      >
        <span style={{ color: "#888", fontSize: "10px" }}>
          {collapsed ? "▶" : "◀"}
        </span>
      </div>

      {/* Header */}
      {!collapsed && (
        <div
          style={{
            padding: "12px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#BA00AE",
            fontWeight: 500,
            fontSize: "20px",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            📋 Thư viện
          </span>
          <button
            onClick={onToggle}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "0px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Categories */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {categories.map((category) => (
            <div key={category.id}>
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#ffffff",
                  textAlign: "left",
                  cursor: "pointer",
                  borderBottom: `1px solid rgba(0,0,0,0.1)`,
                  fontSize: "16px",
                  fontWeight: 500,
                  transition: "background-color 0.2s",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.backgroundColor =
                    "rgba(0,0,0,0.1)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.backgroundColor =
                    "transparent")
                }
              >
                {expandedCategory === category.id ? "▼" : "▶"} {category.name}
              </button>

              {expandedCategory === category.id && (
                <div style={{ backgroundColor: "rgba(0,0,0,0.1)" }}>
                  {category.items.map((item, idx) => (
                    <div
                      key={idx}
                      draggable
                      style={{
                        padding: "10px 24px",
                        color: "#000000",
                        fontSize: "14px",
                        cursor: "grab",
                        borderBottom: `1px solid rgba(0,0,0,0.05)`,
                        transition: "background-color 0.2s",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.backgroundColor =
                          "rgba(0,0,0,0.2)")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.backgroundColor =
                          "transparent")
                      }
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Header - Collapsed */}
      {collapsed && (
        <div
          style={{
            padding: "12px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "20px",
            minHeight: "45px",
            flexShrink: 0,
          }}
        >
          📋
        </div>
      )}

      {/* Collapsed View - Show Icons Only */}
      {collapsed && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            paddingTop: "12px",
            paddingLeft: "12px",
            gap: "12px",
            overflowY: "auto",
          }}
        >
          {categories.map((category) => (
            <div key={category.id}>
              <div
                onClick={() => {
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  );
                }}
                style={{
                  cursor: "pointer",
                  opacity: expandedCategory === category.id ? 1 : 0.6,
                  transition: "opacity 0.2s",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity =
                    expandedCategory === category.id ? "1" : "0.6";
                }}
                title={category.name}
              >
                <span
                  style={{
                    fontSize: "18px",
                    flexShrink: 0,
                    transition: "transform 0.2s",
                    transform:
                      expandedCategory === category.id
                        ? "rotate(90deg)"
                        : "rotate(0deg)",
                  }}
                >
                  ▶
                </span>
                <span
                  style={{
                    fontSize: `${textFontSize}px`,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: `${width - 60}px`,
                    transition: "max-width 0.3s ease",
                  }}
                >
                  {category.name}
                </span>
              </div>

              {expandedCategory === category.id && (
                <div
                  style={{
                    backgroundColor: "rgba(0,0,0,0.1)",
                    marginLeft: "12px",
                  }}
                >
                  {category.items.map((item, idx) => (
                    <div
                      key={idx}
                      draggable
                      style={{
                        padding: "8px 12px",
                        color: "#ffffff",
                        fontSize: "11px",
                        cursor: "grab",
                        borderBottom: `1px solid rgba(0,0,0,0.05)`,
                        transition: "background-color 0.2s",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.backgroundColor =
                          "rgba(0,0,0,0.2)")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.backgroundColor =
                          "transparent")
                      }
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
