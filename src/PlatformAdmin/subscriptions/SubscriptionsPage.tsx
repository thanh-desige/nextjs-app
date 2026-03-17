"use client";
import React from "react";

/** Quản lý gói dịch vụ, billing, gia hạn cho tất cả tenant */
export default function SubscriptionsPage(): React.ReactElement {
  const plans = [
    { name: "Free", tenants: 5, color: "#64748b" },
    { name: "Starter", tenants: 12, color: "#22c55e" },
    { name: "Business", tenants: 8, color: "#3b82f6" },
    { name: "Enterprise", tenants: 2, color: "#a855f7" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 24, margin: 0 }}>
          Subscriptions
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Quản lý gói dịch vụ và billing
        </p>
      </div>

      {/* Plan overview cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              background: "#1e293b",
              borderRadius: 8,
              border: "1px solid #334155",
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: plan.color,
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {plan.name}
            </div>
            <div style={{ fontSize: 32, color: "#f1f5f9", fontWeight: 700 }}>
              {plan.tenants}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>tenants</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          border: "1px solid #334155",
          padding: 40,
          textAlign: "center",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        Chi tiết billing và lịch sử thanh toán sẽ hiển thị ở đây
      </div>
    </div>
  );
}
