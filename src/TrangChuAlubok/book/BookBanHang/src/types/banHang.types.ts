// ============================================================
// BookBanHang — Types
// Quote (Báo giá) + Sales Order (Đơn bán hàng)
// ============================================================

// ── Quote Status Workflow ────────────────────────────────────
// draft → pending → approved → closed
//                 → rejected → (edit) → pending
//       → cancelled

export type QuoteStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'closed' | 'cancelled';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  closed: 'Đã đóng',
  cancelled: 'Hủy',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: '#6c7086',      // gray
  pending: '#f9e2af',    // yellow
  approved: '#a6e3a1',   // green
  rejected: '#f38ba8',   // red
  closed: '#89b4fa',     // blue
  cancelled: '#585b70',  // dark gray
};

// ── Quote Item ───────────────────────────────────────────────

export interface QuoteItem {
  itemId: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  amount: number; // quantity * unitPrice * (1 - discountPercent/100)
  bomRef?: string;
  notes?: string;
}

// ── Quote ────────────────────────────────────────────────────

export interface Quote {
  quoteId: string;
  quoteCode: string; // BG-0001, BG-0002...
  customerId: string;
  customerName: string;
  projectName?: string;
  projectRef?: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalDiscount: number;
  totalAmount: number;
  notes?: string;
  validUntil: string; // ISO date
  status: QuoteStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
}

// ── Sales Order Status Workflow ──────────────────────────────
// new → confirmed → delivering → completed
//     → cancelled

export type SalesOrderStatus = 'new' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';

export const SO_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  new: 'Mới',
  confirmed: 'Xác nhận',
  delivering: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Hủy',
};

export const SO_STATUS_COLORS: Record<SalesOrderStatus, string> = {
  new: '#89b4fa',        // blue
  confirmed: '#f9e2af',  // yellow
  delivering: '#fab387', // orange
  completed: '#a6e3a1',  // green
  cancelled: '#585b70',  // dark gray
};

// ── Sales Order Item ─────────────────────────────────────────

export interface SalesOrderItem {
  itemId: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  amount: number;
  deliveredQty: number;
}

// ── Sales Order ──────────────────────────────────────────────

export interface SalesOrder {
  orderId: string;
  orderCode: string; // DH-0001, DH-0002...
  quoteId?: string;
  quoteCode?: string;
  customerId: string;
  customerName: string;
  items: SalesOrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalDiscount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  status: SalesOrderStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

// ── Tab type ─────────────────────────────────────────────────

export type BanHangTab = 'quotes' | 'orders' | 'report-quotes' | 'report-sales';

// ── View mode (for list/form/detail navigation) ──────────────

export type ViewMode = 'list' | 'form' | 'detail';

// ── Helper: calculate line item amount ───────────────────────

export function calcLineAmount(qty: number, price: number, discountPercent: number): number {
  return qty * price * (1 - discountPercent / 100);
}

// ── Helper: calculate quote totals ───────────────────────────

export function calcTotals(items: QuoteItem[], taxRate: number): {
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  totalAmount: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;
  for (const item of items) {
    const gross = item.quantity * item.unitPrice;
    subtotal += gross;
    totalDiscount += gross * item.discountPercent / 100;
  }
  const afterDiscount = subtotal - totalDiscount;
  const taxAmount = afterDiscount * taxRate / 100;
  const totalAmount = afterDiscount + taxAmount;
  return { subtotal, totalDiscount, taxAmount, totalAmount };
}
