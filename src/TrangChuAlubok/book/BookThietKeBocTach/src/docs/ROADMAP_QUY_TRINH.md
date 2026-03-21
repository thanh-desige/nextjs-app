# ROADMAP — Triển khai Quy trình Dự án

> Tham chiếu chi tiết: `QUY_TRINH_DU_AN.md`
> Ngày tạo: 2026-03-20

---

## Tổng quan Phase

| Phase | Nội dung | Phụ thuộc | Độ phức tạp |
|-------|---------|-----------|-------------|
| **P1** | Cấu trúc dữ liệu + UI cơ bản | Không | Trung bình |
| **P2** | Logic tự tính trạng thái (computedStatus) | P1 | Trung bình |
| **P3** | Liên kết module Bán hàng (Báo giá) | P2 | Cao |
| **P4** | Liên kết module Bán hàng (Hợp đồng) | P3 | Cao |
| **P5** | Liên kết module Thu chi (Phiếu thu) | P4 | Trung bình |
| **P6** | Liên kết module Sản xuất (Lệnh SX) | P5 | Cao |
| **P7** | Cơ chế Khóa/Mở khóa canvas | P6 | Trung bình |
| **P8** | Revision tracking + invalidation cascade | P3 | Cao |

---

## Phase 1 — Cấu trúc dữ liệu + UI cơ bản

**Mục tiêu**: Cập nhật UI bảng dự án, sidebar, bỏ dropdown, thêm cột mới.

### Bước 1.1: Cập nhật ProjectInfo type
- [ ] Thêm fields mới vào `ProjectInfo` trong `projectStore.ts`:
  - `designRevision: number` (default: 0)
  - `bomRevision: number` (default: 0)
  - `bomDesignRevision: number` (default: 0)
  - `quoteId`, `quoteCode`, `contractId`, `contractCode`
  - `receiptId`, `receiptCode`, `productionOrderId`, `productionOrderCode`
  - `isLocked: boolean` (default: false)
  - `soLuongBo: number` (default: 0)
- [ ] Cập nhật `projectStatus` type union:
  - `'draft' | 'designing' | 'quoted' | 'contracted' | 'deposited' | 'in_production'`
  - Xóa `'done'` và `'locked'` khỏi type (khóa là trường riêng)

### Bước 1.2: Hàm computeProjectStatus
- [ ] Tạo hàm `computeProjectStatus(project: ProjectInfo): ComputedStatus`
- [ ] Logic theo rule ưu tiên (mục 4 trong QUY_TRINH_DU_AN.md)
- [ ] Hàm trả về `{ status, actionLabel, actionCode, actionType }`
- [ ] Viết unit test cho hàm này (cover tất cả 7 trạng thái + edge case revision mismatch)

### Bước 1.3: Cập nhật sidebar
- [ ] Đổi tiêu đề "Lọc dự án" → "Quy trình"
- [ ] Cập nhật `SIDEBAR_ITEMS` theo 8 mục mới:
  - Tất cả, Nháp, Đang thiết kế, Đã báo giá, Đã ký hợp đồng, Đã tạm ứng, Đã vào lệnh SX, Đã khóa
- [ ] Cập nhật `SidebarFilter` type
- [ ] "Đã khóa" lọc theo `isLocked === true`, không phải `computedStatus`

### Bước 1.4: Cập nhật bảng dự án
- [ ] Thêm cột "Số lượng" (sau "Tên dự án")
- [ ] Bỏ dropdown `StatusDropdown` khỏi cột Hiện trạng → thay bằng text/badge chỉ đọc
- [ ] Đổi cột "..." → "Liên kết / Hành động" (header text giữ ngắn gọn)
- [ ] Thêm cột "Khóa" ở cuối
- [ ] Cập nhật `ProjectRow` component theo cấu trúc mới
- [ ] Headers mới: checkbox | Ngày tạo | Ngày sửa | Nhân viên | Mã DA | Tên dự án | SL | Thiết kế | BOM | DS cắt | Hiện trạng | Liên kết | 🔒

### Bước 1.5: Tests
- [ ] Test computeProjectStatus với tất cả trạng thái
- [ ] Test revision mismatch (chứng từ cũ bị bỏ qua)
- [ ] Test sidebar filter logic

---

