// ============================================================
// BookKeToan — Domain Types
// B19: accounting.voucher, B20: accounting.invoice
// ============================================================

// ── Voucher Status ──────────────────────────────────────────

export type VoucherStatus = 'draft' | 'approved' | 'rejected' | 'closed';

export const VOUCHER_STATUS_LABELS: Record<VoucherStatus, string> = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  closed: 'Đã khóa',
};

export const VOUCHER_STATUS_COLORS: Record<VoucherStatus, string> = {
  draft: '#9399b2',      // overlay2
  approved: '#a6e3a1',   // green
  rejected: '#f38ba8',   // red
  closed: '#6c7086',     // overlay0
};

// ── Invoice Status ──────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'approved' | 'cancelled';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  cancelled: 'Đã hủy',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: '#9399b2',      // overlay2
  approved: '#a6e3a1',   // green
  cancelled: '#f38ba8',  // red
};

// ── Voucher Type ────────────────────────────────────────────

export type VoucherType = 'receipt' | 'payment' | 'journal' | 'adjustment';

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  receipt: 'Thu tiền',
  payment: 'Chi tiền',
  journal: 'Bút toán',
  adjustment: 'Điều chỉnh',
};

// ── Account Entry (debit/credit line) ───────────────────────

export interface AccountEntry {
  entryId: string;
  accountCode: string;     // e.g. "111", "131", "511"
  accountName: string;     // e.g. "Tiền mặt", "Phải thu khách hàng"
  debitAmount: number;
  creditAmount: number;
  description: string;
}

// ── Accounting Voucher (Chứng từ kế toán) ───────────────────

export interface AccountingVoucher {
  voucherId: string;
  voucherCode: string;       // CT-XXXX
  voucherType: VoucherType;
  date: string;              // ISO date
  description: string;
  entries: AccountEntry[];
  totalDebit: number;
  totalCredit: number;
  status: VoucherStatus;
  sourceModule?: string;     // e.g. "BookThuChi", "BookBanHang"
  sourceCode?: string;       // e.g. "PT-0001" (phiếu thu reference)
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  closedBy?: string;
  closedAt?: string;
  postedAt?: string;           // Thời điểm ghi sổ
}

// ── Invoice Item ────────────────────────────────────────────

export interface InvoiceItem {
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;           // quantity × unitPrice
}

// ── Accounting Invoice (Hóa đơn) ───────────────────────────

export interface AccountingInvoice {
  invoiceId: string;
  invoiceCode: string;       // HD-XXXX
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerTaxCode?: string;
  soCode?: string;           // Sales Order reference
  date: string;              // ISO date
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;           // e.g. 0.08 for 8%
  vatAmount: number;
  total: number;             // subtotal + vatAmount
  status: InvoiceStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  paidAt?: string;             // Thời điểm thanh toán
}

// ── Tab / View ──────────────────────────────────────────────

export type KeToanTab = 'vouchers' | 'invoices' | 'ledger' | 'reports';
export type KeToanViewMode = 'list' | 'form' | 'detail';

// ── Ledger Entry (Sổ cái) ──────────────────────────────────

export interface LedgerEntry {
  date: string;
  voucherCode: string;
  description: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
}

// ── Helper functions ────────────────────────────────────────

/** Check if voucher is balanced (total debit === total credit) */
export function isVoucherBalanced(voucher: AccountingVoucher): boolean {
  return Math.abs(voucher.totalDebit - voucher.totalCredit) < 0.01;
}

/** Calculate totals from entries */
export function calcEntryTotals(entries: AccountEntry[]): { totalDebit: number; totalCredit: number } {
  return entries.reduce(
    (acc, e) => ({
      totalDebit: acc.totalDebit + e.debitAmount,
      totalCredit: acc.totalCredit + e.creditAmount,
    }),
    { totalDebit: 0, totalCredit: 0 }
  );
}

/** Calculate invoice total from items + VAT */
export function calcInvoiceTotal(items: InvoiceItem[], vatRate: number): { subtotal: number; vatAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
}
