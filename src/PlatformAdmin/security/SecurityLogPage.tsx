"use client";
import React from "react";
import { FiSearch, FiAlertTriangle, FiCheck, FiX } from "react-icons/fi";

/** Security log: login/logout, permission denied, policy blocked, suspicious */
export default function SecurityLogPage(): React.ReactElement {
  const sampleLogs = [
    {
      time: "16/03/2026 14:32",
      event: "login",
      user: "admin@alubok.vn",
      detail: "Login thành công",
      ip: "103.45.67.89",
      icon: FiCheck,
      color: "#22c55e",
    },
    {
      time: "16/03/2026 14:28",
      event: "permission_denied",
      user: "kho@nhomkinhabc.vn",
      detail: "quote:approve — không có quyền",
      ip: "113.22.33.44",
      icon: FiX,
      color: "#ef4444",
    },
    {
      time: "16/03/2026 13:15",
      event: "login_failed",
      user: "test@unknown.com",
      detail: "Sai mật khẩu lần 3",
      ip: "185.99.88.77",
      icon: FiAlertTriangle,
      color: "#eab308",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>
          Security Log
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Theo dõi sự kiện bảo mật toàn nền tảng
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "#1e293b",
          borderRadius: 6,
          border: "1px solid #334155",
          marginBottom: 16,
        }}
      >
        <FiSearch size={14} color="#64748b" />
        <input
          type="text"
          placeholder="Tìm theo email, IP, event type..."
          style={{
            flex: 1,
            background: "none",
            border: "none",
            color: "#f1f5f9",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          border: "1px solid #334155",
          overflow: "hidden",
        }}
      >
        {sampleLogs.map((log, i) => {
          const Icon = log.icon;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom:
                  i < sampleLogs.length - 1
                    ? "1px solid #334155"
                    : "none",
              }}
            >
              <Icon size={14} color={log.color} />
              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  minWidth: 130,
                  fontFamily: "monospace",
                }}
              >
                {log.time}
              </span>
              <span
                style={{
                  color: log.color,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  minWidth: 130,
                }}
              >
                {log.event}
              </span>
              <span
                style={{ color: "#e2e8f0", fontSize: 13, minWidth: 180 }}
              >
                {log.user}
              </span>
              <span style={{ color: "#94a3b8", fontSize: 13, flex: 1 }}>
                {log.detail}
              </span>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                {log.ip}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
