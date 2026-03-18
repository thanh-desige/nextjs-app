# ALUBOK Book — Cấu trúc thư mục

> Tham chiếu: `PERMISSION_CATALOG.md` (cùng thư mục)

---

## Tổng quan

```
book/
├── PERMISSION_CATALOG.md         ← Nguồn chuẩn phân quyền (43 resources, ~250 permissions)
├── PROJECT_ROADMAP.md            ← Thứ tự ưu tiên build (Đợt 1-4 + Song song)
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
├── BookKeToan/                   ← [SIDEBAR] Kế toán
│   └── ROADMAP.md
├── BookSanXuatThiCong/           ← [SIDEBAR] Sản xuất & Thi công
│   └── ROADMAP.md
└── ThietLap/                     ← [SETTINGS] Thiết lập hệ thống (chưa có trên sidebar)
    └── ROADMAP.md
```

> Mỗi module có `ROADMAP.md` riêng bên trong folder của mình.

---

## Chi tiết từng module

### 1. shared/ — Code dùng chung ✅ Phase F1 + T1

| Vai trò | Nội dung |
|---------|----------|
| Không hiển thị UI | Types: 8 files (permission, org, user, member, role, session, audit, time) |
| | Constants: `PERMISSION_CATALOG` (67 resources), `DEFAULT_APP_ROLES` (6), `DEFAULT_INTERNAL_ROLES` (6) |
| | Utils: `hasPermission()`, `matchPermission()`, `expandRole()`, `isValidPermission()` |
| | Guards: `requirePermission()`, `requireOrgMember()`, `requireModuleAccess()`, `checkBusinessPolicy()` |
| | Hooks: `usePermission()`, `useCurrentUser()`, `useCurrentOrg()`, `useModuleAccess()`, `useLogActivity()` |
| | Services: `timeService.ts` (11 functions), `activityLogStore.ts` (cross-cutting event log) |
| | UI: `DateRangeFilter`, `DateTimeDisplay`, `DueBadge`, `ActivityTimeline` |
| | Tests: 148 tests, 5 suites |

### 2. DanhMuc/ — Nhóm A: Danh muc (Master Data) ✅ Phase F2

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
| B19 | `accounting.voucher` | ✅ "Kế toán" (page 9) |
| B20 | `accounting.invoice` | |

> Chứng từ kế toán, hóa đơn. Reports: C10 (`report.accounting`).

### 10. BookSanXuatThiCong/ — Sản xuất & Thi công ✅ Phase SX

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| B21 | `production.project` | ✅ "Sản xuất" (page 10) |
| B22 | `production.order` | |
| B23 | `production.material_plan` | |
| B24 | `construction.installation` | |
| B25 | `construction.acceptance` | |
| C12 | `report.production` | |

> Lệnh sản xuất, kế hoạch vật tư, xuất dùng, thi công lắp đặt, nghiệm thu bàn giao, báo cáo.
> Dùng SubSidebar cấp 2 dọc (7 section) thay vì ModuleTabBar ngang.
> 19 source files, 2 test files (54 tests), Zustand + persist store.

### 11. ThietLap/ — Thiết lập hệ thống (**cấp Tenant**) ✅ Phase F3

| Catalog | Resources | Sidebar |
|---------|-----------|---------|
| D1 | `setting.user` | ✅ "Thiết lập" (page 8) |
| D2 | `setting.role` | |
| D3 | `setting.permission` | |
| D4 | `setting.org` | |
| D5 | `setting.branch` | |
| D6 | `setting.system` | |
| D7 | `setting.print_template` | |
| D8 | `setting.audit_log` | |

> Quản lý user, vai trò quyền hạn, tổ chức, cấu hình hệ thống **của tenant khách hàng**.
> IconThietLap (gear) trên Sidebar, page === 8.
> 15 source files, 3 test files (36 tests), Zustand + persist store.
>
> **⚠️ RANH GIỚI QUAN TRỌNG**: ThietLap chỉ gồm D1–D8 (8 tab).
> Backup (cũ D9), Integration (cũ D10), Subscription (cũ D11) đã chuyển sang **QuanTriAdmin** (Nhóm E).
> ThietLap có thể hiện tab "Gói dịch vụ hiện tại" dạng **read-only** (xem gói đang dùng).

---

## QuanTriAdmin (PlatformAdmin) — TÁCH BIỆT

