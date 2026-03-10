"use client";
import React, { useState, useRef } from "react";
import { useCanvasStore } from "../../../store/canvasStore";
import LayerPanelConnected from "../panels/LayerPanelConnected";
import { COLORS } from "../../../constants/colors";

interface SidebarRightProps {
  onToggle?: () => void;
}

type TabType = "properties" | "bom" | "layers";

export default function SidebarRight({ onToggle }: SidebarRightProps) {
  const [width, setWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("properties");
  const sidebarRef = useRef<HTMLDivElement>(null);

  const selectedObject = useCanvasStore((state) => state.selectedObject);
  const objects = useCanvasStore((state) => state.objects);
  const updateObject = useCanvasStore((state) => state.updateObject);

  const selectedObj = objects.find((obj) => obj.id === selectedObject);

  // Mock BOM data
  const bomItems = [
    {
      id: "1",
      name: "Nhôm thanh 40x40",
      quantity: 12,
      unit: "m",
      unitPrice: 150000,
    },
    { id: "2", name: "Kính 8mm", quantity: 4.5, unit: "m²", unitPrice: 450000 },
    { id: "3", name: "Bản lề 3D", quantity: 6, unit: "cái", unitPrice: 85000 },
    {
      id: "4",
      name: "Tay nắm inox",
      quantity: 2,
      unit: "cái",
      unitPrice: 120000,
    },
    {
      id: "5",
      name: "Gioăng cao su",
      quantity: 8,
      unit: "m",
      unitPrice: 25000,
    },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      if (sidebarRef.current) {
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        const newWidth = sidebarRect.right - e.clientX;
        if (newWidth >= 150 && newWidth <= 450) {
          setWidth(newWidth);
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

  return (
    <div
      ref={sidebarRef}
      style={{
        width: `${width}px`,
        height: "100%",
        backgroundColor: "#252526",
        borderLeft: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        transition: isResizing ? "none" : "width 0.3s ease",
      }}
    >
      {/* Resize Handle - kéo co dãn */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: 0,
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
      {/* Header */}
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
        }}
      >
        <span>🔧 Panel</span>
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "0px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {[
          { id: "properties" as TabType, label: "📋 Properties" },
          { id: "bom" as TabType, label: "📦 BOM" },
          { id: "layers" as TabType, label: "📑 Layers" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "8px 4px",
              backgroundColor:
                activeTab === tab.id ? "rgba(186, 0, 174, 0.2)" : "transparent",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #BA00AE"
                  : "2px solid transparent",
              color: activeTab === tab.id ? "#BA00AE" : "#999",
              fontSize: "11px",
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {/* Properties Tab */}
        {activeTab === "properties" && (
          <>
            {selectedObj ? (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Tên:
                  </label>
                  <input
                    type="text"
                    value={selectedObj.name}
                    onChange={(e) =>
                      updateObject(selectedObj.id, { name: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "3px",
                      border: "none",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Tọa độ X:
                  </label>
                  <input
                    type="number"
                    value={selectedObj.x}
                    onChange={(e) =>
                      updateObject(selectedObj.id, {
                        x: parseInt(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "3px",
                      border: "none",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Tọa độ Y:
                  </label>
                  <input
                    type="number"
                    value={selectedObj.y}
                    onChange={(e) =>
                      updateObject(selectedObj.id, {
                        y: parseInt(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "3px",
                      border: "none",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Chiều rộng (mm):
                  </label>
                  <input
                    type="number"
                    value={selectedObj.width}
                    onChange={(e) =>
                      updateObject(selectedObj.id, {
                        width: parseInt(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "3px",
                      border: "none",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Chiều cao (mm):
                  </label>
                  <input
                    type="number"
                    value={selectedObj.height}
                    onChange={(e) =>
                      updateObject(selectedObj.id, {
                        height: parseInt(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "3px",
                      border: "none",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Màu nền:
                  </label>
                  <input
                    type="color"
                    value={selectedObj.fillColor}
                    onChange={(e) =>
                      updateObject(selectedObj.id, {
                        fillColor: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "3px",
                      border: "none",
                      marginTop: "4px",
                      cursor: "pointer",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Khóa:
                  </label>
                  <input
                    type="checkbox"
                    checked={selectedObj.locked}
                    onChange={(e) =>
                      updateObject(selectedObj.id, { locked: e.target.checked })
                    }
                    style={{ marginTop: "4px", cursor: "pointer" }}
                  />
                </div>
              </div>
            ) : (
              <div
                style={{
                  color: "#999999",
                  fontSize: "12px",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                Chọn đối tượng để xem thuộc tính
              </div>
            )}
          </>
        )}

        {/* BOM Tab */}
        {activeTab === "bom" && (
          <div>
            <div
              style={{
                marginBottom: "12px",
                color: "#BA00AE",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              📦 Bảng vật tư (BOM)
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "rgba(186, 0, 174, 0.1)" }}>
                  <th
                    style={{
                      padding: "6px",
                      textAlign: "left",
                      color: "#fff",
                      borderBottom: "1px solid #444",
                    }}
                  >
                    Tên
                  </th>
                  <th
                    style={{
                      padding: "6px",
                      textAlign: "right",
                      color: "#fff",
                      borderBottom: "1px solid #444",
                    }}
                  >
                    SL
                  </th>
                  <th
                    style={{
                      padding: "6px",
                      textAlign: "left",
                      color: "#fff",
                      borderBottom: "1px solid #444",
                    }}
                  >
                    ĐVT
                  </th>
                  <th
                    style={{
                      padding: "6px",
                      textAlign: "right",
                      color: "#fff",
                      borderBottom: "1px solid #444",
                    }}
                  >
                    Đơn giá
                  </th>
                </tr>
              </thead>
              <tbody>
                {bomItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #333" }}>
                    <td style={{ padding: "6px", color: "#ddd" }}>
                      {item.name}
                    </td>
                    <td
                      style={{
                        padding: "6px",
                        textAlign: "right",
                        color: "#ddd",
                      }}
                    >
                      {item.quantity}
                    </td>
                    <td style={{ padding: "6px", color: "#888" }}>
                      {item.unit}
                    </td>
                    <td
                      style={{
                        padding: "6px",
                        textAlign: "right",
                        color: "#4CAF50",
                      }}
                    >
                      {item.unitPrice.toLocaleString()}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{
                marginTop: "12px",
                padding: "8px",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#fff",
                  fontSize: "12px",
                }}
              >
                <span>Tổng cộng:</span>
                <span style={{ color: "#4CAF50", fontWeight: 600 }}>
                  {bomItems
                    .reduce(
                      (sum, item) => sum + item.quantity * item.unitPrice,
                      0
                    )
                    .toLocaleString()}
                  đ
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Layers Tab */}
        {activeTab === "layers" && <LayerPanelConnected />}
      </div>
    </div>
  );
}
