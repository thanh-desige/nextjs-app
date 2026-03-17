"use client";
import React from "react";

/** Release & Config Control — Quản lý phiên bản, deploy, remote config */
export default function ReleaseControlPage(): React.ReactElement {
  const releases = [
    { version: "v2.4.0", date: "15/01/2025", status: "production", changes: 12, rollback: false },
    { version: "v2.3.2", date: "10/01/2025", status: "production", changes: 3, rollback: false },
    { version: "v2.3.1", date: "05/01/2025", status: "rolled-back", changes: 5, rollback: true },
    { version: "v2.3.0", date: "28/12/2024", status: "production", changes: 18, rollback: false },
  ];

  const configs = [
    { key: "max_file_upload_mb", value: "50", scope: "global" },
    { key: "session_timeout_min", value: "30", scope: "global" },
    { key: "enable_beta_cad3d", value: "true", scope: "enterprise" },
    { key: "default_language", value: "vi", scope: "global" },
    { key: "maintenance_mode", value: "false", scope: "global" },
  ];

  const statusStyle: Record<string, { bg: string; fg: string }> = {
    production: { bg: "#14532d", fg: "#4ade80" },
    staging: { bg: "#1e3a5f", fg: "#60a5fa" },
    "rolled-back": { bg: "#7f1d1d", fg: "#fca5a5" },
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Release & Config Control</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Quản lý phiên bản, deploy pipeline, remote config
        </p>
      </div>

      {/* Releases */}
      <h3 style={{ color: "#f1f5f9", fontSize: 15, marginBottom: 12 }}>Recent Releases</h3>
      <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", overflow: "hidden", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Version", "Date", "Changes", "Status", "Action"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {releases.map((r) => {
              const st = statusStyle[r.status];
              return (
                <tr key={r.version} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "10px 14px", color: "#f1f5f9", fontFamily: "monospace", fontWeight: 600 }}>{r.version}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{r.date}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{r.changes} changes</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: st.bg, color: st.fg, padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{r.status}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {!r.rollback && r.status === "production" && (
                      <button style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>
                        Rollback
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Remote Config */}
      <h3 style={{ color: "#f1f5f9", fontSize: 15, marginBottom: 12 }}>Remote Config</h3>
      <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Key", "Value", "Scope"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {configs.map((c) => (
              <tr key={c.key} style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "10px 14px", color: "#f1f5f9", fontFamily: "monospace" }}>{c.key}</td>
                <td style={{ padding: "10px 14px", color: "#60a5fa", fontFamily: "monospace" }}>{c.value}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{c.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
