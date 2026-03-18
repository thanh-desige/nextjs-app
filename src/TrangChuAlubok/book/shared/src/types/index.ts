// ============================================================
// shared/src/types — Barrel export
// ============================================================

// Permission types (core)
export type {
  PermissionAction,
  PermissionGroup,
  MasterResource,
  BusinessResource,
  ReportResource,
  SettingResource,
  PlatformResource,
  PermissionResource,
  PermissionString,
  WildcardPermission,
  Permission,
  RolePermission,
  ScopeLevel,
  MemberDataScope,
  MemberApprovalLimit,
  PermissionCatalogEntry,
} from './permission.types';

// Org types
export type {
  OrgStatus,
  BranchStatus,
  Org,
  OrgBranch,
  PolicyType,
  PlatformPolicy,
} from './org.types';

// User types
export type {
  AuthProvider,
  UserStatus,
  User,
} from './user.types';

// Member types
export type {
  PlatformRole,
  MemberStatus,
  OrgMember,
  UserEntitlement,
  MemberRole,
} from './member.types';

// Role types
export type {
  RoleType,
  SystemRoleName,
  PlatformAdminRole,
  AppRole,
} from './role.types';

// Session types
export type {
  ModuleKey,
  SubscriptionPlan,
  AppRoleRef,
  DataScopeEntry,
  ApprovalLimitEntry,
  PolicyResult,
  SessionContext,
} from './session.types';

// Audit types
export type {
  AuditLog,
  SecurityEventType,
  SecurityLog,
  ApproverType,
  ApprovalConfig,
  DelegationStatus,
  ApprovalDelegation,
} from './audit.types';
