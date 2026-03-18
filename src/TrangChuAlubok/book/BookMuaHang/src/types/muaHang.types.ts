// ============================================================
// BookMuaHang — Types
// Purchase Request (Yêu cầu mua) + Purchase Order (Đơn mua hàng)
// ============================================================

// ── Purchase Request Status Workflow ─────────────────────────
// draft → pending → approved → closed
//                 → rejected → (edit) → pending
//       → cancelled

export type PurchaseRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'closed' | 'cancelled';

export const PR_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  closed: 'Đã đóng',
  cancelled: 'Hủy',
};

export const PR_STATUS_COLORS: Record<PurchaseRequestStatus, string> = {
  draft: '#6c7086',
  pending: '#f9e2af',
  approved: '#a6e3a1',
  rejected: '#f38ba8',
  closed: '#89b4fa',
  cancelled: '#585b70',
};

// ── Purchase Request Item ────────────────────────────────────

export interface PurchaseRequestItem {
  itemId: string;
  description: string;
  unit: string;
  quantity: number;
  estimatedPrice: number;
  estimatedAmount: number; // quantity * estimatedPrice
  bomRef?: string;
  notes?: string;
}

// ── Purchase Request ─────────────────────────────────────────

export interface PurchaseRequest {
  requestId: string;
  requestCode: string; // YCMH-0001
  requestedBy: string;
  department?: string;
  reason: string;
  items: PurchaseRequestItem[];
  totalEstimated: number;
  status: PurchaseRequestStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
}

// ── Purchase Order Status Workflow ───────────────────────────
// new → confirmed → receiving → completed
//     → cancelled

export type PurchaseOrderStatus = 'new' | 'confirmed' | 'receiving' | 'completed' | 'cancelled';

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  new: 'Mới',
  confirmed: 'Xác nhận',
  receiving: 'Đang nhận hàng',
  completed: 'Hoàn thành',
  cancelled: 'Hủy',
};

export const PO_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  new: '#89b4fa',
  confirmed: '#f9e2af',
  receiving: '#fab387',
  completed: '#a6e3a1',
  cancelled: '#585b70',
};

// ── Purchase Order Item ──────────────────────────────────────

export interface PurchaseOrderItem {
  itemId: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  amount: number; // quantity * unitPrice * (1 - discountPercent/100)
  receivedQty: number;
}

// ── Purchase Order ───────────────────────────────────────────

export interface PurchaseOrder {
  orderId: string;
  orderCode: string; // DMH-0001
  requestId?: string;
  requestCode?: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalDiscount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  status: PurchaseOrderStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  completedAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
}

// ── Tab type ─────────────────────────────────────────────────

export type MuaHangTab = 'orders' | 'requests' | 'reports' | 'shop';

// ── View mode ────────────────────────────────────────────────

export type ViewMode = 'list' | 'form' | 'detail';

// ── Priority ─────────────────────────────────────────────────

export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: '#6c7086',
  normal: '#89b4fa',
  high: '#fab387',
  urgent: '#f38ba8',
};

// ── Helper: calculate line amount ────────────────────────────

export function calcLineAmount(qty: number, price: number, discountPercent: number): number {
  return qty * price * (1 - discountPercent / 100);
}

// ── Helper: calculate order totals ───────────────────────────

export function calcTotals(items: PurchaseOrderItem[], taxRate: number): {
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

// ── Helper: calculate request total ──────────────────────────

export function calcRequestTotal(items: PurchaseRequestItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.estimatedPrice, 0);
}
