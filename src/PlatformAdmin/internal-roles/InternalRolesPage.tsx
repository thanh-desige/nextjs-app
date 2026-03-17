"use client";
import React from "react";

/** Quản lý vai trò nội bộ ALUBOK (SuperAdmin, Support, DevOps...) */
export default function InternalRolesPage(): React.ReactElement {
  const roles = [
    { name: "SuperAdmin", users: 2, desc: "Full quyền platform", color: "#ef4444" },
    { name: "Support Lead", users: 3, desc: "Hỗ trợ khách hàng + impersonation", color: "#f59e0b" },
    { name: "Support Agent", users: 8, desc: "Hỗ trợ khách hàng (read-only)", color: "#f59e0b" },
    { name: "DevOps", users: 2, desc: "Monitoring, jobs, health checks", color: "#3b82f6" },
    { name: "Finance", users: 2, desc: "Billing, subscription management", color: "#10b981" },
    { name: "Product Manager", users: 3, desc: "Feature flags, release control", color: "#8b5cf6" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>
          Internal Admin Roles
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Vai trò nội bộ đội ALUBOK — chỉ SuperAdmin mới quản lý được
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {roles.map((r) => (
          <div key={r.name} style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: r.color, fontWeight: 600, fontSize: 15 }}>{r.name}</span>
              <span style={{ background: "#0f172a", color: "#94a3b8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                {r.users} users
              </span>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
