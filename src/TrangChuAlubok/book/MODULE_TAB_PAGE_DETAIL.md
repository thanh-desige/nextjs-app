# ALUBOK — Module → Tab → Page (Phân tích chi tiết)

> Chi tiết từng module: mục đích tab, nội dung page, data source, permission cần thiết.
> Cập nhật: **10/03/2026**
> Tham chiếu: [MODULE_TAB_PAGE_MAP.md](MODULE_TAB_PAGE_MAP.md) · [PERMISSION_CATALOG.md](PERMISSION_CATALOG.md)

---

## Module 1: shared/ — Code dùng chung

**Sidebar**: Không hiển thị
**Tabs**: 0 | **Pages**: 0

Không có UI. Chứa types, guards, hooks, utils, workflow, events, audit — dùng bởi tất cả module khác.

---

## Module 2: DanhMuc/ — Master Data (12 resources)

**Sidebar**: Truy cập qua ThietLap hoặc inline lookup từ các Book module.
**Cách hiển thị**: Sidebar phụ bên trái với 6 nhóm, hoặc nhúng trong ThietLap dạng sub-menu.

### Tab 1: 🟢 Đối tác (Tab chính)

| Page | Loại | Resource | Permission | Mô tả |
|------|------|----------|------------|-------|
| Danh sách Khách hàng | List | A1 `master.customer` | `master.customer:read` | DataTable: tên, SĐT, email, địa chỉ, tier |
| Form Khách hàng | Form | A1 | `master.customer:create/update` | Create/Edit dialog hoặc full page |
| Chi tiết Khách hàng | Detail | A1 | `master.customer:read` | Thông tin + lịch sử đơn hàng |
| Danh sách Nhà cung cấp | List | A2 `master.supplier` | `master.supplier:read` | DataTable: tên, mã, SĐT, nhóm hàng |
| Form Nhà cung cấp | Form | A2 | `master.supplier:create/update` | Create/Edit |
| Chi tiết Nhà cung cấp | Detail | A2 | `master.supplier:read` | Thông tin + lịch sử PO |

### Tab 2: 🔵 Nhân sự

| Page | Loại | Resource | Permission | Mô tả |
|------|------|----------|------------|-------|
| Danh sách Nhân viên | List | A3 `master.employee` | `master.employee:read` | DataTable: tên, chức vụ, phòng ban |
| Form Nhân viên | Form | A3 | `master.employee:create/update` | Create/Edit |
| Chi tiết Nhân viên | Detail | A3 | `master.employee:read` | Profile + phân quyền |

### Tab 3: 🔵 Vật tư

| Page | Loại | Resource | Permission | Mô tả |
|------|------|----------|------------|-------|
| DS Thanh nhôm | List | A4 `master.profile` | `master.profile:read` | Mã, tên, hệ, tiết diện, trọng lượng/m |
| Form Thanh nhôm | Form | A4 | `master.profile:create/update` | Thông số kỹ thuật |
| DS Kính | List | A5 `master.glass` | `master.glass:read` | Mã, loại, độ dày, giá/m² |
| Form Kính | Form | A5 | `master.glass:create/update` | |
| DS Phụ kiện | List | A6 `master.accessory` | `master.accessory:read` | Mã, tên, loại, giá |
| Form Phụ kiện | Form | A6 | `master.accessory:create/update` | |
| DS Vật tư chung | List | A7 `master.material` | `master.material:read` | SKU, tên, đơn vị, nhóm |
| Form Vật tư | Form | A7 | `master.material:create/update` | |

### Tab 4: 🔵 Kho & Đơn vị

| Page | Loại | Resource | Permission | Mô tả |
|------|------|----------|------------|-------|
| DS Đơn vị tính | List | A8 `master.unit` | `master.unit:read` | cái, m, m², kg, thanh... |
| Form Đơn vị | Form (modal) | A8 | `master.unit:create/update` | Modal đơn giản |
| DS Kho | List | A9 `master.warehouse` | `master.warehouse:read` | Tên kho, địa chỉ, chi nhánh |
| Form Kho | Form (modal) | A9 | `master.warehouse:create/update` | Modal |

