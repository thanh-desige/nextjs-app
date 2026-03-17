# ALUBOK — Module → Tab → Page Map (Tổng hợp)

> Bản đồ toàn bộ 10 module: số lượng tab, page, phân biệt tab chính / phụ / link.
> Cập nhật: **10/03/2026**
> Tham chiếu: [PERMISSION_CATALOG.md](PERMISSION_CATALOG.md) · [BOOK_STRUCTURE.md](BOOK_STRUCTURE.md) · [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md)

---

## Quy ước ký hiệu

| Ký hiệu | Nghĩa |
|---------|-------|
| 🟢 Tab chính | Tab mặc định khi mở module, nghiệp vụ cốt lõi |
| 🔵 Tab phụ | Tab nghiệp vụ bổ sung, không phải mặc định |
| 📊 Tab báo cáo | Tab chỉ đọc — biểu đồ, bảng tổng hợp |
| 🔗 Link page | Không phải tab — mở trang riêng (full-page, modal, canvas) |
| ⚙️ Tab thiết lập | Tab cấu hình / quản trị |

---

## Bảng tổng hợp 10 module

| # | Module | Sidebar | Tabs | Pages | Tab chính | Tab phụ | Tab BC | Link page |
|---|--------|---------|------|-------|-----------|---------|--------|-----------|
| 1 | shared/ | ❌ Ẩn | 0 | 0 | — | — | — | — |
| 2 | DanhMuc/ | ❌ Ẩn (truy cập qua ThietLap + inline) | 6 nhóm (12 resources) | 36 | 1 | 5 | 0 | 12 (form/detail) |
| 3 | BookTongQuan/ | ✅ "Tổng quan" | 3 | 3 | 1 | 2 | 0 | 0 |
| 4 | BookThietKeBocTach/ | ✅ "Thiết kế & bóc tách" | 4 | 6 | 1 | 3 | 0 | 2 (canvas, BOM detail) |
| 5 | BookBanHang/ | ✅ "Bán hàng" | 4 | 10 | 1 | 1 | 2 | 4 (form, detail) |
| 6 | BookMuaHang/ | ✅ "Mua hàng" | 4 | 9 | 1 | 1 | 1 | 3 (form, detail) |
| 7 | BookTonKho/ | ✅ "Tồn kho" | 6 | 13 | 1 | 4 | 1 | 5 (form, detail) |
| 8 | BookThuChi/ | ✅ "Thu - chi" | 6 | 12 | 1 | 3 | 2 | 4 (form, detail) |
| 9 | BookKeToan/ | ⚠️ Chưa có (cần thêm) | 4 | 8 | 1 | 2 | 1 | 3 (form, detail) |
| 10 | ThietLap/ | ⚠️ Chưa có (icon Settings) | 8 | 12 | 1 | 7 | 0 | 4 (form, matrix) |
| | **TỔNG (Book)** | **6 hiện tại + 2 cần thêm** | **~45** | **~109** | **9** | **28** | **7** | **37** |

### QuanTriAdmin (tách biệt — KHÔNG phải module trong Book)

| # | App | Route | Tabs | Pages | Mô tả |
|---|-----|-------|------|-------|-------|
| ⚡ | QuanTriAdmin (PlatformAdmin) | `/admin` | 16 | 16 | Platform admin — chỉ ALUBOK internal |

> **QuanTriAdmin khác hoàn toàn ThietLap**: Khác cấp độ, khác người dùng, khác phạm vi dữ liệu, khác quyền hạn.
> - ThietLap (D1–D8): khách hàng doanh nghiệp quản trị **tenant của họ**
> - QuanTriAdmin (E1–E16): đội nội bộ ALUBOK quản trị **toàn bộ platform**

---

## Sidebar hiện tại vs. kế hoạch

### Hiện tại (6 mục):

```
1. Tổng quan        → BookTongQuan
2. Mua hàng         → BookMuaHang
3. Bán hàng         → BookBanHang
4. Thiết kế & bóc tách → BookThietKeBocTach
5. Thu - chi         → BookThuChi
6. Tồn kho          → BookTonKho
```

### Kế hoạch (8 mục + Settings):

```
1. Tổng quan              → BookTongQuan
2. Thiết kế & bóc tách    → BookThietKeBocTach    (đổi vị trí lên)
3. Bán hàng               → BookBanHang
4. Mua hàng               → BookMuaHang
5. Tồn kho                → BookTonKho
6. Thu - chi               → BookThuChi
7. Kế toán                → BookKeToan             ← MỚI
8. Danh mục               → DanhMuc                ← MỚI (hoặc nhúng trong ThietLap)
──────────────────
⚙️ Thiết lập (icon gear)  → ThietLap               ← MỚI (footer sidebar)
```

