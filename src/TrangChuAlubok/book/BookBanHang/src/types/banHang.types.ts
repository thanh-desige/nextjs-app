// ============================================================
// BookBanHang — Types
// Quote (Báo giá) + Contract (Hợp đồng) + Sales Order (Đơn bán hàng)
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
  /** Liên kết dự án thiết kế (Phase 3) */
  projectId?: string;
  /** designRevision tại thời điểm tạo/cập nhật báo giá */
  designRevision?: number;
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
  cancelledAt?: string;
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
  completedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

// ── Contract Status Workflow ─────────────────────────────────
// draft → signed → completed
//      → cancelled

export type ContractStatus = 'draft' | 'signed' | 'completed' | 'cancelled';

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Nháp',
  signed: 'Đã ký',
  completed: 'Hoàn thành',
  cancelled: 'Hủy',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: '#6c7086',      // gray
  signed: '#a6e3a1',     // green
  completed: '#89b4fa',  // blue
  cancelled: '#585b70',  // dark gray
};

// ── Contract ─────────────────────────────────────────────────

export interface Contract {
  contractId: string;
  contractCode: string; // HD-0001, HD-0002...
  quoteId: string;
  quoteCode: string;
  customerId: string;
  customerName: string;
  projectName?: string;
  /** Liên kết dự án thiết kế */
  projectId?: string;
  /** designRevision tại thời điểm tạo hợp đồng */
  designRevision?: number;
  items: QuoteItem[]; // Reuse QuoteItem for contract line items
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalDiscount: number;
  totalAmount: number;
  depositPercent: number;  // % tạm ứng
  depositAmount: number;
  notes?: string;
  signedDate?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  warrantyMonths?: number;
  status: ContractStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  signedBy?: string;
  signedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

// ── Tab type ─────────────────────────────────────────────────

export type BanHangTab = 'quotes' | 'orders' | 'contracts' | 'report-quotes' | 'report-sales';

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
