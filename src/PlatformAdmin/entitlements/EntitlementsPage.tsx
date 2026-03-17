"use client";
import React from "react";

/** Quản lý Entitlements & Feature Flags cho toàn platform */
export default function EntitlementsPage(): React.ReactElement {
  const flags = [
    { name: "cad_3d_preview", status: true, scope: "enterprise", desc: "3D preview trong CAD" },
    { name: "ai_bom_suggest", status: false, scope: "all", desc: "AI gợi ý BOM tự động" },
    { name: "multi_branch", status: true, scope: "business+", desc: "Hỗ trợ đa chi nhánh" },
    { name: "approval_workflow", status: true, scope: "starter+", desc: "Quy trình duyệt" },
    { name: "custom_report", status: false, scope: "enterprise", desc: "Báo cáo tự tạo" },
    { name: "api_webhook", status: true, scope: "business+", desc: "Webhook API tích hợp" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>
          Entitlements & Feature Flags
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Quản lý tính năng theo gói subscription + feature flags bật/tắt
        </p>
      </div>

      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          border: "1px solid #334155",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Flag Name", "Status", "Scope", "Mô tả"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.name} style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", color: "#f1f5f9", fontFamily: "monospace" }}>{f.name}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ background: f.status ? "#166534" : "#7f1d1d", color: f.status ? "#4ade80" : "#fca5a5", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                    {f.status ? "ON" : "OFF"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{f.scope}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{f.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