### Tab 5: 🔵 Giá & Thuế

| Page | Loại | Resource | Permission | Mô tả |
|------|------|----------|------------|-------|
| DS Bảng giá | List | A10 `master.price_list` | `master.price_list:read` | Tên, ngày hiệu lực, trạng thái |
| Detail Bảng giá | Detail | A10 | `master.price_list:read` | Ma trận: vật tư × giá × đơn vị |
| Form Bảng giá | Form | A10 | `master.price_list:create/update` | Editor bảng giá |
| DS Thuế suất | List | A11 `master.tax_rate` | `master.tax_rate:read` | Tên, %, loại (VAT/GTGT) |
| Form Thuế | Form (modal) | A11 | `master.tax_rate:create/update` | Modal |

### Tab 6: 🔵 Mẫu cửa

| Page | Loại | Resource | Permission | Mô tả |
|------|------|----------|------------|-------|
| DS Mẫu cửa | List | A12 `master.door_template` | `master.door_template:read` | Thumbnail, tên, hệ, kiểu |
| Detail Mẫu cửa | Detail | A12 | `master.door_template:read` | Preview SVG + thông số |
| Form Mẫu cửa | Form | A12 | `master.door_template:create/update` | Upload SVG + config |

---

## Module 3: BookTongQuan/ — Dashboard

**Sidebar**: ✅ "Tổng quan" (vị trí 1)
**Resource**: C1 `report.dashboard_executive`, C11 `report.performance`

### Tab 1: 🟢 Tổng quan (Tab chính)

| Page | Loại | Nội dung | Data source |
|------|------|---------|------------|
| Dashboard | Dashboard | KPI widgets + charts | Aggregated từ tất cả module |

**Widgets**:
- Doanh thu tháng (từ `sales_order`)
- Công nợ phải thu / phải trả (từ `finance.ar` / `finance.ap`)
- Tồn kho giá trị (từ `inventory.balance`)
- Báo giá đang chờ duyệt (từ `quote` WHERE pending)
- Biểu đồ doanh thu 12 tháng
- Top 5 khách hàng
- Top 5 sản phẩm
- Cảnh báo: tồn kho thấp, công nợ quá hạn

### Tab 2: 🔵 Đơn hàng

| Page | Loại | Nội dung |
|------|------|---------|
| Order pipeline | Kanban/Table | Luồng: Báo giá → SO → Giao → Lắp đặt → Thu tiền |

### Tab 3: 🔵 Thông báo

| Page | Loại | Nội dung |
|------|------|---------|
| Notification center | List | Đơn hàng mới, thay đổi trạng thái, công nợ quá hạn |

---

## Module 4: BookThietKeBocTach/ — CAD + BOM

**Sidebar**: ✅ "Thiết kế & bóc tách" (vị trí 2 kế hoạch)
**Resources**: B1-B5 (`design.project`, `design.canvas`, `design.library`, `bom.report`, `bom.cut_list`)

### Tab 1: 🟢 Dự án (Tab chính)

| Page | Loại | Mô tả |
|------|------|-------|
| DS Dự án | List | Card grid hoặc DataTable: tên, trạng thái, ngày tạo, người tạo |
| Detail Dự án | Detail | Thông tin + thumbnail + BOM summary |

### Tab 2: 🔗 Canvas (Link page — mở khi click dự án)

| Page | Loại | Mô tả |
|------|------|-------|
| CAD Canvas | Canvas (full-page) | CadDrawingCanvas + toolbar + properties + layers + commands |
| Export dialog | Modal | Chọn format: JSON / DXF / SVG / PNG / PDF |
| Share modal | Modal | Phạm vi + quyền + link chia sẻ |

