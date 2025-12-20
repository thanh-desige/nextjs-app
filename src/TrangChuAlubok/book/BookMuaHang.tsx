"use client";
import React, { useState } from "react";
import { FiSearch, FiBell, FiUser } from "react-icons/fi";

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

export default function BookMuaHang(): React.ReactElement {
  const [activeSidebarItem, setActiveSidebarItem] =
    useState<string>("Tổng hợp");

  const sidebarItems: SidebarItem[] = [
    { id: "Tổng hợp", label: "Tổng hợp", icon: "📊" },
    { id: "Nhôm thanh", label: "Nhôm thanh", icon: "📦" },
    { id: "Phụ kiến nhôm", label: "Phụ kiến nhôm", icon: "🔧" },
    { id: "Kính", label: "Kính", icon: "🪟" },
    { id: "Phụ kiến kính", label: "Phụ kiến kính", icon: "⚙️" },
    { id: "Inox thanh", label: "Inox thanh", icon: "📌" },
    { id: "Inox tấm", label: "Inox tấm", icon: "📄" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* LEFT SIDEBAR */}
      <div
        style={{
          width: "200px",
          backgroundColor: "#6db895",
          padding: "20px 0",
          overflowY: "auto",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            backgroundColor: "#ff69b4",
            padding: "12px 15px",
            marginBottom: "10px",
            fontWeight: "600",
            color: "#ffffff",
            textAlign: "center",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Phân Mục
        </div>

        {sidebarItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveSidebarItem(item.id)}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              backgroundColor:
                activeSidebarItem === item.id
                  ? "rgba(255, 255, 255, 0.2)"
                  : "transparent",
              borderLeft:
                activeSidebarItem === item.id ? "3px solid #ff69b4" : "none",
              color: "#1a3a2e",
              fontSize: "14px",
              fontWeight: activeSidebarItem === item.id ? "600" : "400",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onMouseOver={(e) => {
              if (activeSidebarItem !== item.id) {
                (e.target as HTMLElement).parentElement!.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
              }
            }}
            onMouseOut={(e) => {
              if (activeSidebarItem !== item.id) {
                (e.target as HTMLElement).parentElement!.style.backgroundColor =
                  "transparent";
              }
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOP BAR */}
        <div
          style={{
            backgroundColor: "#6db895",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "30px",
            paddingRight: "30px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* SEARCH BAR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#5a8e7e",
              padding: "8px 15px",
              borderRadius: "8px",
              flex: 1,
              maxWidth: "400px",
            }}
          >
            <FiSearch size={18} color="#ffffff" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm"
              style={{
                border: "none",
                backgroundColor: "transparent",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                flex: 1,
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            />
          </div>

          {/* RIGHT ICONS */}
          <div style={{ display: "flex", gap: "20px", marginLeft: "30px" }}>
            <FiBell size={18} color="#1a3a2e" style={{ cursor: "pointer" }} />
            <FiUser size={18} color="#1a3a2e" style={{ cursor: "pointer" }} />
          </div>
        </div>

        {/* CONTENT AREA */}
        <div
          style={{
            flex: 1,
            padding: "30px",
            overflowY: "auto",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "30px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              minHeight: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "24px",
                  marginBottom: "10px",
                  color: "#666",
                }}
              >
                {activeSidebarItem}
              </h2>
              <p style={{ color: "#999" }}>Chọn một danh mục để xem sản phẩm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
