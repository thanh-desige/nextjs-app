"use client";
import React from "react";

/** Backup & Restore — Platform-level backup, disaster recovery */
export default function BackupRestorePage(): React.ReactElement {
  const backups = [
    { id: "BK-2025-0115-0300", type: "Full", size: "4.2 GB", status: "success", time: "15/01/2025 03:00", duration: "12m 34s" },
    { id: "BK-2025-0114-0300", type: "Full", size: "4.1 GB", status: "success", time: "14/01/2025 03:00", duration: "11m 58s" },
    { id: "BK-2025-0114-1200", type: "Incremental", size: "320 MB", status: "success", time: "14/01/2025 12:00", duration: "2m 15s" },
    { id: "BK-2025-0113-0300", type: "Full", size: "4.0 GB", status: "failed", time: "13/01/2025 03:00", duration: "—" },
  ];

  const statusStyle: Record<string, { bg: string; fg: string }> = {
    success: { bg: "#14532d", fg: "#4ade80" },
    failed: { bg: "#7f1d1d", fg: "#fca5a5" },
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Backup & Restore</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
            Sao lưu platform, khôi phục dữ liệu, disaster recovery
          </p>
        </div>
        <button
          style={{
            background: "#1e3a5f", color: "#60a5fa", border: "1px solid #1e40af",
            padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
          }}
        >
          + Tạo Backup Ngay
        </button>
      </div>

      {/* Schedule info */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Full Backup", value: "Hàng ngày 03:00" },
          { label: "Incremental", value: "Mỗi 12 giờ" },
          { label: "Retention", value: "30 ngày" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Backup ID", "Type", "Size", "Status", "Time", "Duration"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => {
              const st = statusStyle[b.status];
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "10px 14px", color: "#60a5fa", fontFamily: "monospace" }}>{b.id}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{b.type}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{b.size}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: st.bg, color: st.fg, padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{b.status}</span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{b.time}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{b.duration}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
