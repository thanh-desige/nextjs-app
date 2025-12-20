"use client";
import React from "react";

export default function TongHop(): React.ReactElement {
  return (
    <div style={{ textAlign: "center" }}>
      <h2
        style={{
          fontSize: "clamp(18px, 6vw, 24px)",
          marginBottom: "10px",
          color: "#666",
        }}
      >
        Tổng hợp
      </h2>
      <p style={{ color: "#999", fontSize: "clamp(12px, 3vw, 14px)" }}>
        Chọn một danh mục để xem sản phẩm
      </p>
    </div>
  );
}