## Phase 2 — Logic tự tính trạng thái ✅ HOÀN THÀNH

**Mục tiêu**: Hiện trạng tự động suy ra, cột Liên kết hiển thị đúng.

### Bước 2.1: Đếm số bộ cửa từ canvas ✅
- [x] Dùng `selectDoorCount` từ doorStore (đã sẵn có)
- [x] `useProjectSync` hook sync `doorCount → soLuongBo` khi canvas thay đổi

### Bước 2.2: BOM sync detection ✅
- [x] Kiểm tra `bomDesignRevision === designRevision` → BOM đã sync
- [x] Khi user chạy calculateBom() → cập nhật `bomRevision++` và `bomDesignRevision = designRevision`
- [x] Cũng sync `soLuongBo = doors.length` khi BOM tính

### Bước 2.3: designRevision auto-increment ✅
- [x] `useProjectSync` hook: documentVersion thay đổi → `designRevision++`
- [x] Skip increment trên mount đầu tiên (tránh false positive)
- [x] Reset initialized flag khi chuyển project

### Bước 2.4: Sub-rule "Đang thiết kế" + cột Liên kết ✅
- [x] BOM chưa sync → Liên kết = trống
- [x] BOM đã sync, không có BG cũ → Liên kết = "Tạo báo giá"
- [x] BOM đã sync, có BG cũ (rev ≠) → Liên kết = "Cập nhật báo giá"

### Bước 2.5: Badge styling cho Hiện trạng ✅ (Phase 1)
- [x] Mỗi trạng thái có màu riêng (pill/badge)
- [x] Phù hợp dark theme

### Tests: 15 tests — BOM sync detection, cascade invalidation, bomRevision tracking, soLuongBo transitions

---

## Phase 3 — Liên kết module Bán hàng (Báo giá) ✅

**Mục tiêu**: "Tạo báo giá" mở tab Báo giá trong module Bán hàng, tự sinh mã BG.

### Bước 3.1: Quote type + projectId field ✅
- [x] Thêm `projectId?: string` và `designRevision?: number` vào Quote interface (`banHang.types.ts`)

### Bước 3.2: createQuoteFromProject service ✅
- [x] Tạo `domain/createQuoteFromProject.ts` — BOM → QuoteItem[] conversion
- [x] Auto-generate mã BG-xxxx (`nextQuoteCode()` parse existing codes, increment)
- [x] `createQuoteFromProject(project)`: đọc BOM → tạo Quote → addQuote + link back ProjectInfo
- [x] `updateQuoteFromProject(project)`: re-import BOM → update Quote → reset draft + update revision
- [x] `calcTotals()` tính subtotal, tax, totalAmount

### Bước 3.3: ActionCell onClick handlers ✅
- [x] ActionCell nhận `onCreateQuote`, `onUpdateQuote`, `onViewQuote` props
- [x] Separate onClick per actionType: view_quote → onViewQuote, create_quote → onCreateQuote, update_quote → onUpdateQuote

### Bước 3.4: Navigation callback wiring ✅
- [x] `onNavigateToBanHang?: (quoteId?: string) => void` prop truyền từ BookThietKeBocTachModule → ProjectListView
- [x] `handleCreateQuote` / `handleUpdateQuote` / `handleViewQuote` callbacks trong ProjectListView
- [x] Click BG-xxxx → navigate sang module Bán hàng với quoteId

### Bước 3.5: Tests ✅
- [x] 13 unit tests: nextQuoteCode, bomToQuoteItems, createQuoteFromProject, updateQuoteFromProject, error cases
- [x] Full suite: 46 suites, 1379 tests — tất cả pass

---

## Phase 4 — Liên kết module Bán hàng (Hợp đồng) ✅

**Mục tiêu**: Tab Hợp đồng mới trong module Bán hàng.

### Bước 4.1: Contract types ✅
- [x] Contract interface: contractId, contractCode (HD-xxxx), quoteId/Code, projectId, designRevision, items, totals, deposite, status
- [x] ContractStatus: draft | signed | completed | cancelled
- [x] Status labels + colors constants
- [x] BanHangTab mở rộng: thêm 'contracts'

