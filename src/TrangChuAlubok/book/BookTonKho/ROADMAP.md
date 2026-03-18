# BookTonKho/ — ROADMAP

> B10-B14: 5 resources quản lý kho — nhập/xuất/chuyển/kiểm kê/tồn
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase B3 hoàn chỉnh — 29 tests, 2 suites, 18 source files

## Ưu tiên: ✅ Hoàn thành

## Phụ thuộc: shared/, DanhMuc/

---

## Phạm vi

| Catalog | Resource | Mô tả |
|---------|----------|-------|
| B10 | `inventory.stock_receipt` | Phiếu nhập kho |
| B11 | `inventory.stock_issue` | Phiếu xuất kho |
| B12 | `inventory.stock_transfer` | Phiếu chuyển kho |
| B13 | `inventory.stock_audit` | Kiểm kê |
| B14 | `inventory.balance` | Tồn kho hiện tại (read-only) |
| C7 | `report.inventory` | Báo cáo tồn kho |

---

## Luồng nghiệp vụ

```
Mua hàng (PO confirm) → Nhập kho (stock_receipt) → Tồn kho (balance)
Bán hàng (SO confirm) → Xuất kho (stock_issue) → Tồn kho giảm
Chuyển kho (transfer): Kho A → Kho B
Kiểm kê (audit): so sánh tồn thực tế vs hệ thống
```

---

## Checklist

- [x] Phiếu nhập kho CRUD + confirm/cancel (StockReceiptList/Form/Detail)
- [x] Phiếu xuất kho CRUD + confirm/cancel (StockIssueList/Form/Detail)
- [x] Phiếu chuyển kho CRUD + confirm/cancel (StockTransferList/Form/Detail)
- [x] Tồn kho real-time (tự động tính từ phiếu confirmed — InventoryBalancePage)
- [x] SKU management (trong line items)
- [x] Reports: báo cáo tồn kho xuất nhập tồn (InventoryReport)
- [x] Types: StockVoucherStatus, VoucherType, StockItem, StockReceipt/Issue/Transfer, InventoryBalance
- [x] Store: Zustand + persist, full CRUD, seed data (3 receipts + 2 issues + 1 transfer)
- [x] Tests: 29 tests (10 types + 19 store), 2 suites — ALL PASS
- [x] Integration: routeConfig (5 tabs), App.tsx, barrel export
- [ ] Kiểm kê (so sánh + điều chỉnh) — future
- [ ] Cảnh báo tồn kho tối thiểu — future
- [ ] Permission: `inventory.stock_receipt:confirm`, `inventory.stock_audit:confirm`... — future
