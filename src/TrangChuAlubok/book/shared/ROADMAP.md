# shared/ — ROADMAP

> Foundation module: Types + RBAC + Guards dùng chung cho tất cả module
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase F1 + T1 hoàn tất (148 tests, 5 suites)

## Ưu tiên: ⭐⭐⭐ Rất cao (build đầu tiên)

## Phụ thuộc: Không — đây là foundation

---

## Phạm vi

| Deliverable | Mô tả |
|-------------|--------|
| `types/` | `org.types.ts`, `user.types.ts`, `permission.types.ts`, `role.types.ts` |
| `guards/` | `requirePermission()`, `requireOrgMember()`, `hasPermission()` |
| `hooks/` | `usePermission()`, `useCurrentOrg()`, `useCurrentUser()` |
| `constants/` | `PERMISSION_CATALOG` (typed const từ catalog), `DEFAULT_ROLES` |
| `utils/` | `permissionUtils.ts` (parsePermission, matchWildcard, expandRole) |

---

## Schema DB (TypeScript interfaces)

```
org            → { id, name, slug, plan, createdAt }
user           → { id, email, name, avatar, createdAt }
org_member     → { id, userId, orgId, status, joinedAt }
role           → { id, orgId, name, slug, isSystem, createdAt }
permission     → { id, resource, action, group, description }
role_permission → { roleId, permissionId }
member_role    → { memberId, roleId }
```

---

## Checklist

- [x] TypeScript interfaces cho 15+ bảng DB (7 type files, 55+ interfaces/types)
- [x] Permission catalog typed constant (67 resources × 17 actions, 5 groups A-E)
- [x] Default roles seed data (6 app roles + 6 internal admin roles)
- [x] `hasPermission(userPerms, "quote:approve")` utility + `matchPermission()` wildcard
- [x] `usePermission("quote:approve")` hook + `useCurrentUser()` + `useCurrentOrg()`
- [x] Guards: `requirePermission()`, `requireOrgMember()`, `requireModuleAccess()`
- [x] Business policy: `checkBusinessPolicy()`, `checkApprovalLimit()`, `getDataScopeFilter()`

---

## Phase T1: Trục thời gian vận hành (Time System) — ✅ HOÀN TẤT

**Kết quả**: 63 tests, 2 suites — all pass

### Deliverables

| Deliverable | Mô tả |
|-------------|--------|
| `types/time.types.ts` | ISOTimestamp, TimePreset (11), TimeRange, SemanticTime, DueInfo, AgingBucket, FiscalYear, ActivityEvent, ModuleKey |
| `services/timeService.ts` | getNow, resolvePreset, toSemanticTime, calcDueInfo, calcAgingBuckets, buildFiscalYear, isPeriodLocked, formatDate, formatDateTime, filterByTimeRange |
| `services/activityLogStore.ts` | Zustand + persist, 10 seed events, addEvent, getByModule, getRecent |
| `hooks/useLogActivity.ts` | useLogActivity (hook), logActivityDirect (store action helper) |
| `ui/DateRangeFilter.tsx` | Preset dropdown + custom date picker |
| `ui/DateTimeDisplay.tsx` | Semantic relative time display |
| `ui/DueBadge.tsx` | Color-coded due status badge |
| `ui/ActivityTimeline.tsx` | Vertical timeline visualization |

### Checklist

- [x] timeService.ts — 11 functions, backend-first
- [x] time.types.ts — all type definitions + constants
- [x] activityLogStore.ts — cross-cutting event log (10 seed events)
- [x] 4 UI components (DateRangeFilter, DateTimeDisplay, DueBadge, ActivityTimeline)
- [x] useLogActivity hook + logActivityDirect function
- [x] Integrated into 6 module stores (BanHang, MuaHang, TonKho, ThuChi, KeToan, SanXuatThiCong)
- [x] Patched module types: 12+ time fields added across 6 modules
- [x] 63 tests (timeService: 37, activityLogStore: 26) — all pass
- [x] Tests: 85 tests, 3 suites (permissionUtils, guards, catalog integrity)

---

## Xung đột cần giải quyết

