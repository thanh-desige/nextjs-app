"use client";
import React from "react";

/** Jobs & Queue — Background tasks, scheduled jobs, queue management */
export default function JobsQueuePage(): React.ReactElement {
  const jobs = [
    { name: "BOM export batch", queue: "export", status: "running", progress: 67, started: "14:32", tenant: "Nhôm Việt JSC" },
    { name: "Monthly invoice gen", queue: "billing", status: "queued", progress: 0, started: "—", tenant: "ALL" },
    { name: "Data backup daily", queue: "backup", status: "completed", progress: 100, started: "03:00", tenant: "ALL" },
    { name: "CAD file import", queue: "import", status: "failed", progress: 43, started: "13:15", tenant: "Kính Hải Phòng" },
    { name: "Email digest", queue: "notification", status: "running", progress: 22, started: "14:30", tenant: "ALL" },
  ];

  const statusStyle: Record<string, { bg: string; fg: string }> = {
    running: { bg: "#1e3a5f", fg: "#60a5fa" },
    queued: { bg: "#1e293b", fg: "#94a3b8" },
    completed: { bg: "#14532d", fg: "#4ade80" },
    failed: { bg: "#7f1d1d", fg: "#fca5a5" },
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Jobs & Queue</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Background jobs, scheduled tasks, queue monitoring
        </p>
      </div>

      {/* Queue summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Running", count: 2, color: "#60a5fa" },
          { label: "Queued", count: 1, color: "#94a3b8" },
          { label: "Completed (24h)", count: 47, color: "#4ade80" },
          { label: "Failed (24h)", count: 3, color: "#f87171" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", padding: 14, textAlign: "center" }}>
            <div style={{ color: s.color, fontSize: 28, fontWeight: 700 }}>{s.count}</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1e293b", borderRadius: 8, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Job", "Queue", "Tenant", "Status", "Progress", "Started"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((j, i) => {
              const st = statusStyle[j.status];
              return (
                <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "10px 14px", color: "#f1f5f9" }}>{j.name}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "monospace" }}>{j.queue}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{j.tenant}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: st.bg, color: st.fg, padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{j.status}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ background: "#0f172a", borderRadius: 4, height: 6, width: 80 }}>
                      <div style={{ background: st.fg, borderRadius: 4, height: 6, width: `${j.progress}%` }} />
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{j.started}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