**Đây là trang phức tạp nhất** — chứa CAD engine 875 tests, entity system, command pipeline, history.

### Tab 3: 🔵 BOM

| Page | Loại | Mô tả |
|------|------|-------|
| DS BOM | List | Danh sách BOM reports theo dự án |
| Detail BOM | Detail | Bảng vật tư: profile, glass, accessory, qty, unit, price |
| Cut List | Sub-page | Danh sách cắt tối ưu |

### Tab 4: 🔵 Thư viện

| Page | Loại | Mô tả |
|------|------|-------|
| Thư viện mẫu | Grid | Mẫu cửa / cửa sổ / block — kéo thả vào canvas |

---

## Module 5: BookBanHang/ — Bán hàng

**Sidebar**: ✅ "Bán hàng" (vị trí 3)
**Resources**: B6 `quote`, B7 `sales.order`, C4 `report.quote`, C5 `report.sales`

### Tab 1: 🟢 Báo giá (Tab chính)

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Báo giá | List | `quote:read` | Mã, khách hàng, ngày, tổng tiền, trạng thái (draft/pending/approved/rejected) |
| Form Báo giá | Form | `quote:create/update` | Chọn dự án → load BOM → chỉnh giá + chiết khấu → tổng |
| Detail Báo giá | Detail | `quote:read` | Preview báo giá (giống PDF) + lịch sử duyệt |
| 🔗 Tạo từ BOM | Link (action) | `quote:generate` | BOM → auto populate quote items |
| 🔗 PDF Export | Link (action) | `quote:export` | Xuất PDF gửi khách hàng |

### Tab 2: 🔵 Đơn bán hàng

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Đơn BH | List | `sales.order:read` | Mã, KH, ngày, trạng thái (new/confirmed/delivering/completed) |
| Form Đơn BH | Form | `sales.order:create/update` | Convert từ quote approved hoặc tạo mới |
| Detail Đơn BH | Detail | `sales.order:read` | Tracking trạng thái + items |

### Tab 3: 📊 BC Báo giá

| Page | Loại | Permission |
|------|------|------------|
| Report page | Report | `report.quote:read` |

### Tab 4: 📊 BC Bán hàng

| Page | Loại | Permission |
|------|------|------------|
| Report page | Report | `report.sales:read` |

---

## Module 6: BookMuaHang/ — Mua hàng

**Sidebar**: ✅ "Mua hàng" (vị trí 4)
**Resources**: B8 `purchase.order`, B9 `purchase.request`, C6 `report.purchase`

### Tab 1: 🟢 Đơn mua hàng (Tab chính)

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Đơn MH | List | `purchase.order:read` | Mã, NCC, ngày, trạng thái, tổng tiền |
| Form Đơn MH | Form | `purchase.order:create/update` | Chọn NCC → thêm items → giá + qty |
| Detail Đơn MH | Detail | `purchase.order:read` | Items + lịch sử nhận hàng |

### Tab 2: 🔵 Yêu cầu mua hàng

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS YCMH | List | `purchase.request:read` | Mã, người yêu cầu, ngày, trạng thái |
| Form YCMH | Form | `purchase.request:create/update` | Lý do + items cần mua |
| Detail YCMH | Detail | `purchase.request:read` | Items + approval history |

### Tab 3: 📊 BC Mua hàng

| Page | Loại | Permission |
|------|------|------------|
| Report page | Report | `report.purchase:read` |

### Tab 4: 🔗 Shop ALUBOK (Link page)

| Page | Loại | Mô tả |
|------|------|-------|
| MuaHangPage | Full page | Catalog vật tư B2C: Nhôm thanh, Kính, Phụ kiện... (code sẵn) |

> **Lưu ý**: Shop ALUBOK (B2C) tách biệt với Purchase Order (B2B). Tab này mở page riêng.

---

## Module 7: BookTonKho/ — Tồn kho

**Sidebar**: ✅ "Tồn kho" (vị trí 5)
**Resources**: B10-B14, C7

