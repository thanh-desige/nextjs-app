"use client";
import React from "react";

/** Platform-level config: feature flags, rate limits, maintenance mode */
export default function PlatformConfigPage(): React.ReactElement {
  const configs = [
    { label: "Maintenance Mode", value: "OFF", type: "toggle" },
    { label: "Max Users per Tenant (Free)", value: "5", type: "number" },
    { label: "Max Users per Tenant (Starter)", value: "20", type: "number" },
    { label: "Max Users per Tenant (Business)", value: "100", type: "number" },
    { label: "Max Users per Tenant (Enterprise)", value: "Unlimited", type: "text" },
    { label: "Rate Limit (req/min)", value: "300", type: "number" },
    { label: "File Upload Max Size (MB)", value: "50", type: "number" },
    { label: "Session Timeout (min)", value: "60", type: "number" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>
          Platform Config
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Cấu hình toàn nền tảng, feature flags
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
        {configs.map((c, i) => (
          <div
            key={c.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderBottom:
                i < configs.length - 1 ? "1px solid #334155" : "none",
            }}
          >
            <span style={{ color: "#e2e8f0", fontSize: 13 }}>{c.label}</span>
            <span
              style={{
                color: c.value === "OFF" ? "#ef4444" : "#94a3b8",
                fontSize: 13,
                fontFamily: "monospace",
              }}
            >
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
