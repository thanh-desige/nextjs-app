# ALUBOK — PROJECT ROADMAP (Thứ tự ưu tiên)

> Roadmap tổng thể dự án — định hướng thứ tự build các module
> Cập nhật: **17/03/2026**
> Tham chiếu: [PERMISSION_CATALOG.md](PERMISSION_CATALOG.md) · [BOOK_STRUCTURE.md](BOOK_STRUCTURE.md)

---

## Tổng quan dự án

**ALUBOK** — Hệ thống ERP cho ngành nhôm kính
- **10 modules** (Book) + **QuanTriAdmin** (app riêng `/admin`)
- **59 resources** (43 app A–D + 16 platform E), **~350 permissions**, **6 app roles + 6 internal admin roles**
- Stack: Next.js 15 + React 19 + TypeScript 5 + Tailwind CSS 4 + Zustand 5

---

## Trạng thái hiện tại

| Module | Trạng thái | Tests | Ghi chú |
|--------|-----------|-------|---------|
| BookThietKeBocTach | ✅ Core hoàn chỉnh | 875/875 | CAD engine + BOM + 5 Export formats |
| shared/ | ✅ Phase F1 hoàn chỉnh | 85 | Types + RBAC + Guards + Hooks |
| DanhMuc/ | ✅ Phase F2 hoàn chỉnh | 37 | 12 master data resources, generic CRUD |
| ThietLap/ | ✅ Phase F3 hoàn chỉnh | 36 | 8 tabs RBAC UI (D1-D8), 15 source files |
| BookBanHang/ | ✅ Phase B1 hoàn chỉnh | 26 | Báo giá + Đơn hàng (13 source + 2 test files) |
| BookMuaHang/ | ✅ Phase B2 hoàn chỉnh | 33 | Đơn mua + Yêu cầu mua + Báo cáo (13 source + 2 test files) |
| BookTonKho/ | ✅ Phase B3 hoàn chỉnh | 29 | Nhập/Xuất/Chuyển kho + Tồn kho + Báo cáo (18 source + 2 test files) |
| BookThuChi/ | ✅ Phase B4 hoàn chỉnh | 34 | Thu chi + Công nợ (17 source + 2 test files) |
| BookKeToan/ | ✅ Phase C2 hoàn chỉnh | 31 | Chứng từ + Hóa đơn (14 source + 2 test files) |
| BookTongQuan/ | ⬜ Chưa bắt đầu | — | Dashboard (cần data từ các module) |
| QuanTriAdmin/ | ✅ UI hoàn chỉnh | — | 16 pages, dark theme, route `/admin` (tách biệt Book) |

---

## Luồng kinh doanh cốt lõi

```
Thiết kế (CAD) → BOM → Báo giá → Đơn hàng → Mua hàng → Nhập kho → Xuất kho → Thu tiền → Kế toán
     ✅            ✅      ✅         ✅          ✅          ✅         ✅        ✅         ✅

Foundation: shared/ ✅ → DanhMuc/ ✅ → ThietLap/ ✅
```

> Mục tiêu: nối dài chuỗi giá trị này — từ thiết kế đến thu tiền.

---

## Sơ đồ phụ thuộc

```
                    PERMISSION_CATALOG.md (source of truth)
                              │
                         ┌────┴────┐
                         │ shared/ │ ← Foundation: Types + RBAC + Guards
                         └────┬────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────┴────┐    ┌────┴────┐    ┌─────┴─────┐
         │ DanhMuc │    │ ThietLap│    │  BocTach   │
         │ (A1-12) │    │ (D1-8)  │    │  (B1-B5)  │
         └────┬────┘    └─────────┘    └─────┬─────┘
              │                              │
    ┌─────────┼─────────┐              BOM data
    │         │         │                    │
┌───┴───┐ ┌──┴───┐ ┌───┴───┐          ┌────┴────┐
│BanHang│ │MuaHang│ │TonKho │          │ BanHang │
│(B6-B7)│ │(B8-B9)│ │(B10-14)│         │ (quote) │
└───┬───┘ └───┬───┘ └───┬───┘          └─────────┘
    │         │         │
    └─────────┼─────────┘
              │
         ┌────┴────┐
         │ ThuChi  │ ← Thu chi từ bán hàng + Chi trả mua hàng
         │(B15-B18)│
         └────┬────┘
              │
         ┌────┴────┐
         │ KeToan  │ ← Auto sinh chứng từ từ phiếu thu/chi
         │(B19-B20)│
         └────┬────┘
              │
         ┌────┴─────┐
         │ TongQuan  │ ← Dashboard đọc data từ TẤT CẢ module
         │   (C1)    │
         └───────────┘
```

