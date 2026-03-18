// ============================================================
// Session Types — Runtime context (passed through every request)
// ============================================================

import type { ScopeLevel } from './permission.types';

/** Module keys mapped to Book modules */
export type ModuleKey =
  | 'dashboard'    // BookTongQuan
  | 'cad'          // BookThietKeBocTach — CAD + BOM
  | 'sales'        // BookBanHang — Báo giá + SO
  | 'purchase'     // BookMuaHang — PO + PR
  | 'inventory'    // BookTonKho — Nhập xuất tồn
  | 'finance'      // BookThuChi — Thu chi + công nợ
  | 'accounting'   // BookKeToan — Chứng từ + sổ sách
  | 'master'       // DanhMuc — Master data
  | 'settings'     // ThietLap — Cấu hình cấp Tenant (D1-D8)
  | 'shop';        // MuaHangPage — B2C catalog

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface AppRoleRef {
  roleId: string;
  roleName: string;
}

export interface DataScopeEntry {
  resourceGroup: string;
  scopeLevel: ScopeLevel;
  scopeIds: string[];
}

export interface ApprovalLimitEntry {
  resource: string;
  maxAmount: number | null;
  maxLevel: 1 | 2 | 3;
  canDelegate: boolean;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

/** Full session context after Layer 1 + Layer 2 auth */
export interface SessionContext {
  // Identity
  userId: string;
  email: string;
  displayName: string;

  // Tenant
  orgId: string;
  orgName: string;

  // Platform (Layer 1)
  platformRole: 'owner' | 'admin' | 'member';
  entitledModules: ModuleKey[];
  subscriptionPlan: SubscriptionPlan;

  // Application (Layer 2)
  appRoles: AppRoleRef[];
  permissions: Set<string>;
  dataScopes: DataScopeEntry[];
  approvalLimits: ApprovalLimitEntry[];
}
