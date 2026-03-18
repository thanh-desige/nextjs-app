# 📋 BookKeToan/ — Lịch sử hoàn thành

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Module: BookKeToan/ — Chứng từ kế toán, hóa đơn (B19-B20)

---

## Phase C2: BookKeToan — Kế toán (18/03/2026)

### C2.0: Types (keToan.types.ts)
- VoucherStatus (draft/approved/rejected/closed) + labels + colors
- InvoiceStatus (draft/approved/cancelled) + labels + colors
- VoucherType (receipt/payment/journal/adjustment) + labels
- AccountEntry, AccountingVoucher, InvoiceItem, AccountingInvoice interfaces
- KeToanTab, KeToanViewMode, LedgerEntry types
- Helpers: isVoucherBalanced(), calcEntryTotals(), calcInvoiceTotal()

### C2.1: Store (keToanStore.ts)
- Zustand + persist (key: alubok-ke-toan)
- Seed data: 4 vouchers (2 approved, 2 draft), 3 invoices (1 approved, 1 draft, 1 cancelled)
- CRUD: set/add/update/delete for Voucher + Invoice
- resetAll()

### C2.2: BookKeToanPage (4 tabs)
- Main page with ModuleTabBar
- 4 tabs: vouchers, invoices, ledger, reports
- Internal view state per entity type (list/form/detail)

### C2.3: Voucher UI (List + Form + Detail)
- VoucherList: search, status filter, 8-column table (code, type, date, description, debit, credit, source, status)
- VoucherForm: type selector, date, description, debit/credit entry table, balance check
- VoucherDetail: info grid + entries table + approve/reject/close/edit/delete workflow

### C2.4: Invoice UI (List + Form + Detail)
- InvoiceList: search, status filter, 9-column table (code, customer, MST, SO, date, subtotal, VAT, total, status)
- InvoiceForm: customer info, items table, VAT rate selector, totals summary
- InvoiceDetail: customer info + items table + totals + approve/cancel/edit/delete

### C2.5: LedgerPage (Sổ cái + Sổ nhật ký)
- General Ledger: account filter, running balance, 8-column table from approved vouchers
- Journal: grouped by voucher, debit/credit entries per voucher

### C2.6: AccountingReport
- StatCards: total debit/credit (approved), invoice revenue, total VAT
- Summary: voucher/invoice counts by status
- Breakdown by voucher type table
- Full voucher + invoice lists with status badges

### C2.7: Integration (barrel + route + sidebar + App)
- Created index.ts barrel export
- Updated routeConfig.ts: page 9 → 4 tabs with defaultTab: 'vouchers'
- Updated Sidebar.tsx: added IconKeToan + menu item { id: 9, name: 'Kế toán' }
- Updated App.tsx: BookKeToanPage import, page 9 overflow hidden, props passed

### C2.8: Tests (31 tests, 2 suites)
- keToanTypes.test.ts: 14 tests (status labels/colors, type labels, isVoucherBalanced, calcEntryTotals, calcInvoiceTotal)
- keToanStore.test.ts: 17 tests (initial state 8, voucher CRUD 4, invoice CRUD 4, resetAll 1)
- Full suite: 1189 tests, 38 suites — ALL PASS
