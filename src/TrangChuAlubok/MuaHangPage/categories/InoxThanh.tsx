"use client";
import React, { useState } from "react";

const BRANDS: string[] = ["Xingfa", "PMA", "Maxpro", "PMI", "HOPO"];

export default function InoxThanh(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>("Xingfa");

  return (
    <>
      {/* HEADER WITH TABS - OUTSIDE CONTENT */}
      <div
        style={{
          backgroundColor: "#4C3555",
          padding: "0px 20px",
          height: "36px",
          marginBottom: "0px",
          borderRadius: "0px",
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          alignItems: "center",
          flexShrink: 0,
          marginTop: "-1px",
          width: "100%",
        }}
      >
        {BRANDS.map((brand) => (
          <button
            key={brand}
            onClick={() => setActiveTab(brand)}
            style={{
              padding: "4px 12px",
              backgroundColor: activeTab === brand ? "#d946a6" : "transparent",
              color: activeTab === brand ? "#ffffff" : "#999",
              border: "1px solid " + (activeTab === brand ? "#d946a6" : "#555"),
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
              height: "28px",
              display: "flex",
              alignItems: "center",
            }}
            onMouseOver={(e) => {
              if (activeTab !== brand) {
                e.currentTarget.style.borderColor = "#d946a6";
                e.currentTarget.style.color = "#d946a6";
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== brand) {
                e.currentTarget.style.borderColor = "#555";
                e.currentTarget.style.color = "#999";
              }
            }}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* CONTENT - BELOW TABS */}
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "clamp(18px, 6vw, 24px)",
            marginBottom: "10px",
            color: "#666",
          }}
        >
          Inox thanh - {activeTab}
        </h2>
        <p style={{ color: "#999", fontSize: "clamp(12px, 3vw, 14px)" }}>
          Danh sách sản phẩm inox thanh {activeTab}
        </p>
      </div>
    </>
  );
}
