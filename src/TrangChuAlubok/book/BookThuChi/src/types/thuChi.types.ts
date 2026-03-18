// ============================================================
// BookThuChi — Types
// Cash Receipt (Phiếu thu) + Cash Payment (Phiếu chi)
// Accounts Receivable (Công nợ phải thu) + Accounts Payable (Công nợ phải trả)
// ============================================================

// ── Finance Voucher Status Workflow ──────────────────────────
// draft → confirmed → (done)
//       → cancelled

export type FinanceVoucherStatus = 'draft' | 'confirmed' | 'cancelled';

export const FINANCE_STATUS_LABELS: Record<FinanceVoucherStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  cancelled: 'Hủy',
};

export const FINANCE_STATUS_COLORS: Record<FinanceVoucherStatus, string> = {
  draft: '#6c7086',
  confirmed: '#a6e3a1',
  cancelled: '#585b70',
};

// ── Payment Method ───────────────────────────────────────────

export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'other';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  check: 'Séc',
  other: 'Khác',
};

// ── Debt Status ──────────────────────────────────────────────

export type DebtStatus = 'open' | 'partial' | 'paid' | 'overdue';

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  open: 'Chưa thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
};

export const DEBT_STATUS_COLORS: Record<DebtStatus, string> = {
  open: '#89b4fa',
  partial: '#f9e2af',
  paid: '#a6e3a1',
  overdue: '#f38ba8',
};

// ── Cash Receipt (Phiếu thu — B15) ──────────────────────────

export interface CashReceipt {
  receiptId: string;
  receiptCode: string; // PT-0001
  customerId: string;
  customerName: string;
  soCode?: string; // Từ đơn bán DH-XXXX
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccount?: string;
  description: string;
  notes?: string;
  status: FinanceVoucherStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

// ── Cash Payment (Phiếu chi — B16) ──────────────────────────

export interface CashPayment {
  paymentId: string;
  paymentCode: string; // PC-0001
  supplierId: string;
  supplierName: string;
  poCode?: string; // Từ đơn mua DMH-XXXX
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccount?: string;
  description: string;
  notes?: string;
  status: FinanceVoucherStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

// ── Accounts Receivable (Công nợ phải thu — B17) ─────────────

export interface AccountReceivable {
  arId: string;
  customerId: string;
  customerName: string;
  soCode: string; // Đơn bán DH-XXXX
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number; // totalAmount - paidAmount
  dueDate: string;
  status: DebtStatus;
  lastPaymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Accounts Payable (Công nợ phải trả — B18) ────────────────

export interface AccountPayable {
  apId: string;
  supplierId: string;
  supplierName: string;
  poCode: string; // Đơn mua DMH-XXXX
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number; // totalAmount - paidAmount
  dueDate: string;
  status: DebtStatus;
  lastPaymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Tab type ─────────────────────────────────────────────────

export type ThuChiTab = 'receipts' | 'payments' | 'ar' | 'ap' | 'debt-report' | 'cashflow-report';

// ── View mode ────────────────────────────────────────────────

export type ThuChiViewMode = 'list' | 'form' | 'detail';

// ── Helpers ──────────────────────────────────────────────────

export function calcDebtStatus(totalAmount: number, paidAmount: number, dueDate: string): DebtStatus {
  if (paidAmount >= totalAmount) return 'paid';
  if (new Date(dueDate) < new Date() && paidAmount < totalAmount) return 'overdue';
  if (paidAmount > 0) return 'partial';
  return 'open';
}

export function calcRemainingAmount(totalAmount: number, paidAmount: number): number {
  return totalAmount - paidAmount;
}
