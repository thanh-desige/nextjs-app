"use client";
import React from "react";
import { FiSearch, FiPlus, FiMoreVertical } from "react-icons/fi";

/** Quản lý tất cả Tenant (Organization) trên nền tảng ALUBOK */
export default function TenantsPage(): React.ReactElement {
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>
            Tenants
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
            Quản lý tất cả tổ chức trên nền tảng
          </p>
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <FiPlus size={14} />
          Tạo Tenant
        </button>
      </div>

      {/* Search */}
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
          placeholder="Tìm theo tên, slug, email..."
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

      {/* Table placeholder */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          border: "1px solid #334155",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["Tên tổ chức", "Slug", "Gói", "Users", "Trạng thái", "Ngày tạo", ""].map(
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
            {/* Sample row */}
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              <td style={{ padding: "10px 14px", color: "#f1f5f9" }}>
                Công ty Nhôm Kính ABC
              </td>
              <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                nhom-kinh-abc
              </td>
              <td style={{ padding: "10px 14px" }}>
                <span
                  style={{
                    background: "#1d4ed8",
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  Business
                </span>
              </td>
              <td style={{ padding: "10px 14px", color: "#94a3b8" }}>12</td>
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
                15/01/2026
              </td>
              <td style={{ padding: "10px 14px" }}>
                <FiMoreVertical
                  size={14}
                  color="#64748b"
                  style={{ cursor: "pointer" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
