# shared/ — ROADMAP

> Foundation module: Types + RBAC + Guards dùng chung cho tất cả module
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ⬜ Chưa bắt đầu

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

- [ ] TypeScript interfaces cho 7 bảng DB
- [ ] Permission catalog typed constant (43 resources × actions)
- [ ] Default roles seed data (6 roles: OWNER, ADMIN, DESIGNER, ACCOUNTANT, WAREHOUSE, SALES)
- [ ] `hasPermission(userPerms, "quote:approve")` utility
- [ ] `usePermission("quote:approve")` hook
- [ ] Tests cho permission matching (wildcard `*`, exact match)

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
    ├── types/
    │   ├── org.types.ts          ← Org, OrgMember interfaces
    │   ├── user.types.ts         ← User interface
    │   ├── role.types.ts         ← Role, SystemRole enum (6 giá trị)
    │   └── permission.types.ts   ← Permission, PermissionAction, PermissionResource
    ├── constants/
    │   ├── permissionCatalog.ts  ← Typed const từ PERMISSION_CATALOG.md (43 resources)
    │   └── defaultRoles.ts      ← 6 default roles + permission sets
    ├── utils/
    │   └── permissionUtils.ts   ← hasPermission(), parsePermission(), matchWildcard()
    ├── guards/
    │   └── requirePermission.ts ← requirePermission(), requireOrgMember()
    └── hooks/
        ├── usePermission.ts     ← usePermission("quote:approve") → boolean
        └── useCurrentUser.ts    ← useCurrentUser() → { user, orgMember, roles, permissions }
```

**Checklist**:
- [ ] F1.1: `role.types.ts` — `SystemRole` enum: OWNER, ADMIN, DESIGNER, ACCOUNTANT, WAREHOUSE, SALES
- [ ] F1.2: `permission.types.ts` — `Permission` = `{ resource: string, action: string }`; format `"resource:action"`
- [ ] F1.3: `permissionCatalog.ts` — typed const cho 43 resources (A1-A12, B1-B20, C1-C11, D1-D11)
- [ ] F1.4: `defaultRoles.ts` — 6 default roles với permission sets
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
