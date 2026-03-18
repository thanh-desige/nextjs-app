# 📋 ThietLap/ — Lịch sử hoàn thành

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Module: ThietLap/ — Quản trị user, role, permission (D1-D8)

---

## Phase F3: ThietLap/ — RBAC UI ✅

### F3.0: Types — setting.types.ts
- `ManagedUser`, `ManagedRole`, `InviteUserPayload`, `RolePayload`
- `PermissionMatrixRow`, `SystemSettings`, `AuditLogEntry`, `ThietLapTab`
- Constants: `PERMISSION_GROUP_LABELS` (A-D), `RESOURCE_LABELS` (51 entries), `ACTION_LABELS` (17 actions), `DEFAULT_SYSTEM_SETTINGS`
- Files: `types/setting.types.ts`, `types/index.ts`

### F3.1: Store — thietLapStore.ts
- Zustand + persist (key: `alubok-thiet-lap`)
- Seed data: 5 users (owner/admin/designer/sales/invited), 6 system roles, 1 org (professional plan), 2 branches (HCM + HN), 3 audit logs
- Setters: setUsers, setRoles, setOrg, setBranches, setSystemSettings, setAuditLogs, addAuditLog, resetAll

### F3.2: ThietLapPage.tsx — Level-2 sidebar
- 8 tabs grouped: Tài khoản, Phân quyền, Tổ chức, Hệ thống
- Collapsible sidebar, Catppuccin dark theme
- `renderContent(tab)` switch dispatches to child components

### F3.3: UserManagement.tsx (D1)
- User table: avatar, name, email, role badges, status badge, last login
- Search/filter by name/email
- InviteModal: email, displayName, platformRole, role checkboxes
- Deactivate/reactivate toggle

### F3.4: RoleManagement.tsx (D2)
- Role cards grid with system/custom badge
- RoleModal: create/edit (system roles: name locked)
- Permission count display, delete only for custom

### F3.5: PermissionMatrix.tsx (D3)
- MISA-style grid: Role selector → Group headers (A-D) → Resource rows → Action checkboxes
- "Toàn quyền" (Full Access) toggle per resource
- Permission expansion: `*:*`, `resource:*`, `prefix:*`, specific
- OWNER read-only warning, stats display

### F3.6: OrgSettings.tsx (D4+D5) + SystemSettings.tsx (D6)
- OrgInfoSection: editable orgName, read-only slug/plan/expiry/limits
- BranchesSection: branch cards, BranchModal create/edit/delete
- SystemSettings: draft→save pattern, 6 config fields

### F3.7: AuditLog.tsx (D8) + PlaceholderPage.tsx (D7)
- Read-only audit log table with search
- PlaceholderPage: generic "Sắp ra mắt" for Print Templates

### F3.8: Barrel export
- `index.ts`: exports all UI components, store, types

### F3.9: Integration
- App.tsx: `{page === 8 && <ThietLapPage />}` + overflow
- Sidebar.tsx: IconThietLap SVG + menu item id=8

### F3.10: Tests — 36 tests, 3 suites ✅
- `thietLapStore.test.ts` (15 tests): initial state, setters, resetAll, role permissions, user membership
- `settingTypes.test.ts` (8 tests): group/resource/action labels, default settings
- `permissionMatrix.test.ts` (13 tests): permission expansion logic + PERMISSION_CATALOG structure
