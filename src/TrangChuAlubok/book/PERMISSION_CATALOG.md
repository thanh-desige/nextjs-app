# ALUBOK Permission Catalog v1

## 1. Overview

ALUBOK uses RBAC + Permission Matrix model per company (orgId).

**Permission format:** `resource:action`

Examples:
- `design.project:read`
- `bom.report:generate`
- `quote:approve`
- `inventory.stock_issue:confirm`

**4 Permission Groups:**
1. A — Danh mục (Master Data)
2. B — Nghiệp vụ (Business Operations)
3. C — Báo cáo (Reports)
4. D — Tiện ích & thiết lập (Utilities & Settings)

---

## 2. Standard Actions

| Action | Description |
|--------|------------|
| `read` | Xem / sử dụng |
| `create` | Thêm mới |
| `update` | Sửa |
| `delete` | Xóa |
| `import` | Nhập dữ liệu |
| `export` | Xuất dữ liệu / PDF / Excel / PNG / DXF |
| `share` | Chia sẻ |
| `generate` | Sinh dữ liệu tự động (BOM, báo giá…) |
| `approve` | Duyệt |
| `reject` | Từ chối |
| `confirm` | Xác nhận nghiệp vụ |
| `close` | Khóa / hoàn tất |
| `cancel` | Hủy |
| `manage` | Quản trị cấu hình / toàn quyền trên resource đó |
| `assign` | Gán user / gán role / phân công |
| `restore` | Khôi phục |
| `archive` | Lưu trữ |

---

## 3. Permission Catalog

### A. DANH MỤC (Master Data)

| # | Resource | Actions |
|---|----------|---------|
| A1 | `master.customer` | read, create, update, delete, import, export |
| A2 | `master.supplier` | read, create, update, delete, import, export |
| A3 | `master.employee` | read, create, update, delete, import, export |
| A4 | `master.profile` | read, create, update, delete, import, export |
| A5 | `master.glass` | read, create, update, delete, import, export |
| A6 | `master.accessory` | read, create, update, delete, import, export |
| A7 | `master.material` | read, create, update, delete, import, export |
| A8 | `master.unit` | read, create, update, delete |
| A9 | `master.warehouse` | read, create, update, delete |
| A10 | `master.price_list` | read, create, update, delete, import, export |
| A11 | `master.tax_rate` | read, create, update, delete |
| A12 | `master.door_template` | read, create, update, delete, import, export, share |

### B. NGHIỆP VỤ (Business Operations)

| # | Resource | Actions |
|---|----------|---------|
| B1 | `design.project` | read, create, update, delete, export, share, archive, restore, manage |
| B2 | `design.canvas` | read, update, export, share |
| B3 | `design.library` | read, create, update, delete, share |
| B4 | `bom.report` | read, create, update, delete, generate, export, approve, reject, archive |
| B5 | `bom.cut_list` | read, generate, export |
| B6 | `quote` | read, create, update, delete, generate, export, share, approve, reject, close, cancel |
| B7 | `sales.order` | read, create, update, delete, approve, reject, close, cancel, export |
| B8 | `purchase.order` | read, create, update, delete, approve, reject, close, cancel, export |
| B9 | `purchase.request` | read, create, update, delete, approve, reject, close |
| B10 | `inventory.stock_receipt` | read, create, update, delete, confirm, cancel, export |
| B11 | `inventory.stock_issue` | read, create, update, delete, confirm, cancel, export |
| B12 | `inventory.stock_transfer` | read, create, update, delete, confirm, cancel, export |
| B13 | `inventory.stock_audit` | read, create, update, confirm, export |
| B14 | `inventory.balance` | read, export |
| B15 | `finance.receipt` | read, create, update, delete, confirm, cancel, export |
| B16 | `finance.payment` | read, create, update, delete, confirm, cancel, export |
| B17 | `finance.ar` | read, update, export, confirm |
| B18 | `finance.ap` | read, update, export, confirm |
| B19 | `accounting.voucher` | read, create, update, delete, approve, reject, close, export |
| B20 | `accounting.invoice` | read, create, update, delete, approve, cancel, export |