> **Lưu ý**: Thứ tự sidebar nên theo luồng kinh doanh: Thiết kế → Bán → Mua → Kho → Thu chi → Kế toán.

---

## Tab map từng module (tóm tắt)

### Module 1: shared/ — Không có UI

Không tab, không page. Code internal: types, guards, hooks, utils.

---

### Module 2: DanhMuc/ — Master Data

| # | Tab | Loại | Resources | Pages |
|---|-----|------|-----------|-------|
| 1 | 🟢 Đối tác | Nhóm chính | A1 Khách hàng, A2 Nhà cung cấp | List × 2, Form × 2, Detail × 2 |
| 2 | 🔵 Nhân sự | Nhóm phụ | A3 Nhân viên | List, Form, Detail |
| 3 | 🔵 Vật tư | Nhóm phụ | A4 Thanh nhôm, A5 Kính, A6 Phụ kiện, A7 Vật tư chung | List × 4, Form × 4, Detail × 4 |
| 4 | 🔵 Kho & Đơn vị | Nhóm phụ | A8 Đơn vị tính, A9 Kho | List × 2, Form × 2 |
| 5 | 🔵 Giá & Thuế | Nhóm phụ | A10 Bảng giá, A11 Thuế suất | List × 2, Form/Detail × 2 |
| 6 | 🔵 Mẫu cửa | Nhóm phụ | A12 Mẫu cửa | List, Form, Detail |

---

### Module 3: BookTongQuan/ — Dashboard

| # | Tab | Loại | Pages |
|---|-----|------|-------|
| 1 | 🟢 Tổng quan | Chính | Dashboard (widgets, KPI, charts) |
| 2 | 🔵 Đơn hàng | Phụ | Order flow: Báo giá → Đơn hàng → Giao → Thu |
| 3 | 🔵 Thông báo | Phụ | Danh sách cảnh báo + thông báo |

---

### Module 4: BookThietKeBocTach/ — CAD + BOM

| # | Tab | Loại | Pages |
|---|-----|------|-------|
| 1 | 🟢 Dự án | Chính | List page: danh sách dự án thiết kế |
| 2 | 🔗 Canvas | Link page | CAD editor full-screen (mở khi click dự án) |
| 3 | 🔵 BOM | Phụ | BOM report list + detail |
| 4 | 🔵 Danh sách cắt | Phụ | Cut list (view/export) |
| 5 | 🔵 Thư viện | Phụ | Thư viện mẫu cửa / thư viện block |
| — | 🔗 Export dialog | Link (modal) | Chọn format: JSON/DXF/SVG/PNG/PDF |

---

### Module 5: BookBanHang/ — Bán hàng

| # | Tab | Loại | Resources | Pages |
|---|-----|------|-----------|-------|
| 1 | 🟢 Báo giá | Chính | B6 `quote` | List, Form, Detail |
| 2 | 🔵 Đơn bán hàng | Phụ | B7 `sales.order` | List, Form, Detail |
| 3 | 📊 BC Báo giá | Báo cáo | C4 `report.quote` | Report page |
| 4 | 📊 BC Bán hàng | Báo cáo | C5 `report.sales` | Report page |

---

### Module 6: BookMuaHang/ — Mua hàng

| # | Tab | Loại | Resources | Pages |
|---|-----|------|-----------|-------|
| 1 | 🟢 Đơn mua hàng | Chính | B8 `purchase.order` | List, Form, Detail |
| 2 | 🔵 Yêu cầu mua hàng | Phụ | B9 `purchase.request` | List, Form, Detail |
| 3 | 📊 BC Mua hàng | Báo cáo | C6 `report.purchase` | Report page |
| 4 | 🔗 Shop ALUBOK | Link page | — | MuaHangPage (B2C catalog) |

---

### Module 7: BookTonKho/ — Tồn kho

| # | Tab | Loại | Resources | Pages |
|---|-----|------|-----------|-------|
| 1 | 🟢 Phiếu nhập kho | Chính | B10 `inventory.stock_receipt` | List, Form, Detail |
| 2 | 🔵 Phiếu xuất kho | Phụ | B11 `inventory.stock_issue` | List, Form, Detail |
| 3 | 🔵 Phiếu chuyển kho | Phụ | B12 `inventory.stock_transfer` | List, Form |
| 4 | 🔵 Kiểm kê | Phụ | B13 `inventory.stock_audit` | List, Form |
| 5 | 🔵 Tồn kho | Phụ (read-only) | B14 `inventory.balance` | Balance view |
| 6 | 📊 BC Tồn kho | Báo cáo | C7 `report.inventory` | Report page |

---

### Module 8: BookThuChi/ — Thu chi

