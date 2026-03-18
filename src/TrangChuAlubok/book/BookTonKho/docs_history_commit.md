# 📋 BookTonKho/ — Lịch sử hoàn thành

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Module: BookTonKho/ — Nhập/xuất/chuyển kho, kiểm kê (B10-B14)

---

## Phase B3: BookTonKho — Quản lý kho (17/03/2026)

### B3.0: Types
- `types/tonKho.types.ts` — StockVoucherStatus (draft/confirmed/cancelled + labels/colors), VoucherType (receipt/issue/transfer + labels), StockItem, StockReceipt, StockIssue, StockTransfer, InventoryBalance, TonKhoTab, calcStockItemAmount, calcVoucherTotal
- `types/index.ts` — barrel export

### B3.1: Store
- `store/tonKhoStore.ts` — Zustand + persist (key: alubok-ton-kho), seed data (3 receipts PNK-0001~0003, 2 issues PXK-0001~0002, 1 transfer PCK-0001), full CRUD (set/add/update/delete) cho Receipt/Issue/Transfer + resetAll

### B3.2: Main Page
- `ui/BookTonKhoPage.tsx` — Page chính với ModuleTabBar, 5 tabs (receipts/issues/transfers/balance/reports), quản lý view state nội bộ per entity type

### B3.3: Receipt UI
- `ui/StockReceiptList.tsx` — Bảng phiếu nhập kho, search + filter status, 8 cột + vertical borders
- `ui/StockReceiptForm.tsx` — Form tạo/sửa phiếu nhập, kho + NCC + PO + line items (SKU)
- `ui/StockReceiptDetail.tsx` — Chi tiết phiếu nhập + workflow confirm/cancel

### B3.4: Issue + Transfer UI
- `ui/StockIssueList.tsx` — Bảng phiếu xuất kho, customer/SO columns
- `ui/StockIssueForm.tsx` — Form tạo/sửa phiếu xuất, kho + KH + SO + line items
- `ui/StockIssueDetail.tsx` — Chi tiết phiếu xuất + workflow
- `ui/StockTransferList.tsx` — Bảng phiếu chuyển kho, fromWarehouse/toWarehouse
- `ui/StockTransferForm.tsx` — Form tạo/sửa phiếu chuyển, from/to kho + line items
- `ui/StockTransferDetail.tsx` — Chi tiết phiếu chuyển + workflow

### B3.5: Balance + Report
- `ui/InventoryBalancePage.tsx` — Tồn kho tính tự động (confirmed receipts - issues ± transfers), color-coded quantity
- `ui/InventoryReport.tsx` — StatCards (tổng nhập/xuất/chênh lệch), movement details, value breakdown

### B3.6: Integration
- `index.ts` — Barrel export (BookTonKhoPage, useTonKhoStore, types)
- `navigation/routeConfig.ts` — Page 6: 5 tabs (phieu-nhap, phieu-xuat, chuyen-kho, ton-kho-hl, bc-ton-kho)
- `App.tsx` — Import BookTonKhoPage, page 6 overflow hidden, activeTab + onTabChange props

### B3.7: Tests
- `tests/tonKhoTypes.test.ts` — 10 tests: status labels/colors, type labels, calcStockItemAmount (4), calcVoucherTotal (3)
- `tests/tonKhoStore.test.ts` — 19 tests: initial state (6), receipt CRUD (4), issue CRUD (4), transfer CRUD (4), resetAll (1)
- **Kết quả: 29/29 PASS, 2 suites**

### Tổng kết B3
- **18 source files** mới + 2 files sửa (routeConfig.ts, App.tsx)
- **29 tests, 2 suites** — ALL PASS
- **Full suite: 1124 tests, 34 suites** — no regressions
