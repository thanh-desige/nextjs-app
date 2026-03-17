"use client";
import React from "react";

/** Storage & Data Governance — Quản lý dung lượng, data policies */
export default function StoragePage(): React.ReactElement {
  const tenants = [
    { name: "Nhôm Việt JSC", storage: 2.4, limit: 5, files: 1203, plan: "Business" },
    { name: "Kính Hải Phòng", storage: 0.8, limit: 2, files: 342, plan: "Starter" },
    { name: "Alu Đà Nẵng", storage: 4.1, limit: 10, files: 3201, plan: "Enterprise" },
    { name: "Kim loại Sài Gòn", storage: 1.6, limit: 5, files: 876, plan: "Business" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Storage & Data Governance</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Dung lượng lưu trữ, data retention, compliance policies
        </p>
      </div>

      {/* Platform totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Storage", value: "8.9 GB / 22 GB" },
          { label: "Total Files", value: "5,622" },
          { label: "Data Retention", value: "365 ngày" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Tenant", "Plan", "Files", "Storage", "Usage"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const pct = Math.round((t.storage / t.limit) * 100);
              const barColor = pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#10b981";
              return (
                <tr key={t.name} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "10px 14px", color: "#f1f5f9" }}>{t.name}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{t.plan}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{t.files.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{t.storage} / {t.limit} GB</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ background: "#0f172a", borderRadius: 4, height: 6, width: 80 }}>
                        <div style={{ background: barColor, borderRadius: 4, height: 6, width: `${pct}%` }} />
                      </div>
                      <span style={{ color: barColor, fontSize: 11 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