### Tab 1: 🟢 Phiếu nhập kho (Tab chính)

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Phiếu nhập | List | `inventory.stock_receipt:read` | Mã, kho, NCC, ngày, trạng thái |
| Form Phiếu nhập | Form | `inventory.stock_receipt:create/update` | Chọn PO → load items → nhập qty thực tế |
| Detail Phiếu nhập | Detail | `inventory.stock_receipt:read` | Items + so sánh PO qty vs actual |

### Tab 2: 🔵 Phiếu xuất kho

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Phiếu xuất | List | `inventory.stock_issue:read` | Mã, kho, SO, ngày, trạng thái |
| Form Phiếu xuất | Form | `inventory.stock_issue:create/update` | Chọn SO → load items → xuất |
| Detail Phiếu xuất | Detail | `inventory.stock_issue:read` | Items + balance check |

### Tab 3: 🔵 Phiếu chuyển kho

| Page | Loại | Permission |
|------|------|------------|
| DS Chuyển kho | List | `inventory.stock_transfer:read` |
| Form Chuyển kho | Form | `inventory.stock_transfer:create/update` |

### Tab 4: 🔵 Kiểm kê

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Kiểm kê | List | `inventory.stock_audit:read` | Phiên kiểm kê |
| Form Kiểm kê | Form | `inventory.stock_audit:create/update` | So sánh tồn hệ thống vs thực tế → chênh lệch |

### Tab 5: 🔵 Tồn kho (read-only)

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| Balance view | List (read-only) | `inventory.balance:read` | SKU, tên, kho, tồn, giá trị |

### Tab 6: 📊 BC Tồn kho

| Page | Loại | Permission |
|------|------|------------|
| Report page | Report | `report.inventory:read` |

---

## Module 8: BookThuChi/ — Thu chi

**Sidebar**: ✅ "Thu - chi" (vị trí 6)
**Resources**: B15-B18, C8-C9

### Tab 1: 🟢 Phiếu thu (Tab chính)

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Phiếu thu | List | `finance.receipt:read` | Mã, KH, ngày, số tiền, trạng thái |
| Form Phiếu thu | Form | `finance.receipt:create/update` | Chọn KH + đơn hàng → nhập số tiền |
| Detail Phiếu thu | Detail | `finance.receipt:read` | Thông tin + đối soát AR |

### Tab 2: 🔵 Phiếu chi

| Page | Loại | Permission |
|------|------|------------|
| DS Phiếu chi | List | `finance.payment:read` |
| Form Phiếu chi | Form | `finance.payment:create/update` |
| Detail Phiếu chi | Detail | `finance.payment:read` |

### Tab 3: 🔵 Công nợ phải thu

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS CNPT | List | `finance.ar:read` | KH, tổng nợ, đã thu, còn lại, quá hạn |
| Detail CNPT | Detail | `finance.ar:read` | Chi tiết theo từng đơn hàng |

### Tab 4: 🔵 Công nợ phải trả

| Page | Loại | Permission |
|------|------|------------|
| DS CNPTRA | List | `finance.ap:read` |
| Detail CNPTRA | Detail | `finance.ap:read` |

### Tab 5: 📊 BC Công nợ

| Page | Loại | Permission |
|------|------|------------|
| Report page | Report | `report.debt:read` |

### Tab 6: 📊 BC Dòng tiền

| Page | Loại | Permission |
|------|------|------------|
| Report page | Report | `report.cashflow:read` |

---

## Module 9: BookKeToan/ — Kế toán

**Sidebar**: ⚠️ Chưa có — cần thêm "Kế toán" vào sidebar (vị trí 7)
**Resources**: B19-B20, C10

### Tab 1: 🟢 Chứng từ kế toán (Tab chính)

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Chứng từ | List | `accounting.voucher:read` | Mã, ngày, loại, nợ/có, trạng thái |
| Form Chứng từ | Form | `accounting.voucher:create/update` | Bút toán: TK nợ, TK có, số tiền, diễn giải |
| Detail Chứng từ | Detail | `accounting.voucher:read` | Chi tiết + audit trail |