---

## ĐỢT 1: FOUNDATION (Ưu tiên cao nhất)

> Xây móng — tất cả module khác phụ thuộc vào đây

### Phase F1: shared/ — RBAC Foundation

| # | Task | Deliverable | Catalog |
|---|------|-------------|---------|
| F1.1 | TypeScript interfaces 7 bảng DB | `org.types.ts`, `user.types.ts`, `permission.types.ts`, `role.types.ts`, `member.types.ts` | Section 6 |
| F1.2 | Permission catalog typed constant | `PERMISSION_CATALOG.ts` — 43 resources × actions, typed enum | Section 3 |
| F1.3 | Default roles seed data | `DEFAULT_ROLES.ts` — 6 roles (OWNER → SALES) | Section 4 |
| F1.4 | Permission utilities | `hasPermission()`, `parsePermission()`, `matchWildcard()`, `expandRole()` | — |
| F1.5 | React hooks | `usePermission()`, `useCurrentOrg()`, `useCurrentUser()` | — |
| F1.6 | Guards | `requirePermission()`, `requireOrgMember()` | Section 5 |
| F1.7 | Tests | Unit tests cho permission matching, wildcard, role expansion | — |

**Tại sao làm trước?** Không có shared/, không module nào biết "ai được làm gì". Đây là xương sống phân quyền.

### Phase F2: DanhMuc/ — Master Data

| # | Task | Resources | Dùng bởi |
|---|------|-----------|----------|
| F2.1 | Customer + Supplier | A1, A2 | BookBanHang, BookMuaHang |
| F2.2 | Employee | A3 | ThietLap |
| F2.3 | Profile + Glass + Accessory + Material | A4-A7 | BookThietKeBocTach (BOM), BookTonKho |
| F2.4 | Unit + Warehouse | A8-A9 | BookTonKho |
| F2.5 | Price List + Tax Rate | A10-A11 | BookBanHang, BookKeToan |
| F2.6 | Door Template | A12 | BookThietKeBocTach |

**Tại sao làm trước?** Mọi nghiệp vụ đều cần chọn khách hàng, vật tư, kho. Không có DanhMuc = không có data để thao tác.

### Phase F3: ThietLap/ — RBAC UI

| # | Task | Resources |
|---|------|-----------|
| F3.1 | Màn hình "Quản lý người dùng" — list, invite, assign role, deactivate | D1 |
| F3.2 | Màn hình "Vai trò quyền hạn" — CRUD roles | D2 |
| F3.3 | Màn hình "Ma trận quyền" — Group → Resource → Action → Toggle | D2, D3 |
| F3.4 | Thông tin tổ chức + Chi nhánh | D4, D5 |
| F3.5 | Cấu hình hệ thống (format số, tiền tệ, ngôn ngữ) | D6 |

**Tại sao làm trước?** Chứng minh RBAC hoạt động end-to-end. Admin có thể tạo role → gán quyền → user bị chặn/cho phép.

---

## ĐỢT 2: BUSINESS FLOW (Giá trị kinh doanh)

> Nối dài chuỗi: Thiết kế → BOM → **Báo giá → Đơn hàng → Mua hàng → Kho**

### Phase B1: BookBanHang/ — Báo giá + Đơn hàng

| # | Task | Resources |
|---|------|-----------|
| B1.1 | Quote CRUD + generate từ BOM data | B6 |
| B1.2 | Quote approval workflow (draft → pending → approved → rejected) | B6 |
| B1.3 | Quote → PDF export (dùng print template từ ThietLap) | B6 |
| B1.4 | Sales Order — convert quote → order | B7 |
| B1.5 | Sales Order tracking (new → confirmed → delivering → completed) | B7 |
| B1.6 | Reports: báo cáo báo giá + bán hàng | C4, C5 |

**Giá trị**: User có thể tạo báo giá từ bản vẽ CAD → gửi khách hàng. Đây là **giá trị kinh doanh đầu tiên** mà khách hàng sẵn sàng trả tiền.

