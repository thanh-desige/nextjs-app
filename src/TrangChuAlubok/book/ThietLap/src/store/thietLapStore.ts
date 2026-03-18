// ============================================================
// ThietLap Store — Zustand store for settings management
// In-memory mock data; will be replaced with API when backend connects
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ManagedUser, ManagedRole, SystemSettings, AuditLogEntry } from '../types';
import type { Org, OrgBranch } from '../../../shared/src/types/org.types';
import { DEFAULT_SYSTEM_SETTINGS } from '../types';

// ────────────────────────────────────────────────────────────
// Mock seed data
// ────────────────────────────────────────────────────────────

const SEED_USERS: ManagedUser[] = [
  {
    user: { userId: 'u1', email: 'owner@alubok.vn', displayName: 'Nguyễn Văn A', avatarUrl: null, authProvider: 'email', emailVerified: true, mfaEnabled: true, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
    membership: { memberId: 'm1', userId: 'u1', orgId: 'org1', platformRole: 'owner', status: 'active', joinedAt: '2024-01-01T00:00:00Z', invitedBy: null },
    assignedRoles: [{ memberId: 'm1', roleId: 'r1', assignedAt: '2024-01-01T00:00:00Z', assignedBy: 'system' }],
    roleNames: ['OWNER'],
    lastLoginAt: '2026-03-17T08:00:00Z',
  },
  {
    user: { userId: 'u2', email: 'admin@alubok.vn', displayName: 'Trần Thị B', avatarUrl: null, authProvider: 'email', emailVerified: true, mfaEnabled: false, status: 'active', createdAt: '2024-02-15T00:00:00Z' },
    membership: { memberId: 'm2', userId: 'u2', orgId: 'org1', platformRole: 'admin', status: 'active', joinedAt: '2024-02-15T00:00:00Z', invitedBy: 'u1' },
    assignedRoles: [{ memberId: 'm2', roleId: 'r2', assignedAt: '2024-02-15T00:00:00Z', assignedBy: 'u1' }],
    roleNames: ['ADMIN'],
    lastLoginAt: '2026-03-16T14:30:00Z',
  },
  {
    user: { userId: 'u3', email: 'designer@alubok.vn', displayName: 'Lê Văn C', avatarUrl: null, authProvider: 'google', emailVerified: true, mfaEnabled: false, status: 'active', createdAt: '2024-03-01T00:00:00Z' },
    membership: { memberId: 'm3', userId: 'u3', orgId: 'org1', platformRole: 'member', status: 'active', joinedAt: '2024-03-01T00:00:00Z', invitedBy: 'u1' },
    assignedRoles: [{ memberId: 'm3', roleId: 'r3', assignedAt: '2024-03-01T00:00:00Z', assignedBy: 'u1' }],
    roleNames: ['DESIGNER'],
    lastLoginAt: '2026-03-15T09:00:00Z',
  },
  {
    user: { userId: 'u4', email: 'sales@alubok.vn', displayName: 'Phạm Thị D', avatarUrl: null, authProvider: 'email', emailVerified: true, mfaEnabled: false, status: 'active', createdAt: '2024-04-10T00:00:00Z' },
    membership: { memberId: 'm4', userId: 'u4', orgId: 'org1', platformRole: 'member', status: 'active', joinedAt: '2024-04-10T00:00:00Z', invitedBy: 'u1' },
    assignedRoles: [{ memberId: 'm4', roleId: 'r6', assignedAt: '2024-04-10T00:00:00Z', assignedBy: 'u1' }],
    roleNames: ['SALES'],
    lastLoginAt: '2026-03-17T07:15:00Z',
  },
  {
    user: { userId: 'u5', email: 'invited@gmail.com', displayName: 'Hoàng Văn E', avatarUrl: null, authProvider: 'email', emailVerified: false, mfaEnabled: false, status: 'active', createdAt: '2026-03-10T00:00:00Z' },
    membership: { memberId: 'm5', userId: 'u5', orgId: 'org1', platformRole: 'member', status: 'invited', joinedAt: '2026-03-10T00:00:00Z', invitedBy: 'u1' },
    assignedRoles: [],
    roleNames: [],
    lastLoginAt: null,
  },
];

const SEED_ROLES: ManagedRole[] = [
  { role: { roleId: 'r1', orgId: 'org1', roleName: 'OWNER', roleType: 'system', description: 'Chủ doanh nghiệp — toàn quyền', createdAt: '2024-01-01T00:00:00Z' }, permissions: ['*:*'], memberCount: 1 },
  { role: { roleId: 'r2', orgId: 'org1', roleName: 'ADMIN', roleType: 'system', description: 'Quản trị viên — gần toàn bộ', createdAt: '2024-01-01T00:00:00Z' }, permissions: ['master.*:*', 'design.*:*', 'bom.*:*', 'quote:*', 'sales.order:*', 'setting.user:*', 'setting.role:*'], memberCount: 1 },
  { role: { roleId: 'r3', orgId: 'org1', roleName: 'DESIGNER', roleType: 'system', description: 'Thiết kế viên — CAD, BOM', createdAt: '2024-01-01T00:00:00Z' }, permissions: ['design.*:*', 'bom.*:*', 'master.door_template:read', 'quote:read', 'quote:generate'], memberCount: 1 },
  { role: { roleId: 'r4', orgId: 'org1', roleName: 'ACCOUNTANT', roleType: 'system', description: 'Kế toán — tài chính, thu chi', createdAt: '2024-01-01T00:00:00Z' }, permissions: ['finance.*:*', 'accounting.*:*', 'report.debt:*', 'report.cashflow:*', 'report.accounting:*'], memberCount: 0 },
  { role: { roleId: 'r5', orgId: 'org1', roleName: 'WAREHOUSE', roleType: 'system', description: 'Quản lý kho', createdAt: '2024-01-01T00:00:00Z' }, permissions: ['inventory.*:*', 'master.warehouse:read', 'master.material:read', 'report.inventory:*'], memberCount: 0 },
  { role: { roleId: 'r6', orgId: 'org1', roleName: 'SALES', roleType: 'system', description: 'Nhân viên kinh doanh', createdAt: '2024-01-01T00:00:00Z' }, permissions: ['master.customer:*', 'quote:*', 'sales.order:*', 'design.project:read', 'bom.report:read', 'report.sales:*', 'report.quote:*'], memberCount: 1 },
];

const SEED_ORG: Org = {
  orgId: 'org1',
  orgName: 'Công ty TNHH Nhôm Kính ALUBOK',
  orgSlug: 'alubok',
  subscriptionPlan: 'professional',
  subscriptionExpiry: '2027-01-01T00:00:00Z',
  maxUsers: 50,
  maxBranches: 5,
  enabledModules: ['dashboard', 'cad', 'sales', 'purchase', 'inventory', 'finance', 'accounting', 'master', 'settings'],
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
};

const SEED_BRANCHES: OrgBranch[] = [
  { branchId: 'b1', orgId: 'org1', branchName: 'Trụ sở chính', address: '123 Nguyễn Huệ, Q.1, TP.HCM', status: 'active' },
  { branchId: 'b2', orgId: 'org1', branchName: 'Chi nhánh Hà Nội', address: '456 Trần Duy Hưng, Cầu Giấy, HN', status: 'active' },
];

const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'a1', userId: 'u1', userName: 'Nguyễn Văn A', action: 'create', resource: 'setting.user', details: 'Mời thành viên: invited@gmail.com', ipAddress: '192.168.1.10', createdAt: '2026-03-10T10:00:00Z' },
  { id: 'a2', userId: 'u2', userName: 'Trần Thị B', action: 'update', resource: 'setting.role', details: 'Cập nhật vai trò: SALES', ipAddress: '192.168.1.20', createdAt: '2026-03-12T14:30:00Z' },
  { id: 'a3', userId: 'u1', userName: 'Nguyễn Văn A', action: 'update', resource: 'setting.system', details: 'Đổi định dạng ngày: DD/MM/YYYY', ipAddress: '192.168.1.10', createdAt: '2026-03-15T09:00:00Z' },
];