### Tab 2: 🔵 Hóa đơn

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Hóa đơn | List | `accounting.invoice:read` | Mã, KH, ngày, tổng, VAT, trạng thái |
| Form Hóa đơn | Form | `accounting.invoice:create/update` | Tạo từ SO hoặc thủ công |
| Detail Hóa đơn | Detail | `accounting.invoice:read` | Preview + in |

### Tab 3: 🔵 Sổ kế toán

| Page | Loại | Mô tả |
|------|------|-------|
| Sổ cái | Table (read-only) | Tài khoản → phát sinh nợ/có → số dư |
| Sổ nhật ký | Table (read-only) | Timeline chứng từ theo ngày |

### Tab 4: 📊 BC Kế toán

| Page | Loại | Permission |
|------|------|------------|
| Report page | Report | `report.accounting:read` |

---

## Module 10: ThietLap/ — Thiết lập hệ thống (**cấp Tenant**)

**Sidebar**: ⚠️ Chưa có — cần thêm icon ⚙️ ở footer sidebar
**Resources**: D1-D8 (đã giảm từ D1-D11, vì D9-D11 chuyển sang QuanTriAdmin)

### Tab 1: 🟢 Người dùng (Tab chính)

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Người dùng | List | `setting.user:read` | Tên, email, vai trò, trạng thái, chi nhánh |
| Invite form | Modal | `setting.user:create` | Gửi lời mời qua email |
| Assign role | Action | `setting.user:assign` | Dropdown chọn role |

### Tab 2: ⚙️ Vai trò quyền hạn

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Vai trò | List | `setting.role:read` | Tên role, số user, system/custom |
| Form Vai trò | Form | `setting.role:create/update` | Tên + mô tả |

### Tab 3: ⚙️ Ma trận quyền

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| Permission matrix | Matrix page | `setting.permission:manage` | 4 nhóm → 43 resources → actions → toggle |

> **Đây là trang quan trọng nhất của ThietLap** — hiển thị toàn bộ PERMISSION_CATALOG dạng interactive matrix.

### Tab 4: ⚙️ Tổ chức

| Page | Loại | Permission |
|------|------|------------|
| Thông tin org | Form | `setting.org:update` |

### Tab 5: ⚙️ Chi nhánh

| Page | Loại | Permission |
|------|------|------------|
| DS Chi nhánh | List | `setting.branch:read` |
| Form Chi nhánh | Form | `setting.branch:create/update` |

### Tab 6: ⚙️ Hệ thống

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| Config form | Form | `setting.system:update` | Format số, tiền tệ, múi giờ, ngôn ngữ |

### Tab 7: ⚙️ Mẫu in

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| DS Mẫu in | List | `setting.print_template:read` | Báo giá, hóa đơn, phiếu xuất... |
| Template editor | Editor | `setting.print_template:update` | WYSIWYG hoặc HTML editor |

### Tab 8: ⚙️ Nhật ký thao tác

| Page | Loại | Permission | Mô tả |
|------|------|------------|-------|
| Audit log | List (read-only) | `setting.audit_log:read` | User, action, resource, timestamp, IP |

> **Tabs 9-11 (Sao lưu, Kết nối, Gói dịch vụ) đã chuyển sang QuanTriAdmin**.
> ThietLap có thể hiện "Gói dịch vụ hiện tại" dạng read-only:
>
> | Page | Loại | Permission | Mô tả |
> |------|------|------------|-------|
> | Gói hiện tại | Read-only card | `setting.org:read` | Tên gói, ngày hết hạn, số user đang dùng |

---

## QuanTriAdmin — Quản trị nền tảng ALUBOK (Tách biệt)

