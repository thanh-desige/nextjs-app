# BookThuChi/ — ROADMAP

> B15-B18: Phiếu thu, phiếu chi, công nợ phải thu, công nợ phải trả
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase B4 hoàn chỉnh — 34 tests, 2 suites

## Ưu tiên: ⭐ Trung bình

## Phụ thuộc: shared/, DanhMuc/

---

## Phạm vi

| Catalog | Resource | Mô tả | Trạng thái |
|---------|----------|-------|-----------|
| B15 | `finance.receipt` | Phiếu thu | ✅ |
| B16 | `finance.payment` | Phiếu chi | ✅ |
| B17 | `finance.ar` | Công nợ phải thu (Accounts Receivable) | ✅ |
| B18 | `finance.ap` | Công nợ phải trả (Accounts Payable) | ✅ |
| C8 | `report.debt` | Báo cáo công nợ | ✅ |
| C9 | `report.cashflow` | Báo cáo dòng tiền | ✅ |

---

## Luồng nghiệp vụ

```
Bán hàng (Sales Order) → Công nợ phải thu (AR) → Phiếu thu (Receipt) → Xong
Mua hàng (Purchase Order) → Công nợ phải trả (AP) → Phiếu chi (Payment) → Xong
```

---

## Checklist

- [x] Phiếu thu/chi CRUD + confirm/cancel
- [x] Công nợ phải thu: tracking theo khách hàng + đơn hàng
- [x] Công nợ phải trả: tracking theo NCC + đơn mua
- [x] Đối soát (tiền mặt vs ngân hàng) — breakdown by payment method in CashFlowReport
- [x] Reports: báo cáo công nợ, báo cáo dòng tiền
- [ ] Permission: `finance.receipt:confirm`, `finance.ar:update`... (deferred to integration phase)

---

## Deliverables

### Source files (15 files)

| File | Mô tả |
|------|-------|
| `src/types/thuChi.types.ts` | Domain types: FinanceVoucherStatus, PaymentMethod, DebtStatus, CashReceipt, CashPayment, AccountReceivable, AccountPayable, helpers |
| `src/types/index.ts` | Barrel export types |
| `src/store/thuChiStore.ts` | Zustand + persist (key: alubok-thu-chi), CRUD for 4 entity types, seed data |
| `src/ui/BookThuChiPage.tsx` | Main page, ModuleTabBar (6 tabs), view state routing |
| `src/ui/CashReceiptList.tsx` | Receipt table: search, status filter, 7 columns |
| `src/ui/CashReceiptForm.tsx` | Receipt create/edit form |
| `src/ui/CashReceiptDetail.tsx` | Receipt detail + confirm/cancel workflow |
| `src/ui/CashPaymentList.tsx` | Payment table: search, status filter, 7 columns |
| `src/ui/CashPaymentForm.tsx` | Payment create/edit form |
| `src/ui/CashPaymentDetail.tsx` | Payment detail + confirm/cancel workflow |
| `src/ui/AccountsReceivablePage.tsx` | AR list + detail (read-only tracking, no form) |
| `src/ui/AccountsPayablePage.tsx` | AP list + detail (read-only tracking, no form) |
| `src/ui/DebtReport.tsx` | Debt analytics: StatCards + AR/AP detail tables |
| `src/ui/CashFlowReport.tsx` | Cash flow analytics: inflow/outflow/net + method breakdown |
| `src/index.ts` | Barrel export |

### Test files (2 files, 34 tests)

| File | Tests | Mô tả |
|------|-------|-------|
| `src/tests/thuChiTypes.test.ts` | 13 | Status labels/colors, method labels, calcDebtStatus, calcRemainingAmount |
| `src/tests/thuChiStore.test.ts` | 21 | Initial state (8), Receipt CRUD (4), Payment CRUD (4), AR (2), AP (2), resetAll (1) |

### Modified files

| File | Thay đổi |
|------|----------|
| `navigation/routeConfig.ts` | Page 5 → 6 tabs (receipts, payments, ar, ap, debt-report, cashflow-report) |
| `App.tsx` | Import BookThuChiPage, page 5 overflow hidden, props passed |
