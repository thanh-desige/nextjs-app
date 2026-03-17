"use client";
import React, { useState } from "react";
import {
  FiServer,
  FiUsers,
  FiCreditCard,
  FiActivity,
  FiSettings,
  FiArrowLeft,
  FiMenu,
  FiShield,
  FiToggleRight,
  FiHeadphones,
  FiUserCheck,
  FiCpu,
  FiDatabase,
  FiUploadCloud,
  FiLink,
  FiBell,
  FiBarChart2,
  FiPackage,
} from "react-icons/fi";

import TenantsPage from "./tenants/TenantsPage";
import UsersPage from "./users/UsersPage";
import SubscriptionsPage from "./subscriptions/SubscriptionsPage";
import MonitoringPage from "./monitoring/MonitoringPage";
import PlatformConfigPage from "./config/PlatformConfigPage";
import SecurityLogPage from "./security/SecurityLogPage";
import EntitlementsPage from "./entitlements/EntitlementsPage";
import InternalRolesPage from "./internal-roles/InternalRolesPage";
import SupportConsolePage from "./support/SupportConsolePage";
import JobsQueuePage from "./jobs/JobsQueuePage";
import StoragePage from "./storage/StoragePage";
import BackupRestorePage from "./backup/BackupRestorePage";
import IntegrationsPage from "./integrations/IntegrationsPage";
import NotificationsPage from "./notifications/NotificationsPage";
import PlatformAnalyticsPage from "./analytics/PlatformAnalyticsPage";
import ReleaseControlPage from "./release/ReleaseControlPage";

/**
 * QuanTriAdmin — Trung tâm điều hành toàn bộ SaaS platform ALUBOK
 *
 * KHÁC HOÀN TOÀN với ThietLap:
 * - ThietLap: khách hàng doanh nghiệp quản trị tenant CỦA HỌ
 * - QuanTriAdmin: đội nội bộ ALUBOK quản trị TOÀN BỘ PLATFORM
 *
 * Khác cấp độ, khác người dùng, khác phạm vi dữ liệu, khác quyền hạn.
 */

const ADMIN_MENU_SECTIONS = [
  {
    section: "Tenant & Users",
    items: [
      { id: 1, label: "Tenants", icon: FiServer },
      { id: 2, label: "Users (Global)", icon: FiUsers },
      { id: 3, label: "Subscriptions & Billing", icon: FiCreditCard },
      { id: 4, label: "Entitlements & Feature Flags", icon: FiToggleRight },
    ],
  },
  {
    section: "Access & Security",
    items: [
      { id: 5, label: "Internal Admin Roles", icon: FiUserCheck },
      { id: 6, label: "Security Center", icon: FiShield },
    ],
  },
  {
    section: "Operations",
    items: [
      { id: 7, label: "Support Console", icon: FiHeadphones },
      { id: 8, label: "System Health", icon: FiActivity },
      { id: 9, label: "Jobs & Queue", icon: FiCpu },
      { id: 10, label: "Storage & Data Governance", icon: FiDatabase },
      { id: 11, label: "Backup & Restore", icon: FiUploadCloud },
    ],
  },
  {
    section: "Platform Config",
    items: [
      { id: 12, label: "Integrations", icon: FiLink },
      { id: 13, label: "Notifications", icon: FiBell },
      { id: 14, label: "Platform Analytics", icon: FiBarChart2 },
      { id: 15, label: "Release & Config Control", icon: FiPackage },
      { id: 16, label: "Platform Settings", icon: FiSettings },
    ],
  },
];

interface PlatformAdminPageProps {
  onBackToHome: () => void;
}

export default function PlatformAdminPage({
  onBackToHome,
}: PlatformAdminPageProps): React.ReactElement {
  const [activePage, setActivePage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 1: return <TenantsPage />;
      case 2: return <UsersPage />;
      case 3: return <SubscriptionsPage />;
      case 4: return <EntitlementsPage />;
      case 5: return <InternalRolesPage />;
      case 6: return <SecurityLogPage />;
      case 7: return <SupportConsolePage />;
      case 8: return <MonitoringPage />;
      case 9: return <JobsQueuePage />;
      case 10: return <StoragePage />;
      case 11: return <BackupRestorePage />;
      case 12: return <IntegrationsPage />;
      case 13: return <NotificationsPage />;
      case 14: return <PlatformAnalyticsPage />;
      case 15: return <ReleaseControlPage />;
      case 16: return <PlatformConfigPage />;
      default: return <TenantsPage />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a" }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarCollapsed ? 60 : 250,
          background: "#1e293b",
          borderRight: "1px solid #334155",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 12px",
            borderBottom: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "sticky",
            top: 0,
            background: "#1e293b",
            zIndex: 1,
          }}
        >
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <FiMenu size={18} />
          </button>
          {!sidebarCollapsed && (
            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>
              ⚡ ALUBOK Platform Admin
            </span>
          )}
        </div>

        {/* Menu sections */}
        <nav style={{ flex: 1, padding: "4px 0" }}>
          {ADMIN_MENU_SECTIONS.map((section) => (
            <div key={section.section}>
              {!sidebarCollapsed && (
                <div
                  style={{
                    padding: "12px 16px 4px",
                    fontSize: 10,
                    color: "#475569",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {section.section}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: sidebarCollapsed ? "10px 20px" : "8px 16px",
                      background: isActive ? "#334155" : "transparent",
                      border: "none",
                      borderLeft: isActive
                        ? "3px solid #ef4444"
                        : "3px solid transparent",
                      color: isActive ? "#f1f5f9" : "#94a3b8",
                      cursor: "pointer",
                      fontSize: 12,
                      textAlign: "left",
                    }}
                  >
                    <Icon size={15} />
                    {!sidebarCollapsed && item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Back button */}
        <button
          onClick={onBackToHome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 16px",
            background: "none",
            border: "none",
            borderTop: "1px solid #334155",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 13,
            position: "sticky",
            bottom: 0,
            backgroundColor: "#1e293b",
          }}
        >
          <FiArrowLeft size={16} />
          {!sidebarCollapsed && "Về trang chủ"}
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", background: "#0f172a" }}>
        {renderPage()}
      </div>
    </div>
  );
}
