"use client";
import React from "react";

/** Notifications — Platform notification templates, channels, logs */
export default function NotificationsPage(): React.ReactElement {
  const templates = [
    { name: "Chào mừng tenant mới", channel: "Email", trigger: "tenant.created", active: true },
    { name: "Subscription sắp hết hạn", channel: "Email + In-app", trigger: "subscription.expiring", active: true },
    { name: "Thanh toán thành công", channel: "Email", trigger: "payment.success", active: true },
    { name: "Thanh toán thất bại", channel: "Email + SMS", trigger: "payment.failed", active: true },
    { name: "Backup thất bại", channel: "Slack + Email", trigger: "backup.failed", active: true },
    { name: "Bảo trì hệ thống", channel: "All channels", trigger: "maintenance.scheduled", active: false },
    { name: "Feature mới", channel: "In-app", trigger: "release.published", active: true },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Notifications</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
            Templates thông báo, channels, lịch sử gửi
          </p>
        </div>
        <button
          style={{
            background: "#1e3a5f", color: "#60a5fa", border: "1px solid #1e40af",
            padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
          }}
        >
          + Tạo Template
        </button>
      </div>

      <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Template", "Channel", "Trigger", "Active"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.name} style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", color: "#f1f5f9" }}>{t.name}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{t.channel}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "monospace" }}>{t.trigger}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    background: t.active ? "#14532d" : "#1e293b",
                    color: t.active ? "#4ade80" : "#64748b",
                    padding: "2px 8px", borderRadius: 4, fontSize: 11,
                  }}>
                    {t.active ? "Active" : "Paused"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
