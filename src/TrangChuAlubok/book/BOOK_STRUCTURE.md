# ALUBOK Book — Cấu trúc thư mục

> Tham chiếu: `PERMISSION_CATALOG.md` (cùng thư mục)

---

## Tổng quan

```
book/
├── PERMISSION_CATALOG.md         ← Nguồn chuẩn phân quyền (43 resources, ~250 permissions)
├── BOOK_STRUCTURE.md             ← File này
│
├── shared/                       ← [INTERNAL] Types + RBAC guards dùng chung
│   └── ROADMAP.md
├── DanhMuc/                      ← [INTERNAL] Nhóm A — Master Data
│   └── ROADMAP.md
│
├── BookTongQuan/                 ← [SIDEBAR] Tổng quan (Dashboard)
│   └── ROADMAP.md
├── BookThietKeBocTach/           ← [SIDEBAR] Thiết kế & bóc tách
│   └── ROADMAP.md
├── BookBanHang/                  ← [SIDEBAR] Bán hàng
│   └── ROADMAP.md
├── BookMuaHang/                  ← [SIDEBAR] Mua hàng
│   └── ROADMAP.md
├── BookTonKho/                   ← [SIDEBAR] Tồn kho
│   └── ROADMAP.md
├── BookThuChi/                   ← [SIDEBAR] Thu - chi
│   └── ROADMAP.md
├── BookKeToan/                   ← [SIDEBAR] Kế toán (chưa có trên sidebar)
│   └── ROADMAP.md
└── ThietLap/                     ← [SETTINGS] Thiết lập hệ thống (chưa có trên sidebar)
    └── ROADMAP.md
```

> Mỗi module có `ROADMAP.md` riêng bên trong folder của mình.

---

## Chi tiết từng module

### 1. shared/ — Code dùng chung

| Vai trò | Nội dung |
|---------|----------|
| Không hiển thị UI | Types: org, user, permission, role |
| | Guards: `requirePermission()`, `requireOrgMember()` |
| | Hooks: `usePermission()`, `useCurrentOrg()` |

### 2. DanhMuc/ — Nhóm A: Danh muc (Master Data)

| Catalog | Resources |
|---------|-----------|
| A1-A7 | `master.customer`, `master.supplier`, `master.employee`, `master.profile`, `master.glass`, `master.accessory`, `master.material` |
| A8-A9 | `master.unit`, `master.warehouse` |
| A10-A11 | `master.price_list`, `master.tax_rate` |
| A12 | `master.door_template` |

> Danh mục được truy cập từ bên trong các Book khác (VD: chọn khách hàng khi tạo báo giá). Có thể hiển thị riêng trong ThietLap hoặc từng Book tương ứng.

### 3. BookTongQuan/ — Dashboard

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| C1 | `report.dashboard_executive` | ✅ "Tổng quan" |

> Đọc data tổng hợp từ các module khác. Chủ yếu charts + widgets.

### 4. BookThietKeBocTach/ — Thiết kế & Bóc tách

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| B1 | `design.project` | ✅ "Thiết kế & bóc tách" |
| B2 | `design.canvas` | |
| B3 | `design.library` | |
| B4 | `bom.report` | |
| B5 | `bom.cut_list` | |

> Module phức tạp nhất. Đã có `src/` hoàn chỉnh (CAD engine, entities, export, BOM...).

### 5. BookBanHang/ — Bán hàng

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| B6 | `quote` | ✅ "Bán hàng" |
| B7 | `sales.order` | |

> Báo giá, đơn bán hàng. Reports: C4 (`report.quote`), C5 (`report.sales`).

### 6. BookMuaHang/ — Mua hàng

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| B8 | `purchase.order` | ✅ "Mua hàng" |
| B9 | `purchase.request` | |

> Đơn mua hàng, yêu cầu mua hàng. Reports: C6 (`report.purchase`).

