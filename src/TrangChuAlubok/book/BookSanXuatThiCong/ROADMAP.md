# BookSanXuatThiCong — ROADMAP

> Module: Sản xuất & Thi công (Production & Construction)
> Tạo: **18/03/2026**
> Trạng thái: **✅ Phase SX hoàn chỉnh**
> Tests: **54/54 pass, 2 suites**

---

## Tổng quan

Module quản lý toàn bộ quy trình sản xuất và thi công/lắp đặt cửa nhôm kính:
- **Lệnh sản xuất** (Production Orders): Theo dõi từ cắt → gia công → QC → hoàn tất
- **Kế hoạch vật tư** (Material Plans): BOM-based, theo dõi thiếu hụt
- **Xuất dùng** (Material Issues): Xuất kho cho sản xuất, theo dõi hao hụt
- **Thi công/Lắp đặt** (Installation): Check-in/out, quản lý đội, phát sinh
- **Nghiệm thu/Bàn giao** (Acceptance): Partial/Final, bảo hành, defects
- **Báo cáo** (Reports): Tổng hợp tiến độ, vật tư, hiệu suất

### Đặc điểm kiến trúc
- **SubSidebar cấp 2 dọc** (210px, 7 section) — khác biệt với ModuleTabBar ngang của các module khác
- **6 entity types**: Project, ProductionOrder, MaterialPlan, MaterialIssue, InstallationJob, AcceptanceRecord
- **Project** as parent entity — liên kết salesOrderId, designProjectId

---

## Phase SX — MVP (✅ HOÀN THÀNH)

| # | Task | Status | Files |
|---|------|--------|-------|
| SX.0 | Types | ✅ | `types/sanXuatThiCong.types.ts`, `types/index.ts` |
| SX.1 | Store (Zustand + persist) | ✅ | `store/sanXuatThiCongStore.ts` |
| SX.2 | SubSidebar + MainPage layout | ✅ | `ui/SubSidebar.tsx`, `ui/BookSanXuatThiCongPage.tsx` |
| SX.3 | ProgressOverview (Tổng quan) | ✅ | `ui/ProgressOverview.tsx` |
| SX.4 | ProductionOrder UI | ✅ | `ui/ProductionOrderList.tsx`, `ProductionOrderForm.tsx`, `ProductionOrderDetail.tsx` |
| SX.5 | MaterialPlan Page | ✅ | `ui/MaterialPlanPage.tsx` |
| SX.6 | MaterialIssue Page | ✅ | `ui/MaterialIssuePage.tsx` |
| SX.7 | Installation UI | ✅ | `ui/InstallationList.tsx`, `InstallationForm.tsx`, `InstallationDetail.tsx` |
| SX.8 | Acceptance UI | ✅ | `ui/AcceptanceList.tsx`, `AcceptanceForm.tsx`, `AcceptanceDetail.tsx` |
| SX.9 | ProductionReport | ✅ | `ui/ProductionReport.tsx` |
| SX.10 | Integration (route+sidebar+App) | ✅ | `index.ts`, routeConfig page 10, Sidebar IconSanXuat, App.tsx |
| SX.11 | Tests (types + store) | ✅ | `tests/sanXuatThiCongTypes.test.ts` (27), `tests/sanXuatThiCongStore.test.ts` (27) |
| SX.12 | Docs update | ✅ | ROADMAP, BOOK_STRUCTURE, PROJECT_ROADMAP, PROJECT_STRUCTURE_ANALYSIS |

**Totals**: 19 source files + 2 test files = 21 files

---

## 🔮 FUTURE PHASES

### Phase SX.2 — Nâng cao (Chưa triển khai)

| # | Task | Mô tả |
|---|------|-------|
| SX.2.1 | Kanban board cho Lệnh SX | Kéo thả giữa các trạng thái (new → cutting → processing → qc → completed) |
| SX.2.2 | Gantt chart thi công | Timeline view cho installations + projects |
| SX.2.3 | QR code/Barcode scan | Scan vật tư khi xuất dùng, scan kiểm tra QC |
| SX.2.4 | Photo upload | Upload ảnh hiện trường thi công, nghiệm thu |
| SX.2.5 | Auto tạo Lệnh SX từ BOM | Khi đơn hàng confirmed → auto tạo production orders từ BOM |
| SX.2.6 | Liên kết 2 chiều BookTonKho | Xuất dùng → auto tạo phiếu xuất kho, nhận hàng → auto phiếu nhập |
| SX.2.7 | Dashboard real-time | WebSocket updates cho tiến độ sản xuất |
| SX.2.8 | Bảo hành tracking | Theo dõi bảo hành sau nghiệm thu, lịch sử sửa chữa |

---

## Catalog Resources

| ID | Resource | Mô tả |
|----|----------|-------|
| B21 | `production.project` | Công trình (entity cha) |
| B22 | `production.order` | Lệnh sản xuất |
| B23 | `production.material_plan` | Kế hoạch vật tư + Xuất dùng |
| B24 | `construction.installation` | Thi công / Lắp đặt |
| B25 | `construction.acceptance` | Nghiệm thu / Bàn giao |
| C12 | `report.production` | Báo cáo sản xuất & thi công |
