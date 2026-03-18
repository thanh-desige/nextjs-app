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

---

## Phase T1: Trục thời gian vận hành (Time System) — ✅ HOÀN TẤT

**Ngày**: Session hiện tại
**Kết quả**: +63 tests → 148 tests, 5 suites — all pass. Tổng hệ thống: 1336 tests, 43 suites.

### Files tạo mới (8 files):

**Types (1 file)**:
- `src/types/time.types.ts` — ISOTimestamp, ISODate, TimePreset (11), TimeRange, TimeRangeQuery, SemanticTime, DueStatus, DueInfo, AgingBucket, FiscalPeriod, FiscalYear, ActivityAction (8), ActivityEvent, ModuleKey, TIME_PRESET_LABELS, DUE_STATUS_COLORS, AGING_BUCKET_DEFS

**Services (2 files)**:
- `src/services/timeService.ts` — getNow, getToday, formatToLocalDate, resolvePreset (11 presets → UTC range), toSemanticTime, calcDueInfo, calcAgingBuckets, buildFiscalYear, isPeriodLocked, formatDate, formatDateTime, filterByTimeRange
- `src/services/activityLogStore.ts` — Zustand + persist, 10 seed events, genEventId, buildActivityEvent, addEvent, addEvents, getByModule, getRecent

**Hooks (1 file)**:
- `src/hooks/useLogActivity.ts` — useLogActivity (hook), logActivityDirect (direct function for store actions)

**UI Components (4 files)**:
- `src/ui/DateRangeFilter.tsx` — Preset dropdown + custom date inputs
- `src/ui/DateTimeDisplay.tsx` — Semantic relative time ("2 giờ trước") with tooltip
- `src/ui/DueBadge.tsx` — Color-coded due status badge (not_due/due_soon/due_today/overdue)
- `src/ui/ActivityTimeline.tsx` — Vertical timeline, module icons, action colors

**Tests (2 files)**:
- `src/tests/timeService.test.ts` — 37 tests (resolvePreset 11 presets, toSemanticTime, calcDueInfo, calcAgingBuckets, buildFiscalYear, isPeriodLocked, formatDate, formatDateTime, filterByTimeRange)
- `src/tests/activityLogStore.test.ts` — 26 tests (seed data, genEventId, buildActivityEvent, addEvent, addEvents, getByModule, getRecent, resetAll, logActivityDirect)

### Files chỉnh sửa:

**Module types patched (6 files)** — thêm time fields còn thiếu:
- `BookBanHang/src/types/banHang.types.ts` — Quote += cancelledAt; SalesOrder += completedAt, deliveredAt, cancelledAt
- `BookMuaHang/src/types/muaHang.types.ts` — PurchaseOrder += completedAt, receivedAt, cancelledAt
- `BookTonKho/src/types/tonKho.types.ts` — StockReceipt += receivedAt
- `BookThuChi/src/types/thuChi.types.ts` — AR += createdAt, updatedAt; AP += createdAt, updatedAt
- `BookKeToan/src/types/keToan.types.ts` — Voucher += postedAt; Invoice += paidAt
- `BookSanXuatThiCong/src/types/sanXuatThiCong.types.ts` — Project += cancelledAt

**Module stores integrated (6 files)** — thêm logActivityDirect vào mọi CRUD action:
- `BookBanHang/src/store/banHangStore.ts` — 6 actions (addQuote, updateQuote, deleteQuote, addOrder, updateOrder, deleteOrder)
- `BookMuaHang/src/store/muaHangStore.ts` — 6 actions (addRequest, updateRequest, deleteRequest, addOrder, updateOrder, deleteOrder)
- `BookTonKho/src/store/tonKhoStore.ts` — 9 actions (receipt/issue/transfer × add/update/delete)
- `BookThuChi/src/store/thuChiStore.ts` — 8 actions (receipt/payment × 3 + AR update + AP update)
- `BookKeToan/src/store/keToanStore.ts` — 6 actions (voucher/invoice × add/update/delete)
- `BookSanXuatThiCong/src/store/sanXuatThiCongStore.ts` — 18 actions (6 entity types × add/update/delete)

**Other**:
- `BookThuChi/src/store/thuChiStore.ts` — Added createdAt/updatedAt to 5 AR/AP seed records
- `src/index.ts` — Added all time/activity exports to barrel
