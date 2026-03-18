# ThietLap/ — ROADMAP

> Nhóm D: 8 resources — Quản trị user, role, permission, org (cấp Tenant)
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase F3 hoàn chỉnh

## Ưu tiên: ⭐⭐⭐ Rất cao (build cùng đợt 1)

## Phụ thuộc: shared/, DanhMuc/

## Tests: 36 tests, 3 suites ✅

---

## Phạm vi

| Catalog | Resource | Mô tả | Trạng thái |
|---------|----------|-------|-----------|
| D1 | `setting.user` | Quản lý người dùng (CRUD + assign role) | ✅ UserManagement.tsx |
| D2 | `setting.role` | Quản lý vai trò (CRUD + assign permissions) | ✅ RoleManagement.tsx |
| D3 | `setting.permission` | Ma trận quyền (read-only catalog + toggle) | ✅ PermissionMatrix.tsx |
| D4 | `setting.org` | Thông tin tổ chức | ✅ OrgSettings.tsx (section='org') |
| D5 | `setting.branch` | Chi nhánh / cơ sở | ✅ OrgSettings.tsx (section='branches') |
| D6 | `setting.system` | Cấu hình hệ thống (format số, tiền tệ...) | ✅ SystemSettings.tsx |
| D7 | `setting.print_template` | Mẫu in (báo giá, hóa đơn, phiếu xuất...) | 🟡 PlaceholderPage.tsx |
| D8 | `setting.audit_log` | Nhật ký thao tác (read-only) | ✅ AuditLog.tsx |

> D9-D11 (backup, integration, subscription) → thuộc QuanTriAdmin (app `/admin`), không nằm trong ThietLap.

---

## Cấu trúc

```
ThietLap/
├── ROADMAP.md
├── docs_history_commit.md
└── src/
    ├── index.ts                  ← barrel export
    ├── types/
    │   ├── setting.types.ts      ← ManagedUser, ManagedRole, labels, SystemSettings, AuditLogEntry
    │   └── index.ts
    ├── store/
    │   └── thietLapStore.ts      ← Zustand + persist, seed data (5 users, 6 roles, 2 branches)
    ├── ui/
    │   ├── ThietLapPage.tsx      ← Main page with level-2 sidebar (8 tabs, collapsible)
    │   ├── UserManagement.tsx    ← D1: User list + invite modal + deactivate
    │   ├── RoleManagement.tsx    ← D2: Role cards + CRUD modal (system/custom)
    │   ├── PermissionMatrix.tsx  ← D3: MISA-style permission grid (Group→Resource→Action)
    │   ├── OrgSettings.tsx       ← D4+D5: Org info + branches CRUD
    │   ├── SystemSettings.tsx    ← D6: Number/date/currency/timezone config
    │   ├── AuditLog.tsx          ← D8: Read-only audit log table
    │   └── PlaceholderPage.tsx   ← Generic "Sắp ra mắt" for D7
    └── tests/
        ├── thietLapStore.test.ts      ← 15 tests
        ├── settingTypes.test.ts       ← 8 tests
        └── permissionMatrix.test.ts   ← 13 tests
```

## Files: 15 source + 3 test = 18 files

---

## Checklist

- [x] UI: Quản lý người dùng (list + invite + assign role + deactivate)
- [x] UI: Vai trò quyền hạn (list roles + CRUD, system vs custom)
- [x] UI: Ma trận quyền (Group → Resource → Action → Toggle + Toàn quyền)
- [x] UI: Thông tin tổ chức + Chi nhánh (CRUD)
- [x] UI: Cấu hình hệ thống (draft + save pattern)
- [x] UI: Nhật ký thao tác (read-only table + search)
- [x] Seed data: 5 users, 6 default roles, 2 branches, audit logs
- [x] Zustand store + persist
- [x] Icon Settings trên Sidebar (page === 8)
- [x] Tests: 36 tests, 3 suites ✅
- [ ] Backend guard: `requirePermission("setting.user:manage")`
- [ ] UI: Print Templates (D7) — hiện là placeholder
