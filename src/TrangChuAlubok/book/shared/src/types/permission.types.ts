// ============================================================
// Permission Types — Source of truth from PERMISSION_CATALOG.md
// ============================================================

/** 17 standard actions across all resources */
export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'import'
  | 'export'
  | 'share'
  | 'generate'
  | 'approve'
  | 'reject'
  | 'confirm'
  | 'close'
  | 'cancel'
  | 'manage'
  | 'assign'
  | 'restore'
  | 'archive';

/** 5 permission groups */
export type PermissionGroup = 'A' | 'B' | 'C' | 'D' | 'E';

// --- Group A: Master Data (12 resources) ---
export type MasterResource =
  | 'master.customer'
  | 'master.supplier'
  | 'master.employee'
  | 'master.profile'
  | 'master.glass'
  | 'master.accessory'
  | 'master.material'
  | 'master.unit'
  | 'master.warehouse'
  | 'master.price_list'
  | 'master.tax_rate'
  | 'master.door_template';

// --- Group B: Business Operations (20 resources) ---
export type BusinessResource =
  | 'design.project'
  | 'design.canvas'
  | 'design.library'
  | 'bom.report'
  | 'bom.cut_list'
  | 'quote'
  | 'sales.order'
  | 'purchase.order'
  | 'purchase.request'
  | 'inventory.stock_receipt'
  | 'inventory.stock_issue'
  | 'inventory.stock_transfer'
  | 'inventory.stock_audit'
  | 'inventory.balance'
  | 'finance.receipt'
  | 'finance.payment'
  | 'finance.ar'
  | 'finance.ap'
  | 'accounting.voucher'
  | 'accounting.invoice';

// --- Group C: Reports (11 resources) ---
export type ReportResource =
  | 'report.dashboard_executive'
  | 'report.design'
  | 'report.bom'
  | 'report.quote'
  | 'report.sales'
  | 'report.purchase'
  | 'report.inventory'
  | 'report.debt'
  | 'report.cashflow'
  | 'report.accounting'
  | 'report.performance';

// --- Group D: Settings — Org-level (8 resources) ---
export type SettingResource =
  | 'setting.user'
  | 'setting.role'
  | 'setting.permission'
  | 'setting.org'
  | 'setting.branch'
  | 'setting.system'
  | 'setting.print_template'
  | 'setting.audit_log';

// --- Group E: Platform Administration — Internal only (16 resources) ---
export type PlatformResource =
  | 'platform.tenant'
  | 'platform.user'
  | 'platform.subscription'
  | 'platform.entitlement'
  | 'platform.internal_role'
  | 'platform.security'
  | 'platform.support'
  | 'platform.health'
  | 'platform.job'
  | 'platform.storage'
  | 'platform.backup'
  | 'platform.integration'
  | 'platform.notification'
  | 'platform.analytics'
  | 'platform.release'
  | 'platform.config';

/** Union of all 67 resources */
export type PermissionResource =
  | MasterResource
  | BusinessResource
  | ReportResource
  | SettingResource
  | PlatformResource;

/** Permission string format: "resource:action" */
export type PermissionString = `${PermissionResource}:${PermissionAction}`;

/** Wildcard permission: "resource:*" or "*:*" */
export type WildcardPermission = `${PermissionResource}:*` | '*:*';

/** DB table: permission (seed data) */
export interface Permission {
  permissionId: string;
  resource: PermissionResource;
  action: PermissionAction;
  group: PermissionGroup;
  description?: string;
}

/** DB table: role_permission (junction) */
export interface RolePermission {
  roleId: string;
  permissionId: string;
}

/** DB table: member_data_scope */
export type ScopeLevel = 'org' | 'branch' | 'warehouse' | 'own';

export interface MemberDataScope {
  scopeId: string;
  memberId: string;
  resourceGroup: string;
  scopeLevel: ScopeLevel;
  scopeIds: string[];
  updatedBy: string;
}

/** DB table: member_approval_limit */
export interface MemberApprovalLimit {
  limitId: string;
  memberId: string;
  resource: string;
  maxAmount: number | null;
  maxLevel: 1 | 2 | 3;
  canDelegate: boolean;
  updatedBy: string;
}

/** Catalog entry: resource → allowed actions */
export interface PermissionCatalogEntry {
  resource: PermissionResource;
  group: PermissionGroup;
  actions: readonly PermissionAction[];
  description?: string;
}