> **Không nằm trong Book**. Route riêng: `/admin`. Code: `src/PlatformAdmin/`.
> Phục vụ **đội nội bộ ALUBOK** quản trị **toàn bộ SaaS platform**.
> Xem: `PERMISSION_CATALOG.md` Nhóm E (16 resources platform.*).

| Mục | Resources | Mô tả |
|-----|-----------|-------|
| Tenants | E1 `platform.tenant` | Quản lý tất cả org/tenant |
| Users (Global) | E2 `platform.user` | Quản lý tất cả user |
| Subscriptions & Billing | E3 `platform.subscription` | Gói, billing |
| Entitlements & Feature Flags | E4 `platform.entitlement` | Feature flags |
| Internal Admin Roles | E5 `platform.internal_role` | Vai trò nội bộ ALUBOK |
| Security Center | E6 `platform.security` | Audit toàn platform |
| Support Console | E7 `platform.support` | Hỗ trợ KH, impersonation |
| System Health | E8 `platform.health` | Monitoring |
| Jobs & Queue | E9 `platform.job` | Background tasks |
| Storage & Data Governance | E10 `platform.storage` | Dung lượng, retention |
| Backup & Restore | E11 `platform.backup` | Backup toàn platform |
| Integrations | E12 `platform.integration` | SSO, email, payment |
| Notifications | E13 `platform.notification` | Notification templates |
| Platform Analytics | E14 `platform.analytics` | KPI platform |
| Release & Config Control | E15 `platform.release` | Release mgmt |
| Platform Settings | E16 `platform.config` | Config, maintenance |

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
| shared | ✅ | ✅ | ✅ (20 files, 85 tests) |
| DanhMuc | ✅ | ✅ | ✅ (19 files, 37 tests) |
| BookTongQuan | ✅ | ✅ | ✅ (10 files, 30 tests) |
| BookThietKeBocTach | ✅ | ✅ | ✅ (~50+ files) |
| BookBanHang | ✅ | ✅ | ✅ (15 files, 26 tests) |
| BookMuaHang | ✅ | ❌ | ❌ |
| BookTonKho | ✅ | ❌ | ❌ |
| BookThuChi | ✅ | ❌ | ❌ |
| BookKeToan | ✅ | ❌ | ❌ |
| ThietLap | ✅ | ✅ | ✅ (15 files, 36 tests) |

---

## Navigation Architecture

**Pattern**: Persistent global sidebar (L1) + Contextual horizontal tabs (L2) + URL routing

```
┌─────────┬──────────────────────────────────────────────┐
│ SIDEBAR │  [Tab 1] [Tab 2] [Tab 3] ... ← ModuleTabBar │
│  (L1)   ├──────────────────────────────────────────────┤
│         │                                              │
│ Tổng    │  Content area                                │
│ quan    │                                              │
│ Mua     │                                              │
│ hàng    │                                              │
│ Bán     │                                              │
│ hàng    │                                              │
│ ...     │                                              │
└─────────┴──────────────────────────────────────────────┘
```

**URL Routing**: `window.history.pushState` + catch-all `[...slug]/page.tsx`

| URL | Module | Tab |
|-----|--------|-----|
| `/` | Landing | — |
| `/tong-quan` | BookTongQuan | — |
| `/ban-hang/bao-gia` | BookBanHang | Báo giá |
| `/ban-hang/don-ban-hang` | BookBanHang | Đơn bán hàng |
| `/danh-muc/khach-hang` | DanhMuc | Khách hàng |
| `/thiet-lap/nguoi-dung` | ThietLap | Người dùng |

**Source**: `book/navigation/` (routeConfig.ts, useRouteSync.ts, ModuleTabBar.tsx)

---

## Quy tắc

1. **Chỉ tạo `src/` khi bắt đầu code module đó** — không tạo trước
2. Mỗi module có `src/` sẽ follow cấu trúc tương tự BookThietKeBocTach: `domain/`, `ui/`, `types/`, `adapters/`...
3. Reports nằm trong module tương ứng, không tách riêng
4. `shared/` là foundation — build trước khi code các Book khác
5. Tất cả phân quyền phải tham chiếu `PERMISSION_CATALOG.md`
6. **Navigation**: Dùng horizontal tab bar (ModuleTabBar) — KHÔNG dùng sidebar cấp 2
7. **URL routing**: Mỗi tab phải có URL riêng, cấu hình trong `navigation/routeConfig.ts`