| # | Tab | Loại | Resources | Pages |
|---|-----|------|-----------|-------|
| 1 | 🟢 Phiếu thu | Chính | B15 `finance.receipt` | List, Form, Detail |
| 2 | 🔵 Phiếu chi | Phụ | B16 `finance.payment` | List, Form, Detail |
| 3 | 🔵 Công nợ phải thu | Phụ | B17 `finance.ar` | List, Detail |
| 4 | 🔵 Công nợ phải trả | Phụ | B18 `finance.ap` | List, Detail |
| 5 | 📊 BC Công nợ | Báo cáo | C8 `report.debt` | Report page |
| 6 | 📊 BC Dòng tiền | Báo cáo | C9 `report.cashflow` | Report page |

---

### Module 9: BookKeToan/ — Kế toán

| # | Tab | Loại | Resources | Pages |
|---|-----|------|-----------|-------|
| 1 | 🟢 Chứng từ kế toán | Chính | B19 `accounting.voucher` | List, Form, Detail |
| 2 | 🔵 Hóa đơn | Phụ | B20 `accounting.invoice` | List, Form, Detail |
| 3 | 🔵 Sổ kế toán | Phụ | — | Sổ cái + Sổ nhật ký (2 sub-views) |
| 4 | 📊 BC Kế toán | Báo cáo | C10 `report.accounting` | Report page |

---

### Module 10: ThietLap/ — Thiết lập hệ thống (**cấp Tenant**)

| # | Tab | Loại | Resources | Pages |
|---|-----|------|-----------|-------|
| 1 | 🟢 Người dùng | Chính | D1 `setting.user` | List, Invite form |
| 2 | ⚙️ Vai trò quyền hạn | Thiết lập | D2 `setting.role` | List, Form |
| 3 | ⚙️ Ma trận quyền | Thiết lập | D3 `setting.permission` | Permission matrix page |
| 4 | ⚙️ Tổ chức | Thiết lập | D4 `setting.org` | Org info form |
| 5 | ⚙️ Chi nhánh | Thiết lập | D5 `setting.branch` | List, Form |
| 6 | ⚙️ Hệ thống | Thiết lập | D6 `setting.system` | Config form |
| 7 | ⚙️ Mẫu in | Thiết lập | D7 `setting.print_template` | List, Editor |
| 8 | ⚙️ Nhật ký thao tác | Thiết lập | D8 `setting.audit_log` | Log list (read-only) |

> **Thay đổi**: Tabs 9-11 (Sao lưu, Kết nối, Gói dịch vụ) đã chuyển sang QuanTriAdmin (Nhóm E).
> ThietLap có thể hiện "Gói dịch vụ hiện tại" dạng **read-only** (xem gói đang dùng, không quản lý).

---

### QuanTriAdmin — Quản trị nền tảng (Route: `/admin`)

> **KHÔNG phải module trong Book**. Tách biệt hoàn toàn. Code: `src/PlatformAdmin/`.
> Chỉ đội nội bộ ALUBOK mới truy cập. Yêu cầu: SuperAdmin + MFA + IP whitelist.

| # | Section | Menu item | Resources |
|---|---------|-----------|-----------|
| 1 | Tenant & Users | Tenants | E1 `platform.tenant` |
| 2 | | Users (Global) | E2 `platform.user` |
| 3 | | Subscriptions & Billing | E3 `platform.subscription` |
| 4 | | Entitlements & Feature Flags | E4 `platform.entitlement` |
| 5 | Access & Security | Internal Admin Roles | E5 `platform.internal_role` |
| 6 | | Security Center | E6 `platform.security` |
| 7 | Operations | Support Console | E7 `platform.support` |
| 8 | | System Health | E8 `platform.health` |
| 9 | | Jobs & Queue | E9 `platform.job` |
| 10 | | Storage & Data Governance | E10 `platform.storage` |
| 11 | | Backup & Restore | E11 `platform.backup` |
| 12 | Platform Config | Integrations | E12 `platform.integration` |
| 13 | | Notifications | E13 `platform.notification` |
| 14 | | Platform Analytics | E14 `platform.analytics` |
| 15 | | Release & Config Control | E15 `platform.release` |
| 16 | | Platform Settings | E16 `platform.config` |

---

## Thống kê page types

| Loại page | Số lượng | Mô tả |
|-----------|---------|-------|
| List | ~30 | DataTable với filter/sort/pagination |
| Form | ~25 | Create/Edit form |
| Detail | ~22 | View chi tiết 1 record |
| Report | 7 | Biểu đồ + bảng tổng hợp |
| Dashboard | 1 | KPI widgets |
| Canvas | 1 | CAD editor |
| Matrix | 1 | Permission toggle matrix |
| Config | ~6 | Settings forms |
| **Tổng** | **~113** | |

---

## Tham chiếu chi tiết

→ Xem [MODULE_TAB_PAGE_DETAIL.md](MODULE_TAB_PAGE_DETAIL.md) cho phân tích chi tiết từng module.
