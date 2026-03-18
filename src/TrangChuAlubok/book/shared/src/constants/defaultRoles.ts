// ============================================================
// Default Roles — 6 app roles + 6 internal admin roles
// Source of truth from PERMISSION_CATALOG.md §4 + §4b
// ============================================================

import type { SystemRoleName, PlatformAdminRole } from '../types';

export interface DefaultRoleDefinition {
  name: SystemRoleName;
  description: string;
  /** '*:*' = all permissions; 'resource:*' = all actions on resource */
  permissions: readonly string[];
}

export interface InternalRoleDefinition {
  name: PlatformAdminRole;
  description: string;
  permissions: readonly string[];
}

// ────────────────────────────────────────────────────────────
// 6 App Roles (tenant-level)
// ────────────────────────────────────────────────────────────

const OWNER: DefaultRoleDefinition = {
  name: 'OWNER',
  description: 'Chủ doanh nghiệp — toàn quyền',
  permissions: ['*:*'],
};

const ADMIN: DefaultRoleDefinition = {
  name: 'ADMIN',
  description: 'Quản trị viên — gần toàn bộ, trừ chuyển chủ sở hữu, xóa tenant',
  permissions: [
    // All master data
    'master.customer:*', 'master.supplier:*', 'master.employee:*',
    'master.profile:*', 'master.glass:*', 'master.accessory:*',
    'master.material:*', 'master.unit:*', 'master.warehouse:*',
    'master.price_list:*', 'master.tax_rate:*', 'master.door_template:*',
    // All business operations
    'design.project:*', 'design.canvas:*', 'design.library:*',
    'bom.report:*', 'bom.cut_list:*', 'quote:*',
    'sales.order:*', 'purchase.order:*', 'purchase.request:*',
    'inventory.stock_receipt:*', 'inventory.stock_issue:*',
    'inventory.stock_transfer:*', 'inventory.stock_audit:*', 'inventory.balance:*',
    'finance.receipt:*', 'finance.payment:*', 'finance.ar:*', 'finance.ap:*',
    'accounting.voucher:*', 'accounting.invoice:*',
    // All reports
    'report.dashboard_executive:*', 'report.design:*', 'report.bom:*',
    'report.quote:*', 'report.sales:*', 'report.purchase:*',
    'report.inventory:*', 'report.debt:*', 'report.cashflow:*',
    'report.accounting:*', 'report.performance:*',
    // Settings (manage but cannot transfer/delete org)
    'setting.user:*', 'setting.role:*', 'setting.permission:*',
    'setting.org:read', 'setting.org:update',
    'setting.branch:*', 'setting.system:*',
    'setting.print_template:*', 'setting.audit_log:*',
  ],
};

const DESIGNER: DefaultRoleDefinition = {
  name: 'DESIGNER',
  description: 'Thiết kế viên — CAD, BOM, thư viện',
  permissions: [
    'design.project:read', 'design.project:create', 'design.project:update',
    'design.project:delete', 'design.project:export', 'design.project:share',
    'design.project:archive', 'design.project:restore',
    'design.canvas:read', 'design.canvas:update', 'design.canvas:export', 'design.canvas:share',
    'design.library:read',
    'master.door_template:read',
    'bom.report:read', 'bom.report:generate', 'bom.report:export',
    'bom.cut_list:read', 'bom.cut_list:generate', 'bom.cut_list:export',
    'quote:read', 'quote:generate',
    'report.design:read',
    'report.bom:read',
  ],
};

const ACCOUNTANT: DefaultRoleDefinition = {
  name: 'ACCOUNTANT',
  description: 'Kế toán — tài chính, công nợ, sổ sách',
  permissions: [
    'quote:read', 'quote:create', 'quote:update', 'quote:approve', 'quote:export',
    'finance.receipt:*', 'finance.payment:*',
    'finance.ar:*', 'finance.ap:*',
    'accounting.voucher:*', 'accounting.invoice:*',
    'report.quote:*', 'report.debt:*',
    'report.cashflow:*', 'report.accounting:*',
  ],
};