// ────────────────────────────────────────────────────────────
// Store interface
// ────────────────────────────────────────────────────────────

interface ThietLapState {
  // Data
  users: ManagedUser[];
  roles: ManagedRole[];
  org: Org;
  branches: OrgBranch[];
  systemSettings: SystemSettings;
  auditLogs: AuditLogEntry[];

  // Setters
  setUsers: (users: ManagedUser[]) => void;
  setRoles: (roles: ManagedRole[]) => void;
  setOrg: (org: Org) => void;
  setBranches: (branches: OrgBranch[]) => void;
  setSystemSettings: (settings: SystemSettings) => void;
  setAuditLogs: (logs: AuditLogEntry[]) => void;
  addAuditLog: (log: AuditLogEntry) => void;
  resetAll: () => void;
}

export const useThietLapStore = create<ThietLapState>()(
  persist(
    (set) => ({
      users: SEED_USERS,
      roles: SEED_ROLES,
      org: SEED_ORG,
      branches: SEED_BRANCHES,
      systemSettings: DEFAULT_SYSTEM_SETTINGS,
      auditLogs: SEED_AUDIT_LOGS,

      setUsers:          (users) => set({ users }),
      setRoles:          (roles) => set({ roles }),
      setOrg:            (org) => set({ org }),
      setBranches:       (branches) => set({ branches }),
      setSystemSettings: (settings) => set({ systemSettings: settings }),
      setAuditLogs:      (logs) => set({ auditLogs: logs }),
      addAuditLog:       (log) => set((s) => ({ auditLogs: [log, ...s.auditLogs] })),
      resetAll: () => set({
        users: SEED_USERS,
        roles: SEED_ROLES,
        org: SEED_ORG,
        branches: SEED_BRANCHES,
        systemSettings: DEFAULT_SYSTEM_SETTINGS,
        auditLogs: SEED_AUDIT_LOGS,
      }),
    }),
    {
      name: 'alubok-thiet-lap',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
