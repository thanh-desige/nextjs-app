# ThietLap/ — ROADMAP

> Nhóm D: 11 resources — Quản trị user, role, permission, org
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ⬜ Chưa bắt đầu

## Ưu tiên: ⭐⭐⭐ Rất cao (build cùng đợt 1)

## Phụ thuộc: shared/, DanhMuc/

---

## Phạm vi

| Catalog | Resource | Mô tả |
|---------|----------|-------|
| D1 | `setting.user` | Quản lý người dùng (CRUD + assign role) |
| D2 | `setting.role` | Quản lý vai trò (CRUD + assign permissions) |
| D3 | `setting.permission` | Ma trận quyền (read-only catalog + toggle) |
| D4 | `setting.org` | Thông tin tổ chức |
| D5 | `setting.branch` | Chi nhánh / cơ sở |
| D6 | `setting.system` | Cấu hình hệ thống (format số, tiền tệ...) |
| D7 | `setting.print_template` | Mẫu in (báo giá, hóa đơn, phiếu xuất...) |
| D8 | `setting.audit_log` | Nhật ký thao tác (read-only) |
| D9 | `setting.backup` | Sao lưu / khôi phục |
| D10 | `setting.integration` | Kết nối bên ngoài (API, webhook) |
| D11 | `setting.subscription` | Gói dịch vụ / thanh toán |

---

## 3 màn hình ưu tiên (từ Deliverables)

1. **Quản lý người dùng** — Danh sách user, invite, assign role, deactivate
2. **Vai trò quyền hạn** — Danh sách roles, tạo mới, sửa, xóa
3. **Sửa vai trò / Ma trận quyền** — Group → Resource → Action columns → Toggle "Toàn quyền"

---

## Cấu trúc khi build

```
ThietLap/
└── src/
    ├── types/          ← setting.types.ts
    ├── ui/
    │   ├── UserManagement.tsx       ← Màn 1: Quản lý người dùng
    │   ├── RoleManagement.tsx       ← Màn 2: Vai trò quyền hạn
    │   ├── PermissionMatrix.tsx     ← Màn 3: Ma trận quyền (MISA style)
    │   ├── OrgSettings.tsx          ← Thông tin tổ chức
    │   ├── SystemSettings.tsx       ← Cấu hình hệ thống
    │   ├── AuditLog.tsx             ← Nhật ký
    │   └── PrintTemplates.tsx       ← Mẫu in
    ├── services/
    └── hooks/
```

---

## Checklist

- [ ] UI: Quản lý người dùng (list + invite + assign role)
- [ ] UI: Vai trò quyền hạn (list roles + CRUD)
- [ ] UI: Ma trận quyền (Group → Resource → Action → Toggle)
- [ ] Backend guard: `requirePermission("setting.user:manage")`
- [ ] Audit log: ghi lại mọi thao tác quan trọng
- [ ] Seed data: 6 default roles + ~250 permissions
- [ ] ⚠️ Thêm icon Settings vào Sidebar
