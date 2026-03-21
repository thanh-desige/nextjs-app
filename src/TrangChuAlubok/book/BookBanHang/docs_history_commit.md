# 📋 BookBanHang/ — Lịch sử hoàn thành

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Module: BookBanHang/ — Báo giá + Đơn bán hàng (B6-B7)

---

## Phase B1: Báo giá + Đơn bán hàng — Core UI

### B1.0: Types + Helpers
- `banHang.types.ts`: QuoteStatus (6), SalesOrderStatus (5), QuoteItem, Quote, SalesOrderItem, SalesOrder
- Status labels/colors constants, BanHangTab, ViewMode types
- `calcLineAmount()`, `calcTotals()` helper functions
- Barrel: `types/index.ts`

### B1.1: Store
- `banHangStore.ts`: Zustand + persist (key: `alubok-ban-hang`)
- Seed data: 3 quotes (BG-0001/0002/0003), 1 order (DH-0001)
- CRUD: add/update/delete for both quotes and orders, resetAll

### B1.2: BookBanHangPage.tsx
- Level-2 sidebar: 4 tabs in 2 groups (Nghiệp vụ, Báo cáo)
- Internal navigation: quoteView/orderView (list/form/detail) + selectedId

### B1.3: Quote UI (3 files)
- `QuoteList.tsx`: Table + search + status filter + summary
- `QuoteForm.tsx`: Create/edit with line items, auto recalculation
- `QuoteDetail.tsx`: View + approval workflow (gửi duyệt, duyệt, từ chối with reason) + convert to SalesOrder

### B1.4: Sales Order UI (3 files)
- `SalesOrderList.tsx`: Table + search + status filter
- `SalesOrderForm.tsx`: Create/edit with line items
- `SalesOrderDetail.tsx`: View + status transitions + delivery/payment tracking

### B1.5: Reports (2 files)
- `QuoteReport.tsx`: Summary cards + status breakdown
- `SalesReport.tsx`: Revenue + payment + delivery progress

### B1.6: Integration
- Barrel `index.ts`, App.tsx integration (page === 3)

### B1.7: Tests — 26 tests, 2 suites
- `banHangTypes.test.ts`: 16 tests (status labels/colors, calcLineAmount, calcTotals)
- `banHangStore.test.ts`: 10 tests (initial state, Quote CRUD, SalesOrder CRUD, resetAll)

**Tổng: 15 files (13 source + 2 test), 26 tests pass**

---

## Phase B2: Liên kết TKBT → Báo giá (Phase 3 Quy trình)

- **Quote type mở rộng**: Thêm `projectId?: string`, `designRevision?: number` vào Quote interface
- **Được gọi từ**: `BookThietKeBocTach/domain/createQuoteFromProject.ts` — BOM→Quote auto-conversion
- **Liên kết 2 chiều**: Quote có `projectId` + `designRevision`, ProjectInfo có `quoteId` + `quoteCode` + `quoteDesignRevision`

## Phase B3: Hợp đồng (Phase 4 Quy trình)

- **Contract types**: Contract interface + ContractStatus (draft|signed|completed|cancelled), labels, colors
- **BanHangTab**: Thêm 'contracts', routeConfig thêm tab 'Hợp đồng' (group Nghiệp vụ)
- **Store**: contracts[], addContract, updateContract, deleteContract trong banHangStore
- **ContractList.tsx**: Bảng danh sách, search, filter status, summary
- **BookBanHangPage**: Thêm case 'contracts' trong renderContent()
- **Được gọi từ**: `BookThietKeBocTach/domain/createContractFromQuote.ts` — Quote→Contract auto-conversion