### 7. BookTonKho/ — Tồn kho

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| B10 | `inventory.stock_receipt` | ✅ "Tồn kho" |
| B11 | `inventory.stock_issue` | |
| B12 | `inventory.stock_transfer` | |
| B13 | `inventory.stock_audit` | |
| B14 | `inventory.balance` | |

> Nhập/xuất/chuyển kho, kiểm kê, tồn kho. Reports: C7 (`report.inventory`).

### 8. BookThuChi/ — Thu chi

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| B15 | `finance.receipt` | ✅ "Thu - chi" |
| B16 | `finance.payment` | |
| B17 | `finance.ar` (công nợ phải thu) | |
| B18 | `finance.ap` (công nợ phải trả) | |

> Phiếu thu, phiếu chi, công nợ. Reports: C8 (`report.debt`), C9 (`report.cashflow`).

### 9. BookKeToan/ — Kế toán

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| B19 | `accounting.voucher` | ⚠️ Chưa có trên sidebar |
| B20 | `accounting.invoice` | |

> Chứng từ kế toán, hóa đơn. Reports: C10 (`report.accounting`).

### 10. ThietLap/ — Thiết lập hệ thống

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| D1 | `setting.user` | ⚠️ Chưa có trên sidebar |
| D2 | `setting.role` | |
| D3 | `setting.permission` | |
| D4 | `setting.org` | |
| D5 | `setting.branch` | |
| D6 | `setting.system` | |
| D7 | `setting.print_template` | |
| D8 | `setting.audit_log` | |
| D9 | `setting.backup` | |
| D10 | `setting.integration` | |
| D11 | `setting.subscription` | |

> Quản lý user, vai trò quyền hạn, tổ chức, cấu hình hệ thống. Có thể hiển thị bằng icon Settings riêng (kiểu MISA).

---

## Reports nằm ở đâu?

Reports (nhóm C) **không tách module riêng**, mà nằm trong module tương ứng:

| Report | Catalog | Thuộc module |
|--------|---------|-------------|
| Dashboard tổng hợp | C1 | BookTongQuan |
| Báo cáo thiết kế | C2 | BookThietKeBocTach |
| Báo cáo bóc tách | C3 | BookThietKeBocTach |
| Báo cáo báo giá | C4 | BookBanHang |
| Báo cáo bán hàng | C5 | BookBanHang |
| Báo cáo mua hàng | C6 | BookMuaHang |
| Báo cáo tồn kho | C7 | BookTonKho |
| Báo cáo công nợ | C8 | BookThuChi |
| Báo cáo dòng tiền | C9 | BookThuChi |
| Báo cáo kế toán | C10 | BookKeToan |
| Báo cáo hiệu suất | C11 | BookTongQuan |

---

## Trạng thái hiện tại

| Module | Folder | Có src/? | Có code? |
|--------|--------|----------|----------|
| shared | ✅ | ❌ | ❌ |
| DanhMuc | ✅ | ❌ | ❌ |
| BookTongQuan | ✅ | ❌ | ❌ |
| BookThietKeBocTach | ✅ | ✅ | ✅ (~50+ files) |
| BookBanHang | ✅ | ❌ | ❌ |
| BookMuaHang | ✅ | ❌ | ❌ |
| BookTonKho | ✅ | ❌ | ❌ |
| BookThuChi | ✅ | ❌ | ❌ |
| BookKeToan | ✅ | ❌ | ❌ |
| ThietLap | ✅ | ❌ | ❌ |

---

## Quy tắc

1. **Chỉ tạo `src/` khi bắt đầu code module đó** — không tạo trước
2. Mỗi module có `src/` sẽ follow cấu trúc tương tự BookThietKeBocTach: `domain/`, `ui/`, `types/`, `adapters/`...
3. Reports nằm trong module tương ứng, không tách riêng
4. `shared/` là foundation — build trước khi code các Book khác
5. Tất cả phân quyền phải tham chiếu `PERMISSION_CATALOG.md`
