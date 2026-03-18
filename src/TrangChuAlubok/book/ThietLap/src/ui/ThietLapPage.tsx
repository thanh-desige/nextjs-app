'use client';
// ============================================================
// ThietLapPage — System Settings management page
// Horizontal tab bar (8 tabs D1-D8) + dynamic content area
// Renders INSIDE the global App Shell content area
// ============================================================

import React from 'react';
import type { ThietLapTab } from '../types';
import { MODULE_ROUTES, ModuleTabBar } from '../../../navigation';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import PermissionMatrix from './PermissionMatrix';
import OrgSettings from './OrgSettings';
import SystemSettingsPage from './SystemSettings';
import AuditLog from './AuditLog';
import PlaceholderPage from './PlaceholderPage';

const THIET_LAP_TABS = MODULE_ROUTES.find(r => r.page === 8)!.tabs!;

function renderContent(tab: ThietLapTab): React.ReactNode {
  switch (tab) {
    case 'users':       return <UserManagement />;
    case 'roles':       return <RoleManagement />;
    case 'permissions': return <PermissionMatrix />;
    case 'org':         return <OrgSettings section="org" />;
    case 'branches':    return <OrgSettings section="branches" />;
    case 'system':      return <SystemSettingsPage />;
    case 'print':       return <PlaceholderPage title="Mẫu in" description="Quản lý mẫu in báo giá, hóa đơn, phiếu xuất kho." />;
    case 'audit':       return <AuditLog />;
  }
}

interface ThietLapPageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ThietLapPage({ activeTab, onTabChange }: ThietLapPageProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <ModuleTabBar tabs={THIET_LAP_TABS} activeTab={activeTab} onTabChange={onTabChange} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {renderContent(activeTab as ThietLapTab)}
      </div>
    </div>
  );
}
