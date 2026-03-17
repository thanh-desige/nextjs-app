"use client";
import React from "react";

/** Integrations — SSO, Email, Payment, Webhook, API keys */
export default function IntegrationsPage(): React.ReactElement {
  const integrations = [
    { name: "Google SSO", category: "Auth", status: "active", icon: "🔐" },
    { name: "Microsoft Entra ID", category: "Auth", status: "active", icon: "🔐" },
    { name: "SMTP (SendGrid)", category: "Email", status: "active", icon: "📧" },
    { name: "VNPay", category: "Payment", status: "active", icon: "💳" },
    { name: "Momo", category: "Payment", status: "inactive", icon: "💳" },
    { name: "Slack Webhook", category: "Notification", status: "active", icon: "🔔" },
    { name: "Zalo OA", category: "Notification", status: "inactive", icon: "💬" },
    { name: "S3 Storage", category: "Storage", status: "active", icon: "☁️" },
  ];

  const statusColor: Record<string, { bg: string; fg: string }> = {
    active: { bg: "#14532d", fg: "#4ade80" },
    inactive: { bg: "#1e293b", fg: "#64748b" },
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Integrations</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
            SSO, email, payment gateway, webhook, external services
          </p>
        </div>
        <button
          style={{
            background: "#1e3a5f", color: "#60a5fa", border: "1px solid #1e40af",
            padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
          }}
        >
          + Thêm Integration
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {integrations.map((intg) => {
          const st = statusColor[intg.status];
          return (
            <div key={intg.name} style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{intg.icon}</span>
                <span style={{ background: st.bg, color: st.fg, padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                  {intg.status}
                </span>
              </div>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{intg.name}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{intg.category}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
