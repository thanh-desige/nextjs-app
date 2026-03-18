// ============================================================
// TonKho Store — Zustand + persist
// Stock Receipts + Stock Issues + Stock Transfers CRUD
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockReceipt, StockIssue, StockTransfer } from '../types';
import { logActivityDirect } from '../../../shared/src/hooks/useLogActivity';

// ── Seed Receipts ────────────────────────────────────────────

const SEED_RECEIPTS: StockReceipt[] = [
  {
    receiptId: 'rc-001',
    receiptCode: 'PNK-0001',
    warehouseId: 'wh-01',
    warehouseName: 'Kho ALUBOK - KCN Tân Bình',
    supplierId: 'sup-001',
    supplierName: 'Công ty TNHH Nhôm Xingfa Việt Nam',
    poCode: 'DMH-0001',
    items: [
      { itemId: 'ri-001', description: 'Thanh nhôm Xingfa 55 series', sku: 'NH-XF55', unit: 'cây', quantity: 120, unitPrice: 340_000, amount: 40_800_000 },
      { itemId: 'ri-002', description: 'Phụ kiện bản lề 4D', sku: 'PK-BL4D', unit: 'bộ', quantity: 100, unitPrice: 115_000, amount: 11_500_000 },
    ],
    totalAmount: 52_300_000,
    status: 'confirmed',
    createdBy: 'Nguyễn Văn An',
    createdAt: '2026-03-16T08:00:00Z',
    updatedAt: '2026-03-16T10:00:00Z',
    confirmedBy: 'Trần Văn Bình',
    confirmedAt: '2026-03-16T10:00:00Z',
  },
  {
    receiptId: 'rc-002',
    receiptCode: 'PNK-0002',
    warehouseId: 'wh-01',
    warehouseName: 'Kho ALUBOK - KCN Tân Bình',
    supplierId: 'sup-002',
    supplierName: 'Công ty CP Kính Việt Nhật',
    items: [
      { itemId: 'ri-003', description: 'Kính hộp 2 lớp 5+9A+5 Low-E', sku: 'KH-LE59', unit: 'm²', quantity: 80, unitPrice: 470_000, amount: 37_600_000 },
      { itemId: 'ri-004', description: 'Kính cường lực 12mm', sku: 'KCL-12', unit: 'm²', quantity: 40, unitPrice: 350_000, amount: 14_000_000 },
    ],
    totalAmount: 51_600_000,
    status: 'confirmed',
    createdBy: 'Lê Thị Hạnh',
    createdAt: '2026-03-17T09:00:00Z',
    updatedAt: '2026-03-17T14:00:00Z',
    confirmedBy: 'Trần Văn Bình',
    confirmedAt: '2026-03-17T14:00:00Z',
  },
  {
    receiptId: 'rc-003',
    receiptCode: 'PNK-0003',
    warehouseId: 'wh-02',
    warehouseName: 'Kho phụ kiện Q.12',
    supplierId: 'sup-003',
    supplierName: 'Công ty Phụ kiện Nhôm Kính Hùng Phát',
    items: [
      { itemId: 'ri-005', description: 'Tay nắm cửa sổ mở quay', sku: 'PK-TN01', unit: 'cái', quantity: 50, unitPrice: 85_000, amount: 4_250_000 },
      { itemId: 'ri-006', description: 'Gioăng EPDM cao su', sku: 'PK-GE01', unit: 'm', quantity: 300, unitPrice: 12_000, amount: 3_600_000 },
    ],
    totalAmount: 7_850_000,
    notes: 'Hàng bổ sung quý 2',
    status: 'draft',
    createdBy: 'Phạm Minh Tuấn',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
  },
];

// ── Seed Issues ──────────────────────────────────────────────

const SEED_ISSUES: StockIssue[] = [
  {
    issueId: 'is-001',
    issueCode: 'PXK-0001',
    warehouseId: 'wh-01',
    warehouseName: 'Kho ALUBOK - KCN Tân Bình',
    customerId: 'cust-1',
    customerName: 'Công ty TNHH Xây Dựng ABC',
    soCode: 'DH-0001',
    items: [
      { itemId: 'ii-001', description: 'Thanh nhôm Xingfa 55 series', sku: 'NH-XF55', unit: 'cây', quantity: 40, unitPrice: 340_000, amount: 13_600_000 },
      { itemId: 'ii-002', description: 'Kính hộp 2 lớp 5+9A+5 Low-E', sku: 'KH-LE59', unit: 'm²', quantity: 30, unitPrice: 470_000, amount: 14_100_000 },
    ],
    totalAmount: 27_700_000,
    status: 'confirmed',
    createdBy: 'Nguyễn Văn An',
    createdAt: '2026-03-18T08:00:00Z',
    updatedAt: '2026-03-18T09:00:00Z',
    confirmedBy: 'Trần Văn Bình',
    confirmedAt: '2026-03-18T09:00:00Z',
  },
  {
    issueId: 'is-002',
    issueCode: 'PXK-0002',
    warehouseId: 'wh-01',
    warehouseName: 'Kho ALUBOK - KCN Tân Bình',
    customerName: 'Anh Nguyễn Văn Minh',
    items: [
      { itemId: 'ii-003', description: 'Kính cường lực 12mm', sku: 'KCL-12', unit: 'm²', quantity: 10, unitPrice: 350_000, amount: 3_500_000 },
    ],
    totalAmount: 3_500_000,
    status: 'draft',
    createdBy: 'Lê Thị Hạnh',
    createdAt: '2026-03-21T14:00:00Z',
    updatedAt: '2026-03-21T14:00:00Z',
  },
];

// ── Seed Transfers ───────────────────────────────────────────

