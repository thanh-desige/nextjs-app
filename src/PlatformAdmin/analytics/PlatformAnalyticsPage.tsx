"use client";
import React from "react";

/** Platform Analytics — Thống kê toàn platform: MAU, revenue, churn... */
export default function PlatformAnalyticsPage(): React.ReactElement {
  const metrics = [
    { label: "Monthly Active Users", value: "1,247", change: "+12%", positive: true },
    { label: "Total Tenants", value: "86", change: "+4", positive: true },
    { label: "MRR (Monthly Recurring Revenue)", value: "₫284.5M", change: "+8.3%", positive: true },
    { label: "Churn Rate", value: "2.1%", change: "-0.3%", positive: true },
    { label: "Avg Session Duration", value: "24m", change: "+2m", positive: true },
    { label: "Support Tickets (MTD)", value: "42", change: "+15%", positive: false },
  ];

  const topModules = [
    { name: "Thiết kế Bóc tách (CAD)", usage: 89 },
    { name: "Bán hàng", usage: 76 },
    { name: "Tồn kho", usage: 68 },
    { name: "Mua hàng", usage: 54 },
    { name: "Thu chi", usage: 41 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Platform Analytics</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Thống kê tổng quan platform — MAU, revenue, module usage, churn
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", padding: 16 }}>
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>{m.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ color: "#f1f5f9", fontSize: 24, fontWeight: 700 }}>{m.value}</span>
              <span style={{ color: m.positive ? "#4ade80" : "#f87171", fontSize: 12 }}>
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Module usage */}
      <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", padding: 18 }}>
        <h3 style={{ color: "#f1f5f9", fontSize: 15, margin: "0 0 14px" }}>Module Usage (% tenants active)</h3>
        {topModules.map((mod) => (
          <div key={mod.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ color: "#94a3b8", fontSize: 13, width: 200, flexShrink: 0 }}>{mod.name}</span>
            <div style={{ flex: 1, background: "#0f172a", borderRadius: 4, height: 8 }}>
              <div style={{ background: "#3b82f6", borderRadius: 4, height: 8, width: `${mod.usage}%` }} />
            </div>
            <span style={{ color: "#60a5fa", fontSize: 12, width: 36, textAlign: "right" }}>{mod.usage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