### Phase B2: BookMuaHang/ — Đơn mua hàng

| # | Task | Resources |
|---|------|-----------|
| B2.1 | Purchase Request CRUD + approval | B9 |
| B2.2 | Purchase Order CRUD + tracking | B8 |
| B2.3 | Tích hợp MuaHangPage hiện tại (shop vật tư) | — |
| B2.4 | Auto tạo PO từ BOM thiếu hàng | B8, B4 |
| B2.5 | Reports: báo cáo mua hàng | C6 |

### Phase B3: BookTonKho/ — Quản lý kho

| # | Task | Resources |
|---|------|-----------|
| B3.1 | Phiếu nhập kho (từ PO confirm) | B10 |
| B3.2 | Phiếu xuất kho (từ SO confirm) | B11 |
| B3.3 | Phiếu chuyển kho | B12 |
| B3.4 | Tồn kho real-time (tự động tính) | B14 |
| B3.5 | Kiểm kê + điều chỉnh | B13 |
| B3.6 | Cảnh báo tồn kho tối thiểu | — |
| B3.7 | Reports: xuất nhập tồn | C7 |

---

## ĐỢT 3: TÀI CHÍNH (Hoàn thiện vòng tiền)

> Khép kín: Bán hàng → Thu tiền, Mua hàng → Chi tiền

### Phase C1: BookThuChi/ — Thu chi + Công nợ

| # | Task | Resources |
|---|------|-----------|
| C1.1 | Phiếu thu (từ bán hàng) | B15 |
| C1.2 | Phiếu chi (từ mua hàng) | B16 |
| C1.3 | Công nợ phải thu — tracking theo KH + đơn hàng | B17 |
| C1.4 | Công nợ phải trả — tracking theo NCC + PO | B18 |
| C1.5 | Reports: công nợ + dòng tiền | C8, C9 |

### Phase C2: BookKeToan/ — Kế toán

| # | Task | Resources |
|---|------|-----------|
| C2.1 | Chứng từ kế toán (auto từ phiếu thu/chi) | B19 |
| C2.2 | Hóa đơn VAT (từ bán hàng) | B20 |
| C2.3 | Sổ cái + Sổ nhật ký | — |
| C2.4 | Khóa sổ cuối kỳ | — |
| C2.5 | Reports: báo cáo kế toán | C10 |

---

## ĐỢT 4: DASHBOARD + NÂNG CAO

### Phase D1: BookTongQuan/ — Dashboard

| # | Task | Resources |
|---|------|-----------|
| D1.1 | KPI widgets (doanh thu, công nợ, tồn kho) | C1 |
| D1.2 | Biểu đồ doanh thu theo tháng | C1 |
| D1.3 | Top sản phẩm, top khách hàng | C1 |
| D1.4 | Thông báo: đơn mới, tồn kho thấp, công nợ quá hạn | C1 |
| D1.5 | Truy cập nhanh (tạo báo giá, nhập hàng...) | — |
| D1.6 | Reports: hiệu suất nhân sự | C11 |

**Tại sao cuối?** Dashboard đọc data tổng hợp — phải có data từ các module khác trước.

### Phase D2: ThietLap/ mở rộng

| # | Task | Resources |
|---|------|-----------|
| D2.1 | Mẫu in (báo giá, hóa đơn, phiếu xuất) | D7 |
| D2.2 | Nhật ký thao tác (audit log) | D8 |
| D2.3 | Tab "Gói dịch vụ hiện tại" (read-only: tên gói, hạn, số user) | D4 (setting.org) |

> **Thay đổi**: D2.3–D2.5 cũ (Sao lưu D9, Kết nối D10, Gói dịch vụ D11) đã chuyển sang **QuanTriAdmin** (Nhóm E).
> ThietLap chỉ còn D1–D8. Xem `PERMISSION_CATALOG.md` Nhóm E và `src/PlatformAdmin/` cho chi tiết.

---

## SONG SONG: CAD Nâng cao (làm khi rảnh hoặc giao riêng)

> Không chặn business flow — có thể làm song song với bất kỳ đợt nào

