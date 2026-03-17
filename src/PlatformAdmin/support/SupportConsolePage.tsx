"use client";
import React from "react";

/** Support Console — Hỗ trợ khách hàng, impersonation, tickets */
export default function SupportConsolePage(): React.ReactElement {
  const tickets = [
    { id: "T-1042", tenant: "Nhôm Việt JSC", subject: "Không xuất được BOM", priority: "high", status: "open", time: "15 phút trước" },
    { id: "T-1041", tenant: "Kính Hải Phòng", subject: "Lỗi tính giá cửa sổ", priority: "medium", status: "in-progress", time: "2 giờ trước" },
    { id: "T-1040", tenant: "Alu Đà Nẵng", subject: "Yêu cầu reset mật khẩu", priority: "low", status: "resolved", time: "1 ngày trước" },
    { id: "T-1039", tenant: "Kim loại Sài Gòn", subject: "Import CAD file lỗi", priority: "high", status: "in-progress", time: "1 ngày trước" },
  ];

  const priorityColor: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#94a3b8" };
  const statusColor: Record<string, string> = { open: "#3b82f6", "in-progress": "#f59e0b", resolved: "#10b981" };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Support Console</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
            Hỗ trợ khách hàng, xem tenant, impersonation
          </p>
        </div>
        <button
          style={{
            background: "#7f1d1d", color: "#fca5a5", border: "1px solid #991b1b",
            padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
          }}
        >
          🔑 Impersonate Tenant
        </button>
      </div>

      <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Ticket", "Tenant", "Vấn đề", "Priority", "Status", "Thời gian"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", color: "#60a5fa", fontFamily: "monospace" }}>{t.id}</td>
                <td style={{ padding: "10px 14px", color: "#f1f5f9" }}>{t.tenant}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{t.subject}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ color: priorityColor[t.priority], fontSize: 12 }}>● {t.priority}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ background: "#0f172a", color: statusColor[t.status], padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "#64748b" }}>{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
