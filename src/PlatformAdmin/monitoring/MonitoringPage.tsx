"use client";
import React from "react";

/** System health, API metrics, active users, storage monitoring */
export default function MonitoringPage(): React.ReactElement {
  const metrics = [
    { label: "Active Users (24h)", value: "147", color: "#22c55e" },
    { label: "API Requests (24h)", value: "12,840", color: "#3b82f6" },
    { label: "Error Rate", value: "0.12%", color: "#22c55e" },
    { label: "Avg Latency", value: "142ms", color: "#eab308" },
    { label: "Storage Used", value: "2.4 GB", color: "#94a3b8" },
    { label: "Total Tenants", value: "27", color: "#a855f7" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>
          Monitoring
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Giám sát hệ thống nền tảng
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "#1e293b",
              borderRadius: 8,
              border: "1px solid #334155",
              padding: 20,
            }}
          >
            <div
              style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}
            >
              {m.label}
            </div>
            <div
              style={{ fontSize: 28, color: m.color, fontWeight: 700 }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          border: "1px solid #334155",
          padding: 40,
          textAlign: "center",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        Biểu đồ API latency, error rate, active users sẽ hiển thị ở đây
      </div>
    </div>
  );
}