| # | File | Vấn đề | Mức độ |
|---|------|--------|--------|
| X1 | `BookThietKeBocTach/.../Project.types.ts` → `TeamRole` | 6 roles cũ (MANAGER, INSTALLER, VIEWER) ≠ catalog (ADMIN, ACCOUNTANT, WAREHOUSE) | 🔴 HIGH |
| X2 | `BookThietKeBocTach/.../Project.types.ts` → `ProjectPermission` | Flat enum (VIEW, EDIT, DELETE...) ≠ catalog format `resource:action` | 🔴 HIGH |
| X3 | `BookThietKeBocTach/.../ProjectService.ts` → `checkPermission()` | Dùng ProjectPermission enum cũ | 🔴 HIGH |
| X4 | `BookThietKeBocTach/ROADMAP.md` Phase 6.1 | Schema `User(id,email,name,role,company)` — thiếu 5 bảng | 🟡 MEDIUM |
| X5 | `BookThietKeBocTach/ROADMAP.md` Phase 6.2 | 4 roles (owner, sales, accounting, worker) — sai tên, thiếu 2 | 🟡 MEDIUM |
| X6 | `alubok-motahethong.md` | 4 roles cũ (Chủ xưởng, Sale, Kế toán, Thợ) — chưa ghi superseded | 🟢 LOW |
| X7 | `Sidebar.tsx` | Thiếu BookKeToan + ThietLap trên sidebar | 🟢 LOW |

---

## 🔧 ROADMAP SỬA XUNG ĐỘT

> Thứ tự: Build foundation trước → Migrate code → Cập nhật docs
> Nguyên tắc: Không break existing tests (875/875 phải giữ nguyên)

### Phase F1: Tạo shared/ foundation (X1, X2 prerequisites)

**Mục tiêu**: Tạo source of truth cho roles + permissions trong shared/

```
shared/
└── src/
    ├── index.ts                  ← Main barrel export
    ├── types/
    │   ├── index.ts              ← Types barrel
    │   ├── permission.types.ts   ← 67 PermissionResource, 17 PermissionAction, PermissionString
    │   ├── org.types.ts          ← Org, OrgBranch, PlatformPolicy
    │   ├── user.types.ts         ← User
    │   ├── member.types.ts       ← OrgMember, UserEntitlement, MemberRole
    │   ├── role.types.ts         ← AppRole, SystemRoleName, PlatformAdminRole
    │   ├── session.types.ts      ← SessionContext, ModuleKey, DataScopeEntry
    │   └── audit.types.ts        ← AuditLog, SecurityLog, ApprovalConfig, ApprovalDelegation
    ├── constants/
    │   ├── index.ts
    │   ├── permissionCatalog.ts  ← 67 resources × actions (5 groups A-E)
    │   └── defaultRoles.ts      ← 6 app roles + 6 internal admin roles
    ├── utils/
    │   ├── index.ts
    │   └── permissionUtils.ts   ← hasPermission, matchPermission, expandRole, validate
    ├── guards/
    │   ├── index.ts
    │   └── requirePermission.ts ← requirePermission, requireModuleAccess, checkBusinessPolicy
    ├── hooks/
    │   ├── index.ts
    │   ├── usePermission.ts     ← usePermission("quote", "approve") → boolean
    │   └── useCurrentUser.ts    ← useSessionContext, useCurrentUser, useCurrentOrg
    └── tests/
        ├── permissionUtils.test.ts  ← 50 tests
        ├── guards.test.ts           ← 18 tests
        └── catalog.test.ts          ← 17 tests
```

**Checklist**:
- [x] F1.1: 7 type files — permission, org, user, member, role, session, audit (55+ interfaces/types)
- [x] F1.2: `permissionCatalog.ts` — typed const cho 67 resources (A1-A12, B1-B20, C1-C11, D1-D8, E1-E16)
- [x] F1.3: `defaultRoles.ts` — 6 app roles + 6 internal admin roles với permission sets
- [x] F1.4: `permissionUtils.ts` — parse, match, has, expand, validate
- [x] F1.5: `requirePermission.ts` — guards + business policy checks
- [x] F1.6: `usePermission.ts` + `useCurrentUser.ts` — React hooks
- [x] F1.7: `index.ts` barrel exports (types, constants, utils, guards, hooks)
- [x] F1.8: 85 tests, 3 suites — all pass
- [ ] F1.5: `permissionUtils.ts` — `hasPermission(userPerms, "quote:approve")`, `matchWildcard("design.project:*")`
- [ ] F1.6: Tests cho permissionUtils (exact match, wildcard, multi-permission)

**Giải quyết**: Tạo ra SystemRole + Permission format mới. Code cũ chưa bị ảnh hưởng.

---

### Phase F2: Migrate Project.types.ts (X1, X2)

**Mục tiêu**: Chuyển TeamRole + ProjectPermission sang dùng shared/ types

