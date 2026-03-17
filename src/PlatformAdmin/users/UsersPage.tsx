"use client";
import React from "react";
import { FiSearch } from "react-icons/fi";

/** Quản lý tất cả user toàn nền tảng (cross-tenant) */
export default function UsersPage(): React.ReactElement {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>Users</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Quản lý tất cả người dùng trên nền tảng
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
          placeholder="Tìm theo email, tên..."
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
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Email", "Tên", "Số Org", "Provider", "Trạng thái", "Last Login"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "10px 14px", color: "#f1f5f9" }}>
                admin@alubok.vn
              </td>
              <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                ALUBOK Admin
              </td>
              <td style={{ padding: "10px 14px", color: "#94a3b8" }}>3</td>
              <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                email
              </td>
              <td style={{ padding: "10px 14px" }}>
                <span
                  style={{
                    background: "#166534",
                    color: "#4ade80",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  Active
                </span>
              </td>
              <td style={{ padding: "10px 14px", color: "#64748b" }}>
                16/03/2026
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