const SEED_TRANSFERS: StockTransfer[] = [
  {
    transferId: 'tf-001',
    transferCode: 'PCK-0001',
    fromWarehouseId: 'wh-01',
    fromWarehouseName: 'Kho ALUBOK - KCN Tân Bình',
    toWarehouseId: 'wh-02',
    toWarehouseName: 'Kho phụ kiện Q.12',
    items: [
      { itemId: 'ti-001', description: 'Phụ kiện bản lề 4D', sku: 'PK-BL4D', unit: 'bộ', quantity: 20, unitPrice: 115_000, amount: 2_300_000 },
    ],
    totalAmount: 2_300_000,
    notes: 'Chuyển phụ kiện cho kho Q.12',
    status: 'draft',
    createdBy: 'Phạm Minh Tuấn',
    createdAt: '2026-03-22T08:00:00Z',
    updatedAt: '2026-03-22T08:00:00Z',
  },
];

// ── Store Interface ──────────────────────────────────────────

interface TonKhoState {
  receipts: StockReceipt[];
  issues: StockIssue[];
  transfers: StockTransfer[];
  // Receipt CRUD
  setReceipts: (r: StockReceipt[]) => void;
  addReceipt: (r: StockReceipt) => void;
  updateReceipt: (receiptId: string, patch: Partial<StockReceipt>) => void;
  deleteReceipt: (receiptId: string) => void;
  // Issue CRUD
  setIssues: (i: StockIssue[]) => void;
  addIssue: (i: StockIssue) => void;
  updateIssue: (issueId: string, patch: Partial<StockIssue>) => void;
  deleteIssue: (issueId: string) => void;
  // Transfer CRUD
  setTransfers: (t: StockTransfer[]) => void;
  addTransfer: (t: StockTransfer) => void;
  updateTransfer: (transferId: string, patch: Partial<StockTransfer>) => void;
  deleteTransfer: (transferId: string) => void;
  // Utils
  resetAll: () => void;
}

const INITIAL_STATE = {
  receipts: SEED_RECEIPTS,
  issues: SEED_ISSUES,
  transfers: SEED_TRANSFERS,
};

export const useTonKhoStore = create<TonKhoState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // Receipt
      setReceipts: (receipts) => set({ receipts }),
      addReceipt: (r) => {
        set((s) => ({ receipts: [...s.receipts, r] }));
        logActivityDirect('TonKho', 'create', 'stockReceipt', r.receiptId, r.receiptCode, `Tạo phiếu nhập kho ${r.receiptCode}`);
      },
      updateReceipt: (receiptId, patch) => {
        const code = get().receipts.find(r => r.receiptId === receiptId)?.receiptCode ?? receiptId;
        set((s) => ({
          receipts: s.receipts.map(r => r.receiptId === receiptId ? { ...r, ...patch } : r),
        }));
        logActivityDirect('TonKho', 'update', 'stockReceipt', receiptId, code, `Cập nhật PNK ${code}`);
      },
      deleteReceipt: (receiptId) => {
        const code = get().receipts.find(r => r.receiptId === receiptId)?.receiptCode ?? receiptId;
        set((s) => ({
          receipts: s.receipts.filter(r => r.receiptId !== receiptId),
        }));
        logActivityDirect('TonKho', 'delete', 'stockReceipt', receiptId, code, `Xóa PNK ${code}`);
      },

      // Issue
      setIssues: (issues) => set({ issues }),
      addIssue: (i) => {
        set((s) => ({ issues: [...s.issues, i] }));
        logActivityDirect('TonKho', 'create', 'stockIssue', i.issueId, i.issueCode, `Tạo phiếu xuất kho ${i.issueCode}`);
      },
      updateIssue: (issueId, patch) => {
        const code = get().issues.find(i => i.issueId === issueId)?.issueCode ?? issueId;
        set((s) => ({
          issues: s.issues.map(i => i.issueId === issueId ? { ...i, ...patch } : i),
        }));
        logActivityDirect('TonKho', 'update', 'stockIssue', issueId, code, `Cập nhật PXK ${code}`);
      },
      deleteIssue: (issueId) => {
        const code = get().issues.find(i => i.issueId === issueId)?.issueCode ?? issueId;
        set((s) => ({
          issues: s.issues.filter(i => i.issueId !== issueId),
        }));
        logActivityDirect('TonKho', 'delete', 'stockIssue', issueId, code, `Xóa PXK ${code}`);
      },

      // Transfer
      setTransfers: (transfers) => set({ transfers }),
      addTransfer: (t) => {
        set((s) => ({ transfers: [...s.transfers, t] }));
        logActivityDirect('TonKho', 'create', 'stockTransfer', t.transferId, t.transferCode, `Tạo phiếu chuyển kho ${t.transferCode}`);
      },
      updateTransfer: (transferId, patch) => {
        const code = get().transfers.find(t => t.transferId === transferId)?.transferCode ?? transferId;
        set((s) => ({
          transfers: s.transfers.map(t => t.transferId === transferId ? { ...t, ...patch } : t),
        }));
        logActivityDirect('TonKho', 'update', 'stockTransfer', transferId, code, `Cập nhật PCK ${code}`);
      },
      deleteTransfer: (transferId) => {
        const code = get().transfers.find(t => t.transferId === transferId)?.transferCode ?? transferId;
        set((s) => ({
          transfers: s.transfers.filter(t => t.transferId !== transferId),
        }));
        logActivityDirect('TonKho', 'delete', 'stockTransfer', transferId, code, `Xóa PCK ${code}`);
      },

      resetAll: () => set(INITIAL_STATE),
    }),
    { name: 'alubok-ton-kho' },
  ),
);