| # | Task | Ưu tiên | Mô tả |
|---|------|---------|-------|
| S1 | DXF Import | ⭐ Cao | Parse DXF → IEntity[], 8 entity types |
| S2 | SVG Import | Trung bình | Parse SVG → IEntity[] |
| S3 | SPLINE tool | Trung bình | B-spline/NURBS curve |
| S4 | HATCH / BLOCK / ARRAY | Thấp | Advanced drawing tools |
| S5 | Geometry Abstraction (3D-ready) | Cao (dài hạn) | IVector, Vec3, ICanvasAdapter |
| S6 | Door engine mở rộng | Thấp | Sliding, Folding, Pivot engines |
| S7 | Door template SVG | Thấp | Thêm mẫu cửa/cửa sổ |

---

## TƯƠNG LAI: Backend + Collaboration

| Phase | Mô tả | Phụ thuộc | Thời điểm |
|-------|-------|-----------|-----------|
| PHASE 6: Backend + API | PostgreSQL, NextAuth, API routes, webhooks | Đợt 1 + 2 | Sau khi hoàn thành Đợt 2 |
| PHASE 9: Collaboration | Real-time editing, versioning, cloud storage | Phase 6 | Sau khi có backend ổn định |

---

## TƯƠNG LAI XA: 3D (Chỉ triển khai khi dự án đã có nhiều người dùng thực tế)

> ⚠️ **3D KHÔNG nằm trong kế hoạch ngắn/trung hạn.**
> Chỉ bắt đầu khi: sản phẩm đã go-live, có user base thực tế, business flow hoạt động ổn định.
> Hiện tại chỉ cần đảm bảo kiến trúc **3D-ready** (không hardcode 2D) — KHÔNG build 3D.

| Phase | Mô tả | Điều kiện tiên quyết |
|-------|-------|---------------------|
| PHASE 8: 3D | Three.js, ThreeJsAdapter, split view 2D+3D | Dự án đã có người dùng thực tế + Phase S5 (Geometry Abstraction) |

---

## Nguyên tắc thực hiện

### 1. Vertical Slice — Không làm 100% rồi mới chuyển

```
❌ Sai:  Làm 100% CAD → 100% Bán hàng → 100% Kho
✅ Đúng: Làm xương sống xuyên suốt → rồi bổ dày từng module
```

Mỗi đợt tạo ra **giá trị sử dụng được** — user có thể dùng ngay, không phải chờ toàn bộ hệ thống.

### 2. Dependency-first — Module nền trước, module ngọn sau

```
shared/ → DanhMuc/ → ThietLap/ → BookBanHang/ → ... → BookTongQuan/
```

### 3. Test-driven — Mỗi module phải có tests

Tuân theo convention BookThietKeBocTach: Jest + ts-jest, entity helpers, path alias `@/*`.

### 4. Permission-first — UI render từ catalog, backend check

Không hardcode quyền trong UI. `PERMISSION_CATALOG.md` là source of truth duy nhất.

### 5. Cập nhật .md — Sau mỗi task hoàn tất

- ROADMAP.md của module tương ứng
- PROJECT_ROADMAP.md (file này) — cập nhật trạng thái
- docs_history_commit.md của module
- PROJECT_STRUCTURE_ANALYSIS.md nếu tạo file mới

---

## Tham chiếu

| File | Vai trò |
|------|---------|
| [PERMISSION_CATALOG.md](PERMISSION_CATALOG.md) | Source of truth: 43 resources, 17 actions, 6 roles |
| [BOOK_STRUCTURE.md](BOOK_STRUCTURE.md) | Cấu trúc 10 modules + mapping resources |
| `shared/ROADMAP.md` | Chi tiết Phase F1 |
| `DanhMuc/ROADMAP.md` | Chi tiết Phase F2 |
| `ThietLap/ROADMAP.md` | Chi tiết Phase F3 |
| `BookBanHang/ROADMAP.md` | Chi tiết Phase B1 |
| `BookMuaHang/ROADMAP.md` | Chi tiết Phase B2 |
| `BookTonKho/ROADMAP.md` | Chi tiết Phase B3 |
| `BookThuChi/ROADMAP.md` | Chi tiết Phase C1 |
| `BookKeToan/ROADMAP.md` | Chi tiết Phase C2 |
| `BookTongQuan/ROADMAP.md` | Chi tiết Phase D1 |
| `BookThietKeBocTach/ROADMAP.md` | CAD module: 875 tests, phases chi tiết |
