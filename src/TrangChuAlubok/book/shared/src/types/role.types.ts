// ============================================================
// Role Types — DB table: app_role + system role definitions
// ============================================================

export type RoleType = 'system' | 'custom';

/** 6 built-in app roles */
export type SystemRoleName =
  | 'OWNER'
  | 'ADMIN'
  | 'DESIGNER'
  | 'ACCOUNTANT'
  | 'WAREHOUSE'
  | 'SALES';

/** 6 internal admin roles (ALUBOK platform staff only) */
export type PlatformAdminRole =
  | 'SUPER_ADMIN'
  | 'SUPPORT_LEAD'
  | 'SUPPORT_AGENT'
  | 'DEVOPS'
  | 'FINANCE_ADMIN'
  | 'PRODUCT_MANAGER';

/** DB table: app_role */
export interface AppRole {
  roleId: string;
  orgId: string;
  roleName: string;
  roleType: RoleType;
  description: string;
  createdAt: string;
}