const WAREHOUSE: DefaultRoleDefinition = {
  name: 'WAREHOUSE',
  description: 'Thủ kho — nhập xuất tồn kho',
  permissions: [
    'master.warehouse:read', 'master.material:read',
    'master.profile:read', 'master.glass:read', 'master.accessory:read',
    'inventory.stock_receipt:*', 'inventory.stock_issue:*',
    'inventory.stock_transfer:*', 'inventory.stock_audit:*',
    'inventory.balance:*',
    'bom.report:read',
    'report.inventory:*',
  ],
};

const SALES: DefaultRoleDefinition = {
  name: 'SALES',
  description: 'Kinh doanh — khách hàng, báo giá, đơn hàng',
  permissions: [
    'master.customer:*',
    'quote:read', 'quote:create', 'quote:update', 'quote:generate',
    'quote:export', 'quote:share', 'quote:approve', 'quote:reject',
    'quote:close', 'quote:cancel',
    'sales.order:*',
    'design.project:read', 'design.project:share',
    'bom.report:read',
    'report.sales:*', 'report.quote:*',
  ],
};

/** All 6 default app roles */
export const DEFAULT_APP_ROLES: readonly DefaultRoleDefinition[] = [
  OWNER, ADMIN, DESIGNER, ACCOUNTANT, WAREHOUSE, SALES,
] as const;

// ────────────────────────────────────────────────────────────
// 6 Internal Admin Roles (platform-level, /admin only)
// ────────────────────────────────────────────────────────────

const SUPER_ADMIN: InternalRoleDefinition = {
  name: 'SUPER_ADMIN',
  description: 'Toàn quyền platform (1-2 người, MFA + IP whitelist)',
  permissions: ['platform.*:*'],
};

const SUPPORT_LEAD: InternalRoleDefinition = {
  name: 'SUPPORT_LEAD',
  description: 'Trưởng support — impersonation, security audit',
  permissions: [
    'platform.tenant:read',
    'platform.user:read', 'platform.user:update',
    'platform.support:*',
    'platform.security:read',
  ],
};

const SUPPORT_AGENT: InternalRoleDefinition = {
  name: 'SUPPORT_AGENT',
  description: 'Nhân viên support — xem, cập nhật ticket',
  permissions: [
    'platform.tenant:read',
    'platform.user:read',
    'platform.support:read', 'platform.support:update',
  ],
};

const DEVOPS: InternalRoleDefinition = {
  name: 'DEVOPS',
  description: 'Vận hành hệ thống — health, jobs, backup, storage',
  permissions: [
    'platform.health:*',
    'platform.job:*',
    'platform.backup:*',
    'platform.storage:read',
    'platform.config:read', 'platform.config:update',
  ],
};

const FINANCE_ADMIN_ROLE: InternalRoleDefinition = {
  name: 'FINANCE_ADMIN',
  description: 'Tài chính platform — subscription, billing',
  permissions: [
    'platform.subscription:*',
    'platform.tenant:read',
    'platform.analytics:read',
  ],
};

const PRODUCT_MANAGER_ROLE: InternalRoleDefinition = {
  name: 'PRODUCT_MANAGER',
  description: 'Product Manager — entitlements, release, notifications',
  permissions: [
    'platform.entitlement:*',
    'platform.release:*',
    'platform.analytics:read',
    'platform.notification:read', 'platform.notification:create', 'platform.notification:update',
  ],
};

/** All 6 internal admin roles */
export const DEFAULT_INTERNAL_ROLES: readonly InternalRoleDefinition[] = [
  SUPER_ADMIN, SUPPORT_LEAD, SUPPORT_AGENT,
  DEVOPS, FINANCE_ADMIN_ROLE, PRODUCT_MANAGER_ROLE,
] as const;

/** Lookup a default app role by name */
export function getDefaultAppRole(name: SystemRoleName): DefaultRoleDefinition | undefined {
  return DEFAULT_APP_ROLES.find(r => r.name === name);
}

/** Lookup an internal role by name */
export function getInternalRole(name: PlatformAdminRole): InternalRoleDefinition | undefined {
  return DEFAULT_INTERNAL_ROLES.find(r => r.name === name);
}
