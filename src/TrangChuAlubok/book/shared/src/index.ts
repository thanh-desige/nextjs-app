// ============================================================
// shared/src — Main barrel export
// ============================================================

// Types
export type {
  // Permission
  PermissionAction, PermissionGroup, PermissionResource, PermissionString,
  WildcardPermission, Permission, RolePermission, PermissionCatalogEntry,
  MasterResource, BusinessResource, ReportResource, SettingResource, PlatformResource,
  ScopeLevel, MemberDataScope, MemberApprovalLimit,
  // Org
  OrgStatus, BranchStatus, Org, OrgBranch, PolicyType, PlatformPolicy,
  // User
  AuthProvider, UserStatus, User,
  // Member
  PlatformRole, MemberStatus, OrgMember, UserEntitlement, MemberRole,
  // Role
  RoleType, SystemRoleName, PlatformAdminRole, AppRole,
  // Session
  ModuleKey, SubscriptionPlan, AppRoleRef, DataScopeEntry,
  ApprovalLimitEntry, PolicyResult, SessionContext,
  // Audit
  AuditLog, SecurityEventType, SecurityLog,
  ApproverType, ApprovalConfig, DelegationStatus, ApprovalDelegation,
} from './types';

// Constants
export {
  PERMISSION_CATALOG, PERMISSION_GROUPS, GROUP_COUNTS,
  DEFAULT_APP_ROLES, DEFAULT_INTERNAL_ROLES,
  getDefaultAppRole, getInternalRole,
  type DefaultRoleDefinition, type InternalRoleDefinition,
} from './constants';

// Utils
export {
  parsePermission, formatPermission, matchPermission,
  hasPermission, hasPermissionString,
  expandRolePermissions, expandAppRole, expandInternalRole,
  getResourceActions, isValidPermission,
} from './utils';

// Guards
export {
  AccessDeniedError,
  requireOrgMember, requirePermission, requireModuleAccess,
  checkApprovalLimit, checkBusinessPolicy, getDataScopeFilter,
} from './guards';

// Hooks
export {
  SessionContextReact, useSessionContext, useCurrentUser, useCurrentOrg,
  usePermission, usePermissionString, useModuleAccess, usePermissionChecker,
} from './hooks';