### Bước 4.2: Store + Service ✅
- [x] banHangStore: contracts[], addContract, updateContract, deleteContract, setContracts
- [x] `createContractFromQuote(project)`: tạo HĐ từ Quote đã duyệt, auto HD-xxxx, copy items + totals, default 30% deposit
- [x] Liên kết ngược: cập nhật contractId, contractCode vào ProjectInfo

### Bước 4.3: UI + Navigation ✅
- [x] Tab 'Hợp đồng' trong routeConfig (page 3, group 'Nghiệp vụ')
- [x] ContractList.tsx: bảng danh sách, search, filter, status badge, summary
- [x] BookBanHangPage: render ContractList cho tab 'contracts'
- [x] computeProjectStatus: 'quoted' → actionType = 'create_contract', actionLabel = 'Tạo hợp đồng'
- [x] ActionCell: xử lý create_contract + view_contract actions
- [x] handleCreateContract/handleViewContract callbacks trong ProjectListView

### Bước 4.4: Tests ✅
- [x] 13 unit tests: nextContractCode, items copy, totals, deposit, linking, status transitions, error cases
- [x] Cập nhật P1/P2 tests cho actionType mới (view_quote → create_contract)
- [x] Full suite: 47 suites, 1392 tests — tất cả pass

---

## Phase 5 — Liên kết module Thu chi (Phiếu thu) ✅

**Mục tiêu**: Phiếu thu liên kết → trạng thái "Đã tạm ứng".

### Bước 5.1: CashReceipt type + project fields ✅
- [x] Thêm `projectId`, `contractId`, `contractCode` vào CashReceipt interface
- [x] `createReceiptFromContract(project)`: tạo phiếu thu từ HĐ, auto PT-xxxx, amount = depositAmount
- [x] Liên kết ngược: cập nhật receiptId, receiptCode vào ProjectInfo

### Bước 5.2: computeProjectStatus + UI ✅
- [x] Thêm `'create_receipt'` vào actionType union
- [x] 'contracted' status → actionType = 'create_receipt', actionLabel = 'Tạo phiếu thu'
- [x] ActionCell: xử lý create_receipt + view_receipt actions
- [x] handleCreateReceipt/handleViewReceipt callbacks trong ProjectListView
- [x] Props mới: `onNavigateToThuChi` cho cross-module navigation

### Bước 5.3: Tests ✅
- [x] 12 unit tests: PT-xxxx generation, amount = deposit, linking, customer info, status, error cases
- [x] Cập nhật P1/P4 tests cho actionType mới (view_contract → create_receipt)
- [x] Full suite: 48 suites, 1404 tests — tất cả pass

---

## Phase 6 — Liên kết module Sản xuất (Lệnh SX) ✅

**Mục tiêu**: Tạo lệnh SX từ dự án đã tạm ứng.

### Bước 6.1: Service + computeProjectStatus ✅
- [x] `createProductionOrderFromReceipt(project)`: BOM→ProductionOrderItem[], auto LSX-xxxx, status = new
- [x] Liên kết ngược: productionOrderId, productionOrderCode vào ProjectInfo
- [x] computeProjectStatus: 'deposited' → actionType = 'create_production_order' ("Tạo lệnh SX")
- [x] Thêm 'create_production_order' vào actionType union

### Bước 6.2: UI + Navigation ✅
- [x] ActionCell: xử lý create_production_order + view_production_order (có onClick)
- [x] ProjectListView: handleCreateProductionOrder, handleViewProductionOrder
- [x] Props mới: onNavigateToSanXuat

### Bước 6.3: Tests ✅
- [x] 10 unit tests: LSX-xxxx code, BOM→items, completedQty=0, linking, status, error cases
- [x] Full suite: 49 suites, 1414 tests — tất cả pass

---

## Phase 7 — Cơ chế Khóa/Mở khóa canvas ✅

**Mục tiêu**: Icon ổ khóa toggle, canvas read-only khi khóa.

### Bước 7.1: Icon khóa trong bảng ✅ (đã có từ Phase 1)
- [x] Cột cuối: icon 🔒/🔓, chỉ hiện khi đã có LSX
- [x] Click toggle `isLocked`

