# 📋 shared/ — Lịch sử hoàn thành

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Module: shared/ — Types + RBAC guards dùng chung

---

## Phase F1: RBAC Foundation — ✅ HOÀN TẤT

**Ngày**: Session hiện tại
**Kết quả**: 85 tests, 3 suites — all pass. 875 CAD tests không bị ảnh hưởng.

### Files tạo mới (20 files):

**Types (8 files)**:
- `src/types/permission.types.ts` — PermissionAction (17), PermissionResource (67), PermissionGroup (5), PermissionString, PermissionCatalogEntry, MemberDataScope, MemberApprovalLimit
- `src/types/org.types.ts` — Org, OrgBranch, PlatformPolicy
- `src/types/user.types.ts` — User, AuthProvider, UserStatus
- `src/types/member.types.ts` — OrgMember, UserEntitlement, MemberRole
- `src/types/role.types.ts` — AppRole, SystemRoleName (6), PlatformAdminRole (6)
- `src/types/session.types.ts` — SessionContext, ModuleKey (10), SubscriptionPlan, AppRoleRef, DataScopeEntry, ApprovalLimitEntry, PolicyResult
- `src/types/audit.types.ts` — AuditLog, SecurityLog, ApprovalConfig, ApprovalDelegation
- `src/types/index.ts` — barrel export

**Constants (3 files)**:
- `src/constants/permissionCatalog.ts` — PERMISSION_CATALOG (67 resources × 5 groups), PERMISSION_GROUPS, GROUP_COUNTS
- `src/constants/defaultRoles.ts` — DEFAULT_APP_ROLES (6), DEFAULT_INTERNAL_ROLES (6), lookup functions
- `src/constants/index.ts`

**Utils (2 files)**:
- `src/utils/permissionUtils.ts` — parsePermission, formatPermission, matchPermission (wildcard), hasPermission, hasPermissionString, expandRolePermissions, expandAppRole, expandInternalRole, getResourceActions, isValidPermission
- `src/utils/index.ts`

**Guards (2 files)**:
- `src/guards/requirePermission.ts` — AccessDeniedError, requireOrgMember, requirePermission, requireModuleAccess, checkApprovalLimit, checkBusinessPolicy, getDataScopeFilter
- `src/guards/index.ts`

**Hooks (3 files)**:
- `src/hooks/usePermission.ts` — usePermission, usePermissionString, useModuleAccess, usePermissionChecker
- `src/hooks/useCurrentUser.ts` — SessionContextReact, useSessionContext, useCurrentUser, useCurrentOrg
- `src/hooks/index.ts`

**Tests (3 files)**:
- `src/tests/permissionUtils.test.ts` — 50 tests (parse, format, match, has, expand, validate)
- `src/tests/guards.test.ts` — 18 tests (requireOrgMember, requirePermission, requireModuleAccess, approval, business policy, data scope)
- `src/tests/catalog.test.ts` — 17 tests (catalog integrity, role integrity, lookup)

**Main barrel**:
- `src/index.ts` — re-export all types, constants, utils, guards, hooks