**Thay đổi**:
```typescript
// TRƯỚC (sai)
import { TeamRole, ProjectPermission } from "./Project.types";
member.role === TeamRole.DESIGNER
member.permissions.includes(ProjectPermission.EDIT)

// SAU (đúng)
import { SystemRole } from "@shared/types/role.types";
import { hasPermission } from "@shared/utils/permissionUtils";
member.role === SystemRole.DESIGNER
hasPermission(member.permissions, "design.project:update")
```

**Checklist**:
- [ ] F2.1: `TeamRole` enum → import `SystemRole` từ shared/ (6 values: OWNER, ADMIN, DESIGNER, ACCOUNTANT, WAREHOUSE, SALES)
- [ ] F2.2: `ProjectPermission` enum → xóa, thay bằng `string` format `"resource:action"`
- [ ] F2.3: `TeamMember.permissions` → `string[]` (VD: `["design.project:read", "design.canvas:update"]`)
- [ ] F2.4: `TeamMember.role` → `SystemRole`
- [ ] F2.5: Backward compat: export `TeamRole` as deprecated alias → `SystemRole`
- [ ] F2.6: Tests vẫn pass (875/875)

---

### Phase F3: Migrate ProjectService.ts (X3)

**Mục tiêu**: `checkPermission()` dùng `hasPermission()` từ shared/

**Thay đổi**:
```typescript
// TRƯỚC (sai)
private checkPermission(project: Project, permission: ProjectPermission): boolean {
  const member = project.team.find((m) => m.userId === this.userId);
  if (!member) return false;
  return member.permissions.includes(permission);
}

// SAU (đúng)
private checkPermission(project: Project, permission: string): boolean {
  const member = project.team.find((m) => m.userId === this.userId);
  if (!member) return false;
  return hasPermission(member.permissions, permission);
}
```

**Checklist**:
- [ ] F3.1: Import `hasPermission` từ shared/
- [ ] F3.2: `checkPermission()` parameter → `string` (format `"resource:action"`)
- [ ] F3.3: Tất cả call sites dùng `"design.project:update"` format thay `ProjectPermission.EDIT`
- [ ] F3.4: Tests vẫn pass (875/875)

---

### Phase F4: Cập nhật ROADMAP.md Phase 6 (X4, X5)

**Mục tiêu**: Schema + roles trong ROADMAP.md đúng với catalog

**Checklist**:
- [ ] F4.1: Phase 6.1 schema → cập nhật sang 7-table: org, user, org_member, role, permission, role_permission, member_role
- [ ] F4.2: Phase 6.2 roles → 6 roles: OWNER, ADMIN, DESIGNER, ACCOUNTANT, WAREHOUSE, SALES
- [ ] F4.3: Xóa "worker" / "accounting" → đúng tên catalog

---

### Phase F5: Cập nhật docs (X6)

**Mục tiêu**: Docs cũ ghi rõ đã được superseded

**Checklist**:
- [ ] F5.1: `alubok-motahethong.md` → thêm note: "⚠️ Phân quyền đã được cập nhật chi tiết tại `src/TrangChuAlubok/book/PERMISSION_CATALOG.md` (6 roles, 43 resources)"

---

### Phase F6: Sidebar thêm module (X7) — khi build module

**Mục tiêu**: Thêm BookKeToan + ThietLap vào Sidebar

**Checklist**:
- [ ] F6.1: Thêm item "Kế toán" với icon vào Sidebar.tsx (khi build BookKeToan)
- [ ] F6.2: Thêm icon Settings vào Sidebar.tsx (khi build ThietLap)

> ⚠️ Phase F6 thực hiện **khi build module tương ứng**, không fix ngay.

---

### Thứ tự thực hiện

```
F1 (shared/ foundation)     ← build trước, không break gì
  ↓
F2 (migrate Project.types)  ← phụ thuộc F1
  ↓
F3 (migrate ProjectService) ← phụ thuộc F2
  ↓
F4 (fix ROADMAP.md)         ← docs, song song với F2/F3
F5 (fix alubok-motahethong) ← docs, song song
  ↓
F6 (Sidebar)                ← khi build BookKeToan/ThietLap
```

### Ước lượng tests mới

| Phase | Tests mới | Tổng dự kiến |
|-------|----------|-------------|
| F1 | ~15-20 (permission matching, wildcard, roles) | 890-895 |
| F2 | ~5 (backward compat, type migration) | 895-900 |
| F3 | ~3 (checkPermission format) | 898-903 |
| F4-F6 | 0 (docs + UI) | — |