### Bước 7.2: Canvas read-only mode ✅
- [x] engineStore lock guard: `executeCommandObject()` + `undo()` + `redo()` chặn khi `isLocked`
- [x] useToolbar lock gate: VIEW_SAFE_TOOLS whitelist (select, pan, zoom, export, share, osnap)
- [x] useKeyboardShortcuts lock gate: cho phép Ctrl+C, Ctrl+A, ESC; chặn Ctrl+V, Delete, command buffer
- [x] Banner "🔒 Dự án đã khóa — Chế độ xem" trên canvas
- [x] Sidebar filter "Đã khóa" lọc `isLocked === true` (đã có từ Phase 1)

### Bước 7.3: Tests ✅
- [x] 23 unit tests: in_production status, isLocked toggle, VIEW_SAFE_TOOLS (12 tools), lock gate, keyboard shortcuts, full cycle
- [x] Full suite: 50 suites, 1437 tests — tất cả pass

---

## Phase 8 — Revision tracking + Invalidation cascade ✅

**Mục tiêu**: Khi sửa thiết kế → chứng từ cũ tự mất hiệu lực, status revert.

### Bước 8.1: Auto-increment designRevision ✅ (đã có từ Phase 2)
- [x] Hook vào entity add/remove/modify → `designRevision++` (useProjectSync)
- [x] Debounce (1 lần sửa = 1 increment via documentVersion tracking)

### Bước 8.2: Invalidation logic ✅ (đã có từ Phase 1-2)
- [x] Khi designRevision tăng:
  - BOM → bomDesignRevision ≠ designRevision → coi như chưa sync
  - Báo giá, HĐ, phiếu thu, LSX → nếu `quoteDesignRevision ≠ designRevision` → không hợp lệ
- [x] Status tự revert xuống bước phù hợp nhất (computeProjectStatus priority chain)

### Bước 8.3: Lịch sử chứng từ + Badge ✅
- [x] `staleDocuments: StaleDocumentType[]` thêm vào StatusResult — liệt kê chứng từ mất hiệu lực
- [x] StaleBadge component — hiển "⚠ Phiên bản cũ" với tooltip chi tiết
- [x] Chứng từ cũ (revision mismatch) vẫn lưu, status revert cho phép tạo mới

### Bước 8.4: Tests ✅
- [x] 15 unit tests: staleDocuments field, cascade in_production→designing, re-create flow, edge cases
- [x] Full suite: 51 suites, 1452 tests — tất cả pass

---

## Thứ tự triển khai đề xuất

```
P1 (UI + data) ──→ P2 (auto-compute) ──→ P8 (revision) ──→ P3 (Báo giá)
                                                              ↓
                                                          P4 (Hợp đồng)
                                                              ↓
                                                          P5 (Phiếu thu)
                                                              ↓
                                                          P6 (Lệnh SX)
                                                              ↓
                                                          P7 (Khóa)
```

> **P8 nên làm sớm** (sau P2, trước P3) vì revision tracking là nền tảng cho tất cả
> các phase liên kết cross-module. Nếu để sau sẽ phải refactor lại data model.

---

## Tiến độ

| Phase | Status | Ngày bắt đầu | Ngày hoàn thành | Ghi chú |
|-------|--------|--------------|-----------------|---------|
| P1 | ✅ Hoàn thành | 2026-03-20 | 2026-03-20 | 15 tests |
| P2 | ✅ Hoàn thành | 2026-03-20 | 2026-03-20 | 15 tests |
| P3 | ✅ Hoàn thành | 2026-03-20 | 2026-03-20 | 13 tests |
| P4 | ✅ Hoàn thành | 2026-03-20 | 2026-03-20 | 13 tests |
| P5 | ✅ Hoàn thành | 2026-03-20 | 2026-03-20 | 12 tests |
| P6 | ✅ Hoàn thành | 2026-03-20 | 2026-03-20 | 10 tests |
| P7 | ✅ Hoàn thành | 2026-03-21 | 2026-03-21 | 23 tests |
| P8 | ✅ Hoàn thành | 2026-03-21 | 2026-03-21 | 15 tests |

> **Tất cả 8 Phase hoàn thành**: 51 suites, 1452 tests — ALL PASSING

---

## Lịch sử cập nhật

| Ngày | Nội dung |
|------|----------|
| 2026-03-20 | Tạo ROADMAP v1.0 |
| 2026-03-20 | Phase 1-6 hoàn thành |
| 2026-03-21 | Phase 7-8 hoàn thành. Toàn bộ ROADMAP complete |