### C. BÁO CÁO (Reports)

| # | Resource | Actions |
|---|----------|---------|
| C1 | `report.dashboard_executive` | read, export |
| C2 | `report.design` | read, export |
| C3 | `report.bom` | read, export |
| C4 | `report.quote` | read, export |
| C5 | `report.sales` | read, export |
| C6 | `report.purchase` | read, export |
| C7 | `report.inventory` | read, export |
| C8 | `report.debt` | read, export |
| C9 | `report.cashflow` | read, export |
| C10 | `report.accounting` | read, export |
| C11 | `report.performance` | read, export |

### D. TIỆN ÍCH & THIẾT LẬP (Utilities & Settings)

| # | Resource | Actions |
|---|----------|---------|
| D1 | `setting.user` | read, create, update, delete, assign, manage |
| D2 | `setting.role` | read, create, update, delete, assign, manage |
| D3 | `setting.permission` | read, update, manage |
| D4 | `setting.org` | read, update, manage |
| D5 | `setting.branch` | read, create, update, delete, manage |
| D6 | `setting.system` | read, update, manage |
| D7 | `setting.print_template` | read, create, update, delete, manage |
| D8 | `setting.audit_log` | read, export |
| D9 | `setting.backup` | read, create, restore, manage |
| D10 | `setting.integration` | read, create, update, delete, manage |
| D11 | `setting.subscription` | read, update, manage |

---

## 4. Default Roles

### OWNER
- Toàn bộ permission

### ADMIN
- Gần như toàn bộ, trừ: chuyển chủ sở hữu tenant, xóa tenant, quản lý subscription cấp cao

### DESIGNER
- `design.project:*` trừ manage
- `design.canvas:*` trừ manage
- `design.library:read`
- `master.door_template:read`
- `bom.report:read, generate, export`
- `bom.cut_list:read, generate, export`
- `quote:read, generate`
- `report.design:read`
- `report.bom:read`

### ACCOUNTANT
- `quote:read, create, update, approve, export`
- `finance.receipt:*`
- `finance.payment:*`
- `finance.ar:*`
- `finance.ap:*`
- `accounting.voucher:*`
- `accounting.invoice:*`
- `report.quote:*`
- `report.debt:*`
- `report.cashflow:*`
- `report.accounting:*`

### WAREHOUSE
- `master.warehouse:read`
- `master.material:read`
- `master.profile:read`
- `master.glass:read`
- `master.accessory:read`
- `inventory.stock_receipt:*`
- `inventory.stock_issue:*`
- `inventory.stock_transfer:*`
- `inventory.stock_audit:*`
- `inventory.balance:*`
- `bom.report:read`
- `report.inventory:*`

### SALES
- `master.customer:*`
- `quote:*` (trừ delete nếu cần kiểm soát)
- `sales.order:*`
- `design.project:read, share`
- `bom.report:read`
- `report.sales:*`
- `report.quote:*`

---

## 5. Implementation Rules

1. Permission = fixed catalog in system, NOT hardcoded in UI
2. "Vai trò quyền hạn" UI renders from permission catalog (Group → Resource → Action columns → Toggle "Toàn quyền")
3. Backend MUST check permission, not just hide buttons
4. All business data MUST have orgId
5. Role tied to membership in orgId, NOT directly to global user
6. MVP: 1 user = 1 role, but schema MUST support N roles

---

## 6. DB Schema

```
org            → Tổ chức (tenant)
user           → Người dùng (email, tên, avatar)
org_member     → user thuộc org nào (user_id + org_id)
role           → Vai trò trong org (Giám đốc, Kế toán...)
permission     → Quyền đơn lẻ (design.project:read, ...)
role_permission → Ma trận: role nào có permission nào
member_role    → Member được gán role nào trong org
```

## 7. Deliverables

1. **Schema DB** — org, user, org_member, role, permission, role_permission, member_role
2. **Permission seed data** — seed toàn bộ catalog
3. **UI 3 màn** — Quản lý người dùng, Vai trò quyền hạn, Sửa vai trò/ma trận quyền
4. **Backend guard** — `requireOrgMember`, `requirePermission("quote:approve")`
