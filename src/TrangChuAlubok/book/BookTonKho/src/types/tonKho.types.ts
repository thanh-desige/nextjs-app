// ============================================================
// BookTonKho — Types
// Stock Receipt (Phiếu nhập kho) + Stock Issue (Phiếu xuất kho)
// Stock Transfer (Chuyển kho) + Stock Audit (Kiểm kê) + Balance
// ============================================================

// ── Stock Voucher Status Workflow ────────────────────────────
// draft → confirmed → (done)
//       → cancelled

export type StockVoucherStatus = 'draft' | 'confirmed' | 'cancelled';

export const VOUCHER_STATUS_LABELS: Record<StockVoucherStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  cancelled: 'Hủy',
};

export const VOUCHER_STATUS_COLORS: Record<StockVoucherStatus, string> = {
  draft: '#6c7086',
  confirmed: '#a6e3a1',
  cancelled: '#585b70',
};

// ── Voucher Type ─────────────────────────────────────────────

export type VoucherType = 'receipt' | 'issue' | 'transfer';

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  receipt: 'Nhập kho',
  issue: 'Xuất kho',
  transfer: 'Chuyển kho',
};

// ── Stock Item (line item in a voucher) ──────────────────────

export interface StockItem {
  itemId: string;
  description: string;
  sku?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number; // quantity * unitPrice
}

// ── Stock Receipt (Phiếu nhập kho) ──────────────────────────

export interface StockReceipt {
  receiptId: string;
  receiptCode: string; // PNK-0001
  warehouseId: string;
  warehouseName: string;
  supplierId?: string;
  supplierName?: string;
  poCode?: string; // Từ đơn mua DMH-XXXX
  items: StockItem[];
  totalAmount: number;
  notes?: string;
  status: StockVoucherStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  receivedAt?: string;            // Thời điểm thực nhận hàng
}

// ── Stock Issue (Phiếu xuất kho) ─────────────────────────────

export interface StockIssue {
  issueId: string;
  issueCode: string; // PXK-0001
  warehouseId: string;
  warehouseName: string;
  customerId?: string;
  customerName?: string;
  soCode?: string; // Từ đơn bán DH-XXXX
  items: StockItem[];
  totalAmount: number;
  notes?: string;
  status: StockVoucherStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

// ── Stock Transfer (Phiếu chuyển kho) ────────────────────────

export interface StockTransfer {
  transferId: string;
  transferCode: string; // PCK-0001
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  items: StockItem[];
  totalAmount: number;
  notes?: string;
  status: StockVoucherStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

// ── Inventory Balance (Tồn kho) ──────────────────────────────

export interface InventoryBalance {
  itemKey: string; // unique: `${warehouseId}:${sku}`
  sku: string;
  description: string;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  unitCost: number;
  totalValue: number; // quantityOnHand * unitCost
  minStock?: number;
}

// ── Tab type ─────────────────────────────────────────────────

export type TonKhoTab = 'receipts' | 'issues' | 'transfers' | 'balance' | 'reports';

// ── View mode ────────────────────────────────────────────────

export type ViewMode = 'list' | 'form' | 'detail';

// ── Helper: calculate stock item amount ──────────────────────

export function calcStockItemAmount(qty: number, price: number): number {
  return qty * price;
}

// ── Helper: sum total from items ─────────────────────────────

export function calcVoucherTotal(items: StockItem[]): number {
  return items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
}