**Route**: `/admin` — hoàn toàn riêng biệt khỏi Book
**Code**: `src/PlatformAdmin/`
**Người dùng**: Chỉ đội nội bộ ALUBOK (SuperAdmin, Support, DevOps, Finance, PM)
**Resources**: E1-E16 (`platform.*`)

> **⚠️ KHÁC HOÀN TOÀN với ThietLap**:
> - ThietLap: khách hàng doanh nghiệp quản trị **tenant CỦA HỌ** (D1-D8)
> - QuanTriAdmin: đội nội bộ ALUBOK quản trị **TOÀN BỘ PLATFORM** (E1-E16)
> - Khác cấp độ, khác người dùng, khác phạm vi dữ liệu, khác quyền hạn

### Section 1: Tenant & Users

| # | Menu item | Resource | Permission | Mô tả |
|---|-----------|----------|------------|-------|
| 1 | Tenants | E1 `platform.tenant` | `platform.tenant:read/manage` | DS tất cả org: tên, gói, users, status |
| 2 | Users (Global) | E2 `platform.user` | `platform.user:read/manage` | DS tất cả user global, không phân biệt org |
| 3 | Subscriptions & Billing | E3 `platform.subscription` | `platform.subscription:read/manage` | Quản lý gói + billing + thanh toán |
| 4 | Entitlements & Feature Flags | E4 `platform.entitlement` | `platform.entitlement:read/manage` | Feature flags ON/OFF, scope: per-plan/per-tenant |

### Section 2: Access & Security

| # | Menu item | Resource | Permission | Mô tả |
|---|-----------|----------|------------|-------|
| 5 | Internal Admin Roles | E5 `platform.internal_role` | `platform.internal_role:read/manage` | Vai trò nội bộ: SuperAdmin, Support, DevOps... |
| 6 | Security Center | E6 `platform.security` | `platform.security:read/manage` | Log bảo mật: login, failed auth, permission denied |

### Section 3: Operations

| # | Menu item | Resource | Permission | Mô tả |
|---|-----------|----------|------------|-------|
| 7 | Support Console | E7 `platform.support` | `platform.support:read/manage` | Tickets, impersonation, xem tenant |
| 8 | System Health | E8 `platform.health` | `platform.health:read/manage` | Metrics: CPU, memory, DB, active users, error rate |
| 9 | Jobs & Queue | E9 `platform.job` | `platform.job:read/manage` | Background tasks: export, backup, email... |
| 10 | Storage & Data Governance | E10 `platform.storage` | `platform.storage:read/manage` | Dung lượng per-tenant, retention, compliance |
| 11 | Backup & Restore | E11 `platform.backup` | `platform.backup:read/manage` | Full/incremental backup, schedule, restore |

### Section 4: Platform Config

| # | Menu item | Resource | Permission | Mô tả |
|---|-----------|----------|------------|-------|
| 12 | Integrations | E12 `platform.integration` | `platform.integration:read/manage` | SSO, email (SendGrid), payment (VNPay), webhook |
| 13 | Notifications | E13 `platform.notification` | `platform.notification:read/manage` | Templates: welcome, expiring, failed payment... |
| 14 | Platform Analytics | E14 `platform.analytics` | `platform.analytics:read` | MAU, MRR, churn, module usage, top tenants |
| 15 | Release & Config Control | E15 `platform.release` | `platform.release:read/manage` | Releases, rollback, remote config key-value |
| 16 | Platform Settings | E16 `platform.config` | `platform.config:read/manage` | file_upload_max, session_timeout, maintenance_mode |

---

## Tham chiếu

| File | Vai trò |
|------|---------|
| [MODULE_TAB_PAGE_MAP.md](MODULE_TAB_PAGE_MAP.md) | Bảng tổng hợp |
| [PERMISSION_CATALOG.md](PERMISSION_CATALOG.md) | 43 resources, 17 actions |
| [BOOK_STRUCTURE.md](BOOK_STRUCTURE.md) | Cấu trúc 10 modules |
| [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) | Thứ tự build |
